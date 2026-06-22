<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

一个用于使用大型语言模型（LLM）国际化 JavaScript/TypeScript 应用程序和文档站点的命令行界面（CLI）和工具包。它支持 [OpenRouter](https://openrouter.ai/) 和任何兼容 OpenAI 的提供商（OpenAI、Anthropic、Gemini、DeepSeek、Groq、Mistral、xAI、Cerebras、NVIDIA、Alibaba、APIFUN、Ollama 等）。三个模块化工作流共享单个配置文件，支持不同的翻译需求：

- **工作流 1 — UI 翻译：** 从 JS/TS（以及可选的 `.astro` 文件）中提取 `t("…")` 调用，并生成用于 i18next 或静态 SSG 查找的扁平化、按区域设置的 JSON。
- **工作流 2 — 文档翻译：** 使用 `translate-docs` 翻译 markdown、MDX 和 `.astro` 页面（适用于网站和 Starlight），这些页面在 `docs[].contentPaths` 中列出。
- **工作流 3 — JSON 文件翻译：** 翻译 `json[]` 中定义的任意嵌套 JSON 包。当 UI 副本存储在按区域设置的 JSON 文件中而不是在源中使用 `t()` 时，请使用 `translate-json`。

**SVG** 资源使用 `features.translateSVG`、顶级 `svg` 块和 `translate-svg` 进行翻译，而不是 `docs[].contentPaths`。

**我应该使用哪个工作流？**
- 源文件使用 `t()` → **工作流 1**（`extract` / `translate-ui`）
- 已本地化的页面或 Docusaurus 目录 JSON → **工作流 2**（`translate-docs`）
- 仅独立的、嵌套的 JSON 区域设置文件 → **工作流 3**（`translate-json`）

所有工作流都维护一个文件/SQLite 缓存，以确保只有新的或已更改的片段（字符串或文本块）才会被发送到 LLM。

<small>**以其他语言阅读：** </small>
<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目录**

- [核心工作流](#core-workflows)
- [安装](#installation)
  - [使用 CLI](#using-the-cli)
- [LLM 提供商](#openrouter)
- [快速入门](#quick-start)
  - [工作流 1 - UI 翻译](#workflow-1---ui-translation)
  - [工作流 2 - 文档翻译](#workflow-2---document-translation)
  - [Astro（纯 Astro 和 Starlight）](#astro-plain-astro--starlight)
  - [组合工作流](#combined-workflow)
- [运行时助手](#runtime-helpers)
- [CLI 命令](#cli-commands)
- [文档](#documentation)
- [许可证](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## 核心工作流

**工作流 1 - UI 翻译** — 适用于任何使用 i18next（React、Next.js、Node.js、CLI）或静态 Astro SSG 的 JS/TS 项目

扫描源文件中的 `t("…")` / `i18n.t("…")` 字面量（为 Astro frontmatter 和模板表达式添加 `.astro` 到 `ui.uiExtractor.extensions`），构建主目录（`strings.json`），通过 OpenRouter 翻译每个区域设置的缺失条目，并写入扁平化 JSON 文件（`de.json`、`pt-BR.json` 等）。英文源文本是这些包中的运行时查找键 — `strings.json` 是提取缓存，而不是运行时包。

**工作流 2 - 文档翻译** — 适用于 `docs[].contentPaths` 下的 markdown、MDX 和 `.astro`

主要设计用于 **markdown、MDX 和 `.astro` 文档**（Docusaurus、[Astro Starlight](https://starlight.astro.build/)、纯 README 文件和纯 Astro 营销页面）。`translate-docs` 会写入带有共享 SQLite 缓存的本地化副本。在 Docusaurus 网站上，将 `docs[].docusaurusCatalogDir` 设置为 `write-translations` 目录文件夹，以便在同一命令中翻译 shell JSON（导航栏、页脚、主题字符串）。`docs[].docsOutput.style` 支持 `"nested"`、`"flat"`、`"doc-system"` 以及别名 `"docusaurus"` / `"astro-starlight"`（请参阅入门中的[输出布局](docs/GETTING_STARTED.zh-Hans.md#output-layouts)）。不属于 Docusaurus 目录的任意嵌套 UI JSON 应归入工作流 3（`json[]` / `translate-json`），而不是 `docs[]`。

**工作流 3 - JSON 文件翻译** — 源文件中没有 `t()` 的嵌套区域设置 JSON

通过顶层 `json[]`、`features.translateJson` 和 `translate-json` 来翻译文件，例如 `src/i18n/en/translation.json`。使用 `init -t ui-json-bundles` 进行脚手架搭建。

所有工作流共享 `ai-i18n-tools.config.json` 并可以组合；`sync` 会按顺序提取、UI 翻译、翻译 SVG、`translate-docs` 和 `translate-json`，具体取决于您的 `features` 标志。

---

<a id="installation"></a>
## 安装

发布的包是 **仅 ESM**（`"type": "module"`）。需要 Node.js `>=22.16.0`。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### 使用 CLI

**每个项目（推荐）** — 安装为开发依赖项，然后通过 `npx`、`pnpm exec` 或 `package.json` 脚本运行：

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

您也可以直接使用 ai-i18n-tools CLI 命令，例如 `ai-i18n-tools sync`。

优先使用 `sync` 而不是手动链接 `extract`、`translate-ui`、`translate-svg`、`translate-docs` 和 `translate-json` — 手动运行时很容易出错顺序和功能标志。请参阅入门中的 [推荐的 `package.json` 脚本](docs/GETTING_STARTED.zh-Hans.md#recommended-packagejson-scripts)。

**零安装一次性** — `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（仅为该调用下载）。

> **提示：** 要在没有 `npx` 的交互式 shell 中直接运行 `ai-i18n-tools`，请将 `node_modules/.bin` 添加到您的 `PATH` 中（bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`）。有关 direnv 和 Windows 说明，请参阅 [入门](docs/GETTING_STARTED.zh-Hans.md#installation)。

设置您的提供商 API 密钥（显示 OpenRouter；请使用与您的提供商匹配的变量）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## LLM 提供商

翻译命令（`translate-ui`、`translate-docs`、`translate-json`、`sync`、`check-models` 及相关脚本）会调用 LLM 提供商；而 `check-markdown`、`mark-html` 和 `extract` 则不会。

在顶层的 `providers` 映射下配置提供商，并通过顶层的 `provider` 选择器选择活动的提供商（当只有一个提供商配置时是可选的）。大多数提供商只需要一个 `translationModels` 列表 — `baseUrl` 和 API 密钥环境变量来自内置预设；您可以为每个提供商覆盖 `baseUrl`、`apiKeyEnv`、`headers`、`maxTokens`、`temperature` 和 `requestTimeoutMs`。`requestTimeoutMs` 是等待每个请求的最大时间（毫秒）（默认 `30000`）。

若要在不编辑配置的情况下为单次运行切换提供程序，请传递全局 `-P` / `--provider <name>` 选项（例如 `ai-i18n-tools -P groq translate-ui`）；名称必须是已配置的 `providers` 键之一。

```jsonc
{
  "provider": "openrouter",
  "providers": {
    "openrouter": { "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"] },
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

内置提供商预设（键 — 基本 URL — API 密钥环境变量）：

| 提供商 | 基本 URL | API 密钥环境变量 |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (无) |

通过添加一个带有 `baseUrl`（以及 `apiKeyEnv`，除非不需要密钥）的新键来定义自定义的 OpenAI 兼容提供商。模型 ID 是纯粹的上游 ID — 提供商在配置级别选择，因此不需要 `provider/` 前缀（OpenRouter ID 保留其原生的 `vendor/model` 格式）。

每个提供商都会报告 Token 用量；确切的美元成本仅在提供商返回时显示（OpenRouter）。`ai-i18n-tools check-models` 会将配置的模型 ID 与活动提供商的实时 `GET /models` 列表（任何提供商）进行验证，并在提供商返回价格时显示价格（例如 OpenRouter）。`ai-i18n-tools list-models` 列出了活动提供商宣传的每个模型（使用 `-P` / `--provider` 来检查另一个已配置的提供商）。

仍然接受旧的顶级 `openrouter` 配置块，并在加载时自动迁移到 `providers.openrouter`（带有 `provider: "openrouter"`）。

有关使用 `-P` 在单个文档上切换提供商的实践演示，请参阅 [`examples/multi-provider`](../examples/multi-provider/)（一个包含 `openai`、`anthropic`、`nvidia` 和 `deepseek` 的配置）。

---

<a id="quick-start"></a>
## 快速入门

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

然后使用 `'ai-i18n-tools/runtime'` 中的辅助函数在您的应用中集成 i18next。有关完整设置，请参阅入门指南中的 [步骤 4：在运行时集成 i18next](docs/GETTING_STARTED.zh-Hans.md#step-4-wire-i18next-at-runtime)。

<a id="workflow-2---document-translation"></a>
### 工作流 2 - 文档翻译

默认的 `init` 模板（`ui-markdown`）仅启用 UI 提取。在 `translate-docs` 之前，请使用面向文档的模板（或启用 `features.translateDocs` 并添加 `docs[]`）：

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

编辑 `ai-i18n-tools.config.json`：将 `docs[].contentPaths` 设置为 markdown、MDX 和/或 `.astro` 源；`docs[].outputDir` 和 `docs[].docsOutput.style`（`"docusaurus"`、`"astro-starlight"`、`"flat"` 等）。完整字段参考：[工作流 2 - 文档翻译](docs/GETTING_STARTED.zh-Hans.md#workflow-2---document-translation)。

<a id="astro-plain-astro--starlight"></a>
### Astro（纯 Astro 和 Starlight）

**Astro Starlight** — `init -t ui-starlight`，然后是 `translate-docs`。Starlight UI 覆盖可以使用 `src/content/i18n/en.json` 和 `jsonPathTemplate` 在单独的 `docs[]` 块中（如果需要）（[入门 → 工作流 2](docs/GETTING_STARTED.zh-Hans.md#step-1-initialise-for-documentation))。

**纯 Astro**（营销或应用网站，非 Starlight）— 将 [Astro 内置 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 与 ai-i18n-tools 结合使用。参考项目：[`examples/astro-website`](../examples/astro-website/)（英文在 `/`，区域设置在 `/{locale}/`）。

大多数团队使用两种管道的**混合体**：

| 管道 | 用于 | 命令 | 输出 |
|----------|---------|----------|--------|
| **页面 HTML** | 模板正文中的标题、段落、导航标签、内联数组 | `translate-docs` | 每个区域设置 `src/pages/{locale}/index.astro` |
| **UI 字符串（`t()`）** | 前端数据、选项卡标签、共享数组 | `extract` → `translate-ui` | `public/locales/{locale}.json`（以英文原文作为键） |

使用 `init -t ui-astro-website` 构建 UI。对于 `.astro` 页面中的硬编码 HTML，请启用 `features.translateDocs` 并添加一个带有 `docs[]` 的 `docsOutput.style: "astro-starlight"` 块（请参阅 [Astro 网站页面（解析和替换）](docs/GETTING_STARTED.zh-Hans.md#astro-website-pages-parse-and-replace))。在 `astro.config.mjs` 中保持 `targetLocales`、`i18n.locales` 和 `ui-languages.json` 对齐（Astro 路由使用小写代码，例如 `pt-br`；扁平化捆绑包文件名遵循配置的大小写，例如 `pt-BR.json`）。

在构建时连接 `t()`，除非添加客户端 island，否则无需 i18next — 请参阅 [Astro 网站 UI 字符串（SSG）](docs/GETTING_STARTED.zh-Hans.md#astro-website-ui-strings-ssg) 和示例中的 `src/i18n/t.ts`。

<a id="combined-workflow"></a>
### 组合工作流

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## 运行时辅助函数

以下辅助函数从 `'ai-i18n-tools/runtime'` 导出，可在任何 JavaScript 环境中使用。您无需导入 i18next 即可使用它们：

| 辅助函数 | 描述 |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)` | 标准 i18next 初始化选项，用于键作为默认值设置。 |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 推荐的连接方式：从 `strings.json` 中提取键修剪 + 复数 `wrapT`，可选地合并 `translate-ui` `{sourceLocale}.json` 复数键。 |
| `wrapT(i18n, options)` | 低级别的、感知复数的 `t()` 包装器（通常由 `setupKeyAsDefaultT` 安装）。 |
| `buildPluralIndexFromStringsJson(entries)` | 从带有 `"plural": true` 的目录行构建复数组索引 `wrapT`。 |
| `extractInterpolationNamesForWrap(key)` | 从源键解析 `{{var}}` 名称，用于 `wrapT` / 键修剪回退。 |
| `wrapI18nWithKeyTrim(i18n)` | 仅低级别的键修剪包装器（应用程序连接已弃用；首选 `setupKeyAsDefaultT`）。 |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | 为 `makeLoadLocale` 从 `ui-languages.json` 构建 `localeLoaders` 映射（每个 `code`，除了 `sourceLocale`）。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 异步加载区域设置文件的工厂。 |
| `getTextDirection(lng)` | 为 BCP-47 代码返回 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement` 上设置 `dir` 属性。 |
| `getUILanguageLabel(lang, t)` | 语言菜单行的显示标签（带 i18n）。 |
| `getUILanguageLabelNative(lang)` | 不调用 `t()` 的显示标签（标题样式）。 |
| `interpolateTemplate(str, vars)`                                       | 在纯字符串上进行低级 `{{var}}` 替换（内部使用；应用代码应改用 `t()`）。                               |
| `flipUiArrowsForRtl(text, isRtl)`                                      | 为 RTL 布局将 `→` 翻转为 `←`。                                                                                                       |

---

<a id="cli-commands"></a>
## CLI 命令

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
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

对于纯 HTML 应用，请使用裸露的 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 标记来注解元素（源文本取自元素的 own textContent / title / placeholder，只需编写一次）；`mark-html` 会为您插入这些标记，然后 `extract` 会将它们捕获到 `strings.json` 中。请参阅 [入门 — 为 HTML 添加翻译标记](docs/GETTING_STARTED.zh-Hans.md#marking-html-for-translation)。

每个命令的完整标志列表见 [入门 — CLI 参考](docs/GETTING_STARTED.zh-Hans.md#cli-reference)。运行 `ai-i18n-tools <command> --help` 可查看内置的用法文本。

全局选项，适用于所有命令：`-c <config>`（默认值：`ai-i18n-tools.config.json`）、`-v`（详细模式）、`-P` / `--provider <name>`（覆盖活动的 LLM 提供商；必须在 `providers` 下配置）、`-L` / `--ui-lang <code>`（工具自身的 UI/日志语言）、可选的 `-w` / `--write-logs [path]` 将控制台输出复制到日志文件（默认：在翻译缓存目录下方）、`-V` / `--version`，以及 `-h` / `--help`。多个命令接受 `-l` / `--locale <codes>`（逗号分隔的 BCP-47）来限制目标区域设置；`lint-source` 使用单一源区域设置。请参阅 [入门](docs/GETTING_STARTED.zh-Hans.md#cli-reference) 查看命令概览表。

### 工具 UI 语言（日志、帮助、仪表板）

该工具会本地化其自身的 CLI 帮助、高流量日志/摘要消息以及翻译仪表板。UI 区域设置从以下来源解析，优先级最高：

1. `-L` / `--ui-lang <code>` 全局标志（例如 `-L pt-BR`）。
2. `AI_I18N_LANG` 环境变量（例如 `export AI_I18N_LANG=es`）。
3. `ai-i18n-tools.config.json` 中的 `uiLanguage` 配置键（BCP-47 字符串）。
4. 主机操作系统区域设置（通过 `Intl.DateTimeFormat().resolvedOptions().locale`）。

请求的区域设置会与提供的 UI 语言进行精确匹配或按最接近的变体匹配（例如 `pt-PT` 解析为 `pt-BR`，`en-US` 解析为 `en-GB`）；当没有任何匹配项时，它将回退到源区域设置（`en-GB`）。这与您的项目的 `sourceLocale` / `targetLocales` 无关。提供的 UI 语言：`en-GB`（源语言）以及 `de`、`es`、`fr`、`hi-Latn`、`ja`、`ko`、`pt-BR`、`zh-Hans` 和 `zh-Hant`。

---

<a id="documentation"></a>
## 文档

- [入门](docs/GETTING_STARTED.zh-Hans.md) - 所有工作流的完整设置（UI、文档/`.astro`、JSON 包、Astro Starlight 和普通 Astro）、CLI 参考、配置字段参考。
- [语言区域资源指南](docs/LOCALE-ASSETS-GUIDE.zh-Hans.md) - 翻译文档中的截图和 SVG 插图（模式 A–E、扁平链接重写器、截图脚本）。
- [包概述](docs/PACKAGE_OVERVIEW.zh-Hans.md) - 架构、内部机制、编程 API 和扩展点。
- [AI Agent 上下文](../docs/ai-i18n-tools-context.md) - **适用于使用该包的应用：** 为下游项目提供的集成提示（复制到你仓库的 agent 规则中）。
- 本仓库 **this** 的维护者内部信息：`dev/package-context.md`（仅克隆使用，不在 npm 上发布）。

---

<a id="license"></a>
## 许可证

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
