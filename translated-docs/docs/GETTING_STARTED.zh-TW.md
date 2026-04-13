---
translation_last_updated: '2026-04-13T00:28:27.411Z'
source_file_mtime: '2026-04-13T00:09:06.223Z'
source_file_hash: 0d67865859266b61296bab41fec3c62bd682a4d4808658743d84ee4af5ff9865
translation_language: zh-TW
source_file_path: docs/GETTING_STARTED.md
---
# ai-i18n-tools: 入門指南

`ai-i18n-tools` 提供兩個獨立的可組合工作流程：

- **工作流程 1 - UI 翻譯**：從任何 JS/TS 源碼中提取 `t("…")` 調用，通過 OpenRouter 進行翻譯，並寫入每個地區的平面 JSON 文件，準備好用於 i18next。
- **工作流程 2 - 文檔翻譯**：將 markdown (MDX) 和 Docusaurus JSON 標籤文件翻譯成任意數量的地區，並具有智能緩存。**SVG** 資產使用單獨的命令 (`translate-svg`) 和可選的 `svg` 配置（請參見 [CLI 參考](#cli-reference)）。

這兩個工作流程都使用 OpenRouter（任何兼容的 LLM）並共享一個配置文件。

<small>**以其他語言閱讀：**</small>

<small id="lang-list">[en-GB](../../docs/GETTING_STARTED.md) · [de](./GETTING_STARTED.de.md) · [es](./GETTING_STARTED.es.md) · [fr](./GETTING_STARTED.fr.md) · [hi](./GETTING_STARTED.hi.md) · [ja](./GETTING_STARTED.ja.md) · [ko](./GETTING_STARTED.ko.md) · [pt-BR](./GETTING_STARTED.pt-BR.md) · [zh-CN](./GETTING_STARTED.zh-CN.md) · [zh-TW](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [安裝](#installation)
- [快速開始](#quick-start)
- [工作流程 1 - UI 翻譯](#workflow-1---ui-translation)
  - [步驟 1：初始化](#step-1-initialise)
  - [步驟 2：提取字符串](#step-2-extract-strings)
  - [步驟 3：翻譯 UI 字符串](#step-3-translate-ui-strings)
  - [步驟 4：在運行時連接 i18next](#step-4-wire-i18next-at-runtime)
  - [在源代碼中使用 `t()`](#using-t-in-source-code)
  - [插值](#interpolation)
  - [語言切換器 UI](#language-switcher-ui)
  - [RTL 語言](#rtl-languages)
- [工作流程 2 - 文檔翻譯](#workflow-2---document-translation)
  - [步驟 1：初始化](#step-1-initialise-1)
  - [步驟 2：翻譯文檔](#step-2-translate-documents)
    - [緩存行為和 `translate-docs` 標誌](#cache-behaviour-and-translate-docs-flags)
  - [輸出佈局](#output-layouts)
- [結合工作流程（UI + 文檔）](#combined-workflow-ui--docs)
- [配置參考](#configuration-reference)
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
- [環境變量](#environment-variables)

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

# Combined: extract UI strings, then translate UI + docs (per config features)
npx ai-i18n-tools sync

# Markdown translation status (per file × locale)
npx ai-i18n-tools status
```

---

## 工作流程 1 - UI 翻譯

設計用於任何使用 i18next 的 JS/TS 項目：React 應用、Next.js（客戶端和服務器組件）、Node.js 服務、CLI 工具。

### 步驟 1：初始化

```bash
npx ai-i18n-tools init
```

這將使用 `ui-markdown` 模板寫入 `ai-i18n-tools.config.json`。編輯它以設置：

- `sourceLocale` - 您的來源語言 BCP-47 代碼（例如 `"en-GB"`）。**必須符合**從執行階段 i18n 設定檔（`src/i18n.ts` / `src/i18n.js`）匯出的 `SOURCE_LOCALE`。
- `targetLocales` - 您的 `ui-languages.json` 資訊清單路徑，或 BCP-47 代碼陣列。
- `ui.sourceRoots` - 要掃描 `t("…")` 呼叫的目錄（例如 `["src/"]`）。
- `ui.stringsJson` - 寫入主目錄的位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 寫入 `de.json`、`pt-BR.json` 等檔案的位置（例如 `"src/locales/"`）。
- `ui.preferredModel`（選用）- 僅供 `translate-ui` **優先**嘗試的 OpenRouter 模型 ID；若失敗，CLI 會依序繼續使用 `openrouter.translationModels`（或舊版的 `defaultModel` / `fallbackModel`），並跳過重複項目。

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

`SOURCE_LOCALE` 已匯出，因此任何其他需要它的檔案（例如語言切換器）都可以直接從 `'./i18n'` 匯入。

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

`ui-languages.json` 清單是一個 JSON 陣列，包含 <code>{"{ code, label, englishName }"}</code> 條目。示例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

在配置中設置 `targetLocales` 為此文件的路徑，以便翻譯命令使用相同的列表。

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

設計用於 markdown 文檔、Docusaurus 網站和 JSON 標籤文件。SVG 圖表通過 [`translate-svg`](#cli-reference) 和配置中的 `svg` 進行翻譯，而不是通過 `documentations[].contentPaths`。

### 步驟 1：初始化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

編輯生成的 `ai-i18n-tools.config.json`：

- `sourceLocale` - 源語言（必須與 `docusaurus.config.js` 中的 `defaultLocale` 匹配）。  
- `targetLocales` - 地區代碼的數組或清單的路徑。  
- `cacheDir` - 所有文檔管道的共享 SQLite 緩存目錄（以及 `--write-logs` 的默認日誌目錄）。  
- `documentations` - 文檔區塊的數組。每個區塊都有可選的 `description`、`contentPaths`、`outputDir`、可選的 `jsonSource`、`markdownOutput`、`targetLocales`、`injectTranslationMetadata` 等。  
- `documentations[].description` - 可選的維護者簡短說明（此區塊涵蓋的內容）。設置後，它會出現在 `translate-docs` 標題中（`🌐 …: translating …`）和 `status` 部分標題中。  
- `documentations[].contentPaths` - markdown/MDX 源目錄或文件（另見 `documentations[].jsonSource` 用於 JSON 標籤）。  
- `documentations[].outputDir` - 該區塊的翻譯輸出根目錄。  
- `documentations[].markdownOutput.style` - `"nested"`（默認）、`"docusaurus"` 或 `"flat"`（見 [輸出佈局](#output-layouts)）。

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
| *(默認)*              | 在跟蹤 + 磁碟輸出匹配時跳過未更改的文件；對其餘部分使用段緩存。                                                                                                             |
| `--force-update`         | 重新處理每個匹配的文件（提取、重新組裝、寫入輸出），即使文件跟蹤會跳過。 **段緩存仍然適用** - 未更改的段不會發送到 LLM。                   |
| `--force`                | 清除每個處理文件的文件跟蹤，並且 **不讀取** API 翻譯的段緩存（完全重新翻譯）。新結果仍然 **寫入** 段緩存。                 |
| `--stats`                | 打印段計數、跟蹤的文件計數和每個語言的段總數，然後退出。                                                                                                                   |
| `--clear-cache [locale]` | 刪除緩存的翻譯（和文件跟蹤）：所有語言或單一語言，然後退出。                                                                                                            |
| `--prompt-format <mode>` | 每個 **批次** 的段如何發送到模型並解析（`xml`、`json-array` 或 `json-object`）。默認為 **`xml`**。不改變提取、佔位符、驗證、緩存或回退行為 — 請參見 [批次提示格式](#batch-prompt-format)。 |

您不能將 `--force` 與 `--force-update` 結合使用（它們是互斥的）。

#### 批次提示格式

`translate-docs` 將可翻譯的段發送到 OpenRouter 中的 **批次**（按 `batchSize` / `maxBatchChars` 分組）。 **`--prompt-format`** 標誌僅改變該批次的 **傳輸格式**；段拆分、`PlaceholderHandler` 令牌、markdown AST 檢查、SQLite 緩存鍵和當批次解析失敗時的每段回退保持不變。

| 模式 | 用戶消息 | 模型回覆 |
| ---- | ------------ | ----------- |
| **`xml`** (預設) | 偽 XML：每個段落一個 `<seg id="N">…</seg>`（帶有 XML 轉義）。 | 只有 `<t id="N">…</t>` 區塊，每個段落索引一個。 |
| **`json-array`** | 一個字符串的 JSON 陣列，按順序每個段落一個條目。 | 一個相同長度的 JSON 陣列 **（相同順序）**。 |
| **`json-object`** | 一個 JSON 對象 `{"0":"…","1":"…",…}`，以段落索引為鍵。 | 一個具有 **相同鍵** 和翻譯值的 JSON 對象。 |

運行標頭還會打印 `Batch prompt format: …`，以便您確認當前模式。JSON 標籤文件（`jsonSource`）和獨立的 SVG 批次在這些步驟作為 `translate-docs`（或 `sync` 的文檔階段 — `sync` 不會暴露此標誌；默認為 **`xml`**）運行時使用相同的設置。

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
  "targetLocales": "src/locales/ui-languages.json",
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
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

運行 `npx ai-i18n-tools sync` 以運行一個管道：**提取** UI 字符串（如果 `features.extractUIStrings`），**翻譯 UI** 字符串（如果 `features.translateUIStrings`），**翻譯獨立的 SVG 資產**（如果配置中存在 `svg` 區塊），然後 **翻譯文檔**（每個 `documentations` 區塊：按配置的 markdown/JSON）。跳過部分使用 `--no-ui`，`--no-svg`，或 `--no-docs`。文檔步驟接受 `--dry-run`，`-p` / `--path`，`--force`，和 `--force-update`（最後兩個僅在文檔翻譯運行時適用；如果您傳遞 `--no-docs`，則會被忽略）。

在區塊上使用 `documentations[].targetLocales` 將該區塊的文件翻譯為比 UI 更**小的子集**（有效的文檔地區是區塊之間的**聯集**）：

```json
{
  "targetLocales": "src/locales/ui-languages.json",
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

要翻譯的地區。接受：

- **字符串路徑** 到 `ui-languages.json` 清單（`"src/locales/ui-languages.json"`）。該文件被加載並提取地區代碼。
- **BCP-47 代碼的數組**（`["de", "fr", "es"]`）。
- **帶路徑的單元素數組**（`["src/locales/ui-languages.json"]`） - 與字符串形式的行為相同。

`targetLocales` 是 UI 翻譯的主要地區列表，也是文檔區塊的默認地區列表。如果您希望在這裡保留明確的數組，但仍希望基於清單的標籤和地區過濾，還需設置 `uiLanguagesPath`。

### `uiLanguagesPath`（可選）

指向用於顯示名稱、地區過濾和語言列表後處理的 `ui-languages.json` 清單的路徑。

當您需要這樣做時：

- `targetLocales` 是明確的數組，但您仍希望從清單中獲取英文/本地標籤。
- 您希望 `markdownOutput.postProcessing.languageListBlock` 從相同的清單中構建地區標籤。
- 只啟用 UI 翻譯，並希望清單提供有效的 UI 地區列表。

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

在您的環境或 `.env` 檔案中設定 `OPENROUTER_API_KEY`。

### `features`

| 欄位                | 工作流程 | 描述                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | 掃描原始碼中的 `t("…")` 並寫入/合併 `strings.json`。          |
| `translateUIStrings` | 1        | 翻譯 `strings.json` 條目並寫入每個語系的 JSON 檔案。 |
| `translateMarkdown`  | 2        | 翻譯 `.md` / `.mdx` 檔案。                                   |
| `translateJSON`      | 2        | 翻譯 Docusaurus JSON 標籤檔案。                            |

沒有 `features.translateSVG` 旗標。使用 `translate-svg` 和設定檔頂層的 `svg` 區塊來翻譯**獨立**的 SVG 資源。當設定檔中存在 `svg` 時，`sync` 指令會執行該步驟（除非使用 `--no-svg`）。

### `ui`

| 欄位                       | 說明                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | 搜尋 `t("…")` 呼叫的目錄（相對於目前工作目錄）。               |
| `stringsJson`               | 主要目錄檔案的路徑。由 `extract` 更新。                  |
| `flatOutputDir`             | 每個語系的 JSON 檔案輸出目錄（例如 `de.json` 等）。    |
| `preferredModel`            | 選填。僅針對 `translate-ui` 優先嘗試的 OpenRouter 模型 ID；若未成功，則依序嘗試 `openrouter.translationModels`（或舊版模型），且不重複此 ID。 |
| `reactExtractor.funcNames`  | 額外要掃描的函式名稱（預設值：`["t", "i18n.t"]`）。         |
| `reactExtractor.extensions` | 要包含的檔案副檔名（預設值：`[".js", ".jsx", ".ts", ".tsx"]`）。 |
| `reactExtractor.includePackageDescription` | 當值為 `true`（預設值）時，若存在 `package.json`，`extract` 也會將其 `description` 包含為 UI 字串。 |
| `reactExtractor.packageJsonPath` | 用於提取該選用描述的自訂 `package.json` 檔案路徑。 |

### `cacheDir`

| 欄位      | 描述                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite 快取目錄（由所有 `documentations` 區塊共用）。跨執行重複使用。 |

### `documentations`

文檔管道區塊的數組。`translate-docs` 和 `sync` 過程的文檔階段 **逐一** 處理每個區塊。

| 字段                                        | 描述                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | 此區塊的可選人類可讀註解（不用於翻譯）。當設置時，在 `translate-docs` `🌐` 標題中以前綴形式顯示；也顯示在 `status` 區段標題中。                                                     |
| `contentPaths`                               | 要翻譯的 Markdown/MDX 源（`translate-docs` 會掃描這些以查找 `.md` / `.mdx`）。JSON 標籤來自同一區塊的 `jsonSource`。                                                                                  |
| `outputDir`                                  | 此區塊翻譯輸出的根目錄。                                                                                                                                                                      |
| `sourceFiles`                                | 可選別名，在加載時合併到 `contentPaths` 中。                                                                                                                                                                        |
| `targetLocales`                              | 此區塊的可選語言子集（否則為根 `targetLocales`）。有效的文檔語言是各區塊的聯集。                                                                             |
| `jsonSource`                                 | 此區塊的 Docusaurus JSON 標籤文件的源目錄（例如 `"i18n/en"`）。                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"`（默認），`"docusaurus"` 或 `"flat"`。                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Docusaurus 佈局的源文檔根目錄（例如 `"docs"`）。                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | 自定義 Markdown 輸出路徑。佔位符：<code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>. |
| `markdownOutput.jsonPathTemplate`            | 標籤文件的自定義 JSON 輸出路徑。支持與 `pathTemplate` 相同的佔位符。                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | 對於 `flat` 樣式，保留源子目錄，以便具有相同基本名稱的文件不會衝突。                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | 翻譯後重寫相對鏈接（對於 `flat` 樣式自動啟用）。                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | 計算平面鏈接重寫前綴時使用的庫根目錄。通常將其保留為 `"."`，除非您的翻譯文檔位於不同的項目根目錄下。 |
| `markdownOutput.postProcessing` | 對翻譯後的 Markdown **主體** 的可選轉換（YAML 前置資料被保留）。在區段重新組裝和平面鏈接重寫後運行，並在 `injectTranslationMetadata` 之前運行。 |
| `markdownOutput.postProcessing.regexAdjustments` | 有序列表 `{ "description"?, "search", "replace" }`。`search` 是正則表達式模式（普通字符串使用標誌 `g`，或 `/pattern/flags`）。`replace` 支持佔位符，例如 `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}`（與參考 `additional-adjustments` 的想法相同）。 |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — 翻譯者找到包含 `start` 的第一行和匹配的 `end` 行，然後用標準語言切換器替換該片段。鏈接是相對於翻譯文件的路徑構建的；當配置時，標籤來自 `uiLanguagesPath` / `ui-languages.json`，否則來自 `localeDisplayNames` 和語言代碼。 |
| `injectTranslationMetadata`                  | 當 `true`（省略時的默認值）時，翻譯的 Markdown 文件包括 YAML 鍵：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`。設置為 `false` 以跳過。 |

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

獨立 SVG 資產的頂層配置，由 `translate-svg` 和 `sync` 的 SVG 階段翻譯。

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
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | 寫入一個初始設定檔（包含 `concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 以及 `documentations[].injectTranslationMetadata`）。`--with-translate-ignore` 會建立一個初始的 `.translate-ignore` 檔案。                                                                            |
| `extract`                                                                 | 掃描原始碼中的 `t("…")` 呼叫，並更新 `strings.json`。需要啟用 `features.extractUIStrings`。                                                                                                                                                                                                    |
| `translate-docs …`                                                        | 為每個 `documentations` 區塊（`contentPaths`，可選的 `jsonSource`）翻譯 Markdown/MDX 和 JSON 檔案。`-j`：最大並行語言數量；`-b`：每檔案最大並行批次 API 呼叫數。`--prompt-format`：批次傳輸格式（`xml` \| `json-array` \| `json-object`）。請參閱 [快取行為與 `translate-docs` 參數](#cache-behaviour-and-translate-docs-flags) 和 [批次提示格式](#batch-prompt-format)。 |
| `translate-svg …`                                                         | 翻譯設定在 `config.svg` 中的獨立 SVG 資產（與文件分開）。與文件具有相同的快取機制；支援 `--no-cache` 以跳過該次執行的 SQLite 讀寫操作。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | 僅翻譯 UI 字串。`--force`：針對每種語言重新翻譯所有項目（忽略現有翻譯）。`--dry-run`：不進行寫入也不發出 API 呼叫。`-j`：最大並行語言數量。需要啟用 `features.translateUIStrings`。                                                                                 |
| `sync …`                                                                  | 提取（若已啟用），然後進行 UI 翻譯，若存在 `config.svg` 則執行 `translate-svg`，最後進行文件翻譯——除非使用 `--no-ui`、`--no-svg` 或 `--no-docs` 跳過。共用參數：`-l`、`-p`、`--dry-run`、`-j`、`-b`（僅限文件批次處理）、`--force` / `--force-update`（僅限文件；當執行文件時互斥）。                         |
| `status`                                                                  | 顯示每檔案 × 語言的 Markdown 翻譯狀態（無 `--locale` 過濾；語言來自設定）。                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | 首先執行 `sync --force-update`（提取、UI、SVG、文件），然後移除過時的片段資料列（`last_hit_at` 為 null 或檔案路徑為空）；刪除其解析後的原始路徑在磁碟上不存在的 `file_tracking` 資料列；移除其 `filepath` 元資料指向不存在檔案的翻譯資料列。會記錄三項計數（過時、孤立的 `file_tracking`、孤立的翻譯）。除非指定 `--no-backup`，否則會在快取目錄下建立一個帶時間戳記的 SQLite 備份。 |
| `editor [-p <port>] [--no-open]`                                          | 啟動一個本地網頁編輯器，用於編輯快取、`strings.json` 和詞彙表 CSV 檔案。`--no-open`：不要自動開啟預設瀏覽器。<br><br>**注意：** 如果您在快取編輯器中編輯了某個項目，您必須執行 `sync --force-update` 才能將更新後的快取項目寫回輸出檔案。此外，如果原始文字日後變更，手動編輯將會遺失，因為會產生新的快取金鑰。 |
| `glossary-generate [-o <path>]`                                           | 寫入一個空的 `glossary-user.csv` 範本。`-o`：覆寫輸出路徑（預設：來自設定的 `glossary.userGlossary`，或 `glossary-user.csv`）。                                                                                                                                                |

所有命令都接受 `-c <path>` 來指定非預設的配置文件，`-v` 用於詳細輸出，以及 `-w` / `--write-logs [path]` 將控制台輸出記錄到日誌文件（預設路徑：在根目錄 `cacheDir` 下）。

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
