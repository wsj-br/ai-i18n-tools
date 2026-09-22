<a id="usage--costs"></a>
# Usage & costs

The **Usage & costs** tab summarizes billed model API calls this project has made — including retries that were later discarded — with token counts and a single USD cost.

The same aggregates are available on the command line as `ai-i18n-tools usage`.

Use it to answer: *how many calls did we make, which models and operations spent tokens, and what did it cost?*

<a id="what-is-recorded"></a>
## What is recorded

Each detail row is one HTTP completion that returned usage (even if the translation was later rejected for parse/script/quality and the next fallback model was tried). Transport failures that never produced a billed body are not logged.

After a command that called the API finishes, rows older than **seven full UTC calendar days** (from 00:00 UTC of today minus 7 days) are rolled into monthly totals (`api_totals`) and removed from the detail log. The last week stays as individual `api_calls` rows. Summary tables combine both sources for the selected time range.

<a id="cost-reporting"></a>
## Cost reporting

Each call, summary card, and table shows **one** USD cost:

1. The provider's `usage.cost` when the response included it (OpenRouter today).
2. Otherwise the amount from `providers.<name>.modelPricing` or the provider-wide `pricing` default, applied to that call's input and output tokens.

New calls store that amount on the `api_calls` row. Older rows that were stored without a cost are priced the same way when the report is opened, then added into the same Cost figure — they are not shown as a second column. If neither source applies, the cell is `—`, never `$0.00`. Changing the configured rates later does not rewrite rows that already have a stored cost. Monthly rollups still keep a count of calls that stored a cost (`ncost_acc` / `ncost_dis`) so `$0.00` stays distinct from “unknown” after compaction.

<a id="filters"></a>
## Filters

Filter by time window, provider, model, operation (`translate-docs`, `translate-ui`, `translate-json`, `translate-svg`, `proofread-ui`, `bench-models`), locale, and outcome (accepted vs discarded).

Time windows:

- Short ranges (`Last 30 minutes` through `Last 30 days`) use rolling durations. **Usage over time** shows one row per UTC calendar day that still has detail in that range.
- `Last 2 months` / `Last 3 months` start at 00:00 UTC on the first day of the current calendar month minus 1 / 2 months. **Usage over time** shows the retained daily rows plus one row per month.
- `All time` includes every monthly total and the retained daily rows.

To drop old usage, choose a window under **Delete entries older than** (`> 1 month`, `> 2 months`, `> 3 months`, `> 6 months`, `> 1 year`, or `all data (clear)`) and then **Delete data**. The menu starts at `-`, which leaves **Delete data** disabled until a window is chosen. The same windows are available as `ai-i18n-tools usage --clear [--older-than 1mo|2mo|3mo|6mo|1y|all]`. Calendar cutoffs keep the current month (`1mo`) or the current month plus the preceding months.

<a id="command-line"></a>
## Command line

```bash
ai-i18n-tools usage
# ai-i18n-tools usage --since 7d --operation translate-docs
# ai-i18n-tools usage --since 2mo
# ai-i18n-tools usage --clear --older-than 3mo --dry-run
```
