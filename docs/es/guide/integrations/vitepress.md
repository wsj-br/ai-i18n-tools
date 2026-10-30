<a id="vitepress-integration"></a>
# Integración de VitePress

Utilice `init -t ui-vitepress` y `docsOutput.style: "vitepress"` para sitios de documentación de [VitePress](https://vitepress.dev/). El preajuste es un alias para `doc-system` con un `localeSubpath` vacío y los nombres de las carpetas de configuración regional BCP-47 conservados (`localePathLowercase` por defecto es `false`, por lo que las carpetas permanecen `pt-BR`, `zh-Hans`, etc.).

Consulte también [Documentos](/es/guide/documents/) y la demostración ejecutable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). El propio sitio de documentación de este repositorio en `docs/` es una referencia completa de VitePress + ai-i18n-tools (nueve configuraciones regionales, catálogo de temas, GitHub Pages).

<a id="quick-start"></a>
## Inicio rápido

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Habilite `features.translateDocs` cuando traduzca el contenido de la página y las cadenas de la interfaz de VitePress en una sola ejecución de `sync`.

<a id="page-layout"></a>
## Diseño de página

El markdown en inglés se encuentra en la raíz del contenido de VitePress (normalmente `docs/`). Las copias traducidas se escriben junto al árbol de origen:

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Configure un bloque `docs[]`:

```json
{
  "contentPaths": ["docs/index.md", "docs/guide"],
  "outputDir": "docs",
  "docsOutput": {
    "style": "vitepress",
    "docsRoot": "docs",
    "rewriteVitepressLinks": true
  }
}
```

Apunte `contentPaths` a los archivos y directorios `.md` escritos en `sourceLocale`. Ese idioma puede ser cualquier idioma. Establezca `docsRoot` en la misma carpeta que VitePress usa como su raíz de contenido.

Conecte la [internacionalización](https://vitepress.dev/guide/i18n) de VitePress: la configuración regional de origen en `root`, cada configuración regional de destino en `locales[code].link` (por ejemplo, `/pt-BR/`). Mantenga `targetLocales` en `ai-i18n-tools.config.json` alineado con las claves `locales` en `.vitepress/config.mts`.

<a id="enable-i18n-in-an-existing-site"></a>
### Habilitar i18n en un sitio existente

Una configuración de VitePress solo en inglés necesita estas piezas antes de que aparezcan las páginas traducidas. La configuración inicial utiliza la indicación en [Añadir i18n a un sitio web o de documentación](/es/guide/add-i18n-to-website#run-the-agent-prompt). La [indicación del catálogo del tema](#wire-configmts-to-generated-theme-json-one-off) es el seguimiento después del primer `sync`, cuando las cadenas de navegación aún están en línea en la configuración.

- `locales.root` para inglés (`label`, `lang` y `themeConfig`).
- Una entrada de `locales[code]` por cada configuración regional de destino: `label`, `lang`, `link: '/${code}/'` y `title` / `description` por configuración regional.
- Enlaces `themeConfig` y `activeMatch` prefijados por configuración regional con `prefixVitepressThemeConfigLinks` (consulte [Enlaces de navegación/barra lateral del tema](#theme-navsidebar-links)).
- `targetLocales` alineado con esas claves `locales`, luego `sync` para que existan `docs/<locale>/` y `theme.<locale>.json`.

<a id="theme-strings"></a>
## Cadenas de tema

Las etiquetas de navegación, barra lateral, pie de página, marcador de posición de búsqueda y otras etiquetas `themeConfig` de VitePress no se extraen de markdown. Configure `docsOutput.vitepressThemeCatalog` para que `translate-docs` inicialice el catálogo de la configuración regional de origen desde `.vitepress/config.mts` (cuando las cadenas están en línea) y traduzca los archivos JSON del tema de la configuración regional:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["docs/index.md", "docs/guide"],
      "outputDir": "docs",
      "docsOutput": {
        "style": "vitepress",
        "docsRoot": "docs",
        "vitepressThemeCatalog": {
          "configPath": "docs/.vitepress/config.mts",
          "catalogPath": "docs/.vitepress/i18n/theme.en.json"
        }
      }
    }
  ]
}
```

- `catalogPath` — JSON anidado en inglés. La inicialización desde `config.mts` se aplica solo mientras esas cadenas en inglés aún están en línea en la configuración. Después de que `themeConfigFor` lee el catálogo, `mergeThemeCatalogs` mantiene el archivo existente y `theme.en.json` es la fuente de la verdad. Edite ese archivo cuando cambie la redacción (o vuelva a poner el inglés en `config.mts` para un `sync`). Cambiar el nombre de una clave cambia el hash del segmento (`path`, un byte NUL y luego el valor), por lo que el siguiente `sync` vuelve a traducir esa cadena una vez para cada configuración regional de destino.
- `outputPathTemplate` (opcional) — salidas por configuración regional; predeterminado: el mismo directorio que `catalogPath` con `theme.{locale}.json`.

`init -t ui-vitepress` también genera `docs/.vitepress/config.mts` y `docs/.vitepress/i18n/theme.en.json` iniciales cuando esos archivos aún no existen. La configuración carga el catálogo a través de `loadTheme()` y conecta las etiquetas i18n estándar de VitePress (incluido `langMenuLabel`) en `themeConfigFor()`.

Cargue el archivo por configuración regional en `.vitepress/config.mts` a través de `loadTheme()` y compile `locales[code].themeConfig` a partir del JSON traducido. Consulte [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Cadenas del menú de idioma:** `locales[code].label` es el nombre visible de cada idioma en el menú desplegable (por ejemplo, `Português (Brasil)`). `themeConfig.langMenuLabel` es la **aria-label** del botón de cambio de idioma. VitePress usa `Change language` cuando se omite la opción. El catálogo de ejemplo almacena `Language` en su lugar, y tanto `theme.en.json` como `config.hardcoded.example.mts` usan la misma frase. Ponga `langMenuLabel` en el catálogo de temas y conecte `langMenuLabel: t.langMenuLabel` dentro de `themeConfigFor()` — no lo confunda con las cadenas `label` por configuración regional.

Durante `sync` / `translate-docs`, ai-i18n-tools advierte cuando una clave de catálogo en `theme.en.json` no se referencia desde `config.mts` (por ejemplo, una `t.langMenuLabel` faltante en `themeConfigFor()`).

**No** use `json[]` para las cadenas de tema de VitePress; ese patrón es solo para paquetes de configuración regional de aplicaciones no relacionados.

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## Conectar config.mts al JSON de tema generado (una sola vez)

Después de la primera ejecución exitosa de `i18n:sync` / `translate-docs` con `vitepressThemeCatalog`, el repositorio ha generado `theme.en.json` y `theme.{locale}.json`, pero un sitio **existente** aún puede tener cadenas `text:` / `message:` codificadas en `config.mts`. VitePress no utilizará el JSON traducido hasta que la configuración lo cargue a través de `loadTheme()`.

**Fuera del alcance de la herramienta:** codemod automático. Utilice la siguiente instrucción una vez por proyecto (o refactorice manualmente utilizando la configuración de ejemplo).

1. **Cuándo** — después de la primera sincronización que produjo `catalogPath` y los archivos de tema de la configuración regional; antes de esperar la navegación/barra lateral traducida en desarrollo/compilación.
2. **Mantener sin cambios** — enlaces de ruta (`/guide/…`), claves de configuración regional, estructura `defineConfig`, opciones no de cadena (proveedor de búsqueda, indicadores contraídos).
3. **Referencia** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) y la forma `theme.en.json` generada.
4. **Verificar** — `pnpm docs:dev`, cambiar la configuración regional en la navegación, confirmar que la barra lateral/pie de página/marcador de posición de búsqueda se traduce; `pnpm docs:build` pasa.

**Ejemplo de instrucción para agente de IA** (copiar en Cursor u otro agente de codificación):

<details class="agent-prompt">
<summary>Solicitud del catálogo de temas</summary>

````markdown
# Load VitePress theme strings from the catalog

## Context

ai-i18n-tools translates VitePress chrome through
`docsOutput.vitepressThemeCatalog`. `extractVitepressThemeCatalog` writes
positional keys while English is still inline in `config.mts`
(`themeConfig.nav.0.text`, `themeConfig.sidebar.0.items.0.text`,
`locales.root.label`). The runnable example uses stable names instead
(`nav.guide`, `sidebar.gettingStarted`, `site.title`):
https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts

Reshape to named keys once and keep those names. Renaming changes the segment
hash, so the next `sync` re-translates the theme catalog for every locale (a few
dozen short strings, once). After the refactor, `config.mts` has no inline
display literals, `mergeThemeCatalogs` keeps `theme.en.json`, and that file is
the source of truth. Do not tell the user to refresh the catalog from
`config.mts` after this edit.

`translate-docs` does not rewrite links in `config.mts`. Locale pages must
prefix `link` and `activeMatch` or they point at English routes.

## Scope

Edit `.vitepress/config.mts` and `theme.en.json` only. Skip markdown bodies,
route paths, `base`, search provider choice, collapsed flags, and external URLs.

## Call shape

Precondition: `docsOutput.vitepressThemeCatalog` is set and `sync` has already
written `catalogPath`. If `theme.en.json` is missing, stop and ask for that
`sync` first.

1. Add `ai-i18n-tools` as a devDependency. Import
   `prefixVitepressThemeConfigLinks` from `ai-i18n-tools`.
2. Add `loadTheme(localeFile)` that reads `docs/.vitepress/i18n/` via
   `import.meta.url` and `fileURLToPath`. If a locale file is missing
   (`fs.existsSync`), fall back to the English theme so a fresh checkout does
   not crash before the first translation.
3. Rename positional keys in `theme.en.json` to short stable names. Update
   `themeConfigFor` to read those names. Keep links and structure in TypeScript.
   Only display strings come from the catalog.
4. If you keep positional keys instead, read them with string indexes:
   `t.themeConfig.nav["0"].text`. A numeric index `nav[0]` is invisible to the
   unused-key check and warns for every nav and sidebar entry.
5. Wrap the object `themeConfigFor` returns with
   `prefixVitepressThemeConfigLinks(themeConfig, localeRoutePrefix)`. Pass
   `/${code}` for each target locale and `null` for root. That prefixes `link`
   and `activeMatch`.
6. Per locale entry: `label` (native language name), `lang`,
   `link: '/${code}/'`, and that locale's `title` and `description` from the
   catalog.
7. Keys the extractor does not collect must be added to `theme.en.json` by hand,
   then referenced from `themeConfigFor`. That includes local-search copy under
   `search.options.locales.<code>.translations` (`button.buttonText`,
   `modal.noResultsText`, and the rest of that tree). Current VitePress docs do
   not use `options.placeholder` for local search. Also add
   `socialLinks[].ariaLabel`. A `notFound.title` inline in config is collected
   because `title` is a known key; `notFound.quote`, `notFound.linkText`,
   `notFound.linkLabel`, and `notFound.code` are not.

## Order

1. Confirm the catalog file exists.
2. Reshape keys, wire `loadTheme` and `themeConfigFor`, prefix links.
3. Ask the user to run `sync` so locale theme files are regenerated from the new
   key names. Do not hand-translate them.

## Do not

- Do not translate strings yourself.
- Do not leave a second copy of the same label in `config.mts` and in
  `theme.en.json`.
- Do not hand-edit `theme.<locale>.json`.
- Do not change markdown paths, `base`, or the path of internal links (only the
  locale prefix).

## Verify

- `pnpm docs:dev`: English and one target locale show translated nav, sidebar,
  footer, and search chrome.
- A locale page's nav `link` and `activeMatch` include the locale prefix
  (`/pt-BR/guide/`, not `/guide/`).
- `pnpm docs:build` passes.
- Removing a locale theme file still builds, because `loadTheme` falls back to
  English.

## Report back

List files changed, the old path key and the new name for each rename, any
string you added by hand because the extractor skips it, and anything you left
inline on purpose.
````

</details>

<a id="example-project"></a>
## Proyecto de ejemplo

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — Fuentes en inglés en `docs/`, árboles de páginas `pt-BR` y `zh-Hans` confirmados, además de `theme.pt-BR.json` / `theme.zh-Hans.json`. Ejecute `pnpm run docs:dev` en el puerto 3060.

<a id="readme-and-the-docs-homepage"></a>
## README y la página de inicio de la documentación

Los proyectos descendentes a veces copian `README.md` en el sitio de VitePress como `docs/index.md` (a través de un script de compilación o sincronización manual). Ese patrón comparte un archivo entre GitHub y el sitio de documentación, pero las reglas de enlace difieren:

| Tipo de enlace | Funciona en GitHub | Funciona en VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Sí | No — use las rutas del sitio o deje que el normalizador reescriba durante la sincronización |
| `./LICENSE`, `examples/demo/` | Sí (relativo al repositorio) | No — use **URL completas** |
| `/guide/foo` | No | Sí |

**Recomendación para README sincronizado → índice:** En `README.md`, use **URL completas** para cualquier cosa fuera del árbol de contenido de VitePress (`LICENSE`, `examples/`, archivos de configuración, archivos de contexto del agente) y para copias traducidas de README bajo `translated-docs/`. Use rutas `docs/guide/…` (o rutas del sitio en la documentación en inglés bajo `docs/`) para enlaces de documentación dentro del sitio; un script de sincronización o el normalizador `rewriteVitepressLinks` puede convertir esos a rutas `/guide/…`.

**Este repositorio** mantiene `README.md` y `docs/index.md` como **archivos independientes**: README es una página de inicio concisa de GitHub/npm; `docs/index.md` es el punto de entrada del sitio de documentación que enlaza con `/guide/` y `/reference/`. Las guías detalladas se encuentran en `docs/`; no duplique material de referencia extenso en el README. Actualice cada uno según su audiencia cuando cambien los hechos compartidos.

Ejemplos de enlaces para un README sincronizado en otro proyecto:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/es/guide/quick-start)
```

<a id="link-conventions"></a>
## Convenciones de enlaces

VitePress sirve páginas en inglés desde la raíz del contenido y copias de la configuración regional desde `docs/<locale>/…`, pero **los enlaces dentro de la página deben usar rutas del sitio** (`/guide/quick-start`, `/reference/configuration`) — no rutas relativas al repositorio como `docs/guide/quick-start.md` o `../guide/quick-start.md`. Esas rutas de estilo README funcionan en GitHub pero se rompen dentro de VitePress (404 en desarrollo y en GitHub Pages).

Habilite el normalizador integrado para que `translate-docs` corrija los enlaces en cada archivo traducido automáticamente:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` está habilitado por defecto cuando `style` es `"vitepress"`.

| Autor en la configuración regional de origen | Después del normalizador (salida raíz de la configuración regional de origen) | Después del normalizador (salida `docs/<locale>/` traducida) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/es/guide/json)` | `[JSON](/es/guide/json)` | `[JSON](/pt-BR/guide/json)` (el prefijo de la configuración regional coincide con la carpeta) |
| `[Quick start](/es/guide/quick-start)` en el cuerpo o `hero.actions[].link` | sin cambios (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| `[Home](./README.md)` en el índice de la configuración regional | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | sin cambios | sin cambios (recurso `docs/public/` compartido) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | sin cambios (URL completa) | sin cambios (URL completa) |

Los archivos de la configuración regional de origen en `docs/` mantienen rutas de sitio **neutrales a la configuración regional** (`/guide/…`). Este ejemplo usa inglés como `sourceLocale`. Cualquier idioma es válido. Los archivos escritos en `docs/<locale>/…` obtienen automáticamente el prefijo de la configuración regional en las rutas de contenido internas, incluyendo el **frontmatter del diseño de la página de inicio** (`hero.actions[].link`, `features[].link`, `prev`/`next`). Los activos públicos compartidos, como `/ai-i18n-tools_logo.svg` y `/translation-dashboard.png`, permanecen sin prefijo en cada configuración regional.

<a id="theme-navsidebar-links"></a>
### Enlaces de navegación/barra lateral del tema

`translate-docs` **no** reescribe los enlaces en `.vitepress/config.mts`. Los valores de `link` de la barra de navegación y la barra lateral se crean una vez en TypeScript y deben tener un prefijo por configuración regional en el momento de la compilación de la configuración.

VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting) solo controla el **selector de configuración regional** (mapeando la página equivalente cuando el usuario elige otro idioma). **No** reescribe los href estáticos de `nav` / `sidebar` en la página de la configuración regional actual.

Utilice `prefixVitepressThemeConfigLinks` de `ai-i18n-tools` (las mismas reglas de prefijo que la reescritura de enlaces de markdown):

```typescript
import { prefixVitepressThemeConfigLinks } from "ai-i18n-tools";

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? `/${localeCode}` : null;
  return prefixVitepressThemeConfigLinks(
    {
      nav: [{ text: t.nav.guide, link: "/guide/getting-started", activeMatch: "/guide/" }],
      sidebar: [/* … locale-neutral /guide/… links … */],
      /* footer, search, etc. */
    },
    localeRoutePrefix
  );
}

// root English
themeConfig: themeConfigFor(enTheme)

// each target locale
themeConfig: themeConfigFor(theme, code)
```

Prefije `activeMatch` junto con `link` para que el resaltado de navegación funcione en las rutas de la configuración regional (`/pt-BR/guide/` no `/guide/`). Las URL externas y los activos públicos compartidos permanecen sin cambios.

Añada `ai-i18n-tools` como **devDependency** en el proyecto VitePress (consulte `examples/vitepress-docs/package.json`) para que `config.mts` pueda importar `prefixVitepressThemeConfigLinks`. El sitio de documentación principal de ai-i18n-tools importa directamente desde `src/processors/…` porque utiliza el monorepo; las copias independientes (degit) deben usar el paquete npm.

**Reglas de autoría**

- Enlaces de documentación entre páginas: use **rutas del sitio** (`/guide/…`, `/reference/…`) en Markdown en inglés bajo `docs/`, o rutas `docs/guide/…` al redactar un README que se sincronizará con `docs/index.md` en otro proyecto.
- Demos ejecutables, `LICENSE` y otros archivos del repositorio: use **URL completas de GitHub** en `README.md` y en la documentación (consulte el [README y la página principal de la documentación](#readme-and-the-docs-homepage)).
- **No** edite manualmente los enlaces en `docs/<locale>/` — regenérelos con `sync` / `translate-docs`.

Consulte también [Reescritura de enlaces](/es/guide/images-and-screenshots/link-rewriting) (plano vs VitePress) y [Configuración — `docsOutput`](/es/reference/configuration#docsoutput).
