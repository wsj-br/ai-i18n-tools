<a id="cli--setup"></a>
# CLI — Configuración

<a id="version"></a>
### `version`

**Sinopsis:** `ai-i18n-tools version`

Imprime la versión de la CLI y la marca de tiempo de compilación (la misma información que `-V` / `--version` en el programa raíz).

---

<a id="init"></a>
### `init`

**Sinopsis:** `ai-i18n-tools init [-t <template>] [-o <path>] [-P <provider>] [--with-translate-ignore]`

Escriba un archivo de configuración de inicio (incluye `provider` / `providers`, `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` y `docs[].addFrontmatter`). Los comandos de traducción que llaman a un LLM requieren la clave API del proveedor activo en el entorno o `.env` (excepto Ollama); consulte [Proveedor y clave API](/es/guide/quick-start#provider-and-api-key).

**Opciones clave:** `-t` / `--template`, `-o` / `--output`, `-P` / `--provider`, `--with-translate-ignore`

`-P` / `--provider` selecciona qué **preajuste integrado** se va a andamiar (`openrouter` si se omite). Debe ser uno de: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `ollama`.

**Plantillas (`-t`):**

| Valor | Scaffolds |
|-------|-----------|
| `ui-markdown` | Flujo de trabajo de cadenas de interfaz de usuario de Markdown |
| `ui-docusaurus` | Interfaz de usuario de Docusaurus + documentos |
| `ui-starlight` | Documentos de Starlight |
| `ui-vitepress` | Documentos de VitePress (`docsOutput.style: "vitepress"`) más `vitepressThemeCatalog` para cadenas de temas |
| `ui-nextra` | Documentos de Nextra (`docsOutput.style: "nextra"`) más `nextraDictionaryPath` para el diccionario de temas (la barra lateral `_meta.ts` se recopila automáticamente) |
| `ui-fumadocs` | Documentos de Fumadocs (`docsOutput.style: "fumadocs"`) más `fumadocsUiCatalog` para anulaciones de la interfaz de usuario (la barra lateral `meta.json` se recopila automáticamente) |
| `ui-astro-website` | Cadenas de interfaz de usuario del sitio web de Astro |
| `ui-json-bundles` | JSON (solo `json[]`) |

`--with-translate-ignore` crea un `.translate-ignore` inicial.
