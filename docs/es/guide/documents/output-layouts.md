<a id="output-layouts"></a>
# Diseños de salida

`docsOutput.style` controla dónde se escriben los archivos markdown traducidos. Usa los valores de cadena exactos a continuación en `docs[].docsOutput.style` (los alias son diseños predefinidos, no motores independientes).

`docsOutput.style = "nested"` (predeterminado cuando se omite) — refleja el árbol de origen bajo `{outputDir}/{locale}/` (por ejemplo, `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — árbol de documentación con prefijo de configuración regional para sitios de documentación estática. Los archivos bajo `docsRoot` se escriben en `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`. Las rutas fuera de `docsRoot` vuelven al diseño anidado. Establece `docs[].docsOutput.docsRoot` como la raíz del origen en inglés (por ejemplo, `"docs"` o `"src/content/docs"`). Cuando `docsOutput.style = "doc-system"`, debes establecer `localeSubpath` explícitamente (usa un alias a continuación para configuraciones preestablecidas).

**Alias** (mismo motor de diseño, valor preestablecido de `localeSubpath`):

- `docsOutput.style = "docusaurus"` — `localeSubpath` se establece de forma predeterminada en `docusaurus-plugin-content-docs/current` (diseño del complemento i18n de Docusaurus).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` se establece de forma predeterminada en `""` (páginas traducidas directamente bajo `{outputDir}/{locale}/`, coincidiendo con [Starlight](https://starlight.astro.build/guides/i18n/) cuando el inglés reside en la raíz del contenido y `outputDir` es igual a `docsRoot`).
- `docsOutput.style = "vitepress"` — mismo diseño que `doc-system` con `localeSubpath` vacío; los nombres de las carpetas de configuración regional BCP-47 se conservan (`localePathLowercase` se establece de forma predeterminada en `false`). Consulte [Integración de VitePress](/guide/vitepress-integration).

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

Etiquetas JSON opcionales — cadenas de interfaz de Docusaurus desde `docusaurusCatalogDir` (no el contenido del cuerpo MDX):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight incluye cadenas de interfaz para muchas configuraciones regionales; las sustituciones personalizadas opcionales usan `src/content/i18n/en.json` con `jsonPathTemplate: "{outputDir}/{locale}.json"` en un bloque `docs[]` separado cuando sea necesario.

Las cadenas de navegación/barra lateral/pie de página de VitePress no están en markdown — autor `docs/.vitepress/i18n/theme.en.json` y traduzca con JSON (`json[]`, `features.translateJson`). Consulte [Integración de VitePress](/guide/vitepress-integration).

`docsOutput.style = "flat"` — coloca los archivos traducidos junto al origen con un sufijo de configuración regional, o en un subdirectorio. Los enlaces relativos entre páginas se reescriben automáticamente cuando `docsOutput.style = "flat"` (a menos que `rewriteRelativeLinks: false` o un `pathTemplate` personalizado esté establecido).

```text
docs/guide.md → i18n/guide.de.md
```

Para enlaces de anclaje entre páginas en un diseño plano, consulte [Enlaces de anclaje](/guide/documents/anchor-links).

Para capturas de pantalla y recursos ráster en páginas traducidas, consulte [Imágenes y capturas de pantalla](/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## Marcadores de posición `pathTemplate` / `jsonPathTemplate`

Anule dónde se escriben los archivos traducidos configurando `docs[].docsOutput.pathTemplate` (markdown y MDX) o `jsonPathTemplate` (archivos de etiquetas JSON). Ambos aceptan los mismos marcadores de posición. Las rutas resueltas deben permanecer dentro del `outputDir` de ese bloque (la CLI rechaza las rutas que se escapan de él).

Si utiliza un `pathTemplate` personalizado, `rewriteRelativeLinks` por defecto es `false` a menos que lo establezca explícitamente — la reescritura de enlaces relativos está pensada para `docsOutput.style = "flat"` sin necesidad de una plantilla personalizada.

Para diseños integrados (`nested`, `flat`, `doc-system` sin plantilla personalizada), establezca `docsOutput.localePathLowercase` en `true` para escribir segmentos de carpetas o nombres de archivo en minúsculas (por ejemplo, `pt-br` en lugar de `pt-BR`). El alias `astro-starlight` establece esto por defecto en `true`. Los valores personalizados de `pathTemplate` / `jsonPathTemplate` no cambian — use `{llocale}` allí cuando necesite segmentos en minúsculas manteniendo `{locale}` como BCP-47.

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
