<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# 平面連結重寫器與兩步驟流程

閱讀此頁面以了解截圖 URL 佈局與扁平的兩步驟資源流程。關於跨頁面 markdown 連結與 `replace` 佔位符，請參閱[文件 — 連結重寫](/zh-Hant/guide/documents/link-rewriting)。

對於 `docsOutput.style = "flat"`（除非設定了 `rewriteRelativeLinks: false` 或自訂的 `pathTemplate`），內建的重寫器會在 `postProcessing` 之前執行。它處理跨文件連結（新增地區設定後綴）並在非 Markdown 資產 URL 前面加上深度前綴。然後，`docsOutput.postProcessing.regexAdjustments` 會重寫特定於地區設定的資產路徑（螢幕截圖、`/img/…` 橋接）。

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"` 時的兩步驟流程

1. **來源 URL** — 翻譯後 markdown 中的圖片路徑（在段落重組後）
2. **扁平連結重寫器** — 前置深度前綴（`../`、`../../docs/`、…）
3. **`regexAdjustments`** — 替換語系資料夾段落（`en-GB` → `${translatedLocale}`）
4. **輸出 URL** — 寫入翻譯檔案的最終路徑

在儲存庫根目錄中，使用 `outputDir: "translated-docs/"` 和來源 `README.md` 的範例：

1. 平面連結重寫器：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`（`translated-docs/` 的一個 `../`）
2. `regexAdjustments` 規則 `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`：`../images/screenshots/de/foo.png`

對於任何非 `flat` 樣式（包含 `"nested"`、`"doc-system"`，以及預設如 `"docusaurus"`、`"astro-starlight"` 與 `"vitepress"`），扁平連結重寫器不會執行。`regexAdjustments` 會看到來自翻譯後 markdown 的原始 URL（通常是像 `/img/screenshots/en-GB/foo.png` 這樣的絕對路徑）。

**Astro Starlight MDX：** Starlight 內容通常是 `.mdx`。對於這些檔案，`translate-docs` 僅執行 `postProcessing.regexAdjustments` — 沒有扁平、VitePress、Nextra 或 Fumadocs 連結重寫器。各語系的截圖路徑仍使用相同的 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` 規則；請參閱 [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/)。

<a id="vitepress-link-normalizer-style-vitepress"></a>
### VitePress 連結正規化器 (`style: "vitepress"`)

當 `docsOutput.rewriteVitepressLinks` 為 `true` 時（當 `style` 為 `"vitepress"` 時的預設值），在區段重新組裝後會執行一個單獨的正規化器（而不是平面重寫器）。它針對 VitePress / 文件系統網站，其中英文內容位於內容根目錄，而地區設定則位於同級資料夾中（`docs/de/guide/…`）。

1. **來源 href** — 翻譯後 markdown 中的連結（在段落重組後）
2. **VitePress 連結正規化器** — 將文件路徑重寫為網站路由（`/guide/…`）
3. **`regexAdjustments`** — 截圖的可選語系資料夾替換（`screenshots/en-GB/` → `screenshots/de/`、…）
4. **輸出 href** — 寫入翻譯檔案的最終 URL

典型的重寫：

| 來源模式 | 正規化目標 |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (來自本地化檔案) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | 不變（儲存庫路徑使用完整 URL） |

對於同步 `README.md` → `docs/index.md` 的專案，請在 `README.md` 中為 `LICENSE`、`examples/` 以及 VitePress 樹狀結構外的其他檔案使用完整的 GitHub URL。請參閱 [VitePress 整合 — README 作為文件首頁](/zh-Hant/guide/integrations/vitepress#readme-as-homepage)。

扁平化重寫器與 VitePress 正規化工具在每個 `docs[]` 區塊中互斥 — 在 `regexAdjustments` 之前僅會執行其中一個。請參閱 [VitePress 整合 — 連結慣例](/zh-Hant/guide/integrations/vitepress#link-conventions)。

各語系的截圖資料夾在需要時仍使用相同的 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` `regexAdjustments` 規則；請參閱[各語系資料夾](/zh-Hant/guide/images-and-screenshots/per-locale-folder)。

<a id="nextra-link-normalizer-style-nextra"></a>
### Nextra 連結正規化器 (`style: "nextra"`)

當 `docsOutput.rewriteNextraLinks` 為 `true`（預設為 `style` 是 `"nextra"` 時），在區段重組後會執行一個獨立的正規化工具。它會將 `content/en/…` 與相對 `.mdx` 路徑重寫為與語系無關的路由 (`/guide/…`)。請參閱 [Nextra 整合 — 連結慣例](/zh-Hant/guide/integrations/nextra#link-conventions)。

<a id="fumadocs-link-normalizer-style-fumadocs"></a>
### Fumadocs 連結正規化器 (`style: "fumadocs"`)

當 `docsOutput.rewriteFumadocsLinks` 為 `true`（預設為 `style` 是 `"fumadocs"` 時），在區段重組後會執行一個獨立的正規化工具。它會將 `content/docs/…` 與相對 `.mdx` 路徑重寫為與語系無關的路由 (`/docs/…`)。請參閱 [Fumadocs 整合 — 連結慣例](/zh-Hant/guide/integrations/fumadocs#link-conventions)。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### 針對檔案的深度前綴（使用 `flatPreserveRelativeDir`）

深度前綴是針對每個輸出檔案計算的，而不是針對整個批次全域計算。對於每個來源檔案，重寫器會計算從輸出檔案目錄回溯到來源檔案目錄的相對路徑，並將其用作前綴。

這表示使用 `flatPreserveRelativeDir: true` 時，子目錄中的來源檔案會自動取得正確的前綴。例如，`docs/guide/quick-start.md` 會輸出到 `translated-docs/docs/guide/quick-start.<locale>.md`。每個檔案的前綴是 `../../docs/`，因此資產 `translation-dashboard.png`（來源樹狀結構的同級項目）會變成 `../../docs/translation-dashboard.png` — 這會從 `translated-docs/docs/guide/` 正確解析回 `docs/translation-dashboard.png`。

對於與原始檔案並存的相對路徑資產，不需要進行 `regexAdjustments` 校正。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 與 `linkRewriteDocsRoot`

| 選項                                   | 效果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | 明確啟用或停用平面連結重寫器（當 `docsOutput.style = "flat"` 時覆寫預設值） |
| `docsOutput.linkRewriteDocsRoot`     | 計算 `depthPrefix` 的根目錄（預設為 `"."`）                                                        |
| `docsOutput.flatPreserveRelativeDir` | 影響輸出路徑佈局，重寫器在計算已知翻譯檔案的目標路徑時會使用此佈局 |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

在 `docs[].docsOutput.postProcessing` 下配置有序的 `{ "description"?, "search", "replace" }` 規則，以重寫內建重寫器不處理的圖片、螢幕截圖和其他資產 URL — 通常是交換地區設定資料夾區段（`screenshots/en-GB/` → `screenshots/de/`）或橋接絕對靜態路徑（`/img/…` → `../assets/…`）。

規則在區段重新組合和內建連結重寫（平面或 VitePress）之後，以及 `addFrontmatter` 之前，在翻譯後的 Markdown **主體**上執行。在平面佈局上，在應用深度前綴**之後**，針對 URL 編寫 `search` 模式 — 匹配路徑內的地區設定區段，而不是開頭的 `../`。

**每個地區設定的螢幕截圖資料夾（平面佈局）：**

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
    ]
  }
}
```

使用 `[^/]+` 而不是硬編碼您的來源地區設定 (`en-GB`)，這樣規則在 `sourceLocale` 變更後仍然有效。最常見的佔位符是 `${translatedLocale}`；`${sourceLocale}`、`${sourceFilename}`、`${translatedFilename}` 和路徑變數也可用 — 請參閱 [文件 — 連結重寫](/zh-Hant/guide/documents/link-rewriting#replace-placeholders)。

特定於佈局的範例（平面、文件系統、Docusaurus、Starlight）：[每個地區設定的資料夾](/zh-Hant/guide/images-and-screenshots/per-locale-folder)。一般跨頁面連結規則：[文件 — 連結重寫](/zh-Hant/guide/documents/link-rewriting)。欄位參考：[配置 — `docs`](/zh-Hant/reference/configuration#docs)。

---

<a id="common-mistakes-and-troubleshooting"></a>

請參閱 [常見錯誤和疑難排解](/zh-Hant/guide/images-and-screenshots/troubleshooting)，了解硬編碼的地區設定正規表示式、遺失的螢幕截圖目錄以及 Docusaurus `/img/` 橋接。
