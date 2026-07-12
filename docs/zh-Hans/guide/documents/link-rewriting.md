<a id="link-rewriting"></a>
# 链接重写

`translate-docs` 重写翻译后的 Markdown 中的 URL，以便在文件移动到特定于语言环境的路径后，链接仍然能够解析。大多数跨页面链接都会自动处理；当您的站点使用共享的静态 URL 树或语言环境编码的资产文件夹时，请添加 `docsOutput.postProcessing.regexAdjustments` 规则。

有关截图目录布局、扁平深度前缀 + 区域设置切换流程，以及特定于布局的资源示例，请参阅[图像与截图 — 链接重写](/zh-Hans/guide/images-and-screenshots/link-rewriting)。

<a id="built-in-rewriters"></a>
## 内置重写器

运行哪个重写器取决于 `docsOutput.style`：

| 布局 | 内置重写器 | 修复内容 |
| --- | --- | --- |
| `"flat"`（没有自定义 `pathTemplate` 时的默认值） | 平面链接重写器 (`rewriteRelativeLinks`，默认开启) | 跨页面相对链接 (`guide.md` → `guide.de.md`) 和非 Markdown 资产 URL 的深度前缀 |
| `"vitepress"` | VitePress 链接规范化器 (`rewriteVitepressLinks`，默认开启) | README 风格的 `docs/guide/…` 路径 → 站点路由 (`/guide/…`) |
| `"nextra"` | Nextra 链接规范化器（`rewriteNextraLinks`，默认开启） | `content/en/…` 和相对 `.mdx` 路径 → 区域设置中立路由（`/guide/…`） |
| `"fumadocs"` | Fumadocs 链接规范化器（`rewriteFumadocsLinks`，默认开启） | `content/docs/…` 和相对 `.mdx` 路径 → 区域设置中立路由（`/docs/…`） |
| `"doc-system"`、`"docusaurus"`、`"astro-starlight"` | 无 | 源 URL 在 `postProcessing` 之前保持不变 |

自定义 `pathTemplate` 会禁用平面重写器，除非您明确设置 `rewriteRelativeLinks: true`。有关跨页面 `#anchor` 处理，请参阅[输出布局](/zh-Hans/guide/documents/output-layouts)和[锚点链接](/zh-Hans/guide/documents/anchor-links)。

有关 VitePress 特定的编写规则，请参阅 [VitePress 集成 — 链接约定](/zh-Hans/guide/integrations/vitepress#link-conventions)。

有关 Nextra 特定的编写规则，请参阅 [Nextra 集成 — 链接约定](/zh-Hans/guide/integrations/nextra#link-conventions)。

有关 Fumadocs 特定的编写规则，请参阅 [Fumadocs 集成 — 链接约定](/zh-Hans/guide/integrations/fumadocs#link-conventions)。

<a id="postprocessingregexadjustments"></a>
## `postProcessing.regexAdjustments`

当内置重写器不足时，在 `docs[].docsOutput.postProcessing` 下添加有序的 `{ "description"?, "search", "replace" }` 规则 — 例如：

- 包含 **语言环境文件夹段** 的屏幕截图或图像 URL (`screenshots/en-GB/` → `screenshots/de/`)
- 英语源和翻译输出树之间不同的绝对站点根路径 (`/img/…`)
- 任何必须按目标语言环境更改但不是简单相对 Markdown 链接的 URL 模式

`postProcessing` 在 **重新组装的翻译 Markdown 正文**（YAML 前置内容键和非散文值保留）上运行。它在段落重新组装和内置链接重写**之后**执行，并在 `addFrontmatter`**之前**执行。

<a id="two-step-flow-with-flat-layout"></a>
### 平面布局的两步流程

当 `docsOutput.style = "flat"` 时，平面链接重写器首先运行，然后是 `regexAdjustments`：

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

在仓库根目录中，使用 `outputDir: "translated-docs/"` 和源 `README.md` 的示例：

1. 平面重写器：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments`：`images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

编写 `search` 模式以匹配 **已加前缀的 URL 中的语言环境段** — 您无需在正则表达式中包含 `../` 深度前缀。

对于 `doc-system` 布局，平面重写器不运行。`regexAdjustments` 会看到源 Markdown 中的原始 URL（通常是像 `/img/screenshots/en-GB/foo.png` 这样的绝对路径）。

有关深度前缀行为和 `flatPreserveRelativeDir`，请参阅[平面链接重写器和两步流程](/zh-Hans/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow)。

<a id="replace-placeholders"></a>
### `replace` 占位符

`replace` 字符串支持按文件和区域设置扩展的模板变量：

| 占位符 | 值 |
| --- | --- |
| `${translatedLocale}` | 目标区域设置（规范化的 BCP-47） |
| `${sourceLocale}` | 源区域设置 |
| `${sourceFullPath}` | 绝对源文件路径 (POSIX `/`) |
| `${translatedFullPath}` | 绝对翻译输出路径 |
| `${sourceFilename}` / `${translatedFilename}` | 带扩展名的基本名称 |
| `${sourceBasedir}` / `${translatedBasedir}` | 源文件/输出文件的父目录 |

`search` 是一个正则表达式模式。普通字符串使用 `g` 标志；当您需要其他标志时，请使用 `/pattern/flags`（模式不得包含未转义的 `/` 字符）。

<a id="common-patterns"></a>
## 常见模式

<a id="per-locale-asset-folder"></a>
### 按区域设置的资产文件夹

从一开始就将资产存储在按区域设置编码的子目录下，并使用一个通用规则交换该段：

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

使用 `[^/]+` 而不是硬编码您的源区域设置 (`en-GB`)，这样如果 `sourceLocale` 发生更改，该规则仍然有效。

完整演练：[图像和屏幕截图 — 按区域设置的文件夹](/zh-Hans/guide/images-and-screenshots/per-locale-folder)。

<a id="doc-system-static-urls"></a>
### 文档系统静态 URL

对于 Docusaurus、Starlight 或其他从共享静态树提供屏幕截图的 `doc-system` 站点：

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

如果您的生成器支持，请在源 Markdown 中优先使用并置的相对路径 (`../assets/name.png`) — 这样就不需要 `regexAdjustments` 桥接。有关布局选择，请参阅[图像和屏幕截图](/zh-Hans/guide/images-and-screenshots/)。

<a id="when-regex-is-not-needed"></a>
### 何时不需要正则表达式

在以下情况下，您通常**不需要** `regexAdjustments`：

- 跨页面链接是简单的相对 Markdown 路径和 `docsOutput.style = "flat"`（内置重写器添加区域设置后缀）
- 资产位于源文件旁边，并且扁平重写器的每个文件深度前缀正确解析它们
- 英语和每个翻译副本使用**相同**的 URL（站点根目录下的共享图像、并置资产、规范化器后的 VitePress 站点路由）
- VitePress 站内链接使用站点路由或带有 `rewriteVitepressLinks: true` 的 `docs/guide/…` 路径
- Nextra 和 Fumadocs 页内链接使用区域设置中立路由（`/guide/…`、`/docs/…`）或带有 `rewriteNextraLinks` / `rewriteFumadocsLinks: true` 的内容根路径

<a id="full-config-example"></a>
## 完整配置示例

带有每个区域设置屏幕截图和可选语言切换块的扁平 README：

<details>
<summary>扁平布局：regexAdjustments + languageListBlock</summary>

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
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

字段参考：[配置 — `docs`](/zh-Hans/reference/configuration#docs) (`docsOutput.postProcessing`)。

<a id="troubleshooting"></a>
## 故障排除

| 症状 | 可能原因 | 检查内容 |
| --- | --- | --- |
| 翻译页面在图像或静态资产上出现 404 错误 | 您的 URL 布局缺少或错误的 `regexAdjustments` | [图像和屏幕截图 — 故障排除](/zh-Hans/guide/images-and-screenshots/troubleshooting) |
| 链接打开正确的文件但 `#section` 错误 | 锚点 slug 漂移，而不是 URL 重写 | [锚点链接](/zh-Hans/guide/documents/anchor-links) |
| `regexAdjustments` 规则对扁平布局无效 | `search` 期望重写器前的 URL，但扁平布局已添加了深度前缀 | 匹配带前缀路径中的段（请参阅[两步流程](#two-step-flow-with-flat-layout)） |
| 运行时跳过无效的正则表达式 | 格式错误的 `search` 模式 | CLI 会发出规则 `description` 警告；针对示例翻译输出测试模式 |
