import fs from "fs";
import path from "path";
import { ConfigValidationError } from "./errors.js";
import {
  coerceTargetLocalesField,
  englishLanguageNameForLocale,
  normalizeLocale,
  parseLocaleList,
} from "./locale-utils.js";
import {
  augmentConfigWithUiLanguagesFile,
  expandDocumentationTargetLocalesInRawInput,
  expandTargetLocalesFileReferenceInRawInput,
  getDocumentationTargetLocaleCodes,
  resolveLocalesForUI,
} from "./ui-languages.js";
import {
  type DocumentationBlock,
  type I18nConfig,
  type I18nDocTranslateConfig,
  type OpenRouterConfig,
  type RawI18nConfigInput,
  i18nConfigSchema,
} from "./types.js";

export { coerceTargetLocalesField, englishLanguageNameForLocale, normalizeLocale, parseLocaleList };

const DEFAULT_OPENROUTER_MODELS: string[] = [
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v3.2",
  "google/gemini-3.1-flash-lite-preview",
  "qwen/qwen3.6-plus",
  "moonshotai/kimi-k2.5",
  "anthropic/claude-sonnet-4.6"
];

/**
 * Ordered OpenRouter models: non-empty `translationModels`, else legacy default + fallback.
 */
export function resolveTranslationModels(o: OpenRouterConfig): string[] {
  if (Array.isArray(o.translationModels) && o.translationModels.length > 0) {
    const list = o.translationModels
      .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
      .map((m) => m.trim());
    if (list.length > 0) {
      return list;
    }
  }
  const out: string[] = [];
  if (o.defaultModel?.trim()) {
    out.push(o.defaultModel.trim());
  }
  const fb = o.fallbackModel?.trim();
  if (fb && fb !== out[0]) {
    out.push(fb);
  }
  return out;
}

/**
 * Ordered OpenRouter models for UI translation: optional `ui.preferredModel` first, then
 * {@link resolveTranslationModels} for `openrouter`, with the preferred id deduplicated from the tail.
 */
export function resolveUITranslationModels(config: I18nConfig): string[] {
  const base = resolveTranslationModels(config.openrouter);
  const pref = config.ui.preferredModel?.trim();
  if (!pref) {
    return base;
  }
  const out: string[] = [pref];
  for (const m of base) {
    if (m !== pref) {
      out.push(m);
    }
  }
  return out;
}

function deepMergeDefaults<T extends Record<string, unknown>>(base: T, override: unknown): T {
  if (
    override === null ||
    override === undefined ||
    typeof override !== "object" ||
    Array.isArray(override)
  ) {
    return base;
  }
  const o = override as Record<string, unknown>;
  const next = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(o)) {
    const bv = next[key];
    const ov = o[key];
    if (
      ov !== undefined &&
      typeof ov === "object" &&
      ov !== null &&
      !Array.isArray(ov) &&
      typeof bv === "object" &&
      bv !== null &&
      !Array.isArray(bv)
    ) {
      next[key] = deepMergeDefaults(bv as Record<string, unknown>, ov);
    } else if (ov !== undefined) {
      next[key] = ov;
    }
  }
  return next as T;
}

/** Merge each block's `sourceFiles` into `contentPaths` (unique). */
function mergeDocumentationSourceFiles(raw: Record<string, unknown>): void {
  const docs = raw.documentations;
  if (!Array.isArray(docs)) {
    return;
  }
  for (const item of docs) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const d = item as Record<string, unknown>;
    const cp = d.contentPaths;
    const sf = d.sourceFiles;
    const list: string[] = Array.isArray(cp) ? [...(cp as string[])] : [];
    if (Array.isArray(sf)) {
      for (const p of sf as string[]) {
        if (typeof p === "string" && p.trim() && !list.includes(p)) {
          list.push(p);
        }
      }
    }
    d.contentPaths = list;
  }
}

/**
 * Single-documentation view for translate-docs: one block plus root `cacheDir` and shared settings.
 */
export function toDocTranslateConfig(root: I18nConfig, block: DocumentationBlock): I18nDocTranslateConfig {
  const { documentations: _, ...rest } = root;
  return { ...rest, documentation: block };
}

export const defaultI18nConfigPartial: RawI18nConfigInput = {
  sourceLocale: "en",
  targetLocales: [],
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    translationModels: [...DEFAULT_OPENROUTER_MODELS],
    maxTokens: 8192,
    temperature: 0.2,
  },
  features: {
    extractUIStrings: false,
    translateUIStrings: false,
    translateMarkdown: false,
    translateJSON: false,
  },
  glossary: {},
  ui: {
    sourceRoots: [],
    stringsJson: "strings.json",
    flatOutputDir: "./locales",
  },
  cacheDir: ".translation-cache",
  documentations: [
    {
      contentPaths: [],
      outputDir: "./i18n",
      markdownOutput: {},
    },
  ],
};

/**
 * Merge user JSON (partial) with package defaults, then validate with Zod.
 */
export function mergeWithDefaults(raw: unknown): RawI18nConfigInput {
  const asObj =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  mergeDocumentationSourceFiles(asObj);
  return deepMergeDefaults(
    defaultI18nConfigPartial as unknown as Record<string, unknown>,
    asObj
  ) as RawI18nConfigInput;
}

export function validateI18nBusinessRules(config: I18nConfig): void {
  const models = resolveTranslationModels(config.openrouter);
  const needsDocTranslation =
    config.features.translateMarkdown || config.features.translateJSON;
  const needsExtract = config.features.extractUIStrings;
  const needsUITranslation = config.features.translateUIStrings;

  if ((needsDocTranslation || needsUITranslation) && models.length === 0) {
    throw new ConfigValidationError(
      "openrouter.translationModels (non-empty array), or legacy defaultModel, is required when translateUIStrings or doc translate features are enabled"
    );
  }

  const uiTargetsFromFileOnly =
    needsUITranslation &&
    !needsDocTranslation &&
    Boolean(config.uiLanguagesPath?.trim());

  if (needsDocTranslation && getDocumentationTargetLocaleCodes(config).length === 0) {
    throw new ConfigValidationError(
      "When translateMarkdown / translateJSON is enabled, set non-empty targetLocales " +
        "and/or documentations[].targetLocales (documentation-only locale list)."
    );
  }

  if (needsUITranslation && config.targetLocales.length === 0 && !uiTargetsFromFileOnly) {
    throw new ConfigValidationError(
      "targetLocales must be non-empty when translateUIStrings is enabled (unless only UI translation is on and uiLanguagesPath points at your ui-languages.json), " +
        "or use a single manifest path in targetLocales (e.g. [\"src/renderer/locales/ui-languages.json\"])"
    );
  }

  if (needsExtract && config.ui.sourceRoots.length === 0) {
    throw new ConfigValidationError(
      "ui.sourceRoots must be non-empty when extractUIStrings is enabled"
    );
  }

  if (needsDocTranslation) {
    const hasPaths = config.documentations.some((d) => d.contentPaths.length > 0);
    if (!hasPaths) {
      throw new ConfigValidationError(
        "documentations[].contentPaths must be non-empty in at least one block when translateMarkdown / translateJSON is enabled"
      );
    }
  }
}

/** Validate config for the `translate-svg` command (call after normal load). */
export function assertSvgCommandConfig(config: I18nConfig): void {
  if (!config.svg) {
    throw new ConfigValidationError(
      "translate-svg requires an svg block in config: sourcePath, outputDir, style (flat | nested)"
    );
  }
  const src = normalizeLocale(config.sourceLocale);
  const needsApi = getDocumentationTargetLocaleCodes(config).some((l) => normalizeLocale(l) !== src);
  if (needsApi) {
    const models = resolveTranslationModels(config.openrouter);
    if (models.length === 0) {
      throw new ConfigValidationError(
        "translate-svg requires openrouter.translationModels (or legacy defaultModel) when translating to non-source locales"
      );
    }
  }
}

/**
 * Parse and validate unified config (after optional merge with {@link mergeWithDefaults}).
 */
export function parseI18nConfig(input: RawI18nConfigInput): I18nConfig {
  const parsed = i18nConfigSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((e) => ({
      path: e.path.join(".") || "(root)",
      message: e.message,
    }));
    throw new ConfigValidationError(
      `Invalid ai-i18n-tools config: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
      issues
    );
  }
  validateI18nBusinessRules(parsed.data);
  return parsed.data;
}

/**
 * Apply environment overrides (OpenRouter and optional locale hints).
 * Does not re-validate; call {@link parseI18nConfig} after merge if shape may have changed.
 */
export function applyEnvOverrides(config: I18nConfig): I18nConfig {
  const baseUrl = process.env.OPENROUTER_BASE_URL?.trim();
  const next: I18nConfig = {
    ...config,
    openrouter: {
      ...config.openrouter,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };

  const targetsEnv = process.env.I18N_TARGET_LOCALES?.trim();
  if (targetsEnv) {
    next.targetLocales = parseLocaleList(targetsEnv);
  }

  const sourceEnv = process.env.I18N_SOURCE_LOCALE?.trim();
  if (sourceEnv) {
    next.sourceLocale = normalizeLocale(sourceEnv);
  }

  return next;
}

/**
 * Load `ai-i18n-tools.config.json` or a given path; merge defaults; validate.
 */
export function loadI18nConfigFromFile(configPath: string, cwd = process.cwd()): I18nConfig {
  const resolved = path.isAbsolute(configPath) ? configPath : path.join(cwd, configPath);
  if (!fs.existsSync(resolved)) {
    throw new ConfigValidationError(`Config file not found: ${resolved}`);
  }
  const text = fs.readFileSync(resolved, "utf8");
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch (e) {
    throw new ConfigValidationError(
      `Invalid JSON in config file: ${resolved}: ${e instanceof Error ? e.message : String(e)}`
    );
  }
  const merged = mergeWithDefaults(json);
  expandTargetLocalesFileReferenceInRawInput(merged, cwd);
  expandDocumentationTargetLocalesInRawInput(merged, cwd);
  const parsed = parseI18nConfig(merged);
  const withEnv = applyEnvOverrides(parsed);
  validateI18nBusinessRules(withEnv);
  const augmented = augmentConfigWithUiLanguagesFile(withEnv, cwd);
  if (
    augmented.features.translateUIStrings &&
    resolveLocalesForUI(augmented, cwd).length === 0
  ) {
    throw new ConfigValidationError(
      "translateUIStrings is enabled but no UI target locales resolved: set targetLocales to a locale array, " +
        "a string path to ui-languages.json, and/or uiLanguagesPath (see docs/GETTING_STARTED.md)"
    );
  }
  return augmented;
}

/** Default filename for `init` / CLI (Phase 4). */
export const DEFAULT_CONFIG_FILENAME = "ai-i18n-tools.config.json";

/**
 * Template objects for `init`.
 *
 * `ui-markdown` - Workflow 1 (UI string extraction/translation) for a React/Next.js app.
 * `ui-docusaurus` - Workflow 2 (markdown/JSON document translation) for Docusaurus sites.
 *
 * Both templates include all top-level fields so the generated file is self-documenting.
 * See docs/GETTING_STARTED.md for a full annotated explanation of every field.
 */
export const initConfigTemplates = {
  uiMarkdown: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en-GB",
    // Must match sourceLocale - path to ui-languages.json OR an array of BCP-47 codes
    targetLocales: "src/locales/ui-languages.json",
    openrouter: {
      baseUrl: "https://openrouter.ai/api/v1",
      translationModels: [...DEFAULT_OPENROUTER_MODELS],
      maxTokens: 8192,
      temperature: 0.2,
    },
    features: {
      // Workflow 1: UI string extraction and translation
      extractUIStrings: true,
      translateUIStrings: true,
      // Workflow 2: document translation (enable when you have markdown to translate)
      translateMarkdown: false,
      translateJSON: false,
    },
    glossary: {
      uiGlossary: "src/locales/strings.json",
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: ["src/"],
      stringsJson: "src/locales/strings.json",
      flatOutputDir: "src/locales/",
    },
    // Parallelism: translate-ui effective default 4; translate-docs effective default 3 when omitted.
    concurrency: 4,
    // translate-docs: max parallel OpenRouter batch requests per file.
    batchConcurrency: 4,
    batchSize: 20,
    maxBatchChars: 4096,
    cacheDir: ".translation-cache",
    documentations: [
      {
        contentPaths: [],
        outputDir: "./i18n",
        markdownOutput: {
          style: "flat",
        },
        // Merged into translated markdown front matter (translation_*, source_*); omit or false to skip.
        injectTranslationMetadata: true,
      },
    ],
  }),

  uiDocusaurus: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en",
    // Must match Docusaurus defaultLocale - path to ui-languages.json OR array of BCP-47 codes
    targetLocales: "i18n/ui-languages.json",
    openrouter: {
      baseUrl: "https://openrouter.ai/api/v1",
      translationModels: [...DEFAULT_OPENROUTER_MODELS],
      maxTokens: 8192,
      temperature: 0.2,
    },
    features: {
      // Workflow 1: enable if you also have a React UI with t() calls to extract
      extractUIStrings: false,
      translateUIStrings: false,
      // Workflow 2: Docusaurus document translation
      translateMarkdown: true,
      translateJSON: true,
    },
    glossary: {
      uiGlossary: "src/locales/strings.json",
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: ["src/"],
      stringsJson: "src/locales/strings.json",
      flatOutputDir: "src/locales/",
    },
    // Docs-focused template: match translate-docs default (3) for parallel locales.
    concurrency: 3,
    batchConcurrency: 4,
    batchSize: 20,
    maxBatchChars: 4096,
    cacheDir: ".translation-cache",
    documentations: [
      {
        contentPaths: ["docs/"],
        outputDir: "i18n/",
        jsonSource: "i18n/en",
        markdownOutput: {
          // 'docusaurus' places translated files under i18n/<locale>/docusaurus-plugin-content-docs/current/
          style: "docusaurus",
          docsRoot: "docs",
        },
        injectTranslationMetadata: true,
      },
    ],
  }),
} as const;

/**
 * Write a starter config JSON for `ai-i18n-tools init`.
 * See docs/GETTING_STARTED.md for a full annotated explanation of every field.
 */
export function writeInitConfigFile(
  outPath: string,
  template: keyof typeof initConfigTemplates,
  cwd = process.cwd()
): void {
  const resolved = path.isAbsolute(outPath) ? outPath : path.join(cwd, outPath);
  const raw = initConfigTemplates[template]();
  const merged = mergeWithDefaults(raw);
  parseI18nConfig(merged);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}
