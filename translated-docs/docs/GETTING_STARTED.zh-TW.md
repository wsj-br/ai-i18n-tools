<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools：快速入門

`ai-i18n-tools` 提供兩個獨立且可組合的工作流程：

- **工作流程 1 - UI 翻譯**：從任何 JS/TS 原始碼中提取 `t("…")` 呼叫，透過 OpenRouter 進行翻譯，並輸出扁平化的每種語言 JSON 檔案，可直接供 i18next 使用。
- **工作流程 2 - 文件翻譯**：將 Markdown（MDX）和 Docusaurus JSON 標籤檔案翻譯成任意數量的語系，並具備智慧快取功能。**SVG** 資源使用 `features.translateSVG`、頂層 `svg` 區塊，以及 `translate-svg`（參見 [CLI 參考](#cli-reference))。

兩個工作流程皆使用 OpenRouter（任何相容的 LLM），並共用單一設定檔。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [安裝](#installation)
- [快速開始](#quick-start)
  - [推薦的 `package.json` 指令碼](#recommended-packagejson-scripts)
- [工作流程 1 - UI 翻譯](#workflow-1---ui-translation)
  - [步驟 1：初始化](#step-1-initialise)
  - [步驟 2：提取字串](#step-2-extract-strings)
  - [步驟 3：翻譯 UI 字串](#step-3-translate-ui-strings)
  - [匯出至 XLIFF 2.0（可選）](#exporting-to-xliff-20-optional)
  - [步驟 4：在執行階段整合 i18next](#step-4-wire-i18next-at-runtime)
  - [在原始碼中使用 `t()`](#using-t-in-source-code)
  - [插值](#interpolation)
  - [基數複數（`plurals: true`）](#cardinal-plurals-plurals-true)
  - [語言切換 UI](#language-switcher-ui)
  - [RTL 語言](#rtl-languages)
- [工作流程 2 - 文件翻譯](#workflow-2---document-translation)
  - [步驟 1：為文件初始化](#step-1-initialise-for-documentation)
  - [步驟 2：翻譯文件](#step-2-translate-documents)
    - [複雜的 Markdown 和失敗的品質檢查](#complex-markdown-and-failed-quality-checks)
    - [快取行為與 `translate-docs` 標記](#cache-behaviour-and-translate-docs-flags)
    - [批次提示格式](#batch-prompt-format)
    - [SQLite 中的區段去重與路徑](#segment-dedupe-and-paths-in-sqlite)
  - [輸出佈局](#output-layouts)
    - [平面佈局中的錨點連結](#anchor-links-in-flat-layout)
    - [翻譯文件中的圖片與點陣資源](#images-and-raster-assets-in-translated-docs)
    - [`pathTemplate` / `jsonPathTemplate` 樣板](#pathtemplate--jsonpathtemplate-placeholders)
- [合併工作流程 (UI + 文件)](#combined-workflow-ui--docs)
  - [混合文件工作流程 (Docusaurus + 平面)](#mixed-documentation-workflow-docusaurus--flat)
- [翻譯快取編輯器](#translation-cache-editor)
  - [失敗項目（文件翻譯）](#failures-document-translation)
    - [何時使用](#when-to-use-it)
    - [為何原始內容的編輯很重要](#why-source-edits-matter)
    - [如何使用此分頁](#how-to-use-the-tab)
- [設定參考](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath`（可選）](#uilanguagespath-optional)
  - [`concurrency`（可選）](#concurrency-optional)
  - [`batchConcurrency`（可選）](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars`（可選）](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg`（可選）](#svg-optional)
  - [`glossary`](#glossary)
- [CLI 參考](#cli-reference)
- [環境變數](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## 安裝

發布的套件僅支援 **ESM**。請在 Node.js 或你的打包工具中使用 `import`/`import()`；請勿使用 `require('ai-i18n-tools')`。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools 包含內建的字串提取器。如果你先前使用過 `i18next-scanner`、`babel-plugin-i18next-extract` 或類似工具，在遷移後即可移除這些開發依賴。

設定您的 OpenRouter API 金鑰：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

或在專案根目錄建立一個 `.env` 檔案：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## 快速開始

預設的 `init` 範本（`ui-markdown`）僅啟用 **UI** 提取與翻譯。`ui-docusaurus` 範本則啟用 **文件**翻譯（`translate-docs`）。當你希望使用單一指令根據設定執行提取、UI 翻譯、可選的獨立 SVG 翻譯以及文件翻譯時，請使用 `sync`。

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 建議使用的 `package.json` 指令碼

在本地安裝套件後，你可以直接在指令碼中使用 CLI 指令（無需 `npx`）：

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-ui && ai-i18n-tools translate-svg && ai-i18n-tools translate-docs",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## 工作流程 1 - UI 翻譯

適用於任何使用 i18next 的 JS/TS 專案：React 應用、Next.js（客戶端與伺服器元件）、Node.js 服務、CLI 工具。

<a id="step-1-initialise"></a>
### 步驟 1：初始化

```bash
npx ai-i18n-tools init
```

此操作會寫入使用 `ui-markdown` 範本的 `ai-i18n-tools.config.json`。請編輯設定以指定：

- `sourceLocale` - 您的原始語言 BCP-47 代碼（例如 `"en-GB"`）。**必須與** 執行階段 i18n 設定檔（`src/i18n.ts` / `src/i18n.js`）中匯出的 `SOURCE_LOCALE` 相符。
- `targetLocales` - 目標語言的 BCP-47 代碼陣列（例如 `["de", "fr", "pt-BR"]`）。執行 `generate-ui-languages` 從此清單建立 `ui-languages.json` 清單。
- `ui.sourceRoots` - 掃描 `t("…")` 呼叫的目錄（例如 `["src/"]`）。
- `ui.stringsJson` - 主目錄的寫入位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 寫入 `de.json`、`pt-BR.json` 等的位置（例如 `"src/locales/"`）。
- `ui.preferredModel`（可選）- 僅針對 `translate-ui` 嘗試使用的 OpenRouter 模型 ID **優先**；若失敗，CLI 將依序繼續使用 `openrouter.translationModels`（或舊版 `defaultModel` / `fallbackModel`），跳過重複項目。

<a id="step-2-extract-strings"></a>
### 步驟 2：提取字串

```bash
npx ai-i18n-tools extract
```

掃描 `ui.sourceRoots` 下的所有 JS/TS 檔案中的 `t("literal")` 和 `i18n.t("literal")` 呼叫。寫入（或合併至）`ui.stringsJson`。

掃描器可設定：透過 `ui.reactExtractor.funcNames` 新增自訂函式名稱。

<a id="step-3-translate-ui-strings"></a>
### 步驟 3：翻譯 UI 字串

```bash
npx ai-i18n-tools translate-ui
```

讀取 `strings.json`，將批次傳送至 OpenRouter 以供每個目標語系使用，並將扁平 JSON 檔案（`de.json`、`fr.json` 等）寫入 `ui.flatOutputDir`。當設定 `ui.preferredModel` 時，會先嘗試使用該模型，再依 `openrouter.translationModels` 中的順序列表進行（文件翻譯及其他指令仍僅使用 `openrouter`）。

針對每個項目，`translate-ui` 會在一個選擇性的 `models` 物件中儲存成功翻譯各語系的 **OpenRouter 模型 ID**（語系鍵與 `translated` 相同）。在本機 `editor` 指令中編輯的字串，會在該語系的 `models` 中標記為哨兵值 `user-edited`。位於 `ui.flatOutputDir` 下的各語系扁平檔案僅包含 **原始字串 → 翻譯**；不包含 `models`（因此執行階段的 bundle 保持不變）。

> **關於使用快取編輯器的注意事項：** 如果您在快取編輯器中編輯了某個項目，您需要執行 `sync --force-update`（或等效的 `translate` 指令搭配 `--force-update`）以使用更新後的快取項目重寫輸出檔案。此外，請注意，如果稍後原始文字變更，您手動的編輯將會遺失，因為新的原始字串將產生新的快取鍵（雜湊值）。

<a id="exporting-to-xliff-20-optional"></a>
### 匯出至 XLIFF 2.0（可選）

若要將 UI 字串交給翻譯供應商、TMS 或 CAT 工具，可將目錄匯出為 **XLIFF 2.0**（每個目標語系一個檔案）。此指令為 **唯讀**：不會修改 `strings.json` 或呼叫任何 API。

```bash
npx ai-i18n-tools export-ui-xliff
```

預設情況下，檔案會寫入 `ui.stringsJson` 旁邊，命名方式如 `strings.de.xliff`、`strings.pt-BR.xliff`（您的目錄基底名稱 + 語系 + `.xliff`）。使用 `-o` / `--output-dir` 可寫入其他位置。來自 `strings.json` 的現有翻譯會出現在 `<target>` 中；缺少的語系會使用 `state="initial"` 且無 `<target>`，以便工具填入。使用 `--untranslated-only` 僅匯出每個語系仍需要翻譯的項目（適用於供應商批次作業）。`--dry-run` 會列印路徑但不寫入檔案。

<a id="step-4-wire-i18next-at-runtime"></a>
### 步驟 4：在執行階段整合 i18next

使用 `'ai-i18n-tools/runtime'` 匯出的輔助函式建立您的 i18n 設定檔：

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
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

<!--
  Translate-docs note: paragraphs here stack many `bold` / `` `code` `` patterns (nested backticks, long sentences).
  Some target locales fail AST-style validation; see "Complex Markdown and failed quality checks" under Workflow 2 — simplify source rather than forcing literal markup parity.
-->

**保持三個值一致：`ai-i18n-tools.config.json` 中的 `sourceLocale`、此檔案中的 `SOURCE_LOCALE`，以及平面 JSON 輸出目錄下 `translate-ui` 寫入的複數平面 `{sourceLocale}.json`（通常是 `public/locales/`）。在靜態 `import` 中使用相同的檔案名稱（如上例：`en-GB` → `en-GB.json`）。`sourcePluralFlatBundle` 中的 `lng` 欄位必須等於 `SOURCE_LOCALE`。靜態 ES `import` 路徑不能使用變數；若您變更來源語系，請同時更新 `SOURCE_LOCALE` 和匯入路徑。或者，使用動態 `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`、`fetch` 或 `readFileSync` 來載入該檔案，使路徑由 `SOURCE_LOCALE` 建構。**

該程式碼片段使用 `./locales/…` 和 `./public/locales/…`，假設 `i18n` 與這些資料夾位於同一層。如果您的檔案位於 `src/` 下（典型情況），請使用 `../locales/…` 和 `../public/locales/…`，使匯入路徑與 `ui.stringsJson`、`uiLanguagesPath` 和 `ui.flatOutputDir` 一致。

在 React 渲染前匯入 `i18n.js`（例如在您的進入點頂部）。當使用者變更語言時，呼叫 `await loadLocale(code)` 然後呼叫 `i18n.changeLanguage(code)`。

請透過 `ui-languages.json` 使用 `makeLocaleLoadersFromManifest` 來衍生 `localeLoaders`，以 **與設定保持一致**（此方法會使用與 `makeLoadLocale` 相同的正規化方式過濾掉 `SOURCE_LOCALE`）。當您在 `targetLocales` 中新增語系並執行 `generate-ui-languages` 時，清單會自動更新，您的載入器也會自動追蹤變更——無需維護額外的硬編碼對照表。

如果您的 JSON 匯出檔案位於 `public/` 下（典型的 Next.js 設定），請實作每個載入器以從您的公開 URL 路徑取得檔案，例如：

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

這允許瀏覽器載入靜態 JSON。

對於沒有打包工具的 Node CLI，可在一個小型 `makeFileLoader` 輔助函式中使用 `readFileSync`，為每段程式碼讀取並解析 JSON 檔案。

`SOURCE_LOCALE` 已匯出，因此任何需要它的其他檔案（例如語言切換器）都可以直接從 `'./i18n'` 匯入。如果您正在遷移現有的 i18next 設定，請將分散在元件中的硬編碼原始語言字串（例如 `'en-GB'` 檢查）替換為從您的 i18n 啟動檔案中匯入 `SOURCE_LOCALE`。

如果您不希望使用預設匯出，命名匯出（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`）也能正常運作。

`aiI18n.defaultI18nInitOptions(sourceLocale)`（或以名稱匯入時的 `defaultI18nInitOptions(sourceLocale)`）會回傳鍵值作為預設值設定的標準選項：

- `parseMissingKeyHandler` 回傳鍵本身，因此未翻譯的字串會顯示原始文字。
- `nsSeparator: false` 允許鍵中包含冒號。
- `interpolation.escapeValue: false` — 可安全停用：React 本身會轉義值，而 Node.js/CLI 輸出沒有 HTML 需要轉義。

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` 是 ai-i18n-tools 專案的 **推薦**整合方式：它會套用鍵名修剪 + 來源語系 <code>{"{{var}}"}</code> 插值回退（行為與底層 `wrapI18nWithKeyTrim` 相同），選擇性地透過 `addResourceBundle` 合併 `translate-ui` `{sourceLocale}.json` 複數後綴鍵，然後從您的 `strings.json` 安裝支援複數的 `wrapT`。此捆綁檔案必須是您 **已設定**的來源語系的複數平面檔案——與 i18n 初始化（見上方步驟 4）中的 `ai-i18n-tools.config.json` 和 `SOURCE_LOCALE` 使用的 `sourceLocale` 相同。僅在初始化期間省略 `sourcePluralFlatBundle`（一旦 `translate-ui` 產生 `{sourceLocale}.json` 後即合併）。`wrapI18nWithKeyTrim` 單獨用於應用程式碼中已 **棄用**——請改用 `setupKeyAsDefaultT`。

`makeLoadLocale(i18n, loaders, sourceLocale)` 回傳一個非同步的 `loadLocale(lang)` 函式，該函式會動態匯入指定語言環境的 JSON 捆綁檔並向 i18next 註冊。

<a id="using-t-in-source-code"></a>
### 在原始碼中使用 `t()`

使用 **字面字串**呼叫 `t()`，以便提取腳本能找到它：

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

相同的模式也適用於 React 之外（Node.js、伺服器元件、CLI）：

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**規則：**

- 僅以下形式會被提取：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")`。
- 鍵必須是 **字面字串** — 不可使用變數或運算式作為鍵。
- 請勿對鍵使用模板字面值：<code>{'t(`Hello ${name}`)'}</code> 無法被提取。

<a id="interpolation"></a>
### 插值

使用 i18next 原生的第二個參數進行 <code>{"{{var}}"}</code> 佔位符的插值：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

extract 命令會解析 **第二個參數**，當其為純物件字面量時，會讀取僅供工具使用的標記，例如 `plurals: true` 和 `zeroDigit`（參見下方 **基數複數**）。對於一般字串，僅使用字面鍵進行雜湊；插值選項仍會在執行時傳遞給 i18next。

如果您的專案使用自訂插值工具（例如呼叫 `t('key')`，然後將結果傳遞給像 `interpolateTemplate(t('Hello {{name}}'), { name })` 這樣的模板函式），則 `setupKeyAsDefaultT`（透過 `wrapI18nWithKeyTrim`）可使此類工具不再必要——即使來源語系回傳原始鍵，它仍會套用 <code>{"{{var}}"}</code> 插值。請將呼叫點遷移至 `t('Hello {{name}}', { name })` 並移除自訂工具。

<a id="cardinal-plurals-plurals-true"></a>
### 基數複數（`plurals: true`）

使用您希望作為開發者預設文案的 **相同字面值**，並傳入 `plurals: true`，使 extract + `translate-ui` 將此呼叫視為一個 **基數複數群組**（符合 i18next JSON v4 風格的 `_zero` … `_other` 格式）。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit`（可選）— 僅供工具使用；**不會**被 i18next 讀取。當設為 `true` 時，提示會偏好在每個支援該形式的語區的 `_zero` 字串中使用字面的阿拉伯語 `0`；當設為 `false` 或省略時，則使用自然的零值表述。在呼叫 `i18next.t` 前應移除這些鍵（見下方 `wrapT`）。

**驗證：** 如果訊息包含 **兩個或更多**不同的 `{{…}}` 佔位符，**其中一個必須是 `{{count}}`**（複數軸）。否則 `extract` **將失敗**，並顯示明確的檔案/行號訊息。

**兩個獨立計數**（例如章節和頁數）不能共用同一條複數訊息 — 請使用 **兩個** `t()` 呼叫（每個都帶有 `plurals: true` 及其各自的 `count`），並在 UI 中串接。

**在** `strings.json` 複數群組中使用 **每個哈希一行**，並包含 `"plural": true`、原始字面值 `source` 和 `translated[locale]` 作為對應基數類別的物件映射 (`zero`、`one`、`two`、`few`、`many`、`other`) 到該地區的字串。

**平面化語系 JSON：** 非複數的列保持為 **原始句子 → 翻譯**。複數的列會針對每個後綴輸出為 `<groupId>_original`（等同於 `source`，僅供參考）和 `<groupId>_<form>`，以便 i18next 能原生解析複數形式。`translate-ui` 還會寫入一個僅包含 **複數平面鍵** 的 `{sourceLocale}.json`（請載入此資源包以支援原始語言的後綴鍵解析；一般字串仍以鍵本身作為預設值）。針對每個目標語系，輸出的後綴鍵會對應該語系的 `Intl.PluralRules`（`requiredCldrPluralForms`）：若 `strings.json` 因壓縮後與其他類別相同而省略某個類別（例如阿拉伯語的 `many` 與 `other` 相同），`translate-ui` 仍會透過從備用的同類字串複製，將所有必要的後綴寫入平面檔案中，確保執行階段查找不會遺漏任何鍵。

執行階段（`ai-i18n-tools/runtime`）：**呼叫** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — 它會執行 `wrapI18nWithKeyTrim`，註冊可選的 `translate-ui` `{sourceLocale}.json` 複數捆綁，然後使用 `buildPluralIndexFromStringsJson(stringsJson)` 執行 `wrapT`。`wrapT` 會移除 `plurals` / `zeroDigit`，在需要時將鍵重寫為群組 ID，並轉發 `count`（可選：若只有一個非 `{{count}}` 的佔位符，則 `count` 會從該數值選項複製）。

**較舊的環境：** `Intl.PluralRules` 對工具和行為一致性是必需的；若您需支援非常舊的瀏覽器，請使用 polyfill。

**v1 版本不包含：** 序數複數（`_ordinal_*`、`ordinal: true`）、區間複數、僅限 ICU 的管線。

<a id="language-switcher-ui"></a>
### 語言切換介面

使用 `ui-languages.json` 指引檔來建置語言選擇器。`ai-i18n-tools` 匯出兩個顯示輔助函式：

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

`getUILanguageLabel(lang, t)` - 翻譯時顯示 `t(englishName)`，或兩者不同時顯示 `englishName / t(englishName)`。適合用於設定畫面。

`getUILanguageLabelNative(lang)` — 僅顯示 `englishName / label`（每列不需 `t()` 呼叫）。適用於希望顯示本地名稱的頁首選單。

`ui-languages.json` 指引檔是一個 JSON 陣列，內容為 <code>{"{ code, label, englishName, direction }"}</code> 項目（`direction` 為 `"ltr"` 或 `"rtl"`）。範例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

此指引檔由 `generate-ui-languages` 根據 `sourceLocale` + `targetLocales` 及捆綁的主目錄生成，並寫入 `ui.flatOutputDir`。若您變更組態中的任何語系，請執行 `generate-ui-languages` 以更新 `ui-languages.json` 檔案。

<a id="rtl-languages"></a>
### 右至左語言（RTL）

`ai-i18n-tools` 匯出 `getTextDirection(lng)` 與 `applyDirection(lng)`：

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` 設定 `document.documentElement.dir`（瀏覽器環境）或為無效操作（Node.js 環境）。可選擇性傳入 `element` 參數以指定特定元素。

對於可能包含 `→` 箭號的字串，在 RTL 版面中需將其反轉：

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## 工作流程 2 - 文件翻譯

專為 Markdown 文件、Docusaurus 網站和 JSON 標籤檔案設計。若 Markdown 中嵌入了 PNG 或其他點陣圖像，請參閱[翻譯文件中的圖片與點陣資源](#images-and-raster-assets-in-translated-docs)。獨立的 SVG 資源在啟用 `features.translateSVG` 且頂層設定 `svg` 區塊時，會透過 [`translate-svg`](#cli-reference) 進行翻譯，而非透過 `documentations[].contentPaths`。

<a id="step-1-initialise-for-documentation"></a>
### 步驟 1：為文件初始化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

編輯生成的 `ai-i18n-tools.config.json`：

- `sourceLocale` - 原始語言（必須與 `defaultLocale` 在 `docusaurus.config.js` 中相符）。
- `targetLocales` - BCP-47 區域代碼陣列（例如 `["de", "fr", "es"]`）。
- `cacheDir` - 所有文件管道共用的 SQLite 快取目錄（也是 `--write-logs` 的預設日誌目錄）。
- `documentations` - 文件區塊陣列。每個區塊包含可選的 `description`、`contentPaths`、`outputDir`、可選的 `jsonSource`、`markdownOutput`、可選的 `segmentSplitting`、`targetLocales`、`addFrontmatter` 等。
- `documentations[].description` - 維護人員的選用簡短註解（說明此區塊涵蓋的內容）。設定後，會顯示在 `translate-docs` 標題（`🌐 …: translating …`）以及 `status` 章節標頭中。
- `documentations[].contentPaths` - Markdown/MDX 原始碼目錄或檔案（另請參閱 `documentations[].jsonSource` 以取得 JSON 標籤）。
- `documentations[].outputDir` - 該區塊的翻譯輸出根目錄。
- `documentations[].markdownOutput.style` - `"nested"`（預設）、`"docusaurus"` 或 `"flat"`（請參閱[輸出版面配置](#output-layouts)）。

<a id="step-2-translate-documents"></a>
### 步驟 2：翻譯文件

```bash
npx ai-i18n-tools translate-docs
```

這會將每個 `documentations` 區塊中的 `contentPaths` 內的所有檔案翻譯成所有有效的文件在地化語言（若個別區塊設定了 `targetLocales`，則取其聯集；否則使用根層級的 `targetLocales`）。

要翻譯單一在地化語言：

```bash
npx ai-i18n-tools translate-docs --locale de
```

要檢查哪些內容需要翻譯：

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### 複雜的 Markdown 與品質檢查失敗

`translate-docs` 會檢查每個翻譯片段是否保留了 Markdown 結構（包括從文件解析出的強調格式）。若段落中大量堆疊 `bold` 區塊包圍 `` `inline code` ``、在粗體內嵌套反引號（例如範本字面值如 `` `fetch(\`/locales/${code}.json\`)` ``），或在長句中交錯使用粗體與程式碼，則結構較脆弱：某些語區需要不同的詞序，可能導致翻譯後 `**` 和 `` ` `` 的對應錯亂，進而觸發 CLI 錯誤如 `AST mismatch`。

**若遇到此類驗證失敗，建議簡化原始語言文字** — 拆分段落、將範例移至圍欄式程式碼區塊，或以較少的粗體/程式碼組合描述相同概念 — 而非期望所有模型與語區都能完美重現密集的內嵌標記。本頁其他位置（特別是步驟 4 關於 `SOURCE_LOCALE`、載入器與 `public/` 路徑的說明）的格式刻意模擬真實情境；當你在自己的文件中重用類似表述時，翻譯至多語區時請盡量簡化。

若要查看 **哪些片段失敗**、失敗頻率以及儲存的 **品質/錯誤訊息**，請使用翻譯快取編輯器的 **失敗** 標籤頁（[翻譯快取編輯器 → 失敗](#translation-cache-editor-failures)）。

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### 快取行為與 `translate-docs` 標記

CLI 會在 SQLite 中保存 **檔案追蹤**（每檔案每語系的原始內容雜湊）與 **段落** 資料（每可翻譯段落每語系的雜湊）。一般執行時，若追蹤的雜湊與目前原始內容相符 **且** 輸出檔案已存在，就會完全跳過該檔案；否則會處理該檔案，並使用段落快取，使未變更的文字不會呼叫 API。

| 標誌                          | 效果                                                                                                                                                                                                                                                                  |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(預設)*                   | 當追蹤記錄與磁碟上的輸出相符時跳過未變更的檔案；其餘部分使用段落快取。                                                                                                                                                                              |
| `-l, --locale <codes>`        | 以逗號分隔的目標在地化語言（若省略，預設值為根層級 `targetLocales` 與各 `documentations[]` 區塊中可選的 `targetLocales` 的聯集）。                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | 僅翻譯此路徑下的 Markdown/JSON（專案相對路徑或絕對路徑）；`--file` 是 `--path` 的別名。                                                                                                                                                         |
| `--dry-run`                   | 不寫入檔案，也不呼叫 API。                                                                                                                                                                                                                                        |
| `--type <kind>`               | 僅限 `markdown` 或 `json`（否則若設定中啟用則兩者皆行）。                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | 僅翻譯 JSON 標籤檔案，或跳過 JSON 僅翻譯 Markdown 檔案。                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | 最大並行目標語系數量（預設值來自設定檔或 CLI 內建預設值）。                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | 每個檔案的最大並行批次 API 呼叫次數（文件數；預設值來自設定檔或 CLI）。                                                                                                                                                                                               |
| `--emphasis-placeholders`     | 在翻譯前將 Markdown 強調標記遮蔽為佔位符（可選；預設關閉）。                                                                                                                                                                              |
| `--debug-failed`              | 當驗證失敗時，在 `cacheDir` 下寫入詳細的 `FAILED-TRANSLATION` 日誌。                                                                                                                                                                                        |
| `--force-update`              | 即使檔案追蹤機制本應跳過，仍重新處理每個符合的檔案（提取、重新組合、寫入輸出）。**區段快取仍然生效** — 未變更的區段不會傳送至 LLM。                                                                                    |
| `--force`                     | 清除每個已處理檔案的檔案追蹤，並**不讀取**區段快取以進行 API 翻譯（完全重新翻譯）。新的結果仍會**寫入**區段快取中。                                                                                 |
| `--stats`                     | 列印區段數量、追蹤檔案數量及每語系的區段總數，然後退出。                                                                                                                                                                                    |
| `--clear-cache [locale]`      | 刪除快取的翻譯（及檔案追蹤）：全部語系，或單一語系，然後退出。                                                                                                                                                                             |
| `--prompt-format <mode>`      | 每個 **批次** 的片段如何傳送至模型並解析（`xml`、`json-array` 或 `json-object`）。預設為 `json-array`。不影響擷取、佔位符、驗證、快取或備援行為 — 請參閱 [批次提示格式](#batch-prompt-format)。 |

您無法同時使用 `--force` 與 `--force-update`（兩者互斥）。

<a id="batch-prompt-format"></a>
#### 批次提示格式

`translate-docs` 會將可翻譯片段以 **批次** 方式傳送至 OpenRouter（按 `batchSize` / `maxBatchChars` 分組）。`--prompt-format` 標誌僅改變該批次的 **傳輸格式**；`PlaceholderHandler` 權杖、Markdown AST 檢查、SQLite 快取鍵，以及批次解析失敗時的每片段備援行為皆不變。

| 模式                       | 使用者訊息                                                           | 模型回覆                                                 |
|----------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | 模擬 XML：每個片段一個 `<seg id="N">…</seg>`（含 XML 轉義）。 | 僅 `<t id="N">…</t>` 區塊，每個片段索引一個。       |
| `json-array`（預設） | 一個字串的 JSON 陣列，依序每個片段一個項目。               | 一個 **相同長度** 的 JSON 陣列（相同順序）。           |
| `json-object`          | 一個以區段索引為鍵的 JSON 物件 `{"0":"…","1":"…",…}`。            | 具有 **相同鍵**且值已翻譯的 JSON 物件。 |

執行標頭也會列印 `Batch prompt format: …`，讓您確認目前的啟用模式。當這些步驟作為 `translate-docs` 的一部分執行時（或 `sync` 的文件階段 —— `sync` 不會公開此旗標；預設為 `json-array`），JSON 標籤檔案（`jsonSource`）和獨立的 SVG 批次會使用相同的設定。

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### 區段去重與 SQLite 中的路徑

- 分段資料行以 `(source_hash, locale)`（雜湊值 = 標準化內容）作為全域鍵值。兩個檔案中的相同文字共用同一行；`translations.filepath` 是元資料（最後寫入者），並非每個檔案的第二個快取項目。
- `file_tracking.filepath` 使用命名空間鍵值：每個 `documentations` 區塊的 `doc-block:{index}:{relPath}`（`relPath` 為專案根目錄相對的 POSIX 路徑：收集的 Markdown 檔案路徑；**JSON 標籤檔案使用 cwd 相對路徑指向來源檔案**，例如 `docs-site/i18n/en/code.json`，以便清理時能解析實際檔案），以及 `svg-assets:{relPath}` 用於 `translate-svg` 下的獨立 SVG 資產。
- `translations.filepath` 儲存 Markdown、JSON 和 SVG 分段的 cwd 相對 POSIX 路徑（SVG 使用與其他資產相同的路徑結構；`svg-assets:…` 前置詞 **僅** 出現在 `file_tracking` 上）。
- 執行後，`last_hit_at` 僅針對 **相同翻譯範圍內**（遵循 `--path` 及啟用的類型）未被觸及的分段資料行進行清除，因此篩選或僅限文檔的執行不會標記不相關的檔案為過時。

<a id="output-layouts"></a>
### 輸出佈局

`"nested"`（省略時的預設值）— 在 `{outputDir}/{locale}/` 下鏡像原始樹狀結構（例如 `docs/guide.md` → `i18n/de/docs/guide.md`）。

`"docusaurus"` — 將位於 `docsRoot` 下的檔案放置於 `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`，符合一般 Docusaurus i18n 的佈局。將 `documentations[].markdownOutput.docsRoot` 設定為你的文件原始碼根目錄（例如 `"docs"`）。

```text
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - 將翻譯後的檔案與原始檔案並列，並加上語系後綴，或放在子目錄中。頁面之間的相對連結會自動重寫。

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-in-flat-layout"></a>
#### 平面版型中的錨點連結

平面輸出會為每種語系重寫頁面之間的 **相對路徑**（`guide.md` → `guide.de.md`）。**錨點連結** —— 使用路徑後接 `#` 的標準 Markdown 內嵌格式 —— 可跳轉至目標檔案中的特定章節：

```markdown
Read the [installation checklist](../setup.md#first-run) before you deploy.
```

此處連結目標為 `setup.md`，而 `#first-run` 是錨點：它應捲動至該檔案中的正確標題位置。

**為何需要特別注意錨點連結**

- `rewriteRelativeLinks` 會修正每種語系的 **檔案名稱**（`setup.md` → `setup.de.md`）。
- 許多渲染器會根據 **可見的標題文字** 生成 `#` slug。翻譯後，各語系的標題會有所不同，因此自動生成的 slug 可能改變，而重寫後的連結仍可能顯示為 `#first-run` —— 或您原本英文的 `#…` 錨點不再符合渲染器從翻譯後標題建立的 slug。
- 結果：讀者會抵達正確的 **檔案**，但捲動至錯誤的 **行數**，或瀏覽器找不到相符的標題。

**應對方式**

1. 在 `.md` / `.mdx` 上執行 `ai-i18n-tools write-heading-ids`，然後再進行 `translate-docs`（使用的 `documentations[]` / `contentPaths` 與平常相同）。此操作會在每個標題的前一行插入明確的 HTML 錨點，讓每個翻譯版本都能共用相同的 `id` 值。
2. 將您的 Markdown **錨點連結**指向這些穩定的 ID，例如 `[label](../other.md#section-id)`，其中 `section-id` 必須符合工具所寫入的錨點 ID——而不單只是根據英文單字猜測。

**範例**

`docs/overview.md`:

```markdown
See [TLS setup](../security.md#tls-configuration) for certificate steps.
```

`docs/security.md` 在 `write-heading-ids` 之後（簡化版）：

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

執行 `translate-docs` 後，每種語系檔案中的檔案路徑與 `#…` 錨點皆能保持一致，例如：

```markdown
Siehe [TLS-Einrichtung](../security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration` 錨點在所有語系中都相同，因為 `id` 在原始碼中已固定；僅標題的 **文字** 和連結的 **標籤** 會被翻譯。

<a id="images-and-raster-assets-in-translated-docs"></a>
#### 翻譯文件中的圖片與點陣資源

`translate-docs` 會翻譯 Markdown 區段（包含圖片的替代文字）。但它 **不會** 將點陣檔案（PNG、JPEG、WebP、GIF）複製到您的文件 `outputDir` 中。您必須將檔案放在重寫後的 URL 所指向的位置，或在翻譯後調整 URL（通常使用 `markdownOutput.postProcessing.regexAdjustments`）。

**作為插圖資產使用的 SVG** 應使用 `svg` 區塊與 `translate-svg` — 請參閱[`svg` (選用)](#svg-optional)。`documentations[].contentPaths` 中列出的路徑僅適用於 Markdown/MDX（以及選用的 JSON 標籤），不適用於獨立 SVG 的翻譯。

**為何平面佈局通常需要修正**

使用 `markdownOutput.style` `flat` 和預設的相對連結重寫功能時，翻譯頁面之間的連結會依語系重寫。對非 Markdown 檔案的連結會加上深度前綴，以保持相對於每個輸出檔案的路徑（例如，原始檔旁的 `figure.png` 在翻譯後可能變成 `../figure.png`）。此 URL 通常僅在輸出目錄 **內** 才能解析。CLI 不會在此處輸出二進位檔案，因此除非您複製資源、從其他位置提供服務或重寫連結，否則讀者會遇到檔案遺失的問題。請在翻譯後套用您的規則：`postProcessing` 會在區段重新組合和平面連結重寫後執行（詳見[設定參考](#configuration-reference)中的 `markdownOutput.postProcessing` 欄位）。

**模式 1 — 與英文原始檔同存於同一個儲存庫的資源（此套件）**

此儲存庫將 `docs/GETTING_STARTED.md` 翻譯為 `translated-docs/docs/GETTING_STARTED.<locale>.md`。原始檔使用同層級的圖片 `translation-cache-editor.png`。平面重寫會指向 `translated-docs/translation-cache-editor.png`，但該路徑從未被寫入。根目錄的 `ai-i18n-tools.config.json` 新增了一條規則，用來比對 Markdown 圖片中穩定的結尾部分（即 `](…)` URL 片段，而非翻譯後的替代文字），並將其重新導向至 `docs/`：

```json
{
  "description": "Editor screenshot: flat link rewrite points to translated-docs/; asset lives in docs/",
  "search": "\\]\\(\\.\\./translation-cache-editor\\.png\\)",
  "replace": "](../../docs/translation-cache-editor.png)"
}
```

**模式 2 — 按語系分開的截圖資料夾（`examples/nextjs-app`）**

Next.js 範例在 `examples/nextjs-app/ai-i18n-tools.config.json` 中使用了兩個 `documentations[]` 區塊。

- **Docusaurus 文件**（`markdownOutput.style` `docusaurus`）：位於 `docs-site/docs/` 下的英文頁面，使用 URL 中包含固定語系片段的截圖，例如 `/img/screenshots/en-GB/screenshot.png` 在 `feature-showcase.md` 中。後處理會替換該語系片段，使每個位於 `docs-site/i18n/<locale>/…/current/` 下的翻譯頁面都能解析到對應的資料夾：

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/en-GB/",
  "replace": "screenshots/${translatedLocale}/"
}
```

在您的網站靜態樹中部署對應的 PNG 檔案（例如，對於以 `docs-site/static/img/screenshots/<locale>/` 開頭的 URL，將檔案放在 `/img/screenshots/`）。

- **根目錄 README，平面輸出**（同一檔案中的第二個 `documentations[]` 區塊）：僅 `README.md` 被翻譯，並包含 `markdownOutput.style` `flat` 和 `outputDir` `translated-docs`，因此你會得到 `translated-docs/README.<locale>.md`。英文圖片的路徑中通常在中間使用穩定的資料夾區段（例如 `images/screenshots/en-GB/overview.png`）。後處理會將 `images/screenshots/` 與 URL 其餘部分之間的單一路徑區段替換為目前啟用的 `${translatedLocale}`，因此每個翻譯後的 README 都會指向 `images/screenshots/de/…`、`images/screenshots/fr/…` 等。此模式與 Docusaurus 規則不同：在此處 `search` 符合 **任意** 資料夾名稱（`[^/]+/`），而不僅是 `en-GB/`。

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

將 PNG 檔案保留在磁碟上的 `images/screenshots/<locale>/` 目錄下（與重寫後 URL 使用的相同結構）。

**模式 3 — 獨立 SVG（`examples/nextjs-app`）**

相同的範例啟用了 `features.translateSVG`，並將原始 SVG 對應至 Web 應用程式的公開資料夾：

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

執行 `translate-svg`（或 `sync`），使 `images/*.svg` 產生對應語系的輸出，存放於 `public/assets/` 下。Markdown 則個別引用這些 URL，與 `translate-docs` 分開。

**最小化的僅 README 範例（`examples/console-app`）**

`examples/console-app/ai-i18n-tools.config.json` 使用 `postProcessing.languageListBlock` 將 `README.md` 翻譯為 `translated-docs/`。它未定義任何圖片規則 — 當 README 沒有同層級的點陣圖檔，或僅使用主機已提供服務的絕對 URL 時，這種做法是合適的。

取代樣板支援諸如 `${translatedLocale}` 和 `${translatedBasedir}` 等樣板（完整列表請見[設定參考](#configuration-reference)中的 `markdownOutput.postProcessing.regexAdjustments` 欄位）。

<a id="markdown-output-path-template-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` 標記

透過設定 `documentations[].markdownOutput.pathTemplate`（Markdown 和 MDX）或 `jsonPathTemplate`（JSON 標籤檔案）來覆寫翻譯檔案的輸出位置。兩者皆接受相同的標記。解析後的路徑必須位於該區塊的 `outputDir` 內（CLI 會拒絕超出此範圍的路徑）。

若您使用自訂的 `pathTemplate`，除非明確設定，否則 `rewriteRelativeLinks` 將預設為 `false` —— 平面式連結重寫機制是為內建的 `flat` 版型所設計。

| 標記 | 功能 | 範例 |
|-------------|------|---------|
| `{outputDir}` | 此文件區塊 `outputDir` 的絕對解析路徑 | `/home/acme/repo/i18n` |
| `{locale}` | 目標語系代碼（格式與設定檔 / CLI 相同） | `de`, `pt-BR` |
| `{LOCALE}` | 相同語系的大寫形式 | `DE`, `PT-BR` |
| `{relPath}` | 相對於專案根目錄的原始檔案路徑，採用 POSIX `/` 格式 | `docs/guide.md`, `README.md` |
| `{stem}` | 檔案名稱 **無**副檔名 | `guide` 用於 `docs/guide.md` |
| `{basename}` | 檔案名稱 **含**副檔名 | `guide.md` |
| `{extension}` | 副檔名 **包含**句點 | `.md`, `.mdx` |
| `{docsRoot}` | `markdownOutput.docsRoot` 的絕對解析路徑（省略時預設為 `docs`） | `/home/acme/repo/docs` |
| `{relativeToDocsRoot}` | 當路徑字串對齊時，移除具有匹配 `docsRoot` 前綴的 `{relPath}`（POSIX）；否則保持不變 | `docs/guide.md`（常見）；僅在執行剝離時為 `guide.md` |

**範例**

設定程式碼片段：

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

對於語系 `de` 和來源 `docs/guide.md`，專案根目錄為 `/home/acme/repo` 且 `outputDir` 解析為 `/home/acme/repo/i18n` 時，展開後的路徑為：

```text
/home/acme/repo/i18n/de/docs/guide.md
```

一種 `flat` 風格的模式，若僅保留檔名，可使用 `{stem}` 和 `{extension}`，例如 `{outputDir}/{stem}.{locale}{extension}`，在解析後的 `outputDir` 下會產生 `…/guide.de.md`。

---

<a id="combined-workflow-ui--docs"></a>
## 結合工作流程（UI + 文件）

在單一設定中啟用所有功能，以同時執行兩個工作流程：

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "markdownOutput": { "style": "flat" }
    }
  ]
}
```

`glossary.uiGlossary` 讓文件翻譯指向與 UI 相同的 `strings.json` 目錄，以保持術語一致性；`glossary.userGlossary` 添加 CSV 覆寫以處理產品術語。

執行 `npx ai-i18n-tools sync` 來運行單一流水線：**提取** UI 字串（若設定 `features.extractUIStrings`）、**翻譯 UI** 字串（若設定 `features.translateUIStrings`）、**翻譯獨立 SVG 資產**（若設定 `features.translateSVG` 且有 `svg` 區塊），然後 **翻譯文件**（每個 `documentations` 區塊依設定處理 markdown/JSON）。可使用 `--no-ui`、`--no-svg` 或 `--no-docs` 跳過部分步驟。文件步驟接受 `--dry-run`、`-p` / `--path`、`--force` 和 `--force-update`（後兩者僅在執行文件翻譯時生效；若傳入 `--no-docs` 則會被忽略）。

在區塊上使用 `documentations[].targetLocales` 可將該區塊的檔案翻譯成比 UI **更小的子集**（有效文件語系為所有區塊的 **聯集**）：

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docusaurus--flat"></a>
### 混合文件工作流程（Docusaurus + 平面）

你可以透過在 `documentations` 中加入多個項目，在同一設定中結合多個文件流水線。當專案包含 Docusaurus 網站以及需要以平坦輸出方式翻譯的根層級 markdown 檔案（例如儲存庫的 readme）時，這是一種常見的設定。

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus docs and JSON labels",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README in flat output",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

使用 `npx ai-i18n-tools sync` 時的執行方式：

- 從 `src/` 提取/翻譯 UI 字串至 `public/locales/`。
- 第一個文件區塊將 markdown 和 JSON 標籤翻譯為 Docusaurus 的 `i18n/<locale>/...` 佈局。
- 第二個文件區塊將 `README.md` 翻譯為 `translated-docs/` 下的平坦語系後綴檔案。
- 所有文件區塊共用 `cacheDir`，因此未變更的段落會在執行間重複使用，以減少 API 呼叫次數與成本。

---

<a id="translation-cache-editor"></a>
## 翻譯快取編輯器

執行：

```bash
ai-i18n-tools editor
# Optional: choose port, do not auto-open browser
# ai-i18n-tools editor -p 8765 --no-open
```

這將啟動一個本地 Web UI，後端為您設定的 **`cacheDir`** SQLite 資料庫——與 CLI 用於文件區段、日誌及相關中繼資料的目錄相同。包含以下分頁：**文件**（快取的文件區段）、**UI 字串**、**UI 複數**、**詞彙表**、**失敗項目** 與 **統計資料**。

![Translation Cache Editor](../../docs/translation-cache-editor.png)

如果您在此應用程式中**編輯快取資料列**（例如文件段落），請執行`sync --force-update`或使用等效的翻譯指令並搭配`--force-update`，以確保磁碟上的輸出與快取一致；若稍後儲存庫中的**原始文字**變更，段落雜湊值也會改變，針對舊文字的手動編輯將被取代。

<a id="translation-cache-editor-failures"></a>
### 失敗記錄（文件翻譯）

**失敗記錄**分頁僅適用於**文件**翻譯。它會讀取當某段文字無法成功翻譯至特定語系時寫入 SQLite 的錯誤紀錄——例如空的或無效的模型輸出、翻譯後驗證錯誤（`AST mismatch`、佔位符洩漏及其他類似**品質**檢查問題），或是阻礙進程的**嚴重**錯誤。此功能可協助您回答：*哪個原始段落出錯？針對哪個語系與模型？記錄的錯誤訊息為何？*

<a id="when-to-use-it"></a>
#### 何時使用

- 當 `translate-docs` 或 `sync` 執行完畢後出現錯誤、部分語系或混亂的記錄時，您可透過排序與篩選失敗項目，而不必僅靠捲動終端機輸出內容。
- 當您想 **優先處理重做**時：可依 **# 失敗次數**排序，讓在多次重試中反覆失敗的段落排在最前面；這些段落很適合在原始 Markdown 中進行 **簡化或重新格式化**，以利後續執行成功。
- 當您需要取得 **確切的段落**資訊——檔案路徑、行號提示、原始內容雜湊值及完整原始文字——以便在您的儲存庫中編輯正確的段落。

<a id="why-source-edits-matter"></a>
#### 為何原始內容編輯很重要

密集的內嵌標記（**粗體**混用`` `code` ``、嵌套強調、包含多個片段的長句子）會讓模型更難返回能通過結構檢查的翻譯結果。通常具有**多次記錄失敗**的段落，透過**重寫或拆分**原始內容（或將範例移至 fenced code block）所獲得的改善，遠比在未變更的原文上反覆執行翻譯來得有效。這與[複雜 Markdown 與失敗的品質檢查](#complex-markdown-and-failed-quality-checks)的建議一致。

<a id="how-to-use-the-tab"></a>
#### 如何使用此分頁

1. 在編輯器中開啟 **失敗**（與[翻譯快取編輯器](#translation-cache-editor) 使用相同的瀏覽器工作階段）。
2. 讀取 **摘要** 列（包含任何失敗的區段，以及分別有 **1**、**2** 或 **3+** 個失敗記錄的區段數量）。
3. 依部分 **檔案名稱**、**語系**、**模型**、**品質錯誤**（數值來自您的快取）、僅 **致命錯誤**，以及選擇性的 **來源雜湊**、**來源文字** 或 **錯誤訊息** 子字串進行篩選，然後按一下 **套用**。
4. 選擇 **排序：失敗次數**（預設）或 **排序：檔案路徑 + 行號**。
5. 使用表格頂部或底部的分頁功能。**點選資料列**可切換顯示完整原始文字。資料列中的連結控制項（若已啟用）會要求伺服器程序將檔案/行號提示記錄至執行`ai-i18n-tools editor`的**終端機**——方便您從瀏覽器跳轉至編輯器。
6. 在您的專案中修正**原始檔案**，然後再次執行`translate-docs`或`sync`。若成功執行後清單看起來**過時**，請執行`ai-i18n-tools sync --force-update`並重新載入編輯器（失敗記錄面板會顯示相同提示）。

若您希望在使用 UI 的同時搭配檔案式除錯，仍可使用`translate-docs --debug-failed`在重試期間將`FAILED-TRANSLATION`詳細資訊寫入`cacheDir`——詳見[快取行為與`translate-docs`旗標](#cache-behaviour-and-translate-docs-flags)。

---

<a id="configuration-reference"></a>
## 設定參考

<a id="sourcelocale"></a>
### `sourceLocale`

原始語言的 BCP-47 代碼（例如 `"en-GB"`、`"en"`、`"pt-BR"`）。此語系不會產生翻譯檔案 — 鍵字串本身即為原始文字。

**必須匹配** 從你的執行時 i18n 設定檔（`src/i18n.ts` / `src/i18n.js`）匯出的 `SOURCE_LOCALE`。

<a id="targetlocales"></a>
### `targetLocales`

要翻譯成的 BCP-47 地區語系代碼陣列（例如 `["de", "fr", "es", "pt-BR"]`）。

`targetLocales` 是用於 UI 翻譯的主要語系清單，也是文件區塊的預設語系清單。使用 `generate-ui-languages` 從 `sourceLocale` + `targetLocales` 建立 `ui-languages.json` 檔案清單。

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath`（選用）

用於顯示名稱、語系篩選和語言清單後處理的 `ui-languages.json` 檔案清單路徑。若省略，CLI 會在 `ui.flatOutputDir/ui-languages.json` 處尋找該檔案清單。

在以下情況使用此設定：

- 檔案清單位於 `ui.flatOutputDir` 之外，需明確指向 CLI。
- 您希望 `markdownOutput.postProcessing.languageListBlock` 從檔案清單建立語系標籤。
- `extract` 應將檔案清單中的 `englishName` 項目合併至 `strings.json`（需要 `ui.reactExtractor.includeUiLanguageEnglishNames: true`）。

<a id="concurrency-optional"></a>
### `concurrency`（選用）

同時翻譯的最大 **目標語系數量**（`translate-ui`、`translate-docs`、`translate-svg` 以及 `sync` 中對應的步驟）。若省略，CLI 在 UI 翻譯時使用 **4**，在文件翻譯時使用 **3**（內建預設值）。可透過 `-j` / `--concurrency` 在每次執行時覆寫。

<a id="batchconcurrency-optional"></a>
### `batchConcurrency`（選用）

**translate-docs** 與 **translate-svg**（以及 `sync` 的文件步驟）：每個檔案最多並行的 OpenRouter **批次** 請求數（每批次可包含多個片段）。若省略，預設為 **4**。`translate-ui` 會忽略此設定。可透過 `-b` / `--batch-concurrency` 覆寫。在 `sync` 上，`-b` 僅適用於文件翻譯步驟。

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars`（選用）

文件翻譯的片段批次設定：每項 API 請求的片段數量與字元上限。預設值：**20** 個片段，**4096** 個字元（若省略）。

<a id="openrouter"></a>
### `openrouter`

| 欄位               | 說明                                                                                                                                                                                                      |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `baseUrl`           | OpenRouter API 基本 URL。預設值：`https://openrouter.ai/api/v1`。                                                                                                                                                |
| `translationModels` | 優先使用的模型 ID 有序清單。會先嘗試第一個；若發生錯誤則依序使用後續項目作為備援。僅針對 `translate-ui`，您也可以設定 `ui.preferredModel` 以在清單前嘗試單一模型（參見 `ui`）。 |
| `defaultModel`      | 已淘汰的單一主要模型。僅在 `translationModels` 未設定或為空時使用。                                                                                                                               |
| `fallbackModel`     | 已淘汰的單一備援模型。在 `defaultModel` 之後使用，當 `translationModels` 未設定或為空時生效。                                                                                                              |
| `maxTokens`         | 每次請求的最大完成 token 數。預設值：`8192`。                                                                                                                                                              |
| `temperature`       | 取樣溫度。預設值：`0.2`。                                                                                                                                                                            |
| `requestTimeoutMs` | 等待每個傳送至 OpenRouter 的 HTTP 請求（對話完成及內部 `GET /models` 呼叫）的最長時間（毫秒）。預設值：`30000`（30 秒）。|

**為何使用多個模型：** 不同供應商和模型在各語言與語系上的成本與品質表現各異。將 `openrouter.translationModels` 設定為 **有序的備援鏈**（而非單一模型），讓 CLI 在請求失敗時可嘗試下一個模型。

請將下方清單視為可擴充的 **基準**：若某語系的翻譯品質不佳或失敗，請研究哪些模型能有效支援該語言或文字（參考線上資源或供應商文件），並加入對應的 OpenRouter ID 作為額外選項。

此清單已**測試過廣泛的地區覆蓋範圍**（例如，在**2026年4月**翻譯大型文件專案中的**36**個目標地區時）；可作為實用的預設選項，但無法保證在所有地區皆有良好表現。

範例 `translationModels`（與 `npx ai-i18n-tools init` 相同的預設值）：

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v3.2",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
]
```

在您的環境或 `.env` 檔案中設定 `OPENROUTER_API_KEY`。

在變更 `translationModels` 之前，請先執行 `npx ai-i18n-tools check-models`，以根據 OpenRouter 的即時目錄（`GET /models`）驗證每個已設定的模型 ID。此指令會報告遺失或已過期（`expiration_date`）的 ID，列出有效模型及其預估的輸入/輸出價格（每百萬 tokens 的美元價格），並在任何已設定的 ID 無效時以非零狀態碼結束。需要 `OPENROUTER_API_KEY`。

<a id="features"></a>
### `features`

| 欄位                | 工作流程 | 說明                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | 掃描原始碼中的 `t("…")` / `i18n.t("…")`，將選擇性的 `package.json` 說明以及（若啟用）`ui-languages.json` `englishName` 值合併至 `strings.json`。 |
| `translateUIStrings` | 1        | 翻譯 `strings.json` 項目並寫入各地區的 JSON 檔案。                                                                                                  |
| `translateMarkdown`  | 2        | 翻譯 `.md` / `.mdx` 檔案。                                                                                                                                    |
| `translateJSON`      | 2        | 翻譯 Docusaurus JSON 標籤檔案。                                                                                                                             |
| `translateSVG`       | 2        | 翻譯獨立的 `.svg` 資產（需要頂層的 `svg` 區塊）。                                                                                         |

**翻譯獨立的** SVG 資產時，若 `features.translateSVG` 為 true 且已設定頂層的 `svg` 區塊，則使用 `translate-svg`。當這兩個條件都滿足時（除非設定 `--no-svg`），`sync` 命令會執行該步驟。

<a id="ui"></a>
### `ui`

| 欄位                                          | 說明                                                                                                                                                                                                                                                        |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourceRoots`                                  | 相對於目前工作目錄的目錄，用於掃描 `t("…")` 呼叫。                                                                                                                                                                                                          |
| `stringsJson`                                  | 主目錄檔案的路徑。由 `extract` 更新。                                                                                                                                                                                                             |
| `flatOutputDir`                                | 寫入各地區 JSON 檔案的目錄（例如 `de.json` 等）。                                                                                                                                                                                               |
| `preferredModel`                               | 選填。優先嘗試用於 `translate-ui` 的 OpenRouter 模型 ID；若失敗則依序嘗試 `openrouter.translationModels`（或舊版模型），但不會重複此 ID。                                                                                                   |
| `reactExtractor.funcNames`                     | 要掃描的額外函數名稱（預設值：`["t", "i18n.t"]`）。                                                                                                                                                                                                    |
| `reactExtractor.extensions`                    | 要包含的檔案副檔名（預設值：`[".js", ".jsx", ".ts", ".tsx"]`）。                                                                                                                                                                                            |
| `reactExtractor.includePackageDescription`     | 當設定為 `true`（預設值）時，`extract` 在存在的情況下也會將 `package.json` `description` 包含為 UI 字串。                                                                                                                                                           |
| `reactExtractor.packageJsonPath`               | 用於提取可選描述的自訂 `package.json` 檔案路徑。                                                                                                                                                                              |
| `reactExtractor.includeUiLanguageEnglishNames` | 當設定為 `true`（預設值 `false`）時，若來源掃描尚未包含（相同雜湊鍵），`extract` 也會將 manifest 中 `uiLanguagesPath` 的每個 `englishName` 加入 `strings.json`。需要 `uiLanguagesPath` 指向有效的 `ui-languages.json`。 |

<a id="cachedir"></a>
### `cacheDir`

| 欄位      | 說明                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite 快取目錄（所有 `documentations` 區塊共用）。可在多次執行間重複使用。若您正從自訂的文件翻譯快取遷移，請封存或刪除舊快取 — `cacheDir` 會建立自己的 SQLite 資料庫，且不相容於其他結構。 |

版本控制系統（VCS）排除的最佳實務：

- 排除翻譯快取資料夾內容（例如透過 `.gitignore` 或 `.git/info/exclude`），以避免提交暫存的快取產物。
- 請保留 `cache.db`（不要經常刪除），因為保留 SQLite 快取可避免重新翻譯未變更的片段，在使用 `ai-i18n-tools` 的軟體變更或升級時節省執行時間與 API 成本。

範例：

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

<a id="documentations"></a>
### `documentations`

文件處理流程區塊的陣列。`translate-docs` 和 `sync` 的文件階段 **會依序處理每個** 區塊。

| 欄位                                             | 說明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `description`                                     | 此區塊的可選人類可讀備註（不適用於翻譯）。設定時會作為 `translate-docs` `🌐` 標題的前綴；也會顯示在 `status` 章節標頭中。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `contentPaths`                                    | 要翻譯的 Markdown/MDX 原始檔（`translate-docs` 會掃描這些檔案以取得 `.md` / `.mdx`）。JSON 標籤來自此區塊中的 `jsonSource`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `outputDir`                                       | 此區塊翻譯輸出的根目錄。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sourceFiles`                                     | 載入時合併至 `contentPaths` 的選擇性別名。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `targetLocales`                                   | 僅針對此區塊的選擇性語系子集（否則使用根層級的 `targetLocales`）。實際生效的文件語系為所有區塊的語系聯集。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `jsonSource`                                      | 此區塊的 Docusaurus JSON 標籤檔案來源目錄（例如 `"i18n/en"`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.style`                            | `"nested"`（預設）、`"docusaurus"` 或 `"flat"`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.docsRoot`                         | Docusaurus 版面配置的原始文件根目錄（例如 `"docs"`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `markdownOutput.pathTemplate`                     | 自訂的 Markdown 輸出路徑。可用的佔位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.jsonPathTemplate`                 | 標籤檔案的自訂 JSON 輸出路徑。支援與 `pathTemplate` 相同的佔位符。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `markdownOutput.flatPreserveRelativeDir`          | 對於 `flat` 樣式，保留原始的子目錄結構，以避免檔名相同的檔案發生衝突。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `markdownOutput.rewriteRelativeLinks`             | 翻譯後重新撰寫相對連結（針對 `flat` 樣式會自動啟用）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `markdownOutput.linkRewriteDocsRoot`              | 計算扁平化連結重寫前綴時所使用的儲存庫根目錄。除非你的翻譯文件位於不同的專案根目錄下，否則通常應保留為 `"."`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `markdownOutput.postProcessing`                | 對翻譯後的 **markdown 內容** 進行可選的轉換（YAML 前置內容會保留）。此步驟在片段重新組合與扁平連結重寫之後執行，在 `addFrontmatter` 之前執行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `segmentSplitting`                             | 與 `markdownOutput` 相同層級（依據 `documentations[]` 區塊）。可選更細緻的段落用於 `translate-docs` 提取：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`。當 `enabled` 為 `true` 時（`segmentSplitting` 省略時的預設值），密集段落、GFM 管線表格（第一個區塊包含標題、分隔線與第一筆資料列）以及長列表會被分割；子部分以單一換行符重新連接（`tightJoinPrevious`）。設定 `"enabled": false` 則僅針對以空白行分隔的主體區塊各使用一個段落。 |
| `markdownOutput.postProcessing.regexAdjustments`  | `{ "description"?, "search", "replace" }` 的有序列表。`search` 為正規表示式模式（純字串使用旗標 `g`，或 `/pattern/flags`）。`replace` 支援諸如 `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}` 等佔位符。                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator", "label" }` — 轉譯器會尋找包含 `start` 的第一行以及對應的 `end` 行，然後將該段落替換為標準的語言切換器。`label` 控制 manifest 標籤的來源：`"local"`（預設，使用 `ui-languages.json` `label`）或 `"english"`（使用 `englishName`）。連結的路徑是相對於翻譯後的檔案來建立；當未設定 manifest 時，標籤會來自 `localeDisplayNames` 和語系代碼。|
| `addFrontmatter`                                  | 當設定為 `true`（省略時預設值）時，翻譯後的 markdown 檔案會包含以下 YAML 欄位：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`，且當至少一個片段具有模型中繼資料時，還會包含 `translation_models`（所使用的 OpenRouter 模型 ID 的排序清單）。設定為 `false` 可跳過此步驟。                                                                                                                                                                                                                                                                                                                           |

範例（扁平 README 流程 — 截圖路徑 + 可選的語言清單包裝）：

```json
"markdownOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

<a id="svg-optional"></a>
### `svg`（選用）

獨立 SVG 資產的頂層路徑與佈局。僅當 `features.translateSVG` 為 true 時執行翻譯（透過 `translate-svg` 或 `sync` 的 SVG 階段）。

| 欄位                         | 說明                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | 一個目錄或目錄陣列，會遞迴掃描 `.svg` 檔案。                                                                                                                                                                                                     |
| `outputDir`                   | 已翻譯 SVG 輸出的根目錄。                                                                                                                                                                                                                                          |
| `style`                       | 當 `pathTemplate` 未設定時，為 `"flat"` 或 `"nested"`。                                                                                                                                                                                                                               |
| `pathTemplate`                | 自訂 SVG 輸出路徑。可用的佔位符：<code>{"{outputDir}"}</code>、<code>{"{locale}"}</code>、<code>{"{LOCALE}"}</code>、<code>{"{relPath}"}</code>、<code>{"{stem}"}</code>、<code>{"{basename}"}</code>、<code>{"{extension}"}</code>、<code>{"{relativeToSourceRoot}"}</code>。 |
| `svgExtractor.forceLowercase` | 在 SVG 重組時使用小寫翻譯文字。適用於依賴全小寫標籤的設計。                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| 欄位          | 說明                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 指向 `strings.json` 的路徑 - 從現有翻譯自動建立詞彙表。                                                                                                 |
| `userGlossary` | 指向 CSV 檔案的路徑，欄位包含 `Original language string`（或 `en`）、`locale`、`Translation` - 每個原始術語與目標語系各佔一行（`locale` 可為所有目標語系指定為 `*`）。 |

舊版鍵值 `uiGlossaryFromStringsJson` 仍被接受，並在載入設定時對應至 `uiGlossary`。

產生一個空白的詞彙表 CSV：

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI 參考

| 命令                                                                     | 說明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                   | 列印 CLI 版本和建置時間戳記（與根程式上的 `-V` / `--version` 相同的資訊）。
| `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]`  | 寫入起始設定檔（包含 `concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 和 `documentations[].addFrontmatter`）。`--with-translate-ignore` 會建立一個起始的 `.translate-ignore`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `check-models`                                                              | 根據 `GET /models` 驗證每個設定的 OpenRouter 模型 id（目錄成員資格、`expiration_date`、每百萬 token 的提示/補齊美元價格）。需要 `OPENROUTER_API_KEY`。當任何設定的 id 缺失或已過期時，會以非零值退出。對於目錄請求，會遵守 `openrouter.requestTimeoutMs`。 |
| `extract`                                                                   | 從 `t("…")` / `i18n.t("…")` 字面值更新 `strings.json`，可選擇性加入 `package.json` 說明和可選的 manifest `englishName` 項目（參見 `ui.reactExtractor`）。需要 `features.extractUIStrings`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `generate-ui-languages [--master <path>] [--dry-run]`                       | 使用 `sourceLocale` + `targetLocales` 和內建的 `data/ui-languages-complete.json`（或 `--master`）將 `ui-languages.json` 寫入 `ui.flatOutputDir`（或設定時使用 `uiLanguagesPath`）。若主檔案中缺少某些語系，會發出警告並產生 `TODO` 佔位符。如果您現有的 manifest 中包含自訂的 `label` 或 `englishName` 值，這些值將被主目錄中的預設值取代——請在產生檔案後審查並調整。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `translate-docs …`                                                          | 為每個 `documentations` 區塊（`contentPaths`，可選的 `jsonSource`）翻譯 Markdown/MDX 和 JSON。`-j`：最多平行處理的語系數量；`-b`：每份檔案最多平行處理的批次 API 呼叫數。`--prompt-format`：批次傳輸格式（`xml` \| `json-array` \| `json-object`）。請參閱 [快取行為與 `translate-docs` 標記](#cache-behaviour-and-translate-docs-flags) 和 [批次提示格式](#batch-prompt-format)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `write-heading-ids …`                                                       | **無 API。** 至少需要一個 `documentations[]` 區塊。蒐集每個區塊下的 `.md` / `.mdx` 並置於該區塊的 `contentPaths` 中（遵循 `.translate-ignore`）。在每個平面 ATX `#` 標題的**之前**立即插入 HTML 錨點行 `<a id="slug"></a>`（跳過 fenced code block 內的標題）。`-p` / `--path` 或 `-f` / `--file`：限制為專案相對路徑的檔案或目錄。`--slug-style`：`github`（預設；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`。搭配 `pymdown`，可選擇性使用 `--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--dry-run`：僅列出變更。 |
| `translate-svg …`                                                           | 翻譯在 `config.svg` 中設定的獨立 SVG 資產（與文件分開）。需要 `features.translateSVG`。與文件相同的快取機制；支援 `--no-cache` 以在此次執行中跳過 SQLite 讀寫操作。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`             | 僅翻譯使用者介面字串。`--force`：針對每種語系重新翻譯所有項目（忽略現有翻譯）。`--dry-run`：不寫入、不呼叫 API。`-j`：最多平行處理的語系數量。需要 `features.translateUIStrings`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                                                    | 執行 `extract` **first**（需要 `features.extractUIStrings`），使 `strings.json` 與原始來源相符，然後由 LLM 審查 **source-locale** 的 UI 字串（拼字、文法）。**術語提示** 僅來自 `glossary.userGlossary` CSV（範圍與 `translate-ui` 相同 — 不包含 `strings.json` / `uiGlossary`，因此不會將不良文案強化為術語表）。使用 OpenRouter（`OPENROUTER_API_KEY`）。僅供建議用途（執行完畢後以 **0** 狀態結束）。將 `lint-source-results_<timestamp>.log` 寫入 `cacheDir` 下作為 **人類可讀** 的報告（包含摘要、問題及每條字串的 **OK** 列）；終端機僅顯示摘要統計與問題（每條字串不顯示 `[ok]` 行）。最後一行會列印出日誌檔名。`--json`：僅在 stdout 輸出完整機器可讀的 JSON 報告（日誌檔維持人類可讀格式）。`--dry-run`：仍會執行 `extract`，但僅輸出批次計畫（不進行 API 呼叫）。`--chunk`：每次 API 批次處理的字串數量（預設為 **50**）。`-j`：最大並行批次數（預設為 `concurrency`）。搭配 `--json` 時，人類可讀格式的輸出會導向 stderr。連結使用 `path:line`，如同 `editor` UI 字串中的「連結」按鈕。 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | 匯出 `strings.json` 為 XLIFF 2.0 格式（每個目標語系產生一個 `.xliff`）。`-o` / `--output-dir`：輸出目錄（預設：與目錄檔相同資料夾）。`--untranslated-only`：僅包含該語系尚未翻譯的單元。唯讀模式；不呼叫 API。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sync …`                                                                    | 若已啟用則先提取，接著進行 UI 翻譯，當 `features.translateSVG` 與 `config.svg` 已設定時再執行 `translate-svg`，最後進行文件翻譯 — 除非使用 `--no-ui`、`--no-svg` 或 `--no-docs` 跳過。共用旗標：`-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（僅文件批次處理使用）、`--force` / `--force-update`（僅文件使用；文件執行時互斥）。文件階段也會轉傳 `--emphasis-placeholders` 與 `--debug-failed`（意義與 `translate-docs` 相同）。`--prompt-format` 不是 `sync` 旗標；文件步驟使用內建預設值（`json-array`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `status [--max-columns <n>]`                                                | 當 `features.translateUIStrings` 啟用時，會列印每個語系的 UI 覆蓋率（`Translated` / `Missing` / `Total`）。然後列印每個檔案 × 語系的 Markdown 翻譯狀態（無 `--locale` 篩選；語系來自設定）。若語系清單過長，將會分割成多個表格，每個表格最多 `n` 個語系欄位（預設值為 **9**），以確保終端機中的行寬不會過寬。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                       | 先執行 `sync --force-update`（提取、UI、SVG、文件），然後移除過時的片段列（`last_hit_at` 為 null 或檔案路徑為空）；刪除解析後原始路徑在磁碟上不存在的 `file_tracking` 列；移除 `filepath` 元資料指向不存在檔案的翻譯列。記錄三項計數（過時、孤立的 `file_tracking`、孤立的翻譯）。除非指定 `--no-backup`，否則會在快取目錄下建立帶有時間戳記的 SQLite 備份。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `editor [-p <port>] [--no-open]`                                            | 啟動本地網頁編輯器以編輯快取、`strings.json` 和詞彙 CSV。`--no-open` 不會自動打開預設瀏覽器。<br><br>**注意：** 如果您在快取編輯器中編輯條目，您必須執行 `sync --force-update` 來重寫輸出檔案以更新快取條目。此外，如果源文本稍後更改，手動編輯將會丟失，因為會生成新的快取鍵。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `glossary-generate [-o <path>]`                                             | 寫入一個空的 `glossary-user.csv` 模板。`-o`：覆寫輸出路徑（預設值：來自設定的 `glossary.userGlossary`，或 `glossary-user.csv`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

所有指令都接受 `-c <path>` 來指定非預設的設定檔，`-v` 用於詳細輸出，以及 `-w` / `--write-logs [path]` 將主控台輸出複製到日誌檔（預設路徑：位於根目錄 `cacheDir` 下）。根程式也支援 `-V` / `--version` 和 `-h` / `--help`；`ai-i18n-tools help [command]` 會顯示與 `ai-i18n-tools <command> --help` 相同的每指令用法。

---

<a id="environment-variables"></a>
## 環境變數

| 變數                    | 說明                                                       |
|-------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`    | **必要。** 您的 OpenRouter API 金鑰。                     |
| `OPENROUTER_BASE_URL`   | 覆寫 API 基本 URL。                                 |
| `I18N_SOURCE_LOCALE`    | 執行期間覆寫 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`   | 以逗號分隔的語系代碼，用於覆寫 `targetLocales`。  |
| `I18N_LOG_LEVEL`        | 記錄器等級（`debug`、`info`、`warn`、`error`、`silent`）。 |
| `NO_COLOR`              | 當設定為 `1` 時，停用日誌輸出中的 ANSI 色彩。              |
| `I18N_LOG_SESSION_MAX`  | 每次日誌會話保留的最大行數（預設 `5000`）。           |
