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
  effectiveScriptSubtag,
  englishLanguageNameForLocale,
  englishScriptName,
  expectedUnicodeScriptsForSubtag,
  hanVariantCounts,
  isLatinScriptLocale,
  localeEnforcesOutputScript,
  localePathPlaceholders,
  nonLatinLettersIn,
  normalizeLocale,
  parseLocaleList,
  scriptLetterCounts,
  scriptSubtag,
  batchScriptValidationIssue,
  batchTranslationScriptIssue,
  scriptValidationIssue,
  translationScriptIssue,
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
  type UiLanguageEntry,
} from "./ui-languages.js";
import {
  configHasDocWork,
  configHasJsonWork,
  configHasUiWork,
  effectiveUiManifestRel,
  effectiveUiTargetLocales,
  resolveConfigPath,
  resolveLocalesForUiBlock,
  uiBlockHasSourceRoots,
} from "./ui-blocks.js";
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
  isPresetProvider,
  localeModelsForProvider,
  PROVIDER_PRESETS,
  resolveActiveProvider,
  translationModelsForProvider,
  uiModelsForProvider,
} from "./llm-providers.js";

export {
  coerceTargetLocalesField,
  disallowedScriptLetters,
  effectiveScriptSubtag,
  englishLanguageNameForLocale,
  englishScriptName,
  expectedUnicodeScriptsForSubtag,
  hanVariantCounts,
  isLatinScriptLocale,
  localeEnforcesOutputScript,
  localePathPlaceholders,
  nonLatinLettersIn,
  normalizeLocale,
  parseLocaleList,
  scriptLetterCounts,
  scriptSubtag,
  batchScriptValidationIssue,
  batchTranslationScriptIssue,
  scriptValidationIssue,
  translationScriptIssue,
  unicodeScriptPropertyForSubtag,
};

const DEFAULT_OPENROUTER_MODELS: string[] = [
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.3-70b-instruct",
  "openai/gpt-4o-mini",
  "google/gemma-4-26b-a4b-it",
  "~anthropic/claude-haiku-latest",
  "z-ai/glm-5.2",
  "google/gemini-3.5-flash",
  "~anthropic/claude-sonnet-latest",
];

/** Default `translationModels` scaffolded by `init -P <provider>` for each built-in provider. */
export const DEFAULT_INIT_MODELS_BY_PROVIDER: Readonly<Record<string, readonly string[]>> = {
  openrouter: DEFAULT_OPENROUTER_MODELS,
  openai: ["gpt-4o-mini", "gpt-4o"],
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"],
  gemini: ["gemini-2.5-flash", "gemini-3.5-flash"],
  deepseek: ["deepseek-v4-flash", "deepseek-v4-pro"],
  groq: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
  mistral: ["mistral-small-latest", "mistral-large-latest"],
  cerebras: ["gpt-oss-120b"],
  xai: ["grok-4.5"],
  nvidia: ["meta/llama-3.1-8b-instruct", "openai/gpt-oss-20b"],
  alibaba: ["qwen-plus", "qwen-flash"],
  apifun: ["gpt-4o-mini"],
  ollama: ["llama3.2:3b", "mistral-nemo:12b"],
} as const;

export const DEFAULT_INIT_PROVIDER_KEY = "openrouter";

/** Built-in preset keys accepted by `init -P` / `--provider`. */
export function listPresetInitProviderKeys(): string[] {
  return Object.keys(PROVIDER_PRESETS).sort();
}

/** Throws {@link ConfigValidationError} when `providerKey` is not a built-in preset. */
export function assertPresetInitProvider(providerKey: string): void {
  if (!isPresetProvider(providerKey)) {
    throw new ConfigValidationError(
      `Unknown provider "${providerKey}" for init: choose a built-in preset (${listPresetInitProviderKeys().join(", ")})`
    );
  }
}

/** Starter `translationModels` for `init -P <provider>`. */
export function defaultInitModelsForProvider(providerKey: string): readonly string[] {
  return DEFAULT_INIT_MODELS_BY_PROVIDER[providerKey] ?? DEFAULT_OPENROUTER_MODELS;
}

/** `provider` / `providers` block written by `init` for a built-in preset. */
export function buildInitProviderBlock(
  providerKey: string
): Pick<RawI18nConfigInput, "provider" | "providers"> {
  return {
    provider: providerKey,
    providers: {
      [providerKey]: {
        translationModels: [...defaultInitModelsForProvider(providerKey)],
      },
    },
  };
}

/** Replace `provider` / `providers` on a scaffold template before writing init output. */
export function applyInitProvider(
  raw: RawI18nConfigInput,
  providerKey: string
): RawI18nConfigInput {
  const next = { ...raw, ...buildInitProviderBlock(providerKey) };
  const explicit = explicitFeatureFlagsFor(raw);
  if (explicit) {
    rememberExplicitFeatureFlags(next, explicit);
  }
  return next;
}

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

const FEATURE_FLAG_KEYS = [
  "translateUIStrings",
  "translateDocs",
  "translateJson",
  "translateSVG",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

/** Which `features` keys the user wrote, before defaults fill the rest in as true. */
export type ExplicitFeatureFlags = Record<FeatureFlagKey, boolean>;

const explicitFeaturesByInput = new WeakMap<object, ExplicitFeatureFlags>();
const explicitFeaturesByConfig = new WeakMap<I18nConfig, ExplicitFeatureFlags>();

export function readExplicitFeatureFlags(raw: unknown): ExplicitFeatureFlags {
  const root =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const features =
    root.features !== null && typeof root.features === "object" && !Array.isArray(root.features)
      ? (root.features as Record<string, unknown>)
      : {};
  const explicit = {} as ExplicitFeatureFlags;
  for (const key of FEATURE_FLAG_KEYS) {
    explicit[key] = Object.prototype.hasOwnProperty.call(features, key);
  }
  return explicit;
}

function rememberExplicitFeatureFlags(target: object, explicit: ExplicitFeatureFlags): void {
  explicitFeaturesByInput.set(target, explicit);
}

export function explicitFeatureFlagsFor(value: object): ExplicitFeatureFlags | undefined {
  return explicitFeaturesByInput.get(value) ?? explicitFeaturesByConfig.get(value as I18nConfig);
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
    translateUIStrings: true,
    translateDocs: true,
    translateJson: true,
    translateSVG: true,
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
  const explicit = readExplicitFeatureFlags(asObj);
  const preprocessed = preprocessLegacyConfigInput(asObj) as Record<string, unknown>;
  mergeDocSourceFiles(preprocessed);
  const merged = deepMergeDefaults(
    defaultI18nConfigPartial as unknown as Record<string, unknown>,
    preprocessed
  ) as RawI18nConfigInput;
  applyDefaultLanguagesManifestPathToRawInput(merged);
  rememberExplicitFeatureFlags(merged, explicit);
  return merged;
}

/**
 * When `languagesManifestPath` is unset, default it to block 0's manifest so docs
 * language-switcher labels and `extract` share one path.
 */
export function applyDefaultLanguagesManifestPathToRawInput(raw: RawI18nConfigInput): void {
  if (raw.languagesManifestPath?.trim()) {
    return;
  }
  const ui = raw.ui;
  const first = Array.isArray(ui) ? ui[0] : ui;
  const block =
    first && typeof first === "object" && !Array.isArray(first)
      ? (first as Record<string, unknown>)
      : {};
  const own =
    typeof block.languagesManifestPath === "string" && block.languagesManifestPath.trim()
      ? block.languagesManifestPath.trim()
      : "";
  if (own) {
    raw.languagesManifestPath = own;
    return;
  }
  const flat =
    typeof block.flatOutputDir === "string" && block.flatOutputDir.trim()
      ? String(block.flatOutputDir).trim()
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

function explicitOrAll(config: I18nConfig, explicit?: ExplicitFeatureFlags): ExplicitFeatureFlags {
  return (
    explicit ??
    explicitFeaturesByConfig.get(config) ?? {
      translateUIStrings: true,
      translateDocs: true,
      translateJson: true,
      translateSVG: true,
    }
  );
}

function assertUniqueUiPaths(config: I18nConfig): void {
  const seen = new Map<string, string>();
  const claim = (abs: string, label: string): void => {
    const key = abs.split("\\").join("/");
    const prev = seen.get(key);
    if (prev) {
      throw new ConfigValidationError(
        `UI blocks must use distinct paths. ${label} and ${prev} both resolve to ${key}.`
      );
    }
    seen.set(key, label);
  };
  config.ui.forEach((block, index) => {
    const paths = {
      stringsJson: resolveConfigPath(process.cwd(), block.stringsJson),
      flatOutputDir: resolveConfigPath(process.cwd(), block.flatOutputDir),
      manifest: resolveConfigPath(process.cwd(), effectiveUiManifestRel(config, block, index)),
    };
    claim(paths.stringsJson, `ui[${index}].stringsJson`);
    claim(paths.flatOutputDir, `ui[${index}].flatOutputDir`);
    claim(paths.manifest, `ui[${index}] manifest`);
  });
}

function assertUniqueUiDescriptions(config: I18nConfig): void {
  const seen = new Map<string, number>();
  config.ui.forEach((block, index) => {
    const description = block.description?.trim();
    if (!description) {
      return;
    }
    const prev = seen.get(description);
    if (prev !== undefined) {
      throw new ConfigValidationError(
        `ui[${prev}].description and ui[${index}].description are both ${JSON.stringify(description)}. Descriptions must be unique because --ui-block can select a block by description.`
      );
    }
    seen.set(description, index);
  });
}

export function validateI18nBusinessRules(
  config: I18nConfig,
  explicitFeatures?: ExplicitFeatureFlags
): void {
  const explicit = explicitOrAll(config, explicitFeatures);
  const uiOn = config.features.translateUIStrings;
  const docsOn = config.features.translateDocs;
  const jsonOn = config.features.translateJson;
  const svgOn = config.features.translateSVG;
  const hasUi = configHasUiWork(config);
  const hasDocs = configHasDocWork(config);
  const hasJson = configHasJsonWork(config);
  const hasSvg = Boolean(config.svg);
  const needsUITranslation = uiOn && hasUi;
  const needsDocTranslation = docsOn && hasDocs;
  const src = normalizeLocale(config.sourceLocale);
  const needsSvgTranslation = svgOn && hasSvg;
  const needsSvgApi =
    needsSvgTranslation &&
    getDocumentationTargetLocaleCodes(config).some((l) => normalizeLocale(l) !== src);

  if (svgOn && explicit.translateSVG && !hasSvg) {
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
  config.ui.forEach((block, index) => {
    if (block.targetLocales?.length) {
      assertTargetLocalesAreLocaleCodes(block.targetLocales, `ui[${index}].targetLocales`);
    }
  });

  if (needsDocTranslation && getDocumentationTargetLocaleCodes(config).length === 0) {
    throw new ConfigValidationError(
      "When translateDocs is enabled or docs[].docusaurusCatalogDir is set, set non-empty targetLocales " +
        "and/or docs[].targetLocales (documentation-only locale list)."
    );
  }

  if (jsonOn && explicit.translateJson && !hasJson) {
    throw new ConfigValidationError(
      "translateJson is enabled but json[] has no contentPaths entries"
    );
  }

  if (needsUITranslation) {
    config.ui.forEach((block, index) => {
      if (!uiBlockHasSourceRoots(block)) {
        return;
      }
      if (effectiveUiTargetLocales(config, block).length === 0) {
        throw new ConfigValidationError(
          `ui[${index}] has sourceRoots but no target locales. Set targetLocales or ui[${index}].targetLocales (BCP-47 codes; ui-languages.json is generated by extract, not used as config input).`
        );
      }
    });
  }

  if (uiOn && explicit.translateUIStrings && !hasUi) {
    throw new ConfigValidationError(
      "ui.sourceRoots must be non-empty when translateUIStrings is enabled"
    );
  }

  if (docsOn && explicit.translateDocs && !hasDocs) {
    throw new ConfigValidationError(
      "docs[].contentPaths must be non-empty in at least one block when translateDocs is enabled, unless a block only sets docusaurusCatalogDir for catalog JSON"
    );
  }

  assertUniqueUiDescriptions(config);
  assertUniqueUiPaths(config);
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
  const explicit = explicitFeatureFlagsFor(input) ?? readExplicitFeatureFlags(input);
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
  explicitFeaturesByConfig.set(normalized, explicit);
  validateI18nBusinessRules(normalized, explicit);
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
  const explicit = explicitFeatureFlagsFor(parsed);
  if (explicit) {
    explicitFeaturesByConfig.set(withEnv, explicit);
  }
  validateI18nBusinessRules(withEnv, explicit);
  const augmented = augmentConfigWithUiLanguagesMaster(withEnv);
  if (explicit) {
    explicitFeaturesByConfig.set(augmented, explicit);
  }
  if (augmented.features.translateUIStrings && configHasUiWork(augmented)) {
    augmented.ui.forEach((block, index) => {
      if (!uiBlockHasSourceRoots(block)) {
        return;
      }
      if (resolveLocalesForUiBlock(augmented, block, cwd).length === 0) {
        throw new ConfigValidationError(
          `translateUIStrings is enabled but ui[${index}] has no target locales after excluding sourceLocale. Set non-empty targetLocales or ui[${index}].targetLocales (BCP-47 codes).`
        );
      }
    });
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
    features: {
      // UI strings: UI strings (extract runs automatically before translate)
      translateUIStrings: true,
      // Documents: document translation (enable when you have markdown to translate)
      translateDocs: false,

      translateSVG: false,
    },
    glossary: {
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: ["src/"],
      stringsJson: "src/locales/strings.json",
      flatOutputDir: "src/locales/",
    },
    // Parallelism: translate-ui effective default 4; translate-docs effective default 3 when omitted.
    concurrency: 4,
    // translate-ui: max parallel LLM batch requests per locale (plain chunks and plural groups).
    uiBatchConcurrency: 2,
    // translate-docs: max parallel LLM batch requests per file.
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
    features: {
      translateUIStrings: false,
      translateDocs: true,

      translateSVG: false,
    },
    glossary: {
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
                search: "screenshots/[^/]+/",
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

  uiPlainHtml: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en",
    targetLocales: ["es", "fr", "pt-BR"],
    features: {
      translateUIStrings: true,
      translateDocs: false,
      translateSVG: false,
    },
    glossary: {
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: ["public/"],
      stringsJson: "public/strings.json",
      flatOutputDir: "public/locales",
      uiExtractor: {
        extensions: [".html", ".htm"],
        funcNames: ["t"],
        includePackageDescription: false,
      },
    },
    concurrency: 4,
    batchConcurrency: 4,
    batchSize: 20,
    maxBatchChars: 4096,
    cacheDir: ".translation-cache",
    docs: [],
  }),

  docsPlainHtml: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en",
    targetLocales: ["de", "fr", "pt-BR"],
    features: {
      translateUIStrings: false,
      translateDocs: true,
      translateJson: false,
      translateSVG: false,
    },
    ui: {
      sourceRoots: [],
      stringsJson: "strings.json",
      flatOutputDir: "locales",
    },
    cacheDir: ".translation-cache",
    docs: [
      {
        contentPaths: ["site/"],
        outputDir: "site",
        docsOutput: {
          style: "nested",
          docsRoot: "site",
          localizedAssets: {
            include: ["img/**"],
            pattern: "{stem}-{locale}{ext}",
            onlyIfExists: true,
          },
          html: {
            languageList: {
              format: "links",
              label: "local",
            },
            hreflang: {
              xDefault: "en",
            },
          },
        },
        addFrontmatter: false,
      },
    ],
  }),

  uiJsonBundles: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en",
    targetLocales: ["de", "fr"],
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
 * Write a starter config JSON for `ai-i18n-tools init [-P <provider>]`.
 * See docs/GETTING_STARTED.md for a full annotated explanation of every field.
 */
export function writeInitConfigFile(
  outPath: string,
  template: keyof typeof initConfigTemplates,
  cwd = process.cwd(),
  providerKey = DEFAULT_INIT_PROVIDER_KEY
): void {
  assertPresetInitProvider(providerKey);
  const resolved = path.isAbsolute(outPath) ? outPath : path.join(cwd, outPath);
  const raw = initConfigTemplates[template]();
  const merged = applyInitProvider(mergeWithDefaults(raw), providerKey);
  parseI18nConfig(merged);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
}
