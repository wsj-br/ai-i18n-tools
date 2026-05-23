<a id="locale-assets-guide"></a>
# Guía de recursos específicos de configuración regional

Esta guía explica cómo manejar recursos específicos de configuración regional —capturas de pantalla (PNG, JPEG, WebP) y archivos SVG ilustrados— en proyectos que utilizan `ai-i18n-tools`. Describe cada patrón disponible, cuándo usarlo y cómo configurar un proyecto desde cero para que la incorporación de más configuraciones regionales posteriormente no requiera cambios estructurales.

Para la referencia de configuración de SVG, consulte la sección [`svg`](#svg) en [GETTING_STARTED.md](GETTING_STARTED.es.md). Para la opción `postProcessing.regexAdjustments`, consulte la [referencia de configuración](GETTING_STARTED.es.md#configuration-reference).

| Ruta de configuración | Valor | Caso de uso | Notas |
|-------------|-------|----------|-------|
| `documentations[].markdownOutput.style` | `"flat"` | Archivos README / USER-GUIDE con sufijo de configuración regional | Habilita el reescritor de enlaces planos; combinar con `flatPreserveRelativeDir` cuando las fuentes estén en subdirectorios |
| `documentations[].markdownOutput.style` | `"nested"` (predeterminado) | Subcarpetas simples por configuración regional bajo `outputDir` | Sin reescritor de enlaces planos |
| `documentations[].markdownOutput.style` | `"doc-system"` | Árboles de documentos con prefijo de configuración regional (generadores personalizados) | Establecer `docsRoot` y `localeSubpath`; el reescritor de enlaces planos no se ejecuta |
| `documentations[].markdownOutput.style` | `"docusaurus"` / `"astro-starlight"` | Diseños preestablecidos `doc-system` | Alias con valores predeterminados específicos del generador para `localeSubpath` |
| `svg.style` | `"flat"` | Aplicaciones web (`name.<locale>.svg` en `public/assets/`) | Separado de `style` en markdown; usado por `translate-svg` |
| `svg.style` | `"nested"` | Salida de SVG colocada en el sistema de documentación | A menudo combinado con `pathTemplate` (Patrón E) |

Esta guía utiliza las cadenas JSON exactas de la configuración —no solo palabras en inglés— para que las versiones traducidas permanezcan inequívocas.

<small>**Leer en otros idiomas:** </small>
<small id="lang-list">[English (GB)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [हिन्दी](./LOCALE-ASSETS-GUIDE.hi.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [中文 (中国大陆)](./LOCALE-ASSETS-GUIDE.zh-CN.md) · [中文 (台灣)](./LOCALE-ASSETS-GUIDE.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Qué hace (y qué no hace) ai-i18n-tools con los recursos](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [Diseño para i18n desde el principio](#design-for-i18n-from-the-start)
  - [Markdown con `markdownOutput.style = "flat"` (README, USER-GUIDE)](#markdown-with-markdownoutputstyle--flat-readme-user-guide)
  - [Sitios del sistema de documentación (`markdownOutput.style = "doc-system"`)](#doc-system-sites-markdownoutputstyle--doc-system)
    - [Preset Docusaurus](#docusaurus-preset)
    - [Preset Astro/Starlight](#astrostarlight-preset)
  - [Aplicaciones web (Next.js, Vite, etc.) con recursos SVG](#web-apps-nextjs-vite-etc-with-svg-assets)
- [Guía de decisión](#decision-guide)
- [Patrón A - Raster compartido](#pattern-a--shared-raster)
  - [Ejemplo de implementación](#implementation-example)
- [Patrón B - Carpeta por configuración regional (reescritura de URL)](#pattern-b--per-locale-folder-url-rewriting)
  - [Estructura de directorios](#directory-layout)
  - [Contrato del script de captura de pantalla](#screenshot-script-contract)
  - [Configuración - `markdownOutput.style = "flat"`](#config--markdownoutputstyle--flat)
  - [Configuración - `markdownOutput.style = "doc-system"`](#config--markdownoutputstyle--doc-system)
  - [Preset - `markdownOutput.style = "docusaurus"`](#preset--markdownoutputstyle--docusaurus)
  - [Preset - `markdownOutput.style = "astro-starlight"`](#preset--markdownoutputstyle--astro-starlight)
- [Patrón C - Raster colocado (`doc-system`)](#pattern-c--colocated-raster-doc-system)
  - [Estructura de directorios](#directory-layout-1)
  - [Contrato del script de captura de pantalla](#screenshot-script-contract-1)
  - [Configuración](#config)
  - [Requisitos previos](#prerequisites)
  - [Ejemplo de implementación](#implementation-example-1)
- [Patrón D - SVG traducido con `svg.style = "flat"`](#pattern-d--translated-svg-with-svgstyle--flat)
  - [Configuración](#config-1)
  - [Referencia de aplicación](#app-reference)
  - [Recomendación de estructura de fuentes](#source-layout-recommendation)
  - [Ejemplo de implementación](#implementation-example-2)
- [Patrón E - SVG traducido colocado (sistema de documentación)](#pattern-e--colocated-translated-svg-doc-system)
  - [Configuración](#config-2)
  - [Markdown fuente](#source-markdown)
  - [Ubicación del archivo SVG fuente](#svg-source-location)
  - [Marcadores de posición `pathTemplate`](#pathtemplate-placeholders)
  - [Ejemplo de implementación](#implementation-example-3)
- [El reescritor de enlaces planos y el flujo en dos pasos](#the-flat-link-rewriter-and-two-step-flow)
  - [Flujo en dos pasos cuando `markdownOutput.style = "flat"`](#two-step-flow-when-markdownoutputstyle--flat)
  - [Prefijo de profundidad por archivo con `flatPreserveRelativeDir`](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` y `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [Errores comunes y solución de problemas](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## Qué hace (y qué no hace) ai-i18n-tools con los recursos

`translate-docs` traduce contenido markdown/MDX —incluido el texto alternativo de las imágenes—, pero no copia, genera ni emite archivos raster. Si una página traducida necesita una captura de pantalla específica por configuración regional, debes colocar ese archivo en la ruta a la que hará referencia el markdown traducido.

`translate-svg` es el único comando que emite archivos binarios específicos por configuración regional. Lee archivos SVG de origen, traduce los elementos de texto (`<text>`, `<title>`, `<desc>`) y escribe un archivo SVG de salida por cada configuración regional. Los archivos raster (PNG, JPEG, WebP, GIF) nunca son escritos por la herramienta.

---

<a id="design-for-i18n-from-the-start"></a>
## Diseña para la i18n desde el principio

Elegir la estructura de directorios adecuada antes de que existan capturas de pantalla es el factor más importante para facilitar más adelante el manejo de recursos específicos por configuración regional. Adaptar la estructura después de haber incluido docenas de capturas implica reorganizar rutas y actualizar todas las referencias en el markdown.

<a id="markdown-with-markdownoutputstyle--flat-readme-user-guide"></a>
### Markdown con `markdownOutput.style = "flat"` (README, USER-GUIDE)

Almacena las capturas de pantalla en un subdirectorio codificado por configuración regional desde el primer día:

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

Cuando agregues i18n más adelante, tu script `take-screenshots` escribirá en `images/screenshots/<locale>/` para cada configuración regional, y una sola regla `regexAdjustments` manejará todas ellas:

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

El patrón genérico `[^/]+` coincide con cualquier nombre de carpeta de configuración regional —no codifiques de forma rígida tu configuración regional de origen (por ejemplo, `screenshots/en-GB/`), porque eso fallará si `sourceLocale` cambia en algún momento.

Si comienzas con rutas que omiten el subdirectorio de configuración regional (`images/screenshots/translate.png`), tendrás que reestructurar todo el árbol antes de que el Patrón B pueda funcionar.

<a id="doc-system-sites-markdownoutputstyle--doc-system"></a>
### Sitios de documentación (`markdownOutput.style = "doc-system"`)

Utilízalo para sitios de documentación estática que almacenan páginas traducidas bajo un árbol con prefijo de configuración regional —como Docusaurus i18n, Astro Starlight, y generadores personalizados que siguen esta misma estructura. Los archivos bajo `docsRoot` se escriben en:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Establece `documentations[].markdownOutput.docsRoot` como la raíz de tu contenido fuente en inglés (por ejemplo, `"docs"` o `"src/content/docs"`). Cuando configures `style: "doc-system"` directamente, también debes establecer `localeSubpath` al segmento de ruta que tu sitio utiliza entre `{locale}/` y el archivo traducido. Los alias `"docusaurus"` y `"astro-starlight"` son diseños predefinidos `doc-system` con valores predeterminados para `localeSubpath` (ver [Diseños de salida](GETTING_STARTED.es.md#output-layouts)).

| Alias predefinido | `localeSubpath` predeterminado | Ejemplo de salida |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (vacío) | `src/content/docs/de/guide.md` |

El reescritor de enlaces plano **no** se ejecuta para `doc-system` (a diferencia de `"flat"`). `postProcessing.regexAdjustments` recibe la URL original del markdown fuente —típicamente una ruta absoluta o relativa a la raíz del sitio, como `/img/screenshots/en-GB/foo.png`.

**Patrón B** se aplica cuando las capturas de pantalla están en un árbol compartido de URL estáticas: utiliza una carpeta codificada por configuración regional desde el primer día y una regla genérica `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` (ver [Configuración — doc-system](#config--markdownoutputstyle--doc-system)).

**Patrón C** se aplica cuando los recursos de la documentación traducida por configuración regional están junto al markdown (sin reescritura de URL). Tu script de capturas debe escribir los PNG en rutas derivadas de `{outputDir}`, `{locale}` y `{localeSubpath}` —el ejemplo de Docusaurus a continuación es la estructura de referencia.

<a id="docusaurus-preset"></a>
#### Configuración predefinida para Docusaurus

Dos hábitos durante la configuración del proyecto eliminan por completo la necesidad de usar expresiones regulares más adelante:

1. Cree un enlace simbólico `documentation/docs/assets → ../static/assets` antes de añadir cualquier captura de pantalla. Webpack de Docusaurus sigue enlaces simbólicos por defecto, lo que permite que los documentos fuente usen rutas relativas que también usarán los documentos traducidos.

2. Coloque todos los recursos de documentación — PNGs y SVGs — en `static/assets/` (un solo directorio). No los separe entre `static/img/` (SVGs) y `static/assets/` (PNGs). Una ubicación unificada significa que cada página de documentación, tanto en inglés como traducida, puede hacer referencia a la misma ruta relativa `../assets/name.ext`.

Haga referencia a cada recurso usando la ruta relativa estable `../assets/name.ext` en el markdown fuente. Nunca use URLs absolutas `/img/` o `/assets/` para recursos de documentación — estas URLs son distintas entre el contenido fuente en inglés (servido desde `static/`) y los idiomas traducidos (colocados junto con los documentos traducidos), lo que obliga a usar una regla `regexAdjustments` para unirlas.

Cuando añada i18n más adelante, el script de capturas adoptará la división `getScreenshotDir` (véase [Patrón C](#pattern-c--docusaurus-colocated)) y `translate-svg` usará un `pathTemplate`. No será necesario ajustar expresiones regulares.

> **Nota:** `resolve.symlinks = false` en un `next.config.ts` desactiva la resolución de enlaces simbólicos solo para la compilación de webpack de la aplicación Next.js. No afecta a la compilación del sitio de documentación de Docusaurus, que utiliza una instancia separada de webpack.

<a id="astrostarlight-preset"></a>
#### Preset Astro/Starlight

Equivalente a `markdownOutput.style = "doc-system"` con `localeSubpath: ""` — las páginas traducidas se colocan directamente bajo `{outputDir}/{locale}/`.

Almacene las capturas de pantalla bajo una ruta codificada por idioma desde el primer día:

```
public/img/screenshots/en-GB/screenshot.png
```

Use la expresión regular genérica en `regexAdjustments`:

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### Aplicaciones web (Next.js, Vite, etc.) con recursos SVG

Mantenga los archivos fuente SVG en un directorio fuente dedicado (por ejemplo, `images/` o `src/assets/`) y configure `svg.outputDir` en un directorio de servicio separado (por ejemplo, `public/assets/`). Nunca mezcle archivos SVG fuente y archivos de salida `translate-svg` en la misma carpeta — se vuelve imposible distinguir qué archivos son generados.

Diseñe los SVG para que sean traducibles desde el principio: use elementos `<text>`, `<title>` y `<desc>` para todas las etiquetas legibles por humanos. Evite incrustar texto como datos de trazado.

Habilite `forceLowercase: true` en el bloque de configuración `svg` para evitar discrepancias por sensibilidad a mayúsculas/minúsculas entre sistemas de archivos y CDNs.

---

<a id="decision-guide"></a>
## Guía de decisiones

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| Patrón | Tipo de recurso             | Tipo de sitio                                                             | Mecanismo de herramienta                                     |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A       | Raster (compartido)         | `markdownOutput.style = "flat"` docs                                      | Reescritor de enlaces por archivo; normalmente sin expresiones regulares |
| B       | Raster (por idioma)         | `"flat"` o `"doc-system"` (incl. `"docusaurus"`, `"astro-starlight"`)    | Intercambio de segmento de idioma `regexAdjustments`         |
| C       | Raster (colocados)          | `"doc-system"` con recursos colocados (preset de Docusaurus)                  | El script de capturas coloca los archivos; sin expresiones regulares |
| D       | SVG (traducidos)            | Aplicación web                                                            | `translate-svg` con `svg.style = "flat"`                    |
| E       | SVG (traducidos, colocados) | `"doc-system"` con recursos colocados (preset de Docusaurus)                  | `translate-svg` con `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a--shared-raster"></a>
## Patrón A - Raster compartido

Utilice cuando una única imagen se comparta en todos los idiomas (sin variantes por idioma). Cuando `markdownOutput.style = "flat"`, el reescritor de enlaces planos calcula el prefijo de profundidad por archivo de salida, por lo que un recurso junto al archivo fuente (por ejemplo, `docs/figure.png` referenciado como `figure.png` desde `docs/page.md`) se resuelve correctamente en cada salida traducida; no se necesita ninguna regla `postProcessing.regexAdjustments`.

Ejemplo: este paquete traduce `docs/GETTING_STARTED.md` a `translated-docs/docs/GETTING_STARTED.<locale>.md`. La imagen hermana `docs/translation-cache-editor.png` se referencia como `translation-cache-editor.png`. El reescritor calcula el prefijo por archivo desde el directorio del archivo de salida hacia el directorio fuente (`../../docs/`), produciendo `../../docs/translation-cache-editor.png`. Desde `translated-docs/docs/`, esto se resuelve correctamente a `docs/translation-cache-editor.png`.

No se necesita un script de captura de pantalla; el archivo se coloca una vez y nunca cambia por idioma.

Todavía se necesita una regla `postProcessing` cuando:
- El recurso se referencia mediante una URL absoluta (por ejemplo, `/img/figure.png`); el reescritor solo maneja rutas relativas
- Desea cambiar la URL del recurso por otros motivos (por ejemplo, cambiar a un CDN)

<a id="implementation-example"></a>
### Ejemplo de implementación

Este repositorio utiliza el Patrón A para la captura de pantalla del Panel de Traducción: [GETTING_STARTED.md](GETTING_STARTED.es.md#translation-dashboard) hace referencia a la imagen [translation-cache-editor.png](../../docs/../docs/translation-cache-editor.png) en la misma carpeta. [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) establece `markdownOutput.style = "flat"` y `flatPreserveRelativeDir: true`; el prefijo de profundidad por archivo resuelve la ruta de la imagen sin necesidad de un `regexAdjustments` de captura de pantalla.

---

<a id="pattern-b--per-locale-folder-url-rewriting"></a>
## Patrón B - Carpeta por idioma (reescritura de URL)

Utilice para README/USER-GUIDE con `markdownOutput.style = "flat"`, y para sitios de sistemas de documentación (`markdownOutput.style = "doc-system"` o alias `"docusaurus"` / `"astro-starlight"`) que sirven capturas de pantalla desde un árbol compartido de URL estáticas.

<a id="directory-layout"></a>
### Estructura de directorios

<details>
<summary>Árbol de directorios de capturas de pantalla por configuración regional de ejemplo</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

El markdown fuente hace referencia al directorio del idioma fuente:

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Contrato del script de captura de pantalla

El script `take-screenshots` debe escribir archivos para todos los idiomas, no solo para el idioma fuente. El comando `translate-docs` reescribe las rutas pero no crea archivos. Un patrón común:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

Vea un ejemplo sencillo de `bash` en el [script de captura de pantalla en examples/nextjs-app](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh), o un ejemplo más complejo en [take-screenshots.js](https://github.com/wsj-br/transrewrt/blob/main/scripts/take-screenshots.js) del repositorio del proyecto [Transrewrt](https://github.com/wsj-br/transrewrt).

> **Nota:** Las cuatro subsecciones siguientes comparten el mismo intercambio de segmento de idioma `regexAdjustments` (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`). Solo difieren en la disposición de salida y en si el reescritor de enlaces planos se ejecuta primero; salte a la subsección que coincida con su `markdownOutput.style`.

<a id="config--markdownoutputstyle--flat"></a>
### Configuración - `markdownOutput.style = "flat"`

El reescritor de enlaces planos se ejecuta primero cuando `markdownOutput.style = "flat"` y antepone un prefijo de profundidad a las URL que no son de markdown. Para un `README.md` en la raíz del repositorio con `outputDir: "translated-docs/"`, añade `../`:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

Luego, la regla `regexAdjustments` reemplaza el segmento de idioma dentro de esa URL ya con prefijo:

<details>
<summary>Ejemplo de ajustes de expresiones regulares para diseño plano</summary>

```json
"markdownOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Resultado: `../images/screenshots/de/translate.png` — ruta relativa correcta desde `translated-docs/README.de.md` de vuelta a la raíz del repositorio.

El paso `postProcessing` se ejecuta después del reescritor de enlaces planos. Escriba patrones `search` que coincidan con el segmento de idioma en cualquier parte de la URL ya con prefijo; no es necesario incluir el prefijo `../` en el patrón.

Ejemplo de implementación (producción): [Transrewrt](https://github.com/wsj-br/transrewrt) — URLs de capturas de pantalla en [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`), reescritura de configuración regional en [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json), script de captura [take-screenshots.js](https://github.com/wsj-br/transrewrt/blob/main/scripts/take-screenshots.js) (ver el [contrato del script de captura](#screenshot-script-contract) anterior).

Ejemplo de implementación (configuración de demostración): [examples/nextjs-app](../../docs/../examples/nextjs-app/) — segundo bloque `documentations[]` en [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`); script auxiliar [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config--markdownoutputstyle--doc-system"></a>
### Configuración - `markdownOutput.style = "doc-system"`

Patrón genérico B para cualquier sitio de sistema de documentación que haga referencia a capturas de pantalla mediante un prefijo URL estático compartido. El reescritor de enlaces plano no se ejecuta; `postProcessing` reescribe el segmento de configuración regional en la URL original del markdown.

<details>
<summary>Ejemplo de ajustes de expresiones regulares para diseño de sistema de documentación</summary>

```json
"markdownOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Establezca `localeSubpath` para que coincida con el diseño de su generador entre `{locale}/` y el archivo traducido, o use un alias preestablecido (`"docusaurus"`, `"astro-starlight"`) en lugar de `"doc-system"` cuando los valores predeterminados sean adecuados. El markdown fuente normalmente incluye la configuración regional fuente en la URL:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

Incluya archivos PNG coincidentes en la misma ruta para cada configuración regional de destino (por ejemplo, `static/img/screenshots/de/screenshot.png`). Prefiera `screenshots/[^/]+/` frente a codificar `screenshots/en-GB/` para que la regla siga siendo válida tras un cambio en `sourceLocale`.

<a id="preset--markdownoutputstyle--docusaurus"></a>
### Preajuste - `markdownOutput.style = "docusaurus"`

Igual que `"doc-system"` con `localeSubpath = "docusaurus-plugin-content-docs/current"` predeterminado. El reescritor de enlaces plano no se ejecuta. `postProcessing` ve la URL original del markdown. Las páginas en inglés normalmente usan una ruta absoluta con la configuración regional fuente:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Ejemplo de ajustes de expresiones regulares para el preajuste de Docusaurus</summary>

```json
"markdownOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Incluya archivos PNG coincidentes en `docs-site/static/img/screenshots/<locale>/screenshot.png`. Para configuraciones independientes de la configuración regional fuente, prefiera `screenshots/[^/]+/` frente a `screenshots/en-GB/`.

Ejemplo de implementación: [examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) con el primer bloque `documentations[]` en [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json).

<a id="preset--markdownoutputstyle--astro-starlight"></a>
### Preajuste - `markdownOutput.style = "astro-starlight"`

Igual que `"doc-system"` con `localeSubpath: ""` — las páginas traducidas se ubican directamente bajo `{outputDir}/{locale}/`. Mismo principio del patrón B que la configuración genérica de sistema de documentación anterior. El markdown fuente usa `/img/screenshots/en-GB/screenshot.png`:

<details>
<summary>Ejemplo de ajustes de expresiones regulares para el preajuste de Astro Starlight</summary>

```json
"markdownOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Incluya los PNG en `public/img/screenshots/<locale>/screenshot.png`.

Ejemplo de implementación: [examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) y [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).

---

<a id="pattern-c--colocated-raster-doc-system"></a>
## Patrón C - Ráster colocado (`doc-system`)

Úselo cuando un sitio `doc-system` coloque activos específicos de configuración regional junto al markdown traducido — no se necesita reescritura de URL. El preajuste de Docusaurus (`markdownOutput.style = "docusaurus"`) es la implementación de referencia; otros generadores que usan `"doc-system"` con un `localeSubpath` personalizado siguen la misma idea: los activos en inglés se ubican en una ruta de configuración regional fuente, los activos traducidos se ubican bajo `{outputDir}/{locale}/[localeSubpath/]assets/`.

<a id="directory-layout-1"></a>
### Estructura de directorios

<details>
<summary>Ejemplo de árbol de directorios de recursos colocados (Docusaurus)</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

Todos los documentos en cada configuración regional usan la misma ruta relativa:

```markdown
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

Para la configuración regional en inglés (`en-GB`), `../assets/` se resuelve mediante el enlace simbólico a `static/assets/`. Para las configuraciones regionales traducidas, se resuelve directamente al directorio `current/assets/` propio de la configuración regional.

<a id="screenshot-script-contract-1"></a>
### Contrato del script de captura

El script debe escribir los PNG en el directorio correcto para cada configuración regional. La función `getScreenshotDir` codifica la división:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

Vea la implementación en producción en [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/main/scripts/take-screenshots.ts) del repositorio [duplistatus](https://github.com/wsj-br/duplistatus) (copia de referencia local: [references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts)).

<a id="config"></a>
### Configuración

No se necesita ninguna regla `regexAdjustments` para archivos raster. `translate-docs` traduce el texto alternativo en el markdown, pero la URL permanece sin cambios:

```json
{
  "markdownOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

Si el proyecto también utiliza SVG traducidos, el Patrón E los maneja y se colocan junto con los PNG en `current/assets/` sin necesidad de expresiones regulares adicionales.

<a id="prerequisites"></a>
### Requisitos previos

- El enlace simbólico `docs/assets` debe existir: `ln -s ../static/assets documentation/docs/assets`
- Webpack de Docusaurus sigue enlaces simbólicos por defecto (`resolve.symlinks` por defecto es `true` en las compilaciones de Docusaurus)
- El enlace simbólico solo necesita existir para la configuración regional de origen; las compilaciones traducidas no lo utilizan

<a id="implementation-example-1"></a>
### Ejemplo de implementación

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` en [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/main/scripts/take-screenshots.ts); la documentación en inglés hace referencia a PNG colocados localmente (por ejemplo, [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md) con `../assets/screen-dashboard-summary.png`); ningún `regexAdjustments` de PNG en [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json). Los SVG del Patrón E del mismo proyecto se colocan en los mismos directorios `current/assets/` (ver más abajo).

---

<a id="pattern-d--translated-svg-with-svgstyle--flat"></a>
## Patrón D - SVG traducido con `svg.style = "flat"`

Úselo cuando una aplicación web integre ilustraciones o diagramas SVG específicos de configuración regional y los referencie por código de configuración regional en tiempo de ejecución.

<a id="config-1"></a>
### Configuración

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` lee cada `.svg` dentro de `images/` y escribe un archivo por configuración regional:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### Referencia en la aplicación

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Recomendación de estructura de origen

Mantenga los SVG de origen separados del directorio de salida. Con `sourcePath: "images"` y `outputDir: "public/assets"`, ambos directorios son distintos. Nunca establezca ambos en el mismo directorio.

<a id="implementation-example-2"></a>
### Ejemplo de implementación

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — bloque `svg` en [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); SVG de origen [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg); salidas por configuración regional en [public/assets/](../../docs/../examples/nextjs-app/public/assets/) (por ejemplo, `translation_demo_svg.de.svg`); URL en tiempo de ejecución en [page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e--colocated-translated-svg-doc-system"></a>
## Patrón E - SVG traducidos colocados localmente (sistema de documentación)

Úselo en sitios de sistemas de documentación donde las ilustraciones SVG traducidas deban aparecer junto con la documentación traducida en el directorio de contenido de cada configuración regional — la misma ubicación que las capturas de pantalla raster del Patrón C. El preset de Docusaurus es el ejemplo principal.

<a id="config-2"></a>
### Configuración

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` escribe un SVG por configuración regional en el mismo directorio `current/assets/` que utiliza Pattern C para los PNG:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Markdown fuente

Todos los documentos en todos los idiomas utilizan la misma ruta relativa:

```markdown
![Diagram](../../docs/../assets/diagram.svg)
```

Para el idioma inglés, el enlace simbólico `docs/assets → ../static/assets` resuelve esto. Para los idiomas traducidos, se resuelve directamente a `current/assets/`.

No se necesita ninguna regla `regexAdjustments` porque los documentos fuente en inglés y los documentos traducidos de salida usan rutas idénticas.

<a id="svg-source-location"></a>
### Ubicación del origen SVG

Recomendado: almacenar los SVG fuente en `documentation/static/assets/` junto con los PNG en inglés (en-GB). Esto mantiene todos los recursos de documentación en un solo lugar, y el mismo enlace simbólico `docs/assets` cubre ambos. Las entradas `svg.sourcePath` apuntan entonces a `documentation/static/assets/name.svg`.

<a id="pathtemplate-placeholders"></a>
### Marcadores de posición `pathTemplate`

| Marcador de posición              | Valor                                                  |
|-----------------------------------|--------------------------------------------------------|
| `{outputDir}`            | Ruta absoluta resuelta de `svg.outputDir`              |
| `{locale}`               | Código de configuración regional de destino                                     |
| `{LOCALE}`               | Código de configuración regional en mayúsculas                                 |
| `{relPath}`              | Ruta relativa desde la raíz de `sourcePath` hasta el SVG fuente |
| `{stem}`                 | Nombre de archivo sin extensión                             |
| `{basename}`             | Nombre de archivo con extensión                                |
| `{extension}`            | Extensión incluyendo el punto                                |
| `{relativeToSourceRoot}` | Ruta relativa desde la raíz `sourcePath` más cercana       |

Referencia completa en la [tabla de configuración de SVG](GETTING_STARTED.es.md#svg).

<a id="implementation-example-3"></a>
### Ejemplo de implementación

[duplistatus](https://github.com/wsj-br/duplistatus) — bloque `svg` anidado con `pathTemplate` en [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json); los SVG fuente se enumeran bajo `documentation/static/img/` (por ejemplo, [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg` escribe archivos por configuración regional en `documentation/i18n/<locale>/…/current/assets/` junto a los PNG de Pattern C; los documentos los integran actualmente mediante `/img/duplistatus_*.svg` (por ejemplo, [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)). Consulte [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md) para obtener información sobre el cambio previsto a rutas `../assets/` y la eliminación del puente SVG `regexAdjustments`.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## El reescritor de enlaces planos y el flujo de dos pasos

Para `markdownOutput.style = "flat"` (y a menos que se establezca `rewriteRelativeLinks: false` o un `pathTemplate` personalizado), se ejecuta un reescritor integrado antes de `postProcessing`. Este gestiona enlaces entre documentos (añadiendo sufijos de configuración regional) y antepone un prefijo de profundidad a las URLs de recursos que no son markdown.

<a id="two-step-flow-when-markdownoutputstyle--flat"></a>
### Flujo de dos pasos cuando `markdownOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

Ejemplo con `outputDir: "translated-docs/"` y el origen `README.md` en la raíz del repositorio:

1. Reescritor de enlaces planos: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (un `../` para `translated-docs/`)
2. Expresión regular `postProcessing` `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

Para `markdownOutput.style = "doc-system"` (incluyendo `"docusaurus"`, `"astro-starlight"` y `"nested"`), el reescritor de enlaces planos no se ejecuta. `postProcessing` recibe la URL original del markdown traducido (típicamente una ruta absoluta como `/img/screenshots/en-GB/foo.png`).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Prefijo de profundidad por archivo con `flatPreserveRelativeDir`

El prefijo de profundidad se calcula por archivo de salida, no globalmente para todo el lote. Para cada archivo fuente, el reescritor calcula la ruta relativa desde el directorio del archivo de salida hacia el directorio del archivo fuente y utiliza esa como prefijo.

Esto significa que con `flatPreserveRelativeDir: true`, los archivos fuente en subdirectorios obtienen automáticamente el prefijo correcto. Por ejemplo, `docs/GETTING_STARTED.md` se genera en `translated-docs/docs/GETTING_STARTED.<locale>.md`. El prefijo por archivo es `../../docs/`, por lo que un recurso `translation-cache-editor.png` (relativo al origen) se convierte en `../../docs/translation-cache-editor.png` — lo cual se resuelve correctamente desde `translated-docs/docs/` hacia `docs/translation-cache-editor.png`.

No se necesita ninguna corrección mediante expresión regular `postProcessing` para recursos con rutas relativas junto a los archivos fuente.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` y `linkRewriteDocsRoot`

| Opción                                   | Efecto                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `markdownOutput.rewriteRelativeLinks`    | Habilita o deshabilita explícitamente el reescritor de enlaces planos (anula el valor predeterminado cuando `markdownOutput.style = "flat"`) |
| `markdownOutput.linkRewriteDocsRoot`     | Directorio raíz desde el cual se calcula `depthPrefix` (valor predeterminado `"."`)                                                        |
| `markdownOutput.flatPreserveRelativeDir` | Afecta al diseño de la ruta de salida, que el reescritor utiliza al calcular rutas de destino para archivos traducidos conocidos       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
<a id="common-mistakes"></a>
## Errores comunes y solución de problemas

**No hay directorio de configuración regional en las rutas de las capturas de pantalla**
`images/screenshots/screenshot.png` — no se pueden distinguir variantes regionales y no se pueden reescribir. Restructure a `images/screenshots/<locale>/screenshot.png` antes de aplicar el Patrón B.

**Configuración regional fuente codificada en la expresión regular**
`"search": "screenshots/en-GB/"` — falla silenciosamente si cambia `sourceLocale`. Use `"search": "screenshots/[^/]+/"` en su lugar.

**Archivos SVG fuente y de salida en el mismo directorio**
Si `svg.sourcePath` y `svg.outputDir` se solapan, los archivos generados se mezclan con los fuentes editados manualmente. Manténgalos en directorios separados.

**URLs estáticas absolutas de Docusaurus para SVGs colocados**
`/img/diagram.svg` (desde `static/img/`) requiere una regla `regexAdjustments` para reescribir a `../assets/` en la salida traducida. Coloque los SVGs fuente en `static/assets/` y use rutas relativas `../assets/diagram.svg` desde el principio para evitar esto por completo.

**Falta el enlace simbólico `docs/assets` en Docusaurus**
Sin el enlace simbólico, los documentos fuente en `docs/user-guide/` no pueden hacer referencia a PNGs o SVGs en `static/assets/` mediante una ruta relativa. Configure el enlace simbólico al crear el proyecto: `ln -s ../static/assets documentation/docs/assets`.

**`take-screenshots` el script solo captura la configuración regional de origen**
El patrón B requiere archivos PNG para cada configuración regional. Si el script solo captura `en-GB`, los documentos traducidos tendrán rutas reescritas que apuntan a archivos que faltan.
