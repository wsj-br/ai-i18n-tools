<a id="runtime-helpers"></a>
# 執行階段輔助工具

這些是從 `'ai-i18n-tools/runtime'` 導出的，可在任何 JavaScript 環境（瀏覽器、Node.js、Deno、Edge）中使用。它們**不會**從 `i18next` 或 `react-i18next` 導入。

**預設匯出**僅為 i18next-helper 命名空間 (`defaultI18nInitOptions`、`setupKeyAsDefaultT`、`wrapT`、`makeLoadLocale` 等)。請匯入 `interpolateTemplate`、`flipUiArrowsForRtl` 和顯示輔助程式作為**具名匯出** — 它們不是預設匯出的屬性。

<a id="rtl-helpers"></a>
### RTL 輔助程式

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next 設定工廠

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

將 `setupKeyAsDefaultT` 作為常用的應用程式進入點（鍵修剪 + plural `wrapT` + 可選的 `translate-ui` `{sourceLocale}.json`）。單獨呼叫 `wrapI18nWithKeyTrim` 是應用程式連接的**已棄用**。

使用 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` 建置 `localeLoaders`，以便在 `generate-ui-languages` 之後，鍵與 `targetLocales` 保持一致。請參閱 `docs/guide/ui-strings/i18next-runtime.md` (執行階段連線)、`examples/nextjs-app/`、`examples/console-app/` 和 `examples/astro-website/` (不含 i18next 的自訂 `makeT`)。

<a id="display-helpers"></a>
### 顯示輔助程式

```ts
getUILanguageLabel(lang: UiLanguageManifestRow, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow): string
```

`UiLanguageManifestRow` 從 `'ai-i18n-tools/runtime'` 匯出 (形狀：`{ code, label, englishName, direction }`)。使用它來輸入來自 `ui-languages.json` 的資訊清單列。

<a id="string-helpers"></a>
### 字串輔助程式

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

當 `name` 符合 `\w+` 時 (僅限 ASCII 文字字元)，`interpolateTemplate` 會取代 ```{{name}}``` 預留位置。不支援包含空格或連字號的鍵。
