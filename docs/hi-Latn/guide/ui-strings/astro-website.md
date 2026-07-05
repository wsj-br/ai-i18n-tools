<a id="astro-website"></a>
# Astro website

Static Astro marketing ya app sites (plain Astro, Starlight nahi) ke liye, [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) ko ai-i18n-tools ke saath combine karein. [Astro integration](/guide/astro-integration) bhi dekhein.

Reference implementation [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) hai (iska [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) bhi dekhein): English `/` par, nau target locales `/{locale}/` par (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

<a id="hybrid-pipelines"></a>
## Hybrid pipelines

Adhikansh teams do pipelines ka **hybrid** upyog karti hain (ve takrate nahi hain):

| Pipeline | Iske liye upyog karein | Commands | Output |
|----------|---------|----------|--------|
| **Page HTML** | Headings, paragraphs, nav labels, template body mein inline arrays | `translate-docs` | `src/pages/{locale}/index.astro` har locale ke liye |
| **UI strings (`t()`)** | Frontmatter data, screenshot tab labels, shared arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (key ke roop mein English source) |

Jab aap koi bhasha add ya remove karte hain, toh teen lists ko align rakhein: `targetLocales` `ai-i18n-tools.config.json` mein, `i18n.locales` `astro.config.mjs` mein (Astro **lowercase** route codes jaise `pt-br` ka upyog karta hai), aur `ui-languages.json` (`generate-ui-languages` ke madhyam se). Flat bundle **filenames** config casing (`pt-BR.json`) ka upyog karte hain; Astro ke `pt-br` route ko us file se apne manifest `code` field ke madhyam se map karein (`examples/astro-website/src/i18n/locale.ts` dekhein).

Udaharan `package.json` scripts (reference project se):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## UI strings (SSG)

`init -t ui-astro-website` ke saath UI extraction scaffold karein, phir `docs[]` block mein merge karein jab aap page HTML ka bhi anuvad karte hain ([Parse-and-replace pages](#astro-website-pages-parse-and-replace) dekhein). TypeScript modules mein `t('…')` aur `.astro` frontmatter (aur template `{expression}` blocks mein jab aap duplicated locale pages ke bajaye UI strings ko prefer karte hain) mein copy wrap karein:

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

`astro.config.mjs` mein `i18n.defaultLocale` se mel khane ke liye `sourceLocale` set karein. Flat bundles ko ek directory mein likhein jise Astro build time par import kar sake (template `public/locales/` ka upyog karta hai). Key ke roop mein English source literal ko dekhkar **build time** par `t('…')` ko resolve karein (`examples/astro-website/src/i18n/t.ts` dekhein; `strings.json` extraction cache hai, runtime bundle nahi). Aapko static site ke liye `ai-i18n-tools/runtime` ya i18next ki **aavashyakta nahi** hai jab tak aap client islands nahi jodte jo load ke baad bhasha badalte hain.

Har page ko wire karein jo `t()` ko call karta hai (English root page aur har `src/pages/{locale}/` copy):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Udaharan mein sahayak helpers: labels, direction, aur BCP-47 codes ke liye `src/i18n/utils.ts`, `src/i18n/locale.ts`, aur `ui-languages.json`. `targetLocales` badalne ke baad `generate-ui-languages` chalaen (vikalp roop se `ui.uiLanguagesPath` set karen taaki manifest aapke helpers ke bagal mein rahe, jaise `src/i18n/ui-languages.json`). `MainLayout.astro` `resolveUiLanguage(Astro.currentLocale)` se `<html lang>` aur `<html dir>` set karta hai; `LanguagePicker.astro` `astro:i18n` se `getRelativeLocaleUrl` ka upyog karta hai.

<a id="pages-parse-and-replace"></a>
## Pages (parse-and-replace)

`.astro` files mein hardcoded HTML wale marketing pages ke liye, `translate-docs` ko text nodes aur attributes (`alt`, `title`, `aria-label`, `placeholder`) nikalne den, unhe document cache ke saath translate karen, aur aapke pages tree ke neeche locale-specific copies likhen. Aapko adhikansh visible copy ke liye `t()` ki **aavashyakta nahi** hai.

Structural attribute aur key values default roop se translate **nahi** hote hain: built-in protection JSX/HTML attributes jaise `class`, `id`, `style`, `src`, `href`, `data-*`, aur adhiktar `aria-*`, plus object keys jaise `class`, `key`, aur `id` template `{expression}` blocks ke andar cover karta hai. Jab aap custom attributes (jaise Tailwind `variant` ya CMS `slug` fields) ka upyog karte hain, toh un lists ko extend karne ke liye `docs[].protectAttributes` aur `docs[].protectKeys` ka upyog karein. Yahi options markdown translation ke dauran MDX JSX par lagu hote hain ([protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys) dekhein).

`features.translateDocs` enable karen aur ek `docs[]` block joden, udharan ke liye:

```json
{
  "features": { "translateDocs": true },
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

`npx ai-i18n-tools translate-docs` (ya [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) mein `pnpm i18n:translate`) chalayein. English source `src/pages/index.astro` par rehta hai; har target locale ko `src/pages/{locale}/index.astro` milta hai jismein extra directory level ke liye imports adjust kiye jaate hain (jaise `../layouts/` → `../../layouts/`).

**template body** ke andar, `{expression}` blocks (inline arrays, object `title`/`desc` fields) mein string literals ka anuvad tab kiya jaata hai jab ve user-facing hon; protected attributes/keys par quoted values, `t('…')`, `<script>`, aur `<style>` ke andar ke literals ko aparivartit chhoda jaata hai. **Frontmatter TypeScript ka anuvad is path se nahin kiya jaata hai**—shared frontmatter (jismein `t()` imports aur data arrays shaamil hain) ko English aur locale pages par ek jaisa rakhen, ya English page ko edit karne ke baad `translate-docs` ko phir se run karen taaki locale copies frontmatter changes ko pick kar saken. Sirf frontmatter copy ke liye, [UI-string pipeline](#astro-website-ui-strings-ssg) ka upyog karen.

Poore hybrid landing page ke liye [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) dekhein (HTML `translate-docs` ke madhyam se, screenshot tab labels `t()` + `translate-ui` ke madhyam se).
