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

**解析層次** (去重，保持順序):

| 管道 | 順序 |
| --- | --- |
| UI (`translate-ui`, 複數, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| 文件，JSON，SVG | `localeModels(locale)` → `translationModels` |

可選的 `providers.<active>.uiModels` 是一個僅限 UI 的清單，在任何匹配的本地化覆蓋和全局 `translationModels` 鏈之前嘗試。可選的 `providers.<active>.localeModels` 將 BCP-47 本地化映射到每個管道中為該本地化**首先**嘗試的模型（`pt-br` 匹配 `pt-BR`）。當沒有 `localeModels` 項目匹配時，僅應用管道特定的層次。

不同的提供者和模型在不同語言中的成本、速度和質量各不相同。將 `npx ai-i18n-tools init` 的默認清單視為起點——當某個本地化始終產生不良結果時擴展它，或為該本地化添加 `localeModels` 項目。默認值和理由：[配置 — `provider` 和 `providers`](/reference/configuration#provider-and-providers)。

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
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest"
      ],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
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

指令詳情：[CLI 參考](/reference/cli-commands/)。

<a id="multiple-providers"></a>
### 多個供應商

當配置了多個供應商時，設定頂層 `provider` 鍵以選擇預設值。無需編輯配置即可在每次運行時切換：

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

每個提供者塊可以定義自己的 `translationModels`，可選的 `uiModels` 和 `localeModels`，`maxTokens`，`temperature` 和 `requestTimeoutMs`。仍然接受遺留的頂層 `openrouter` 塊，並在加載時自動遷移到 `providers.openrouter`。

在同一文件中包含四個提供者的可執行範例：[`examples/multi-provider`](/examples#multi-provider)。

<a id="further-reference"></a>
### 延伸參考

- [組態 — `provider` 和 `providers`](/reference/configuration#provider-and-providers) — 預設表格、自訂端點、請求逾時、OpenRouter 特定行為。
- [架構 — LLM 用戶端](/reference/architecture) — 模型回退、批次處理和成本報告的內部運作方式。
- [環境變數](/reference/environment-variables) — API 密鑰環境變數和基礎 URL 覆寫。
