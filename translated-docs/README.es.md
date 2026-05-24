<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![Versión de npm](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Descargas de npm](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Licencia: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

CLI y toolkit para la internacionalización de aplicaciones y sitios de documentación en JavaScript/TypeScript utilizando modelos de lenguaje grandes a través de [OpenRouter](https://openrouter.ai/). Dos flujos de trabajo independientes: **Traducción de interfaz** extrae llamadas `t("…")` y genera JSON listo para i18next; **Traducción de documentos** traduce archivos markdown, MDX y SVG con una caché inteligente de SQLite, de modo que solo los segmentos modificados se vuelven a enviar al LLM.

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<small>Los README y documentación traducidos se incluyen en [`translated-docs/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) en GitHub; el paquete npm incluye únicamente `docs/` en inglés.</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabla de contenido**

- [Dos flujos de trabajo principales](#two-core-workflows)
- [Instalación](#installation)
  - [Uso de la CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [Inicio rápido](#quick-start)
  - [Flujo de trabajo 1 - Traducción de interfaz](#workflow-1---ui-translation)
  - [Flujo de trabajo 2 - Traducción de documentos](#workflow-2---document-translation)
  - [Ambos flujos de trabajo](#both-workflows)
- [Ayudantes de tiempo de ejecución](#runtime-helpers)
- [Comandos de CLI](#cli-commands)
- [Documentación](#documentation)
- [Licencia](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## Dos flujos de trabajo principales

**Flujo de trabajo 1 - Traducción de interfaz** — para cualquier proyecto JS/TS que use i18next (React, Next.js, Node.js, CLIs)

Analiza archivos fuente en busca de literales `t("…")` / `i18n.t("…")`, construye un catálogo maestro (`strings.json`), traduce entradas faltantes por idioma mediante OpenRouter y genera archivos JSON planos (`de.json`, `pt-BR.json`, …) listos para i18next.

**Flujo de trabajo 2 - Traducción de documentos** — para documentos markdown/MDX (Docusaurus, Astro Starlight, archivos README simples) y HTML de páginas `.astro` (sitios de marketing Astro simples)

Traduce archivos fuente `.md`, `.mdx` y `.astro` a todos los idiomas de destino con una caché compartida de SQLite — solo se envían al LLM los segmentos nuevos o modificados. El JSON opcional de la estructura Docusaurus (`jsonSource`, desde `write-translations`) cubre cadenas de la barra de navegación, pie de página y la interfaz de usuario del tema. La traducción de archivos SVG se habilita mediante `features.translateSVG` y el bloque `svg` de nivel superior. Para sitios Astro simples, consulte [`examples/astro-website`](../examples/astro-website/) (híbrido: `translate-docs` para el HTML de la página más `t()` para las cadenas del frontmatter).

Ambos flujos de trabajo comparten un único archivo `ai-i18n-tools.config.json` y pueden usarse de forma independiente o conjunta.

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
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

**Ejecución única sin instalación** — usar `npx ai-i18n-tools <cmd>` o `pnpm dlx ai-i18n-tools <cmd>` (descarga solo para esa ejecución).

> **Consejo:** Para ejecutar `ai-i18n-tools` directamente en una terminal interactiva sin `npx`, añada `node_modules/.bin` a su `PATH` (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). Consulte [Comenzando](docs/GETTING_STARTED.es.md#installation) para instrucciones sobre direnv y Windows.

Establece tu clave de API de OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

Los comandos que llaman a OpenRouter (`translate-ui`, `translate-docs`, `sync`, `check-models` y scripts relacionados) necesitan `OPENROUTER_API_KEY` en el entorno. `check-markdown` no utiliza OpenRouter.

En `ai-i18n-tools.config.json`, el objeto `openrouter` incluye listas de modelos, `baseUrl`, `maxTokens`, `temperature` y `requestTimeoutMs`: el tiempo máximo en milisegundos que se espera por cada solicitud HTTP a OpenRouter (complementos de chat y llamadas internas `GET /models`). El valor predeterminado es `30000` (30 segundos).

Ejecuta `ai-i18n-tools check-models` para verificar cada id de modelo configurado contra el catálogo en vivo de OpenRouter. Informa los ids que faltan o que han pasado `expiration_date`, lista los modelos válidos con precios estimados de entrada/salida (USD por 1M de tokens) y sale con un estado distinto de cero cuando cualquier id configurado es inválido. Requiere `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Comienzo rápido

<a id="workflow-1---ui-translation"></a>
### Flujo de trabajo 1 - Traducción de interfaz

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Luego configure i18next en su aplicación usando los ayudantes de `'ai-i18n-tools/runtime'`. Consulte [Paso 4: Configurar i18next en tiempo de ejecución](docs/GETTING_STARTED.es.md#step-4-wire-i18next-at-runtime) en la guía de inicio para la configuración completa.

<a id="workflow-2---document-translation"></a>
### Flujo de trabajo 2 - Traducción de documentos

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website (UI + optional page HTML): npx ai-i18n-tools init -t ui-astro-website

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### Ambos flujos de trabajo

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## Ayudantes de tiempo de ejecución

Los siguientes ayudantes se exportan desde `'ai-i18n-tools/runtime'` y funcionan en cualquier entorno JavaScript. No es necesario importar i18next para usarlos:

| Ayudante                                                                 | Descripción                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | Opciones estándar de inicialización de i18next para configuraciones de clave como valor por defecto.                                                                               |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Conexión recomendada: recorte de claves + plural `wrapT` desde `strings.json`, opcionalmente combina claves plurales `translate-ui` `{sourceLocale}.json`. |
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
ai-i18n-tools help [command]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]
ai-i18n-tools check-models
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools lint-source …
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status [--max-columns <n>]
ai-i18n-tools statistics [--max-columns <n>]
ai-i18n-tools dashboard
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]
ai-i18n-tools glossary-generate
```

Las listas completas de banderas por comando están en [Comenzando — Referencia CLI](docs/GETTING_STARTED.es.md#cli-reference). Ejecute `ai-i18n-tools <command> --help` para ver el texto de uso integrado.

Opciones globales en todos los comandos: `-c <config>` (predeterminado: `ai-i18n-tools.config.json`), `-v` (detallado), `-w` / `--write-logs [path]` opcionales para duplicar la salida de consola en un archivo de registro (predeterminado: dentro del directorio de caché de traducción), `-V` / `--version`, y `-h` / `--help`. Consulte [Introducción](docs/GETTING_STARTED.es.md#cli-reference) para ver la tabla de descripción general de comandos.

---

<a id="documentation"></a>
## Documentación

- [Comenzando](docs/GETTING_STARTED.es.md) - guía completa de configuración para ambos flujos de trabajo, referencia CLI y campos de configuración.
- [Guía de recursos por idioma](docs/LOCALE-ASSETS-GUIDE.es.md) - capturas de pantalla e ilustraciones SVG en documentación traducida (patrones A–E, reescritor de enlaces plano, scripts para capturas).
- [Descripción del paquete](docs/PACKAGE_OVERVIEW.es.md) - arquitectura, componentes internos, API programática y puntos de extensión.
- [Contexto para agentes de IA](../docs/ai-i18n-tools-context.md) - **para aplicaciones que usan el paquete:** indicaciones de integración para proyectos derivados (cópielas en las reglas de agentes de su repositorio).
- Componentes internos para el mantenimiento de **este** repositorio: `dev/package-context.md` (solo clonación; no está en npm).

---

<a id="license"></a>
## Licencia

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
