# ai-i18n-tools

用于国际化 JavaScript/TypeScript 应用和文档站点的命令行工具及程序化工具包。通过 OpenRouter 使用大语言模型（LLM）提取 UI 字符串并进行翻译，并为 i18next 生成适用于各语言环境的 JSON 文件，同时支持 Markdown、Docusaurus JSON 的流水线，以及（通过 `features.translateSVG`、`translate-svg` 和 `svg` 块）独立 SVG 资源。

<small>**阅读其他语言版本：** </small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

## 两个核心工作流

**工作流 1 - UI 翻译**（适用于 React、Next.js、Node.js 或任何 i18next 项目）

从 `t("…")` / `i18n.t("…")` **字面量** 构建主目录（`strings.json`，可选每个区域设置的 **`models`** 元数据），可选择性包含 **`package.json` `description`**，并在配置启用时可选择性提取来自 `ui-languages.json` 的每个 **`englishName`**。通过 OpenRouter 按区域设置翻译缺失条目，并生成可用于 i18next 的扁平 JSON 文件（`de.json`、`pt-BR.json` 等）。

**工作流 2 - 文档翻译**（适用于 Markdown、Docusaurus JSON）

翻译 `.md` 和 `.mdx` 从每个 `documentations` 块的 `contentPaths` 和 JSON 标签文件，从该块的 `jsonSource` 启用时。支持 Docusaurus 风格和每个块的扁平区域后缀布局 (`documentations[].markdownOutput`)。共享根 `cacheDir` 保存 SQLite 缓存，因此仅将新或更改的段发送到 LLM。 **SVG:** 启用 `features.translateSVG`，添加顶级 `svg` 块，然后使用 `translate-svg`（当两者都设置时，也从 `sync` 运行）。

两个工作流共享单个 `ai-i18n-tools.config.json` 文件，可独立或联合使用。独立 SVG 翻译使用 `features.translateSVG` 加上顶层 `svg` 块，并通过 `translate-svg`（或 `sync` 内部的 SVG 阶段）运行。

---

## 安装

发布的包仅支持 **ESM**（`"type": "module"`）。可在 Node.js、打包工具或 `import()` 中使用 `import` —— `require('ai-i18n-tools')` **不受支持。**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

设置你的 OpenRouter API 密钥：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## 快速开始

### 工作流 1 - UI 字符串

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

在你的应用中使用来自 `'ai-i18n-tools/runtime'` 的辅助函数来接入 i18next：

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

### 工作流 2 - 文档

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### 两个工作流

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

## 运行时辅助函数

从 `'ai-i18n-tools/runtime'` 导出 —— 可在任何 JS 环境中使用，无需导入 i18next：

| 辅助函数 | 说明 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | 适用于“键即默认值”设置的标准 i18next 初始化选项。|
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 推荐的布线方式：来自 **`strings.json`** 的 key-trim + 复数 **`wrapT`**，可选择性合并 **`translate-ui`** `{sourceLocale}.json` 复数键。 |
| `wrapI18nWithKeyTrim(i18n)` | 仅低层级的 key-trim 包装器（不推荐用于应用布线；优先使用 **`setupKeyAsDefaultT`**）。 |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | 从 **`ui-languages.json`**（除 **`sourceLocale`** 外的每个 **`code`**）为 **`makeLoadLocale`** 构建 **`localeLoaders`** 映射。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 用于异步加载本地化文件的工厂。 |
| `getTextDirection(lng)` | 为 BCP-47 代码返回 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement` 上设置 `dir` 属性。 |
| `getUILanguageLabel(lang, t)` | 语言菜单行的显示标签（带 i18n）。 |
| `getUILanguageLabelNative(lang)` | 不调用 `t()` 的显示标签（标题样式）。 |
| `interpolateTemplate(str, vars)` | 在普通字符串上进行低层级的 `{{var}}` 替换（内部使用；应用代码应改用 `t()`）。 |
| `flipUiArrowsForRtl(text, isRtl)` | 为 RTL 布局将 `→` 翻转为 `←`。 |

---

## CLI 命令

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

每个命令的全局选项：`-c <config>`（默认值：`ai-i18n-tools.config.json`）、`-v`（详细模式）、可选的 `-w` / `--write-logs [path]` 用于将控制台输出同时输出到日志文件（默认值：位于翻译缓存目录下）、`-V` / `--version`，以及 `-h` / `--help`。有关每个命令的标志，请参阅 [入门指南](docs/GETTING_STARTED.zh-CN.md#cli-reference)。

---

## 文档

- [入门指南](docs/GETTING_STARTED.zh-CN.md) - 两种工作流的完整设置指南、CLI 参考和配置字段参考。
- [包概述](docs/PACKAGE_OVERVIEW.zh-CN.md) - 架构、内部机制、编程 API 和扩展点。
- [AI 代理上下文](../docs/ai-i18n-tools-context.md) - **对于使用该包的应用：** 下游项目的集成提示（复制到您的代码仓库的代理规则中）。
- 仓库 **本身** 的维护者内部信息：`dev/package-context.md` （仅克隆；不在 npm 上）。

---

## 许可证

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
