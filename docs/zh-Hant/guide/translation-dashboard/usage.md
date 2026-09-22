<a id="usage--costs"></a>
# 使用與費用

**使用量與費用** 索引標籤摘要顯示此專案已進行的計費模型 API 呼叫 — 包括稍後被捨棄的重試 — 以及代幣計數和單一美元費用。

相同的彙總資料可在命令列透過 `ai-i18n-tools usage` 取得。

使用它來回答：*我們做了多少次呼叫、哪些模型與操作消耗了 token，以及成本是多少？*

<a id="what-is-recorded"></a>
## 記錄內容

每筆詳細列代表一次回傳使用量的 HTTP 完成（即使該翻譯後來因解析/腳本/品質問題被拒絕，並嘗試了下一個備援模型）。從未產生計費回應內容的傳輸失敗不會被記錄。

在呼叫 API 的指令完成後，超過 **七個完整的 UTC 日曆天**（從今日 UTC 00:00 減去 7 天）的列會彙總到月度總計 (`api_totals`) 並從詳細記錄中移除。最近一週會保留為個別的 `api_calls` 列。摘要表格會合併所選時間範圍的兩個來源。

<a id="cost-reporting"></a>
## 成本回報

每個呼叫、摘要卡片和表格都顯示**單一**美元成本：

1. 當回應包含時，提供者的 `usage.cost`（今日為 OpenRouter）。
2. 否則為來自 `providers.<name>.modelPricing` 或提供者全域 `pricing` 預設值的金額，套用至該呼叫的輸入與輸出權杖。

新呼叫會將該金額儲存在 `api_calls` 列上。在開啟報表時，未儲存成本的舊列會以相同方式計價，然後加入相同的成本數值中 — 它們不會顯示為第二個欄位。如果兩個來源都不適用，該儲存格為 `—`，絕不會是 `$0.00`。稍後變更已設定的費率不會覆寫已儲存成本的列。每月彙總仍會保留已儲存成本的呼叫計數 (`ncost_acc` / `ncost_dis`)，因此在壓縮後 `$0.00` 仍與「未知」保持區別。

<a id="filters"></a>
## 篩選器

依時間範圍、供應商、模型、操作（`translate-docs`, `translate-ui`, `translate-json`, `translate-svg`, `proofread-ui`, `bench-models`）、語系及結果（已採用 vs 已捨棄）進行篩選。

時間範圍：

- 短範圍（`Last 30 minutes` 至 `Last 30 days`）使用滾動時長。**Usage over time** 會為該範圍內仍有詳細記錄的每個 UTC 日曆天顯示一列。
- `Last 2 months` / `Last 3 months` 從當前日曆月第一天 UTC 00:00 起往前推 1 / 2 個月開始。**Usage over time** 會顯示保留的每日列，加上每個月一列。
- `All time` 包含所有月度總計與保留的每日列。

若要捨棄舊的使用量，請在 **刪除早於以下時間的項目** 下方選擇一個時間範圍（`> 1 month`、`> 2 months`、`> 3 months`、`> 6 months`、`> 1 year` 或 `all data (clear)`），然後按一下 **刪除資料**。選單起始值為 `-`，這會讓 **刪除資料** 保持停用狀態，直到選擇時間範圍為止。相同的時間範圍也可作為 `ai-i18n-tools usage --clear [--older-than 1mo|2mo|3mo|6mo|1y|all]` 使用。日曆截止時間會保留當月 (`1mo`) 或當月加上前幾個月。

<a id="command-line"></a>
## 命令列

```bash
ai-i18n-tools usage
# ai-i18n-tools usage --since 7d --operation translate-docs
# ai-i18n-tools usage --since 2mo
# ai-i18n-tools usage --clear --older-than 3mo --dry-run
```
