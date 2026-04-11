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
import http from "http";
import { exec, execFile } from "node:child_process";
import readline from "node:readline/promises";
import chalk from "chalk";
import { DEFAULT_CONFIG_FILENAME, writeInitConfigFile } from "../core/config.js";
import {
  getDocumentationTargetLocaleCodes,
  resolveLocalesForDocumentation,
  resolveLocalesForSvg,
  resolveLocalesForUI,
} from "../core/ui-languages.js";
import {
  loadConfigOrExit,
  resolveConfigPath,
  resolveStringsJsonPath,
  hashFileContent,
  resolveTranslatedOutputPath,
  writeAtomicUtf8,
} from "./helpers.js";
import { normalizeLocale } from "../core/config.js";
import { collectFilesByExtension, collectFilesRelativeToRoot } from "./file-utils.js";
import { loadTranslateIgnore, isIgnored } from "../utils/ignore-parser.js";
import { runExtract } from "./extract-strings.js";
import {
  runTranslate,
  shouldRunJson,
  type TranslateRunOptions,
} from "./doc-translate.js";
import { runTranslateSvg } from "./translate-svg.js";
import { runTranslateUI } from "./translate-ui-strings.js";
import { TranslationCache } from "../core/cache.js";
import { setupLogOutput } from "./log-output.js";
import { createTranslationEditorApp, resolveEditCacheStaticDir } from "../server/translation-editor.js";

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

const pkgPath = path.join(__dirname, "..", "..", "package.json");
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

type CleanupConfirmResult = { ok: true } | { ok: false; reason: "declined" | "not-tty" };

/** Interactive confirmation before destructive cleanup; `--dry-run` skips (no DB writes). */
async function confirmCleanupProceed(opts: { yes?: boolean; dryRun?: boolean }): Promise<CleanupConfirmResult> {
  if (opts.dryRun || opts.yes) {
    return { ok: true };
  }
  if (!process.stdin.isTTY) {
    console.error(
      chalk.red(
        "cleanup: stdin is not a TTY; pass --yes to confirm, or run `translate-docs --force-update` first.\n" +
          "That step refreshes file tracking and segment hits so valid cache rows are not removed."
      )
    );
    return { ok: false, reason: "not-tty" };
  }
  console.log(
    chalk.yellow(
      "Run `translate-docs --force-update` before cleanup so file tracking and cache hits are current.\n" +
        "Otherwise valid cache entries may be removed.\n"
    )
  );
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("Continue with cleanup? [y/N] ");
    if (/^y(es)?$/i.test(answer.trim())) {
      return { ok: true };
    }
    return { ok: false, reason: "declined" };
  } finally {
    rl.close();
  }
}

function withConfig(cmd: Command): { config: string; cwd: string } {
  const o = cmd.optsWithGlobals() as { config?: string };
  const cwd = process.cwd();
  return { config: resolveConfigPath(o.config, cwd), cwd };
}

const program = new Command();

program
  .name("ai-i18n-tools")
  .description(`Unified i18n toolkit for Node.js apps and documentation with AI translation (v${version})`)
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
    const { config: cfgPath, cwd } = withConfig(cmd);
    const config = loadConfigOrExit(cfgPath, cwd);
    if (!config.features.extractUIStrings) {
      console.error("[extract] Enable features.extractUIStrings in config.");
      process.exit(1);
    }
    try {
      const s = runExtract(config, cwd);
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
    throw new InvalidArgumentError(
      `${optionLabel} must be a positive integer (got "${value}")`
    );
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
  cwd: string,
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
  };
  const config = loadConfigOrExit(resolveConfigPath(g.config, cwd), cwd);
  const locales = resolveLocalesForDocumentation(config, cwd, o.locale ?? null);
  const uiLocales = resolveLocalesForUI(config, cwd, o.locale ?? null);
  const translateOpts: TranslateRunOptions = {
    cwd,
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
      o.concurrency !== undefined
        ? parsePositiveInt("Concurrency (-j)", o.concurrency)
        : undefined,
    batchConcurrency:
      o.batchConcurrency !== undefined
        ? parsePositiveInt("Batch concurrency (-b)", o.batchConcurrency)
        : undefined,
  };
  return { locales, uiLocales, translateOpts };
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
  .option(
    "-j, --concurrency <n>",
    "Max parallel target locales (default: config or 3)"
  )
  .option(
    "-b, --batch-concurrency <n>",
    "Max parallel batch API calls per file (default: config or 4)"
  )
  .action(async (_a, cmd) => {
    const { cwd } = withConfig(cmd);
    const config = loadConfigOrExit(resolveConfigPath((cmd.optsWithGlobals() as { config?: string }).config, cwd), cwd);
    const g = cmd.optsWithGlobals() as { writeLogs?: boolean | string };
    const cacheDir = path.join(cwd, config.documentation.cacheDir);
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
        const allowed = new Set(getDocumentationTargetLocaleCodes(config).map((c) => normalizeLocale(c)));
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
    const { translateOpts } = buildTranslateOpts(cmd, cwd, logPath);

    if (config.features.translateJSON && !config.documentation.jsonSource?.trim()) {
      console.warn(
        chalk.yellow(
          "\n⚠️  translateJSON is enabled but documentation.jsonSource is not set. " +
            "JSON translation (e.g. Docusaurus UI strings from write-translations) is skipped. " +
            'Set documentation.jsonSource to your default-locale catalog (e.g. "docs-site/i18n/en").\n'
        )
      );
    }

    const md = filterIgnored(
      collectFilesByExtension(config.documentation.contentPaths, [".md", ".mdx"], cwd),
      cwd
    );
    const jsonRoot = config.documentation.jsonSource
      ? path.resolve(cwd, config.documentation.jsonSource)
      : path.resolve(cwd, ".");
    const jsonFiles =
      config.documentation.jsonSource && shouldRunJson(translateOpts, config)
        ? collectFilesRelativeToRoot(jsonRoot, [".json"])
        : [];

    try {
      const sum = await runTranslate(config, translateOpts, { markdown: md, json: jsonFiles }, jsonRoot);
      if (
        sum.filesSkipped > 0 &&
        sum.filesWritten === 0 &&
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
  .description("Translate standalone SVG assets per config.svg (sourcePath, outputDir, style)")
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
  .option(
    "-j, --concurrency <n>",
    "Max parallel target locales (default: config or 3)"
  )
  .option(
    "-b, --batch-concurrency <n>",
    "Max parallel batch API calls per file (default: config or 4)"
  )
  .action(async (_a, cmd) => {
    const { cwd } = withConfig(cmd);
    const config = loadConfigOrExit(
      resolveConfigPath((cmd.optsWithGlobals() as { config?: string }).config, cwd),
      cwd
    );
    const g = cmd.optsWithGlobals() as { writeLogs?: boolean | string };
    const cacheDir = path.join(cwd, config.documentation.cacheDir);
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
    const { translateOpts } = buildTranslateOpts(cmd, cwd, logPath);
    const localeOpt = cmd.opts() as { locale?: string };
    translateOpts.locales = resolveLocalesForSvg(config, cwd, localeOpt.locale ?? null);
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
  .option(
    "-j, --concurrency <n>",
    "Max parallel target locales (default: config or 4)"
  )
  .action(async (_a, cmd) => {
    const { cwd } = withConfig(cmd);
    const config = loadConfigOrExit(resolveConfigPath((cmd.optsWithGlobals() as { config?: string }).config, cwd), cwd);
    const g = cmd.optsWithGlobals() as { verbose?: boolean; writeLogs?: boolean | string };
    const o = cmd.opts() as { locale?: string; dryRun?: boolean; force?: boolean; concurrency?: string };
    const locales = resolveLocalesForUI(config, cwd, o.locale ?? null);
    if (!config.features.translateUIStrings) {
      console.error(chalk.red("❌ [translate-ui] Enable features.translateUIStrings in config."));
      process.exit(1);
    }
    const cacheDir = path.join(cwd, config.documentation.cacheDir);
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "translate-ui");
    try {
      await runTranslateUI(config, {
        cwd,
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
  .command("sync")
  .description(
    "Extract UI strings (if enabled), then translate UI / SVG / docs unless skipped with --no-*"
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
  .option("--no-svg", "Skip standalone SVG translation (config.svg)", false)
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
    const { cwd } = withConfig(cmd);
    const config = loadConfigOrExit(resolveConfigPath((cmd.optsWithGlobals() as { config?: string }).config, cwd), cwd);
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
    const cacheDir = path.join(cwd, config.documentation.cacheDir);
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "sync");
    const { uiLocales, translateOpts } = buildTranslateOpts(cmd, cwd, logPath);
    if (config.features.extractUIStrings) {
      try {
        const s = runExtract(config, cwd);
        console.log(
          chalk.green(`✅ Extracted ${s.found} strings (${s.added} new, ${s.updated} updated) → ${s.outPath}`)
        );
      } catch (e) {
        console.error(chalk.red(`❌ [sync][extract] ${e instanceof Error ? e.message : String(e)}`));
        process.exit(1);
      }
    }
    if (config.features.translateUIStrings && !noUi) {
      try {
        await runTranslateUI(config, {
          cwd,
          locales: uiLocales,
          force: translateOpts.force,
          dryRun: translateOpts.dryRun,
          verbose: translateOpts.verbose,
          logPath,
          concurrency: translateOpts.concurrency,
        });
      } catch (e) {
        console.error(chalk.red(`❌ [sync][ui] ${e instanceof Error ? e.message : String(e)}`));
        process.exit(1);
      }
    }
    if (config.svg && !noSvg) {
      try {
        const localeOpt = cmd.opts() as { locale?: string };
        const svgOpts: TranslateRunOptions = {
          ...translateOpts,
          locales: resolveLocalesForSvg(config, cwd, localeOpt.locale ?? null),
        };
        await runTranslateSvg(config, svgOpts);
      } catch (e) {
        console.error(chalk.red(`❌ [sync][svg] ${e instanceof Error ? e.message : String(e)}`));
        process.exit(1);
      }
    }
    if (!noDocs) {
      const md = filterIgnored(
        collectFilesByExtension(config.documentation.contentPaths, [".md", ".mdx"], cwd),
        cwd
      );
      const jsonRoot = config.documentation.jsonSource
        ? path.resolve(cwd, config.documentation.jsonSource)
        : path.resolve(cwd, ".");
      const jsonFiles =
        config.documentation.jsonSource && shouldRunJson(translateOpts, config)
          ? collectFilesRelativeToRoot(jsonRoot, [".json"])
          : [];
      try {
        await runTranslate(config, translateOpts, { markdown: md, json: jsonFiles }, jsonRoot);
      } catch (e) {
        console.error(chalk.red(`❌ [sync][translate] ${e instanceof Error ? e.message : String(e)}`));
        process.exit(1);
      }
    }
  });

program
  .command("status")
  .description("Show markdown translation status vs cache / output files")
  .action((_a, cmd) => {
    const { config: cfgPath, cwd } = withConfig(cmd);
    const config = loadConfigOrExit(cfgPath, cwd);
    const cache = new TranslationCache(path.join(cwd, config.documentation.cacheDir));
    const md = filterIgnored(
      collectFilesByExtension(config.documentation.contentPaths, [".md", ".mdx"], cwd),
      cwd
    );
    const locales = getDocumentationTargetLocaleCodes(config);
    const headers = ["File", ...locales];
    const rows: string[][] = [];
    for (const rel of md) {
      const abs = path.join(cwd, rel);
      let srcHash = "";
      try {
        srcHash = hashFileContent(fs.readFileSync(abs, "utf8"));
      } catch {
        rows.push([rel, ...locales.map(() => "?")]);
        continue;
      }
      const cells = locales.map((loc) => {
        const out = resolveTranslatedOutputPath(config, cwd, loc, rel, "markdown");
        const tracked = cache.getFileHash(rel, loc);
        if (!fs.existsSync(out)) {
          return "-";
        }
        if (tracked === srcHash) {
          return "✓";
        }
        return "●";
      });
      rows.push([rel, ...cells]);
    }
    cache.close();

    const colW = Math.max(12, ...rows.map((r) => r[0].length), 8);
    const sep = (cols: string[]) => cols.join(" | ");
    console.log("Translation status (markdown):");
    console.log(sep(headers.map((h, i) => (i === 0 ? h.padEnd(colW) : h.padEnd(4)))));
    console.log(sep(headers.map((_, i) => (i === 0 ? "-".repeat(colW) : "----"))));
    for (const r of rows) {
      console.log(sep(r.map((c, i) => (i === 0 ? c.padEnd(colW) : String(c).padEnd(4)))));
    }
  });

program
  .command("cleanup")
  .description(
    "Clean stale rows (null last_hit_at / empty filepath) and orphaned rows (filepath missing on disk) from the document translation cache (SQLite)"
  )
  .option("--dry-run", "Show only", false)
  .option("--no-backup", "Skip SQLite backup before modifications", false)
  .option(
    "--backup <path>",
    "SQLite backup path (default: timestamped file under documentation cacheDir)"
  )
  .option("-y, --yes", "Skip confirmation prompt (required when stdin is not a TTY)", false)
  .action(async (opts: { dryRun?: boolean; noBackup?: boolean; backup?: string; yes?: boolean }, cmd) => {
    const { config: cfgPath, cwd } = withConfig(cmd);
    const loaded = loadConfigOrExit(cfgPath, cwd);

    const confirm = await confirmCleanupProceed({ yes: opts.yes, dryRun: opts.dryRun });
    if (!confirm.ok) {
      if (confirm.reason === "declined") {
        console.log(chalk.dim("Aborted."));
      }
      process.exit(1);
    }

    const cacheDir = path.join(cwd, loaded.documentation.cacheDir);
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
      console.log(deletedRows.slice(0, 20).map((r) => `  ${r.source_hash} ${r.locale}`).join("\n"));
    }

    let orphaned = 0;
    for (const fp of cache.getUniqueFilepaths()) {
      const abs = path.join(cwd, fp);
      if (!fs.existsSync(abs)) {
        if (!opts.dryRun) {
          orphaned += cache.deleteByFilepath(fp);
        } else {
          orphaned += 1;
        }
      }
    }
    console.log(`[cleanup] orphaned filepath rows: ${orphaned}${opts.dryRun ? " (dry-run)" : ""}`);

    cache.close();
  });

program
  .command("editor")
  .description("Launch local web UI for cache segments, strings.json, and glossary CSV")
  .option("-p, --port <n>", "Port", "8787")
  .option("--no-open", "Do not open the default browser")
  .action((_opts: { port?: string }, cmd) => {
    const { config: cfgPath, cwd } = withConfig(cmd);
    const config = loadConfigOrExit(cfgPath, cwd);
    const cmdOpts = cmd.opts() as { port?: string; noOpen?: boolean };
    const port = parseInt(cmdOpts.port || "8787", 10);
    const cache = new TranslationCache(path.join(cwd, config.documentation.cacheDir));
    const stringsPath = config.glossary?.uiGlossary
      ? path.join(cwd, config.glossary.uiGlossary)
      : resolveStringsJsonPath(config, cwd);
    const glossaryPath = config.glossary?.userGlossary
      ? path.join(cwd, config.glossary.userGlossary)
      : null;

    const app = createTranslationEditorApp(cache, {
      cwd,
      stringsJsonPath: stringsPath,
      glossaryUserPath: glossaryPath,
      sourceLocale: config.sourceLocale,
      targetLocales: config.targetLocales,
      jsonSource: config.documentation.jsonSource?.trim() || null,
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
  .option("-o, --output <path>", "Output path (default: config glossary.userGlossary or glossary-user.csv)")
  .action((opts: { output?: string }, cmd) => {
    const { config: cfgPath, cwd } = withConfig(cmd);
    const config = loadConfigOrExit(cfgPath, cwd);
    const out = opts.output
      ? path.resolve(cwd, opts.output)
      : path.join(cwd, config.glossary?.userGlossary || "glossary-user.csv");
    const header = `"Original language string","locale","Translation"\n`;
    if (fs.existsSync(out)) {
      console.error(`Refusing to overwrite existing file: ${out}`);
      process.exit(1);
    }
    writeAtomicUtf8(out, header);
    console.log(`Wrote ${out}`);
  });

program.parse();
