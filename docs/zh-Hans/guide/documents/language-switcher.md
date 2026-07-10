<a id="language-switcher-languagelistblock"></a>
# 语言切换器 (`languageListBlock`)

使用 `docsOutput.postProcessing.languageListBlock` 时，翻译的 markdown 文件应包括一个 **"阅读其他语言"** 行链接 —— 每个语言区域一个链接，具有相对于每个输出文件的 `href` 值。

此存储库将其用于 [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md)（`translated-docs/` 下的平面输出）。在 `translate-docs` 之后，每个翻译副本都会获得一个刷新的块；例如，[translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) 链接到 `translated-docs/` 下的同级区域设置文件，并链接回存储库根目录的英文源。

需要 `docsOutput.style = "flat"`（或可以通过相对路径寻址同级区域设置文件的其他布局）。请参阅[输出布局](/zh-Hans/guide/documents/output-layouts)。

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. 在源 Markdown 中标记块

将切换器包装在由 `start` 和 `end` 子字符串标记分隔的 HTML（或任何行）中。此存储库使用：

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/zh-Hans/) · [Deutsch](./README.de.md) · …</small>
```

初始链接文本只是一个占位符。`translate-docs` 会替换从包含 `start` 的第一行到包含 `end` 的第一行之后的整个切片（在围起来的代码块中的标记将被忽略，因此同一文件中的配置示例不会匹配）。

<a id="2-configure-the-block"></a>
## 2. 配置块

`start` 和 `end` 是任意的子字符串标记 — 它们不必是 `<small id="lang-list">` / `</small>`。选择仅出现在语言切换器切片中的任何开始和结束文本：另一个 HTML 标签 (`<div class="lang-switcher">` … `</div>`)、HTML 注释 (`<!-- lang-list -->` … `<!-- /lang-list -->`) 或仅限 Markdown 的边界（例如，一行 `**Languages:**` 到一行 `---`）。在配置中设置 `start` 和 `end` 以精确匹配您在源文件中放置的内容。

根配置 ([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json))：

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| 字段       | 作用                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | 标识块开始行的子字符串                                                  |
| `end`       | 结束行上的子字符串（当两者都出现在一行时，可以与 `start` 相同）             |
| `separator` | 生成的 `[label](href)` 链接之间的文本（此仓库使用 `" · "`）                                    |
| `label`     | 可选：`"local"`（默认）使用清单中的每个区域设置的本地名称；`"english"` 使用 `englishName` |

<a id="3-what-happens-at-runtime"></a>
## 3. 运行时发生的情况

1. **提取** — 语言列表切片**不会**发送给模型（`translatable: false`）。
2. **每个翻译文件** — 在分段翻译和可选的扁平链接重写之后，`postProcessing` 会重建块：每个区域设置一个 Markdown 链接，标签来自 `ui-languages.json`（如果存在）（否则是捆绑的主目录，否则是 `localeDisplayNames`），路径相对于正在写入的文件。
3. **源刷新** — 在完成 `translate-docs` / `sync` 文档传递后，相同的规范块会被写回 **英文源文件**中的 `contentPaths`，因此添加一个区域设置可以在不手动编辑每个链接的情况下更新仓库中的切换器。

如果文件没有匹配的块，CLI 会记录一个警告（当 `--verbose` 时）并保持正文不变。

<a id="4-label-manifest"></a>
## 4. 标签清单

对于内名标签（`label: "local"`），通过 `generate-ui-languages` 生成或维护 `ui-languages.json`（写入 [`languagesManifestPath`](/zh-Hans/reference/configuration#languagesmanifestpath-optional)，默认为 `{ui.flatOutputDir}/ui-languages.json`）。此仓库的仅文档配置没有 UI 流水线，磁盘上也没有项目清单，因此标签来自 `sourceLocale` + `targetLocales` 的内置主目录。

<a id="5-examples-in-this-repository"></a>
## 5. 此存储库中的示例

| 示例                            | 文件                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 本包（扁平 README + VitePress 站点） | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)（README 块：`docsOutput.style = "flat"`；站点块：`docsOutput.style = "vitepress"` + `vitepressThemeCatalog`） |
| 平面 README + Docusaurus 文档 | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (第二个块: `docsOutput.style = "flat"`; 第一个块: `docsOutput.style = "docusaurus"`) |
| 仅限 Docusaurus 文档               | [examples/docusaurus-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json) (`docsOutput.style = "docusaurus"` + `docusaurusCatalogDir`) |
| VitePress 文档（最小演示）      | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |

`<small id="lang-list">` 前面的那一行（例如 `**Read in other languages:**`）是一个正常的、可翻译的片段，并在每个目标区域设置中本地化；只有标记内的链接行会逐字重新生成，除了 `href` 和清单驱动的标签。
