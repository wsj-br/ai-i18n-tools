<a id="cli--models--catalog"></a>
# CLI — Models & catalog

<a id="check-models"></a>
### `check-models`

**Synopsis:** `ai-i18n-tools check-models`

Validate each configured model id against the active provider's `GET /models` list (membership and `expiration_date`). Requires that provider's API key (none for keyless providers like Ollama). Exits non-zero when any configured id is missing or expired, and respects the provider's `requestTimeoutMs`. When the provider returns pricing (e.g. OpenRouter), also shows USD per 1M tokens for prompt/completion.

**See also:** [LLM providers](/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Synopsis:** `ai-i18n-tools list-models`

List every model the active provider advertises via its `GET /models` list (sorted by id; active provider follows the config `provider` key, override with `-P` / `--provider`). Requires that provider's API key (none for keyless providers like Ollama). When the provider returns pricing (e.g. OpenRouter), also shows USD per 1M tokens for prompt/completion, and tags entries past `expiration_date`.

**Key options:** `-P` / `--provider`

**See also:** [LLM providers](/guide/providers-and-models)

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
