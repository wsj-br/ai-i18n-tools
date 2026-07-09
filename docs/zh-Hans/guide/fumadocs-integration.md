<a id="fumadocs-integration"></a>
# Fumadocs 集成

在 Next.js App Router 上的 [Fumadocs](https://www.fumadocs.dev/) 4 文档站点中使用 `init -t ui-fumadocs` 和 `docsOutput.style: "fumadocs"`。该预设是 `doc-system` 的别名，带有空的 `localeSubpath` 并保留 BCP-47 或短区域设置代码（`localePathLowercase` 默认为 `false`）。

另请参阅[文档](/guide/documents/)和可运行的 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) 演示（dot 解析器，端口 3080）。

<a id="quick-start"></a>
## 快速入门

```bash
npx ai-i18n-tools init -t ui-fumadocs
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

当您在一次 `sync` 运行中翻译页面内容、`meta.json` 侧边栏标签和 Fumadocs UI 覆盖时，启用 `features.translateDocs`。

<a id="page-layout"></a>
## 页面布局

Fumadocs 通过 `docsOutput.fumadocsParser` 支持两种 i18n 内容布局。**dot** 解析器是默认的（Fumadocs 内置以及诸如 [SWR](https://github.com/vercel/swr-site) 等生产站点）。

### Dot 解析器（默认）

英文 MDX 位于集合根目录。翻译后的副本在同一目录中使用区域设置后缀：

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

在 `lib/i18n.ts` 中将 `targetLocales` 与 `defineI18n().languages` 完全对齐（示例使用短代码 `pt` 和 `zh`）。

<a id="dir-parser-nextra-style"></a>
### Dir 解析器（Nextra 风格）

对于习惯于区域设置文件夹（`content/docs/en/` → `content/docs/pt-BR/`）的团队，将 `fumadocsParser` 设置为 `"dir"`：

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

有关可直接复制粘贴的 dir 配置，请参阅 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) 中的 `ai-i18n-tools.config.dir.example.json`。心智模型与 [Nextra 集成](/guide/nextra-integration#page-layout) 相匹配。

<a id="meta-json-sidebar"></a>
## 侧边栏 (`meta.json`)

Fumadocs 使用 JSON `meta.json` 文件来定义侧边栏结构和标题。当 `docsOutput.style` 为 `"fumadocs"` 时，**`translate-docs`** 会收集 `docsRoot`（或 `docs[].fumadocsMetaGlob`）下的 `meta.json`，翻译 `docs[].fumadocsMetaTranslatableKeys` 中列出的键的字符串值（默认：`title`、`description`），并写入区域设置输出：

| 解析器 | 英文源文件 | 输出 |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**不要**翻译 `pages` slug 数组、`root`、`icon`、`defaultOpen` 或其他结构键 —— 仅翻译人类可读的标签。

<a id="ui-catalog"></a>
## UI 目录

Fumadocs 布局外壳（搜索占位符、区域设置显示名称以及 `lib/layout.shared.ts` 中的其他 `defineTranslations` / `i18n.translations()` 覆盖）不会从 markdown 中提取。配置 **`docsOutput.fumadocsUiCatalog`** 以便 **`translate-docs`** 从 `sourcePath` 引导英文目录并翻译每个区域设置的 JSON：

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** —— 生成的英文扁平化 JSON（引导输出）。当 `layout.shared.ts` 中的英文覆盖发生更改时，请重新运行 `sync`。
- **`outputPathTemplate`**（可选）—— 每个区域设置的输出；默认：`ui.{locale}.json` 位于 `catalogPath` 旁边。

通过 `loadUiCatalog(locale)` 在 `layout.shared.ts` 中加载每个区域设置的 JSON，并在您的根布局中与 `i18nProvider(translations, lang)` 合并。请参阅 [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts)。

标准区域设置可由 `@fumadocs/language/*` 预设覆盖，无需 LLM 成本；目录仅在英文块中翻译 **项目覆盖**。

**不要** 将 `json[]` 用于 Fumadocs UI 字符串 — 该流水线用于无关的应用区域设置包。

<a id="framework-shell-translation"></a>
## 框架外壳翻译

| 框架 | Shell / 主题字符串 | 流水线 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 目录 | 文档 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主题/导航/侧边栏目录 | 文档 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 侧边栏标签 | 文档 — 当 `style: "nextra"` + `translate-docs` 时自动翻译 |
| Nextra | 主题字典 `.ts` | 文档 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 侧边栏标签 | 文档 — 当 `style: "fumadocs"` + `translate-docs` 时自动生成 |
| Fumadocs | UI 覆盖目录 | 文档 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 内置 UI 字符串 | 文档 — `translate-docs`（仅页面） |

<a id="link-conventions"></a>
## 链接约定

当 `rewriteFumadocsLinks` 启用时（`fumadocs` 预设的默认值），指向 `content/docs/…` 或相对 `.mdx` 路径的 markdown 链接会被重写为区域设置无关路由 `/docs/…`（去除 `.mdx`，折叠 `index`）。外部 URL、`mailto:` 和 `#anchors` 保持不变。

当你希望在各区域设置间保持稳定路由时，请在英文源文件中使用 `/docs/...`。参见[文档 — 链接重写](/guide/documents/link-rewriting)。

<a id="locale-codes"></a>
## 区域设置代码

请将 `ai-i18n-tools.config.json` 中的 `targetLocales` 与你的 Fumadocs 应用中的 `defineI18n().languages` 保持**完全**一致。dot 示例使用短代码（`pt`、`zh`）；目录配置可使用 BCP-47 文件夹（`pt-BR`、`zh-Hans`）。不进行强制标准化 — 不匹配的代码会导致输出路径错误或页面缺失。

<a id="multiple-collections"></a>
## 多个集合

Fumadocs 项目可在 `source.config.ts` 中定义多个 `defineDocs` 块（文档、博客、示例）。为你翻译的每个集合添加一个 `docs[]` 块，每个块拥有各自的 `contentPaths`、`outputDir` 和 `docsRoot`。

<a id="example-project"></a>
## 示例项目

[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — 位于 `content/docs/` 的英文 MDX，已提交 `pt` 和 `zh` dot 后缀页面、`meta.json` 和 `lib/i18n/ui.{locale}.json`。在端口 **3080** 上运行 `pnpm run dev`。

<a id="cross-references"></a>
## 交叉引用

- [配置 — `docsOutput`](/reference/configuration#docsoutput)
- [输出布局](/guide/documents/output-layouts)
- [Nextra 集成](/guide/nextra-integration)（目录解析器心智模型）
- [VitePress 集成](/guide/vitepress-integration)（UI 目录引导模式）
