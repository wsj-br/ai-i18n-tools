<a id="models"></a>
# Models

The **Models** tab ranks the active provider's chat models so you can choose `translationModels` without copying ids by hand. It uses the same ranking as [`suggest-models`](/reference/cli-commands/models#suggest-models).

Pick **Quality** or **Price**. Quality favors languagebench ChrF and Arena Score. Price favors a lower USD rate and still keeps a quality floor. When the config has more than one provider, a **Provider** menu appears; the default is the provider the dashboard was started with (`provider`, or `-P` / `--provider` on the `dashboard` command). Changing the provider or the priority reloads the table. Optional weights live in [`modelSuggestion`](/reference/configuration#modelsuggestion).

The table columns are rank, model id, index (the weighted score times 100), measured ChrF, measured Arena Score, and input/output price in USD per 1M tokens. A missing measurement is an em dash. The rank number is the model's place in the full ranking, before the filters below.

**Max output price** keeps models whose output price per 1M tokens is at most that many USD. A model with no output price is left out. **Min index delta** keeps a model only when its index is at least that many points below the previous kept model. The first remaining model is always kept. Leave either box empty to skip that filter. Changing either value reloads the table.

Check the models you want. **Use top** (default 5) selects the first N rows of the filtered list and resets their order. Move a selected id up or down to set the fallback order. **Update config** writes that order to `providers.<selected>.translationModels` and leaves `uiModels` and `localeModels` unchanged. **Copy JSON** puts the same `{ "translationModels": [...] }` fragment on the clipboard.

The first load downloads languagebench, Arena, and models.dev when the cache is cold, and can take a while. Later loads reuse the 7-day cache at `<cacheDir>/benchmark-scores.json`. The tab has no refresh button. Refresh the cache from the CLI with `ai-i18n-tools suggest-models --refresh`, then reload the tab. The same command can print or apply the list.

The footer attributes languagebench (CC BY-SA 4.0), the LMArena Arena Score (CC BY 4.0), and models.dev (MIT).
