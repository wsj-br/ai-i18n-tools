# Providers and models

The LLM transport is provider-agnostic. Configure one or more named providers,
then select the active one. The same selection drives every pipeline (UI,
Documents, JSON, SVG).

## Select a provider

- `init -P <provider>` scaffolds a `providers.<name>` block and sets `provider`.
- With exactly one provider configured, `provider` is optional.
- The global `-P` / `--provider` flag overrides the configured `provider` for a
  single run. Use it to A/B a provider without editing config.

## Configure a provider block

Merge into an already-configured project; pick model ids the provider actually
serves:

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": ["openai/gpt-4.1-mini", "openai/gpt-4.1"]
    }
  }
}
```

- `translationModels`: ordered fallback chain of plain upstream model ids (no
  provider prefix). The next model is tried when one fails.
- `uiModels`: optional chain for UI work (`translate-ui`, plural generation,
  `proofread-ui`), tried after `localeModels` and before `translationModels`.
- `localeModels`: optional per-locale overrides (`{ "locale": "ja", "models": ["..."] }`),
  tried first for that locale.
- `baseUrl` + `apiKeyEnv`: point at any OpenAI-compatible endpoint without a
  built-in preset. Known providers inherit these from their preset.
- `headers`, `maxTokens`, `temperature`, `requestTimeout` / `requestTimeoutMs`:
  optional per-provider overrides.
- `pricing`: optional USD-per-1M-token rates recorded when the provider reports no
  cost; a reported cost is never overwritten.

## Credentials

- Supply the API key through the provider's documented environment variable, not
  in config, logs, or commits.
- The CLI loads `.env` from the working directory without overriding existing
  environment variables. From a subdirectory with no `.env`, load the repo-root
  `.env` in the shell first.

## Inspect and verify

- `ai-i18n-tools list-models` and `check-models` inspect the active provider's
  catalog and connectivity. `doctor` runs the provider catalog and release checks;
  `--local` skips both.
- `suggest-models` and `bench-models` help compare candidates before committing a
  chain.
- Keep source-content transmission and provider cost within the user's
  authorization before any model call.

## Published guides

- [Providers and models](https://wsj-br.github.io/ai-i18n-tools/guide/providers-and-models)
- [AI models](https://wsj-br.github.io/ai-i18n-tools/guide/ai-models)
- [Configuration](https://wsj-br.github.io/ai-i18n-tools/reference/configuration#provider-and-providers)
