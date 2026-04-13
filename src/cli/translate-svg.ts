import path from "path";
import chalk from "chalk";
import type { I18nConfig } from "../core/types.js";
import {
  assertSvgCommandConfig,
  normalizeLocale,
  resolveTranslationModels,
} from "../core/config.js";
import { relPathUnderSvgSource } from "../core/svg-asset-paths.js";
import { collectFilesByExtension } from "./file-utils.js";
import { loadTranslateIgnore, isIgnored } from "../utils/ignore-parser.js";
import { TranslationCache } from "../core/cache.js";
import { Glossary } from "../glossary/glossary.js";
import { OpenRouterClient } from "../api/openrouter.js";
import {
  translateSvgAssetFile,
  type TranslateRunOptions,
  type TranslateTotals,
  matchesPathFilter,
} from "./doc-translate.js";
import { runMapWithConcurrency, AsyncMutex } from "../utils/concurrency.js";
import { formatElapsedMmSs, printModelsTryInOrder } from "./format.js";

function filterIgnored(files: string[], cwd: string): string[] {
  const ig = loadTranslateIgnore(".translate-ignore", cwd);
  return files.filter((f) => !isIgnored(ig, path.join(cwd, f), cwd));
}

/**
 * Translate standalone SVG assets per `config.svg` (`translate-svg` command).
 */
export async function runTranslateSvg(
  config: I18nConfig,
  opts: TranslateRunOptions
): Promise<TranslateTotals> {
  if (!config.features.translateSVG) {
    throw new Error("Enable features.translateSVG in config");
  }
  assertSvgCommandConfig(config);
  const svg = config.svg!;
  const roots = svg.sourcePath;
  const files = filterIgnored(collectFilesByExtension(roots, [".svg"], opts.cwd), opts.cwd);

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
    : new TranslationCache(path.join(opts.cwd, config.cacheDir));

  const locales = opts.locales.map((l) => normalizeLocale(l));
  const hasNonSourceTarget = locales.some(
    (l) => normalizeLocale(l) !== normalizeLocale(config.sourceLocale)
  );
  const models = resolveTranslationModels(config.openrouter);
  const needsApi = !opts.dryRun && hasNonSourceTarget && models.length > 0;
  const client = needsApi ? new OpenRouterClient({ config }) : null;

  const glossaryUi = config.glossary?.uiGlossary
    ? path.join(opts.cwd, config.glossary.uiGlossary)
    : undefined;
  const glossaryUser = config.glossary?.userGlossary
    ? path.join(opts.cwd, config.glossary.userGlossary)
    : undefined;
  const glossary = new Glossary(glossaryUi, glossaryUser, locales);
  const noopHitKeys = new Set<string>();

  const totalFileCount = files.length;
  const displayModels = client?.getConfiguredModels() ?? models;

  console.log(
    chalk.gray(
      "\n\n___SVG Translation_______________________________________________________________________________________\n\n"
    ) +
      chalk.bold(`\n🌐 Translating ${totalFileCount} SVG file(s) to ${locales.length} locale(s)\n`)
  );
  printModelsTryInOrder(displayModels);
  console.log(chalk.cyan(`Glossary terms: `) + chalk.magenta(`${glossary.size}`));
  console.log(
    chalk.cyan(`SVG output: `) + chalk.magenta(`${path.resolve(opts.cwd, svg.outputDir)}`)
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
  console.log("");

  const wallStart = Date.now();
  const cacheMutex = cache && locales.length > 1 ? new AsyncMutex() : undefined;
  const runOpts: TranslateRunOptions = {
    ...opts,
    batchConcurrency: batchConcurrencyEffective,
    cacheMutex,
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
    };
    const localeStart = Date.now();

    for (const rel of files) {
      if (!matchesPathFilter(rel, opts.pathFilter)) {
        continue;
      }
      const under = relPathUnderSvgSource(rel, roots);
      if (!under) {
        console.warn(chalk.yellow(`⚠️  Skip (not under svg.sourcePath): ${rel}`));
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
      }
    }

    const localeElapsed = Date.now() - localeStart;
    if (localeElapsed > 0) {
      console.log(chalk.gray(`   [${locale}] Time: ${formatElapsedMmSs(localeElapsed)}`));
    }

    return { locale, partial, localeElapsed };
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
  }

  cache?.close();

  const wallElapsed = Date.now() - wallStart;

  console.log(chalk.bold.green("\n✅ SVG translation complete!\n"));
  console.log(chalk.bold("📊 Summary:"));
  console.log(`   Total elapsed time:    ${formatElapsedMmSs(wallElapsed)}`);
  console.log(`   Total files processed: ${sum.filesProcessed ?? 0}`);
  console.log(`   Total files skipped:   ${sum.filesSkipped}`);
  console.log(`   Segments from cache:   ${sum.segmentsCached ?? 0}`);
  console.log(`   Segments translated:   ${sum.segmentsTranslated ?? 0}`);
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
