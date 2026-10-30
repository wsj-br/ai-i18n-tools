<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# Añadir i18n a su README y documentos Markdown

Esta página toma un repositorio en GitHub, GitLab, Bitbucket o cualquier otro proveedor cuyos lectores empiezan por `README.md` y añade un archivo por idioma. No hay ningún framework de sitio de documentación que configurar. El proyecto habitual también tiene una aplicación o CLI, y el README debe usar los mismos idiomas y los mismos términos de producto que esa aplicación. Un repositorio de biblioteca o solo de documentación sin cadenas de interfaz de usuario es el otro caso, cubierto a continuación.

<a id="what-you-get"></a>

La herramienta deja `README.md` en su lugar. Los proveedores siguen renderizándolo como la página principal del repositorio. Cada configuración regional de destino es un archivo hermano como `translated-docs/README.de.md`. Una fila de idiomas dentro del README enlaza esos archivos, y la misma fila se escribe en cada traducción, con enlaces que funcionan desde el archivo que el lector está viendo. `translate-docs` rellena esa fila. Reemplaza todo, desde el marcador de apertura hasta el marcador de cierre, con un enlace por configuración regional. Añada `CONTRIBUTING.md`, `CHANGELOG.md` o una carpeta `docs/` al mismo bloque cuando esos archivos también deban traducirse. Consulte [Más allá del README](#step-3-more-than-the-readme).

La forma más rápida es dar a un agente de codificación la instrucción de esta página. Comprueba la configuración y añade el marcador de la lista de idiomas. Usted mismo instala la CLI, elige el proveedor e inicializa el proyecto, porque eso requiere su clave de API y sus elecciones. También ejecuta la traducción usted mismo, porque gasta dinero de su cuenta.

Un sitio de VitePress, Docusaurus, Starlight, Nextra, Fumadocs o Astro utiliza [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website). Añada `--with-readme` cuando el README del repositorio también deba traducirse. ¿No está seguro de cuál se aplica? Consulte [¿No es su caso?](#not-your-case) al final.

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

Un repositorio con un `package.json` instala el paquete como una dependencia de desarrollo. Otras opciones de instalación: [Instalación](/es/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` y `yarn add --dev ai-i18n-tools` también funcionan.

Un repositorio sin proyecto Node.js puede usar el ejecutable independiente. Linux y macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

El instalador comprueba `SHA256SUMS.txt`, instala el comando como `ai-i18n-tools` y lo añade a `PATH`. Los binarios no están notariados ni firmados con Authenticode. Pasos manuales y nombres de activos: [Ejecutables independientes](/es/guide/installation#standalone-executables). `npx ai-i18n-tools` también funciona cuando Node.js está instalado y no desea una dependencia de proyecto.

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

Ejecuta esto una vez, antes de la instrucción. Escribe la configuración y utiliza el proveedor que eligió anteriormente. No edita `README.md`. Cuando la configuración incluye un bloque README, imprime la línea del marcador para pegar y advierte si falta `README.md`.

| Tiene | Generador | Entonces |
| --- | --- | --- |
| Una aplicación JS/TS más un README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, el predeterminado) | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) para `t()`, y esta página para el README |
| Una aplicación Python más un README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) para la aplicación, y esta página para el README |
| Cualquier otra plantilla, más un README | añada `--with-readme` a ese comando `init` | Esta página para el bloque README |
| Solo README y Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | Esta página |

`--with-readme` es una operación nula en `ui-markdown` y `docs-markdown`, porque esas plantillas ya incluyen el bloque README.

Aplicación JS/TS y README (un comando; `ui-markdown` es la plantilla predeterminada):

```bash
ai-i18n-tools init -P openrouter
```

Python, Astro, HTML simple, VitePress, Docusaurus o cualquier otra plantilla, con el mismo bloque README añadido:

```bash
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

Solo archivos README y Markdown:

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
```

Luego edite `sourceLocale` y `targetLocales` en `ai-i18n-tools.config.json`. `sourceLocale` es el idioma en el que está escrito el README. Cualquier idioma BCP-47 es válido. `features.translateDocs` debe ser true. Una configuración híbrida también establece `features.translateUIStrings`. `docs[].contentPaths` enumera los archivos y carpetas Markdown a traducir. El andamiaje enumera `README.md`.

Ejecute `init` una vez. Reescribe `ai-i18n-tools.config.json` cada vez, por lo que una segunda ejecución descarta las ediciones que haya realizado. Una configuración existente se deja intacta cuando omite `init`: la instrucción añade el bloque README, y el [Paso 1](#step-1-configure-the-docs-block) muestra la misma edición a mano.

<a id="run-the-agent-prompt"></a>
## Ejecutar la instrucción del agente

Abra el proyecto en su agente de codificación (Cursor, Claude Code, Copilot o similar), inicie un nuevo chat y pegue la instrucción a continuación. El proyecto ya debe estar inicializado. No hay nada que editar. Si otros archivos Markdown deben traducirse, nómbrelos en el mismo mensaje.

El agente primero comprueba que la CLI y la configuración existen, y se detiene con instrucciones si falta uno. Luego funciona en dos partes:

- La Parte 1 añade el bloque README plano cuando la configuración aún no lista `README.md`.
- La Parte 2 añade el marcador de la lista de idiomas al README de origen.

No instala la CLI, inicializa la configuración, lee su clave de API, rellena los enlaces de idioma ni traduce. La traducción es el paso posterior a la revisión, y usted la ejecuta.

````markdown
# Prepare README and Markdown translation

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user which command to run, then run this prompt again:

- JS/TS app plus a README: `ai-i18n-tools init -P <provider>`
- README and Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`
- Any other template: `ai-i18n-tools init -t <template> -P <provider> --with-readme`

Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, rewrite, or shorten the source README or any other source
  Markdown. Do not edit anything under `translated-docs/` or other generated
  locale trees. Do not hand-edit locale JSON.
- Do not reformat unrelated files. Leave unrelated edits in a dirty tree alone.

## Part 1 — Config

Skip this part when one `docs` entry already lists `README.md`. Do not add a
second block for the same file.

Otherwise set `features.translateDocs` to true and append one `docs` entry:

- `contentPaths` includes `README.md`
- `outputDir` is `translated-docs`
- `addFrontmatter` is false
- `docsOutput.style` is `flat`
- `docsOutput.flatPreserveRelativeDir` is true
- `docsOutput.linkRewriteDocsRoot` is `.`
- `docsOutput.postProcessing.languageListBlock` uses start
  `<small id="lang-list">`, end `</small>`, separator ` · `

```json
{
  "contentPaths": ["README.md"],
  "outputDir": "translated-docs",
  "addFrontmatter": false,
  "docsOutput": {
    "style": "flat",
    "flatPreserveRelativeDir": true,
    "linkRewriteDocsRoot": ".",
    "postProcessing": {
      "languageListBlock": {
        "start": "<small id=\"lang-list\">",
        "end": "</small>",
        "separator": " · "
      }
    }
  }
}
```

Leave `features.translateUIStrings` as it is. Add other source files the user
named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## Part 2 — Language list

In `README.md`, where readers should see the other languages, add this marker
if it is not already there. A short label on the line above it is normal
prose. Add that label only when the spot has no heading of its own.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.
Markers inside fenced code blocks are ignored, so a config sample in the same
file does not match. Do not put the real marker inside a fence.

## Verify and report

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and
exactly one docs block lists `README.md`. The marker is in the source README
and not inside a fence. Nothing under `translated-docs/` changed.

Report the files changed and any Markdown file you left out of `contentPaths`,
with a one-line reason. Then list the commands for the user, and do not run
them: `ai-i18n-tools suggest-models` (optional), `ai-i18n-tools sync`.
````

<a id="review-the-result"></a>
## Revisar el resultado

El agente finaliza con un informe. Revísalo antes de traducir:

- La diferencia. Debe ser la configuración y el marcador. El texto de origen debe leerse igual que antes. `git diff --stat` muestra cuánto cambió.
- Nada bajo `translated-docs/` u otro árbol de configuración regional generado fue editado.
- `ai-i18n-tools.config.json` analiza, `features.translateDocs` es true, y exactamente un bloque de documentos lista `README.md`.
- El marcador está en `README.md` y no dentro de un bloque de código cercado. Una muestra del marcador dentro de una valla está bien. El real está fuera.

<a id="choose-models-and-translate"></a>
## Elegir modelos y traducir

Tú ejecutas esta parte. Utiliza tu clave de API y gasta dinero de tu cuenta.

La lista de modelos de `init` es un punto de partida. Clasifique los modelos de chat del proveedor activo y, cuando la lista corta parezca correcta, escríbala en `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` solo reemplaza `translationModels`. La misma clasificación se encuentra en la pestaña [Modelos](/es/guide/translation-dashboard/models) de `ai-i18n-tools dashboard`.

Luego traduzca:

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` ejecuta los pasos habilitados en orden: `extract` y `translate-ui` cuando las cadenas de interfaz de usuario están activadas, y luego `translate-docs`. Se comparte una caché, por lo que una frase ya traducida para la aplicación se reutiliza cuando aparece en el README. Los catálogos de interfaz de usuario también se pasan a la traducción de documentos como sugerencias de glosario (`ui[].uiGlossary`, activado por defecto), lo que mantiene la coherencia de los nombres de botones y características. Consulte [Glosario](/es/guide/glossary).

Los nombres de los idiomas en la fila provienen de `ui-languages.json`, que `extract` escribe junto al catálogo de la interfaz de usuario. Una configuración solo de README no tiene catálogo de interfaz de usuario, por lo que la fila utiliza la lista de idiomas incluida en su lugar. Las etiquetas siguen siendo los nombres nativos. Ejecute `generate-ui-languages` solo cuando desee un manifiesto de proyecto propio.

Confirme `translated-docs/` y abra el README traducido en el host. Los enlaces relativos entre el README de origen y `translated-docs/README.de.md` se reescriben para cada archivo.

<a id="check-one-language"></a>
### Comprobar un idioma

Abre `translated-docs/README.de.md` (o el código de destino que hayas elegido) en el host y en el propio archivo. La fila de idiomas debe listar todas las configuraciones regionales, con enlaces que funcionen desde el archivo que estás viendo. Una frase que aún esté en el idioma de origen estaba dentro de un bloque de código, una URL o un ancla de encabezado, o no estaba en `contentPaths`.

<a id="keep-it-translated"></a>
## Mantenerlo traducido

Vuelve a ejecutar `ai-i18n-tools sync` después de que cambien el README de origen o las cadenas de la aplicación. La caché envía solo texto nuevo o modificado al modelo. Confirma los archivos actualizados en `translated-docs/`. `ai-i18n-tools dashboard` abre el [Panel de traducción](/es/guide/translation-dashboard/) para revisar las traducciones.

El flujo de trabajo siguiente es un ejemplo, no una acción publicada. Instala la CLI y ejecuta `sync` cuando `README.md` cambia. Almacena la clave del proveedor como un secreto del repositorio. Revisa la diferencia de `translated-docs/` y confírmala, o súbela a una rama y abre una solicitud de extracción.

```yaml
name: Translate README
on:
  push:
    paths:
      - "README.md"
      - "ai-i18n-tools.config.json"
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install --save-dev ai-i18n-tools
      - run: npx ai-i18n-tools sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

Usa la variable de entorno para el proveedor que configuraste. Ollama no se aplica en un ejecutor alojado a menos que lo instales allí.

<a id="hybrid-tips"></a>
### Consejos híbridos

- Traduzca el README a menos idiomas que la aplicación con `docs[].targetLocales`. Consulte [Menos configuraciones regionales para documentos](/es/guide/combining-pipelines#fewer-locales-for-documents).
- Ponga los términos del producto en `glossary.userGlossary`. El mismo CSV se utiliza para las cadenas de interfaz de usuario y para el README.
- Ejecute solo un lado con `ai-i18n-tools sync --no-docs` o `ai-i18n-tools sync --no-ui`.

<a id="say-that-the-translation-is-automatic"></a>
### Indicar que la traducción es automática

Las traducciones de IA pueden ser incorrectas. Una nota breve al final del README, como la que se encuentra en el [README de este repositorio](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md), informa a los lectores que los otros idiomas fueron traducidos automáticamente y deben verificarse antes de confiar en ellos.

<a id="do-it-by-hand"></a>
## Hazlo manualmente

Sigue estos pasos si prefieres hacer los cambios tú mismo, o quieres saber qué hace el prompt. Los dos primeros coinciden con las partes del prompt. Los dos últimos son para archivos adicionales y para enlaces que apuntan a un sitio publicado. Aun así, [instalas la CLI](#install-and-choose-a-provider), [inicializas el proyecto](#initialise-the-project) y [traduces](#choose-models-and-translate) al final.

1. [Configurar el bloque de documentación](#step-1-configure-the-docs-block).
2. [Añadir la lista de idiomas](#step-2-add-the-language-list).
3. [Más allá del README](#step-3-more-than-the-readme).
4. [Enlaces en el host](#step-4-links-on-the-host).

<a id="step-1-configure-the-docs-block"></a>
## Paso 1: Configurar el bloque de documentación

Cuatro claves son importantes:

- `sourceLocale`: el idioma en el que está escrito el README. Cualquier idioma es válido. El inglés es un ejemplo común en esta guía.
- `targetLocales`: los idiomas que se deben agregar.
- `features.translateDocs`: debe ser verdadero. Una configuración híbrida también establece `features.translateUIStrings`.
- `docs[].contentPaths`: los archivos y carpetas Markdown que se deben traducir. La plantilla enumera `README.md`.

Omite este paso cuando `init` ya haya escrito el bloque README. Úsalo cuando estés editando una configuración que ya existe.

<details>
<summary>Híbrido: cadenas de interfaz de usuario y el README</summary>

`ui-markdown` escribe esta forma. `ui` es el catálogo de la aplicación. La entrada `docs` es el README.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": ".",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

</details>

<details>
<summary>Solo README y Markdown</summary>

`docs-markdown` desactiva las cadenas de interfaz de usuario y mantiene el mismo bloque de README.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": "."
      }
    }
  ]
}
```

La configuración de la lista de idiomas es la misma que en el ejemplo híbrido. Se omiten aquí solo para mantener el fragmento corto. `init -t docs-markdown` las escribe.

</details>

<a id="add-the-block-to-a-config-you-already-have"></a>
### Añadir el bloque a una configuración existente

Añada el objeto `docs` del ejemplo híbrido y establezca `features.translateDocs` en `true`. Si la configuración ya tiene una matriz `docs` (un sitio de VitePress o Docusaurus, por ejemplo), añada el objeto README como una segunda entrada. `sync` ejecuta cada bloque. [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) hace esto: un bloque para el sitio de documentación, un bloque plano para `README.md`.

No añadas un segundo bloque cuando uno ya liste `README.md`.

<a id="step-2-add-the-language-list"></a>
## Paso 2: Añadir la lista de idiomas

Ponga esta línea en `README.md`, donde los lectores deberían ver los otros idiomas. Una etiqueta corta en la línea superior es prosa normal y se traducirá.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

La línea puede estar vacía. `translate-docs` reemplaza todo, desde el marcador de apertura hasta el marcador de cierre, con un enlace por cada configuración regional. Los marcadores dentro de los bloques de código cercados se ignoran, por lo que una muestra de configuración en el mismo archivo no coincide. Detalles: [Selector de idioma](/es/guide/documents/language-switcher).

<a id="step-3-more-than-the-readme"></a>
## Paso 3: Más allá del README

Añada rutas a `contentPaths`. `flatPreserveRelativeDir` mantiene las carpetas, por lo que `docs/guide.md` se convierte en `translated-docs/docs/guide.de.md` en lugar de colisionar con otro `guide.md`.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

Un archivo `.translate-ignore` omite las rutas que no desea traducir. `init --with-translate-ignore` escribe un iniciador. Los bloques de código cercados, las URL y los anclajes de encabezado no se traducen. Consulte [Diseños de salida](/es/guide/documents/output-layouts), [Enlaces de anclaje](/es/guide/documents/anchor-links) y [Reescritura de enlaces](/es/guide/documents/link-rewriting).

Capturas de pantalla que difieren por idioma: [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/).

<a id="step-4-links-on-the-host"></a>
## Paso 4: Enlaces en el host

Los enlaces a otros archivos en el repositorio se reescriben al archivo de la configuración regional. Un enlace a un sitio de documentación publicado no se reescribe. Este repositorio prefija las URL de sus sitios de documentación con la configuración regional usando `regexAdjustments`:

```json
"regexAdjustments": [
  {
    "search": "https://wsj-br\\.github\\.io/ai-i18n-tools/",
    "replace": "https://wsj-br.github.io/ai-i18n-tools/${translatedLocale}/"
  }
]
```

El reescritor de enlaces planos se ejecuta primero, luego estas sustituciones. Consulta [Reescritura de enlaces](/es/guide/documents/link-rewriting).

Ese es el último paso manual. Continúe en [Elegir modelos y traducir](#choose-models-and-translate).

<a id="not-your-case"></a>
## ¿No es su caso?

| Tienes | Lee |
| --- | --- |
| Cadenas de interfaz de usuario de la aplicación y ningún README para traducir | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) o [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) |
| Catálogos de Django, Flask-Babel, o una aplicación que ya usa GNU gettext | [Agregar i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext) |
| Un sitio de VitePress, Docusaurus, Starlight, Nextra, Fumadocs o Astro | [Añadir i18n a un sitio web o de documentación](/es/guide/add-i18n-to-website). Añade `--with-readme` cuando el README del repositorio también deba traducirse |
| Un archivo HTML por configuración regional | [Páginas HTML](/es/guide/documents/html-pages) |
| La referencia completa de `translate-docs` | [Documentos](/es/guide/documents/) |

<a id="examples"></a>
## Ejemplos

| Proyecto | Lo que muestra |
| --- | --- |
| [console-app](/es/examples#console-app) | Una pequeña aplicación Node más un bloque README plano |
| [nextjs-app](/es/examples#nextjs-app) | Cadenas de UI, un sitio de documentación y un bloque README plano separado |
| Este repositorio | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): bloque README plano, luego el sitio de VitePress |
