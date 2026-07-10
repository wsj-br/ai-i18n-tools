<a id="environment-variables"></a>
# Environment variables

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | API key for the `openrouter` provider (required when it is active). |
| Other provider keys    | Each provider reads its own key env var: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama needs none). Override per provider with `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Override `providers.openrouter.baseUrl` (only when that provider is configured). |
| `OLLAMA_BASE_URL`      | Override `providers.ollama.baseUrl` (only when that provider is configured). |
| `AI_I18N_LANG`         | Language for the tool's own UI (CLI help, logs, dashboard). Overridden by `-L` / `--ui-lang`; overrides config `uiLanguage`. See [Tool UI language](/guide/tool-ui-language). |
| `I18N_SOURCE_LOCALE`   | Override `sourceLocale` at runtime.                        |
| `I18N_TARGET_LOCALES`  | Comma-separated locale codes to override `targetLocales`.  |
| `I18N_LOG_LEVEL`       | Logger level (`debug`, `info`, `warn`, `error`). Unknown values (including `silent`) fall back to `info`. |
| `NO_COLOR`             | When `1`, disable ANSI colours in log output.              |
| `I18N_LOG_SESSION_MAX` | Max lines kept per log session (default `5000`).           |

At startup the CLI also auto-loads a `.env` file from the current working directory (via Node's `process.loadEnvFile`), so provider API keys are picked up in non-interactive shells that do not source `.envrc` / `direnv`. Variables already present in the environment are never overridden, so real CI/production values still win.
