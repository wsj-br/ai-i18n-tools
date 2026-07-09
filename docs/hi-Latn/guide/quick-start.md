<a id="quick-start"></a>
# Turant shuru karein

Default `init` template (`ui-markdown`) kewal **UI** extraction aur translation ko enable karta hai. `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, aur `ui-fumadocs` templates **document** translation (`translate-docs`) ko enable karte hain; `ui-vitepress` VitePress theme strings ke liye `docsOutput.vitepressThemeCatalog` ko bhi scaffold karta hai, `ui-nextra` Nextra theme dictionary ke liye `docs[].nextraDictionaryPath` ko scaffold karta hai (sidebar `_meta.ts` automatically collect kiya jata hai), aur `ui-fumadocs` Fumadocs UI overrides ke liye `docsOutput.fumadocsUiCatalog` ko scaffold karta hai (sidebar `meta.json` automatically collect kiya jata hai). `ui-astro-website` template plain Astro apps (jismein `.astro` files shamil hain) ke liye **UI** extraction ko scaffold karta hai; jab aap `.astro` page HTML ke liye `translate-docs` bhi chahte hain to ek `docs[]` block (dekhen [Astro website pages (parse-and-replace)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)) add karen. Reference [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) **dono** pipelines ka upyog karta hai. Jab aap ek command chahte hain jo aapki config ke anusaar extract, UI translation, optional SVG file translation, aur documentation translation ko run karta hai, to `sync` ka upyog karen.

<a id="runnable-examples"></a>
### Chalne yogya udaharan

Nau (9) runnable projects aur fixtures [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) ke antargat hain. [Examples](/examples) catalog dekhen (console app, Next.js + Docusaurus, Astro website, Astro Starlight docs, VitePress docs, Nextra docs, Fumadocs docs, multi-provider comparison, markdown stress test).

**Ek udaharan ko alag se chalaen** (poore monorepo ko clone kiye bina):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
```

`console-app` ko kisi bhi udaharan folder ke naam se badlen. Har udaharan `"ai-i18n-tools": "^1.7.2"` ghoshit karta hai aur npm se CLI install karta hai. Pratyek-udaharan READMEs mein folder ke naam ke saath wahi snippet shamil hai.

**Poore ai-i18n-tools repository se:** yadi aapne poora repo clone kiya hai (sirf degit ke saath ek example folder nahi), to repository root se `pnpm install` chalayein; workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) entry (`ai-i18n-tools: workspace:*`) examples ko aapke local checkout se automatically link karti hai.

```bash
# UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# VitePress docs: npx ai-i18n-tools init -t ui-vitepress
# Nextra docs: npx ai-i18n-tools init -t ui-nextra
# Fumadocs docs: npx ai-i18n-tools init -t ui-fumadocs
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# JSON (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Sifarish kiye gaye `package.json` scripts

Package ko sthaaneeya roop se install karne ke baad, aap scripts mein CLI commands ka seedhe upyog kar sakte hain (`npx` ki koi zaroorat nahi).

**Prefer** `sync` kisi bhi cheez ke liye jo pehle “`translate-ui` chalao, phir `translate-svg`, phir `translate-docs`, phir `translate-json`” hua karti thi: `ai-i18n-tools sync` **extract** (jab saksham ho), **translate-ui**, optional **translate-svg**, **translate-docs**, phir optional **translate-json**—sahi kram mein aur shared flags ke saath—aapke config ke anusaar chalata hai. Un steps ko haath se chain karna galat ho sakta hai (order, extract, locale flags). `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs`, aur `i18n:translate:json` ka upyog tabhi karein jab aapko ek **single** step isolation mein chahiye.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**Salah:** `-L <code>` pass karein ya `AI_I18N_LANG` set karein yadi aap CLI output aur dashboard ko kisi anya bhasha mein chahte hain — dekhein [Tool UI language](/reference/environment-variables#tool-ui-language).

<a id="combined-sync"></a>
## Sanyukt sync

UI strings aur documents ko ek saath chalane ke liye ek hi config mein sabhi features enable karein:

<details>
<summary>Udaharan sanyukt UI + docs config</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` document anuvaad ko UI ke samaan `strings.json` catalog par nirdeshit karta hai taaki shabdaavali sthir rahe; `glossary.userGlossary` product shabdon ke liye CSV overrides jodta hai.

Ek pipeline chalane ke liye `npx ai-i18n-tools sync` chalaein: jab `features.translateUIStrings` saksham ho, to **extract** karein phir **UI strings ka anuvaad karein**; vikalpik **SVG ka anuvaad karein** (`features.translateSVG` + `svg` block); **documentation ka anuvaad karein** (jaisa ki `docs[]` mein configure kiya gaya hai); phir vikalpik **translate-json** (`features.translateJson` + `json[]`). `--no-ui`, `--no-svg`, `--no-docs`, ya `--no-json` ke saath parts ko chhodein. Docs aur `json[]` steps `--dry-run`, `-p` / `--path`, `--force`, aur `--force-update` ko swikar karte hain (docs-only flags ko tab ignore kiya jata hai jab `--no-docs`; JSON wahi cache flags ka upyog karta hai jab `--no-json` set nahi hota hai).

Ek block par `docs[].targetLocales` ka upyog karein taaki us block ki files ko UI se **chote upsamuchchay** mein anuvaad kiya ja sake (prabhavi documentation locales blocks ke paar **union** hote hain):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>
### Mixed documentation config (`docsOutput.style = "docusaurus"` + `"flat"`)

Aap ek hi config mein kai documentation pipelines ko `docs` mein ek se adhik entry jodkar jod sakte hain. Yah ek aam setup hai jab kisi project mein Docusaurus site (`docsOutput.style = "docusaurus"`) ke saath-saath root-level markdown files (jaise, `docsOutput.style = "flat"` ke saath ek repository README) hote hain jinhein locale-suffixed filenames ke saath translate kiya jaana chahiye.

<details>
<summary>Udaaharan mixed Docusaurus + flat README config</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

Yah `npx ai-i18n-tools sync` ke saath kaise chalta hai:

- UI strings ko `src/` se extract/translate kiya jaata hai `public/locales/` mein.
- Pehla docs block **markdown** ko `docs-site/docs/` se `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` mein translate karta hai (localised documentation pages).
- `docs[].docusaurusCatalogDir` set hone aur `features.translateDocs` enable hone par, wahi block **Docusaurus shell JSON** ko `docs-site/i18n/en/` ke neeche har target locale folder mein translate karta hai — navbar, footer, aur theme/plugin catalogues, MDX body copy nahi.
- Dusra docs block `README.md` ko locale-suffixed files mein `translated-docs/` (`docsOutput.style = "flat"`) ke neeche translate karta hai.
- Sabhi docs blocks `cacheDir` share karte hain, isliye API calls aur cost kam karne ke liye unchanged segments ko runs mein dobara use kiya jaata hai.
