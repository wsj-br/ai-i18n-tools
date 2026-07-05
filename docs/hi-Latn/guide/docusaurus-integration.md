<a id="docusaurus-integration"></a>
# Docusaurus integration

Docusaurus [Docusaurus](https://docusaurus.io/) documentation sites ke liye `init -t ui-docusaurus` aur `docsOutput.style: "docusaurus"` ka upyog karein. Preset `docs[]` block ko `docusaurusCatalogDir` ke saath scaffold karta hai taaki `translate-docs` page markdown aur Docusaurus shell JSON dono ko ek hi command mein translate kar sake.

Isko bhi dekhen [Documents](/guide/documents/), chalne yogya [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) demo (Next.js app aur nested `docs-site/`), aur [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) ek focused Docusaurus-only walkthrough ke liye.

<a id="quick-start"></a>
## Turant shuru karein

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # Docusaurus build (project-specific script)
```

`features.translateDocs` ko enable karein aur `docs[].docusaurusCatalogDir` set karein jab aap documentation pages aur site chrome (navbar, footer, theme strings) dono ko translate karte hain. Jab aap `@docusaurus/*` ko upgrade karte hain ya navbar/footer/theme labels badalte hain, to apne Docusaurus project mein `docusaurus write-translations` chalayein — phir `translate-docs` ya `sync` ko phir se chalayein taaki shell JSON har locale folder mein translate ho sake.

<a id="page-layout"></a>
## Page layout

English markdown aur MDX aapke Docusaurus `docs/` folder ke andar rehte hain (jaise `docs-site/docs/`). Translated copies har locale ke plugin content tree mein likhe jaate hain:

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

Ek `docs[]` block configure karein:

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

`contentPaths` ko apne English `.md` / `.mdx` files aur directories par point karein. `docsRoot` ko usi folder par set karein jise Docusaurus apne content root ke roop mein upyog karta hai. `outputDir` ko `i18n/` ke neeche har locale folder ke parent par set karein.

Docusaurus [internationalization](https://docusaurus.io/docs/i18n/introduction) ko wire karein: `ai-i18n-tools.config.json` mein `targetLocales` ko `docusaurus.config.js` mein `locales` array ke saath align rakhein. Har `localeConfigs[locale].path` ko `i18n/` ke neeche folder name se match karna chahiye (jaise `i18n/fr/` ke liye `path: "fr"`).

<a id="shell-strings-write-translations"></a>
## Shell strings (write-translations)

Docusaurus navbar, footer, search placeholder, aur anya theme/plugin labels markdown se extract nahi kiye jaate hain. Default locale folder (aam taur par `i18n/en/`) ke neeche JSON catalogs generate karne ke liye apne Docusaurus project mein `docusaurus write-translations` chalayein. Phir `docs[].docusaurusCatalogDir` ko us folder par point karein:

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

Jab `docusaurusCatalogDir` set hota hai aur `features.translateDocs` enable hota hai, to `translate-docs` dono ko translate karta hai:

- **Documentation pages** — `contentPaths` se `i18n/<locale>/docusaurus-plugin-content-docs/current/` mein markdown/MDX
- **Shell JSON** — `i18n/en/` se sibling locale folders mein navbar, footer, aur theme/plugin catalogues

Docusaurus shell JSON ko `json[]` mein na rakhein; iske bajaye Documents ke saath `docs[].docusaurusCatalogDir` ka upyog karein.

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus vs VitePress shell JSON

| Framework | Shell / theme strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` catalog (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Custom nested JSON catalog jo aap author karte hain | JSON — `json[]` + `translate-json` (ya `translateJson` on hone par `sync`) |

VitePress pattern ke liye [VitePress integration](/guide/vitepress-integration) dekhein.

<a id="example-project"></a>
## Example project

[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — `docs/` par English sources, `i18n/<locale>/docusaurus-plugin-content-docs/current/` ke neeche committed translations, plus translated shell JSON. Development ke liye port 3040 par `pnpm start` chalayein; dev mode mein ek single locale ka preview karne ke liye `pnpm run start:fr` (aur iske samaan) ka upyog karein.
