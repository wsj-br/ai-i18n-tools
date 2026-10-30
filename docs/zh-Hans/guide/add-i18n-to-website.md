<a id="add-i18n-to-a-website-or-docs-site"></a>
# 为网站或文档站点添加 i18n

本页面介绍如何将单一语言的文档网站（Markdown 或 MDX）或营销/静态网站（Astro 网站或纯 HTML）添加区域设置，使用 ai-i18n-tools 工具。该工具使用您的 LLM 提供商的模型翻译页面内容，并为每种语言写入一个本地化副本。您的网站框架将提供这些副本并提供语言切换器。

最快的方法是将本页上的提示提供给编码代理。它会启用该框架的国际化 (i18n) 并检查配置。您需要自行安装 CLI、选择提供商并初始化项目，因为这需要您的 API 密钥和您的选择。您还需要自行运行翻译，因为它会产生您的账户费用。

对于 UI 字符串位于 `t()` 调用的应用，请使用[为 JS/TS 应用添加国际化 (i18n)](/zh-Hans/guide/add-i18n-to-js) 或[为 Python 应用添加国际化 (i18n)](/zh-Hans/guide/add-i18n-to-python)。没有网站框架的仓库 README 使用[为您的 README 和 Markdown 文档添加国际化 (i18n)](/zh-Hans/guide/add-i18n-to-readme)。不确定哪个适用？请参阅末尾的[不属于您的情况？](#not-your-case)。

<a id="steps"></a>

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

将软件包作为开发依赖项安装。VitePress 配置从 `ai-i18n-tools` 导入 `prefixVitepressThemeConfigLinks`，纯 HTML 页面从软件包复制 `i18n.js`。仅当网站从不导入 `ai-i18n-tools/runtime` 且从不从其配置导入软件包时，独立可执行文件才足够。其他安装选项：[安装](/zh-Hans/guide/installation)。

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

您在提示之前运行此命令一次。它会写入 `ai-i18n-tools.config.json` 并使用您上面选择的提供商。它不会在现有网站中开启国际化 (i18n)。那是提示的作用。

| 您的网站 | 初始化模板 | 详细指南 |
| --- | --- | --- |
| Astro Starlight | `ui-starlight` | [Astro](/zh-Hans/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/zh-Hans/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/zh-Hans/guide/integrations/vitepress) |
| Nextra 4（Next.js App Router）| `ui-nextra` | [Nextra](/zh-Hans/guide/integrations/nextra) |
| Fumadocs 4（Next.js App Router）| `ui-fumadocs` | [Fumadocs](/zh-Hans/guide/integrations/fumadocs) |
| 纯 Astro 网站 | `ui-astro-website` | [Astro](/zh-Hans/guide/integrations/astro#plain-astro-marketing-and-app-sites) |
| 在浏览器中切换语言的单个 HTML 文件 | `ui-plain-html` | [纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html) |
| 每个区域设置一个翻译的 HTML 文件 | `docs-plain-html` | [HTML 页面](/zh-Hans/guide/documents/html-pages) |
| 没有站点框架，只有 README 和 Markdown 文件 | `docs-markdown`，或任何模板加上 `--with-readme` | [为你的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

将 `ui-vitepress` 替换为表格中的模板。然后编辑 `sourceLocale`、`targetLocales` 和 `docs[].contentPaths`。`sourceLocale` 是页面的语言。任何 BCP-47 语言都有效。`contentPaths` 必须是使用该语言编写的页面和文件夹。模板中的路径是起始路径。`docsOutput.style` 已为模板设置。`ui-astro-website` 和 `ui-plain-html` 写入一个 `ui` 块和一个空的 `docs` 数组。当您翻译页面 HTML 时，提示会为纯 Astro 网站添加一个页面 HTML `docs` 块。

运行 `init` 一次。它每次都会重写 `ai-i18n-tools.config.json`，因此第二次运行会丢弃您所做的编辑。

<a id="run-the-agent-prompt"></a>
## 运行代理提示

在您的编码代理（Cursor、Claude Code、Copilot 或类似工具）中打开项目，开始新聊天，然后粘贴下面的提示。项目必须已初始化。无需编辑任何内容。如果您希望省略某个框架细节，请在同一消息中说明。

代理首先检查 CLI 和配置是否存在，如果缺少其中一个，则会停止并提供说明。然后它会检测框架并启用该框架的区域设置路由。它不会安装 CLI、初始化配置、读取您的 API 密钥或进行翻译。翻译是审查后的步骤，由您运行。

````markdown
# Enable i18n on this website or docs site

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user to install ai-i18n-tools as a dev dependency and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-vitepress`, `ui-docusaurus`, `ui-starlight`, `ui-nextra`,
`ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, or `docs-plain-html`.
Do not install or initialise anything yourself.

`ui-plain-html` and `ui-astro-website` are valid when `docs` is empty. Every
other template needs one `docs` entry. If that entry is missing, stop and name
the init command.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, reword, or rename source pages, nav labels, or dictionary
  strings. Do not edit generated locale trees (`docs/<locale>/`,
  `i18n/<locale>/` other than the source catalog from `write-translations`,
  `theme.<locale>.json`, `content/<locale>/`, locale MDX, or locale HTML).
- Do not reformat unrelated code. Leave unrelated edits in a dirty tree alone.
- Apply one branch. If the framework is unclear, stop and ask.

Detect the branch from `docsOutput.style`, then from the config file and
`package.json`: `vitepress`, `docusaurus`, `nextra`, `fumadocs`,
`astro-starlight` with pages under `src/content/docs` (Starlight), `nested`
with HTML `contentPaths` (`docs-plain-html`), a `ui` block whose extractor
extensions include `.html` (`ui-plain-html`), or an Astro site that is not
Starlight (`ui-astro-website`).

Point `contentPaths` and `docsRoot` at the source-language pages that exist
in this repository. The paths written by `init` are starters.

## VitePress

- In `.vitepress/config`, set `locales.root` for the source locale (`label`,
  `lang`, and the existing `themeConfig`). Add one `locales[code]` per
  `targetLocales` entry: `label`, `lang`, `link: '/<code>/'`, and per-locale
  `title` / `description`. Keep `targetLocales` equal to those keys.
- Author nav and sidebar links once, without a locale prefix. Prefix `link`
  and `activeMatch` per locale with `prefixVitepressThemeConfigLinks` from
  `ai-i18n-tools`. `translate-docs` does not rewrite links inside the config.
- Leave `docsOutput.vitepressThemeCatalog` as `init` wrote it. If the config
  already loads `theme.en.json`, keep that loader and add `locales[code]` the
  same way. If theme strings are still inline, leave them inline. Do not
  create `theme.en.json` or `theme.<locale>.json` yourself, and do not load a
  theme file that is not on disk. The first `sync` bootstraps a missing
  catalog.
- `docsOutput.style` is `vitepress`. `outputDir` is the docs root.

## Docusaurus

- Add the `i18n` block in `docusaurus.config.js`: `defaultLocale`, `locales`
  (source plus each target), and `localeConfigs[locale].path` when the URL
  path differs from the locale code. The path must match the folder under
  `i18n/`.
- Point `docusaurusCatalogDir` at `i18n/<defaultLocale>`. `docsOutput.style`
  is `docusaurus`. `contentPaths` and `docsRoot` are the source docs folder.
  `outputDir` is the parent of the locale folders.
- Run this project's `docusaurus write-translations` so
  `i18n/<defaultLocale>/` exists. That command does not call a model. Do not
  run `sync` or `translate-docs`.
- Custom React in `src/pages` and `src/components` is not markdown. Mark
  user-facing copy with `<Translate>` or `translate()` from
  `@docusaurus/Translate`. The message has to be a static string. Do not wrap
  those calls in `t()`.

## Nextra

- Move source MDX to `content/<sourceLocale>/` (usually `content/en/`). The
  source locale is a folder, not the content root. Leave `_meta.ts` beside
  the pages it labels.
- Set `i18n.locales` and `defaultLocale` in `next.config`. `targetLocales`
  matches `i18n.locales` except the default locale.
- Add an `app/[lang]/` route, `getPageMap('/' + lang)`, and `<Layout i18n>`.
- Add `app/_dictionaries/<source>.ts` (usually `en.ts`) with the English
  shell strings as string literals (`siteTitle`, footer, `editLink`, search
  placeholder, table-of-contents title, last-updated label), and
  `get-dictionary.ts` that imports `./${locale}`. Pass those fields into
  `<Layout>`, `<Navbar>`, and `<Footer>`. Keep native language names in a
  labels map, untranslated.
- Config: `features.translateDocs`, `docsOutput.style` `nextra`, `docsRoot`
  `content/<sourceLocale>`, `nextraDictionaryPath` the source dictionary.
- Optional: `proxy.ts` that re-exports `nextra/locales`.
- Do not write `app/_dictionaries/pt-BR.ts`, `content/pt-BR/`, or any other
  locale tree.

## Fumadocs

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and
  `parser: "dot"` or `"dir"`. Use `"dot"` unless the source pages already live
  under a locale folder. Set `docsOutput.fumadocsParser` to the same value.
- Add `app/[lang]/` routes. Export `createI18nMiddleware(i18n)` from
  `proxy.ts`.
- Dot: source MDX stays at the collection root (`content/docs/`). Dir: source
  MDX lives under `content/docs/<sourceLocale>/`. Point `contentPaths` and
  `docsRoot` at that source tree. `docsOutput.style` is `fumadocs`.
- `targetLocales` equals `languages` minus the default language, character
  for character.
- Leave English UI overrides as they are. Do not write `ui.<locale>.json` or
  translated MDX. Do not put this catalog in `json[]`.

## Astro Starlight

- In the Starlight config, set `locales`, including a `root` entry when the
  source language should be unprefixed (`label` and required `lang`). Set
  `defaultLocale: 'root'` when that root entry is the source language.
- Source pages stay in `src/content/docs/`. `translate-docs` writes
  `src/content/docs/<locale>/`. Point `contentPaths` at the source pages, not
  at locale folders. `outputDir` and `docsRoot` are `src/content/docs`.
  `docsOutput.style` is `astro-starlight`.
- Align `targetLocales` with the non-root locale keys. Starlight directory
  keys are often lowercase (`pt-br`). If you change case to match, say so in
  the report.
- Prefer sidebar `slug` entries so the label comes from the page title. Do
  not hand-translate sidebar `label` maps or `social[].label`. There is no
  shell catalog to add.

## Plain Astro

- Enable Astro i18n routing: `i18n.locales` includes the source locale and
  each target. Astro route codes are lowercase (`pt-br`). In the report, list
  `targetLocales`, `i18n.locales`, and the note that flat JSON filenames use
  the casing in `targetLocales`.
- `init -t ui-astro-website` leaves `docs` empty and turns on UI strings. When
  page HTML should be translated, set `features.translateDocs` to true and
  append one `docs` entry: `contentPaths` the source pages (for example
  `src/pages/index.astro`), `outputDir` `src/pages`, `addFrontmatter` false,
  `docsOutput.style` `astro-starlight`, `docsRoot` `src/pages`. Leave
  `features.translateUIStrings` as it is.
- If frontmatter or shared data calls `t()`, stop that part and tell the user
  to run the JS/TS prompt and skip i18next. Astro resolves `t` at build time.
  Do not wrap those calls here, and do not install i18next.

## Plain HTML

Each file belongs to only one pipeline. If the same file is both a `docs[]` source and
under `ui.sourceRoots`, stop and ask.

`ui-plain-html` (one page, language switches in the browser):

- Run `ai-i18n-tools mark-html` with no `--write`, read the report, then
  run it again with `--write`. It inserts `data-i18n` markers. It does not
  call a model.
- Copy `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` next to the page.
  Load it at the end of `<body>` with `data-source-locale` equal to
  `sourceLocale`, `data-locales-base` pointing at `flatOutputDir` as a URL
  relative to the script, and `data-locale-select` pointing at an empty
  `<select>`. Do not add a `docs` block for the same file.

`docs-plain-html` (one HTML file per locale):

- Confirm `contentPaths`, `outputDir`, and `docsRoot`. `docsOutput.style` is
  `nested`. Do not add `data-i18n` markers. Do not fill a language list by
  hand. `translate-docs` writes the locale files and the list.

## Verify and report

The framework's locale config matches `targetLocales`. `contentPaths` point
at source-language pages. No generated locale tree was edited. Run the
project's build or typecheck when it has one, and do not run a translation.

Report the branch you applied, the files changed, and any page you left out
of `contentPaths`, with a one-line reason. Then list the commands for the
user, and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools sync`, then build the site and open one localised route.
````

<a id="review-the-result"></a>
## 审查结果

代理结束时会生成一份报告。在翻译之前检查它：

- 差异。它应该是框架区域设置配置、`contentPaths` 以及分支描述的路由。源页面内容应与之前保持一致。`git diff --stat` 显示了更改量。
- `targetLocales` 与框架将提供的区域设置键匹配。
- `contentPaths` 指向源语言页面，而不是工具应该写入的区域设置文件夹。
- 未编辑生成的区域设置树：`docs/<locale>/`、区域设置 HTML、`content/<locale>/`、`theme.<locale>.json` 或除 `write-translations` 中的源目录之外的 Docusaurus `i18n/<locale>/` 文件夹。
- 项目的构建或类型检查仍然通过。

<a id="choose-models-and-translate"></a>
## 选择模型并翻译

您运行此部分。它使用您的 API 密钥并在您的账户上花费资金。

`init` 提供的模型列表是一个起点。对当前活跃提供商的聊天模型进行排序，当候选列表确认无误后，将其写入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 仅替换 `translationModels`。相同的排名位于 `ai-i18n-tools dashboard` 的[模型](/zh-Hans/guide/translation-dashboard/models)选项卡上。

然后翻译并构建：

```bash
ai-i18n-tools sync
```

当 `features.translateDocs` 开启时，`sync` 运行 `translate-docs`；当 UI 字符串开启时（`ui-plain-html`，以及也使用 `t()` 的纯 Astro 网站），则运行 `extract` 加 `translate-ui`。`ai-i18n-tools translate-docs` 独立运行文档步骤。

<a id="what-gets-translated"></a>
### 翻译内容

页面主体通过[文档](/zh-Hans/guide/documents/)管道。框架外壳字符串（导航、侧边栏、主题标签）在框架支持的情况下，会在同一运行中处理。这与独立的[JSON](/zh-Hans/guide/json)管道不同。在浏览器中切换语言的普通 HTML 页面是个例外：`mark-html` 和 `translate-ui` 写入扁平 JSON，然后浏览器脚本会应用它。每个语言环境一个 HTML 文件仍保留在文档管道中。

| 框架 | 外壳和主题字符串 | 方式 |
| --- | --- | --- |
| Docusaurus | `write-translations` 目录 (`{ message, description }`) | `docs[].docusaurusCatalogDir` 加上 `translate-docs` |
| VitePress | 主题、导航和侧边栏目录 | `docsOutput.vitepressThemeCatalog` 加上 `translate-docs` |
| Nextra | `_meta.ts` 侧边栏标签 | 通过 `style: "nextra"` 自动完成 |
| Nextra | 主题字典 `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json` 侧边栏标签 | 通过 `style: "fumadocs"` 自动完成 |
| Fumadocs | UI 覆盖目录 | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | 内置多区域设置的 UI 字符串 | 仅页面 |

`translate-docs` 不会翻译图片和屏幕截图。有关特定于区域设置的文件，请参阅[图片和屏幕截图](/zh-Hans/guide/images-and-screenshots/)。

在第一次 `sync` 之后，少数框架仍然需要配置来加载命令刚刚写入的目录。这些提示保留在集成页面上：[VitePress 主题目录](/zh-Hans/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)、[Nextra 字典](/zh-Hans/guide/integrations/nextra#agent-prompt-dictionary-and-routes) 和 [Fumadocs UI 目录](/zh-Hans/guide/integrations/fumadocs#agent-prompt)。

<a id="check-one-language"></a>
### 检查一种语言

构建站点并在浏览器中打开一个本地化路由。框架自己的语言环境下拉菜单是切换器。对于在浏览器中切换的单个 HTML 文件，请使用运行时填充的选择器。对于每个语言环境一个 HTML 文件，请打开语言环境文件夹下的文件。

仍然是源语言的文本未包含在 `contentPaths` 中，是代码块、URL 或标题锚点，或者路由未连接。仍然是源语言的 VitePress 导航标签是主题目录：首先运行 `sync`，如果字符串仍以内联方式存在于配置中，则运行 [主题目录提示](/zh-Hans/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)。

<a id="keep-it-translated"></a>
## 保持翻译更新

源页面更改后重新运行 `ai-i18n-tools sync`。缓存意味着只有新增或更改的文本才会发送到模型。提交管道写入的语言环境树。`ai-i18n-tools dashboard` 打开 [翻译仪表板](/zh-Hans/guide/translation-dashboard/) 以审阅翻译。

要在同一次运行中翻译 `README.md`，请使用 `--with-readme` 搭建脚手架（或将该块添加到现有配置中）。请参阅 [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。

<a id="do-it-by-hand"></a>
## 手动操作

如果您更喜欢自己进行更改，或者您想了解提示的作用，请按照这些步骤操作。最后，您仍然需要 [安装 CLI](#install-and-choose-a-provider)、[初始化项目](#initialise-the-project) 和 [翻译](#choose-models-and-translate)。

1. 将 `contentPaths` 和 `docsRoot` 指向源语言页面。模板路径是起点。
2. 启用框架的语言环境路由。使用与模板匹配的分支。集成页面包含完整参考。

框架从目录中读取的 Shell 字符串在第一次 `sync` 之后连接。下面每个分支都链接了后续操作。

<a id="vitepress"></a>
### VitePress

添加 `locales.root` 和每个目标一个 `locales[code]`，并使用 `prefixVitepressThemeConfigLinks` 作为导航和侧边栏链接的前缀。将内联主题字符串留给第一个 `sync`。清单：[在现有站点中启用 i18n](/zh-Hans/guide/integrations/vitepress#enable-i18n-in-an-existing-site)。在 `sync` 写入 `theme.<locale>.json` 之后，如果配置中仍以内联方式包含字符串，则粘贴 [主题目录提示](/zh-Hans/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)。

<a id="docusaurus"></a>
### Docusaurus

添加 `i18n` 块，将 `docusaurusCatalogDir` 指向源目录，并运行 `docusaurus write-translations`。清单：[在现有站点中启用 i18n](/zh-Hans/guide/integrations/docusaurus#enable-i18n-in-an-existing-site)。Shell JSON：[Shell 字符串](/zh-Hans/guide/integrations/docusaurus#shell-strings-write-translations)。

<a id="nextra"></a>
### Nextra

将 MDX 移至 `content/<sourceLocale>/` 下，添加 `app/[lang]/`，并添加源字典模块。清单：[在现有站点中启用 i18n](/zh-Hans/guide/integrations/nextra#enable-i18n-in-an-existing-site)。[字典提示](/zh-Hans/guide/integrations/nextra#agent-prompt-dictionary-and-routes) 是相同连接的更长过程。需要 `t()` 的 App React：[混合提示](/zh-Hans/guide/integrations/nextra#optional-t-for-app-react-hybrid)。

<a id="fumadocs"></a>
### Fumadocs

添加 `defineI18n`、`app/[lang]/` 和中间件。将 `fumadocsParser` 与 `dot` 或 `dir` 匹配。清单：[在现有站点中启用 i18n](/zh-Hans/guide/integrations/fumadocs#enable-i18n-in-an-existing-site)。[UI 目录提示](/zh-Hans/guide/integrations/fumadocs#agent-prompt) 在路由存在后连接 `i18n.translations()`。

<a id="astro-starlight"></a>
### Astro Starlight

添加 `locales`，当源语言未加前缀时，包括 `root`。页面保留在 `src/content/docs/` 中。清单：[在现有站点中启用 i18n](/zh-Hans/guide/integrations/astro#enable-i18n-in-an-existing-site)。Starlight 附带自己的 UI 字符串。优先使用 `slug` 侧边栏条目。

<a id="plain-astro"></a>
### Plain Astro

开启 Astro 的 `i18n.locales`，并且，当页面 HTML 需要翻译时，添加 [Plain Astro](/zh-Hans/guide/integrations/astro#plain-astro-marketing-and-app-sites) 中的 `docs` 块。Frontmatter `t()` 调用使用 [JS/TS 提示](/zh-Hans/guide/add-i18n-to-js#run-the-agent-prompt) 而无需安装 i18next。Astro 在构建时解析 `t`。

<a id="plain-html"></a>
### 纯 HTML

有两种选项，文件属于其中之一：

- 一个在浏览器中切换语言的页面：`ui-plain-html`。运行 `ai-i18n-tools mark-html`（空运行，然后 `--write`）并加载 `i18n.js`。请参阅[纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html)。
- 每个区域设置一个翻译后的 HTML 文件：`docs-plain-html`。请参阅[HTML 页面](/zh-Hans/guide/documents/html-pages)。

这是最后一个手动步骤。继续阅读[选择模型并翻译](#choose-models-and-translate)。

<a id="not-your-case"></a>
## 不是您的情况？

| 您有 | 阅读 |
| --- | --- |
| 应用 UI 字符串 | [为 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) 或 [为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python) |
| Django、Flask-Babel 目录，或已使用 GNU gettext 的应用程序 | [将 i18n 添加到 Django / Python gettext 应用程序](/zh-Hans/guide/add-i18n-to-django-gettext) |
| 站点旁边的仓库 README，或 Markdown 文件且无站点框架 | [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme)。`init … --with-readme` 在站点模板旁边添加该块 |
| 独立的嵌套区域设置 JSON | [JSON](/zh-Hans/guide/json) |
| 一个配置中的站点和应用字符串 | [组合管道](/zh-Hans/guide/combining-pipelines) |

有关共享选项和各框架差异的参考：[集成](/zh-Hans/guide/integrations/)。

<a id="examples"></a>
## 示例

| 示例 | 显示内容 |
| --- | --- |
| [vitepress-docs](/zh-Hans/examples#vitepress-docs) | VitePress 页面和主题目录 |
| [docusaurus-docs](/zh-Hans/examples#docusaurus-docs) | Docusaurus 页面和 shell JSON |
| [astro-docs](/zh-Hans/examples#astro-docs) | Starlight 页面 |
| [nextra-docs](/zh-Hans/examples#nextra-docs) | Nextra 4 路由和字典 |
| [fumadocs-docs](/zh-Hans/examples#fumadocs-docs) | Fumadocs 路由和 UI 目录 |
| [astro-website](/zh-Hans/examples#astro-website) | Astro 登录页面，HTML 加 `t()` |
| [plain-html](/zh-Hans/examples#plain-html) | 一个 HTML 文件，`data-i18n` 标记 |
| [plain-html-docs](/zh-Hans/examples#plain-html-docs) | 每个区域设置一个 HTML 文件 |

使用 `npx degit` 复制一个。命令：[示例](/zh-Hans/examples#nodejs-examples)。
