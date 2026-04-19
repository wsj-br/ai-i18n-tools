/**
 * Default `--emphasis-placeholders` behavior for markdown document translation:
 * on for CJK and RTL target locales unless overridden by config or CLI.
 */

import type { DocumentationBlock, I18nConfig } from "./types.js";
import { normalizeLocale, primaryLanguageSubtag } from "./locale-utils.js";

/** CLI flags mirrored on translate-docs `TranslateRunOptions`. */
export type MarkdownEmphasisCliFlags = {
  emphasisPlaceholdersCli?: boolean;
  noEmphasisPlaceholdersCli?: boolean;
};

/** Primary language subtags commonly written with Han characters (emphasis edge cases). */
const CJK_PRIMARY = new Set(["zh", "ja", "ko"]);

/**
 * Primary subtags for predominantly right-to-left languages (Unicode/bidi).
 * Union with {@link I18nConfig.rtlLocales} when matching locales.
 */
const DEFAULT_RTL_PRIMARY = new Set([
  "ar",
  "he",
  "fa",
  "ur",
  "yi",
  "dv",
  "ps",
  "sd",
  "ug",
  "ckb",
  "ku",
  "mzn",
  "lrc",
]);

function localeMatchesRtlList(locale: string, rtlLocales: readonly string[] | undefined): boolean {
  if (!rtlLocales?.length) {
    return false;
  }
  const nLoc = normalizeLocale(locale);
  const prim = primaryLanguageSubtag(locale);
  for (const r of rtlLocales) {
    if (!r.trim()) {
      continue;
    }
    const nR = normalizeLocale(r);
    if (nLoc === nR || primaryLanguageSubtag(r) === prim) {
      return true;
    }
  }
  return false;
}

/**
 * Whether the locale should use markdown emphasis placeholder masking by default
 * (when no `documentations[].emphasisPlaceholders` or CLI override applies).
 */
export function localeUsesDefaultEmphasisPlaceholders(
  locale: string,
  rtlLocales: string[] | undefined
): boolean {
  const prim = primaryLanguageSubtag(locale);
  if (CJK_PRIMARY.has(prim)) {
    return true;
  }
  if (DEFAULT_RTL_PRIMARY.has(prim)) {
    return true;
  }
  return localeMatchesRtlList(locale, rtlLocales);
}

export function resolveMarkdownEmphasisPlaceholders(
  locale: string,
  documentation: DocumentationBlock,
  config: Pick<I18nConfig, "rtlLocales">,
  opts: MarkdownEmphasisCliFlags
): boolean {
  if (documentation.emphasisPlaceholders === true) {
    return true;
  }
  if (documentation.emphasisPlaceholders === false) {
    return false;
  }
  if (opts.noEmphasisPlaceholdersCli) {
    return false;
  }
  if (opts.emphasisPlaceholdersCli) {
    return true;
  }
  return localeUsesDefaultEmphasisPlaceholders(locale, config.rtlLocales);
}

/**
 * True when emphasis masking is on solely because of the CJK/RTL locale default
 * (no `documentations[].emphasisPlaceholders`, no `--emphasis-placeholders` / `--no-emphasis-placeholders`).
 */
export function usesAutomaticEmphasisPlaceholdersForLocale(
  locale: string,
  documentation: DocumentationBlock,
  config: Pick<I18nConfig, "rtlLocales">,
  opts: MarkdownEmphasisCliFlags
): boolean {
  if (documentation.emphasisPlaceholders !== undefined) {
    return false;
  }
  if (opts.emphasisPlaceholdersCli || opts.noEmphasisPlaceholdersCli) {
    return false;
  }
  return localeUsesDefaultEmphasisPlaceholders(locale, config.rtlLocales);
}

/** Single-line summary for `translate-docs` / `sync` header output. */
export function describeEmphasisPlaceholdersPolicy(
  documentation: DocumentationBlock,
  opts: MarkdownEmphasisCliFlags
): string {
  if (documentation.emphasisPlaceholders === true) {
    return "on (documentations[].emphasisPlaceholders)";
  }
  if (documentation.emphasisPlaceholders === false) {
    return "off (documentations[].emphasisPlaceholders)";
  }
  if (opts.noEmphasisPlaceholdersCli) {
    return "off (--no-emphasis-placeholders)";
  }
  if (opts.emphasisPlaceholdersCli) {
    return "on (--emphasis-placeholders)";
  }
  return "auto (on for CJK & RTL locales)";
}
