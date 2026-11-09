

<a id="ai-models"></a>
# AI Models

A model is one named system on your provider, such as `google/gemini-2.5-flash` or `gpt-5-mini`. `init` writes a starter `translationModels` list for the provider you picked. Treat that list as a starting point.

Choose the list for this project with `suggest-models`, or with the same ranking in the Translation Dashboard under **Models**. Both rank the active provider's chat models from published benchmarks and can write the result into `translationModels`. Set up the provider and its API key first: [LLM providers](/guide/providers-and-models).



<a id="start-with-a-ranked-list"></a>
## Start with a ranked list



<a id="from-the-command-line"></a>
### From the command line

`suggest-models` ranks the chat models the active provider currently offers and prints a short table. Quality is the default: the index is languagebench ChrF and Arena Score. Price is a separate column and a sort order, not part of the index.

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --top 10 --max-price 6
```

The columns are rank, model id, index, measured ChrF, measured Arena Score, input price, output price, blended price in USD per 1M tokens, and frontier tier. A missing measurement is `—`. The index is the quality score times 100. A higher index is a stronger match for this project's languages. An id that repeats another row's ChrF, Arena Score, and token prices is left out of this table. `--list` still prints it.

Write that list into config when the table looks right:

```bash
ai-i18n-tools suggest-models --apply
ai-i18n-tools suggest-models --apply --top 10 --max-price 6
```

`--apply` replaces `providers.<active>.translationModels`. It copies the current config to a sibling `ai-i18n-tools.config.{timestamp}.backup.json` first. `uiModels` and `localeModels` stay as they are. `--top` (default 8) is how many ids the table and `--apply` include. The first id is the one translation tries first. For that list, add `--max-price` and `--min-delta`. The price cap keeps a fallback from costing more than the budget, and the index gap drops a model that is only a small step away from the one kept above it.

`--price` lists the cheapest models on the quality-price frontier first and still keeps a quality floor, so a cheap model with no measurement stays below models that have scores. `--quality` is the default. Passing both flags is an error.



<a id="from-the-dashboard"></a>
### From the dashboard

The **Models** tab shows the same ranking, with a checkbox on each row.

```bash
ai-i18n-tools dashboard
```

Open **Models**. Choose **Quality** or **Price**. Check the rows you want. Checked rows, from top to bottom, are the order translation will try. **Update config** asks for confirmation, writes the same kind of backup, and saves that order to `translationModels`. **Copy JSON** puts the `{ "translationModels": [...] }` fragment on the clipboard when you would rather paste it yourself.

**Max blended price** and **Min index delta** match `suggest-models --max-price` and `--min-delta`. Controls and columns: [Models tab](/guide/translation-dashboard/models).



<a id="how-the-ranking-chooses"></a>
### How the ranking chooses

The list is a benchmark ranking of the provider's live chat catalog. The first run downloads three public datasets and can take a while. Later runs reuse the 7-day cache.

| Signal | What it contributes | Source |
| --- | --- | --- |
| ChrF | Translation quality for your project's languages | [languagebench](https://huggingface.co/spaces/fair-forward/languagebench) (CC BY-SA 4.0) |
| Arena Score | Overall preference from head-to-head comparisons | [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0) |
| USD per 1M tokens | Input, output, and blended price `(3 × input + output) / 4` | The provider's catalog when it publishes rates, otherwise [models.dev](https://models.dev/) (MIT) |

From these signals, the ranking derives two values for each candidate model: the quality index (combining ChrF and Arena Score) and the [Pareto frontier](https://en.wikipedia.org/wiki/Pareto_frontier) tier (evaluating quality against blended token price).

ChrF uses languagebench's translation scores for your `sourceLocale` and `targetLocales`. Locales map to a languagebench language code: the primary subtag, with aliases such as `pt-BR` to `pt` and `zh-Hant` to `zh`. A model that translates those languages well outranks one that only scores well in general. Embeddings, image, speech, and other non-chat models are skipped, and so are ids past their expiration date.

The index is ChrF and Arena Score. Price is not part of it. The score weights ChrF (default 55%) and Arena Score (default 45%), each normalised against the highest score in the provider's chat catalog, rounded to one decimal on a 0–100 scale. Stand-in values (`0.35` for ChrF, `0.45` for Arena) apply only when a measurement is missing; the table prints `—`.

The quality floor is a minimum ChrF threshold (default 70% of the candidate pool's best ChrF for quality, and 60% for price). Models below this floor, including any model with no ChrF measurement, sort after models that clear it and show `—` in the frontier column. Quality, the default profile, sorts by the index and breaks equal indices with the cheaper blended price. Price orders models by frontier tier (tier 1 cheapest first, then tier 2, and so on). Optional custom weights and floor live in [`modelSuggestion`](/reference/configuration#modelsuggestion-optional).

Two ids that share ChrF, Arena Score, input price, and output price are aliases. Suggestions keep the shorter id, and an id with no date in it over one that has a date, such as `preview-06-05` or `20241022`. The other ids stay in the full ranking, so `--list` can still show a configured alias, and they are left out of the table, `--json`, and `--apply`.



<a id="reading-the-frontier-column"></a>
#### Reading the frontier column

The frontier column is a tier, not a score. A model is dominated when another model costs no more (blended price) and has at least the same index, and is strictly cheaper or strictly higher on the index. A `2` is not twice as bad as a `1`, and tier numbers do not compare quality between rows: only the index does that. Two rows can show `3` and `4` and still sit within a point of the tier 1 model that beats both of them.

- `1` means no other model is both cheaper and higher on the index. On `--price`, tier 1 runs cheapest to dearest, and each step costs more and has a higher index. `--min-delta` hides a step that adds only a small gain.
- `2` means the model is dominated, but only by tier 1 models. The line under the table names the tier 1 model that beats each dominated row. Hover the value in the dashboard to see the same model.
- `3` and higher follow the same rule one step further down. The higher the number, the longer the chain, not the further the index is from the best model.
- `—` means the model has no price, it is below the quality floor, or it is an alias of another row. It is not compared.

Tier 1 is an efficiency check: nothing else is both strictly cheaper and higher-scoring. A higher tier can still belong on the list. Vendor diversity, rate limits, latency, and context window sit outside the index, and a fallback from another vendor still helps when a tier 1 model is rate-limited or rejects a batch. Another id for the same model does not help with that.

An exact tie that is not an alias (the same blended price and the same index, with different token prices or different scores) shares the tier. The index is compared as shown in the table, rounded to one decimal.

Tiers are computed over the whole catalog, so `--max-price`, `--min-delta`, and `--top` hide rows without renumbering them. A model that is tier 1 in the full list stays tier 1 after a price cap. `--max-price` drops models above a budget. It does not remove every dominated row under the cap. The frontier column and the line under the table show those.

`--price` lists tier 1 from cheapest to dearest, then tier 2 the same way, and so on. Quality, the default, sorts by the index and treats the frontier column as a label.

`suggest-models --refresh` redownloads the datasets. Reload the **Models** tab afterward.

Every flag, including `--json`, `--list`, and the score formula: [suggest-models](/reference/cli-commands/models#suggest-models).



<a id="why-the-list-has-more-than-one-model"></a>
## Why the list has more than one model



<a id="model-fallback-chain"></a>
### Model fallback chain

`translationModels` is an ordered list. The CLI tries the first model. On a failed request, a response it cannot parse, or text in the wrong writing system, it tries the next id for that batch.

One id is a single point of failure. A model can time out, return text this tool rejects, or translate one language well and another poorly. A common case is romanised Hindi where `hi` expects Devanagari. Romanised output is rejected for native-script locales. A locale that should stay romanised needs an explicit `-Latn` subtag, such as `hi-Latn`.

That is why the list contains several ids, strongest first. Order in the list is the order translation tries.

**Resolution tiers** (deduplicated, order preserved):

| Pipeline | Order |
| --- | --- |
| UI (`translate-ui`, plurals, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documents, JSON, SVG | `localeModels(locale)` → `translationModels` |

Most projects only set `translationModels`. The other two lists are there when one kind of text, or one language, should try different models first.

**UI strings.** Optional `uiModels` is tried after any matching per-locale override and before `translationModels`. UI copy is short and visible, so a stronger model on that chain is a common split. `suggest-models --apply` writes `translationModels` only.

**One locale.** Optional `localeModels` maps a BCP-47 tag to models tried first for that locale in every pipeline (`pt-br` matches `pt-BR`). Japanese, Korean, and Chinese often do better with models tuned for those scripts, such as `z-ai/glm-5.3` and `minimax/minimax-m2.7`, than with a general-purpose fallback. When no entry matches, only the pipeline tiers above apply.

Example (OpenRouter). The ids show the shape of the three lists. Take `translationModels` from `suggest-models` or the **Models** tab. Add `uiModels` or `localeModels` when UI copy or one locale needs its own chain.

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

Preset lists from `init`, and the field reference: [Configuration —](/reference/configuration#provider-and-providers) `provider` [and](/reference/configuration#provider-and-providers) `providers`.



<a id="check-list-and-benchmark"></a>
## Check, list, and benchmark

Once the list is in config, these commands inspect it. Translation can run before you use them.



<a id="check-models"></a>
### `check-models`

Confirms each configured id is still offered by the active provider.

```bash
ai-i18n-tools check-models
```

It calls the provider's `GET /models` endpoint, checks every id in `translationModels`, `uiModels`, and `localeModels`, reports ids that are missing or past `expiration_date`, and exits non-zero when any configured id is invalid. When the provider publishes prices (OpenRouter and Cheaper Inference do), it also shows USD per 1M tokens.



<a id="list-models"></a>
### `list-models`

Prints the full catalog the provider advertises, sorted by id. Use it to look up an id the ranking left out.

```bash
ai-i18n-tools list-models
```



<a id="bench-models"></a>
### `bench-models`

Translates one sample through each configured model on its own, and prints input and output tokens, wall-clock time, and USD cost. `suggest-models` uses the published scores above. `bench-models` calls the models, so it spends API credit and shows latency and price on your account.

```bash
ai-i18n-tools bench-models
```

Each unique id from `translationModels`, `uiModels`, and `localeModels` runs with no fallback. Override the sample or the ids for a specific comparison:

```bash
ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-5-mini,google/gemini-2.5-flash
```


Command details: [CLI — Models & languages](/reference/cli-commands/models).



<a id="further-reference"></a>
## Further reference

- [LLM providers](/guide/providers-and-models) — presets, API keys, and switching providers with `-P`.
- [Models tab](/guide/translation-dashboard/models) — the same ranking in the dashboard.
- [Configuration —](/reference/configuration#provider-and-providers) `provider` [and](/reference/configuration#provider-and-providers) `providers` — `translationModels`, `uiModels`, `localeModels`, timeouts, and cost rates.
- [suggest-models](/reference/cli-commands/models#suggest-models) — flags, filters, and the score formula.

::: info External Benchmark Sources
Scores are computed from external data sources:

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) licensed under CC-BY-SA-4.0,
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) licensed under CC-BY-4.0, and
- [models.dev](https://models.dev/) prices licensed under MIT.

:::
