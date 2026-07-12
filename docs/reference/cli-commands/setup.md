<a id="cli--setup"></a>
# CLI — Setup

<a id="version"></a>
### `version`

**Synopsis:** `ai-i18n-tools version`

Print CLI version and build timestamp (same information as `-V` / `--version` on the root program).

---

<a id="init"></a>
### `init`

**Synopsis:** `ai-i18n-tools init [-t <template>] [-o <path>] [-P <provider>] [--with-translate-ignore]`

Write a starter config file (includes `provider` / `providers`, `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, and `docs[].addFrontmatter`). Translation commands that call an LLM require the active provider's API key in the environment or `.env` (Ollama excepted) — see [Provider and API key](/guide/quick-start#provider-and-api-key).

**Key options:** `-t` / `--template`, `-o` / `--output`, `-P` / `--provider`, `--with-translate-ignore`

`-P` / `--provider` selects which **built-in preset** to scaffold (`openrouter` when omitted). Must be one of: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `ollama`.

**Templates (`-t`):**

| Value | Scaffolds |
|-------|-----------|
| `ui-markdown` | Markdown UI strings workflow |
| `ui-docusaurus` | Docusaurus UI + docs |
| `ui-starlight` | Starlight docs |
| `ui-vitepress` | VitePress docs (`docsOutput.style: "vitepress"`) plus `vitepressThemeCatalog` for theme strings |
| `ui-nextra` | Nextra docs (`docsOutput.style: "nextra"`) plus `nextraDictionaryPath` for the theme dictionary (sidebar `_meta.ts` is collected automatically) |
| `ui-fumadocs` | Fumadocs docs (`docsOutput.style: "fumadocs"`) plus `fumadocsUiCatalog` for UI overrides (sidebar `meta.json` is collected automatically) |
| `ui-astro-website` | Astro website UI strings |
| `ui-json-bundles` | JSON (`json[]` only) |

`--with-translate-ignore` creates a starter `.translate-ignore`.
