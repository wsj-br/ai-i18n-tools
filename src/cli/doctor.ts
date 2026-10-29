import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import chalk from "chalk";
import { loadConfiguredModelCatalogStatus } from "./check-models.js";
import { resolveConfigFileLocation } from "./helpers.js";
import { BUILD_TIMESTAMP_ISO, PACKAGE_VERSION } from "../build-info.generated.js";
import { TranslationCache } from "../core/cache.js";
import {
  applyEnvOverrides,
  applyProviderOverrideToRawInput,
  collectI18nBusinessRuleIssues,
  explicitFeatureFlagsFor,
  mergeWithDefaults,
  resolveTranslationModels,
} from "../core/config.js";
import {
  assertDocSystemLocaleSubpath,
  normalizeI18nConfigDocsOutput,
} from "../core/docs-output-normalize.js";
import {
  PROVIDER_PRESETS,
  resolveActiveProvider,
  resolveProviderSettings,
  type ResolvedProviderSettings,
} from "../core/llm-providers.js";
import { normalizeLocale } from "../core/locale-utils.js";
import { benchmarkCachePath, readBenchmarkCache } from "../core/model-benchmarks.js";
import { resolveContentPathEntries } from "../core/resolve-content-paths.js";
import { bundledMasterAvailable } from "../core/sea-assets.js";
import type { I18nConfig } from "../core/types.js";
import { i18nConfigSchema } from "../core/types.js";
import { getUiExtractorConfig } from "../core/ui-extractor-config.js";
import {
  configHasDocWork,
  configHasJsonWork,
  configHasUiWork,
  effectiveUiTargetLocales,
  resolveLocalesForUiBlock,
  resolveUiBlockPaths,
  uiBlockHasSourceRoots,
} from "../core/ui-blocks.js";
import {
  expandDocTargetLocalesInRawInput,
  expandJsonTargetLocalesInRawInput,
  expandTargetLocalesFileReferenceInRawInput,
  getDocumentationTargetLocaleCodes,
} from "../core/ui-languages.js";
import {
  isLocaleInUiLanguagesMaster,
  loadUiLanguagesMaster,
  resolveBundledUiLanguagesCompletePath,
} from "../core/ui-languages-catalog.js";
import { loadTranslationContext } from "../glossary/translation-context.js";
import { t } from "../i18n/index.js";

const require = createRequire(import.meta.url);

const DOC_EXTENSIONS = [".md", ".mdx", ".astro", ".html", ".htm"] as const;
const JSON_EXTENSIONS = [".json"] as const;
const DEFAULT_UI_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const GITHUB_RELEASES_LATEST = "https://api.github.com/repos/wsj-br/ai-i18n-tools/releases/latest";
const GITHUB_RELEASES_PAGE = "https://github.com/wsj-br/ai-i18n-tools/releases";

/** Tool and provider variables `doctor` may print when they are set. Keys come from {@link PROVIDER_PRESETS}. */
const TOOL_ENV_NAMES = [
  "OPENROUTER_BASE_URL",
  "OLLAMA_BASE_URL",
  "AI_I18N_LANG",
  "I18N_SOURCE_LOCALE",
  "I18N_TARGET_LOCALES",
  "I18N_LOG_LEVEL",
  "NO_COLOR",
  "I18N_LOG_SESSION_MAX",
  "BROWSER",
  "SOURCE_DATE_EPOCH",
] as const;

export type DoctorStatus = "pass" | "warn" | "fail";

export interface DoctorCheck {
  section: string;
  status: DoctorStatus;
  message: string;
  /** Informational pass. Printed with a dot instead of a check mark. */
  note?: boolean;
}

export interface RunDoctorOptions {
  configFlag?: string;
  cwd: string;
  providerOverride?: string;
  local?: boolean;
  strict?: boolean;
  json?: boolean;
  sea?: boolean;
  execPath?: string;
  argv1?: string;
  fetchImpl?: typeof fetch;
}

export interface RunDoctorResult {
  exitCode: number;
  checks: DoctorCheck[];
}

export function describeRuntime(input: { sea: boolean; execPath: string; argv1: string }): string {
  if (input.sea) {
    return t("standalone executable {{path}}", { path: input.execPath });
  }
  return t("Node.js package {{entry}} (node {{execPath}})", {
    entry: input.argv1,
    execPath: input.execPath,
  });
}

export function describeInstalledVersion(latestRelease = false): string {
  const version = PACKAGE_VERSION || "0.0.0";
  const build = BUILD_TIMESTAMP_ISO.trim() !== "" ? BUILD_TIMESTAMP_ISO.trim() : "unknown";
  const label = `${version} - ${build}`;
  if (latestRelease) {
    return t("version {{version}} (latest release)", { version: label });
  }
  return t("version {{version}}", { version: label });
}

interface Semver {
  major: number;
  minor: number;
  patch: number;
}

function parseSemver(raw: string): Semver | null {
  const match = raw
    .trim()
    .replace(/^v/i, "")
    .match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/** Negative when `installed` is older than `remote`. */
export function compareRelease(installed: string, remote: string): -1 | 0 | 1 | null {
  const left = parseSemver(installed);
  const right = parseSemver(remote);
  if (!left || !right) {
    return null;
  }
  if (left.major !== right.major) {
    return left.major < right.major ? -1 : 1;
  }
  if (left.minor !== right.minor) {
    return left.minor < right.minor ? -1 : 1;
  }
  if (left.patch !== right.patch) {
    return left.patch < right.patch ? -1 : 1;
  }
  return 0;
}

function presetApiKeyNames(): string[] {
  const names: string[] = [];
  for (const preset of Object.values(PROVIDER_PRESETS)) {
    if (preset.apiKeyEnv) {
      names.push(preset.apiKeyEnv);
    }
  }
  return names;
}

function supportedEnvNames(config: I18nConfig | null): string[] {
  const names = [...presetApiKeyNames(), ...TOOL_ENV_NAMES];
  if (config) {
    for (const entry of Object.values(config.providers)) {
      const custom = entry.apiKeyEnv?.trim();
      if (custom) {
        names.push(custom);
      }
    }
  }
  return [...new Set(names)];
}

function secretEnvNames(config: I18nConfig | null): Set<string> {
  const names = new Set(presetApiKeyNames());
  if (config) {
    for (const entry of Object.values(config.providers)) {
      const custom = entry.apiKeyEnv?.trim();
      if (custom) {
        names.add(custom);
      }
    }
  }
  return names;
}

function pipelineNeedsLlm(config: I18nConfig): boolean {
  const src = normalizeLocale(config.sourceLocale);
  const svgNeedsApi =
    config.features.translateSVG &&
    Boolean(config.svg) &&
    getDocumentationTargetLocaleCodes(config).some((locale) => normalizeLocale(locale) !== src);
  return (
    (config.features.translateUIStrings && configHasUiWork(config)) ||
    (config.features.translateDocs && configHasDocWork(config)) ||
    (config.features.translateJson && configHasJsonWork(config)) ||
    svgNeedsApi
  );
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function staticOutputDir(template: string): string | null {
  const norm = template.trim().replace(/\\/g, "/");
  if (!norm) {
    return null;
  }
  const brace = norm.indexOf("{");
  if (brace === -1) {
    const dir = path.posix.dirname(norm);
    return !dir || dir === "." ? null : dir;
  }
  const before = norm.slice(0, brace).replace(/\/+$/, "");
  return !before || before === "." ? null : before;
}

function hasScannableFile(abs: string, extensions: readonly string[]): boolean {
  const extSet = new Set(extensions.map((ext) => ext.toLowerCase()));
  const matches = (file: string): boolean => extSet.has(path.extname(file).toLowerCase());
  let stat: fs.Stats;
  try {
    stat = fs.statSync(abs);
  } catch {
    return false;
  }
  if (stat.isFile()) {
    return matches(abs);
  }
  if (!stat.isDirectory()) {
    return false;
  }
  const stack = [abs];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && matches(full)) {
        return true;
      }
    }
  }
  return false;
}

function readUserVersion(dbFile: string): number | null {
  try {
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
    const db = new DatabaseSync(dbFile, { readOnly: true });
    try {
      const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
      return row.user_version;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function runDoctor(options: RunDoctorOptions): Promise<RunDoctorResult> {
  const checks: DoctorCheck[] = [];
  const section = {
    config: t("Config"),
    locales: t("Locales"),
    pipelines: t("Pipelines"),
    cache: t("Cache"),
    provider: t("Provider"),
    environment: t("Environment"),
  };

  const pass = (name: string, message: string, note = false): void => {
    checks.push({ section: name, status: "pass", message, ...(note ? { note: true } : {}) });
  };
  const warn = (name: string, message: string): void => {
    checks.push({ section: name, status: "warn", message });
  };
  const fail = (name: string, message: string): void => {
    checks.push({ section: name, status: "fail", message });
  };

  const finish = (): RunDoctorResult => {
    const passed = checks.filter((check) => check.status === "pass").length;
    const warnings = checks.filter((check) => check.status === "warn").length;
    const errors = checks.filter((check) => check.status === "fail").length;
    const exitCode = errors > 0 || (options.strict === true && warnings > 0) ? 1 : 0;
    const summary = t("Summary: {{passed}} passed, {{warnings}} warnings, {{errors}} errors", {
      passed,
      warnings,
      errors,
    });
    if (options.json === true) {
      console.log(
        JSON.stringify(
          { ok: exitCode === 0, errorCount: errors, warningCount: warnings, checks },
          null,
          2
        )
      );
    } else {
      printReport(checks, summary);
    }
    return { exitCode, checks };
  };

  let configPath: string;
  try {
    configPath = resolveConfigFileLocation(options.configFlag, options.cwd);
  } catch (e) {
    fail(section.config, errorMessage(e));
    return finish();
  }
  const projectRoot = path.dirname(configPath);
  const shownConfig = path.relative(options.cwd, configPath) || path.basename(configPath);
  pass(section.config, shownConfig);

  let json: unknown;
  try {
    json = JSON.parse(fs.readFileSync(configPath, "utf8")) as unknown;
  } catch (e) {
    fail(section.config, t("Invalid JSON: {{message}}", { message: errorMessage(e) }));
    return finish();
  }
  pass(section.config, t("JSON syntax"));

  const merged = mergeWithDefaults(json);
  if (options.providerOverride) {
    try {
      applyProviderOverrideToRawInput(merged, options.providerOverride);
    } catch (e) {
      fail(section.config, errorMessage(e));
    }
  }
  for (const expand of [
    expandTargetLocalesFileReferenceInRawInput,
    expandDocTargetLocalesInRawInput,
    expandJsonTargetLocalesInRawInput,
  ]) {
    try {
      expand(merged, projectRoot);
    } catch (e) {
      fail(section.config, errorMessage(e));
    }
  }

  const parsed = i18nConfigSchema.safeParse(merged);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const issuePath = issue.path.join(".") || "(root)";
      fail(section.config, `${issuePath}: ${issue.message}`);
    }
    return finish();
  }
  pass(section.config, t("schema"));

  let config = normalizeI18nConfigDocsOutput(parsed.data);
  try {
    assertDocSystemLocaleSubpath(config);
  } catch (e) {
    fail(section.config, errorMessage(e));
  }
  const explicit = explicitFeatureFlagsFor(merged);
  config = applyEnvOverrides(config);
  const ruleIssues = collectI18nBusinessRuleIssues(config, explicit);
  if (ruleIssues.length === 0) {
    pass(section.config, t("business rules"));
  } else {
    for (const issue of ruleIssues) {
      fail(section.config, issue.message);
    }
  }

  pass(
    section.config,
    describeRuntime({
      sea: options.sea === true,
      execPath: options.execPath ?? process.execPath,
      argv1: options.argv1 ?? process.argv[1] ?? process.execPath,
    })
  );
  const release = await checkRelease(options);
  pass(section.config, describeInstalledVersion(release.latest));
  if (release.message) {
    if (release.status === "warn") {
      warn(section.config, release.message);
    } else {
      pass(section.config, release.message, release.note === true);
    }
  }

  checkLocales(config, pass, warn, fail, section.locales);
  checkPipelines(config, projectRoot, ruleIssues, pass, warn, fail, section.pipelines);
  checkCache(config, projectRoot, pass, warn, section.cache);
  await checkProviders(
    config,
    projectRoot,
    options,
    ruleIssues,
    pass,
    warn,
    fail,
    section.provider
  );
  checkEnvironment(config, pass, section.environment);

  return finish();
}

interface ReleaseCheck {
  /** Installed version matches the latest GitHub release. */
  latest: boolean;
  message?: string;
  status?: "pass" | "warn";
  note?: boolean;
}

async function checkRelease(options: RunDoctorOptions): Promise<ReleaseCheck> {
  if (options.local === true) {
    return {
      latest: false,
      status: "pass",
      note: true,
      message: t("GitHub release was not checked"),
    };
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(GITHUB_RELEASES_LATEST, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ai-i18n-tools",
      },
      signal: AbortSignal.timeout(10_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      return {
        latest: false,
        status: "warn",
        message: t("Could not read the latest GitHub release (HTTP {{status}})", {
          status: response.status,
        }),
      };
    }
    const body = JSON.parse(raw) as { tag_name?: unknown };
    if (typeof body.tag_name !== "string" || body.tag_name.trim() === "") {
      return {
        latest: false,
        status: "warn",
        message: t("GitHub releases response did not include a tag"),
      };
    }
    const tag = body.tag_name.trim();
    const installed = PACKAGE_VERSION || "0.0.0";
    const compared = compareRelease(installed, tag);
    if (compared === null) {
      return {
        latest: false,
        status: "warn",
        message: t("Could not compare installed version {{installed}} with {{tag}}", {
          installed,
          tag,
        }),
      };
    }
    if (compared === 0) {
      return { latest: true };
    }
    if (compared > 0) {
      return {
        latest: false,
        status: "pass",
        note: true,
        message: t("installed {{installed}} is newer than the latest release {{tag}}", {
          installed,
          tag,
        }),
      };
    }
    const remote = tag.replace(/^v/i, "");
    return {
      latest: false,
      status: "warn",
      message: t("upgrade available: {{remote}} (installed {{installed}}) {{url}}", {
        remote,
        installed,
        url: GITHUB_RELEASES_PAGE,
      }),
    };
  } catch (e) {
    return {
      latest: false,
      status: "warn",
      message: t("Could not read the latest GitHub release: {{message}}", {
        message: errorMessage(e),
      }),
    };
  }
}

function checkLocales(
  config: I18nConfig,
  pass: (section: string, message: string, note?: boolean) => void,
  warn: (section: string, message: string) => void,
  fail: (section: string, message: string) => void,
  section: string
): void {
  pass(section, t("sourceLocale {{locale}}", { locale: config.sourceLocale }));
  const targets = config.targetLocales.join(", ");
  pass(section, t("targetLocales {{locales}}", { locales: targets || t("(none)") }));

  const codes = new Set<string>([config.sourceLocale, ...config.targetLocales]);
  for (const block of config.ui) {
    for (const locale of block.targetLocales ?? []) {
      codes.add(locale);
    }
  }
  for (const block of config.docs) {
    for (const locale of block.targetLocales ?? []) {
      codes.add(locale);
    }
  }
  for (const block of config.json) {
    for (const locale of block.targetLocales ?? []) {
      codes.add(locale);
    }
  }

  const masterPath = resolveBundledUiLanguagesCompletePath();
  if (!bundledMasterAvailable(masterPath)) {
    warn(section, t("Bundled UI language catalog is not available"));
    return;
  }
  const master = loadUiLanguagesMaster(masterPath);
  for (const code of codes) {
    if (!isLocaleInUiLanguagesMaster(code, master)) {
      warn(section, t("{{locale}} is not in the bundled UI language catalog", { locale: code }));
    }
  }

  if (config.features.translateUIStrings) {
    config.ui.forEach((block, index) => {
      if (!uiBlockHasSourceRoots(block)) {
        return;
      }
      if (effectiveUiTargetLocales(config, block).length === 0) {
        return;
      }
      if (resolveLocalesForUiBlock(config, block, process.cwd()).length > 0) {
        return;
      }
      fail(
        section,
        t(
          "ui[{{index}}] has no target locales after excluding sourceLocale. Set targetLocales or ui[{{index}}].targetLocales.",
          { index }
        )
      );
    });
  }
}

function checkPipelines(
  config: I18nConfig,
  projectRoot: string,
  ruleIssues: { message: string }[],
  pass: (section: string, message: string, note?: boolean) => void,
  warn: (section: string, message: string) => void,
  fail: (section: string, message: string) => void,
  section: string
): void {
  const ruleText = ruleIssues.map((issue) => issue.message).join("\n");
  if (config.features.translateUIStrings || config.ui.some(uiBlockHasSourceRoots)) {
    config.ui.forEach((block, index) => {
      const interested = config.features.translateUIStrings || uiBlockHasSourceRoots(block);
      if (!interested) {
        return;
      }
      const extensions = getUiExtractorConfig(block)?.extensions ?? DEFAULT_UI_EXTENSIONS;
      if (config.features.translateUIStrings || uiBlockHasSourceRoots(block)) {
        for (const root of block.sourceRoots) {
          const abs = path.resolve(projectRoot, root);
          if (!fs.existsSync(abs)) {
            fail(
              section,
              t("ui[{{index}}] sourceRoots {{path}} does not exist", { index, path: root })
            );
            continue;
          }
          if (!hasScannableFile(abs, extensions)) {
            warn(
              section,
              t("ui[{{index}}] sourceRoots {{path}} has no scannable files", { index, path: root })
            );
            continue;
          }
          pass(section, t("ui[{{index}}] sourceRoots {{path}}", { index, path: root }));
        }
      }
      const paths = resolveUiBlockPaths(config, block, index, projectRoot);
      reportJsonFile(
        paths.stringsJson,
        t("ui[{{index}}] strings.json", { index }),
        "keys",
        pass,
        warn,
        section
      );
      reportJsonFile(
        paths.languagesManifest,
        t("ui[{{index}}] ui-languages.json", { index }),
        "entries",
        pass,
        warn,
        section
      );
      if (block.flatOutput !== false) {
        reportOutputDir(
          projectRoot,
          block.flatOutputDir,
          t("ui[{{index}}] flatOutputDir", { index }),
          pass,
          fail,
          section
        );
      }
      if (block.gettext) {
        reportOutputDir(
          projectRoot,
          block.gettext.outputDir,
          t("ui[{{index}}] gettext outputDir", { index }),
          pass,
          fail,
          section
        );
      }
      const packageJson =
        block.uiExtractor?.packageJsonPath ?? block.reactExtractor?.packageJsonPath;
      if (packageJson) {
        reportInputFile(
          projectRoot,
          packageJson,
          t("ui[{{index}}] packageJsonPath", { index }),
          pass,
          fail,
          section
        );
      }
      const pyproject =
        block.uiExtractor?.pyprojectTomlPath ?? block.reactExtractor?.pyprojectTomlPath;
      if (pyproject) {
        reportInputFile(
          projectRoot,
          pyproject,
          t("ui[{{index}}] pyprojectTomlPath", { index }),
          pass,
          fail,
          section
        );
      }
    });
  }

  if (config.features.translateDocs) {
    config.docs.forEach((block, index) => {
      if (
        block.contentPaths.length > 0 &&
        !ruleText.includes("docs[].contentPaths must be non-empty")
      ) {
        reportContentPaths(
          projectRoot,
          block.contentPaths,
          [...DOC_EXTENSIONS],
          t("docs[{{index}}] contentPaths", { index }),
          pass,
          fail,
          section
        );
      }
      reportOutputDir(
        projectRoot,
        block.outputDir,
        t("docs[{{index}}] outputDir", { index }),
        pass,
        fail,
        section
      );
      if (block.docusaurusCatalogDir) {
        reportInputFile(
          projectRoot,
          block.docusaurusCatalogDir,
          t("docs[{{index}}] docusaurusCatalogDir", { index }),
          pass,
          fail,
          section
        );
      }
      if (block.nextraDictionaryPath) {
        reportInputFile(
          projectRoot,
          block.nextraDictionaryPath,
          t("docs[{{index}}] nextraDictionaryPath", { index }),
          pass,
          fail,
          section
        );
      }
      const fumadocs = block.docsOutput.fumadocsUiCatalog?.sourcePath;
      if (fumadocs) {
        reportInputFile(
          projectRoot,
          fumadocs,
          t("docs[{{index}}] fumadocsUiCatalog.sourcePath", { index }),
          pass,
          fail,
          section
        );
      }
      const vitepress = block.docsOutput.vitepressThemeCatalog?.configPath;
      if (vitepress) {
        reportInputFile(
          projectRoot,
          vitepress,
          t("docs[{{index}}] vitepressThemeCatalog.configPath", { index }),
          pass,
          fail,
          section
        );
      }
    });
  }

  if (config.features.translateJson) {
    config.json.forEach((block, index) => {
      if (block.contentPaths.length > 0) {
        reportContentPaths(
          projectRoot,
          block.contentPaths,
          [...JSON_EXTENSIONS],
          t("json[{{index}}] contentPaths", { index }),
          pass,
          fail,
          section
        );
      }
      const outDir = staticOutputDir(block.outputPathTemplate);
      if (outDir) {
        reportOutputDir(
          projectRoot,
          outDir,
          t("json[{{index}}] outputPathTemplate", { index }),
          pass,
          fail,
          section
        );
      }
    });
  }

  if (config.features.translateSVG && config.svg) {
    for (const source of config.svg.sourcePath) {
      reportInputFile(
        projectRoot,
        source,
        t("svg sourcePath {{path}}", { path: source }),
        pass,
        fail,
        section
      );
    }
    reportOutputDir(projectRoot, config.svg.outputDir, t("svg outputDir"), pass, fail, section);
  }

  reportOutputDir(projectRoot, config.cacheDir, t("cacheDir"), pass, fail, section);

  const contextFiles = config.glossary?.contextFiles ?? [];
  for (const file of contextFiles) {
    try {
      loadTranslationContext({
        cwd: projectRoot,
        files: [file],
        maxChars: config.glossary?.contextMaxChars,
      });
      pass(section, t("glossary.contextFiles {{path}}", { path: file }));
    } catch (e) {
      fail(section, errorMessage(e));
    }
  }
  const userGlossary = config.glossary?.userGlossary?.trim();
  if (userGlossary) {
    const abs = path.resolve(projectRoot, userGlossary);
    if (fs.existsSync(abs)) {
      pass(section, t("glossary.userGlossary {{path}}", { path: userGlossary }));
    } else {
      warn(
        section,
        t("glossary.userGlossary {{path}} is missing; glossary hints are skipped", {
          path: userGlossary,
        })
      );
    }
  }
}

function reportContentPaths(
  projectRoot: string,
  entries: string[],
  extensions: string[],
  label: string,
  pass: (section: string, message: string, note?: boolean) => void,
  fail: (section: string, message: string) => void,
  section: string
): void {
  let files = 0;
  let failed = false;
  for (const entry of entries) {
    try {
      files += resolveContentPathEntries([entry], { projectRoot, extensions }).length;
    } catch (e) {
      failed = true;
      fail(section, errorMessage(e));
    }
  }
  if (!failed) {
    pass(section, t("{{label}} ({{count}} files)", { label, count: files }));
  }
}

function reportInputFile(
  projectRoot: string,
  relPath: string,
  label: string,
  pass: (section: string, message: string, note?: boolean) => void,
  fail: (section: string, message: string) => void,
  section: string
): void {
  const abs = path.resolve(projectRoot, relPath);
  if (fs.existsSync(abs)) {
    pass(section, t("{{label}} {{path}}", { label, path: relPath }));
    return;
  }
  fail(section, t("{{label}} {{path}} does not exist", { label, path: relPath }));
}

function reportOutputDir(
  projectRoot: string,
  relPath: string,
  label: string,
  pass: (section: string, message: string, note?: boolean) => void,
  fail: (section: string, message: string) => void,
  section: string
): void {
  const abs = path.resolve(projectRoot, relPath);
  if (!fs.existsSync(abs)) {
    pass(section, t("{{label}} {{path}} (created on first run)", { label, path: relPath }), true);
    return;
  }
  let stat: fs.Stats;
  try {
    stat = fs.statSync(abs);
  } catch (e) {
    fail(
      section,
      t("{{label}} {{path}} could not be read: {{message}}", {
        label,
        path: relPath,
        message: errorMessage(e),
      })
    );
    return;
  }
  if (!stat.isDirectory()) {
    fail(section, t("{{label}} {{path}} is not a directory", { label, path: relPath }));
    return;
  }
  try {
    fs.accessSync(abs, fs.constants.W_OK);
  } catch {
    fail(section, t("{{label}} {{path}} is not writable", { label, path: relPath }));
    return;
  }
  pass(section, t("{{label}} {{path}} exists", { label, path: relPath }));
}

function reportJsonFile(
  absPath: string,
  label: string,
  unit: "keys" | "entries",
  pass: (section: string, message: string, note?: boolean) => void,
  warn: (section: string, message: string) => void,
  section: string
): void {
  if (!fs.existsSync(absPath)) {
    const createdBy = unit === "keys" ? "extract" : "extract / generate-ui-languages";
    pass(section, t("{{label}} is missing; {{createdBy}} creates it", { label, createdBy }), true);
    return;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(absPath, "utf8")) as unknown;
    const count = Array.isArray(parsed)
      ? parsed.length
      : parsed && typeof parsed === "object"
        ? Object.keys(parsed).length
        : null;
    if (count === null) {
      warn(section, t("{{label}} is not a JSON object or array", { label }));
      return;
    }
    pass(
      section,
      unit === "keys"
        ? t("{{label}} ({{count}} keys)", { label, count })
        : t("{{label}} ({{count}} entries)", { label, count })
    );
  } catch (e) {
    warn(
      section,
      t("{{label}} could not be read: {{message}}", { label, message: errorMessage(e) })
    );
  }
}

function checkCache(
  config: I18nConfig,
  projectRoot: string,
  pass: (section: string, message: string, note?: boolean) => void,
  warn: (section: string, message: string) => void,
  section: string
): void {
  const cacheDir = path.resolve(projectRoot, config.cacheDir);
  const dbFile = path.join(cacheDir, "cache.db");
  if (!fs.existsSync(dbFile)) {
    pass(section, t("no cache database yet"), true);
  } else {
    const beforeVersion = readUserVersion(dbFile);
    let cache: TranslationCache | undefined;
    try {
      cache = new TranslationCache(cacheDir, { readOnly: true });
      const stats = cache.getStats();
      const detail = cache.getDetailedStats();
      const api = cache.getApiCallStats();
      const lastRow = cache.listApiCalls({ limit: 1 }).rows[0];
      const last = lastRow?.created_at ?? api.byMonth[0]?.month ?? "";
      if (stats.totalSegments === 0 && stats.totalFiles === 0 && api.summary.calls === 0) {
        pass(section, t("cache database is empty"), true);
      } else {
        pass(section, path.relative(projectRoot, dbFile) || dbFile, true);
        if (last) {
          pass(section, t("last API call {{when}}", { when: last }), true);
        }
        pass(
          section,
          t("tracked files {{files}} ({{rows}} file×locale rows)", {
            files: detail.uniqueFilepaths,
            rows: stats.totalFiles,
          }),
          true
        );
        pass(section, t("translation segments {{count}}", { count: stats.totalSegments }), true);
        pass(section, t("API calls {{count}}", { count: api.summary.calls }), true);
      }
    } catch (e) {
      warn(
        section,
        t("Could not read the cache database: {{message}}", { message: errorMessage(e) })
      );
    } finally {
      cache?.close();
    }
    const afterVersion = readUserVersion(dbFile);
    if (beforeVersion !== null && afterVersion !== null && beforeVersion !== afterVersion) {
      warn(section, t("Reading the cache changed its schema version"));
    }
  }

  const benchPath = benchmarkCachePath(projectRoot, config.cacheDir);
  if (!fs.existsSync(benchPath)) {
    pass(section, t("benchmark-scores.json is absent (suggest-models downloads it)"), true);
    return;
  }
  try {
    const cache = readBenchmarkCache(benchPath);
    if (!cache) {
      warn(section, t("benchmark-scores.json could not be read"));
      return;
    }
    const fetched = [
      cache.sources.languagebench.fetchedAt,
      cache.sources.arena.fetchedAt,
      cache.sources.modelsDev.fetchedAt,
    ].filter((value): value is string => typeof value === "string" && value.trim() !== "");
    fetched.sort();
    const newest = fetched.length > 0 ? fetched[fetched.length - 1]! : "";
    pass(
      section,
      t(
        "benchmark-scores.json: languagebench {{languagebench}}, arena {{arena}}, models.dev {{modelsDev}}{{fetched}}",
        {
          languagebench: Object.keys(cache.languagebench.models).length,
          arena: cache.arena.models.length,
          modelsDev: Object.keys(cache.modelsDev.pricing).length,
          fetched: newest ? t(" (fetched {{when}})", { when: newest.slice(0, 10) }) : "",
        }
      ),
      true
    );
  } catch (e) {
    warn(section, errorMessage(e));
  }
}

async function checkProviders(
  config: I18nConfig,
  projectRoot: string,
  options: RunDoctorOptions,
  ruleIssues: { message: string }[],
  pass: (section: string, message: string, note?: boolean) => void,
  warn: (section: string, message: string) => void,
  fail: (section: string, message: string) => void,
  section: string
): Promise<void> {
  let active = "";
  try {
    active = resolveActiveProvider(config);
  } catch (e) {
    fail(section, errorMessage(e));
  }

  const needsLlm = pipelineNeedsLlm(config);
  let activeSettings: ResolvedProviderSettings | undefined;
  for (const name of Object.keys(config.providers)) {
    let settings: ResolvedProviderSettings;
    try {
      settings = resolveProviderSettings(name, config);
    } catch (e) {
      fail(section, errorMessage(e));
      continue;
    }
    const isActive = name === active;
    if (isActive) {
      activeSettings = settings;
    }
    const keyName = settings.apiKeyEnv ?? "";
    const keySet = keyName ? Boolean(process.env[keyName]?.trim()) : false;
    const details: string[] = [];
    if (isActive) {
      details.push(t("active"));
    }
    if (!settings.requiresApiKey) {
      details.push(t("API key is not required"));
    } else if (keySet) {
      details.push(t("{{key}} is set", { key: keyName }));
    } else {
      const envBesideConfig = fs.existsSync(path.join(projectRoot, ".env"));
      const envInCwd = fs.existsSync(path.join(options.cwd, ".env"));
      details.push(
        isActive && (envBesideConfig || envInCwd)
          ? t("{{key}} is not set (.env is present but the variable is unset)", { key: keyName })
          : t("{{key}} is not set", { key: keyName })
      );
    }
    if (settings.baseUrl) {
      details.push(t("baseUrl {{url}}", { url: settings.baseUrl }));
    }
    const message = t("{{name}} ({{details}})", { name, details: details.join(", ") });
    if (isActive && needsLlm && settings.requiresApiKey && !keySet) {
      fail(section, message);
    } else {
      pass(section, message, !isActive);
    }
  }

  const models = active ? resolveTranslationModels(config) : [];
  if (active) {
    const modelsAlreadyReported = ruleIssues.some((issue) =>
      issue.message.includes("translationModels")
    );
    if (models.length === 0 && needsLlm && !modelsAlreadyReported) {
      fail(section, t("providers.{{provider}}.translationModels is empty", { provider: active }));
    } else if (!modelsAlreadyReported) {
      pass(section, t("translationModels ({{count}})", { count: models.length }));
    }
  }

  const keyMissing =
    activeSettings?.requiresApiKey === true &&
    !(activeSettings.apiKeyEnv && process.env[activeSettings.apiKeyEnv]?.trim());
  if (options.local === true) {
    pass(section, t("provider catalog was not checked"), true);
    return;
  }
  if (!needsLlm || keyMissing || models.length === 0) {
    return;
  }
  const status = await loadConfiguredModelCatalogStatus(config, {
    xTitle: "ai-i18n-tools doctor",
    fetchImpl: options.fetchImpl,
  });
  if (status.error) {
    fail(section, status.error);
    return;
  }
  if (status.missing.length > 0 || status.expired.length > 0) {
    const parts = [
      status.missing.length > 0
        ? t("missing {{ids}}", { ids: status.missing.map((item) => item.id).join(", ") })
        : "",
      status.expired.length > 0
        ? t("expired {{ids}}", { ids: status.expired.map((item) => item.id).join(", ") })
        : "",
    ].filter((part) => part !== "");
    fail(
      section,
      t("models in {{provider}}'s catalog: {{detail}}", {
        provider: active,
        detail: parts.join("; "),
      })
    );
    return;
  }
  pass(
    section,
    t("models in {{provider}}'s catalog ({{count}} ok)", {
      provider: active,
      count: status.ok.length,
    })
  );
}

function checkEnvironment(
  config: I18nConfig,
  pass: (section: string, message: string, note?: boolean) => void,
  section: string
): void {
  const secrets = secretEnvNames(config);
  const listed: string[] = [];
  for (const name of supportedEnvNames(config)) {
    const value = process.env[name]?.trim() ?? "";
    if (!value) {
      continue;
    }
    if (secrets.has(name)) {
      listed.push(t("{{name}} (set)", { name }));
    } else {
      listed.push(`${name}=${value.replace(/\s+/g, " ")}`);
    }
  }
  if (listed.length === 0) {
    pass(section, t("No supported environment variables are set"), true);
    return;
  }
  for (const line of listed) {
    pass(section, line);
  }
}

function printReport(checks: DoctorCheck[], summary: string): void {
  let current = "";
  for (const check of checks) {
    if (check.section !== current) {
      current = check.section;
      console.log(chalk.bold(`\n${current}`));
    }
    const mark =
      check.status === "fail"
        ? chalk.red("✗")
        : check.status === "warn"
          ? chalk.yellow("⚠")
          : check.note
            ? chalk.gray("·")
            : chalk.green("✓");
    const text =
      check.status === "fail"
        ? chalk.red(check.message)
        : check.status === "warn"
          ? chalk.yellow(check.message)
          : check.message;
    console.log(`  ${mark}  ${text}`);
  }
  console.log(`\n${summary}\n`);
}
