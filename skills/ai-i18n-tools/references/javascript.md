# JavaScript / TypeScript UI

Read this for source-string UI or HTML markers. Preserve an existing nested-key i18next setup; use the JSON reference rather than converting it unnecessarily.

## Setup and extraction

- Install the ESM package locally when importing `ai-i18n-tools/runtime`. Install `i18next` separately, plus `react-i18next` for React; these are not supplied by the tool.
- For new configuration, choose the appropriate template: `ui-markdown` includes UI and README, `ui-astro-website` is UI-only, and `ui-plain-html` is for HTML markers. Inspect template output before syncing. Never overwrite existing config with `init`.
- Configure `ui.sourceRoots`, `ui.stringsJson`, and `ui.flatOutputDir`. `ui` can be one block or an array of independent catalogs.
- Wrap user-facing strings with literal `t("Save")` / `i18n.t("Save")`. Custom function names belong in `ui.uiExtractor.funcNames`; include source extensions in `ui.uiExtractor.extensions`.
- Use `t("Hello {{name}}", { name })`, not a template literal evaluated before lookup. Translate option lists when rendered or recomputed for the current locale, not once at module initialization.
- Do not wrap paths, IDs, machine values, or already translated content. Variables passed as keys are not discovered automatically.

Run the configured workflow:

```bash
ai-i18n-tools sync
```

## i18next wiring

Keep config `sourceLocale` and the runtime source locale identical. The following non-React sketch assumes generated catalog/manifest paths adjacent to the bootstrap; adapt paths to your config and bundler.

```js
import i18next from 'i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import stringsJson from './strings.json';
import uiLanguages from './ui-languages.json';

const sourceLocale = 'en-GB';
const i18n = i18next.createInstance();
await i18n.init(aiI18n.defaultI18nInitOptions(sourceLocale));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });
const loaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  sourceLocale,
  (code) => () => import(`./locales/${code}.json`),
);
const loadLocale = aiI18n.makeLoadLocale(i18n, loaders, sourceLocale);
```

This sketch has no plural source bundle. For React, attach `initReactI18next` before initialization and initialize before rendering. Dynamic JSON imports depend on the bundler; use supported static maps/globs or fetch public bundles with HTTP-error checks where needed. Native Node JSON imports require the appropriate import attributes or filesystem loading.

- Switch with `await loadLocale(code)` followed by `await i18n.changeLanguage(code)`; also load the saved/startup locale before the first render.
- Use `applyDirection` once at browser initialization and on `languageChanged`; use `getTextDirection` for layout decisions. Persist language selection using the app's existing convention.
- SSR must isolate mutable language state per request. Avoid changing a shared singleton for different users; keep server/client startup locales consistent to prevent hydration mismatch.
- UI extraction during `sync` also writes the language manifest; `generate-ui-languages` is available for a targeted refresh. Set `languagesManifestPath` explicitly for predictable placement; keep it aligned with `targetLocales` and framework routes. Adding a config locale does not update routing code.

## Catalogs, plurals, and static lookup

`strings.json` contains tooling rows keyed by MD5-8 for ordinary source messages. It is not the runtime flat bundle. `setupKeyAsDefaultT` intentionally reads this catalog for its mappings; a custom static `makeT` helper should read the flat bundle instead.

Ordinary flat lookup is `flat[sourceMessage] ?? sourceMessage`, never lookup by MD5. Preserve the source spelling and punctuation. Missing translations fall back to the source language.

For source-string plural handling, use the supported `t('…', { plurals: true, count })` pattern and `setupKeyAsDefaultT`; do not manually construct suffix mappings. When plural strings exist, UI translation writes a source-locale plural flat file. Load it and pass `sourcePluralFlatBundle: { lng: sourceLocale, bundle: sourcePluralFlat }` when setting up the helper. Without plurals, omit that option and do not import a nonexistent source-locale JSON file.

## HTML and Astro

- HTML UI extraction recognizes `data-i18n` and supported attribute markers such as `data-i18n-title`, `data-i18n-placeholder`, `data-i18n-alt`, and `data-i18n-aria-label`. Include `.html`/`.htm` in extractor extensions.
- `mark-html` previews marker insertion; `--write` edits source. The browser runtime is `ai-i18n-tools/html-runtime/i18n.js` and must be served/bundled for the browser, not assumed to resolve as a bare browser import.
- `data-i18n-locale-src` and `data-i18n-locale-href` are runtime-only asset/link behavior, not extracted messages.
- Per-locale HTML pages belong to Documents, not HTML UI markers. Astro may combine Documents for page markup and UI for `t()` data. Documents protects `t()` arguments and does not translate Astro frontmatter.
- In Astro/static helpers, map route locale codes to actual BCP-47 bundle filenames; do not assume `pt-br` and `pt-BR` paths are interchangeable.

## Verification and maintenance

After source or target-locale changes, run `sync`, review artifacts, and build. Test startup/switching, source fallback, interpolation, plural categories, and RTL. Ensure runtime bundles are included in production packaging. Pin upgrades through the project's package manager; preserve bootstrap customizations and refresh copied skill references from the matching release.

Details: [JS/TS onboarding](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-js), [i18next runtime](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime), [runtime helpers](https://wsj-br.github.io/ai-i18n-tools/guide/runtime-helpers), [Astro hybrid](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/astro-website).
