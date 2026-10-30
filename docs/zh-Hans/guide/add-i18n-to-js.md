<a id="add-i18n-to-a-jsts-app"></a>
# 为 JS/TS 应用添加 i18n

本页面适用于其按钮、标签和消息仍为纯源语言文本的 JS/TS 应用（React、Next.js、Node 或 CLI）。`extract` 仅在 UI 字符串是 `t()` 或 `i18n.t()` 内的字符串字面量时才会记录它，因此目前目录将为空，并且 `translate-ui` 将没有任何内容可供翻译。

步骤如下：安装工具，安装 i18next，运行一次 `extract`，添加一个小型设置文件以确保 `t` 存在，包装面向用户的文本，然后进行翻译。不确定这是否适合您的情况？请参阅末尾的 [不适合您的情况？](#not-your-case)。

<a id="install-and-choose-a-provider"></a>
## 安装工具并设置密钥

安装 CLI（[安装](/zh-Hans/guide/installation)) 并为您的提供商设置 API 密钥（[提供商和 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key))。Ollama 不需要密钥。

<a id="initialise-the-project"></a>
## 初始化配置

```bash
ai-i18n-tools init -P openrouter
```

此操作会写入 `ai-i18n-tools.config.json`。目前有四个重要的键：

- `sourceLocale`：您的文本所用的语言。任何语言都有效。本指南中以英语为例。
- `targetLocales`：要添加的语言。
- `ui.sourceRoots`：`extract` 扫描的文件夹，例如 `src/`。
- `ui.stringsJson` 和 `ui.flatOutputDir`：目录和各区域设置文件的写入位置。

所有其他键都在 [配置](/zh-Hans/reference/configuration) 中。

<a id="run-the-agent-prompt"></a>
## 安装运行时库

ai-i18n-tools 不依赖于 `i18next` 或 `react-i18next`。应用需要自行安装它们。

- 每个在运行时查找字符串的 JS/TS 应用：`i18next`。
- 调用 `useTranslation()` 的 React 组件：也需要 `react-i18next`。

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="review-the-result"></a>
## 运行一次提取命令

```bash
ai-i18n-tools extract
```

下一步中的设置文件会导入 `strings.json` 和 `ui-languages.json`，并且只有 `extract` 会写入它们。即使找不到任何 `t()` 调用，它也会写入这两个文件，这样应用才能编译。预计会提取 0 个字符串，或者如果您的 `package.json` 中有 `description`，则会提取 1 个，因为提取器默认会包含它 (`ui.uiExtractor.includePackageDescription`)。

<a id="choose-models-and-translate"></a>
## 添加引导程序

创建 i18n 设置文件。这个最小化版本足以包装字符串并进行翻译。`ai-i18n-tools.config.json` 中的 `SOURCE_LOCALE` 必须等于 `sourceLocale`。

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

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

不使用 React？请移除 `react-i18next` 导入和 `.use(initReactI18next)` 调用。

当应用开始使用复数形式时，添加源区域设置的扁平文件，以便解析复数形式。这会增加第三个导入和一个 `sourcePluralFlatBundle` 选项，如 [连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime) 中所示。

在首次渲染之前，从应用入口导入此文件。在 Next.js 中，从客户端模块导入它，模式与 [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts) 相同。

<a id="check-one-language"></a>
## 替换硬编码的文本

手动执行此操作，或将 [JS/TS 提示](#run-the-agent-prompt) 粘贴到编码代理中。`t()` 的参数是用户应该看到的源语言句子。扁平化的区域设置文件以此句子为键。

<details class="agent-prompt" id="agent-prompt">
<summary>JS/TS 代理提示</summary>

将此内容复制到 Cursor 或其他编码代理中。它会包装面向用户的字面量，但不会翻译它们。

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The
literal is the source-language sentence and the catalog key (`t("Save")`, not
`t("saveButton")`). After this edit the app must behave the same when the active
locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference:
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees
(JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids,
enum and error codes, object keys used as identifiers, log field names, CSS,
regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses
`useTranslation()`. Run `ai-i18n-tools extract` once so `strings.json` and
`ui-languages.json` exist, then add the bootstrap from the Wire i18next guide.
`SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant
  that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call
  `changeLanguage` on a shared i18next instance inside a server component. Use a
  per-request `createInstance()`, or a stateless flat-bundle lookup.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

## Order

1. Install the libraries.
2. Run `ai-i18n-tools extract` once.
3. Add the bootstrap.
4. Wrap call sites.
5. Run `ai-i18n-tools extract` again. Do not run a translation yourself and do
   not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you
  wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original
  sentence. Switch one target locale after `translate-ui` and confirm those
  sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case you left for a human (the same word used with different
meanings, concatenated sentences, or a plural you were not sure about).
````

</details>

JSX：

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node、CLI 或任何非 React 模块：

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

规则（也适用于 [t() 调用和复数](/zh-Hans/guide/ui-strings/t-calls-and-plurals))：

- 键是字面量。`t(variable)` 和 <code>{'t(`Hello ${name}`)'}</code> 不会被提取，非字面量调用会被跳过且不发出警告。
- 字面量内的占位符使用 i18next 形式 <code v-pre>{{name}}</code>，并在第二个参数中传递。
- 复数：一个源语言句子加上 `{ plurals: true, count }`。请参阅[基数复数](/zh-Hans/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true)。不要自行创建 `_one` / `_other` 键。
- React 组件从 `useTranslation()` 获取 `t`。其他文件调用 `i18n.t`。在导入时求值的常量必须移入函数或 `useMemo(..., [t])` 中，以便 `t()` 在区域设置加载后运行。
- Next.js 服务器组件不得在共享的 i18next 实例上调用 `changeLanguage`。并发请求会共享该单例。请使用每个请求的 `createInstance()`，或对扁平化包进行无状态查找（请参阅 [Nextra 混合模式](/zh-Hans/guide/integrations/nextra#optional-t-for-app-react-hybrid))。

请勿改动以下内容：`className`、`href` 和其他 URL、导入路径、ID、测试 ID、错误代码、用作标识符的对象键以及注释内的文本。

<a id="keep-it-translated"></a>
## 提取和翻译

当字面量就位后：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

当 `features.translateUIStrings` 开启时，`sync` 会同时运行 `extract` 和 `translate-ui`。`extract` 现在应该会列出你包装的句子。打开 `ui.flatOutputDir` 下生成的一个区域设置文件，确认翻译已在其中。下一步：请参阅 [UI 字符串，第 2 步](/zh-Hans/guide/ui-strings/#step-2-extract-strings)，了解 `extract` 扫描和写入的内容。

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) 是一个小型 Node 应用，其 `src/main.js` 已被包装。Next.js 示例是 React 引导程序。

<a id="do-it-by-hand"></a>
## 语言切换

在首次渲染前恢复已保存的区域设置，如 [连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime#startup-locale) 中所述。然后添加一个控件，该控件先调用 `await loadLocale(code)`，再调用 `await i18n.changeLanguage(code)`：[语言切换器和 RTL](/zh-Hans/guide/ui-strings/language-switcher)。

<a id="step-1-install-the-runtime-libraries"></a>
## 保持翻译更新

更改源文本后，重新运行 `sync`。缓存意味着只有新的或更改的字符串会发送到模型。添加 [推荐的 package.json 脚本](/zh-Hans/guide/quick-start#recommended-packagejson-scripts) 中的脚本，并在 CI 中运行 `sync`，以确保翻译不会偏离。

默认的 `init` 模板也会翻译 `README.md`。请参阅[为你的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## 从其他工具迁移

ai-i18n-tools 包含其自己的字符串提取器。如果你使用过 `i18next-scanner`、`babel-plugin-i18next-extract` 或类似工具，可以在迁移后移除这些开发依赖项。现有的 i18next 命名空间 JSON 文件可以保留在 [JSON 管道](/zh-Hans/guide/json#i18next-namespace-files) 上。Intlayer `.content.ts` 词典可以使用 `migrate-intlayer` 导入：请参阅[从 Intlayer 迁移](/zh-Hans/guide/migrating-from-intlayer)。要在运行时保留 Intlayer 并仅填充其翻译，请使用 `translate-intlayer`：请参阅[就地翻译 Intlayer](/zh-Hans/guide/translating-intlayer)。

<a id="step-3-wrap-strings"></a>
## 不是您的情况？

| 您当前的代码 | 阅读 |
| --- | --- |
| 已在 `t("…")` 或 `i18n.t("…")` 中使用源语言句子 | [UI 字符串](/zh-Hans/guide/ui-strings/) 第 2-3 步，然后 [集成 i18next](/zh-Hans/guide/ui-strings/i18next-runtime) |
| i18next 命名空间 JSON（`t("saveButton")` 加上 `en/translation.json`） | [JSON](/zh-Hans/guide/json)。除非准备好更改每个调用，否则请勿将这些键切换为源语言句子 |
| Intlayer 字典，从 Intlayer 迁移 | [从 Intlayer 迁移](/zh-Hans/guide/migrating-from-intlayer) |
| Intlayer 字典，保留 Intlayer | [就地翻译 Intlayer](/zh-Hans/guide/translating-intlayer) |
| 单个 HTML 文件 | [纯 HTML](/zh-Hans/guide/ui-strings/plain-html) 和 `mark-html` |
| 文档网站或 Astro 页面 HTML | [向网站或文档网站添加 i18n](/zh-Hans/guide/add-i18n-to-website) 和 [Astro 网站](/zh-Hans/guide/ui-strings/astro-website)。`t()` 仅用于共享数据和 frontmatter |
| Python 应用 | [向 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python) |
| 一个仓库 README 或其他 Markdown 文件 | [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) |
