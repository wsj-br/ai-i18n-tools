<a id="svg-translation"></a>
# SVG 翻译

专为包含人类可读标签的 **SVG 插图和图表**而设计。`translate-svg` 命令读取源 `.svg` 文件，从 `<text>`、`<title>` 和 `<desc>` 元素中提取文本，通过活动的 LLM 提供程序翻译这些字符串，并为 **每个目标语言环境写入一个输出 SVG**。

这是唯一一个发出特定于语言环境的 **二进制** SVG 文件的管道。`translate-docs` 翻译 Markdown 替代文本和链接引用，但它不修改或复制 SVG 资产。当页面需要带有翻译标签的图表时，启用 `features.translateSVG` 并配置顶级 `svg` 块。

<a id="per-locale-model-overrides"></a>
### 每个区域模型覆盖

`translate-svg` 解析模型 **按目标区域设置**：`localeModels(locale)` 配置后优先使用，然后是 `translationModels`。每个区域设置的 SVG 运行使用自己的回退链——当 CJK 区域设置中的图表标签需要脚本调整的模型时（例如 `ja`），这非常有用。参见 [提供程序和模型](/guide/providers-and-models#model-fallback-chain)。

SVG 翻译使用与 `translate-docs` 和 `translate-json` (`cacheDir`) 相同的 SQLite 缓存。已翻译的文本段从缓存中提供；只有新的或更改的源文本才会发送到 LLM。

<a id="when-to-use-svg-translation"></a>
### 何时使用 SVG 翻译

在以下情况下使用 `translate-svg`：

- SVG 包含可见的标签、标题或描述，这些内容必须根据语言环境进行更改。
- Web 应用程序在运行时加载特定于语言环境的图表文件（例如 `dashboard.de.svg`）。
- 文档系统站点（Docusaurus、Astro Starlight、VitePress）将翻译后的 SVG 与翻译后的 Markdown 并置。

**不**使用 `translate-svg` 来进行：

- 没有可翻译文本的装饰性 SVG（图标、徽标、背景）。
- 栅格截图（PNG、JPEG、WebP）——这些通过[图像和截图](/guide/images-and-screenshots/)处理。
- 嵌入到路径数据而不是 `<text>` 元素中的文本——提取器无法读取路径轮廓。

<a id="design-for-i18n-from-the-start"></a>
### 从一开始就为国际化设计

从一开始就将标签作为真实的文本元素，SVG 最容易翻译：

- 将人类可读的文本放入 `<text>`、`<title>` 和 `<desc>` 中。
- 避免在设计工具中将标签转换为路径——路径数据对翻译器来说是不透明的。
- 将 **源 SVG** 放在一个专用目录中，与 `svg.outputDir` 分开。混合源文件和生成的语言环境文件使得无法判断哪些文件可以安全编辑或重新生成。

对于 Web 应用程序，当您的设计使用全小写标签时，启用 `forceLowercase: true`——它避免了跨文件系统和 CDN 的大小写敏感性不匹配。

<a id="output-layouts"></a>
### 输出布局

`translate-svg` 支持两种常见的输出形式。根据您的应用程序或文档站点在运行时如何引用 SVG 文件进行选择。

| 布局 | `svg.style` | 最适合 | 子指南 |
|--------|-------------|----------|-------------|
| **扁平（Web 应用程序）** | `"flat"` | Next.js、Vite 和其他通过语言环境编码文件名嵌入 SVG 的应用程序 | [Web 应用程序（扁平 SVG）](/guide/svg-translation/translated-svg-web-app) |
| **并置（文档系统）** | `"nested"` + `pathTemplate` | Docusaurus 和其他文档系统站点，其中翻译资产与翻译页面并置 | [并置 SVG](/guide/svg-translation/translated-svg-colocated) |

**扁平布局** 将文件（例如 `public/assets/diagram.de.svg`）写入 `diagram.en-GB.svg` 旁边。您的应用程序使用语言环境后缀引用它们：

```tsx
<img src={`/assets/diagram.${locale}.svg`} alt="Architecture diagram" />
```

**并置布局** 将每个语言环境的 SVG 写入该语言环境的内容树（例如 `i18n/de/.../assets/diagram.svg`）。源 Markdown 和翻译后的 Markdown 使用相同的相对路径 (`../assets/diagram.svg`)——不需要 `regexAdjustments` 规则。

有关 SVG 布局如何与栅格截图策略配合使用的信息，请参阅[图像和截图决策指南](/guide/images-and-screenshots/#decision-guide)。

<a id="step-1-enable-and-configure"></a>
### 步骤 1：启用和配置

启用该功能并将 `translate-svg` 指向您的源文件和输出根目录：

```json
{
  "features": {
    "translateSVG": true
  },
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

关键 `svg` 字段：

- `sourcePath` — 一个或多个目录或全局模式（例如 `"images/*.svg"`、`"**/icons/*.svg"`）。从项目根目录递归扫描。
- `outputDir` — 翻译后的 SVG 输出的根目录。
- `style` — 当您不使用自定义 `pathTemplate` 时为 `"flat"` 或 `"nested"`。
- `pathTemplate` — 可选的自定义输出路径，带有占位符 `{outputDir}`、`{locale}`、`{llocale}`、`{basename}`、`{stem}` 等（对于并置文档系统布局是必需的）。
- `forceLowercase` — 重组时的小写翻译文本。

完整字段参考：[配置 — `svg`](/reference/configuration#svg)。

<a id="step-2-translate"></a>
### 步骤 2：翻译

```bash
npx ai-i18n-tools translate-svg
```

翻译单个区域设置：

```bash
npx ai-i18n-tools translate-svg --locale de
```

不写入文件预览：

```bash
npx ai-i18n-tools translate-svg --dry-run
```

当 `features.translateSVG` 和 `svg` 都设置时，`sync` 会自动运行 SVG 步骤（使用 `--no-svg` 跳过）。共享标志包括 `-l` / `--locale`、`-p` / `--path`、`-j` / `--concurrency` 和 `--force` / `--force-update`。

<a id="troubleshooting"></a>
### 故障排除

常见的 SVG 问题——混合源/输出目录、Docusaurus 上的绝对静态 URL 以及路径布局错误——在 [SVG 故障排除](/guide/svg-translation/troubleshooting) 中有介绍。有关栅格资产和链接重写，请参阅 [图像和屏幕截图故障排除](/guide/images-and-screenshots/troubleshooting)。
