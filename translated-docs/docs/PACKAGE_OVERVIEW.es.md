# ai-i18n-tools: Descripción del Paquete

Este documento describe la arquitectura interna de `ai-i18n-tools`, cómo se ensamblan los diferentes componentes y cómo se implementan los dos flujos de trabajo principales.

Para instrucciones de uso práctico, consulte [GETTING_STARTED.md](GETTING_STARTED.es.md).

<small>**Leer en otros idiomas:** </small>

<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [German](./PACKAGE_OVERVIEW.de.md) · [Spanish](./PACKAGE_OVERVIEW.es.md) · [French](./PACKAGE_OVERVIEW.fr.md) · [Hindi](./PACKAGE_OVERVIEW.hi.md) · [Japanese](./PACKAGE_OVERVIEW.ja.md) · [Korean](./PACKAGE_OVERVIEW.ko.md) · [Portuguese (BR)](./PACKAGE_OVERVIEW.pt-BR.md) · [Chinese (CN)](./PACKAGE_OVERVIEW.zh-CN.md) · [Chinese (TW)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- INICIO doctoc generado TOC por favor mantenga el comentario aquí para permitir la actualización automática -->
<!-- NO EDITAR ESTA SECCIÓN, EN SU LUGAR REEJECUTAR doctoc PARA ACTUALIZAR -->
**Tabla de Contenidos**

- [Descripción de la arquitectura](#architecture-overview)
- [Árbol de código fuente](#source-tree)
- [Flujo de trabajo 1 - Internos de la traducción de UI](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Archivos de localización plana](#flat-locale-files)
  - [Prompts de traducción de UI](#ui-translation-prompts)
- [Flujo de trabajo 2 - Internos de la traducción de documentos](#workflow-2---document-translation-internals)
  - [Extractores](#extractors)
  - [Protección de marcadores de posición](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Resolución de la ruta de salida](#output-path-resolution)
  - [Reescritura de enlaces planos](#flat-link-rewriting)
- [Infraestructura compartida](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Carga de configuración](#config-loading)
  - [Registrador](#logger)
- [API de ayudantes en tiempo de ejecución](#runtime-helpers-api)
  - [Ayudantes RTL](#rtl-helpers)
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

## Descripción de la arquitectura

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

Todo lo que los consumidores pueden necesitar programáticamente se vuelve a exportar desde `src/index.ts`.

---

## Árbol de código fuente

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

## Flujo de trabajo 1 - Internos de la traducción de UI

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

### `UIStringExtractor`

Utiliza `i18next-scanner` de `Parser.parseFuncFromString` para encontrar llamadas a `t("literal")` y `i18n.t("literal")` en cualquier archivo JS/TS. Los nombres de funciones y las extensiones de archivo son configurables. `extract` **también combina entradas no escaneadas en el mismo catálogo:** el `package.json` `description` del proyecto cuando `reactExtractor.includePackageDescription` está habilitado (predeterminado), y cada **`englishName`** de `ui-languages.json` cuando `reactExtractor.includeUiLanguageEnglishNames` es `true` y `uiLanguagesPath` está configurado (las cadenas ya encontradas en el código fuente tienen prioridad). Los hashes de segmento son los **primeros 8 caracteres hexadecimales del MD5** de la cadena fuente recortada — estos se convierten en las claves en `strings.json`.

### `strings.json`

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

`models` (opcional) — por configuración regional, qué modelo produjo esa traducción tras la última ejecución exitosa de `translate-ui` para esa configuración regional (o `user-edited` si el texto se guardó desde la interfaz web `editor`). `locations` (opcional) — dónde encontró `extract` la cadena (escáner + línea de descripción del paquete; las cadenas solo del manifiesto `englishName` pueden omitir `locations`).

`extract` añade nuevas claves y conserva los datos existentes de `translated` / `models` para las claves que aún están presentes en el escaneo (literales del escáner, descripción opcional, manifiesto opcional `englishName`). `translate-ui` rellena las entradas `translated` faltantes, actualiza `models` para los idiomas que traduce, y escribe archivos planos por configuración regional.

**manifiesto `ui-languages.json`** — array JSON de `{ code, label, englishName, direction }` (BCP-47 `code`, interfaz de usuario `label`, referencia `englishName`, `"ltr"` o `"rtl"`). Usa `generate-ui-languages` para crear un archivo de proyecto a partir de `sourceLocale` + `targetLocales` y el `data/ui-languages-complete.json` maestro incluido.

### Archivos de localización plana

Cada configuración regional de destino obtiene un archivo JSON plano (`de.json`) que asocia la cadena original con su traducción (sin el campo `models`):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next carga estos como paquetes de recursos y busca traducciones por la cadena de origen (modelo clave-como-predeterminado).

### Prompts de traducción de UI

`buildUIPromptMessages` construye mensajes del sistema + del usuario que:
- Identifican los idiomas de origen y destino (por nombre de visualización de `localeDisplayNames` o `ui-languages.json`).
- Envía un array JSON de cadenas y solicita un array JSON de traducciones a cambio.
- Incluye pistas de glosario cuando están disponibles.

`OpenRouterClient.translateUIBatch` intenta cada modelo en orden, pasando al siguiente ante errores de análisis o de red. La CLI construye esa lista a partir de `openrouter.translationModels` (o valores predeterminados heredados); para `translate-ui`, si está definido, `ui.preferredModel` se añade al principio (eliminando duplicados respecto al resto).

---

## Flujo de trabajo 2 - Internos de la traducción de documentos

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

### Extractores

Todos los extractores extienden `BaseExtractor` e implementan `extract(content, filepath): Segment[]`.

- `MarkdownExtractor`: divide el markdown en segmentos tipificados: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Los segmentos no traducibles (bloques de código, HTML sin procesar) se conservan textualmente.  
- `JsonExtractor`: extrae valores de cadena de los archivos JSON de etiquetas de Docusaurus.  
- `SvgExtractor`: extrae el contenido de `<text>`, `<title>` y `<desc>` del SVG (usado por `translate-svg` para recursos bajo `config.svg`, no por `translate-docs`).

### Protección de marcadores de posición

Antes de la traducción, la sintaxis sensible se reemplaza con tokens opacos para prevenir la corrupción de LLM:

1. **Marcadores de admonición** (`:::note`, `:::`) - restaurados con el texto original exacto.
2. **Anclas de documento** (HTML `<a id="…">`, encabezado de Docusaurus `{#…}`) - preservados textualmente.
3. **URLs de Markdown** (`](url)`, `src="../…"`) - restaurados de un mapa después de la traducción.

### Caché (`TranslationCache`)

La base de datos SQLite (a través de `node:sqlite`) almacena filas indexadas por `(source_hash, locale)` con `translated_text`, `model`, `filepath`, `last_hit_at` y campos relacionados. El hash es SHA-256 de los primeros 16 caracteres hexadecimales del contenido normalizado (espacios en blanco colapsados).

En cada ejecución, los segmentos se buscan por hash × locale. Solo los fallos de caché van al LLM. Después de la traducción, `last_hit_at` se restablece para las filas de segmento en el ámbito de traducción actual que no fueron alcanzadas. `cleanup` ejecuta `sync --force-update` primero, luego elimina filas de segmento obsoletas (null `last_hit_at` / filepath vacío), poda claves de `file_tracking` cuando la ruta de origen resuelta falta en el disco (`doc-block:…`, `svg-assets:…`, etc.), y elimina filas de traducción cuya metadata filepath apunta a un archivo faltante; primero hace una copia de seguridad de `cache.db` a menos que se pase `--no-backup`.

El comando `translate-docs` también utiliza **seguimiento de archivos** para que las fuentes sin cambios con salidas existentes puedan omitir todo el trabajo. `--force-update` vuelve a ejecutar el procesamiento de archivos mientras sigue utilizando la caché de segmentos; `--force` borra el seguimiento de archivos y omite las lecturas de caché de segmentos para la traducción de API. Consulta [Getting Started](GETTING_STARTED.es.md#cache-behaviour-and-translate-docs-flags) para la tabla completa de flags.

**Formato de solicitud por lotes:** `translate-docs --prompt-format` selecciona el formato XML (`<seg>` / `<t>`) o formato de matriz/objeto JSON únicamente para `OpenRouterClient.translateDocumentBatch`; la extracción, los marcadores de posición y la validación no cambian. Consulte [Formato de solicitud por lotes](GETTING_STARTED.es.md#batch-prompt-format).

### Resolución de la ruta de salida

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` mapea una ruta relativa a la fuente a la ruta de salida:

- Estilo `nested` (por defecto): `{outputDir}/{locale}/{relPath}` para markdown.  
- Estilo `docusaurus`: bajo `docsRoot`, las salidas usan `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; las rutas fuera de `docsRoot` vuelven al diseño anidado.  
- Estilo `flat`: `{outputDir}/{stem}.{locale}{extension}`. Cuando `flatPreserveRelativeDir` es `true`, los subdirectorios de origen se mantienen bajo `outputDir`.  
- **Plantilla personalizada** `pathTemplate`: cualquier diseño para markdown usando `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.  
- **Plantilla personalizada** `jsonPathTemplate`: diseño personalizado separado para archivos JSON de etiquetas, usando los mismos marcadores de posición.  
- `linkRewriteDocsRoot` ayuda al reescritor de enlaces planos a calcular los prefijos correctos cuando la salida traducida está ubicada en otro lugar distinto de la raíz del proyecto predeterminada.

### Reescritura de enlaces planos

Cuando `markdownOutput.style === "flat"`, los archivos markdown traducidos se colocan junto a la fuente con sufijos de locale. Los enlaces relativos entre páginas se reescriben para que `[Guide](../guide.md)` en `readme.de.md` apunte a `guide.de.md`. Controlado por `rewriteRelativeLinks` (habilitado automáticamente para el estilo plano sin una `pathTemplate` personalizada).

---

## Infraestructura compartida

### `OpenRouterClient`

Envuelve la API de completaciones de chat de OpenRouter. Comportamientos clave:

- **Modelo de reserva**: prueba cada modelo de la lista resuelta en orden; recurre a reserva en errores HTTP o fallos de análisis. La traducción de la interfaz de usuario resuelve primero `ui.preferredModel` cuando está presente, luego los modelos `openrouter`.
- **Limitación de tasa**: detecta respuestas 429, espera `retry-after` (o 2s), reintenta una vez.
- **Almacenamiento en caché de prompts**: el mensaje del sistema se envía con `cache_control: { type: "ephemeral" }` para habilitar el almacenamiento en caché de prompts en modelos compatibles.
- **Registro de tráfico de depuración**: si `debugTrafficFilePath` está configurado, añade JSON de solicitud y respuesta a un archivo.

### Carga de configuración

Canalización `loadI18nConfigFromFile(configPath, cwd)`:

1. Leer y analizar `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - fusión profunda con `defaultI18nConfigPartial`, y fusionar cualquier entrada `documentations[].sourceFiles` en `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - si `targetLocales` es una ruta de archivo, cargar el manifiesto y expandir a códigos de localización; establecer `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - lo mismo para cada entrada `documentations[].targetLocales`.
5. `parseI18nConfig` - Validación Zod + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - aplicar `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - adjuntar nombres de visualización del manifiesto.

### Registrador

`Logger` admite niveles `debug`, `info`, `warn`, `error` con salida de color ANSI. El modo detallado (`-v`) habilita `debug`. Cuando `logFilePath` está configurado, las líneas de registro también se escriben en ese archivo.

---

## API de ayudas de tiempo de ejecución

Estas se exportan desde `'ai-i18n-tools/runtime'` y funcionan en cualquier entorno JavaScript (navegador, Node.js, Deno, Edge). **No** importan desde `i18next` o `react-i18next`.

### Ayudas para RTL

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

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

Utilice **`setupKeyAsDefaultT`** como punto de entrada habitual de la aplicación (recorte de clave + plural **`wrapT`** + **`translate-ui`** opcional `{sourceLocale}.json`). Llamar a **`wrapI18nWithKeyTrim`** por sí solo está **deprecated** para la configuración de aplicaciones.

Construya **`localeLoaders`** con **`makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`** para que las claves permanezcan alineadas con **`targetLocales`** después de **`generate-ui-languages`**. Vea **`docs/GETTING_STARTED.md`** (configuración en tiempo de ejecución) y **`examples/nextjs-app/`** / **`examples/console-app/`**.

### Ayudas de visualización

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### Ayudas de cadenas

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## API programática

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
| `loadI18nConfigFromFile` | Cargar, fusionar, validar configuración desde un archivo JSON. |
| `parseI18nConfig` | Validar un objeto de configuración en bruto. |
| `TranslationCache` | Caché SQLite - instanciar con una ruta `cacheDir`. |
| `UIStringExtractor` | Extraer cadenas `t("…")` desde fuente JS/TS. |
| `MarkdownExtractor` | Extraer segmentos traducibles desde markdown. |
| `JsonExtractor` | Extraer desde archivos JSON de etiquetas de Docusaurus. |
| `SvgExtractor` | Extraer desde archivos SVG. |
| `OpenRouterClient` | Hacer solicitudes de traducción a OpenRouter. |
| `PlaceholderHandler` | Proteger/restaurar sintaxis markdown alrededor de la traducción. |
| `splitTranslatableIntoBatches` | Agrupar segmentos en lotes de tamaño para LLM. |
| `validateTranslation` | Comprobaciones estructurales después de la traducción. |
| `resolveDocumentationOutputPath` | Resolver ruta de archivo de salida para un documento traducido. |
| `Glossary` / `GlossaryMatcher` | Cargar y aplicar glosarios de traducción. |
| `runTranslateUI` | Punto de entrada programático para traducción de interfaz de usuario. |

---

## Puntos de extensión

### Nombres de funciones personalizadas (extracción de interfaz de usuario)

Añadir nombres de funciones de traducción no estándar mediante configuración:

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### Extractores personalizados

Implementar `ContentExtractor` del paquete:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Pásalo a la tubería de traducción de documentos importando las utilidades de `doc-translate.ts` programáticamente.

### Rutas de salida personalizadas

Usa `markdownOutput.pathTemplate` para cualquier diseño de archivo:

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
