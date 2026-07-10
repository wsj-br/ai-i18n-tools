<a id="output-layouts"></a>
# 输出布局

`docsOutput.style` 控制翻译后的 markdown 文件写入何处。在 `docs[].docsOutput.style` 中使用下面的确切字符串值（别名是预设布局，而不是单独的引擎）。

`docsOutput.style = "nested"`（省略时为默认值）——在 `{outputDir}/{locale}/` 下镜像源树（例如 `docs/guide.md` → `i18n/de/docs/guide.md`）。

`docsOutput.style = "doc-system"`——用于静态文档站点的、经过本地化前缀的文档树。`docsRoot` 下的文件写入 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`。`docsRoot` 之外的路径将回退到嵌套布局。将 `docs[].docsOutput.docsRoot` 设置为您的英文源根目录（例如 `"docs"` 或 `"src/content/docs"`）。当 `docsOutput.style = "doc-system"` 时，您必须显式设置 `localeSubpath`（使用下面的别名获取预设）。

**别名**（相同的布局引擎，预设 `localeSubpath`）：

- `docsOutput.style = "docusaurus"` — `localeSubpath` 默认为 `docusaurus-plugin-content-docs/current`（Docusaurus 国际化插件布局）。
- `docsOutput.style = "astro-starlight"` — `localeSubpath` 默认为 `""`（翻译后的页面直接位于 `{outputDir}/{locale}/` 下，当英文位于内容根目录且 `outputDir` 等于 `docsRoot` 时，与 [Starlight](https://starlight.astro.build/guides/i18n/) 匹配）。
- `docsOutput.style = "vitepress"` — 与 `doc-system` 布局相同，但 `localeSubpath` 为空；保留 BCP-47 语言环境文件夹名称（`localePathLowercase` 默认为 `false`）。参见 [VitePress 集成](/zh-Hans/guide/integrations/vitepress)。
- `docsOutput.style = "nextra"` — 与 `doc-system` 布局相同，但 `localeSubpath` 为空；英文源文件位于语言环境文件夹下（例如 `content/en/`）。参见 [Nextra 集成](/zh-Hans/guide/integrations/nextra)。
- `docsOutput.style = "fumadocs"` — 与 `doc-system` 布局相同，但 `localeSubpath` 为空；英文源文件使用点后缀文件（默认），或者在 `fumadocsParser` 为 `"dir"` 时使用语言环境文件夹。参见 [Fumadocs 集成](/zh-Hans/guide/integrations/fumadocs)。

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

Fumadocs 预设 — 点解析器（默认；区域设置后缀位于英文源旁边）：

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

Fumadocs 预设 — 目录解析器（Nextra 风格的区域设置文件夹）：

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

可选的 JSON 标签——来自 `docusaurusCatalogDir` 的 Docusaurus 壳字符串（非 MDX 正文内容）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight 为许多本地化版本提供了 UI 字符串；可选的自定义 UI 覆盖使用 `src/content/i18n/en.json` 和 `jsonPathTemplate: "{outputDir}/{locale}.json"` 在单独的 `docs[]` 块中，以备不时之需。

VitePress 导航/侧边栏/页脚字符串不在 markdown 中 —— 配置 `docsOutput.vitepressThemeCatalog` 并在 **`translate-docs`** 内进行翻译。参见 [VitePress 集成](/zh-Hans/guide/integrations/vitepress)。

Nextra 主题字典 (`.ts`) 和 `_meta.ts` 侧边栏标签不在 markdown 中 —— 当 `style: "nextra"` 时，使用 `docs[].nextraDictionaryPath` 和自动 `_meta` 收集，全部在 **`translate-docs`** 内进行。参见 [Nextra 集成](/zh-Hans/guide/integrations/nextra)。

Fumadocs UI 覆盖 (`lib/layout.shared.ts`) 和 `meta.json` 侧边栏标签不在 markdown 中 —— 当 `style: "fumadocs"` 时，使用 `docsOutput.fumadocsUiCatalog` 和自动 `meta.json` 收集，全部在 **`translate-docs`** 内进行。参见 [Fumadocs 集成](/zh-Hans/guide/integrations/fumadocs)。

`docsOutput.style = "flat"`——将翻译后的文件放置在源旁边，并带有本地化后缀，或放在子目录中。当 `docsOutput.style = "flat"` 时（除非设置了 `rewriteRelativeLinks: false` 或自定义 `pathTemplate`），页面之间的相对链接会自动重写。

```text
docs/guide.md → i18n/guide.de.md
```

有关平面布局中的跨页面锚点链接，请参阅[锚点链接](/zh-Hans/guide/documents/anchor-links)。

有关内置相对链接修复之外的链接和资产 URL 重写，请参阅[链接重写](/zh-Hans/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`)。

有关翻译页面中的屏幕截图和栅格资产，请参阅[图像和屏幕截图](/zh-Hans/guide/images-and-screenshots/)。

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` 占位符

通过设置 `docs[].docsOutput.pathTemplate`（Markdown 和 MDX）或 `jsonPathTemplate`（JSON 标签文件）来覆盖翻译文件的写入位置。两者都接受相同的占位符。解析后的路径必须保留在该块的 `outputDir` 内（CLI 会拒绝超出此范围的路径）。

如果您使用自定义 `pathTemplate`，`rewriteRelativeLinks` 默认为 `false`，除非您显式设置它 — 相对链接重写是为没有自定义模板的 `docsOutput.style = "flat"` 构建的。

对于内置布局（`nested`、`flat`、`doc-system`，无自定义模板），请将 `docsOutput.localePathLowercase` 设置为 `true`，以写入小写区域设置文件夹或文件名片段（例如，使用 `pt-br` 而不是 `pt-BR`）。`astro-starlight` 别名默认将其设置为 `true`。自定义 `pathTemplate` / `jsonPathTemplate` 值保持不变 — 当您需要小写片段但仍将 `{locale}` 保留为 BCP-47 时，请在此处使用 `{llocale}`。

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
