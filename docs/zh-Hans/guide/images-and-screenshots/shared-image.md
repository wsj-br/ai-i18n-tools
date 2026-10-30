<a id="shared-raster"></a>
# 共享栅格

当所有语言区域共享同一张图片（没有按语言区域的变体）时使用。

- `docsOutput.style = "flat"` — 扁平链接重写器会根据每个输出文件计算深度前缀，因此源文件旁边的相对资产（例如，从 `docs/page.md` 中引用为 `figure.png` 的 `docs/figure.png`）在每个翻译输出中都能正确解析 — 不需要 `postProcessing.regexAdjustments` 规则。当源文件位于子目录中时，请启用 `flatPreserveRelativeDir: true` 以便输出路径保留源树结构（参见 [Per-file depth prefix](/zh-Hans/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)）。
- `docsOutput.style = "vitepress"`（以及其他带有链接规范器的文档系统预设）— 当 URL 在每个区域设置中都相同时，站点根目录的绝对路径（例如 `/translation-dashboard.png`）保持不变 — 不需要 `regexAdjustments` 规则。

**扁平示例：** 某项目将 `docs/guide/quick-start.md` 翻译为 `translated-docs/docs/guide/quick-start.<locale>.md`。此处假设 `flatPreserveRelativeDir: true`，因此 `docs/guide/quick-start.md` 输出到 `translated-docs/docs/guide/quick-start.<locale>.md`（而非 `translated-docs/quick-start.<locale>.md`）。同级图片 `docs/translation-dashboard.png` 从 `quick-start.md` 中以 `../translation-dashboard.png` 的方式引用。重写器根据输出文件所在目录回溯到源目录（`../../docs/`）来计算按文件的前缀，生成 `../../docs/translation-dashboard.png`。从 `translated-docs/docs/guide/` 出发，该路径能正确解析回 `docs/translation-dashboard.png`。

在以下情况下，仍然需要 `postProcessing` 规则：
- 资产通过 `docsOutput.style = "flat"` 中的绝对 URL 引用（例如 `/img/figure.png`）— 扁平重写器只处理相对路径
- 您想出于其他原因更改资产 URL（例如，切换到 CDN）

<a id="implementation-example"></a>
### 实现示例

本仓库自身的文档使用共享图片的绝对 URL 变体：[翻译仪表板指南](/zh-Hans/guide/translation-dashboard/)将其截图引用为 `![Translation Dashboard](/translation-dashboard.png)` — 一个从 [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png) 提供的绝对站点根路径。由于该 URL 对每个语言区域都相同，因此无需 `postProcessing.regexAdjustments` 规则。
