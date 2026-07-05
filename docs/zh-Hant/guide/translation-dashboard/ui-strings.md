<a id="ui-strings--plurals"></a>
# UI 字串與複數

**UI 字串**和**UI 複數**分頁會編輯您 `strings.json` 目錄中的列。儀表板變更會直接寫入該檔案，而不是寫入 SQLite 文件快取。

當 UI 標籤或複數形式在 `translate-ui` 或 `sync` 之後需要手動修正時，請使用這些分頁。

<a id="ui-strings-tab"></a>
## UI 字串分頁

列出 `strings.json` 中非複數的項目 — 每個字串 ID 和地區設定一列。

<a id="filters"></a>
### 篩選器

| 篩選器 | 用途 |
| --- | --- |
| **ID / 雜湊** | 字串 ID 或雜湊 |
| **檔案名稱 (部分)** / **選取檔案路徑** | 來源檔案範圍 |
| **來源包含** / **翻譯包含** | 文字子字串 |
| **地區設定** | 單一地區設定或全部 |
| **模型** | 產生翻譯的模型 |

<a id="edit"></a>
### 編輯

1. 按一下列上的編輯圖示。
2. 變更翻譯文字並儲存。

該項目的 `models[locale]` 設定為 `user-edited`。執行純粹的 `sync` 或 `translate-ui` 以重新整理平面地區設定檔案 (`de.json` 等)。**請勿**使用 `--force` — 它會重新翻譯每個項目並可能覆寫手動修正。

當 `glossary.autoAddUserEditedToGlossary` 為 `true` (預設) 時，下一個 `translate-ui` 或 `sync` 可以自動將您的編輯附加到使用者詞彙表 CSV — 請參閱 [設定](/reference/configuration#glossary)。

<a id="delete"></a>
### 刪除

- **列刪除圖示** — 從項目中移除一個地區設定儲存桶。
- **刪除已篩選** — 批次刪除所有符合目前篩選條件的地區設定儲存桶。

<a id="log-links"></a>
### 記錄連結

🔗 控制項會將項目 `locations` 陣列中的來源檔案:行位置列印到終端機。

<a id="ui-plurals-tab"></a>
## UI 複數分頁

列出複數群組項目（`"plural": true` 在 `strings.json` 中）。每一列顯示一個地區設定的基數形式（`one`、`other` 和地區設定特定形式）。

<a id="filters-1"></a>
### 篩選器

與 UI 字串標籤相同，此外還有：

| 篩選器 | 用途 |
| --- | --- |
| **已完成 / 未完成** | 所選地區設定是否具備所有必要的 CLDR 形式 |

未完成的列缺少該地區設定的一個或多個必要形式。

<a id="edit-1"></a>
### 編輯

1. 按一下列上的編輯圖示。
2. 在模式視窗中編輯每個 CLDR 形式（每個形式一個文字區域）。
3. 儲存 — 空白形式字串會在儲存時移除。

該項目的 `models[locale]` 設定為 `user-edited`。之後執行純粹的 `sync` 或 `translate-ui`（而非 `--force`）。

<a id="other-columns"></a>
### 其他欄位

- **形式** — 顯示 `one: "…"`、`other: "…"` 等。
- **`zeroDigit` 標記** — 當來源使用數字零複數模式時的唯讀指示器。

必要形式來自每個地區設定的 CLDR 規則（`requiredPluralFormsByLocale`）。

<a id="delete-1"></a>
### 刪除

與 UI 字串相同：按地區設定刪除或**刪除已篩選**批次動作。
