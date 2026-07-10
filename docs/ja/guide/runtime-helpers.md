<a id="runtime-helpers"></a>
# ランタイムヘルパー

これらは`'ai-i18n-tools/runtime'`からエクスポートされ、任意のJavaScript環境（ブラウザ、Node.js、Deno、Edgeなど）で動作します。`i18next`や`react-i18next`からのインポートは**行いません**。

**デフォルトエクスポート**は i18next-helper 名前空間のみです (`defaultI18nInitOptions`、`setupKeyAsDefaultT`、`wrapT`、`makeLoadLocale` など)。`interpolateTemplate`、`flipUiArrowsForRtl`、および表示ヘルパーは**名前付きエクスポート**としてインポートしてください。これらはデフォルトエクスポートのプロパティではありません。

<a id="rtl-helpers"></a>
### RTL ヘルパー

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next 設定ファクトリ

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

通常のアプリケーションエントリポイントとして `setupKeyAsDefaultT` を使用してください（キーのトリミング＋複数形 `wrapT`＋オプションの `translate-ui` `{sourceLocale}.json`）。アプリケーションの配線において、単独で `wrapI18nWithKeyTrim` を呼び出すことは**非推奨**です。

`makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` を使用して `localeLoaders` をビルドし、`generate-ui-languages` の後もキーが `targetLocales` と整合した状態を保つようにします。[ランタイムのワイヤリング](/guide/ui-strings/i18next-runtime)、[nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/)、[console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/)、[astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (i18next を使用しないカスタム `makeT`) を参照してください。

<a id="display-helpers"></a>
### 表示ヘルパー

```ts
getUILanguageLabel(lang: UiLanguageManifestRow, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow): string
```

`UiLanguageManifestRow` は `'ai-i18n-tools/runtime'` からエクスポートされます (形式: `{ code, label, englishName, direction }`)。`ui-languages.json` からのマニフェスト行の型指定に使用します。

<a id="string-helpers"></a>
### 文字列ヘルパー

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` は、`name` が `\w+` と一致する (ASCII 単語文字のみ) ```{{name}}``` プレースホルダーを置き換えます。スペースやハイフンを含むキーはサポートされていません。
