<a id="llm-providers-and-models"></a>
# LLM providers and models

Every translation pipeline — `translate-ui`, `translate-docs`, `translate-json`, and `translate-svg` — sends text to an LLM through the same provider-agnostic client. Before any of those commands can run, configure **at least one provider** in `ai-i18n-tools.config.json` and set the matching **API key** in your environment or `.env` (built-in presets except **Ollama**). `init` writes a starter `provider` / `providers` block; you still must supply credentials for the active preset.

You configure **which API endpoint to call** and **which models to try** once in config; all translation commands share that setup and the same SQLite cache.

The CLI resolves the active provider from the top-level `provider` key (or the sole entry in `providers` when only one is configured). Each provider block lists an ordered `translationModels` fallback chain; built-in presets inherit `baseUrl` and the API-key environment variable automatically (override them per provider when needed).

<a id="built-in-providers"></a>
### Built-in providers

Preset provider keys need only `translationModels` — base URL and API-key env var are filled in automatically:

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
| `ollama` | `http://localhost:11434/v1` | (none) |

For any **non-preset** key, set `baseUrl` and `apiKeyEnv` explicitly in config.

Set the active provider's API key in your environment or `.env` file. The CLI auto-loads `.env` from the working directory without overriding variables already set in the shell. See [Environment variables](/reference/environment-variables).

<a id="model-fallback-chain"></a>
### Model fallback chain

`translationModels` is an **ordered list**, not a single choice. The CLI tries the first model; on request or parse failure it moves to the next entry. Configure several models so a transient outage or a model that struggles with a locale does not block the whole run.

**Resolution tiers** (deduplicated, order preserved):

| Pipeline | Order |
| --- | --- |
| UI (`translate-ui`, plurals, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| Documents, JSON, SVG | `localeModels(locale)` → `translationModels` |

Optional `providers.<active>.uiModels` is a UI-only list tried after any matching per-locale override and before the global `translationModels` chain. Optional `providers.<active>.localeModels` maps a BCP-47 locale to models tried **first** for that locale in every pipeline (`pt-br` matches `pt-BR`). When no `localeModels` entry matches, only the pipeline-specific tiers apply.

Different providers and models vary in cost, speed, and quality across languages. Treat the default list from `npx ai-i18n-tools init` as a starting point — expand it when a locale consistently produces poor results, or add a `localeModels` entry for that locale. Full defaults and rationale: [Configuration — `provider` and `providers`](/reference/configuration#provider-and-providers).

**UI strings:** optional `uiModels` lets you route `translate-ui`, plural generation, and `proofread-ui` through premium models before the global `translationModels` chain — useful because UI copy is short but user-facing.

**Asian locales:** optional `localeModels` entries for `ja`, `ko`, `zh-Hans`, and `zh-Hant` are tried first in every pipeline; models such as `z-ai/glm-5.2` and `minimax/minimax-m2.7` often perform better on CJK scripts than general-purpose fallbacks.

Example config (OpenRouter):

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "meta-llama/llama-3.3-70b-instruct",
        "openai/gpt-4o-mini",
        "google/gemma-4-26b-a4b-it",
        "anthropic/claude-3-haiku",
        "z-ai/glm-5.2",
        "google/gemini-3-flash-preview",
        "~anthropic/claude-sonnet-latest"
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "z-ai/glm-5.2"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] }
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

`check-models` calls the provider's `GET /models` endpoint, validates every id from `translationModels`, `uiModels`, and `localeModels`, reports ids that are missing or past `expiration_date`, and exits non-zero when any configured id is invalid. When the provider returns pricing (OpenRouter does), it also shows estimated USD per 1M tokens.

Browse the full catalog advertised by a provider:

```bash
npx ai-i18n-tools list-models
```

Benchmark configured models on a real translation sample — each unique id from `translationModels`, `uiModels`, and `localeModels` runs in isolation so you can compare wall-clock time, token usage, and cost:

```bash
npx ai-i18n-tools bench-models
```

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

Each provider block can define its own `translationModels`, optional `uiModels` and `localeModels`, `maxTokens`, `temperature`, and `requestTimeoutMs`. A legacy top-level `openrouter` block is still accepted and auto-migrated to `providers.openrouter` on load.

Runnable example with four providers on the same document: [`examples/multi-provider`](/examples#multi-provider).

<a id="further-reference"></a>
### Further reference

- [Configuration — `provider` and `providers`](/reference/configuration#provider-and-providers) — preset table, custom endpoints, request timeouts, OpenRouter-specific behaviour.
- [Architecture — LLM client](/reference/architecture) — how model fallback, batching, and cost reporting work internally.
- [Environment variables](/reference/environment-variables) — API-key env vars and base-URL overrides.
