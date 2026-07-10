<a id="docusaurus-integration"></a>
# Docusaurus 集成

将 `init -t ui-docusaurus` 和 `docsOutput.style: "docusaurus"` 用于 [Docusaurus](https://docusaurus.io/) 文档站点。预设会使用 `docusaurusCatalogDir` 脚手架一个 `docs[]` 块，以便 `translate-docs` 可以通过一个命令翻译页面 Markdown 和 Docusaurus shell JSON。

另请参阅[文档](/guide/documents/)、可运行的 [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) 演示（Next.js 应用程序加上嵌套的 `docs-site/`），以及 [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) 以获取专注于 Docusaurus 的演练。

<a id="quick-start"></a>
## 快速入门

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # Docusaurus build (project-specific script)
```

当您翻译文档页面和站点界面（导航栏、页脚、主题字符串）时，启用 `features.translateDocs` 并设置 `docs[].docusaurusCatalogDir`。当您升级 `@docusaurus/*` 或更改导航栏/页脚/主题标签时，在您的 Docusaurus 项目中运行 `docusaurus write-translations` — 然后重新运行 `translate-docs` 或 `sync`，以便将 shell JSON 翻译到每个语言环境文件夹中。

<a id="page-layout"></a>
## 页面布局

英文 Markdown 和 MDX 位于您的 Docusaurus `docs/` 文件夹下（例如 `docs-site/docs/`）。翻译后的副本写入每个语言环境的插件内容树中：

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

配置一个 `docs[]` 块：

```json
{
  "contentPaths": ["docs-site/docs/"],
  "outputDir": "docs-site/i18n",
  "docusaurusCatalogDir": "docs-site/i18n/en",
  "addFrontmatter": true,
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "docs-site/docs"
  }
}
```

将 `contentPaths` 指向您的英文 `.md` / `.mdx` 文件和目录。将 `docsRoot` 设置为 Docusaurus 用作其内容根目录的相同文件夹。将 `outputDir` 设置为 `i18n/` 下每个语言环境文件夹的父级。

连接 Docusaurus [国际化](https://docusaurus.io/docs/i18n/introduction)：保持 `ai-i18n-tools.config.json` 中的 `targetLocales` 与 `docusaurus.config.js` 中的 `locales` 数组对齐。每个 `localeConfigs[locale].path` 必须与 `i18n/` 下的文件夹名称匹配（例如，`i18n/fr/` 的 `path: "fr"`）。

<a id="shell-strings-write-translations"></a>
## Shell 字符串 (write-translations)

Docusaurus 导航栏、页脚、搜索占位符以及其他主题/插件标签不会从 Markdown 中提取。在您的 Docusaurus 项目中运行 `docusaurus write-translations` 以在默认语言环境文件夹（通常是 `i18n/en/`）下生成 JSON 目录。然后将 `docs[].docusaurusCatalogDir` 指向该文件夹：

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus pages + shell JSON",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

当设置 `docusaurusCatalogDir` 且启用 `features.translateDocs` 时，`translate-docs` 会翻译两者：

- **文档页面** — 从 `contentPaths` 到 `i18n/<locale>/docusaurus-plugin-content-docs/current/` 的 Markdown/MDX
- **Shell JSON** — 从 `i18n/en/` 到同级语言环境文件夹的导航栏、页脚和主题/插件目录

不要将 Docusaurus shell JSON 放在 `json[]` 中；请使用 `docs[].docusaurusCatalogDir` 和 Documents。

<a id="framework-shell-translation"></a>
## 框架外壳翻译

| 框架 | Shell / 主题字符串 | 管道 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 目录 (`{ message, description }`) | 文档 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主题/导航/侧边栏目录 | 文档 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 侧边栏标签 | 文档 — 当 `style: "nextra"` + `translate-docs` 时自动翻译 |
| Nextra | 主题字典 `.ts` | 文档 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 侧边栏标签 | 文档 — 当 `style: "fumadocs"` + `translate-docs` 时自动生成 |
| Fumadocs | UI 覆盖目录 | 文档 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 内置 UI 字符串（多语言）；无额外外壳流水线 | 文档 — `translate-docs`（仅页面） |

请**不要**将框架外壳/主题字符串放入 `json[]` —— 该流水线用于无关的应用语言包。有关其他框架模式，请参阅 [VitePress 集成](/guide/integrations/vitepress)、[Nextra 集成](/guide/integrations/nextra) 和 [Fumadocs 集成](/guide/integrations/fumadocs)。

<a id="example-project"></a>
## 示例项目

[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — 英文源文件位于 `docs/`，已提交的翻译位于 `i18n/<locale>/docusaurus-plugin-content-docs/current/` 下，以及翻译后的 shell JSON。在端口 3040 上运行 `pnpm start` 进行开发；使用 `pnpm run start:fr`（及类似命令）在开发模式下预览单个语言环境。
