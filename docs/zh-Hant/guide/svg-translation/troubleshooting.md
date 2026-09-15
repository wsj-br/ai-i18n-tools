<a id="svg-troubleshooting"></a>
# SVG 疑難排解

另請參閱 [圖片與螢幕截圖疑難排解](/zh-Hant/guide/images-and-screenshots/troubleshooting)。

- **同一目錄中的 SVG 來源與輸出** — 將 `svg.sourcePath` 與 `svg.outputDir` 分開。
- **共置 SVG 的絕對 Docusaurus 靜態 URL** — 從一開始就使用相對 `../assets/` 路徑。
- **翻譯後出現非預期的結束標籤 `text` 與 `g`** — Inkscape 經常在實際標籤旁發出空的自閉合 `<text … />`。舊版的提取器正規表示式會將這些跨越到下一個 `</text>` 並寫入多餘的結束標籤。升級並重新執行 `translate-svg`（或 `sync`）以重新產生地區設定 SVG。
- **印地語、阿拉伯語、CJK 或西里爾字母 SVG 中的羅馬拼音或純拉丁字母標籤** — 適用與文件相同的書寫系統政策；錯誤書寫系統的快取列會在下一次 `translate-svg` / `sync` 時被拒絕。使用全域 `--debug-failed` 重新執行，以在 `cacheDir` 下為**每個**被丟棄的模型（提示、原始輸出、腳本錯誤）寫入 `FAILED-TRANSLATION` 日誌，而不僅僅是在每個模型都失敗時。請參閱[印地語、阿拉伯語、CJK 或西里爾字母輸出被羅馬拼音化](/zh-Hant/guide/documents/troubleshooting#wrong-script-or-romanized-output)。
