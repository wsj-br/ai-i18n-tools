<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# ai-i18n-tools 对资产做了什么（和没做什么）

`translate-docs` 会翻译 markdown/MDX 内容（包括图像的 alt 文本），但它不会复制、生成或输出光栅文件。如果翻译后的页面需要特定于区域设置的屏幕截图，您必须将该文件放置在翻译后的 markdown 将引用的路径下。

`translate-svg` 是唯一会输出特定于区域设置的二进制文件的命令。它读取源 SVG 文件，翻译文本元素（`<text>`、`<title>`、`<desc>`），并为每个区域设置生成一个输出 SVG。该工具从不写入光栅文件（PNG、JPEG、WebP、GIF）。

---

<a id="design-for-i18n-from-the-start"></a>
# 从一开始就为国际化设计

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

通用 `[^/]+` 正则表达式匹配任何区域设置文件夹名称 — 不要硬编码您的源区域设置（例如 `screenshots/en-GB/`），因为如果 `sourceLocale` 发生更改，这会破坏。

如果您从省略区域设置子目录 (`images/screenshots/translate.png`) 的路径开始，则需要先重组整个树，然后才能进行[按区域设置文件夹](/zh-Hans/guide/images-and-screenshots/per-locale-folder)重写。

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### 文档系统站点（`docsOutput.style = "doc-system"`）

用于将翻译后的页面存储在区域设置前缀树下的静态文档站点——Docusaurus i18n、Astro Starlight 以及遵循相同结构的自定义生成器。`docsRoot` 下的文件将写入：

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

将 `docs[].docsOutput.docsRoot` 设置为您的英文源根目录（例如 `"docs"` 或 `"src/content/docs"`）。当您直接设置 `style: "doc-system"` 时，您还必须将 `localeSubpath` 设置为您的站点在 `{locale}/` 和翻译文件之间使用的路径段。别名 `"docusaurus"`、`"astro-starlight"` 和 `"vitepress"` 是预设的 `doc-system` 布局，具有默认的 `localeSubpath` 值（请参阅[输出布局](/zh-Hans/guide/documents/output-layouts)）。

| 预设别名 | 默认 `localeSubpath` | 示例输出 |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (空) | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""`（空） | `docs/de/guide/quick-start.md` |

扁平链接重写器**不会**为 `doc-system` 运行（与 `"flat"` 不同）。`postProcessing.regexAdjustments` 会看到源 Markdown 中的原始 URL — 通常是绝对路径或站点根路径，例如 `/img/screenshots/en-GB/foo.png`。

**按区域设置文件夹**布局适用于屏幕截图位于共享静态 URL 树中的情况：从第一天起就使用区域设置编码的文件夹和一个通用的 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` 规则（请参阅[配置 — 文档系统](#config---docsoutputstyle--doc-system)）。

**并置屏幕截图**适用于每个区域设置的翻译文档将资产存储在 Markdown 旁边（无 URL 重写）的情况。您的屏幕截图脚本必须将 PNG 写入从 `{outputDir}`、`{locale}` 和 `{localeSubpath}` 派生的路径 — 下面的 Docusaurus 预设是参考布局。

<a id="docusaurus-preset"></a>
#### Docusaurus 预设

在项目初始化时养成两个习惯，可彻底避免后续使用正则表达式进行路径桥接：

1. 在添加任何截图之前，先创建一个符号链接 `documentation/docs/assets → ../static/assets`。Docusaurus 的 webpack 默认支持跟随符号链接，这样源文档可以使用相对路径，翻译后的文档也能沿用相同的路径。

2. 将所有文档资源（PNG 和 SVG 文件）统一存放在 `static/assets/` 目录中。不要将它们分别放在 `static/img/`（SVG）和 `static/assets/`（PNG）中。统一存放后，无论是英文文档还是翻译文档，都可以使用相同的相对路径 `../assets/name.ext` 引用资源。

在源 Markdown 文件中引用资源时，始终使用稳定的相对路径 `../assets/name.ext`。切勿使用绝对路径 `/img/` 或 `/assets/` URL —— 这些 URL 在英文源文档（从 `static/` 提供服务）和翻译语言版本（与翻译文档共置）之间会不同，从而迫使你必须使用 `regexAdjustments` 规则来桥接路径。

当您稍后添加 i18n 时，屏幕截图脚本采用 `getScreenshotDir` 分割（请参阅[并置屏幕截图](/zh-Hans/guide/images-and-screenshots/colocated-screenshots)），并且 `translate-svg` 使用 `pathTemplate`。无需调整正则表达式。

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
# 决策指南

**该资产是否为带有可翻译文本或标签的SVG？**
  - **是** → [Web 应用程序 SVG](/zh-Hans/guide/svg-translation/translated-svg-web-app) 或 [同位置 SVG](/zh-Hans/guide/svg-translation/translated-svg-colocated)
  - **否** (光栅截图或装饰性 SVG) →
    - **文档系统站点具有与翻译文档同位置的资产？**
      - **是** → [同位置截图](/zh-Hans/guide/images-and-screenshots/colocated-screenshots) (光栅) + [同位置 SVG](/zh-Hans/guide/svg-translation/translated-svg-colocated) (SVG)
    - **仅一个区域需要该图像** (无区域变体)？
      - **是** → [共享图像](/zh-Hans/guide/images-and-screenshots/shared-image)
    - **否则** → [区域文件夹](/zh-Hans/guide/images-and-screenshots/per-locale-folder)

SVG 布局在[SVG 翻译](/zh-Hans/guide/svg-translation/)指南中介绍。

| 布局                                                                        | 资产类型                  | 站点类型                                                              | 工具机制                                                 |
|------------------------------------------------------------------------------|-----------------------------|------------------------------------------------------------------------|--------------------------------------------------------------|
| [同位置截图](/zh-Hans/guide/images-and-screenshots/colocated-screenshots) | 光栅 (同位置)          | `"doc-system"` 同位置资产 (Docusaurus 预设)               | 截图脚本放置文件；无正则表达式                     |
| [按区域设置文件夹](/zh-Hans/guide/images-and-screenshots/per-locale-folder) | 栅格（按区域设置） | `"flat"` 或 `"doc-system"`（包括 `"docusaurus"`、`"astro-starlight"`） | `regexAdjustments` 区域设置段交换 |
| [共享图像](/zh-Hans/guide/images-and-screenshots/shared-image)                   | 光栅 (共享)             | `docsOutput.style = "flat"` 文档                                       | 每文件链接重写；通常无正则表达式                     |
| [并置 SVG](/zh-Hans/guide/svg-translation/translated-svg-colocated) | SVG（已翻译，并置） | `"doc-system"` 与并置资产 (Docusaurus 预设) | `translate-svg` 与 `svg.style = "nested"` + `pathTemplate` |
| [Web 应用程序 SVG](/zh-Hans/guide/svg-translation/translated-svg-web-app) | SVG（已翻译） | Web 应用程序 | `translate-svg` 与 `svg.style = "flat"` |
