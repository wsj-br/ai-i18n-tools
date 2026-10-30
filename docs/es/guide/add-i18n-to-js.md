<a id="add-i18n-to-a-jsts-app"></a>
# Agregar i18n a una aplicación JS/TS

Esta página toma una aplicación JS/TS (React, Next.js, Node o una CLI) que tiene un solo idioma y le añade configuraciones regionales con ai-i18n-tools. Sigue una ruta: i18next, un pequeño archivo de arranque y archivos JSON de traducciones. `extract` registra una cadena de interfaz de usuario solo cuando es un literal de cadena dentro de `t()` o `i18n.t()`, por lo que un catálogo de texto fuente sin formato estaría vacío.

La forma más rápida es darle a un agente de codificación la instrucción de esta página. Instala i18next, añade el archivo de arranque, envuelve tus cadenas y puede añadir un selector de idioma. Tú instalas la CLI, eliges el proveedor e inicializas el proyecto, porque eso necesita tu clave API y tus elecciones. También ejecutas la traducción tú mismo, porque gasta dinero de tu cuenta.

Un sitio web o un sitio de documentación utiliza [Añadir i18n a un sitio web o de documentación](/es/guide/add-i18n-to-website). Una aplicación Python utiliza [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python). ¿No estás seguro de cuál se aplica? Consulta [¿No es tu caso?](#not-your-case) al final.

El flujo:

1. [Instala la CLI y elige un proveedor](#install-and-choose-a-provider).
2. [Inicializa el proyecto](#initialise-the-project) con `init`.
3. [Ejecuta la instrucción del agente](#run-the-agent-prompt).
4. [Revisa el resultado](#review-the-result).
5. [Elige modelos y traduce](#choose-models-and-translate), luego comprueba un idioma.
6. [Mantenlo traducido](#keep-it-translated).

¿Prefieres hacer los cambios tú mismo o quieres saber qué hace la instrucción? [Hazlo manualmente](#do-it-by-hand) recorre los mismos pasos uno por uno.

<a id="install-and-choose-a-provider"></a>
## Instalar y elegir un proveedor

Tú haces esta parte, no el agente. El instalador cambia tu máquina, y la clave API es un secreto que pertenece a tu shell, no a una instrucción.

Instala el paquete como una dependencia de desarrollo. El archivo de arranque importa `ai-i18n-tools/runtime`, y una CLI global o un ejecutable independiente no pueden satisfacer esa importación. Otras opciones de instalación: [Instalación](/es/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` y `yarn add --dev ai-i18n-tools` también funcionan. Los ejemplos siguientes utilizan el comando `ai-i18n-tools` sin más. Una instalación local necesita `node_modules/.bin` en `PATH`, o `pnpm exec` delante de cada comando. Consulta [Uso de la CLI](/es/guide/installation#using-the-cli).

Comprueba la instalación:

```bash
ai-i18n-tools --version
```

Luego elige un proveedor y establece su clave API en el shell que ejecutará la traducción. Por ejemplo, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama no necesita clave. Otros preajustes: [Proveedores integrados](/es/guide/providers-and-models#built-in-providers). Anota el nombre del proveedor, porque lo pasarás a `init` en el siguiente paso. El agente nunca necesita la clave: solo ejecuta comandos que no hacen llamadas a modelos. Usarás la clave más tarde, cuando [traduzcas](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Inicializar el proyecto

Ejecutas esto una vez, antes de la instrucción. Escribe la configuración y utiliza el proveedor que elegiste anteriormente.

```bash
ai-i18n-tools init -P openrouter
```

La plantilla predeterminada es `ui-markdown`. Escribe `ai-i18n-tools.config.json` con un bloque de interfaz de usuario y un bloque README plano. Cuatro claves son importantes para la aplicación:

- `sourceLocale`: el idioma de las cadenas en el origen. Cualquier idioma BCP-47 es válido; el andamiaje a menudo utiliza `en-GB`.
- `targetLocales`: los idiomas a añadir.
- `ui.sourceRoots`: las carpetas que `extract` escanea, por ejemplo `src/`.
- `ui.stringsJson` y `ui.flatOutputDir`: dónde se escriben el catálogo y los archivos por configuración regional.

`init` no instala i18next y no añade el archivo de arranque. Eso es la instrucción (manualmente, [Paso 1](#step-1-install-the-runtime-libraries) y [Paso 2](#step-2-extract-once-and-add-the-bootstrap)).

Ejecuta `init` una vez. Reescribe `ai-i18n-tools.config.json` cada vez, por lo que una segunda ejecución descarta las ediciones que hayas realizado.

La misma plantilla enumera `README.md` para la traducción de documentos. El marcador de la lista de idiomas y los archivos README son [Añadir i18n a tus archivos README y documentos Markdown](/es/guide/add-i18n-to-readme). Esta página es la ruta `t()`.

Todas las demás claves están en [Configuración](/es/reference/configuration). Formas de llamada: [Llamadas t() y plurales](/es/guide/ui-strings/t-calls-and-plurals). La referencia de arranque: [Conectar i18next](/es/guide/ui-strings/i18next-runtime).

<a id="run-the-agent-prompt"></a>
## Ejecutar la instrucción del agente

Abre el proyecto en tu agente de codificación (Cursor, Claude Code, Copilot o similar), inicia un nuevo chat y pega la instrucción a continuación. El proyecto ya debe estar inicializado. No hay nada que editar. Si quieres omitir algo, por ejemplo, no cambiar de idioma, indícalo en el mismo mensaje.

El agente primero comprueba que la CLI y la configuración existen, y se detiene con instrucciones si falta alguna. Luego trabaja en tres partes:

- La Parte 1 instala i18next, ejecuta `extract` una vez y añade el bootstrap.
- La Parte 2 envuelve las cadenas de texto visibles para el usuario en `t()` o `i18n.t()`.
- La Parte 3 añade un selector de idioma o una opción de idioma en la CLI.

No instala la CLI, no inicializa la configuración, no lee tu clave de API ni traduce. La traducción es el paso posterior a la revisión, y tú la ejecutas.

````markdown
# Add languages to this JS/TS app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists with a `ui` block. If either is missing,
stop now and tell the user to install ai-i18n-tools as a dev dependency and
run `ai-i18n-tools init -P <provider>`, then run this prompt again. Do not
install the CLI or initialise the config yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`).
- Do not introduce semantic keys (`saveButton`, `nav.home`). The literal in
  `t("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Runtime

Skip a piece of this part when it is already done.

1. Install `i18next` with the project's package manager. Install
   `react-i18next` only when a component uses `useTranslation()`.
2. Run `ai-i18n-tools extract` once. It writes `strings.json` and
   `ui-languages.json` even when it finds no `t()` calls, so the app compiles.
   Expect 0 strings, or 1 when `package.json` has a `description`
   (`ui.uiExtractor.includePackageDescription` is on by default).
3. Add the bootstrap below. Put it where this repository keeps its app code,
   and point the JSON imports at `ui.stringsJson`, `ui.flatOutputDir`, and
   `languagesManifestPath` when that key is set. `SOURCE_LOCALE` must equal
   config `sourceLocale`, character for character. The sample uses `en-GB`
   only as the shape.
4. Import the bootstrap from the app entry before the first render. In
   Next.js, import it from a client module. Do not call `changeLanguage` on a
   shared i18next instance inside a server component. Concurrent requests
   share that singleton. Use a per-request `createInstance()`, or a stateless
   lookup of the flat bundle.

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

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

For JSON under `public/`, the loader fetches `/locales/<code>.json` and
parses the response. For a Node CLI with no bundler, read the file with
`readFileSync` inside that function. A call that uses `{ plurals: true, count }`
also needs the
source-locale flat file under `flatOutputDir`. That file does not exist until
the user runs `translate-ui`, so leave `sourcePluralFlatBundle` out and name
the plural calls in the report.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

Read `ui.sourceRoots` and edit only those trees (JS, JSX, TS, TSX). Leave
`className`, URLs and routes, import paths, ids, test ids, enum and error
codes, object keys used as identifiers, log field names, CSS, regexes, and
comments.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. A constant that
  would call `t()` at import time must move into a function or
  `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Placeholders: `t("Hello {{name}}", { name })`. The argument must be a string
  literal. `t(variable)` and a template literal as the key are not extracted.
- Plurals: `t("{{count}} items", { plurals: true, count })`. Do not invent
  `_one` / `_other` keys.
- One `t()` per sentence. Split only where the text already branches.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

Work in passes: list string literals that are not passed to `t` or `i18n.t`,
wrap the user-facing ones, then list again. Treat any bulk rewrite as a draft
and review its diff. Then run `ai-i18n-tools extract` again.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A command-line program still gets
this part: a language option, not a widget.

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Accept only codes listed in `ui-languages.json`.

- Restore a saved locale before the first render, then draw a control labelled
  `t("Language")` whose options come from that manifest. On change, call
  `await loadLocale(code)` and then `await i18n.changeLanguage(code)`.
- In Next.js, reading `localStorage` in an effect after hydration paints the
  source locale first. Prefer a cookie the server can read, or load the saved
  locale in the client module before the first client render. Do not call
  `changeLanguage` on a shared instance inside a server component.
- A CLI: add `--lang <code>` and `-L <code>` unless those names are taken.
  Read the option before help text is built, so help can be translated too.
  After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`. Then the source locale.

## Verify and report

The project's build, type check, and tests pass. `extract` writes a non-empty
catalog of the sentences you wrapped. With the source locale, the output is
unchanged.

Report the files changed, each string you skipped with a one-line reason, the
same word used with different meanings, sentences built from translated pieces,
plurals that still need `sourcePluralFlatBundle` after the user translates,
and any `t()` that runs at import time. Then list the commands for the user,
and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then reload the app.
````

<a id="review-the-result"></a>
## Revisar el resultado

El agente finaliza con un informe. Revísalo antes de traducir:

- El diff. El texto envuelto debe leerse igual que antes, sin reformateos no relacionados. `git diff --stat` muestra cuánto cambió. El bootstrap, su importación, las llamadas envueltas y el selector de idioma son las ediciones esperadas.
- Los catálogos generados (`strings.json`, JSON por cada configuración regional, `ui-languages.json`) están intactos, aparte de lo que escribió `extract`.
- `ai-i18n-tools extract` se ejecuta sin problemas, y `strings.json` enumera las frases que esperas.
- Tus pruebas pasan y la aplicación se ve igual en el idioma de origen.
- Las cadenas omitidas y los casos ambiguos en el informe: una palabra usada con diferentes significados, frases construidas a partir de piezas y plurales. Decide esos manualmente.
- `SOURCE_LOCALE` en el bootstrap es igual a `sourceLocale` en la configuración.

Las cadenas que el agente omitió aparecen como texto que permanece en el idioma de origen más tarde.

<a id="choose-models-and-translate"></a>
## Elegir modelos y traducir

Tú ejecutas esta parte. Utiliza tu clave de API y gasta dinero de tu cuenta.

La lista de modelos de `init` es un punto de partida. Clasifique los modelos de chat del proveedor activo y, cuando la lista corta parezca correcta, escríbala en `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` solo reemplaza `translationModels`. La misma clasificación se encuentra en la pestaña [Modelos](/es/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Luego extrae y traduce:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` escribe `strings.json` y `ui-languages.json`. `translate-ui` escribe un archivo JSON por cada idioma de destino en `ui.flatOutputDir`. Deja esos archivos generados sin editar. `sync` ejecuta `extract` y `translate-ui` juntos cuando `features.translateUIStrings` está activado. Lo que `extract` escanea y escribe: [Cadenas de interfaz de usuario, Paso 2](/es/guide/ui-strings/#step-2-extract-strings).

`t()` busca la frase de origen en el JSON de la configuración regional. El ID en `strings.json` no es la clave de búsqueda. Un archivo o una clave faltante devuelve la frase de origen.

<a id="check-one-language"></a>
### Comprobar un idioma

Recarga la aplicación, cambia a un idioma de destino y abre una pantalla con algunas cadenas envueltas. Usa el selector de idioma que añadió el agente, o llama a `loadLocale` y `changeLanguage` tú mismo. El texto que aún está en el idioma de origen no fue envuelto, se ejecuta en el momento de la importación o no tiene una entrada en el JSON de la configuración regional. Comprueba el JSON para la frase antes de sospechar del código.

Cuando una llamada envuelta usa `{ plurals: true, count }`, añade el archivo plano de la configuración regional de origen para que las formas plurales se resuelvan. Eso añade una importación de `{sourceLocale}.json` desde `flatOutputDir` y una opción `sourcePluralFlatBundle`, mostrada en [Conectar i18next](/es/guide/ui-strings/i18next-runtime).

<a id="keep-it-translated"></a>
## Mantenerlo traducido

Vuelva a ejecutar `ai-i18n-tools sync` (o `extract` y luego `translate-ui`) después de cambiar el texto fuente. La caché significa que solo las cadenas nuevas o modificadas van al modelo. Agregue los scripts de [Scripts recomendados para package.json](/es/guide/quick-start#recommended-packagejson-scripts), y ejecute `sync` en CI para que las traducciones no se desvíen. Vuelva a cargar la aplicación después de una ejecución de traducción para que tome el nuevo JSON. `ai-i18n-tools dashboard` abre el [Panel de traducción](/es/guide/translation-dashboard/) para revisar las traducciones.

La plantilla predeterminada de `init` también lista `README.md`. Pegue el marcador de lista de idiomas antes de que `sync` lo traduzca. Consulte [Agregar i18n a su README y documentos Markdown](/es/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Hazlo manualmente

Siga estos pasos si prefiere hacer los cambios usted mismo, o si quiere saber qué hace la instrucción. Los pasos coinciden con las partes de la instrucción. Al final, seguirá [instalando la CLI](#install-and-choose-a-provider), [inicializando el proyecto](#initialise-the-project) y [traduciendo](#choose-models-and-translate).

1. [Instale las bibliotecas de tiempo de ejecución](#step-1-install-the-runtime-libraries).
2. [Extraiga una vez y agregue el bootstrap](#step-2-extract-once-and-add-the-bootstrap).
3. [Envuelva las cadenas](#step-3-wrap-strings) en `t()` o `i18n.t()`.
4. [Agregue un selector de idioma](#step-4-add-a-language-switch).

<a id="step-1-install-the-runtime-libraries"></a>
## Paso 1: Instalar las bibliotecas de tiempo de ejecución

ai-i18n-tools no depende de `i18next` o `react-i18next`. La aplicación las instala.

- Cada aplicación JS/TS que busca cadenas en tiempo de ejecución: `i18next`.
- Componentes de React que llaman a `useTranslation()`: `react-i18next` también.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## Paso 2: Extraer una vez y agregar el bootstrap

El bootstrap importa `strings.json` y `ui-languages.json`, y solo `extract` los escribe. Escribe ambos incluso cuando no encuentra llamadas a `t()`, para que la aplicación compile.

```bash
ai-i18n-tools extract
```

Espere 0 cadenas, o 1 si su `package.json` tiene un `description`, porque el extractor lo incluye por defecto (`ui.uiExtractor.includePackageDescription`).

Cree el archivo de configuración de i18n. Esta versión es suficiente para envolver cadenas y traducirlas. `SOURCE_LOCALE` debe ser igual a `sourceLocale` en `ai-i18n-tools.config.json`. Ajuste las rutas de importación para que coincidan con `ui.stringsJson` y `ui.flatOutputDir`.

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

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

¿No usas React? Elimina la importación de `react-i18next` y la llamada a `.use(initReactI18next)`.

Para paquetes JSON bajo `public/`, el cargador obtiene `/locales/${code}.json`. Para una CLI de Node sin un empaquetador, lea el archivo con `readFileSync`. Ambas formas están en [Cargadores de locales](/es/guide/ui-strings/i18next-runtime#locale-loaders).

Importa este archivo desde la entrada de la aplicación antes del primer renderizado. En Next.js, impórtalo desde un módulo cliente, el mismo patrón que [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts).

<a id="step-3-wrap-strings"></a>
## Paso 3: Envolver cadenas

El argumento para `t()` es la frase en el idioma de origen que el usuario debería ver. Los archivos de locale planos se indexan por esa frase.

JSX:

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node, una CLI o cualquier módulo que no sea de React:

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

Reglas (también en [llamadas a t() y plurales](/es/guide/ui-strings/t-calls-and-plurals)):

- La clave es un literal. `t(variable)` y <code>{'t(`Hello ${name}`)'}</code> no se extraen, y las llamadas no literales se omiten sin advertencia.
- Los marcadores de posición dentro del literal usan el formato de i18next <code v-pre>{{name}}</code>, pasados en el segundo argumento.
- Plurales: una frase de origen más `{ plurals: true, count }`. Consulta [Plurales cardinales](/es/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true). No inventes claves `_one` / `_other` tú mismo.
- Los componentes de React toman `t` de `useTranslation()`. Otros archivos llaman a `i18n.t`. Una constante evaluada en el momento de la importación debe moverse a una función o a `useMemo(..., [t])`, para que `t()` se ejecute después de que se cargue la configuración regional.
- Los componentes de servidor de Next.js no deben llamar a `changeLanguage` en una instancia compartida de i18next. Las solicitudes concurrentes comparten ese singleton. Usa un `createInstance()` por solicitud, o una búsqueda sin estado del paquete plano (consulta el [híbrido de Nextra](/es/guide/integrations/nextra#optional-t-for-app-react-hybrid)).

Deja esto como está: `className`, `href` y otras URL, rutas de importación, ID, ID de prueba, códigos de error, claves de objeto usadas como identificadores y texto dentro de los comentarios.

Ejecute `ai-i18n-tools extract` de nuevo. El catálogo ahora debería listar las frases que envolvió.

<a id="step-4-add-a-language-switch"></a>
## Paso 4: Agregar un selector de idioma

Restaure una configuración regional guardada antes de la primera renderización, como se describe en [Configurar i18next](/es/guide/ui-strings/i18next-runtime#startup-locale). Luego agregue un control que llame a `await loadLocale(code)` seguido de `await i18n.changeLanguage(code)`. Construya las opciones a partir de `ui-languages.json`. El widget, las etiquetas y el diseño de derecha a izquierda: [Selector de idioma y RTL](/es/guide/ui-strings/language-switcher).

Un programa de línea de comandos no tiene widget. Agregue `--lang <code>` (y `-L` cuando ese nombre esté libre), luego una variable de entorno de idioma que la aplicación ya posee. No lea `AI_I18N_LANG`; esa variable es solo para la CLI de ai-i18n-tools. Acepte solo los códigos listados en `ui-languages.json`.

Omita este paso cuando el programa no muestre texto que una persona lea.

Ese es el último paso manual. Continúe en [Elegir modelos y traducir](#choose-models-and-translate).

<a id="coming-from-another-tool"></a>
## Viniendo de otra herramienta

ai-i18n-tools incluye su propio extractor de cadenas. Si usaste `i18next-scanner`, `babel-plugin-i18next-extract` o similar, puedes eliminar esas dependencias de desarrollo después de migrar. Los archivos JSON de espacio de nombres de i18next existentes pueden permanecer en la [canalización JSON](/es/guide/json#i18next-namespace-files). Los diccionarios `.content.ts` de Intlayer se pueden importar con `migrate-intlayer`: consulta [Migrar desde Intlayer](/es/guide/migrating-from-intlayer). Para mantener Intlayer en tiempo de ejecución y solo rellenar sus traducciones, usa `translate-intlayer`: consulta [Traducir Intlayer in situ](/es/guide/translating-intlayer).

<a id="not-your-case"></a>
## ¿No es su caso?

| Su código hoy | Leer |
| --- | --- |
| Ya `t("…")` o `i18n.t("…")` con la frase en el idioma de origen | [Cadenas de interfaz de usuario](/es/guide/ui-strings/) pasos 2–3, luego [Conectar i18next](/es/guide/ui-strings/i18next-runtime) |
| JSON del espacio de nombres de i18next (`t("saveButton")` más `en/translation.json`) | [JSON](/es/guide/json). No cambie esas claves por frases en el idioma de origen a menos que esté listo para cambiar cada llamada |
| Diccionarios de Intlayer, migrando de Intlayer | [Migrar de Intlayer](/es/guide/migrating-from-intlayer) |
| Diccionarios de Intlayer, manteniendo Intlayer | [Traducir Intlayer in situ](/es/guide/translating-intlayer) |
| Un archivo HTML | [HTML plano](/es/guide/ui-strings/plain-html) y `mark-html` |
| Sitios de documentación o HTML de página de Astro | [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website) y [Sitio web de Astro](/es/guide/ui-strings/astro-website). `t()` es solo para datos compartidos y frontmatter |
| Una aplicación Python | [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) |
| Catálogos de Django, Flask-Babel, o una aplicación que ya usa GNU gettext | [Agregar i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext) |
| Un archivo README de repositorio u otros archivos Markdown | [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Ejemplos

| Ejemplo | Lo que muestra |
| --- | --- |
| [console-app](/es/examples#console-app) | La aplicación Node más pequeña, `t()` ya envuelta, además de un bloque README |
| [nextjs-app](/es/examples#nextjs-app) | Bootstrap de React, plurales, un sitio de documentación y un bloque README |

Copia uno con `npx degit`. Comandos: [Ejemplos](/es/examples#nodejs-examples).
