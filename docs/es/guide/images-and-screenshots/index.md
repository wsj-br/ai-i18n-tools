<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# Qué hace (y qué no hace) ai-i18n-tools con los activos

`translate-docs` traduce contenido markdown/MDX —incluido el texto alternativo de las imágenes—, pero no copia, genera ni emite archivos raster. Si una página traducida necesita una captura de pantalla específica por configuración regional, debes colocar ese archivo en la ruta a la que hará referencia el markdown traducido.

`translate-svg` es el único comando que emite archivos binarios específicos por configuración regional. Lee archivos SVG de origen, traduce los elementos de texto (`<text>`, `<title>`, `<desc>`) y escribe un archivo SVG de salida por cada configuración regional. Los archivos raster (PNG, JPEG, WebP, GIF) nunca son escritos por la herramienta.

---

<a id="design-for-i18n-from-the-start"></a>
# Diseñar para i18n desde el principio

Elegir la estructura de directorios adecuada antes de que existan capturas de pantalla es el factor más importante para facilitar más adelante el manejo de recursos específicos por configuración regional. Adaptar la estructura después de haber incluido docenas de capturas implica reorganizar rutas y actualizar todas las referencias en el markdown.

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### Markdown con `docsOutput.style = "flat"` (README, USER-GUIDE)

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

La expresión regular genérica `[^/]+` coincide con cualquier nombre de carpeta de configuración regional; no codifique su configuración regional de origen (por ejemplo, `screenshots/en-GB/`) porque eso se romperá si `sourceLocale` cambia alguna vez.

Si comienza con rutas que omiten el subdirectorio de configuración regional (`images/screenshots/translate.png`), deberá reestructurar todo el árbol antes de que la reescritura [por carpeta de configuración regional](/es/guide/images-and-screenshots/per-locale-folder) pueda funcionar.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### Sitios del sistema de documentación (`docsOutput.style = "doc-system"`)

Utilízalo para sitios de documentación estática que almacenan páginas traducidas bajo un árbol con prefijo de configuración regional —como Docusaurus i18n, Astro Starlight, y generadores personalizados que siguen esta misma estructura. Los archivos bajo `docsRoot` se escriben en:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Establezca `docs[].docsOutput.docsRoot` en su raíz de origen en inglés (por ejemplo, `"docs"` o `"src/content/docs"`). Cuando establezca `style: "doc-system"` directamente, también debe establecer `localeSubpath` en el segmento de ruta que su sitio utiliza entre `{locale}/` y el archivo traducido. Los alias `"docusaurus"`, `"astro-starlight"` y `"vitepress"` son diseños preestablecidos de `doc-system` con valores predeterminados de `localeSubpath` (consulte [Diseños de salida](/es/guide/documents/output-layouts)).

| Alias predefinido | `localeSubpath` predeterminado | Ejemplo de salida |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (vacío) | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""` (vacío) | `docs/de/guide/quick-start.md` |

El reescritor de enlaces plano **no** se ejecuta para `doc-system` (a diferencia de `"flat"`). `postProcessing.regexAdjustments` recibe la URL original del markdown fuente —típicamente una ruta absoluta o relativa a la raíz del sitio, como `/img/screenshots/en-GB/foo.png`.

El diseño de **carpeta por configuración regional** se aplica cuando las capturas de pantalla residen en un árbol de URL estático compartido: use una carpeta codificada por configuración regional desde el primer día y una regla genérica `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` (consulte [Configuración — sistema de documentos](#config---docsoutputstyle--doc-system)).

Las **capturas de pantalla intercaladas** se aplican cuando los documentos traducidos de cada configuración regional almacenan los activos junto al markdown (sin reescritura de URL). Su script de captura de pantalla debe escribir PNG en rutas derivadas de `{outputDir}`, `{locale}` y `{localeSubpath}`; el preajuste de Docusaurus a continuación es el diseño de referencia.

<a id="docusaurus-preset"></a>
#### Configuración predefinida para Docusaurus

Dos hábitos durante la configuración del proyecto eliminan por completo la necesidad de usar expresiones regulares más adelante:

1. Cree un enlace simbólico `documentation/docs/assets → ../static/assets` antes de añadir cualquier captura de pantalla. Webpack de Docusaurus sigue enlaces simbólicos por defecto, lo que permite que los documentos fuente usen rutas relativas que también usarán los documentos traducidos.

2. Coloque todos los recursos de documentación — PNGs y SVGs — en `static/assets/` (un solo directorio). No los separe entre `static/img/` (SVGs) y `static/assets/` (PNGs). Una ubicación unificada significa que cada página de documentación, tanto en inglés como traducida, puede hacer referencia a la misma ruta relativa `../assets/name.ext`.

Haga referencia a cada recurso usando la ruta relativa estable `../assets/name.ext` en el markdown fuente. Nunca use URLs absolutas `/img/` o `/assets/` para recursos de documentación — estas URLs son distintas entre el contenido fuente en inglés (servido desde `static/`) y los idiomas traducidos (colocados junto con los documentos traducidos), lo que obliga a usar una regla `regexAdjustments` para unirlas.

Cuando agregue i18n más tarde, el script de captura de pantalla adoptará la división `getScreenshotDir` (consulte [Capturas de pantalla intercaladas](/es/guide/images-and-screenshots/colocated-screenshots)) y `translate-svg` usará un `pathTemplate`. No se necesitan ajustes de expresiones regulares.

> **Nota:** `resolve.symlinks = false` en un `next.config.ts` desactiva la resolución de enlaces simbólicos solo para la compilación de webpack de la aplicación Next.js. No afecta a la compilación del sitio de documentación de Docusaurus, que utiliza una instancia separada de webpack.

<a id="astrostarlight-preset"></a>
#### Preset Astro/Starlight

Equivalente a `docsOutput.style = "doc-system"` con `localeSubpath: ""` — las páginas traducidas se ubican directamente bajo `{outputDir}/{locale}/`.

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
# Guía de decisiones

```
Is the asset an SVG with translatable text or labels?
  Yes → Web app SVG or Colocated SVG
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Colocated screenshots (rasters) + Colocated SVG (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Shared image
    Otherwise → Per-locale folder
```

Los diseños SVG se tratan en la guía [Traducción de SVG](/es/guide/svg-translation/).

| Diseño | Tipo de activo | Tipo de sitio | Mecanismo de herramienta |
|---|---|---|---|
| [Imagen compartida](/es/guide/images-and-screenshots/shared-image) | Ráster (compartido) | Documentos `docsOutput.style = "flat"` | Reescritor de enlaces por archivo; generalmente sin expresiones regulares |
| [Carpeta por configuración regional](/es/guide/images-and-screenshots/per-locale-folder) | Ráster (por configuración regional) | `"flat"` o `"doc-system"` (incl. `"docusaurus"`, `"astro-starlight"`) | Intercambio de segmento de configuración regional `regexAdjustments` |
| [Capturas de pantalla intercaladas](/es/guide/images-and-screenshots/colocated-screenshots) | Ráster (intercalado) | `"doc-system"` con activos intercalados (preajuste de Docusaurus) | El script de captura de pantalla coloca los archivos; sin expresiones regulares |
| [SVG de aplicación web](/es/guide/svg-translation/translated-svg-web-app) | SVG (traducido) | Aplicación web | `translate-svg` con `svg.style = "flat"` |
| [SVG intercalado](/es/guide/svg-translation/translated-svg-colocated) | SVG (traducido, intercalado) | `"doc-system"` con activos intercalados (preajuste de Docusaurus) | `translate-svg` con `svg.style = "nested"` + `pathTemplate` |
