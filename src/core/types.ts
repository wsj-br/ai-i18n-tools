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
  element: "text" | "title";
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

export interface TranslationResult {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: number;
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
  reassemble(segments: Segment[], translations: Map<string, string>): string;
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
  translateSVG: z.boolean().default(false),
});

const glossarySchema = z.object({
  uiGlossaryFromStringsJson: z.string().optional(),
  userGlossary: z.string().optional(),
});

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
    /** Optional overrides for JSON / SVG outputs (default: nested `outputDir/locale/relPath`). */
    jsonPathTemplate: z.string().optional(),
    svgPathTemplate: z.string().optional(),
    /** For `flat` style: keep dirname segments so `docs/a.md` → `out/docs/a.de.md` instead of colliding with root `a.md`. */
    flatPreserveRelativeDir: z.boolean().default(false),
    /**
     * Transrewrt-style link rewriting after translation. Default: true when `style === "flat"` and `pathTemplate` is unset;
     * default false when `pathTemplate` is set (opt in explicitly).
     */
    rewriteRelativeLinksForFlat: z.boolean().optional(),
    /**
     * Repo root used with `documentation.outputDir` to compute `i18nPrefix` / `depthPrefix` for flat link rewriting (Transrewrt: `.`).
     */
    linkRewriteDocsRoot: z.string().optional(),
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
    reactExtractor: reactExtractorSchema.optional(),
  })
  .strict();

const documentationConfigSchema = z
  .object({
    /** Markdown / MDX / SVG roots under cwd (files and directories). */
    contentPaths: z.array(z.string().min(1)).default([]),
    /** Optional alias (e.g. Transrewrt `source-files`); merged into `contentPaths` at load. */
    sourceFiles: z.array(z.string().min(1)).optional(),
    /**
     * Locales for markdown / JSON / SVG translation only. When **omitted** or empty after load, root
     * `targetLocales` is used (same set as UI). When set, docs translate to this list only — e.g. app in 10
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
    /** Base directory for translated docs (markdown / default JSON / SVG layout). */
    outputDir: z.string().min(1).default("./i18n"),
    cacheDir: z.string().min(1).default(".translation-cache"),
    /** Docusaurus / JSON UI strings source dir (e.g. i18n/en/). */
    jsonSource: z.string().optional(),
    svgExtractor: svgExtractorSchema.optional(),
    markdownOutput: markdownOutputSchema.default({
      style: "nested",
      flatPreserveRelativeDir: false,
    }),
  })
  .strict();

/** Unified package config: shared root + `ui` + `documentation` namespaces. */
export const i18nConfigSchema = z
  .object({
    sourceLocale: z.string().min(1),
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
      translateSVG: false,
    }),
    glossary: glossarySchema.default({}),
    ui: uiConfigSchema.default({
      sourceRoots: [],
      stringsJson: "strings.json",
      flatOutputDir: "./locales",
    }),
    documentation: documentationConfigSchema.default({
      contentPaths: [],
      outputDir: "./i18n",
      cacheDir: ".translation-cache",
      markdownOutput: {
        style: "nested",
        flatPreserveRelativeDir: false,
      },
    }),
    /** BCP-47-ish codes that use RTL typography; layout `dir` stays the app’s i18next concern. */
    rtlLocales: z.array(z.string().min(1)).optional(),
    localeDisplayNames: z.record(z.string(), z.string()).optional(),
    /**
     * Optional path to the same `ui-languages.json` manifest. Usually unnecessary if `targetLocales` is a
     * single manifest path (expanded at load). Use when `targetLocales` is an explicit code list but you
     * still want manifest-driven UI locale filtering / `localeDisplayNames` / intersection.
     */
    uiLanguagesPath: z.string().optional(),
    batchSize: z.number().int().positive().optional(),
    maxBatchChars: z.number().int().positive().optional(),
    concurrency: z.number().int().positive().optional(),
    batchConcurrency: z.number().int().positive().optional(),
  })
  .strict();

export type I18nConfig = z.infer<typeof i18nConfigSchema>;
export type OpenRouterConfig = z.infer<typeof openRouterConfigSchema>;
export type FeaturesConfig = z.infer<typeof featuresSchema>;
export type GlossaryConfig = z.infer<typeof glossarySchema>;
export type ReactExtractorConfig = z.infer<typeof reactExtractorSchema>;
export type SvgExtractorConfig = z.infer<typeof svgExtractorSchema>;
export type MarkdownOutputConfig = z.infer<typeof markdownOutputSchema>;
export type UiConfig = z.infer<typeof uiConfigSchema>;
export type DocumentationConfig = z.infer<typeof documentationConfigSchema>;

export type RawI18nConfigInput = z.input<typeof i18nConfigSchema>;
