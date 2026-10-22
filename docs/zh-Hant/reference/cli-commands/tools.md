<a id="cli--dashboard--glossary"></a>
# CLI — 儀表板與詞彙表

<a id="dashboard"></a>
### `dashboard`

**概要：** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

啟動翻譯儀表板（用於快取區段、`strings.json`、詞彙表、失敗項目、統計資料、使用量與模型建議的本機網頁使用者介面）。預設連接埠為 **8675**（若無法使用則會重試下一個連接埠）。使用 `--no-open` 時，不會自動開啟預設瀏覽器。`dash` 是等效的別名。已棄用的別名 `editor` 仍然有效，但會顯示警告訊息。

**主要選項：** `-p` / `--port`, `--no-open`

**另請參閱：** [翻譯儀表板](/zh-Hant/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**概要：** `ai-i18n-tools glossary-generate [-o <path>]`

寫入一個空的 `glossary-user.csv` 範本。拒絕覆寫現有檔案（結束代碼 **1**）。

**主要選項：** `-o` / `--output`

`-o`：覆寫輸出路徑（預設：來自設定的 `glossary.userGlossary`，或 `glossary-user.csv`）。

**另請參閱：**[詞彙表](/zh-Hant/guide/glossary)，[儀表板詞彙表](/zh-Hant/guide/translation-dashboard/glossary)
