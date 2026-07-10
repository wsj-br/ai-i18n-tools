<a id="wire-i18next-at-runtime"></a>
# Wire i18next at runtime

Create your i18n setup file using the helpers exported by `'ai-i18n-tools/runtime'`. For API signatures, see [Runtime helpers](/guide/runtime-helpers).

<details>
<summary>Full i18n bootstrap example (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `languagesManifestPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

<a id="keeping-source_locale-aligned"></a>
## Keeping `SOURCE_LOCALE` aligned

**Keep three values aligned:** `sourceLocale` in `ai-i18n-tools.config.json`, `SOURCE_LOCALE` in this file, and the plural flat JSON `translate-ui` writes as `{sourceLocale}.json` under your flat output dir (often `public/locales/`). Use that same basename in the static `import` (example above: `en-GB` → `en-GB.json`). The `lng` field in `sourcePluralFlatBundle` must equal `SOURCE_LOCALE`. Static ES `import` paths cannot use variables; if you change the source locale, update `SOURCE_LOCALE` and the import path together. Alternatively, load that file with a dynamic `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, or `readFileSync` so the path is built from `SOURCE_LOCALE`.

The snippet uses `./locales/…` and `./public/locales/…` as if `i18n` sits beside those folders. If your file is under `src/` (typical), use `../locales/…` and `../public/locales/…` so imports resolve to the same paths as `ui.stringsJson`, `languagesManifestPath`, and `ui.flatOutputDir`.

Import `i18n.js` before React renders (e.g. at the top of your entry point). When the user changes language, call `await loadLocale(code)` then `await i18n.changeLanguage(code)`.

`SOURCE_LOCALE` is exported so any other file that needs it (e.g. a language switcher) can import it directly from `'./i18n'`. If you are migrating an existing i18next setup, replace any hardcoded source locale strings (e.g. `'en-GB'` checks scattered across components) with imports of `SOURCE_LOCALE` from your i18n bootstrap file.

Named imports (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) work the same if you prefer not to use the default export.

<a id="locale-loaders"></a>
## Locale loaders

Keep `localeLoaders` **aligned with config** by deriving them from `ui-languages.json` using `makeLocaleLoadersFromManifest` (this filters out `SOURCE_LOCALE` using the same normalisation as `makeLoadLocale`). When you add a locale to `targetLocales` and run `generate-ui-languages`, the manifest is updated and your loaders automatically track the change — there is no need to maintain a separate hardcoded map.

For JSON bundles under `public/` (the typical Next.js setup), fetch from your public URL path:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

For Node CLIs without a bundler, use `readFileSync` inside a small helper that reads and parses the JSON file for each code.

Use `setupKeyAsDefaultT` as the usual app entry point (key-trim + plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Calling `wrapI18nWithKeyTrim` alone is **deprecated** for application wiring — see [Runtime helpers](/guide/runtime-helpers).
