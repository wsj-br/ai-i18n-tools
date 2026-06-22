<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: Introducción

El paquete `ai-i18n-tools` ofrece tres flujos de trabajo modulares y distintos:

- **Flujo de trabajo 1 - Traducción de interfaz**: extrae llamadas `t("…")` de cualquier fuente JS/TS, tradúcelas mediante OpenRouter y genera archivos JSON planos por idioma listos para i18next.
- **Flujo de trabajo 2 - Traducción de documentos**: traduce páginas **markdown, MDX y `.astro`** listadas en `docs[].contentPaths` mediante `translate-docs`, con caché inteligente. Opcionalmente, el **archivo JSON de catálogo de Docusaurus** (`docs[].docusaurusCatalogDir`, proveniente de `docusaurus write-translations`) se traduce con el mismo comando cuando `features.translateDocs` está activado — esto incluye elementos de la interfaz del sitio (barra de navegación, pie de página, cadenas del tema), no el contenido textual en `docs/`.
- **Flujo de trabajo 3 - Traducción de archivos JSON**: traduce paquetes JSON anidados arbitrarios (por ejemplo, `src/i18n/en/translation.json`) mediante `json[]`, `features.translateJson` y `translate-json` de nivel superior — para sitios que almacenan el texto de la interfaz en archivos JSON por idioma en lugar de `t()` en el código fuente.

Los recursos **SVG** utilizan `features.translateSVG`, el bloque `svg` de nivel superior y `translate-svg` (véase [referencia CLI](#cli-reference)).

**¿Qué flujo de trabajo?**

- Cadenas visibles para el usuario en el código fuente mediante `t()` → Flujo 1 (`extract` / `translate-ui`).
- Páginas localizadas o JSON shell de Docusaurus → Flujo 2 (`translate-docs`).
- Únicamente archivos JSON anidados independientes → Flujo 3 (`translate-json`).

Los tres flujos de trabajo utilizan OpenRouter (cualquier LLM compatible) y comparten un único archivo de configuración.

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[English (UK)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [Hindi (Roman)](./GETTING_STARTED.hi-Latn.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [简体中文](./GETTING_STARTED.zh-Hans.md) · [繁體中文](./GETTING_STARTED.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabla de contenido**

- [Instalación](#installation)
  - [Uso de la CLI](#using-the-cli)
- [Inicio rápido](#quick-start)
  - [Scripts recomendados de `package.json`](#recommended-packagejson-scripts)
- [Flujo 1 - Traducción de interfaz de usuario](#workflow-1---ui-translation)
  - [Paso 1: Inicializar](#step-1-initialise)
  - [Paso 2: Extraer cadenas](#step-2-extract-strings)
  - [Sitio web Astro (Astro plano, no Starlight)](#astro-website-plain-astro-not-starlight)
  - [Cadenas de interfaz de usuario en sitio web Astro (SSG)](#astro-website-ui-strings-ssg)
  - [Páginas de sitio web Astro (análisis y reemplazo)](#astro-website-pages-parse-and-replace)
  - [Paso 3: Traducir cadenas de interfaz](#step-3-translate-ui-strings)
  - [Exportación a XLIFF 2.0 (opcional)](#exporting-to-xliff-20-optional)
  - [Paso 4: Conectar i18next en tiempo de ejecución](#step-4-wire-i18next-at-runtime)
    - [Mantener alineado `SOURCE_LOCALE`](#keeping-source_locale-aligned)
    - [Cargadores de configuración regional](#locale-loaders)
    - [Referencia de ayudantes en tiempo de ejecución](#runtime-helpers-reference)
  - [Uso de `t()` en el código fuente](#using-t-in-source-code)
  - [Interpolación](#interpolation)
  - [Plurales cardinales (`plurals: true`)](#cardinal-plurals-plurals-true)
    - [Cómo se almacenan y emiten los plurales](#how-plurals-are-stored-and-emitted)
  - [Interfaz de selector de idioma](#language-switcher-ui)
  - [Idiomas RTL](#rtl-languages)
- [Flujo de trabajo 2 - Traducción de documentos](#workflow-2---document-translation)
  - [Paso 1: Inicializar para documentación](#step-1-initialise-for-documentation)
  - [Paso 2: Traducir documentos](#step-2-translate-documents)
    - [Markdown complejo y comprobaciones de calidad fallidas](#complex-markdown-and-failed-quality-checks)
    - [Comportamiento de caché y banderas de `translate-docs`](#cache-behaviour-and-translate-docs-flags)
    - [Formato de lote de indicaciones](#batch-prompt-format)
    - [Deduplicación de segmentos y rutas en SQLite](#segment-dedupe-and-paths-in-sqlite)
  - [Diseños de salida](#output-layouts)
    - [Enlaces de anclaje cuando `docsOutput.style = "flat"`](#anchor-links-when-docsoutputstyle--flat)
    - [Imágenes y recursos rasterizados en documentos traducidos](#images-and-raster-assets-in-translated-docs)
    - [Selector de idioma (`languageListBlock`)](#language-switcher-languagelistblock)
    - [Marcadores de posición `pathTemplate` / `jsonPathTemplate`](#pathtemplate--jsonpathtemplate-placeholders)
  - [Solución de problemas](#troubleshooting)
- [Flujo 3 - Traducción de archivos JSON](#workflow-3---json-file-translation)
  - [Paso 1: Inicializar para JSON anidado](#step-1-initialise-for-nested-json)
  - [Paso 2: Configurar `json[]`](#step-2-configure-json)
  - [Paso 3: Traducir paquetes JSON](#step-3-translate-json-bundles)
  - [Flujo 3 frente a otras canalizaciones](#workflow-3-vs-other-pipelines)
- [Flujo de trabajo combinado (IU + Documentos)](#combined-workflow-ui--docs)
  - [Flujo de trabajo mixto de documentación (`docsOutput.style = "docusaurus"` + `"flat"`)](#mixed-documentation-workflow-docsoutputstyle--docusaurus--flat)
- [Panel de traducción](#translation-dashboard)
  - [Errores (traducción de documentos)](#failures-document-translation)
    - [Cuándo usarlo](#when-to-use-it)
    - [Por qué son importantes las ediciones del origen](#why-source-edits-matter)
    - [Cómo usar la pestaña](#how-to-use-the-tab)
  - [Problemas con Markdown (comprobaciones estáticas)](#markdown-issues-static-checks)
- [Referencia de configuración](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (opcional)](#uilanguagespath-optional)
  - [`concurrency` (opcional)](#concurrency-optional)
  - [`batchConcurrency` (opcional)](#batchconcurrency-optional)
  - [`fileConcurrency` (opcional)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (opcional)](#batchsize--maxbatchchars-optional)
  - [`provider` y `providers`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [Mejor práctica para exclusiones en git:](#best-practice-for-git-exclusions)
  - [`docs`](#docs)
  - [`json`](#json)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [Referencia de CLI](#cli-reference)
  - [Opciones raíz y globales](#root-and-global-options)
  - [Ayuda por comando](#per-command-help)
  - [Configuraciones regionales de destino (`-l` / `--locale`)](#target-locales--l----locale)
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

Establece la clave API de tu proveedor (se muestra OpenRouter; usa la variable de entorno que coincida con tu proveedor activo; consulta la [tabla de preajustes](#openrouter)):

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

La plantilla predeterminada de `init` (`ui-markdown`) habilita únicamente la extracción y traducción de **IU**. Las plantillas `ui-docusaurus` y `ui-starlight` habilitan la traducción de **documentos** (`translate-docs`). La plantilla `ui-astro-website` estructura la extracción de **IU** para aplicaciones Astro simples (incluyendo archivos `.astro`); agregue un bloque `docs[]` (véase [Páginas de sitio web Astro (análisis y reemplazo)](#astro-website-parse-and-replace)) cuando también desee `translate-docs` para el HTML de páginas `.astro`. La referencia [`examples/astro-website`](../../docs/../examples/astro-website/) utiliza **ambas** canalizaciones. Use `sync` cuando desee un solo comando que ejecute extracción, traducción de IU, traducción opcional de archivos SVG y traducción de documentación según su configuración.

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

# Workflow 3 - nested JSON bundles (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Scripts recomendados `package.json`

Con el paquete instalado localmente, puedes usar los comandos CLI directamente en scripts (no se necesita `npx`).

**Prefiera** `sync` para cualquier cosa que antes fuera “ejecutar `translate-ui`, luego `translate-svg`, luego `translate-docs`, luego `translate-json`”: `ai-i18n-tools sync` ejecuta **extract** (cuando está habilitado), **translate-ui**, opcional **translate-svg**, **translate-docs** y opcionalmente **translate-json**—en el orden correcto y con banderas compartidas—según su configuración. Encadenar esos pasos manualmente es propenso a errores (orden, extracción, banderas de configuración regional). Use `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs` y `i18n:translate:json` solo cuando necesite un **único** paso de forma aislada.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
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
- `ui.flatOutputDir` - dónde escribir `de.json`, `pt-BR.json`, etc. (ej. `"src/locales/"`).
- `ui.preferredModel` (opcional) - ID del modelo a probar **primero** solo para `translate-ui`; en caso de error, la CLI continúa con los `translationModels` del proveedor activo en orden, omitiendo duplicados.

<a id="step-2-extract-strings"></a>
### Paso 2: Extraer cadenas

```bash
npx ai-i18n-tools extract
```

Analiza todos los archivos JS/TS dentro de `ui.sourceRoots` en busca de llamadas a `t("literal")` y `i18n.t("literal")`. Escribe (o combina en) `ui.stringsJson`.

El escáner es configurable: agregue nombres de funciones personalizadas mediante `ui.uiExtractor.funcNames` (o el obsoleto `ui.reactExtractor.funcNames`). Para páginas y componentes Astro, agregue `.astro` a `ui.uiExtractor.extensions`.

<a id="marking-html-for-translation"></a>
### Marcado de HTML para traducción

Para aplicaciones HTML sencillas (sin llamadas `t("…")` en el marcado), marque los elementos traducibles con atributos y deje que `extract` capture el texto en inglés del propio elemento; no hay literales de cadena duplicados.

Prefiera la forma desnuda (el atributo no tiene valor; el texto fuente se lee del elemento):

- `data-i18n` — la clave es el `textContent` del elemento; en tiempo de ejecución, establezca `el.textContent = t(key)`.
- `data-i18n-title` — la clave es el `title` del elemento; en tiempo de ejecución, establezca el `title` traducido.
- `data-i18n-placeholder` — la clave es el `placeholder` del elemento.

Utilice la forma con valor `data-i18n="Some key"` solo cuando la forma desnuda no pueda funcionar: elementos de contenido mixto (texto intercalado con etiquetas secundarias), o cuando la clave deba ser diferente del texto visible. Excluya un elemento (y su subárbol) con `data-i18n-ignore`.

Restricción: la forma desnuda `data-i18n` es solo para elementos de texto hoja (un solo nodo de texto, sin elementos secundarios), ya que el establecimiento de `textContent` reemplaza a cualquier hijo. Para un párrafo como `Run <code>build</code> now.`, envuelva cada fragmento de texto en su propio marcador en su lugar:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

Añada los marcadores manualmente, o deje que el comando `mark-html` inserte los marcadores desnudos por usted. Es una ejecución de prueba por defecto: informa cuántos marcadores añadiría por archivo y enumera cualquier elemento de contenido mixto que necesite un `<span data-i18n>` manual; solo escribe con `--write`:

```bash
# Preview (no changes written)
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
```

`mark-html` es idempotente, respeta `data-i18n-ignore`, nunca marca elementos similares a código (`code`, `pre`, `kbd`, `samp`, `var`) ni texto vacío/solo numérico, y nunca emite un marcador con valor. Después de marcar, envuelva manualmente cualquier fragmento de contenido mixto reportado, luego añada `.html` a `ui.uiExtractor.extensions` para que `extract` capture las cadenas:

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="html-app-worked-example-dashboard"></a>
#### Ejemplo práctico: localización de una aplicación HTML sencilla (el panel de control incluido)

El propio panel de traducción del paquete (`src/dashboard-app`) utiliza estos mismos marcadores. Su `index.html` contiene marcadores simples como:

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract` escribe cada cadena de origen en inglés en el catálogo (`strings.json`), y `translate-ui` rellena un paquete plano por cada idioma, indexado por el texto de origen en inglés. Para una aplicación HTML estática típica, apuntaría `ui.flatOutputDir` a un directorio servido por la web, como `public/locales/`:

```bash
npx ai-i18n-tools extract        # index.html markers → strings.json
npx ai-i18n-tools translate-ui   # strings.json → {ui.flatOutputDir}/{locale}.json
```

```jsonc
// public/locales/de.json
{
  "Next": "Weiter",
  "Filename (partial)": "Dateiname (teilweise)",
  "Stop the dashboard server and close this window": "Dashboard-Server stoppen und dieses Fenster schließen",
  "Close": "Schließen"
}
```

En tiempo de ejecución, cargue el paquete del idioma activo y recorra los elementos marcados. La clave proviene del valor del marcador cuando está presente, de lo contrario, del propio texto/título/marcador de posición del elemento (normalizado de la misma manera que el extractor normaliza los espacios en blanco):

```html
<script type="module">
  const locale = document.documentElement.lang || "en";
  const bundle = locale.startsWith("en")
    ? {}
    : await fetch(`/locales/${locale}.json`).then((r) => (r.ok ? r.json() : {}));

  const t = (key) => bundle[key] ?? key; // English source is the fallback
  const norm = (s) => s.trim().replace(/\s+/g, " ");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || norm(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || norm(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder") || norm(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
</script>
```

La parte de recorrido de marcadores de este fragmento es exactamente `applyStaticI18n` en [`src/dashboard-app/app.js`](../../docs/../src/dashboard-app/app.js). Dado que el texto de origen en inglés es la clave del catálogo, las cadenas no traducidas vuelven automáticamente al inglés.

Cómo difiere el panel empaquetado: como tiene un servidor Node, no recupera un archivo estático `/locales/{locale}.json`. El cliente llama a `GET /api/ui-i18n`, y el servidor resuelve el idioma activo (`--ui-lang` > `AI_I18N_LANG` > configuración `uiLanguage` > sistema operativo del host) y devuelve `{ locale, dir, bundle }`. El cliente establece entonces `document.documentElement` `lang`/`dir` a partir de esa respuesta (en lugar de leer `lang` para elegir el idioma) antes de llamar a `applyStaticI18n`. Los paquetes en sí no son el contenido de la herramienta bajo traducción; son las cadenas de interfaz de usuario del propio panel, enviadas en `src/i18n/locales/{locale}.json` (copiadas a `dist/i18n/locales` en la compilación) y leídas en el lado del servidor por `loadUiBundle` en [`src/i18n/index.ts`](../../docs/../src/i18n/index.ts). El `t()` del panel también admite la interpolación `{{name}}`, a diferencia del mínimo `t` anterior.

<a id="astro-website-plain-astro-not-starlight"></a>
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

<a id="astro-website-ui-strings-ssg"></a>
### Cadenas de interfaz de usuario de sitio web Astro (SSG)

Cree la extracción de IU con `init -t ui-astro-website`, luego combine con un bloque `docs[]` cuando también traduzca HTML de páginas (véase más abajo). Envuelva el texto con `t('…')` en módulos TypeScript y en el frontmatter `.astro` (y bloques de plantilla `{expression}` cuando prefiera cadenas de IU en lugar de páginas por configuración regional duplicadas):

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

<a id="astro-website-pages-parse-and-replace"></a>
### Páginas de sitio web Astro (análisis y reemplazo)

Para páginas de marketing con HTML codificado en archivos `.astro`, permite que `translate-docs` extraiga nodos de texto y atributos (`alt`, `title`, `aria-label`, `placeholder`), los traduzca mediante la caché del documento y escriba copias específicas del idioma en tu árbol de páginas. **No** necesitas `t()` para la mayoría de los textos visibles.

Los atributos estructurales y los valores clave **no** se traducen por defecto: la protección integrada cubre atributos JSX/HTML como `class`, `id`, `style`, `src`, `href`, `data-*` y la mayoría de `aria-*`, además de claves de objetos como `class`, `key` y `id` dentro de bloques de plantilla `{expression}`. Use `docs[].protectAttributes` y `docs[].protectKeys` para ampliar esas listas cuando utilice atributos personalizados (por ejemplo, `variant` de Tailwind o campos `slug` del CMS). Las mismas opciones se aplican a JSX en MDX durante la traducción de markdown (véase [protectAttributes / protectKeys](#protectattributes-protectkeys)).

Habilite `features.translateDocs` y agregue un bloque `docs[]`, por ejemplo:

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
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

Lee `strings.json`, envía lotes al proveedor LLM activo para cada locale de destino, escribe archivos JSON planos (`de.json`, `fr.json`, etc.) en `ui.flatOutputDir`. Cuando se establece `ui.preferredModel`, se intenta ese modelo antes de la lista de `translationModels` del proveedor activo (la traducción de documentos y otros comandos solo usan la lista del proveedor).

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

<a id="keeping-source_locale-aligned"></a>
#### Mantener alineado `SOURCE_LOCALE`

**Mantenga alineados tres valores:** `sourceLocale` en `ai-i18n-tools.config.json`, `SOURCE_LOCALE` en este archivo, y el JSON plano plural que `translate-ui` escribe como `{sourceLocale}.json` en su directorio de salida plano (habitualmente `public/locales/`). Use el mismo nombre base en el `import` estático (ejemplo anterior: `en-GB` → `en-GB.json`). El campo `lng` en `sourcePluralFlatBundle` debe ser igual a `SOURCE_LOCALE`. Las rutas de ES estáticas `import` no pueden usar variables; si cambia el idioma fuente, actualice `SOURCE_LOCALE` y la ruta de importación conjuntamente. Alternativamente, cargue ese archivo con un `import(\` dinámico ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, o `readFileSync` para que la ruta se construya a partir de `SOURCE_LOCALE`.

El fragmento usa `./locales/…` y `./public/locales/…` como si `i18n` estuviera junto a esas carpetas. Si su archivo está bajo `src/` (típico), use `../locales/…` y `../public/locales/…` para que las importaciones resuelvan a las mismas rutas que `ui.stringsJson`, `uiLanguagesPath` y `ui.flatOutputDir`.

Importa `i18n.js` antes de que React renderice (por ejemplo, al principio de tu punto de entrada). Cuando el usuario cambie de idioma, llama a `await loadLocale(code)` y luego a `await i18n.changeLanguage(code)`.

`SOURCE_LOCALE` se exporta para que cualquier otro archivo que lo necesite (por ejemplo, un selector de idioma) pueda importarlo directamente desde `'./i18n'`. Si estás migrando una configuración existente de i18next, reemplaza cualquier cadena de configuración regional fuente escrita directamente (por ejemplo, comprobaciones `'en-GB'` dispersas en los componentes) por importaciones de `SOURCE_LOCALE` desde tu archivo de inicialización de i18n.

Las importaciones nombradas (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funcionan igual si prefieres no usar la exportación por defecto.

<a id="locale-loaders"></a>
#### Cargadores de configuración regional

Mantenga `localeLoaders` **alineado con la configuración** derivándolos de `ui-languages.json` usando `makeLocaleLoadersFromManifest` (esto filtra `SOURCE_LOCALE` usando la misma normalización que `makeLoadLocale`). Cuando añade una configuración regional a `targetLocales` y ejecuta `generate-ui-languages`, el manifiesto se actualiza y sus cargadores siguen automáticamente el cambio; no es necesario mantener un mapa codificado por separado.

Para paquetes JSON bajo `public/` (la configuración típica de Next.js), obtenga los datos desde su ruta URL pública:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Para CLIs en Node sin empaquetador, use `readFileSync` dentro de un pequeño ayudante que lea y analice el archivo JSON para cada código.

<a id="runtime-helpers-reference"></a>
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

<a id="how-plurals-are-stored-and-emitted"></a>
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
    await i18n.changeLanguage(code);
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

Diseñado principalmente para **documentación en markdown, MDX y `.astro`** bajo `docs[].contentPaths`. En sitios Docusaurus, establezca `docs[].docusaurusCatalogDir` como la carpeta del catálogo `write-translations` (por ejemplo, `docs-site/i18n/en`) para que `translate-docs` también traduzca JSON de shell (barra de navegación, pie de página, cadenas de tema). Para imágenes PNG y otros recursos rasterizados incrustados en markdown, consulte [Imágenes y recursos rasterizados en documentación traducida](#images-and-raster-assets-in-translated-docs). Para un bloque opcional de **selector de idioma** en README o documentación con `docsOutput.style = "flat"`, consulte [Selector de idioma (`languageListBlock`)](#language-switcher-languagelistblock). Los archivos SVG se traducen mediante [`translate-svg`](#cli-reference) cuando `features.translateSVG` está habilitado, no mediante `docs[].contentPaths`. Los paquetes JSON arbitrarios anidados de IU (no catálogos de Docusaurus) pertenecen al [Flujo de trabajo 3](#workflow-3---json-file-translation) (`json[]` / `translate-json`), no a `docs[]`.

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

**Principal frente a suplementario:** Enfóquese en `contentPaths` para páginas localizadas. Establezca `docusaurusCatalogDir` cuando también necesite JSON del shell de Docusaurus desde `write-translations`. Omita `docusaurusCatalogDir` si solo traduce páginas.

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

**Si encuentra este tipo de fallo de validación, prefiera simplificar el texto en el idioma fuente** — divida el párrafo, mueva un ejemplo a un bloque de código delimitado, o describa la misma idea con menos pares anidados de negrita/código — en lugar de esperar que cada modelo y configuración regional reproduzca perfectamente un marcado denso en línea. En otras partes de esta página (notablemente en las notas del paso 4 sobre `SOURCE_LOCALE`, cargadores y rutas `public/`), el formato es intencionadamente realista; cuando reutilice redacción similar en su propia documentación, manténgala más simple al traducir ampliamente.

Cuando todos los modelos configurados fallan con un `AST mismatch` en el mismo segmento, `translate-docs` puede dividir automáticamente ese segmento en partes más pequeñas (primero el punto medio de la lista, luego elementos individuales de la lista o fragmentos más cortos de párrafo), volver a intentar cada parte desde el primer modelo y volver a unir el resultado bajo la clave original de caché del segmento. Esta función está activada por defecto (`segmentSplitting.qualityRetrySplit`); establézcala en `false` para detenerse tras agotar todos los modelos. El resumen de ejecución informa `Quality split retries` cuando se ejecuta este mecanismo de respaldo.

Para ver **qué segmentos fallaron**, con qué frecuencia y los **mensajes de error o calidad** almacenados, utiliza la pestaña **Fallos** del Panel de Traducción ([Panel de Traducción → Fallos](#failures-document-translation)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Comportamiento de caché y banderas `translate-docs`

La CLI mantiene el **seguimiento de archivos** en SQLite (hash de origen por archivo × idioma) y filas de **segmentos** (hash × idioma por fragmento traducible). Una ejecución normal omite completamente un archivo cuando el hash registrado coincide con el origen actual **y** el archivo de salida ya existe; de lo contrario, procesa el archivo y utiliza la caché de segmentos para que el texto sin cambios no llame a la API.

| Bandera                         | Efecto                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(predeterminado)*              | Omite archivos sin cambios cuando la huella + la salida en disco coinciden; usa la caché de segmentos para el resto.                                                                                                                                                  |
| `-l, --locale <codes>`        | Configuraciones regionales de destino separadas por comas (cuando se omite, los valores predeterminados coinciden con la unión de `targetLocales` raíz y el `targetLocales` opcional de cada bloque `docs[]`).                                                                                                       |
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

`translate-docs` envía segmentos traducibles al proveedor LLM activo en **lotes** (agrupados por `batchSize` / `maxBatchChars`). El indicador `--prompt-format` solo cambia el **formato de cableado** de ese lote; los tokens `PlaceholderHandler`, las comprobaciones AST de markdown, las claves de caché de SQLite y la recuperación por segmento cuando falla el análisis del lote no cambian.

| Modo                   | Mensaje del usuario                                                           | Respuesta del modelo                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: un `<seg id="N">…</seg>` por segmento (con escape XML). | Solo bloques `<t id="N">…</t>`, uno por índice de segmento.       |
| `json-array` (por defecto) | Un array JSON de cadenas, una entrada por segmento en orden.               | Un array JSON de la **misma longitud** (mismo orden).           |
| `json-object`          | Un objeto JSON `{"0":"…","1":"…",…}` con clave por índice de segmento.            | Un objeto JSON con las **mismas claves** y valores traducidos. |

El encabezado de ejecución también imprime `Batch prompt format: …` para que pueda confirmar el modo activo. Los archivos de etiquetas JSON (`docusaurusCatalogDir`) y lotes de archivos SVG usan la misma configuración cuando esos pasos se ejecutan como parte de `translate-docs` (o la fase de documentación de `sync` — `sync` no expone esta bandera; su valor predeterminado es `json-array`).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Detección de segmentos duplicados y rutas en SQLite

> **Nota:** Esta sección cubre detalles internos de claves de caché útiles para depurar el comportamiento de `cleanup` o herramientas personalizadas. La mayoría de los usuarios pueden omitirla.

- Las filas de segmentos se indexan globalmente por `(source_hash, locale)` (hash = contenido normalizado). Texto idéntico en dos archivos comparte una sola fila; `translations.filepath` es metadato (último escritor), no una entrada de caché adicional por archivo.
- `file_tracking.filepath` utiliza claves con espacio de nombres: `doc-block:{index}:{relPath}` por bloque `docs` (`relPath` es una ruta posix relativa a la raíz del proyecto: rutas markdown tal como se recopilan; **los archivos JSON de etiquetas usan la ruta relativa al directorio de trabajo actual (cwd) del archivo fuente**, por ejemplo `docs-site/i18n/en/code.json`, para que la limpieza pueda resolver el archivo real), `json-block:{index}:{relPath}` para fuentes `json[]` bajo `translate-json`, y `svg-files:{relPath}` para archivos SVG bajo `translate-svg`.
- `translations.filepath` almacena rutas posix relativas al cwd para segmentos markdown, JSON y SVG (SVG usa la misma forma de ruta que otros recursos; el prefijo `svg-files:…` está **solo** en `file_tracking`).
- Tras una ejecución, `last_hit_at` se borra únicamente para las filas de segmentos **en el mismo ámbito de traducción** (respetando `--path` y los tipos habilitados) que no se alcanzaron, por lo que una ejecución filtrada o solo de documentación no marca como obsoletos archivos no relacionados.

<a id="output-layouts"></a>
### Distribuciones de salida

`docsOutput.style` controla dónde se escriben los archivos markdown traducidos. Usa los valores de cadena exactos a continuación en `docs[].docsOutput.style` (los alias son diseños predefinidos, no motores independientes).

`docsOutput.style = "nested"` (predeterminado cuando se omite) — refleja el árbol de origen bajo `{outputDir}/{locale}/` (por ejemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — árbol de documentación con prefijo de configuración regional para sitios de documentación estática. Los archivos bajo `docsRoot` se escriben en `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`. Las rutas fuera de `docsRoot` vuelven al diseño anidado. Establece `docs[].docsOutput.docsRoot` como la raíz del origen en inglés (por ejemplo, `"docs"` o `"src/content/docs"`). Cuando `docsOutput.style = "doc-system"`, debes establecer `localeSubpath` explícitamente (usa un alias a continuación para configuraciones preestablecidas).

**Alias** (mismo motor de diseño, valor preestablecido de `localeSubpath`):

- `docsOutput.style = "docusaurus"` — `localeSubpath` por defecto es `docusaurus-plugin-content-docs/current` (diseño del plugin de i18n de Docusaurus).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` por defecto es `""` (páginas traducidas directamente bajo `{outputDir}/{locale}/`, coincidiendo con [Starlight](https://starlight.astro.build/guides/i18n/) cuando el contenido en inglés está en la raíz del contenido y `outputDir` es igual a `docsRoot`).

Valor preestablecido de Docusaurus (páginas principales de documentación):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Valor preestablecido de Starlight (misma forma de bloque, rutas diferentes):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Etiquetas JSON opcionales — cadenas de interfaz de Docusaurus desde `docusaurusCatalogDir` (no el contenido del cuerpo MDX):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight incluye cadenas de interfaz para muchas configuraciones regionales; las sustituciones personalizadas opcionales usan `src/content/i18n/en.json` con `jsonPathTemplate: "{outputDir}/{locale}.json"` en un bloque `docs[]` separado cuando sea necesario.

`docsOutput.style = "flat"` — coloca los archivos traducidos junto al origen con un sufijo de configuración regional, o en un subdirectorio. Los enlaces relativos entre páginas se reescriben automáticamente cuando `docsOutput.style = "flat"` (a menos que `rewriteRelativeLinks: false` o un `pathTemplate` personalizado esté establecido).

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-docsoutputstyle--flat"></a>
#### Enlaces de anclaje cuando `docsOutput.style = "flat"`

Cuando `docsOutput.style = "flat"`, la salida reescribe **rutas relativas** entre páginas para cada configuración regional (`guide.md` → `guide.de.md`). Los **enlaces de anclaje** — la forma habitual en línea de markdown con un `#` después de la ruta — saltan a una sección dentro del archivo de destino:

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

Aquí, el destino del enlace es `setup.md`, y `#first-run` es el anclaje: debería desplazarse al encabezado correcto dentro de ese archivo.

**Por qué los enlaces de anclaje requieren atención**

- `rewriteRelativeLinks` fija el **nombre de archivo** para cada idioma (`setup.md` → `setup.de.md`).
- Muchos renderizadores derivan el slug de `#` del **texto visible del encabezado**. Después de la traducción, los encabezados varían por idioma, por lo que un slug generado automáticamente puede cambiar mientras que el enlace reescrito aún diga `#first-run` — o su anclaje en inglés `#…` ya no coincida con el slug que el renderizador construye a partir del encabezado traducido.
- Resultado: los lectores llegan al **archivo** correcto pero a la **línea incorrecta**, o el navegador no encuentra ningún encabezado coincidente.

**Qué hacer**

1. Ejecuta `ai-i18n-tools write-heading-ids` en tu fuente `.md` / `.mdx` antes de `translate-docs` (mismo `docs[]` / `contentPaths` que de costumbre). Inserta anclajes HTML explícitos en la línea anterior a cada encabezado, de modo que los valores `id` sean compartidos por cada copia traducida. Vuelve a ejecutarlo tras renombrar encabezados para actualizar los IDs de anclaje obsoletos y que coincidan con el título actual.
2. Apunta tus **enlaces de anclaje** en markdown a esos IDs estables, por ejemplo `[label](../../docs/other.md#section-id)`, donde `section-id` coincida con el anclaje escrito por la herramienta — no una suposición basada únicamente en palabras en inglés.

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
| A — Raster compartido        | Imagen única, sin variantes por configuración regional | Reescritor de enlaces por archivo; normalmente sin expresiones regulares          |
| B — Carpeta por configuración regional        | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/documentación | `regexAdjustments` intercambio de segmento de configuración regional            |
| C — Colocados en Docusaurus     | sitios `docsOutput.style = "docusaurus"` | El script de captura coloca los archivos; sin expresiones regulares          |
| D — SVG traducido           | Aplicaciones web que integran ilustraciones SVG                  | `translate-svg` con `svg.style = "flat"`         |
| E — SVG traducido colocado     | documentación `docsOutput.style = "docusaurus"`          | `translate-svg` con `svg.style = "nested"` + `pathTemplate` |

**El reescritor de enlaces plano y el flujo de dos pasos**

Cuando `docsOutput.style = "flat"`, un reescritor integrado se ejecuta antes de `postProcessing`. Calcula el prefijo de profundidad por archivo de salida — la ruta relativa desde el directorio del archivo de salida hacia atrás hasta el directorio del archivo fuente — y lo antepone a las URLs de recursos que no son markdown. `postProcessing` luego se ejecuta sobre la URL ya con prefijo — escribe patrones `search` que coincidan con el segmento de configuración regional dentro de ella, no con el prefijo inicial `../`.

Con `flatPreserveRelativeDir: true`, los archivos en subdirectorios obtienen un prefijo específico automáticamente. Por ejemplo, `docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md` genera un prefijo `../../docs/`, por lo que `translation-dashboard.png` (un archivo hermano del origen) se convierte en `../../docs/translation-dashboard.png` —resuelto correctamente sin necesidad de ninguna regla `postProcessing`.

Cuando `docsOutput.style` es `"docusaurus"`, `"astro-starlight"`, `"nested"` o cualquier valor distinto de `"flat"`, el reescritor de enlaces planos no se ejecuta. `postProcessing` ve la URL original en formato markdown.

**Ejemplo del patrón A** — no se requiere configuración para activos con rutas relativas junto a los archivos fuente cuando se usa `docsOutput.style = "flat"`. Las reglas del patrón A `postProcessing` solo son necesarias para activos con URL absolutas (por ejemplo, `/img/...`) o reemplazos dirigidos a una CDN.

**Ejemplo del patrón B — `docsOutput.style = "flat"` README** (`examples/nextjs-app`, segundo bloque `docs[]`)

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Use la forma genérica `[^/]+`, no una configuración regional fuente codificada, para que la regla siga funcionando si `sourceLocale` cambia en el futuro.

**Ejemplo del patrón B — `docsOutput.style = "docusaurus"`** (`examples/nextjs-app`, primer bloque `docs[]`)

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

`examples/console-app/ai-i18n-tools.config.json` traduce `README.md` a `translated-docs/` únicamente mediante [postprocesamiento del selector de idioma](#language-switcher-languagelistblock). No se definen reglas para imágenes — adecuado cuando el README no tiene archivos ráster asociados o solo utiliza URLs absolutas que su servidor ya proporciona.

Las plantillas de reemplazo admiten marcadores de posición como `${translatedLocale}` y `${translatedBasedir}` (lista completa en la fila `docsOutput.postProcessing.regexAdjustments` de la [referencia de configuración](#configuration-reference)).

<a id="language-switcher-languagelistblock"></a>
#### Selector de idioma (`languageListBlock`)

Use `docsOutput.postProcessing.languageListBlock` cuando los archivos markdown traducidos deban incluir una fila de enlaces **“Leer en otros idiomas”** — un enlace por configuración regional, con valores `href` calculados en relación con cada archivo de salida.

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
| Este paquete (documentación plana + subdirectorios) | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) (`docsOutput.style = "flat"`), [README.md](../README.es.md), [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md), salidas bajo [translated-docs/](../../docs/../translated-docs/) |
| README mínimo solo                 | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json) (`docsOutput.style = "flat"`), [examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| README plano + documentación Docusaurus      | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (segundo bloque: `docsOutput.style = "flat"`; primer bloque: `docsOutput.style = "docusaurus"`)                                                     |

La línea inmediatamente antes de `<small id="lang-list">` (por ejemplo, `**Read in other languages:**`) es un segmento normal traducible y se localiza en cada configuración regional de destino; solo la fila de enlaces dentro de los marcadores se regenera textualmente, salvo por `href` y las etiquetas generadas por el manifiesto.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### Marcadores `pathTemplate` / `jsonPathTemplate`

Anule la ubicación donde se escriben los archivos traducidos estableciendo `docs[].docsOutput.pathTemplate` (markdown y MDX) o `jsonPathTemplate` (archivos de etiquetas JSON). Ambos aceptan los mismos marcadores de posición. Las rutas resueltas deben permanecer dentro del `outputDir` de ese bloque (la CLI rechaza rutas que salgan de él).

Si utiliza un `pathTemplate` personalizado, `rewriteRelativeLinks` por defecto es `false` a menos que lo establezca explícitamente — la reescritura de enlaces relativos está pensada para `docsOutput.style = "flat"` sin necesidad de una plantilla personalizada.

Para diseños integrados (`nested`, `flat`, `doc-system` sin plantilla personalizada), establezca `docsOutput.localePathLowercase` en `true` para escribir segmentos de carpetas o nombres de archivo en minúsculas (por ejemplo, `pt-br` en lugar de `pt-BR`). El alias `astro-starlight` establece esto por defecto en `true`. Los valores personalizados de `pathTemplate` / `jsonPathTemplate` no cambian — use `{llocale}` allí cuando necesite segmentos en minúsculas manteniendo `{locale}` como BCP-47.

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
| `{docsRoot}`           | Ruta absoluta resuelta de `docsOutput.docsRoot` (`docs` por defecto si se omite)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` con el prefijo `docsRoot` eliminado cuando las cadenas de ruta coinciden (POSIX); de lo contrario, sin cambios | `docs/guide.md` (común); `guide.md` solo cuando se aplica el recorte |

**Ejemplo**

Fragmento de configuración:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Para la configuración regional `de` y la fuente `docs/guide.md`, con raíz del proyecto `/home/acme/repo` y `outputDir` resuelto a `/home/acme/repo/i18n`, la ruta expandida es:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Con `docsOutput.style = "flat"` y sin `pathTemplate` personalizado, un patrón común consiste en conservar solo el nombre del archivo mediante `{stem}` y `{extension}`, por ejemplo `{outputDir}/{stem}.{locale}{extension}`, lo que produce `…/guide.de.md` bajo el `outputDir` resuelto.

<a id="troubleshooting"></a>
### Solución de problemas

**Los enlaces de anclaje de sección no funcionan en los documentos traducidos**

Un enlace como `[label](../../docs/other.md#section-id)` puede abrir el archivo traducido correcto, pero no desplazarse hasta el encabezado deseado, o bien puede saltar a una sección incorrecta. El fragmento `#…` ya no coincide con ningún encabezado `id` en esa configuración regional.

Causas comunes:

- Los encabezados de origen nunca tuvieron identificadores de anclaje explícitos; el sitio genera los slugs a partir del texto visible del encabezado, que cambia tras la traducción.
- Ha cambiado el nombre de un encabezado en el origen, pero la línea `<a id="…"></a>` anterior falta o aún contiene el ID antiguo.
- Los enlaces de anclaje usan un fragmento `#…` adivinado a partir de palabras en inglés en lugar del ID que generaría `write-heading-ids`.

**Solución**

1. Ejecute `ai-i18n-tools write-heading-ids` en su `.md` / `.mdx` **fuente** (mismo `docs[]` / `contentPaths` que `translate-docs`). Inserta `<a id="slug"></a>` antes de cada encabezado ATX, o actualiza un ancla existente cuando el texto del encabezado ya no coincide con el slug actual.
2. Dirija los enlaces de anclaje a esos id — por ejemplo, `[setup](../../docs/guide.md#first-run)` donde `#first-run` coincida con la línea de anclaje sobre el encabezado de destino, no un slug inferido únicamente del título en inglés.
3. Vuelva a ejecutar `translate-docs` (o `sync --force-update`) para que cada copia en un idioma incluya las líneas de anclaje actualizadas.

Utilice `--dry-run` en `write-heading-ids` primero para previsualizar los cambios. Consulte [Enlaces de anclaje en diseño plano](#anchor-links-when-docsoutputstyle--flat) para conocer el patrón completo.

---

<a id="workflow-3---json-file-translation"></a>
## Flujo de trabajo 3 - Traducción de archivos JSON

Diseñado para proyectos que almacenan el texto de la interfaz de usuario en **archivos JSON anidados por configuración regional** (por ejemplo, `src/i18n/en/translation.json`) en lugar de `t("…")` en el código fuente. La CLI recorre los valores de cadena en esos archivos, los traduce mediante OpenRouter y genera salidas por configuración regional usando `json[].outputPathTemplate`. Utiliza la misma caché SQLite que `translate-docs`, `translate-svg` y `cacheDir`.

Este flujo de trabajo **no** ejecuta `extract` — no hay un catálogo `strings.json`. Actívelo con `features.translateJson` y una o más entradas en el nivel superior `json[]`.

<a id="step-1-initialise-for-nested-json"></a>
### Paso 1: Inicializar para JSON anidado

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

Esa plantilla establece `features.translateJson: true`, desactiva la extracción de la interfaz de usuario y la traducción de documentos, y crea un único bloque `json[]` que apunta a `src/i18n/en/translation.json` con salida `src/i18n/{llocale}/translation.json`. Edite `sourceLocale`, `targetLocales`, `contentPaths` y `outputPathTemplate` según la estructura de su repositorio.

<a id="step-2-configure-json"></a>
### Paso 2: Configurar `json[]`

Cada bloque `json[]` describe una canalización:

- `contentPaths` — uno o más archivos `.json`, directorios o patrones (por ejemplo, `"src/i18n/en/translation.json"` o `"src/i18n/en/overrides/*.json"`). Las rutas se resuelven desde la raíz del proyecto.
- `outputPathTemplate` — obligatorio. Dónde escribir cada archivo por configuración regional. Marcadores de posición: `{locale}`, `{LOCALE}`, `{llocale}` (configuración regional en minúsculas, útil para carpetas de rutas de Astro), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (opcional) — subconjunto solo para este bloque; si no, se aplica el `targetLocales` raíz.
- `keyPolicy` — qué claves JSON contienen texto traducible frente a identificadores estables (ver más abajo).
- `description` (opcional) — se muestra en los encabezados de la CLI y en la salida de `status`.

Ejemplo (múltiples archivos de origen, carpetas de configuración regional en minúsculas):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | Comportamiento |
|-------------|-----------|
| `allowlist` | Solo se traducen las claves que coincidan con `translateKeys` (rutas con puntos; patrones minimatch). |
| `denylist`  | Traduce todos los valores de cadena excepto las claves que coincidan con `skipKeys`. |
| `both`      | Aplica primero `translateKeys`, luego elimina las coincidencias de `skipKeys`. |

Las rutas usan notación con puntos (`nav.home.label`). Un nombre simple como `slug` coincide con el segmento final de la clave a cualquier profundidad.

<a id="step-3-translate-json-bundles"></a>
### Paso 3: Traducir paquetes JSON

```bash
npx ai-i18n-tools translate-json
```

Marcas opcionales (mismas ideas que `translate-docs`): `-l` / `--locale` para un subconjunto de objetivos, `-p` / `--path` para limitar archivos, `--dry-run`, `--force` (borra el seguimiento de archivos y la caché de segmentos para los archivos coincidentes), `--force-update` (vuelve a procesar cuando el hash del archivo coincide; la caché de segmentos sigue aplicándose), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

Los proyectos solo JSON pueden ejecutar:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

Cuando también están habilitadas la interfaz de usuario o la documentación, `sync` ejecuta **translate-json después de translate-docs** (a menos que se use `--no-json`). Omita JSON con `--no-json`.

Verifique la cobertura por archivo y configuración regional:

```bash
npx ai-i18n-tools status
```

Cuando `translateJson` está activado, `status` imprime una sección `json[]` (✓ actualizada, ● obsoleta o ausente).

<a id="workflow-3-vs-other-pipelines"></a>
### Workflow 3 frente a otras canalizaciones

| Situación | Uso |
|-----------|-----|
| Cadenas de interfaz en `t("…")` / `i18n.t("…")` en JS/TS/Astro | [Workflow 1](#workflow-1---ui-translation) — `extract` + `translate-ui` |
| Traducción de páginas Markdown/MDX/`.astro` o README | [Workflow 2](#workflow-2---document-translation) — `translate-docs` |
| Catálogo `write-translations` de Docusaurus (`{ "key": { "message": "…", "description": "…" } }`) | Workflow 2 — `docs[].docusaurusCatalogDir` + `translate-docs`, **no** `json[]` |
| JSON anidado independiente por idioma (árboles `translation.json` estilo ZenBrowser) | Workflow 3 — `json[]` + `translate-json` |
| Archivos `.svg` ilustrados con `<text>` / `<title>` / `<desc>` | `features.translateSVG` + [`svg`](#svg) + `translate-svg` (opcional; no es una canalización numerada) |

Referencia de campos: [`json`](#json) en [Referencia de configuración](#configuration-reference). Las claves de caché para limpieza usan `json-block:{blockIndex}:{projectRelPath}` en `file_tracking`.

---

<a id="combined-workflow-ui--docs"></a>
## Flujo de trabajo combinado (interfaz de usuario + documentación)

Habilite todas las características en una sola configuración para ejecutar ambos flujos de trabajo juntos:

<details>
<summary>Ejemplo de configuración combinada para interfaz y documentación</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
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
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` dirige la traducción de documentos al mismo catálogo `strings.json` que la interfaz de usuario para mantener la terminología consistente; `glossary.userGlossary` añade anulaciones CSV para términos del producto.

Ejecute `npx ai-i18n-tools sync` para ejecutar una canalización: cuando `features.translateUIStrings` está habilitado, primero **extrae** y luego **traduce** las cadenas de interfaz; traducción opcional de **SVG** (bloque `features.translateSVG` + `svg`); **traducción de documentación** (según esté configurado en `docs[]`); y luego traducción opcional de **json** (`features.translateJson` + `json[]`). Omita partes con `--no-ui`, `--no-svg`, `--no-docs` o `--no-json`. Los pasos de documentación y `json[]` aceptan `--dry-run`, `-p` / `--path`, `--force` y `--force-update` (las banderas exclusivas de documentación se ignoran cuando se usa `--no-docs`; JSON utiliza las mismas banderas de caché cuando `--no-json` no está establecido).

Use `docs[].targetLocales` en un bloque para traducir los archivos de ese bloque a un subconjunto **más pequeño** que la interfaz (los idiomas efectivos para documentación son la **unión** entre bloques):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docsoutputstyle--docusaurus--flat"></a>
### Canalización mixta de documentación (`docsOutput.style = "docusaurus"` + `"flat"`)

Puede combinar varias canalizaciones de documentación en la misma configuración agregando más de una entrada en `docs`. Esta es una configuración común cuando un proyecto tiene un sitio Docusaurus (`docsOutput.style = "docusaurus"`) además de archivos markdown en el nivel raíz (por ejemplo, un README del repositorio con `docsOutput.style = "flat"`) que deben traducirse con nombres de archivo sufijados por idioma.

<details>
<summary>Ejemplo de configuración combinada de Docusaurus y README plano</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
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

- Las cadenas de interfaz se extraen/traducen desde `src/` hacia `public/locales/`.
- El primer bloque de documentación traduce **markdown** desde `docs-site/docs/` hacia `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (páginas de documentación localizadas).
- Con `docs[].docusaurusCatalogDir` configurado y `features.translateDocs` habilitado, ese mismo bloque también traduce el **JSON de la estructura de Docusaurus** bajo `docs-site/i18n/en/` a cada carpeta de idioma de destino — barra de navegación, pie de página y catálogos de temas/plugins, pero no el contenido del cuerpo MDX.
- El segundo bloque de documentación traduce `README.md` a archivos con sufijo de idioma bajo `translated-docs/` (`docsOutput.style = "flat"`).
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

El puerto de escucha predeterminado es **8675**. Si ese puerto no está disponible, el servidor intenta el siguiente puerto (hasta 1000 intentos) y registra el puerto que eligió. El alias obsoleto `editor` aún funciona, pero muestra una advertencia; se recomienda usar `dashboard`.

Esto inicia una interfaz web local respaldada por su base de datos SQLite `cacheDir` configurada — la misma carpeta que la CLI usa para segmentos de documentación, registros y metadatos relacionados. Incluye las pestañas **Documentación** (segmentos de doc en caché), **Cadenas de interfaz**, **Plurales de interfaz**, **Glosario**, **Errores**, **Problemas en Markdown** y **Estadísticas**.

![Translation Dashboard](../../docs/translation-dashboard.png)

Si **edita filas de caché** en esta aplicación (por ejemplo, segmentos de documentación), ejecute `sync --force-update` o el comando de traducción equivalente con `--force-update` para que las salidas en disco coincidan con el caché; si el **texto fuente** en el repositorio cambia más adelante, los hashes de los segmentos cambian y las ediciones manuales del texto anterior quedan obsoletas.

<a id="failures-document-translation"></a>
### Errores (traducción de documentos)

La pestaña **Errores** es exclusiva para la traducción de **documentación**. Lee los registros de fallos escritos en SQLite cuando un segmento no pudo traducirse correctamente para un idioma — por ejemplo, salida del modelo vacía o inválida, errores de validación tras la traducción (`AST mismatch`, fugas de marcadores de posición y controles de **calidad** similares), o una condición **fatal** que bloqueó el progreso. Ayuda a responder: *¿qué segmento de origen falló, para qué idioma y modelo, y qué texto de error se registró?*

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

La pestaña **Problemas de Markdown** muestra filas de la tabla `markdown_source_issues` en SQLite. Cada fila es un hallazgo **previo a la traducción**: por ejemplo, secuencias de delimitadores que nunca se emparejan como énfasis/tachado según las mismas reglas tipo CommonMark que `translate-docs` usa para el enmascaramiento, un fragmento de código en línea abierto con comillas invertidas pero nunca cerrado, o `STRONG_OUTSIDE_LINK` cuando `**` / `__` envuelven un enlace `[text](../../docs/url)` (coloque el texto en negrita solo dentro del texto del enlace). Esto **no** es lo mismo que **Errores**, que registra problemas de salida por modelo por configuración regional y validación posterior a la traducción (`AST mismatch`, fugas de marcadores de posición y similares).

Utilice esta pestaña cuando desee corregir el **markdown fuente** antes de consumir tokens, especialmente cuando las comprobaciones de calidad fallen repetidamente en la estructura. Filtre por ruta de archivo (coincidencia parcial con la clave de caché, incluyendo prefijos `doc-block:{index}:`), **código de problema** o **hash fuente**; ordene por ruta de archivo + línea o por la hora más reciente de escaneo. El botón de enlace registra sugerencias de archivo/línea en la terminal donde se está ejecutando `ai-i18n-tools dashboard` (misma idea que en la pestaña Documentación).

**Actualización de filas:** ejecute `ai-i18n-tools check-markdown` (ámbito opcional `-p` / `--path`, `--no-cache` para omitir SQLite, `--json` para salida legible por máquina en stdout con líneas legibles por humanos en stderr). De forma predeterminada, cada archivo markdown `translate-docs` ejecutado también vuelve a escanear y reemplaza las filas de ese archivo cuando `docs[].warnMarkdownSourceIssues` no está configurado en `false`. Borrar todas las traducciones de una ruta de archivo de caché elimina las filas de problemas de markdown para esa ruta de archivo como parte de la misma ruta de limpieza que los errores. `cleanup` además purga las filas de problemas de markdown cuya ruta de origen resuelta falta en el disco, por lo que los diagnósticos de archivos eliminados o renombrados (incluso los que solo fueron escaneados por `check-markdown`, nunca traducidos) no persisten.

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

<a id="uilanguage-optional"></a>
### `uiLanguage` (opcional)

Código BCP-47 para el idioma de la interfaz de usuario de la herramienta (ayuda de la CLI, registros/resúmenes y el Panel de traducción). Es independiente de `sourceLocale` / `targetLocales`, y se anula mediante el indicador `-L` / `--ui-lang` y la variable de entorno `AI_I18N_LANG`. Los valores desconocidos se degradan de forma segura al idioma de origen (`en-GB`), no hay validación estricta. Consulte [Idioma de la interfaz de usuario de la herramienta](#tool-ui-language).

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (opcional)

Ruta al manifiesto `ui-languages.json` utilizado para nombres mostrados, filtrado por configuración regional y postprocesamiento de listas de idiomas. Si se omite, la CLI busca el manifiesto en `ui.flatOutputDir/ui-languages.json`.

Utiliza esto cuando:

- El manifiesto está fuera de `ui.flatOutputDir` y debe indicar explícitamente la CLI.
- Desea [post-procesado del selector de idioma](#language-switcher-languagelistblock) (`languageListBlock`) para generar etiquetas de idioma a partir del manifiesto.
- `extract` debería fusionar entradas `englishName` del manifiesto en `strings.json` (requiere `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

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
### `provider` y `providers`

`provider` (nivel superior, opcional) selecciona la clave del proveedor activo de `providers`. Es opcional cuando se configura exactamente un proveedor; es obligatorio cuando se configuran más de uno.

`providers` (nivel superior) mapea una clave de proveedor a su bloque. Las claves integradas (ver la tabla de preajustes a continuación) solo necesitan `translationModels`; cualquier otra clave define un endpoint personalizado compatible con OpenAI y requiere `baseUrl` (más `apiKeyEnv` a menos que el endpoint no necesite clave).

Cada bloque de `providers.<name>` acepta:

- `translationModels`
  Lista ordenada preferida de IDs de modelos (IDs directos del upstream, sin prefijo `provider/`; los IDs de OpenRouter conservan su forma nativa de `vendor/model`). El primero se intenta primero; las entradas posteriores son de respaldo en caso de error. Solo para `translate-ui`, también puedes establecer `ui.preferredModel` para intentar un modelo antes de esta lista (ver `ui`).
- `baseUrl`
  URL base compatible con OpenAI. Anula la URL base preestablecida; es obligatorio para un proveedor no preestablecido.
- `apiKeyEnv`
  Variable de entorno que contiene la clave API. Anula la variable de entorno preestablecida.
- `headers`
  Encabezados HTTP adicionales enviados con cada solicitud a este proveedor.
- `maxTokens`
  Tokens de finalización máximos por solicitud. Predeterminado: `8192`.
- `temperature`
  Temperatura de muestreo. Predeterminado: `0.2`.
- `requestTimeoutMs`
  Tiempo máximo en milisegundos para esperar cada solicitud. Predeterminado: `30000` (30 segundos).

Presets de proveedores integrados (clave — URL base — variable de entorno de clave API):

| Proveedor | URL base | Variable de entorno de clave API |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (ninguno) |

Todavía se acepta un bloque `openrouter` de nivel superior heredado (con `baseUrl`, `translationModels`, `defaultModel`, `fallbackModel`, `maxTokens`, `temperature`, `requestTimeoutMs`) y se migra automáticamente a `providers.openrouter` (con `provider: "openrouter"`) al cargarlo; `defaultModel` / `fallbackModel` se pliegan en `translationModels`.

Para ver un ejemplo ejecutable que configura varios proveedores en una sola configuración y cambia entre ellos con `-P`, consulta [`examples/multi-provider`](../../docs/../examples/multi-provider/) (`openai`, `anthropic`, `nvidia` y `deepseek` en el mismo documento).

**Por qué usar múltiples modelos:** Diferentes proveedores y modelos tienen costos variables y ofrecen diferentes niveles de calidad entre idiomas y locales. Configura `translationModels` **como una cadena de respaldo ordenada** (en lugar de un solo modelo) para que la CLI pueda intentar el siguiente modelo si una solicitud falla.

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

Establece la variable de entorno de la clave API del proveedor activo (ej. `OPENROUTER_API_KEY`) en tu entorno o archivo `.env`.

Antes de cambiar `translationModels`, ejecuta `npx ai-i18n-tools check-models`. Para cualquier proveedor, verifica cada ID de modelo configurado contra la lista actual de modelos del proveedor (`GET /models`), informa los IDs que faltan o que han superado `expiration_date`, enumera los modelos válidos y finaliza con un código distinto de cero si algún ID configurado no es válido. Cuando el proveedor devuelve precios (por ejemplo, OpenRouter), también muestra el costo estimado de entrada/salida (dólares estadounidenses por cada millón de tokens).

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
  Directorios o patrones glob (relativos a cwd) escaneados para llamadas a `t("…")`. Admite patrones como `src/` o `["src/**/*.ts"]`.
- `stringsJson`  
  Ruta al archivo maestro del catálogo. Actualizado por `extract`.
- `flatOutputDir`  
  Directorio donde se escriben los archivos JSON por locale (`de.json`, etc.).
- `preferredModel`  
  Opcional. ID del modelo que se intenta primero solo para `translate-ui`; luego los `translationModels` del proveedor activo en orden, sin duplicar este ID.
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
Directorio de caché SQLite (compartido por todos los bloques `docs`). Reutilizable entre ejecuciones. Si estás migrando desde una caché personalizada de traducción de documentos, archívala o elimínala — `cacheDir` crea su propia base de datos SQLite y no es compatible con otros esquemas.

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

<a id="docs"></a>
### `docs`

Matriz de bloques del pipeline de documentación. `translate-docs` y la fase de documentación de `sync` **procesan cada** bloque en orden. Las claves heredadas (`documentations`, `markdownOutput`, `jsonSource`) aún se aceptan en tiempo de carga y se reescriben cuando el archivo de configuración es modificable; se recomienda usar `docs`, `docsOutput` y `docusaurusCatalogDir` en configuraciones nuevas.

**Fuentes de contenido**

- `description`
Nota opcional legible para humanos sobre este bloque (no se usa para traducción). Se antepone en el encabezado `translate-docs` `🌐` cuando se establece; también se muestra en los encabezados de sección de `status`.
- `contentPaths`
Cuerpos de páginas en Markdown/MDX y plantillas `.astro` a traducir (`translate-docs` analiza estos en busca de `.md`, `.mdx` y `.astro`). Admite **rutas de directorio o patrones globales** (por ejemplo, `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). De ahí proviene la documentación localizada.
- `sourceFiles`
Alias opcional que se fusiona en `contentPaths` en tiempo de carga.
- `targetLocales`
Subconjunto opcional de configuraciones regionales solo para este bloque (en caso contrario, se usa la raíz `targetLocales`). Las configuraciones regionales efectivas de la documentación son la unión entre todos los bloques.
- `docusaurusCatalogDir`
Opcional. Directorio fuente para catálogos de etiquetas JSON de Docusaurus para este bloque (por ejemplo, `"i18n/en"` de `docusaurus write-translations`). Los cuerpos de página siempre provienen de `contentPaths`; `docusaurusCatalogDir` solo proporciona JSON de interfaz/estructura, no MDX.

**Estructura de salida**

- `outputDir`
Directorio raíz para la salida traducida de este bloque.
- `docsOutput.style`
`"nested"` (por defecto), `"flat"`, `"doc-system"`, o alias `"docusaurus"` / `"astro-starlight"`.
- `docsOutput.localeSubpath`
Segmento de ruta entre `{locale}/` y `{relativeToDocsRoot}` para `doc-system` (requerido al usar `style: "doc-system"` directamente; preestablecido al usar un alias). Usa `""` para carpetas de configuración regional al estilo Starlight.
- `docsOutput.docsRoot`
Raíz de documentación fuente para el diseño de Docusaurus (por ejemplo, `"docs"`).
- `docsOutput.pathTemplate`
Ruta personalizada de salida en markdown. Marcadores de posición: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
Ruta personalizada de salida JSON para archivos de etiquetas. Admite los mismos marcadores de posición que `pathTemplate`.
- `docsOutput.localePathLowercase`
Cuando `true`, los diseños de salida integrados (`nested`, `flat`, `doc-system` sin `pathTemplate`) usan segmentos de configuración regional en minúsculas en las rutas. Valor predeterminado `false`; `astro-starlight` y `doc-system` con `localeSubpath` vacío por defecto toman el valor `true` al cargar la configuración.
- `docsOutput.flatPreserveRelativeDir`
Cuando `docsOutput.style = "flat"`, conserva los subdirectorios fuente para que los archivos con el mismo nombre no entren en conflicto.
- `docsOutput.rewriteRelativeLinks`
Reescribe enlaces relativos tras la traducción (activado automáticamente cuando `docsOutput.style = "flat"` y no hay `pathTemplate` personalizado).
- `docsOutput.linkRewriteDocsRoot`
Raíz del repositorio usada al calcular prefijos de reescritura de enlaces planos. Normalmente déjalo como `"."` a menos que tus documentos traducidos estén bajo una raíz de proyecto diferente.

**Posprocesado**

- `docsOutput.postProcessing`
Transformaciones opcionales sobre el **cuerpo markdown traducido** (se conservan las claves YAML y los valores no textuales del front matter). Se ejecuta tras la recombinación de segmentos y la reescritura de enlaces planos, y antes de `addFrontmatter`.
- `docsOutput.postProcessing.regexAdjustments`
Lista ordenada de `{ "description"?, "search", "replace" }`. `search` es un patrón regex (una cadena simple usa la bandera `g`, o `/pattern/flags`). `replace` admite marcadores de posición como `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — regenera una fila acotada de enlaces "leer en otros idiomas" en el markdown fuente y traducido. Consulta [Selector de idioma (`languageListBlock`)](#language-switcher-languagelistblock) para configuración, comportamiento y ejemplos de repositorios.

**Comportamiento y metadatos**

- `translateFrontmatterFields`
Mismo nivel que `docsOutput` (por bloque `docs[]`). Valor predeterminado `true`: traduce el texto YAML orientado al usuario para Starlight/Docusaurus (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next` etiquetas). Establezca `false` para mantener sin cambios todo el bloque de front matter; pase un array de cadenas para restringirlo a rutas específicas con punto.
- `segmentSplitting`
Mismo nivel que `docsOutput` (por bloque `docs[]`). Segmentos opcionales más detallados para la extracción de `translate-docs`: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`. Cuando `enabled` es `true` (valor predeterminado cuando se omite `segmentSplitting`), los párrafos densos, las tablas GFM con barras (el primer fragmento incluye encabezado, separador y primera fila de datos) y las listas largas se dividen; las subpartes se vuelven a unir con un solo salto de línea (`tightJoinPrevious`). Establezca `"enabled": false` para usar un segmento por bloque del cuerpo delimitado por líneas en blanco únicamente. Cuando `qualityRetrySplit` es `true` (valor predeterminado), los segmentos de markdown que fallen en la validación AST tras agotar todos los modelos se dividen progresivamente y se vuelven a intentar desde el primer modelo; `maxQualityRetrySplitDepth` (valor predeterminado `3`) limita las divisiones recursivas.
- `warnMarkdownSourceIssues`
Cuando `true` (valor predeterminado si se omite), cada ejecución de `translate-docs` vuelve a escanear los segmentos de markdown en busca de delimitadores peligrosos o fragmentos de código en línea no cerrados, muestra advertencias en la terminal y actualiza las filas `markdown_source_issues` para la ruta de archivo en caché de ese archivo. Establezca `false` para omitir advertencias y actualizaciones en SQLite para este bloque.
- `addFrontmatter`
Cuando `true` (valor predeterminado si se omite), los archivos de markdown traducidos incluyen claves YAML: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, y cuando al menos un segmento tiene metadatos del modelo, `translation_models` (lista ordenada de identificadores de modelos de OpenRouter utilizados). Establézcalo en `false` para omitirlos.

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

**Ejemplo (`docsOutput.style = "flat"` — rutas de capturas de pantalla + contenedor opcional con lista de idiomas):**

<details>
<summary>Ejemplo de postprocesamiento con diseño plano (capturas de pantalla + bloque de lista de idiomas)</summary>

```json
"docsOutput": {
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

<a id="json"></a>
### `json`

Array de nivel superior con canalizaciones JSON anidadas de traducción. Se utiliza únicamente cuando `features.translateJson` es verdadero (`translate-json` o la etapa JSON de `sync`). Consulte [Flujo de trabajo 3 - Traducción de archivos JSON](#workflow-3---json-file-translation).

| Campo | Descripción |
|-------|-------------|
| `description` | Nota opcional para CLI / `status` (no se traduce). |
| `contentPaths` | Archivos, directorios o patrones `.json` de origen bajo la raíz del proyecto. |
| `outputPathTemplate` | Ruta de salida requerida por configuración regional de destino. Marcadores de posición: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`. |
| `targetLocales` | Subconjunto opcional para este bloque; en caso contrario, raíz `targetLocales`. |
| `keyPolicy.mode` | `allowlist`, `denylist` o `both`. |
| `keyPolicy.translateKeys` | Rutas con notación de puntos o patrones glob a incluir cuando el modo es `allowlist` o `both`. |
| `keyPolicy.skipKeys` | Rutas con notación de puntos o patrones glob a excluir (la lista de denegación predeterminada incluye `id`, `slug`, `href`, `url`, `key`, `code`). |

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
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website\|ui-json-bundles] [-o path] [--with-translate-ignore]` | Escribe un archivo de configuración inicial (incluye `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` y `docs[].addFrontmatter`). `ui-json-bundles` estructura el Flujo de trabajo 3 (solo `json[]`). `--with-translate-ignore` crea un `.translate-ignore` inicial.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `check-models`                                                                                             | Valida cada ID de modelo configurado contra la lista `GET /models` del proveedor activo (pertenencia y `expiration_date`), requiere la clave API de ese proveedor (ninguna para proveedores sin clave como Ollama), finaliza con un código distinto de cero si algún ID configurado falta o ha expirado, y respeta el `requestTimeoutMs` del proveedor. Cuando el proveedor devuelve precios (por ejemplo, OpenRouter), también muestra el costo en dólares estadounidenses por cada millón de tokens para indicación y finalización.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `list-models`                                                                                              | Enumera todos los modelos que el proveedor activo anuncia mediante su lista `GET /models` (ordenados por ID; el proveedor activo sigue la clave de configuración `provider`, se puede anular con `-P` / `--provider`). Requiere la clave API del proveedor correspondiente (ninguna para proveedores sin clave como Ollama). Cuando el proveedor devuelve precios (por ejemplo, OpenRouter), también muestra el costo en dólares estadounidenses por cada millón de tokens para indicación y finalización, y etiqueta las entradas que han superado `expiration_date`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `list-languages [search]`                                                                                  | Muestra el catálogo de idiomas de la interfaz incluidos (`data/ui-languages-complete.json`) como una tabla legible (código, dirección del texto, nombre en inglés, nombre nativo); no requiere configuración ni clave API. Pasa un término opcional `search` para conservar solo las entradas cuyo código, nombre nativo, nombre en inglés o dirección lo contengan (sin distinguir mayúsculas y minúsculas), por ejemplo `list-languages portuguese`, `list-languages rtl`, `list-languages zh`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `extract`                                                                                                  | Actualiza `strings.json` a partir de literales de `t("…")` / `i18n.t("…")`, descripción opcional de `package.json` y entradas opcionales del manifiesto `englishName` (ver `ui.reactExtractor`). Cuando `.html` / `.htm` se listan en `ui.uiExtractor.extensions`, también captura cadenas de marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` de HTML. Requiere `ui.sourceRoots` no vacío. No llama a una LLM.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `mark-html [paths...] [--write]`                                                                           | Inserta marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` sin formato en HTML para que el texto fuente se escriba una vez (en el propio elemento). Escanea los archivos/directorios/globos dados (por defecto: `.html` / `.htm` bajo `ui.sourceRoots`). Ejecución de prueba por defecto (informa recuentos de adiciones por archivo y cualquier elemento de contenido mixto que necesite una `<span data-i18n>` manual); `--write` aplica los cambios. Idempotente, respeta `data-i18n-ignore` (omite el elemento y su subárbol), nunca toca elementos similares a código (`code`, `pre`, `kbd`, `samp`, `var`) ni texto vacío/solo numérico, y nunca emite un marcador con valor. No llama a un LLM.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `generate-ui-languages [--master <path>] [--dry-run]`                                    | Escribe `ui-languages.json` en `ui.flatOutputDir` (o en `uiLanguagesPath` si está establecido) usando `sourceLocale` + `targetLocales` y el `data/ui-languages-complete.json` incluido (o `--master`). Emite advertencias y marcadores `TODO` para configuraciones regionales que falten en el archivo maestro. Si ya tienes un manifiesto con valores personalizados de `label` o `englishName`, estos serán reemplazados por los valores predeterminados del catálogo maestro; revisa y ajusta el archivo generado después.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                                         | Traduce markdown/MDX y JSON para cada bloque `docs` (`contentPaths`, `docusaurusCatalogDir` opcional). `-j`: número máximo de localizaciones en paralelo; `-b`: número máximo de llamadas API por lotes en paralelo por archivo. `--prompt-format`: formato de datos por lotes (`xml` \| `json-array` \| `json-object`). Consulta [Comportamiento de caché y banderas `translate-docs`](#cache-behaviour-and-translate-docs-flags) y [Formato de solicitud por lotes](#batch-prompt-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …`                                                                                      | Requiere al menos un bloque `docs[]`. Recopila `.md` / `.mdx` bajo el `contentPaths` de cada bloque (respeta `.translate-ignore`). Inserta una línea de anclaje HTML `<a id="slug"></a>` inmediatamente **antes** de cada encabezado ATX plano `#` (omite encabezados dentro de bloques de código con marcas); cuando ya existe una línea de anclaje, actualiza el `id` si ya no coincide con el slug derivado del texto actual del encabezado. `-p` / `--path` o `-f` / `--file`: limita a un archivo o directorio relativo al proyecto. `--slug-style`: `github` (predeterminado; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Con `pymdown`, `--pymdown-case` opcional, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run`: muestra solo los cambios.                                                                                                                                                                                                                                                                                                                                    |
| `check-markdown …`                                                                                         | Analiza el markdown/MDX dentro del `docs[]` de cada bloque `contentPaths` (mismo descubrimiento que `translate-docs`, respeta `.translate-ignore`): emparejamiento de delimitadores, código en línea sin cerrar y `STRONG_OUTSIDE_LINK` cuando `**`/`__` envuelven un enlace `[text](../../docs/url)`. `-p` / `--path` o `-f` / `--file`: ámbito opcional. Imprime líneas `relativePath:line: [ISSUE_CODE] message` en **stderr**; código de salida **1** si hay algún problema. `--json`: informe JSON en **stdout**. Escribe `markdown_source_issues` en `cacheDir` a menos que `--no-cache`. `-v` añade hashes del código fuente a las líneas de stderr.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                        | Traduce archivos SVG configurados en `config.svg` (separado de la documentación). Requiere `features.translateSVG`. Mismas ideas de caché que en la documentación; admite `--no-cache` para omitir lecturas/escrituras de SQLite en esa ejecución. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                               | Traduce solo cadenas de interfaz de usuario (`strings.json` → JSON de configuración regional). `-l` / `--locale`: configuraciones regionales de destino separadas por comas (predeterminado del archivo de configuración / `ui-languages.json`). `--force`: vuelve a traducir todas las entradas por configuración regional (ignora traducciones existentes). `--dry-run`: sin escrituras, sin llamadas a API. `-j`: número máximo de configuraciones regionales en paralelo. Requiere `features.translateUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `translate-json …`                                                                                         | Traduce JSON anidado según `json[]` (requiere `features.translateJson`). Caché compartida de SQLite; `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`. Consulta [Flujo de trabajo 3](#workflow-3---json-file-translation).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                      | Extrae y luego traduce las cadenas de interfaz (requiere `features.translateUIStrings`). Solo interfaz — sin documentación, SVG ni `json[]`. Mismas opciones `-l`, `--force`, `--dry-run` y `-j` que `translate-ui`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                      | Ejecuta `extract` **primero** (requiere `features.translateUIStrings`) para que `strings.json` coincida con la fuente, luego revisión de LLM de las cadenas de UI del **idioma de origen** (ortografía, gramática). Las **sugerencias de terminología** provienen solo del CSV de `glossary.userGlossary` (mismo alcance que `translate-ui` — no `strings.json` / `uiGlossary`, por lo que las malas copias no se refuerzan como glosario). Usa el proveedor LLM activo (su variable de entorno de clave API). Solo informativo (sale con **0** cuando se completa la ejecución). Escribe `lint-source-results_<timestamp>.log` bajo `cacheDir` como un informe **legible por humanos** (resumen, problemas y filas **OK** por cadena); la terminal imprime solo los recuentos del resumen y los problemas (sin líneas `[ok]` por cadena). Imprime el nombre del archivo de registro en la última línea. `--json`: informe JSON completo legible por máquina solo en stdout (el archivo de registro permanece legible por humanos). `--dry-run`: aún ejecuta `extract`, luego imprime solo el plan de lotes (sin llamadas API). `--chunk`: cadenas por lote de API (predeterminado **50**). `-j`: lotes paralelos máximos (predeterminado `concurrency`). Con `--json`, la salida de estilo humano va a stderr. Los enlaces usan `path:line` como las cadenas de UI de `dashboard` del botón “enlace”. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`              | Exportar `strings.json` a XLIFF 2.0 (una `.xliff` por configuración regional de destino). `-o` / `--output-dir`: directorio de salida (predeterminado: misma carpeta que el catálogo). `--untranslated-only`: solo unidades que carecen de traducción para esa configuración regional. Solo lectura; sin API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                                   | Extracción (si está habilitada), luego traducción de la interfaz de usuario, luego `translate-svg` cuando `features.translateSVG` y `config.svg` están establecidos, luego traducción de la documentación, luego `translate-json` cuando `features.translateJson` y `json[]` están establecidos, a menos que se omita con `--no-ui`, `--no-svg`, `--no-docs` o `--no-json`. Marcas compartidas: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (documentación y agrupación JSON), `--force` / `--force-update` (documentación y JSON). La fase de documentación también transmite `--emphasis-placeholders` y `--debug-failed` (mismo significado que `translate-docs`). `--prompt-format` no es una marca `sync`; los pasos de documentación y JSON usan el valor predeterminado integrado (`json-array`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `status [--max-columns <n>]`                                                             | Cuando `features.translateUIStrings` está activado, imprime la cobertura de la interfaz de usuario por configuración regional (`Translated` / `Missing` / `Total`). Luego imprime el estado de traducción de markdown por archivo × configuración regional (sin filtro `--locale`; las configuraciones regionales provienen de la configuración). Listas grandes de configuraciones regionales se dividen en tablas repetidas de hasta `n` columnas de configuraciones regionales (predeterminado **9**) para mantener las líneas estrechas en la terminal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                         | Muestra la caché de documentación y las estadísticas de `strings.json` (agregados iguales a los del Panel de traducción → **Estadísticas**). `--max-columns`: número máximo de columnas por configuración regional × tabla de configuraciones regionales (por defecto coincide con el panel).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--backup <path>]`                                                      | Ejecuta `sync --force-update` primero (extraer, UI, SVG, documentos), luego elimina filas de segmentos obsoletas (`last_hit_at` nulo / ruta de archivo vacía); elimina filas `file_tracking` cuya ruta de origen resuelta falta en el disco; elimina filas de traducción cuyos metadatos `filepath` apuntan a un archivo que falta; poda filas `translation_failures` huérfanas; poda filas `markdown_source_issues` huérfanas cuya ruta de origen resuelta falta en el disco. Registra cinco recuentos (segmentos obsoletos, `file_tracking` huérfanos, traducciones huérfanas, fallos huérfanos, problemas de markdown huérfanos). No se realiza una copia de seguridad de SQLite a menos que se pase `--backup <path>`, que escribe una copia de seguridad en esa ruta antes de las modificaciones.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                               | **Sin configuración.** Recorre un árbol de directorios (por defecto: directorio actual) en busca de `*.log` y `cache.db.backup*.sqlite`, muestra rutas `./…` como `find -print`. Si hay coincidencias: solicita confirmación `Delete these files? (y/n)` a menos que `-f` / `--force` (eliminar sin confirmación). Si no hay coincidencias: sale sin solicitar confirmación. `--dry-run`: solo lista, sin solicitar confirmación ni eliminar (anula `--force`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                                        | Inicia el Panel de Traducción (interfaz web local para segmentos de caché, `strings.json`, glosario, errores y estadísticas). Puerto predeterminado **8675** (intenta el siguiente puerto si no está disponible). Con `--no-open`, el navegador predeterminado no se abre automáticamente. El alias obsoleto `editor` aún funciona, pero muestra una advertencia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `glossary-generate [-o <path>]`                                                          | Escribe una plantilla `glossary-user.csv` vacía. `-o`: sobrescribe la ruta de salida (predeterminada: `glossary.userGlossary` del archivo de configuración, o `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                         | Muestra la ayuda para un subcomando (igual que la salida de `ai-i18n-tools <command> --help`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

<a id="root-and-global-options"></a>
### Opciones raíz y globales

| Opción                       | Alcance         | Descripción                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | Programa raíz  | Muestra el número de versión y la marca de tiempo de compilación (misma información que el subcomando `version`). |
| `-h` / `--help`              | Programa raíz  | Muestra la ayuda para el programa raíz o para un subcomando cuando se usa con un nombre de comando.      |
| `-c` / `--config <path>`     | Todos los comandos | Ruta del archivo de configuración (por defecto: `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | Todos los comandos | Registro detallado (verbose logging).                                                                          |
| `-P` / `--provider <name>`   | Cada comando | Proveedor de LLM activo para esta ejecución; anula la clave `provider` de la configuración. Debe configurarse en `providers`. |
| `-L` / `--ui-lang <code>`    | Cada comando | Idioma de la interfaz de usuario de la herramienta (ayuda de la CLI, registros/resúmenes, panel); fuente de mayor prioridad. Consulte [Idioma de la interfaz de usuario de la herramienta](#tool-ui-language). |
| `-w` / `--write-logs [path]` | Todos los comandos | Redirige la salida de la consola a un archivo `.log` (ruta por defecto: dentro de `cacheDir`).                |

<a id="per-command-help"></a>
### Ayuda por comando

| Uso                            | Descripción                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | Todas las opciones para ese comando.      |
| `ai-i18n-tools help <command>`   | Mismo resultado que `<command> --help`. |

<a id="target-locales--l----locale"></a>
### Configuraciones regionales de destino (`-l` / `--locale`)

| Comandos                                                                                | Comportamiento                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — códigos BCP-47 separados por comas (por ejemplo, `de,fr,pt-BR`). Si se omite, se toman los valores predeterminados de la configuración (los bloques `json[]` también pueden establecer `targetLocales` por bloque). Los pasos de interfaz de usuario también usan `ui-languages.json`. |
| `lint-source`                                                                           | `-l` / `--locale <code>` — idioma fuente único para revisar (por defecto: `sourceLocale` del archivo de configuración).                                                            |

---

<a id="environment-variables"></a>
## Variables de entorno

| Variable               | Descripción                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | Clave API para el proveedor `openrouter` (requerida cuando está activo). |
| Otras claves de proveedor    | Cada proveedor lee su propia variable de entorno de clave: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama no necesita ninguna). Anula por proveedor con `providers.<name>.apiKeyEnv`. |
| `OPENROUTER_BASE_URL`  | Anula `providers.openrouter.baseUrl` (solo cuando ese proveedor está configurado). |
| `OLLAMA_BASE_URL`      | Anula `providers.ollama.baseUrl` (solo cuando ese proveedor está configurado). |
| `AI_I18N_LANG`         | Idioma de la interfaz de usuario de la herramienta (ayuda de la CLI, registros, panel). Anulado por `-L` / `--ui-lang`; anula la configuración `uiLanguage`. Consulte [Idioma de la interfaz de usuario de la herramienta](#tool-ui-language). |
| `I18N_SOURCE_LOCALE`    | Anula `sourceLocale` en tiempo de ejecución.               |
| `I18N_TARGET_LOCALES`   | Códigos de configuración regional separados por comas para anular `targetLocales`.  |
| `I18N_LOG_LEVEL`        | Nivel del registrador (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | Cuando vale `1`, desactiva los colores ANSI en la salida del registro.             |
| `I18N_LOG_SESSION_MAX`  | Número máximo de líneas guardadas por sesión de registro (por defecto `5000`).           |

Al inicio, la CLI también carga automáticamente un archivo `.env` desde el directorio de trabajo actual (a través de `process.loadEnvFile` de Node), por lo que las claves API del proveedor se capturan en shells no interactivos que no cargan `.envrc` / `direnv`. Las variables que ya están presentes en el entorno nunca se anulan, por lo que los valores reales de CI/producción siguen teniendo prioridad.

---

<a id="tool-ui-language"></a>
## Idioma de la interfaz de usuario de la herramienta

La herramienta localiza su propia interfaz de usuario —texto de ayuda de la CLI, mensajes de registro/resumen/error de alto tráfico y el Panel de traducción— independientemente de `sourceLocale` / `targetLocales` de su proyecto. La configuración regional de la interfaz de usuario se resuelve a partir de las siguientes fuentes, en orden de prioridad:

1. Indicador global `-L` / `--ui-lang <code>` (por ejemplo, `-L pt-BR`).
2. Variable de entorno `AI_I18N_LANG` (por ejemplo, `export AI_I18N_LANG=es`).
3. La clave de configuración `uiLanguage` en `ai-i18n-tools.config.json` (cadena BCP-47).
4. La locale del sistema operativo anfitrión (a través de `Intl.DateTimeFormat().resolvedOptions().locale`).

La configuración regional solicitada se compara exactamente con los idiomas de interfaz de usuario distribuidos o por la variación más cercana (por ejemplo, `pt-PT` se resuelve en `pt-BR`, y `en-US` se resuelve en `en-GB`); cuando nada coincide, recurre a la configuración regional de origen (`en-GB`). Cuando se solicita explícitamente un idioma de interfaz de usuario (a través del indicador, la variable de entorno o `uiLanguage`) pero no coincide ningún paquete distribuido, la CLI imprime una advertencia única de que se utilizará la configuración regional predeterminada; una configuración regional inferida solo del sistema operativo anfitrión nunca advierte.

Idiomas de interfaz de usuario distribuidos: `en-GB` (origen) más `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans` y `zh-Hant`. El Panel de traducción lee la configuración regional resuelta, la dirección del diseño y el paquete de traducción de `GET /api/ui-i18n` y los aplica al cargar (establece `<html lang>` / `dir` y localiza el marcado estático a través de los atributos `data-i18n*`). Esta función no requiere ninguna configuración; de forma predeterminada, la herramienta sigue la configuración regional de su sistema operativo.
