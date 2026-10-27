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

**概要：** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

對活躍供應商的聊天模型進行排名，並列印排名前幾的模型（預設為 8 個）。表格欄位依序為：排名、模型 ID、指數（加權分數乘以 100，一位小數）、測量的 languagebench ChrF、測量的 Arena 分數，以及每 1M 權杖的輸入和輸出價格（美元）。缺少測量值時為 `—`。此指令需要該供應商的 API 金鑰（對於無金鑰供應商，例如 Ollama，則不需要）。活躍供應商遵循設定 `provider`；可使用 `-P` / `--provider` 覆寫。

候選項目來自供應商的 `GET /models` 列表。當 `providers.cheaperinference.zeroDataRetention` 為 true 時，該請求為 `GET /v1/models?zdr=true`。已過期的行和非聊天行（嵌入、語音、圖像、視訊、內容審核、重新排名器）將被排除。如果該目錄請求失敗，該命令將以 1 結束。

`--quality` 為預設值。它將 ChrF 與 Arena 分數的權重置於價格之上。`--price` 將價格權重置於這些分數之上，同時維持品質底線，確保未經測量的廉價模型不會直接跳到清單前列。同時傳入兩個旗標會導致錯誤。若兩者皆未傳入，則預設為品質優先。配置中可選的 `modelSuggestion` 權重可取代任一設定檔。請參閱 [Configuration](/zh-Hant/reference/configuration#modelsuggestion)。相同的權重也用於 [dashboard Models tab](/zh-Hant/guide/translation-dashboard/models)。

ChrF 是 languagebench `translation_from` 與 `translation_to` 列的平均值，其指標為 `chrf`，並限制於本專案的 `sourceLocale` 與 `targetLocales`。地區設定會對應至 languagebench 語言代碼（主要子標籤，包含少數別名，例如 `pt-BR` 對應 `pt`，以及 `zh-Hant` 對應 `zh` 與 `yue`）。空集合將使用 `en`。Arena 指的是 LMArena 整體 Arena 分數，而非 Elo。排名價格為每 100 萬個 token `(3 × input + output) / 4` 美元。價格來源依序為：非零的目錄費率、models.dev 輸入與輸出費率，最後是 languagebench 的單一成本數據。目錄價格為 `0` 表示未定價，而非免費。未知的價格在品質設定檔中視為中性，在價格設定檔中則視為最差。缺失 ChrF 的模型排序將低於品質底線。用於缺失 ChrF 或 Arena 的 `0.35` 與 `0.45` 替代值僅影響索引計算；表格中會顯示 `—`。

達到門檻的列優先顯示，接著是較高的指數，然後是較低的混合價格。`--top`（預設為 `8`，一個至少為 1 的整數）在下方篩選器之後，共同限制表格、`--json` 片段和 `--apply`。

`--list` 會為當前供應商已配置的 `translationModels` 列印相同的欄位（依該順序），並忽略 `--top`。排名欄位仍為每個模型在完整排名中的位置。若已配置的 ID 在目錄中缺失、已過期或非聊天模型，仍會列出，並顯示 `—` 作為測量值。`--list` 無法與 `--apply` 結合使用。

`--max-output-price` 會保留每 100 萬個 token 輸出價格小於或等於該金額（美元）的模型。無輸出價格的模型將被排除。`--min-delta` 隨後會遍歷剩餘的列，僅在模型索引比前一個保留的模型低至少該數值時才保留該模型。第一個剩餘的模型永遠會被保留。增量為 `0` 時不會刪除列。當增量大於 `0` 時，無索引的列將被排除。排名數字保持完整清單中的數值。使用 `--list` 時，遍歷將遵循 `translationModels` 順序。這兩個篩選器也適用於 `--json` 與 `--apply`。[Models tab](/zh-Hant/guide/translation-dashboard/models) 具有相同的兩個控制項。

`--json` 將此物件寫入 stdout（請貼上至供應商區塊內），並將表格與歸屬頁尾發送至 stderr：

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` 會將當前配置複製到同級的 `ai-i18n-tools.config.{timestamp}.backup.json` (或當 `-c` 命名另一個檔案時為 `{name}.{timestamp}.backup.json`)，然後用這些 ID 替換 `providers.<active>.translationModels`。命名衝突會在 `.backup.json` 之前加上 `-2`、`-3` 等。如果複製失敗，配置檔案將保持不變。`uiModels` 和 `localeModels` 保持不變。分數不會寫入配置檔案。儀表板的 **更新配置** 按鈕會寫入相同的備份。

基準測試數據會快取在 `<cacheDir>/benchmark-scores.json`（通常為 `.translation-cache/benchmark-scores.json`）中，為期 7 天。原始資料集會在執行階段下載，並不會隨套件一同發布。`--refresh` 會重新下載 languagebench、Arena 以及 models.dev。若來源在 `--refresh` 期間失敗，則不會從先前的快取中填入資料。若沒有 `--refresh`，失敗的下載會重複使用已快取的片段。如果 languagebench 或 Arena 其中之一失敗，該指令會使用另一個來源進行排名，並說明哪個來源失敗。如果兩者皆失敗，則會以代碼 1 結束。models.dev 失敗時會保留目錄價格。儀表板沒有重新整理控制項；請從 CLI 執行 `--refresh`，然後重新載入「模型」(Models) 分頁。

頁尾標註了 languagebench (CC BY-SA 4.0)、LMArena Arena Score (CC BY 4.0) 以及 models.dev (MIT)。

**主要選項：** `--quality`、`--price`、`--top`、`--json`、`--apply`、`--list`、`--max-output-price`、`--min-delta`、`--refresh`、`-P` / `--provider`

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
