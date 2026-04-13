import { z } from "zod";
import { coerceTargetLocalesField } from "./locale-utils.js";

/** Markdown / JSON / UI / SVG segment classification. */
export type SegmentType =
  | "ui-string"
  | "frontmatter"
  | "heading"
  | "paragraph"
  | "code"
  | "admonition"
  | "json"
  | "svg-text"
  | "other";

/** SVG reassembly metadata (regex-extracted elements). */
export interface SvgSegmentMeta {
  element: "text" | "title" | "desc";
  fullMatch: string;
  openingTag: string;
}

export interface Segment {
  id: string;
  type: SegmentType;
  content: string;
  hash: string;
  translatable: boolean;
  startLine?: number;
  jsonKey?: string;
  jsonDescription?: string;
  svg?: SvgSegmentMeta;
}

/**
 * Per-segment translation with optional model metadata. `modelUsed` is set when the text was produced by the API this run
 * (the model that actually succeeded). Omitted for cache hits so callers do not overwrite a stored model.
 * Plain `string` remains supported for tests and simple pipelines.
 */
export type DocSegmentTranslation = { text: string; modelUsed?: string };

/** Values accepted by {@link ContentExtractor.reassemble}. */
export type SegmentTranslationMapValue = string | DocSegmentTranslation;

export function segmentTranslationText(v: SegmentTranslationMapValue | undefined): string | undefined {
  if (v === undefined) {
    return undefined;
  }
  return typeof v === "string" ? v : v.text;
}

/** Coerce a map to plain `Map<string, string>` (e.g. legacy callers or JSON serialization). */
export function translationTextMap(m: Map<string, SegmentTranslationMapValue>): Map<string, string> {
  return new Map(
    [...m].map(([k, v]) => {
      const t = segmentTranslationText(v);
      return [k, t ?? ""] as const;
    })
  );
}

export interface TranslationResult {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: number;
  /** When the API succeeded; used for translation failure debug logs. */
  debugPrompt?: { systemPrompt: string; userContent: string };
  /** Raw assistant text before `<translate>` stripping (single-segment). */
  rawAssistantContent?: string;
}

/** Row shape for file_tracking and status queries. */
export interface FileTracking {
  filepath: string;
  locale: string;
  sourceHash: string;
  lastTranslated: string | null;
}

/** Arguments for {@link import("./cache.js").TranslationCache.setSegment}. */
export interface CacheEntry {
  sourceHash: string;
  locale: string;
  sourceText: string;
  translatedText: string;
  model: string;
  filepath?: string;
  startLine?: number | null;
}

export interface TranslationRow {
  source_hash: string;
  locale: string;
  source_text: string;
  translated_text: string;
  model: string | null;
  filepath: string | null;
  created_at: string | null;
  last_hit_at: string | null;
  start_line: number | null;
}

export interface CleanupStats {
  staleTranslationsRemoved: number;
  deletedRows: Array<{ source_hash: string; locale: string; filepath: string | null }>;
}

export interface ContentExtractor {
  readonly name: string;
  canHandle(filepath: string): boolean;
  extract(content: string, filepath: string): Segment[];
  reassemble(segments: Segment[], translations: Map<string, SegmentTranslationMapValue>): string;
}

export interface GlossaryTerm {
  english: string;
  translations: Record<string, string>;
  partOfSpeech: string;
}

/** Result from batch translation (index → translated text). */
export interface BatchTranslationResult {
  translations: Map<number, string>;
  model: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost?: number;
  /** When the API succeeded; used for translation failure debug logs. */
  debugPrompt?: { systemPrompt: string; userContent: string };
  rawAssistantContent?: string;
}

export class BatchTranslationError extends Error {
  constructor(
    public readonly expected: number,
    public readonly received: number,
    public readonly rawResponse: string
  ) {
    super(`batch mismatch: expected ${expected} <t> segments, got ${received}`);
    this.name = "BatchTranslationError";
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost?: number;
}

const openRouterConfigSchema = z.object({
  baseUrl: z.string().min(1).default("https://openrouter.ai/api/v1"),
  translationModels: z.array(z.string().min(1)).optional(),
  defaultModel: z.string().optional(),
  fallbackModel: z.string().optional(),
  maxTokens: z.number().int().positive().default(8192),
  temperature: z.number().min(0).max(2).default(0.2),
});

const featuresSchema = z.object({
  extractUIStrings: z.boolean().default(false),
  /** OpenRouter: translate `strings.json` entries + write per-locale flat JSON. */
  translateUIStrings: z.boolean().default(false),
  translateMarkdown: z.boolean().default(false),
  translateJSON: z.boolean().default(false),
});

const glossarySchema = z.preprocess(
  (raw) => {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const o = { ...(raw as Record<string, unknown>) };
      const legacy = o.uiGlossaryFromStringsJson;
      if (typeof legacy === "string" && o.uiGlossary === undefined) {
        o.uiGlossary = legacy;
      }
      delete o.uiGlossaryFromStringsJson;
      return o;
    }
    return raw;
  },
  z
    .object({
      /** Path to `strings.json` - auto-builds glossary hints from existing UI translations. */
      uiGlossary: z.string().optional(),
      userGlossary: z.string().optional(),
      autoAddUserEditedToGlossary: z.boolean().default(true),
    })
    .strict()
);

const reactExtractorSchema = z
  .object({
    extensions: z.array(z.string().min(1)).default([".js", ".jsx", ".ts", ".tsx"]),
    funcNames: z.array(z.string().min(1)).default(["t", "i18n.t"]),
    includePackageDescription: z.boolean().default(true),
    packageJsonPath: z.string().optional(),
  })
  .strict();

const svgExtractorSchema = z
  .object({
    /** When true, translated text is lowercased on SVG reassembly (optional layout tweak). */
    forceLowercase: z.boolean().default(false),
  })
  .strict();

const languageListBlockSchema = z
  .object({
    /** Marker that identifies the language-list block start line in markdown body. */
    start: z.string().min(1),
    /** Marker that identifies the language-list block end line in markdown body. */
    end: z.string().min(1),
    /** Separator used between generated locale links. */
    separator: z.string(),
  })
  .strict();

const regexAdjustmentSchema = z
  .object({
    /** Optional rule note for maintainers (display-only). */
    description: z.string().optional(),
    /** Regex pattern (`pattern` or `/pattern/flags`) used for search. */
    search: z.string().min(1),
    /** Replacement template (supports `${translatedLocale}` and related vars). */
    replace: z.string(),
  })
  .strict();

const markdownPostProcessingSchema = z
  .object({
    /** Optional canonical language switcher replacement for translated markdown files. */
    languageListBlock: languageListBlockSchema.optional(),
    /** Ordered regex replacements applied to markdown body. */
    regexAdjustments: z.array(regexAdjustmentSchema).default([]),
  })
  .strict();

const markdownOutputSchema = z
  .object({
    /** Built-in layout when `pathTemplate` is unset. */
    style: z.enum(["nested", "docusaurus", "flat"]).default("nested"),
    /**
     * Directory prefix (posix, relative to cwd) for doc sources that use the Docusaurus plugin path.
     * Only paths under this prefix use `…/docusaurus-plugin-content-docs/current/…` when style is `docusaurus`.
     */
    docsRoot: z.string().optional(),
    /** When set, overrides `style` for markdown output paths. */
    pathTemplate: z.string().optional(),
    /** Optional overrides for JSON outputs (default: nested `outputDir/locale/relPath`). */
    jsonPathTemplate: z.string().optional(),
    /** For `flat` style: keep dirname segments so `docs/a.md` → `out/docs/a.de.md` instead of colliding with root `a.md`. */
    flatPreserveRelativeDir: z.boolean().default(false),
    /**
     * Rewrite relative links after translation for flat-style outputs. Default: true when
     * `style === "flat"` and `pathTemplate` is unset; false when `pathTemplate` is set (opt in explicitly).
     */
    rewriteRelativeLinks: z.boolean().optional(),
    /**
     * Repo root used with the active documentation block's `outputDir` to compute `i18nPrefix` / `depthPrefix`
     * for flat link rewriting (typically `.`).
     */
    linkRewriteDocsRoot: z.string().optional(),
    /**
     * Optional post-processing run on translated markdown body after reassembly/link rewrite.
     */
    postProcessing: markdownPostProcessingSchema.optional(),
  })
  .strict();

const uiConfigSchema = z
  .object({
    /** Roots scanned for `t()` / `i18n.t()` (e.g. `src/renderer/`). */
    sourceRoots: z.array(z.string().min(1)).default([]),
    /** Merged extract output (`strings.json`). */
    stringsJson: z.string().min(1).default("strings.json"),
    /** Directory for flat per-locale JSON (`de.json`, …). */
    flatOutputDir: z.string().min(1).default("./locales"),
    /**
     * When set, UI translation (`translate-ui`) tries this OpenRouter model first, then the rest of
     * `openrouter.translationModels` (or legacy default/fallback) in order, skipping duplicates.
     */
    preferredModel: z.string().min(1).optional(),
    reactExtractor: reactExtractorSchema.optional(),
  })
  .strict();

const svgAssetsConfigSchema = z
  .object({
    /** One directory or several (relative to cwd); each is scanned recursively for `*.svg`. */
    sourcePath: z.preprocess(
      (v) => (typeof v === "string" ? [v] : v),
      z.array(z.string().min(1)).min(1)
    ),
    /** Output root for translated SVGs (relative to cwd). */
    outputDir: z.string().min(1),
    /**
     * When set, overrides `style` for output paths. Expand `{outputDir}` (absolute resolved `svg.outputDir`),
     * `{locale}`, `{LOCALE}`, `{relPath}` (file relative to cwd), `{stem}`, `{basename}`, `{extension}`,
     * `{relativeToSourceRoot}` (path under `sourcePath`).
     */
    pathTemplate: z.string().optional(),
    /** `flat`: `{stem}.{locale}.svg`; `nested`: `{locale}/{relPathUnderSourceRoot}`. Ignored when `pathTemplate` is set. */
    style: z.enum(["flat", "nested"]),
    svgExtractor: svgExtractorSchema.optional(),
  })
  .strict();

/** One documentation pipeline (markdown/JSON layout under `outputDir`, optional Docusaurus `jsonSource`). */
const documentationBlockSchema = z
  .object({
    /** Optional human-readable note for this block (shown in CLI headers; not used for translation). */
    description: z.string().optional(),
    /** Markdown / MDX roots under cwd (files and directories). */
    contentPaths: z.array(z.string().min(1)).default([]),
    /** Optional alias for `contentPaths`; merged into `contentPaths` at load. */
    sourceFiles: z.array(z.string().min(1)).optional(),
    /**
     * Locales for markdown / JSON translation only. When **omitted** or empty after load, root
     * `targetLocales` is used (same set as UI). When set, docs translate to this list only - e.g. app in 10
     * languages, docs in 5. Same rules as root: array of codes, or a single path to `ui-languages.json`
     * (expanded at load; does not change `uiLanguagesPath`).
     */
    targetLocales: z
      .preprocess((v) => {
        if (v === undefined || v === null) {
          return undefined;
        }
        return coerceTargetLocalesField(v);
      }, z.array(z.string().min(1)).optional())
      .optional(),
    /** Base directory for translated docs (markdown / default JSON layout). */
    outputDir: z.string().min(1).default("./i18n"),
    /** Docusaurus / JSON UI strings source dir (e.g. i18n/en/). */
    jsonSource: z.string().optional(),
    markdownOutput: markdownOutputSchema.default({
      style: "nested",
      flatPreserveRelativeDir: false,
    }),
    /**
     * When true (default), translated markdown files include YAML keys matching reference transrewrt:
     * `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`.
     */
    injectTranslationMetadata: z.boolean().optional(),
  })
  .strict();

/** Unified package config: shared root + `ui` + `documentations` pipelines. */
export const i18nConfigSchema = z
  .object({
    sourceLocale: z.string().min(1),
    /** Shared SQLite cache directory for all documentation blocks (and CLI log defaults). */
    cacheDir: z.string().min(1).default(".translation-cache"),
    /**
     * Target locale codes (BCP-47) as an array, **or** a single string path to `ui-languages.json`
     * (React / UI). On load, a path string is expanded to codes and `uiLanguagesPath` is set.
     * Manifest entries must include `code`, `label`, and non-empty `englishName` per object.
     */
    targetLocales: z.preprocess(
      (v) => coerceTargetLocalesField(v),
      z.array(z.string().min(1)).default([])
    ),
    openrouter: openRouterConfigSchema,
    features: featuresSchema.default({
      extractUIStrings: false,
      translateUIStrings: false,
      translateMarkdown: false,
      translateJSON: false,
    }),
    glossary: glossarySchema.default({ autoAddUserEditedToGlossary: true }),
    ui: uiConfigSchema.default({
      sourceRoots: [],
      stringsJson: "strings.json",
      flatOutputDir: "./locales",
    }),
    documentations: z
      .array(documentationBlockSchema)
      .default([
        {
          contentPaths: [],
          outputDir: "./i18n",
          markdownOutput: {
            style: "nested",
            flatPreserveRelativeDir: false,
          },
        },
      ]),
    /** BCP-47-ish codes that use RTL typography; layout `dir` stays the app’s i18next concern. */
    rtlLocales: z.array(z.string().min(1)).optional(),
    localeDisplayNames: z.record(z.string(), z.string()).optional(),
    /**
     * Optional path to the same `ui-languages.json` manifest. Usually unnecessary if `targetLocales` is a
     * single manifest path (expanded at load). Use when `targetLocales` is an explicit code list but you
     * still want manifest-driven UI locale filtering / `localeDisplayNames` / intersection.
     */
    uiLanguagesPath: z.string().optional(),
    /** Standalone SVG translation (`translate-svg`): sources + output layout. */
    svg: svgAssetsConfigSchema.optional(),
    batchSize: z.number().int().positive().optional(),
    maxBatchChars: z.number().int().positive().optional(),
    /**
     * Max parallel **target locales** (`translate-ui`, `translate-docs`). Defaults: UI `4`, docs `3` when unset.
     */
    concurrency: z.number().int().positive().optional(),
    /**
     * Max parallel OpenRouter **batch** requests per file (`translate-docs`, `translate-svg`). Default `4` when unset.
     */
    batchConcurrency: z.number().int().positive().optional(),
  })
  .strict();

export type I18nConfig = z.infer<typeof i18nConfigSchema>;
export type OpenRouterConfig = z.infer<typeof openRouterConfigSchema>;
export type FeaturesConfig = z.infer<typeof featuresSchema>;
export type GlossaryConfig = z.infer<typeof glossarySchema>;
export type UIStringExtractorConfig = z.infer<typeof reactExtractorSchema>;
/** @deprecated Use {@link UIStringExtractorConfig} */
export type ReactExtractorConfig = UIStringExtractorConfig;
export type SvgExtractorConfig = z.infer<typeof svgExtractorSchema>;
export type LanguageListBlockConfig = z.infer<typeof languageListBlockSchema>;
export type RegexAdjustmentConfig = z.infer<typeof regexAdjustmentSchema>;
export type MarkdownPostProcessingConfig = z.infer<typeof markdownPostProcessingSchema>;
export type MarkdownOutputConfig = z.infer<typeof markdownOutputSchema>;
export type UiConfig = z.infer<typeof uiConfigSchema>;
export type DocumentationBlock = z.infer<typeof documentationBlockSchema>;
export type SvgAssetsConfig = z.infer<typeof svgAssetsConfigSchema>;

/**
 * View passed to translate-docs internals: one active `documentation` block plus root fields.
 * Built from root config via {@link toDocTranslateConfig}.
 */
export type I18nDocTranslateConfig = Omit<I18nConfig, "documentations"> & {
  documentation: DocumentationBlock;
};

export type RawI18nConfigInput = z.input<typeof i18nConfigSchema>;
