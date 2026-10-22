<a id="cli--workflows--reporting"></a>
# CLI — 工作流程與報告

<a id="sync"></a>
### `sync`

**概要：** `ai-i18n-tools sync [options]`

擷取（若已啟用），接著 UI 翻譯，然後在設定 `features.translateSVG` 與 `config.svg` 時執行 `translate-svg`，接著文件翻譯，然後在設定 `features.translateJson` 與 `json[]` 時執行 `translate-json` — 除非以 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳過。

**主要選項：** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` 會轉發至 UI 與 SVG 步驟以及 docs/JSON；`--force-update` 適用於 docs、JSON 與 SVG（不適用於 UI）。`--check-cache` 會轉發至 docs、JSON 與 SVG：即使檔案追蹤會跳過，它仍會針對強制使用原生文字的地區重新驗證快取區段。Docs 階段亦會轉發 `--emphasis-placeholders`（與 `translate-docs` 意義相同）。全域 `--debug-failed` 會在 `cacheDir` 下為每次被捨棄的模型嘗試（包括 SVG/docs 指令稿後備）寫入 `FAILED-TRANSLATION` 日誌，而非僅在鏈中所有模型皆失敗時才寫入。`--prompt-format` 並非 `sync` 旗標；docs 與 JSON 步驟使用內建預設值（`json-array`）。

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

**另請參閱：** [儀表板統計資料](/zh-Hant/guide/translation-dashboard/statistics)

---

<a id="usage"></a>
### `usage`

**摘要：** `ai-i18n-tools usage [--since <when>] [--provider <name>] [--model <id>] [--operation <name>] [-l <code>] [--outcome accepted|discarded] [--clear] [--older-than <when>] [--dry-run]`

列印已記錄的模型 API 呼叫統計資料（呼叫次數、Token 數量以及單一 USD 成本）。成本為提供者的 `usage.cost`（若存在，包含 `0`），否則為該模型的 `providers.<name>.modelPricing`，否則為提供者層級的 `providers.<name>.pricing` 預設值，否則為 models.dev 針對該模型 ID 的輸入與輸出定價。已報告的成本與明確的設定費率絕不會被取代。未知的成本會保持為 `—`，絕不會是 `$0.00`。新的呼叫會儲存該金額；若舊的資料列已有 Token 但無儲存的成本，則會在執行報告時進行估算。其彙總方式與「翻譯儀表板 → 使用量與成本」相同。超過七個 UTC 日曆天的詳細資料列會被併入每月 `api_totals`；報告會結合這兩個資料表。`--since` 接受 `YYYY-MM-DD`、持續時間（`30m`、`1h`、`6h`、`12h`、`24h`、`7d`、`30d`）或日曆月視窗（`1mo`、`2mo`、`3mo`）。`--clear` 會刪除詳細資料列與每月總計（`--older-than` 為 `1mo`、`2mo`、`3mo`、`6mo`、`1y` 或 `all`；`--dry-run` 則會在不刪除的情況下報告計數）。

**主要選項：** `--since`、`--provider`、`--model`、`--operation`、`-l` / `--locale`、`--outcome`、`--clear`、`--older-than`、`--dry-run`

**另請參閱：** [儀表板使用量與成本](/zh-Hant/guide/translation-dashboard/usage)
