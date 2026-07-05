<a id="runtime-helpers"></a>
# Runtime helpers

Ye `'ai-i18n-tools/runtime'` se export kiye jaate hain aur kisi bhi JavaScript environment (browser, Node.js, Deno, Edge) mein kaam karte hain. Ve `i18next` ya `react-i18next` se import **nahi** karte hain.

**Default export** keval i18next-helper namespace hai (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). `interpolateTemplate`, `flipUiArrowsForRtl`, aur display helpers ko **named exports** ke roop mein import karein — ve default export par properties nahi hain.

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

`setupKeyAsDefaultT` ko usual app entry point ke roop mein use karen (key-trim + plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Application wiring ke liye keval `wrapI18nWithKeyTrim` ko call karna **deprecated** hai.

`localeLoaders` ko `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` ke saath banayein taaki `generate-ui-languages` ke baad keys `targetLocales` ke saath align rahein. Dekhein `docs/guide/ui-strings/i18next-runtime.md` (runtime wiring), `examples/nextjs-app/`, `examples/console-app/`, aur `examples/astro-website/` (i18next ke bina custom `makeT`).

<a id="display-helpers"></a>
### Display helpers

```ts
getUILanguageLabel(lang: UiLanguageManifestRow, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow): string
```

`UiLanguageManifestRow` ko `'ai-i18n-tools/runtime'` se export kiya jaata hai (shape: `{ code, label, englishName, direction }`). Iska upyog `ui-languages.json` se manifest rows ko type karne ke liye karein.

<a id="string-helpers"></a>
### String helpers

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` ```{{name}}``` placeholders ko badalta hai jahan `name` `\w+` se milta hai (keval ASCII word characters). Spaces ya hyphens wale keys samarthit nahi hain.
