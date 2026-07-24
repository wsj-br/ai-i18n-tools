<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**使用你选择的 AI 模型翻译你的应用和文档 — 无锁定，无需重写。**

用于国际化 JavaScript/TypeScript 应用和文档站点（VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro、纯 Markdown/MDX）的 CLI 和工具包。使用 OpenAI、Anthropic、Gemini、OpenRouter、Ollama 等内置预设 — 或任何兼容 OpenAI 的 API。无需更改代码库即可按项目或按区域设置切换提供商或模型。

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

查看 [什么是 ai-i18n-tools？](../docs/guide/what-is-ai-i18n-tools.md) 获取完整比较。

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

配置纯 `ai-i18n-tools` 命令（direnv、PATH、`package.json` 脚本或 `npx`） — 请参阅[安装](../docs/guide/installation.md)。

<a id="quick-start"></a>
## 快速开始

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

面向文档的脚手架：`-t ui-docusaurus`、`ui-starlight`、`ui-vitepress`、`ui-nextra`、`ui-fumadocs`、`ui-astro-website` 或 `ui-json-bundles`。

优先使用 `sync` 而不是链式调用单个翻译命令。完整演练：[快速开始](../docs/guide/quick-start.md)。

<a id="documentation"></a>
## 文档

- [文档站点](https://wsj-br.github.io/ai-i18n-tools/) — 指南、集成和参考
- [安装](../docs/guide/installation.md) · [快速开始](../docs/guide/quick-start.md) · [提供商和模型](../docs/guide/providers-and-models.md)
- [UI 字符串](../docs/guide/ui-strings/) · [文档](../docs/guide/documents/) · [JSON](../docs/guide/json.md) · [SVG](../docs/guide/svg-translation/)
- [集成](../docs/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、Astro
- [CLI 参考](../docs/reference/cli-commands/) · [配置](../docs/reference/configuration.md) · [运行时辅助工具](../docs/guide/runtime-helpers.md)
- [示例](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) — 可运行的演示 (`npx degit …`)
- [AI 代理上下文](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — 面向消费者仓库中助手的集成指南

<a id="contributing"></a>
## 贡献

欢迎提交 Issue 和拉取请求。此仓库的维护者工作流：[`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) 和 [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md)。

<a id="license"></a>
## 许可证

MIT — 请参阅 [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)。

版权所有 © 2026 Waldemar Scudeller Jr.
