<a id="runtime-helpers"></a>
# Runtime helpers

These are exported from `'ai-i18n-tools/runtime'` and work in any JavaScript environment (browser, Node.js, Deno, Edge). They do **not** import from `i18next` or `react-i18next`.

The **default export** is the i18next-helper namespace only (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). Import `interpolateTemplate`, `flipUiArrowsForRtl`, and the display helpers as **named exports** — they are not properties on the default export.

<a id="rtl-helpers"></a>
### RTL helpers

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next setup factories

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
extractInterpolationNamesForWrap(key: string): string[]
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

Use `setupKeyAsDefaultT` as the usual app entry point (key-trim + plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Calling `wrapI18nWithKeyTrim` alone is **deprecated** for application wiring.

Build `localeLoaders` with `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` so keys stay aligned with `targetLocales` after `generate-ui-languages`. See `docs/guide/ui-strings/i18next-runtime.md` (runtime wiring), `examples/nextjs-app/`, `examples/console-app/`, and `examples/astro-website/` (custom `makeT` without i18next).

<a id="display-helpers"></a>
### Display helpers

```ts
getUILanguageLabel(lang: UiLanguageManifestRow, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow): string
```

`UiLanguageManifestRow` is exported from `'ai-i18n-tools/runtime'` (shape: `{ code, label, englishName, direction }`). Use it for typing manifest rows from `ui-languages.json`.

<a id="string-helpers"></a>
### String helpers

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` replaces ```{{name}}``` placeholders where `name` matches `\w+` (ASCII word characters only). Keys with spaces or hyphens are not supported.
