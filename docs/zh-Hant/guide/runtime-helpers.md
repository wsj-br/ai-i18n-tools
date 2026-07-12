<a id="runtime-helpers"></a>
# 執行階段輔助工具

這些輔助函式從 `'ai-i18n-tools/runtime'` 匯出，可在任何 JavaScript 環境（瀏覽器、Node.js、Deno、Edge）中使用。它們**不會**從 `i18next` 或 `react-i18next` 匯入。

在應用程式啟動（`src/i18n.js`）、語言切換器，以及任何需要方向或字串工具的非 React 程式碼中使用它們。如需端對端接線，請從 [Wire i18next](/zh-Hant/guide/ui-strings/i18next-runtime) 開始；如需語言選單和 RTL，請參閱 [Language switcher & RTL](/zh-Hant/guide/ui-strings/language-switcher)。

<a id="import-patterns"></a>
## 匯入模式

**預設匯出**僅為 i18next-helper 命名空間（`defaultI18nInitOptions`、`setupKeyAsDefaultT`、`wrapT`、`makeLoadLocale`、…）。將 `interpolateTemplate`、`flipUiArrowsForRtl`、顯示輔助函式和類型作為 **命名匯出**匯入——它們不是預設匯出的屬性。

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
## 快速參考

| 匯出 | 角色 |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | 適用於 key-as-default 設定的標準 i18next `init()` 選項。 |
| `setupKeyAsDefaultT(i18n, options)` | **建議的應用程式進入點**——key-trim 包裝函式、可選的來源複數組合、具複數功能的 `wrapT`。 |
| `wrapT(i18n, options)` | 低層級複數 `t()` 包裝函式（通常由 `setupKeyAsDefaultT` 安裝）。 |
| `buildPluralIndexFromStringsJson(entries)` | 從具有 `"plural": true` 的 `strings.json` 列建構 `wrapT` 使用的 `literal → groupId` 對應表。 |
| `extractInterpolationNamesForWrap(message)` | 從來源字串解析 <code v-pre>{{var}}</code> 佔位符名稱。 |
| `wrapI18nWithKeyTrim(i18n)` | 僅支援鍵值修剪 + 來源語言環境 <code v-pre>{{var}}</code> 回退。**已棄用**於應用程式連線 — 請改用 `setupKeyAsDefaultT`。 |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | 從 `ui-languages.json`（每個 `code` 除了 `sourceLocale`）為 `makeLoadLocale` 建構 `localeLoaders` 對應表。 |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | 透過 `addResourceBundle` 非同步載入地區 JSON 的工廠函式。 |
| `RTL_LANGS` | RTL 基礎語言代碼的唯讀集合（當地區設定不在組合目錄中時的回退）。 |
| `getTextDirection(lng)` | 為 BCP-47 代碼傳回 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement`（瀏覽器）或自訂元素上設定 `dir` 屬性。 |
| `getUILanguageLabel(lang, t)` | 使用 `t(englishName)` 的語言選單標籤（已翻譯時）。 |
| `getUILanguageLabelNative(lang)` | 僅從資訊清單欄位取得的語言選單標籤（`englishName / label`）。 |
| `interpolateTemplate(str, vars)` | 對純文字字串進行低階 <code v-pre>{{var}}</code> 替換（在 React/i18next 中建議使用 `t()`）。 |
| `flipUiArrowsForRtl(text, isRtl)`                                      | 在 RTL 版面配置中將 `→` 翻轉為 `←`。                                                                                                       |

<a id="rtl-helpers"></a>
### RTL 輔助程式

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection` 首先查詢組合的 `data/ui-languages-complete.json` 目錄（與 `generate-ui-languages` 相同的來源），然後對於目錄中不存在的代碼回退到 `RTL_LANGS`。

`applyDirection` 在 Node.js 中是安全的——當 `document` 不可用時會無操作。在瀏覽器中，省略 `element` 來更新 `document.documentElement`。在語言變更時接線：`i18n.on('languageChanged', applyDirection)`。

<a id="i18next-setup-factories"></a>
### i18next 設定工廠

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

將 `setupKeyAsDefaultT` 作為常用的應用程式進入點（鍵修剪 + plural `wrapT` + 可選的 `translate-ui` `{sourceLocale}.json`）。單獨呼叫 `wrapI18nWithKeyTrim` 是應用程式連接的**已棄用**。

`sourcePluralFlatBundle` 需要一個帶有 `addResourceBundle()` 的 i18next 實例。`lng` 欄位必須與您的啟動檔案中的 `SOURCE_LOCALE` 以及 `ai-i18n-tools.config.json` 中的 `sourceLocale` 相符。

使用 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` 建置 `localeLoaders`，以便在 `generate-ui-languages` 之後索引鍵能與 `targetLocales` 保持對齊。請參閱 [連接 i18next](/zh-Hant/guide/ui-strings/i18next-runtime)、[nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/)、[console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/) 以及 [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)（不使用 i18next 的自訂 `makeT`）。

<a id="display-helpers"></a>
### 顯示輔助程式

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow` 匯出為 `{ readonly code: string }` —— 這是 `makeLocaleLoadersFromManifest` 中清單列的最小結構。顯示輔助函式還需要來自您專案 `ui-languages.json` 項目 (`{ code, label, englishName, direction }`) 的 `englishName`（以及用於 `getUILanguageLabelNative` 的 `label`）。如需完整範例，請參閱 [語言切換器與 RTL](/zh-Hant/guide/ui-strings/language-switcher#language-switcher-ui)。

<a id="string-helpers"></a>
### 字串輔助程式

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` 會在 `name` 匹配 `\w+`（僅限 ASCII 單字字元）的位置替換 <code v-pre>{{name}}</code> 佔位符。不支援包含空格或連字符的鍵。`wrapI18nWithKeyTrim` 在沒有翻譯時會內部使用此功能來進行來源語言環境回退。

在 React/i18next 元件中，建議使用 <code v-pre>t('key {{var}}', { var })</code> — i18next 會原生處理插值。

<a id="exported-types"></a>
### 匯出的型別

同時也為 TypeScript 使用者匯出：`I18nLike`、`I18nWithResources`、`SetupKeyAsDefaultTOptions`、`WrapTOptions`、`UiLanguageManifestRow`、`TranslateFn`。
