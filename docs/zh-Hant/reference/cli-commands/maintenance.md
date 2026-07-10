<a id="cli--cache--maintenance"></a>
# CLI — 快取與維護

<a id="cleanup"></a>
### `cleanup`

**概要：** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

清除整個 `markdown_source_issues` 資料表，接著執行 `sync --force-update`（擷取、UI、SVG、文件，以及啟用時的 `translate-json`），讓目前設定的文件重新填入 Markdown 問題；然後移除過時的段落列（`last_hit_at` 為 null 或檔案路徑為空）；捨棄解析後來源路徑在磁碟上不存在的 `file_tracking` 列；移除其 `filepath` 中繼資料指向不存在檔案的翻譯列；修剪孤立的 `translation_failures` 列。同步後記錄四個修剪計數（過時段落、孤立 `file_tracking`、孤立翻譯、孤立失敗），以及前置的 Markdown 問題清除計數。

**關鍵選項：** `--dry-run`、`--backup`

`--backup <path>` 會在修改前將 SQLite 備份寫入該路徑（除非設定此旗標，否則不會建立備份）。

---

<a id="clean-temp"></a>
### `clean-temp`

**概要：** `ai-i18n-tools clean-temp [-r | --root <path>] [-f | --force] [--dry-run]`

無需設定。走訪目錄樹（預設：cwd）尋找 `*.log`、`*.tmp` 與 `cache.db.backup*.sqlite`，印出類似 `find -print` 的 `./…` 路徑。有符合項目時：除非 `-f` / `--force`（不提示直接刪除），否則提示 `Delete these files? (y/n)`。無符合項目時：不提示直接結束。`--dry-run`：僅列出，不提示或刪除（覆寫 `--force`）。

**關鍵選項：** `-r` / `--root`、`-f` / `--force`、`--dry-run`

---

<a id="purge-locale"></a>
### `purge-locale`

**概要：** `ai-i18n-tools purge-locale -l <code> [-l <code> …] [options]`

從 `translations`、`file_tracking` 與 `translation_failures` 刪除指定語系的所有快取列，以及該語系的產生成品：翻譯文件（從 `docs[]` 解析的 `.md` / `.mdx` / `.astro` 輸出，包含來源已移除的孤立輸出——透過掃描各區塊的輸出樹來發現，除非設定了自訂 `pathTemplate`）、各語系的平面 UI 檔案（`<flatOutputDir>/<locale>.json`），以及該語系在 `strings.json` 中的項目。

語系透過可重複的 `-l` / `--locale` 傳入（正規化為 BCP-47）。印出各語系計數（快取列、文件、`strings.json` 項目、平面檔案）；對無可清除內容的語系發出警告（不視為錯誤）。除非 `-y` / `--yes` / `-f` / `--force`，否則提示確認。`--dry-run`：回報計數與將被移除的檔案，不刪除任何內容。`--keep-files`：僅清除 SQLite 快取，保留產生的檔案與 `strings.json` 不變。除非傳入 `--backup <path>`，否則不會建立 SQLite 備份；該旗標會在刪除前將備份寫入該路徑。

**關鍵選項：** `-l` / `--locale`、`--dry-run`、`-y` / `--yes`、`-f` / `--force`、`--keep-files`、`--backup`
