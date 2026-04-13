---
translation_last_updated: '2026-04-13T00:28:22.023Z'
source_file_mtime: '2026-04-13T00:12:20.078Z'
source_file_hash: e18e8298ff645bc6b54dc44e33f5afcd538eef92699118fc92ccc8746d207cc3
translation_language: zh-CN
source_file_path: README.md
---
# ai-i18n-tools

用于国际化 JavaScript/TypeScript 应用程序和文档站点的 CLI 及编程工具包。提取 UI 字符串，通过 OpenRouter 使用 LLM 进行翻译，并为 i18next 生成支持多语言的 JSON 文件，同时提供针对 Markdown、Docusaurus JSON 以及（通过 `translate-svg`）独立 SVG 资源的处理流程。

<small>**以其他语言阅读：**</small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [hi](./README.hi.md) · [ja](./README.ja.md) · [ko](./README.ko.md) · [pt-BR](./README.pt-BR.md) · [zh-CN](./README.zh-CN.md) · [zh-TW](./README.zh-TW.md)</small>

## 两种核心工作流

**工作流 1 - UI 翻译** (React, Next.js, Node.js, 任何 i18next 项目)

扫描源文件中的 `t("…")` 调用，构建主目录（包含可选按语言区域划分的 **`models`** 元数据的 `strings.json`），通过 OpenRouter 为每个语言区域翻译缺失的条目，并生成可供 i18next 直接使用的扁平化 JSON 文件（`de.json`, `pt-BR.json`, …）。

**工作流 2 - 文档翻译** (Markdown, Docusaurus JSON)

翻译每个 `documentations` 块中 `contentPaths` 指定的 `.md` 和 `.mdx` 文件，并在启用时翻译该块中 `jsonSource` 指定的 JSON 标签文件。支持 Docusaurus 风格和按块划分的扁平化语言区域后缀布局（`documentations[].markdownOutput`）。共享的根目录 `cacheDir` 保存 SQLite 缓存，因此只有新增或更改的片段才会发送给 LLM。**SVG：** 使用 `translate-svg` 并配置顶层的 `svg` 块（当设置了 `svg` 时，也可通过 `sync` 运行）。

两种工作流共享一个 `ai-i18n-tools.config.json` 配置文件，可以独立使用或一起使用。独立的 SVG 翻译通过顶层的 `svg` 块配置，并通过 `translate-svg`（或 `sync` 内部的 SVG 阶段）运行。

---

## 安装

发布的包是 **仅支持 ESM** 的（`"type": "module"`）。在 Node.js、打包工具或 `import()` 中使用 `import` — **不支持 `require('ai-i18n-tools')`。**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

设置您的 OpenRouter API 密钥：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## 快速开始

### 工作流 1 - UI 字符串

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract t("…") calls from source
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

使用 `'ai-i18n-tools/runtime'` 中的辅助函数在您的应用中配置 i18next：

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);
export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

### 工作流 2 - 文档

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### 两种工作流

```bash
npx ai-i18n-tools sync   # extract UI strings, then translate UI strings, optional standalone SVG, then docs
```

---

## 运行时辅助函数

从 `'ai-i18n-tools/runtime'` 导出 - 适用于任何 JavaScript 环境，无需导入 i18next：

| 辅助函数 | 描述 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | 适用于以键作为默认值的标准 i18next 初始化选项。 |
| `wrapI18nWithKeyTrim(i18n)` | 包装 `i18n.t`，使其在查找前对键进行修剪。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 用于异步加载语言区域文件的工厂函数。 |
| `getTextDirection(lng)` | 根据 BCP-47 代码返回 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement` 上设置 `dir` 属性。 |
| `getUILanguageLabel(lang, t)` | 用于语言菜单行的显示标签（使用 i18n）。 |
| `getUILanguageLabelNative(lang)` | 不调用 `t()` 的显示标签（标题样式）。 |
| `interpolateTemplate(str, vars)` | 对纯字符串进行 `{{var}}` 替换的低级函数（内部使用；应用代码应使用 `t()`）。 |
| `flipUiArrowsForRtl(text, isRtl)` | 为 RTL 布局翻转 `→` 为 `←`。 |

---

## CLI 命令

```
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools extract                               Scan source for t("…") calls
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (requires config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools sync                                  Extract UI strings, then UI, optional SVG, then docs
ai-i18n-tools status                                Translation status per file × locale
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

所有命令都接受 `-c <config>`（默认值：`ai-i18n-tools.config.json`）、`-v`（详细模式）以及可选的 `-w` / `--write-logs [path]`，用于将控制台输出附加到日志文件（默认值：在翻译缓存目录下）。

---

## 文档

- [入门指南](GETTING_STARTED.zh-CN.md) - 包含两种工作流程的完整设置指南、所有 CLI 标志和配置字段参考。
- [包概述](PACKAGE_OVERVIEW.zh-CN.md) - 架构、内部结构、编程 API 和扩展点。
- [AI 代理上下文](../docs/ai-i18n-tools-context.md) - 为进行代码或配置更改的代理和维护者提供简明的项目上下文。

---

## 许可证

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
