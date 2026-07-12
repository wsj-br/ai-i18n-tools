<center>

![ai-i18n-tools 標誌](../docs/public/ai-i18n-tools_logo.png)

</center>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**使用您選擇的 AI 模型翻譯您的應用程式與文件：無廠商綁定，無需重寫。**

`ai-i18n-tools` 是一套用於國際化 JavaScript/TypeScript 應用程式與文件網站的 CLI 與工具組 — 支援 Docusaurus、Astro、Starlight、VitePress、Nextra、Fumadocs 以及純 Markdown/MDX — 並使用大型語言模型。

從內建預設中選擇（**OpenAI**、**Anthropic**、**Google Gemini**、**NVIDIA**、**DeepSeek**、**Groq**、**Mistral**、**xAI**、**Cerebras**、**Alibaba**、**APIFUN**、**OpenRouter**、**Ollama**），或指向任何與 OpenAI 相容的 API。可按專案切換供應商或模型，甚至按語言切換，而無需修改你的程式碼庫。

一個設定檔驅動三種翻譯模式，因此您可以根據內容的結構進行混合搭配：

- **介面字串** — 從 JS/TS（以及可選的 `.astro` 檔案）中擷取 `t("…")` 呼叫，並為每個語系產生扁平的 JSON，供 i18next 或靜態 SSG 查詢使用。
- **文件** — 使用 `translate-docs` 翻譯列於 `docs[].contentPaths` 中的 Markdown、MDX 與 `.astro` 頁面。支援 **VitePress**、**Starlight**、**Docusaurus**、**Nextra**、**Fumadocs**、基於 Astro 的網站，或任何從 Markdown/MDX/`.astro` 原始檔讀取內容的靜態網站產生器。
- **JSON** — 翻譯定義於 `json[]` 中的任意巢狀 JSON 套件。當介面文案存放在各語系的 JSON 檔案中，而非原始碼中的 `t()` 呼叫時，請使用 `translate-json`。

**SVG** 資產有自己的路徑：`features.translateSVG`、頂層 `svg` 區塊和 `translate-svg` — 而非 `docs[].contentPaths`。

**我該使用哪個？**

| 您的內容                                                                  | 指令                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| 原始碼使用 `t()`                                                        | **UI 字串** — `extract` / `translate-ui` |
| 本地化頁面或文件網站（VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro 等） | **文件** — `translate-docs` |
| 獨立的巢狀 JSON 地區檔案                                          | **JSON** — `translate-json`                 |

這三種模式共用一個檔案/SQLite 快取，因此只有新增或變更的區段（字串或文字區塊）會重新傳送給模型 — 無論您使用哪個提供者，重新執行都快速且便宜。

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [翻譯類型](#translation-types)
- [安裝](#installation)
  - [使用 CLI](#using-the-cli)
- [LLM 提供者](#llm-providers)
- [快速開始](#quick-start)
  - [UI 字串](#ui-strings)
  - [文件](#documents)
  - [VitePress](#vitepress)
  - [Nextra](#nextra)
  - [Fumadocs](#fumadocs)
  - [Astro（純 Astro 與 Starlight）](#astro-plain-astro--starlight)
  - [合併同步](#combined-sync)
- [執行階段輔助函式](#runtime-helpers)
- [CLI 指令](#cli-commands)
  - [工具介面語言（日誌、說明、儀表板）](#tool-ui-language-logs-help-dashboard)
- [文件](#documentation)
- [授權](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="translation-types"></a>
## 翻譯類型

每種翻譯類型都有其自己的指南，其中包含完整的配置詳細資訊：[UI 字串](../docs/guide/ui-strings/)、[文件](../docs/guide/documents/) 和 [JSON](../docs/guide/json.md)。有關並排比較，請參閱 [什麼是 ai-i18n-tools？](../docs/guide/what-is-ai-i18n-tools.md)。

有幾點值得事先了解：介面字串會透過目前使用的 LLM 供應商（見 [LLM 供應商](#llm-providers)）翻譯各語系中缺失的項目，並寫入扁平的 JSON 檔案（`de.json`、`pt-BR.json`、…），以英文原文作為執行階段的查詢鍵 — `strings.json` 是擷取快取，而非執行階段的套件。文件支援 `docs[].docsOutput.style` 值 `"nested"`、`"flat"`、`"doc-system"`，以及別名 `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"`（見[輸出佈局](../docs/guide/documents/output-layouts.md)）。三者共用 `ai-i18n-tools.config.json` 且可合併使用；`sync` 會根據您的 `features` 旗標，依序執行擷取、介面翻譯、SVG 翻譯、`translate-docs` 與 `translate-json`。

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

在您的專案中安裝套件後，npm/pnpm/yarn 會將已發佈的 bin 項目 (`bin/ai-i18n-tools.mjs`) 連結到 `node_modules/.bin/ai-i18n-tools`。該墊片會從已安裝的套件載入編譯後的 CLI。

要在互動式 shell 中輸入裸 `ai-i18n-tools` 指令，請設定下方其中一個選項。若未進行設定，即使完成本地安裝，shell 也無法找到該二進位檔案。

**direnv** — 在專案根目錄的 `.envrc` 中新增（bash/zsh；請參閱 [direnv.net](https://direnv.net/)）：

```bash
PATH_add node_modules/.bin
```

在 `direnv allow` 之後，每當您 `cd` 進入專案時，裸指令即可使用。

**手動 PATH** — 在互動式 shell 中從專案根目錄執行：

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**全域安裝** — 安裝 CLI 一次後即可從任何目錄呼叫：

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

全域安裝會使用全域鎖定的版本。若要進行各專案的版本鎖定，建議使用 direnv 或手動 PATH，以便 `node_modules/.bin` 解析至專案的相依性。

**`package.json` 指令碼** — 當 npm 或 pnpm 執行指令碼時，它會將 `node_modules/.bin` 置於 `PATH` 之前，因此裸指令名稱可在指令碼內運作，而無需更改 shell PATH：

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

然後執行例如 `pnpm run i18n:sync` — 指令碼會解析本地二進位檔案，而無需額外的 shell 設定。

**替代方案** — 若您不願調整 `PATH`：`npx ai-i18n-tools …` (npm) 或 `pnpm exec ai-i18n-tools …` (pnpm)。若要在沒有 `package.json` 項目的情況下進行零安裝的一次性執行：`npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`。

優先使用 `sync`，而不是手動串聯 `extract`、`translate-ui`、`translate-svg`、`translate-docs` 和 `translate-json` — 手動執行時，順序和功能標誌很容易出錯。請參閱快速入門指南中的 [推薦的 `package.json` 腳本](../docs/guide/quick-start.md#recommended-packagejson-scripts)。

為你選擇的供應商設定 API 金鑰（環境變數名稱請見 [LLM 供應商](#llm-providers)）：

```bash
export PROVIDER_API_KEY=sk-your-key-here
```

---

<a id="llm-providers"></a>
## LLM 供應商

翻譯指令（`translate-ui`、`translate-docs`、`translate-json`、`sync`、`check-models` 及相關指令碼）會呼叫 LLM 提供者；而 `check-markdown`、`mark-html` 和 `extract` 則不會。

在頂級 `providers` 映射下配置提供者，並使用頂級 `provider` 選擇器選擇作用中的提供者（當只有一個提供者配置時為可選）。大多數提供者僅需要 `translationModels` 列表 — `baseUrl` 和 API 金鑰環境變數來自內建預設值；您可以為每個提供者覆寫 `baseUrl`、`apiKeyEnv`、`headers`、`maxTokens`、`temperature` 和 `requestTimeoutMs`。`requestTimeoutMs` 是等待每個請求的最大時間（毫秒）（預設為 `30000`）。

每個提供者區塊上的可選模型層級：

- `translationModels` — 全局有序備選鏈（翻譯功能所需）。
- `uiModels` — 仅限 UI 的鏈（`translate-ui`，多數生成，`proofread-ui`）：在任何匹配的 `localeModels` 項目之後嘗試，但在 `translationModels` 之前。
- `localeModels` — 每個區域設置的覆蓋項，適用於 **所有** 管道：每個項目將 BCP-47 區域設置映射到一個有序模型列表，僅在該區域設置下首先嘗試（`pt-br` 匹配 `pt-BR`）。

解析順序：**UI** → `localeModels(locale)` → `uiModels` → `translationModels`；**文檔 / JSON / SVG** → `localeModels(locale)` → `translationModels`。重複的模型 ID 會被跳過，同時保留順序。

若要在不編輯設定檔的情況下切換單次執行的提供者，請傳遞全域選項 `-P` / `--provider <name>`（例如 `ai-i18n-tools -P groq translate-ui`）；名稱必須是已設定的 `providers` 索引鍵之一。

```jsonc
{
  "provider": "ollama",
  "providers": {
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "openrouter": {
      "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"],
      "uiModels": ["anthropic/claude-sonnet-latest"],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
      ]
    },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

內建提供者預設值（金鑰 — 基本 URL — API 金鑰環境變數）：

| 供應商       | Base URL                                                  | API 金鑰環境變數      |
|--------------|-----------------------------------------------------------|----------------------|
| `alibaba`    | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`  | `ALIBABA_API_KEY`    |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (無) |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `openrouter` | `https://openrouter.ai/api/v1`                            | `OPENROUTER_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |

透過新增一個帶有 `baseUrl`（以及 `apiKeyEnv`，除非不需要金鑰）的新金鑰，來定義自訂的 OpenAI 相容提供者。模型 ID 是純粹的上游 ID — 提供者是在設定層級選擇的，因此不需要 `provider/` 前綴（OpenRouter ID 會保留其原生 `vendor/model` 形式）。

每個供應商都會回報 Token 用量；確切的美元成本僅在供應商回傳時才會顯示。`ai-i18n-tools check-models` 會根據目前作用中供應商的即時 `GET /models` 清單，驗證所有已設定的模型 ID（`translationModels`、`uiModels` 以及每個 `localeModels` 項目），並在供應商回傳時顯示定價。`ai-i18n-tools list-models` 會列出目前作用中供應商所提供的所有模型（使用 `-P` / `--provider` 來檢查另一個已設定的供應商）。`ai-i18n-tools bench-models` 會透過獨立翻譯一個範本，對每個不重複的已設定模型 ID（`translationModels`、`uiModels` 和 `localeModels`）進行基準測試（模型以並行方式執行，受 `concurrency` 限制），並印出每個模型的輸入/輸出 Token 數、實際耗時與美元成本。

如需單一文件上使用 `-P` 切換提供者的實作示範，請參閱 [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/)。

---

<a id="quick-start"></a>
## 快速開始

請先為裸指令設定您的 shell — 請參閱 [使用 CLI](#using-the-cli)。

<a id="ui-strings"></a>
### UI 字串

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
ai-i18n-tools init [-P <provider>]

# 2. Extract UI strings to strings.json
ai-i18n-tools extract

# 3. Translate to all target locales
ai-i18n-tools translate-ui
```

然後使用來自 `'ai-i18n-tools/runtime'` 的輔助工具將 i18next 連接到您的應用程式。有關完整設定，請參閱 UI 字串指南中的 [步驟 4：在執行時連接 i18next](../docs/guide/ui-strings/i18next-runtime.md)。

<a id="documents"></a>
### 文件

預設的 `init` 範本（`ui-markdown`）僅啟用 UI 提取。請在 `translate-docs` 之前使用以文件為導向的範本（或啟用 `features.translateDocs` 並新增 `docs[]`）：

```bash
# Docusaurus docs + optional write-translations catalog
ai-i18n-tools init -t ui-docusaurus [-P <provider>]

# Astro Starlight documentation
# ai-i18n-tools init -t ui-starlight [-P <provider>]

# VitePress documentation (pages + theme catalog)
# ai-i18n-tools init -t ui-vitepress [-P <provider>]

# Nextra documentation (pages + _meta.ts + theme dictionary)
# ai-i18n-tools init -t ui-nextra [-P <provider>]

# Fumadocs documentation (pages + meta.json + UI catalog)
# ai-i18n-tools init -t ui-fumadocs [-P <provider>]

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# ai-i18n-tools init -t ui-astro-website [-P <provider>]

ai-i18n-tools translate-docs
ai-i18n-tools status
# ai-i18n-tools translate-docs --locale de   # single locale
```

編輯 `ai-i18n-tools.config.json`：將 `docs[].contentPaths` 設定為 Markdown、MDX 及/或 `.astro` 原始檔；`docs[].outputDir` 與 `docs[].docsOutput.style`（`"docusaurus"`、`"astro-starlight"`、`"vitepress"`、`"nextra"`、`"fumadocs"`、`"flat"` 等）。完整欄位參考：[文件](../docs/guide/documents/)。

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` 會建立 `docsOutput.style: "vitepress"` 以及用於 nav/sidebar/footer 字串的 `docsOutput.vitepressThemeCatalog`。執行 `sync` 即可同時翻譯頁面 Markdown 與主題目錄 — 無需單獨的 JSON 管線。請參閱 [VitePress 整合](../docs/guide/integrations/vitepress.md) 與 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/)。

<a id="nextra"></a>
### Nextra

`init -t ui-nextra` 會建立 `docsOutput.style: "nextra"`。`translate-docs` 會自動收集並翻譯 `_meta.ts` 側邊欄標籤；設定 `docs[].nextraDictionaryPath` 可同時翻譯主題字典模組（例如 `app/_dictionaries/en.ts`）— 全部在同一個 `sync` 執行中完成，無需 JSON 附加檔案。請參閱 [Nextra 整合](../docs/guide/integrations/nextra.md) 與 [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/)。

<a id="fumadocs"></a>
### Fumadocs

`init -t ui-fumadocs` 會使用點號解析器（預設）或用於 Nextra 風格語系資料夾的目錄解析器來建立 `docsOutput.style: "fumadocs"`。`translate-docs` 會自動收集並翻譯 `meta.json` 側邊欄標籤；設定 `docsOutput.fumadocsUiCatalog` 可同時翻譯 `lib/layout.shared.ts` 中的 UI 覆寫 — 全部在同一個 `sync` 執行中完成，無需 JSON 附加檔案。請參閱 [Fumadocs 整合](../docs/guide/integrations/fumadocs.md) 與 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/)。

<a id="astro-plain-astro--starlight"></a>
### Astro（純 Astro 與 Starlight）

**Astro Starlight** — `init -t ui-starlight`，然後是 `translate-docs`。Starlight UI 覆寫可以在需要時使用 `src/content/i18n/en.json` 和 `jsonPathTemplate` 在單獨的 `docs[]` 區塊中 ([文件 — 初始化文件](../docs/guide/documents/index.md#step-1-initialise-for-documentation))。

**純 Astro**（行銷或應用程式網站，而非 Starlight）— 將 [Astro 內建 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 與 ai-i18n-tools 結合。參考專案：[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)（英文在 `/`，地區設定在 `/{locale}/`）。

大多數團隊使用兩種管道的**混合**：

| 管線               | 用於                                                              | 指令                   | 輸出                                                 |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **頁面 HTML**          | 標題、段落、導覽標籤、範本主體中的內嵌陣列 | `translate-docs`           | 每個地區設定的 `src/pages/{locale}/index.astro`            |
| **UI 字串 (`t()`)** | 前端資料、索引標籤、共用陣列 | `extract` → `translate-ui` | `public/locales/{locale}.json`（以英文來源為鍵） |

使用 `init -t ui-astro-website` 搭建 UI。對於 `.astro` 頁面中的硬編碼 HTML，請啟用 `features.translateDocs` 並添加一個帶有 `docs[]` 的 `docsOutput.style: "astro-starlight"` 區塊（請參閱 [Astro 網站頁面（解析和替換）](../docs/guide/ui-strings/astro-website.md#astro-website-pages-parse-and-replace))。保持 `targetLocales`、`i18n.locales` 在 `astro.config.mjs` 中，以及 `ui-languages.json` 對齊（Astro 路由使用小寫代碼，例如 `pt-br`；扁平捆綁檔案名遵循配置大小寫，例如 `pt-BR.json`）。

在建置時連接 `t()`，除非您添加客戶端島嶼，否則無需 i18next — 請參閱 [Astro 網站 UI 字串 (SSG)](../docs/guide/ui-strings/astro-website.md#astro-website-ui-strings-ssg) 和範例的 `src/i18n/t.ts`。

<a id="combined-sync"></a>
### 組合同步

```bash
ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
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
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

對於純 HTML 應用程式，使用裸 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 標記註釋元素（原始文字取自元素本身的 textContent / title / placeholder，寫入一次）；`mark-html` 會為您插入它們，然後 `extract` 將它們捕獲到 `strings.json` 中。請參閱 [標記 HTML 以進行翻譯](../docs/guide/ui-strings/plain-html.md#marking-html-for-translation)。

完整的各指令旗標列表請見 [CLI 參考](../docs/reference/cli-commands/)。執行 `ai-i18n-tools <command> --help` 以取得內建的使用說明文字。

全域選項：`-c <config>`（預設：`ai-i18n-tools.config.json`）、`-v`（詳細資訊）、`-P` / `--provider <name>`（覆寫作用中的 LLM 提供者；必須在 `providers` 下設定）、`-L` / `--ui-lang <code>`（工具自身 UI/日誌的語言）、`-V` / `--version`，以及 `-h` / `--help` — 每個指令皆可接受。`-w` / `--write-logs [path]` 會將主控台輸出同步至日誌檔案（預設：位於翻譯快取目錄下），但僅在翻譯與同步指令（`translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync-ui`、`sync`、`cleanup`）上生效。部分指令接受 `-l` / `--locale <codes>`（以逗號分隔的 BCP-47）以限制目標地區設定；`proofread-ui` 使用單一來源地區設定。請參閱 [CLI 參考](../docs/reference/cli-commands/) 以取得指令概覽。

<a id="tool-ui-language-logs-help-dashboard"></a>
### 工具 UI 語言（日誌、說明、儀表板）

此工具會獨立本地化其自身的 CLI 說明、日誌摘要與翻譯儀表板，不受您所翻譯的地區設定影響。預設情況下會遵循您的作業系統地區設定；可在設定中使用 `-L pt-BR`、`export AI_I18N_LANG=es` 或 `"uiLanguage"` 覆寫。請參閱[工具 UI 語言](../docs/guide/tool-ui-language.md)以了解地區設定解析、隨附語言與儀表板行為。

---

<a id="documentation"></a>
## 文件

- [文件網站](https://wsj-br.github.io/ai-i18n-tools/) — VitePress 指南（GitHub Pages 上有 9 種語言版本）；精簡的入口點，包含通往完整指南的連結。
- [快速開始](../docs/guide/quick-start.md) — 設定 UI 字串、文件和 JSON（UI、docs/`.astro`、JSON 套件、VitePress、Nextra、Fumadocs、Astro Starlight 和純 Astro）。
- [語系資產指南](../docs/guide/images-and-screenshots/) - 翻譯文件中的螢幕截圖和插圖 SVG（扁平連結重寫器、螢幕截圖腳本）。
- [架構](../docs/reference/architecture.md) - 架構、內部運作、程式化 API 和擴充點。
- [AI 代理上下文](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **針對使用該套件的應用程式：** 供下游專案使用的整合提示詞（複製到你的儲存庫的代理規則中）。
- **此**儲存庫的維護者指南：`AGENT.md`（規則與工作流程；僅限複製；不在 npm 上）。管線參考：`docs/reference/`。本地開發與發佈：`dev/DEVEL.md`。

---

<a id="license"></a>
## 授權

此專案根據 MIT 授權條款授權。 
詳情請參閱 [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) 檔案。

版權所有 &copy; 2026 Waldemar Scudeller Jr.
