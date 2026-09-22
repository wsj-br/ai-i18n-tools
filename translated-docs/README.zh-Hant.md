<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**使用您選擇的 AI 模型翻譯您的應用程式與文件 — 無供應商綁定，無需重寫。**

CLI 與工具套件，用於將 JavaScript/TypeScript 應用程式及文件網站國際化。擷取 `t()` 字串，翻譯 Markdown/MDX 頁面、JSON 套件與 SVG 標籤——全部透過單一設定檔完成，並內建 OpenAI、Anthropic、Gemini、OpenRouter、Ollama 及任何相容 OpenAI 之 API 的預設配置。可依專案或地區設定切換供應商或模型，無需變更您的程式碼庫。

適用於 VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro 及純 Markdown。保留您現有的 [i18next](https://www.i18next.com/) 目錄（命名空間 JSON 或 `t()` 來源字串），並使用 `migrate-intlayer` 遷移 [Intlayer](https://intlayer.org/) 專案。

<a id="features"></a>
## 功能

| | |
| --- | --- |
| **UI 字串** | 從 JS/TS/Astro（以及 HTML 中的 `data-i18n*`）提取 `t("…")` → 扁平化的按語言環境 JSON |
| **文件** | 為主要文件框架翻譯 Markdown、MDX 與 `.astro` 頁面 |
| **JSON** | 當文案位於 `t()` 呼叫之外時，翻譯巢狀的語言環境套件 |
| **SVG** | 透過 `translate-svg` 翻譯插圖式 SVG 標籤 |
| **智慧快取** | 共享的 SQLite 快取 — 僅有新增或變更的段落會呼叫模型 |
| **單一 `sync`** | 透過單一設定檔按正確順序執行提取 → UI → SVG → 文件 → JSON |

<a id="which-pipeline"></a>
## 哪個管線？

| 您的內容 | 指令 |
| --- | --- |
| 原始碼使用 `t()` 或 HTML 標記 | **UI 字串** — `extract` / `translate-ui` |
| 本地化頁面或文件網站 | **文件** — `translate-docs` |
| 獨立的巢狀 JSON 語言檔 | **JSON** — `translate-json` |

請參閱 [什麼是 ai-i18n-tools？](../docs/guide/what-is-ai-i18n-tools.md) 以取得完整比較。

<a id="install"></a>
## 安裝

僅支援 ESM。需要 Node.js `>=22.16.0`。

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

為您的供應商設定 API 金鑰（預設 `init` 使用 OpenRouter；Ollama 不需要）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

設定純 `ai-i18n-tools` 指令（direnv、PATH、`package.json` 腳本或 `npx`） — 請參閱[安裝](../docs/guide/installation.md)。

<a id="quick-start"></a>
## 快速開始

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

以文件為導向的框架模板：`-t ui-docusaurus`、`ui-starlight`、`ui-vitepress`、`ui-nextra`、`ui-fumadocs`、`ui-astro-website` 或 `ui-json-bundles`。

優先使用 `sync` 而非串接個別的翻譯指令。完整演練：[快速開始](../docs/guide/quick-start.md)。

<a id="documentation"></a>
## 文件

- [文件網站](https://wsj-br.github.io/ai-i18n-tools/) — 指南、整合與參考資料
- [安裝](../docs/guide/installation.md) · [快速入門](../docs/guide/quick-start.md) · [供應商與模型](../docs/guide/providers-and-models.md)
- [UI 字串](../docs/guide/ui-strings/) · [文件](../docs/guide/documents/) · [JSON](../docs/guide/json.md) · [SVG](../docs/guide/svg-translation/)
- [整合](../docs/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、Astro
- [CLI 參考](../docs/reference/cli-commands/) · [設定](../docs/reference/configuration.md) · [執行階段輔助函式](../docs/guide/runtime-helpers.md)
- [範例](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) — 可執行的示範 (`npx degit …`)
- [AI 代理上下文](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — 消費者儲存庫中助理的整合指南

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
