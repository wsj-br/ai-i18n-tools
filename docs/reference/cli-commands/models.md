<a id="cli--models--languages"></a>
# CLI — Models & languages

<a id="check-models"></a>
### `check-models`

**Synopsis:** `ai-i18n-tools check-models`

Validate each configured model id against the active provider's `GET /models` list (membership and `expiration_date`). Requires that provider's API key (none for keyless providers like Ollama). Exits non-zero when any configured id is missing or expired, and respects the resolved request timeout (`requestTimeout` or `requestTimeoutMs` on the provider, otherwise the top-level value). When the provider returns pricing (e.g. OpenRouter), also shows USD per 1M tokens for prompt/completion. When `providers.cheaperinference.zeroDataRetention` is true, the check uses `GET /v1/models?zdr=true` and fails an id that catalog leaves out.

**See also:** [LLM providers](/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Synopsis:** `ai-i18n-tools list-models`

List every model the active provider advertises via its `GET /models` list (sorted by id; active provider follows the config `provider` key, override with `-P` / `--provider`). Requires that provider's API key (none for keyless providers like Ollama). When the provider returns pricing (e.g. OpenRouter), also shows USD per 1M tokens for prompt/completion, and tags entries past `expiration_date`. When `providers.cheaperinference.zeroDataRetention` is true, the list is `GET /v1/models?zdr=true`.

**Key options:** `-P` / `--provider`

**See also:** [LLM providers](/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**Synopsis:** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

Rank the active provider's chat models and print the top ones (default 8). The table columns, in order, are rank, model id, index (the weighted score times 100, one decimal), measured languagebench ChrF, measured Arena Score, and input and output price in USD per 1M tokens. A missing measurement is `—`. The command needs that provider's API key (none for keyless providers such as Ollama). The active provider follows config `provider`; override it with `-P` / `--provider`.

Candidates come from the provider's `GET /models` list. When `providers.cheaperinference.zeroDataRetention` is true, that request is `GET /v1/models?zdr=true`. Expired rows and non-chat rows (embeddings, speech, image, video, moderation, rerankers) are left out. If that catalog request fails, the command exits 1.

`--quality` is the default. It weights ChrF and Arena Score above price. `--price` weights price above those scores and still keeps a quality floor, so an unmeasured cheap model does not jump the list. Passing both flags is an error. Passing neither means quality. Optional `modelSuggestion` weights in config replace either profile. See [Configuration](/reference/configuration#modelsuggestion). The same weights are used by the [dashboard Models tab](/guide/translation-dashboard/models).

ChrF is the mean of languagebench `translation_from` and `translation_to` rows whose metric is `chrf`, limited to this project's `sourceLocale` and `targetLocales`. Locales map to a languagebench language code (the primary subtag, with a few aliases such as `pt-BR` to `pt` and `zh-Hant` to `zh` and `yue`). An empty set uses `en`. Arena is the LMArena overall Arena Score, not Elo. The ranking price is `(3 × input + output) / 4` USD per 1M tokens. The price source is a non-zero catalog rate, then models.dev input and output rates, then languagebench's single cost figure. A catalog price of `0` is unpriced, not free. An unknown price is neutral on the quality profile and worst on the price profile. A missing ChrF sorts below the quality floor. The `0.35` and `0.45` stand-ins used for a missing ChrF or Arena affect only the index; the table prints `—` instead.

Rows that clear the floor come first, then higher index, then a cheaper blended price. `--top` (default `8`, an integer of at least 1) limits the table, the `--json` fragment, and `--apply` together, after the filters below.

`--list` prints the same columns for the active provider's configured `translationModels`, in that order, and ignores `--top`. The rank column is still each model's place in the full ranking. A configured id that is missing from the catalog, expired, or not a chat model is still listed, with `—` for measurements. `--list` cannot be combined with `--apply`.

`--max-output-price` keeps models whose output price per 1M tokens is less than or equal to that many USD. A model with no output price is left out. `--min-delta` then walks the remaining rows and keeps a model only when its index is at least that many points below the previous kept model. The first remaining model is always kept. A delta of `0` does not drop rows. Rows with no index are left out when the delta is greater than `0`. Rank numbers stay the ones from the full list. With `--list`, the walk follows `translationModels` order. Both filters also apply to `--json` and `--apply`. The [Models tab](/guide/translation-dashboard/models) has the same two controls.

`--json` writes this object to stdout (paste it inside the provider block) and sends the table and the attribution footer to stderr:

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` copies the current config to a sibling `ai-i18n-tools.config.{timestamp}.backup.json` (or `{name}.{timestamp}.backup.json` when `-c` names another file), then replaces `providers.<active>.translationModels` with those ids. A name collision adds `-2`, `-3`, and so on before `.backup.json`. If the copy fails, the config file is left unchanged. `uiModels` and `localeModels` are left unchanged. Scores are not written into the config file. The dashboard **Update config** button writes the same backup.

Benchmark data is cached at `<cacheDir>/benchmark-scores.json` (usually `.translation-cache/benchmark-scores.json`) for 7 days. The raw datasets are downloaded at runtime and are not shipped in the package. `--refresh` redownloads languagebench, Arena, and models.dev. A source that fails during `--refresh` is not filled from the previous cache. Without `--refresh`, a failed download reuses the cached slice. If one of languagebench or Arena fails, the command ranks with the other and says which source failed. If both fail, it exits 1. A models.dev failure leaves catalog prices in place. The dashboard has no refresh control; run `--refresh` from the CLI, then reload the Models tab.

The footer attributes languagebench (CC BY-SA 4.0), the LMArena Arena Score (CC BY 4.0), and models.dev (MIT).

**Key options:** `--quality`, `--price`, `--top`, `--json`, `--apply`, `--list`, `--max-output-price`, `--min-delta`, `--refresh`, `-P` / `--provider`

**See also:** [LLM providers](/guide/providers-and-models), [Models tab](/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**Synopsis:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

Benchmark each configured model by translating one sample in isolation (single-model client, no fallback chain). Prints a table of model id, input/output tokens, wall-clock translation time, and USD cost (`—` for providers that do not report cost), plus a totals row and per-model failures.

Models default to the union of the active provider's `translationModels`, `uiModels`, and `localeModels` ids (override with `--model`); the sample defaults to a built-in English markdown block (override with `--text` / `--file`); source/target default to config `sourceLocale` and the first `docs[]` target locale, falling back to the top-level `targetLocales` (override with `--source` / `--target`). Runs models in parallel, bounded by config `concurrency` (default 4); each model is still timed individually. Requires the active provider's API key.

**Key options:** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**Synopsis:** `ai-i18n-tools list-languages [search]`

List the bundled UI languages catalog (`data/ui-languages-complete.json`) as a human-readable table (code, text direction, English name, native name). Needs no config or API key. Pass an optional `search` term to keep only entries whose code, native name, English name, or direction contain it (case-insensitive), e.g. `list-languages portuguese`, `list-languages rtl`, `list-languages zh`.
