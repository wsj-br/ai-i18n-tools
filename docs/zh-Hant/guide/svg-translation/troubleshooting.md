<a id="svg-troubleshooting"></a>
# SVG 疑難排解

另請參閱 [圖片與螢幕截圖疑難排解](/zh-Hant/guide/images-and-screenshots/troubleshooting)。

- **SVG 來源和輸出位於同一目錄** — 將 `svg.sourcePath` 和 `svg.outputDir` 分開。
- **共置 SVG 的 Docusaurus 絕對靜態 URL** — 從一開始就使用相對 `../assets/` 路徑。
- **翻譯後出現非預期的結束標籤 `text` 與 `g`** — Inkscape 經常在實際標籤旁邊發出空的自閉合 `<text … />`。較舊的提取器正規表達式會將這些標籤跨越到下一個 `</text>` 並寫入一個多餘的結束標籤。升級並重新執行 `translate-svg` (或 `sync`) 以重新生成本地化 SVG。
- **印地語、阿拉伯語、中日韓或西里爾語 SVG 中的羅馬化或僅限拉丁語標籤** — 適用與文件相同的書寫系統政策；錯誤腳本的快取行會在下一次 `translate-svg` / `sync` 時被拒絕。使用全域 `--debug-failed` 重新執行，以在 `cacheDir` 下為**每個**被丟棄的模型（提示、原始輸出、腳本錯誤）寫入 `FAILED-TRANSLATION` 日誌，而不僅僅是當所有模型都失敗時。請參閱[印地語、阿拉伯語、中日韓或西里爾語輸出被羅馬化](/zh-Hant/guide/documents/troubleshooting#hindi-arabic-cjk-or-cyrillic-output-is-romanised-latin-letters)。
