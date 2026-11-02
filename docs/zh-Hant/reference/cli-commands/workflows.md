<a id="cli--workflows--reporting"></a>
# CLI — 工作流程與報告

<a id="sync"></a>
### `sync`

**概要：** `ai-i18n-tools sync [options]`

擷取（若已啟用），接著 UI 翻譯，然後在設定 `features.translateSVG` 與 `config.svg` 時執行 `translate-svg`，接著文件翻譯，然後在設定 `features.translateJson` 與 `json[]` 時執行 `translate-json` — 除非以 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳過。

**主要選項：** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` 會清除文件、JSON 和 SVG 區段快取以及檔案追蹤。它不會轉發到 UI 翻譯；請使用 `translate-ui --force` 或 `sync-ui --force` 重新翻譯 `strings.json`。`--force-update` 適用於文件、JSON 和 SVG (不適用於 UI)。`--no-ui`、`--no-svg`、`--no-docs` 和 `--no-json` 會在執行一次時跳過該步驟。`--file` 限制翻譯哪些檔案，並且仍然使用文件區塊中的每個 Markdown 檔案重寫平面同級連結。`--check-cache` 會轉發到文件、JSON 和 SVG：它會針對具有強制原生指令碼的地區設定重新驗證快取的區段，即使檔案追蹤會跳過。文件階段也會轉發 `--emphasis-placeholders` (與 `translate-docs` 意義相同)。全域 `--debug-failed` 會在 `cacheDir` 下為每個捨棄的模型嘗試 (包括 SVG/文件指令碼備用) 寫入 `FAILED-TRANSLATION` 記錄，而不僅僅是在鏈中的每個模型都失敗時。`--prompt-format` 不是 `sync` 旗標；文件和 JSON 步驟使用內建預設值 (`json-array`)。

---

<a id="status"></a>
### `status`

**概要：** `ai-i18n-tools status [--max-columns <n>]`

當 `features.translateUIStrings` 啟用時，輸出每個語言環境的 UI 覆蓋率 (`Translated` / `Missing` / `Placeholder issues` / `Total`)。`Placeholder issues` 計算儲存的翻譯中，重新命名、刪除、發明或重新定位佔位符的行數。然後輸出每個檔案和語言環境的 Markdown 翻譯狀態 (無 `--locale` 篩選；語言環境來自配置)。當 `features.translateJson` 啟用且 `json[]` 已配置時，也輸出每個區塊的 JSON 資源包狀態。大型語言環境列表會被分割成重複的表格，每個表格最多包含 `n` 個語言環境欄位 (預設為 **9**)，以便終端機中的行能保持窄小。

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
