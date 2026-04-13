---
translation_last_updated: '2026-04-13T00:28:31.008Z'
source_file_mtime: '2026-04-13T00:28:15.573Z'
source_file_hash: d362c2411cab836c5035efd2135f097efeb4477a3f61cd225850c323e0cc7071
translation_language: es
source_file_path: docs-site/docs/context.md
---
# ai-i18n-tools: Contexto para Agentes de IA

Este documento proporciona a un agente de IA el modelo mental, las decisiones clave y los patrones necesarios para trabajar eficazmente con `ai-i18n-tools` sin tener que consultar primero todos los demás documentos. Léelo antes de realizar cambios en el código o la configuración.

<!-- DOCTOC SKIP -->

---

## Qué hace este paquete {#what-this-package-does}

`ai-i18n-tools` es una CLI + biblioteca que automatiza la internacionalización para proyectos JavaScript/TypeScript. Lo que hace:

1. **Extrae** cadenas de interfaz de usuario del código fuente (llamadas `t("…")`) a un catálogo maestro.
2. **Traduce** ese catálogo y los archivos de documentación mediante LLMs (a través de OpenRouter).
3. **Escribe** archivos JSON listos para locales para i18next, además de markdown traducido, etiquetas JSON de Docusaurus y recursos SVG independientes.
4. **Exporta ayudantes de tiempo de ejecución** para configurar i18next, soporte RTL y selección de idioma en cualquier entorno JS.

Todo se controla mediante un único archivo de configuración: `ai-i18n-tools.config.json`.

---

## Dos flujos de trabajo independientes {#two-independent-workflows}

| | Flujo de trabajo 1 - Cadenas de UI | Flujo de trabajo 2 - Documentos |
|---|---|---|
| **Entrada** | Archivos fuente JS/TS con llamadas `t("…")` | Archivos `.md`, `.mdx`, archivos de etiquetas JSON de Docusaurus |
| **Salida** | `strings.json` (catálogo) + archivos JSON planos por locale (`de.json`, etc.) | Copias traducidas de esos archivos en las rutas de salida configuradas |
| **Caché** | El propio `strings.json` (las traducciones existentes se conservan) | Base de datos SQLite (`cacheDir`): solo los segmentos nuevos/cambiados van al LLM |
| **Comando clave** | `translate-ui` | `translate-docs` |
| **Comando de sincronización** | `sync` | `sync` |
| **Banderas de características** | `extractUIStrings`, `translateUIStrings` | `translateMarkdown`, `translateJSON` |

Se pueden usar de forma independiente o juntos en la misma configuración. `sync` se ejecuta, en orden: `extract` (si está habilitado), `translate-ui` (si está habilitado, a menos que `--no-ui`), `translate-svg` cuando `config.svg` existe (a menos que `--no-svg`), luego `translate-docs` (a menos que `--no-docs`). La traducción de SVG independiente se configura a través del bloque `svg` de nivel superior, no mediante una bandera de función. Consulta la [hoja de trucos de CLI](#cli-commands-cheat-sheet) para las banderas.

---

## Referencia rápida del archivo de configuración {#config-file-quick-reference}

Archivo: `ai-i18n-tools.config.json` (ubicación predeterminada - anular con `-c <ruta>`)

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",

  "openrouter": {
    "translationModels": [
      "qwen/qwen3-235b-a22b-2507",
      "openai/gpt-4o-mini",
      "deepseek/deepseek-v3.2",
      "anthropic/claude-3-haiku",
      "qwen/qwen3.6-plus",
      "anthropic/claude-3.5-haiku",
      "openai/gpt-5.3-codex",
      "anthropic/claude-sonnet-4.6",
      "google/gemini-3-flash-preview"
    ],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
  },

  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/",
    "preferredModel": "anthropic/claude-3.5-haiku",
    "reactExtractor": {
      "funcNames": ["t", "i18n.t"],
      "extensions": [".js", ".jsx", ".ts", ".tsx"]
    }
  },

  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr"],
      "jsonSource": "i18n/en",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs"
      }
    }
  ],

  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  },

  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

### Restricciones clave {#key-constraints}

- `sourceLocale` **debe coincidir exactamente** con la constante `SOURCE_LOCALE` exportada desde el archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` puede ser una ruta de archivo a un manifiesto `ui-languages.json` O un array de códigos BCP-47.
- `uiLanguagesPath` es opcional, pero útil cuando `targetLocales` es un array explícito y aún se desean etiquetas basadas en manifiesto y filtrado de locales.
- `documentations[].description` es texto opcional para los mantenedores (para qué sirve el bloque); no afecta a la traducción. Cuando se establece, se incluye en el titular de `translate-docs` y en los encabezados de `status`.
- `documentations[].targetLocales` limita ese bloque a un subconjunto; los locales de documentación efectivos son la **unión** entre bloques (útil cuando diferentes árboles necesitan conjuntos de locales diferentes).
- `documentations[].markdownOutput.postProcessing` puede ajustar el markdown traducido después del reensamblaje, por ejemplo, reescribiendo rutas de capturas de pantalla o reconstruyendo un bloque de lista de idiomas.
- Todas las rutas son relativas al directorio de trabajo actual (donde se invoca la CLI).
- `OPENROUTER_API_KEY` debe establecerse en el entorno o en un archivo `.env`.

---

## El manifiesto `ui-languages.json` {#the-ui-languagesjson-manifest}

Cuando `targetLocales` es una ruta de archivo, ese archivo debe ser un array JSON con esta forma:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "de",    "label": "Deutsch",       "englishName": "German" },
  { "code": "ar",    "label": "العربية",        "englishName": "Arabic" }
]
```

- `code` - código de locale BCP-47 usado en nombres de archivo y por i18next.
- `label` - nombre nativo mostrado en selectores de idioma.
- `englishName` - nombre en inglés usado para ayudas de visualización y prompts de traducción.

Este archivo impulsa tanto la canalización de traducción como la UI del selector de idioma en tiempo de ejecución. Mantenlo como la única fuente de verdad para los locales soportados.

---

## Hoja de referencia rápida de comandos CLI {#cli-commands-cheat-sheet}

```
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus]
    Write a starter config file. ui-markdown = React/UI-only template.
    ui-docusaurus = combined UI + docs template.

npx ai-i18n-tools extract
    Scan source for t("…") calls, write/merge strings.json.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.
    --force: re-translate all entries per locale. --dry-run: no writes, no API calls. -j: max parallel locales.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate markdown and JSON under documentation paths. Default: skip unchanged files + use segment SQLite cache.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    --prompt-format xml|json-array|json-object: batch wire format to the model (default xml); does not change validation or cache.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
    Standalone SVG assets from config.svg. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-docs] …
    extract (if enabled), translate-ui (unless --no-ui), translate-svg when config.svg exists (unless --no-svg),
    translate-docs (unless --no-docs). --force / --force-update apply to the docs step only; if --no-docs, both can be passed without conflict.

npx ai-i18n-tools status
    Show markdown translation coverage per file × locale.

npx ai-i18n-tools editor
    Launch a local web editor for the SQLite cache, strings.json, and glossary.

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
    Runs sync --force-update first, then maintains the SQLite cache: stale segment rows; orphaned file_tracking keys (doc-block:, svg-assets:, …);
    orphaned translation rows whose filepath metadata points at a missing file.
    Backs up cache.db under the cache dir before modifications unless --no-backup.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Banderas globales: `-c <config>` (ruta de configuración), `-v` (salida detallada/de depuración), `-w` / `--write-logs [ruta]` (redirigir la salida de consola a un archivo de registro; ruta predeterminada: bajo `cacheDir`).

---

## Flujo de trabajo 1 - Cadenas de UI: cómo fluye la data {#workflow-1---ui-strings-how-data-flows}

```
source files (JS/TS)
    │  i18next-scanner Parser finds t("literal") and i18n.t("literal")
    ▼
strings.json  - master catalog
    {
      "<md5-8-hex>": {
        "source": "The English string",
        "translated": { "de": "Der deutsche Text", "pt-BR": "O texto em português" },
        "models": { "de": "…", "pt-BR": "…" }
      }
    }
    │  translate-ui reads this, sends batches to OpenRouter, fills missing locales and records model ids per locale
    ▼
src/locales/de.json    - flat map: source string → translation
    { "The English string": "Der deutsche Text", "Save": "Speichern" }
src/locales/pt-BR.json
    ...
```

**Solo se pueden extraer cadenas literales.** Las variables, expresiones o literales de plantilla como clave no se encuentran:

```js
t('Save')                   // ✓ extracted
t('Hello {{name}}', {name}) // ✓ extracted as "Hello {{name}}"
t(labelVar)                 // ✗ not extracted - variable key
t(`Hello ${name}`)          // ✗ not extracted - template literal
```

i18next utiliza el modelo de clave-como-por-defecto: las traducciones faltantes regresan a la clave misma (la cadena fuente en inglés). El `parseMissingKeyHandler` en `defaultI18nInitOptions` maneja esto.

---

## Flujo de trabajo 2 - Traducción de documentos: cómo fluye la data {#workflow-2---document-translation-how-data-flows}

```
source files (md/mdx/json)
    │  Extractor produces typed segments with SHA-256 hash
    ▼
PlaceholderHandler  - replaces URLs, admonitions, anchors with opaque tokens
    ▼
TranslationCache lookup (SQLite)
    │  cache hit → use stored translation
    │  cache miss → send batch to OpenRouter
    ▼
PlaceholderHandler.restore  - tokens replaced back with original syntax
    ▼
resolveDocumentationOutputPath  → write to output file
```

**Clave de caché**: los primeros 16 caracteres hexadecimales SHA-256 del contenido del segmento normalizado por espacios en blanco × locale. La caché vive bajo `cacheDir` raíz (un archivo SQLite `cache.db`), compartido por todos los bloques `documentations`. Cada fila almacena el `model` que tradujo por última vez el segmento; guardar una edición en el `editor` establece `model` en `user-edited` (el mismo centinela que `models` de `strings.json` de la UI).

**CLI**: `--force-update` omite solo el *nivel de archivo* (reconstruir salidas) mientras sigue usando la caché de segmentos. `--force` borra el seguimiento por archivo y omite las lecturas de caché de segmentos para llamadas a la API. Consulta la guía de inicio rápido para la tabla completa de flags.

**SVGs independientes**: manejados por `translate-svg` con el bloque de configuración `svg` de nivel superior. Utilizan las mismas ideas de OpenRouter/caché, pero no la tubería de `documentations`.

**Estilos de salida** (`markdownOutput.style`):

| Estilo | Ejemplo |
|---|---|
| `"nested"` (por defecto) | `docs/guide.md` → `i18n/de/docs/guide.md` |
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| plantilla de `pathTemplate` personalizada | cualquier diseño usando `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` |

La salida de estilo plano reescribe automáticamente los enlaces relativos entre páginas (por ejemplo, `[Guía](./guide.md)` → `guide.de.md`).

---

## Integración en tiempo de ejecución - cableado de i18next {#runtime-integration---wiring-i18next}

El paquete exporta ayudantes de `'ai-i18n-tools/runtime'` que eliminan el código repetitivo. La configuración mínima:

```ts
// src/i18n.ts  - import this at the top of your entry point
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json exactly
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

// Dynamic imports for non-source locales
const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

**Cargando un locale bajo demanda** (por ejemplo, cuando el usuario cambia de idioma):

```ts
await loadLocale(code);
i18n.changeLanguage(code);
```

`loadLocale` es una operación no efectiva para el locale fuente - solo obtiene locales no fuente.

---

## Referencia de ayudantes en tiempo de ejecución {#runtime-helpers-reference}

Todos exportados de `'ai-i18n-tools/runtime'`. Funcionan en cualquier entorno JS (navegador, Node.js, Edge, Deno). No se requiere dependencia de i18next.

| Exportar | Firma | Propósito |
|---|---|---|
| `defaultI18nInitOptions` | `(sourceLocale?: string) => i18nextInitOptions` | Inicialización estándar de i18next para configuración de clave-como-por-defecto |
| `wrapI18nWithKeyTrim` | `(i18n: I18nLike) => void` | Recortar claves antes de la búsqueda y aplicar interpolación `{{var}}` para el locale fuente (donde `parseMissingKeyHandler` devuelve la clave sin procesar) |
| `makeLoadLocale` | `(i18n, loaders, sourceLocale?) => (lang: string) => Promise<void>` | Fábrica para carga asíncrona de locales |
| `getTextDirection` | `(lng: string) => 'ltr' \| 'rtl'` | Detección de RTL por código BCP-47 |
| `applyDirection` | `(lng: string, element?: Element) => void` | Establecer `dir` en `document.documentElement` (no efectivo en Node.js) |
| `getUILanguageLabel` | `(lang: UiLanguageEntry, t: TranslateFn) => string` | Etiqueta traducida para menús desplegables de la página de configuración |
| `getUILanguageLabelNative` | `(lang: UiLanguageEntry) => string` | Etiqueta nativa para menús de encabezado (sin llamada a `t()`) |
| `interpolateTemplate` | `(str: string, vars: Record<string, string \| number \| boolean>) => string` | Sustitución de bajo nivel `{{var}}` en una cadena simple (usado internamente por `wrapI18nWithKeyTrim`; raramente necesario en el código de la aplicación) |
| `flipUiArrowsForRtl` | `(text, isRtl: boolean) => string` | Voltear `→` a `←` para diseños RTL |
| `RTL_LANGS` | `ReadonlySet<string>` | Conjunto de códigos BCP-47 tratados como RTL |

---

## API programática {#programmatic-api}

Importar de `'ai-i18n-tools'`. Útil cuando necesitas llamar pasos de traducción desde un script de construcción o tubería CI.

```ts
import {
  loadI18nConfigFromFile,
  runTranslateUI,
} from 'ai-i18n-tools';

const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');
const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
// summary.stringsUpdated - number of newly translated strings
// summary.localesTouched - locale codes processed
```

Otras exportaciones útiles para tuberías personalizadas:

| Exportar | Usar cuando |
|---|---|
| `loadI18nConfigFromFile(path, cwd?)` | Cargar y validar la configuración |
| `parseI18nConfig(rawObject)` | Validar un objeto de configuración que construiste en código |
| `TranslationCache` | Acceso directo a la caché de SQLite |
| `UIStringExtractor` | Extraer llamadas `t("…")` de archivos JS/TS |
| `MarkdownExtractor` | Analizar markdown en segmentos traducibles |
| `JsonExtractor` | Analizar archivos de etiquetas JSON de Docusaurus |
| `SvgExtractor` | Analizar elementos de texto SVG |
| `OpenRouterClient` | Realizar solicitudes de traducción directamente |
| `PlaceholderHandler` | Proteger/restaurar la sintaxis markdown alrededor de la traducción |
| `splitTranslatableIntoBatches` | Agrupar segmentos en lotes del tamaño de LLM |
| `validateTranslation` | Comprobaciones estructurales después de una llamada de traducción |
| `resolveDocumentationOutputPath` | Calcular la ruta del archivo de salida para un documento traducido |
| `Glossary` / `GlossaryMatcher` | Cargar y aplicar un glosario de traducción |

---

## Glosario {#glossary}

El glosario asegura una terminología consistente a través de las traducciones.

- **Glosario autoconstruido** (`glossary.uiGlossary`): lee `strings.json` y utiliza traducciones existentes como fuente de sugerencias. No se necesita CSV.
- **Glosario del usuario** (`glossary.userGlossary`): un archivo CSV con columnas `Cadena de idioma original`, `locale`, `Traducción` (o `en`, `locale`, `Traducción`). Genera una plantilla vacía con `npx ai-i18n-tools glossary-generate`.

Las sugerencias del glosario se inyectan en el aviso del sistema LLM - son sugerencias, no reemplazos obligatorios.

---

## Puntos de extensión {#extension-points}

### Nombres de funciones personalizadas {#custom-function-names}

```json
{ "ui": { "reactExtractor": { "funcNames": ["t", "i18n.t", "translate"] } } }
```

### Extractor personalizado {#custom-extractor}

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* return typed segments */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* rebuild file */ }
}
```

### Ruta de salida personalizada {#custom-output-path}

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

Marcadores de posición disponibles: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

---

## Tareas comunes y qué hacer {#common-tasks-and-what-to-do}

| Tarea | Qué ejecutar / cambiar |
|---|---|
| Agregar un nuevo locale | Agrégalo a `ui-languages.json` (o al array `targetLocales`), luego ejecuta `translate-docs` / `translate-ui` / `sync` |
| Traducir solo un locale | `npx ai-i18n-tools translate-docs --locale de` (o `translate-ui`, `sync`) |
| Agregar una nueva cadena de UI | Escribe `t('Mi nueva cadena')` en la fuente, luego ejecuta `extract` y luego `translate-ui` |
| Actualizar una traducción manualmente | Edita `strings.json` directamente (`translated`), o usa `editor` (establece `models[locale]` en `user-edited`). `translate-ui` omite locales que ya tienen texto a menos que uses `--force` |
| Traducir solo documentos nuevos/actualizados | Ejecuta `translate-docs` - la caché de archivos + segmentos omite automáticamente el trabajo sin cambios |
| Reconstruir salidas de documentos sin volver a llamar a la API para segmentos sin cambios | `npx ai-i18n-tools sync  --force-update` |
| Re-traducción completa de documentos (ignorar caché de segmentos) | `npx ai-i18n-tools translate-docs --force` |
| Liberar espacio en caché | `npx ai-i18n-tools cleanup` o `translate-docs --clear-cache` |
| Inspeccionar lo que no está traducido | `npx ai-i18n-tools status` |
| Cambiar el modelo de traducción | Edita `openrouter.translationModels` (el primero es primario, el resto son alternativas). Para **solo UI**, se intenta el opcional `ui.preferredModel` antes de esa lista. |
| Conectar i18next en un nuevo proyecto | Consulta [Integración en tiempo de ejecución](#runtime-integration---wiring-i18next) arriba |
| Traducir documentos a menos locales que UI | Establece `documentations[].targetLocales` en el/los bloque(s) relevante(s), o usa una unión más pequeña |
| Ejecutar extract + UI + SVG + docs en un solo comando | `npx ai-i18n-tools sync` - usa `--no-ui`, `--no-svg`, o `--no-docs` para omitir una etapa (por ejemplo, solo UI + SVG: `--no-docs`) |

---

## Variables de entorno {#environment-variables}

| Variable | Efecto |
|---|---|
| `OPENROUTER_API_KEY` | **Requerido.** Tu clave API de OpenRouter. |
| `OPENROUTER_BASE_URL` | Sobrescribir la URL base de la API. |
| `I18N_SOURCE_LOCALE` | Sobrescribir `sourceLocale` en tiempo de ejecución. |
| `I18N_TARGET_LOCALES` | Códigos de locales separados por comas para sobrescribir `targetLocales`. |
| `I18N_LOG_LEVEL` | Nivel del registrador (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR` | Cuando `1`, desactivar colores ANSI en la salida del registro. |
| `I18N_LOG_SESSION_MAX` | Máx. líneas mantenidas por sesión de registro (por defecto `5000`). |

---

## Archivos generados / mantenidos por la herramienta {#files-generated--maintained-by-the-tool}

| Archivo | Propietario | Notas |
|---|---|---|
| `ai-i18n-tools.config.json` | Tú | Configuración principal. Edita manualmente. |
| `ui-languages.json` (donde sea configurado) | Tú | Manifiesto de locales. Edita manualmente para agregar/quitar locales. |
| `strings.json` (donde sea configurado) | Herramienta (`extract` / `translate-ui` / `editor`) | Catálogo maestro de UI: `source`, `translated`, opcional `models` (por locale: id de modelo OpenRouter o `user-edited`), opcional `locations`. Seguro editar `translated`; no renombres claves. |
| `{flatOutputDir}/de.json`, etc. | Herramienta (`translate-ui`) | Mapas planos por locale (fuente → traducción solamente, sin `models`). No edites — se regeneran en cada `translate-ui`. |
| `{cacheDir}/*.db` | Herramienta | Caché de traducción SQLite (metadatos `model` por segmento; `user-edited` después de guardados manuales en `editor`). No edites directamente; usa `editor` o `cleanup`. |
| `glossary-user.csv` | Tú | Sobrescrituras de términos. Genera plantilla con `glossary-generate`. |

---

## Resumen del diseño de la fuente {#source-layout-summary}

```
src/
├── index.ts               Public API (all programmatic exports)
├── cli/                   CLI command implementations
├── core/                  Config loading, types (Zod), SQLite cache, prompt builder, output paths
├── extractors/            Segment extractors: JS/TS, Markdown, JSON, SVG
├── processors/            Placeholder protection, batch splitting, post-translation validation, link rewriting
├── api/openrouter.ts      HTTP client for OpenRouter with model fallback and rate-limit handling
├── glossary/              Glossary loading (CSV + auto from strings.json) and term matching
├── runtime/               i18next helpers, RTL helpers, display helpers (no i18next import)
├── server/                Local Express web editor for cache/glossary
└── utils/                 Logger, SHA-256 hash, .translate-ignore parser
```

El punto de entrada para todos los tipos y funciones públicas es `src/index.ts`.
