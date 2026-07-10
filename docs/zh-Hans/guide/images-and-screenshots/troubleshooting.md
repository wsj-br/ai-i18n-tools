<a id="common-mistakes-and-troubleshooting"></a>
# 常见错误和故障排除

**屏幕截图路径中没有区域设置目录**
`images/screenshots/screenshot.png` — 无法区分区域设置变体，也无法重写。在使用[按区域设置文件夹](/zh-Hans/guide/images-and-screenshots/per-locale-folder)重写之前，请重构为`images/screenshots/<locale>/screenshot.png`。

**正则表达式中硬编码了源区域设置**
如果 `sourceLocale` 发生更改，`"search": "screenshots/en-GB/"` 将会静默失败。请改用 `"search": "screenshots/[^/]+/"`。

**SVG 源文件和输出文件在同一目录中**
如果 `svg.sourcePath` 和 `svg.outputDir` 发生重叠，生成的文件将与手动编辑的源文件混淆。请将它们保留在单独的目录中。

**Docusaurus 中绝对静态 URL 用于并置的 SVG**
`/img/diagram.svg`（来自 `static/img/`）需要 `regexAdjustments` 规则才能在翻译后的输出中重写为 `../assets/`。将源 SVG 放在 `static/assets/` 中，并从一开始就使用相对 `../assets/diagram.svg`，以完全避免这种情况。

**Docusaurus 中缺少 `docs/assets` 符号链接**
没有符号链接，`docs/user-guide/` 中的源文档无法通过相对路径引用 `static/assets/` 中的 PNG 或 SVG。在项目创建时设置符号链接：`ln -s ../static/assets documentation/docs/assets`。

**`take-screenshots`脚本仅捕获源区域设置**
按区域设置的文件夹布局要求每个区域设置都有PNG文件。如果脚本仅捕获`en-GB`，则翻译的文档将具有指向缺失文件的重写路径。
