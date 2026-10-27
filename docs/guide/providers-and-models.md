<a id="llm-providers-and-models"></a>
# LLM providers

Every translation pipeline — `translate-ui`, `translate-docs`, `translate-json`, and `translate-svg` — sends text to an LLM through the same provider-agnostic client. Before any of those commands can run, configure **at least one provider** in `ai-i18n-tools.config.json` and set the matching **API key** in your environment or `.env` (built-in presets except **Ollama**). `init` writes a starter `provider` / `providers` block; you still must supply credentials for the active preset.

You configure **which API endpoint to call** once in config; all translation commands share that setup and the same SQLite cache. Which models that provider tries is a separate step: [AI Models](/guide/ai-models).

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
<a id="validate-and-compare-models"></a>
### Models

Choosing models, the fallback list, and `suggest-models`, `check-models`, `list-models`, and `bench-models` are on [AI Models](/guide/ai-models).

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

- [AI Models](/guide/ai-models) — ranked shortlist, fallback list, and the model commands.
- [Configuration — `provider` and `providers`](/reference/configuration#provider-and-providers) — preset table, custom endpoints, request timeouts, cost rates, Cheaper Inference zero data retention, OpenRouter-specific behaviour.
- [Architecture — LLM client](/reference/architecture) — how model fallback, batching, and cost reporting work internally.
- [Environment variables](/reference/environment-variables) — API-key env vars and base-URL overrides.
