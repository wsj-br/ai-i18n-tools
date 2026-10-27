<a id="astro-integration"></a>
# Astro 集成

ai-i18n-tools 可与 [Astro](https://astro.build/) 在两种常见设置中使用：**Astro Starlight** 文档站点和**纯 Astro** 营销或应用程序站点。两者都使用文档 (`translate-docs`) 作为页面内容；纯 Astro 站点通常将其与 UI 字符串 (`extract` / `translate-ui`) 结合用于 frontmatter 和共享数据中的 `t()` 字符串。

另请参阅 [UI 字符串](/zh-Hans/guide/ui-strings/astro-website)、[文档](/zh-Hans/guide/documents/) 以及下方的可运行示例。

<a id="astro-starlight"></a>
## Astro Starlight

将 `init -t ui-starlight` 和 `docsOutput.style: "astro-starlight"` 用于 [Astro Starlight](https://starlight.astro.build/) 文档网站。该预设是 `doc-system` 的别名，其中 `localeSubpath` 为空 —— 翻译后的页面会放置在源语言区域树旁的 `src/content/docs/<locale>/` 下。`sourceLocale` 可以是任何语言。

<a id="quick-start"></a>
### 快速入门

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
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

将 `contentPaths` 指向用 `sourceLocale` 编写的 `.md` / `.mdx` 文件和目录。该语言可以是任何语言。将 `docsRoot` 设置为 Starlight 用作其内容根目录的同一文件夹。

Starlight UI 覆盖可以在需要时在单独的 `docs[]` 块中使用 `src/content/i18n/en.json` 和 `jsonPathTemplate` — 请参阅[文档 — 初始化以获取文档](/zh-Hans/guide/documents/#step-1-initialise-for-documentation)。

Starlight 内置了许多区域设置的 UI 字符串（导航标签、搜索占位符、目录等）。没有单独的 shell/主题流水线需要配置 —— 仅将 `translate-docs` 用于页面内容。对于其他框架，请参阅[框架 shell 翻译](/zh-Hans/guide/integrations/#framework-shell-translation)。

显式侧边栏 `label`、网站 `title` 以及 `astro.config.mjs` 中的 `social[].label` 是本工具不会翻译的英文字面量。推荐使用 `slug` 条目，这样标签会来自页面的已翻译 frontmatter (`title`)。需要自定义文本的分组或外部链接，可使用 Starlight 的各语言区域 `translations` 映射（默认语言区域使用 `label`，其他语言区域使用 `translations['pt-BR']`）。在当前的 Starlight 架构中，`social[].label` 没有 translations 字段；它将保持原样。请参阅 [Starlight 侧边栏](https://starlight.astro.build/guides/sidebar/#internationalization) 和 [examples/astro-docs/astro.config.mjs](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/astro.config.mjs)，其中使用了 `slug` 条目。

<a id="enable-i18n-in-an-existing-site"></a>
### 在现有站点中启用 i18n

- 在 Starlight 配置中设置 `locales`，当英语应不带前缀时（`label` 和必需的 `lang`），需包含一个 `root` 条目。
- 当默认语言是该根语言区域时，设置 `defaultLocale: 'root'`。仅当 Starlight 的默认设置已匹配时，才省略 `defaultLocale`。
- 英语页面保留在 `src/content/docs/` 中；`translate-docs` 会写入 `src/content/docs/<locale>/`。
- `targetLocales` 与非根语言区域的键对齐（注意大小写：Starlight 的目录键通常是小写的，例如 `pt-br`）。

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
| **UI 字符串 (`t()`)** | Frontmatter 数据、选项卡标签、共享数组 | `extract` → `translate-ui` | `public/locales/{locale}.json`（源语言字符串作为键） |

<a id="quick-start-1"></a>
### 快速入门

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

使用 `init -t ui-astro-website -P ollama` 搭建 UI 提取，然后在您翻译页面 HTML 时，并入 `docs[]` 块：

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

在**构建时**通过查找作为键的源语言字面量来解析 `t('…')` —— 请参阅 `examples/astro-website/src/i18n/t.ts`。`sourceLocale` 可以是任何语言。该示例使用英语。对于静态网站，你不需要 `ai-i18n-tools/runtime` 或 i18next，除非你添加了在加载后切换语言的客户端孤岛。

<a id="example-project-1"></a>
### 示例项目

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — 混合式着陆页，通过 `translate-docs` 提供 HTML，并通过 `t()` + `translate-ui` 提供屏幕截图选项卡标签。

<a id="example-projects"></a>
## 示例项目

| 项目 | 用例 | 端口 |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Starlight 文档 | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | 纯 Astro 营销网站（HTML + `t()` 混合） | （请参阅 README） |

将 [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) 与 [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) 进行对比 —— 教程内容相似，但输出风格为 Docusaurus 而非 Starlight。
