<a id="quick-start"></a>
# Inicio rápido

La plantilla predeterminada `init` (`ui-markdown`) solo permite la extracción y traducción de la **interfaz de usuario**. Las plantillas `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra` y `ui-fumadocs` permiten la traducción de **documentos** (`translate-docs`); `ui-vitepress` también genera `docsOutput.vitepressThemeCatalog` para cadenas de temas de VitePress, `ui-nextra` genera `docs[].nextraDictionaryPath` para el diccionario de temas de Nextra (la `_meta.ts` de la barra lateral se recopila automáticamente), y `ui-fumadocs` genera `docsOutput.fumadocsUiCatalog` para las anulaciones de la interfaz de usuario de Fumadocs (la `meta.json` de la barra lateral se recopila automáticamente). La plantilla `ui-astro-website` genera la extracción de la **interfaz de usuario** para aplicaciones Astro simples (incluidos los archivos `.astro`); agregue un bloque `docs[]` (consulte [Páginas del sitio web de Astro (analizar y reemplazar)](/es/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)) cuando también desee `translate-docs` para el HTML de la página `.astro`. La [referencia `examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) utiliza **ambos** pipelines. Use `sync` cuando desee un comando que ejecute la extracción, la traducción de la interfaz de usuario, la traducción opcional de archivos SVG y la traducción de la documentación de acuerdo con su configuración.

<a id="runnable-examples"></a>
### Ejemplos ejecutables

Nueve proyectos y accesorios ejecutables se encuentran en [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). Consulte el catálogo de [Ejemplos](/es/examples) (aplicación de consola, Next.js + Docusaurus, sitio web de Astro, documentos de Astro Starlight, documentos de VitePress, documentos de Nextra, documentos de Fumadocs, comparación de múltiples proveedores, prueba de estrés de markdown).

**Ejecute un ejemplo de forma independiente** (sin clonar todo el monorepo):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

Reemplace `console-app` con cualquier nombre de carpeta de ejemplo. Cada ejemplo declara `"ai-i18n-tools": "^1.7.2"` e instala la CLI desde npm. Los READMEs por ejemplo incluyen el mismo fragmento con el nombre de la carpeta rellenado.

**Desde el repositorio completo de ai-i18n-tools** — si clonó todo el repositorio (no solo una carpeta de ejemplo con degit):

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

La entrada del espacio de trabajo [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) (`ai-i18n-tools: workspace:*`) vincula automáticamente los ejemplos del espacio de trabajo a su copia local. Los accesorios independientes (`multi-provider`, `test-markdown`) no son paquetes de espacio de trabajo; desde su carpeta, use `node ../../bin/ai-i18n-tools.mjs …`. Para ejecutar la CLI desde la **raíz del repositorio** (la documentación/i18n de este paquete), use `pnpm i18n:sync` o `node bin/ai-i18n-tools.mjs …` — consulte [Instalación — Monorepo clonado](/es/guide/installation#cloned-monorepo) y la [Guía de desarrollo](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development).

<a id="provider-and-api-key-required-for-translation"></a>
### Proveedor y clave de API (necesario para la traducción)

Cada comando que llama a un LLM — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg` y `sync` — necesita **ambos**:

1. **Al menos un proveedor** en `ai-i18n-tools.config.json`: un bloque `providers.<name>` con `translationModels`, y una clave `provider` de nivel superior cuando se configura más de un proveedor. `init` genera un bloque de proveedor predeterminado (`openrouter` a menos que pase `-P <provider>`); cambie los ajustes preestablecidos, agregue proveedores o ajuste las listas de modelos; consulte [Proveedores y modelos de LLM](/es/guide/providers-and-models).
2. **La clave API coincidente** en su entorno o en un archivo `.env` en la raíz del proyecto. Cada ajuste preestablecido integrado lee una variable de entorno con nombre de la [tabla de ajustes preestablecidos](/es/guide/providers-and-models#built-in-providers) (por ejemplo, `OPENROUTER_API_KEY` para el valor predeterminado, o `ANTHROPIC_API_KEY` cuando se genera con `-P anthropic`); **Ollama** es la excepción: utiliza un punto final local y no necesita clave. Consulte [Instalación: configure su clave API de proveedor](/es/guide/installation#using-the-cli).

`extract`, `status` y otros comandos que no llaman al LLM no necesitan un proveedor o clave de API.

<a id="core-cli-commands"></a>
### Comandos principales de la CLI

Ejecute desde la **raíz de su proyecto** después de instalar `ai-i18n-tools` y [configurar su shell para el comando básico](/es/guide/installation#using-the-cli). Los ejemplos a continuación usan `ai-i18n-tools` directamente.

```bash
# Set the API key for your active provider (see preset table; skip for local Ollama)
# Default init uses openrouter:
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Or scaffold another preset at init, e.g. anthropic:
# export ANTHROPIC_API_KEY=sk-ant-your-key-here

# UI strings (default template enables extract + translate-ui)
ai-i18n-tools init [-P <provider>]    # default: openrouter
ai-i18n-tools init -P anthropic
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight [-P <provider>]
# VitePress docs: ai-i18n-tools init -t ui-vitepress [-P <provider>]
# Nextra docs: ai-i18n-tools init -t ui-nextra [-P <provider>]
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs [-P <provider>]
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website [-P <provider>]
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles [-P <provider>]
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

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

Ejecute `ai-i18n-tools sync` para ejecutar una canalización: cuando `features.translateUIStrings` está habilitado, **extraiga** y luego **traduzca** las cadenas de la interfaz de usuario; **traduzca SVG** opcionalmente (bloque `features.translateSVG` + `svg`); **traduzca la documentación** (`docs[]` según lo configurado); luego **traduzca-json** opcionalmente (`features.translateJson` + `json[]`). Omita partes con `--no-ui`, `--no-svg`, `--no-docs` o `--no-json`. Los pasos de documentación y `json[]` aceptan `--dry-run`, `-p` / `--path`, `--force` y `--force-update` (las banderas solo para documentación se ignoran cuando `--no-docs`; JSON usa las mismas banderas de caché cuando `--no-json` no está configurado).

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
