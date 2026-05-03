<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![Versión de npm](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Descargas de npm](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Licencia: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

CLI y kit de herramientas para la internacionalización de aplicaciones y sitios de documentación en JavaScript/TypeScript. Extrae cadenas de interfaz de usuario, las traduce utilizando modelos lingüísticos grandes a través de OpenRouter y genera archivos JSON preparados para cada configuración regional para i18next. También incluye canalizaciones para markdown, JSON de Docusaurus y recursos SVG independientes.

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Tabla de contenido**

- [Dos flujos de trabajo principales](#two-core-workflows)
- [Instalación](#installation)
  - [Uso de la CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [Inicio rápido](#quick-start)
  - [Flujo de trabajo 1 - Cadenas de interfaz](#workflow-1---ui-strings)
  - [Flujo de trabajo 2 - Documentación](#workflow-2---documentation)
  - [Ambos flujos de trabajo](#both-workflows)
- [Ayudantes de tiempo de ejecución](#runtime-helpers)
- [Comandos de CLI](#cli-commands)
- [Documentación](#documentation)
- [Licencia](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## Dos flujos de trabajo principales

**Flujo 1 - Traducción de interfaz** (React, Next.js, Node.js, cualquier proyecto con i18next)

Crea un catálogo maestro (`strings.json` con metadatos opcionales por configuración regional `models`) a partir de **literales** `t("…")` / `i18n.t("…")`, opcionalmente `package.json` `description`, y opcionalmente cada `englishName` de `ui-languages.json` cuando está habilitado en la configuración. Traduce las entradas que faltan por configuración regional mediante OpenRouter y escribe archivos JSON planos (`de.json`, `pt-BR.json`, …) listos para i18next.

**Flujo 2 - Traducción de documentos** (Markdown, JSON de Docusaurus)

Traduce `.md` y `.mdx` de cada `documentations` dentro del bloque `contentPaths` y archivos JSON de etiquetas desde el `jsonSource` del bloque cuando está habilitado. Admite diseños por bloque estilo Docusaurus o planos con sufijos de idioma (`documentations[].markdownOutput`). El `cacheDir` raíz compartido contiene la caché SQLite, de modo que solo se envían al LLM segmentos nuevos o modificados. **SVG:** activa `features.translateSVG`, añade el bloque `svg` de nivel superior y luego usa `translate-svg` (también se ejecuta desde `sync` cuando ambos están configurados).

Ambos flujos comparten un único archivo `ai-i18n-tools.config.json` y pueden usarse de forma independiente o conjunta. La traducción independiente de SVG utiliza `features.translateSVG` más el bloque `svg` de nivel superior y se ejecuta a través de `translate-svg` (o la etapa SVG dentro de `sync`).

---

<a id="installation"></a>
## Instalación

El paquete publicado es solo **ESM** (`"type": "module"`). Usa `import` desde Node.js, empaquetadores o `import()` — `require('ai-i18n-tools')` **no es compatible.** El paquete declara `engines.node`  `>=22.16.0`; versiones anteriores de Node.js no son compatibles.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

### Uso de la CLI

**Por proyecto (recomendado)** — instalar como dependencia o devDependency, luego invocar mediante `npx`, `pnpm exec` o un script `package.json`:

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

El gestor de paquetes escribe `node_modules/.bin/ai-i18n-tools` con los permisos correctos en Linux y macOS y crea shim `.cmd` / `.ps1` en Windows; los ejecutores de scripts los detectan automáticamente.

**Bare** `ai-i18n-tools` **en la terminal:** `package.json` los scripts ya se ejecutan con `node_modules/.bin` en `PATH`, por lo que comandos como `pnpm run i18n:sync` invocan la CLI sin tener que escribir `npx`. Para ejecutar `ai-i18n-tools` directamente en un shell interactivo (desde la raíz del proyecto, tras una instalación local), anteponga el directorio bin local a `PATH`:

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

---

<a id="openrouter"></a>
## OpenRouter

Los comandos que llaman a OpenRouter (`translate-ui`, `translate-docs`, `sync`, `check-models` y scripts relacionados) necesitan `OPENROUTER_API_KEY` en el entorno. `check-markdown` no utiliza OpenRouter.

En `ai-i18n-tools.config.json`, el objeto `openrouter` incluye listas de modelos, `baseUrl`, `maxTokens`, `temperature` y `requestTimeoutMs`: el tiempo máximo en milisegundos que se espera por cada solicitud HTTP a OpenRouter (complementos de chat y llamadas internas `GET /models`). El valor predeterminado es `30000` (30 segundos).

Ejecuta `ai-i18n-tools check-models` para verificar cada id de modelo configurado contra el catálogo en vivo de OpenRouter. Informa los ids que faltan o que han pasado `expiration_date`, lista los modelos válidos con precios estimados de entrada/salida (USD por 1M de tokens) y sale con un estado distinto de cero cuando cualquier id configurado es inválido. Requiere `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Comienzo rápido

<a id="workflow-1---ui-strings"></a>
### Flujo de trabajo 1 - Cadenas de interfaz

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Integra i18next en tu aplicación usando los ayudantes de `'ai-i18n-tools/runtime'`:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

<a id="workflow-2---documentation"></a>
### Flujo de trabajo 2 - Documentación

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

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

| Ayudante | Descripción |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Opciones estándar de inicialización de i18next para configuraciones con clave como valor por defecto. |
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

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]   Create config file
ai-i18n-tools check-models                          Validate configured OpenRouter model ids against GET /models (pricing, expiration); requires OPENROUTER_API_KEY
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools write-heading-ids …                   Insert HTML anchor lines before ATX headings in .md/.mdx (documentations[])
ai-i18n-tools strip-md-bold-inline …              Remove bold (**) around inline code in markdown/MDX (documentations[])
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]   Scan documentation markdown for delimiter / inline-code issues and strong-outside-code or strong-outside-link patterns; refresh SQLite markdown_source_issues; exit 1 if any issue
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools lint-source …                         Run extract, then LLM review of source-locale UI strings (OpenRouter)
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools statistics [--max-columns <n>]        Documentation cache + strings.json aggregates (same as editor Statistics)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]   List *.log and cache.db.backup*.sqlite; delete after `y`, with `-f`, or skip if none match
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Opciones globales en todos los comandos: `-c <config>` (por defecto: `ai-i18n-tools.config.json`), `-v` (detallado), opcional `-w` / `--write-logs [path]` para duplicar la salida de consola en un archivo de registro (por defecto: dentro del directorio de caché de traducciones), `-V` / `--version`, y `-h` / `--help`. Consulte [Introducción](docs/GETTING_STARTED.es.md#cli-reference) para las banderas específicas de cada comando.

---

<a id="documentation"></a>
## Documentación

- [Introducción](docs/GETTING_STARTED.es.md) - guía completa de configuración para ambos flujos de trabajo, referencia de CLI y referencia de campos de configuración.
- [Descripción general del paquete](docs/PACKAGE_OVERVIEW.es.md) - arquitectura, componentes internos, API programática y puntos de extensión.
- [Contexto para agentes de IA](../docs/ai-i18n-tools-context.md) - **para aplicaciones que usan el paquete:** indicaciones de integración para proyectos secundarios (cópielas en las reglas del agente de su repositorio).
- Componentes internos para mantenimiento de **este** repositorio: `dev/package-context.md` (solo clonación; no disponible en npm).

---

<a id="license"></a>
## Licencia

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
