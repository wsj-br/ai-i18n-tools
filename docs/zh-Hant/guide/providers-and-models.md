<a id="llm-providers-and-models"></a>
# LLM 提供者

每個翻譯管線 — `translate-ui`、`translate-docs`、`translate-json` 與 `translate-svg` — 都透過相同的供應商無關用戶端將文字傳送至 LLM。在任何這些指令執行之前，請在 `ai-i18n-tools.config.json` 中設定**至少一個供應商**，並在您的環境或 `.env` 中設定對應的**API 金鑰**（除了 **Ollama** 之外的內建預設值）。`init` 會寫入起始的 `provider` / `providers` 區塊；您仍須為使用中的預設值提供憑證。

您只需在設定檔中設定一次**要呼叫哪個 API 端點**；所有翻譯指令都會共用該設定和相同的 SQLite 快取。該提供者會嘗試哪些模型則是另一個步驟：[AI 模型](/zh-Hant/guide/ai-models)。

CLI 從頂層 `provider` 鍵（或當只設定一個時，`providers` 中的唯一條目）解析活動供應商。每個供應商區塊列出一個有序的 `translationModels` 備用鏈；內建預設值會自動繼承 `baseUrl` 和 API 鍵環境變數（必要時可針對每個供應商覆寫它們）。

<a id="built-in-providers"></a>
### 內建供應商

預設供應商鍵只需 `translationModels` — 基本 URL 和 API 鍵環境變數會自動填入：

<div class="provider-presets">

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
| `cheaperinference` | `https://api.cheaperinference.com/v1` | `CHEAPERINFERENCE_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (無) |

</div>

對於任何**非預設**鍵，請在設定中明確設定 `baseUrl` 和 `apiKeyEnv`。

在您的環境或 `.env` 檔案中設定活動供應商的 API 鍵。CLI 會自動從工作目錄載入 `.env`，而不會覆寫 shell 中已設定的變數。請參閱[環境變數](/zh-Hant/reference/environment-variables)。

<a id="cheaperinference-zero-data-retention"></a>
### 零資料保留 (Cheaper Inference)

`providers.cheaperinference.zeroDataRetention` 為選用，預設為關閉。當此專案必須僅透過不保留提示的供應商傳送提示時，請設定此項。

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

啟用此旗標後，每個聊天請求都會包含 `"zdr": true`，且 `list-models`、`check-models` 和 `suggest-models` (包括儀表板的「模型」分頁) 會讀取 `GET /v1/models?zdr=true`。該目錄會列出零資料保留請求可使用的模型，並以零資料保留價格計費。`check-models` 會將該目錄中遺失的 ID 視為無效。此旗標不會為目錄中未列出的模型建立路由。請從 `translationModels`、`uiModels` 或 `localeModels` 中移除該 ID。

當 Cheaper Inference 帳戶不需要零資料保留時，請保持旗標關閉。如果帳戶已啟用[資料保護](https://platform.cheaperinference.com/dashboard/data-protection)，Cheaper Inference 仍會拒絕沒有零資料保留路由的模型。錯誤會指出該模型。若要保留帳戶政策，請將 `zeroDataRetention` 設定為 `true` 並切換到零資料保留目錄中的模型。若要保留被拒絕的模型，請在該頁面上關閉零資料保留。備援鏈會接著嘗試下一個已設定的模型。

<a id="model-fallback-chain"></a>
<a id="validate-and-compare-models"></a>
### 模型

選擇模型、備援清單，以及 `suggest-models`、`check-models`、`list-models` 和 `bench-models` 的相關說明請見 [AI 模型](/zh-Hant/guide/ai-models)。

<a id="multiple-providers"></a>
### 多個供應商

當配置了多個供應商時，設定頂層 `provider` 鍵以選擇預設值。無需編輯配置即可在每次運行時切換：

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

每個提供者區塊可定義自己的 `translationModels`、選用的 `uiModels` 和 `localeModels`、`maxTokens`、`temperature`，以及 `requestTimeout`（秒）或 `requestTimeoutMs`。提供者上的逾時會覆寫頂層的 `requestTimeout` / `requestTimeoutMs`。舊式頂層 `openrouter` 區塊仍會被接受，並在載入時自動遷移至 `providers.openrouter`。

當提供者省略 `usage.cost` 時，選用的 `pricing` 和 `modelPricing` 可設定每 1,000,000 個 token 的美元價格（`inputPerMTokens` 和 `outputPerMTokens`）。`pricing` 是全提供者的預設值；`modelPricing` 項目會覆寫特定模型 id 的設定。OpenRouter 和 Cheaper Inference 已經會回傳每次呼叫的成本，因此在這些提供者上請勿設定這兩項。提供者回傳的成本將按原樣保留。該金額會包含在翻譯摘要、[`usage`](/zh-Hant/reference/cli-commands/workflows#usage) 以及 [使用量與成本](/zh-Hant/guide/translation-dashboard/usage) 中。

在同一份文件上使用四個供應商的可執行範例，包含範例費率：[`examples/multi-provider`](/zh-Hant/examples#multi-provider)。

<a id="further-reference"></a>
### 延伸參考

- [AI 模型](/zh-Hant/guide/ai-models) — 排名候選清單、備援清單以及模型指令。
- [設定 — `provider` 與 `providers`](/zh-Hant/reference/configuration#provider-and-providers) — 預設表格、自訂端點、請求逾時、成本費率、Cheaper Inference 零資料保留、OpenRouter 特定行為。
- [架構 — LLM 用戶端](/zh-Hant/reference/architecture) — 模型備援、批次處理和成本報告的內部運作方式。
- [環境變數](/zh-Hant/reference/environment-variables) — API 金鑰環境變數以及基礎 URL 覆寫。
