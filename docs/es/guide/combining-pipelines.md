<a id="combining-pipelines"></a>
# Combinar canalizaciones

Lea esto cuando un proyecto necesite más de un tipo de traducción: cadenas de la IU de la aplicación más documentación, un sitio de documentación más un archivo README raíz, o documentos más ilustraciones SVG. Si solo traduce un tipo de contenido, [Inicio rápido](/es/guide/quick-start) es suficiente.

Una aplicación más su archivo README del repositorio es el híbrido común. Genérelo con `init` (la plantilla `ui-markdown`) o `init -t <template> --with-readme`, luego siga [Añada i18n a su README y documentos Markdown](/es/guide/add-i18n-to-readme). La configuración mixta más adelante en esta página es la misma idea junto a un sitio de documentación.

Este repositorio es ese tipo de proyecto. [`ai-i18n-tools.config.json`](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) traduce las cadenas de la IU de la CLI y del Panel de traducción y este sitio VitePress en una sola `sync`. El bloque de la IU cubre `src/cli`, `src/server`, `src/dashboard-app` y `src/api`, y escribe JSON plano en `src/i18n/locales`. El bloque VitePress utiliza `docsOutput.style: "vitepress"` para `docs/` y el catálogo de temas. El mismo archivo también escribe traducciones de `README.md` en `translated-docs/`. Configuración del sitio: [VitePress](/es/guide/integrations/vitepress).

<a id="what-sync-runs"></a>
## Qué ejecuta la sincronización

`ai-i18n-tools sync` ejecuta los pasos habilitados en este orden:

1. `extract`, luego `translate-ui`, cuando `features.translateUIStrings` está habilitado.
2. `translate-svg`, cuando `features.translateSVG` está habilitado y existe un bloque `svg`.
3. `translate-docs`, cuando `features.translateDocs` está habilitado o se establece cualquier `docs[].docusaurusCatalogDir`.
4. `translate-json`, cuando `features.translateJson` está habilitado y `json[]` tiene entradas.

Omita las partes con `--no-ui`, `--no-svg`, `--no-docs` o `--no-json`. Los pasos de documentación y `json[]` aceptan `--dry-run`, `-p` / `--path`, `--force`, `--force-update` y `--check-cache`. Los indicadores solo para documentos se ignoran cuando se establece `--no-docs`. JSON utiliza los mismos indicadores de caché cuando no se establece `--no-json`.

Prefiera `sync` en lugar de encadenar los comandos individuales manualmente. El orden, la extracción y los indicadores de configuración regional son fáciles de equivocar cuando se ejecutan manualmente.

<a id="combined-sync"></a>

<a id="ui-strings-and-documents-together"></a>
## Cadenas de la IU y documentos juntos

Habilite ambas características en una configuración para ejecutar cadenas de la IU y documentos en una sola pasada:

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

<a id="fewer-locales-for-documents"></a>
## Menos configuraciones regionales para documentos

Utilice `docs[].targetLocales` en un bloque para traducir los archivos de ese bloque a un subconjunto más pequeño que la IU. Las configuraciones regionales de documentación efectivas son la unión de todos los bloques:

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

<a id="mixed-documentation-config"></a>
## Configuración de documentación mixta

Puede combinar varias canalizaciones de documentación en la misma configuración añadiendo más de una entrada en `docs`. Esta es una configuración común cuando un proyecto tiene un sitio Docusaurus (`docsOutput.style = "docusaurus"`) más archivos Markdown de nivel raíz, como un archivo README del repositorio con `docsOutput.style = "flat"`, que deben traducirse con nombres de archivo con sufijo de configuración regional.

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

- Las cadenas de la IU se extraen y traducen de `src/` a `public/locales/`.
- El primer bloque de documentos traduce Markdown de `docs-site/docs/` a `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (páginas de documentación localizadas).
- Con `docs[].docusaurusCatalogDir` establecido y `features.translateDocs` habilitado, ese mismo bloque también traduce el JSON de la estructura de Docusaurus en `docs-site/i18n/en/` a cada carpeta de configuración regional de destino: barra de navegación, pie de página y catálogos de temas/complementos, no el contenido principal MDX.
- El segundo bloque de documentos traduce `README.md` a archivos con sufijo de configuración regional en `translated-docs/` (`docsOutput.style = "flat"`).
- Todos los bloques de documentación comparten `cacheDir`, por lo que los segmentos sin cambios se reutilizan entre ejecuciones para reducir llamadas a la API y costos.

Siguiente: volver a [Inicio rápido](/es/guide/quick-start), o consulte [Configuración](/es/reference/configuration) para ver el esquema completo.
