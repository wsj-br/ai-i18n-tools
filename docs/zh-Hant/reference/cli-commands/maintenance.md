<a id="cli--cache-maintenance"></a>
# CLI — 快取維護

<a id="cleanup"></a>
### `cleanup`

**概要：** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

清除整個 `markdown_source_issues` 表格，然後執行 `sync --force-update`（提取、UI、SVG、文件，以及啟用時的 `translate-json`），以便 Markdown 問題重新填充目前配置的文件。然後它會：

- 移除過時的區段列（空 `last_hit_at` / 空檔案路徑）；
- 刪除其解析後的來源路徑在磁碟上遺失的 `file_tracking` 列；
- 移除其 `filepath` 中繼資料指向遺失檔案的翻譯列；
- 修剪孤立的 `translation_failures` 列；
- 刪除配置中不存在的地區設定的快取列（`sourceLocale`、根 `targetLocales`，以及任何每個區塊的 `docs[]` / `json[]` `targetLocales`）。

僅針對已停用的地區設定進行快取 — 已產生的文件、平面 UI 檔案和 `strings.json` 條目會保留不動（使用 [`purge-locale`](#purge-locale) 來移除這些）。在同步後記錄修剪計數（過時區段、孤立的 `file_tracking`、孤立翻譯、孤立失敗、未配置的地區設定），加上預先的 Markdown 問題清除計數。

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

從 `translations`、`file_tracking` 和 `translation_failures` 中刪除指定地區設定的所有快取列，以及該地區設定的已產生構件：翻譯文件（從 `docs[]` 解析的 `.md` / `.mdx` / `.astro` 輸出，包括來源已移除的孤立輸出 — 透過掃描每個區塊的輸出樹找到，除非配置了自訂 `pathTemplate`），每個地區設定的平面 UI 檔案 (`<flatOutputDir>/<locale>.json`)，以及該地區設定在 `strings.json` 中的條目。

地區設定透過可重複的 `-l` / `--locale` 傳遞（正規化為 BCP-47）。輸出每個地區設定的計數（快取列、文件、`strings.json` 條目、平面檔案）；對於沒有任何內容可清除的地區設定發出警告（而非錯誤）。除非 `-y` / `--yes` / `-f` / `--force`，否則會提示確認。`--dry-run`：報告計數和將被移除的檔案，不刪除任何內容。`--keep-files`：僅清除 SQLite 快取，保留已產生的檔案和 `strings.json` 不變。除非傳遞 `--backup <path>`，否則不會建立 SQLite 備份，該參數會在刪除前將備份寫入該路徑。

**關鍵選項：** `-l` / `--locale`、`--dry-run`、`-y` / `--yes`、`-f` / `--force`、`--keep-files`、`--backup`
