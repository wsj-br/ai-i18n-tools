---
layout: home
title: ai-i18n-tools
description: >-
  用於將 JavaScript/TypeScript 應用程式、Python 應用程式及說明文件網站進行國際化的 CLI 與工具組，支援您選擇的任何 LLM
  提供者。
hero:
  name: ai-i18n-tools
  text: 使用任何 LLM 翻譯應用程式與文件
  tagline: >-
    從 JavaScript、TypeScript 和 Python 中提取 t() 字串。翻譯 Markdown、MDX、HTML 頁面、JSON 套件與
    SVG 標籤 — 全部透過單一設定檔完成，並支援 OpenAI、Anthropic、Gemini、OpenRouter、Ollama 或任何相容
    OpenAI 的 API。無需重寫程式碼庫，即可針對不同專案或地區切換模型。
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools 標誌
  actions:
    - theme: brand
      text: 開始使用
      link: /zh-Hant/guide/quick-start
    - theme: alt
      text: 在 GitHub 上檢視
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: npm 套件
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: UI 字串
    details: >-
      從 JavaScript、TypeScript、Astro 和 Python 中提取 t() 與 _()，或從單一 HTML 檔案中的
      data-i18n 標記提取。支援每個地區對應一個扁平化 JSON，或 GNU gettext 目錄。
  - icon: 📄
    title: 文件
    details: >-
      翻譯適用於 VitePress、Starlight、Docusaurus、Nextra、Fumadocs 及純靜態網站的
      Markdown、MDX、Astro 和 HTML 頁面。
  - icon: 📦
    title: JSON 包
    details: 當 UI 文案位於原始碼 t() 呼叫之外時的巢狀語系 JSON — 主題標籤、目錄與應用程式覆寫。
  - icon: 🔄
    title: 智慧快取
    details: 跨每個管線共享的 SQLite 快取。重新執行時僅將新增或變更的段落傳送至模型。
  - icon: 🔌
    title: 供應商中立
    details: 內建主流 LLM API 的預設集，並支援自訂相容於 OpenAI 的端點。使用 -P 覆寫作用中的供應商。
  - icon: ⚡
    title: 一個同步指令
    details: >-
      從單一設定檔以正確順序執行 extract、translate-ui、translate-svg、translate-docs 與
      translate-json。
  - icon: 🐍
    title: Python，無需 Node.js
    details: >-
      每個 GitHub Release 上的獨立執行檔皆可執行適用於 Python 應用程式的 CLI。包含
      Streamlit、FastAPI、Flask、Django 與 gettext 支援。
  - icon: 📊
    title: 模型排名列表
    details: >-
      suggest-models 會對目前提供者的聊天模型進行排名，並可寫入 translationModels。相同的排名也會顯示在儀表板的
      Models 分頁中。
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## 快速安裝

發布的套件為 **僅限 ESM**。需要 Node.js `>=22.16.0`。

```bash
pnpm add ai-i18n-tools
# Set the API key for the provider you pass to init — see the preset table
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models
ai-i18n-tools sync
```

`suggest-models` 會對目前提供者的模型進行排名。新增 `--apply` 以取代預設的 `translationModels` 列表。請參閱 [快速入門](/zh-Hant/guide/quick-start) 與 [模型](/zh-Hant/guide/translation-dashboard/models) 分頁。

<a id="python-no-nodejs"></a>
### Python，無需 Node.js

下載對應的檔案，從 [GitHub 發行版](https://github.com/wsj-br/ai-i18n-tools/releases)：`ai-i18n-tools-linux-x64`、`ai-i18n-tools-linux-arm64`、`ai-i18n-tools-macos-arm64`、`ai-i18n-tools-macos-x64` 或 `ai-i18n-tools-win-x64.exe`。檢查 `SHA256SUMS.txt`，在 Unix 上執行 `chmod +x`，並將檔案放在 `PATH`。這些二進位檔未經簽署。步驟：[獨立可執行檔](/zh-Hant/guide/installation#standalone-executables)。然後 `ai-i18n-tools init -t ui-python -P cheaperinference`。逐步解說：[將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python)。

請參閱[安裝](/zh-Hant/guide/installation)以了解[設定無樣式的 CLI 命令](/zh-Hant/guide/installation#using-the-cli)（包括 [克隆 monorepo 開發](/zh-Hant/guide/installation#cloned-monorepo)）及[快速入門](/zh-Hant/guide/quick-start)以取得 Scaffold 範本。

<a id="which-pipeline-should-i-use"></a>
## 我應該使用哪個管線？

| 您的內容 | 指令 |
| --- | --- |
| 原始碼使用 `t()` 或 `_()` (JavaScript、TypeScript 或 Python)、gettext，或包含標記的單一 HTML 檔案 | **UI 字串** — `extract` / `translate-ui` |
| 當地語系化頁面、文件網站，或每個地區設定一個 HTML 檔案 | **文件** — `translate-docs` |
| 獨立的巢狀 JSON 語言檔 | **JSON** — `translate-json` |

SVG 插圖使用獨立的 `translate-svg` 路徑 — 而非 `docs[].contentPaths`。如需完整比較，請參閱[什麼是 ai-i18n-tools？](/zh-Hant/guide/what-is-ai-i18n-tools)。

<a id="explore-the-documentation"></a>
## 探索文件

- [**指南**](/zh-Hant/guide/what-is-ai-i18n-tools) — 翻譯模式、安裝、快速入門與框架整合
- [**整合**](/zh-Hant/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、Astro 與 Python
- [**提供者與模型**](/zh-Hant/guide/providers-and-models) — 預設設定、備援鏈、排名建議 (`suggest-models`) 與 `-P` 覆寫
- [**CLI 參考**](/zh-Hant/reference/cli-commands/) — 每個指令、旗標與工作流程
- [**設定**](/zh-Hant/reference/configuration) — 完整的 `ai-i18n-tools.config.json` 架構
- [**範例**](/zh-Hant/examples) — 十七個可執行的示範專案 (`npx degit`，或 Python 範例壓縮檔)
- [**架構**](/zh-Hant/reference/architecture) — 內部運作、程式化 API 與擴充點

要將套件整合到您自己的專案中嗎？請從 [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) 開始。[repository README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) 是一個簡短的 GitHub/npm 首頁，它會連結至此以取得詳細資訊。

<br/>
<br/>

::: tip 免責聲明
產品名稱與圖示均屬其各自擁有者所有，僅供識別之用。本軟體與上述品牌無任何關聯，亦未獲得其認可或背書。

除英語（英國）外，所有介面與文件語言皆使用本套件 (ai-i18n-tools) 由 AI 進行翻譯；譯文用詞可能不夠精確或含有錯誤。
:::

<br/>
