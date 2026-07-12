<a id="output-layouts"></a>
# 输出布局

`docsOutput.style` 控制翻译后的 markdown 文件的写入位置。请在 `docs[].docsOutput.style` 中使用以下确切的字符串值。别名是预设的 `doc-system` 布局（或 Fumadocs 点后缀布局），而非独立的引擎——配置加载时可能会将别名 `style` 值重写为规范的 `"doc-system"`，同时在 `stylePreset` 中保留原始预设。

设置 `docs[].docsOutput.pathTemplate`（markdown/MDX）或 `jsonPathTemplate`（JSON 标签文件）可覆盖任何内置布局。请参阅下方的 [pathTemplate 占位符](#pathtemplate--jsonpathtemplate-placeholders)。

<a id="layout-overview"></a>
## 布局概览

| `docsOutput.style` | 引擎 | 典型用途 |
| --- | --- | --- |
| `"nested"` | 语言环境文件夹镜像完整源目录树 | 默认；`{outputDir}/{locale}/` 下的通用 i18n 输出 |
| `"flat"` | 文件名中的语言环境后缀（可选子目录） | README、更新日志、仓库根目录文档、[语言切换器](/zh-Hans/guide/documents/language-switcher) |
| `"doc-system"` | 语言环境文件夹 + `docsRoot` 下的可选 `localeSubpath` | 自定义静态文档生成器 |
| `"docusaurus"` | `doc-system` 预设 | [Docusaurus](/zh-Hans/guide/integrations/docusaurus) i18n 插件布局 |
| `"astro-starlight"` | `doc-system` 预设（`localeSubpath: ""`） | [Astro Starlight](/zh-Hans/guide/integrations/astro#astro-starlight)、普通 Astro 语言环境页面 |
| `"vitepress"` | `doc-system` 预设（`localeSubpath: ""`） | [VitePress](/zh-Hans/guide/integrations/vitepress) 与英文并列的语言环境文件夹 |
| `"nextra"` | `doc-system` 预设（`localeSubpath: ""`） | [Nextra](/zh-Hans/guide/integrations/nextra) 语言环境文件夹（`content/en/` → `content/{locale}/`） |
| `"fumadocs"` | 点后缀（默认）或当 `fumadocsParser: "dir"` 时的 `doc-system` | [Fumadocs](/zh-Hans/guide/integrations/fumadocs) 点或目录内容布局 |

<a id="nested-default"></a>
## `nested` (默认)

`docsOutput.style = "nested"`（省略时默认）——在 `{outputDir}/{locale}/` 下镜像源目录树。

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

位于 `docsRoot`（如果已设置）之外的路径使用相同的嵌套结构。

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"`——将翻译后的文件写入 `outputDir` 下，并在文件名中添加语言环境后缀。默认仅保留基本名（`{outputDir}/{stem}.{locale}{extension}`），因此 `docs/guide.md` 和 `docs/other/guide.md` 会发生冲突，除非启用 `flatPreserveRelativeDir`。

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

当 `docsOutput.style = "flat"` 时（除非设置了 `rewriteRelativeLinks: false` 或自定义 `pathTemplate`），页面之间的相对链接会自动重写。关于跨页面 `#anchor` 的处理，请参阅[锚点链接](/zh-Hans/guide/documents/anchor-links)。

<a id="flat-with-flatpreserverelativedir"></a>
### `flat` 与 `flatPreserveRelativeDir`

将 `docsOutput.flatPreserveRelativeDir` 设置为 `true` 可在 `outputDir` 下保留源子目录。当翻译多个位于不同文件夹但共享相同基本名的 markdown 文件时，或当扁平输出需要镜像浅层目录树时（例如仓库根目录的 README 加上 `docs/*.md`），请使用此选项。

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

扁平链接重写器在计算资源 URL 的深度前缀时使用每个文件的输出路径——请参阅[链接重写](/zh-Hans/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)。

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` — 用于静态文档站点的带区域设置前缀的文档树。`docsRoot` 下的文件写入到：

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docsRoot` 之外的路径回退到[嵌套](#nested)布局（`{outputDir}/{locale}/{relPath}`）。

将 `docs[].docsOutput.docsRoot` 设置为你的英文源根目录（例如 `"docs"`、`"src/content/docs"` 或 `"content/en"`）。当 `docsOutput.style = "doc-system"` 时，你必须显式设置 `localeSubpath`（预设请使用下方的别名）。当翻译页面直接位于 `{outputDir}/{locale}/` 之下时（Starlight 风格），请使用 `localeSubpath: ""`。

来自 `docusaurusCatalogDir` 的 Docusaurus shell JSON 以及 doc-system 预设下的其他 JSON 产物遵循与 markdown 相同的文件夹布局。当 `style: "flat"` 时，JSON 标签文件仍使用嵌套形式，除非你设置 `jsonPathTemplate`。

<a id="doc-system-aliases"></a>
## Doc-system 别名

**别名**（相同的 `doc-system` 引擎、预设 `localeSubpath` 和默认值）：

- `docsOutput.style = "docusaurus"` — `localeSubpath` 默认为 `docusaurus-plugin-content-docs/current`（Docusaurus i18n 插件布局）。
- `docsOutput.style = "astro-starlight"` — `localeSubpath` 默认为 `""`；`localePathLowercase` 默认为 `true`。翻译页面位于 `{outputDir}/{locale}/` 之下，当英文内容位于内容根目录且 `outputDir` 等于 `docsRoot` 时，与 [Starlight](https://starlight.astro.build/guides/i18n/) 匹配。也可用于普通 Astro 区域设置页面（`src/pages/index.astro` → `src/pages/{locale}/index.astro`）— 参见 [Astro 网站页面](/zh-Hans/guide/ui-strings/astro-website#pages-parse-and-replace)。
- `docsOutput.style = "vitepress"` — 与 `doc-system` 布局相同，但 `localeSubpath` 为空；保留 BCP-47 区域设置文件夹名称（`localePathLowercase` 默认为 `false`）。参见 [VitePress 集成](/zh-Hans/guide/integrations/vitepress)。
- `docsOutput.style = "nextra"` — 与 `doc-system` 布局相同，但 `localeSubpath` 为空；英文源位于区域设置文件夹下（例如 `content/en/`）。参见 [Nextra 集成](/zh-Hans/guide/integrations/nextra)。

Docusaurus 预设（主要的文档页面）：

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight 预设（相同的块形状，不同的路径）：

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

VitePress 预设（英文在内容根目录，区域设置文件夹在源文件旁边）：

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Nextra 预设（英语位于语言环境文件夹下，目标语言使用同级的语言环境文件夹）：

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

可选的 JSON 标签——来自 `docusaurusCatalogDir` 的 Docusaurus 壳字符串（非 MDX 正文内容）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight 为许多本地化版本提供了 UI 字符串；可选的自定义 UI 覆盖使用 `src/content/i18n/en.json` 和 `jsonPathTemplate: "{outputDir}/{locale}.json"` 在单独的 `docs[]` 块中，以备不时之需。

VitePress 导航/侧边栏/页脚字符串不在 markdown 中 —— 配置 `docsOutput.vitepressThemeCatalog` 并在 **`translate-docs`** 内进行翻译。参见 [VitePress 集成](/zh-Hans/guide/integrations/vitepress)。

Nextra 主题字典 (`.ts`) 和 `_meta.ts` 侧边栏标签不在 markdown 中 —— 当 `style: "nextra"` 时，使用 `docs[].nextraDictionaryPath` 和自动 `_meta` 收集，全部在 **`translate-docs`** 内进行。参见 [Nextra 集成](/zh-Hans/guide/integrations/nextra)。

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` — 通过 `docsOutput.fumadocsParser` 实现的 Fumadocs 内容布局：

- **`"dot"`（默认）** — 文件名中的区域设置后缀位于 `outputDir` 下的英文源旁边（而非区域设置文件夹）。这与 `doc-system` 路径形式是分开的。

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** — Nextra 风格的区域设置文件夹；使用相同的 `doc-system` 引擎，`localeSubpath` 为空。

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Fumadocs UI 覆盖 (`lib/layout.shared.ts`) 和 `meta.json` 侧边栏标签不在 markdown 中 —— 当 `style: "fumadocs"` 时，使用 `docsOutput.fumadocsUiCatalog` 和自动 `meta.json` 收集，全部在 **`translate-docs`** 内进行。参见 [Fumadocs 集成](/zh-Hans/guide/integrations/fumadocs)。

有关内置相对链接修复之外的链接和资产 URL 重写，请参阅[链接重写](/zh-Hans/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`)。

有关翻译页面中的屏幕截图和栅格资产，请参阅[图像和屏幕截图](/zh-Hans/guide/images-and-screenshots/)。

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` 占位符

通过设置 `docs[].docsOutput.pathTemplate`（Markdown 和 MDX）或 `jsonPathTemplate`（JSON 标签文件）来覆盖翻译文件的写入位置。两者都接受相同的占位符。解析后的路径必须保留在该块的 `outputDir` 内（CLI 会拒绝超出此范围的路径）。

如果您使用自定义 `pathTemplate`，`rewriteRelativeLinks` 默认为 `false`，除非您显式设置它 — 相对链接重写是为没有自定义模板的 `docsOutput.style = "flat"` 构建的。

对于内置布局（`nested`、`flat`、`doc-system`，无自定义模板），将 `docsOutput.localePathLowercase` 设置为 `true` 以写入小写的区域设置文件夹或文件名段（例如 `pt-br` 而非 `pt-BR`）。`astro-starlight` 别名以及 `localeSubpath` 为空的 `doc-system` 在配置加载时将此项默认为 `true`。自定义的 `pathTemplate` / `jsonPathTemplate` 值保持不变 — 当你需要小写段同时将 `{locale}` 保留为 BCP-47 时，请在那里使用 `{llocale}`。

| 占位符            | 作用                                                                                                       | 示例                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | 此文档块的 `outputDir` 的绝对解析路径                                           | `/home/acme/repo/i18n`                                           |
| `{locale}`             | 目标区域设置代码（与配置/CLI 中的形式相同）                                                          | `de`、`pt-BR`                                                    |
| `{LOCALE}`             | 相同区域设置的大写形式                                                                                     | `DE`、`PT-BR`                                                    |
| `{llocale}`            | 相同区域设置的小写形式（与 Astro 路由文件夹匹配，例如 `pt-br`、`zh-cn`）                               | `de`、`pt-br`                                                    |
| `{relPath}`            | 相对于项目根目录的源文件路径，POSIX `/`                                                   | `docs/guide.md`、`README.md`                                     |
| `{stem}`               | 文件名 **不含**扩展名                                                                            | `guide` （针对 `docs/guide.md`）                                      |
| `{basename}`           | 文件名 **包含**扩展名                                                                               | `guide.md`                                                       |
| `{extension}`          | **包含**点号的扩展名                                                                            | `.md`、`.mdx`                                                    |
| `{docsRoot}`           | 已解析的 `docsOutput.docsRoot` 绝对路径（如果省略，则默认为 `docs`）                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | 当路径字符串匹配时，移除匹配的 `docsRoot` 前缀的 `{relPath}`（POSIX）；否则保持不变 | `docs/guide.md`（常见）；仅在应用剥离时为 `guide.md` |

**示例**

配置片段：

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

对于区域设置 `de` 和源 `docs/guide.md`，项目根目录为 `/home/acme/repo`，并且 `outputDir` 解析为 `/home/acme/repo/i18n`，展开后的路径为：

```text
/home/acme/repo/i18n/de/docs/guide.md
```

使用 `docsOutput.style = "flat"` 且无自定义 `pathTemplate` 时，一种常见模式是通过 `{stem}` 和 `{extension}` 只保留文件名，例如 `{outputDir}/{stem}.{locale}{extension}`，这会在已解析的 `outputDir` 下生成 `…/guide.de.md`。
