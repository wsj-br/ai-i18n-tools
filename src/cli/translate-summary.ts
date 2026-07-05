import chalk from "chalk";
import { t } from "../i18n/index.js";
import type { TranslateRunOptions, TranslateTotals } from "./doc-translate.js";
import { formatElapsedMmSs, formatSegmentCacheHitSuffix } from "./format.js";

export type TranslationSummaryOutcome = "success" | "failure" | "interrupted";

export interface TranslationSummaryTitles {
  success: string;
  interrupted: string;
  failure?: string;
}

export interface TranslationSummaryLabels {
  processed: string;
  skipped: string;
  fromCache: string;
  translated: string;
}

const DEFAULT_LABELS: TranslationSummaryLabels = {
  processed: "Total files processed: {{count}}",
  skipped: "Total files skipped:   {{count}}",
  fromCache: "Segments from cache:   {{count}}{{suffix}}",
  translated: "Segments translated:   {{count}}",
};

export const UI_STRING_SUMMARY_LABELS: TranslationSummaryLabels = {
  processed: "Total locales processed: {{count}}",
  skipped: "Locales skipped:         {{count}}",
  fromCache: "Strings from cache:    {{count}}{{suffix}}",
  translated: "Strings translated:    {{count}}",
};

export function mergeTranslateTotals(
  target: TranslateTotals,
  source: TranslateTotals,
  skipped: boolean,
  opts?: { skipUsage?: boolean }
): void {
  if (skipped) {
    target.filesSkipped += source.filesSkipped;
    target.filesProcessed = (target.filesProcessed ?? 0) + (source.filesProcessed ?? 0);
    return;
  }
  target.filesWritten += source.filesWritten;
  target.filesProcessed = (target.filesProcessed ?? 0) + (source.filesProcessed ?? 0);
  if (!opts?.skipUsage) {
    target.inputTokens += source.inputTokens;
    target.outputTokens += source.outputTokens;
    target.costUsd = (target.costUsd ?? 0) + (source.costUsd ?? 0);
  }
  target.segmentsCached = (target.segmentsCached ?? 0) + (source.segmentsCached ?? 0);
  target.segmentsTranslated = (target.segmentsTranslated ?? 0) + (source.segmentsTranslated ?? 0);
  target.segmentValidationFailures =
    (target.segmentValidationFailures ?? 0) + (source.segmentValidationFailures ?? 0);
  target.individualSegmentTranslations =
    (target.individualSegmentTranslations ?? 0) + (source.individualSegmentTranslations ?? 0);
  target.segmentQualitySplitRetries =
    (target.segmentQualitySplitRetries ?? 0) + (source.segmentQualitySplitRetries ?? 0);
}

export function printTranslationRunSummary(
  opts: Pick<TranslateRunOptions, "dryRun">,
  sum: TranslateTotals,
  wallElapsedMs: number,
  outcome: TranslationSummaryOutcome,
  titles: TranslationSummaryTitles,
  options?: {
    labels?: TranslationSummaryLabels;
    showQualityMetrics?: boolean;
    allFromCacheCostNote?: string;
  }
): void {
  const labels = options?.labels ?? DEFAULT_LABELS;
  const showQualityMetrics = options?.showQualityMetrics ?? true;

  if (outcome === "success") {
    console.log(chalk.bold.green(`\n${titles.success}\n`));
  } else if (outcome === "interrupted") {
    console.log(
      chalk.bold.yellow(
        `\n${titles.interrupted}\n`
      )
    );
  } else {
    console.log(
      chalk.bold.yellow(
        `\n${titles.failure ?? titles.interrupted}\n`
      )
    );
  }

  console.log(chalk.bold(t("📊 Summary:")));
  console.log(t("   Total elapsed time:    {{time}}", { time: formatElapsedMmSs(wallElapsedMs) }));
  console.log(t(`   ${labels.processed}`, { count: sum.filesProcessed ?? 0 }));
  console.log(t(`   ${labels.skipped}`, { count: sum.filesSkipped }));
  console.log(
    t(`   ${labels.fromCache}`, {
      count: sum.segmentsCached ?? 0,
      suffix: formatSegmentCacheHitSuffix(sum.segmentsCached, sum.segmentsTranslated),
    })
  );
  console.log(t(`   ${labels.translated}`, { count: sum.segmentsTranslated ?? 0 }));
  if (showQualityMetrics) {
    console.log(
      t("   Segment translation failures: {{count}}", {
        count: sum.segmentValidationFailures ?? 0,
      })
    );
    console.log(
      t("   Individual segment translations: {{count}}", {
        count: sum.individualSegmentTranslations ?? 0,
      })
    );
    console.log(
      t("   Quality split retries: {{count}}", { count: sum.segmentQualitySplitRetries ?? 0 })
    );
  }
  console.log(
    t("   Total tokens used:     {{tokens}}", {
      tokens: (sum.inputTokens + sum.outputTokens).toLocaleString(),
    })
  );
  if (opts.dryRun && (sum.filesWritten ?? 0) === 0 && (sum.filesProcessed ?? 0) > 0) {
    console.log(t("   Files written:         0 (dry-run)"));
  } else if ((sum.filesWritten ?? 0) > 0) {
    console.log(t("   Files written:         {{count}}", { count: sum.filesWritten }));
  }
  const cost = sum.costUsd ?? 0;
  const tokensUsed = (sum.inputTokens ?? 0) + (sum.outputTokens ?? 0);
  const segNew = sum.segmentsTranslated ?? 0;
  if (cost > 0) {
    console.log(t("   Total cost:            ${{amount}}", { amount: cost.toFixed(6) }));
  } else if (tokensUsed > 0 || segNew > 0) {
    console.log(t("   Total cost:            $0.0000 (cost data not available from API)"));
  } else {
    console.log(
      t(
        options?.allFromCacheCostNote ??
          "   Total cost:            $0.0000 (all segments from cache)"
      )
    );
  }
  console.log("");
}
