<a id="docusaurus-integration"></a>
# Docusaurus integration

Use `init -t ui-docusaurus` and `docsOutput.style: "docusaurus"` for [Docusaurus](https://docusaurus.io/) documentation sites. The preset scaffolds a `docs[]` block with `docusaurusCatalogDir` so `translate-docs` can translate both page markdown and Docusaurus shell JSON in one command.

See also [Documents](/guide/documents/), the runnable [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) demo (Next.js app plus nested `docs-site/`), and [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) for a focused Docusaurus-only walkthrough.

<a id="quick-start"></a>
## Quick start

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # Docusaurus build (project-specific script)
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

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus vs VitePress shell JSON

| Framework | Shell / theme strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` catalog (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Custom nested JSON catalog you author | JSON — `json[]` + `translate-json` (or `sync` when `translateJson` is on) |

See [VitePress integration](/guide/vitepress-integration) for the VitePress pattern.

<a id="example-project"></a>
## Example project

[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — English sources at `docs/`, committed translations under `i18n/<locale>/docusaurus-plugin-content-docs/current/`, plus translated shell JSON. Run `pnpm start` on port 3040 for development; use `pnpm run start:fr` (and similar) to preview a single locale in dev mode.
