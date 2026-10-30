<a id="add-i18n-to-a-jsts-app"></a>
# 为 JS/TS 应用添加 i18n

本页面介绍如何使用 ai-i18n-tools 为仅支持单一语言的 JS/TS 应用（React、Next.js、Node 或 CLI）添加语言环境。它遵循一条路径：i18next、一个小型引导文件和翻译的 JSON 文件。`extract` 仅在 UI 字符串是 `t()` 或 `i18n.t()` 中的字符串字面量时才记录，因此纯源文本目录将为空。

最快的方法是将本页上的提示提供给编码代理。它会安装 i18next，添加引导程序，包装您的字符串，并可以添加语言切换功能。您需要自行安装 CLI、选择提供商并初始化项目，因为这需要您的 API 密钥和您的选择。您还需要自行运行翻译，因为它会花费您账户中的资金。

网站或文档站点使用[为网站或文档站点添加 i18n](/zh-Hans/guide/add-i18n-to-website)。Python 应用使用[为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)。不确定哪个适用？请参阅末尾的[不适用于您的情况？](#not-your-case)。

流程：

1. [安装 CLI 并选择提供商](#install-and-choose-a-provider)。
2. 使用 `init`[初始化项目](#initialise-the-project)。
3. [运行代理提示](#run-the-agent-prompt)。
4. [查看结果](#review-the-result)。
5. [选择模型并翻译](#choose-models-and-translate)，然后检查一种语言。
6. [保持翻译](#keep-it-translated)。

倾向于自行更改，或者想知道提示的作用？[手动操作](#do-it-by-hand) 会逐步完成相同的步骤。

<a id="install-and-choose-a-provider"></a>
## 安装并选择提供商

这部分由您完成，而不是代理。安装程序会更改您的机器，API 密钥是属于您 shell 的秘密，不应出现在提示中。

将软件包作为开发依赖项安装。引导程序导入 `ai-i18n-tools/runtime`，而全局 CLI 或独立可执行文件无法满足该导入。其他安装选项：[安装](/zh-Hans/guide/installation)。

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` 和 `yarn add --dev ai-i18n-tools` 也适用。以下示例使用裸 `ai-i18n-tools` 命令。本地安装需要在 `PATH` 上使用 `node_modules/.bin`，或者在每个命令前加上 `pnpm exec`。请参阅[使用 CLI](/zh-Hans/guide/installation#using-the-cli)。

检查安装：

```bash
ai-i18n-tools --version
```

然后选择一个提供商，并在将运行翻译的 shell 中设置其 API 密钥。例如，OpenRouter：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama 不需要密钥。其他预设：[内置提供商](/zh-Hans/guide/providers-and-models#built-in-providers)。记下提供商名称，因为您将在下一步将其传递给 `init`。代理从不需要密钥：它只运行不进行模型调用的命令。您稍后在[翻译](#choose-models-and-translate)时会使用该密钥。

<a id="initialise-the-project"></a>
## 初始化项目

您在提示之前运行此命令一次。它会写入配置并使用您上面选择的提供商。

```bash
ai-i18n-tools init -P openrouter
```

默认模板是 `ui-markdown`。它会写入 `ai-i18n-tools.config.json`，其中包含一个 UI 块和一个扁平的 README 块。四个关键项对应用很重要：

- `sourceLocale`：源中字符串的语言。任何 BCP-47 语言都有效；脚手架通常使用 `en-GB`。
- `targetLocales`：要添加的语言。
- `ui.sourceRoots`：`extract` 扫描的文件夹，例如 `src/`。
- `ui.stringsJson` 和 `ui.flatOutputDir`：目录和每个语言环境文件写入的位置。

`init` 不会安装 i18next，也不会添加引导程序。这是提示（手动操作，[步骤 1](#step-1-install-the-runtime-libraries) 和 [步骤 2](#step-2-extract-once-and-add-the-bootstrap))。

运行 `init` 一次。它每次都会重写 `ai-i18n-tools.config.json`，因此第二次运行会丢弃您所做的编辑。

相同的模板列出了用于文档翻译的 `README.md`。语言列表标记和 README 文件是[将 i18n 添加到您的 README 和 Markdown 文档](/zh-Hans/guide/add-i18n-to-readme)。此页面是 `t()` 路径。

所有其他键都在[配置](/zh-Hans/reference/configuration)中。调用形式：[t() 调用和复数](/zh-Hans/guide/ui-strings/t-calls-and-plurals)。引导参考：[连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime)。

<a id="run-the-agent-prompt"></a>
## 运行代理提示

在您的编码代理（Cursor、Claude Code、Copilot 或类似工具）中打开项目，开始新聊天，然后粘贴以下提示。项目必须已初始化。无需编辑。如果您想排除某些内容，例如不进行语言切换，请在同一消息中说明。

代理首先检查 CLI 和配置是否存在，如果缺少其中一个，则停止并提供说明。然后它分为三个部分工作：

- 第 1 部分安装 i18next，运行一次 `extract`，并添加引导。
- 第 2 部分将面向用户的字符串包装在 `t()` 或 `i18n.t()` 中。
- 第 3 部分添加语言切换，或 CLI 语言选项。

它不安装 CLI、不初始化配置、不读取您的 API 密钥，也不进行翻译。翻译是审查之后的步骤，由您运行。

````markdown
# Add languages to this JS/TS app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists with a `ui` block. If either is missing,
stop now and tell the user to install ai-i18n-tools as a dev dependency and
run `ai-i18n-tools init -P <provider>`, then run this prompt again. Do not
install the CLI or initialise the config yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`).
- Do not introduce semantic keys (`saveButton`, `nav.home`). The literal in
  `t("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Runtime

Skip a piece of this part when it is already done.

1. Install `i18next` with the project's package manager. Install
   `react-i18next` only when a component uses `useTranslation()`.
2. Run `ai-i18n-tools extract` once. It writes `strings.json` and
   `ui-languages.json` even when it finds no `t()` calls, so the app compiles.
   Expect 0 strings, or 1 when `package.json` has a `description`
   (`ui.uiExtractor.includePackageDescription` is on by default).
3. Add the bootstrap below. Put it where this repository keeps its app code,
   and point the JSON imports at `ui.stringsJson`, `ui.flatOutputDir`, and
   `languagesManifestPath` when that key is set. `SOURCE_LOCALE` must equal
   config `sourceLocale`, character for character. The sample uses `en-GB`
   only as the shape.
4. Import the bootstrap from the app entry before the first render. In
   Next.js, import it from a client module. Do not call `changeLanguage` on a
   shared i18next instance inside a server component. Concurrent requests
   share that singleton. Use a per-request `createInstance()`, or a stateless
   lookup of the flat bundle.

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

```js
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

For JSON under `public/`, the loader fetches `/locales/<code>.json` and
parses the response. For a Node CLI with no bundler, read the file with
`readFileSync` inside that function. A call that uses `{ plurals: true, count }`
also needs the
source-locale flat file under `flatOutputDir`. That file does not exist until
the user runs `translate-ui`, so leave `sourcePluralFlatBundle` out and name
the plural calls in the report.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

Read `ui.sourceRoots` and edit only those trees (JS, JSX, TS, TSX). Leave
`className`, URLs and routes, import paths, ids, test ids, enum and error
codes, object keys used as identifiers, log field names, CSS, regexes, and
comments.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. A constant that
  would call `t()` at import time must move into a function or
  `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Placeholders: `t("Hello {{name}}", { name })`. The argument must be a string
  literal. `t(variable)` and a template literal as the key are not extracted.
- Plurals: `t("{{count}} items", { plurals: true, count })`. Do not invent
  `_one` / `_other` keys.
- One `t()` per sentence. Split only where the text already branches.

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

Work in passes: list string literals that are not passed to `t` or `i18n.t`,
wrap the user-facing ones, then list again. Treat any bulk rewrite as a draft
and review its diff. Then run `ai-i18n-tools extract` again.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A command-line program still gets
this part: a language option, not a widget.

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Accept only codes listed in `ui-languages.json`.

- Restore a saved locale before the first render, then draw a control labelled
  `t("Language")` whose options come from that manifest. On change, call
  `await loadLocale(code)` and then `await i18n.changeLanguage(code)`.
- In Next.js, reading `localStorage` in an effect after hydration paints the
  source locale first. Prefer a cookie the server can read, or load the saved
  locale in the client module before the first client render. Do not call
  `changeLanguage` on a shared instance inside a server component.
- A CLI: add `--lang <code>` and `-L <code>` unless those names are taken.
  Read the option before help text is built, so help can be translated too.
  After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`. Then the source locale.

## Verify and report

The project's build, type check, and tests pass. `extract` writes a non-empty
catalog of the sentences you wrapped. With the source locale, the output is
unchanged.

Report the files changed, each string you skipped with a one-line reason, the
same word used with different meanings, sentences built from translated pieces,
plurals that still need `sourcePluralFlatBundle` after the user translates,
and any `t()` that runs at import time. Then list the commands for the user,
and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then reload the app.
````

<a id="review-the-result"></a>
## 审查结果

代理结束时会生成一份报告。在翻译之前检查它：

- 差异。包装的文本应与之前相同，没有不相关的重新格式化。`git diff --stat` 显示了更改量。引导、其导入、包装的调用和语言切换是预期的编辑。
- 生成的目录（`strings.json`、每个语言环境的 JSON、`ui-languages.json`）除了 `extract` 写入的内容外，未被触及。
- `ai-i18n-tools extract` 运行正常，并且 `strings.json` 列出了您期望的句子。
- 您的测试通过，并且应用程序在源语言中看起来相同。
- 报告中跳过的字符串和歧义情况：一个词有不同的含义、由片段构建的句子以及复数。手动决定这些。
- 引导中的 `SOURCE_LOCALE` 等于配置中的 `sourceLocale`。

代理遗漏的字符串稍后会显示为保留在源语言中的文本。

<a id="choose-models-and-translate"></a>
## 选择模型并翻译

您运行此部分。它使用您的 API 密钥并在您的账户上花费资金。

`init` 提供的模型列表是一个起点。对当前活跃提供商的聊天模型进行排序，当候选列表确认无误后，将其写入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 仅替换 `translationModels`。相同的排名位于 `ai-i18n-tools dashboard` 的[模型](/zh-Hans/guide/translation-dashboard/models)选项卡上。

然后提取并翻译：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` 写入 `strings.json` 和 `ui-languages.json`。`translate-ui` 在 `ui.flatOutputDir` 下为每种目标语言写入一个 JSON 文件。请勿编辑这些生成的文件。当 `features.translateUIStrings` 开启时，`sync` 会同时运行 `extract` 和 `translate-ui`。`extract` 扫描和写入的内容：[UI 字符串，步骤 2](/zh-Hans/guide/ui-strings/#step-2-extract-strings)。

`t()` 在语言环境 JSON 中查找源句子。`strings.json` 中的 ID 不是查找键。缺少文件或缺少键会返回源句子。

<a id="check-one-language"></a>
### 检查一种语言

重新加载应用程序，切换到一种目标语言，然后打开一个包含一些包装字符串的屏幕。使用代理添加的语言切换，或自行调用 `loadLocale` 和 `changeLanguage`。仍然是源语言的文本未被包装、在导入时运行，或在语言环境 JSON 中没有条目。在怀疑代码之前，请检查 JSON 中的句子。

当包装的调用使用 `{ plurals: true, count }` 时，添加源语言环境平面文件，以便复数形式得以解析。这会从 `flatOutputDir` 添加 `{sourceLocale}.json` 的导入和一个 `sourcePluralFlatBundle` 选项，如[连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime)中所示。

<a id="keep-it-translated"></a>
## 保持翻译更新

更改源文本后，重新运行 `ai-i18n-tools sync`（或先运行 `extract`，再运行 `translate-ui`）。缓存意味着只有新增或更改的字符串才会发送到模型。从[推荐的 package.json 脚本](/zh-Hans/guide/quick-start#recommended-packagejson-scripts)添加脚本，并在 CI 中运行 `sync`，以避免翻译偏离。翻译运行后重新加载应用程序，以便它获取新的 JSON。`ai-i18n-tools dashboard` 会打开[翻译仪表板](/zh-Hans/guide/translation-dashboard/)以供审阅翻译。

默认的 `init` 模板也列出了 `README.md`。在 `sync` 翻译之前粘贴语言列表标记。请参阅[将 i18n 添加到您的 README 和 Markdown 文档](/zh-Hans/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手动操作

如果您更喜欢自己进行更改，或者想了解提示的作用，请按照这些步骤操作。这些步骤与提示的各个部分相对应。最后，您仍然需要[安装 CLI](#install-and-choose-a-provider)、[初始化项目](#initialise-the-project)和[翻译](#choose-models-and-translate)。

1. [安装运行时库](#step-1-install-the-runtime-libraries)。
2. [一次性提取并添加引导程序](#step-2-extract-once-and-add-the-bootstrap)。
3. 使用 `t()` 或 `i18n.t()`[包装字符串](#step-3-wrap-strings)。
4. [添加语言切换器](#step-4-add-a-language-switch)。

<a id="step-1-install-the-runtime-libraries"></a>
## 步骤 1：安装运行时库

ai-i18n-tools 不依赖于 `i18next` 或 `react-i18next`。应用需要自行安装它们。

- 每个在运行时查找字符串的 JS/TS 应用：`i18next`。
- 调用 `useTranslation()` 的 React 组件：也需要 `react-i18next`。

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## 步骤 2：一次性提取并添加引导程序

引导程序导入 `strings.json` 和 `ui-languages.json`，并且只有 `extract` 会写入它们。即使没有找到 `t()` 调用，它也会写入两者，以便应用程序能够编译。

```bash
ai-i18n-tools extract
```

预计有 0 个字符串，如果您的 `package.json` 包含 `description`，则为 1 个，因为提取器默认会包含它 (`ui.uiExtractor.includePackageDescription`)。

创建 i18n 设置文件。此版本足以包装字符串并进行翻译。在 `ai-i18n-tools.config.json` 中，`SOURCE_LOCALE` 必须等于 `sourceLocale`。调整导入路径，使其与 `ui.stringsJson` 和 `ui.flatOutputDir` 匹配。

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

对于 `public/` 下的 JSON 捆绑包，加载器会获取 `/locales/${code}.json`。对于没有捆绑器的 Node CLI，请使用 `readFileSync` 读取文件。两种形式都可以在[区域设置加载器](/zh-Hans/guide/ui-strings/i18next-runtime#locale-loaders)中找到。

在首次渲染之前，从应用入口导入此文件。在 Next.js 中，从客户端模块导入它，模式与 [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts) 相同。

<a id="step-3-wrap-strings"></a>
## 步骤 3：包装字符串

`t()` 的参数是用户应该看到的源语言句子。平面区域设置文件以该句子作为键。

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

再次运行 `ai-i18n-tools extract`。目录现在应该列出您包装的句子。

<a id="step-4-add-a-language-switch"></a>
## 步骤 4：添加语言切换器

在首次渲染之前恢复已保存的区域设置，如[连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime#startup-locale)中所述。然后添加一个先调用 `await loadLocale(code)` 后调用 `await i18n.changeLanguage(code)` 的控件。从 `ui-languages.json` 构建选项。小部件、标签和从右到左的布局：[语言切换器和 RTL](/zh-Hans/guide/ui-strings/language-switcher)。

命令行程序没有小部件。添加 `--lang <code>`（如果该名称可用，则添加 `-L`），然后添加应用程序已拥有的语言环境变量。不要读取 `AI_I18N_LANG`；该变量仅用于 ai-i18n-tools CLI。仅接受 `ui-languages.json` 中列出的代码。

如果程序不显示供人阅读的文本，请跳过此步骤。

这是最后一个手动步骤。继续阅读[选择模型并翻译](#choose-models-and-translate)。

<a id="coming-from-another-tool"></a>
## 从其他工具迁移

ai-i18n-tools 包含其自己的字符串提取器。如果你使用过 `i18next-scanner`、`babel-plugin-i18next-extract` 或类似工具，可以在迁移后移除这些开发依赖项。现有的 i18next 命名空间 JSON 文件可以保留在 [JSON 管道](/zh-Hans/guide/json#i18next-namespace-files) 上。Intlayer `.content.ts` 词典可以使用 `migrate-intlayer` 导入：请参阅[从 Intlayer 迁移](/zh-Hans/guide/migrating-from-intlayer)。要在运行时保留 Intlayer 并仅填充其翻译，请使用 `translate-intlayer`：请参阅[就地翻译 Intlayer](/zh-Hans/guide/translating-intlayer)。

<a id="not-your-case"></a>
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
| Django、Flask-Babel 目录，或已使用 GNU gettext 的应用程序 | [将 i18n 添加到 Django / Python gettext 应用程序](/zh-Hans/guide/add-i18n-to-django-gettext) |
| 一个仓库 README 或其他 Markdown 文件 | [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 示例

| 示例 | 说明 |
| --- | --- |
| [console-app](/zh-Hans/examples#console-app) | 最小的 Node 应用，`t()` 已封装，并包含一个 README 块 |
| [nextjs-app](/zh-Hans/examples#nextjs-app) | React 引导程序、复数形式、一个文档站点，并包含一个 README 块 |

使用 `npx degit` 复制一个。命令：[示例](/zh-Hans/examples#nodejs-examples)。
