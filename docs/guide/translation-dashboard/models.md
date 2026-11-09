

<a id="models"></a>
# Models

The **Models** tab ranks the active provider's chat models so you can choose `translationModels` without copying ids by hand. It uses the same ranking as [`suggest-models`](/reference/cli-commands/models#suggest-models). The walkthrough, including why the list holds more than one model, is [AI Models](/guide/ai-models).

The page is split into two panes. **Current configuration** is the fallback chain already stored for the selected provider. The first row is tried first. **Suggestions** is the ranked catalog you can check, reorder, and write back. Changing the provider or the priority reloads both panes. A configured id that is missing from the catalog still appears in **Current configuration**, marked as not in the catalog.

Pick **Quality** or **Price**. Quality sorts by the ChrF and Arena index and treats the frontier column as a label. Price lists tier 1 from cheapest to dearest, then tier 2 the same way, and so on. It still keeps a quality floor, so a cheap model with no measurement stays below models that have scores. When the config has more than one provider, a **Provider** menu appears; the default is the provider the dashboard was started with (`provider`, or `-P` / `--provider` on the `dashboard` command). Optional weights live in [`modelSuggestion`](/reference/configuration#modelsuggestion-optional).

Both panes share the score and price columns: model id, index (the quality score times 100), measured ChrF, measured Arena Score, input price, output price, blended price in USD per 1M tokens, and frontier tier. A missing measurement is an em dash. Hover a column header in either pane to see a short description of that column. Hover a frontier value of 2 or higher to see which tier 1 model dominates that row. The number is how deep that chain goes, not how far the index is from the best model. An id that repeats another row's ChrF, Arena Score, and token prices is left out of **Suggestions**. The shorter id is kept, and an id with no date in it wins over a dated one. A configured alias still appears in **Current configuration**. An exact tie on blended price and index shares the tier. How to read the column: [Reading the frontier column](/guide/ai-models#reading-the-frontier-column).

**Current configuration** adds an order column. That number is the model's place in the stored chain.

**Suggestions** adds reorder controls, a checkbox, and rank. The rank number is the model's place in the full ranking, before the filters below. Drag a row's handle, or use its up and down buttons, to change its place in this table. **Update** loads rank order again.

The controls sit in three cards. **Ranking** has the priority menu (and the provider menu when the config has more than one provider). **Filters** has **Max blended price**, **Min index delta**, and **Update**. **Actions** has **Copy JSON** and **Update config**. Press Enter in a number field to refresh the table. Changing a menu does the same.

**Max blended price** keeps models whose blended price `(3 × input + output) / 4` per 1M tokens is at most that many USD. A model with no blended price is left out. **Min index delta** keeps a model only when its index differs from the previous kept model by at least that many points. The first remaining model is always kept. Leave either box empty to skip that filter. On a quality ranking, set both before **Update config**: the price cap keeps a fallback inside a budget, and the index gap drops a model that is only a small step away from the one above it. A dominated row under the cap can still remain. The frontier column is what shows it.

Check the models you want. The status line shows how many are selected, for example `8 models selected.` The narrow number in the checkbox column header (default 8) is how many leading rows that checkbox selects. Checking it selects those rows. Clearing it clears every checkbox. Checked rows, from top to bottom, are the fallback order. **Update config** asks for confirmation, copies the current config to `ai-i18n-tools.config.{timestamp}.backup.json` beside it, then writes that order to `providers.<selected>.translationModels`. `uiModels` and `localeModels` stay unchanged. **Copy JSON** puts the same `{ "translationModels": [...] }` fragment on the clipboard. `suggest-models --apply` writes the same kind of backup.

The first load downloads languagebench, Arena, and models.dev when the cache is cold, and can take a while. Later loads reuse the 7-day cache at `<cacheDir>/benchmark-scores.json`. The tab has no refresh button. Refresh the cache from the CLI with `ai-i18n-tools suggest-models --refresh`, then reload the tab. The same command can print or apply the list.





::: info External Benchmark Sources
Scores are computed from external data sources:

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) licensed under CC-BY-SA-4.0,
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) licensed under CC-BY-4.0, and
- [models.dev](https://models.dev/) prices licensed under MIT.

:::
