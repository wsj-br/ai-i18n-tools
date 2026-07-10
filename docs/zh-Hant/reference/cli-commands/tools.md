<a id="cli--tools"></a>
# CLI — 工具

<a id="dashboard"></a>
### `dashboard`

**概要：** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

啟動翻譯儀表板（用於快取區段、`strings.json`、詞彙表、失敗項目和統計資料的本地網頁 UI）。預設連接埠 **8675**（若不可用則重試下一個連接埠）。使用 `--no-open` 時，不會自動開啟預設瀏覽器。已棄用的別名 `editor` 仍然有效，但會印出警告。

**主要選項：** `-p` / `--port`, `--no-open`

**另請參閱：** [翻譯儀表板](/zh-Hant/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**概要：** `ai-i18n-tools glossary-generate [-o <path>]`

寫入一個空的 `glossary-user.csv` 範本。拒絕覆寫現有檔案（結束代碼 **1**）。

**主要選項：** `-o` / `--output`

`-o`：覆寫輸出路徑（預設：來自設定的 `glossary.userGlossary`，或 `glossary-user.csv`）。

**另請參閱：** [儀表板詞彙表](/zh-Hant/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**概要：** `ai-i18n-tools help [command]`

顯示子命令的說明（輸出與 `ai-i18n-tools <command> --help` 相同）。
