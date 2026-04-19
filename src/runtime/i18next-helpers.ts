import { normalizeLocale } from "../core/locale-utils.js";
import { interpolateTemplate } from "./template.js";
import { getTextDirectionFromBundledCatalog } from "./ui-languages-master-direction.js";

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
 * import stringsJson from './locales/strings.json';
 * // Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
 * import sourcePluralFlat from './public/locales/en-GB.json';
 * import aiI18n from 'ai-i18n-tools/runtime';
 * // Direction comes from bundled data/ui-languages-complete.json — not from project ui-languages.json.
 *
 * // Must match sourceLocale in ai-i18n-tools.config.json
 * export const SOURCE_LOCALE = 'en-GB';
 *
 * void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
 * aiI18n.setupKeyAsDefaultT(i18n, {
 *   stringsJson,
 *   sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
 * });
 * i18n.on('languageChanged', aiI18n.applyDirection);
 * aiI18n.applyDirection(i18n.language);
 *
 * const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
 *   uiLanguages,
 *   SOURCE_LOCALE,
 *   (code) => () => import(`./locales/${code}.json`)
 * );
 * export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
 * export default i18n;
 * ```
 */

/**
 * BCP-47 base language codes that use a right-to-left script.
 * Covers Arabic script (ar, fa, ur, ps, sd, ug), Hebrew (he, yi), Syriac (syr, aii, cld),
 * Thaana (dv), Adlam (ff), N'Ko (nqo), Hanifi Rohingya (rhg).
 */
export const RTL_LANGS: ReadonlySet<string> = new Set([
  "ar",
  "he",
  "fa",
  "ur",
  "yi",
  "ps",
  "sd",
  "ug",
  "dv",
  "ff",
  "syr",
  "aii",
  "cld",
  "rhg",
  "nqo",
]);

/**
 * Detect text direction from a locale code.
 * Uses the bundled `data/ui-languages-complete.json` catalog (same source as the extract-generated manifest),
 * then falls back to {@link RTL_LANGS} for codes missing from the catalog.
 *
 * @example getTextDirection('ar')      // 'rtl'
 * @example getTextDirection('fa-IR')   // 'rtl'
 * @example getTextDirection('en-GB')   // 'ltr'
 */
export function getTextDirection(lng: string): "ltr" | "rtl" {
  const fromCatalog = getTextDirectionFromBundledCatalog(lng);
  if (fromCatalog !== undefined) {
    return fromCatalog;
  }
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
 *
 * `t` is typed loosely so real **`i18next`** **`TFunction`** overloads assign without casts.
 */
export interface I18nLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- i18next `TFunction` overloads are not assignable to a single narrow signature
  t: any;
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
 * @deprecated For application wiring use {@link setupKeyAsDefaultT} with your extracted **`strings.json`** — it installs this wrapper together with plural-aware {@link wrapT}. Low-level use remains valid for tests or custom stacks.
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

/** Placeholder names inside `{{ ... }}` (used by {@link wrapT} for optional `count` injection). */
export function extractInterpolationNamesForWrap(message: string): string[] {
  const re = /\{\{\s*([^}]+?)\s*\}\}/g;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(message)) !== null) {
    const inner = m[1]?.trim() ?? "";
    if (inner) {
      names.push(inner);
    }
  }
  return names;
}

/**
 * Build `literal → groupId` map from `strings.json` for use with {@link wrapT}.
 * Only rows with `"plural": true` participate.
 */
export function buildPluralIndexFromStringsJson(
  entries: Record<string, { plural?: boolean; source?: string }>
): Record<string, string> {
  const idx: Record<string, string> = {};
  for (const [id, row] of Object.entries(entries)) {
    if (row.plural === true && typeof row.source === "string" && row.source.trim() !== "") {
      idx[row.source.trim()] = id;
    }
  }
  return idx;
}

export interface WrapTOptions {
  pluralIndex: Record<string, string>;
}

/** Options for {@link setupKeyAsDefaultT}. */
export interface SetupKeyAsDefaultTOptions {
  /** Parsed **`strings.json`** from extract (same shape as the glossary catalog). */
  stringsJson: Record<string, { plural?: boolean; source?: string }>;
  /**
   * Optional: merge **`translate-ui`** output **`{sourceLocale}.json`** (plural suffixed keys only)
   * into i18next so the source locale resolves `_one` / `_other` / … Requires **`addResourceBundle`** on **`i18n`**.
   */
  sourcePluralFlatBundle?: {
    lng: string;
    bundle: Record<string, string>;
  };
}

/**
 * Standard ai-i18n-tools wiring for key-as-default **`t()`**: applies {@link wrapI18nWithKeyTrim}, optionally
 * registers the source-locale plural flat bundle, then applies {@link wrapT} using {@link buildPluralIndexFromStringsJson}.
 *
 * Call after **`i18n.init(defaultI18nInitOptions(…))`** (and after **`use(initReactI18next)`** when using React).
 */
export function setupKeyAsDefaultT(
  i18n: I18nLike & Partial<Pick<I18nWithResources, "addResourceBundle">>,
  options: SetupKeyAsDefaultTOptions
): void {
  const { stringsJson, sourcePluralFlatBundle } = options;

  wrapI18nWithKeyTrim(i18n);

  if (sourcePluralFlatBundle) {
    const withBundle = i18n as I18nWithResources;
    if (typeof withBundle.addResourceBundle !== "function") {
      throw new Error(
        "setupKeyAsDefaultT: sourcePluralFlatBundle requires an i18next instance with addResourceBundle()"
      );
    }
    withBundle.addResourceBundle(
      sourcePluralFlatBundle.lng,
      "translation",
      sourcePluralFlatBundle.bundle,
      true,
      true
    );
  }

  wrapT(i18n, {
    pluralIndex: buildPluralIndexFromStringsJson(stringsJson),
  });
}

/**
 * Wrap `i18n.t` for cardinal plural groups emitted by `translate-ui`:
 * strips tooling-only `plurals` / `zeroDigit`, maps the original literal key to the group id when present in `pluralIndex`,
 * and forwards `count` (with optional injection from a single non-`{{count}}` placeholder).
 * Pair with suffixed keys in locale JSON (`&lt;id&gt;_one`, …). Apply after {@link wrapI18nWithKeyTrim} if both are used.
 */
export function wrapT(i18n: I18nLike, options: WrapTOptions): void {
  const originalT = i18n.t.bind(i18n) as (...args: unknown[]) => string;
  i18n.t = function (key: string, ...rest: unknown[]): string {
    const literal = typeof key === "string" ? key.trim() : String(key);
    const opt0 = rest[0];

    if (
      opt0 !== null &&
      typeof opt0 === "object" &&
      !Array.isArray(opt0) &&
      (opt0 as Record<string, unknown>).plurals === true
    ) {
      const raw = opt0 as Record<string, unknown>;
      const nextOpts: Record<string, unknown> = { ...raw };
      delete nextOpts.plurals;
      delete nextOpts.zeroDigit;

      let lookupKey = literal;
      const gid = options.pluralIndex[literal];
      if (gid) {
        lookupKey = gid;
      }

      if (nextOpts.count === undefined) {
        const placeholders = extractInterpolationNamesForWrap(literal);
        if (placeholders.length === 1 && placeholders[0] !== "count") {
          const name = placeholders[0]!;
          const v = nextOpts[name];
          if (typeof v === "number") {
            nextOpts.count = v;
          }
        }
      }

      return originalT(lookupKey, nextOpts, ...rest.slice(1));
    }

    return originalT(key, ...rest);
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

/** Manifest row: at least **`code`** (matches entries in **`ui-languages.json`**). */
export type UiLanguageManifestRow = { readonly code: string };

/**
 * Build the locale → async loader map expected by {@link makeLoadLocale} from **`ui-languages.json`**
 * (or any **`{ code }[]`**): one loader per **`code`** except **`sourceLocale`** (normalized comparison).
 *
 * Provide **`makeLoaderForLocale`** for your environment (**`fetch`**, dynamic **`import()`**, **`readFileSync`** wrapper, …).
 */
export function makeLocaleLoadersFromManifest(
  manifest: readonly UiLanguageManifestRow[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<{ default?: unknown } | unknown>
): Record<string, () => Promise<{ default?: unknown } | unknown>> {
  const srcNorm = normalizeLocale(sourceLocale);
  return Object.fromEntries(
    manifest
      .filter(({ code }) => normalizeLocale(code) !== srcNorm)
      .map(({ code }) => {
        const c = code.trim();
        return [c, makeLoaderForLocale(c)];
      })
  );
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
 * const localeLoaders = makeLocaleLoadersFromManifest(
 *   uiLanguages,
 *   SOURCE_LOCALE,
 *   (code) => () => import(`./locales/${code}.json`)
 * );
 * export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
 *
 * // Later, when the user changes language:
 * await loadLocale('de');
 * i18n.changeLanguage('de');
 * ```
 */
export function makeLoadLocale(
  i18n: I18nLike & Pick<I18nWithResources, "addResourceBundle">,
  localeLoaders: Record<string, () => Promise<{ default?: unknown } | unknown>>,
  sourceLocale = "en"
): (lang: string) => Promise<void> {
  return async function loadLocale(lang: string): Promise<void> {
    if (normalizeLocale(lang) === normalizeLocale(sourceLocale)) return;
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
