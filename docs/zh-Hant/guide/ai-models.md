<a id="ai-models"></a>
# AI 模型

模型是您供應商上的一個具名系統，例如 `google/gemini-2.5-flash` 或 `gpt-5-mini`。`init` 會為您選擇的供應商編寫一份初始的 `translationModels` 清單。請將該清單視為一個起點。

使用 `suggest-models` 或在翻譯儀表板的 **模型** 下使用相同的排名，為此專案選擇清單。兩者都會根據已發布的基準對當前供應商的聊天模型進行排名，並可將結果寫入 `translationModels`。請先設定供應商及其 API 金鑰：[LLM 供應商](/zh-Hant/guide/providers-and-models)。

<a id="start-with-a-ranked-list"></a>
## 從排名清單開始

<a id="from-the-command-line"></a>
### 從命令列

`suggest-models` 評定目前活躍供應商提供的聊天模型，並列印一個簡短的表格。品質是預設值：該指標為 languagebench ChrF 和 Arena Score。價格是一個獨立的欄位和排序順序，不屬於該指標的一部分。

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --top 10 --max-price 6
```

欄位包括排名、模型 ID、指數、測量 ChrF、測量 Arena 分數、輸入價格、輸出價格、每百萬個權杖的美元混合價格，以及邊界層級。遺失的測量值為 `—`。指數是品質分數乘以 100。較高的指數表示與此專案的語言更匹配。重複其他列的 ChrF、Arena 分數和權杖價格的 ID 會從此表格中省略。`--list` 仍會列印它。

當表格正確無誤時，將該清單寫入配置：

```bash
ai-i18n-tools suggest-models --apply
ai-i18n-tools suggest-models --apply --top 10 --max-price 6
```

`--apply` 會取代 `providers.<active>.translationModels`。它會先將目前的組態複製到同級的 `ai-i18n-tools.config.{timestamp}.backup.json`。`uiModels` 和 `localeModels` 保持不變。`--top` (預設值為 8) 是表格和 `--apply` 包含的 ID 數量。第一個 ID 是翻譯會優先嘗試的 ID。對於該清單，請新增 `--max-price` 和 `--min-delta`。價格上限可防止備用選項超出預算，而指數差距則會捨棄與其上方保留的模型僅有一小步之遙的模型。

`--price` 優先列出品質-價格前沿上最便宜的模型，並仍保持品質下限，因此，沒有測量值的便宜模型會排在有分數的模型之下。`--quality` 是預設值。同時傳遞這兩個旗標會導致錯誤。

<a id="from-the-dashboard"></a>
### 從儀表板

**模型** 標籤頁會顯示相同的排名，且每一列都有一個核取方塊。

```bash
ai-i18n-tools dashboard
```

開啟 **模型**。選擇 **品質** 或 **價格**。勾選您想要的列。已勾選的列，由上至下，即為翻譯將嘗試的順序。**更新設定檔** 會要求確認，寫入同類型的備份，並將該順序儲存至 `translationModels`。當您想自行貼上時，**複製 JSON** 會將 `{ "translationModels": [...] }` 片段放到剪貼簿上。

**最大混合價格** 和 **最小指標差異** 與 `suggest-models --max-price` 和 `--min-delta` 相符。控制項和欄位：[模型分頁](/zh-Hant/guide/translation-dashboard/models)。

<a id="how-the-ranking-chooses"></a>
### 排名如何選擇

此清單是供應商即時通訊目錄的基準排名。首次執行會下載三個公開資料集，並且會花費一些時間。後續執行會重複使用 7 天的快取。

| 指標 | 其作用 | 來源 |
| --- | --- | --- |
| ChrF | 專案語言的翻譯品質 | [languagebench](https://huggingface.co/spaces/fair-forward/languagebench) (CC BY-SA 4.0) |
| Arena Score | 來自一對一比較中的整體偏好 | [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0) |
| 每百萬個權杖的美元 | 輸入、輸出和混合價格 `(3 × input + output) / 4` | 供應商發佈費率時的目錄，否則為 [models.dev](https://models.dev/) (MIT) |

根據這些訊號，該排名會針對每個候選模型得出兩個值：品質指數 (結合 ChrF 和 Arena Score) 以及 [帕雷托邊界](https://en.wikipedia.org/wiki/Pareto_frontier) 層級 (根據混合代幣價格評估品質)。

ChrF 使用 languagebench 為您的 `sourceLocale` 和 `targetLocales` 提供的翻譯分數。地區設定會對應到一個 languagebench 語言代碼：主要子標籤，並帶有別名，例如 `pt-BR` 對應 `pt` 以及 `zh-Hant` 對應 `zh`。一個能良好翻譯這些語言的模型，其排名會高於一個僅在一般情況下得分良好的模型。嵌入、圖像、語音和其他非聊天模型會被跳過，已過期的 ID 也會被跳過。

該指數是 ChrF 和 Arena 分數。價格不包含在其中。分數權重 ChrF（預設 55%）和 Arena 分數（預設 45%），每個分數都根據提供者聊天目錄中的最高分數進行正規化，並四捨五入到 0-100 範圍內的一位小數。替代值（ChrF 為 `0.35`，Arena 為 `0.45`）僅在測量值缺失時適用；表格會印出 `—`。

品質下限是一個最低 ChrF 閾值（品質預設為候選池最佳 ChrF 的 70%，價格預設為 60%）。低於此下限的模型，包括任何沒有 ChrF 測量的模型，會排在超過此下限的模型之後，並在「前沿」欄中顯示 `—`。品質是預設設定檔，按指數排序，並以較便宜的混合價格打破相同指數的平局。價格按前沿層級對模型進行排序（第 1 層最便宜優先，然後是第 2 層，依此類推）。可選的自訂權重和下限位於 [`modelSuggestion`](/zh-Hant/reference/configuration#modelsuggestion-optional) 中。

兩個共享 ChrF、Arena 分數、輸入價格和輸出價格的 ID 是別名。建議保留較短的 ID，以及沒有日期的 ID，而不是有日期的 ID，例如 `preview-06-05` 或 `20241022`。其他 ID 仍保留在完整排名中，因此 `--list` 仍然可以顯示已設定的別名，並且它們會從表格、`--json` 和 `--apply` 中省略。

<a id="reading-the-frontier-column"></a>
#### 閱讀邊界欄

「前沿」欄是一個層級，而不是分數。當另一個模型的成本不高於（混合價格）且指數至少相同，並且在指數上嚴格更便宜或嚴格更高時，該模型就被「支配」。`2` 並不比 `1` 差兩倍，層級數字不比較行之間的品質：只有指數才能做到這一點。兩行可以顯示 `3` 和 `4`，但仍然與擊敗它們兩者的第 1 層模型相差一個點。

- `1` 表示沒有其他模型在指數上既更便宜又更高。在 `--price` 上，第 1 層從最便宜到最貴，每一步都花費更多且指數更高。`--min-delta` 隱藏了一個只增加少量收益的步驟。
- `2` 表示該模型被支配，但僅被第 1 層模型支配。表格下方的行會列出擊敗每個被支配行的第 1 層模型。將滑鼠懸停在儀表板中的值上以查看相同的模型。
- `3` 及更高層級遵循相同的規則，再往下一個步驟。數字越高，鏈條越長，而不是指數離最佳模型越遠。
- `—` 表示該模型沒有價格，它低於品質下限，或者它是另一行的別名。它不參與比較。

第 1 層是效率檢查：沒有其他模型既嚴格更便宜又得分更高。更高的層級仍然可以列在清單中。供應商多樣性、速率限制、延遲和上下文視窗都在指數之外，當第 1 層模型受到速率限制或拒絕批次時，來自另一個供應商的備用方案仍然有幫助。同一模型的另一個 ID 對此沒有幫助。

非別名的精確平局（相同的混合價格和相同的指數，但代幣價格或分數不同）共享層級。指數按照表格中所示進行比較，四捨五入到一位小數。

層級是針對整個目錄計算的，因此 `--max-price`、`--min-delta` 和 `--top` 會隱藏行而不會重新編號。在完整清單中屬於第 1 層的模型，在價格上限後仍保持第 1 層。`--max-price` 會捨棄超出預算的模型。它不會移除上限下所有被支配的行。「前沿」欄和表格下方的行會顯示這些。

`--price` 會從最便宜到最貴列出第 1 層，然後以相同方式列出第 2 層，依此類推。品質是預設值，按指數排序並將「前沿」欄視為標籤。

`suggest-models --refresh` 會重新下載資料集。之後請重新載入 **模型** 分頁。

每個旗標，包括 `--json`、`--list` 以及分數公式：[suggest-models](/zh-Hant/reference/cli-commands/models#suggest-models)。

<a id="why-the-list-has-more-than-one-model"></a>
## 為何清單中有多個模型

<a id="model-fallback-chain"></a>
### 模型備援鏈

`translationModels` 是一個有序清單。CLI 會嘗試第一個模型。若請求失敗、回應無法剖析，或文字的書寫系統錯誤，它會為該批次嘗試下一個 ID。

單一 ID 構成單點故障。模型可能會逾時、傳回此工具拒絕的文字，或將一種語言翻譯得好，另一種翻譯得差。常見情況是羅馬化印地語，其中 `hi` 預期天城文。羅馬化輸出會被原生文字地區設定拒絕。應保持羅馬化的地區設定需要明確的 `-Latn` 子標籤，例如 `hi-Latn`。

這就是為什麼此清單包含數個 ID，最強的優先。清單中的順序是翻譯嘗試的順序。

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

來自 `init` 的預設清單，以及欄位參考：[組態 —](/zh-Hant/reference/configuration#provider-and-providers) `provider` [與](/zh-Hant/reference/configuration#provider-and-providers) `providers`。

<a id="check-list-and-benchmark"></a>
## 檢查、列出與基準測試

一旦清單已在配置中，這些指令會檢查它。翻譯可以在您使用它們之前執行。

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

指令詳情：[CLI — 模型與語言](/zh-Hant/reference/cli-commands/models)。

<a id="further-reference"></a>
## 延伸參考

- [LLM 提供者](/zh-Hant/guide/providers-and-models) — 預設值、API 金鑰，以及使用 `-P` 切換提供者。
- [模型索引標籤](/zh-Hant/guide/translation-dashboard/models) — 儀表板中的相同排名。
- [組態 —](/zh-Hant/reference/configuration#provider-and-providers) `provider` [與](/zh-Hant/reference/configuration#provider-and-providers) `providers` — `translationModels`、`uiModels`、`localeModels`、逾時與費用費率。
- [suggest-models](/zh-Hant/reference/cli-commands/models#suggest-models) — 旗標、篩選器與分數公式。

::: info 外部基準來源
分數是根據外部資料來源計算的：

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) 依 CC-BY-SA-4.0 授權，
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) 依 CC-BY-4.0 授權，以及
- [models.dev](https://models.dev/) 價格依 MIT 授權。
:::
