<a id="troubleshooting"></a>
# 疑難排解

<a id="section-anchor-links-do-not-work-in-translated-docs"></a>
## 翻譯文件中區段錨點連結無法運作

像 `[label](other.md#section-id)` 這樣的連結可能會開啟正確的翻譯檔案，但無法捲動到預期的標題 — 或跳到錯誤的區段。`#…` 片段在該地區設定中不再符合任何標題 `id`。

常見原因：

- 來源標題從未有明確的錨點 ID；網站會從可見標題文字衍生縮寫，這在翻譯後會改變。
- 您重新命名了來源中的標題，但前面的 `<a id="…"></a>` 行遺失或仍是舊 ID。
- 錨點連結使用猜測自英文單字的 `#…` 片段，而非 `write-heading-ids` 會產生的 ID。

**修正**

1. 在您的 **來源** `.md` / `.mdx` 上執行 `ai-i18n-tools write-heading-ids`（與 `translate-docs` 相同的 `docs[]` / `contentPaths`）。它會在每個 ATX 標題前插入 `<a id="slug"></a>`，或者在標題文字不再符合目前 slug 時重新整理現有的錨點。
2. 將錨點連結指向這些 ID — 例如 `[setup](guide.md#first-run)`，其中 `#first-run` 應符合目標標題上方的錨點行，而不是僅從英文標題推斷出的 slug。
3. 重新執行 `translate-docs`（或 `sync --force-update`），以便每個地區設定的副本都包含更新的錨點行。

請先在 `--dry-run` 上使用 `write-heading-ids` 預覽變更。如需完整模式，請參閱[錨點連結](/zh-Hant/guide/documents/anchor-links)。

<a id="image-or-asset-links-404-in-translated-docs"></a>
## 翻譯文件中圖片或資產連結出現 404 錯誤

Markdown 連結或 `![alt](url)` 在英文版中有效，但在翻譯版本中卻會傳回 404 錯誤 — 這通常是因為 URL 仍指向來源語系資料夾或僅限英文的靜態路徑。

**修正**

1. 確認您的資產佈局與您的 `docsOutput.style` 相符（扁平式與文件系統）。請參閱[連結重寫](/zh-Hant/guide/documents/link-rewriting)和[圖片與螢幕截圖](/zh-Hant/guide/images-and-screenshots/)。
2. 新增或調整 `docsOutput.postProcessing.regexAdjustments` 以交換語系區段或橋接絕對 `/img/…` 路徑。對於扁平式佈局，請記住扁平式連結重寫器在 **之前** 執行 `regexAdjustments` — 根據已加前綴的 URL 匹配模式。
3. 確保語系特定的資產檔案存在於重寫後的 markdown 參考路徑中（`translate-docs` 重寫 URL，但不複製點陣圖檔案）。
