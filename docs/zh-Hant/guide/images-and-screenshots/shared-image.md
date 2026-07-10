<a id="shared-raster"></a>
# 共享點陣圖

當單一圖片跨所有地區設定共用時使用。當 `docsOutput.style = "flat"` 時，平面連結重寫器會根據每個輸出檔案計算深度前綴，因此與來源檔案相鄰的資產（例如，從 `docs/page.md` 參照的 `docs/figure.png`，如 `figure.png`）能在每個翻譯的輸出中正確解析——不需要 `postProcessing.regexAdjustments` 規則。

範例：專案將 `docs/guide/quick-start.md` 翻譯為 `translated-docs/docs/guide/quick-start.<locale>.md`。同層級的圖片 `docs/translation-dashboard.png` 從 `quick-start.md` 參考為 `../translation-dashboard.png`。重寫器會計算從輸出檔案目錄返回來源目錄的每個檔案前綴 (`../../docs/`)，產生 `../../docs/translation-dashboard.png`。從 `translated-docs/docs/guide/`，這會正確解析回 `docs/translation-dashboard.png`。

當發生以下情況時，仍需要 `postProcessing` 規則：
- 資源是透過絕對 URL 參考的（例如 `/img/figure.png`）——重寫器僅處理相對路徑
- 您想因其他原因更改資源 URL（例如切換到 CDN）

<a id="implementation-example"></a>
### 實作範例

此儲存庫自己的文件使用共用圖片的絕對 URL 變體：[翻譯儀表板指南](/zh-Hant/guide/translation-dashboard/) 將其螢幕截圖參考為 `![Translation Dashboard](/translation-dashboard.png)` — 一個從 [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png) 提供的絕對網站根路徑。由於每個地區設定的 URL 都相同，因此不需要 `postProcessing.regexAdjustments` 規則；當儀表板 UI 變更時，請使用 [`scripts/screenshot-translation-dashboard.sh`](https://github.com/wsj-br/ai-i18n-tools/tree/main/scripts/screenshot-translation-dashboard.sh) 重新整理 PNG。
