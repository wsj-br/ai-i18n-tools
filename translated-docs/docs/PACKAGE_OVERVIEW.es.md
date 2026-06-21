<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: Descripción del paquete

Este documento describe la arquitectura interna de `ai-i18n-tools`, cómo se integra cada componente y cómo se implementan los tres flujos de trabajo componibles (cadenas de interfaz de usuario, documentos y JSON anidado) más la traducción opcional de SVG.

Para obtener instrucciones prácticas de uso, consulte [GETTING_STARTED.md](GETTING_STARTED.es.md). Para capturas de pantalla e ilustraciones SVG en documentos traducidos, consulte [LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.es.md).

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[English (UK)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [Hindi (Roman)](./PACKAGE_OVERVIEW.hi-Latn.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [简体中文](./PACKAGE_OVERVIEW.zh-Hans.md) · [繁體中文](./PACKAGE_OVERVIEW.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabla de contenido**

- [Descripción general de la arquitectura](#architecture-overview)
- [Árbol de código fuente](#source-tree)
- [Flujo de trabajo 1 - Internals de traducción de interfaz](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Archivos de configuración regional planos](#flat-locale-files)
  - [Solicitudes de traducción de interfaz](#ui-translation-prompts)
- [Flujo de trabajo 2 - Internals de traducción de documentos](#workflow-2---document-translation-internals)
- [Flujo de trabajo 3 - Internos de JSON anidado](#workflow-3---nested-json-internals)
  - [Extractores](#extractors)
  - [Sitios híbridos Astro (interfaz de usuario + HTML de página)](#astro-hybrid-sites-ui--page-html)
  - [Inserción de anclas de encabezado (CLI de `write-heading-ids`)](#heading-anchor-insertion-write-heading-ids-cli)
  - [Protección de marcadores de posición](#placeholder-protection)
  - [Caché (`TranslationCache`)](#cache-translationcache)
  - [Resolución de rutas de salida](#output-path-resolution)
  - [Reescritura de enlaces planos](#flat-link-rewriting)
- [Infraestructura compartida](#shared-infrastructure)
  - [`LlmClient`](#openrouterclient)
  - [Carga de configuración](#config-loading)
  - [Registrador](#logger)
- [API de ayudantes en tiempo de ejecución](#runtime-helpers-api)
  - [Ayudantes RTL](#rtl-helpers)
  - [Fábricas de configuración de i18next](#i18next-setup-factories)
  - [Ayudantes de visualización](#display-helpers)
  - [Ayudantes de cadenas](#string-helpers)
- [API programática](#programmatic-api)
- [Puntos de extensión](#extension-points)
  - [Nombres personalizados de funciones (extracción de interfaz de usuario)](#custom-function-names-ui-extraction)
  - [Extractores personalizados](#custom-extractors)
  - [Rutas de salida personalizadas](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## Visión general de la arquitectura

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-ui, translate-svg, translate-docs, translate-json, sync, status, dashboard, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express app for the Translation Dashboard (cache / glossary)
└── Utils (src/utils/)         - logger, hash, ignore parser
```

Todo lo que los consumidores puedan necesitar programáticamente se reexporta desde `src/index.ts`.

---

<a id="source-tree"></a>
## Árbol de origen

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── locale-utils.ts             BCP-47 normalisation and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## Flujo de trabajo 1 - Internals de traducción de interfaz

```text
source files (JS/TS, optional `.astro`)
      │
      ▼  UIStringExtractor (i18next-scanner Parser; `.astro` via ui-string-babel.ts)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
LlmClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

<a id="uistringextractor"></a>
### `UIStringExtractor`

Utiliza `i18next-scanner` de `Parser.parseFuncFromString` para encontrar llamadas a `t("literal")` y `i18n.t("literal")` en archivos JS/TS. Para fuentes `.astro` (cuando se incluyen en `ui.uiExtractor.extensions`), `ui-string-babel.ts` analiza el frontmatter y los bloques de plantilla `{expression}` con `@babel/parser` y aplica las mismas reglas de `funcNames`. Los nombres de funciones y las extensiones de archivo se pueden configurar mediante `ui.uiExtractor` (`ui.reactExtractor` es un alias admitido). `extract` **también combina entradas no escaneadas en el mismo catálogo:** el `package.json` del proyecto `description` cuando `includePackageDescription` está habilitado (valor predeterminado), y cada `englishName` de `ui-languages.json` cuando `includeUiLanguageEnglishNames` es `true` y `uiLanguagesPath` está configurado (las cadenas ya encontradas en el código fuente tienen prioridad). Los hashes de segmento son los **primeros 8 caracteres hexadecimales del MD5** de la cadena fuente recortada — estos se convierten en las claves en `strings.json`.

Los sitios Astro SSG simples pueden omitir i18next: cargar `{locale}.json` plano en tiempo de compilación y resolver `t('English')` por clave de texto fuente (ver `examples/astro-website/src/i18n/t.ts` y [GETTING_STARTED — sitio web de Astro](GETTING_STARTED.es.md#astro-website)).

<a id="stringsjson"></a>
### `strings.json`

El catálogo maestro tiene la siguiente estructura:

```json
{
  "<md5-8>": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models` (opcional): por configuración regional, indica qué modelo produjo esa traducción tras la última ejecución exitosa de `translate-ui` para esa configuración regional (o `user-edited` si el texto se guardó desde el panel de traducción). `locations` (opcional): dónde encontró `extract` la cadena (escáner + línea de descripción del paquete; las cadenas solo en manifiesto `englishName` pueden omitir `locations`).

`extract` añade nuevas claves y conserva los datos existentes de `translated` / `models` para claves que aún estén presentes en el escaneo (literales del escáner, descripción opcional, manifiesto opcional `englishName`). `translate-ui` completa las entradas `translated` faltantes, actualiza `models` para las localizaciones que traduce y escribe los archivos de localización planos.

`ui-languages.json` **manifest** — Matriz JSON de `{ code, label, englishName, direction }` (BCP-47 `code`, interfaz de usuario `label`, referencia `englishName`, `"ltr"` o `"rtl"`). Usa `generate-ui-languages` para crear un archivo de proyecto a partir de `sourceLocale` + `targetLocales` y el archivo maestro incluido `data/ui-languages-complete.json`.

<a id="flat-locale-files"></a>
### Archivos de configuración regional planos

Cada localización objetivo recibe un archivo JSON plano (`de.json`) que asocia cadena fuente → traducción (sin campo `models`):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next carga estos archivos como paquetes de recursos y busca traducciones mediante la cadena fuente (modelo de clave como valor por defecto).

<a id="ui-translation-prompts"></a>
### Mensajes de traducción de interfaz

`buildUIPromptMessages` construye mensajes del sistema y del usuario que:

- Identifique los idiomas de origen y destino (por nombre mostrado en `localeDisplayNames` o `ui-languages.json`).
- Envíe un array JSON de cadenas y solicite un array JSON de traducciones a cambio.
- Incluya sugerencias del glosario cuando estén disponibles.

`LlmClient.translateUIBatch` prueba cada modelo en orden, recurriendo a errores de análisis o de red. La CLI construye esa lista a partir de `translationModels` del proveedor activo; para `translate-ui`, se antepone `ui.preferredModel` opcional cuando está configurado (eliminando duplicados del resto).

---

<a id="workflow-2---document-translation-internals"></a>
## Flujo de trabajo 2 - Internals de traducción de documentos

```text
markdown / MDX / JSON / `.astro` files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor / AstroTemplateExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── HTML tags, admonitions, anchors, MDX comments/JSX/braces,
                                URLs, inline code, emphasis masked as tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → LlmClient.translateDocumentBatch
      │
      ▼  PlaceholderHandler.restoreAfterTranslation
final text  ──────────────────── placeholders restored
      │
      ▼  resolveDocumentationOutputPath
output file  ─────────────────── Docusaurus layout or flat layout
```

<a id="extractors"></a>
### Extractores

Todos los extractores extienden `BaseExtractor` e implementan `extract(content, filepath): Segment[]`.

- `MarkdownExtractor`: divide el markdown en segmentos tipificados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. El frontmatter YAML se clasifica como **no traducible** (`slug`, `id` y otras claves de enrutamiento permanecen estables). Los bloques `export ...` de nivel superior (por ejemplo, definiciones de componentes React) se clasifican como segmentos `other` no traducibles junto con el manejo existente de `import ...`. Los bloques multilínea que comienzan con una etiqueta JSX en mayúscula (por ejemplo, un bloque `<Tabs>`) se clasifican como párrafos traducibles. Los segmentos no traducibles (bloques de código, HTML sin procesar) se conservan textualmente.
- `AstroTemplateExtractor`: análisis y reemplazo para páginas de marketing `.astro` (`translate-docs` mediante `translateAstroFile` en `doc-translate.ts`). Extrae nodos de texto HTML visibles al usuario y atributos traducibles (`alt`, `title`, `aria-label`, `placeholder`), además de literales de cadena dentro de bloques de plantilla `{expression}` cuando son visibles al usuario. Omite TypeScript en frontmatter, `<script>`, `<style>`, valores de atributos/claves protegidos y literales dentro de `t('…')`. La reensamblaje ajusta las rutas de importación relativas cuando las rutas de salida son más profundas (por ejemplo, `src/pages/de/index.astro`). Ver [GETTING_STARTED — páginas del sitio web de Astro](GETTING_STARTED.es.md#astro-website-parse-and-replace).
- `JsonExtractor`: extrae valores de cadena de archivos JSON de etiquetas de Docusaurus (catálogos de interfaz de usuario de Docusaurus, no cuerpo MDX).
- `SvgExtractor`: extrae contenido de `<text>`, `<title>` y `<desc>` de SVG (usado por `translate-svg` para archivos bajo `config.svg`, no por `translate-docs`).

<a id="astro-hybrid-sites-ui--page-html"></a>
### Sitios híbridos de Astro (interfaz de usuario + HTML de página)

Las aplicaciones Astro simples suelen habilitar **ambos** flujos de trabajo en una sola configuración (referencia: `examples/astro-website/`):

| Capa | Mecanismo | Salida |
|-------|-----------|--------|
| HTML de plantilla | `AstroTemplateExtractor` + `translate-docs` | `.astro` por configuración regional en `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | `public/locales/{locale}.json` plano (texto fuente en inglés como clave) |

El comando `sync` ejecuta los pasos habilitados en orden: **extraer** y luego **translate-ui** (cuando `features.translateUIStrings`) → opcional **translate-svg** → **translate-docs** → opcional **translate-json** (a menos que se omita con `--no-ui`, `--no-svg`, `--no-docs` o `--no-json`). La plantilla init `ui-astro-website` configura únicamente el Flujo de trabajo 1; agregue `docs[]` y `features.translateDocs` para el HTML de las páginas.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Inserción de anclas de encabezado (`write-heading-ids` CLI)

El comando `write-heading-ids` es un preprocesador **local y sin uso de LLM** para archivos markdown de documentación. Implementación: `src/cli/write-heading-ids.ts` coordina el descubrimiento de archivos; `src/markdown/write-heading-ids-core.ts` analiza las líneas e inserta anclajes.

Requiere una configuración válida con **al menos un bloque `docs[]`**. Para cada bloque, recopila archivos `.md` / `.mdx` bajo `contentPaths`, aplica las reglas `.translate-ignore` del proyecto (misma idea que la traducción de documentos) y opcionalmente restringe a un subárbol con `--path` / `--file`. Cada archivo se transforma con `applyHeadingAnchorsToMarkdown`: para cada **encabezado ATX plano** (`# …` hasta `###### …`) fuera de bloques de código delimitados, se inserta una línea HTML vacía `<a id="slug"></a>` en la línea superior si falta o está desactualizada. Los algoritmos de slug coinciden con los ecosistemas comunes — `github` (por defecto), `bitbucket`, `gitlab`, `pymdown` (banderas opcionales de normalización Unicode / codificación porcentual), `azure-devops` — para que los ID de anclaje sean consistentes con las herramientas existentes (doctoc, PyMdown, etc.). `--dry-run` muestra los cambios previstos sin escribirlos.

Este comando **no** se ejecuta dentro de `translate-docs` ni `sync`; ejecútelo explícitamente cuando desee IDs de fragmento estables en los archivos fuente antes de la traducción o publicación.

<a id="placeholder-protection"></a>
### Protección de marcadores de posición

Antes de la traducción, la sintaxis sensible se sustituye por tokens opacos para evitar corrupción por parte del LLM, aplicado en este orden (la restauración es el proceso inverso):

1. **Etiquetas HTML y comentarios** (`<strong>`, `<!-- ... -->`, etc.) - las etiquetas HTML en minúsculas de una lista permitida conocida se sustituyen por tokens `{{HTM_N}}`. Las etiquetas JSX en mayúsculas (`<Highlight>`, `<Tabs>`, `</Tab>`) se manejan por separado mediante la capa MDX (paso 4).
2. **Marcadores de advertencias** (`:::note`, `:::`) - solo el prefijo de directiva en la línea de apertura se sustituye por `{{ADM_OPEN_N}}`; cualquier título en la misma línea se deja para que el modelo lo traduzca. Se restaura con el texto original exacto.
3. **Anclajes de documentación** (HTML `<a id="…">`, encabezado Docusaurus `{#…}`) - se conservan textualmente.
4. **Constructos exclusivos de MDX** (`src/processors/mdx-placeholders.ts`):
   - **Comentarios MDX** (`{/* … */}`, incluyendo la forma heading-id de Docusaurus `{/* #my-id */}`) reemplazados por `{{MDX_N}}`.
   - **Etiquetas JSX con mayúscula inicial** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - conservadas como `{{MDX_N}}` con atributos de cadena traducibles (`label`, `tooltip`, `aria-label`) reescritos a `{{JXA_N}}` dentro de la etiqueta, a menos que el nombre del atributo aparezca en `docs[].protectAttributes`; `label:` dentro de literales de objeto `<Tabs values={[ { label: '…' } ]}>` (omitibles mediante `docs[].protectKeys`) y `<TabItem value="…">` (cuando no existe un atributo `label`, omitiendo valores en minúsculas tipo slug) también se extraen. Se añaden al segmento como líneas `||JXA_N: …||`, y se reintegran mediante `restoreMdx`.
   - **Expresiones entre llaves MDX** (`{frontMatter.title}`, `style={{…}}`) - coincidencia sensible a la profundidad, reemplazadas por `{{MDX_N}}`.
5. **URLs en Markdown** (`](url)`, `src="../../docs/…"`) - restauradas desde un mapa tras la traducción.
6. **Fragmentos de código en línea** (`` `code` ``) y **código en línea con negrita** (`**`code`**`) - se conservan.
7. **Énfasis en markdown** (opcional, habilitado automáticamente para configuraciones regionales CJK/RTL) - los delimitadores de énfasis se enmascaran.

La protección compartida de atributos/claves para plantillas Astro y JSX MDX se implementa en `src/processors/expression-attribute-protection.ts` y se controla por bloque mediante `docs[].protectAttributes` y `docs[].protectKeys` (véase [GETTING_STARTED — protectAttributes / protectKeys](GETTING_STARTED.es.md#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Caché (`TranslationCache`)

La base de datos SQLite (mediante `node:sqlite`) almacena filas indexadas por `(source_hash, locale)` con `translated_text`, `model`, `filepath`, `last_hit_at` y campos relacionados. El hash corresponde a los primeros 16 caracteres hexadecimales SHA-256 del contenido normalizado (espacios en blanco reducidos).

En cada ejecución, los segmentos se buscan por hash × configuración regional. Solo los fallos de caché van al LLM. Después de la traducción, `last_hit_at` se restablece para las filas de segmento en el ámbito de traducción actual que no fueron alcanzadas. Los aciertos de caché exitosos durante la traducción de documentos borran las filas `translation_failures` obsoletas para ese segmento. `cleanup` ejecuta `sync --force-update` primero, luego elimina las filas de segmento obsoletas (`last_hit_at` nulo / ruta de archivo vacía), poda las claves `file_tracking` cuando la ruta de origen resuelta falta en el disco (`doc-block:…`, `json-block:…`, `svg-files:…`, etc.), elimina las filas de traducción cuya ruta de archivo de metadatos apunta a un archivo que falta, poda las filas `translation_failures` huérfanas y poda las filas `markdown_source_issues` huérfanas cuya ruta de origen resuelta falta en el disco; no hace una copia de seguridad de `cache.db` a menos que se pase `--backup <path>`, lo que escribe una copia de seguridad en esa ruta primero.

El comando `translate-docs` también utiliza **seguimiento de archivos**, de modo que las fuentes sin cambios con salidas existentes puedan omitir completamente el trabajo. `--force-update` vuelve a ejecutar el procesamiento de archivos manteniendo el caché de segmentos; `--force` borra el seguimiento de archivos y omite las lecturas del caché de segmentos para la traducción mediante API. Cuando todos los modelos configurados fallan en la validación AST en un segmento de markdown, `translate-docs` puede dividir progresivamente el segmento y reintentar partes más pequeñas (`docs[].segmentSplitting.qualityRetrySplit`, activado por defecto). Consulte [Introducción](GETTING_STARTED.es.md#cache-behaviour-and-translate-docs-flags) para ver la tabla completa de indicadores.

**Formato de prompt por lotes:** `translate-docs --prompt-format` selecciona formas de matriz/objeto XML (`<seg>` / `<t>`) o JSON solo para `LlmClient.translateDocumentBatch`; la extracción, los marcadores de posición y la validación no cambian. Ver [Formato de prompt por lotes](GETTING_STARTED.es.md#batch-prompt-format).

<a id="output-path-resolution"></a>
### Resolución de ruta de salida

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapea una ruta relativa a la fuente a la ruta de salida:

- Estilo `nested` (predeterminado): `{outputDir}/{locale}/{relPath}` para markdown.
- Estilo `doc-system`: bajo `docsRoot`, las salidas usan `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`; las rutas fuera de `docsRoot` vuelven al diseño anidado. Alias: `docusaurus` (`localeSubpath` predeterminado = ruta del plugin de Docusaurus), `astro-starlight` (`localeSubpath` vacío predeterminado).
- Estilo `flat`: `{outputDir}/{stem}.{locale}{extension}`. Cuando `flatPreserveRelativeDir` es `true`, los subdirectorios de origen se mantienen bajo `outputDir`.
- **Personalizado** `pathTemplate`: cualquier diseño de markdown usando `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personalizado** `jsonPathTemplate`: diseño personalizado separado para archivos JSON de etiquetas, usando los mismos marcadores de posición.
- `linkRewriteDocsRoot` ayuda al reescritor de enlaces planos a calcular los prefijos correctos cuando la salida traducida se encuentra en una ubicación distinta a la raíz del proyecto por defecto.

<a id="flat-link-rewriting"></a>
### Reescritura plana de enlaces

Cuando `docsOutput.style === "flat"`, los archivos markdown traducidos se colocan junto al origen con sufijos de configuración regional. Los enlaces relativos entre páginas se reescriben para que `[Guide](../../docs/guide.md)` en `readme.de.md` apunte a `guide.de.md`. Controlado por `rewriteRelativeLinks` (activado automáticamente para el estilo plano sin un `pathTemplate` personalizado). El mismo proceso antepone un prefijo de profundidad por archivo a las URLs de recursos no markdown antes de que se ejecute `postProcessing.regexAdjustments` — véase la [Guía de recursos por configuración regional](LOCALE-ASSETS-GUIDE.es.md#the-flat-link-rewriter-and-two-step-flow).

---

<a id="workflow-3---nested-json-internals"></a>
## Flujo de trabajo 3 - Internos de JSON anidado

```text
json[].contentPaths  →  resolve files (file | directory | glob)
      │
      ▼  NestedJsonExtractor
string leaves selected by keyPolicy (dot paths + minimatch)
      │
      ▼  PlaceholderHandler + batch + TranslationCache (shared SQLite)
cache hit → skip, miss → LlmClient.translateDocumentBatch
      │
      ▼  NestedJsonExtractor.reassemble
output file  ─────────── expandJsonBlockOutputPath(outputPathTemplate)
```

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) recorre JSON anidado arbitrario y emite un segmento por cada hoja de cadena traducible. `keyPolicy.mode` (`allowlist`, `denylist` o `both`) filtra rutas con minimatch en notación de puntos (nombres simples como `slug` coinciden con el último segmento de clave).
- El seguimiento de archivos de caché utiliza `json-block:{blockIndex}:{projectRelPath}` en `file_tracking` (mismo `cacheDir` que documentos y SVG).
- **No** para catálogos `write-translations` de Docusaurus (forma `{ message, description }`) — estos usan el Flujo de trabajo 2 (`docs[].docusaurusCatalogDir` + `JsonExtractor` dentro de `translate-docs`).
- **No** para cadenas de interfaz de usuario `t()` — Flujo de trabajo 1 (`strings.json` + paquetes planos).
- CLI: `translate-json`; orquestación en `src/cli/translate-json-run.ts`. Plantilla de inicio: `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## Infraestructura compartida

<a id="openrouterclient"></a>
### `LlmClient`

Cliente de chat independiente del proveedor construido sobre el SDK de IA de Vercel (`ai` + `@ai-sdk/openai-compatible`). Resuelve el proveedor activo desde `provider` / `providers`, construye un cliente compatible con OpenAI (`createOpenAICompatible`) para `baseUrl` y la clave API de ese proveedor, y enruta todas las llamadas a través de `generateText`. `OpenRouterClient` se mantiene como un alias obsoleto. Comportamientos clave:

- **Retroceso de modelos**: prueba cada modelo en la lista resuelta en orden; retrocede ante fallos de solicitud o análisis. La traducción de la interfaz de usuario resuelve primero `ui.preferredModel` cuando está presente, luego `translationModels` del proveedor.
- **Tiempo de espera de solicitud**: los `requestTimeoutMs` del proveedor activo (30 segundos por defecto) abortan cada solicitud a través de `AbortSignal.timeout`. El mismo valor se aplica a `GET /models` cuando la CLI carga la lista de modelos de un proveedor para `check-models` (cualquier proveedor) y el filtro opcional previo que descarta los IDs de modelo desconocidos (solo OpenRouter).
- **Extras de OpenRouter** (solo cuando `openrouter` está activo): enrutamiento de rendimiento a través del campo de solicitud `provider`, encabezados `HTTP-Referer` / `X-Title`, y costo exacto en USD leído de `usage.cost`. El uso de tokens se informa para cada proveedor; el costo exacto solo cuando el proveedor lo devuelve.
- **Registro de tráfico de depuración**: si `debugTrafficFilePath` está configurado, agrega el JSON de solicitud y respuesta a un archivo.

<a id="config-loading"></a>
### Carga de configuración

Canalización `loadI18nConfigFromFile(configPath, cwd)`:

1. Leer y analizar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - combinar profundamente con `defaultI18nConfigPartial`, y fusionar cualquier entrada `docs[].sourceFiles` en `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - si `targetLocales` es una ruta de archivo, cargar el manifiesto y expandir a códigos de configuración regional; establecer `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - lo mismo para cada entrada `docs[].targetLocales`.
5. `parseI18nConfig` - validación con Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - adjuntar nombres para mostrar del manifiesto.

`init` escribe configuraciones iniciales desde `initConfigTemplates`: `ui-markdown` (interfaz de usuario + markdown opcional de la aplicación), `ui-docusaurus`, `ui-starlight`, `ui-astro-website` (interfaz de usuario Astro simple; agregue `docs[]` para la traducción de páginas `.astro`), `ui-json-bundles` (solo `json[]` del Flujo de trabajo 3). Consulte [GETTING_STARTED — Inicializar](GETTING_STARTED.es.md#step-1-initialise).

<a id="logger"></a>
### Registrador (Logger)

`Logger` admite niveles `debug`, `info`, `warn`, `error` con salida de colores ANSI. El modo detallado (`-v`) habilita `debug`. Cuando se establece `logFilePath`, las líneas de registro también se escriben en ese archivo.

---

<a id="runtime-helpers-api"></a>
## API de ayudantes en tiempo de ejecución

Estas se exportan desde `'ai-i18n-tools/runtime'` y funcionan en cualquier entorno JavaScript (navegador, Node.js, Deno, Edge). No **importan** desde `i18next` ni `react-i18next`.

<a id="rtl-helpers"></a>
### Ayudantes RTL

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### Fábricas de configuración de i18next

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

Use `setupKeyAsDefaultT` como punto de entrada habitual de la aplicación (eliminación de espacios en claves + plural `wrapT` + `translate-ui` opcional `{sourceLocale}.json`). Llamar solo a `wrapI18nWithKeyTrim` está **obsoleto** para la configuración de aplicaciones.

Construya `localeLoaders` con `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` para que las claves permanezcan alineadas con `targetLocales` tras `generate-ui-languages`. Ver `docs/GETTING_STARTED.md` (conexión en tiempo de ejecución), `examples/nextjs-app/`, `examples/console-app/` y `examples/astro-website/` (`makeT` personalizado sin i18next).

<a id="display-helpers"></a>
### Ayudantes de visualización

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### Ayudantes de cadenas

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## API programática

Todos los tipos y clases públicos se exportan desde la raíz del paquete. Ejemplo: ejecutar el paso de traducción de interfaz desde Node.js sin la CLI:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Exportaciones clave:

| Exportación | Descripción |
|---|---|
| `loadI18nConfigFromFile` | Carga, combina y valida la configuración desde un archivo JSON. |
| `parseI18nConfig` | Valida un objeto de configuración sin procesar. |
| `TranslationCache` | Caché SQLite: instanciar con una ruta `cacheDir`. |
| `UIStringExtractor` | Extraer cadenas `t("…")` del código fuente JS/TS. |
| `MarkdownExtractor` | Extraer segmentos traducibles del markdown. |
| `JsonExtractor` | Extraer de archivos JSON de etiquetas de Docusaurus (catálogos de interfaz de usuario, no del cuerpo MDX). |
| `SvgExtractor` | Extraer de archivos SVG. |
| `LlmClient` | Realiza solicitudes de traducción al proveedor LLM activo (`OpenRouterClient` es un alias obsoleto). |
| `PlaceholderHandler` | Protege/restaura la sintaxis de markdown alrededor de la traducción (etiquetas HTML, advertencias, anclajes, comentarios/JSX/llaves MDX, URLs, código en línea, énfasis). |
| `protectMdx` / `restoreMdx` | Protege/restaura comentarios MDX, etiquetas JSX, expresiones entre llaves y atributos de cadena JSX (llamado por `PlaceholderHandler`; también exportado para uso directo). |
| `splitTranslatableIntoBatches` | Agrupar segmentos en lotes del tamaño adecuado para los LLM. |
| `validateTranslation` | Comprobaciones estructurales tras la traducción. |
| `resolveDocumentationOutputPath` | Resolver la ruta del archivo de salida para un documento traducido. |
| `Glossary` / `GlossaryMatcher` | Cargar y aplicar glosarios de traducción. |
| `runTranslateUI` | Punto de entrada programático para la interfaz de traducción. |

---

<a id="extension-points"></a>
## Puntos de extensión

<a id="custom-function-names-ui-extraction"></a>
### Nombres personalizados de funciones (extracción de interfaz de usuario)

Agrega nombres no estándar de funciones de traducción mediante la configuración:

```json
{
  "ui": {
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro"]
    }
  }
}
```

(`ui.reactExtractor` es un alias completamente compatible para `ui.uiExtractor`.)

<a id="custom-extractors"></a>
### Extractores personalizados

Implementa `ContentExtractor` desde el paquete:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Pásalo a la canalización doc-translate importando las utilidades `doc-translate.ts` de forma programática.

<a id="custom-output-paths"></a>
### Rutas de salida personalizadas

Use `docsOutput.pathTemplate` para cualquier disposición de archivos:

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
