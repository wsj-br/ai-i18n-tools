<a id="ai-models"></a>
# AI 模型

模型是您供應商上的一個具名系統，例如 `google/gemini-2.5-flash` 或 `gpt-5-mini`。`init` 會為您選擇的供應商編寫一份初始的 `translationModels` 清單。請將該清單視為一個起點。

使用 `suggest-models` 或在翻譯儀表板的 **模型** 下使用相同的排名，為此專案選擇清單。兩者都會根據已發布的基準對當前供應商的聊天模型進行排名，並可將結果寫入 `translationModels`。請先設定供應商及其 API 金鑰：[LLM 供應商](/zh-Hant/guide/providers-and-models)。

<a id="start-with-a-ranked-shortlist"></a>
## 從排名後的候選清單開始

<a id="from-the-command-line"></a>
### 從命令列

`suggest-models` 會對當前供應商目前提供的聊天模型進行排名，並印出一份簡短的表格。預設為品質優先：翻譯測量指標和一般偏好分數的權重高於價格。

```bash
ai-i18n-tools suggest-models
```

欄位包括排名、模型 ID、指數、測量的 ChrF、測量的 Arena 分數，以及每百萬個權杖的輸入和輸出價格 (美元)。若測量值缺失，則顯示為 `—`。指數是加權分數乘以 100。在品質排名中，指數越高，表示與此專案的匹配度越強。

當表格看起來正確時，將該候選清單寫入設定檔：

```bash
ai-i18n-tools suggest-models --apply
```

`--apply` 會取代 `providers.<active>.translationModels`。它會先將目前的設定檔複製到同層級的 `ai-i18n-tools.config.{timestamp}.backup.json`。`uiModels` 和 `localeModels` 保持不變。`--top` (預設為 8) 是表格和 `--apply` 包含的 ID 數量。第一個 ID 是翻譯會最先嘗試的 ID。

`--price` 會優先考慮較低的費率，但仍會維持品質底線，因此沒有測量值的廉價模型排名會低於有分數的模型。`--quality` 是預設值。同時傳遞這兩個旗標會導致錯誤。

<a id="from-the-dashboard"></a>
### 從儀表板

**模型** 標籤頁會顯示相同的排名，且每一列都有一個核取方塊。

```bash
ai-i18n-tools dashboard
```

開啟 **模型**。選擇 **品質** 或 **價格**。勾選您想要的列。已勾選的列，由上至下，即為翻譯將嘗試的順序。**更新設定檔** 會要求確認，寫入同類型的備份，並將該順序儲存至 `translationModels`。當您想自行貼上時，**複製 JSON** 會將 `{ "translationModels": [...] }` 片段放到剪貼簿上。

**最高輸出價格** 和 **最小指數差異** 分別對應 `suggest-models --max-output-price` 和 `--min-delta`。控制項和欄位：[模型標籤頁](/zh-Hant/guide/translation-dashboard/models)。

<a id="how-the-ranking-chooses"></a>
### 排名如何選擇

此候選清單是根據供應商的即時聊天目錄所做的基準排名。首次執行時會下載三個公開資料集，可能需要一些時間。之後的執行會重複使用位於 `<cacheDir>/benchmark-scores.json` (通常是 `.translation-cache/benchmark-scores.json`) 的 7 天快取。

| 指標 | 其作用 | 來源 |
| --- | --- | --- |
| ChrF | 專案語言的翻譯品質 | [languagebench](https://huggingface.co/spaces/fair-forward/languagebench) (CC BY-SA 4.0) |
| Arena Score | 來自一對一比較中的整體偏好 | [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0) |
| 每百萬個權杖的美元價格 | 輸入和輸出價格 | 供應商發布費率時的目錄，否則為 [models.dev](https://models.dev/) (MIT) |

ChrF 使用 languagebench 為您的 `sourceLocale` 和 `targetLocales` 提供的翻譯分數。地區設定會對應到一個 languagebench 語言代碼：主要子標籤，並帶有別名，例如 `pt-BR` 對應 `pt` 以及 `zh-Hant` 對應 `zh`。一個能良好翻譯這些語言的模型，其排名會高於一個僅在一般情況下得分良好的模型。嵌入、圖像、語音和其他非聊天模型會被跳過，已過期的 ID 也會被跳過。

「品質」這個預設設定檔，將 ChrF 和 Arena Score 的權重設定高於價格。「價格」則顛倒了這種側重，並維持了上述的品質下限。選用權重為 [`modelSuggestion`](/zh-Hant/reference/configuration#modelsuggestion-optional)。

`suggest-models --refresh` 會重新下載資料集。之後請重新載入 **模型** 分頁。

每個旗標，包括 `--json`、`--list` 以及分數公式：[suggest-models](/zh-Hant/reference/cli-commands/models#suggest-models)。

<a id="why-the-list-has-more-than-one-model"></a>
## 為何清單中有超過一個模型

<a id="model-fallback-chain"></a>
### 模型備用鏈

`translationModels` 是一個有序清單。CLI 會嘗試第一個模型。若請求失敗、回應無法剖析，或文字的書寫系統錯誤，它會為該批次嘗試下一個 ID。

單一 ID 構成單點故障。模型可能會逾時、傳回此工具拒絕的文字，或將一種語言翻譯得好，另一種翻譯得差。常見情況是羅馬化印地語，其中 `hi` 預期天城文。羅馬化輸出會被原生文字地區設定拒絕。應保持羅馬化的地區設定需要明確的 `-Latn` 子標籤，例如 `hi-Latn`。

這就是為什麼候選清單包含數個 ID，最強的排在最前面。清單中的順序就是翻譯時嘗試的順序。

**解析層次** (去重，保持順序):

| 管道 | 順序 |
| --- | --- |
| UI (`translate-ui`, 複數, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| 文件，JSON，SVG | `localeModels(locale)` → `translationModels` |

大多數專案只會設定 `translationModels`。另外兩個清單則是在某種類型的文字或某種語言應該先嘗試不同模型時使用。

**UI 字串。** 可選的 `uiModels` 會在任何相符的個別地區設定覆寫之後、`translationModels` 之前嘗試。UI 文案簡短且可見，因此在該鏈上使用更強的模型是常見的分流作法。`suggest-models --apply` 只會寫入 `translationModels`。

**單一地區設定。** 可選的 `localeModels` 會將 BCP-47 標籤對應至在每個管線中為該地區設定優先嘗試的模型 (`pt-br` 符合 `pt-BR`)。日文、韓文和中文通常在使用為這些字集調整的模型 (例如 `z-ai/glm-5.3` 和 `minimax/minimax-m2.7`) 時，表現會比通用的備用模型更好。當沒有項目符合時，僅會套用上述的管線層級。

範例 (OpenRouter)。這些 ID 顯示了三個清單的結構。請從 `suggest-models` 或 **模型** 分頁取得 `translationModels`。當 UI 文案或某個地區設定需要自己的鏈時，請新增 `uiModels` 或 `localeModels`。

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "deepseek/deepseek-v4-flash",
        "openai/gpt-5-mini"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "ko", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hans", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hant", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] }
      ]
    }
  }
}
```

來自 `init` 的預設清單，以及欄位參考：[設定 — `provider` 與 `providers`](/zh-Hant/reference/configuration#provider-and-providers)。

<a id="check-list-and-benchmark"></a>
## 檢查、列出和基準測試

將候選清單放入設定後，這些指令會檢查它。您可以在使用這些指令前就執行翻譯。

<a id="check-models"></a>
### `check-models`

確認每個已設定的 ID 仍由目前作用中的供應商提供。

```bash
ai-i18n-tools check-models
```

它會呼叫供應商的 `GET /models` 端點、檢查 `translationModels`、`uiModels` 和 `localeModels` 中的每個 ID、回報遺失或已超過 `expiration_date` 的 ID，並在任何已設定的 ID 無效時以非零值結束。當供應商發佈價格時 (OpenRouter 和 Cheaper Inference 會這麼做)，它也會顯示每 1 百萬個權杖的美元價格。

<a id="list-models"></a>
### `list-models`

印出供應商所公告的完整目錄，並依 ID 排序。可用來查詢排名中遺漏的 ID。

```bash
ai-i18n-tools list-models
```

<a id="bench-models"></a>
### `bench-models`

透過每個已設定的模型單獨翻譯一個範例，並印出輸入和輸出的權杖、實際經過時間以及美元成本。`suggest-models` 使用上述已發佈的分數。`bench-models` 會呼叫模型，因此會花費 API 點數，並在您的帳戶上顯示延遲和價格。

```bash
ai-i18n-tools bench-models
```

來自 `translationModels`、`uiModels` 和 `localeModels` 的每個唯一 ID 都會在沒有備用選項的情況下執行。若要進行特定比較，請覆寫範例或 ID：

```bash
ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-5-mini,google/gemini-2.5-flash
```

在為 Cheaper Inference 啟用 [零資料保留](/zh-Hant/guide/providers-and-models#cheaperinference-zero-data-retention) 的情況下，`check-models`、`list-models` 和 `suggest-models` 會讀取 `GET /models?zdr=true`。

指令詳情：[CLI — 模型與語言](/zh-Hant/reference/cli-commands/models)。

<a id="further-reference"></a>
## 進一步參考

- [LLM 供應商](/zh-Hant/guide/providers-and-models) — 預設集、API 金鑰，以及使用 `-P` 切換供應商。
- [模型分頁](/zh-Hant/guide/translation-dashboard/models) — 儀表板中的相同排名。
- [設定 — `provider` 與 `providers`](/zh-Hant/reference/configuration#provider-and-providers) — `translationModels`、`uiModels`、`localeModels`、逾時與成本費率。
- [suggest-models](/zh-Hant/reference/cli-commands/models#suggest-models) — 旗標、篩選器與分數公式。
