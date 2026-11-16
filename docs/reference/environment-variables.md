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
| `APIKEYFAN_API_KEY` | `apikeyfan` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

The key is required when that provider is active. For `apikeyfan`, the legacy `APIFUN_API_KEY` is accepted when `APIKEYFAN_API_KEY` is unset or empty. A custom `apiKeyEnv` disables this fallback. Preset URLs: [Built-in providers](/guide/providers-and-models#built-in-providers).

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

When no provider API key is set, the CLI and `doctor` read `.env` and `.env.local` from the directory that contains `ai-i18n-tools.config.json`. Only the variables in the tables above (plus a custom `providers.*.apiKeyEnv`) are copied, and only when that variable is unset. `.env.local` wins when both files set the same name. A warning names the file and the variables that were read. `doctor` repeats one warning per file in the Environment section and counts each in the summary. That warning exits 0 unless `--strict` is set, which exits 1. An error exits 2. If any provider API key already has a value, neither file is read.
