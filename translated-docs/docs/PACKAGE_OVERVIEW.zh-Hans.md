<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: 包概述

本文档描述了 `ai-i18n-tools` 的内部架构、各组件如何协同工作，以及三个可组合的工作流（UI 字符串、文档、嵌套 JSON）和可选的 SVG 翻译是如何实现的。

有关实际使用说明，请参阅 [GETTING_STARTED.md](GETTING_STARTED.zh-Hans.md)。有关翻译文档中的屏幕截图和图示 SVG，请参阅 [LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.zh-Hans.md)。

<small>**以其他语言阅读：** </small>
<small id="lang-list">[English (UK)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [Hindi (Roman)](./PACKAGE_OVERVIEW.hi-Latn.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [简体中文](./PACKAGE_OVERVIEW.zh-Hans.md) · [繁體中文](./PACKAGE_OVERVIEW.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目录**

- [架构概述](#architecture-overview)
- [源目录结构](#source-tree)
- [工作流 1 - UI 翻译内部机制](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [扁平化 locale 文件](#flat-locale-files)
  - [UI 翻译提示](#ui-translation-prompts)
- [工作流 2 - 文档翻译内部机制](#workflow-2---document-translation-internals)
- [工作流 3 - 嵌套 JSON 内部机制](#workflow-3---nested-json-internals)
  - [提取器](#extractors)
  - [Astro 混合站点（UI + 页面 HTML）](#astro-hybrid-sites-ui--page-html)
  - [标题锚点插入（`write-heading-ids` CLI）](#heading-anchor-insertion-write-heading-ids-cli)
  - [占位符保护](#placeholder-protection)
  - [缓存（`TranslationCache`）](#cache-translationcache)
  - [输出路径解析](#output-path-resolution)
  - [扁平化链接重写](#flat-link-rewriting)
- [共享基础设施](#shared-infrastructure)
  - [`LlmClient`](#openrouterclient)
  - [配置加载](#config-loading)
  - [日志记录器](#logger)
- [运行时辅助函数 API](#runtime-helpers-api)
  - [RTL 辅助函数](#rtl-helpers)
  - [i18next 设置工厂](#i18next-setup-factories)
  - [显示辅助函数](#display-helpers)
  - [字符串辅助函数](#string-helpers)
- [编程 API](#programmatic-api)
- [扩展点](#extension-points)
  - [自定义函数名称（UI 提取）](#custom-function-names-ui-extraction)
  - [自定义提取器](#custom-extractors)
  - [自定义输出路径](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## 架构概述

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, mark-html, translate-ui, translate-svg, translate-docs, translate-json, sync, status, dashboard, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - LlmClient: provider-agnostic chat client (Vercel AI SDK) with model fallback
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── i18n (src/i18n/)           - self-localization runtime for the tool's own UI (t() + per-locale bundles)
├── Server (src/server/)       - local Express app for the Translation Dashboard (cache / glossary)
└── Utils (src/utils/)         - logger, hash, ignore parser, display-width table, .env loader
```

消费者可能需要的任何内容都通过 `src/index.ts` 以编程方式重新导出。

---

<a id="source-tree"></a>
## 源目录结构

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

---

<a id="workflow-1---ui-translation-internals"></a>
## 工作流 1 - UI 翻译内部机制

```text
source files (JS/TS, optional `.astro`)
      │
      ▼  UIStringExtractor (i18next-scanner Parser; `.astro` via ui-string-babel.ts)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
LlmClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

<a id="uistringextractor"></a>
### `UIStringExtractor`

使用 `i18next-scanner` 的 `Parser.parseFuncFromString` 在 JS/TS 文件中查找 `t("literal")` 和 `i18n.t("literal")` 调用。对于 `.astro` 源（在 `ui.uiExtractor.extensions` 中列出时），`ui-string-babel.ts` 会使用 `@babel/parser` 解析 frontmatter 和模板 `{expression}` 块，并应用相同的 `funcNames` 规则。函数名称和文件扩展名可通过 `ui.uiExtractor` 进行配置（`ui.reactExtractor` 是一个支持的别名）。`extract` **还会将非扫描器输入合并到同一个目录中：** 当启用（默认）`package.json` `description` 时，项目 `package.json` `description` 会被处理，并且当 `includeUiLanguageEnglishNames` 启用且 `uiLanguagesPath` 设置时，`ui-languages.json` 中的每个 `englishName` 都会被处理（源中已找到的字符串会保留优先权）。段哈希是修剪后字符串的前 8 个十六进制字符的 **MD5** — 这些将成为 `strings.json` 中的键。

对于 `.html` / `.htm` 源（当在 `ui.uiExtractor.extensions` 中列出时），`extract` 会将文件路由到 `html-i18n-marks.ts`，后者会扫描 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 标记属性（可通过 `ui.uiExtractor.htmlI18nAttributes` 配置）。裸标记从元素的自身 `textContent` / `title` / `placeholder` 获取源文本；带值的标记（`data-i18n="Key"`）使用该值。相同的模块也支持 `mark-html` 命令，该命令会自动插入裸标记。HTML 文件永远不会到达 Babel / i18next-scanner 阶段。

纯粹的 Astro SSG 站点可以跳过 i18next：在构建时加载扁平化的 `{locale}.json`，并通过源文本键解析 `t('English')`（参见 `examples/astro-website/src/i18n/t.ts` 和 [GETTING_STARTED — Astro 网站](GETTING_STARTED.zh-Hans.md#astro-website))。

纯 HTML 应用遵循相同的目录模型，使用标记属性而不是 `t()` 调用 — 请参阅 [GETTING_STARTED — 标记 HTML 以供翻译](GETTING_STARTED.zh-Hans.md#marking-html-for-translation)。

<a id="stringsjson"></a>
### `strings.json`

主目录的结构如下：

```json
{
  "<md5-8>": {
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

`models`（可选）— 按区域设置，模型在该区域设置上次成功 `translate-ui` 运行后生成的翻译（或 `user-edited`，如果文本是从翻译仪表板保存的）。`locations`（可选）— `extract` 找到字符串的位置（扫描器 + 包描述行；仅清单 `englishName` 字符串可能省略 `locations`）。

`extract` 添加新密钥并保留扫描中仍存在的密钥的现有 `translated` / `models` 数据（扫描器字面量、可选描述、可选清单 `englishName`）。`translate-ui` 填充缺失的 `translated` 条目，更新其翻译的区域设置的 `models`，并写入扁平化的区域设置文件。

`ui-languages.json` **manifest** — `{ code, label, englishName, direction }` 的 JSON 数组（BCP-47 `code`、UI `label`、引用 `englishName`、`"ltr"` 或 `"rtl"`）。使用 `generate-ui-languages` 从 `sourceLocale` + `targetLocales` 和捆绑的主 `data/ui-languages-complete.json` 构建项目文件。

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

`LlmClient.translateUIBatch` 按顺序尝试每个模型，在解析或网络错误时回退。CLI 从活动提供程序的 `translationModels` 构建该列表；对于 `translate-ui`，当设置（与其余部分去重）时，会在前面添加可选的 `ui.preferredModel`。

---

<a id="workflow-2---document-translation-internals"></a>
## 工作流 2 - 文档翻译内部

```text
markdown / MDX / JSON / `.astro` files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor / AstroTemplateExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── HTML tags, admonitions, anchors, MDX comments/JSX/braces,
                                URLs, inline code, emphasis masked as tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → LlmClient.translateDocumentBatch
      │
      ▼  PlaceholderHandler.restoreAfterTranslation
final text  ──────────────────── placeholders restored
      │
      ▼  resolveDocumentationOutputPath
output file  ─────────────────── Docusaurus layout or flat layout
```

<a id="extractors"></a>
### 提取器

所有提取器都扩展 `BaseExtractor` 并实现 `extract(content, filepath): Segment[]`。

- `MarkdownExtractor` - 将 markdown 分割为类型化片段：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。YAML 前端内容被归类为 **不可翻译**（`slug`、`id` 和其他路由键保持稳定）。顶级 `export ...` 块（例如 React 组件定义）被归类为不可翻译的 `other` 片段，以及现有的 `import ...` 处理。以大写 JSX 标签开头的多行块（例如 `<Tabs>` 块）被归类为可翻译的段落。不可翻译的片段（代码块、原始 HTML）会按原样保留。
- `AstroTemplateExtractor` - 用于 `.astro` 营销页面的解析和替换（通过 `doc-translate.ts` 中的 `translateAstroFile` 进行 `translate-docs`）。提取面向用户的 HTML 文本节点和可翻译属性（`alt`、`title`、`aria-label`、`placeholder`），以及模板 `{expression}` 块中面向用户的字符串字面量。跳过前端 TypeScript、`<script>`、`<style>`、受保护的属性/键值以及 `t('…')` 中的字面量。重新组装会调整相对导入，当输出路径更深时（例如 `src/pages/de/index.astro`）。请参阅 [GETTING_STARTED — Astro 网站页面](GETTING_STARTED.zh-Hans.md#astro-website-parse-and-replace)。
- `JsonExtractor` - 从 Docusaurus JSON 标签文件中提取字符串值（Docusaurus UI 目录，非 MDX 正文）。
- `SvgExtractor` - 从 SVG 中提取 `<text>`、`<title>` 和 `<desc>` 内容（由 `translate-svg` 用于 `config.svg` 下的文件，而非 `translate-docs`）。
- `html-i18n-marks.ts` - 一个集中的 HTML 标签扫描器，由 `extract` 用于 `.html` / `.htm` 源，并由 `mark-html` 命令使用。`collectHtmlI18nStrings` / `collectHtmlI18nLocations` 读取 `data-i18n*` 标记属性（裸标记 → 元素 `textContent` / `title` / `placeholder`；带值的标记 → 值），并且 `markHtmlContent` 将裸标记插入到叶文本/标题/占位符元素中（幂等的，尊重 `data-i18n-ignore`，跳过类似代码和混合内容元素）。共享的 `normalizeI18nText` 助手使构建时密钥与浏览器运行时保持一致。

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro 混合站点（UI + 页面 HTML）

纯 Astro 应用通常在一个配置中启用 **两种**工作流（参考：`examples/astro-website/`）：

| 层 | 机制 | 输出 |
|---|---|---|
| 模板 HTML | `AstroTemplateExtractor` + `translate-docs` | `docs[].outputDir` 下的每个区域设置 `.astro` |
| 前端内容 / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | 扁平化 `public/locales/{locale}.json`（英文源作为键）|

`sync` 命令按顺序运行启用的步骤：**extract** 然后 **translate-ui**（当 `features.translateUIStrings` 时）→ 可选 **translate-svg** → **translate-docs** → 可选 **translate-json**（除非使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳过）。Init 模板 `ui-astro-website` 仅构建工作流 1；添加 `docs[]` 和 `features.translateDocs` 用于页面 HTML。

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### 标题锚点插入（`write-heading-ids` CLI）

命令 `write-heading-ids` 是一个 **本地、非 LLM** 的文档 markdown 预处理器。实现：`src/cli/write-heading-ids.ts` 协调文件发现；`src/markdown/write-heading-ids-core.ts` 解析行并插入锚点。

它需要一个有效的配置，其中包含 **至少一个 `docs[]` 块**。对于每个块，它会收集 `.md` / `.mdx` 文件到 `contentPaths` 下，应用项目的 `.translate-ignore` 规则（与文档翻译类似），并可选择使用 `--path` / `--file` 限制到子树。每个文件都使用 `applyHeadingAnchorsToMarkdown` 进行转换：对于每个 **扁平 ATX 标题**（`# …` 到 `###### …`），如果不存在或已过时，则在上一行插入一个空的 HTML 行 `<a id="slug"></a>`。Slug 算法匹配常见的生态系统 — `github`（默认）、`bitbucket`、`gitlab`、`pymdown`（可选的 Unicode 规范化/百分比编码标志）、`azure-devops` — 因此锚点 ID 与现有工具（doctoc、PyMdown 等）保持一致。`--dry-run` 会报告潜在的编辑，但不会写入。

此命令 **不** 在 `translate-docs` 或 `sync` 中运行；当您希望在翻译或发布之前源文件中的片段 ID 稳定时，请显式运行它。

<a id="placeholder-protection"></a>
### 占位符保护

在翻译之前，敏感语法会被替换为不透明的令牌，以防止 LLM 损坏，按此顺序应用（恢复顺序相反）：

1. **HTML 标签和注释**（`<strong>`、`<!-- ... -->` 等）- 来自已知允许列表的纯小写 HTML 标签会被替换为 `{{HTM_N}}` 令牌。大写的 JSX 标签（`<Highlight>`、`<Tabs>`、`</Tab>`）由 MDX 层（步骤 4）单独处理。
2. **提示标记**（`:::note`、`:::`）- 仅替换开头的指令前缀为 `{{ADM_OPEN_N}}`；同一行的标题留给模型翻译。使用完全相同的原始文本恢复。
3. **文档锚点**（HTML `<a id="…">`、Docusaurus 标题 `{#…}`）- 按原样保留。
4. **仅限 MDX 的构造**（`src/processors/mdx-placeholders.ts`）：
   - **MDX 注释**（`{/* … */}`，包括 Docusaurus heading-id 形式 `{/* #my-id */}`）替换为 `{{MDX_N}}`。
   - **大写 JSX 标签**（`<Highlight>`、`<Tabs>`、`<TabItem>`、`<TOCInline />`、`</Highlight>`）- 保留为 `{{MDX_N}}`，其中可翻译的字符串属性（`label`、`tooltip`、`aria-label`）在标签内重写为 `{{JXA_N}}`，除非属性名称出现在 `docs[].protectAttributes` 中；`<Tabs values={[ { label: '…' } ]}>` 对象字面量中的 `label:`（可通过 `docs[].protectKeys` 跳过）和 `<TabItem value="…">`（当不存在 `label` 属性时，跳过小写类似 slug 的值）也会被提取。附加到段落中作为 `||JXA_N: …||` 行，由 `restoreMdx` 合并。
   - **MDX 花括号表达式**（`{frontMatter.title}`、`style={{…}}`）- 深度感知匹配，替换为 `{{MDX_N}}`。
5. **Markdown URL**（`](url)`、`src="../../docs/…"`）- 翻译后从映射中恢复。
6. **行内代码跨度**（`` `code` ``）和 **粗体包裹的行内代码**（`**`code`**`）- 保留。
7. **Markdown 强调**（可选，对 CJK/RTL 区域自动启用）- 强调分隔符被屏蔽。

Astro 模板和 MDX JSX 的共享属性/键保护在 `src/processors/expression-attribute-protection.ts` 中实现，并由 `docs[].protectAttributes` 和 `docs[].protectKeys` 按块驱动（参见 [GETTING_STARTED — protectAttributes / protectKeys](GETTING_STARTED.zh-Hans.md#protectattributes-protectkeys))。

<a id="cache-translationcache"></a>
### 缓存（`TranslationCache`）

SQLite 数据库（通过 `node:sqlite`）存储行，键由 `(source_hash, locale)` 加上 `translated_text`、`model`、`filepath`、`last_hit_at` 和相关字段组成。哈希值是规范化内容（折叠空格后）的前 16 个十六进制字符的 SHA-256。

每次运行时，都会通过哈希 × 区域设置查找段。只有缓存未命中才会转到 LLM。翻译后，`last_hit_at` 会针对当前翻译范围内未命中的段行重置。文档翻译期间成功的缓存命中会清除该段的陈旧 `translation_failures` 行。`cleanup` 首先运行 `sync --force-update`，然后删除陈旧的段行（空 `last_hit_at` / 空文件路径），当磁盘上缺少解析的源路径时修剪 `file_tracking` 键（`doc-block:…`、`json-block:…`、`svg-files:…` 等），删除元数据文件路径指向缺失文件的翻译行，修剪孤立的 `translation_failures` 行，并修剪解析的源路径在磁盘上缺失的孤立 `markdown_source_issues` 行；除非传递 `--backup <path>`，否则它不会备份 `cache.db`，后者会首先将备份写入该路径。

`translate-docs` 命令还使用 **文件跟踪**，因此未更改的源文件及其现有输出可以完全跳过工作。`--force-update` 重新运行文件处理，同时仍使用分段缓存；`--force` 会清除文件跟踪并绕过分段缓存读取以进行 API 翻译。当所有配置的模型在 markdown 分段上都无法通过 AST 验证时，`translate-docs` 可以逐步拆分分段并重试较小的部分（`docs[].segmentSplitting.qualityRetrySplit`，默认开启）。有关完整的标志表，请参阅 [入门指南](GETTING_STARTED.zh-Hans.md#cache-behaviour-and-translate-docs-flags)。

**批量提示格式:** `translate-docs --prompt-format` 仅为 `LlmClient.translateDocumentBatch` 选择 XML（`<seg>` / `<t>`）或 JSON 数组/对象形状；提取、占位符和验证保持不变。请参阅 [批量提示格式](GETTING_STARTED.zh-Hans.md#batch-prompt-format)。

<a id="output-path-resolution"></a>
### 输出路径解析

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` 将相对于源的路径映射到输出路径：

- `nested` 样式（默认）：`{outputDir}/{locale}/{relPath}` 用于 markdown。
- `doc-system` 样式：在 `docsRoot` 下，输出使用 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`；`docsRoot` 之外的路径将回退到嵌套布局。别名：`docusaurus`（默认 `localeSubpath` = Docusaurus 插件路径）、`astro-starlight`（默认空 `localeSubpath`）。
- `flat` 样式：`{outputDir}/{stem}.{locale}{extension}`。当 `flatPreserveRelativeDir` 为 `true` 时，源子目录将保留在 `outputDir` 下。
- **自定义** `pathTemplate`：任何使用 `{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` 的 markdown 布局。
- **自定义** `jsonPathTemplate`：为 JSON 标签文件提供单独的自定义布局，使用相同的占位符。
- `linkRewriteDocsRoot` 帮助扁平链接重写器在翻译输出位于非默认项目根目录的其他位置时计算正确的路径前缀。

<a id="flat-link-rewriting"></a>
### 扁平链接重写

当 `docsOutput.style === "flat"` 时，翻译后的 markdown 文件将与源文件一起放置，并带有区域设置后缀。页面之间的相对链接将被重写，以便 `readme.de.md` 中的 `[Guide](../../docs/guide.md)` 指向 `guide.de.md`。由 `rewriteRelativeLinks` 控制（在没有自定义 `pathTemplate` 的扁平样式下自动启用）。同一遍会在 `postProcessing.regexAdjustments` 运行之前，为非 markdown 资源 URL 添加每个文件的深度前缀 — 请参阅 [区域设置资源指南](LOCALE-ASSETS-GUIDE.zh-Hans.md#the-flat-link-rewriter-and-two-step-flow)。

---

<a id="workflow-3---nested-json-internals"></a>
## 工作流 3 - 嵌套 JSON 内部结构

```text
json[].contentPaths  →  resolve files (file | directory | glob)
      │
      ▼  NestedJsonExtractor
string leaves selected by keyPolicy (dot paths + minimatch)
      │
      ▼  PlaceholderHandler + batch + TranslationCache (shared SQLite)
cache hit → skip, miss → LlmClient.translateDocumentBatch
      │
      ▼  NestedJsonExtractor.reassemble
output file  ─────────── expandJsonBlockOutputPath(outputPathTemplate)
```

- `NestedJsonExtractor`（`src/extractors/nested-json-extractor.ts`）遍历任意嵌套的 JSON 并为每个可翻译的字符串叶节点发出一个分段。`keyPolicy.mode`（`allowlist`、`denylist` 或 `both`）使用 minimatch 按点表示法过滤路径（如 `slug` 这样的裸名称会匹配最终的键段）。
- 缓存文件跟踪使用 `file_tracking` 中的 `json-block:{blockIndex}:{projectRelPath}`（与文档和 SVG 使用相同的 `cacheDir`）。
- **不**用于 Docusaurus `write-translations` 目录（`{ message, description }` 形状）— 这些使用工作流 2（`translate-docs` 中的 `docs[].docusaurusCatalogDir` + `JsonExtractor`）。
- **不**用于 `t()` UI 字符串 — 工作流 1（扁平捆绑包 + `strings.json`）。
- CLI：`translate-json`；编排在 `src/cli/translate-json-run.ts` 中。初始化模板：`ui-json-bundles`。

---

<a id="shared-infrastructure"></a>
## 共享基础设施

<a id="openrouterclient"></a>
### `LlmClient`

基于 Vercel AI SDK（`ai` + `@ai-sdk/openai-compatible`）构建的提供商无关的聊天客户端。它从 `provider` / `providers` 解析活动提供商，为该提供商的 `baseUrl` + API 密钥构建一个 OpenAI 兼容的客户端（`createOpenAICompatible`），并通过 `generateText` 路由所有调用。`OpenRouterClient` 保留为已弃用的别名。关键行为：

- **模型回退**：按顺序尝试解析列表中的每个模型；在请求或解析失败时回退。UI 翻译首先解析 `ui.preferredModel`（如果存在），然后解析提供程序的 `translationModels`。
- **请求超时**：活动提供程序的 `requestTimeoutMs`（默认为 30 秒）会中止每个请求（通过 `AbortSignal.timeout`）。当 CLI 加载提供程序的模型列表以用于 `check-models`（任何提供程序）以及可选的预检查过滤器（删除未知模型 ID，仅限 OpenRouter）时，相同的值也适用于 `GET /models`。
- **OpenRouter 附加功能**（仅当 `openrouter` 处于活动状态时）：通过 `provider` 请求字段、`HTTP-Referer` / `X-Title` 标头进行吞吐量路由，并读取 `usage.cost` 中的确切美元成本。为每个提供程序报告令牌使用情况；仅当提供程序返回确切成本时才报告。
- **调试流量日志**：如果设置了 `debugTrafficFilePath`，则将请求和响应的 JSON 追加到文件中。

<a id="config-loading"></a>
### 加载配置

`loadI18nConfigFromFile(configPath, cwd)` 管道：

1. 读取并解析 `ai-i18n-tools.config.json`（JSON）。
2. `mergeWithDefaults` - 与 `defaultI18nConfigPartial` 进行深度合并，并将任何 `docs[].sourceFiles` 条目合并到 `contentPaths` 中。
3. `expandTargetLocalesFileReferenceInRawInput` - 如果 `targetLocales` 是文件路径，则加载清单并展开为区域设置代码；设置 `uiLanguagesPath`。
4. `expandDocumentationTargetLocalesInRawInput` - 对每个 `docs[].targetLocales` 条目执行相同操作。
5. `parseI18nConfig` - Zod 验证 + `validateI18nBusinessRules`。
6. `applyEnvOverrides` - 应用 `OPENROUTER_API_KEY`、`I18N_SOURCE_LOCALE` 等。
7. `augmentConfigWithUiLanguagesFile` - 附加清单显示名称。

`init` 从 `initConfigTemplates` 写入启动配置：`ui-markdown`（UI + 可选的应用 markdown）、`ui-docusaurus`、`ui-starlight`、`ui-astro-website`（纯 Astro UI；添加 `docs[]` 以进行 `.astro` 页翻译）、`ui-json-bundles`（仅限 Workflow 3 `json[]`）。请参阅 [GETTING_STARTED — Initialise](GETTING_STARTED.zh-Hans.md#step-1-initialise)。

<a id="logger"></a>
### 日志记录器

`Logger` 支持 `debug`、`info`、`warn`、`error` 级别，并带有 ANSI 颜色输出。详细模式（`-v`）启用 `debug`。当设置了 `logFilePath` 时，日志行也会写入该文件。

<a id="self-localization-tool-ui"></a>
### 工具 UI 自我本地化

该工具会将其自身的 UI（CLI 帮助、高流量日志/摘要/错误消息以及翻译仪表板）与其为您翻译的内容分开进行本地化。

- **区域设置解析**（`resolveUiLocale` 在 `src/core/ui-locale.ts` 中）：从 `-L` / `--ui-lang` > `AI_I18N_LANG` > 配置 `uiLanguage` > 主机操作系统区域设置（`Intl.DateTimeFormat().resolvedOptions().locale`）中选择 UI 区域设置。候选区域设置会经过标准化，并与提供的捆绑包集进行精确匹配或按最接近的变体匹配（例如 `pt-PT` → `pt-BR`、`en-US` → `en-GB`），最后回退到源区域设置（`en-GB`）。CLI 会在帮助构建之前（预解析 argv 扫描）解析一次，并在加载配置后再次解析，以便应用 `uiLanguage`（标志和环境变量仍然具有最高优先级）。
- **运行时**（`src/i18n/index.ts`）：一个最小化的 `t(source, vars)`，包含 `{{name}}` 插值，通过英文源字符串作为键，在 `src/i18n/locales/<code>.json` 中的每个区域设置的平面捆绑包中查找（在构建时复制到 `dist/i18n/locales`）。缺失的键或捆绑包会返回源文本。这与工作流 1 中的键即默认模型相同 — 没有哈希查找。
- **仪表板**：服务器公开 `GET /api/ui-i18n`，返回已解析 UI 区域设置的 `{ locale, dir, bundle }`；前端设置 `<html lang>` / `dir`，并通过 `data-i18n*` 属性本地化静态标记。
- **内部测试**：捆绑包是通过运行包自身的提取 → `translate-ui` 管道来生成的，该管道针对 `ai-i18n-self.config.json`（`pnpm i18n:self`）。目录键来自 `t()` 在 `src/cli/` 和 `src/i18n/` 中的调用，以及仪表板在 `data-i18n*` 中的 `src/dashboard-app/index.html` 标记。

---

<a id="runtime-helpers-api"></a>
## 运行时辅助程序 API

这些是从 `'ai-i18n-tools/runtime'` 导出的，可以在任何 JavaScript 环境（浏览器、Node.js、Deno、Edge）中使用。它们 **不**从 `i18next` 或 `react-i18next` 导入。

<a id="rtl-helpers"></a>
### RTL 辅助程序

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next 设置工厂

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

使用 `setupKeyAsDefaultT` 作为常规应用程序入口点（键修剪 + 复数 `wrapT` + 可选的 `translate-ui` `{sourceLocale}.json`）。单独调用 `wrapI18nWithKeyTrim` 已被 **弃用**，用于应用程序连接。

使用 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` 构建 `localeLoaders`，以便在 `generate-ui-languages` 后键与 `targetLocales` 保持一致。请参阅 `docs/GETTING_STARTED.md`（运行时连接）、`examples/nextjs-app/`、`examples/console-app/` 和 `examples/astro-website/`（不使用 i18next 的自定义 `makeT`）。

<a id="display-helpers"></a>
### 显示辅助程序

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### 字符串辅助程序

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## 编程 API

所有公共类型和类都从包根目录导出。示例：在 Node.js 中运行 translate-UI 步骤，而不使用 CLI：

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

主要导出：

| 导出 | 描述 |
|---|---|
| `loadI18nConfigFromFile` | 从 JSON 文件加载、合并、验证配置。 |
| `parseI18nConfig` | 验证原始配置对象。 |
| `TranslationCache` | SQLite 缓存 - 使用 `cacheDir` 路径进行实例化。 |
| `UIStringExtractor` | 从 JS/TS 源中提取 `t("…")` 字符串。 |
| `collectHtmlI18nStrings` / `markHtmlContent` | 扫描/插入 HTML 中的 `data-i18n*` 标记（支持 `extract` 用于 `.html` 和 `mark-html` 命令）。 |
| `MarkdownExtractor` | 从 Markdown 中提取可翻译的片段。 |
| `JsonExtractor` | 从 Docusaurus JSON 标签文件（UI 目录，非 MDX 正文）中提取。 |
| `SvgExtractor` | 从 SVG 文件中提取。 |
| `LlmClient` | 向活动的 LLM 提供程序发出翻译请求（`OpenRouterClient` 是已弃用的别名）。 |
| `PlaceholderHandler` | 保护/恢复翻译周围的 Markdown 语法（HTML 标签、警告、锚点、MDX 注释/JSX/花括号、URL、行内代码、强调）。 |
| `protectMdx` / `restoreMdx` | 保护/恢复 MDX 注释、JSX 标签、花括号表达式和 JSX 字符串属性（由 `PlaceholderHandler` 调用；也导出供直接使用）。 |
| `splitTranslatableIntoBatches` | 将片段分组为适合 LLM 的批次。 |
| `validateTranslation` | 翻译后的结构检查。 |
| `resolveDocumentationOutputPath` | 解析已翻译文档的输出文件路径。 |
| `Glossary` / `GlossaryMatcher` | 加载并应用翻译词汇表。 |
| `runTranslateUI` | 程序化翻译 UI 入口点。 |

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
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

通过以编程方式导入 `doc-translate.ts` 工具来将其传递给 doc-translate 管道。

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
