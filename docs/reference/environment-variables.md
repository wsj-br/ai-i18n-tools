<a id="environment-variables"></a>
# Environment variables

<a id="provider-api-keys"></a>
## Provider API keys

`init -P <provider>` selects that built-in preset and the API key in the table below. Override the variable name for one provider with `providers.<name>.apiKeyEnv`. Ollama has no API key.

| Variable | Provider |
| --- | --- |
| `OPENROUTER_API_KEY` | `openrouter` |
| `OPENAI_API_KEY` | `openai` |
| `ANTHROPIC_API_KEY` | `anthropic` |
| `GOOGLE_API_KEY` | `gemini` |
| `DEEPSEEK_API_KEY` | `deepseek` |
| `CEREBRAS_API_KEY` | `cerebras` |
| `GROQ_API_KEY` | `groq` |
| `MISTRAL_API_KEY` | `mistral` |
| `XAI_API_KEY` | `xai` |
| `NVIDIA_API_KEY` | `nvidia` |
| `ALIBABA_API_KEY` | `alibaba` |
| `APIFUN_API_KEY` | `apifun` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

The key is required when that provider is active. Preset URLs: [Built-in providers](/guide/providers-and-models#built-in-providers).

<a id="provider-base-urls"></a>
## Provider base URLs

These two variables override `baseUrl` for a configured provider. Every other preset changes its URL in config (`providers.<name>.baseUrl`), not through an environment variable.

| Variable | Overrides |
| --- | --- |
| `OPENROUTER_BASE_URL` | `providers.openrouter.baseUrl` (only when that provider is configured) |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl` (only when that provider is configured) |

<a id="tool-and-run"></a>
## Tool and run

| Variable | Description |
| --- | --- |
| `AI_I18N_LANG` | Language for the tool's own UI (CLI help, logs, dashboard). Overridden by `-L` / `--ui-lang`; overrides config `uiLanguage`. See [Tool UI language](/guide/tool-ui-language). |
| `I18N_SOURCE_LOCALE` | Override `sourceLocale` at runtime. |
| `I18N_TARGET_LOCALES` | Comma-separated locale codes to override `targetLocales`. |
| `I18N_LOG_LEVEL` | Logger level (`debug`, `info`, `warn`, `error`). Unknown values (including `silent`) fall back to `info`. |
| `NO_COLOR` | When `1`, disable ANSI colours in log output. |
| `I18N_LOG_SESSION_MAX` | Max lines kept per log session (default `5000`). |

At startup the CLI also auto-loads a `.env` file from the current working directory (via Node's `process.loadEnvFile`), so provider API keys are picked up in non-interactive shells that do not source `.envrc` / `direnv`. Variables already present in the environment are never overridden, so real CI/production values still win.
