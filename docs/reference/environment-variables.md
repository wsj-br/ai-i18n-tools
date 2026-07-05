<a id="environment-variables"></a>
# Environment variables

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | API key for the `openrouter` provider (required when it is active). |
| Other provider keys    | Each provider reads its own key env var: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama needs none). Override per provider with `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Override `providers.openrouter.baseUrl` (only when that provider is configured). |
| `OLLAMA_BASE_URL`      | Override `providers.ollama.baseUrl` (only when that provider is configured). |
| `AI_I18N_LANG`         | Language for the tool's own UI (CLI help, logs, dashboard). Overridden by `-L` / `--ui-lang`; overrides config `uiLanguage`. See [Tool UI language](#tool-ui-language). |
| `I18N_SOURCE_LOCALE`   | Override `sourceLocale` at runtime.                        |
| `I18N_TARGET_LOCALES`  | Comma-separated locale codes to override `targetLocales`.  |
| `I18N_LOG_LEVEL`       | Logger level (`debug`, `info`, `warn`, `error`). Unknown values (including `silent`) fall back to `info`. |
| `NO_COLOR`             | When `1`, disable ANSI colours in log output.              |
| `I18N_LOG_SESSION_MAX` | Max lines kept per log session (default `5000`).           |

At startup the CLI also auto-loads a `.env` file from the current working directory (via Node's `process.loadEnvFile`), so provider API keys are picked up in non-interactive shells that do not source `.envrc` / `direnv`. Variables already present in the environment are never overridden, so real CI/production values still win.

<a id="tool-ui-language"></a>
## Tool UI language

The tool localizes its own user interface — CLI help text, high-traffic log/summary/error messages, and the Translation Dashboard — independently of your project's `sourceLocale` / `targetLocales`. The UI locale is resolved from these sources, highest priority first:

1. `-L` / `--ui-lang <code>` global flag (e.g. `-L pt-BR`).
2. `AI_I18N_LANG` environment variable (e.g. `export AI_I18N_LANG=es`).
3. The `uiLanguage` config key in `ai-i18n-tools.config.json` (BCP-47 string).
4. The host OS locale (via `Intl.DateTimeFormat().resolvedOptions().locale`).

The requested locale is matched against the shipped UI languages exactly or by closest variation (for example `pt-PT` resolves to `pt-BR`, and `en-US` resolves to `en-GB`); when nothing matches it falls back to the source locale (`en-GB`). When a UI language is requested explicitly (via the flag, env var, or `uiLanguage`) but no shipped bundle matches, the CLI prints a one-time warning that the default locale will be used; a locale inferred only from the host OS never warns.

Shipped UI languages: `en-GB` (source) plus `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans`, and `zh-Hant`. The Translation Dashboard reads the resolved locale, layout direction, and translation bundle from `GET /api/ui-i18n` and applies them on load (it sets `<html lang>` / `dir` and localizes static markup via `data-i18n*` attributes). This feature does not require any configuration — by default the tool follows your OS locale.
