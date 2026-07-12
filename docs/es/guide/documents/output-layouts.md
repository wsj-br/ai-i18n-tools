<a id="output-layouts"></a>
# Diseños de salida

`docsOutput.style` controla dónde se escriben los archivos markdown traducidos. Utilice los valores de cadena exactos que se indican a continuación en `docs[].docsOutput.style`. Los alias son diseños preestablecidos de `doc-system` (o diseño de sufijo de punto de Fumadocs), no motores separados; la carga de configuración puede reescribir los valores de alias de `style` a `"doc-system"` canónicos mientras se mantiene el preajuste original en `stylePreset`.

Establezca `docs[].docsOutput.pathTemplate` (markdown/MDX) o `jsonPathTemplate` (archivos de etiquetas JSON) para anular cualquier diseño integrado. Consulte [marcadores de posición de pathTemplate](#pathtemplate--jsonpathtemplate-placeholders) a continuación.

<a id="layout-overview"></a>
## Descripción general del diseño

| `docsOutput.style` | Motor | Uso típico |
| --- | --- | --- |
| `"nested"` | La carpeta de configuración regional refleja el árbol de origen completo | Predeterminado; salida i18n genérica en `{outputDir}/{locale}/` |
| `"flat"` | Sufijo de configuración regional en el nombre de archivo (subdirectorios opcionales) | README, registros de cambios, documentos de la raíz del repositorio, [selector de idioma](/es/guide/documents/language-switcher) |
| `"doc-system"` | Carpeta de configuración regional + `localeSubpath` opcional en `docsRoot` | Generadores de documentos estáticos personalizados |
| `"docusaurus"` | Preajuste de `doc-system` | Diseño de complemento i18n de [Docusaurus](/es/guide/integrations/docusaurus) |
| `"astro-starlight"` | Preajuste de `doc-system` (`localeSubpath: ""`) | [Astro Starlight](/es/guide/integrations/astro#astro-starlight), páginas de configuración regional de Astro sin formato |
| `"vitepress"` | Preajuste de `doc-system` (`localeSubpath: ""`) | Carpetas de configuración regional de [VitePress](/es/guide/integrations/vitepress) junto al inglés |
| `"nextra"` | Preajuste de `doc-system` (`localeSubpath: ""`) | Carpetas de configuración regional de [Nextra](/es/guide/integrations/nextra) (`content/en/` → `content/{locale}/`) |
| `"fumadocs"` | Sufijo de punto (predeterminado) o `doc-system` cuando `fumadocsParser: "dir"` | Diseño de contenido de punto o directorio de [Fumadocs](/es/guide/integrations/fumadocs) |

<a id="nested-default"></a>
## `nested` (predeterminado)

`docsOutput.style = "nested"` (predeterminado cuando se omite) — refleja el árbol de origen en `{outputDir}/{locale}/`.

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

Las rutas fuera de un `docsRoot` (cuando se establece) usan la misma forma anidada.

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"` — escribe archivos traducidos en `outputDir` con un sufijo de configuración regional en el nombre del archivo. De forma predeterminada, solo se mantiene el nombre base (`{outputDir}/{stem}.{locale}{extension}`), por lo que `docs/guide.md` y `docs/other/guide.md` chocarían a menos que habilite `flatPreserveRelativeDir`.

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

Los enlaces relativos entre páginas se reescriben automáticamente cuando `docsOutput.style = "flat"` (a menos que se establezca `rewriteRelativeLinks: false` o un `pathTemplate` personalizado). Consulte [Enlaces de anclaje](/es/guide/documents/anchor-links) para el manejo de `#anchor` entre páginas.

<a id="flat-with-flatpreserverelativedir"></a>
### `flat` con `flatPreserveRelativeDir`

Establezca `docsOutput.flatPreserveRelativeDir` en `true` para mantener los subdirectorios de origen en `outputDir`. Utilice esto cuando traduzca varios archivos markdown que comparten nombres base en diferentes carpetas, o cuando las salidas planas deben reflejar un árbol poco profundo (por ejemplo, README en la raíz del repositorio más `docs/*.md`).

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

El reescritor de enlaces planos utiliza la ruta de salida por archivo al calcular los prefijos de profundidad para las URL de activos; consulte [Reescritura de enlaces](/es/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir).

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` — árbol de documentación con prefijo de configuración regional para sitios de documentos estáticos. Los archivos en `docsRoot` se escriben en:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Las rutas fuera de `docsRoot` recurren al diseño [anidado](#nested) (`{outputDir}/{locale}/{relPath}`).

Establezca `docs[].docsOutput.docsRoot` en su raíz de origen en inglés (por ejemplo, `"docs"`, `"src/content/docs"` o `"content/en"`). Cuando `docsOutput.style = "doc-system"`, debe establecer `localeSubpath` explícitamente (use un alias a continuación para los ajustes preestablecidos). Use `localeSubpath: ""` cuando las páginas traducidas se encuentren directamente debajo de `{outputDir}/{locale}/` (estilo Starlight).

El JSON de shell de Docusaurus de `docusaurusCatalogDir` y otros artefactos JSON bajo los ajustes preestablecidos del sistema de documentos siguen el mismo diseño de carpeta que markdown. Con `style: "flat"`, los archivos de etiquetas JSON aún usan la forma anidada a menos que establezca `jsonPathTemplate`.

<a id="doc-system-aliases"></a>
## Alias del sistema de documentos

**Alias** (mismo motor `doc-system`, preajuste `localeSubpath` y valores predeterminados):

- `docsOutput.style = "docusaurus"` — `localeSubpath` por defecto es `docusaurus-plugin-content-docs/current` (diseño del complemento i18n de Docusaurus).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` por defecto es `""`; `localePathLowercase` por defecto es `true`. Páginas traducidas bajo `{outputDir}/{locale}/`, coincidiendo con [Starlight](https://starlight.astro.build/guides/i18n/) cuando el inglés reside en la raíz del contenido y `outputDir` es igual a `docsRoot`. También se usa para páginas de configuración regional de Astro simples (`src/pages/index.astro` → `src/pages/{locale}/index.astro`) — consulte [páginas del sitio web de Astro](/es/guide/ui-strings/astro-website#pages-parse-and-replace).
- `docsOutput.style = "vitepress"` — mismo diseño que `doc-system` con `localeSubpath` vacío; los nombres de las carpetas de configuración regional BCP-47 se conservan (`localePathLowercase` por defecto es `false`). Consulte [integración de VitePress](/es/guide/integrations/vitepress).
- `docsOutput.style = "nextra"` — mismo diseño que `doc-system` con `localeSubpath` vacío; el origen en inglés reside en una carpeta de configuración regional (por ejemplo, `content/en/`). Consulte [integración de Nextra](/es/guide/integrations/nextra).

Valor preestablecido de Docusaurus (páginas principales de documentación):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Valor preestablecido de Starlight (misma forma de bloque, rutas diferentes):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Preajuste de VitePress (inglés en la raíz del contenido, carpetas de configuración regional junto a la fuente):

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Preajuste de Nextra (inglés en una carpeta de configuración regional, carpetas de configuración regional hermanas para los destinos):

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

Etiquetas JSON opcionales — cadenas de interfaz de Docusaurus desde `docusaurusCatalogDir` (no el contenido del cuerpo MDX):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight incluye cadenas de interfaz para muchas configuraciones regionales; las sustituciones personalizadas opcionales usan `src/content/i18n/en.json` con `jsonPathTemplate: "{outputDir}/{locale}.json"` en un bloque `docs[]` separado cuando sea necesario.

Las cadenas de navegación/barra lateral/pie de página de VitePress no están en markdown; configura `docsOutput.vitepressThemeCatalog` y traduce dentro de **`translate-docs`**. Consulta la [integración de VitePress](/es/guide/integrations/vitepress).

El diccionario de temas de Nextra (`.ts`) y las etiquetas de la barra lateral de `_meta.ts` no están en markdown; usa `docs[].nextraDictionaryPath` y la recopilación automática de `_meta` cuando `style: "nextra"`, todo dentro de **`translate-docs`**. Consulta la [integración de Nextra](/es/guide/integrations/nextra).

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` — diseño de contenido de Fumadocs a través de `docsOutput.fumadocsParser`:

- **`"dot"` (predeterminado)** — sufijo de configuración regional en el nombre del archivo junto a las fuentes en inglés en `outputDir` (no una carpeta de configuración regional). Esto es independiente de la forma de la ruta `doc-system`.

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** — carpetas de configuración regional estilo Nextra; usa el mismo motor `doc-system` con `localeSubpath` vacío.

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Las anulaciones de la interfaz de usuario de Fumadocs (`lib/layout.shared.ts`) y las etiquetas de la barra lateral de `meta.json` no están en markdown; usa `docsOutput.fumadocsUiCatalog` y la recopilación automática de `meta.json` cuando `style: "fumadocs"`, todo dentro de **`translate-docs`**. Consulta la [integración de Fumadocs](/es/guide/integrations/fumadocs).

Para la reescritura de URL de enlaces y activos más allá de las correcciones de enlaces relativos integradas, consulta [Reescritura de enlaces](/es/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`).

Para capturas de pantalla y recursos ráster en páginas traducidas, consulte [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## Marcadores de posición `pathTemplate` / `jsonPathTemplate`

Anule dónde se escriben los archivos traducidos configurando `docs[].docsOutput.pathTemplate` (markdown y MDX) o `jsonPathTemplate` (archivos de etiquetas JSON). Ambos aceptan los mismos marcadores de posición. Las rutas resueltas deben permanecer dentro del `outputDir` de ese bloque (la CLI rechaza las rutas que se escapan de él).

Si utiliza un `pathTemplate` personalizado, `rewriteRelativeLinks` por defecto es `false` a menos que lo establezca explícitamente — la reescritura de enlaces relativos está pensada para `docsOutput.style = "flat"` sin necesidad de una plantilla personalizada.

Para diseños integrados (`nested`, `flat`, `doc-system` sin una plantilla personalizada), establezca `docsOutput.localePathLowercase` en `true` para escribir segmentos de nombre de archivo o carpeta de configuración regional en minúsculas (por ejemplo, `pt-br` en lugar de `pt-BR`). El alias `astro-starlight` y `doc-system` con `localeSubpath` vacío establecen esto en `true` en la carga de configuración. Los valores personalizados de `pathTemplate` / `jsonPathTemplate` no se modifican; use `{llocale}` allí cuando necesite segmentos en minúsculas mientras mantiene `{locale}` como BCP-47.

| Marcador de posición            | Función                                                                                                       | Ejemplo                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Ruta absoluta resuelta del `outputDir` de este bloque de documentación                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | Código del idioma de destino (mismo formato que en la configuración / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Mismo idioma en mayúsculas | `DE`, `PT-BR` |
| `{llocale}`            | Mismo idioma en minúsculas (coincide con las carpetas de rutas de Astro como `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}` | Ruta del archivo fuente relativa a la raíz del proyecto, formato POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Nombre del archivo **sin** extensión | `guide` para `docs/guide.md` |
| `{basename}` | Nombre de archivo **con** extensión | `guide.md` |
| `{extension}` | Extensión **incluyendo** el punto | `.md`, `.mdx` |
| `{docsRoot}`           | Ruta absoluta resuelta de `docsOutput.docsRoot` (`docs` por defecto si se omite)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` con el prefijo `docsRoot` eliminado cuando las cadenas de ruta coinciden (POSIX); de lo contrario, sin cambios | `docs/guide.md` (común); `guide.md` solo cuando se aplica el recorte |

**Ejemplo**

Fragmento de configuración:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Para la configuración regional `de` y la fuente `docs/guide.md`, con raíz del proyecto `/home/acme/repo` y `outputDir` resuelto a `/home/acme/repo/i18n`, la ruta expandida es:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Con `docsOutput.style = "flat"` y sin `pathTemplate` personalizado, un patrón común consiste en conservar solo el nombre del archivo mediante `{stem}` y `{extension}`, por ejemplo `{outputDir}/{stem}.{locale}{extension}`, lo que produce `…/guide.de.md` bajo el `outputDir` resuelto.
