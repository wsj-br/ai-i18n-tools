---
layout: home
title: ai-i18n-tools
description: 使用 LLM 將 JavaScript/TypeScript 應用程式與文件網站國際化的 CLI 與工具包。
hero:
  name: ai-i18n-tools
  text: 使用任何 LLM 翻譯應用程式與文件
  tagline: >-
    一個設定檔、三種翻譯模式，以及您選擇的供應商 — OpenAI、Anthropic、Gemini、OpenRouter、Ollama 或任何相容於
    OpenAI 的 API。無需重寫程式碼庫即可按專案或語系切換模型。
  image:
    src: /logo.svg
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
    details: 從 JS、TS 與 Astro 中提取 t() 呼叫。為 i18next 或靜態 SSG 查詢產生各語系的扁平化 JSON。
  - icon: 📄
    title: 文件
    details: >-
      翻譯適用於 VitePress、Starlight、Docusaurus、Nextra、Fumadocs 與純靜態網站的 Markdown、MDX
      與 Astro 頁面。
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
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## 快速安裝

發布的套件為 **僅限 ESM**。需要 Node.js `>=22.16.0`。

```bash
pnpm add ai-i18n-tools
# Set API key for your active provider — see preset table (default init: openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
ai-i18n-tools init [-P <provider>]
ai-i18n-tools sync
```

請參閱[安裝](/zh-Hant/guide/installation)以了解[設定無樣式的 CLI 命令](/zh-Hant/guide/installation#using-the-cli)（包括 [克隆 monorepo 開發](/zh-Hant/guide/installation#cloned-monorepo)）及[快速入門](/zh-Hant/guide/quick-start)以取得 Scaffold 範本。

<a id="which-pipeline-should-i-use"></a>
## 我應該使用哪個管線？

| 您的內容 | 指令 |
| --- | --- |
| 原始碼使用 `t()` | **UI 字串** — `extract` / `translate-ui` |
| 本地化頁面或文件網站 | **文件** — `translate-docs` |
| 獨立的巢狀 JSON 語言檔 | **JSON** — `translate-json` |

SVG 插圖使用獨立的 `translate-svg` 路徑 — 而非 `docs[].contentPaths`。如需完整比較，請參閱[什麼是 ai-i18n-tools？](/zh-Hant/guide/what-is-ai-i18n-tools)。

<a id="explore-the-documentation"></a>
## 探索文件

- [**指南**](/zh-Hant/guide/what-is-ai-i18n-tools) — 翻譯模式、安裝、快速入門與框架整合
- [**整合**](/zh-Hant/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus 與 Astro
- [**供應商與模型**](/zh-Hant/guide/providers-and-models) — 預設、後備鏈與 `-P` 覆寫
- [**CLI 參考**](/zh-Hant/reference/cli-commands/) — 每個指令、旗標與工作流程
- [**設定**](/zh-Hant/reference/configuration) — 完整 `ai-i18n-tools.config.json` 結構描述
- [**範例**](/zh-Hant/examples) — 九個可執行的示範專案，附 `npx degit`
- [**架構**](/zh-Hant/reference/architecture) — 內部原理、程式化 API 與擴充點

如需完整的 npm 風格指南（供應商表格、CLI 指令列表、框架快速入門），請參閱[儲存庫 README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md)。要將套件整合到您自己的專案中嗎？請從 [AI Agent 上下文](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) 開始。
