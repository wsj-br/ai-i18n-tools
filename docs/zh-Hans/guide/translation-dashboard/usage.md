<a id="usage--costs"></a>
# 用量与费用

“**用量与费用**”选项卡汇总了本项目产生的计费模型 API 调用（包括随后被丢弃的重试），并显示令牌数和统一的美元费用。

相同的聚合数据可在命令行中以 `ai-i18n-tools usage` 的形式获取。

使用它可以回答：*我们进行了多少次调用，哪些模型和操作消耗了令牌，以及费用是多少？*

<a id="what-is-recorded"></a>
## 记录了什么

每个详细信息行都是一个返回了用量的 HTTP 完成（即使翻译后来因解析/脚本/质量问题被拒绝，并尝试了下一个备用模型）。未产生计费主体的传输失败不会被记录。

调用 API 的命令执行完毕后，超过**七个完整 UTC 日历日**（即今天往前推 7 天的 UTC 00:00 之前）的记录行将汇总至月度总计（`api_totals`）并从详细日志中移除。最近一周的数据仍保留为单独的`api_calls`行。汇总表会针对所选时间范围合并这两个数据源。

<a id="cost-reporting"></a>
## 费用报告

每次调用、摘要卡片和表格都显示**一个**美元成本：

1. 响应包含提供商的 `usage.cost` 时（目前为 OpenRouter）。
2. 否则，使用来自 `providers.<name>.modelPricing` 的金额或提供商范围的 `pricing` 默认值，应用于该调用的输入和输出 token。

新调用将该金额存储在 `api_calls` 行中。在打开报告时，未存储成本的旧行会以相同的方式进行定价，然后添加到相同的成本数值中——它们不会显示为第二列。如果两个来源都不适用，则该单元格为 `—`，绝不会是 `$0.00`。稍后更改配置的费率不会重写已存储成本的行。每月汇总仍会保留存储了成本的调用计数（`ncost_acc` / `ncost_dis`），因此在压缩后 `$0.00` 仍与“未知”区分开来。

<a id="filters"></a>
## 筛选器

按时间窗口、提供商、模型、操作 (`translate-docs`、`translate-ui`、`translate-json`、`translate-svg`、`proofread-ui`、`bench-models`)、区域设置和结果（接受与丢弃）进行筛选。

时间窗口：

- 短范围（`Last 30 minutes` 到 `Last 30 days`）使用滚动持续时间。**随时间变化的用量**显示该范围内仍有详细信息的每个 UTC 日历日的一行。
- `Last 2 months` / `Last 3 months` 从当前日历月减去 1 / 2 个月的第一天的 UTC 00:00 开始。**随时间变化的用量**显示保留的每日行以及每月的一行。
- `All time` 包括所有每月总计和保留的每日行。

要清除旧用量数据，请在“**删除早于以下时间的条目**”下选择一个时间范围（`> 1 month`、`> 2 months`、`> 3 months`、`> 6 months`、`> 1 year` 或 `all data (clear)`），然后执行“**删除数据**”。该菜单默认值为 `-`，在选择时间范围前，“**删除数据**”处于禁用状态。相同的时间范围也可通过 `ai-i18n-tools usage --clear [--older-than 1mo|2mo|3mo|6mo|1y|all]` 获取。日历截止时间会保留当月（`1mo`）或当月及之前月份的数据。

<a id="command-line"></a>
## 命令行

```bash
ai-i18n-tools usage
# ai-i18n-tools usage --since 7d --operation translate-docs
# ai-i18n-tools usage --since 2mo
# ai-i18n-tools usage --clear --older-than 3mo --dry-run
```
