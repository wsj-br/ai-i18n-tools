import { interpolateTemplate } from "./template.js";

/**
 * Framework-agnostic i18next setup helpers for key-as-default projects.
 *
 * These helpers do NOT import from `i18next` or `react-i18next` directly -
 * they accept a loose `I18nLike` interface so you are not locked to a specific version.
 *
 * Typical usage in a React / Next.js project:
 *
 * ```js
 * // src/i18n.js
 * import i18n from 'i18next';
 * import { initReactI18next } from 'react-i18next';
 * import uiLanguages from './locales/ui-languages.json';
 * import {
 *   defaultI18nInitOptions, wrapI18nWithKeyTrim,
 *   makeLoadLocale, applyDirection,
 * } from 'ai-i18n-tools/runtime';
 *
 * // Must match sourceLocale in ai-i18n-tools.config.json
 * export const SOURCE_LOCALE = 'en-GB';
 *
 * void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
 * wrapI18nWithKeyTrim(i18n);
 * i18n.on('languageChanged', applyDirection);
 * applyDirection(i18n.language);
 *
 * const localeLoaders = Object.fromEntries(
 *   uiLanguages
 *     .filter(({ code }) => code !== SOURCE_LOCALE)
 *     .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
 * );
 * export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
 * export default i18n;
 * ```
 */

/**
 * BCP-47 base language codes that use a right-to-left script.
 * Covers Arabic script (ar, fa, ur, ps, sd, ug), Hebrew (he, yi), Syriac (syr, aii, cld),
 * Thaana (dv), Adlam (ff), N'Ko (nqo), Hanifi Rohingya (rhg).
 */
export const RTL_LANGS: ReadonlySet<string> = new Set([
  "ar", "he", "fa", "ur", "yi",
  "ps", "sd", "ug",
  "dv",
  "ff",
  "syr", "aii", "cld",
  "rhg", "nqo",
]);

/**
 * Detect text direction from a BCP-47 locale code.
 * Strips region/script subtags and checks the base language against {@link RTL_LANGS}.
 *
 * @example getTextDirection('ar')      // 'rtl'
 * @example getTextDirection('fa-IR')   // 'rtl'
 * @example getTextDirection('en-GB')   // 'ltr'
 */
export function getTextDirection(lng: string): "ltr" | "rtl" {
  const base = (lng && lng.split(/[-_]/)[0]) || "";
  return RTL_LANGS.has(base) ? "rtl" : "ltr";
}

/**
 * Minimal DOM interface needed by {@link applyDirection}. Compatible with the browser
 * `Element` type without requiring a `lib: ["dom"]` tsconfig entry.
 */
export interface DirectionTarget {
  setAttribute(name: string, value: string): void;
}

/**
 * Set the `dir` attribute on an element (defaults to `document.documentElement`).
 * Safe to call in Node.js - checks for `document` existence before accessing DOM.
 *
 * @example i18n.on('languageChanged', applyDirection);
 */
export function applyDirection(lng: string, element?: DirectionTarget): void {
  const dir = getTextDirection(lng);
  if (element) {
    element.setAttribute("dir", dir);
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = (globalThis as Record<string, any>)["document"] as
    | { documentElement?: DirectionTarget }
    | undefined;
  if (doc?.documentElement) {
    doc.documentElement.setAttribute("dir", dir);
  }
}

/**
 * Standard i18next `init()` options for key-as-default projects.
 *
 * - `parseMissingKeyHandler` returns the key itself, so missing translations
 *   display the source-language string rather than an error.
 * - `nsSeparator: false` allows keys that contain colons (e.g. `"Label:"`).
 * - `interpolation.escapeValue: false` - safe to disable: React escapes values itself,
 *   and Node.js / CLI output has no HTML to escape.
 *
 * Spread into `i18n.init()`:
 * ```js
 * i18n.use(initReactI18next).init(defaultI18nInitOptions('en-GB'));
 * ```
 *
 * @param sourceLocale - BCP-47 code used as `lng` and `fallbackLng`. Defaults to `'en'`.
 */
export function defaultI18nInitOptions(sourceLocale = "en"): {
  resources: Record<string, never>;
  lng: string;
  fallbackLng: string;
  parseMissingKeyHandler: (key: string) => string;
  interpolation: { escapeValue: false };
  nsSeparator: false;
} {
  return {
    resources: {},
    lng: sourceLocale,
    fallbackLng: sourceLocale,
    parseMissingKeyHandler: (key: string) => key,
    interpolation: { escapeValue: false },
    nsSeparator: false,
  };
}

/**
 * Minimal interface for an i18next instance (or any compatible translate object).
 * Accepts the full i18next instance without requiring an import of `i18next` itself.
 */
export interface I18nLike {
  t: (key: string, ...rest: unknown[]) => string;
}

/**
 * Wrap `i18n.t` so that:
 * 1. Keys are trimmed before lookup - the extract script stores keys trimmed
 *    (e.g. `"Label"` not `"Label "`), so `t("Label ")` would miss the cache without this.
 * 2. Source-locale `{{var}}` interpolation is applied as a fallback - in key-as-default
 *    mode `parseMissingKeyHandler` returns the raw key string without running
 *    interpolation, so `t("Hello {{name}}", { name })` would return `"Hello {{name}}"`
 *    instead of `"Hello World"` for the source locale. This wrapper detects that case
 *    (result === trimmed key) and applies `interpolateTemplate` automatically.
 *
 * Mutates the `t` property on the passed instance in-place.
 *
 * @example wrapI18nWithKeyTrim(i18n);
 */
export function wrapI18nWithKeyTrim(i18n: I18nLike): void {
  const originalT = i18n.t.bind(i18n) as (...args: unknown[]) => string;
  i18n.t = function (key: string, ...rest: unknown[]): string {
    const normalizedKey = typeof key === "string" ? key.trim() : key;
    const result = originalT(normalizedKey, ...rest);
    const options = rest[0];
    if (
      result === normalizedKey &&
      options !== null &&
      typeof options === "object" &&
      !Array.isArray(options)
    ) {
      return interpolateTemplate(result, options as Record<string, string | number | boolean>);
    }
    return result;
  };
}

/**
 * Extended i18next interface that includes the resource bundle API needed by `makeLoadLocale`.
 */
export interface I18nWithResources extends I18nLike {
  addResourceBundle(
    lng: string,
    ns: string,
    resources: Record<string, string>,
    deep?: boolean,
    overwrite?: boolean
  ): void;
}

/**
 * Create a `loadLocale(lang)` function for dynamic locale loading.
 *
 * Pass a map of `{ [localeCode]: () => import('./locales/<code>.json') }` and the
 * returned function handles loading on demand, skipping the source locale (no file needed).
 *
 * @param i18n - i18next instance (must have `addResourceBundle`).
 * @param localeLoaders - map of locale code → dynamic import factory.
 * @param sourceLocale - locale code that requires no file (key-as-default); defaults to `'en'`.
 *
 * @example
 * ```js
 * const localeLoaders = Object.fromEntries(
 *   uiLanguages
 *     .filter(({ code }) => code !== SOURCE_LOCALE)
 *     .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
 * );
 * export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
 *
 * // Later, when the user changes language:
 * await loadLocale('de');
 * i18n.changeLanguage('de');
 * ```
 */
export function makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<{ default?: unknown } | unknown>>,
  sourceLocale = "en"
): (lang: string) => Promise<void> {
  return async function loadLocale(lang: string): Promise<void> {
    if (lang === sourceLocale || lang === "en") return;
    const loader = localeLoaders[lang];
    if (!loader) {
      console.warn("[i18n] locale not supported:", lang);
      return;
    }
    try {
      const module = await loader();
      const data =
        module !== null &&
        typeof module === "object" &&
        "default" in module &&
        module.default !== undefined
          ? (module.default as Record<string, string>)
          : (module as Record<string, string>);
      i18n.addResourceBundle(lang, "translation", data, true, true);
    } catch (e) {
      console.warn("[i18n] locale not found:", lang, e instanceof Error ? e.message : e);
    }
  };
}
