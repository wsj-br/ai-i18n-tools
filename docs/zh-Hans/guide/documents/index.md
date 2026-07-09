<a id="documents"></a>
# 文档

主要为通过 `docs[]` 配置块管理的 **Markdown、MDX 和 `.astro` 文档**设计。每个块的 `contentPaths` 字段列出了要翻译的文件或文件夹。

在 Docusaurus 站点上，还要将 `docusaurusCatalogDir` 设置为您的 `write-translations` 目录文件夹（例如 `docs-site/i18n/en`）。然后 `translate-docs` 也包括 shell JSON — 导航栏、页脚和主题字符串。

在 [VitePress](/guide/vitepress-integration) 站点中，页面正文使用相同的 `docs[]` 管道。导航、侧边栏和页脚标签位于 `docsOutput.vitepressThemeCatalog` 中 —— `translate-docs` 会初始化英文目录并与页面一起翻译，无需单独的管道。

在 [Nextra](/guide/nextra-integration) 站点中，页面正文使用与 `docsOutput.style: "nextra"` 相同的 `docs[]` 管道。`_meta.ts` 侧边栏标签由 `translate-docs` 自动收集并翻译；主题字典字符串在同一管道中通过 `docs[].nextraDictionaryPath` 进行翻译。

在 [Fumadocs](/guide/fumadocs-integration) 站点中，页面正文使用 `docsOutput.style: "fumadocs"`，并带有 `fumadocsParser` `"dot"`（默认）或 `"dir"`。`meta.json` 侧边栏标签会自动收集；UI 覆盖项通过 `docsOutput.fumadocsUiCatalog` 进行翻译。

对于嵌入在 Markdown 中的 PNG 和其他栅格图像，请参阅[图像和屏幕截图](/guide/images-and-screenshots/)。`translate-docs` 仅翻译替代文本；它不复制栅格文件。

对于 README 或文档中可选的**语言切换器**块，请将 `docsOutput.style` 设置为 `"flat"` — 请参阅[语言切换器](/guide/documents/language-switcher)。

当 `features.translateSVG` 启用时，SVG 文件通过 [`translate-svg`](/reference/cli-commands) 翻译 — 而不是通过 `docs[]` / `contentPaths`。

与文档框架的外壳/主题字符串无关的任意嵌套 UI JSON 包属于 [JSON](/guide/json) 管道，而不属于 `docs[]`。

<a id="per-locale-model-overrides"></a>
### 每个区域模型覆盖

`translate-docs` 和 `sync` 的文档步骤解析模型 **按目标区域**：首先配置 `localeModels(locale)`，然后是提供商的全局 `translationModels` 链。当特定语言需要与默认回退列表不同的模型时使用此功能——例如，当全局链在处理葡萄牙语时遇到困难时，优先选择 Gemini 用于 `pt-BR` 文档。参见 [提供商和模型](/guide/providers-and-models#model-fallback-chain) 和 [配置 — `localeModels`](/reference/configuration#provider-and-providers)。

<a id="which-guide-to-read"></a>
## 阅读哪个指南

| 您的设置 | 从这里开始 |
| --- | --- |
| Docusaurus 站点 | `init -t ui-docusaurus`，`docsOutput.style = "docusaurus"` — [步骤 1](#step-1-initialise-for-documentation) |
| VitePress 站点 | 用于主题的 `init -t ui-vitepress` + `vitepressThemeCatalog` — [VitePress 集成](/guide/vitepress-integration) |
| Nextra 站点 | 用于字典的 `init -t ui-nextra` + `nextraDictionaryPath`（侧边栏 `_meta.ts` 是自动的）— [Nextra 集成](/guide/nextra-integration) |
| Fumadocs 站点 | 用于 UI 的 `init -t ui-fumadocs` + `fumadocsUiCatalog`（侧边栏 `meta.json` 是自动的）— [Fumadocs 集成](/guide/fumadocs-integration) |
| Astro Starlight | `init -t ui-starlight` — [步骤 1](#step-1-initialise-for-documentation) |
| 平面文档（README、更新日志等） | `docsOutput.style = "flat"` — [输出布局](/guide/documents/output-layouts)，可选的[语言切换器](/guide/documents/language-switcher) |
| 翻译文件存放位置 | [输出布局](/guide/documents/output-layouts) |
| 跨页面 `#anchor` 链接 | [锚点链接](/guide/documents/anchor-links) |
| 链接和资产 URL 重写 (`regexAdjustments`) | [链接重写](/guide/documents/link-rewriting) |
| 文档中的屏幕截图 | [图像和屏幕截图](/guide/images-and-screenshots/) |
| `translate-docs` 标志和缓存 | [CLI 选项](/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## 步骤 1：初始化文档

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

适用于 Astro Starlight 文档网站：

```bash
npx ai-i18n-tools init -t ui-starlight
```

对于 VitePress 文档站点：

```bash
npx ai-i18n-tools init -t ui-vitepress
```

为导航/侧边栏/页脚字符串设置 `docsOutput.vitepressThemeCatalog` — 参见 [VitePress 集成](/guide/vitepress-integration)。

对于 Nextra 文档站点：

```bash
npx ai-i18n-tools init -t ui-nextra
```

设置 `docs[].nextraDictionaryPath` 用于主题字典字符串 — 参见 [Nextra 集成](/guide/nextra-integration)。侧边栏 `_meta.ts` 标签会自动收集。

对于 Fumadocs 文档站点：

```bash
npx ai-i18n-tools init -t ui-fumadocs
```

设置 `docsOutput.fumadocsUiCatalog` 用于 UI 覆盖 — 参见 [Fumadocs 集成](/guide/fumadocs-integration)。侧边栏 `meta.json` 标签会自动收集。

适用于纯 Astro 网站 UI（无 Starlight）：

```bash
npx ai-i18n-tools init -t ui-astro-website
```

该模板仅启用 UI 提取。对于页面 HTML 翻译，还要设置 `features.translateDocs` 并添加一个 `docs[]` 块（请参阅 [Astro 网站页面（解析和替换）](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)）。[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 配置显示了两个管道。

编辑生成的 `ai-i18n-tools.config.json`：

- `sourceLocale` - 源语言（必须与 `docusaurus.config.js` 中的 `defaultLocale` 匹配）。
- `targetLocales` - BCP-47 区域设置代码数组（例如 `["de", "fr", "es"]`）。
- `cacheDir` - 所有管道的共享 SQLite 缓存目录（以及 `--write-logs` 的默认日志目录）。
- `docs` - 文档块数组。每个块都有可选的 `description`、`contentPaths`（字符串或数组；文件、目录或 glob）、`outputDir`、可选的 `docusaurusCatalogDir`、`docsOutput`、可选的 `segmentSplitting`、`translateFrontmatterFields`、`protectAttributes`、`protectKeys`、`targetLocales`、`addFrontmatter` 等。
- `docs[].description` - 为维护者提供的可选简短说明。设置后，它会出现在 `translate-docs` 标题和 `status` 章节标题中。
- `docs[].contentPaths` - markdown/MDX/`.astro` 源文件（以及用于 Docusaurus shell JSON 的可选 `docusaurusCatalogDir`）。
- `docs[].outputDir` - 该区块的翻译输出根目录。
- `docs[].docsOutput.style` - `"nested"`（默认）、`"flat"`、`"doc-system"`，或别名 `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"`（参见[输出布局](/guide/documents/output-layouts)）。

**主要与补充：** 专注于 `contentPaths` 用于本地化页面。当您还需要来自 `write-translations` 的 Docusaurus shell JSON 时，请设置 `docusaurusCatalogDir`。如果您只翻译页面，请省略 `docusaurusCatalogDir`。

<a id="step-2-translate-documents"></a>
## 步骤 2：翻译文档

```bash
npx ai-i18n-tools translate-docs
```

这会将每个 `docs[]` 块的 `contentPaths`（以及当设置了 `docusaurusCatalogDir` 时的 Docusaurus 目录 JSON）中的所有文件翻译成所有有效的文档区域设置。已翻译的段落将从 SQLite 缓存中提供——只有新的或更改的段落才会发送到 LLM。

翻译单个区域设置：

```bash
npx ai-i18n-tools translate-docs --locale de
```

检查需要翻译的内容：

```bash
npx ai-i18n-tools status
```

有关标志、缓存行为和批量提示格式，请参阅[CLI 选项](/guide/documents/cli-options)。

<a id="complex-markdown-and-failed-quality-checks"></a>
## 复杂的 Markdown 和未通过的质量检查

`translate-docs` 检查每个翻译段落是否保留了 Markdown 结构（包括从文档中解析出的强调格式）。包含大量 `bold` 范围、在 `` `inline code` `` 周围嵌套反引号、或将粗体与代码混入长句中的段落（例如模板字符串如 `` `fetch(\`/locales/${code}.json\`)` ``）非常脆弱：某些语言区域需要不同的词序，这可能会改变翻译后 `**` 和 `` ` `` 的对应关系，从而触发 CLI 错误，例如 `AST mismatch`。

**如果您遇到此类验证失败，请优先简化源语言文本**——拆分段落，将示例移至围栏代码块中，或用更少的嵌套粗体/代码对描述相同的想法——而不是期望每个模型和区域设置都能完美地重现密集的内联标记。

当所有配置的模型在同一个段落上均因 `AST mismatch` 失败时，`translate-docs` 可自动将该段落拆分为更小的部分（首先拆分列表中点，然后是单个列表项或更短的段落片段），从第一个模型开始重试每个部分，并在原始段落缓存键下重新合并结果。此功能默认启用（`segmentSplitting.qualityRetrySplit`）；设置为 `false` 可在模型全部失败后停止。运行摘要会在触发此回退机制时报告 `Quality split retries`。

要查看**哪些段落失败了**、失败频率以及存储的**质量/错误消息**，请使用翻译仪表板的**失败**选项卡（[翻译仪表板 → 失败](/guide/translation-dashboard/failures#failures-document-translation)）。
