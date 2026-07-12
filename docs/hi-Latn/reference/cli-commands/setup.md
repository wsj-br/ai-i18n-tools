<a id="cli--setup"></a>
# CLI — Setup

<a id="version"></a>
### `version`

**Synopsis:** `ai-i18n-tools version`

CLI version aur build timestamp print karein (root program par `-V` / `--version` jaisi hi jaankari).

---

<a id="init"></a>
### `init`

**Saransh:** `ai-i18n-tools init [-t <template>] [-o <path>] [-P <provider>] [--with-translate-ignore]`

Ek starter config file likhen (ismein `provider` / `providers`, `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, aur `docs[].addFrontmatter` shamil hain). LLM ko call karne wale translation commands ke liye environment mein ya `.env` mein active provider ki API key ki zaroorat hoti hai (Ollama ko chhodkar) — [Provider aur API key](/hi-Latn/guide/quick-start#provider-and-api-key) dekhen.

**Mukhya vikalp:** `-t` / `--template`, `-o` / `--output`, `-P` / `--provider`, `--with-translate-ignore`

`-P` / `--provider` chunata hai ki kaun sa **built-in preset** scaffold karna hai (chhodne par `openrouter`). Inmein se ek hona chahiye: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `ollama`.

**Templates (`-t`):**

| Value | Scaffolds |
|-------|-----------|
| `ui-markdown` | Markdown UI strings workflow |
| `ui-docusaurus` | Docusaurus UI + docs |
| `ui-starlight` | Starlight docs |
| `ui-vitepress` | VitePress docs (`docsOutput.style: "vitepress"`) aur theme strings ke liye `vitepressThemeCatalog` |
| `ui-nextra` | Nextra docs (`docsOutput.style: "nextra"`) aur theme dictionary ke liye `nextraDictionaryPath` (sidebar `_meta.ts` apne aap collect ho jaati hai) |
| `ui-fumadocs` | Fumadocs docs (`docsOutput.style: "fumadocs"`) aur UI overrides ke liye `fumadocsUiCatalog` (sidebar `meta.json` apne aap collect ho jaati hai) |
| `ui-astro-website` | Astro website UI strings |
| `ui-json-bundles` | JSON (sirf `json[]`) |

`--with-translate-ignore` ek starter `.translate-ignore` banata hai.
