<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm 版本](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm 下载量](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![许可证: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

通过 [OpenRouter](https://openrouter.ai/) 使用大语言模型实现 JavaScript/TypeScript 应用和文档站点国际化的 CLI 与工具包。提供两个独立工作流：**UI 翻译** 提取 `t("…")` 调用并生成适用于 i18next 的语言环境就绪 JSON；**文档翻译** 则翻译 Markdown、MDX 和 SVG 文件，并采用智能 SQLite 缓存，仅将已更改的段落重新发送给 LLM。

<small>**阅读其他语言版本：** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<small>翻译后的 README 和文档已提交至 GitHub 上的 [`translated-docs/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)；npm 包仅包含英文 `docs/`。</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目录**

- [两种核心工作流](#two-core-workflows)
- [安装](#installation)
  - [使用 CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [快速开始](#quick-start)
  - [工作流 1 - UI 翻译](#workflow-1---ui-translation)
  - [工作流 2 - 文档翻译](#workflow-2---document-translation)
  - [两个工作流](#both-workflows)
- [运行时辅助工具](#runtime-helpers)
- [CLI 命令](#cli-commands)
- [文档](#documentation)
- [许可证](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## 两个核心工作流

**工作流 1 - UI 翻译** — 适用于使用 i18next 的任意 JS/TS 项目（React、Next.js、Node.js、CLI）

扫描源文件中的 `t("…")` / `i18n.t("…")` 字面量，构建主目录（`strings.json`），通过 OpenRouter 按语言环境翻译缺失条目，并生成可用于 i18next 的扁平 JSON 文件（`de.json`、`pt-BR.json` 等）。

**工作流 2 - 文档翻译** — 适用于 markdown/MDX 文档（Docusaurus、Astro Starlight、普通 README 文件）以及 `.astro` 页面 HTML（普通 Astro 营销网站）

将 `.md`、`.mdx` 和 `.astro` 源文件翻译成所有目标语言，并使用共享的 SQLite 缓存 —— 仅将新增或已更改的片段发送给 LLM。可选的 Docusaurus 外壳 JSON（`jsonSource`，来自 `write-translations`）涵盖导航栏、页脚和主题 UI 字符串。通过 `features.translateSVG` 和顶级 `svg` 块启用 SVG 文件翻译。对于普通 Astro 站点，请参阅 [`examples/astro-website`](../examples/astro-website/)（混合模式：`translate-docs` 用于页面 HTML，`t()` 用于 frontmatter 字符串）。

两个工作流共享单个 `ai-i18n-tools.config.json` 文件，可独立或联合使用。

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
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

**零安装一次性使用** — 使用 `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（仅在本次调用时下载）。

> **提示：** 若要在交互式 shell 中直接运行 `ai-i18n-tools` 而不使用 `npx`，请将 `node_modules/.bin` 添加到您的 `PATH` 中（bash/zsh：`export PATH="$PWD/node_modules/.bin:$PATH"`）。有关 direnv 和 Windows 的说明，请参阅 [入门指南](docs/GETTING_STARTED.zh-CN.md#installation)。

设置您的 OpenRouter API 密钥：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

调用 OpenRouter 的命令（`translate-ui`、`translate-docs`、`sync`、`check-models` 及相关脚本）需要在环境中设置 `OPENROUTER_API_KEY`。`check-markdown` 不使用 OpenRouter。

在 `ai-i18n-tools.config.json` 中，`openrouter` 对象包含模型列表、`baseUrl`、`maxTokens`、`temperature` 和 `requestTimeoutMs`：即对 OpenRouter 的每个 HTTP 请求（聊天补全和内部 `GET /models` 调用）等待的最长时间（毫秒）。默认值为 `30000`（30 秒）。

运行 `ai-i18n-tools check-models` 以验证每个配置的模型 ID 是否与 OpenRouter 的实时目录相符。它会报告缺失的 ID 或过期的 `expiration_date`，列出有效模型及其估计的输入/输出定价（每百万个令牌的美元），并在任何配置的 ID 无效时以非零状态退出。它需要 `OPENROUTER_API_KEY`。

---

<a id="quick-start"></a>
## 快速开始

<a id="workflow-1---ui-translation"></a>
### 工作流 1 - UI 翻译

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

然后在您的应用中使用来自 `'ai-i18n-tools/runtime'` 的辅助函数接入 i18next。完整配置请参阅入门指南中的 [第 4 步：运行时接入 i18next](docs/GETTING_STARTED.zh-CN.md#step-4-wire-i18next-at-runtime)。

<a id="workflow-2---document-translation"></a>
### 工作流 2 - 文档翻译

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website (UI + optional page HTML): npx ai-i18n-tools init -t ui-astro-website

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### 两种工作流

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
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
ai-i18n-tools help [command]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]
ai-i18n-tools check-models
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools lint-source …
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status [--max-columns <n>]
ai-i18n-tools statistics [--max-columns <n>]
ai-i18n-tools dashboard
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]
ai-i18n-tools glossary-generate
```

各命令的完整参数列表见 [入门指南 — CLI 参考](docs/GETTING_STARTED.zh-CN.md#cli-reference)。运行 `ai-i18n-tools <command> --help` 可查看内置使用说明。

每个命令的全局选项：`-c <config>`（默认值：`ai-i18n-tools.config.json`）、`-v`（详细模式）、可选的 `-w` / `--write-logs [path]` 用于将控制台输出同时写入日志文件（默认存储在翻译缓存目录下）、`-V` / `--version`，以及 `-h` / `--help`。有关命令概览表，请参阅 [Getting Started](docs/GETTING_STARTED.zh-CN.md#cli-reference)。

---

<a id="documentation"></a>
## 文档

- [入门指南](docs/GETTING_STARTED.zh-CN.md) - 两个工作流的完整设置指南、CLI 参考和配置项参考。
- [语言环境资源指南](docs/LOCALE-ASSETS-GUIDE.zh-CN.md) - 翻译文档中的截图和带图 SVG（模式 A–E、扁平链接重写器、截图脚本）。
- [包概览](docs/PACKAGE_OVERVIEW.zh-CN.md) - 架构、内部机制、编程 API 和扩展点。
- [AI 代理上下文](../docs/ai-i18n-tools-context.md) - **适用于使用该包的应用：** 下游项目集成提示（可复制到您仓库的代理规则中）。
- 本仓库 **this** 的维护者内部信息：`dev/package-context.md`（仅用于克隆；不在 npm 上发布）。

---

<a id="license"></a>
## 许可证

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
