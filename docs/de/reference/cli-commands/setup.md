<a id="cli--setup"></a>
# CLI – Einrichtung

<a id="version"></a>
### `version`

**Synopsis:** `ai-i18n-tools version`

Gibt die CLI-Version und den Build-Zeitstempel aus (dieselbe Information wie `-V` / `--version` im Stammprogramm).

---

<a id="init"></a>
### `init`

**Synopsis:** `ai-i18n-tools init [-t <template>] [-o <path>] [-P <provider>] [--with-translate-ignore]`

Schreiben Sie eine Starter-Konfigurationsdatei (enthält `provider` / `providers`, `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` und `docs[].addFrontmatter`). Übersetzungsbefehle, die ein LLM aufrufen, erfordern den API-Schlüssel des aktiven Anbieters in der Umgebung oder `.env` (Ollama ausgenommen) – siehe [Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key).

**Wichtige Optionen:** `-t` / `--template`, `-o` / `--output`, `-P` / `--provider`, `--with-translate-ignore`

`-P` / `--provider` wählt das **eingebaute Preset** aus, das als Gerüst dienen soll (`openrouter`, wenn weggelassen). Muss einer der folgenden Werte sein: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `ollama`.

**Vorlagen (`-t`):**

| Wert | Gerüste |
|-------|-----------|
| `ui-markdown` | Markdown UI-Strings-Workflow |
| `ui-docusaurus` | Docusaurus UI + Docs |
| `ui-starlight` | Starlight Docs |
| `ui-vitepress` | VitePress Docs (`docsOutput.style: "vitepress"`) plus `vitepressThemeCatalog` für Theme-Strings |
| `ui-nextra` | Nextra Docs (`docsOutput.style: "nextra"`) plus `nextraDictionaryPath` für das Theme-Wörterbuch (Sidebar `_meta.ts` wird automatisch gesammelt) |
| `ui-fumadocs` | Fumadocs Docs (`docsOutput.style: "fumadocs"`) plus `fumadocsUiCatalog` für UI-Overrides (Sidebar `meta.json` wird automatisch gesammelt) |
| `ui-astro-website` | Astro Website UI-Strings |
| `ui-json-bundles` | JSON (nur `json[]`) |

`--with-translate-ignore` erstellt eine Starter-`.translate-ignore`.
