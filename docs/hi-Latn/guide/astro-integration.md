<a id="astro-integration"></a>
# Astro integration

ai-i18n-tools ko [Astro](https://astro.build/) ke saath do common setups mein use karein: **Astro Starlight** documentation sites aur **plain Astro** marketing ya app sites. Dono page content ke liye Documents (`translate-docs`) ka use karte hain; plain Astro sites aksar frontmatter aur shared data mein `t()` strings ke liye UI strings (`extract` / `translate-ui`) ke saath combine karte hain.

Ise bhi dekhen [UI strings](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight), [Documents](/guide/documents/), aur neeche diye gaye chalne yogya udaharan.

<a id="astro-starlight"></a>
## Astro Starlight

[Astro Starlight](https://starlight.astro.build/) documentation sites ke liye `init -t ui-starlight` aur `docsOutput.style: "astro-starlight"` ka use karein. Preset ek empty `localeSubpath` ke saath `doc-system` ke liye ek alias hai — translated pages English source tree ke bagal mein `src/content/docs/<locale>/` ke neeche aate hain.

<a id="quick-start"></a>
### Quick start

```bash
npx ai-i18n-tools init -t ui-starlight
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### Page layout

English markdown aur MDX Starlight content root (aam taur par `src/content/docs/`) par hote hain. Translated copies source tree ke bagal mein likhe jaate hain:

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

Ek `docs[]` block configure karein:

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

`contentPaths` ko apni English `.md` / `.mdx` files aur directories par point karein. `docsRoot` ko usi folder par set karein jise Starlight apne content root ke roop mein use karta hai.

Starlight UI overrides ko zaroorat padne par ek alag `docs[]` block mein `src/content/i18n/en.json` ke saath `jsonPathTemplate` ka upyog kar sakte hain — dekhen [Documents — documentation ke liye initialise karen](/guide/documents/#step-1-initialise-for-documentation).

<a id="framework-shell-translation"></a>
### Framework shell anuvaad

Starlight kai locales ke liye apni khud ki built-in UI string bhejta hai (nav label, search placeholder, vishay-suchi, aadi) — Docusaurus, VitePress, ya Nextra ke vipreet, configure karne ke liye koi alag shell/theme pipeline nahi hai:

| Framework | Shell / theme strings | Pipeline |
|-----------|----------------------|----------|
| Astro Starlight | Built-in UI strings (kai locales); koi atirikt shell pipeline nahi | Documents — `translate-docs` (keval page) |
| Docusaurus | `write-translations` catalog (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Theme/nav/sidebar catalog | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` sidebar label + theme dictionary `.ts` | Documents — [Nextra integration](/guide/nextra-integration) dekhen |
| Fumadocs | `meta.json` sidebar labels + UI overrides catalog | Documents — dekhiye [Fumadocs integration](/guide/fumadocs-integration) |

Dusre framework patterns ke liye [Docusaurus integration](/guide/docusaurus-integration), [VitePress integration](/guide/vitepress-integration), [Nextra integration](/guide/nextra-integration), aur [Fumadocs integration](/guide/fumadocs-integration) dekhen.

<a id="example-project"></a>
### Example project

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — English sources `src/content/docs/` par, committed translations `src/content/docs/<locale>/` ke neeche, RTL locale (`ar`), aur glossary-driven translation. Port 3050 par `pnpm dev` run karein.

<a id="plain-astro-marketing-and-app-sites"></a>
## Plain Astro (marketing aur app sites)

Static Astro marketing ya app sites (Starlight nahi) ke liye, [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) ko ai-i18n-tools ke saath combine karein. Reference implementation [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) hai: English `/` par, target locales `/{locale}/` par.

Zyadatar teams ek hi page par do pipelines ka **hybrid** use karti hain:

| Pipeline | Iske liye upyog karein | Commands | Output |
|----------|---------|----------|--------|
| **Page HTML** | Headings, paragraphs, nav labels, template body mein inline arrays | `translate-docs` | `src/pages/{locale}/index.astro` har locale ke liye |
| **UI strings (`t()`)** | Frontmatter data, tab labels, shared arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (key ke roop mein English source) |

<a id="quick-start-1"></a>
### Quick start

```bash
npx ai-i18n-tools init -t ui-astro-website
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

`init -t ui-astro-website` ke saath UI extraction scaffold karein, phir ek `docs[]` block mein merge karein jab aap page HTML ko bhi translate karte hain:

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

Jab aap koi language add ya remove karte hain to teen lists ko align rakhein: `targetLocales` mein `ai-i18n-tools.config.json`, `i18n.locales` mein `astro.config.mjs` (Astro **lowercase** route codes jaise `pt-br` ka use karta hai), aur `ui-languages.json` (`generate-ui-languages` ke madhyam se). Flat bundle **filenames** config casing (`pt-BR.json`) ka use karte hain; Astro ke `pt-br` route ko apni manifest `code` field ke madhyam se us file par map karein.

`t('…')` ko **build time** par English source literal ko key ke roop mein dekhkar resolve karein — dekhein `examples/astro-website/src/i18n/t.ts`. Aapko static site ke liye `ai-i18n-tools/runtime` ya i18next ki zaroorat nahi hai jab tak ki aap client islands add na karein jo load hone ke baad language switch karte hain.

<a id="example-project-1"></a>
### Example project

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — `translate-docs` ke madhyam se HTML aur `t()` + `translate-ui` ke madhyam se screenshot tab labels ke saath hybrid landing page.

<a id="example-projects"></a>
## Udaharan project

| Project | Upyog ka mamla | Port |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Starlight documentation | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | Sadharan Astro marketing site (HTML + `t()` hybrid) | (README dekhen) |

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) ki [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) se tulna karen — saman tutorial content, Starlight ke bajaye Docusaurus output style.
