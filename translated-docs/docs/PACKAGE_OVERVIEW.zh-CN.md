# ai-i18n-tools：包概述

本文档描述了 `ai-i18n-tools` 的内部架构、各组件如何协同工作，以及两个核心工作流的实现方式。

关于实际使用说明，请参阅 [GETTING_STARTED.md](GETTING_STARTED.zh-CN.md)。

<small>**以其他语言阅读：**</small>

<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [German](./PACKAGE_OVERVIEW.de.md) · [Spanish](./PACKAGE_OVERVIEW.es.md) · [French](./PACKAGE_OVERVIEW.fr.md) · [Hindi](./PACKAGE_OVERVIEW.hi.md) · [Japanese](./PACKAGE_OVERVIEW.ja.md) · [Korean](./PACKAGE_OVERVIEW.ko.md) · [Portuguese (BR)](./PACKAGE_OVERVIEW.pt-BR.md) · [Chinese (CN)](./PACKAGE_OVERVIEW.zh-CN.md) · [Chinese (TW)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目录**

- [架构概述](#architecture-overview)
- [源码树](#source-tree)
- [工作流 1 - UI 翻译内部机制](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [扁平化区域设置文件](#flat-locale-files)
  - [UI 翻译提示](#ui-translation-prompts)
- [工作流 2 - 文档翻译内部机制](#workflow-2---document-translation-internals)
  - [提取器](#extractors)
  - [占位符保护](#placeholder-protection)
  - [缓存 (`TranslationCache`)](#cache-translationcache)
  - [输出路径解析](#output-path-resolution)
  - [扁平链接重写](#flat-link-rewriting)
- [共享基础设施](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [配置加载](#config-loading)
  - [日志记录器](#logger)
- [运行时辅助工具 API](#runtime-helpers-api)
  - [RTL 辅助工具](#rtl-helpers)
  - [i18next 设置工厂函数](#i18next-setup-factories)
  - [显示辅助工具](#display-helpers)
  - [字符串辅助工具](#string-helpers)
- [编程式 API](#programmatic-api)
- [扩展点](#extension-points)
  - [自定义函数名称（UI 提取）](#custom-function-names-ui-extraction)
  - [自定义提取器](#custom-extractors)
  - [自定义输出路径](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## 架构概述

```
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

使用者可能以编程方式需要的一切内容，都从 `src/index.ts` 重新导出。

---

## 源码树

```
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── locale-utils.ts             BCP-47 normalization and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner)
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── json-extractor.ts           JSON label file extraction
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: admonitions → anchors → URLs
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   └── openrouter.ts               OpenRouter HTTP client with model fallback chain
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
├── server/
│   └── translation-editor.ts       Express app for cache / strings.json / glossary editor
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

## 工作流 1 - UI 翻译内部机制

```
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

### `UIStringExtractor`

使用 `i18next-scanner` 的 `Parser.parseFuncFromString` 在任意 JS/TS 文件中查找 `t("literal")` 和 `i18n.t("literal")` 调用。函数名称和文件扩展名可配置。**`extract` 还会将非扫描器输入合并到同一目录中：** 当启用 `reactExtractor.includePackageDescription` 时（默认），包含项目 `package.json` `description`，以及当 `reactExtractor.includeUiLanguageEnglishNames` 为 `true` 且设置了 `uiLanguagesPath` 时，来自 `ui-languages.json` 的每个 **`englishName`**（源代码中已找到的字符串优先）。片段哈希是修剪后源字符串的 **MD5 前 8 位十六进制字符** —— 这些将成为 `strings.json` 中的键。

### `strings.json`

主目录具有以下结构：

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

`models`（可选）— 每个区域设置，在上一次针对该区域设置成功运行 `translate-ui` 后，是哪个模型生成了该翻译（如果文本是从 `editor` 网页界面保存的，则为 `user-edited`）。`locations`（可选）— `extract` 发现字符串的位置（扫描器 + 包描述行；仅清单的 `englishName` 字符串可省略 `locations`）。

`extract` 添加新键，并为扫描中仍存在的键保留现有的 `translated` / `models` 数据（扫描器字面量、可选描述、可选清单 `englishName`）。`translate-ui` 填充缺失的 `translated` 条目，更新其翻译的区域设置的 `models`，并写入扁平化的区域设置文件。

**`ui-languages.json` 清单** — `{ code, label, englishName, direction }` 的 JSON 数组（BCP-47 `code`、UI `label`、参考 `englishName`、`"ltr"` 或 `"rtl"`）。使用 `generate-ui-languages` 从 `sourceLocale` + `targetLocales` 和捆绑的主 `data/ui-languages-complete.json` 构建项目文件。

### 扁平化区域设置文件

每个目标区域设置会生成一个扁平的 JSON 文件（如 `de.json`），将源字符串映射到翻译结果（不含 `models` 字段）：

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next 将这些文件作为资源包加载，并通过源字符串（键即默认模型）查找翻译。

### UI 翻译提示

`buildUIPromptMessages` 构建系统 + 用户消息，这些消息：
- 识别源语言和目标语言（通过 `localeDisplayNames` 或 `ui-languages.json` 中的显示名称）。
- 发送一个 JSON 字符串数组，并要求返回一个 JSON 翻译数组。
- 在可用时包含术语表提示。

`OpenRouterClient.translateUIBatch` 按顺序尝试每个模型，在解析或网络错误时进行降级。CLI 从 `openrouter.translationModels`（或旧版默认/备用模型）构建该列表；对于 `translate-ui`，当设置了可选的 `ui.preferredModel` 时会将其前置（与其余部分去重）。

---

## 工作流 2 - 文档翻译内部机制

```
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── URLs, admonitions, anchors replaced with tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → OpenRouterClient.translateDocumentBatch
      │
      ▼  PlaceholderHandler.restoreAfterTranslation
final text  ──────────────────── placeholders restored
      │
      ▼  resolveDocumentationOutputPath
output file  ─────────────────── Docusaurus layout or flat layout
```

### 提取器

所有提取器都扩展 `BaseExtractor` 并实现 `extract(content, filepath): Segment[]`。

- `MarkdownExtractor` —— 将 Markdown 拆分为带类型片段：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。不可翻译的片段（代码块、原始 HTML）将原样保留。
- `JsonExtractor` —— 从 Docusaurus JSON 标签文件中提取字符串值。
- `SvgExtractor` —— 从 SVG 中提取 `<text>`、`<title>` 和 `<desc>` 内容（由 `translate-svg` 用于 `config.svg` 下的资源，不用于 `translate-docs`）。

### 占位符保护

在翻译之前，敏感语法被替换为不透明的令牌，以防止 LLM 损坏：

1. **警告标记** (`:::note`, `:::`) - 恢复为确切的原始文本。
2. **文档锚点** (HTML `<a id="…">`，Docusaurus 标题 `{#…}`) - 逐字保留。
3. **Markdown URLs** (`](url)`，`src="../…"`) - 在翻译后从映射中恢复。

### 缓存 (`TranslationCache`)

SQLite 数据库（通过 `node:sqlite`）存储以 `(source_hash, locale)` 为键的行，包含 `translated_text`、`model`、`filepath`、`last_hit_at` 和相关字段。哈希是标准化内容的 SHA-256 前 16 个十六进制字符（空格折叠）。

在每次运行中，通过哈希 × 语言环境查找段落。只有缓存未命中时才会调用 LLM。翻译后，当前翻译范围内未命中的段落的 `last_hit_at` 被重置。`cleanup` 首先运行 `sync --force-update`，然后删除过时的段落行（null `last_hit_at` / 空文件路径），在磁盘上缺少解析的源路径时修剪 `file_tracking` 键（`doc-block:…`、`svg-assets:…` 等），并删除其元数据文件路径指向缺失文件的翻译行；除非传递 `--no-backup`，否则会先备份 `cache.db`。

`translate-docs` 命令还使用 **文件跟踪**，因此未更改的源文件及其现有输出可以完全跳过工作。`--force-update` 在仍然使用段落缓存的同时重新运行文件处理；`--force` 清除文件跟踪并绕过段落缓存读取以进行 API 翻译。有关完整标志表，请参见 [入门](GETTING_STARTED.zh-CN.md#cache-behaviour-and-translate-docs-flags)。

**批量提示格式：** `translate-docs --prompt-format` 仅用于选择 `OpenRouterClient.translateDocumentBatch` 的 XML（`<seg>` / `<t>`）或 JSON 数组/对象格式；提取、占位符和验证保持不变。参见 [批量提示格式](GETTING_STARTED.zh-CN.md#batch-prompt-format)。

### 输出路径解析

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` 将源相对路径映射到输出路径：

- `nested` 风格（默认）：Markdown 使用 `{outputDir}/{locale}/{relPath}`。
- `docusaurus` 风格：在 `docsRoot` 下，输出使用 `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`；在 `docsRoot` 外的路径回退到嵌套布局。
- `flat` 风格：`{outputDir}/{stem}.{locale}{extension}`。当 `flatPreserveRelativeDir` 为 `true` 时，源子目录将保留在 `outputDir` 下。
- **自定义** `pathTemplate`：使用 `{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` 的任意 Markdown 布局。
- **自定义** `jsonPathTemplate`：为 JSON 标签文件设置的独立自定义布局，使用相同的占位符。
- `linkRewriteDocsRoot` 可帮助扁平链接重写器在翻译输出根目录不同于默认项目根目录时计算正确的前缀。

### 平面链接重写

当 `markdownOutput.style === "flat"` 时，翻译后的 markdown 文件与源文件并排放置，并带有语言后缀。页面之间的相对链接被重写，以便 `readme.de.md` 中的 `[Guide](../guide.md)` 指向 `guide.de.md`。由 `rewriteRelativeLinks` 控制（在没有自定义 `pathTemplate` 的平面风格下自动启用）。

---

## 共享基础设施

### `OpenRouterClient`

封装 OpenRouter 聊天完成 API。关键行为：

- **模型回退**：按顺序尝试解析列表中的每个模型；在HTTP错误或解析失败时回退。UI翻译在存在时首先解析`ui.preferredModel`，然后是`openrouter`模型。
- **速率限制**：检测到429响应，等待`retry-after`（或2秒），重试一次。
- **提示缓存**：系统消息与`cache_control: { type: "ephemeral" }`一起发送，以启用对支持模型的提示缓存。
- **调试流量日志**：如果设置了`debugTrafficFilePath`，则将请求和响应JSON附加到文件中。

### 配置加载

`loadI18nConfigFromFile(configPath, cwd)`管道：

1. 读取并解析`ai-i18n-tools.config.json`（JSON）。
2. `mergeWithDefaults` - 与`defaultI18nConfigPartial`深度合并，并将任何`documentations[].sourceFiles`条目合并到`contentPaths`中。
3. `expandTargetLocalesFileReferenceInRawInput` - 如果`targetLocales`是文件路径，则加载清单并展开为区域代码；设置`uiLanguagesPath`。
4. `expandDocumentationTargetLocalesInRawInput` - 对每个`documentations[].targetLocales`条目执行相同操作。
5. `parseI18nConfig` - Zod验证 + `validateI18nBusinessRules`。
6. `applyEnvOverrides` - 应用`OPENROUTER_API_KEY`、`I18N_SOURCE_LOCALE`等。
7. `augmentConfigWithUiLanguagesFile` - 附加清单显示名称。

### 日志记录器

`Logger`支持`debug`、`info`、`warn`、`error`级别，并带有ANSI颜色输出。详细模式（`-v`）启用`debug`。当设置`logFilePath`时，日志行也会写入该文件。

---

## 运行时助手API

这些从`'ai-i18n-tools/runtime'`导出，并在任何JavaScript环境中工作（浏览器、Node.js、Deno、Edge）。它们**不**从`i18next`或`react-i18next`导入。

### RTL助手

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### i18next设置工厂

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### 显示助手

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### 字符串助手

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## 编程API

所有公共类型和类都从包根目录导出。示例：从Node.js运行translate-UI步骤而不使用CLI：

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

关键导出：

| 导出 | 描述 |
|---|---|
| `loadI18nConfigFromFile` | 从JSON文件加载、合并、验证配置。 |
| `parseI18nConfig` | 验证原始配置对象。 |
| `TranslationCache` | SQLite缓存 - 使用`cacheDir`路径实例化。 |
| `UIStringExtractor` | 从JS/TS源提取`t("…")`字符串。 |
| `MarkdownExtractor` | 从markdown中提取可翻译的片段。 |
| `JsonExtractor` | 从Docusaurus JSON标签文件中提取。 |
| `SvgExtractor` | 从SVG文件中提取。 |
| `OpenRouterClient` | 向OpenRouter发送翻译请求。 |
| `PlaceholderHandler` | 保护/恢复翻译周围的markdown语法。 |
| `splitTranslatableIntoBatches` | 将片段分组为LLM大小的批次。 |
| `validateTranslation` | 翻译后的结构检查。 |
| `resolveDocumentationOutputPath` | 解析翻译文档的输出文件路径。 |
| `Glossary` / `GlossaryMatcher` | 加载和应用翻译词汇表。 |
| `runTranslateUI` | 编程翻译UI入口点。 |

---

## 扩展点

### 自定义函数名称（UI提取）

通过配置添加非标准翻译函数名称：

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### 自定义提取器

从包中实现 `ContentExtractor`：

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

通过以编程方式导入 `doc-translate.ts` 工具，将其传递给文档翻译管道。

### 自定义输出路径

使用 `markdownOutput.pathTemplate` 进行任何文件布局：

```json
{
  "documentations": [
    {
      "markdownOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
