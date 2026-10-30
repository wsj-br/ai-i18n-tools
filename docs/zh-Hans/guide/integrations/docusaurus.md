<a id="docusaurus-integration"></a>
# Docusaurus 集成

将 `init -t ui-docusaurus` 和 `docsOutput.style: "docusaurus"` 用于 [Docusaurus](https://docusaurus.io/) 文档站点。预设会使用 `docusaurusCatalogDir` 脚手架一个 `docs[]` 块，以便 `translate-docs` 可以通过一个命令翻译页面 Markdown 和 Docusaurus shell JSON。

另请参阅[文档](/zh-Hans/guide/documents/)、可运行的 [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) 演示，以及 [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app)，这是一个结合了 Next.js 应用、嵌套 Docusaurus 文档、扁平 README 和 SVG 资源的示例。

<a id="quick-start"></a>
## 快速开始

```bash
ai-i18n-tools init -t ui-docusaurus -P openai
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # or: cd examples/docusaurus-docs && pnpm build
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

将 `contentPaths` 指向用 `sourceLocale` 编写的 `.md` / `.mdx` 文件和目录。该语言可以是任何语言。将 `docsRoot` 设置为 Docusaurus 用作其内容根目录的同一文件夹。将 `outputDir` 设置为 `i18n/` 下每个区域设置文件夹的父级。

连接 Docusaurus [国际化](https://docusaurus.io/docs/i18n/introduction)：保持 `ai-i18n-tools.config.json` 中的 `targetLocales` 与 `docusaurus.config.js` 中的 `locales` 数组对齐。每个 `localeConfigs[locale].path` 必须与 `i18n/` 下的文件夹名称匹配（例如，`i18n/fr/` 的 `path: "fr"`）。

<a id="enable-i18n-in-an-existing-site"></a>
### 在现有站点中启用 i18n

首次设置使用 [为网站或文档站点添加 i18n](/zh-Hans/guide/add-i18n-to-website#run-the-agent-prompt) 上的提示。下面的清单是手动完成的相同工作。

- 当 URL 路径应不同于区域设置代码时，在 `docusaurus.config.js` 中添加 `i18n` 块：`defaultLocale`、`locales` 和 `localeConfigs[locale].path`。
- 运行 `docusaurus write-translations` 以确保 `i18n/<defaultLocale>/` 存在，然后将 `docusaurusCatalogDir` 指向该文件夹并运行 `sync`。
- `src/pages` 和 `src/components` 中的自定义 React 不是 markdown。使用来自 `@docusaurus/Translate` 的 `<Translate>` 或 `translate()` 标记面向用户的文本，以便 `write-translations` 可以将其收集到 `code.json` 中。消息必须是静态字符串。`write-translations` 会写入 `i18n/<locale>/code.json`；设置 `docusaurusCatalogDir` 后，`translate-docs` 会将该 JSON 与 shell 目录的其余部分一起翻译。ai-i18n-tools 不会扫描这些 JSX 树以查找 `t()`。

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

<a id="example-project"></a>
## 示例项目

[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — 英文源文件位于 `docs/`，已提交的翻译位于 `i18n/<locale>/docusaurus-plugin-content-docs/current/`，以及翻译后的 shell JSON。在端口 3100 上运行 `pnpm start`（构建 + 服务）以使语言环境下拉菜单正常工作；使用 `pnpm dev` 进行仅英文的热重载。

有关同一仓库布局中的 UI 字符串、SVG 翻译和扁平 README，请参阅 [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app)（端口 3040 上的嵌套 `docs-site/`）。
