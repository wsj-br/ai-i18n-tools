<a id="svg-troubleshooting"></a>
# SVG 故障排除

另请参阅[图片和屏幕截图故障排除](/zh-Hans/guide/images-and-screenshots/troubleshooting)。

- **可缩放矢量图形源文件和输出文件位于同一目录** — 将 `svg.sourcePath` 和 `svg.outputDir` 分开。
- **共置可缩放矢量图形使用绝对 Docusaurus 静态网址** — 从一开始就使用相对 `../assets/` 路径。
- **翻译后出现意外结束标签 `text` 与 `g`** — Inkscape 经常会在真实标签旁生成空的自闭合 `<text … />`。较旧的抽取器正则表达式会从这些内容一直匹配到下一个 `</text>`，并写入一个多余的结束标签。升级并重新运行 `translate-svg`（或 `sync`）以重新生成本地化可缩放矢量图形。
- **印地语、阿拉伯语、中日韩或西里尔字母可缩放矢量图形中出现罗马化或仅拉丁字母标签** — 适用于文档的同一书写系统策略也适用于此；下一次 `translate-svg` / `sync` 时会拒绝错误文字的缓存行。使用全局 `--debug-failed` 重新运行，以便在 `cacheDir` 下为**每个**被丢弃的模型写入一份 `FAILED-TRANSLATION` 日志（提示词、原始输出、脚本错误），而不是仅在所有模型都失败时才写入。请参阅[印地语、阿拉伯语、中日韩或西里尔字母输出被罗马化](/zh-Hans/guide/documents/troubleshooting#hindi-arabic-cjk-or-cyrillic-output-is-romanized-latin-letters)。
