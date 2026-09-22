<a id="llm-providers-and-models"></a>
# LLM 供應商與模型

每個翻譯管線 — `translate-ui`、`translate-docs`、`translate-json` 與 `translate-svg` — 都透過相同的供應商無關用戶端將文字傳送至 LLM。在任何這些指令執行之前，請在 `ai-i18n-tools.config.json` 中設定**至少一個供應商**，並在您的環境或 `.env` 中設定對應的**API 金鑰**（除了 **Ollama** 之外的內建預設值）。`init` 會寫入起始的 `provider` / `providers` 區塊；您仍須為使用中的預設值提供憑證。

您只需在設定中設定一次**要呼叫哪個 API 端點**與**要嘗試哪些模型**；所有翻譯指令都會共用該設定與相同的 SQLite 快取。

CLI 從頂層 `provider` 鍵（或當只設定一個時，`providers` 中的唯一條目）解析活動供應商。每個供應商區塊列出一個有序的 `translationModels` 備用鏈；內建預設值會自動繼承 `baseUrl` 和 API 鍵環境變數（必要時可針對每個供應商覆寫它們）。

<a id="built-in-providers"></a>
### 內建供應商

預設供應商鍵只需 `translationModels` — 基本 URL 和 API 鍵環境變數會自動填入：

| 提供者 | 基本 URL | API 金鑰環境變數 |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (無) |

對於任何**非預設**鍵，請在設定中明確設定 `baseUrl` 和 `apiKeyEnv`。

在您的環境或 `.env` 檔案中設定活動供應商的 API 鍵。CLI 會自動從工作目錄載入 `.env`，而不會覆寫 shell 中已設定的變數。請參閱[環境變數](/zh-Hant/reference/environment-variables)。

<a id="model-fallback-chain"></a>
### 模型備用鏈

`translationModels` 是一個**有序列表**，而非單一選擇。CLI 會先嘗試第一個模型；若在請求、解析或腳本錯誤時失敗，便會移至下一個項目。請設定多個模型，這樣短暫的服務中斷或某個模型難以處理特定地區設定（例如使用羅馬拼音的印地語而非天城文）時，就不會阻礙整個執行過程。對於原生腳本地區設定，系統會拒絕羅馬拼音輸出；若某個地區設定應保持羅馬拼音，則必須使用明確的 `-Latn` 子標籤進行設定（例如 `hi-Latn`）。

**解析層次** (去重，保持順序):

| 管道 | 順序 |
| --- | --- |
| UI (`translate-ui`, 複數, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| 文件，JSON，SVG | `localeModels(locale)` → `translationModels` |

可選的 `providers.<active>.uiModels` 是一個僅限 UI 的清單，在任何匹配的本地化覆蓋和全局 `translationModels` 鏈之前嘗試。可選的 `providers.<active>.localeModels` 將 BCP-47 本地化映射到每個管道中為該本地化**首先**嘗試的模型（`pt-br` 匹配 `pt-BR`）。當沒有 `localeModels` 項目匹配時，僅應用管道特定的層次。

不同的提供者和模型在不同語言中的成本、速度和質量各不相同。將 `npx ai-i18n-tools init` 的默認清單視為起點——當某個本地化始終產生不良結果時擴展它，或為該本地化添加 `localeModels` 項目。默認值和理由：[配置 — `provider` 和 `providers`](/zh-Hant/reference/configuration#provider-and-providers)。

**UI 字串：** 選用的 `uiModels` 讓您在全域 `translationModels` 鏈之前，將 `translate-ui`、複數生成與 `proofread-ui` 路由至進階模型 — 這很有用，因為 UI 文案簡短但面向使用者。

**亞洲區域設定：** 在每個管線中，會優先嘗試針對 `ja`、`ko`、`zh-Hans` 和 `zh-Hant` 的選用 `localeModels` 項目；像是 `z-ai/glm-5.3` 和 `minimax/minimax-m2.7` 這類模型在處理 CJK 文字時的表現，通常優於通用的備援方案。

範例設定 (OpenRouter)。`translationModels` 和 `uiModels` 是此儲存庫在 `ai-i18n-tools.config.json` 中使用的清單。`localeModels` 是 CJK 語言環境的選用建議附加元件；此儲存庫並未設定它。

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3.7-max",
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4",
        "google/gemini-3.5-flash",
        "tencent/hy-mt2-30b-a3b",
        "mistralai/mistral-large",
        "openai/gpt-4o-mini",
        "cohere/command-r-plus-08-2024",
        "qwen/qwen-2.5-72b-instruct"  
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] }
      ]
    }
  }
}
```

<a id="validate-and-compare-models"></a>
### 驗證和比較模型

在更改 `translationModels` 之前，請確認每個 ID 在活動供應商上仍然可用：

```bash
npx ai-i18n-tools check-models
```

`check-models` 呼叫提供者的 `GET /models` 端點，驗證來自 `translationModels`、`uiModels` 和 `localeModels` 的每一個 id，報告缺失或已過 `expiration_date` 的 id，並在任何配置的 id 無效時以非零值退出。當提供者返回價格（OpenRouter 會這樣做時），它還會顯示每 1M 標記的預估 USD。

瀏覽供應商宣傳的完整目錄：

```bash
npx ai-i18n-tools list-models
```

對已設定的模型進行效能基準測試，使用真實翻譯樣本——`translationModels`、`uiModels` 和 `localeModels` 中的每個唯一識別碼都會獨立執行，方便您比較實際耗時、權杖使用量和成本：

```bash
npx ai-i18n-tools bench-models
```

覆寫樣本文字、語言環境或模型列表：

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

指令詳情：[CLI 參考](/zh-Hant/reference/cli-commands/)。

<a id="multiple-providers"></a>
### 多個供應商

當配置了多個供應商時，設定頂層 `provider` 鍵以選擇預設值。無需編輯配置即可在每次運行時切換：

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

每個提供者區塊可定義自己的 `translationModels`、選用的 `uiModels` 和 `localeModels`、`maxTokens`、`temperature`，以及 `requestTimeout`（秒）或 `requestTimeoutMs`。提供者上的逾時會覆寫頂層的 `requestTimeout` / `requestTimeoutMs`。舊式頂層 `openrouter` 區塊仍會被接受，並在載入時自動遷移至 `providers.openrouter`。

當提供者省略 `usage.cost` 時，選用的 `pricing` 和 `modelPricing` 可設定每 1,000,000 個 token 的美元價格（`inputPerMTokens` 和 `outputPerMTokens`）。`pricing` 是整個提供者的預設值；`modelPricing` 項目會針對單一模型 ID 覆寫此設定。OpenRouter 本身就會傳回每次呼叫的成本，因此對於該提供者，請將兩者保持未設定。提供者回報的成本會照原樣保留。該金額會包含在翻譯摘要、[`usage`](/zh-Hant/reference/cli-commands/workflows#usage) 以及[使用量與成本](/zh-Hant/guide/translation-dashboard/usage) 中。

在同一份文件上使用四個供應商的可執行範例，包含範例費率：[`examples/multi-provider`](/zh-Hant/examples#multi-provider)。

<a id="further-reference"></a>
### 延伸參考

- [設定 — `provider` 和 `providers`](/zh-Hant/reference/configuration#provider-and-providers) — 預設表格、自訂端點、請求逾時、成本費率、OpenRouter 專屬行為。
- [架構 — LLM 用戶端](/zh-Hant/reference/architecture) — 模型回退、批次處理和成本回報的內部運作方式。
- [環境變數](/zh-Hant/reference/environment-variables) — API 金鑰環境變數和基底 URL 覆寫。
