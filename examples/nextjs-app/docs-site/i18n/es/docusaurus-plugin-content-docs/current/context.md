---
translation_last_updated: '2026-04-11T01:50:04.922Z'
source_file_mtime: '2026-04-11T01:49:54.980Z'
source_file_hash: bbe062d908fc9ffb78ef01c82109ef171a341b28d31299b453571cb1324d5799
translation_language: es
source_file_path: docs-site/docs/context.md
---
# ai-i18n-tools: Contexto del Agente de IA

Este documento proporciona al agente de IA el modelo mental, decisiones clave y patrones necesarios para trabajar eficazmente con `ai-i18n-tools` sin tener que consultar todos los demás documentos primero. Léalo antes de realizar cambios en código o configuración.

<!-- DOCTOC SKIP -->

---

## Qué hace este paquete {#what-this-package-does}

`ai-i18n-tools` es una CLI y una biblioteca que automatiza la internacionalización para proyectos JavaScript/TypeScript. Hace lo siguiente:

1. **Extrae** cadenas de interfaz de usuario del código fuente (llamadas `t("…")`) en un catálogo maestro.
2. **Traduce** ese catálogo y los archivos de documentación mediante LLMs (a través de OpenRouter).
3. **Escribe** archivos JSON listos para cada configuración regional para i18next, y copias traducidas de documentos markdown/SVG/JSON.
4. **Exporta ayudantes en tiempo de ejecución** para conectar i18next, soporte RTL y selección de idioma en cualquier entorno JS.

Todo está controlado por un único archivo de configuración: `ai-i18n-tools.config.json`.

---

## Dos flujos de trabajo independientes {#two-independent-workflows}

| | Flujo de trabajo 1 - Cadenas de IU | Flujo de trabajo 2 - Documentos |
|---|---|---|
| **Entrada** | Archivos fuente JS/TS con llamadas `t("…")` | `.md`, `.mdx`, archivos JSON de etiquetas de Docusaurus, `.svg` |
| **Salida** | `strings.json` (catálogo) + archivos JSON planos por configuración regional (`de.json`, etc.) | Copias traducidas de esos archivos en las rutas de salida configuradas |
| **Caché** | El propio `strings.json` (se conservan las traducciones existentes) | Base de datos SQLite (`cacheDir`) - solo los segmentos nuevos/cambiados se envían al LLM |
| **Comando clave** | `translate-ui` | `translate-docs` |
| **Comando de sincronización** | `sync` | `sync` |
| **Banderas de características** | `extractUIStrings`, `translateUIStrings` | `translateMarkdown`, `translateJSON`, `translateSVG` |

Pueden usarse independientemente o juntos en la misma configuración. **`sync`** ejecuta, en orden: `extract` (si está habilitado), `translate-ui` (si está habilitado, a menos que `--no-ui`), `translate-svg` cuando existe `config.svg` (a menos que `--no-svg`), luego `translate-docs` (a menos que `--no-docs`). Consulte la [chuleta de la CLI](#cli-commands-cheat-sheet) para conocer las banderas.

---

## Referencia rápida del archivo de configuración {#config-file-quick-reference}

Archivo: `ai-i18n-tools.config.json` (ubicación predeterminada - puede anularse con `-c <path>`)

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",

  "openrouter": {
    "translationModels": ["google/gemini-2.5-flash", "openai/gpt-4o-mini"],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },

  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/",
    "reactExtractor": {
      "funcNames": ["t", "i18n.t"],
      "extensions": [".js", ".jsx", ".ts", ".tsx"]
    }
  },

  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "targetLocales": ["de", "fr"],
    "jsonSource": "i18n/en",
    "markdownOutput": {
      "style": "docusaurus",
      "docsRoot": "docs"
    }
  },

  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

### Restricciones clave {#key-constraints}

- `sourceLocale` **debe coincidir exactamente** con la constante `SOURCE_LOCALE` exportada desde el archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` puede ser una ruta de cadena a un manifiesto `ui-languages.json` O una matriz de códigos BCP-47.
- `documentation.targetLocales` anula `targetLocales` solo para documentos, útil cuando desea menos configuraciones regionales para documentos que para la interfaz de usuario.
- Todas las rutas son relativas al directorio de trabajo actual (cwd, donde se invoca la CLI).
- `OPENROUTER_API_KEY` debe establecerse en el entorno o en un archivo `.env`.

---

## El manifiesto `ui-languages.json` {#the-ui-languagesjson-manifest}

Cuando `targetLocales` es una ruta de archivo, ese archivo debe ser un array JSON con esta estructura:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "de",    "label": "Deutsch",       "englishName": "German" },
  { "code": "ar",    "label": "العربية",        "englishName": "Arabic" }
]
```

- `code` - código de configuración regional BCP-47 utilizado en nombres de archivo y por i18next.
- `label` - nombre nativo mostrado en los selectores de idioma.
- `englishName` - nombre en inglés utilizado para ayudantes de visualización y prompts de traducción.

Este archivo impulsa tanto la canalización de traducción como la interfaz de usuario del selector de idiomas en tiempo de ejecución. Manténgalo como la única fuente de verdad para las configuraciones regionales admitidas.

---

## Chuleta de comandos de la CLI {#cli-commands-cheat-sheet}

```
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus]
    Write a starter config file. ui-markdown = React/UI-only template.
    ui-docusaurus = combined UI + docs template.

npx ai-i18n-tools extract
    Scan source for t("…") calls, write/merge strings.json.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools translate-ui [--locale <code>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate markdown/JSON/SVG under documentation paths. Default: skip unchanged files + use segment SQLite cache.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
    Standalone SVG assets from config.svg. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-docs] …
    extract (if enabled), translate-ui (unless --no-ui), translate-svg when config.svg exists (unless --no-svg),
    translate-docs (unless --no-docs). --force / --force-update apply to the docs step only; if --no-docs, both can be passed without conflict.

npx ai-i18n-tools status [--locale <code>]
    Show translation coverage per file × locale.

npx ai-i18n-tools editor
    Launch a local web editor for the SQLite cache, strings.json, and glossary.

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>] [--yes]
    Maintain the SQLite cache: removes stale rows and orphaned filepath rows.
    Prompts before DB writes (unless --dry-run or --yes): run translate-docs --force-update first.
    Backs up cache.db under the cache dir before modifications unless --no-backup. Use --yes in CI.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Banderas globales: `-c <config>` (ruta del archivo de configuración), `-v` (salida detallada o de depuración).

---

## Flujo de trabajo 1 - Cadenas de interfaz de usuario: cómo fluye la información {#workflow-1---ui-strings-how-data-flows}

```
source files (JS/TS)
    │  i18next-scanner Parser finds t("literal") and i18n.t("literal")
    ▼
strings.json  - master catalog
    {
      "<md5-8-hex>": {
        "source": "The English string",
        "translated": { "de": "Der deutsche Text", "pt-BR": "O texto em português" }
      }
    }
    │  translate-ui reads this, sends batches to OpenRouter, fills missing locales
    ▼
src/locales/de.json    - flat map: source string → translation
    { "The English string": "Der deutsche Text", "Save": "Speichern" }
src/locales/pt-BR.json
    ...
```

**Solo las cadenas literales son extraíbles.** Las variables, expresiones o literales de plantilla como clave no se encuentran:

```js
t('Save')                   // ✓ extracted
t('Hello {{name}}', {name}) // ✓ extracted as "Hello {{name}}"
t(labelVar)                 // ✗ not extracted - variable key
t(`Hello ${name}`)          // ✗ not extracted - template literal
```

i18next utiliza el modelo clave-como-valor-predeterminado: las traducciones que faltan se reemplazan por la clave misma (la cadena fuente en inglés). El `parseMissingKeyHandler` en `defaultI18nInitOptions` maneja esto.

---

## Flujo de trabajo 2 - Traducción de documentos: cómo fluye la información {#workflow-2---document-translation-how-data-flows}

```
source files (md/mdx/json/svg)
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

**Clave de caché**: primeros 16 caracteres hexadecimales del SHA-256 del contenido del segmento normalizado (espacios en blanco) × configuración regional. La caché está en `documentation.cacheDir` (un archivo SQLite `.db`).

**CLI**: `--force-update` omite solo la omisión a nivel de *archivo* (reconstruye las salidas) pero aún utiliza la caché de segmentos. `--force` borra el seguimiento por archivo y omite las lecturas de caché de segmentos para llamadas a la API. Consulte la guía de inicio rápido para obtener la tabla completa de banderas.

**Estilos de salida** (`markdownOutput.style`):

| Estilo | Ejemplo |
|---|---|
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| plantilla de ruta personalizada `pathTemplate` | cualquier estructura usando `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` |

La salida en estilo plano reescribe automáticamente los enlaces relativos entre páginas (por ejemplo, `[Guía](./guide.md)` → `guide.de.md`).

---

## Integración en tiempo de ejecución - conexión de i18next {#runtime-integration---wiring-i18next}

El paquete exporta ayudantes desde `'ai-i18n-tools/runtime'` que eliminan código repetitivo. Configuración mínima:

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

**Carga de una configuración regional bajo demanda** (por ejemplo, cuando el usuario cambia de idioma):

```ts
await loadLocale(code);
i18n.changeLanguage(code);
```

`loadLocale` no realiza ninguna acción para la configuración regional fuente: solo obtiene configuraciones regionales no fuentes.

---

## Referencia de ayudantes en tiempo de ejecución {#runtime-helpers-reference}

Todos exportados desde `'ai-i18n-tools/runtime'`. Funcionan en cualquier entorno JS (navegador, Node.js, Edge, Deno). No requiere dependencia par de i18next.

| Exportación | Firma | Finalidad |
|---|---|---|
| `defaultI18nInitOptions` | `(sourceLocale?: string) => i18nextInitOptions` | Inicialización estándar de i18next para configuración clave-como-valor-predeterminado |
| `wrapI18nWithKeyTrim` | `(i18n: I18nLike) => void` | Recorta las claves antes de la búsqueda y aplica interpolación `{{var}}` para la configuración regional fuente (donde `parseMissingKeyHandler` devuelve la clave sin procesar) |
| `makeLoadLocale` | `(i18n, loaders, sourceLocale?) => (lang: string) => Promise<void>` | Fábrica para carga asíncrona de configuraciones regionales |
| `getTextDirection` | `(lng: string) => 'ltr' \| 'rtl'` | Detección RTL mediante código BCP-47 |
| `applyDirection` | `(lng: string, element?: Element) => void` | Establece `dir` en `document.documentElement` (no realiza ninguna acción en Node.js) |
| `getUILanguageLabel` | `(lang: UiLanguageEntry, t: TranslateFn) => string` | Etiqueta traducida para menús desplegables en páginas de configuración |
| `getUILanguageLabelNative` | `(lang: UiLanguageEntry) => string` | Etiqueta nativa para menús de cabecera (sin llamada a `t()`) |
| `interpolateTemplate` | `(str: string, vars: Record<string, string \| number \| boolean>) => string` | Sustitución de bajo nivel de `{{var}}` en una cadena simple (usado internamente por `wrapI18nWithKeyTrim`; rara vez necesario en código de aplicación) |
| `flipUiArrowsForRtl` | `(text, isRtl: boolean) => string` | Cambia `→` a `←` para diseños RTL |
| `RTL_LANGS` | `ReadonlySet<string>` | Conjunto de códigos BCP-47 considerados RTL |

---

## API programática {#programmatic-api}

Importar desde `'ai-i18n-tools'`. Útil cuando necesite invocar pasos de traducción desde un script de compilación o canalización CI.

```ts
import {
  loadI18nConfigFromFile,
  runTranslateUI,
  Logger,
} from 'ai-i18n-tools';

const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');
const logger = new Logger({ level: 'info' });

const summary = await runTranslateUI({
  config,
  cwd: process.cwd(),
  logger,
  apiKey: process.env.OPENROUTER_API_KEY,
});
// summary.translated - number of newly translated strings
// summary.locales   - number of locales processed
```

Otras exportaciones útiles para canalizaciones personalizadas:

| Exportar | Uso |
|---|---|
| `loadI18nConfigFromFile(path, cwd?)` | Cargar y validar la configuración |
| `parseI18nConfig(rawObject)` | Validar un objeto de configuración que haya creado en código |
| `TranslationCache` | Acceso directo a la caché SQLite |
| `UIStringExtractor` | Extraer llamadas `t("…")` de archivos JS/TS |
| `MarkdownExtractor` | Analizar markdown en segmentos traducibles |
| `JsonExtractor` | Analizar archivos JSON de etiquetas de Docusaurus |
| `SvgExtractor` | Analizar elementos de texto SVG |
| `OpenRouterClient` | Realizar solicitudes de traducción directamente |
| `PlaceholderHandler` | Proteger/restaurar la sintaxis de markdown alrededor de la traducción |
| `splitTranslatableIntoBatches` | Agrupar segmentos en lotes del tamaño adecuado para el LLM |
| `validateTranslation` | Comprobaciones estructurales tras una llamada de traducción |
| `resolveDocumentationOutputPath` | Calcular la ruta del archivo de salida para un documento traducido |
| `Glossary` / `GlossaryMatcher` | Cargar y aplicar un glosario de traducción |

---

## Glosario {#glossary}

El glosario garantiza una terminología coherente en todas las traducciones.

- **Glosario auto-generado** (`glossary.uiGlossary`): lee `strings.json` y utiliza traducciones existentes como fuente de sugerencias. No se necesita un archivo CSV.
- **Glosario de usuario** (`glossary.userGlossary`): un archivo CSV con columnas `term,translation,locale`. Genere una plantilla vacía con `npx ai-i18n-tools glossary-generate`.

Las sugerencias del glosario se inyectan en el mensaje del sistema del LLM; son recomendaciones, no sustituciones obligatorias.

---

## Puntos de extensión {#extension-points}

### Nombres de funciones personalizados {#custom-function-names}

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
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```

Marcadores disponibles: `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

---

## Tareas comunes y qué hacer {#common-tasks-and-what-to-do}

| Tarea | Qué ejecutar o cambiar |
|---|---|
| Añadir un nuevo idioma | Agréguelo a `ui-languages.json` (o al array `targetLocales`), luego ejecute `translate-docs` / `translate-ui` / `sync` |
| Traducir solo un idioma | `npx ai-i18n-tools translate-docs --locale de` (o `translate-ui`, `sync`) |
| Añadir una nueva cadena de interfaz | Escriba `t('Mi nueva cadena')` en el código fuente, luego ejecute `extract` y después `translate-ui` |
| Actualizar una traducción manualmente | Edite directamente `strings.json` (objeto `translated`), luego ejecute `translate-ui` (no sobrescribirá entradas existentes) |
| Traducir solo documentos nuevos/actualizados | Ejecute `translate-docs` - la caché de archivos y segmentos omite automáticamente el trabajo sin cambios |
| Reconstruir salidas de documentos sin volver a llamar a la API para segmentos sin cambios | `npx ai-i18n-tools translate-docs --force-update` |
| Re-traducción completa de documentos (ignorar caché de segmentos) | `npx ai-i18n-tools translate-docs --force` |
| Liberar espacio de caché | `npx ai-i18n-tools cleanup` o `translate-docs --clear-cache` |
| Inspeccionar qué no está traducido | `npx ai-i18n-tools status` |
| Cambiar el modelo de traducción | Edite `openrouter.translationModels` en la configuración (el primer modelo es el principal, el resto son de respaldo) |
| Integrar i18next en un nuevo proyecto | Vea [Integración en tiempo de ejecución](#runtime-integration---wiring-i18next) anterior |
| Traducir documentos a menos idiomas que la interfaz | Establezca `documentation.targetLocales` en un array más pequeño |
| Ejecutar extract + UI + SVG + docs en un solo comando | `npx ai-i18n-tools sync` - use `--no-ui`, `--no-svg` o `--no-docs` para omitir una etapa (por ejemplo, solo UI + SVG: `--no-docs`) |

---

## Variables de entorno {#environment-variables}

| Variable | Efecto |
|---|---|
| `OPENROUTER_API_KEY` | **Obligatorio.** Su clave de API de OpenRouter. |
| `OPENROUTER_BASE_URL` | Anula la URL base de la API. |
| `I18N_SOURCE_LOCALE` | Anula `sourceLocale` en tiempo de ejecución. |
| `I18N_TARGET_LOCALES` | Códigos de idioma separados por comas para anular `targetLocales`. |

---

## Archivos generados o mantenidos por la herramienta {#files-generated--maintained-by-the-tool}

| Archivo | Propiedad de | Notas |
|---|---|---|
| `ai-i18n-tools.config.json` | Tú | Configuración principal. Editar manualmente. |
| `ui-languages.json` (dondequiera que esté configurado) | Tú | Manifiesto de configuraciones regionales. Editar manualmente para agregar o eliminar configuraciones regionales. |
| `strings.json` (dondequiera que esté configurado) | Herramienta (`extract`) | Catálogo maestro de interfaz de usuario. Es seguro editar los valores `translated`. No cambiar el nombre de las claves. |
| `{flatOutputDir}/de.json`, etc. | Herramienta (`translate-ui`) | Mapas planos por configuración regional. No editar: se regeneran en cada ejecución de `translate-ui`. |
| `{cacheDir}/*.db` | Herramienta | Caché de traducción en SQLite. No editar directamente; usar el comando `editor` o `cleanup`. |
| `glossary-user.csv` | Tú | Reemplazos de términos. Generar plantilla con `glossary-generate`. |

---

## Resumen de la estructura de origen {#source-layout-summary}

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

El punto de entrada para todos los tipos y funciones públicos es `src/index.ts`.
