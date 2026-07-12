<a id="shared-raster"></a>
# 共享點陣圖

在所有地區設定共用單一圖片（沒有按地區設定的變體）時使用。

- **`docsOutput.style = "flat"`** — 扁平連結重寫器會為每個輸出檔案計算深度前綴，因此來源檔案旁的相對資源（例如從 `docs/page.md` 引用為 `figure.png` 的 `docs/figure.png`）能在每個翻譯輸出中正確解析 — 不需要 `postProcessing.regexAdjustments` 規則。當來源檔案位於子目錄中時，請啟用 `flatPreserveRelativeDir: true`，以便輸出路徑保留來源樹狀結構（請參閱[每個檔案的深度前綴](/zh-Hant/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)）。
- **`docsOutput.style = "vitepress"`**（以及其他帶有連結規範化器的文件系統預設集） — 當 URL 在每個地區設定中都相同時，網站根目錄絕對路徑（例如 `/translation-dashboard.png`）會保持不變 — 不需要 `regexAdjustments` 規則。

**扁平範例：** 專案將 `docs/guide/quick-start.md` 翻譯為 `translated-docs/docs/guide/quick-start.<locale>.md`。這假設 `flatPreserveRelativeDir: true`，因此 `docs/guide/quick-start.md` 輸出至 `translated-docs/docs/guide/quick-start.<locale>.md`（而非 `translated-docs/quick-start.<locale>.md`）。同層圖片 `docs/translation-dashboard.png` 從 `quick-start.md` 引用為 `../translation-dashboard.png`。重寫器從輸出檔案的目錄計算回來源目錄的每個檔案前綴（`../../docs/`），產生 `../../docs/translation-dashboard.png`。從 `translated-docs/docs/guide/` 來看，這會正確解析回 `docs/translation-dashboard.png`。

在以下情況下，仍然需要 `postProcessing` 規則：
- 資源透過 **`docsOutput.style = "flat"`** 中的絕對 URL 進行引用（例如 `/img/figure.png`） — 扁平重寫器僅處理相對路徑
- 您因其他原因想要變更資源 URL（例如切換至 CDN）

<a id="implementation-example"></a>
### 實作範例

此存放庫自身的文件使用共用圖片的絕對 URL 變體：[翻譯儀表板指南](/zh-Hant/guide/translation-dashboard/) 將其螢幕截圖引用為 `![Translation Dashboard](/translation-dashboard.png)` — 這是一個從 [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png) 提供的絕對網站根目錄路徑。因為每個地區設定的 URL 都相同，所以不需要 `postProcessing.regexAdjustments` 規則。
