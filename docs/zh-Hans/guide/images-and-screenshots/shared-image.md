<a id="shared-raster"></a>
# 共享栅格

当单个图片在所有区域设置中共享时（无区域设置特定变体）。当 `docsOutput.style = "flat"` 时，扁平链接重写器会根据每个输出文件计算深度前缀，因此与源文件相邻的资源（例如，从 `docs/page.md` 引用为 `figure.png` 的 `docs/figure.png`）可以在每个翻译输出中正确解析 — 无需 `postProcessing.regexAdjustments` 规则。

示例：一个项目将 `docs/guide/quick-start.md` 翻译为 `translated-docs/docs/guide/quick-start.<locale>.md`。一个同级图像 `docs/translation-dashboard.png` 从 `quick-start.md` 中被引用为 `../translation-dashboard.png`。重写器计算从输出文件目录到源目录（`../../docs/`）的每个文件前缀，生成 `../../docs/translation-dashboard.png`。从 `translated-docs/docs/guide/`，这可以正确解析回 `docs/translation-dashboard.png`。

当出现以下情况时，仍然需要 `postProcessing` 规则：
- 资源通过绝对 URL 引用（例如 `/img/figure.png`）——重写器仅处理相对路径
- 您想出于其他原因更改资源 URL（例如，切换到 CDN）

<a id="implementation-example"></a>
### 实现示例

此存储库自己的文档使用共享图像的绝对 URL 变体：[翻译仪表板指南](/zh-Hans/guide/translation-dashboard/) 将其屏幕截图引用为 `![Translation Dashboard](/translation-dashboard.png)` — 一个从 [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png) 提供的绝对站点根路径。由于每个区域设置的 URL 都相同，因此不需要 `postProcessing.regexAdjustments` 规则；当仪表板 UI 更改时，使用 [`scripts/screenshot-translation-dashboard.sh`](https://github.com/wsj-br/ai-i18n-tools/tree/main/scripts/screenshot-translation-dashboard.sh) 刷新 PNG。
