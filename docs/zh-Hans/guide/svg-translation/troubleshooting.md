<a id="svg-troubleshooting"></a>
# SVG 故障排除

另请参阅[图片和屏幕截图故障排除](/zh-Hans/guide/images-and-screenshots/troubleshooting)。

- **SVG 源文件和输出在同一目录中** — 将 `svg.sourcePath` 和 `svg.outputDir` 分开。
- **并置 SVG 的 Docusaurus 静态绝对 URL** — 从一开始就使用相对 `../assets/` 路径。
- **翻译后出现意外的结束标签 `text` 与 `g`** — Inkscape 经常在实际标签旁边发出空的自闭合 `<text … />`。较旧的提取器正则表达式会跨越这些标签到下一个 `</text>` 并写入一个多余的结束符。升级并重新运行 `translate-svg`（或 `sync`）以重新生成区域设置 SVG。
- **印地语、阿拉伯语、CJK 或西里尔语 SVG 中的罗马化或仅拉丁语标签** — 适用与文档相同的书写系统策略；错误的脚本缓存行将在下一个 `translate-svg` / `sync` 上被拒绝。使用全局 `--debug-failed` 重新运行，以便在 `cacheDir` 下为**每个**被丢弃的模型（提示、原始输出、脚本错误）写入 `FAILED-TRANSLATION` 日志，而不仅仅是在所有模型都失败时。请参阅[印地语、阿拉伯语、CJK 或西里尔语输出被罗马化](/zh-Hans/guide/documents/troubleshooting#wrong-script-or-romanized-output)。
