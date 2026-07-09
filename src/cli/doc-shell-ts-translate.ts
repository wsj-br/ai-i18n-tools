import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nDocTranslateConfig, TranslationFailureInsert } from "../core/types.js";
import type { Segment } from "../core/types.js";
import { TranslationCache } from "../core/cache.js";
import { Glossary } from "../glossary/glossary.js";
import { LlmClient } from "../api/llm-client.js";
import {
  protectSegmentForTranslation,
  translatePromptFormatToResponseFormat,
  translateSegmentsBatched,
  type DocSegmentTranslation,
  type TranslateRunOptions,
  type TranslateTotals,
} from "./doc-translate.js";
import { hashFileContent, translatedOutputIsCurrent, writeAtomicUtf8 } from "./helpers.js";
import { throwIfAbortSignal } from "../utils/run-interrupt.js";
import { AsyncMutex } from "../utils/concurrency.js";
import {
  applyTsLiteralTranslations,
  extractTsObjectLiteralStrings,
  type TsLiteralSpan,
  type TsObjectLiteralPolicy,
} from "../extractors/ts-object-literal-extractor.js";
import { t } from "../i18n/index.js";

type ProtectState = ReturnType<typeof protectSegmentForTranslation>["state"];

async function withCacheMutex<T>(mutex: AsyncMutex | undefined, fn: () => T): Promise<T> {
  if (!mutex) {
    return fn();
  }
  return mutex.runExclusive(async () => fn());
}

type FailureTracker = {
  clearSegmentFailures: (sourceHash: string, targetLocale: string) => Promise<void>;
  addSegmentFailures: (rows: TranslationFailureInsert[]) => Promise<void>;
};

function timestamp(): string {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export interface TranslateTsObjectLiteralFileOptions {
  absSource: string;
  relPathFromCwd: string;
  locale: string;
  config: I18nDocTranslateConfig;
  cache: TranslationCache | null;
  client: LlmClient | null;
  glossary: Glossary;
  opts: TranslateRunOptions;
  fileTrackingKey: string;
  outPath: string;
  policy: TsObjectLiteralPolicy;
  metaTranslatableKeys?: string[];
  contentTypeLabel: string;
  hitKeys?: Set<string>;
}

export async function translateTsObjectLiteralFile(
  options: TranslateTsObjectLiteralFileOptions
): Promise<{ skipped: boolean; totals: TranslateTotals }> {
  const {
    absSource,
    relPathFromCwd,
    locale,
    config,
    cache,
    client,
    glossary,
    opts,
    fileTrackingKey,
    outPath,
    policy,
    metaTranslatableKeys,
    contentTypeLabel,
    hitKeys,
  } = options;

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

  if (opts.force && cache && !opts.noCache) {
    await withCacheMutex(opts.cacheMutex, () => cache.clearFile(fileTrackingKey, locale));
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
    translatedOutputIsCurrent(outPath, sourceFileMtime)
  ) {
    if (opts.verbose) {
      console.log(
        chalk.gray(
          t("⏭️  {{ts}} - {{locale}}  {{path}} ({{label}}, unchanged)", {
            ts: timestamp(),
            locale,
            path: relPathFromCwd,
            label: contentTypeLabel,
          })
        )
      );
    }
    totals.filesSkipped = 1;
    totals.filesProcessed = 0;
    return { skipped: true, totals };
  }

  const { segments, spans } = extractTsObjectLiteralStrings(content, relPathFromCwd, policy, {
    metaTranslatableKeys,
  });

  const translatable = segments.filter((s) => s.translatable);
  if (translatable.length === 0) {
    if (opts.verbose) {
      console.log(
        chalk.yellow(
          t("⚠️  {{locale}} {{path}} ({{label}}): no translatable literals, skipping", {
            locale,
            path: relPathFromCwd,
            label: contentTypeLabel,
          })
        )
      );
    }
    totals.filesSkipped = 1;
    totals.filesProcessed = 0;
    return { skipped: true, totals };
  }

  console.log(
    chalk.yellow(
      t("📄 {{locale}} {{path}} ({{label}}): {{count}} segment(s) ({{translatable}} translatable)", {
        locale,
        path: relPathFromCwd,
        label: contentTypeLabel,
        count: segments.length,
        translatable: translatable.length,
      })
    )
  );

  const translations = new Map<string, DocSegmentTranslation>();
  const placeholderById = new Map<string, ProtectState>();
  const toBatch: Segment[] = [];
  const segmentIndicesInDoc: number[] = [];
  const clearedFailureHashes = new Set<string>();
  const failureTracker: FailureTracker | undefined =
    !opts.dryRun && cache && !opts.noCache
      ? {
          clearSegmentFailures: async (sourceHash: string, targetLocale: string) => {
            await withCacheMutex(opts.cacheMutex, () =>
              cache.clearSegmentFailures(sourceHash, targetLocale)
            );
          },
          addSegmentFailures: async (rows: TranslationFailureInsert[]) => {
            await withCacheMutex(opts.cacheMutex, () => cache.addSegmentFailures(rows));
          },
        }
      : undefined;
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
        hitKeys?.add(`${s.hash}|${locale}`);
        segmentsCached++;
        if (failureTracker) {
          await failureTracker.clearSegmentFailures(s.hash, locale);
        }
        continue;
      }
    }
    if (failureTracker && !clearedFailureHashes.has(s.hash)) {
      await failureTracker.clearSegmentFailures(s.hash, locale);
      clearedFailureHashes.add(s.hash);
    }
    const { text: protectedText, state: st } = protectSegmentForTranslation(
      s.content,
      glossary,
      locale,
      false
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
    segmentValidationFailures,
    individualSegmentTranslations,
  } = await translateSegmentsBatched(
    toBatch,
    placeholderById,
    new Map(),
    locale,
    glossary,
    client,
    opts.dryRun,
    opts.verbose,
    batchSize,
    maxBatchChars,
    "json",
    batchConcurrency,
    translatePromptFormatToResponseFormat(opts.promptFormat),
    {
      relativePath: relPathFromCwd,
      totalSegments: segments.length,
      segmentIndicesInDoc,
    },
    undefined,
    failureTracker,
    { filepath: relPathFromCwd },
    undefined,
    opts.abortSignal
  );

  for (const [h, tr] of map) {
    translations.set(h, tr);
  }
  totals.inputTokens += inTok;
  totals.outputTokens += outTok;
  totals.costUsd = (totals.costUsd ?? 0) + cost;
  totals.segmentValidationFailures = (totals.segmentValidationFailures ?? 0) + segmentValidationFailures;
  totals.individualSegmentTranslations =
    (totals.individualSegmentTranslations ?? 0) + individualSegmentTranslations;

  for (const s of segments) {
    if (s.translatable && translations.has(s.hash)) {
      hitKeys?.add(`${s.hash}|${locale}`);
    }
  }

  const translationByHash = new Map<string, string>();
  for (const s of segments) {
    if (!s.translatable) {
      continue;
    }
    const entry = translations.get(s.hash);
    if (entry) {
      translationByHash.set(s.hash, entry.text);
    }
  }

  const output = applyTsLiteralTranslations(content, spans, translationByHash);

  if (!opts.dryRun) {
    throwIfAbortSignal(opts.abortSignal);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
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

  const segmentsNew = translatable.length - segmentsCached;
  totals.segmentsCached = segmentsCached;
  totals.segmentsTranslated = segmentsNew;
  totals.filesProcessed = 1;
  return { skipped: false, totals };
}

export type { TsLiteralSpan };
