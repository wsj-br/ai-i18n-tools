<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools：套件概觀

本文說明 `ai-i18n-tools` 的內部架構、各元件如何整合，以及兩種核心工作流程的實作方式。

如需實際使用說明，請參閱 [GETTING_STARTED.md](GETTING_STARTED.zh-TW.md)。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [हिन्दी](./PACKAGE_OVERVIEW.hi.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [中文 (中国大陆)](./PACKAGE_OVERVIEW.zh-CN.md) · [中文 (台灣)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [架構概觀](#architecture-overview)
- [原始碼樹狀結構](#source-tree)
- [工作流程 1 - UI 翻譯內部機制](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [平面式語系檔案](#flat-locale-files)
  - [UI 翻譯提示](#ui-translation-prompts)
- [工作流程 2 - 文件翻譯內部機制](#workflow-2---document-translation-internals)
  - [提取器](#extractors)
  - [標題錨點插入 (`write-heading-ids` CLI)](#heading-anchor-insertion-write-heading-ids-cli)
  - [佔位符保護](#placeholder-protection)
  - [快取 (`TranslationCache`)](#cache-translationcache)
  - [輸出路徑解析](#output-path-resolution)
  - [平面式連結重寫](#flat-link-rewriting)
- [共用基礎設施](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [設定載入](#config-loading)
  - [記錄器](#logger)
- [執行階段輔助 API](#runtime-helpers-api)
  - [RTL 輔助工具](#rtl-helpers)
  - [i18next 設定工廠](#i18next-setup-factories)
  - [顯示輔助工具](#display-helpers)
  - [字串輔助工具](#string-helpers)
- [程式化 API](#programmatic-api)
- [擴充點](#extension-points)
  - [自訂函式名稱 (UI 提取)](#custom-function-names-ui-extraction)
  - [自訂提取器](#custom-extractors)
  - [自訂輸出路徑](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## 架構概觀

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, write-heading-ids, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

所有消費者可能需要以程式方式使用的內容，都會從 `src/index.ts` 重新匯出。

---

<a id="source-tree"></a>
## 原始碼樹狀結構

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
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

<a id="workflow-1---ui-translation-internals"></a>
## 工作流程 1 - UI 翻譯內部機制

```text
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

<a id="uistringextractor"></a>
### `UIStringExtractor`

使用 `i18next-scanner` 的 `Parser.parseFuncFromString` 來尋找任何 JS/TS 檔案中的 `t("literal")` 和 `i18n.t("literal")` 呼叫。函式名稱和檔案副檔名均可設定。`extract` **也會將非掃描器的輸入合併到同一個目錄中：** 當啟用 `reactExtractor.includePackageDescription` 時（預設值）的專案 `package.json` `description`，以及當 `reactExtractor.includeUiLanguageEnglishNames` 為 `true` 且設定 `uiLanguagesPath` 時來自 `ui-languages.json` 的每個 `englishName`（原始碼中已找到的字串具有較高優先順序）。區段雜湊值是修剪後原始字串的 **MD5 前 8 個十六進位字元** — 這些將成為 `strings.json` 中的鍵值。

<a id="stringsjson"></a>
### `strings.json`

主目錄的結構如下：

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

`models`（選用）— 依語系，記錄該語系在上一次成功執行 `translate-ui` 後是由哪個模型產生翻譯（若文字是從 `editor` 網頁 UI 儲存，則為 `user-edited`）。`locations`（選用）— `extract` 發現字串的位置（掃描器 + 套件描述行；僅限 manifest 的 `englishName` 字串可省略 `locations`）。

`extract` 會新增鍵，並保留仍存在於掃描結果中的鍵之既有 `translated` / `models` 資料（掃描器字面值、選用描述、選用 manifest `englishName`）。`translate-ui` 會填補遺漏的 `translated` 項目，更新其翻譯語系的 `models`，並寫入平面語系檔案。

`ui-languages.json` **manifest** — `{ code, label, englishName, direction }` 的 JSON 陣列（BCP-47 `code`、UI `label`、參考 `englishName`、`"ltr"` 或 `"rtl"`）。使用 `generate-ui-languages` 從 `sourceLocale` + `targetLocales` 及捆綁的主 `data/ui-languages-complete.json` 建立專案檔案。

<a id="flat-locale-files"></a>
### 平坦式語系檔案

每個目標語系會獲得一個平面 JSON 檔案（`de.json`），將原始字串對應至翻譯（不含 `models` 欄位）：

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next 會將這些作為資源套件載入，並以原始字串進行翻譯查找（鍵即預設值模型）。

<a id="ui-translation-prompts"></a>
### UI 翻譯提示

`buildUIPromptMessages` 建構系統與使用者訊息，其內容為：

- 辨識來源語言與目標語言（根據 `localeDisplayNames` 或 `ui-languages.json` 中的顯示名稱）。
- 傳送字串的 JSON 陣列，並請求回傳翻譯後的 JSON 陣列。
- 有可用時包含詞彙表提示。

`OpenRouterClient.translateUIBatch` 會依序嘗試每個模型，在解析或網路錯誤時進行備援。CLI 從 `openrouter.translationModels`（或舊版預設/備援）建立該清單；對於 `translate-ui`，當設定時會在前面加入選擇性的 `ui.preferredModel`（與其餘項目去重複）。

---

<a id="workflow-2---document-translation-internals"></a>
## 工作流程 2 - 文件翻譯內部機制

```text
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

<a id="extractors"></a>
### 提取器

所有提取器均繼承自 `BaseExtractor` 並實作 `extract(content, filepath): Segment[]`。

- `MarkdownExtractor` - 將 Markdown 拆分為帶類型的片段：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。不可翻譯的片段（程式碼區塊、原始 HTML）會原樣保留。
- `JsonExtractor` - 從 Docusaurus JSON 標籤檔中提取字串值。
- `SvgExtractor` - 從 SVG 提取 `<text>`、`<title>` 和 `<desc>` 內容（由 `translate-svg` 用於 `config.svg` 下的資源，`translate-docs` 不使用）。

<a id="heading-anchor-insertion-write-heading-ids"></a>
### 標題錨點插入 (`write-heading-ids` CLI)

`write-heading-ids` 命令是一個 **本地、非 LLM** 的文件 Markdown 預處理器。實作方式：`src/cli/write-heading-ids.ts` 協調檔案發現；`src/markdown/write-heading-ids-core.ts` 解析行並插入錨點。

它需要一個有效的設定，且 **至少包含一個 `documentations[]` 區塊**。針對每個區塊，它會收集 `contentPaths` 下的 `.md` / `.mdx` 檔案，套用專案的 `.translate-ignore` 規則（概念與文件翻譯相同），並可選擇性地使用 `--path` / `--file` 限制於子樹。每個檔案會透過 `applyHeadingAnchorsToMarkdown` 進行轉換：對於 fenced code blocks 之外的每個 **平面 ATX 標題**（`# …` 至 `###### …`），若上方缺少或過時，則會在上一行插入一個空的 HTML 行 `<a id="slug"></a>`。slug 演算法與常見生態系一致 — `github`（預設）、`bitbucket`、`gitlab`、`pymdown`（可選的 Unicode 正規化 / 百分比編碼旗標）、`azure-devops` — 因此錨點 ID 能與現有工具（如 doctoc、PyMdown 等）保持一致。`--dry-run` 報告將會進行的修改但不實際寫入。

此命令 **不會** 在 `translate-docs` 或 `sync` 內執行；當您在翻譯或發布前需要在原始碼檔案中取得穩定的片段 ID 時，請明確執行它。

<a id="placeholder-protection"></a>
### 暫存符號保護

翻譯前，敏感語法會被替換為不透明的標記，以防止 LLM 破壞：

1. **警告標記**（`:::note`、`:::`） - 以原始文字精確還原。
2. **文件錨點**（HTML `<a id="…">`、Docusaurus 標題 `{#…}`） - 原樣保留。
3. **Markdown 網址**（`](url)`、`src="../…"`） - 翻譯後從對應表還原。

<a id="cache-translationcache"></a>
### 快取 (`TranslationCache`)

SQLite 資料庫（透過 `node:sqlite`）以 `(source_hash, locale)` 為鍵儲存資料列，包含 `translated_text`、`model`、`filepath`、`last_hit_at` 及相關欄位。雜湊值為標準化內容（空白字元合併）的 SHA-256 前 16 個十六進位字元。

每次執行時，會以雜湊值 × 區域設定查找片段。只有未命中快取的項目才會送至 LLM。翻譯完成後，`last_hit_at` 會重設當前翻譯範圍內未命中的片段資料列。`cleanup` 會先執行 `sync --force-update`，然後移除過時的片段資料列（`last_hit_at` 為 null / 檔案路徑為空），當解析的來源路徑在磁碟上不存在時清除 `file_tracking` 鍵（如 `doc-block:…`、`svg-assets:…` 等），並移除其中繼資料檔案路徑指向不存在檔案的翻譯資料列；除非傳入 `--no-backup`，否則會先備份 `cache.db`。

`translate-docs` 指令也使用 **檔案追蹤**，因此來源未變動且已有輸出時可完全跳過處理。`--force-update` 會重新執行檔案處理，但仍使用片段快取；`--force` 會清除檔案追蹤並繞過片段快取讀取以進行 API 翻譯。完整旗標表請見 [快速入門](GETTING_STARTED.zh-TW.md#cache-behaviour-and-translate-docs-flags)。

**批次提示格式：** `translate-docs --prompt-format` 僅針對 `OpenRouterClient.translateDocumentBatch` 選擇 XML（`<seg>` / `<t>`）或 JSON 陣列/物件格式；提取、暫存變數和驗證保持不變。詳情請見 [批次提示格式](GETTING_STARTED.zh-TW.md#batch-prompt-format)。

<a id="output-path-resolution"></a>
### 輸出路徑解析

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` 將來源相對路徑對應至輸出路徑：

- `nested` 樣式 (預設)：針對 Markdown 使用 `{outputDir}/{locale}/{relPath}`。
- `docusaurus` 樣式：位於 `docsRoot` 底下，輸出使用 `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`；在 `docsRoot` 之外的路徑會回退至巢狀佈局。
- `flat` 樣式：`{outputDir}/{stem}.{locale}{extension}`。當 `flatPreserveRelativeDir` 為 `true` 時，原始碼子目錄會保留在 `outputDir` 底下。
- **自訂** `pathTemplate`：使用 `{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` 的任意 Markdown 佈局。
- **自訂** `jsonPathTemplate`：JSON 標籤檔案的獨立自訂佈局，使用相同的佔位符。
- `linkRewriteDocsRoot` 可協助平面式連結重寫器在翻譯輸出的根目錄不同於預設專案根目錄時，計算出正確的前置字串。

<a id="flat-link-rewriting"></a>
### 平坦式連結重寫

當 `markdownOutput.style === "flat"` 時，翻譯後的 Markdown 檔案會與來源檔案並列放置，並加上語系後綴。頁面之間的相對連結會被重寫，使得 `[Guide](../guide.md)` 中的 `readme.de.md` 指向 `guide.de.md`。由 `rewriteRelativeLinks` 控制（在無自訂 `pathTemplate` 的平面風格下自動啟用）。

---

<a id="shared-infrastructure"></a>
## 共用基礎設施

<a id="openrouterclient"></a>
### `OpenRouterClient`

包裝 OpenRouter 對話補全 API。主要行為：

- **模型備援**：依序嘗試已解析清單中的每個模型；在發生 HTTP 錯誤或解析失敗時進行備援。UI 翻譯會優先解析 `ui.preferredModel`，若存在，再解析 `openrouter` 模型。
- **請求逾時**：`openrouter.requestTimeoutMs`（預設 30 秒）透過 `AbortSignal.timeout` 中止每次聊天補全請求。同一數值也適用於 CLI 載入目錄時的 `GET /models`（例如 `check-models` 以及選擇性預先篩選以排除未知模型 ID 的機制）。
- **速率限制**：偵測 429 回應，等待 `retry-after`（或 2 秒），並重試一次。
- **除錯流量記錄**：若設定 `debugTrafficFilePath`，則將請求與回應的 JSON 附加至檔案中。

<a id="config-loading"></a>
### 設定載入

`loadI18nConfigFromFile(configPath, cwd)` 流程：

1. 讀取並解析 `ai-i18n-tools.config.json` (JSON)。
2. `mergeWithDefaults` - 與 `defaultI18nConfigPartial` 深層合併，並將任何 `documentations[].sourceFiles` 項目合併至 `contentPaths`。
3. `expandTargetLocalesFileReferenceInRawInput` - 若 `targetLocales` 為檔案路徑，載入 manifest 並展開為語系代碼；設定 `uiLanguagesPath`。
4. `expandDocumentationTargetLocalesInRawInput` - 對每個 `documentations[].targetLocales` 項目執行相同操作。
5. `parseI18nConfig` - Zod 驗證 + `validateI18nBusinessRules`。
6. `applyEnvOverrides` - 套用 `OPENROUTER_API_KEY`、`I18N_SOURCE_LOCALE` 等。
7. `augmentConfigWithUiLanguagesFile` - 附加 manifest 顯示名稱。

<a id="logger"></a>
### 記錄器

`Logger` 支援 `debug`、`info`、`warn`、`error` 等級，並提供 ANSI 色彩輸出。詳細模式（`-v`）會啟用 `debug`。當設定 `logFilePath` 時，記錄行也會寫入該檔案。

---

<a id="runtime-helpers-api"></a>
## 執行階段輔助 API

這些功能從 `'ai-i18n-tools/runtime'` 匯出，可在任何 JavaScript 環境中使用（瀏覽器、Node.js、Deno、Edge）。它們 **不會** 從 `i18next` 或 `react-i18next` 匯入。

<a id="rtl-helpers"></a>
### RTL 輔助工具

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next 設定工廠

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

使用 `setupKeyAsDefaultT` 作為一般應用程式的進入點（鍵修剪 + 複數 `wrapT` + 選用的 `translate-ui` `{sourceLocale}.json`）。單獨呼叫 `wrapI18nWithKeyTrim` 在應用程式配線中已 **棄用**。

使用 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` 建立 `localeLoaders`，使鍵值在 `generate-ui-languages` 後仍與 `targetLocales` 保持一致。請參閱 `docs/GETTING_STARTED.md`（執行階段配線）與 `examples/nextjs-app/` / `examples/console-app/`。

<a id="display-helpers"></a>
### 顯示輔助工具

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### 字串輔助工具

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## 程式化 API

所有公開的類型與類別皆從套件根目錄匯出。範例：在不使用 CLI 的情況下，從 Node.js 執行 translate-UI 步驟：

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

主要匯出：

| 匯出 | 說明 |
|---|---|
| `loadI18nConfigFromFile` | 從 JSON 檔案載入、合併並驗證設定。 |
| `parseI18nConfig` | 驗證原始設定物件。 |
| `TranslationCache` | SQLite 快取 - 使用 `cacheDir` 路徑進行實例化。 |
| `UIStringExtractor` | 從 JS/TS 原始碼中提取 `t("…")` 字串。 |
| `MarkdownExtractor` | 從 Markdown 中提取可翻譯的段落。 |
| `JsonExtractor` | 從 Docusaurus JSON 標籤檔案中提取。 |
| `SvgExtractor` | 從 SVG 檔案中提取。 |
| `OpenRouterClient` | 向 OpenRouter 發送翻譯請求。 |
| `PlaceholderHandler` | 保護/還原翻譯周圍的 Markdown 語法。 |
| `splitTranslatableIntoBatches` | 將段落分組為符合 LLM 大小的批次。 |
| `validateTranslation` | 翻譯後的結構性檢查。 |
| `resolveDocumentationOutputPath` | 解析翻譯文件的輸出檔案路徑。 |
| `Glossary` / `GlossaryMatcher` | 讀取並套用翻譯術語表。 |
| `runTranslateUI` | 程式化翻譯 UI 的進入點。 |

---

<a id="extension-points"></a>
## 擴充點

<a id="custom-function-names-ui-extraction"></a>
### 自訂函式名稱 (UI 提取)

透過設定新增非標準的翻譯函數名稱：

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

<a id="custom-extractors"></a>
### 自訂提取器

實作套件中的 `ContentExtractor`：

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

透過程式化方式匯入 `doc-translate.ts` 工具函式，並將其傳遞給文件翻譯流程。

<a id="custom-output-paths"></a>
### 自訂輸出路徑

使用 `markdownOutput.pathTemplate` 來定義任何檔案佈局：

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
