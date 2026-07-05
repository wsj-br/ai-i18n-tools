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

請先在 `--dry-run` 上使用 `write-heading-ids` 預覽變更。如需完整模式，請參閱[錨點連結](/guide/documents/anchor-links)。
