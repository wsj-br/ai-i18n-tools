<a id="models"></a>
# Models

The **Models** tab ranks the active provider's chat models so you can choose `translationModels` without copying ids by hand. It uses the same ranking as [`suggest-models`](/reference/cli-commands/models#suggest-models). The walkthrough, including why the list holds more than one model, is [AI Models](/guide/ai-models).

Pick **Quality** or **Price**. Quality favors languagebench ChrF and Arena Score. Price favors a lower USD rate and still keeps a quality floor. When the config has more than one provider, a **Provider** menu appears; the default is the provider the dashboard was started with (`provider`, or `-P` / `--provider` on the `dashboard` command). Changing the provider or the priority reloads the table. Optional weights live in [`modelSuggestion`](/reference/configuration#modelsuggestion).

The table columns are reorder controls, a checkbox, rank, model id, index (the weighted score times 100), measured ChrF, measured Arena Score, and input/output price in USD per 1M tokens. A missing measurement is an em dash. The rank number is the model's place in the full ranking, before the filters below. Drag a row's handle, or use its up and down buttons, to change its place in this table. **Update** loads rank order again.

The controls sit in three cards. **Ranking** has the priority menu (and the provider menu when the config has more than one provider). **Filters** has **Max output price**, **Min index delta**, and **Update**. **Actions** has **Copy JSON** and **Update config**. Press Enter in a number field to refresh the table. Changing a menu does the same.

**Max output price** keeps models whose output price per 1M tokens is at most that many USD. A model with no output price is left out. **Min index delta** keeps a model only when its index is at least that many points below the previous kept model. The first remaining model is always kept. Leave either box empty to skip that filter.

Check the models you want. The status line shows how many are selected, for example `8 models selected.` The narrow number in the checkbox column header (default 8) is how many leading rows that checkbox selects. Checking it selects those rows. Clearing it clears every checkbox. Checked rows, from top to bottom, are the fallback order. **Update config** asks for confirmation, copies the current config to `ai-i18n-tools.config.{timestamp}.backup.json` beside it, then writes that order to `providers.<selected>.translationModels`. `uiModels` and `localeModels` stay unchanged. **Copy JSON** puts the same `{ "translationModels": [...] }` fragment on the clipboard. `suggest-models --apply` writes the same kind of backup.

The first load downloads languagebench, Arena, and models.dev when the cache is cold, and can take a while. Later loads reuse the 7-day cache at `<cacheDir>/benchmark-scores.json`. The tab has no refresh button. Refresh the cache from the CLI with `ai-i18n-tools suggest-models --refresh`, then reload the tab. The same command can print or apply the list.

::: info External Benchmark Sources
  Scores are computed from external data sources:
  - [languagebench ChrF](https://languagebench.github.io/) licensed under CC-BY-SA-4.0,
  - [LMArena Arena Score](https://github.com/lm-arena/lm-arena) licensed under CC-BY-4.0, and
  - [models.dev](https://models.dev/) prices licensed under MIT.
:::
