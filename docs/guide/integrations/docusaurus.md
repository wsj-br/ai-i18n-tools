<a id="docusaurus-integration"></a>
# Docusaurus integration

Use `init -t ui-docusaurus` and `docsOutput.style: "docusaurus"` for [Docusaurus](https://docusaurus.io/) documentation sites. The preset scaffolds a `docs[]` block with `docusaurusCatalogDir` so `translate-docs` can translate both page markdown and Docusaurus shell JSON in one command.

See also [Documents](/guide/documents/), the runnable [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) demo, and [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) for a combined Next.js app with nested Docusaurus docs, flat README, and SVG assets.

<a id="quick-start"></a>
## Quick start

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # or: cd examples/docusaurus-docs && pnpm build
```

Enable `features.translateDocs` and set `docs[].docusaurusCatalogDir` when you translate both documentation pages and site chrome (navbar, footer, theme strings). Run `docusaurus write-translations` in your Docusaurus project when you upgrade `@docusaurus/*` or change navbar/footer/theme labels — then re-run `translate-docs` or `sync` so shell JSON is translated into each locale folder.

<a id="page-layout"></a>
## Page layout

English markdown and MDX live under your Docusaurus `docs/` folder (for example `docs-site/docs/`). Translated copies are written into each locale's plugin content tree:

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

Configure one `docs[]` block:

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

Point `contentPaths` at your English `.md` / `.mdx` files and directories. Set `docsRoot` to the same folder Docusaurus uses as its content root. Set `outputDir` to the parent of each locale folder under `i18n/`.

Wire Docusaurus [internationalization](https://docusaurus.io/docs/i18n/introduction): keep `targetLocales` in `ai-i18n-tools.config.json` aligned with the `locales` array in `docusaurus.config.js`. Each `localeConfigs[locale].path` must match the folder name under `i18n/` (for example `path: "fr"` for `i18n/fr/`).

<a id="shell-strings-write-translations"></a>
## Shell strings (write-translations)

Docusaurus navbar, footer, search placeholder, and other theme/plugin labels are not extracted from markdown. Run `docusaurus write-translations` in your Docusaurus project to generate JSON catalogs under the default locale folder (typically `i18n/en/`). Then point `docs[].docusaurusCatalogDir` at that folder:

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

When `docusaurusCatalogDir` is set and `features.translateDocs` is enabled, `translate-docs` translates both:

- **Documentation pages** — markdown/MDX from `contentPaths` into `i18n/<locale>/docusaurus-plugin-content-docs/current/`
- **Shell JSON** — navbar, footer, and theme/plugin catalogues from `i18n/en/` into sibling locale folders

Do not put Docusaurus shell JSON in `json[]`; use `docs[].docusaurusCatalogDir` with Documents instead.

<a id="framework-shell-translation"></a>
## Framework shell translation

| Framework | Shell / theme strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` catalog (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Theme/nav/sidebar catalog | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` sidebar labels | Documents — auto when `style: "nextra"` + `translate-docs` |
| Nextra | Theme dictionary `.ts` | Documents — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` sidebar labels | Documents — auto when `style: "fumadocs"` + `translate-docs` |
| Fumadocs | UI overrides catalog | Documents — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Built-in UI strings (many locales); no additional shell pipeline | Documents — `translate-docs` (pages only) |

Do **not** put framework shell/theme strings in `json[]` — that pipeline is for unrelated app locale bundles. See [VitePress integration](/guide/integrations/vitepress), [Nextra integration](/guide/integrations/nextra), and [Fumadocs integration](/guide/integrations/fumadocs) for the other framework patterns.

<a id="example-project"></a>
## Example project

[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — English sources at `docs/`, committed translations under `i18n/<locale>/docusaurus-plugin-content-docs/current/`, plus translated shell JSON. Run `pnpm start` on port 3100 (build + serve) so the locale dropdown works; use `pnpm dev` for English-only hot reload.

For UI strings, SVG translation, and a flat README in the same repository layout, see [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (nested `docs-site/` on port 3040).
