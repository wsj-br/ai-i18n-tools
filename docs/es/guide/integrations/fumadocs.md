<a id="fumadocs-integration"></a>
# Integración de Fumadocs

Utilice `init -t ui-fumadocs` y `docsOutput.style: "fumadocs"` para sitios de documentación de [Fumadocs](https://www.fumadocs.dev/) 4 en Next.js App Router. El preajuste es un alias para `doc-system` con un `localeSubpath` vacío y códigos de configuración regional BCP-47 o cortos preservados (`localePathLowercase` por defecto es `false`).

Consulte también [Documentos](/es/guide/documents/) y la demostración ejecutable [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) (analizador de puntos, puerto 3080).

<a id="quick-start"></a>
## Inicio rápido

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Habilite `features.translateDocs` cuando traduzca el contenido de la página, las etiquetas de la barra lateral de `meta.json` y las anulaciones de la interfaz de usuario de Fumadocs en una ejecución de `sync`.

<a id="page-layout"></a>
## Diseño de página

Fumadocs admite dos diseños de contenido i18n a través de `docsOutput.fumadocsParser`. El analizador de **puntos** es el predeterminado (integrado en Fumadocs y sitios de producción como [SWR](https://github.com/vercel/swr-site)).

<a id="dot-parser-default"></a>
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

<a id="enable-i18n-in-an-existing-site"></a>
### Habilitar i18n en un sitio existente

Una aplicación Fumadocs solo en inglés necesita una ruta de configuración regional y `defineI18n` antes de que `translate-docs` pueda escribir archivos hermanos. La [solicitud del agente](#agent-prompt) recorre un sitio existente. Lista de verificación:

- `defineI18n` en `lib/i18n.ts` con `languages`, `defaultLanguage` y `parser: "dot"` o `"dir"`.
- Rutas `app/[lang]/` y `createI18nMiddleware` de `proxy.ts` (el archivo del ejemplo).
- `i18n.translations()` en `lib/layout.shared.ts`, pasado a `i18nProvider`.
- MDX en inglés en la raíz de la colección (punto) o bajo `content/docs/en/` (directorio).
- `targetLocales` igual a `languages` menos el idioma predeterminado, luego `sync`.

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

Consulte `ai-i18n-tools.config.dir.example.json` en [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) para una configuración de directorio de copiar y pegar. El modelo mental coincide con la [integración de Nextra](/es/guide/integrations/nextra#page-layout).

<a id="sidebar-metajson"></a>
## Barra lateral (`meta.json`)

Fumadocs utiliza archivos JSON `meta.json` para la estructura y los títulos de la barra lateral. Cuando `docsOutput.style` es `"fumadocs"`, **`translate-docs`** recopila `meta.json` bajo `docsRoot` (o `docs[].fumadocsMetaGlob`), traduce los valores de cadena para las claves enumeradas en `docs[].fumadocsMetaTranslatableKeys` (predeterminado: `title`, `description`) y escribe las salidas de configuración regional:

| Analizador | Configuración regional de origen | Salida |
|--------|--------------------------|--------|
| **punto** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**No** traduzca las matrices de slug de `pages`, `root`, `icon`, `defaultOpen` u otras claves estructurales, solo las etiquetas legibles por humanos.

<a id="ui-catalog"></a>
## Catálogo de interfaz de usuario

La interfaz de diseño de Fumadocs (marcador de posición de búsqueda, nombres de visualización de configuración regional y otras anulaciones de `defineTranslations` / `i18n.translations()` en `lib/layout.shared.ts`) no se extrae de markdown. Configure **`docsOutput.fumadocsUiCatalog`** para que **`translate-docs`** inicialice el catálogo de configuración regional de origen desde `sourcePath` y traduzca JSON por configuración regional:

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

- **`catalogPath`** — JSON plano en inglés. El bootstrap lee solo el objeto `en` de `.add({ … })` en `sourcePath`. Los literales de cadena en ese objeto se convierten en claves de catálogo (`displayName`, `Search(search trigger)`). `.add()` solo acepta claves registradas por los preajustes de la interfaz de usuario de Fumadocs, por lo que un título de navegación como `site.title` no puede residir allí. El ejemplo mantiene `site.title` en el JSON y lee `catalog["site.title"]` para `nav.title`. Las claves ya presentes en el archivo pero ausentes del objeto `en` permanecen: la fusión es `{ ...existing, ...extracted }`. Vuelva a ejecutar `sync` cuando cambien los literales en inglés.
- **`outputPathTemplate`** (opcional) — salidas por configuración regional; predeterminado: `ui.{locale}.json` junto a `catalogPath`.

Una clave traducida no hace nada hasta que la aplicación la lee. `i18n.translations().get(lang)` devuelve solo las claves registradas con `.extend()` (los preajustes de la interfaz de usuario de Fumadocs). Extienda el catálogo de configuración regional en `.add()` para que esas claves se apliquen, y coloque `displayName` nativo **después** de la extensión para que una traducción del nombre en inglés no lo reemplace:

```ts
"pt-BR": {
  ...loadUiCatalog("pt-BR"),
  displayName: "Português (Brasil)",
},
```

`site.title` no es una clave de la interfaz de usuario de Fumadocs. El ejemplo lo lee del catálogo para `nav.title`. Una etiqueta de búsqueda que existe solo en `ui.pt-BR.json` permanece en el preajuste incorporado hasta que esa extensión (u otra lectura) la use.

Consulte [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts).

Las locales estándar pueden estar cubiertas por los ajustes preestablecidos de `@fumadocs/language/*` sin costo de LLM; el catálogo traduce las **anulaciones de proyecto** en el bloque de inglés solo.

<a id="agent-prompt"></a>
## Solicitud del agente

Copie esto cuando un sitio Fumadocs solo en inglés deba obtener configuraciones regionales. Conecta el enrutamiento y el catálogo de la interfaz de usuario. No traduce cadenas.

<details class="agent-prompt">
<summary>Solicitud de catálogo de interfaz de usuario</summary>

````markdown
# Enable Fumadocs i18n and the UI catalog

## Context

ai-i18n-tools translates Fumadocs MDX, `meta.json` titles, and the English block
of `i18n.translations().add({ en: { … } })` via `translate-docs` and
`docsOutput.fumadocsUiCatalog`. The literal in that `en` object is the source
string. Locale JSON takes effect only for keys the app reads: either a catalog
spread into `.add()` for registered UI keys, or a direct read such as
`catalog["site.title"]` for the nav title. Do not translate any string.

Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs

## Scope

Edit `lib/i18n.ts`, `lib/layout.shared.ts`, `proxy.ts`, `app/[lang]/` routes,
and `ai-i18n-tools.config.json`. Skip URLs, slugs, and native language names
(`displayName` on each locale entry).

## Call shape

- `defineI18n({ languages, defaultLanguage, parser })`. Use `"dot"` unless the
  project already keeps English under a locale folder (`"dir"`).
- `export default createI18nMiddleware(i18n)` from `proxy.ts`.
- Move pages under `app/[lang]/…` and pass `lang` into `baseOptions` and
  `i18nProvider(translations, lang)`.
- In `lib/layout.shared.ts`, keep English UI overrides as string literals inside
  `.add({ en: { … } })`. For each other locale, spread `loadUiCatalog(locale)`
  and then set `displayName` to the native name.
- Config: `features.translateDocs`, `docsOutput.style: "fumadocs"`,
  `fumadocsParser` matching `defineI18n`, and `fumadocsUiCatalog.sourcePath`
  pointing at `lib/layout.shared.ts`. `targetLocales` must equal `languages`
  except the default language, character for character.

## Order

1. Routing and `defineI18n`.
2. English literals in the `en` block, and the catalog spread for other locales.
3. Ask the user to run `sync`. Do not hand-write `ui.<locale>.json` or
   translated MDX.

## Do not

- Do not translate, rename, or reword the English literals.
- Do not put native language names only in the `en` block (they would be
  extracted and translated).
- Do not hand-edit locale JSON, `meta.<locale>.json`, or locale MDX.
- Do not use `json[]` for this catalog.

## Verify

- `pnpm build` passes.
- The default locale still shows the English overrides.
- After `sync`, one other locale shows the translated search trigger and nav
  title, and `displayName` in the language menu is still the native name.

## Report back

List files changed, each key you added to the `en` block, each key you left
unread (and so unused) with a one-line reason, and whether the parser is `dot`
or `dir`.
````

</details>

**No** utilice `json[]` para las cadenas de interfaz de usuario de Fumadocs — esa canalización es para paquetes de locales de aplicaciones no relacionados.

<a id="link-conventions"></a>
## Convenciones de enlaces

Fumadocs sirve rutas con prefijo de locale a través de middleware de Next.js (`/docs/getting-started`, `/pt/docs/getting-started`). **Los enlaces dentro de la página deben permanecer neutrales en cuanto al locale** (`/docs/getting-started`) para que el prefijo de locale activo se aplique automáticamente.

Habilite el normalizador incorporado para que `translate-docs` corrija los enlaces en cada archivo traducido automáticamente:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks` se habilita de forma predeterminada cuando `style` es `"fumadocs"`.

| Autor en la configuración regional de origen | Después del normalizador |
|----------------------------------|--------------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/es/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | sin cambios (URL completa) |

**Reglas de autoría**

- Enlaces de documentos entre páginas: use **rutas de sitio neutrales en cuanto al locale** (`/docs/…`) en MDX en inglés, o `content/docs/…` / rutas relativas `.mdx` y deje que el normalizador las reescriba durante `sync`.
- Archivos de repositorio fuera del árbol de contenido: use **URLs completas**.
- No **edite manualmente** los enlaces en copias con sufijo de locale (`*.pt.mdx`) o árboles `content/{locale}/` — regenere con `sync` / `translate-docs`.

Consulte también [Documentos — reescritura de enlaces](/es/guide/documents/link-rewriting) y [Configuración — `docsOutput`](/es/reference/configuration#docsoutput).

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

- [Configuración — `docsOutput`](/es/reference/configuration#docsoutput)
- [Diseños de salida](/es/guide/documents/output-layouts)
- [Integración de Docusaurus](/es/guide/integrations/docusaurus)
- [Integración de Nextra](/es/guide/integrations/nextra) (modelo mental del analizador de directorios)
- [Integración de VitePress](/es/guide/integrations/vitepress) (patrón de arranque del catálogo de IU)
