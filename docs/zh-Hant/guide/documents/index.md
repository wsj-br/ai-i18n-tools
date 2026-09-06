<a id="documents"></a>
# 文件

主要為透過 `docs[]` 設定區塊管理的 **Markdown、MDX 和 `.astro` 文件**而設計。每個區塊的 `contentPaths` 欄位列出了要翻譯的檔案或資料夾。

在 [Docusaurus](/zh-Hant/guide/integrations/docusaurus) 網站上，也請將 `docusaurusCatalogDir` 設定為您的 `write-translations` 目錄資料夾（例如 `docs-site/i18n/en`）。接著 `translate-docs` 也會包含 shell JSON — 導導覽列、頁尾及主題字串。

在 [VitePress](/zh-Hant/guide/integrations/vitepress) 網站上，頁面主體使用相同的 `docs[]` 管線。導覽、側邊欄及頁尾標籤位於 `docsOutput.vitepressThemeCatalog` — `translate-docs` 會啟動英文目錄並與頁面一同翻譯，無需單獨的管線。

在 [Nextra](/zh-Hant/guide/integrations/nextra) 網站上，頁面主體使用與 `docsOutput.style: "nextra"` 相同的 `docs[]` 管線。`_meta.ts` 側邊欄標籤由 `translate-docs` 自動收集並翻譯；主題字典字串透過 `docs[].nextraDictionaryPath` 在相同管線中翻譯。

在 [Fumadocs](/zh-Hant/guide/integrations/fumadocs) 網站上，頁面主體使用 `docsOutput.style: "fumadocs"` 搭配 `fumadocsParser` `"dot"`（預設）或 `"dir"`。`meta.json` 側邊欄標籤會自動收集；UI 覆寫透過 `docsOutput.fumadocsUiCatalog` 翻譯。

在 [Astro Starlight](/zh-Hant/guide/integrations/astro#astro-starlight) 網站上，頁面主體使用 `docsOutput.style: "astro-starlight"`，並將 `docsRoot` 設定為您的 Starlight 內容根目錄（通常是 `src/content/docs/`）。`translate-docs` 會在英文檔案樹旁的 `src/content/docs/<locale>/` 下寫入本地化的 markdown/MDX。Starlight 內建了多種語系的內建 UI 字串 — 無需單獨的主題目錄管線；可選的 UI 覆寫可在 `src/content/i18n/en.json` 的 `docs[]` 區塊上使用 `jsonPathTemplate`。

對於嵌入在 Markdown 中的 PNG 和其他點陣圖影像，請參閱[影像與螢幕截圖](/zh-Hant/guide/images-and-screenshots/)。`translate-docs` 僅翻譯替代文字；它不複製點陣圖檔案。

若要在 README 或文件中加入選用的 **語言切換器** 區塊，請將 `docsOutput.style` 設定為 `"flat"` — 請參閱[語言切換器](/zh-Hant/guide/documents/language-switcher)。

[SVG](/zh-Hant/guide/svg-translation/) 檔案會在啟用 `features.translateSVG` 時透過 [`translate-svg`](/zh-Hant/reference/cli-commands/content#translate-svg) 翻譯 — 而非透過 `docs[]` / `contentPaths`。

與文件框架的殼層/主題字串無關的任意巢狀 UI JSON 套件應屬於 [JSON](/zh-Hant/guide/json) 管線，而非 `docs[]`。

為了在 UI 與文件之間保持**術語一致性**，請將 `glossary.uiGlossary` 設定為您的 `strings.json` 路徑 — 當段落中出現相符的術語時，`translate-docs` 會在 LLM 提示中重用現有的 UI 翻譯作為提示。選用的 `glossary.userGlossary` 可為產品術語新增 CSV 覆寫（與 `translate-ui` 和 `proofread-ui` 共用）。為配合窄欄位而使用的精簡 UI 標籤縮寫（例如 `Size` → `Tam`）仍可用於 UI 翻譯，但不會包含在文件詞彙表提示中。使用 `glossary-generate` 產生入門 CSV，在翻譯儀表板的 **詞彙表** 分頁中編輯列，或參閱[設定 — `glossary`](/zh-Hant/reference/configuration#glossary)與[詞彙表](/zh-Hant/guide/translation-dashboard/glossary)。

<a id="per-locale-model-overrides"></a>
### 每個地區模型覆蓋

`translate-docs` 及 `sync` 的文件步驟會**按目標語系**解析模型：若已設定則優先使用 `localeModels(locale)`，其次為供應商的全域 `translationModels` 鏈。當特定語言需要與預設後備清單不同的模型時可使用此功能 — 例如，當全域鏈難以處理葡萄牙文時，偏好為 `pt-BR` 文件使用 Gemini。請參閱[供應商與模型](/zh-Hant/guide/providers-and-models#model-fallback-chain)及[設定 - `localeModels`](/zh-Hant/reference/configuration#provider-and-providers)。

<a id="which-guide-to-read"></a>
## 閱讀哪份指南

| 您的設定 | 從此開始 |
| --- | --- |
| Docusaurus 網站 | `init -t ui-docusaurus`、`docsOutput.style = "docusaurus"` - [Docusaurus](/zh-Hant/guide/integrations/docusaurus) |
| VitePress 網站 | `init -t ui-vitepress` + `vitepressThemeCatalog` 用於主題 - [VitePress](/zh-Hant/guide/integrations/vitepress) |
| Nextra 網站 | `init -t ui-nextra` + `nextraDictionaryPath` 用於字典（側邊欄 `_meta.ts` 為自動） - [Nextra](/zh-Hant/guide/integrations/nextra) |
| Fumadocs 網站 | `init -t ui-fumadocs` + `fumadocsUiCatalog` 用於 UI（側邊欄 `meta.json` 為自動） - [Fumadocs](/zh-Hant/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/zh-Hant/guide/integrations/astro#astro-starlight) |
| 扁平文件（README、變更日誌等） | `docsOutput.style = "flat"` - [輸出佈局](/zh-Hant/guide/documents/output-layouts)、選用[語言切換器](/zh-Hant/guide/documents/language-switcher) |
| 翻譯檔案的存放位置 | [輸出佈局](/zh-Hant/guide/documents/output-layouts) |
| 跨頁面 `#anchor` 連結 | [錨點連結](/zh-Hant/guide/documents/anchor-links) |
| 連結和資產 URL 重寫 (`regexAdjustments`) | [連結重寫](/zh-Hant/guide/documents/link-rewriting) |
| 文件中的螢幕截圖 | [影像與螢幕截圖](/zh-Hant/guide/images-and-screenshots/) |
| 產品術語與 UI/文件一致性 | [設定 — `glossary`](/zh-Hant/reference/configuration#glossary)、[詞彙表](/zh-Hant/guide/translation-dashboard/glossary) |
| `translate-docs` 旗標和快取 | [CLI 選項](/zh-Hant/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## 步驟 1：初始化文件

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
```

適用於 Astro Starlight 文件網站：

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
```

對於 VitePress 文件網站：

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
```

為導覽/側邊欄/頁尾字串設定 `docsOutput.vitepressThemeCatalog` — 請參閱[VitePress 整合](/zh-Hant/guide/integrations/vitepress)。

對於 Nextra 文件網站：

```bash
ai-i18n-tools init -t ui-nextra [-P <provider>]
```

為主題字典字串設定 `docs[].nextraDictionaryPath` — 請參閱[Nextra 整合](/zh-Hant/guide/integrations/nextra)。側邊欄 `_meta.ts` 標籤會自動收集。

對於 Fumadocs 文件網站：

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
```

為 UI 覆寫設定 `docsOutput.fumadocsUiCatalog` — 請參閱[Fumadocs 整合](/zh-Hant/guide/integrations/fumadocs)。側邊欄 `meta.json` 標籤會自動收集。

適用於純 Astro 網站 UI（無 Starlight）：

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
```

該範本僅啟用 UI 提取。對於頁面 HTML 翻譯，還需設定 `features.translateDocs` 並新增一個 `docs[]` 區塊（請參閱 [Astro 網站頁面（解析與替換）](/zh-Hant/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)）。[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 設定顯示了兩個管道。

編輯產生的 `ai-i18n-tools.config.json`：

- `provider` 及 `providers` — `init` 會建立預設的供應商區塊（除非您傳入 `-P <provider>`，否則為 `openrouter`）；在執行 `translate-docs` 或 `sync` 之前，請至少設定一個供應商並設定其 API 金鑰（Ollama 無需金鑰）。請參閱[供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key)及[LLM 供應商與模型](/zh-Hant/guide/providers-and-models)。
- `sourceLocale` - 來源語言（必須與 `docusaurus.config.js` 中的 `defaultLocale` 相符）。
- `targetLocales` - BCP-47 語系代碼陣列（例如 `["de", "fr", "es"]`）。
- `cacheDir` - 所有管線共用的 SQLite 快取目錄（同時為 `--write-logs` 的預設日誌目錄）。
- `docs` - 文件區塊陣列。每個區塊包含可選的 `description`、`contentPaths`（字串或陣列；檔案、目錄或萬用字元模式）、`outputDir`、可選的 `docusaurusCatalogDir`、`docsOutput`、可選的 `segmentSplitting`、`translateFrontmatterFields`、`protectAttributes`、`protectKeys`、`targetLocales`、`addFrontmatter` 等。
- `docs[].description` - 給維護者的可選簡短備註。設定後，會顯示在 `translate-docs` 標題與 `status` 區塊標頭中。
- `docs[].contentPaths` - markdown/MDX/`.astro` 來源（以及 Docusaurus shell JSON 的可選 `docusaurusCatalogDir`）。
- `docs[].outputDir` - 該區塊的翻譯輸出根目錄。
- `docs[].docsOutput.style` - `"nested"`（預設）、`"flat"`、`"doc-system"`，或別名 `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"`（請參閱[輸出佈局](/zh-Hant/guide/documents/output-layouts)）。
- `glossary.uiGlossary` - `strings.json` 的路徑，讓文件片段能從您的 UI 目錄取得術語提示（請參閱[設定 — `glossary`](/zh-Hant/reference/configuration#glossary)）。
- `glossary.userGlossary` - 選用的 CSV，用於固定的產品術語翻譯；同時供 UI 管線使用，並可在[詞彙表](/zh-Hant/guide/translation-dashboard/glossary)儀表板分頁中編輯。

**主要與補充：** 專注於 `contentPaths` 以進行本地化頁面。當您也需要來自 `write-translations` 的 Docusaurus shell JSON 時，請設定 `docusaurusCatalogDir`。如果您只翻譯頁面，請省略 `docusaurusCatalogDir`。

<a id="step-2-translate-documents"></a>
## 步驟 2：翻譯文件

```bash
ai-i18n-tools translate-docs
```

這會將每個 `docs[]` 區塊的 `contentPaths` 中的所有檔案（以及在設定 `docusaurusCatalogDir` 時的 Docusaurus 目錄 JSON）翻譯為所有有效的文件語系。已翻譯的段落會從 SQLite 快取提供 - 只有新增或變更的段落才會傳送至 LLM。

翻譯單一地區設定：

```bash
ai-i18n-tools translate-docs --locale de
```

檢查需要翻譯的內容：

```bash
ai-i18n-tools status
```

有關旗標、快取行為和批次提示格式，請參閱[CLI 選項](/zh-Hant/guide/documents/cli-options)。

<a id="complex-markdown-and-failed-quality-checks"></a>
## 複雜的 Markdown 和失敗的品質檢查

`translate-docs` 會檢查每個翻譯片段是否保留了 Markdown 結構（包括從文件中解析出的強調標記），以及內部佔位符標記是否正確還原。在 `` `inline code` `` 周圍堆疊多個 `bold` 跨度、在粗體內嵌套反引號（例如範本字面值如 `` `fetch(\`/locales/${code}.json\`)` ``），或在長句中交織粗體與程式碼的段落非常脆弱：某些語言環境需要不同的語序，這可能會改變 `**` 和 `` ` `` 在翻譯後的對齊方式，並觸發如 `AST mismatch` 的 CLI 錯誤。

還原後，`translate-docs` 也會拒絕重複使用或丟棄 HTML 標籤佔位符的片段（這會導致還原後的標籤不再與來源映射匹配），或拒絕模型捏造了來源中不存在的殘留雙大括號權杖的片段（例如捏造的詞彙表風格權杖）。還原前的檢查要求具有相同的 `{{…}}` 權杖多重集，以及相同的帶編號權杖有序子序列（`{{HTM_N}}`、`{{URL_N}}`、…）；當各類型的計數仍然匹配時，強調標記（例如 `{{SE}}`）可以隨自然語序移動。這些失敗會使用與殘留官方內部權杖相同的模型後備路徑。

**如果您遇到此類驗證失敗，請優先簡化來源語言文字** - 分割段落、將範例移至圍欄程式碼區塊中，或使用較少層層堆疊的粗體/程式碼配對來描述相同概念 - 而非期望每個模型和語系都能完美重現密集的行內標記。

當所有設定的模型在同一段落上都因 `AST mismatch` 失敗時，`translate-docs` 可自動將該段落拆分為更小的部分（優先從清單中點拆分，然後是單個清單項目或較短的段落片段），從第一個模型開始重試每一部分，並在原始段落的快取鍵下重新合併結果。此功能預設啟用（`segmentSplitting.qualityRetrySplit`）；設定為 `false` 可在模型全部嘗試失敗後停止。執行摘要會在啟用此備援機制時報告 `Quality split retries`。

若要查看**哪些區段失敗**、失敗頻率以及儲存的**品質/錯誤訊息**，請使用翻譯儀表板的**失敗**分頁 ([翻譯儀表板 → 失敗](/zh-Hant/guide/translation-dashboard/failures#failures-document-translation))。
