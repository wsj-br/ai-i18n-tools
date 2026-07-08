<a id="architecture"></a>
# 架構

<a id="architecture-overview"></a>
## 架構總覽

程式碼庫分為四層。本節用於建立心智模型；需要檔案級別的詳細資訊時，請開啟[原始碼樹](#source-tree)。

<a id="how-a-sync-run-fits-together"></a>
### `sync` 執行如何協同運作

`sync`（以及個別的翻譯指令）依序執行已啟用的功能：

| 步驟 | 指令 | 功能 |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | 掃描 UI 原始碼 → 更新 `strings.json` → 填寫平面語言環境 JSON (`de.json`，…) |
| 2 | `translate-svg` *(選用)* | 翻譯 `config.svg` 下的 SVG 文字 |
| 3 | `translate-docs` | 翻譯 Markdown、MDX、`.astro` 頁面和 Docusaurus JSON 目錄 |
| 4 | `translate-json` *(選用)* | 翻譯 `json[]` 下的巢狀 JSON 葉節點 |

每個管線都遵循相同的核心迴圈：**提取區段 → 保護語法 → 批次處理 → 快取查詢或 LLM 呼叫 → 寫入輸出**。中間的共用服務 — 設定、預留位置、快取、詞彙表、`LlmClient` — 在[共用基礎設施](#shared-infrastructure)下描述。

<a id="module-map"></a>
### 模組對應

| 層 | 資料夾 | 角色 |
| --- | --- | --- |
| **入口** | `src/cli/` | CLI 指令：`init`、`extract`、`mark-html`、`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`、`status`、`dashboard`，… |
| **管線** | `src/extractors/` | 從 JS/TS、HTML 標記、Markdown、JSON、SVG、`.astro` 提取區段 |
| | `src/processors/` | 預留位置保護、批次處理、驗證、連結重寫 |
| **共用** | `src/core/` | 設定、類型、SQLite 快取、提示、輸出路徑、語言環境工具 |
| | `src/api/` | `LlmClient` — 與供應商無關的聊天用戶端 (Vercel AI SDK)，具有模型備援 |
| | `src/glossary/` | 詞彙表載入和提示的術語提示 |
| | `src/utils/` | 記錄器、雜湊、忽略解析器、顯示寬度表格、`.env` 載入器 |
| **您的應用程式執行階段** | `src/runtime/` | i18next 輔助程式和顯示工具 — 匯出為 `'ai-i18n-tools/runtime'` ([執行階段輔助程式](/guide/runtime-helpers)) |
| **工具 UI** *(內部測試)* | `src/i18n/`、`src/dashboard-app/`、`src/server/` | 本地化此套件自己的 CLI 和翻譯儀表板 — 與您的專案內容分開 ([自我本地化](#self-localization-tool-ui)) |

所有用於程式化用途的內容都從 `src/index.ts` 重新匯出 ([程式化 API](/reference/programmatic-api))。

<a id="pipeline-summaries"></a>
### 管線摘要

| 管道 | 區段 | 輸入 → 輸出 |
| --- | --- | --- |
| UI 字串 | [UI 字串內部](#ui-strings-internals) | 原始檔案 → `strings.json` → 平面 `{locale}.json` |
| 文件 | [文件內部](#documents-internals) | Markdown / MDX / `.astro` / Docusaurus JSON → `docs[].outputDir` 下的每個地區設定檔案 |
| JSON 捆綁包 | [JSON 內部](#json-internals) | `json[]` 下的巢狀 JSON → 每個地區設定的 JSON 檔案 |
| SVG | [文件內部 — 擷取器](#extractors) | `config.svg` 下的 SVG 檔案 → 翻譯的 SVG 副本 |

---

<a id="ui-strings-internals"></a>
## UI 字串內部結構

| 步驟 | 元件 | 結果 |
| --- | --- | --- |
| 1 | 原始檔案 (JS/TS；選用 `.astro` / `.html`) | 磁碟上的檔案 |
| 2 | `UIStringExtractor` (i18next-scanner；透過 `ui-string-babel.ts` 的 `.astro`) | 以 MD5 雜湊為鍵的區段 |
| 3 | `strings.json` | 主要目錄：`{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | 原始字串的 JSON 陣列 → 翻譯 (+ 每批次的模型 ID) |
| 5 | `de.json`、`pt-BR.json`、… | 平面對應：原始字串 → 翻譯 (無模型中繼資料) |

<a id="uistringextractor"></a>
### `UIStringExtractor`

使用 `i18next-scanner` 的 `Parser.parseFuncFromString` 來尋找 JS/TS 檔案中的 `t("literal")` 和 `i18n.t("literal")` 呼叫。對於 `.astro` 來源（當列於 `ui.uiExtractor.extensions` 中時），`ui-string-babel.ts` 會使用 `@babel/parser` 解析 frontmatter 和 template 中的 `{expression}` 區塊，並套用相同的 `funcNames` 規則。函式名稱和檔案副檔名可透過 `ui.uiExtractor` 進行設定（`ui.reactExtractor` 是支援的別名）。`extract` **也會將非掃描器的輸入合併至同一個目錄中：** 當啟用 `includePackageDescription` 時（預設值），會納入專案的 `package.json` `description`；當 `includeUiLanguageEnglishNames` 為 `true` 且設定 `uiLanguagesPath` 時，則會納入來自 `ui-languages.json` 的每一個 `englishName`（原始碼中已找到的字串具有較高優先順序）。區段雜湊值為修剪後原始字串的 **MD5 前 8 個十六進位字元** — 這些將成為 `strings.json` 中的鍵值。

對於 `.html` / `.htm` 來源（當列於 `ui.uiExtractor.extensions` 時），`extract` 會改為透過 `html-i18n-marks.ts` 來路由檔案，該檔案會掃描 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 標記屬性（可透過 `ui.uiExtractor.htmlI18nAttributes` 設定）。純標記會從元素的自身 `textContent` / `title` / `placeholder` 獲取來源文字；有值的標記（`data-i18n="Key"`）則使用該值。相同的模組也支援 `mark-html` 命令，該命令會自動插入純標記。HTML 檔案永遠不會到達 Babel / i18next-scanner 的處理階段。

純 Astro SSG 網站可以跳過 i18next：在建置時載入平面 `{locale}.json`，並透過原始文字鍵解析 `t('English')` (請參閱 `examples/astro-website/src/i18n/t.ts` 和 [UI 字串 — Astro 網站](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight))。

純 HTML 應用程式遵循相同的目錄模型，但使用標記屬性而非 `t()` 呼叫 — 請參閱[標記 HTML 以進行翻譯](/guide/ui-strings/plain-html#marking-html-for-translation)。

<a id="stringsjson"></a>
### `strings.json`

主目錄的結構如下：

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

`LlmClient.translateUIBatch` 會依序嘗試每個模型，並在發生解析或網路錯誤時回退。CLI 會根據 `localeModels`、選用的 `uiModels` 和 `translationModels` 為每個目標語言環境建立該清單（請參閱 [提供者和模型](/guide/providers-and-models#model-fallback-chain)）。

---

<a id="documents-internals"></a>
## 文件內部結構

| 步驟 | 元件 | 結果 |
| --- | --- | --- |
| 1 | Markdown / MDX / JSON / `.astro` 檔案 (`translate-docs`) | 原始檔案 |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` — 帶有雜湊 + 內容的類型化區段 |
| 3 | `PlaceholderHandler` | 受保護的文字 — HTML、提示、錨點、MDX、URL、行內程式碼、以標記遮罩的強調 |
| 4 | `splitTranslatableIntoBatches` | `batches[]` — 按計數 + 字元限制分組 |
| 5 | `TranslationCache` 查詢 | 快取命中 → 跳過；未命中 → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | 最終文字 — 預留位置已還原 |
| 7 | `resolveDocumentationOutputPath` | 輸出檔案 — Docusaurus 版面配置或平面版面配置 |

<a id="extractors"></a>
### 提取器

所有提取器都會擴充 `BaseExtractor` 並實作 `extract(content, filepath): Segment[]`。

- `MarkdownExtractor` - 將 markdown 分割成類型化區段：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。YAML 前置內容被歸類為 **不可翻譯** (`slug`、`id` 和其他路由鍵保持穩定)。頂層 `export ...` 區塊 (例如 React 元件定義) 與現有的 `import ...` 處理一起被歸類為不可翻譯的 `other` 區段。以大寫 JSX 標籤開頭的多行區塊 (例如 `<Tabs>` 區塊) 被歸類為可翻譯的段落。不可翻譯的區段 (程式碼區塊、原始 HTML) 會逐字保留。
- `AstroTemplateExtractor` - 用於 `.astro` 行銷頁面 (透過 `doc-translate.ts` 中的 `translateAstroFile` 的 `translate-docs`) 的解析和替換。擷取使用者可見的 HTML 文字節點和可翻譯屬性 (`alt`、`title`、`aria-label`、`placeholder`)，以及當使用者可見時，範本 `{expression}` 區塊內的字串常值。跳過前置內容 TypeScript、`<script>`、`<style>`、受保護的屬性/鍵值以及 `t('…')` 內的常值。當輸出路徑更深時 (例如 `src/pages/de/index.astro`)，重新組裝會調整相對匯入。請參閱[Astro 網站頁面](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)。
- `JsonExtractor` - 從 Docusaurus JSON 標籤檔案 (Docusaurus UI 目錄，而非 MDX 主體) 中擷取字串值。
- `SvgExtractor` - 從 SVG 中擷取 `<text>`、`<title>` 和 `<desc>` 內容 (由 `translate-svg` 用於 `config.svg` 下的檔案，而非由 `translate-docs` 使用)。
- `html-i18n-marks.ts` - 一個專注的 HTML 標記掃描器，由 `extract` 用於 `.html` / `.htm` 來源，並由 `mark-html` 命令使用。`collectHtmlI18nStrings` / `collectHtmlI18nLocations` 讀取 `data-i18n*` 標記屬性（純標記 → 元素 `textContent` / `title` / `placeholder`；有值標記 → 該值），而 `markHtmlContent` 會將純標記插入到葉面文字 / 標題 / 預留位置元素中（結果相同，尊重 `data-i18n-ignore`，並略過類似程式碼和混合內容的元素）。共用的 `normalizeI18nText` 輔助工具可確保建置時的索引鍵與瀏覽器執行階段的索引鍵相同。

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro 混合網站 (UI + 頁面 HTML)

純 Astro 應用程式通常在一個設定中同時啟用 **UI 字串**和文件（參考：`examples/astro-website/`）：

| 層 | 機制 | 輸出 |
| --- | --- | --- |
| 範本 HTML | `AstroTemplateExtractor` + `translate-docs` | `docs[].outputDir` 下的每個地區設定 `.astro` |
| 前導資訊 / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | 扁平化 `public/locales/{locale}.json` (以英文來源作為金鑰) |

`sync` 命令會依序執行已啟用的步驟：**提取**，然後是 **翻譯 UI**（當 `features.translateUIStrings` 時）→ 可選的 **翻譯 SVG** → **翻譯文件** → 可選的 **翻譯 JSON**（除非使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳過）。初始化模板 `ui-astro-website` 僅搭建 UI 字串；新增 `docs[]` 和 `features.translateDocs` 以用於頁面 HTML。

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### 標題錨點插入 (`write-heading-ids` CLI)

`write-heading-ids` 命令是一個 **本機、非 LLM** 的文件 Markdown 預處理器。實作方式：`src/cli/write-heading-ids.ts` 負責協調檔案發現；`src/markdown/write-heading-ids-core.ts` 解析行內容並插入錨點。

它需要一個有效的設定，其中**至少有一個`docs[]`區塊**。對於每個區塊，它會收集`.md` / `.mdx`檔案到`contentPaths`下，應用專案的`.translate-ignore`規則（與文件翻譯概念相同），並可選擇使用`--path` / `--file`限制到子樹。每個檔案都透過`applyHeadingAnchorsToMarkdown`進行轉換：對於圍欄程式碼區塊外的每個**扁平ATX標題**（`# …`到`###### …`），如果缺少或過時，則在其上方插入一個空HTML行`<a id="slug"></a>`。Slug演算法與常見生態系統匹配 — `github`（預設）、`bitbucket`、`gitlab`、`pymdown`（可選的Unicode正規化/百分比編碼標誌）、`azure-devops` — 因此錨點ID與現有工具（doctoc、PyMdown等）保持一致。`--dry-run`會報告預期的編輯，但不會寫入。

此命令**不會**在 `translate-docs` 或 `sync` 中執行；當您希望在翻譯或發佈前，原始檔案中有穩定的片段 ID 時，請明確執行此命令。

<a id="placeholder-protection"></a>
### 佔位符保護

在翻譯之前，敏感語法會被替換為不透明的 token，以防止 LLM 損壞，按此順序套用（還原是反向的）：

1. **HTML標籤和註解**（`<strong>`、`<!-- ... -->`等）- 來自已知允許列表的小寫HTML標籤會被替換為```{{HTM_N}}```標記。大寫的JSX標籤（`<Highlight>`、`<Tabs>`、`</Tab>`）由MDX層（步驟4）單獨處理。
2. **提示標記**（`:::note`、`:::`）- 只有開頭行的指令前綴會被替換為```{{ADM_OPEN_N}}```；任何同行的標題都會留給模型翻譯。以確切的原始文字還原。
3. **文件錨點**（HTML `<a id="…">`、Docusaurus標題`{#…}`）- 逐字保留。
4. **僅限MDX的建構**（`src/processors/mdx-placeholders.ts`）：
   - **MDX 註解** (`{/* … */}`，包括 Docusaurus 標題 ID 格式 `{/* #my-id */}`) 已替換為 ```{{MDX_N}}```。
   - **大寫 JSX 標籤** (`<Highlight>`、`<Tabs>`、`<TabItem>`、`<TOCInline />`、`</Highlight>`) - 保留為 ```{{MDX_N}}```，其中可翻譯的字串屬性 (`label`、`tooltip`、`aria-label`) 已重寫為標籤內的 ```{{JXA_N}}```，除非屬性名稱出現在 `docs[].protectAttributes` 中；`label:` 在 `<Tabs values={[ { label: '…' } ]}>` 物件文字中 (可透過 `docs[].protectKeys` 跳過) 和 `<TabItem value="…">` (當沒有 `label` 屬性時，跳過小寫的 slug 類值) 也會被提取。作為 `||JXA_N: …||` 行附加到區段，由 `restoreMdx` 合併回來。
   - **MDX 大括號表達式** (`{frontMatter.title}`，<code v-pre>style={{…}}</code>) - 深度感知匹配，替換為 ```{{MDX_N}}```。
5. **Markdown URL** (`](url)`、`src="…"`) - 翻譯後從映射中還原。
6. **行內程式碼跨距**（`` `code` ``）和 **粗體包圍的行內程式碼**（`**`code`**`）- 保留。
7. **Markdown 強調**（可選，對 CJK/RTL 地區自動啟用）- 強調分隔符已遮罩。

Astro 模板和 MDX JSX 的共享屬性/鍵保護在 `src/processors/expression-attribute-protection.ts` 中實現，並由 `docs[].protectAttributes` 和 `docs[].protectKeys` 按區塊驅動（請參閱 [protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys)）。

<a id="cache-translationcache"></a>
### 快取（`TranslationCache`）

SQLite 資料庫（透過 `node:sqlite`）儲存列，其金鑰為 `(source_hash, locale)`，包含 `translated_text`、`model`、`filepath`、`last_hit_at` 和相關欄位。雜湊是正規化內容（空白字元折疊）的前 16 個十六進位字元的 SHA-256。

在每次執行時，會透過雜湊 × 語言環境來查詢區段。只有快取未命中才會傳送至 LLM。翻譯後，`last_hit_at` 會針對目前翻譯範圍中未命中的區段列重設。文件翻譯期間成功的快取命中會清除該區段的過時 `translation_failures` 列。`cleanup` 會先執行 `sync --force-update`，然後移除過時的區段列（空 `last_hit_at` / 空檔案路徑），在磁碟上找不到解析的來源路徑時修剪 `file_tracking` 鍵（`doc-block:…`、`json-block:…`、`svg-files:…` 等），移除其中繼資料檔案路徑指向遺失檔案的翻譯列，修剪孤立的 `translation_failures` 列，並修剪其解析的來源路徑在磁碟上遺失的孤立 `markdown_source_issues` 列；除非傳遞 `--backup <path>`，否則它不會備份 `cache.db`，這會先將備份寫入該路徑。

`translate-docs` 命令還使用**檔案追蹤**，因此未更改且已存在最新輸出的來源可以完全跳過工作。`--force-update` 重新執行檔案處理，同時仍使用區段快取；`--force` 清除檔案追蹤並繞過 API 翻譯的區段快取讀取。當每個配置的模型在 markdown 區段上 AST 驗證失敗時，`translate-docs` 可以逐步分割區段並重試較小的部分（`docs[].segmentSplitting.qualityRetrySplit`，預設開啟）。有關完整的標誌表，請參閱 [文件 — 快取行為和標誌](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags)。

**批次提示格式：** `translate-docs --prompt-format` 僅為 `LlmClient.translateDocumentBatch` 選擇 XML (`<seg>` / `<t>`) 或 JSON 陣列/物件形狀；提取、佔位符和驗證保持不變。請參閱 [批次提示格式](/guide/documents/cli-options#batch-prompt-format)。

<a id="output-path-resolution"></a>
### 輸出路徑解析

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` 將相對於來源的路徑對應至輸出路徑：

- `nested` 樣式（預設）：用於 Markdown 的 `{outputDir}/{locale}/{relPath}`。
- `doc-system` 樣式：在 `docsRoot` 下，輸出使用 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`；`docsRoot` 以外的路徑會回溯到巢狀佈局。別名：`docusaurus`（預設 `localeSubpath` = Docusaurus 外掛程式路徑）、`astro-starlight`（預設為空 `localeSubpath`）、`vitepress`（與 `doc-system` 相同，但 `localeSubpath` 為空；保留 BCP-47 資料夾大小寫）。
- `flat` 樣式：`{outputDir}/{stem}.{locale}{extension}`。當 `flatPreserveRelativeDir` 為 `true` 時，來源子目錄會保留在 `outputDir` 下。
- **自訂** `pathTemplate`：任何使用 `{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` 的 Markdown 佈局。
- **自訂** `jsonPathTemplate`：為 JSON 標籤檔案提供獨立的自訂佈局，使用相同的佔位符。
- `linkRewriteDocsRoot` 協助平面連結重寫器在翻譯輸出位於預設專案根目錄以外的位置時計算正確的前置詞。

<a id="flat-link-rewriting"></a>
### 平面連結重寫

當 `docsOutput.style === "flat"` 時，翻譯後的 Markdown 檔案會與來源檔案一起放置，並帶有地區設定後綴。頁面之間的相對連結會被重寫，以便 `[Guide](./guide.md)` 在 `readme.de.md` 中指向 `guide.de.md`。由 `rewriteRelativeLinks` 控制（對於沒有自訂 `pathTemplate` 的平面樣式會自動啟用）。在 `postProcessing.regexAdjustments` 執行之前，相同的傳遞會為非 Markdown 資產 URL 預置每個檔案的深度前綴 — 請參閱 [平面連結重寫器](/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow)。

---

<a id="json-internals"></a>
## JSON 內部結構

| 步驟 | 元件 | 結果 |
| --- | --- | --- |
| 1 | `json[].contentPaths` | 檔案已解析（檔案、目錄或 glob） |
| 2 | `NestedJsonExtractor` | 字串葉子由 `keyPolicy` 選取（點路徑 + minimatch） |
| 3 | `PlaceholderHandler` + 批次 + `TranslationCache` | 快取命中 → 跳過；未命中 → `LlmClient.translateDocumentBatch` (共享 SQLite) |
| 4 | `NestedJsonExtractor.reassemble` | 透過 `expandJsonBlockOutputPath(outputPathTemplate)` 輸出檔案 |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) 遍歷任意巢狀 JSON，並為每個可翻譯的字串葉節點發出一個區段。`keyPolicy.mode` (`allowlist`、`denylist` 或 `both`) 使用點符號上的 minimatch 過濾路徑（像 `slug` 這樣的裸名稱匹配最終的鍵區段）。
- 快取檔案追蹤使用 `json-block:{blockIndex}:{projectRelPath}` 在 `file_tracking` 中（與文件和 SVG 相同的 `cacheDir`）。
- **不**適用於 Docusaurus `write-translations` 目錄 (`{ message, description }` 形狀) — 這些使用文件 (`docs[].docusaurusCatalogDir` + `JsonExtractor` 在 `translate-docs` 內部)。
- **不**適用於 `t()` UI 字串 — UI 字串 (`strings.json` + 扁平套件)。
- CLI：`translate-json`；協調在 `src/cli/translate-json-run.ts`。初始化範本：`ui-json-bundles`。

---

<a id="shared-infrastructure"></a>
## 共用基礎結構

<a id="llmclient"></a>
### `LlmClient`

基於 Vercel AI SDK（`ai` + `@ai-sdk/openai-compatible`）建置的提供者無關的聊天用戶端。它會從 `provider` / `providers` 解析作用中的提供者，為該提供者的 `baseUrl` + API 金鑰建置一個 OpenAI 相容的用戶端（`createOpenAICompatible`），並透過 `generateText` 路由所有呼叫。`OpenRouterClient` 保留為已淘汰的別名。主要行為：

- **模型備援**：依順序嘗試已解析清單中的每個模型；在請求或解析失敗時進行備援。每個目標地區設定都有自己已解析的鏈：設定時優先使用 `localeModels(locale)`，然後是 `uiModels`（僅限 UI 管線），接著是 `translationModels`。文件、JSON 與 SVG 翻譯會使用非 UI 鏈為每個地區設定建立客戶端。`bench-models` 指令則相反，它會為每個已設定的 ID 建立一個單一模型客戶端（`translationModels`、`uiModels` 與 `localeModels` 的聯集；`translationModels: [id]`，無備援），以便獨立計時與計價每個模型。
- **請求逾時**：當前提供者的 `requestTimeoutMs`（預設 30 秒）會透過 `AbortSignal.timeout` 中止每個請求。當 CLI 載入提供者的模型清單以供 `check-models`（任何提供者）使用時，相同的值也適用於 `GET /models`。捨棄未知模型 ID 的選用預檢篩選器僅在當前提供者為 OpenRouter 時執行。
- **OpenRouter 額外功能**（僅在 `openrouter` 為當前狀態時）：透過 `provider` 請求欄位進行吞吐量路由，`HTTP-Referer` / `X-Title` 標頭，以及從 `usage.cost` 讀取的精確美元成本。每個提供者都會報告 Token 使用量；精確成本僅在提供者傳回時提供。
- **除錯流量日誌**：如果設定了 `debugTrafficFilePath`，會將請求與回應的 JSON 附加到檔案中。

<a id="config-loading"></a>
### 設定載入

`loadI18nConfigFromFile(configPath, cwd)` 管道：

1. 讀取並解析 `ai-i18n-tools.config.json`（JSON）。
2. `mergeWithDefaults` — 與 `defaultI18nConfigPartial` 深度合併，並將任何 `docs[].sourceFiles` 項目合併到 `contentPaths` 中。
3. `expandTargetLocalesFileReferenceInRawInput` — 如果 `targetLocales` 是檔案路徑，則載入資訊清單並展開為地區代碼；設定 `uiLanguagesPath`。
4. `expandDocumentationTargetLocalesInRawInput` — 對每個 `docs[].targetLocales` 項目執行相同操作。
5. `expandJsonTargetLocalesInRawInput` - 每個 `json[].targetLocales` 條目都相同。
6. `parseI18nConfig` - Zod 驗證 + `validateI18nBusinessRules`。
7. `applyProviderOverrideToRawInput` - 當 `-P` / `--provider` 在 CLI 上傳遞時。
8. `applyEnvOverrides` - 設定時應用 `OPENROUTER_BASE_URL`、`OLLAMA_BASE_URL`、`I18N_SOURCE_LOCALE` 和 `I18N_TARGET_LOCALES`（API 金鑰在 `LlmClient` 內部為每個提供者單獨解析）。
9. `augmentConfigWithUiLanguagesMaster` - 從捆綁的主目錄中附加清單顯示名稱。
10. `assertEffectiveLocalesInUiLanguagesMaster` - 在適用時根據主目錄驗證地區設定代碼。

`init` 從 `initConfigTemplates` 寫入入門設定：`ui-markdown`（UI + 可選應用程式 Markdown）、`ui-docusaurus`、`ui-starlight`、`ui-vitepress`（VitePress 文件 + 透過 `json[]` 的主題 JSON）、`ui-astro-website`（純 Astro UI；新增 `docs[]` 以進行 `.astro` 頁面翻譯）、`ui-json-bundles`（僅限 JSON `json[]`）。請參閱 [快速入門 — 初始化](/guide/quick-start#step-1-initialise)。

<a id="logger"></a>
### 記錄器

`Logger` 支援 `debug`、`info`、`warn`、`error` 層級，並帶有 ANSI 顏色輸出。詳細模式（`-v`）啟用 `debug`。當設定了 `logFilePath` 時，記錄行也會寫入該檔案。

<a id="self-localization-tool-ui"></a>
### 工具使用者介面自行本地化

此工具會將其自身的使用者介面（命令列說明、高流量記錄/摘要/錯誤訊息，以及翻譯儀表板）與您需要翻譯的內容分開進行本地化。

- **地區解析**（`resolveUiLocale` 在 `src/core/ui-locale.ts` 中）：從 `-L` / `--ui-lang` > `AI_I18N_LANG` > 設定 `uiLanguage` > 主機作業系統地區設定（`Intl.DateTimeFormat().resolvedOptions().locale`）中選擇 UI 地區設定。候選者會被正規化並與已發布的捆綁包集精確匹配或透過最接近的變體匹配（例如 `pt-PT` → `pt-BR`，`en-US` → `en-GB`），回退到原始地區設定（`en-GB`）。CLI 在建立說明之前解析一次（預解析 argv 掃描），並在設定載入後再次解析，以便 `uiLanguage` 適用（該旗標和環境變數仍然優先）。
- **執行時**（`src/i18n/index.ts`）：一個最小的 `t(source, vars)`，帶有 ```{{name}}``` 插值，透過英文原始字串作為鍵，對應 `src/i18n/locales/<code>.json` 中的扁平化每個地區設定捆綁包（在建置時複製到 `dist/i18n/locales`）。缺少鍵或捆綁包會返回原始文字。這與 UI 字串的鍵作為預設模型相同 — 沒有雜湊查找。
- **儀表板**：伺服器公開 `GET /api/ui-i18n`，返回已解析 UI 地區設定的 `{ locale, dir, bundle }`；前端設定 `<html lang>` / `dir` 並透過 `data-i18n*` 屬性本地化靜態標記。
- **內部測試**：捆綁包是透過對 `ai-i18n-self.config.json`（`pnpm i18n:self`）執行套件自己的提取 → `translate-ui` 管道生成的。目錄鍵來自 `t()` 在 `src/cli/` 和 `src/i18n/` 中的呼叫，以及儀表板在 `src/dashboard-app/index.html` 中的 `data-i18n*` 標記。

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
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

透過擴展從 `'ai-i18n-tools'` 匯出的公共提取器類別來註冊自訂提取器（例如子類別 `MarkdownExtractor`）。CLI 在內部連接內建提取器；不支援深度匯入 `doc-translate.ts`。

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

---

<a id="source-tree"></a>
## 原始碼樹

<details>
<summary>完整的 <code>src/</code> 版面配置（檔案級參考）</summary>

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
