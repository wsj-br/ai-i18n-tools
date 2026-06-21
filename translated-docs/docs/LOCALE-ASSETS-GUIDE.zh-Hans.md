<a id="locale-assets-guide"></a>
# 区域性资源指南

本指南介绍如何在使用 `ai-i18n-tools` 的项目中处理区域性特定资源（屏幕截图（PNG、JPEG、WebP）和插图 SVG 文件）。它解释了每种可用模式、何时使用它，以及如何从头开始设置项目，以便以后添加更多区域性无需进行结构性返工。

有关 SVG 配置参考，请参阅 [GETTING_STARTED.md](GETTING_STARTED.zh-Hans.md) 中的 [`svg`](#svg) 部分。有关 `postProcessing.regexAdjustments` 选项，请参阅 [配置参考](GETTING_STARTED.zh-Hans.md#configuration-reference)。

| 配置路径 | 值 | 用例 | 说明 |
|-------------|-------|----------|-------|
| `docs[].docsOutput.style` | `"flat"` | 区域性后缀的 README / USER-GUIDE 文件 | 启用扁平链接重写器；当源文件位于子目录中时，与 `flatPreserveRelativeDir` 配对 |
| `docs[].docsOutput.style` | `"nested"` (默认) | `outputDir` 下的简单区域性子文件夹 | 无扁平链接重写器 |
| `docs[].docsOutput.style` | `"doc-system"` | 区域性前缀的文档树（自定义生成器） | 设置 `docsRoot` 和 `localeSubpath`；扁平链接重写器不运行 |
| `docs[].docsOutput.style` | `"docusaurus"` / `"astro-starlight"` | 预设 `doc-system` 布局 | 别名，带有针对 `localeSubpath` 的生成器特定默认值 |
| `svg.style` | `"flat"` | Web 应用 (`name.<locale>.svg` in `public/assets/`) | 与 markdown `style` 分开；由 `translate-svg` 使用 |
| `svg.style` | `"nested"` | 文档系统共置的 SVG 输出 | 通常与 `pathTemplate`（模式 E）配对 |

本指南使用配置中的确切 JSON 字符串，而不是单独的英文单词，因此翻译后的副本将保持明确无歧义。加载时接受旧版键（`documentations`、`markdownOutput`）；在新配置中优先使用 `docs` 和 `docsOutput`。

<small>**以其他语言阅读：** </small>
<small id="lang-list">[English (UK)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [Hindi (Roman)](./LOCALE-ASSETS-GUIDE.hi-Latn.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [简体中文](./LOCALE-ASSETS-GUIDE.zh-Hans.md) · [繁體中文](./LOCALE-ASSETS-GUIDE.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [ai-i18n-tools 对资源的处理（和不处理）](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [从一开始就为 i18n 进行设计](#design-for-i18n-from-the-start)
  - [带 `docsOutput.style = "flat"` 的 Markdown（README、USER-GUIDE）](#markdown-with-docsoutputstyle--flat-readme-user-guide)
  - [文档系统站点（`docsOutput.style = "doc-system"`）](#doc-system-sites-docsoutputstyle--doc-system)
    - [Docusaurus 预设](#docusaurus-preset)
    - [Astro/Starlight 预设](#astrostarlight-preset)
  - [具有 SVG 资源的 Web 应用（Next.js、Vite 等）](#web-apps-nextjs-vite-etc-with-svg-assets)
- [决策指南](#decision-guide)
- [模式 A - 共享栅格](#pattern-a---shared-raster)
  - [实现示例](#implementation-example)
- [模式 B - 按区域性文件夹（URL 重写）](#pattern-b---per-locale-folder-url-rewriting)
  - [目录布局](#directory-layout)
  - [屏幕截图脚本约定](#screenshot-script-contract)
  - [配置 - `docsOutput.style = "flat"`](#config---docsoutputstyle--flat)
  - [配置 - `docsOutput.style = "doc-system"`](#config---docsoutputstyle--doc-system)
  - [预设 - `docsOutput.style = "docusaurus"`](#preset---docsoutputstyle--docusaurus)
  - [预设 - `docsOutput.style = "astro-starlight"`](#preset---docsoutputstyle--astro-starlight)
- [模式 C - 共置栅格（`doc-system`）](#pattern-c---colocated-raster-doc-system)
  - [目录布局](#directory-layout-1)
  - [屏幕截图脚本约定](#screenshot-script-contract-1)
  - [配置](#config)
  - [先决条件](#prerequisites)
  - [实现示例](#implementation-example-1)
- [模式 D - 翻译的 SVG 和 `svg.style = "flat"`](#pattern-d---translated-svg-with-svgstyle--flat)
  - [配置](#config-1)
  - [应用参考](#app-reference)
  - [源布局建议](#source-layout-recommendation)
  - [实现示例](#implementation-example-2)
- [模式 E - 共置翻译的 SVG（文档系统）](#pattern-e---colocated-translated-svg-doc-system)
  - [配置](#config-2)
  - [源 Markdown](#source-markdown)
  - [SVG 源位置](#svg-source-location)
  - [`pathTemplate` 占位符](#pathtemplate-placeholders)
  - [实现示例](#implementation-example-3)
- [扁平链接重写器和两步流程](#the-flat-link-rewriter-and-two-step-flow)
  - [当 `docsOutput.style = "flat"` 时的两步流程](#two-step-flow-when-docsoutputstyle--flat)
  - [按文件深度前缀和 `flatPreserveRelativeDir`](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` 和 `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [常见错误和故障排除](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## ai-i18n-tools 的功能（及其局限性）

`translate-docs` 会翻译 markdown/MDX 内容（包括图像的 alt 文本），但它不会复制、生成或输出光栅文件。如果翻译后的页面需要特定于区域设置的屏幕截图，您必须将该文件放置在翻译后的 markdown 将引用的路径下。

`translate-svg` 是唯一会输出特定于区域设置的二进制文件的命令。它读取源 SVG 文件，翻译文本元素（`<text>`、`<title>`、`<desc>`），并为每个区域设置生成一个输出 SVG。该工具从不写入光栅文件（PNG、JPEG、WebP、GIF）。

---

<a id="design-for-i18n-from-the-start"></a>
## 从一开始就为 i18n 进行设计

在任何屏幕截图存在之前选择正确的目录布局，是在后续处理特定于区域设置的资源时最能减轻痛苦的因素。在提交了数十张屏幕截图后才重新设计布局，意味着需要重构路径并更新每个 markdown 引用。

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### 使用 `docsOutput.style = "flat"` 的 Markdown（README、USER-GUIDE）

从第一天起，就在区域设置代码子目录中存储屏幕截图：

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

当您稍后添加 i18n 时，您的 `take-screenshots` 脚本会为每个区域设置写入 `images/screenshots/<locale>/`，并且一个 `regexAdjustments` 规则会处理所有这些规则：

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

通用的 `[^/]+` 模式匹配任何区域设置文件夹名称——不要硬编码您的源区域设置（例如 `screenshots/en-GB/`），因为如果 `sourceLocale` 发生更改，这会中断。

如果您从省略区域设置子目录的路径开始（`images/screenshots/translate.png`），则需要在模式 B 可以工作之前重构整个树。

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### 文档系统站点（`docsOutput.style = "doc-system"`）

用于将翻译后的页面存储在区域设置前缀树下的静态文档站点——Docusaurus i18n、Astro Starlight 以及遵循相同结构的自定义生成器。`docsRoot` 下的文件将写入：

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

将 `docs[].docsOutput.docsRoot` 设置为您的英文源根目录（例如 `"docs"` 或 `"src/content/docs"`）。当您直接设置 `style: "doc-system"` 时，您还必须将 `localeSubpath` 设置为您的站点在 `{locale}/` 和翻译文件之间使用的路径段。别名 `"docusaurus"` 和 `"astro-starlight"` 是预设的 `doc-system` 布局，具有默认的 `localeSubpath` 值（请参阅 [输出布局](GETTING_STARTED.zh-Hans.md#output-layouts))。

| 预设别名 | 默认 `localeSubpath` | 示例输出 |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (空) | `src/content/docs/de/guide.md` |

扁平链接重写器**不会**为 `doc-system` 运行（与 `"flat"` 不同）。`postProcessing.regexAdjustments` 会看到源 Markdown 中的原始 URL — 通常是绝对路径或站点根路径，例如 `/img/screenshots/en-GB/foo.png`。

**模式 B** 在屏幕截图位于共享的静态 URL 树中时适用：从第一天起就使用区域设置代码文件夹，并使用一个通用的 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` 规则（请参阅 [配置 — 文档系统](#config---docsoutputstyle--doc-system))。

**模式 C** 在每个区域设置的翻译文档将资源与 markdown 并置时适用（无 URL 重写）。您的屏幕截图脚本必须将 PNG 文件写入从 `{outputDir}`、`{locale}` 和 `{localeSubpath}` 派生的路径——下面的 Docusaurus 预设是参考布局。

<a id="docusaurus-preset"></a>
#### Docusaurus 预设

在项目初始化时养成两个习惯，可彻底避免后续使用正则表达式进行路径桥接：

1. 在添加任何截图之前，先创建一个符号链接 `documentation/docs/assets → ../static/assets`。Docusaurus 的 webpack 默认支持跟随符号链接，这样源文档可以使用相对路径，翻译后的文档也能沿用相同的路径。

2. 将所有文档资源（PNG 和 SVG 文件）统一存放在 `static/assets/` 目录中。不要将它们分别放在 `static/img/`（SVG）和 `static/assets/`（PNG）中。统一存放后，无论是英文文档还是翻译文档，都可以使用相同的相对路径 `../assets/name.ext` 引用资源。

在源 Markdown 文件中引用资源时，始终使用稳定的相对路径 `../assets/name.ext`。切勿使用绝对路径 `/img/` 或 `/assets/` URL —— 这些 URL 在英文源文档（从 `static/` 提供服务）和翻译语言版本（与翻译文档共置）之间会不同，从而迫使你必须使用 `regexAdjustments` 规则来桥接路径。

当你后续添加国际化支持时，截图脚本会自动采用 `getScreenshotDir` 的拆分方式（参见 [模式 C](#pattern-c---colocated-raster-doc-system)），而 `translate-svg` 会使用 `pathTemplate`。无需进行任何正则表达式调整。

> **注意：** `resolve.symlinks = false` 中的 `next.config.ts` 仅对 Next.js 应用的 webpack 构建禁用符号链接解析。它不会影响 Docusaurus 文档站点的构建，因为后者使用的是独立的 webpack 实例。

<a id="astrostarlight-preset"></a>
#### Astro/Starlight 预设

等同于使用 `docsOutput.style = "doc-system"` 和 `localeSubpath: ""` —— 翻译页面直接位于 `{outputDir}/{locale}/` 下。

从第一天起就将截图存储在带有语言代码的路径下：

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

将 SVG 源文件放在专用的源目录中（例如 `images/` 或 `src/assets/`），并配置 `svg.outputDir` 指向一个独立的资源服务目录（例如 `public/assets/`）。切勿将源 SVG 文件与 `translate-svg` 输出文件混放在同一文件夹中 —— 这会导致无法区分哪些文件是生成的。

从一开始就设计可翻译的 SVG：所有可读文本标签都应使用 `<text>`、`<title>` 和 `<desc>` 元素。避免将文本嵌入路径数据中。

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
| A       | 光栅图（共享）             | `docsOutput.style = "flat"` 文档                                      | 按文件重写链接；通常无需正则表达式                     |
| B       | 光栅图（按语言）         | `"flat"` 或 `"doc-system"`（包括 `"docusaurus"`、`"astro-starlight"`）    | `regexAdjustments` 语言段替换                       |
| C       | 光栅图（共置）          | 使用共置资源的 `"doc-system"`（Docusaurus 预设）                  | 截图脚本自动放置文件；无需正则表达式                     |
| D       | SVG（可翻译）            | Web 应用                                                                   | 使用 `svg.style = "flat"` 的 `translate-svg`                    |
| E       | SVG（可翻译，共置） | 使用共置资源的 `"doc-system"`（Docusaurus 预设）                  | 使用 `svg.style = "nested"` 和 `pathTemplate` 的 `translate-svg` |

---

<a id="pattern-a---shared-raster"></a>
## 模式 A - 共享光栅

当单个图片在所有区域设置中共享时（无区域设置特定变体）。当 `docsOutput.style = "flat"` 时，扁平链接重写器会根据每个输出文件计算深度前缀，因此与源文件相邻的资源（例如，从 `docs/page.md` 引用为 `figure.png` 的 `docs/figure.png`）可以在每个翻译输出中正确解析 — 无需 `postProcessing.regexAdjustments` 规则。

示例：此包将 `docs/GETTING_STARTED.md` 翻译为 `translated-docs/docs/GETTING_STARTED.<locale>.md`。同级图像 `docs/translation-dashboard.png` 被引用为 `translation-dashboard.png`。重写器从输出文件的目录回溯到源目录（`../../docs/`）计算每个文件的前缀，生成 `../../docs/translation-dashboard.png`。从 `translated-docs/docs/` 开始，这可以正确解析为 `docs/translation-dashboard.png`。

当仪表板 UI 更改时，使用 [`scripts/screenshot-translation-dashboard.sh`](../../docs/../scripts/screenshot-translation-dashboard.sh) 刷新 PNG；该图像不是区域设置特定的。

当出现以下情况时，仍然需要 `postProcessing` 规则：
- 资源通过绝对 URL 引用（例如 `/img/figure.png`）——重写器仅处理相对路径
- 您想出于其他原因更改资源 URL（例如，切换到 CDN）

<a id="implementation-example"></a>
### 实现示例

此存储库在翻译仪表板截图中使用了模式 A：[GETTING_STARTED.md](GETTING_STARTED.zh-Hans.md#translation-dashboard) 引用同一文件夹中的图像 [translation-dashboard.png](../../docs/../docs/translation-dashboard.png)。[ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) 设置了 `docsOutput.style = "flat"` 和 `flatPreserveRelativeDir: true`；每个文件的深度前缀可以解析屏幕截图 `regexAdjustments` 的图像路径。

---

<a id="pattern-b---per-locale-folder-url-rewriting"></a>
## 模式 B - 按区域设置的文件夹（URL 重写）

用于 README/USER-GUIDE（带 `docsOutput.style = "flat"`）和文档系统站点（`docsOutput.style = "doc-system"` 或别名 `"docusaurus"` / `"astro-starlight"`），这些站点从共享的静态 URL 树提供屏幕截图。

<a id="directory-layout"></a>
### 目录布局

<details>
<summary>示例按区域设置的屏幕截图目录树</summary>

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

源 Markdown 引用源区域设置目录：

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### 屏幕截图脚本约定

`take-screenshots` 脚本必须为每个区域设置编写文件——不仅仅是源区域设置。`translate-docs` 命令重写路径但不创建文件。常见模式：

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

请参阅 [examples/nextjs-app](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh) 中的简单 `bash` 示例，或 [Transrewrt 项目](https://github.com/wsj-br/transrewrt) 存储库中的 [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 的更复杂示例。

> **注意：** 下面的四个子部分共享相同的 `regexAdjustments` 区域设置段交换（`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`）。唯一不同的是输出布局以及扁平链接重写器是否首先运行——跳转到与您的 `docsOutput.style` 匹配的子部分。

<a id="config---docsoutputstyle--flat"></a>
### 配置 - `docsOutput.style = "flat"`

当 `docsOutput.style = "flat"` 时，扁平链接重写器首先运行，并为非 Markdown URL 添加深度前缀。对于存储库根目录中的 `README.md` 和 `outputDir: "translated-docs/"`，它会添加 `../`：

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

然后，`regexAdjustments` 规则会替换该已添加前缀的 URL 中的区域设置段：

<details>
<summary>示例正则表达式调整以适应扁平布局</summary>

```json
"docsOutput": {
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

结果：`../images/screenshots/de/translate.png` — 从 `translated-docs/README.de.md` 返回到仓库根目录的正确相对路径。

`postProcessing` 步骤在扁平链接重写器之后运行。编写 `search` 模式以匹配已添加前缀的 URL 中任何位置的区域设置段 — 无需在模式中包含 `../` 前缀。

实现示例（生产）：[Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) 中的屏幕截图 URL（`images/screenshots/en-GB/…`），[ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) 中的区域设置重写，捕获脚本 [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)（参见上文的 [屏幕截图脚本约定](#screenshot-script-contract)）。

实现示例（演示配置）：[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的第二个 `docs[]` 块（`images/screenshots/[^/]+/` → `${translatedLocale}`）；辅助脚本 [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh)。

<a id="config---docsoutputstyle--doc-system"></a>
### 配置 - `docsOutput.style = "doc-system"`

通用模式 B，适用于通过共享静态 URL 前缀引用屏幕截图的任何文档系统站点。扁平链接重写器不运行；`postProcessing` 重写原始 Markdown URL 中的区域设置段。

<details>
<summary>示例正则表达式文档系统布局的调整</summary>

```json
"docsOutput": {
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

将 `localeSubpath` 设置为匹配生成器布局中 `{locale}/` 和翻译文件之间的路径，或者在默认值适用时使用预设别名（`"docusaurus"`、`"astro-starlight"`）而不是 `"doc-system"`。源 Markdown 通常会在 URL 中嵌入源区域设置：

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

在每个目标区域设置的相同路径下提供匹配的 PNG 文件（例如 `static/img/screenshots/de/screenshot.png`）。优先使用 `screenshots/[^/]+/` 而不是硬编码 `screenshots/en-GB/`，以便规则在 `sourceLocale` 更改时得以保留。

<a id="preset---docsoutputstyle--docusaurus"></a>
### 预设 - `docsOutput.style = "docusaurus"`

与 `"doc-system"` 相同，使用默认 `localeSubpath = "docusaurus-plugin-content-docs/current"`。扁平链接重写器不运行。`postProcessing` 看到原始 Markdown URL。英文页面通常使用带源区域设置的绝对路径：

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>示例正则表达式 Docusaurus 预设的调整</summary>

```json
"docsOutput": {
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

在 `docs-site/static/img/screenshots/<locale>/screenshot.png` 处提供匹配的 PNG 文件。对于与源区域设置无关的配置，请优先使用 `screenshots/[^/]+/` 而不是 `screenshots/en-GB/`。

实现示例：[examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md)（`/img/screenshots/en-GB/screenshot.png`），位于 [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的第一个 `docs[]` 块。

<a id="preset---docsoutputstyle--astro-starlight"></a>
### 预设 - `docsOutput.style = "astro-starlight"`

与 `"doc-system"` 相同，使用 `localeSubpath: ""` — 翻译后的页面直接位于 `{outputDir}/{locale}/` 下。与上述通用文档系统配置相同的模式 B 原理。源 Markdown 使用 `/img/screenshots/en-GB/screenshot.png`：

<details>
<summary>示例正则表达式 Astro Starlight 预设的调整</summary>

```json
"docsOutput": {
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

<a id="pattern-c---colocated-raster-doc-system"></a>
## 模式 C - 同位栅格（`doc-system`）

当一个 `doc-system` 站点将特定于区域设置的资源与翻译后的 markdown 并置时使用 — 无需进行 URL 重写。Docusaurus 预设 (`docsOutput.style = "docusaurus"`) 是参考实现；其他使用 `"doc-system"` 和自定义 `localeSubpath` 的生成器遵循相同的思路：英文资源位于源区域设置路径下，翻译后的资源位于 `{outputDir}/{locale}/[localeSubpath/]assets/` 下。

<a id="directory-layout-1"></a>
### 目录结构

<details>
<summary>示例并置资源目录树（Docusaurus）</summary>

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

每个区域设置的所有文档都使用相同的相对路径：

```markdown
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

对于英文（`en-GB`）区域设置，`../assets/` 通过符号链接解析到 `static/assets/`。对于翻译后的区域设置，它直接解析到该区域设置自己的 `current/assets/` 目录。

<a id="screenshot-script-contract-1"></a>
### 截图脚本约定

脚本必须将 PNG 文件写入每个区域设置的正确目录。`getScreenshotDir` 函数对此进行编码：

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

请参阅 [duplistatus](https://github.com/wsj-br/duplistatus) 存储库中的生产实现 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)（本地参考副本：[references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts))。

<a id="config"></a>
### 配置

光栅文件不需要 `regexAdjustments` 规则。`translate-docs` 会翻译 markdown 中的 alt 文本，但 URL 保持不变：

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

如果项目还使用翻译后的 SVG，模式 E 会处理它们，并且它们会与 PNG 文件一起出现在 `current/assets/` 中，无需额外的正则表达式。

<a id="prerequisites"></a>
### 先决条件

- 必须存在 `docs/assets` 符号链接：`ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack 默认会跟随符号链接（Docusaurus 构建中 `resolve.symlinks` 默认为 `true`）
- 符号链接仅在源区域设置中存在即可 — 翻译后的构建不使用它

<a id="implementation-example-1"></a>
### 实现示例

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 中的 `getScreenshotDir(locale)`；英文文档引用并置的 PNG（例如 [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md) 中的 `../assets/screen-dashboard-summary.png`）；[ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) 中没有 PNG `regexAdjustments`。同一项目中的模式 E SVG 会出现在相同的 `current/assets/` 目录中（见下文）。

---

<a id="pattern-d---translated-svg-with-svgstyle--flat"></a>
## 模式 D - 带 `svg.style = "flat"` 的翻译 SVG

当 Web 应用嵌入特定于区域设置的 SVG 插图或图表并在运行时按区域设置代码引用它们时使用。

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

`translate-svg` 读取 `images/` 下的每个 `.svg` 并为每个区域设置写入一个文件：

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

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 中的 `svg` 块（`sourcePath: "images"`、`outputDir: "public/assets"`、`svg.style = "flat"`）；源文件 [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg)；按语言环境输出至 [public/assets/](../../docs/../examples/nextjs-app/public/assets/)（例如 `translation_demo_svg.de.svg`）；[page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) 中的运行时 URL（`/assets/translation_demo_svg.${locale}.svg`）。

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
## 模式 E - 共置的翻译后 SVG（文档系统）

适用于文档系统类网站，翻译后的 SVG 插图需与各语言环境内容目录中的翻译文档并列存放——位置与模式 C 的光栅截图相同。Docusaurus 预设是主要示例。

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

`translate-svg` 将每个语言环境的一个 SVG 写入与模式 C 用于 PNG 文件相同的 `current/assets/` 目录中：

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### 源 Markdown

所有语言环境的文档均使用相同的相对路径：

```markdown
![Diagram](../../docs/../assets/diagram.svg)
```

对于英语语言环境，符号链接 `docs/assets → ../static/assets` 会解析此路径。对于翻译后的语言环境，则直接解析为 `current/assets/`。

不需要 `regexAdjustments` 规则，因为英文源文档和翻译后输出文档使用完全相同的路径。

<a id="svg-source-location"></a>
### SVG 源文件位置

建议：将源 SVG 文件与 en-GB 的 PNG 文件一起存储在 `documentation/static/assets/` 中。这可将所有文档资源集中存放，并且相同的 `docs/assets` 符号链接可同时覆盖两者。然后 `svg.sourcePath` 条目指向 `documentation/static/assets/name.svg`。

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` 占位符

| 占位符              | 值                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir` 的绝对解析路径              |
| `{locale}`               | 目标语言环境代码                                     |
| `{LOCALE}`               | 大写的语言环境代码                                 |
| `{relPath}`              | 从 `sourcePath` 根目录到源 SVG 的相对路径 |
| `{stem}`                 | 不含扩展名的文件名                             |
| `{basename}`             | 包含扩展名的文件名                                |
| `{extension}`            | 包含点的扩展名                                |
| `{relativeToSourceRoot}` | 从最近的 `sourcePath` 根目录开始的相对路径       |

在 [svg 配置表](GETTING_STARTED.zh-Hans.md#svg) 中可查阅完整参考。

<a id="implementation-example-3"></a>
### 实现示例

[duplistatus](https://github.com/wsj-br/duplistatus) — 嵌套的 `svg` 块，其中包含 [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) 中的 `pathTemplate`；源 SVG 列在 `documentation/static/img/` 下方（例如 [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)）；`translate-svg` 将每个区域设置的文件写入 `documentation/i18n/<locale>/…/current/assets/` 目录旁边的模式 C PNG 文件；文档目前通过 `/img/duplistatus_*.svg` 嵌入它们（例如 [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)）。请参阅 [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md) 以了解计划迁移到 `../assets/` 路径并移除 SVG `regexAdjustments` 桥接。

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## 扁平链接重写器和两步流程

对于 `docsOutput.style = "flat"`（并且除非设置了 `rewriteRelativeLinks: false` 或自定义 `pathTemplate`），在 `postProcessing` 之前会运行一个内置的重写器。它会处理跨文档链接（添加区域设置后缀）并为非 markdown 资源 URL 添加深度前缀。

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"` 时的两步流程

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

在仓库根目录中，使用 `outputDir: "translated-docs/"` 和源 `README.md` 的示例：

1. 扁平链接重写器：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`（为 `translated-docs/` 创建一个 `../`）
2. `postProcessing` 正则表达式 `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`：`../images/screenshots/de/foo.png`

对于 `docsOutput.style = "doc-system"`（包括 `"docusaurus"`、`"astro-starlight"` 和 `"nested"`），扁平链接重写器不会运行。`postProcessing` 会看到翻译后的 markdown 中的原始 URL（通常是像 `/img/screenshots/en-GB/foo.png` 这样的绝对路径）。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### 使用 `flatPreserveRelativeDir` 进行逐文件深度前缀

深度前缀是为每个输出文件计算的，而不是为整个批次全局计算。对于每个源文件，重写器会计算从输出文件目录回溯到源文件目录的相对路径，并将其用作前缀。

这意味着使用 `flatPreserveRelativeDir: true` 时，子目录中的源文件会自动获得正确的前缀。例如，`docs/GETTING_STARTED.md` 输出到 `translated-docs/docs/GETTING_STARTED.<locale>.md`。逐文件前缀是 `../../docs/`，因此资源 `translation-dashboard.png`（相对于源文件）将变为 `../../docs/translation-dashboard.png` — 这可以从 `translated-docs/docs/` 正确解析回 `docs/translation-dashboard.png`。

对于与源文件并排的相对路径资源，不需要进行 `postProcessing` 正则表达式校正。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 和 `linkRewriteDocsRoot`

| 选项                                   | 效果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | 显式启用或禁用扁平链接重写器（在 `docsOutput.style = "flat"` 时覆盖默认值） |
| `docsOutput.linkRewriteDocsRoot`     | 计算 `depthPrefix` 的根目录（默认 `"."`）                                                        |
| `docsOutput.flatPreserveRelativeDir` | 影响输出路径布局，重写器在计算已知翻译文件的目标路径时会使用该布局       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
## 常见错误和故障排除

**截图路径中缺少区域设置目录**
`images/screenshots/screenshot.png` — 无法区分区域设置变体，也无法重写。在应用模式 B 之前，请重构为 `images/screenshots/<locale>/screenshot.png`。

**正则表达式中硬编码了源区域设置**
如果 `sourceLocale` 发生更改，`"search": "screenshots/en-GB/"` 将会静默失败。请改用 `"search": "screenshots/[^/]+/"`。

**SVG 源文件和输出文件在同一目录中**
如果 `svg.sourcePath` 和 `svg.outputDir` 发生重叠，生成的文件将与手动编辑的源文件混淆。请将它们保留在单独的目录中。

**Docusaurus 中绝对静态 URL 用于并置的 SVG**
`/img/diagram.svg`（来自 `static/img/`）需要 `regexAdjustments` 规则才能在翻译后的输出中重写为 `../assets/`。将源 SVG 放在 `static/assets/` 中，并从一开始就使用相对 `../assets/diagram.svg`，以完全避免这种情况。

**Docusaurus 中缺少 `docs/assets` 符号链接**
没有符号链接，`docs/user-guide/` 中的源文档无法通过相对路径引用 `static/assets/` 中的 PNG 或 SVG。在项目创建时设置符号链接：`ln -s ../static/assets documentation/docs/assets`。

**`take-screenshots` 脚本仅捕获源区域设置**
模式 B 需要每个区域设置都有 PNG 文件。如果脚本仅捕获 `en-GB`，则翻译后的文档将具有指向丢失文件的重写路径。
