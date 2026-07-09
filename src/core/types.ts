import { z } from "zod";
import { coerceContentPathsField, preprocessLegacyConfigInput } from "./config-migrate.js";
import { coerceTargetLocalesField, normalizeLocale } from "./locale-utils.js";

/** Markdown / JSON / UI / SVG segment classification. */
export type SegmentType =
  | "ui-string"
  | "frontmatter"
  | "frontmatter-field"
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
  /** When true, this segment reassembles with a single `\n` after the previous segment (no blank line). */
  tightJoinPrevious?: boolean;
  startLine?: number;
  /** Dot-path for selective front matter field segments (e.g. `title`, `sidebar.label`). */
  frontmatterPath?: string;
  jsonKey?: string;
  jsonDescription?: string;
  svg?: SvgSegmentMeta;
  /** When true, `content` is the original `t()` literal; plural rows live under `strings.json` single-entry shape. */
  plurals?: boolean;
  /** Tooling-only; stripped before `i18next.t`. Phrasing hint for `_zero` in Step 0 / Pass B. */
  zeroDigit?: boolean;
}

/** CLDR cardinal plural categories used by i18next JSON v4 suffixes (`_zero` … `_other`). */
export type CldrPluralForm = "zero" | "one" | "two" | "few" | "many" | "other";

/** Non-plural row in `strings.json` (`translated[locale]` is a string). */
export interface StringsJsonPlainEntry {
  plural?: false;
  source: string;
  translated: Record<string, string>;
  models?: Record<string, string>;
  locations?: Array<{ file: string; line: number }>;
}

/** Plural group row: one top-level hash per `t(..., { plurals: true })` literal; `translated[locale]` maps forms → text. */
export interface StringsJsonPluralEntry {
  plural: true;
  source: string;
  /** When true, `_zero` source uses literal Arabic `0`; when false, natural phrasing in that language. */
  zeroDigit?: boolean;
  translated: Record<string, Partial<Record<CldrPluralForm, string>>>;
  models?: Record<string, string>;
  locations?: Array<{ file: string; line: number }>;
}

export type StringsJsonEntry = StringsJsonPlainEntry | StringsJsonPluralEntry;

export function isPluralStringsEntry(
  e: StringsJsonEntry | Record<string, unknown>
): e is StringsJsonPluralEntry {
  return (e as StringsJsonPluralEntry).plural === true;
}

export function isPlainStringsEntry(
  e: StringsJsonEntry | Record<string, unknown>
): e is StringsJsonPlainEntry {
  return !isPluralStringsEntry(e);
}

/**
 * Per-segment translation with optional model metadata. `modelUsed` is set when the text was produced by the API this run
 * (the model that actually succeeded). Omitted for cache hits so callers do not overwrite a stored model.
 * Plain `string` remains supported for tests and simple pipelines.
 */
export type DocSegmentTranslation = { text: string; modelUsed?: string };

/** Values accepted by {@link ContentExtractor.reassemble}. */
export type SegmentTranslationMapValue = string | DocSegmentTranslation;

export function segmentTranslationText(
  v: SegmentTranslationMapValue | undefined
): string | undefined {
  if (v === undefined) {
    return undefined;
  }
  return typeof v === "string" ? v : v.text;
}

/** Coerce a map to plain `Map<string, string>` (e.g. legacy callers or JSON serialization). */
export function translationTextMap(
  m: Map<string, SegmentTranslationMapValue>
): Map<string, string> {
  return new Map(
    [...m].map(([k, v]) => {
      const t = segmentTranslationText(v);
      return [k, t ?? ""] as const;
    })
  );
}

/** Token counts returned by an LLM provider (`usage`). */
export interface LlmUsageStats {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/** @deprecated Use {@link LlmUsageStats}. */
export type OpenRouterUsageStats = LlmUsageStats;

export interface TranslationResult {
  content: string;
  model: string;
  usage: LlmUsageStats;
  cost?: number;
  /** When the API succeeded; used for translation failure debug logs. */
  debugPrompt?: { systemPrompt: string; userContent: string };
  /** Raw assistant text before optional tag stripping (single-segment; see {@link LlmClient.stripTranslateTags}). */
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

/** Result type for {@link import("./cache.js").TranslationCache.getSegmentsBatch}. */
export type BatchCacheResult = Map<string, { text: string; model: string | null }>;

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

export interface TranslationFailureRow {
  source_hash: string;
  locale: string;
  model: string | null;
  model_order: number | null;
  quality_error: string;
  error_message: string;
  fatal: number;
  created_at: string | null;
}

export interface TranslationFailureInsert {
  sourceHash: string;
  locale: string;
  model: string | null;
  modelOrder: number | null;
  qualityError: string;
  errorMessage: string;
  fatal: boolean;
  /** Cwd-relative doc path for UI when no `translations` row exists yet (or row lacks filepath). */
  filepath?: string | null;
  /** Original segment source for UI when the cache row is missing. */
  sourceText?: string | null;
}

export interface TranslationFailureListRow {
  source_hash: string;
  locale: string;
  /** Models that produced recorded failures (may be newline-separated when aggregated). */
  model: string | null;
  /** Model stored on the cached translation row for this segment/locale, if any. */
  translation_model: string | null;
  model_order: number | null;
  quality_error: string;
  error_message: string;
  fatal: number;
  created_at: string | null;
  source_text: string | null;
  filepath: string | null;
  start_line: number | null;
}

export interface TranslationFailureSummary {
  segmentsWithFailure: number;
  segmentsWith1Failure: number;
  segmentsWith2Failures: number;
  segmentsWith3OrMoreFailures: number;
}

/** One row in `markdown_source_issues` (pre-translation / static analysis). */
export interface MarkdownSourceIssueListRow {
  id: number;
  filepath: string;
  source_hash: string;
  start_line: number | null;
  issue_code: string;
  detail: string;
  scanned_at: string | null;
}

export interface MarkdownSourceIssueSummary {
  rowsWithIssues: number;
  byCode: Record<string, number>;
}

/** Row for {@link import("./cache.js").TranslationCache.replaceMarkdownIssuesForFilepath}. */
export interface MarkdownSourceIssueInsert {
  filepath: string;
  sourceHash: string;
  startLine: number | null;
  issueCode: string;
  detail: string;
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
  /** From user glossary CSV `force` column (per locale after * / exact merge). */
  forcedByLocale?: Record<string, boolean>;
}

/** Result from batch translation (index → translated text). */
export interface BatchTranslationResult {
  translations: Map<number, string>;
  model: string;
  usage: LlmUsageStats;
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
  usage: LlmUsageStats;
  cost?: number;
}

/**
 * One LLM provider block. Most providers need only `translationModels`; everything else is
 * inherited from a built-in preset (see `src/core/llm-providers.ts`) or the global LLM defaults.
 * Define `baseUrl` (and usually `apiKeyEnv`) to use a custom OpenAI-compatible endpoint that has
 * no built-in preset.
 */
const localeModelsEntrySchema = z
  .object({
    /** BCP-47 locale code; matched case-insensitively via {@link normalizeLocale}. */
    locale: z.string().min(1),
    /** Ordered model fallback chain for this locale (tried before global lists). */
    models: z.array(z.string().min(1)).min(1),
  })
  .strict();

const providerEntrySchema = z
  .object({
    /** OpenAI-compatible base URL (e.g. `https://api.example.com/v1`). Overrides the preset baseUrl. */
    baseUrl: z.string().min(1).optional(),
    /** Environment variable holding the API key. Overrides the preset env var. */
    apiKeyEnv: z.string().min(1).optional(),
    /** Extra HTTP headers sent with every request to this provider. */
    headers: z.record(z.string(), z.string()).optional(),
    /** Ordered model fallback chain (plain upstream model ids, no provider prefix). */
    translationModels: z.array(z.string().min(1)).optional(),
    /**
     * Optional UI-only model chain (`translate-ui`, plural generation, `proofread-ui`). Tried after
     * matching `localeModels` and before `translationModels`.
     */
    uiModels: z.array(z.string().min(1)).optional(),
    /**
     * Optional per-locale model overrides. Each entry is tried first when translating to that locale
     * (all pipelines), then pipeline-specific tiers (`uiModels` for UI) and `translationModels`.
     */
    localeModels: z.array(localeModelsEntrySchema).optional(),
    maxTokens: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    /** Max time to wait for each chat-completions request. Default 30s. */
    requestTimeoutMs: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((entry, ctx) => {
    const localeModels = entry.localeModels;
    if (!localeModels?.length) {
      return;
    }
    const seen = new Set<string>();
    for (const row of localeModels) {
      const key = normalizeLocale(row.locale);
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `providers localeModels: duplicate locale "${row.locale}" (normalized: "${key}")`,
        });
        return;
      }
      seen.add(key);
    }
  });

const providersConfigSchema = z.record(z.string().min(1), providerEntrySchema);

const featuresSchema = z.object({
  /** Scan `t()` / `i18n.t()` into `strings.json`, then translate flat locale bundles (extract runs automatically before translate). */
  translateUIStrings: z.boolean().default(false),
  /** MD / MDX / `.astro` page translation via `translate-docs`. */
  translateDocs: z.boolean().default(false),
  /** Arbitrary nested JSON under top-level `json[]` via `translate-json`. */
  translateJson: z.boolean().default(false),
  /**  SVG files via `translate-svg` / `sync` when `svg` is configured. */
  translateSVG: z.boolean().default(false),
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

const uiExtractorSchema = z
  .object({
    extensions: z.array(z.string().min(1)).default([".js", ".jsx", ".ts", ".tsx"]),
    funcNames: z.array(z.string().min(1)).default(["t", "i18n.t"]),
    includePackageDescription: z.boolean().default(true),
    packageJsonPath: z.string().optional(),
    /**
     * When true, `extract` also adds each `englishName` from the bundled master catalog for `sourceLocale` +
     * `targetLocales` into `strings.json` when not already present from source scan (same MD5-8 keys).
     */
    includeUiLanguageEnglishNames: z.boolean().default(false),
    /**
     * HTML marker attributes scanned in `.html`/`.htm` sources (when listed in `extensions`). `data-i18n`
     * uses the element `textContent`; `data-i18n-<attr>` uses that attribute's value (e.g. `data-i18n-title`).
     * Defaults to `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]` when omitted.
     */
    htmlI18nAttributes: z.array(z.string().min(1)).optional(),
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
    /**
     * Label source for generated language links when `ui-languages.json` is available.
     * `local` uses each entry's `label` (endonym); `english` uses `englishName`.
     */
    label: z.enum(["local", "english"]).default("local"),
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

/** Optional finer-grained markdown segments (pipe tables, long lists, dense paragraphs). Default **enabled** when the documentation block omits **`segmentSplitting`** (translate-docs merges via {@link mergeSegmentSplittingOpts}). */
export const segmentSplittingSchema = z
  .object({
    enabled: z.boolean().default(true),
    /** Soft cap for paragraph chunk size when splitting dense blocks (characters). */
    maxCharsPerSegment: z.number().int().positive().max(100_000).optional(),
    splitPipeTables: z.boolean().default(true),
    splitDenseParagraphs: z.boolean().default(true),
    maxLinesPerParagraphChunk: z.number().int().positive().optional(),
    splitLongLists: z.boolean().default(true),
    maxListItemsPerChunk: z.number().int().positive().default(4),
    /**
     * When true (default), markdown segments that fail AST validation after all models are
     * exhausted are split progressively and retried from the first model.
     */
    qualityRetrySplit: z.boolean().default(true),
    /** Max recursive split depth for {@link segmentSplittingSchema.shape.qualityRetrySplit}. */
    maxQualityRetrySplitDepth: z.number().int().positive().max(8).default(3),
  })
  .strict();

export type SegmentSplittingConfig = z.infer<typeof segmentSplittingSchema>;

export function mergeSegmentSplittingOpts(
  partial: z.input<typeof segmentSplittingSchema> | undefined
): SegmentSplittingConfig {
  return segmentSplittingSchema.parse(partial ?? {});
}

/** Default locale folder segment for the `docusaurus` style alias (doc-system preset). */
export const DOCUSAURUS_LOCALE_SUBPATH = "docusaurus-plugin-content-docs/current";

const docsOutputStyleSchema = z.enum([
  "nested",
  "flat",
  "doc-system",
  "docusaurus",
  "astro-starlight",
  "vitepress",
  "nextra",
]);

const docsOutputSchema = z
  .object({
    /** Built-in layout when `pathTemplate` is unset. */
    style: docsOutputStyleSchema.default("nested"),
    /**
     * Internal/derived: the original alias (`"docusaurus"`, `"astro-starlight"`, `"vitepress"`,
     * `"nextra"`) before config loading rewrites `style` to canonical `"doc-system"`. Not meant to
     * be set by hand — read this (in addition to `style`) when a feature needs to know which
     * framework preset was requested, since `style` itself no longer carries that after normalization.
     */
    stylePreset: docsOutputStyleSchema.optional(),
    /**
     * Directory prefix (posix, relative to cwd) for doc sources under `doc-system` layout.
     * Only paths under this prefix use `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`.
     */
    docsRoot: z.string().optional(),
    /**
     * Path segment between `{locale}/` and `{relativeToDocsRoot}` for `doc-system` style.
     * Required when `style` is `doc-system` (may be `""`). Set automatically for `docusaurus`,
     * `astro-starlight`, `vitepress`, and `nextra` aliases at config load.
     */
    localeSubpath: z.string().optional(),
    /** When set, overrides `style` for markdown output paths. */
    pathTemplate: z.string().optional(),
    /** Optional overrides for JSON outputs (default: nested `outputDir/locale/relPath`). */
    jsonPathTemplate: z.string().optional(),
    /**
     * When true, built-in layout styles use a lowercased locale segment in output paths
     * (e.g. `pt-BR` → `pt-br`). Custom `pathTemplate` / `jsonPathTemplate` values are unchanged;
     * use `{llocale}` there for lowercase segments.
     */
    localePathLowercase: z.boolean().optional(),
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
     * When true, normalize markdown links for VitePress doc-system output after translation.
     * Defaults to enabled when `docsOutput.style` is `"vitepress"`.
     */
    rewriteVitepressLinks: z.boolean().optional(),
    /**
     * When true, normalize markdown links for Nextra doc-system output after translation.
     * Defaults to enabled when `docsOutput.style` is `"nextra"`.
     */
    rewriteNextraLinks: z.boolean().optional(),
    /**
     * VitePress theme/nav/sidebar catalog bootstrap + translation (inside translate-docs).
     */
    vitepressThemeCatalog: z
      .object({
        configPath: z.string().min(1),
        catalogPath: z.string().min(1),
        outputPathTemplate: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
    /**
     * Optional post-processing run on translated markdown body after reassembly/link rewrite.
     */
    postProcessing: markdownPostProcessingSchema.optional(),
  })
  .strict();

const uiConfigSchema = z.preprocess(
  (raw) => {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const o = { ...(raw as Record<string, unknown>) };
      if (o.uiExtractor === undefined && o.reactExtractor !== undefined) {
        o.uiExtractor = o.reactExtractor;
      }
      return o;
    }
    return raw;
  },
  z
    .object({
      /** Roots scanned for `t()` / `i18n.t()` (e.g. `src/renderer/`). */
      sourceRoots: z.array(z.string().min(1)).default([]),
      /** Merged extract output (`strings.json`). */
      stringsJson: z.string().min(1).default("strings.json"),
      /** Directory for flat per-locale JSON (`de.json`, …). */
      flatOutputDir: z.string().min(1).default("./locales"),
      /** Scanner options (extensions, `funcNames`, …). Preferred over `reactExtractor`. */
      uiExtractor: uiExtractorSchema.optional(),
      /** @deprecated Use `uiExtractor` (still accepted). */
      reactExtractor: uiExtractorSchema.optional(),
    })
    .strict()
);

const svgFilesConfigInnerSchema = z
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
     * `{locale}`, `{LOCALE}`, `{llocale}`, `{relPath}` (file relative to cwd), `{stem}`, `{basename}`, `{extension}`,
     * `{relativeToSourceRoot}` (path under `sourcePath`).
     */
    pathTemplate: z.string().optional(),
    /** `flat`: `{stem}.{locale}.svg`; `nested`: `{locale}/{relPathUnderSourceRoot}`. Ignored when `pathTemplate` is set. */
    style: z.enum(["flat", "nested"]),
    /**
     * When true, built-in `flat` / `nested` SVG layouts use a lowercased locale segment.
     * Custom `pathTemplate` values are unchanged; use `{llocale}` for lowercase segments.
     */
    localePathLowercase: z.boolean().default(false),
    /** When true, translated text is lowercased on SVG reassembly (optional layout tweak). */
    forceLowercase: z.boolean().default(false),
  })
  .strict();

/** Hoists legacy `svg.svgExtractor.forceLowercase` to `svg.forceLowercase` before validation. */
const SvgFilesConfigSchema = z.preprocess((raw) => {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = { ...(raw as Record<string, unknown>) };
    const nested = o.svgExtractor;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const fl = (nested as Record<string, unknown>).forceLowercase;
      if (typeof fl === "boolean" && o.forceLowercase === undefined) {
        o.forceLowercase = fl;
      }
      delete o.svgExtractor;
    }
    return o;
  }
  return raw;
}, svgFilesConfigInnerSchema);

/** One docs pipeline (markdown/MDX/Astro layout under `outputDir`, optional Docusaurus catalog). */
const docBlockSchema = z
  .object({
    /** Optional human-readable note for this block (shown in CLI headers; not used for translation). */
    description: z.string().optional(),
    /** Markdown / MDX / Astro roots under cwd (file, directory, or glob per entry). */
    contentPaths: z.preprocess(
      (v) => coerceContentPathsField(v),
      z.array(z.string().min(1)).default([])
    ),
    /** Optional alias for `contentPaths`; merged into `contentPaths` at load. */
    sourceFiles: z.array(z.string().min(1)).optional(),
    /**
     * Locales for markdown / JSON translation only. When **omitted** or empty after load, root
     * `targetLocales` is used (same set as UI). When set, docs translate to this list only - e.g. app in 10
     * languages, docs in 5. Same rules as root: array of BCP-47 codes only.
     */
    targetLocales: z
      .preprocess(
        (v) => {
          if (v === undefined || v === null) {
            return undefined;
          }
          return coerceTargetLocalesField(v);
        },
        z.array(z.string().min(1)).optional()
      )
      .optional(),
    /** Base directory for translated docs (markdown / default JSON layout). */
    outputDir: z.string().min(1).default("./i18n"),
    /** Docusaurus `write-translations` catalog directory (e.g. docs-site/i18n/en). When set, catalog JSON is translated during `translate-docs` if `features.translateDocs` is enabled. */
    docusaurusCatalogDir: z.string().optional(),
    /** Glob(s) for Nextra _meta files under docsRoot (default: recursive _meta.ts, _meta.tsx, _meta.js under docsOutput.docsRoot). */
    nextraMetaGlob: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
    /** Property names whose string values are translatable in Nextra `_meta` objects. */
    nextraMetaTranslatableKeys: z.array(z.string().min(1)).optional(),
    /** English Nextra theme dictionary module, e.g. `app/_dictionaries/en.ts`. */
    nextraDictionaryPath: z.string().optional(),
    /** Output template for locale dictionary modules. Default: `{dir}/{locale}.ts`. */
    nextraDictionaryOutputTemplate: z.string().min(1).optional(),
    docsOutput: docsOutputSchema.default({
      style: "nested",
      flatPreserveRelativeDir: false,
    }),
    /**
     * Optional finer-grained markdown segments for **translate-docs** (pipe tables, dense paragraphs, long lists).
     * Sibling of **`docsOutput`** — applies to the whole docs pipeline for this block, not layout/post-processing only.
     */
    segmentSplitting: segmentSplittingSchema.optional(),
    /**
     * When true (default), translated markdown files include YAML keys for traceability:
     * `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`,
     * `source_file_path`, and when known, `translation_models` (sorted unique OpenRouter model ids used for segments).
     */
    addFrontmatter: z.boolean().optional(),
    /**
     * Overrides default markdown emphasis placeholder masking for this docs block.
     * When omitted: CJK (`zh`, `ja`, `ko`) and RTL locales mask emphasis by default; others do not.
     * Root `rtlLocales` extends RTL detection alongside built-in RTL language codes.
     */
    emphasisPlaceholders: z.boolean().optional(),
    /**
     * When true (default), `translate-docs` scans translatable markdown segments for risky delimiter
     * / inline-code patterns, logs warnings, and refreshes `markdown_source_issues` in the cache DB.
     */
    warnMarkdownSourceIssues: z.boolean().optional(),
    /**
     * Selective YAML front matter translation for doc-site metadata (Starlight / Docusaurus).
     * `true` (default) translates built-in prose fields (`title`, `description`, `sidebar.label`, …).
     * `false` keeps the entire front matter block unchanged. A string array restricts translation to those dot-paths.
     */
    translateFrontmatterFields: z.union([z.boolean(), z.array(z.string().min(1))]).default(true),
    /**
     * Extra JSX/HTML attribute names whose quoted string values must not be translated in Astro
     * `{expression}` blocks and MDX JSX tags during `translate-docs`. Merged with built-in defaults
     * (`class`, `id`, `style`, `data-*`, most `aria-*`, etc.). Case-insensitive.
     */
    protectAttributes: z.array(z.string().min(1)).optional(),
    /**
     * Extra object property names whose quoted string values must not be translated in Astro
     * `{expression}` blocks and MDX object literals (e.g. `label:` in `<Tabs values={[…]}>`).
     * Merged with built-in defaults (`class`, `key`, `id`, etc.). Case-insensitive.
     */
    protectKeys: z.array(z.string().min(1)).optional(),
  })
  .strict();

const jsonKeyPolicySchema = z
  .object({
    mode: z.enum(["allowlist", "denylist", "both"]),
    translateKeys: z.array(z.string().min(1)).default([]),
    skipKeys: z.array(z.string().min(1)).default([]),
  })
  .strict();

/** One generic JSON translation pipeline (`translate-json`). */
const jsonBlockSchema = z
  .object({
    description: z.string().optional(),
    contentPaths: z.preprocess(
      (v) => coerceContentPathsField(v),
      z.array(z.string().min(1)).default([])
    ),
    outputPathTemplate: z
      .string()
      .min(1)
      .describe(
        "Output path template; placeholders: {locale}, {LOCALE}, {llocale}, {stem}, {basename}, {extension}, {relativeToSourceRoot}"
      ),
    targetLocales: z
      .preprocess(
        (v) => {
          if (v === undefined || v === null) {
            return undefined;
          }
          return coerceTargetLocalesField(v);
        },
        z.array(z.string().min(1)).optional()
      )
      .optional(),
    keyPolicy: jsonKeyPolicySchema.default({
      mode: "denylist",
      translateKeys: [],
      skipKeys: ["id", "slug", "href", "url", "key", "code"],
    }),
  })
  .strict();

const i18nConfigSchemaInner = z
  .object({
    sourceLocale: z.string().min(1),
    /**
     * Locale (BCP-47) for the tool's OWN user interface — CLI logs, help text, and the dashboard.
     * Independent of `sourceLocale` / `targetLocales` (which describe the project being translated).
     * Lowest priority: overridden by `AI_I18N_LANG` and the `--ui-lang` flag. Unknown values degrade
     * gracefully to the source locale, so no strict locale validation is applied here.
     */
    uiLanguage: z.string().min(1).optional(),
    /** Shared SQLite cache directory for all documentation blocks (and CLI log defaults). */
    cacheDir: z.string().min(1).default(".translation-cache"),
    /**
     * Target locale codes (BCP-47) only — not a path to `ui-languages.json`.
     * The manifest at `uiLanguagesPath` is generated by `extract` (and `generate-ui-languages`) from `sourceLocale` + this list.
     */
    targetLocales: z.preprocess(
      (v) => coerceTargetLocalesField(v),
      z.array(z.string().min(1)).default([])
    ),
    /**
     * Active provider key (must exist in `providers`). Optional when exactly one provider is
     * configured. Determines which provider block is used during a run.
     */
    provider: z.string().min(1).optional(),
    /** Map of provider key -> provider block. Built-in keys carry presets; any other key needs `baseUrl`. */
    providers: providersConfigSchema.default({}),
    features: featuresSchema.default({
      translateUIStrings: false,
      translateDocs: false,
      translateJson: false,
      translateSVG: false,
    }),
    glossary: glossarySchema.default({ autoAddUserEditedToGlossary: true }),
    ui: uiConfigSchema.default({
      sourceRoots: [],
      stringsJson: "strings.json",
      flatOutputDir: "./locales",
    }),
    docs: z.array(docBlockSchema).default([
      {
        contentPaths: [],
        outputDir: "./i18n",
        docsOutput: {
          style: "nested",
          flatPreserveRelativeDir: false,
        },
        translateFrontmatterFields: true,
      },
    ]),
    json: z.array(jsonBlockSchema).default([]),
    /** BCP-47-ish codes that use RTL typography; layout `dir` stays the app’s i18next concern. */
    rtlLocales: z.array(z.string().min(1)).optional(),
    localeDisplayNames: z.record(z.string(), z.string()).optional(),
    /**
     * Where to write `ui-languages.json` (defaults to `{ui.flatOutputDir}/ui-languages.json`).
     * Used for display labels in translated markdown and as the app-facing manifest; `extract` overwrites it.
     */
    uiLanguagesPath: z.string().optional(),
    /** SVG file translation (`translate-svg`): sources + output layout. */
    svg: SvgFilesConfigSchema.optional(),
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
    /**
     * Max concurrent files processed within a single locale (`translate-docs`).
     * When > 1, files within the same locale are processed in parallel.
     * Default `1` (sequential) when unset to preserve existing behavior.
     */
    fileConcurrency: z.number().int().positive().optional(),
  })
  .strict();

/** Unified package config: shared root + `ui` + `docs` + optional `json` pipelines. */
export const i18nConfigSchema = z.preprocess(preprocessLegacyConfigInput, i18nConfigSchemaInner);

export type I18nConfig = z.infer<typeof i18nConfigSchemaInner>;
export type LocaleModelsEntry = z.infer<typeof localeModelsEntrySchema>;
export type LlmProviderConfig = z.infer<typeof providerEntrySchema>;
export type ProvidersConfig = z.infer<typeof providersConfigSchema>;
/** @deprecated The single `openrouter` block was replaced by the `providers` map; use {@link LlmProviderConfig}. */
export type OpenRouterConfig = LlmProviderConfig;
export type FeaturesConfig = z.infer<typeof featuresSchema>;
export type GlossaryConfig = z.infer<typeof glossarySchema>;
export type UIStringExtractorConfig = z.infer<typeof uiExtractorSchema>;
/** @deprecated Use {@link UIStringExtractorConfig} */
export type ReactExtractorConfig = UIStringExtractorConfig;
export type LanguageListBlockConfig = z.infer<typeof languageListBlockSchema>;
export type RegexAdjustmentConfig = z.infer<typeof regexAdjustmentSchema>;
export type MarkdownPostProcessingConfig = z.infer<typeof markdownPostProcessingSchema>;
export type DocsOutputConfig = z.infer<typeof docsOutputSchema>;
/** @deprecated Use {@link DocsOutputConfig} */
export type MarkdownOutputConfig = DocsOutputConfig;
export type UiConfig = z.infer<typeof uiConfigSchema>;
export type DocBlock = z.infer<typeof docBlockSchema>;
/** @deprecated Use {@link DocBlock} */
export type DocumentationBlock = DocBlock;
export type JsonKeyPolicyConfig = z.infer<typeof jsonKeyPolicySchema>;
export type JsonBlock = z.infer<typeof jsonBlockSchema>;
export type SvgFilesConfig = z.infer<typeof SvgFilesConfigSchema>;
/**
 * @deprecated Nested `svg.svgExtractor` was removed; use top-level `svg.forceLowercase` in config.
 * Alias kept for packages that referenced this shape.
 */
export type SvgExtractorConfig = Pick<SvgFilesConfig, "forceLowercase">;

/**
 * View passed to translate-docs internals: one active `documentation` block plus root fields.
 * Built from root config via {@link toDocTranslateConfig}.
 */
export type I18nDocTranslateConfig = Omit<I18nConfig, "docs"> & {
  doc: DocBlock;
};

export type RawI18nConfigInput = z.input<typeof i18nConfigSchemaInner>;
