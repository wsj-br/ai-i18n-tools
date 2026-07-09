#!/usr/bin/env node
import { Command, InvalidArgumentError, type Help } from "commander";

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
  initConfigTemplates,
  writeInitConfigFile,
  toDocTranslateConfig,
} from "../core/config.js";
import { documentationFileTrackingKey } from "../core/doc-file-tracking.js";
import { resolveCacheTrackingKeyToAbs } from "../core/cache-tracking-keys.js";
import {
  getDocumentationTargetLocaleCodes,
  getJsonTargetLocaleCodes,
  resolveLocalesForDocumentation,
  resolveLocalesForSvg,
  resolveLocalesForUI,
} from "../core/ui-languages.js";
import { jsonBlockFileTrackingKey } from "../core/doc-file-tracking.js";
import { resolveContentPathEntries } from "../core/resolve-content-paths.js";
import { expandJsonBlockOutputPath } from "./translate-json-run.js";
import {
  loadConfigOrExit,
  resolveStringsJsonPath,
  hashFileContent,
  resolveTranslatedOutputPath,
  writeAtomicUtf8,
} from "./helpers.js";
import { normalizeLocale } from "../core/config.js";
import { collectFilesByExtension, collectFilesRelativeToRoot } from "./file-utils.js";
import { filterFumadocsDotMarkdownSources } from "../core/fumadocs-dot-source-filter.js";
import { loadTranslateIgnore, isIgnored } from "../utils/ignore-parser.js";
import { loadDotenv } from "../utils/load-dotenv.js";
import { runExtract } from "./extract-strings.js";
import { runMarkHtml } from "./mark-html.js";
import {
  runTranslate,
  shouldRunJson,
  type TranslateRunOptions,
  matchesPathFilter,
  normalizePathFilterForProjectRoot,
  jsonFileProjectRelativePath,
  augmentMarkdownFilesFromPathFilter,
  augmentAstroFilesFromPathFilter,
} from "./doc-translate.js";
import { runTranslateSvg } from "./translate-svg.js";
import { runTranslateUI } from "./translate-ui-strings.js";
import { runProofreadUI } from "./proofread-ui.js";
import { runCheckMarkdown } from "./check-markdown.js";
import { runExportUIXliff } from "./export-ui-xliff.js";
import {
  logGenerateUiLanguagesWarnings,
  resolveDefaultUiLanguagesMasterPath,
  runGenerateUiLanguages,
} from "./generate-ui-languages.js";
import { TranslationCache } from "../core/cache.js";
import { setupLogOutput } from "./log-output.js";
import { stripAnsi } from "../utils/logger.js";
import { displayWidth } from "../utils/table.js";
import {
  initUiI18nFromEnvironment,
  t,
  uiLocaleDirection,
  loadUiBundle,
  getUiLocale,
} from "../i18n/index.js";
import {
  createRunInterruptScope,
  exitIfRunInterrupted,
  isRunInterruptedError,
} from "../utils/run-interrupt.js";
import {
  createTranslationDashboardApp,
  resolveDashboardAppStaticDir,
} from "../server/translation-dashboard.js";
import { pluralTranslatedLocaleHasContent } from "../core/plural-forms.js";
import { isPluralStringsEntry, type I18nConfig } from "../core/types.js";
import { BUILD_TIMESTAMP_ISO } from "../build-info.generated.js";
import { computeProjectStats } from "../core/project-stats.js";
import { parseSlugStyle, resolvePymdownOptions, runWriteHeadingIds } from "./write-heading-ids.js";
import { runCheckModels } from "./check-models.js";
import { runListModels } from "./list-models.js";
import { runBenchModels } from "./bench-models.js";
import { runListLanguages } from "./list-languages.js";
import { runCleanTemp } from "./clean-temp.js";
import { runPurgeLocale } from "./purge-locale.js";

function openBrowser(url: string): void {
  const onErr = (err: Error | null) => {
    if (err)
      console.warn(t("[dashboard] Failed to open browser: {{error}}", { error: err.message }));
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

/** Default for `dashboard --port`. Avoids common Windows TCP excluded ranges (e.g. Hyper-V 8705–8804). */
const DEFAULT_DASHBOARD_PORT = 8675;

function listenTranslationDashboardServer(
  server: http.Server,
  requestedPort: number,
  onListening: (actualPort: number) => void
): void {
  const maxPort = Math.min(requestedPort + 999, 65535);
  let current = requestedPort;

  const attempt = (): void => {
    server.removeAllListeners("error");
    /** Avoid stacking `listening` callbacks when retrying after `listen()` fails (e.g. `EADDRINUSE`). */
    server.removeAllListeners("listening");
    server.once("error", (err: NodeJS.ErrnoException) => {
      const retryable =
        err.code === "EADDRINUSE" ||
        err.code === "EACCES" ||
        err.code === "EPERM" ||
        err.code === "EADDRNOTAVAIL";
      if (retryable && current < maxPort) {
        current += 1;
        attempt();
      } else {
        console.error(
          chalk.red(
            t("[dashboard] Failed to bind (port {{port}}): {{error}}", {
              port: current,
              error: err.message,
            })
          )
        );
        process.exit(1);
      }
    });
    server.listen(current, "127.0.0.1", () => {
      server.removeAllListeners("error");
      onListening(current);
    });
  };
  attempt();
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

function formatVersionOutput(): string {
  const build = BUILD_TIMESTAMP_ISO.trim() !== "" ? BUILD_TIMESTAMP_ISO.trim() : "unknown";
  return `${version} - ${build}`;
}

// Resolve the tool's own UI locale before building the program, so that command/option help text
// (constructed at module load) and all subsequent output are localized. Config `uiLanguage` is
// applied later, once a command loads its config (see loadConfigOrExit), without disturbing the
// higher-priority --ui-lang flag / AI_I18N_LANG env var.
initUiI18nFromEnvironment();

/** Plain entries store `translated[locale]` as a string; plural entries store per-CLDR-form maps. */
function uiStringsEntryTranslatedForLocale(entry: unknown, locale: string): boolean {
  if (entry === null || typeof entry !== "object") {
    return false;
  }
  const translated = (entry as { translated?: Record<string, unknown> }).translated;
  const value = translated?.[locale];
  if (value === undefined) {
    return false;
  }
  if (isPluralStringsEntry(entry as never)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }
    return pluralTranslatedLocaleHasContent(value as Record<string, unknown>, locale);
  }
  return typeof value === "string" && value.trim().length > 0;
}

function filterIgnored(files: string[], cwd: string): string[] {
  const ig = loadTranslateIgnore(".translate-ignore", cwd);
  return files.filter((f) => !isIgnored(ig, path.join(cwd, f), cwd));
}

/** Visible terminal-column width of a (possibly ANSI-colored) string. */
function visWidth(s: string): number {
  return displayWidth(stripAnsi(s));
}

/** When set, keep only markdown/JSON files that fall under the project-root-relative path filter. */
function filterDocumentationFilesByPathFilter(
  projectRoot: string,
  jsonAbsRoot: string,
  md: string[],
  jsonFiles: string[],
  astro: string[],
  pathFilter: string | undefined
): { markdown: string[]; json: string[]; astro: string[] } {
  if (!pathFilter?.trim()) {
    return { markdown: md, json: jsonFiles, astro };
  }
  return {
    markdown: md.filter((r) => matchesPathFilter(r, pathFilter)),
    json: jsonFiles.filter((r) =>
      matchesPathFilter(jsonFileProjectRelativePath(projectRoot, jsonAbsRoot, r), pathFilter)
    ),
    astro: astro.filter((r) => matchesPathFilter(r, pathFilter)),
  };
}

function warnAndAugmentMarkdownForExplicitPath(
  projectRoot: string,
  pathFilter: string | undefined,
  blockIndex: number,
  config: I18nConfig,
  markdownDiscovered: string[]
): string[] {
  const { markdown, warnings } = augmentMarkdownFilesFromPathFilter(
    projectRoot,
    pathFilter,
    blockIndex,
    config.docs,
    markdownDiscovered
  );
  for (const w of warnings) {
    console.warn(chalk.yellow(`⚠️  ${w}`));
  }
  return markdown;
}

function warnAndAugmentAstroForExplicitPath(
  projectRoot: string,
  pathFilter: string | undefined,
  blockIndex: number,
  config: I18nConfig,
  astroDiscovered: string[]
): string[] {
  const { astro, warnings } = augmentAstroFilesFromPathFilter(
    projectRoot,
    pathFilter,
    blockIndex,
    config.docs,
    astroDiscovered
  );
  for (const w of warnings) {
    console.warn(chalk.yellow(`⚠️  ${w}`));
  }
  return astro;
}

function resolveCliPathOrFile(opts: { path?: string; file?: string }): string | undefined {
  const hasP = opts.path !== undefined && String(opts.path).trim() !== "";
  const hasF = opts.file !== undefined && String(opts.file).trim() !== "";
  if (hasP && hasF) {
    throw new Error(t("Use either --path or --file, not both"));
  }
  if (hasP) {
    return String(opts.path).trim();
  }
  if (hasF) {
    return String(opts.file).trim();
  }
  return undefined;
}

/** Warn when `--path` / `--file` was set and the path does not exist (file or directory). */
function warnIfCliPathOrFileNotFound(
  projectRoot: string,
  opts: { path?: string; file?: string }
): void {
  let raw: string | undefined;
  try {
    raw = resolveCliPathOrFile(opts);
  } catch {
    return;
  }
  if (raw === undefined) {
    return;
  }
  const trimmed = String(raw).trim();
  const resolved = path.isAbsolute(trimmed)
    ? path.normalize(trimmed)
    : path.resolve(projectRoot, trimmed);
  if (!fs.existsSync(resolved)) {
    console.warn(chalk.yellow(t("⚠️  path/file does not exist: {{path}}", { path: trimmed })));
  }
}

function withConfig(cmd: Command): {
  configFlag: string | undefined;
  cwd: string;
  providerOverride: string | undefined;
} {
  const o = cmd.optsWithGlobals() as { config?: string; provider?: string };
  const provider = o.provider?.trim();
  return {
    configFlag: o.config,
    cwd: process.cwd(),
    providerOverride: provider && provider.length > 0 ? provider : undefined,
  };
}

/** Commander default order puts global options after command options; list globals first. */
function formatCliHelp(cmd: Command, helper: Help): string {
  const termWidth = helper.padWidth(cmd, helper);
  const helpWidth = helper.helpWidth ?? 80;

  const formatLine = (term: string, description: string): string =>
    helper.formatItem(term, termWidth, description, helper);

  let output: string[] = [
    `${helper.styleTitle(t("Usage:"))} ${helper.styleUsage(helper.commandUsage(cmd))}`,
    "",
  ];

  const commandDescription = t(helper.commandDescription(cmd));
  if (commandDescription.length > 0) {
    output = output.concat([
      helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth),
      "",
    ]);
  }

  const argumentList = helper
    .visibleArguments(cmd)
    .map((argument) =>
      formatLine(
        helper.styleArgumentTerm(helper.argumentTerm(argument)),
        helper.styleArgumentDescription(t(helper.argumentDescription(argument)))
      )
    );
  output = output.concat(helper.formatItemList(t("Arguments:"), argumentList, helper));

  if (helper.showGlobalOptions) {
    const globalOptionList = helper
      .visibleGlobalOptions(cmd)
      .map((option) =>
        formatLine(
          helper.styleOptionTerm(helper.optionTerm(option)),
          helper.styleOptionDescription(t(helper.optionDescription(option)))
        )
      );
    output = output.concat(helper.formatItemList(t("Global Options:"), globalOptionList, helper));
  }

  // Commander's default group headings arrive as plain strings via groupItems; declaring them as
  // t() literals here both registers them for extraction and localizes the default groups. Custom
  // help-group headings still go through t(group) below.
  const DEFAULT_OPTIONS_GROUP = "Options:";
  const DEFAULT_COMMANDS_GROUP = "Commands:";
  const defaultOptionsHeading = t("Options:");
  const defaultCommandsHeading = t("Commands:");

  const optionGroups = helper.groupItems(
    [...cmd.options],
    helper.visibleOptions(cmd),
    (option) => option.helpGroupHeading ?? DEFAULT_OPTIONS_GROUP
  );
  optionGroups.forEach((options, group) => {
    const optionList = options.map((option) =>
      formatLine(
        helper.styleOptionTerm(helper.optionTerm(option)),
        helper.styleOptionDescription(t(helper.optionDescription(option)))
      )
    );
    const heading = group === DEFAULT_OPTIONS_GROUP ? defaultOptionsHeading : t(group);
    output = output.concat(helper.formatItemList(heading, optionList, helper));
  });

  const commandGroups = helper.groupItems(
    [...cmd.commands],
    helper.visibleCommands(cmd),
    (sub) => sub.helpGroup() || DEFAULT_COMMANDS_GROUP
  );
  commandGroups.forEach((commands, group) => {
    const commandList = commands.map((sub) =>
      formatLine(
        helper.styleSubcommandTerm(helper.subcommandTerm(sub)),
        helper.styleSubcommandDescription(t(helper.subcommandDescription(sub)))
      )
    );
    const heading = group === DEFAULT_COMMANDS_GROUP ? defaultCommandsHeading : t(group);
    output = output.concat(helper.formatItemList(heading, commandList, helper));
  });

  return output.join("\n");
}

/** Appended after the root command list (`ai-i18n-tools --help`). */
// Surrounding newlines stay outside t(); the extractor trims catalog keys, so a leading/trailing
// blank line in the argument would not match the trimmed key at runtime.
const ROOT_CLI_HELP_AFTER = `\n${t(`More detail:
  ai-i18n-tools <command> --help          all options for that command
  ai-i18n-tools help <command>            same output

Target locales (-l / --locale):
  translate-docs, translate-svg, translate-ui, sync, sync-ui, and export-ui-xliff accept
  -l, --locale <codes> with comma-separated BCP-47 codes (e.g. de,fr,pt-BR).
  When omitted, defaults come from config and ui-languages.json (see docs).

  proofread-ui uses -l, --locale <code> for a single source locale to review.

Related globals (every command): -c/--config, -v/--verbose, -P/--provider, -w/--write-logs.

Provider override (-P / --provider):
  Selects the active LLM provider for this run, overriding the config "provider" key.
  The name must be configured under "providers" (e.g. -P openai). Handy when several
  providers are configured and you want to switch without editing the config file.`)}\n`;

// Load `.env` from the current working directory so provider API keys are
// available in non-interactive shells (e.g. agent-run commands) that do not
// source `.envrc`/`direnv`. Existing environment variables are not overridden.
loadDotenv();

const program = new Command();

program
  .name("ai-i18n-tools")
  .description(
    t(
      "Unified i18n toolkit for Node.js apps and documentation with AI translation (v{{version}})",
      {
        version,
      }
    )
  )
  .version(formatVersionOutput(), "-V, --version", t("show the version number"))
  .option("-c, --config <path>", t("Config file path"), DEFAULT_CONFIG_FILENAME)
  .option("-v, --verbose", t("Verbose logging"), false)
  .option(
    "-P, --provider <name>",
    t(
      "Active LLM provider (overrides the config `provider` key; must be configured under `providers`)"
    )
  )
  .option(
    "-w, --write-logs [path]",
    t("Tee console output to a .log file (default path: under cacheDir)")
  )
  .option(
    "-L, --ui-lang <code>",
    t(
      "Language for this tool's own UI/logs (BCP-47, e.g. es, pt-BR). Overrides AI_I18N_LANG and config uiLanguage."
    )
  )
  // Register Commander's built-in help text as a catalog key so it (and every subcommand's -h, plus
  // the `help` command) is localized via the render-time t() in formatCliHelp.
  .helpOption("-h, --help", t("display help for command"));

program.configureHelp({
  showGlobalOptions: true,
  formatHelp: formatCliHelp,
});

program
  .command("version")
  .description(t("Show version and build time"))
  .action(() => {
    console.log(formatVersionOutput());
  });

program
  .command("check-models")
  .description(
    t(
      "Verify openrouter.translationModels against OpenRouter's catalog and print input/output pricing (USD per 1M tokens)"
    )
  )
  .action(async (_opts, cmd: Command) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config } = loadConfigOrExit(configFlag, cwd, providerOverride);
    try {
      const { exitCode } = await runCheckModels(config);
      process.exitCode = exitCode;
    } catch {
      process.exitCode = 1;
    }
  });

program
  .command("list-models")
  .description(
    t(
      "List the models advertised by the active provider's OpenAI-compatible `GET /models` endpoint (active provider follows the config `provider` key; override with -P/--provider). Shows input/output pricing (USD per 1M tokens) when the provider returns it"
    )
  )
  .action(async (_opts, cmd: Command) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config } = loadConfigOrExit(configFlag, cwd, providerOverride);
    try {
      const { exitCode } = await runListModels(config);
      process.exitCode = exitCode;
    } catch {
      process.exitCode = 1;
    }
  })
  .addHelpText(
    "after",
    `\n${t(`Examples:
  ai-i18n-tools list-models
  ai-i18n-tools -P openai list-models`)}\n`
  );

program
  .command("bench-models")
  .description(
    t(
      "Benchmark each configured translation model by translating a sample in isolation (no fallback). Prints model id, input/output tokens, wall-clock time, and USD cost"
    )
  )
  .option(
    "--model <ids>",
    t("Comma-separated model ids to benchmark (default: all configured model ids from translationModels, uiModels, and localeModels)")
  )
  .option("--text <text>", t("Inline sample text to translate (overrides --file and the default)"))
  .option("--file <path>", t("Read the sample text from a file (project-relative or absolute)"))
  .option("--source <locale>", t("Source locale (default: config sourceLocale)"))
  .option(
    "--target <locale>",
    t("Target locale (default: first configured documentation target locale)")
  )
  .action(async (_opts, cmd: Command) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const o = cmd.opts() as {
      model?: string;
      text?: string;
      file?: string;
      source?: string;
      target?: string;
    };
    try {
      const { exitCode } = await runBenchModels(config, projectRoot, {
        models: o.model ? o.model.split(",") : undefined,
        text: o.text,
        file: o.file,
        source: o.source,
        target: o.target,
      });
      process.exitCode = exitCode;
    } catch {
      process.exitCode = 1;
    }
  })
  .addHelpText(
    "after",
    `\n${t(`Examples:
  ai-i18n-tools bench-models
  ai-i18n-tools bench-models --target fr-FR
  ai-i18n-tools bench-models --model openai/gpt-5.3-codex,google/gemini-3-flash-preview
  ai-i18n-tools bench-models --file docs/intro.md --target de-DE`)}\n`
  );

program
  .command("list-languages")
  .description(
    t(
      "List the bundled UI languages catalog (data/ui-languages-complete.json) formatted for humans; pass an optional SEARCH term to filter by code, native label, English name, or text direction (case-insensitive)"
    )
  )
  .argument("[search]", t("Optional case-insensitive term to filter the catalog entries"))
  .action((search?: string) => {
    const { exitCode } = runListLanguages(search);
    process.exitCode = exitCode;
  })
  .addHelpText(
    "after",
    `\n${t(`Examples:
  ai-i18n-tools list-languages
  ai-i18n-tools list-languages portuguese
  ai-i18n-tools list-languages rtl
  ai-i18n-tools list-languages zh`)}\n`
  );

program
  .command("init")
  .description(t("Write starter ai-i18n-tools JSON config"))
  .option("-o, --output <path>", t("config file path"), DEFAULT_CONFIG_FILENAME)
  .option(
    "-t, --template <name>",
    "ui-markdown | ui-docusaurus | ui-starlight | ui-vitepress | ui-nextra | ui-fumadocs | ui-astro-website | ui-json-bundles",
    "ui-markdown"
  )
  .option("--with-translate-ignore", t("Create a starter .translate-ignore"), false)
  .action((opts: { output: string; template: string; withTranslateIgnore?: boolean }) => {
    const tpl = opts.template.toLowerCase();
    const templateMap: Record<string, keyof typeof initConfigTemplates> = {
      "ui-markdown": "uiMarkdown",
      "ui-docusaurus": "uiDocusaurus",
      "ui-starlight": "uiStarlight",
      "ui-vitepress": "uiVitepress",
      "ui-nextra": "uiNextra",
      "ui-fumadocs": "uiFumadocs",
      "ui-astro-website": "uiAstroWebsite",
      "ui-json-bundles": "uiJsonBundles",
    };
    const key = templateMap[tpl];
    if (!key) {
      console.error(
        t(
          'Template must be "ui-markdown", "ui-docusaurus", "ui-starlight", "ui-vitepress", "ui-nextra", "ui-fumadocs", "ui-astro-website", or "ui-json-bundles".'
        )
      );
      process.exitCode = 1;
      return;
    }
    writeInitConfigFile(opts.output, key);
    console.log(t("Wrote {{path}} ({{template}})", { path: opts.output, template: key }));
    if (opts.withTranslateIgnore) {
      const ignorePath = path.join(process.cwd(), ".translate-ignore");
      if (!fs.existsSync(ignorePath)) {
        fs.writeFileSync(
          ignorePath,
          ["node_modules/", ".git/", "*.min.js", "dist/", ""].join("\n"),
          "utf8"
        );
        console.log(t("Wrote .translate-ignore"));
      }
    }
  });

program
  .command("write-heading-ids")
  .description(
    t(
      'Insert `<a id="slug"></a>` on the line before each ATX heading (flat markdown; slug modes align with doctoc / PyMdown / Azure DevOps)'
    )
  )
  .option(
    "-p, --path <path>",
    t("Only process files under this path (file or directory); project-relative or absolute")
  )
  .option("-f, --file <path>", t("Same as --path"))
  .option("--slug-style <mode>", "github | bitbucket | gitlab | pymdown | azure-devops", "github")
  .option("--pymdown-case <mode>", t("With pymdown: lower | title | none (default: lower)"))
  .option("--pymdown-normalize <mode>", t("With pymdown: nfc | nfd | none (default: nfc)"))
  .option("--pymdown-percent-encode", t("With pymdown: percent-encode slug (default on)"), false)
  .option("--no-pymdown-percent-encode", t("With pymdown: disable percent-encoding"), false)
  .option("--dry-run", t("Print files that would change; do not write"), false)
  .action((opts, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const g = cmd.optsWithGlobals() as { verbose?: boolean };
    const o = opts as {
      path?: string;
      file?: string;
      slugStyle?: string;
      pymdownCase?: string;
      pymdownNormalize?: string;
      pymdownPercentEncode?: boolean;
      noPymdownPercentEncode?: boolean;
      dryRun?: boolean;
    };
    const pathRaw = resolveCliPathOrFile({ path: o.path, file: o.file });
    warnIfCliPathOrFileNotFound(projectRoot, { path: o.path, file: o.file });
    let slugStyle;
    try {
      slugStyle = parseSlugStyle(o.slugStyle);
    } catch (e) {
      console.error(
        chalk.red(t("❌ {{error}}", { error: e instanceof Error ? e.message : String(e) }))
      );
      process.exit(1);
    }

    const pymdownFlagsUsed =
      o.pymdownCase !== undefined ||
      o.pymdownNormalize !== undefined ||
      o.pymdownPercentEncode ||
      o.noPymdownPercentEncode;

    if (pymdownFlagsUsed && slugStyle !== "pymdown") {
      console.error(
        chalk.red(t("❌ --pymdown-* options are only valid with --slug-style pymdown."))
      );
      process.exit(1);
    }

    if (o.pymdownPercentEncode && o.noPymdownPercentEncode) {
      console.error(
        chalk.red(
          t("❌ Use either --pymdown-percent-encode or --no-pymdown-percent-encode, not both.")
        )
      );
      process.exit(1);
    }

    let pymdownOpts;
    try {
      pymdownOpts =
        slugStyle === "pymdown"
          ? resolvePymdownOptions({
              pymdownCase: o.pymdownCase,
              pymdownNormalize: o.pymdownNormalize,
              pymdownPercentEncode: o.pymdownPercentEncode,
              noPymdownPercentEncode: o.noPymdownPercentEncode,
            })
          : undefined;
    } catch (e) {
      console.error(
        chalk.red(t("❌ {{error}}", { error: e instanceof Error ? e.message : String(e) }))
      );
      process.exit(1);
    }

    if (!config.docs?.length) {
      console.error(chalk.red(t("❌ [write-heading-ids] config has no docs[] blocks.")));
      process.exit(1);
    }

    try {
      const sum = runWriteHeadingIds({
        cwd: projectRoot,
        config,
        pathRaw,
        slugStyle,
        dryRun: Boolean(o.dryRun),
        verbose: Boolean(g.verbose),
        pymdown: pymdownOpts,
      });
      console.log(
        chalk.green(
          "\n" +
            t("✅ write-heading-ids: {{written}} file(s) updated, {{unchanged}} unchanged", {
              written: sum.filesWritten,
              unchanged: sum.filesUnchanged,
            })
        )
      );
    } catch (e) {
      console.error(
        chalk.red(
          t("❌ [write-heading-ids] {{error}}", {
            error: e instanceof Error ? e.message : String(e),
          })
        )
      );
      process.exit(1);
    }
  });

program
  .command("extract")
  .description(
    t(
      "Extract UI strings to strings.json (t(…) / i18n.t(…), optional package.json description, optional ui-languages englishName)"
    )
  )
  .action(async (_opts, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    try {
      const s = runExtract(config, projectRoot);
      console.log(
        chalk.green(
          t("✅ Extracted {{found}} strings ({{added}} new, {{updated}} updated) → {{outPath}}", {
            found: s.found,
            added: s.added,
            updated: s.updated,
            outPath: s.outPath,
          })
        )
      );
    } catch (e) {
      console.error(
        chalk.red(
          t("❌ [extract] {{error}}", { error: e instanceof Error ? e.message : String(e) })
        )
      );
      process.exit(1);
    }
  });

program
  .command("mark-html")
  .description(
    t(
      "Insert bare data-i18n / data-i18n-title / data-i18n-placeholder markers into HTML so source text is written once (extract then captures it). Does not call an LLM."
    )
  )
  .argument("[paths...]", t("Files/dirs/globs to scan (default: .html/.htm under ui.sourceRoots)"))
  .option("--write", t("Apply changes to disk (default: dry run / report only)"), false)
  .action((paths: string[], opts: { write?: boolean }, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const g = cmd.optsWithGlobals() as { verbose?: boolean };
    try {
      const sum = runMarkHtml({
        cwd: projectRoot,
        config,
        paths,
        write: Boolean(opts.write),
        verbose: Boolean(g.verbose),
      });
      const headline = sum.written
        ? t("✅ mark-html: {{changed}}/{{scanned}} file(s) updated (+{{added}} marker(s))", {
            changed: sum.filesChanged,
            scanned: sum.filesScanned,
            added: sum.markersAdded,
          })
        : t(
            "✅ mark-html (dry run): {{changed}}/{{scanned}} file(s) would change (+{{added}} marker(s)); re-run with --write to apply",
            { changed: sum.filesChanged, scanned: sum.filesScanned, added: sum.markersAdded }
          );
      console.log(chalk.green("\n" + headline));
    } catch (e) {
      console.error(
        chalk.red(
          t("❌ [mark-html] {{error}}", { error: e instanceof Error ? e.message : String(e) })
        )
      );
      process.exit(1);
    }
  });

function parsePositiveInt(optionLabel: string, value: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new InvalidArgumentError(
      t('{{label}} must be a positive integer (got "{{value}}")', { label: optionLabel, value })
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
  config: I18nConfig,
  projectRoot: string,
  logPath?: string
): { locales: string[]; uiLocales: string[]; translateOpts: TranslateRunOptions } {
  const g = cmd.optsWithGlobals() as { verbose?: boolean; config?: string };
  const o = cmd.opts() as {
    locale?: string;
    path?: string;
    file?: string;
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
    emphasisPlaceholders?: boolean;
    noEmphasisPlaceholders?: boolean;
    debugFailed?: boolean;
  };
  const locales = resolveLocalesForDocumentation(config, projectRoot, o.locale ?? null);
  const uiLocales = resolveLocalesForUI(config, projectRoot, o.locale ?? null);
  const pathFilterRaw = resolveCliPathOrFile({ path: o.path, file: o.file });
  warnIfCliPathOrFileNotFound(projectRoot, { path: o.path, file: o.file });
  const translateOpts: TranslateRunOptions = {
    cwd: projectRoot,
    locales,
    dryRun: Boolean(o.dryRun),
    force: Boolean(o.force),
    forceUpdate: Boolean(o.forceUpdate),
    noCache: Boolean(o.noCache),
    verbose: Boolean(g.verbose),
    pathFilter: normalizePathFilterForProjectRoot(projectRoot, pathFilterRaw),
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
    emphasisPlaceholdersCli: Boolean(o.emphasisPlaceholders),
    noEmphasisPlaceholdersCli: Boolean(o.noEmphasisPlaceholders),
    debugFailed: Boolean(o.debugFailed),
  };
  return { locales, uiLocales, translateOpts };
}

function parseTranslatePromptFormat(raw: string | undefined): TranslateRunOptions["promptFormat"] {
  if (raw === undefined || raw === "") {
    return "json-array";
  }
  if (raw === "xml" || raw === "json-array" || raw === "json-object") {
    return raw;
  }
  throw new InvalidArgumentError(
    t("Invalid --prompt-format: {{value}} (expected xml, json-array, or json-object)", {
      value: raw,
    })
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
    promptFormat: "json-array",
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
  noJson: boolean;
}): Promise<void> {
  const { config, projectRoot, uiLocales, svgLocales, translateOpts, noUi, noSvg, noDocs, noJson } =
    args;
  const interrupt = createRunInterruptScope();
  const sharedOpts: TranslateRunOptions = {
    ...translateOpts,
    abortSignal: interrupt.signal,
  };
  try {
    if (config.features.translateUIStrings && !noUi) {
      try {
        const s = runExtract(config, projectRoot);
        console.log(
          chalk.green(
            t("✅ Extracted {{found}} strings ({{added}} new, {{updated}} updated) → {{outPath}}", {
              found: s.found,
              added: s.added,
              updated: s.updated,
              outPath: s.outPath,
            })
          )
        );
      } catch (e) {
        console.error(
          chalk.red(
            t("❌ [sync][extract] {{error}}", {
              error: e instanceof Error ? e.message : String(e),
            })
          )
        );
        throw e;
      }
      try {
        await runTranslateUI(config, {
          cwd: projectRoot,
          locales: uiLocales,
          force: sharedOpts.force,
          dryRun: sharedOpts.dryRun,
          verbose: sharedOpts.verbose,
          logPath: sharedOpts.logPath,
          concurrency: sharedOpts.concurrency,
          abortSignal: interrupt.signal,
        });
      } catch (e) {
        if (isRunInterruptedError(e)) {
          throw e;
        }
        console.error(
          chalk.red(
            t("❌ [sync][ui] {{error}}", { error: e instanceof Error ? e.message : String(e) })
          )
        );
        throw e;
      }
    }
    if (config.features.translateSVG && config.svg && !noSvg) {
      try {
        const svgOpts: TranslateRunOptions = {
          ...sharedOpts,
          locales: svgLocales,
        };
        await runTranslateSvg(config, svgOpts);
      } catch (e) {
        if (isRunInterruptedError(e)) {
          throw e;
        }
        console.error(
          chalk.red(
            t("❌ [sync][svg] {{error}}", { error: e instanceof Error ? e.message : String(e) })
          )
        );
        throw e;
      }
    }
    if (!noDocs) {
      try {
        for (let bi = 0; bi < config.docs.length; bi++) {
          const block = config.docs[bi]!;
          const view = toDocTranslateConfig(config, block);
          const mdBase = filterIgnored(
            filterFumadocsDotMarkdownSources(
              collectFilesByExtension(block.contentPaths, [".md", ".mdx"], projectRoot),
              view,
              config
            ),
            projectRoot
          );
          const md = warnAndAugmentMarkdownForExplicitPath(
            projectRoot,
            sharedOpts.pathFilter,
            bi,
            config,
            mdBase
          );
          const astroBase = filterIgnored(
            collectFilesByExtension(block.contentPaths, [".astro"], projectRoot),
            projectRoot
          );
          const astro = warnAndAugmentAstroForExplicitPath(
            projectRoot,
            sharedOpts.pathFilter,
            bi,
            config,
            astroBase
          );
          const jsonRoot = block.docusaurusCatalogDir
            ? path.resolve(projectRoot, block.docusaurusCatalogDir)
            : path.resolve(projectRoot, ".");
          const jsonFiles =
            block.docusaurusCatalogDir?.trim() && shouldRunJson(sharedOpts, view)
              ? collectFilesRelativeToRoot(jsonRoot, [".json"])
              : [];
          const {
            markdown: mdScoped,
            json: jsonScoped,
            astro: astroScoped,
          } = filterDocumentationFilesByPathFilter(
            projectRoot,
            jsonRoot,
            md,
            jsonFiles,
            astro,
            sharedOpts.pathFilter
          );
          if (mdScoped.length === 0 && jsonScoped.length === 0 && astroScoped.length === 0) {
            continue;
          }
          await runTranslate(
            view,
            { ...sharedOpts, documentationBlockIndex: bi },
            { markdown: mdScoped, json: jsonScoped, astro: astroScoped },
            jsonRoot
          );
        }
      } catch (e) {
        if (isRunInterruptedError(e)) {
          throw e;
        }
        console.error(
          chalk.red(t("❌ {{error}}", { error: e instanceof Error ? e.message : String(e) }))
        );
        throw e;
      }
    }
    if (!noJson && config.features.translateJson) {
      try {
        const { runTranslateJson } = await import("./translate-json-run.js");
        await runTranslateJson(config, projectRoot, sharedOpts);
      } catch (e) {
        if (isRunInterruptedError(e)) {
          throw e;
        }
        console.error(
          chalk.red(
            t("❌ [sync][json] {{error}}", { error: e instanceof Error ? e.message : String(e) })
          )
        );
        throw e;
      }
    }
  } finally {
    interrupt.dispose();
  }
}

program
  .command("translate-docs")
  .description(
    t(
      "Translate documentation (markdown, JSON) per config; -l/--locale <codes> limits targets (comma-separated; optional)"
    )
  )
  .option(
    "-l, --locale <codes>",
    t(
      "Target locales (comma-separated); default: documentation targets from config (union across docs[]: each block uses its targetLocales if set, otherwise root targetLocales; sourceLocale excluded)"
    )
  )
  .option(
    "-p, --path <path>",
    t("Only translate files under this path (file or directory); project-relative or absolute")
  )
  .option("-f, --file <path>", t("Same as --path"))
  .option("--dry-run", t("No writes, no API calls"), false)
  .option(
    "--force",
    t(
      "Re-translate: clear file tracking for each file and ignore segment cache (not combinable with --force-update)"
    ),
    false
  )
  .option(
    "--force-update",
    t(
      "Re-process files even when file tracking matches; still use segment cache (not combinable with --force)"
    ),
    false
  )
  .option("--stats", t("Show cache statistics and exit"), false)
  .option("--clear-cache [locale]", t("Clear translation cache (all locales, or one locale)"))
  .option("--type <kind>", "markdown | json")
  .option("--json-only", t("JSON only"), false)
  .option("--no-json", t("Skip JSON"), false)
  .option("-j, --concurrency <n>", t("Max parallel target locales (default: config or 3)"))
  .option(
    "-b, --batch-concurrency <n>",
    t("Max parallel batch API calls per file (default: config or 4)")
  )
  .option(
    "--prompt-format <mode>",
    t("Batch segment prompt/response: xml (<seg>/<t>), json-array, or json-object"),
    "json-array"
  )
  .option(
    "--emphasis-placeholders",
    t(
      "Mask markdown emphasis delimiters (**, *, _, ~~) as placeholders before translation for all locales (configuration has precedence over CLI flags)"
    ),
    false
  )
  .option(
    "--no-emphasis-placeholders",
    t(
      "Do not mask markdown emphasis (overrides CJK/RTL default, configuration has precedence over CLI flags)"
    ),
    false
  )
  .option(
    "--debug-failed",
    t("Write detailed FAILED-TRANSLATION logs under cacheDir for quality failures"),
    false
  )
  .action(async (_a, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
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
          "\n" +
            t("❌ Use either --force or --force-update, not both.") +
            "\n" +
            t("   --force: ignore segment cache and clear file tracking for processed files.") +
            "\n" +
            t(
              "   --force-update: re-run outputs when file tracking would skip; segment cache still applies."
            ) +
            "\n"
        )
      );
      cmd.outputHelp();
      process.exit(1);
    }
    if (raw.stats) {
      const cache = new TranslationCache(cacheDir);
      const cacheStats = cache.getStats();
      console.log(chalk.bold("\n" + t("📊 Cache statistics:")));
      console.log(`   ${t("Cached segments: {{count}}", { count: cacheStats.totalSegments })}`);
      console.log(`   ${t("Tracked files: {{count}}", { count: cacheStats.totalFiles })}`);
      console.log(`   ${t("By locale:")}`);
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
              "\n" +
                t('❌ Locale "{{locale}}" is not in documentation target locales.', { locale }) +
                "\n" +
                t("   Configured: {{locales}}", { locales: [...allowed].join(", ") }) +
                "\n"
            )
          );
          cache.close();
          process.exit(1);
        }
      }
      cache.clear(locale);
      console.log(
        chalk.blue(
          locale ? t("✅ Cache cleared for {{locale}}", { locale }) : t("✅ Cache cleared")
        )
      );
      cache.close();
      return;
    }
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "translate-docs");
    let translateOpts: TranslateRunOptions;
    try {
      ({ translateOpts } = buildTranslateOpts(cmd, config, projectRoot, logPath));
    } catch (e) {
      console.error(
        chalk.red(t("❌ {{error}}", { error: e instanceof Error ? e.message : String(e) }))
      );
      process.exit(1);
    }

    let totalSkipped = 0;
    let totalWritten = 0;
    try {
      for (let bi = 0; bi < config.docs.length; bi++) {
        const block = config.docs[bi]!;
        const view = toDocTranslateConfig(config, block);
        const mdBase = filterIgnored(
          filterFumadocsDotMarkdownSources(
            collectFilesByExtension(block.contentPaths, [".md", ".mdx"], projectRoot),
            view,
            config
          ),
          projectRoot
        );
        const md = warnAndAugmentMarkdownForExplicitPath(
          projectRoot,
          translateOpts.pathFilter,
          bi,
          config,
          mdBase
        );
        const astroBase = filterIgnored(
          collectFilesByExtension(block.contentPaths, [".astro"], projectRoot),
          projectRoot
        );
        const astro = warnAndAugmentAstroForExplicitPath(
          projectRoot,
          translateOpts.pathFilter,
          bi,
          config,
          astroBase
        );
        const jsonRoot = block.docusaurusCatalogDir
          ? path.resolve(projectRoot, block.docusaurusCatalogDir)
          : path.resolve(projectRoot, ".");
        const jsonFiles =
          block.docusaurusCatalogDir?.trim() && shouldRunJson(translateOpts, view)
            ? collectFilesRelativeToRoot(jsonRoot, [".json"])
            : [];
        const {
          markdown: mdScoped,
          json: jsonScoped,
          astro: astroScoped,
        } = filterDocumentationFilesByPathFilter(
          projectRoot,
          jsonRoot,
          md,
          jsonFiles,
          astro,
          translateOpts.pathFilter
        );
        if (mdScoped.length === 0 && jsonScoped.length === 0 && astroScoped.length === 0) {
          continue;
        }
        const desc =
          typeof block.description === "string" && block.description.trim()
            ? ` — ${block.description.trim()}`
            : "";
        console.log(
          chalk.gray(
            `\n--- docs[${bi}]${desc} → ${path.resolve(projectRoot, block.outputDir)} (` +
              t("{{md}} md, {{astro}} astro, {{json}} json", {
                md: mdScoped.length,
                astro: astroScoped.length,
                json: jsonScoped.length,
              }) +
              `) ---\n`
          )
        );
        const sum = await runTranslate(
          view,
          { ...translateOpts, documentationBlockIndex: bi },
          { markdown: mdScoped, json: jsonScoped, astro: astroScoped },
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
            t(
              "💡 All files were skipped (cache matches output). Use --force-update to re-process files (using translation cache) or --force to retranslate files"
            )
          )
        );
      }
    } catch (e) {
      if (exitIfRunInterrupted(e)) {
        return;
      }
      console.error(
        chalk.red(
          t("❌ [translate-docs] {{error}}", { error: e instanceof Error ? e.message : String(e) })
        )
      );
      process.exit(1);
    }
  })
  .addHelpText(
    "after",
    `\n${t(`Examples:
  ai-i18n-tools translate-docs -l de,fr
  ai-i18n-tools translate-docs --locale pt-BR --dry-run
  ai-i18n-tools translate-docs --path docs/guide --force-update`)}\n`
  );

program
  .command("translate-json")
  .description(
    t(
      "Translate arbitrary nested JSON per config.json[] (requires features.translateJson); -l/--locale limits targets"
    )
  )
  .option(
    "-l, --locale <codes>",
    t(
      "Target locales (comma-separated); default: union of json[].targetLocales or root targetLocales"
    )
  )
  .option(
    "-p, --path <path>",
    t(
      "Only translate files under this path (file, directory, or glob); project-relative or absolute"
    )
  )
  .option("-f, --file <path>", t("Same as --path"))
  .option("--dry-run", t("No writes, no API calls"), false)
  .option("--force", t("Re-translate: clear file tracking and ignore segment cache"), false)
  .option(
    "--force-update",
    t("Re-process when file tracking matches; segment cache still applies"),
    false
  )
  .option("-j, --concurrency <n>", t("Reserved for future parallel locales"))
  .option(
    "-b, --batch-concurrency <n>",
    t("Max parallel batch API calls per file (default: config or 4)")
  )
  .option(
    "--prompt-format <mode>",
    t("Batch segment prompt/response: xml, json-array, or json-object"),
    "json-array"
  )
  .action(async (_a, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const g = cmd.optsWithGlobals() as { writeLogs?: boolean | string };
    const cacheDir = path.join(projectRoot, config.cacheDir);
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "translate-json");
    let translateOpts: TranslateRunOptions;
    try {
      ({ translateOpts } = buildTranslateOpts(cmd, config, projectRoot, logPath));
    } catch (e) {
      console.error(
        chalk.red(t("❌ {{error}}", { error: e instanceof Error ? e.message : String(e) }))
      );
      process.exit(1);
    }
    try {
      const { runTranslateJson } = await import("./translate-json-run.js");
      await runTranslateJson(config, projectRoot, translateOpts);
    } catch (e) {
      if (exitIfRunInterrupted(e)) {
        return;
      }
      console.error(
        chalk.red(
          t("❌ [translate-json] {{error}}", { error: e instanceof Error ? e.message : String(e) })
        )
      );
      process.exit(1);
    }
  });

program
  .command("translate-svg")
  .description(
    t(
      "Translate SVG files per config.svg (requires features.translateSVG); -l/--locale <codes> limits targets (comma-separated; optional)"
    )
  )
  .option(
    "-l, --locale <codes>",
    t(
      "Target locales (comma-separated); default: sourceLocale plus documentation targets (union across docs[]: each block uses its targetLocales if set, otherwise root targetLocales)"
    )
  )
  .option(
    "-p, --path <path>",
    t("Only translate files under this path (file or directory); project-relative or absolute")
  )
  .option("-f, --file <path>", t("Same as --path"))
  .option("--dry-run", t("No writes, no API calls"), false)
  .option(
    "--force",
    t(
      "Re-translate: clear file tracking for each file and ignore segment cache (not combinable with --force-update)"
    ),
    false
  )
  .option(
    "--force-update",
    t(
      "Re-process files even when file tracking matches; still use segment cache (not combinable with --force)"
    ),
    false
  )
  .option("--no-cache", t("Bypass SQLite cache"), false)
  .option("-j, --concurrency <n>", t("Max parallel target locales (default: config or 3)"))
  .option(
    "-b, --batch-concurrency <n>",
    t("Max parallel batch API calls per file (default: config or 4)")
  )
  .action(async (_a, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const g = cmd.optsWithGlobals() as { writeLogs?: boolean | string };
    const cacheDir = path.join(projectRoot, config.cacheDir);
    const raw = cmd.opts() as { force?: boolean; forceUpdate?: boolean };
    if (raw.force && raw.forceUpdate) {
      console.error(
        chalk.red(
          "\n" +
            t("❌ Use either --force or --force-update, not both.") +
            "\n" +
            t("   --force: ignore segment cache and clear file tracking for processed files.") +
            "\n" +
            t(
              "   --force-update: re-run outputs when file tracking would skip; segment cache still applies."
            ) +
            "\n"
        )
      );
      cmd.outputHelp();
      process.exit(1);
    }
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "translate-svg");
    let translateOpts: TranslateRunOptions;
    try {
      ({ translateOpts } = buildTranslateOpts(cmd, config, projectRoot, logPath));
    } catch (e) {
      console.error(
        chalk.red(t("❌ {{error}}", { error: e instanceof Error ? e.message : String(e) }))
      );
      process.exit(1);
    }
    const localeOpt = cmd.opts() as { locale?: string };
    translateOpts.locales = resolveLocalesForSvg(config, projectRoot, localeOpt.locale ?? null);
    if (!config.features.translateSVG) {
      console.error(chalk.red(t("❌ [translate-svg] Enable features.translateSVG in config.")));
      process.exit(1);
    }
    try {
      await runTranslateSvg(config, translateOpts);
    } catch (e) {
      if (exitIfRunInterrupted(e)) {
        return;
      }
      console.error(
        chalk.red(
          t("❌ [translate-svg] {{error}}", { error: e instanceof Error ? e.message : String(e) })
        )
      );
      process.exit(1);
    }
  })
  .addHelpText(
    "after",
    `\n${t(`Examples:
  ai-i18n-tools translate-svg -l de,ja
  ai-i18n-tools translate-svg --path assets/icons --no-cache`)}\n`
  );

program
  .command("translate-ui")
  .description(
    t(
      "Translate UI strings (strings.json → locale JSON via OpenRouter); -l/--locale <codes> limits targets (comma-separated; optional)"
    )
  )
  .option(
    "-l, --locale <codes>",
    t("Target locales (comma-separated); default: ui-languages.json or config.targetLocales")
  )
  .option("--dry-run", t("No writes, no API calls"), false)
  .option("--force", t("Re-translate all entries per locale"), false)
  .option("-j, --concurrency <n>", t("Max parallel target locales (default: config or 4)"))
  .action(async (_a, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const g = cmd.optsWithGlobals() as { verbose?: boolean; writeLogs?: boolean | string };
    const o = cmd.opts() as {
      locale?: string;
      dryRun?: boolean;
      force?: boolean;
      concurrency?: string;
    };
    const locales = resolveLocalesForUI(config, projectRoot, o.locale ?? null);
    if (!config.features.translateUIStrings) {
      console.error(
        chalk.red(t("❌ [translate-ui] Enable features.translateUIStrings in config."))
      );
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
      if (exitIfRunInterrupted(e)) {
        return;
      }
      console.error(
        chalk.red(
          t("❌ [translate-ui] {{error}}", { error: e instanceof Error ? e.message : String(e) })
        )
      );
      process.exit(1);
    }
  })
  .addHelpText(
    "after",
    `\n${t(`Examples:
  ai-i18n-tools translate-ui -l de,fr
  ai-i18n-tools translate-ui --force --locale es`)}\n`
  );

program
  .command("sync-ui")
  .description(
    t(
      "Extract UI strings, then translate UI strings (requires features.translateUIStrings); -l/--locale <codes> limits targets (comma-separated; optional)"
    )
  )
  .option(
    "-l, --locale <codes>",
    t("Target locales (comma-separated); default: ui-languages.json or config.targetLocales")
  )
  .option("--dry-run", t("No writes / no API"), false)
  .option("--force", t("Re-translate all UI entries per locale"), false)
  .option("-j, --concurrency <n>", t("Max parallel target locales (default: config)"))
  .action(async (_a, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const g = cmd.optsWithGlobals() as { verbose?: boolean; writeLogs?: boolean | string };
    const o = cmd.opts() as {
      locale?: string;
      dryRun?: boolean;
      force?: boolean;
      concurrency?: string;
    };
    const cacheDir = path.join(projectRoot, config.cacheDir);
    const logPath = activateWriteLogs(g.writeLogs, cacheDir, "sync-ui");

    if (!config.features.translateUIStrings) {
      console.error(chalk.red(t("❌ [sync-ui] Enable features.translateUIStrings in config.")));
      process.exit(1);
    }

    try {
      const s = runExtract(config, projectRoot);
      console.log(
        chalk.green(
          t("✅ Extracted {{found}} strings ({{added}} new, {{updated}} updated) → {{outPath}}", {
            found: s.found,
            added: s.added,
            updated: s.updated,
            outPath: s.outPath,
          })
        )
      );
    } catch (e) {
      console.error(
        chalk.red(
          t("❌ [sync-ui][extract] {{error}}", {
            error: e instanceof Error ? e.message : String(e),
          })
        )
      );
      process.exit(1);
    }

    const locales = resolveLocalesForUI(config, projectRoot, o.locale ?? null);
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
      if (exitIfRunInterrupted(e)) {
        return;
      }
      console.error(
        chalk.red(
          t("❌ [sync-ui][ui] {{error}}", { error: e instanceof Error ? e.message : String(e) })
        )
      );
      process.exit(1);
    }
  })
  .addHelpText(
    "after",
    `\n${t(`Examples:
  ai-i18n-tools sync-ui -l de,fr
  ai-i18n-tools sync-ui --locale ja --force`)}\n`
  );

program
  .command("proofread-ui")
  .description(
    t(
      "Run extract (refresh strings.json), then proofread source-locale UI strings via OpenRouter; writes results log under cacheDir"
    )
  )
  .option("-l, --locale <code>", t("BCP-47 locale to proofread (default: config sourceLocale)"))
  .option("--chunk <n>", t("Strings per API batch (default: 50)"), "50")
  .option("-j, --concurrency <n>", t("Max parallel batches (default: config.concurrency)"))
  .option("--dry-run", t("Print batch plan only; no API calls"), false)
  .option("--json", t("Write full JSON report to stdout (human output uses stderr)"), false)
  .action(async (_a, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const g = cmd.optsWithGlobals() as { verbose?: boolean };
    const o = cmd.opts() as {
      locale?: string;
      chunk?: string;
      concurrency?: string;
      dryRun?: boolean;
      json?: boolean;
    };
    try {
      const result = await runProofreadUI(config, {
        cwd: projectRoot,
        locale: o.locale,
        chunkSize: parsePositiveInt("Chunk (--chunk)", o.chunk ?? "50"),
        concurrency:
          o.concurrency !== undefined
            ? parsePositiveInt("Concurrency (-j)", o.concurrency)
            : undefined,
        dryRun: Boolean(o.dryRun),
        verbose: Boolean(g.verbose),
        json: Boolean(o.json),
      });
      if (result.exitWithError) {
        console.error(chalk.red(t("❌ [proofread-ui] {{error}}", { error: result.exitWithError })));
        process.exit(1);
      }
    } catch (e) {
      console.error(
        chalk.red(
          t("❌ [proofread-ui] {{error}}", { error: e instanceof Error ? e.message : String(e) })
        )
      );
      process.exit(1);
    }
  });

program
  .command("check-markdown")
  .description(
    t(
      "Scan documentation markdown for unpaired emphasis / unclosed inline code; print path:line issues; refresh SQLite markdown_source_issues (use --no-cache to skip DB)"
    )
  )
  .option(
    "-p, --path <path>",
    t(
      "Only check files under this path (project-relative or absolute); same idea as translate-docs --path"
    )
  )
  .option("-f, --file <path>", t("Same as --path"))
  .option("--json", t("Write JSON report to stdout (human lines go to stderr)"), false)
  .option("--no-cache", t("Do not read or write the translation cache database"), false)
  .action(async (_a, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const g = cmd.optsWithGlobals() as { verbose?: boolean };
    const o = cmd.opts() as { path?: string; file?: string; json?: boolean; noCache?: boolean };
    warnIfCliPathOrFileNotFound(projectRoot, { path: o.path, file: o.file });
    const pathFilter = normalizePathFilterForProjectRoot(
      projectRoot,
      resolveCliPathOrFile({ path: o.path, file: o.file })
    );
    try {
      const { exitCode } = await runCheckMarkdown({
        cwd: projectRoot,
        config,
        pathFilter,
        json: Boolean(o.json),
        noCache: Boolean(o.noCache),
        verbose: Boolean(g.verbose),
      });
      process.exit(exitCode);
    } catch (e) {
      console.error(
        chalk.red(
          t("❌ [check-markdown] {{error}}", { error: e instanceof Error ? e.message : String(e) })
        )
      );
      process.exit(1);
    }
  });

program
  .command("export-ui-xliff")
  .description(
    t(
      "Export UI strings from strings.json to XLIFF 2.0 (one .xliff per target locale); -l/--locale <codes> selects targets (comma-separated; optional)"
    )
  )
  .option(
    "-l, --locale <codes>",
    t("Target locales (comma-separated); default: ui-languages.json or config.targetLocales")
  )
  .option(
    "-o, --output-dir <path>",
    t("Output directory for .xliff files (default: same directory as strings.json)")
  )
  .option(
    "--untranslated-only",
    t("Include only units that have no translation for the target locale"),
    false
  )
  .option("--dry-run", t("Print paths that would be written without writing files"), false)
  .action((_a, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
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
        chalk.red(
          t("❌ [export-ui-xliff] {{error}}", {
            error: e instanceof Error ? e.message : String(e),
          })
        )
      );
      process.exit(1);
    }
  })
  .addHelpText(
    "after",
    `\n${t(`Examples:
  ai-i18n-tools export-ui-xliff -l de,fr
  ai-i18n-tools export-ui-xliff --locale ja --untranslated-only --dry-run`)}\n`
  );

program
  .command("sync")
  .description(
    t(
      "Extract UI strings (if enabled), then translate UI / SVG (if features.translateSVG + svg) / docs unless skipped with --no-*; -l/--locale <codes> applies to UI, SVG, and docs targets (comma-separated; optional)"
    )
  )
  .option(
    "-l, --locale <codes>",
    t(
      "Comma-separated target locales for translate-ui, translate-svg, and translate-docs steps (optional; defaults from config / ui-languages.json)"
    )
  )
  .option(
    "-p, --path <path>",
    t("Only translate files under this path (docs/SVG); project-relative or absolute")
  )
  .option("-f, --file <path>", t("Same as --path"))
  .option("--dry-run", t("No writes / no API"), false)
  .option(
    "--force",
    t("Docs: clear file tracking and ignore segment cache (not combinable with --force-update)"),
    false
  )
  .option(
    "--force-update",
    t("Docs: re-process even when file tracking matches; segment cache still applies"),
    false
  )
  .option("--no-ui", t("Skip UI strings translation"), false)
  .option(
    "--no-svg",
    t("Skip SVG file translation (when features.translateSVG and config.svg)"),
    false
  )
  .option(
    "--no-docs",
    t("Skip translate-docs (markdown, MDX, Astro, Docusaurus catalog JSON)"),
    false
  )
  .option("--no-json", t("Skip generic json[] translation (translate-json)"), false)
  .option(
    "-j, --concurrency <n>",
    t("Max parallel target locales for translate steps (default: config)")
  )
  .option(
    "-b, --batch-concurrency <n>",
    t("Max parallel batch API calls per file for docs (default: config)")
  )
  .option(
    "--emphasis-placeholders",
    t(
      "Mask markdown emphasis delimiters (**, *, _, ~~) as placeholders before translation for all locales (unless docs[].emphasisPlaceholders overrides); CJK/RTL use this by default when flag is omitted"
    ),
    false
  )
  .option(
    "--no-emphasis-placeholders",
    t(
      "Do not mask markdown emphasis (overrides CJK/RTL default and --emphasis-placeholders when not contradicted by docs[].emphasisPlaceholders)"
    ),
    false
  )
  .option(
    "--debug-failed",
    t("Write detailed FAILED-TRANSLATION logs under cacheDir for quality failures"),
    false
  )
  .action(async (_a, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const syncOpts = cmd.opts() as {
      noUi?: boolean;
      noSvg?: boolean;
      noDocs?: boolean;
      noJson?: boolean;
      force?: boolean;
      forceUpdate?: boolean;
    };
    const noDocs = Boolean(syncOpts.noDocs);
    const noJson = Boolean(syncOpts.noJson);
    if (!noDocs && syncOpts.force && syncOpts.forceUpdate) {
      console.error(
        chalk.red(
          "\n" +
            t("❌ Use either --force or --force-update, not both.") +
            "\n" +
            t("   --force: docs ignore segment cache and clear file tracking.") +
            "\n" +
            t(
              "   --force-update: docs re-run when file tracking would skip; segment cache still applies."
            ) +
            "\n"
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
    let uiLocales: string[];
    let translateOpts: TranslateRunOptions;
    try {
      ({ uiLocales, translateOpts } = buildTranslateOpts(cmd, config, projectRoot, logPath));
    } catch (e) {
      console.error(
        chalk.red(t("❌ {{error}}", { error: e instanceof Error ? e.message : String(e) }))
      );
      process.exit(1);
    }
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
        noJson,
      });
    } catch (e) {
      if (exitIfRunInterrupted(e)) {
        return;
      }
      process.exit(1);
    }
  })
  .addHelpText(
    "after",
    `\n${t(`Examples:
  ai-i18n-tools sync -l de,fr
  ai-i18n-tools sync --locale ja --no-svg --dry-run
  ai-i18n-tools sync --no-docs --path docs/tutorial
  ai-i18n-tools sync --no-json`)}\n`
  );

const DEFAULT_STATUS_MAX_COLUMNS = 9;
/** Default `--max-columns` for `statistics` only (narrower matrices than `status` markdown tables). */
const DEFAULT_STATISTICS_MAX_COLUMNS = 6;

program
  .command("status")
  .description(t("Show UI string coverage and markdown translation status vs cache / output files"))
  .option(
    "--max-columns <n>",
    t("Max locale columns per markdown status table"),
    (v: string) => {
      const n = parseInt(String(v), 10);
      if (!Number.isFinite(n) || n < 1) {
        throw new InvalidArgumentError(t("Must be a positive integer."));
      }
      return n;
    },
    DEFAULT_STATUS_MAX_COLUMNS
  )
  .action((opts: { maxColumns: number }, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const cache = new TranslationCache(path.join(projectRoot, config.cacheDir));
    const locales = getDocumentationTargetLocaleCodes(config);
    const maxColumns = opts.maxColumns;

    const padVis = (s: string, width: number): string => {
      const visLen = visWidth(s);
      return s + " ".repeat(Math.max(0, width - visLen));
    };

    const printMarkdownTableChunk = (chunkLocales: string[], rows: string[][]) => {
      const headers = [t("File"), ...chunkLocales];
      const colW = Math.max(12, ...rows.map((r) => visWidth(r[0]!)), 8);
      const localeColW = Math.max(
        4,
        ...chunkLocales.map((l) => displayWidth(l)),
        ...rows.flatMap((r) => r.slice(1).map((c) => visWidth(String(c))))
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

    const printMarkdownTablesChunked = (rows: string[][]) => {
      const nLocales = locales.length;
      const chunkSize = maxColumns;
      if (nLocales === 0) {
        printMarkdownTableChunk(
          [],
          rows.map((r) => [r[0]!])
        );
        return;
      }
      const numChunks = Math.ceil(nLocales / chunkSize);
      const showChunkLabels = numChunks > 1;
      for (let start = 0; start < nLocales; start += chunkSize) {
        const end = Math.min(start + chunkSize, nLocales);
        const chunkLocales = locales.slice(start, end);
        const slicedRows = rows.map((r) => [r[0]!, ...r.slice(1 + start, 1 + end)]);
        if (showChunkLabels) {
          console.log(
            chalk.gray(
              t("Locales {{start}}–{{end}} of {{total}}", {
                start: start + 1,
                end,
                total: nLocales,
              })
            )
          );
        }
        printMarkdownTableChunk(chunkLocales, slicedRows);
      }
    };

    if (config.features.translateUIStrings) {
      const stringsPath = resolveStringsJsonPath(config, projectRoot);
      let stringsData: Record<string, unknown> = {};
      try {
        stringsData = JSON.parse(fs.readFileSync(stringsPath, "utf8")) as Record<string, unknown>;
      } catch {
        console.log(chalk.red("\n⚠ Could not read strings.json: " + stringsPath));
      }

      const keys = Object.keys(stringsData);
      const total = keys.length;

      if (total > 0) {
        const uiLocales = resolveLocalesForUI(config, projectRoot);

        const plainKeys = keys.filter((k) => !isPluralStringsEntry(stringsData[k] as never));
        const pluralKeys = keys.filter((k) => isPluralStringsEntry(stringsData[k] as never));

        const uiHeaders = [
          chalk.bold(t("Locale")),
          chalk.bold(t("Translated")),
          chalk.bold(t("Missing")),
          chalk.bold(t("Total")),
        ];

        const printUiSubset = (sectionTitle: string, subsetKeys: string[]) => {
          console.log(chalk.bold(sectionTitle));
          const n = subsetKeys.length;
          if (n === 0) {
            console.log(chalk.gray(`  ${t("(none)")}\n`));
            return;
          }
          const pct = (num: number) => Math.round((num / n) * 100);
          const uiRows: string[][] = [];
          for (const loc of uiLocales) {
            const translated = subsetKeys.filter((k) =>
              uiStringsEntryTranslatedForLocale(stringsData[k], loc)
            ).length;
            const missing = n - translated;
            const translatedCell =
              chalk.green(String(translated)) + " " + chalk.gray(`${pct(translated)}%`);
            const missingCell =
              missing > 0
                ? chalk.yellow(String(missing)) + " " + chalk.gray(`${pct(missing)}%`)
                : chalk.green(String(missing)) + " " + chalk.gray(`${pct(missing)}%`);
            uiRows.push([loc, translatedCell, missingCell, String(n)]);
          }

          const localeColW = Math.max(
            6,
            visWidth(uiHeaders[0]!),
            ...uiLocales.map((l) => displayWidth(l))
          );
          const wTranslated = Math.max(
            visWidth(uiHeaders[1]!),
            ...uiRows.map((r) => visWidth(r[1]!))
          );
          const wMissing = Math.max(visWidth(uiHeaders[2]!), ...uiRows.map((r) => visWidth(r[2]!)));
          const wTotal = Math.max(visWidth(uiHeaders[3]!), ...uiRows.map((r) => visWidth(r[3]!)));
          const uiSep = (cols: string[]) => cols.join(" | ");

          console.log(
            uiSep([
              padVis(uiHeaders[0]!, localeColW),
              padVis(uiHeaders[1]!, wTranslated),
              padVis(uiHeaders[2]!, wMissing),
              padVis(uiHeaders[3]!, wTotal),
            ])
          );
          console.log(
            uiSep([
              chalk.bold("-".repeat(localeColW)),
              chalk.bold("-".repeat(wTranslated)),
              chalk.bold("-".repeat(wMissing)),
              chalk.bold("-".repeat(wTotal)),
            ])
          );
          for (const r of uiRows) {
            console.log(
              uiSep([
                padVis(r[0]!, localeColW),
                padVis(r[1]!, wTranslated),
                padVis(r[2]!, wMissing),
                padVis(r[3]!, wTotal),
              ])
            );
          }
          console.log();
        };

        console.log(chalk.bold.cyan(`\n${t("📊 UI strings status")}`));
        console.log(chalk.gray(`(${stringsPath})\n`));
        printUiSubset(t("Plain UI strings"), plainKeys);
        printUiSubset(t("Plural UI string groups"), pluralKeys);
      }
    }

    console.log(chalk.bold.cyan(`\n${t("📊 Translation status (markdown)")}`));
    console.log(
      chalk.gray(t("Legend: ")) +
        chalk.green("✓") +
        chalk.gray(t(" up to date  ")) +
        chalk.yellow("●") +
        chalk.gray(t(" stale or missing  ")) +
        chalk.gray("-") +
        chalk.gray(t(" not generated  ")) +
        chalk.red("?") +
        chalk.gray(t(" source read error"))
    );
    for (let bi = 0; bi < config.docs.length; bi++) {
      const block = config.docs[bi]!;
      const view = toDocTranslateConfig(config, block);
      const md = filterIgnored(
        filterFumadocsDotMarkdownSources(
          collectFilesByExtension(block.contentPaths, [".md", ".mdx"], projectRoot),
          view,
          config
        ),
        projectRoot
      );
      if (md.length === 0) {
        continue;
      }
      const desc =
        typeof block.description === "string" && block.description.trim()
          ? ` — ${block.description.trim()}`
          : "";
      if (config.docs.length > 1 || desc) {
        console.log(
          "\n" +
            chalk.bold(`docs[${bi}]`) +
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
      printMarkdownTablesChunked(rows);
    }

    if (config.features.translateJson && config.json.length > 0) {
      const jsonLocales = getJsonTargetLocaleCodes(config);
      console.log(chalk.bold.cyan(`\n${t("📊 Translation status (json[])")}`));
      console.log(
        chalk.gray(t("Legend: ")) +
          chalk.green("✓") +
          chalk.gray(t(" up to date  ")) +
          chalk.yellow("●") +
          chalk.gray(t(" stale or missing  ")) +
          chalk.gray("-") +
          chalk.gray(t(" not generated  ")) +
          chalk.red("?") +
          chalk.gray(t(" source read error"))
      );
      for (let bi = 0; bi < config.json.length; bi++) {
        const block = config.json[bi]!;
        const files = resolveContentPathEntries(block.contentPaths, {
          projectRoot,
          extensions: [".json"],
        });
        if (files.length === 0) {
          continue;
        }
        const desc =
          typeof block.description === "string" && block.description.trim()
            ? ` — ${block.description.trim()}`
            : "";
        console.log(
          "\n" +
            chalk.bold(`json[${bi}]`) +
            chalk.cyan(`${desc} `) +
            chalk.magenta(`(${block.outputPathTemplate})`) +
            "\n"
        );
        const rows: string[][] = [];
        for (const rel of files) {
          const abs = path.join(projectRoot, rel);
          const trackKey = jsonBlockFileTrackingKey(bi, rel);
          let srcHash = "";
          try {
            srcHash = hashFileContent(fs.readFileSync(abs, "utf8"));
          } catch {
            rows.push([rel, ...jsonLocales.map(() => chalk.red("?"))]);
            continue;
          }
          const cells = jsonLocales.map((loc) => {
            const out = expandJsonBlockOutputPath(block.outputPathTemplate, projectRoot, loc, rel);
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
        const nLocales = jsonLocales.length;
        const chunkSize = maxColumns;
        if (nLocales === 0) {
          printMarkdownTableChunk(
            [],
            rows.map((r) => [r[0]!])
          );
        } else {
          const numChunks = Math.ceil(nLocales / chunkSize);
          const showChunkLabels = numChunks > 1;
          for (let start = 0; start < nLocales; start += chunkSize) {
            const end = Math.min(start + chunkSize, nLocales);
            const chunkLocales = jsonLocales.slice(start, end);
            const slicedRows = rows.map((r) => [r[0]!, ...r.slice(1 + start, 1 + end)]);
            if (showChunkLabels) {
              console.log(
                chalk.gray(
                  t("Locales {{start}}–{{end}} of {{total}}", {
                    start: start + 1,
                    end,
                    total: nLocales,
                  })
                )
              );
            }
            printMarkdownTableChunk(chunkLocales, slicedRows);
          }
        }
      }
    }

    cache.close();
  });

program
  .command("statistics")
  .description(
    t(
      "Show documentation cache and strings.json statistics (same aggregates as Translation Dashboard → Statistics)"
    )
  )
  .option(
    "--max-columns <n>",
    t("Max locale columns per model × locale table"),
    (v: string) => {
      const n = parseInt(String(v), 10);
      if (!Number.isFinite(n) || n < 1) {
        throw new InvalidArgumentError(t("Must be a positive integer."));
      }
      return n;
    },
    DEFAULT_STATISTICS_MAX_COLUMNS
  )
  .action((opts: { maxColumns: number }, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const chunkSize = opts.maxColumns;

    const cacheDir = path.join(projectRoot, config.cacheDir);
    const cache = new TranslationCache(cacheDir);

    const stringsPath = config.glossary?.uiGlossary
      ? path.join(projectRoot, config.glossary.uiGlossary)
      : resolveStringsJsonPath(config, projectRoot);
    const glossaryPath = config.glossary?.userGlossary
      ? path.join(projectRoot, config.glossary.userGlossary)
      : null;

    const padVis = (s: string, width: number): string => {
      const visLen = visWidth(s);
      return s + " ".repeat(Math.max(0, width - visLen));
    };

    const pctPart = (count: number, total: number): string => {
      if (total === 0) return "—";
      return `${((100 * count) / total).toFixed(1)}%`;
    };

    /** Same slicing pattern as `status` `printMarkdownTablesChunked`: multiple tables when locales exceed chunk size. */
    function runChunkedLocaleTables(
      locales: string[],
      printChunk: (chunkLocales: string[]) => void
    ): void {
      const nLocales = locales.length;
      if (nLocales === 0) {
        return;
      }
      const numChunks = Math.ceil(nLocales / chunkSize);
      const showChunkLabels = numChunks > 1;
      for (let start = 0; start < nLocales; start += chunkSize) {
        const end = Math.min(start + chunkSize, nLocales);
        const chunkLocales = locales.slice(start, end);
        if (showChunkLabels) {
          console.log(
            chalk.gray(
              t("Locales {{start}}–{{end}} of {{total}}", {
                start: start + 1,
                end,
                total: nLocales,
              })
            )
          );
        }
        printChunk(chunkLocales);
      }
    }

    const {
      cache: c,
      uiStrings: ui,
      glossary: gl,
    } = computeProjectStats({
      cache,
      stringsPath,
      glossaryPath,
      sourceLocale: config.sourceLocale,
      targetLocales: config.targetLocales,
    });

    console.log(chalk.bold.cyan(`\n${t("📊 UI strings (strings.json)")}`));
    console.log(chalk.gray(`(${stringsPath})\n`));

    if (!ui.available) {
      console.log(chalk.gray(`${t("strings.json not configured or missing.")}\n`));
    } else {
      console.log(
        chalk.gray(
          `${t("{{total}} entries ({{plain}} plain, {{plural}} plural)", {
            total: ui.totalEntries,
            plain: ui.plainTotal,
            plural: ui.pluralTotal,
          })}\n`
        )
      );
      const uiCardLabelW = 22;
      const uiCardLines: [string, string][] = [
        [t("Plain entries"), String(ui.plainTotal)],
        [t("Plural groups"), String(ui.pluralTotal)],
      ];
      for (const [label, val] of uiCardLines) {
        console.log(`${padVis(chalk.magenta(label + ":"), uiCardLabelW)} ${val}`);
      }
      console.log();

      const totalUiModelUsage = ui.byModel.reduce((sum, r) => sum + r.count, 0);
      const uiModelHeaders = [
        chalk.bold(t("Model")),
        chalk.bold(t("Entries")),
        chalk.bold(t("% of total")),
      ];
      const uiModelRows: string[][] = ui.byModel.map((row) => [
        row.model,
        String(row.count),
        totalUiModelUsage === 0 ? "—" : `${pctPart(row.count, totalUiModelUsage)}`,
      ]);
      const wUiModel = Math.max(
        visWidth(uiModelHeaders[0]!),
        ...uiModelRows.map((r) => visWidth(r[0]!)),
        5
      );
      const wUiEnt = Math.max(
        visWidth(uiModelHeaders[1]!),
        ...uiModelRows.map((r) => visWidth(r[1]!)),
        8
      );
      const wUiPct = Math.max(
        visWidth(uiModelHeaders[2]!),
        ...uiModelRows.map((r) => visWidth(r[2]!)),
        10
      );
      const uiSep = (cols: string[]) => cols.join(" | ");
      console.log(chalk.magenta.bold(t("By model")));
      console.log(
        uiSep([
          padVis(uiModelHeaders[0]!, wUiModel),
          padVis(uiModelHeaders[1]!, wUiEnt),
          padVis(uiModelHeaders[2]!, wUiPct),
        ])
      );
      console.log(
        uiSep([
          chalk.bold("-".repeat(wUiModel)),
          chalk.bold("-".repeat(wUiEnt)),
          chalk.bold("-".repeat(wUiPct)),
        ])
      );
      for (const r of uiModelRows) {
        console.log(uiSep([padVis(r[0]!, wUiModel), padVis(r[1]!, wUiEnt), padVis(r[2]!, wUiPct)]));
      }
      console.log(
        uiSep([
          padVis(chalk.bold(t("Total")), wUiModel),
          padVis(String(totalUiModelUsage), wUiEnt),
          padVis(totalUiModelUsage === 0 ? "—" : "100.0%", wUiPct),
        ])
      );
      console.log();

      const uiMlMap = new Map<string, number>();
      for (const r of ui.byModelLocale) {
        uiMlMap.set(`${r.model}\0${r.locale}`, r.count);
      }
      const uiLocTotals = new Map(
        ui.plainByLocale.map((row) => [row.locale, row.translated + row.missing] as const)
      );

      const printUiMatrixChunk = (chunkLocales: string[]) => {
        const headers = [chalk.bold(t("Model")), ...chunkLocales.map((loc) => chalk.bold(loc))];
        const colWidths = headers.map((h, i) =>
          Math.max(
            visWidth(h),
            ...ui.byModel.map((mRow) => {
              if (i === 0) return visWidth(mRow.model);
              const cnt = uiMlMap.get(`${mRow.model}\0${chunkLocales[i - 1]!}`) ?? 0;
              const tot = uiLocTotals.get(chunkLocales[i - 1]!) ?? 0;
              const cell = cnt === 0 ? "—" : `${cnt} (${pctPart(cnt, tot)})`;
              return visWidth(cell);
            })
          )
        );
        const sep = (cols: string[]) =>
          cols.map((cell, i) => padVis(cell, colWidths[i]!)).join(" | ");
        console.log(sep(headers.map((h) => String(h))));
        console.log(sep(headers.map((_, i) => chalk.bold("-".repeat(colWidths[i]!)))));
        for (const mRow of ui.byModel) {
          const cells = [mRow.model];
          for (const loc of chunkLocales) {
            const cnt = uiMlMap.get(`${mRow.model}\0${loc}`) ?? 0;
            const tot = uiLocTotals.get(loc) ?? 0;
            cells.push(
              cnt === 0 ? chalk.gray("—") : `${cnt} ${chalk.gray(`(${pctPart(cnt, tot)})`)}`
            );
          }
          console.log(sep(cells));
        }
        console.log();
      };

      const uiLocalesList = ui.plainByLocale.map((r) => r.locale);
      if (uiLocalesList.length === 0) {
        console.log(chalk.magenta.bold(t("By model and locale")));
        console.log(chalk.gray(`  ${t("(no locale rows)")}\n`));
      } else {
        console.log(chalk.magenta.bold(t("By model and locale")));
        runChunkedLocaleTables(uiLocalesList, printUiMatrixChunk);
      }
    }

    console.log(chalk.bold.cyan(`\n${t("📊 Documentation cache")}`));
    console.log(chalk.gray(`(${cacheDir})\n`));

    const docCardLabelW = 22;
    const docLines: [string, string][] = [
      [t("Total segments"), String(c.totalSegments)],
      [t("Stale"), String(c.staleSegments)],
      [t("Active"), String(c.activeSegments)],
      [t("Tracked files"), String(c.totalFiles)],
      [t("Unique filepaths"), String(c.uniqueFilepaths)],
      [t("Models used"), String(c.byModel.length)],
      [t("Glossary entries"), gl.available ? String(gl.totalTerms) : "0"],
    ];
    for (const [label, val] of docLines) {
      console.log(`${padVis(chalk.magenta(label + ":"), docCardLabelW)} ${val}`);
    }
    console.log();

    const docModelHeaders = [
      chalk.bold(t("Model")),
      chalk.bold(t("Segments")),
      chalk.bold(t("% of total")),
    ];
    const docModelRows: string[][] = c.byModel.map((row) => [
      row.model,
      String(row.count),
      c.totalSegments === 0 ? "—" : `${pctPart(row.count, c.totalSegments)}`,
    ]);
    const wDocModel = Math.max(
      visWidth(docModelHeaders[0]!),
      ...docModelRows.map((r) => visWidth(r[0]!)),
      5
    );
    const wDocSeg = Math.max(
      visWidth(docModelHeaders[1]!),
      ...docModelRows.map((r) => visWidth(r[1]!)),
      9
    );
    const wDocPct = Math.max(
      visWidth(docModelHeaders[2]!),
      ...docModelRows.map((r) => visWidth(r[2]!)),
      10
    );
    const docSep = (cols: string[]) => cols.join(" | ");
    console.log(chalk.magenta.bold(t("By model")));
    console.log(
      docSep([
        padVis(docModelHeaders[0]!, wDocModel),
        padVis(docModelHeaders[1]!, wDocSeg),
        padVis(docModelHeaders[2]!, wDocPct),
      ])
    );
    console.log(
      docSep([
        chalk.bold("-".repeat(wDocModel)),
        chalk.bold("-".repeat(wDocSeg)),
        chalk.bold("-".repeat(wDocPct)),
      ])
    );
    for (const r of docModelRows) {
      console.log(
        docSep([padVis(r[0]!, wDocModel), padVis(r[1]!, wDocSeg), padVis(r[2]!, wDocPct)])
      );
    }
    console.log(
      docSep([
        padVis(chalk.bold(t("Total")), wDocModel),
        padVis(String(c.totalSegments), wDocSeg),
        padVis(c.totalSegments === 0 ? "—" : "100.0%", wDocPct),
      ])
    );
    console.log();

    const mlMap = new Map<string, number>();
    for (const r of c.byModelLocale) {
      mlMap.set(`${r.model}\0${r.locale}`, r.count);
    }
    const cacheLocTotals = new Map(c.byLocale.map((row) => [row.locale, row.total] as const));

    const printDocMatrixChunk = (chunkLocales: string[]) => {
      const headers = [chalk.bold(t("Model")), ...chunkLocales.map((loc) => chalk.bold(loc))];
      const colWidths = headers.map((h, i) =>
        Math.max(
          visWidth(h),
          ...c.byModel.map((mRow) => {
            if (i === 0) return visWidth(mRow.model);
            const cnt = mlMap.get(`${mRow.model}\0${chunkLocales[i - 1]!}`) ?? 0;
            const tot = cacheLocTotals.get(chunkLocales[i - 1]!) ?? 0;
            const cell = cnt === 0 ? "—" : `${cnt} (${pctPart(cnt, tot)})`;
            return visWidth(cell);
          })
        )
      );
      const sep = (cols: string[]) =>
        cols.map((cell, i) => padVis(cell, colWidths[i]!)).join(" | ");
      console.log(sep(headers.map((h) => String(h))));
      console.log(sep(headers.map((_, i) => chalk.bold("-".repeat(colWidths[i]!)))));
      for (const mRow of c.byModel) {
        const cells = [mRow.model];
        for (const loc of chunkLocales) {
          const cnt = mlMap.get(`${mRow.model}\0${loc}`) ?? 0;
          const tot = cacheLocTotals.get(loc) ?? 0;
          cells.push(
            cnt === 0 ? chalk.gray("—") : `${cnt} ${chalk.gray(`(${pctPart(cnt, tot)})`)}`
          );
        }
        console.log(sep(cells));
      }
      console.log();
    };

    const cacheLocales = c.byLocale.map((r) => r.locale);
    if (cacheLocales.length === 0) {
      console.log(chalk.magenta.bold(t("By model and locale")));
      console.log(chalk.gray(`  ${t("(no locale rows)")}\n`));
    } else {
      console.log(chalk.magenta.bold(t("By model and locale")));
      runChunkedLocaleTables(cacheLocales, printDocMatrixChunk);
    }

    cache.close();
  });

program
  .command("cleanup")
  .description(
    t(
      "Clear the markdown_source_issues table, then run sync --force-update (extract, UI, SVG, docs) so it repopulates with only currently-configured docs; then clean stale segment rows (null last_hit_at / empty filepath) and remove orphaned file_tracking keys, translation rows, and translation_failures when resolved paths are missing on disk (SQLite)"
    )
  )
  .option("--dry-run", t("Show only"), false)
  .option(
    "--backup <path>",
    t("Write a SQLite backup to <path> before modifications (no backup is made unless this is set)")
  )
  .action(async (opts: { dryRun?: boolean; backup?: string }, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config: loaded, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);

    const dryTag = opts.dryRun ? t(" (dry-run)") : "";
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

    // Clear markdown_source_issues up front so the sync --force-update below repopulates only the
    // currently-configured docs. This drops rows for files that were renamed, deleted, or removed
    // from `docs[].contentPaths` (a scan never revisits them, so they could otherwise linger
    // forever); anything not re-scanned can be rebuilt later with `check-markdown`.
    {
      const preCache = new TranslationCache(cacheDir);
      try {
        const clearedMarkdownIssues = preCache.clearAllMarkdownIssues(Boolean(opts.dryRun));
        console.log(
          t(
            "[cleanup] cleared markdown_source_issues before sync (repopulated by sync / check-markdown): {{count}}",
            { count: clearedMarkdownIssues }
          ) + dryTag
        );
      } finally {
        preCache.close();
      }
    }

    console.log(chalk.cyan(t("[cleanup] Running sync --force-update first…")));
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
        noJson: false,
      });
    } catch (e) {
      if (exitIfRunInterrupted(e)) {
        return;
      }
      process.exit(1);
    }

    const cache = new TranslationCache(cacheDir);
    try {
      const shouldBackup = !opts.dryRun && Boolean(opts.backup);
      if (shouldBackup && opts.backup) {
        const backupPath = path.resolve(cwd, opts.backup);
        await cache.backupTo(backupPath);
        console.log(t("[cleanup] Backup → {{path}}", { path: backupPath }));
      }

      const { count, deletedRows } = cache.cleanupStaleTranslations(Boolean(opts.dryRun));
      console.log(t("[cleanup] stale: {{count}} row(s)", { count }) + dryTag);
      if (opts.dryRun && deletedRows.length) {
        console.log(
          deletedRows
            .slice(0, 20)
            .map((r) => `  ${r.source_hash} ${r.locale}`)
            .join("\n")
        );
      }

      const prunedTracking = cache.pruneOrphanedFileTrackingByDisk(
        projectRoot,
        Boolean(opts.dryRun)
      );
      console.log(
        t("[cleanup] orphaned file_tracking (missing on disk): {{count}}", {
          count: prunedTracking,
        }) + dryTag
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
        t("[cleanup] orphaned translations (missing on disk): {{count}}", {
          count: orphanTranslations,
        }) + dryTag
      );

      const prunedFailures = cache.pruneOrphanedTranslationFailures(
        projectRoot,
        Boolean(opts.dryRun)
      );
      console.log(
        t("[cleanup] orphaned translation_failures: {{count}}", { count: prunedFailures }) + dryTag
      );
    } finally {
      cache.close();
    }
  });

program
  .command("clean-temp")
  .description(
    t(
      "Find `*.log` and `cache.db.backup*.sqlite` under a directory tree, print paths (like find -print), then delete after `y` or with `-f` / `--force`"
    )
  )
  .option("-r, --root <path>", t("Directory to search (default: current working directory)"), ".")
  .option("-f, --force", t("Delete matching files without prompting"), false)
  .option("--dry-run", t("Print matching paths only; do not prompt or delete"), false)
  .action(async (opts: { root?: string; dryRun?: boolean; force?: boolean }) => {
    const rootDir = path.resolve(process.cwd(), opts.root ?? ".");
    await runCleanTemp({
      rootDir,
      dryRun: Boolean(opts.dryRun),
      force: Boolean(opts.force),
    });
  });

program
  .command("purge-locale")
  .description(
    t(
      "Delete all cached translations, file_tracking, and translation_failures rows for the given locale(s), plus the generated translated documents, the per-locale flat UI file, and the locale's strings.json entries (use --keep-files to purge only the cache)"
    )
  )
  .option(
    "-l, --locale <code>",
    t("Locale to purge (repeat for multiple)"),
    (val: string, prev: string[]) => [...prev, val],
    [] as string[]
  )
  .option("--dry-run", t("Show what would be deleted; do not delete"), false)
  .option("-y, --yes", t("Skip the confirmation prompt"), false)
  .option("-f, --force", t("Alias for --yes"), false)
  .option(
    "--keep-files",
    t("Only purge the SQLite cache; leave generated files and strings.json untouched"),
    false
  )
  .option(
    "--backup <path>",
    t("Write a SQLite backup to <path> before deletion (no backup is made unless this is set)")
  )
  .action(
    async (
      opts: {
        locale?: string[];
        dryRun?: boolean;
        yes?: boolean;
        force?: boolean;
        keepFiles?: boolean;
        backup?: string;
      },
      cmd: Command
    ) => {
      const { configFlag, cwd, providerOverride } = withConfig(cmd);
      const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);

      const locales = opts.locale ?? [];
      if (locales.length === 0) {
        console.error(
          chalk.red(t("❌ No locales provided. Pass at least one -l / --locale <code>."))
        );
        process.exit(1);
      }

      await runPurgeLocale({
        cacheDir: path.join(projectRoot, config.cacheDir),
        locales,
        dryRun: Boolean(opts.dryRun),
        force: Boolean(opts.yes || opts.force),
        keepFiles: Boolean(opts.keepFiles),
        config,
        projectRoot,
        backupPath: opts.backup ? path.resolve(cwd, opts.backup) : undefined,
      });
    }
  );

function runDashboardCommand(_opts: { port?: string }, cmd: Command): void {
  const { configFlag, cwd, providerOverride } = withConfig(cmd);
  const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
  const cmdOpts = cmd.opts() as { port?: string; noOpen?: boolean };
  const port = parseInt(cmdOpts.port || String(DEFAULT_DASHBOARD_PORT), 10);
  const cache = new TranslationCache(path.join(projectRoot, config.cacheDir));
  const stringsPath = config.glossary?.uiGlossary
    ? path.join(projectRoot, config.glossary.uiGlossary)
    : resolveStringsJsonPath(config, projectRoot);
  const glossaryPath = config.glossary?.userGlossary
    ? path.join(projectRoot, config.glossary.userGlossary)
    : null;
  const jsonSourceBlock = config.docs.find((b) => b.docusaurusCatalogDir?.trim());

  // Resolve the dashboard's OWN UI locale (the singleton was already reinitialized with config
  // `uiLanguage` during loadConfigOrExit); ship the matching flat bundle + direction to the browser.
  const uiLocale = getUiLocale();
  let triggerShutdown: () => void = () => {};
  const app = createTranslationDashboardApp(cache, {
    cwd: projectRoot,
    stringsJsonPath: stringsPath,
    glossaryUserPath: glossaryPath,
    sourceLocale: config.sourceLocale,
    targetLocales: config.targetLocales,
    docusaurusCatalogDir: jsonSourceBlock?.docusaurusCatalogDir?.trim() || null,
    onShutdown: () => triggerShutdown(),
    uiI18n: {
      locale: uiLocale,
      dir: uiLocaleDirection(uiLocale),
      bundle: loadUiBundle(uiLocale),
    },
  });

  const staticDir = resolveDashboardAppStaticDir();
  if (fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
  } else {
    console.warn(t("[dashboard] Static dir missing: {{dir}}", { dir: staticDir }));
  }

  const server = http.createServer(app);
  let shuttingDown = false;
  let cacheClosed = false;
  const closeCacheOnce = (): void => {
    if (cacheClosed) {
      return;
    }
    cacheClosed = true;
    try {
      // Checkpoints the WAL and closes the connection; SQLite then removes the `-wal` / `-shm`
      // sidecars (unless another process, e.g. an IDE SQLite viewer, still holds the file open).
      cache.close();
    } catch {
      // Best-effort close before exit.
    }
  };
  const shutdown = (signal?: "SIGINT" | "SIGTERM"): void => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    const exitCode = signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 0;
    console.log(chalk.yellow(`\n${t("[dashboard] Shutting down…")}`));
    server.close((err) => {
      closeCacheOnce();
      process.exit(err ? 1 : exitCode);
    });
    // Force-drain lingering keep-alive connections so `server.close` can complete promptly.
    server.closeAllConnections?.();
    // Safety net: flush the cache and exit even if `server.close` never fires (stuck sockets).
    setTimeout(() => {
      closeCacheOnce();
      process.exit(exitCode);
    }, 2000).unref();
  };
  triggerShutdown = () => shutdown();
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  listenTranslationDashboardServer(server, port, (actualPort) => {
    console.log(chalk.green(t("[dashboard] Listening on TCP port {{port}}", { port: actualPort })));
    if (actualPort !== port) {
      console.log(
        chalk.yellow(
          t(
            "[dashboard] Requested port {{requested}} was unavailable; using port {{actual}} instead.",
            {
              requested: port,
              actual: actualPort,
            }
          )
        )
      );
    }
    const url = `http://127.0.0.1:${actualPort}/`;
    console.log(chalk.green("-------------------------------------------"));
    console.log(chalk.green(`  ${t("ai-i18n-tools Translation Dashboard")}`));
    console.log(chalk.green("-------------------------------------------\n"));
    console.log(t("[dashboard] Running at {{url}}", { url: chalk.cyan(url) }));
    if (!cmdOpts.noOpen) {
      openBrowser(url);
    }
    console.log("\n");
  });
}

program
  .command("dashboard")
  .description(
    t(
      "Launch the Translation Dashboard (local web UI: cache segments, UI strings, glossary, failures, statistics)"
    )
  )
  .option("-p, --port <n>", t("Port"), String(DEFAULT_DASHBOARD_PORT))
  .option("--no-open", t("Do not open the default browser"))
  .action(runDashboardCommand);

program
  .command("editor", { hidden: true })
  .description(t("Deprecated: use 'dashboard' instead"))
  .option("-p, --port <n>", t("Port"), String(DEFAULT_DASHBOARD_PORT))
  .option("--no-open", t("Do not open the default browser"))
  .action((_opts: { port?: string }, cmd: Command) => {
    console.warn(
      chalk.yellow(t("The 'editor' command is deprecated; use 'ai-i18n-tools dashboard' instead."))
    );
    runDashboardCommand(_opts, cmd);
  });

program
  .command("generate-ui-languages")
  .description(
    t("Write ui-languages.json from sourceLocale, targetLocales, and the master catalog")
  )
  .option("--master <path>", t("Path to ui-languages-complete.json (default: bundled data file)"))
  .option("--dry-run", t("Print JSON to stdout only; do not write the output file"), false)
  .action((opts: { master?: string; dryRun?: boolean }, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const masterPath = opts.master
      ? path.resolve(cwd, opts.master)
      : resolveDefaultUiLanguagesMasterPath();
    if (!fs.existsSync(masterPath)) {
      console.error(chalk.red(t("Master file not found: {{path}}", { path: masterPath })));
      process.exit(1);
    }
    try {
      const result = runGenerateUiLanguages(config, projectRoot, {
        masterPath,
        dryRun: Boolean(opts.dryRun),
      });
      logGenerateUiLanguagesWarnings(result.warnings);
      if (opts.dryRun) {
        console.log(JSON.stringify(result.rows, null, 2));
      } else {
        console.log(
          chalk.green(
            result.rows.length === 1
              ? t("✅ Wrote {{path}} ({{count}} row)", {
                  path: result.outPath,
                  count: result.rows.length,
                })
              : t("✅ Wrote {{path}} ({{count}} rows)", {
                  path: result.outPath,
                  count: result.rows.length,
                })
          )
        );
      }
    } catch (e) {
      console.error(
        chalk.red(
          t("❌ [generate-ui-languages] {{error}}", {
            error: e instanceof Error ? e.message : String(e),
          })
        )
      );
      process.exit(1);
    }
  });

program
  .command("glossary-generate")
  .description(t("Write an empty glossary-user.csv with standard headers"))
  .option(
    "-o, --output <path>",
    t("Output path (default: config glossary.userGlossary or glossary-user.csv)")
  )
  .action((opts: { output?: string }, cmd) => {
    const { configFlag, cwd, providerOverride } = withConfig(cmd);
    const { config, projectRoot } = loadConfigOrExit(configFlag, cwd, providerOverride);
    const out = opts.output
      ? path.resolve(cwd, opts.output)
      : path.join(projectRoot, config.glossary?.userGlossary || "glossary-user.csv");
    const header = `"Original language string","locale","Translation","Force"\n`;
    if (fs.existsSync(out)) {
      console.error(t("Refusing to overwrite existing file: {{path}}", { path: out }));
      process.exit(1);
    }
    writeAtomicUtf8(out, header);
    console.log(t("Wrote {{path}}", { path: out }));
  });

program.addHelpText("after", ROOT_CLI_HELP_AFTER);

program.parse();
