import path from "path";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import {
  assertSvgCommandConfig,
  dedupeOrderedModelIds,
  normalizeLocale,
  resolveTranslationModels,
  resolveTranslationModelsForLocale,
} from "../core/config.js";
import { relPathUnderSvgSource } from "../core/svg-asset-paths.js";
import { collectFilesByExtension } from "./file-utils.js";
import { loadTranslateIgnore, isIgnored } from "../utils/ignore-parser.js";
import { TranslationCache } from "../core/cache.js";
import { Glossary } from "../glossary/glossary.js";
import { LlmClient } from "../api/llm-client.js";
import { createFilteredLlmClient } from "./llm-client-factory.js";
import {
  translateSvgAssetFile,
  type TranslateRunOptions,
  type TranslateTotals,
  matchesPathFilter,
} from "./doc-translate.js";
import { runMapWithConcurrency, AsyncMutex } from "../utils/concurrency.js";
import {
  bindRunInterruptScope,
  isRunInterruptedError,
  interruptErrorFromSignal,
} from "../utils/run-interrupt.js";
import { formatElapsedMmSs, printModelsTryInOrder, printTranslationModelSummary, localeModelRowsForRun } from "./format.js";
import { printTranslationRunSummary } from "./translate-summary.js";
import { safeResolveActiveProvider, localeModelsMapForProvider } from "../core/llm-providers.js";
import { t } from "../i18n/index.js";

function filterIgnored(files: string[], cwd: string): string[] {
  const ig = loadTranslateIgnore(".translate-ignore", cwd);
  return files.filter((f) => !isIgnored(ig, path.join(cwd, f), cwd));
}

/**
 * Translate  SVG files per `config.svg` (`translate-svg` command).
 */
export async function runTranslateSvg(
  config: I18nConfig,
  opts: TranslateRunOptions
): Promise<TranslateTotals> {
  if (!config.features.translateSVG) {
    throw new Error(t("Enable features.translateSVG in config"));
  }
  assertSvgCommandConfig(config);
  const svg = config.svg!;
  const roots = svg.sourcePath;
  const files = filterIgnored(collectFilesByExtension(roots, [".svg"], opts.cwd), opts.cwd);

  const cache: TranslationCache | null = opts.noCache
    ? null
    : new TranslationCache(path.join(opts.cwd, config.cacheDir));

  const { opts: boundOpts, scope: interruptScope } = bindRunInterruptScope(opts);
  opts = boundOpts;

  try {
    return await runTranslateSvgBody(config, opts, svg, roots, files, cache);
  } finally {
    interruptScope.dispose();
    cache?.close();
  }
}

function printTranslateSvgSummary(
  opts: TranslateRunOptions,
  sum: TranslateTotals,
  wallElapsedMs: number,
  models: readonly string[],
  outcome: "success" | "interrupted",
  provider?: string
): void {
  if (outcome === "interrupted") {
    printModelsTryInOrder(models, provider);
    console.log("");
  }
  printTranslationRunSummary(opts, sum, wallElapsedMs, outcome, {
    success: t("✅ SVG translation complete!"),
    interrupted: t(
      "⚠️  SVG translation interrupted — partial summary (tokens and cost reflect API work completed before interrupt)."
    ),
  });
}

async function runTranslateSvgBody(
  config: I18nConfig,
  opts: TranslateRunOptions,
  svg: NonNullable<I18nConfig["svg"]>,
  roots: string[],
  files: string[],
  cache: TranslationCache | null
): Promise<TranslateTotals> {
  const locales = opts.locales.map((l) => normalizeLocale(l));
  const hasNonSourceTarget = locales.some(
    (l) => normalizeLocale(l) !== normalizeLocale(config.sourceLocale)
  );
  const resolvedModels = resolveTranslationModels(config);
  const needsApi = !opts.dryRun && hasNonSourceTarget && resolvedModels.length > 0;

  const glossaryUi = config.glossary?.uiGlossary
    ? path.join(opts.cwd, config.glossary.uiGlossary)
    : undefined;
  const glossaryUser = config.glossary?.userGlossary
    ? path.join(opts.cwd, config.glossary.userGlossary)
    : undefined;
  const glossary = new Glossary(glossaryUi, glossaryUser, locales);
  const noopHitKeys = new Set<string>();

  const totalFileCount = files.length;
  const displayModels = dedupeOrderedModelIds(
    ...locales.map((loc) => resolveTranslationModelsForLocale(config, loc))
  );
  const displayProvider = safeResolveActiveProvider(config);

  console.log(
    chalk.gray(
      "\n\n___SVG Translation_______________________________________________________________________________________\n\n"
    ) +
      chalk.bold(
        `\n${t("🌐 Translating {{fileCount}} SVG file(s) to {{localeCount}} locale(s)", {
          fileCount: totalFileCount,
          localeCount: locales.length,
        })}\n`
      )
  );
  printTranslationModelSummary({
    resolvedModels: displayModels,
    provider: displayProvider,
    localeModels:
      displayProvider !== undefined
        ? localeModelRowsForRun(
            localeModelsMapForProvider(config, displayProvider),
            locales
          )
        : undefined,
  });
  console.log(chalk.cyan(`${t("Glossary terms:")} `) + chalk.magenta(`${glossary.size}`));
  console.log(
    chalk.cyan(`${t("SVG output:")} `) + chalk.magenta(`${path.resolve(opts.cwd, svg.outputDir)}`)
  );
  if (opts.logPath) {
    console.log(chalk.cyan(`${t("Output log:")} `) + chalk.magenta(opts.logPath));
  }
  if (opts.dryRun) {
    console.log(chalk.yellow(`\n${t("⚠️  Dry run mode - no changes will be made")}`));
  }
  console.log("");

  const localeConcurrency = Math.max(1, Math.floor(opts.concurrency ?? config.concurrency ?? 3));
  const batchConcurrencyEffective = Math.max(
    1,
    Math.floor(opts.batchConcurrency ?? config.batchConcurrency ?? 4)
  );

  console.log(chalk.cyan(`${t("Locale concurrency:")} `) + chalk.magenta(`${localeConcurrency}`));
  console.log(
    chalk.cyan(`${t("Parallel API calls per file:")} `) +
      chalk.magenta(`${batchConcurrencyEffective}`)
  );
  console.log("");

  const wallStart = Date.now();
  const cacheMutex = cache && locales.length > 1 ? new AsyncMutex() : undefined;
  const liveSumMutex = new AsyncMutex();
  const liveSum: TranslateTotals = {
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
  const runOpts: TranslateRunOptions = {
    ...opts,
    batchConcurrency: batchConcurrencyEffective,
    cacheMutex,
  };

  const recordFileTotals = async (skipped: boolean, totals: TranslateTotals): Promise<void> => {
    await liveSumMutex.runExclusive(async () => {
      if (skipped) {
        liveSum.filesSkipped += totals.filesSkipped;
        liveSum.filesProcessed = (liveSum.filesProcessed ?? 0) + (totals.filesProcessed ?? 0);
        return;
      }
      liveSum.filesWritten += totals.filesWritten;
      liveSum.filesProcessed = (liveSum.filesProcessed ?? 0) + (totals.filesProcessed ?? 0);
      liveSum.inputTokens += totals.inputTokens;
      liveSum.outputTokens += totals.outputTokens;
      liveSum.costUsd = (liveSum.costUsd ?? 0) + (totals.costUsd ?? 0);
      liveSum.segmentsCached = (liveSum.segmentsCached ?? 0) + (totals.segmentsCached ?? 0);
      liveSum.segmentsTranslated =
        (liveSum.segmentsTranslated ?? 0) + (totals.segmentsTranslated ?? 0);
      liveSum.segmentValidationFailures =
        (liveSum.segmentValidationFailures ?? 0) + (totals.segmentValidationFailures ?? 0);
      liveSum.individualSegmentTranslations =
        (liveSum.individualSegmentTranslations ?? 0) + (totals.individualSegmentTranslations ?? 0);
    });
  };

  const processLocale = async (locale: string) => {
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

    let client: LlmClient | null = null;
    if (needsApi) {
      client = await createFilteredLlmClient(config, locale);
    }

    for (const rel of files) {
      if (runOpts.abortSignal?.aborted) {
        throw interruptErrorFromSignal(runOpts.abortSignal);
      }
      if (!matchesPathFilter(rel, opts.pathFilter)) {
        continue;
      }
      const under = relPathUnderSvgSource(rel, roots);
      if (!under) {
        console.warn(
          chalk.yellow(t("⚠️  Skip (not under svg.sourcePath): {{path}}", { path: rel }))
        );
        continue;
      }
      const abs = path.join(opts.cwd, rel);
      const { skipped, totals } = await translateSvgAssetFile(
        abs,
        rel,
        under,
        locale,
        config,
        cache,
        client,
        glossary,
        runOpts,
        noopHitKeys
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
      await recordFileTotals(skipped, totals);
    }

    const localeElapsed = Date.now() - localeStart;
    if (localeElapsed > 0) {
      console.log(
        chalk.gray(
          `   ${t("[{{locale}}] Time: {{time}}", {
            locale,
            time: formatElapsedMmSs(localeElapsed),
          })}`
        )
      );
    }

    return { locale, partial, localeElapsed };
  };

  try {
    await runMapWithConcurrency(
      locales,
      localeConcurrency,
      async (locale) => processLocale(locale),
      runOpts.abortSignal
    );

    printTranslateSvgSummary(
      opts,
      liveSum,
      Date.now() - wallStart,
      displayModels,
      "success",
      displayProvider
    );
    return liveSum;
  } catch (e) {
    if (isRunInterruptedError(e) || runOpts.abortSignal?.aborted) {
      printTranslateSvgSummary(
        opts,
        liveSum,
        Date.now() - wallStart,
        displayModels,
        "interrupted",
        displayProvider
      );
      throw isRunInterruptedError(e) ? e : interruptErrorFromSignal(runOpts.abortSignal!);
    }
    throw e;
  }
}
