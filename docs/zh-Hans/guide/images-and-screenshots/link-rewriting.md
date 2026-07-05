<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# 平面链接重写器和两步流

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

<a id="vitepress-link-normalizer"></a>
### VitePress 链接规范化器 (`style: "vitepress"`)

当 `docsOutput.rewriteVitepressLinks` 为 `true` 时（当 `style` 为 `"vitepress"` 时的默认值），在段重组后会运行一个单独的规范化器（而不是平面重写器）。它针对 VitePress / 文档系统站点，其中英文内容位于内容根目录，而本地化内容位于同级文件夹中（`docs/de/guide/…`）。

```
source href  →  [VitePress link normalizer]  →  [postProcessing]  →  output href
```

典型重写：

| 源模式 | 规范化目标 |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (来自本地化文件) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | 未更改（对仓库路径使用完整 URL） |

对于将 `README.md` 同步到 `docs/index.md` 的项目，请在 `README.md` 中使用完整的 GitHub URL，用于 `LICENSE`、`examples/` 以及 VitePress 树之外的其他文件。请参阅[VitePress 集成 — README 作为文档主页](/guide/vitepress-integration#readme-as-homepage)。

平面重写器和 VitePress 规范化器在每个 `docs[]` 块中是互斥的 — 在 `postProcessing` 之前只有一个运行。请参阅[VitePress 集成 — 链接约定](/guide/vitepress-integration#link-conventions)。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### 使用 `flatPreserveRelativeDir` 进行逐文件深度前缀

深度前缀是为每个输出文件计算的，而不是为整个批次全局计算。对于每个源文件，重写器会计算从输出文件目录回溯到源文件目录的相对路径，并将其用作前缀。

这意味着使用 `flatPreserveRelativeDir: true` 时，子目录中的源文件会自动获得正确的前缀。例如，`docs/guide/quick-start.md` 输出到 `translated-docs/docs/guide/quick-start.<locale>.md`。每个文件的前缀是 `../../docs/`，因此资产 `translation-dashboard.png`（源树的同级）变为 `../../docs/translation-dashboard.png` — 这可以从 `translated-docs/docs/guide/` 正确解析回 `docs/translation-dashboard.png`。

对于与源文件并排的相对路径资源，不需要进行 `postProcessing` 正则表达式校正。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 和 `linkRewriteDocsRoot`

| 选项                                   | 效果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | 显式启用或禁用扁平链接重写器（在 `docsOutput.style = "flat"` 时覆盖默认值） |
| `docsOutput.linkRewriteDocsRoot`     | 计算 `depthPrefix` 的根目录（默认 `"."`）                                                        |
| `docsOutput.flatPreserveRelativeDir` | 影响输出路径布局，重写器在计算已知翻译文件的目标路径时会使用该布局       |

---

<a id="common-mistakes-and-troubleshooting"></a>
