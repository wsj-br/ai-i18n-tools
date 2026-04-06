import type { UiLanguageEntry } from "../core/ui-languages.js";

/** Minimal translate function (e.g. react-i18next `t`). */
export type TranslateFn = (key: string) => string;

/**
 * Display label for a language row: English (or Latin) name, then `t(englishName)` when it differs.
 * Same behavior as Transrewrt `src/renderer/utils/misc/languageDisplay.js` → `getUILanguageLabel`.
 *
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
 * Same behavior as Transrewrt `getUILanguageLabelNative` — e.g. header language menu:
 * `englishName / label` when they differ, else a single string.
 */
export function getUILanguageLabelNative(lang: UiLanguageEntry): string {
  const { englishName, label } = lang;
  if (label === englishName) {
    return label;
  }
  return `${englishName} / ${label}`;
}
