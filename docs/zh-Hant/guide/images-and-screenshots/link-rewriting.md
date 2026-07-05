<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# 平面連結重寫器與兩步驟流程

對於 `docsOutput.style = "flat"`（除非設定了 `rewriteRelativeLinks: false` 或自訂的 `pathTemplate`），在 `postProcessing` 之前會執行內建的重寫器。它會處理跨文件連結（加上地區後綴），並為非 markdown 資產 URL 加上深度前綴。

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"` 時的兩步驟流程

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

在儲存庫根目錄中，使用 `outputDir: "translated-docs/"` 和來源 `README.md` 的範例：

1. 平面連結重寫器：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`（針對 `translated-docs/` 的一個 `../`）
2. `postProcessing` 正則表達式 `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`：`../images/screenshots/de/foo.png`

對於 `docsOutput.style = "doc-system"`（包括 `"docusaurus"`、`"astro-starlight"` 和 `"nested"`），平面連結重寫器不會執行。`postProcessing` 會看到翻譯後 markdown 中的原始 URL（通常是絕對路徑，例如 `/img/screenshots/en-GB/foo.png`）。

<a id="vitepress-link-normalizer"></a>
### VitePress 連結正規化器 (`style: "vitepress"`)

當 `docsOutput.rewriteVitepressLinks` 為 `true` 時（當 `style` 為 `"vitepress"` 時的預設值），在區段重新組裝後會執行一個單獨的正規化器（而不是平面重寫器）。它針對 VitePress / 文件系統網站，其中英文內容位於內容根目錄，而地區設定則位於同級資料夾中（`docs/de/guide/…`）。

```
source href  →  [VitePress link normalizer]  →  [postProcessing]  →  output href
```

典型的重寫：

| 來源模式 | 正規化目標 |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (來自本地化檔案) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | 不變（儲存庫路徑使用完整 URL） |

對於將 `README.md` 同步到 `docs/index.md` 的專案，請在 `README.md` 中使用完整的 GitHub URL，用於 `LICENSE`、`examples/` 以及 VitePress 樹之外的其他檔案。請參閱 [VitePress 整合 — 將 README 作為文件首頁](/guide/vitepress-integration#readme-as-homepage)。

平面重寫器和 VitePress 正規化器在每個 `docs[]` 區塊中是互斥的 — 在 `postProcessing` 之前只會執行其中一個。請參閱 [VitePress 整合 — 連結慣例](/guide/vitepress-integration#link-conventions)。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### 針對檔案的深度前綴（使用 `flatPreserveRelativeDir`）

深度前綴是針對每個輸出檔案計算的，而不是針對整個批次全域計算。對於每個來源檔案，重寫器會計算從輸出檔案目錄回溯到來源檔案目錄的相對路徑，並將其用作前綴。

這表示使用 `flatPreserveRelativeDir: true` 時，子目錄中的來源檔案會自動取得正確的前綴。例如，`docs/guide/quick-start.md` 會輸出到 `translated-docs/docs/guide/quick-start.<locale>.md`。每個檔案的前綴是 `../../docs/`，因此資產 `translation-dashboard.png`（來源樹狀結構的同級項目）會變成 `../../docs/translation-dashboard.png` — 這會從 `translated-docs/docs/guide/` 正確解析回 `docs/translation-dashboard.png`。

對於與來源檔案並存的相對路徑資產，不需要進行 `postProcessing` 正則表達式校正。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 與 `linkRewriteDocsRoot`

| 選項                                   | 效果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | 明確啟用或停用平面連結重寫器（當 `docsOutput.style = "flat"` 時覆寫預設值） |
| `docsOutput.linkRewriteDocsRoot`     | 計算 `depthPrefix` 的根目錄（預設為 `"."`）                                                        |
| `docsOutput.flatPreserveRelativeDir` | 影響輸出路徑佈局，重寫器在計算已知翻譯檔案的目標路徑時會使用此佈局 |

---

<a id="common-mistakes-and-troubleshooting"></a>
