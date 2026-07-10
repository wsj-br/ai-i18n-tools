<a id="cli--models--catalog"></a>
# CLI — 模型與目錄

<a id="check-models"></a>
### `check-models`

**簡介：** `ai-i18n-tools check-models`

根據作用中提供者的 `GET /models` 清單（成員資格與 `expiration_date`）驗證每個已設定的模型 ID。需要該提供者的 API 金鑰（Ollama 等無金鑰提供者則不需要）。當任何已設定的 ID 缺失或過期時，會以非零狀態結束，並遵守提供者的 `requestTimeoutMs`。當提供者回傳定價（例如 OpenRouter）時，也會顯示每 1M 權杖的提示/完成 USD 成本。

**另請參閱：** [LLM 提供者](/zh-Hant/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**簡介：** `ai-i18n-tools list-models`

列出作用中提供者透過其 `GET /models` 清單發佈的每個模型（依 ID 排序；作用中提供者遵循設定 `provider` 金鑰，使用 `-P` / `--provider` 覆寫）。需要該提供者的 API 金鑰（Ollama 等無金鑰提供者則不需要）。當提供者回傳定價（例如 OpenRouter）時，也會顯示每 1M 權杖的提示/完成 USD 成本，並標記超過 `expiration_date` 的項目。

**關鍵選項：** `-P` / `--provider`

**另請參閱：** [LLM 提供者](/zh-Hant/guide/providers-and-models)

---

<a id="bench-models"></a>
### `bench-models`

**簡介：** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

透過獨立翻譯一個範例（單一模型客戶端，無備援鏈）對每個已設定的模型進行基準測試。印出包含模型 ID、輸入/輸出權杖、實際翻譯時間與 USD 成本（對於不回報成本的提供者為 `—`）的表格，加上總計列與每個模型的失敗數。

模型預設為作用中提供者之 `translationModels`、`uiModels` 與 `localeModels` ID 的聯集（使用 `--model` 覆寫）；範例預設為內建的英文 Markdown 區塊（使用 `--text` / `--file` 覆寫）；來源/目標預設為設定 `sourceLocale` 與第一個 `docs[]` 目標語言環境，並備援至頂層 `targetLocales`（使用 `--source` / `--target` 覆寫）。並行執行模型，受設定 `concurrency` 限制（預設為 4）；每個模型仍會單獨計時。需要作用中提供者的 API 金鑰。

**關鍵選項：** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**簡介：** `ai-i18n-tools list-languages [search]`

將隨附的 UI 語言目錄（`data/ui-languages-complete.json`）列為人類可讀的表格（代碼、文字方向、英文名稱、原生名稱）。不需要設定或 API 金鑰。傳遞選用的 `search` 詞彙，以僅保留代碼、原生名稱、英文名稱或方向包含該詞彙的項目（不區分大小寫），例如 `list-languages portuguese`、`list-languages rtl`、`list-languages zh`。
