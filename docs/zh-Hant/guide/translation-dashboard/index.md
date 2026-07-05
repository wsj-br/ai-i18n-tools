<a id="translation-dashboard"></a>
# 翻譯儀表板

翻譯儀表板是一個本地網路使用者介面，用於檢查和編輯專案的翻譯資料。它從三個儲存區讀取：

- **SQLite 快取** (`cacheDir`) — 文件區段翻譯、失敗記錄、Markdown 問題掃描
- **`strings.json`** — UI 字串目錄（純字串和複數群組）
- **使用者詞彙表 CSV** (`glossary.userGlossary`) — 針對 `translate-ui` 和 `proofread-ui` 的術語提示

在翻譯執行後使用它來尋找問題、覆寫錯誤輸出或檢閱快取覆蓋率 — 無需手動深入研究 SQLite 或 JSON。

<a id="start-the-dashboard"></a>
## 啟動儀表板

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

預設的監聽埠是 **8675**。如果該埠無法使用，伺服器會嘗試下一個埠（最多嘗試 1000 次）並記錄所選的埠。已棄用的別名 `editor` 仍然可用，但會顯示警告 — 請優先使用 `dashboard`。

儀表板 UI 使用與 CLI 相同的地區設定解析：`-L` / `--ui-lang` → `AI_I18N_LANG` → 設定 `uiLanguage` → 作業系統地區設定。請參閱[工具 UI 語言](/reference/environment-variables#tool-ui-language)。

![Translation Dashboard showing the Documentation tab with filters and cached segment rows](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## 我應該使用哪個分頁？

| 我想… | 分頁 | 指南 |
| --- | --- | --- |
| 修正翻譯失敗的文件區段 | **失敗** | [失敗](/guide/translation-dashboard/failures) |
| 在翻譯前修正來源 Markdown | **Markdown 問題** | [Markdown 問題](/guide/translation-dashboard/markdown-issues) |
| 覆寫快取的文件翻譯 | **文件** | [文件快取](/guide/translation-dashboard/documentation-cache) |
| 修正 UI 標籤 | **UI 字串** | [UI 字串與複數](/guide/translation-dashboard/ui-strings) |
| 修正複數形式 (`one`、`other`、…) | **UI 複數** | [UI 字串與複數](/guide/translation-dashboard/ui-strings) |
| 鎖定 UI 翻譯的術語 | **詞彙表** | [詞彙表](/guide/translation-dashboard/glossary) |
| 查看快取覆蓋率和模型使用情況 | **統計資料** | [統計資料](/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## 編輯後

| 您編輯了… | 然後執行… | 避免… |
| --- | --- | --- |
| 文件快取列 | `sync --force-update` 或 `translate-docs --force-update` | — |
| UI 字串或複數 | 純 `sync` 或 `translate-ui` | `--force` (覆寫 `user-edited` 列) |
| 詞彙表列 | 下一個 `translate-ui` 或 `proofread-ui` | — |

手動編輯在快取或 `strings.json` 中以模型 `user-edited` 標記。重新翻譯未變更的來源文字會跳過這些列，除非您使用 `--force`。

<a id="tips"></a>
## 提示

- **日誌連結按鈕**（表格列中的 🔗）會將檔案：行提示列印到執行 `ai-i18n-tools dashboard` 的**終端機** — 這對於從瀏覽器跳轉到編輯器很有用。
- **關閉**（分頁列的右上角）會正常關閉儀表板伺服器。
- 如果伺服器在瀏覽器分頁仍開啟時停止，會出現一個疊加層；重新啟動 `ai-i18n-tools dashboard` 以重新連線。
