<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

**使用你选择的 AI 模型翻译你的应用和文档：无锁定，无需重写。**

`ai-i18n-tools` 是一个 CLI 工具和工具包，用于国际化 JavaScript/TypeScript 应用和文档站点——包括 Docusaurus、Astro、Starlight、VitePress、Nextra、Fumadocs 以及纯 Markdown/MDX——借助大语言模型完成。

从内置预设中选择（**OpenAI**、**Anthropic**、**Google Gemini**、**NVIDIA**、**DeepSeek**、**Groq**、**Mistral**、**xAI**、**Cerebras**、**Alibaba**、**APIFUN**、**OpenRouter**、**Ollama**），或指向任何兼容 OpenAI 的 API。无需修改代码库，即可按项目甚至按语言切换提供商或模型。

一个配置文件驱动三种翻译模式，因此您可以根据内容的结构进行混合和匹配：

- **UI 字符串** — 从 JS/TS（以及可选的 `.astro` 文件）中提取 `t("…")` 调用，并为 i18next 或静态 SSG 查找生成扁平的、按语言区域划分的 JSON。
- **文档** — 使用 `translate-docs` 翻译 `docs[].contentPaths` 中列出的 Markdown、MDX 和 `.astro` 页面。支持 **VitePress**、**Starlight**、**Docusaurus**、**Nextra**、**Fumadocs**、基于 Astro 的站点，或任何从 Markdown/MDX/`.astro` 源文件读取的静态站点生成器。
- **JSON** — 翻译 `json[]` 中定义的任意嵌套 JSON 包。当 UI 文案存放在按语言区域划分的 JSON 文件中而非源码中的 `t()` 调用时，请使用 `translate-json`。

**SVG** 资产有自己的路径：`features.translateSVG`、顶级 `svg` 块和 `translate-svg`——而不是 `docs[].contentPaths`。

**我该使用哪个？**

| 您的内容                                                                  | 命令                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| 源代码使用 `t()`                                                        | **UI 字符串** — `extract` / `translate-ui` |
| 本地化页面或文档站点（VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro 等） | **文档** — `translate-docs` |
| 独立、嵌套的 JSON 区域设置文件                                          | **JSON** — `translate-json`                 |

所有这三种都共享一个文件/SQLite 缓存，因此只有新的或更改的段（字符串或文本块）才会被重新发送到模型——无论您使用哪个提供商，重新运行都快速且便宜。

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目录**

- [翻译类型](#translation-types)
- [安装](#installation)
  - [使用 CLI](#using-the-cli)
- [LLM 提供商](#llm-providers)
- [快速开始](#quick-start)
  - [界面字符串](#ui-strings)
  - [文档](#documents)
  - [VitePress](#vitepress)
  - [Nextra](#nextra)
  - [Fumadocs](#fumadocs)
  - [Astro（纯 Astro 和 Starlight）](#astro-plain-astro--starlight)
  - [组合同步](#combined-sync)
- [运行时辅助函数](#runtime-helpers)
- [CLI 命令](#cli-commands)
  - [工具 UI 语言（日志、帮助、仪表盘）](#tool-ui-language-logs-help-dashboard)
- [文档](#documentation)
- [许可证](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="translation-types"></a>
## 翻译类型

每种翻译类型都有自己的指南，其中包含完整的配置详细信息：[UI 字符串](../docs/guide/ui-strings/)、[文档](../docs/guide/documents/) 和 [JSON](../docs/guide/json.md)。有关并排比较，请参阅 [什么是 ai-i18n-tools？](../docs/guide/what-is-ai-i18n-tools.md)。

有几点需要提前了解：UI 字符串通过当前激活的 LLM 提供商（参见 [LLM 提供商](#llm-providers)）翻译各语言区域的缺失条目，并写入扁平 JSON 文件（`de.json`、`pt-BR.json`、…），以英文源文本作为运行时查找键——`strings.json` 是提取缓存，而非运行时包。文档支持 `docs[].docsOutput.style` 值 `"nested"`、`"flat"`、`"doc-system"`，以及别名 `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"`（参见 [输出布局](../docs/guide/documents/output-layouts.md)）。三者共享 `ai-i18n-tools.config.json` 并可组合使用；`sync` 会根据你的 `features` 标志依次执行提取、UI 翻译、SVG 翻译、`translate-docs` 和 `translate-json`。

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

要在交互式 shell 中输入不带前缀的 `ai-i18n-tools` 命令，请配置以下选项之一。如果不进行设置，即使在本地安装后，shell 也无法找到该二进制文件。

**direnv** — 在项目根目录的 `.envrc` 中添加（bash/zsh；参见 [direnv.net](https://direnv.net/)）：

```bash
PATH_add node_modules/.bin
```

执行 `direnv allow` 后，只要您 `cd` 进入该项目，就可以使用不带前缀的命令。

**手动配置 PATH** — 在交互式 shell 中从项目根目录执行：

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**全局安装** — 安装一次 CLI，即可从任何目录调用它：

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

全局安装使用全局固定的版本。若要按项目固定版本，建议使用 direnv 或手动配置 PATH，以便 `node_modules/.bin` 解析到项目的依赖项。

**`package.json` 脚本** — 当 npm 或 pnpm 运行脚本时，它会将 `node_modules/.bin` 前置到 `PATH`，因此无需更改 shell PATH 即可在脚本内使用不带前缀的命令名称：

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

然后运行例如 `pnpm run i18n:sync` — 脚本会解析本地二进制文件，无需额外的 shell 设置。

**替代方案** — 如果您不想调整 `PATH`：`npx ai-i18n-tools …` (npm) 或 `pnpm exec ai-i18n-tools …` (pnpm)。对于没有 `package.json` 条目且无需安装的一次性运行：`npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`。

优先使用 `sync`，而不是手动链接 `extract`、`translate-ui`、`translate-svg`、`translate-docs` 和 `translate-json`——手动运行时，顺序和功能标志很容易出错。请参阅快速入门指南中的 [推荐的 `package.json` 脚本](../docs/guide/quick-start.md#recommended-packagejson-scripts)。

为所选提供商设置 API 密钥（环境变量名称见 [LLM 提供商](#llm-providers)）：

```bash
export PROVIDER_API_KEY=sk-your-key-here
```

---

<a id="llm-providers"></a>
## LLM 提供商

翻译命令（`translate-ui`、`translate-docs`、`translate-json`、`sync`、`check-models` 及相关脚本）会调用 LLM 提供商；而 `check-markdown`、`mark-html` 和 `extract` 则不会。

在顶层的 `providers` 映射下配置提供商，并通过顶层的 `provider` 选择器选择活动的提供商（当只有一个提供商配置时是可选的）。大多数提供商只需要一个 `translationModels` 列表 — `baseUrl` 和 API 密钥环境变量来自内置预设；您可以为每个提供商覆盖 `baseUrl`、`apiKeyEnv`、`headers`、`maxTokens`、`temperature` 和 `requestTimeoutMs`。`requestTimeoutMs` 是等待每个请求的最大时间（毫秒）（默认 `30000`）。

每个提供程序块上的可选模型层级：

- `translationModels` — 全局有序回退链（翻译功能所需）。
- `uiModels` — 仅限 UI 链（`translate-ui`，复数生成，`proofread-ui`）：在匹配任何 `localeModels` 条目后尝试，但在 `translationModels` 之前。
- `localeModels` — 每个区域设置的 **所有** 管道的覆盖：每个条目将 BCP-47 区域设置映射到一个有序模型列表，仅在该区域设置下首先尝试（`pt-br` 匹配 `pt-BR`）。

解析顺序：**UI** → `localeModels(locale)` → `uiModels` → `translationModels`；**文档 / JSON / SVG** → `localeModels(locale)` → `translationModels`。重复的模型 ID 会被跳过，同时保留顺序。

若要在不编辑配置的情况下为单次运行切换提供程序，请传递全局 `-P` / `--provider <name>` 选项（例如 `ai-i18n-tools -P groq translate-ui`）；名称必须是已配置的 `providers` 键之一。

```jsonc
{
  "provider": "ollama",
  "providers": {
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "openrouter": {
      "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"],
      "uiModels": ["anthropic/claude-sonnet-latest"],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
      ]
    },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

内置提供商预设（键 — 基本 URL — API 密钥环境变量）：

| 提供商       | 基础 URL                                                  | API 密钥环境变量     |
|--------------|-----------------------------------------------------------|----------------------|
| `alibaba`    | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`  | `ALIBABA_API_KEY`    |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (无) |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `openrouter` | `https://openrouter.ai/api/v1`                            | `OPENROUTER_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |

通过添加一个带有 `baseUrl`（以及 `apiKeyEnv`，除非不需要密钥）的新键来定义自定义的 OpenAI 兼容提供商。模型 ID 是纯粹的上游 ID — 提供商在配置级别选择，因此不需要 `provider/` 前缀（OpenRouter ID 保留其原生的 `vendor/model` 格式）。

每个提供商都会报告令牌使用情况；仅当提供商返回时才显示确切的美元成本。`ai-i18n-tools check-models` 会根据当前活跃提供商的实时 `GET /models` 列表验证所有已配置的模型 ID（`translationModels`、`uiModels` 以及每个 `localeModels` 条目），并在提供商返回时显示定价。`ai-i18n-tools list-models` 会列出当前活跃提供商公布的所有模型（使用 `-P` / `--provider` 检查另一个已配置的提供商）。`ai-i18n-tools bench-models` 通过独立翻译一个样本（模型并行运行，受 `concurrency` 限制）对每个已配置的唯一模型 ID（`translationModels`、`uiModels` 和 `localeModels`）进行基准测试，并打印每个模型的输入/输出令牌数、实际运行时间和美元成本。

有关使用 `-P` 在单个文档上切换提供程序的动手演示，请参阅 [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/)。

---

<a id="quick-start"></a>
## 快速开始

请先为不带前缀的命令配置您的 shell — 参见 [使用 CLI](#using-the-cli)。

<a id="ui-strings"></a>
### UI 字符串

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
ai-i18n-tools init [-P <provider>]

# 2. Extract UI strings to strings.json
ai-i18n-tools extract

# 3. Translate to all target locales
ai-i18n-tools translate-ui
```

然后使用 `'ai-i18n-tools/runtime'` 中的辅助函数在您的应用程序中连接 i18next。有关完整设置，请参阅 UI 字符串指南中的 [步骤 4：在运行时连接 i18next](../docs/guide/ui-strings/i18next-runtime.md)。

<a id="documents"></a>
### 文档

默认的 `init` 模板（`ui-markdown`）仅启用 UI 提取。在 `translate-docs` 之前，请使用面向文档的模板（或启用 `features.translateDocs` 并添加 `docs[]`）：

```bash
# Docusaurus docs + optional write-translations catalog
ai-i18n-tools init -t ui-docusaurus [-P <provider>]

# Astro Starlight documentation
# ai-i18n-tools init -t ui-starlight [-P <provider>]

# VitePress documentation (pages + theme catalog)
# ai-i18n-tools init -t ui-vitepress [-P <provider>]

# Nextra documentation (pages + _meta.ts + theme dictionary)
# ai-i18n-tools init -t ui-nextra [-P <provider>]

# Fumadocs documentation (pages + meta.json + UI catalog)
# ai-i18n-tools init -t ui-fumadocs [-P <provider>]

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# ai-i18n-tools init -t ui-astro-website [-P <provider>]

ai-i18n-tools translate-docs
ai-i18n-tools status
# ai-i18n-tools translate-docs --locale de   # single locale
```

编辑 `ai-i18n-tools.config.json`：将 `docs[].contentPaths` 设置为 markdown、MDX 和/或 `.astro` 源；`docs[].outputDir` 和 `docs[].docsOutput.style`（`"docusaurus"`、`"astro-starlight"`、`"vitepress"`、`"nextra"`、`"fumadocs"`、`"flat"` 等）。完整字段参考：[文档](../docs/guide/documents/)。

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` 会搭建 `docsOutput.style: "vitepress"` 以及用于导航/侧边栏/页脚字符串的 `docsOutput.vitepressThemeCatalog`。运行 `sync` 可同时翻译页面 Markdown 和主题目录 —— 无需单独的 JSON 流水线。参见 [VitePress 集成](../docs/guide/integrations/vitepress.md) 和 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/)。

<a id="nextra"></a>
### Nextra

`init -t ui-nextra` 会搭建 `docsOutput.style: "nextra"`。`translate-docs` 会自动收集并翻译 `_meta.ts` 侧边栏标签；设置 `docs[].nextraDictionaryPath` 可同时翻译主题字典模块（例如 `app/_dictionaries/en.ts`）—— 所有这些都在同一次 `sync` 运行中完成，无需 JSON 附属文件。参见 [Nextra 集成](../docs/guide/integrations/nextra.md) 和 [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/)。

<a id="fumadocs"></a>
### Fumadocs

`init -t ui-fumadocs` 会使用点解析器（默认）或用于 Nextra 风格语言环境文件夹的目录解析器来搭建 `docsOutput.style: "fumadocs"`。`translate-docs` 会自动收集并翻译 `meta.json` 侧边栏标签；设置 `docsOutput.fumadocsUiCatalog` 可同时翻译 `lib/layout.shared.ts` 中的 UI 覆盖项 —— 所有这些都在同一次 `sync` 运行中完成，无需 JSON 附属文件。参见 [Fumadocs 集成](../docs/guide/integrations/fumadocs.md) 和 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/)。

<a id="astro-plain-astro--starlight"></a>
### Astro（纯 Astro 和 Starlight）

**Astro Starlight** — `init -t ui-starlight`，然后是 `translate-docs`。Starlight UI 覆盖可以在需要时使用 `src/content/i18n/en.json` 和 `jsonPathTemplate` 在单独的 `docs[]` 块中（[文档 — 为文档初始化](../docs/guide/documents/index.md#step-1-initialise-for-documentation))。

**纯 Astro**（营销或应用程序站点，而非 Starlight）— 将 [Astro 内置 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 与 ai-i18n-tools 结合使用。参考项目：[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)（英文在 `/`，区域设置在 `/{locale}/`）。

大多数团队使用两种管道的**混合体**：

| 管道               | 用于                                                              | 命令                   | 输出                                                 |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **页面 HTML**          | 模板正文中的标题、段落、导航标签、内联数组 | `translate-docs`           | 每个区域设置的 `src/pages/{locale}/index.astro`            |
| **UI 字符串（`t()`）** | 前端数据、选项卡标签、共享数组 | `extract` → `translate-ui` | `public/locales/{locale}.json`（以英文原文作为键） |

使用 `init -t ui-astro-website` 搭建 UI。对于 `.astro` 页面中的硬编码 HTML，启用 `features.translateDocs` 并添加一个包含 `docs[]` 的 `docsOutput.style: "astro-starlight"` 块（请参阅 [Astro 网站页面（解析和替换）](../docs/guide/ui-strings/astro-website.md#astro-website-pages-parse-and-replace))。保持 `targetLocales`、`i18n.locales` 在 `astro.config.mjs` 中以及 `ui-languages.json` 对齐（Astro 路由使用小写代码，例如 `pt-br`；平面捆绑文件名遵循配置大小写，例如 `pt-BR.json`）。

在构建时连接 `t()`，除非您添加客户端岛屿，否则无需 i18next — 请参阅 [Astro 网站 UI 字符串 (SSG)](../docs/guide/ui-strings/astro-website.md#astro-website-ui-strings-ssg) 和示例的 `src/i18n/t.ts`。

<a id="combined-sync"></a>
### 组合同步

```bash
ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
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
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>] [--with-translate-ignore]
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

对于纯 HTML 应用程序，使用裸 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 标记注释元素（源文本取自元素自身的 textContent / title / placeholder，只写入一次）；`mark-html` 为您插入它们，然后 `extract` 将它们捕获到 `strings.json` 中。请参阅 [标记 HTML 以进行翻译](../docs/guide/ui-strings/plain-html.md#marking-html-for-translation)。

完整的各命令标志列表见[CLI 参考](../docs/reference/cli-commands/)。运行 `ai-i18n-tools <command> --help` 查看内置用法文本。

全局选项：`-c <config>`（默认：`ai-i18n-tools.config.json`）、`-v`（详细）、`-P` / `--provider <name>`（覆盖当前活跃的 LLM 提供商；必须在 `providers` 下配置）、`-L` / `--ui-lang <code>`（工具自身界面/日志的语言）、`-V` / `--version`，以及 `-h` / `--help` — 适用于所有命令。`-w` / `--write-logs [path]` 将控制台输出同时写入日志文件（默认：位于翻译缓存目录下），但仅在翻译和同步命令（`translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync-ui`、`sync`、`cleanup`）上生效。部分命令接受 `-l` / `--locale <codes>`（逗号分隔的 BCP-47）以限制目标区域设置；`proofread-ui` 使用单一源区域设置。命令概览请参见 [CLI 参考](../docs/reference/cli-commands/)。

<a id="tool-ui-language-logs-help-dashboard"></a>
### 工具 UI 语言（日志、帮助、仪表板）

该工具独立于您翻译的语言环境，对其自身的 CLI 帮助、日志摘要和翻译仪表板进行本地化。默认情况下，它遵循您的操作系统语言环境；在配置中使用 `-L pt-BR`、`export AI_I18N_LANG=es` 或 `"uiLanguage"` 进行覆盖。有关语言环境解析、内置语言和仪表板行为，请参阅[工具 UI 语言](../docs/guide/tool-ui-language.md)。

---

<a id="documentation"></a>
## 文档

- [文档站点](https://wsj-br.github.io/ai-i18n-tools/) — VitePress 指南（GitHub Pages 上有 9 种语言）；精简的入口，包含指向完整指南的链接。
- [快速开始](../docs/guide/quick-start.md) — UI 字符串、文档和 JSON 的设置（UI、docs/`.astro`、JSON 包、VitePress、Nextra、Fumadocs、Astro Starlight 和纯 Astro）。
- [本地化资源指南](../docs/guide/images-and-screenshots/) - 翻译文档中的截图和带插图的 SVG（扁平链接重写器、截图脚本）。
- [架构](../docs/reference/architecture.md) - 架构、内部原理、编程式 API 和扩展点。
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **对于使用该包的应用：** 面向下游项目的集成提示（复制到你的仓库的代理规则中）。
- **本**仓库的维护者指南：`AGENT.md`（规则与工作流；仅限克隆；不在 npm 上）。流水线参考：`docs/reference/`。本地开发与发布：`dev/DEVEL.md`。

---

<a id="license"></a>
## 许可证

本项目采用MIT许可证。 
有关详细信息，请参阅[LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)文件。

版权所有 &copy; 2026 Waldemar Scudeller Jr.
