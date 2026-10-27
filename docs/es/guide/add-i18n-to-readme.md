<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# Añadir i18n a su README y documentos Markdown

Esta página es para un repositorio en GitHub, GitLab, Bitbucket o cualquier otro host cuyos lectores empiezan desde `README.md` y algunos otros archivos Markdown. No hay un framework de sitio de documentación que configurar. El proyecto habitual también tiene una aplicación o CLI, y el README debería usar los mismos idiomas y los mismos términos de producto que esa aplicación. Un repositorio de solo biblioteca o solo documentación sin cadenas de interfaz de usuario es el otro caso, cubierto a continuación.

La herramienta deja `README.md` en su lugar y escribe un archivo de configuración regional por idioma, por ejemplo, `translated-docs/README.de.md`. Una fila de idiomas dentro del README enlaza esos archivos.

<a id="which-setup-are-you-in"></a>
## ¿En qué configuración se encuentra?

| Tiene | Generador | Entonces |
| --- | --- | --- |
| Una aplicación JS/TS más un README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, el predeterminado) | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) para `t()`, y esta página para el README |
| Una aplicación Python más un README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) para la aplicación, y esta página para el README |
| Cualquier otra plantilla, más un README | añada `--with-readme` a ese comando `init` | Esta página para el bloque README |
| Solo README y Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | Esta página |

`--with-readme` es una operación nula en `ui-markdown` y `docs-markdown`, porque esas plantillas ya incluyen el bloque README.

<a id="what-you-get"></a>
## Lo que obtiene

- `README.md` permanece como el archivo fuente. Los hosts siguen renderizándolo como la página principal del repositorio.
- Cada configuración regional de destino es un archivo hermano, como `translated-docs/README.de.md`.
- La fila de idiomas en el archivo fuente y en cada traducción enumera todas las configuraciones regionales, con enlaces que funcionan desde el archivo que el lector está viendo.

Añada `CONTRIBUTING.md`, `CHANGELOG.md` o una carpeta `docs/` al mismo bloque cuando esos archivos también deban traducirse. Consulte [Más que el README](#more-than-the-readme).

<a id="install"></a>
## Instalar

Instala la CLI ([Instalación](/es/guide/installation)) y establece la clave API para tu proveedor ([Proveedor y clave API](/es/guide/quick-start#provider-and-api-key)). Ollama no necesita clave.

Un repositorio con un `package.json` instala el paquete como una dependencia de desarrollo. Un repositorio sin un proyecto Node.js puede ejecutar `npx ai-i18n-tools`, o usar el [ejecutable independiente](/es/guide/installation#standalone-executables).

<a id="scaffold"></a>
## Generador

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

`init` solo escribe `ai-i18n-tools.config.json`. No edita `README.md`. Cuando la configuración incluye un bloque README, imprime la línea de marcador para pegar y advierte si falta `README.md`. Una configuración existente se deja intacta: añada el bloque manualmente, como en [Añadir el bloque a una configuración que ya tiene](#add-the-block-to-a-config-you-already-have).

<a id="configure"></a>
## Configurar

Cuatro claves son importantes:

- `sourceLocale`: el idioma en el que está escrito el README. Cualquier idioma es válido. El inglés es un ejemplo común en esta guía.
- `targetLocales`: los idiomas que se deben agregar.
- `features.translateDocs`: debe ser verdadero. Una configuración híbrida también establece `features.translateUIStrings`.
- `docs[].contentPaths`: los archivos y carpetas Markdown que se deben traducir. La plantilla enumera `README.md`.

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

<a id="language-list"></a>
## Añadir la lista de idiomas

Ponga esta línea en `README.md`, donde los lectores deberían ver los otros idiomas. Una etiqueta corta en la línea superior es prosa normal y se traducirá.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

La línea puede estar vacía. `translate-docs` reemplaza todo, desde el marcador de apertura hasta el marcador de cierre, con un enlace por cada configuración regional. Los marcadores dentro de los bloques de código cercados se ignoran, por lo que una muestra de configuración en el mismo archivo no coincide. Detalles: [Selector de idioma](/es/guide/documents/language-switcher).

<a id="translate"></a>
## Traducir

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` ejecuta los pasos habilitados en orden: `extract` y `translate-ui` cuando las cadenas de interfaz de usuario están activadas, y luego `translate-docs`. Se comparte una caché, por lo que una frase ya traducida para la aplicación se reutiliza cuando aparece en el README. Los catálogos de interfaz de usuario también se pasan a la traducción de documentos como sugerencias de glosario (`ui[].uiGlossary`, activado por defecto), lo que mantiene la coherencia de los nombres de botones y características. Consulte [Glosario](/es/guide/glossary).

Los nombres de los idiomas en la fila provienen de `ui-languages.json`, que `extract` escribe junto al catálogo de la interfaz de usuario. Una configuración solo de README no tiene catálogo de interfaz de usuario, por lo que la fila utiliza la lista de idiomas incluida en su lugar. Las etiquetas siguen siendo los nombres nativos. Ejecute `generate-ui-languages` solo cuando desee un manifiesto de proyecto propio.

Confirme `translated-docs/` y abra el README traducido en el host. Los enlaces relativos entre el README de origen y `translated-docs/README.de.md` se reescriben para cada archivo.

<a id="hybrid-tips"></a>
## Consejos híbridos

- Traduzca el README a menos idiomas que la aplicación con `docs[].targetLocales`. Consulte [Menos configuraciones regionales para documentos](/es/guide/combining-pipelines#fewer-locales-for-documents).
- Ponga los términos del producto en `glossary.userGlossary`. El mismo CSV se utiliza para las cadenas de interfaz de usuario y para el README.
- Ejecute solo un lado con `ai-i18n-tools sync --no-docs` o `ai-i18n-tools sync --no-ui`.

<a id="more-than-the-readme"></a>
## Más allá del README

Añada rutas a `contentPaths`. `flatPreserveRelativeDir` mantiene las carpetas, por lo que `docs/guide.md` se convierte en `translated-docs/docs/guide.de.md` en lugar de colisionar con otro `guide.md`.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

Un archivo `.translate-ignore` omite las rutas que no desea traducir. `init --with-translate-ignore` escribe un iniciador. Los bloques de código cercados, las URL y los anclajes de encabezado no se traducen. Consulte [Diseños de salida](/es/guide/documents/output-layouts), [Enlaces de anclaje](/es/guide/documents/anchor-links) y [Reescritura de enlaces](/es/guide/documents/link-rewriting).

Capturas de pantalla que difieren por idioma: [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/).

<a id="links-on-the-host"></a>
## Enlaces en el host

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

<a id="keep-it-translated"></a>
## Mantenerlo traducido

Vuelve a ejecutar `sync` después de que cambie el README de origen o las cadenas de la aplicación. La caché envía solo texto nuevo o modificado al modelo. Confirma los archivos actualizados en `translated-docs/`.

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

<a id="quality"></a>
## Indica que la traducción es automática

Las traducciones de IA pueden ser incorrectas. Una nota breve al final del README, como la que se encuentra en el [README de este repositorio](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md), informa a los lectores que los otros idiomas fueron traducidos automáticamente y deben verificarse antes de confiar en ellos.

<a id="not-your-case"></a>
## ¿No es su caso?

| Tienes | Lee |
| --- | --- |
| Cadenas de interfaz de usuario de la aplicación y ningún README para traducir | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) o [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) |
| Un sitio de VitePress, Docusaurus, Starlight, Nextra, Fumadocs o Astro | [Añadir i18n a un sitio web o de documentación](/es/guide/add-i18n-to-website). Añade `--with-readme` cuando el README del repositorio también deba traducirse |
| Un archivo HTML por configuración regional | [Páginas HTML](/es/guide/documents/html-pages) |
| La referencia completa de `translate-docs` | [Documentos](/es/guide/documents/) |

<a id="examples"></a>
## Ejemplos

| Proyecto | Lo que muestra |
| --- | --- |
| [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) | Una pequeña aplicación Node más un bloque README plano |
| [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) | Cadenas de interfaz de usuario, un sitio de documentación y un bloque README plano separado |
| Este repositorio | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): bloque README plano, luego el sitio de VitePress |

<a id="agent-prompt"></a>
## Solicitud del agente

Copia esto en Cursor u otro agente de codificación. Prepara el repositorio. No traduce el README.

````markdown
# Prepare README and Markdown translation

## Context

ai-i18n-tools translates Markdown listed in `docs[]` and writes one file per locale. The source README stays in place. Flat output for a README looks like `translated-docs/README.de.md`. Guide: https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme

## Scope

Edit `ai-i18n-tools.config.json` and the source Markdown files that should grow a language list. Do not edit anything under `translated-docs/` or other generated locale trees.

## Config

- If there is no config, run `ai-i18n-tools init -P <provider>` for a JS/TS app (this template already includes the README block), `ai-i18n-tools init -t docs-markdown -P <provider>` for Markdown only, or `ai-i18n-tools init -t <template> -P <provider> --with-readme` for any other template.
- If a config exists, set `features.translateDocs` to true and append one `docs` entry: `contentPaths` includes `README.md`, `outputDir` is `translated-docs`, `addFrontmatter` is false, `docsOutput.style` is `flat`, `flatPreserveRelativeDir` is true, and `postProcessing.languageListBlock` uses start `<small id="lang-list">`, end `</small>`, separator ` · `.
- Do not add a second block when one already lists `README.md`.
- Add other source files the user named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## README

Add this line where the language row should appear, if it is not already there:

```markdown
<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.

## Do not

- Do not translate, rewrite, or shorten the source README.
- Do not hand-edit `translated-docs/` or locale JSON.
- Do not run a translation yourself.

## Verify

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.

## Report back

List files changed and any Markdown file you left out of `contentPaths`, with a one-line reason.
````
