---
layout: home
title: ai-i18n-tools
description: 使用 LLM 对 JavaScript/TypeScript 应用程序和文档站点进行国际化的 CLI 和工具包。
hero:
  name: ai-i18n-tools
  text: 使用任意 LLM 翻译应用和文档
  tagline: >-
    一个配置文件，三种翻译模式，以及您选择的提供商 —— OpenAI、Anthropic、Gemini、OpenRouter、Ollama 或任何兼容
    OpenAI 的 API。按项目或按区域设置切换模型，无需重写代码库。
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
    details: 从 JS、TS 和 Astro 中提取 t() 调用。为 i18next 或静态 SSG 查找生成每个区域设置的扁平化 JSON。
  - icon: 📄
    title: 文档
    details: >-
      翻译适用于 VitePress、Starlight、Docusaurus、Nextra、Fumadocs 和普通静态站点的 Markdown、MDX
      和 Astro 页面。
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
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## 快速安装

发布的包为**仅 ESM**。需要 Node.js `>=22.16.0`。

```bash
pnpm add ai-i18n-tools
# Set API key for your active provider — see preset table (default init: openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
ai-i18n-tools init [-P <provider>]
ai-i18n-tools sync
```

请参阅[安装](/zh-Hans/guide/installation)了解[配置裸 CLI 命令](/zh-Hans/guide/installation#using-the-cli)（包括[克隆的 monorepo 开发](/zh-Hans/guide/installation#cloned-monorepo)），并参阅[快速开始](/zh-Hans/guide/quick-start)获取脚手架模板。

<a id="which-pipeline-should-i-use"></a>
## 我应该使用哪个流水线？

| 你的内容 | 命令 |
| --- | --- |
| 源代码使用 `t()` | **UI 字符串** — `extract` / `translate-ui` |
| 本地化页面或文档站点 | **文档** — `translate-docs` |
| 独立的嵌套 JSON 语言环境文件 | **JSON** — `translate-json` |

SVG 插图使用单独的 `translate-svg` 路径 — 而不是 `docs[].contentPaths`。有关完整比较，请参阅[什么是 ai-i18n-tools？](/zh-Hans/guide/what-is-ai-i18n-tools)。

<a id="explore-the-documentation"></a>
## 探索文档

- [**指南**](/zh-Hans/guide/what-is-ai-i18n-tools) — 翻译模式、安装、快速入门和框架集成
- [**集成**](/zh-Hans/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus 和 Astro
- [**提供商和模型**](/zh-Hans/guide/providers-and-models) — 预设、回退链和 `-P` 覆盖
- [**CLI 参考**](/zh-Hans/reference/cli-commands/) — 每个命令、标志和工作流
- [**配置**](/zh-Hans/reference/configuration) — 完整 `ai-i18n-tools.config.json` 架构
- [**示例**](/zh-Hans/examples) — 九个可运行的演示项目及 `npx degit`
- [**架构**](/zh-Hans/reference/architecture) — 内部原理、程序化 API 和扩展点

要将该包集成到你自己的项目中？请从 [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) 开始。[仓库 README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) 是一个简短的 GitHub/npm 着陆页，链接到此处以获取详细信息。
