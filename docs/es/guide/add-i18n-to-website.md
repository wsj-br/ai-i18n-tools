<a id="add-i18n-to-a-website-or-docs-site"></a>
# Añadir i18n a un sitio web o sitio de documentación

Esta página toma un sitio de documentación (Markdown o MDX) o un sitio de marketing o estático (un sitio web de Astro o HTML simple) que tiene un solo idioma y le añade configuraciones regionales con ai-i18n-tools. La herramienta traduce el contenido de la página con los modelos de su proveedor de LLM y escribe una copia localizada por idioma. El framework de su sitio sirve esas copias y proporciona el selector de idioma.

La forma más rápida es darle a un agente de codificación la instrucción de esta página. Habilita la i18n de ese framework y comprueba la configuración. Usted instala la CLI, elige el proveedor e inicializa el proyecto usted mismo, porque eso necesita su clave de API y sus elecciones. También ejecuta la traducción usted mismo, porque gasta dinero de su cuenta.

Para una aplicación cuyas cadenas de interfaz de usuario residen en llamadas `t()`, use [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) o [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python). Un README de repositorio sin framework de sitio usa [Añadir i18n a su README y documentos Markdown](/es/guide/add-i18n-to-readme). ¿No está seguro de cuál aplica? Consulte [¿No es su caso?](#not-your-case) al final.

<a id="steps"></a>

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

Instale el paquete como una dependencia de desarrollo. La configuración de VitePress importa `prefixVitepressThemeConfigLinks` de `ai-i18n-tools`, y una página HTML simple copia `i18n.js` del paquete. Un ejecutable independiente es suficiente solo cuando el sitio nunca importa `ai-i18n-tools/runtime` y nunca importa el paquete de su configuración. Otras opciones de instalación: [Instalación](/es/guide/installation).

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

Esto se ejecuta una vez, antes de la instrucción. Escribe `ai-i18n-tools.config.json` y usa el proveedor que eligió anteriormente. No activa la i18n en un sitio existente. Eso es la instrucción.

| Su sitio | Plantilla de inicialización | Guía para los detalles |
| --- | --- | --- |
| Astro Starlight | `ui-starlight` | [Astro](/es/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/es/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/es/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/es/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/es/guide/integrations/fumadocs) |
| Sitio web de Astro simple | `ui-astro-website` | [Astro](/es/guide/integrations/astro#plain-astro-marketing-and-app-sites) |
| Un archivo HTML que cambia el idioma en el navegador | `ui-plain-html` | [Aplicaciones HTML simples](/es/guide/ui-strings/plain-html) |
| Un archivo HTML traducido por configuración regional | `docs-plain-html` | [Páginas HTML](/es/guide/documents/html-pages) |
| Sin framework de sitio, solo un README y archivos Markdown | `docs-markdown`, o cualquier plantilla más `--with-readme` | [Añadir i18n a tu README y documentos Markdown](/es/guide/add-i18n-to-readme) |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

Cambie `ui-vitepress` por la plantilla de la tabla. Luego edite `sourceLocale`, `targetLocales` y `docs[].contentPaths`. `sourceLocale` es el idioma de las páginas. Cualquier idioma BCP-47 es válido. `contentPaths` deben ser las páginas y carpetas escritas en ese idioma. Las rutas en la plantilla son puntos de partida. `docsOutput.style` ya está configurado para la plantilla. `ui-astro-website` y `ui-plain-html` escriben un bloque `ui` y un array `docs` vacío. La instrucción añade un bloque `docs` de HTML de página para un sitio Astro simple cuando está traduciendo HTML de página.

Ejecuta `init` una vez. Reescribe `ai-i18n-tools.config.json` cada vez, por lo que una segunda ejecución descarta las ediciones que hayas realizado.

<a id="run-the-agent-prompt"></a>
## Ejecutar la instrucción del agente

Abra el proyecto en su agente de codificación (Cursor, Claude Code, Copilot o similar), inicie un nuevo chat y pegue la instrucción a continuación. El proyecto ya debe estar inicializado. No hay nada que editar. Si desea omitir un detalle del framework, dígalo en el mismo mensaje.

El agente primero verifica que la CLI y la configuración existan, y se detiene con instrucciones si falta alguna. Luego detecta el framework y habilita el enrutamiento de configuración regional de ese framework. No instala la CLI, no inicializa la configuración, no lee su clave de API ni traduce. La traducción es el paso posterior a la revisión, y usted la ejecuta.

````markdown
# Enable i18n on this website or docs site

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user to install ai-i18n-tools as a dev dependency and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-vitepress`, `ui-docusaurus`, `ui-starlight`, `ui-nextra`,
`ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, or `docs-plain-html`.
Do not install or initialise anything yourself.

`ui-plain-html` and `ui-astro-website` are valid when `docs` is empty. Every
other template needs one `docs` entry. If that entry is missing, stop and name
the init command.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, reword, or rename source pages, nav labels, or dictionary
  strings. Do not edit generated locale trees (`docs/<locale>/`,
  `i18n/<locale>/` other than the source catalog from `write-translations`,
  `theme.<locale>.json`, `content/<locale>/`, locale MDX, or locale HTML).
- Do not reformat unrelated code. Leave unrelated edits in a dirty tree alone.
- Apply one branch. If the framework is unclear, stop and ask.

Detect the branch from `docsOutput.style`, then from the config file and
`package.json`: `vitepress`, `docusaurus`, `nextra`, `fumadocs`,
`astro-starlight` with pages under `src/content/docs` (Starlight), `nested`
with HTML `contentPaths` (`docs-plain-html`), a `ui` block whose extractor
extensions include `.html` (`ui-plain-html`), or an Astro site that is not
Starlight (`ui-astro-website`).

Point `contentPaths` and `docsRoot` at the source-language pages that exist
in this repository. The paths written by `init` are starters.

## VitePress

- In `.vitepress/config`, set `locales.root` for the source locale (`label`,
  `lang`, and the existing `themeConfig`). Add one `locales[code]` per
  `targetLocales` entry: `label`, `lang`, `link: '/<code>/'`, and per-locale
  `title` / `description`. Keep `targetLocales` equal to those keys.
- Author nav and sidebar links once, without a locale prefix. Prefix `link`
  and `activeMatch` per locale with `prefixVitepressThemeConfigLinks` from
  `ai-i18n-tools`. `translate-docs` does not rewrite links inside the config.
- Leave `docsOutput.vitepressThemeCatalog` as `init` wrote it. If the config
  already loads `theme.en.json`, keep that loader and add `locales[code]` the
  same way. If theme strings are still inline, leave them inline. Do not
  create `theme.en.json` or `theme.<locale>.json` yourself, and do not load a
  theme file that is not on disk. The first `sync` bootstraps a missing
  catalog.
- `docsOutput.style` is `vitepress`. `outputDir` is the docs root.

## Docusaurus

- Add the `i18n` block in `docusaurus.config.js`: `defaultLocale`, `locales`
  (source plus each target), and `localeConfigs[locale].path` when the URL
  path differs from the locale code. The path must match the folder under
  `i18n/`.
- Point `docusaurusCatalogDir` at `i18n/<defaultLocale>`. `docsOutput.style`
  is `docusaurus`. `contentPaths` and `docsRoot` are the source docs folder.
  `outputDir` is the parent of the locale folders.
- Run this project's `docusaurus write-translations` so
  `i18n/<defaultLocale>/` exists. That command does not call a model. Do not
  run `sync` or `translate-docs`.
- Custom React in `src/pages` and `src/components` is not markdown. Mark
  user-facing copy with `<Translate>` or `translate()` from
  `@docusaurus/Translate`. The message has to be a static string. Do not wrap
  those calls in `t()`.

## Nextra

- Move source MDX to `content/<sourceLocale>/` (usually `content/en/`). The
  source locale is a folder, not the content root. Leave `_meta.ts` beside
  the pages it labels.
- Set `i18n.locales` and `defaultLocale` in `next.config`. `targetLocales`
  matches `i18n.locales` except the default locale.
- Add an `app/[lang]/` route, `getPageMap('/' + lang)`, and `<Layout i18n>`.
- Add `app/_dictionaries/<source>.ts` (usually `en.ts`) with the English
  chrome as string literals (`siteTitle`, footer, `editLink`, search
  placeholder, table-of-contents title, last-updated label), and
  `get-dictionary.ts` that imports `./${locale}`. Pass those fields into
  `<Layout>`, `<Navbar>`, and `<Footer>`. Keep native language names in a
  labels map, untranslated.
- Config: `features.translateDocs`, `docsOutput.style` `nextra`, `docsRoot`
  `content/<sourceLocale>`, `nextraDictionaryPath` the source dictionary.
- Optional: `proxy.ts` that re-exports `nextra/locales`.
- Do not write `app/_dictionaries/pt-BR.ts`, `content/pt-BR/`, or any other
  locale tree.

## Fumadocs

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and
  `parser: "dot"` or `"dir"`. Use `"dot"` unless the source pages already live
  under a locale folder. Set `docsOutput.fumadocsParser` to the same value.
- Add `app/[lang]/` routes. Export `createI18nMiddleware(i18n)` from
  `proxy.ts`.
- Dot: source MDX stays at the collection root (`content/docs/`). Dir: source
  MDX lives under `content/docs/<sourceLocale>/`. Point `contentPaths` and
  `docsRoot` at that source tree. `docsOutput.style` is `fumadocs`.
- `targetLocales` equals `languages` minus the default language, character
  for character.
- Leave English UI overrides as they are. Do not write `ui.<locale>.json` or
  translated MDX. Do not put this catalog in `json[]`.

## Astro Starlight

- In the Starlight config, set `locales`, including a `root` entry when the
  source language should be unprefixed (`label` and required `lang`). Set
  `defaultLocale: 'root'` when that root entry is the source language.
- Source pages stay in `src/content/docs/`. `translate-docs` writes
  `src/content/docs/<locale>/`. Point `contentPaths` at the source pages, not
  at locale folders. `outputDir` and `docsRoot` are `src/content/docs`.
  `docsOutput.style` is `astro-starlight`.
- Align `targetLocales` with the non-root locale keys. Starlight directory
  keys are often lowercase (`pt-br`). If you change case to match, say so in
  the report.
- Prefer sidebar `slug` entries so the label comes from the page title. Do
  not hand-translate sidebar `label` maps or `social[].label`. There is no
  shell catalog to add.

## Plain Astro

- Enable Astro i18n routing: `i18n.locales` includes the source locale and
  each target. Astro route codes are lowercase (`pt-br`). In the report, list
  `targetLocales`, `i18n.locales`, and the note that flat JSON filenames use
  the casing in `targetLocales`.
- `init -t ui-astro-website` leaves `docs` empty and turns on UI strings. When
  page HTML should be translated, set `features.translateDocs` to true and
  append one `docs` entry: `contentPaths` the source pages (for example
  `src/pages/index.astro`), `outputDir` `src/pages`, `addFrontmatter` false,
  `docsOutput.style` `astro-starlight`, `docsRoot` `src/pages`. Leave
  `features.translateUIStrings` as it is.
- If frontmatter or shared data calls `t()`, stop that part and tell the user
  to run the JS/TS prompt and skip i18next. Astro resolves `t` at build time.
  Do not wrap those calls here, and do not install i18next.

## Plain HTML

Each file belongs to only one pipeline. If the same file is both a `docs[]` source and
under `ui.sourceRoots`, stop and ask.

`ui-plain-html` (one page, language switches in the browser):

- Run `ai-i18n-tools mark-html` with no `--write`, read the report, then
  run it again with `--write`. It inserts `data-i18n` markers. It does not
  call a model.
- Copy `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` next to the page.
  Load it at the end of `<body>` with `data-source-locale` equal to
  `sourceLocale`, `data-locales-base` pointing at `flatOutputDir` as a URL
  relative to the script, and `data-locale-select` pointing at an empty
  `<select>`. Do not add a `docs` block for the same file.

`docs-plain-html` (one HTML file per locale):

- Confirm `contentPaths`, `outputDir`, and `docsRoot`. `docsOutput.style` is
  `nested`. Do not add `data-i18n` markers. Do not fill a language list by
  hand. `translate-docs` writes the locale files and the list.

## Verify and report

The framework's locale config matches `targetLocales`. `contentPaths` point
at source-language pages. No generated locale tree was edited. Run the
project's build or typecheck when it has one, and do not run a translation.

Report the branch you applied, the files changed, and any page you left out
of `contentPaths`, with a one-line reason. Then list the commands for the
user, and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools sync`, then build the site and open one localised route.
````

<a id="review-the-result"></a>
## Revisar el resultado

El agente finaliza con un informe. Revísalo antes de traducir:

- La diferencia. Debe ser la configuración regional del framework, `contentPaths`, y el enrutamiento que describe la rama. La prosa de la página de origen debe leerse igual que antes. `git diff --stat` muestra cuánto cambió.
- `targetLocales` coincide con las claves de configuración regional que servirá el framework.
- `contentPaths` apunta a páginas en el idioma de origen, no a una carpeta de configuración regional que la herramienta debería escribir.
- No se editó ningún árbol de configuración regional generado: `docs/<locale>/`, HTML de configuración regional, `content/<locale>/`, `theme.<locale>.json`, o una carpeta `i18n/<locale>/` de Docusaurus que no sea el catálogo de origen de `write-translations`.
- La compilación o verificación de tipos del proyecto sigue pasando.

<a id="choose-models-and-translate"></a>
## Elegir modelos y traducir

Tú ejecutas esta parte. Utiliza tu clave de API y gasta dinero de tu cuenta.

La lista de modelos de `init` es un punto de partida. Clasifique los modelos de chat del proveedor activo y, cuando la lista corta parezca correcta, escríbala en `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` solo reemplaza `translationModels`. La misma clasificación se encuentra en la pestaña [Modelos](/es/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Luego traduzca y compile:

```bash
ai-i18n-tools sync
```

`sync` ejecuta `translate-docs` cuando `features.translateDocs` está activado, y `extract` más `translate-ui` cuando las cadenas de la interfaz de usuario están activadas (`ui-plain-html`, y un sitio Astro simple que también usa `t()`). `ai-i18n-tools translate-docs` ejecuta el paso de documentos por sí solo.

<a id="what-gets-translated"></a>
### Qué se traduce

Los cuerpos de página pasan por el pipeline de [Documentos](/es/guide/documents/). La interfaz del framework (navegación, barra lateral, etiquetas de tema) se gestiona en la misma ejecución donde el framework lo soporta. Ese no es el pipeline de [JSON](/es/guide/json) separado. Una página HTML simple que cambia de idioma en el navegador es la excepción: `mark-html` y `translate-ui` escriben JSON plano, y el script del navegador lo aplica. Un archivo HTML por cada configuración regional permanece en el pipeline de Documentos.

| Framework | Cadenas de shell y tema | Cómo |
| --- | --- | --- |
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | `docs[].docusaurusCatalogDir` más `translate-docs` |
| VitePress | Catálogo de tema, navegación y barra lateral | `docsOutput.vitepressThemeCatalog` más `translate-docs` |
| Nextra | Etiquetas de barra lateral `_meta.ts` | Automático con `style: "nextra"` |
| Nextra | Diccionario de tema `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | Etiquetas de barra lateral `meta.json` | Automático con `style: "fumadocs"` |
| Fumadocs | Catálogo de anulaciones de interfaz de usuario | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | Cadenas de interfaz de usuario integradas en varias configuraciones regionales | Solo páginas |

Las imágenes y capturas de pantalla no son traducidas por `translate-docs`. Para archivos específicos de la configuración regional, consulta [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/).

Después del primer `sync`, algunos frameworks todavía necesitan la configuración para cargar el catálogo que el comando acaba de escribir. Esas indicaciones permanecen en las páginas de integración: [catálogo de temas de VitePress](/es/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off), [diccionario de Nextra](/es/guide/integrations/nextra#agent-prompt-dictionary-and-routes) y [catálogo de UI de Fumadocs](/es/guide/integrations/fumadocs#agent-prompt).

<a id="check-one-language"></a>
### Comprobar un idioma

Compila el sitio y abre una ruta localizada en el navegador. El desplegable de configuración regional propio del framework es el selector. Para un archivo HTML que cambia en el navegador, usa el selector que el tiempo de ejecución rellena. Para un archivo HTML por cada configuración regional, abre el archivo dentro de la carpeta de configuración regional.

El texto que aún está en el idioma de origen se omitió de `contentPaths`, es un bloque de código, una URL o un ancla de encabezado, o la ruta no está conectada. Una etiqueta de navegación de VitePress que aún está en el idioma de origen es el catálogo de temas: ejecuta `sync` primero, luego la [indicación del catálogo de temas](/es/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) si las cadenas aún están en línea en la configuración.

<a id="keep-it-translated"></a>
## Mantenerlo traducido

Vuelve a ejecutar `ai-i18n-tools sync` después de que cambien las páginas de origen. La caché significa que solo el texto nuevo o modificado va al modelo. Confirma los árboles de configuración regional que escribe el pipeline. `ai-i18n-tools dashboard` abre el [Panel de traducción](/es/guide/translation-dashboard/) para revisar las traducciones.

Para traducir `README.md` en la misma ejecución, genera la estructura con `--with-readme` (o añade el bloque a una configuración existente). Consulta [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Hazlo manualmente

Sigue estos pasos si prefieres hacer los cambios tú mismo o si quieres saber qué hace la indicación. Todavía [instalas la CLI](#install-and-choose-a-provider), [inicializas el proyecto](#initialise-the-project) y [traduces](#choose-models-and-translate) al final.

1. Apunta `contentPaths` y `docsRoot` a las páginas en el idioma de origen. Las rutas de las plantillas son puntos de partida.
2. Habilita el enrutamiento de configuración regional del framework. Usa la rama que coincida con la plantilla. La página de integración tiene la referencia completa.

Las cadenas de shell que el framework lee de un catálogo se conectan después del primer `sync`. Cada rama a continuación enlaza ese seguimiento.

<a id="vitepress"></a>
### VitePress

Añade `locales.root` y un `locales[code]` por destino, y prefija los enlaces de navegación y de la barra lateral con `prefixVitepressThemeConfigLinks`. Deja las cadenas de tema en línea para el primer `sync`. Lista de verificación: [Habilitar i18n en un sitio existente](/es/guide/integrations/vitepress#enable-i18n-in-an-existing-site). Después de que `sync` haya escrito `theme.<locale>.json`, pega la [indicación del catálogo de temas](/es/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) si la configuración aún tiene las cadenas en línea.

<a id="docusaurus"></a>
### Docusaurus

Añade el bloque `i18n`, apunta `docusaurusCatalogDir` al catálogo de origen y ejecuta `docusaurus write-translations`. Lista de verificación: [Habilitar i18n en un sitio existente](/es/guide/integrations/docusaurus#enable-i18n-in-an-existing-site). JSON de shell: [Cadenas de shell](/es/guide/integrations/docusaurus#shell-strings-write-translations).

<a id="nextra"></a>
### Nextra

Mueve MDX bajo `content/<sourceLocale>/`, añade `app/[lang]/` y añade el módulo de diccionario de origen. Lista de verificación: [Habilitar i18n en un sitio existente](/es/guide/integrations/nextra#enable-i18n-in-an-existing-site). La [indicación del diccionario](/es/guide/integrations/nextra#agent-prompt-dictionary-and-routes) es el paso más largo para la misma conexión. Aplicación React que necesita `t()`: [indicación híbrida](/es/guide/integrations/nextra#optional-t-for-app-react-hybrid).

<a id="fumadocs"></a>
### Fumadocs

Añade `defineI18n`, `app/[lang]/` y el middleware. Haz coincidir `fumadocsParser` con `dot` o `dir`. Lista de verificación: [Habilitar i18n en un sitio existente](/es/guide/integrations/fumadocs#enable-i18n-in-an-existing-site). La [indicación del catálogo de UI](/es/guide/integrations/fumadocs#agent-prompt) conecta `i18n.translations()` después de que existan las rutas.

<a id="astro-starlight"></a>
### Astro Starlight

Añade `locales`, incluyendo `root` cuando el idioma de origen no tiene prefijo. Las páginas permanecen en `src/content/docs/`. Lista de verificación: [Habilitar i18n en un sitio existente](/es/guide/integrations/astro#enable-i18n-in-an-existing-site). Starlight incluye sus propias cadenas de UI. Prefiere las entradas de la barra lateral `slug`.

<a id="plain-astro"></a>
### Astro simple

Activa el `i18n.locales` de Astro y, cuando el HTML de la página deba traducirse, añade el bloque `docs` de [Astro simple](/es/guide/integrations/astro#plain-astro-marketing-and-app-sites). Las llamadas a `t()` en el frontmatter usan la [indicación JS/TS](/es/guide/add-i18n-to-js#run-the-agent-prompt) sin instalar i18next. Astro resuelve `t` en tiempo de compilación.

<a id="plain-html"></a>
### HTML puro

Dos opciones, y un archivo pertenece a una de ellas:

- Una página que cambia de idioma en el navegador: `ui-plain-html`. Ejecute `ai-i18n-tools mark-html` (simulación, luego `--write`) y cargue `i18n.js`. Consulte [Aplicaciones HTML simples](/es/guide/ui-strings/plain-html).
- Un archivo HTML traducido por configuración regional: `docs-plain-html`. Consulte [Páginas HTML](/es/guide/documents/html-pages).

Ese es el último paso manual. Continúe en [Elegir modelos y traducir](#choose-models-and-translate).

<a id="not-your-case"></a>
## ¿No es su caso?

| Usted tiene | Lea |
| --- | --- |
| Cadenas de la interfaz de usuario de la aplicación | [Añada i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) o [Añada i18n a una aplicación Python](/es/guide/add-i18n-to-python) |
| Catálogos de Django, Flask-Babel, o una aplicación que ya usa GNU gettext | [Agregar i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext) |
| Un README de repositorio junto al sitio, o archivos Markdown sin un framework de sitio | [Añada i18n a su README y documentos Markdown](/es/guide/add-i18n-to-readme). `init … --with-readme` añade ese bloque junto a una plantilla de sitio |
| JSON de configuración regional anidado independiente | [JSON](/es/guide/json) |
| Un sitio y cadenas de aplicación en una sola configuración | [Combinación de pipelines](/es/guide/combining-pipelines) |

Referencia para las opciones compartidas y las diferencias por framework: [Integraciones](/es/guide/integrations/).

<a id="examples"></a>
## Ejemplos

| Ejemplo | Lo que muestra |
| --- | --- |
| [vitepress-docs](/es/examples#vitepress-docs) | Páginas de VitePress y el catálogo de temas |
| [docusaurus-docs](/es/examples#docusaurus-docs) | Páginas de Docusaurus y JSON de shell |
| [astro-docs](/es/examples#astro-docs) | Páginas de Starlight |
| [nextra-docs](/es/examples#nextra-docs) | Rutas de Nextra 4 y el diccionario |
| [fumadocs-docs](/es/examples#fumadocs-docs) | Rutas de Fumadocs y el catálogo de UI |
| [astro-website](/es/examples#astro-website) | Página de aterrizaje de Astro, HTML más `t()` |
| [plain-html](/es/examples#plain-html) | Un archivo HTML, marcadores `data-i18n` |
| [plain-html-docs](/es/examples#plain-html-docs) | Un archivo HTML por configuración regional |

Copia uno con `npx degit`. Comandos: [Ejemplos](/es/examples#nodejs-examples).
