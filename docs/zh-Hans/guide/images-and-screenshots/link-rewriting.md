<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# 平面链接重写器和两步流

对于 `docsOutput.style = "flat"`（除非设置了 `rewriteRelativeLinks: false` 或自定义 `pathTemplate`），内置重写器会在 `postProcessing` 之前运行。它处理跨文档链接（添加区域设置后缀）并将深度前缀添加到非 Markdown 资产 URL。然后，区域设置特定的资产路径（屏幕截图、`/img/…` 桥接）由 `docsOutput.postProcessing.regexAdjustments` 重写。

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"` 时的两步流程

```
source URL  →  [flat link rewriter: depth prefix]  →  [regexAdjustments: locale segment]  →  output URL
```

在仓库根目录中，使用 `outputDir: "translated-docs/"` 和源 `README.md` 的示例：

1. 平面链接重写器：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`（`translated-docs/` 的一个 `../`）
2. `regexAdjustments` 规则 `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`：`../images/screenshots/de/foo.png`

对于 `docsOutput.style = "doc-system"`（包括 `"docusaurus"`、`"astro-starlight"` 和 `"nested"`），平面链接重写器不运行。`regexAdjustments` 会看到翻译后的 Markdown 中的原始 URL（通常是像 `/img/screenshots/en-GB/foo.png` 这样的绝对路径）。

<a id="vitepress-link-normalizer-style-vitepress"></a>
### VitePress 链接规范化器 (`style: "vitepress"`)

当 `docsOutput.rewriteVitepressLinks` 为 `true` 时（当 `style` 为 `"vitepress"` 时的默认值），在段重组后会运行一个单独的规范化器（而不是平面重写器）。它针对 VitePress / 文档系统站点，其中英文内容位于内容根目录，而本地化内容位于同级文件夹中（`docs/de/guide/…`）。

```
source href  →  [VitePress link normalizer]  →  [regexAdjustments]  →  output href
```

典型重写：

| 源模式 | 规范化目标 |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (来自本地化文件) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | 未更改（对仓库路径使用完整 URL） |

对于同步 `README.md` → `docs/index.md` 的项目，请在 `README.md` 中为 `LICENSE`、`examples/` 以及 VitePress 目录树之外的其他文件使用完整的 GitHub URL。请参阅 [VitePress 集成 — 将 README 作为文档主页](/zh-Hans/guide/integrations/vitepress#readme-as-homepage)。

扁平重写器和 VitePress 规范化器在每个 `docs[]` 块中互斥——在 `regexAdjustments` 之前仅运行其中一个。请参阅 [VitePress 集成 — 链接约定](/zh-Hans/guide/integrations/vitepress#link-conventions)。

<a id="nextra-link-normalizer-style-nextra"></a>
### Nextra 链接规范化器 (`style: "nextra"`)

当 `docsOutput.rewriteNextraLinks` 为 `true` 时（当 `style` 为 `"nextra"` 时的默认值），在片段重组后会运行一个单独的规范化器。它将 `content/en/…` 和相对 `.mdx` 路径重写为与区域设置无关的路由 (`/guide/…`)。请参阅 [Nextra 集成 — 链接约定](/zh-Hans/guide/integrations/nextra#link-conventions)。

<a id="fumadocs-link-normalizer-style-fumadocs"></a>
### Fumadocs 链接规范化器 (`style: "fumadocs"`)

当 `docsOutput.rewriteFumadocsLinks` 为 `true` 时（当 `style` 为 `"fumadocs"` 时的默认值），在片段重组后会运行一个单独的规范化器。它将 `content/docs/…` 和相对 `.mdx` 路径重写为与区域设置无关的路由 (`/docs/…`)。请参阅 [Fumadocs 集成 — 链接约定](/zh-Hans/guide/integrations/fumadocs#link-conventions)。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### 使用 `flatPreserveRelativeDir` 进行逐文件深度前缀

深度前缀是为每个输出文件计算的，而不是为整个批次全局计算。对于每个源文件，重写器会计算从输出文件目录回溯到源文件目录的相对路径，并将其用作前缀。

这意味着使用 `flatPreserveRelativeDir: true` 时，子目录中的源文件会自动获得正确的前缀。例如，`docs/guide/quick-start.md` 输出到 `translated-docs/docs/guide/quick-start.<locale>.md`。每个文件的前缀是 `../../docs/`，因此资产 `translation-dashboard.png`（源树的同级）变为 `../../docs/translation-dashboard.png` — 这可以从 `translated-docs/docs/guide/` 正确解析回 `docs/translation-dashboard.png`。

对于源文件旁边的相对路径资产，不需要进行 `regexAdjustments` 校正。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 和 `linkRewriteDocsRoot`

| 选项                                   | 效果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | 显式启用或禁用扁平链接重写器（在 `docsOutput.style = "flat"` 时覆盖默认值） |
| `docsOutput.linkRewriteDocsRoot`     | 计算 `depthPrefix` 的根目录（默认 `"."`）                                                        |
| `docsOutput.flatPreserveRelativeDir` | 影响输出路径布局，重写器在计算已知翻译文件的目标路径时会使用该布局       |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

在 `docs[].docsOutput.postProcessing` 下配置有序的 `{ "description"?, "search", "replace" }` 规则，以重写内置重写器不处理的图像、屏幕截图和其他资产 URL — 通常是交换区域设置文件夹段（`screenshots/en-GB/` → `screenshots/de/`）或桥接绝对静态路径（`/img/…` → `../assets/…`）。

规则在分段重组和内置链接重写（平面或 VitePress）之后、`addFrontmatter` 之前，在翻译后的 Markdown **正文**上运行。在平面布局上，针对应用深度前缀**之后**的 URL 编写 `search` 模式 — 匹配路径内的区域设置段，而不是开头的 `../`。

**按区域设置的屏幕截图文件夹（平面布局）：**

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

使用 `[^/]+` 而不是硬编码您的源区域设置 (`en-GB`)，这样规则在 `sourceLocale` 更改后仍然有效。最常见的占位符是 `${translatedLocale}`；`${sourceLocale}`、`${sourceFilename}`、`${translatedFilename}` 和路径变量也可用 — 请参阅[文档 — 链接重写](/zh-Hans/guide/documents/link-rewriting#replace-placeholders)。

特定于布局的示例（平面、文档系统、Docusaurus、Starlight）：[按区域设置的文件夹](/zh-Hans/guide/images-and-screenshots/per-locale-folder)。通用跨页链接规则：[文档 — 链接重写](/zh-Hans/guide/documents/link-rewriting)。字段参考：[配置 — `docs`](/zh-Hans/reference/configuration#docs)。

---

<a id="common-mistakes-and-troubleshooting"></a>

有关硬编码区域设置正则表达式、缺失的屏幕截图目录和 Docusaurus `/img/` 桥接，请参阅[常见错误和故障排除](/zh-Hans/guide/images-and-screenshots/troubleshooting)。
