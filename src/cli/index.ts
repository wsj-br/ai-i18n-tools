#!/usr/bin/env node
import { Command } from "commander";
import express from "express";
import fs from "fs";
import path from "path";
import http from "http";
import { DEFAULT_CONFIG_FILENAME, writeInitConfigFile } from "../core/config.js";
import {
  getDocumentationTargetLocaleCodes,
  resolveLocalesForDocumentation,
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
import { collectFilesByExtension, collectFilesRelativeToRoot } from "./file-utils.js";
import { loadTranslateIgnore, isIgnored } from "../utils/ignore-parser.js";
import { runExtract } from "./extract-strings.js";
import {
  runTranslate,
  shouldRunJson,
  type TranslateRunOptions,
} from "./doc-translate.js";
import { runTranslateUI } from "./translate-ui-strings.js";
import { TranslationCache } from "../core/cache.js";
import { createTranslationEditorApp, resolveEditCacheStaticDir } from "../server/translation-editor.js";

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

function withConfig(cmd: Command): { config: string; cwd: string } {
  const o = cmd.optsWithGlobals() as { config?: string };
  const cwd = process.cwd();
  return { config: resolveConfigPath(o.config, cwd), cwd };
}

const program = new Command();

program
  .name("ai-i18n-tools")
  .description("Unified i18n toolkit for React apps and documentation")
  .version(version)
  .option("-c, --config <path>", "Config file path", DEFAULT_CONFIG_FILENAME)
  .option("-v, --verbose", "Verbose logging", false);

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
      console.log(`[extract] Found ${s.found} strings`);
      console.log(`[extract] ${s.added} new, ${s.updated} updated`);
      console.log(`[extract] Written to: ${s.outPath}`);
    } catch (e) {
      console.error(`[extract] ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    }
  });

function buildTranslateOpts(
  cmd: Command,
  cwd: string
): { locales: string[]; uiLocales: string[]; translateOpts: TranslateRunOptions } {
  const g = cmd.optsWithGlobals() as { verbose?: boolean; config?: string };
  const o = cmd.opts() as {
    locale?: string;
    path?: string;
    dryRun?: boolean;
    force?: boolean;
    noCache?: boolean;
    type?: string;
    svgOnly?: boolean;
    jsonOnly?: boolean;
    noSvg?: boolean;
    noJson?: boolean;
  };
  const config = loadConfigOrExit(resolveConfigPath(g.config, cwd), cwd);
  const locales = resolveLocalesForDocumentation(config, cwd, o.locale ?? null);
  const uiLocales = resolveLocalesForUI(config, cwd, o.locale ?? null);
  const translateOpts: TranslateRunOptions = {
    cwd,
    locales,
    dryRun: Boolean(o.dryRun),
    force: Boolean(o.force),
    noCache: Boolean(o.noCache),
    verbose: Boolean(g.verbose),
    pathFilter: o.path,
    typeFilter: o.type as TranslateRunOptions["typeFilter"],
    svgOnly: Boolean(o.svgOnly),
    jsonOnly: Boolean(o.jsonOnly),
    noSvg: Boolean(o.noSvg),
    noJson: Boolean(o.noJson),
  };
  return { locales, uiLocales, translateOpts };
}

program
  .command("translate")
  .description("Translate markdown / JSON / SVG per config features")
  .option(
    "-l, --locale <codes>",
    "Target locales (comma-separated); docs: documentation.targetLocales if set, else targetLocales; UI: unchanged"
  )
  .option("-p, --path <path>", "Limit to file or directory prefix")
  .option("--dry-run", "No writes, no API calls", false)
  .option("--force", "Re-translate even when cache matches", false)
  .option("--no-cache", "Bypass SQLite cache", false)
  .option("--type <kind>", "markdown | json | svg")
  .option("--svg-only", "SVG only", false)
  .option("--json-only", "JSON only", false)
  .option("--no-svg", "Skip SVG", false)
  .option("--no-json", "Skip JSON", false)
  .option("--no-ui", "Skip UI strings translation (strings.json → locale JSON)", false)
  .action(async (_a, cmd) => {
    const { cwd } = withConfig(cmd);
    const config = loadConfigOrExit(resolveConfigPath((cmd.optsWithGlobals() as { config?: string }).config, cwd), cwd);
    const { uiLocales, translateOpts } = buildTranslateOpts(cmd, cwd);
    const noUi = Boolean((cmd.opts() as { noUi?: boolean }).noUi);

    if (config.features.translateUIStrings && !noUi) {
      try {
        const ui = await runTranslateUI(config, {
          cwd,
          locales: uiLocales,
          force: translateOpts.force,
          dryRun: translateOpts.dryRun,
          verbose: translateOpts.verbose,
        });
        console.log(
          `[translate][ui] updated=${ui.stringsUpdated} locales=${ui.localesTouched.join(",")} tokens=${ui.inputTokens}/${ui.outputTokens} cost≈$${ui.costUsd.toFixed(6)}`
        );
      } catch (e) {
        console.error(`[translate][ui] ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
    }

    const md = filterIgnored(
      collectFilesByExtension(config.documentation.contentPaths, [".md", ".mdx"], cwd),
      cwd
    );
    const svg = filterIgnored(
      collectFilesByExtension(config.documentation.contentPaths, [".svg"], cwd),
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
      const sum = await runTranslate(config, translateOpts, { markdown: md, json: jsonFiles, svg }, jsonRoot);
      console.log(
        `[translate] written=${sum.filesWritten} skipped=${sum.filesSkipped} tokens=${sum.inputTokens}/${sum.outputTokens} cost≈$${(sum.costUsd ?? 0).toFixed(6)}`
      );
    } catch (e) {
      console.error(`[translate] ${e instanceof Error ? e.message : String(e)}`);
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
  .action(async (_a, cmd) => {
    const { cwd } = withConfig(cmd);
    const config = loadConfigOrExit(resolveConfigPath((cmd.optsWithGlobals() as { config?: string }).config, cwd), cwd);
    const g = cmd.optsWithGlobals() as { verbose?: boolean };
    const o = cmd.opts() as { locale?: string; dryRun?: boolean; force?: boolean };
    const locales = resolveLocalesForUI(config, cwd, o.locale ?? null);
    if (!config.features.translateUIStrings) {
      console.error("[translate-ui] Enable features.translateUIStrings in config.");
      process.exit(1);
    }
    try {
      const ui = await runTranslateUI(config, {
        cwd,
        locales,
        force: Boolean(o.force),
        dryRun: Boolean(o.dryRun),
        verbose: Boolean(g.verbose),
      });
      console.log(
        `[translate-ui] updated=${ui.stringsUpdated} locales=${ui.localesTouched.join(",")} tokens=${ui.inputTokens}/${ui.outputTokens} cost≈$${ui.costUsd.toFixed(6)}`
      );
    } catch (e) {
      console.error(`[translate-ui] ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    }
  });

program
  .command("sync")
  .description("extract then translate (convenience)")
  .option("-l, --locale <codes>", "Target locales for translate step")
  .option("-p, --path <path>", "Limit translate to path prefix")
  .option("--dry-run", "No writes / no API", false)
  .option("--force", "Force re-translate", false)
  .option("--no-cache", "Bypass cache", false)
  .option("--no-ui", "Skip UI strings translation", false)
  .action(async (_a, cmd) => {
    const { cwd } = withConfig(cmd);
    const config = loadConfigOrExit(resolveConfigPath((cmd.optsWithGlobals() as { config?: string }).config, cwd), cwd);
    const noUi = Boolean((cmd.opts() as { noUi?: boolean }).noUi);
    const { uiLocales, translateOpts } = buildTranslateOpts(cmd, cwd);
    if (config.features.extractUIStrings) {
      try {
        const s = runExtract(config, cwd);
        console.log(`[sync][extract] ${s.found} strings → ${s.outPath}`);
      } catch (e) {
        console.error(`[sync][extract] ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
    }
    if (config.features.translateUIStrings && !noUi) {
      try {
        const ui = await runTranslateUI(config, {
          cwd,
          locales: uiLocales,
          force: translateOpts.force,
          dryRun: translateOpts.dryRun,
          verbose: translateOpts.verbose,
        });
        console.log(
          `[sync][ui] updated=${ui.stringsUpdated} tokens=${ui.inputTokens}/${ui.outputTokens}`
        );
      } catch (e) {
        console.error(`[sync][ui] ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
    }
    const md = filterIgnored(
      collectFilesByExtension(config.documentation.contentPaths, [".md", ".mdx"], cwd),
      cwd
    );
    const svg = filterIgnored(
      collectFilesByExtension(config.documentation.contentPaths, [".svg"], cwd),
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
      const sum = await runTranslate(config, translateOpts, { markdown: md, json: jsonFiles, svg }, jsonRoot);
      console.log(
        `[sync][translate] written=${sum.filesWritten} skipped=${sum.filesSkipped} tokens=${sum.inputTokens}/${sum.outputTokens}`
      );
    } catch (e) {
      console.error(`[sync][translate] ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
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
  .description("Clean stale cache rows and/or orphaned filepath rows")
  .option("--dry-run", "Show only", false)
  .option("--stale", "Remove rows with null last_hit_at / empty filepath", false)
  .option("--orphaned", "Remove cache rows whose filepath no longer exists on disk", false)
  .option("--backup <path>", "SQLite backup path before mutations")
  .action(async (opts: { dryRun?: boolean; stale?: boolean; orphaned?: boolean; backup?: string }, cmd) => {
    const { config: cfgPath, cwd } = withConfig(cmd);
    const loaded = loadConfigOrExit(cfgPath, cwd);
    const cacheDir = path.join(cwd, loaded.documentation.cacheDir);
    const cache = new TranslationCache(cacheDir);

    if (opts.backup && !opts.dryRun) {
      await cache.backupTo(path.resolve(cwd, opts.backup));
      console.log(`[cleanup] Backup → ${opts.backup}`);
    }

    if (opts.stale) {
      const { count, deletedRows } = cache.cleanupStaleTranslations(opts.dryRun);
      console.log(`[cleanup] stale: ${count} row(s)${opts.dryRun ? " (dry-run)" : ""}`);
      if (opts.dryRun && deletedRows.length) {
        console.log(deletedRows.slice(0, 20).map((r) => `  ${r.source_hash} ${r.locale}`).join("\n"));
      }
    }

    if (opts.orphaned) {
      let n = 0;
      for (const fp of cache.getUniqueFilepaths()) {
        const abs = path.join(cwd, fp);
        if (!fs.existsSync(abs)) {
          if (!opts.dryRun) {
            n += cache.deleteByFilepath(fp);
          } else {
            n += 1;
          }
        }
      }
      console.log(`[cleanup] orphaned filepath rows: ${n}${opts.dryRun ? " (dry-run)" : ""}`);
    }

    if (!opts.stale && !opts.orphaned) {
      console.log("Specify --stale and/or --orphaned (see --help).");
    }

    cache.close();
  });

program
  .command("edit")
  .alias("edit-cache")
  .description("Launch local web UI for cache segments, strings.json, and glossary CSV")
  .option("-p, --port <n>", "Port", "8787")
  .action((_opts: { port?: string }, cmd) => {
    const { config: cfgPath, cwd } = withConfig(cmd);
    const config = loadConfigOrExit(cfgPath, cwd);
    const port = parseInt((cmd.opts() as { port?: string }).port || "8787", 10);
    const cache = new TranslationCache(path.join(cwd, config.documentation.cacheDir));
    const stringsPath = config.glossary?.uiGlossaryFromStringsJson
      ? path.join(cwd, config.glossary.uiGlossaryFromStringsJson)
      : resolveStringsJsonPath(config, cwd);
    const glossaryPath = config.glossary?.userGlossary
      ? path.join(cwd, config.glossary.userGlossary)
      : null;

    const app = createTranslationEditorApp(cache, {
      cwd,
      stringsJsonPath: stringsPath,
      glossaryUserPath: glossaryPath,
      targetLocales: config.targetLocales,
    });

    const staticDir = resolveEditCacheStaticDir();
    if (fs.existsSync(staticDir)) {
      app.use(express.static(staticDir));
    } else {
      console.warn(`[edit] Static dir missing: ${staticDir}`);
    }

    const server = http.createServer(app);
    server.listen(port, () => {
      console.log(`[edit] http://127.0.0.1:${port}/`);
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
