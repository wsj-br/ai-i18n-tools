<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools：套件總覽

本文檔描述了 `ai-i18n-tools` 的內部架構、各元件如何組合，以及三個可組合的工作流程（UI 字串、文件、巢狀 JSON）加上可選的 SVG 翻譯是如何實現的。

如需實際使用說明，請參閱 [GETTING_STARTED.md](GETTING_STARTED.zh-Hant.md)。如需螢幕截圖和翻譯文件中的圖解 SVG，請參閱 [LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.zh-Hant.md)。

<small>**以其他語言閱讀：** </small>
<small id="lang-list">[English (UK)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [Hindi (Roman)](./PACKAGE_OVERVIEW.hi-Latn.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [简体中文](./PACKAGE_OVERVIEW.zh-Hans.md) · [繁體中文](./PACKAGE_OVERVIEW.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目錄**

- [架構總覽](#architecture-overview)
- [原始碼樹](#source-tree)
- [工作流程 1 - UI 翻譯內部](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [平面地區設定檔案](#flat-locale-files)
  - [UI 翻譯提示](#ui-translation-prompts)
- [工作流程 2 - 文件翻譯內部](#workflow-2---document-translation-internals)
- [工作流程 3 - 巢狀 JSON 內部](#workflow-3---nested-json-internals)
  - [提取器](#extractors)
  - [Astro 混合網站（UI + 頁面 HTML）](#astro-hybrid-sites-ui--page-html)
  - [標題錨點插入（`write-heading-ids` CLI）](#heading-anchor-insertion-write-heading-ids-cli)
  - [佔位符保護](#placeholder-protection)
  - [快取（`TranslationCache`）](#cache-translationcache)
  - [輸出路徑解析](#output-path-resolution)
  - [平面連結重寫](#flat-link-rewriting)
- [共用基礎設施](#shared-infrastructure)
  - [`LlmClient`](#openrouterclient)
  - [設定載入](#config-loading)
  - [記錄器](#logger)
- [執行階段輔助程式 API](#runtime-helpers-api)
  - [RTL 輔助程式](#rtl-helpers)
  - [i18next 設定工廠](#i18next-setup-factories)
  - [顯示輔助程式](#display-helpers)
  - [字串輔助程式](#string-helpers)
- [程式設計 API](#programmatic-api)
- [擴充點](#extension-points)
  - [自訂函式名稱（UI 提取）](#custom-function-names-ui-extraction)
  - [自訂提取器](#custom-extractors)
  - [自訂輸出路徑](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## 架構總覽

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, mark-html, translate-ui, translate-svg, translate-docs, translate-json, sync, status, dashboard, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express app for the Translation Dashboard (cache / glossary)
└── Utils (src/utils/)         - logger, hash, ignore parser
```

消費者透過程式設計可能需要的所有內容都會從 `src/index.ts` 重新匯出。

---

<a id="source-tree"></a>
## 原始碼樹

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
│   ├── locale-utils.ts             BCP-47 normalisation and locale list parsing
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
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## 工作流程 1 - UI 翻譯內部

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

使用 `i18next-scanner` 的 `Parser.parseFuncFromString` 來尋找 JS/TS 檔案中的 `t("literal")` 和 `i18n.t("literal")` 呼叫。對於 `.astro` 來源（當列於 `ui.uiExtractor.extensions` 中時），`ui-string-babel.ts` 會使用 `@babel/parser` 解析 frontmatter 和 template 中的 `{expression}` 區塊，並套用相同的 `funcNames` 規則。函式名稱和檔案副檔名可透過 `ui.uiExtractor` 進行設定（`ui.reactExtractor` 是支援的別名）。`extract` **也會將非掃描器的輸入合併至同一個目錄中：** 當啟用 `includePackageDescription` 時（預設值），會納入專案的 `package.json` `description`；當 `includeUiLanguageEnglishNames` 為 `true` 且設定 `uiLanguagesPath` 時，則會納入來自 `ui-languages.json` 的每一個 `englishName`（原始碼中已找到的字串具有較高優先順序）。區段雜湊值為修剪後原始字串的 **MD5 前 8 個十六進位字元** — 這些將成為 `strings.json` 中的鍵值。

對於 `.html` / `.htm` 來源（當列於 `ui.uiExtractor.extensions` 時），`extract` 會改為透過 `html-i18n-marks.ts` 來路由檔案，該檔案會掃描 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 標記屬性（可透過 `ui.uiExtractor.htmlI18nAttributes` 設定）。純標記會從元素的自身 `textContent` / `title` / `placeholder` 獲取來源文字；有值的標記（`data-i18n="Key"`）則使用該值。相同的模組也支援 `mark-html` 命令，該命令會自動插入純標記。HTML 檔案永遠不會到達 Babel / i18next-scanner 的處理階段。

純粹的 Astro SSG 網站可以略過 i18next：在建置時載入平面 `{locale}.json`，並透過來源文字索引鍵解析 `t('English')`（請參閱 `examples/astro-website/src/i18n/t.ts` 和 [GETTING_STARTED — Astro 網站](GETTING_STARTED.zh-Hant.md#astro-website))。

純 HTML 應用程式遵循相同的目錄模型，使用標記屬性而非 `t()` 呼叫 — 請參閱 [GETTING_STARTED — Marking HTML for translation](GETTING_STARTED.zh-Hant.md#marking-html-for-translation)。

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

`models` (選用) — 依據地區設定，指出哪個模型在該地區設定的上次成功 `translate-ui` 執行後產生了該翻譯 (或若文字是從翻譯儀表板儲存的，則為 `user-edited`)。 `models` (選用) — `extract` 找到該字串的位置 (掃描器 + 套件描述行；僅限資訊清單的 `englishName` 字串可能會省略 `locations`)。

`extract` 會新增金鑰並保留掃描中仍存在的金鑰的現有 `translated` / `models` 資料 (掃描器字面值、選用描述、選用資訊清單 `englishName`)。 `translate-ui` 會填補遺失的 `translated` 項目，更新其翻譯的地區設定的 `models`，並寫入扁平化的地區設定檔案。

`ui-languages.json` **manifest** — `{ code, label, englishName, direction }` 的 JSON 陣列 (BCP-47 `code`、UI `label`、參考 `englishName`、`"ltr"` 或 `"rtl"`)。使用 `generate-ui-languages` 從 `sourceLocale` + `targetLocales` 和內嵌的主 `data/ui-languages-complete.json` 建置專案檔案。

<a id="flat-locale-files"></a>
### 扁平化地區設定檔案

每個目標地區設定都會獲得一個扁平化的 JSON 檔案 (`de.json`) 將來源字串對應到翻譯 (沒有 `models` 欄位)：

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next 會將這些載入為資源套件，並透過來源字串 (預設值即金鑰模型) 來查找翻譯。

<a id="ui-translation-prompts"></a>
### UI 翻譯提示

`buildUIPromptMessages` 建置系統 + 使用者訊息，這些訊息會：

- 識別來源和目標語言 (透過 `localeDisplayNames` 或 `ui-languages.json` 的顯示名稱)。
- 發送字串的 JSON 陣列，並要求回傳翻譯的 JSON 陣列。
- 在有詞彙提示時包含它們。

`LlmClient.translateUIBatch` 會依序嘗試每個模型，在發生剖析或網路錯誤時進行回退。CLI 會從作用中提供者的 `translationModels` 建置該清單；對於 `translate-ui`，若已設定 (與其餘部分去重) ，則會在前面加上選用的 `ui.preferredModel`。

---

<a id="workflow-2---document-translation-internals"></a>
## 工作流程 2 - 文件翻譯內部

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

所有提取器都會擴充 `BaseExtractor` 並實作 `extract(content, filepath): Segment[]`。

- `MarkdownExtractor` — 將 markdown 分割成類型的區段：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。YAML 前導資訊被歸類為 **不可翻譯** (`slug`、`id` 和其他路由金鑰保持穩定)。頂層 `export ...` 區塊 (例如 React 元件定義) 被歸類為不可翻譯的 `other` 區段，與現有的 `import ...` 處理方式相同。以大寫 JSX 標籤開頭的多行區塊 (例如 `<Tabs>` 區塊) 被歸類為可翻譯的段落。不可翻譯的區段 (程式碼區塊、原始 HTML) 會被逐字保留。
- `AstroTemplateExtractor` — 針對 `.astro` 行銷頁面進行剖析和替換 (透過 `doc-translate.ts` 中的 `translateAstroFile` 進行 `translate-docs`)。提取使用者介面的 HTML 文字節點和可翻譯屬性 (`alt`、`title`、`aria-label`、`placeholder`)，以及當使用者介面時模板 `{expression}` 區塊內的字串字面值。會略過前導資訊的 TypeScript、`<script>`、`<style>`、受保護的屬性/金鑰值，以及 `t('…')` 中的字面值。重新組合時會調整相對匯入，以防輸出路徑更深 (例如 `src/pages/de/index.astro`)。請參閱 [GETTING_STARTED — Astro 網站頁面](GETTING_STARTED.zh-Hant.md#astro-website-parse-and-replace)。
- `JsonExtractor` — 從 Docusaurus JSON 標籤檔案中提取字串值 (Docusaurus UI 目錄，非 MDX 主體)。
- `SvgExtractor` — 從 SVG 中提取 `<text>`、`<title>` 和 `<desc>` 內容 (由 `translate-svg` 用於 `config.svg` 下的檔案，而非 `translate-docs`)。
- `html-i18n-marks.ts` - 一個專注的 HTML 標記掃描器，由 `extract` 用於 `.html` / `.htm` 來源，並由 `mark-html` 命令使用。`collectHtmlI18nStrings` / `collectHtmlI18nLocations` 讀取 `data-i18n*` 標記屬性（純標記 → 元素 `textContent` / `title` / `placeholder`；有值標記 → 該值），而 `markHtmlContent` 會將純標記插入到葉面文字 / 標題 / 預留位置元素中（結果相同，尊重 `data-i18n-ignore`，並略過類似程式碼和混合內容的元素）。共用的 `normalizeI18nText` 輔助工具可確保建置時的索引鍵與瀏覽器執行階段的索引鍵相同。

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro 混合網站 (UI + 頁面 HTML)

純粹的 Astro 應用程式通常會在單一設定檔中啟用 **兩種**工作流程 (參考：`examples/astro-website/`)：

| 層級 | 機制 | 輸出 |
|-------|-----------|--------|
| 模板 HTML | `AstroTemplateExtractor` + `translate-docs` | 每地區設定的 `.astro`，位於 `docs[].outputDir` 下 |
| 前導資訊 / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | 扁平化 `public/locales/{locale}.json` (以英文來源作為金鑰) |

`sync` 命令會依序執行啟用的步驟：**extract** 然後 **translate-ui** (當 `features.translateUIStrings`) → 選用的 **translate-svg** → **translate-docs** → 選用的 **translate-json** (除非使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳過)。Init 模板 `ui-astro-website` 只會建置工作流程 1；新增 `docs[]` 和 `features.translateDocs` 以支援頁面 HTML。

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### 標題錨點插入 (`write-heading-ids` CLI)

`write-heading-ids` 命令是一個 **本機、非 LLM** 的文件 Markdown 預處理器。實作方式：`src/cli/write-heading-ids.ts` 負責協調檔案發現；`src/markdown/write-heading-ids-core.ts` 解析行內容並插入錨點。

它需要一個有效的設定，其中 **至少包含一個 `docs[]` 區塊**。針對每個區塊，它會蒐集 `contentPaths` 目錄下的 `.md` / `.mdx` 檔案，套用專案的 `.translate-ignore` 規則（概念與文件翻譯相同），並可選擇性地透過 `--path` / `--file` 限制於子目錄樹。每個檔案會透過 `applyHeadingAnchorsToMarkdown` 進行轉換：對於每個位於程式碼區塊之外的 **扁平 ATX 標題**（`# …` 至 `###### …`），若上方缺少或已過時，則會插入一個空的 HTML 行 `<a id="slug"></a>`。Slug 演算法符合常見生態系的標準——`github`（預設）、`bitbucket`、`gitlab`、`pymdown`（可選的 Unicode 正規化 / 百分比編碼旗標）、`azure-devops`——以確保錨點 ID 與現有工具（如 doctoc、PyMdown 等）保持一致。`--dry-run` 報告將會進行的修改，但不實際寫入檔案。

此命令**不會**在 `translate-docs` 或 `sync` 中執行；當您希望在翻譯或發佈前，原始檔案中有穩定的片段 ID 時，請明確執行此命令。

<a id="placeholder-protection"></a>
### 佔位符保護

在翻譯之前，敏感語法會被替換為不透明的 token，以防止 LLM 損壞，按此順序套用（還原是反向的）：

1. **HTML 標籤和註解**（`<strong>`、`<!-- ... -->` 等）- 來自已知允許清單的 HTML 標籤會被替換為 `{{HTM_N}}` token。大寫的 JSX 標籤（`<Highlight>`、`<Tabs>`、`</Tab>`）由 MDX 層（步驟 4）另外處理。
2. **提示標記**（`:::note`、`:::`）- 僅替換開頭行上的指令前綴為 `{{ADM_OPEN_N}}`；同一行的標題留給模型翻譯。使用完全相同的原始文字還原。
3. **文件錨點**（HTML `<a id="…">`、Docusaurus 標題 `{#…}`）- 按原樣保留。
4. **僅限 MDX 的結構**（`src/processors/mdx-placeholders.ts`）：
   - **MDX 註解**（`{/* … */}`，包括 Docusaurus 標題 ID 形式 `{/* #my-id */}`）替換為 `{{MDX_N}}`。
   - **大寫 JSX 標籤**（`<Highlight>`、`<Tabs>`、`<TabItem>`、`<TOCInline />`、`</Highlight>`）- 保留為 `{{MDX_N}}`，其中可翻譯的字串屬性（`label`、`tooltip`、`aria-label`）在標籤內重寫為 `{{JXA_N}}`，除非屬性名稱出現在 `docs[].protectAttributes` 中；`label:` 在 `<Tabs values={[ { label: '…' } ]}>` 物件字面量中（可透過 `docs[].protectKeys` 跳過）以及 `<TabItem value="…">`（當不存在 `label` 屬性時，跳過類似小寫字串的值）也會被提取。附加到區段作為 `||JXA_N: …||` 行，由 `restoreMdx` 合併回來。
   - **MDX 大括號表達式**（`{frontMatter.title}`、`style={{…}}`）- 深度感知匹配，替換為 `{{MDX_N}}`。
5. **Markdown URL**（`](url)`、`src="../../docs/…"`）- 在翻譯後從映射中還原。
6. **行內程式碼跨距**（`` `code` ``）和 **粗體包圍的行內程式碼**（`**`code`**`）- 保留。
7. **Markdown 強調**（可選，對 CJK/RTL 地區自動啟用）- 強調分隔符已遮罩。

Astro 模板和 MDX JSX 的共用屬性/金鑰保護在 `src/processors/expression-attribute-protection.ts` 中實作，並由 `docs[].protectAttributes` 和 `docs[].protectKeys` 按區塊驅動（請參閱 [GETTING_STARTED — protectAttributes / protectKeys](GETTING_STARTED.zh-Hant.md#protectattributes-protectkeys))。

<a id="cache-translationcache"></a>
### 快取（`TranslationCache`）

SQLite 資料庫（透過 `node:sqlite`）儲存列，其金鑰為 `(source_hash, locale)`，包含 `translated_text`、`model`、`filepath`、`last_hit_at` 和相關欄位。雜湊是正規化內容（空白字元折疊）的前 16 個十六進位字元的 SHA-256。

在每次執行時，會透過雜湊 × 語言環境來查詢區段。只有快取未命中才會傳送至 LLM。翻譯後，`last_hit_at` 會針對目前翻譯範圍中未命中的區段列重設。文件翻譯期間成功的快取命中會清除該區段的過時 `translation_failures` 列。`cleanup` 會先執行 `sync --force-update`，然後移除過時的區段列（空 `last_hit_at` / 空檔案路徑），在磁碟上找不到解析的來源路徑時修剪 `file_tracking` 鍵（`doc-block:…`、`json-block:…`、`svg-files:…` 等），移除其中繼資料檔案路徑指向遺失檔案的翻譯列，修剪孤立的 `translation_failures` 列，並修剪其解析的來源路徑在磁碟上遺失的孤立 `markdown_source_issues` 列；除非傳遞 `--backup <path>`，否則它不會備份 `cache.db`，這會先將備份寫入該路徑。

`translate-docs` 命令還使用 **檔案追蹤**，因此具有現有輸出的未變更來源可以完全跳過工作。`--force-update` 會重新執行檔案處理，同時仍使用區段快取；`--force` 會清除檔案追蹤並略過區段快取讀取以進行 API 翻譯。當每個已設定的模型在 markdown 區段上都無法通過 AST 驗證時，`translate-docs` 可以逐步分割區段並重試較小的部分（`docs[].segmentSplitting.qualityRetrySplit`，預設啟用）。請參閱 [入門](GETTING_STARTED.zh-Hant.md#cache-behaviour-and-translate-docs-flags) 以取得完整的旗標表格。

**批次提示格式:** `translate-docs --prompt-format` 僅為 `LlmClient.translateDocumentBatch` 選擇 XML（`<seg>` / `<t>`）或 JSON 陣列/物件形狀；提取、佔位符和驗證保持不變。請參閱 [批次提示格式](GETTING_STARTED.zh-Hant.md#batch-prompt-format)。

<a id="output-path-resolution"></a>
### 輸出路徑解析

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` 將相對於來源的路徑對應至輸出路徑：

- `nested` 風格（預設）：markdown 的 `{outputDir}/{locale}/{relPath}`。
- `doc-system` 風格：在 `docsRoot` 下，輸出使用 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`；`docsRoot` 以外的路徑會回復為巢狀佈局。別名：`docusaurus`（預設 `localeSubpath` = Docusaurus 外掛程式路徑）、`astro-starlight`（預設空 `localeSubpath`）。
- `flat` 風格：`{outputDir}/{stem}.{locale}{extension}`。當 `flatPreserveRelativeDir` 為 `true` 時，來源子目錄會保留在 `outputDir` 下。
- **自訂** `pathTemplate`：任何使用 `{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` 的 markdown 佈局。
- **自訂** `jsonPathTemplate`：為 JSON 標籤檔案提供獨立的自訂佈局，使用相同的佔位符。
- `linkRewriteDocsRoot` 協助平面連結重寫器在翻譯輸出位於預設專案根目錄以外的位置時計算正確的前置詞。

<a id="flat-link-rewriting"></a>
### 平面連結重寫

當 `docsOutput.style === "flat"` 時，翻譯後的 Markdown 檔案會與來源檔案一同放置，並加上地區ياً稱後綴。頁面之間的相對連結會被重寫，以便 `[Guide](../../docs/guide.md)` 在 `readme.de.md` 中指向 `guide.de.md`。由 `rewriteRelativeLinks` 控制（對於沒有自訂 `pathTemplate` 的平面樣式會自動啟用）。同一個處理程序會在 `postProcessing.regexAdjustments` 執行前，為非 Markdown 資產的 URL 加上每個檔案的深度前綴 — 請參閱 [地區ياً稱資產指南](LOCALE-ASSETS-GUIDE.zh-Hant.md#the-flat-link-rewriter-and-two-step-flow)。

---

<a id="workflow-3---nested-json-internals"></a>
## 工作流程 3 - 巢狀 JSON 內部結構

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

- `NestedJsonExtractor`（`src/extractors/nested-json-extractor.ts`）會遍歷任意巢狀 JSON，並為每個可翻譯的字串葉節點發出一個區段。`keyPolicy.mode`（`allowlist`、`denylist` 或 `both`）會使用 minimatch 根據點符號過濾路徑（像 `slug` 這樣的裸名稱會比對最終的鍵段）。
- 快取檔案追蹤使用 `json-block:{blockIndex}:{projectRelPath}` 在 `file_tracking` 中（與文件和 SVG 相同的 `cacheDir`）。
- **不適用於** Docusaurus `write-translations` 目錄（`{ message, description }` 形狀）— 那些使用工作流程 2（`docs[].docusaurusCatalogDir` + `JsonExtractor` 在 `translate-docs` 內部）。
- **不適用於** `t()` UI 字串 — 工作流程 1（`strings.json` + 平面套件）。
- CLI：`translate-json`；協調在 `src/cli/translate-json-run.ts`。初始化範本：`ui-json-bundles`。

---

<a id="shared-infrastructure"></a>
## 共用基礎結構

<a id="openrouterclient"></a>
### `LlmClient`

基於 Vercel AI SDK（`ai` + `@ai-sdk/openai-compatible`）建置的提供者無關的聊天用戶端。它會從 `provider` / `providers` 解析作用中的提供者，為該提供者的 `baseUrl` + API 金鑰建置一個 OpenAI 相容的用戶端（`createOpenAICompatible`），並透過 `generateText` 路由所有呼叫。`OpenRouterClient` 保留為已淘汰的別名。主要行為：

- **模型備用**：依序嘗試解析清單中的每個模型；在要求或剖析失敗時進行備用。使用者介面翻譯會先解析 `ui.preferredModel`（如果存在），然後再解析提供者的 `translationModels`。
- **要求逾時**：使用中提供者的 `requestTimeoutMs`（預設 30 秒）會中止每個要求（透過 `AbortSignal.timeout`）。當命令列介面載入提供者的模型清單以進行 `GET /models`（任何提供者）以及選擇性的預先檢查篩選器（會捨棄未知的模型 ID；僅限 OpenRouter）時，相同的值也適用於 `check-models`。
- **OpenRouter 額外功能**（僅當 `openrouter` 啟用時）：透過 `provider` 要求欄位、`HTTP-Referer` / `X-Title` 標頭進行流量路由，以及從 `usage.cost` 讀取的確切美元成本。每個提供者都會報告代幣使用量；僅在提供者傳回確切成本時顯示。
- **偵錯流量記錄**：如果設定了 `debugTrafficFilePath`，則會將要求和回應的 JSON 附加到檔案中。

<a id="config-loading"></a>
### 設定載入

`loadI18nConfigFromFile(configPath, cwd)` 管道：

1. 讀取並解析 `ai-i18n-tools.config.json`（JSON）。
2. `mergeWithDefaults` — 與 `defaultI18nConfigPartial` 深度合併，並將任何 `docs[].sourceFiles` 項目合併到 `contentPaths` 中。
3. `expandTargetLocalesFileReferenceInRawInput` — 如果 `targetLocales` 是檔案路徑，則載入資訊清單並展開為地區代碼；設定 `uiLanguagesPath`。
4. `expandDocumentationTargetLocalesInRawInput` — 對每個 `docs[].targetLocales` 項目執行相同操作。
5. `parseI18nConfig` — Zod 驗證 + `validateI18nBusinessRules`。
6. `applyEnvOverrides` — 套用 `OPENROUTER_API_KEY`、`I18N_SOURCE_LOCALE` 等。
7. `augmentConfigWithUiLanguagesFile` — 附加資訊清單顯示名稱。

`init` 從 `initConfigTemplates` 寫入入門設定：`ui-markdown`（UI + 可選的應用程式 Markdown）、`ui-docusaurus`、`ui-starlight`、`ui-astro-website`（純 Astro UI；新增 `docs[]` 以進行 `.astro` 頁面翻譯）、`ui-json-bundles`（僅限 Workflow 3 `json[]`）。請參閱 [GETTING_STARTED — Initialise](GETTING_STARTED.zh-Hant.md#step-1-initialise)。

<a id="logger"></a>
### 記錄器

`Logger` 支援 `debug`、`info`、`warn`、`error` 層級，並帶有 ANSI 顏色輸出。詳細模式（`-v`）啟用 `debug`。當設定了 `logFilePath` 時，記錄行也會寫入該檔案。

---

<a id="runtime-helpers-api"></a>
## 執行階段輔助程式 API

這些是從 `'ai-i18n-tools/runtime'` 導出的，可在任何 JavaScript 環境（瀏覽器、Node.js、Deno、Edge）中使用。它們**不會**從 `i18next` 或 `react-i18next` 導入。

<a id="rtl-helpers"></a>
### RTL 輔助程式

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

將 `setupKeyAsDefaultT` 作為常用的應用程式進入點（鍵修剪 + plural `wrapT` + 可選的 `translate-ui` `{sourceLocale}.json`）。單獨呼叫 `wrapI18nWithKeyTrim` 是應用程式連接的**已棄用**。

使用 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` 建置 `localeLoaders`，以便在 `generate-ui-languages` 後，鍵能與 `targetLocales` 保持一致。請參閱 `docs/GETTING_STARTED.md`（執行階段連接）、`examples/nextjs-app/`、`examples/console-app/` 和 `examples/astro-website/`（無 i18next 的自訂 `makeT`）。

<a id="display-helpers"></a>
### 顯示輔助程式

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### 字串輔助程式

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## 程式設計 API

所有公開的類型和類別都從套件根目錄導出。範例：從 Node.js 中執行 translate-UI 步驟，而不使用 CLI：

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

| 匯出 | 描述 |
|---|---|
| `loadI18nConfigFromFile` | 從 JSON 檔案載入、合併、驗證設定。 |
| `parseI18nConfig` | 驗證原始設定物件。 |
| `TranslationCache` | SQLite 快取 - 使用 `cacheDir` 路徑進行初始化。 |
| `UIStringExtractor` | 從 JS/TS 原始碼中提取 `t("…")` 字串。 |
| `collectHtmlI18nStrings` / `markHtmlContent` | 掃描 / 插入 HTML 中的 `data-i18n*` 標記（支援 `extract` 用於 `.html` 以及 `mark-html` 命令）。 |
| `MarkdownExtractor` | 從 markdown 中提取可翻譯的區段。 |
| `JsonExtractor` | 從 Docusaurus JSON 標籤檔案中提取（UI 目錄，非 MDX 主體）。 |
| `SvgExtractor` | 從 SVG 檔案中提取。 |
| `LlmClient` | 向作用中的 LLM 提供者發出翻譯請求（`OpenRouterClient` 是已淘汰的別名）。 |
| `PlaceholderHandler` | 保護/還原翻譯周圍的 markdown 語法（HTML 標籤、警告、錨點、MDX 註解/JSX/大括號、URL、內嵌程式碼、強調）。 |
| `protectMdx` / `restoreMdx` | 保護/還原 MDX 註解、JSX 標籤、大括號表達式和 JSX 字串屬性（由 `PlaceholderHandler` 呼叫；也匯出供直接使用）。 |
| `splitTranslatableIntoBatches` | 將區段分組為 LLM 大小的批次。 |
| `validateTranslation` | 翻譯後的結構檢查。 |
| `resolveDocumentationOutputPath` | 解析已翻譯文件的輸出檔案路徑。 |
| `Glossary` / `GlossaryMatcher` | 載入並套用翻譯詞彙表。 |
| `runTranslateUI` | 程式化翻譯 UI 的進入點。 |

---

<a id="extension-points"></a>
## 擴充點

<a id="custom-function-names-ui-extraction"></a>
### 自訂函式名稱（UI 提取）

透過設定新增非標準翻譯函式名稱：

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

（`ui.reactExtractor` 是 `ui.uiExtractor` 的完全支援別名。）

將 `.html` / `.htm` 加入 `extensions` 中，以便在 `extract` 期間掃描 HTML 標記屬性。`ui.uiExtractor.htmlI18nAttributes` 是選用的，預設為 `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]`；`data-i18n` 對應到元素的 `textContent`，而 `data-i18n-<attr>` 對應到該屬性的值（例如 `data-i18n-aria-label`）。

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

透過程式化匯入 `doc-translate.ts` 工具來傳遞至 doc-translate 流程。

<a id="custom-output-paths"></a>
### 自訂輸出路徑

對任何檔案配置使用 `docsOutput.pathTemplate`：

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
