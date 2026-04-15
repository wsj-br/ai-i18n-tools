/** Shared formatting helpers for CLI log output. */

import chalk from "chalk";

/** Prefix for the translate-docs / translate-ui header line listing OpenRouter models. */
export const MODELS_TRY_ORDER_LOG_PREFIX = "Models (try in order): ";

/** Total maximum line length (characters) for that header; continuation lines use {@link MODELS_TRY_ORDER_LOG_INDENT}. */
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

/** Prints the cyan/magenta “Models (try in order):” block with wrapping at {@link MODELS_TRY_ORDER_LOG_WIDTH}. */
export function printModelsTryInOrder(models: readonly string[]): void {
  if (models.length === 0) {
    return;
  }
  const parts = wrapCommaSeparatedListForWidth(
    models.join(", "),
    MODELS_TRY_ORDER_LOG_WIDTH - MODELS_TRY_ORDER_LOG_PREFIX.length,
    MODELS_TRY_ORDER_LOG_WIDTH - MODELS_TRY_ORDER_LOG_INDENT.length
  );
  const out = parts
    .map((p, i) =>
      i === 0
        ? chalk.cyan(MODELS_TRY_ORDER_LOG_PREFIX) + chalk.magenta(p)
        : MODELS_TRY_ORDER_LOG_INDENT + chalk.magenta(p)
    )
    .join("\n");
  console.log(out);
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
