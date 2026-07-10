import uiLanguages from "./ui-languages.json";

export type UiLanguageRow = (typeof uiLanguages)[number];

/** Canonical key aligning Astro route segments with manifest BCP-47 codes. */
function canonicalLocaleKey(code: string): string {
  const key = code.trim().toLowerCase();
  if (key === "zh-hans" || key === "zh-cn") {
    return "zh-cn";
  }
  if (key === "zh-hant" || key === "zh-tw") {
    return "zh-tw";
  }
  return key;
}

/** Astro i18n route segment for `getRelativeLocaleUrl` (e.g. `zh-Hans` → `zh-cn`). */
export function toAstroRouteLocale(code: string): string {
  return canonicalLocaleKey(code);
}

/** @deprecated Use {@link toAstroRouteLocale}; kept for call sites that already import this name. */
export function normalizeAstroLocale(code: string): string {
  return toAstroRouteLocale(code);
}

/** Row from `ui-languages.json` for the active Astro locale (falls back to source locale). */
export function resolveUiLanguage(locale: string | undefined): UiLanguageRow {
  const key = canonicalLocaleKey(locale ?? "en");
  const row = uiLanguages.find((entry) => canonicalLocaleKey(entry.code) === key);
  if (row) {
    return row;
  }
  return uiLanguages.find((entry) => entry.isSourceLocale) ?? uiLanguages[0]!;
}
