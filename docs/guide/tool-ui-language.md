<a id="tool-ui-language"></a>
# Tool UI language

The `ai-i18n-tools` localizes its own user interface — CLI help text, high-traffic log/summary/error messages, and the Translation Dashboard — independently of your project's `sourceLocale` / `targetLocales`. No configuration is required: by default the tool follows your OS locale.

<a id="locale-resolution"></a>
## Locale resolution

The UI locale is resolved from these sources, highest priority first:

1. `-L` / `--ui-lang <code>` global flag (e.g. `-L pt-BR`).
2. `AI_I18N_LANG` environment variable (e.g. `export AI_I18N_LANG=es`).
3. The `uiLanguage` config key in `ai-i18n-tools.config.json` (BCP-47 string).
4. The host OS locale (via `Intl.DateTimeFormat().resolvedOptions().locale`).

<a id="matching-and-fallback"></a>
## Matching and fallback

The requested locale is matched against the shipped UI languages exactly or by closest variation (for example `pt-PT` resolves to `pt-BR`, and `en-US` resolves to `en-GB`); when nothing matches it falls back to the source locale (`en-GB`). When a UI language is requested explicitly (via the flag, env var, or `uiLanguage`) but no shipped bundle matches, the CLI prints a one-time warning that the default locale will be used; a locale inferred only from the host OS never warns.

<a id="shipped-ui-languages"></a>
## Shipped UI languages

English (UK, source), German, Spanish, French, Hindi, Japanese, Korean, Portuguese (Brazil), Chinese (Simplified), Chinese (Traditional).

<a id="translation-dashboard"></a>
## Translation Dashboard

The Translation Dashboard reads the resolved locale, layout direction, and translation bundle from `GET /api/ui-i18n` and applies them on load (it sets `<html lang>` / `dir` and localizes static markup via `data-i18n*` attributes).

<a id="related"></a>
## Related

- [`AI_I18N_LANG`](/reference/environment-variables) — environment variable override
- [`uiLanguage`](/reference/configuration#uilanguage-optional) — config key override
- [`-L` / `--ui-lang`](/reference/cli-commands/) — CLI flag override (highest priority)
