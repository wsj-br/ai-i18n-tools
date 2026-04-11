import type { UiLanguageEntry } from "../core/ui-languages.js";

/** Minimal translate function (e.g. react-i18next `t`). */
export type TranslateFn = (key: string) => string;

/**
 * Display label for a language row: `englishName`, or `englishName / t(englishName)` when
 * the translated name differs from the English name.
 * Uses `" / "` between parts (avoids nested parentheses in long names).
 */
export function getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string {
  const { englishName } = lang;
  const translated = t(englishName);
  if (translated === englishName) {
    return englishName;
  }
  return `${englishName} / ${translated}`;
}

/**
 * Display label using manifest fields only (no `t()` on the row).
 * Returns `englishName / label` when they differ (e.g. `German / Deutsch`),
 * or a single string when they are the same. Suitable for header language menus.
 */
export function getUILanguageLabelNative(lang: UiLanguageEntry): string {
  const { englishName, label } = lang;
  if (label === englishName) {
    return label;
  }
  return `${englishName} / ${label}`;
}
