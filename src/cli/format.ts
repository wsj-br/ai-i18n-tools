/** Shared formatting helpers for CLI log output. */

import chalk from "chalk";
import { normalizeLocale } from "../core/config.js";
import { t } from "../i18n/index.js";

/**
 * Total maximum line length (characters) for the `Models (try in order):` header;
 * continuation lines use {@link MODELS_TRY_ORDER_LOG_INDENT}.
 */
export const MODELS_TRY_ORDER_LOG_WIDTH = 100;

/** Indent for wrapped continuation lines (4 spaces). */
export const MODELS_TRY_ORDER_LOG_INDENT = "    ";

/**
 * Breaks a comma-separated list at `", "` boundaries so each line’s content fits the given widths.
 * Used for plain text before applying terminal colors.
 */
export function wrapCommaSeparatedListForWidth(
  text: string,
  firstLineContentMax: number,
  continuationContentMax: number
): string[] {
  const safeFirst = Math.max(1, firstLineContentMax);
  const safeCont = Math.max(1, continuationContentMax);
  if (text.length === 0) {
    return [];
  }
  const lines: string[] = [];
  let remaining = text;
  let max = safeFirst;

  while (remaining.length > 0) {
    if (remaining.length <= max) {
      lines.push(remaining);
      break;
    }
    const cut = remaining.lastIndexOf(", ", max);
    if (cut === -1) {
      lines.push(remaining.slice(0, max));
      remaining = remaining.slice(max);
    } else {
      lines.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut + 2).replace(/^\s*/, "");
    }
    max = safeCont;
  }
  return lines;
}

function printLabeledModelList(label: string, models: readonly string[]): void {
  if (models.length === 0) {
    return;
  }
  const modelsPrefix = `${label} `;
  const parts = wrapCommaSeparatedListForWidth(
    models.join(", "),
    MODELS_TRY_ORDER_LOG_WIDTH - modelsPrefix.length,
    MODELS_TRY_ORDER_LOG_WIDTH - MODELS_TRY_ORDER_LOG_INDENT.length
  );
  const out = parts
    .map((p, i) =>
      i === 0
        ? chalk.cyan(modelsPrefix) + chalk.magenta(p)
        : MODELS_TRY_ORDER_LOG_INDENT + chalk.magenta(p)
    )
    .join("\n");
  console.log(out);
}

export interface LocaleModelRow {
  locale: string;
  models: readonly string[];
}

export interface PrintTranslationModelSummaryOptions {
  /** Resolved fallback chain for this run (first line). */
  resolvedModels: readonly string[];
  provider?: string;
  /** UI-only tier from config; omitted when empty or not applicable. */
  uiModels?: readonly string[];
  /** Per-locale overrides for locales in this run. */
  localeModels?: readonly LocaleModelRow[];
}

/** Locale model rows from config that apply to the given target locales. */
export function localeModelRowsForRun(
  localeMap: ReadonlyMap<string, readonly string[]>,
  locales: readonly string[]
): LocaleModelRow[] {
  const localeSet = new Set(locales.map((loc) => normalizeLocale(loc)));
  const rows: LocaleModelRow[] = [];
  for (const [locale, models] of localeMap) {
    if (localeSet.has(locale) && models.length > 0) {
      rows.push({ locale, models });
    }
  }
  return rows;
}

/**
 * Prints the resolved model fallback chain, then optional `uiModels` and per-locale `localeModels`
 * tiers from config (when provided).
 */
export function printTranslationModelSummary(opts: PrintTranslationModelSummaryOptions): void {
  printModelsTryInOrder(opts.resolvedModels, opts.provider);
  const uiModels = opts.uiModels ?? [];
  if (uiModels.length > 0) {
    printLabeledModelList(t("UI models (try in order):"), uiModels);
  }
  for (const row of opts.localeModels ?? []) {
    if (row.models.length > 0) {
      printLabeledModelList(t("Locale models ({{locale}}):", { locale: row.locale }), row.models);
    }
  }
}

/**
 * Prints the cyan/magenta “Models (try in order):” block with wrapping at
 * {@link MODELS_TRY_ORDER_LOG_WIDTH}. When `provider` is given, a `Provider: <name>` line is printed
 * first so the output makes clear which LLM provider the listed models belong to.
 */
export function printModelsTryInOrder(models: readonly string[], provider?: string): void {
  if (models.length === 0) {
    return;
  }
  const providerName = provider?.trim();
  if (providerName) {
    console.log(chalk.cyan(t("Provider:") + " ") + chalk.magenta(providerName));
  }
  printLabeledModelList(t("Models (try in order):"), models);
}

/** Returns current time as HH:MM:SS. */
export function timestamp(): string {
  return new Date().toTimeString().slice(0, 8);
}

/** Format elapsed milliseconds as MM:SS (minutes and seconds, zero-padded). */
export function formatElapsedMmSs(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Suffix for summary lines: cache hit rate as a percentage of
 * (segments from cache + segments newly translated).
 * Returns empty string when there are no segments.
 */
export function formatSegmentCacheHitSuffix(
  segmentsCached: number | undefined,
  segmentsTranslated: number | undefined
): string {
  const cached = segmentsCached ?? 0;
  const translated = segmentsTranslated ?? 0;
  const total = cached + translated;
  if (total === 0) {
    return "";
  }
  const pct = (cached / total) * 100;
  return ` (${pct.toFixed(1)}% cache hit)`;
}

/** Format elapsed milliseconds as HH:MM:SS. */
export function formatElapsedHhMmSs(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
