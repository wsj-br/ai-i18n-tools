<a id="fumadocs-integration"></a>
# Fumadocs 集成

在 Next.js App Router 上的 [Fumadocs](https://www.fumadocs.dev/) 4 文档站点中使用 `init -t ui-fumadocs` 和 `docsOutput.style: "fumadocs"`。该预设是 `doc-system` 的别名，带有空的 `localeSubpath` 并保留 BCP-47 或短区域设置代码（`localePathLowercase` 默认为 `false`）。

另请参阅[文档](/zh-Hans/guide/documents/)和可运行的 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) 演示（dot 解析器，端口 3080）。

<a id="quick-start"></a>
## 快速开始

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

当您在一次 `sync` 运行中翻译页面内容、`meta.json` 侧边栏标签和 Fumadocs UI 覆盖时，启用 `features.translateDocs`。

<a id="page-layout"></a>
## 页面布局

Fumadocs 通过 `docsOutput.fumadocsParser` 支持两种 i18n 内容布局。**dot** 解析器是默认的（Fumadocs 内置以及诸如 [SWR](https://github.com/vercel/swr-site) 等生产站点）。

<a id="dot-parser-default"></a>
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

<a id="enable-i18n-in-an-existing-site"></a>
### 在现有站点中启用 i18n

仅限英文的 Fumadocs 应用需要一个区域设置路由和 `defineI18n`，然后 `translate-docs` 才能写入同级文件。首次设置使用 [为网站或文档站点添加 i18n](/zh-Hans/guide/add-i18n-to-website#run-the-agent-prompt) 上的提示。此页面上的 [代理提示](#agent-prompt) 是后续步骤，用于连接 UI 目录。清单：

- 在 `lib/i18n.ts` 中使用 `languages`、`defaultLanguage` 和 `parser: "dot"` 或 `"dir"` 来 `defineI18n`。
- 从 `proxy.ts`（示例文件）中 `app/[lang]/` 路由和 `createI18nMiddleware`。
- 在 `lib/layout.shared.ts` 中 `i18n.translations()`，并将其传递给 `i18nProvider`。
- 英文 MDX 位于集合根目录（点）或 `content/docs/en/`（目录）下。
- `targetLocales` 等于 `languages` 减去默认语言，然后是 `sync`。

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

有关可直接复制粘贴的目录配置，请参见 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) 中的 `ai-i18n-tools.config.dir.example.json`。心智模型与 [Nextra 集成](/zh-Hans/guide/integrations/nextra#page-layout) 一致。

<a id="sidebar-metajson"></a>
## 侧边栏 (`meta.json`)

Fumadocs 使用 JSON `meta.json` 文件来定义侧边栏结构和标题。当 `docsOutput.style` 为 `"fumadocs"` 时，`translate-docs` 会在 `docsRoot`（或 `docs[].fumadocsMetaGlob`）下收集 `meta.json`，翻译 `docs[].fumadocsMetaTranslatableKeys` 中列出的键的字符串值（默认值：`title`，`description`），并写入区域设置输出：

| 解析器 | 源区域设置 | 输出 |
|--------|----------------|--------|
| **点** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**不要**翻译 `pages` slug 数组、`root`、`icon`、`defaultOpen` 或其他结构键 —— 仅翻译人类可读的标签。

<a id="ui-catalog"></a>
## UI 目录

Fumadocs 布局外壳字符串（搜索占位符、区域设置显示名称以及在 `lib/layout.shared.ts` 中的其他 `defineTranslations` / `i18n.translations()` 覆盖）不会从 Markdown 中提取。请配置 `docsOutput.fumadocsUiCatalog`，以便 `translate-docs` 从 `sourcePath` 引导源区域设置目录并翻译每个区域设置的 JSON：

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

- `catalogPath` — 英文扁平 JSON。引导程序仅读取 `sourcePath` 中 `.add({ … })` 的 `en` 对象。该对象中的字符串字面量成为目录键（`displayName`，`Search(search trigger)`）。`.add()` 只接受 Fumadocs UI 预设注册的键，因此像 `site.title` 这样的导航标题不能放在那里。示例将 `site.title` 保留在 JSON 中，并为 `nav.title` 读取 `catalog["site.title"]`。文件中已存在但 `en` 对象中没有的键会保留：合并方式为 `{ ...existing, ...extracted }`。当英文字面量更改时，重新运行 `sync`。
- `outputPathTemplate`（可选）— 每个区域设置的输出；默认值：`ui.{locale}.json` 位于 `catalogPath` 旁边。

已翻译的键在应用读取之前不会生效。`i18n.translations().get(lang)` 只返回通过 `.extend()`（Fumadocs UI 预设）注册的键。将语言区域目录展开到 `.add()` 中，以便这些键生效，并将原生 `displayName` 放在展开**之后**，这样英文名称的翻译就不会替换它：

```ts
"pt-BR": {
  ...loadUiCatalog("pt-BR"),
  displayName: "Português (Brasil)",
},
```

`site.title` 不是 Fumadocs UI 键。示例为 `nav.title` 从目录中读取它。一个仅存在于 `ui.pt-BR.json` 中的搜索标签会保留在内置预设中，直到展开（或另一次读取）使用它为止。

请参阅 [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts)。

标准区域设置可由 `@fumadocs/language/*` 预设覆盖，无需 LLM 成本；目录仅在英文块中翻译 **项目覆盖**。

<a id="agent-prompt"></a>
## 代理提示

当一个纯英文的 Fumadocs 站点需要添加区域设置时，请复制此内容。它会连接路由和 UI 目录。它不会翻译字符串。

<details class="agent-prompt">
<summary>UI 目录提示</summary>

````markdown
# Enable Fumadocs i18n and the UI catalog

## Context

ai-i18n-tools translates Fumadocs MDX, `meta.json` titles, and the English block
of `i18n.translations().add({ en: { … } })` via `translate-docs` and
`docsOutput.fumadocsUiCatalog`. The literal in that `en` object is the source
string. Locale JSON takes effect only for keys the app reads: either a catalog
spread into `.add()` for registered UI keys, or a direct read such as
`catalog["site.title"]` for the nav title. Do not translate any string.

Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs

## Scope

Edit `lib/i18n.ts`, `lib/layout.shared.ts`, `proxy.ts`, `app/[lang]/` routes,
and `ai-i18n-tools.config.json`. Skip URLs, slugs, and native language names
(`displayName` on each locale entry).

## Call shape

- `defineI18n({ languages, defaultLanguage, parser })`. Use `"dot"` unless the
  project already keeps English under a locale folder (`"dir"`).
- `export default createI18nMiddleware(i18n)` from `proxy.ts`.
- Move pages under `app/[lang]/…` and pass `lang` into `baseOptions` and
  `i18nProvider(translations, lang)`.
- In `lib/layout.shared.ts`, keep English UI overrides as string literals inside
  `.add({ en: { … } })`. For each other locale, spread `loadUiCatalog(locale)`
  and then set `displayName` to the native name.
- Config: `features.translateDocs`, `docsOutput.style: "fumadocs"`,
  `fumadocsParser` matching `defineI18n`, and `fumadocsUiCatalog.sourcePath`
  pointing at `lib/layout.shared.ts`. `targetLocales` must equal `languages`
  except the default language, character for character.

## Order

1. Routing and `defineI18n`.
2. English literals in the `en` block, and the catalog spread for other locales.
3. Ask the user to run `sync`. Do not hand-write `ui.<locale>.json` or
   translated MDX.

## Do not

- Do not translate, rename, or reword the English literals.
- Do not put native language names only in the `en` block (they would be
  extracted and translated).
- Do not hand-edit locale JSON, `meta.<locale>.json`, or locale MDX.
- Do not use `json[]` for this catalog.

## Verify

- `pnpm build` passes.
- The default locale still shows the English overrides.
- After `sync`, one other locale shows the translated search trigger and nav
  title, and `displayName` in the language menu is still the native name.

## Report back

List files changed, each key you added to the `en` block, each key you left
unread (and so unused) with a one-line reason, and whether the parser is `dot`
or `dir`.
````

</details>

**不要** 将 `json[]` 用于 Fumadocs UI 字符串 — 该流水线用于无关的应用区域设置包。

<a id="link-conventions"></a>
## 链接约定

Fumadocs 通过 Next.js 中间件（`/docs/getting-started`、`/pt/docs/getting-started`）提供带语言前缀的路由。**页内链接应保持语言中立**（`/docs/getting-started`），以便自动应用当前语言前缀。

启用内置规范化器，以便 `translate-docs` 自动修复每个翻译文件中的链接：

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

当 `style` 为 `"fumadocs"` 时，`rewriteFumadocsLinks` 默认启用。

| 在源区域设置中编写 | 规范化后 |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/zh-Hans/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | 不变（完整 URL） |

**编写规则**

- 跨页面文档链接：在英文 MDX 中使用 **语言环境无关的站点路由** (`/docs/…`)，或使用 `content/docs/…` / 相对 `.mdx` 路径，让规范器在 `sync` 期间重写它们。
- 内容树之外的仓库文件：使用 **完整 URL**。
- **不要**手动编辑带有语言环境后缀的副本 (`*.pt.mdx`) 或 `content/{locale}/` 树中的链接 — 使用 `sync` / `translate-docs` 重新生成。

另请参阅 [文档——链接重写](/zh-Hans/guide/documents/link-rewriting) 和 [配置——`docsOutput`](/zh-Hans/reference/configuration#docsoutput)。

<a id="locale-codes"></a>
## 区域设置代码

确保 Fumadocs 应用中 `ai-i18n-tools.config.json` 的 `targetLocales` 与 `defineI18n().languages` **完全**一致。点示例使用短代码（`pt`，`zh`）；目录配置可以使用 BCP-47 文件夹（`pt-BR`，`zh-Hans`）。没有强制规范化 — 不匹配的代码会导致错误的输出路径或页面缺失。

<a id="multiple-collections"></a>
## 多个集合

Fumadocs 项目可在 `source.config.ts` 中定义多个 `defineDocs` 块（文档、博客、示例）。为你翻译的每个集合添加一个 `docs[]` 块，每个块拥有各自的 `contentPaths`、`outputDir` 和 `docsRoot`。

<a id="example-project"></a>
## 示例项目

[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — 位于 `content/docs/` 的英文 MDX，已提交 `pt` 和 `zh` dot 后缀页面、`meta.json` 和 `lib/i18n/ui.{locale}.json`。在端口 **3080** 上运行 `pnpm run dev`。

<a id="cross-references"></a>
## 交叉引用

- [配置 — `docsOutput`](/zh-Hans/reference/configuration#docsoutput)
- [输出布局](/zh-Hans/guide/documents/output-layouts)
- [Docusaurus 集成](/zh-Hans/guide/integrations/docusaurus)
- [Nextra 集成](/zh-Hans/guide/integrations/nextra)（目录解析器心智模型）
- [VitePress 集成](/zh-Hans/guide/integrations/vitepress)（UI 目录引导模式）
