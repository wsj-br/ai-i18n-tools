#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";

// node:sqlite emits an ExperimentalWarning on every startup even on Node 24+.
// The module is unflagged but not yet formally stable (nodejs/node#57445).
// Node.js installs its own 'warning' listener during bootstrap that writes to
// stderr unconditionally, so we must replace it rather than just add to it.
process.removeAllListeners("warning");
process.on("warning", (w) => {
  if (w.name === "ExperimentalWarning" && w.message.includes("SQLite")) return;
  process.stderr.write(`${w.name}: ${w.message}\n`);
});
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import http from "http";
import { exec, execFile } from "node:child_process";
import chalk from "chalk";
import {
  DEFAULT_CONFIG_FILENAME,
  writeInitConfigFile,
  toDocTranslateConfig,
} from "../core/config.js";
import { documentationFileTrackingKey } from "../core/doc-file-tracking.js";
import { resolveCacheTrackingKeyToAbs } from "../core/cache-tracking-keys.js";
import {
  getDocumentationTargetLocaleCodes,
  resolveLocalesForDocumentation,
  resolveLocalesForSvg,
  resolveLocalesForUI,
} from "../core/ui-languages.js";
import {
  loadConfigOrExit,
  resolveStringsJsonPath,
  hashFileContent,
  resolveTranslatedOutputPath,
  writeAtomicUtf8,
} from "./helpers.js";
import { normalizeLocale } from "../core/config.js";
import { collectFilesByExtension, collectFilesRelativeToRoot } from "./file-utils.js";
import { loadTranslateIgnore, isIgnored } from "../utils/ignore-parser.js";
import { runExtract } from "./extract-strings.js";
import { runTranslate, shouldRunJson, type TranslateRunOptions } from "./doc-translate.js";
import { runTranslateSvg } from "./translate-svg.js";
import { runTranslateUI } from "./translate-ui-strings.js";
import { runExportUIXliff } from "./export-ui-xliff.js";
import { TranslationCache } from "../core/cache.js";
import { setupLogOutput } from "./log-output.js";
import { stripAnsi } from "../utils/logger.js";
import {
  createTranslationEditorApp,
  resolveEditCacheStaticDir,
} from "../server/translation-editor.js";
import type { I18nConfig } from "../core/types.js";

function openBrowser(url: string): void {
  const onErr = (err: Error | null) => {
    if (err) console.warn(`[editor] Failed to open browser: ${err.message}`);
  };
  if (process.platform === "darwin") {
    execFile("open", [url], onErr);
  } else if (process.platform === "win32") {
    execFile("cmd", ["/c", "start", "", url], { windowsHide: true }, onErr);
  } else {
    const browser = process.env.BROWSER;
    if (browser) {
      exec(`${browser} ${JSON.stringify(url)}`, onErr);
    } else {
      execFile("xdg-open", [url], onErr);
    }
  }
}

const pkgPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json");
let version = "0.0.0";
try {
  const raw = fs.readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(raw) as { version?: string };
  if (pkg.version) {
    version = pkg.version;
  }
} catch {
  /* keep default */
}

function filterIgnored(files: string[], cwd: string): string[] {
  const ig = loadTranslateIgnore(".translate-ignore", cwd);
  return files.filter((f) => !isIgnored(ig, path.join(cwd, f), cwd));
}

function withConfig(cmd: Command): { configFlag: string | undefined; cwd: string } {
  const o = cmd.optsWithGlobals() as { config?: string };
  return { configFlag: o.config, cwd: process.cwd() };
}

const program = new Command();

program
  .name("ai-i18n-tools")
  .description(
    `Unified i18n toolkit for Node.js apps and documentation with AI translation (v${version})`
  )
  .version(version)
  .option("-c, --config <path>", "Config file path", DEFAULT_CONFIG_FILENAME)
  .option("-v, --verbose", "Verbose logging", false)
  .option(
    "-w, --write-logs [path]",
    "Tee console output to a .log file (default path: under cacheDir)"
  );

program
  .command("init")
  .description("Write starter ai-i18n-tools JSON config")
  .option("-o, --output <path>", "config file path", DEFAULT_CONFIG_FILENAME)
  .option(
    "-t, --template <name>",
    "ui-markdown (UI + app markdown) | ui-docusaurus (UI + Docusaurus docs)",
    "ui-markdown"
  )
  .option("--with-translate-ignore", "Create a starter .translate-ignore", false)
  .action((opts: { output: string; template: string; withTranslateIgnore?: boolean }) => {
    const t = opts.template.toLowerCase();
    if (t !== "ui-markdown" && t !== "ui-docusaurus") {
      console.error('Template must be "ui-markdown" or "ui-docusaurus".');
      process.exitCode = 1;
      return;
    }
    const key = t === "ui-markdown" ? "uiMarkdown" : "uiDocusaurus";
    writeInitConfigFile(opts.output, key);
    console.log(`Wrote ${opts.output} (${key})`);
    if (opts.withTranslateIgnore) {
      const ignorePath = path.join(process.cwd(), ".translate-ignore");
      if (!fs.existsSync(ignorePath)) {
        fs.writeFileSync(
          ignorePath,
          ["node_modules/", ".git/", "*.min.js", "dist/", ""].join("\n"),
          "utf8"
        );
        console.log("Wrote .translate-ignore");
      }
    }
  });

program
  .command("extract")
  .description("Extract UI strings (t(...) / i18next-scanner) to strings.json")
  .action(async (_opts, cmd) => {
    const { configFlag, cwd } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd);
    if (!config.features.extractUIStrings) {
      console.error("[extract] Enable features.extractUIStrings in config.");
      process.exit(1);
    }
    try {
      const s = runExtract(config, projectRoot);
      console.log(
        chalk.green(
          `✅ Extracted ${s.found} strings (${s.added} new, ${s.updated} updated) → ${s.outPath}`
        )
      );
    } catch (e) {
      console.error(chalk.red(`❌ [extract] ${e instanceof Error ? e.message : String(e)}`));
      process.exit(1);
    }
  });

function parsePositiveInt(optionLabel: string, value: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new InvalidArgumentError(`${optionLabel} must be a positive integer (got "${value}")`);
  }
  return n;
}

function activateWriteLogs(
  writeLogs: boolean | string | undefined,
  cacheDir: string,
  prefix: string
): string | undefined {
  if (!writeLogs) return undefined;
  const explicitPath = typeof writeLogs === "string" ? writeLogs : undefined;
  const { logPath } = setupLogOutput({ cacheDir, prefix, logPath: explicitPath });
  return logPath;
}

function buildTranslateOpts(
  cmd: Command,
  config: I18nConfig,
  projectRoot: string,
  logPath?: string
): { locales: string[]; uiLocales: string[]; translateOpts: TranslateRunOptions } {
  const g = cmd.optsWithGlobals() as { verbose?: boolean; config?: string };
  const o = cmd.opts() as {
    locale?: string;
    path?: string;
    dryRun?: boolean;
    force?: boolean;
    forceUpdate?: boolean;
    noCache?: boolean;
    type?: string;
    jsonOnly?: boolean;
    noJson?: boolean;
    concurrency?: string;
    batchConcurrency?: string;
    promptFormat?: string;
  };
  const locales = resolveLocalesForDocumentation(config, projectRoot, o.locale ?? null);
  const uiLocales = resolveLocalesForUI(config, projectRoot, o.locale ?? null);
  const translateOpts: TranslateRunOptions = {
    cwd: projectRoot,
    locales,
    dryRun: Boolean(o.dryRun),
    force: Boolean(o.force),
    forceUpdate: Boolean(o.forceUpdate),
    noCache: Boolean(o.noCache),
    verbose: Boolean(g.verbose),
    pathFilter: o.path,
    typeFilter: o.type as TranslateRunOptions["typeFilter"],
    jsonOnly: Boolean(o.jsonOnly),
    noJson: Boolean(o.noJson),
    logPath,
    concurrency:
      o.concurrency !== undefined ? parsePositiveInt("Concurrency (-j)", o.concurrency) : undefined,
    batchConcurrency:
      o.batchConcurrency !== undefined
        ? parsePositiveInt("Batch concurrency (-b)", o.batchConcurrency)
        : undefined,
    promptFormat: parseTranslatePromptFormat(o.promptFormat),
  };
  return { locales, uiLocales, translateOpts };
}

function parseTranslatePromptFormat(raw: string | undefined): TranslateRunOptions["promptFormat"] {
  if (raw === undefined || raw === "") {
    return "xml";
  }
  if (raw === "xml" || raw === "json-array" || raw === "json-object") {
    return raw;
  }
  throw new InvalidArgumentError(
    `Invalid --prompt-format: ${raw} (expected xml, json-array, or json-object)`
  );
}

/** Same as `sync --force-update` (extract + UI + SVG + docs with force-update semantics). */
function buildCleanupSyncTranslateOpts(
  config: I18nConfig,
  projectRoot: string,
  logPath: string | undefined,
  g: { verbose?: boolean },
  dryRun: boolean
): { uiLocales: string[]; translateOpts: TranslateRunOptions } {
  const locales = resolveLocalesForDocumentation(config, projectRoot, null);
  const uiLocales = resolveLocalesForUI(config, projectRoot, null);
  const translateOpts: TranslateRunOptions = {
    cwd: projectRoot,
    locales,
    dryRun,
    force: false,
    forceUpdate: true,
    noCache: false,
    verbose: Boolean(g.verbose),
    pathFilter: undefined,
    typeFilter: undefined,
    jsonOnly: false,
    noJson: false,
    logPath,
    concurrency: undefined,
    batchConcurrency: undefined,
    promptFormat: "xml",
  };
  return { uiLocales, translateOpts };
}

async function runSyncPipeline(args: {
  config: I18nConfig;
  projectRoot: string;
  uiLocales: string[];
  svgLocales: string[];
  translateOpts: TranslateRunOptions;
  noUi: boolean;
  noSvg: boolean;
  noDocs: boolean;
}): Promise<void> {
  const { config, projectRoot, uiLocales, svgLocales, translateOpts, noUi, noSvg, noDocs } = args;
  if (config.features.extractUIStrings) {
    try {
      const s = runExtract(config, projectRoot);
      console.log(
        chalk.green(
          `✅ Extracted ${s.found} strings (${s.added} new, ${s.updated} updated) → ${s.outPath}`
        )
      );
    } catch (e) {
      console.error(chalk.red(`❌ [sync][extract] ${e instanceof Error ? e.message : String(e)}`));
      throw e;
    }
  }
  if (config.features.translateUIStrings && !noUi) {
    try {
      await runTranslateUI(config, {
        cwd: projectRoot,
        locales: uiLocales,
        force: translateOpts.force,
        dryRun: translateOpts.dryRun,
        verbose: translateOpts.verbose,
        logPath: translateOpts.logPath,
        concurrency: translateOpts.concurrency,
      });
    } catch (e) {
      console.error(chalk.red(`❌ [sync][ui] ${e instanceof Error ? e.message : String(e)}`));
      throw e;
    }
  }
  if (config.features.translateSVG && config.svg && !noSvg) {
    try {
      const svgOpts: TranslateRunOptions = {
        ...translateOpts,
        locales: svgLocales,
      };
      await runTranslateSvg(config, svgOpts);
    } catch (e) {
      console.error(chalk.red(`❌ [sync][svg] ${e instanceof Error ? e.message : String(e)}`));
      throw e;
    }
  }
  if (!noDocs) {
    try {
      for (let bi = 0; bi < config.documentations.length; bi++) {
        const block = config.documentations[bi]!;
        const view = toDocTranslateConfig(config, block);
        const md = filterIgnored(
          collectFilesByExtension(block.contentPaths, [".md", ".mdx"], projectRoot),
          projectRoot
        );
        const jsonRoot = block.jsonSource
          ? path.resolve(projectRoot, block.jsonSource)
          : path.resolve(projectRoot, ".");
        const jsonFiles =
          block.jsonSource?.trim() && shouldRunJson(translateOpts, view)
            ? collectFilesRelativeToRoot(jsonRoot, [".json"])
            : [];
        if (md.length === 0 && jsonFiles.length === 0) {
          continue;
        }
        await runTranslate(
          view,
          { ...translateOpts, documentationBlockIndex: bi },
          { markdown: md, json: jsonFiles },
          jsonRoot
        );
      }
    } catch (e) {
      console.error(
        chalk.red(`❌ [sync][translate] ${e instanceof Error ? e.message : String(e)}`)
      );
      throw e;
    }
  }
}

program
  .command("translate-docs")
  .description("Translate documentation files (markdown, JSON) per config features")
  .option(
    "-l, --locale <codes>",
    "Target locales (comma-separated); default: documentation.targetLocales if set, else targetLocales"
  )
  .option("-p, --path <path>", "Limit to file or directory prefix")
  .option("--dry-run", "No writes, no API calls", false)
  .option(
    "--force",
    "Re-translate: clear file tracking for each file and ignore segment cache (not combinable with --force-update)",
    false
  )
  .option(
    "--force-update",
    "Re-process files even when file tracking matches; still use segment cache (not combinable with --force)",
    false
  )
  .option("--stats", "Show cache statistics and exit", false)
  .option("--clear-cache [locale]", "Clear translation cache (all locales, or one locale)")
  .option("--type <kind>", "markdown | json")
  .option("--json-only", "JSON only", false)
  .option("--no-json", "Skip JSON", false)
  .option("-j, --concurrency <n>", "Max parallel target locales (default: config or 3)")
  .option(
    "-b, --batch-concurrency <n>",
    "Max parallel batch API calls per file (default: config or 4)"
  )
  .option(
    "--prompt-format <mode>",
    "Batch segment prompt/response: xml (<seg>/<t>), json-array, or json-object",
    "xml"
  )
  .action(async (_a, cmd) => {
    const { configFlag, cwd } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd);
    const g = cmd.optsWithGlobals() as { writeLogs?: boolean | string };
    const cacheDir = path.join(projectRoot, config.cacheDir);
    const raw = cmd.opts() as {
      force?: boolean;
      forceUpdate?: boolean;
      stats?: boolean;
      clearCache?: boolean | string;
    };
    if (raw.force && raw.forceUpdate) {
      console.error(
        chalk.red(
          `\n❌ Use either --force or --force-update, not both.\n` +
            `   --force: ignore segment cache and clear file tracking for processed files.\n` +
            `   --force-update: re-run outputs when file tracking would skip; segment cache still applies.\n`
        )
      );
      cmd.outputHelp();
      process.exit(1);
    }
    if (raw.stats) {
      const cache = new TranslationCache(cacheDir);
      const cacheStats = cache.getStats();
      console.log(chalk.bold("\n📊 Cache statistics:"));
      console.log(`   Cached segments: ${cacheStats.totalSegments}`);
      console.log(`   Tracked files: ${cacheStats.totalFiles}`);
      console.log(`   By locale:`);
      for (const [loc, count] of Object.entries(cacheStats.byLocale)) {
        console.log(`     - ${loc}: ${count}`);
      }
      cache.close();
      return;
    }
    if (raw.clearCache !== undefined) {
      const cache = new TranslationCache(cacheDir);
      let locale: string | undefined;
      if (typeof raw.clearCache === "string" && raw.clearCache.trim() !== "") {
        locale = normalizeLocale(raw.clearCache);
        const allowed = new Set(
          getDocumentationTargetLocaleCodes(config).map((c) => normalizeLocale(c))
        );
        if (allowed.size > 0 && !allowed.has(locale)) {
          console.error(
            chalk.red(
              `\n❌ Locale "${locale}" is not in documentation target locales.\n` +
                `   Configured: ${[...allowed].join(", ")}\n`
            )
          );
          cache.close();
          process.exit(1);
        }
      }
      cache.clear(locale);
      console.log(chalk.blue(`✅ Cache cleared${locale ? ` for ${locale}` : ""}`));
      cache.close();
      return;
    }
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "translate-docs");
    const { translateOpts } = buildTranslateOpts(cmd, config, projectRoot, logPath);

    if (config.features.translateJSON && !config.documentations.some((b) => b.jsonSource?.trim())) {
      console.warn(
        chalk.yellow(
          "\n⚠️  translateJSON is enabled but no documentations[].jsonSource is set. " +
            "JSON translation (e.g. Docusaurus UI strings from write-translations) is skipped. " +
            'Set jsonSource on at least one block to your default-locale catalog (e.g. "docs-site/i18n/en").\n'
        )
      );
    }

    let totalSkipped = 0;
    let totalWritten = 0;
    try {
      for (let bi = 0; bi < config.documentations.length; bi++) {
        const block = config.documentations[bi]!;
        const view = toDocTranslateConfig(config, block);
        const md = filterIgnored(
          collectFilesByExtension(block.contentPaths, [".md", ".mdx"], projectRoot),
          projectRoot
        );
        const jsonRoot = block.jsonSource
          ? path.resolve(projectRoot, block.jsonSource)
          : path.resolve(projectRoot, ".");
        const jsonFiles =
          block.jsonSource?.trim() && shouldRunJson(translateOpts, view)
            ? collectFilesRelativeToRoot(jsonRoot, [".json"])
            : [];
        if (md.length === 0 && jsonFiles.length === 0) {
          continue;
        }
        const desc =
          typeof block.description === "string" && block.description.trim()
            ? ` — ${block.description.trim()}`
            : "";
        console.log(
          chalk.gray(
            `\n--- documentations[${bi}]${desc} → ${path.resolve(projectRoot, block.outputDir)} (${md.length} md, ${jsonFiles.length} json) ---\n`
          )
        );
        const sum = await runTranslate(
          view,
          { ...translateOpts, documentationBlockIndex: bi },
          { markdown: md, json: jsonFiles },
          jsonRoot
        );
        totalSkipped += sum.filesSkipped;
        totalWritten += sum.filesWritten;
      }
      if (
        totalSkipped > 0 &&
        totalWritten === 0 &&
        !translateOpts.dryRun &&
        !translateOpts.force &&
        !translateOpts.forceUpdate
      ) {
        console.log(
          chalk.cyan(
            `💡  All files were skipped (cache matches output). Use --force-update to re-process files (using translationcache) or --force to retranslate files`
          )
        );
      }
    } catch (e) {
      console.error(chalk.red(`❌ [translate-docs] ${e instanceof Error ? e.message : String(e)}`));
      process.exit(1);
    }
  });

program
  .command("translate-svg")
  .description("Translate standalone SVG assets per config.svg (requires features.translateSVG)")
  .option(
    "-l, --locale <codes>",
    "Target locales (comma-separated); default: documentation.targetLocales if set, else targetLocales"
  )
  .option("-p, --path <path>", "Limit to file or directory prefix")
  .option("--dry-run", "No writes, no API calls", false)
  .option(
    "--force",
    "Re-translate: clear file tracking for each file and ignore segment cache (not combinable with --force-update)",
    false
  )
  .option(
    "--force-update",
    "Re-process files even when file tracking matches; still use segment cache (not combinable with --force)",
    false
  )
  .option("--no-cache", "Bypass SQLite cache", false)
  .option("-j, --concurrency <n>", "Max parallel target locales (default: config or 3)")
  .option(
    "-b, --batch-concurrency <n>",
    "Max parallel batch API calls per file (default: config or 4)"
  )
  .action(async (_a, cmd) => {
    const { configFlag, cwd } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd);
    const g = cmd.optsWithGlobals() as { writeLogs?: boolean | string };
    const cacheDir = path.join(projectRoot, config.cacheDir);
    const raw = cmd.opts() as { force?: boolean; forceUpdate?: boolean };
    if (raw.force && raw.forceUpdate) {
      console.error(
        chalk.red(
          `\n❌ Use either --force or --force-update, not both.\n` +
            `   --force: ignore segment cache and clear file tracking for processed files.\n` +
            `   --force-update: re-run outputs when file tracking would skip; segment cache still applies.\n`
        )
      );
      cmd.outputHelp();
      process.exit(1);
    }
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "translate-svg");
    const { translateOpts } = buildTranslateOpts(cmd, config, projectRoot, logPath);
    const localeOpt = cmd.opts() as { locale?: string };
    translateOpts.locales = resolveLocalesForSvg(config, projectRoot, localeOpt.locale ?? null);
    if (!config.features.translateSVG) {
      console.error(chalk.red("❌ [translate-svg] Enable features.translateSVG in config."));
      process.exit(1);
    }
    try {
      await runTranslateSvg(config, translateOpts);
    } catch (e) {
      console.error(chalk.red(`❌ [translate-svg] ${e instanceof Error ? e.message : String(e)}`));
      process.exit(1);
    }
  });

program
  .command("translate-ui")
  .description("Translate UI strings (strings.json → locale JSON via OpenRouter)")
  .option(
    "-l, --locale <codes>",
    "Target locales (comma-separated); default: ui-languages.json or config.targetLocales"
  )
  .option("--dry-run", "No writes, no API calls", false)
  .option("--force", "Re-translate all entries per locale", false)
  .option("-j, --concurrency <n>", "Max parallel target locales (default: config or 4)")
  .action(async (_a, cmd) => {
    const { configFlag, cwd } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd);
    const g = cmd.optsWithGlobals() as { verbose?: boolean; writeLogs?: boolean | string };
    const o = cmd.opts() as {
      locale?: string;
      dryRun?: boolean;
      force?: boolean;
      concurrency?: string;
    };
    const locales = resolveLocalesForUI(config, projectRoot, o.locale ?? null);
    if (!config.features.translateUIStrings) {
      console.error(chalk.red("❌ [translate-ui] Enable features.translateUIStrings in config."));
      process.exit(1);
    }
    const cacheDir = path.join(projectRoot, config.cacheDir);
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "translate-ui");
    try {
      await runTranslateUI(config, {
        cwd: projectRoot,
        locales,
        force: Boolean(o.force),
        dryRun: Boolean(o.dryRun),
        verbose: Boolean(g.verbose),
        logPath,
        concurrency:
          o.concurrency !== undefined
            ? parsePositiveInt("Concurrency (-j)", o.concurrency)
            : undefined,
      });
    } catch (e) {
      console.error(chalk.red(`❌ [translate-ui] ${e instanceof Error ? e.message : String(e)}`));
      process.exit(1);
    }
  });

program
  .command("export-ui-xliff")
  .description(
    "Export UI strings from strings.json to XLIFF 2.0 (one .xliff file per target locale)"
  )
  .option(
    "-l, --locale <codes>",
    "Target locales (comma-separated); default: ui-languages.json or config.targetLocales"
  )
  .option(
    "-o, --output-dir <path>",
    "Output directory for .xliff files (default: same directory as strings.json)"
  )
  .option(
    "--untranslated-only",
    "Include only units that have no translation for the target locale",
    false
  )
  .option("--dry-run", "Print paths that would be written without writing files", false)
  .action((_a, cmd) => {
    const { configFlag, cwd } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd);
    const o = cmd.opts() as {
      locale?: string;
      outputDir?: string;
      untranslatedOnly?: boolean;
      dryRun?: boolean;
    };
    try {
      runExportUIXliff(config, {
        cwd: projectRoot,
        locales: o.locale ?? null,
        outputDir: o.outputDir,
        untranslatedOnly: Boolean(o.untranslatedOnly),
        dryRun: Boolean(o.dryRun),
      });
    } catch (e) {
      console.error(
        chalk.red(`❌ [export-ui-xliff] ${e instanceof Error ? e.message : String(e)}`)
      );
      process.exit(1);
    }
  });

program
  .command("sync")
  .description(
    "Extract UI strings (if enabled), then translate UI / SVG (if features.translateSVG + svg) / docs unless skipped with --no-*"
  )
  .option("-l, --locale <codes>", "Target locales for translate step")
  .option("-p, --path <path>", "Limit translate to path prefix")
  .option("--dry-run", "No writes / no API", false)
  .option(
    "--force",
    "Docs: clear file tracking and ignore segment cache (not combinable with --force-update)",
    false
  )
  .option(
    "--force-update",
    "Docs: re-process even when file tracking matches; segment cache still applies",
    false
  )
  .option("--no-ui", "Skip UI strings translation", false)
  .option(
    "--no-svg",
    "Skip standalone SVG translation (when features.translateSVG and config.svg)",
    false
  )
  .option("--no-docs", "Skip markdown/JSON documentation translation", false)
  .option(
    "-j, --concurrency <n>",
    "Max parallel target locales for translate steps (default: config)"
  )
  .option(
    "-b, --batch-concurrency <n>",
    "Max parallel batch API calls per file for docs (default: config)"
  )
  .action(async (_a, cmd) => {
    const { configFlag, cwd } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd);
    const syncOpts = cmd.opts() as {
      noUi?: boolean;
      noSvg?: boolean;
      noDocs?: boolean;
      force?: boolean;
      forceUpdate?: boolean;
    };
    const noDocs = Boolean(syncOpts.noDocs);
    if (!noDocs && syncOpts.force && syncOpts.forceUpdate) {
      console.error(
        chalk.red(
          `\n❌ Use either --force or --force-update, not both.\n` +
            `   --force: docs ignore segment cache and clear file tracking.\n` +
            `   --force-update: docs re-run when file tracking would skip; segment cache still applies.\n`
        )
      );
      cmd.outputHelp();
      process.exit(1);
    }
    const noUi = Boolean(syncOpts.noUi);
    const noSvg = Boolean(syncOpts.noSvg);
    const g = cmd.optsWithGlobals() as { writeLogs?: boolean | string };
    const cacheDir = path.join(projectRoot, config.cacheDir);
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "sync");
    const { uiLocales, translateOpts } = buildTranslateOpts(cmd, config, projectRoot, logPath);
    const localeOpt = cmd.opts() as { locale?: string };
    const svgLocales = resolveLocalesForSvg(config, projectRoot, localeOpt.locale ?? null);
    try {
      await runSyncPipeline({
        config,
        projectRoot,
        uiLocales,
        svgLocales,
        translateOpts,
        noUi,
        noSvg,
        noDocs,
      });
    } catch {
      process.exit(1);
    }
  });

program
  .command("status")
  .description("Show markdown translation status vs cache / output files")
  .action((_a, cmd) => {
    const { configFlag, cwd } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd);
    const cache = new TranslationCache(path.join(projectRoot, config.cacheDir));
    const locales = getDocumentationTargetLocaleCodes(config);
    const headers = ["File", ...locales];

    const padVis = (s: string, width: number): string => {
      const visLen = stripAnsi(s).length;
      return s + " ".repeat(Math.max(0, width - visLen));
    };

    const printTable = (rows: string[][]) => {
      const colW = Math.max(12, ...rows.map((r) => stripAnsi(r[0]!).length), 8);
      const localeColW = Math.max(
        4,
        ...locales.map((l) => l.length),
        ...rows.flatMap((r) => r.slice(1).map((c) => stripAnsi(String(c)).length))
      );
      const sep = (cols: string[]) => cols.join(" | ");
      console.log(
        sep(
          headers.map((h, i) =>
            i === 0 ? padVis(chalk.bold(h), colW) : padVis(chalk.bold(h), localeColW)
          )
        )
      );
      console.log(
        sep(
          headers.map((_, i) =>
            i === 0 ? chalk.bold("-".repeat(colW)) : chalk.bold("-".repeat(localeColW))
          )
        )
      );
      for (const r of rows) {
        console.log(
          sep(r.map((c, i) => (i === 0 ? padVis(String(c), colW) : padVis(String(c), localeColW))))
        );
      }
      console.log();
    };

    if (config.features.translateUIStrings) {
      const stringsPath = resolveStringsJsonPath(config, projectRoot);
      let stringsData: Record<string, { translated?: Record<string, string> }> = {};
      try {
        stringsData = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as typeof stringsData;
      } catch {
        console.log(chalk.red("\n⚠ Could not read strings.json: " + stringsPath));
      }

      const keys = Object.keys(stringsData);
      const total = keys.length;

      if (total > 0) {
        const uiLocales = resolveLocalesForUI(config, projectRoot);
        const uiHeaders = ["", ...uiLocales];

        const pct = (n: number) => Math.round((n / total) * 100);

        const translatedRow: string[] = [chalk.bold("Translated")];
        const missingRow: string[] = [chalk.bold("Missing")];
        const totalRow: string[] = [chalk.bold("Total")];

        for (const loc of uiLocales) {
          const translated = keys.filter((k) => stringsData[k]?.translated?.[loc]?.trim()).length;
          const missing = total - translated;

          translatedRow.push(
            chalk.green(String(translated)) + " " + chalk.gray(`${pct(translated)}%`)
          );
          missingRow.push(
            missing > 0
              ? chalk.yellow(String(missing)) + " " + chalk.gray(`${pct(missing)}%`)
              : chalk.green(String(missing)) + " " + chalk.gray(`${pct(missing)}%`)
          );
          totalRow.push(String(total));
        }

        const uiRows = [translatedRow, missingRow, totalRow];

        const labelW = Math.max(12, ...uiRows.map((r) => stripAnsi(r[0]!).length));
        const uiLocColW = Math.max(
          4,
          ...uiLocales.map((l) => l.length),
          ...uiRows.flatMap((r) => r.slice(1).map((c) => stripAnsi(c).length))
        );
        const uiSep = (cols: string[]) => cols.join(" | ");

        console.log(chalk.bold.cyan("\n📊 UI strings status"));
        console.log(chalk.gray(`(${stringsPath})\n`));
        console.log(
          uiSep(
            uiHeaders.map((h, i) =>
              i === 0 ? padVis(chalk.bold(h), labelW) : padVis(chalk.bold(h), uiLocColW)
            )
          )
        );
        console.log(
          uiSep(uiHeaders.map((_, i) => (i === 0 ? "-".repeat(labelW) : "-".repeat(uiLocColW))))
        );
        for (const r of uiRows) {
          console.log(uiSep(r.map((c, i) => (i === 0 ? padVis(c, labelW) : padVis(c, uiLocColW)))));
        }
        console.log();
      }
    }

    console.log(chalk.bold.cyan("\n📊 Translation status (markdown)"));
    console.log(
      chalk.gray("Legend: ") +
        chalk.green("✓") +
        chalk.gray(" up to date  ") +
        chalk.yellow("●") +
        chalk.gray(" stale or missing  ") +
        chalk.gray("-") +
        chalk.gray(" not generated  ") +
        chalk.red("?") +
        chalk.gray(" source read error")
    );
    for (let bi = 0; bi < config.documentations.length; bi++) {
      const block = config.documentations[bi]!;
      const view = toDocTranslateConfig(config, block);
      const md = filterIgnored(
        collectFilesByExtension(block.contentPaths, [".md", ".mdx"], projectRoot),
        projectRoot
      );
      if (md.length === 0) {
        continue;
      }
      const desc =
        typeof block.description === "string" && block.description.trim()
          ? ` — ${block.description.trim()}`
          : "";
      if (config.documentations.length > 1 || desc) {
        console.log(
          "\n" +
            chalk.bold(`documentations[${bi}]`) +
            chalk.cyan(`${desc} `) +
            chalk.magenta(`(${block.outputDir})`) +
            "\n"
        );
      }
      const rows: string[][] = [];
      for (const rel of md) {
        const abs = path.join(projectRoot, rel);
        const trackKey = documentationFileTrackingKey(bi, rel);
        let srcHash = "";
        try {
          srcHash = hashFileContent(fs.readFileSync(abs, "utf8"));
        } catch {
          rows.push([rel, ...locales.map(() => chalk.red("?"))]);
          continue;
        }
        const cells = locales.map((loc) => {
          const out = resolveTranslatedOutputPath(view, projectRoot, loc, rel, "markdown");
          const tracked = cache.getFileHash(trackKey, loc);
          if (!fs.existsSync(out)) {
            return chalk.gray("-");
          }
          if (tracked === srcHash) {
            return chalk.green("✓");
          }
          return chalk.yellow("●");
        });
        rows.push([rel, ...cells]);
      }
      printTable(rows);
    }

    cache.close();
  });

program
  .command("cleanup")
  .description(
    "Run sync --force-update (extract, UI, SVG, docs), then clean stale segment rows (null last_hit_at / empty filepath); remove orphaned file_tracking keys and translation rows when resolved paths are missing on disk (SQLite)"
  )
  .option("--dry-run", "Show only", false)
  .option("--no-backup", "Skip SQLite backup before modifications", false)
  .option(
    "--backup <path>",
    "SQLite backup path (default: timestamped file under documentation cacheDir)"
  )
  .action(async (opts: { dryRun?: boolean; noBackup?: boolean; backup?: string }, cmd) => {
    const { configFlag, cwd } = withConfig(cmd);
    const { config: loaded, projectRoot } = loadConfigOrExit(configFlag, cwd);

    const g = cmd.optsWithGlobals() as { verbose?: boolean; writeLogs?: boolean | string };
    const cacheDir = path.join(projectRoot, loaded.cacheDir);
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "cleanup");
    const { uiLocales, translateOpts } = buildCleanupSyncTranslateOpts(
      loaded,
      projectRoot,
      logPath,
      g,
      Boolean(opts.dryRun)
    );
    const svgLocales = resolveLocalesForSvg(loaded, projectRoot, null);

    console.log(chalk.cyan("[cleanup] Running sync --force-update first…"));
    try {
      await runSyncPipeline({
        config: loaded,
        projectRoot,
        uiLocales,
        svgLocales,
        translateOpts,
        noUi: false,
        noSvg: false,
        noDocs: false,
      });
    } catch {
      process.exit(1);
    }

    const cache = new TranslationCache(cacheDir);

    const shouldBackup = !opts.dryRun && !opts.noBackup;
    if (shouldBackup) {
      const backupPath = opts.backup
        ? path.resolve(cwd, opts.backup)
        : path.join(
            cacheDir,
            `cache.db.backup.${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`
          );
      await cache.backupTo(backupPath);
      console.log(`[cleanup] Backup → ${backupPath}`);
    }

    const { count, deletedRows } = cache.cleanupStaleTranslations(Boolean(opts.dryRun));
    console.log(`[cleanup] stale: ${count} row(s)${opts.dryRun ? " (dry-run)" : ""}`);
    if (opts.dryRun && deletedRows.length) {
      console.log(
        deletedRows
          .slice(0, 20)
          .map((r) => `  ${r.source_hash} ${r.locale}`)
          .join("\n")
      );
    }

    const prunedTracking = cache.pruneOrphanedFileTrackingByDisk(projectRoot, Boolean(opts.dryRun));
    console.log(
      `[cleanup] orphaned file_tracking (missing on disk): ${prunedTracking}${opts.dryRun ? " (dry-run)" : ""}`
    );

    let orphanTranslations = 0;
    for (const fp of cache.getUniqueFilepaths()) {
      const abs = resolveCacheTrackingKeyToAbs(projectRoot, fp);
      if (!fs.existsSync(abs)) {
        if (!opts.dryRun) {
          orphanTranslations += cache.deleteTranslationsByFilepath(fp);
        } else {
          orphanTranslations += 1;
        }
      }
    }
    console.log(
      `[cleanup] orphaned translations (missing on disk): ${orphanTranslations}${opts.dryRun ? " (dry-run)" : ""}`
    );

    cache.close();
  });

program
  .command("editor")
  .description("Launch local web UI for cache segments, strings.json, and glossary CSV")
  .option("-p, --port <n>", "Port", "8787")
  .option("--no-open", "Do not open the default browser")
  .action((_opts: { port?: string }, cmd) => {
    const { configFlag, cwd } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd);
    const cmdOpts = cmd.opts() as { port?: string; noOpen?: boolean };
    const port = parseInt(cmdOpts.port || "8787", 10);
    const cache = new TranslationCache(path.join(projectRoot, config.cacheDir));
    const stringsPath = config.glossary?.uiGlossary
      ? path.join(projectRoot, config.glossary.uiGlossary)
      : resolveStringsJsonPath(config, projectRoot);
    const glossaryPath = config.glossary?.userGlossary
      ? path.join(projectRoot, config.glossary.userGlossary)
      : null;
    const jsonSourceBlock = config.documentations.find((b) => b.jsonSource?.trim());

    const app = createTranslationEditorApp(cache, {
      cwd: projectRoot,
      stringsJsonPath: stringsPath,
      glossaryUserPath: glossaryPath,
      sourceLocale: config.sourceLocale,
      targetLocales: config.targetLocales,
      jsonSource: jsonSourceBlock?.jsonSource?.trim() || null,
    });

    const staticDir = resolveEditCacheStaticDir();
    if (fs.existsSync(staticDir)) {
      app.use(express.static(staticDir));
    } else {
      console.warn(`[editor] Static dir missing: ${staticDir}`);
    }

    const server = http.createServer(app);
    server.listen(port, () => {
      const url = `http://127.0.0.1:${port}/`;
      console.log(chalk.green("-------------------------------------------"));
      console.log(chalk.green("  ai-i18n-tools Translation Cache Editor"));
      console.log(chalk.green("-------------------------------------------\n"));
      console.log(`[editor] Running at ` + chalk.cyan(`${url}`));
      if (!cmdOpts.noOpen) {
        openBrowser(url);
      }
      console.log("\n");
    });
  });

program
  .command("glossary-generate")
  .description("Write an empty glossary-user.csv with standard headers")
  .option(
    "-o, --output <path>",
    "Output path (default: config glossary.userGlossary or glossary-user.csv)"
  )
  .action((opts: { output?: string }, cmd) => {
    const { configFlag, cwd } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd);
    const out = opts.output
      ? path.resolve(cwd, opts.output)
      : path.join(projectRoot, config.glossary?.userGlossary || "glossary-user.csv");
    const header = `"Original language string","locale","Translation","Force"\n`;
    if (fs.existsSync(out)) {
      console.error(`Refusing to overwrite existing file: ${out}`);
      process.exit(1);
    }
    writeAtomicUtf8(out, header);
    console.log(`Wrote ${out}`);
  });

program.parse();
