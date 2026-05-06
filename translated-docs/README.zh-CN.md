<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm 版本](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm 下载量](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![许可证: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

用于国际化 JavaScript/TypeScript 应用程序和文档站点的 CLI 工具包。通过 OpenRouter 使用大语言模型提取 UI 字符串并进行翻译，并为 i18next 生成适用于各个地区的 JSON 文件。对于文档，它会翻译 `contentPaths` 下的 Markdown 和 MDX 文件（读者打开的本地化页面）。可选的 Docusaurus 标签 JSON 来自 `jsonSource`，用于覆盖站点外壳字符串（`write-translations` 目录，例如主题、导航栏、页脚），与页面正文内容区分开来。SVG 文件翻译使用 `features.translateSVG` 和顶层的 `svg` 块。

<small>**阅读其他语言版本：** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目录**

- [两种核心工作流](#two-core-workflows)
- [安装](#installation)
  - [使用 CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [快速开始](#quick-start)
  - [工作流 1 - UI 字符串](#workflow-1---ui-strings)
  - [工作流 2 - 文档](#workflow-2---documentation)
  - [两种工作流](#both-workflows)
- [运行时辅助工具](#runtime-helpers)
- [CLI 命令](#cli-commands)
- [文档](#documentation)
- [许可证](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## 两个核心工作流

**工作流 1 - UI 翻译**（React、Next.js、Node.js、任何 i18next 项目）

从 `t("…")` / `i18n.t("…")` **literals** 构建主目录（`strings.json`，可选的按区域设置的 `models` 元数据），可选地包含 `package.json` `description`，并在配置中启用时包含来自 `ui-languages.json` 的每个 `englishName`。通过 OpenRouter 翻译各区域设置中缺失的条目，并生成可用于 i18next 的扁平 JSON 文件（`de.json`、`pt-BR.json` 等）。

**工作流程 2 - 文档翻译**（Markdown / MDX，可选 Docusaurus 外壳 JSON）

翻译每个 `documentations` 块中 `contentPaths` 的 `.md` 和 `.mdx` —— 即本地化文档内容。当设置了 `features.translateJSON` 和 `jsonSource` 时，还会翻译 Docusaurus **标签 JSON**（来自 `write-translations` 的导航栏、页脚、主题/插件 UI），而非 MDX 正文文本。支持按块配置 Docusaurus 风格或扁平化带语言后缀的目录结构（`documentations[].markdownOutput`）。共享的根目录 `cacheDir` 存放 SQLite 缓存，因此只有新增或更改的片段才会发送给 LLM。**SVG：** 启用 `features.translateSVG`，添加顶层的 `svg` 块，然后使用 `translate-svg`（当两者都设置时，也可从 `sync` 运行）

两种工作流共享同一个 `ai-i18n-tools.config.json` 文件，可独立或结合使用。SVG 文件翻译使用 `features.translateSVG` 以及顶层的 `svg` 块，并通过 `translate-svg`（或 `sync` 中的 SVG 阶段）运行。

---

<a id="installation"></a>
## 安装

发布的包仅支持 **ESM**（`"type": "module"`）。需在 Node.js、打包工具或 `import()` 中使用 `import` —— `require('ai-i18n-tools')` **不被支持。** 该包声明了 `engines.node` 和 `>=22.16.0`；不支持较旧版本的 Node.js。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### 使用 CLI

**按项目安装（推荐）** — 作为依赖项或 devDependency 安装，然后通过 `npx`、`pnpm exec` 或 `package.json` 脚本调用：

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

在 Linux 和 macOS 上，包管理器会以正确的权限写入 `node_modules/.bin/ai-i18n-tools`；在 Windows 上则生成 `.cmd` / `.ps1` shim；脚本运行器会自动识别。

**终端中的裸命令** `ai-i18n-tools` **：** `package.json` 在 `PATH` 上运行脚本时已自动启用 `node_modules/.bin`，因此可以直接使用类似 `pnpm run i18n:sync` 的命令调用 CLI，而无需输入 `npx`。若要在交互式 shell 中直接运行 `ai-i18n-tools`（在本地安装后，从项目根目录执行），请将本地 bin 目录添加到 `PATH` 前面：

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

---

<a id="openrouter"></a>
## OpenRouter

调用 OpenRouter 的命令（`translate-ui`、`translate-docs`、`sync`、`check-models` 及相关脚本）需要在环境中设置 `OPENROUTER_API_KEY`。`check-markdown` 不使用 OpenRouter。

在 `ai-i18n-tools.config.json` 中，`openrouter` 对象包含模型列表、`baseUrl`、`maxTokens`、`temperature` 和 `requestTimeoutMs`：即对 OpenRouter 的每个 HTTP 请求（聊天补全和内部 `GET /models` 调用）等待的最长时间（毫秒）。默认值为 `30000`（30 秒）。

运行 `ai-i18n-tools check-models` 以验证每个配置的模型 ID 是否与 OpenRouter 的实时目录相符。它会报告缺失的 ID 或过期的 `expiration_date`，列出有效模型及其估计的输入/输出定价（每百万个令牌的美元），并在任何配置的 ID 无效时以非零状态退出。它需要 `OPENROUTER_API_KEY`。

---

<a id="quick-start"></a>
## 快速开始

<a id="workflow-1---ui-strings"></a>
### 工作流 1 - UI 字符串

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

在你的应用中使用来自 `'ai-i18n-tools/runtime'` 的辅助函数集成 i18next：

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

<a id="workflow-2---documentation"></a>
### 工作流 2 - 文档

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

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

| 辅助工具 | 说明 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | 用于键即默认值配置的标准 i18next 初始化选项。 |
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

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]   Create config file
ai-i18n-tools check-models                          Validate configured OpenRouter model ids against GET /models (pricing, expiration); requires OPENROUTER_API_KEY
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs …                      Translate documentation: markdown/MDX from contentPaths; optional Docusaurus label JSON from jsonSource. Flags include -l/--locale <codes>, -p/-f path, --dry-run,
                                                    --force, --force-update, --stats, --clear-cache, --type, --json-only, --no-json, -j, -b,
                                                    --prompt-format, --emphasis-placeholders, --no-emphasis-placeholders, --debug-failed
ai-i18n-tools write-heading-ids …                   Insert HTML anchor lines before ATX headings in .md/.mdx (documentations[])
ai-i18n-tools strip-md-bold-inline …              Remove bold (**) around inline code in markdown/MDX (documentations[])
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]   Scan documentation markdown for delimiter / inline-code issues and strong-outside-code or strong-outside-link patterns; refresh SQLite markdown_source_issues; exit 1 if any issue
ai-i18n-tools translate-svg …                        SVG files (features.translateSVG + config.svg); flags include -l/--locale <codes>,
                                                    -p/-f path, --dry-run, --force, --force-update, --no-cache, -j, -b
ai-i18n-tools translate-ui …                        Translate UI strings only; flags include -l/--locale <codes>, --dry-run, --force, -j
ai-i18n-tools lint-source …                         Run extract, then LLM review of source-locale UI strings (OpenRouter)
ai-i18n-tools export-ui-xliff …                   Export UI strings to XLIFF 2.0 (one file per locale); -l, -o, --untranslated-only, --dry-run
ai-i18n-tools sync …                                Extract, then UI / SVG / docs; flags include -l/--locale <codes>, -p/-f path, --dry-run, --force,
                                                    --force-update, --no-ui, --no-svg, --no-docs, -j, -b, --emphasis-placeholders,
                                                    --no-emphasis-placeholders, --debug-failed
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools statistics [--max-columns <n>]        Documentation cache + strings.json aggregates (same as editor Statistics)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]   List *.log and cache.db.backup*.sqlite; delete after `y`, with `-f`, or skip if none match
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

每个命令的完整标志列表位于 [CLI flags by command](docs/GETTING_STARTED.zh-CN.md#cli-flags-by-command) 中的 `src/cli/index.ts` 旁边。运行 `ai-i18n-tools <command> --help` 可查看内置的使用说明。

每个命令的全局选项：`-c <config>`（默认值：`ai-i18n-tools.config.json`）、`-v`（详细模式）、可选的 `-w` / `--write-logs [path]` 用于将控制台输出同时写入日志文件（默认存储在翻译缓存目录下）、`-V` / `--version`，以及 `-h` / `--help`。有关命令概览表，请参阅 [Getting Started](docs/GETTING_STARTED.zh-CN.md#cli-reference)。

---

<a id="documentation"></a>
## 文档

- [入门指南](docs/GETTING_STARTED.zh-CN.md) - 两种工作流的完整设置指南、CLI 参考和配置字段参考。
- [包概述](docs/PACKAGE_OVERVIEW.zh-CN.md) - 架构、内部结构、编程 API 和扩展点。
- [AI 代理上下文](../docs/ai-i18n-tools-context.md) - **对于使用该包的应用：** 下游项目的集成提示（复制到您的代理规则仓库中）。
- **此**仓库的维护者内部信息：`dev/package-context.md`（仅克隆；不在 npm 上）。

---

<a id="license"></a>
## 许可证

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
