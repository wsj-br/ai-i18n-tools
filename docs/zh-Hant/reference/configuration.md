<a id="configuration-reference"></a>
# 設定參考

<a id="sourcelocale"></a>
### `sourceLocale`

源语言的 BCP-47 代码（例如 `"en-GB"`、`"en"`、`"pt-BR"`）。不会为该区域设置生成翻译文件——键字符串本身就是源文本。

**必须匹配**从您的运行时 i18n 设置文件（`SOURCE_LOCALE` / `src/i18n.ts`）导出的 `src/i18n.js`。

<a id="targetlocales"></a>
### `targetLocales`

要翻译到的 BCP-47 区域设置代码数组（例如 `["de", "fr", "es", "pt-BR"]`）。

`targetLocales` 是 UI 翻译的主要区域设置列表，也是文档块的默认区域设置列表。使用 `generate-ui-languages` 从 `ui-languages.json` + `sourceLocale` 构建 `targetLocales` manifest。

<a id="uilanguage-optional"></a>
### `uiLanguage` (選用)

工具本身 UI 語言（CLI 說明、日誌/摘要和翻譯儀表板）的 BCP-47 代碼。它獨立於 `sourceLocale` / `targetLocales`，並被 `-L` / `--ui-lang` 旗標和 `AI_I18N_LANG` 環境變數覆寫。未知值會優雅地降級為來源語言環境 (`en-GB`) — 沒有嚴格的驗證。請參閱[工具 UI 語言](/reference/environment-variables#tool-ui-language)。

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath`（可选）

用于显示名称、区域设置过滤和语言列表后处理的 `ui-languages.json` manifest 的路径。如果省略，CLI 会在 `ui.flatOutputDir/ui-languages.json` 查找 manifest。

在以下情况下使用此选项：

- manifest 位于 `ui.flatOutputDir` 之外，您需要显式地将 CLI 指向它。
- 您希望 [语言切换器后处理](#language-switcher-languagelistblock)（`languageListBlock`）从 manifest 构建区域设置标签。
- `extract` 应将 manifest 中的 `englishName` 条目合并到 `strings.json` 中（需要 `ui.reactExtractor.includeUiLanguageEnglishNames: true`）。

<a id="concurrency-optional"></a>
### `concurrency`（可选）

同时翻译的最大**目标区域设置**（`translate-ui`、`translate-docs`、`translate-svg` 以及 `sync` 中的匹配步骤）。如果省略，CLI 会为 UI 翻译使用**4**，为文档翻译使用**3**（内置默认值）。可以通过 `-j` / `--concurrency` 为每次运行覆盖。

<a id="batchconcurrency-optional"></a>
### `batchConcurrency`（可选）

**translate-docs**、**translate-svg** 和 **translate-json**（以及 `sync` 內的匹配步驟）：每個檔案的最大平行 LLM **批次**請求數（每個批次可包含許多區段）。省略時預設為 **4**。`translate-ui` 會忽略。使用 `-b` / `--batch-concurrency` 覆寫。

<a id="fileconcurrency-optional"></a>
### `fileConcurrency`（選填）

在單一地區**內，於 `translate-docs` 和 `sync` 期間可同時處理的檔案數目**。當設定為大於 **1** 的值時，同一地區內的檔案會使用訊號量（semaphore）來控制記憶體使用量，並以平行方式處理。預設值為 **1**（循序處理），若省略則使用預設值。較高的值可顯著提高 I/O 繫結操作的輸送量，特別是當所有區段都已快取（無需 API 呼叫）時。

**範例：**

```json
{
  "fileConcurrency": 4
}
```

**使用案例：** 執行 `sync --force-update` 時，將此設定為 `2-4`，以達到 100% 快取命中率，從而減少總處理時間。此改善對於處理大量小型檔案時最為顯著。

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars`（選填）

**translate-docs**、**translate-svg** 和 **translate-json** 的區段批次處理：每個 API 請求的區段數和字元上限。預設值：**20** 個區段，**4096** 個字元（省略時）。

<a id="provider-and-providers"></a>
### `provider` 和 `providers`

`provider`（頂層，選填）從 `providers` 中選取作用中的提供者金鑰。當僅設定一個提供者時為選填；當設定多個提供者時為必要。

`providers`（頂層）將提供者金鑰對應至其區塊。內建金鑰（請參閱下方的預設表格）僅需要 `translationModels`；任何其他金鑰都定義了一個自訂的 OpenAI 相容端點，並需要 `baseUrl`（以及 `apiKeyEnv`，除非該端點不需要金鑰）。

每個 `providers.<name>` 區塊接受：

- `translationModels`
  模型 ID 的首選有序列表（純上游 ID，無 `provider/` 前綴；OpenRouter ID 保留其原生 `vendor/model` 形式）。第一個優先嘗試；後續條目在出錯時作為備用。這是每個管道的全局預設鏈，當沒有更具體的層級適用時。
- `uiModels` (可選)
  用於 `translate-ui`、複數生成（步驟 0 和階段 B）和 `proofread-ui` 的僅限 UI 的有序模型列表。在目標語言環境的任何匹配 `localeModels` 條目之後，`translationModels` 之前嘗試。
- `localeModels` (可選)
  **所有**翻譯管道的每個語言環境覆寫。`{ "locale": "<BCP-47>", "models": ["…"] }` 物件陣列。語言環境標籤不區分大小寫匹配（`pt-br` = `pt-BR`）。每個語言環境的列表僅針對該語言環境優先嘗試，然後是管道特定的層級（UI 為 `uiModels`）和 `translationModels`。在配置載入時拒絕重複的標準化語言環境鍵。
- `baseUrl`
  與 OpenAI 相容的基礎 URL。覆寫預設的基礎 URL；非預設提供者需要此項。
- `apiKeyEnv`
  儲存 API 金鑰的環境變數。覆寫預設的環境變數。
- `headers`
  每次向此提供者發送請求時傳送的額外 HTTP 標頭。
- `maxTokens`
  每個請求的最大完成權杖數。預設值：`8192`。
- `temperature`
  取樣溫度。預設值：`0.2`。
- `requestTimeoutMs`
  等待每個請求的最長時間（毫秒）。預設值：`30000`（30 秒）。

內建提供者預設值（金鑰 — 基本 URL — API 金鑰環境變數）：

| 提供者 | 基本 URL | API 金鑰環境變數 |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (無) |

仍然接受舊式的頂層 `openrouter` 區塊（包含 `baseUrl`、`translationModels`、`defaultModel`、`fallbackModel`、`maxTokens`、`temperature`、`requestTimeoutMs`），並在載入時自動遷移至 `providers.openrouter`（包含 `provider: "openrouter"`）；`defaultModel` / `fallbackModel` 會合併到 `translationModels` 中。

如需在一個設定中設定多個提供者並使用 `-P` 在它們之間切換的可執行範例，請參閱 [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/)（`openai`、`anthropic`、`nvidia` 和 `deepseek` 在同一文件中）。

**為何使用多個模型：** 不同的提供者和模型在成本和品質上有所差異，且在不同語言和地區的表現也不同。將 `translationModels` 設定為**有序的備用鏈**（而非單一模型），以便在請求失敗時，CLI 可以嘗試下一個模型。

將以下列表視為您可以擴展的**基準**：如果特定語言環境的翻譯品質不佳或不成功，請研究哪些模型能有效支援該語言或文字（參考線上資源或您的提供者文件），並將這些模型 ID 添加為進一步的替代方案。

此列表經過**測試，涵蓋了廣泛的地區**，適用於一個包含 36 個目標地區的大型文件專案；它是一個實用的預設值，但不能保證對每個地區都有良好的表現。

範例 `translationModels`（與 `npx ai-i18n-tools init` 預設值相同）：

<details>
<summary>預設翻譯模型備用列表</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
  // … add more fallback models as needed
]
```

</details>

<br />

在您的環境或 `.env` 檔案中設定活躍提供者的 API 金鑰環境變數（例如 `OPENROUTER_API_KEY`）。

在更改模型列表之前，請執行 `npx ai-i18n-tools check-models`。對於任何提供者，它會根據該提供者的即時模型列表 (`GET /models`) 驗證每個已配置的模型 ID (`translationModels`、`uiModels` 和所有 `localeModels` 條目)，報告缺失或超過 `expiration_date` 的 ID，列出有效模型，並在任何已配置 ID 無效時以非零值退出。當提供者返回定價 (例如 OpenRouter) 時，它還會顯示估計的輸入/輸出定價 (每 1M 權杖的美元價格)。

若要在實際翻譯工作上比較已設定的模型，請執行 `npx ai-i18n-tools bench-models`。它會透過獨立翻譯一個樣本（並行執行，受 `concurrency` 限制），對來自 `translationModels`、`uiModels` 與 `localeModels` 的每個唯一模型 ID 進行基準測試，並輸出每個模型的輸入/輸出權杖、實際耗時與美元成本，讓您在確定模型清單前能權衡速度與價格。

<a id="features"></a>
### `features`

| 欄位                | 管道 | 說明                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | 將 `t("…")` / `i18n.t("…")` 提取到 `strings.json` 中，然後翻譯條目並寫入每個地區設定的平面 JSON（提取自動執行；使用獨立的 `extract` 僅重新整理目錄）。 |
| `translateDocs`      | 2        | 翻譯 `.md` / `.mdx` / `.astro` 頁面；當設定了 `docs[].docusaurusCatalogDir` 時，Docusaurus 會提供 shell JSON。                                                         |
| `translateJson`      | 3        | `json[]`（`translate-json`）下的任意巢狀 JSON。                                                                                                           |
| `translateSVG`       | —        | 翻譯 `.svg` 檔案（需要頂層的 `svg` 區塊）。                                                                                                       |

**翻譯** SVG 檔案，當 `features.translateSVG` 為 true 且設定了頂層 `svg` 區塊時，使用 `translate-svg`。`sync` 命令會在兩者都設定時執行該步驟（除非設定了 `--no-svg`）。

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  掃描 `t("…")` 呼叫的目錄或全域模式（相對於目前工作目錄）。支援 `src/` 或 `["src/**/*.ts"]` 等模式。
- `stringsJson`  
  主目錄檔案的路徑。由 `extract` 更新。
- `flatOutputDir`  
  寫入每個語言環境 JSON 檔案的目錄（`de.json` 等）。
- `uiExtractor.funcNames`（或舊版 `reactExtractor.funcNames`）  
  要掃描的其他函數名稱（預設值：`["t", "i18n.t"]`）。
- `uiExtractor.extensions`（或舊版 `reactExtractor.extensions`）  
  要包含的檔案副檔名（預設值：`[".js", ".jsx", ".ts", ".tsx"]`）。為 Astro 前置內容和模板表達式新增 `.astro`。
- `uiExtractor.includePackageDescription`（或舊版 `reactExtractor.includePackageDescription`）  
  當 `true`（預設）時，`extract` 也會將 `package.json` `description` 作為 UI 字串包含在內（如果存在）。
- `uiExtractor.packageJsonPath`（或舊版 `reactExtractor.packageJsonPath`）  
  用於該可選描述提取的 `package.json` 檔案的自訂路徑。
- `uiExtractor.includeUiLanguageEnglishNames`（或舊版 `reactExtractor.includeUiLanguageEnglishNames`）

當 `true` (預設 `false`) 時，`extract` 也會將捆綁的 UI 語言主目錄（由 `sourceLocale` + `targetLocales` 建立）中的每個 `englishName` 添加到 `strings.json`，如果來源掃描中尚未存在（相同的雜湊鍵）。不讀取 `uiLanguagesPath`。

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite 快取目錄（所有 `docs` 區塊共用）。預設 `.translation-cache`。跨執行重複使用。如果您正在從自訂文件翻譯快取遷移，請封存或刪除它 — `cacheDir` 會建立自己的 SQLite 資料庫，並且與其他架構不相容。

<a id="best-practice-for-git-exclusions"></a>
#### git 排除的最佳實踐：

- 排除翻譯快取資料夾的內容（例如，使用 `.gitignore` 或 `.git/info/exclude`），以防止提交臨時快取偽影。
- 保留 `cache.db`（不要例行刪除它），因為保留 SQLite 快取可以防止重新翻譯未變更的區段。這在更新或修改使用 `ai-i18n-tools` 的軟體時，可以節省執行時間和 API 成本。
- 排除臨時檔案和日誌檔案，以避免提交備份和除錯相關檔案。

<br/>

**範例：**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

文件管線區塊陣列。`translate-docs` 和 `sync` 的文件階段會**依序處理每個**區塊。舊版金鑰在載入時仍可接受，並在設定檔可寫入時重新寫入；在新設定中請優先使用目前的名稱。

| 舊版金鑰 | 目前金鑰 / 行為 |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| 頂層 `openrouter` | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | 已移除（使用 `docs[].docusaurusCatalogDir` 或 `json[]`） |
| `features.extractUIStrings` | 已移除（`extract` 在 UI 翻譯之前執行） |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor`（別名仍可接受） |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

**內容來源**

- `description`
此區塊的可選人類可讀註記 (不適用於翻譯)。若已設定，則會加上前綴顯示於 `translate-docs` `🌐` 標題；也會顯示於 `status` 區段標題。
- `contentPaths`
要翻譯的 Markdown/MDX 頁面內文和 `.astro` 範本 (`translate-docs` 會掃描這些以尋找 `.md`、`.mdx` 和 `.astro`)。支援 **目錄路徑或 glob 模式** (例如 `"docs/**/*.md"`、`"guides/*.mdx"`、`"src/pages/index.astro"`)。這就是本地化文件內文的來源。
- `sourceFiles`
載入時合併到 `contentPaths` 的可選別名。
- `targetLocales`
此區塊的可選地區設定子集 (否則使用根目錄 `targetLocales`)。有效的地區設定是跨區塊的聯集。
- `docusaurusCatalogDir`
可選。此區塊的 Docusaurus JSON 標籤目錄來源目錄 (例如來自 `docusaurus write-translations` 的 `"i18n/en"`)。頁面內文一律來自 `contentPaths`；`docusaurusCatalogDir` 僅提供外殼/UI 的 JSON，而非 MDX。

**輸出佈局**

- `outputDir`
此區塊翻譯輸出的根目錄。
- `docsOutput.style`
`"nested"`（預設）、`"flat"`、`"doc-system"`，或別名 `"docusaurus"` / `"astro-starlight"` / `"vitepress"`。
- `docsOutput.localeSubpath`
`doc-system` 的 `{locale}/` 和 `{relativeToDocsRoot}` 之間的路徑區段（直接使用 `style: "doc-system"` 時為必填；使用別名時預設）。使用 `""` 作為 Starlight 風格的語言環境資料夾。
- `docsOutput.docsRoot`
Docusaurus 版面配置的來源文件根目錄（例如 `"docs"`）。省略時預設為 `"docs"`。
- `docsOutput.pathTemplate`
自訂 Markdown 輸出路徑。佔位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。
- `docsOutput.jsonPathTemplate`
標籤檔案的自訂 JSON 輸出路徑。支援與 `pathTemplate` 相同的佔位符。
- `docsOutput.localePathLowercase`
當 `true` 時，內建輸出佈局（`nested`、`flat`、`doc-system` 不含 `pathTemplate`）在路徑中使用小寫語言環境區段。預設 `false`；`astro-starlight` 和 `doc-system` 在設定載入時，若 `localeSubpath` 為空，則預設為 `true`。
- `docsOutput.flatPreserveRelativeDir`
當 `docsOutput.style = "flat"` 時，保留來源子目錄，以便具有相同基本名稱的檔案不會衝突。預設 `false`。
- `docsOutput.rewriteRelativeLinks`
翻譯後重寫相對連結（當啟用`docsOutput.style = "flat"`且沒有自訂`pathTemplate`時自動啟用）。
- `docsOutput.linkRewriteDocsRoot`
計算扁平連結重寫前綴時使用的儲存庫根目錄。通常將其保留為`"."`，除非您的翻譯文件位於不同的專案根目錄下。
- `docsOutput.rewriteVitepressLinks`
當`true`時，在翻譯後執行VitePress連結正規化器。當`docsOutput.style`為`"vitepress"`時，預設為啟用。與任何`doc-system`佈局一起使用，其中語言環境資料夾位於`docsRoot`下的英文旁邊。將README樣式的`docs/guide/…`路徑重寫為網站路由（`/guide/…`）和語言環境相關的`../guide/…`連結。對於指向VitePress樹外部儲存庫檔案的連結（`LICENSE`、`examples/`），請在英文原始碼中使用完整URL — 請參閱[VitePress整合 — README作為文件首頁](/guide/vitepress-integration#readme-as-homepage)。

**後處理**

- `docsOutput.postProcessing`
翻譯後的 **markdown 主體**的選用轉換（YAML 鍵和非散文前置內容值會保留）。在區段重新組裝和連結重寫（扁平或 VitePress）之後，以及在 `addFrontmatter` 之前執行。
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` 的有序列表。`search` 是一個正規表示式模式（純字串使用旗標 `g`，或 `/pattern/flags`）。`replace` 支援諸如 `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}` 等佔位符。
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — 在原始和翻譯的 markdown 中重新產生有界限的「以其他語言閱讀」連結行。當 `label: "local"` 時，需要 `uiLanguagesPath`（或位於 `ui.flatOutputDir/ui-languages.json` 的清單）來獲取內生名稱標籤。

**行為與中繼資料**

- `translateFrontmatterFields`
與 `docsOutput` 位於同一層級（每個 `docs[]` 區塊）。預設 `true`：翻譯 Starlight/Docusaurus 的使用者介面 YAML 散文（`title`、`description`、`sidebar.label`、`sidebar_label`、`keywords`、`hero.title`、`hero.tagline`、`hero.image.alt`、`hero.actions[].text`、`pagination_label`、`prev`/`next` 標籤）。設定 `false` 以保持整個前置內容區塊不變；傳遞字串陣列以限制為特定的點路徑。
- `segmentSplitting`
與 `docsOutput` 位於同一層級（每個 `docs[]` 區塊）。用於 `translate-docs` 提取的可選更細粒度區段：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`。當 `enabled` 為 `true` 時（當省略 `segmentSplitting` 時為預設值），會分割密集段落、GFM 管道表格（第一個區塊包含標頭、分隔符和第一個資料行）和長列表；子部分會以單個換行符重新連接（`tightJoinPrevious`）。設定 `"enabled": false` 以僅使用每個以空白行分隔的主體區塊作為一個區段。當 `qualityRetrySplit` 為 `true` 時（預設值），在所有模型都用盡後，未能通過 AST 驗證的 markdown 區段會逐步分割並從第一個模型重試；`maxQualityRetrySplitDepth`（預設 `3`）限制遞迴分割。
- `warnMarkdownSourceIssues`
當 `true` 時（省略時為預設值），每次 `translate-docs` 執行都會重新掃描 markdown 區段以查找危險分隔符/未閉合的行內程式碼，列印終端警告，並替換該檔案快取路徑的 `markdown_source_issues` 行。設定 `false` 以跳過此區塊的警告和 SQLite 更新。
- `addFrontmatter`
當 `true` 時（省略時為預設值），翻譯後的 markdown 檔案包含 YAML 鍵：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`，並且當至少一個區段具有模型中繼資料時，`translation_models`（來自活動提供者的模型 ID 排序列表）。設定為 `false` 以跳過。
- `emphasisPlaceholders`
每個 `docs[]` 區塊。當 `true` 時，在翻譯前將 markdown 強調分隔符遮罩為佔位符。對於 CJK 語言環境（`zh`、`ja`、`ko`）和 `rtlLocales` 中列出的語言環境，預設為 `true`；否則預設為 `false`。可透過 CLI `--emphasis-placeholders` / `--no-emphasis-placeholders` 覆寫。
- `rtlLocales`
BCP-47 代碼的可選陣列，被視為 RTL 以用於強調佔位符預設值（與內建 RTL 偵測合併）。

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
可選。額外的 JSX/HTML 屬性名稱，其 **引用的字串值**不得發送給翻譯器。與內建預設值合併（`class`、`id`、`style`、`src`、`href`、`type`、`data-*`、大多數 `aria-*` 等）。不區分大小寫。適用於：

- `.astro` 的解析替換提取（靜態 HTML 標籤和 `attr=` 後的字串文字，位於 `{expression}` 區塊內）。
  - Markdown/Astro 區段翻譯期間的 MDX 佔位符提取（`label`、`tooltip` 和大寫 JSX 標籤上的 `aria-label`，以及適用的 `TabItem` `value`）。

範例：`"protectAttributes": ["variant", "size"]` 在不同地區設定下保持 `variant="primary"` 在 `{items.map(...)}` 中不變。

您也可以列出正常翻譯的屬性（例如 `"title"` 或 `"aria-label"`），當您希望這些值從英文逐字複製時。

- `protectKeys`
可選。額外的 **物件屬性名稱**，其引用的字串值在模板 `{expression}` 區塊和 MDX 物件文字（例如 `label:` 在 `<Tabs values={[ … ]}>` 中）內不得翻譯。與內建預設值合併（`class`、`key`、`id`、`href`、`src` 等）。不區分大小寫。

範例：`"protectKeys": ["slug", "code"]` 跳過 `{ slug: 'getting-started', title: 'Getting started' }` → 當 `slug` 被保護時，只有 `title` 會被翻譯。

<br/>

**範例（`docsOutput.style = "flat"` — 螢幕截圖路徑 + 可選語言列表包裝器）：**

<details>
<summary>平面佈局後處理範例（螢幕截圖 + languageListBlock）</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

巢狀 JSON 翻譯管道的頂層陣列。僅在 `features.translateJson` 為 true 時使用（`translate-json` 或 `sync` 的 JSON 階段）。請參閱 [JSON](/guide/json)。

| 欄位 | 描述 |
|-------|-------------|
| `description` | CLI / `status` 的可選註釋（不翻譯）。 |
| `contentPaths` | 專案根目錄下的來源 `.json` 檔案、目錄或 glob 模式。 |
| `outputPathTemplate` | 每個目標地區設定必需的輸出路徑。佔位符：`{locale}`、`{LOCALE}`、`{llocale}`、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。 |
| `targetLocales` | 此區塊的可選子集；否則為根目錄的 `targetLocales`。 |
| `keyPolicy.mode` | `allowlist`、`denylist` 或 `both`。 |
| `keyPolicy.translateKeys` | 模式為 `allowlist` 或 `both` 時要包含的點路徑 / glob 模式。 |
| `keyPolicy.skipKeys` | 要排除的點路徑 / glob 模式（預設拒絕列表包含 `id`、`slug`、`href`、`url`、`key`、`code`）。 |

<a id="svg"></a>
### `svg`

SVG 檔案的頂層路徑和佈局。僅當 `features.translateSVG` 為 true 時（透過 `translate-svg` 或 `sync` 的 SVG 階段）執行翻譯。

| 欄位            | 說明                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | 一個或多個目錄 **或 glob 模式**（例如 `"images/*.svg"`、`"**/icons/*.svg"`）。模式相對於專案根目錄解析，並遞迴掃描以尋找 `.svg` 檔案。                                                                         |
| `outputDir`      | 已翻譯 SVG 輸出的根目錄。                                                                                                                                                                                                                          |
| `style`          | 當 `pathTemplate` 未設定時為 `"flat"` 或 `"nested"`。                                                                                                                                                                                                               |
| `pathTemplate`   | 自訂 SVG 輸出路徑。佔位符：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{relativeToSourceRoot}"</code>。 |
| `localePathLowercase` | 當 `true` 為 true 時，內建的 `flat` / `nested` SVG 佈局會使用小寫的地區設定區段。自訂 `pathTemplate` 值保持不變；請使用 `{llocale}` 來進行小寫區段。 |
| `forceLowercase` | 在重新組合 SVG 時將翻譯後的文字轉為小寫。對於依賴全小寫標籤的設計很有用。                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| 欄位          | 說明                                                                                                                                                                                                                                                              |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 指向 `strings.json` 的路徑 - 會從現有翻譯自動建構詞彙表。                                                                                                                                                                                          |
| `userGlossary` | 指向 CSV 檔案的路徑，其中包含 `Original language string`（或 `en`）、`locale`、`Translation` 等欄位 - 每行代表一個來源術語和目標地區設定（`locale` 可以是 `*` 以代表所有目標地區設定）。 |
| `autoAddUserEditedToGlossary` | 當 `true` 時，對 UI 字串的儀表板編輯可以自動附加到使用者詞彙表中。 |

**產生一個空的詞彙表 CSV：**

```bash
npx ai-i18n-tools glossary-generate
```
