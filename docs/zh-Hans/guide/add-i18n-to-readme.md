<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# 为你的 README 和 Markdown 文档添加 i18n

本页面处理 GitHub、GitLab、Bitbucket 或任何其他托管平台上的仓库，这些仓库的读者从 `README.md` 开始阅读，并为每种语言添加一个文件。无需配置文档站点框架。通常，项目还会有一个应用或 CLI，其 README 应使用与该应用相同的语言和产品术语。另一种情况是只有库或文档的仓库，没有 UI 字符串，这将在下文介绍。

<a id="what-you-get"></a>

该工具会保留 `README.md`。托管平台会继续将其渲染为仓库首页。每个目标语言环境都是一个同级文件，例如 `translated-docs/README.de.md`。README 中的语言行将这些文件链接起来，并且相同的行会写入每个译文，其中的链接可从读者正在查看的文件中正常工作。`translate-docs` 填充该行。它将从起始标记到结束标记之间的所有内容替换为每个语言环境的一个链接。如果这些文件也需要翻译，请将 `CONTRIBUTING.md`、`CHANGELOG.md` 或 `docs/` 文件夹添加到同一块中。参见[不止是 README](#step-3-more-than-the-readme)。

最快的方法是将本页面上的提示提供给编码代理。它会检查配置并添加语言列表标记。您需要自行安装 CLI、选择提供商并初始化项目，因为这需要您的 API 密钥和您的选择。您还需要自行运行翻译，因为它会花费您账户中的资金。

VitePress、Docusaurus、Starlight、Nextra、Fumadocs 或 Astro 站点使用[为网站或文档站点添加 i18n](/zh-Hans/guide/add-i18n-to-website)。如果仓库的 README 也应翻译，请添加 `--with-readme`。不确定哪种情况适用？请参阅末尾的[不适用于您的情况？](#not-your-case)。

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

具有 `package.json` 的仓库将该包作为开发依赖项安装。其他安装选项：[安装](/zh-Hans/guide/installation)。

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` 和 `yarn add --dev ai-i18n-tools` 也适用。

没有 Node.js 项目的仓库可以使用独立可执行文件。Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安装程序会检查 `SHA256SUMS.txt`，将命令安装为 `ai-i18n-tools`，并将其添加到 `PATH`。这些二进制文件未经公证或 Authenticode 签名。手动步骤和资产名称：[独立可执行文件](/zh-Hans/guide/installation#standalone-executables)。当安装了 Node.js 且您不希望有项目依赖项时，`npx ai-i18n-tools` 也适用。

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

您在提示之前运行此命令一次。它会写入配置并使用您上面选择的提供商。它不会编辑 `README.md`。当配置包含 README 块时，它会打印要粘贴的标记行，并在 `README.md` 缺失时发出警告。

| 你拥有 | 脚手架 | 接着 |
| --- | --- | --- |
| 一个 JS/TS 应用外加一个 README | `ai-i18n-tools init -P openrouter`（`ui-markdown`，默认） | [为 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) 用于 `t()`，本页面用于 README |
| 一个 Python 应用外加一个 README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python) 用于该应用，本页面用于 README |
| 任何其他模板，外加一个 README | 将 `--with-readme` 添加到该 `init` 命令中 | 本页面用于 README 块 |
| 仅 README 和 Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | 本页面 |

`--with-readme` 在 `ui-markdown` 和 `docs-markdown` 上是空操作，因为这些模板已包含 README 块。

JS/TS 应用和 README（一个命令；`ui-markdown` 是默认模板）：

```bash
ai-i18n-tools init -P openrouter
```

Python、Astro、纯 HTML、VitePress、Docusaurus 或其他模板，并添加相同的 README 块：

```bash
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

仅 README 和 Markdown 文件：

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
```

然后在 `ai-i18n-tools.config.json` 中编辑 `sourceLocale` 和 `targetLocales`。`sourceLocale` 是 README 的编写语言。任何 BCP-47 语言都有效。`features.translateDocs` 必须为 true。混合配置还会设置 `features.translateUIStrings`。`docs[].contentPaths` 列出了要翻译的 Markdown 文件和文件夹。脚手架列出了 `README.md`。

运行 `init` 一次。它每次都会重写 `ai-i18n-tools.config.json`，因此第二次运行会丢弃您所做的编辑。当您跳过 `init` 时，现有配置将保持不变：提示会追加 README 块，并且[步骤 1](#step-1-configure-the-docs-block) 会手动显示相同的编辑。

<a id="run-the-agent-prompt"></a>
## 运行代理提示

在您的编码代理（Cursor、Claude Code、Copilot 或类似工具）中打开项目，开始新的聊天，然后粘贴下面的提示。项目必须已经初始化。无需编辑任何内容。如果其他 Markdown 文件需要翻译，请在同一消息中命名它们。

代理首先检查 CLI 和配置是否存在，如果缺少其中一个，则停止并提供说明。然后它分两部分工作：

- 第 1 部分：当配置中尚未列出 `README.md` 时，追加平面 README 块。
- 第 2 部分：将语言列表标记添加到源 README。

它不会安装 CLI、初始化配置、读取您的 API 密钥、填充语言链接或进行翻译。翻译是审查之后的步骤，由您运行。

````markdown
# Prepare README and Markdown translation

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user which command to run, then run this prompt again:

- JS/TS app plus a README: `ai-i18n-tools init -P <provider>`
- README and Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`
- Any other template: `ai-i18n-tools init -t <template> -P <provider> --with-readme`

Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, rewrite, or shorten the source README or any other source
  Markdown. Do not edit anything under `translated-docs/` or other generated
  locale trees. Do not hand-edit locale JSON.
- Do not reformat unrelated files. Leave unrelated edits in a dirty tree alone.

## Part 1 — Config

Skip this part when one `docs` entry already lists `README.md`. Do not add a
second block for the same file.

Otherwise set `features.translateDocs` to true and append one `docs` entry:

- `contentPaths` includes `README.md`
- `outputDir` is `translated-docs`
- `addFrontmatter` is false
- `docsOutput.style` is `flat`
- `docsOutput.flatPreserveRelativeDir` is true
- `docsOutput.linkRewriteDocsRoot` is `.`
- `docsOutput.postProcessing.languageListBlock` uses start
  `<small id="lang-list">`, end `</small>`, separator ` · `

```json
{
  "contentPaths": ["README.md"],
  "outputDir": "translated-docs",
  "addFrontmatter": false,
  "docsOutput": {
    "style": "flat",
    "flatPreserveRelativeDir": true,
    "linkRewriteDocsRoot": ".",
    "postProcessing": {
      "languageListBlock": {
        "start": "<small id=\"lang-list\">",
        "end": "</small>",
        "separator": " · "
      }
    }
  }
}
```

Leave `features.translateUIStrings` as it is. Add other source files the user
named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## Part 2 — Language list

In `README.md`, where readers should see the other languages, add this marker
if it is not already there. A short label on the line above it is normal
prose. Add that label only when the spot has no heading of its own.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.
Markers inside fenced code blocks are ignored, so a config sample in the same
file does not match. Do not put the real marker inside a fence.

## Verify and report

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and
exactly one docs block lists `README.md`. The marker is in the source README
and not inside a fence. Nothing under `translated-docs/` changed.

Report the files changed and any Markdown file you left out of `contentPaths`,
with a one-line reason. Then list the commands for the user, and do not run
them: `ai-i18n-tools suggest-models` (optional), `ai-i18n-tools sync`.
````

<a id="review-the-result"></a>
## 审查结果

代理结束时会生成一份报告。在翻译之前检查它：

- 差异。它应该是配置和标记。源散文应与之前相同。`git diff --stat` 显示了更改了多少。
- `translated-docs/` 或其他生成的语言环境树下的内容未被编辑。
- `ai-i18n-tools.config.json` 解析，`features.translateDocs` 为 true，并且只有一个文档块列出了 `README.md`。
- 标记位于 `README.md` 中，而不是在围栏代码块内。围栏内的标记示例是可以的。真正的标记在外面。

<a id="choose-models-and-translate"></a>
## 选择模型并翻译

您运行此部分。它使用您的 API 密钥并在您的账户上花费资金。

`init` 提供的模型列表是一个起点。对当前活跃提供商的聊天模型进行排序，当候选列表确认无误后，将其写入 `translationModels`：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` 仅替换 `translationModels`。相同的排名位于 `ai-i18n-tools dashboard` 的[模型](/zh-Hans/guide/translation-dashboard/models)选项卡上。

然后翻译：

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` 会按顺序运行已启用的步骤：当 UI 字符串开启时运行 `extract` 和 `translate-ui`，然后运行 `translate-docs`。缓存是共享的，因此已为应用翻译过的句子在 README 中出现时会被重用。UI 目录也会作为术语表提示（`ui[].uiGlossary`，默认开启）传递给文档翻译，这可以保持按钮和功能名称的一致性。请参阅[术语表](/zh-Hans/guide/glossary)。

行中的语言名称来自 `ui-languages.json`，`extract` 会将其写入 UI 目录旁边。仅 README 的配置没有 UI 目录，因此该行会改用捆绑的语言列表。标签仍然是原生名称。仅当您想要自己的项目清单时才运行 `generate-ui-languages`。

提交 `translated-docs/` 并在主机上打开翻译后的 README。源 README 和 `translated-docs/README.de.md` 之间的相对链接会为每个文件重写。

<a id="check-one-language"></a>
### 检查一种语言

在主机和文件本身中打开 `translated-docs/README.de.md`（或您选择的任何目标代码）。语言行应列出所有区域设置，并包含从您正在查看的文件中可用的链接。仍在源语言中的句子位于代码围栏、URL 或标题锚点内，或者它不在 `contentPaths` 中。

<a id="keep-it-translated"></a>
## 保持翻译更新

在源 README 或应用字符串更改后重新运行 `ai-i18n-tools sync`。缓存仅将新增或更改的文本发送到模型。在 `translated-docs/` 下提交更新的文件。`ai-i18n-tools dashboard` 打开[翻译仪表板](/zh-Hans/guide/translation-dashboard/) 以审阅翻译。

下面的工作流是一个示例，而不是一个已发布的操作。当 `README.md` 发生更改时，它会安装 CLI 并运行 `sync`。将提供程序密钥存储为仓库机密。审查 `translated-docs/` 的差异并提交，或者将其推送到分支并开启一个拉取请求。

```yaml
name: Translate README
on:
  push:
    paths:
      - "README.md"
      - "ai-i18n-tools.config.json"
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install --save-dev ai-i18n-tools
      - run: npx ai-i18n-tools sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

使用为你所配置的提供程序设置的环境变量。除非你在托管的运行器上安装了 Ollama，否则它不会在该运行器上生效。

<a id="hybrid-tips"></a>
### 混合提示

- 使用 `docs[].targetLocales` 将 README 翻译成比应用更少的语言。请参阅[为文档设置更少的区域设置](/zh-Hans/guide/combining-pipelines#fewer-locales-for-documents)。
- 将产品术语放入 `glossary.userGlossary`。同一个 CSV 文件可用于 UI 字符串和 README。
- 使用 `ai-i18n-tools sync --no-docs` 或 `ai-i18n-tools sync --no-ui` 仅运行一侧。

<a id="say-that-the-translation-is-automatic"></a>
### 声明翻译是自动的

AI 翻译可能会出错。在 README 底部添加一条简短的说明（如此仓库的 [README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) 中的说明），告知读者其他语言是机器翻译的，在信赖这些翻译内容之前应进行核对。

<a id="do-it-by-hand"></a>
## 手动操作

如果您更喜欢自己进行更改，或者想了解提示的作用，请按照以下步骤操作。前两个与提示的部分匹配。后两个用于额外文件和指向已发布站点的链接。最后，您仍然需要[安装 CLI](#install-and-choose-a-provider)、[初始化项目](#initialise-the-project) 和[翻译](#choose-models-and-translate)。

1. [配置文档块](#step-1-configure-the-docs-block)。
2. [添加语言列表](#step-2-add-the-language-list)。
3. [不仅仅是 README](#step-3-more-than-the-readme)。
4. [主机上的链接](#step-4-links-on-the-host)。

<a id="step-1-configure-the-docs-block"></a>
## 步骤 1：配置文档块

有四个关键的键：

- `sourceLocale`：README 所用的语言。任何语言都有效。本指南中以英语为例。
- `targetLocales`：要添加的语言。
- `features.translateDocs`：必须为 true。混合配置也设置 `features.translateUIStrings`。
- `docs[].contentPaths`：要翻译的 Markdown 文件和文件夹。脚手架列出了 `README.md`。

当 `init` 已经编写了 README 块时，请跳过此步骤。当您正在编辑现有配置时使用它。

<details>
<summary>混合：UI 字符串和 README</summary>

`ui-markdown` 会写入此结构。`ui` 是应用目录。`docs` 条目是 README。

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": ".",
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

</details>

<details>
<summary>仅 README 和 Markdown</summary>

`docs-markdown` 会关闭 UI 字符串并保留相同的 README 块。

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": "."
      }
    }
  ]
}
```

语言列表设置与混合示例中的相同。此处省略它们只是为了保持代码片段简短。`init -t docs-markdown` 会写入它们。

</details>

<a id="add-the-block-to-a-config-you-already-have"></a>
### 将块添加到您已有的配置中

追加混合示例中的 `docs` 对象，并将 `features.translateDocs` 设置为 `true`。如果配置中已有 `docs` 数组（例如，VitePress 或 Docusaurus 站点），则将 README 对象作为第二个条目追加。`sync` 会运行每个块。[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) 就是这样做的：一个块用于文档站点，一个扁平块用于 `README.md`。

当已有一个块列出 `README.md` 时，请勿添加第二个块。

<a id="step-2-add-the-language-list"></a>
## 步骤 2：添加语言列表

将此行放入 `README.md` 中读者应该能看到其他语言的地方。其上一行的简短标签是普通文本，将会被翻译。

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

该行可以为空。`translate-docs` 会将从开始标记到结束标记的所有内容替换为每个区域设置一个链接。代码围栏内的标记会被忽略，因此同一文件中的配置示例不会匹配。详情：[语言切换器](/zh-Hans/guide/documents/language-switcher)。

<a id="step-3-more-than-the-readme"></a>
## 步骤 3：不仅仅是 README

将路径添加到 `contentPaths`。`flatPreserveRelativeDir` 会保留文件夹，因此 `docs/guide.md` 会变为 `translated-docs/docs/guide.de.md`，而不是与另一个 `guide.md` 冲突。

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

`.translate-ignore` 文件会跳过您不想翻译的路径。`init --with-translate-ignore` 会写入一个入门文件。代码围栏、URL 和标题锚点不会被翻译。请参阅[输出布局](/zh-Hans/guide/documents/output-layouts)、[锚点链接](/zh-Hans/guide/documents/anchor-links) 和[链接重写](/zh-Hans/guide/documents/link-rewriting)。

因语言而异的屏幕截图：[图片和屏幕截图](/zh-Hans/guide/images-and-screenshots/)。

<a id="step-4-links-on-the-host"></a>
## 步骤 4：主机上的链接

指向仓库中其他文件的链接会被重写为指向区域设置文件。指向已发布的文档网站的链接则不会。此仓库使用 `regexAdjustments` 为其文档网站 URL 添加区域设置前缀：

```json
"regexAdjustments": [
  {
    "search": "https://wsj-br\\.github\\.io/ai-i18n-tools/",
    "replace": "https://wsj-br.github.io/ai-i18n-tools/${translatedLocale}/"
  }
]
```

扁平链接重写器会首先运行，然后执行这些替换。请参阅[链接重写](/zh-Hans/guide/documents/link-rewriting)。

这是最后一个手动步骤。继续阅读[选择模型并翻译](#choose-models-and-translate)。

<a id="not-your-case"></a>
## 不是您的情况？

| 你拥有 | 阅读 |
| --- | --- |
| 应用 UI 字符串，但没有要翻译的 README | [向 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) 或 [向 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python) |
| Django、Flask-Babel 目录，或已使用 GNU gettext 的应用程序 | [将 i18n 添加到 Django / Python gettext 应用程序](/zh-Hans/guide/add-i18n-to-django-gettext) |
| 一个 VitePress、Docusaurus、Starlight、Nextra、Fumadocs 或 Astro 网站 | [向网站或文档网站添加 i18n](/zh-Hans/guide/add-i18n-to-website)。当仓库的 README 也需要翻译时，添加 `--with-readme` |
| 每个区域设置一个 HTML 文件 | [HTML 页面](/zh-Hans/guide/documents/html-pages) |
| 完整的 `translate-docs` 参考 | [文档](/zh-Hans/guide/documents/) |

<a id="examples"></a>
## 示例

| 项目 | 显示内容 |
| --- | --- |
| [console-app](/zh-Hans/examples#console-app) | 一个小型 Node 应用加上一个扁平的 README 块 |
| [nextjs-app](/zh-Hans/examples#nextjs-app) | UI 字符串、一个文档站点和一个单独的扁平 README 块 |
| 此仓库 | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): 扁平的 README 块，然后是 VitePress 网站 |
