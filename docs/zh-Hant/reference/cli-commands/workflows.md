<a id="cli--workflows--status"></a>
# CLI — 工作流程與狀態

<a id="sync"></a>
### `sync`

**概要：** `ai-i18n-tools sync [options]`

擷取（若已啟用），接著 UI 翻譯，然後在設定 `features.translateSVG` 與 `config.svg` 時執行 `translate-svg`，接著文件翻譯，然後在設定 `features.translateJson` 與 `json[]` 時執行 `translate-json` — 除非以 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳過。

**主要選項：** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` 會轉發至 UI 與 SVG 步驟以及 docs/JSON；`--force-update` 適用於 docs、JSON 與 SVG（不適用 UI）。文件階段亦轉發 `--emphasis-placeholders` 與 `--debug-failed`（意義與 `translate-docs` 相同）。`--prompt-format` 並非 `sync` 旗標；docs 與 JSON 步驟使用內建預設值（`json-array`）。

---

<a id="status"></a>
### `status`

**概要：** `ai-i18n-tools status [--max-columns <n>]`

當 `features.translateUIStrings` 開啟時，按語系列印 UI 覆蓋率（`Translated` / `Missing` / `Total`）。接著按檔案 × 語系列印 Markdown 翻譯狀態（無 `--locale` 篩選器；語系來自設定）。當 `features.translateJson` 開啟且已設定 `json[]` 時，亦按區塊列印 JSON 套件狀態。大型語系清單會分割為最多 `n` 個語系欄的重複表格（預設 **9**），以確保終端機中的行寬保持窄幅。

**主要選項：** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**概要：** `ai-i18n-tools statistics [--max-columns <n>]`

列印文件快取與 `strings.json` 統計資料（與翻譯儀表板 → 統計資料相同的彙總）。`--max-columns`：每個模型 × 語系表格的語系欄上限（預設 **6**）。

**主要選項：** `--max-columns`

**另請參閱：** [儀表板統計資料](/guide/translation-dashboard/statistics)
