<a id="documents"></a>
# 文档

主要为通过 `docs[]` 配置块管理的 **Markdown、MDX 和 `.astro` 文档**设计。每个块的 `contentPaths` 字段列出了要翻译的文件或文件夹。

在 [Docusaurus](/zh-Hans/guide/integrations/docusaurus) 站点上，还需将 `docusaurusCatalogDir` 设置为你的 `write-translations` 目录文件夹（例如 `docs-site/i18n/en`）。这样 `translate-docs` 也会包含 shell JSON——导航栏、页脚和主题字符串。

在 [VitePress](/zh-Hans/guide/integrations/vitepress) 站点上，页面正文使用相同的 `docs[]` 流水线。导航、侧边栏和页脚标签位于 `docsOutput.vitepressThemeCatalog` 中——`translate-docs` 会引导加载英文目录并在翻译页面的同时对其进行翻译，无需单独的流水线。

在 [Nextra](/zh-Hans/guide/integrations/nextra) 站点中，页面正文使用与 `docsOutput.style: "nextra"` 相同的 `docs[]` 管道。`_meta.ts` 侧边栏标签由 `translate-docs` 自动收集并翻译；主题字典字符串通过同一管道中的 `docs[].nextraDictionaryPath` 进行翻译。

在 [Fumadocs](/zh-Hans/guide/integrations/fumadocs) 站点中，页面正文使用 `docsOutput.style: "fumadocs"` 以及 `fumadocsParser` `"dot"`（默认）或 `"dir"`。`meta.json` 侧边栏标签会自动收集；UI 覆盖通过 `docsOutput.fumadocsUiCatalog` 翻译。

在 [Astro Starlight](/zh-Hans/guide/integrations/astro#astro-starlight) 站点上，页面正文使用 `docsOutput.style: "astro-starlight"`，并将 `docsRoot` 设置为你的 Starlight 内容根目录（通常是 `src/content/docs/`）。`translate-docs` 会在英文目录树旁边的 `src/content/docs/<locale>/` 下写入本地化的 markdown/MDX 文件。Starlight 内置了许多语言环境的 UI 字符串——无需单独的主题目录流水线；可选的 UI 覆盖可以在 `docs[]` 块上使用 `jsonPathTemplate` 来处理 `src/content/i18n/en.json`。

对于嵌入在 Markdown 中的 PNG 和其他栅格图像，请参阅[图像和屏幕截图](/zh-Hans/guide/images-and-screenshots/)。`translate-docs` 仅翻译替代文本；它不复制栅格文件。

如需在 README 或文档中添加可选的 **语言切换器** 块，请将 `docsOutput.style` 设置为 `"flat"`——参见[语言切换器](/zh-Hans/guide/documents/language-switcher)。

[SVG](/zh-Hans/guide/svg-translation/) 文件在启用 `features.translateSVG` 时通过 [`translate-svg`](/zh-Hans/reference/cli-commands/content#translate-svg) 进行翻译——而非通过 `docs[]` / `contentPaths`。

与文档框架的外壳/主题字符串无关的任意嵌套 UI JSON 包属于 [JSON](/zh-Hans/guide/json) 管道，而不属于 `docs[]`。

为确保 UI 与文档之间的 **术语一致性**，请将 `glossary.uiGlossary` 设置为你的 `strings.json` 路径——当片段中出现匹配的术语时，`translate-docs` 会将现有的 UI 翻译作为提示复用于 LLM 提示词中。可选的 `glossary.userGlossary` 可为产品术语添加 CSV 覆盖（与 `translate-ui` 和 `proofread-ui` 共享）。使用 `glossary-generate` 生成入门 CSV，在翻译仪表板的 **术语表** 标签页中编辑各行，或参见[配置 — `glossary`](/zh-Hans/reference/configuration#glossary)和[术语表](/zh-Hans/guide/translation-dashboard/glossary)。

<a id="per-locale-model-overrides"></a>
### 每个区域模型覆盖

`translate-docs` 和 `sync` 的文档步骤会 **按目标语言环境** 解析模型：优先使用已配置的 `localeModels(locale)`，然后使用提供商的全局 `translationModels` 链。当某种特定语言需要与默认回退列表中不同的模型时使用此功能——例如，当全局链在处理葡萄牙语时表现不佳，可为 `pt-BR` 文档优先使用 Gemini。参见[提供商和模型](/zh-Hans/guide/providers-and-models#model-fallback-chain)和[配置 - `localeModels`](/zh-Hans/reference/configuration#provider-and-providers)。

<a id="which-guide-to-read"></a>
## 阅读哪个指南

| 你的配置 | 从这里开始 |
| --- | --- |
| Docusaurus 站点 | `init -t ui-docusaurus`、`docsOutput.style = "docusaurus"` — [Docusaurus](/zh-Hans/guide/integrations/docusaurus) |
| VitePress 站点 | `init -t ui-vitepress` + `vitepressThemeCatalog` 用于主题 — [VitePress](/zh-Hans/guide/integrations/vitepress) |
| Nextra 站点 | `init -t ui-nextra` + `nextraDictionaryPath` 用于字典（侧边栏 `_meta.ts` 是自动的）— [Nextra](/zh-Hans/guide/integrations/nextra) |
| Fumadocs 站点 | `init -t ui-fumadocs` + `fumadocsUiCatalog` 用于 UI（侧边栏 `meta.json` 是自动的）— [Fumadocs](/zh-Hans/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` — [Astro Starlight](/zh-Hans/guide/integrations/astro#astro-starlight) |
| 扁平文档（README、变更日志等） | `docsOutput.style = "flat"` — [输出布局](/zh-Hans/guide/documents/output-layouts)，可选[语言切换器](/zh-Hans/guide/documents/language-switcher) |
| 翻译文件存放位置 | [输出布局](/zh-Hans/guide/documents/output-layouts) |
| 跨页面 `#anchor` 链接 | [锚点链接](/zh-Hans/guide/documents/anchor-links) |
| 链接和资产 URL 重写 (`regexAdjustments`) | [链接重写](/zh-Hans/guide/documents/link-rewriting) |
| 文档中的屏幕截图 | [图像和屏幕截图](/zh-Hans/guide/images-and-screenshots/) |
| 产品术语和 UI/文档一致性 | [配置 — `glossary`](/zh-Hans/reference/configuration#glossary)、[术语表](/zh-Hans/guide/translation-dashboard/glossary) |
| `translate-docs` 标志和缓存 | [CLI 选项](/zh-Hans/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## 步骤 1：初始化文档

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
```

适用于 Astro Starlight 文档网站：

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
```

对于 VitePress 文档站点：

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
```

为导航/侧边栏/页脚字符串设置 `docsOutput.vitepressThemeCatalog`——参见 [VitePress 集成](/zh-Hans/guide/integrations/vitepress)。

对于 Nextra 文档站点：

```bash
ai-i18n-tools init -t ui-nextra [-P <provider>]
```

为主题字典字符串设置 `docs[].nextraDictionaryPath`——参见 [Nextra 集成](/zh-Hans/guide/integrations/nextra)。侧边栏 `_meta.ts` 标签会自动收集。

对于 Fumadocs 文档站点：

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
```

为 UI 覆盖设置 `docsOutput.fumadocsUiCatalog`——参见 [Fumadocs 集成](/zh-Hans/guide/integrations/fumadocs)。侧边栏 `meta.json` 标签会自动收集。

适用于纯 Astro 网站 UI（无 Starlight）：

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
```

该模板仅启用 UI 提取。对于页面 HTML 翻译，还要设置 `features.translateDocs` 并添加一个 `docs[]` 块（请参阅 [Astro 网站页面（解析和替换）](/zh-Hans/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)）。[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 配置显示了两个管道。

编辑生成的 `ai-i18n-tools.config.json`：

- `provider` 和 `providers` — `init` 会搭建一个默认的提供商块（除非你传入 `-P <provider>`，否则为 `openrouter`）；在运行 `translate-docs` 或 `sync` 之前，请至少配置一个提供商并设置其 API 密钥（Ollama 不需要密钥）。参见[提供商和 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key)和 [LLM 提供商和模型](/zh-Hans/guide/providers-and-models)。
- `sourceLocale` — 源语言（必须与 `docusaurus.config.js` 中的 `defaultLocale` 匹配）。
- `targetLocales` — BCP-47 语言环境代码数组（例如 `["de", "fr", "es"]`）。
- `cacheDir` — 所有流水线共享的 SQLite 缓存目录（也是 `--write-logs` 的默认日志目录）。
- `docs` - 文档块数组。每个块包含可选的 `description`、`contentPaths`（字符串或数组；文件、目录或 glob）、`outputDir`、可选的 `docusaurusCatalogDir`、`docsOutput`、可选的 `segmentSplitting`、`translateFrontmatterFields`、`protectAttributes`、`protectKeys`、`targetLocales`、`addFrontmatter` 等。
- `docs[].description` - 为维护者提供的可选简短说明。设置后，它会显示在 `translate-docs` 标题和 `status` 章节标题中。
- `docs[].contentPaths` - markdown/MDX/`.astro` 源文件（以及用于 Docusaurus shell JSON 的可选 `docusaurusCatalogDir`）。
- `docs[].outputDir` - 该块的翻译输出根目录。
- `docs[].docsOutput.style` — `"nested"`（默认）、`"flat"`、`"doc-system"`，或别名 `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"`（参见[输出布局](/zh-Hans/guide/documents/output-layouts)）。
- `glossary.uiGlossary` — `strings.json` 的路径，使文档片段能从你的 UI 目录获取术语提示（参见[配置 — `glossary`](/zh-Hans/reference/configuration#glossary)）。
- `glossary.userGlossary` — 用于固定产品术语翻译的可选 CSV；也被 UI 流水线使用，并可在[术语表](/zh-Hans/guide/translation-dashboard/glossary)仪表板标签页中编辑。

**主要与补充：** 专注于 `contentPaths` 用于本地化页面。当您还需要来自 `write-translations` 的 Docusaurus shell JSON 时，请设置 `docusaurusCatalogDir`。如果您只翻译页面，请省略 `docusaurusCatalogDir`。

<a id="step-2-translate-documents"></a>
## 步骤 2：翻译文档

```bash
ai-i18n-tools translate-docs
```

这会将每个 `docs[]` 块的 `contentPaths` 中的所有文件（以及设置 `docusaurusCatalogDir` 时的 Docusaurus 目录 JSON）翻译为所有有效的文档语言环境。已翻译的片段将从 SQLite 缓存中提供 - 只有新增或更改的片段才会发送到 LLM。

翻译单个区域设置：

```bash
ai-i18n-tools translate-docs --locale de
```

检查需要翻译的内容：

```bash
ai-i18n-tools status
```

有关标志、缓存行为和批量提示格式，请参阅[CLI 选项](/zh-Hans/guide/documents/cli-options)。

<a id="complex-markdown-and-failed-quality-checks"></a>
## 复杂的 Markdown 和未通过的质量检查

`translate-docs` 检查每个翻译段落是否保留了 Markdown 结构（包括从文档中解析出的强调格式）。包含大量 `bold` 范围、在 `` `inline code` `` 周围嵌套反引号、或将粗体与代码混入长句中的段落（例如模板字符串如 `` `fetch(\`/locales/${code}.json\`)` ``）非常脆弱：某些语言区域需要不同的词序，这可能会改变翻译后 `**` 和 `` ` `` 的对应关系，从而触发 CLI 错误，例如 `AST mismatch`。

**如果您遇到此类验证失败，建议优先简化源语言文本** - 拆分段落、将示例移入围栏代码块，或者用更少的嵌套粗体/代码对来描述相同的概念 - 而不是期望每个模型和语言环境都能完美重现密集的内联标记。

当所有配置的模型在同一个段落上均因 `AST mismatch` 失败时，`translate-docs` 可自动将该段落拆分为更小的部分（首先拆分列表中点，然后是单个列表项或更短的段落片段），从第一个模型开始重试每个部分，并在原始段落缓存键下重新合并结果。此功能默认启用（`segmentSplitting.qualityRetrySplit`）；设置为 `false` 可在模型全部失败后停止。运行摘要会在触发此回退机制时报告 `Quality split retries`。

要查看**哪些段落失败了**、失败频率以及存储的**质量/错误消息**，请使用翻译仪表板的**失败**选项卡（[翻译仪表板 → 失败](/zh-Hans/guide/translation-dashboard/failures#failures-document-translation)）。
