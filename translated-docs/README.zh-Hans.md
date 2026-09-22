<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**使用你选择的 AI 模型翻译你的应用和文档 — 无锁定，无需重写。**

用于国际化 JavaScript/TypeScript 应用和文档站点的 CLI 和工具包。提取 `t()` 字符串，翻译 Markdown/MDX 页面、JSON 资源包和 SVG 标签——所有操作只需一份配置，并内置 OpenAI、Anthropic、Gemini、OpenRouter、Ollama 及任何兼容 OpenAI 的 API 的预设。无需更改代码库，即可按项目或按区域设置切换提供商或模型。

支持 [VitePress](https://vitepress.dev/)、[Starlight](https://starlight.astro.build/)、[Docusaurus](https://docusaurus.io/)、[Nextra](https://nextra.site/)、[Fumadocs](https://www.fumadocs.dev/)、[Astro](https://astro.build/) 以及纯 [Markdown](https://commonmark.org/)。保留您现有的 [i18next](https://www.i18next.com/) 词典（命名空间 JSON 或 `t()` 源字符串），并使用 `migrate-intlayer` 迁移 [Intlayer](https://intlayer.org/) 项目。

<a id="features"></a>
## 功能

| | |
| --- | --- |
| **UI 字符串** | 从 JS/TS/Astro（以及 HTML 中的 `data-i18n*`）提取 `t("…")` → 扁平化的按区域设置 JSON |
| **文档** | 为主要文档框架翻译 Markdown、MDX 和 `.astro` 页面 |
| **JSON** | 当文案位于 `t()` 调用之外时翻译嵌套的区域设置包 |
| **SVG** | 通过 `translate-svg` 翻译带插图的 SVG 标签 |
| **智能缓存** | 共享 SQLite 缓存 — 只有新增或更改的片段会发送给模型 |
| **单个 `sync`** | 从一个配置中按正确顺序运行提取 → UI → SVG → 文档 → JSON |

<a id="which-pipeline"></a>
## 哪种流水线？

| 你的内容 | 命令 |
| --- | --- |
| 源码使用 `t()` 或 HTML 标记 | **UI 字符串** — `extract` / `translate-ui` |
| 本地化页面或文档站点 | **文档** — `translate-docs` |
| 独立的嵌套 JSON 语言环境文件 | **JSON** — `translate-json` |
| 带有 SVG 标签的图表或插图 | **SVG** — `translate-svg` |

请参阅[什么是 ai-i18n-tools？](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/what-is-ai-i18n-tools) 以了解完整对比。

<a id="install"></a>
## 安装

仅支持 ESM。需要 Node.js `>=22.16.0`。

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

为你的提供商设置 API 密钥（默认 `init` 使用 OpenRouter；Ollama 不需要）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

配置 `ai-i18n-tools` 基础命令（direnv、PATH、`package.json` 脚本或 `npx`）——请参阅[安装](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/installation)。

<a id="quick-start"></a>
## 快速开始

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

面向文档的脚手架：`-t ui-docusaurus`、`ui-starlight`、`ui-vitepress`、`ui-nextra`、`ui-fumadocs`、`ui-astro-website` 或 `ui-json-bundles`。

建议优先使用 `sync`，而非串联单个翻译命令。完整教程：[快速入门](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/quick-start)。

<a id="documentation"></a>
## 文档

- [文档站点](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/) —— 指南、集成与参考
- [安装](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/installation) · [快速入门](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/quick-start) · [提供商与模型](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/providers-and-models)
- [UI 字符串](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/ui-strings/) · [文档](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/documents/) · [JSON](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/svg-translation/)
- [集成](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/integrations/) —— VitePress、Nextra、Fumadocs、Docusaurus、Astro
- [CLI 参考](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/reference/cli-commands/) · [配置](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/reference/configuration) · [运行时辅助工具](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/runtime-helpers)
- [示例](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/examples) —— 可运行演示 (`npx degit …`)
- [AI 智能体上下文](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) —— 使用方代码库中助手的集成指南

<a id="contributing"></a>
## 贡献

欢迎提交 Issue 和拉取请求。此仓库的维护者工作流：[`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) 和 [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md)。

<a id="license"></a>
## 许可证

MIT — 请参阅 [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)。

版权所有 © 2026 Waldemar Scudeller Jr.

<br/>

产品名称和图标归其各自所有者所有，仅用于标识目的。本软件与这些品牌无关联，也未获得其认可。

<small>

> **关于界面和文档翻译的说明：** 除英语（英国）外，所有界面和文档语言均使用本工具包（ai-i18n-tools）由 AI 翻译完成；措辞可能不够精确或存在错误。

</small>
