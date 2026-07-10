<a id="colocated-translated-svg-doc-system"></a>
# 并置翻译的 SVG（文档系统）

用于文档系统网站，翻译的SVG插图必须与翻译的文档一起出现在每个本地化内容目录中 —— 与[同位置的截图](/zh-Hans/guide/images-and-screenshots/colocated-screenshots)相同。Docusaurus预设是主要示例。

<a id="config"></a>
### 配置

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` 将每个本地化的SVG文件写入与同位置的截图使用的PNG文件相同的 `current/assets/` 目录中：

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### 源 Markdown

所有语言环境的文档均使用相同的相对路径：

```markdown
![Diagram](../assets/diagram.svg)
```

对于英语语言环境，符号链接 `docs/assets → ../static/assets` 会解析此路径。对于翻译后的语言环境，则直接解析为 `current/assets/`。

不需要 `regexAdjustments` 规则，因为英文源文档和翻译后输出文档使用完全相同的路径。

<a id="svg-source-location"></a>
### SVG 源文件位置

建议：将源 SVG 文件与 en-GB 的 PNG 文件一起存储在 `documentation/static/assets/` 中。这可将所有文档资源集中存放，并且相同的 `docs/assets` 符号链接可同时覆盖两者。然后 `svg.sourcePath` 条目指向 `documentation/static/assets/name.svg`。

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` 占位符

| 占位符              | 值                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir` 的绝对解析路径              |
| `{locale}`               | 目标语言环境代码                                     |
| `{LOCALE}`               | 大写的语言环境代码                                 |
| `{relPath}`              | 从 `sourcePath` 根目录到源 SVG 的相对路径 |
| `{stem}`                 | 不含扩展名的文件名                             |
| `{basename}`             | 包含扩展名的文件名                                |
| `{extension}`            | 包含点的扩展名                                |
| `{relativeToSourceRoot}` | 从最近的 `sourcePath` 根目录开始的相对路径       |

完整参考在 [SVG 配置表](/zh-Hans/reference/configuration#svg) 中。

<a id="implementation-example"></a>
### 实现示例

[duplistatus](https://github.com/wsj-br/duplistatus) —— 嵌套的 `svg` 块，包含 `pathTemplate` 在 [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json) 中；源SVG文件列在 `documentation/static/img/` 下（例如 [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/img/duplistatus_toolbar.svg)）；`translate-svg` 将每个本地化文件写入 `documentation/i18n/<locale>/…/current/assets/` 中，与同位置的PNG文件一起；文档现在通过 `/img/duplistatus_*.svg` 嵌入（例如 [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md)）。请参阅 [task-locale-assets-simplification.md](https://github.com/wsj-br/duplistatus/blob/master/dev/task-locale-assets-simplification.md) 以了解计划将 `../assets/` 路径和删除SVG `regexAdjustments` 桥接的详细信息。

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
