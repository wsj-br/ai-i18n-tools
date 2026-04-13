---
translation_last_updated: '2026-04-13T00:28:27.772Z'
source_file_mtime: '2026-04-13T00:12:20.082Z'
source_file_hash: 492dc2b02831a77d02ebea5776448ae47f7ef6b42d4c5badaa92fd48201586c2
translation_language: zh-TW
source_file_path: docs/PACKAGE_OVERVIEW.md
---
# ai-i18n-tools：套件概述

本文件描述了 `ai-i18n-tools` 的內部架構，各組件如何協同運作，以及兩個核心工作流程的實現方式。

有關實際使用說明，請參見 [GETTING_STARTED.md](GETTING_STARTED.zh-TW.md)。

<small>**以其他語言閱讀：**</small>

<small id="lang-list">[en-GB](../../docs/PACKAGE_OVERVIEW.md) · [de](./PACKAGE_OVERVIEW.de.md) · [es](./PACKAGE_OVERVIEW.es.md) · [fr](./PACKAGE_OVERVIEW.fr.md) · [hi](./PACKAGE_OVERVIEW.hi.md) · [ja](./PACKAGE_OVERVIEW.ja.md) · [ko](./PACKAGE_OVERVIEW.ko.md) · [pt-BR](./PACKAGE_OVERVIEW.pt-BR.md) · [zh-CN](./PACKAGE_OVERVIEW.zh-CN.md) · [zh-TW](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [架構概述](#architecture-overview)
- [源碼樹](#source-tree)
- [工作流程 1 - UI 翻譯內部](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [平面區域文件](#flat-locale-files)
  - [UI 翻譯提示](#ui-translation-prompts)
- [工作流程 2 - 文檔翻譯內部](#workflow-2---document-translation-internals)
  - [提取器](#extractors)
  - [佔位符保護](#placeholder-protection)
  - [緩存 (`TranslationCache`)](#cache-translationcache)
  - [輸出路徑解析](#output-path-resolution)
  - [平面鏈接重寫](#flat-link-rewriting)
- [共享基礎設施](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [配置加載](#config-loading)
  - [日誌記錄器](#logger)
- [運行時幫助 API](#runtime-helpers-api)
  - [RTL 幫助器](#rtl-helpers)
  - [i18next 設置工廠](#i18next-setup-factories)
  - [顯示幫助器](#display-helpers)
  - [字符串幫助器](#string-helpers)
- [程序化 API](#programmatic-api)
- [擴展點](#extension-points)
  - [自定義函數名稱 (UI 提取)](#custom-function-names-ui-extraction)
  - [自定義提取器](#custom-extractors)
  - [自定義輸出路徑](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## 架構概述

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

消費者可能需要的所有程序化內容都從 `src/index.ts` 重新導出。

---

## 源碼樹

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

## 工作流程 1 - UI 翻譯內部

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

使用 `i18next-scanner` 的 `Parser.parseFuncFromString` 來查找任何 JS/TS 文件中的 `t("literal")` 和 `i18n.t("literal")` 調用。函數名稱和文件擴展名是可配置的，當啟用 `reactExtractor.includePackageDescription` 時，提取還可以包括項目的 `package.json` `description`。段哈希是修剪後源字符串的 **MD5 前 8 個十六進制字符** - 這些成為 `strings.json` 中的鍵。

### `strings.json`

主目錄的結構為：

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

`models`（選用）— 每個語系，標示該語系在上一次成功的 `translate-ui` 執行後，是由哪個模型產生的翻譯（若文字是從 `editor` 網頁 UI 儲存的，則為 `user-edited`）。`locations`（選用）— `extract` 發現字串的位置。

`extract` 會新增鍵值，並保留仍存在於掃描中的鍵之現有 `translated` / `models` 資料。`translate-ui` 會填入遺漏的 `translated` 條目，更新其所翻譯語系的 `models`，並寫入扁平化的語系檔案。

### 平面區域文件

每個目標語系會取得一個扁平的 JSON 檔案（例如 `de.json`），將原始字串對應至翻譯（不含 `models` 欄位）：

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next 將這些作為資源包加載，並通過源字符串查找翻譯（鍵作為默認模型）。

### UI 翻譯提示

`buildUIPromptMessages` 構建系統 + 用戶消息，該消息：
- 確定源語言和目標語言（通過 `localeDisplayNames` 或 `ui-languages.json` 中的顯示名稱）。
- 發送 JSON 字符串數組並請求返回 JSON 翻譯數組。
- 在可用時包括詞彙提示。

`OpenRouterClient.translateUIBatch` 會依序嘗試每個模型，並在解析或網路錯誤時進行備援。CLI 會根據 `openrouter.translationModels`（或舊版的預設/備援）建立此清單；對於 `translate-ui`，若設定 `ui.preferredModel`，則會將其前置（與其餘清單去重複）。

---

## 工作流程 2 - 文檔翻譯內部

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

所有提取器都擴展 `BaseExtractor` 並實現 `extract(content, filepath): Segment[]`。

- `MarkdownExtractor` - 將 Markdown 拆分為帶類型的區段：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。不可翻譯的區段（程式碼區塊、原始 HTML）會原樣保留。
- `JsonExtractor` - 從 Docusaurus JSON 標籤檔案中提取字串值。
- `SvgExtractor` - 從 SVG 提取 `<text>`、`<title>` 和 `<desc>` 內容（由 `translate-svg` 用於 `config.svg` 下的資源，不供 `translate-docs` 使用）。

### 佔位符保護

在翻譯之前，敏感語法會被不透明的標記替換，以防止 LLM 的損壞：

1. **Admonition 標記** (`:::note`, `:::`) - 恢復為精確的原始文本。
2. **文檔錨點** (HTML `<a id="…">`，Docusaurus 標題 `{#…}`) - 逐字保留。
3. **Markdown URL** (`](url)`，`src="../…"`) - 在翻譯後從映射中恢復。

### 緩存 (`TranslationCache`)

SQLite 數據庫（通過 `node:sqlite`）存儲以 `(source_hash, locale)` 為鍵的行，包含 `translated_text`、`model`、`filepath`、`last_hit_at` 和相關字段。哈希是標準化內容的 SHA-256 前 16 個十六進制字符（空白折疊）。

在每次運行中，根據哈希 × 語言環境查找段落。只有緩存未命中才會發送到 LLM。翻譯後，當前翻譯範圍內未命中的段落的 `last_hit_at` 將重置。`cleanup` 首先運行 `sync --force-update`，然後刪除過期的段落行（null `last_hit_at` / 空的 filepath），在解析的源路徑在磁碟上缺失時修剪 `file_tracking` 鍵（`doc-block:…`、`svg-assets:…` 等），並刪除其元數據 filepath 指向缺失文件的翻譯行；除非傳遞 `--no-backup`，否則會先備份 `cache.db`。

`translate-docs` 命令還使用 **文件跟踪**，因此未更改的源文件具有現有輸出可以完全跳過工作。`--force-update` 重新運行文件處理，同時仍使用段落緩存；`--force` 清除文件跟踪並繞過段落緩存讀取以進行 API 翻譯。請參見 [Getting Started](GETTING_STARTED.zh-TW.md#cache-behaviour-and-translate-docs-flags) 獲取完整的標誌表。

**批次提示格式：** `translate-docs --prompt-format` 僅針對 `OpenRouterClient.translateDocumentBatch` 選擇 XML（`<seg>` / `<t>`）或 JSON 陣列/物件格式；擷取、佔位符與驗證保持不變。請參閱 [批次提示格式](GETTING_STARTED.zh-TW.md#batch-prompt-format)。

### 輸出路徑解析

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` 將源相對路徑映射到輸出路徑：

- `nested` 樣式（預設）：Markdown 使用 `{outputDir}/{locale}/{relPath}`。
- `docusaurus` 樣式：在 `docsRoot` 下，輸出使用 `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`；在 `docsRoot` 外的路徑則回退至 nested 版面配置。
- `flat` 樣式：`{outputDir}/{stem}.{locale}{extension}`。當 `flatPreserveRelativeDir` 為 `true` 時，原始來源的子目錄會保留在 `outputDir` 下。
- **自訂** `pathTemplate`：使用 `{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` 的任何 Markdown 版面配置。
- **自訂** `jsonPathTemplate`：針對 JSON 標籤檔案的獨立自訂版面配置，使用相同的佔位符。
- `linkRewriteDocsRoot` 協助扁平化連結重寫器在翻譯輸出根目錄不同於預設專案根目錄時，計算正確的前置詞。

### 平面鏈接重寫

當 `markdownOutput.style === "flat"` 時，翻譯後的 markdown 文件將與源文件並排放置，並帶有語言後綴。頁面之間的相對鏈接會被重寫，以便 `readme.de.md` 中的 `[Guide](../guide.md)` 指向 `guide.de.md`。由 `rewriteRelativeLinks` 控制（在沒有自定義 `pathTemplate` 的平面樣式中自動啟用）。

---

## 共享基礎設施

### `OpenRouterClient`

封裝 OpenRouter 聊天完成 API。主要行為：

- **模型回退**：按順序嘗試解析列表中的每個模型；在 HTTP 錯誤或解析失敗時回退。當存在時，UI 翻譯首先解析 `ui.preferredModel`，然後是 `openrouter` 模型。
- **速率限制**：檢測到 429 響應，等待 `retry-after`（或 2 秒），然後重試一次。
- **提示緩存**：系統消息以 `cache_control: { type: "ephemeral" }` 發送，以啟用支持模型的提示緩存。
- **調試流量日誌**：如果設置了 `debugTrafficFilePath`，則將請求和響應 JSON 附加到文件中。

### 配置加載

`loadI18nConfigFromFile(configPath, cwd)` 管道：

1. 讀取並解析 `ai-i18n-tools.config.json`（JSON）。
2. `mergeWithDefaults` - 與 `defaultI18nConfigPartial` 深度合併，並將任何 `documentations[].sourceFiles` 條目合併到 `contentPaths` 中。
3. `expandTargetLocalesFileReferenceInRawInput` - 如果 `targetLocales` 是文件路徑，則加載清單並擴展為區域代碼；設置 `uiLanguagesPath`。
4. `expandDocumentationTargetLocalesInRawInput` - 對每個 `documentations[].targetLocales` 條目執行相同操作。
5. `parseI18nConfig` - Zod 驗證 + `validateI18nBusinessRules`。
6. `applyEnvOverrides` - 應用 `OPENROUTER_API_KEY`、`I18N_SOURCE_LOCALE` 等。
7. `augmentConfigWithUiLanguagesFile` - 附加清單顯示名稱。

### 日誌記錄器

`Logger` 支持 `debug`、`info`、`warn`、`error` 等級，並提供 ANSI 顏色輸出。詳細模式（`-v`）啟用 `debug`。當設置 `logFilePath` 時，日誌行也會寫入該文件。

---

## 運行時輔助 API

這些從 `'ai-i18n-tools/runtime'` 導出，並在任何 JavaScript 環境中工作（瀏覽器、Node.js、Deno、Edge）。它們**不**從 `i18next` 或 `react-i18next` 導入。

### RTL 輔助工具

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### i18next 設置工廠

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### 顯示輔助工具

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### 字串輔助工具

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## 程式化 API

所有公共類型和類別都從包根目錄導出。示例：從 Node.js 運行 translate-UI 步驟而不使用 CLI：

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

關鍵導出：

| 導出 | 描述 |
|---|---|
| `loadI18nConfigFromFile` | 從 JSON 文件加載、合併、驗證配置。 |
| `parseI18nConfig` | 驗證原始配置對象。 |
| `TranslationCache` | SQLite 緩存 - 使用 `cacheDir` 路徑實例化。 |
| `UIStringExtractor` | 從 JS/TS 源中提取 `t("…")` 字串。 |
| `MarkdownExtractor` | 從 markdown 中提取可翻譯的片段。 |
| `JsonExtractor` | 從 Docusaurus JSON 標籤文件中提取。 |
| `SvgExtractor` | 從 SVG 文件中提取。 |
| `OpenRouterClient` | 向 OpenRouter 發送翻譯請求。 |
| `PlaceholderHandler` | 保護/恢復翻譯周圍的 markdown 語法。 |
| `splitTranslatableIntoBatches` | 將片段分組為 LLM 大小的批次。 |
| `validateTranslation` | 翻譯後的結構檢查。 |
| `resolveDocumentationOutputPath` | 解決翻譯文檔的輸出文件路徑。 |
| `Glossary` / `GlossaryMatcher` | 加載和應用翻譯詞彙表。 |
| `runTranslateUI` | 程式化 translate-UI 入口點。 |

---

## 擴展點

### 自定義函數名稱（UI 提取）

通過配置添加非標準翻譯函數名稱：

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### 自定義提取器

從套件中實作 `ContentExtractor`：

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

通過以程式方式導入 `doc-translate.ts` 工具，將其傳遞到 doc-translate 管道。

### 自訂輸出路徑

使用 `markdownOutput.pathTemplate` 來設置任何文件佈局：

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
