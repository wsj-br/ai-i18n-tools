<a id="cli--documents"></a>
# CLI — Documentos

<a id="translate-docs"></a>
### `translate-docs`

**Sinopsis:** `ai-i18n-tools translate-docs [options]`

Traduce markdown, MDX, `.astro`, JSON de catálogo opcional de Docusaurus (`docusaurusCatalogDir`), `_meta.ts`/diccionario `.ts` opcional de Nextra y catálogo de temas opcional de VitePress para cada bloque `docs`.

**Opciones clave:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `-p` / `-f`, `--dry-run`

`-j`: número máximo de configuraciones regionales paralelas; `-b`: número máximo de llamadas a la API por lotes paralelas por archivo. `--prompt-format`: formato de conexión por lotes (`xml` | `json-array` | `json-object`).

**Véase también:** [Comportamiento de la caché y banderas `translate-docs`](/es/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [Formato de solicitud por lotes](/es/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**Sinopsis:** `ai-i18n-tools write-heading-ids [options]`

Requiere al menos un bloque `docs[]`. Recopila `.md` / `.mdx` bajo el `contentPaths` de cada bloque (respeta `.translate-ignore`). Por defecto, inserta una línea de anclaje HTML `<a id="slug"></a>` inmediatamente antes de cada encabezado ATX plano `#` (omite los encabezados dentro de bloques de código cercados). Los ID de encabezado existentes de cualquier forma (línea de anclaje HTML, sufijo clásico `{#id}`, comentario MDX `{/* #id */}`) se reemplazan con el estilo seleccionado; el slug siempre se deriva del texto del encabezado actual. Con `--slug-style mdx-comment`, escribe un sufijo de comentario MDX de Docusaurus en la línea del encabezado en su lugar (el mismo algoritmo de slug estilo GitHub) y elimina un anclaje HTML precedente si está presente. `--remove` elimina todas esas formas de ID de encabezado y no escribe nada en su lugar.

**Opciones clave:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--remove`, `--dry-run`

`--slug-style`: `github` (predeterminado; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`, `mdx-comment` (sufijo Docusaurus `{/* #… */}`). Con `pymdown`, opcional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--remove` no se puede combinar con `--pymdown-*`.

**Véase también:** [Enlaces de anclaje](/es/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**Sinopsis:** `ai-i18n-tools check-markdown [options]`

Escanea markdown/MDX bajo el `contentPaths` de cada bloque `docs[]` (mismo descubrimiento que `translate-docs`, respeta `.translate-ignore`): emparejamiento de delimitadores, código en línea no cerrado y `STRONG_OUTSIDE_LINK` cuando `**`/`__` envuelven un enlace `[text](url)`.

Imprime líneas `relativePath:line: [ISSUE_CODE] message` en stderr; código de salida **1** si hay algún problema. `--json`: informe JSON en stdout. Escribe `markdown_source_issues` en `cacheDir` a menos que `--no-cache`. `-v` añade hashes de origen a las líneas de stderr.

**Opciones clave:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**Véase también:** [Problemas de Markdown](/es/guide/translation-dashboard/markdown-issues)
