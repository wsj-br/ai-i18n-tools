import fs from "fs";
import path from "path";
import matter from "gray-matter";
import chalk from "chalk";
import type { I18nConfig, Segment } from "../core/types.js";
import { BatchTranslationError } from "../core/types.js";
import { timestamp, formatElapsedMmSs, printModelsTryInOrder } from "./format.js";
import { TranslationCache } from "../core/cache.js";
import { MarkdownExtractor } from "../extractors/markdown-extractor.js";
import { JsonExtractor } from "../extractors/json-extractor.js";
import { SvgExtractor } from "../extractors/svg-extractor.js";
import { PlaceholderHandler } from "../processors/placeholder-handler.js";
import { splitTranslatableIntoBatches } from "../processors/batch-processor.js";
import { Glossary } from "../glossary/glossary.js";
import { OpenRouterClient } from "../api/openrouter.js";
import { validateDocTranslatePair, validateTranslation } from "../processors/validator.js";
import {
  computeFlatLinkRewritePrefixes,
  rewriteDocLinksForFlatOutput,
} from "../processors/flat-link-rewrite.js";
import {
  shouldRewriteFlatMarkdownLinks,
} from "../core/output-paths.js";
import { resolveSvgAssetOutputPath, svgAssetCacheFilepath } from "../core/svg-asset-paths.js";
import { ensureDirForFile, hashFileContent, resolveTranslatedOutputPath, writeAtomicUtf8 } from "./helpers.js";
import { normalizeLocale } from "../core/config.js";
import type { DocumentPromptContentType } from "../core/prompt-builder.js";
import { runMapWithConcurrency, AsyncSemaphore, AsyncMutex } from "../utils/concurrency.js";

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
}

type ProtectState = ReturnType<PlaceholderHandler["protectForTranslation"]>;

function segmentOriginalContent(s: Segment, originalContentByHash: Map<string, string>): Segment {
  return { ...s, content: originalContentByHash.get(s.hash) ?? s.content };
}

/** Same style as {@link OpenRouterClient} model switch warnings; used when post-restore quality checks fail. */
function warnDocQualityModelSwitch(
  locale: string,
  relativePath: string | undefined,
  failedModel: string,
  nextModel: string,
  detail: string
): void {
  const loc = relativePath != null ? `${locale} ${relativePath}` : locale;
  console.warn(
    chalk.yellow(
      `  ⚠️  ${loc}: ${failedModel} output failed quality check (${detail}). Trying ${nextModel}…`
    )
  );
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

export function shouldRunMarkdown(opts: TranslateRunOptions, config: I18nConfig): boolean {
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

export function shouldRunJson(opts: TranslateRunOptions, config: I18nConfig): boolean {
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
  relativePath: string
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
  return matter.stringify(body, fm);
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
  docLog?: {
    relativePath: string;
    totalSegments: number;
    /** For each entry in `batchable`, index into the full extracted segment list (0-based). */
    segmentIndicesInDoc: number[];
  }
): Promise<{ map: Map<string, string>; inTok: number; outTok: number; cost: number }> {
  const out = new Map<string, string>();
  let inTok = 0;
  let outTok = 0;
  let cost = 0;

  const batches = splitTranslatableIntoBatches(batchable, { batchSize, maxBatchChars });
  if (batches.length === 0) {
    return { map: out, inTok, outTok, cost };
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
    partial: Map<string, string>;
    inTok: number;
    outTok: number;
    cost: number;
  };

  const processBatch = async (bi: number): Promise<BatchProcessResult> => {
    const partial = new Map<string, string>();
    let localIn = 0;
    let localOut = 0;
    let localCost = 0;
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
        partial.set(s.hash, s.content);
      }
      return { partial, inTok: localIn, outTok: localOut, cost: localCost };
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
          const restored = st ? ph.restoreAfterTranslation(raw, st) : raw;
          partial.set(s.hash, restored);
        }
        logBatchSuccess(res);
      } catch (e) {
        if (e instanceof BatchTranslationError && client) {
          if (verbose) {
            console.warn(
              chalk.yellow(
                `⚠️  ${locale} ${docLog?.relativePath ?? "?"}: batch failed (expected ${e.expected} <t> segments, got ${e.received}); falling back to single-segment API calls`
              )
            );
          }
          const ph = new PlaceholderHandler();
          for (const s of batch) {
            const st = placeholderById.get(s.id);
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
            const restored = st ? ph.restoreAfterTranslation(single.content, st) : single.content;
            partial.set(s.hash, restored);
          }
        } else {
          throw e;
        }
      }
      return { partial, inTok: localIn, outTok: localOut, cost: localCost };
    }

    const ph = new PlaceholderHandler();
    const models = client.getConfiguredModels();

    try {
      let startModelIndex = 0;
      let finished = false;
      while (!finished && startModelIndex < models.length) {
        const res = await client.translateDocumentBatch(batch, locale, hints, {
          contentType,
          docLogContext: docLog ? { relativePath: docLog.relativePath } : undefined,
          startModelIndex,
        });
        localIn += res.usage.inputTokens;
        localOut += res.usage.outputTokens;
        localCost += res.cost ?? 0;

        const qualityErrors: string[] = [];
        const batchPartial = new Map<string, string>();
        for (let i = 0; i < batch.length; i++) {
          const s = batch[i]!;
          const raw = res.translations.get(i);
          if (raw === undefined) {
            throw new Error(`Missing translation for batch index ${i}`);
          }
          const st = placeholderById.get(s.id);
          const restored = st ? ph.restoreAfterTranslation(raw, st) : raw;
          const origSeg = segmentOriginalContent(s, originalContentByHash);
          const v = validateDocTranslatePair(origSeg, restored);
          if (!v.ok) {
            qualityErrors.push(...v.errors);
          }
          batchPartial.set(s.hash, restored);
        }

        if (qualityErrors.length === 0) {
          for (const [h, t] of batchPartial) {
            partial.set(h, t);
          }
          logBatchSuccess(res);
          finished = true;
        } else {
          const nextStart = models.indexOf(res.model) + 1;
          if (nextStart >= models.length) {
            throw new Error(
              `Doc translation quality failed (${docLog?.relativePath ?? "?"}): ${qualityErrors.join("; ")}`
            );
          }
          warnDocQualityModelSwitch(
            locale,
            docLog?.relativePath,
            res.model,
            models[nextStart]!,
            qualityErrors.join("; ")
          );
          startModelIndex = nextStart;
        }
      }
    } catch (e) {
      if (e instanceof BatchTranslationError && client) {
        if (verbose) {
          console.warn(
            chalk.yellow(
              `⚠️  ${locale} ${docLog?.relativePath ?? "?"}: batch failed (expected ${e.expected} <t> segments, got ${e.received}); falling back to single-segment API calls`
            )
          );
        }
        for (const s of batch) {
          const st = placeholderById.get(s.id);
          const origSeg = segmentOriginalContent(s, originalContentByHash);
          let startIdx = 0;
          while (startIdx < models.length) {
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
            const restored = st ? ph.restoreAfterTranslation(single.content, st) : single.content;
            const v = validateDocTranslatePair(origSeg, restored);
            if (v.ok) {
              partial.set(s.hash, restored);
              break;
            }
            const nextIdx = models.indexOf(single.model) + 1;
            if (nextIdx >= models.length) {
              throw new Error(
                `Doc translation quality failed (${docLog?.relativePath ?? "?"}): ${v.errors.join("; ")}`
              );
            }
            warnDocQualityModelSwitch(
              locale,
              docLog?.relativePath,
              single.model,
              models[nextIdx]!,
              v.errors.join("; ")
            );
            startIdx = nextIdx;
          }
        }
      } else {
        throw e;
      }
    }
    return { partial, inTok: localIn, outTok: localOut, cost: localCost };
  };

  if (sem) {
    const results = await Promise.all(
      batches.map((_, bi) => sem.use(() => processBatch(bi)))
    );
    for (const r of results) {
      inTok += r.inTok;
      outTok += r.outTok;
      cost += r.cost;
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
      for (const [h, t] of r.partial) {
        out.set(h, t);
      }
    }
  }

  return { map: out, inTok, outTok, cost };
}

export async function translateMarkdownFile(
  absSource: string,
  relPath: string,
  locale: string,
  config: I18nConfig,
  cache: TranslationCache | null,
  client: OpenRouterClient | null,
  glossary: Glossary,
  opts: TranslateRunOptions,
  hitKeys: Set<string>,
  markdownBasenames: string[]
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
  const outPath = resolveTranslatedOutputPath(config, opts.cwd, locale, relPath, "markdown");

  if (opts.force && cache && !opts.noCache) {
    await withCacheMutex(opts.cacheMutex, () => cache.clearFile(relPath, locale));
    if (opts.verbose) {
      console.log(
        chalk.yellow(`  🔄 Force mode: cleared file tracking for ${relPath} (${locale})`)
      );
    }
  }

  const cachedFileHash =
    cache && !opts.noCache
      ? await withCacheMutex(opts.cacheMutex, () => cache.getFileHash(relPath, locale))
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
      console.log(
        chalk.gray(`⏭️  ${timestamp()} - ${locale}  ${relPath} (unchanged)`)
      );
    }
    totals.filesSkipped = 1;
    totals.filesProcessed = 0;
    return { skipped: true, totals };
  }

  const fileStartTime = Date.now();
  const md = new MarkdownExtractor();
  const segments = md.extract(content, relPath);
  const translatableCount = segments.filter((s) => s.translatable).length;
  console.log(
    chalk.yellow(
      `🔃 ${locale} ${relPath}: ${segments.length} segment(s) (${translatableCount} translatable)`
    )
  );
  const translations = new Map<string, string>();
  const placeholderById = new Map<string, ProtectState>();
  const originalContentByHash = new Map<string, string>();
  const toBatch: Segment[] = [];
  const segmentIndicesInDoc: number[] = [];

  const ph = new PlaceholderHandler();
  let segmentsCached = 0;

  for (let docIdx = 0; docIdx < segments.length; docIdx++) {
    const s = segments[docIdx]!;
    if (!s.translatable) {
      continue;
    }
    if (!opts.force && cache && !opts.noCache) {
      const hit = await withCacheMutex(opts.cacheMutex, () =>
        cache.getSegment(s.hash, locale, relPath, s.startLine)
      );
      if (hit) {
        translations.set(s.hash, hit);
        hitKeys.add(`${s.hash}|${locale}`);
        segmentsCached++;
        continue;
      }
    }
    originalContentByHash.set(s.hash, s.content);
    const st = ph.protectForTranslation(s.content);
    placeholderById.set(s.id, st);
    toBatch.push({ ...s, content: st.text });
    segmentIndicesInDoc.push(docIdx);
  }

  const batchSize = config.batchSize ?? 20;
  const maxBatchChars = config.maxBatchChars ?? 4096;
  const batchConcurrency = opts.batchConcurrency ?? config.batchConcurrency ?? 4;

  const { map, inTok, outTok, cost } = await translateSegmentsBatched(
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

  for (const s of segments) {
    if (s.translatable && translations.has(s.hash)) {
      hitKeys.add(`${s.hash}|${locale}`);
    }
  }

  const merged: Segment[] = segments.map((s) => ({
    ...s,
    content: s.translatable ? (translations.get(s.hash) ?? s.content) : s.content,
  }));

  const v = validateTranslation(segments, merged);
  if (!v.valid && !opts.dryRun) {
    console.warn(
      chalk.yellow(`  ⚠️  ${relPath} (${locale}): ${v.errors.join("; ")}`)
    );
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
    const currentBasename = path.basename(relPath);
    const parsed = matter(output);
    const newBody = rewriteDocLinksForFlatOutput(
      parsed.content,
      locale,
      i18nPrefix,
      depthPrefix,
      markdownBasenames,
      currentBasename
    );
    output = matter.stringify(newBody, parsed.data);
  }

  const injectMeta = config.documentation.injectTranslationMetadata !== false;
  if (injectMeta && !opts.dryRun) {
    output = addTranslationMetadata(output, sourceFileMtime, fileHash, locale, relPath);
  }

  if (!opts.dryRun) {
    writeAtomicUtf8(outPath, output);
    if (cache && !opts.noCache) {
      await withCacheMutex(opts.cacheMutex, () => {
        cache.setFileStatus(relPath, locale, fileHash);
        const model = client?.getConfiguredModels()[0] ?? "cache-only";
        for (const s of segments) {
          if (!s.translatable) {
            continue;
          }
          const t = translations.get(s.hash);
          if (t === undefined) {
            continue;
          }
          cache.setSegment(s.hash, locale, s.content, t, model, relPath, s.startLine ?? null);
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

  const content = fs.readFileSync(absSource, "utf8");
  const fileHash = hashFileContent(content);
  /** Cwd-relative path for cache/UI (e.g. `docs-site/i18n/en/code.json`); `relPath` stays json-root-relative for output + file_tracking. */
  const relPathFromCwd = path.relative(opts.cwd, absSource).split(path.sep).join("/");
  const outPath = resolveTranslatedOutputPath(config, opts.cwd, locale, relPath, "json");

  if (opts.force && cache && !opts.noCache) {
    await withCacheMutex(opts.cacheMutex, () => cache.clearFile(relPath, locale));
    if (opts.verbose) {
      console.log(
        chalk.yellow(`  🔄 Force mode: cleared file tracking for ${relPath} (${locale})`)
      );
    }
  }

  const cachedFileHashJson =
    cache && !opts.noCache
      ? await withCacheMutex(opts.cacheMutex, () => cache.getFileHash(relPath, locale))
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
      console.log(
        chalk.gray(`⏭️  ${timestamp()} - ${locale}  ${relPath} (json, unchanged)`)
      );
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
      `🔃 ${locale} ${relPath} (json): ${segments.length} segment(s) (${translatableCount} translatable)`
    )
  );
  const translations = new Map<string, string>();
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
        cache.getSegment(s.hash, locale, relPath)
      );
      if (hit) {
        translations.set(s.hash, hit);
        hitKeys.add(`${s.hash}|${locale}`);
        segmentsCached++;
        continue;
      }
    }
    toBatch.push({ ...s });
    segmentIndicesInDoc.push(docIdx);
  }

  const emptyPh = new Map<string, ProtectState>();
  const batchSize = config.batchSize ?? 20;
  const maxBatchChars = config.maxBatchChars ?? 4096;
  const batchConcurrencyJson = opts.batchConcurrency ?? config.batchConcurrency ?? 4;

  const { map, inTok, outTok, cost } = await translateSegmentsBatched(
    toBatch,
    emptyPh,
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
        cache.setFileStatus(relPath, locale, fileHash);
        const model = client?.getConfiguredModels()[0] ?? "cache-only";
        for (const s of segments) {
          if (!s.translatable) {
            continue;
          }
          const t = translations.get(s.hash);
          if (t === undefined) {
            continue;
          }
          cache.setSegment(s.hash, locale, s.content, t, model, relPathFromCwd, null);
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
      console.log(
        chalk.gray(`⏭️  ${timestamp()} - ${locale}  ${relPathFromCwd} (svg, unchanged)`)
      );
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
      `🔃 ${locale} ${relPathFromCwd} (svg): ${segments.length} segment(s) (${translatableCount} translatable)`
    )
  );
  const translations = new Map<string, string>();
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
        cache.getSegment(s.hash, locale, cacheKey)
      );
      if (hit) {
        let t = hit;
        if (forceLc) {
          t = t.toLowerCase();
        }
        translations.set(s.hash, t);
        hitKeys.add(`${s.hash}|${locale}`);
        segmentsCached++;
        continue;
      }
    }
    toBatch.push({ ...s });
    segmentIndicesInDoc.push(docIdx);
  }

  const emptyPh = new Map<string, ProtectState>();
  const batchSize = config.batchSize ?? 20;
  const maxBatchChars = config.maxBatchChars ?? 4096;
  const batchConcurrencySvg = opts.batchConcurrency ?? config.batchConcurrency ?? 4;

  const { map, inTok, outTok, cost } = await translateSegmentsBatched(
    toBatch,
    emptyPh,
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
        const model = client?.getConfiguredModels()[0] ?? "cache-only";
        for (const s of segments) {
          if (!s.translatable) {
            continue;
          }
          const t = translations.get(s.hash);
          if (t === undefined) {
            continue;
          }
          cache.setSegment(s.hash, locale, s.content, t, model, cacheKey, null);
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

/** Run translate for all enabled kinds and locales. */
export async function runTranslate(
  config: I18nConfig,
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
  };

  const cache: TranslationCache | null = opts.noCache
    ? null
    : new TranslationCache(path.join(opts.cwd, config.documentation.cacheDir));

  const needsApi =
    !opts.dryRun &&
    (config.features.translateMarkdown || config.features.translateJSON);
  const client = needsApi ? new OpenRouterClient({ config }) : null;

  const glossaryUi = config.glossary?.uiGlossary
    ? path.join(opts.cwd, config.glossary.uiGlossary)
    : undefined;
  const glossaryUser = config.glossary?.userGlossary
    ? path.join(opts.cwd, config.glossary.userGlossary)
    : undefined;
  const hitKeys = new Set<string>();
  const markdownHitKeys = new Set<string>();
  const markdownBasenames = files.markdown.map((r) => path.basename(r));

  const locales = opts.locales.map((l) => normalizeLocale(l));
  const glossary = new Glossary(glossaryUi, glossaryUser, locales);

  const totalFileCount = files.markdown.length + files.json.length;
  const models = client?.getConfiguredModels() ?? [];

  // Header block
  console.log(
    chalk.gray("\n\n___DOCUMENTATION Translation_____________________________________________________________________________\n\n") +
    chalk.bold(
      `\n🌐 Translating ${totalFileCount} file(s) to ${locales.length} locale(s)\n`
    )
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

  const localeConcurrency = Math.max(
    1,
    Math.floor(opts.concurrency ?? config.concurrency ?? 3)
  );
  const batchConcurrencyEffective = Math.max(
    1,
    Math.floor(opts.batchConcurrency ?? config.batchConcurrency ?? 4)
  );

  console.log(
    chalk.cyan(`Locale concurrency: `) + chalk.magenta(`${localeConcurrency}`)
  );
  console.log(
    chalk.cyan(`Parallel API calls per file: `) +
      chalk.magenta(`${batchConcurrencyEffective}`)
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
          markdownBasenames
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
          partial.segmentsTranslated = (partial.segmentsTranslated ?? 0) + (totals.segmentsTranslated ?? 0);
        }
      }
    }

    if (shouldRunJson(opts, config)) {
      for (const rel of files.json) {
        if (!matchesPathFilter(rel, opts.pathFilter)) {
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
          partial.segmentsTranslated = (partial.segmentsTranslated ?? 0) + (totals.segmentsTranslated ?? 0);
        }
      }
    }

    const localeElapsed = Date.now() - localeStart;
    if (localeElapsed > 0) {
      console.log(chalk.gray(`   [${locale}] Time: ${formatElapsedMmSs(localeElapsed)}`));
    }

    return { locale, partial, markdownHitKeysLocal, localeElapsed };
  };

  const localeResults = await runMapWithConcurrency(
    locales,
    localeConcurrency,
    async (locale) => processLocale(locale)
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
    localeTimes.push({
      locale: r.locale,
      elapsedMs: r.localeElapsed,
    });
    for (const k of r.markdownHitKeysLocal) {
      markdownHitKeys.add(k);
    }
  }

  if (cache && (markdownHitKeys.size > 0 || hitKeys.size > 0)) {
    await cache.resetLastHitAtForUnhit([...markdownHitKeys], [...hitKeys]);
  }

  cache?.close();

  const wallElapsed = Date.now() - wallStart;

  // Summary block (aligned with reference translate-docs)
  console.log(chalk.bold.green("\n✅ Translation complete!\n"));
  console.log(chalk.bold("📊 Summary:"));
  console.log(`   Total elapsed time:    ${formatElapsedMmSs(wallElapsed)}`);
  console.log(`   Total files processed: ${sum.filesProcessed ?? 0}`);
  console.log(`   Total files skipped:   ${sum.filesSkipped}`);
  console.log(`   Segments from cache:   ${sum.segmentsCached ?? 0}`);
  console.log(`   Segments translated:   ${sum.segmentsTranslated ?? 0}`);
  console.log(
    `   Total tokens used:     ${(sum.inputTokens + sum.outputTokens).toLocaleString()}`
  );
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
