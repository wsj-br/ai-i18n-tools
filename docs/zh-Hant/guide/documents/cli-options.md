<a id="cli-options"></a>
# CLI 選項

關於 `translate-docs` 快取行為、旗標、批次提示格式和內部 SQLite 路徑鍵的參考。

<a id="cache-behaviour-and-translate-docs-flags"></a>
## 快取行為和 `translate-docs` 旗標

CLI 在 SQLite 中保留**檔案追蹤**（每個檔案的來源雜湊 × 語言環境）和**區段**行（每個可翻譯區塊的雜湊 × 語言環境）。當追蹤的雜湊與當前來源匹配、輸出檔案已存在**且**輸出的修改時間至少與來源的修改時間一樣新時，正常執行會完全跳過該檔案；否則它會處理該檔案並使用區段快取，這樣未更改的文字就不會呼叫 API。

| 標誌                          | 效果                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(預設)*                   | 當追蹤狀態與磁碟上的輸出相符時，跳過未變更的檔案；其餘部分使用段落快取。                                                                                                                                                                          |
| `-l, --locale <codes>`        | 以逗號分隔的目標語言環境（省略時，預設值與根 `targetLocales` 和每個 `docs[]` 區塊的可選 `targetLocales` 的聯集匹配）。                                                                                                       |
| `-p, --path` / `-f, --file`   | 僅翻譯此路徑下的 Markdown/JSON（專案相對路徑、絕對路徑或 glob 模式）；`--file` 是 `--path` 的別名。                                                                                                                                      |
| `--dry-run`                   | 不進行檔案寫入，也不呼叫 API。                                                                                                                                                                                                                                    |
| `--type <kind>`               | 限制為 `markdown` 或 `json`（否則，如果配置中已啟用，則兩者皆有）。                                                                                                                                                                                           |
| `--json-only` / `--no-json`   | 僅翻譯 JSON 標籤檔案，或跳過 JSON 並僅翻譯 markdown。                                                                                                                                                                                          |
| `-j, --concurrency <n>`       | 最大並行目標語言（預設值來自配置或 CLI 內建預設值）。                                                                                                                                                                                          |
| `-b, --batch-concurrency <n>` | 每份檔案的最大並行批次 API 呼叫（文件；預設值來自配置或 CLI）。                                                                                                                                                                                           |
| `--emphasis-placeholders`     | 在翻譯前將 Markdown 強調標記遮罩為佔位符。對於 CJK 和 RTL 語言環境會自動啟用，除非透過 `docs[].emphasisPlaceholders` 每個區塊覆寫或使用 `--no-emphasis-placeholders` 停用。                                                                                                                                                                          |
| `--debug-failed`              | 當驗證失敗時，在 `cacheDir` 下寫入詳細的 `FAILED-TRANSLATION` 日誌。                                                                                                                                                                                    |
| `--force-update`              | 重新處理每個符合條件的檔案（提取、重組、寫入輸出），即使檔案追蹤會跳過。 **段落快取仍然適用** — 未變更的段落不會傳送至 LLM。                                                                                |
| `--force`                     | 清除每個處理檔案的檔案追蹤，並且 **不讀取**段落快取進行 API 翻譯（完整重新翻譯）。新結果仍會 **寫入** 段落快取。                                                                                                                                           |
| `--stats`                     | 列印段落計數、追蹤的檔案計數以及每個目標語言的段落總數，然後退出。                                                                                                                                                                                |
| `--clear-cache [locale]`      | 刪除快取的翻譯（和檔案追蹤）：所有目標語言，或單一目標語言，然後退出。                                                                                                                                                                         |
| `--prompt-format <mode>`      | 每個段落 **批次** 如何傳送至模型和解析（`xml`、`json-array` 或 `json-object`）。預設 `json-array`。不改變提取、預留位置、驗證、快取或後備行為 — 請參閱 [批次提示格式](#batch-prompt-format)。 |

您不能將 `--force` 與 `--force-update` 結合使用（它們是互斥的）。

<a id="batch-prompt-format"></a>
## 批次提示格式

`translate-docs` 將可翻譯區段以**批次**（按 `batchSize` / `maxBatchChars` 分組）傳送給活動的 LLM 提供者。`--prompt-format` 旗標只會更改該批次的**線路格式**；`PlaceholderHandler` 權杖、Markdown AST 檢查、SQLite 快取鍵以及批次解析失敗時的每個區段回退保持不變。

| 模式                   | 使用者訊息                                                           | 模型回覆                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | 偽 XML：每個段落一個 `<seg id="N">…</seg>`（帶有 XML 跳脫）。 | 僅 `<t id="N">…</t>` 區塊，每個區塊對應一個段落索引。       |
| `json-array` (預設) | 字串的 JSON 陣列，每個區段一個項目，依順序排列。               | 長度相同的 **JSON 陣列**（順序相同）。           |
| `json-object`          | 以區段索引為鍵的 JSON 物件 `{"0":"…","1":"…",…}`。            | 具有 **相同鍵**和已翻譯值的 JSON 物件。 |

執行標頭也會列印 `Batch prompt format: …`，以便您可以確認活動模式。JSON 標籤檔案 (`docusaurusCatalogDir`) 和 SVG 檔案批次在這些步驟作為 `translate-docs`（或 `sync` 的文件階段 — `sync` 不會公開此旗標；它預設為 `json-array`）的一部分執行時使用相同的設定。

<a id="segment-dedupe-and-paths-in-sqlite"></a>
## SQLite 中的區段去重和路徑

> **注意：** 本節涵蓋內部快取金鑰的詳細資訊，有助於偵錯 `cleanup` 行為或自訂工具。大多數使用者可以略過它。

- 區段列以 `(source_hash, locale)`（雜湊 = 正規化內容）為全域鍵。兩個檔案中相同的文字會共用一個列；`translations.filepath` 是中繼資料（最後寫入者），而不是每個檔案的第二個快取項目。
- `file_tracking.filepath` 使用命名空間金鑰：每個 `docs` 區塊的 `doc-block:{index}:{relPath}`（`relPath` 是相對於專案根目錄的 posix：收集的 markdown 路徑；**JSON 標籤檔案使用來源檔案的相對工作目錄路徑**，例如 `docs-site/i18n/en/code.json`，因此清理可以解析實際檔案），`json[]` 下的 `json[]` 來源的 `json-block:{index}:{relPath}`，以及 `translate-svg` 下的 SVG 檔案的 `svg-files:{relPath}`。
- `translations.filepath` 儲存 markdown、JSON 和 SVG 區段的相對於工作目錄的 posix 路徑（SVG 使用與其他資產相同的路徑形狀；`svg-files:…` 前綴 **僅**用於 `file_tracking`）。
- 執行後，僅針對 **相同翻譯範圍**中的區段列清除 `last_hit_at`（尊重 `--path` 和啟用的種類），這些區段列未被命中，因此經過篩選或僅限文件的執行不會將不相關的檔案標記為過時。
