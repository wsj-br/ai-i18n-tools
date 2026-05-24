<a id="locale-assets-guide"></a>
# 区域设置资源指南

本指南介绍如何在使用 `ai-i18n-tools` 的项目中处理特定于区域设置的资源——截图（PNG、JPEG、WebP）和插图式 SVG 文件。它解释了每种可用模式的使用场景，并说明如何从零开始设置项目，以便日后添加更多区域设置时无需重构项目结构。

有关 SVG 配置的参考，请参阅 [GETTING_STARTED.md](GETTING_STARTED.zh-CN.md) 中的 [`svg`](#svg) 部分。有关 `postProcessing.regexAdjustments` 选项，请参阅 [配置参考](GETTING_STARTED.zh-CN.md#configuration-reference)。

| 配置路径 | 值 | 使用场景 | 说明 |
|-------------|-------|----------|-------|
| `documentations[].markdownOutput.style` | `"flat"` | 使用区域设置后缀的 README / USER-GUIDE 文件 | 启用扁平链接重写器；当源文件位于子目录中时，需与 `flatPreserveRelativeDir` 配合使用 |
| `documentations[].markdownOutput.style` | `"nested"`（默认） | 在 `outputDir` 下使用简单的区域设置子文件夹 | 不启用扁平链接重写器 |
| `documentations[].markdownOutput.style` | `"doc-system"` | 使用区域设置前缀的文档树（自定义生成器） | 设置 `docsRoot` 和 `localeSubpath`；不运行扁平链接重写器 |
| `documentations[].markdownOutput.style` | `"docusaurus"` / `"astro-starlight"` | 预设的 `doc-system` 布局 | 为 `localeSubpath` 提供具有生成器特定默认值的别名 |
| `svg.style` | `"flat"` | Web 应用（`name.<locale>.svg` 在 `public/assets/` 中） | 与 Markdown `style` 分开；由 `translate-svg` 使用 |
| `svg.style` | `"nested"` | 与文档系统共置的 SVG 输出 | 通常与 `pathTemplate` 配合使用（模式 E） |

本指南使用配置中的确切 JSON 字符串——而不仅仅是英文单词——以确保翻译版本无歧义。

<small>**阅读其他语言版本：** </small>
<small id="lang-list">[English (GB)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [हिन्दी](./LOCALE-ASSETS-GUIDE.hi.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [中文 (中国大陆)](./LOCALE-ASSETS-GUIDE.zh-CN.md) · [中文 (台灣)](./LOCALE-ASSETS-GUIDE.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [ai-i18n-tools 对资源的处理（及不处理的内容）](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [从一开始就为国际化设计](#design-for-i18n-from-the-start)
  - [使用 `markdownOutput.style = "flat"` 的 Markdown（README、USER-GUIDE）](#markdown-with-markdownoutputstyle--flat-readme-user-guide)
  - [文档系统网站（`markdownOutput.style = "doc-system"`）](#doc-system-sites-markdownoutputstyle--doc-system)
    - [Docusaurus 预设](#docusaurus-preset)
    - [Astro/Starlight 预设](#astrostarlight-preset)
  - [使用 SVG 资源的 Web 应用（Next.js、Vite 等）](#web-apps-nextjs-vite-etc-with-svg-assets)
- [决策指南](#decision-guide)
- [模式 A - 共享光栅图](#pattern-a--shared-raster)
  - [实现示例](#implementation-example)
- [模式 B - 按区域设置的文件夹（URL 重写）](#pattern-b--per-locale-folder-url-rewriting)
  - [目录结构](#directory-layout)
  - [截图脚本契约](#screenshot-script-contract)
  - [配置 - `markdownOutput.style = "flat"`](#config--markdownoutputstyle--flat)
  - [配置 - `markdownOutput.style = "doc-system"`](#config--markdownoutputstyle--doc-system)
  - [预设 - `markdownOutput.style = "docusaurus"`](#preset--markdownoutputstyle--docusaurus)
  - [预设 - `markdownOutput.style = "astro-starlight"`](#preset--markdownoutputstyle--astro-starlight)
- [模式 C - 共置光栅图（`doc-system`）](#pattern-c--colocated-raster-doc-system)
  - [目录结构](#directory-layout-1)
  - [截图脚本契约](#screenshot-script-contract-1)
  - [配置](#config)
  - [先决条件](#prerequisites)
  - [实现示例](#implementation-example-1)
- [模式 D - 使用 `svg.style = "flat"` 的翻译 SVG](#pattern-d--translated-svg-with-svgstyle--flat)
  - [配置](#config-1)
  - [应用参考](#app-reference)
  - [源文件结构建议](#source-layout-recommendation)
  - [实现示例](#implementation-example-2)
- [模式 E - 共置的翻译 SVG（文档系统）](#pattern-e--colocated-translated-svg-doc-system)
  - [配置](#config-2)
  - [源 Markdown](#source-markdown)
  - [SVG 源文件位置](#svg-source-location)
  - [`pathTemplate` 占位符](#pathtemplate-placeholders)
  - [实现示例](#implementation-example-3)
- [扁平链接重写器与两步流程](#the-flat-link-rewriter-and-two-step-flow)
  - [当 `markdownOutput.style = "flat"` 时的两步流程](#two-step-flow-when-markdownoutputstyle--flat)
  - [使用 `flatPreserveRelativeDir` 的每文件深度前缀](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` 和 `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [常见错误和故障排除](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## ai-i18n-tools 对资源文件的作用（和不作用）

`translate-docs` 翻译 Markdown/MDX 内容——包括图片的 alt 文本——但不会复制、生成或输出光栅文件。如果翻译后的页面需要特定于语言区域的截图，您必须将该文件放置在翻译后的 Markdown 所引用的路径下。

`translate-svg` 是唯一会输出特定于语言区域的二进制文件的命令。它读取源 SVG 文件，翻译文本元素（`<text>`、`<title>`、`<desc>`），并为每个语言区域写入一个输出 SVG。该工具从不写入光栅文件（PNG、JPEG、WebP、GIF）。

---

<a id="design-for-i18n-from-the-start"></a>
## 从一开始就为国际化设计

在任何截图存在之前选择正确的目录结构，是决定后续语言区域特定资源处理是否顺利的最关键因素。在已提交数十张截图后再重构目录结构，意味着需要重新组织路径并更新每个 Markdown 引用。

<a id="markdown-with-markdownoutputstyle--flat-readme-user-guide"></a>
### 使用 `markdownOutput.style = "flat"` 的 Markdown（README、USER-GUIDE）

从第一天起就将截图存储在按语言区域编码的子目录下：

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

当你稍后添加国际化支持时，你的 `take-screenshots` 脚本会为每种语言区域写入 `images/screenshots/<locale>/`，并且一条 `regexAdjustments` 规则即可处理所有情况：

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

通用的 `[^/]+` 模式可匹配任意语言区域文件夹名称——不要硬编码你的源语言区域（例如 `screenshots/en-GB/`），因为一旦 `sourceLocale` 发生变化就会导致问题。

如果你一开始使用的路径省略了语言区域子目录（`images/screenshots/translate.png`），那么在 Pattern B 能够生效之前，你将需要重构整个目录树。

<a id="doc-system-sites-markdownoutputstyle--doc-system"></a>
### 文档系统类网站（`markdownOutput.style = "doc-system"`）

适用于将翻译页面存储在带语言区域前缀目录树下的静态文档网站——如 Docusaurus i18n、Astro Starlight，以及遵循相同结构的自定义生成器。`docsRoot` 下的文件将被写入：

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

将 `documentations[].markdownOutput.docsRoot` 设置为你的英文源根目录（例如 `"docs"` 或 `"src/content/docs"`）。当你直接设置 `style: "doc-system"` 时，还必须设置 `localeSubpath`，即你的网站在 `{locale}/` 和翻译文件之间使用的路径段。别名 `"docusaurus"` 和 `"astro-starlight"` 是预设的 `doc-system` 布局，带有默认的 `localeSubpath` 值（参见 [输出布局](GETTING_STARTED.zh-CN.md#output-layouts)）。

| 预设别名 | 默认 `localeSubpath` | 示例输出 |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""`（空） | `src/content/docs/de/guide.md` |

扁平链接重写器对 `doc-system` **不**运行（与 `"flat"` 不同）。`postProcessing.regexAdjustments` 看到的是源 Markdown 中的原始 URL——通常是像 `/img/screenshots/en-GB/foo.png` 这样的绝对路径或站点根路径。

**模式 B** 适用于截图位于共享静态 URL 树中的情况：从第一天起使用带语言区域编码的文件夹，并使用一条通用的 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` 规则（参见 [配置 — doc-system](#config--markdownoutputstyle--doc-system)）。

**模式 C** 适用于每种语言区域的翻译文档将其资源文件与 Markdown 放在一起（无需 URL 重写）的情况。你的截图脚本必须将 PNG 写入由 `{outputDir}`、`{locale}` 和 `{localeSubpath}` 推导出的路径中——下面的 Docusaurus 预设是参考布局。

<a id="docusaurus-preset"></a>
#### Docusaurus 预设

项目初始化时养成两个习惯，可彻底避免后续使用正则表达式进行桥接：

1. 在添加任何截图之前，先创建一个符号链接 `documentation/docs/assets → ../static/assets`。Docusaurus 的 webpack 默认支持跟踪符号链接，这样源文档可以使用相对路径，翻译后的文档也能沿用相同的路径。

2. 将所有文档资源（PNG 和 SVG 文件）统一放在 `static/assets/` 目录中。不要将它们分别放在 `static/img/`（SVG）和 `static/assets/`（PNG）中。统一存放后，无论是英文文档还是翻译文档，都可以引用相同的相对路径 `../assets/name.ext`。

在源 Markdown 文件中引用资源时，始终使用稳定的相对路径 `../assets/name.ext`。切勿使用绝对路径 `/img/` 或 `/assets/` 引用文档资源——这些 URL 在英文源文件（从 `static/` 提供服务）和翻译语言版本（与翻译文档共置）之间会不同，从而迫使你使用 `regexAdjustments` 规则进行桥接。

当你后续添加国际化支持时，截图脚本会自动采用 `getScreenshotDir` 的拆分方式（参见 [模式 C](#pattern-c--docusaurus-colocated)），而 `translate-svg` 会使用 `pathTemplate`。无需进行任何正则表达式调整。

> **注意：** `resolve.symlinks = false` 在 `next.config.ts` 中仅会禁用 Next.js 应用的 webpack 构建对符号链接的解析。它不会影响使用独立 webpack 实例的 Docusaurus 文档站点构建。

<a id="astrostarlight-preset"></a>
#### Astro/Starlight 预设

等同于使用 `markdownOutput.style = "doc-system"` 和 `localeSubpath: ""` —— 翻译页面直接位于 `{outputDir}/{locale}/` 下。

从第一天起就将截图存储在带有语言区域代码的路径下：

```
public/img/screenshots/en-GB/screenshot.png
```

在 `regexAdjustments` 中使用通用正则表达式：

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### 使用 SVG 资源的 Web 应用（Next.js、Vite 等）

将 SVG 源文件保留在专用的源目录中（例如 `images/` 或 `src/assets/`），并配置 `svg.outputDir` 指向一个独立的资源服务目录（例如 `public/assets/`）。切勿将源 SVG 文件与 `translate-svg` 输出文件混放在同一文件夹中——这会导致无法区分哪些文件是生成的。

从一开始就设计可翻译的 SVG：对所有人类可读的标签使用 `<text>`、`<title>` 和 `<desc>` 元素。避免将文本嵌入为路径数据。

在 `svg` 配置块中启用 `forceLowercase: true`，以避免在不同文件系统和 CDN 上因大小写敏感性不一致而导致的问题。

---

<a id="decision-guide"></a>
## 决策指南

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| 模式 | 资源类型                  | 站点类型                                                                 | 工具机制                                               |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A       | 光栅图（共享）             | `markdownOutput.style = "flat"` 文档                                      | 按文件链接重写器；通常无需正则表达式                     |
| B       | 光栅图（按语言区域）         | `"flat"` 或 `"doc-system"`（包括 `"docusaurus"`、`"astro-starlight"`）    | `regexAdjustments` 语言区域段替换                       |
| C       | 光栅图（共置）          | 使用共置资源的 `"doc-system"`（Docusaurus 预设）                  | 截图脚本自动放置文件；无需正则表达式                     |
| D       | SVG（可翻译）            | Web 应用                                                                   | 使用 `svg.style = "flat"` 的 `translate-svg`                    |
| E       | SVG（可翻译，共置） | 使用共置资源的 `"doc-system"`（Docusaurus 预设）                  | 使用 `svg.style = "nested"` 和 `pathTemplate` 的 `translate-svg` |

---

<a id="pattern-a--shared-raster"></a>
## 模式 A - 共享光栅图像

当单个图像在所有区域设置中共享（无区域特定变体）时使用。当启用 `markdownOutput.style = "flat"` 时，扁平链接重写器会为每个输出文件计算深度前缀，因此与源文件位于同一目录的资源（例如 `docs/figure.png`，在 `docs/page.md` 中通过 `figure.png` 引用）在每个翻译输出中都能正确解析——无需配置 `postProcessing.regexAdjustments` 规则。

示例：此包将 `docs/GETTING_STARTED.md` 转换为 `translated-docs/docs/GETTING_STARTED.<locale>.md`。引用同级图像 `docs/translation-dashboard.png` 为 `translation-dashboard.png`。重写器根据输出文件目录回溯到源目录（`../../docs/`）计算每个文件的前缀，生成 `../../docs/translation-dashboard.png`。从 `translated-docs/docs/` 出发，可正确解析为 `docs/translation-dashboard.png`。

当仪表板 UI 更改时，使用 [`scripts/screenshot-translation-dashboard.sh`](../../docs/../scripts/screenshot-translation-dashboard.sh) 刷新 PNG；该图像不按区域设置区分。

在以下情况下仍需要 `postProcessing` 规则：
- 资源通过绝对 URL 引用（例如 `/img/figure.png`）——重写器仅处理相对路径
- 出于其他原因需要更改资源 URL（例如切换到 CDN）

<a id="implementation-example"></a>
### 实现示例

此仓库对翻译仪表板截图使用模式 A：[GETTING_STARTED.md](GETTING_STARTED.zh-CN.md#translation-dashboard) 引用了同一文件夹中的图像 [translation-dashboard.png](../../docs/../docs/translation-dashboard.png)。[ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) 设置了 `markdownOutput.style = "flat"` 和 `flatPreserveRelativeDir: true`；每个文件的深度前缀在无截图 `regexAdjustments` 的情况下解析图像路径。

---

<a id="pattern-b--per-locale-folder-url-rewriting"></a>
## 模式 B - 按区域设置的文件夹（URL 重写）

适用于包含 `markdownOutput.style = "flat"` 的 README/用户指南，以及从共享静态 URL 树提供截图的文档系统网站（`markdownOutput.style = "doc-system"` 或别名 `"docusaurus"` / `"astro-starlight"`）。

<a id="directory-layout"></a>
### 目录结构

<details>
<summary>按区域设置划分的示例截图目录结构</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

源 Markdown 文件引用源区域设置目录：

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### 截图脚本约定

`take-screenshots` 脚本必须为所有区域设置写入文件——而不仅仅是源区域设置。`translate-docs` 命令会重写路径但不会创建文件。常见模式：

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

请参见 [examples/nextjs-app 中的截图脚本](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh) 中的简单 `bash` 示例，或 [Transrewrt 项目](https://github.com/wsj-br/transrewrt) 仓库中 [take-screenshots.js](https://github.com/wsj-br/transrewrt/blob/main/scripts/take-screenshots.js) 的更复杂示例。

> **注意：** 以下四个子章节共享相同的 `regexAdjustments` 区域设置段替换（`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`）。仅输出布局以及是否先运行扁平链接重写器有所不同——请跳转到与您的 `markdownOutput.style` 匹配的子章节。

<a id="config--markdownoutputstyle--flat"></a>
### 配置 - `markdownOutput.style = "flat"`

当启用 `markdownOutput.style = "flat"` 时，扁平链接重写器优先运行，并为非 Markdown URL 添加深度前缀。对于位于仓库根目录且配置为 `outputDir: "translated-docs/"` 的 `README.md`，会添加 `../`：

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

然后 `regexAdjustments` 规则在已添加前缀的 URL 中替换区域设置段：

<details>
<summary>扁平布局的 regexAdjustments 示例</summary>

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
    ]
  }
}
```

</details>

结果：`../images/screenshots/de/translate.png` —— 从 `translated-docs/README.de.md` 正确回溯到仓库根目录的相对路径。

`postProcessing` 步骤在扁平链接重写器之后运行。编写 `search` 模式时，应匹配已添加前缀的 URL 中任意位置的区域设置段——无需在模式中包含 `../` 前缀。

实现示例（生产环境）：[Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) 中的截图 URL（`images/screenshots/en-GB/…`），[ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) 中的区域设置重写，捕获脚本 [take-screenshots.js](https://github.com/wsj-br/transrewrt/blob/main/scripts/take-screenshots.js)（参见上方的 [截图脚本契约](#screenshot-script-contract)）。

实现示例（演示配置）：[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的第二个 `documentations[]` 块（`images/screenshots/[^/]+/` → `${translatedLocale}`）；辅助脚本 [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh)。

<a id="config--markdownoutputstyle--doc-system"></a>
### 配置 - `markdownOutput.style = "doc-system"`

适用于任何通过共享静态 URL 前缀引用截图的文档系统网站的通用模式 B。扁平链接重写器不运行；`postProcessing` 重写原始 Markdown URL 中的区域设置部分。

<details>
<summary>文档系统布局的 regexAdjustments 示例</summary>

```json
"markdownOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

设置 `localeSubpath` 以匹配你的生成器在 `{locale}/` 和翻译文件之间的布局，或者在默认值适用时使用预设别名（`"docusaurus"`、`"astro-starlight"`）代替 `"doc-system"`。源 Markdown 通常在 URL 中嵌入源语言区域设置：

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

为每个目标区域设置在相同路径下提供对应的 PNG 文件（例如 `static/img/screenshots/de/screenshot.png`）。优先使用 `screenshots/[^/]+/` 而非硬编码 `screenshots/en-GB/`，以便规则在 `sourceLocale` 更改时仍然有效。

<a id="preset--markdownoutputstyle--docusaurus"></a>
### 预设 - `markdownOutput.style = "docusaurus"`

与 `"doc-system"` 相同，但使用默认的 `localeSubpath = "docusaurus-plugin-content-docs/current"`。扁平链接重写器不运行。`postProcessing` 看到的是原始 Markdown URL。英文页面通常使用包含源区域设置的绝对路径：

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Docusaurus 预设的 regexAdjustments 示例</summary>

```json
"markdownOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

在 `docs-site/static/img/screenshots/<locale>/screenshot.png` 处提供对应的 PNG 文件。对于与源区域设置无关的配置，优先使用 `screenshots/[^/]+/` 而非 `screenshots/en-GB/`。

实现示例：[examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md)（`/img/screenshots/en-GB/screenshot.png`）配合 [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的第一个 `documentations[]` 块。

<a id="preset--markdownoutputstyle--astro-starlight"></a>
### 预设 - `markdownOutput.style = "astro-starlight"`

与 `"doc-system"` 相同，但使用 `localeSubpath: ""` — 翻译后的页面直接位于 `{outputDir}/{locale}/` 下。与上述通用文档系统配置遵循相同的模式 B 原则。源 Markdown 使用 `/img/screenshots/en-GB/screenshot.png`：

<details>
<summary>Astro Starlight 预设的 regexAdjustments 示例</summary>

```json
"markdownOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

在 `public/img/screenshots/<locale>/screenshot.png` 处提供 PNG 文件。

实现示例：[examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) 和 [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json)（`screenshots/[^/]+/`）。

---

<a id="pattern-c--colocated-raster-doc-system"></a>
## 模式 C - 共置光栅图（`doc-system`）

当 `doc-system` 站点将特定于区域设置的资源与翻译后的 Markdown 文件共置时使用 — 无需 URL 重写。Docusaurus 预设（`markdownOutput.style = "docusaurus"`）是参考实现；其他使用 `"doc-system"` 并自定义 `localeSubpath` 的生成器也遵循相同理念：英文资源位于源区域设置路径下，翻译后的资源位于 `{outputDir}/{locale}/[localeSubpath/]assets/` 下。

<a id="directory-layout-1"></a>
### 目录结构

<details>
<summary>共置资源目录结构示例（Docusaurus）</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

所有语言区域的文档使用相同的相对路径：

```markdown
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

对于英文（`en-GB`）区域设置，`../assets/` 通过符号链接解析到 `static/assets/`。对于翻译后的区域设置，则直接解析到其自身的 `current/assets/` 目录。

<a id="screenshot-script-contract-1"></a>
### 截图脚本契约

脚本必须将 PNG 文件写入每个语言区域的正确目录。`getScreenshotDir` 函数对拆分进行编码：

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

参见 [duplistatus](https://github.com/wsj-br/duplistatus/blob/main/scripts/take-screenshots.ts) 仓库中的 [take-screenshots.ts](https://github.com/wsj-br/duplistatus) 的生产实现（本地参考副本：[references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts)）。

<a id="config"></a>
### 配置

光栅文件不需要 `regexAdjustments` 规则。`translate-docs` 会翻译 Markdown 中的替代文本，但 URL 保持不变：

```json
{
  "markdownOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

如果项目还使用翻译后的 SVG，则 Pattern E 会处理它们，并将它们与 PNG 一起放置在 `current/assets/` 目录中，无需额外的正则表达式。

<a id="prerequisites"></a>
### 前提条件

- 必须存在 `docs/assets` 符号链接：`ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack 默认遵循符号链接（在 Docusaurus 构建中 `resolve.symlinks` 默认为 `true`）
- 符号链接只需在源语言区域中存在——翻译构建不会使用它

<a id="implementation-example-1"></a>
### 实现示例

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/main/scripts/take-screenshots.ts) 中的 `getScreenshotDir(locale)`；英文文档引用同目录下的 PNG 文件（例如 [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md) 中包含 `../assets/screen-dashboard-summary.png`）；[ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) 中没有 PNG 的 `regexAdjustments`。同一项目中的 Pattern E SVG 也落在相同的 `current/assets/` 目录中（见下文）。

---

<a id="pattern-d--translated-svg-with-svgstyle--flat"></a>
## Pattern D - 使用 `svg.style = "flat"` 的翻译 SVG

当 Web 应用在运行时通过语言区域代码引用特定于语言区域的 SVG 插图或图表时使用。

<a id="config-1"></a>
### 配置

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` 读取 `images/` 下的每个 `.svg`，并为每个语言区域写入一个文件：

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### 应用引用

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### 源文件布局建议

将源 SVG 文件与输出目录分开。使用 `sourcePath: "images"` 和 `outputDir: "public/assets"` 时，这两个目录是不同的。切勿将两者设置为同一目录。

<a id="implementation-example-2"></a>
### 实现示例

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的 `svg` 块（`sourcePath: "images"`、`outputDir: "public/assets"`、`svg.style = "flat"`）；源文件 [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg)；每个语言区域的输出位于 [public/assets/](../../docs/../examples/nextjs-app/public/assets/) 下（例如 `translation_demo_svg.de.svg`）；运行时 URL 在 [page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) 中（`/assets/translation_demo_svg.${locale}.svg`）。

---

<a id="pattern-e--colocated-translated-svg-doc-system"></a>
## Pattern E - 共置的翻译 SVG（文档系统）

适用于文档系统网站，其中翻译后的 SVG 插图必须与每个语言区域内容目录中的翻译文档一起出现——与 Pattern C 光栅截图的位置相同。Docusaurus 预设是主要示例。

<a id="config-2"></a>
### 配置

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` 会为每个区域设置生成一个 SVG 文件，并写入与 Pattern C 用于 PNG 文件的相同 `current/assets/` 目录中：

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### 源 Markdown

所有语言环境下的文档都使用相同的相对路径：

```markdown
![Diagram](../../docs/../assets/diagram.svg)
```

对于英语语言环境，符号链接 `docs/assets → ../static/assets` 可解决此问题。对于翻译后的语言环境，它直接解析到 `current/assets/`。

不需要 `regexAdjustments` 规则，因为英文源文档和翻译输出文档使用完全相同的路径。

<a id="svg-source-location"></a>
### SVG 源文件位置

建议：将源 SVG 文件与 en-GB 的 PNG 文件一起存储在 `documentation/static/assets/` 中。这样可将所有文档资源集中存放，并且同一个 `docs/assets` 符号链接可同时覆盖两者。然后 `svg.sourcePath` 条目指向 `documentation/static/assets/name.svg`。

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` 占位符

| 占位符              | 值                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir` 的绝对解析路径              |
| `{locale}`               | 目标区域设置代码                                     |
| `{LOCALE}`               | 区域设置代码的大写形式                                 |
| `{relPath}`              | 从 `sourcePath` 根目录到源 SVG 的相对路径 |
| `{stem}`                 | 不含扩展名的文件名                             |
| `{basename}`             | 包含扩展名的文件名                                |
| `{extension}`            | 包含点的扩展名                                |
| `{relativeToSourceRoot}` | 从最近的 `sourcePath` 根目录开始的相对路径       |

完整参考请见 [svg 配置表](GETTING_STARTED.zh-CN.md#svg)。

<a id="implementation-example-3"></a>
### 实现示例

[duplistatus](https://github.com/wsj-br/duplistatus) — 在 [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) 中嵌套的 `svg` 块并使用 `pathTemplate`；源 SVG 文件列在 `documentation/static/img/` 下（例如 [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)）；`translate-svg` 将按区域设置的文件写入 Pattern C PNG 文件旁边的 `documentation/i18n/<locale>/…/current/assets/` 目录中；文档目前通过 `/img/duplistatus_*.svg` 嵌入这些文件（例如 [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)）。有关计划迁移到 `../assets/` 路径并移除 SVG `regexAdjustments` 桥接的详细信息，请参见 [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md)。

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## 扁平链接重写器与两步流程

对于 `markdownOutput.style = "flat"`（除非设置了 `rewriteRelativeLinks: false` 或自定义的 `pathTemplate`），在 `postProcessing` 之前会运行一个内置的重写器。它处理跨文档链接（添加区域设置后缀），并为非 Markdown 资源 URL 添加深度前缀。

<a id="two-step-flow-when-markdownoutputstyle--flat"></a>
### 当使用 `markdownOutput.style = "flat"` 时的两步流程

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

以 `outputDir: "translated-docs/"` 和位于仓库根目录的源文件 `README.md` 为例：

1. 扁平链接重写器：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`（每个 `../` 对应一个 `translated-docs/`）
2. `postProcessing` 正则表达式 `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`：`../images/screenshots/de/foo.png`

对于 `markdownOutput.style = "doc-system"`（包括 `"docusaurus"`、`"astro-starlight"` 和 `"nested"`），不会运行扁平链接重写器。`postProcessing` 接收到的是翻译后 Markdown 中的原始 URL（通常是像 `/img/screenshots/en-GB/foo.png` 这样的绝对路径）。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### 使用 `flatPreserveRelativeDir` 的按文件深度前缀

深度前缀是按输出文件单独计算的——而不是对整个批次统一计算。对于每个源文件，重写器会计算从输出文件目录回到源文件目录的相对路径，并将其用作前缀。

这意味着使用 `flatPreserveRelativeDir: true` 时，子目录中的源文件会自动获得正确的前缀。例如，`docs/GETTING_STARTED.md` 输出到 `translated-docs/docs/GETTING_STARTED.<locale>.md`。每个文件的前缀为 `../../docs/`，因此资源 `translation-dashboard.png`（相对于源文件）变为 `../../docs/translation-dashboard.png` —— 从 `translated-docs/docs/` 可正确解析回 `docs/translation-dashboard.png`。

与源文件同目录的相对路径资源不需要进行 `postProcessing` 正则表达式修正。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 与 `linkRewriteDocsRoot`

| 选项                                   | 效果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `markdownOutput.rewriteRelativeLinks`    | 显式启用或禁用扁平链接重写器（覆盖 `markdownOutput.style = "flat"` 时的默认行为） |
| `markdownOutput.linkRewriteDocsRoot`     | 计算 `depthPrefix` 的根路径（默认为 `"."`）                                                        |
| `markdownOutput.flatPreserveRelativeDir` | 影响输出路径结构，重写器在计算已知翻译文件的目标路径时会使用该结构       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
<a id="common-mistakes"></a>
## 常见错误与故障排查

**截图路径中缺少区域设置目录**
`images/screenshots/screenshot.png` — 无法区分区域设置变体，也无法进行重写。在应用模式 B 前应重构为 `images/screenshots/<locale>/screenshot.png`。

**正则表达式中硬编码源区域设置**
`"search": "screenshots/en-GB/"` — 如果 `sourceLocale` 发生更改会静默失败。应改用 `"search": "screenshots/[^/]+/"`。

**SVG 源文件与输出文件在同一目录**
如果 `svg.sourcePath` 和 `svg.outputDir` 重叠，生成的文件将与手动编辑的源文件混合。应将它们放在不同的目录中。

**共置 SVG 使用了 Docusaurus 的绝对静态 URL**
`/img/diagram.svg`（来自 `static/img/`）需要一条 `regexAdjustments` 规则，将其重写为翻译输出中的 `../assets/`。为避免此问题，应将源 SVG 文件放在 `static/assets/` 中，并从一开始就使用相对的 `../assets/diagram.svg`。

**Docusaurus 中缺少 `docs/assets` 符号链接**
如果没有符号链接，位于 `docs/user-guide/` 中的源文档无法通过相对路径引用 `static/assets/` 中的 PNG 或 SVG 文件。应在项目创建时设置符号链接：`ln -s ../static/assets documentation/docs/assets`。

**`take-screenshots` 脚本仅捕获源语言环境**
模式 B 要求为每种语言环境提供 PNG 文件。如果脚本仅捕获 `en-GB`，则翻译后的文档将包含重写路径，指向缺失的文件。
