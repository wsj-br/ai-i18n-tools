import fs from "fs";
import path from "path";
import { matter, stringify as matterStringify } from "gray-matter-es";
import chalk from "chalk";
import type {
  DocSegmentTranslation,
  I18nConfig,
  I18nDocTranslateConfig,
  Segment,
} from "../core/types.js";
import { segmentTranslationText } from "../core/types.js";

export type { DocSegmentTranslation };
import { documentationFileTrackingKey } from "../core/doc-file-tracking.js";
import { BatchTranslationError } from "../core/types.js";
import {
  timestamp,
  formatElapsedMmSs,
  formatSegmentCacheHitSuffix,
  printModelsTryInOrder,
} from "./format.js";
import { TranslationCache } from "../core/cache.js";
import { MarkdownExtractor } from "../extractors/markdown-extractor.js";
import { JsonExtractor } from "../extractors/json-extractor.js";
import { SvgExtractor } from "../extractors/svg-extractor.js";
import { PlaceholderHandler } from "../processors/placeholder-handler.js";
import {
  protectGlossaryForcedTerms,
  restoreGlossaryForcedTerms,
} from "../processors/glossary-force-placeholders.js";
import { splitTranslatableIntoBatches } from "../processors/batch-processor.js";
import { Glossary } from "../glossary/glossary.js";
import { OpenRouterClient } from "../api/openrouter.js";
import { validateDocTranslatePair, validateTranslation } from "../processors/validator.js";
import {
  computeFlatLinkRewritePrefixes,
  normalizeMarkdownRelPath,
  rewriteDocLinksForFlatOutput,
} from "../processors/flat-link-rewrite.js";
import { shouldRewriteFlatMarkdownLinks } from "../core/output-paths.js";
import {
  applyMarkdownLanguageListPostProcessing,
  applyMarkdownPostProcessing,
} from "../processors/doc-postprocess.js";
import {
  resolveSvgAssetOutputPath,
  svgAssetCacheFilepath,
  svgTranslationFilepathMetadata,
} from "../core/svg-asset-paths.js";
import {
  ensureDirForFile,
  hashFileContent,
  resolveTranslatedOutputPath,
  writeAtomicUtf8,
} from "./helpers.js";
import { normalizeLocale } from "../core/config.js";
import type {
  DocumentBatchResponseFormat,
  DocumentPromptContentType,
} from "../core/prompt-builder.js";
import { runMapWithConcurrency, AsyncSemaphore, AsyncMutex } from "../utils/concurrency.js";

/** Batch segment prompt/response shape for `translate-docs --prompt-format`. */
export type TranslatePromptFormat = "xml" | "json-array" | "json-object";

export function translatePromptFormatToResponseFormat(
  fmt: TranslatePromptFormat | undefined
): DocumentBatchResponseFormat {
  if (fmt === "json-array") {
    return "json-array";
  }
  if (fmt === "json-object") {
    return "json-object";
  }
  if (fmt === "xml") {
    return "xml-tags";
  }
  return "json-array";
}

export interface TranslateRunOptions {
  cwd: string;
  locales: string[];
  dryRun: boolean;
  force: boolean;
  /**
   * Re-run each file even when file hash matches tracking + output exists; segment cache still applies (unlike `force`).
   */
  forceUpdate: boolean;
  noCache: boolean;
  verbose: boolean;
  pathFilter?: string;
  typeFilter?: "markdown" | "json";
  jsonOnly?: boolean;
  noJson?: boolean;
  /** Path to the active log file (printed in the header block). */
  logPath?: string;
  /**
   * Max parallel target locales (CLI `-j`). Effective default set in `runTranslate` from config (3).
   */
  concurrency?: number;
  /**
   * Max parallel batch API calls per file (CLI `-b`). Effective default set in `runTranslate` from config (4).
   */
  batchConcurrency?: number;
  /** Internal: serialize SQLite cache access when multiple locales run in parallel. */
  cacheMutex?: AsyncMutex;
  /** Which `documentations` block index (namespaces file_tracking keys in the shared cache). */
  documentationBlockIndex?: number;
  /**
   * Batch segment prompt/response shape (`translate-docs --prompt-format`).
   * Default `json-array`; `xml` uses &lt;seg&gt;/&lt;t&gt;; `json-object` matches {@link buildDocumentBatchPrompt} JSON object mode.
   */
  promptFormat?: TranslatePromptFormat;
  /**
   * When true, markdown runs emphasis placeholder protection (`emphasis-placeholders.ts`) inside `PlaceholderHandler`
   * (`translate-docs` / `sync --emphasis-placeholders`). Default: off — omit the flag to leave emphasis delimiters unmasked for the model.
   */
  emphasisPlaceholders?: boolean;
  /**
   * When true, write per-failure debug logs (`*-FAILED-TRANSLATION_*.log`) under cacheDir.
   * Default: off.
   */
  debugFailed?: boolean;
}

export interface TranslateTotals {
  filesWritten: number;
  filesSkipped: number;
  /** Files that ran translation (not file-level skipped); includes dry-run. */
  filesProcessed?: number;
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
  /** Translatable segments resolved from SQLite cache (per file or summed in `runTranslate`). */
  segmentsCached?: number;
  /** Translatable segments translated via API (or dry-run) this run. */
  segmentsTranslated?: number;
  /** Segment translations that failed quality validation at least once before success (markdown batch + per-segment retries). */
  segmentValidationFailures?: number;
  /** Count of single-segment API calls (`translateDocumentSegment`), including batch fallbacks and markdown quality retries. */
  individualSegmentTranslations?: number;
}

type ProtectState = ReturnType<PlaceholderHandler["protectForTranslation"]> & {
  glossaryForceReplacements?: string[];
};

function emptyMarkdownProtectShell(): Omit<
  ReturnType<PlaceholderHandler["protectForTranslation"]>,
  "text"
> {
  return {
    htmlTagMap: [],
    openMap: [],
    endMap: [],
    htmlAnchors: [],
    docusaurusHeadingIds: [],
    urlMap: [],
    boldCodeMap: [],
    ilcMap: [],
    emphasisProtected: false,
  };
}

/** Glossary forced tokens first, then markdown URL/admonition/(optional) emphasis protection when `useMarkdownPlaceholders`. */
export function protectSegmentForTranslation(
  raw: string,
  glossary: Glossary,
  locale: string,
  useMarkdownPlaceholders: boolean,
  emphasisPlaceholders = false
): { text: string; state: ProtectState } {
  const g = protectGlossaryForcedTerms(raw, glossary, locale);
  const glossaryForceReplacements = g.replacements;

  if (useMarkdownPlaceholders) {
    const ph = new PlaceholderHandler();
    const st = ph.protectForTranslation(g.text, { emphasis: emphasisPlaceholders });
    return {
      text: st.text,
      state: {
        ...st,
        glossaryForceReplacements:
          glossaryForceReplacements.length > 0 ? glossaryForceReplacements : undefined,
      },
    };
  }

  return {
    text: g.text,
    state: {
      text: g.text,
      ...emptyMarkdownProtectShell(),
      glossaryForceReplacements:
        glossaryForceReplacements.length > 0 ? glossaryForceReplacements : undefined,
    },
  };
}

function restoreSegmentTranslation(
  ph: PlaceholderHandler,
  raw: string,
  st: ProtectState | undefined
): string {
  if (!st) {
    return raw;
  }
  let out = ph.restoreAfterTranslation(raw, st);
  out = restoreGlossaryForcedTerms(out, st.glossaryForceReplacements ?? []);
  return out;
}

function segmentOriginalContent(s: Segment, originalContentByHash: Map<string, string>): Segment {
  return { ...s, content: originalContentByHash.get(s.hash) ?? s.content };
}

/** Same style as {@link OpenRouterClient} model switch warnings; used when post-restore quality checks fail. */
function warnDocQualityModelSwitch(
  locale: string,
  relativePath: string | undefined,
  failedModel: string,
  nextModel: string,
  detail: string,
  /** Same shape as successful batch lines, e.g. `segments 28–52/155`. */
  segmentsLabel?: string,
  /** 1-based index of `nextModel` in the configured model list, and list length. */
  nextModelOrdinal?: { index1Based: number; total: number }
): void {
  const loc = relativePath != null ? `${locale} ${relativePath}` : locale;
  const seg = segmentsLabel ? `: ${segmentsLabel}` : "";
  const ordinal =
    nextModelOrdinal != null
      ? ` (${nextModelOrdinal.index1Based}/${nextModelOrdinal.total})`
      : "";
  console.warn(
    chalk.yellow(
      `  ⚠️  ${loc}${seg}: ${failedModel} output failed quality check (${detail}). Trying ${nextModel}${ordinal}…`
    )
  );
}

function safeDocNameForLogFilename(relativePath: string): string {
  return relativePath.replace(/[/\\:*?"<>|]/g, "_");
}

/**
 * Writes prompt, raw response, and validation details when doc translation quality checks fail.
 * Filename: `{iso}-FAILED-TRANSLATION_{document}_{ms}.log` under `cacheDirAbs`.
 * Returns absolute path; callers print `📝 Failure log: …` after warnings (retry) or before throw (fatal).
 */
type DocTranslationLogOutcome = "retrying_next_model" | "fatal" | "individual_success";

function writeDocTranslationDetailLog(
  opts: {
    cacheDirAbs: string;
    relativePath: string;
    locale: string;
    segmentsLabel: string;
    outcome: DocTranslationLogOutcome;
    failedModel: string;
    nextModel?: string;
    qualityErrors: string[];
    perSegmentLines: string[];
    systemPrompt: string;
    userContent: string;
    rawAssistantContent: string;
  },
  mode: "failed" | "debug"
): string | undefined {
  const fileLabel = mode === "failed" ? "FAILED-TRANSLATION" : "DEBUG-TRANSLATION";
  const headerTitle =
    mode === "failed"
      ? "=== ai-i18n-tools doc translation failure ==="
      : "=== ai-i18n-tools doc translation debug ===";
  const tsIso = new Date().toISOString().replace(/:/g, "-");
  const ms = Date.now();
  const doc = safeDocNameForLogFilename(opts.relativePath);
  const fileName = `${tsIso}-${fileLabel}_${doc}_${ms}.log`;
  const abs = path.join(opts.cacheDirAbs, fileName);
  try {
    ensureDirForFile(abs);
    const lines = [
      headerTitle,
      `logFilePath: ${abs}`,
      `isoTime: ${new Date().toISOString()}`,
      `locale: ${opts.locale}`,
      `document: ${opts.relativePath}`,
      `segments: ${opts.segmentsLabel}`,
      `outcome: ${opts.outcome}`,
      `failedModel: ${opts.failedModel}`,
      opts.nextModel ? `nextModel: ${opts.nextModel}` : "",
      "",
      "--- quality / validation errors ---",
      ...(opts.qualityErrors.length > 0
        ? opts.qualityErrors.map((e) => `  ${e}`)
        : ["  (none)"]),
      "",
      "--- per-segment validation ---",
      ...opts.perSegmentLines.map((e) => `  ${e}`),
      "",
      "--- system prompt ---",
      opts.systemPrompt,
      "",
      "--- user content ---",
      opts.userContent,
      "",
      "--- raw assistant response ---",
      opts.rawAssistantContent,
      "",
    ].filter((l) => l !== "");
    fs.writeFileSync(abs, lines.join("\n"), "utf8");
    return abs;
  } catch (e) {
    console.warn(chalk.yellow(`  ⚠️  Could not write translation ${mode} log: ${e}`));
    return undefined;
  }
}

function writeDocTranslationFailureLog(opts: {
  cacheDirAbs: string;
  relativePath: string;
  locale: string;
  segmentsLabel: string;
  outcome: "retrying_next_model" | "fatal";
  failedModel: string;
  nextModel?: string;
  qualityErrors: string[];
  perSegmentLines: string[];
  systemPrompt: string;
  userContent: string;
  rawAssistantContent: string;
}): string | undefined {
  return writeDocTranslationDetailLog(opts, "failed");
}

function writeDocTranslationDebugLog(opts: {
  cacheDirAbs: string;
  relativePath: string;
  locale: string;
  segmentsLabel: string;
  outcome: DocTranslationLogOutcome;
  failedModel: string;
  nextModel?: string;
  qualityErrors: string[];
  perSegmentLines: string[];
  systemPrompt: string;
  userContent: string;
  rawAssistantContent: string;
}): string | undefined {
  return writeDocTranslationDetailLog(opts, "debug");
}

/** Elapsed time as `M:SS` (minutes not zero-padded), matching reference translate-docs. */
function formatElapsedFileTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function logTranslateFileComplete(
  relPath: string,
  outPath: string,
  segmentsCached: number,
  segmentsNew: number,
  elapsedMs: number,
  costUsd: number
): void {
  const fileTimeFormatted = formatElapsedFileTime(elapsedMs);
  const fileCostStr = costUsd > 0 ? `$${costUsd.toFixed(4)}` : "$0.0000";
  console.log(
    chalk.blue(
      `✅ ${relPath} → ${path.basename(outPath)} (${segmentsCached} cached, ${segmentsNew} new) - ${fileTimeFormatted} - ${fileCostStr}`
    )
  );
}

export function shouldRunMarkdown(
  opts: TranslateRunOptions,
  config: I18nDocTranslateConfig
): boolean {
  if (!config.features.translateMarkdown) {
    return false;
  }
  if (opts.typeFilter === "json") {
    return false;
  }
  if (opts.jsonOnly) {
    return false;
  }
  return true;
}

export function shouldRunJson(opts: TranslateRunOptions, config: I18nDocTranslateConfig): boolean {
  if (!config.features.translateJSON || !config.documentation.jsonSource?.trim()) {
    return false;
  }
  if (opts.noJson) {
    return false;
  }
  if (opts.typeFilter === "markdown") {
    return false;
  }
  return true;
}

export function matchesPathFilter(relPath: string, filter: string | undefined): boolean {
  if (!filter?.trim()) {
    return true;
  }
  const f = filter.replace(/\\/g, "/");
  const r = relPath.replace(/\\/g, "/");
  return r === f || r.startsWith(f.endsWith("/") ? f : `${f}/`);
}

/**
 * Posix path of a JSON catalog file relative to the project root (`opts.cwd`).
 * JSON file lists use paths relative to `jsonSource`, so this is used with `--path` / `--file`.
 */
export function jsonFileProjectRelativePath(
  projectRoot: string,
  jsonAbsRoot: string,
  jsonRel: string
): string {
  return path
    .relative(projectRoot, path.join(jsonAbsRoot, jsonRel))
    .split(path.sep)
    .join("/");
}

/**
 * Normalize CLI `--path` / `--file` to a project-root-relative posix path for {@link matchesPathFilter}.
 * Empty input or a path equal to the project root means no filter (translate everything).
 */
export function normalizePathFilterForProjectRoot(
  projectRoot: string,
  raw: string | undefined
): string | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const trimmed = String(raw).trim();
  if (trimmed === "") {
    return undefined;
  }
  const resolved = path.isAbsolute(trimmed)
    ? path.normalize(trimmed)
    : path.resolve(projectRoot, trimmed);
  const rel = path.relative(projectRoot, resolved);
  if (rel === "" || rel === ".") {
    return undefined;
  }
  const norm = rel.split(path.sep).join("/");
  if (norm.startsWith("../") || norm === "..") {
    throw new Error(
      `Path filter must be inside the project root (${projectRoot}). Got: ${raw}`
    );
  }
  return norm;
}

async function withCacheMutex<T>(mutex: AsyncMutex | undefined, fn: () => T): Promise<T> {
  if (!mutex) {
    return fn();
  }
  return mutex.runExclusive(async () => fn());
}

/** Match reference transrewrt `addTranslationMetadata` for translated markdown outputs. */
function addTranslationMetadata(
  content: string,
  sourceFileMtime: string,
  sourceFileHash: string,
  locale: string,
  relativePath: string,
  translationModels: string[]
): string {
  const { data: frontMatter, content: body } = matter(content);
  const base =
    typeof frontMatter === "object" && frontMatter !== null && !Array.isArray(frontMatter)
      ? (frontMatter as Record<string, unknown>)
      : {};
  const fm = { ...base };
  fm.translation_last_updated = new Date().toISOString();
  fm.source_file_mtime = sourceFileMtime;
  fm.source_file_hash = sourceFileHash;
  fm.translation_language = locale;
  fm.source_file_path = relativePath;
  if (translationModels.length > 0) {
    fm.translation_models = translationModels;
  }
  return matterStringify(body, fm);
}

/** Unique non-empty model ids from segment translations, sorted for stable front matter. */
function collectTranslationModelsFromSegments(
  segments: Segment[],
  translations: Map<string, DocSegmentTranslation>
): string[] {
  const set = new Set<string>();
  for (const s of segments) {
    if (!s.translatable) {
      continue;
    }
    const m = translations.get(s.hash)?.modelUsed?.trim();
    if (m) {
      set.add(m);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** 1-based segment range label for translate-docs logs (indices are 0-based in the full segment list). */
function segRangeLabel(indices0: number[], totalSegments: number): string {
  if (indices0.length === 0) {
    return "";
  }
  const sorted = [...indices0].sort((a, b) => a - b);
  const a = sorted[0]! + 1;
  const b = sorted[sorted.length - 1]! + 1;
  if (a === b) {
    return `segment ${a}/${totalSegments}`;
  }
  return `segments ${a}–${b}/${totalSegments}`;
}

async function translateSegmentsBatched(
  batchable: Segment[],
  placeholderById: Map<string, ProtectState>,
  /** Pre-placeholder markdown source per segment hash; empty for json/svg (original is on the segment). */
  originalContentByHash: Map<string, string>,
  locale: string,
  glossary: Glossary,
  client: OpenRouterClient | null,
  dryRun: boolean,
  verbose: boolean,
  batchSize: number,
  maxBatchChars: number,
  contentType: DocumentPromptContentType,
  batchConcurrency: number,
  /** OpenRouter batch: XML &lt;seg&gt;/&lt;t&gt; vs JSON array/object (see `--prompt-format`). */
  batchResponseFormat: DocumentBatchResponseFormat,
  docLog?: {
    relativePath: string;
    totalSegments: number;
    /** For each entry in `batchable`, index into the full extracted segment list (0-based). */
    segmentIndicesInDoc: number[];
  },
  /** Absolute `cacheDir` path; writes `*-FAILED-TRANSLATION-*.log` on markdown quality failures. */
  failureLogDirAbs?: string | null
): Promise<{
  map: Map<string, DocSegmentTranslation>;
  inTok: number;
  outTok: number;
  cost: number;
  segmentValidationFailures: number;
  individualSegmentTranslations: number;
}> {
  const out = new Map<string, DocSegmentTranslation>();
  let inTok = 0;
  let outTok = 0;
  let cost = 0;
  let segmentValidationFailures = 0;
  let individualSegmentTranslations = 0;

  const batches = splitTranslatableIntoBatches(batchable, { batchSize, maxBatchChars });
  if (batches.length === 0) {
    return {
      map: out,
      inTok,
      outTok,
      cost,
      segmentValidationFailures: 0,
      individualSegmentTranslations: 0,
    };
  }

  const batchDocIndices: number[][] = [];
  if (docLog && docLog.segmentIndicesInDoc.length === batchable.length) {
    let off = 0;
    for (const b of batches) {
      batchDocIndices.push(docLog.segmentIndicesInDoc.slice(off, off + b.length));
      off += b.length;
    }
  }

  const apiConc = Math.max(1, Math.floor(batchConcurrency));
  const sem =
    !dryRun && client && batches.length > 0 && apiConc > 1 ? new AsyncSemaphore(apiConc) : null;

  type BatchProcessResult = {
    partial: Map<string, DocSegmentTranslation>;
    inTok: number;
    outTok: number;
    cost: number;
    segmentValidationFailures: number;
    individualSegmentTranslations: number;
  };

  const processBatch = async (bi: number): Promise<BatchProcessResult> => {
    const partial = new Map<string, DocSegmentTranslation>();
    let localIn = 0;
    let localOut = 0;
    let localCost = 0;
    let localSegmentValidationFailures = 0;
    let localIndividualSegmentTranslations = 0;
    const batch = batches[bi]!;
    const hintText = batch.map((s) => s.content).join("\n");
    const hints = glossary.findTermsInText(hintText, locale);
    const markdownQuality = contentType === "markdown";

    if (dryRun || !client) {
      if (verbose) {
        console.log(
          chalk.yellow(
            `  ${timestamp()} - [dry-run] batch ${bi + 1}/${batches.length} (${batch.length} segments)`
          )
        );
      }
      for (const s of batch) {
        partial.set(s.hash, { text: s.content });
      }
      return {
        partial,
        inTok: localIn,
        outTok: localOut,
        cost: localCost,
        segmentValidationFailures: localSegmentValidationFailures,
        individualSegmentTranslations: localIndividualSegmentTranslations,
      };
    }

    const logBatchSuccess = (res: { usage: { totalTokens: number } }) => {
      if (docLog && batchDocIndices[bi]) {
        const idxs = batchDocIndices[bi]!;
        const n = batch.length;
        const totalTok = res.usage.totalTokens;
        console.log(
          chalk.green(
            `✔️  ${locale} ${docLog.relativePath}: ${segRangeLabel(idxs, docLog.totalSegments)} (${n} segment${n === 1 ? "" : "s"} in batch, ${totalTok} tokens)`
          )
        );
      }
    };

    if (!markdownQuality) {
      try {
        const res = await client.translateDocumentBatch(batch, locale, hints, {
          contentType,
          responseFormat: batchResponseFormat,
          docLogContext: docLog ? { relativePath: docLog.relativePath } : undefined,
        });
        localIn += res.usage.inputTokens;
        localOut += res.usage.outputTokens;
        localCost += res.cost ?? 0;
        const ph = new PlaceholderHandler();
        for (let i = 0; i < batch.length; i++) {
          const s = batch[i]!;
          const raw = res.translations.get(i);
          if (raw === undefined) {
            throw new Error(`Missing translation for batch index ${i}`);
          }
          const st = placeholderById.get(s.id);
          const restored = restoreSegmentTranslation(ph, raw, st);
          partial.set(s.hash, { text: restored, modelUsed: res.model });
        }
        logBatchSuccess(res);
      } catch (e) {
        if (e instanceof BatchTranslationError && client) {
          if (verbose) {
            console.warn(
              chalk.yellow(
                `⚠️  ${locale} ${docLog?.relativePath ?? "?"}: batch failed (expected ${e.expected} translated segments, got ${e.received}); falling back to single-segment API calls`
              )
            );
          }
          const ph = new PlaceholderHandler();
          for (const s of batch) {
            const st = placeholderById.get(s.id);
            localIndividualSegmentTranslations++;
            const single = await client.translateDocumentSegment(s.content, locale, hints, {
              contentType,
              docLogContext:
                docLog && docLog.relativePath
                  ? { locale, relativePath: docLog.relativePath }
                  : undefined,
            });
            localIn += single.usage.inputTokens;
            localOut += single.usage.outputTokens;
            localCost += single.cost ?? 0;
            const restored = restoreSegmentTranslation(ph, single.content, st);
            partial.set(s.hash, { text: restored, modelUsed: single.model });
          }
        } else {
          throw e;
        }
      }
      return {
        partial,
        inTok: localIn,
        outTok: localOut,
        cost: localCost,
        segmentValidationFailures: localSegmentValidationFailures,
        individualSegmentTranslations: localIndividualSegmentTranslations,
      };
    }

    const ph = new PlaceholderHandler();
    const models = client.getConfiguredModels();

    try {
      const res = await client.translateDocumentBatch(batch, locale, hints, {
        contentType,
        responseFormat: batchResponseFormat,
        docLogContext: docLog ? { relativePath: docLog.relativePath } : undefined,
      });
      localIn += res.usage.inputTokens;
      localOut += res.usage.outputTokens;
      localCost += res.cost ?? 0;

      const qualityErrors: string[] = [];
      const perSegmentLines: string[] = [];
      const failedSegments: Array<{
        index: number;
        segment: Segment;
        state: ProtectState | undefined;
        original: Segment;
        errors: string[];
        docIdx0: number | undefined;
      }> = [];
      for (let i = 0; i < batch.length; i++) {
        const s = batch[i]!;
        const raw = res.translations.get(i);
        if (raw === undefined) {
          throw new Error(`Missing translation for batch index ${i}`);
        }
        const st = placeholderById.get(s.id);
        const restored = restoreSegmentTranslation(ph, raw, st);
        const origSeg = segmentOriginalContent(s, originalContentByHash);
        const v = await validateDocTranslatePair(origSeg, restored);
        const docIdx0 = batchDocIndices[bi]?.[i];
        const label =
          docLog && docIdx0 !== undefined
            ? `doc #${docIdx0 + 1}/${docLog.totalSegments} seg id=${i} (hash ${s.hash})`
            : `batch seg id=${i} (hash ${s.hash})`;
        perSegmentLines.push(`${label}: ${v.ok ? "OK" : v.errors.join("; ")}`);
        if (v.ok) {
          partial.set(s.hash, { text: restored, modelUsed: res.model });
        } else {
          localSegmentValidationFailures++;
          qualityErrors.push(...v.errors);
          failedSegments.push({
            index: i,
            segment: s,
            state: st,
            original: origSeg,
            errors: v.errors,
            docIdx0,
          });
        }
      }

      if (failedSegments.length === 0) {
        logBatchSuccess(res);
      } else {
        const nextStart = models.indexOf(res.model) + 1;
        const segLabel =
          docLog && batchDocIndices[bi] && batchDocIndices[bi]!.length > 0
            ? segRangeLabel(batchDocIndices[bi]!, docLog.totalSegments)
            : "";

        let failureLogPath: string | undefined;
        if (failureLogDirAbs && docLog) {
          failureLogPath = writeDocTranslationFailureLog({
            cacheDirAbs: failureLogDirAbs,
            relativePath: docLog.relativePath,
            locale,
            segmentsLabel: segLabel || "(segment range unknown)",
            outcome: nextStart >= models.length ? "fatal" : "retrying_next_model",
            failedModel: res.model,
            nextModel: nextStart < models.length ? models[nextStart]! : undefined,
            qualityErrors,
            perSegmentLines,
            systemPrompt: res.debugPrompt?.systemPrompt ?? "",
            userContent: res.debugPrompt?.userContent ?? "",
            rawAssistantContent:
              res.rawAssistantContent ?? "(missing raw response; rebuild ai-i18n-tools)",
          });
        }

        if (nextStart >= models.length) {
          if (failureLogPath) {
            console.warn(chalk.gray(`  📝 Failure log: ${failureLogPath}`));
          }
          throw new Error(
            `Doc translation quality failed (${locale}, ${docLog?.relativePath ?? "?"}): ${segLabel ? `${segLabel}: ` : ""}${qualityErrors.join("; ")}`
          );
        }

        warnDocQualityModelSwitch(
          locale,
          docLog?.relativePath,
          res.model,
          models[nextStart]!,
          qualityErrors.join("; "),
          segLabel || undefined,
          { index1Based: nextStart + 1, total: models.length }
        );
        if (failureLogPath) {
          console.warn(chalk.gray(`  📝 Failure log: ${failureLogPath}`));
        }

        const initialModelIndex = models.indexOf(res.model);
        const okCount = batch.length - failedSegments.length;
        const failedCount = failedSegments.length;
        const baseLoc = docLog?.relativePath ? `${locale} ${docLog.relativePath}` : locale;
        console.warn(
          chalk.yellow(
            `  ⚠️  ${baseLoc}: batch validation complete — ${okCount}/${batch.length} segment(s) OK, ${failedCount} failed.`
          )
        );
        const initialTryOrdinal =
          initialModelIndex >= 0 ? ` (${initialModelIndex + 1}/${models.length})` : "";
        console.warn(
          chalk.magenta(
            `  🔄 ${baseLoc}: retrying ${failedCount} failed segment(s) individually. Trying ${res.model}${initialTryOrdinal}…`
          )
        );
        for (const failed of failedSegments) {
          const segLabelSingle =
            docLog && failed.docIdx0 !== undefined
              ? segRangeLabel([failed.docIdx0], docLog.totalSegments)
              : "";
          let startIdx = initialModelIndex >= 0 ? initialModelIndex : 0;
          let remainingErrors = failed.errors;
          while (startIdx < models.length) {
            localIndividualSegmentTranslations++;
            const single = await client.translateDocumentSegment(failed.segment.content, locale, hints, {
              contentType,
              startModelIndex: startIdx,
              docLogContext:
                docLog && docLog.relativePath
                  ? { locale, relativePath: docLog.relativePath }
                  : undefined,
            });
            localIn += single.usage.inputTokens;
            localOut += single.usage.outputTokens;
            localCost += single.cost ?? 0;
            const restored = restoreSegmentTranslation(ph, single.content, failed.state);
            const v = await validateDocTranslatePair(failed.original, restored);
            const nextIdx = models.indexOf(single.model) + 1;
            const perSegLine =
              docLog && failed.docIdx0 !== undefined
                ? `doc #${failed.docIdx0 + 1}/${docLog.totalSegments} seg id=${failed.index} (hash ${failed.segment.hash}): ${v.ok ? "OK" : v.errors.join("; ")}`
                : `batch seg id=${failed.index} (hash ${failed.segment.hash}): ${v.ok ? "OK" : v.errors.join("; ")}`;
            if (failureLogDirAbs && docLog) {
              const debugLogPathSingle = writeDocTranslationDebugLog({
                cacheDirAbs: failureLogDirAbs,
                relativePath: docLog.relativePath,
                locale,
                segmentsLabel: segLabelSingle || "(segment range unknown)",
                outcome: v.ok ? "individual_success" : nextIdx >= models.length ? "fatal" : "retrying_next_model",
                failedModel: single.model,
                nextModel: nextIdx < models.length ? models[nextIdx]! : undefined,
                qualityErrors: v.errors,
                perSegmentLines: [perSegLine],
                systemPrompt: single.debugPrompt?.systemPrompt ?? "",
                userContent: single.debugPrompt?.userContent ?? "",
                rawAssistantContent:
                  single.rawAssistantContent ?? "(missing raw response; rebuild ai-i18n-tools)",
              });
              if (debugLogPathSingle) {
                console.warn(chalk.gray(`  🧪 Debug log: ${debugLogPathSingle}`));
              }
            }
            if (v.ok) {
              partial.set(failed.segment.hash, { text: restored, modelUsed: single.model });
              break;
            }

            localSegmentValidationFailures++;
            remainingErrors = v.errors;
            const perSegDetail = [
              perSegLine,
            ];
            let failureLogPathSingle: string | undefined;
            if (failureLogDirAbs && docLog) {
              failureLogPathSingle = writeDocTranslationFailureLog({
                cacheDirAbs: failureLogDirAbs,
                relativePath: docLog.relativePath,
                locale,
                segmentsLabel: segLabelSingle || "(segment range unknown)",
                outcome: nextIdx >= models.length ? "fatal" : "retrying_next_model",
                failedModel: single.model,
                nextModel: nextIdx < models.length ? models[nextIdx]! : undefined,
                qualityErrors: v.errors,
                perSegmentLines: perSegDetail,
                systemPrompt: single.debugPrompt?.systemPrompt ?? "",
                userContent: single.debugPrompt?.userContent ?? "",
                rawAssistantContent:
                  single.rawAssistantContent ?? "(missing raw response; rebuild ai-i18n-tools)",
              });
            }
            if (nextIdx >= models.length) {
              if (failureLogPathSingle) {
                console.warn(chalk.gray(`  📝 Failure log: ${failureLogPathSingle}`));
              }
              throw new Error(
                `Doc translation quality failed (${locale}, ${docLog?.relativePath ?? "?"}): ${segLabelSingle ? `${segLabelSingle}: ` : ""}${v.errors.join("; ")}`
              );
            }
            warnDocQualityModelSwitch(
              locale,
              docLog?.relativePath,
              single.model,
              models[nextIdx]!,
              v.errors.join("; "),
              segLabelSingle || undefined,
              { index1Based: nextIdx + 1, total: models.length }
            );
            if (failureLogPathSingle) {
              console.warn(chalk.gray(`  📝 Failure log: ${failureLogPathSingle}`));
            }
            startIdx = nextIdx;
          }
          if (!partial.has(failed.segment.hash)) {
            throw new Error(
              `Doc translation quality failed (${locale}, ${docLog?.relativePath ?? "?"}): ${segLabelSingle ? `${segLabelSingle}: ` : ""}${remainingErrors.join("; ")}`
            );
          }
        }
      }
    } catch (e) {
      if (e instanceof BatchTranslationError && client) {
        if (verbose) {
          console.warn(
            chalk.yellow(
              `⚠️  ${locale} ${docLog?.relativePath ?? "?"}: batch failed (expected ${e.expected} translated segments, got ${e.received}); falling back to single-segment API calls`
            )
          );
        }
        for (let si = 0; si < batch.length; si++) {
          const s = batch[si]!;
          const st = placeholderById.get(s.id);
          const origSeg = segmentOriginalContent(s, originalContentByHash);
          const docIdx0 = batchDocIndices[bi]?.[si];
          const segLabelSingle =
            docLog && docIdx0 !== undefined ? segRangeLabel([docIdx0], docLog.totalSegments) : "";
          let startIdx = 0;
          while (startIdx < models.length) {
            localIndividualSegmentTranslations++;
            const single = await client.translateDocumentSegment(s.content, locale, hints, {
              contentType,
              startModelIndex: startIdx,
              docLogContext:
                docLog && docLog.relativePath
                  ? { locale, relativePath: docLog.relativePath }
                  : undefined,
            });
            localIn += single.usage.inputTokens;
            localOut += single.usage.outputTokens;
            localCost += single.cost ?? 0;
            const restored = restoreSegmentTranslation(ph, single.content, st);
            const v = await validateDocTranslatePair(origSeg, restored);
            const nextIdx = models.indexOf(single.model) + 1;
            const perSegLine =
              docLog && docIdx0 !== undefined
                ? `doc #${docIdx0 + 1}/${docLog.totalSegments} seg id=${si} (hash ${s.hash}): ${v.ok ? "OK" : v.errors.join("; ")}`
                : `batch seg id=${si} (hash ${s.hash}): ${v.ok ? "OK" : v.errors.join("; ")}`;
            if (failureLogDirAbs && docLog) {
              const debugLogPathSingle = writeDocTranslationDebugLog({
                cacheDirAbs: failureLogDirAbs,
                relativePath: docLog.relativePath,
                locale,
                segmentsLabel: segLabelSingle || "(segment range unknown)",
                outcome: v.ok ? "individual_success" : nextIdx >= models.length ? "fatal" : "retrying_next_model",
                failedModel: single.model,
                nextModel: nextIdx < models.length ? models[nextIdx]! : undefined,
                qualityErrors: v.errors,
                perSegmentLines: [perSegLine],
                systemPrompt: single.debugPrompt?.systemPrompt ?? "",
                userContent: single.debugPrompt?.userContent ?? "",
                rawAssistantContent:
                  single.rawAssistantContent ?? "(missing raw response; rebuild ai-i18n-tools)",
              });
              if (debugLogPathSingle) {
                console.warn(chalk.gray(`  🧪 Debug log: ${debugLogPathSingle}`));
              }
            }
            if (v.ok) {
              partial.set(s.hash, { text: restored, modelUsed: single.model });
              break;
            }
            localSegmentValidationFailures++;
            const perSegDetail = [
              perSegLine,
            ];
            let failureLogPathSingle: string | undefined;
            if (failureLogDirAbs && docLog) {
              failureLogPathSingle = writeDocTranslationFailureLog({
                cacheDirAbs: failureLogDirAbs,
                relativePath: docLog.relativePath,
                locale,
                segmentsLabel: segLabelSingle || "(segment range unknown)",
                outcome: nextIdx >= models.length ? "fatal" : "retrying_next_model",
                failedModel: single.model,
                nextModel: nextIdx < models.length ? models[nextIdx]! : undefined,
                qualityErrors: v.errors,
                perSegmentLines: perSegDetail,
                systemPrompt: single.debugPrompt?.systemPrompt ?? "",
                userContent: single.debugPrompt?.userContent ?? "",
                rawAssistantContent:
                  single.rawAssistantContent ?? "(missing raw response; rebuild ai-i18n-tools)",
              });
            }
            if (nextIdx >= models.length) {
              if (failureLogPathSingle) {
                console.warn(chalk.gray(`  📝 Failure log: ${failureLogPathSingle}`));
              }
              throw new Error(
                `Doc translation quality failed (${locale}, ${docLog?.relativePath ?? "?"}): ${segLabelSingle ? `${segLabelSingle}: ` : ""}${v.errors.join("; ")}`
              );
            }
            warnDocQualityModelSwitch(
              locale,
              docLog?.relativePath,
              single.model,
              models[nextIdx]!,
              v.errors.join("; "),
              segLabelSingle || undefined,
              { index1Based: nextIdx + 1, total: models.length }
            );
            if (failureLogPathSingle) {
              console.warn(chalk.gray(`  📝 Failure log: ${failureLogPathSingle}`));
            }
            startIdx = nextIdx;
          }
        }
      } else {
        throw e;
      }
    }
    return {
      partial,
      inTok: localIn,
      outTok: localOut,
      cost: localCost,
      segmentValidationFailures: localSegmentValidationFailures,
      individualSegmentTranslations: localIndividualSegmentTranslations,
    };
  };

  if (sem) {
    const results = await Promise.all(batches.map((_, bi) => sem.use(() => processBatch(bi))));
    for (const r of results) {
      inTok += r.inTok;
      outTok += r.outTok;
      cost += r.cost;
      segmentValidationFailures += r.segmentValidationFailures;
      individualSegmentTranslations += r.individualSegmentTranslations;
      for (const [h, t] of r.partial) {
        out.set(h, t);
      }
    }
  } else {
    for (let bi = 0; bi < batches.length; bi++) {
      const r = await processBatch(bi);
      inTok += r.inTok;
      outTok += r.outTok;
      cost += r.cost;
      segmentValidationFailures += r.segmentValidationFailures;
      individualSegmentTranslations += r.individualSegmentTranslations;
      for (const [h, t] of r.partial) {
        out.set(h, t);
      }
    }
  }

  return {
    map: out,
    inTok,
    outTok,
    cost,
    segmentValidationFailures,
    individualSegmentTranslations,
  };
}

export async function translateMarkdownFile(
  absSource: string,
  relPath: string,
  locale: string,
  config: I18nDocTranslateConfig,
  cache: TranslationCache | null,
  client: OpenRouterClient | null,
  glossary: Glossary,
  opts: TranslateRunOptions,
  hitKeys: Set<string>,
  translatedMarkdownRelPaths: ReadonlySet<string>
): Promise<{ skipped: boolean; totals: TranslateTotals }> {
  const totals: TranslateTotals = {
    filesWritten: 0,
    filesSkipped: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };

  const content = fs.readFileSync(absSource, "utf8");
  const fileHash = hashFileContent(content);
  const sourceFileMtime = fs.statSync(absSource).mtime.toISOString();
  /** Cwd-relative posix path for `translations.filepath` metadata (aligned with JSON/SVG). */
  const translationFilepathMeta = relPath.split(path.sep).join("/");
  const outPath = resolveTranslatedOutputPath(config, opts.cwd, locale, relPath, "markdown");
  const blockIdx = opts.documentationBlockIndex ?? 0;
  const fileTrackingKey = documentationFileTrackingKey(blockIdx, relPath);

  if (opts.force && cache && !opts.noCache) {
    await withCacheMutex(opts.cacheMutex, () => cache.clearFile(fileTrackingKey, locale));
    if (opts.verbose) {
      console.log(
        chalk.yellow(`  🔄 Force mode: cleared file tracking for ${relPath} (${locale})`)
      );
    }
  }

  const cachedFileHash =
    cache && !opts.noCache
      ? await withCacheMutex(opts.cacheMutex, () => cache.getFileHash(fileTrackingKey, locale))
      : null;

  if (
    !opts.force &&
    !opts.forceUpdate &&
    cache &&
    !opts.noCache &&
    cachedFileHash === fileHash &&
    fs.existsSync(outPath)
  ) {
    if (opts.verbose) {
      console.log(chalk.gray(`⏭️  ${timestamp()} - ${locale}  ${relPath} (unchanged)`));
    }
    totals.filesSkipped = 1;
    totals.filesProcessed = 0;
    return { skipped: true, totals };
  }

  const fileStartTime = Date.now();
  const md = new MarkdownExtractor();
  const langListCfg = config.documentation.markdownOutput.postProcessing?.languageListBlock;
  const segments = md.extract(
    content,
    relPath,
    langListCfg ? { languageListBlock: langListCfg } : undefined
  );
  const translatableCount = segments.filter((s) => s.translatable).length;
  console.log(
    chalk.yellow(
      `📄 ${locale} ${relPath}: ${segments.length} segment(s) (${translatableCount} translatable)`
    )
  );
  const translations = new Map<string, DocSegmentTranslation>();
  const placeholderById = new Map<string, ProtectState>();
  const originalContentByHash = new Map<string, string>();
  const toBatch: Segment[] = [];
  const segmentIndicesInDoc: number[] = [];

  let segmentsCached = 0;

  for (let docIdx = 0; docIdx < segments.length; docIdx++) {
    const s = segments[docIdx]!;
    if (!s.translatable) {
      continue;
    }
    if (!opts.force && cache && !opts.noCache) {
      const hit = await withCacheMutex(opts.cacheMutex, () =>
        cache.getSegmentDetails(s.hash, locale, translationFilepathMeta, s.startLine)
      );
      if (hit) {
        const quality = await validateDocTranslatePair(s, hit.text);
        if (quality.ok) {
          const modelUsed = hit.model?.trim();
          translations.set(s.hash, {
            text: hit.text,
            ...(modelUsed ? { modelUsed } : {}),
          });
          hitKeys.add(`${s.hash}|${locale}`);
          segmentsCached++;
          continue;
        }
        if (opts.verbose) {
          console.warn(
            chalk.yellow(
              `  ⚠️  ${relPath} (${locale}): cache rejected for segment (hash ${s.hash}): ${quality.errors.join("; ")}`
            )
          );
        }
      }
    }
    originalContentByHash.set(s.hash, s.content);
    const { text: protectedText, state: st } = protectSegmentForTranslation(
      s.content,
      glossary,
      locale,
      true,
      Boolean(opts.emphasisPlaceholders)
    );
    placeholderById.set(s.id, st);
    toBatch.push({ ...s, content: protectedText });
    segmentIndicesInDoc.push(docIdx);
  }

  const batchSize = config.batchSize ?? 20;
  const maxBatchChars = config.maxBatchChars ?? 4096;
  const batchConcurrency = opts.batchConcurrency ?? config.batchConcurrency ?? 4;

  const {
    map,
    inTok,
    outTok,
    cost,
    segmentValidationFailures: segValFail,
    individualSegmentTranslations: indivSeg,
  } = await translateSegmentsBatched(
    toBatch,
    placeholderById,
    originalContentByHash,
    locale,
    glossary,
    client,
    opts.dryRun,
    opts.verbose,
    batchSize,
    maxBatchChars,
    "markdown",
    batchConcurrency,
    translatePromptFormatToResponseFormat(opts.promptFormat),
    {
      relativePath: relPath,
      totalSegments: segments.length,
      segmentIndicesInDoc,
    },
    opts.debugFailed ? path.join(opts.cwd, config.cacheDir) : null
  );

  for (const [h, t] of map) {
    translations.set(h, t);
  }
  totals.inputTokens += inTok;
  totals.outputTokens += outTok;
  totals.costUsd = (totals.costUsd ?? 0) + cost;
  totals.segmentValidationFailures =
    (totals.segmentValidationFailures ?? 0) + segValFail;
  totals.individualSegmentTranslations =
    (totals.individualSegmentTranslations ?? 0) + indivSeg;

  for (const s of segments) {
    if (s.translatable && translations.has(s.hash)) {
      hitKeys.add(`${s.hash}|${locale}`);
    }
  }

  const merged: Segment[] = segments.map((s) => ({
    ...s,
    content: s.translatable
      ? (segmentTranslationText(translations.get(s.hash)) ?? s.content)
      : s.content,
  }));

  const v = await validateTranslation(segments, merged);
  if (!opts.dryRun && (!v.valid || v.warnings.length > 0)) {
    const parts = [...v.errors, ...v.warnings];
    console.warn(chalk.yellow(`  ⚠️  ${relPath} (${locale}): ${parts.join("; ")}`));
  }

  let output = md.reassemble(segments, translations);

  if (shouldRewriteFlatMarkdownLinks(config)) {
    const mo = config.documentation.markdownOutput;
    const docsRoot = mo.linkRewriteDocsRoot?.trim() || ".";
    const { i18nPrefix, depthPrefix } = computeFlatLinkRewritePrefixes(
      opts.cwd,
      docsRoot,
      config.documentation.outputDir
    );
    const parsed = matter(output);
    const newBody = rewriteDocLinksForFlatOutput(parsed.content, locale, i18nPrefix, depthPrefix, {
      cwd: opts.cwd,
      config,
      currentSourceRelPath: normalizeMarkdownRelPath(relPath),
      translatedMarkdownRelPaths,
    });
    output = matterStringify(newBody, parsed.data);
  }

  const moPost = config.documentation.markdownOutput.postProcessing;
  if (moPost && (moPost.languageListBlock || (moPost.regexAdjustments?.length ?? 0) > 0)) {
    const absSource = path.join(opts.cwd, relPath);
    const docStem = path.parse(relPath).name;
    output = applyMarkdownPostProcessing(output, {
      config,
      cwd: opts.cwd,
      relPath,
      locale,
      absSource,
      absTranslated: outPath,
      verbose: opts.verbose,
      docStem,
    });
  }

  if (config.documentation.addFrontmatter !== false && !opts.dryRun) {
    const translationModels = collectTranslationModelsFromSegments(segments, translations);
    output = addTranslationMetadata(
      output,
      sourceFileMtime,
      fileHash,
      locale,
      relPath,
      translationModels
    );
  }

  if (!opts.dryRun) {
    writeAtomicUtf8(outPath, output);
    if (cache && !opts.noCache) {
      await withCacheMutex(opts.cacheMutex, () => {
        cache.setFileStatus(fileTrackingKey, locale, fileHash);
        for (const s of segments) {
          if (!s.translatable) {
            continue;
          }
          const entry = translations.get(s.hash);
          if (entry === undefined || entry.modelUsed === undefined) {
            continue;
          }
          cache.setSegment(
            s.hash,
            locale,
            s.content,
            entry.text,
            entry.modelUsed,
            translationFilepathMeta,
            s.startLine ?? null
          );
        }
      });
    }
    totals.filesWritten = 1;
  } else {
    totals.filesWritten = 0;
  }

  const segmentsNew = translatableCount - segmentsCached;
  totals.segmentsCached = segmentsCached;
  totals.segmentsTranslated = segmentsNew;
  totals.filesProcessed = 1;
  logTranslateFileComplete(
    relPath,
    outPath,
    segmentsCached,
    segmentsNew,
    Date.now() - fileStartTime,
    totals.costUsd ?? 0
  );

  return { skipped: false, totals };
}

export async function translateJsonFile(
  absSource: string,
  relPath: string,
  locale: string,
  config: I18nDocTranslateConfig,
  cache: TranslationCache | null,
  client: OpenRouterClient | null,
  glossary: Glossary,
  opts: TranslateRunOptions,
  hitKeys: Set<string>
): Promise<{ skipped: boolean; totals: TranslateTotals }> {
  const totals: TranslateTotals = {
    filesWritten: 0,
    filesSkipped: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };

  const content = fs.readFileSync(absSource, "utf8");
  const fileHash = hashFileContent(content);
  /** Cwd-relative path for cache/UI and `file_tracking` (must match `resolveDocTrackingKeyToAbs` under project root). */
  const relPathFromCwd = path.relative(opts.cwd, absSource).split(path.sep).join("/");
  const outPath = resolveTranslatedOutputPath(config, opts.cwd, locale, relPath, "json");
  const blockIdx = opts.documentationBlockIndex ?? 0;
  /** Use cwd-relative path so cleanup resolves the same path as the real JSON source (json-root-only `relPath` would resolve to the wrong directory). */
  const fileTrackingKey = documentationFileTrackingKey(blockIdx, relPathFromCwd);

  if (opts.force && cache && !opts.noCache) {
    await withCacheMutex(opts.cacheMutex, () => cache.clearFile(fileTrackingKey, locale));
    if (opts.verbose) {
      console.log(
        chalk.yellow(`  🔄 Force mode: cleared file tracking for ${relPath} (${locale})`)
      );
    }
  }

  const cachedFileHashJson =
    cache && !opts.noCache
      ? await withCacheMutex(opts.cacheMutex, () => cache.getFileHash(fileTrackingKey, locale))
      : null;

  if (
    !opts.force &&
    !opts.forceUpdate &&
    cache &&
    !opts.noCache &&
    cachedFileHashJson === fileHash &&
    fs.existsSync(outPath)
  ) {
    if (opts.verbose) {
      console.log(chalk.gray(`⏭️  ${timestamp()} - ${locale}  ${relPath} (json, unchanged)`));
    }
    totals.filesSkipped = 1;
    totals.filesProcessed = 0;
    return { skipped: true, totals };
  }

  const fileStartTime = Date.now();
  const jx = new JsonExtractor();
  const segments = jx.extract(content, relPath);
  const translatableCount = segments.filter((s) => s.translatable).length;
  console.log(
    chalk.yellow(
      `📄 ${locale} ${relPath} (json): ${segments.length} segment(s) (${translatableCount} translatable)`
    )
  );
  const translations = new Map<string, DocSegmentTranslation>();
  const placeholderByIdJson = new Map<string, ProtectState>();
  const toBatch: Segment[] = [];
  const segmentIndicesInDoc: number[] = [];
  let segmentsCached = 0;

  for (let docIdx = 0; docIdx < segments.length; docIdx++) {
    const s = segments[docIdx]!;
    if (!s.translatable) {
      continue;
    }
    if (!opts.force && cache && !opts.noCache) {
      const hit = await withCacheMutex(opts.cacheMutex, () =>
        cache.getSegment(s.hash, locale, relPathFromCwd)
      );
      if (hit) {
        translations.set(s.hash, { text: hit });
        hitKeys.add(`${s.hash}|${locale}`);
        segmentsCached++;
        continue;
      }
    }
    const { text: protectedText, state: st } = protectSegmentForTranslation(
      s.content,
      glossary,
      locale,
      false
    );
    placeholderByIdJson.set(s.id, st);
    toBatch.push({ ...s, content: protectedText });
    segmentIndicesInDoc.push(docIdx);
  }

  const batchSize = config.batchSize ?? 20;
  const maxBatchChars = config.maxBatchChars ?? 4096;
  const batchConcurrencyJson = opts.batchConcurrency ?? config.batchConcurrency ?? 4;

  const {
    map,
    inTok,
    outTok,
    cost,
    segmentValidationFailures: segValFailJson,
    individualSegmentTranslations: indivSegJson,
  } = await translateSegmentsBatched(
    toBatch,
    placeholderByIdJson,
    new Map(),
    locale,
    glossary,
    client,
    opts.dryRun,
    opts.verbose,
    batchSize,
    maxBatchChars,
    "json",
    batchConcurrencyJson,
    translatePromptFormatToResponseFormat(opts.promptFormat),
    {
      relativePath: relPath,
      totalSegments: segments.length,
      segmentIndicesInDoc,
    }
  );

  for (const [h, t] of map) {
    translations.set(h, t);
  }
  totals.inputTokens += inTok;
  totals.outputTokens += outTok;
  totals.costUsd = (totals.costUsd ?? 0) + cost;
  totals.segmentValidationFailures =
    (totals.segmentValidationFailures ?? 0) + segValFailJson;
  totals.individualSegmentTranslations =
    (totals.individualSegmentTranslations ?? 0) + indivSegJson;

  for (const s of segments) {
    if (s.translatable && translations.has(s.hash)) {
      hitKeys.add(`${s.hash}|${locale}`);
    }
  }

  const output = jx.reassemble(segments, translations);

  if (!opts.dryRun) {
    writeAtomicUtf8(outPath, output);
    if (cache && !opts.noCache) {
      await withCacheMutex(opts.cacheMutex, () => {
        cache.setFileStatus(fileTrackingKey, locale, fileHash);
        for (const s of segments) {
          if (!s.translatable) {
            continue;
          }
          const entry = translations.get(s.hash);
          if (entry === undefined || entry.modelUsed === undefined) {
            continue;
          }
          cache.setSegment(
            s.hash,
            locale,
            s.content,
            entry.text,
            entry.modelUsed,
            relPathFromCwd,
            null
          );
        }
      });
    }
    totals.filesWritten = 1;
  }

  const segmentsNew = translatableCount - segmentsCached;
  totals.segmentsCached = segmentsCached;
  totals.segmentsTranslated = segmentsNew;
  totals.filesProcessed = 1;
  logTranslateFileComplete(
    relPath,
    outPath,
    segmentsCached,
    segmentsNew,
    Date.now() - fileStartTime,
    totals.costUsd ?? 0
  );

  return { skipped: false, totals };
}

/** Translate one SVG asset (`translate-svg`); uses `config.svg` for paths and optional `svg.svgExtractor`. */
export async function translateSvgAssetFile(
  absSource: string,
  relPathFromCwd: string,
  relPathFromSourceRoot: string,
  locale: string,
  config: I18nConfig,
  cache: TranslationCache | null,
  client: OpenRouterClient | null,
  glossary: Glossary,
  opts: TranslateRunOptions,
  hitKeys: Set<string>
): Promise<{ skipped: boolean; totals: TranslateTotals }> {
  const totals: TranslateTotals = {
    filesWritten: 0,
    filesSkipped: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };

  const cacheKey = svgAssetCacheFilepath(relPathFromCwd);
  const translationSvgFilepathMeta = svgTranslationFilepathMetadata(relPathFromCwd);
  const outPath = resolveSvgAssetOutputPath(
    config,
    opts.cwd,
    locale,
    relPathFromCwd,
    relPathFromSourceRoot
  );
  const forceLc = config.svg?.svgExtractor?.forceLowercase ?? false;
  const content = fs.readFileSync(absSource, "utf8");
  const fileHash = hashFileContent(content);

  if (opts.force && cache && !opts.noCache) {
    await withCacheMutex(opts.cacheMutex, () => cache.clearFile(cacheKey, locale));
    if (opts.verbose) {
      console.log(
        chalk.yellow(`  🔄 Force mode: cleared file tracking for ${relPathFromCwd} (${locale})`)
      );
    }
  }

  const cachedFileHashSvg =
    cache && !opts.noCache
      ? await withCacheMutex(opts.cacheMutex, () => cache.getFileHash(cacheKey, locale))
      : null;

  if (
    !opts.force &&
    !opts.forceUpdate &&
    cache &&
    !opts.noCache &&
    cachedFileHashSvg === fileHash &&
    fs.existsSync(outPath)
  ) {
    if (opts.verbose) {
      console.log(chalk.gray(`⏭️  ${timestamp()} - ${locale}  ${relPathFromCwd} (svg, unchanged)`));
    }
    totals.filesSkipped = 1;
    totals.filesProcessed = 0;
    return { skipped: true, totals };
  }

  const fileStartTime = Date.now();

  if (normalizeLocale(locale) === normalizeLocale(config.sourceLocale)) {
    if (!opts.dryRun) {
      ensureDirForFile(outPath);
      fs.copyFileSync(absSource, outPath);
      if (cache && !opts.noCache) {
        await withCacheMutex(opts.cacheMutex, () => {
          cache.setFileStatus(cacheKey, locale, fileHash);
        });
      }
      totals.filesWritten = 1;
    }
    totals.filesProcessed = 1;
    logTranslateFileComplete(relPathFromCwd, outPath, 0, 0, Date.now() - fileStartTime, 0);
    return { skipped: false, totals };
  }

  const sx = new SvgExtractor({ forceLowercase: forceLc });
  const segments = sx.extract(content, relPathFromCwd);
  const translatableCount = segments.filter((s) => s.translatable).length;
  console.log(
    chalk.yellow(
      `📄 ${locale} ${relPathFromCwd} (svg): ${segments.length} segment(s) (${translatableCount} translatable)`
    )
  );
  const translations = new Map<string, DocSegmentTranslation>();
  const placeholderByIdSvg = new Map<string, ProtectState>();
  const toBatch: Segment[] = [];
  const segmentIndicesInDoc: number[] = [];
  let segmentsCached = 0;

  for (let docIdx = 0; docIdx < segments.length; docIdx++) {
    const s = segments[docIdx]!;
    if (!s.translatable) {
      continue;
    }
    if (!opts.force && cache && !opts.noCache) {
      const hit = await withCacheMutex(opts.cacheMutex, () =>
        cache.getSegment(s.hash, locale, translationSvgFilepathMeta)
      );
      if (hit) {
        let t = hit;
        if (forceLc) {
          t = t.toLowerCase();
        }
        translations.set(s.hash, { text: t });
        hitKeys.add(`${s.hash}|${locale}`);
        segmentsCached++;
        continue;
      }
    }
    const { text: protectedText, state: st } = protectSegmentForTranslation(
      s.content,
      glossary,
      locale,
      false
    );
    placeholderByIdSvg.set(s.id, st);
    toBatch.push({ ...s, content: protectedText });
    segmentIndicesInDoc.push(docIdx);
  }

  const batchSize = config.batchSize ?? 20;
  const maxBatchChars = config.maxBatchChars ?? 4096;
  const batchConcurrencySvg = opts.batchConcurrency ?? config.batchConcurrency ?? 4;

  const {
    map,
    inTok,
    outTok,
    cost,
    segmentValidationFailures: segValFailSvg,
    individualSegmentTranslations: indivSegSvg,
  } = await translateSegmentsBatched(
    toBatch,
    placeholderByIdSvg,
    new Map(),
    locale,
    glossary,
    client,
    opts.dryRun,
    opts.verbose,
    batchSize,
    maxBatchChars,
    "svg",
    batchConcurrencySvg,
    translatePromptFormatToResponseFormat(opts.promptFormat),
    {
      relativePath: relPathFromCwd,
      totalSegments: segments.length,
      segmentIndicesInDoc,
    }
  );

  for (const [h, t] of map) {
    translations.set(h, t);
  }
  totals.inputTokens += inTok;
  totals.outputTokens += outTok;
  totals.costUsd = (totals.costUsd ?? 0) + cost;
  totals.segmentValidationFailures =
    (totals.segmentValidationFailures ?? 0) + segValFailSvg;
  totals.individualSegmentTranslations =
    (totals.individualSegmentTranslations ?? 0) + indivSegSvg;

  for (const s of segments) {
    if (s.translatable && translations.has(s.hash)) {
      hitKeys.add(`${s.hash}|${locale}`);
    }
  }

  const output = sx.reassemble(segments, translations);

  if (!opts.dryRun) {
    writeAtomicUtf8(outPath, output);
    if (cache && !opts.noCache) {
      await withCacheMutex(opts.cacheMutex, () => {
        cache.setFileStatus(cacheKey, locale, fileHash);
        for (const s of segments) {
          if (!s.translatable) {
            continue;
          }
          const entry = translations.get(s.hash);
          if (entry === undefined || entry.modelUsed === undefined) {
            continue;
          }
          cache.setSegment(
            s.hash,
            locale,
            s.content,
            entry.text,
            entry.modelUsed,
            translationSvgFilepathMeta,
            null
          );
        }
      });
    }
    totals.filesWritten = 1;
  }

  const segmentsNew = translatableCount - segmentsCached;
  totals.segmentsCached = segmentsCached;
  totals.segmentsTranslated = segmentsNew;
  totals.filesProcessed = 1;
  logTranslateFileComplete(
    relPathFromCwd,
    outPath,
    segmentsCached,
    segmentsNew,
    Date.now() - fileStartTime,
    totals.costUsd ?? 0
  );

  return { skipped: false, totals };
}

export function rewriteSourceMarkdownLanguageListBlocks(
  config: I18nDocTranslateConfig,
  opts: TranslateRunOptions,
  markdownFiles: string[]
): number {
  const langCfg = config.documentation.markdownOutput.postProcessing?.languageListBlock;
  if (!langCfg || opts.dryRun || !shouldRunMarkdown(opts, config)) {
    return 0;
  }

  let rewritten = 0;
  for (const relPath of markdownFiles) {
    if (!matchesPathFilter(relPath, opts.pathFilter)) {
      continue;
    }

    const absSource = path.join(opts.cwd, relPath);
    const input = fs.readFileSync(absSource, "utf8");
    const docStem = path.parse(relPath).name;
    const output = applyMarkdownLanguageListPostProcessing(input, {
      config,
      cwd: opts.cwd,
      relPath,
      absCurrentFile: absSource,
      verbose: opts.verbose,
      docStem,
      missingBlockTarget: "source document",
    });

    if (output === input) {
      continue;
    }

    writeAtomicUtf8(absSource, output);
    rewritten++;
    console.log(chalk.green(`✅ ${relPath}: Source language lists refreshed`));
  }

  return rewritten;
}

/** Run translate for all enabled kinds and locales. */
export async function runTranslate(
  config: I18nDocTranslateConfig,
  opts: TranslateRunOptions,
  files: {
    markdown: string[];
    json: string[];
  },
  jsonAbsRoot: string
): Promise<TranslateTotals> {
  const sum: TranslateTotals = {
    filesWritten: 0,
    filesSkipped: 0,
    filesProcessed: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    segmentsCached: 0,
    segmentsTranslated: 0,
    segmentValidationFailures: 0,
    individualSegmentTranslations: 0,
  };

  const cache: TranslationCache | null = opts.noCache
    ? null
    : new TranslationCache(path.join(opts.cwd, config.cacheDir));

  const needsApi =
    !opts.dryRun && (config.features.translateMarkdown || config.features.translateJSON);
  const client = needsApi ? new OpenRouterClient({ config }) : null;

  const glossaryUi = config.glossary?.uiGlossary
    ? path.join(opts.cwd, config.glossary.uiGlossary)
    : undefined;
  const glossaryUser = config.glossary?.userGlossary
    ? path.join(opts.cwd, config.glossary.userGlossary)
    : undefined;
  const hitKeys = new Set<string>();
  const markdownHitKeys = new Set<string>();
  const translatedMarkdownRelPaths = new Set(
    files.markdown.map((r) => normalizeMarkdownRelPath(r))
  );

  const locales = opts.locales.map((l) => normalizeLocale(l));
  const glossary = new Glossary(glossaryUi, glossaryUser, locales);

  const totalFileCount = files.markdown.length + files.json.length;
  const models = client?.getConfiguredModels() ?? [];

  const docDescription = config.documentation.description?.trim();
  const translatingHeadline = docDescription
    ? `🌐 ${docDescription}: translating ${totalFileCount} file(s) to ${locales.length} locale(s)\n`
    : `🌐 Translating ${totalFileCount} file(s) to ${locales.length} locale(s)\n`;

  // Header block
  console.log(
    chalk.gray(
      "\n\n___DOCUMENTATION Translation_____________________________________________________________________________\n\n"
    ) + chalk.bold(`\n${translatingHeadline}`)
  );
  printModelsTryInOrder(models);
  console.log(chalk.cyan(`Glossary terms: `) + chalk.magenta(`${glossary.size}`));
  console.log(
    chalk.cyan(`Output: `) +
      chalk.magenta(`${path.resolve(opts.cwd, config.documentation.outputDir)}`)
  );
  if (opts.logPath) {
    console.log(chalk.cyan(`Output log: `) + chalk.magenta(opts.logPath));
  }
  if (opts.dryRun) {
    console.log(chalk.yellow(`\n⚠️  Dry run mode - no changes will be made`));
  }
  console.log("");

  const localeConcurrency = Math.max(1, Math.floor(opts.concurrency ?? config.concurrency ?? 3));
  const batchConcurrencyEffective = Math.max(
    1,
    Math.floor(opts.batchConcurrency ?? config.batchConcurrency ?? 4)
  );

  console.log(chalk.cyan(`Locale concurrency: `) + chalk.magenta(`${localeConcurrency}`));
  console.log(
    chalk.cyan(`Parallel API calls per file: `) + chalk.magenta(`${batchConcurrencyEffective}`)
  );
  console.log(chalk.cyan(`Batch prompt format: `) + chalk.magenta(`${opts.promptFormat ?? "json-array"}`));
  console.log(
    chalk.cyan(`Markdown emphasis placeholders: `) +
      chalk.magenta(opts.emphasisPlaceholders ? "on" : "off")
  );
  console.log("");

  const wallStart = Date.now();
  const localeTimes: Array<{ locale: string; elapsedMs: number }> = [];

  const cacheMutex = cache && locales.length > 1 ? new AsyncMutex() : undefined;
  const runOpts: TranslateRunOptions = {
    ...opts,
    batchConcurrency: batchConcurrencyEffective,
    cacheMutex,
  };

  const processLocale = async (locale: string) => {
    const markdownHitKeysLocal = new Set<string>();
    const partial: TranslateTotals = {
      filesWritten: 0,
      filesSkipped: 0,
      filesProcessed: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      segmentsCached: 0,
      segmentsTranslated: 0,
      segmentValidationFailures: 0,
      individualSegmentTranslations: 0,
    };
    const localeStart = Date.now();

    if (shouldRunMarkdown(opts, config)) {
      for (const rel of files.markdown) {
        if (!matchesPathFilter(rel, opts.pathFilter)) {
          continue;
        }
        const abs = path.join(opts.cwd, rel);
        const { skipped, totals } = await translateMarkdownFile(
          abs,
          rel,
          locale,
          config,
          cache,
          client,
          glossary,
          runOpts,
          markdownHitKeysLocal,
          translatedMarkdownRelPaths
        );
        if (skipped) {
          partial.filesSkipped += totals.filesSkipped;
          partial.filesProcessed = (partial.filesProcessed ?? 0) + (totals.filesProcessed ?? 0);
        } else {
          partial.filesWritten += totals.filesWritten;
          partial.filesProcessed = (partial.filesProcessed ?? 0) + (totals.filesProcessed ?? 0);
          partial.inputTokens += totals.inputTokens;
          partial.outputTokens += totals.outputTokens;
          partial.costUsd = (partial.costUsd ?? 0) + (totals.costUsd ?? 0);
          partial.segmentsCached = (partial.segmentsCached ?? 0) + (totals.segmentsCached ?? 0);
          partial.segmentsTranslated =
            (partial.segmentsTranslated ?? 0) + (totals.segmentsTranslated ?? 0);
          partial.segmentValidationFailures =
            (partial.segmentValidationFailures ?? 0) + (totals.segmentValidationFailures ?? 0);
          partial.individualSegmentTranslations =
            (partial.individualSegmentTranslations ?? 0) +
            (totals.individualSegmentTranslations ?? 0);
        }
      }
    }

    if (shouldRunJson(opts, config)) {
      for (const rel of files.json) {
        const jsonRelFromProjectRoot = jsonFileProjectRelativePath(
          opts.cwd,
          jsonAbsRoot,
          rel
        );
        if (!matchesPathFilter(jsonRelFromProjectRoot, opts.pathFilter)) {
          continue;
        }
        const abs = path.join(jsonAbsRoot, rel);
        const { skipped, totals } = await translateJsonFile(
          abs,
          rel,
          locale,
          config,
          cache,
          client,
          glossary,
          runOpts,
          hitKeys
        );
        if (skipped) {
          partial.filesSkipped += totals.filesSkipped;
          partial.filesProcessed = (partial.filesProcessed ?? 0) + (totals.filesProcessed ?? 0);
        } else {
          partial.filesWritten += totals.filesWritten;
          partial.filesProcessed = (partial.filesProcessed ?? 0) + (totals.filesProcessed ?? 0);
          partial.inputTokens += totals.inputTokens;
          partial.outputTokens += totals.outputTokens;
          partial.costUsd = (partial.costUsd ?? 0) + (totals.costUsd ?? 0);
          partial.segmentsCached = (partial.segmentsCached ?? 0) + (totals.segmentsCached ?? 0);
          partial.segmentsTranslated =
            (partial.segmentsTranslated ?? 0) + (totals.segmentsTranslated ?? 0);
          partial.segmentValidationFailures =
            (partial.segmentValidationFailures ?? 0) + (totals.segmentValidationFailures ?? 0);
          partial.individualSegmentTranslations =
            (partial.individualSegmentTranslations ?? 0) +
            (totals.individualSegmentTranslations ?? 0);
        }
      }
    }

    const localeElapsed = Date.now() - localeStart;
    if (localeElapsed > 0) {
      console.log(chalk.gray(`   [${locale}] Time: ${formatElapsedMmSs(localeElapsed)}`));
    }

    return { locale, partial, markdownHitKeysLocal, localeElapsed };
  };

  const localeResults = await runMapWithConcurrency(locales, localeConcurrency, async (locale) =>
    processLocale(locale)
  );

  for (const r of localeResults) {
    sum.filesWritten += r.partial.filesWritten;
    sum.filesSkipped += r.partial.filesSkipped;
    sum.filesProcessed = (sum.filesProcessed ?? 0) + (r.partial.filesProcessed ?? 0);
    sum.inputTokens += r.partial.inputTokens;
    sum.outputTokens += r.partial.outputTokens;
    sum.costUsd = (sum.costUsd ?? 0) + (r.partial.costUsd ?? 0);
    sum.segmentsCached = (sum.segmentsCached ?? 0) + (r.partial.segmentsCached ?? 0);
    sum.segmentsTranslated = (sum.segmentsTranslated ?? 0) + (r.partial.segmentsTranslated ?? 0);
    sum.segmentValidationFailures =
      (sum.segmentValidationFailures ?? 0) + (r.partial.segmentValidationFailures ?? 0);
    sum.individualSegmentTranslations =
      (sum.individualSegmentTranslations ?? 0) + (r.partial.individualSegmentTranslations ?? 0);
    localeTimes.push({
      locale: r.locale,
      elapsedMs: r.localeElapsed,
    });
    for (const k of r.markdownHitKeysLocal) {
      markdownHitKeys.add(k);
    }
  }

  if (cache) {
    const markdownScopeRel = shouldRunMarkdown(opts, config)
      ? files.markdown.filter((r) => matchesPathFilter(r, opts.pathFilter))
      : null;
    const jsonScopeRel = shouldRunJson(opts, config)
      ? files.json
          .filter((r) =>
            matchesPathFilter(jsonFileProjectRelativePath(opts.cwd, jsonAbsRoot, r), opts.pathFilter)
          )
          .map((r) => path.relative(opts.cwd, path.join(jsonAbsRoot, r)).split(path.sep).join("/"))
      : null;
    if (markdownScopeRel && markdownScopeRel.length > 0 && markdownHitKeys.size > 0) {
      cache.resetLastHitAtForUnhitMarkdownInScope(markdownHitKeys, markdownScopeRel);
    }
    if (jsonScopeRel && jsonScopeRel.length > 0 && hitKeys.size > 0) {
      cache.resetLastHitAtForUnhitJsonInScope(hitKeys, jsonScopeRel);
    }
  }

  cache?.close();

  rewriteSourceMarkdownLanguageListBlocks(config, runOpts, files.markdown);

  const wallElapsed = Date.now() - wallStart;

  // Summary block (aligned with reference translate-docs)
  console.log(chalk.bold.green("\n✅ Translation complete!\n"));
  console.log(chalk.bold("📊 Summary:"));
  console.log(`   Total elapsed time:    ${formatElapsedMmSs(wallElapsed)}`);
  console.log(`   Total files processed: ${sum.filesProcessed ?? 0}`);
  console.log(`   Total files skipped:   ${sum.filesSkipped}`);
  console.log(
    `   Segments from cache:   ${sum.segmentsCached ?? 0}${formatSegmentCacheHitSuffix(
      sum.segmentsCached,
      sum.segmentsTranslated
    )}`
  );
  console.log(`   Segments translated:   ${sum.segmentsTranslated ?? 0}`);
  console.log(`   Segment translation failures: ${sum.segmentValidationFailures ?? 0}`);
  console.log(`   Individual segment translations: ${sum.individualSegmentTranslations ?? 0}`);
  console.log(`   Total tokens used:     ${(sum.inputTokens + sum.outputTokens).toLocaleString()}`);
  if (opts.dryRun && (sum.filesWritten ?? 0) === 0 && (sum.filesProcessed ?? 0) > 0) {
    console.log(`   Files written:         0 (dry-run)`);
  } else if ((sum.filesWritten ?? 0) > 0) {
    console.log(`   Files written:         ${sum.filesWritten}`);
  }
  const cost = sum.costUsd ?? 0;
  const segNew = sum.segmentsTranslated ?? 0;
  if (segNew > 0) {
    if (cost > 0) {
      console.log(`   Total cost:            $${cost.toFixed(6)}`);
    } else {
      console.log(`   Total cost:            $0.0000 (cost data not available from API)`);
    }
  } else {
    console.log(`   Total cost:            $0.0000 (all segments from cache)`);
  }
  console.log("");

  return sum;
}
