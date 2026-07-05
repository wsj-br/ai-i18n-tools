<a id="docusaurus-integration"></a>
# Integración con Docusaurus

Utilice `init -t ui-docusaurus` y `docsOutput.style: "docusaurus"` para sitios de documentación de [Docusaurus](https://docusaurus.io/). El preset crea un bloque `docs[]` con `docusaurusCatalogDir` para que `translate-docs` pueda traducir tanto las páginas de markdown como el shell JSON de Docusaurus en un solo comando.

Véase también [Documentos](/guide/documents/), la demo ejecutable [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (aplicación Next.js más `docs-site/` anidado) y [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) para un recorrido centrado solo en Docusaurus.

<a id="quick-start"></a>
## Comienzo rápido

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # Docusaurus build (project-specific script)
```

Active `features.translateDocs` y establezca `docs[].docusaurusCatalogDir` cuando traduzca tanto las páginas de documentación como el shell del sitio (barra de navegación, pie de página, cadenas de tema). Ejecute `docusaurus write-translations` en su proyecto Docusaurus cuando actualice `@docusaurus/*` o cambie las etiquetas de la barra de navegación/pie de página/tema — luego vuelva a ejecutar `translate-docs` o `sync` para que el shell JSON se traduzca en cada carpeta de idioma.

<a id="page-layout"></a>
## Diseño de página

El markdown y MDX en inglés se encuentran bajo la carpeta `docs/` de su Docusaurus (por ejemplo `docs-site/docs/`). Las copias traducidas se escriben en el árbol de contenido del plugin de cada idioma:

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

Configure un bloque `docs[]`:

```json
{
  "contentPaths": ["docs-site/docs/"],
  "outputDir": "docs-site/i18n",
  "docusaurusCatalogDir": "docs-site/i18n/en",
  "addFrontmatter": true,
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "docs-site/docs"
  }
}
```

Apunte `contentPaths` a sus archivos y directorios `.md` / `.mdx` en inglés. Establezca `docsRoot` en la misma carpeta que Docusaurus utiliza como raíz de contenido. Establezca `outputDir` en la carpeta principal de cada carpeta de idioma bajo `i18n/`.

Conecte la internacionalización de Docusaurus [internacionalización](https://docusaurus.io/docs/i18n/introduction): mantenga `targetLocales` en `ai-i18n-tools.config.json` alineado con la matriz `locales` en `docusaurus.config.js`. Cada `localeConfigs[locale].path` debe coincidir con el nombre de la carpeta bajo `i18n/` (por ejemplo `path: "fr"` para `i18n/fr/`).

<a id="shell-strings-write-translations"></a>
## Cadenas del shell (write-translations)

Las etiquetas de la barra de navegación, pie de página, marcador de búsqueda y otros plugins de tema de Docusaurus no se extraen del markdown. Ejecute `docusaurus write-translations` en su proyecto Docusaurus para generar catálogos JSON bajo la carpeta de idioma predeterminada (normalmente `i18n/en/`). Luego apunte `docs[].docusaurusCatalogDir` a esa carpeta:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus pages + shell JSON",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

Cuando `docusaurusCatalogDir` esté establecido y `features.translateDocs` esté habilitado, `translate-docs` traduce ambos:

- **Páginas de documentación** — markdown/MDX desde `contentPaths` hasta `i18n/<locale>/docusaurus-plugin-content-docs/current/`
- **Shell JSON** — catálogos de barra de navegación, pie de página y plugin de tema desde `i18n/en/` hasta las carpetas de idioma hermanas

No coloque el shell JSON de Docusaurus en `json[]`; use `docs[].docusaurusCatalogDir` con Documentos en su lugar.

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus vs VitePress shell JSON

| Marco | Cadenas del shell / tema | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | Catálogo `write-translations` (`{ message, description }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Catálogo JSON anidado personalizado que usted escribe | JSON — `json[]` + `translate-json` (o `sync` cuando `translateJson` está activado) |

Consulte [Integración con VitePress](/guide/vitepress-integration) para el patrón de VitePress.

<a id="example-project"></a>
## Proyecto de ejemplo

[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — Fuentes en inglés en `docs/`, traducciones confirmadas bajo `i18n/<locale>/docusaurus-plugin-content-docs/current/`, más shell JSON traducido. Ejecute `pnpm start` en el puerto 3040 para el desarrollo; use `pnpm run start:fr` (y similares) para previsualizar un solo idioma en modo de desarrollo.
