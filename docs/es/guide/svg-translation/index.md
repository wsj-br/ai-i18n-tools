<a id="svg-translation"></a>
# Traducción de SVG

Diseñado para **ilustraciones y diagramas SVG** que contienen etiquetas legibles por humanos. El comando `translate-svg` lee archivos de origen `.svg`, extrae texto de los elementos `<text>`, `<title>` y `<desc>`, traduce esas cadenas a través del proveedor de LLM activo y escribe **una salida SVG por idioma objetivo**.

Esta es la única canalización que emite archivos SVG **binarios** específicos de la configuración regional. `translate-docs` traduce el texto alternativo de markdown y las referencias de enlaces, pero no modifica ni copia los activos SVG. Cuando una página necesita un diagrama con etiquetas traducidas, habilite `features.translateSVG` y configure el bloque `svg` de nivel superior.

<a id="per-locale-model-overrides"></a>
### Anulaciones de modelo por configuración regional

`translate-svg` resuelve los modelos **por configuración regional de destino**: primero `localeModels(locale)` cuando está configurado, luego `translationModels`. Cada ejecución SVG de una configuración regional utiliza su propia cadena de reserva, lo que es útil cuando las etiquetas de los diagramas en las configuraciones regionales CJK necesitan un modelo ajustado a un script (por ejemplo, `ja`). Consulte [Proveedores y modelos](/guide/providers-and-models#model-fallback-chain).

La traducción de SVG utiliza la misma caché de SQLite que `translate-docs` y `translate-json` (`cacheDir`). Los segmentos de texto ya traducidos se sirven desde la caché; solo el texto fuente nuevo o modificado se envía al LLM.

<a id="when-to-use-svg-translation"></a>
### Cuándo usar la traducción de SVG

Use `translate-svg` cuando:

- Un SVG contiene etiquetas, títulos o descripciones visibles que deben cambiar por configuración regional.
- Una aplicación web carga archivos de diagrama específicos de la configuración regional en tiempo de ejecución (por ejemplo, `dashboard.de.svg`).
- Un sitio de sistema de documentación (Docusaurus, Astro Starlight, VitePress) coloca SVGs traducidos junto a markdown traducido.

**No** use `translate-svg` para:

- SVGs decorativos sin texto traducible (iconos, logotipos, fondos).
- Capturas de pantalla rasterizadas (PNG, JPEG, WebP): se gestionan a través de [Imágenes y capturas de pantalla](/guide/images-and-screenshots/).
- Texto incrustado en datos de ruta en lugar de elementos `<text>`: el extractor no puede leer los contornos de la ruta.

<a id="design-for-i18n-from-the-start"></a>
### Diseño para i18n desde el principio

Los SVG son más fáciles de traducir cuando las etiquetas son elementos de texto reales desde el primer día:

- Ponga texto legible por humanos en `<text>`, `<title>` y `<desc>`.
- Evite convertir etiquetas en rutas en su herramienta de diseño: los datos de ruta son opacos para el traductor.
- Mantenga los **SVG de origen** en un directorio dedicado separado de `svg.outputDir`. Mezclar fuentes y archivos de configuración regional generados hace que sea imposible saber qué archivos son seguros para editar o regenerar.

Para aplicaciones web, habilite `forceLowercase: true` cuando su diseño utilice etiquetas en minúsculas; esto evita desajustes de distinción entre mayúsculas y minúsculas en sistemas de archivos y CDN.

<a id="output-layouts"></a>
### Distribuciones de salida

`translate-svg` admite dos formas de salida comunes. Elija según cómo su aplicación o sitio de documentación haga referencia a los archivos SVG en tiempo de ejecución.

| Diseño | `svg.style` | Ideal para | Guía secundaria |
|--------|-------------|----------|-------------|
| **Plano (aplicación web)** | `"flat"` | Next.js, Vite y otras aplicaciones que incrustan SVGs por nombre de archivo codificado por configuración regional | [Aplicación web (SVG plano)](/guide/svg-translation/translated-svg-web-app) |
| **Colocado (sistema de documentación)** | `"nested"` + `pathTemplate` | Docusaurus y otros sitios de sistemas de documentación donde los activos traducidos se encuentran junto a las páginas traducidas | [SVG colocado](/guide/svg-translation/translated-svg-colocated) |

El **diseño plano** escribe archivos como `public/assets/diagram.de.svg` junto a `diagram.en-GB.svg`. Su aplicación los referencia con un sufijo de configuración regional:

```tsx
<img src={`/assets/diagram.${locale}.svg`} alt="Architecture diagram" />
```

El **diseño colocado** escribe el SVG de cada configuración regional en el árbol de contenido de esa configuración regional (por ejemplo, `i18n/de/.../assets/diagram.svg`). El markdown de origen y el traducido usan la misma ruta relativa (`../assets/diagram.svg`); no se necesita ninguna regla `regexAdjustments`.

Consulte la [guía de decisión de imágenes y capturas de pantalla](/guide/images-and-screenshots/#decision-guide) para saber cómo los diseños SVG encajan junto con las estrategias de capturas de pantalla rasterizadas.

<a id="step-1-enable-and-configure"></a>
### Paso 1: Habilitar y configurar

Habilite la función y apunte `translate-svg` a sus archivos de origen y a la raíz de salida:

```json
{
  "features": {
    "translateSVG": true
  },
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

Campos clave de `svg`:

- `sourcePath` — uno o más directorios o patrones globales (por ejemplo, `"images/*.svg"`, `"**/icons/*.svg"`). Se escanea recursivamente desde la raíz del proyecto.
- `outputDir` — directorio raíz para la salida SVG traducida.
- `style` — `"flat"` o `"nested"` cuando no se utiliza un `pathTemplate` personalizado.
- `pathTemplate` — ruta de salida personalizada opcional con marcadores de posición `{outputDir}`, `{locale}`, `{llocale}`, `{basename}`, `{stem}` y otros (requerido para diseños de sistemas de documentos colocados).
- `forceLowercase` — texto traducido en minúsculas al volver a ensamblar.

Referencia completa del campo: [Configuración — `svg`](/reference/configuration#svg).

<a id="step-2-translate"></a>
### Paso 2: Traducir

```bash
npx ai-i18n-tools translate-svg
```

Traducir una sola configuración regional:

```bash
npx ai-i18n-tools translate-svg --locale de
```

Previsualizar sin escribir archivos:

```bash
npx ai-i18n-tools translate-svg --dry-run
```

`sync` ejecuta el paso SVG automáticamente cuando `features.translateSVG` y `svg` están configurados (omitir con `--no-svg`). Las banderas compartidas incluyen `-l` / `--locale`, `-p` / `--path`, `-j` / `--concurrency` y `--force` / `--force-update`.

<a id="troubleshooting"></a>
### Solución de problemas

Los problemas comunes de SVG —directorios de origen/salida mixtos, URL estáticas absolutas en Docusaurus y errores de diseño de rutas— se tratan en [Solución de problemas de SVG](/guide/svg-translation/troubleshooting). Para activos ráster y reescritura de enlaces, consulte [Solución de problemas de imágenes y capturas de pantalla](/guide/images-and-screenshots/troubleshooting).
