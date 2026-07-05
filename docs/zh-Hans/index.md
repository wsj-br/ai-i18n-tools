---
layout: doc
title: ai-i18n-tools
description: 用于使用大型语言模型 (LLM) 对 JavaScript/TypeScript 应用程序和文档站点进行国际化的 CLI 和工具包。
---



# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

<small id="lang-list">[英语（英国）](/) · [德语](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) · [西班牙语](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.es.md) · [法语](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.fr.md) · [印地语（罗马）](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.hi-Latn.md) · [日语](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.ja.md) · [韩语](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.ko.md) · [葡萄牙语（巴西）](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.pt-BR.md) · [简体中文](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.zh-Hans.md) · [繁体中文](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.zh-Hant.md)</small>

**使用您选择的 AI 模型翻译您的应用程序和文档：无锁定，无需重写。**

`ai-i18n-tools` 是一个用于国际化 JavaScript/TypeScript 应用程序和文档站点的 CLI 和工具包——包括 Docusaurus、Astro、Starlight、VitePress 和纯 Markdown/MDX——使用大型语言模型。

将其指向任何提供商并开始翻译：**OpenAI**、**Anthropic**、**Google Gemini**、**NVIDIA**、**DeepSeek**、**Groq**、**Mistral**、**xAI**、**Cerebras**、**Alibaba**、**APIFUN**、任何 [OpenRouter](https://openrouter.ai/) 模型（数百种可供选择，只需一个 API 密钥），或 **Ollama** 用于完全自托管的离线翻译。在不修改代码库的情况下，按项目甚至按语言切换提供商或模型。

一个配置文件驱动三种翻译模式，因此您可以根据内容的结构进行混合和匹配：

- **UI 字符串** — 从 JS/TS（以及可选的 `.astro` 文件）中提取 `t("…")` 调用，并为 i18next 或静态 SSG 查找生成扁平的、按区域设置的 JSON。
- **文档** — 使用 `translate-docs` 翻译 `docs[].contentPaths` 中列出的 Markdown、MDX 和 `.astro` 页面。适用于 **VitePress**、**Starlight**、**Docusaurus**、基于 Astro 的站点，或任何从 Markdown/MDX/`.astro` 源文件读取的静态站点生成器。
- **JSON** — 翻译 `json[]` 中定义的任意嵌套 JSON 包。当 UI 副本存在于按区域设置的 JSON 文件中而不是源中的 `t()` 调用时，请使用 `translate-json`。

**SVG** 资产有自己的路径：`features.translateSVG`、顶级 `svg` 块和 `translate-svg`——而不是 `docs[].contentPaths`。

**我应该使用哪一个？**

| 您的内容                                                                  | 命令                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| 源代码使用 `t()`                                                        | **UI 字符串** — `extract` / `translate-ui` |
| 本地化页面或文档站点（VitePress、Starlight、Docusaurus、Astro 等） | **文档** — `translate-docs`            |
| 独立、嵌套的 JSON 区域设置文件                                          | **JSON** — `translate-json`                 |

所有这三种都共享一个文件/SQLite 缓存，因此只有新的或更改的段（字符串或文本块）才会被重新发送到模型——无论您使用哪个提供商，重新运行都快速且便宜。

<a id="translation-types"></a>
## 翻译类型

每种翻译类型都有自己的指南，其中包含完整的配置详细信息：[UI 字符串](/guide/ui-strings/)、[文档](/guide/documents/) 和 [JSON](/guide/json)。请参阅[什么是 ai-i18n-tools？](/guide/what-is-ai-i18n-tools) 以进行并排比较。

一些值得提前了解的事情：UI 字符串通过活动的 LLM 提供程序（请参阅 [LLM 提供程序](#llm-providers)）翻译每个区域设置中缺失的条目，并写入平面 JSON 文件（`de.json`、`pt-BR.json` 等），其中英文源文本作为运行时查找键 — `strings.json` 是提取缓存，而不是运行时捆绑包。文档支持 `docs[].docsOutput.style` 值 `"nested"`、`"flat"`、`"doc-system"` 和别名 `"docusaurus"` / `"astro-starlight"` / `"vitepress"`（请参阅 [输出布局](/guide/documents/output-layouts)）。所有这三种都共享 `ai-i18n-tools.config.json` 并且可以组合；`sync` 根据您的 `features` 标志按顺序运行提取、UI 翻译、翻译 SVG、`translate-docs` 和 `translate-json`。

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

在项目中安装软件包后，npm/pnpm/yarn 会将已发布的 bin 条目 (`bin/ai-i18n-tools.mjs`) 链接到 `node_modules/.bin/ai-i18n-tools` 中。该 shim 会从已安装的软件包加载已编译的 CLI。

**`package.json` 脚本（推荐）** — npm 和 pnpm 在运行脚本时会将 `node_modules/.bin` 添加到 `PATH` 的前面，因此您可以调用裸命令名称：

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

然后运行例如 `pnpm run i18n:sync` — 无需 `npx` 前缀。

**交互式 shell** — 从您的项目根目录（本地安装后）：

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
```

要在 bash/zsh 中键入裸 `ai-i18n-tools` 命令，请将本地 bin 目录添加到 `PATH` 的前面（有关 PowerShell、direnv 和 Windows 的说明，请参阅 [使用 CLI](/guide/installation#using-the-cli)）：

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

优先使用 `sync`，而不是手动链接 `extract`、`translate-ui`、`translate-svg`、`translate-docs` 和 `translate-json` — 手动运行时，顺序和功能标志很容易出错。请参阅快速入门指南中的 [推荐的 `package.json` 脚本](/guide/quick-start#recommended-packagejson-scripts)。

**零安装一次性** — `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（仅为该调用下载软件包；`package.json` 中没有条目）。

设置您的提供商 API 密钥（显示 OpenRouter；请使用与您的提供商匹配的变量）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="llm-providers"></a>
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

| 提供商     | 基础 URL                                                  | API 密钥环境变量      |
|--------------|-----------------------------------------------------------|----------------------|
| `openrouter` | `https://openrouter.ai/api/v1`                            | `OPENROUTER_API_KEY` |
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

每个提供商都会报告令牌使用情况；仅当提供商返回时（OpenRouter）才会显示确切的美元成本。`ai-i18n-tools check-models` 根据活动提供商的实时 `GET /models` 列表（任何提供商）验证配置的模型 ID，并在提供商返回时显示定价（例如 OpenRouter）。`ai-i18n-tools list-models` 列出了活动提供商宣传的每个模型（使用 `-P` / `--provider` 检查其他配置的提供商）。`ai-i18n-tools bench-models` 通过单独翻译样本（模型并行运行，受 `concurrency` 限制）来基准测试每个配置的模型，并打印每个模型的输入/输出令牌、实际时间和美元成本。

仍然接受旧的顶级 `openrouter` 配置块，并在加载时自动迁移到 `providers.openrouter`（带有 `provider: "openrouter"`）。

有关使用 `-P` 在单个文档上切换提供程序的动手演示，请参阅 [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/)。

---

<a id="quick-start"></a>
## 快速入门

<a id="ui-strings"></a>
### UI 字符串

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

然后使用 `'ai-i18n-tools/runtime'` 中的辅助函数在您的应用程序中连接 i18next。有关完整设置，请参阅 UI 字符串指南中的 [步骤 4：在运行时连接 i18next](/guide/ui-strings/i18next-runtime)。

<a id="documents"></a>
### 文档

默认的 `init` 模板（`ui-markdown`）仅启用 UI 提取。在 `translate-docs` 之前，请使用面向文档的模板（或启用 `features.translateDocs` 并添加 `docs[]`）：

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# VitePress documentation (pages + theme JSON)
# npx ai-i18n-tools init -t ui-vitepress

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

编辑 `ai-i18n-tools.config.json`：将 `docs[].contentPaths` 设置为 markdown、MDX 和/或 `.astro` 源；`docs[].outputDir` 和 `docs[].docsOutput.style`（`"docusaurus"`、`"astro-starlight"`、`"vitepress"`、`"flat"` 等）。完整字段参考：[文档](/guide/documents/)。

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` 搭建 `docsOutput.style: "vitepress"` 以及用于主题/导航/侧边栏字符串的 `json[]` 块。运行 `sync` 以同时翻译页面 markdown 和 `theme.{locale}.json`。请参阅 [VitePress 集成](/guide/vitepress-integration) 和 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/)。

<a id="astro-plain-astro--starlight"></a>
### Astro（纯 Astro 和 Starlight）

**Astro Starlight** — `init -t ui-starlight`，然后是 `translate-docs`。Starlight UI 覆盖可以在需要时使用 `src/content/i18n/en.json` 和 `jsonPathTemplate` 在单独的 `docs[]` 块中进行 ([文档 — 初始化文档](/guide/documents/#step-1-initialise-for-documentation))。

**纯 Astro**（营销或应用程序站点，而非 Starlight）— 将 [Astro 内置 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 与 ai-i18n-tools 结合使用。参考项目：[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)（英文在 `/`，区域设置在 `/{locale}/`）。

大多数团队使用两种管道的**混合体**：

| 管道               | 用于                                                              | 命令                   | 输出                                                 |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **页面 HTML**          | 模板正文中的标题、段落、导航标签、内联数组 | `translate-docs`           | 每个区域设置的 `src/pages/{locale}/index.astro`            |
| **UI 字符串（`t()`）** | 前端数据、选项卡标签、共享数组 | `extract` → `translate-ui` | `public/locales/{locale}.json`（以英文原文作为键） |

使用 `init -t ui-astro-website` 搭建 UI。对于 `.astro` 页面中的硬编码 HTML，启用 `features.translateDocs` 并添加一个包含 `docs[]` 的 `docsOutput.style: "astro-starlight"` 块（请参阅 [Astro 网站页面（解析和替换）](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)）。保持 `targetLocales`、`i18n.locales` 在 `astro.config.mjs` 中，以及 `ui-languages.json` 对齐（Astro 路由使用小写代码，例如 `pt-br`；平面捆绑包文件名遵循配置大小写，例如 `pt-BR.json`）。

在构建时连接 `t()`，除非您添加客户端岛屿 — 请参阅 [Astro 网站 UI 字符串 (SSG)](/guide/ui-strings/astro-website#astro-website-ui-strings-ssg) 和示例的 `src/i18n/t.ts`。

<a id="combined-sync"></a>
### 组合同步

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
| `extractInterpolationNamesForWrap(key)` | 从源键解析 <code v-pre>{{var}}</code> 名称，用于 `wrapT`/键修剪回退。 |
| `wrapI18nWithKeyTrim(i18n)` | 仅低级别的键修剪包装器（应用程序连接已弃用；首选 `setupKeyAsDefaultT`）。 |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | 为 `makeLoadLocale` 从 `ui-languages.json` 构建 `localeLoaders` 映射（每个 `code`，除了 `sourceLocale`）。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 异步加载区域设置文件的工厂。 |
| `getTextDirection(lng)` | 为 BCP-47 代码返回 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement` 上设置 `dir` 属性。 |
| `getUILanguageLabel(lang, t)` | 语言菜单行的显示标签（带 i18n）。 |
| `getUILanguageLabelNative(lang)` | 不调用 `t()` 的显示标签（标题样式）。 |
| `interpolateTemplate(str, vars)` | 对纯字符串进行低级 <code v-pre>{{var}}</code> 替换（内部使用；应用程序代码应改用 `t()`）。 |
| `flipUiArrowsForRtl(text, isRtl)`                                      | 为 RTL 布局将 `→` 翻转为 `←`。                                                                                                       |

---

<a id="cli-commands"></a>
## CLI 命令

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--models <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

对于纯 HTML 应用程序，使用裸 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 标记注释元素（源文本取自元素自身的 textContent / title / placeholder，写入一次）；`mark-html` 为您插入它们，然后 `extract` 将它们捕获到 `strings.json` 中。请参阅 [标记 HTML 以进行翻译](/guide/ui-strings/plain-html#marking-html-for-translation)。

完整的每个命令标志列表在 [CLI 参考](/reference/cli-commands) 中。运行 `ai-i18n-tools <command> --help` 以获取内置用法文本。

全局选项：`-c <config>`（默认值：`ai-i18n-tools.config.json`）、`-v`（详细）、`-P` / `--provider <name>`（覆盖活动的LLM提供商；必须在`providers`下配置）、`-L` / `--ui-lang <code>`（工具自身UI/日志的语言）、`-V` / `--version`，以及`-h` / `--help` — 适用于每个命令。`-w` / `--write-logs [path]` 将控制台输出复制到日志文件（默认：在翻译缓存目录下），但仅在翻译和同步命令（`translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync-ui`、`sync`、`cleanup`）上生效。几个命令接受 `-l` / `--locale <codes>`（逗号分隔的BCP-47）来限制目标语言环境；`proofread-ui` 使用单个源语言环境。有关命令概述表，请参阅[CLI参考](/reference/cli-commands)。

<a id="tool-ui-language-logs-help-dashboard"></a>
### 工具 UI 语言（日志、帮助、仪表板）

该工具会本地化其自身的 CLI 帮助、高流量日志/摘要消息以及翻译仪表板。UI 区域设置从以下来源解析，优先级最高：

1. `-L` / `--ui-lang <code>` 全局标志（例如 `-L pt-BR`）。
2. `AI_I18N_LANG` 环境变量（例如 `export AI_I18N_LANG=es`）。
3. `ai-i18n-tools.config.json` 中的 `uiLanguage` 配置键（BCP-47 字符串）。
4. 主机操作系统区域设置（通过 `Intl.DateTimeFormat().resolvedOptions().locale`）。

请求的语言环境与随附的UI语言精确匹配或通过最接近的变体匹配（例如`pt-PT`解析为`pt-BR`，`en-US`解析为`en-GB`）；当没有匹配项时，它会回退到源语言环境（`en-GB`）。当通过标志、环境变量或`uiLanguage`明确请求UI语言但没有随附的捆绑包匹配时，CLI会打印一次性警告，指出将使用默认语言环境；仅从主机操作系统推断的语言环境从不发出警告。这与您的项目的`sourceLocale` / `targetLocales`无关。随附的UI语言：`en-GB`（源）以及`de`、`es`、`fr`、`hi-Latn`、`ja`、`ko`、`pt-BR`、`zh-Hans`和`zh-Hant`。无需配置 — 默认情况下，工具遵循您的操作系统语言环境。有关详细信息，请参阅[工具UI语言](/reference/environment-variables#tool-ui-language)。

---

<a id="documentation"></a>
## 文档

- [文档网站](https://wsj-br.github.io/ai-i18n-tools/) — 完整的VitePress指南（GitHub Pages上有9种语言环境）。
- [快速入门](/guide/quick-start) — UI字符串、文档和JSON的设置（UI、docs/`.astro`、JSON捆绑包、Astro Starlight和纯Astro）。
- [语言环境资产指南](/guide/images-and-screenshots/) - 翻译文档中的屏幕截图和插图SVG（平面链接重写器、屏幕截图脚本）。
- [架构](/reference/architecture) - 架构、内部、程序化API和扩展点。
- [AI代理上下文](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **适用于使用此包的应用程序：** 下游项目的集成提示（复制到您的仓库的代理规则中）。
- **此**仓库的维护者内部：`dev/package-context.md`（仅限克隆；不在npm上）。

---

<a id="license"></a>
## 许可证

本项目采用MIT许可证。 
有关详细信息，请参阅[LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)文件。

版权所有 &copy; 2026 Waldemar Scudeller Jr.
