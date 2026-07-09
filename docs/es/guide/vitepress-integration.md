<a id="vitepress-integration"></a>
# Integración con VitePress

Utilice `init -t ui-vitepress` y `docsOutput.style: "vitepress"` para sitios de documentación de [VitePress](https://vitepress.dev/). El preajuste es un alias para `doc-system` con un `localeSubpath` vacío y los nombres de las carpetas de configuración regional BCP-47 conservados (`localePathLowercase` por defecto es `false`, por lo que las carpetas permanecen `pt-BR`, `zh-Hans`, etc.).

Consulte también [Documentos](/guide/documents/) y la demostración ejecutable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). El propio sitio de documentación de este repositorio en `docs/` es una referencia completa de VitePress + ai-i18n-tools (nueve idiomas, catálogo de temas, GitHub Pages).

<a id="quick-start"></a>
## Comienzo rápido

```bash
npx ai-i18n-tools init -t ui-vitepress
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

Apunte `contentPaths` a sus archivos y directorios `.md` en inglés. Establezca `docsRoot` en la misma carpeta que VitePress utiliza como su raíz de contenido.

Configure la [internacionalización](https://vitepress.dev/guide/i18n) de VitePress: inglés en `root`, cada configuración regional de destino en `locales[code].link` (por ejemplo, `/pt-BR/`). Mantenga `targetLocales` en `ai-i18n-tools.config.json` alineado con las claves `locales` en `.vitepress/config.mts`.

<a id="theme-strings"></a>
## Cadenas de tema

La navegación, la barra lateral, el pie de página, el marcador de posición de búsqueda y otras etiquetas de `themeConfig` de VitePress no se extraen de Markdown. Configure **`docsOutput.vitepressThemeCatalog`** para que **`translate-docs`** inicialice el catálogo en inglés desde `.vitepress/config.mts` (cuando las cadenas están en línea) y traduzca los archivos JSON del tema de la configuración regional:

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

- **`catalogPath`** — JSON anidado en inglés generado (salida de arranque). Los autores no mantienen este archivo a mano cuando el inglés reside en `config.mts`; vuelva a ejecutar `sync` para actualizarlo.
- **`outputPathTemplate`** (opcional) — salidas por configuración regional; predeterminado: el mismo directorio que `catalogPath` con `theme.{locale}.json`.

Cargue el archivo por configuración regional en `.vitepress/config.mts` a través de `loadTheme()` y compile `locales[code].themeConfig` a partir del JSON traducido. Consulte [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts).

**No** utilice `json[]` para las cadenas de temas de VitePress; ese patrón es solo para paquetes de configuración regional de aplicaciones no relacionados.

<a id="wire-config-mts-to-generated-theme-json"></a>
## Conectar config.mts al JSON del tema generado (una sola vez)

Después de la primera ejecución exitosa de `i18n:sync` / `translate-docs` con `vitepressThemeCatalog`, el repositorio ha generado `theme.en.json` y `theme.{locale}.json`, pero un sitio **existente** aún puede tener cadenas `text:` / `message:` codificadas en `config.mts`. VitePress no utilizará el JSON traducido hasta que la configuración lo cargue a través de `loadTheme()`.

**No está en el ámbito de la herramienta:** codemod automático. Utilice la siguiente instrucción una vez por proyecto (o refactorice manualmente utilizando la configuración de ejemplo).

1. **Cuándo** — después de que la primera sincronización produjo `catalogPath` y los archivos de tema de la configuración regional; antes de esperar la navegación/barra lateral traducida en desarrollo/compilación.
2. **Mantener sin cambios** — enlaces de ruta (`/guide/…`), claves de configuración regional, estructura `defineConfig`, opciones no de cadena (proveedor de búsqueda, indicadores contraídos).
3. **Referencia** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) y la forma generada de `theme.en.json`.
4. **Verificar** — `pnpm docs:dev`, cambiar la configuración regional en la navegación, confirmar que la barra lateral/pie de página/marcador de posición de búsqueda se traducen; `pnpm docs:build` pasa.

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

<a id="framework-shell-translation"></a>
## Traducción del shell del framework

| Marco | Cadenas del shell / tema | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo de temas/navegación/barra lateral | Documentos — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Etiquetas de la barra lateral de `_meta.ts` | Documentos — automático cuando `style: "nextra"` + `translate-docs` |
| Nextra | Diccionario de temas `.ts` | Documentos — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | Etiquetas de barra lateral de `meta.json` | Documentos — auto cuando `style: "fumadocs"` + `translate-docs` |
| Fumadocs | Catálogo de anulaciones de interfaz de usuario | Documentos — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Cadenas de interfaz de usuario integradas (muchas configuraciones regionales); sin canalización de shell adicional | Documentos — `translate-docs` (solo páginas) |

**No** ponga cadenas de shell/tema del framework en `json[]`; esa canalización es para paquetes de configuración regional de aplicaciones no relacionados. Consulte [Integración de Docusaurus](/guide/docusaurus-integration) e [Integración de Nextra](/guide/nextra-integration) para ver los otros patrones del framework.

<a id="example-project"></a>
## Proyecto de ejemplo

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — Fuentes en inglés en `docs/`, árboles de páginas `pt-BR` y `zh-Hans` confirmados, más `theme.pt-BR.json` / `theme.zh-Hans.json`. Ejecute `pnpm run docs:dev` en el puerto 3060.

<a id="readme-as-the-docs-homepage"></a>
## README como página de inicio de la documentación

Algunos proyectos copian `README.md` en el sitio de VitePress como `docs/index.md` (este repositorio usa `scripts/sync-readme-to-docs.mjs` antes de `docs:build`). Ese patrón comparte un archivo entre GitHub y el sitio de documentación, pero las reglas de enlace difieren:

| Tipo de enlace | Funciona en GitHub | Funciona en VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Sí | No — use rutas del sitio o deje que el normalizador reescriba durante la sincronización |
| `./LICENSE`, `examples/demo/` | Sí (relativo al repositorio) | No — use **URL completas** |
| `/guide/foo` | No | Sí |

**Recomendación:** En `README.md`, use **URL completas** para cualquier cosa fuera del árbol de contenido de VitePress (`LICENSE`, `examples/`, archivos de configuración, archivos de contexto de agente) y para copias traducidas de README en `translated-docs/`. Use rutas `docs/guide/…` (o rutas del sitio en documentos en inglés en `docs/`) para enlaces de documentación dentro del sitio; el script de sincronización y el normalizador `rewriteVitepressLinks` los convierten en rutas `/guide/…`.

Ejemplo:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/guide/quick-start)
```

<a id="link-conventions"></a>
## Convenciones de enlaces

VitePress sirve las páginas en inglés desde la raíz del contenido y las copias de los locales desde `docs/<locale>/…`, pero **los enlaces dentro de la página deben usar rutas del sitio** (`/guide/quick-start`, `/reference/configuration`) — no rutas relativas al repositorio como `docs/guide/quick-start.md` o `../guide/quick-start.md`. Esas rutas de estilo README funcionan en GitHub pero se rompen dentro de VitePress (404 en desarrollo y en GitHub Pages).

Habilite el normalizador incorporado para que `translate-docs` corrija los enlaces en cada archivo traducido automáticamente:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` se habilita por defecto cuando `style` es `"vitepress"`.

| Autor en la fuente en inglés | Después del normalizador |
|--------------------------|------------------|
| `[JSON](/guide/json)` | `[JSON](/guide/json)` |
| `[Home](./README.md)` en el índice de locales | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | sin cambios (URL completa) |

**Reglas de autoría**

- Enlaces de documentos entre páginas: use **rutas del sitio** (`/guide/…`, `/reference/…`) en markdown en inglés en `docs/`, o rutas `docs/guide/…` al sincronizar desde `README.md`.
- Demostraciones ejecutables, `LICENSE` y otros archivos del repositorio: use **URL completas de GitHub** en `README.md` y en los documentos (consulte [README como página de inicio de la documentación](#readme-as-homepage)).
- **No** edite manualmente los enlaces en `docs/<locale>/` — regenere con `sync` / `translate-docs`.

Consulte también [Reescritura de enlaces](/guide/images-and-screenshots/link-rewriting) (plano vs VitePress) y [Configuración — `docsOutput`](/reference/configuration#docsoutput).
