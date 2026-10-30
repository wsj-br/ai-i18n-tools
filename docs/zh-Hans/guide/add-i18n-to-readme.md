<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# 为你的 README 和 Markdown 文档添加 i18n

本页面适用于 GitHub、GitLab、Bitbucket 或任何其他主机上的仓库，其读者从 `README.md` 和其他一些 Markdown 文件开始阅读。无需配置文档站点框架。通常的项目还有一个应用或 CLI，并且 README 应使用与该应用相同的语言和产品术语。另一种情况是仅包含库或文档且没有 UI 字符串的仓库，下文将对此进行介绍。

该工具会保留 `README.md`，并为每种语言写入一个区域设置文件，例如 `translated-docs/README.de.md`。README 内的语言行会将这些文件链接在一起。

<a id="install-and-choose-a-provider"></a>
## 你属于哪种设置？

| 你拥有 | 脚手架 | 接着 |
| --- | --- | --- |
| 一个 JS/TS 应用外加一个 README | `ai-i18n-tools init -P openrouter`（`ui-markdown`，默认） | [为 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) 用于 `t()`，本页面用于 README |
| 一个 Python 应用外加一个 README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python) 用于该应用，本页面用于 README |
| 任何其他模板，外加一个 README | 将 `--with-readme` 添加到该 `init` 命令中 | 本页面用于 README 块 |
| 仅 README 和 Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | 本页面 |

`--with-readme` 在 `ui-markdown` 和 `docs-markdown` 上是空操作，因为这些模板已包含 README 块。

<a id="initialise-the-project"></a>
## 你将获得什么

- `README.md` 仍然是源文件。主机会继续将其渲染为仓库首页。
- 每个目标区域设置都是一个同级文件，例如 `translated-docs/README.de.md`。
- 源文件和每个译文中的语言行会列出所有区域设置，其链接在读者正在查看的文件中均有效。

当这些文件也需要翻译时，请将 `CONTRIBUTING.md`、`CHANGELOG.md` 或 `docs/` 文件夹添加到同一个块中。请参阅[不止是 README](#step-3-more-than-the-readme)。

<a id="run-the-agent-prompt"></a>
## 安装

安装 CLI（[安装](/zh-Hans/guide/installation)) 并为您的提供商设置 API 密钥（[提供商和 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key))。Ollama 不需要密钥。

带有 `package.json` 的仓库会将该软件包安装为开发依赖项。没有 Node.js 项目的仓库可以运行 `npx ai-i18n-tools`，或使用[独立可执行文件](/zh-Hans/guide/installation#standalone-executables)。

<a id="review-the-result"></a>
## 脚手架

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

`init` 只写入 `ai-i18n-tools.config.json`。它不会编辑 `README.md`。当配置包含 README 块时，它会打印出要粘贴的标记行，并在 `README.md` 缺失时发出警告。现有配置将保持不变：请手动添加该块，如[将块添加到已有配置](#add-the-block-to-a-config-you-already-have)中所述。

<a id="choose-models-and-translate"></a>
## 配置

有四个关键的键：

- `sourceLocale`：README 所用的语言。任何语言都有效。本指南中以英语为例。
- `targetLocales`：要添加的语言。
- `features.translateDocs`：必须为 true。混合配置也设置 `features.translateUIStrings`。
- `docs[].contentPaths`：要翻译的 Markdown 文件和文件夹。脚手架列出了 `README.md`。

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

<a id="check-one-language"></a>
### 将块添加到您已有的配置中

追加混合示例中的 `docs` 对象，并将 `features.translateDocs` 设置为 `true`。如果配置中已有 `docs` 数组（例如，VitePress 或 Docusaurus 站点），则将 README 对象作为第二个条目追加。`sync` 会运行每个块。[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) 就是这样做的：一个块用于文档站点，一个扁平块用于 `README.md`。

<a id="keep-it-translated"></a>
## 添加语言列表

将此行放入 `README.md` 中读者应该能看到其他语言的地方。其上一行的简短标签是普通文本，将会被翻译。

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

该行可以为空。`translate-docs` 会将从开始标记到结束标记的所有内容替换为每个区域设置一个链接。代码围栏内的标记会被忽略，因此同一文件中的配置示例不会匹配。详情：[语言切换器](/zh-Hans/guide/documents/language-switcher)。

<a id="hybrid-tips"></a>
## 翻译

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` 会按顺序运行已启用的步骤：当 UI 字符串开启时运行 `extract` 和 `translate-ui`，然后运行 `translate-docs`。缓存是共享的，因此已为应用翻译过的句子在 README 中出现时会被重用。UI 目录也会作为术语表提示（`ui[].uiGlossary`，默认开启）传递给文档翻译，这可以保持按钮和功能名称的一致性。请参阅[术语表](/zh-Hans/guide/glossary)。

行中的语言名称来自 `ui-languages.json`，`extract` 会将其写入 UI 目录旁边。仅 README 的配置没有 UI 目录，因此该行会改用捆绑的语言列表。标签仍然是原生名称。仅当您想要自己的项目清单时才运行 `generate-ui-languages`。

提交 `translated-docs/` 并在主机上打开翻译后的 README。源 README 和 `translated-docs/README.de.md` 之间的相对链接会为每个文件重写。

<a id="say-that-the-translation-is-automatic"></a>
## 混合模式提示

- 使用 `docs[].targetLocales` 将 README 翻译成比应用更少的语言。请参阅[为文档设置更少的区域设置](/zh-Hans/guide/combining-pipelines#fewer-locales-for-documents)。
- 将产品术语放入 `glossary.userGlossary`。同一个 CSV 文件可用于 UI 字符串和 README。
- 使用 `ai-i18n-tools sync --no-docs` 或 `ai-i18n-tools sync --no-ui` 仅运行一侧。

<a id="do-it-by-hand"></a>
## 不仅仅是 README

将路径添加到 `contentPaths`。`flatPreserveRelativeDir` 会保留文件夹，因此 `docs/guide.md` 会变为 `translated-docs/docs/guide.de.md`，而不是与另一个 `guide.md` 冲突。

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

`.translate-ignore` 文件会跳过您不想翻译的路径。`init --with-translate-ignore` 会写入一个入门文件。代码围栏、URL 和标题锚点不会被翻译。请参阅[输出布局](/zh-Hans/guide/documents/output-layouts)、[锚点链接](/zh-Hans/guide/documents/anchor-links) 和[链接重写](/zh-Hans/guide/documents/link-rewriting)。

因语言而异的屏幕截图：[图片和屏幕截图](/zh-Hans/guide/images-and-screenshots/)。

<a id="step-1-configure-the-docs-block"></a>
## 主机上的链接

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

<a id="add-the-block-to-a-config-you-already-have"></a>
## 保持翻译更新

在源 README 或应用字符串更改后，重新运行 `sync`。缓存仅会将新的或已更改的文本发送到模型。将更新后的文件提交到 `translated-docs/` 下。

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

<a id="step-2-add-the-language-list"></a>
## 说明翻译是自动的

AI 翻译可能会出错。在 README 底部添加一条简短的说明（如此仓库的 [README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) 中的说明），告知读者其他语言是机器翻译的，在信赖这些翻译内容之前应进行核对。

<a id="step-3-more-than-the-readme"></a>
## 不是您的情况？

| 你拥有 | 阅读 |
| --- | --- |
| 应用 UI 字符串，但没有要翻译的 README | [向 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) 或 [向 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python) |
| 一个 VitePress、Docusaurus、Starlight、Nextra、Fumadocs 或 Astro 网站 | [向网站或文档网站添加 i18n](/zh-Hans/guide/add-i18n-to-website)。当仓库的 README 也需要翻译时，添加 `--with-readme` |
| 每个区域设置一个 HTML 文件 | [HTML 页面](/zh-Hans/guide/documents/html-pages) |
| 完整的 `translate-docs` 参考 | [文档](/zh-Hans/guide/documents/) |

<a id="step-4-links-on-the-host"></a>
## 示例

| 项目 | 展示内容 |
| --- | --- |
| [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) | 一个小型的 Node 应用外加一个扁平的 README 块 |
| [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) | UI 字符串、一个文档网站以及一个独立的扁平 README 块 |
| 此仓库 | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): 扁平的 README 块，然后是 VitePress 网站 |

<a id="not-your-case"></a>
## 代理提示

将此内容复制到 Cursor 或其他编码代理中。它会准备仓库。它不会翻译 README。

````markdown
# Prepare README and Markdown translation

## Context

ai-i18n-tools translates Markdown listed in `docs[]` and writes one file per locale. The source README stays in place. Flat output for a README looks like `translated-docs/README.de.md`. Guide: https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme

## Scope

Edit `ai-i18n-tools.config.json` and the source Markdown files that should grow a language list. Do not edit anything under `translated-docs/` or other generated locale trees.

## Config

- If there is no config, run `ai-i18n-tools init -P <provider>` for a JS/TS app (this template already includes the README block), `ai-i18n-tools init -t docs-markdown -P <provider>` for Markdown only, or `ai-i18n-tools init -t <template> -P <provider> --with-readme` for any other template.
- If a config exists, set `features.translateDocs` to true and append one `docs` entry: `contentPaths` includes `README.md`, `outputDir` is `translated-docs`, `addFrontmatter` is false, `docsOutput.style` is `flat`, `flatPreserveRelativeDir` is true, and `postProcessing.languageListBlock` uses start `<small id="lang-list">`, end `</small>`, separator ` · `.
- Do not add a second block when one already lists `README.md`.
- Add other source files the user named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## README

Add this line where the language row should appear, if it is not already there:

```markdown
<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.

## Do not

- Do not translate, rewrite, or shorten the source README.
- Do not hand-edit `translated-docs/` or locale JSON.
- Do not run a translation yourself.

## Verify

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.

## Report back

List files changed and any Markdown file you left out of `contentPaths`, with a one-line reason.
````
