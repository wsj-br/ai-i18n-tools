import fs from "fs";
import path from "path";
import { ConfigValidationError } from "./errors.js";
import { coerceTargetLocalesField, normalizeLocale, parseLocaleList } from "./locale-utils.js";
import {
  augmentConfigWithUiLanguagesFile,
  expandDocumentationTargetLocalesInRawInput,
  expandTargetLocalesFileReferenceInRawInput,
  getDocumentationTargetLocaleCodes,
  resolveLocalesForUI,
} from "./ui-languages.js";
import {
  type I18nConfig,
  type OpenRouterConfig,
  type RawI18nConfigInput,
  i18nConfigSchema,
} from "./types.js";

export { coerceTargetLocalesField, normalizeLocale, parseLocaleList };

const DEFAULT_OPENROUTER_MODELS: string[] = [
  "qwen/qwen3-235b-a22b-2507",
  "stepfun/step-3.5-flash:free",
  "anthropic/claude-3-haiku",
  "z-ai/glm-4.7-flash",
  "minimax/minimax-m2.5",
  "anthropic/claude-3.5-haiku",
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

/** Merge `documentation.sourceFiles` into `documentation.contentPaths` (unique). */
function mergeDocumentationSourceFiles(raw: Record<string, unknown>): void {
  const doc = raw.documentation;
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    return;
  }
  const d = doc as Record<string, unknown>;
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
    translateSVG: false,
  },
  glossary: {},
  ui: {
    sourceRoots: [],
    stringsJson: "strings.json",
    flatOutputDir: "./locales",
  },
  documentation: {
    contentPaths: [],
    outputDir: "./i18n",
    cacheDir: ".translation-cache",
    markdownOutput: {},
  },
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
    config.features.translateMarkdown ||
    config.features.translateJSON ||
    config.features.translateSVG;
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
      "When translateMarkdown / translateJSON / translateSVG is enabled, set non-empty targetLocales " +
        "and/or documentation.targetLocales (documentation-only locale list)."
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

  if (needsDocTranslation && config.documentation.contentPaths.length === 0) {
    throw new ConfigValidationError(
      "documentation.contentPaths must be non-empty when translateMarkdown / translateJSON / translateSVG is enabled"
    );
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
 * Template objects for `init` — UI + app markdown vs UI + Docusaurus-style docs.
 */
export const initConfigTemplates = {
  uiMarkdown: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en-GB",
    targetLocales: "src/renderer/locales/ui-languages.json",
    features: {
      extractUIStrings: true,
      translateUIStrings: true,
      translateMarkdown: true,
      translateJSON: false,
      translateSVG: false,
    },
    glossary: {
      uiGlossaryFromStringsJson: "src/renderer/locales/strings.json",
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: ["src/renderer/"],
      stringsJson: "src/renderer/locales/strings.json",
      flatOutputDir: "src/renderer/locales/",
    },
    documentation: {
      contentPaths: ["src/renderer/"],
      outputDir: "src/renderer/locales/",
      cacheDir: ".translation-cache",
      markdownOutput: {
        style: "nested",
      },
    },
  }),

  uiDocusaurus: (): RawI18nConfigInput => ({
    ...defaultI18nConfigPartial,
    sourceLocale: "en",
    targetLocales: "i18n/ui-languages.json",
    features: {
      extractUIStrings: true,
      translateUIStrings: false,
      translateMarkdown: true,
      translateJSON: true,
      translateSVG: true,
    },
    glossary: {
      uiGlossaryFromStringsJson: "path/to/strings.json",
      userGlossary: "glossary-user.csv",
    },
    ui: {
      sourceRoots: ["src/"],
      stringsJson: "path/to/strings.json",
      flatOutputDir: "path/to/locales/",
    },
    documentation: {
      contentPaths: ["docs/"],
      outputDir: "i18n/",
      cacheDir: ".translation-cache",
      jsonSource: "i18n/en",
      markdownOutput: {
        style: "docusaurus",
        docsRoot: "docs",
      },
    },
  }),
} as const;

/**
 * Write a starter config JSON for `ai-i18n-tools init`.
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
