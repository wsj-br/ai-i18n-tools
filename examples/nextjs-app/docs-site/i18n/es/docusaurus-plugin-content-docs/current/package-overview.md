---
translation_last_updated: '2026-04-13T00:28:35.820Z'
source_file_mtime: '2026-04-13T00:28:15.569Z'
source_file_hash: 8cb494fb19654fd14572478692aec0c22bd75c6a5c37c0ab229cfc0a1145cd16
translation_language: es
source_file_path: docs-site/docs/package-overview.md
---
# ai-i18n-tools: Descripción del paquete

Este documento describe la arquitectura interna de `ai-i18n-tools`, cómo se ensamblan cada uno de los componentes y cómo se implementan los dos flujos de trabajo principales.

Para instrucciones de uso práctico, consulte [Introducción](./getting-started.md).

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[en-GB](./PACKAGE_OVERVIEW.md) · [de](../translated-docs/docs/PACKAGE_OVERVIEW.de.md) · [es](../translated-docs/docs/PACKAGE_OVERVIEW.es.md) · [fr](../translated-docs/docs/PACKAGE_OVERVIEW.fr.md) · [hi](../translated-docs/docs/PACKAGE_OVERVIEW.hi.md) · [ja](../translated-docs/docs/PACKAGE_OVERVIEW.ja.md) · [ko](../translated-docs/docs/PACKAGE_OVERVIEW.ko.md) · [pt-BR](../translated-docs/docs/PACKAGE_OVERVIEW.pt-BR.md) · [zh-CN](../translated-docs/docs/PACKAGE_OVERVIEW.zh-CN.md) · [zh-TW](../translated-docs/docs/PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- INICIO doctoc generado TOC por favor mantenga el comentario aquí para permitir la actualización automática -->
<!-- NO EDITAR ESTA SECCIÓN, EN SU LUGAR VUELVA A EJECUTAR doctoc PARA ACTUALIZAR -->
**Tabla de Contenidos**

- [Descripción de la arquitectura](#architecture-overview)
- [Árbol de código fuente](#source-tree)
- [Flujo de trabajo 1 - Internos de la traducción de UI](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Archivos de locales planos](#flat-locale-files)
  - [Prompts de traducción de UI](#ui-translation-prompts)
- [Flujo de trabajo 2 - Internos de la traducción de documentos](#workflow-2---document-translation-internals)
  - [Extractores](#extractors)
  - [Protección de marcadores de posición](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Resolución de rutas de salida](#output-path-resolution)
  - [Reescritura de enlaces planos](#flat-link-rewriting)
- [Infraestructura compartida](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Carga de configuración](#config-loading)
  - [Registrador](#logger)
- [API de ayudantes en tiempo de ejecución](#runtime-helpers-api)
  - [Ayudantes de RTL](#rtl-helpers)
  - [Fábricas de configuración de i18next](#i18next-setup-factories)
  - [Ayudantes de visualización](#display-helpers)
  - [Ayudantes de cadenas](#string-helpers)
- [API programática](#programmatic-api)
- [Puntos de extensión](#extension-points)
  - [Nombres de funciones personalizadas (extracción de UI)](#custom-function-names-ui-extraction)
  - [Extractores personalizados](#custom-extractors)
  - [Rutas de salida personalizadas](#custom-output-paths)

<!-- FIN doctoc generado TOC por favor mantenga el comentario aquí para permitir la actualización automática -->

---

## Descripción de la arquitectura {#architecture-overview}

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

Todo lo que los consumidores puedan necesitar programáticamente se vuelve a exportar desde `src/index.ts`.

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

## Flujo de trabajo 1 - Internos de la traducción de UI {#workflow-1---ui-translation-internals}

```
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

### `UIStringExtractor` {#uistringextractor}

Utiliza `Parser.parseFuncFromString` de `i18next-scanner` para encontrar llamadas a `t("literal")` e `i18n.t("literal")` en cualquier archivo JS/TS. Los nombres de funciones y las extensiones de archivo son configurables, y la extracción también puede incluir la `description` del `package.json` del proyecto cuando `reactExtractor.includePackageDescription` está habilitado. Los hashes de segmento son **los primeros 8 caracteres hexadecimales de MD5** de la cadena de origen recortada; estos se convierten en las claves en `strings.json`.

### `strings.json` {#stringsjson}

El catálogo maestro tiene la forma:

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

`models` (opcional) — por localidad, qué modelo produjo esa traducción después de la última ejecución exitosa de `translate-ui` para esa localidad (o `user-edited` si el texto fue guardado desde la interfaz web del `editor`). `locations` (opcional) — dónde `extract` encontró la cadena.

`extract` añade nuevas claves y preserva los datos existentes de `translated` / `models` para claves que aún están presentes en el escaneo. `translate-ui` completa las entradas de `translated` que faltan, actualiza `models` para las localidades que traduce y escribe archivos de localidad planos.

### Archivos de locales planos {#flat-locale-files}

Cada localidad objetivo recibe un archivo JSON plano (`de.json`) que mapea cadena fuente → traducción (sin campo `models`):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next carga estos como paquetes de recursos y busca traducciones por la cadena de origen (modelo clave-como-predeterminado).

### Prompts de traducción de UI {#ui-translation-prompts}

`buildUIPromptMessages` construye mensajes del sistema + del usuario que:
- Identifican los idiomas de origen y destino (por nombre de visualización de `localeDisplayNames` o `ui-languages.json`).
- Envía un array JSON de cadenas y solicita un array JSON de traducciones a cambio.
- Incluye pistas de glosario cuando están disponibles.

`OpenRouterClient.translateUIBatch` prueba cada modelo en orden, retrocediendo ante errores de análisis o de red. La CLI construye esa lista a partir de `openrouter.translationModels` (o legado por defecto/retroceso); para `translate-ui`, el opcional `ui.preferredModel` se antepone cuando está configurado (deduplicado respecto al resto).

---

## Flujo de trabajo 2 - Internos de traducción de documentos {#workflow-2---document-translation-internals}

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

Todos los extractores extienden `BaseExtractor` e implementan `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - divide markdown en segmentos tipados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Los segmentos no traducibles (bloques de código, HTML en bruto) se preservan textualmente.
- `JsonExtractor` - extrae valores de cadena de los archivos de etiquetas JSON de Docusaurus.
- `SvgExtractor` - extrae contenido de `<text>`, `<title>` y `<desc>` de SVG (utilizado por `translate-svg` para activos bajo `config.svg`, no por `translate-docs`).

### Protección de marcadores {#placeholder-protection}

Antes de la traducción, la sintaxis sensible se reemplaza con tokens opacos para prevenir la corrupción de LLM:

1. **Marcadores de admonición** (`:::note`, `:::`) - restaurados con el texto original exacto.
2. **Anclas de documento** (HTML `<a id="…">`, encabezado de Docusaurus `{#…}`) - preservados textualmente.
3. **URLs de Markdown** (`](url)`, `src="…"`) - restaurados de un mapa después de la traducción.

### Caché (`TranslationCache`) {#cache-translationcache}

La base de datos SQLite (a través de `node:sqlite`) almacena filas indexadas por `(source_hash, locale)` con `translated_text`, `model`, `filepath`, `last_hit_at` y campos relacionados. El hash es SHA-256 de los primeros 16 caracteres hexadecimales del contenido normalizado (espacios en blanco colapsados).

En cada ejecución, los segmentos se buscan por hash × locale. Solo los fallos de caché van al LLM. Después de la traducción, `last_hit_at` se restablece para las filas de segmentos en el ámbito de traducción actual que no fueron alcanzadas. `cleanup` ejecuta `sync --force-update` primero, luego elimina filas de segmentos obsoletas (null `last_hit_at` / filepath vacío), poda claves de `file_tracking` cuando la ruta de origen resuelta falta en el disco (`doc-block:…`, `svg-assets:…`, etc.), y elimina filas de traducción cuya metadata filepath apunta a un archivo faltante; primero hace una copia de seguridad de `cache.db` a menos que se pase `--no-backup`.

El comando `translate-docs` también utiliza **seguimiento de archivos** para que las fuentes sin cambios con salidas existentes puedan omitir completamente el trabajo. `--force-update` vuelve a ejecutar el procesamiento de archivos mientras sigue utilizando la caché de segmentos; `--force` borra el seguimiento de archivos y omite las lecturas de caché de segmentos para la traducción de API. Consulte [Introducción](./getting-started.md#cache-behaviour-and-translate-docs-flags) para la tabla completa de flags.

**Formato de aviso por lotes:** `translate-docs --prompt-format` selecciona formas XML (`<seg>` / `<t>`) o de matriz/objeto JSON para `OpenRouterClient.translateDocumentBatch` únicamente; la extracción, los marcadores de posición y la validación permanecen sin cambios. Ver [Formato de aviso por lotes](./getting-started.md#batch-prompt-format).

### Resolución de ruta de salida {#output-path-resolution}

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapea una ruta relativa a la fuente a la ruta de salida:

- estilo `nested` (predeterminado): `{outputDir}/{locale}/{relPath}` para markdown.
- estilo `docusaurus`: bajo `docsRoot`, las salidas utilizan `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; las rutas fuera de `docsRoot` retroceden al diseño anidado.
- estilo `flat`: `{outputDir}/{stem}.{locale}{extension}`. Cuando `flatPreserveRelativeDir` es `true`, se mantienen los subdirectorios de origen bajo `outputDir`.
- **Personalizado** `pathTemplate`: cualquier diseño de markdown que use `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Personalizado** `jsonPathTemplate`: diseño personalizado separado para archivos de etiquetas JSON, utilizando los mismos marcadores de posición.
- `linkRewriteDocsRoot` ayuda al reescritor de enlaces planos a calcular prefijos correctos cuando la salida traducida está enraizada en algún lugar diferente al directorio raíz del proyecto por defecto.

### Reescritura de enlaces planos {#flat-link-rewriting}

Cuando `markdownOutput.style === "flat"`, los archivos markdown traducidos se colocan junto a la fuente con sufijos de locale. Los enlaces relativos entre páginas se reescriben para que `[Guía](./guide.md)` en `readme.de.md` apunte a `guide.de.md`. Controlado por `rewriteRelativeLinks` (activado automáticamente para el estilo plano sin una `pathTemplate` personalizada).

---

## Infraestructura compartida {#shared-infrastructure}

### `OpenRouterClient` {#openrouterclient}

Envuelve la API de completions de chat de OpenRouter. Comportamientos clave:

- **Fallback del modelo**: intenta cada modelo en la lista resuelta en orden; recurre a errores HTTP o fallos de análisis. La traducción de la interfaz de usuario resuelve `ui.preferredModel` primero cuando está presente, luego los modelos de `openrouter`.
- **Limitación de tasa**: detecta respuestas 429, espera `retry-after` (o 2s), vuelve a intentar una vez.
- **Caché de mensajes**: el mensaje del sistema se envía con `cache_control: { type: "ephemeral" }` para habilitar la caché de mensajes en modelos compatibles.
- **Registro de tráfico de depuración**: si `debugTrafficFilePath` está configurado, se añaden las solicitudes y respuestas JSON a un archivo.

### Carga de configuración {#config-loading}

`loadI18nConfigFromFile(configPath, cwd)` pipeline:

1. Leer y analizar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - fusión profunda con `defaultI18nConfigPartial`, y fusionar cualquier entrada de `documentations[].sourceFiles` en `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - si `targetLocales` es una ruta de archivo, cargar el manifiesto y expandir a códigos de locales; establecer `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - lo mismo para cada entrada de `documentations[].targetLocales`.
5. `parseI18nConfig` - validación de Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - adjuntar nombres de visualización del manifiesto.

### Registrador {#logger}

`Logger` soporta niveles `debug`, `info`, `warn`, `error` con salida de color ANSI. El modo detallado (`-v`) habilita `debug`. Cuando `logFilePath` está configurado, las líneas de registro también se escriben en ese archivo.

---

## API de ayudantes en tiempo de ejecución {#runtime-helpers-api}

Estos se exportan desde `'ai-i18n-tools/runtime'` y funcionan en cualquier entorno de JavaScript (navegador, Node.js, Deno, Edge). **No** importan de `i18next` o `react-i18next`.

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

Todos los tipos y clases públicas se exportan desde la raíz del paquete. Ejemplo: ejecutar el paso de traducción-UI desde Node.js sin la CLI:

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

| Exportar | Descripción |
|---|---|
| `loadI18nConfigFromFile` | Cargar, fusionar, validar configuración desde un archivo JSON. |
| `parseI18nConfig` | Validar un objeto de configuración en bruto. |
| `TranslationCache` | Caché SQLite - instanciar con una ruta `cacheDir`. |
| `UIStringExtractor` | Extraer cadenas `t("…")` de código fuente JS/TS. |
| `MarkdownExtractor` | Extraer segmentos traducibles de markdown. |
| `JsonExtractor` | Extraer de archivos de etiquetas JSON de Docusaurus. |
| `SvgExtractor` | Extraer de archivos SVG. |
| `OpenRouterClient` | Realizar solicitudes de traducción a OpenRouter. |
| `PlaceholderHandler` | Proteger/restaurar la sintaxis de markdown alrededor de la traducción. |
| `splitTranslatableIntoBatches` | Agrupar segmentos en lotes del tamaño de LLM. |
| `validateTranslation` | Comprobaciones estructurales después de la traducción. |
| `resolveDocumentationOutputPath` | Resolver la ruta del archivo de salida para un documento traducido. |
| `Glossary` / `GlossaryMatcher` | Cargar y aplicar glosarios de traducción. |
| `runTranslateUI` | Punto de entrada programático para traducir-UI. |

---

## Puntos de extensión {#extension-points}

### Nombres de funciones personalizadas (extracción de UI) {#custom-function-names-ui-extraction}

Agregar nombres de funciones de traducción no estándar a través de la configuración:

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

Pásalo al pipeline de traducción de documentos importando utilidades de `doc-translate.ts` programáticamente.

### Rutas de salida personalizadas {#custom-output-paths}

Utiliza `markdownOutput.pathTemplate` para cualquier diseño de archivo:

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
