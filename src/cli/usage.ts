import path from "path";
import chalk from "chalk";
import type { ApiCallBreakdownRow, ApiCallFilters, I18nConfig } from "../core/types.js";
import { TranslationCache } from "../core/cache.js";
import {
  collectProviderPricing,
  isUsageLongRange,
  parseUsageDeleteOlderThan,
  parseUsageSince,
  resolvedCostUsd,
  withEstimatedCosts,
} from "../core/usage-stats.js";
import { displayWidth, padEndDisplay } from "../utils/table.js";
import { t } from "../i18n/index.js";

export interface RunUsageOptions {
  since?: string;
  provider?: string;
  model?: string;
  operation?: string;
  locale?: string;
  outcome?: "accepted" | "discarded";
  clear?: boolean;
  olderThan?: string;
  dryRun?: boolean;
}

function formatCost(amount: number | undefined): string {
  if (amount === undefined) {
    return "—";
  }
  return `$${amount.toFixed(6)}`;
}

function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(displayWidth(h), ...rows.map((r) => displayWidth(r[i] ?? "")), 3)
  );
  const format = (cols: string[], paint?: (s: string) => string): string =>
    cols
      .map((c, i) => {
        const padded = padEndDisplay(c, widths[i]!);
        return paint ? paint(padded) : padded;
      })
      .join(" | ");
  console.log(format(headers, (s) => chalk.bold(s)));
  console.log(
    format(
      headers.map((_, i) => "-".repeat(widths[i]!)),
      (s) => chalk.bold(s)
    )
  );
  for (const row of rows) {
    console.log(format(row));
  }
  console.log();
}

function breakdownCells(row: ApiCallBreakdownRow): string[] {
  return [
    String(row.calls),
    String(row.acceptedCalls),
    String(row.discardedCalls),
    row.totalTokens.toLocaleString(),
    formatCost(resolvedCostUsd(row)),
  ];
}

function removedCount(result: { removedCalls: number; removedTotals: number }): number {
  return result.removedCalls + result.removedTotals;
}

export function runUsage(config: I18nConfig, projectRoot: string, opts: RunUsageOptions): void {
  const cacheDir = path.join(projectRoot, config.cacheDir);
  const cache = new TranslationCache(cacheDir);
  try {
    if (opts.clear) {
      const dryRun = Boolean(opts.dryRun);
      const dryTag = dryRun ? t(" (dry-run)") : "";
      if (opts.olderThan !== undefined) {
        let preset: ReturnType<typeof parseUsageDeleteOlderThan>;
        try {
          preset = parseUsageDeleteOlderThan(opts.olderThan);
        } catch (e) {
          console.error(chalk.red(e instanceof Error ? e.message : String(e)));
          process.exitCode = 1;
          return;
        }
        const result =
          preset === "all" ? cache.clearUsage(dryRun) : cache.deleteUsageOlderThan(preset, dryRun);
        console.log(
          t(
            "Deleted {{count}} usage row(s) older than {{when}} ({{calls}} call(s), {{totals}} monthly total(s)){{dry}}.",
            {
              count: removedCount(result),
              when: opts.olderThan,
              calls: result.removedCalls,
              totals: result.removedTotals,
              dry: dryTag,
            }
          )
        );
      } else {
        const result = cache.clearUsage(dryRun);
        console.log(
          t(
            "Deleted {{count}} usage row(s) ({{calls}} call(s), {{totals}} monthly total(s)){{dry}}.",
            {
              count: removedCount(result),
              calls: result.removedCalls,
              totals: result.removedTotals,
              dry: dryTag,
            }
          )
        );
      }
      return;
    }

    let since: string | undefined;
    if (opts.since?.trim()) {
      try {
        since = parseUsageSince(opts.since);
      } catch (e) {
        console.error(chalk.red(e instanceof Error ? e.message : String(e)));
        process.exitCode = 1;
        return;
      }
    }

    const filters: ApiCallFilters = {
      since,
      provider: opts.provider,
      model: opts.model,
      operation: opts.operation,
      locale: opts.locale,
      outcome: opts.outcome,
    };
    const pricing = collectProviderPricing(config.providers);
    const stats = withEstimatedCosts(cache.getApiCallStats(filters), pricing);
    const s = stats.summary;
    const costHeaders = [t("Calls"), t("Accepted"), t("Discarded"), t("Tokens"), t("Cost")];

    console.log(chalk.bold.cyan(`\n${t("📊 Model API usage")}`));
    console.log(chalk.gray(`(${cacheDir})\n`));

    const labelW = 36;
    const lines: [string, string][] = [
      [t("Total calls"), String(s.calls)],
      [t("Accepted"), String(s.acceptedCalls)],
      [t("Discarded (retries / rejected)"), String(s.discardedCalls)],
      [t("Total tokens"), s.totalTokens.toLocaleString()],
      [t("Input tokens"), s.inputTokens.toLocaleString()],
      [t("Output tokens"), s.outputTokens.toLocaleString()],
      [t("Cost"), formatCost(resolvedCostUsd(s))],
    ];
    for (const [label, val] of lines) {
      console.log(`${chalk.magenta(padEndDisplay(`${label}:`, labelW))} ${val}`);
    }
    console.log();

    console.log(chalk.magenta.bold(t("By provider")));
    if (stats.byProvider.length === 0) {
      console.log(chalk.gray(`  ${t("(no API-call rows)")}\n`));
    } else {
      printTable(
        [t("Provider"), ...costHeaders],
        stats.byProvider.map((row) => [row.provider, ...breakdownCells(row)])
      );
    }

    console.log(chalk.magenta.bold(t("By model")));
    if (stats.byModel.length === 0) {
      console.log(chalk.gray(`  ${t("(no API-call rows)")}\n`));
    } else {
      printTable(
        [t("Provider"), t("Model"), ...costHeaders, t("% of calls")],
        stats.byModel.map((row) => {
          const pct = s.calls === 0 ? "—" : `${((100 * row.calls) / s.calls).toFixed(1)}%`;
          return [row.provider, row.model, ...breakdownCells(row), pct];
        })
      );
    }

    console.log(chalk.magenta.bold(t("By operation")));
    if (stats.byOperation.length === 0) {
      console.log(chalk.gray(`  ${t("(no API-call rows)")}\n`));
    } else {
      printTable(
        [t("Operation"), ...costHeaders],
        stats.byOperation.map((row) => [row.operation, ...breakdownCells(row)])
      );
    }

    const timeHeaders = [
      t("Date"),
      t("Calls"),
      t("Accepted"),
      t("Discarded"),
      t("Tokens"),
      t("Cost"),
    ];
    const dayRows = stats.byDay.map((row) => [
      row.day,
      String(row.calls),
      String(row.acceptedCalls),
      String(row.discardedCalls),
      row.totalTokens.toLocaleString(),
      formatCost(resolvedCostUsd(row)),
    ]);
    const monthRows = isUsageLongRange(opts.since)
      ? stats.byMonth.map((row) => [
          row.month,
          String(row.calls),
          String(row.acceptedCalls),
          String(row.discardedCalls),
          row.totalTokens.toLocaleString(),
          formatCost(resolvedCostUsd(row)),
        ])
      : [];
    const timeRows = [...dayRows, ...monthRows];
    if (timeRows.length > 0) {
      console.log(chalk.magenta.bold(t("Usage over time")));
      printTable(timeHeaders, timeRows);
    }
  } finally {
    cache.close();
  }
}
