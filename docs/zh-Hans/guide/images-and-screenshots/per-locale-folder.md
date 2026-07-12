<a id="per-locale-folder-url-rewriting"></a>
# 每个区域设置的文件夹（URL 重写）

用于带有 `docsOutput.style = "flat"` 的 README/USER-GUIDE，以及用于从共享静态 URL 树提供截图的文档系统站点（`docsOutput.style = "doc-system"` 或别名 `"docusaurus"` / `"astro-starlight"`）和 `"vitepress"` / 其他文档系统预设。VitePress 的链接重写详情：[链接重写 — VitePress](/zh-Hans/guide/images-and-screenshots/link-rewriting#vitepress-link-normalizer-style-vitepress)。

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
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### 屏幕截图脚本约定

`take-screenshots` 脚本必须为每个区域设置（而不仅仅是源区域设置）写入文件。`translate-docs` 命令会重写路径，但不会创建文件。一个典型的辅助程序：

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

请参阅 [examples/nextjs-app 中的截图脚本](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh) 中的简单 `bash` 示例，或 [duplistatus](https://github.com/wsj-br/duplistatus) 项目中 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 的更复杂示例（[Transrewrt](https://github.com/wsj-br/transrewrt) 也在生产环境中使用）。

> **注意：** 以下四个小节共享相同的 `regexAdjustments` 语言环境段替换（`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`）。唯一的区别在于输出布局以及扁平链接重写器是否首先运行——请跳转到与您的 `docsOutput.style` 匹配的小节。
>
> **注意：** `regexAdjustments` 在完整的翻译 markdown 正文上运行，包括围栏代码块。如果文档页面嵌入了包含匹配路径的配置示例（例如 `screenshots/en-GB/`），该代码段也将在翻译输出中被重写。在可重用示例中首选通用的 `screenshots/[^/]+/` 形式。

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

`postProcessing` 步骤在平面链接重写器之后运行。编写 `search` 正则表达式，以匹配已加前缀的 URL 中任意位置的区域设置段 — 无需在正则表达式中包含 `../` 前缀。

实现示例（生产环境）：[Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) 中的截图 URL (`images/screenshots/en-GB/…`)，[ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) 中的语言环境重写，基于 duplistatus 的 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) 的捕获脚本（参见上方的[截图脚本契约](#screenshot-script-contract)）。

实施示例（演示配置）：[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) 中的第二个 `docs[]` 块（`images/screenshots/[^/]+/` → `${translatedLocale}`）；辅助脚本 [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh)。

<a id="config---docsoutputstyle--doc-system"></a>
### 配置 - `docsOutput.style = "doc-system"`

对于任何通过共享静态 URL 前缀引用屏幕截图的文档系统站点，采用相同的每个区域设置文件夹方法。平面链接重写器不运行；`postProcessing` 重写原始 markdown URL 中的区域设置段。

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
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

在每个目标区域设置的相同路径下提供匹配的 PNG 文件（例如 `static/img/screenshots/de/screenshot.png`）。优先使用 `screenshots/[^/]+/` 而不是硬编码 `screenshots/en-GB/`，以便规则在 `sourceLocale` 更改时得以保留。

<a id="preset---docsoutputstyle--docusaurus"></a>
### 预设 - `docsOutput.style = "docusaurus"`

与 `"doc-system"` 相同，使用默认 `localeSubpath = "docusaurus-plugin-content-docs/current"`。扁平链接重写器不运行。`postProcessing` 看到原始 Markdown URL。英文页面通常使用带源区域设置的绝对路径：

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
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

实现示例：[examples/docusaurus-docs/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) 配合 [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json)。

<a id="preset---docsoutputstyle--astro-starlight"></a>
### 预设 - `docsOutput.style = "astro-starlight"`

与 `"doc-system"` 和 `localeSubpath: ""` 相同 — 翻译页面直接位于 `{outputDir}/{locale}/` 下。与上述通用文档系统配置相同的每个区域设置文件夹方法。源 markdown 使用 `/img/screenshots/en-GB/screenshot.png`：

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

在 `public/img/screenshots/<locale>/screenshot.png` 处提供 PNG。`${translatedLocale}` 占位符使用您的配置语言环境字符串（例如 `pt-BR`）。`astro-starlight` 预设默认将语言环境 **输出路径** 小写（`pt-br/`），但 `public/img/screenshots/` 下的静态资产文件夹应与写入 markdown URL 的语言环境段匹配——保持截图目录与 `${translatedLocale}` 对齐，而不一定与 Astro 路由大小写对齐。

实施示例：[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) — [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) 和 [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`)。
