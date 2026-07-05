<a id="documents"></a>
# 文件

主要為透過 `docs[]` 設定區塊管理的 **Markdown、MDX 和 `.astro` 文件**而設計。每個區塊的 `contentPaths` 欄位列出了要翻譯的檔案或資料夾。

在 Docusaurus 網站上，也將 `docusaurusCatalogDir` 設定為您的 `write-translations` 目錄資料夾（例如 `docs-site/i18n/en`）。然後 `translate-docs` 也會包含 shell JSON — 導覽列、頁腳和主題字串。

在 [VitePress](/guide/vitepress-integration) 網站上，頁面主體使用相同的 `docs[]` 管道。導覽、側邊欄和頁腳標籤位於單獨的 JSON 目錄中 — 使用 [JSON](/guide/json) 管道和 `translate-json` 翻譯它們。

對於嵌入在 Markdown 中的 PNG 和其他點陣圖影像，請參閱[影像與螢幕截圖](/guide/images-and-screenshots/)。`translate-docs` 僅翻譯替代文字；它不複製點陣圖檔案。

對於 README 或文件中可選的**語言切換器**區塊，請將 `docsOutput.style` 設定為 `"flat"` — 請參閱[語言切換器](/guide/documents/language-switcher)。

當啟用 `features.translateSVG` 時，SVG 檔案透過 [`translate-svg`](/reference/cli-commands) 翻譯 — 而不是透過 `docs[]` / `contentPaths`。

任意巢狀的 UI JSON 捆綁包（非 Docusaurus 目錄）屬於 [JSON](/guide/json) 管道，而不屬於 `docs[]`。

<a id="which-guide-to-read"></a>
## 閱讀哪份指南

| 您的設定 | 從這裡開始 |
| --- | --- |
| Docusaurus 網站 | `init -t ui-docusaurus`、`docsOutput.style = "docusaurus"` — [步驟 1](#step-1-initialise-for-documentation) |
| VitePress 網站 | `init -t ui-vitepress` + `json[]` 用於主題 — [VitePress 整合](/guide/vitepress-integration) |
| Astro Starlight | `init -t ui-starlight` — [步驟 1](#step-1-initialise-for-documentation) |
| 平面文件（README、變更日誌等） | `docsOutput.style = "flat"` — [輸出佈局](/guide/documents/output-layouts)，可選的[語言切換器](/guide/documents/language-switcher) |
| 翻譯檔案的存放位置 | [輸出佈局](/guide/documents/output-layouts) |
| 跨頁面 `#anchor` 連結 | [錨點連結](/guide/documents/anchor-links) |
| 連結和資產 URL 重寫 (`regexAdjustments`) | [連結重寫](/guide/documents/link-rewriting) |
| 文件中的螢幕截圖 | [影像與螢幕截圖](/guide/images-and-screenshots/) |
| `translate-docs` 旗標和快取 | [CLI 選項](/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## 步驟 1：初始化文件

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

適用於 Astro Starlight 文件網站：

```bash
npx ai-i18n-tools init -t ui-starlight
```

對於 VitePress 文件網站：

```bash
npx ai-i18n-tools init -t ui-vitepress
```

啟用 `features.translateJson` 並為 VitePress 主題字串新增一個 `json[]` 條目 — 請參閱[VitePress 整合](/guide/vitepress-integration)。

適用於純 Astro 網站 UI（無 Starlight）：

```bash
npx ai-i18n-tools init -t ui-astro-website
```

該範本僅啟用 UI 提取。對於頁面 HTML 翻譯，還需設定 `features.translateDocs` 並新增一個 `docs[]` 區塊（請參閱 [Astro 網站頁面（解析與替換）](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)）。[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 設定顯示了兩個管道。

編輯產生的 `ai-i18n-tools.config.json`：

- `sourceLocale` - 來源語言（必須與 `docusaurus.config.js` 中的 `defaultLocale` 相符）。
- `targetLocales` - BCP-47 地區設定代碼陣列（例如 `["de", "fr", "es"]`）。
- `cacheDir` - 所有管道的共用 SQLite 快取目錄（以及 `--write-logs` 的預設記錄目錄）。
- `docs` - 文件區塊陣列。每個區塊都有選擇性的 `description`、`contentPaths`（字串或陣列；檔案、目錄或 glob）、`outputDir`、選擇性的 `docusaurusCatalogDir`、`docsOutput`、選擇性的 `segmentSplitting`、`translateFrontmatterFields`、`protectAttributes`、`protectKeys`、`targetLocales`、`addFrontmatter` 等。
- `docs[].description` - 供維護者使用的可選簡短備註。設定後，它會出現在 `translate-docs` 標題和 `status` 區段標題中。
- `docs[].contentPaths` - Markdown/MDX/`.astro` 來源（以及 Docusaurus shell JSON 的可選 `docusaurusCatalogDir`）。
- `docs[].outputDir` - 該區塊的翻譯輸出根目錄。
- `docs[].docsOutput.style` - `"nested"`（預設）、`"flat"`、`"doc-system"`，或別名 `"docusaurus"` / `"astro-starlight"` / `"vitepress"`（請參閱[輸出佈局](/guide/documents/output-layouts))。

**主要與補充：** 專注於 `contentPaths` 以進行本地化頁面。當您也需要來自 `write-translations` 的 Docusaurus shell JSON 時，請設定 `docusaurusCatalogDir`。如果您只翻譯頁面，請省略 `docusaurusCatalogDir`。

<a id="step-2-translate-documents"></a>
## 步驟 2：翻譯文件

```bash
npx ai-i18n-tools translate-docs
```

這會將每個 `docs[]` 區塊的 `contentPaths` (以及設定 `docusaurusCatalogDir` 時的 Docusaurus 目錄 JSON) 中的所有檔案翻譯成所有有效的說明文件地區設定。已翻譯的區段會從 SQLite 快取提供 — 只有新增或變更的區段才會傳送至 LLM。

翻譯單一地區設定：

```bash
npx ai-i18n-tools translate-docs --locale de
```

檢查需要翻譯的內容：

```bash
npx ai-i18n-tools status
```

有關旗標、快取行為和批次提示格式，請參閱[CLI 選項](/guide/documents/cli-options)。

<a id="complex-markdown-and-failed-quality-checks"></a>
## 複雜的 Markdown 和失敗的品質檢查

`translate-docs` 會檢查每個翻譯段落是否保留了 Markdown 結構（包括從文件中解析出的強調格式）。當段落中堆疊了許多 `bold` 區塊、在 `` `inline code` `` 周圍嵌套反引號、將反引號置於粗體內（例如範本字面值如 `` `fetch(\`/locales/${code}.json\`)` ``），或在一個長句中交錯使用粗體與程式碼時，這種結構相當脆弱：某些語系需要不同的詞序，這可能導致翻譯後 `**` 和 `` ` `` 的對應錯亂，進而觸發 CLI 錯誤，例如 `AST mismatch`。

**如果您遇到此類驗證失敗，請優先簡化原始語言文字** — 分割段落、將範例移至圍欄程式碼區塊，或以較少的層疊粗體/程式碼配對描述相同的想法 — 而不是期望每個模型和地區設定都能完美重現密集的內嵌標記。

當所有設定的模型在同一段落上都因 `AST mismatch` 失敗時，`translate-docs` 可自動將該段落拆分為更小的部分（優先從清單中點拆分，然後是單個清單項目或較短的段落片段），從第一個模型開始重試每一部分，並在原始段落的快取鍵下重新合併結果。此功能預設啟用（`segmentSplitting.qualityRetrySplit`）；設定為 `false` 可在模型全部嘗試失敗後停止。執行摘要會在啟用此備援機制時報告 `Quality split retries`。

若要查看**哪些區段失敗**、失敗頻率以及儲存的**品質/錯誤訊息**，請使用翻譯儀表板的**失敗**分頁 ([翻譯儀表板 → 失敗](/guide/translation-dashboard/failures#failures-document-translation))。
