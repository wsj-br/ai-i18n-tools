<a id="astro-integration"></a>
# Integración de Astro

Utilice ai-i18n-tools con [Astro](https://astro.build/) en dos configuraciones comunes: sitios de documentación de **Astro Starlight** y sitios de marketing o aplicaciones de **Astro simple**. Ambos utilizan Documentos (`translate-docs`) para el contenido de la página; los sitios de Astro simple a menudo combinan eso con cadenas de interfaz de usuario (`extract` / `translate-ui`) para cadenas `t()` en el frontmatter y datos compartidos.

Véase también [cadenas de interfaz de usuario](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight), [Documentos](/guide/documents/) y los ejemplos ejecutables a continuación.

<a id="astro-starlight"></a>
## Astro Starlight

Utilice `init -t ui-starlight` y `docsOutput.style: "astro-starlight"` para sitios de documentación de [Astro Starlight](https://starlight.astro.build/). El preajuste es un alias para `doc-system` con un `localeSubpath` vacío; las páginas traducidas se ubican en `src/content/docs/<locale>/` junto al árbol de origen en inglés.

<a id="quick-start"></a>
### Inicio rápido

```bash
npx ai-i18n-tools init -t ui-starlight
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### Diseño de página

El markdown y MDX en inglés se encuentran en la raíz del contenido de Starlight (normalmente `src/content/docs/`). Las copias traducidas se escriben junto al árbol de origen:

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

Configure un bloque `docs[]`:

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

Apunte `contentPaths` a sus archivos y directorios `.md` / `.mdx` en inglés. Establezca `docsRoot` en la misma carpeta que Starlight usa como raíz de contenido.

Las anulaciones de la interfaz de usuario de Starlight pueden usar `src/content/i18n/en.json` con `jsonPathTemplate` en un bloque `docs[]` separado cuando sea necesario; consulte [Documentos — inicializar para la documentación](/guide/documents/#step-1-initialise-for-documentation).

<a id="framework-shell-translation"></a>
### Traducción del shell del framework

Starlight incluye sus propias cadenas de interfaz de usuario integradas para muchas configuraciones regionales (etiquetas de navegación, marcador de posición de búsqueda, tabla de contenido, etc.). No hay una canalización de shell/tema separada para configurar, a diferencia de Docusaurus, VitePress o Nextra:

| Framework | Cadenas de shell/tema | Canalización |
|-----------|----------------------|----------|
| Astro Starlight | Cadenas de interfaz de usuario integradas (muchas configuraciones regionales); sin canalización de shell adicional | Documentos — `translate-docs` (solo páginas) |
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo de temas/navegación/barra lateral | Documentos — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | Etiquetas de la barra lateral `_meta.ts` + diccionario de temas `.ts` | Documentos — ver [integración de Nextra](/guide/nextra-integration) |
| Fumadocs | Etiquetas de la barra lateral + catálogo de anulaciones de la interfaz de usuario `meta.json` | Documentos — véase [integración de Fumadocs](/guide/fumadocs-integration) |

Véase [integración de Docusaurus](/guide/docusaurus-integration), [integración de VitePress](/guide/vitepress-integration), [integración de Nextra](/guide/nextra-integration) e [integración de Fumadocs](/guide/fumadocs-integration) para ver los otros patrones de framework.

<a id="example-project"></a>
### Proyecto de ejemplo

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — Fuentes en inglés en `src/content/docs/`, traducciones confirmadas en `src/content/docs/<locale>/`, configuración regional RTL (`ar`) y traducción basada en glosario. Ejecute `pnpm dev` en el puerto 3050.

<a id="plain-astro-marketing-and-app-sites"></a>
## Astro simple (sitios de marketing y aplicaciones)

Para sitios estáticos de marketing o aplicaciones de Astro (no Starlight), combine el [enrutamiento i18n integrado de Astro](https://docs.astro.build/en/guides/internationalization/) con ai-i18n-tools. La implementación de referencia es [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website): inglés en `/`, configuraciones regionales de destino en `/{locale}/`.

La mayoría de los equipos utilizan un **híbrido** de dos pipelines en la misma página:

| Canalización | Uso para | Comandos | Salida |
|----------|---------|----------|--------|
| **HTML de página** | Encabezados, párrafos, etiquetas de navegación, matrices en línea en el cuerpo de la plantilla | `translate-docs` | `src/pages/{locale}/index.astro` por configuración regional |
| **Cadenas de interfaz (`t()`)** | Datos de frontmatter, etiquetas de pestañas, arrays compartidos | `extract` → `translate-ui` | `public/locales/{locale}.json` (inglés como clave fuente) |

<a id="quick-start-1"></a>
### Inicio rápido

```bash
npx ai-i18n-tools init -t ui-astro-website
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

Prepare la extracción de la interfaz de usuario con `init -t ui-astro-website`, luego fusione en un bloque `docs[]` cuando también traduzca el HTML de la página:

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Mantenga tres listas alineadas cuando agregue o elimine un idioma: `targetLocales` en `ai-i18n-tools.config.json`, `i18n.locales` en `astro.config.mjs` (Astro usa códigos de ruta en **minúsculas** como `pt-br`) y `ui-languages.json` (a través de `generate-ui-languages`). Los **nombres de archivo** del paquete plano usan la configuración de mayúsculas y minúsculas (`pt-BR.json`); asigne la ruta `pt-br` de Astro a ese archivo a través de su campo de manifiesto `code`.

Resuelva `t('…')` en el **tiempo de compilación** buscando el literal de origen en inglés como clave; consulte `examples/astro-website/src/i18n/t.ts`. No necesita `ai-i18n-tools/runtime` ni i18next para un sitio estático a menos que agregue islas de cliente que cambien de idioma después de la carga.

<a id="example-project-1"></a>
### Proyecto de ejemplo

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — página de aterrizaje híbrida con HTML a través de `translate-docs` y etiquetas de pestañas de captura de pantalla a través de `t()` + `translate-ui`.

<a id="example-projects"></a>
## Proyectos de ejemplo

| Proyecto | Caso de uso | Puerto |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Documentación de Starlight | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | Sitio de marketing de Astro simple (HTML + híbrido `t()`) | (ver README) |

Compare [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) con [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — contenido de tutorial similar, estilo de salida de Docusaurus en lugar de Starlight.
