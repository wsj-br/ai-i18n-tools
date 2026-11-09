<a id="cli--models--languages"></a>
# CLI — 模型與語言

<a id="check-models"></a>
### `check-models`

**簡介：** `ai-i18n-tools check-models`

針對活躍供應商的 `GET /models` 列表（成員資格和 `expiration_date`）驗證每個已配置的模型 ID。需要該供應商的 API 金鑰（對於像 Ollama 這樣的無金鑰供應商則不需要）。當任何已配置的 ID 遺失或過期時，以非零值結束，並遵守已解析的請求逾時（供應商上的 `requestTimeout` 或 `requestTimeoutMs`，否則為頂層值）。當供應商回傳定價時（例如 OpenRouter），也會顯示提示/完成的每百萬個 token 的美元價格。當 `providers.cheaperinference.zeroDataRetention` 為 true 時，檢查會使用 `GET /v1/models?zdr=true` 並使目錄中遺漏的 ID 失敗。

**另請參閱：** [人工智慧模型](/zh-Hant/guide/ai-models#check-models)、[大型語言模型供應商](/zh-Hant/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**簡介：** `ai-i18n-tools list-models`

列出活躍供應商透過其 `GET /models` 列表宣傳的所有模型（按 ID 排序；活躍供應商遵循配置的 `provider` 金鑰，可使用 `-P` / `--provider` 覆寫）。需要該供應商的 API 金鑰（對於像 Ollama 這樣的無金鑰供應商則不需要）。當供應商回傳定價時（例如 OpenRouter），也會顯示提示/完成的每百萬個 token 的美元價格，並標記超過 `expiration_date` 的項目。當 `providers.cheaperinference.zeroDataRetention` 為 true 時，該列表為 `GET /v1/models?zdr=true`。

**關鍵選項：** `-P` / `--provider`

**另請參閱：** [人工智慧模型](/zh-Hant/guide/ai-models#list-models)、[大型語言模型供應商](/zh-Hant/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**概要：** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-price <usd>] [--min-delta <points>] [--refresh]`

排名活躍供應商的聊天模型並列印前幾名（預設為 8 個）。表格欄位依序為：排名、模型 ID、索引（品質分數乘以 100，一位小數）、測量的 languagebench ChrF、測量的 Arena 分數、輸入價格、輸出價格、每百萬個權杖的美元混合價格，以及前沿層級。缺少測量值時為 `—`。此指令需要該供應商的 API 金鑰（對於 Ollama 等無金鑰供應商則不需要）。活躍供應商遵循設定 `provider`；使用 `-P` / `--provider` 覆寫它。

候選項目來自供應商的 `GET /models` 列表。當 `providers.cheaperinference.zeroDataRetention` 為 true 時，該請求為 `GET /v1/models?zdr=true`。已過期的行和非聊天行（嵌入、語音、圖像、視訊、內容審核、重新排名器）將被排除。如果該目錄請求失敗，該命令將以 1 結束。

索引僅代表品質：languagebench ChrF 和 Arena 分數。價格不屬於索引的一部分。`--quality` 是預設值。它會先按索引排序，然後當兩個模型顯示相同的索引時，再按較低的混合價格排序。`--price` 會列出品質-價格帕累托前沿，最便宜的排在最前面。當另一個模型的成本不高於且索引至少相同，並且價格更低或索引更高時，該模型就被視為被支配。混合價格和索引完全相同時，共享同一層級。未被支配的模型為第 1 層，然後是第 2 層，依此類推。層級是該深度，而不是與最佳索引的距離。沒有價格的模型，然後是低於品質下限的模型，會排在前沿之後。同時傳遞兩個旗標會導致錯誤。兩者都不傳遞則表示品質。設定中可選的 `modelSuggestion` 權重會取代任一設定檔的 ChrF/Arena 組合和品質下限。請參閱[設定](/zh-Hant/reference/configuration#modelsuggestion-optional)。[儀表板模型分頁](/zh-Hant/guide/translation-dashboard/models) 使用相同的排名。

ChrF 是 languagebench `translation_from` 和 `translation_to` 列的平均值，其指標為 `chrf`，僅限於此專案的 `sourceLocale` 和 `targetLocales`。語系會對應至 languagebench 語言代碼 (主要子標籤，帶有一些別名，例如 `pt-BR` 對應至 `pt`，`zh-Hant` 對應至 `zh`，以及 `yue`)。空集合使用 `en`。Arena 是 LMArena 的整體 Arena 分數，而非 Elo。

混合價格為每百萬個權杖 `(3 × input + output) / 4` 美元。其來源依此順序解析：非零的目錄費率，然後是 models.dev 的輸入和輸出費率，最後是 languagebench 的單一成本數字。目錄價格為 `0` 表示未定價，而非免費。未知價格不會改變索引。在 `--quality` 上，它在相同索引中排在最後。在 `--price` 上，通過下限但未定價的模型會排在所有前沿層級之後。

缺少 ChrF 的模型會排在品質下限之下。當 ChrF 或 Arena 缺失時使用的預留位置值 `0.35` 和 `0.45` 只會影響索引；表格會改為列印 `—`。`frontier` 欄位對於通過下限且未被支配的定價模型顯示為 `1`，對於下一個層級顯示為 `2`，而當模型沒有價格、低於下限或為別名時則顯示為 `—`。兩個共享 ChrF、Arena 分數、輸入價格和輸出價格的 ID 互為別名。較短的 ID 會被保留，且沒有日期的 ID 優於有日期的 ID (`preview-06-05`、`20241022`)。別名行會保留在完整排名中，但會從表格、`--json` 和 `--apply` 中排除。`--list` 仍然會顯示它們。當列印的行包含被支配的模型時，表格下方會有一行標示擊敗它的第 1 層模型。

`--quality` 會將通過下限的模型排在最前面，然後是較高的指數，然後是較低的混合價格。`--top`（預設為 `8`，一個至少為 1 的整數）會在下方篩選器之後，共同限制表格、`--json` 片段和 `--apply`。

`--list` 會為當前供應商已配置的 `translationModels` 列印相同的欄位（依該順序），並忽略 `--top`。排名欄位仍為每個模型在完整排名中的位置。若已配置的 ID 在目錄中缺失、已過期或非聊天模型，仍會列出，並顯示 `—` 作為測量值。`--list` 無法與 `--apply` 結合使用。

別名行會首先被移除，除非使用 `--list`。`--max-price` 接著會保留每百萬個權杖的混合價格小於或等於該美元數量的模型。沒有混合價格的模型會被排除。`--min-delta` 接著會遍歷剩餘的行，並且只保留其索引與前一個保留模型至少相差該點數的模型。第一個剩餘的模型總是會被保留。`0` 的差異不會刪除行。當差異大於 `0` 時，沒有索引的行會被排除。排名數字會保留完整列表中的數字。使用 `--list` 時，遍歷會遵循 `translationModels` 順序並保留別名。這兩個篩選器也適用於 `--json` 和 `--apply`。對於將要應用的品質列表，`--max-price` 會在預算內保留一個備用選項，而 `--min-delta` 則會捨棄小的索引步驟。在上限下的被支配行可以保留；前沿欄位和表格下方的行會顯示它。[模型分頁](/zh-Hant/guide/translation-dashboard/models) 具有相同的兩個控制項，並且也會省略別名。

`--json` 將此物件寫入 stdout（請貼上至供應商區塊內），並將表格與歸屬頁尾發送至 stderr：

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` 會將當前配置複製到同級的 `ai-i18n-tools.config.{timestamp}.backup.json` (或當 `-c` 命名另一個檔案時為 `{name}.{timestamp}.backup.json`)，然後用這些 ID 替換 `providers.<active>.translationModels`。命名衝突會在 `.backup.json` 之前加上 `-2`、`-3` 等。如果複製失敗，配置檔案將保持不變。`uiModels` 和 `localeModels` 保持不變。分數不會寫入配置檔案。儀表板的 **更新配置** 按鈕會寫入相同的備份。

基準測試資料會快取在 `<cacheDir>/benchmark-scores.json` (通常是 `.translation-cache/benchmark-scores.json`) 七天。原始資料集會在執行時下載，不隨套件提供。`--refresh` 會重新下載 languagebench、Arena 和 models.dev。在 `--refresh` 期間失敗的來源不會從先前的快取中填入。如果沒有 `--refresh`，失敗的下載會重複使用快取的片段。如果 languagebench 或 Arena 其中之一失敗，該命令會使用另一個進行排名，並說明哪個來源失敗。如果兩者都失敗，則會以 1 結束。models.dev 失敗會保留目錄價格。儀表板沒有重新整理控制項；請從 CLI 執行 `--refresh`，然後重新載入「模型」分頁。

頁尾標註了 languagebench (CC BY-SA 4.0)、LMArena Arena Score (CC BY 4.0) 以及 models.dev (MIT)。

**主要選項：** `--quality`、`--price`、`--top`、`--json`、`--apply`、`--list`、`--max-price`、`--min-delta`、`--refresh`、`-P` / `--provider`

**另請參閱：** [人工智慧模型](/zh-Hant/guide/ai-models)、[「模型」分頁](/zh-Hant/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**簡介：** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

透過獨立翻譯一個範例（單一模型客戶端，無備援鏈）對每個已設定的模型進行基準測試。印出包含模型 ID、輸入/輸出權杖、實際翻譯時間與 USD 成本（對於不回報成本的提供者為 `—`）的表格，加上總計列與每個模型的失敗數。

模型預設為作用中提供者之 `translationModels`、`uiModels` 與 `localeModels` ID 的聯集（使用 `--model` 覆寫）；範例預設為內建的英文 Markdown 區塊（使用 `--text` / `--file` 覆寫）；來源/目標預設為設定 `sourceLocale` 與第一個 `docs[]` 目標語言環境，並備援至頂層 `targetLocales`（使用 `--source` / `--target` 覆寫）。並行執行模型，受設定 `concurrency` 限制（預設為 4）；每個模型仍會單獨計時。需要作用中提供者的 API 金鑰。

**關鍵選項：** `--model`, `--text`, `--file`, `--source`, `--target`

**另請參閱：** [人工智慧模型](/zh-Hant/guide/ai-models#bench-models)

---

<a id="list-languages"></a>
### `list-languages`

**簡介：** `ai-i18n-tools list-languages [search]`

將隨附的 UI 語言目錄（`data/ui-languages-complete.json`）列為人類可讀的表格（代碼、文字方向、英文名稱、原生名稱）。不需要設定或 API 金鑰。傳遞選用的 `search` 詞彙，以僅保留代碼、原生名稱、英文名稱或方向包含該詞彙的項目（不區分大小寫），例如 `list-languages portuguese`、`list-languages rtl`、`list-languages zh`。
