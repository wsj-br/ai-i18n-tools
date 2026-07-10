<a id="architecture"></a>
# 架构

<a id="architecture-overview"></a>
## 架构概述

代码库分为四个层。本节用于心智模型；当您需要文件级详细信息时，请打开[源代码树](#source-tree)。

<a id="how-a-sync-run-fits-together"></a>
### `sync` 运行如何协同工作

`sync`（以及各个翻译命令）按顺序运行已启用的功能：

| 步骤 | 命令 | 功能 |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | 扫描 UI 源 → 更新 `strings.json` → 填充平面区域设置 JSON (`de.json`, …) |
| 2 | `translate-svg` *(可选)* | 翻译 `config.svg` 下的 SVG 文本 |
| 3 | `translate-docs` | 翻译 markdown、MDX、`.astro` 页面；Docusaurus 目录 JSON；Nextra `_meta` / 字典 `.ts`；VitePress 主题目录 |
| 4 | `translate-json` *(可选)* | 翻译 `json[]` 下的嵌套 JSON 叶子 |

每个管道都遵循相同的核心循环：**提取段 → 保护语法 → 批处理 → 缓存查找或 LLM 调用 → 写入输出**。中间的共享服务——配置、占位符、缓存、词汇表、`LlmClient`——在[共享基础设施](#shared-infrastructure)下描述。

<a id="module-map"></a>
### 模块映射

| 层 | 文件夹 | 角色 |
| --- | --- | --- |
| **入口** | `src/cli/` | CLI 命令：`init`、`extract`、`mark-html`、`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`、`status`、`dashboard`、… |
| **管道** | `src/extractors/` | 从 JS/TS、HTML 标记、Markdown、JSON、SVG、`.astro` 中提取段 |
| | `src/processors/` | 占位符保护、批处理、验证、链接重写 |
| **共享** | `src/core/` | 配置、类型、SQLite 缓存、提示、输出路径、区域设置实用程序 |
| | `src/api/` | `LlmClient` — 与提供商无关的聊天客户端（Vercel AI SDK），带模型回退 |
| | `src/glossary/` | 词汇表加载和提示的术语提示 |
| | `src/utils/` | 记录器、哈希、忽略解析器、显示宽度表、`.env` 加载器 |
| **您的应用运行时** | `src/runtime/` | i18next 助手和显示实用程序 — 导出为 `'ai-i18n-tools/runtime'` ([运行时助手](/zh-Hans/guide/runtime-helpers)) |
| **工具 UI** *(内部测试)* | `src/i18n/`、`src/dashboard-app/`、`src/server/` | 本地化此包自己的 CLI 和翻译仪表板 — 与您的项目内容分开 ([自本地化](#self-localization-tool-ui)) |

所有用于编程用途的内容都从 `src/index.ts` 重新导出 ([编程 API](/zh-Hans/reference/programmatic-api))。

<a id="pipeline-summaries"></a>
### 管道摘要

| 管道 | 部分 | 输入 → 输出 |
| --- | --- | --- |
| UI 字符串 | [UI 字符串内部](#ui-strings-internals) | 源文件 → `strings.json` → 平面 `{locale}.json` |
| 文档 | [文档内部](#documents-internals) | Markdown / MDX / `.astro` / Docusaurus JSON → `docs[].outputDir` 下的每个区域设置文件 |
| JSON 包 | [JSON 内部](#json-internals) | `json[]` 下的嵌套 JSON → 每个区域设置的 JSON 文件 |
| SVG | [文档内部 — 提取器](#extractors) | `config.svg` 下的 SVG 文件 → 翻译的 SVG 副本 |

---

<a id="ui-strings-internals"></a>
## UI 字符串内部结构

| 步骤 | 组件 | 结果 |
| --- | --- | --- |
| 1 | 源文件 (JS/TS; 可选 `.astro` / `.html`) | 磁盘上的文件 |
| 2 | `UIStringExtractor` (i18next-scanner; 通过 `ui-string-babel.ts` 的 `.astro`) | 以 MD5 哈希为键的段 |
| 3 | `strings.json` | 主目录：`{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | 源字符串的 JSON 数组 → 翻译（+ 每批模型 ID） |
| 5 | `de.json`、`pt-BR.json`、… | 平面映射：源字符串 → 翻译（无模型元数据） |

<a id="uistringextractor"></a>
### `UIStringExtractor`

使用 `i18next-scanner` 的 `Parser.parseFuncFromString` 在 JS/TS 文件中查找 `t("literal")` 和 `i18n.t("literal")` 调用。对于 `.astro` 源（当在 `ui.uiExtractor.extensions` 中列出时），`ui-string-babel.ts` 使用 `@babel/parser` 解析 frontmatter 和模板 `{expression}` 块，并应用相同的 `funcNames` 规则。函数名和文件扩展名可通过 `ui.uiExtractor` 配置（`ui.reactExtractor` 是受支持的别名）。`extract` **还会将非扫描器输入合并到同一目录中：** 当启用 `includePackageDescription`（默认）时的项目 `package.json` `description`，以及当 `includeUiLanguageEnglishNames` 为 `true` 时来自捆绑的 ui-languages 主目录（由 `sourceLocale` + `targetLocales` 构建）的每个 `englishName`（已在源中找到的字符串保持优先级；不读取 `languagesManifestPath`）。`extract` 还会在 `languagesManifestPath` 处重新生成 `ui-languages.json`。段哈希是修剪后的源字符串的 **MD5 前 8 个十六进制字符** —— 它们成为 `strings.json` 中的键。

对于 `.html` / `.htm` 源（当在 `ui.uiExtractor.extensions` 中列出时），`extract` 会将文件路由到 `html-i18n-marks.ts`，后者会扫描 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 标记属性（可通过 `ui.uiExtractor.htmlI18nAttributes` 配置）。裸标记从元素的自身 `textContent` / `title` / `placeholder` 获取源文本；带值的标记（`data-i18n="Key"`）使用该值。相同的模块也支持 `mark-html` 命令，该命令会自动插入裸标记。HTML 文件永远不会到达 Babel / i18next-scanner 阶段。

纯 Astro SSG 站点可以跳过 i18next：在构建时加载扁平化的 `{locale}.json`，并按源文本键解析 `t('English')`（参见 `examples/astro-website/src/i18n/t.ts` 和 [UI 字符串 — Astro 网站](/zh-Hans/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight)）。

纯 HTML 应用遵循相同的目录模型，使用标记属性代替 `t()` 调用 — 参见[为翻译标记 HTML](/zh-Hans/guide/ui-strings/plain-html#marking-html-for-translation)。

<a id="stringsjson"></a>
### `strings.json`

主目录的结构如下：

```json
{
  "a1b2c3d4": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models`（可选）—— 按区域设置，在最后一次针对该区域设置的成功 `translate-ui` 运行后生成该翻译的模型（如果文本是从翻译仪表板保存的，则为 `user-edited`）。`locations`（可选）—— `extract` 找到字符串的位置（扫描器 + 包描述行；捆绑主 `englishName` 字符串可能会省略 `locations`）。

`extract` 添加新键，并为扫描中仍然存在的键（扫描器字面量、可选描述、可选的捆绑主 `englishName`）保留现有的 `translated` / `models` 数据。`translate-ui` 填充缺失的 `translated` 条目，为其翻译的区域设置更新 `models`，并写入扁平的区域设置文件。

`ui-languages.json` **清单** —— `{ code, label, englishName, direction }` 的 JSON 数组（BCP-47 `code`、UI `label`、参考 `englishName`、`"ltr"` 或 `"rtl"`）。使用 `generate-ui-languages` 或 `extract` 从 `sourceLocale` + `targetLocales` 和捆绑的主 `data/ui-languages-complete.json` 构建项目文件。

<a id="flat-locale-files"></a>
### 扁平化区域设置文件

每个目标区域设置都有一个扁平化的 JSON 文件（`de.json`），将源字符串映射到翻译（没有 `models` 字段）：

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next 将这些加载为资源包，并通过源字符串（键即默认模型）查找翻译。

<a id="ui-translation-prompts"></a>
### UI 翻译提示

`buildUIPromptMessages` 构建系统 + 用户消息，这些消息：

- 标识源语言和目标语言（来自 `localeDisplayNames` 或 `ui-languages.json` 的显示名称）。
- 发送字符串的 JSON 数组，并要求返回翻译的 JSON 数组。
- 在可用时包含术语表提示。

`LlmClient.translateUIBatch` 按顺序尝试每个模型，并在解析或网络错误时回退。CLI 根据 `localeModels`、可选的 `uiModels` 和 `translationModels` 为每个目标区域设置构建该列表（请参阅[提供商和模型](/zh-Hans/guide/providers-and-models#model-fallback-chain))。

---

<a id="documents-internals"></a>
## 文档内部结构

| 步骤 | 组件 | 结果 |
| --- | --- | --- |
| 1 | Markdown / MDX / JSON / `.astro` 文件 (`translate-docs`) | 源文件 |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` — 带有哈希 + 内容的类型化段 |
| 3 | `PlaceholderHandler` | 受保护文本 — HTML、提示、锚点、MDX、URL、内联代码、强调作为标记被屏蔽 |
| 4 | `splitTranslatableIntoBatches` | `batches[]` — 按计数 + 字符限制分组 |
| 5 | `TranslationCache` 查找 | 缓存命中 → 跳过；未命中 → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | 最终文本 — 占位符已恢复 |
| 7 | `resolveDocumentationOutputPath` | 输出文件 — Docusaurus 布局或平面布局 |

<a id="extractors"></a>
### 提取器

所有提取器都扩展 `BaseExtractor` 并实现 `extract(content, filepath): Segment[]`。

- `MarkdownExtractor` - 将 markdown 拆分为带类型的片段：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。YAML frontmatter 被归类为**不可翻译**（`slug`、`id`和其他路由键保持不变）。顶层 `export ...` 块（例如 React 组件定义）与现有的 `import ...` 处理一起被归类为不可翻译的 `other` 片段。以大写 JSX 标签开头的多行块（例如 `<Tabs>` 块）被归类为可翻译段落。不可翻译的片段（代码块、原始 HTML）将原样保留。
- `AstroTemplateExtractor` - 针 `.astro` 营销页面的解析并替换（通过 `doc-translate.ts` 中的 `translateAstroFile` 使用 `translate-docs`）。提取面向用户的 HTML 文本节点和可翻译属性（`alt`、`title`、`aria-label`、`placeholder`），以及模板 `{expression}` 块中面向用户时的字符串字面量。跳过 frontmatter TypeScript、`<script>`、`<style>`、受保护的属性/键值，以及 `t('…')` 内部的字面量。当输出路径更深时，重新组装会调整相对导入（例如 `src/pages/de/index.astro`）。参见[Astro 网站页面](/zh-Hans/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)。
- `JsonExtractor` - 从 Docusaurus JSON 标签文件中提取字符串值（Docusaurus UI 目录，而非 MDX 正文）。
- `SvgExtractor` - 从 SVG 中提取 `<text>`、`<title>` 和 `<desc>` 内容（由 `translate-svg` 用于 `config.svg` 下的文件，而非由 `translate-docs` 使用）。
- `html-i18n-marks.ts` - 一个集中的 HTML 标签扫描器，由 `extract` 用于 `.html` / `.htm` 源，并由 `mark-html` 命令使用。`collectHtmlI18nStrings` / `collectHtmlI18nLocations` 读取 `data-i18n*` 标记属性（裸标记 → 元素 `textContent` / `title` / `placeholder`；带值的标记 → 值），并且 `markHtmlContent` 将裸标记插入到叶文本/标题/占位符元素中（幂等的，尊重 `data-i18n-ignore`，跳过类似代码和混合内容元素）。共享的 `normalizeI18nText` 助手使构建时密钥与浏览器运行时保持一致。

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro 混合站点（UI + 页面 HTML）

普通的 Astro 应用程序通常在一个配置中同时启用 **UI 字符串和文档**（参考：`examples/astro-website/`）：

| 层 | 机制 | 输出 |
| --- | --- | --- |
| 模板 HTML | `AstroTemplateExtractor` + `translate-docs` | `docs[].outputDir` 下的每个区域设置 `.astro` |
| 前端内容 / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | 扁平化 `public/locales/{locale}.json`（英文源作为键）|

`sync` 命令按顺序运行启用的步骤：**提取**，然后是 **翻译 UI**（当 `features.translateUIStrings` 时）→ 可选的 **翻译 SVG** → **翻译文档** → 可选的 **翻译 JSON**（除非通过 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳过）。初始化模板 `ui-astro-website` 仅搭建 UI 字符串；添加 `docs[]` 和 `features.translateDocs` 用于页面 HTML。

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### 标题锚点插入（`write-heading-ids` CLI）

命令 `write-heading-ids` 是一个 **本地、非 LLM** 的文档 markdown 预处理器。实现：`src/cli/write-heading-ids.ts` 协调文件发现；`src/markdown/write-heading-ids-core.ts` 解析行并插入锚点。

它需要一个有效的配置，其中**至少有一个`docs[]`块**。对于每个块，它会收集`.md` / `.mdx`文件到`contentPaths`下，应用项目的`.translate-ignore`规则（与文档翻译类似），并可选择使用`--path` / `--file`限制到子树。每个文件都通过`applyHeadingAnchorsToMarkdown`进行转换：对于围栏代码块之外的每个**扁平ATX标题**（`# …`到`###### …`），如果缺少或过时，则在其上方插入一个空HTML行`<a id="slug"></a>`。Slug算法与常见的生态系统匹配——`github`（默认）、`bitbucket`、`gitlab`、`pymdown`（可选的Unicode规范化/百分比编码标志）、`azure-devops`——因此锚点ID与现有工具（doctoc、PyMdown等）保持一致。`--dry-run`报告将要进行的编辑而不写入。

此命令 **不** 在 `translate-docs` 或 `sync` 中运行；当您希望在翻译或发布之前源文件中的片段 ID 稳定时，请显式运行它。

<a id="placeholder-protection"></a>
### 占位符保护

在翻译之前，敏感语法会被替换为不透明的令牌，以防止 LLM 损坏，按此顺序应用（恢复顺序相反）：

1. **HTML标签和注释**（`<strong>`、`<!-- ... -->`等）- 来自已知允许列表的小写HTML标签被替换为```{{HTM_N}}```标记。大写的JSX标签（`<Highlight>`、`<Tabs>`、`</Tab>`）由MDX层（步骤4）单独处理。
2. **提示标记**（`:::note`、`:::`）- 只有起始行上的指令前缀被替换为```{{ADM_OPEN_N}}```；任何同一行的标题都留给模型翻译。用确切的原始文本恢复。
3. **文档锚点**（HTML `<a id="…">`、Docusaurus标题`{#…}`）- 逐字保留。
4. **仅MDX结构**（`src/processors/mdx-placeholders.ts`）：
   - **MDX 注释**（`{/* … */}`，包括 Docusaurus 标题 ID 形式 `{/* #my-id */}`）替换为 ```{{MDX_N}}```。
   - **大写 JSX 标签**（`<Highlight>`、`<Tabs>`、`<TabItem>`、`<TOCInline />`、`</Highlight>`）——保留为 ```{{MDX_N}}```，其中可翻译的字符串属性（`label`、`tooltip`、`aria-label`）在标签内重写为 ```{{JXA_N}}```，除非属性名称出现在 `docs[].protectAttributes` 中；`label:` 在 `<Tabs values={[ { label: '…' } ]}>` 对象字面量中（可通过 `docs[].protectKeys` 跳过）和 `<TabItem value="…">`（当不存在 `label` 属性时，跳过小写类似 slug 的值）也被提取。作为 `||JXA_N: …||` 行附加到段落，由 `restoreMdx` 合并回去。
   - **MDX 大括号表达式**（`{frontMatter.title}`，<code v-pre>style={{…}}</code>）——深度感知匹配，替换为 ```{{MDX_N}}```。
5. **Markdown URL**（`](url)`，`src="…"`）——翻译后从映射中恢复。
6. **行内代码跨度**（`` `code` ``）和 **粗体包裹的行内代码**（`**`code`**`）- 保留。
7. **Markdown 强调**（可选，对 CJK/RTL 区域自动启用）- 强调分隔符被屏蔽。

Astro 模板和 MDX JSX 的共享属性/键保护在 `src/processors/expression-attribute-protection.ts` 中实现，并由 `docs[].protectAttributes` 和 `docs[].protectKeys` 按块驱动（参见 [保护属性 / 保护键](/zh-Hans/reference/configuration#protectattributes-protectkeys)）。

<a id="cache-translationcache"></a>
### 缓存（`TranslationCache`）

SQLite 数据库（通过 `node:sqlite`）存储行，键由 `(source_hash, locale)` 加上 `translated_text`、`model`、`filepath`、`last_hit_at` 和相关字段组成。哈希值是规范化内容（折叠空格后）的前 16 个十六进制字符的 SHA-256。

每次运行时，都会通过哈希 × 区域设置查找段。只有缓存未命中才会转到 LLM。翻译后，`last_hit_at` 会针对当前翻译范围内未命中的段行重置。文档翻译期间成功的缓存命中会清除该段的陈旧 `translation_failures` 行。`cleanup` 首先运行 `sync --force-update`，然后删除陈旧的段行（空 `last_hit_at` / 空文件路径），当磁盘上缺少解析的源路径时修剪 `file_tracking` 键（`doc-block:…`、`json-block:…`、`svg-files:…` 等），删除元数据文件路径指向缺失文件的翻译行，修剪孤立的 `translation_failures` 行，并修剪解析的源路径在磁盘上缺失的孤立 `markdown_source_issues` 行；除非传递 `--backup <path>`，否则它不会备份 `cache.db`，后者会首先将备份写入该路径。

`translate-docs` 命令还使用**文件跟踪**，因此具有现有、最新输出的未更改源可以完全跳过工作。`--force-update` 重新运行文件处理，同时仍使用段缓存；`--force` 清除文件跟踪并绕过 API 翻译的段缓存读取。当每个配置的模型在 markdown 段上 AST 验证失败时，`translate-docs` 可以逐步拆分段并重试较小的部分（`docs[].segmentSplitting.qualityRetrySplit`，默认开启）。有关完整的标志表，请参阅 [文档 — 缓存行为和标志](/zh-Hans/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags)。

**批量提示格式：** `translate-docs --prompt-format` 仅为 `LlmClient.translateDocumentBatch` 选择 XML (`<seg>` / `<t>`) 或 JSON 数组/对象形状；提取、占位符和验证保持不变。请参阅 [批量提示格式](/zh-Hans/guide/documents/cli-options#batch-prompt-format)。

<a id="output-path-resolution"></a>
### 输出路径解析

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` 将相对于源的路径映射到输出路径：

- `nested` 样式（默认）：用于 Markdown 的 `{outputDir}/{locale}/{relPath}`。
- `doc-system` 样式：在 `docsRoot` 下，输出使用 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`；`docsRoot` 之外的路径回退到嵌套布局。别名：`docusaurus`（默认 `localeSubpath` = Docusaurus 插件路径）、`astro-starlight`（默认空 `localeSubpath`）、`vitepress`（与 `doc-system` 相同，但 `localeSubpath` 为空；保留 BCP-47 文件夹大小写）。
- `flat` 样式：`{outputDir}/{stem}.{locale}{extension}`。当 `flatPreserveRelativeDir` 为 `true` 时，源子目录保留在 `outputDir` 下。
- **自定义** `pathTemplate`：任何使用 `{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` 的 Markdown 布局。
- **自定义** `jsonPathTemplate`：为 JSON 标签文件提供单独的自定义布局，使用相同的占位符。
- `linkRewriteDocsRoot` 帮助扁平链接重写器在翻译输出位于非默认项目根目录的其他位置时计算正确的路径前缀。

<a id="flat-link-rewriting"></a>
### 扁平链接重写

当 `docsOutput.style === "flat"` 时，翻译后的 markdown 文件会带有区域设置后缀放置在源文件旁边。页面之间的相对链接会被重写，使 `readme.de.md` 中的 `[Guide](./guide.md)` 指向 `guide.de.md`。由 `rewriteRelativeLinks` 控制（对于没有自定义 `pathTemplate` 的扁平样式自动启用）。同一遍处理会在 `postProcessing.regexAdjustments` 运行之前，为非 markdown 资产 URL 添加按文件深度的前缀 — 参见[扁平链接重写器](/zh-Hans/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow)。

---

<a id="json-internals"></a>
## JSON 内部结构

| 步骤 | 组件 | 结果 |
| --- | --- | --- |
| 1 | `json[].contentPaths` | 文件已解析（文件、目录或 glob） |
| 2 | `NestedJsonExtractor` | 由 `keyPolicy` 选择的字符串叶子（点路径 + minimatch） |
| 3 | `PlaceholderHandler` + 批处理 + `TranslationCache` | 缓存命中 → 跳过；未命中 → `LlmClient.translateDocumentBatch`（共享 SQLite） |
| 4 | `NestedJsonExtractor.reassemble` | 通过 `expandJsonBlockOutputPath(outputPathTemplate)` 输出文件 |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) 遍历任意嵌套的 JSON，并为每个可翻译的字符串叶子发出一个段。`keyPolicy.mode` (`allowlist`、`denylist` 或 `both`) 使用点表示法（如 `slug` 这样的裸名称匹配最终的键段）通过 minimatch 过滤路径。
- 缓存文件跟踪在 `file_tracking` 中使用 `json-block:{blockIndex}:{projectRelPath}`（与文档和 SVG 使用相同的 `cacheDir`）。
- **不**适用于 Docusaurus `write-translations` 目录（`{ message, description }` 形状）— 那些使用文档（`docs[].docusaurusCatalogDir` + `JsonExtractor` 在 `translate-docs` 内部）。
- **不**适用于 `t()` UI 字符串 — UI 字符串（`strings.json` + 扁平包）。
- CLI：`translate-json`；编排在 `src/cli/translate-json-run.ts` 中。初始化模板：`ui-json-bundles`。

---

<a id="shared-infrastructure"></a>
## 共享基础设施

<a id="llmclient"></a>
### `LlmClient`

基于 Vercel AI SDK（`ai` + `@ai-sdk/openai-compatible`）构建的提供商无关的聊天客户端。它从 `provider` / `providers` 解析活动提供商，为该提供商的 `baseUrl` + API 密钥构建一个 OpenAI 兼容的客户端（`createOpenAICompatible`），并通过 `generateText` 路由所有调用。`OpenRouterClient` 保留为已弃用的别名。关键行为：

- **模型回退**：按顺序尝试已解析列表中的每个模型；在请求或解析失败时回退。每个目标区域设置都有其自己的已解析链：配置时首选 `localeModels(locale)`，然后是 `uiModels`（仅限 UI 流水线），接着是 `translationModels`。文档、JSON 和 SVG 翻译会使用非 UI 链为每个区域设置创建一个客户端。而 `bench-models` 命令会为每个配置的 ID 构建一个单模型客户端（`translationModels`、`uiModels` 和 `localeModels` 的并集；`translationModels: [id]`，无回退），以便它可以独立地对每个模型进行计时和定价。
- **请求超时**：活动提供程序的 `requestTimeoutMs`（默认 30 秒）通过 `AbortSignal.timeout` 中止每个请求。当 CLI 为 `check-models`（任何提供程序）加载提供程序的模型列表时，相同的值也适用于 `GET /models`。丢弃未知模型 ID 的可选预检过滤器仅在活动提供程序为 OpenRouter 时运行。
- **OpenRouter 额外功能**（仅在 `openrouter` 处于活动状态时）：通过 `provider` 请求字段、`HTTP-Referer` / `X-Title` 标头进行吞吐量路由，并从 `usage.cost` 读取准确的美元成本。每个提供程序都会报告令牌使用情况；仅当提供程序返回时才提供准确成本。
- **调试流量日志**：如果设置了 `debugTrafficFilePath`，则将请求和响应 JSON 追加到文件中。

<a id="config-loading"></a>
### 加载配置

`loadI18nConfigFromFile(configPath, cwd)` 管道：

1. 读取并解析 `ai-i18n-tools.config.json` (JSON)。
2. `mergeWithDefaults` - 与 `defaultI18nConfigPartial` 深度合并，并将任何 `docs[].sourceFiles` 条目合并到 `contentPaths` 中。
3. `expandTargetLocalesFileReferenceInRawInput` - 将 `targetLocales` 强制转换为数组并拒绝类路径条目（必须是 BCP-47 代码，而不是指向 `ui-languages.json` 的路径）；在 `mergeWithDefaults` 期间 `languagesManifestPath` 默认为 `{ui.flatOutputDir}/ui-languages.json`。
4. `expandDocumentationTargetLocalesInRawInput` - 对每个 `docs[].targetLocales` 条目执行相同操作。
5. `expandJsonTargetLocalesInRawInput` - 每个 `json[].targetLocales` 条目都相同。
6. `parseI18nConfig` - Zod 验证 + `validateI18nBusinessRules`。
7. `applyProviderOverrideToRawInput` - 当 `-P` / `--provider` 在 CLI 上传递时。
8. `applyEnvOverrides` - 设置时应用 `OPENROUTER_BASE_URL`、`OLLAMA_BASE_URL`、`I18N_SOURCE_LOCALE` 和 `I18N_TARGET_LOCALES` (API 密钥在 `LlmClient` 内部按提供程序单独解析)。
9. `augmentConfigWithUiLanguagesMaster` - 从捆绑的主目录中附加清单显示名称。
10. `assertEffectiveLocalesInUiLanguagesMaster` - 在适用时根据主目录验证区域设置代码。

`init` 会从 `initConfigTemplates` 写入初始配置：`ui-markdown`（UI + 可选的应用 markdown）、`ui-docusaurus`、`ui-starlight`、`ui-vitepress`（VitePress 文档 + `vitepressThemeCatalog`）、`ui-nextra`（Nextra 文档 + `nextraDictionaryPath`）、`ui-astro-website`（纯 Astro UI；添加 `docs[]` 以进行 `.astro` 页面翻译）、`ui-json-bundles`（仅 JSON `json[]`）。参见[快速入门 — 初始化](/zh-Hans/guide/quick-start#step-1-initialise)。

<a id="logger"></a>
### 日志记录器

`Logger` 支持 `debug`、`info`、`warn`、`error` 级别，并带有 ANSI 颜色输出。详细模式（`-v`）启用 `debug`。当设置了 `logFilePath` 时，日志行也会写入该文件。

<a id="self-localization-tool-ui"></a>
### 工具 UI 自我本地化

该工具会将其自身的 UI（CLI 帮助、高流量日志/摘要/错误消息以及翻译仪表板）与其为您翻译的内容分开进行本地化。

- **区域设置解析** (`resolveUiLocale` 在 `src/core/ui-locale.ts` 中)：从 `-L` / `--ui-lang` > `AI_I18N_LANG` > 配置 `uiLanguage` > 主机操作系统区域设置 (`Intl.DateTimeFormat().resolvedOptions().locale`) 中选择 UI 区域设置。候选区域设置被规范化并与已发布的捆绑包集精确匹配或通过最接近的变体匹配 (例如 `pt-PT` → `pt-BR`，`en-US` → `en-GB`)，回退到源区域设置 (`en-GB`)。CLI 在构建帮助之前解析一次 (预解析 argv 扫描)，并在配置加载后再次解析，因此 `uiLanguage` 适用 (该标志和环境变量仍然优先)。
- **运行时** (`src/i18n/index.ts`)：一个最小的 `t(source, vars)`，带有 ```{{name}}``` 插值，通过英文源字符串与 `src/i18n/locales/<code>.json` 中的平面每区域设置捆绑包进行键控 (在构建时复制到 `dist/i18n/locales`)。缺失的键或捆绑包返回源文本。这与 UI 字符串的键即默认模型相同 — 没有哈希查找。
- **仪表板**：服务器公开 `GET /api/ui-i18n`，返回已解析 UI 区域设置的 `{ locale, dir, bundle }`；前端设置 `<html lang>` / `dir` 并通过 `data-i18n*` 属性本地化静态标记。
- **内部测试**：捆绑包是通过对 `ai-i18n-self.config.json` (`pnpm i18n:self`) 运行包自己的提取 → `translate-ui` 管道生成的。目录键来自 `src/cli/` 和 `src/i18n/` 中的 `t()` 调用以及 `src/dashboard-app/index.html` 中仪表板的 `data-i18n*` 标记。

---

<a id="extension-points"></a>
## 扩展点

<a id="custom-function-names-ui-extraction"></a>
### 自定义函数名称（UI 提取）

通过配置添加非标准翻译函数名称：

```json
{
  "ui": {
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro", ".html"],
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder"]
    }
  }
}
```

（`ui.reactExtractor` 是 `ui.uiExtractor` 的完全支持的别名。）

将 `.html` / `.htm` 添加到 `extensions` 中，以便在 `extract` 期间扫描 HTML 标记属性。`ui.uiExtractor.htmlI18nAttributes` 是可选的，默认为 `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]`；`data-i18n` 映射到元素 `textContent`，而 `data-i18n-<attr>` 映射到该属性的值（例如 `data-i18n-aria-label`）。

<a id="custom-extractors"></a>
### 自定义提取器

实现包中的 `ContentExtractor`：

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

通过扩展从 `'ai-i18n-tools'` 导出的公共提取器类来注册自定义提取器 (例如子类 `MarkdownExtractor`)。CLI 在内部连接内置提取器；不支持深度导入 `doc-translate.ts`。

<a id="custom-output-paths"></a>
### 自定义输出路径

对任何文件布局都使用 `docsOutput.pathTemplate`：

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```

---

<a id="source-tree"></a>
## 源目录结构

<details>
<summary>完整 <code>src/</code> 布局 (文件级参考)</summary>

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── mark-html.ts                `mark-html` command (insert bare `data-i18n*` markers into HTML)
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── bench-models.ts             `bench-models` command (per-model translate latency/token/cost benchmark)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── ui-locale.ts                Resolve the tool's own UI locale (flag/env/config/OS → shipped bundle)
│   ├── locale-utils.ts             BCP-47 normalisation, locale list parsing, script/Han-variant validation
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── html-i18n-marks.ts          HTML `data-i18n*` marker scanner + `mark-html` annotator
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── i18n/                           Self-localization runtime for the tool's own UI
│   ├── index.ts                    t(source, vars) + bundle/manifest loaders (keyed by English source string)
│   └── locales/                    Shipped UI bundles (de.json, es.json, …; generated by `pnpm i18n:self`)
│
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    ├── table.ts                    Display-width aware table rendering (CJK/emoji column alignment)
    ├── load-dotenv.ts              Auto-load `.env` from the cwd at CLI startup (never overrides existing env)
    └── ignore-parser.ts            .translate-ignore file parser
```

</details>
