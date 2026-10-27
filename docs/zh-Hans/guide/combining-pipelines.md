<a id="combining-pipelines"></a>
# 组合管道

如果一个项目需要多种类型的翻译，例如应用 UI 字符串和文档、文档网站和根目录下的 README，或者文档和 SVG 插图，请阅读本文。如果只翻译一种内容，阅读 [快速入门](/zh-Hans/guide/quick-start) 就足够了。

应用及其仓库 README 是一种常见的混合形式。使用 `init`（`ui-markdown` 模板）或 `init -t <template> --with-readme` 为其搭建脚手架，然后按照 [为 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) 的说明操作。本页后面介绍的混合配置，是与文档网站并列的相同思路。

本仓库就是这类项目。[`ai-i18n-tools.config.json`](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) 在一个 `sync` 文件中翻译了 CLI 和翻译仪表板的 UI 字符串以及这个 VitePress 网站。UI 代码块涵盖了 `src/cli`、`src/server`、`src/dashboard-app` 和 `src/api`，并将扁平化的 JSON 写入 `src/i18n/locales`。VitePress 代码块使用 `docsOutput.style: "vitepress"` 来处理 `docs/` 和主题目录。同一个文件还将 `README.md` 翻译写入 `translated-docs/`。网站集成：[VitePress](/zh-Hans/guide/integrations/vitepress)。

<a id="what-sync-runs"></a>
## sync 的运行内容

`ai-i18n-tools sync` 按以下顺序运行已启用的步骤：

1. 当 `features.translateUIStrings` 启用时，运行 `extract`，然后运行 `translate-ui`。
2. 当 `features.translateSVG` 启用且存在 `svg` 代码块时，运行 `translate-svg`。
3. 当 `features.translateDocs` 启用或设置了任何 `docs[].docusaurusCatalogDir` 时，运行 `translate-docs`。
4. 当 `features.translateJson` 启用且 `json[]` 中有条目时，运行 `translate-json`。

使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 可跳过某些部分。文档和 `json[]` 步骤接受 `--dry-run`、`-p` / `--path`、`--force`、`--force-update` 和 `--check-cache`。当设置了 `--no-docs` 时，仅用于文档的标志将被忽略。当未设置 `--no-json` 时，JSON 使用相同的缓存标志。

建议使用 `sync`，而不是手动链接各个命令。手动运行时，顺序、提取和区域设置标志很容易出错。

<a id="combined-sync"></a>

<a id="ui-strings-and-documents-together"></a>
## UI 字符串和文档的组合

在一个配置中同时启用这两个功能，以便一次性运行 UI 字符串和文档：

<details>
<summary>示例组合 UI + 文档配置</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

UI 区块默认包含其 `strings.json` 目录，作为文档的术语表提示 (`uiGlossary`)。`glossary.userGlossary` 添加了针对产品术语的 CSV 覆盖项。请参阅[术语表](/zh-Hans/guide/glossary)。

<a id="fewer-locales-for-documents"></a>
## 为文档设置更少的区域设置

在代码块上使用 `docs[].targetLocales`，可将该代码块的文件翻译成比 UI 更小的区域设置子集。有效的文档区域设置是所有代码块的并集：

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>

<a id="mixed-documentation-config"></a>
## 混合文档配置

通过在 `docs` 中添加多个条目，可以在同一配置中组合多个文档管道。当项目有一个 Docusaurus 网站 (`docsOutput.style = "docusaurus"`)，外加一些根级 markdown 文件（例如带有 `docsOutput.style = "flat"` 的仓库 README），并且这些文件应使用带区域设置后缀的文件名进行翻译时，这是一种常见的设置。

<details>
<summary>示例混合 Docusaurus + 扁平 README 配置</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

使用 `ai-i18n-tools sync` 运行的方式如下：

- 从 `src/` 提取 UI 字符串并翻译到 `public/locales/` 中。
- 第一个文档块将 markdown 从 `docs-site/docs/` 翻译到 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`（本地化的文档页面）。
- 在设置了 `docs[].docusaurusCatalogDir` 并启用了 `features.translateDocs` 的情况下，同一个块还会将 `docs-site/i18n/en/` 下的 Docusaurus shell JSON 翻译到每个目标区域设置文件夹中：导航栏、页脚和主题/插件目录，但不包括 MDX 正文内容。
- 第二个文档块将 `README.md` 翻译成带区域设置后缀的文件，并存放在 `translated-docs/` 下 (`docsOutput.style = "flat"`)。
- 所有文档块共享 `cacheDir`，因此未更改的片段会在运行之间重复使用，以减少 API 调用和成本。

下一步：返回 [快速入门](/zh-Hans/guide/quick-start)，或参阅 [配置](/zh-Hans/reference/configuration) 了解完整的 schema。
