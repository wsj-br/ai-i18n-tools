<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# El reescritor de enlaces planos y el flujo de dos pasos

Para `docsOutput.style = "flat"` (y a menos que `rewriteRelativeLinks: false` o un `pathTemplate` personalizado esté establecido), un reescritor integrado se ejecuta antes de `postProcessing`. Este gestiona enlaces entre documentos (añadiendo sufijos de configuración regional) y antepone un prefijo de profundidad a las URL de recursos que no son markdown.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Flujo en dos pasos cuando `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

Ejemplo con `outputDir: "translated-docs/"` y el origen `README.md` en la raíz del repositorio:

1. Reescritor de enlaces planos: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (un `../` para `translated-docs/`)
2. Expresión regular `postProcessing` `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

Para `docsOutput.style = "doc-system"` (incluyendo `"docusaurus"`, `"astro-starlight"` y `"nested"`), el reescritor de enlaces planos no se ejecuta. `postProcessing` ve la URL original del markdown traducido (típicamente una ruta absoluta como `/img/screenshots/en-GB/foo.png`).

<a id="vitepress-link-normalizer"></a>
### Normalizador de enlaces de VitePress (`style: "vitepress"`)

Cuando `docsOutput.rewriteVitepressLinks` es `true` (valor predeterminado cuando `style` es `"vitepress"`), se ejecuta un normalizador independiente después del reensamblaje del segmento (en lugar del reescritor plano). Está dirigido a sitios de VitePress/sistemas de documentación donde el inglés se encuentra en la raíz del contenido y las configuraciones regionales se encuentran en carpetas hermanas (`docs/de/guide/…`).

```
source href  →  [VitePress link normalizer]  →  [postProcessing]  →  output href
```

Reescrituras típicas:

| Patrón de origen | Destino normalizado |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (desde un archivo de configuración regional) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | sin cambios (usar URL completas para las rutas del repositorio) |

Para proyectos que sincronizan `README.md` → `docs/index.md`, use URL completas de GitHub en `README.md` para `LICENSE`, `examples/` y otros archivos fuera del árbol de VitePress. Consulte [Integración de VitePress — README como la página de inicio de la documentación](/guide/vitepress-integration#readme-as-homepage).

El reescritor plano y el normalizador de VitePress son mutuamente excluyentes por bloque `docs[]`; solo uno se ejecuta antes de `postProcessing`. Consulte [Integración de VitePress — Convenciones de enlaces](/guide/vitepress-integration#link-conventions).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Prefijo de profundidad por archivo con `flatPreserveRelativeDir`

El prefijo de profundidad se calcula por archivo de salida, no globalmente para todo el lote. Para cada archivo fuente, el reescritor calcula la ruta relativa desde el directorio del archivo de salida hacia el directorio del archivo fuente y utiliza esa como prefijo.

Esto significa que con `flatPreserveRelativeDir: true`, los archivos fuente en subdirectorios obtienen el prefijo correcto automáticamente. Por ejemplo, `docs/guide/quick-start.md` genera `translated-docs/docs/guide/quick-start.<locale>.md`. El prefijo por archivo es `../../docs/`, por lo que un activo `translation-dashboard.png` (un elemento del mismo nivel del árbol de origen) se convierte en `../../docs/translation-dashboard.png`, que se resuelve correctamente de `translated-docs/docs/guide/` a `docs/translation-dashboard.png`.

No se necesita ninguna corrección mediante expresión regular `postProcessing` para recursos con rutas relativas junto a los archivos fuente.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` y `linkRewriteDocsRoot`

| Opción                                   | Efecto                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Habilita o deshabilita explícitamente el reescritor de enlaces planos (anula el valor predeterminado cuando `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Raíz desde la cual se calcula `depthPrefix` (valor predeterminado `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Afecta al diseño de la ruta de salida, que el reescritor utiliza al calcular las rutas de destino para archivos traducidos conocidos       |

---

<a id="common-mistakes-and-troubleshooting"></a>
