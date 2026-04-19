/**
 * Browser / Next.js client i18next bootstrap for ai-i18n-tools (see docs/GETTING_STARTED.md, Step 4).
 *
 * `stringsJson` and `ui-languages.json` match `ui.stringsJson` / `flatOutputDir` in
 * `ai-i18n-tools.config.json`; flat bundles are under `public/locales/` so they are
 * served at `/locales/*.json` and loaded with `fetch` (recommended in the docs for Next).
 */

import aiI18n from "ai-i18n-tools/runtime";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enGbPluralBundle from "../../public/locales/en-GB.json";
import stringsJson from "../../locales/strings.json";
import uiLanguages from "../../locales/ui-languages.json";

/** Must match `sourceLocale` in `ai-i18n-tools.config.json` and `en-GB.json` import path under `public/locales/`. */
export const SOURCE_LOCALE = "en-GB";

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson: stringsJson as Record<string, { plural?: boolean; source?: string }>,
  sourcePluralFlatBundle: {
    lng: SOURCE_LOCALE,
    bundle: enGbPluralBundle as Record<string, string>,
  },
});

/** `applyDirection` matches GETTING_STARTED; `lang` on `<html>` is extra (a11y / SEO) for web apps. */
function applyDocumentLocale(lng: string) {
  aiI18n.applyDirection(lng);
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("lang", lng);
  }
}

i18n.on("languageChanged", applyDocumentLocale);
applyDocumentLocale(i18n.language);

/** Loads JSON from `public/locales` at runtime (same files `translate-ui` writes to `flatOutputDir`). */
function makeFetchLoader(localeCode: string) {
  return async () => {
    const res = await fetch(`/locales/${localeCode}.json`);
    if (!res.ok) {
      throw new Error(`Failed to load locale ${localeCode}: ${res.status}`);
    }
    return res.json() as Promise<Record<string, string>>;
  };
}

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  makeFetchLoader,
);

/** Call `await loadLocale(code)` then `i18n.changeLanguage(code)` when the user picks a language. */
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
