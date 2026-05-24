<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools：入门指南

`ai-i18n-tools` 提供三个独立且可组合的工作流程：

- **工作流程 1 - UI 翻译**：从任意 JS/TS 源码中提取 `t("…")` 调用，通过 OpenRouter 进行翻译，并生成适用于 i18next 的扁平化按语言划分的 JSON 文件。
- **工作流程 2 - 文档翻译**：通过 `translate-docs` 翻译 `docs[].contentPaths` 中列出的 **Markdown、MDX 和 `.astro` 页面**，支持智能缓存。当启用 `features.translateDocs` 时，可选的 **Docusaurus 目录 JSON**（`docs[].docusaurusCatalogDir`，来自 `docusaurus write-translations`）也会在同一命令中被翻译——用于翻译站点外壳（导航栏、页脚、主题字符串），而非 `docs/` 中的正文内容。
- **工作流程 3 - JSON 文件翻译**：通过顶层的 `json[]`、`features.translateJson` 和 `translate-json` 翻译任意嵌套的 JSON 包（例如 `src/i18n/en/translation.json`）——适用于将 UI 文本存储在按语言划分的 JSON 文件中而非源码中使用 `t()` 的站点。

**SVG** 资源使用 `features.translateSVG`、顶层的 `svg` 块以及 `translate-svg`（参见 [CLI 参考](#cli-reference)）。

**选择哪个工作流程？** 源码中通过 `t()` 提供的面向用户的字符串 → 工作流程 1（`extract` / `translate-ui`）。本地化的页面或 Docusaurus 外壳 JSON → 工作流程 2（`translate-docs`）。仅使用独立的嵌套 JSON 语言文件 → 工作流程 3（`translate-json`）。

两个工作流均使用 OpenRouter（任何兼容的 LLM）并共享一个配置文件。

<small>**阅读其他语言版本：** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目录**

- [安装](#installation)
- [快速开始](#quick-start)
  - [推荐的 `package.json` 脚本](#recommended-packagejson-scripts)
- [工作流 1 - UI 翻译](#workflow-1---ui-translation)
  - [步骤 1：初始化](#step-1-initialise)
  - [步骤 2：提取字符串](#step-2-extract-strings)
  - [步骤 3：翻译 UI 字符串](#step-3-translate-ui-strings)
  - [导出为 XLIFF 2.0（可选）](#exporting-to-xliff-20-optional)
  - [步骤 4：运行时集成 i18next](#step-4-wire-i18next-at-runtime)
  - [在源码中使用 `t()`](#using-t-in-source-code)
  - [插值](#interpolation)
  - [基数复数（`plurals: true`）](#cardinal-plurals-plurals-true)
  - [语言切换器 UI](#language-switcher-ui)
  - [RTL 语言](#rtl-languages)
- [工作流 2 - 文档翻译](#workflow-2---document-translation)
  - [步骤 1：为文档初始化](#step-1-initialise-for-documentation)
  - [步骤 2：翻译文档](#step-2-translate-documents)
    - [复杂 Markdown 和质量检查失败](#complex-markdown-and-failed-quality-checks)
    - [缓存行为和 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags)
    - [批量提示格式](#batch-prompt-format)
    - [SQLite 中的片段去重和路径](#segment-dedupe-and-paths-in-sqlite)
  - [输出布局](#output-layouts)
    - [当 `markdownOutput.style = "flat"` 时的锚点链接](#anchor-links-when-markdownoutputstyle--flat)
    - [翻译文档中的图像和光栅资源](#images-and-raster-assets-in-translated-docs)
    - [语言切换器 (`languageListBlock`)](#language-switcher-languagelistblock)
    - [`pathTemplate` / `jsonPathTemplate` 占位符](#pathtemplate--jsonpathtemplate-placeholders)
  - [故障排除](#troubleshooting)
- [组合工作流 (UI + 文档)](#combined-workflow-ui--docs)
  - [混合文档工作流 (`markdownOutput.style = "docusaurus"` + `"flat"`)](#mixed-documentation-workflow-markdownoutputstyle--docusaurus--flat)
- [翻译仪表板](#translation-dashboard)
  - [失败（文档翻译）](#failures-document-translation)
    - [何时使用](#when-to-use-it)
    - [为何源文件编辑很重要](#why-source-edits-matter)
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
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [Git 排除的最佳实践：](#best-practice-for-git-exclusions)
  - [`documentations`](#documentations)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLI 参考](#cli-reference)
- [环境变量](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## 安装

发布的包仅包含 **ESM**。在 Node.js 或打包工具中使用 `import`/`import()`；请勿使用 `require('ai-i18n-tools')`。该包声明了 `engines.node` `>=22.16.0`；不支持较旧版本的 Node.js。npm 压缩包仅在 `docs/` 下包含英文文件；特定区域设置的副本位于 [GitHub 仓库](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) 中的 `translated-docs/` 下。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools 内置字符串提取器。如果您之前使用过 `i18next-scanner`、`babel-plugin-i18next-extract` 或类似工具，在迁移后可以移除这些开发依赖。

<a id="using-the-cli"></a>
### 使用 CLI

**按项目安装（推荐）** — 作为依赖项或开发依赖项安装，然后通过 `npx`、`pnpm exec` 或 `package.json` 脚本调用。`package.json` 脚本已在 `PATH` 上使用 `node_modules/.bin` 运行，因此像 `pnpm run i18n:sync` 这样的命令可以直接调用 CLI，无需输入 `npx`。

**裸** `ai-i18n-tools` **在终端中:** 要在交互式 shell 中直接运行 CLI（从项目根目录，在本地安装后），请将本地 bin 目录添加到 `PATH`:

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

使用 [**direnv**](https://direnv.net/)，在项目根目录中添加 `PATH_add node_modules/.bin` 到 `.envrc`，以便在 `cd` 进入仓库后可以使用该基本命令。在不调整 `PATH` 的情况下，继续使用 `npx ai-i18n-tools …` 或 `pnpm exec ai-i18n-tools …`。

**零安装一次性执行** — 使用 `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（仅下载该次调用所需的包，不会在 `package.json` 中添加条目）。

在 Linux、macOS 和 WSL 上，注册表安装会自动为 CLI 脚本设置可执行权限。在 Windows 上，包管理器会生成 `.cmd` 和 `.ps1` shim，以显式调用 Node。

设置您的 OpenRouter API 密钥：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

或者在项目根目录创建一个 `.env` 文件：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## 快速开始

默认的 `init` 模板 (`ui-markdown`) 仅启用 **UI** 提取和翻译。`ui-docusaurus` 和 `ui-starlight` 模板启用 **文档** 翻译 (`translate-docs`)。`ui-astro-website` 模板为普通 Astro 应用程序（包括 `.astro` 文件）搭建 **UI** 提取；当您还想要 `translate-docs` 用于 `.astro` 页面 HTML 时，请添加 `documentations[]` 块（请参见 [Astro 网站页面 (解析和替换)](#astro-website-parse-and-replace)）。参考 [`examples/astro-website`](../../docs/../examples/astro-website/) 使用 **两个** 管道。当您希望有一个命令运行提取、UI 翻译、可选的 SVG 文件翻译和根据您的配置进行文档翻译时，请使用 `sync`。

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

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 推荐的 `package.json` 脚本

在本地安装该包后，你可以在脚本中直接使用 CLI 命令（无需 `npx`）。

**优先使用** `sync` 处理任何曾经是“运行 `translate-ui`，然后 `translate-svg`，然后 `translate-docs`”的内容：`ai-i18n-tools sync` 运行 **提取**（当启用时），**翻译 UI**，可选的 **翻译 SVG**，然后 **翻译文档**——按照正确的顺序和共享标志——根据您的配置。手动链接这三个翻译命令容易出错（顺序、提取、区域设置标志）。仅在您需要单独的 **单步** 时使用 `i18n:translate:ui`、`i18n:translate:svg` 和 `i18n:translate:docs`。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## 工作流 1 - UI 翻译

适用于任何使用 i18next 的 JS/TS 项目：React 应用、Next.js（客户端和服务端组件）、Node.js 服务、CLI 工具。

<a id="step-1-initialise"></a>
### 步骤 1：初始化

```bash
npx ai-i18n-tools init
```

这会使用 `ui-markdown` 模板写入 `ai-i18n-tools.config.json`。编辑它以设置：

- `sourceLocale` - 您的源语言 BCP-47 代码（例如 `"en-GB"`）。 **必须匹配** 从您的运行时 i18n 设置文件导出的 `SOURCE_LOCALE`（`src/i18n.ts` / `src/i18n.js`）。
- `targetLocales` - 目标语言的 BCP-47 代码数组（例如 `["de", "fr", "pt-BR"]`）。运行 `generate-ui-languages` 从此列表创建 `ui-languages.json` 清单。
- `ui.sourceRoots` - 要扫描的目录或 glob 模式，以查找 `t("…")` 调用（例如 `["src/"]`，`["src/**/*.ts"]`）。
- `ui.stringsJson` - 主目录的写入位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 在哪里写 `de.json`, `pt-BR.json`, 等等（例如 `"src/locales/"`）。
- `ui.preferredModel`（可选） - OpenRouter 模型 ID，仅尝试 **first** 的 `translate-ui`；如果失败，CLI 将按顺序继续使用 `openrouter.translationModels`（或遗留的 `defaultModel` / `fallbackModel`），跳过重复项。

<a id="step-2-extract-strings"></a>
### 步骤 2：提取字符串

```bash
npx ai-i18n-tools extract
```

扫描 `ui.sourceRoots` 下所有 JS/TS 文件中的 `t("literal")` 和 `i18n.t("literal")` 调用。写入（或合并到）`ui.stringsJson`。

扫描器是可配置的：通过 `ui.uiExtractor.funcNames`（或遗留的 `ui.reactExtractor.funcNames`）添加自定义函数名称。对于 Astro 页面和组件，将 `.astro` 添加到 `ui.uiExtractor.extensions`。

<a id="astro-website"></a>
### Astro 网站（普通 Astro，而非 Starlight）

对于静态 Astro 营销或应用程序网站，将 [Astro 内置 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 与 ai-i18n-tools 结合使用。参考实现是 [`examples/astro-website`](../../docs/../examples/astro-website/)（另请参见其 [README](../../docs/../examples/astro-website/README.md)）：英语在 `/`，九个目标语言在 `/{locale}/`（`de`，`fr`，`es`，`ar`，`ja`，`ko`，`zh-cn`，`zh-tw`，`pt-br`）。

大多数团队使用两个管道的 **混合**（它们不会冲突）：

| 管道 | 用于 | 命令 | 输出 |
|----------|---------|----------|--------|
| **页面 HTML** | 标题、段落、导航标签、模板主体中的内联数组 | `translate-docs` | 每个语言的 `src/pages/{locale}/index.astro` |
| **UI 字符串 (`t()`)** | 前置数据、截图标签、共享数组 | `extract` → `translate-ui` | `public/locales/{locale}.json`（英语源作为键） |

当您添加或删除语言时，请保持三个列表对齐：`targetLocales` 在 `ai-i18n-tools.config.json`，`i18n.locales` 在 `astro.config.mjs`（Astro 使用 **小写** 路由代码，例如 `pt-br`），以及 `ui-languages.json`（通过 `generate-ui-languages`）。平面包 **文件名** 使用配置大小写（`pt-BR.json`）；通过您的清单 `code` 字段将 Astro 的 `pt-br` 路由映射到该文件（请参见 `examples/astro-website/src/i18n/locale.ts`）。

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

<a id="astro-website-ui-strings"></a>
### Astro 网站 UI 字符串 (SSG)

使用 `init -t ui-astro-website` 搭建 UI 提取，然后在您还翻译页面 HTML 时合并 `documentations[]` 块（见下文）。在 TypeScript 模块和 `.astro` 前置数据中将文本包裹在 `t('…')` 中（以及当您更喜欢 UI 字符串而不是重复的语言页面时的模板 `{expression}` 块）：

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

将 `sourceLocale` 设置为与 `i18n.defaultLocale` 在 `astro.config.mjs` 中匹配。将平面包写入 Astro 可以在构建时导入的目录（模板使用 `public/locales/`）。通过查找英语源文字作为键在 **构建时** 解析 `t('…')`（请参见 `examples/astro-website/src/i18n/t.ts`；`strings.json` 是提取缓存，而不是运行时包）。您 **不** 需要 `ai-i18n-tools/runtime` 或 i18next 用于静态站点，除非您添加在加载后切换语言的客户端岛屿。

连接每个调用 `t()` 的页面（英语根页面和每个 `src/pages/{locale}/` 副本）：

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

示例中的支持助手：`src/i18n/utils.ts`、`src/i18n/locale.ts` 和 `ui-languages.json` 用于标签、方向和 BCP-47 代码。在更改 `targetLocales` 后运行 `generate-ui-languages`（可选设置 `ui.uiLanguagesPath` 以便清单与您的助手并排存在，例如 `src/i18n/ui-languages.json`）。`MainLayout.astro` 从 `resolveUiLanguage(Astro.currentLocale)` 设置 `<html lang>` 和 `<html dir>`；`LanguagePicker.astro` 使用 `getRelativeLocaleUrl` 从 `astro:i18n`。

<a id="astro-website-parse-and-replace"></a>
### Astro 网站页面（解析和替换）

对于在 `.astro` 文件中硬编码 HTML 的营销页面，让 `translate-docs` 提取文本节点和属性（`alt`、`title`、`aria-label`、`placeholder`），使用文档缓存翻译它们，并在您的页面树下写入特定语言的副本。对于大多数可见文本，您 **不** 需要 `t()`。

结构属性和键值默认情况下**不**会被翻译：内置保护涵盖了JSX/HTML属性，如`class`、`id`、`style`、`src`、`href`、`data-*`和大多数`aria-*`，以及模板`{expression}`块内的对象键，如`class`、`key`和`id`。使用`documentations[].protectAttributes`和`documentations[].protectKeys`在使用自定义属性时扩展这些列表（例如Tailwind `variant`或CMS `slug`字段）。相同的选项适用于Markdown翻译中的MDX JSX（请参见[protectAttributes / protectKeys](#protectattributes-protectkeys)）。

启用`features.translateMarkdown`并添加一个`documentations[]`块，例如：

```json
{
  "features": { "translateMarkdown": true },
  "documentations": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "markdownOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

运行`npx ai-i18n-tools translate-docs`（或在[`pnpm i18n:translate`](../../docs/../examples/astro-website/)中`pnpm i18n:translate`）。英语源保持在`src/pages/index.astro`；每个目标语言环境获得`src/pages/{locale}/index.astro`，并根据额外的目录级别调整导入（例如`../layouts/` → `../../layouts/`）。

在**模板主体**内，`{expression}`块中的字符串字面量（内联数组、对象`title`/`desc`字段）在用户可见时会被翻译；受保护属性/键上的引号值、`t('…')`、`<script>`和`<style>`内的字面量保持不变。**前置类型脚本不会通过此路径翻译**——保持共享前置（包括`t()`导入和数据数组）在英语和语言环境页面上相同，或在编辑英语页面后重新运行`translate-docs`，以便语言环境副本获取前置更改。对于仅前置复制，请使用[UI字符串管道](#astro-website-ui-strings)。

请参见[`examples/astro-website`](../../docs/../examples/astro-website/)以获取完整的混合着陆页（通过`translate-docs`的HTML，截图标签通过`t()` + `translate-ui`）。

<a id="step-3-translate-ui-strings"></a>
### 步骤 3：翻译 UI 字符串

```bash
npx ai-i18n-tools translate-ui
```

读取 `strings.json`，向每个目标区域设置批量发送请求至 OpenRouter，并将扁平化的 JSON 文件（`de.json`、`fr.json` 等）写入 `ui.flatOutputDir`。当设置了 `ui.preferredModel` 时，会优先尝试该模型，失败后按 `openrouter.translationModels` 中的顺序尝试（文档翻译和其他命令仍仅使用 `openrouter`）。

对于每个条目，`translate-ui` 会将成功翻译每个区域设置的 **OpenRouter 模型 ID** 存储在一个可选的 `models` 对象中（与 `translated` 的区域设置键相同）。在本地 `dashboard` 命令中编辑的字符串会在该区域设置的 `models` 中标记为哨兵值 `user-edited`。`ui.flatOutputDir` 下每个区域设置的扁平文件仅包含 **源字符串 → 翻译**；不包含 `models`（因此运行时包保持不变）。

> **注意：** 如果你在翻译仪表板中编辑了某个条目，需要运行 `sync --force-update`（或使用 `--force-update` 的等效 `translate` 命令）以使用更新后的缓存条重写输出文件。此外，请注意，如果源文本之后发生变化，你的手动编辑将会丢失，因为新的源字符串将生成新的缓存键（哈希值）。

<a id="exporting-to-xliff-20-optional"></a>
### 导出为 XLIFF 2.0（可选）

若要将 UI 字符串交给翻译供应商、TMS 或 CAT 工具，请将目录导出为 **XLIFF 2.0** 格式（每个目标区域设置一个文件）。此命令为 **只读**：不会修改 `strings.json` 或调用任何 API。

```bash
npx ai-i18n-tools export-ui-xliff
```

默认情况下，文件写入到 `ui.stringsJson` 旁边，命名为 `strings.de.xliff`、`strings.pt-BR.xliff`（您的目录文件名 + 区域设置 + `.xliff`）。使用 `-o` / `--output-dir` 指定其他输出位置。来自 `strings.json` 的现有翻译会出现在 `<target>` 中；缺失的区域设置使用 `state="initial"` 且无 `<target>`，以便工具填充。使用 `--untranslated-only` 仅导出每个区域设置仍需翻译的单元（适用于供应商批量处理）。`--dry-run` 仅打印路径而不写入文件。

<a id="step-4-wire-i18next-at-runtime"></a>
### 第 4 步：在运行时配置 i18next

使用 `'ai-i18n-tools/runtime'` 导出的辅助函数创建你的 i18n 配置文件：

<details>
<summary>完整的 i18n 初始化示例 (src/i18n.js)</summary>

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

#### 保持 `SOURCE_LOCALE` 同步

**保持三个值一致：** `sourceLocale` 在 `ai-i18n-tools.config.json` 中，本文件中的 `SOURCE_LOCALE`，以及扁平 JSON 复数形式的 `translate-ui` 写入到扁平输出目录下的 `{sourceLocale}.json`（通常是 `public/locales/`）。在静态 `import` 中使用相同的文件名基（例如上面的例子：`en-GB` → `en-GB.json`）。`sourcePluralFlatBundle` 中的 `lng` 字段必须等于 `SOURCE_LOCALE`。静态 ES `import` 路径不能使用变量；如果你更改了源语言环境，请同时更新 `SOURCE_LOCALE` 和导入路径。或者，使用动态 `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`、`fetch` 或 `readFileSync` 来加载该文件，使路径由 `SOURCE_LOCALE` 构建。

该代码片段假设 `i18n` 与这些文件夹位于同一级目录下，因此使用了 `./locales/…` 和 `./public/locales/…`。如果你的文件位于 `src/` 下（常见情况），请使用 `../locales/…` 和 `../public/locales/…`，以便导入路径与 `ui.stringsJson`、`uiLanguagesPath` 和 `ui.flatOutputDir` 保持一致。

在 React 渲染之前导入 `i18n.js`（例如，在入口文件的顶部）。当用户切换语言时，调用 `await loadLocale(code)`，然后调用 `i18n.changeLanguage(code)`。

`SOURCE_LOCALE` 被导出，以便任何需要它的其他文件（例如语言切换器）可以直接从 `'./i18n'` 导入。如果你正在迁移现有的 i18next 配置，请将组件中散落的硬编码源语言字符串（例如 `'en-GB'` 判断）替换为从 i18n 引导文件导入的 `SOURCE_LOCALE`。

如果你不希望使用默认导出，也可以使用具名导入（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`）。

#### 区域设置加载器

通过使用 `makeLocaleLoadersFromManifest` 从 `ui-languages.json` 派生，使 `localeLoaders` **与配置保持一致**（这会使用与 `makeLoadLocale` 相同的规范化方式过滤掉 `SOURCE_LOCALE`）。当你向 `targetLocales` 添加一个区域设置并运行 `generate-ui-languages` 时，清单会被更新，你的加载器会自动跟踪此更改——无需维护单独的硬编码映射。

对于 `public/` 下的 JSON 包（典型的 Next.js 设置），从你的公共 URL 路径获取：

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

对于没有打包工具的 Node CLI，使用 `readFileSync` 在一个小型辅助函数中读取并解析每个代码的 JSON 文件。

#### 运行时辅助函数参考

`aiI18n.defaultI18nInitOptions(sourceLocale)` 返回键作为默认值设置的标准选项：

- `parseMissingKeyHandler` 返回键本身，因此未翻译的字符串将显示源文本。
- `nsSeparator: false` 允许键中包含冒号。
- `interpolation.escapeValue: false` — 可以安全禁用：React 本身会转义值，而 Node.js/CLI 输出没有需要转义的 HTML。

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` 是 ai-i18n-tools 项目的 **推荐** 配置方式：它应用了 key-trim + 源语言 <code>"{{var}}"</code> 插值回退（行为与底层的 `wrapI18nWithKeyTrim` 相同），可选择性地通过 `addResourceBundle` 合并 `translate-ui` `{sourceLocale}.json` 的复数后缀键，然后从您的 `strings.json` 安装支持复数的 `wrapT`。仅在项目初始化阶段省略 `sourcePluralFlatBundle`（一旦 `translate-ui` 生成了 `{sourceLocale}.json`，就应将其合并）。在应用代码中单独使用 `wrapI18nWithKeyTrim` 已被 **弃用** — 请改用 `setupKeyAsDefaultT`。

`makeLoadLocale(i18n, loaders, sourceLocale)` 返回一个异步的 `loadLocale(lang)` 函数，用于动态导入某个语言环境的 JSON 包并将其注册到 i18next。

<a id="using-t-in-source-code"></a>
### 在源码中使用 `t()`

使用 **字面量字符串** 调用 `t()`，以便提取脚本能够找到它：

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

相同的模式也适用于 React 之外的环境（Node.js、服务端组件、CLI）：

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**规则：**

- 仅提取以下形式：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")`。
- 键必须是 **字面字符串** — 键不能使用变量或表达式。
- 不要对键使用模板字符串：<code>{'t(`Hello ${name}`)'}</code> 无法被提取。

<a id="interpolation"></a>
### 插值

使用 i18next 的原生第二个参数插值来处理 <code>"{{var}}"</code> 占位符：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

extract 命令会解析 **第二个参数**，当它是一个纯对象字面量时，读取仅用于工具的标志，例如 `plurals: true` 和 `zeroDigit`（参见下方的 **基数复数**）。对于普通字符串，仅使用字面量键进行哈希；插值选项仍会在运行时传递给 i18next。

如果您的项目使用自定义插值工具（例如调用 `t('key')` 然后将结果通过模板函数如 `interpolateTemplate(t('Hello {{name}}'), { name })` 传递），`setupKeyAsDefaultT`（通过 `wrapI18nWithKeyTrim`）使其变得不必要——即使源语言返回原始键，它也会应用 <code>"{{var}}"</code> 插值。将调用站点迁移到 `t('Hello {{name}}', { name })` 并移除自定义工具。

<a id="cardinal-plurals-plurals-true"></a>
### 基数复数（`plurals: true`）

使用您希望作为开发者默认文本的 **相同字面量**，并传入 `plurals: true`，以便 extract 和 `translate-ui` 将该调用视为一个 **基数复数组**（符合 i18next JSON v4 风格的 `_zero` … `_other` 形式）。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit`（可选）— 仅用于工具，**不会**被 i18next 读取。当设置为 `true` 时，提示会倾向于在每个存在该形式的区域中使用字面阿拉伯数字 `0` 作为 `_zero` 字符串；当设置为 `false` 或省略时，使用自然的零值表达方式。在调用 `i18next.t` 前应移除这些键（参见下方的 `wrapT`）。

**验证:** 如果消息包含 **两个或更多** 不同的 `{{…}}` 占位符， **其中一个必须是** `{{count}}`（复数轴）。否则 `extract` **失败**，并显示明确的文件/行消息。

**两个独立计数**（例如章节和页数）不能共享一个复数消息 — 应使用 **两个** `t()` 调用（每个都带有 `plurals: true` 及其各自的 `count`），并在 UI 中拼接。

**v1 中不包含：** 序数复数（`_ordinal_*`、`ordinal: true`）、区间复数、仅限 ICU 的管道。

#### 复数形式的存储与生成方式

**在** `strings.json` 复数组中，每条哈希使用 **一行一记录**，包含 `"plural": true`、原始字面量 `source`，以及一个将基数类别（`zero`、`one`、`two`、`few`、`many`、`other`）映射到对应区域字符串的对象 `translated[locale]`。

**扁平化区域 JSON：** 非复数行保持 **源句 → 翻译** 格式。复数行以 `<groupId>_original`（等于 `source`，供参考）和每个后缀的 `<groupId>_<form>` 形式输出，以便 i18next 原生解析复数。`translate-ui` 还会写入一个仅包含 **复数扁平键** 的 `{sourceLocale}.json`（为源语言加载此包，以便带后缀的键能正确解析；普通字符串仍使用键作为默认值）。对于每个目标区域，输出的后缀键会匹配该区域的 `Intl.PluralRules`（`requiredCldrPluralForms`）：如果 `strings.json` 因压缩后与其他类别相同而省略了某个类别（例如阿拉伯语的 `many` 与 `other` 相同），`translate-ui` 仍会通过从回退的同类字符串复制，将每个必需的后缀写入扁平文件，确保运行时查找不会丢失任何键。

运行时（`ai-i18n-tools/runtime`）：**调用** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — 它会运行 `wrapI18nWithKeyTrim`，注册可选的 `translate-ui` `{sourceLocale}.json` 复数包，然后使用 `buildPluralIndexFromStringsJson(stringsJson)` 执行 `wrapT`。`wrapT` 会剥离 `plurals` / `zeroDigit`，在需要时将键重写为组 ID，并转发 `count`（可选：如果只有一个非 `{{count}}` 占位符，则 `count` 会从该数值选项复制）。

**较旧环境：** `Intl.PluralRules` 对工具和行为一致性是必需的；如果需要支持非常旧的浏览器，请使用 polyfill。

<a id="language-switcher-ui"></a>
### 语言切换器 UI

使用 `ui-languages.json` 清单构建语言选择器。`ai-i18n-tools` 导出两个显示辅助函数：

<details>
<summary>LanguageSelect 组件示例 (React)</summary>

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
    i18n.changeLanguage(code);
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

`getUILanguageLabel(lang, t)` - 翻译后显示 `t(englishName)`，或两者不同时显示 `englishName / t(englishName)`。适用于设置界面。

`getUILanguageLabelNative(lang)` - 显示 `englishName / label`（每行不调用 `t()`）。适用于希望显示本地名称的页眉菜单。

`ui-languages.json` 清单是一个 JSON 数组，包含 <code>"{ code, label, englishName, direction }"</code> 条目（`direction` 是 `"ltr"` 或 `"rtl"`）。示例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

清单由 `generate-ui-languages` 根据 `sourceLocale` + `targetLocales` 和捆绑的主目录生成，并写入 `ui.flatOutputDir`。如果更改了配置中的任何区域设置，请运行 `generate-ui-languages` 来更新 `ui-languages.json` 文件。

<a id="rtl-languages"></a>
### 从右到左语言

`ai-i18n-tools` 导出 `getTextDirection(lng)` 和 `applyDirection(lng)`：

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` 设置 `document.documentElement.dir`（浏览器环境）或为空操作（Node.js 环境）。可传入可选的 `element` 参数以指定目标元素。

对于可能包含 `→` 箭头的字符串，在 RTL 布局中需翻转它们：

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## 工作流程 2 - 文档翻译

主要针对 `docs[].contentPaths` 下的 **Markdown、MDX 和 `.astro` 文档** 设计。在 Docusaurus 站点中，将 `docs[].docusaurusCatalogDir` 设置为 `write-translations` 目录文件夹（例如 `docs-site/i18n/en`），以便 `translate-docs` 同时翻译外壳 JSON（导航栏、页脚、主题字符串）。对于嵌入在 Markdown 中的 PNG 和其他光栅图像，请参阅 [翻译文档中的图像和光栅资源](#images-and-raster-assets-in-translated-docs)。如需在 README 或文档中添加可选的 **语言切换器** 块并使用 `docsOutput.style = "flat"`，请参阅 [语言切换器（`languageListBlock`）](#language-list-block)。当启用 `features.translateSVG` 时，SVG 文件通过 [`translate-svg`](#cli-reference) 进行翻译——而非通过 `docs[].contentPaths`。任意嵌套的 UI JSON 文件使用工作流程 3（`json[]` / `translate-json`），而非 `docs[]`。

<a id="step-1-initialise-for-documentation"></a>
### 步骤 1：为文档初始化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

适用于 Astro Starlight 文档站点：

```bash
npx ai-i18n-tools init -t ui-starlight
```

对于普通Astro网站UI（无Starlight）：

```bash
npx ai-i18n-tools init -t ui-astro-website
```

该模板仅启用 UI 提取。如需翻译页面 HTML，还需设置 `features.translateDocs` 并添加一个 `docs[]` 块（参见 [Astro 网站页面（解析与替换）](#astro-website-parse-and-replace)）。[`examples/astro-website`](../../docs/../examples/astro-website/) 配置展示了两个管道的组合使用。

编辑生成的 `ai-i18n-tools.config.json`：

- `sourceLocale` - 源语言（必须与 `docusaurus.config.js` 中的 `defaultLocale` 一致）。
- `targetLocales` - BCP-47 语言代码数组（例如 `["de", "fr", "es"]`）。
- `cacheDir` - 所有管道共享的 SQLite 缓存目录（也是 `--write-logs` 的默认日志目录）。
- `docs` - 文档块数组。每个块包含可选的 `description`、`contentPaths`（字符串或数组；文件、目录或通配符）、`outputDir`、可选的 `docusaurusCatalogDir`、`docsOutput`、可选的 `segmentSplitting`、`translateFrontmatterFields`、`protectAttributes`、`protectKeys`、`targetLocales`、`addFrontmatter` 等。
- `docs[].description` - 可选的维护者备注。设置后，它将显示在 `translate-docs` 标题和 `status` 章节标题中。
- `docs[].contentPaths` - Markdown/MDX/`.astro` 源文件（以及可选的用于 Docusaurus 外壳 JSON 的 `docusaurusCatalogDir`）。
- `docs[].outputDir` - 该块的翻译输出根目录。
- `docs[].docsOutput.style` - `"nested"`（默认）、`"flat"`、`"doc-system"` 或别名 `"docusaurus"` / `"astro-starlight"`（参见 [输出布局](#output-layouts)）。

**主用与辅助：** 以 `contentPaths` 为重点进行本地化页面翻译。当同时需要从 `write-translations` 获取 Docusaurus 外壳 JSON 时，设置 `docusaurusCatalogDir`。如果仅翻译页面，则省略 `docusaurusCatalogDir`。

<a id="step-2-translate-documents"></a>
### 步骤 2：翻译文档

```bash
npx ai-i18n-tools translate-docs
```

这会将每个 `docs[]` 块中的 `contentPaths` 内所有文件（以及当设置 `docusaurusCatalogDir` 时的 Docusaurus 目录 JSON）翻译成所有有效的文档语言。已翻译的片段将从 SQLite 缓存中提供——只有新增或更改的片段才会发送给 LLM。

要翻译单个区域设置：

```bash
npx ai-i18n-tools translate-docs --locale de
```

要检查需要翻译的内容：

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### 复杂的 Markdown 和质量检查失败

`translate-docs` 会检查每个翻译片段是否保留了 Markdown 结构（包括从文档解析的强调格式）。包含多个 `bold` 跨度围绕 `` `inline code` ``、在粗体中嵌套反引号（例如模板字面量如 `` `fetch(\`/locales/${code}.json\`)` ``），或在一个长句中交织粗体和代码的段落较为脆弱：某些区域设置需要不同的词序，这可能导致翻译后 `**` 和 `` ` `` 对齐方式发生变化，并触发 CLI 错误，例如 `AST mismatch`。

**如果遇到此类验证失败，建议简化源语言文本**——拆分段落、将示例移至围栏代码块，或用更少的粗体/代码组合描述相同概念——而不是期望每个模型和区域设置都能完美复现密集的内联标记。本页其他位置（特别是步骤 4 中关于 `SOURCE_LOCALE`、加载器和 `public/` 路径的说明）的格式是刻意贴近实际的；当你在自己的文档中复用类似表述时，在广泛翻译时应保持更简洁。

要查看 **哪些片段翻译失败**、失败频率以及存储的 **质量/错误信息**，可使用翻译仪表板的 **失败** 标签页（[翻译仪表板 → 失败](#failures-document-translation)）。

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### 缓存行为和 `translate-docs` 标志

CLI 使用 SQLite 保存 **文件跟踪**信息（每个文件 × 区域设置的源哈希）和 **段落**记录（每个可翻译块 × 区域设置的哈希）。正常运行时，如果已记录的哈希与当前源匹配 **且**输出文件已存在，则完全跳过该文件；否则处理该文件，并使用段落缓存，以避免对未更改的文本调用 API。

| 标志                          | 效果                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(默认)*                   | 当跟踪内容与磁盘上的输出一致时跳过未更改的文件；其余内容使用片段缓存。                                                                                                                                                                          |
| `-l, --locale <codes>`        | 以逗号分隔的目标区域设置（若省略，则默认为根 `targetLocales` 和每个 `documentations[]` 块中可选的 `targetLocales` 的并集）。                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | 仅在此路径下翻译 markdown/JSON（项目相对、绝对或 glob 模式）； `--file` 是 `--path` 的别名。                                                                                                                                 |
| `--dry-run`                   | 不写入文件且不调用 API。                                                                                                                                                                                                                                        |
| `--type <kind>`               | 限制为 `markdown` 或 `json`（否则在配置中启用时两者都处理）。                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | 仅翻译 JSON 标签文件，或跳过 JSON 仅翻译 Markdown。                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | 最大并行目标区域设置数（默认来自配置或 CLI 内置默认值）。                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | 每个文件的最大并行批处理 API 调用数（文档；默认来自配置或 CLI）。                                                                                                                                                                                               |
| `--emphasis-placeholders`     | 在翻译前将 Markdown 强调标记掩码为占位符（可选；默认关闭）。                                                                                                                                                                              |
| `--debug-failed`              | 当验证失败时，在 `cacheDir` 下写入详细的 `FAILED-TRANSLATION` 日志。                                                                                                                                                                                        |
| `--force-update`              | 即使文件跟踪本应跳过，也会重新处理每个匹配的文件（提取、重新组装、写入输出）。**分段缓存仍然适用** —— 未更改的分段不会发送给 LLM。                                                                                    |
| `--force`                     | 清除每个已处理文件的文件跟踪，并且**不读取**API 翻译的分段缓存（完全重新翻译）。新的结果仍然会**写入**分段缓存。                                                                                 |
| `--stats`                     | 打印分段数量、已跟踪文件数量以及每个区域设置的分段总数，然后退出。                                                                                                                                                                                    |
| `--clear-cache [locale]`      | 删除缓存的翻译（以及文件跟踪）：所有区域设置，或单个区域设置，然后退出。                                                                                                                                                                             |
| `--prompt-format <mode>`      | 每个**批处理**的分段发送到模型并解析的方式（`xml`、`json-array` 或 `json-object`）。默认为 `json-array`。不会改变提取、占位符、验证、缓存或回退行为 —— 参见 [批处理提示格式](#batch-prompt-format)。 |

您不能将 `--force` 与 `--force-update` 结合使用（它们互斥）。

<a id="batch-prompt-format"></a>
#### 批处理提示格式

`translate-docs` 将可翻译的分段以**批处理**形式发送到 OpenRouter（按 `batchSize` / `maxBatchChars` 分组）。`--prompt-format` 标志仅更改该批处理的**线上传输格式**；`PlaceholderHandler` 令牌、Markdown AST 检查、SQLite 缓存键以及批处理解析失败时的每分段回退机制均保持不变。

| 模式                   | 用户消息                                                           | 模型回复                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | 伪 XML：每个片段一个 `<seg id="N">…</seg>`（含 XML 转义）。 | 仅 `<t id="N">…</t>` 块，每个片段索引对应一个。       |
| `json-array` (默认) | 一个字符串的 JSON 数组，按顺序每个分段一个条目。               | 一个 **相同长度**的 JSON 数组（顺序相同）。           |
| `json-object`          | 一个以分段索引为键的 JSON 对象 `{"0":"…","1":"…",…}`。            | 一个具有**相同键**和翻译后值的 JSON 对象。 |

运行时的标题还会打印 `Batch prompt format: …`，以便您确认当前的活动模式。当 JSON 标签文件（`jsonSource`）和 SVG 文件批处理作为 `translate-docs`（或 `sync` 的文档阶段——`sync` 不公开此标志，默认为 `json-array`）的一部分运行时，它们使用相同的设置。

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### SQLite 中的分段去重和路径

> **注意：** 本节介绍用于调试 `cleanup` 行为或自定义工具的内部缓存键细节。大多数用户可以跳过此部分。

- 段行由 `(source_hash, locale)` 全局键控（hash = 规范化内容）。两个文件中的相同文本共享一行；`translations.filepath` 是元数据（最后写入者），而不是每个文件的第二个缓存条目。
- `file_tracking.filepath` 使用带命名空间的键：每个 `documentations` 块对应 `doc-block:{index}:{relPath}`（`relPath` 是相对于项目根目录的 POSIX 路径：按收集时的 Markdown 路径；**JSON 标签文件使用相对于当前工作目录的源文件路径**，例如 `docs-site/i18n/en/code.json`，以便清理操作可以解析实际文件），以及 `translate-svg` 下的 SVG 文件使用 `svg-files:{relPath}`。
- `translations.filepath` 存储 Markdown、JSON 和 SVG 段落的相对于当前工作目录的 POSIX 路径（SVG 使用与其他资源相同的路径格式；`svg-files:…` 前缀仅**在 `file_tracking` 上**）。
- 运行后，`last_hit_at` 仅针对**同一翻译作用域内**（遵循 `--path` 和启用的类型）未被命中的段行被清除，因此过滤后的运行或仅文档运行不会将无关文件标记为过时。

<a id="output-layouts"></a>
### 输出布局

`markdownOutput.style` 控制翻译后的 Markdown 文件的写入位置。请在 `documentations[].markdownOutput.style` 中使用以下确切的字符串值（别名是预设布局，并非独立引擎）。

`markdownOutput.style = "nested"`（省略时的默认值）— 在 `{outputDir}/{locale}/` 下镜像源文件树（例如 `docs/guide.md` → `i18n/de/docs/guide.md`）。

`markdownOutput.style = "doc-system"` — 用于静态文档站点的带区域设置前缀的文档树。`docsRoot` 下的文件将被写入 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`。位于 `docsRoot` 外的路径将回退到嵌套布局。请将 `documentations[].markdownOutput.docsRoot` 设置为您的英文源码根目录（例如 `"docs"` 或 `"src/content/docs"`）。当 `markdownOutput.style = "doc-system"` 时，必须显式设置 `localeSubpath`（可使用下方别名以使用预设）。

**别名**（相同的布局引擎，预设 `localeSubpath`）：

- `markdownOutput.style = "docusaurus"` — `localeSubpath` 默认为 `docusaurus-plugin-content-docs/current`（Docusaurus i18n 插件布局）。
- `markdownOutput.style = "astro-starlight"` — `localeSubpath` 默认为 `""`（翻译后的页面直接放在 `{outputDir}/{locale}/` 下，当英文内容位于内容根目录且 `outputDir` 等于 `docsRoot` 时，与 [Starlight](https://starlight.astro.build/guides/i18n/) 一致）。

Docusaurus 预设（主要文档页面）：

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight 预设（相同的块结构，不同的路径）：

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

可选 JSON 标签——来自 `jsonSource` 的 Docusaurus 外壳字符串（非 MDX 正文内容）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight 为多种语言区域提供了 UI 字符串；可选的自定义 UI 覆盖在需要时使用 `src/content/i18n/en.json` 和 `jsonPathTemplate: "{outputDir}/{locale}.json"` 在单独的 `documentations[]` 块中。

`markdownOutput.style = "flat"` — 将翻译后的文件与源文件放在同一目录，并添加区域设置后缀，或放入子目录中。当启用 `markdownOutput.style = "flat"` 时（除非设置了 `rewriteRelativeLinks: false` 或自定义的 `pathTemplate`），页面之间的相对链接会自动重写。

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-markdownoutputstyle--flat"></a>
#### 当使用 `markdownOutput.style = "flat"` 时的锚点链接

当使用 `markdownOutput.style = "flat"` 时，输出会为每种语言重写页面之间的 **相对路径**（例如 `guide.md` → `guide.de.md`）。**锚点链接** —— 通常是在路径后跟一个 `#` 的 Markdown 内联形式 —— 用于跳转到目标文件中的某个章节：

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

此处链接目标为 `setup.md`，而 `#first-run` 是锚点：它应滚动至该文件中的正确标题处。

**为何需要特别注意锚点链接**

- `rewriteRelativeLinks` 会为每种语言环境修正**文件名**（`setup.md` → `setup.de.md`）。
- 许多渲染器根据**可见的标题文本**生成 `#` slug。翻译后，各语言环境的标题不同，因此自动生成的 slug 可能发生变化，而重写的链接仍可能显示为 `#first-run` —— 或者你的英文 `#…` 锚点不再与渲染器从翻译后标题生成的 slug 匹配。
- 结果：读者会进入正确的**文件**，但定位到了错误的**行**，或浏览器找不到匹配的标题。

**应对方法**

1. 在执行 `translate-docs` 之前，先在您的源 `.md` / `.mdx` 上运行 `ai-i18n-tools write-heading-ids`（使用与平常相同的 `documentations[]` / `contentPaths`）。该操作会在每个标题前插入显式的 HTML 锚点，使每个翻译副本共享相同的 `id` 值。在重命名标题后需重新运行此步骤，以刷新过时的锚点 ID 并与当前标题保持一致。
2. 将您的 Markdown **锚点链接** 指向这些稳定 ID，例如 `[label](../../docs/other.md#section-id)`，其中 `section-id` 需匹配工具写入的锚点 —— 而不仅仅是基于英文单词的猜测。

**示例**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

`write-heading-ids` 后的 `docs/security.md`（简化版）：

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

在 `translate-docs` 之后，每个语言环境文件中的文件路径和 `#…` 锚点保持一致，例如：

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration` 锚点在所有语言环境中都相同，因为 `id` 在源文件中是固定的；只有标题的**文本**和链接的**标签**被翻译。

<a id="images-and-raster-assets-in-translated-docs"></a>
#### 翻译文档中的图像和光栅资源

`translate-docs` 会翻译包括图片 alt 文本在内的 Markdown 片段。但它不会将光栅文件（PNG、JPEG、WebP、GIF）复制到您的文档 `outputDir` 中。您必须将截图文件放置在翻译后 URL 所指向的位置，或使用 `postProcessing.regexAdjustments` 在翻译后重写路径。

对于包含可翻译文本的 SVG 文件，请使用 `svg` 模块和 `translate-svg` — 详见 [`svg`](#svg)。

完整决策指南、所有模式的配置示例和目录结构、截图脚本契约、设计建议以及常见错误，请参阅[区域设置资源指南](LOCALE-ASSETS-GUIDE.zh-CN.md)。

**快速参考 — 五种模式**

| 模式                      | 用途                                               | 机制                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — 共享光栅图            | 单一图像，无每区域设置变体                  | `regexAdjustments` 全路径固定                  |
| B — 按区域设置的文件夹        | `"flat"`、`"docusaurus"`、`"astro-starlight"` 的 README/文档 | `regexAdjustments` 区域设置段替换            |
| C — Docusaurus 共置模式     | `markdownOutput.style = "docusaurus"` 站点 | 截图脚本放置文件；无需正则表达式          |
| D — 翻译后的 SVG           | Web 应用嵌入 SVG 插图                  | `translate-svg` 配合 `svg.style = "flat"`         |
| E — 共置的翻译 SVG | `markdownOutput.style = "docusaurus"` 文档          | `translate-svg` 配合 `svg.style = "nested"` + `pathTemplate` |

**扁平链接重写器与两步流程**

当启用 `markdownOutput.style = "flat"` 时，内置重写器会在 `postProcessing` 之前运行。它会为每个输出文件计算深度前缀——即从输出文件目录返回源文件目录的相对路径——并将该前缀添加到非 Markdown 资源的 URL 前面。随后 `postProcessing` 会对已添加前缀的 URL 进行处理——编写 `search` 模式时应匹配 URL 中的区域设置段，而不是开头的 `../` 前缀。

使用`flatPreserveRelativeDir: true`时，子目录中的源文件会自动获得特定文件前缀。例如，`docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md`生成前缀`../../docs/`，因此`translation-dashboard.png`（源的兄弟）变为`../../docs/translation-dashboard.png`——在没有任何`postProcessing`规则的情况下正确解析。

当 `markdownOutput.style` 设置为 `"docusaurus"`、`"astro-starlight"`、`"nested"` 或除 `"flat"` 以外的任何值时，扁平链接重写器不会运行。`postProcessing` 将看到原始的 Markdown URL。

**模式 A 示例** — 当使用 `markdownOutput.style = "flat"` 时，源文件旁的相对路径资源无需配置。仅当处理绝对 URL 资源（例如 `/img/...`）或 CDN 目标替换时才需要定义模式 A 的 `postProcessing` 规则。

**模式 B 示例 — `markdownOutput.style = "flat"` README**（`examples/nextjs-app`，第二个 `documentations[]` 块）

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

请使用通用的 `[^/]+` 形式，不要硬编码源区域设置，以便在 `sourceLocale` 将来更改时规则仍能正常工作。

**模式 B 示例 — `markdownOutput.style = "docusaurus"`**（`examples/nextjs-app`，第一个 `documentations[]` 块）

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**模式 C — Docusaurus 共置模式**（无需 `regexAdjustments`）

将 en-GB 截图放在 `static/assets/` 中，并创建一个符号链接 `docs/assets → ../static/assets`。`take-screenshots` 脚本会直接将其他区域设置的文件写入 `i18n/<locale>/…/current/assets/`。所有区域设置下的文档都引用 `../assets/name.png` —— 路径稳定，无需 URL 重写。

**模式 D 示例**（`examples/nextjs-app`，`svg.style = "flat"`）

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → 在 `public/assets/` 下生成按区域设置的文件。应用按区域设置引用：`<img src={`/assets/icon.${locale}.svg`} />`。

**最小的仅 README 示例** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` 仅通过[语言切换器后处理](#language-list-block)将 `README.md` 翻译为 `translated-docs/`。未定义任何图像规则——当 README 没有同级光栅文件或仅使用主机已提供服务的绝对 URL 时，此方式是合适的。

替换模板支持 `${translatedLocale}` 和 `${translatedBasedir}` 等占位符（完整列表见 [配置参考](#configuration-reference) 中的 `markdownOutput.postProcessing.regexAdjustments` 行）。

<a id="language-switcher-languagelistblock"></a>
#### 语言切换器 (`languageListBlock`)

在翻译的 markdown 文件中使用 `markdownOutput.postProcessing.languageListBlock`，当需要包含一个 **“以其他语言阅读”** 链接行时 — 每个区域一个链接，`href` 值相对于每个输出文件计算。

本仓库在 [README.md](../README.zh-CN.md) 和 [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md) 中使用了此功能。在使用 `translate-docs` 处理后，每个翻译副本都会获得更新后的语言切换块；例如 [translated-docs/docs/GETTING_STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) 会链接到 `translated-docs/docs/` 下的同级语言文件，并返回到 `../../docs/GETTING_STARTED.md` 中的英文源文件。

**1. 在源 Markdown 中标记该区块**

使用包含 `start` 和 `end` 子字符串标记的 HTML（或任意行）将切换器包裹起来。本仓库使用的是：

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

初始的链接文本仅为占位符。`translate-docs` 会替换从第一个包含 `start` 的行开始，到之后第一个包含 `end` 的行结束的整个片段（代码块内的标记将被忽略，因此同一文件中的配置示例不会匹配）。

**2. 配置该区块**

`start` 和 `end` 是任意的子字符串标记 —— 它们不必是 `<small id="lang-list">` / `</small>`。请选择仅在语言切换器片段中出现的任意起始和结束文本：例如另一个 HTML 标签（`<div class="lang-switcher">` … `</div>`）、HTML 注释（`<!-- lang-list -->` … `<!-- /lang-list -->`），或纯 Markdown 边界（例如从一行 `**Languages:**` 到另一行 `---`）。然后在配置中将 `start` 和 `end` 设置为与源文件中完全一致的内容。

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
| `start`     | 用于标识区块起始行的子字符串                                                  |
| `end`       | 结束行上的子字符串（当起始和结束标记在同一行时，可以与 `start` 相同）             |
| `separator` | 生成的 `[label](../../docs/href)` 链接之间的文本（本仓库使用 `" · "`）                                    |
| `label`     | 可选：`"local"`（默认）使用清单中各语言的本地名称；`"english"` 使用 `englishName` |

**3. 运行时发生了什么**

1. **提取** —— 语言列表片段 **不会**被发送给模型（`translatable: false`）。
2. **每个翻译文件** —— 在完成段落翻译和可选的扁平链接重写后，`postProcessing` 会重建该区块：为每个语言区域生成一个 Markdown 链接，标签优先来自 `ui-languages.json`（若不存在则使用捆绑的主目录，否则使用 `localeDisplayNames`），路径相对于当前正在写入的文件。
3. **源文件刷新** —— 在一次 `translate-docs` / `sync` 文档处理流程结束时，相同的规范区块会被写回 **英文源文件** 的 `contentPaths` 中，这样添加新语言时无需手动编辑每个链接即可自动更新仓库中的语言切换器。

如果某个文件没有匹配的区块，CLI 将记录警告（当 `--verbose` 时），并保持文件正文不变。

**4. 标签清单**

为了获取本地语言标签（`label: "local"`），请通过 `generate-ui-languages` 生成或维护 `ui-languages.json`（参见 [`uiLanguagesPath`](#uilanguagespath-optional)）。本仓库的文档专用配置没有 UI 流程，因此标签来自 `sourceLocale` + `targetLocales` 的捆绑主目录。

**5. 本仓库中的示例**

| 示例                            | 文件                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 本软件包（扁平文档 + 子目录） | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)（`markdownOutput.style = "flat"`）、[README.md](../README.zh-CN.md)、[docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md)，输出位于 [translated-docs/](../../docs/../translated-docs/) |
| 最简化的仅 README 模式                | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json) (`markdownOutput.style = "flat"`), [examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| 扁平 README + Docusaurus 文档      | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json)（第二段：`markdownOutput.style = "flat"`；第一段：`markdownOutput.style = "docusaurus"`）                                                     |

`<small id="lang-list">` 前面的一行（例如 `**Read in other languages:**`）是普通的可翻译段落，会在每个目标语言环境中本地化；只有标记之间的链接行会逐字重新生成，`href` 和清单驱动的标签除外。

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` 占位符

通过设置 `documentations[].markdownOutput.pathTemplate`（用于 Markdown 和 MDX）或 `jsonPathTemplate`（用于 JSON 标签文件）来覆盖翻译文件的写入位置。两者接受相同的占位符。解析后的路径必须保留在该块的 `outputDir` 内（CLI 会拒绝超出此范围的路径）。

如果使用了自定义的 `pathTemplate`，除非显式设置，否则 `rewriteRelativeLinks` 默认为 `false` —— 相对链接重写功能是为没有自定义模板的 `markdownOutput.style = "flat"` 构建的。

对于内置布局（`nested`、`flat`、`doc-system` 且无自定义模板），将 `markdownOutput.localePathLowercase` 设置为 `true` 可以使区域设置文件夹或文件名路径段为小写（例如 `pt-br` 而非 `pt-BR`）。`astro-starlight` 别名默认将其设为 `true`。自定义的 `pathTemplate` / `jsonPathTemplate` 值保持不变——当需要小写路径段但仍保留 `{locale}` 为 BCP-47 格式时，请在自定义路径中使用 `{llocale}`。

| 占位符            | 角色                                                                                                       | 示例                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | 当前文档块的 `outputDir` 的绝对解析路径                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | 目标语言环境代码（与配置/CLI 中的形式相同） | `de`, `pt-BR` |
| `{LOCALE}`             | 相同语言代码的大写形式                                                                                     | `DE`, `PT-BR`                                                    |
| `{llocale}`            | 相同区域设置的小写形式（匹配 Astro 路由文件夹，如 `pt-br`、`zh-cn`）                               | `de`、`pt-br`                                                    |
| `{relPath}` | 相对于项目根目录的源文件路径，使用 POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | 文件名 **无**扩展名 | `guide` 用于 `docs/guide.md` |
| `{basename}` | 文件名 **与** 扩展名 | `guide.md` |
| `{extension}` | 扩展名 **包含** 点 | `.md`, `.mdx` |
| `{docsRoot}` | `markdownOutput.docsRoot` 的绝对解析路径（如果省略则默认为 `docs`） | `/home/acme/repo/docs` |
| `{relativeToDocsRoot}` | 当路径字符串对齐时，移除带有匹配 `docsRoot` 前缀的 `{relPath}`（POSIX）；否则保持不变 | `docs/guide.md`（常见）；仅在执行移除操作时使用 `guide.md` |

**示例**

配置片段：

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

对于区域设置 `de` 和源文件 `docs/guide.md`，项目根目录为 `/home/acme/repo`，且 `outputDir` 解析为 `/home/acme/repo/i18n` 时，展开后的路径为：

```text
/home/acme/repo/i18n/de/docs/guide.md
```

当使用 `markdownOutput.style = "flat"` 且没有自定义 `pathTemplate` 时，一种常见模式是仅保留文件名，通过 `{stem}` 和 `{extension}` 实现，例如 `{outputDir}/{stem}.{locale}{extension}`，这会在解析后的 `outputDir` 下生成 `…/guide.de.md`。

<a id="troubleshooting"></a>
### 故障排除

**章节锚点链接在翻译后的文档中无法正常工作**

像 `[label](../../docs/other.md#section-id)` 这样的链接可能会打开正确的翻译文件，但无法滚动到目标标题，或跳转到错误的章节 —— `#…` 片段不再与该语言环境中的任何标题 `id` 匹配。

常见原因：

- 源标题从未设置显式锚点 ID；站点从可见标题文本生成 slug，翻译后文本发生变化导致不匹配。
- 您在源文件中重命名了标题，但前面的 `<a id="…"></a>` 行缺失或仍保留旧的 ID。
- 锚点链接使用了基于英文单词猜测的 `#…` 片段，而不是 `write-heading-ids` 生成的 ID。

**修复方法**

1. 在您的 **源文件** `.md` / `.mdx` 上运行 `ai-i18n-tools write-heading-ids`（与 `translate-docs` 使用相同的 `documentations[]` / `contentPaths`）。它会在每个 ATX 标题前插入 `<a id="slug"></a>`，或在标题文本与当前 slug 不匹配时刷新现有锚点。
2. 将锚点链接指向这些 ID —— 例如 `[setup](../../docs/guide.md#first-run)`，其中 `#first-run` 与目标标题上方的锚点行匹配，而不是仅根据英文标题推断的 slug。
3. 重新运行 `translate-docs`（或 `sync --force-update`），确保每个语言环境的副本都包含更新后的锚点行。

请先在 `write-heading-ids` 上使用 `--dry-run` 预览更改。完整模式请参见 [扁平布局中的锚点链接](#anchor-links-when-markdownoutputstyle--flat)。

---

<a id="combined-workflow-ui--docs"></a>
## 组合工作流（UI + 文档）

在单个配置中启用所有功能，以同时运行两个工作流：

<details>
<summary>UI 与文档配置组合示例</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
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
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "markdownOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` 将文档翻译指向与 UI 相同的 `strings.json` 目录，以保持术语一致；`glossary.userGlossary` 添加产品术语的 CSV 覆盖。

运行 `npx ai-i18n-tools sync` 以执行一个管道：当启用 `features.translateUIStrings` 时，先 **提取**，然后 **翻译 UI** 字符串；可选的 **翻译 SVG**（`features.translateSVG` + `svg` 块）；可选的 **translate-json**（`features.translateJson` + `json[]`）；然后按配置 **翻译文档**（`docs[]`）。可通过 `--no-ui`、`--no-svg`、`--no-json` 或 `--no-docs` 跳过部分步骤。文档步骤接受 `--dry-run`、`-p` / `--path`、`--force` 和 `--force-update`（最后两个仅在文档翻译运行时生效；如果传入 `--no-docs` 则会被忽略）。

在某个块上使用 `documentations[].targetLocales` 可将该块的文件翻译为比 UI 更**小的子集**（有效文档区域设置是各块之间的**并集**）：

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-markdownoutputstyle--docusaurus--flat"></a>
### 混合文档工作流（`markdownOutput.style = "docusaurus"` + `"flat"`）

您可以在同一配置中通过在 `documentations` 中添加多个条目来组合多个文档流水线。当项目包含 Docusaurus 站点（`markdownOutput.style = "docusaurus"`）以及根级 Markdown 文件（例如，带有 `markdownOutput.style = "flat"` 的仓库 README）且需使用带语言后缀的文件名进行翻译时，这是一种常见设置。

<details>
<summary>混合 Docusaurus 与扁平 README 配置示例</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with markdownOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
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

使用 `npx ai-i18n-tools sync` 时的执行方式：

- UI 字符串从 `src/` 提取并翻译到 `public/locales/` 中。
- 第一个文档块将 **Markdown** 从 `docs-site/docs/` 翻译到 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`（本地化文档页面）。
- 使用 `features.translateJSON` 和 `jsonSource`，该文档块还会将 **Docusaurus 外壳 JSON** 下的 `docs-site/i18n/en/` 翻译到每个目标语言文件夹中 —— 包括导航栏、页脚及主题/插件目录，但不包括 MDX 正文内容。
- 第二个文档块将 `README.md` 翻译为 `translated-docs/` 下的带语言后缀的文件（`markdownOutput.style = "flat"`）。
- 所有文档块共享 `cacheDir`，因此未更改的片段会在多次运行中重复使用，以减少 API 调用和成本。

---

<a id="translation-dashboard"></a>
## 翻译仪表板

运行：

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

这将启动一个本地 Web UI，支持您配置的 `cacheDir` SQLite 数据库——与 CLI 用于文档段、日志和相关元数据的同一文件夹。它包括标签 **文档**（缓存的文档段），**UI 字符串**，**UI 复数**，**术语表**，**失败**，**Markdown 问题**，和 **统计**。

![Translation Dashboard](../../docs/translation-dashboard.png)

如果您在此应用中 **编辑缓存行**（例如文档片段），请运行 `sync --force-update` 或使用 `--force-update` 参数执行等效的翻译命令，以确保磁盘上的输出与缓存一致；如果稍后仓库中的 **源文本** 发生更改，片段哈希值会变化，之前对旧文本的手动编辑将被覆盖。

<a id="failures-document-translation"></a>
### 失败（文档翻译）

**失败** 标签页仅用于 **文档** 翻译。它读取写入 SQLite 的失败记录，这些记录表示某个片段在特定语言环境中无法成功翻译的情况——例如模型输出为空或无效、翻译后验证错误（`AST mismatch`、占位符泄漏等 **质量** 检查问题），或导致流程中断的 **严重** 错误。它帮助您回答以下问题：*哪个源片段出错，针对的是哪种语言和模型，记录了什么错误信息？*

<a id="when-to-use-it"></a>
#### 何时使用

- 当 `translate-docs` 或 `sync` 因错误、部分区域设置或混乱的日志而结束时，您可以对失败项进行排序和筛选，而不必单独滚动终端输出。
- 当您需要 **优先处理返工**时：按 **# 失败次数** 排序，使在多次重试中反复失败的片段排在前面；这些片段很可能是需要在源 Markdown 中 **简化或重新格式化** 的候选内容，以确保后续运行成功。
- 当您需要获取 **确切的片段**——文件路径、行号提示、源哈希值和完整源文本——以便在您的代码仓库中编辑正确的段落时。

<a id="why-source-edits-matter"></a>
#### 为何源文本编辑很重要

密集的内联标记（**粗体** 与 `` `code` `` 混合、嵌套强调、包含多个跨度的长句）会使模型更难返回仍能通过结构检查的翻译。对于 **有多个记录失败** 的片段，通常通过 **重写或拆分** 源文本（或将示例移至代码块中）比在未更改的文本上重新运行翻译能获得更好的改善效果。这与 [复杂 Markdown 和质量检查失败](#complex-markdown-and-failed-quality-checks) 中的建议一致。

<a id="how-to-use-the-tab"></a>
#### 如何使用该标签页

1. 在仪表板中打开 **失败**（与 [翻译仪表板](#translation-dashboard) 使用相同的浏览器会话）。
2. 阅读 **摘要** 栏（包含任何失败的段落，以及具有 **1**、**2** 或 **3+** 条失败记录的段落计数）。
3. 按部分 **文件名**、**语言环境**、**模型**、**质量错误**（值来自缓存）、**仅致命错误**，以及可选的 **源哈希**、**源文本** 或 **错误消息** 子字符串进行筛选 —— 然后点击 **应用**。
4. 选择 **排序：失败次数**（默认）或 **排序：文件路径 + 行号**。
5. 在表格的顶部或底部使用分页。**点击某一行**以切换完整源文本。行中的链接控件（启用时）会要求服务器进程将文件/行提示记录到运行 `ai-i18n-tools dashboard` 的 **终端**中——便于从浏览器跳转到您的编辑器。
6. 在项目中修复 **源文件**，然后再次运行 `translate-docs` 或 `sync`。如果成功运行后列表看起来 **已过期**，请运行 `ai-i18n-tools sync --force-update` 并重新加载仪表板（失败面板会显示相同的提示）。

若要在使用 UI 的同时进行基于文件的调试，您仍可使用 `translate-docs --debug-failed` 在重试期间将 `FAILED-TRANSLATION` 的详细信息写入 `cacheDir`——参见 [Cache behaviour and `translate-docs` flags](#cache-behaviour-and-translate-docs-flags)。

<a id="markdown-issues-static-checks"></a>
### Markdown 问题（静态检查）

The **Markdown issues** tab lists rows from the `markdown_source_issues` SQLite table. Each row is a **pre-translation** finding: for example delimiter runs that never pair as emphasis/strikethrough under the same CommonMark-style rules `translate-docs` uses for masking, an inline code span opened with backticks but never closed, `STRONG_OUTSIDE_INLINE_CODE` when `**` / `__` wrap a `` `...` `` span (put emphasis inside the backticks or use plain code), or `STRONG_OUTSIDE_LINK` when `**` / `__` wrap a `[text](../../docs/url)` link (put bold inside the link text only). This is **not** the same as **Failures**, which records per-locale model output and post-translation validation problems (`AST mismatch`, placeholder leaks, and similar).

当您希望在消耗 token 之前先修复 **源 Markdown** 时使用此标签页——特别是在结构相关的质量检查持续失败时。可通过文件路径（与缓存键的部分匹配，包括 `doc-block:{index}:` 前缀）、**问题代码** 或 **源哈希** 进行筛选；可按文件路径+行号或最新扫描时间排序。链接按钮会将文件/行提示记录到运行 `ai-i18n-tools dashboard` 的终端中（理念与“文档”标签页相同）。

**刷新行：** 运行 `ai-i18n-tools check-markdown`（可选 `-p` / `--path` 范围，`--no-cache` 跳过 SQLite，`--json` 以机器可读格式在 stdout 上输出，stderr 上输出人类可读行）。默认情况下，每个 `translate-docs` markdown 文件运行时，当 `documentations[].warnMarkdownSourceIssues` 未设置为 `false` 时，也会重新扫描并替换该文件的行。清除缓存文件路径的所有翻译会在同一清理路径中删除该文件路径的 markdown 问题行，作为失败的一部分。

---

<a id="configuration-reference"></a>
## 配置参考

<a id="sourcelocale"></a>
### `sourceLocale`

源语言的 BCP-47 代码（例如 `"en-GB"`、`"en"`、`"pt-BR"`）。此区域设置不生成翻译文件——键字符串本身即为源文本。

**必须与** 从运行时 i18n 配置文件（`src/i18n.ts` / `src/i18n.js`）导出的 `SOURCE_LOCALE` 相匹配。

<a id="targetlocales"></a>
### `targetLocales`

要翻译到的 BCP-47 区域设置代码数组（例如 `["de", "fr", "es", "pt-BR"]`）。

`targetLocales` 是 UI 翻译的主要区域设置列表，也是文档块的默认区域设置列表。使用 `generate-ui-languages` 可从 `sourceLocale` + `targetLocales` 生成 `ui-languages.json` 清单。

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath`（可选）

用于显示名称、区域设置过滤和语言列表后处理的 `ui-languages.json` 清单路径。若省略，CLI 将在 `ui.flatOutputDir/ui-languages.json` 处查找该清单。

在以下情况下使用：

- 清单文件位于 `ui.flatOutputDir` 之外，您需要显式地通过 CLI 指向它。
- 您希望使用[语言切换器后处理](#language-list-block)（`languageListBlock`）从清单中生成区域设置标签。
- `extract` 应将来自清单的 `englishName` 条目合并到 `strings.json` 中（需要 `ui.reactExtractor.includeUiLanguageEnglishNames: true`）。

<a id="concurrency-optional"></a>
### `concurrency`（可选）

同时翻译的最大**目标区域设置**数量（`translate-ui`、`translate-docs`、`translate-svg` 以及 `sync` 中对应的步骤）。若省略，CLI 对 UI 翻译使用 **4**，对文档翻译使用 **3**（内置默认值）。可通过 `-j` / `--concurrency` 在每次运行时覆盖。

<a id="batchconcurrency-optional"></a>
### `batchConcurrency`（可选）

**translate-docs** 和 **translate-svg**（以及 `sync` 的文档步骤）：每个文件的最大并行 OpenRouter **批处理**请求数（每个批处理可包含多个片段）。若省略，默认为 **4**。`translate-ui` 忽略此设置。可通过 `-b` / `--batch-concurrency` 覆盖。在 `sync` 上，`-b` 仅适用于文档翻译步骤。

<a id="fileconcurrency-optional"></a>
### `fileConcurrency`（可选）

单个区域设置内并发处理的文件最大数量 **（在单个区域设置内）**，适用于 `translate-docs` 和 `sync`。当设置为大于 **1** 的值时，同一区域设置内的文件将通过信号量控制内存使用量进行并行处理。省略时默认为 **1**（顺序处理）。对于 I/O 密集型操作，较高的值可显著提高吞吐量，尤其是在所有片段均已缓存（无需 API 调用）的情况下。

**示例：**

```json
{
  "fileConcurrency": 4
}
```

**使用场景：** 当以 100% 缓存命中率运行 `sync --force-update` 时，将此值设为 `2-4` 可减少总处理时间。在处理大量小文件时，性能提升尤为明显。

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars`（可选）

文档翻译的片段批处理：每个 API 请求的片段数量及字符上限。默认值：**20** 个片段，**4096** 个字符（若省略）。

<a id="openrouter"></a>
### `openrouter`

- `baseUrl`
  OpenRouter API 基础 URL。默认值：`https://openrouter.ai/api/v1`。
- `translationModels`
  优先模型 ID 的有序列表。首先尝试第一个；出错时依次使用后续项作为备选。对于 `translate-ui`，还可设置 `ui.preferredModel` 以在该列表前尝试一个模型（参见 `ui`）。
- `defaultModel`
  旧版单一主模型。仅当 `translationModels` 未设置或为空时使用。
- `fallbackModel`
  旧版单一备选模型。当 `translationModels` 未设置或为空时，在 `defaultModel` 之后使用。
- `maxTokens`
  每次请求的最大完成 token 数。默认值：`8192`。
- `temperature`
  采样温度。默认值：`0.2`。
- `requestTimeoutMs`
  等待每次向 OpenRouter 发起 HTTP 请求（聊天补全和内部 `GET /models` 调用）的最大毫秒数。默认值：`30000`（30 秒）。

**为何使用多个模型：** 不同提供商和模型的成本各不相同，且在不同语言和区域中的质量水平也存在差异。将 `openrouter.translationModels` 配置为 **有序的备用链**（而非单一模型），以便在请求失败时，CLI 可尝试下一个模型。

请将以下列表视为可扩展的**基准**：如果某个特定区域的翻译效果较差或失败，请研究哪些模型能有效支持该语言或文字（参考在线资源或提供商文档），并将这些 OpenRouter ID 添加为额外选项。

此列表已在包含 36 个目标区域设置的大型文档项目中经过 **广泛区域覆盖测试**；可作为实用的默认选项，但不能保证在所有区域设置下均表现良好。

示例 `translationModels`（与 `npx ai-i18n-tools init` 默认值相同）：

<details>
<summary>默认 translationModels 回退列表</summary>

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

在您的环境变量或 `.env` 文件中设置 `OPENROUTER_API_KEY`。

在更改 `translationModels` 之前，请运行 `npx ai-i18n-tools check-models` 以根据 OpenRouter 的实时目录（`GET /models`）验证每个已配置的模型 ID。该命令会报告缺失或已过期（`expiration_date`）的 ID，列出有效模型及其输入/输出的预估价格（每 100 万 token 的美元价格），并在任何已配置的 ID 无效时以非零状态退出。需要 `OPENROUTER_API_KEY`。

<a id="features"></a>
### `features`

| 字段 | 工作流程 | 说明 |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | 将 `t("…")` / `i18n.t("…")` 提取到 `strings.json` 中，然后翻译条目并生成按语言环境划分的平面 JSON（提取会自动运行；使用独立的 `extract` 仅刷新目录）。 |
| `translateDocs`      | 2        | 翻译 `.md` / `.mdx` / `.astro` 页面；当设置 `docs[].docusaurusCatalogDir` 时，使用 Docusaurus 外壳 JSON。                                                         |
| `translateJson`      | 3        | 位于 `json[]` 下的任意嵌套 JSON（`translate-json`）。                                                                                                           |
| `translateSVG`       | —        | 翻译 `.svg` 文件（需要顶层的 `svg` 块）。                                                                                                       |

**翻译** SVG 文件时，需启用 `features.translateSVG` 并配置顶级 `svg` 块，并使用 `translate-svg`。当两者均设置时（除非使用 `--no-svg`），`sync` 命令将执行该步骤。

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  要扫描的目录或 glob 模式（相对于 cwd）以查找 `t("…")` 调用。支持像 `src/` 或 `["src/**/*.ts"]` 的模式。
- `stringsJson`  
  主目录文件的路径。由 `extract` 更新。
- `flatOutputDir`  
  每个语言 JSON 文件写入的目录（`de.json` 等）。
- `preferredModel`  
  可选。仅对 `translate-ui` 尝试的 OpenRouter 模型 ID；然后按顺序尝试 `openrouter.translationModels`（或遗留模型），而不重复此 ID。
- `uiExtractor.funcNames`（或遗留`reactExtractor.funcNames`）  
  要扫描的附加函数名称（默认：`["t", "i18n.t"]`）。
- `uiExtractor.extensions`（或遗留`reactExtractor.extensions`）  
  要包含的文件扩展名（默认：`[".js", ".jsx", ".ts", ".tsx"]`）。添加`.astro`以用于Astro前置和模板表达式。
- `uiExtractor.includePackageDescription`（或遗留`reactExtractor.includePackageDescription`）  
  当`true`（默认）时，`extract`还会在存在时包含`package.json` `description`作为UI字符串。
- `uiExtractor.packageJsonPath`（或遗留`reactExtractor.packageJsonPath`）  
  用于该可选描述提取的`package.json`文件的自定义路径。
- `uiExtractor.includeUiLanguageEnglishNames`（或遗留`reactExtractor.includeUiLanguageEnglishNames`）

当启用 `true`（默认 `false`）时，如果清单中 `uiLanguagesPath` 的 `englishName` 尚未通过源扫描获取（相同的哈希键），`extract` 也会将其添加到 `strings.json` 中。需要 `uiLanguagesPath` 指向一个有效的 `ui-languages.json`。

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite 缓存目录（所有 `documentations` 块共享）。可在多次运行之间复用。如果您正在从自定义文档翻译缓存迁移，请归档或删除旧缓存——`cacheDir` 会创建自己的 SQLite 数据库，且不兼容其他模式。

<a id="best-practice-for-git-exclusions"></a>
#### Git 排除的最佳实践：

- 排除翻译缓存文件夹的内容（例如，使用 `.gitignore` 或 `.git/info/exclude`），以防止提交临时缓存产物。
- 保留 `cache.db`（不要常规性删除），因为保留 SQLite 缓存可以避免重新翻译未更改的片段。在更新或修改使用 `ai-i18n-tools` 的软件时，这可以节省运行时间和 API 成本。
- 排除临时文件和日志文件，以避免提交备份和调试相关文件。

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

<a id="documentations"></a>
### `documentations`

文档处理流水线模块的数组。`translate-docs` 和 `sync` 的文档阶段 **按顺序处理每个** 模块。

**内容源**

- `description`
此块的可选人类可读注释（不用于翻译）。在设置时在`translate-docs` `🌐`标题中带前缀；也显示在`status`部分标题中。
- `contentPaths`
要翻译的Markdown/MDX页面主体和`.astro`模板（`translate-docs`扫描这些以查找`.md`、`.mdx`和`.astro`）。支持**目录路径或通配符模式**（例如`"docs/**/*.md"`、`"guides/*.mdx"`、`"src/pages/index.astro"`）。这就是本地化文档文本的来源。
- `sourceFiles`
可选别名在加载时合并到`contentPaths`中。
- `targetLocales`
仅适用于此块的可选语言环境子集（否则为根`targetLocales`）。有效的文档语言环境是跨块的并集。
- `jsonSource`
可选。此区块的 Docusaurus JSON 标签目录的源目录（例如来自 `docusaurus write-translations` 的 `"i18n/en"`）。页面正文始终来自 `contentPaths`；`jsonSource` 仅提供外壳/UI 的 JSON，不包含 MDX。

**输出布局**

- `outputDir`
此区块翻译输出的根目录。
- `markdownOutput.style`
`"nested"`（默认）、`"flat"`、`"doc-system"` 或别名 `"docusaurus"` / `"astro-starlight"`。
- `markdownOutput.localeSubpath`
当使用 `style: "doc-system"` 时，`{locale}/` 与 `{relativeToDocsRoot}` 之间的路径段（直接使用 `style: "doc-system"` 时必需；使用别名时已预设）。使用 `""` 实现 Starlight 风格的区域设置文件夹。
- `markdownOutput.docsRoot`
Docusaurus 布局的源文档根目录（例如 `"docs"`）。
- `markdownOutput.pathTemplate`
自定义 Markdown 输出路径。占位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。
- `markdownOutput.jsonPathTemplate`
标签文件的自定义 JSON 输出路径。支持与 `pathTemplate` 相同的占位符。
- `markdownOutput.localePathLowercase`
当设置为 `true` 时，内置输出布局（`nested`、`flat`、`doc-system` 且无 `pathTemplate`）在路径中使用小写的区域设置路径段。默认为 `false`；在配置加载时，`astro-starlight` 和 `doc-system` 若 `localeSubpath` 为空，则默认为 `true`。
- `markdownOutput.flatPreserveRelativeDir`
当设置为 `markdownOutput.style = "flat"` 时，保留源子目录，以避免同名文件发生冲突。
- `markdownOutput.rewriteRelativeLinks`
翻译后重写相对链接（当启用 `markdownOutput.style = "flat"` 且无自定义 `pathTemplate` 时自动启用）。
- `markdownOutput.linkRewriteDocsRoot`
计算扁平化链接重写前缀时使用的仓库根目录。通常保留为 `"."`，除非你的翻译文档位于不同的项目根目录下。

**后处理**

- `markdownOutput.postProcessing`
对翻译后的 **markdown 正文** 进行可选的转换（YAML 键和非段落式的 front matter 值保持不变）。在段落重新组装和扁平链接重写之后、`addFrontmatter` 之前执行。
- `markdownOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` 的有序列表。`search` 是正则表达式模式（纯字符串使用标志 `g` 或 `/pattern/flags`）。`replace` 支持诸如 `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}` 等占位符。
- `markdownOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` —— 在源和翻译的 markdown 中重新生成一个有范围限制的“以其他语言阅读”链接行。有关设置、行为和仓库示例，请参见 [语言切换器 (`languageListBlock`)](#language-list-block)。

**行为和元数据**

- `translateFrontmatterFields`
与 `markdownOutput` 相同层级（按 `documentations[]` 块）。默认 `true`：翻译 Starlight/Docusaurus 的面向用户的 YAML 段落（`title`、`description`、`sidebar.label`、`sidebar_label`、`keywords`、`hero.title`、`hero.tagline`、`hero.image.alt`、`hero.actions[].text`、`pagination_label`、`prev`/`next` 标签）。设置 `false` 以保持整个 front matter 块不变；传入字符串数组可限制为特定的点路径。
- `segmentSplitting`
与 `markdownOutput` 相同层级（按 `documentations[]` 块）。用于 `translate-docs` 提取的可选细粒度分段：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`。当 `enabled` 为 `true` 时（`segmentSplitting` 被省略时的默认值），密集段落、GFM 管道表格（第一块包含表头、分隔符和第一行数据）以及长列表将被拆分；子部分以单个换行符重新连接（`tightJoinPrevious`）。设置 `"enabled": false` 以仅对每个由空行分隔的正文块使用一个段落。
- `warnMarkdownSourceIssues`
当 `true` 时（省略时的默认值），每次 `translate-docs` 运行都会重新扫描 markdown 段落中是否存在危险分隔符或未闭合的行内代码，打印终端警告，并为该文件的缓存文件路径替换 `markdown_source_issues` 行。设置 `false` 以跳过此块的警告和 SQLite 更新。
- `addFrontmatter`
当 `true` 时（省略时的默认值），翻译后的 markdown 文件将包含以下 YAML 键：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`，以及当至少有一个段落具有模型元数据时，包含 `translation_models`（使用的 OpenRouter 模型 ID 的排序列表）。设置为 `false` 以跳过。

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
可选。额外的 JSX/HTML 属性名称，其 **带引号的字符串值** 不得发送给翻译器。将与内置默认值（`class`、`id`、`style`、`src`、`href`、`type`、`data-*`、大多数 `aria-*` 等）合并。不区分大小写。适用于：

- `.astro` 解析并替换提取（静态 HTML 标签和 `attr=` 内部 `{expression}` 块中的字符串字面量）。
  - 在 Markdown/Astro 片段翻译期间进行 MDX 占位符提取（在大写的 JSX 标签上使用 `label`、`tooltip` 和 `aria-label`，以及在适用时使用 `TabItem` `value`）。

示例：`"protectAttributes": ["variant", "size"]` 保持 `variant="primary"` 在 `{items.map(...)}` 中跨语言环境不变。

您也可以列出通常可翻译的属性（例如 `"title"` 或 `"aria-label"`），当您希望这些值从英文中逐字复制时。

- `protectKeys`
可选。额外的 **对象属性名称**，其带引号的字符串值在模板 `{expression}` 块和 MDX 对象字面量中不得翻译（例如 `label:` 在 `<Tabs values={[ … ]}>` 内部）。将与内置默认值（`class`、`key`、`id`、`href`、`src` 等）合并。不区分大小写。

示例：`"protectKeys": ["slug", "code"]` 跳过 `{ slug: 'getting-started', title: 'Getting started' }` → 当 `slug` 受保护时，仅 `title` 被翻译。

<br/>

**示例（`markdownOutput.style = "flat"` —— 截图路径 + 可选语言列表包装器）：**

<details>
<summary>扁平布局 postProcessing 示例（截图 + languageListBlock）</summary>

```json
"markdownOutput": {
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

<a id="svg"></a>
### `svg`

SVG 文件的顶层路径和布局。仅当 `features.translateSVG` 为 true 时（通过 `translate-svg` 或 `sync` 的 SVG 阶段）才会执行翻译。

| 字段            | 说明                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | 一个或多个目录 **或 glob 模式**（例如 `"images/*.svg"`、`"**/icons/*.svg"`）。这些模式相对于项目根目录解析，并递归扫描 `.svg` 文件。                                                                         |
| `outputDir`                   | 翻译后 SVG 输出的根目录。                                                                                                                                                                                                                                          |
| `style`                       | 当未设置 `pathTemplate` 时，默认为 `"flat"` 或 `"nested"`。                                                                                                                                                                                                                               |
| `pathTemplate`   | 自定义 SVG 输出路径。占位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{relativeToSourceRoot}"</code>。 |
| `localePathLowercase` | 当设置为 `true` 时，内置的 `flat` / `nested` SVG 布局在路径中使用小写的区域设置路径段。自定义的 `pathTemplate` 值保持不变；如需小写路径段，请使用 `{llocale}`。 |
| `forceLowercase` | SVG 重组时的文本小写转换。适用于依赖全小写标签的设计。                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| 字段          | 说明                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 指向 `strings.json` 的路径 —— 从现有翻译中自动构建术语表。                                                                                                 |
| `userGlossary` | 指向一个 CSV 文件的路径，该文件包含列 `Original language string`（或 `en`）、`locale`、`Translation` —— 每行对应一个源术语和目标语言环境（`locale` 可以是 `*`，表示适用于所有目标）。 |

**生成一个空术语表 CSV：**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI 参考

| 命令                                                                                                    | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                                  | 打印 CLI 版本和构建时间戳（与根程序上的 `-V` / `--version` 相同的信息）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website] [-o path] [--with-translate-ignore]` | 编写一个初始配置文件（包含 `concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 和 `documentations[].addFrontmatter`）。`--with-translate-ignore` 会创建一个初始的 `.translate-ignore`。
| `check-models`                                                                           | 根据 `GET /models` 验证每个配置的 OpenRouter 模型 ID（目录成员资格、`expiration_date`、每百万 token 的提示/补全费用（USD））。需要 `OPENROUTER_API_KEY`。当任何配置的 ID 缺失或已过期时，以非零值退出。对目录请求遵循 `openrouter.requestTimeoutMs` 设置。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `extract`                                                                                                  | 更新 `strings.json` 中来自 `t("…")` / `i18n.t("…")` 字面量的内容，可选的 `package.json` 描述和可选的清单 `englishName` 条目（参见 `ui.reactExtractor`）。要求 `ui.sourceRoots` 非空。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `generate-ui-languages [--master <path>] [--dry-run]`                                    | 使用 `sourceLocale` + `targetLocales` 和捆绑的 `data/ui-languages-complete.json`（或指定时使用 `--master`），将 `ui-languages.json` 写入 `ui.flatOutputDir`（或设置时写入 `uiLanguagesPath`）。对于主文件中缺失的语言区域，会发出警告并生成 `TODO` 占位符。如果您现有的清单文件中包含自定义的 `label` 或 `englishName` 值，它们将被主目录中的默认值替换——请在生成文件后仔细检查并进行调整。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                       | 为每个 `documentations` 块（`contentPaths`，可选 `jsonSource`）翻译 Markdown/MDX 和 JSON。`-j`：最大并行语言区域数；`-b`：每个文件最大并行批处理 API 调用数。`--prompt-format`：批处理传输格式（`xml` \| `json-array` \| `json-object`）。参见 [缓存行为和 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags) 和 [批处理提示格式](#batch-prompt-format)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …` | 需要至少一个 `documentations[]` 块。在每个块的 `contentPaths` 下收集 `.md` / `.mdx`（遵循 `.translate-ignore`）。在每个扁平 ATX `#` 标题（跳过围栏代码块内的标题）紧邻 **之前** 插入 HTML 锚点行 `<a id="slug"></a>`；如果锚点行已存在，则在 `id` 与当前标题文本生成的 slug 不匹配时对其进行更新。`-p` / `--path` 或 `-f` / `--file`：限制为相对于项目的文件或目录。`--slug-style`：`github`（默认；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`。配合 `pymdown` 使用时，可选 `--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--dry-run`：仅列出更改。 |
| `strip-md-bold-inline …`                                                                 | 至少需要一个 `documentations[]` 块。会剥离每个块的 `contentPaths` 下 `.md` / `.mdx` 中内联代码周围的 `**`（遵循 `.translate-ignore`）。`-p` / `--path` 或 `-f` / `--file`、`--dry-run`、`--no-backup`（在覆盖前跳过带时间戳的 `.backup.*`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `check-markdown …`                                                                       | 扫描每个 `documentations[]` 块的 `contentPaths` 下的 Markdown/MDX（发现机制与 `translate-docs` 相同，遵循 `.translate-ignore`）：分隔符配对、未闭合的内联代码，以及当 `**`/`__` 包裹 `` `...` `` 范围或 `[text](../../docs/url)` 链接时的 `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK`。`-p` / `--path` 或 `-f` / `--file`：可选作用域。将 `relativePath:line: [ISSUE_CODE] message` 行输出到 **stderr**；若发现任何问题则退出码为 **1**。`--json`：在 **stdout** 上输出 JSON 报告。除非指定 `--no-cache`，否则将 `markdown_source_issues` 写入 `cacheDir`。`-v` 会向 stderr 输出行添加源哈希。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                        | 转换在 `config.svg` 中配置的 SVG 文件（与文档分离）。需要 `features.translateSVG`。采用与文档相同的缓存机制；支持 `--no-cache` 以跳过本次运行的 SQLite 读写操作。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                               | 仅翻译用户界面字符串（`strings.json` → 区域设置 JSON）。`--locale` / `ui-languages.json`：以逗号分隔的目标区域设置（默认来自配置 / `ui-languages.json`）。`--force`：按区域设置重新翻译所有条目（忽略现有翻译）。`--dry-run`：不写入，不调用 API。`-j`：最大并行区域设置数。需要 `features.translateUIStrings`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                      | 提取，然后翻译 UI 字符串（需要 `features.translateUIStrings`）。仅限 UI — 不包含文档或 SVG。与 `translate-ui` 具有相同的 `-l`、`--force`、`--dry-run` 和 `-j` 选项。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                      | 运行 `extract` **first**（需要 `features.translateUIStrings`），使 `strings.json` 与源文件一致，然后由大语言模型（LLM）审阅 **source-locale** 的 UI 字符串（拼写、语法）。**术语提示** 仅来自 `glossary.userGlossary` CSV（范围与 `translate-ui` 相同，不包括 `strings.json` / `uiGlossary`，因此不会将错误的文本强化为术语表）。使用 OpenRouter（`OPENROUTER_API_KEY`）。仅作建议用途（运行完成时以退出码 **0** 结束）。将 `lint-source-results_<timestamp>.log` 写入 `cacheDir` 下，作为 **人类可读** 的报告（包含摘要、问题和每条字符串的 **OK** 行）；终端仅打印摘要统计和问题（不显示每条字符串的 `[ok]` 行）。最后一行输出日志文件名。`--json`：仅在标准输出打印完整的机器可读 JSON 报告（日志文件仍保持人类可读）。`--dry-run`：仍运行 `extract`，但仅打印批处理计划（不进行 API 调用）。`--chunk`：每次 API 批处理的字符串数量（默认 **50**）。`-j`：最大并行批处理数（默认 `concurrency`）。使用 `--json` 时，人工格式的输出将发送到 stderr。链接使用 `path:line`，类似于 `dashboard` UI 字符串中的“链接”按钮。 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`              | 将 `strings.json` 导出为 XLIFF 2.0 格式（每个目标语言区域生成一个 `.xliff`）。`-o` / `--output-dir`：输出目录（默认：与目录文件夹相同）。`--untranslated-only`：仅包含该语言区域中缺少翻译的单元。只读；无 API。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                 | 启用时执行提取，然后进行 UI 翻译，接着在设置 `translate-svg` 和 `features.translateSVG` 时执行 `config.svg`，最后进行文档翻译——除非通过 `--no-ui`、`--no-svg` 或 `--no-docs` 跳过。共享标志：`-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（仅限文档批处理）、`--force` / `--force-update`（仅限文档；文档运行时互斥）。文档阶段还会传递 `--emphasis-placeholders` 和 `--debug-failed`（含义与 `translate-docs` 相同）。`--prompt-format` 不是 `sync` 标志；文档步骤使用内置默认值（`json-array`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `status [--max-columns <n>]`                                                             | 当 `features.translateUIStrings` 启用时，打印每个语言区域的 UI 覆盖率（`Translated` / `Missing` / `Total`）。然后按文件 × 语言区域打印 Markdown 翻译状态（无 `--locale` 过滤；语言区域来自配置）。较长的语言区域列表会被拆分为多个表格，每个表格最多包含 `n` 列语言区域（默认 **9**），以确保终端中行宽较窄。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                         | 打印文档缓存和 `strings.json` 统计信息（与“翻译仪表板” → **统计**中的聚合数据相同）。`--max-columns`：每个模型的最大区域设置列数 × 区域设置表（默认与仪表板匹配）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                                    | 首先运行 `sync --force-update`（提取、UI、SVG、文档），然后移除过时的段行（`last_hit_at` 为 null 或文件路径为空）；删除其解析后的源路径在磁盘上不存在的 `file_tracking` 行；移除其 `filepath` 元数据指向缺失文件的翻译行。记录三个计数（过时、孤立的 `file_tracking`、孤立的翻译）。除非指定 `--no-backup`，否则在缓存目录下创建带时间戳的 SQLite 备份。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                               | **无需配置。** 遍历目录树（默认：当前工作目录）查找 `*.log` 和 `cache.db.backup*.sqlite`，打印 `./…` 路径，例如 `find -print`。发现匹配项时：除非指定 `-f` / `--force`（无需提示直接删除），否则会提示 `Delete these files? (y/n)`。无匹配项时：不提示直接退出。`--dry-run`：仅列出，不提示也不删除（优先级高于 `--force`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                      | 启动翻译仪表板（用于缓存片段、`strings.json`、术语表、失败项和统计信息的本地网页界面）。使用 `--no-open` 时，不会自动打开默认浏览器。已弃用的别名 `editor` 仍可使用，但会打印警告。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `glossary-generate [-o <path>]`                                                          | 写入一个空的 `glossary-user.csv` 模板。`-o`：覆盖输出路径（默认值：来自配置的 `glossary.userGlossary`，或 `glossary-user.csv`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                         | 显示子命令的帮助信息（输出与 `ai-i18n-tools <command> --help` 相同）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### 根命令和全局选项

| 选项                       | 范围         | 说明                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | 根程序  | 输出版本号和构建时间戳（与 `version` 子命令的信息相同）。 |
| `-h` / `--help`              | 根程序  | 显示根程序的帮助信息，或在指定命令名称时显示该子命令的帮助信息。      |
| `-c` / `--config <path>`     | 每个命令 | 配置文件路径（默认值：`ai-i18n-tools.config.json`）。                                  |
| `-v` / `--verbose`           | 每个命令 | 启用详细日志记录。                                                                          |
| `-w` / `--write-logs [path]` | 每个命令 | 将控制台输出同时写入 `.log` 文件（默认路径：位于根目录 `cacheDir` 下）。                |

### 每个命令的帮助

| 用法                            | 说明                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | 显示该命令的所有选项。      |
| `ai-i18n-tools help <command>`   | 输出结果与 `<command> --help` 相同。 |

### 目标区域设置（`-l` / `--locale`）

| 命令                                                                                | 行为                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — 以逗号分隔的目标 BCP-47 代码（例如 `de,fr,pt-BR`）。如果省略，则从配置文件和 `ui-languages.json` 中获取默认值。 |
| `lint-source`                                                                           | `-l` / `--locale <code>` — 用于审查的单一源区域设置（默认值：配置中的 `sourceLocale`）。                                                            |

---

<a id="environment-variables"></a>
## 环境变量

| 变量               | 说明                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **必填。** 您的 OpenRouter API 密钥。                     |
| `OPENROUTER_BASE_URL`   | 覆盖 API 基础 URL。                                 |
| `I18N_SOURCE_LOCALE`    | 在运行时覆盖 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`   | 用逗号分隔的区域设置代码，用于覆盖 `targetLocales`。  |
| `I18N_LOG_LEVEL`        | 日志记录器级别（`debug`、`info`、`warn`、`error`、`silent`）。 |
| `NO_COLOR`              | 当设置为 `1` 时，禁用日志输出中的 ANSI 颜色。              |
| `I18N_LOG_SESSION_MAX`  | 每个日志会话保留的最大行数（默认 `5000`）。           |
