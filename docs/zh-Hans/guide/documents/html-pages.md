<a id="html-pages"></a>
# HTML 页面

当静态站点需要为每个语言区域提供一个翻译后的 `.html` 或 `.htm` 文件时，请使用 Documents 管道。`translate-docs` 会翻译源页面，重写其相对链接，并将语言区域副本写入 `outputDir` 下。无需浏览器 i18n 运行时或 `data-i18n*` 标记。

如果只有一个 HTML 文件保持原位，且浏览器脚本会即时从扁平 JSON 中替换字符串，请改用[纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html)。不要将同一个文件同时放入两个管道中；当 HTML 文件同时作为 `docs[]` 源和 `ui.sourceRoots` 目录源时，CLI 会发出警告。

可运行的 [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) 站点在端口 3092 提供英语服务，并将葡萄牙语写入 `site/pt-BR/`。

<a id="quick-start"></a>
## 快速开始

搭建一个可用的配置：

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

或者将此 HTML 部分添加到已具有 LLM [提供程序](/zh-Hans/guide/providers-and-models) 的 `ai-i18n-tools.config.json` 中：

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": {
    "translateDocs": true,
    "translateUIStrings": false
  },
  "docs": [
    {
      "description": "Static HTML pages",
      "contentPaths": ["site/"],
      "outputDir": "site",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "nested",
        "docsRoot": "site",
        "localizedAssets": {
          "include": ["img/**"],
          "pattern": "{stem}-{locale}{ext}",
          "onlyIfExists": true
        },
        "html": {
          "languageList": {
            "format": "links",
            "label": "local"
          },
          "hreflang": {
            "siteUrl": "https://example.com",
            "xDefault": "en",
            "stripIndexHtml": true
          }
        }
      }
    }
  ]
}
```

`docsRoot` 应为 `contentPaths` 内的源树。在插入语言区域目录之前，它会被剥离。使用上述配置：

```text
site/index.html       → site/pt-BR/index.html
site/about.html       → site/pt-BR/about.html
```

可选地将[语言列表和 hreflang 标记](#language-list-and-hreflang)添加到每个源页面，然后运行：

```bash
ai-i18n-tools translate-docs
# Or run every enabled pipeline:
ai-i18n-tools sync
```

该命令还会刷新源语言文件中的标记内部内容。请将 `outputDir` 下的语言区域文件视为生成的输出；编辑源页面并重新运行该命令。

<a id="what-is-translated"></a>
## 翻译的内容

HTML 提取器会翻译：

- 包含字母的可见文本，包括 `<title>` 以及内联标记周围的文本
- `alt`、`title`、`aria-label` 和 `placeholder` 属性值
- `<input type="submit">` 和 `<input type="button">` 上的 `value`
- `meta name="description"`、`meta property="og:title"` 和 `meta property="og:description"` 上的 `content`

在翻译周围句子时，会保留 `<a>`、`<em>`、`<strong>`、`<span>`、`<img>` 和 `<br>` 等内联元素。类似代码的内联元素（如 `<code>` 和 `<kbd>`）将保持完整：

```html
<p>Run <code>pnpm build</code> before deployment.</p>
```

整个 `script`、`style`、`textarea`、`pre` 和 `code` 子树会被原样复制。其他属性——包括 `class`、`id`、`src`、`href` 和包含 URL 的元数据——不会发送给模型。

在每个语言区域副本上，管道会设置 `<html lang="…">` 和该语言区域的 `dir`（`ltr` 或 `rtl`）。源页面保留其编写的 `lang` 和 `dir`。请使用 UTF-8 HTML；当 `<meta charset>` 声明了其他编码时，CLI 会发出警告。

<a id="output-layout"></a>
## 输出布局

对于常规的静态站点布局，请设置：

```json
{
  "outputDir": "site",
  "docsOutput": {
    "style": "nested",
    "docsRoot": "site"
  }
}
```

`style: "nested"` 写入 `{outputDir}/{locale}/{path relative to docsRoot}`。`style: "flat"` 写入带有语言区域后缀的文件，例如 `site/about.pt-BR.html`。有关所有样式和自定义路径模板，请参阅[输出布局](/zh-Hans/guide/documents/output-layouts)。

`outputDir` 下生成的语言区域目录和扁平语言区域文件名将从未来的源发现中排除。这可以防止 `site/pt-BR/index.html` 或 `site/index.pt-BR.html` 被再次翻译。

<a id="links-and-images"></a>
## 链接和图像

当以 `.html` 或 `.htm` 结尾的相对链接的目标是同一 `docs[]` 块中的另一个源页面时，这些链接会被重写。查询字符串和片段会被保留。例如，`site/index.html` 中的 `href="about.html#history"` 在 `site/pt-BR/index.html` 中会变为 `href="./about.html#history"`。

其他相对 `href`、`src`、`srcset` 和 `poster` URL 会添加深度前缀，以便共享文件仍能从语言区域页面解析。绝对 URL、协议相对 URL、`data:` URL 和仅包含片段的链接保持不变。根相对 URL 保持根相对。

`docsOutput.localizedAssets` 可以选择特定于语言区域的图像或图标文件名：

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

`img/trulli.jpg` 变为 `img/trulli-pt-BR.jpg`。使用 `onlyIfExists: true`（默认值）时，仅当本地化文件存在时才使用该 URL；否则保留原始共享资源。仅当其他构建或 CDN 步骤保证这些文件存在时，才设置 `onlyIfExists: false`。

`include` 匹配诸如 `img/**` 之类的 URL 路径。使用 `assetRoot` 设置用于检查本地化候选项（尤其是诸如 `/img/trulli.jpg` 之类的根相对 URL）的文件系统目录。

相同的本地化规则适用于 `srcset`、`poster`、`<source src>`、图标 `<link href>` 以及 `og:image` / `twitter:image`。管道会重写引用，但不会创建、翻译或复制资源文件。CSS `url()` 值不会被重写。

<a id="language-list-and-hreflang"></a>
## 语言列表与 hreflang

将语言列表对放在可见导航所属的位置，并将 hreflang 对放在 `<head>` 内：

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

在每次运行时，管道仅替换每对标记之间的内容。它会更新每个语言版本副本和源页面，保持备用链接相互对应。`script`、`style`、`pre` 和 `code` 内的标记会被忽略。启用 `--verbose` 后，当缺少配置的对时，CLI 会发出警告。

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

即使省略 `docsOutput.html`，默认注释也能正常工作。仅当源使用不同的标记文本时，才设置 `languageList.start` / `end` 或 `hreflang.start` / `end`。

<a id="visible-language-navigation"></a>
### 可见语言导航

- `format: "links"` 写入 `<a>` 元素。在 `<ul>`、`<ol>` 或 `<nav>` 内，每个链接都包裹在 `<li>` 中；在其他位置，`separator` 用于连接链接。
- `format: "select"` 写入 `<option>` 行。将标记放在您自己的 `<select data-lang-select>` 内，将 `node_modules/ai-i18n-tools/dist/html-runtime/lang-select.js` 复制到站点中，并加载该经典脚本。它会导航到所选选项生成的 URL。
- `label` 为 `local`（本地名称）、`english` 或 `both`（当它们不同时为 `English / endonym`）。标签优先来自 `ui-languages.json`（如果可用），其次来自包捆绑的语言列表。

一个标记块使用一种格式。生成的链接包含 `lang`、`hreflang` 和 `aria-current`；为当前页面生成的选项具有 `selected`。

<a id="search-engine-alternates"></a>
### 搜索引擎替代链接

`hreflang.siteUrl` 为备用 URL 添加前缀。在部署前将其设置为站点的公共源。省略它时，管道会写入相对备用链接并记录警告。

`xDefault` 默认为 `sourceLocale`；仅当为该页面配置了该语言版本时才会输出。`stripIndexHtml: true` 将 `index.html` 备用链接转换为目录 URL。

标记块是必需的：管道不会自动将标签注入 `<head>`。它也不会生成站点地图、规范 URL 或 `og:locale`，并且不会根据浏览器语言进行重定向。

只有配置的源语言版本和目标语言版本才有资格用于语言块。当存在 `ui-languages.json` 时，其行和顺序决定了哪些符合条件的语言版本会出现，因此请保持清单与配置一致。如果您使用 `--locale` 进行翻译以仅生成子集，请在每个链接的语言版本输出都存在之前不要发布。

<a id="second-run"></a>
## 第二次运行

句子翻译保留在缓存中。文件跟踪哈希还包括语言版本列表、输出样式、`docsOutput.html` 和 `localizedAssets`。添加语言版本或更改这些选项会重写生成的块和链接，即使每个句子都已缓存。匹配的哈希和最新的输出文件会跳过该语言版本页面。

<a id="troubleshooting"></a>
## 故障排除

| 症状 | 检查项 |
| --- | --- |
| 输出为 `site/pt-BR/site/index.html` | 将 `docsOutput.docsRoot` 设置为 `"site"`，以便剥离源前缀。 |
| 链接仍指向英文页面 | 使用相对 `.html` / `.htm` 链接，并将目标页面包含在同一个 `docs[]` 块中。 |
| 从语言版本页面访问时图片路径失效 | 保持相对路径以便应用深度重写；请记住 CSS `url()` 不会被重写。 |
| 未选择本地化图片 | 检查 `localizedAssets.include`、文件名 `pattern`，以及当 `onlyIfExists` 为 true 时候选项是否存在。 |
| 语言列表为空或未更改 | 保持两个标记注释顺序正确，并位于 `script`、`style`、`pre` 和 `code` 之外。 |
| 下拉菜单无法跳转 | 将 `data-lang-select` 添加到 `<select>` 并加载 `html-runtime/lang-select.js`。 |
| Hreflang URL 使用了错误的主机 | 将 `hreflang.siteUrl` 设置为最终的公共源站。 |
| 已翻译的页面被重复翻译 | 将生成的语言环境文件保留在配置的 `outputDir` 下；请勿将其作为单独的源添加。 |
