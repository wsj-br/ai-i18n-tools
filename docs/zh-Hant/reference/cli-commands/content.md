<a id="cli--other-content"></a>
# CLI — 其他內容

<a id="translate-json"></a>
### `translate-json`

**概要：** `ai-i18n-tools translate-json [options]`

根據 `json[]` 翻譯巢狀 JSON（需要 `features.translateJson`）。共享 SQLite 快取。

**主要選項：** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**另請參閱：** [JSON](/zh-Hant/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**概要：** `ai-i18n-tools translate-svg [options]`

翻譯在 `config.svg` 中設定的 SVG 檔案（與文件分開）。需要 `features.translateSVG`。與文件使用相同的快取機制；支援 `--no-cache` 以在該次執行中跳過 SQLite 讀取/寫入。

**主要選項：** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**另請參閱：** [SVG 翻譯](/zh-Hant/guide/svg-translation/)
