<a id="vitepress-integration"></a>
# Integración con VitePress

Utilice `init -t ui-vitepress` y `docsOutput.style: "vitepress"` para sitios de documentación de [VitePress](https://vitepress.dev/). El preajuste es un alias para `doc-system` con un `localeSubpath` vacío y los nombres de las carpetas de configuración regional BCP-47 conservados (`localePathLowercase` por defecto es `false`, por lo que las carpetas permanecen `pt-BR`, `zh-Hans`, etc.).

Consulte también [Documentos](/guide/documents/), [JSON](/guide/json) (cadenas de tema) y la demostración ejecutable [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). La documentación de este repositorio en `docs/` es una referencia completa de VitePress + ai-i18n-tools (nueve configuraciones regionales, JSON de tema, GitHub Pages).

<a id="quick-start"></a>
## Comienzo rápido

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Habilite tanto `features.translateDocs` como `features.translateJson` cuando traduzca el contenido de la página y las cadenas de interfaz de VitePress en una sola ejecución de `sync`.

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

Los etiquetas de navegación de VitePress, barra lateral, pie de página, marcador de posición de búsqueda y otros `themeConfig` no se extraen de markdown. Cree un catálogo JSON anidado (por ejemplo `docs/.vitepress/i18n/theme.en.json`) y tradúzcalo con JSON:

```json
{
  "features": {
    "translateJson": true
  },
  "json": [
    {
      "description": "VitePress theme/nav/sidebar strings",
      "contentPaths": "docs/.vitepress/i18n/theme.en.json",
      "outputPathTemplate": "docs/.vitepress/i18n/theme.{locale}.json"
    }
  ]
}
```

Cargue el archivo por configuración regional en `.vitepress/config.mts` y cree `locales[code].themeConfig` a partir del JSON traducido (texto de navegación, títulos de grupos de la barra lateral, mensaje de pie de página, etc.). No codifique etiquetas traducidas en `config.mts`; regenérelas con `sync` / `translate-json` cuando el inglés cambie.

Este paquete carga `theme.{locale}.json` en [docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/.vitepress/config.mts); compare con [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) para una configuración mínima de dos configuraciones regionales.

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus vs VitePress shell JSON

| Marco | Cadenas del shell / tema | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo JSON anidado personalizado que usted escribe | JSON — `json[]` + `translate-json` (o `sync` cuando `translateJson` está activado) |

No coloque el JSON del tema de VitePress en `docs[]`; use `json[]` en su lugar.

<a id="example-project"></a>
## Proyecto de ejemplo

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — Fuentes en inglés en `docs/`, árboles de páginas `pt-BR` y `zh-Hans` confirmados, más `theme.pt-BR.json` / `theme.zh-Hans.json`. Ejecute `pnpm run docs:dev` en el puerto 3060.

<a id="readme-as-homepage"></a>
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
