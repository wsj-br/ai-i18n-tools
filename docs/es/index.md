---
layout: doc
title: ai-i18n-tools
description: >-
  CLI y kit de herramientas para internacionalizar aplicaciones y sitios de
  documentación de JavaScript/TypeScript usando LLMs.
---



# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Traduzca su aplicación y documentación usando el modelo de IA de su elección: sin ataduras, sin reescrituras.**

`ai-i18n-tools` es una CLI y un kit de herramientas para internacionalizar aplicaciones y sitios de documentación de JavaScript/TypeScript —incluidos Docusaurus, Astro, Starlight, VitePress, Nextra, Fumadocs y Markdown/MDX simple— utilizando modelos de lenguaje grandes.

Apúntelo a cualquier proveedor y comience a traducir: **OpenAI**, **Anthropic**, **Google Gemini**, **NVIDIA**, **DeepSeek**, **Groq**, **Mistral**, **xAI**, **Cerebras**, **Alibaba**, **APIFUN**, cualquier modelo de [OpenRouter](https://openrouter.ai/) (cientos para elegir con una sola clave API), o **Ollama** para una traducción totalmente autohospedada y sin conexión. Cambie de proveedor o modelo por proyecto —o incluso por idioma— sin modificar su base de código.

Un archivo de configuración controla tres modos de traducción, por lo que puede mezclarlos y combinarlos según la estructura de su contenido:

- **Cadenas de interfaz de usuario** — Extrae llamadas `t("…")` de JS/TS (y opcionalmente archivos `.astro`) y genera JSON plano por idioma para i18next o búsqueda estática de SSG.
- **Documentos** — Traduce páginas de Markdown, MDX y `.astro` listadas en `docs[].contentPaths` usando `translate-docs`. Funciona con **VitePress**, **Starlight**, **Docusaurus**, **Nextra**, **Fumadocs**, sitios basados en Astro, o cualquier generador de sitios estáticos que lea de archivos fuente Markdown/MDX/`.astro`.
- **JSON** — Traduce paquetes JSON anidados arbitrarios definidos en `json[]`. Use `translate-json` cuando la copia de la interfaz de usuario resida en archivos JSON por idioma en lugar de llamadas `t()` en el código fuente.

Los activos **SVG** tienen su propia ruta: `features.translateSVG`, el bloque `svg` de nivel superior y `translate-svg` —no `docs[].contentPaths`.

**¿Cuál debo usar?**

| Su contenido                                                                  | Comando                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| El código fuente usa `t()`                                                        | **Cadenas de interfaz de usuario** — `extract` / `translate-ui` |
| Páginas localizadas o sitios de documentos (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, etc.) | **Documentos** — `translate-docs` |
| Archivos de localidad JSON anidados e independientes                                          | **JSON** — `translate-json`                 |

Los tres comparten una caché de archivos/SQLite, por lo que solo los segmentos nuevos o modificados (cadenas o fragmentos de texto) se reenvían al modelo; las repeticiones son rápidas y económicas, independientemente del proveedor que esté utilizando.

<a id="translation-types"></a>
## Tipos de traducción

Cada tipo de traducción tiene su propia guía con detalles de configuración completos: [cadenas de interfaz de usuario](/guide/ui-strings/), [documentos](/guide/documents/) y [JSON](/guide/json). Consulte [¿Qué es ai-i18n-tools?](/guide/what-is-ai-i18n-tools) para una comparación lado a lado.

Algunas cosas que vale la pena saber de antemano: las cadenas de la interfaz de usuario traducen las entradas que faltan por configuración regional a través del proveedor de LLM activo (consulte [Proveedores de LLM](#llm-providers)) y escriben archivos JSON planos (`de.json`, `pt-BR.json`, …), con el texto fuente en inglés como clave de búsqueda en tiempo de ejecución — `strings.json` es la caché de extracción, no el paquete en tiempo de ejecución. Los documentos admiten los valores `docs[].docsOutput.style`, `"nested"`, `"flat"`, `"doc-system"` y los alias `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (consulte [Diseños de salida](/guide/documents/output-layouts)). Los tres comparten `ai-i18n-tools.config.json` y se pueden combinar; `sync` ejecuta la extracción, la traducción de la interfaz de usuario, la traducción de SVG, `translate-docs` y `translate-json` en orden según sus indicadores `features`.

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

Después de instalar el paquete en su proyecto, npm/pnpm/yarn enlaza la entrada bin publicada (`bin/ai-i18n-tools.mjs`) en `node_modules/.bin/ai-i18n-tools`. Ese shim carga la CLI compilada desde el paquete instalado.

**Scripts de `package.json` (recomendado)** — npm y pnpm anteponen `node_modules/.bin` a `PATH` al ejecutar scripts, por lo que puede llamar al nombre del comando sin prefijo:

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

Luego ejecute, por ejemplo, `pnpm run i18n:sync` — no se necesita el prefijo `npx`.

**Shell interactivo** — desde la raíz de su proyecto (después de una instalación local):

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
```

Para escribir el comando `ai-i18n-tools` sin formato en bash/zsh, anteponga el directorio bin local a `PATH` (consulte [Uso de la CLI](/guide/installation#using-the-cli) para notas sobre PowerShell, direnv y Windows):

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

Prefiera `sync` en lugar de encadenar manualmente `extract`, `translate-ui`, `translate-svg`, `translate-docs` y `translate-json` — el orden y los indicadores de características son fáciles de confundir cuando se ejecutan manualmente. Consulte [Scripts `package.json` recomendados](/guide/quick-start#recommended-packagejson-scripts) en la guía de inicio rápido.

**Uso único sin instalación** — `npx ai-i18n-tools <cmd>` o `pnpm dlx ai-i18n-tools <cmd>` (descarga el paquete solo para esa invocación; no hay entrada en `package.json`).

Establece la clave API de tu proveedor (se muestra OpenRouter; usa la variable correspondiente para tu proveedor):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="llm-providers"></a>
## Proveedores de LLM

Los comandos de traducción (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models` y scripts relacionados) llaman a un proveedor de LLM; `check-markdown`, `mark-html` y `extract` no.

Configura los proveedores bajo un mapa de nivel superior `providers` y elige el activo con un selector de nivel superior `provider` (opcional cuando se configura exactamente un proveedor). La mayoría de los proveedores solo necesitan una lista `translationModels` — `baseUrl` y la variable de entorno de la clave API provienen de un preset integrado; puedes anular `baseUrl`, `apiKeyEnv`, `headers`, `maxTokens`, `temperature` y `requestTimeoutMs` por proveedor. `requestTimeoutMs` es el tiempo máximo en milisegundos para esperar cada solicitud (predeterminado `30000`).

Niveles de modelo opcionales en cada bloque de proveedor:

- `translationModels` — cadena de reserva ordenada global (requerida para las funciones de traducción).
- `uiModels` — cadena solo de interfaz de usuario (`translate-ui`, generación plural, `proofread-ui`): se intenta después de cualquier entrada `localeModels` coincidente, antes de `translationModels`.
- `localeModels` — anulaciones por configuración regional para **todas** las canalizaciones: cada entrada asigna una configuración regional BCP-47 a una lista de modelos ordenada que se intenta primero solo para esa configuración regional (`pt-br` coincide con `pt-BR`).

Orden de resolución: **UI** → `localeModels(locale)` → `uiModels` → `translationModels`; **documentos / JSON / SVG** → `localeModels(locale)` → `translationModels`. Los ID de modelo duplicados se omiten mientras se conserva el orden.

Para cambiar de proveedor para una sola ejecución sin editar la configuración, pase la opción global `-P` / `--provider <name>` (p. ej., `ai-i18n-tools -P groq translate-ui`); el nombre debe ser una de las claves de `providers` configuradas.

```jsonc
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"],
      "uiModels": ["anthropic/claude-sonnet-latest"],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
      ]
    },
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

Presets de proveedores integrados (clave — URL base — variable de entorno de clave API):

| Proveedor | URL base | Variable de entorno de clave API |
|---|---|---|
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

Define un proveedor personalizado compatible con OpenAI agregando una nueva clave con `baseUrl` (y `apiKeyEnv` a menos que no necesite clave). Los IDs de modelo son IDs directos del proveedor de origen; el proveedor se elige en el nivel de configuración, por lo que no se necesita prefijo `provider/` (los IDs de OpenRouter conservan su forma nativa `vendor/model`).

El uso de tokens se informa para cada proveedor; el costo exacto en USD se muestra solo cuando el proveedor lo devuelve (OpenRouter). `ai-i18n-tools check-models` valida todos los ID de modelo configurados (`translationModels`, `uiModels` y cada entrada de `localeModels`) con la lista de `GET /models` en vivo del proveedor activo (cualquier proveedor), y muestra los precios cuando el proveedor los devuelve (por ejemplo, OpenRouter). `ai-i18n-tools list-models` enumera cada modelo que anuncia el proveedor activo (use `-P` / `--provider` para inspeccionar otro proveedor configurado). `ai-i18n-tools bench-models` evalúa cada ID de modelo configurado único (`translationModels`, `uiModels` y `localeModels`) traduciendo una muestra de forma aislada (los modelos se ejecutan en paralelo, limitados por `concurrency`) e imprime los tokens de entrada/salida por modelo, el tiempo real y el costo en USD.

Para una demostración práctica de cómo cambiar de proveedor con `-P` en un solo documento, consulte [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/).

---

<a id="quick-start"></a>
## Comienzo rápido

<a id="ui-strings"></a>
### Cadenas de interfaz de usuario

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Luego, conecte i18next en su aplicación usando los ayudantes de `'ai-i18n-tools/runtime'`. Consulte [Paso 4: Conectar i18next en tiempo de ejecución](/guide/ui-strings/i18next-runtime) en la guía de cadenas de interfaz de usuario para la configuración completa.

<a id="documents"></a>
### Documentos

La plantilla predeterminada `init` (`ui-markdown`) habilita solo la extracción de interfaz. Use una plantilla orientada a documentación (o habilite `features.translateDocs` y agregue `docs[]`) antes de `translate-docs`:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# VitePress documentation (pages + theme catalog)
# npx ai-i18n-tools init -t ui-vitepress

# Nextra documentation (pages + _meta.ts + theme dictionary)
# npx ai-i18n-tools init -t ui-nextra

# Fumadocs documentation (pages + meta.json + UI catalog)
# npx ai-i18n-tools init -t ui-fumadocs

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

Edición `ai-i18n-tools.config.json`: establecer `docs[].contentPaths` en markdown, MDX y/o `.astro` fuentes; `docs[].outputDir` y `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, `"flat"`, etc.). Referencia completa del campo: [Documentos](/guide/documents/).

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` genera `docsOutput.style: "vitepress"` más `docsOutput.vitepressThemeCatalog` para cadenas de navegación/barra lateral/pie de página. Ejecute `sync` para traducir el markdown de la página y el catálogo de temas juntos, sin una canalización JSON separada. Consulte [Integración de VitePress](/guide/vitepress-integration) y [ejemplos/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/).

<a id="nextra"></a>
### Nextra

`init -t ui-nextra` genera `docsOutput.style: "nextra"`. `translate-docs` recopila y traduce automáticamente las etiquetas de la barra lateral de `_meta.ts`; configure `docs[].nextraDictionaryPath` para traducir también el módulo del diccionario de temas (por ejemplo, `app/_dictionaries/en.ts`) — todo en la misma ejecución de `sync`, sin sidecars JSON. Consulte [Integración de Nextra](/guide/nextra-integration) y [ejemplos/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/).

<a id="fumadocs"></a>
### Fumadocs

`init -t ui-fumadocs` andamiaje `docsOutput.style: "fumadocs"` con el analizador de puntos (predeterminado) o el analizador de directorios para carpetas de configuración regional de estilo Nextra. `translate-docs` recopila y traduce automáticamente las etiquetas de la barra lateral de `meta.json`; establezca `docsOutput.fumadocsUiCatalog` para traducir también las anulaciones de la interfaz de usuario en `lib/layout.shared.ts` — todo en la misma ejecución de `sync`, sin archivos JSON complementarios. Consulte [Integración de Fumadocs](/guide/fumadocs-integration) y [ejemplos/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/).

<a id="astro-plain-astro--starlight"></a>
### Astro (Astro plano y Starlight)

**Astro Starlight** — `init -t ui-starlight`, luego `translate-docs`. Las anulaciones de la interfaz de usuario de Starlight pueden usar `src/content/i18n/en.json` con `jsonPathTemplate` en un bloque `docs[]` separado cuando sea necesario ([Documentos — inicializar para la documentación](/guide/documents/#step-1-initialise-for-documentation)).

**Astro simple** (sitios de marketing o aplicaciones, no Starlight) — combine [enrutamiento i18n integrado de Astro](https://docs.astro.build/en/guides/internationalization/) con ai-i18n-tools. Proyecto de referencia: [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (inglés en `/`, configuraciones regionales en `/{locale}/`).

La mayoría de los equipos usan un enfoque **híbrido** con dos flujos de trabajo:

| Canalización | Usar para | Comandos | Salida |
|---|---|---|---|
| **HTML de página** | Encabezados, párrafos, etiquetas de navegación, matrices en línea en el cuerpo de la plantilla | `translate-docs` | `src/pages/{locale}/index.astro` por configuración regional |
| **Cadenas de interfaz (`t()`)** | Datos de frontmatter, etiquetas de pestañas, arrays compartidos | `extract` → `translate-ui` | `public/locales/{locale}.json` (inglés como clave fuente) |

Genere la interfaz de usuario con `init -t ui-astro-website`. Para HTML codificado en páginas `.astro`, habilite `features.translateDocs` y agregue un bloque `docs[]` con `docsOutput.style: "astro-starlight"` (consulte [Páginas del sitio web de Astro (analizar y reemplazar)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). Mantenga `targetLocales`, `i18n.locales` en `astro.config.mjs` y `ui-languages.json` alineados (las rutas de Astro usan códigos en minúsculas como `pt-br`; los nombres de archivo de los paquetes planos siguen el uso de mayúsculas y minúsculas de la configuración, por ejemplo, `pt-BR.json`).

Conecte `t()` en tiempo de compilación sin i18next a menos que agregue islas de cliente — consulte [Cadenas de interfaz de usuario del sitio web de Astro (SSG)](/guide/ui-strings/astro-website#astro-website-ui-strings-ssg) y el `src/i18n/t.ts` del ejemplo.

<a id="combined-sync"></a>
### Sincronización combinada

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
| `extractInterpolationNamesForWrap(key)`                                  | Analiza los nombres <code v-pre>{{var}}</code> a partir de una clave fuente para `wrapT` / retroceso por recorte de clave.                                                              |
| `wrapI18nWithKeyTrim(i18n)` | Solo un contenedor de bajo nivel para recorte de claves (obsoleto para la conexión de aplicaciones; prefiera `setupKeyAsDefaultT`). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Crea el mapa `localeLoaders` para `makeLoadLocale` desde `ui-languages.json` (cada `code` excepto `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fábrica para carga asíncrona de archivos de idioma. |
| `getTextDirection(lng)` | Devuelve `'ltr'` o `'rtl'` para un código BCP-47. |
| `applyDirection(lng, element?)` | Establece el atributo `dir` en `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Etiqueta mostrada para una fila del menú de idiomas (con i18n). |
| `getUILanguageLabelNative(lang)` | Etiqueta mostrada sin llamar a `t()` (estilo encabezado). |
| `interpolateTemplate(str, vars)` | Sustitución de <code v-pre>{{var}}</code> de bajo nivel en una cadena simple (usado internamente; el código de la aplicación debería usar `t()` en su lugar). |
| `flipUiArrowsForRtl(text, isRtl)` | Invierte `→` a `←` para diseños de derecha a izquierda (RTL). |

---

<a id="cli-commands"></a>
## Comandos de CLI

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

Para aplicaciones HTML simples, anote los elementos con marcadores `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` sin formato (el texto fuente se toma del textContent / title / placeholder del propio elemento, escrito una vez); `mark-html` los inserta por usted y `extract` luego los captura en `strings.json`. Consulte [Marcado de HTML para traducción](/guide/ui-strings/plain-html#marking-html-for-translation).

Las listas completas de indicadores por comando se encuentran en [Referencia de la CLI](/reference/cli-commands). Ejecute `ai-i18n-tools <command> --help` para ver el texto de uso integrado.

Opciones globales: `-c <config>` (predeterminado: `ai-i18n-tools.config.json`), `-v` (detallado), `-P` / `--provider <name>` (anula el proveedor de LLM activo; debe configurarse en `providers`), `-L` / `--ui-lang <code>` (idioma para la interfaz de usuario/registros de la herramienta), `-V` / `--version`, y `-h` / `--help` — aceptado en cada comando. `-w` / `--write-logs [path]` envía la salida de la consola a un archivo de registro (predeterminado: en el directorio de caché de traducción), pero solo tiene efecto en los comandos de traducción y sincronización (`translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, `cleanup`). Varios comandos aceptan `-l` / `--locale <codes>` (BCP-47 separado por comas) para limitar las configuraciones regionales de destino; `proofread-ui` usa una única configuración regional de origen. Consulte la [referencia de la CLI](/reference/cli-commands) para ver la tabla de descripción general de los comandos.

<a id="tool-ui-language-logs-help-dashboard"></a>
### Idioma de la interfaz de usuario de la herramienta (registros, ayuda, panel de control)

La herramienta localiza su propia ayuda de CLI, mensajes de registro/resumen de alto tráfico y el panel de traducción. La locale de la interfaz de usuario se resuelve a partir de estas fuentes, con la máxima prioridad primero:

1. Indicador global `-L` / `--ui-lang <code>` (por ejemplo, `-L pt-BR`).
2. Variable de entorno `AI_I18N_LANG` (por ejemplo, `export AI_I18N_LANG=es`).
3. La clave de configuración `uiLanguage` en `ai-i18n-tools.config.json` (cadena BCP-47).
4. La locale del sistema operativo anfitrión (a través de `Intl.DateTimeFormat().resolvedOptions().locale`).

La configuración regional solicitada se compara con los idiomas de la interfaz de usuario enviados exactamente o por la variación más cercana (por ejemplo, `pt-PT` se resuelve en `pt-BR`, y `en-US` se resuelve en `en-GB`); cuando nada coincide, se recurre a la configuración regional de origen (`en-GB`). Cuando se solicita explícitamente un idioma de la interfaz de usuario (a través de la bandera, la variable de entorno o `uiLanguage`) pero no coincide ningún paquete enviado, la CLI imprime una advertencia única de que se utilizará la configuración regional predeterminada; una configuración regional inferida solo del sistema operativo host nunca advierte. Esto es independiente de la `sourceLocale` / `targetLocales` de su proyecto. Idiomas de la interfaz de usuario enviados: `en-GB` (origen) más `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans` y `zh-Hant`. No se requiere configuración; de forma predeterminada, la herramienta sigue la configuración regional de su sistema operativo. Consulte [Idioma de la interfaz de usuario de la herramienta](/reference/environment-variables#tool-ui-language) para obtener más detalles.

---

<a id="documentation"></a>
## Documentación

- [Sitio de documentación](https://wsj-br.github.io/ai-i18n-tools/) — guía completa de VitePress (9 configuraciones regionales en GitHub Pages).
- [Inicio rápido](/guide/quick-start) — configuración para cadenas de interfaz de usuario, documentos y JSON (UI, documentos/`.astro`, paquetes JSON, VitePress, Nextra, Fumadocs, Astro Starlight y Astro simple).
- [Guía de recursos de configuración regional](/guide/images-and-screenshots/) - capturas de pantalla y SVG ilustrados en documentos traducidos (reescritor de enlaces planos, scripts de captura de pantalla).
- [Arquitectura](/reference/architecture) - arquitectura, componentes internos, API programática y puntos de extensión.
- [Contexto del agente de IA](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **para aplicaciones que usan el paquete:** indicaciones de integración para proyectos posteriores (copiar en las reglas del agente de su repositorio).
- Guía del mantenedor para **este** repositorio: `AGENT.md` (reglas y flujos de trabajo; solo clonar; no en npm). Referencia de la canalización: `docs/reference/`. Desarrollo local y publicación: `dev/DEVEL.md`.

---

<a id="license"></a>
## Licencia

Este proyecto tiene licencia MIT.
Consulte el archivo [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) para obtener más detalles.

Copyright &copy; 2026 Waldemar Scudeller Jr.
