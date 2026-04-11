---
translation_last_updated: '2026-04-11T03:31:28.429Z'
source_file_mtime: '2026-04-11T03:30:13.297Z'
source_file_hash: cc126df0f102c515c7e7b274fcf133efca9733834d7836fbb6433cb58703842f
translation_language: es
source_file_path: docs-site/docs/package-overview.md
---
# ai-i18n-tools: Descripción general del paquete

Este documento describe la arquitectura interna de `ai-i18n-tools`, cómo se integra cada componente y cómo se implementan los dos flujos de trabajo principales.

Para instrucciones prácticas de uso, consulte [Introducción](./getting-started.md).

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabla de contenidos**

- [Descripción general de la arquitectura](#architecture-overview)
- [Árbol de código fuente](#source-tree)
- [Flujo de trabajo 1 - Internals de traducción de interfaz](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Archivos de localización planos](#flat-locale-files)
  - [Indicaciones para traducción de interfaz](#ui-translation-prompts)
- [Flujo de trabajo 2 - Internals de traducción de documentos](#workflow-2---document-translation-internals)
  - [Extractores](#extractors)
  - [Protección de marcadores de posición](#placeholder-protection)
  - [Caché (`TranslationCache`)](#cache-translationcache)
  - [Resolución de rutas de salida](#output-path-resolution)
  - [Reescritura plana de enlaces](#flat-link-rewriting)
- [Infraestructura compartida](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Carga de configuración](#config-loading)
  - [Registrador (Logger)](#logger)
- [API de ayuda en tiempo de ejecución](#runtime-helpers-api)
  - [Ayudantes RTL](#rtl-helpers)
  - [Fábricas de configuración de i18next](#i18next-setup-factories)
  - [Ayudantes de visualización](#display-helpers)
  - [Ayudantes de cadenas](#string-helpers)
- [API programática](#programmatic-api)
- [Puntos de extensión](#extension-points)
  - [Nombres de funciones personalizados (extracción de interfaz)](#custom-function-names-ui-extraction)
  - [Extractores personalizados](#custom-extractors)
  - [Rutas de salida personalizadas](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## Descripción general de la arquitectura {#architecture-overview}

```
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

Todo lo que los consumidores puedan necesitar programáticamente se reexporta desde `src/index.ts`.

---

## Árbol de código fuente {#source-tree}

```
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
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
│   ├── placeholder-handler.ts      Chain: admonitions → anchors → URLs
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
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

## Flujo de trabajo 1 - Internals de traducción de interfaz {#workflow-1---ui-translation-internals}

```
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated: { de: "…" } } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation
```

### `UIStringExtractor` {#uistringextractor}

Utiliza `Parser.parseFuncFromString` de `i18next-scanner` para encontrar llamadas `t("literal")` y `i18n.t("literal")` en cualquier archivo JS/TS. Nombres de funciones y extensiones de archivo configurables. Los hashes de segmento son los **primeros 8 caracteres hexadecimales del MD5** de la cadena fuente recortada; estos se convierten en las claves de `strings.json`.

### `strings.json` {#stringsjson}

El catálogo maestro tiene la siguiente estructura:

```json
{
  "<md5-8>": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    }
  }
}
```

`extract` añade nuevas claves y conserva las traducciones existentes. `translate-ui` completa las entradas `translated` faltantes y escribe archivos de localización planos.

### Archivos de localización planos {#flat-locale-files}

Cada idioma de destino recibe un archivo JSON plano (`de.json`) que asocia la cadena fuente con su traducción:

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next carga estos archivos como paquetes de recursos y busca las traducciones mediante la cadena fuente (modelo clave-como-valor-por-defecto).

### Indicaciones para traducción de interfaz {#ui-translation-prompts}

`buildUIPromptMessages` construye mensajes del sistema y del usuario que:
- Identifican los idiomas de origen y destino (por nombre de visualización desde `localeDisplayNames` o `ui-languages.json`).
- Envían un array JSON de cadenas y solicitan un array JSON de traducciones a cambio.
- Incluyen sugerencias del glosario cuando están disponibles.

`OpenRouterClient.translateUIBatch` intenta cada modelo en `translationModels` en orden, utilizando un modelo alternativo ante errores de análisis o de red.

---

## Flujo de trabajo 2 - Internals de traducción de documentos {#workflow-2---document-translation-internals}

```
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── URLs, admonitions, anchors replaced with tokens
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

### Extractores {#extractors}

Todos los extractores heredan de `BaseExtractor` e implementan `extract(content, filepath): Segment[]`.

- **`MarkdownExtractor`** - divide el markdown en segmentos tipados: `frontmatter`, `heading`, `párrafo`, `código`, `admonición`. Los segmentos no traducibles (bloques de código, HTML crudo) se conservan textualmente.
- **`JsonExtractor`** - extrae valores de cadena de archivos JSON de etiquetas de Docusaurus.
- **`SvgExtractor`** - extrae el contenido de los elementos `<text>` y `<title>` del SVG (usado por `translate-svg` para recursos bajo `config.svg`, no por `translate-docs`).

### Protección de marcadores de posición {#placeholder-protection}

Antes de la traducción, la sintaxis sensible se reemplaza por tokens opacos para evitar corrupción por parte del LLM:

1. **Marcadores de admonición** (`:::note`, `:::`) - se restauran con el texto original exacto.
2. **Anclas de documento** (HTML `<a id="…">`, encabezado Docusaurus `{#…}`) - se conservan textualmente.
3. **URLs en Markdown** (`](url)`, `src="…"`) - se restauran desde un mapa tras la traducción.

### Caché (`TranslationCache`) {#cache-translationcache}

Base de datos SQLite (mediante `node:sqlite`) que almacena filas indexadas por `(source_hash, locale)` con `translated_text`, `model`, `filepath`, `last_hit_at` y campos relacionados. El hash es el primer carácter hexadecimal de 16 caracteres SHA-256 del contenido normalizado (espacios en blanco colapsados).

En cada ejecución, los segmentos se buscan por hash × locale. Solo los fallos de caché van al LLM. Tras la traducción, `last_hit_at` se restablece para los segmentos que no se tocaron; `cleanup` elimina filas obsoletas (con `last_hit_at` nulo o `filepath` vacío) y filas huérfanas cuyo archivo fuente ya no existe; primero hace una copia de seguridad de `cache.db` a menos que se pase `--no-backup`.

El comando `translate-docs` también utiliza **seguimiento de archivos**, de modo que las fuentes sin cambios con salidas existentes pueden omitir completamente el trabajo. `--force-update` vuelve a ejecutar el procesamiento de archivos manteniendo el uso de la caché de segmentos; `--force` borra el seguimiento de archivos y omite las lecturas de la caché de segmentos para la traducción de la API. Consulte [Inicio rápido](./getting-started.md#cache-behaviour-and-translate-docs-flags) para obtener la tabla completa de banderas.

### Resolución de ruta de salida {#output-path-resolution}

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapea una ruta relativa a la fuente a la ruta de salida:

- Estilo **`nested`** (por defecto): `{outputDir}/{locale}/{relPath}` para markdown.
- Estilo **`docusaurus`**: bajo `docsRoot`, las salidas usan `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; las rutas fuera de `docsRoot` vuelven al diseño anidado.
- Estilo **`flat`**: `{outputDir}/{stem}.{locale}{extension}` (con `flatPreserveRelativeDir` opcional).
- **Personalizado** `pathTemplate`: cualquier diseño usando `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

### Reescritura de enlaces planos {#flat-link-rewriting}

Cuando `markdownOutput.style === "flat"`, los archivos markdown traducidos se colocan junto al origen con sufijos de idioma. Los enlaces relativos entre páginas se reescriben para que `[Guía](./guide.md)` en `readme.de.md` apunte a `guide.de.md`. Controlado por `rewriteRelativeLinks` (activado automáticamente para estilo plano sin `pathTemplate` personalizado).

---

## Infraestructura compartida {#shared-infrastructure}

### `OpenRouterClient` {#openrouterclient}

Envoltorio de la API de completado de chat de OpenRouter. Comportamientos clave:

- **Modelo de reserva**: intenta cada modelo en `translationModels` en orden; recurre ante errores HTTP o fallos de análisis.
- **Limitación de tasa**: detecta respuestas 429, espera `retry-after` (o 2 segundos), reintenta una vez.
- **Caché de indicaciones**: el mensaje del sistema se envía con `cache_control: { type: "ephemeral" }` para habilitar la caché de indicaciones en modelos compatibles.
- **Registro de tráfico de depuración**: si se establece `debugTrafficFilePath`, anexa el JSON de solicitud y respuesta a un archivo.

### Carga de configuración {#config-loading}

`loadI18nConfigFromFile(configPath, cwd)` pipeline:

1. Leer y analizar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults`: combinar profundamente con `defaultI18nConfigPartial`.
3. `expandTargetLocalesFileReferenceInRawInput`: si `targetLocales` es una ruta de archivo, cargar el manifiesto y expandir a códigos de configuración regional; establecer `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput`: lo mismo para `documentation.targetLocales`.
5. `parseI18nConfig`: validación con Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides`: aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile`: adjuntar nombres para mostrar del manifiesto.

### Logger {#logger}

`Logger` admite niveles `debug`, `info`, `warn`, `error` con salida de colores ANSI. El modo detallado (`-v`) activa `debug`. Cuando se establece `logFilePath`, las líneas de registro también se escriben en ese archivo.

---

## API de ayudantes de tiempo de ejecución {#runtime-helpers-api}

Estos se exportan desde `'ai-i18n-tools/runtime'` y funcionan en cualquier entorno JavaScript (navegador, Node.js, Deno, Edge). **No** importan desde `i18next` ni `react-i18next`.

### Ayudantes RTL {#rtl-helpers}

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### Fábricas de configuración de i18next {#i18next-setup-factories}

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### Ayudantes de visualización {#display-helpers}

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### Ayudantes de cadenas {#string-helpers}

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## API programática {#programmatic-api}

Todos los tipos y clases públicos se exportan desde la raíz del paquete. Ejemplo: ejecutar el paso de traducción de interfaz de usuario desde Node.js sin la CLI:

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
| `loadI18nConfigFromFile` | Cargar, combinar y validar la configuración desde un archivo JSON. |
| `parseI18nConfig` | Validar un objeto de configuración sin procesar. |
| `TranslationCache` | Caché SQLite: instanciar con una ruta `cacheDir`. |
| `UIStringExtractor` | Extraer cadenas `t("…")` del código fuente JS/TS. |
| `MarkdownExtractor` | Extraer segmentos traducibles del markdown. |
| `JsonExtractor` | Extraer de archivos JSON de etiquetas de Docusaurus. |
| `SvgExtractor` | Extraer de archivos SVG. |
| `OpenRouterClient` | Realizar solicitudes de traducción a OpenRouter. |
| `PlaceholderHandler` | Proteger/restaurar la sintaxis de markdown alrededor de la traducción. |
| `splitTranslatableIntoBatches` | Agrupar segmentos en lotes del tamaño adecuado para el LLM. |
| `validateTranslation` | Comprobaciones estructurales tras la traducción. |
| `resolveDocumentationOutputPath` | Resolver la ruta del archivo de salida para un documento traducido. |
| `Glossary` / `GlossaryMatcher` | Cargar y aplicar glosarios de traducción. |
| `runTranslateUI` | Punto de entrada programático para translate-UI. |

---

## Puntos de extensión {#extension-points}

### Nombres de funciones personalizadas (extracción de interfaz de usuario) {#custom-function-names-ui-extraction}

Añadir nombres de funciones de traducción no estándar mediante la configuración:

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### Extractores personalizados {#custom-extractors}

Implementar `ContentExtractor` desde el paquete:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Páselo al pipeline de doc-translate importando programáticamente las utilidades de `doc-translate.ts`.

### Rutas de salida personalizadas {#custom-output-paths}

Use `markdownOutput.pathTemplate` para cualquier disposición de archivos:

```json
{
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```
