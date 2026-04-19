# ai-i18n-tools：快速开始

`ai-i18n-tools` 提供两个独立且可组合的工作流：

- **工作流 1 - UI 翻译**：从任意 JS/TS 源码中提取 `t("…")` 调用，通过 OpenRouter 进行翻译，并生成适用于 i18next 的扁平化、按语言划分的 JSON 文件。
- **工作流 2 - 文档翻译**：将 Markdown（MDX）和 Docusaurus JSON 标签文件翻译为任意数量的目标语言，并支持智能缓存。**SVG** 资源使用 `features.translateSVG`、顶级 `svg` 块以及 `translate-svg`（参见 [CLI 参考](#cli-reference)）。

两个工作流均使用 OpenRouter（任何兼容的 LLM）并共用一个配置文件。

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## 目录

- [安装](#installation)
- [快速开始](#quick-start)
- [工作流 1 - UI 翻译](#workflow-1---ui-translation)
  - [步骤 1：初始化](#step-1-initialise)
  - [步骤 2：提取字符串](#step-2-extract-strings)
  - [步骤 3：翻译 UI 字符串](#step-3-translate-ui-strings)
  - [导出为 XLIFF 2.0（可选）](#exporting-to-xliff-20-optional)
  - [步骤 4：运行时集成 i18next](#step-4-wire-i18next-at-runtime)
  - [在源码中使用 `t()`](#using-t-in-source-code)
  - [插值](#interpolation)
  - [语言切换 UI](#language-switcher-ui)
  - [RTL 语言](#rtl-languages)
- [工作流 2 - 文档翻译](#workflow-2---document-translation)
  - [步骤 1：为文档初始化](#step-1-initialise-for-documentation)
  - [步骤 2：翻译文档](#step-2-translate-documents)
    - [缓存行为与 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags)
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

发布的包仅支持 **ESM**。在 Node.js 或打包工具中使用 `import`/`import()`；请勿使用 `require('ai-i18n-tools')`。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools 内置字符串提取器。如果您之前使用过 `i18next-scanner`、`babel-plugin-i18next-extract` 或类似工具，在迁移后可以移除这些开发依赖。

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

默认的 `init` 模板（`ui-markdown`）仅启用 **UI** 提取和翻译。`ui-docusaurus` 模板则启用 **文档** 翻译（`translate-docs`）。当您希望使用一条命令根据配置执行提取、UI 翻译、可选的独立 SVG 翻译以及文档翻译时，请使用 `sync`。

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

在本地安装包后，您可以直接在脚本中使用 CLI 命令（无需 `npx`）：

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

## 工作流 1 - UI 翻译

适用于任何使用 i18next 的 JS/TS 项目：React 应用、Next.js（客户端和服务器组件）、Node.js 服务、CLI 工具。

### 步骤 1：初始化

```bash
npx ai-i18n-tools init
```

这将使用 `ai-i18n-tools.config.json` 模板写入 `ui-markdown`。编辑它以设置：

- `sourceLocale` - 你的源语言 BCP-47 代码（例如 `"en-GB"`）。**必须与** 从运行时 i18n 配置文件导出的 `SOURCE_LOCALE`（`src/i18n.ts` / `src/i18n.js`）相匹配。
- `targetLocales` - 目标语言的 BCP-47 代码数组（例如 `["de", "fr", "pt-BR"]`）。运行 `generate-ui-languages` 从此列表生成 `ui-languages.json` 清单。
- `ui.sourceRoots` - 要扫描 `t("…")` 调用的目录（例如 `["src/"]`）。
- `ui.stringsJson` - 主目录写入位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 写入 `de.json`、`pt-BR.json` 等的位置（例如 `"src/locales/"`）。
- `ui.preferredModel`（可选）- 尝试用于 `translate-ui` 的 **首个** OpenRouter 模型 ID；失败时，CLI 将按顺序继续使用 `openrouter.translationModels`（或旧版 `defaultModel` / `fallbackModel`），跳过重复项。

### 步骤 2：提取字符串

```bash
npx ai-i18n-tools extract
```

扫描 `ui.sourceRoots` 下所有 JS/TS 文件中的 `t("literal")` 和 `i18n.t("literal")` 调用。写入（或合并到）`ui.stringsJson`。

扫描器可配置：通过 `ui.reactExtractor.funcNames` 添加自定义函数名。

### 步骤 3：翻译 UI 字符串

```bash
npx ai-i18n-tools translate-ui
```

读取 `strings.json`，向 OpenRouter 发送每个目标区域设置的批次请求，将扁平 JSON 文件（`de.json`、`fr.json` 等）写入 `ui.flatOutputDir`。当设置了 `ui.preferredModel` 时，会优先尝试该模型，然后才是 `openrouter.translationModels` 中的有序列表（文档翻译和其他命令仍仅使用 `openrouter`）。

对于每个条目，`translate-ui` 在一个可选的 `models` 对象中存储成功翻译每个区域设置的 **OpenRouter 模型 ID**（与 `translated` 的区域设置键相同）。在本地 `editor` 命令中编辑的字符串会在对应区域设置的 `models` 中标记为特殊值 `user-edited`。`ui.flatOutputDir` 下每个区域设置的扁平文件仅保留 **源字符串 → 翻译** 映射；不包含 `models`（因此运行时包保持不变）。

> **关于使用缓存编辑器的说明：** 如果你在缓存编辑器中编辑了某个条目，需要运行 `sync --force-update`（或带有 `--force-update` 的等效 `translate` 命令）来重写输出文件以包含更新后的缓存条目。此外，请注意，如果源文本之后发生变化，你的手动编辑将会丢失，因为新的源字符串会生成新的缓存键（哈希值）。

### 导出为 XLIFF 2.0（可选）

若要将 UI 字符串交给翻译供应商、TMS 或 CAT 工具，请将目录导出为 **XLIFF 2.0** 格式（每个目标区域设置一个文件）。此命令为 **只读**：不会修改 `strings.json` 或调用任何 API。

```bash
npx ai-i18n-tools export-ui-xliff
```

默认情况下，文件写入到 `ui.stringsJson` 旁边，命名为 `strings.de.xliff`、`strings.pt-BR.xliff`（你的目录文件名 + 区域设置 + `.xliff`）。使用 `-o` / `--output-dir` 可指定其他写入位置。来自 `strings.json` 的现有翻译会出现在 `<target>` 中；缺失的区域设置使用 `state="initial"` 且无 `<target>`，以便工具填充。使用 `--untranslated-only` 仅导出每个区域设置仍需翻译的单元（适用于供应商批量处理）。`--dry-run` 仅打印路径而不写入文件。

### 步骤 4：运行时接入 i18next

使用 `'ai-i18n-tools/runtime'` 导出的辅助函数创建你的 i18n 配置文件：

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

**保持三个值一致：** **`ai-i18n-tools.config.json`** 中的 `sourceLocale`、此文件中的 **`SOURCE_LOCALE`**，以及 **`translate-ui`** 写入扁平输出目录下的 **`{sourceLocale}.json`** 的复数扁平 JSON（通常为 `public/locales/`）。在静态 **`import`** 中使用相同的文件名（如上例：`en-GB` → `en-GB.json`）。**`sourcePluralFlatBundle`** 中的 **`lng`** 字段必须等于 **`SOURCE_LOCALE`**。静态 ES **`import`** 路径不能使用变量；如果更改源语言，请同时更新 **`SOURCE_LOCALE`** 和导入路径。或者，使用动态 **`import(\`./public/locales/${SOURCE_LOCALE}.json\`)`**、**`fetch`** 或 **`readFileSync`** 加载该文件，使路径由 **`SOURCE_LOCALE`** 构建。

该代码段将 **`./locales/…`** 和 **`./public/locales/…`** 视为与 **`i18n`** 位于同一目录旁边。如果您的文件位于 **`src/`** 下（常见情况），请使用 **`../locales/…`** 和 **`../public/locales/…`**，以便导入路径与 **`ui.stringsJson`**、**`uiLanguagesPath`** 和 **`ui.flatOutputDir`** 保持一致。

在 React 渲染前导入 `i18n.js`（例如在入口文件顶部）。当用户更改语言时，调用 `await loadLocale(code)`，然后调用 `i18n.changeLanguage(code)`。

通过从 **`ui-languages.json`** 中派生并使用 **`makeLocaleLoadersFromManifest`**（使用与 **`makeLoadLocale`** 相同的规范化方式过滤掉 **`SOURCE_LOCALE`**），使 `localeLoaders` **与配置保持一致**。当你将一种语言区域添加到 **`targetLocales`** 并运行 **`generate-ui-languages`** 后，清单会自动更新，你的加载器也会跟踪它，而无需维护单独的硬编码映射。如果 JSON 包位于 **`public/`** 下（典型的 Next.js 结构），则应使用 **`fetch(\`/locales/${code}.json\`)`** 实现每个加载器，而不是 **`import()`**，以便浏览器从你的公共 URL 路径加载静态 JSON。对于没有打包工具的 Node CLI，使用 **`readFileSync`** 在一个小型 **`makeFileLoader`** 辅助函数中加载语言区域文件，该函数为每个代码返回解析后的 JSON。

`SOURCE_LOCALE` 被导出，因此任何其他需要它的文件（例如语言切换器）都可以直接从 `'./i18n'` 导入它。如果你正在迁移现有的 i18next 配置，请将分散在组件中的硬编码源语言字符串（例如 `'en-GB'` 检查）替换为从你的 i18n 引导文件中导入的 `SOURCE_LOCALE`。

如果你不想使用默认导出，也可以使用具名导入（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`），其行为相同。

`aiI18n.defaultI18nInitOptions(sourceLocale)`（或以名称导入时的 `defaultI18nInitOptions(sourceLocale)`）返回键作为默认值配置的标准选项：

- `parseMissingKeyHandler` 返回键本身，因此未翻译的字符串将显示源文本。
- `nsSeparator: false` 允许键中包含冒号。
- `interpolation.escapeValue: false` — 可以安全地禁用：React 本身会对值进行转义，而 Node.js/CLI 输出中没有需要转义的 HTML。

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` 是 ai-i18n-tools 项目的 **推荐** 配置方式：它应用键裁剪 + 源语言区域 <code>{"{{var}}"}</code> 插值回退（行为与底层的 **`wrapI18nWithKeyTrim`** 相同），可选择通过 **`addResourceBundle`** 合并 **`translate-ui`** **`{sourceLocale}.json`** 复数后缀键，然后安装来自你的 **`strings.json`** 的支持复数的 **`wrapT`**。该捆绑文件必须是你 **已配置** 源语言区域的复数扁平化文件 —— 与你在 i18n 引导文件中使用的 **`sourceLocale`** 相同，即 **`ai-i18n-tools.config.json`** 和 **`SOURCE_LOCALE`**（参见上面的步骤 4）。仅在引导过程中省略 **`sourcePluralFlatBundle`**（一旦 **`translate-ui`** 生成了 **`{sourceLocale}.json`**，就合并它）。单独使用 **`wrapI18nWithKeyTrim`** 在应用代码中已被 **弃用** — 应改用 **`setupKeyAsDefaultT`**。

`makeLoadLocale(i18n, loaders, sourceLocale)` 返回一个异步的 `loadLocale(lang)` 函数，该函数动态导入某个语言区域的 JSON 包并将其注册到 i18next。

### 在源代码中使用 `t()`

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

- 仅以下形式会被提取：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")`。
- 键必须是 **字面量字符串** — 不得使用变量或表达式作为键。
- 不要对键使用模板字符串：<code>{'t(`Hello ${name}`)'}</code> 无法被提取。

### 插值

使用 i18next 原生的第二个参数进行 <code>{"{{var}}"}</code> 占位符的插值：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

extract 命令会解析 **第二个参数**，当它是一个普通对象字面量时，读取仅用于工具的标志，例如 **`plurals: true`** 和 **`zeroDigit`**（参见下方的 **Cardinal plurals**）。对于普通字符串，仅使用字面量键进行哈希；插值选项仍会在运行时传递给 i18next。

如果你的项目使用了自定义插值工具（例如调用 `t('key')` 然后将结果传递给像 `interpolateTemplate(t('Hello {{name}}'), { name })` 这样的模板函数），则 **`setupKeyAsDefaultT`**（通过 **`wrapI18nWithKeyTrim`**）使其变得不再必要 — 它即使在源语言区域返回原始键时也能应用 <code>{"{{var}}"}</code> 插值。请将调用点迁移到 `t('Hello {{name}}', { name })` 并移除自定义工具。

### 基数复数（`plurals: true`）

使用你希望作为开发者默认文本的 **相同字面量**，并传入 **`plurals: true`**，以便 extract 和 `translate-ui` 将该调用视为一个 **基数复数组**（i18next JSON v4 风格的 `_zero` … `_other` 形式）。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- **`zeroDigit`**（可选）—— 仅用于工具；i18next **不会**读取该字段。当设置为 `true` 时，提示在每个存在该形式的语种中，`_zero` 字符串内使用字面量阿拉伯数字 **`0`**；当为 `false` 或省略时，则使用自然表达的“零”措辞。在调用 `i18next.t` 前应移除这些键（参见下方的 `wrapT`）。

**验证:** 如果消息包含 **两个或更多** 不同的 `{{…}}` 占位符， **其中一个必须是 `{{count}}`** （复数轴）。否则 `extract` **失败**，并带有清晰的文件/行消息。

**两个独立计数**（例如章节和页数）不能共用一条复数消息——应使用 **两个** `t()` 调用（每个都包含 `plurals: true` 及其各自的 `count`），然后在 UI 中拼接。

**在 `strings.json` 中，**复数组采用**每个哈希值一行**的格式，包含 `"plural": true`、位于 **`source`** 中的原始字面量，以及 **`translated[locale]`**（作为将基数类别（`zero`、`one`、`two`、`few`、`many`、`other`）映射到该语言环境字符串的对象）。

**扁平化语种 JSON：**非复数行保持 **源句 → 翻译** 格式。复数行以 **`<groupId>_original`**（等于 `source`，用于参考）和每个后缀对应的 **`<groupId>_<form>`** 输出，以便 i18next 原生解析复数。**`translate-ui`** 还会写入 **`{sourceLocale}.json`**，其中 **仅包含**复数扁平键（为源语言加载此包，以使带后缀的键能够解析；普通字符串仍使用键作为默认值）。对于每个目标语种，输出的后缀键会匹配该语种的 **`Intl.PluralRules`**（`requiredCldrPluralForms`）：如果 `strings.json` 因压缩后与其他类别相同而省略了某个类别（例如阿拉伯语的 **`many`** 与 **`other`** 相同），**`translate-ui`** 仍会通过从备用同类字符串复制，将所有必需的后缀写入扁平文件，以确保运行时查找不会遗漏任何键。

运行时（`ai-i18n-tools/runtime`）：**调用** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` —— 它会运行 **`wrapI18nWithKeyTrim`**，注册可选的 **`translate-ui`** `{sourceLocale}.json` 复数包，然后使用 **`wrapT`** 执行 **`buildPluralIndexFromStringsJson(stringsJson)`**。`wrapT` 会剥离 `plurals` / `zeroDigit`，在需要时将键重写为分组 ID，并转发 **`count`**（可选：如果只有一个非 `{{count}}` 占位符，则 `count` 会从该数值选项复制）。

**较旧环境：** `Intl.PluralRules` 对工具和一致性行为是必需的；若需支持非常旧的浏览器，请使用 polyfill。

**v1 中不包含：** 序数复数（`_ordinal_*`、`ordinal: true`）、区间复数、仅限 ICU 的管道。

### 语言切换器 UI

使用 `ui-languages.json` 清单构建语言选择器。`ai-i18n-tools` 导出两个显示辅助函数：

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

`getUILanguageLabel(lang, t)` - 翻译后显示 `t(englishName)`，当两者不同时则显示 `englishName / t(englishName)`。适用于设置界面。

`getUILanguageLabelNative(lang)` —— 显示 `englishName / label`（每行无需 `t()` 调用）。适用于希望显示本地名称的页眉菜单。

`ui-languages.json` 清单是一个 JSON 数组，包含 <code>{"{ code, label, englishName, direction }"}</code> 条目（`direction` 为 `"ltr"` 或 `"rtl"`）。示例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

该清单由 `generate-ui-languages` 根据 `sourceLocale` + `targetLocales` 和打包的主目录生成，并写入 `ui.flatOutputDir`。如果更改了配置中的任何语种，请运行 `generate-ui-languages` 以更新 `ui-languages.json` 文件。

### RTL 语言

`ai-i18n-tools` 导出 `getTextDirection(lng)` 和 `applyDirection(lng)`：

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` 设置 `document.documentElement.dir`（浏览器环境）或为空操作（Node.js 环境）。可传入可选的 `element` 参数以指定目标元素。

对于可能包含 `→` 箭头的字符串，在 RTL 布局中应将其翻转：

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## 工作流程 2 - 文档翻译

适用于 Markdown 文档、Docusaurus 站点和 JSON 标签文件。当启用 `features.translateSVG` 并设置了顶层 `svg` 块时，独立 SVG 资源将通过 [`translate-svg`](#cli-reference) 进行翻译——而非通过 `documentations[].contentPaths`。

### 步骤 1：初始化文档配置

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

编辑生成的 `ai-i18n-tools.config.json`：

- `sourceLocale` - 源语言（必须与 `defaultLocale` 中的 `docusaurus.config.js` 一致）。
- `targetLocales` - BCP-47 语言区域代码数组（例如 `["de", "fr", "es"]`）。
- `cacheDir` - 所有文档流水线共享的 SQLite 缓存目录（也是 `--write-logs` 的默认日志目录）。
- `documentations` - 文档块数组。每个块包含可选的 `description`、`contentPaths`、`outputDir`、可选的 `jsonSource`、`markdownOutput`、可选的 `segmentSplitting`、`targetLocales`、`addFrontmatter` 等。
- `documentations[].description` - 面向维护者的可选简短说明（说明此块涵盖的内容）。设置后，它会显示在 `translate-docs` 标题（`🌐 …: translating …`）和 `status` 的节标题中。
- `documentations[].contentPaths` - Markdown/MDX 源目录或文件（另见 `documentations[].jsonSource` 中的 JSON 标签）。
- `documentations[].outputDir` - 该块的翻译输出根目录。
- `documentations[].markdownOutput.style` - `"nested"`（默认）、`"docusaurus"` 或 `"flat"`（参见 [输出布局](#output-layouts)）。

### 步骤 2：翻译文档

```bash
npx ai-i18n-tools translate-docs
```

这会将每个 `documentations` 块中的 `contentPaths` 下的所有文件翻译为所有有效的文档语言区域（取每个块的 `targetLocales` 的并集，若未设置则使用根 `targetLocales`）。已翻译的片段从 SQLite 缓存中提供服务——只有新增或更改的片段才会发送到 LLM。

要翻译单个语言区域：

```bash
npx ai-i18n-tools translate-docs --locale de
```

要检查需要翻译的内容：

```bash
npx ai-i18n-tools status
```

#### 缓存行为和 `translate-docs` 标志

CLI 在 SQLite 中维护 **文件跟踪**（每个文件 × 语言区域的源哈希）和 **片段** 行（每个可翻译块的哈希 × 语言区域）。正常运行时，如果跟踪的哈希与当前源匹配 **且** 输出文件已存在，则完全跳过该文件；否则处理该文件并使用片段缓存，以确保未更改的文本不会调用 API。

| 标志                          | 效果                                                                                                                                                                                                                                                                  |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(默认)*                   | 当跟踪和磁盘输出匹配时跳过未更改的文件；其余部分使用片段缓存。                                                                                                                                                                              |
| `-l, --locale <codes>`        | 以逗号分隔的目标语言区域（若省略，则默认为根 `targetLocales` 和每个 `documentations[]` 块中可选的 `targetLocales` 的并集）。                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | 仅翻译此路径下的 Markdown/JSON（项目相对路径或绝对路径）；`--file` 是 `--path` 的别名。                                                                                                                                                         |
| `--dry-run`                   | 不进行文件写入，也不调用 API。                                                                                                                                                                                                                                        |
| `--type <kind>`               | 限制为 `markdown` 或 `json`（否则在配置中启用时两者都使用）。                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | 仅翻译 JSON 标签文件，或跳过 JSON 仅翻译 Markdown。                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | 最大并行目标语言区域数（默认来自配置或 CLI 内置默认值）。                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | 每个文件的最大并行批处理 API 调用数（文档；默认来自配置或 CLI）。                                                                                                                                                                                               |
| `--emphasis-placeholders`     | 在翻译前将 Markdown 强调标记掩码为占位符（可选；默认关闭）。                                                                                                                                                                              |
| `--debug-failed`              | 验证失败时在 `cacheDir` 下写入详细的 `FAILED-TRANSLATION` 日志。                                                                                                                                                                                        |
| `--force-update`              | 即使文件跟踪本可跳过，也重新处理每个匹配的文件（提取、重新组装、写入输出）。**分段缓存仍然适用** —— 未更改的分段不会发送到 LLM。                                                                                    |
| `--force`                     | 清除每个已处理文件的文件跟踪，并且**不读取**用于 API 翻译的分段缓存（完全重新翻译）。新的结果仍然会**写入**分段缓存。                                                                                 |
| `--stats`                     | 打印分段计数、已跟踪文件计数以及每个语言区域的分段总数，然后退出。                                                                                                                                                                                    |
| `--clear-cache [locale]`      | 删除缓存的翻译（和文件跟踪）：所有语言区域，或单个语言区域，然后退出。                                                                                                                                                                             |
| `--prompt-format <mode>`      | 每个**批处理**分段发送到模型并解析的方式（`xml`、`json-array` 或 `json-object`）。默认为 **`json-array`**。不改变提取、占位符、验证、缓存或回退行为 —— 参见 [批处理提示格式](#batch-prompt-format)。 |

您不能将 `--force` 与 `--force-update` 结合使用（它们互斥）。

#### 批处理提示格式

`translate-docs` 以**批处理**方式（按 `batchSize` / `maxBatchChars` 分组）将可翻译分段发送到 OpenRouter。**`--prompt-format`** 标志仅更改该批处理的**线上传输格式**；`PlaceholderHandler` 令牌、Markdown AST 检查、SQLite 缓存键以及批处理解析失败时的每分段回退保持不变。

| 模式                       | 用户消息                                                           | 模型回复                                                 |
|----------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| **`xml`**                  | 伪 XML：每个分段一个 `<seg id="N">…</seg>`（含 XML 转义）。 | 仅包含 `<t id="N">…</t>` 块，每个分段索引一个。       |
| **`json-array`** (默认) | 一个字符串的 JSON 数组，按顺序每个分段一个条目。               | 一个**相同长度**的 JSON 数组（相同顺序）。           |
| **`json-object`**          | 一个以分段索引为键的 JSON 对象 `{"0":"…","1":"…",…}`。            | 一个具有**相同键**且值已翻译的 JSON 对象。 |

运行头信息还会打印 `Batch prompt format: …`，以便您确认当前的活动模式。当这些步骤作为 `translate-docs`（或 `sync` 的文档阶段 —— `sync` 不暴露此标志，默认为 **`json-array`**）的一部分运行时，JSON 标签文件（`jsonSource`）和独立 SVG 批处理使用相同的设置。

#### SQLite 中的段落去重与路径

- 段落行通过 `(source_hash, locale)` 全局键控（哈希 = 规范化后的内容）。两个文件中的相同文本共享一行；`translations.filepath` 是元数据（最后写入者），而非每个文件的第二个缓存条目。
- `file_tracking.filepath` 使用命名空间键：每个 `documentations` 块使用 `doc-block:{index}:{relPath}`（`relPath` 是项目根目录相对的 posix 路径：收集到的 markdown 路径；**JSON 标签文件使用源文件的当前工作目录（cwd）相对路径**，例如 `docs-site/i18n/en/code.json`，以便清理时能解析真实文件），以及 `translate-svg` 下独立 SVG 资源的 `svg-assets:{relPath}`。
- `translations.filepath` 为 markdown、JSON 和 SVG 段落存储 cwd 相对的 posix 路径（SVG 使用与其他资源相同的路径结构；`file_tracking` 上 **仅** 添加 `svg-assets:…` 前缀）。
- 一次运行后，仅当段落行 **处于相同翻译作用域内**（遵循 `--path` 和启用的类型）且未被命中时，`last_hit_at` 才会被清除，因此过滤运行或仅文档运行不会将无关文件标记为过期。

### 输出布局

`"nested"`（省略时的默认值）—— 在 `{outputDir}/{locale}/` 下镜像源树结构（例如 `docs/guide.md` → `i18n/de/docs/guide.md`）。

`"docusaurus"` —— 将位于 `docsRoot` 下的文件放置在 `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`，匹配通常的 Docusaurus i18n 布局。将 `documentations[].markdownOutput.docsRoot` 设置为您的文档源根目录（例如 `"docs"`）。

```text
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - 将翻译后的文件与源文件并置，并添加区域设置后缀，或放在子目录中。页面之间的相对链接会自动重写。

```text
docs/guide.md → i18n/guide.de.md
```

您可以使用 `documentations[].markdownOutput.pathTemplate` 完全覆盖路径。占位符：<code>"{outputDir}"</code>，<code>"{locale}"</code>，<code>"{LOCALE}"</code>，<code>"{relPath}"</code>，<code>"{stem}"</code>，<code>"{basename}"</code>，<code>"{extension}"</code>，<code>"{docsRoot}"</code>，<code>"{relativeToDocsRoot}"</code>。

---

## 组合工作流（UI + 文档）

在单个配置中启用所有功能，以同时运行两个工作流：

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

`glossary.uiGlossary` 指向与 UI 相同的 `strings.json` 目录进行文档翻译，以保持术语一致；`glossary.userGlossary` 添加产品术语的 CSV 覆盖。

运行 `npx ai-i18n-tools sync` 以执行一个流水线：**提取** UI 字符串（如果启用了 `features.extractUIStrings`），**翻译 UI** 字符串（如果启用了 `features.translateUIStrings`），**翻译独立 SVG 资产**（如果设置了 `features.translateSVG` 和 `svg` 块），然后 **翻译文档**（每个 `documentations` 块：按配置翻译 markdown/JSON）。使用 `--no-ui`、`--no-svg` 或 `--no-docs` 跳过部分步骤。文档步骤接受 `--dry-run`、`-p` / `--path`、`--force` 和 `--force-update`（最后两个仅在文档翻译运行时生效；如果传入 `--no-docs` 则被忽略）。

在某个块上使用 `documentations[].targetLocales` 可将该块的文件翻译为比 UI **更小子集**的区域设置（有效文档区域设置是所有块的 **并集**）：

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

### 混合文档工作流（Docusaurus + 扁平）

您可以通过在 `documentations` 中添加多个条目，在同一配置中组合多个文档流水线。当项目拥有 Docusaurus 站点以及需要使用扁平输出进行翻译的根级 markdown 文件（例如仓库的 README）时，这是一种常见设置。

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "extractUIStrings": true,
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
      "description": "Docusaurus docs and JSON labels",
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
      "description": "Root README in flat output",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

使用 `npx ai-i18n-tools sync` 的执行方式：

- 从 `src/` 提取/翻译 UI 字符串到 `public/locales/`。
- 第一个文档块将 markdown 和 JSON 标签翻译为 Docusaurus `i18n/<locale>/...` 布局。
- 第二个文档块将 `README.md` 翻译为 `translated-docs/` 下带有区域设置后缀的扁平文件。
- 所有文档块共享 `cacheDir`，因此未更改的段落会在多次运行中复用，以减少 API 调用和成本。

---

## 配置参考

### `sourceLocale`

源语言的 BCP-47 代码（例如 `"en-GB"`、`"en"`、`"pt-BR"`）。不会为此区域设置生成翻译文件 —— 键字符串本身即为源文本。

**必须匹配** 从您的运行时 i18n 配置文件（`src/i18n.ts` / `src/i18n.js`）导出的 `SOURCE_LOCALE`。

### `targetLocales`

要翻译成的 BCP-47 语言区域代码数组（例如 `["de", "fr", "es", "pt-BR"]`）。

`targetLocales` 是用于 UI 翻译的主要语言区域列表，也是文档块的默认语言区域列表。使用 `generate-ui-languages` 可基于 `sourceLocale` + `targetLocales` 生成 `ui-languages.json` 清单。

### `uiLanguagesPath`（可选）

用于显示名称、语言区域筛选和语言列表后处理的 `ui-languages.json` 清单路径。若省略，CLI 将在 `ui.flatOutputDir/ui-languages.json` 处查找该清单。

在以下情况下使用：

- 清单位于 `ui.flatOutputDir` 之外，需要显式指向 CLI。
- 您希望 `markdownOutput.postProcessing.languageListBlock` 从清单中生成语言区域标签。
- `extract` 应将清单中的 `englishName` 条目合并到 `strings.json` 中（需要 `ui.reactExtractor.includeUiLanguageEnglishNames: true`）。

### `concurrency`（可选）

同时翻译的最大 **目标语言区域**数量（`translate-ui`、`translate-docs`、`translate-svg` 以及 `sync` 中对应的步骤）。若省略，CLI 在 UI 翻译时使用 **4**，在文档翻译时使用 **3**（内置默认值）。可通过 `-j` / `--concurrency` 每次运行时覆盖。

### `batchConcurrency`（可选）

**translate-docs** 和 **translate-svg**（以及 `sync` 的文档步骤）：每个文件每批最大并行 OpenRouter **batch** 请求数量（每批可包含多个片段）。省略时默认为 **4**。`translate-ui` 忽略此设置。可通过 `-b` / `--batch-concurrency` 覆盖。在 `sync` 上，`-b` 仅适用于文档翻译步骤。

### `batchSize` / `maxBatchChars`（可选）

文档翻译的片段批处理：每 API 请求的片段数量及字符上限。默认值：**20** 个片段，**4096** 个字符（若省略）。

### `openrouter`

| 字段               | 说明                                                                                                                                                                                                      |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `baseUrl`           | OpenRouter API 基础 URL。默认值：`https://openrouter.ai/api/v1`。                                                                                                                                                |
| `translationModels` | 模型 ID 的首选有序列表。优先尝试第一个；出错时依次使用后续条目作为备用。对于 `translate-ui`，您还可以设置 `ui.preferredModel` 以在该列表之前尝试一个模型（参见 `ui`）。 |
| `defaultModel`      | 旧版单一主模型。仅当 `translationModels` 未设置或为空时使用。                                                                                                                               |
| `fallbackModel`     | 旧版单一备用模型。当 `translationModels` 未设置或为空时，在 `defaultModel` 之后使用。                                                                                                              |
| `maxTokens`         | 每请求最大完成 token 数。默认值：`8192`。                                                                                                                                                              |
| `temperature`       | 采样温度。默认值：`0.2`。                                                                                                                                                                            |

**为何使用多个模型：** 不同提供商和模型在不同语言和区域设置下的成本和质量水平各不相同。将 `openrouter.translationModels` 配置为 **有序回退链**（而非单一模型），以便 CLI 在请求失败时尝试下一个模型。

将以下列表视为可扩展的 **基线**：如果特定区域设置的翻译效果不佳或失败，请研究哪些模型能有效支持该语言或文字（参考在线资源或提供商文档），并将这些 OpenRouter ID 添加为更多备选项。

此列表已**经过广泛地域覆盖测试**（例如，在**2026年4月**翻译一个大型文档项目的**36**个目标地域时）；可作为实用的默认选项，但不保证在所有地域下均表现良好。

示例 `translationModels`（与 `npx ai-i18n-tools init` 的默认设置相同）：

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

在您的环境或 `.env` 文件中设置 `OPENROUTER_API_KEY`。

### `features`

| 字段                | 工作流程 | 说明                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | 扫描源文件中的 `t("…")` / `i18n.t("…")`，将可选的 `package.json` 描述以及（如果启用）`ui-languages.json` `englishName` 值合并到 `strings.json` 中。 |
| `translateUIStrings` | 1        | 翻译 `strings.json` 条目并生成按地域划分的 JSON 文件。                                                                                                  |
| `translateMarkdown`  | 2        | 翻译 `.md` / `.mdx` 文件。                                                                                                                                    |
| `translateJSON`      | 2        | 翻译 Docusaurus JSON 标签文件。                                                                                                                             |
| `translateSVG`       | 2        | 翻译独立的 `.svg` 资源（需要顶层的 **`svg`** 块）。                                                                                         |

**翻译独立** SVG 资源时，若 `features.translateSVG` 为 true 且已配置顶层 `svg` 块，则使用 `translate-svg`。当这两个条件均满足时（除非设置了 `--no-svg`），`sync` 命令将执行该步骤。

### `ui`

| 字段                                          | 说明                                                                                                                                                                                                                                                        |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourceRoots`                                  | 扫描 `t("…")` 调用的目录（相对于当前工作目录）。                                                                                                                                                                                                          |
| `stringsJson`                                  | 主目录文件的路径。由 `extract` 更新。                                                                                                                                                                                                             |
| `flatOutputDir`                                | 按地域生成 JSON 文件的目录（如 `de.json` 等）。                                                                                                                                                                                               |
| `preferredModel`                               | 可选。优先尝试用于 `translate-ui` 的 OpenRouter 模型 ID；若失败，则按顺序尝试 `openrouter.translationModels`（或旧版模型），但不会重复使用此 ID。                                                                                                   |
| `reactExtractor.funcNames`                     | 要扫描的额外函数名（默认值：`["t", "i18n.t"]`）。                                                                                                                                                                                                    |
| `reactExtractor.extensions`                    | 要包含的文件扩展名（默认值：`[".js", ".jsx", ".ts", ".tsx"]`）。                                                                                                                                                                                            |
| `reactExtractor.includePackageDescription`     | 当设置为 `true`（默认值）时，如果存在，`extract` 还会将 `package.json` `description` 作为 UI 字符串包含在内。                                                                                                                                                           |
| `reactExtractor.packageJsonPath`               | 用于提取可选描述的自定义 `package.json` 文件路径。                                                                                                                                                                              |
| `reactExtractor.includeUiLanguageEnglishNames` | 当设置为 `true`（默认值 `false`）时，如果源扫描中尚未存在（相同的哈希键），`extract` 还会将清单中 `uiLanguagesPath` 处的每个 `englishName` 添加到 `strings.json`。需要 `uiLanguagesPath` 指向一个有效的 `ui-languages.json`。 |

### `cacheDir`

| 字段       | 说明                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite 缓存目录（所有 `documentations` 块共享）。在多次运行之间重复使用。如果您正在从自定义文档翻译缓存迁移，请归档或删除它 —— `cacheDir` 会创建自己的 SQLite 数据库，且与其他模式不兼容。 |

版本控制系统（VCS）排除的最佳实践：

- 排除翻译缓存文件夹内容（例如通过 `.gitignore` 或 `.git/info/exclude`），以避免提交临时缓存产物。
- 保持 `cache.db` 可用（不要常规性删除），因为保留 SQLite 缓存可避免重新翻译未更改的片段，从而在更改或升级使用 `ai-i18n-tools` 的软件时节省运行时间和 API 成本。

示例：

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

### `documentations`

文档处理流水线块的数组。`translate-docs` 和 `sync` 的文档阶段 **按顺序处理每个**块。

| 字段                                             | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `description`                                     | 此区块的可选人类可读备注（不用于翻译）。设置时，会作为前缀显示在 `translate-docs` `🌐` 标题中；也会显示在 `status` 章节标题中。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `contentPaths`                                    | 需要翻译的 Markdown/MDX 源文件（`translate-docs` 会扫描这些文件以查找 `.md` / `.mdx`）。JSON 标签来自同一区块中的 `jsonSource`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `outputDir`                                       | 此区块翻译输出的根目录。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sourceFiles`                                     | 加载时合并到 `contentPaths` 的可选别名。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `targetLocales`                                   | 仅为该模块指定的可选区域设置子集（否则使用根级 `targetLocales`）。实际生效的文档区域设置为所有模块的并集。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `jsonSource`                                      | 该模块的 Docusaurus JSON 标签文件的源目录（例如 `"i18n/en"`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.style`                            | `"nested"`（默认）、`"docusaurus"` 或 `"flat"`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.docsRoot`                         | Docusaurus 布局的源文档根目录（例如 `"docs"`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `markdownOutput.pathTemplate`                     | 自定义 Markdown 输出路径。支持的占位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.jsonPathTemplate`                 | 用于标签文件的自定义 JSON 输出路径。支持与 `pathTemplate` 相同的占位符。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `markdownOutput.flatPreserveRelativeDir`          | 对于 `flat` 样式，保留源子目录以避免具有相同文件名的文件发生冲突。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `markdownOutput.rewriteRelativeLinks`             | 翻译后重写相对链接（对于 `flat` 样式会自动启用）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `markdownOutput.linkRewriteDocsRoot`              | 计算扁平化链接重写前缀时使用的仓库根目录。除非你的翻译文档位于不同的项目根目录下，否则通常应保持为 `"."`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `markdownOutput.postProcessing`                | 对翻译后的 **markdown 正文**应用的可选转换（YAML 前置内容保持不变）。在片段重新组装和扁平链接重写之后、`addFrontmatter`之前执行。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `segmentSplitting`                             | 与 `markdownOutput` 相同级别（按 `documentations[]` 块划分）。用于 **`translate-docs`** 提取的更细粒度片段：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`。当 **`enabled`** 为 **`true`** 时（默认情况下 **`segmentSplitting`** 被省略时），密集段落、GFM 管道表格（第一个块包含表头、分隔符和首行数据）以及长列表会被拆分；子部分以单个换行符重新连接（**`tightJoinPrevious`**）。设置 **`"enabled": false`** 可使每个空行分隔的正文块仅对应一个片段。 |
| `markdownOutput.postProcessing.regexAdjustments`  | `{ "description"?, "search", "replace" }` 的有序列表。`search` 是正则表达式模式（纯字符串使用标志 `g` 或 `/pattern/flags`）。`replace` 支持占位符，例如 `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}`。                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — 翻译器查找包含 `start` 的第一行以及对应的 `end` 行，然后用标准语言切换器替换该片段。链接使用相对于翻译文件的路径构建；标签来自配置的 `uiLanguagesPath` / `ui-languages.json`，若未配置则来自 `localeDisplayNames` 和区域代码。                                                                                                                                                                                                                                                                                       |
| `addFrontmatter`                                  | 当启用 `true` 时（省略时默认启用），翻译后的 markdown 文件将包含以下 YAML 键：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`，以及当至少有一个片段包含模型元数据时的 `translation_models`（所使用的 OpenRouter 模型 ID 的排序列表）。设置为 `false` 可跳过。                                                                                                                                                                                                                                                                                                                           |

示例（扁平 README 流程 — 截图路径 + 可选语言列表包装器）：

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

独立 SVG 资源的顶层路径和布局。仅当 **`features.translateSVG`** 为 true 时（通过 `translate-svg` 或 `sync` 的 SVG 阶段）才会执行翻译。

| 字段                         | 说明                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | 一个目录或一组目录，递归扫描其中的 `.svg` 文件。                                                                                                                                                                                                     |
| `outputDir`                   | 翻译后 SVG 输出的根目录。                                                                                                                                                                                                                                          |
| `style`                       | 当未设置 `pathTemplate` 时，默认为 `"flat"` 或 `"nested"`。                                                                                                                                                                                                                               |
| `pathTemplate`                | 自定义 SVG 输出路径。占位符：<code>{"{outputDir}"}</code>、<code>{"{locale}"}</code>、<code>{"{LOCALE}"}</code>、<code>{"{relPath}"}</code>、<code>{"{stem}"}</code>、<code>{"{basename}"}</code>、<code>{"{extension}"}</code>、<code>{"{relativeToSourceRoot}"}</code>。 |
| `svgExtractor.forceLowercase` | SVG 重组时使用小写翻译文本。适用于依赖全小写标签的设计。                                                                                                                                                                                |

### `glossary`

| 字段          | 说明                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 指向 `strings.json` 的路径 —— 从现有翻译中自动构建术语表。                                                                                                 |
| `userGlossary` | 指向包含列 `Original language string`（或 `en`）、`locale`、`Translation` 的 CSV 文件的路径 —— 每行对应一个源术语和目标语言环境（`locale` 可以为所有目标设为 `*`）。 |

旧键 `uiGlossaryFromStringsJson` 仍被接受，并在加载配置时映射到 `uiGlossary`。

生成一个空的术语表 CSV：

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLI 参考

| 命令                                                                     | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                   | 打印 CLI 版本和构建时间戳（与根程序上的 `-V` / `--version` 相同的信息）。
| `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]`  | 编写一个初始配置文件（包含 `concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 和 `documentations[].addFrontmatter`）。`--with-translate-ignore` 会创建一个初始的 `.translate-ignore`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `extract`                                                                   | 根据 `t("…")` / `i18n.t("…")` 字面量更新 `strings.json`，可选的 `package.json` 描述和可选的清单 `englishName` 条目（参见 `ui.reactExtractor`）。需要 `features.extractUIStrings`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `generate-ui-languages [--master <path>] [--dry-run]`                       | 使用 `sourceLocale` + `targetLocales` 和捆绑的 `data/ui-languages-complete.json`（或 `--master`）将 `ui-languages.json` 写入 `ui.flatOutputDir`（或设置时写入 `uiLanguagesPath`）。对于主文件中缺失的语言区域会发出警告并生成 `TODO` 占位符。如果您现有的清单中包含自定义的 `label` 或 `englishName` 值，它们将被主目录中的默认值替换——请在生成文件后进行检查和调整。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `translate-docs …`                                                          | 为每个 `documentations` 块（`contentPaths`，可选 `jsonSource`）翻译 Markdown/MDX 和 JSON。`-j`：最大并行语言区域数；`-b`：每个文件最大并行批处理 API 调用数。`--prompt-format`：批处理传输格式（`xml` \| `json-array` \| `json-object`）。参见 [缓存行为和 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags) 和 [批处理提示格式](#batch-prompt-format)。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-svg …`                                                           | 翻译在 `config.svg` 中配置的独立 SVG 资源（与文档分离）。需要 `features.translateSVG`。与文档共享相同的缓存机制；支持 `--no-cache` 以跳过该次运行的 SQLite 读写操作。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`             | 仅翻译用户界面字符串。`--force`：按语言区域重新翻译所有条目（忽略现有翻译）。`--dry-run`：不写入，不调用 API。`-j`：最大并行语言区域数。需要 `features.translateUIStrings`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                                                    | 运行 `extract` **first**（需要 **`features.extractUIStrings`**），使 **`strings.json`** 与源文件一致，然后由大语言模型审查 **source-locale** 的 UI 字符串（拼写、语法）。**术语提示** 仅来自 **`glossary.userGlossary`** CSV（范围与 **`translate-ui`** 相同，不包括 `strings.json` / `uiGlossary`，因此不会将错误的文本强化为术语表）。使用 OpenRouter（`OPENROUTER_API_KEY`）。仅作建议用途（运行完成时以退出码 **0** 结束）。将 **`lint-source-results_<timestamp>.log`** 写入 **`cacheDir`** 下，生成 **human-readable** 报告（包含摘要、问题和每条字符串的 **OK** 行）；终端仅打印摘要统计和问题（不打印每条字符串的 **`[ok]`** 行）。最后一行输出日志文件名。**`--json`**：仅在标准输出生成完整的机器可读 JSON 报告（日志文件保持人类可读）。**`--dry-run`**：仍运行 **`extract`**，但仅打印批处理计划（不调用 API）。**`--chunk`**：每个 API 批次的字符串数量（默认 **50**）。**`-j`**：最大并行批次数量（默认 **`concurrency`**）。使用 **`--json`** 时，人工可读输出发送到 stderr。链接使用 **`path:line`**，类似于 **`editor`** UI 字符串中的“链接”按钮。 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | 将 `strings.json` 导出为 XLIFF 2.0 格式（每个目标语言一个 `.xliff`）。`-o` / `--output-dir`：输出目录（默认：与目录文件相同文件夹）。`--untranslated-only`：仅导出该语言缺少翻译的单元。只读操作；不调用 API。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sync …`                                                                    | 若启用则先提取，然后进行 UI 翻译，当 `features.translateSVG` 和 `config.svg` 设置时再执行 `translate-svg`，最后进行文档翻译——除非通过 `--no-ui`、`--no-svg` 或 `--no-docs` 跳过。共享标志：`-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（仅用于文档分批）、`--force` / `--force-update`（仅用于文档；文档运行时互斥）。文档阶段还会转发 `--emphasis-placeholders` 和 `--debug-failed`（含义与 `translate-docs` 相同）。`--prompt-format` 不是 `sync` 标志；文档步骤使用内置默认值（`json-array`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `status [--max-columns <n>]`                                                | 当 `features.translateUIStrings` 开启时，按区域设置打印 UI 覆盖情况（`Translated` / `Missing` / `Total`）。然后按文件 × 区域设置打印 Markdown 翻译状态（无 `--locale` 过滤；区域设置来自配置）。较长的区域设置列表会被拆分为多个表格，每个表格最多包含 **`n`** 列区域设置（默认为 **9**），以确保终端中的行宽保持较窄。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                       | 首先运行 `sync --force-update`（提取、UI、SVG、文档），然后移除陈旧的段行（`last_hit_at` 为 null 或文件路径为空）；删除解析后源路径在磁盘上不存在的 `file_tracking` 行；移除其 `filepath` 元数据指向缺失文件的翻译行。记录三个计数（陈旧行、孤立的 `file_tracking`、孤立的翻译）。除非指定 `--no-backup`，否则在缓存目录下创建带时间戳的 SQLite 备份。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `editor [-p <port>] [--no-open]`                                            | 启动本地 Web 编辑器以编辑缓存、`strings.json` 和术语表 CSV。**`--no-open`：** 不自动打开默认浏览器。<br><br>**注意：** 如果在缓存编辑器中编辑了条目，必须运行 `sync --force-update` 以将更新后的缓存条目重写到输出文件中。此外，如果源文本之后发生变化，手动编辑的内容将丢失，因为会生成新的缓存键。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `glossary-generate [-o <path>]`                                             | 写入一个空的 `glossary-user.csv` 模板。`-o`：覆盖输出路径（默认：来自配置的 `glossary.userGlossary`，或 `glossary-user.csv`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

所有命令都接受 `-c <path>` 来指定非默认的配置文件，`-v` 用于输出详细信息，以及 `-w` / `--write-logs [path]` 将控制台输出同时写入日志文件（默认路径：位于根目录 `cacheDir` 下）。根程序还支持 `-V` / `--version` 和 `-h` / `--help`；`ai-i18n-tools help [command]` 显示与 `ai-i18n-tools <command> --help` 相同的每个命令用法。

---

## 环境变量

| 变量                | 说明                                                |
|-------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`    | **必需。** 您的 OpenRouter API 密钥。                     |
| `OPENROUTER_BASE_URL`   | 覆盖 API 基础 URL。                                 |
| `I18N_SOURCE_LOCALE`    | 在运行时覆盖 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`   | 用逗号分隔的区域设置代码，用于覆盖 `targetLocales`。  |
| `I18N_LOG_LEVEL`        | 日志记录器级别（`debug`、`info`、`warn`、`error`、`silent`）。 |
| `NO_COLOR`              | 当设置为 `1` 时，在日志输出中禁用 ANSI 颜色。              |
| `I18N_LOG_SESSION_MAX`  | 每个日志会话保留的最大行数（默认 `5000`）。           |
