<a id="llm-providers-and-models"></a>
# LLM providers and models

Every translation pipeline — `translate-ui`, `translate-docs`, `translate-json`, and `translate-svg` — sends text to an LLM through the same provider-agnostic client. Before any of those commands can run, configure **at least one provider** in `ai-i18n-tools.config.json` and set the matching **API key** in your environment or `.env` (built-in presets except **Ollama**). `init` writes a starter `provider` / `providers` block; you still must supply credentials for the active preset.

You configure **which API endpoint to call** and **which models to try** once in config; all translation commands share that setup and the same SQLite cache.

The CLI resolves the active provider from the top-level `provider` key (or the sole entry in `providers` when only one is configured). Each provider block lists an ordered `translationModels` fallback chain; built-in presets inherit `baseUrl` and the API-key environment variable automatically (override them per provider when needed).

<a id="built-in-providers"></a>
### Built-in providers

Preset provider keys need only `translationModels` — base URL and API-key env var are filled in automatically:

<div class="provider-presets">

| Provider | Base URL | API-key env var |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `cheaperinference` | `https://api.cheaperinference.com/v1` | `CHEAPERINFERENCE_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (none) |

</div>

For any **non-preset** key, set `baseUrl` and `apiKeyEnv` explicitly in config.

Set the active provider's API key in your environment or `.env` file. The CLI auto-loads `.env` from the working directory without overriding variables already set in the shell. See [Environment variables](/reference/environment-variables).

<a id="cheaperinference-zero-data-retention"></a>
### Zero data retention (Cheaper Inference)

`providers.cheaperinference.zeroDataRetention` is optional and defaults to off. Set it when this project must send prompts only through providers that do not keep them.

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

With the flag on, every chat request includes `"zdr": true`, and `list-models`, `check-models`, and `suggest-models` (including the dashboard Models tab) read `GET /v1/models?zdr=true`. That catalog lists the models a zero-data-retention request can use, at the zero-data-retention price. `check-models` treats an id missing from that catalog as invalid. The flag does not create a route for a model the catalog leaves out. Remove that id from `translationModels`, `uiModels`, or `localeModels`.

Leave the flag off when the Cheaper Inference account does not require zero data retention. If [Data Protection](https://platform.cheaperinference.com/dashboard/data-protection) is already on for the account, Cheaper Inference still refuses a model with no zero-data-retention route. The error names that model. To keep the account policy, set `zeroDataRetention` to `true` and switch to a model from the zero-data-retention catalog. To keep the refused model, turn zero data retention off on that page. The fallback chain then tries the next configured model.

<a id="model-fallback-chain"></a>
### Model fallback chain

`translationModels` is an **ordered list**, not a single choice. The CLI tries the first model; on request, parse, or wrong-script failure it moves to the next entry. Configure several models so a transient outage or a model that struggles with a locale (for example romanized Hindi instead of Devanagari) does not block the whole run. Romanized output is rejected for native-script locales; a locale that should stay romanized must be configured with an explicit `-Latn` subtag (for example `hi-Latn`).

**Resolution tiers** (deduplicated, order preserved):

| Pipeline | Order |
| --- | --- |
| UI (`translate-ui`, plurals, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documents, JSON, SVG | `localeModels(locale)` → `translationModels` |

Optional `providers.<active>.uiModels` is a UI-only list tried after any matching per-locale override and before the global `translationModels` chain. Optional `providers.<active>.localeModels` maps a BCP-47 locale to models tried **first** for that locale in every pipeline (`pt-br` matches `pt-BR`). When no `localeModels` entry matches, only the pipeline-specific tiers apply.

Different providers and models vary in cost, speed, and quality across languages. Treat the model list from `npx ai-i18n-tools init -P <provider>` as a starting point — expand it when a locale consistently produces poor results, or add a `localeModels` entry for that locale. Preset lists and rationale: [Configuration — `provider` and `providers`](/reference/configuration#provider-and-providers).

**UI strings:** optional `uiModels` lets you route `translate-ui`, plural generation, and `proofread-ui` through premium models before the global `translationModels` chain — useful because UI copy is short but user-facing.

**Asian locales:** optional `localeModels` entries for `ja`, `ko`, `zh-Hans`, and `zh-Hant` are tried first in every pipeline; models such as `z-ai/glm-5.3` and `minimax/minimax-m2.7` often perform better on CJK scripts than general-purpose fallbacks.

Example config (OpenRouter). `translationModels` and `uiModels` are the lists this repository uses in `ai-i18n-tools.config.json`. `localeModels` is an optional recommended add-on for CJK locales; this repository does not set it.

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3.7-max",
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4",
        "google/gemini-3.5-flash",
        "tencent/hy-mt2-30b-a3b",
        "mistralai/mistral-large",
        "openai/gpt-4o-mini",
        "cohere/command-r-plus-08-2024",
        "qwen/qwen-2.5-72b-instruct"  
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] }
      ]
    }
  }
}
```

<a id="validate-and-compare-models"></a>
### Validate and compare models

Before changing `translationModels`, confirm each id is still available on the active provider:

```bash
npx ai-i18n-tools check-models
```

`check-models` calls the provider's `GET /models` endpoint, validates every id from `translationModels`, `uiModels`, and `localeModels`, reports ids that are missing or past `expiration_date`, and exits non-zero when any configured id is invalid. When the provider returns pricing (OpenRouter and Cheaper Inference do), it also shows USD per 1M tokens. With [`zeroDataRetention`](/guide/providers-and-models#cheaperinference-zero-data-retention) on, `check-models` and `list-models` use `GET /models?zdr=true`.

Browse the full catalog advertised by a provider:

```bash
npx ai-i18n-tools list-models
```

Benchmark configured models on a real translation sample — each unique id from `translationModels`, `uiModels`, and `localeModels` runs in isolation so you can compare wall-clock time, token usage, and cost:

```bash
npx ai-i18n-tools bench-models
```

Ask for a ranked shortlist (quality by default, or `--price`) and optionally write the top ids into `translationModels`. The [Models tab](/guide/translation-dashboard/models) shows the same ranking, filters, and config update.

```bash
npx ai-i18n-tools suggest-models
npx ai-i18n-tools suggest-models --list
npx ai-i18n-tools suggest-models --max-output-price 2 --min-delta 2
npx ai-i18n-tools suggest-models --price --top 8 --json
npx ai-i18n-tools suggest-models --apply
npx ai-i18n-tools suggest-models --refresh
```

The table columns are rank, model id, index, measured ChrF, measured Arena Score, and input/output USD per 1M tokens. A missing measurement is `—`. `--list` prints those columns for the models already in `translationModels`. `--max-output-price` keeps models at or below that output USD per 1M tokens and leaves out a model with no output price. `--min-delta` keeps a model only when its index is at least that many points below the previous kept model. `--top` (default 8) limits the table, `--json`, and `--apply` after those filters. `--apply` replaces only `translationModels`. `--refresh` redownloads the 7-day benchmark cache. Optional weights are [`modelSuggestion`](/reference/configuration#modelsuggestion). See [suggest-models](/reference/cli-commands/models#suggest-models).

Override the sample text, locales, or model list:

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

Command details: [CLI reference](/reference/cli-commands/).

<a id="multiple-providers"></a>
### Multiple providers

When more than one provider is configured, set the top-level `provider` key to select the default. Switch per run without editing the config:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

Each provider block can define its own `translationModels`, optional `uiModels` and `localeModels`, `maxTokens`, `temperature`, and `requestTimeout` (seconds) or `requestTimeoutMs`. A timeout on the provider overrides the top-level `requestTimeout` / `requestTimeoutMs`. A legacy top-level `openrouter` block is still accepted and auto-migrated to `providers.openrouter` on load.

Optional `pricing` and `modelPricing` set USD per 1,000,000 tokens (`inputPerMTokens` and `outputPerMTokens`) when the provider omits `usage.cost`. `pricing` is the provider-wide default; a `modelPricing` entry overrides it for one model id. OpenRouter and Cheaper Inference already return a per-call cost, so leave both unset on those providers. A provider-reported cost is kept as returned. The amount is included in the translation summary, [`usage`](/reference/cli-commands/workflows#usage), and [Usage & costs](/guide/translation-dashboard/usage).

Runnable example with four providers on the same document, including sample rates: [`examples/multi-provider`](/examples#multi-provider).

<a id="further-reference"></a>
### Further reference

- [Configuration — `provider` and `providers`](/reference/configuration#provider-and-providers) — preset table, custom endpoints, request timeouts, cost rates, Cheaper Inference zero data retention, OpenRouter-specific behaviour.
- [Architecture — LLM client](/reference/architecture) — how model fallback, batching, and cost reporting work internally.
- [Environment variables](/reference/environment-variables) — API-key env vars and base-URL overrides.
