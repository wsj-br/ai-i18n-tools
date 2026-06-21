<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools：入门指南

`ai-i18n-tools` 包提供了三种独立且模块化的流程：

- **流程 1 - UI 翻译**：从任意 JS/TS 源码中提取 `t("…")` 调用，通过 OpenRouter 进行翻译，并生成适用于 i18next 的按语言划分的扁平 JSON 文件。
- **流程 2 - 文档翻译**：通过 `translate-docs` 翻译 `docs[].contentPaths` 中列出的 **Markdown、MDX 和 `.astro` 页面**，支持智能缓存。当启用 `features.translateDocs` 时，可同时翻译可选的 **Docusaurus 目录 JSON**（`docs[].docusaurusCatalogDir`，来自 `docusaurus write-translations`）——即站点界面（导航栏、页脚、主题字符串），而非 `docs/` 中的正文内容。
- **流程 3 - JSON 文件翻译**：通过顶层的 `json[]`、`features.translateJson` 和 `translate-json` 翻译任意嵌套的 JSON 包（例如 `src/i18n/en/translation.json`）——适用于将 UI 文本存储在按语言划分的 JSON 文件中而非源码中使用 `t()` 的网站。

**SVG** 资源使用 `features.translateSVG`、顶层的 `svg` 块以及 `translate-svg`（参见 [CLI 参考文档](#cli-reference)）。

**该选择哪个流程？**

- 源码中通过 `t()` 使用的面向用户的字符串 → 流程 1（`extract` / `translate-ui`）。
- 需要本地化的页面或 Docusaurus 外壳 JSON → 流程 2（`translate-docs`）。
- 仅需翻译独立的嵌套 JSON 语言文件 → 流程 3（`translate-json`）。

所有三个流程均使用 OpenRouter（任何兼容的 LLM）并共享一个配置文件。

<small>**以其他语言阅读：** </small>
<small id="lang-list">[English (UK)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [Hindi (Roman)](./GETTING_STARTED.hi-Latn.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [简体中文](./GETTING_STARTED.zh-Hans.md) · [繁體中文](./GETTING_STARTED.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目录**

- [安装](#installation)
  - [使用 CLI](#using-the-cli)
- [快速开始](#quick-start)
  - [推荐的 `package.json` 脚本](#recommended-packagejson-scripts)
- [流程 1 - UI 翻译](#workflow-1---ui-translation)
  - [步骤 1：初始化](#step-1-initialise)
  - [步骤 2：提取字符串](#step-2-extract-strings)
  - [Astro 网站（纯 Astro，非 Starlight）](#astro-website-plain-astro-not-starlight)
  - [Astro 网站 UI 字符串（SSG）](#astro-website-ui-strings-ssg)
  - [Astro 网站页面（解析并替换）](#astro-website-pages-parse-and-replace)
  - [步骤 3：翻译 UI 字符串](#step-3-translate-ui-strings)
  - [导出为 XLIFF 2.0（可选）](#exporting-to-xliff-20-optional)
  - [步骤 4：运行时集成 i18next](#step-4-wire-i18next-at-runtime)
    - [保持 `SOURCE_LOCALE` 同步](#keeping-source_locale-aligned)
    - [语言加载器](#locale-loaders)
    - [运行时辅助函数参考](#runtime-helpers-reference)
  - [在源码中使用 `t()`](#using-t-in-source-code)
  - [插值](#interpolation)
  - [基数复数（`plurals: true`）](#cardinal-plurals-plurals-true)
    - [复数的存储与输出方式](#how-plurals-are-stored-and-emitted)
  - [语言切换器 UI](#language-switcher-ui)
  - [RTL 语言](#rtl-languages)
- [流程 2 - 文档翻译](#workflow-2---document-translation)
  - [步骤 1：文档初始化](#step-1-initialise-for-documentation)
  - [步骤 2：翻译文档](#step-2-translate-documents)
    - [复杂 Markdown 和质量检查失败](#complex-markdown-and-failed-quality-checks)
    - [缓存行为与 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags)
    - [批量提示格式](#batch-prompt-format)
    - [SQLite 中的片段去重与路径](#segment-dedupe-and-paths-in-sqlite)
  - [输出布局](#output-layouts)
    - [启用 `docsOutput.style = "flat"` 时的锚点链接](#anchor-links-when-docsoutputstyle--flat)
    - [翻译文档中的图片与光栅资源](#images-and-raster-assets-in-translated-docs)
    - [语言切换器（`languageListBlock`）](#language-switcher-languagelistblock)
    - [`pathTemplate` / `jsonPathTemplate` 占位符](#pathtemplate--jsonpathtemplate-placeholders)
  - [故障排除](#troubleshooting)
- [流程 3 - JSON 文件翻译](#workflow-3---json-file-translation)
  - [步骤 1：为嵌套 JSON 初始化](#step-1-initialise-for-nested-json)
  - [步骤 2：配置 `json[]`](#step-2-configure-json)
  - [步骤 3：翻译 JSON 包](#step-3-translate-json-bundles)
  - [流程 3 与其他流水线的对比](#workflow-3-vs-other-pipelines)
- [组合流程（UI + 文档）](#combined-workflow-ui--docs)
  - [混合文档流程（`docsOutput.style = "docusaurus"` + `"flat"`）](#mixed-documentation-workflow-docsoutputstyle--docusaurus--flat)
- [翻译仪表板](#translation-dashboard)
  - [失败（文档翻译）](#failures-document-translation)
    - [何时使用](#when-to-use-it)
    - [为何源码修改很重要](#why-source-edits-matter)
    - [如何使用该标签页](#how-to-use-the-tab)
  - [Markdown 问题（静态检查）](#markdown-issues-static-checks)
- [配置参考](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath`（可选）](#uilanguagespath-optional)
  - [`concurrency`（可选）](#concurrency-optional)
  - [`batchConcurrency`（可选）](#batchconcurrency-optional)
  - [`fileConcurrency`（可选）](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars`（可选）](#batchsize--maxbatchchars-optional)
  - [`provider` 和 `providers`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [Git 排除的最佳实践：](#best-practice-for-git-exclusions)
  - [`docs`](#docs)
  - [`json`](#json)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLI 参考](#cli-reference)
  - [根选项和全局选项](#root-and-global-options)
  - [命令帮助](#per-command-help)
  - [目标区域设置（`-l` / `--locale`）](#target-locales--l----locale)
- [环境变量](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## 安装

发布的包是 **仅 ESM**。在 Node.js 或打包器中使用 `import`/`import()`；不要使用 `require('ai-i18n-tools')`。该包声明了 `engines.node` `>=22.16.0`；不支持旧版 Node.js。npm tarball 仅在 `docs/` 下包含英文文件；`translated-docs/` 下的特定区域设置副本位于 [GitHub 仓库](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) 中。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools 包含自己的字符串提取器。如果您之前使用了 `i18next-scanner`、`babel-plugin-i18next-extract` 或类似的工具，可以在迁移后移除这些开发依赖项。

<a id="using-the-cli"></a>
### 使用 CLI

**每个项目（推荐）** — 安装为依赖项或开发依赖项，然后通过 `npx`、`pnpm exec` 或 `package.json` 脚本调用。`package.json` 脚本已在 `PATH` 上使用 `node_modules/.bin` 运行，因此像 `pnpm run i18n:sync` 这样的命令无需键入 `npx` 即可调用 CLI。

**裸用** `ai-i18n-tools` **在终端中：** 要在交互式 shell 中直接运行 CLI（从项目根目录，本地安装后），请将本地 bin 目录添加到 `PATH` 的前面：

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

使用 [**direnv**](https://direnv.net/) 时，将 `PATH_add node_modules/.bin` 添加到项目根目录下的 `.envrc` 中，这样在 `cd` 进入仓库后即可使用裸命令。如果不调整 `PATH`，请继续使用 `npx ai-i18n-tools …` 或 `pnpm exec ai-i18n-tools …`。

**零安装一次性使用** — `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（为该次调用下载包；`package.json` 中没有条目）。

在 Linux、macOS 和 WSL 上，注册表安装会自动为 CLI 脚本设置可执行位。在 Windows 上，包管理器会生成 `.cmd` 和 `.ps1` 包装器，它们会显式调用 Node。

设置您的提供商 API 密钥（显示 OpenRouter；使用与您当前活动提供商匹配的环境变量 — 请参阅 [预设表](#openrouter))：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

或在项目根目录中创建一个 `.env` 文件：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## 快速入门

默认的 `init` 模板（`ui-markdown`）仅启用 **UI** 提取和翻译。`ui-docusaurus` 和 `ui-starlight` 模板启用 **文档**翻译（`translate-docs`）。`ui-astro-website` 模板为纯 Astro 应用（包括 `.astro` 文件）构建 **UI** 提取；当您还想要 `translate-docs` 用于 `.astro` 页面 HTML 时，请添加一个 `docs[]` 块（请参阅 [Astro 网站页面（解析和替换）](#astro-website-parse-and-replace))。参考 [`examples/astro-website`](../../docs/../examples/astro-website/) 使用 **两者**管道。当您需要一个命令根据配置运行提取、UI 翻译、可选 SVG 文件翻译和文档翻译时，请使用 `sync`。

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# Workflow 3 - nested JSON bundles (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 推荐的 `package.json` 脚本

在本地安装了该包后，您可以直接在脚本中使用 CLI 命令（无需 `npx`）。

**优先使用** `sync` 来处理任何以前需要“运行 `translate-ui`，然后 `translate-svg`，然后 `translate-docs`，然后 `translate-json`”的操作：`ai-i18n-tools sync` 根据您的配置按正确的顺序并使用共享标志运行 **提取**（启用时）、**翻译 UI**、可选的 **翻译 SVG**、**翻译文档**，然后是可选的 **翻译 JSON**。手动链接这些步骤很容易出错（顺序、提取、区域设置标志）。仅在需要 **单个**步骤隔离时才使用 `i18n:translate:ui`、`i18n:translate:svg`、`i18n:translate:docs` 和 `i18n:translate:json`。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## 工作流 1 - UI 翻译

专为使用 i18next 的任何 JS/TS 项目设计：React 应用、Next.js（客户端和服务器组件）、Node.js 服务、CLI 工具。

<a id="step-1-initialise"></a>
### 步骤 1：初始化

```bash
npx ai-i18n-tools init
```

这将使用 `ui-markdown` 模板写入 `ai-i18n-tools.config.json`。编辑它来设置：

- `sourceLocale` - 您的源语言 BCP-47 代码（例如 `"en-GB"`）。**必须与** `SOURCE_LOCALE` 中从运行时 i18n 设置文件中导出的代码匹配（`src/i18n.ts` / `src/i18n.js`）。
- `targetLocales` - 目标语言的 BCP-47 代码数组（例如 `["de", "fr", "pt-BR"]`）。运行 `generate-ui-languages` 以从此列表创建 `ui-languages.json` manifest。
- `ui.sourceRoots` - 要扫描 `t("…")` 调用的目录或 glob 模式（例如 `["src/"]`、`["src/**/*.ts"]`）。
- `ui.stringsJson` - 主目录的写入位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 写入 `de.json`、`pt-BR.json` 等的位置（例如 `"src/locales/"`）。
- `ui.preferredModel`（可选）- 尝试**首先**用于 `translate-ui` 的模型 ID；失败后，CLI 会按顺序继续使用活动提供商的 `translationModels`，跳过重复项。

<a id="step-2-extract-strings"></a>
### 步骤 2：提取字符串

```bash
npx ai-i18n-tools extract
```

扫描 `ui.sourceRoots` 下的所有 JS/TS 文件中的 `t("literal")` 和 `i18n.t("literal")` 调用。写入（或合并到）`ui.stringsJson`。

扫描器是可配置的：通过 `ui.uiExtractor.funcNames`（或旧版 `ui.reactExtractor.funcNames`）添加自定义函数名称。对于 Astro 页面和组件，将 `.astro` 添加到 `ui.uiExtractor.extensions`。

<a id="astro-website-plain-astro-not-starlight"></a>
### Astro 网站（纯 Astro，非 Starlight）

对于静态 Astro 营销或应用网站，请将 [Astro 内置 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 与 ai-i18n-tools 结合使用。参考实现是 [`examples/astro-website`](../../docs/../examples/astro-website/)（另请参阅其 [README](../../docs/../examples/astro-website/README.md)）：英语在 `/`，九个目标语言在 `/{locale}/`（`de`、`fr`、`es`、`ar`、`ja`、`ko`、`zh-cn`、`zh-tw`、`pt-br`）。

大多数团队使用两个管道的**混合**（它们不会冲突）：

| 管道 | 用于 | 命令 | 输出 |
|----------|---------|----------|--------|
| **页面 HTML** | 模板正文中的标题、段落、导航标签、内联数组 | `translate-docs` | 每个区域设置 `src/pages/{locale}/index.astro` |
| **UI 字符串（`t()`）** | Frontmatter 数据、屏幕截图选项卡标签、共享数组 | `extract` → `translate-ui` | `public/locales/{locale}.json`（英语源作为键）|

添加或删除语言时，请保持三个列表同步：`targetLocales` 在 `ai-i18n-tools.config.json` 中，`i18n.locales` 在 `astro.config.mjs` 中（Astro 使用**小写**路由代码，例如 `pt-br`），以及 `ui-languages.json`（通过 `generate-ui-languages`）。Flat bundle **文件名**使用配置的大小写（`pt-BR.json`）；通过您的 manifest `code` 字段将 Astro 的 `pt-br` 路由映射到该文件（请参阅 `examples/astro-website/src/i18n/locale.ts`）。

示例 `package.json` 脚本（来自参考项目）：

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="astro-website-ui-strings-ssg"></a>
### Astro 网站 UI 字符串（SSG）

使用 `init -t ui-astro-website` 脚手架 UI 提取，然后在翻译页面 HTML 时（见下文）合并 `docs[]` 块。在 TypeScript 模块和 `.astro` frontmatter 中（以及模板 `{expression}` 块中，如果您偏好 UI 字符串而不是重复的语言页面）使用 `t('…')` 包装文本：

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

将 `sourceLocale` 设置为匹配 `astro.config.mjs` 中的 `i18n.defaultLocale`。将 flat bundles 写入 Astro 在构建时可以导入的目录（模板使用 `public/locales/`）。在**构建时**通过查找英语源字面量作为键来解析 `t('…')`（请参阅 `examples/astro-website/src/i18n/t.ts`；`strings.json` 是提取缓存，而不是运行时 bundle）。除非您添加了在加载后切换语言的客户端 island，否则对于静态站点，您**不需要** `ai-i18n-tools/runtime` 或 i18next。

连接每个调用 `t()` 的页面（英语根页面和每个 `src/pages/{locale}/` 副本）：

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

示例中的支持助手：`src/i18n/utils.ts`、`src/i18n/locale.ts` 和 `ui-languages.json` 用于标签、方向和 BCP-47 代码。在更改 `targetLocales` 后运行 `generate-ui-languages`（可选地设置 `ui.uiLanguagesPath`，以便 manifest 位于您的助手旁边，例如 `src/i18n/ui-languages.json`）。`MainLayout.astro` 从 `resolveUiLanguage(Astro.currentLocale)` 设置 `<html lang>` 和 `<html dir>`；`LanguagePicker.astro` 使用 `astro:i18n` 中的 `getRelativeLocaleUrl`。

<a id="astro-website-pages-parse-and-replace"></a>
### Astro 网站页面（解析和替换）

对于在 `.astro` 文件中具有硬编码 HTML 的营销页面，让 `translate-docs` 提取文本节点和属性（`alt`、`title`、`aria-label`、`placeholder`），使用文档缓存翻译它们，并在您的页面树下写入特定语言的副本。对于大多数可见文本，您**不需要** `t()`。

结构属性和键值默认情况下不会被**翻译**：内置保护涵盖了 JSX/HTML 属性，例如 `class`、`id`、`style`、`src`、`href`、`data-*`，以及模板 `{expression}` 块内的多数 `aria-*`，还有像 `class`、`key` 和 `id` 这样的对象键。当您使用自定义属性（例如 Tailwind `variant` 或 CMS `slug` 字段）时，请使用 `docs[].protectAttributes` 和 `docs[].protectKeys` 来扩展这些列表。同样的选项也适用于 MDX JSX 在进行 Markdown 翻译时（请参阅 [protectAttributes / protectKeys](#protectattributes-protectkeys))。

启用 `features.translateDocs` 并添加一个 `docs[]` 块，例如：

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

运行 `npx ai-i18n-tools translate-docs`（或 [`examples/astro-website`](../../docs/../examples/astro-website/) 中的 `pnpm i18n:translate`）。英文源文件保留在 `src/pages/index.astro`；每个目标语言环境都会获得一个 `src/pages/{locale}/index.astro`，其导入会根据额外的目录级别进行调整（例如 `../layouts/` → `../../layouts/`）。

在 **模板正文**中，`{expression}` 块中的字符串字面量（内联数组、对象 `title`/`desc` 字段）在面向用户时会被翻译；受保护属性/键上的带引号值，以及 `t('…')`、`<script>` 和 `<style>` 内的字面量将保持不变。**前端 TypeScript 不会被翻译**——保持共享前端（包括 `t()` 导入和数据数组）在英文和本地化页面上保持一致，或者在编辑英文页面后重新运行 `translate-docs`，以便本地化副本能够获取前端更改。仅复制前端内容，请改用 [UI 字符串管道](#astro-website-ui-strings)。

请参阅 [`examples/astro-website`](../../docs/../examples/astro-website/) 查看完整的混合着陆页（HTML 通过 `translate-docs`，屏幕截图标签通过 `t()` + `translate-ui`）。

<a id="step-3-translate-ui-strings"></a>
### 步骤 3：翻译 UI 字符串

```bash
npx ai-i18n-tools translate-ui
```

读取 `strings.json`，将批次发送给每个目标语言环境的活动 LLM 提供商，将扁平化 JSON 文件（`de.json`、`fr.json` 等）写入 `ui.flatOutputDir`。当设置了 `ui.preferredModel` 时，该模型会在尝试活动提供商的 `translationModels` 列表之前被调用（文档翻译和其他命令仅使用提供商的列表）。

对于每个条目，`translate-ui` 会将成功翻译每个语言环境的 **OpenRouter 模型 ID** 存储在一个可选的 `models` 对象中（与 `translated` 具有相同的语言环境键）。在本地 `dashboard` 命令中编辑的字符串会在该语言环境的 `models` 中被标记为哨兵值 `user-edited`。`ui.flatOutputDir` 下的每个语言环境的扁平化文件仅保留 **源字符串 → 翻译**；它们不包含 `models`（因此运行时包保持不变）。

> **注意：** 如果您在翻译仪表板中编辑条目，则需要运行 `sync --force-update`（或等效的带有 `--force-update` 的 `translate` 命令）来使用更新的缓存条目重写输出文件。另外，请记住，如果源文本稍后发生更改，您的手动编辑将会丢失，因为新的源字符串将生成一个新的缓存键（哈希）。

<a id="exporting-to-xliff-20-optional"></a>
### 导出到 XLIFF 2.0（可选）

要将 UI 字符串移交给翻译供应商、TMS 或 CAT 工具，请将目录导出为 **XLIFF 2.0**（每个目标语言环境一个文件）。此命令是 **只读** 的：它不会修改 `strings.json` 或调用任何 API。

```bash
npx ai-i18n-tools export-ui-xliff
```

默认情况下，文件会写入 `ui.stringsJson` 旁边，命名方式类似于 `strings.de.xliff`、`strings.pt-BR.xliff`（您的目录的基本名称 + 语言环境 + `.xliff`）。使用 `-o` / `--output-dir` 写入其他位置。来自 `strings.json` 的现有翻译会出现在 `<target>` 中；缺失的语言环境会使用 `state="initial"` 且没有 `<target>`，以便工具可以填充它们。使用 `--untranslated-only` 仅导出每个语言环境仍需要翻译的单元（对供应商批次很有用）。`--dry-run` 会打印路径而不写入文件。

<a id="step-4-wire-i18next-at-runtime"></a>
### 步骤 4：在运行时集成 i18next

使用 `'ai-i18n-tools/runtime'` 导出的辅助函数创建您的 i18n 设置文件：

<details>
<summary>完整的 i18n 引导示例 (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

<a id="keeping-source_locale-aligned"></a>
#### 保持 `SOURCE_LOCALE` 同步

**保持三个值对齐：** `sourceLocale` 在 `ai-i18n-tools.config.json` 中，`SOURCE_LOCALE` 在此文件中，以及扁平化 JSON `translate-ui` 在您的扁平化输出目录（通常是 `public/locales/`）下写入为 `{sourceLocale}.json`。在静态 `import` 中使用相同的基本名称（上面的示例：`en-GB` → `en-GB.json`）。`sourcePluralFlatBundle` 中的 `lng` 字段必须等于 `SOURCE_LOCALE`。静态 ES `import` 路径不能使用变量；如果您更改源语言环境，请同时更新 `SOURCE_LOCALE` 和导入路径。或者，使用动态 `import(\` 加载该文件。/public/locales/${SOURCE_LOCALE}.json\`)`、`fetch` 或 `readFileSync`，以便路径从 `SOURCE_LOCALE` 构建。

该代码段使用 `./locales/…` 和 `./public/locales/…`，就好像 `i18n` 位于这些文件夹旁边一样。如果您的文件位于 `src/`（典型情况）下，请使用 `../locales/…` 和 `../public/locales/…`，以便导入解析到与 `ui.stringsJson`、`uiLanguagesPath` 和 `ui.flatOutputDir` 相同的路径。

在 React 渲染之前导入 `i18n.js`（例如，在入口点的顶部）。当用户更改语言时，调用 `await loadLocale(code)` 然后调用 `await i18n.changeLanguage(code)`。

`SOURCE_LOCALE` 被导出，因此任何需要它的其他文件（例如语言切换器）都可以直接从 `'./i18n'` 导入。如果您正在迁移现有的 i18next 设置，请用从您的 i18n 引导文件中导入 `SOURCE_LOCALE` 来替换任何硬编码的源语言环境字符串（例如，分布在组件中的 `'en-GB'` 检查）。

如果您不希望使用默认导出，命名导入（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`）的工作方式相同。

<a id="locale-loaders"></a>
#### 语言环境加载器

通过使用 `makeLocaleLoadersFromManifest` 从 `ui-languages.json` 派生它们，将 `localeLoaders` **与配置对齐**（这会使用与 `makeLoadLocale` 相同的规范化方法过滤掉 `SOURCE_LOCALE`）。当您将语言环境添加到 `targetLocales` 并运行 `generate-ui-languages` 时，清单会更新，并且您的加载器会自动跟踪更改 — 无需维护单独的硬编码映射。

对于 `public/` 下的 JSON 包（典型的 Next.js 设置），请从您的公共 URL 路径获取：

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

对于没有打包器的 Node CLI，请在小的辅助函数中使用 `readFileSync`，该函数为每个代码读取和解析 JSON 文件。

<a id="runtime-helpers-reference"></a>
#### 运行时辅助函数参考

`aiI18n.defaultI18nInitOptions(sourceLocale)` 返回 key-as-default 设置的标准选项：

- `parseMissingKeyHandler` 返回键本身，因此未翻译的字符串会显示源文本。
- `nsSeparator: false` 允许包含冒号的键。
- `interpolation.escapeValue: false` — 可以安全禁用：React 会自行转义值，而 Node.js/CLI 输出没有 HTML 需要转义。

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` 是 ai-i18n-tools 项目的 **推荐**配置：它应用 key-trim + source-locale <code>"{{var}}"</code> 插入回退（与低级 `wrapI18nWithKeyTrim` 行为相同），可选地通过 `addResourceBundle` 合并 `translate-ui` `{sourceLocale}.json` 带有复数后缀的键，然后从您的 `strings.json` 安装支持复数的 `wrapT`。仅在引导过程中省略 `sourcePluralFlatBundle`（一旦 `translate-ui` 发出了 `{sourceLocale}.json`，就合并它）。`wrapI18nWithKeyTrim` 本身对于应用程序代码是 **已弃用** — 请改用 `setupKeyAsDefaultT`。

`makeLoadLocale(i18n, loaders, sourceLocale)` 返回一个异步 `loadLocale(lang)` 函数，该函数动态导入某个语言环境的 JSON 包并将其注册到 i18next。

<a id="using-t-in-source-code"></a>
### 在源代码中使用 `t()`

使用 **字面字符串**调用 `t()`，以便提取脚本可以找到它：

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

在 React 之外（Node.js、服务器组件、CLI）也适用相同的模式：

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**规则：**

- 仅提取以下形式：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")`。
- 键必须是 **字面字符串** — 键不能是变量或表达式。
- 请勿对键使用模板字面量：<code>{'t(`Hello ${name}`)'}</code> 是不可提取的。

<a id="interpolation"></a>
### 插入

使用 i18next 的原生第二个参数插值来处理 <code>"{{var}}"</code> 占位符：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

extract 命令会解析 **第二个参数**（当它是一个纯粹的对象字面量时），并读取仅用于工具的标志，例如 `plurals: true` 和 `zeroDigit`（参见下文的 **基数复数**）。对于普通字符串，仅使用字面量键进行哈希处理；插值选项仍会在运行时传递给 i18next。

如果您的项目使用自定义插值实用程序（例如，调用 `t('key')` 然后将结果通过类似 `interpolateTemplate(t('Hello {{name}}'), { name })` 的模板函数进行管道处理），`setupKeyAsDefaultT`（通过 `wrapI18nWithKeyTrim`）将使该操作变得不必要——即使源语言环境返回原始键，它也会应用 <code>"{{var}}"</code> 插值。将调用站点迁移到 `t('Hello {{name}}', { name })` 并移除自定义实用程序。

<a id="cardinal-plurals-plurals-true"></a>
### 基数复数（`plurals: true`）

使用您想要作为开发者默认副本的 **相同字面量**，并传递 `plurals: true`，以便 extract + `translate-ui` 将调用视为一个 **基数复数组**（i18next JSON v4 风格的 `_zero` … `_other` 形式）。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit`（可选）— 仅用于工具；i18next **不**读取。当 `true` 时，提示会在每个存在该形式的语言环境中，在 `_zero` 字符串中优先使用阿拉伯数字 `0`；当 `false` 或省略时，则使用自然的零表示法。在调用 `i18next.t` 之前剥离这些键（参见下文的 `wrapT`）。

**验证：** 如果消息包含 **两个或更多**不同的 `{{…}}` 占位符，**其中一个必须是** `{{count}}`（复数轴）。否则 `extract` 将 **失败**并显示清晰的文件/行消息。

**两个独立的计数**（例如，章节和页数）不能共享一个复数消息 — 使用 **两个** `t()` 调用（每个调用都带有 `plurals: true` 和其自己的 `count`）并在 UI 中连接。

**v1 中没有：** 序数复数（`_ordinal_*`、`ordinal: true`）、区间复数、仅 ICU 的管道。

<a id="how-plurals-are-stored-and-emitted"></a>
#### 复数如何存储和输出

**在** `strings.json` 复数组中，使用 **每个哈希一行**，其中包含 `"plural": true`（原始字面量）、`source`（原始字面量），以及 `translated[locale]`（一个映射基数类别（`zero`、`one`、`two`、`few`、`many`、`other`）到该语言环境的字符串的对象）。

**扁平化语言环境 JSON：** 非复数行保持 **源句子 → 翻译**。复数行将输出为 `<groupId>_original`（等于 `source`，供参考）和 `<groupId>_<form>`（针对每个后缀），以便 i18next 原生解析复数。`translate-ui` 还会写入 `{sourceLocale}.json`，其中 **仅包含**复数扁平化键（加载此捆绑包以获取源语言，以便带后缀的键可以解析；纯字符串仍使用键作为默认值）。对于每个目标语言环境，输出的后缀键与该语言环境的 `Intl.PluralRules` 匹配（`requiredCldrPluralForms`）：如果 `strings.json` 省略了某个类别，因为它在压缩后与其他类别匹配（例如，阿拉伯语 `many` 与 `other` 相同），`translate-ui` 仍会通过从备用同级字符串复制来写入每个必需的后缀，以确保运行时查找永远不会错过键。

运行时（`ai-i18n-tools/runtime`）：**调用** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — 它会运行 `wrapI18nWithKeyTrim`，注册可选的 `translate-ui` `{sourceLocale}.json` 复数捆绑包，然后使用 `buildPluralIndexFromStringsJson(stringsJson)` 进行 `wrapT`。`wrapT` 会剥离 `plurals` / `zeroDigit`，在需要时将键重写为组 ID，并转发 `count`（可选：如果存在单个非 `{{count}}` 占位符，`count` 将从该数字选项中复制）。

**旧环境：** `Intl.PluralRules` 是工具和保持行为一致所必需的；如果您的目标是旧版浏览器，请进行 polyfill。

<a id="language-switcher-ui"></a>
### 语言切换器 UI

使用 `ui-languages.json` manifest 来构建语言选择器。`ai-i18n-tools` 导出了两个显示助手：

<details>
<summary>示例 LanguageSelect 组件（React）</summary>

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    await i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

</details>

<br />

`getUILanguageLabel(lang, t)` — 当翻译时显示 `t(englishName)`，或者当两者不同时显示 `englishName / t(englishName)`。适用于设置屏幕。

`getUILanguageLabelNative(lang)` — 显示 `englishName / label`（每行不调用 `t()`）。适用于您希望显示原生名称的标题菜单。

`ui-languages.json` 清单是一个 JSON 数组，其中包含 <code>"{ code, label, englishName, direction }"</code> 条目（`direction` 是 `"ltr"` 或 `"rtl"`）。示例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

该清单由 `generate-ui-languages` 从 `sourceLocale` + `targetLocales` 和捆绑的主目录生成。它被写入 `ui.flatOutputDir`。如果您更改了配置文件中的任何区域设置，请运行 `generate-ui-languages` 来更新 `ui-languages.json` 文件。

<a id="rtl-languages"></a>
### 从右到左的语言

`ai-i18n-tools` 导出 `getTextDirection(lng)` 和 `applyDirection(lng)`：

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` 设置 `document.documentElement.dir`（浏览器）或为空操作（Node.js）。传递一个可选的 `element` 参数来定位特定元素。

对于可能包含 `→` 箭头的字符串，请在从右到左的布局中翻转它们：

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## 工作流 2 - 文档翻译

主要为 **markdown、MDX 和 `.astro` 文档**在 `docs[].contentPaths` 下设计。在 Docusaurus 网站上，将 `docs[].docusaurusCatalogDir` 设置为 `write-translations` 目录（例如 `docs-site/i18n/en`），这样 `translate-docs` 也会翻译 shell JSON（导航栏、页脚、主题字符串）。对于嵌入在 markdown 中的 PNG 和其他栅格图像，请参阅 [翻译文档中的图像和栅格资源](#images-and-raster-assets-in-translated-docs)。对于 README 或文档中包含 `docsOutput.style = "flat"` 的可选 **语言切换器**块，请参阅 [语言切换器（`languageListBlock`）](#language-switcher-languagelistblock)。当启用 `features.translateSVG` 时，SVG 文件通过 [`translate-svg`](#cli-reference) 进行翻译——而不是通过 `docs[].contentPaths`。任意嵌套的 UI JSON 包（非 Docusaurus 目录）属于 [工作流 3](#workflow-3---json-file-translation)（`json[]` / `translate-json`），而不是 `docs[]`。

<a id="step-1-initialise-for-documentation"></a>
### 步骤 1：初始化文档

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

适用于 Astro Starlight 文档网站：

```bash
npx ai-i18n-tools init -t ui-starlight
```

适用于纯 Astro 网站 UI（无 Starlight）：

```bash
npx ai-i18n-tools init -t ui-astro-website
```

该模板仅启用 UI 提取。对于页面 HTML 翻译，还要设置 `features.translateDocs` 并添加一个 `docs[]` 块（参见 [Astro 网站页面（解析和替换）](#astro-website-parse-and-replace))。[`examples/astro-website`](../../docs/../examples/astro-website/) 配置显示了两个管道在一起。

编辑生成的 `ai-i18n-tools.config.json`：

- `sourceLocale` - 源语言（必须与 `docusaurus.config.js` 中的 `defaultLocale` 匹配）。
- `targetLocales` - BCP-47 区域设置代码数组（例如 `["de", "fr", "es"]`）。
- `cacheDir` - 所有管道的共享 SQLite 缓存目录（以及 `--write-logs` 的默认日志目录）。
- `docs` - 文档块数组。每个块都有可选的 `description`、`contentPaths`（字符串或数组；文件、目录或 glob）、`outputDir`、可选的 `docusaurusCatalogDir`、`docsOutput`、可选的 `segmentSplitting`、`translateFrontmatterFields`、`protectAttributes`、`protectKeys`、`targetLocales`、`addFrontmatter` 等。
- `docs[].description` - 可选的简短维护者说明。设置后，它会出现在 `translate-docs` 标题和 `status` 部分标题中。
- `docs[].contentPaths` - markdown/MDX/`.astro` 源（以及 Docusaurus shell JSON 的可选 `docusaurusCatalogDir`）。
- `docs[].outputDir` - 该块的翻译输出根目录。
- `docs[].docsOutput.style` - `"nested"`（默认）、`"flat"`、`"doc-system"` 或别名 `"docusaurus"` / `"astro-starlight"`（参见 [输出布局](#output-layouts))。

**主要与补充：** 专注于 `contentPaths` 用于本地化页面。当您还需要来自 `write-translations` 的 Docusaurus shell JSON 时，请设置 `docusaurusCatalogDir`。如果您只翻译页面，请省略 `docusaurusCatalogDir`。

<a id="step-2-translate-documents"></a>
### 步骤 2：翻译文档

```bash
npx ai-i18n-tools translate-docs
```

这将把每个 `docs[]` 块的 `contentPaths`（以及设置 `docusaurusCatalogDir` 时的 Docusaurus 目录 JSON）中的所有文件翻译成所有有效的文档区域设置。已翻译的片段将从 SQLite 缓存提供——只有新的或已更改的片段才会被发送到 LLM。

翻译单个区域设置：

```bash
npx ai-i18n-tools translate-docs --locale de
```

检查需要翻译的内容：

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### 复杂的 Markdown 和失败的质量检查

`translate-docs` 检查每个翻译段落是否保留了 Markdown 结构（包括从文档中解析出的强调格式）。包含大量 `bold` 范围、在 `` `inline code` `` 周围嵌套反引号、或将粗体与代码混入长句中的段落（例如模板字符串如 `` `fetch(\`/locales/${code}.json\`)` ``）非常脆弱：某些语言区域需要不同的词序，这可能会改变翻译后 `**` 和 `` ` `` 的对应关系，从而触发 CLI 错误，例如 `AST mismatch`。

**如果遇到此类验证失败，请优先简化源语言文本** —— 拆分段落、将示例移至代码块，或使用更少的粗体/代码组合来表达相同含义 —— 而不要期望每个模型和语言区域都能完美复现密集的行内标记。本页其他位置（特别是第 4 步关于 `SOURCE_LOCALE`、加载器和 `public/` 路径的说明）的格式是刻意贴近真实场景；当你在自己的文档中复用类似表述并进行广泛翻译时，请尽量简化。

当所有配置的模型在同一个段落上均因 `AST mismatch` 失败时，`translate-docs` 可自动将该段落拆分为更小的部分（首先拆分列表中点，然后是单个列表项或更短的段落片段），从第一个模型开始重试每个部分，并在原始段落缓存键下重新合并结果。此功能默认启用（`segmentSplitting.qualityRetrySplit`）；设置为 `false` 可在模型全部失败后停止。运行摘要会在触发此回退机制时报告 `Quality split retries`。

要查看**哪些段落失败**、失败频率以及存储的**质量/错误信息**，请使用翻译仪表板的**失败记录**标签页（[翻译仪表板 → 失败记录](#failures-document-translation)）。

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### 缓存行为和 `translate-docs` 标志

CLI 使用 SQLite 保存**文件跟踪**信息（每个文件按源哈希 × 语言区域）和**段落**记录（每个可翻译块的哈希 × 语言区域）。正常运行时，若跟踪的哈希值与当前源匹配**且**输出文件已存在，则完全跳过该文件；否则处理该文件，并使用段落缓存，以避免对未更改的文本调用 API。

| 标志                          | 效果                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(默认)*                   | 当文件跟踪和磁盘输出匹配时跳过未更改的文件；其余部分使用段落缓存。                                                                                                                                                                          |
| `-l, --locale <codes>`        | 以逗号分隔的目标语言区域（若省略，则默认值为根 `targetLocales` 和每个 `docs[]` 块中可选的 `targetLocales` 的并集）。                                                                                                       |
| `-p, --path` / `-f, --file`   | 仅翻译此路径下的 Markdown/JSON（项目相对路径、绝对路径或通配符模式）；`--file` 是 `--path` 的别名。                                                                                                                                      |
| `--dry-run`                   | 不进行文件写入，也不调用 API。                                                                                                                                                                                                                                    |
| `--type <kind>`               | 限制为 `markdown` 或 `json`（否则，如果在配置中启用了两者，则两者都包含）。                                                                                                                                                                                           |
| `--json-only` / `--no-json`   | 仅翻译 JSON 标签文件，或跳过 JSON，仅翻译 markdown。                                                                                                                                                                                          |
| `-j, --concurrency <n>`       | 最大并行目标语言（默认为配置或 CLI 内置默认值）。                                                                                                                                                                                          |
| `-b, --batch-concurrency <n>` | 每个文件（文档）的最大并行批量 API 调用次数（默认为配置或 CLI）。                                                                                                                                                                                           |
| `--emphasis-placeholders`     | 在翻译前将 markdown 强调标记屏蔽为占位符（可选；默认关闭）。                                                                                                                                                                                                         |
| `--debug-failed`              | 在验证失败时，在 `cacheDir` 下写入详细的 `FAILED-TRANSLATION` 日志。                                                                                                                                                                                    |
| `--force-update`              | 重新处理每个匹配的文件（提取、重组、写入输出），即使文件跟踪会跳过。**段缓存仍然适用** — 未更改的段不会发送到 LLM。                                                                                                                                                                                           |
| `--force`                     | 清除每个已处理文件的文件跟踪，并且**不读取**段缓存进行 API 翻译（完全重新翻译）。新结果仍会**写入**段缓存。                                                                                                                                                                                                         |
| `--stats`                     | 打印段计数、跟踪文件计数以及每个语言的段总数，然后退出。                                                                                                                                                                                                               |
| `--clear-cache [locale]`      | 删除缓存的翻译（和文件跟踪）：所有语言，或单个语言，然后退出。                                                                                                                                                                                                        |
| `--prompt-format <mode>`      | 每个**批次**的段如何发送到模型和解析（`xml`、`json-array` 或 `json-object`）。默认 `json-array`。不改变提取、占位符、验证、缓存或回退行为 — 请参阅 [批量提示格式](#batch-prompt-format)。 |

您不能将 `--force` 与 `--force-update` 结合使用（它们是互斥的）。

<a id="batch-prompt-format"></a>
#### 批量提示格式

`translate-docs` 以**批次**（按 `batchSize` / `maxBatchChars` 分组）将可翻译的段发送到活动的 LLM 提供商。`--prompt-format` 标志仅更改该批次的**线格式**；`PlaceholderHandler` 令牌、markdown AST 检查、SQLite 缓存键以及批次解析失败时的每个段回退保持不变。

| 模式                   | 用户消息                                                           | 模型回复                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | 伪 XML：每个段一个 `<seg id="N">…</seg>`（带 XML 转义）。 | 仅 `<t id="N">…</t>` 块，每个块对应一个段索引。       |
| `json-array` (默认) | 字符串的 JSON 数组，每个条目按顺序对应一个分段。               | 长度 **相同**（顺序相同）的 JSON 数组。           |
| `json-object`          | 按分段索引 `{"0":"…","1":"…",…}` 键控的 JSON 对象。            | **键相同**且值已翻译的 JSON 对象。 |

运行头也会打印 `Batch prompt format: …`，以便您确认活动模式。JSON 标签文件（`docusaurusCatalogDir`）和 SVG 文件批处理在作为 `translate-docs`（或 `sync` 的文档阶段）的一部分运行时使用相同的设置——`sync` 不公开此标志；它默认为 `json-array`。

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### 分段去重和 SQLite 中的路径

> **注意：** 本节介绍的内部缓存键详细信息有助于调试 `cleanup` 行为或自定义工具。大多数用户可以跳过它。

- 分段行由 `(source_hash, locale)`（哈希 = 规范化内容）全局键控。两个文件中的相同文本共享一行；`translations.filepath` 是元数据（最后写入者），而不是每个文件的第二个缓存条目。
- `file_tracking.filepath` 使用命名空间键：每个 `docs` 块的 `doc-block:{index}:{relPath}`（`relPath` 是项目根目录相对的 posix：收集的 markdown 路径；**JSON 标签文件使用源文件相对于当前工作目录的路径**，例如 `docs-site/i18n/en/code.json`，因此清理可以解析真实文件），`json[]` 下的 `json-block:{index}:{relPath}` 用于 `json[]` 源，以及 `translate-svg` 下的 `svg-files:{relPath}` 用于 SVG 文件。
- `translations.filepath` 存储 markdown、JSON 和 SVG 分段的相对于当前工作目录的 posix 路径（SVG 使用与其他资产相同的路径形状；**仅**在 `file_tracking` 上存在 `svg-files:…` 前缀）。
- 运行后，仅针对 **相同翻译范围**内的分段行（尊重 `--path` 和启用的类型）清除 `last_hit_at`，这些行未被命中，因此过滤或仅文档运行不会将不相关的文件标记为过时。

<a id="output-layouts"></a>
### 输出布局

`docsOutput.style` 控制翻译后的 markdown 文件写入何处。在 `docs[].docsOutput.style` 中使用下面的确切字符串值（别名是预设布局，而不是单独的引擎）。

`docsOutput.style = "nested"`（省略时为默认值）——在 `{outputDir}/{locale}/` 下镜像源树（例如 `docs/guide.md` → `i18n/de/docs/guide.md`）。

`docsOutput.style = "doc-system"`——用于静态文档站点的、经过本地化前缀的文档树。`docsRoot` 下的文件写入 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`。`docsRoot` 之外的路径将回退到嵌套布局。将 `docs[].docsOutput.docsRoot` 设置为您的英文源根目录（例如 `"docs"` 或 `"src/content/docs"`）。当 `docsOutput.style = "doc-system"` 时，您必须显式设置 `localeSubpath`（使用下面的别名获取预设）。

**别名**（相同的布局引擎，预设 `localeSubpath`）：

- `docsOutput.style = "docusaurus"`——`localeSubpath` 默认为 `docusaurus-plugin-content-docs/current`（Docusaurus i18n 插件布局）。
- `docsOutput.style = "astro-starlight"`——`localeSubpath` 默认为 `""`（直接在 `{outputDir}/{locale}/` 下的翻译页面，匹配 [Starlight](https://starlight.astro.build/guides/i18n/)（当英文位于内容根目录且 `outputDir` 等于 `docsRoot` 时）。

Docusaurus 预设（主要的文档页面）：

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight 预设（相同的块形状，不同的路径）：

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

可选的 JSON 标签——来自 `docusaurusCatalogDir` 的 Docusaurus 壳字符串（非 MDX 正文内容）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight 为许多本地化版本提供了 UI 字符串；可选的自定义 UI 覆盖使用 `src/content/i18n/en.json` 和 `jsonPathTemplate: "{outputDir}/{locale}.json"` 在单独的 `docs[]` 块中，以备不时之需。

`docsOutput.style = "flat"`——将翻译后的文件放置在源旁边，并带有本地化后缀，或放在子目录中。当 `docsOutput.style = "flat"` 时（除非设置了 `rewriteRelativeLinks: false` 或自定义 `pathTemplate`），页面之间的相对链接会自动重写。

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-docsoutputstyle--flat"></a>
#### `docsOutput.style = "flat"` 时的锚点链接

当 `docsOutput.style = "flat"` 时，输出会为每个本地化版本重写页面之间的**相对路径**（`guide.md` → `guide.de.md`）。**锚点链接**——带有路径后跟 `#` 的常规 markdown 内联形式——用于跳转到目标文件中的某个部分：

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

这里链接目标是 `setup.md`，`#first-run` 是锚点：它应该滚动到该文件中的正确标题。

**锚点链接需要注意**

- `rewriteRelativeLinks` 会为每个区域设置修复**文件名**（`setup.md` → `setup.de.md`）。
- 许多渲染器会从**可见的标题文本**派生出`#` slug。翻译后，不同区域的标题会不同，因此自动生成的 slug 可能会发生变化，而重写的链接可能仍然显示`#first-run` — 或者您的英文`#…`锚点不再匹配渲染器根据翻译后的标题构建的 slug。
- 结果：读者会跳转到正确的**文件**但**错误的行**，或者浏览器找不到匹配的标题。

**操作方法**

1. 在`translate-docs`之前，先在您的源`.md` / `.mdx` 上运行`ai-i18n-tools write-heading-ids`（与平常的`docs[]` / `contentPaths`相同）。它会在每个标题前插入显式的 HTML 锚点，这样`id`值在所有翻译后的副本中都是共享的。重命名标题后请重新运行，以确保过时的锚点 ID 会刷新以匹配当前标题。
2. 将您的 markdown **锚点链接**指向这些稳定的 ID，例如 `[label](../../docs/other.md#section-id)`，其中 `section-id` 匹配工具写入的锚点 — 而不是仅凭英文单词猜测。

**示例**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

运行`write-heading-ids`（简化版）后的`docs/security.md`：

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

运行`translate-docs`后，文件路径和`#…`锚点在每个区域设置文件中都保持一致，例如：

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

由于`id`在源文件中是固定的，因此所有区域设置中的`#tls-configuration`锚点都相同；只有标题**文本**和链接**标签**被翻译。

<a id="images-and-raster-assets-in-translated-docs"></a>
#### 翻译文档中的图片和栅格资源

`translate-docs` 会翻译 markdown 片段，包括图片的 alt 文本。它不会将栅格文件（PNG、JPEG、WebP、GIF）复制到您的文档`outputDir`中。您必须将截图文件放置在翻译后的 URL 将指向的位置，或者在翻译后使用`postProcessing.regexAdjustments`重写路径。

对于包含可翻译文本的 SVG 文件，请使用`svg`块和`translate-svg` — 请参阅 [`svg`](#svg)。

请参阅 [区域设置资源指南](LOCALE-ASSETS-GUIDE.zh-Hans.md) 以获取完整的决策指南、所有包含配置示例和目录布局的模式、截图脚本合同、设计建议以及常见错误。

**快速参考 — 五种模式**

| 模式                      | 用于                                               | 机制                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — 共享栅格            | 单个图片，无区域设置特定变体                  | 按文件链接重写器；通常无正则表达式          |
| B — 按区域设置的文件夹        | `"flat"`、`"docusaurus"`、`"astro-starlight"` README/docs | `regexAdjustments` 区域设置片段交换            |
| C — Docusaurus 同地放置     | `docsOutput.style = "docusaurus"` 站点 | 截图脚本放置文件；无正则表达式          |
| D — 翻译的 SVG           | 嵌入 SVG 插图的 Web 应用                  | `translate-svg` 和 `svg.style = "flat"`         |
| E — 同地放置的翻译 SVG | `docsOutput.style = "docusaurus"` 文档          | `translate-svg` 和 `svg.style = "nested"` + `pathTemplate` |

**扁平链接重写器和两步流程**

当`docsOutput.style = "flat"`时，一个内置的重写器会在`postProcessing`之前运行。它会计算每个输出文件的深度前缀 — 从输出文件目录回溯到源文件目录的相对路径 — 并将其添加到非 markdown 资源 URL 的前面。然后`postProcessing`会在已添加前缀的 URL 上运行 — 编写匹配其中区域设置片段的`search`模式，而不是开头的`../`前缀。

使用 `flatPreserveRelativeDir: true` 时，子目录中的源文件会自动获得一个特定于文件的前缀。例如，`docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md` 会生成一个前缀 `../../docs/`，因此 `translation-dashboard.png`（源文件的同级文件）会变成 `../../docs/translation-dashboard.png` — 无需任何 `postProcessing` 规则即可正确解析。

当 `docsOutput.style` 为 `"docusaurus"`、`"astro-starlight"`、`"nested"` 或除 `"flat"` 之外的任何值时，扁平链接重写器不会运行。`postProcessing` 会看到原始的 markdown URL。

**模式 A 示例** — 当 `docsOutput.style = "flat"` 时，无需配置即可在源文件旁边处理相对路径资源。模式 A `postProcessing` 规则仅适用于绝对 URL 资源（例如 `/img/...`）或 CDN 目标替换。

**模式 B 示例 — `docsOutput.style = "flat"` README**（`examples/nextjs-app`，第二个 `docs[]` 块）

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

使用通用的 `[^/]+` 形式，而不是硬编码的源语言环境，这样如果 `sourceLocale` 发生更改，该规则将继续有效。

**模式 B 示例 — `docsOutput.style = "docusaurus"`**（`examples/nextjs-app`，第一个 `docs[]` 块）

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**模式 C — Docusaurus 共同定位**（无需 `regexAdjustments`）

将 en-GB 屏幕截图放在 `static/assets/` 中并创建符号链接 `docs/assets → ../static/assets`。`take-screenshots` 脚本将其他语言环境的文件直接写入 `i18n/<locale>/…/current/assets/`。所有语言环境中的所有文档都引用 `../assets/name.png` — 路径是稳定的，不需要 URL 重写。

**模式 D 示例**（`examples/nextjs-app`，`svg.style = "flat"`）

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → `public/assets/` 下的每个语言环境文件。应用程序按语言环境引用：`<img src={`/assets/icon.${locale}.svg`} />`。

**仅 README 的最小示例**（`examples/console-app`）

`examples/console-app/ai-i18n-tools.config.json` 仅通过 [语言切换器后处理](#language-switcher-languagelistblock) 将 `README.md` 翻译为 `translated-docs/`。未定义任何图像规则 — 当 README 没有同级光栅文件或仅使用您主机已提供的绝对 URL 时，这是合适的。

替换模板支持占位符，例如 `${translatedLocale}` 和 `${translatedBasedir}`（完整列表请参见 [配置参考](#configuration-reference) 中的 `docsOutput.postProcessing.regexAdjustments` 行）。

<a id="language-switcher-languagelistblock"></a>
#### 语言切换器（`languageListBlock`）

当翻译的 markdown 文件应包含一个“**其他语言阅读**”链接行时，请使用 `docsOutput.postProcessing.languageListBlock` — 每种语言环境一个链接，其中 `href` 值相对于每个输出文件计算。

此存储库将其用于 [README.md](../README.zh-Hans.md) 和 [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md)。在 `translate-docs` 之后，每个翻译副本都会获得一个更新的块；例如，[translated-docs/docs/GETTING_STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) 链接到 `translated-docs/docs/` 下的同级语言环境文件，并返回到英文源文件 `../../docs/GETTING_STARTED.md`。

**1. 在源 markdown 中标记块**

将切换器包装在由 `start` 和 `end` 子字符串标记分隔的 HTML（或任何行）中。此存储库使用：

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

初始链接文本只是一个占位符。`translate-docs` 会替换从包含 `start` 的第一行到包含 `end` 的第一行之后的整个切片（在围起来的代码块中的标记将被忽略，因此同一文件中的配置示例不会匹配）。

**2. 配置块**

`start` 和 `end` 是任意的子字符串标记 — 它们不必是 `<small id="lang-list">` / `</small>`。选择仅出现在语言切换器切片中的任何开始和结束文本：另一个 HTML 标签 (`<div class="lang-switcher">` … `</div>`)、HTML 注释 (`<!-- lang-list -->` … `<!-- /lang-list -->`) 或仅限 Markdown 的边界（例如，一行 `**Languages:**` 到一行 `---`）。在配置中设置 `start` 和 `end` 以精确匹配您在源文件中放置的内容。

根配置 ([ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json))：

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| 字段       | 作用                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | 标识块开始行的子字符串                                                  |
| `end`       | 结束行上的子字符串（当两者都出现在一行时，可以与 `start` 相同）             |
| `separator` | 生成的 `[label](../../docs/href)` 链接之间的文本（此仓库使用 `" · "`）                                    |
| `label`     | 可选：`"local"`（默认）使用清单中的每个区域设置的本地名称；`"english"` 使用 `englishName` |

**3. 运行时行为**

1. **提取** — 语言列表切片**不会**发送给模型（`translatable: false`）。
2. **每个翻译文件** — 在分段翻译和可选的扁平链接重写之后，`postProcessing` 会重建块：每个区域设置一个 Markdown 链接，标签来自 `ui-languages.json`（如果存在）（否则是捆绑的主目录，否则是 `localeDisplayNames`），路径相对于正在写入的文件。
3. **源刷新** — 在完成 `translate-docs` / `sync` 文档传递后，相同的规范块会被写回 **英文源文件**中的 `contentPaths`，因此添加一个区域设置可以在不手动编辑每个链接的情况下更新仓库中的切换器。

如果文件没有匹配的块，CLI 会记录一个警告（当 `--verbose` 时）并保持正文不变。

**4. 标签清单**

对于本地名称标签（`label: "local"`），通过 `generate-ui-languages` 生成或维护 `ui-languages.json`（参见 [`uiLanguagesPath`](#uilanguagespath-optional))。此仓库的仅文档配置没有 UI 管道，因此标签来自 `sourceLocale` + `targetLocales` 的捆绑主目录。

**5. 此仓库中的示例**

| 示例                            | 文件                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 此包（扁平文档 + 子目录） | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)（`docsOutput.style = "flat"`），[README.md](../README.zh-Hans.md)，[docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md)，输出在 [translated-docs/](../../docs/../translated-docs/) 下 |
| 最简 README-only                | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json)（`docsOutput.style = "flat"`），[examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| 扁平 README + Docusaurus 文档      | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json)（第二个块：`docsOutput.style = "flat"`；第一个块：`docsOutput.style = "docusaurus"`）                                                     |

`<small id="lang-list">` 前面的那一行（例如 `**Read in other languages:**`）是一个正常的、可翻译的片段，并在每个目标区域设置中本地化；只有标记内的链接行会逐字重新生成，除了 `href` 和清单驱动的标签。

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` 占位符

通过设置 `docs[].docsOutput.pathTemplate`（Markdown 和 MDX）或 `jsonPathTemplate`（JSON 标签文件）来覆盖翻译文件的写入位置。两者都接受相同的占位符。解析后的路径必须保留在该块的 `outputDir` 内部（CLI 会拒绝超出范围的路径）。

如果您使用自定义 `pathTemplate`，`rewriteRelativeLinks` 默认为 `false`，除非您显式设置它 — 相对链接重写是为没有自定义模板的 `docsOutput.style = "flat"` 构建的。

对于内置布局（`nested`、`flat`、`doc-system`，无自定义模板），请将 `docsOutput.localePathLowercase` 设置为 `true`，以写入小写区域设置文件夹或文件名片段（例如，使用 `pt-br` 而不是 `pt-BR`）。`astro-starlight` 别名默认将其设置为 `true`。自定义 `pathTemplate` / `jsonPathTemplate` 值保持不变 — 当您需要小写片段但仍将 `{locale}` 保留为 BCP-47 时，请在此处使用 `{llocale}`。

| 占位符            | 作用                                                                                                       | 示例                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | 此文档块的已解析绝对路径 `outputDir`                                           | `/home/acme/repo/i18n`                                           |
| `{locale}`             | 目标区域设置代码（与配置/CLI 中的形式相同）                                                          | `de`、`pt-BR`                                                    |
| `{LOCALE}`             | 相同区域设置的大写形式                                                                                     | `DE`、`PT-BR`                                                    |
| `{llocale}`            | 相同区域设置的小写形式（与 Astro 路由文件夹匹配，例如 `pt-br`、`zh-cn`）                               | `de`、`pt-br`                                                    |
| `{relPath}`            | 相对于项目根目录的源文件路径，POSIX `/`                                                   | `docs/guide.md`、`README.md`                                     |
| `{stem}`               | 文件名 **不含**扩展名                                                                            | `guide` （针对 `docs/guide.md`）                                      |
| `{basename}`           | 文件名 **包含**扩展名                                                                               | `guide.md`                                                       |
| `{extension}`          | **包含**点号的扩展名                                                                            | `.md`、`.mdx`                                                    |
| `{docsRoot}`           | 已解析的 `docsOutput.docsRoot` 绝对路径（如果省略，则默认为 `docs`）                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | 当路径字符串匹配时，移除匹配的 `docsRoot` 前缀的 `{relPath}`（POSIX）；否则保持不变 | `docs/guide.md`（常见）；仅在应用剥离时为 `guide.md` |

**示例**

配置片段：

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

对于区域设置 `de` 和源 `docs/guide.md`，项目根目录为 `/home/acme/repo`，并且 `outputDir` 解析为 `/home/acme/repo/i18n`，展开后的路径为：

```text
/home/acme/repo/i18n/de/docs/guide.md
```

使用 `docsOutput.style = "flat"` 且无自定义 `pathTemplate` 时，一种常见模式是通过 `{stem}` 和 `{extension}` 只保留文件名，例如 `{outputDir}/{stem}.{locale}{extension}`，这会在已解析的 `outputDir` 下生成 `…/guide.de.md`。

<a id="troubleshooting"></a>
### 故障排除

**翻译后的文档中，章节锚点链接不起作用**

像 `[label](../../docs/other.md#section-id)` 这样的链接可能会打开正确的翻译文件，但无法滚动到目标标题 — 或跳转到错误的章节。片段 `#…` 在该区域设置中不再匹配任何标题 `id`。

常见原因：

- 源标题从未有过显式的锚点 ID；网站从可见的标题文本派生 slug，而该文本在翻译后会发生变化。
- 您在源文件中重命名了标题，但前面的 `<a id="…"></a>` 行丢失或仍是旧 ID。
- 锚点链接使用了根据英文单词猜测的 `#…` 片段，而不是 `write-heading-ids` 会生成的 ID。

**修复**

1. 在您的**源** `.md` / `.mdx` 上运行 `ai-i18n-tools write-heading-ids`（与 `translate-docs` 的 `docs[]` / `contentPaths` 相同）。它会在每个 ATX 标题前插入 `<a id="slug"></a>`，或者在标题文本不再与当前 slug 匹配时刷新现有锚点。
2. 将锚点链接指向这些 ID — 例如 `[setup](../../docs/guide.md#first-run)`，其中 `#first-run` 匹配目标标题上方的锚点行，而不是仅从英文标题推断出的 slug。
3. 重新运行 `translate-docs`（或 `sync --force-update`），以便每个区域设置副本都包含更新的锚点行。

先在 `--dry-run` 上使用 `write-heading-ids` 来预览更改。有关完整模式，请参阅 [扁平布局中的锚点链接](#anchor-links-when-docsoutputstyle--flat)。

---

<a id="workflow-3---json-file-translation"></a>
## 工作流 3 - JSON 文件翻译

专为将 UI 副本保存在**每个区域设置的嵌套 JSON 文件中**（例如 `src/i18n/en/translation.json`）而不是源文件中的 `t("…")` 的项目设计。CLI 遍历这些文件中的字符串值，通过 OpenRouter 将它们翻译，并使用 `json[].outputPathTemplate` 写入每个区域设置的输出。它使用与 `translate-docs` 和 `translate-svg`（`cacheDir`）相同的 SQLite 缓存。

此工作流**不**运行 `extract` — 没有 `strings.json` 目录。使用 `features.translateJson` 和顶级 `json[]` 中的一个或多个条目启用它。

<a id="step-1-initialise-for-nested-json"></a>
### 步骤 1：初始化嵌套 JSON

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

该模板设置 `features.translateJson: true`，禁用 UI 提取和文档翻译，并构建一个指向 `src/i18n/en/translation.json` 的单个 `json[]` 块，输出为 `src/i18n/{llocale}/translation.json`。根据您的仓库布局编辑 `sourceLocale`、`targetLocales`、`contentPaths` 和 `outputPathTemplate`。

<a id="step-2-configure-json"></a>
### 步骤 2：配置 `json[]`

每个 `json[]` 块描述一个管道：

- `contentPaths` — 一个或多个 `.json` 文件、目录或 glob（例如 `"src/i18n/en/translation.json"` 或 `"src/i18n/en/overrides/*.json"`）。路径从项目根目录解析。
- `outputPathTemplate` — 必需。写入每个目标区域设置文件的位置。占位符：`{locale}`、`{LOCALE}`、`{llocale}`（小写区域设置，适用于 Astro 路由文件夹）、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。
- `targetLocales`（可选）— 仅用于此块的子集；否则应用根 `targetLocales`。
- `keyPolicy` — 哪些 JSON 键包含可翻译的文本，哪些是稳定标识符（见下文）。
- `description`（可选）— 显示在 CLI 标题和 `status` 输出中。

示例（多个源文件，小写区域设置文件夹）：

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | 行为 |
|-------------|-----------|
| `allowlist` | 仅翻译与 `translateKeys`（点路径；minimatch glob）匹配的键。 |
| `denylist`  | 翻译所有字符串值，除了与 `skipKeys` 匹配的键。 |
| `both`      | 先应用 `translateKeys`，然后从 `skipKeys` 中删除匹配项。 |

路径使用点表示法（`nav.home.label`）。像 `slug` 这样的裸名称匹配任何深度的最终键段。

<a id="step-3-translate-json-bundles"></a>
### 步骤 3：翻译 JSON 包

```bash
npx ai-i18n-tools translate-json
```

可选标志（与 `translate-docs` 的想法相同）：`-l` / `--locale` 用于目标子集，`-p` / `--path` 用于限制文件，`--dry-run`、`--force`（清除匹配文件的文件跟踪和段缓存），`--force-update`（当文件哈希匹配时重新处理；段缓存仍然适用），`-b` / `--batch-concurrency`，`--prompt-format`（`xml` \| `json-array` \| `json-object`）。

仅 JSON 项目可以运行：

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

当同时启用 UI 和文档时，`sync` 会在 translate-docs 之后运行 **translate-json**（除非 `--no-json`）。使用 `--no-json` 跳过 JSON。

检查每个文件和区域设置的覆盖率：

```bash
npx ai-i18n-tools status
```

当 `translateJson` 运行时，`status` 会打印一个 `json[]` 部分（✓ 最新，● 过时或缺失）。

<a id="workflow-3-vs-other-pipelines"></a>
### 工作流 3 与其他管道

| 情况 | 用途 |
|-----------|-----|
| UI 字符串在 `t("…")` / `i18n.t("…")` 的 JS/TS/Astro 中 | [工作流 1](#workflow-1---ui-translation) — `extract` + `translate-ui` |
| Markdown/MDX/`.astro` 页面或 README 翻译 | [工作流 2](#workflow-2---document-translation) — `translate-docs` |
| Docusaurus `write-translations` 目录 (`{ "key": { "message": "…", "description": "…" } }`) | 工作流 2 — `docs[].docusaurusCatalogDir` + `translate-docs`，**不是** `json[]` |
| 独立的嵌套区域设置 JSON（ZenBrowser 风格的 `translation.json` 树） | 工作流 3 — `json[]` + `translate-json` |
| 带 `<text>` / `<title>` / `<desc>` 的图示 `.svg` 文件 | `features.translateSVG` + [`svg`](#svg) + `translate-svg`（可选；不是编号的工作流） |

字段参考：在 [配置参考](#configuration-reference) 中的 [`json`](#json)。清理的缓存键在 `file_tracking` 中使用 `json-block:{blockIndex}:{projectRelPath}`。

---

<a id="combined-workflow-ui--docs"></a>
## 组合工作流（UI + 文档）

在单个配置中启用所有功能，以便一起运行两个工作流：

<details>
<summary>示例组合 UI + 文档配置</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` 将文档翻译指向与 UI 相同的 `strings.json` 目录，以保持术语一致性；`glossary.userGlossary` 添加了产品术语的 CSV 覆盖。

运行 `npx ai-i18n-tools sync` 来运行一个管道：当 `features.translateUIStrings` 启用时，**提取**然后**翻译 UI**字符串；可选**翻译 SVG**（`features.translateSVG` + `svg` 块）；**翻译文档**（根据配置的 `docs[]`）；然后可选**翻译 JSON**（`features.translateUIStrings` + `json[]`）。使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳过部分。文档和 `json[]` 步骤接受 `--dry-run`、`-p` / `--path`、`--force` 和 `--force-update`（当 `--no-docs` 时忽略仅文档的标志；当未设置 `--no-json` 时，JSON 使用相同的缓存标志）。

在块上使用 `docs[].targetLocales` 将该块的文件翻译成比 UI **更小的子集**（有效的文档区域设置是块之间的**并集**）：

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docsoutputstyle--docusaurus--flat"></a>
### 混合文档工作流（`docsOutput.style = "docusaurus"` + `"flat"`）

您可以通过在 `docs` 中添加多个条目，在同一配置中组合多个文档管道。当项目具有 Docusaurus 站点（`docsOutput.style = "docusaurus"`）以及需要使用带区域设置后缀的文件名进行翻译的根级别 markdown 文件（例如，带有 `docsOutput.style = "flat"` 的存储库 README）时，这是一种常见的设置。

<details>
<summary>示例混合 Docusaurus + 扁平 README 配置</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

此功能在 `npx ai-i18n-tools sync` 中的运行方式：

- UI 字符串从 `src/` 中提取/翻译到 `public/locales/`。
- 第一个文档块将 **markdown** 从 `docs-site/docs/` 翻译成 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`（本地化文档页面）。
- 当设置了 `docs[].docusaurusCatalogDir` 并启用了 `features.translateDocs` 时，该块还会将 `docs-site/i18n/en/` 下的 **Docusaurus shell JSON** 翻译到每个目标语言的文件夹中 — 包括导航栏、页脚以及主题/插件目录，但不包括 MDX 正文。
- 第二个文档块将 `README.md` 翻译成 `translated-docs/` 下带有语言后缀的文件（`docsOutput.style = "flat"`）。
- 所有文档块共享 `cacheDir`，因此未更改的片段会在运行之间重复使用，以减少 API 调用和成本。

---

<a id="translation-dashboard"></a>
## 翻译仪表板

运行：

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

默认监听端口是 **8675**。如果该端口不可用，服务器将尝试下一个端口（最多尝试 1000 次）并记录所选端口。已弃用的别名 `editor` 仍然可用，但会显示警告 — 请优先使用 `dashboard`。

这将启动一个由您配置的 `cacheDir` SQLite 数据库支持的本地 Web UI — 该数据库与 CLI 用于文档片段、日志和相关元数据的文件夹相同。它包含以下选项卡：**文档**（缓存的文档片段）、**UI 字符串**、**UI 复数**、**术语表**、**失败**、**Markdown 问题**和**统计信息**。

![Translation Dashboard](../../docs/translation-dashboard.png)

如果您在此应用中**编辑缓存行**（例如文档片段），请运行 `sync --force-update` 或等效的翻译命令并使用 `--force-update`，以便磁盘输出与缓存匹配；如果存储库中的**源文本**稍后发生更改，片段哈希值会改变，并且对旧文本的手动编辑将被覆盖。

<a id="failures-document-translation"></a>
### 失败（文档翻译）

**失败**选项卡仅用于**文档**翻译。它读取在某个片段无法成功翻译为特定语言时写入 SQLite 的失败记录 — 例如，模型输出为空或无效、翻译后验证错误（`AST mismatch`、占位符泄漏及类似的**质量**检查），或阻止进度的**致命**条件。它帮助您回答：*哪个源片段出错了，针对哪个语言和模型，以及记录了什么错误文本？*

<a id="when-to-use-it"></a>
#### 何时使用

- 在 `translate-docs` 或 `sync` 因错误、部分区域设置或日志混乱而结束之后，您可以对失败进行排序和过滤，而不仅仅是滚动终端输出。
- 当您想 **优先处理返工** 时：按 **失败次数** 排序，这样在重试中反复失败的片段就会排在前面；这些片段是 **简化或重新格式化** 源 markdown 的有力候选者，以便将来的运行能够成功。
- 当您需要 **精确的片段** — 文件路径、行号提示、源哈希和完整源文本 — 来编辑您存储库中的正确段落时。

<a id="why-source-edits-matter"></a>
#### 源文件编辑为何重要

密集的内联标记（**粗体**与 `` `code` `` 混合、嵌套强调、包含多个跨度的长句）会增加模型返回仍能通过结构检查的翻译的难度。**多次记录失败**的片段，通常通过**重写或拆分**源文件（或将示例移至代码块中）比在不变的文本上重新运行翻译更能获得改进。这与 [复杂的 Markdown 和失败的质量检查](#complex-markdown-and-failed-quality-checks) 一致。

<a id="how-to-use-the-tab"></a>
#### 如何使用该选项卡

1. 在仪表板中打开**失败**选项卡（与[翻译仪表板](#translation-dashboard)在同一浏览器会话中）。
2. 阅读**摘要**条（包含任何失败的片段，以及具有**1**、**2**或**3+** 次失败记录的片段计数）。
3. 按部分**文件名**、**语言**、**模型**、**质量错误**（值来自您的缓存）、**仅致命**以及可选的**源哈希值**、**源文本**或**错误消息**子字符串进行过滤 — 然后点击**应用**。
4. 选择**排序：# 失败次数**（默认）或**排序：文件路径 + 行号**。
5. 在表格的顶部或底部使用分页。**点击一行**可切换完整的源文本。行中的链接控件（启用时）会要求服务器进程将日志文件/行提示记录到 `ai-i18n-tools dashboard` 正在运行的**终端**中 — 这对于从浏览器跳转到编辑器非常有用。
6. 在项目中修复**源文件**，然后再次运行 `translate-docs` 或 `sync`。如果在成功运行后列表看起来**过时**，请运行 `ai-i18n-tools sync --force-update` 并重新加载仪表板（失败面板显示相同的提示）。

对于与 UI 并行的基于文件的调试，您仍然可以使用 `translate-docs --debug-failed` 在重试期间将 `FAILED-TRANSLATION` 详细信息写入 `cacheDir` — 请参阅 [缓存行为和 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags)。

<a id="markdown-issues-static-checks"></a>
### Markdown 问题（静态检查）

The **Markdown 问题**选项卡列出了来自 `markdown_source_issues` SQLite 表的行。每一行都是一个 **预翻译**发现：例如，在 `translate-docs` 用于遮蔽的相同 CommonMark 风格规则下，从未配对成强调/删除线的分隔符序列、一个用反引号打开但从未关闭的内联代码跨度，或者当 `**`/`__` 包裹 `[text](../../docs/url)` 链接时（仅将粗体放在链接文本内）的 `STRONG_OUTSIDE_LINK`。这与 **失败**不同，**失败**记录了每个区域设置模型输出和翻译后验证问题（`AST mismatch`、占位符泄漏等）。

当您想在花费令牌之前修复**源 Markdown**时，请使用此选项卡 — 特别是当质量检查在结构上反复失败时。按文件路径（与缓存键的部分匹配，包括 `doc-block:{index}:` 前缀）、**问题代码**或**源哈希**进行筛选；按文件路径+行或按最新扫描时间排序。链接按钮会将文件/行提示记录到 `ai-i18n-tools dashboard` 正在运行的终端（与文档选项卡的想法相同）。

**刷新行：** 运行 `ai-i18n-tools check-markdown`（可选的 `-p` / `--path` 范围，`--no-cache` 用于跳过 SQLite，`--json` 用于在 stdout 上输出机器可读内容，在 stderr 上输出人类可读行）。默认情况下，当 `docs[].warnMarkdownSourceIssues` 未设置为 `false` 时，每个 `translate-docs` markdown 文件运行也会重新扫描并替换该文件的行。清除缓存文件路径的所有翻译会删除该文件路径的 markdown 问题行，作为与故障相同的清理路径的一部分。`cleanup` 还会修剪已解析源路径在磁盘上缺失的 markdown 问题行，因此已删除或重命名文件（即使是仅由 `check-markdown` 扫描过，从未翻译过的文件）的诊断信息不会残留。

---

<a id="configuration-reference"></a>
## 配置参考

<a id="sourcelocale"></a>
### `sourceLocale`

源语言的 BCP-47 代码（例如 `"en-GB"`、`"en"`、`"pt-BR"`）。不会为此区域设置生成翻译文件 — 键字符串本身就是源文本。

**必须匹配**从您的运行时 i18n 设置文件（`SOURCE_LOCALE` / `src/i18n.ts`）导出的 `src/i18n.js`。

<a id="targetlocales"></a>
### `targetLocales`

要翻译的 BCP-47 区域设置代码数组（例如 `["de", "fr", "es", "pt-BR"]`）。

`targetLocales` 是 UI 翻译的主要区域设置列表，也是文档块的默认区域设置列表。使用 `generate-ui-languages` 从 `ui-languages.json` + `sourceLocale` 构建 `targetLocales` 清单。

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath`（可选）

用于显示名称、区域设置筛选和语言列表后处理的 `ui-languages.json` 清单的路径。如果省略，CLI 会在 `ui.flatOutputDir/ui-languages.json` 查找清单。

在以下情况下使用：

- 清单位于 `ui.flatOutputDir` 之外，您需要显式地将 CLI 指向它。
- 您希望 [语言切换器后处理](#language-switcher-languagelistblock)（`languageListBlock`）从清单构建区域设置标签。
- `extract` 应将清单中的 `englishName` 条目合并到 `strings.json` 中（需要 `ui.reactExtractor.includeUiLanguageEnglishNames: true`）。

<a id="concurrency-optional"></a>
### `concurrency`（可选）

同时翻译的最大**目标区域设置**（`translate-ui`、`translate-docs`、`translate-svg` 以及 `sync` 中的匹配步骤）。如果省略，CLI 会为 UI 翻译使用**4**，为文档翻译使用**3**（内置默认值）。可以通过 `-j` / `--concurrency` 为每次运行覆盖。

<a id="batchconcurrency-optional"></a>
### `batchConcurrency`（可选）

**translate-docs** 和 **translate-svg**（以及 `sync` 的文档步骤）：每个文件的最大并行 OpenRouter **batch** 请求数（每个批次可包含多个片段）。省略时默认为 **4**。`translate-ui` 会忽略此设置。使用 `-b` / `--batch-concurrency` 进行覆盖。在 `sync` 时，`-b` 仅适用于文档翻译步骤。

<a id="fileconcurrency-optional"></a>
### `fileConcurrency`（可选）

在 `translate-docs` 和 `sync` 期间，并发处理单个区域设置内文件的最大数量 **within a single locale**。当设置为大于 **1** 的值时，同一区域设置内的文件将使用信号量并行处理以控制内存使用。省略时默认为 **1**（顺序处理）。更高的值可以显著提高 I/O 密集型操作的吞吐量，尤其是在所有片段都已缓存（无需 API 调用）的情况下。

**示例：**

```json
{
  "fileConcurrency": 4
}
```

**用例：** 当 `sync --force-update` 以 100% 缓存命中率运行时，将此值设置为 `2-4` 以减少总处理时间。当文件数量很多且较小时，效果最明显。

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars`（可选）

文档翻译的片段批处理：每个 API 请求的片段数量以及字符限制。默认值：省略时为 **20** 个片段，**4096** 个字符。

<a id="openrouter"></a>
### `provider` 和 `providers`

`provider`（顶级，可选）从 `providers` 中选择活动的提供商密钥。当配置的提供商只有一个时，此项是可选的；当配置的提供商多于一个时，则为必需项。

`providers`（顶级）将提供商密钥映射到其配置块。内置密钥（请参阅下面的预设表）仅需要 `translationModels`；任何其他密钥都定义了一个自定义的 OpenAI 兼容端点，并需要 `baseUrl`（以及 `apiKeyEnv`，除非该端点不需要密钥）。

每个 `providers.<name>` 块接受：

- `translationModels`
  首选的模型 ID 列表（纯粹的上游 ID，无 `provider/` 前缀；OpenRouter ID 保留其本地 `vendor/model` 格式）。第一个模型优先尝试；后续条目在出错时作为备用。仅对于 `translate-ui`，您还可以设置 `ui.preferredModel` 在此列表之前尝试一个模型（请参阅 `ui`）。
- `baseUrl`
  OpenAI 兼容的基础 URL。覆盖预设的基础 URL；对于非预设提供商是必需的。
- `apiKeyEnv`
  包含 API 密钥的环境变量。覆盖预设的环境变量。
- `headers`
  发送到此提供商的每个请求的额外 HTTP 标头。
- `maxTokens`
  每个请求的最大完成令牌数。默认值：`8192`。
- `temperature`
  采样温度。默认值：`0.2`。
- `requestTimeoutMs`
  等待每个请求的最大毫秒数。默认值：`30000`（30 秒）。

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

仍然接受旧版顶级 `openrouter` 块（包含 `baseUrl`、`translationModels`、`defaultModel`、`fallbackModel`、`maxTokens`、`temperature`、`requestTimeoutMs`），并在加载时自动迁移到 `providers.openrouter`（包含 `provider: "openrouter"`）；`defaultModel` / `fallbackModel` 会折叠到 `translationModels` 中。

要获取一个可运行的示例，该示例在一个配置中配置了多个提供程序，并使用 `-P` 在它们之间切换，请参阅 [`examples/multi-provider`](../../docs/../examples/multi-provider/)（同一文档中的 `openai`、`anthropic`、`nvidia` 和 `deepseek`）。

**为什么使用多个模型：** 不同的提供商和模型在成本和质量方面各不相同，在不同语言和区域设置上的表现也不同。将 `translationModels` 配置为**有序的备用链**（而不是单个模型），这样 CLI 可以在请求失败时尝试下一个模型。

将下面的列表视为您可以扩展的**基线**：如果特定区域设置的翻译效果不佳或不成功，请研究哪些模型能有效支持该语言或脚本（参考在线资源或您的提供商的文档），并将这些 OpenRouter ID 添加为进一步的备选。

此列表经过**测试，覆盖了广泛的区域设置**，在一个大型文档项目中覆盖了 36 个目标区域设置；它是一个实用的默认选项，但不能保证对每个区域设置都表现良好。

示例 `translationModels`（与 `npx ai-i18n-tools init` 具有相同的默认值）：

<details>
<summary>默认翻译模型备用列表</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

在您的环境中或 `.env` 文件中设置活动提供商的 API 密钥环境变量（例如 `OPENROUTER_API_KEY`）。

在更改 `translationModels` 之前，请运行 `npx ai-i18n-tools check-models`。对于任何提供程序，它会将其配置的每个模型 ID 与该提供程序的实时模型列表（`GET /models`）进行验证，报告缺失或过期的 ID（`expiration_date`），列出有效模型，并在任何配置的 ID 无效时以非零状态退出。当提供程序返回定价信息时（例如 OpenRouter），它还会显示每 100 万个 token 的估算输入/输出定价（美元）。

<a id="features"></a>
### `features`

| 字段                | 工作流 | 描述                                                                                                                                                       |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | 将 `t("…")` / `i18n.t("…")` 提取到 `strings.json` 中，然后翻译条目并写入每个区域设置的扁平化 JSON（提取会自动运行；仅使用独立的 `extract` 来刷新目录）。 |
| `translateDocs`      | 2        | 翻译 `.md` / `.mdx` / `.astro` 页面；当设置了 `docs[].docusaurusCatalogDir` 时，Docusaurus 会生成 shell JSON。                                                         |
| `translateJson`      | 3        | `json[]`（`translate-json`）下的任意嵌套 JSON。                                                                                                           |
| `translateSVG`       | —        | 翻译 `.svg` 文件（需要顶层的 `svg` 块）。                                                                                                       |

**翻译** SVG 文件，当 `features.translateSVG` 为 true 且配置了顶层 `svg` 块时，使用 `translate-svg`。`sync` 命令在两者都设置时运行该步骤（除非设置了 `--no-svg`）。

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  扫描 `t("…")` 调用的目录或 glob 模式（相对于当前工作目录）。支持类似 `src/` 或 `["src/**/*.ts"]` 的模式。
- `stringsJson`  
  主目录文件的路径。由 `extract` 更新。
- `flatOutputDir`  
  写入每个区域设置的 JSON 文件的目录（例如 `de.json`）。
- `preferredModel`  
  可选。仅用于 `translate-ui` 的首选模型 ID；然后按顺序使用活动提供商的 `translationModels`，不重复此 ID。
- `uiExtractor.funcNames`（或旧版 `reactExtractor.funcNames`）  
  要扫描的附加函数名称（默认值：`["t", "i18n.t"]`）。
- `uiExtractor.extensions`（或旧版 `reactExtractor.extensions`）  
  要包含的文件扩展名（默认值：`[".js", ".jsx", ".ts", ".tsx"]`）。添加 `.astro` 以支持 Astro 前置 matter 和模板表达式。
- `uiExtractor.includePackageDescription`（或旧版 `reactExtractor.includePackageDescription`）  
  当 `true`（默认值）为 true 时，`extract` 还会将清单中的 `package.json` `description` 作为 UI 字符串包含在内（如果存在）。
- `uiExtractor.packageJsonPath`（或旧版 `reactExtractor.packageJsonPath`）  
  用于该可选描述提取的 `package.json` 文件的自定义路径。
- `uiExtractor.includeUiLanguageEnglishNames`（或旧版 `reactExtractor.includeUiLanguageEnglishNames`）

当 `true`（默认 `false`）为 true 时，`extract` 还会将清单（位于 `uiLanguagesPath`）中的每个 `englishName` 添加到 `strings.json` 中（如果尚未从源扫描中获得）。需要 `uiLanguagesPath` 指向一个有效的 `ui-languages.json`。

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite 缓存目录（由所有 `docs` 块共享）。跨运行重复使用。如果您是从自定义文档翻译缓存迁移，请存档或删除它 — `cacheDir` 会创建自己的 SQLite 数据库，并且与其他模式不兼容。

<a id="best-practice-for-git-exclusions"></a>
#### git 排除的最佳实践：

- 排除翻译缓存文件夹的内容（例如，使用 `.gitignore` 或 `.git/info/exclude`），以防止提交临时缓存的伪影。
- 保留 `cache.db`（不要例行删除它），因为保留 SQLite 缓存可以防止重新翻译未更改的片段。这在更新或修改使用 `ai-i18n-tools` 的软件时可以节省运行时间和 API 成本。
- 排除临时文件和日志文件，以避免提交与备份和调试相关的文件。

<br/>

**示例：**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

文档管道块的数组。`translate-docs` 和 `sync` 的文档阶段**按顺序处理**每个块。加载时仍接受旧版键（`documentations`、`markdownOutput`、`jsonSource`），并在配置文件可写时重写；在新配置中首选 `docs`、`docsOutput` 和 `docusaurusCatalogDir`。

**内容源**

- `description`
此块的可选人类可读注释（不用于翻译）。如果设置，则在 `translate-docs` `🌐` 标题中添加前缀；也会显示在 `status` 部分标题中。
- `contentPaths`
要翻译的 Markdown/MDX 页面正文和 `.astro` 模板（`translate-docs` 会扫描这些以获取 `.md`、`.mdx` 和 `.astro`）。支持**目录路径或 glob 模式**（例如 `"docs/**/*.md"`、`"guides/*.mdx"`、`"src/pages/index.astro"`）。这就是本地化文档正文的来源。
- `sourceFiles`
加载时合并到 `contentPaths` 的可选别名。
- `targetLocales`
此块的可选区域设置子集（否则为根 `targetLocales`）。有效的文档区域设置是跨块的并集。
- `docusaurusCatalogDir`
可选。此块的 Docusaurus JSON 标签目录的源目录（例如，来自 `docusaurus write-translations` 的 `"i18n/en"`）。页面正文始终来自 `contentPaths`；`docusaurusCatalogDir` 仅提供 shell/UI JSON，不提供 MDX。

**输出布局**

- `outputDir`
此块的翻译输出的根目录。
- `docsOutput.style`
`"nested"`（默认）、`"flat"`、`"doc-system"` 或别名 `"docusaurus"` / `"astro-starlight"`。
- `docsOutput.localeSubpath`
`doc-system` 的 `{locale}/` 和 `{relativeToDocsRoot}` 之间的路径段（使用 `style: "doc-system"` 时必需；使用别名时预设）。使用 `""` 用于 Starlight 风格的区域设置文件夹。
- `docsOutput.docsRoot`
Docusaurus 布局的源文档根目录（例如 `"docs"`）。
- `docsOutput.pathTemplate`
自定义 Markdown 输出路径。占位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。
- `docsOutput.jsonPathTemplate`
标签文件的自定义 JSON 输出路径。支持与 `pathTemplate` 相同的占位符。
- `docsOutput.localePathLowercase`
当 `true` 时，内置输出布局（`nested`、`flat`、`doc-system` 无 `pathTemplate`）在路径中使用小写区域设置段。默认 `false`；`astro-starlight` 和 `doc-system` 带有空的 `localeSubpath` 在加载配置时默认为 `true`。
- `docsOutput.flatPreserveRelativeDir`
当 `docsOutput.style = "flat"` 时，保留源子目录，以便具有相同基本名称的文件不会发生冲突。
- `docsOutput.rewriteRelativeLinks`
翻译后重写相对链接（当 `docsOutput.style = "flat"` 且没有自定义 `pathTemplate` 时自动启用）。
- `docsOutput.linkRewriteDocsRoot`
计算扁平链接重写前缀时使用的存储库根目录。通常将其保留为 `"."`，除非您的翻译文档位于不同的项目根目录下。

**后处理**

- `docsOutput.postProcessing`
对翻译后的**Markdown 正文**的可选转换（YAML 键和非 prose 的 front matter 值会保留）。在段重组和扁平链接重写之后，在 `addFrontmatter` 之前运行。
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` 的有序列表。`search` 是一个正则表达式模式（纯字符串使用标志 `g`，或 `/pattern/flags`）。`replace` 支持占位符，如 `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}`。
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — 在源 Markdown 和翻译后的 Markdown 中重新生成一个有界限的“以其他语言阅读”链接行。有关设置、行为和存储库示例，请参阅 [语言切换器（`languageListBlock`）](#language-switcher-languagelistblock)。

**行为和元数据**

- `translateFrontmatterFields`
与 `docsOutput` 同级（根据 `docs[]` 块）。默认 `true`：翻译面向用户的 YAML 文本，用于 Starlight/Docusaurus（`title`、`description`、`sidebar.label`、`sidebar_label`、`keywords`、`hero.title`、`hero.tagline`、`hero.image.alt`、`hero.actions[].text`、`pagination_label`、`prev`/`next` 标签）。设置为 `false` 可保持整个 front matter 块不变；传递字符串数组以限制为特定的点路径。
- `segmentSplitting`
与 `docsOutput` 同级（根据 `docs[]` 块）。可选的更细粒度的段落，用于 `translate-docs` 提取：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`。当 `enabled` 为 `true`（当 `segmentSplitting` 被省略时的默认值）时，会拆分密集段落、GFM 管道表（第一个块包含标题、分隔符和第一行数据）以及长列表；子部分用单个换行符重新连接（`tightJoinPrevious`）。设置为 `"enabled": false` 可仅为每个由空行分隔的正文块使用一个段落。当 `qualityRetrySplit` 为 `true`（默认值）时，在所有模型都用尽后验证 AST 失败的 markdown 段落会进行渐进式拆分，并从第一个模型重试；`maxQualityRetrySplitDepth`（默认 `3`）限制递归拆分。
- `warnMarkdownSourceIssues`
当 `true`（省略时的默认值）为 true 时，每次 `translate-docs` 运行都会重新扫描 markdown 段落中的风险分隔符/未闭合的内联代码，打印终端警告，并为该文件的缓存文件路径替换 `markdown_source_issues` 行。设置为 `false` 可跳过此块的警告和 SQLite 更新。
- `addFrontmatter`
当 `true`（省略时的默认值）为 true 时，翻译后的 markdown 文件将包含 YAML 键：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`，并且当至少有一个段落包含模型元数据时，还包含 `translation_models`（使用的 OpenRouter 模型 ID 的排序列表）。设置为 `false` 可跳过。

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
可选。额外的 JSX/HTML 属性名，其 **引用的字符串值**不得发送给翻译器。与内置默认值合并（`class`、`id`、`style`、`src`、`href`、`type`、`data-*`、大多数 `aria-*` 等）。不区分大小写。适用于：

- `.astro` 解析替换提取（静态 HTML 标签和 `attr=` 块内的 `{expression}` 中的字符串字面量）。
  - markdown/Astro 段落翻译期间的 MDX 占位符提取（`label`、`tooltip` 以及大写 JSX 标签上的 `aria-label`，加上适用的 `TabItem` `value`）。

示例：`"protectAttributes": ["variant", "size"]` 会在不同区域设置中保持 `variant="primary"` 在 `{items.map(...)}` 内不变。

您也可以列出通常可翻译的属性（例如 `"title"` 或 `"aria-label"`），当您希望这些值从英文按原样复制时。

- `protectKeys`
可选。额外的 **对象属性名**，其带引号的字符串值在模板 `{expression}` 块和 MDX 对象字面量（例如 `label:` 在 `<Tabs values={[ … ]}>` 中）中不得翻译。与内置默认值合并（`class`、`key`、`id`、`href`、`src` 等）。不区分大小写。

示例：`"protectKeys": ["slug", "code"]` 跳过 `{ slug: 'getting-started', title: 'Getting started' }` → 当 `slug` 被保护时，只有 `title` 被翻译。

<br/>

**示例（`docsOutput.style = "flat"` — 屏幕截图路径 + 可选语言列表包装器）：**

<details>
<summary>扁平布局后处理示例（屏幕截图 + languageListBlock）</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

嵌套 JSON 翻译管道的顶级数组。仅在 `features.translateJson` 为 true（`translate-json` 或 `sync` 的 JSON 阶段）时使用。请参阅 [工作流 3 - JSON 文件翻译](#workflow-3---json-file-translation)。

| 字段 | 描述 |
|-------|-------------|
| `description` | CLI / `status` 的可选注释（不翻译）。 |
| `contentPaths` | 项目根目录下的源 `.json` 文件、目录或 glob 模式。 |
| `outputPathTemplate` | 每个目标语言环境必需的输出路径。占位符：`{locale}`、`{LOCALE}`、`{llocale}`、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。 |
| `targetLocales` | 此块的可选子集；否则为根 `targetLocales`。 |
| `keyPolicy.mode` | `allowlist`、`denylist` 或 `both`。 |
| `keyPolicy.translateKeys` | 模式为 `allowlist` 或 `both` 时要包含的点路径 / glob 模式。 |
| `keyPolicy.skipKeys` | 要排除的点路径 / glob 模式（默认拒绝列表包括 `id`、`slug`、`href`、`url`、`key`、`code`）。 |

<a id="svg"></a>
### `svg`

SVG 文件的顶级路径和布局。仅当 `features.translateSVG` 为 true（通过 `translate-svg` 或 `sync` 的 SVG 阶段）时，翻译才会运行。

| 字段            | 描述                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | 一个或多个目录 **或 glob 模式**（例如 `"images/*.svg"`、`"**/icons/*.svg"`）。模式相对于项目根目录解析，并递归扫描 `.svg` 文件。                                                                         |
| `outputDir`      | 翻译后的 SVG 输出的根目录。                                                                                                                                                                                                                          |
| `style`          | `"flat"` 或 `"nested"`（当 `pathTemplate` 未设置时）。                                                                                                                                                                                                               |
| `pathTemplate`   | 自定义 SVG 输出路径。占位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{relativeToSourceRoot}"</code>。 |
| `localePathLowercase` | 当 `true` 时，内置的 `flat` / `nested` SVG 布局使用小写区域设置段。自定义 `pathTemplate` 值保持不变；使用 `{llocale}` 来获取小写段。 |
| `forceLowercase` | 在重新组装 SVG 时将翻译文本转换为小写。对于依赖全小写标签的设计很有用。                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| 字段          | 描述                                                                                                                                                                                                                                                        |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | `strings.json` 的路径 - 从现有翻译自动构建词汇表。                                                                                                                                                                                              |
| `userGlossary` | 包含 `Original language string`（或 `en`）、`locale`、`Translation` 列的 CSV 的路径 - 每行一个源术语和目标区域设置（`locale` 可以是 `*` 以表示所有目标）。 |

**生成一个空的词汇表 CSV：**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI 参考

| 命令                                                                                                    | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                                  | 打印 CLI 版本和构建时间戳（与根程序上的 `-V` / `--version` 显示相同的信息）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website\|ui-json-bundles] [-o path] [--with-translate-ignore]` | 编写一个入门配置文件（包括 `concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 和 `docs[].addFrontmatter`）。`ui-json-bundles` 脚手架工作流 3（仅 `json[]`）。`--with-translate-ignore` 创建一个入门 `.translate-ignore`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `check-models`                                                                                             | 将每个配置的模型 ID 与活动提供程序的 `GET /models` 列表（成员资格和 `expiration_date`）进行验证，需要该提供程序的 API 密钥（对于 Ollama 等无密钥提供程序则不需要），当任何配置的 ID 缺失或过期时以非零状态退出，并尊重提供程序的 `requestTimeoutMs`。当提供程序返回定价信息时（例如 OpenRouter），还会显示每 100 万个 token 的提示/完成定价（美元）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `list-models`                                                                                              | 列出活动提供程序通过其 `GET /models` 列表（按 ID 排序；活动提供程序遵循配置的 `provider` 键，可通过 `-P` / `--provider` 覆盖）公开的所有模型。需要该提供程序的 API 密钥（对于 Ollama 等无密钥提供程序则不需要）。当提供程序返回定价信息时（例如 OpenRouter），还会显示每 100 万个 token 的提示/完成定价（美元），并标记 `expiration_date` 之后过期的条目。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `list-languages [search]`                                                                                  | 以人类可读的表格形式列出捆绑的 UI 语言目录（`data/ui-languages-complete.json`）（代码、文本方向、英文名称、本地名称）；无需配置或 API 密钥。传递一个可选的 `search` 术语，以仅保留其代码、本地名称、英文名称或方向包含该术语的条目（不区分大小写），例如 `list-languages portuguese`、`list-languages rtl`、`list-languages zh`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `extract`                                                                                                  | 从 `t("…")` / `i18n.t("…")` 字面量、可选的 `package.json` 描述和可选的清单 `englishName` 条目（请参阅 `ui.reactExtractor`）更新 `strings.json`。需要非空的 `ui.sourceRoots`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `generate-ui-languages [--master <path>] [--dry-run]`                                                      | 使用 `sourceLocale` + `targetLocales` 和捆绑的 `data/ui-languages-complete.json`（或 `--master`）将 `ui-languages.json` 写入 `ui.flatOutputDir`（或设置时的 `uiLanguagesPath`）。如果主文件中缺少某个区域设置，则会发出警告并生成 `TODO` 占位符。如果您有包含自定义 `label` 或 `englishName` 值的现有清单，它们将被主目录的默认值替换 — 之后请查看并调整生成的文件。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                                         | 为每个 `docs` 块（`contentPaths`，可选 `docusaurusCatalogDir`）翻译 markdown/MDX 和 JSON。`-j`：最大并行区域设置；`-b`：每个文件的最大并行批处理 API 调用。`--prompt-format`：批处理线格式（`xml` \| `json-array` \| `json-object`）。请参阅 [缓存行为和 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags) 和 [批处理提示格式](#batch-prompt-format)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …`                                                                                      | 至少需要一个 `docs[]` 块。在每个块的 `contentPaths` 下收集 `.md` / `.mdx`（遵守 `.translate-ignore`）。在每个扁平 ATX `#` 标题的 **前面**插入一个 HTML 锚点行 `<a id="slug"></a>`（跳过代码块内的标题）；当锚点行已存在时，如果它不再匹配从当前标题文本派生的 slug，则更新 `id`。`-p` / `--path` 或 `-f` / `--file`：限制为项目相对文件或目录。`--slug-style`：`github`（默认；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`。使用 `pymdown` 时，可选 `--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--dry-run`：仅列出更改。                                                                                                                                                                                                                                                                                                                                    |
| `check-markdown …`                                                                                         | 扫描每个 `docs[]` 块的 `contentPaths` 下的 markdown/MDX（与 `translate-docs` 相同，遵守 `.translate-ignore`）：分隔符配对、未闭合的行内代码以及当 `**`/`__` 包裹 `[text](../../docs/url)` 链接时的 `STRONG_OUTSIDE_LINK`。 `-p` / `--path` 或 `-f` / `--file`：可选范围。将 `relativePath:line: [ISSUE_CODE] message` 行打印到 **stderr**；如果出现任何问题，退出代码为 **1**。 `--json`：在 **stdout** 上生成 JSON 报告。除非 `--no-cache`，否则在 `cacheDir` 中写入 `markdown_source_issues`。 `-v` 将源哈希添加到 stderr 行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                                          | 翻译 `config.svg` 中配置的 SVG 文件（与文档分开）。需要 `features.translateSVG`。与文档相同的缓存概念；支持 `--no-cache` 以跳过该运行的 SQLite 读取/写入。 `-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                 | 仅翻译 UI 字符串（`strings.json` → 区域设置 JSON）。 `-l` / `--locale`：逗号分隔的目标区域设置（默认为配置 / `ui-languages.json`）。 `--force`：为每个区域设置重新翻译所有条目（忽略现有翻译）。 `--dry-run`：无写入，无 API 调用。 `-j`：最大并行区域设置数。需要 `features.translateUIStrings`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `translate-json …`                                                                                         | 根据 `json[]` 翻译嵌套 JSON（需要 `features.translateJson`）。共享 SQLite 缓存；`-l`、`-p` / `--path`、`--dry-run`、`--force`、`--force-update`、`-b`、`--prompt-format`。请参阅 [工作流 3](#workflow-3---json-file-translation)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                      | 提取，然后翻译 UI 字符串（需要 `features.translateUIStrings`）。仅限 UI — 无文档、SVG 或 `json[]`。与 `translate-ui` 具有相同的 `-l`、`--force`、`--dry-run` 和 `-j` 选项。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                      | 先运行 `extract` **first**（需要 `features.translateUIStrings`），使 `strings.json` 与源匹配，然后由 LLM 审核 **source-locale** UI 字符串（拼写、语法）。**术语提示**仅来自 `glossary.userGlossary` CSV（范围与 `translate-ui` 相同 — 而不是 `strings.json` / `uiGlossary`，因此不良副本不会被强化为词汇表）。使用活动的 LLM 提供商（其 API 密钥环境变量）。仅为建议（运行完成后退出 **0**）。在 `cacheDir` 下写入 `lint-source-results_<timestamp>.log` 作为 **人类可读**报告（摘要、问题和每个字符串的 **OK** 行）；终端仅打印摘要计数和问题（不打印每个字符串的 `[ok]` 行）。在最后一行打印日志文件名。`--json`：仅在 stdout 上输出完整的机器可读 JSON 报告（日志文件保持人类可读）。`--dry-run`：仍然运行 `extract`，然后仅打印批处理计划（不进行 API 调用）。`--chunk`：每个 API 批次的字符串数（默认为 **50**）。`-j`：最大并行批次数（默认为 `concurrency`）。使用 `--json` 时，人类风格的输出会发送到 stderr。链接使用 `path:line`，例如 `dashboard` UI 字符串的“链接”按钮。 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`                                | 将 `strings.json` 导出到 XLIFF 2.0（每个目标区域设置一个 `.xliff`）。 `-o` / `--output-dir`：输出目录（默认：与目录相同的文件夹）。 `--untranslated-only`：仅导出缺少该区域设置翻译的单元。只读；无 API。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                                   | 提取（如果已启用），然后是 UI 翻译，然后是 `translate-svg`（当 `features.translateSVG` 和 `config.svg` 设置时），然后是文档翻译，然后是 `translate-json`（当 `features.translateJson` 和 `json[]` 设置时）——除非使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳过。共享标志：`-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（文档和 JSON 批处理）、`--force` / `--force-update`（文档和 JSON）。文档阶段还会转发 `--emphasis-placeholders` 和 `--debug-failed`（含义与 `translate-docs` 相同）。`--prompt-format` 不是 `sync` 标志；文档和 JSON 步骤使用内置默认值（`json-array`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `status [--max-columns <n>]`                                                                               | 当 `features.translateUIStrings` 开启时，会按区域设置打印 UI 覆盖率（`Translated` / `Missing` / `Total`）。然后按文件 × 区域设置打印 markdown 翻译状态（无 `--locale` 过滤器；区域设置来自配置）。大型区域设置列表会拆分成重复的表格，最多包含 `n` 列（默认 **9**），以便在终端中保持行宽。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                                           | 打印文档缓存和 `strings.json` 统计信息（与 Translation Dashboard → **Statistics** 的聚合数据相同）。`--max-columns`：每个模型 × 语言表的最大语言列数（默认值与仪表板匹配）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--backup <path>]`                                                      | 首先运行 `sync --force-update`（提取、UI、SVG、文档），然后删除过时的段落行（空 `last_hit_at` / 空文件路径）；删除解析后的源路径在磁盘上缺失的 `file_tracking` 行；删除其 `filepath` 元数据指向缺失文件的翻译行；修剪孤立的 `translation_failures` 行；修剪解析后的源路径在磁盘上缺失的孤立 `markdown_source_issues` 行。记录五个计数（过时段落、孤立 `file_tracking`、孤立翻译、孤立失败、孤立 Markdown 问题）。除非传入 `--backup <path>`，否则不进行 SQLite 备份，传入后会在修改前将备份写入该路径。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                                                 | **无配置。** 遍历目录树（默认：当前工作目录）查找 `*.log` 和 `cache.db.backup*.sqlite`，打印 `./…` 路径，例如 `find -print`。如果匹配：提示 `Delete these files? (y/n)`，除非 `-f` / `--force`（无提示删除）。如果没有匹配：退出，不提示。`--dry-run`：仅列出，不提示或删除（覆盖 `--force`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                                        | 启动翻译仪表板（用于缓存段、`strings.json`、词汇表、故障和统计信息的本地 Web UI）。默认端口 **8675**（如果不可用，则重试下一个端口）。使用 `--no-open` 时，默认浏览器不会自动打开。已弃用的别名 `editor` 仍然可用，但会打印警告。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `glossary-generate [-o <path>]`                                                                            | 编写一个空的 `glossary-user.csv` 模板。`-o`：覆盖输出路径（默认值：配置中的 `glossary.userGlossary`，或 `glossary-user.csv`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                                           | 显示子命令的帮助（与 `ai-i18n-tools <command> --help` 输出相同）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

<a id="root-and-global-options"></a>
### 根和全局选项

| 选项                       | 范围         | 描述                                                                                      |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | 根程序  | 输出版本号和构建时间戳（与 `version` 子命令相同的信息）。 |
| `-h` / `--help`              | 根程序  | 显示根程序或命令的帮助信息。      |
| `-c` / `--config <path>`     | 所有命令 | 配置文件路径（默认：`ai-i18n-tools.config.json`）。                                  |
| `-v` / `--verbose`           | 所有命令 | 详细日志记录。                                                                          |
| `-P` / `--provider <name>`   | 每个命令 | 此运行的活动 LLM 提供程序；覆盖配置 `provider` 键。必须在 `providers` 下进行配置。 |
| `-w` / `--write-logs [path]` | 所有命令 | 将控制台输出复制到 `.log` 文件（默认路径：根目录下的 `cacheDir`）。                |

<a id="per-command-help"></a>
### 按命令查看帮助

| 用法                            | 描述                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | 该命令的所有选项。      |
| `ai-i18n-tools help <command>`   | 输出与 `<command> --help` 相同。 |

<a id="target-locales--l----locale"></a>
### 目标语言（`-l` / `--locale`）

| 命令                                                                                | 行为                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — 以逗号分隔的目标 BCP-47 代码（例如 `de,fr,pt-BR`）。省略时，默认值来自配置（`json[]` 块也可以设置每个块的 `targetLocales`）。UI 步骤也使用 `ui-languages.json`。 |
| `lint-source`                                                                           | `-l` / `--locale <code>` — 要审查的单个源语言（默认：配置 `sourceLocale`）。                                                            |

---

<a id="environment-variables"></a>
## 环境变量

| 变量               | 描述                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` 提供商的 API 密钥（在激活时需要）。 |
| 其他提供商密钥    | 每个提供商读取自己的密钥环境变量：`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY`（Ollama 不需要）。使用 `providers.<name>.apiKeyEnv` 为每个提供商覆盖。 |
| `OPENROUTER_BASE_URL`  | 覆盖 `providers.openrouter.baseUrl`（仅当该提供商已配置时）。 |
| `OLLAMA_BASE_URL`      | 覆盖 `providers.ollama.baseUrl`（仅当该提供商已配置时）。 |
| `I18N_SOURCE_LOCALE`   | 在运行时覆盖 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`  | 以逗号分隔的语言代码，用于覆盖 `targetLocales`。  |
| `I18N_LOG_LEVEL`       | 日志记录器级别（`debug`, `info`, `warn`, `error`, `silent`）。 |
| `NO_COLOR`             | 当 `1` 时，禁用日志输出中的 ANSI 颜色。              |
| `I18N_LOG_SESSION_MAX` | 每个日志会话保留的最大行数（默认 `5000`）。           |
