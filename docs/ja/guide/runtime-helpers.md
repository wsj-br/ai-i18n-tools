<a id="runtime-helpers"></a>
# ランタイムヘルパー

これらのヘルパーは`'ai-i18n-tools/runtime'`からエクスポートされ、任意のJavaScript環境（ブラウザ、Node.js、Deno、Edge）で動作します。これらは`i18next`や`react-i18next`からインポートし**ません**。

これらはアプリのブートストラップ（`src/i18n.js`）、言語スイッチャー、および方向や文字列ユーティリティを必要とするReact以外のコードで使用してください。エンドツーエンドの設定については、[i18nextの設定](/ja/guide/ui-strings/i18next-runtime)から始めてください。言語メニューやRTLについては、[言語スイッチャーとRTL](/ja/guide/ui-strings/language-switcher)を参照してください。

<a id="import-patterns"></a>
## インポートパターン

**デフォルトエクスポート**はi18next-helperの名前空間のみです（`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …）。`interpolateTemplate`、`flipUiArrowsForRtl`、表示ヘルパー、および型は**名前付きエクスポート**としてインポートしてください。これらはデフォルトエクスポートのプロパティではありません。

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
## クイックリファレンス

| エクスポート | 役割 |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | キーをデフォルトとして使用する設定のための標準的なi18nextの`init()`オプション。 |
| `setupKeyAsDefaultT(i18n, options)` | **推奨されるアプリのエントリポイント** — キートリムラッパー、オプションのソース複数形バンドル、複数形対応の`wrapT`。 |
| `wrapT(i18n, options)` | 下位レベルの複数形`t()`ラッパー（通常は`setupKeyAsDefaultT`によってインストールされます）。 |
| `buildPluralIndexFromStringsJson(entries)` | `"plural": true`を使用して`strings.json`の行から`wrapT`が使用する`literal → groupId`マップを構築します。 |
| `extractInterpolationNamesForWrap(message)` | ソース文字列から <code v-pre>{{var}}</code> プレースホルダー名を解析します。 |
| `wrapI18nWithKeyTrim(i18n)` | キートリム + ソースロケール <code v-pre>{{var}}</code> フォールバックのみ。アプリ配線では **非推奨** — `setupKeyAsDefaultT` を使用してください。 |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | `ui-languages.json`から`makeLoadLocale`用の`localeLoaders`マップを構築します（`sourceLocale`を除くすべての`code`）。 |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | `addResourceBundle`を介した非同期ロケールJSON読み込み用のファクトリ。 |
| `RTL_LANGS` | RTLベース言語コードの読み取り専用セット（バンドルされたカタログにロケールが存在しない場合のフォールバック）。 |
| `getTextDirection(lng)` | BCP-47コードに対応する`'ltr'`または`'rtl'`を返す。 |
| `applyDirection(lng, element?)` | `document.documentElement`（ブラウザ）またはカスタム要素に`dir`属性を設定します。 |
| `getUILanguageLabel(lang, t)` | 翻訳時に`t(englishName)`を使用する言語メニューラベル。 |
| `getUILanguageLabelNative(lang)` | マニフェストフィールドのみからの言語メニューラベル（`englishName / label`）。 |
| `interpolateTemplate(str, vars)` | プレーンテキストに対するローレベルの <code v-pre>{{var}}</code> 置換（React/i18next では `t()` を推奨）。 |
| `flipUiArrowsForRtl(text, isRtl)` | RTLレイアウト向けに`→`を`←`に反転。 |

<a id="rtl-helpers"></a>
### RTL ヘルパー

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection`はバンドルされた`data/ui-languages-complete.json`カタログを最初に参照し（`generate-ui-languages`と同じソース）、カタログにないコードについては`RTL_LANGS`にフォールバックします。

`applyDirection`はNode.jsで安全に使用できます — `document`が利用できない場合は何もしません。ブラウザでは、`document.documentElement`を更新するために`element`を省略します。言語変更時にこれを設定します：`i18n.on('languageChanged', applyDirection)`。

<a id="i18next-setup-factories"></a>
### i18next 設定ファクトリ

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

通常のアプリケーションエントリポイントとして `setupKeyAsDefaultT` を使用してください（キーのトリミング＋複数形 `wrapT`＋オプションの `translate-ui` `{sourceLocale}.json`）。アプリケーションの配線において、単独で `wrapI18nWithKeyTrim` を呼び出すことは**非推奨**です。

`sourcePluralFlatBundle`には、`addResourceBundle()`を持つi18nextインスタンスが必要です。`lng`フィールドは、ブートストラップファイル内の`SOURCE_LOCALE`および`ai-i18n-tools.config.json`内の`sourceLocale`と一致する必要があります。

`makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`を使用して`localeLoaders`をビルドし、`generate-ui-languages`の後もキーが`targetLocales`と整合性を保つようにします。[Wire i18next](/ja/guide/ui-strings/i18next-runtime)、[nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/)、[console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/)、および[astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)（i18nextを使用しないカスタム`makeT`）を参照してください。

<a id="display-helpers"></a>
### 表示ヘルパー

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow`は`{ readonly code: string }`としてエクスポートされます。これは`makeLocaleLoadersFromManifest`のマニフェスト行の最小構成です。表示ヘルパーは、プロジェクトの`ui-languages.json`エントリ（`{ code, label, englishName, direction }`）から`englishName`（および`getUILanguageLabelNative`用の`label`）も必要とします。完全な例については、[Language switcher & RTL](/ja/guide/ui-strings/language-switcher#language-switcher-ui)を参照してください。

<a id="string-helpers"></a>
### 文字列ヘルパー

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` は `name` が `\w+`（ASCII 単語文字のみ）に一致する <code v-pre>{{name}}</code> プレースホルダーを置換します。スペースやハイフンを含むキーはサポートされていません。`wrapI18nWithKeyTrim` は翻訳が存在しない場合のソースロケールフォールバックとして内部的にこれを使用しています。

React/i18next コンポーネントでは、<code v-pre>t('key {{var}}', { var })</code> を使用してください — i18next は補間をネイティブに処理します。

<a id="exported-types"></a>
### エクスポートされる型

TypeScriptコンシューマー向けにエクスポートされるもの: `I18nLike`、`I18nWithResources`、`SetupKeyAsDefaultTOptions`、`WrapTOptions`、`UiLanguageManifestRow`、`TranslateFn`。
