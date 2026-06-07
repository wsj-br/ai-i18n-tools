<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm 版本](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm 下載次數](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![授權許可：MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

一個 CLI 與工具包，透過 [OpenRouter](https://openrouter.ai/) 使用大型語言模型來為 JavaScript/TypeScript 應用程式與文件網站進行國際化。三種模組化的工作流程共用單一設定檔，支援不同的翻譯需求：

- **工作流程 1 — UI 翻譯：** 從 JS/TS（以及選擇性地從 `.astro` 檔案）中提取 `t("…")` 呼叫，並為 i18next 或靜態 SSG 查詢產生扁平化、按語系分類的 JSON。
- **工作流程 2 — 文件翻譯：** 使用 `translate-docs` 翻譯在 `docs[].contentPaths` 中列出的 markdown、MDX 和 `.astro` 頁面（適用於網站與 Starlight）。
- **工作流程 3 — JSON 檔案翻譯：** 翻譯在 `json[]` 中定義的任意巢狀 JSON 匯總檔。當 UI 文字儲存在按語系分開的 JSON 檔案中，而非在原始碼中使用 `t()` 時，請使用 `translate-json`。

**SVG** 資源使用 `features.translateSVG`、頂層 `svg` 區塊以及 `translate-svg` 進行翻譯——而非 `docs[].contentPaths`。

**我應該使用哪種工作流程？**
- 原始碼使用 `t()` → **工作流程 1**（`extract` / `translate-ui`）
- 本地化頁面或 Docusaurus 目錄 JSON → **工作流程 2**（`translate-docs`）
- 僅有獨立的巢狀 JSON 語系檔案 → **工作流程 3**（`translate-json`）

所有工作流程都會維護一個檔案/SQLite 快取，以確保只有新增或變更的片段（字串或文字區塊）才會被傳送至 LLM。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [核心工作流程](#core-workflows)
- [安裝](#installation)
  - [使用 CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [快速入門](#quick-start)
  - [工作流程 1 - UI 翻譯](#workflow-1---ui-translation)
  - [工作流程 2 - 文件翻譯](#workflow-2---document-translation)
  - [Astro（純 Astro 與 Starlight）](#astro-plain-astro--starlight)
  - [合併工作流程](#combined-workflow)
- [執行階段輔助工具](#runtime-helpers)
- [CLI 指令](#cli-commands)
- [文件](#documentation)
- [授權](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## 核心工作流程

**工作流程 1 - UI 翻譯** — 適用於任何使用 i18next（React、Next.js、Node.js、CLI）或靜態 Astro SSG 的 JS/TS 專案

掃描原始碼檔案中的 `t("…")` / `i18n.t("…")` 字面值（為 Astro frontmatter 與範本運算式加入 `.astro` 至 `ui.uiExtractor.extensions`），建立主目錄（`strings.json`），透過 OpenRouter 按語系翻譯缺失的條目，並寫入扁平化的 JSON 檔案（`de.json`、`pt-BR.json` 等）。英文原始文字是這些捆綁包中的執行階段查詢鍵——`strings.json` 是提取快取，而非執行階段捆綁包。

**工作流程 2 - 文件翻譯** — 針對位於 `docs[].contentPaths` 下的 markdown、MDX 和 `.astro`

主要針對 **markdown、MDX 和 `.astro` 文件**（Docusaurus、[Astro Starlight](https://starlight.astro.build/)、純 README 檔案與純 Astro 行銷頁面）設計。`translate-docs` 會寫入本地化副本並共用 SQLite 快取。在 Docusaurus 網站上，將 `docs[].docusaurusCatalogDir` 設定為 `write-translations` 目錄資料夾，以便在相同指令中翻譯 shell JSON（導覽列、頁尾、主題字串）。`docs[].docsOutput.style` 支援 `"nested"`、`"flat"`、`"doc-system"`，並可別名 `"docusaurus"` / `"astro-starlight"`（參見「快速入門」中的 [輸出佈局](docs/GETTING_STARTED.zh-TW.md#output-layouts)）。不屬於 Docusaurus 目錄的任意巢狀 UI JSON 應歸於工作流程 3（`json[]` / `translate-json`），而非 `docs[]`。

**工作流程 3 - JSON 檔案翻譯** — 用於原始碼中不含 `t()` 的巢狀語系 JSON

透過頂層 `json[]`、`features.translateJson` 和 `translate-json` 翻譯如 `src/i18n/en/translation.json` 等檔案。可使用 `init -t ui-json-bundles` 進行腳手架建立。

所有工作流程共用 `ai-i18n-tools.config.json`，且可組合使用；`sync` 會根據您的 `features` 標誌依序執行提取、UI 翻譯、翻譯 SVG、`translate-docs` 和 `translate-json`。

---

<a id="installation"></a>
## 安裝

發布的套件僅支援 **ESM** 格式（`"type": "module"`）。需要 Node.js `>=22.16.0`。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### 使用 CLI

**依專案安裝（建議）** — 作為開發依賴安裝，然後透過 `npx`、`pnpm exec` 或 `package.json` 指令碼執行：

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

您也可以直接使用 ai-i18n-tools CLI 指令，例如 `ai-i18n-tools sync`。

建議使用 `sync` 而非手動串接 `extract`、`translate-ui`、`translate-svg`、`translate-docs` 和 `translate-json` — 手動執行時容易出錯順序與功能標誌。請參閱「快速入門」中的 [推薦 `package.json` 指令碼](docs/GETTING_STARTED.zh-TW.md#recommended-packagejson-scripts)。

**一次性零安裝** — 使用 `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（僅在當次執行時下載）。

> **提示：** 若要在互動式殼層中直接執行 `ai-i18n-tools` 而不使用 `npx`，請將 `node_modules/.bin` 加入您的 `PATH`（bash/zsh：`export PATH="$PWD/node_modules/.bin:$PATH"`）。詳見 [快速開始](docs/GETTING_STARTED.zh-TW.md#installation) 中關於 direnv 與 Windows 的說明。

設定您的 OpenRouter API 金鑰：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

呼叫 OpenRouter 的指令（`translate-ui`、`translate-docs`、`translate-json`、`sync`、`check-models` 及相關指令碼）需要在環境中設定 `OPENROUTER_API_KEY`。`check-markdown` 不使用 OpenRouter。

在 `ai-i18n-tools.config.json` 中，`openrouter` 物件包含模型列表、`baseUrl`、`maxTokens`、`temperature` 以及 `requestTimeoutMs`：表示對 OpenRouter 的每個 HTTP 請求（聊天完成和內部 `GET /models` 呼叫）等待的最長時間（毫秒）。預設值為 `30000`（30 秒）。

執行 `ai-i18n-tools check-models` 以根據 OpenRouter 的即時目錄驗證每個已設定的模型 ID。此命令會報告遺失或已過期的 ID `expiration_date`，列出有效模型及其估計的輸入/輸出價格（每百萬 tokens 的美元價格），並在任何已設定的 ID 無效時以非零狀態碼結束。此操作需要 `OPENROUTER_API_KEY`。

---

<a id="quick-start"></a>
## 快速開始

<a id="workflow-1---ui-translation"></a>
### 工作流程 1 - UI 翻譯

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

接著在您的應用程式中使用來自 `'ai-i18n-tools/runtime'` 的輔助工具來整合 i18next。完整設定請參閱「快速開始」指南中的 [步驟 4：在執行階段整合 i18next](docs/GETTING_STARTED.zh-TW.md#step-4-wire-i18next-at-runtime)。

<a id="workflow-2---document-translation"></a>
### 工作流程 2 - 文件翻譯

預設的 `init` 範本 (`ui-markdown`) 僅啟用 UI 提取。在執行 `translate-docs` 之前，請使用以文件為導向的範本（或啟用 `features.translateDocs` 並加入 `docs[]`）：

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

編輯 `ai-i18n-tools.config.json`：將 `docs[].contentPaths` 設定為 markdown、MDX 和/或 `.astro` 來源；`docs[].outputDir` 與 `docs[].docsOutput.style`（`"docusaurus"`、`"astro-starlight"`、`"flat"` 等）。完整欄位參考：[Workflow 2 - Document Translation](docs/GETTING_STARTED.zh-TW.md#workflow-2---document-translation)。

<a id="astro-plain-astro--starlight"></a>
### Astro（純 Astro 與 Starlight）

**Astro Starlight** — `init -t ui-starlight`，然後 `translate-docs`。需要時，Starlight UI 覆寫可於獨立的 `docs[]` 區塊中搭配 `jsonPathTemplate` 使用 `src/content/i18n/en.json`（[Getting Started → Workflow 2](docs/GETTING_STARTED.zh-TW.md#step-1-initialise-for-documentation)）。

**純 Astro**（行銷或應用網站，非 Starlight）— 結合 [Astro 內建的 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 與 ai-i18n-tools。參考專案：[`examples/astro-website`](../examples/astro-website/)（英文位於 `/`，語系位於 `/{locale}/`）。

多數團隊會採用兩種流程的 **混合**方式：

| 管線 | 用途 | 指令 | 輸出 |
|----------|---------|----------|--------|
| **頁面 HTML** | 標題、段落、導覽標籤、模板主體中的內嵌陣列 | `translate-docs` | 每個語系對應一個 `src/pages/{locale}/index.astro` |
| **UI 字串 (`t()`)** | Frontmatter 資料、分頁標籤、共用陣列 | `extract` → `translate-ui` | `public/locales/{locale}.json`（以英文來源為鍵） |

使用 `init -t ui-astro-website` 建立 UI 骨架。對於 `.astro` 頁面中的硬編碼 HTML，請啟用 `features.translateDocs` 並加入包含 `docsOutput.style: "astro-starlight"` 的 `docs[]` 區塊（參見 [Astro website pages (parse-and-replace)](docs/GETTING_STARTED.zh-TW.md#astro-website-pages-parse-and-replace)）。請保持 `targetLocales`、`i18n.locales` 在 `astro.config.mjs` 中，以及 `ui-languages.json` 一致（Astro 路由使用小寫代碼如 `pt-br`；扁平化捆綁檔名遵循設定的大小寫，例如 `pt-BR.json`）。

建置時串接 `t()`，除非你加入 client islands，否則無需使用 i18next — 請參見 [Astro website UI strings (SSG)](docs/GETTING_STARTED.zh-TW.md#astro-website-ui-strings-ssg) 及範例中的 `src/i18n/t.ts`。

<a id="combined-workflow"></a>
### 結合式工作流程

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## 執行階段輔助工具

以下輔助函數從 `'ai-i18n-tools/runtime'` 匯出，可在任何 JavaScript 環境中使用。您不需要匯入 i18next 即可使用它們：

| Helper                                                                 | 說明                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | 用於鍵值作為預設值設定的標準 i18next 初始化選項。                                                                               |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 建議的串接方式：從 `strings.json` 取得 key-trim + 複數 `wrapT`，可選擇性合併 `translate-ui` `{sourceLocale}.json` 的複數鍵。 |
| `wrapT(i18n, options)`                                                 | 具備複數感知功能的低階 `t()` 包裝函式 (通常由 `setupKeyAsDefaultT` 安裝)。                                                    |
| `buildPluralIndexFromStringsJson(entries)`                               | 從包含 `"plural": true` 的目錄列建構 `wrapT` 所使用的複數群組索引。                                                    |
| `extractInterpolationNamesForWrap(key)`                                  | 從原始金鑰解析 `{{var}}` 名稱，供 `wrapT` / 金鑰截斷備援使用。                                                              |
| `wrapI18nWithKeyTrim(i18n)` | 僅為較低階的 key-trim 包裝器 (應用程式串接已不建議使用；請改用 `setupKeyAsDefaultT`)。 |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | 從 `ui-languages.json` 建立 `localeLoaders` 對應表以供 `makeLoadLocale` 使用 (包含所有 `code`，除了 `sourceLocale`)。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 用於非同步載入語系檔案的工廠函式。 |
| `getTextDirection(lng)` | 根據 BCP-47 編碼回傳 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement` 上設定 `dir` 屬性。 |
| `getUILanguageLabel(lang, t)` | 語言選單列的顯示標籤（包含 i18n）。 |
| `getUILanguageLabelNative(lang)` | 不呼叫 `t()` 的顯示標籤（標頭風格）。 |
| `interpolateTemplate(str, vars)` | 在純字串上進行低階 `{{var}}` 替換（內部使用；應用程式碼應改用 `t()`）。 |
| `flipUiArrowsForRtl(text, isRtl)` | 將 `→` 翻轉為 `←` 以支援由右至左（RTL）的版面配置。 |

---

<a id="cli-commands"></a>
## CLI 指令

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

各指令的完整參數列表請見 [快速開始 — CLI 參考](docs/GETTING_STARTED.zh-TW.md#cli-reference)。執行 `ai-i18n-tools <command> --help` 可查看內建的使用說明文字。

每個指令的全域選項：`-c <config>`（預設值：`ai-i18n-tools.config.json`）、`-v`（詳細輸出）、選擇性 `-w` / `--write-logs [path]` 用於將主控台輸出同時寫入日誌檔（預設值：放在翻譯快取目錄下）、`-V` / `--version`，以及 `-h` / `--help`。多個指令接受 `-l` / `--locale <codes>`（以逗號分隔的 BCP-47）以限制目標語系；`lint-source` 則使用單一來源語系。指令總覽表請見 [Getting Started](docs/GETTING_STARTED.zh-TW.md#cli-reference)。

---

<a id="documentation"></a>
## 文件

- [Getting Started](docs/GETTING_STARTED.zh-TW.md) - 所有工作流程的完整設定（UI、文件/`.astro`、JSON 捆綁、Astro Starlight 與純 Astro）、CLI 參考及設定欄位參考。
- [Locale assets guide](docs/LOCALE-ASSETS-GUIDE.zh-TW.md) - 在翻譯文件中使用截圖與向量圖（模式 A–E、扁平化連結重寫器、截圖指令碼）。
- [Package Overview](docs/PACKAGE_OVERVIEW.zh-TW.md) - 架構、內部機制、程式化 API 與擴充點。
- [AI Agent Context](../docs/ai-i18n-tools-context.md) - **供使用此套件的應用程式：** 下游專案的整合提示（複製至你倉儲的 agent 規則中）。
- **本** 倉儲的維護者內部使用：`dev/package-context.md`（僅限克隆；未發布至 npm）。

---

<a id="license"></a>
## 授權條款

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
