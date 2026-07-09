import fs from "fs";
import path from "path";
import chalk from "chalk";
import type { I18nDocTranslateConfig, JsonKeyPolicyConfig, TranslationFailureInsert } from "../core/types.js";
import { vitepressThemeFileTrackingKey } from "../core/doc-file-tracking.js";
import { matchesDocsOutputStylePreset } from "../core/docs-output-normalize.js";
import { localePathPlaceholders } from "../core/locale-utils.js";
import { NestedJsonExtractor } from "../extractors/nested-json-extractor.js";
import {
  extractVitepressThemeCatalog,
  mergeThemeCatalogs,
  type ThemeCatalog,
} from "../extractors/vitepress-theme-extractor.js";
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
import { t } from "../i18n/index.js";

type ProtectState = ReturnType<typeof protectSegmentForTranslation>["state"];

const DEFAULT_THEME_KEY_POLICY: JsonKeyPolicyConfig = {
  mode: "denylist",
  translateKeys: [],
  skipKeys: ["id", "slug", "href", "url", "key", "code", "link"],
};

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

function expandThemeOutputPath(
  template: string,
  projectRoot: string,
  locale: string,
  catalogRelPath: string
): string {
  const posixRel = catalogRelPath.replace(/\\/g, "/");
  const dir = path.posix.dirname(posixRel);
  const stem = path.posix.basename(posixRel, path.posix.extname(posixRel));
  const localeVars = localePathPlaceholders(locale);
  const vars: Record<string, string> = {
    ...localeVars,
    dir,
    stem,
  };
  let out = template;
  for (const [key, val] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(val);
  }
  return path.isAbsolute(out) ? out : path.join(projectRoot, out);
}

function defaultThemeOutputTemplate(catalogRelPath: string): string {
  const dir = path.posix.dirname(catalogRelPath.replace(/\\/g, "/"));
  return `${dir}/theme.{locale}.json`;
}

function readExistingCatalog(absPath: string): ThemeCatalog {
  if (!fs.existsSync(absPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(absPath, "utf8")) as ThemeCatalog;
  } catch {
    return {};
  }
}

export function bootstrapVitepressThemeCatalog(
  config: I18nDocTranslateConfig,
  projectRoot: string,
  opts: Pick<TranslateRunOptions, "force" | "dryRun" | "verbose">
): { catalogRelPath: string; updated: boolean } | null {
  const catalogCfg = config.doc.docsOutput.vitepressThemeCatalog;
  if (!catalogCfg || !matchesDocsOutputStylePreset(config.doc.docsOutput, "vitepress")) {
    return null;
  }

  const configRel = catalogCfg.configPath.trim();
  const catalogRel = catalogCfg.catalogPath.trim();
  const configAbs = path.resolve(projectRoot, configRel);
  const catalogAbs = path.resolve(projectRoot, catalogRel);

  if (!fs.existsSync(configAbs)) {
    throw new Error(`vitepressThemeCatalog.configPath not found: ${configRel}`);
  }

  const configContent = fs.readFileSync(configAbs, "utf8");
  const configMtime = fs.statSync(configAbs).mtimeMs;
  const catalogExists = fs.existsSync(catalogAbs);
  const catalogMtime = catalogExists ? fs.statSync(catalogAbs).mtimeMs : 0;

  const extracted = extractVitepressThemeCatalog(configContent, configRel);
  const hasExtracted = Object.keys(extracted).length > 0;
  const existing = readExistingCatalog(catalogAbs);
  const merged = mergeThemeCatalogs(existing, extracted);

  const shouldWrite =
    opts.force ||
    !catalogExists ||
    (hasExtracted && configMtime > catalogMtime) ||
    JSON.stringify(existing) !== JSON.stringify(merged);

  if (!shouldWrite) {
    if (opts.verbose) {
      console.log(
        chalk.gray(t("⏭️  VitePress theme catalog unchanged: {{path}}", { path: catalogRel }))
      );
    }
    return { catalogRelPath: catalogRel, updated: false };
  }

  if (Object.keys(merged).length === 0) {
    if (!catalogExists) {
      throw new Error(
        `VitePress theme catalog could not be bootstrapped from ${configRel} and ${catalogRel} does not exist`
      );
    }
    return { catalogRelPath: catalogRel, updated: false };
  }

  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(catalogAbs), { recursive: true });
    writeAtomicUtf8(catalogAbs, `${JSON.stringify(merged, null, 2)}\n`);
  }

  if (opts.verbose || !catalogExists) {
    console.log(
      chalk.cyan(t("📦 VitePress theme catalog bootstrapped: {{path}}", { path: catalogRel }))
    );
  }

  return { catalogRelPath: catalogRel, updated: true };
}

export async function translateVitepressThemeCatalog(
  config: I18nDocTranslateConfig,
  locale: string,
  projectRoot: string,
  catalogRelPath: string,
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

  const catalogCfg = config.doc.docsOutput.vitepressThemeCatalog;
  if (!catalogCfg) {
    return totals;
  }

  const catalogAbs = path.resolve(projectRoot, catalogRelPath);
  if (!fs.existsSync(catalogAbs)) {
    return totals;
  }

  const content = fs.readFileSync(catalogAbs, "utf8");
  const fileHash = hashFileContent(content);
  const sourceFileMtime = fs.statSync(catalogAbs).mtime.toISOString();
  const template =
    catalogCfg.outputPathTemplate?.trim() || defaultThemeOutputTemplate(catalogRelPath);
  const outPath = expandThemeOutputPath(template, projectRoot, locale, catalogRelPath);
  const blockIdx = opts.documentationBlockIndex ?? 0;
  const fileTrackingKey = vitepressThemeFileTrackingKey(blockIdx, catalogRelPath);

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
          t("⏭️  {{locale}} {{path}} (vitepress-theme, unchanged)", {
            locale,
            path: catalogRelPath,
          })
        )
      );
    }
    totals.filesSkipped = 1;
    return totals;
  }

  const jx = new NestedJsonExtractor();
  const segments = jx.extract(content, catalogRelPath, DEFAULT_THEME_KEY_POLICY);
  const translatable = segments.filter((s) => s.translatable);

  console.log(
    chalk.yellow(
      t("📄 {{locale}} {{path}} (vitepress-theme): {{count}} segment(s)", {
        locale,
        path: catalogRelPath,
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
        cache.getSegment(s.hash, locale, catalogRelPath)
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
      relativePath: catalogRelPath,
      totalSegments: segments.length,
      segmentIndicesInDoc,
    },
    undefined,
    failureTracker,
    { filepath: catalogRelPath },
    undefined,
    opts.abortSignal
  );

  for (const [h, tr] of map) {
    translations.set(h, tr);
  }

  totals.inputTokens += inTok;
  totals.outputTokens += outTok;
  totals.costUsd = (totals.costUsd ?? 0) + cost;
  totals.segmentsCached = segmentsCached;
  totals.segmentsTranslated = translatable.length - segmentsCached;

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
            catalogRelPath,
            null
          );
        }
      });
    }
    totals.filesWritten = 1;
  }

  totals.filesProcessed = 1;
  return totals;
}

export async function runVitepressThemeShell(
  config: I18nDocTranslateConfig,
  locale: string,
  projectRoot: string,
  cache: TranslationCache | null,
  client: LlmClient | null,
  glossary: Glossary,
  opts: TranslateRunOptions,
  hitKeys?: Set<string>,
  bootstrapDone?: { catalogRelPath: string } | null
): Promise<TranslateTotals> {
  const bootstrap =
    bootstrapDone ??
    bootstrapVitepressThemeCatalog(config, projectRoot, {
      force: opts.force,
      dryRun: opts.dryRun,
      verbose: opts.verbose,
    });
  if (!bootstrap) {
    return {
      filesWritten: 0,
      filesSkipped: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
    };
  }
  return translateVitepressThemeCatalog(
    config,
    locale,
    projectRoot,
    bootstrap.catalogRelPath,
    cache,
    client,
    glossary,
    opts,
    hitKeys
  );
}
