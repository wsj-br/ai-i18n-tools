<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: Descripción del paquete

Este documento describe la arquitectura interna de `ai-i18n-tools`, cómo se integra cada componente y cómo se implementan los dos flujos de trabajo principales.

Para instrucciones prácticas de uso, consulte [GETTING_STARTED.md](GETTING_STARTED.es.md).

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [हिन्दी](./PACKAGE_OVERVIEW.hi.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [中文 (中国大陆)](./PACKAGE_OVERVIEW.zh-CN.md) · [中文 (台灣)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

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
  - [Extractores](#extractors)
  - [Inserción de anclas de encabezado (CLI `write-heading-ids`)](#heading-anchor-insertion-write-heading-ids-cli)
  - [Protección de marcadores de posición](#placeholder-protection)
  - [Caché (`TranslationCache`)](#cache-translationcache)
  - [Resolución de rutas de salida](#output-path-resolution)
  - [Reescritura de enlaces planos](#flat-link-rewriting)
- [Infraestructura compartida](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Carga de configuración](#config-loading)
  - [Registrador (Logger)](#logger)
- [API de ayudantes en tiempo de ejecución](#runtime-helpers-api)
  - [Ayudantes RTL](#rtl-helpers)
  - [Fábricas de configuración de i18next](#i18next-setup-factories)
  - [Ayudantes de visualización](#display-helpers)
  - [Ayudantes de cadenas de texto](#string-helpers)
- [API programática](#programmatic-api)
- [Puntos de extensión](#extension-points)
  - [Nombres personalizados de funciones (extracción de interfaz)](#custom-function-names-ui-extraction)
  - [Extractores personalizados](#custom-extractors)
  - [Rutas de salida personalizadas](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## Visión general de la arquitectura

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, write-heading-ids, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
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
│   ├── locale-utils.ts             BCP-47 normalization and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner)
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── json-extractor.ts           JSON label file extraction
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
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
│   └── openrouter.ts               OpenRouter HTTP client with model fallback chain
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
├── server/
│   └── translation-editor.ts       Express app for cache / strings.json / glossary editor
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
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

<a id="uistringextractor"></a>
### `UIStringExtractor`

Utiliza `i18next-scanner` de `Parser.parseFuncFromString` para encontrar llamadas a `t("literal")` y `i18n.t("literal")` en cualquier archivo JS/TS. Los nombres de funciones y las extensiones de archivo son configurables. `extract` **también combina entradas no escaneadas en el mismo catálogo:** el `package.json` `description` del proyecto cuando `reactExtractor.includePackageDescription` está habilitado (valor predeterminado), y cada `englishName` de `ui-languages.json` cuando `reactExtractor.includeUiLanguageEnglishNames` es `true` y `uiLanguagesPath` está establecido (las cadenas ya encontradas en el código fuente tienen prioridad). Los hashes de segmento son los **primeros 8 caracteres hexadecimales del MD5** de la cadena fuente recortada — estos se convierten en las claves de `strings.json`.

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

`models` (opcional): por configuración regional, qué modelo produjo esa traducción tras la última ejecución exitosa de `translate-ui` para esa configuración regional (o `user-edited` si el texto se guardó desde la interfaz web de `editor`). `locations` (opcional): dónde encontró `extract` la cadena (analizador + línea de descripción del paquete; las cadenas solo del manifiesto `englishName` pueden omitir `locations`).

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

`OpenRouterClient.translateUIBatch` prueba cada modelo en orden, retrocediendo ante errores de análisis o de red. La CLI construye esa lista a partir de `openrouter.translationModels` (o predeterminado/heredado por defecto); para `translate-ui`, `ui.preferredModel` opcional se antepone cuando está configurado (eliminándose duplicados respecto al resto).

---

<a id="workflow-2---document-translation-internals"></a>
## Flujo de trabajo 2 - Internals de traducción de documentos

```text
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
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
cache hit → skip, miss → OpenRouterClient.translateDocumentBatch
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

- `MarkdownExtractor` - divide el markdown en segmentos tipificados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. El frontmatter YAML se clasifica como **no traducible** (`slug`, `id` y otras claves de enrutamiento permanecen estables). Los bloques `export ...` de nivel superior (por ejemplo, definiciones de componentes React) se clasifican como segmentos `other` no traducibles junto con el manejo existente de `import ...`. Los bloques multilínea que comienzan con una etiqueta JSX en mayúscula (por ejemplo, un bloque `<Tabs>`) se clasifican como párrafos traducibles. Los segmentos no traducibles (bloques de código, HTML plano) se conservan textualmente.
- `JsonExtractor` - extrae valores de cadena de archivos JSON de etiquetas de Docusaurus (catálogos de interfaz de usuario de Docusaurus, no del cuerpo MDX).
- `SvgExtractor` - extrae contenido `<text>`, `<title>` y `<desc>` de SVG (utilizado por `translate-svg` para archivos en `config.svg`, no por `translate-docs`).

<a id="heading-anchor-insertion-write-heading-ids"></a>
### Inserción de anclajes de encabezado (CLI `write-heading-ids`)

El comando `write-heading-ids` es un preprocesador **local y sin uso de LLM** para archivos markdown de documentación. Implementación: `src/cli/write-heading-ids.ts` coordina el descubrimiento de archivos; `src/markdown/write-heading-ids-core.ts` analiza las líneas e inserta anclajes.

Requiere una configuración válida con **al menos un bloque `documentations[]`**. Por cada bloque, recopila archivos `.md` / `.mdx` bajo `contentPaths`, aplica las reglas `.translate-ignore` del proyecto (misma idea que la traducción de documentación) y opcionalmente restringe a un subárbol con `--path` / `--file`. Cada archivo se transforma con `applyHeadingAnchorsToMarkdown`: para cada **encabezado ATX plano** (`# …` hasta `###### …`) fuera de bloques de código con delimitadores, se inserta una línea HTML vacía `<a id="slug"></a>` en la línea anterior si falta o está desactualizada. Los algoritmos de slug coinciden con los ecosistemas comunes — `github` (por defecto), `bitbucket`, `gitlab`, `pymdown` (banderas opcionales de normalización Unicode y codificación porcentual), `azure-devops` — para que los IDs de anclaje sean consistentes con herramientas existentes (doctoc, PyMdown, etc.). `--dry-run` muestra los cambios previstos sin escribirlos.

Este comando **no** se ejecuta dentro de `translate-docs` ni `sync`; ejecútelo explícitamente cuando desee IDs de fragmento estables en los archivos fuente antes de la traducción o publicación.

<a id="placeholder-protection"></a>
### Protección de marcadores de posición

Antes de la traducción, la sintaxis sensible se sustituye por tokens opacos para evitar corrupción por parte del LLM, aplicado en este orden (la restauración es el proceso inverso):

1. **Etiquetas HTML y comentarios** (`<strong>`, `<!-- ... -->`, etc.) - las etiquetas HTML en minúsculas de una lista permitida conocida se sustituyen por tokens `{{HTM_N}}`. Las etiquetas JSX en mayúsculas (`<Highlight>`, `<Tabs>`, `</Tab>`) se manejan por separado mediante la capa MDX (paso 4).
2. **Marcadores de advertencias** (`:::note`, `:::`) - solo el prefijo de directiva en la línea de apertura se sustituye por `{{ADM_OPEN_N}}`; cualquier título en la misma línea se deja para que el modelo lo traduzca. Se restaura con el texto original exacto.
3. **Anclajes de documentación** (HTML `<a id="…">`, encabezado Docusaurus `{#…}`) - se conservan textualmente.
4. **Constructos exclusivos de MDX** (`src/processors/mdx-placeholders.ts`):
   - **Comentarios MDX** (`{/* … */}`, incluyendo la forma de identificador de encabezado de Docusaurus `{/* #my-id */}`) sustituidos por `{{MDX_N}}`.
   - **Etiquetas JSX en mayúsculas** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - se conservan como `{{MDX_N}}` con atributos de cadena traducibles (`label`, `tooltip`, `aria-label`) reescritos como `{{JXA_N}}` dentro de la etiqueta; también se extraen `label:` dentro de literales de objetos `<Tabs values={[ { label: '…' } ]}>` y `<TabItem value="…">` (cuando no existe un atributo `label`, omitiendo valores en minúsculas tipo slug). Se añaden al segmento como líneas `||JXA_N: …||`, que luego se reintegran mediante `restoreMdx`.
   - **Expresiones entre llaves en MDX** (`{frontMatter.title}`, `style={{…}}`) - coincidencia sensible a la profundidad, sustituidas por `{{MDX_N}}`.
5. **URLs en markdown** (`](url)`, `src="../…"`) - se restauran desde un mapa tras la traducción.
6. **Fragmentos de código en línea** (`` `code` ``) y **código en línea con negrita** (`**`code`**`) - se conservan.
7. **Énfasis en markdown** (opcional, habilitado automáticamente para configuraciones regionales CJK/RTL) - los delimitadores de énfasis se enmascaran.

<a id="cache-translationcache"></a>
### Caché (`TranslationCache`)

Base de datos SQLite (mediante `node:sqlite`) que almacena filas indexadas por `(source_hash, locale)` con `translated_text`, `model`, `filepath`, `last_hit_at` y campos relacionados. El hash es el primer carácter hexadecimal de 16 caracteres SHA-256 del contenido normalizado (espacios en blanco colapsados).

En cada ejecución, los segmentos se buscan por hash × configuración regional. Solo las ausencias de caché pasan al LLM. Después de la traducción, se restablece `last_hit_at` para las filas de segmento en el ámbito actual de traducción que no fueron alcanzadas. `cleanup` ejecuta primero `sync --force-update`, luego elimina las filas de segmento obsoletas (`last_hit_at` nulo / ruta de archivo vacía), poda las claves `file_tracking` cuando la ruta de origen resuelta no existe en el disco (`doc-block:…`, `svg-files:…`, etc.) y elimina las filas de traducción cuya ruta de archivo en los metadatos apunta a un archivo inexistente; primero realiza una copia de seguridad de `cache.db` a menos que se pase `--no-backup`.

El comando `translate-docs` también utiliza **seguimiento de archivos**, de modo que las fuentes sin cambios con salidas existentes pueden omitir completamente el trabajo. `--force-update` vuelve a ejecutar el procesamiento de archivos manteniendo la caché de segmentos; `--force` borra el seguimiento de archivos y omite lecturas de caché de segmentos para la traducción de API. Consulte [Introducción](GETTING_STARTED.es.md#cache-behaviour-and-translate-docs-flags) para obtener la tabla completa de banderas.

**Formato de solicitud por lotes:** `translate-docs --prompt-format` selecciona XML (`<seg>` / `<t>`) o formas de array/objeto JSON solo para `OpenRouterClient.translateDocumentBatch`; la extracción, marcadores y validación no cambian. Consulte [Formato de solicitud por lotes](GETTING_STARTED.es.md#batch-prompt-format).

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

Cuando `markdownOutput.style === "flat"`, los archivos markdown traducidos se colocan junto a la fuente con sufijos de configuración regional. Los enlaces relativos entre páginas se reescriben para que `[Guide](../guide.md)` en `readme.de.md` apunte a `guide.de.md`. Controlado por `rewriteRelativeLinks` (activado automáticamente para estilo plano sin `pathTemplate` personalizado).

---

<a id="shared-infrastructure"></a>
## Infraestructura compartida

<a id="openrouterclient"></a>
### `OpenRouterClient`

Envuelve la API de completado de chat de OpenRouter. Comportamientos clave:

- **Alternativa de modelo**: intenta cada modelo en la lista resuelta por orden; recurre a errores HTTP o fallos de análisis. La traducción de la interfaz primero resuelve `ui.preferredModel` cuando está presente, luego los modelos `openrouter`.
- **Tiempo de espera de solicitud**: `openrouter.requestTimeoutMs` (por defecto 30 segundos) aborta cada solicitud de finalización de chat mediante `AbortSignal.timeout`. El mismo valor se aplica a `GET /models` cuando la CLI carga el catálogo (por ejemplo `check-models` y el filtro previo opcional que descarta identificadores de modelo desconocidos).
- **Limitación de tasa**: detecta respuestas 429, espera `retry-after` (o 2 segundos), reintenta una vez.
- **Registro de depuración del tráfico**: si se establece `debugTrafficFilePath`, añade al final del archivo el JSON de solicitud y respuesta.

<a id="config-loading"></a>
### Carga de configuración

Canalización `loadI18nConfigFromFile(configPath, cwd)`:

1. Leer y analizar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - combinación profunda con `defaultI18nConfigPartial`, y combinar cualquier entrada `documentations[].sourceFiles` en `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - si `targetLocales` es una ruta de archivo, cargar el manifiesto y expandir a códigos de configuración regional; establecer `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - lo mismo para cada entrada `documentations[].targetLocales`.
5. `parseI18nConfig` - validación con Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - adjuntar nombres para mostrar del manifiesto.

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

Construya `localeLoaders` con `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` para que las claves permanezcan alineadas con `targetLocales` tras `generate-ui-languages`. Consulte `docs/GETTING_STARTED.md` (configuración en tiempo de ejecución) y `examples/nextjs-app/` / `examples/console-app/`.

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
| `OpenRouterClient` | Realizar solicitudes de traducción a OpenRouter. |
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
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

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

Usa `markdownOutput.pathTemplate` para cualquier estructura de archivos:

```json
{
  "documentations": [
    {
      "markdownOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
