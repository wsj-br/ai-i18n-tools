<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm 版本](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm 下载量](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![许可证: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

一个 CLI 工具包，用于通过 [OpenRouter](https://openrouter.ai/) 使用大语言模型对 JavaScript/TypeScript 应用和文档站点进行国际化。三种模块化工作流共享一个配置文件，满足不同的翻译需求：

- **工作流 1 — UI 翻译：** 从 JS/TS（以及可选的 `.astro` 文件）中提取 `t("…")` 调用，并为 i18next 或静态 SSG 查找生成按语言环境划分的扁平 JSON。
- **工作流 2 — 文档翻译：** 使用 `translate-docs` 翻译在 `docs[].contentPaths` 中列出的 markdown、MDX 和 `.astro` 页面（适用于网站和 Starlight）。
- **工作流 3 — JSON 文件翻译：** 翻译在 `json[]` 中定义的任意嵌套 JSON 包。当 UI 文本存储在按语言环境划分的 JSON 文件中而非源码中的 `t()` 时，使用 `translate-json`。

**SVG** 资源通过 `features.translateSVG`、顶级 `svg` 块和 `translate-svg` 进行翻译 —— 而非 `docs[].contentPaths`。

**我应该使用哪个工作流？**
- 源码使用 `t()` → **工作流 1**（`extract` / `translate-ui`）
- 本地化页面或 Docusaurus 目录 JSON → **工作流 2**（`translate-docs`）
- 仅使用独立的嵌套 JSON 语言环境文件 → **工作流 3**（`translate-json`）

所有工作流都维护一个文件/SQLite 缓存，以确保仅将新增或更改的片段（字符串或文本块）发送给 LLM。

<small>**阅读其他语言版本：** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目录**

- [核心工作流](#core-workflows)
- [安装](#installation)
  - [使用 CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [快速开始](#quick-start)
  - [工作流 1 - UI 翻译](#workflow-1---ui-translation)
  - [工作流 2 - 文档翻译](#workflow-2---document-translation)
  - [Astro（纯 Astro 与 Starlight）](#astro-plain-astro--starlight)
  - [组合工作流](#combined-workflow)
- [运行时辅助工具](#runtime-helpers)
- [CLI 命令](#cli-commands)
- [文档](#documentation)
- [许可证](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## 核心工作流

**工作流 1 - UI 翻译** — 适用于任何使用 i18next（React、Next.js、Node.js、CLI）或静态 Astro SSG 的 JS/TS 项目

扫描源文件中的 `t("…")` / `i18n.t("…")` 字面量（为 Astro frontmatter 和模板表达式添加 `.astro` 到 `ui.uiExtractor.extensions`），构建主目录（`strings.json`），通过 OpenRouter 按语言环境翻译缺失条目，并写入扁平 JSON 文件（`de.json`、`pt-BR.json` 等）。英文源文本是这些包中的运行时查找键 —— `strings.json` 是提取缓存，而非运行时包。

**工作流 2 - 文档翻译** — 适用于 `docs[].contentPaths` 下的 markdown、MDX 和 `.astro`

主要面向 **markdown、MDX 和 `.astro` 文档**（Docusaurus、[Astro Starlight](https://starlight.astro.build/)、普通 README 文件以及纯 Astro 营销页面）。`translate-docs` 使用共享的 SQLite 缓存写入本地化副本。在 Docusaurus 站点中，将 `docs[].docusaurusCatalogDir` 设置为 `write-translations` 目录文件夹，以便在同一条命令中翻译 shell JSON（导航栏、页脚、主题字符串）。`docs[].docsOutput.style` 支持 `"nested"`、`"flat"`、`"doc-system"`，以及别名 `"docusaurus"` / `"astro-starlight"`（参见入门指南中的 [输出布局](docs/GETTING_STARTED.zh-CN.md#output-layouts)）。不属于 Docusaurus 目录的任意嵌套 UI JSON 应使用工作流 3（`json[]` / `translate-json`），而非 `docs[]`。

**工作流 3 - JSON 文件翻译** — 源码中无 `t()` 的嵌套语言环境 JSON

通过顶级 `json[]`、`features.translateJson` 和 `translate-json` 翻译如 `src/i18n/en/translation.json` 等文件。使用 `init -t ui-json-bundles` 进行脚手架生成。

所有工作流共享 `ai-i18n-tools.config.json`，并且可以组合使用；`sync` 会根据您的 `features` 标志按顺序运行提取、UI 翻译、SVG 翻译、`translate-docs` 和 `translate-json`。

---

<a id="installation"></a>
## 安装

发布的包为 **仅 ESM 格式**（`"type": "module"`）。需要 Node.js `>=22.16.0`。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### 使用 CLI

**按项目安装（推荐）** — 作为开发依赖安装，然后通过 `npx`、`pnpm exec` 或 `package.json` 脚本运行：

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

您也可以直接使用 ai-i18n-tools CLI 命令，例如 `ai-i18n-tools sync`。

优先使用 `sync` 而非手动串联 `extract`、`translate-ui`、`translate-svg`、`translate-docs` 和 `translate-json` —— 手动运行时容易出错顺序和功能标志。请参阅入门指南中的 [推荐 `package.json` 脚本](docs/GETTING_STARTED.zh-CN.md#recommended-packagejson-scripts)。

**零安装一次性使用** — 使用 `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（仅在本次调用时下载）。

> **提示：** 若要在交互式 shell 中直接运行 `ai-i18n-tools` 而不使用 `npx`，请将 `node_modules/.bin` 添加到您的 `PATH` 中（bash/zsh：`export PATH="$PWD/node_modules/.bin:$PATH"`）。有关 direnv 和 Windows 的说明，请参阅 [入门指南](docs/GETTING_STARTED.zh-CN.md#installation)。

设置您的 OpenRouter API 密钥：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

调用 OpenRouter 的命令（`translate-ui`、`translate-docs`、`translate-json`、`sync`、`check-models` 及相关脚本）需要在环境中设置 `OPENROUTER_API_KEY`。`check-markdown` 不使用 OpenRouter。

在 `ai-i18n-tools.config.json` 中，`openrouter` 对象包含模型列表、`baseUrl`、`maxTokens`、`temperature` 和 `requestTimeoutMs`：即对 OpenRouter 的每个 HTTP 请求（聊天补全和内部 `GET /models` 调用）等待的最长时间（毫秒）。默认值为 `30000`（30 秒）。

运行 `ai-i18n-tools check-models` 以验证每个配置的模型 ID 是否与 OpenRouter 的实时目录相符。它会报告缺失的 ID 或过期的 `expiration_date`，列出有效模型及其估计的输入/输出定价（每百万个令牌的美元），并在任何配置的 ID 无效时以非零状态退出。它需要 `OPENROUTER_API_KEY`。

---

<a id="quick-start"></a>
## 快速开始

<a id="workflow-1---ui-translation"></a>
### 工作流 1 - UI 翻译

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

然后在您的应用中使用来自 `'ai-i18n-tools/runtime'` 的辅助函数接入 i18next。完整配置请参阅入门指南中的 [第 4 步：运行时接入 i18next](docs/GETTING_STARTED.zh-CN.md#step-4-wire-i18next-at-runtime)。

<a id="workflow-2---document-translation"></a>
### 工作流 2 - 文档翻译

默认的 `init` 模板 (`ui-markdown`) 仅启用 UI 提取。在 `translate-docs` 之前，请使用面向文档的模板（或启用 `features.translateDocs` 并添加 `docs[]`）：

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

编辑 `ai-i18n-tools.config.json`：将 `docs[].contentPaths` 设置为 markdown、MDX 和/或 `.astro` 源；`docs[].outputDir` 和 `docs[].docsOutput.style` (`"docusaurus"`、`"astro-starlight"`、`"flat"` 等)。完整字段参考：[工作流 2 - 文档翻译](docs/GETTING_STARTED.zh-CN.md#workflow-2---document-translation)。

<a id="astro-plain-astro--starlight"></a>
### Astro（普通 Astro 和 Starlight）

**Astro Starlight** — `init -t ui-starlight`，然后 `translate-docs`。Starlight UI 覆盖可以在需要时使用 `src/content/i18n/en.json` 和 `jsonPathTemplate` 在单独的 `docs[]` 块中（[入门 → 工作流 2](docs/GETTING_STARTED.zh-CN.md#step-1-initialise-for-documentation)）。

**普通 Astro**（营销或应用网站，不是 Starlight） — 将 [Astro 内置的 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 与 ai-i18n-tools 结合。参考项目：[`examples/astro-website`](../examples/astro-website/)（英语在 `/`，区域设置在 `/{locale}/`）。

大多数团队使用两条管道的 **混合**：

| 管道 | 用于 | 命令 | 输出 |
|----------|---------|----------|--------|
| **页面 HTML** | 标题、段落、导航标签、模板主体中的内联数组 | `translate-docs` | 每个语言的 `src/pages/{locale}/index.astro` |
| **UI 字符串 (`t()`)** | Frontmatter 数据、标签页标签、共享数组 | `extract` → `translate-ui` | `public/locales/{locale}.json`（英语源作为键） |

使用 `init -t ui-astro-website` 构建 UI。对于 `.astro` 页面中的硬编码 HTML，请启用 `features.translateDocs` 并添加一个包含 `docsOutput.style: "astro-starlight"` 的 `docs[]` 块（请参见 [Astro 网站页面（解析和替换）](docs/GETTING_STARTED.zh-CN.md#astro-website-pages-parse-and-replace)）。保持 `targetLocales`、`i18n.locales` 在 `astro.config.mjs` 和 `ui-languages.json` 对齐（Astro 路由使用小写代码，如 `pt-br`；扁平捆绑文件名遵循配置大小写，例如 `pt-BR.json`）。

在构建时连接 `t()`，除非您添加客户端岛屿 — 请参见 [Astro 网站 UI 字符串（SSG）](docs/GETTING_STARTED.zh-CN.md#astro-website-ui-strings-ssg) 和示例的 `src/i18n/t.ts`。

<a id="combined-workflow"></a>
### 组合工作流

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## 运行时辅助工具

以下辅助函数从 `'ai-i18n-tools/runtime'` 导出，可在任何 JavaScript 环境中使用。使用它们时无需导入 i18next：

| 辅助工具                                                                 | 描述                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | 用于键值作为默认值配置的标准 i18next 初始化选项。                                                                               |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 推荐的集成方式：从 `strings.json` 获取 key-trim + plural `wrapT`，可选择性合并 `translate-ui` `{sourceLocale}.json` 的复数键。 |
| `wrapI18nWithKeyTrim(i18n)` | 仅提供底层的 key-trim 封装（在应用集成中已弃用；推荐使用 `setupKeyAsDefaultT`）。 |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | 从 `ui-languages.json` 构建 `localeLoaders` 映射（包含除 `sourceLocale` 外的每个 `code`）以用于 `makeLoadLocale`。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 用于异步加载区域设置文件的工厂函数。 |
| `getTextDirection(lng)` | 返回 BCP-47 代码对应的 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement` 上设置 `dir` 属性。 |
| `getUILanguageLabel(lang, t)` | 语言菜单行的显示标签（包含国际化）。 |
| `getUILanguageLabelNative(lang)` | 不调用 `t()` 的显示标签（标题样式）。 |
| `interpolateTemplate(str, vars)` | 在普通字符串上执行低层级 `{{var}}` 替换（内部使用；应用代码应改用 `t()`）。 |
| `flipUiArrowsForRtl(text, isRtl)` | 为 RTL 布局将 `→` 翻转为 `←`。 |

---

<a id="cli-commands"></a>
## CLI 命令

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

各命令的完整参数列表见 [入门指南 — CLI 参考](docs/GETTING_STARTED.zh-CN.md#cli-reference)。运行 `ai-i18n-tools <command> --help` 可查看内置使用说明。

每个命令的全局选项：`-c <config>`（默认值：`ai-i18n-tools.config.json`）、`-v`（详细）、可选的 `-w` / `--write-logs [path]` 将控制台输出转储到日志文件（默认值：在翻译缓存目录下）、`-V` / `--version`，以及 `-h` / `--help`。多个命令接受 `-l` / `--locale <codes>`（以逗号分隔的 BCP-47）以限制目标区域设置；`lint-source` 使用单一源区域设置。请参见 [入门](docs/GETTING_STARTED.zh-CN.md#cli-reference) 以获取命令概述表。

---

<a id="documentation"></a>
## 文档

- [入门指南](docs/GETTING_STARTED.zh-CN.md) - 所有工作流的完整设置（UI、文档/`.astro`、JSON 捆绑包、Astro Starlight 和普通 Astro），CLI 参考和配置字段参考。
- [语言资源指南](docs/LOCALE-ASSETS-GUIDE.zh-CN.md) - 翻译文档中的屏幕截图和插图 SVG（模式 A–E，扁平链接重写器，屏幕截图脚本）。
- [包概述](docs/PACKAGE_OVERVIEW.zh-CN.md) - 架构、内部结构、编程 API 和扩展点。
- [AI 代理上下文](../docs/ai-i18n-tools-context.md) - **针对使用该包的应用：** 下游项目的集成提示（复制到您的代理规则仓库中）。
- 本仓库 **this** 的维护者内部信息：`dev/package-context.md`（仅用于克隆；不在 npm 上发布）。

---

<a id="license"></a>
## 许可证

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
