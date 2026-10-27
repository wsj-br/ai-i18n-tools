<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

**在任何 LLM 提供商上，使用您选择的模型来翻译您的应用、网站和文档。单一配置，缓存重跑。**

一个 CLI 和工具包，可为 JavaScript/TypeScript 应用、Python 应用和文档网站添加语言。您开始使用的语言是 `sourceLocale`，它可以是任何语言。它会查找文本，进行翻译，并写入您的项目加载的文件。内置预设支持 OpenAI、Anthropic、Gemini、OpenRouter、Ollama 以及任何与 OpenAI 兼容的 API。可以按项目或按区域设置切换提供商或模型。

适用于 [VitePress](https://vitepress.dev/)、[Starlight](https://starlight.astro.build/)、[Docusaurus](https://docusaurus.io/)、[Nextra](https://nextra.site/)、[Fumadocs](https://www.fumadocs.dev/)、[Astro](https://astro.build/)、[纯 Markdown](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-readme)（仓库 README 和其他 `.md` 文件）以及纯 HTML。Python 应用使用 `t()` / `_()` 或 GNU gettext（Streamlit、FastAPI、Flask、Django 和桌面工具包）。保留您现有的 [i18next](https://www.i18next.com/) 目录（命名空间 JSON 或 `t()` 源字符串）。与 [Intlayer](https://intlayer.org/) 有两种协作方式：保留 Intlayer 并使用 `translate-intlayer` 填充其字典，或者使用 `migrate-intlayer` 迁移到源字符串 `t()` 调用。Intlayer 仍然非常适合类型化内容字典和翻译管理系统。

<a id="features"></a>
## 功能

| | |
| --- | --- |
| **UI 字符串** | 从 JS/TS/Astro 和 Python 中提取 `t("…")` / `_()`，或提取单个 HTML 文件中的 `data-i18n*` → 转换为扁平的各区域设置 JSON 或 GNU gettext |
| **文档** | 翻译 Markdown、MDX、`.astro` 和 HTML 页面（每个语言区域一个文件） |
| **JSON** | 当文案位于 `t()` 调用之外时翻译嵌套的区域设置包 |
| **SVG** | 通过 `translate-svg` 翻译带插图的 SVG 标签 |
| **智能缓存** | 共享 SQLite 缓存 — 只有新增或更改的片段会发送给模型 |
| **单个 `sync`** | 从一个配置中按正确顺序运行提取 → UI → SVG → 文档 → JSON |
| **Python** | 每个 GitHub Release 上的独立可执行文件 — CLI 运行无需安装 Node.js |
| **排名模型** | `suggest-models` 对当前提供商的聊天模型进行排名，并可以编写 `translationModels` |

<a id="where-do-i-start"></a>
## 从何开始？

| 您有 | 从这里开始 |
| --- | --- |
| 带有纯文本源的 JS/TS 应用（React、Next.js、Node、CLI） | [为 JS/TS 应用添加 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-js) |
| Python 应用（Streamlit、FastAPI、Flask、Django、gettext） | [为 Python 应用添加 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-python) |
| 网站或文档站点（VitePress、Docusaurus、Starlight、Nextra、Fumadocs、Astro、纯 HTML） | [为网站或文档站点添加 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-website) |
| 仓库 README 和其他 Markdown 文件（无论是否包含应用） | [为您的 README 和 Markdown 文档添加 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-readme) |
| 已调用 `t()` 或 `_()` 的代码 | [UI 字符串](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/ui-strings/) |
| 独立的嵌套 JSON 区域设置文件 | [JSON](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/json) |
| 带有文本标签的 SVG 图表 | [SVG 翻译](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/svg-translation/) |
| Intlayer 字典（保留 Intlayer，或迁移到源字符串调用） | [就地翻译 Intlayer](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/translating-intlayer) · [从 Intlayer 迁移到源字符串调用](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/migrating-from-intlayer) |

有关管道如何协同工作，请参阅 [什么是 ai-i18n-tools？](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/what-is-ai-i18n-tools)。

<a id="install"></a>
## 安装

仅支持 ESM。需要 Node.js `>=22.16.0`。

```bash
pnpm add -D ai-i18n-tools
# or: npm install --save-dev ai-i18n-tools
```

设置您传递给 `init` 的提供商的 API 密钥（Ollama 无需此项）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

配置 `ai-i18n-tools` 基础命令（direnv、PATH、`package.json` 脚本或 `npx`）——请参阅[安装](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/installation)。

<a id="python-no-nodejs"></a>
### Python，无需 Node.js

Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安装程序会为本机选择可执行文件，检查 `SHA256SUMS.txt`，将命令安装为 `ai-i18n-tools`，并将其添加到 `PATH`。这些二进制文件未经公证或 Authenticode 签名。手动下载步骤：[独立可执行文件](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/installation#standalone-executables)。

四个 Python 示例位于仓库中和发布版的 `ai-i18n-tools-python-examples.zip` 中。它们不在 npm tarball 或可执行文件内。

<a id="quick-start"></a>
## 快速开始

为您拥有的内容搭建配置，然后按照您的路径指南进行操作：

| 您有 | 搭建 | 然后按照 |
| --- | --- | --- |
| JS/TS 应用 | `ai-i18n-tools init -P openrouter` | [为 JS/TS 应用添加 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-js) |
| Python 应用 | `ai-i18n-tools init -t ui-python -P openrouter` | [为 Python 应用添加 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-python) |
| 网站或文档站点 | `ai-i18n-tools init -t ui-vitepress -P openrouter`（替换为您的框架模板） | [为网站或文档站点添加 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-website) |
| README（无论是否包含应用） | `ai-i18n-tools init -P openrouter`（JS/TS 应用 + README）或 `init -t docs-markdown` | [为您的 README 和 Markdown 文档添加 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-readme) |

项目准备就绪后，运行 `ai-i18n-tools sync`，然后运行 `ai-i18n-tools status` 以查看翻译结果。

JS/TS 应用必须首先将其文本包装在 `t()` 中。如果在纯文本上运行，`sync` 将无错误完成，但不会写入任何有用的内容。您的站点框架还必须在 `sync` 之前启用其自身的 i18n 路由。

网站模板：`ui-starlight`、`ui-docusaurus`、`ui-vitepress`、`ui-nextra`、`ui-fumadocs`、`ui-astro-website`，以及 `ui-plain-html` 或 `docs-plain-html`。仅限 README 和 Markdown：`docs-markdown`。将 `--with-readme` 添加到任何其他模板以包含 README 块。其他 Python 模板：`ui-python-gettext`、`ui-python-flask`、`ui-python-django`。嵌套的 i18next JSON：`ui-json-bundles`。完整列表：[CLI 设置参考](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/reference/cli-commands/setup)。

`suggest-models` 根据已发布的基准对活动提供商的聊天模型进行排名，并且 `suggest-models --apply` 会替换 `translationModels`。相同的排名位于 [模型](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/translation-dashboard/models) 选项卡上。指南：[AI 模型](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/ai-models)。命令参考：[suggest-models](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/reference/cli-commands/models#suggest-models)。

优先使用 `sync`，而不是链接单个翻译命令。完整演练：[快速入门](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/quick-start)。一个项目中包含多种内容：[组合管道](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/combining-pipelines)。

<a id="documentation"></a>
## 文档

- [文档网站](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/) — 指南、集成和参考
- [安装](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/installation) · [快速入门](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/quick-start) · [LLM 提供商](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/providers-and-models) · [AI 模型](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/ai-models)
- [UI 字符串](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/ui-strings/) · [纯 HTML](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/ui-strings/python) · [文档](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/documents/) · [HTML 页面](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/svg-translation/)
- [Intlayer](https://intlayer.org/) — [就地翻译字典](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/translating-intlayer) · [移动到源字符串调用](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/migrating-from-intlayer)
- [集成](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、Astro，以及 [Python](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/integrations/python)
- [为您的项目添加 i18n](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-your-project) — [JS/TS 应用](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-js) · [Python 应用](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-python) · [网站或文档站点](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-website) · [README 和 Markdown 文档](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/add-i18n-to-readme) · [组合管道](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/combining-pipelines)
- [CLI 参考](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/reference/cli-commands/) · [配置](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/reference/configuration) · [运行时助手](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/guide/runtime-helpers)
- [示例](https://wsj-br.github.io/ai-i18n-tools/zh-Hans/examples) — 可运行的演示 (`npx degit …`)
- [AI 代理上下文](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — 消费者仓库中助手的集成指南

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
