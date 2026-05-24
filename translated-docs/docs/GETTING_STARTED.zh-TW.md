<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools：快速入門

`ai-i18n-tools` 套件提供三種截然不同且模組化的工作流程：

- **工作流程 1 - UI 翻譯**：從任何 JS/TS 原始碼中提取 `t("…")` 呼叫，透過 OpenRouter 進行翻譯，並寫入扁平化的每種語言 JSON 檔案，可供 i18next 直接使用。
- **工作流程 2 - 文件翻譯**：透過 `translate-docs` 翻譯 `docs[].contentPaths` 中列出的 **markdown、MDX 和 `.astro` 頁面**，並具備智慧快取功能。當啟用 `features.translateDocs` 時，可選的 **Docusaurus 目錄 JSON**（`docs[].docusaurusCatalogDir`，來自 `docusaurus write-translations`）也會在同一指令中被翻譯——這指的是網站介面（導覽列、頁尾、主題字串），而非 `docs/` 中的內文。
- **工作流程 3 - JSON 檔案翻譯**：透過頂層的 `json[]`、`features.translateJson` 和 `translate-json` 翻譯任意巢狀 JSON 捆綁檔（例如 `src/i18n/en/translation.json`）——適用於將 UI 文字儲存在每種語言對應 JSON 檔案中，而非在原始碼中使用 `t()` 的網站。

**SVG** 資產使用 `features.translateSVG`、頂層 `svg` 區塊以及 `translate-svg`（參見 [CLI 參考](#cli-reference)）。

**該用哪種工作流程？**

- 透過 `t()` 在原始碼中處理使用者介面字串 → 工作流程 1（`extract` / `translate-ui`）。
- 本地化頁面或 Docusaurus 外殼 JSON → 工作流程 2（`translate-docs`）。
- 僅使用獨立的巢狀 JSON 地區設定檔 → 工作流程 3（`translate-json`）。

這三種工作流程皆使用 OpenRouter（任何相容的 LLM），並共用單一設定檔。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [安裝](#installation)
  - [使用 CLI](#using-the-cli)
- [快速開始](#quick-start)
  - [推薦的 `package.json` 指令碼](#recommended-packagejson-scripts)
- [工作流程 1 - UI 翻譯](#workflow-1---ui-translation)
  - [步驟 1：初始化](#step-1-initialise)
  - [步驟 2：提取字串](#step-2-extract-strings)
  - [Astro 網站（純 Astro，非 Starlight）](#astro-website-plain-astro-not-starlight)
  - [Astro 網站 UI 字串（SSG）](#astro-website-ui-strings-ssg)
  - [Astro 網站頁面（解析與取代）](#astro-website-pages-parse-and-replace)
  - [步驟 3：翻譯 UI 字串](#step-3-translate-ui-strings)
  - [匯出至 XLIFF 2.0（可選）](#exporting-to-xliff-20-optional)
  - [步驟 4：於執行階段整合 i18next](#step-4-wire-i18next-at-runtime)
    - [保持 `SOURCE_LOCALE` 同步](#keeping-source_locale-aligned)
    - [地區設定載入器](#locale-loaders)
    - [執行階段輔助工具參考](#runtime-helpers-reference)
  - [在原始碼中使用 `t()`](#using-t-in-source-code)
  - [插值](#interpolation)
  - [基數複數（`plurals: true`）](#cardinal-plurals-plurals-true)
    - [複數的儲存與輸出方式](#how-plurals-are-stored-and-emitted)
  - [語言切換 UI](#language-switcher-ui)
  - [RTL 語言](#rtl-languages)
- [工作流程 2 - 文件翻譯](#workflow-2---document-translation)
  - [步驟 1：為文件初始化](#step-1-initialise-for-documentation)
  - [步驟 2：翻譯文件](#step-2-translate-documents)
    - [複雜 Markdown 與品質檢查失敗](#complex-markdown-and-failed-quality-checks)
    - [快取行為與 `translate-docs` 標誌](#cache-behaviour-and-translate-docs-flags)
    - [批次提示格式](#batch-prompt-format)
    - [SQLite 中的區段去重與路徑](#segment-dedupe-and-paths-in-sqlite)
  - [輸出佈局](#output-layouts)
    - [`docsOutput.style = "flat"` 時的錨點連結](#anchor-links-when-docsoutputstyle--flat)
    - [翻譯文件中的圖片與點陣圖資產](#images-and-raster-assets-in-translated-docs)
    - [語言切換器（`languageListBlock`）](#language-switcher-languagelistblock)
    - [`pathTemplate` / `jsonPathTemplate` 暫存變數](#pathtemplate--jsonpathtemplate-placeholders)
  - [疑難排解](#troubleshooting)
- [工作流程 3 - JSON 檔案翻譯](#workflow-3---json-file-translation)
  - [步驟 1：為巢狀 JSON 初始化](#step-1-initialise-for-nested-json)
  - [步驟 2：設定 `json[]`](#step-2-configure-json)
  - [步驟 3：翻譯 JSON 匯出包](#step-3-translate-json-bundles)
  - [工作流程 3 與其他管線的比較](#workflow-3-vs-other-pipelines)
- [合併工作流程（UI + 文件）](#combined-workflow-ui--docs)
  - [混合文件工作流程（`docsOutput.style = "docusaurus"` + `"flat"`）](#mixed-documentation-workflow-docsoutputstyle--docusaurus--flat)
- [翻譯儀表板](#translation-dashboard)
  - [失敗（文件翻譯）](#failures-document-translation)
    - [何時使用](#when-to-use-it)
    - [為何原始碼編輯很重要](#why-source-edits-matter)
    - [如何使用此分頁](#how-to-use-the-tab)
  - [Markdown 問題（靜態檢查）](#markdown-issues-static-checks)
- [設定參考](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath`（可選）](#uilanguagespath-optional)
  - [`concurrency`（可選）](#concurrency-optional)
  - [`batchConcurrency`（可選）](#batchconcurrency-optional)
  - [`fileConcurrency`（可選）](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars`（可選）](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [Git 排除的最佳實踐：](#best-practice-for-git-exclusions)
  - [`docs`](#docs)
  - [`json`](#json)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLI 參考](#cli-reference)
  - [根目錄與全域選項](#root-and-global-options)
  - [各指令說明](#per-command-help)
  - [目標地區設定（`-l` / `--locale`）](#target-locales--l----locale)
- [環境變數](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## 安裝

發布的套件僅提供 **ESM** 格式。在 Node.js 或你的打包工具中請使用 `import`/`import()`，切勿使用 `require('ai-i18n-tools')`。此套件宣告了 `engines.node` `>=22.16.0`；不支援較舊版本的 Node.js。npm 的 tarball 僅包含 `docs/` 下的英文檔案；特定語系的副本位於 `translated-docs/`，可在 [GitHub 儲存庫](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) 中找到。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools 包含內建的字串提取器。如果你先前使用過 `i18next-scanner`、`babel-plugin-i18next-extract` 或類似工具，在遷移後即可移除這些開發依賴。

<a id="using-the-cli"></a>
### 使用 CLI

**每專案安裝 (建議)** — 將其安裝為依賴或開發依賴，然後透過 `npx`、`pnpm exec` 或 `package.json` 指令碼呼叫。`package.json` 指令碼已在 `PATH` 上使用 `node_modules/.bin` 執行，因此像 `pnpm run i18n:sync` 這樣的指令可以直接呼叫 CLI，無需輸入 `npx`。

**Bare** `ai-i18n-tools` **在終端機中：** 若要在互動式殼層中直接執行 CLI（在本機安裝後，從專案根目錄執行），請將本機的 bin 目錄前置至 `PATH`：

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

使用 [**direnv**](https://direnv.net/)，在專案根目錄中添加 `PATH_add node_modules/.bin` 到 `.envrc`，以便在 `cd` 進入倉庫後可以使用基本命令。無需調整 `PATH`，繼續使用 `npx ai-i18n-tools …` 或 `pnpm exec ai-i18n-tools …`。

**免安裝一次性執行** — 使用 `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（僅針對此次執行下載套件；不會寫入 `package.json`）。

在 Linux、macOS 和 WSL 上，註冊表安裝會自動為 CLI 指令碼設定可執行權限。在 Windows 上，套件管理工具會產生 `.cmd` 和 `.ps1` shim 來明確呼叫 Node。

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

預設的 `init` 範本（`ui-markdown`）僅啟用 **UI** 的提取與翻譯。`ui-docusaurus` 與 `ui-starlight` 範本則啟用 **文件**翻譯（`translate-docs`）。`ui-astro-website` 範本為純 Astro 應用程式（包含 `.astro` 檔案）建立 **UI** 提取架構；若你也希望對 `.astro` 頁面 HTML 進行 `translate-docs`，請加入 `docs[]` 區塊（參見 [Astro 網站頁面（解析與取代）](#astro-website-parse-and-replace)）。參考範例 [`examples/astro-website`](../../docs/../examples/astro-website/) 使用了 **兩種**管線。當你希望使用單一指令依設定執行提取、UI 翻譯、可選的 SVG 檔案翻譯以及文件翻譯時，請使用 `sync`。

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# Workflow 3 - nested JSON bundles (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 建議使用的 `package.json` 指令碼

在本地安裝此套件後，你可以在腳本中直接使用 CLI 指令（不需要 `npx`）。

**偏好** `sync` 用於任何曾經是「執行 `translate-ui`，然後 `translate-svg`，然後 `translate-docs`，然後 `translate-json`」的操作：`ai-i18n-tools sync` 依據你的配置運行 **提取**（當啟用時），**翻譯-ui**，可選的 **翻譯-svg**，**翻譯-docs**，然後可選的 **翻譯-json**—以正確的順序和共享的標誌。手動鏈接這些步驟容易出錯（順序、提取、地區標誌）。僅在需要單獨的 **單一** 步驟時使用 `i18n:translate:ui`、`i18n:translate:svg`、`i18n:translate:docs` 和 `i18n:translate:json`。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
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

- `sourceLocale` - 您的原始語言 BCP-47 代碼（例如 `"en-GB"`）。**必須與** 從執行階段 i18n 設定檔（`src/i18n.ts` / `src/i18n.js`）匯出的 `SOURCE_LOCALE` 相符。
- `targetLocales` - 目標語言的 BCP-47 代碼陣列（例如 `["de", "fr", "pt-BR"]`）。執行 `generate-ui-languages` 從此清單建立 `ui-languages.json` 檔案清單。
- `ui.sourceRoots` - 用於掃描 `t("…")` 呼叫的目錄或 glob 模式（例如 `["src/"]`、`["src/**/*.ts"]`）。
- `ui.stringsJson` - 寫入主目錄的位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 寫入 `de.json`、`pt-BR.json` 等的位置（例如 `"src/locales/"`）。
- `ui.preferredModel`（可選）- 僅針對 `translate-ui` 嘗試使用的 OpenRouter 模型 ID **優先**；若失敗，CLI 將依序繼續使用 `openrouter.translationModels`（或舊版 `defaultModel` / `fallbackModel`），跳過重複項目。

<a id="step-2-extract-strings"></a>
### 步驟 2：提取字串

```bash
npx ai-i18n-tools extract
```

掃描 `ui.sourceRoots` 下的所有 JS/TS 檔案中的 `t("literal")` 和 `i18n.t("literal")` 呼叫。寫入（或合併至）`ui.stringsJson`。

掃描器可進行設定：透過 `ui.uiExtractor.funcNames`（或舊版 `ui.reactExtractor.funcNames`）新增自訂函式名稱。針對 Astro 頁面與元件，請將 `.astro` 加入 `ui.uiExtractor.extensions`。

<a id="astro-website-plain-astro-not-starlight"></a>
### Astro 網站（純 Astro，非 Starlight）

針對靜態 Astro 行銷或應用網站，可結合 [Astro 內建的 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 與 ai-i18n-tools。參考實作為 [`examples/astro-website`](../../docs/../examples/astro-website/)（另請參見其 [README](../../docs/../examples/astro-website/README.md)）：英文版位於 `/`，九個目標語系位於 `/{locale}/`（`de`、`fr`、`es`、`ar`、`ja`、`ko`、`zh-cn`、`zh-tw`、`pt-br`）。

多數團隊會採用兩種管線的 **混合**方式（兩者不會衝突）：

| 管線 | 用途 | 指令 | 輸出 |
|----------|---------|----------|--------|
| **頁面 HTML** | 標題、段落、導覽標籤、模板主體中的內嵌陣列 | `translate-docs` | 每個語系對應一個 `src/pages/{locale}/index.astro` |
| **UI 字串 (`t()`)** | Frontmatter 資料、截圖分頁標籤、共用陣列 | `extract` → `translate-ui` | `public/locales/{locale}.json`（以英文原文為鍵值） |

新增或移除語言時，請保持三個清單同步：`targetLocales` 在 `ai-i18n-tools.config.json` 中、`i18n.locales` 在 `astro.config.mjs` 中（Astro 使用 **小寫** 路由代碼，例如 `pt-br`），以及 `ui-languages.json`（透過 `generate-ui-languages`）。平面化套件 **檔名** 使用設定中的大小寫格式（`pt-BR.json`）；透過您的 manifest 中的 `code` 欄位，將 Astro 的 `pt-br` 路由對應至該檔案（參見 `examples/astro-website/src/i18n/locale.ts`）。

範例 `package.json` 指令碼（來自參考專案）：

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="astro-website-ui-strings-ssg"></a>
### Astro 網站 UI 字串（SSG）

使用 `init -t ui-astro-website` 進行 UI 提取的腳手架，當你同時要翻譯頁面 HTML 時（見下文），再合併進 `docs[]` 區塊。在 TypeScript 模組中將文字內容包在 `t('…')` 裡，在 frontmatter 中使用 `.astro`，以及在你偏好使用 UI 字串而非重複語系頁面時，在模板中使用 `{expression}` 區塊：

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

設定 `sourceLocale` 以符合 `i18n.defaultLocale` 在 `astro.config.mjs` 中的設定。將平面化套件寫入 Astro 於建置時可匯入的目錄（範本使用 `public/locales/`）。於 **建置時** 解析 `t('…')`，方法是將英文原文作為鍵值查找（參見 `examples/astro-website/src/i18n/t.ts`；`strings.json` 是提取快取，而非執行階段套件）。除非您在載入後新增可切換語言的客戶端元件，否則靜態網站 **不需要** `ai-i18n-tools/runtime` 或 i18next。

連結每個呼叫 `t()` 的頁面（英文根頁面與各 `src/pages/{locale}/` 副本）：

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

範例中的支援輔助工具：`src/i18n/utils.ts`、`src/i18n/locale.ts` 與 `ui-languages.json`，分別用於標籤、文字方向與 BCP-47 代碼。變更 `targetLocales` 後執行 `generate-ui-languages`（可選擇設定 `ui.uiLanguagesPath`，使 manifest 與輔助工具位於同一目錄，例如 `src/i18n/ui-languages.json`）。`MainLayout.astro` 從 `resolveUiLanguage(Astro.currentLocale)` 設定 `<html lang>` 與 `<html dir>`；`LanguagePicker.astro` 使用 `getRelativeLocaleUrl` 從 `astro:i18n`。

<a id="astro-website-pages-parse-and-replace"></a>
### Astro 網站頁面（解析與替換）

針對在 `.astro` 檔案中硬編碼 HTML 的行銷頁面，讓 `translate-docs` 提取文字節點與屬性（`alt`、`title`、`aria-label`、`placeholder`），使用文件快取進行翻譯，並將特定語系的副本寫入您的頁面目錄。大多數可見文案 **不需要** `t()`。

結構性屬性和鍵值預設 **不會** 被翻譯：內建保護機制涵蓋 JSX/HTML 屬性，例如 `class`、`id`、`style`、`src`、`href`、`data-*` 和大多數的 `aria-*`，以及模板 `{expression}` 區塊內的物件鍵如 `class`、`key` 和 `id`。當你使用自訂屬性時（例如 Tailwind 的 `variant` 或 CMS 的 `slug` 欄位），請使用 `docs[].protectAttributes` 和 `docs[].protectKeys` 來擴充這些清單。這些選項同樣適用於 Markdown 翻譯期間的 MDX JSX（參見 [protectAttributes / protectKeys](#protectattributes-protectkeys)）。

啟用 `features.translateDocs` 並加入 `docs[]` 區塊，例如：

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

執行 `npx ai-i18n-tools translate-docs`（或在 [`examples/astro-website`](../../docs/../examples/astro-website/) 中使用 `pnpm i18n:translate`）。英文原始檔保留在 `src/pages/index.astro`；每個目標語系會取得 `src/pages/{locale}/index.astro`，其匯入路徑會根據多出的目錄層級調整（例如 `../layouts/` → `../../layouts/`）。

在 **模板主體**內，`{expression}` 區塊中的字串字面值（內聯陣列、物件的 `title`/`desc` 欄位）若為使用者介面內容則會被翻譯；受保護屬性/鍵上的引號值、`t('…')`、`<script>` 和 `<style>` 內的字面值則保持不變。**此路徑不會翻譯 Frontmatter 中的 TypeScript**——請保持英文頁面與語系頁面的共用 frontmatter（包含 `t()` 匯入與資料陣列）完全相同，或在編輯英文頁面後重新執行 `translate-docs`，以便語系副本能同步 frontmatter 的變更。若僅需翻譯 frontmatter 內容，請改用 [UI 字串管線](#astro-website-ui-strings)。

請參見 [`examples/astro-website`](../../docs/../examples/astro-website/) 以取得完整的混合式著陸頁範例（HTML 透過 `translate-docs`，截圖分頁標籤透過 `t()` + `translate-ui`）。

<a id="step-3-translate-ui-strings"></a>
### 步驟 3：翻譯 UI 字串

```bash
npx ai-i18n-tools translate-ui
```

讀取 `strings.json`，將批次傳送至 OpenRouter 以供每個目標語系使用，並將扁平 JSON 檔案（`de.json`、`fr.json` 等）寫入 `ui.flatOutputDir`。當設定 `ui.preferredModel` 時，會先嘗試使用該模型，再依 `openrouter.translationModels` 中的順序列表進行（文件翻譯及其他指令仍僅使用 `openrouter`）。

針對每個條目，`translate-ui` 會在一個選用的 `models` 物件中儲存成功翻譯各語系所使用的 **OpenRouter 模型 ID** (語系鍵與 `translated` 相同)。在本機 `dashboard` 指令中編輯的字串會在該語系的 `models` 中以特殊值 `user-edited` 標記。位於 `ui.flatOutputDir` 下的各語系平面檔案僅包含 **原始字串 → 翻譯結果**；不包含 `models` (因此執行階段的捆綁包保持不變)。

> **注意：** 如果您在翻譯儀表板中編輯了條目，您需要執行 `sync --force-update` (或使用 `--force-update` 的等效 `translate` 指令) 以使用更新後的快取條目重寫輸出檔案。此外，請注意，如果原始文字日後變更，您手動的編輯將會遺失，因為新的原始字串會產生新的快取鍵 (雜湊值)。

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

<details>
<summary>完整的 i18n 初始化範例 (src/i18n.js)</summary>

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

</details>

<a id="keeping-source_locale-aligned"></a>
#### 保持 `SOURCE_LOCALE` 同步

**保持三個值一致：`ai-i18n-tools.config.json` 中的 `sourceLocale`、此檔案中的 `SOURCE_LOCALE`，以及平面 JSON 輸出目錄下 `translate-ui` 寫入的複數平面 `{sourceLocale}.json`（通常是 `public/locales/`）。在靜態 `import` 中使用相同的檔案名稱（如上例：`en-GB` → `en-GB.json`）。`sourcePluralFlatBundle` 中的 `lng` 欄位必須等於 `SOURCE_LOCALE`。靜態 ES `import` 路徑不能使用變數；若您變更來源語系，請同時更新 `SOURCE_LOCALE` 和匯入路徑。或者，使用動態 `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`、`fetch` 或 `readFileSync` 來載入該檔案，使路徑由 `SOURCE_LOCALE` 建構。**

該程式碼片段使用 `./locales/…` 和 `./public/locales/…`，假設 `i18n` 與這些資料夾位於同一層。如果您的檔案位於 `src/` 下（典型情況），請使用 `../locales/…` 和 `../public/locales/…`，使匯入路徑與 `ui.stringsJson`、`uiLanguagesPath` 和 `ui.flatOutputDir` 一致。

在 React 渲染前匯入 `i18n.js`（例如在您的進入點頂部）。當使用者變更語言時，呼叫 `await loadLocale(code)` 然後呼叫 `i18n.changeLanguage(code)`。

`SOURCE_LOCALE` 已匯出，因此任何需要它的其他檔案（例如語言切換器）都可以直接從 `'./i18n'` 匯入。如果您正在遷移現有的 i18next 設定，請將分散在元件中的硬編碼原始語言字串（例如 `'en-GB'` 檢查）替換為從您的 i18n 啟動檔案中匯入 `SOURCE_LOCALE`。

如果您不希望使用預設匯出，命名匯出（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`）也能正常運作。

<a id="locale-loaders"></a>
#### 語系載入器

透過使用 `makeLocaleLoadersFromManifest` 從 `ui-languages.json` 衍生語系，使 `localeLoaders` 與設定 **保持同步** (此方法會使用與 `makeLoadLocale` 相同的標準化方式過濾掉 `SOURCE_LOCALE`)。當您在 `targetLocales` 中新增語系並執行 `generate-ui-languages` 時，清單會自動更新，您的載入器也會自動追蹤變更 — 無需維護單獨的硬編碼對應表。

對於 `public/` 下的 JSON 捆綁包 (典型的 Next.js 設定)，請從您的公開 URL 路徑取得：

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

對於沒有捆綁器的 Node CLI，請在一個小型輔助程式中使用 `readFileSync`，該程式會為每種代碼讀取並解析 JSON 檔案。

<a id="runtime-helpers-reference"></a>
#### 執行時期輔助函式參考

`aiI18n.defaultI18nInitOptions(sourceLocale)` 回傳鍵值為預設值設定的標準選項：

- `parseMissingKeyHandler` 回傳鍵本身，因此未翻譯的字串會顯示原始文字。
- `nsSeparator: false` 允許鍵包含冒號。
- `interpolation.escapeValue: false` — 可安全停用：React 本身會轉義值，而 Node.js/CLI 輸出不包含需要轉義的 HTML。

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` 是 ai-i18n-tools 專案的 **建議** 接線方式：它會套用 key-trim + 來源語系 <code>"{{var}}"</code> 插值備援（行為與較低階的 `wrapI18nWithKeyTrim` 相同），選擇性地透過 `addResourceBundle` 合併 `translate-ui` `{sourceLocale}.json` 複數後綴的鍵，然後從您的 `strings.json` 安裝支援複數的 `wrapT`。僅在啟動期間省略 `sourcePluralFlatBundle`（一旦 `translate-ui` 產生 `{sourceLocale}.json` 後即合併）。`wrapI18nWithKeyTrim` 單獨使用已 **棄用**，應用程式碼請改用 `setupKeyAsDefaultT`。

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

使用 i18next 原生的第二個參數進行 <code>"{{var}}"</code> 插值：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

extract 命令會解析 **第二個參數**，當其為純物件字面量時，會讀取僅供工具使用的標記，例如 `plurals: true` 和 `zeroDigit`（參見下方 **基數複數**）。對於一般字串，僅使用字面鍵進行雜湊；插值選項仍會在執行時傳遞給 i18next。

如果您的專案使用自訂插值工具（例如呼叫 `t('key')` 後再將結果傳遞給像 `interpolateTemplate(t('Hello {{name}}'), { name })` 這樣的模板函式），則 `setupKeyAsDefaultT`（透過 `wrapI18nWithKeyTrim`）可使此操作不再必要 — 即使原始語系回傳原始鍵，它仍會套用 <code>"{{var}}"</code> 插值。請將呼叫點遷移至 `t('Hello {{name}}', { name })` 並移除自訂工具。

<a id="cardinal-plurals-plurals-true"></a>
### 基數複數（`plurals: true`）

使用您希望作為開發者預設文案的 **相同字面值**，並傳入 `plurals: true`，使 extract + `translate-ui` 將此呼叫視為一個 **基數複數群組**（符合 i18next JSON v4 風格的 `_zero` … `_other` 格式）。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit`（可選）— 僅供工具使用；**不會**被 i18next 讀取。當設為 `true` 時，提示會偏好在每個支援該形式的語區的 `_zero` 字串中使用字面的阿拉伯語 `0`；當設為 `false` 或省略時，則使用自然的零值表述。在呼叫 `i18next.t` 前應移除這些鍵（見下方 `wrapT`）。

**驗證：** 如果訊息包含 **兩個或更多** 不同的 `{{…}}` 標記，其中 **必須有一個是** `{{count}}`（複數軸）。否則 `extract` 將 **失敗**，並顯示明確的檔案/行號訊息。

**兩個獨立計數**（例如章節和頁數）不能共用同一條複數訊息 — 請使用 **兩個** `t()` 呼叫（每個都帶有 `plurals: true` 及其各自的 `count`），並在 UI 中串接。

**v1 版本不包含：** 序數複數（`_ordinal_*`、`ordinal: true`）、區間複數、僅限 ICU 的管線。

<a id="how-plurals-are-stored-and-emitted"></a>
#### 複數形式的儲存與輸出方式

**在** `strings.json` 複數群組中使用 **每個哈希一行**，並包含 `"plural": true`、原始字面值 `source` 和 `translated[locale]` 作為對應基數類別的物件映射 (`zero`、`one`、`two`、`few`、`many`、`other`) 到該地區的字串。

**平面化語系 JSON：** 非複數的列保持為 **原始句子 → 翻譯**。複數的列會針對每個後綴輸出為 `<groupId>_original`（等同於 `source`，僅供參考）和 `<groupId>_<form>`，以便 i18next 能原生解析複數形式。`translate-ui` 還會寫入一個僅包含 **複數平面鍵** 的 `{sourceLocale}.json`（請載入此資源包以支援原始語言的後綴鍵解析；一般字串仍以鍵本身作為預設值）。針對每個目標語系，輸出的後綴鍵會對應該語系的 `Intl.PluralRules`（`requiredCldrPluralForms`）：若 `strings.json` 因壓縮後與其他類別相同而省略某個類別（例如阿拉伯語的 `many` 與 `other` 相同），`translate-ui` 仍會透過從備用的同類字串複製，將所有必要的後綴寫入平面檔案中，確保執行階段查找不會遺漏任何鍵。

執行階段（`ai-i18n-tools/runtime`）：**呼叫** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — 它會執行 `wrapI18nWithKeyTrim`，註冊可選的 `translate-ui` `{sourceLocale}.json` 複數捆綁，然後使用 `buildPluralIndexFromStringsJson(stringsJson)` 執行 `wrapT`。`wrapT` 會移除 `plurals` / `zeroDigit`，在需要時將鍵重寫為群組 ID，並轉發 `count`（可選：若只有一個非 `{{count}}` 的佔位符，則 `count` 會從該數值選項複製）。

**較舊的環境：** `Intl.PluralRules` 對工具和行為一致性是必需的；若您需支援非常舊的瀏覽器，請使用 polyfill。

<a id="language-switcher-ui"></a>
### 語言切換介面

使用 `ui-languages.json` 指引檔來建置語言選擇器。`ai-i18n-tools` 匯出兩個顯示輔助函式：

<details>
<summary>範例 LanguageSelect 組件 (React)</summary>

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

</details>

<br />

`getUILanguageLabel(lang, t)` - 翻譯時顯示 `t(englishName)`，或兩者不同時顯示 `englishName / t(englishName)`。適合用於設定畫面。

`getUILanguageLabelNative(lang)` — 僅顯示 `englishName / label`（每列不需 `t()` 呼叫）。適用於希望顯示本地名稱的頁首選單。

`ui-languages.json` 檔案清單是一個包含 <code>"{ code, label, englishName, direction }"</code> 項目的 JSON 陣列（`direction` 為 `"ltr"` 或 `"rtl"`）。範例：

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

主要設計用於 **Markdown、MDX 和 `.astro` 文件**，適用於 `docs[].contentPaths` 環境。在 Docusaurus 網站上，將 `docs[].docusaurusCatalogDir` 設定為 `write-translations` 目錄資料夾（例如 `docs-site/i18n/en`），以便 `translate-docs` 也能翻譯 shell 的 JSON（導覽列、頁尾、主題字串）。對於嵌入 Markdown 的 PNG 和其他點陣圖像，請參見 [翻譯文件中的影像與點陣資源](#images-and-raster-assets-in-translated-docs)。若要在 README 或文件中加入可選的 **語言切換器** 區塊並搭配 `docsOutput.style = "flat"`，請參見 [語言切換器（`languageListBlock`）](#language-switcher-languagelistblock)。SVG 檔案會在啟用 `features.translateSVG` 時透過 [`translate-svg`](#cli-reference) 進行翻譯，而非透過 `docs[].contentPaths`。任意巢狀的 UI JSON 匯出包（非 Docusaurus 目錄）應歸類至 [工作流程 3](#workflow-3---json-file-translation)（`json[]` / `translate-json`），而非 `docs[]`。

<a id="step-1-initialise-for-documentation"></a>
### 步驟 1：為文件初始化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

針對 Astro Starlight 文件網站：

```bash
npx ai-i18n-tools init -t ui-starlight
```

針對純 Astro 網站 UI（無 Starlight）：

```bash
npx ai-i18n-tools init -t ui-astro-website
```

該範本僅啟用 UI 提取功能。若要翻譯頁面 HTML，還需設定 `features.translateDocs` 並加入 `docs[]` 區塊（參見 [Astro 網站頁面 (解析與替換)](#astro-website-parse-and-replace)）。[`examples/astro-website`](../../docs/../examples/astro-website/) 設定範例展示了兩種管線的整合使用。

編輯生成的 `ai-i18n-tools.config.json`：

- `sourceLocale` - 原始語言（必須與 `docusaurus.config.js` 中的 `defaultLocale` 一致）。
- `targetLocales` - BCP-47 語言代碼陣列（例如 `["de", "fr", "es"]`）。
- `cacheDir` - 所有管線共用的 SQLite 快取目錄（也是 `--write-logs` 的預設日誌目錄）。
- `docs` - 文件區塊陣列。每個區塊包含可選的 `description`、`contentPaths`（字串或陣列；檔案、目錄或 glob）、`outputDir`、可選的 `docusaurusCatalogDir`、`docsOutput`、可選的 `segmentSplitting`、`translateFrontmatterFields`、`protectAttributes`、`protectKeys`、`targetLocales`、`addFrontmatter` 等。
- `docs[].description` - 可選的簡短註解，供維護者參考。設定後會出現在 `translate-docs` 標題及 `status` 區塊標頭中。
- `docs[].contentPaths` - markdown/MDX/`.astro` 原始檔（以及可選的 `docusaurusCatalogDir` 用於 Docusaurus 外殼 JSON）。
- `docs[].outputDir` - 該區塊的翻譯輸出根目錄。
- `docs[].docsOutput.style` - `"nested"`（預設）、`"flat"`、`"doc-system"` 或別名 `"docusaurus"` / `"astro-starlight"`（參見 [輸出佈局](#output-layouts)）。

**主要與輔助之分：** 對於本地化頁面，請專注於 `contentPaths`。當你同時需要來自 `write-translations` 的 Docusaurus shell JSON 時，設定 `docusaurusCatalogDir`。若僅翻譯頁面，則省略 `docusaurusCatalogDir`。

<a id="step-2-translate-documents"></a>
### 步驟 2：翻譯文件

```bash
npx ai-i18n-tools translate-docs
```

這會將每個 `docs[]` 區塊中的 `contentPaths` 所有檔案（以及當設定 `docusaurusCatalogDir` 時的 Docusaurus 目錄 JSON）翻譯至所有有效的文件語言。已翻譯的段落會從 SQLite 快取提供服務——僅有新增或變更的段落才會傳送至 LLM。

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

**如果你遇到此類驗證失敗，建議簡化原始語言文字** — 將段落拆分、將範例移至 fenced code block，或以較少的粗體/程式碼嵌套對來描述相同概念 — 而不要期待每個模型和語系都能完美重現密集的內嵌標記。本頁其他地方（特別是步驟 4 關於 `SOURCE_LOCALE`、載入器和 `public/` 路徑的註解）的格式是刻意模擬真實情境；當你在自己的文件中重用類似文字時，廣泛翻譯時請保持更簡潔。

要查看 **哪些片段失敗**、失敗次數以及儲存的 **品質／錯誤訊息**，請使用翻譯儀表板的 **失敗** 標籤頁（[翻譯儀表板 → 失敗](#failures-document-translation)）。

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### 快取行為與 `translate-docs` 標記

CLI 會在 SQLite 中保存 **檔案追蹤**（每檔案每語系的原始內容雜湊）與 **段落** 資料（每可翻譯段落每語系的雜湊）。一般執行時，若追蹤的雜湊與目前原始內容相符 **且** 輸出檔案已存在，就會完全跳過該檔案；否則會處理該檔案，並使用段落快取，使未變更的文字不會呼叫 API。

| 標誌                          | 效果                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(預設)*                   | 當追蹤內容與磁碟上的輸出相符時，跳過未變更的檔案；其餘內容使用片段快取。                                                                                                                                                                          |
| `-l, --locale <codes>`        | 以逗號分隔的目標語系（若省略，預設值為根 `targetLocales` 與各 `docs[]` 區塊中可選的 `targetLocales` 的聯集）。                                                                                                       |
| `-p, --path` / `-f, --file`   | 僅翻譯此路徑下的 markdown/JSON（專案相對路徑、絕對路徑或 glob 模式）；`--file` 是 `--path` 的別名。                                                                                                                                 |
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

| 模式                   | 使用者訊息                                                           | 模型回應                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | 類似 XML：每個片段一個 `<seg id="N">…</seg>`（含 XML 轉義）。 | 僅 `<t id="N">…</t>` 區塊，每個片段索引一個。       |
| `json-array`（預設） | 一個字串的 JSON 陣列，依序每個片段一個項目。               | 一個 **相同長度** 的 JSON 陣列（相同順序）。           |
| `json-object`          | 一個以區段索引為鍵的 JSON 物件 `{"0":"…","1":"…",…}`。            | 具有 **相同鍵**且值已翻譯的 JSON 物件。 |

執行標頭也會列印 `Batch prompt format: …`，讓你可以確認目前的模式。當 JSON 標籤檔案（`docusaurusCatalogDir`）和 SVG 檔案批次作為 `translate-docs`（或 `sync` 的文件階段 — `sync` 不提供此旗標，預設為 `json-array`）的一部分執行時，會使用相同的設定。

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### 區段去重與 SQLite 中的路徑

> **注意：** 本節涵蓋內部快取鍵的詳細資訊，有助於除錯 `cleanup` 行為或自訂工具。多數使用者可跳過此節。

- 段行由 `(source_hash, locale)` 全域鍵入（雜湊 = 標準化內容）。兩個檔案中相同的文字共享一行；`translations.filepath` 是元資料（最後寫入者），並非每個檔案的第二個快取條目。
- `file_tracking.filepath` 使用命名空間鍵：每個 `docs` 區塊的 `doc-block:{index}:{relPath}`（`relPath` 是相對於專案根目錄的 posix 路徑：收集的 markdown 路徑；**JSON 標籤檔案使用相對於 cwd 的來源檔案路徑**，例如 `docs-site/i18n/en/code.json`，以便清理能解析真實檔案），`json-block:{index}:{relPath}` 用於 `translate-json` 下的 `json[]` 來源，以及 `svg-files:{relPath}` 用於 `translate-svg` 下的 SVG 檔案。
- `translations.filepath` 儲存 markdown、JSON 和 SVG 片段的相對於 cwd 的 posix 路徑（SVG 使用與其他資產相同的路徑形式；`svg-files:…` 前綴僅在 `file_tracking` 上**only**）。
- 在執行後，`last_hit_at` 僅針對**在同一翻譯範圍內**（尊重 `--path` 和啟用種類）未被命中的段行被清除，因此篩選後或僅文件執行不會將不相關的檔案標記為過時。

<a id="output-layouts"></a>
### 輸出佈局

`docsOutput.style` 控制翻譯後的 markdown 檔案寫入位置。在 `docs[].docsOutput.style` 中使用以下確切字串值（別名為預設版型，而非獨立引擎）。

`docsOutput.style = "nested"`（省略時的預設值）— 在 `{outputDir}/{locale}/` 下鏡像原始樹狀結構（例如 `docs/guide.md` → `i18n/de/docs/guide.md`）。

`docsOutput.style = "doc-system"` — 用於靜態文件網站的語系前綴文件樹。`docsRoot` 下的檔案會寫入 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`。超出 `docsRoot` 的路徑會回退到嵌套版型。將 `docs[].docsOutput.docsRoot` 設定為您的英文來源根目錄（例如 `"docs"` 或 `"src/content/docs"`）。當 `docsOutput.style = "doc-system"` 時，您必須明確設定 `localeSubpath`（使用下方別名以套用預設值）。

**別名** (相同佈局引擎，預設 `localeSubpath`)：

- `docsOutput.style = "docusaurus"` — `localeSubpath` 預設為 `docusaurus-plugin-content-docs/current`（Docusaurus i18n 外掛程式版型）。
- `docsOutput.style = "astro-starlight"` — `localeSubpath` 預設為 `""`（翻譯頁面直接放在 `{outputDir}/{locale}/` 下，當英文內容位於內容根目錄且 `outputDir` 等於 `docsRoot` 時，符合 [Starlight](https://starlight.astro.build/guides/i18n/) 的設定）。

Docusaurus 預設設定 (主要文件頁面)：

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight 預設設定 (相同區塊結構，不同路徑)：

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

可選的 JSON 標籤 — 來自 `docusaurusCatalogDir` 的 Docusaurus 外殼字串（非 MDX 內文）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight 提供多種語系的 UI 字串；需要時可使用獨立的 `docs[]` 區塊，透過 `src/content/i18n/en.json` 與 `jsonPathTemplate: "{outputDir}/{locale}.json"` 進行可選的自訂 UI 覆寫。

`docsOutput.style = "flat"` — 將翻譯後的檔案放在來源旁並加上語系後綴，或放在子目錄中。當 `docsOutput.style = "flat"` 時，頁面之間的相對連結會自動重寫（除非設定了 `rewriteRelativeLinks: false` 或自訂的 `pathTemplate`）。

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-docsoutputstyle--flat"></a>
#### 當 `docsOutput.style = "flat"` 時的錨點連結

當 `docsOutput.style = "flat"` 時，輸出會為每種語系重寫頁面之間的 **相對路徑**（`guide.md` → `guide.de.md`）。**錨點連結** — 使用路徑後接 `#` 的標準 markdown 內嵌格式 — 可跳轉至目標檔案中的特定章節：

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

此處連結目標為 `setup.md`，而 `#first-run` 是錨點：它應捲動至該檔案中的正確標題位置。

**為何需要特別注意錨點連結**

- `rewriteRelativeLinks` 會修正每種語系的 **檔案名稱**（`setup.md` → `setup.de.md`）。
- 許多渲染器會根據 **可見的標題文字** 生成 `#` slug。翻譯後，各語系的標題會有所不同，因此自動生成的 slug 可能改變，而重寫後的連結仍可能顯示為 `#first-run` —— 或您原本英文的 `#…` 錨點不再符合渲染器從翻譯後標題建立的 slug。
- 結果：讀者會抵達正確的 **檔案**，但捲動至錯誤的 **行數**，或瀏覽器找不到相符的標題。

**應對方式**

1. 在 `translate-docs` 之前對您的來源 `.md` / `.mdx` 執行 `ai-i18n-tools write-heading-ids`（與平常相同的 `docs[]` / `contentPaths`）。它會在每個標題前一行插入明確的 HTML 錨點，使每個翻譯版本共用相同的 `id` 值。重新命名標題後請重新執行，以更新過時的錨點 ID 並與目前標題相符。
2. 將您的 markdown **錨點連結**指向這些穩定的 ID，例如 `[label](../../docs/other.md#section-id)`，其中 `section-id` 必須符合工具寫入的錨點 — 而非僅根據英文單字猜測。

**範例**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

`docs/security.md` 在 `write-heading-ids` 之後（簡化版）：

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

執行 `translate-docs` 後，每種語系檔案中的檔案路徑與 `#…` 錨點皆能保持一致，例如：

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration` 錨點在所有語系中都相同，因為 `id` 在原始碼中已固定；僅標題的 **文字** 和連結的 **標籤** 會被翻譯。

<a id="images-and-raster-assets-in-translated-docs"></a>
#### 翻譯文件中的圖片與點陣資源

`translate-docs` 會翻譯包含圖片替代文字的 Markdown 區段。但它不會將點陣圖檔（PNG、JPEG、WebP、GIF）複製到您的文件 `outputDir` 中。您必須將截圖檔案放在翻譯後 URL 所指向的位置，或使用 `postProcessing.regexAdjustments` 在翻譯後重寫路徑。

對於包含可翻譯文字的 SVG 檔案，請使用 `svg` 區塊與 `translate-svg` — 請參閱 [`svg`](#svg)。

完整決策指南、所有模式的設定範例與目錄結構、截圖腳本合約、設計建議以及常見錯誤，請參閱 [地區設定資源指南](LOCALE-ASSETS-GUIDE.zh-TW.md)。

**快速參考 — 五種模式**

| 模式                      | 用途                                               | 機制                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — 共用點陣圖            | 單一影像，無每語系變體                  | 每檔案連結重寫器；通常無需正規表示式          |
| B — 按地區設定的資料夾        | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/文件 | `regexAdjustments` 地區設定區段替換            |
| C — Docusaurus 共置     | `docsOutput.style = "docusaurus"` 網站 | 截圖指令碼放置檔案；無需正規表示式          |
| D — 已翻譯的 SVG           | 網頁應用嵌入 SVG 插圖                  | `translate-svg` 搭配 `svg.style = "flat"`         |
| E — 共置翻譯 SVG | `docsOutput.style = "docusaurus"` 文件          | `translate-svg` 搭配 `svg.style = "nested"` + `pathTemplate` |

**平面連結重寫器與兩步流程**

當 `docsOutput.style = "flat"` 時，內建重寫器會在 `postProcessing` 之前執行。它會計算每個輸出檔案的深度前綴 — 從輸出檔案目錄回到來源檔案目錄的相對路徑 — 並將其前置到非 markdown 資源的 URL。接著 `postProcessing` 會對已加上前綴的 URL 執行 — 請撰寫 `search` 模式以匹配其中的語系區段，而非開頭的 `../` 前綴。

使用 `flatPreserveRelativeDir: true` 時，子目錄中的原始檔會自動獲得特定檔案的前綴。例如，`docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md` 會產生 `../../docs/` 的前綴，因此 `translation-dashboard.png`（與原始檔同層）會變成 `../../docs/translation-dashboard.png`——無需任何 `postProcessing` 規則即可正確解析。

當 `docsOutput.style` 為 `"docusaurus"`、`"astro-starlight"`、`"nested"` 或任何不同於 `"flat"` 的值時，平面連結重寫器不會執行。`postProcessing` 會看到原始的 Markdown URL。

**範例模式 A** — 當 `docsOutput.style = "flat"` 時，與原始檔案同目錄的相對路徑資源不需要設定。模式 A 的 `postProcessing` 規則僅適用於絕對 URL 資源（例如 `/img/...`）或針對 CDN 的取代。

**範例模式 B — `docsOutput.style = "flat"` README**（`examples/nextjs-app`，第二個 `docs[]` 區塊）

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

請使用通用的 `[^/]+` 格式，而非寫死的原始地區設定，如此一來即使 `sourceLocale` 日後變更，規則仍可正常運作。

**範例模式 B — `docsOutput.style = "docusaurus"`**（`examples/nextjs-app`，第一個 `docs[]` 區塊）

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**模式 C — Docusaurus 共置模式**（無需 `regexAdjustments`）

將 en-GB 截圖放在 `static/assets/` 並建立符號連結 `docs/assets → ../static/assets`。`take-screenshots` 腳本會直接將其他地區設定的檔案寫入 `i18n/<locale>/…/current/assets/`。所有地區設定的文件都引用 `../assets/name.png` — 路徑穩定，無需 URL 重寫。

**模式 D 範例**（`examples/nextjs-app`，`svg.style = "flat"`）

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → 在 `public/assets/` 下產生依地區設定的檔案。應用程式依地區設定引用：`<img src={`/assets/icon.${locale}.svg`} />`。

**僅含最小 README 的範例** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` 僅透過[語言切換器後處理](#language-switcher-languagelistblock) 將 `README.md` 轉譯為 `translated-docs/`。未定義圖片規則 — 當 README 沒有同層的點陣圖檔，或僅使用主機已提供服務的絕對 URL 時，此設定是合適的。

取代範本支援諸如 `${translatedLocale}` 和 `${translatedBasedir}` 等佔位符（完整列表請見 [設定參考](#configuration-reference) 中的 `docsOutput.postProcessing.regexAdjustments` 欄位）。

<a id="language-switcher-languagelistblock"></a>
#### 語言切換器 (`languageListBlock`)

當翻譯後的 Markdown 檔案應包含一列 **「以其他語言閱讀」** 的連結時，使用 `docsOutput.postProcessing.languageListBlock` — 每個語系一個連結，且 `href` 的值會相對於各輸出檔案計算。

此儲存庫在 [README.md](../README.zh-TW.md) 和 [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md) 中使用此功能。在 `translate-docs` 執行後，每份翻譯副本都會獲得更新的區塊；例如 [translated-docs/docs/GETTING_STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) 會連結到 `translated-docs/docs/` 下的同級語系檔案，並回到 `../../docs/GETTING_STARTED.md` 的英文原始檔。

**1. 在原始 Markdown 中標記區塊**

使用 HTML（或其他任意行）將切換器包圍，並以 `start` 和 `end` 子字串作為標記。此儲存庫使用：

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

初始的連結文字僅為佔位符。`translate-docs` 會取代從第一個包含 `start` 的行開始，到後續第一個包含 `end` 的行為止的整個片段（封閉程式碼區塊內的標記會被忽略，因此同一檔案中的設定範例不會被匹配）。

**2. 設定區塊**

`start` 和 `end` 是任意的子字串標記 — 不一定要使用 `<small id="lang-list">` / `</small>`。選擇任何只出現在語言切換器片段中的開頭與結尾文字：例如另一個 HTML 標籤（`<div class="lang-switcher">` … `</div>`）、HTML 註解（`<!-- lang-list -->` … `<!-- /lang-list -->`），或純 Markdown 邊界（例如從一行 `**Languages:**` 到另一行 `---`）。在設定中將 `start` 和 `end` 設為與原始檔案中完全相同的內容。

根配置 ([ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json))：

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| 欄位       | 功能                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | 識別區塊起始行的子字串                                                  |
| `end`       | 結束行上的子字串（當起始與結束標記在同一行時，可與 `start` 相同）             |
| `separator` | 生成的 `[label](../../docs/href)` 連結之間的分隔文字（此儲存庫使用 `" · "`）                                    |
| `label`     | 選填：`"local"`（預設）使用清單中各語系的本地名稱；`"english"` 使用 `englishName` |

**3. 執行時發生什麼事**

1. **提取** — 語言列表片段 **不會**被傳送至模型（`translatable: false`）。
2. **每份翻譯檔案** — 在片段翻譯和選擇性扁平連結重寫後，`postProcessing` 會重建區塊：每個語系產生一個 Markdown 連結，標籤優先來自 `ui-languages.json`（若不存在則使用捆綁的主目錄，否則使用 `localeDisplayNames`），路徑相對於正在寫入的檔案。
3. **原始檔刷新** — 在一次 `translate-docs` / `sync` 文件處理結束時，相同的標準區塊會寫回 **英文原始檔案** 的 `contentPaths` 中，因此新增語系時無需手動編輯每個連結即可自動更新儲存庫中的切換器。

如果某檔案沒有對應的區塊，CLI 會記錄警告（當 `--verbose` 時）並保持內容不變。

**4. 標籤清單**

對於本地名稱標籤（`label: "local"`），請透過 `generate-ui-languages` 產生或維護 `ui-languages.json`（參見 [`uiLanguagesPath`](#uilanguagespath-optional)）。此儲存庫的文件專用設定不含 UI 流程，因此標籤來自 `sourceLocale` + `targetLocales` 的捆綁主目錄。

**5. 此儲存庫中的範例**

| 範例                            | 檔案                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 此套件（平面文件 + 子目錄） | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)（`docsOutput.style = "flat"`）、[README.md](../README.zh-TW.md)、[docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md)，輸出至 [translated-docs/](../../docs/../translated-docs/) |
| 最簡僅 README                | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json)（`docsOutput.style = "flat"`）、[examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| 平面 README + Docusaurus 文件      | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json)（第二個區塊：`docsOutput.style = "flat"`；第一個區塊：`docsOutput.style = "docusaurus"`）                                                     |

`<small id="lang-list">` 前面的那一行（例如 `**Read in other languages:**`）是正常的可翻譯段落，會在每個目標語系中進行本地化；只有標記內的連結列會逐字重新生成，除了 `href` 和 manifest 驅動的標籤。

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` 暫存變數

透過設定 `docs[].docsOutput.pathTemplate`（Markdown 和 MDX）或 `jsonPathTemplate`（JSON 標籤檔案）來覆寫翻譯檔案的寫入位置。兩者皆接受相同的佔位符。解析後的路徑必須保留在該區塊的 `outputDir` 內（CLI 會拒絕超出此範圍的路徑）。

如果您使用自訂的 `pathTemplate`，除非明確設定，否則 `rewriteRelativeLinks` 預設為 `false` — 相對連結重寫功能是為沒有自訂範本的 `docsOutput.style = "flat"` 所設計。

對於內建版型（`nested`、`flat`、`doc-system` 且無自訂範本），將 `docsOutput.localePathLowercase` 設為 `true` 可寫入小寫的語系資料夾或檔案名稱片段（例如 `pt-br` 而非 `pt-BR`）。`astro-starlight` 別名預設將此值設為 `true`。自訂的 `pathTemplate` / `jsonPathTemplate` 值則維持不變 — 若您需要小寫片段但同時保持 `{locale}` 為 BCP-47 格式，請在該處使用 `{llocale}`。

| 替代符            | 角色                                                                                                       | 範例                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | 此文件區塊之 `outputDir` 的絕對解析路徑                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | 目標語系代碼（格式與設定檔 / CLI 相同） | `de`, `pt-BR` |
| `{LOCALE}` | 相同語系的大寫形式 | `DE`, `PT-BR` |
| `{llocale}`            | 相同語系的小寫形式（符合 Astro 路由資料夾，例如 `pt-br`、`zh-cn`）                               | `de`、`pt-br`                                                    |
| `{relPath}` | 相對於專案根目錄的原始檔案路徑，採用 POSIX `/` 格式 | `docs/guide.md`, `README.md` |
| `{stem}` | 檔案名稱 **無**副檔名 | `guide` 用於 `docs/guide.md` |
| `{basename}` | 檔案名稱 **含**副檔名 | `guide.md` |
| `{extension}` | 副檔名 **包含**句點 | `.md`, `.mdx` |
| `{docsRoot}`           | `docsOutput.docsRoot` 的絕對解析路徑（若省略則預設為 `docs`）                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | 當路徑字串對齊時，移除具有匹配 `docsRoot` 前綴的 `{relPath}`（POSIX）；否則保持不變 | `docs/guide.md`（常見）；僅在執行剝離時為 `guide.md` |

**範例**

設定程式碼片段：

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

對於語系 `de` 和來源 `docs/guide.md`，專案根目錄為 `/home/acme/repo` 且 `outputDir` 解析為 `/home/acme/repo/i18n` 時，展開後的路徑為：

```text
/home/acme/repo/i18n/de/docs/guide.md
```

使用 `docsOutput.style = "flat"` 且無自訂 `pathTemplate` 時，常見模式是透過 `{stem}` 和 `{extension}` 僅保留檔案名稱，例如 `{outputDir}/{stem}.{locale}{extension}`，其結果為在解析後的 `outputDir` 下產生 `…/guide.de.md`。

<a id="troubleshooting"></a>
### 故障排除

**段落錨點連結在翻譯後的文件中無法運作**

像 `[label](../../docs/other.md#section-id)` 這樣的連結可能可以打開正確的翻譯文件，但無法捲動到目標標題，或跳轉到錯誤的章節。`#…` 片段已不再符合該語區中的任何標題 `id`。

常見原因：

- 原始標題從未設定明確的錨點 ID；網站會根據可見的標題文字生成 slug，而這些文字在翻譯後會改變。
- 您在原始檔中重新命名了標題，但前面的 `<a id="…"></a>` 行缺失或仍保留舊的 ID。
- 錨點連結使用根據英文單字猜測的 `#…` 片段，而非 `write-heading-ids` 所生成的 ID。

**修正方式**

1. 在您的 **原始** `.md` / `.mdx` 上執行 `ai-i18n-tools write-heading-ids`（與 `translate-docs` 使用相同的 `docs[]` / `contentPaths`）。它會在每個 ATX 標題前插入 `<a id="slug"></a>`，或在標題文字不再符合目前 slug 時刷新現有的錨點。
2. 將錨點連結指向這些 id — 例如 `[setup](../../docs/guide.md#first-run)`，其中 `#first-run` 需與目標標題上方的錨點行相符，而非僅根據英文標題推斷的 slug。
3. 重新執行 `translate-docs`（或 `sync --force-update`），使每個語系副本都包含更新後的錨點行。

請先在 `--dry-run` 上使用 `write-heading-ids` 來預覽變更。完整模式請見 [扁平佈局中的錨點連結](#anchor-links-when-docsoutputstyle--flat)。

---

<a id="workflow-3---json-file-translation"></a>
## 工作流程 3 - JSON 檔案翻譯

此流程適用於將 UI 文字儲存在 **依語系分層的 JSON 檔案**（例如 `src/i18n/en/translation.json`）而非 `t("…")` 原始碼中的專案。CLI 會遍歷這些檔案中的字串值，透過 OpenRouter 進行翻譯，並使用 `json[].outputPathTemplate` 輸出對應語系的結果。此流程與 `translate-docs` 和 `translate-svg`（`cacheDir`）共用相同的 SQLite 快取。

此工作流程 **不會** 執行 `extract` — 因為不存在 `strings.json` 目錄。需透過 `features.translateJson` 以及頂層 `json[]` 中的一或多個條目來啟用。

<a id="step-1-initialise-for-nested-json"></a>
### 步驟 1：初始化嵌套 JSON

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

該範本會設定 `features.translateJson: true`，停用 UI 提取與文件翻譯，並建立一個指向 `src/i18n/en/translation.json` 且輸出為 `src/i18n/{llocale}/translation.json` 的 `json[]` 區塊。請根據您的儲存庫結構編輯 `sourceLocale`、`targetLocales`、`contentPaths` 和 `outputPathTemplate`。

<a id="step-2-configure-json"></a>
### 步驟 2：設定 `json[]`

每個 `json[]` 區塊描述一個處理管線：

- `contentPaths` — 一個或多個 `.json` 檔案、目錄或萬用字元（例如 `"src/i18n/en/translation.json"` 或 `"src/i18n/en/overrides/*.json"`）。路徑會從專案根目錄解析。
- `outputPathTemplate` — 必填。指定每個目標語系檔案的寫入位置。可用佔位符：`{locale}`、`{LOCALE}`、`{llocale}`（小寫語系，適用於 Astro 路由資料夾）、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。
- `targetLocales`（選填）— 僅限此區塊的語系子集；否則使用根層級的 `targetLocales`。
- `keyPolicy` — 指定哪些 JSON 欄位包含可翻譯的文句，哪些為穩定的識別碼（見下文）。
- `description`（選填）— 顯示於 CLI 標頭與 `status` 輸出中。

範例（多個來源檔案，小寫語系資料夾）：

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | 行為 |
|-------------|-----------|
| `allowlist` | 僅翻譯符合 `translateKeys` 的欄位（點路徑；minimatch 万用模式） |
| `denylist`  | 翻譯所有字串值，但排除符合 `skipKeys` 的欄位 |
| `both`      | 先套用 `translateKeys`，再從 `skipKeys` 中移除符合的項目 |

路徑使用點號表示法（`nav.home.label`）。像 `slug` 這樣的純名稱會在任意深度匹配最後的鍵名。

<a id="step-3-translate-json-bundles"></a>
### 步驟 3：翻譯 JSON 匯出檔

```bash
npx ai-i18n-tools translate-json
```

可選旗標（概念與 `translate-docs` 相同）：`-l` / `--locale` 用於指定目標子集，`-p` / `--path` 限制檔案範圍，`--dry-run`、`--force`（清除相符檔案的檔案追蹤與片段快取），`--force-update`（當檔案雜湊相符時重新處理；片段快取仍適用），`-b` / `--batch-concurrency`，`--prompt-format`（`xml` \| `json-array` \| `json-object`）。

僅使用 JSON 的專案可執行：

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

當同時啟用 UI 或文件翻譯時，`sync` 會在 **translate-docs 之後執行 translate-json**（除非指定 `--no-json`）。可使用 `--no-json` 跳過 JSON 翻譯。

檢查每個檔案與語系的覆蓋率：

```bash
npx ai-i18n-tools status
```

當 `translateJson` 啟用時，`status` 會列印出 `json[]` 區段（✓ 為最新，● 為過時或遺失）。

<a id="workflow-3-vs-other-pipelines"></a>
### 工作流程 3 與其他管線的比較

| 情境 | 用途 |
|-----------|-----|
| `t("…")` 中的 UI 字串 / JS/TS/Astro 中的 `i18n.t("…")` | [工作流程 1](#workflow-1---ui-translation) — `extract` + `translate-ui` |
| Markdown/MDX/`.astro` 頁面或 README 翻譯 | [工作流程 2](#workflow-2---document-translation) — `translate-docs` |
| Docusaurus `write-translations` 目錄 (`{ "key": { "message": "…", "description": "…" } }`) | 工作流程 2 — `docs[].docusaurusCatalogDir` + `translate-docs`，**不包含** `json[]` |
| 獨立的巢狀語系 JSON（ZenBrowser 風格的 `translation.json` 樹狀結構） | 工作流程 3 — `json[]` + `translate-json` |
| 以 `.svg` 檔案搭配 `<text>` / `<title>` / `<desc>` 圖示說明 | `features.translateSVG` + [`svg`](#svg) + `translate-svg`（可選；非編號工作流程）|

欄位參考：[`json`](#json) 位於 [設定參考](#configuration-reference) 中。清除快取時使用的快取金鑰為 `json-block:{blockIndex}:{projectRelPath}` 於 `file_tracking` 中。

---

<a id="combined-workflow-ui--docs"></a>
## 結合工作流程（UI + 文件）

在單一設定中啟用所有功能，以同時執行兩個工作流程：

<details>
<summary>範例合併 UI 與文件的設定</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
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
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` 讓文件翻譯指向與 UI 相同的 `strings.json` 目錄，以保持術語一致性；`glossary.userGlossary` 添加 CSV 覆寫以處理產品術語。

執行 `npx ai-i18n-tools sync` 以運行單一管線：當 `features.translateUIStrings` 啟用時，先 **擷取** 再 **翻譯 UI** 字串；可選 **翻譯 SVG**（`features.translateSVG` + `svg` 區塊）；**翻譯文件**（依 `docs[]` 配置）；然後可選 **translate-json**（`features.translateJson` + `json[]`）。可使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳過部分步驟。文件與 `json[]` 步驟接受 `--dry-run`、`-p` / `--path`、`--force` 及 `--force-update`（當使用 `--no-docs` 時，僅限文件的旗標會被忽略；JSON 使用相同的快取旗標，除非 `--no-json` 已設定）。

在區塊上使用 `docs[].targetLocales` 可將該區塊的檔案翻譯成比 UI 更 **小的子集**（實際生效的文件語系為所有區塊的 **聯集**）：

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docsoutputstyle--docusaurus--flat"></a>
### 混合文件工作流程（`docsOutput.style = "docusaurus"` + `"flat"`）

您可以在同一組設定中透過在 `docs` 加入多個項目來結合多個文件管線。當專案包含 Docusaurus 網站（`docsOutput.style = "docusaurus"`）以及根層級的 Markdown 檔案（例如，具有 `docsOutput.style = "flat"` 的儲存庫 README）且需以語系後綴檔名進行翻譯時，此設定相當常見。

<details>
<summary>範例混合 Docusaurus 與平面 README 的設定</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
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

</details>

<br />

使用 `npx ai-i18n-tools sync` 時的執行方式：

- UI 字串從 `src/` 提取並翻譯至 `public/locales/`。
- 第一個文件區塊將 **markdown** 從 `docs-site/docs/` 翻譯至 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`（本地化文件頁面）。
- 當設定 `docs[].docusaurusCatalogDir` 且啟用 `features.translateDocs` 時，同一區塊也會將 **Docusaurus 外殼 JSON** 翻譯至 `docs-site/i18n/en/` 下的各目標語系資料夾中——包含導覽列、頁尾與主題/外掛目錄，但不包含 MDX 內文。
- 第二個文件區塊將 `README.md` 翻譯至 `translated-docs/` 下的語系後綴檔案中（`docsOutput.style = "flat"`）。
- 所有文件區塊共用 `cacheDir`，因此未變更的段落會在執行間重複使用，以減少 API 呼叫次數與成本。

---

<a id="translation-dashboard"></a>
## 翻譯儀表板

執行：

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

這會啟動一個以您設定的 `cacheDir` SQLite 資料庫為後端的本地 Web 介面——與 CLI 用於文件片段、日誌及相關中繼資料的資料夾相同。介面包含以下分頁：**文件**（已快取的文件片段）、**UI 字串**、**UI 複數形式**、**詞彙表**、**失敗**、**Markdown 問題** 以及 **統計資料**。

![Translation Dashboard](../../docs/translation-dashboard.png)

如果您在此應用程式中**編輯快取資料列**（例如文件段落），請執行`sync --force-update`或使用等效的翻譯指令並搭配`--force-update`，以確保磁碟上的輸出與快取一致；若稍後儲存庫中的**原始文字**變更，段落雜湊值也會改變，針對舊文字的手動編輯將被取代。

<a id="failures-document-translation"></a>
### 失敗項目（文件翻譯）

**失敗** 分頁僅適用於 **文件** 翻譯。它讀取寫入 SQLite 的失敗記錄，當某個語系的片段無法成功翻譯時（例如空的或無效的模型輸出、翻譯後驗證錯誤（`AST mismatch`、佔位符洩漏及其他類似的 **品質** 檢查）或導致程序中斷的 **嚴重** 錯誤）會產生此記錄。它能幫助您回答：*哪個原始片段出錯？針對哪個語系與模型？以及記錄了什麼錯誤訊息？*

<a id="when-to-use-it"></a>
#### 何時使用

- 當 `translate-docs` 或 `sync` 完成後出現錯誤、部分語系或混亂的日誌時——您可以排序和篩選失敗項目，而不僅僅是滾動終端機輸出。
- 當您想 **優先處理重做**時：按 **# 失敗次數** 排序，使多次重試均失敗的區段排在前面；這些區段很適合在原始 markdown 中 **簡化或重新格式化**，以利未來執行成功。
- 當您需要 **確切的區段** 資訊——檔案路徑、行數提示、來源雜湊值和完整來源文字——以便在您的儲存庫中編輯正確的段落。

<a id="why-source-edits-matter"></a>
#### 為何原始內容編輯很重要

密集的內嵌標記（**粗體**混用`` `code` ``、嵌套強調、包含多個片段的長句子）會讓模型更難返回能通過結構檢查的翻譯結果。通常具有**多次記錄失敗**的段落，透過**重寫或拆分**原始內容（或將範例移至 fenced code block）所獲得的改善，遠比在未變更的原文上反覆執行翻譯來得有效。這與[複雜 Markdown 與失敗的品質檢查](#complex-markdown-and-failed-quality-checks)的建議一致。

<a id="how-to-use-the-tab"></a>
#### 如何使用此分頁

1. 在儀表板中開啟 **失敗項目**（與 [翻譯儀表板](#translation-dashboard) 使用相同的瀏覽器工作階段）。
2. 閱讀 **摘要**列（包含任何失敗的段落，以及有 **1**、**2** 或 **3+** 個失敗記錄的段落數量）。
3. 按部分 **檔名**、**語區**、**模型**、**品質錯誤**（數值來自您的快取）、**僅限致命錯誤**，以及可選的 **來源雜湊**、**來源文字** 或 **錯誤訊息** 子字串進行篩選 —— 然後點選 **套用**。
4. 選擇 **排序：失敗次數**（預設）或 **排序：檔案路徑 + 行號**。
5. 在表格的頂部或底部使用分頁。**按一下資料列**可切換完整原始文字。當啟用時，資料列中的連結控制項會要求伺服器程序將檔案/行號提示記錄到 `ai-i18n-tools dashboard` 正在執行的 **終端機**中——這對於從瀏覽器跳轉到編輯器非常有用。
6. 修復專案中的 **原始檔案**，然後再次執行 `translate-docs` 或 `sync`。如果成功執行後清單看起來 **已過時**，請執行 `ai-i18n-tools sync --force-update` 並重新載入儀表板（失敗面板會顯示相同的提示）。

若您希望在使用 UI 的同時搭配檔案式除錯，仍可使用`translate-docs --debug-failed`在重試期間將`FAILED-TRANSLATION`詳細資訊寫入`cacheDir`——詳見[快取行為與`translate-docs`旗標](#cache-behaviour-and-translate-docs-flags)。

<a id="markdown-issues-static-checks"></a>
### Markdown 問題（靜態檢查）

**Markdown issues** 分頁會列出 `markdown_source_issues` SQLite 資料表中的資料列。每一列都是一項 **翻譯前** 的問題發現：例如在類似 CommonMark 的規則下（`translate-docs` 用於遮蔽處理），強調或刪除線的分隔符號未正確配對、以反引號開啟但未關閉的內聯程式碼區塊、`STRONG_OUTSIDE_INLINE_CODE` 當 `**` / `__` 包住 `` `...` `` 區塊時（應將強調格式放在反引號內，或使用純程式碼）、或 `STRONG_OUTSIDE_LINK` 當 `**` / `__` 包住 `[text](../../docs/url)` 連結時（僅將粗體格式放在連結文字內）。這 **並非** **Failures** 所記錄的內容，後者是針對每種語系的模型輸出與翻譯後驗證問題（`AST mismatch`、標記洩漏等類似問題）。

當您在花費 token 之前想要先修正 **原始 markdown** 時，請使用此分頁——特別是當品質檢查持續在結構上失敗時。可依檔案路徑（與快取金鑰的部分比對，包含 `doc-block:{index}:` 前綴）、**問題代碼** 或 **原始雜湊** 進行篩選；可依檔案路徑 + 行號或最新掃描時間排序。連結按鈕會將檔案/行號提示記錄到 `ai-i18n-tools dashboard` 正在執行的終端機中（概念與「文件」分頁相同）。

**重新整理資料列：** 執行 `ai-i18n-tools check-markdown`（可選 `-p` / `--path` 範圍，`--no-cache` 可跳過 SQLite，`--json` 可於 stdout 輸出機器可讀格式，人類可讀訊息則輸出至 stderr）。預設情況下，每次執行 `translate-docs` markdown 檔案時，若未將 `docs[].warnMarkdownSourceIssues` 設定為 `false`，也會重新掃描並替換該檔案的資料列。清除某快取檔案路徑的所有翻譯時，會同時沿用與失敗相同的清除路徑，移除該路徑的 Markdown 問題資料列。

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

- 標準清單位於 `ui.flatOutputDir` 之外，您需要明確地將 CLI 指向它。
- 您希望使用[語言切換器後處理](#language-switcher-languagelistblock)（`languageListBlock`）從標準清單建立語系標籤。
- `extract` 應該將標準清單中的 `englishName` 項目合併到 `strings.json` 中（需要 `ui.reactExtractor.includeUiLanguageEnglishNames: true`）。

<a id="concurrency-optional"></a>
### `concurrency`（選用）

同時翻譯的最大 **目標語系數量**（`translate-ui`、`translate-docs`、`translate-svg` 以及 `sync` 中對應的步驟）。若省略，CLI 在 UI 翻譯時使用 **4**，在文件翻譯時使用 **3**（內建預設值）。可透過 `-j` / `--concurrency` 在每次執行時覆寫。

<a id="batchconcurrency-optional"></a>
### `batchConcurrency`（選用）

**translate-docs** 與 **translate-svg**（以及 `sync` 的文件步驟）：每個檔案最多並行的 OpenRouter **批次** 請求數（每批次可包含多個片段）。若省略，預設為 **4**。`translate-ui` 會忽略此設定。可透過 `-b` / `--batch-concurrency` 覆寫。在 `sync` 上，`-b` 僅適用於文件翻譯步驟。

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (選擇性)

單一語系內同時處理的檔案最大數量 **（在單一語系內）**，於 `translate-docs` 和 `sync` 期間生效。設定為大於 **1** 的值時，將使用信號量（semaphore）以控制記憶體使用量，並行處理同一語系內的檔案。若省略此設定，預設值為 **1**（依序處理）。較高的數值可顯著提升 I/O 密集型作業的吞吐量，特別是在所有片段均已快取（無需呼叫 API）的情況下。

**範例：**

```json
{
  "fileConcurrency": 4
}
```

**使用情境：** 當執行 `sync --force-update` 且快取命中率為 100% 時，將此值設為 `2-4` 可減少總處理時間。此優化在處理大量小檔案時最為明顯。

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars`（選用）

文件翻譯的片段批次設定：每項 API 請求的片段數量與字元上限。預設值：**20** 個片段，**4096** 個字元（若省略）。

<a id="openrouter"></a>
### `openrouter`

- `baseUrl`
  OpenRouter API 基本 URL。預設值：`https://openrouter.ai/api/v1`。
- `translationModels`
  優先使用的模型 ID 有序清單。優先嘗試第一個；發生錯誤時依序使用後續項目作為備援。僅針對 `translate-ui`，您也可設定 `ui.preferredModel` 以在清單前嘗試單一模型（參見 `ui`）。
- `defaultModel`
  傳統的單一主要模型。僅當 `translationModels` 未設定或為空時使用。
- `fallbackModel`
  傳統的單一備援模型。當 `translationModels` 未設定或為空時，在 `defaultModel` 之後使用。
- `maxTokens`
  每次請求的最大完成 token 數。預設值：`8192`。
- `temperature`
  取樣溫度。預設值：`0.2`。
- `requestTimeoutMs`
  每次對 OpenRouter 發出 HTTP 請求（聊天完成與內部 `GET /models` 呼叫）的最大等待時間（毫秒）。預設值：`30000`（30 秒）。

**為何使用多個模型：** 不同供應商和模型在各語言與語系上的成本與品質表現各異。將 `openrouter.translationModels` 設定為 **有序的備援鏈**（而非單一模型），讓 CLI 在請求失敗時可嘗試下一個模型。

請將下方清單視為可擴充的 **基準**：若某語系的翻譯品質不佳或失敗，請研究哪些模型能有效支援該語言或文字（參考線上資源或供應商文件），並加入對應的 OpenRouter ID 作為額外選項。

此清單已在一個包含 36 個目標地區的大規模文件專案中 **測試過廣泛的地區覆蓋範圍**；它可作為實際的預設選項，但不保證在所有地區都能表現良好。

範例 `translationModels`（與 `npx ai-i18n-tools init` 相同的預設值）：

<details>
<summary>預設的 translationModels 回退清單</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

在您的環境或 `.env` 檔案中設定 `OPENROUTER_API_KEY`。

在變更 `translationModels` 之前，請先執行 `npx ai-i18n-tools check-models`，以根據 OpenRouter 的即時目錄（`GET /models`）驗證每個已設定的模型 ID。此指令會報告遺失或已過期（`expiration_date`）的 ID，列出有效模型及其預估的輸入/輸出價格（每百萬 tokens 的美元價格），並在任何已設定的 ID 無效時以非零狀態碼結束。需要 `OPENROUTER_API_KEY`。

<a id="features"></a>
### `features`

| 欄位                | 工作流程 | 說明                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | 將 `t("…")` / `i18n.t("…")` 提取至 `strings.json`，然後翻譯條目並寫入各語系的平面 JSON 檔案（提取會自動執行；使用獨立的 `extract` 僅重新整理目錄）。 |
| `translateDocs`      | 2        | 翻譯 `.md` / `.mdx` / `.astro` 頁面；當設定 `docs[].docusaurusCatalogDir` 時，產生 Docusaurus 外殼 JSON。                                                         |
| `translateJson`      | 3        | 位於 `json[]` 下的任意巢狀 JSON（`translate-json`）。                                                                                                           |
| `translateSVG`       | —        | 翻譯 `.svg` 檔案（需要頂層的 `svg` 區塊）。                                                                                                       |

**翻譯** SVG 檔案時，若 `features.translateSVG` 為 true 且已設定頂層 `svg` 區塊，則使用 `translate-svg`。當兩者皆設定時，`sync` 指令會執行該步驟（除非指定 `--no-svg`）。

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  用於掃描 `t("…")` 呼叫的目錄或 glob 模式（相對於目前工作目錄）。支援 `src/` 或 `["src/**/*.ts"]` 等模式。
- `stringsJson`  
  主目錄檔案的路徑。由 `extract` 更新。
- `flatOutputDir`  
  寫入各語系 JSON 檔案的目錄（例如 `de.json` 等）。
- `preferredModel`  
  選填。僅針對 `translate-ui` 優先嘗試的 OpenRouter 模型 ID；之後依序嘗試 `openrouter.translationModels`（或舊版模型），不再重複此 ID。
- `uiExtractor.funcNames`（或舊版 `reactExtractor.funcNames`）  
  要掃描的額外函式名稱（預設：`["t", "i18n.t"]`）。
- `uiExtractor.extensions`（或舊版 `reactExtractor.extensions`）  
  要包含的檔案副檔名（預設：`[".js", ".jsx", ".ts", ".tsx"]`）。請加入 `.astro` 以支援 Astro frontmatter 與模板運算式。
- `uiExtractor.includePackageDescription`（或舊版 `reactExtractor.includePackageDescription`）  
  當 `true`（預設）時，`extract` 也會將存在的 `package.json` `description` 視為 UI 字串。
- `uiExtractor.packageJsonPath`（或舊版 `reactExtractor.packageJsonPath`）  
  用於該選用描述提取功能的 `package.json` 檔案之自訂路徑。
- `uiExtractor.includeUiLanguageEnglishNames`（或舊版 `reactExtractor.includeUiLanguageEnglishNames`）

當 `true`（預設 `false`）時，若 manifest 中 `uiLanguagesPath` 的 `englishName` 尚未在原始碼掃描中存在（相同雜湊鍵），`extract` 也會將其加入 `strings.json`。需要 `uiLanguagesPath` 指向有效的 `ui-languages.json`。

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite 快取目錄（所有 `docs` 區塊共用）。跨執行重複使用。如果您正在從自訂的文件翻譯快取遷移，請封存或刪除它 —— `cacheDir` 會建立自己的 SQLite 資料庫，且不相容於其他結構。

<a id="best-practice-for-git-exclusions"></a>
#### Git 排除的最佳實踐：

- 排除翻譯快取資料夾的內容（例如使用 `.gitignore` 或 `.git/info/exclude`），以避免提交臨時快取副檔名。
- 保留 `cache.db`（不要例行刪除），因為保留 SQLite 快取可防止重新翻譯未變更的片段。在更新或修改使用 `ai-i18n-tools` 的軟體時，這可節省執行時間與 API 成本。
- 排除臨時檔與記錄檔，以避免提交備份和除錯相關的檔案。

<br/>

**範例：**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

文件處理流程區塊的陣列。`translate-docs` 和 `sync` 的文件階段 **依序處理**每個區塊。舊版鍵值（`documentations`、`markdownOutput`、`jsonSource`）在載入時仍被接受，且當設定檔可寫入時會被重寫；建議在新設定中使用 `docs`、`docsOutput` 和 `docusaurusCatalogDir`。

**內容來源**

- `description`
此區塊的可選人類可讀備註（不供翻譯使用）。設定時會作為 `translate-docs` `🌐` 標題的前綴；也會顯示在 `status` 區段標題中。
- `contentPaths`
要翻譯的 Markdown/MDX 頁面內容與 `.astro` 模板（`translate-docs` 會掃描這些內容中的 `.md`、`.mdx` 和 `.astro`）。支援 **目錄路徑或 glob 模式**（例如 `"docs/**/*.md"`、`"guides/*.mdx"`、`"src/pages/index.astro"`）。本地化文件內容即來自此處。
- `sourceFiles`
可選的別名，於載入時合併至 `contentPaths`。
- `targetLocales`
僅限此區塊的可選語系子集（否則使用根層級的 `targetLocales`）。實際生效的文件語系為所有區塊的聯集。
- `docusaurusCatalogDir`
可選。此區塊的 Docusaurus JSON 標籤目錄來源目錄（例如來自 `docusaurus write-translations` 的 `"i18n/en"`）。頁面內容始終來自 `contentPaths`；`docusaurusCatalogDir` 僅提供外殼/UI 的 JSON，不包含 MDX。

**輸出佈局**

- `outputDir`
此區塊的翻譯輸出根目錄。
- `docsOutput.style`
`"nested"`（預設）、`"flat"`、`"doc-system"`，或別名 `"docusaurus"` / `"astro-starlight"`。
- `docsOutput.localeSubpath`
用於 `doc-system` 時 `{locale}/` 與 `{relativeToDocsRoot}` 之間的路徑片段（直接使用 `style: "doc-system"` 時需要；使用別名時已預設）。使用 `""` 以符合 Starlight 風格的語系資料夾。
- `docsOutput.docsRoot`
Docusaurus 版面配置的原始文件根目錄（例如 `"docs"`）。
- `docsOutput.pathTemplate`
自訂 Markdown 輸出路徑。可用的佔位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。
- `docsOutput.jsonPathTemplate`
標籤檔案的自訂 JSON 輸出路徑。支援與 `pathTemplate` 相同的佔位符。
- `docsOutput.localePathLowercase`
當 `true` 時，內建輸出佈局（`nested`、`flat`、`doc-system` 不含 `pathTemplate`）會在路徑中使用小寫語系片段。預設為 `false`；`astro-starlight` 和 `doc-system` 若 `localeSubpath` 為空，則在載入設定時預設為 `true`。
- `docsOutput.flatPreserveRelativeDir`
當 `docsOutput.style = "flat"` 時，保留原始子目錄以避免同檔名檔案衝突。
- `docsOutput.rewriteRelativeLinks`
翻譯後重寫相對連結（當啟用 `docsOutput.style = "flat"` 且無自訂 `pathTemplate` 時自動啟用）。
- `docsOutput.linkRewriteDocsRoot`
計算扁平連結重寫前綴時使用的儲存庫根目錄。除非您的翻譯文件位於不同的專案根目錄下，否則通常保留為 `"."`。

**後處理**

- `docsOutput.postProcessing`
對翻譯後的 **Markdown 內容**進行可選的轉換（YAML 鍵與非敘述性前置資料值會保留）。在片段重組與扁平連結重寫後執行，並在 `addFrontmatter` 之前。
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` 的有序清單。`search` 為正規表示式模式（純字串使用旗標 `g` 或 `/pattern/flags`）。`replace` 支援 `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}` 等佔位符。
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` —— 在原始與翻譯的 Markdown 中重新生成有限的「以其他語言閱讀」連結列。設定、行為與儲存庫範例請見 [語言切換器 (`languageListBlock`)](#language-switcher-languagelistblock)。

**行為與中繼資料**

- `translateFrontmatterFields`
與 `docsOutput` 相同層級（依據 `docs[]` 區塊）。預設 `true`：翻譯 Starlight/Docusaurus 的使用者介面 YAML 文字（`title`、`description`、`sidebar.label`、`sidebar_label`、`keywords`、`hero.title`、`hero.tagline`、`hero.image.alt`、`hero.actions[].text`、`pagination_label`、`prev`/`next` 標籤）。設定 `false` 可保留整個前置資料區塊不變；傳入字串陣列可限制特定點路徑。
- `segmentSplitting`
與 `docsOutput` 相同層級（依據 `docs[]` 區塊）。用於 `translate-docs` 提取的可選更細緻區段：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`。當 `enabled` 為 `true` 時（`segmentSplitting` 省略時的預設值），密集段落、GFM 管線表格（第一個區塊包含標題、分隔線與第一筆資料列）以及長列表會被分割；子區段以單一換行重新合併（`tightJoinPrevious`）。設定 `"enabled": false` 則僅使用以空白行分隔的主體區塊作為單一區段。
- `warnMarkdownSourceIssues`
當 `true` 時（省略時的預設值），每次 `translate-docs` 執行都會重新掃描 Markdown 區段中的風險分隔符號／未閉合的內嵌程式碼，輸出終端警告，並替換該檔案快取路徑的 `markdown_source_issues` 列。設定 `false` 可跳過此區塊的警告與 SQLite 更新。
- `addFrontmatter`
當 `true` 時（省略時的預設值），翻譯後的 Markdown 檔案將包含 YAML 欄位：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`，以及當至少一個區段具有模型中繼資料時，包含 `translation_models`（所使用的 OpenRouter 模型 ID 的排序清單）。設定為 `false` 可跳過。

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
選擇性。額外的 JSX/HTML 屬性名稱，其 **帶引號的字串值** 不得傳送給翻譯器。此設定會與內建的預設值（`class`、`id`、`style`、`src`、`href`、`type`、`data-*`、大多數的 `aria-*` 等）合併。不區分大小寫。適用於：

- `.astro` 解析與取代式提取（靜態 HTML 標籤以及 `attr=` 內部 `{expression}` 區塊中的字串字面量）。
  - 在 Markdown/Astro 片段翻譯期間進行 MDX 占位符提取（大寫 JSX 標籤上的 `label`、`tooltip` 和 `aria-label`，以及在適用時的 `TabItem` `value`）。

範例：`"protectAttributes": ["variant", "size"]` 讓 `variant="primary"` 在所有語系的 `{items.map(...)}` 中保持不變。

您也可以列出通常可翻譯的屬性（例如 `"title"` 或 `"aria-label"`），以確保這些值從英文直接複製而不翻譯。

- `protectKeys`
選擇性。額外的 **物件屬性名稱**，其帶引號的字串值在範本 `{expression}` 區塊和 MDX 物件字面量中不得翻譯（例如 `label:` 在 `<Tabs values={[ … ]}>` 內部）。此設定會與內建的預設值（`class`、`key`、`id`、`href`、`src` 等）合併。不區分大小寫。

範例：`"protectKeys": ["slug", "code"]` 跳過 `{ slug: 'getting-started', title: 'Getting started' }` → 當 `slug` 受保護時，僅 `title` 會被翻譯。

<br/>

**範例（`docsOutput.style = "flat"` — 截圖路徑 + 可選語言清單包裝）：**

<details>
<summary>平面佈局後處理範例 (截圖 + languageListBlock)</summary>

```json
"docsOutput": {
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

</details>

<a id="json"></a>
### `json`

巢狀 JSON 翻譯管線的頂層陣列。僅當 `features.translateJson` 為 true 時使用（`translate-json` 或 `sync` 的 JSON 階段）。請參閱 [工作流程 3 - JSON 檔案翻譯](#workflow-3---json-file-translation)。

| 欄位 | 說明 |
|-------|-------------|
| `description` | CLI / `status` 的可選註解（不翻譯）。 |
| `contentPaths` | 專案根目錄下的來源 `.json` 檔案、目錄或 glob。 |
| `outputPathTemplate` | 每個目標語系的必要輸出路徑。可用佔位符：`{locale}`、`{LOCALE}`、`{llocale}`、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。 |
| `targetLocales` | 此區塊的可選子集；否則為根目錄 `targetLocales`。 |
| `keyPolicy.mode` | `allowlist`、`denylist` 或 `both`。 |
| `keyPolicy.translateKeys` | 當模式為 `allowlist` 或 `both` 時要包含的點路徑／glob。 |
| `keyPolicy.skipKeys` | 要排除的點路徑／glob（預設拒絕清單包含 `id`、`slug`、`href`、`url`、`key`、`code`）。 |

<a id="svg"></a>
### `svg`

SVG 檔案的頂層路徑與佈局。僅當 `features.translateSVG` 為 true 時（透過 `translate-svg` 或 `sync` 的 SVG 階段）才會執行翻譯。

| 欄位            | 說明                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | 一個或多個目錄 **或 glob 模式**（例如 `"images/*.svg"`、`"**/icons/*.svg"`）。這些模式會相對於專案根目錄解析，並遞迴掃描 `.svg` 檔案。                                                                         |
| `outputDir`                   | 已翻譯 SVG 輸出的根目錄。                                                                                                                                                                                                                                          |
| `style`                       | 當 `pathTemplate` 未設定時，為 `"flat"` 或 `"nested"`。                                                                                                                                                                                                                               |
| `pathTemplate`   | 自訂 SVG 輸出路徑。可用的佔位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{relativeToSourceRoot}"</code>。 |
| `localePathLowercase` | 當設定為 `true` 時，內建的 `flat` / `nested` SVG 版面配置會使用小寫的語系區段。自訂的 `pathTemplate` 值不受影響；如需小寫區段，請使用 `{llocale}`。 |
| `forceLowercase` | 在 SVG 重新組合時將文字轉為小寫。適用於依賴全小寫標籤的設計。                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| 欄位          | 說明                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 指向 `strings.json` 的路徑 - 從現有翻譯自動建立詞彙表。                                                                                                 |
| `userGlossary` | 指向 CSV 檔案的路徑，欄位包含 `Original language string`（或 `en`）、`locale`、`Translation` - 每個原始術語與目標語系各佔一行（`locale` 可為所有目標語系指定為 `*`）。 |

**產生空白詞彙表 CSV：**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI 參考

| 命令                                                                                                    | 說明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                                  | 印出 CLI 版本與建置時間戳記（與根程式上的 `-V` / `--version` 所顯示的資訊相同）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website\|ui-json-bundles] [-o path] [--with-translate-ignore]` | 寫入起始設定檔（包含 `concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 與 `docs[].addFrontmatter`）。`ui-json-bundles` 建立工作流程 3 的腳手架（僅 `json[]`）。`--with-translate-ignore` 建立起始 `.translate-ignore`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `check-models`                                                                           | 根據 `GET /models` 驗證每個設定的 OpenRouter 模型 ID（目錄成員資格、`expiration_date`、每百萬 tokens 的提示/完成 USD 價格）。需要 `OPENROUTER_API_KEY`。當任何設定的 ID 缺失或已過期時，會以非零值退出。對於目錄請求，會遵循 `openrouter.requestTimeoutMs` 的設定。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `extract`                                                                                                  | 從 `t("…")` / `i18n.t("…")` 常值更新 `strings.json`、選擇性 `package.json` 描述，以及選擇性 manifest `englishName` 項目（請參閱 `ui.reactExtractor`）。需要非空的 `ui.sourceRoots`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `generate-ui-languages [--master <path>] [--dry-run]`                                    | 使用 `sourceLocale` + `targetLocales` 和綁定的 `data/ui-languages-complete.json`（或 `--master`）將 `ui-languages.json` 寫入 `ui.flatOutputDir`（或設定時寫入 `uiLanguagesPath`）。若主檔案中缺少某些語系，會發出警告並產生 `TODO` 暫存符。若您現有的 manifest 檔案中已自訂 `label` 或 `englishName` 的值，這些值將被主目錄中的預設值取代 — 請在產生檔案後審查並調整內容。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                                         | 對每個 `docs` 區塊（`contentPaths`，選擇性的 `docusaurusCatalogDir`）翻譯 Markdown/MDX 與 JSON。`-j`：最多並行的語系數量；`-b`：每份檔案最多並行的批次 API 請求數。`--prompt-format`：批次傳輸格式（`xml` \| `json-array` \| `json-object`）。請參閱 [快取行為與 `translate-docs` 標記](#cache-behaviour-and-translate-docs-flags) 以及 [批次提示格式](#batch-prompt-format)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …`                                                                                      | 至少需要一個 `docs[]` 區塊。收集每個區塊 `contentPaths` 下的 `.md` / `.mdx`（遵守 `.translate-ignore`）。在每個平面 ATX `#` 標題的 **前方** 插入 HTML 錨點行 `<a id="slug"></a>`（跳過程式碼區塊內的標題）；若已存在錨點行，則當其 `id` 不再符合目前標題文字所產生的 slug 時進行更新。`-p` / `--path` 或 `-f` / `--file`：限制為專案相對路徑的檔案或目錄。`--slug-style`：`github`（預設；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`。搭配 `pymdown`，可選擇性使用 `--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--dry-run`：僅列出變更內容。                                                                                                                                                                                                                                                                                                                                    |
| `strip-md-bold-inline …`                                                                                   | 至少需要一個 `docs[]` 區塊。移除每個區塊 `contentPaths` 下 `.md` / `.mdx` 中圍繞內嵌程式碼的 `**`（遵守 `.translate-ignore`）。`-p` / `--path` 或 `-f` / `--file`、`--dry-run`、`--no-backup`（覆寫前跳過帶有時間戳記的 `.backup.*`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `check-markdown …`                                                                                         | 掃描每個 `docs[]` 區塊下的 markdown/MDX 的 `contentPaths`（與 `translate-docs` 相同的發現機制，遵循 `.translate-ignore`）：分隔符配對、未關閉的內聯程式碼，以及當 `**`/`__` 包圍 `` `...` `` 跨度或 `[text](../../docs/url)` 連結時的 `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK`。`-p` / `--path` 或 `-f` / `--file`：可選範圍。將 `relativePath:line: [ISSUE_CODE] message` 行輸出到 **stderr**；若發現任何問題則回傳錯誤碼 **1**。`--json`：在 **stdout** 上輸出 JSON 報告。除非指定 `--no-cache`，否則會在 `cacheDir` 中寫入 `markdown_source_issues`。`-v` 會在 stderr 輸出行中加入來源雜湊。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                        | 轉譯在 `config.svg` 中設定的 SVG 檔案（與文件分開）。需要 `features.translateSVG`。快取機制與文件相同；支援 `--no-cache` 以在本次執行中跳過 SQLite 的讀取/寫入。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                               | 僅翻譯使用者介面字串（`strings.json` → 地區設定 JSON）。`--locale` / `ui-languages.json`：以逗號分隔的目標地區設定（預設來自設定 / `ui-languages.json`）。`--force`：依照地區設定重新翻譯所有項目（忽略現有翻譯）。`--dry-run`：不寫入，不呼叫 API。`-j`：最多並行處理的地區設定數量。需要 `features.translateUIStrings`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `translate-json …`                                                                                         | 根據 `json[]` 翻譯嵌套的 JSON（需要 `features.translateJson`）。共用 SQLite 快取；`-l`、`-p` / `--path`、`--dry-run`、`--force`、`--force-update`、`-b`、`--prompt-format`。參見 [Workflow 3](#workflow-3---json-file-translation)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                      | 提取後翻譯 UI 字串（需要 `features.translateUIStrings`）。僅限 UI — 不包含文件、SVG 或 `json[]`。選項與 `translate-ui` 相同，包含 `-l`、`--force`、`--dry-run` 和 `-j`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                      | 執行 `extract` **first**（需要 `features.translateUIStrings`），使 `strings.json` 與原始內容一致，然後由 LLM 審查 **source-locale** 的 UI 字串（拼字、文法）。**術語提示** 僅來自 `glossary.userGlossary` CSV（範圍與 `translate-ui` 相同 — 不包含 `strings.json` / `uiGlossary`，因此不會將不良文案強化為術語表）。使用 OpenRouter（`OPENROUTER_API_KEY`）。僅供建議用途（執行完畢後以 **0** 狀態碼結束）。將 `lint-source-results_<timestamp>.log` 寫入 `cacheDir` 下作為 **人類可讀** 報告（包含摘要、問題與每條字串的 **OK** 列）；終端機僅顯示摘要統計與問題（不顯示每條字串的 `[ok]` 列）。最後一行會列印出日誌檔名。`--json`：僅在 stdout 輸出完整機器可讀的 JSON 報告（日誌檔仍保持人類可讀）。`--dry-run`：仍會執行 `extract`，但僅輸出批次計畫（不進行 API 呼叫）。`--chunk`：每批次 API 請求的字串數量（預設 **50**）。`-j`：最大並行批次數（預設 `concurrency`）。搭配 `--json` 時，人類可讀格式輸出會導向 stderr。連結使用 `path:line`，如同 `dashboard` UI 字串中的「連結」按鈕。 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`              | 匯出 `strings.json` 至 XLIFF 2.0 格式（每個目標語系一個 `.xliff`）。`-o` / `--output-dir`：輸出目錄（預設：與目錄檔案相同資料夾）。`--untranslated-only`：僅包含該語系中缺少翻譯的單元。唯讀；無 API。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                                   | 提取（若已啟用），然後進行 UI 翻譯，接著在設定 `features.translateSVG` 和 `config.svg` 時執行 `translate-svg`，再進行文件翻譯，最後在設定 `features.translateJson` 和 `json[]` 時執行 `translate-json` — 除非使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳過。共用旗標：`-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（文件與 JSON 批次處理）、`--force` / `--force-update`（文件與 JSON）。文件階段也會轉發 `--emphasis-placeholders` 和 `--debug-failed`（與 `translate-docs` 含義相同）。`--prompt-format` 不是 `sync` 旗標；文件與 JSON 步驟使用內建預設值（`json-array`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `status [--max-columns <n>]`                                                             | 當 `features.translateUIStrings` 啟用時，會列印每個語系的 UI 覆蓋率（`Translated` / `Missing` / `Total`）。然後列印每檔案 × 語系的 Markdown 翻譯狀態（無 `--locale` 過濾；語系來自設定）。若語系清單過長，將分割為多個表格，每個表格最多 `n` 個語系欄位（預設 **9**），以確保終端機中的行寬不會過寬。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                         | 列印文件快取和 `strings.json` 統計資料（與「翻譯儀表板」→ **統計資料** 中的彙總相同）。`--max-columns`：每個模型的最大語系欄位數 × 語系表格（預設值與儀表板相符）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                                    | 先執行 `sync --force-update`（提取、UI、SVG、文件），然後移除過時的片段資料列（`last_hit_at` 為 null / 檔案路徑為空）；刪除其解析來源路徑在磁碟上不存在的 `file_tracking` 資料列；移除其 `filepath` 中繼資料指向遺失檔案的翻譯資料列。記錄三項計數（過時、孤立的 `file_tracking`、孤立的翻譯）。除非指定 `--no-backup`，否則會在快取目錄下建立帶有時間戳記的 SQLite 備份。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                               | **無需設定。** 遍歷目錄樹（預設：目前工作目錄）以尋找 `*.log` 和 `cache.db.backup*.sqlite`，列印 `./…` 路徑，例如 `find -print`。若有符合項目：除非指定 `-f` / `--force`（無提示直接刪除），否則會提示 `Delete these files? (y/n)`。若無符合項目：則不提示直接結束。`--dry-run`：僅列出項目，不提示也不刪除（優先於 `--force`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                      | 啟動翻譯儀表板（用於快取區段、`strings.json`、詞彙表、失敗項目和統計資料的本機網頁 UI）。使用 `--no-open` 時，預設瀏覽器不會自動開啟。已棄用的別名 `editor` 仍可運作，但會顯示警告。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `glossary-generate [-o <path>]`                                                          | 寫入空白的 `glossary-user.csv` 範本。`-o`：覆寫輸出路徑（預設值：來自設定的 `glossary.userGlossary`，或 `glossary-user.csv`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                         | 顯示子命令的說明（輸出與 `ai-i18n-tools <command> --help` 相同）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

<a id="root-and-global-options"></a>
### 根目錄與全域選項

| 選項                       | 範圍         | 說明                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | 根目錄程式  | 輸出版本號與建置時間戳記（與 `version` 子命令的資訊相同）。 |
| `-h` / `--help`              | 根目錄程式  | 顯示根目錄程式的說明，或在使用命令名稱時顯示該子命令的說明。      |
| `-c` / `--config <path>`     | 每個命令 | 設定檔路徑（預設值：`ai-i18n-tools.config.json`）。                                  |
| `-v` / `--verbose`           | 每個命令 | 啟用詳細記錄。                                                                          |
| `-w` / `--write-logs [path]` | 每個命令 | 將主控台輸出同時寫入 `.log` 檔案（預設路徑：位於根目錄 `cacheDir` 下）。                |

<a id="per-command-help"></a>
### 各指令說明

| 使用方式                            | 說明                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | 該命令的所有選項。      |
| `ai-i18n-tools help <command>`   | 輸出內容與 `<command> --help` 相同。 |

<a id="target-locales--l----locale"></a>
### 目標語系（`-l` / `--locale`）

| 指令                                                                                | 行為                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync`、`sync-ui`、`export-ui-xliff` | `-l` / `--locale <codes>` — 以逗號分隔的目標 BCP-47 語言代碼（例如 `de,fr,pt-BR`）。若省略，則從設定中取得預設值（`json[]` 區塊也可設定個別區塊的 `targetLocales`）。UI 步驟也會使用 `ui-languages.json`。 |
| `lint-source`                                                                           | `-l` / `--locale <code>` — 用於審查的單一原始語系（預設值：設定檔中的 `sourceLocale`）。                                                            |

---

<a id="environment-variables"></a>
## 環境變數

| 變數               | 說明                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **必要。** 您的 OpenRouter API 金鑰。                     |
| `OPENROUTER_BASE_URL`   | 覆寫 API 基本 URL。                                 |
| `I18N_SOURCE_LOCALE`    | 執行期間覆寫 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`   | 以逗號分隔的語系代碼，用於覆寫 `targetLocales`。  |
| `I18N_LOG_LEVEL`        | 記錄器等級（`debug`、`info`、`warn`、`error`、`silent`）。 |
| `NO_COLOR`              | 當設定為 `1` 時，停用日誌輸出中的 ANSI 色彩。              |
| `I18N_LOG_SESSION_MAX`  | 每次日誌會話保留的最大行數（預設 `5000`）。           |
