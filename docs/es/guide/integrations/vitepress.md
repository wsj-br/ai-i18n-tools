<a id="vitepress-integration"></a>
# Integración de VitePress

Utilice `init -t ui-vitepress` y `docsOutput.style: "vitepress"` para sitios de documentación de [VitePress](https://vitepress.dev/). El preajuste es un alias para `doc-system` con un `localeSubpath` vacío y los nombres de las carpetas de configuración regional BCP-47 conservados (`localePathLowercase` por defecto es `false`, por lo que las carpetas permanecen `pt-BR`, `zh-Hans`, etc.).

Consulte también [Documentos](/es/guide/documents/) y la demostración ejecutable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). El propio sitio de documentación de este repositorio en `docs/` es una referencia completa de VitePress + ai-i18n-tools (nueve configuraciones regionales, catálogo de temas, GitHub Pages).

<a id="quick-start"></a>
## Inicio rápido

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
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

Apunte `contentPaths` a sus archivos y directorios `.md` en inglés. Establezca `docsRoot` en la misma carpeta que VitePress utiliza como raíz de su contenido.

Conecte la [internacionalización](https://vitepress.dev/guide/i18n) de VitePress: inglés en `root`, cada configuración regional de destino en `locales[code].link` (por ejemplo, `/pt-BR/`). Mantenga `targetLocales` en `ai-i18n-tools.config.json` alineado con las claves `locales` en `.vitepress/config.mts`.

<a id="theme-strings"></a>
## Cadenas de tema

La navegación, la barra lateral, el pie de página, el marcador de posición de búsqueda y otras etiquetas `themeConfig` de VitePress no se extraen de markdown. Configure **`docsOutput.vitepressThemeCatalog`** para que **`translate-docs`** arranque el catálogo en inglés desde `.vitepress/config.mts` (cuando las cadenas están en línea) y traduzca los archivos JSON del tema de la configuración regional:

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

- **`catalogPath`** — JSON anidado en inglés generado (salida de arranque). Los autores no mantienen este archivo manualmente cuando el inglés reside en `config.mts`; vuelva a ejecutar `sync` para actualizarlo.
- **`outputPathTemplate`** (opcional) — salidas por configuración regional; predeterminado: el mismo directorio que `catalogPath` con `theme.{locale}.json`.

`init -t ui-vitepress` también genera `docs/.vitepress/config.mts` y `docs/.vitepress/i18n/theme.en.json` iniciales cuando esos archivos aún no existen. La configuración carga el catálogo a través de `loadTheme()` y conecta las etiquetas i18n estándar de VitePress (incluido `langMenuLabel`) en `themeConfigFor()`.

Cargue el archivo por configuración regional en `.vitepress/config.mts` a través de `loadTheme()` y compile `locales[code].themeConfig` a partir del JSON traducido. Consulte [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**Cadenas del menú de idioma:** `locales[code].label` es el nombre visible de cada idioma en el menú desplegable (por ejemplo, `Português (Brasil)`). `themeConfig.langMenuLabel` es la **aria-label** en el botón de cambio de idioma (predeterminado de VitePress: `Change language`). Coloque `langMenuLabel` en el catálogo de temas y conecte `langMenuLabel: t.langMenuLabel` dentro de `themeConfigFor()`; no lo confunda con las cadenas `label` por configuración regional.

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

```markdown
Refactor our VitePress config to load theme strings from generated JSON files instead of hardcoded literals.

Context:
- ai-i18n-tools already generated English and locale theme catalogs via `docsOutput.vitepressThemeCatalog`.
- English catalog: `docs/.vitepress/i18n/theme.en.json`
- Locale catalogs: `docs/.vitepress/i18n/theme.{locale}.json` (e.g. pt-BR, zh-Hans)
- Target file: `docs/.vitepress/config.mts` (or our project's equivalent path)
- Reference pattern: https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/docs/.vitepress/config.mts

Requirements:
1. Add `loadTheme(localeFile: string)` that reads JSON from `docs/.vitepress/i18n/` (use `import.meta.url` / `fileURLToPath` for ESM paths).
2. Add `themeConfigFor(t)` that builds VitePress `themeConfig` from the catalog — keep all **links and structure** in TypeScript; only **display strings** come from JSON keys matching `theme.en.json`.
3. Wire `locales.root` and each target locale in `locales[code]` to `loadTheme('theme.en.json')` or `loadTheme('theme.{code}.json')`, then `themeConfig: themeConfigFor(theme)`.
4. Align locale codes with `ai-i18n-tools.config.json` `targetLocales` and existing VitePress `locales` keys.
5. Do **not** change markdown content paths, `base`, or link targets — only move translatable labels out of inline string literals.
6. Preserve any project-specific options (ignoreDeadLinks, head config, etc.).

After editing:
- Run `pnpm docs:dev` (or our docs dev script) and confirm English + at least one translated locale show correct nav/sidebar/footer/search placeholder.
- If a string exists in config but not in `theme.en.json`, add a matching key to the JSON shape in `themeConfigFor` and note that the user should re-run `i18n:sync` to refresh catalogs from config if needed.

Do not introduce a hand-maintained duplicate of theme strings — config must read from the generated JSON files only.
```

<a id="example-project"></a>
## Proyecto de ejemplo

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — Fuentes en inglés en `docs/`, árboles de páginas `pt-BR` y `zh-Hans` confirmados, además de `theme.pt-BR.json` / `theme.zh-Hans.json`. Ejecute `pnpm run docs:dev` en el puerto 3060.

<a id="readme-and-the-docs-homepage"></a>
## README y la página de inicio de la documentación

Los proyectos descendentes a veces copian `README.md` en el sitio de VitePress como `docs/index.md` (a través de un script de compilación o sincronización manual). Ese patrón comparte un archivo entre GitHub y el sitio de documentación, pero las reglas de enlace difieren:

| Tipo de enlace | Funciona en GitHub | Funciona en VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Sí | No — use rutas del sitio o deje que el normalizador reescriba durante la sincronización |
| `./LICENSE`, `examples/demo/` | Sí (relativo al repositorio) | No — use **URL completas** |
| `/guide/foo` | No | Sí |

**Recomendación para README sincronizado → índice:** En `README.md`, use **URL completas** para cualquier cosa fuera del árbol de contenido de VitePress (`LICENSE`, `examples/`, archivos de configuración, archivos de contexto del agente) y para copias traducidas de README en `translated-docs/`. Use rutas `docs/guide/…` (o rutas del sitio en documentos en inglés en `docs/`) para enlaces de documentación dentro del sitio; un script de sincronización o el normalizador `rewriteVitepressLinks` puede convertirlos a rutas `/guide/…`.

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

Habilite el normalizador incorporado para que `translate-docs` corrija los enlaces en cada archivo traducido automáticamente:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` está habilitado por defecto cuando `style` es `"vitepress"`.

| Autor en la fuente en inglés | Después del normalizador (salida raíz en inglés) | Después del normalizador (salida `docs/<locale>/` traducida) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/es/guide/json)` | `[JSON](/es/guide/json)` | `[JSON](/pt-BR/guide/json)` (el prefijo de la configuración regional coincide con la carpeta) |
| `[Quick start](/es/guide/quick-start)` en el cuerpo o `hero.actions[].link` | sin cambios (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| `[Home](./README.md)` en el índice de la configuración regional | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | sin cambios | sin cambios (recurso `docs/public/` compartido) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | sin cambios (URL completa) | sin cambios (URL completa) |

Las fuentes raíz en inglés bajo `docs/` mantienen rutas de sitio **neutrales en cuanto a la configuración regional** (`/guide/…`). Los archivos escritos en `docs/<locale>/…` obtienen automáticamente el prefijo de configuración regional en las rutas de contenido interno, incluida la **información de diseño de la página de inicio** (`hero.actions[].link`, `features[].link`, `prev`/`next`). Los recursos públicos compartidos, como `/ai-i18n-tools_logo.svg` y `/translation-dashboard.png`, permanecen sin prefijo en cada configuración regional.

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

Prefije **`activeMatch`** junto con **`link`** para que el resaltado de navegación funcione en las rutas de configuración regional (`/pt-BR/guide/` no `/guide/`). Las URL externas y los activos públicos compartidos permanecen sin cambios.

Añada `ai-i18n-tools` como **devDependency** en el proyecto VitePress (consulte `examples/vitepress-docs/package.json`) para que `config.mts` pueda importar `prefixVitepressThemeConfigLinks`. El sitio de documentación principal de ai-i18n-tools importa directamente desde `src/processors/…` porque utiliza el monorepo; las copias independientes (degit) deben usar el paquete npm.

**Reglas de autoría**

- Enlaces de documentos entre páginas: use **rutas del sitio** (`/guide/…`, `/reference/…`) en markdown en inglés bajo `docs/`, o rutas `docs/guide/…` al crear un README que se sincronizará con `docs/index.md` en otro proyecto.
- Demos ejecutables, `LICENSE` y otros archivos del repositorio: use **URL completas de GitHub** en `README.md` y en la documentación (consulte [README y la página de inicio de la documentación](#readme-as-the-docs-homepage)).
- **No** edite manualmente los enlaces en `docs/<locale>/` — regenere con `sync` / `translate-docs`.

Consulte también [Reescritura de enlaces](/es/guide/images-and-screenshots/link-rewriting) (plano vs VitePress) y [Configuración — `docsOutput`](/es/reference/configuration#docsoutput).
