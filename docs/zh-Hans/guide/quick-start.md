<a id="quick-start"></a>
# 快速入门

默认的 `init` 模板 (`ui-markdown`) 仅启用 **UI** 提取和翻译。`ui-docusaurus`、`ui-starlight` 和 `ui-vitepress` 模板启用 **文档** 翻译 (`translate-docs`)；`ui-vitepress` 还为 VitePress 主题 JSON 搭建 JSON 骨架。`ui-astro-website` 模板为纯 Astro 应用程序（包括 `.astro` 文件）搭建 **UI** 提取骨架；当您还想为 `.astro` 页面 HTML 进行 `translate-docs` 时，请添加一个 `docs[]` 块（请参阅 [Astro 网站页面（解析和替换）](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)）。参考 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 使用 **两种** 管道。当您希望一个命令根据您的配置运行提取、UI 翻译、可选的 SVG 文件翻译和文档翻译时，请使用 `sync`。

<a id="runnable-examples"></a>
### 可运行的示例

七个可运行的项目和夹具位于 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) 下。请参阅 [示例](/examples) 目录（控制台应用程序、Next.js + Docusaurus、Astro 网站、Astro Starlight 文档、VitePress 文档、多提供商比较、Markdown 压力测试）。

**独立运行一个示例**（无需克隆整个 monorepo）：

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
```

将 `console-app` 替换为任何示例文件夹名称。每个示例都声明了 `"ai-i18n-tools": "^1.7.2"` 并从 npm 安装 CLI。每个示例的 README 都包含相同的代码片段，其中已填充文件夹名称。

**从完整的 ai-i18n-tools 存储库：** 如果您克隆了整个存储库（而不仅仅是使用 degit 的一个示例文件夹），请从存储库根目录运行 `pnpm install`；工作区 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 条目 (`ai-i18n-tools: workspace:*`) 会自动将示例链接到您的本地检出。

```bash
# UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# VitePress docs: npx ai-i18n-tools init -t ui-vitepress
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# JSON (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 推荐的 `package.json` 脚本

在本地安装了该包后，您可以直接在脚本中使用 CLI 命令（无需 `npx`）。

**优先使用** `sync` 来处理任何以前需要“运行 `translate-ui`，然后 `translate-svg`，然后 `translate-docs`，然后 `translate-json`”的操作：`ai-i18n-tools sync` 根据您的配置按正确的顺序并使用共享标志运行 **提取**（启用时）、**翻译 UI**、可选的 **翻译 SVG**、**翻译文档**，然后是可选的 **翻译 JSON**。手动链接这些步骤很容易出错（顺序、提取、区域设置标志）。仅在需要 **单个**步骤隔离时才使用 `i18n:translate:ui`、`i18n:translate:svg`、`i18n:translate:docs` 和 `i18n:translate:json`。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**提示：** 如果您希望 CLI 输出和仪表板使用其他语言，请传递 `-L <code>` 或设置 `AI_I18N_LANG` — 请参阅 [工具 UI 语言](/reference/environment-variables#tool-ui-language)。

<a id="combined-sync"></a>
## 组合同步

在一个配置中启用所有功能，以同时运行 UI 字符串和文档：

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
    "uiGlossary": "src/locales/strings.json",
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

`glossary.uiGlossary` 将文档翻译指向与 UI 相同的 `strings.json` 目录，以保持术语一致性；`glossary.userGlossary` 添加了产品术语的 CSV 覆盖。

运行 `npx ai-i18n-tools sync` 来运行一个管道：当 `features.translateUIStrings` 启用时，**提取**然后**翻译 UI**字符串；可选**翻译 SVG**（`features.translateSVG` + `svg` 块）；**翻译文档**（根据配置的 `docs[]`）；然后可选**翻译 JSON**（`features.translateUIStrings` + `json[]`）。使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳过部分。文档和 `json[]` 步骤接受 `--dry-run`、`-p` / `--path`、`--force` 和 `--force-update`（当 `--no-docs` 时忽略仅文档的标志；当未设置 `--no-json` 时，JSON 使用相同的缓存标志）。

在块上使用 `docs[].targetLocales` 将该块的文件翻译成比 UI **更小的子集**（有效的文档区域设置是块之间的**并集**）：

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
### 混合文档配置 (`docsOutput.style = "docusaurus"` + `"flat"`)

您可以通过在 `docs` 中添加多个条目，在同一配置中组合多个文档管道。当项目具有 Docusaurus 站点（`docsOutput.style = "docusaurus"`）以及需要使用带区域设置后缀的文件名进行翻译的根级别 markdown 文件（例如，带有 `docsOutput.style = "flat"` 的存储库 README）时，这是一种常见的设置。

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

此功能在 `npx ai-i18n-tools sync` 中的运行方式：

- UI 字符串从 `src/` 中提取/翻译到 `public/locales/`。
- 第一个文档块将 **markdown** 从 `docs-site/docs/` 翻译成 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`（本地化文档页面）。
- 当设置了 `docs[].docusaurusCatalogDir` 并启用了 `features.translateDocs` 时，该块还会将 `docs-site/i18n/en/` 下的 **Docusaurus shell JSON** 翻译到每个目标语言的文件夹中 — 包括导航栏、页脚以及主题/插件目录，但不包括 MDX 正文。
- 第二个文档块将 `README.md` 翻译成 `translated-docs/` 下带有语言后缀的文件（`docsOutput.style = "flat"`）。
- 所有文档块共享 `cacheDir`，因此未更改的片段会在运行之间重复使用，以减少 API 调用和成本。
