<a id="quick-start"></a>
# Inicio rápido

La plantilla predeterminada `init` (`ui-markdown`) habilita únicamente la extracción y traducción de la **UI**. Las plantillas `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra` y `ui-fumadocs` habilitan la traducción de **documentos** (`translate-docs`); `ui-vitepress` también genera `docsOutput.vitepressThemeCatalog` para las cadenas del tema VitePress, `ui-nextra` genera `docs[].nextraDictionaryPath` para el diccionario del tema Nextra (la barra lateral `_meta.ts` se recopila automáticamente), y `ui-fumadocs` genera `docsOutput.fumadocsUiCatalog` para las anulaciones de la UI de Fumadocs (la barra lateral `meta.json` se recopila automáticamente). La plantilla `ui-astro-website` genera la extracción de la **UI** para aplicaciones Astro simples (incluidos los archivos `.astro`); añada un bloque `docs[]` (consulte [Páginas del sitio web de Astro (parse-and-replace)](/es/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)) cuando también desee `translate-docs` para el HTML de la página `.astro`. La referencia [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) utiliza **ambas** canalizaciones. Las plantillas de Python son `ui-python`, `ui-python-gettext`, `ui-python-flask` y `ui-python-django`; consulte [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python). Utilice `sync` cuando desee un comando que ejecute la extracción, la traducción de la UI, la traducción opcional de archivos SVG y la traducción de la documentación de acuerdo con su configuración.

Los proyectos de Python pueden utilizar el ejecutable independiente y omitir la instalación de Node.js. Pasos para la descarga: [Instalación — Ejecutables independientes](/es/guide/installation#standalone-executables).

<a id="runnable-examples"></a>
### Ejemplos ejecutables

Los proyectos ejecutables y los fixtures se encuentran en [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). Consulte el catálogo de [Ejemplos](/es/examples) para obtener la lista completa, los comandos de copia y qué carpetas utilizan `pnpm` frente a un entorno virtual de Python.

**Ejecute un ejemplo de Node.js de forma independiente** (sin clonar todo el monorepositorio):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

Reemplace `console-app` con cualquier otro nombre de carpeta de ejemplo de Node.js. Cada uno de esos ejemplos declara un rango de versiones (caret range) publicado de `ai-i18n-tools` que coincide con la versión actual del paquete e instala la CLI desde npm. Los ejemplos de Python no tienen `package.json`. Cópielos con el mismo comando `degit` o utilice `ai-i18n-tools-python-examples.zip` desde la versión de GitHub y, a continuación, siga [Ejemplos — Python](/es/examples#python-examples).

**Desde el repositorio completo de ai-i18n-tools** — si clonó todo el repositorio (no solo una carpeta de ejemplo con degit):

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

La entrada del espacio de trabajo [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) (`ai-i18n-tools: workspace:*`) vincula automáticamente los ejemplos del espacio de trabajo con su copia local. Los accesorios independientes (`multi-provider`, `test-markdown`) no son paquetes de espacio de trabajo; desde su carpeta, use `node ../../bin/ai-i18n-tools.mjs …`. Para ejecutar la CLI desde la **raíz del repositorio** (la propia documentación/i18n de este paquete), use `ai-i18n-tools` sin más después de `direnv allow`, o `pnpm i18n:sync` / `node bin/ai-i18n-tools.mjs …`; consulte [Instalación — Monorepo clonado](/es/guide/installation#cloned-monorepo) y la [Guía de desarrollo](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development).

<a id="provider-and-api-key-required-for-translation"></a>
### Proveedor y clave de API (necesario para la traducción)

Cada comando que llama a un LLM — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg` y `sync` — necesita **ambos**:

1. **Al menos un proveedor** en `ai-i18n-tools.config.json`: un bloque `providers.<name>` con `translationModels`, y una clave `provider` de nivel superior cuando se configura más de un proveedor. `init -P <provider>` genera ese preajuste; añade proveedores o ajusta las listas de modelos — consulta [Proveedores y modelos de LLM](/es/guide/providers-and-models).
2. **La clave de API correspondiente** en tu entorno o en un archivo `.env` en la raíz del proyecto. Cada preajuste integrado lee una variable de entorno con nombre de la [tabla de preajustes](/es/guide/providers-and-models#built-in-providers) (por ejemplo, `OPENROUTER_API_KEY` con `-P openrouter`, o `OPENAI_API_KEY` con `-P openai`); **Ollama** es la excepción — utiliza un punto de conexión local y no necesita clave. Consulta [Instalación — configura tu clave de API de proveedor](/es/guide/installation#using-the-cli).

`extract`, `status` y otros comandos que no llaman al LLM no necesitan un proveedor o clave de API.

<a id="core-cli-commands"></a>
### Comandos principales de la CLI

Ejecute desde la **raíz de su proyecto** después de instalar `ai-i18n-tools` y [configurar su shell para el comando básico](/es/guide/installation#using-the-cli). Los ejemplos a continuación usan `ai-i18n-tools` directamente.

```bash
# Set the API key for the provider you pass to init (see preset table; skip for local Ollama)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# export OPENAI_API_KEY=sk-your-key-here
# export CHEAPERINFERENCE_API_KEY=your-key-here

# UI strings (ui-markdown template enables extract + translate-ui)
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models          # optional: ranked shortlist
ai-i18n-tools suggest-models --apply  # replace translationModels
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight -P cheaperinference
# VitePress docs: ai-i18n-tools init -t ui-vitepress -P anthropic
# Nextra docs: ai-i18n-tools init -t ui-nextra -P gemini
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs -P groq
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website -P ollama
# Plain HTML catalog: ai-i18n-tools init -t ui-plain-html -P openrouter
# Plain HTML documents: ai-i18n-tools init -t docs-plain-html -P openai
# Python flat JSON: ai-i18n-tools init -t ui-python -P cheaperinference
# Python JSON + gettext: ai-i18n-tools init -t ui-python-gettext -P anthropic
# Django catalogs: ai-i18n-tools init -t ui-python-django -P gemini
# Flask / Jinja gettext: ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles -P ollama
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

La lista de modelos escrita por `init` es un punto de partida. `suggest-models` clasifica los modelos de chat del proveedor activo. `suggest-models --apply` reemplaza a `translationModels` y deja `uiModels` y `localeModels` sin cambios. La misma clasificación se encuentra en la pestaña [Modelos](/es/guide/translation-dashboard/models). Referencia de comandos: [suggest-models](/es/reference/cli-commands/models#suggest-models).

<a id="recommended-packagejson-scripts"></a>
### Scripts recomendados `package.json`

Con el paquete instalado localmente, los scripts de `package.json` resuelven `ai-i18n-tools` desde `node_modules/.bin` sin configuración adicional del shell. Para shells interactivos, configure PATH primero; consulte [Uso de la CLI](/es/guide/installation#using-the-cli).

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
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**Consejo:** Pasa `-L <code>` o establece `AI_I18N_LANG` si quieres la salida de la CLI y el panel de control en otro idioma. Consulta [Idioma de la interfaz de usuario de la herramienta](/es/guide/tool-ui-language).

<a id="combined-sync"></a>
## Sincronización combinada

Habilite todas las funciones en una sola configuración para ejecutar cadenas de interfaz de usuario y documentos juntos:

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

Los bloques de IU incluyen sus catálogos `strings.json` como sugerencias de glosario para la documentación de forma predeterminada (`uiGlossary`). `glossary.userGlossary` añade anulaciones CSV para los términos del producto. Consulte el [Glosario](/es/guide/glossary).

Ejecute `ai-i18n-tools sync` para ejecutar una canalización: cuando `features.translateUIStrings` esté habilitado, **extraiga** y luego **traduzca las cadenas de la interfaz de usuario**; **traduzca SVG** opcionalmente (bloque `features.translateSVG` + `svg`); **traduzca la documentación** (`docs[]` según la configuración); luego **traduzca JSON** opcionalmente (`features.translateJson` + `json[]`). Omita partes con `--no-ui`, `--no-svg`, `--no-docs` o `--no-json`. Los pasos de documentos y `json[]` aceptan `--dry-run`, `-p` / `--path`, `--force`, `--force-update` y `--check-cache` (las banderas solo para documentos se ignoran cuando `--no-docs`; JSON usa las mismas banderas de caché cuando `--no-json` no está configurado).

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

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>
### Configuración de documentación mixta (`docsOutput.style = "docusaurus"` + `"flat"`)

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

Cómo se ejecuta esto con `ai-i18n-tools sync`:

- Las cadenas de interfaz se extraen/traducen desde `src/` hacia `public/locales/`.
- El primer bloque de documentación traduce **markdown** desde `docs-site/docs/` hacia `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (páginas de documentación localizadas).
- Con `docs[].docusaurusCatalogDir` configurado y `features.translateDocs` habilitado, ese mismo bloque también traduce el **JSON de la estructura de Docusaurus** bajo `docs-site/i18n/en/` a cada carpeta de idioma de destino — barra de navegación, pie de página y catálogos de temas/plugins, pero no el contenido del cuerpo MDX.
- El segundo bloque de documentación traduce `README.md` a archivos con sufijo de idioma bajo `translated-docs/` (`docsOutput.style = "flat"`).
- Todos los bloques de documentación comparten `cacheDir`, por lo que los segmentos sin cambios se reutilizan entre ejecuciones para reducir llamadas a la API y costos.
