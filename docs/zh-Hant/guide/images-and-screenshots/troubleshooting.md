<a id="common-mistakes-and-troubleshooting"></a>
# 常見錯誤與疑難排解

**螢幕截圖路徑中沒有地區設定目錄**
`images/screenshots/screenshot.png` — 無法區分地區設定變體，也無法重寫。在使用[每個地區設定資料夾](/guide/images-and-screenshots/per-locale-folder)重寫之前，請重組為`images/screenshots/<locale>/screenshot.png`。

**正規表達式中硬式編碼來源地區設定**
`"search": "screenshots/en-GB/"` — 如果 `sourceLocale` 變更，將會無聲無息地中斷。請改用 `"search": "screenshots/[^/]+/"`。

**SVG 來源與輸出在同一個目錄**
如果 `svg.sourcePath` 與 `svg.outputDir` 重疊，產生的檔案將會與手動編輯的來源混雜。請將它們放在不同的目錄中。

**Docusaurus 中 SVG 的絕對靜態 URL**
`/img/diagram.svg`（來自 `static/img/`）需要 `regexAdjustments` 規則才能在翻譯後的輸出中重寫為 `../assets/`。請將來源 SVG 放在 `static/assets/`，並從一開始就使用相對的 `../assets/diagram.svg`，以完全避免此問題。

**Docusaurus 中缺少 `docs/assets` 符號連結**
沒有符號連結，`docs/user-guide/` 中的來源文件無法透過相對路徑參考 `static/assets/` 中的 PNG 或 SVG。請在專案建立時設定符號連結：`ln -s ../static/assets documentation/docs/assets`。

**`take-screenshots`指令碼僅擷取來源地區設定**
每個地區設定的資料夾佈局需要每個地區設定的PNG檔案。如果指令碼僅擷取`en-GB`，則翻譯的文件將具有指向遺失檔案的重寫路徑。
