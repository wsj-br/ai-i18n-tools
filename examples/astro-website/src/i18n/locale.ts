import uiLanguages from "./ui-languages.json";

export type UiLanguageRow = (typeof uiLanguages)[number];

/** Match Astro route locale (`zh-cn`) to manifest codes (`zh-CN`). */
export function normalizeAstroLocale(code: string): string {
  return code.trim().toLowerCase();
}

/** Row from `ui-languages.json` for the active Astro locale (falls back to source locale). */
export function resolveUiLanguage(locale: string | undefined): UiLanguageRow {
  const key = normalizeAstroLocale(locale ?? "en");
  const row = uiLanguages.find((entry) => normalizeAstroLocale(entry.code) === key);
  if (row) {
    return row;
  }
  return uiLanguages.find((entry) => entry.isSourceLocale) ?? uiLanguages[0]!;
}
