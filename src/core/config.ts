import fs from "fs";
import path from "path";
import { maybeRewriteConfigFile, preprocessLegacyConfigInput } from "./config-migrate.js";
import {
  assertDocSystemLocaleSubpath,
  normalizeI18nConfigDocsOutput,
} from "./docs-output-normalize.js";
import { ConfigValidationError } from "./errors.js";
import {
  coerceTargetLocalesField,
  disallowedScriptLetters,
  englishLanguageNameForLocale,
  englishScriptName,
  hanVariantCounts,
  isLatinScriptLocale,
  localePathPlaceholders,
  nonLatinLettersIn,
  normalizeLocale,
  parseLocaleList,
  scriptLetterCounts,
  scriptSubtag,
  scriptValidationIssue,
  unicodeScriptPropertyForSubtag,
} from "./locale-utils.js";
import {
  assertEffectiveLocalesInUiLanguagesMaster,
  buildUiLanguageRowsFromMaster,
  loadUiLanguagesMaster,
  resolveBundledUiLanguagesCompletePath,
} from "./ui-languages-catalog.js";
import {
  assertTargetLocalesAreLocaleCodes,
  expandDocTargetLocalesInRawInput,
  expandJsonTargetLocalesInRawInput,
  expandTargetLocalesFileReferenceInRawInput,
  getDocumentationTargetLocaleCodes,
  mergeUiLanguageDisplayNames,
  resolveLocalesForUI,
  type UiLanguageEntry,
} from "./ui-languages.js";
import {
  type DocBlock,
  type I18nConfig,
  type I18nDocTranslateConfig,
  type RawI18nConfigInput,
  i18nConfigSchema,
} from "./types.js";
import {
  allConfiguredModelIdsForProvider,
  dedupeOrderedModelIds,
  localeModelsForProvider,
  resolveActiveProvider,
  translationModelsForProvider,
  uiModelsForProvider,
} from "./llm-providers.js";

export {
  coerceTargetLocalesField,
  disallowedScriptLetters,
  englishLanguageNameForLocale,
  englishScriptName,
  hanVariantCounts,
  isLatinScriptLocale,
  localePathPlaceholders,
  nonLatinLettersIn,
  normalizeLocale,
  parseLocaleList,
  scriptLetterCounts,
  scriptSubtag,
  scriptValidationIssue,
  unicodeScriptPropertyForSubtag,
};

const DEFAULT_OPENROUTER_MODELS: string[] = [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex",
];

/**
 * Ordered translation-model fallback chain for the active provider. Returns `[]` (rather than
 * throwing) when no provider can be resolved, so callers can surface a friendly validation error.
 */
export function resolveTranslationModels(
  config: Pick<I18nConfig, "provider" | "providers">
): string[] {
  let active: string;
  try {
    active = resolveActiveProvider(config);
  } catch {
    return [];
  }
  return translationModelsForProvider(config, active);
}

export { dedupeOrderedModelIds } from "./llm-providers.js";

export interface ResolveTranslationModelsForLocaleOptions {
  /** When true, include `uiModels` between locale and global `translationModels` tiers. */
  ui?: boolean;
}

/**
 * Ordered model fallback chain for a target locale on the active provider.
 *
 * - UI tasks: `localeModels(locale)` → `uiModels` → `translationModels`
 * - Other tasks: `localeModels(locale)` → `translationModels`
 */
export function resolveTranslationModelsForLocale(
  config: Pick<I18nConfig, "provider" | "providers">,
  locale: string,
  opts?: ResolveTranslationModelsForLocaleOptions
): string[] {
  let active: string;
  try {
    active = resolveActiveProvider(config);
  } catch {
    return [];
  }
  const localeTier = localeModelsForProvider(config, active, locale);
  const translationTier = translationModelsForProvider(config, active);
  if (opts?.ui) {
    const uiTier = uiModelsForProvider(config, active);
    return dedupeOrderedModelIds(localeTier, uiTier, translationTier);
  }
  return dedupeOrderedModelIds(localeTier, translationTier);
}

/**
 * Ordered models for UI translation for a locale: {@link resolveTranslationModelsForLocale} with `ui: true`.
 */
export function resolveUITranslationModels(
  config: Pick<I18nConfig, "provider" | "providers">,
  locale: string
): string[] {
  return resolveTranslationModelsForLocale(config, locale, { ui: true });
}

/**
 * Union of all model ids on the active provider (`translationModels`, `uiModels`, `localeModels`).
 * Used by `check-models`.
 */
export function resolveAllConfiguredModelIds(
  config: Pick<I18nConfig, "provider" | "providers">
): string[] {
  let active: string;
  try {
    active = resolveActiveProvider(config);
  } catch {
    return [];
  }
  return allConfiguredModelIdsForProvider(config, active);
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
function mergeDocSourceFiles(raw: Record<string, unknown>): void {
  const docs = raw.docs;
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
export function toDocTranslateConfig(root: I18nConfig, block: DocBlock): I18nDocTranslateConfig {
  const { docs: _, ...rest } = root;
  return { ...rest, doc: block };
}

export const defaultI18nConfigPartial: RawI18nConfigInput = {
  sourceLocale: "en",
  targetLocales: [],
  provider: "openrouter",
  providers: {
    openrouter: {
      translationModels: [...DEFAULT_OPENROUTER_MODELS],
    },
  },
  features: {
    translateUIStrings: false,
    translateDocs: false,
    translateJson: false,
    translateSVG: false,
  },
  glossary: {},
  ui: {
    sourceRoots: [],
    stringsJson: "strings.json",
    flatOutputDir: "./locales",
  },
  cacheDir: ".translation-cache",
  docs: [
    {
      contentPaths: [],
      outputDir: "./i18n",
      docsOutput: {},
    },
  ],
  json: [],
};

/**
 * Merge user JSON (partial) with package defaults, then validate with Zod.
 */
export function mergeWithDefaults(raw: unknown): RawI18nConfigInput {
  const asObj =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const preprocessed = preprocessLegacyConfigInput(asObj) as Record<string, unknown>;
  mergeDocSourceFiles(preprocessed);
  const merged = deepMergeDefaults(
    defaultI18nConfigPartial as unknown as Record<string, unknown>,
    preprocessed
  ) as RawI18nConfigInput;
  applyDefaultLanguagesManifestPathToRawInput(merged);
  return merged;
}

/**
 * When `languagesManifestPath` is unset, default to `{ui.flatOutputDir}/ui-languages.json` (generated by `extract`).
 */
export function applyDefaultLanguagesManifestPathToRawInput(raw: RawI18nConfigInput): void {
  if (raw.languagesManifestPath?.trim()) {
    return;
  }
  const ui =
    raw.ui && typeof raw.ui === "object" && !Array.isArray(raw.ui)
      ? (raw.ui as Record<string, unknown>)
      : {};
  const flat =
    typeof ui.flatOutputDir === "string" && ui.flatOutputDir.trim()
      ? String(ui.flatOutputDir).trim()
      : "./locales";
  raw.languagesManifestPath = path.join(flat, "ui-languages.json");
}

/** @deprecated Use {@link applyDefaultLanguagesManifestPathToRawInput} */
export const applyDefaultUiLanguagesPathToRawInput = applyDefaultLanguagesManifestPathToRawInput;

/** Merge `englishName` hints from the bundled master catalog (`sourceLocale` + `targetLocales`), not from project `ui-languages.json`. */
export function augmentConfigWithUiLanguagesMaster(config: I18nConfig): I18nConfig {
  const masterPath = resolveBundledUiLanguagesCompletePath();
  if (!fs.existsSync(masterPath)) {
    return config;
  }
  try {
    const master = loadUiLanguagesMaster(masterPath);
    const { rows } = buildUiLanguageRowsFromMaster(config, master);
    const entries: UiLanguageEntry[] = rows.map((r) => ({
      code: r.code,
      label: r.label,
      englishName: r.englishName,
      direction: r.direction,
    }));
    return mergeUiLanguageDisplayNames(config, entries);
  } catch (e) {
    throw new Error(
      `Could not load bundled ui-languages master for display names: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

export function validateI18nBusinessRules(config: I18nConfig): void {
  const needsDocTranslation =
    config.features.translateDocs ||
    config.docs.some((d) => Boolean(d.docusaurusCatalogDir?.trim()));
  const needsUITranslation = config.features.translateUIStrings;
  const src = normalizeLocale(config.sourceLocale);
  const needsSvgTranslation = config.features.translateSVG && Boolean(config.svg);
  const needsSvgApi =
    needsSvgTranslation &&
    getDocumentationTargetLocaleCodes(config).some((l) => normalizeLocale(l) !== src);

  if (config.features.translateSVG && !config.svg) {
    throw new ConfigValidationError(
      "translateSVG is enabled but no svg block is configured (sourcePath, outputDir, style)"
    );
  }

  if (needsDocTranslation || needsUITranslation || needsSvgApi) {
    const activeProvider = resolveActiveProvider(config);
    const models = translationModelsForProvider(config, activeProvider);
    if (models.length === 0) {
      throw new ConfigValidationError(
        `providers.${activeProvider}.translationModels (non-empty array) is required when translateUIStrings, translateSVG (with non-source locales), or doc translate features are enabled`
      );
    }
  }

  assertTargetLocalesAreLocaleCodes(config.targetLocales, "targetLocales");
  for (const d of config.docs) {
    if (d.targetLocales?.length) {
      assertTargetLocalesAreLocaleCodes(d.targetLocales, "docs[].targetLocales");
    }
  }

  if (needsDocTranslation && getDocumentationTargetLocaleCodes(config).length === 0) {
    throw new ConfigValidationError(
      "When translateDocs is enabled or docs[].docusaurusCatalogDir is set, set non-empty targetLocales " +
        "and/or docs[].targetLocales (documentation-only locale list)."
    );
  }

  if (config.features.translateJson) {
    const hasJsonSources = config.json.some((b) => b.contentPaths.length > 0);
    if (!hasJsonSources) {
      throw new ConfigValidationError(
        "translateJson is enabled but json[] has no contentPaths entries"
      );
    }
  }

  if (needsUITranslation && config.targetLocales.length === 0) {
    throw new ConfigValidationError(
      "targetLocales must be non-empty when translateUIStrings is enabled (list BCP-47 codes; `ui-languages.json` is generated by extract, not used as config input)"
    );
  }

  if (needsUITranslation && config.ui.sourceRoots.length === 0) {
    throw new ConfigValidationError(
      "ui.sourceRoots must be non-empty when translateUIStrings is enabled"
    );
  }

  if (config.features.translateDocs) {
    const hasPaths = config.docs.some((d: DocBlock) => d.contentPaths.length > 0);
    const hasCatalogOnly = config.docs.some(
      (d) => d.contentPaths.length === 0 && Boolean(d.docusaurusCatalogDir?.trim())
    );
    if (!hasPaths && !hasCatalogOnly) {
      throw new ConfigValidationError(
        "docs[].contentPaths must be non-empty in at least one block when translateDocs is enabled, unless a block only sets docusaurusCatalogDir for catalog JSON"
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
  const needsApi = getDocumentationTargetLocaleCodes(config).some(
    (l) => normalizeLocale(l) !== src
  );
  if (needsApi) {
    const activeProvider = resolveActiveProvider(config);
    const models = translationModelsForProvider(config, activeProvider);
    if (models.length === 0) {
      throw new ConfigValidationError(
        `translate-svg requires providers.${activeProvider}.translationModels when translating to non-source locales`
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
    type ZodParseIssue = (typeof parsed.error.issues)[number];
    const issues: { path: string; message: string }[] = parsed.error.issues.map(
      (e: ZodParseIssue) => ({
        path: e.path.join(".") || "(root)",
        message: e.message,
      })
    );
    throw new ConfigValidationError(
      `Invalid ai-i18n-tools config: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`,
      issues
    );
  }
  const normalized = normalizeI18nConfigDocsOutput(parsed.data);
  assertDocSystemLocaleSubpath(normalized);
  validateI18nBusinessRules(normalized);
  return normalized;
}

/**
 * Apply environment overrides (OpenRouter and optional locale hints).
 * Does not re-validate; call {@link parseI18nConfig} after merge if shape may have changed.
 */
export function applyEnvOverrides(config: I18nConfig): I18nConfig {
  const next: I18nConfig = { ...config, providers: { ...config.providers } };

  // Override base URLs only for providers the user already configured, so we never create an extra
  // provider entry (which would make the active-provider selection ambiguous).
  const openrouterBaseUrl = process.env.OPENROUTER_BASE_URL?.trim();
  if (openrouterBaseUrl && next.providers.openrouter) {
    next.providers.openrouter = { ...next.providers.openrouter, baseUrl: openrouterBaseUrl };
  }
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL?.trim();
  if (ollamaBaseUrl && next.providers.ollama) {
    next.providers.ollama = { ...next.providers.ollama, baseUrl: ollamaBaseUrl };
  }

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
/**
 * Set the active provider on raw config input (e.g. from the CLI `--provider` flag), overriding the
 * `provider` key. Throws when the requested provider is not configured under `providers`.
 */
export function applyProviderOverrideToRawInput(
  raw: RawI18nConfigInput,
  providerOverride: string
): void {
  const name = providerOverride.trim();
  if (!name) {
    return;
  }
  const providers = (raw.providers ?? {}) as Record<string, unknown>;
  const keys = Object.keys(providers);
  if (!Object.prototype.hasOwnProperty.call(providers, name)) {
    throw new ConfigValidationError(
      `--provider "${name}" is not defined in providers (${keys.length > 0 ? keys.join(", ") : "none configured"})`
    );
  }
  raw.provider = name;
}

export function loadI18nConfigFromFile(
  configPath: string,
  cwd = process.cwd(),
  providerOverride?: string
): I18nConfig {
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
  const rewrite = maybeRewriteConfigFile(resolved, json);
  if (rewrite.rewritten) {
    console.log(`[config] Updated ${path.basename(resolved)}: ${rewrite.messages.join(", ")}`);
    json = JSON.parse(fs.readFileSync(resolved, "utf8")) as unknown;
  }
  const merged = mergeWithDefaults(json);
  if (providerOverride !== undefined) {
    applyProviderOverrideToRawInput(merged, providerOverride);
  }
  expandTargetLocalesFileReferenceInRawInput(merged, cwd);
  expandDocTargetLocalesInRawInput(merged, cwd);
  expandJsonTargetLocalesInRawInput(merged, cwd);
  const parsed = parseI18nConfig(merged);
  assertEffectiveLocalesInUiLanguagesMaster(parsed);
  const withEnv = applyEnvOverrides(parsed);
  validateI18nBusinessRules(withEnv);
  const augmented = augmentConfigWithUiLanguagesMaster(withEnv);
  if (augmented.features.translateUIStrings && resolveLocalesForUI(augmented, cwd).length === 0) {
    throw new ConfigValidationError(
      "translateUIStrings is enabled but no UI target locales resolved: set non-empty targetLocales (BCP-47 codes)"
    );
  }
  return augmented;
}

/** Default filename for `init` / CLI (Phase 4). */
export const DEFAULT_CONFIG_FILENAME = "ai-i18n-tools.config.json";

/**
 * Template objects for `init`.
 *
 * `ui-markdown` - UI strings (extraction/translation) for a React/Next.js app.
 * `ui-docusaurus` - Documents (markdown/JSON translation) for Docusaurus sites.
 * `ui-starlight` - Documents (markdown translation) for Astro Starlight sites.
 * `ui-vitepress` - Documents (markdown translation) for VitePress sites, plus JSON theme JSON via `json[]`.
 *
 * Both templates include all top-level fields so the generated file is self-documenting.
 * See the documentation site and `docs/reference/configuration.md` for a full field reference.
 */
export const initConfigTemplates = {
  uiMarkdown: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en-GB",
    targetLocales: ["de", "fr", "es", "pt-BR"],
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: [...DEFAULT_OPENROUTER_MODELS],
      },
    },
    features: {
      // UI strings: UI strings (extract runs automatically before translate)
      translateUIStrings: true,
      // Documents: document translation (enable when you have markdown to translate)
      translateDocs: false,

      translateSVG: false,
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
    docs: [
      {
        contentPaths: [],
        outputDir: "./i18n",
        docsOutput: {
          style: "flat",
        },
        // Merged into translated markdown front matter (translation_*, source_*); omit or false to skip.
        addFrontmatter: true,
      },
    ],
  }),

  uiDocusaurus: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en",
    targetLocales: ["de", "fr", "ja", "pt-BR"],
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: [...DEFAULT_OPENROUTER_MODELS],
      },
    },
    features: {
      translateUIStrings: false,
      translateDocs: true,

      translateSVG: false,
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
    concurrency: 3,
    batchConcurrency: 4,
    batchSize: 20,
    maxBatchChars: 4096,
    cacheDir: ".translation-cache",
    docs: [
      {
        contentPaths: ["docs/"],
        outputDir: "i18n/",
        docusaurusCatalogDir: "i18n/en",
        docsOutput: {
          style: "docusaurus",
          docsRoot: "docs",
        },
        addFrontmatter: true,
      },
    ],
  }),

  uiStarlight: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en-GB",
    targetLocales: ["ar", "es", "fr", "de", "pt-BR"],
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: [...DEFAULT_OPENROUTER_MODELS],
      },
    },
    features: {
      translateUIStrings: false,
      translateDocs: true,

      translateSVG: false,
    },
    glossary: {
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: [],
      stringsJson: "strings.json",
      flatOutputDir: "./locales",
    },
    concurrency: 3,
    batchConcurrency: 4,
    batchSize: 20,
    maxBatchChars: 4096,
    cacheDir: ".translation-cache",
    docs: [
      {
        contentPaths: ["src/content/docs/quick-start.md", "src/content/docs/feature-showcase.mdx"],
        outputDir: "src/content/docs",
        docsOutput: {
          style: "astro-starlight",
          docsRoot: "src/content/docs",
          postProcessing: {
            regexAdjustments: [
              {
                description: "Per-locale screenshot folders in public assets",
                search: "screenshots/en-GB/",
                replace: "screenshots/${translatedLocale}/",
              },
            ],
          },
        },
        addFrontmatter: true,
      },
    ],
  }),

  uiVitepress: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en-GB",
    targetLocales: ["de", "fr", "es", "pt-BR"],
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: [...DEFAULT_OPENROUTER_MODELS],
      },
    },
    features: {
      translateUIStrings: false,
      translateDocs: true,
      translateJson: false,
      translateSVG: false,
    },
    glossary: {
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: [],
      stringsJson: "strings.json",
      flatOutputDir: "./locales",
    },
    concurrency: 3,
    batchConcurrency: 4,
    batchSize: 20,
    maxBatchChars: 4096,
    cacheDir: ".translation-cache",
    docs: [
      {
        contentPaths: ["docs/index.md", "docs/guide", "docs/reference"],
        outputDir: "docs",
        docsOutput: {
          style: "vitepress",
          docsRoot: "docs",
          rewriteVitepressLinks: true,
          vitepressThemeCatalog: {
            configPath: "docs/.vitepress/config.mts",
            catalogPath: "docs/.vitepress/i18n/theme.en.json",
          },
        },
        addFrontmatter: true,
      },
    ],
  }),

  uiNextra: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en-GB",
    targetLocales: ["pt-BR", "zh-Hans"],
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: [...DEFAULT_OPENROUTER_MODELS],
      },
    },
    features: {
      translateUIStrings: false,
      translateDocs: true,
      translateJson: false,
      translateSVG: false,
    },
    glossary: {
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: [],
      stringsJson: "strings.json",
      flatOutputDir: "./locales",
    },
    concurrency: 3,
    batchConcurrency: 4,
    batchSize: 20,
    maxBatchChars: 4096,
    cacheDir: ".translation-cache",
    docs: [
      {
        contentPaths: ["content/en"],
        outputDir: "content",
        nextraDictionaryPath: "app/_dictionaries/en.ts",
        docsOutput: {
          style: "nextra",
          docsRoot: "content/en",
          rewriteNextraLinks: true,
        },
        addFrontmatter: false,
      },
    ],
  }),

  uiFumadocs: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en-GB",
    targetLocales: ["pt", "zh"],
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: [...DEFAULT_OPENROUTER_MODELS],
      },
    },
    features: {
      translateUIStrings: false,
      translateDocs: true,
      translateJson: false,
      translateSVG: false,
    },
    glossary: {
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: [],
      stringsJson: "strings.json",
      flatOutputDir: "./locales",
    },
    concurrency: 3,
    batchConcurrency: 4,
    batchSize: 20,
    maxBatchChars: 4096,
    cacheDir: ".translation-cache",
    docs: [
      {
        contentPaths: ["content/docs"],
        outputDir: "content/docs",
        docsOutput: {
          style: "fumadocs",
          docsRoot: "content/docs",
          fumadocsParser: "dot",
          rewriteFumadocsLinks: true,
          fumadocsUiCatalog: {
            sourcePath: "lib/layout.shared.ts",
            catalogPath: "lib/i18n/ui.en.json",
          },
        },
        addFrontmatter: false,
      },
    ],
  }),

  uiAstroWebsite: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en",
    targetLocales: ["de", "fr"],
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: [...DEFAULT_OPENROUTER_MODELS],
      },
    },
    features: {
      translateUIStrings: true,
      translateDocs: false,

      translateSVG: false,
    },
    glossary: {
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: ["src/"],
      stringsJson: "src/i18n/strings.json",
      flatOutputDir: "public/locales",
      uiExtractor: {
        extensions: [".js", ".jsx", ".ts", ".tsx", ".astro"],
        funcNames: ["t", "i18n.t"],
        includePackageDescription: false,
      },
    },
    concurrency: 3,
    batchConcurrency: 4,
    batchSize: 20,
    maxBatchChars: 4096,
    cacheDir: ".translation-cache",
    languagesManifestPath: "src/i18n/ui-languages.json",
    docs: [],
  }),

  uiJsonBundles: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en",
    targetLocales: ["de", "fr"],
    provider: "openrouter",
    providers: {
      openrouter: {
        translationModels: [...DEFAULT_OPENROUTER_MODELS],
      },
    },
    features: {
      translateUIStrings: false,
      translateDocs: false,
      translateJson: true,
      translateSVG: false,
    },
    glossary: {
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: [],
      stringsJson: "strings.json",
      flatOutputDir: "./locales",
    },
    cacheDir: ".translation-cache",
    json: [
      {
        description: "Per-locale UI JSON bundle",
        contentPaths: "src/i18n/en/translation.json",
        outputPathTemplate: "src/i18n/{llocale}/translation.json",
        keyPolicy: {
          mode: "denylist",
          skipKeys: ["id", "slug", "href", "url", "key", "code"],
          translateKeys: [],
        },
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
