---
layout: home
title: ai-i18n-tools
description: 用于国际化 JavaScript/TypeScript 应用程序、Python 应用程序以及文档站点的 CLI 和工具包，支持您选择的任何 LLM 提供商。
hero:
  name: ai-i18n-tools
  text: 使用任意 LLM 翻译应用和文档
  tagline: >-
    从 JavaScript、TypeScript 和 Python 中提取 t() 字符串。翻译 Markdown、MDX、HTML 页面、JSON 包和
    SVG 标签——所有这些都通过一个配置完成，并支持 OpenAI、Anthropic、Gemini、OpenRouter、Ollama 或任何兼容
    OpenAI 的 API。无需重写代码库，即可按项目或按区域设置切换模型。
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools 标志
  actions:
    - theme: brand
      text: 开始使用
      link: /zh-Hans/guide/quick-start
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: npm 包
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: UI 字符串
    details: >-
      从 JavaScript、TypeScript、Astro 和 Python 中提取 t() 和 _()，或从单个 HTML 文件中提取
      data-i18n 标记。支持每个区域设置的扁平化 JSON 或 GNU gettext 目录。
  - icon: 📄
    title: 文档
    details: >-
      为 VitePress、Starlight、Docusaurus、Nextra、Fumadocs 以及普通静态站点翻译
      Markdown、MDX、Astro 和 HTML 页面。
  - icon: 📦
    title: JSON 包
    details: 当 UI 文案位于源代码 t() 调用之外时使用嵌套的区域设置 JSON —— 主题标签、目录和应用覆盖。
  - icon: 🔄
    title: 智能缓存
    details: 在每个流水线中共享 SQLite 缓存。重新运行时仅将新增或更改的片段发送给模型。
  - icon: 🔌
    title: 提供商无关
    details: 内置主流 LLM API 预设以及自定义兼容 OpenAI 的端点。使用 -P 覆盖当前活动的提供商。
  - icon: ⚡
    title: 一个同步命令
    details: >-
      根据单一配置按正确顺序运行 extract、translate-ui、translate-svg、translate-docs 和
      translate-json。
  - icon: 🐍
    title: Python，无需 Node.js
    details: >-
      GitHub Release 上的每个独立可执行文件均可运行适用于 Python 应用程序的 CLI。包含对
      Streamlit、FastAPI、Flask、Django 和 gettext 的支持。
  - icon: 📊
    title: 模型排名列表
    details: >-
      suggest-models 会对当前提供商的聊天模型进行排名，并可写入
      translationModels。相同的排名也会显示在仪表板的“模型”选项卡中。
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## 快速安装

发布的包为**仅 ESM**。需要 Node.js `>=22.16.0`。

```bash
pnpm add ai-i18n-tools
# Set the API key for the provider you pass to init — see the preset table
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models
ai-i18n-tools sync
```

`suggest-models` 会对当前提供商的模型进行排名。添加 `--apply` 以替换脚手架生成的 `translationModels` 列表。请参阅 [快速入门](/zh-Hans/guide/quick-start) 和 [模型](/zh-Hans/guide/translation-dashboard/models) 选项卡。

<a id="python-no-nodejs"></a>
### Python，无需 Node.js

从 [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases) 下载对应的文件：`ai-i18n-tools-linux-x64`、`ai-i18n-tools-linux-arm64`、`ai-i18n-tools-macos-arm64`、`ai-i18n-tools-macos-x64` 或 `ai-i18n-tools-win-x64.exe`。检查 `SHA256SUMS.txt`，在 Unix 上运行 `chmod +x`，并将文件放在 `PATH`。这些二进制文件未签名。步骤：[独立可执行文件](/zh-Hans/guide/installation#standalone-executables)。然后 `ai-i18n-tools init -t ui-python -P cheaperinference`。演练：[为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)。

请参阅[安装](/zh-Hans/guide/installation)了解[配置裸 CLI 命令](/zh-Hans/guide/installation#using-the-cli)（包括[克隆的 monorepo 开发](/zh-Hans/guide/installation#cloned-monorepo)），并参阅[快速开始](/zh-Hans/guide/quick-start)获取脚手架模板。

<a id="which-pipeline-should-i-use"></a>
## 我应该使用哪个流水线？

| 您的内容 | 命令 |
| --- | --- |
| 源代码使用 `t()` 或 `_()`（JavaScript、TypeScript 或 Python）、gettext 或带有标记的单个 HTML 文件 | **UI 字符串** — `extract` / `translate-ui` |
| 本地化页面、文档站点或每个语言区域一个 HTML 文件 | **文档** — `translate-docs` |
| 独立的嵌套 JSON 语言环境文件 | **JSON** — `translate-json` |

SVG 插图使用单独的 `translate-svg` 路径 — 而不是 `docs[].contentPaths`。有关完整比较，请参阅[什么是 ai-i18n-tools？](/zh-Hans/guide/what-is-ai-i18n-tools)。

<a id="explore-the-documentation"></a>
## 探索文档

- [**指南**](/zh-Hans/guide/what-is-ai-i18n-tools) — 翻译模式、安装、快速入门和框架集成
- [**集成**](/zh-Hans/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、Astro 和 Python
- [**提供商与模型**](/zh-Hans/guide/providers-and-models) — 预设、回退链、排名建议 (`suggest-models`) 和 `-P` 覆盖
- [**CLI 参考**](/zh-Hans/reference/cli-commands/) — 每个命令、标志和工作流程
- [**配置**](/zh-Hans/reference/configuration) — 完整的 `ai-i18n-tools.config.json` 架构
- [**示例**](/zh-Hans/examples) — 十七个可运行的演示项目 (`npx degit` 或 Python 示例压缩包)
- [**架构**](/zh-Hans/reference/architecture) — 内部原理、编程 API 和扩展点

要将该包集成到你自己的项目中？请从 [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) 开始。[仓库 README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) 是一个简短的 GitHub/npm 着陆页，链接到此处以获取详细信息。

<br/>
<br/>

::: tip 免责声明
产品名称和图标归其各自所有者所有，仅用于标识目的。本软件与这些品牌无任何关联，也未获得其认可。

除英语（英国）外，所有界面和文档语言均使用此软件包 (ai-i18n-tools) 通过 AI 翻译；措辞可能不够精确或存在错误。
:::

<br/>
