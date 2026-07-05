<a id="llm-providers-and-models"></a>
# LLM 供應商與模型

每個翻譯管道 — `translate-ui`、`translate-docs`、`translate-json` 和 `translate-svg` — 都透過相同的供應商無關用戶端將文字傳送至大型語言模型。您在 `ai-i18n-tools.config.json` 中設定**要呼叫哪個 API 端點**以及**要嘗試哪些模型**；所有指令都共用該設定和相同的 SQLite 快取。

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

在您的環境或 `.env` 檔案中設定活動供應商的 API 鍵。CLI 會自動從工作目錄載入 `.env`，而不會覆寫 shell 中已設定的變數。請參閱[環境變數](/reference/environment-variables)。

<a id="model-fallback-chain"></a>
### 模型備用鏈

`translationModels` 是一個**有序列表**，而不是單一選擇。CLI 會嘗試第一個模型；如果請求或解析失敗，它會移至下一個條目。設定多個模型，這樣暫時性中斷或難以處理特定語言環境的模型就不會阻礙整個執行。

僅針對 `translate-ui`，可選的 `ui.preferredModel` 會在供應商的 `translationModels` 列表（已去重）**之前**嘗試。

不同的供應商和模型在不同語言的成本、速度和品質上有所差異。將 `npx ai-i18n-tools init` 中的預設列表視為起點 — 當某個語言環境持續產生不良結果時，請擴展它。完整的預設值和原理：[設定 — `provider` 和 `providers`](/reference/configuration#provider-and-providers)。

最小設定範例 (OpenRouter)：

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3-235b-a22b-2507",
        "openai/gpt-4o-mini",
        "deepseek/deepseek-v4-flash"
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

`check-models` 呼叫供應商的 `GET /models` 端點，報告遺失或已過期 `expiration_date` 的 ID，並且當任何配置的 ID 無效時，以非零值退出。當供應商返回定價時 (OpenRouter 會)，它還會顯示每 1M 令牌的估計美元費用。

瀏覽供應商宣傳的完整目錄：

```bash
npx ai-i18n-tools list-models
```

在真實翻譯樣本上基準測試已配置的模型 — 每個模型獨立運行，因此您可以比較實際時間、令牌使用量和成本：

```bash
npx ai-i18n-tools bench-models
```

覆寫樣本文字、語言環境或模型列表：

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --models openai/gpt-4o-mini,anthropic/claude-3-haiku
```

指令詳情：[CLI 參考](/reference/cli-commands)。

<a id="multiple-providers"></a>
### 多個供應商

當配置了多個供應商時，設定頂層 `provider` 鍵以選擇預設值。無需編輯配置即可在每次運行時切換：

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

每個提供者區塊都可以定義自己的 `translationModels`、`maxTokens`、`temperature` 和 `requestTimeoutMs`。傳統的頂層 `openrouter` 區塊仍然接受，並在載入時自動遷移到 `providers.openrouter`。

在同一文件中包含四個提供者的可執行範例：[`examples/multi-provider`](/examples#multi-provider)。

<a id="further-reference"></a>
### 延伸參考

- [組態 — `provider` 和 `providers`](/reference/configuration#provider-and-providers) — 預設表格、自訂端點、請求逾時、OpenRouter 特定行為。
- [架構 — LLM 用戶端](/reference/architecture) — 模型回退、批次處理和成本報告的內部運作方式。
- [環境變數](/reference/environment-variables) — API 密鑰環境變數和基礎 URL 覆寫。
