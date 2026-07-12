<a id="runtime-helpers"></a>
# Runtime helpers

These helpers are exported from `'ai-i18n-tools/runtime'` and work in any JavaScript environment (browser, Node.js, Deno, Edge). They do **not** import from `i18next` or `react-i18next`.

Use them in your app bootstrap (`src/i18n.js`), language switcher, and any non-React code that needs direction or string utilities. For end-to-end wiring, start with [Wire i18next](/guide/ui-strings/i18next-runtime); for language menus and RTL, see [Language switcher & RTL](/guide/ui-strings/language-switcher).

<a id="import-patterns"></a>
## Import patterns

The **default export** is the i18next-helper namespace only (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). Import `interpolateTemplate`, `flipUiArrowsForRtl`, display helpers, and types as **named exports** — they are not properties on the default export.

```js
// Namespace style (common in i18n bootstrap files)
import aiI18n from 'ai-i18n-tools/runtime';
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

// Named imports (language switcher, one-off utilities)
import {
  getUILanguageLabel,
  getTextDirection,
  type UiLanguageManifestRow,
} from 'ai-i18n-tools/runtime';
```

<a id="quick-reference"></a>
## Quick reference

| Export | Role |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | Standard i18next `init()` options for key-as-default setups. |
| `setupKeyAsDefaultT(i18n, options)` | **Recommended app entry point** — key-trim wrapper, optional source plural bundle, plural-aware `wrapT`. |
| `wrapT(i18n, options)` | Lower-level plural `t()` wrapper (usually installed by `setupKeyAsDefaultT`). |
| `buildPluralIndexFromStringsJson(entries)` | Builds the `literal → groupId` map `wrapT` uses from `strings.json` rows with `"plural": true`. |
| `extractInterpolationNamesForWrap(message)` | Parses <code v-pre>{{var}}</code> placeholder names from a source string. |
| `wrapI18nWithKeyTrim(i18n)` | Key-trim + source-locale <code v-pre>{{var}}</code> fallback only. **Deprecated** for app wiring — use `setupKeyAsDefaultT`. |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | Builds the `localeLoaders` map for `makeLoadLocale` from `ui-languages.json` (every `code` except `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | Factory for async locale JSON loading via `addResourceBundle`. |
| `RTL_LANGS` | Read-only set of RTL base language codes (fallback when a locale is missing from the bundled catalog). |
| `getTextDirection(lng)` | Returns `'ltr'` or `'rtl'` for a BCP-47 code. |
| `applyDirection(lng, element?)` | Sets the `dir` attribute on `document.documentElement` (browser) or a custom element. |
| `getUILanguageLabel(lang, t)` | Language menu label using `t(englishName)` when translated. |
| `getUILanguageLabelNative(lang)` | Language menu label from manifest fields only (`englishName / label`). |
| `interpolateTemplate(str, vars)` | Low-level <code v-pre>{{var}}</code> substitution on a plain string (prefer `t()` in React/i18next). |
| `flipUiArrowsForRtl(text, isRtl)` | Flip `→` to `←` for RTL layouts. |

<a id="rtl-helpers"></a>
### RTL helpers

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection` consults the bundled `data/ui-languages-complete.json` catalog first (same source as `generate-ui-languages`), then falls back to `RTL_LANGS` for codes not in the catalog.

`applyDirection` is safe in Node.js — it no-ops when `document` is unavailable. In the browser, omit `element` to update `document.documentElement`. Wire it on language change: `i18n.on('languageChanged', applyDirection)`.

<a id="i18next-setup-factories"></a>
### i18next setup factories

```ts
defaultI18nInitOptions(sourceLocale?: string): {
  resources: Record<string, never>;
  lng: string;
  fallbackLng: string;
  parseMissingKeyHandler: (key: string) => string;
  interpolation: { escapeValue: false };
  nsSeparator: false;
}

setupKeyAsDefaultT(
  i18n: I18nLike & Partial<Pick<I18nWithResources, 'addResourceBundle'>>,
  options: SetupKeyAsDefaultTOptions
): void

// SetupKeyAsDefaultTOptions:
// {
//   stringsJson: Record<string, { plural?: boolean; source?: string }>;
//   sourcePluralFlatBundle?: { lng: string; bundle: Record<string, string> };
// }

wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
// WrapTOptions: { pluralIndex: Record<string, string> }

buildPluralIndexFromStringsJson(
  entries: Record<string, { plural?: boolean; source?: string }>
): Record<string, string>

extractInterpolationNamesForWrap(message: string): string[]

makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>

makeLoadLocale(
  i18n: I18nLike & Pick<I18nWithResources, 'addResourceBundle'>,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

Use `setupKeyAsDefaultT` as the usual app entry point (key-trim + plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Calling `wrapI18nWithKeyTrim` alone is **deprecated** for application wiring.

`sourcePluralFlatBundle` requires an i18next instance with `addResourceBundle()`. The `lng` field must match `SOURCE_LOCALE` in your bootstrap file and `sourceLocale` in `ai-i18n-tools.config.json`.

Build `localeLoaders` with `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` so keys stay aligned with `targetLocales` after `generate-ui-languages`. See [Wire i18next](/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/), and [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (custom `makeT` without i18next).

<a id="display-helpers"></a>
### Display helpers

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow` is exported as `{ readonly code: string }` — the minimum shape for manifest rows in `makeLocaleLoadersFromManifest`. The display helpers also need `englishName` (and `label` for `getUILanguageLabelNative`) from your project's `ui-languages.json` entries (`{ code, label, englishName, direction }`). See [Language switcher & RTL](/guide/ui-strings/language-switcher#language-switcher-ui) for a full example.

<a id="string-helpers"></a>
### String helpers

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` replaces <code v-pre>{{name}}</code> placeholders where `name` matches `\w+` (ASCII word characters only). Keys with spaces or hyphens are not supported. `wrapI18nWithKeyTrim` uses this internally for source-locale fallback when no translation exists.

In React/i18next components, prefer <code v-pre>t('key {{var}}', { var })</code> — i18next handles interpolation natively.

<a id="exported-types"></a>
### Exported types

Also exported for TypeScript consumers: `I18nLike`, `I18nWithResources`, `SetupKeyAsDefaultTOptions`, `WrapTOptions`, `UiLanguageManifestRow`, `TranslateFn`.
