<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![Versión de npm](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Descargas de npm](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Licencia: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

Una CLI y kit de herramientas para internacionalizar aplicaciones y sitios de documentación en JavaScript/TypeScript utilizando modelos de lenguaje grandes a través de [OpenRouter](https://openrouter.ai/). Tres flujos de trabajo modulares, todos compartiendo un único archivo de configuración, que cubren distintas necesidades de traducción:

- **Flujo de trabajo 1 — Traducción de interfaz:** Extrae llamadas `t("…")` de JS/TS (y opcionalmente de archivos `.astro`) y genera JSON plano por idioma para búsquedas en i18next o SSG estático.
- **Flujo de trabajo 2 — Traducción de documentos:** Traduce páginas en markdown, MDX y `.astro` (para sitios web y Starlight) listadas en `docs[].contentPaths` usando `translate-docs`.
- **Flujo de trabajo 3 — Traducción de archivos JSON:** Traduce paquetes JSON anidados arbitrarios definidos en `json[]`. Use `translate-json` cuando el texto de la interfaz esté almacenado en archivos JSON por idioma en lugar de usar `t()` en el código fuente.

Los recursos **SVG** se traducen usando `features.translateSVG`, el bloque `svg` de nivel superior y `translate-svg`—no `docs[].contentPaths`.

**¿Qué flujo de trabajo debo usar?**
- El código fuente usa `t()` → **Flujo de trabajo 1** (`extract` / `translate-ui`)
- Páginas localizadas o JSON del catálogo de Docusaurus → **Flujo de trabajo 2** (`translate-docs`)
- Solo archivos de idioma JSON independientes y anidados → **Flujo de trabajo 3** (`translate-json`)

Todos los flujos de trabajo mantienen una caché en archivo o SQLite para asegurar que solo se envíen al LLM segmentos nuevos o modificados (cadenas o fragmentos de texto).

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabla de contenido**

- [Flujos de trabajo principales](#core-workflows)
- [Instalación](#installation)
  - [Uso del CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [Inicio rápido](#quick-start)
  - [Flujo de trabajo 1 - Traducción de interfaz](#workflow-1---ui-translation)
  - [Flujo de trabajo 2 - Traducción de documentos](#workflow-2---document-translation)
  - [Astro (Astro estándar y Starlight)](#astro-plain-astro--starlight)
  - [Flujo combinado](#combined-workflow)
- [Ayudantes en tiempo de ejecución](#runtime-helpers)
- [Comandos CLI](#cli-commands)
- [Documentación](#documentation)
- [Licencia](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## Flujos de trabajo principales

**Flujo de trabajo 1 - Traducción de interfaz** — para cualquier proyecto JS/TS que use i18next (React, Next.js, Node.js, CLIs) o SSG estático de Astro

Analiza archivos fuente en busca de literales `t("…")` / `i18n.t("…")` (agregue `.astro` a `ui.uiExtractor.extensions` para frontmatter de Astro y expresiones de plantilla), construye un catálogo maestro (`strings.json`), traduce entradas faltantes por idioma mediante OpenRouter y genera archivos JSON planos (`de.json`, `pt-BR.json`, …). El texto fuente en inglés es la clave de búsqueda en tiempo de ejecución en esos paquetes — `strings.json` es la caché de extracción, no el paquete usado en tiempo de ejecución.

**Flujo de trabajo 2 - Traducción de documentos** — para markdown, MDX y `.astro` bajo `docs[].contentPaths`

Diseñado principalmente para documentación en **markdown, MDX y `.astro`** (Docusaurus, [Astro Starlight](https://starlight.astro.build/), archivos README simples y páginas de marketing en Astro). `translate-docs` genera copias localizadas con una caché compartida en SQLite. En sitios Docusaurus, configure `docs[].docusaurusCatalogDir` con la carpeta del catálogo `write-translations` para que el JSON del shell (menú de navegación, pie de página, cadenas del tema) se traduzca con el mismo comando. `docs[].docsOutput.style` admite `"nested"`, `"flat"`, `"doc-system"` y alias `"docusaurus"` / `"astro-starlight"` (consulte [Diseños de salida](docs/GETTING_STARTED.es.md#output-layouts) en Introducción). Los archivos JSON anidados arbitrarios de interfaz que no sean un catálogo de Docusaurus deben ir en el flujo de trabajo 3 (`json[]` / `translate-json`), no en `docs[]`.

**Flujo de trabajo 3 - Traducción de archivos JSON** — archivos JSON de idioma anidados sin `t()` en el código fuente

Traduce archivos como `src/i18n/en/translation.json` mediante `json[]` de nivel superior, `features.translateJson` y `translate-json`. Cree la estructura con `init -t ui-json-bundles`.

Todos los flujos de trabajo comparten `ai-i18n-tools.config.json` y pueden combinarse; `sync` ejecuta extracción, traducción de interfaz, traducción de SVG, `translate-docs` y `translate-json` en orden según las banderas definidas en `features`.

---

<a id="installation"></a>
## Instalación

El paquete publicado es solo **ESM** (`"type": "module"`). Requiere Node.js `>=22.16.0`.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### Uso de la CLI

**Por proyecto (recomendado)** — instalar como dependencia de desarrollo, luego ejecutar mediante `npx`, `pnpm exec` o un script `package.json`:

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

También puedes usar directamente los comandos de la CLI ai-i18n-tools, por ejemplo `ai-i18n-tools sync`.

Prefiera `sync` en lugar de encadenar manualmente `extract`, `translate-ui`, `translate-svg`, `translate-docs` y `translate-json` — el orden y las banderas de funciones son fáciles de equivocar cuando se ejecutan manualmente. Consulte [Scripts recomendados `package.json`](docs/GETTING_STARTED.es.md#recommended-packagejson-scripts) en Introducción.

**Ejecución única sin instalación** — usar `npx ai-i18n-tools <cmd>` o `pnpm dlx ai-i18n-tools <cmd>` (descarga solo para esa ejecución).

> **Consejo:** Para ejecutar `ai-i18n-tools` directamente en una terminal interactiva sin `npx`, añada `node_modules/.bin` a su `PATH` (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). Consulte [Comenzando](docs/GETTING_STARTED.es.md#installation) para instrucciones sobre direnv y Windows.

Establece tu clave de API de OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

Los comandos que llaman a OpenRouter (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models` y scripts relacionados) necesitan `OPENROUTER_API_KEY` en el entorno. `check-markdown` no utiliza OpenRouter.

En `ai-i18n-tools.config.json`, el objeto `openrouter` incluye listas de modelos, `baseUrl`, `maxTokens`, `temperature` y `requestTimeoutMs`: el tiempo máximo en milisegundos que se espera por cada solicitud HTTP a OpenRouter (complementos de chat y llamadas internas `GET /models`). El valor predeterminado es `30000` (30 segundos).

Ejecuta `ai-i18n-tools check-models` para verificar cada id de modelo configurado contra el catálogo en vivo de OpenRouter. Informa los ids que faltan o que han pasado `expiration_date`, lista los modelos válidos con precios estimados de entrada/salida (USD por 1M de tokens) y sale con un estado distinto de cero cuando cualquier id configurado es inválido. Requiere `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Comienzo rápido

<a id="workflow-1---ui-translation"></a>
### Flujo de trabajo 1 - Traducción de interfaz

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Luego configure i18next en su aplicación usando los ayudantes de `'ai-i18n-tools/runtime'`. Consulte [Paso 4: Configurar i18next en tiempo de ejecución](docs/GETTING_STARTED.es.md#step-4-wire-i18next-at-runtime) en la guía de inicio para la configuración completa.

<a id="workflow-2---document-translation"></a>
### Flujo de trabajo 2 - Traducción de documentos

La plantilla predeterminada `init` (`ui-markdown`) habilita solo la extracción de interfaz. Use una plantilla orientada a documentación (o habilite `features.translateDocs` y agregue `docs[]`) antes de `translate-docs`:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

Edite `ai-i18n-tools.config.json`: configure `docs[].contentPaths` con fuentes en markdown, MDX y/o `.astro`; `docs[].outputDir` y `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"flat"`, etc.). Referencia completa de campos: [Flujo de trabajo 2 - Traducción de documentos](docs/GETTING_STARTED.es.md#workflow-2---document-translation).

<a id="astro-plain-astro--starlight"></a>
### Astro (Astro plano y Starlight)

**Astro Starlight** — `init -t ui-starlight`, luego `translate-docs`. Las personalizaciones de la interfaz de Starlight pueden usar `src/content/i18n/en.json` con `jsonPathTemplate` en un bloque `docs[]` separado cuando sea necesario ([Introducción → Flujo de trabajo 2](docs/GETTING_STARTED.es.md#step-1-initialise-for-documentation)).

**Astro plano** (sitios de marketing o aplicaciones, no Starlight) — combina el [enrutamiento i18n integrado en Astro](https://docs.astro.build/en/guides/internationalization/) con ai-i18n-tools. Proyecto de referencia: [`examples/astro-website`](../examples/astro-website/) (inglés en `/`, localizaciones en `/{locale}/`).

La mayoría de los equipos usan un enfoque **híbrido** con dos flujos de trabajo:

| Canalización | Uso para | Comandos | Salida |
|----------|---------|----------|--------|
| **HTML de página** | Encabezados, párrafos, etiquetas de navegación, matrices en línea en el cuerpo de la plantilla | `translate-docs` | `src/pages/{locale}/index.astro` por configuración regional |
| **Cadenas de interfaz (`t()`)** | Datos de frontmatter, etiquetas de pestañas, arrays compartidos | `extract` → `translate-ui` | `public/locales/{locale}.json` (inglés como clave fuente) |

Crea la estructura de la interfaz con `init -t ui-astro-website`. Para HTML escrito directamente en páginas `.astro`, activa `features.translateDocs` y añade un bloque `docs[]` con `docsOutput.style: "astro-starlight"` (ver [Páginas del sitio web de Astro (análisis y reemplazo)](docs/GETTING_STARTED.es.md#astro-website-pages-parse-and-replace)). Mantén alineados `targetLocales`, `i18n.locales` en `astro.config.mjs` y `ui-languages.json` (las rutas de Astro usan códigos en minúsculas como `pt-br`; los nombres de archivos planos siguen el caso definido en la configuración, por ejemplo `pt-BR.json`).

Conecta `t()` en tiempo de compilación sin i18next, a menos que añadas islas del cliente — consulta [Cadenas de interfaz del sitio web de Astro (SSG)](docs/GETTING_STARTED.es.md#astro-website-ui-strings-ssg) y el `src/i18n/t.ts` del ejemplo.

<a id="combined-workflow"></a>
### Flujo de trabajo combinado

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## Ayudantes de tiempo de ejecución

Los siguientes ayudantes se exportan desde `'ai-i18n-tools/runtime'` y funcionan en cualquier entorno JavaScript. No es necesario importar i18next para usarlos:

| Ayudante                                                                 | Descripción                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | Opciones estándar de inicialización de i18next para configuraciones de clave como valor por defecto.                                                                               |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Conexión recomendada: recorte de claves + plural `wrapT` desde `strings.json`, opcionalmente combina claves plurales `translate-ui` `{sourceLocale}.json`. |
| `wrapT(i18n, options)`                                                 | Contenedor de bajo nivel consciente de plurales `t()` (normalmente instalado por `setupKeyAsDefaultT`).                                                    |
| `buildPluralIndexFromStringsJson(entries)`                               | Genera el índice del grupo plural que utiliza `wrapT` a partir de filas del catálogo con `"plural": true`.                                                    |
| `extractInterpolationNamesForWrap(key)`                                  | Analiza los nombres `{{var}}` a partir de una clave fuente para `wrapT` / retroceso por recorte de clave.                                                              |
| `wrapI18nWithKeyTrim(i18n)` | Solo un contenedor de bajo nivel para recorte de claves (obsoleto para la conexión de aplicaciones; prefiera `setupKeyAsDefaultT`). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Crea el mapa `localeLoaders` para `makeLoadLocale` desde `ui-languages.json` (cada `code` excepto `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fábrica para carga asíncrona de archivos de idioma. |
| `getTextDirection(lng)` | Devuelve `'ltr'` o `'rtl'` para un código BCP-47. |
| `applyDirection(lng, element?)` | Establece el atributo `dir` en `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Etiqueta mostrada para una fila del menú de idiomas (con i18n). |
| `getUILanguageLabelNative(lang)` | Etiqueta mostrada sin llamar a `t()` (estilo encabezado). |
| `interpolateTemplate(str, vars)` | Sustitución de `{{var}}` de bajo nivel en una cadena simple (usado internamente; el código de la aplicación debería usar `t()` en su lugar). |
| `flipUiArrowsForRtl(text, isRtl)` | Invierte `→` a `←` para diseños de derecha a izquierda (RTL). |

---

<a id="cli-commands"></a>
## Comandos de CLI

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

Las listas completas de banderas por comando están en [Comenzando — Referencia CLI](docs/GETTING_STARTED.es.md#cli-reference). Ejecute `ai-i18n-tools <command> --help` para ver el texto de uso integrado.

Opciones globales en cada comando: `-c <config>` (por defecto: `ai-i18n-tools.config.json`), `-v` (detallado), opcional `-w` / `--write-logs [path]` para duplicar la salida de consola en un archivo de registro (por defecto: dentro del directorio de caché de traducción), `-V` / `--version`, y `-h` / `--help`. Varios comandos aceptan `-l` / `--locale <codes>` (BCP-47 separado por comas) para limitar los idiomas de destino; `lint-source` usa un único idioma fuente. Consulta [Introducción](docs/GETTING_STARTED.es.md#cli-reference) para ver la tabla con la descripción de comandos.

---

<a id="documentation"></a>
## Documentación

- [Introducción](docs/GETTING_STARTED.es.md) - configuración completa para todos los flujos de trabajo (interfaz, documentación/`.astro`, paquetes JSON, Astro Starlight y Astro plano), referencia de CLI y campos de configuración.
- [Guía de recursos por localización](docs/LOCALE-ASSETS-GUIDE.es.md) - imágenes y gráficos SVG ilustrados en documentación traducida (Patrones A–E, reescritor de enlaces planos, scripts para capturas de pantalla).
- [Descripción general del paquete](docs/PACKAGE_OVERVIEW.es.md) - arquitectura, componentes internos, API programática y puntos de extensión.
- [Contexto del agente de IA](../docs/ai-i18n-tools-context.md) - **para aplicaciones que usan el paquete:** indicaciones de integración para proyectos derivados (copia en las reglas de agente de tu repositorio).
- Componentes internos para el mantenimiento de **este** repositorio: `dev/package-context.md` (solo clonación; no está en npm).

---

<a id="license"></a>
## Licencia

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
