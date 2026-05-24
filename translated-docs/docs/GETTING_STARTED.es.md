<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: Introducción

`ai-i18n-tools` proporciona tres flujos de trabajo independientes y componibles:

- **Flujo de trabajo 1 - Traducción de interfaz**: extrae llamadas `t("…")` de cualquier fuente JS/TS, tradúcelas mediante OpenRouter y genera archivos JSON planos por idioma listos para i18next.
- **Flujo de trabajo 2 - Traducción de documentos**: traduce páginas **markdown, MDX y `.astro`** listadas en `docs[].contentPaths` mediante `translate-docs`, con caché inteligente. Opcionalmente, el **archivo JSON de catálogo de Docusaurus** (`docs[].docusaurusCatalogDir`, proveniente de `docusaurus write-translations`) se traduce con el mismo comando cuando `features.translateDocs` está activado — esto incluye elementos de la interfaz del sitio (barra de navegación, pie de página, cadenas del tema), no el contenido textual en `docs/`.
- **Flujo de trabajo 3 - Traducción de archivos JSON**: traduce paquetes JSON anidados arbitrarios (por ejemplo, `src/i18n/en/translation.json`) mediante `json[]`, `features.translateJson` y `translate-json` de nivel superior — para sitios que almacenan el texto de la interfaz en archivos JSON por idioma en lugar de `t()` en el código fuente.

Los recursos **SVG** utilizan `features.translateSVG`, el bloque `svg` de nivel superior y `translate-svg` (véase [referencia CLI](#cli-reference)).

**¿Qué flujo de trabajo usar?** Cadenas visibles al usuario en el código mediante `t()` → Flujo de trabajo 1 (`extract` / `translate-ui`). Páginas localizadas o archivos JSON del entorno de Docusaurus → Flujo de trabajo 2 (`translate-docs`). Solo archivos JSON por idioma anidados independientes → Flujo de trabajo 3 (`translate-json`).

Ambos flujos de trabajo utilizan OpenRouter (cualquier LLM compatible) y comparten un único archivo de configuración.

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabla de contenido**

- [Instalación](#installation)
- [Inicio rápido](#quick-start)
  - [Scripts recomendados `package.json`](#recommended-packagejson-scripts)
- [Flujo de trabajo 1 - Traducción de interfaz](#workflow-1---ui-translation)
  - [Paso 1: Inicializar](#step-1-initialise)
  - [Paso 2: Extraer cadenas](#step-2-extract-strings)
  - [Paso 3: Traducir cadenas de interfaz](#step-3-translate-ui-strings)
  - [Exportar a XLIFF 2.0 (opcional)](#exporting-to-xliff-20-optional)
  - [Paso 4: Conectar i18next en tiempo de ejecución](#step-4-wire-i18next-at-runtime)
  - [Usar `t()` en el código fuente](#using-t-in-source-code)
  - [Interpolación](#interpolation)
  - [Plurales cardinales (`plurals: true`)](#cardinal-plurals-plurals-true)
  - [Interfaz de selector de idioma](#language-switcher-ui)
  - [Idiomas RTL](#rtl-languages)
- [Flujo de trabajo 2 - Traducción de documentos](#workflow-2---document-translation)
  - [Paso 1: Inicializar para documentación](#step-1-initialise-for-documentation)
  - [Paso 2: Traducir documentos](#step-2-translate-documents)
    - [Markdown complejo y verificaciones de calidad fallidas](#complex-markdown-and-failed-quality-checks)
    - [Comportamiento de caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags)
    - [Formato de solicitud por lotes](#batch-prompt-format)
    - [Dedupe de segmentos y rutas en SQLite](#segment-dedupe-and-paths-in-sqlite)
  - [Diseños de salida](#output-layouts)
    - [Enlaces de anclaje cuando `markdownOutput.style = "flat"`](#anchor-links-when-markdownoutputstyle--flat)
    - [Imágenes y recursos rasterizados en documentos traducidos](#images-and-raster-assets-in-translated-docs)
    - [Selector de idioma (`languageListBlock`)](#language-switcher-languagelistblock)
    - [Marcadores de posición `pathTemplate` / `jsonPathTemplate`](#pathtemplate--jsonpathtemplate-placeholders)
  - [Solución de problemas](#troubleshooting)
- [Flujo de trabajo combinado (IU + Documentos)](#combined-workflow-ui--docs)
  - [Flujo de trabajo mixto de documentación (`markdownOutput.style = "docusaurus"` + `"flat"`)](#mixed-documentation-workflow-markdownoutputstyle--docusaurus--flat)
- [Panel de traducción](#translation-dashboard)
  - [Errores (traducción de documentos)](#failures-document-translation)
    - [Cuándo usarlo](#when-to-use-it)
    - [Por qué son importantes las ediciones en el origen](#why-source-edits-matter)
    - [Cómo usar la pestaña](#how-to-use-the-tab)
  - [Problemas con Markdown (verificaciones estáticas)](#markdown-issues-static-checks)
- [Referencia de configuración](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (opcional)](#uilanguagespath-optional)
  - [`concurrency` (opcional)](#concurrency-optional)
  - [`batchConcurrency` (opcional)](#batchconcurrency-optional)
  - [`fileConcurrency` (opcional)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (opcional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [Buena práctica para exclusiones en git:](#best-practice-for-git-exclusions)
  - [`documentations`](#documentations)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [Referencia de CLI](#cli-reference)
- [Variables de entorno](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## Instalación

El paquete publicado es solo **ESM**. Utilice `import`/`import()` en Node.js o en su empaquetador; no use `require('ai-i18n-tools')`. El paquete declara `engines.node` `>=22.16.0`; no se admiten versiones antiguas de Node.js. El tarball de npm incluye archivos en inglés solo bajo `docs/`; las copias específicas de configuración regional bajo `translated-docs/` están en el [repositorio de GitHub](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools incluye su propio extractor de cadenas. Si anteriormente usabas `i18next-scanner`, `babel-plugin-i18next-extract` o herramientas similares, puedes eliminar esas dependencias de desarrollo tras migrar.

<a id="using-the-cli"></a>
### Uso de la CLI

**Por proyecto (recomendado)** — instalar como dependencia o devDependency, luego invocar mediante `npx`, `pnpm exec` o un script `package.json`. Los scripts `package.json` ya se ejecutan con `node_modules/.bin` en `PATH`, por lo que comandos como `pnpm run i18n:sync` invocan la CLI sin necesidad de escribir `npx`.

**Directamente** `ai-i18n-tools` **en la terminal:** Para ejecutar la CLI directamente en un shell interactivo (desde la raíz del proyecto, tras una instalación local), anteponga el directorio bin local a `PATH`:

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

Con [**direnv**](https://direnv.net/), agregue `PATH_add node_modules/.bin` a un `.envrc` en la raíz del proyecto para que el comando bare esté disponible tras `cd` en el repositorio. Sin ajustar `PATH`, siga usando `npx ai-i18n-tools …` o `pnpm exec ai-i18n-tools …`.

**Ejecución única sin instalación** — `npx ai-i18n-tools <cmd>` o `pnpm dlx ai-i18n-tools <cmd>` (descarga el paquete para esa invocación; sin entrada en `package.json`).

En Linux, macOS y WSL, las instalaciones desde el registro establecen automáticamente el bit ejecutable en el script de la CLI. En Windows, los gestores de paquetes generan shim `.cmd` y `.ps1` que invocan Node explícitamente.

Establece tu clave de API de OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

O crea un archivo `.env` en la raíz del proyecto:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## Inicio rápido

La plantilla predeterminada `init` (`ui-markdown`) habilita únicamente la extracción y traducción de la **IU**. Las plantillas `ui-docusaurus` y `ui-starlight` habilitan la traducción de **documentos** (`translate-docs`). La plantilla `ui-astro-website` estructura la extracción de la **IU** para aplicaciones Astro simples (incluyendo archivos `.astro`); agregue un bloque `documentations[]` (véase [Páginas del sitio web Astro (análisis y reemplazo)](#astro-website-parse-and-replace)) cuando también desee `translate-docs` para el HTML de la página `.astro`. La implementación de referencia [`examples/astro-website`](../../docs/../examples/astro-website/) utiliza ambas **dos** canalizaciones. Use `sync` cuando desee un solo comando que ejecute la extracción, traducción de IU, traducción opcional de archivos SVG y traducción de documentación según su configuración.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Scripts recomendados `package.json`

Con el paquete instalado localmente, puedes usar los comandos CLI directamente en scripts (no se necesita `npx`).

**Prefiere** `sync` para cualquier cosa que antes era "ejecuta `translate-ui`, luego `translate-svg`, luego `translate-docs`": `ai-i18n-tools sync` ejecuta **extract** (cuando está habilitado), **translate-ui**, opcionalmente **translate-svg** y luego **translate-docs** — en el orden correcto y con banderas compartidas — de acuerdo con tu configuración. Encadenar manualmente esos tres comandos de traducción es fácil de hacer mal (orden, extracción, banderas de configuración regional). Usa `i18n:translate:ui`, `i18n:translate:svg` y `i18n:translate:docs` solo cuando necesites un **único** paso de forma aislada.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## Flujo de trabajo 1 - Traducción de interfaz

Diseñado para cualquier proyecto JS/TS que use i18next: aplicaciones React, Next.js (componentes cliente y servidor), servicios Node.js, herramientas CLI.

<a id="step-1-initialise"></a>
### Paso 1: Inicializar

```bash
npx ai-i18n-tools init
```

Esto escribe `ai-i18n-tools.config.json` con la plantilla `ui-markdown`. Edítalo para configurar:

- `sourceLocale` - código BCP-47 de tu idioma fuente (por ejemplo, `"en-GB"`). **Debe coincidir** con `SOURCE_LOCALE` exportado desde tu archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - matriz de códigos BCP-47 para tus idiomas de destino (por ejemplo, `["de", "fr", "pt-BR"]`). Ejecuta `generate-ui-languages` para crear el manifiesto `ui-languages.json` a partir de esta lista.
- `ui.sourceRoots` - directorios o patrones glob para escanear llamadas a `t("…")` (por ejemplo, `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - ubicación donde escribir el catálogo maestro (por ejemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - dónde escribir `de.json`, `pt-BR.json`, etc. (por ejemplo, `"src/locales/"`).
- `ui.preferredModel` (opcional) - ID del modelo OpenRouter a intentar **primero** solo para `translate-ui`; si falla, la CLI continúa con `openrouter.translationModels` (o `defaultModel` / `fallbackModel` heredados) en orden, omitiendo duplicados.

<a id="step-2-extract-strings"></a>
### Paso 2: Extraer cadenas

```bash
npx ai-i18n-tools extract
```

Analiza todos los archivos JS/TS dentro de `ui.sourceRoots` en busca de llamadas a `t("literal")` y `i18n.t("literal")`. Escribe (o combina en) `ui.stringsJson`.

El escáner es configurable: agregue nombres de funciones personalizadas mediante `ui.uiExtractor.funcNames` (o el obsoleto `ui.reactExtractor.funcNames`). Para páginas y componentes Astro, agregue `.astro` a `ui.uiExtractor.extensions`.

<a id="astro-website"></a>
### Sitio web Astro (Astro plano, no Starlight)

Para sitios estáticos de marketing o aplicaciones Astro, combine el enrutamiento i18n integrado de [Astro](https://docs.astro.build/en/guides/internationalization/) con ai-i18n-tools. La implementación de referencia es [`examples/astro-website`](../../docs/../examples/astro-website/) (véase también su [README](../../docs/../examples/astro-website/README.md)): inglés en `/`, nueve configuraciones regionales de destino en `/{locale}/` (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

La mayoría de los equipos usan una **hibridación** de dos canalizaciones (no entran en conflicto):

| Canalización | Uso para | Comandos | Salida |
|----------|---------|----------|--------|
| **HTML de página** | Encabezados, párrafos, etiquetas de navegación, matrices en línea en el cuerpo de la plantilla | `translate-docs` | `src/pages/{locale}/index.astro` por configuración regional |
| **Cadenas de IU (`t()`)** | Datos de frontmatter, etiquetas de pestañas de capturas de pantalla, matrices compartidas | `extract` → `translate-ui` | `public/locales/{locale}.json` (fuente en inglés como clave) |

Mantén alineadas las tres listas cuando agregues o elimines un idioma: `targetLocales` en `ai-i18n-tools.config.json`, `i18n.locales` en `astro.config.mjs` (Astro usa códigos de ruta en **minúsculas** como `pt-br`), y `ui-languages.json` (mediante `generate-ui-languages`). Los **nombres de archivo** de los paquetes planos usan mayúsculas y minúsculas según la configuración (`pt-BR.json`); asigna la ruta `pt-br` de Astro a ese archivo mediante el campo `code` de tu manifiesto (ver `examples/astro-website/src/i18n/locale.ts`).

Ejemplos de scripts `package.json` (del proyecto de referencia):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="astro-website-ui-strings"></a>
### Cadenas de IU del sitio web Astro (SSG)

Estructure la extracción de IU con `init -t ui-astro-website`, luego combine con un bloque `documentations[]` cuando también traduzca el HTML de la página (véase más abajo). Envuelva el texto en `t('…')` en módulos TypeScript y en el frontmatter `.astro` (y bloques `{expression}` de plantilla cuando prefiera cadenas de IU en lugar de páginas duplicadas por configuración regional):

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

Establece `sourceLocale` para que coincida con `i18n.defaultLocale` en `astro.config.mjs`. Escribe paquetes planos en un directorio que Astro pueda importar durante la compilación (la plantilla usa `public/locales/`). Resuelve `t('…')` en **tiempo de compilación** buscando el literal fuente en inglés como clave (consulta `examples/astro-website/src/i18n/t.ts`; `strings.json` es la caché de extracción, no el paquete en tiempo de ejecución). **No** necesitas `ai-i18n-tools/runtime` ni i18next para un sitio estático a menos que añadas islas del cliente que cambien de idioma después de la carga.

Conecte cada página que llame a `t()` (página raíz en inglés y cada copia `src/pages/{locale}/`):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Ayudantes auxiliares en el ejemplo: `src/i18n/utils.ts`, `src/i18n/locale.ts` y `ui-languages.json` para etiquetas, dirección y códigos BCP-47. Ejecute `generate-ui-languages` después de cambiar `targetLocales` (opcionalmente configure `ui.uiLanguagesPath` para que el manifiesto esté junto a sus ayudantes, por ejemplo `src/i18n/ui-languages.json`). `MainLayout.astro` establece `<html lang>` y `<html dir>` desde `resolveUiLanguage(Astro.currentLocale)`; `LanguagePicker.astro` usa `getRelativeLocaleUrl` desde `astro:i18n`.

<a id="astro-website-parse-and-replace"></a>
### Páginas del sitio web Astro (análisis y reemplazo)

Para páginas de marketing con HTML codificado en archivos `.astro`, permite que `translate-docs` extraiga nodos de texto y atributos (`alt`, `title`, `aria-label`, `placeholder`), los traduzca mediante la caché del documento y escriba copias específicas del idioma en tu árbol de páginas. **No** necesitas `t()` para la mayoría de los textos visibles.

Los atributos estructurales y los valores de clave **no** se traducen de forma predeterminada: la protección integrada cubre atributos JSX/HTML como `class`, `id`, `style`, `src`, `href`, `data-*` y la mayoría de `aria-*`, además de claves de objetos como `class`, `key` y `id` dentro de bloques de plantilla `{expression}`. Usa `documentations[].protectAttributes` y `documentations[].protectKeys` para ampliar esas listas cuando utilices atributos personalizados (por ejemplo, atributos de Tailwind `variant` o campos de CMS `slug`). Las mismas opciones se aplican al JSX de MDX durante la traducción de markdown (ver [protectAttributes / protectKeys](#protectattributes-protectkeys)).

Habilita `features.translateMarkdown` y añade un bloque `documentations[]`, por ejemplo:

```json
{
  "features": { "translateMarkdown": true },
  "documentations": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "markdownOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Ejecuta `npx ai-i18n-tools translate-docs` (o `pnpm i18n:translate` en [`examples/astro-website`](../../docs/../examples/astro-website/)). El origen en inglés permanece en `src/pages/index.astro`; cada idioma de destino obtiene `src/pages/{locale}/index.astro` con las importaciones ajustadas al nivel adicional de directorio (por ejemplo, `../layouts/` → `../../layouts/`).

Dentro del **cuerpo de la plantilla**, los literales de cadena en bloques `{expression}` (arrays en línea, campos `title`/`desc` de objetos) se traducen cuando están destinados al usuario; los valores entre comillas en atributos/claves protegidos, literales dentro de `t('…')`, `<script>` y `<style>` permanecen sin cambios. **El TypeScript en frontmatter no se traduce** mediante este método: mantén el frontmatter compartido (incluyendo importaciones `t()` y arrays de datos) idéntico en las páginas en inglés y en los idiomas localizados, o vuelve a ejecutar `translate-docs` tras editar la página en inglés para que las copias localizadas reciban los cambios en el frontmatter. Para contenido exclusivo en frontmatter, utiliza la [canalización de cadenas de interfaz](#astro-website-ui-strings) en su lugar.

Consulta [`examples/astro-website`](../../docs/../examples/astro-website/) para ver la página de destino híbrida completa (HTML mediante `translate-docs`, etiquetas de pestañas de capturas mediante `t()` + `translate-ui`).

<a id="step-3-translate-ui-strings"></a>
### Paso 3: Traducir cadenas de interfaz

```bash
npx ai-i18n-tools translate-ui
```

Lee `strings.json`, envía lotes a OpenRouter para cada configuración regional de destino y escribe archivos JSON planos (`de.json`, `fr.json`, etc.) en `ui.flatOutputDir`. Cuando se establece `ui.preferredModel`, primero se intenta ese modelo antes que la lista ordenada en `openrouter.translationModels` (los comandos de traducción de documentos y otros siguen usando únicamente `openrouter`).

Por cada entrada, `translate-ui` almacena el **id del modelo OpenRouter** que tradujo correctamente cada configuración regional en un objeto opcional `models` (con las mismas claves de configuración regional que `translated`). Las cadenas editadas en el comando local `dashboard` se marcan con el valor centinela `user-edited` en `models` para esa configuración regional. Los archivos planos por configuración regional bajo `ui.flatOutputDir` siguen siendo únicamente **cadena fuente → traducción**; no incluyen `models` (por lo que los paquetes en tiempo de ejecución permanecen sin cambios).

> **Nota:** Si edita una entrada en el Panel de Traducción, debe ejecutar un `sync --force-update` (o el comando equivalente `translate` con `--force-update`) para volver a escribir los archivos de salida con la entrada actualizada de caché. Además, tenga en cuenta que si el texto fuente cambia más adelante, su edición manual se perderá porque se generará una nueva clave de caché (hash) para la nueva cadena fuente.

<a id="exporting-to-xliff-20-optional"></a>
### Exportar a XLIFF 2.0 (opcional)

Para entregar las cadenas de la interfaz a un proveedor de traducción, un sistema de gestión de traducción (TMS) o una herramienta CAT, exporta el catálogo como **XLIFF 2.0** (un archivo por configuración regional de destino). Este comando es **de solo lectura**: no modifica `strings.json` ni llama a ninguna API.

```bash
npx ai-i18n-tools export-ui-xliff
```

Por defecto, los archivos se escriben junto a `ui.stringsJson`, con nombres como `strings.de.xliff`, `strings.pt-BR.xliff` (nombre base de tu catálogo + configuración regional + `.xliff`). Usa `-o` / `--output-dir` para escribir en otra ubicación. Las traducciones existentes de `strings.json` aparecen en `<target>`; las configuraciones regionales faltantes usan `state="initial"` sin `<target>` para que las herramientas puedan completarlas. Usa `--untranslated-only` para exportar solo las unidades que aún necesitan traducción para cada configuración regional (útil para lotes enviados a proveedores). `--dry-run` muestra las rutas sin escribir archivos.

<a id="step-4-wire-i18next-at-runtime"></a>
### Paso 4: Integrar i18next en tiempo de ejecución

Crea tu archivo de configuración i18n usando los ayudantes exportados por `'ai-i18n-tools/runtime'`:

<details>
<summary>Ejemplo completo de inicialización i18n (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

#### Mantener alineado `SOURCE_LOCALE`

**Mantenga alineados tres valores:** `sourceLocale` en `ai-i18n-tools.config.json`, `SOURCE_LOCALE` en este archivo, y el JSON plano plural que `translate-ui` escribe como `{sourceLocale}.json` en su directorio de salida plano (habitualmente `public/locales/`). Use el mismo nombre base en el `import` estático (ejemplo anterior: `en-GB` → `en-GB.json`). El campo `lng` en `sourcePluralFlatBundle` debe ser igual a `SOURCE_LOCALE`. Las rutas de ES estáticas `import` no pueden usar variables; si cambia el idioma fuente, actualice `SOURCE_LOCALE` y la ruta de importación conjuntamente. Alternativamente, cargue ese archivo con un `import(\` dinámico ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, o `readFileSync` para que la ruta se construya a partir de `SOURCE_LOCALE`.

El fragmento usa `./locales/…` y `./public/locales/…` como si `i18n` estuviera junto a esas carpetas. Si su archivo está bajo `src/` (típico), use `../locales/…` y `../public/locales/…` para que las importaciones resuelvan a las mismas rutas que `ui.stringsJson`, `uiLanguagesPath` y `ui.flatOutputDir`.

Importa `i18n.js` antes de que React renderice (por ejemplo, al principio de tu punto de entrada). Cuando el usuario cambie el idioma, llama a `await loadLocale(code)` y luego a `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` se exporta para que cualquier otro archivo que lo necesite (por ejemplo, un selector de idioma) pueda importarlo directamente desde `'./i18n'`. Si estás migrando una configuración existente de i18next, reemplaza cualquier cadena de configuración regional fuente escrita directamente (por ejemplo, comprobaciones `'en-GB'` dispersas en los componentes) por importaciones de `SOURCE_LOCALE` desde tu archivo de inicialización de i18n.

Las importaciones nombradas (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funcionan igual si prefieres no usar la exportación por defecto.

#### Cargadores de configuración regional

Mantenga `localeLoaders` **alineado con la configuración** derivándolos de `ui-languages.json` usando `makeLocaleLoadersFromManifest` (esto filtra `SOURCE_LOCALE` usando la misma normalización que `makeLoadLocale`). Cuando añade una configuración regional a `targetLocales` y ejecuta `generate-ui-languages`, el manifiesto se actualiza y sus cargadores siguen automáticamente el cambio; no es necesario mantener un mapa codificado por separado.

Para paquetes JSON bajo `public/` (la configuración típica de Next.js), obtenga los datos desde su ruta URL pública:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Para CLIs en Node sin empaquetador, use `readFileSync` dentro de un pequeño ayudante que lea y analice el archivo JSON para cada código.

#### Referencia de ayudantes en tiempo de ejecución

`aiI18n.defaultI18nInitOptions(sourceLocale)` devuelve las opciones estándar para configuraciones con clave como valor por defecto:

- `parseMissingKeyHandler` devuelve la propia clave, por lo que las cadenas sin traducir muestran el texto fuente.
- `nsSeparator: false` permite claves que contienen dos puntos.
- `interpolation.escapeValue: false` — seguro desactivarlo: React escapa los valores por sí mismo, y la salida de Node.js/CLI no tiene HTML que escapar.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` es la conexión **recomendada** para proyectos ai-i18n-tools: aplica el recorte de claves + retroceso de interpolación de <code>"{{var}}"</code> en el idioma fuente (mismo comportamiento que el `wrapI18nWithKeyTrim` de nivel inferior), opcionalmente combina claves con sufijos plurales `translate-ui` `{sourceLocale}.json` mediante `addResourceBundle`, e instala luego `wrapT` consciente de plurales desde tu `strings.json`. Omite `sourcePluralFlatBundle` solo durante el arranque (incorpóralo una vez que `translate-ui` haya emitido `{sourceLocale}.json`). `wrapI18nWithKeyTrim` solo está **obsoleto** para código de aplicación — usa `setupKeyAsDefaultT` en su lugar.

`makeLoadLocale(i18n, loaders, sourceLocale)` devuelve una función `loadLocale(lang)` asíncrona que importa dinámicamente el paquete JSON para una configuración regional y lo registra con i18next.

<a id="using-t-in-source-code"></a>
### Usar `t()` en el código fuente

Llama a `t()` con una **cadena literal** para que el script de extracción pueda encontrarla:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

El mismo patrón funciona fuera de React (Node.js, componentes del servidor, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Reglas:**

- Solo se extraen estas formas: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- La clave debe ser una **cadena literal** — no se permiten variables ni expresiones como clave.
- No uses literales de plantilla para la clave: <code>{'t(`Hello ${name}`)'}</code> no es extraíble.

<a id="interpolation"></a>
### Interpolación

Usa la interpolación nativa del segundo argumento de i18next para los marcadores de posición <code>"{{var}}"</code>:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

El comando extract analiza el **segundo argumento** cuando es un objeto literal plano y lee banderas solo para herramientas como `plurals: true` y `zeroDigit` (véase **Plurales cardinales** más abajo). Para cadenas normales, solo se usa la clave literal para el hash; las opciones de interpolación aún se pasan a i18next en tiempo de ejecución.

Si tu proyecto usa una utilidad personalizada de interpolación (por ejemplo, llamando a `t('key')` y luego pasando el resultado por una función de plantilla como `interpolateTemplate(t('Hello {{name}}'), { name })`), `setupKeyAsDefaultT` (a través de `wrapI18nWithKeyTrim`) hace innecesaria dicha utilidad — aplica interpolación <code>"{{var}}"</code> incluso cuando el idioma fuente devuelve la clave sin procesar. Migrar los sitios de llamada a `t('Hello {{name}}', { name })` y eliminar la utilidad personalizada.

<a id="cardinal-plurals-plurals-true"></a>
### Plurales cardinales (`plurals: true`)

Use el **mismo literal** que desea como texto predeterminado para desarrolladores, y pase `plurals: true` para que extract + `translate-ui` traten la llamada como un **grupo plural cardinal** (formas estilo JSON v4 de i18next `_zero` … `_other`).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (opcional): solo para herramientas; **no** es leído por i18next. Cuando es `true`, las indicaciones prefieren un `0` árabe literal en la cadena `_zero` para cada configuración regional donde exista esa forma; cuando es `false` u omitido, se utiliza una redacción natural para el cero. Elimine estas claves antes de llamar a `i18next.t` (véase `wrapT` más abajo).

**Validación:** Si el mensaje contiene **dos o más** marcadores de posición `{{…}}` distintos, **uno de ellos debe ser** `{{count}}` (el eje plural). De lo contrario, `extract` **falla** con un mensaje claro indicando archivo/línea.

**Dos conteos independientes** (por ejemplo, secciones y páginas) no pueden compartir un mismo mensaje plural — usa **dos** llamadas a `t()` (cada una con `plurals: true` y su propio `count`) y concaténalas en la interfaz.

**No incluido en v1:** plurales ordinales (`_ordinal_*`, `ordinal: true`), plurales de intervalo, pipelines exclusivos de ICU.

#### Cómo se almacenan y emiten los plurales

**En** `strings.json` los grupos plurales usan **una fila por hash** con `"plural": true`, el literal original en `source` y `translated[locale]` como un objeto que asigna categorías cardinales (`zero`, `one`, `two`, `few`, `many`, `other`) a cadenas para esa configuración regional.

**JSON plano de configuración regional:** Las filas no plurales permanecen como **oración fuente → traducción**. Las filas plurales se emiten como `<groupId>_original` (igual a `source`, para referencia) y `<groupId>_<form>` para cada sufijo, de modo que i18next resuelva los plurales de forma nativa. `translate-ui` también escribe `{sourceLocale}.json` que contiene **solo** claves planas plurales (cargue este paquete para el idioma fuente para que las claves con sufijo se resuelvan; las cadenas simples siguen usando la clave como valor por defecto). Para cada configuración regional de destino, las claves de sufijo emitidas coinciden con `Intl.PluralRules` para esa configuración regional (`requiredCldrPluralForms`): si `strings.json` omitió una categoría porque coincidía con otra tras la compactación (por ejemplo, el `many` árabe igual que `other`), `translate-ui` aún escribe todos los sufijos requeridos en el archivo plano copiándolos desde una cadena de respaldo, para que la búsqueda en tiempo de ejecución nunca falte una clave.

Tiempo de ejecución (`ai-i18n-tools/runtime`): **Llame** a `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — ejecuta `wrapI18nWithKeyTrim`, registra el paquete plural opcional `translate-ui` `{sourceLocale}.json`, y luego `wrapT` usando `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` elimina `plurals` / `zeroDigit`, reescribe la clave al ID del grupo cuando sea necesario, y reenvía `count` (opcional: si hay un único marcador de posición no `{{count}}`, `count` se copia de esa opción numérica).

**Entornos antiguos:** `Intl.PluralRules` es necesario para las herramientas y para un comportamiento consistente; use polyfill si su objetivo son navegadores muy antiguos.

<a id="language-switcher-ui"></a>
### Interfaz de selector de idioma

Use el manifiesto `ui-languages.json` para crear un selector de idioma. `ai-i18n-tools` exporta dos ayudantes de visualización:

<details>
<summary>Componente LanguageSelect de ejemplo (React)</summary>

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

</details>

<br />

`getUILanguageLabel(lang, t)` - muestra `t(englishName)` cuando está traducido, o `englishName / t(englishName)` cuando ambos difieren. Adecuado para pantallas de configuración.

`getUILanguageLabelNative(lang)` - muestra `englishName / label` (sin llamada `t()` en cada fila). Adecuado para menús de cabecera donde desea que el nombre nativo sea visible.

El manifiesto `ui-languages.json` es un array JSON de entradas <code>"{ code, label, englishName, direction }"</code> (`direction` es `"ltr"` o `"rtl"`). Ejemplo:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

El manifiesto es generado por `generate-ui-languages` a partir de `sourceLocale` + `targetLocales` y el catálogo maestro incluido. Se escribe en `ui.flatOutputDir`. Si cambia cualquiera de las configuraciones regionales en la configuración, ejecute `generate-ui-languages` para actualizar el archivo `ui-languages.json`.

<a id="rtl-languages"></a>
### Idiomas RTL

`ai-i18n-tools` exporta `getTextDirection(lng)` y `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` establece `document.documentElement.dir` (navegador) o no hace nada (Node.js). Pase un argumento opcional `element` para dirigirse a un elemento específico.

Para cadenas que puedan contener flechas `→`, inviértalas en diseños RTL:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## Flujo de trabajo 2 - Traducción de documentos

Diseñado principalmente para documentación en **markdown, MDX y `.astro`** bajo `docs[].contentPaths`. En sitios Docusaurus, establezca `docs[].docusaurusCatalogDir` como la carpeta del catálogo `write-translations` (por ejemplo, `docs-site/i18n/en`) para que `translate-docs` también traduzca el JSON del entorno (barra de navegación, pie de página, cadenas del tema). Para imágenes PNG y otros recursos rasterizados incrustados en markdown, consulte [Imágenes y recursos rasterizados en documentos traducidos](#images-and-raster-assets-in-translated-docs). Para un bloque opcional de **selector de idioma** en README o documentación con `docsOutput.style = "flat"`, consulte [Selector de idioma (`languageListBlock`)](#language-list-block). Los archivos SVG se traducen mediante [`translate-svg`](#cli-reference) cuando `features.translateSVG` está habilitado — no mediante `docs[].contentPaths`. Los archivos JSON anidados arbitrarios de interfaz de usuario utilizan el flujo de trabajo 3 (`json[]` / `translate-json`), no `docs[]`.

<a id="step-1-initialise-for-documentation"></a>
### Paso 1: Inicializar para documentación

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Para sitios de documentación Astro Starlight:

```bash
npx ai-i18n-tools init -t ui-starlight
```

Para la interfaz de un sitio web Astro plano (sin Starlight):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

Esa plantilla habilita únicamente la extracción de interfaz. Para traducción de páginas HTML, también debe establecer `features.translateDocs` y añadir un bloque `docs[]` (véase [Páginas de sitios Astro (análisis y reemplazo)](#astro-website-parse-and-replace)). La configuración de [`examples/astro-website`](../../docs/../examples/astro-website/) muestra ambas canalizaciones juntas.

Edite el `ai-i18n-tools.config.json` generado:

- `sourceLocale` - idioma de origen (debe coincidir con `defaultLocale` en `docusaurus.config.js`).
- `targetLocales` - matriz de códigos de localización BCP-47 (por ejemplo, `["de", "fr", "es"]`).
- `cacheDir` - directorio compartido de caché SQLite para todas las canalizaciones (y directorio predeterminado de registros para `--write-logs`).
- `docs` - matriz de bloques de documentación. Cada bloque tiene `description`, `contentPaths` (cadena o matriz; archivo, directorio o patrón), `outputDir`, `docusaurusCatalogDir` opcional, `docsOutput`, `segmentSplitting` opcional, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - nota corta opcional para mantenedores. Cuando se establece, aparece en el encabezado `translate-docs` y en los encabezados de sección `status`.
- `docs[].contentPaths` - fuentes markdown/MDX/`.astro` (y opcionalmente `docusaurusCatalogDir` para el JSON del entorno de Docusaurus).
- `docs[].outputDir` - raíz de salida traducida para ese bloque.
- `docs[].docsOutput.style` - `"nested"` (por defecto), `"flat"`, `"doc-system"`, o alias `"docusaurus"` / `"astro-starlight"` (véase [Diseños de salida](#output-layouts)).

**Principal frente a complementario:** Enfóquese en `contentPaths` para páginas localizadas. Establezca `docusaurusCatalogDir` cuando también necesite el JSON del entorno de Docusaurus desde `write-translations`. Omita `docusaurusCatalogDir` si solo traduce páginas.

<a id="step-2-translate-documents"></a>
### Paso 2: Traducir documentos

```bash
npx ai-i18n-tools translate-docs
```

Esto traduce todos los archivos en `contentPaths` de cada bloque `docs[]` (y el JSON del catálogo de Docusaurus cuando `docusaurusCatalogDir` está establecido) a todos los idiomas de documentación efectivos. Los segmentos ya traducidos se sirven desde la caché SQLite — solo los segmentos nuevos o modificados se envían al LLM.

Para traducir un solo idioma:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Para comprobar qué necesita traducción:

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### Markdown complejo y verificaciones de calidad fallidas

`translate-docs` verifica que cada segmento traducido preserve la estructura de markdown (incluido el énfasis analizado desde el documento). Párrafos que acumulan muchos elementos `bold` alrededor de `` `inline code` ``, anidan comillas invertidas dentro de negritas (por ejemplo, literales de plantilla como `` `fetch(\`/locales/${code}.json\`)` ``), o entrelazan negritas y código en una oración larga son frágiles: algunas configuraciones regionales necesitan un orden de palabras diferente, lo cual puede alterar cómo coinciden `**` y `` ` `` tras la traducción y provocar errores en la CLI como `AST mismatch`.

**Si encuentra este tipo de fallo de validación, prefiera simplificar el texto del idioma fuente** — divida el párrafo, mueva un ejemplo a un bloque de código delimitado, o describa la misma idea con menos pares anidados de negritas/código — en lugar de esperar que cada modelo y configuración regional reproduzca perfectamente un marcado en línea denso. En otras partes de esta página (notablemente en las notas del Paso 4 sobre `SOURCE_LOCALE`, cargadores y rutas `public/`), el formato es intencionadamente realista; cuando reutilice redacciones similares en sus propios documentos, manténgalas más simples al traducir ampliamente.

Para ver **qué segmentos fallaron**, con qué frecuencia y los **mensajes de error o calidad** almacenados, utiliza la pestaña **Fallos** del Panel de Traducción ([Panel de Traducción → Fallos](#failures-document-translation)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Comportamiento de caché y banderas `translate-docs`

La CLI mantiene el **seguimiento de archivos** en SQLite (hash de origen por archivo × idioma) y filas de **segmentos** (hash × idioma por fragmento traducible). Una ejecución normal omite completamente un archivo cuando el hash registrado coincide con el origen actual **y** el archivo de salida ya existe; de lo contrario, procesa el archivo y utiliza la caché de segmentos para que el texto sin cambios no llame a la API.

| Bandera                         | Efecto                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(predeterminado)*              | Omite archivos sin cambios cuando la huella + la salida en disco coinciden; usa la caché de segmentos para el resto.                                                                                                                                                  |
| `-l, --locale <codes>`        | Idiomas de destino separados por comas (cuando se omite, los valores predeterminados coinciden con la unión del `targetLocales` raíz y el `targetLocales` opcional de cada bloque `documentations[]`).                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | Traduce únicamente markdown/JSON bajo esta ruta (relativa al proyecto, absoluta o patrón glob); `--file` es un alias para `--path`.                                                                                                                                 |
| `--dry-run`                   | Sin escritura de archivos ni llamadas a la API.                                                                                                                                                                                                                                        |
| `--type <kind>`               | Restringe a `markdown` o `json` (de lo contrario ambos cuando están habilitados en la configuración).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | Traduce solo archivos de etiquetas JSON, o salta JSON y traduce solo markdown.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | Número máximo de idiomas objetivo en paralelo (valor predeterminado desde la configuración o valor integrado por defecto en CLI).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | Número máximo de llamadas API por lotes en paralelo por archivo (documentos; valor predeterminado desde la configuración o CLI).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | Enmascara los marcadores de énfasis de markdown como marcadores temporales antes de la traducción (opcional; desactivado por defecto).                                                                                                                                                                              |
| `--debug-failed`              | Escribe registros detallados `FAILED-TRANSLATION` en `cacheDir` cuando la validación falla.                                                                                                                                                                                        |
| `--force-update`              | Vuelve a procesar cada archivo coincidente (extrae, reensambla y escribe salidas) incluso cuando el seguimiento de archivos lo omitiría. **La caché de segmentos sigue aplicándose** — los segmentos sin cambios no se envían al LLM.                                                                                    |
| `--force`                     | Borra el seguimiento de archivos para cada archivo procesado y **no lee** la caché de segmentos para la traducción API (retraducción completa). Los nuevos resultados aún se **escriben** en la caché de segmentos.                                                                                 |
| `--stats`                     | Muestra recuentos de segmentos, recuentos de archivos rastreados y totales de segmentos por idioma, luego finaliza.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | Elimina las traducciones en caché (y el seguimiento de archivos): todos los idiomas, o un solo idioma, luego finaliza.                                                                                                                                                                             |
| `--prompt-format <mode>`      | Cómo se envía cada **lote** de segmentos al modelo y se analiza (`xml`, `json-array`, o `json-object`). Por defecto `json-array`. No cambia la extracción, marcadores de posición, validación, caché ni el comportamiento de respaldo — véase [Formato de indicación por lotes](#batch-prompt-format). |

No puedes combinar `--force` con `--force-update` (son mutuamente excluyentes).

<a id="batch-prompt-format"></a>
#### Formato del prompt por lotes

`translate-docs` envía segmentos traducibles a OpenRouter en **lotes** (agrupados por `batchSize` / `maxBatchChars`). La bandera `--prompt-format` solo cambia el **formato de transmisión** de ese lote; los tokens `PlaceholderHandler`, las comprobaciones del AST de markdown, las claves de caché SQLite y el respaldo por segmento cuando falla el análisis del lote no cambian.

| Modo                   | Mensaje del usuario                                                           | Respuesta del modelo                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: un `<seg id="N">…</seg>` por segmento (con escape XML). | Solo bloques `<t id="N">…</t>`, uno por índice de segmento.       |
| `json-array` (por defecto) | Un array JSON de cadenas, una entrada por segmento en orden.               | Un array JSON de la **misma longitud** (mismo orden).           |
| `json-object`          | Un objeto JSON `{"0":"…","1":"…",…}` con clave por índice de segmento.            | Un objeto JSON con las **mismas claves** y valores traducidos. |

El encabezado de ejecución también imprime `Batch prompt format: …` para que pueda confirmar el modo activo. Los archivos de etiquetas JSON (`jsonSource`) y los lotes de archivos SVG usan la misma configuración cuando esos pasos se ejecutan como parte de `translate-docs` (o de la fase de documentación de `sync` — `sync` no expone esta bandera; por defecto toma el valor `json-array`).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Detección de segmentos duplicados y rutas en SQLite

> **Nota:** Esta sección cubre detalles internos de claves de caché útiles para depurar el comportamiento de `cleanup` o herramientas personalizadas. La mayoría de los usuarios pueden omitirla.

- Las filas de segmentos están indexadas globalmente por `(source_hash, locale)` (hash = contenido normalizado). Texto idéntico en dos archivos comparte una sola fila; `translations.filepath` es metadato (último escritor), no una segunda entrada de caché por archivo.
- `file_tracking.filepath` usa claves con espacio de nombres: `doc-block:{index}:{relPath}` por bloque `documentations` (`relPath` es una ruta posix relativa a la raíz del proyecto: rutas markdown tal como se recopilan; **los archivos JSON de etiquetas usan la ruta relativa al directorio de trabajo actual (cwd) del archivo fuente**, por ejemplo `docs-site/i18n/en/code.json`, para que la limpieza pueda resolver el archivo real), y `svg-files:{relPath}` para archivos SVG bajo `translate-svg`.
- `translations.filepath` almacena rutas posix relativas al directorio de trabajo actual para segmentos markdown, JSON y SVG (SVG usa la misma forma de ruta que otros recursos; el prefijo `svg-files:…` es **solo** para `file_tracking`).
- Después de una ejecución, `last_hit_at` se borra solo para filas de segmentos **en el mismo ámbito de traducción** (respetando `--path` y los tipos habilitados) que no fueron alcanzadas, por lo que una ejecución filtrada o solo de documentación no marca como obsoletos archivos no relacionados.

<a id="output-layouts"></a>
### Distribuciones de salida

`markdownOutput.style` controla dónde se escriben los archivos markdown traducidos. Usa los valores de cadena exactos a continuación en `documentations[].markdownOutput.style` (los alias son diseños predefinidos, no motores separados).

`markdownOutput.style = "nested"` (predeterminado cuando se omite) — refleja el árbol fuente bajo `{outputDir}/{locale}/` (por ejemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`markdownOutput.style = "doc-system"` — árbol de documentación con prefijo de idioma para sitios de documentación estática. Los archivos bajo `docsRoot` se escriben en `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`. Las rutas fuera de `docsRoot` vuelven al diseño anidado. Establece `documentations[].markdownOutput.docsRoot` como raíz de tu fuente en inglés (por ejemplo, `"docs"` o `"src/content/docs"`). Cuando `markdownOutput.style = "doc-system"`, debes establecer `localeSubpath` explícitamente (usa un alias a continuación para configuraciones preestablecidas).

**Alias** (mismo motor de diseño, valor preestablecido de `localeSubpath`):

- `markdownOutput.style = "docusaurus"` — `localeSubpath` por defecto es `docusaurus-plugin-content-docs/current` (diseño del complemento i18n de Docusaurus).
- `markdownOutput.style = "astro-starlight"` — `localeSubpath` por defecto es `""` (páginas traducidas directamente bajo `{outputDir}/{locale}/`, coincidiendo con [Starlight](https://starlight.astro.build/guides/i18n/) cuando el inglés está en la raíz del contenido y `outputDir` es igual a `docsRoot`).

Valor preestablecido de Docusaurus (páginas principales de documentación):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Valor preestablecido de Starlight (misma forma de bloque, rutas diferentes):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Etiquetas JSON opcionales — cadenas de la estructura Docusaurus de `jsonSource` (no el contenido del cuerpo MDX):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight incluye cadenas de IU para muchas configuraciones regionales; las sustituciones personalizadas opcionales de IU usan `src/content/i18n/en.json` con `jsonPathTemplate: "{outputDir}/{locale}.json"` en un bloque `documentations[]` separado cuando sea necesario.

`markdownOutput.style = "flat"` — coloca los archivos traducidos junto al origen con un sufijo de idioma, o en un subdirectorio. Los enlaces relativos entre páginas se reescriben automáticamente cuando `markdownOutput.style = "flat"` (a menos que `rewriteRelativeLinks: false` o un `pathTemplate` personalizado esté configurado).

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-markdownoutputstyle--flat"></a>
#### Enlaces de anclaje cuando `markdownOutput.style = "flat"`

Cuando `markdownOutput.style = "flat"`, la salida reescribe **rutas relativas** entre páginas para cada idioma (`guide.md` → `guide.de.md`). Los **enlaces de anclaje** — la forma habitual en markdown con un `#` después de la ruta — saltan a una sección dentro del archivo destino:

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

Aquí, el destino del enlace es `setup.md`, y `#first-run` es el anclaje: debería desplazarse al encabezado correcto dentro de ese archivo.

**Por qué los enlaces de anclaje requieren atención**

- `rewriteRelativeLinks` fija el **nombre de archivo** para cada idioma (`setup.md` → `setup.de.md`).
- Muchos renderizadores derivan el slug de `#` del **texto visible del encabezado**. Después de la traducción, los encabezados varían por idioma, por lo que un slug generado automáticamente puede cambiar mientras que el enlace reescrito aún diga `#first-run` — o su anclaje en inglés `#…` ya no coincida con el slug que el renderizador construye a partir del encabezado traducido.
- Resultado: los lectores llegan al **archivo** correcto pero a la **línea incorrecta**, o el navegador no encuentra ningún encabezado coincidente.

**Qué hacer**

1. Ejecuta `ai-i18n-tools write-heading-ids` en tu fuente `.md` / `.mdx` antes de `translate-docs` (mismo `documentations[]` / `contentPaths` que de costumbre). Inserta anclajes HTML explícitos en la línea anterior a cada encabezado, de modo que los valores `id` sean compartidos por cada copia traducida. Vuelve a ejecutarlo tras renombrar encabezados para actualizar los identificadores de anclaje obsoletos y que coincidan con el título actual.
2. Dirige tus **enlaces de anclaje** en markdown hacia esos identificadores estables, por ejemplo `[label](../../docs/other.md#section-id)`, donde `section-id` coincida con el anclaje escrito por la herramienta — no con una suposición basada solo en palabras en inglés.

**Ejemplo**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

`docs/security.md` después de `write-heading-ids` (simplificado):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

Después de `translate-docs`, las rutas de archivo y los anclajes `#…` permanecen alineados en cada archivo de idioma, por ejemplo:

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

El anclaje `#tls-configuration` es el mismo en todos los idiomas porque el `id` está fijo en el origen; solo se traducen el **texto** del encabezado y la **etiqueta** del enlace.

<a id="images-and-raster-assets-in-translated-docs"></a>
#### Imágenes y recursos raster en documentos traducidos

`translate-docs` traduce segmentos markdown, incluido el texto alternativo de imágenes. No copia archivos raster (PNG, JPEG, WebP, GIF) a tu `outputDir` de documentación. Debes colocar los archivos de captura de pantalla donde apunten las URL traducidas, o usar `postProcessing.regexAdjustments` para reescribir las rutas tras la traducción.

Para archivos SVG con texto traducible, usa el bloque `svg` y `translate-svg` — consulta [`svg`](#svg).

Consulta la [Guía de recursos por idioma](LOCALE-ASSETS-GUIDE.es.md) para obtener la guía completa de decisiones, todos los patrones con ejemplos de configuración y diseños de directorios, contratos de scripts de capturas, recomendaciones de diseño y errores comunes.

**Referencia rápida — cinco patrones**

| Patrón                      | Uso para                                               | Mecanismo                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — Raster compartido            | Imagen única, sin variantes por configuración regional                  | `regexAdjustments` fijo de ruta completa                  |
| B — Carpeta por configuración regional        | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/documentación | `regexAdjustments` intercambio de segmento de configuración regional            |
| C — Colocación con Docusaurus     | `markdownOutput.style = "docusaurus"` sitios | El script de captura coloca archivos; sin expresiones regulares          |
| D — SVG traducido           | Aplicaciones web que integran ilustraciones SVG                  | `translate-svg` con `svg.style = "flat"`         |
| E — SVG traducido colocado | `markdownOutput.style = "docusaurus"` documentación          | `translate-svg` con `svg.style = "nested"` + `pathTemplate` |

**El reescritor de enlaces plano y el flujo de dos pasos**

Cuando `markdownOutput.style = "flat"`, un reescritor integrado se ejecuta antes que `postProcessing`. Calcula el prefijo de profundidad por archivo de salida —la ruta relativa desde el directorio del archivo de salida hacia el directorio del archivo fuente— y lo antepone a las URL de recursos que no son markdown. `postProcessing` luego se ejecuta sobre la URL ya con prefijo —escriba patrones `search` que coincidan con el segmento de configuración regional dentro de ella, no con el prefijo inicial `../`.

Con `flatPreserveRelativeDir: true`, los archivos en subdirectorios obtienen un prefijo específico automáticamente. Por ejemplo, `docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md` genera un prefijo `../../docs/`, por lo que `translation-dashboard.png` (un archivo hermano del origen) se convierte en `../../docs/translation-dashboard.png` —resuelto correctamente sin necesidad de ninguna regla `postProcessing`.

Cuando `markdownOutput.style` es `"docusaurus"`, `"astro-starlight"`, `"nested"`, o cualquier valor distinto de `"flat"`, el reescritor de enlaces plano no se ejecuta. `postProcessing` ve la URL markdown original.

**Ejemplo del patrón A** — no se requiere configuración para recursos con rutas relativas junto a los archivos fuente cuando `markdownOutput.style = "flat"`. Las reglas del patrón A `postProcessing` solo son necesarias para recursos con URL absolutas (por ejemplo, `/img/...`) o reemplazos dirigidos a CDN.

**Ejemplo del patrón B — `markdownOutput.style = "flat"` README** (`examples/nextjs-app`, segundo bloque `documentations[]`)

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Use la forma genérica `[^/]+`, no una configuración regional fuente codificada, para que la regla siga funcionando si `sourceLocale` cambia en el futuro.

**Ejemplo del patrón B — `markdownOutput.style = "docusaurus"`** (`examples/nextjs-app`, primer bloque `documentations[]`)

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**Patrón C — Colocación con Docusaurus** (no se necesita `regexAdjustments`)

Coloque las capturas de pantalla en-GB en `static/assets/` y cree un enlace simbólico `docs/assets → ../static/assets`. El script `take-screenshots` escribe directamente las demás configuraciones regionales en `i18n/<locale>/…/current/assets/`. Todos los documentos en todas las configuraciones regionales hacen referencia a `../assets/name.png` —la ruta es estable y no se requiere reescritura de URL.

**Ejemplo del patrón D** (`examples/nextjs-app`, `svg.style = "flat"`)

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → archivos por configuración regional bajo `public/assets/`. La aplicación hace referencia por configuración regional: `<img src={`/assets/icon.${locale}.svg`} />`.

**Ejemplo mínimo solo con README** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` traduce `README.md` a `translated-docs/` únicamente con [postprocesamiento del selector de idioma](#language-list-block). No se definen reglas de imagen —apropiado cuando el README no tiene archivos raster hermanos o solo usa URLs absolutas que su alojamiento ya sirve.

Las plantillas de reemplazo admiten marcadores de posición como `${translatedLocale}` y `${translatedBasedir}` (lista completa en la fila `markdownOutput.postProcessing.regexAdjustments` en [Referencia de configuración](#configuration-reference)).

<a id="language-switcher-languagelistblock"></a>
#### Selector de idioma (`languageListBlock`)

Use `markdownOutput.postProcessing.languageListBlock` cuando los archivos markdown traducidos deban incluir una fila de enlaces **“Leer en otros idiomas”** —un enlace por configuración regional, con valores `href` calculados en relación con cada archivo de salida.

Este repositorio lo utiliza para [README.md](../README.es.md) y [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md). Después de `translate-docs`, cada copia traducida obtiene un bloque actualizado; por ejemplo, [translated-docs/docs/GETTING_STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) enlaza a los archivos de idioma hermanos bajo `translated-docs/docs/` y de vuelta al origen en inglés en `../../docs/GETTING_STARTED.md`.

**1. Marcar el bloque en el markdown fuente**

Envuelva el selector en HTML (o cualquier línea) delimitado por los marcadores de subcadena `start` y `end`. Este repositorio utiliza:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

El texto inicial del enlace es solo un marcador de posición. `translate-docs` reemplaza toda la sección desde la primera línea que contiene `start` hasta la primera línea posterior que contiene `end` (los marcadores dentro de bloques de código delimitados se ignoran, por lo que los ejemplos de configuración en el mismo archivo no coinciden).

**2. Configurar el bloque**

`start` y `end` son marcadores de subcadena arbitrarios — no tienen que ser `<small id="lang-list">` / `</small>`. Elija cualquier texto de apertura y cierre que aparezca únicamente en el fragmento del selector de idioma: otra etiqueta HTML (`<div class="lang-switcher">` … `</div>`), comentarios HTML (`<!-- lang-list -->` … `<!-- /lang-list -->`), o límites solo en markdown (por ejemplo, una línea `**Languages:**` hasta una línea `---`). Establezca `start` y `end` en la configuración para que coincidan exactamente con lo que puso en el archivo fuente.

Configuración raíz ([ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Campo       | Función                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Subcadena que identifica la línea de apertura del bloque                                                  |
| `end`       | Subcadena en la línea de cierre (puede ser la misma línea que `start` cuando ambos aparecen en una línea)             |
| `separator` | Texto entre los enlaces `[label](../../docs/href)` generados (este repositorio usa `" · "`)                                    |
| `label`     | Opcional: `"local"` (por defecto) usa el endónimo de cada idioma del manifiesto; `"english"` usa `englishName` |

**3. Qué ocurre en tiempo de ejecución**

1. **Extracción** — el fragmento de lista de idiomas **no** se envía al modelo (`translatable: false`).
2. **Por archivo traducido** — tras la traducción de segmentos y la reescritura opcional de enlaces planos, `postProcessing` reconstruye el bloque: un enlace markdown por idioma, con etiquetas de `ui-languages.json` cuando están presentes (si no, del catálogo maestro incluido, si no, `localeDisplayNames`), rutas relativas al archivo que se está escribiendo.
3. **Actualización del origen** — al final de un proceso `translate-docs` / `sync` para documentos, el mismo bloque canónico se vuelve a escribir en los **archivos fuente en inglés** en `contentPaths` para que al añadir un idioma se actualice el selector en el repositorio sin tener que editar manualmente cada enlace.

Si un archivo no tiene un bloque coincidente, la CLI registra una advertencia (cuando `--verbose`) y deja el contenido sin cambios.

**4. Manifiesto de etiquetas**

Para etiquetas en endónimo (`label: "local"`), genere o mantenga `ui-languages.json` mediante `generate-ui-languages` (ver [`uiLanguagesPath`](#uilanguagespath-optional)). La configuración de este repositorio, solo para documentos, no tiene una canalización de interfaz de usuario, por lo que las etiquetas provienen del catálogo maestro incluido para `sourceLocale` + `targetLocales`.

**5. Ejemplos en este repositorio**

| Ejemplo                            | Archivos                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Este paquete (documentos planos + subdirectorios) | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) (`markdownOutput.style = "flat"`), [README.md](../README.es.md), [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md), salidas en [translated-docs/](../../docs/../translated-docs/) |
| README mínimo solo                 | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json) (`markdownOutput.style = "flat"`), [examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| README plano + documentos Docusaurus      | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (segundo bloque: `markdownOutput.style = "flat"`; primer bloque: `markdownOutput.style = "docusaurus"`)                                                     |

La línea inmediatamente anterior a `<small id="lang-list">` (por ejemplo, `**Read in other languages:**`) es un segmento normal traducible y se localiza en cada configuración regional de destino; solo la fila del enlace dentro de los marcadores se regenera textualmente, aparte de `href` y las etiquetas controladas por el manifiesto.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### Marcadores `pathTemplate` / `jsonPathTemplate`

Anule la ubicación donde se escriben los archivos traducidos estableciendo `documentations[].markdownOutput.pathTemplate` (markdown y MDX) o `jsonPathTemplate` (archivos de etiquetas JSON). Ambos aceptan los mismos marcadores de posición. Las rutas resueltas deben permanecer dentro del `outputDir` de ese bloque (la CLI rechaza rutas que salgan de él).

Si utiliza un `pathTemplate` personalizado, `rewriteRelativeLinks` toma como valor predeterminado `false` a menos que lo establezca explícitamente; la reescritura de enlaces relativos está diseñada para funcionar con `markdownOutput.style = "flat"` sin necesidad de una plantilla personalizada.

Para diseños integrados (`nested`, `flat`, `doc-system` sin una plantilla personalizada), establezca `markdownOutput.localePathLowercase` en `true` para escribir segmentos de carpetas o nombres de archivo en minúsculas (por ejemplo, `pt-br` en lugar de `pt-BR`). El alias `astro-starlight` establece esto por defecto en `true`. Los valores personalizados de `pathTemplate` / `jsonPathTemplate` no cambian — use `{llocale}` allí cuando necesite segmentos en minúsculas manteniendo `{locale}` como BCP-47.

| Marcador de posición            | Función                                                                                                       | Ejemplo                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Ruta absoluta resuelta del `outputDir` de este bloque de documentación                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | Código del idioma de destino (mismo formato que en la configuración / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Mismo idioma en mayúsculas | `DE`, `PT-BR` |
| `{llocale}`            | Mismo idioma en minúsculas (coincide con las carpetas de rutas de Astro como `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}` | Ruta del archivo fuente relativa a la raíz del proyecto, formato POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Nombre del archivo **sin** extensión | `guide` para `docs/guide.md` |
| `{basename}` | Nombre de archivo **con** extensión | `guide.md` |
| `{extension}` | Extensión **incluyendo** el punto | `.md`, `.mdx` |
| `{docsRoot}` | Ruta absoluta resuelta de `markdownOutput.docsRoot` (por defecto `docs` si se omite) | `/home/acme/repo/docs` |
| `{relativeToDocsRoot}` | `{relPath}` con el prefijo `docsRoot` eliminado cuando las cadenas de ruta coinciden (POSIX); de lo contrario, sin cambios | `docs/guide.md` (común); `guide.md` solo cuando se aplica el recorte |

**Ejemplo**

Fragmento de configuración:

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Para la configuración regional `de` y la fuente `docs/guide.md`, con raíz del proyecto `/home/acme/repo` y `outputDir` resuelto a `/home/acme/repo/i18n`, la ruta expandida es:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Con `markdownOutput.style = "flat"` y sin un `pathTemplate` personalizado, un patrón común consiste en conservar únicamente el nombre del archivo mediante `{stem}` y `{extension}`, por ejemplo `{outputDir}/{stem}.{locale}{extension}`, lo que produce `…/guide.de.md` bajo el `outputDir` resuelto.

<a id="troubleshooting"></a>
### Solución de problemas

**Los enlaces de anclaje de sección no funcionan en los documentos traducidos**

Un enlace como `[label](../../docs/other.md#section-id)` puede abrir el archivo traducido correcto, pero no desplazarse hasta el encabezado deseado, o bien puede saltar a una sección incorrecta. El fragmento `#…` ya no coincide con ningún encabezado `id` en esa configuración regional.

Causas comunes:

- Los encabezados de origen nunca tuvieron identificadores de anclaje explícitos; el sitio genera los slugs a partir del texto visible del encabezado, que cambia tras la traducción.
- Ha cambiado el nombre de un encabezado en el origen, pero la línea `<a id="…"></a>` anterior falta o aún contiene el ID antiguo.
- Los enlaces de anclaje usan un fragmento `#…` adivinado a partir de palabras en inglés en lugar del ID que generaría `write-heading-ids`.

**Solución**

1. Ejecute `ai-i18n-tools write-heading-ids` en su `.md` de **origen** / `.mdx` (mismo `documentations[]` / `contentPaths` que `translate-docs`). Esto inserta `<a id="slug"></a>` antes de cada encabezado ATX, o actualiza un anclaje existente cuando el texto del encabezado ya no coincide con el slug actual.
2. Apunte los enlaces de anclaje a esos IDs, por ejemplo `[setup](../../docs/guide.md#first-run)`, donde `#first-run` coincida con la línea de anclaje situada encima del encabezado de destino, no con un slug inferido únicamente a partir del título en inglés.
3. Vuelva a ejecutar `translate-docs` (o `sync --force-update`) para que cada copia en cada configuración regional incluya las líneas de anclaje actualizadas.

Use `--dry-run` en `write-heading-ids` primero para previsualizar los cambios. Consulte [Enlaces de anclaje en diseño plano](#anchor-links-when-markdownoutputstyle--flat) para conocer el patrón completo.

---

<a id="combined-workflow-ui--docs"></a>
## Flujo de trabajo combinado (interfaz de usuario + documentación)

Habilite todas las características en una sola configuración para ejecutar ambos flujos de trabajo juntos:

<details>
<summary>Ejemplo de configuración combinada para interfaz y documentación</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "markdownOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` dirige la traducción de documentos al mismo catálogo `strings.json` que la interfaz de usuario para mantener la terminología consistente; `glossary.userGlossary` añade anulaciones CSV para términos del producto.

Ejecute `npx ai-i18n-tools sync` para ejecutar una canalización: cuando `features.translateUIStrings` está habilitado, primero **extrae** y luego **traduce** las cadenas de interfaz; opcionalmente **traduce SVG** (`features.translateSVG` + bloque `svg`); opcionalmente **traduce-json** (`features.translateJson` + `json[]`); y luego **traduce la documentación** (según esté configurado en `docs[]`). Omita partes con `--no-ui`, `--no-svg`, `--no-json` o `--no-docs`. El paso de documentación acepta `--dry-run`, `-p` / `--path`, `--force` y `--force-update` (los dos últimos solo aplican cuando se ejecuta la traducción de documentación; se ignoran si se pasa `--no-docs`).

Use `documentations[].targetLocales` en un bloque para traducir los archivos de ese bloque a un **subconjunto más pequeño** que la interfaz de usuario (las configuraciones regionales efectivas para la documentación son la **unión** entre bloques):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-markdownoutputstyle--docusaurus--flat"></a>
### Flujo de trabajo mixto de documentación (`markdownOutput.style = "docusaurus"` + `"flat"`)

Puede combinar varias canalizaciones de documentación en la misma configuración añadiendo más de una entrada en `documentations`. Esta es una configuración común cuando un proyecto tiene un sitio Docusaurus (`markdownOutput.style = "docusaurus"`) además de archivos markdown en el nivel raíz (por ejemplo, un archivo Léame del repositorio con `markdownOutput.style = "flat"`) que deben traducirse con nombres de archivo sufijados por configuración regional.

<details>
<summary>Ejemplo de configuración combinada de Docusaurus y README plano</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with markdownOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

Cómo se ejecuta esto con `npx ai-i18n-tools sync`:

- Las cadenas de interfaz de usuario se extraen y traducen desde `src/` hacia `public/locales/`.
- El primer bloque de documentación traduce **markdown** desde `docs-site/docs/` hacia `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (páginas de documentación localizadas).
- Con `features.translateJSON` y `jsonSource`, ese mismo bloque también traduce **JSON de estructura Docusaurus** ubicado en `docs-site/i18n/en/` a cada carpeta de configuración regional de destino: barra de navegación, pie de página y catálogos de temas y complementos, pero no el contenido del cuerpo MDX.
- El segundo bloque de documentación traduce `README.md` a archivos con sufijo regional bajo `translated-docs/` (`markdownOutput.style = "flat"`).
- Todos los bloques de documentación comparten `cacheDir`, por lo que los segmentos sin cambios se reutilizan entre ejecuciones para reducir llamadas a la API y costos.

---

<a id="translation-dashboard"></a>
## Panel de traducción

Ejecuta:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Esto inicia una interfaz web local respaldada por tu base de datos SQLite `cacheDir` configurada — la misma carpeta que la CLI usa para segmentos de documentación, registros y metadatos relacionados. Incluye las pestañas **Documentación** (segmentos de documentación en caché), **Cadenas de interfaz**, **Plurales de interfaz**, **Glosario**, **Errores**, **Problemas de Markdown** y **Estadísticas**.

![Translation Dashboard](../../docs/translation-dashboard.png)

Si **edita filas de caché** en esta aplicación (por ejemplo, segmentos de documentación), ejecute `sync --force-update` o el comando de traducción equivalente con `--force-update` para que las salidas en disco coincidan con el caché; si el **texto fuente** en el repositorio cambia más adelante, los hashes de los segmentos cambian y las ediciones manuales del texto anterior quedan obsoletas.

<a id="failures-document-translation"></a>
### Errores (traducción de documentos)

La pestaña **Fallos** es solo para la traducción de **documentación**. Lee los registros de fallos escritos en SQLite cuando un segmento no pudo traducirse correctamente para una configuración regional, por ejemplo, salida del modelo vacía o inválida, errores de validación posteriores a la traducción (`AST mismatch`, fugas de marcadores de posición y comprobaciones de **calidad** similares), o una condición **fatal** que bloqueó el progreso. Le ayuda a responder: *¿qué segmento de origen falló, para qué configuración regional y modelo, y qué texto de error se registró?*

<a id="when-to-use-it"></a>
#### Cuándo usarlo

- Después de que `translate-docs` o `sync` finalice con errores, configuraciones regionales parciales o registros confusos, puede ordenar y filtrar los fallos en lugar de desplazarse solo por la salida del terminal.
- Cuando desea **priorizar el trabajo de rehacer**: ordene por **# Fallos** para que los segmentos que fallaron repetidamente en varios intentos aparezcan primero; estos son candidatos fuertes para **simplificar o reformatear** en el markdown de origen, de modo que futuras ejecuciones tengan éxito.
- Cuando necesita el **segmento exacto** —ruta del archivo, indicación de línea, hash de origen y texto completo del origen— para editar el párrafo correcto en su repositorio.

<a id="why-source-edits-matter"></a>
#### Por qué son importantes las ediciones del origen

El marcado en línea denso (**negrita** mezclada con `` `code` ``, énfasis anidados, oraciones largas con muchos fragmentos) dificulta que los modelos devuelvan traducciones que aún pasen las comprobaciones estructurales. Los segmentos con **múltiples fallos registrados** suelen mejorar más si se **reescribe o divide** el origen (o se mueven ejemplos a bloques de código delimitados) que si se vuelve a ejecutar la traducción sobre texto sin cambios. Esto concuerda con [Markdown complejo y comprobaciones de calidad fallidas](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### Cómo usar la pestaña

1. Abra **Errores** en el panel (misma sesión del navegador que [Panel de traducción](#translation-dashboard)).
2. Lea la franja de **resumen** (segmentos con algún error, más recuentos de segmentos con **1**, **2** o **3+** registros de error).
3. Filtre por **nombre de archivo** parcial, **configuración regional**, **modelo**, **error de calidad** (los valores provienen de su caché), **solo errores fatales**, y opcionalmente por **hash de origen**, **texto de origen** o subcadena de **mensaje de error**; luego haga clic en **Aplicar**.
4. Elija **Ordenar: # de errores** (predeterminado) o **Ordenar: ruta de archivo + número de línea**.
5. Use la paginación en la parte superior o inferior de la tabla. **Haga clic en una fila** para alternar la visualización del texto completo de origen. El control de enlace en la fila (cuando está habilitado) solicita al servidor que registre pistas de archivo/línea en la **terminal** donde se está ejecutando `ai-i18n-tools dashboard`; útil para saltar desde el navegador a su editor.
6. Corrija el **archivo de origen** en su proyecto y luego vuelva a ejecutar `translate-docs` o `sync`. Si la lista parece **desactualizada** tras una ejecución exitosa, ejecute `ai-i18n-tools sync --force-update` y vuelva a cargar el panel (el panel Errores muestra la misma sugerencia).

Para depuración basada en archivos junto con la interfaz, aún puede usar `translate-docs --debug-failed` para escribir detalles de `FAILED-TRANSLATION` bajo `cacheDir` durante los reintentos — consulte [Comportamiento del caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Problemas de Markdown (comprobaciones estáticas)

La pestaña **Problemas de Markdown** enumera filas de la tabla `markdown_source_issues` de SQLite. Cada fila es un hallazgo **previo a la traducción**: por ejemplo, secuencias de delimitadores que nunca se emparejan como énfasis/tachado bajo las mismas reglas estilo CommonMark que `translate-docs` usa para enmascarar, un fragmento de código en línea abierto con comillas invertidas pero nunca cerrado, `STRONG_OUTSIDE_INLINE_CODE` cuando `**` / `__` envuelven un fragmento `` `...` `` (coloca el énfasis dentro de las comillas invertidas o usa código plano), o `STRONG_OUTSIDE_LINK` cuando `**` / `__` envuelven un enlace `[text](../../docs/url)` (coloca el negrita solo dentro del texto del enlace). Esto **no** es lo mismo que **Errores**, que registra la salida del modelo por configuración regional y problemas de validación posteriores a la traducción (`AST mismatch`, fugas de marcadores de posición y similares).

Utilice esta pestaña cuando desee corregir el **markdown fuente** antes de consumir tokens, especialmente cuando las comprobaciones de calidad fallen repetidamente en la estructura. Filtre por ruta de archivo (coincidencia parcial con la clave de caché, incluyendo prefijos `doc-block:{index}:`), **código de problema** o **hash fuente**; ordene por ruta de archivo + línea o por la hora más reciente de escaneo. El botón de enlace registra sugerencias de archivo/línea en la terminal donde se está ejecutando `ai-i18n-tools dashboard` (misma idea que en la pestaña Documentación).

**Actualizar filas:** ejecute `ai-i18n-tools check-markdown` (opcional ámbito `-p` / `--path`, `--no-cache` para omitir SQLite, `--json` para obtener salida legible por máquina en stdout con líneas legibles por humanos en stderr). De forma predeterminada, cada ejecución de `translate-docs` en un archivo markdown vuelve a escanear y reemplaza las filas para ese archivo cuando `documentations[].warnMarkdownSourceIssues` no está establecido en `false`. Borrar todas las traducciones para una ruta de archivo en caché elimina también las filas de problemas de Markdown para esa ruta como parte del mismo proceso de limpieza que los errores.

---

<a id="configuration-reference"></a>
## Referencia de configuración

<a id="sourcelocale"></a>
### `sourceLocale`

Código BCP-47 para el idioma de origen (por ejemplo, `"en-GB"`, `"en"`, `"pt-BR"`). No se genera ningún archivo de traducción para esta configuración regional — la propia cadena clave es el texto fuente.

**Debe coincidir** con `SOURCE_LOCALE` exportado desde su archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Matriz de códigos de configuración regional BCP-47 a los que traducir (por ejemplo, `["de", "fr", "es", "pt-BR"]`).

`targetLocales` es la lista principal de configuraciones regionales para la traducción de la interfaz de usuario y la lista predeterminada para bloques de documentación. Usa `generate-ui-languages` para generar el manifiesto `ui-languages.json` a partir de `sourceLocale` + `targetLocales`.

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (opcional)

Ruta al manifiesto `ui-languages.json` utilizado para nombres mostrados, filtrado por configuración regional y postprocesamiento de listas de idiomas. Si se omite, la CLI busca el manifiesto en `ui.flatOutputDir/ui-languages.json`.

Utiliza esto cuando:

- El manifiesto está fuera de `ui.flatOutputDir` y debe indicar explícitamente al CLI su ubicación.
- Desea que el [posprocesado del selector de idioma](#language-list-block) (`languageListBlock`) genere etiquetas de idioma a partir del manifiesto.
- `extract` debe fusionar entradas `englishName` del manifiesto en `strings.json` (requiere `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (opcional)

Número máximo de **configuraciones regionales destino** traducidas simultáneamente (`translate-ui`, `translate-docs`, `translate-svg` y los pasos correspondientes dentro de `sync`). Si se omite, la CLI usa **4** para traducción de interfaz de usuario y **3** para traducción de documentación (valores predeterminados integrados). Puedes anularlo por ejecución con `-j` / `--concurrency`.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (opcional)

**translate-docs** y **translate-svg** (y el paso de documentación de `sync`): número máximo de solicitudes por lotes (**batch**) paralelas a OpenRouter por archivo (cada lote puede contener muchos segmentos). Valor predeterminado: **4** si se omite. Ignorado por `translate-ui`. Anulable con `-b` / `--batch-concurrency`. En `sync`, `-b` se aplica solo al paso de traducción de documentación.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (opcional)

Número máximo de archivos procesados simultáneamente **dentro de una sola configuración regional** durante `translate-docs` y `sync`. Cuando se establece en un valor mayor que **1**, los archivos dentro de la misma configuración regional se procesan en paralelo usando un semáforo para controlar el uso de memoria. Valor predeterminado **1** (procesamiento secuencial) si se omite. Valores más altos pueden mejorar significativamente el rendimiento en operaciones limitadas por E/S, especialmente cuando todos los segmentos ya están en caché (sin necesidad de llamadas a la API).

**Ejemplo:**

```json
{
  "fileConcurrency": 4
}
```

**Caso de uso:** Establezca esto en `2-4` al ejecutar `sync --force-update` con aciertos del 100 % en la caché para reducir el tiempo total de procesamiento. La mejora es más notable con muchos archivos pequeños.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (opcional)

Lotes de segmentos para traducción de documentos: número de segmentos por solicitud a la API y límite máximo de caracteres. Valores predeterminados: **20** segmentos, **4096** caracteres (cuando se omiten).

<a id="openrouter"></a>
### `openrouter`

- `baseUrl`
  URL base de la API OpenRouter. Valor predeterminado: `https://openrouter.ai/api/v1`.
- `translationModels`
  Lista ordenada preferida de IDs de modelos. Se intenta primero el primero; las entradas posteriores son alternativas en caso de error. Solo para `translate-ui`, también puedes establecer `ui.preferredModel` para probar un modelo antes de esta lista (ver `ui`).
- `defaultModel`
  Modelo principal único heredado. Se usa solo cuando `translationModels` no está establecido o está vacío.
- `fallbackModel`
  Modelo de respaldo único heredado. Se usa después de `defaultModel` cuando `translationModels` no está establecido o está vacío.
- `maxTokens`
  Número máximo de tokens de finalización por solicitud. Valor predeterminado: `8192`.
- `temperature`
  Temperatura de muestreo. Valor predeterminado: `0.2`.
- `requestTimeoutMs`
  Tiempo máximo en milisegundos para esperar cada solicitud HTTP a OpenRouter (completados de chat y llamadas internas `GET /models`). Valor predeterminado: `30000` (30 segundos).

**Por qué usar múltiples modelos:** Diferentes proveedores y modelos tienen costos variables y ofrecen distintos niveles de calidad según los idiomas y configuraciones regionales. Configura `openrouter.translationModels` **como una cadena ordenada de respaldo** (en lugar de un solo modelo), para que la CLI pueda intentar el siguiente modelo si falla una solicitud.

Considera la lista siguiente como una **base** que puedes ampliar: si la traducción para una configuración regional específica es deficiente o falla, investiga qué modelos admiten bien ese idioma o escritura (consulta recursos en línea o la documentación de tu proveedor) y añade esos IDs de OpenRouter como alternativas adicionales.

Esta lista fue **probada para una amplia cobertura de localidades** en un gran proyecto de documentación con 36 localidades objetivo; sirve como valor predeterminado práctico, pero no se garantiza que funcione bien en todas las localidades.

Ejemplo `translationModels` (mismos valores predeterminados que `npx ai-i18n-tools init`):

<details>
<summary>Lista predeterminada de alternativas para translationModels</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

Establezca `OPENROUTER_API_KEY` en su entorno o en el archivo `.env`.

Antes de cambiar `translationModels`, ejecute `npx ai-i18n-tools check-models` para verificar cada ID de modelo configurado contra el catálogo en vivo de OpenRouter (`GET /models`). Este informa los ID que faltan o que han expirado `expiration_date`, lista los modelos válidos con precios estimados de entrada/salida (USD por cada 1 millón de tokens) y finaliza con un estado distinto de cero cuando algún ID configurado no es válido. Requiere `OPENROUTER_API_KEY`.

<a id="features"></a>
### `features`

| Campo                | Flujo de trabajo | Descripción                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | Extraer `t("…")` / `i18n.t("…")` en `strings.json`, luego traducir entradas y escribir JSON plano por configuración regional (la extracción se ejecuta automáticamente; usar `extract` independiente para actualizar solo el catálogo). |
| `translateDocs`      | 2        | Traducir páginas `.md` / `.mdx` / `.astro`; JSON del shell de Docusaurus cuando `docs[].docusaurusCatalogDir` está definido.                                                         |
| `translateJson`      | 3        | JSON anidado arbitrario bajo `json[]` (`translate-json`).                                                                                                           |
| `translateSVG`       | —        | Traducir archivos `.svg` (requiere el bloque `svg` de nivel superior).                                                                                                       |

**Traduce** archivos SVG con `translate-svg` cuando `features.translateSVG` es verdadero y se configura un bloque superior `svg`. El comando `sync` ejecuta ese paso cuando ambos están establecidos (a menos que `--no-svg`).

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  Directorios o patrones glob (relativos al directorio actual) escaneados en busca de llamadas a `t("…")`. Admite patrones como `src/` o `["src/**/*.ts"]`.
- `stringsJson`  
  Ruta al archivo del catálogo maestro. Actualizado por `extract`.
- `flatOutputDir`  
  Directorio donde se escriben los archivos JSON por idioma (`de.json`, etc.).
- `preferredModel`  
  Opcional. ID del modelo OpenRouter que se intenta primero solo para `translate-ui`; luego `openrouter.translationModels` (o modelos antiguos) en orden, sin duplicar este ID.
- `uiExtractor.funcNames` (o `reactExtractor.funcNames` heredado)  
  Nombres adicionales de funciones para escanear (predeterminado: `["t", "i18n.t"]`).
- `uiExtractor.extensions` (o `reactExtractor.extensions` heredado)  
  Extensiones de archivo a incluir (predeterminado: `[".js", ".jsx", ".ts", ".tsx"]`). Añade `.astro` para frontmatter de Astro y expresiones de plantilla.
- `uiExtractor.includePackageDescription` (o `reactExtractor.includePackageDescription` heredado)  
  Cuando está `true` (predeterminado), `extract` también incluye `package.json` `description` como cadena de interfaz cuando está presente.
- `uiExtractor.packageJsonPath` (o `reactExtractor.packageJsonPath` heredado)  
  Ruta personalizada al archivo `package.json` utilizado para la extracción opcional de descripciones.
- `uiExtractor.includeUiLanguageEnglishNames` (o `reactExtractor.includeUiLanguageEnglishNames` heredado)

Cuando `true` (predeterminado `false`), `extract` también agrega cada `englishName` del manifiesto en `uiLanguagesPath` a `strings.json` cuando no está ya presente en el escaneo del código fuente (mismas claves de hash). Requiere `uiLanguagesPath` apuntando a un `ui-languages.json` válido.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
Directorio de caché SQLite (compartido por todos los bloques `documentations`). Reutilizado entre ejecuciones. Si estás migrando desde una caché personalizada de traducción de documentos, archívala o elimínala — `cacheDir` crea su propia base de datos SQLite y no es compatible con otros esquemas.

<a id="best-practice-for-git-exclusions"></a>
#### Mejor práctica para exclusiones en git:

- Excluya el contenido de la carpeta de caché de traducción (por ejemplo, usando `.gitignore` o `.git/info/exclude`) para evitar confirmar artefactos temporales de caché.
- Mantenga `cache.db` (no eliminarlo habitualmente), ya que conservar la caché SQLite evita volver a traducir segmentos sin cambios. Esto ahorra tiempo de ejecución y costos de API al actualizar o modificar software que usa `ai-i18n-tools`.
- Excluya archivos temporales y de registro para evitar confirmar archivos de respaldo y depuración.

<br/>

**Ejemplo:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="documentations"></a>
### `documentations`

Matriz de bloques de la canalización de documentación. `translate-docs` y la fase de documentación de `sync` **procesan cada** bloque en orden.

**Fuentes de contenido**

- `description`
Nota opcional legible para humanos para este bloque (no se usa para traducción). Se antepone al encabezado `translate-docs` `🌐` cuando se establece; también se muestra en los encabezados de sección `status`.
- `contentPaths`
Cuerpos de páginas Markdown/MDX y plantillas `.astro` a traducir (`translate-docs` escanea estos en busca de `.md`, `.mdx` y `.astro`). Admite **rutas de directorio o patrones globales** (por ejemplo, `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). De ahí proviene el contenido de documentación localizado.
- `sourceFiles`
Alias opcional que se fusiona en `contentPaths` al cargar.
- `targetLocales`
Subconjunto opcional de localizaciones solo para este bloque (en caso contrario, se usa `targetLocales` raíz). Los idiomas de documentación efectivos son la unión entre todos los bloques.
- `jsonSource`
Opcional. Directorio fuente para catálogos de etiquetas JSON de Docusaurus para este bloque (por ejemplo, `"i18n/en"` de `docusaurus write-translations`). Los cuerpos de página siempre provienen de `contentPaths`; `jsonSource` solo proporciona JSON de interfaz/estructura, no MDX.

**Estructura de salida**

- `outputDir`
Directorio raíz para la salida traducida de este bloque.
- `markdownOutput.style`
`"nested"` (por defecto), `"flat"`, `"doc-system"`, o alias `"docusaurus"` / `"astro-starlight"`.
- `markdownOutput.localeSubpath`
Segmento de ruta entre `{locale}/` y `{relativeToDocsRoot}` para `doc-system` (obligatorio al usar `style: "doc-system"` directamente; preestablecido al usar un alias). Use `""` para carpetas de localidad al estilo Starlight.
- `markdownOutput.docsRoot`
Raíz de documentación fuente para el diseño de Docusaurus (por ejemplo, `"docs"`).
- `markdownOutput.pathTemplate`
Ruta de salida personalizada para markdown. Marcadores de posición: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `markdownOutput.jsonPathTemplate`
Ruta de salida personalizada en formato JSON para archivos de etiquetas. Admite los mismos marcadores de posición que `pathTemplate`.
- `markdownOutput.localePathLowercase`
Cuando es `true`, los diseños de salida integrados (`nested`, `flat`, `doc-system` sin `pathTemplate`) usan segmentos de idioma en minúsculas en las rutas. Valor predeterminado `false`; `astro-starlight` y `doc-system` con `localeSubpath` vacío pasan a `true` al cargar la configuración.
- `markdownOutput.flatPreserveRelativeDir`
Cuando es `markdownOutput.style = "flat"`, se mantienen los subdirectorios de origen para que los archivos con el mismo nombre base no entren en conflicto.
- `markdownOutput.rewriteRelativeLinks`
Reescribir enlaces relativos tras la traducción (activado automáticamente cuando `markdownOutput.style = "flat"` y no hay `pathTemplate` personalizado).
- `markdownOutput.linkRewriteDocsRoot`
Raíz del repositorio utilizada al calcular los prefijos de reescritura de enlaces planos. Por lo general, déjelo como `"."`, a menos que sus documentos traducidos estén bajo una raíz de proyecto diferente.

**Posprocesado**

- `markdownOutput.postProcessing`
Transformaciones opcionales en el **cuerpo markdown traducido** (se conservan las claves YAML y los valores no textuales del front matter). Se ejecuta tras la recombinación de segmentos y la reescritura de enlaces planos, y antes de `addFrontmatter`.
- `markdownOutput.postProcessing.regexAdjustments`
Lista ordenada de `{ "description"?, "search", "replace" }`. `search` es un patrón regex (una cadena simple usa la bandera `g`, o `/pattern/flags`). `replace` admite marcadores de posición como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
- `markdownOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — regenera una fila limitada de enlaces "leer en otros idiomas" en el markdown fuente y traducido. Consulte [Selector de idioma (`languageListBlock`)](#language-list-block) para configuración, comportamiento y ejemplos de repositorios.

**Comportamiento y metadatos**

- `translateFrontmatterFields`
Mismo nivel que `markdownOutput` (por bloque `documentations[]`). Valor predeterminado `true`: traduce el texto YAML orientado al usuario para Starlight/Docusaurus (etiquetas `title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next`). Establece `false` para mantener sin cambios todo el bloque de front matter; pasa un array de cadenas para restringirlo a rutas específicas con puntos.
- `segmentSplitting`
Mismo nivel que `markdownOutput` (por bloque `documentations[]`). Segmentos opcionales más detallados para la extracción de `translate-docs`: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. Cuando `enabled` es `true` (valor predeterminado cuando se omite `segmentSplitting`), se dividen párrafos densos, tablas GFM con barras (el primer fragmento incluye encabezado, separador y primera fila de datos) y listas largas; las subpartes se vuelven a unir con saltos de línea simples (`tightJoinPrevious`). Establece `"enabled": false` para usar un segmento por bloque del cuerpo delimitado por líneas en blanco únicamente.
- `warnMarkdownSourceIssues`
Cuando `true` (valor predeterminado al omitirse), cada ejecución de `translate-docs` vuelve a escanear los segmentos markdown en busca de delimitadores riesgosos o código en línea sin cerrar, muestra advertencias en la terminal y reemplaza las filas `markdown_source_issues` para la ruta de caché del archivo. Establece `false` para omitir advertencias y actualizaciones de SQLite para este bloque.
- `addFrontmatter`
Cuando `true` (valor predeterminado al omitirse), los archivos markdown traducidos incluyen claves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, y cuando al menos un segmento tiene metadatos del modelo, `translation_models` (lista ordenada de identificadores de modelos de OpenRouter utilizados). Establece en `false` para omitir.

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
Opcional. Nombres adicionales de atributos JSX/HTML cuyos **valores de cadena entre comillas** no deben enviarse al traductor. Se fusionan con los valores predeterminados integrados (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, la mayoría de `aria-*`, etc.). No distingue entre mayúsculas y minúsculas. Se aplica a:

- `.astro` extracción de parseo y reemplazo (etiquetas HTML estáticas y literales de cadena después de `attr=` dentro de bloques `{expression}`).
  - Extracción de marcadores de posición MDX durante la traducción de segmentos markdown/Astro (`label`, `tooltip`, y `aria-label` en etiquetas JSX en mayúsculas, además de `TabItem` `value` cuando sea aplicable).

Ejemplo: `"protectAttributes": ["variant", "size"]` mantiene `variant="primary"` dentro de `{items.map(...)}` sin cambios en todos los idiomas.

También puedes incluir atributos normalmente traducibles (por ejemplo `"title"` o `"aria-label"`) cuando desees que esos valores se copien textualmente del inglés.

- `protectKeys`
Opcional. Nombres adicionales de **propiedades de objeto** cuyos valores entre comillas no deben traducirse dentro de bloques de plantilla `{expression}` y literales de objeto MDX (por ejemplo `label:` dentro de `<Tabs values={[ … ]}>`). Se combina con los valores predeterminados integrados (`class`, `key`, `id`, `href`, `src`, etc.). No distingue entre mayúsculas y minúsculas.

Ejemplo: `"protectKeys": ["slug", "code"]` omite `{ slug: 'getting-started', title: 'Getting started' }` → solo se traduce `title` cuando `slug` está protegido.

<br/>

**Ejemplo (`markdownOutput.style = "flat"` — rutas de capturas de pantalla + contenedor opcional de lista de idiomas):**

<details>
<summary>Ejemplo de postprocesamiento con diseño plano (capturas de pantalla + bloque de lista de idiomas)</summary>

```json
"markdownOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="svg"></a>
### `svg`

Rutas y estructura de nivel superior para archivos SVG. La traducción solo se ejecuta cuando `features.translateSVG` es verdadero (mediante `translate-svg` o la etapa SVG de `sync`).

| Campo            | Descripción                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | Uno o más directorios **o patrones globales** (por ejemplo, `"images/*.svg"`, `"**/icons/*.svg"`). Los patrones se resuelven respecto a la raíz del proyecto y se escanean recursivamente en busca de archivos `.svg`.                                                                         |
| `outputDir`                   | Directorio raíz para la salida SVG traducida.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` o `"nested"` cuando `pathTemplate` no está definido.                                                                                                                                                                                                                               |
| `pathTemplate`   | Ruta de salida personalizada para SVG. Marcadores de posición: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `localePathLowercase` | Cuando es `true`, los diseños integrados de SVG `flat` / `nested` usan segmentos de idioma en minúsculas. Los valores personalizados de `pathTemplate` no cambian; use `{llocale}` para segmentos en minúsculas. |
| `forceLowercase` | Texto traducido en minúsculas durante la reensamblaje SVG. Útil para diseños que dependen de etiquetas completamente en minúsculas.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Campo          | Descripción                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Ruta a `strings.json` - crea automáticamente un glosario a partir de traducciones existentes.                                                                                                 |
| `userGlossary` | Ruta a un archivo CSV con columnas `Original language string` (o `en`), `locale`, `Translation` - una fila por término fuente y configuración regional objetivo (`locale` puede ser `*` para todos los destinos). |

**Genere un archivo CSV de glosario vacío:**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## Referencia de la CLI

| Comando                                                                                                    | Descripción                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                                  | Muestra la versión de la CLI y la marca de tiempo de compilación (la misma información que `-V` / `--version` en el programa raíz).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website] [-o path] [--with-translate-ignore]` | Escribe un archivo de configuración inicial (incluye `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` y `documentations[].addFrontmatter`). `--with-translate-ignore` crea un `.translate-ignore` inicial. |
| `check-models`                                                                           | Valida cada ID de modelo configurado de OpenRouter frente a `GET /models` (pertenencia al catálogo, `expiration_date`, USD por cada millón de tokens para indicación/completado). Requiere `OPENROUTER_API_KEY`. Finaliza con código distinto de cero si algún ID configurado falta o ha expirado. Respeta `openrouter.requestTimeoutMs` para la solicitud del catálogo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `extract`                                                                                                  | Actualizar `strings.json` a partir de literales `t("…")` / `i18n.t("…")`, descripción opcional `package.json` y entradas opcionales `englishName` del manifiesto (ver `ui.reactExtractor`). Requiere `ui.sourceRoots` no vacío.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `generate-ui-languages [--master <path>] [--dry-run]`                                    | Escribe `ui-languages.json` en `ui.flatOutputDir` (o en `uiLanguagesPath` si está establecido) usando `sourceLocale` + `targetLocales` y el `data/ui-languages-complete.json` incluido (o `--master`). Emite advertencias y marcadores `TODO` para configuraciones regionales que falten en el archivo maestro. Si ya tienes un manifiesto con valores personalizados de `label` o `englishName`, estos serán reemplazados por los valores predeterminados del catálogo maestro; revisa y ajusta el archivo generado después.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                       | Traduce markdown/MDX y JSON para cada bloque `documentations` (`contentPaths`, `jsonSource` opcional). `-j`: número máximo de configuraciones regionales en paralelo; `-b`: número máximo de llamadas API por lotes en paralelo por archivo. `--prompt-format`: formato de transmisión por lotes (`xml` \| `json-array` \| `json-object`). Consulta [Comportamiento de caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags) y [Formato del lote de prompts](#batch-prompt-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …`                                                                    | Requiere al menos un bloque `documentations[]`. Recopila `.md` / `.mdx` bajo el `contentPaths` de cada bloque (respeta `.translate-ignore`). Inserta una línea de anclaje HTML `<a id="slug"></a>` inmediatamente **antes** de cada encabezado ATX plano (`#`) (omite encabezados dentro de bloques de código con bordes); cuando ya existe una línea de anclaje, actualiza el `id` si ya no coincide con el slug derivado del texto del encabezado actual. `-p` / `--path` o `-f` / `--file`: limita a un archivo o directorio relativo al proyecto. `--slug-style`: `github` (predeterminado; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Con `pymdown`, `--pymdown-case` opcional, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run`: muestra solo los cambios.                                                                                                                                                                                                                                                                                                                                    |
| `strip-md-bold-inline …`                                                                 | Requiere al menos un bloque `documentations[]`. Elimina los `**` alrededor del código en línea en `.md` / `.mdx` bajo el `contentPaths` de cada bloque (respeta `.translate-ignore`). `-p` / `--path` o `-f` / `--file`, `--dry-run`, `--no-backup` (omite `.backup.*` con marca de tiempo antes de sobrescribir).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `check-markdown …`                                                                       | Analiza el markdown/MDX bajo el `documentations[]` de cada bloque `contentPaths` (igual descubrimiento que `translate-docs`, respeta `.translate-ignore`): emparejamiento de delimitadores, código en línea sin cerrar, y `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK` cuando `**`/`__` envuelven un fragmento `` `...` `` o un enlace `[text](../../docs/url)`. `-p` / `--path` o `-f` / `--file`: ámbito opcional. Imprime líneas `relativePath:line: [ISSUE_CODE] message` en **stderr**; código de salida **1** si hay algún problema. `--json`: informe JSON en **stdout**. Escribe `markdown_source_issues` en `cacheDir` a menos que `--no-cache`. `-v` añade hashes de origen a las líneas de stderr.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                        | Traduce archivos SVG configurados en `config.svg` (separado de la documentación). Requiere `features.translateSVG`. Mismas ideas de caché que en la documentación; admite `--no-cache` para omitir lecturas/escrituras de SQLite en esa ejecución. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                               | Traduce solo cadenas de interfaz de usuario (`strings.json` → JSON de configuración regional). `-l` / `--locale`: configuraciones regionales de destino separadas por comas (predeterminado del archivo de configuración / `ui-languages.json`). `--force`: vuelve a traducir todas las entradas por configuración regional (ignora traducciones existentes). `--dry-run`: sin escrituras, sin llamadas a API. `-j`: número máximo de configuraciones regionales en paralelo. Requiere `features.translateUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                      | Extraer y luego traducir cadenas de interfaz (requiere `features.translateUIStrings`). Solo interfaz — sin documentación ni SVG. Mismas opciones `-l`, `--force`, `--dry-run` y `-j` que `translate-ui`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                      | Ejecuta `extract` **primero** (requiere `features.translateUIStrings`) para que `strings.json` coincida con el origen, luego revisión mediante LLM de las cadenas de interfaz de usuario en **origen-idioma** (ortografía, gramática). Las **sugerencias de terminología** provienen únicamente del archivo CSV `glossary.userGlossary` (mismo alcance que `translate-ui` —no `strings.json` / `uiGlossary`—, para no reforzar copias incorrectas como glosario). Usa OpenRouter (`OPENROUTER_API_KEY`). Solo orientativo (sale con código **0** al finalizar la ejecución). Genera `lint-source-results_<timestamp>.log` dentro de `cacheDir` como informe **legible por humanos** (resumen, problemas y filas **OK** por cadena); la terminal muestra solo recuentos del resumen y problemas (sin líneas `[ok]` por cadena). Imprime el nombre del archivo de registro en la última línea. `--json`: informe JSON completo y legible por máquina solo en stdout (el archivo de registro permanece legible por humanos). `--dry-run`: aún ejecuta `extract`, luego imprime solo el plan del lote (sin llamadas a la API). `--chunk`: cadenas por lote de API (por defecto **50**). `-j`: lotes paralelos máximos (por defecto `concurrency`). Con `--json`, la salida en estilo humano va a stderr. Los enlaces usan `path:line` como el botón “link” en las cadenas de interfaz de usuario de `dashboard`. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`              | Exportar `strings.json` a XLIFF 2.0 (una `.xliff` por configuración regional de destino). `-o` / `--output-dir`: directorio de salida (predeterminado: misma carpeta que el catálogo). `--untranslated-only`: solo unidades que carecen de traducción para esa configuración regional. Solo lectura; sin API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                 | Extraer (si está habilitado), luego traducción de la interfaz de usuario, luego `translate-svg` cuando `features.translateSVG` y `config.svg` están establecidos, luego traducción de la documentación, a menos que se omita con `--no-ui`, `--no-svg` o `--no-docs`. Marcas compartidas: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (solo agrupación de documentación), `--force` / `--force-update` (solo documentación; mutuamente excluyentes cuando se ejecuta la documentación). La fase de documentación también transmite `--emphasis-placeholders` y `--debug-failed` (mismo significado que `translate-docs`). `--prompt-format` no es una marca `sync`; el paso de documentación usa el valor predeterminado integrado (`json-array`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `status [--max-columns <n>]`                                                             | Cuando `features.translateUIStrings` está activado, imprime la cobertura de la interfaz de usuario por configuración regional (`Translated` / `Missing` / `Total`). Luego imprime el estado de traducción de markdown por archivo × configuración regional (sin filtro `--locale`; las configuraciones regionales provienen de la configuración). Listas grandes de configuraciones regionales se dividen en tablas repetidas de hasta `n` columnas de configuraciones regionales (predeterminado **9**) para mantener las líneas estrechas en la terminal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                         | Muestra la caché de documentación y las estadísticas de `strings.json` (agregados iguales a los del Panel de traducción → **Estadísticas**). `--max-columns`: número máximo de columnas por configuración regional × tabla de configuraciones regionales (por defecto coincide con el panel).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                                    | Ejecuta primero `sync --force-update` (extrae, interfaz de usuario, SVG, documentación), luego elimina las filas de segmentos obsoletas (`last_hit_at` nulo / ruta de archivo vacía); elimina las filas de `file_tracking` cuya ruta fuente resuelta no existe en el disco; elimina las filas de traducción cuyos metadatos `filepath` hacen referencia a un archivo inexistente. Registra tres conteos (obsoletos, `file_tracking` huérfanos, traducciones huérfanas). Crea una copia de seguridad de SQLite con marca de tiempo en el directorio de caché, a menos que `--no-backup`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                               | **Sin configuración.** Recorre un árbol de directorios (por defecto: directorio actual) en busca de `*.log` y `cache.db.backup*.sqlite`, muestra rutas `./…` como `find -print`. Si hay coincidencias: solicita confirmación `Delete these files? (y/n)` a menos que `-f` / `--force` (eliminar sin confirmación). Si no hay coincidencias: sale sin solicitar confirmación. `--dry-run`: solo lista, sin solicitar confirmación ni eliminar (anula `--force`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                      | Inicia el Panel de Traducción (interfaz web local para segmentos de caché, `strings.json`, glosario, errores y estadísticas). Con `--no-open`, el navegador predeterminado no se abre automáticamente. El alias obsoleto `editor` aún funciona pero muestra una advertencia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `glossary-generate [-o <path>]`                                                          | Escribe una plantilla `glossary-user.csv` vacía. `-o`: sobrescribe la ruta de salida (predeterminada: `glossary.userGlossary` del archivo de configuración, o `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                         | Muestra la ayuda para un subcomando (igual que la salida de `ai-i18n-tools <command> --help`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Opciones raíz y globales

| Opción                       | Alcance         | Descripción                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | Programa raíz  | Muestra el número de versión y la marca de tiempo de compilación (misma información que el subcomando `version`). |
| `-h` / `--help`              | Programa raíz  | Muestra la ayuda para el programa raíz o para un subcomando cuando se usa con un nombre de comando.      |
| `-c` / `--config <path>`     | Todos los comandos | Ruta del archivo de configuración (por defecto: `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | Todos los comandos | Registro detallado (verbose logging).                                                                          |
| `-w` / `--write-logs [path]` | Todos los comandos | Redirige la salida de la consola a un archivo `.log` (ruta por defecto: dentro de `cacheDir`).                |

### Ayuda por comando

| Uso                            | Descripción                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | Todas las opciones para ese comando.      |
| `ai-i18n-tools help <command>`   | Mismo resultado que `<command> --help`. |

### Idiomas de destino (`-l` / `--locale`)

| Comandos                                                                                | Comportamiento                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — códigos BCP-47 separados por comas (por ejemplo, `de,fr,pt-BR`). Si se omite, se toman los valores predeterminados del archivo de configuración y de `ui-languages.json`. |
| `lint-source`                                                                           | `-l` / `--locale <code>` — idioma fuente único para revisar (por defecto: `sourceLocale` del archivo de configuración).                                                            |

---

<a id="environment-variables"></a>
## Variables de entorno

| Variable               | Descripción                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **Obligatorio.** Tu clave de API de OpenRouter.                     |
| `OPENROUTER_BASE_URL`   | Anula la URL base de la API.                               |
| `I18N_SOURCE_LOCALE`    | Anula `sourceLocale` en tiempo de ejecución.               |
| `I18N_TARGET_LOCALES`   | Códigos de configuración regional separados por comas para anular `targetLocales`.  |
| `I18N_LOG_LEVEL`        | Nivel del registrador (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | Cuando vale `1`, desactiva los colores ANSI en la salida del registro.             |
| `I18N_LOG_SESSION_MAX`  | Número máximo de líneas guardadas por sesión de registro (por defecto `5000`).           |
