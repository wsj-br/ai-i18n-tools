import fs from "fs";
import path from "path";
import { minimatch } from "minimatch";
import chalk from "chalk";
import type { I18nDocTranslateConfig, JsonKeyPolicyConfig, TranslationFailureInsert } from "../core/types.js";
import { fumadocsMetaFileTrackingKey } from "../core/doc-file-tracking.js";
import { matchesDocsOutputStylePreset } from "../core/docs-output-normalize.js";
import { isFumadocsDotLocaleSuffixedMeta } from "../core/fumadocs-dot-source-filter.js";
import { NestedJsonExtractor } from "../extractors/nested-json-extractor.js";
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
import { hashFileContent, resolveTranslatedOutputPath, translatedOutputIsCurrent, writeAtomicUtf8 } from "./helpers.js";
import { throwIfAbortSignal } from "../utils/run-interrupt.js";
import { AsyncMutex } from "../utils/concurrency.js";
import { t } from "../i18n/index.js";

const META_FILENAME = "meta.json";
const DEFAULT_META_KEYS = ["title", "description"];

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

function walkForMetaFiles(
  dir: string,
  projectRoot: string,
  out: string[],
  matches: (relPath: string, filename: string) => boolean
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkForMetaFiles(full, projectRoot, out, matches);
    } else if (ent.isFile()) {
      const rel = path.relative(projectRoot, full).split(path.sep).join("/");
      if (matches(rel, ent.name)) {
        out.push(rel);
      }
    }
  }
}

function metaKeyPolicy(config: I18nDocTranslateConfig): JsonKeyPolicyConfig {
  const keys = config.doc.fumadocsMetaTranslatableKeys ?? DEFAULT_META_KEYS;
  return {
    mode: "allowlist",
    translateKeys: keys,
    skipKeys: [],
  };
}

export function collectFumadocsMetaFiles(
  projectRoot: string,
  config: I18nDocTranslateConfig
): string[] {
  if (!matchesDocsOutputStylePreset(config.doc.docsOutput, "fumadocs")) {
    return [];
  }
  const globCfg = config.doc.fumadocsMetaGlob;
  const out: string[] = [];
  if (globCfg) {
    const globs = Array.isArray(globCfg) ? globCfg : [globCfg];
    walkForMetaFiles(projectRoot, projectRoot, out, (rel) =>
      globs.some((g) => minimatch(rel, g, { dot: true }))
    );
  } else {
    const docsRoot = config.doc.docsOutput.docsRoot?.trim() || "content/docs";
    const absRoot = path.resolve(projectRoot, docsRoot);
    if (!fs.existsSync(absRoot)) {
      return [];
    }
    walkForMetaFiles(absRoot, projectRoot, out, (_rel, filename) => filename === META_FILENAME);
  }
  const filtered = out.filter((rel) => !isFumadocsDotLocaleSuffixedMeta(rel, config));
  filtered.sort();
  return filtered;
}

export async function translateFumadocsMetaFiles(
  config: I18nDocTranslateConfig,
  locale: string,
  projectRoot: string,
  metaRelPaths: string[],
  cache: TranslationCache | null,
  client: LlmClient | null,
  glossary: Glossary,
  opts: TranslateRunOptions,
  hitKeys?: Set<string>
): Promise<TranslateTotals> {
  const totals: TranslateTotals = {
    filesWritten: 0,
    filesSkipped: 0,
    filesProcessed: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };
  const blockIdx = opts.documentationBlockIndex ?? 0;
  const keyPolicy = metaKeyPolicy(config);

  for (const rel of metaRelPaths) {
    const absSource = path.join(projectRoot, rel);
    const outPath = resolveTranslatedOutputPath(config, projectRoot, locale, rel, "markdown");
    const fileTrackingKey = fumadocsMetaFileTrackingKey(blockIdx, rel);
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
            t("⏭️  {{locale}} {{path}} (fumadocs-meta, unchanged)", { locale, path: rel })
          )
        );
      }
      totals.filesSkipped += 1;
      continue;
    }

    const jx = new NestedJsonExtractor();
    const segments = jx.extract(content, rel, keyPolicy);
    const translatable = segments.filter((s) => s.translatable);

    console.log(
      chalk.yellow(
        t("📄 {{locale}} {{path}} (fumadocs-meta): {{count}} segment(s)", {
          locale,
          path: rel,
          count: translatable.length,
        })
      )
    );

    const translations = new Map<string, DocSegmentTranslation>();
    const placeholderById = new Map<string, ProtectState>();
    const toBatch: typeof segments = [];
    const segmentIndicesInDoc: number[] = [];
    let segmentsCached = 0;
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

    for (let docIdx = 0; docIdx < segments.length; docIdx++) {
      const s = segments[docIdx]!;
      if (!s.translatable) {
        continue;
      }
      if (!opts.force && cache && !opts.noCache) {
        const hit = await withCacheMutex(opts.cacheMutex, () =>
          cache.getSegment(s.hash, locale, rel)
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

    const { map, inTok, outTok, cost } = await translateSegmentsBatched(
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
        relativePath: rel,
        totalSegments: segments.length,
        segmentIndicesInDoc,
      },
      undefined,
      failureTracker,
      { filepath: rel },
      undefined,
      opts.abortSignal
    );

    for (const [h, tr] of map) {
      translations.set(h, tr);
    }

    totals.inputTokens += inTok;
    totals.outputTokens += outTok;
    totals.costUsd = (totals.costUsd ?? 0) + cost;
    totals.segmentsCached = (totals.segmentsCached ?? 0) + segmentsCached;
    totals.segmentsTranslated =
      (totals.segmentsTranslated ?? 0) + (translatable.length - segmentsCached);

    for (const s of translatable) {
      if (translations.has(s.hash)) {
        hitKeys?.add(`${s.hash}|${locale}`);
      }
    }

    const output = jx.reassemble(segments, translations);

    if (!opts.dryRun) {
      throwIfAbortSignal(opts.abortSignal);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      writeAtomicUtf8(outPath, output);
      if (cache && !opts.noCache) {
        await withCacheMutex(opts.cacheMutex, () => {
          cache.setFileStatus(fileTrackingKey, locale, fileHash);
          for (const s of translatable) {
            const entry = translations.get(s.hash);
            if (entry?.modelUsed === undefined) {
              continue;
            }
            cache.setSegment(
              s.hash,
              locale,
              s.content,
              entry.text,
              entry.modelUsed,
              rel,
              null
            );
          }
        });
      }
      totals.filesWritten += 1;
    }
    totals.filesProcessed = (totals.filesProcessed ?? 0) + 1;
  }

  return totals;
}
