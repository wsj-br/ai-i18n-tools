<a id="astro-integration"></a>
# Astro 集成

ai-i18n-tools 可与 [Astro](https://astro.build/) 在两种常见设置中使用：**Astro Starlight** 文档站点和**纯 Astro** 营销或应用程序站点。两者都使用文档 (`translate-docs`) 作为页面内容；纯 Astro 站点通常将其与 UI 字符串 (`extract` / `translate-ui`) 结合用于 frontmatter 和共享数据中的 `t()` 字符串。

另请参阅[UI 字符串](/zh-Hans/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight)、[文档](/zh-Hans/guide/documents/)以及下面的可运行示例。

<a id="astro-starlight"></a>
## Astro Starlight

将 `init -t ui-starlight` 和 `docsOutput.style: "astro-starlight"` 用于 [Astro Starlight](https://starlight.astro.build/) 文档站点。此预设是 `doc-system` 的别名，带有一个空的 `localeSubpath` — 翻译页面位于 `src/content/docs/<locale>/` 下，与英文源树并列。

<a id="quick-start"></a>
### 快速入门

```bash
npx ai-i18n-tools init -t ui-starlight
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### 页面布局

英文 Markdown 和 MDX 位于 Starlight 内容根目录（通常是 `src/content/docs/`）。翻译副本与源树并列：

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

配置一个 `docs[]` 块：

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

将 `contentPaths` 指向您的英文 `.md` / `.mdx` 文件和目录。将 `docsRoot` 设置为 Starlight 用作其内容根目录的相同文件夹。

Starlight UI 覆盖可以在需要时在单独的 `docs[]` 块中使用 `src/content/i18n/en.json` 和 `jsonPathTemplate` — 请参阅[文档 — 初始化以获取文档](/zh-Hans/guide/documents/#step-1-initialise-for-documentation)。

<a id="framework-shell-translation"></a>
### 框架外壳翻译

Starlight 自带了许多语言环境的内置 UI 字符串（导航标签、搜索占位符、目录等）——与 Docusaurus、VitePress 或 Nextra 不同，没有单独的外壳/主题流水线需要配置：

| 框架 | 外壳/主题字符串 | 流水线 |
|-----------|----------------------|----------|
| Astro Starlight | 内置 UI 字符串（多种语言环境）；无额外外壳流水线 | 文档 — `translate-docs`（仅页面） |
| Docusaurus | `write-translations` 目录 (`{ message, description }`) | 文档 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主题/导航/侧边栏目录 | 文档 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 侧边栏标签 + 主题字典 `.ts` | 文档 — 参见 [Nextra 集成](/zh-Hans/guide/integrations/nextra) |
| Fumadocs | `meta.json` 侧边栏标签 + UI 覆盖目录 | 文档 — 参见 [Fumadocs 集成](/zh-Hans/guide/integrations/fumadocs) |

其他框架模式请参见 [Docusaurus 集成](/zh-Hans/guide/integrations/docusaurus)、[VitePress 集成](/zh-Hans/guide/integrations/vitepress)、[Nextra 集成](/zh-Hans/guide/integrations/nextra) 和 [Fumadocs 集成](/zh-Hans/guide/integrations/fumadocs)。

<a id="example-project"></a>
### 示例项目

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — 英文源位于 `src/content/docs/`，已提交的翻译位于 `src/content/docs/<locale>/` 下，RTL 区域设置 (`ar`) 和词汇表驱动的翻译。在端口 3050 上运行 `pnpm dev`。

<a id="plain-astro-marketing-and-app-sites"></a>
## 纯 Astro（营销和应用程序站点）

对于静态 Astro 营销或应用程序站点（非 Starlight），将 [Astro 内置 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 与 ai-i18n-tools 结合使用。参考实现是 [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website)：英文位于 `/`，目标区域设置位于 `/{locale}/`。

大多数团队在同一页面上使用两种管道的**混合**：

| 管道 | 用于 | 命令 | 输出 |
|----------|---------|----------|--------|
| **页面 HTML** | 模板正文中的标题、段落、导航标签、内联数组 | `translate-docs` | 每个区域设置 `src/pages/{locale}/index.astro` |
| **UI 字符串（`t()`）** | 前端数据、选项卡标签、共享数组 | `extract` → `translate-ui` | `public/locales/{locale}.json`（以英文原文作为键） |

<a id="quick-start-1"></a>
### 快速入门

```bash
npx ai-i18n-tools init -t ui-astro-website
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

使用 `init -t ui-astro-website` 搭建 UI 提取，然后在翻译页面 HTML 时合并到 `docs[]` 块中：

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

添加或删除语言时，请保持三个列表对齐：`targetLocales` 在 `ai-i18n-tools.config.json` 中，`i18n.locales` 在 `astro.config.mjs` 中（Astro 使用**小写**路由代码，例如 `pt-br`），以及 `ui-languages.json`（通过 `generate-ui-languages`）。平面捆绑包**文件名**使用配置大小写 (`pt-BR.json`)；通过清单 `code` 字段将 Astro 的 `pt-br` 路由映射到该文件。

通过查找英文源文字作为键，在**构建时**解析 `t('…')` — 请参阅 `examples/astro-website/src/i18n/t.ts`。除非您添加在加载后切换语言的客户端岛，否则静态站点不需要 `ai-i18n-tools/runtime` 或 i18next。

<a id="example-project-1"></a>
### 示例项目

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — 混合式着陆页，通过 `translate-docs` 提供 HTML，并通过 `t()` + `translate-ui` 提供屏幕截图选项卡标签。

<a id="example-projects"></a>
## 示例项目

| 项目 | 用例 | 端口 |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Starlight 文档 | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | 纯 Astro 营销网站（HTML + `t()` 混合） | （请参阅 README） |

比较 [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) 和 [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — 类似的教程内容，Docusaurus 输出样式而非 Starlight。
