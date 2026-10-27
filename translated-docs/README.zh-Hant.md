<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

**在任何 LLM 供應商上，使用您選擇的模型來翻譯您的應用程式、網站和文件。單一設定，快取重新執行。**

為 JavaScript/TypeScript 應用程式、Python 應用程式和文件網站新增語言的 CLI 和工具包。您開始使用的語言是 `sourceLocale`，它可以是任何語言。它會尋找文字、翻譯文字，並寫入您的專案載入的檔案。內建預設涵蓋 OpenAI、Anthropic、Gemini、OpenRouter、Ollama 以及任何與 OpenAI 相容的 API。每個專案或每個地區設定都可以切換供應商或模型。

適用於 [VitePress](https://vitepress.dev/)、[Starlight](https://starlight.astro.build/)、[Docusaurus](https://docusaurus.io/)、[Nextra](https://nextra.site/)、[Fumadocs](https://www.fumadocs.dev/)、[Astro](https://astro.build/)、[純 Markdown](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-readme) (儲存庫 README 和其他 `.md` 檔案) 和純 HTML。Python 應用程式使用 `t()` / `_()` 或 GNU gettext (Streamlit、FastAPI、Flask、Django 和桌面工具包)。保留您現有的 [i18next](https://www.i18next.com/) 目錄 (命名空間 JSON 或 `t()` 原始字串)。與 [Intlayer](https://intlayer.org/) 合作有兩種方式：保留 Intlayer 並使用 `translate-intlayer` 填充其字典，或使用 `migrate-intlayer` 移至原始字串 `t()` 呼叫。Intlayer 仍然非常適合類型化內容字典和翻譯管理系統。

<a id="features"></a>
## 功能

| | |
| --- | --- |
| **UI 字串** | 從 JS/TS/Astro 和 Python 提取 `t("…")` / `_()`，或在單一 HTML 檔案中提取 `data-i18n*` → 轉換為每個地區的平面 JSON 或 GNU gettext |
| **文件** | 翻譯 Markdown、MDX、`.astro` 與 HTML 頁面（每個地區設定一個檔案） |
| **JSON** | 當文案位於 `t()` 呼叫之外時，翻譯巢狀的語言環境套件 |
| **SVG** | 透過 `translate-svg` 翻譯插圖式 SVG 標籤 |
| **智慧快取** | 共享的 SQLite 快取 — 僅有新增或變更的段落會呼叫模型 |
| **單一 `sync`** | 透過單一設定檔按正確順序執行提取 → UI → SVG → 文件 → JSON |
| **Python** | 每個 GitHub Release 上的獨立執行檔 — CLI 執行時無需安裝 Node.js |
| **排名模型** | `suggest-models` 會對當前供應商的聊天模型進行排名，並可編寫 `translationModels` |

<a id="where-do-i-start"></a>
## 我該從何開始？

| 您有 | 從這裡開始 |
| --- | --- |
| 具有原始碼中純文字的 JS/TS 應用程式 (React、Next.js、Node、CLI) | [為 JS/TS 應用程式新增 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-js) |
| Python 應用程式 (Streamlit、FastAPI、Flask、Django、gettext) | [為 Python 應用程式新增 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-python) |
| 網站或文件網站 (VitePress、Docusaurus、Starlight、Nextra、Fumadocs、Astro、純 HTML) | [為網站或文件網站新增 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-website) |
| 儲存庫 README 和其他 Markdown 檔案 (無論有無應用程式) | [為您的 README 和 Markdown 文件新增 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-readme) |
| 已呼叫 `t()` 或 `_()` 的程式碼 | [UI 字串](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/ui-strings/) |
| 獨立巢狀 JSON 地區設定檔案 | [JSON](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/json) |
| 帶有文字標籤的 SVG 圖表 | [SVG 翻譯](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/svg-translation/) |
| Intlayer 字典 (保留 Intlayer，或移至原始字串呼叫) | [就地翻譯 Intlayer](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/translating-intlayer) · [從 Intlayer 遷移到原始字串呼叫](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/migrating-from-intlayer) |

請參閱 [什麼是 ai-i18n-tools？](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/what-is-ai-i18n-tools) 以了解管道如何協同運作。

<a id="install"></a>
## 安裝

僅支援 ESM。需要 Node.js `>=22.16.0`。

```bash
pnpm add -D ai-i18n-tools
# or: npm install --save-dev ai-i18n-tools
```

設定您傳遞給 `init` 的提供者的 API 金鑰 (Ollama 無需此項)：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

設定原生 `ai-i18n-tools` 指令（direnv、PATH、`package.json` 指令碼或 `npx`）— 請參閱[安裝](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/installation)。

<a id="python-no-nodejs"></a>
### Python，無需 Node.js

Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安裝程式會為這台機器選擇可執行檔，檢查 `SHA256SUMS.txt`，將命令安裝為 `ai-i18n-tools`，並將其新增至 `PATH`。二進位檔未經公證或 Authenticode 簽署。手動下載步驟：[獨立可執行檔](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/installation#standalone-executables)。

四個 Python 範例位於儲存庫中以及發行版中的 `ai-i18n-tools-python-examples.zip`。它們不在 npm tarball 或可執行檔中。

<a id="quick-start"></a>
## 快速開始

為您擁有的內容搭建設定，然後按照您的路徑指南進行操作：

| 您有 | 搭建 | 然後遵循 |
| --- | --- | --- |
| JS/TS 應用程式 | `ai-i18n-tools init -P openrouter` | [為 JS/TS 應用程式新增 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-js) |
| Python 應用程式 | `ai-i18n-tools init -t ui-python -P openrouter` | [為 Python 應用程式新增 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-python) |
| 網站或文件網站 | `ai-i18n-tools init -t ui-vitepress -P openrouter` (為您的框架交換範本) | [為網站或文件網站新增 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-website) |
| README，無論有無應用程式 | `ai-i18n-tools init -P openrouter` (JS/TS 應用程式 + README) 或 `init -t docs-markdown` | [為您的 README 和 Markdown 文件新增 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-readme) |

當專案準備就緒時，執行 `ai-i18n-tools sync`，然後執行 `ai-i18n-tools status` 以查看翻譯了什麼。

JS/TS 應用程式必須先將其文字包裝在 `t()` 中。在純文字上執行時，`sync` 會在沒有錯誤的情況下完成，並且不會寫入任何有用的內容。您的網站框架也必須在 `sync` 之前啟用其自身的 i18n 路由。

網站範本：`ui-starlight`、`ui-docusaurus`、`ui-vitepress`、`ui-nextra`、`ui-fumadocs`、`ui-astro-website`，以及 `ui-plain-html` 或 `docs-plain-html`。僅限 README 和 Markdown：`docs-markdown`。將 `--with-readme` 新增到任何其他範本以包含 README 區塊。其他 Python 範本：`ui-python-gettext`、`ui-python-flask`、`ui-python-django`。巢狀 i18next JSON：`ui-json-bundles`。完整清單：[CLI 設定參考](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/reference/cli-commands/setup)。

`suggest-models` 會根據已發布的基準測試，對目前作用中供應商的聊天模型進行排名，而 `suggest-models --apply` 會取代 `translationModels`。相同的排名位於 [模型](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/translation-dashboard/models) 分頁上。指南：[AI 模型](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/ai-models)。指令參考：[suggest-models](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/reference/cli-commands/models#suggest-models)。

優先使用 `sync` 而非串聯個別的翻譯命令。完整逐步解說：[快速入門](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/quick-start)。在一個專案中有多種類型的內容：[組合管線](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/combining-pipelines)。

<a id="documentation"></a>
## 文件

- [說明文件網站](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/) — 指南、整合與參考
- [安裝](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/installation) · [快速入門](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/quick-start) · [LLM 供應商](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/providers-and-models) · [AI 模型](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/ai-models)
- [UI 字串](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/ui-strings/) · [純 HTML](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/ui-strings/python) · [文件](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/documents/) · [HTML 頁面](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/svg-translation/)
- [Intlayer](https://intlayer.org/) — [就地翻譯字典](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/translating-intlayer) · [移至來源字串呼叫](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/migrating-from-intlayer)
- [整合](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、Astro，以及 [Python](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/integrations/python)
- [為您的專案新增 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-your-project) — [JS/TS 應用程式](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-js) · [Python 應用程式](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-python) · [網站或文件網站](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-website) · [README 和 Markdown 文件](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/add-i18n-to-readme) · [組合管線](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/combining-pipelines)
- [CLI 參考](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/reference/cli-commands/) · [組態](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/reference/configuration) · [執行階段協助程式](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/guide/runtime-helpers)
- [範例](https://wsj-br.github.io/ai-i18n-tools/zh-Hant/examples) — 可執行的示範 (`npx degit …`)
- [AI 代理程式內容](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — 消費者儲存庫中助理的整合指南

<a id="contributing"></a>
## 貢獻

歡迎提交問題與拉取請求。本儲存庫的維護者工作流程：[`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) 與 [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md)。

<a id="license"></a>
## 授權條款

MIT — 請參閱 [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)。

Copyright © 2026 Waldemar Scudeller Jr.

<br/>

產品名稱與圖示歸其各自擁有者所有，僅供識別之用。本軟體與這些品牌無任何關聯，亦未獲得其背書。

<small>

> **使用者介面與說明文件翻譯注意事項：** 除英文（英國）外，所有介面與說明文件語言皆使用本套件 (ai-i18n-tools) 透過 AI 進行翻譯；用詞可能未盡精確或含有錯誤。

</small>
