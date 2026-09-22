import type {
  ApiCallBreakdownRow,
  ApiCallStatsResult,
  I18nConfig,
  LlmModelPricing,
  UsageDeleteOlderThan,
} from "./types.js";

export const USAGE_DELETE_PRESETS = ["1mo", "2mo", "3mo", "6mo", "1y"] as const;

const USAGE_DELETE_MONTHS: Record<UsageDeleteOlderThan, number> = {
  "1mo": 1,
  "2mo": 2,
  "3mo": 3,
  "6mo": 6,
  "1y": 12,
};

const TOKENS_PER_MILLION = 1_000_000;

/** Resolved rates for one provider: optional default plus exact model overrides. */
export interface ProviderPricingEntry {
  default?: LlmModelPricing;
  models: Record<string, LlmModelPricing>;
}

/** Provider key → default and/or per-model USD per 1M tokens. */
export type ProviderPricingTable = Record<string, ProviderPricingEntry>;

/** SQLite UTC `YYYY-MM-DD HH:MM:SS` (matches `datetime('now')`). */
export function toSqliteUtcDatetime(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

/** UTC `YYYY-MM` for `year` + 1-based `month`. */
export function formatUtcYearMonth(year: number, month: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

/** Shift `now` by `deltaMonths` and return the UTC calendar month (1-based). */
export function shiftUtcMonth(now: Date, deltaMonths: number): { year: number; month: number } {
  const total = now.getUTCFullYear() * 12 + now.getUTCMonth() + deltaMonths;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return { year, month };
}

/**
 * Inclusive start of the last `n` UTC calendar months (`1` = first day of the current month).
 */
export function utcCalendarMonthsSince(n: number, now = new Date()): string {
  const safe = Math.max(1, Math.floor(n));
  const { year, month } = shiftUtcMonth(now, -(safe - 1));
  return `${formatUtcYearMonth(year, month)}-01 00:00:00`;
}

/**
 * Keep detailed `api_calls` from this UTC midnight minus 7 calendar days (inclusive).
 * Older rows are rolled into `api_totals`.
 */
export function usageDetailRetentionCutoff(now = new Date()): string {
  const startOfTodayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return toSqliteUtcDatetime(new Date(startOfTodayUtc - 7 * 86_400_000));
}

/** All-time and multi-month windows show monthly buckets; shorter windows stay daily. */
export function isUsageLongRange(sinceRaw?: string): boolean {
  const v = sinceRaw?.trim() ?? "";
  return v === "" || v === "2mo" || v === "3mo";
}

/** Whether monthly rollups can contribute rows older than the 7-day detail window. */
export function shouldIncludeApiTotals(since?: string, now = new Date()): boolean {
  if (!since?.trim()) {
    return true;
  }
  return since < usageDetailRetentionCutoff(now);
}

/** Inclusive `YYYY-MM` lower bound for `api_totals`, or `undefined` to include every month. */
export function apiTotalsMonthLowerBound(since?: string, now = new Date()): string | undefined {
  if (!since?.trim() || !shouldIncludeApiTotals(since, now)) {
    return undefined;
  }
  return since.slice(0, 7);
}

/**
 * Parse `--older-than` / dashboard delete presets (`all`, `1mo`, `2mo`, `3mo`, `6mo`, `1y`).
 */
export function parseUsageDeleteOlderThan(raw: string): UsageDeleteOlderThan | "all" {
  const v = raw.trim().toLowerCase();
  if (v === "all" || v === "clear") {
    return "all";
  }
  if ((USAGE_DELETE_PRESETS as readonly string[]).includes(v)) {
    return v as UsageDeleteOlderThan;
  }
  throw new Error(`Invalid older-than value: ${raw}`);
}

/**
 * First UTC calendar month to keep when deleting usage older than `preset`.
 * `1mo` keeps the current month; `2mo` keeps the current month plus the previous month.
 */
export function usageDeleteCutoffMonth(preset: UsageDeleteOlderThan, now = new Date()): string {
  const keep = USAGE_DELETE_MONTHS[preset];
  const { year, month } = shiftUtcMonth(now, -(keep - 1));
  return formatUtcYearMonth(year, month);
}

/**
 * Parse a `--since` / dashboard window into a SQLite UTC datetime.
 * Accepts `7d` / `24h` / `30m` / `1h` / `6h` / `12h`, calendar months (`1mo`, `2mo`, `3mo`),
 * `YYYY-MM-DD`, or an ISO timestamp.
 */
export function parseUsageSince(raw: string, now = new Date()): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Empty since value");
  }
  const months = /^(\d+)mo(?:nths?)?$/i.exec(trimmed);
  if (months) {
    const n = Number(months[1]);
    if (!Number.isFinite(n) || n < 1) {
      throw new Error(`Invalid since value: ${raw}`);
    }
    return utcCalendarMonthsSince(n, now);
  }
  const duration = /^(\d+)(d|h|m)$/i.exec(trimmed);
  if (duration) {
    const n = Number(duration[1]);
    const unit = duration[2]!.toLowerCase();
    const ms = unit === "d" ? n * 86_400_000 : unit === "h" ? n * 3_600_000 : n * 60_000;
    return toSqliteUtcDatetime(new Date(now.getTime() - ms));
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed} 00:00:00`;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid since value: ${raw}`);
  }
  return toSqliteUtcDatetime(parsed);
}

export function collectProviderPricing(
  providers: I18nConfig["providers"] | undefined
): ProviderPricingTable {
  const out: ProviderPricingTable = {};
  for (const [name, entry] of Object.entries(providers ?? {})) {
    const models = entry.modelPricing ?? {};
    const hasDefault = entry.pricing !== undefined;
    const hasModels = Object.keys(models).length > 0;
    if (!hasDefault && !hasModels) {
      continue;
    }
    out[name] = {
      ...(hasDefault ? { default: entry.pricing } : {}),
      models,
    };
  }
  return out;
}

export function hasAnyProviderPricing(table: ProviderPricingTable): boolean {
  return Object.values(table).some(
    (entry) => entry.default !== undefined || Object.keys(entry.models).length > 0
  );
}

/** Exact `modelPricing` entry, then the provider-wide `pricing` default. */
export function resolveModelPricing(
  provider: string,
  model: string,
  pricing: ProviderPricingTable
): LlmModelPricing | undefined {
  const entry = pricing[provider];
  if (!entry) {
    return undefined;
  }
  return entry.models[model] ?? entry.default;
}

export function estimateCostUsd(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  pricing: ProviderPricingTable
): number | undefined {
  const rates = resolveModelPricing(provider, model, pricing);
  if (!rates) {
    return undefined;
  }
  return (
    (inputTokens / TOKENS_PER_MILLION) * rates.inputPerMTokens +
    (outputTokens / TOKENS_PER_MILLION) * rates.outputPerMTokens
  );
}

function withRowEstimate<T extends ApiCallBreakdownRow & { provider: string; model: string }>(
  row: T,
  pricing: ProviderPricingTable
): T {
  if (row.inputTokensWithoutCost === 0 && row.outputTokensWithoutCost === 0) {
    return row;
  }
  const estimated = estimateCostUsd(
    row.provider,
    row.model,
    row.inputTokensWithoutCost,
    row.outputTokensWithoutCost,
    pricing
  );
  return estimated === undefined ? row : { ...row, estimatedCostUsd: estimated };
}

/**
 * Single display amount: stored `cost_usd` plus a report-time estimate for leftover
 * unpriced tokens. `undefined` when neither source applies (never `$0` for “unknown”).
 */
export function resolvedCostUsd(
  row: Pick<ApiCallBreakdownRow, "actualCostUsd" | "callsWithCost" | "estimatedCostUsd">
): number | undefined {
  const stored = row.callsWithCost > 0 ? row.actualCostUsd : undefined;
  const estimated = row.estimatedCostUsd;
  if (stored === undefined && estimated === undefined) {
    return undefined;
  }
  return (stored ?? 0) + (estimated ?? 0);
}

/** Attach report-time estimated costs (only for calls stored without `cost_usd`). */
export function withEstimatedCosts(
  stats: ApiCallStatsResult,
  pricing: ProviderPricingTable
): ApiCallStatsResult {
  if (!hasAnyProviderPricing(pricing)) {
    return stats;
  }
  const byModel = stats.byModel.map((row) => withRowEstimate(row, pricing));
  const byProvider = stats.byProvider.map((row) => {
    const models = byModel.filter((m) => m.provider === row.provider);
    const estimated = models.reduce((sum, m) => sum + (m.estimatedCostUsd ?? 0), 0);
    const any = models.some((m) => m.estimatedCostUsd !== undefined);
    return any ? { ...row, estimatedCostUsd: estimated } : row;
  });
  const summaryEstimated = byModel.reduce((sum, m) => sum + (m.estimatedCostUsd ?? 0), 0);
  const anyEstimated = byModel.some((m) => m.estimatedCostUsd !== undefined);
  return {
    ...stats,
    summary: anyEstimated
      ? { ...stats.summary, estimatedCostUsd: summaryEstimated }
      : stats.summary,
    byProvider,
    byModel,
  };
}
