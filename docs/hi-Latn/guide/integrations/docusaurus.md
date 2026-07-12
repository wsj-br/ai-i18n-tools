<a id="docusaurus-integration"></a>
# Docusaurus integration

Docusaurus [Docusaurus](https://docusaurus.io/) documentation sites ke liye `init -t ui-docusaurus` aur `docsOutput.style: "docusaurus"` ka upyog karein. Preset `docs[]` block ko `docusaurusCatalogDir` ke saath scaffold karta hai taaki `translate-docs` page markdown aur Docusaurus shell JSON dono ko ek hi command mein translate kar sake.

Isko bhi dekhen [Documents](/hi-Latn/guide/documents/), chalne yogya [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) demo, aur [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) ek sanyukt Next.js app ke liye jismein nested Docusaurus docs, flat README, aur SVG assets hain.

<a id="quick-start"></a>
## Quick start

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # or: cd examples/docusaurus-docs && pnpm build
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

Ek `docs[]` block ko configure karein:

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

<a id="example-project"></a>
## Example project

[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — English sources `docs/` par, committed translations `i18n/<locale>/docusaurus-plugin-content-docs/current/` ke antargat, aur anuvadit shell JSON. Locale dropdown kaam kare iske liye port 3100 par `pnpm start` (build + serve) chalayen; English-only hot reload ke liye `pnpm dev` ka upyog karen.

UI strings, SVG translation, aur ek hi repository layout mein flat README ke liye, [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (nested `docs-site/` port 3040 par) dekhen.
