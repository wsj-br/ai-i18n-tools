<a id="fumadocs-integration"></a>
# Integración de Fumadocs

Utilice `init -t ui-fumadocs` y `docsOutput.style: "fumadocs"` para sitios de documentación de [Fumadocs](https://www.fumadocs.dev/) 4 en Next.js App Router. El preajuste es un alias para `doc-system` con un `localeSubpath` vacío y códigos de configuración regional BCP-47 o cortos preservados (`localePathLowercase` por defecto es `false`).

Consulte también [Documentos](/guide/documents/) y la demostración ejecutable [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) (analizador de puntos, puerto 3080).

<a id="quick-start"></a>
## Comienzo rápido

```bash
npx ai-i18n-tools init -t ui-fumadocs
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Habilite `features.translateDocs` cuando traduzca el contenido de la página, las etiquetas de la barra lateral de `meta.json` y las anulaciones de la interfaz de usuario de Fumadocs en una ejecución de `sync`.

<a id="page-layout"></a>
## Diseño de página

Fumadocs admite dos diseños de contenido i18n a través de `docsOutput.fumadocsParser`. El analizador de **puntos** es el predeterminado (integrado en Fumadocs y sitios de producción como [SWR](https://github.com/vercel/swr-site)).

### Analizador de puntos (predeterminado)

El MDX en inglés reside en la raíz de la colección. Las copias traducidas utilizan un sufijo de configuración regional en el mismo directorio:

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

Alinee `targetLocales` con `defineI18n().languages` en `lib/i18n.ts` exactamente (el ejemplo utiliza códigos cortos `pt` y `zh`).

<a id="dir-parser-nextra-style"></a>
### Analizador de directorios (estilo Nextra)

Para equipos acostumbrados a las carpetas de configuración regional (`content/docs/en/` → `content/docs/pt-BR/`), establezca `fumadocsParser` en `"dir"`:

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

Consulte `ai-i18n-tools.config.dir.example.json` en [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) para obtener una configuración de directorio de copiar y pegar. El modelo mental coincide con la [integración de Nextra](/guide/nextra-integration#page-layout).

<a id="meta-json-sidebar"></a>
## Barra lateral (`meta.json`)

Fumadocs utiliza archivos JSON `meta.json` para la estructura y los títulos de la barra lateral. Cuando `docsOutput.style` es `"fumadocs"`, **`translate-docs`** recopila `meta.json` bajo `docsRoot` (o `docs[].fumadocsMetaGlob`), traduce los valores de cadena para las claves enumeradas en `docs[].fumadocsMetaTranslatableKeys` (predeterminado: `title`, `description`) y escribe las salidas de configuración regional:

| Analizador | Fuente en inglés | Salida |
|--------|----------------|--------|
| **punto** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**No** traduzca las matrices de slug de `pages`, `root`, `icon`, `defaultOpen` u otras claves estructurales, solo las etiquetas legibles por humanos.

<a id="ui-catalog"></a>
## Catálogo de interfaz de usuario

El "chrome" del diseño de Fumadocs (marcador de posición de búsqueda, nombres de visualización de configuración regional y otras anulaciones de `defineTranslations` / `i18n.translations()` en `lib/layout.shared.ts`) no se extrae de markdown. Configure **`docsOutput.fumadocsUiCatalog`** para que **`translate-docs`** arranque el catálogo en inglés desde `sourcePath` y traduzca el JSON por configuración regional:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — JSON plano en inglés generado (salida de arranque). Vuelva a ejecutar `sync` cuando cambien las anulaciones en inglés en `layout.shared.ts`.
- **`outputPathTemplate`** (opcional) — salidas por configuración regional; predeterminado: `ui.{locale}.json` junto a `catalogPath`.

Cargue el JSON por configuración regional en `layout.shared.ts` a través de `loadUiCatalog(locale)` y combínelo con `i18nProvider(translations, lang)` en su diseño raíz. Consulte [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts).

Las locales estándar pueden estar cubiertas por los ajustes preestablecidos de `@fumadocs/language/*` sin costo de LLM; el catálogo traduce las **anulaciones de proyecto** en el bloque de inglés solo.

**No** utilice `json[]` para las cadenas de interfaz de usuario de Fumadocs — esa canalización es para paquetes de locales de aplicaciones no relacionados.

<a id="framework-shell-translation"></a>
## Traducción del shell del framework

| Marco de trabajo | Cadenas de shell / tema | Canalización |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` catálogo | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo de temas/navegación/barra lateral | Documentos — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Etiquetas de la barra lateral de `_meta.ts` | Documentos — automático cuando `style: "nextra"` + `translate-docs` |
| Nextra | Diccionario de temas `.ts` | Documentos — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | Etiquetas de barra lateral de `meta.json` | Documentos — auto cuando `style: "fumadocs"` + `translate-docs` |
| Fumadocs | Catálogo de anulaciones de interfaz de usuario | Documentos — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Cadenas de interfaz de usuario integradas | Documentos — `translate-docs` (solo páginas) |

<a id="link-conventions"></a>
## Convenciones de enlaces

Cuando `rewriteFumadocsLinks` está habilitado (predeterminado para el ajuste preestablecido de `fumadocs`), los enlaces de markdown a `content/docs/…` o rutas `.mdx` relativas se reescriben en rutas neutrales de locale `/docs/…` (quitar `.mdx`, colapsar `index`). Las URLs externas, `mailto:` y `#anchors` no cambian.

Utilice `/docs/...` en la fuente de inglés cuando desee rutas estables en varios locales. Consulte [Documentos — reescritura de enlaces](/guide/documents/link-rewriting).

<a id="locale-codes"></a>
## Códigos de locale

Mantenga `targetLocales` en `ai-i18n-tools.config.json` alineado con `defineI18n().languages` en su aplicación Fumadocs **exactamente**. El ejemplo de punto utiliza códigos cortos (`pt`, `zh`); las configuraciones de directorio pueden utilizar carpetas BCP-47 (`pt-BR`, `zh-Hans`). No hay normalización forzada — los códigos no coincidentes producen rutas de salida incorrectas o páginas que faltan.

<a id="multiple-collections"></a>
## Colecciones múltiples

Los proyectos de Fumadocs pueden definir varios bloques de `defineDocs` en `source.config.ts` (documentos, blog, ejemplos). Agregue un bloque de `docs[]` por cada colección que traduzca, cada uno con su propio `contentPaths`, `outputDir` y `docsRoot`.

<a id="example-project"></a>
## Proyecto de ejemplo

[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — MDX en inglés en `content/docs/`, comprometido `pt` y `zh` páginas con sufijo de punto, `meta.json` y `lib/i18n/ui.{locale}.json`. Ejecute `pnpm run dev` en el puerto **3080**.

<a id="cross-references"></a>
## Referencias cruzadas

- [Configuración — `docsOutput`](/reference/configuration#docsoutput)
- [Diseños de salida](/guide/documents/output-layouts)
- [Integración de Nextra](/guide/nextra-integration) (modelo mental de analizador de directorio)
- [Integración de VitePress](/guide/vitepress-integration) (patrón de arranque de catálogo de interfaz de usuario)
