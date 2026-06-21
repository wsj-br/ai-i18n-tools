<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

一個 CLI 和工具包，用於使用大型語言模型國際化 JavaScript/TypeScript 應用程式和文件網站。它適用於 [OpenRouter](https://openrouter.ai/) 和任何 OpenAI 相容的提供者（OpenAI、Anthropic、Gemini、DeepSeek、Groq、Mistral、xAI、Cerebras、NVIDIA、Alibaba、APIFUN、Ollama 等）。三個模組化工作流程，全部共用單一設定檔，支援不同的翻譯需求：

- **工作流程 1 — UI 翻譯：** 從 JS/TS（以及可選的 `.astro` 文件）中提取 `t("…")` 呼叫，並為 i18next 或靜態 SSG 查找生成扁平的、每個地區設定的 JSON。
- **工作流程 2 — 文件翻譯：** 使用 `translate-docs` 翻譯 `docs[].contentPaths` 中列出的 markdown、MDX 和 `.astro` 頁面（用於網站和 Starlight）。
- **工作流程 3 — JSON 文件翻譯：** 翻譯 `json[]` 中定義的任意巢狀 JSON 捆綁包。當 UI 文字儲存在每個地區設定的 JSON 文件中而不是在原始碼中使用 `t()` 時，請使用 `translate-json`。

**SVG** 資產使用 `features.translateSVG`、頂層 `svg` 區塊和 `translate-svg` 進行翻譯，而不是 `docs[].contentPaths`。

**我應該使用哪個工作流程？**
- 原始碼使用 `t()` → **工作流程 1**（`extract` / `translate-ui`）
- 本地化頁面或 Docusaurus 目錄 JSON → **工作流程 2**（`translate-docs`）
- 僅獨立的、巢狀的 JSON 地區設定文件 → **工作流程 3**（`translate-json`）

所有工作流程都維護一個文件/SQLite 快取，以確保只有新的或已變更的區段（字串或文字塊）會被傳送給 LLM。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [核心工作流程](#core-workflows)
- [安裝](#installation)
  - [使用 CLI](#using-the-cli)
- [LLM 提供者](#openrouter)
- [快速入門](#quick-start)
  - [工作流程 1 - UI 翻譯](#workflow-1---ui-translation)
  - [工作流程 2 - 文件翻譯](#workflow-2---document-translation)
  - [Astro（純 Astro 和 Starlight）](#astro-plain-astro--starlight)
  - [合併工作流程](#combined-workflow)
- [執行階段助手](#runtime-helpers)
- [CLI 命令](#cli-commands)
- [文件](#documentation)
- [授權](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## 核心工作流程

**工作流程 1 - UI 翻譯** — 適用於任何使用 i18next（React、Next.js、Node.js、CLI）或靜態 Astro SSG 的 JS/TS 專案

掃描原始碼文件中的 `t("…")` / `i18n.t("…")` 字面量（將 `.astro` 新增至 `ui.uiExtractor.extensions` 以支援 Astro 的 frontmatter 和模板表達式），建置主目錄（`strings.json`），透過 OpenRouter 翻譯每個地區設定中缺失的條目，並寫入扁平的 JSON 文件（`de.json`、`pt-BR.json` 等）。英文原始碼文字是這些捆綁包中的執行階段查找金鑰 — `strings.json` 是提取快取，而不是執行階段捆綁包。

**工作流程 2 - 文件翻譯** — 適用於 `docs[].contentPaths` 下的 markdown、MDX 和 `.astro`

主要設計用於 **markdown、MDX 和 `.astro` 文件**（Docusaurus、[Astro Starlight](https://starlight.astro.build/)、純 README 文件和純 Astro 行銷頁面）。`translate-docs` 會寫入具有共用 SQLite 快取的本地化副本。在 Docusaurus 網站上，將 `docs[].docusaurusCatalogDir` 設定為 `write-translations` 目錄資料夾，以便在同一命令中翻譯 shell JSON（導覽列、頁腳、主題字串）。`docs[].docsOutput.style` 支援 `"nested"`、`"flat"`、`"doc-system"`，以及別名 `"docusaurus"` / `"astro-starlight"`（請參閱入門中的 [輸出佈局](docs/GETTING_STARTED.zh-Hant.md#output-layouts)）。任何非 Docusaurus 目錄的任意巢狀 UI JSON 應歸類於工作流程 3（`json[]` / `translate-json`），而不是 `docs[]`。

**工作流程 3 - JSON 文件翻譯** — 原始碼中沒有 `t()` 的巢狀地區設定 JSON

透過頂層的 `json[]`、`features.translateJson` 和 `translate-json` 來翻譯檔案，例如 `src/i18n/en/translation.json`。使用 `init -t ui-json-bundles` 來建構。

所有工作流程都共用 `ai-i18n-tools.config.json` 並可組合；`sync` 會依據您的 `translate-docs` 旗標依序執行提取、UI 翻譯、SVG 翻譯、`translate-json` 和 `features`。

---

<a id="installation"></a>
## 安裝

已發佈的套件是 **僅 ESM**（`"type": "module"`）。需要 Node.js `>=22.16.0`。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### 使用 CLI

**每個專案（建議）** — 安裝為開發相依性，然後透過 `npx`、`pnpm exec` 或 `package.json` 指令碼執行：

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

建議使用 `sync` 而非手動串連 `extract`、`translate-ui`、`translate-svg`、`translate-docs` 和 `translate-json` — 手動執行時容易弄錯順序和功能旗標。請參閱入門指南中的 [建議的 `package.json` 指令碼](docs/GETTING_STARTED.zh-Hant.md#recommended-packagejson-scripts)。

**零安裝一次性使用** — `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（僅下載該次呼叫的檔案）。

> **提示：** 若要在互動式 shell 中直接執行 `ai-i18n-tools` 而不使用 `npx`，請將 `node_modules/.bin` 加入您的 `PATH` (bash/zsh：`export PATH="$PWD/node_modules/.bin:$PATH"`)。如需 direnv 和 Windows 的說明，請參閱 [開始使用](docs/GETTING_STARTED.zh-Hant.md#installation)。

設定您的提供者 API 金鑰（顯示 OpenRouter；請使用與您的提供者相符的變數）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## LLM 提供者

翻譯指令（`translate-ui`、`translate-docs`、`translate-json`、`sync`、`check-models` 和相關指令碼）會呼叫 LLM 提供者；`check-markdown` 不會。

在頂級 `providers` 映射下配置提供者，並使用頂級 `provider` 選擇器選擇作用中的提供者（當只有一個提供者配置時為可選）。大多數提供者僅需要 `translationModels` 列表 — `baseUrl` 和 API 金鑰環境變數來自內建預設值；您可以為每個提供者覆寫 `baseUrl`、`apiKeyEnv`、`headers`、`maxTokens`、`temperature` 和 `requestTimeoutMs`。`requestTimeoutMs` 是等待每個請求的最大時間（毫秒）（預設為 `30000`）。

若要在不編輯設定檔的情況下切換單次執行的提供者，請傳遞全域選項 `-P` / `--provider <name>`（例如 `ai-i18n-tools -P groq translate-ui`）；名稱必須是已設定的 `providers` 索引鍵之一。

```jsonc
{
  "provider": "openrouter",
  "providers": {
    "openrouter": { "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"] },
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

內建提供者預設值（金鑰 — 基本 URL — API 金鑰環境變數）：

| 提供者 | 基本 URL | API 金鑰環境變數 |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (無) |

透過新增一個帶有 `baseUrl`（以及 `apiKeyEnv`，除非不需要金鑰）的新金鑰，來定義自訂的 OpenAI 相容提供者。模型 ID 是純粹的上游 ID — 提供者是在設定層級選擇的，因此不需要 `provider/` 前綴（OpenRouter ID 會保留其原生 `vendor/model` 形式）。

每個供應商都會報告 Token 用量；僅當供應商（例如 OpenRouter）回傳確切的美元成本時，才會顯示該成本。`ai-i18n-tools check-models` 會將已設定的模型 ID，與作用中供應商的即時 `GET /models` 清單（任何供應商）進行驗證，並在供應商回傳時顯示定價（例如 OpenRouter）。`ai-i18n-tools list-models` 會列出作用中供應商所宣傳的每一個模型（使用 `-P` / `--provider` 來檢查另一個已設定的供應商）。

仍然接受舊式的頂層 `openrouter` 設定區塊，並在載入時自動遷移到 `providers.openrouter`（帶有 `provider: "openrouter"`）。

如需使用 `-P` 在單一文件中切換供應商的實際操作示範，請參閱 [`examples/multi-provider`](../examples/multi-provider/)（一個包含 `openai`、`anthropic`、`nvidia` 和 `deepseek` 的設定）。

---

<a id="quick-start"></a>
## 快速入門

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

然後使用 `'ai-i18n-tools/runtime'` 中的輔助函式在您的應用程式中整合 i18next。請參閱入門指南中的 [步驟 4：在執行階段整合 i18next](docs/GETTING_STARTED.zh-Hant.md#step-4-wire-i18next-at-runtime) 以取得完整設定。

<a id="workflow-2---document-translation"></a>
### 工作流程 2 - 文件翻譯

預設的 `init` 範本（`ui-markdown`）僅啟用 UI 提取。請在 `translate-docs` 之前使用以文件為導向的範本（或啟用 `features.translateDocs` 並新增 `docs[]`）：

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

編輯 `ai-i18n-tools.config.json`：將 `docs[].contentPaths` 設定為 markdown、MDX 和/或 `.astro` 來源；`docs[].outputDir` 和 `docs[].docsOutput.style`（`"docusaurus"`、`"astro-starlight"`、`"flat"` 等）。完整欄位參考：[工作流程 2 - 文件翻譯](docs/GETTING_STARTED.zh-Hant.md#workflow-2---document-translation)。

<a id="astro-plain-astro--starlight"></a>
### Astro（純 Astro 與 Starlight）

**Astro Starlight** — `init -t ui-starlight`，然後 `translate-docs`。Starlight UI 的覆寫可以使用 `src/content/i18n/en.json` 和 `jsonPathTemplate` 在單獨的 `docs[]` 區塊中進行（如果需要）（[入門 → 工作流程 2](docs/GETTING_STARTED.zh-Hant.md#step-1-initialise-for-documentation))。

**純 Astro**（行銷或應用程式網站，非 Starlight）— 將 [Astro 內建的 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 與 ai-i18n-tools 結合使用。參考專案：[`examples/astro-website`](../examples/astro-website/)（英文在 `/`，地區設定在 `/{locale}/`）。

大多數團隊使用兩種管道的**混合**：

| 管道 | 用途 | 命令 | 輸出 |
|----------|---------|----------|--------|
| **頁面 HTML** | 範本主體中的標題、段落、導覽標籤、內嵌陣列 | `translate-docs` | 每種語言 `src/pages/{locale}/index.astro` |
| **UI 字串 (`t()`)** | 前端資料、索引標籤、共用陣列 | `extract` → `translate-ui` | `public/locales/{locale}.json`（以英文來源為鍵） |

使用 `init -t ui-astro-website` 建構 UI。對於 `.astro` 頁面中的硬式編碼 HTML，請啟用 `features.translateDocs` 並新增一個包含 `docs[]` 的 `docsOutput.style: "astro-starlight"` 區塊（請參閱 [Astro 網站頁面（剖析與取代）](docs/GETTING_STARTED.zh-Hant.md#astro-website-pages-parse-and-replace))。請保持 `targetLocales`、`i18n.locales` 在 `astro.config.mjs` 中，以及 `ui-languages.json` 對齊（Astro 路由使用小寫代碼，例如 `pt-br`；扁平化套件檔案名稱遵循組態的大小寫，例如 `pt-BR.json`）。

在建置時連接 `t()`，除非您新增用戶端島嶼，否則不需要 i18next — 請參閱 [Astro 網站 UI 字串（SSG）](docs/GETTING_STARTED.zh-Hant.md#astro-website-ui-strings-ssg) 和範例中的 `src/i18n/t.ts`。

<a id="combined-workflow"></a>
### 組合工作流程

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## 執行階段輔助程式

下列輔助程式會從 `'ai-i18n-tools/runtime'` 匯出，並可在任何 JavaScript 環境中使用。您不需要匯入 i18next 即可使用它們：

| 輔助程式 | 說明 |
|----------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)` | 標準 i18next init 選項，用於鍵即預設設定。 |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 建議的連接方式：鍵修剪 + `strings.json` 中的複數 `wrapT`，可選擇性合併 `translate-ui` `{sourceLocale}.json` 複數鍵。 |
| `wrapT(i18n, options)` | 低階的複數感知 `t()` 包裝函式（通常由 `setupKeyAsDefaultT` 安裝）。 |
| `buildPluralIndexFromStringsJson(entries)` | 從具有 `"plural": true` 的目錄列建構複數群組索引 `wrapT`。 |
| `extractInterpolationNamesForWrap(key)` | 從來源鍵剖析 `{{var}}` 名稱，用於 `wrapT` / 鍵修剪備援。 |
| `wrapI18nWithKeyTrim(i18n)` | 僅限低階鍵修剪包裝函式（應用程式連接已棄用；請優先使用 `setupKeyAsDefaultT`）。 |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | 從 `ui-languages.json` 建構 `makeLoadLocale` 的 `localeLoaders` 映射（每個 `code`，除了 `sourceLocale`）。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 非同步地區設定檔案載入的工廠。 |
| `getTextDirection(lng)` | 為 BCP-47 代碼傳回 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement` 上設定 `dir` 屬性。 |
| `getUILanguageLabel(lang, t)` | 語言選單列的顯示標籤（含 i18n）。 |
| `getUILanguageLabelNative(lang)` | 不呼叫 `t()` 的顯示標籤（標頭樣式）。 |
| `interpolateTemplate(str, vars)`                                       | 低階 `{{var}}` 字串替換（內部使用；應用程式碼應改用 `t()`）。                               |
| `flipUiArrowsForRtl(text, isRtl)`                                      | 在 RTL 版面配置中將 `→` 翻轉為 `←`。                                                                                                       |

---

<a id="cli-commands"></a>
## CLI 命令

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools list-languages [search]
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

完整的每條命令旗標清單請參閱 [開始使用 — CLI 參考資料](docs/GETTING_STARTED.zh-Hant.md#cli-reference)。執行 `ai-i18n-tools <command> --help` 以取得內建的使用說明文字。

每個命令上的全域選項：`-c <config>`（預設值：`ai-i18n-tools.config.json`）、`-v`（詳細資訊）、`-P` / `--provider <name>`（覆寫作用中的 LLM 提供者；必須在 `providers` 下進行設定）、可選的 `-w` / `--write-logs [path]` 將主控台輸出複製到記錄檔（預設值：在翻譯快取目錄下）、`-V` / `--version`，以及 `-h` / `--help`。數個命令接受 `-l` / `--locale <codes>`（逗號分隔的 BCP-47）來限制目標地區設定；`lint-source` 使用單一來源地區設定。請參閱 [開始使用](docs/GETTING_STARTED.zh-Hant.md#cli-reference) 以取得命令總覽表格。

---

<a id="documentation"></a>
## 文件

- [開始使用](docs/GETTING_STARTED.zh-Hant.md) - 所有工作流程（UI、文件/`.astro`、JSON 套件、Astro Starlight 和純 Astro）、CLI 參考資料以及設定欄位參考資料的完整設定。
- [地區設定資產指南](docs/LOCALE-ASSETS-GUIDE.zh-Hant.md) - 已翻譯文件的螢幕擷取畫面和圖示化 SVG（模式 A–E、平面連結重寫器、螢幕擷取畫面指令碼）。
- [套件總覽](docs/PACKAGE_OVERVIEW.zh-Hant.md) - 架構、內部結構、程式設計 API 和擴充點。
- [AI Agent Context](../docs/ai-i18n-tools-context.md) - **針對使用此套件的應用程式：** 整合提示，用於下游專案（複製到您儲存庫的代理規則中）。
- **此**儲存庫的維護者內部資訊：`dev/package-context.md`（僅限複製；不在 npm 上）。

---

<a id="license"></a>
## 授權

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
