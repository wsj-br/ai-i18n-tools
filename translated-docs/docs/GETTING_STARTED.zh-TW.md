# ai-i18n-tools: 入門指南

`ai-i18n-tools` 提供兩個獨立的可組合工作流程：

- **Workflow 1 - UI 翻譯**：從任何 JS/TS 原始碼中提取 `t("…")` 呼叫，透過 OpenRouter 進行翻譯，並寫入扁平的每種語言 JSON 檔案，以供 i18next 使用。
- **Workflow 2 - 文件翻譯**：將 markdown（MDX）和 Docusaurus JSON 標籤檔案翻譯成任意數量的語系，並具備智慧快取功能。**SVG** 資產使用 `features.translateSVG`、頂層的 `svg` 區塊，以及 `translate-svg`（參見 [CLI 參考](#cli-reference))。

這兩個工作流程都使用 OpenRouter（任何兼容的 LLM）並共享一個配置文件。

<small>**以其他語言閱讀：**</small>

<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [German](./GETTING_STARTED.de.md) · [Spanish](./GETTING_STARTED.es.md) · [French](./GETTING_STARTED.fr.md) · [Hindi](./GETTING_STARTED.hi.md) · [Japanese](./GETTING_STARTED.ja.md) · [Korean](./GETTING_STARTED.ko.md) · [Portuguese (BR)](./GETTING_STARTED.pt-BR.md) · [Chinese (CN)](./GETTING_STARTED.zh-CN.md) · [Chinese (TW)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [安裝](#installation)
- [快速開始](#quick-start)
- [工作流程 1 - UI 翻譯](#workflow-1---ui-translation)
  - [步驟 1：初始化](#step-1-initialise)
  - [步驟 2：提取字串](#step-2-extract-strings)
  - [步驟 3：翻譯 UI 字串](#step-3-translate-ui-strings)
  - [匯出為 XLIFF 2.0（可選）](#exporting-to-xliff-20-optional)
  - [步驟 4：在執行階段連結 i18next](#step-4-wire-i18next-at-runtime)
  - [在原始碼中使用 `t()`](#using-t-in-source-code)
  - [插值](#interpolation)
  - [語言切換 UI](#language-switcher-ui)
  - [RTL 語言](#rtl-languages)
- [工作流程 2 - 文件翻譯](#workflow-2---document-translation)
  - [步驟 1：初始化](#step-1-initialise-1)
  - [步驟 2：翻譯文件](#step-2-translate-documents)
    - [快取行為與 `translate-docs` 標記](#cache-behaviour-and-translate-docs-flags)
  - [輸出佈局](#output-layouts)
- [合併工作流程（UI + 文件）](#combined-workflow-ui--docs)
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

## 安裝

發布的包是 **僅限 ESM**。在 Node.js 或您的打包工具中使用 `import`/`import()`；**請勿使用 `require('ai-i18n-tools')`。**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools 包含內建的字串提取器。如果您先前使用 `i18next-scanner`、`babel-plugin-i18next-extract` 或類似工具，可以在遷移後移除這些開發依賴。

設定您的 OpenRouter API 金鑰：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

或者在項目根目錄中創建一個 `.env` 文件：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## 快速開始

默認的 `init` 模板（`ui-markdown`）僅啟用 **UI** 提取和翻譯。`ui-docusaurus` 模板啟用 **文檔** 翻譯（`translate-docs`）。當您希望使用一個命令運行提取、UI 翻譯、可選的獨立 SVG 翻譯和根據您的配置進行文檔翻譯時，請使用 `sync`。

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

### 建議的 `package.json` 指令碼

在本地安裝套件後，您可直接在指令碼中使用 CLI 指令（不需要 `npx`）：

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

## 工作流程 1 - UI 翻譯

設計用於任何使用 i18next 的 JS/TS 項目：React 應用、Next.js（客戶端和服務器組件）、Node.js 服務、CLI 工具。

### 步驟 1：初始化

```bash
npx ai-i18n-tools init
```

這將使用 `ui-markdown` 模板寫入 `ai-i18n-tools.config.json`。編輯它以設置：

- `sourceLocale` - 您的原始語言 BCP-47 語言代碼（例如 `"en-GB"`）。**必須與** 從您的執行階段 i18n 設定檔（`src/i18n.ts` / `src/i18n.js`）匯出的 `SOURCE_LOCALE` 相符。
- `targetLocales` - 目標語言的 BCP-47 代碼陣列（例如 `["de", "fr", "pt-BR"]`）。執行 `generate-ui-languages` 從此清單建立 `ui-languages.json` 指引清單。
- `ui.sourceRoots` - 掃描 `t("…")` 呼叫的目錄（例如 `["src/"]`）。
- `ui.stringsJson` - 寫入主目錄的位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 寫入 `de.json`、`pt-BR.json` 等的位置（例如 `"src/locales/"`）。
- `ui.preferredModel`（選用）- 嘗試用於 `translate-ui` 的 **第一個** OpenRouter 模型 ID；若失敗，CLI 將依序繼續使用 `openrouter.translationModels`（或舊版 `defaultModel` / `fallbackModel`），並跳過重複項目。

### 步驟 2：擷取字串

```bash
npx ai-i18n-tools extract
```

掃描 `ui.sourceRoots` 下的所有 JS/TS 檔案，尋找 `t("literal")` 和 `i18n.t("literal")` 呼叫。將結果寫入（或合併至）`ui.stringsJson`。

掃描器可進行設定：可透過 `ui.reactExtractor.funcNames` 新增自訂函式名稱。

### 步驟 3：翻譯 UI 字串

```bash
npx ai-i18n-tools translate-ui
```

讀取 `strings.json`，針對每個目標語言批次傳送至 OpenRouter，並將扁平 JSON 檔案（`de.json`、`fr.json` 等）寫入 `ui.flatOutputDir`。當設定 `ui.preferredModel` 時，會優先嘗試該模型，然後才依序使用 `openrouter.translationModels` 中的清單（文件翻譯與其他指令仍僅使用 `openrouter`）。

對於每個條目，`translate-ui` 在可選的 `models` 對象中存儲成功翻譯每個語言的 **OpenRouter 模型 ID**（與 `translated` 相同的語言鍵）。在本地 `editor` 命令中編輯的字符串在該語言的 `models` 中標記為哨兵值 `user-edited`。位於 `ui.flatOutputDir` 下的每個語言的平面文件僅保留 **源字符串 → 翻譯**；它們不包括 `models`（因此運行時包保持不變）。

> **使用快取編輯器的注意事項：** 若在快取編輯器中編輯項目，您必須執行 `sync --force-update`（或等效的 `translate` 指令加上 `--force-update`），才能以更新後的快取項目覆寫輸出檔案。此外請注意，若日後來源文字發生變更，您的手動編輯將會遺失，因為系統會為新的來源字串產生新的快取金鑰（雜湊值）。

### 匯出為 XLIFF 2.0（可選）

若要將 UI 字串交給翻譯供應商、TMS 或 CAT 工具，可將目錄匯出為 **XLIFF 2.0** 格式（每個目標語系一個檔案）。此指令為 **唯讀**：不會修改 `strings.json` 或呼叫任何 API。

```bash
npx ai-i18n-tools export-ui-xliff
```

預設情況下，檔案會寫入 `ui.stringsJson` 旁邊，命名方式如 `strings.de.xliff`、`strings.pt-BR.xliff`（您的目錄檔名 + 語系 + `.xliff`）。使用 `-o` / `--output-dir` 可指定其他輸出位置。來自 `strings.json` 的現有翻譯會出現在 `<target>` 中；缺少的語系則使用 `state="initial"` 且不含 `<target>`，以便工具填入內容。使用 `--untranslated-only` 可僅匯出每個語系尚待翻譯的項目（適用於供應商批次作業）。`--dry-run` 則僅列印路徑而不寫入檔案。

### 步驟 4：在執行階段串接 i18next

使用 `'ai-i18n-tools/runtime'` 匯出的輔助工具建立您的 i18n 設定檔：

```js
// src/i18n.js  (or src/i18n.ts)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

在 React 渲染前匯入 `i18n.js`（例如在進入點檔案的最上方）。當使用者變更語言時，呼叫 `await loadLocale(code)`，接著呼叫 `i18n.changeLanguage(code)`。

`SOURCE_LOCALE` 已匯出，因此任何其他需要它的檔案（例如語言切換器）都可以直接從 `'./i18n'` 匯入。如果您正在遷移現有的 i18next 設定，請將分散在元件中的硬編碼原始語系字串（例如 `'en-GB'` 檢查）替換為從您的 i18n 啟動檔案匯入 `SOURCE_LOCALE`。

`defaultI18nInitOptions(sourceLocale)` 返回鍵作為默認設置的標準選項：

- `parseMissingKeyHandler` 會回傳金鑰本身，因此未翻譯的字串會顯示來源文字。
- `nsSeparator: false` 允許金鑰包含冒號。
- `interpolation.escapeValue: false` - 可安全停用：React 會自行跳脫值，且 Node.js/CLI 輸出沒有需要跳脫的 HTML。

`wrapI18nWithKeyTrim(i18n)` 將 `i18n.t` 包裝為： (1) 在查找之前修剪鍵，與提取腳本存儲它們的方式相匹配； (2) 當源語言返回原始鍵時，應用 <code>{"{{var}}"}</code> 插值 - 因此 <code>{"t('Hello {{name}}', { name })"}</code> 即使對於源語言也能正確工作。

`makeLoadLocale(i18n, loaders, sourceLocale)` 返回一個異步的 `loadLocale(lang)` 函數，該函數動態導入某個語言的 JSON 包並將其註冊到 i18next。

### 在原始碼中使用 `t()`

使用**字面字串**呼叫 `t()`，以便擷取指令碼能夠找到它：

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

- 只有這些形式會被提取：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")`。  
- 鍵必須是**字面字符串** - 鍵不能是變量或表達式。  
- 不要使用模板字面量作為鍵：<code>{'t(`Hello ${name}`)'}</code> 無法提取。

### 插值

使用 i18next 的原生第二個參數插值來處理 <code>{"{{var}}"}</code> 佔位符：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

提取腳本會忽略第二個參數 - 只有字面鍵字符串 <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code> 會被提取並發送進行翻譯。翻譯者被指示保留 <code>{"{{...}}"}</code> 令牌。

如果您的專案使用自訂插值工具（例如呼叫 `t('key')` 後再將結果傳遞給像 `interpolateTemplate(t('Hello {{name}}'), { name })` 這樣的模板函數），`wrapI18nWithKeyTrim` 使這變得不必要——即使原始語系返回原始鍵，它也會套用 <code>{"{{var}}"}</code> 插值。將呼叫點遷移至 `t('Hello {{name}}', { name })` 並移除自訂工具。

### 語言切換器 UI

使用 `ui-languages.json` 清單來構建語言選擇器。`ai-i18n-tools` 導出兩個顯示幫助器：

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

`getUILanguageLabel(lang, t)` - 當翻譯時顯示 `t(englishName)`，或者當兩者不同時顯示 `englishName / t(englishName)`。適合設置屏幕。

`getUILanguageLabelNative(lang)` - 顯示 `englishName / label`（每行不調用 `t()`）。適合標題菜單，您希望顯示本地名稱。

`ui-languages.json` 指引清單是一個包含 <code>{"{ code, label, englishName, direction }"}</code> 項目的 JSON 陣列（`direction` 為 `"ltr"` 或 `"rtl"`）。範例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

此指引清單由 `generate-ui-languages` 根據 `sourceLocale` + `targetLocales` 和捆綁的主目錄生成，並寫入 `ui.flatOutputDir`。

### RTL 語言

`ai-i18n-tools` 導出 `getTextDirection(lng)` 和 `applyDirection(lng)`：

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` 設置 `document.documentElement.dir`（瀏覽器）或在 Node.js 中為無操作。傳遞可選的 `element` 參數以針對特定元素。

對於可能包含 `→` 箭頭的字符串，將其翻轉以適應 RTL 佈局：

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## 工作流程 2 - 文檔翻譯

專為 markdown 文件、Docusaurus 網站和 JSON 標籤檔案設計。當啟用 `features.translateSVG` 且設定頂層 `svg` 區塊時，獨立的 SVG 資產會透過 [`translate-svg`](#cli-reference) 進行翻譯——而不是透過 `documentations[].contentPaths`。

### 步驟 1：初始化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

編輯生成的 `ai-i18n-tools.config.json`：

- `sourceLocale` - 原始語言（必須與 `defaultLocale` 在 `docusaurus.config.js` 中相符）。
- `targetLocales` - BCP-47 區域設定代碼陣列（例如 `["de", "fr", "es"]`）。
- `cacheDir` - 所有文件管線共用的 SQLite 快取目錄（也是 `--write-logs` 的預設日誌目錄）。
- `documentations` - 文件區塊陣列。每個區塊包含可選的 `description`、`contentPaths`、`outputDir`、可選的 `jsonSource`、`markdownOutput`、`targetLocales`、`addFrontmatter` 等。
- `documentations[].description` - 維護者的可選簡短註解（說明此區塊涵蓋內容）。設定時，會出現在 `translate-docs` 標題（`🌐 …: translating …`）和 `status` 區塊標頭中。
- `documentations[].contentPaths` - Markdown/MDX 原始目錄或檔案（另見 `documentations[].jsonSource` 用於 JSON 標籤）。
- `documentations[].outputDir` - 該區塊的翻譯輸出根目錄。
- `documentations[].markdownOutput.style` - `"nested"`（預設）、`"docusaurus"` 或 `"flat"`（參見 [輸出佈局](#output-layouts))。

### 步驟 2：翻譯文檔

```bash
npx ai-i18n-tools translate-docs
```

這會將每個 `documentations` 區塊的 `contentPaths` 中的所有文件翻譯成所有有效的文檔語言（當設置時，每個區塊的 `targetLocales` 的聯合，否則為根 `targetLocales`）。已翻譯的段落將從 SQLite 緩存中提供 - 只有新的或更改過的段落會發送到 LLM。

要翻譯單一語言：

```bash
npx ai-i18n-tools translate-docs --locale de
```

要檢查需要翻譯的內容：

```bash
npx ai-i18n-tools status
```

#### 緩存行為和 `translate-docs` 標誌

CLI 在 SQLite 中保持 **文件跟踪**（每個文件 × 語言的源哈希）和 **段落** 行（可翻譯塊的哈希 × 語言）。正常運行時，當跟踪的哈希與當前源 **匹配** 且輸出文件已存在時，會完全跳過該文件；否則，它會處理該文件並使用段落緩存，以便未更改的文本不會調用 API。

| 標誌                     | 效果                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(預設)*              | 當追蹤的內容與磁碟上的輸出相符時，跳過未變更的檔案；其餘情況使用片段快取。                                                                                                             |
| `-l, --locale <codes>`   | 以逗號分隔的目標語系（省略時依循 `documentation.targetLocales` / `targetLocales` 的預設值）。                                                                                           |
| `-p, --path` / `-f, --file` | 僅翻譯此路徑下的 Markdown/JSON（專案相對路徑或絕對路徑）；`--file` 是 `--path` 的別名。                                                                                     |
| `--dry-run`              | 不寫入檔案且不進行 API 呼叫。                                                                                                                                                                       |
| `--type <kind>`          | 僅限 `markdown` 或 `json`（否則若設定中啟用則兩者皆處理）。                                                                                                                              |
| `--json-only` / `--no-json` | 僅翻譯 JSON 標籤檔案，或跳過 JSON 僅翻譯 Markdown。                                                                                                                         |
| `-j, --concurrency <n>`  | 最大並行目標語系數量（預設值來自設定或 CLI 內建預設值）。                                                                                                                             |
| `-b, --batch-concurrency <n>` | 每個檔案最大並行批次 API 呼叫次數（文件數；預設值來自設定或 CLI）。                                                                                                                          |
| `--emphasis-placeholders` | 在翻譯前將 Markdown 強調標記遮蔽為佔位符（可選；預設關閉）。                                                                                                         |
| `--debug-failed`         | 當驗證失敗時，在 `cacheDir` 下寫入詳細的 `FAILED-TRANSLATION` 日誌。                                                                                                                       |
| `--force-update`         | 重新處理每一個符合的檔案（提取、重新組合、寫入輸出），即使檔案追蹤機制本應跳過。**仍會應用片段快取** - 未變更的片段不會傳送至 LLM。                   |
| `--force`                | 清除每個處理檔案的追蹤記錄，且**不會讀取**片段快取以進行 API 翻譯（完全重新翻譯）。新的結果仍會**寫入**片段快取。                 |
| `--stats`                | 列印片段數量、追蹤檔案數量以及每個語系的片段總數，然後結束。                                                                                                                   |
| `--clear-cache [locale]` | 刪除快取的翻譯內容（及檔案追蹤）：所有語系，或單一語系，然後結束。                                                                                                            |
| `--prompt-format <mode>` | 每個**批次**的片段如何傳送至模型並解析（`xml`、`json-array` 或 `json-object`）。預設為 **`json-array`**。此設定不影響提取、佔位符、驗證、快取或備援行為 — 請參閱 [批次提示格式](#batch-prompt-format)。 |

您不能將 `--force` 與 `--force-update` 結合使用（它們是互斥的）。

#### 批次提示格式

`translate-docs` 將可翻譯的段發送到 OpenRouter 中的 **批次**（按 `batchSize` / `maxBatchChars` 分組）。 **`--prompt-format`** 標誌僅改變該批次的 **傳輸格式**；段拆分、`PlaceholderHandler` 令牌、markdown AST 檢查、SQLite 緩存鍵和當批次解析失敗時的每段回退保持不變。

| 模式 | 使用者訊息 | 模型回覆 |
| ---- | ------------ | ----------- |
| **`xml`** | 準 XML 格式：每個片段一個 `<seg id="N">…</seg>`（含 XML 轉義）。 | 僅 `<t id="N">…</t>` 區塊，每個片段索引一個。 |
| **`json-array`** (預設) | 一個字串的 JSON 陣列，依序每個片段一個項目。 | 一個**相同長度**的 JSON 陣列（相同順序）。 |
| **`json-object`** | 一個以片段索引為鍵的 JSON 物件 `{"0":"…","1":"…",…}`。 | 一個具有**相同鍵**且值已翻譯的 JSON 物件。 |

執行標頭也會列印 `Batch prompt format: …`，以便您確認目前的模式。JSON 標籤檔案（`jsonSource`）和獨立的 SVG 批次作業在這些步驟作為 `translate-docs`（或 `sync` 的文件階段 — `sync` 不提供此旗標；預設為 **`json-array`**）的一部分執行時，會使用相同的設定。

**段落去重和 SQLite 中的路徑**

- 段落行按 `(source_hash, locale)` 全局鍵入（hash = 正規化內容）。兩個文件中的相同文本共享一行；`translations.filepath` 是元數據（最後寫入者），而不是每個文件的第二個緩存條目。
- `file_tracking.filepath` 使用命名空間鍵：每個 `documentations` 區塊的 `doc-block:{index}:{relPath}`（`relPath` 是相對於項目根目錄的 posix：收集的 markdown 路徑；**JSON 標籤文件使用相對於當前工作目錄的源文件路徑**，例如 `docs-site/i18n/en/code.json`，因此清理可以解析實際文件），以及 `svg-assets:{relPath}` 用於 `translate-svg` 下的獨立 SVG 資產。
- `translations.filepath` 存儲 markdown、JSON 和 SVG 段的相對於當前工作目錄的 posix 路徑（SVG 使用與其他資產相同的路徑形狀；`svg-assets:…` 前綴 **僅** 在 `file_tracking` 上）。
- 運行後，`last_hit_at` 只會清除在相同翻譯範圍內的段落行 **（遵循 `--path` 和啟用的類型）**，這些行未被命中，因此過濾或僅文檔的運行不會將不相關的文件標記為過期。

### 輸出佈局

`"nested"`（省略時的預設） — 在 `{outputDir}/{locale}/` 下鏡像源樹（例如 `docs/guide.md` → `i18n/de/docs/guide.md`）。

`"docusaurus"` — 將位於 `docsRoot` 下的文件放置在 `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`，匹配通常的 Docusaurus i18n 佈局。將 `documentations[].markdownOutput.docsRoot` 設置為您的文檔源根目錄（例如 `"docs"`）。

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - 將翻譯文件放置在源旁邊，並帶有語言後綴，或在子目錄中。頁面之間的相對鏈接會自動重寫。

```
docs/guide.md → i18n/guide.de.md
```

您可以完全覆蓋路徑，使用 `documentations[].markdownOutput.pathTemplate`。佔位符：<code>{"{outputDir}"}</code>，<code>{"{locale}"}</code>，<code>{"{LOCALE}"}</code>，<code>{"{relPath}"}</code>，<code>{"{stem}"}</code>，<code>{"{basename}"}</code>，<code>{"{extension}"}</code>，<code>{"{docsRoot}"}</code>，<code>{"{relativeToDocsRoot}"}</code>。

---

## 結合工作流程 (UI + 文檔)

在單一配置中啟用所有功能，以便同時運行兩個工作流程：

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

`glossary.uiGlossary` 將文檔翻譯指向與 UI 相同的 `strings.json` 目錄，以保持術語的一致性；`glossary.userGlossary` 為產品術語添加 CSV 覆蓋。

執行 `npx ai-i18n-tools sync` 來運行一個管線：**提取** UI 字串（若設定 `features.extractUIStrings`），**翻譯 UI** 字串（若設定 `features.translateUIStrings`），**翻譯獨立 SVG 資產**（若設定 `features.translateSVG` 且有 `svg` 區塊），然後 **翻譯文件**（每個 `documentations` 區塊：依設定處理 markdown/JSON）。可使用 `--no-ui`、`--no-svg` 或 `--no-docs` 跳過部分步驟。文件步驟接受 `--dry-run`、`-p` / `--path`、`--force` 和 `--force-update`（後兩個僅在執行文件翻譯時有效；若傳入 `--no-docs` 則會被忽略）。

在區塊上使用 `documentations[].targetLocales` 將該區塊的文件翻譯為比 UI 更**小的子集**（有效的文檔地區是區塊之間的**聯集**）：

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

---

## 配置參考

### `sourceLocale`

源語言的 BCP-47 代碼（例如 `"en-GB"`，`"en"`，`"pt-BR"`）。不會為此地區生成翻譯文件 - 鍵字符串本身就是源文本。

**必須匹配** 從您的運行時 i18n 設置文件（`src/i18n.ts` / `src/i18n.js`）導出的 `SOURCE_LOCALE`。

### `targetLocales`

要翻譯成的 BCP-47 語言代碼陣列（例如 `["de", "fr", "es", "pt-BR"]`）。

`targetLocales` 是 UI 翻譯的主要語系清單，也是文件區塊的預設語系清單。使用 `generate-ui-languages` 從 `sourceLocale` + `targetLocales` 建立 `ui-languages.json` 清單。

### `uiLanguagesPath`（可選）

指向用於顯示名稱、語系篩選和語言清單後處理的 `ui-languages.json` 清單的路徑。若省略，CLI 會在 `ui.flatOutputDir/ui-languages.json` 尋找該清單。

當您需要這樣做時：

- 清單位於 `ui.flatOutputDir` 之外，您需要明確地讓 CLI 指向它。
- 您希望 `markdownOutput.postProcessing.languageListBlock` 從清單建立語系標籤。
- `extract` 應該將清單中的 `englishName` 項目合併到 `strings.json` 中（需要 `ui.reactExtractor.includeUiLanguageEnglishNames: true`）。

### `concurrency`（可選）

同時翻譯的最大**目標地區**（`translate-ui`，`translate-docs`，`translate-svg`，以及 `sync` 內部的匹配步驟）。如果省略，CLI 對於 UI 翻譯使用**4**，對於文檔翻譯使用**3**（內建默認值）。每次運行時可使用 `-j` / `--concurrency` 覆蓋。

### `batchConcurrency`（可選）

**translate-docs** 與 **translate-svg**（以及 `sync` 的文件翻譯步驟）：每個檔案的最大平行 OpenRouter **批次**請求數（每個批次可包含多個段落）。省略時預設為 **4**。`translate-ui` 會忽略此設定。可使用 `-b` / `--batch-concurrency` 覆寫。在 `sync` 上，`-b` 僅適用於文件翻譯步驟。

### `batchSize` / `maxBatchChars`（可選）

文件翻譯的段落批次處理：每個 API 請求包含多少段落，以及字元上限。預設值：**20** 個段落，**4096** 個字元（省略時）。

### `openrouter`

| 字段               | 描述                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | OpenRouter API 基本 URL。默認：`https://openrouter.ai/api/v1`。                        |
| `translationModels` | 首選有序模型 ID 列表。第一個優先嘗試；後面的條目在出錯時作為後備。僅對 `translate-ui`**，您還可以設置 `ui.preferredModel` 在此列表之前嘗試一個模型（見 `ui`）。 |
| `defaultModel`      | 遺留的單一主要模型。僅在 `translationModels` 未設置或為空時使用。       |
| `fallbackModel`     | 遺留的單一後備模型。在 `translationModels` 未設置或為空時，在 `defaultModel` 之後使用。 |
| `maxTokens`         | 每個請求的最大完成標記。默認：`8192`。                                      |
| `temperature`       | 取樣溫度。默認：`0.2`。                                                    |

**為何使用多個模型：** 不同供應商和模型的成本各異，且在不同語言和地區上的品質表現也有所不同。將 **`openrouter.translationModels` 設定為有序的備援鏈**（而非單一模型），如此一來當某個請求失敗時，CLI 便能嘗試下一個模型。

請將以下清單視為可擴充的**基準**：若某特定地區的翻譯品質不佳或失敗，請研究哪些模型能有效支援該語言或文字（可參考線上資源或供應商的文件），並新增那些 OpenRouter ID 作為更多替代選項。

此清單於 **2026 年 4 月** 經過**廣泛地區覆蓋測試**（例如在 Transrewrt 專案中翻譯 **36** 個目標地區）；可作為實用的預設值，但無法保證在所有地區皆有良好表現。

範例 `translationModels`（與 `npx ai-i18n-tools init` 及套件範例相同）：

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v3.2",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-5.3-codex",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-3-flash-preview"
]
```

在您的環境或 `.env` 檔案中設定 `OPENROUTER_API_KEY`。

### `features`

| 欄位                | 工作流程 | 說明                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | 掃描原始碼中的 `t("…")` / `i18n.t("…")`，合併可選的 `package.json` 說明以及（若啟用）`ui-languages.json` `englishName` 值至 `strings.json`。 |
| `translateUIStrings` | 1        | 翻譯 `strings.json` 項目並寫入各語系的 JSON 檔案。 |
| `translateMarkdown`  | 2        | 翻譯 `.md` / `.mdx` 檔案。                                   |
| `translateJSON`      | 2        | 翻譯 Docusaurus JSON 標籤檔案。                            |
| `translateSVG`       | 2        | 翻譯獨立的 `.svg` 資產（需要頂層的 `svg` 區塊）。 |

當 `features.translateSVG` 為 true 且已設定頂層 `svg` 區塊時，使用 `translate-svg` 來翻譯 **獨立** 的 SVG 資產。`sync` 命令會在兩者皆設定時執行該步驟（除非使用 `--no-svg`）。

### `ui`

| 欄位                       | 說明                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | 被掃描 `t("…")` 呼叫的目錄（相對於目前工作目錄）。               |
| `stringsJson`               | 主目錄檔案的路徑。由 `extract` 更新。                  |
| `flatOutputDir`             | 寫入各語系 JSON 檔案的目錄（如 `de.json` 等）。    |
| `preferredModel`            | 選用。僅針對 `translate-ui` 優先嘗試的 OpenRouter 模型 ID；若失敗則依序嘗試 `openrouter.translationModels`（或舊版模型），且不重複此 ID。 |
| `reactExtractor.funcNames`  | 要掃描的額外函數名稱（預設：`["t", "i18n.t"]`）。         |
| `reactExtractor.extensions` | 包含的檔案副檔名（預設：`[".js", ".jsx", ".ts", ".tsx"]`）。 |
| `reactExtractor.includePackageDescription` | 當為 `true`（預設）時，若存在，`extract` 也會將 `package.json` `description` 視為 UI 字串包含在內。 |
| `reactExtractor.packageJsonPath` | 用於提取可選說明的 `package.json` 檔案的自訂路徑。 |
| `reactExtractor.includeUiLanguageEnglishNames` | 當為 `true`（預設 `false`）時，若來源掃描尚未包含，`extract` 也會將 `uiLanguagesPath` 清單中的每個 `englishName` 新增至 `strings.json`（相同雜湊鍵）。需要 `uiLanguagesPath` 指向有效的 `ui-languages.json`。 |

### `cacheDir`

| 欄位      | 說明                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite 快取目錄（由所有 `documentations` 區塊共用）。跨執行重複使用。若您正在從自訂的文件翻譯快取遷移，請封存或刪除它 — `cacheDir` 會建立自己的 SQLite 資料庫，且不相容於其他結構。 |

### `documentations`

文檔管道區塊的數組。`translate-docs` 和 `sync` 過程的文檔階段 **逐一** 處理每個區塊。

| 欄位                                        | 說明                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | 此區塊的可選人類可讀備註（不供翻譯使用）。設定時會出現在 `translate-docs` 的 `🌐` 標題前；也會顯示在 `status` 區段的標頭中。                                                     |
| `contentPaths`                               | 要翻譯的 Markdown/MDX 來源（`translate-docs` 會掃描這些路徑中的 `.md` / `.mdx` 檔案）。JSON 標籤來自此區塊上的 `jsonSource`。                                                                                  |
| `outputDir`                                  | 此區塊翻譯輸出的根目錄。                                                                                                                                                                      |
| `sourceFiles`                                | 可選的別名，載入時會合併至 `contentPaths`。                                                                                                                                                                        |
| `targetLocales`                              | 僅針對此區塊的可選語言子集（否則使用根層級的 `targetLocales`）。實際生效的文件語言是所有區塊的聯集。                                                                             |
| `jsonSource`                                 | 此區塊的 Docusaurus JSON 標籤檔案來源目錄（例如 `"i18n/en"`）。                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"`（預設）、`"docusaurus"` 或 `"flat"`。                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Docusaurus 版面配置的原始文件根目錄（例如 `"docs"`）。                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | 自訂 Markdown 輸出路徑。可用的佔位符： <code>{"{outputDir}"}</code>、<code>{"{locale}"}</code>、<code>{"{LOCALE}"}</code>、<code>{"{relPath}"}</code>、<code>{"{stem}"}</code>、<code>{"{basename}"}</code>、<code>{"{extension}"}</code>、<code>{"{docsRoot}"}</code>、<code>{"{relativeToDocsRoot}"}</code>。 |
| `markdownOutput.jsonPathTemplate`            | 自訂 JSON 輸出路徑用於標籤檔案。支援與 `pathTemplate` 相同的佔位符。                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | 對於 `flat` 風格，保留來源子目錄以避免同檔名檔案衝突。                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | 翻譯後重寫相對連結（`flat` 風格將自動啟用）。                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | 計算扁平化連結重寫前綴時使用的儲存庫根目錄。除非你的翻譯文件位於不同的專案根目錄下，否則通常保留為 `"."`。 |
| `markdownOutput.postProcessing` | 對翻譯後的 Markdown **body** 進行可選的轉換（YAML front matter 會保留）。在片段重新組合與扁平化連結重寫之後、`addFrontmatter` 之前執行。 |
| `markdownOutput.postProcessing.regexAdjustments` | 有序的 `{ "description"?, "search", "replace" }` 清單。`search` 是正規表示式模式（純字串使用 `g` 標誌，或 `/pattern/flags`）。`replace` 支援諸如 `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}` 等佔位符（概念與參考文檔中的 `additional-adjustments` 相同）。 |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — 翻譯器會尋找包含 `start` 的第一行與對應的 `end` 行，然後將該段落替換為標準的語言切換器。連結根據翻譯後檔案的相對路徑建立；標籤來自 `uiLanguagesPath` / `ui-languages.json`（若已設定），否則來自 `localeDisplayNames` 與 locale 代碼。 |
| `addFrontmatter`                  | 當為 `true` 時（省略時預設為 true），翻譯後的 Markdown 檔案會包含 YAML 欄位：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`，以及當至少一個片段具有模型中繼資料時，包含 `translation_models`（使用的 OpenRouter 模型 ID 排序清單）。設為 `false` 可跳過。 |

範例（平面 README 管道 — 截圖路徑 + 可選語言列表包裝）：

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
      "separator": " · "
    }
  }
}
```

### `svg`（可選）

獨立 SVG 資產的頂層路徑與佈局。僅當 **`features.translateSVG`** 為 true 時才會執行翻譯（透過 `translate-svg` 或 `sync` 的 SVG 階段）。

| 欄位                       | 描述 |
| --------------------------- | ----------- |
| `sourcePath`                | 一個目錄或一組目錄，遞歸掃描 `.svg` 文件。 |
| `outputDir`                 | 翻譯後 SVG 輸出的根目錄。 |
| `style`                     | 當 `pathTemplate` 未設置時，為 `"flat"` 或 `"nested"`。 |
| `pathTemplate`              | 自定義 SVG 輸出路徑。佔位符：<code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>。 |
| `svgExtractor.forceLowercase` | 在 SVG 重新組裝時轉換為小寫的翻譯文本。對於依賴全小寫標籤的設計非常有用。 |

### `glossary`

| 欄位          | 說明                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | 指向 `strings.json` 的路徑 - 自動從現有翻譯建立詞彙表。                                                                                                                 |
| `userGlossary` | 指向 CSV 檔案的路徑，其欄位為 `Original language string`（或 `en`）、`locale`、`Translation` - 每個原始術語與目標語系各佔一列（`locale` 可為 `*` 代表所有目標）。 |

舊的鍵 `uiGlossaryFromStringsJson` 仍然被接受並在加載配置時映射到 `uiGlossary`。

生成一個空的詞彙表 CSV：

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLI 參考

| 命令                                                                   | 說明                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`                                                                 | 印出 CLI 版本與建置時間戳記（與根程式上的 `-V` / `--version` 相同的資訊）。                                                                                                                                                                                                  |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | 寫入起始設定檔（包含 `concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 和 `documentations[].addFrontmatter`）。`--with-translate-ignore` 會建立一個起始的 `.translate-ignore`。                                                                            |
| `extract`                                                                 | 從 `t("…")` / `i18n.t("…")` 字面值更新 `strings.json`，可選擇加入 `package.json` 描述與可選的 manifest `englishName` 項目（參見 `ui.reactExtractor`）。需要 `features.extractUIStrings`。                                                                                                                                                                                                    |
| `generate-ui-languages [--master <path>] [--dry-run]`                     | 使用 `sourceLocale` + `targetLocales` 和內建的 `data/ui-languages-complete.json`（或 `--master`）將 `ui-languages.json` 寫入 `ui.flatOutputDir`（或設定時的 `uiLanguagesPath`）。若主檔案中缺少某些語系，會發出警告並產生 `TODO` 占位符。如果您現有的 manifest 中有自訂的 `label` 或 `englishName` 值，它們將被主目錄的預設值取代 — 生成後請審查並調整該檔案。 |
| `translate-docs …`                                                        | 為每個 `documentations` 區塊翻譯 markdown/MDX 和 JSON（`contentPaths`，可選 `jsonSource`）。`-j`：最大並行語系數；`-b`：每檔案最大並行批次 API 請求數。`--prompt-format`：批次傳輸格式（`xml` \| `json-array` \| `json-object`）。參見 [快取行為與 `translate-docs` 標誌](#cache-behaviour-and-translate-docs-flags) 和 [批次提示格式](#batch-prompt-format)。 |
| `translate-svg …`                                                         | 翻譯在 `config.svg` 中設定的獨立 SVG 資產（與文件分開）。需要 `features.translateSVG`。與文件共享相同的快取機制；支援 `--no-cache` 以跳過該次執行的 SQLite 讀寫。支援 `-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | 僅翻譯 UI 字串。`--force`：重新翻譯每個語系的所有項目（忽略現有翻譯）。`--dry-run`：不寫入，不呼叫 API。`-j`：最大並行語系數。需要 `features.translateUIStrings`。                                                                                 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | 匯出 `strings.json` 為 XLIFF 2.0 格式（每個目標語系產生一個 `.xliff`）。`-o` / `--output-dir`：輸出目錄（預設：與目錄檔相同資料夾）。`--untranslated-only`：僅包含該語系中缺少翻譯的單元。唯讀；不呼叫 API。                                                        |
| `sync …`                                                                  | 啟用時先提取，然後進行 UI 翻譯，若 `features.translateSVG` 和 `config.svg` 已設定則再執行 `translate-svg`，最後進行文件翻譯 — 除非使用 `--no-ui`、`--no-svg` 或 `--no-docs` 跳過。共用旗標：`-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（僅文件批次處理）、`--force` / `--force-update`（僅文件；文件執行時互斥）。文件階段也會轉發 `--emphasis-placeholders` 和 `--debug-failed`（與 `translate-docs` 意義相同）。`--prompt-format` 不是 `sync` 標誌；文件步驟使用內建預設值（`json-array`）。                         |
| `status [--max-columns <n>]`                                   | 當 `features.translateUIStrings` 啟用時，列印每個語系的 UI 覆蓋率（`Translated` / `Missing` / `Total`）。然後列印每檔案 × 語系的 markdown 翻譯狀態（無 `--locale` 過濾；語系來自設定）。大型語系清單會分割成最多 `n` 個語系欄位的重複表格（預設 **9**），以保持終端機中的行寬度較窄。                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | 先執行 `sync --force-update`（提取、UI、SVG、文件），然後移除過時的段落列（null `last_hit_at` / 空檔案路徑）；刪除解析後來源路徑在磁碟上不存在的 `file_tracking` 列；移除其 `filepath` 元資料指向遺失檔案的翻譯列。記錄三項計數（過時、孤立的 `file_tracking`、孤立的翻譯）。除非使用 `--no-backup`，否則會在快取目錄下建立帶時間戳記的 SQLite 備份。 |
| `editor [-p <port>] [--no-open]`                                          | 啟動本地網頁編輯器以編輯快取、`strings.json` 和詞彙表 CSV。`--no-open`：不要自動開啟預設瀏覽器。<br><br>**注意：** 如果您在快取編輯器中編輯了某個條目，必須執行 `sync --force-update` 以使用更新後的快取條目重寫輸出檔案。此外，如果稍後來源文字變更，手動編輯將會遺失，因為會產生新的快取金鑰。 |
| `glossary-generate [-o <path>]`                                           | 寫入空的 `glossary-user.csv` 模板。`-o`：覆寫輸出路徑（預設：來自設定的 `glossary.userGlossary`，或 `glossary-user.csv`）。                                                                                                                                                |

所有指令都接受 `-c <path>` 以指定非預設的設定檔，`-v` 用於詳細輸出，以及 `-w` / `--write-logs [path]` 將主控台輸出複製到記錄檔（預設路徑：位於根目錄 `cacheDir` 下）。根程式還支援 `-V` / `--version` 和 `-h` / `--help`；`ai-i18n-tools help [command]` 顯示與 `ai-i18n-tools <command> --help` 相同的每指令用法。

---

## 環境變數

| 變數                     | 描述                                                      |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **必填。** 您的 OpenRouter API 金鑰。                      |
| `OPENROUTER_BASE_URL`  | 覆蓋 API 基本 URL。                                      |
| `I18N_SOURCE_LOCALE`   | 在運行時覆蓋 `sourceLocale`。                            |
| `I18N_TARGET_LOCALES`  | 以逗號分隔的區域代碼，用於覆蓋 `targetLocales`。         |
| `I18N_LOG_LEVEL`       | 日誌級別（`debug`、`info`、`warn`、`error`、`silent`）。 |
| `NO_COLOR`             | 當 `1` 時，禁用日誌輸出的 ANSI 顏色。                   |
| `I18N_LOG_SESSION_MAX` | 每個日誌會話保留的最大行數（預設 `5000`）。              |
