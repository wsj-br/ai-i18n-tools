<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# El reescritor de enlaces planos y el flujo de dos pasos

Para `docsOutput.style = "flat"` (y a menos que se establezca `rewriteRelativeLinks: false` o un `pathTemplate` personalizado), se ejecuta un reescritor integrado antes de `postProcessing`. Maneja enlaces entre documentos (añadiendo sufijos de configuración regional) y antepone un prefijo de profundidad a las URL de activos que no son de Markdown. Las rutas de activos específicas de la configuración regional (capturas de pantalla, puentes `/img/…`) son luego reescritas por `docsOutput.postProcessing.regexAdjustments`.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Flujo en dos pasos cuando `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [regexAdjustments: locale segment]  →  output URL
```

Ejemplo con `outputDir: "translated-docs/"` y el origen `README.md` en la raíz del repositorio:

1. Reescritor de enlaces planos: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (un `../` para `translated-docs/`)
2. Regla `regexAdjustments` `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

Para `docsOutput.style = "doc-system"` (incluyendo `"docusaurus"`, `"astro-starlight"` y `"nested"`), el reescritor de enlaces planos no se ejecuta. `regexAdjustments` ve la URL original del Markdown traducido (normalmente una ruta absoluta como `/img/screenshots/en-GB/foo.png`).

<a id="vitepress-link-normalizer-style-vitepress"></a>
### Normalizador de enlaces de VitePress (`style: "vitepress"`)

Cuando `docsOutput.rewriteVitepressLinks` es `true` (valor predeterminado cuando `style` es `"vitepress"`), se ejecuta un normalizador independiente después del reensamblaje del segmento (en lugar del reescritor plano). Está dirigido a sitios de VitePress/sistemas de documentación donde el inglés se encuentra en la raíz del contenido y las configuraciones regionales se encuentran en carpetas hermanas (`docs/de/guide/…`).

```
source href  →  [VitePress link normalizer]  →  [regexAdjustments]  →  output href
```

Reescrituras típicas:

| Patrón de origen | Destino normalizado |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (desde un archivo de configuración regional) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | sin cambios (usar URL completas para las rutas del repositorio) |

Para proyectos que sincronizan `README.md` → `docs/index.md`, usa URLs completas de GitHub en `README.md` para `LICENSE`, `examples/` y otros archivos fuera del árbol de VitePress. Consulta [Integración de VitePress — README como página de inicio de la documentación](/es/guide/integrations/vitepress#readme-as-homepage).

El reescritor plano y el normalizador de VitePress son mutuamente excluyentes por bloque `docs[]`; solo uno se ejecuta antes de `regexAdjustments`. Consulta [Integración de VitePress — Convenciones de enlaces](/es/guide/integrations/vitepress#link-conventions).

<a id="nextra-link-normalizer-style-nextra"></a>
### Normalizador de enlaces de Nextra (`style: "nextra"`)

Cuando `docsOutput.rewriteNextraLinks` es `true` (predeterminado cuando `style` es `"nextra"`), un normalizador separado se ejecuta después del reensamblaje del segmento. Reescribe `content/en/…` y las rutas relativas de `.mdx` a rutas neutrales para la configuración regional (`/guide/…`). Consulta [Integración de Nextra — Convenciones de enlaces](/es/guide/integrations/nextra#link-conventions).

<a id="fumadocs-link-normalizer-style-fumadocs"></a>
### Normalizador de enlaces de Fumadocs (`style: "fumadocs"`)

Cuando `docsOutput.rewriteFumadocsLinks` es `true` (predeterminado cuando `style` es `"fumadocs"`), un normalizador separado se ejecuta después del reensamblaje del segmento. Reescribe `content/docs/…` y las rutas relativas de `.mdx` a rutas neutrales para la configuración regional (`/docs/…`). Consulta [Integración de Fumadocs — Convenciones de enlaces](/es/guide/integrations/fumadocs#link-conventions).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Prefijo de profundidad por archivo con `flatPreserveRelativeDir`

El prefijo de profundidad se calcula por archivo de salida, no globalmente para todo el lote. Para cada archivo fuente, el reescritor calcula la ruta relativa desde el directorio del archivo de salida hacia el directorio del archivo fuente y utiliza esa como prefijo.

Esto significa que con `flatPreserveRelativeDir: true`, los archivos fuente en subdirectorios obtienen el prefijo correcto automáticamente. Por ejemplo, `docs/guide/quick-start.md` genera `translated-docs/docs/guide/quick-start.<locale>.md`. El prefijo por archivo es `../../docs/`, por lo que un activo `translation-dashboard.png` (un elemento del mismo nivel del árbol de origen) se convierte en `../../docs/translation-dashboard.png`, que se resuelve correctamente de `translated-docs/docs/guide/` a `docs/translation-dashboard.png`.

No se necesita corrección `regexAdjustments` para los activos de ruta relativa junto con los archivos de origen.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` y `linkRewriteDocsRoot`

| Opción                                   | Efecto                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Habilita o deshabilita explícitamente el reescritor de enlaces planos (anula el valor predeterminado cuando `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Raíz desde la cual se calcula `depthPrefix` (valor predeterminado `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Afecta al diseño de la ruta de salida, que el reescritor utiliza al calcular las rutas de destino para archivos traducidos conocidos       |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

Configure reglas `{ "description"?, "search", "replace" }` ordenadas en `docs[].docsOutput.postProcessing` para reescribir URL de imágenes, capturas de pantalla y otros activos que los reescritores integrados no manejan; normalmente, intercambiando un segmento de carpeta de configuración regional (`screenshots/en-GB/` → `screenshots/de/`) o uniendo rutas estáticas absolutas (`/img/…` → `../assets/…`).

Las reglas se ejecutan en el **cuerpo** del Markdown traducido después del reensamblaje de segmentos y la reescritura de enlaces incorporada (plana o VitePress), y antes de `addFrontmatter`. En el diseño plano, escriba patrones `search` contra las URL **después** de aplicar el prefijo de profundidad; haga coincidir el segmento de configuración regional dentro de la ruta, no el `../` inicial.

**Carpetas de capturas de pantalla por configuración regional (diseño plano):**

```json
"docsOutput": {
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

Utilice `[^/]+` en lugar de codificar su configuración regional de origen (`en-GB`) para que la regla sobreviva a un cambio de `sourceLocale`. El marcador de posición más común es `${translatedLocale}`; `${sourceLocale}`, `${sourceFilename}`, `${translatedFilename}` y las variables de ruta también están disponibles; consulte [Documentos — Reescritura de enlaces](/es/guide/documents/link-rewriting#replace-placeholders).

Ejemplos específicos de diseño (plano, sistema de documentos, Docusaurus, Starlight): [Carpeta por configuración regional](/es/guide/images-and-screenshots/per-locale-folder). Reglas generales de enlaces entre páginas: [Documentos — Reescritura de enlaces](/es/guide/documents/link-rewriting). Referencia de campo: [Configuración — `docs`](/es/reference/configuration#docs).

---

<a id="common-mistakes-and-troubleshooting"></a>

Consulte [Errores comunes y solución de problemas](/es/guide/images-and-screenshots/troubleshooting) para expresiones regulares de configuración regional codificadas, directorios de capturas de pantalla faltantes y puente `/img/` de Docusaurus.
