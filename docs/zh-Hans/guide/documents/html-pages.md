<a id="html-pages"></a>
# HTML 页面

`translate-docs` 可以为每个语言区域生成一个 HTML 文件。将 `.html` 或 `.htm` 文件放在 `docs[]` `contentPaths` 条目上，然后运行 `translate-docs` 或 `sync`。英文文件保持为源文件。语言区域副本将写入 `outputDir` 下。

当每种语言对应独立的页面时（如静态站点、一组手写的 HTML 文档），请使用此方式。如果只有一个 HTML 文件且浏览器从扁平 JSON 中替换字符串，请使用[纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html)。

使用以下命令搭建脚手架：

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

可运行的演示为 [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs)（端口 3092）。

<a id="what-is-translated"></a>
## 翻译的内容

翻译的内容：可见文本、`alt`、`title`、`aria-label`、`placeholder`、`<title>`、`meta name="description"` 以及 `og:title` / `og:description`。

保持不变的内容：`script`、`style`、`textarea`、`pre` 和 `code` 元素，以及 `src`、`href` 和其他 URL。包含 `<code>` 或 `<em>` 的段落会保留这些标签，仅翻译周围的文本。

`html lang` 和 `dir` 在语言区域文件上进行设置。英文源文件保留其自身的 `lang`，直到您对其进行更改。

如果生成的语言区域文件位于 `outputDir`（`pt-BR/` 目录或扁平的 `name.pt-BR.html`）下，则在下次运行时会被跳过。如果同一个 `.html` 文件同时也是 UI 目录源（`ui.sourceRoots`），则会打印警告。

<a id="links-and-images"></a>
## 链接和图像

指向同一 `docs[]` 块中其他 HTML 页面的链接会被重写为该页面的语言区域输出。其他相对 URL 会添加前缀，以便它们仍能从语言区域文件中正确解析。

当存在特定于语言区域的文件时，`docsOutput.localizedAssets` 可选择性地重命名图像和图标。CSS `url()` 不会被重写。

```json
"localizedAssets": {
  "include": ["img/**"],
  "pattern": "{stem}-{locale}{ext}",
  "onlyIfExists": true
}
```

| 占位符 | 含义 |
| --- | --- |
| `{stem}` | 不含扩展名的文件名 |
| `{ext}` | 扩展名，包含点号 |
| `{basename}` | 包含扩展名的文件名 |
| `{locale}` | 配置的语言区域代码（`pt-BR`） |
| `{llocale}` | 小写语言区域 |
| `{LOCALE}` | 大写语言区域 |

使用上述模式的 `img/trulli.jpg` 将变为 `img/trulli-pt-BR.jpg`。使用 `onlyIfExists: true`（默认值）时，如果缺少该文件，则保留原始 URL。绝对 URL、`data:` URL 和 `#` 片段会被跳过。根相对 URL（`/img/trulli.jpg`）会在 `assetRoot` 下进行测试，如果省略 `assetRoot`，则在 HTML 文件的目录下进行测试。

`srcset`、`poster`、`<source src>`、图标 `<link>` URL 以及 `og:image` / `twitter:image` 使用相同的规则。

对于 HTML，在添加语言区域文件夹之前，会从项目相对路径中移除 `docsOutput.docsRoot`。对于 `docsRoot: "site"` 和 `style: "nested"`，`site/index.html` 会写入 `site/pt-BR/index.html`。

<a id="language-list-and-hreflang"></a>
## 语言列表与 hreflang

每个语言区域副本和英文源文件上都会填入两对注释（以便备用链接保持相互引用）：

```html
<nav>
  <ul>
    <!-- ai-i18n:lang-list -->
    <!-- /ai-i18n:lang-list -->
  </ul>
</nav>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
```

`script`、`style`、`pre` 和 `code` 内部的标记会被忽略。在详细模式下运行时，如果页面没有对应的注释对，则会发出警告。如果省略 `docsOutput.html`，则使用相同的注释作为默认值。

```json
"html": {
  "languageList": {
    "format": "links",
    "label": "local",
    "separator": " · "
  },
  "hreflang": {
    "siteUrl": "https://example.com",
    "xDefault": "en",
    "stripIndexHtml": true
  }
}
```

`format: "links"` 会写入 `<a>` 元素。在 `<ul>`、`<ol>` 或 `<nav>` 内部，每个链接都包裹在 `<li>` 中。`format: "select"` 会写入 `<option>` 行。将标记放入您自己的 `<select data-lang-select>` 中并加载 `lang-select.js`（以 `ai-i18n-tools/html-runtime/lang-select.js` 形式提供，并在示例中复制）。一个代码块使用一种格式。

`label` 为 `local`（本地名称）、`english` 或 `both`（当它们不同时为 `English / endonym`）。不在配置集中的语言区域将被省略。

`hreflang.siteUrl` 为备用链接添加前缀。如果未设置，链接将是相对路径，并会记录警告。`xDefault` 默认为 `sourceLocale`。`stripIndexHtml` 会将 `index.html` 转换为目录 URL。

没有站点地图文件，没有自动 `<head>` 注入，也没有 `canonical` 或 `og:locale` 重写。浏览器语言不会重定向访问者。

<a id="second-run"></a>
## 第二次运行

句子翻译会保留在缓存中。文件跟踪哈希还包括语言区域列表和 `docsOutput.html` / `localizedAssets`。添加语言区域会重写语言列表和 hreflang 块，即使每个句子都已被缓存。如果哈希匹配且输出文件是最新的，则会跳过该页面。
