<a id="ai-models"></a>
# AI Models

A model is one named system on your provider, such as `google/gemini-2.5-flash` or `gpt-5-mini`. `init` writes a starter `translationModels` list for the provider you picked. Treat that list as a starting point.

Choose the list for this project with `suggest-models`, or with the same ranking in the Translation Dashboard under **Models**. Both rank the active provider's chat models from published benchmarks and can write the result into `translationModels`. Set up the provider and its API key first: [LLM providers](/guide/providers-and-models).

<a id="suggest-models"></a>
## Start with a ranked shortlist

<a id="suggest-models-cli"></a>
### From the command line

`suggest-models` ranks the chat models the active provider currently offers and prints a short table. Quality is the default: translation measurements and a general preference score count more than price.

```bash
ai-i18n-tools suggest-models
```

The columns are rank, model id, index, measured ChrF, measured Arena Score, and input and output price in USD per 1M tokens. A missing measurement is `—`. The index is the weighted score times 100. On the quality ranking, a higher index is a stronger match for this project.

Write that shortlist into config when the table looks right:

```bash
ai-i18n-tools suggest-models --apply
```

`--apply` replaces `providers.<active>.translationModels`. It copies the current config to a sibling `ai-i18n-tools.config.{timestamp}.backup.json` first. `uiModels` and `localeModels` stay as they are. `--top` (default 8) is how many ids the table and `--apply` include. The first id is the one translation tries first.

`--price` leads with a lower rate and still keeps a quality floor, so a cheap model with no measurement stays below models that have scores. `--quality` is the default. Passing both flags is an error.

<a id="suggest-models-dashboard"></a>
### From the dashboard

The **Models** tab shows the same ranking, with a checkbox on each row.

```bash
ai-i18n-tools dashboard
```

Open **Models**. Choose **Quality** or **Price**. Check the rows you want. Checked rows, from top to bottom, are the order translation will try. **Update config** asks for confirmation, writes the same kind of backup, and saves that order to `translationModels`. **Copy JSON** puts the `{ "translationModels": [...] }` fragment on the clipboard when you would rather paste it yourself.

**Max output price** and **Min index delta** match `suggest-models --max-output-price` and `--min-delta`. Controls and columns: [Models tab](/guide/translation-dashboard/models).

<a id="how-models-are-ranked"></a>
### How the ranking chooses

The shortlist is a benchmark ranking of the provider's live chat catalog. The first run downloads three public datasets and can take a while. Later runs reuse the 7-day cache at `<cacheDir>/benchmark-scores.json` (usually `.translation-cache/benchmark-scores.json`).

| Signal | What it contributes | Source |
| --- | --- | --- |
| ChrF | Translation quality for your project's languages | [languagebench](https://languagebench.github.io/) (CC BY-SA 4.0) |
| Arena Score | Overall preference from head-to-head comparisons | [LMArena Arena Score](https://github.com/lm-arena/lm-arena) (CC BY 4.0) |
| USD per 1M tokens | Input and output price | The provider's catalog when it publishes rates, otherwise [models.dev](https://models.dev/) (MIT) |

ChrF uses languagebench's translation scores for your `sourceLocale` and `targetLocales`. Locales map to a languagebench language code: the primary subtag, with aliases such as `pt-BR` to `pt` and `zh-Hant` to `zh`. A model that translates those languages well outranks one that only scores well in general. Embeddings, image, speech, and other non-chat models are skipped, and so are ids past their expiration date.

Quality, the default profile, weights ChrF and Arena Score above price. Price reverses that emphasis and keeps the quality floor described above. Optional weights are [`modelSuggestion`](/reference/configuration#modelsuggestion).

`suggest-models --refresh` redownloads the datasets. Reload the **Models** tab afterward.

Every flag, including `--json`, `--list`, and the score formula: [suggest-models](/reference/cli-commands/models#suggest-models).

<a id="why-more-than-one-model"></a>
## Why the list has more than one model

<a id="model-fallback-chain"></a>
### Model fallback chain

`translationModels` is an ordered list. The CLI tries the first model. On a failed request, a response it cannot parse, or text in the wrong writing system, it tries the next id for that batch.

One id is a single point of failure. A model can time out, return text this tool rejects, or translate one language well and another poorly. A common case is romanized Hindi where `hi` expects Devanagari. Romanized output is rejected for native-script locales. A locale that should stay romanized needs an explicit `-Latn` subtag, such as `hi-Latn`.

That is why the shortlist contains several ids, strongest first. Order in the list is the order translation tries.

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

Preset lists from `init`, and the field reference: [Configuration — `provider` and `providers`](/reference/configuration#provider-and-providers).

<a id="validate-and-compare-models"></a>
## Check, list, and benchmark

Once the shortlist is in config, these commands inspect it. Translation can run before you use them.

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

With [zero data retention](/guide/providers-and-models#cheaperinference-zero-data-retention) on for Cheaper Inference, `check-models`, `list-models`, and `suggest-models` read `GET /models?zdr=true`.

Command details: [CLI — Models & languages](/reference/cli-commands/models).

<a id="further-reference"></a>
## Further reference

- [LLM providers](/guide/providers-and-models) — presets, API keys, and switching providers with `-P`.
- [Models tab](/guide/translation-dashboard/models) — the same ranking in the dashboard.
- [Configuration — `provider` and `providers`](/reference/configuration#provider-and-providers) — `translationModels`, `uiModels`, `localeModels`, timeouts, and cost rates.
- [suggest-models](/reference/cli-commands/models#suggest-models) — flags, filters, and the score formula.
