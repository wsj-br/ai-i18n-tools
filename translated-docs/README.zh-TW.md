<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm 版本](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm 下載次數](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![授權許可：MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

透過 [OpenRouter](https://openrouter.ai/) 使用大型語言模型來國際化 JavaScript/TypeScript 應用程式與文件網站的 CLI 與工具包。提供兩種獨立的工作流程：**UI 翻譯** 提取 `t("…")` 呼叫並為 i18next 生成符合語系格式的 JSON；**文件翻譯** 則可翻譯 Markdown、MDX 和 SVG 檔案，並搭配智慧型 SQLite 快取，僅將變更的段落重新傳送給 LLM。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<small>已翻譯的 README 和文件已提交至 GitHub 上的 [`translated-docs/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)；npm 套件僅提供英文 `docs/`。</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [兩個核心工作流程](#two-core-workflows)
- [安裝](#installation)
  - [使用 CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [快速開始](#quick-start)
  - [工作流程 1 - UI 翻譯](#workflow-1---ui-translation)
  - [工作流程 2 - 文件翻譯](#workflow-2---document-translation)
  - [兩個工作流程](#both-workflows)
- [執行階段輔助工具](#runtime-helpers)
- [CLI 指令](#cli-commands)
- [文件](#documentation)
- [授權](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## 兩個核心工作流程

**工作流程 1 - UI 翻譯** — 適用於任何使用 i18next 的 JS/TS 專案（React、Next.js、Node.js、CLI）

掃描原始碼檔案中的 `t("…")` / `i18n.t("…")` 字面值，建立主目錄（`strings.json`），透過 OpenRouter 按語系翻譯缺失的條目，並輸出扁平化的 JSON 檔案（`de.json`、`pt-BR.json` 等），可直接供 i18next 使用。

**工作流程 2 - 文件翻譯** — 適用於 markdown/MDX 文件（Docusaurus、Astro Starlight、純 README 檔案）以及 `.astro` 頁面 HTML（純 Astro 行銷網站）

將 `.md`、`.mdx` 和 `.astro` 原始檔翻譯成所有目標語系，並共用 SQLite 快取 — 僅有新增或變更的段落會傳送至 LLM。可選的 Docusaurus 外殼 JSON（`jsonSource`，來自 `write-translations`）涵蓋導覽列、頁尾與主題 UI 字串。SVG 檔案翻譯可透過 `features.translateSVG` 和頂層的 `svg` 區塊啟用。針對純 Astro 網站，請參閱 [`examples/astro-website`](../examples/astro-website/)（混合模式：`translate-docs` 用於頁面 HTML，`t()` 用於前置資料字串）。

兩個工作流程共用單一的 `ai-i18n-tools.config.json` 檔案，可獨立或同時使用。

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
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

**一次性零安裝** — 使用 `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（僅在當次執行時下載）。

> **提示：** 若要在互動式殼層中直接執行 `ai-i18n-tools` 而不使用 `npx`，請將 `node_modules/.bin` 加入您的 `PATH`（bash/zsh：`export PATH="$PWD/node_modules/.bin:$PATH"`）。詳見 [快速開始](docs/GETTING_STARTED.zh-TW.md#installation) 中關於 direnv 與 Windows 的說明。

設定您的 OpenRouter API 金鑰：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

呼叫 OpenRouter 的指令（`translate-ui`、`translate-docs`、`sync`、`check-models` 及相關腳本）需要在環境中設定 `OPENROUTER_API_KEY`。`check-markdown` 不使用 OpenRouter。

在 `ai-i18n-tools.config.json` 中，`openrouter` 物件包含模型列表、`baseUrl`、`maxTokens`、`temperature` 以及 `requestTimeoutMs`：表示對 OpenRouter 的每個 HTTP 請求（聊天完成和內部 `GET /models` 呼叫）等待的最長時間（毫秒）。預設值為 `30000`（30 秒）。

執行 `ai-i18n-tools check-models` 以根據 OpenRouter 的即時目錄驗證每個已設定的模型 ID。此命令會報告遺失或已過期的 ID `expiration_date`，列出有效模型及其估計的輸入/輸出價格（每百萬 tokens 的美元價格），並在任何已設定的 ID 無效時以非零狀態碼結束。此操作需要 `OPENROUTER_API_KEY`。

---

<a id="quick-start"></a>
## 快速開始

<a id="workflow-1---ui-translation"></a>
### 工作流程 1 - UI 翻譯

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

接著在您的應用程式中使用來自 `'ai-i18n-tools/runtime'` 的輔助工具來整合 i18next。完整設定請參閱「快速開始」指南中的 [步驟 4：在執行階段整合 i18next](docs/GETTING_STARTED.zh-TW.md#step-4-wire-i18next-at-runtime)。

<a id="workflow-2---document-translation"></a>
### 工作流程 2 - 文件翻譯

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website (UI + optional page HTML): npx ai-i18n-tools init -t ui-astro-website

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### 兩種工作流程

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## 執行階段輔助工具

以下輔助函數從 `'ai-i18n-tools/runtime'` 匯出，可在任何 JavaScript 環境中使用。您不需要匯入 i18next 即可使用它們：

| Helper                                                                 | 說明                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | 用於鍵值作為預設值設定的標準 i18next 初始化選項。                                                                               |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 建議的串接方式：從 `strings.json` 取得 key-trim + 複數 `wrapT`，可選擇性合併 `translate-ui` `{sourceLocale}.json` 的複數鍵。 |
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
ai-i18n-tools help [command]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]
ai-i18n-tools check-models
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools lint-source …
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status [--max-columns <n>]
ai-i18n-tools statistics [--max-columns <n>]
ai-i18n-tools dashboard
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]
ai-i18n-tools glossary-generate
```

各指令的完整參數列表請見 [快速開始 — CLI 參考](docs/GETTING_STARTED.zh-TW.md#cli-reference)。執行 `ai-i18n-tools <command> --help` 可查看內建的使用說明文字。

每個指令皆支援的全域選項：`-c <config>`（預設值：`ai-i18n-tools.config.json`）、`-v`（詳細輸出）、選擇性使用 `-w` / `--write-logs [path]` 將主控台輸出同時寫入日誌檔案（預設儲存於翻譯快取目錄下）、`-V` / `--version`，以及 `-h` / `--help`。指令總覽表請見[開始使用](docs/GETTING_STARTED.zh-TW.md#cli-reference)。

---

<a id="documentation"></a>
## 文件

- [快速開始](docs/GETTING_STARTED.zh-TW.md) - 兩種工作流程的完整設定指南、CLI 參考與設定欄位說明。
- [語系資源指南](docs/LOCALE-ASSETS-GUIDE.zh-TW.md) - 在翻譯文件中使用截圖與向量圖（模式 A–E、扁平連結重寫器、截圖指令碼）。
- [套件概覽](docs/PACKAGE_OVERVIEW.zh-TW.md) - 架構、內部機制、程式化 API 與擴充點。
- [AI Agent 情境設定](../docs/ai-i18n-tools-context.md) - **針對使用此套件的應用：** 下游專案的整合提示（可複製到您倉儲的 agent 規則中）。
- **本** 倉儲的維護者內部使用：`dev/package-context.md`（僅限克隆；未發布至 npm）。

---

<a id="license"></a>
## 授權條款

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
