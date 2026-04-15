# ai-i18n-tools: 入门

`ai-i18n-tools` 提供两个独立的、可组合的工作流程：

- **工作流程 1 - UI 翻译**：从任意 JS/TS 源码中提取 `t("…")` 调用，通过 OpenRouter 进行翻译，并生成适用于 i18next 的扁平化按语言环境划分的 JSON 文件。
- **工作流程 2 - 文档翻译**：将 Markdown（MDX）和 Docusaurus JSON 标签文件翻译为任意数量的语言环境，并支持智能缓存。**SVG** 资源使用 `features.translateSVG`、顶层 `svg` 块以及 `translate-svg` 命令（参见 [CLI 参考](#cli-reference)）。

两个工作流程都使用 OpenRouter（任何兼容的 LLM）并共享一个配置文件。

<small>**以其他语言阅读：**</small>

<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [German](./GETTING_STARTED.de.md) · [Spanish](./GETTING_STARTED.es.md) · [French](./GETTING_STARTED.fr.md) · [Hindi](./GETTING_STARTED.hi.md) · [Japanese](./GETTING_STARTED.ja.md) · [Korean](./GETTING_STARTED.ko.md) · [Portuguese (BR)](./GETTING_STARTED.pt-BR.md) · [Chinese (CN)](./GETTING_STARTED.zh-CN.md) · [Chinese (TW)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目录**

- [安装](#installation)
- [快速开始](#quick-start)
- [工作流 1 - UI 翻译](#workflow-1---ui-translation)
  - [步骤 1：初始化](#step-1-initialise)
  - [步骤 2：提取字符串](#step-2-extract-strings)
  - [步骤 3：翻译 UI 字符串](#step-3-translate-ui-strings)
  - [导出为 XLIFF 2.0（可选）](#exporting-to-xliff-20-optional)
  - [步骤 4：在运行时接入 i18next](#step-4-wire-i18next-at-runtime)
  - [在源代码中使用 `t()`](#using-t-in-source-code)
  - [插值](#interpolation)
  - [语言切换器 UI](#language-switcher-ui)
  - [RTL 语言](#rtl-languages)
- [工作流 2 - 文档翻译](#workflow-2---document-translation)
  - [步骤 1：初始化](#step-1-initialise-1)
  - [步骤 2：翻译文档](#step-2-translate-documents)
    - [缓存行为和 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags)
  - [输出布局](#output-layouts)
- [组合工作流（UI + 文档）](#combined-workflow-ui--docs)
- [配置参考](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath`（可选）](#uilanguagespath-optional)
  - [`concurrency`（可选）](#concurrency-optional)
  - [`batchConcurrency`（可选）](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars`（可选）](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg`（可选）](#svg-optional)
  - [`glossary`](#glossary)
- [CLI 参考](#cli-reference)
- [环境变量](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 安装

发布的包是 **仅限 ESM**。在 Node.js 或您的打包工具中使用 `import`/`import()`；**不要使用 `require('ai-i18n-tools')`。**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools 包含其自带的字符串提取器。如果您之前使用过 `i18next-scanner`、`babel-plugin-i18next-extract` 或类似工具，在迁移后可以移除这些开发依赖项。

设置您的 OpenRouter API 密钥：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

或者在项目根目录创建一个 `.env` 文件：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## 快速开始

默认的 `init` 模板（`ui-markdown`）仅启用 **UI** 提取和翻译。`ui-docusaurus` 模板启用 **文档** 翻译（`translate-docs`）。当您想要一个命令来运行提取、UI 翻译、可选的独立 SVG 翻译和根据您的配置进行文档翻译时，请使用 `sync`。

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

### 推荐的 `package.json` 脚本

在本地安装该包后，您可以直接在脚本中使用 CLI 命令（无需 `npx`）：

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-ui && ai-i18n-tools translate-svg && ai-i18n-tools translate-docs",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

## 工作流程 1 - UI 翻译

为任何使用 i18next 的 JS/TS 项目设计：React 应用、Next.js（客户端和服务器组件）、Node.js 服务、CLI 工具。

### 步骤 1：初始化

```bash
npx ai-i18n-tools init
```

这将使用 `ui-markdown` 模板写入 `ai-i18n-tools.config.json`。编辑它以设置：

- `sourceLocale` - 你的源语言 BCP-47 代码（例如 `"en-GB"`）。**必须匹配**从你的运行时 i18n 设置文件（`src/i18n.ts` / `src/i18n.js`）导出的 `SOURCE_LOCALE`。
- `targetLocales` - 你的目标语言的 BCP-47 代码数组（例如 `["de", "fr", "pt-BR"]`）。运行 `generate-ui-languages` 以根据此列表创建 `ui-languages.json` 清单。
- `ui.sourceRoots` - 扫描 `t("…")` 调用的目录（例如 `["src/"]`）。
- `ui.stringsJson` - 主目录文件的写入位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 写入 `de.json`、`pt-BR.json` 等文件的位置（例如 `"src/locales/"`）。
- `ui.preferredModel`（可选）- 仅用于 `translate-ui` 时**首先**尝试的 OpenRouter 模型 ID；失败时，CLI 将按顺序继续使用 `openrouter.translationModels`（或旧版 `defaultModel` / `fallbackModel`），跳过重复项。

### 步骤 2：提取字符串

```bash
npx ai-i18n-tools extract
```

扫描 `ui.sourceRoots` 下所有 JS/TS 文件中的 `t("literal")` 和 `i18n.t("literal")` 调用。写入（或合并到）`ui.stringsJson`。

扫描器是可配置的：可以通过 `ui.reactExtractor.funcNames` 添加自定义函数名称。

### 步骤 3：翻译 UI 字符串

```bash
npx ai-i18n-tools translate-ui
```

读取 `strings.json`，为每个目标语言环境将批次发送到 OpenRouter，将扁平 JSON 文件（`de.json`、`fr.json` 等）写入 `ui.flatOutputDir`。当设置了 `ui.preferredModel` 时，会先尝试该模型，然后再使用 `openrouter.translationModels` 中的有序列表（文档翻译和其他命令仍仅使用 `openrouter`）。

对于每个条目，`translate-ui` 在可选的 `models` 对象中存储成功翻译每种语言的 **OpenRouter 模型 ID**（与 `translated` 相同的语言键）。在本地 `editor` 命令中编辑的字符串在该语言的 `models` 中标记为哨兵值 `user-edited`。位于 `ui.flatOutputDir` 下的每种语言的平面文件仅保留 **源字符串 → 翻译**；它们不包括 `models`（因此运行时包保持不变）。

> **关于使用缓存编辑器的注意事项：** 如果你在缓存编辑器中编辑了一个条目，需要运行 `sync --force-update`（或等效的 `translate` 命令并加上 `--force-update`）来用更新后的缓存条目重写输出文件。另外，请注意，如果稍后源文本发生变化，你的手动编辑将会丢失，因为会为新的源字符串生成一个新的缓存键（哈希值）。

### 导出为 XLIFF 2.0（可选）

要将 UI 字符串交付给翻译供应商、TMS 或 CAT 工具，请将目录导出为 **XLIFF 2.0** 格式（每个目标语言区域一个文件）。此命令为 **只读**：不会修改 `strings.json` 或调用任何 API。

```bash
npx ai-i18n-tools export-ui-xliff
```

默认情况下，文件会写入 `ui.stringsJson` 旁边，命名为 `strings.de.xliff`、`strings.pt-BR.xliff`（目录的基本名称 + 语言区域 + `.xliff`）。使用 `-o` / `--output-dir` 可将文件写入其他位置。来自 `strings.json` 的现有翻译会出现在 `<target>` 中；缺失的语言区域会使用 `state="initial"` 且无 `<target>`，以便工具填充。使用 `--untranslated-only` 仅导出每个语言区域仍需翻译的单元（适用于供应商批量处理）。`--dry-run` 会打印路径但不写入文件。

### 步骤 4：在运行时连接 i18next

使用 `'ai-i18n-tools/runtime'` 导出的辅助函数创建你的 i18n 设置文件：

```js
// src/i18n.js  (or src/i18n.ts)
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

在 React 渲染之前导入 `i18n.js`（例如，在入口文件的顶部）。当用户更改语言时，调用 `await loadLocale(code)`，然后调用 `i18n.changeLanguage(code)`。

`SOURCE_LOCALE` 已被导出，因此任何其他需要它的文件（例如语言切换器）都可以直接从 `'./i18n'` 导入它。如果您正在迁移现有的 i18next 配置，请将任何硬编码的源语言字符串（例如在组件中分散的 `'en-GB'` 判断）替换为从您的 i18n 启动文件导入的 `SOURCE_LOCALE`。

`defaultI18nInitOptions(sourceLocale)` 返回用于键作为默认设置的标准选项：

- `parseMissingKeyHandler` 返回键本身，因此未翻译的字符串显示源文本。
- `nsSeparator: false` 允许键中包含冒号。
- `interpolation.escapeValue: false` - 可以安全禁用：React 会自行转义值，且 Node.js/CLI 输出没有需要转义的 HTML。

`wrapI18nWithKeyTrim(i18n)` 包装 `i18n.t` 以便： (1) 在查找之前修剪键，匹配提取脚本存储它们的方式； (2) 当源语言返回原始键时应用 <code>{"{{var}}"}</code> 插值 - 因此 <code>{"t('Hello {{name}}', { name })"}</code> 即使对于源语言也能正确工作。

`makeLoadLocale(i18n, loaders, sourceLocale)` 返回一个异步的 `loadLocale(lang)` 函数，该函数动态导入某种语言的 JSON 包并将其注册到 i18next。

### 在源代码中使用 `t()`

使用**字面量字符串**调用 `t()`，以便提取脚本能够找到它：

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

相同的模式在 React 外部（Node.js、服务器组件、CLI）也适用：

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**规则：**

- 仅提取这些形式： `t("…")`， `t('…')`， `t(`…`)`， `i18n.t("…")`。
- 键必须是一个 **字面字符串** - 不允许使用变量或表达式作为键。
- 不要为键使用模板字面量：<code>{'t(`Hello ${name}`)'}</code> 是不可提取的。

### 插值

使用 i18next 的原生第二个参数插值来处理 <code>{"{{var}}"}</code> 占位符：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

提取脚本忽略第二个参数 - 仅提取字面键字符串 <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code> 并发送进行翻译。翻译者被指示保留 <code>{"{{...}}"}</code> 令牌。

如果您的项目使用了自定义插值工具（例如调用 `t('key')` 然后将结果传入类似 `interpolateTemplate(t('Hello {{name}}'), { name })` 的模板函数），则 `wrapI18nWithKeyTrim` 使该工具变得不再必要——即使源语言返回原始键，它也会应用 <code>{"{{var}}"}</code> 插值。请将调用位置迁移到 `t('Hello {{name}}', { name })` 并移除自定义工具。

### 语言切换器 UI

使用 `ui-languages.json` 清单构建语言选择器。 `ai-i18n-tools` 导出两个显示助手：

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

`getUILanguageLabel(lang, t)` - 当翻译时显示 `t(englishName)`，或者当两者不同时显示 `englishName / t(englishName)`。适合设置屏幕。

`getUILanguageLabelNative(lang)` - 显示 `englishName / label`（每行不调用 `t()`）。适合希望原名可见的标题菜单。

`ui-languages.json` 清单是一个包含 <code>{"{ code, label, englishName, direction }"}</code> 条目的 JSON 数组（`direction` 为 `"ltr"` 或 `"rtl"`）。示例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

该清单由 `generate-ui-languages` 根据 `sourceLocale` + `targetLocales` 和打包的主目录生成，并写入 `ui.flatOutputDir`。

### RTL 语言

`ai-i18n-tools` 导出 `getTextDirection(lng)` 和 `applyDirection(lng)`：

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` 设置 `document.documentElement.dir`（浏览器）或在 Node.js 中为无操作。传递一个可选的 `element` 参数以针对特定元素。

对于可能包含 `→` 箭头的字符串，翻转它们以适应 RTL 布局：

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## 工作流 2 - 文档翻译

专为 Markdown 文档、Docusaurus 站点和 JSON 标签文件设计。当启用 `features.translateSVG` 并设置了顶层 `svg` 块时，独立的 SVG 资源将通过 [`translate-svg`](#cli-reference) 进行翻译——而不是通过 `documentations[].contentPaths`。

### 步骤 1：初始化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

编辑生成的 `ai-i18n-tools.config.json`：

- `sourceLocale` - 源语言（必须与 `defaultLocale` 在 `docusaurus.config.js` 中的值匹配）。
- `targetLocales` - BCP-47 区域代码数组（例如 `["de", "fr", "es"]`）。
- `cacheDir` - 所有文档流水线共享的 SQLite 缓存目录（也是 `--write-logs` 的默认日志目录）。
- `documentations` - 文档块数组。每个块包含可选的 `description`、`contentPaths`、`outputDir`、可选的 `jsonSource`、`markdownOutput`、`targetLocales`、`addFrontmatter` 等。
- `documentations[].description` - 给维护者的可选简短说明（说明此块涵盖的内容）。设置后，它会出现在 `translate-docs` 标题（`🌐 …: translating …`）和 `status` 的节标题中。
- `documentations[].contentPaths` - Markdown/MDX 源目录或文件（另见 `documentations[].jsonSource` 获取 JSON 标签）。
- `documentations[].outputDir` - 该块的翻译输出根目录。
- `documentations[].markdownOutput.style` - `"nested"`（默认）、`"docusaurus"` 或 `"flat"`（参见 [输出布局](#output-layouts)）。

### 步骤 2：翻译文档

```bash
npx ai-i18n-tools translate-docs
```

这将翻译每个 `documentations` 块的 `contentPaths` 中的所有文件到所有有效的文档语言（每个块的 `targetLocales` 的并集，当未设置时为根 `targetLocales`）。已翻译的段落从 SQLite 缓存中提供 - 只有新的或更改的段落会发送到 LLM。

要翻译单个语言环境：

```bash
npx ai-i18n-tools translate-docs --locale de
```

要检查需要翻译的内容：

```bash
npx ai-i18n-tools status
```

#### 缓存行为和 `translate-docs` 标志

CLI 在 SQLite 中保持 **文件跟踪**（每个文件 × 语言环境的源哈希）和 **段落** 行（可翻译块的哈希 × 语言环境）。正常运行时，当跟踪的哈希与当前源匹配 **且** 输出文件已存在时，会完全跳过该文件；否则，它会处理该文件并使用段落缓存，以便未更改的文本不会调用 API。

| 标志                     | 效果                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(默认)*              | 当跟踪记录与磁盘输出匹配时跳过未更改的文件；对其余文件使用片段缓存。                                                                                                             |
| `-l, --locale <codes>`   | 以逗号分隔的目标语言区域（省略时默认遵循 `documentation.targetLocales` / `targetLocales`）。                                                                                           |
| `-p, --path` / `-f, --file` | 仅翻译此路径下的 markdown/JSON（项目相对路径或绝对路径）；`--file` 是 `--path` 的别名。                                                                                     |
| `--dry-run`              | 不写入文件且不调用 API。                                                                                                                                                                       |
| `--type <kind>`          | 限制为 `markdown` 或 `json`（否则在配置中启用时两者都处理）。                                                                                                                              |
| `--json-only` / `--no-json` | 仅翻译 JSON 标签文件，或跳过 JSON 仅翻译 markdown。                                                                                                                         |
| `-j, --concurrency <n>`  | 最大并行目标语言区域数（默认来自配置或 CLI 内置默认值）。                                                                                                                             |
| `-b, --batch-concurrency <n>` | 每个文件最大并行批处理 API 调用数（文档；默认来自配置或 CLI）。                                                                                                                          |
| `--emphasis-placeholders` | 在翻译前将 markdown 强调标记掩码为占位符（可选；默认关闭）。                                                                                                         |
| `--debug-failed`         | 当验证失败时，在 `cacheDir` 下写入详细的 `FAILED-TRANSLATION` 日志。                                                                                                                       |
| `--force-update`         | 重新处理每个匹配的文件（提取、重组、写入输出），即使文件跟踪本应跳过。**片段缓存仍然适用** - 未更改的片段不会发送到 LLM。                   |
| `--force`                | 清除每个已处理文件的文件跟踪，并且**不读取**片段缓存进行 API 翻译（完全重新翻译）。新的结果仍将**写入**片段缓存。                 |
| `--stats`                | 打印片段数量、已跟踪文件数量以及每个语言区域的片段总数，然后退出。                                                                                                                   |
| `--clear-cache [locale]` | 删除缓存的翻译（和文件跟踪）：所有语言区域，或单个语言区域，然后退出。                                                                                                            |
| `--prompt-format <mode>` | 每个**批处理**片段发送到模型的方式及解析方式（`xml`、`json-array` 或 `json-object`）。默认 **`json-array`**。不改变提取、占位符、验证、缓存或回退行为 — 参见 [批处理提示格式](#batch-prompt-format)。 |

您不能将 `--force` 与 `--force-update` 结合使用（它们是互斥的）。

#### 批量提示格式

`translate-docs` 将可翻译的段发送到 OpenRouter 以 **批次**（按 `batchSize` / `maxBatchChars` 分组）。 **`--prompt-format`** 标志仅更改该批次的 **传输格式**；段拆分、`PlaceholderHandler` 令牌、markdown AST 检查、SQLite 缓存键和当批量解析失败时的每段回退保持不变。

| 模式 | 用户消息 | 模型回复 |
| ---- | ------------ | ----------- |
| **`xml`** | 伪XML：每个片段一个 `<seg id="N">…</seg>`（带XML转义）。 | 仅 `<t id="N">…</t>` 块，每个片段索引一个。 |
| **`json-array`** （默认） | 一个字符串的 JSON 数组，按顺序每个片段一个条目。 | 一个 **相同长度**（相同顺序）的 JSON 数组。 |
| **`json-object`** | 一个以片段索引为键的 JSON 对象 `{"0":"…","1":"…",…}`。 | 一个具有 **相同键** 且值已翻译的 JSON 对象。 |

运行头也会打印 `Batch prompt format: …`，以便您确认当前活动模式。JSON 标签文件（`jsonSource`）和独立 SVG 批处理在作为 `translate-docs` 的一部分运行时（或 `sync` 的文档阶段 —— `sync` 不暴露此标志；它默认为 **`json-array`**）使用相同的设置。

**SQLite 中的段落去重和路径**

- 片段行按 `(source_hash, locale)` 全局键控（hash = 归一化内容）。两个文件中的相同文本共享同一行；`translations.filepath` 是元数据（最后写入者），不是每个文件各自的第二个缓存条目。
- `file_tracking.filepath` 使用命名空间键：每个 `documentations` 块对应 `doc-block:{index}:{relPath}`（`relPath` 是相对于项目根目录的 posix 路径：按收集到的 markdown 路径；**JSON 标签文件使用相对于当前工作目录的源文件路径**，例如 `docs-site/i18n/en/code.json`，这样清理时就能解析出真实文件），以及 `translate-svg` 下独立 SVG 资源对应的 `svg-assets:{relPath}`。
- `translations.filepath` 为 markdown、JSON 和 SVG 片段存储相对于当前工作目录的 posix 路径（SVG 使用与其他资源相同的路径形状；`svg-assets:…` 前缀仅**用于** `file_tracking`）。
- 运行结束后，只有**在相同翻译范围内**（考虑 `--path` 和已启用类型）但未命中的片段行的 `last_hit_at` 会被清空，因此过滤运行或仅 docs 运行不会把无关文件标记为过期。

### 输出布局

`"nested"`（省略时的默认值）— 按源树镜像到 `{outputDir}/{locale}/` 下（例如 `docs/guide.md` → `i18n/de/docs/guide.md`）。

`"docusaurus"` — 将位于 `docsRoot` 下的文件放置到 `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`，与常见的 Docusaurus i18n 布局一致。将 `documentations[].markdownOutput.docsRoot` 设为你的文档源根目录（例如 `"docs"`）。

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - 将翻译后的文件放在源文件旁边，并加上语言区域后缀，或者放在子目录中。页面之间的相对链接会自动重写。

```
docs/guide.md → i18n/guide.de.md
```

您可以通过 `documentations[].markdownOutput.pathTemplate` 完全覆盖路径。占位符：<code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>。

---

## 组合工作流程 (UI + 文档)

在单个配置中启用所有功能，以同时运行两个工作流程：

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "extractUIStrings": true,
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

`glossary.uiGlossary` 将文档翻译指向与 UI 相同的 `strings.json` 目录，以保持术语一致；`glossary.userGlossary` 为产品术语添加 CSV 覆盖。

运行 `npx ai-i18n-tools sync` 可执行完整流水线：**提取** UI 字符串（如果启用了 `features.extractUIStrings`），**翻译 UI** 字符串（如果启用了 `features.translateUIStrings`），**翻译独立 SVG 资源**（如果设置了 `features.translateSVG` 和顶层 `svg` 块），然后 **翻译文档**（每个 `documentations` 块中配置的 Markdown/JSON 文件）。可通过 `--no-ui`、`--no-svg` 或 `--no-docs` 跳过相应步骤。文档步骤支持 `--dry-run`、`-p` / `--path`、`--force` 和 `--force-update` 参数（后两个参数仅在执行文档翻译时生效；若指定 `--no-docs` 则会被忽略）。

在块上使用 `documentations[].targetLocales` 将该块的文件翻译为比 UI 更**小的子集**（有效的文档语言是跨块的**并集**）：

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

---

## 配置参考

### `sourceLocale`

源语言的 BCP-47 代码（例如 `"en-GB"`、`"en"`、`"pt-BR"`）。此区域不会生成翻译文件 - 关键字符串本身就是源文本。

**必须匹配** 从您的运行时 i18n 设置文件（`src/i18n.ts` / `src/i18n.js`）导出的 `SOURCE_LOCALE`。

### `targetLocales`

要翻译成的 BCP-47 语言环境代码数组（例如 `["de", "fr", "es", "pt-BR"]`）。

`targetLocales` 是 UI 翻译的主要语言环境列表，也是文档块的默认语言环境列表。使用 `generate-ui-languages` 从 `sourceLocale` + `targetLocales` 构建 `ui-languages.json` 清单。

### `uiLanguagesPath`（可选）

指向用于显示名称、语言环境过滤和语言列表后处理的 `ui-languages.json` 清单的路径。如果省略，CLI 会在 `ui.flatOutputDir/ui-languages.json` 处查找该清单。

在以下情况下使用：

- 清单位于 `ui.flatOutputDir` 之外，您需要显式地将 CLI 指向它。
- 您希望 `markdownOutput.postProcessing.languageListBlock` 从清单构建语言环境标签。
- `extract` 应将清单中的 `englishName` 条目合并到 `strings.json` 中（需要 `ui.reactExtractor.includeUiLanguageEnglishNames: true`）。

### `concurrency`（可选）

同时翻译的最大**目标区域**（`translate-ui`、`translate-docs`、`translate-svg`，以及 `sync` 内部的匹配步骤）。如果省略，CLI 对于 UI 翻译使用**4**，对于文档翻译使用**3**（内置默认值）。通过 `-j` / `--concurrency` 在每次运行时覆盖。

### `batchConcurrency`（可选）

**translate-docs** 和 **translate-svg**（以及 `sync` 的文档翻译步骤）：每个文件的最大并行 OpenRouter **批量**请求数（每个批次可包含多个段落）。省略时默认值为 **4**。`translate-ui` 忽略此设置。使用 `-b` / `--batch-concurrency` 覆盖。在 `sync` 上，`-b` 仅适用于文档翻译步骤。

### `batchSize` / `maxBatchChars`（可选）

文档翻译的段落批处理：每个 API 请求包含多少段落，以及字符上限。默认值：**20** 个段落，**4096** 个字符（当省略时）。

### `openrouter`

| 字段               | 描述                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | OpenRouter API 基础 URL。默认值：`https://openrouter.ai/api/v1`。                        |
| `translationModels` | 首选的模型 ID 有序列表。先尝试第一个；后续条目在出错时作为回退。仅对于 `translate-ui`**，你还可以设置 `ui.preferredModel`，先尝试一个模型再使用此列表（参见 `ui`）。 |
| `defaultModel`      | 传统的单个主模型。仅在未设置 `translationModels` 或其为空时使用。       |
| `fallbackModel`     | 传统的单个回退模型。在未设置 `translationModels` 或其为空时，在 `defaultModel` 之后使用。 |
| `maxTokens`         | 每次请求的最大完成 token 数。默认值：`8192`。                                      |
| `temperature`       | 采样温度。默认值：`0.2`。                                                    |

**为何使用多个模型：** 不同的提供商和模型在成本上有所差异，并且在不同语言和区域设置下的质量水平也各不相同。将 **`openrouter.translationModels` 配置为有序的备用链**（而非单一模型），以便在请求失败时，CLI 可以尝试下一个模型。

请将以下列表视为可扩展的**基准**：如果某个特定区域设置的翻译效果较差或失败，请研究哪些模型能有效支持该语言或文字（参考在线资源或提供商的文档），并将这些 OpenRouter ID 添加为更多备选项。

此列表在 **2026 年 4 月** 经过了**广泛的区域覆盖测试**（例如，在 Transrewrt 项目中翻译了 **36** 个目标区域设置）；它可作为实用的默认配置，但无法保证在所有区域设置下均有良好表现。

示例 `translationModels`（与 `npx ai-i18n-tools init` 及包中的示例相同）：

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v3.2",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-5.3-codex",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-3-flash-preview"
]
```

在你的环境或 `.env` 文件中设置 `OPENROUTER_API_KEY`。

### `features`

| 字段                | 工作流程 | 描述                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | 扫描源文件中的 `t("…")` / `i18n.t("…")`，将可选的 `package.json` 描述和（如果启用）`ui-languages.json` `englishName` 值合并到 `strings.json` 中。 |
| `translateUIStrings` | 1        | 翻译 `strings.json` 条目并写入每个语言环境的 JSON 文件。 |
| `translateMarkdown`  | 2        | 翻译 `.md` / `.mdx` 文件。                                   |
| `translateJSON`      | 2        | 翻译 Docusaurus JSON 标签文件。                            |
| `translateSVG`       | 2        | 翻译独立的 `.svg` 资源（需要顶级 `svg` 块）。 |

当 `features.translateSVG` 为 true 且配置了顶层 `svg` 块时，使用 `translate-svg` 翻译 **独立的** SVG 资源。`sync` 命令在两个条件均满足时执行该步骤（除非指定 `--no-svg`）。

### `ui`

| 字段                       | 描述                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | 扫描 `t("…")` 调用的目录（相对于当前工作目录）。               |
| `stringsJson`               | 主目录文件的路径。由 `extract` 更新。                  |
| `flatOutputDir`             | 写入每个语言环境 JSON 文件的目录（如 `de.json` 等）。    |
| `preferredModel`            | 可选。优先尝试用于 `translate-ui` 的 OpenRouter 模型 ID；然后按顺序尝试 `openrouter.translationModels`（或旧模型），不重复此 ID。 |
| `reactExtractor.funcNames`  | 要扫描的额外函数名称（默认：`["t", "i18n.t"]`）。         |
| `reactExtractor.extensions` | 要包含的文件扩展名（默认：`[".js", ".jsx", ".ts", ".tsx"]`）。 |
| `reactExtractor.includePackageDescription` | 当为 `true`（默认）时，如果存在，`extract` 还会将 `package.json` `description` 作为 UI 字符串包含在内。 |
| `reactExtractor.packageJsonPath` | 用于可选描述提取的 `package.json` 文件的自定义路径。 |
| `reactExtractor.includeUiLanguageEnglishNames` | 当为 `true`（默认 `false`）时，如果源扫描尚未包含（相同哈希键），`extract` 还会将清单 `uiLanguagesPath` 中的每个 `englishName` 添加到 `strings.json` 中。需要 `uiLanguagesPath` 指向有效的 `ui-languages.json`。 |

### `cacheDir`

| 字段      | 描述                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite 缓存目录（由所有 `documentations` 块共享）。在多次运行中重复使用。如果您正在从自定义文档翻译缓存迁移，请归档或删除它 —— `cacheDir` 会创建自己的 SQLite 数据库，且与其他模式不兼容。 |

### `documentations`

文档管道块的数组。`translate-docs` 和 `sync` 过程的文档阶段 **逐个** 处理每个块。

| 字段                                         | 说明                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | 此区块的可选人工可读备注（不用于翻译）。设置后，会在 `translate-docs` 的 `🌐` 标题前加上前缀；也会显示在 `status` 部分的标题中。                                                     |
| `contentPaths`                               | 需要翻译的 Markdown/MDX 源文件（`translate-docs` 会扫描这些路径下的 `.md` / `.mdx` 文件）。JSON 标签来自此区块的 `jsonSource`。                                                                                  |
| `outputDir`                                  | 此区块翻译输出的根目录。                                                                                                                                                                      |
| `sourceFiles`                                | 可选别名，在加载时合并到 `contentPaths` 中。                                                                                                                                                                        |
| `targetLocales`                              | 仅针对此区块的可选语言子集（否则使用根级 `targetLocales`）。实际生效的文档语言是所有区块的并集。                                                                             |
| `jsonSource`                                 | 此区块的 Docusaurus JSON 标签文件的源目录（例如 `"i18n/en"`）。                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"`（默认）、`"docusaurus"` 或 `"flat"`。                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Docusaurus 布局的源文档根目录（例如 `"docs"`）。                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | 自定义 Markdown 输出路径。占位符： <code>{"{outputDir}"}</code>、<code>{"{locale}"}</code>、<code>{"{LOCALE}"}</code>、<code>{"{relPath}"}</code>、<code>{"{stem}"}</code>、<code>{"{basename}"}</code>、<code>{"{extension}"}</code>、<code>{"{docsRoot}"}</code>、<code>{"{relativeToDocsRoot}"}</code>。 |
| `markdownOutput.jsonPathTemplate`            | 自定义 JSON 输出路径用于标签文件。支持与 `pathTemplate` 相同的占位符。                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | 对于 `flat` 风格，保留源子目录以避免同名文件冲突。                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | 在翻译后重写相对链接（`flat` 风格下自动启用）。                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | 计算扁平化链接重写前缀时使用的仓库根目录。通常保留为 `"."`，除非你的翻译文档位于不同的项目根目录下。 |
| `markdownOutput.postProcessing` | 对翻译后的 Markdown **正文** 的可选转换（YAML front matter 会被保留）。在段落重新组装和扁平链接重写之后、`addFrontmatter` 之前执行。 |
| `markdownOutput.postProcessing.regexAdjustments` | 有序的 `{ "description"?, "search", "replace" }` 列表。`search` 是正则表达式模式（纯字符串默认使用 `g` 标志，或 `/pattern/flags`）。`replace` 支持占位符，如 `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}`（概念与参考中的 `additional-adjustments` 相同）。 |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — 翻译器会查找包含 `start` 的第一行和匹配的 `end` 行，然后将该部分替换为标准语言切换器。链接基于翻译文件的相对路径构建；标签来自配置的 `uiLanguagesPath` / `ui-languages.json`，若未配置则来自 `localeDisplayNames` 和语言代码。 |
| `addFrontmatter`                  | 当为 `true` 时（默认值，省略时即为 true），翻译后的 Markdown 文件将包含以下 YAML 键：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`，以及当至少一个段落包含模型元数据时，还包括 `translation_models`（使用的 OpenRouter 模型 ID 的排序列表）。设为 `false` 可跳过。 |

示例（平面 README 管道 — 截图路径 + 可选语言列表包装）：

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
      "separator": " · "
    }
  }
}
```

### `svg`（可选）

用于独立 SVG 资源的顶层路径和布局。仅当 **`features.translateSVG`** 为 true 时才会执行翻译（通过 `translate-svg` 或 `sync` 的 SVG 阶段）。

| 字段                       | 描述 |
| --------------------------- | ----------- |
| `sourcePath`                | 一个目录或一个递归扫描 `.svg` 文件的目录数组。 |
| `outputDir`                 | 翻译后的 SVG 输出的根目录。 |
| `style`                     | 当 `pathTemplate` 未设置时为 `"flat"` 或 `"nested"`。 |
| `pathTemplate`              | 自定义 SVG 输出路径。占位符：<code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | SVG 重新组装时的翻译文本小写。对于依赖全小写标签的设计非常有用。 |

### `glossary`

| 字段          | 说明                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | 指向 `strings.json` 的路径 — 自动从现有翻译中构建术语表。                                                                                                                 |
| `userGlossary` | 指向一个 CSV 文件的路径，该文件包含列 `Original language string`（或 `en`）、`locale`、`Translation` — 每个源术语和目标语言环境对应一行（`locale` 可为 `*` 表示所有目标）。 |

遗留键 `uiGlossaryFromStringsJson` 仍然被接受，并在加载配置时映射到 `uiGlossary`。

生成一个空的词汇表 CSV：

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLI 参考

| 命令                                                                   | 说明                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`                                                                 | 打印 CLI 版本和构建时间戳（与根程序上的 `-V` / `--version` 信息相同）。                                                                                                                                                                                                  |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | 写入一个初始配置文件（包含 `concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 和 `documentations[].addFrontmatter`）。`--with-translate-ignore` 会创建一个初始的 `.translate-ignore`。                                                                            |
| `extract`                                                                 | 从 `t("…")` / `i18n.t("…")` 字面量更新 `strings.json`，可选的 `package.json` 描述和可选的清单 `englishName` 条目（参见 `ui.reactExtractor`）。需要 `features.extractUIStrings`。                                                                                                                                                                                                    |
| `generate-ui-languages [--master <path>] [--dry-run]`                     | 使用 `sourceLocale` + `targetLocales` 和内置的 `data/ui-languages-complete.json`（或 `--master`）将 `ui-languages.json` 写入 `ui.flatOutputDir`（或设置时的 `uiLanguagesPath`）。对于主文件中缺失的语言环境会发出警告并生成 `TODO` 占位符。如果您现有的清单中包含自定义的 `label` 或 `englishName` 值，它们将被主目录中的默认值替换——生成文件后请检查并调整。 |
| `translate-docs …`                                                        | 为每个 `documentations` 块（`contentPaths`，可选 `jsonSource`）翻译 Markdown/MDX 和 JSON。`-j`：最大并行语言环境数；`-b`：每个文件最大并行批处理 API 调用数。`--prompt-format`：批处理传输格式（`xml` \| `json-array` \| `json-object`）。参见 [缓存行为和 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags) 和 [批处理提示格式](#batch-prompt-format)。 |
| `translate-svg …`                                                         | 翻译在 `config.svg` 中配置的独立 SVG 资源（与文档分离）。需要 `features.translateSVG`。与文档具有相同的缓存机制；支持 `--no-cache` 以跳过本次运行的 SQLite 读写操作。支持 `-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | 仅翻译 UI 字符串。`--force`：按语言环境重新翻译所有条目（忽略现有翻译）。`--dry-run`：不写入，不调用 API。`-j`：最大并行语言环境数。需要 `features.translateUIStrings`。                                                                                 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | 将 `strings.json` 导出为 XLIFF 2.0（每个目标语言环境一个 `.xliff`）。`-o` / `--output-dir`：输出目录（默认：与目录同文件夹）。`--untranslated-only`：仅包含该语言环境中缺少翻译的单元。只读；不调用 API。                                                        |
| `sync …`                                                                  | 启用时先提取，然后进行 UI 翻译，当 `features.translateSVG` 和 `config.svg` 设置时再执行 `translate-svg`，最后进行文档翻译——除非通过 `--no-ui`、`--no-svg` 或 `--no-docs` 跳过。共享标志：`-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（仅限文档批处理）、`--force` / `--force-update`（仅限文档；文档运行时互斥）。文档阶段还会传递 `--emphasis-placeholders` 和 `--debug-failed`（含义与 `translate-docs` 相同）。`--prompt-format` 不是 `sync` 标志；文档步骤使用内置默认值（`json-array`）。                         |
| `status [--max-columns <n>]`                                   | 当 `features.translateUIStrings` 开启时，打印每个语言环境的 UI 覆盖率（`Translated` / `Missing` / `Total`）。然后打印每个文件 × 语言环境的 Markdown 翻译状态（无 `--locale` 过滤；语言环境来自配置）。大型语言环境列表将被拆分为最多 `n` 列语言环境的重复表格（默认 **9**），以便终端中行宽保持较窄。                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | 首先运行 `sync --force-update`（提取、UI、SVG、文档），然后移除陈旧的段行（`last_hit_at` 为 null / 文件路径为空）；删除其解析后源路径在磁盘上不存在的 `file_tracking` 行；移除其 `filepath` 元数据指向缺失文件的翻译行。记录三个计数（陈旧、孤立的 `file_tracking`、孤立的翻译）。除非指定 `--no-backup`，否则在缓存目录下创建带时间戳的 SQLite 备份。 |
| `editor [-p <port>] [--no-open]`                                          | 启动本地 Web 编辑器以编辑缓存、`strings.json` 和术语表 CSV。`--no-open`：不自动打开默认浏览器。<br><br>**注意：** 如果您在缓存编辑器中编辑了条目，则必须运行 `sync --force-update` 以使用更新后的缓存条目重写输出文件。此外，如果源文本之后发生变化，手动编辑将丢失，因为会生成新的缓存键。 |
| `glossary-generate [-o <path>]`                                           | 写入一个空的 `glossary-user.csv` 模板。`-o`：覆盖输出路径（默认：来自配置的 `glossary.userGlossary`，或 `glossary-user.csv`）。                                                                                                                                                |

所有命令都接受 `-c <path>` 以指定非默认的配置文件，接受 `-v` 以启用详细输出，并接受 `-w` / `--write-logs [path]` 将控制台输出复制到日志文件（默认路径：位于根目录 `cacheDir` 下）。根程序还支持 `-V` / `--version` 和 `-h` / `--help`；`ai-i18n-tools help [command]` 显示与 `ai-i18n-tools <command> --help` 相同的每个命令用法。

---

## 环境变量

| 变量                     | 描述                                                      |
| ------------------------ | -------------------------------------------------------- |
| `OPENROUTER_API_KEY`     | **必需。** 您的 OpenRouter API 密钥。                     |
| `OPENROUTER_BASE_URL`    | 覆盖 API 基础 URL。                                     |
| `I18N_SOURCE_LOCALE`     | 在运行时覆盖 `sourceLocale`。                           |
| `I18N_TARGET_LOCALES`    | 逗号分隔的区域代码，用于覆盖 `targetLocales`。         |
| `I18N_LOG_LEVEL`         | 日志级别（`debug`，`info`，`warn`，`error`，`silent`）。 |
| `NO_COLOR`               | 当 `1` 时，禁用日志输出中的 ANSI 颜色。                |
| `I18N_LOG_SESSION_MAX`   | 每个日志会话保留的最大行数（默认 `5000`）。              |
