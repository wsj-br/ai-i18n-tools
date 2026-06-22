<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: Shuruat karna

`ai-i18n-tools` package teen alag, modular workflows pradan karta hai:

- **Workflow 1 - UI Anuvad**: kisi bhi JS/TS source se `t("…")` calls nikalen, unka OpenRouter ke madhyam se anuvad karen, aur i18next ke liye taiyar flat per-locale JSON files likhen.
- **Workflow 2 - Document Anuvad**: `docs[].contentPaths` mein soochibaddh **markdown, MDX, aur `.astro` pages** ka `translate-docs` ke madhyam se anuvad karen, smart caching ke saath. Vaikalpik **Docusaurus catalog JSON** (`docs[].docusaurusCatalogDir`, `docusaurus write-translations` se) usi command mein anuvadit hota hai jab `features.translateDocs` saksham hota hai — site chrome (navbar, footer, theme strings), `docs/` mein prose nahi.
- **Workflow 3 - JSON file anuvad**: manmane nested JSON bundles (jaise `src/i18n/en/translation.json`) ka top-level `json[]`, `features.translateJson`, aur `translate-json` ke madhyam se anuvad karen — un sites ke liye jo UI copy ko source mein `t()` ke bajaye per-locale JSON files mein rakhte hain.

**SVG** assets `features.translateSVG`, top-level `svg` block, aur `translate-svg` ka upyog karte hain ([CLI reference](#cli-reference) dekhen).

**Kaun sa workflow?**

- `t()` ke madhyam se source mein user-facing strings → Workflow 1 (`extract` / `translate-ui`).
- Localised pages ya Docusaurus shell JSON → Workflow 2 (`translate-docs`).
- Keval standalone nested JSON locale files → Workflow 3 (`translate-json`).

Teeno workflows OpenRouter (koi bhi compatible LLM) ka upyog karte hain aur ek single config file share karte hain.

<small>**Anya bhashaon mein padhen:** </small>
<small id="lang-list">[English (UK)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [Hindi (Roman)](./GETTING_STARTED.hi-Latn.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [简体中文](./GETTING_STARTED.zh-Hans.md) · [繁體中文](./GETTING_STARTED.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Vishay-soochi**

- [Installation](#installation)
  - [CLI ka upyog karna](#using-the-cli)
- [Turant shuru karen](#quick-start)
  - [Anushanshit `package.json` scripts](#recommended-packagejson-scripts)
- [Workflow 1 - UI Anuvad](#workflow-1---ui-translation)
  - [Step 1: Shuru karen](#step-1-initialise)
  - [Step 2: Strings nikalen](#step-2-extract-strings)
  - [Astro website (plain Astro, Starlight nahi)](#astro-website-plain-astro-not-starlight)
  - [Astro website UI strings (SSG)](#astro-website-ui-strings-ssg)
  - [Astro website pages (parse-and-replace)](#astro-website-pages-parse-and-replace)
  - [Step 3: UI strings ka anuvad karen](#step-3-translate-ui-strings)
  - [XLIFF 2.0 mein export karna (vaikalpik)](#exporting-to-xliff-20-optional)
  - [Step 4: Runtime par i18next ko wire karen](#step-4-wire-i18next-at-runtime)
    - [`SOURCE_LOCALE` ko align rakhna](#keeping-source_locale-aligned)
    - [Locale loaders](#locale-loaders)
    - [Runtime helpers reference](#runtime-helpers-reference)
  - [Source code mein `t()` ka upyog karna](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Cardinal plurals (`plurals: true`)](#cardinal-plurals-plurals-true)
    - [Plurals kaise store aur emit hote hain](#how-plurals-are-stored-and-emitted)
  - [Bhasha switcher UI](#language-switcher-ui)
  - [RTL bhashayen](#rtl-languages)
- [Workflow 2 - Document Anuvad](#workflow-2---document-translation)
  - [Step 1: Documentation ke liye shuru karen](#step-1-initialise-for-documentation)
  - [Step 2: Documents ka anuvad karen](#step-2-translate-documents)
    - [Complex Markdown aur failed quality checks](#complex-markdown-and-failed-quality-checks)
    - [Cache behaviour aur `translate-docs` flags](#cache-behaviour-and-translate-docs-flags)
    - [Batch prompt format](#batch-prompt-format)
    - [Segment dedupe aur SQLite mein paths](#segment-dedupe-and-paths-in-sqlite)
  - [Output layouts](#output-layouts)
    - [Anchor links jab `docsOutput.style = "flat"`](#anchor-links-when-docsoutputstyle--flat)
    - [Anuvadit docs mein images aur raster assets](#images-and-raster-assets-in-translated-docs)
    - [Bhasha switcher (`languageListBlock`)](#language-switcher-languagelistblock)
    - [`pathTemplate` / `jsonPathTemplate` placeholders](#pathtemplate--jsonpathtemplate-placeholders)
  - [Troubleshooting](#troubleshooting)
- [Workflow 3 - JSON file anuvad](#workflow-3---json-file-translation)
  - [Step 1: Nested JSON ke liye shuru karen](#step-1-initialise-for-nested-json)
  - [Step 2: `json[]` configure karen](#step-2-configure-json)
  - [Step 3: JSON bundles ka anuvad karen](#step-3-translate-json-bundles)
  - [Workflow 3 vs anya pipelines](#workflow-3-vs-other-pipelines)
- [Sanyukt workflow (UI + Docs)](#combined-workflow-ui--docs)
  - [Mixed documentation workflow (`docsOutput.style = "docusaurus"` + `"flat"`)](#mixed-documentation-workflow-docsoutputstyle--docusaurus--flat)
- [Anuvad Dashboard](#translation-dashboard)
  - [Asafaltayen (document anuvad)](#failures-document-translation)
    - [Kab iska upyog karen](#when-to-use-it)
    - [Kyon source edits mahatvapurna hain](#why-source-edits-matter)
    - [Tab ka upyog kaise karen](#how-to-use-the-tab)
  - [Markdown issues (static checks)](#markdown-issues-static-checks)
- [Configuration reference](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (vaikalpik)](#uilanguagespath-optional)
  - [`concurrency` (vaikalpik)](#concurrency-optional)
  - [`batchConcurrency` (vaikalpik)](#batchconcurrency-optional)
  - [`fileConcurrency` (vaikalpik)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (vaikalpik)](#batchsize--maxbatchchars-optional)
  - [`provider` aur `providers`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [git exclusions ke liye sabse achha abhyaas:](#best-practice-for-git-exclusions)
  - [`docs`](#docs)
  - [`json`](#json)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLI sandarbh](#cli-reference)
  - [Mool aur vaishvik vikalp](#root-and-global-options)
  - [Prati-command madad](#per-command-help)
  - [Lakshya sthaaneeya (`-l` / `--locale`)](#target-locales--l----locale)
- [Paryaavaran char](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## Sthaapana

Prakaashit package **ESM-only** hai. Node.js ya apne bundler mein `import`/`import()` ka upyog karein; `require('ai-i18n-tools')` ka upyog na karein. Package `engines.node` `>=22.16.0` ghoshit karta hai; purane Node.js sanskaran asamarthit hain. npm tarball mein `docs/` ke tahat keval Angrezi files shaamil hain; `translated-docs/` ke tahat sthaaneeya-vishisht pratilipiyaan [GitHub repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) mein hain.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools mein apna string extractor shaamil hai. Yadi aapne pehle `i18next-scanner`, `babel-plugin-i18next-extract`, ya iske samaan ka upyog kiya hai, to aap migration ke baad un dev dependencies ko hata sakte hain.

<a id="using-the-cli"></a>
### CLI ka upyog karna

**Prati-project (sifarish ki jaati hai)** — ek dependency ya devDependency ke roop mein install karein, phir `npx`, `pnpm exec`, ya ek `package.json` script ke maadhyam se call karein. `package.json` scripts pehle se hi `PATH` par `node_modules/.bin` ke saath chalte hain, isliye `pnpm run i18n:sync` jaise commands `npx` type kiye bina CLI ko invoke karte hain.

**Bare** `ai-i18n-tools` **terminal mein:** Ek interactive shell mein CLI ko seedhe chalane ke liye (project root se, local install ke baad), local bin directory ko `PATH` mein jodein:

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

[**direnv**](https://direnv.net/) ke saath, `PATH_add node_modules/.bin` ko project root mein ek `.envrc` mein jodein taaki repo mein `cd` ke baad bare command upalabdh ho. `PATH` ko adjust kiye bina, `npx ai-i18n-tools …` ya `pnpm exec ai-i18n-tools …` ka upyog karte rahein.

**Zero-install one-off** — `npx ai-i18n-tools <cmd>` ya `pnpm dlx ai-i18n-tools <cmd>` (us invocation ke liye package download karta hai; `package.json` mein koi entry nahi).

Linux, macOS, aur WSL par, registry installs CLI script par executable bit ko swatah set karte hain. Windows par, package managers `.cmd` aur `.ps1` shims generate karte hain jo Node ko spasht roop se invoke karte hain.

Apna provider API key set karein (OpenRouter dikhaya gaya hai; us env var ka upyog karein jo aapke active provider se mel khata ho — [preset table](#openrouter) dekhein):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ya project root mein ek `.env` file banayein:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## Turant Shuruat

Default `init` template (`ui-markdown`) keval **UI** extraction aur translation ko saksham karta hai. `ui-docusaurus` aur `ui-starlight` templates **document** translation (`translate-docs`) ko saksham karte hain. `ui-astro-website` template plain Astro apps (`.astro` files sahit) ke liye **UI** extraction ko scaffold karta hai; ek `docs[]` block jodein ([Astro website pages (parse-and-replace)](#astro-website-parse-and-replace) dekhein) jab aap `.astro` page HTML ke liye `translate-docs` bhi chahte hon. Sandarbh [`examples/astro-website`](../../docs/../examples/astro-website/) **dono** pipelines ka upyog karta hai. `sync` ka upyog karein jab aap ek command chahte hain jo aapke config ke anusaar extract, UI translation, optional SVG file translation, aur documentation translation chalata hai.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# Workflow 3 - nested JSON bundles (no t() in source)
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

---

<a id="workflow-1---ui-translation"></a>
## Workflow 1 - UI Translation

Kisi bhi JS/TS project ke liye design kiya gaya hai jo i18next ka upyog karta hai: React apps, Next.js (client aur server components), Node.js services, CLI tools.

<a id="step-1-initialise"></a>
### Step 1: Initialise

```bash
npx ai-i18n-tools init
```

Yeh `ai-i18n-tools.config.json` ko `ui-markdown` template ke saath likhta hai. Ise set karne ke liye edit karein:

- `sourceLocale` - aapki source bhasha ka BCP-47 code (jaise `"en-GB"`). Aapke runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`) se export kiye gaye `SOURCE_LOCALE` se **mel khana chahiye**.
- `targetLocales` - aapki target bhashao ke liye BCP-47 codes ka array (jaise `["de", "fr", "pt-BR"]`). Is list se `ui-languages.json` manifest banane ke liye `generate-ui-languages` chalayein.
- `ui.sourceRoots` - `t("…")` calls ke liye scan karne ke liye directories ya glob patterns (jaise `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - master catalog kahan likhna hai (jaise `"src/locales/strings.json"`).
- `ui.flatOutputDir` - `de.json`, `pt-BR.json`, aadi kahan likhna hai (jaise `"src/locales/"`).
- `ui.preferredModel` (optional) - `translate-ui` ke liye **sabse pehle** try karne ke liye model id; failure par CLI active provider ke `translationModels` ke saath order mein jaari rakhta hai, duplicates ko chhodte hue.

<a id="step-2-extract-strings"></a>
### Step 2: Strings extract karein

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` ke antargat sabhi JS/TS files ko `t("literal")` aur `i18n.t("literal")` calls ke liye scan karta hai. `ui.stringsJson` mein likhta hai (ya merge karta hai).

Scanner configurable hai: `ui.uiExtractor.funcNames` (ya legacy `ui.reactExtractor.funcNames`) ke madhyam se custom function names jodein. Astro pages aur components ke liye, `ui.uiExtractor.extensions` mein `.astro` jodein.

<a id="marking-html-for-translation"></a>
### HTML ko anuvaad hetu chinhit karna

Sadharan HTML apps ke liye (markup mein `t("…")` calls ke bina), anuvaad yogya elements ko attributes se chinhit karen aur `extract` ko element se hi Angrezi text capture karne den — koi duplicate string literal nahin.

Sadharan roop ko tarjeeh den (attribute ka koi value nahin hota; source text element se padha jaata hai):

- `data-i18n` — key element ka `textContent` hai; runtime par aap `el.textContent = t(key)` set karte hain.
- `data-i18n-title` — key element ka `title` hai; runtime par aap anuvaadit `title` set karte hain.
- `data-i18n-placeholder` — key element ka `placeholder` hai.

Valued roop `data-i18n="Some key"` ka upyog kewal tab karen jab sadharan roop kaam na kar sake: mishrit-content elements (child tags ke saath interleave kiya gaya text), ya jab key dikhne wale text se alag honi chahiye. `data-i18n-ignore` ke saath kisi element (aur uske subtree) ko opt out karen.

Badhyata: sadharan `data-i18n` kewal leaf text elements ke liye hai (ek akela text node, koi child element nahin), kyunki `textContent` set karne se koi bhi children replace ho jaate hain. `Run <code>build</code> now.` jaise paragraph ke liye, har text run ko uske apne marker mein wrap karen:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

Markers ko haath se joden, ya `mark-html` command ko sadharan markers aapke liye insert karne den. Yah default roop se ek dry run hai — yah batata hai ki yah prati file kitne markers jodega aur mishrit-content elements ki soochi deta hai jinhe manual `<span data-i18n>` ki zaroorat hai — aur kewal `--write` ke saath likhta hai:

```bash
# Preview (no changes written)
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
```

`mark-html` idempotent hai, `data-i18n-ignore` ka sammaan karta hai, kabhi bhi code-jaise elements (`code`, `pre`, `kbd`, `samp`, `var`) ya khali / kewal sankhyatmak text ko mark nahin karta hai, aur kabhi bhi valued marker emit nahin karta hai. Marking ke baad, haath se report kiye gaye mishrit-content fragments ko wrap karen, phir `.html` ko `ui.uiExtractor.extensions` mein joden taaki `extract` strings capture kar sake:

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="html-app-worked-example-dashboard"></a>
#### Karyaanvit udaharan: ek sadharan HTML app ko localize karna (bundled dashboard)

Package ka Translation Dashboard (`src/dashboard-app`) yahi markers istemaal karta hai. Iska `index.html` aise bare markers rakhta hai:

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract` har English source string ko catalog (`strings.json`) mein likhta hai, aur `translate-ui` har locale ke liye ek flat bundle bharta hai, jiska key English source text hota hai. Ek typical static HTML app ke liye aap `ui.flatOutputDir` ko web-served directory jaise `public/locales/` par point karenge:

```bash
npx ai-i18n-tools extract        # index.html markers → strings.json
npx ai-i18n-tools translate-ui   # strings.json → {ui.flatOutputDir}/{locale}.json
```

```jsonc
// public/locales/de.json
{
  "Next": "Weiter",
  "Filename (partial)": "Dateiname (teilweise)",
  "Stop the dashboard server and close this window": "Dashboard-Server stoppen und dieses Fenster schließen",
  "Close": "Schließen"
}
```

Runtime par, sakriya locale ke liye bundle load karen aur marked elements ko walk karen. Key marker value se aati hai jab maujood ho, anyatha element ke apne text / title / placeholder se (usi tarah normalize kiya gaya jaise extractor whitespace normalize karta hai):

```html
<script type="module">
  const locale = document.documentElement.lang || "en";
  const bundle = locale.startsWith("en")
    ? {}
    : await fetch(`/locales/${locale}.json`).then((r) => (r.ok ? r.json() : {}));

  const t = (key) => bundle[key] ?? key; // English source is the fallback
  const norm = (s) => s.trim().replace(/\s+/g, " ");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || norm(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || norm(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder") || norm(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
</script>
```

Is snippet ka marker-walking wala hissa `applyStaticI18n` mein [`src/dashboard-app/app.js`](../../docs/../src/dashboard-app/app.js) bilkul wahi hai. Kyunki English source text catalog key hai, untranslated strings automatically English mein fallback ho jaati hain.

Bundled dashboard kaise alag hai: kyunki ismein Node server hai, yeh static `/locales/{locale}.json` fetch nahi karta. Client `GET /api/ui-i18n` ko call karta hai, aur server active locale (`--ui-lang` > `AI_I18N_LANG` > config `uiLanguage` > host OS) resolve karta hai aur `{ locale, dir, bundle }` return karta hai. Client phir us response se `document.documentElement` `lang`/`dir` set karta hai (locale choose karne ke liye `lang` padhne ke bajaye) `applyStaticI18n` ko call karne se pehle. Bundles khud translation ke liye tool ka content nahi hain — yeh dashboard ke UI strings hain, jo `src/i18n/locales/{locale}.json` mein ship kiye jaate hain (build par `dist/i18n/locales` mein copy hote hain) aur server-side par `loadUiBundle` dwara [`src/i18n/index.ts`](../../docs/../src/i18n/index.ts) mein padhe jaate hain. Dashboard ka `t()` `{{name}}` interpolation ko bhi support karta hai, upar diye gaye minimal `t` ke vipreet.

<a id="astro-website-plain-astro-not-starlight"></a>
### Astro website (plain Astro, Starlight nahi)

Static Astro marketing ya app sites ke liye, [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) ko ai-i18n-tools ke saath combine karein. Reference implementation [`examples/astro-website`](../../docs/../examples/astro-website/) hai (iska [README](../../docs/../examples/astro-website/README.md) bhi dekhein): `/` par English, `/{locale}/` par nau target locales (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

Adhikansh teams do pipelines ka **hybrid** upyog karti hain (ve takrate nahi hain):

| Pipeline | Iske liye upyog karein | Commands | Output |
|----------|---------|----------|--------|
| **Page HTML** | Headings, paragraphs, nav labels, template body mein inline arrays | `translate-docs` | `src/pages/{locale}/index.astro` har locale ke liye |
| **UI strings (`t()`)** | Frontmatter data, screenshot tab labels, shared arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (key ke roop mein English source) |

Jab aap koi bhasha jodte ya hatate hain to teen lists ko align rakhein: `ai-i18n-tools.config.json` mein `targetLocales`, `astro.config.mjs` mein `i18n.locales` (Astro **lowercase** route codes ka upyog karta hai jaise `pt-br`), aur `ui-languages.json` (`generate-ui-languages` ke madhyam se). Flat bundle **filenames** config casing ka upyog karte hain (`pt-BR.json`); Astro ke `pt-br` route ko us file se apne manifest `code` field ke madhyam se map karein (`examples/astro-website/src/i18n/locale.ts` dekhein).

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

<a id="astro-website-ui-strings-ssg"></a>
### Astro website UI strings (SSG)

`init -t ui-astro-website` ke saath UI extraction ko scaffold karein, phir ek `docs[]` block mein merge karein jab aap page HTML ka bhi anuvad karte hain (neeche dekhein). TypeScript modules mein `t('…')` aur `.astro` frontmatter mein copy ko wrap karein (aur template `{expression}` blocks mein jab aap duplicated locale pages ke bajaye UI strings ko prefer karte hain):

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

<a id="astro-website-pages-parse-and-replace"></a>
### Astro website ke page (parse-and-replace)

`.astro` files mein hardcoded HTML wale marketing pages ke liye, `translate-docs` ko text nodes aur attributes (`alt`, `title`, `aria-label`, `placeholder`) nikalne den, unhe document cache ke saath translate karen, aur aapke pages tree ke neeche locale-specific copies likhen. Aapko adhikansh visible copy ke liye `t()` ki **aavashyakta nahi** hai.

Structural attribute aur key values default roop se translate **nahi** hote hain: built-in protection JSX/HTML attributes jaise `class`, `id`, `style`, `src`, `href`, `data-*`, aur adhikansh `aria-*`, plus template `{expression}` blocks ke andar `class`, `key`, aur `id` jaise object keys ko cover karta hai. Jab aap custom attributes (udharan ke liye Tailwind `variant` ya CMS `slug` fields) ka upyog karte hain to un lists ko badhane ke liye `docs[].protectAttributes` aur `docs[].protectKeys` ka upyog karen. Yahi vikalp markdown translation ke dauran MDX JSX par lagu hote hain ([protectAttributes / protectKeys](#protectattributes-protectkeys) dekhen).

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

`npx ai-i18n-tools translate-docs` chalaen (ya [`examples/astro-website`](../../docs/../examples/astro-website/) mein `pnpm i18n:translate`). English source `src/pages/index.astro` par rehta hai; har target locale ko `src/pages/{locale}/index.astro` milta hai jismein extra directory level ke liye imports adjust kiye jaate hain (udharan ke liye `../layouts/` → `../../layouts/`).

**template body** ke andar, `{expression}` blocks mein string literals (inline arrays, object `title`/`desc` fields) tab translate hote hain jab ve user-facing hote hain; protected attributes/keys par quoted values, `t('…')`, `<script>`, aur `<style>` ke andar literals ko unchanged chhod diya jaata hai. **Frontmatter TypeScript is path se translate nahi hota hai**—shared frontmatter (jismein `t()` imports aur data arrays shamil hain) ko English aur locale pages par identical rakhen, ya English page ko edit karne ke baad `translate-docs` ko phir se chalaen taaki locale copies frontmatter changes ko pick up kar saken. Frontmatter-only copy ke liye, iske bajay [UI-string pipeline](#astro-website-ui-strings) ka upyog karen.

Poore hybrid landing page ke liye [`examples/astro-website`](../../docs/../examples/astro-website/) dekhen (HTML via `translate-docs`, screenshot tab labels via `t()` + `translate-ui`).

<a id="step-3-translate-ui-strings"></a>
### Step 3: UI strings ka anuvad karen

```bash
npx ai-i18n-tools translate-ui
```

`strings.json` padhta hai, har target locale ke liye active LLM provider ko batches bhejta hai, flat JSON files (`de.json`, `fr.json`, etc.) ko `ui.flatOutputDir` mein likhta hai. Jab `ui.preferredModel` set hota hai, to us model ko active provider ki `translationModels` list se pehle try kiya jaata hai (document translation aur anya commands keval provider ki list ka upyog karte hain).

Har entry ke liye, `translate-ui` ek optional `models` object mein har locale ko safaltapoorvak translate karne wale **OpenRouter model id** ko store karta hai (`translated` ke samaan locale keys). Local `dashboard` command mein edit kiye gaye strings ko us locale ke liye `models` mein sentinel value `user-edited` ke saath mark kiya jaata hai. `ui.flatOutputDir` ke neeche per-locale flat files keval **source string → translation** rehte hain; unmein `models` shamil nahi hota hai (isliye runtime bundles unchanged rehte hain).

> **Note:** Yadi aap Translation Dashboard mein kisi entry ko edit karte hain, to aapko updated cache entry ke saath output files ko phir se likhne ke liye ek `sync --force-update` (ya `--force-update` ke saath equivalent `translate` command) chalane ki aavashyakta hogi. Sath hi, dhyan rakhen ki yadi source text baad mein badalta hai, to aapka manual edit kho jaayega kyunki naye source string ke liye ek naya cache key (hash) generate hoga.

<a id="exporting-to-xliff-20-optional"></a>
### XLIFF 2.0 mein export karna (optional)

UI strings ko translation vendor, TMS, ya CAT tool ko dene ke liye, catalog ko **XLIFF 2.0** ke roop mein export karen (har target locale ke liye ek file). Yah command **read-only** hai: yah `strings.json` ko modify nahi karta hai aur na hi kisi API ko call karta hai.

```bash
npx ai-i18n-tools export-ui-xliff
```

By default, files `ui.stringsJson` ke bagal mein likhe jaate hain, jinka naam `strings.de.xliff`, `strings.pt-BR.xliff` (aapke catalog ka basename + locale + `.xliff`) jaisa hota hai. Kahin aur likhne ke liye `-o` / `--output-dir` ka upyog karein. `strings.json` se maujooda anuvaad `<target>` mein dikhai dete hain; gayab locale `state="initial"` ka upyog karte hain bina `<target>` ke taaki tools unhe bhar sakein. Har locale ke liye jin units ko abhi bhi anuvaad ki zaroorat hai, unhe export karne ke liye `--untranslated-only` ka upyog karein (vendor batches ke liye upyogi). `--dry-run` files likhe bina paths print karta hai.

<a id="step-4-wire-i18next-at-runtime"></a>
### Charan 4: Runtime par i18next ko wire karein

`'ai-i18n-tools/runtime'` dwara export kiye gaye helpers ka upyog karke apni i18n setup file banayein:

<details>
<summary>Pura i18n bootstrap udaharan (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

<a id="keeping-source_locale-aligned"></a>
#### `SOURCE_LOCALE` ko align rakhna

**Teen values ko align rakhein:** `ai-i18n-tools.config.json` mein `sourceLocale`, is file mein `SOURCE_LOCALE`, aur plural flat JSON `translate-ui` jo `{sourceLocale}.json` ke roop mein aapke flat output dir (aksar `public/locales/`) ke neeche likhta hai. Usi basename ka upyog static `import` mein karein (upar diya gaya udaharan: `en-GB` → `en-GB.json`). `sourcePluralFlatBundle` mein `lng` field `SOURCE_LOCALE` ke barabar hona chahiye. Static ES `import` paths variables ka upyog nahi kar sakte; agar aap source locale badalte hain, to `SOURCE_LOCALE` aur import path ko ek saath update karein. Vikalp roop se, us file ko dynamic `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, ya `readFileSync` ke saath load karein taaki path `SOURCE_LOCALE` se banaya ja sake.

Snippet `./locales/…` aur `./public/locales/…` ka upyog karta hai jaise ki `i18n` un folders ke bagal mein baitha ho. Agar aapki file `src/` (aam taur par) ke neeche hai, to `../locales/…` aur `../public/locales/…` ka upyog karein taaki imports wahi paths par resolve hon jo `ui.stringsJson`, `uiLanguagesPath`, aur `ui.flatOutputDir` hain.

React render hone se pehle `i18n.js` ko import karein (jaise ki aapke entry point ke top par). Jab user bhasha badalta hai, to `await loadLocale(code)` aur phir `await i18n.changeLanguage(code)` ko call karein.

`SOURCE_LOCALE` ko export kiya gaya hai taaki koi bhi anya file jise iski zaroorat hai (jaise ki ek language switcher) ise seedhe `'./i18n'` se import kar sake. Agar aap ek maujooda i18next setup ko migrate kar rahe hain, to kisi bhi hardcoded source locale strings (jaise ki components mein bikhre hue `'en-GB'` checks) ko apne i18n bootstrap file se `SOURCE_LOCALE` ke imports se badal dein.

Named imports (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) wahi kaam karte hain agar aap default export ka upyog nahi karna chahte hain.

<a id="locale-loaders"></a>
#### Locale loaders

`localeLoaders` ko **config ke saath align** rakhein, unhe `ui-languages.json` se `makeLocaleLoadersFromManifest` ka upyog karke derive karke (yeh `SOURCE_LOCALE` ko wahi normalisation ka upyog karke filter karta hai jo `makeLoadLocale` karta hai). Jab aap `targetLocales` mein ek locale jodte hain aur `generate-ui-languages` chalate hain, to manifest update ho jaata hai aur aapke loaders swayam hi badlav ko track karte hain — ek alag hardcoded map ko maintain karne ki koi zaroorat nahi hai.

`public/` ke neeche JSON bundles ke liye (typical Next.js setup), apne public URL path se fetch karein:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Bundler ke bina Node CLIs ke liye, har code ke liye JSON file ko padhne aur parse karne wale ek chhote helper ke andar `readFileSync` ka upyog karein.

<a id="runtime-helpers-reference"></a>
#### Runtime helpers reference

`aiI18n.defaultI18nInitOptions(sourceLocale)` key-as-default setups ke liye standard options wapas karta hai:

- `parseMissingKeyHandler` key ko hi wapas karta hai, isliye untranslated strings source text dikhate hain.
- `nsSeparator: false` colons wale keys ki anumati deta hai.
- `interpolation.escapeValue: false` — disable karna surakshit hai: React values ko khud escape karta hai, aur Node.js/CLI output mein koi HTML escape karne ke liye nahi hota hai.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` ai-i18n-tools projects ke liye **recommended** wiring hai: yeh key-trim + source-locale <code>"{{var}}"</code> interpolation fallback (lower-level `wrapI18nWithKeyTrim` jaisa hi vyavahar) lagoo karta hai, vikalp roop se `translate-ui` `{sourceLocale}.json` plural suffixed keys ko `addResourceBundle` ke madhyam se merge karta hai, phir aapke `strings.json` se plural-aware `wrapT` install karta hai. `sourcePluralFlatBundle` ko kewal bootstrapping ke dauran chhodein (ise tab merge karein jab `translate-ui` ne `{sourceLocale}.json` emit kar diya ho). Application code ke liye kewal `wrapI18nWithKeyTrim` **deprecated** hai — iske bajaye `setupKeyAsDefaultT` ka upyog karein.

`makeLoadLocale(i18n, loaders, sourceLocale)` ek async `loadLocale(lang)` function wapas karta hai jo dynamically ek locale ke liye JSON bundle import karta hai aur use i18next ke saath register karta hai.

<a id="using-t-in-source-code"></a>
### Source code mein `t()` ka upyog karna

`t()` ko ek **literal string** ke saath call karein taaki extract script use dhoondh sake:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

Yahi pattern React ke bahar bhi kaam karta hai (Node.js, server components, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Niyam:**

- Sirf ye forms extract kiye jaate hain: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- Key ek **literal string** honi chahiye — key ke roop mein koi variables ya expressions nahi.
- Key ke liye template literals ka upyog na karein: <code>{'t(`Hello ${name}`)'}</code> extract nahi kiya ja sakta.

<a id="interpolation"></a>
### Interpolation

<code>"{{var}}"</code> placeholders ke liye i18next ke native second-argument interpolation ka upyog karein:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Extract command **doosre argument** ko parse karta hai jab woh ek plain object literal hota hai aur tooling-only flags jaise ki `plurals: true` aur `zeroDigit` ko padhta hai (neeche **Cardinal plurals** dekhein). Sadharan strings ke liye, hashing ke liye sirf literal key ka upyog kiya jaata hai; interpolation options abhi bhi runtime par i18next ko pass kiye jaate hain.

Agar aapka project ek custom interpolation utility ka upyog karta hai (jaise ki `t('key')` ko call karna phir result ko `interpolateTemplate(t('Hello {{name}}'), { name })` jaise template function ke through pipe karna), `setupKeyAsDefaultT` (`wrapI18nWithKeyTrim` ke madhyam se) use anavashyak bana deta hai — yeh <code>"{{var}}"</code> interpolation lagoo karta hai bhale hi source locale raw key wapas karta ho. Call sites ko `t('Hello {{name}}', { name })` mein migrate karein aur custom utility ko hata dein.

<a id="cardinal-plurals-plurals-true"></a>
### Cardinal plurals (`plurals: true`)

Aap jo **literal** developer-default copy ke roop mein chahte hain, usi ka upyog karein, aur `plurals: true` pass karein taaki extract + `translate-ui` call ko ek **cardinal plural group** ke roop mein treat karein (i18next JSON v4-style `_zero` … `_other` forms).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (optional) — sirf tooling ke liye; i18next dwara **nahi** padha jaata. Jab `true`, prompts har locale ke liye jahan woh form maujood hai, `_zero` string mein ek literal Arabic `0` ko prefer karte hain; jab `false` ya chhod diya jaata hai, to natural zero phrasing ka upyog kiya jaata hai. `i18next.t` ko call karne se pehle in keys ko strip karein (neeche `wrapT` dekhein).

**Validation:** Agar message mein **do ya do se adhik** alag `{{…}}` placeholders hain, to **unmein se ek** `{{count}}` (plural axis) hona chahiye. Anyaatha `extract` ek spasht file/line message ke saath **fail** ho jaata hai.

**Do swatantra counts** (jaise sections aur pages) ek plural message share nahi kar sakte — **do** `t()` calls ka upyog karein (har ek `plurals: true` aur uske apne `count` ke saath) aur UI mein concatenate karein.

**V1 mein nahi:** ordinal plurals (`_ordinal_*`, `ordinal: true`), interval plurals, ICU-only pipelines.

<a id="how-plurals-are-stored-and-emitted"></a>
#### Plurals kaise store aur emit kiye jaate hain

**`strings.json` mein** plural groups `"plural": true` ke saath **prati hash ek row** ka upyog karte hain, `source` mein original literal, aur `translated[locale]` cardinal categories (`zero`, `one`, `two`, `few`, `many`, `other`) ko us locale ke liye strings se map karne wale object ke roop mein.

**Flat locale JSON:** Non-plural rows **source sentence → translation** rahte hain. Plural rows har suffix ke liye `<groupId>_original` (reference ke liye `source` ke barabar) aur `<groupId>_<form>` ke roop mein emit kiye jaate hain, taki i18next plurals ko natively resolve kar sake. `translate-ui` **sirf** plural flat keys wala `{sourceLocale}.json` bhi likhta hai (source language ke liye is bundle ko load karein taki suffixed keys resolve ho sakein; plain strings abhi bhi key-as-default ka upyog karte hain). Har target locale ke liye, emit kiye gaye suffix keys us locale ke liye `Intl.PluralRules` (`requiredCldrPluralForms`) se match karte hain: yadi `strings.json` ne compaction ke baad kisi category ko chhod diya tha kyunki vah kisi aur se match karti thi (jaise Arabic `many` `other` ke saman), `translate-ui` abhi bhi har avashyak suffix ko flat file mein fallback sibling string se copy karke likhta hai, taki runtime lookup kabhi bhi key ko miss na kare.

Runtime (`ai-i18n-tools/runtime`): **Call** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — yeh `wrapI18nWithKeyTrim` chalata hai, optional `translate-ui` `{sourceLocale}.json` plural bundle ko register karta hai, phir `wrapT` ka upyog karke `buildPluralIndexFromStringsJson(stringsJson)` chalata hai. `wrapT` `plurals` / `zeroDigit` ko strip karta hai, zaroorat padne par key ko group id mein rewrite karta hai, aur `count` ko forward karta hai (optional: agar ek single non-`{{count}}` placeholder hai, to `count` us numeric option se copy kiya jaata hai).

**Purane environments:** Tooling aur consistent behaviour ke liye `Intl.PluralRules` ki avashyakta hai; agar aap bahut purane browsers ko target kar rahe hain to polyfill karein.

<a id="language-switcher-ui"></a>
### Bhasha swicher UI

Bhasha selector banane ke liye `ui-languages.json` manifest ka upyog karein. `ai-i18n-tools` do display helpers export karta hai:

<details>
<summary>Udaharan BhashaSelect component (React)</summary>

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    await i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

</details>

<br />

`getUILanguageLabel(lang, t)` - anuvadit hone par `t(englishName)` dikhata hai, ya jab dono alag hon to `englishName / t(englishName)` dikhata hai. Settings screen ke liye upyukt.

`getUILanguageLabelNative(lang)` - `englishName / label` dikhata hai (har row par koi `t()` call nahi). Header menu ke liye upyukt jahan aap native naam dikhana chahte hain.

`ui-languages.json` manifest <code>"{ code, label, englishName, direction }"</code> entries ka ek JSON array hai (`direction` `"ltr"` ya `"rtl"` hai). Udaharan:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

Manifest `generate-ui-languages` dwara `sourceLocale` + `targetLocales` aur bundled master catalog se generate kiya jata hai. Ise `ui.flatOutputDir` mein likha jata hai. Yadi aap configuration mein kisi bhi locale ko badalte hain, to `generate-ui-languages` file ko update karne ke liye `ui-languages.json` chalayein.

<a id="rtl-languages"></a>
### RTL bhashayein

`ai-i18n-tools` `getTextDirection(lng)` aur `applyDirection(lng)` export karta hai:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` `document.documentElement.dir` (browser) set karta hai ya no-op (Node.js) hai. Ek specific element ko target karne ke liye ek optional `element` argument pass karein.

Strings ke liye jinmein `→` arrows ho sakte hain, RTL layouts ke liye unhein flip karein:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## Workflow 2 - Document Anuvad

Mukhya roop se `docs[].contentPaths` ke antargat **markdown, MDX, aur `.astro` documentation** ke liye design kiya gaya hai. Docusaurus sites par, `docs[].docusaurusCatalogDir` ko `write-translations` catalog folder (jaise `docs-site/i18n/en`) par set karein taki `translate-docs` shell JSON (navbar, footer, theme strings) ka bhi anuvad kare. Markdown mein embedded PNG aur anya raster images ke liye, [Anuvadit docs mein Images aur raster assets](#images-and-raster-assets-in-translated-docs) dekhein. README ya docs mein `docsOutput.style = "flat"` ke saath ek optional **bhasha switcher** block ke liye, [Bhasha switcher (`languageListBlock`)](#language-switcher-languagelistblock) dekhein. SVG files ka anuvad [`translate-svg`](#cli-reference) ke madhyam se kiya jata hai jab `features.translateSVG` enable hota hai — `docs[].contentPaths` ke madhyam se nahi. Arbitrary nested UI JSON bundles (Docusaurus catalogs nahi) [Workflow 3](#workflow-3---json-file-translation) (`json[]` / `translate-json`) mein aate hain, `docs[]` mein nahi.

<a id="step-1-initialise-for-documentation"></a>
### Charan 1: Documentation ke liye initialise karein

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Astro Starlight documentation sites ke liye:

```bash
npx ai-i18n-tools init -t ui-starlight
```

Plain Astro website UI ke liye (koi Starlight nahi):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

Vah template keval UI extraction ko enable karta hai. Page HTML anuvad ke liye, `features.translateDocs` bhi set karein aur ek `docs[]` block jodein ([Astro website pages (parse-and-replace)](#astro-website-parse-and-replace) dekhein). [`examples/astro-website`](../../docs/../examples/astro-website/) config dono pipelines ko ek saath dikhata hai.

Generate kiye gaye `ai-i18n-tools.config.json` ko edit karein:

- `sourceLocale` - source bhasha (`docusaurus.config.js` mein `defaultLocale` se match hona chahiye).
- `targetLocales` - BCP-47 locale codes ka array (jaise `["de", "fr", "es"]`).
- `cacheDir` - sabhi pipelines ke liye shared SQLite cache directory (aur `--write-logs` ke liye default log directory).
- `docs` - documentation blocks ka array. Har block mein optional `description`, `contentPaths` (string ya array; file, directory, ya glob), `outputDir`, optional `docusaurusCatalogDir`, `docsOutput`, optional `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, aadi.
- `docs[].description` - maintainers ke liye ek optional chhota note. Jab set kiya jaata hai, to yah `translate-docs` headline aur `status` section headers mein dikhai deta hai.
- `docs[].contentPaths` - markdown/MDX/`.astro` sources (aur Docusaurus shell JSON ke liye optional `docusaurusCatalogDir`).
- `docs[].outputDir` - us block ke liye translated output root.
- `docs[].docsOutput.style` - `"nested"` (default), `"flat"`, `"doc-system"`, ya aliases `"docusaurus"` / `"astro-starlight"` ([Output layouts](#output-layouts) dekhen).

**Primary vs supplementary:** Localised pages ke liye `contentPaths` par dhyaan den. Jab aapko `write-translations` se Docusaurus shell JSON ki bhi zaroorat ho to `docusaurusCatalogDir` set karen. Yadi aap kewal pages translate karte hain to `docusaurusCatalogDir` ko chhod den.

<a id="step-2-translate-documents"></a>
### Step 2: Documents translate karen

```bash
npx ai-i18n-tools translate-docs
```

Yah har `docs[]` block ke `contentPaths` (aur Docusaurus catalog JSON jab `docusaurusCatalogDir` set ho) mein sabhi files ko sabhi effective documentation locales mein translate karta hai. Pahle se translate kiye gaye segments SQLite cache se serve kiye jaate hain — kewal naye ya badle hue segments LLM ko bheje jaate hain.

Ek single locale ko translate karne ke liye:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Yah jaanchne ke liye ki kya translate karna hai:

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### Complex Markdown aur failed quality checks

`translate-docs` yah jaanchta hai ki har translated segment markdown structure (document se parse kiye gaye emphasis sahit) ko banaye rakhta hai. Aise paragraphs jo `bold` spans ko `` `inline code` `` ke aas-paas stack karte hain, backticks ko bold ke andar nest karte hain (jaise template literals jaise ki `` `fetch(\`/locales/${code}.json\`)` ``), ya ek lambe sentence mein bold aur code ko bunate hain, ve najuk hote hain: kuch locales ko alag word order ki zaroorat hoti hai, jo yah badal sakta hai ki translation ke baad `**` aur `` ` `` kaise align hote hain aur `AST mismatch` jaise CLI errors ko trigger karte hain.

**Yadi aapko is tarah ki validation failure milti hai, to source-language text ko saral banane ko prefer karen** — paragraph ko split karen, ek example ko fenced code block mein move karen, ya kam layered bold/code pairs ke saath usi idea ko describe karen — bajaye iske ki har model aur locale se dense inline markup ko puri tarah se reproduce karne ki ummeed karen. Is page par kahin aur (vishesh roop se Step 4 ke `SOURCE_LOCALE`, loaders, aur `public/` paths par notes), formatting jaanbujhkar realistic hai; jab aap apne docs mein saman wording ka punah upyog karte hain, to jab aap bade paimane par translate karte hain to ise saral rakhen.

Jab har configured model ek hi segment par `AST mismatch` ke saath fail ho jaata hai, to `translate-docs` us segment ko automatically chhote parts mein split kar sakta hai (pahle list midpoint, phir single list items ya chhote paragraph chunks), har part ko pahle model se retry kar sakta hai, aur original segment cache key ke tahat result ko phir se jod sakta hai. Yah default roop se on hai (`segmentSplitting.qualityRetrySplit`); model exhaustion ke baad rukne ke liye ise `false` par set karen. Jab yah fallback chalta hai to run summary `Quality split retries` report karta hai.

Yah dekhne ke liye ki **kaun se segments fail hue**, kitni baar, aur stored **quality / error messages**, Translation Dashboard ke **Failures** tab ka upyog karen ([Translation Dashboard → Failures](#failures-document-translation)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Cache behaviour aur `translate-docs` flags

CLI SQLite mein **file tracking** (prati file × locale source hash) aur **segment** rows (prati translatable chunk hash × locale) rakhta hai. Ek normal run ek file ko puri tarah se chhod deta hai jab tracked hash current source se mel khata hai **aur** output file pahle se maujood hai; anyatha yah file ko process karta hai aur segment cache ka upyog karta hai taki unchanged text API ko call na kare.

| Flag                          | Effect                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(default)*                   | Jab tracking + on-disk output mel khate hain to unchanged files ko chhod den; baki ke liye segment cache ka upyog karen.                                                                                                                                           |
| `-l, --locale <codes>` | Comma-separated target locales (jab chhoda jaata hai, to yah root `targetLocales` aur har `docs[]` block ke optional `targetLocales` ke union se milte-julte defaults par set ho jaata hai). |
| `-p, --path` / `-f, --file` | Sirf is path ke tahat markdown/JSON ka anuvaad karein (project-relative, absolute, ya glob pattern); `--file`, `--path` ka ek alias hai. |
| `--dry-run`                   | Koi file likhi nahi jaati aur koi API call nahi kiye jaate.                                                                                                                                                                                                         |
| `--type <kind>` | `markdown` ya `json` tak seemit karein (anyaatha config mein enable hone par dono). |
| `--json-only` / `--no-json` | Sirf JSON label files ka anuvaad karein, ya JSON ko chhod dein aur sirf markdown ka anuvaad karein. |
| `-j, --concurrency <n>` | Adhikatam parallel target locales (config ya CLI built-in default se default). |
| `-b, --batch-concurrency <n>` | Prati file adhikatam parallel batch API calls (docs; config ya CLI se default). |
| `--emphasis-placeholders` | Anuvaad se pahle markdown emphasis markers ko placeholders ke roop mein mask karein (optional; default off). |
| `--debug-failed` | Jab validation fail ho jaata hai, to `cacheDir` ke tahat detailed `FAILED-TRANSLATION` logs likhein. |
| `--force-update` | Har matched file ko phir se process karein (extract, reassemble, outputs likhein) bhale hi file tracking skip kar de. **Segment cache abhi bhi laagu hota hai** — anuvaad na kiye gaye segments LLM ko nahi bheje jaate hain. |
| `--force` | Har processed file ke liye file tracking saaf karta hai aur API anuvaad ke liye segment cache **nahi padhta hai** (poora re-translation). Naye results abhi bhi segment cache mein **likhe jaate hain**. |
| `--stats` | Segment counts, tracked file counts, aur prati-locale segment totals print karein, phir exit karein. |
| `--clear-cache [locale]` | Cached translations (aur file tracking) delete karein: sabhi locales, ya ek single locale, phir exit karein. |
| `--prompt-format <mode>` | Segments ka har **batch** model ko kaise bheja jaata hai aur parse kiya jaata hai (`xml`, `json-array`, ya `json-object`). Default `json-array`. Extraction, placeholders, validation, cache, ya fallback behaviour ko nahi badalta hai — [Batch prompt format](#batch-prompt-format) dekhein. |

Aap `--force` ko `--force-update` ke saath combine nahi kar sakte (ve mutually exclusive hain).

<a id="batch-prompt-format"></a>
#### Batch prompt format

`translate-docs` translatable segments ko **batches** mein active LLM provider ko bhejta hai (`batchSize` / `maxBatchChars` dwara samuhit). `--prompt-format` flag kewal us batch ke **wire format** ko badalta hai; `PlaceholderHandler` tokens, markdown AST checks, SQLite cache keys, aur batch parsing fail hone par per-segment fallback aparivartit rahte hain.

| Mode                   | User message                                                           | Model reply                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: har segment ke liye ek `<seg id="N">…</seg>` (XML escaping ke saath). | Kewal `<t id="N">…</t>` blocks, har segment index ke liye ek.       |
| `json-array` (default) | Strings ka ek JSON array, order mein har segment ke liye ek entry.               | **Saman length** (saman order) ka ek JSON array.           |
| `json-object`          | Segment index dwara keyed ek JSON object `{"0":"…","1":"…",…}`.            | **Saman keys** aur translated values ke saath ek JSON object. |

Run header `Batch prompt format: …` bhi print karta hai taki aap active mode ki pushti kar saken. JSON label files (`docusaurusCatalogDir`) aur SVG file batches wahi setting use karte hain jab wo steps `translate-docs` (ya `sync` ke docs phase — `sync` is flag ko expose nahi karta; ye `json-array` par default hota hai) ke hisse ke roop mein chalte hain.

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### SQLite mein Segment dedupe aur paths

> **Note:** Yeh section `cleanup` behavior ya custom tooling ko debug karne ke liye upyogi internal cache key details ko cover karta hai. Adhikansh users ise skip kar sakte hain.

- Segment rows ko globally `(source_hash, locale)` (hash = normalised content) dwara key kiya jata hai. Do files mein identical text ek row share karta hai; `translations.filepath` metadata hai (last writer), har file ke liye doosri cache entry nahi.
- `file_tracking.filepath` namespaced keys ka upyog karta hai: `docs` block ke liye `doc-block:{index}:{relPath}` (`relPath` project-root-relative posix hai: markdown paths jaise collect kiye gaye hain; **JSON label files source file ke cwd-relative path ka upyog karte hain**, jaise `docs-site/i18n/en/code.json`, taki cleanup real file ko resolve kar sake), `translate-json` ke tahat `json[]` sources ke liye `json-block:{index}:{relPath}`, aur `translate-svg` ke tahat SVG files ke liye `svg-files:{relPath}`.
- `translations.filepath` markdown, JSON, aur SVG segments ke liye cwd-relative posix paths store karta hai (SVG any assets ke saman path shape ka upyog karta hai; `svg-files:…` prefix **kewal** `file_tracking` par hai).
- Run ke baad, `last_hit_at` kewal segment rows ke liye clear kiya jata hai **jo same translate scope mein hain** (`--path` aur enabled kinds ka samman karte hue) jo hit nahi hue the, taki ek filtered ya docs-only run unrelated files ko stale mark na kare.

<a id="output-layouts"></a>
### Output layouts

`docsOutput.style` niyantrit karta hai ki translated markdown files kahan likhe jaate hain. `docs[].docsOutput.style` mein neeche diye gaye exact string values ka upyog karen (aliases preset layouts hain, alag engines nahi).

`docsOutput.style = "nested"` (jab omit kiya jata hai to default) — `{outputDir}/{locale}/` ke tahat source tree ko mirror karta hai (jaise `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — static docs sites ke liye locale-prefixed documentation tree. `docsRoot` ke tahat files `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` mein likhe jaate hain. `docsRoot` ke bahar ke paths nested layout par fallback karte hain. `docs[].docsOutput.docsRoot` ko apne English source root par set karen (jaise `"docs"` ya `"src/content/docs"`). Jab `docsOutput.style = "doc-system"`, to aapko `localeSubpath` ko explicitly set karna hoga (presets ke liye neeche ek alias ka upyog karen).

**Aliases** (saman layout engine, preset `localeSubpath`):

- `docsOutput.style = "docusaurus"` — `localeSubpath` default roop se `docusaurus-plugin-content-docs/current` par set hota hai (Docusaurus i18n plugin layout).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` default roop se `""` par set hota hai (translated pages seedhe `{outputDir}/{locale}/` ke tahat, [Starlight](https://starlight.astro.build/guides/i18n/) se milte-julte hain jab English content root par ho aur `outputDir` `docsRoot` ke barabar ho).

Docusaurus preset (primary documentation pages):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight preset (saman block shape, alag paths):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Optional JSON labels — `docusaurusCatalogDir` se Docusaurus shell strings (MDX body copy nahi):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight kai locales ke liye UI strings ship karta hai; optional custom UI overrides `src/content/i18n/en.json` ka upyog `jsonPathTemplate: "{outputDir}/{locale}.json"` ke saath ek alag `docs[]` block mein karte hain jab zaroorat ho.

`docsOutput.style = "flat"` — translated files ko source ke bagal mein locale suffix ke saath, ya ek subdirectory mein rakhta hai. Pages ke beech relative links automatically rewrite ho jaate hain jab `docsOutput.style = "flat"` (jab tak `rewriteRelativeLinks: false` ya ek custom `pathTemplate` set na ho).

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-docsoutputstyle--flat"></a>
#### Anchor links jab `docsOutput.style = "flat"`

Jab `docsOutput.style = "flat"`, tai output mein **sāpak path** ko har locale ke liye (`guide.md` → `guide.de.md`) phir likha jāta hai. **Anchor links** — samān markdown inline form jisme path ke baad ek `#` hota hai — target file ke andar ek section tak jump karte hain:

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

Yahan link target `setup.md` hai, aur `#first-run` anchor hai: yeh us file ke andar sahi heading par scroll karna chahiye.

**Kyoon anchor links par dhyan dena zaroori hai**

- `rewriteRelativeLinks` har locale ke liye **filename** ko fix karta hai (`setup.md` → `setup.de.md`).
- Bahut se renderers **visible heading text** se `#` slug derive karte hain. Anuvad ke baad, headings har locale mein alag hoti hain, isliye auto-generated slug badal sakti hai jabki rewritten link abhi bhi `#first-run` keh sakti hai — ya aapka English `#…` anchor ab slug se match nahi karta jo renderer ne translated heading se banaya hai.
- Natija: pathak sahi **file** par pahunchte hain lekin galat **line** par, ya browser ko koi matching heading nahi milti.

**Kya karna hai**

1. Ap `ai-i18n-tools write-heading-ids` ko aapke source `.md` / `.mdx` par chalayein `translate-docs` se pehle (wahi `docs[]` / `contentPaths` jaise ki hamesha). Yah heading ke upar ki rekha par satah HTML anchors daalta hai taaki `id` ke mulya har anuvaadit prati ke saath saajha kiye jaayein. Heading ke naam badalne ke baad isey phir se chalayein taaki purane anchor ids ko vartaman shirshak ke anuroop taja kiya ja sake.
2. Apne markdown **anchor links** ko un sthir ids par nishit karein, jaise ki `[label](../../docs/other.md#section-id)`, jahaan `section-id` tool dwara likhe gaye anchor ke anuroop hota hai — keval angrezi shabdon se anumaan lagaane ke bajaye.

**Udaharan**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

`docs/security.md` ke baad `write-heading-ids` (simplified):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

`translate-docs` ke baad, file paths aur `#…` anchors har locale file mein aligned rehte hain, jaise:

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

Yeh `#tls-configuration` anchor sabhi locales mein same hai kyunki `id` source mein fixed hai; keval heading **text** aur link **label** ko translate kiya jata hai.

<a id="images-and-raster-assets-in-translated-docs"></a>
#### Images aur raster assets translated docs mein

`translate-docs` markdown segments ko translate karta hai, jismein image alt text bhi shamil hai. Yeh raster files (PNG, JPEG, WebP, GIF) ko aapke documentation `outputDir` mein copy nahi karta. Aapko screenshot files ko un jagah par rakhna hoga jahan translated URLs point karte hain, ya `postProcessing.regexAdjustments` ka upyog karke paths ko rewrite karna hoga.

SVG files ke liye jo translatable text hote hain, `svg` block aur `translate-svg` ka upyog karein — [`svg`](#svg) dekhein.

Puri decision guide, config examples, directory layouts, screenshot-script contracts, design recommendations, aur common mistakes ke liye [Locale assets guide](LOCALE-ASSETS-GUIDE.hi-Latn.md) dekhein.

**Quick reference — paanch patterns**

| Pattern                      | Upyog                                | Mechanism                                         |
|------------------------------|---------------------------------------|---------------------------------------------------|
| A — Shared raster            | Single image, koi per-locale variant nahi | Per-file link rewriter; aam taur par koi regex nahi  |
| B — Per-locale folder        | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/docs | `regexAdjustments` locale-segment swap            |
| C — Docusaurus colocated     | `docsOutput.style = "docusaurus"` sites | Screenshot script files ko rakhti hai; koi regex nahi          |
| D — Translated SVG           | Web apps embedding SVG illustrations                  | `translate-svg` with `svg.style = "flat"`         |
| E — Colocated translated SVG | `docsOutput.style = "docusaurus"` docs          | `translate-svg` with `svg.style = "nested"` + `pathTemplate` |

**Flat link rewriter aur two-step flow**

Jab `docsOutput.style = "flat"`, ek built-in rewriter `postProcessing` se pehle chalta hai. Yah har output file ke liye depth prefix compute karta hai — output file ki directory se source file ki directory tak ka relative path — aur ise non-markdown asset URLs mein prepends karta hai. `postProcessing` phir pehle se prefixed URL par chalta hai — `search` patterns likhein jo iske andar locale segment se match karte hain, na ki leading `../` prefix se.

`flatPreserveRelativeDir: true` ke saath, subdirectories mein source files ko automatically file-specific prefix milta hai. Udaharan ke liye, `docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md` `../../docs/` ka prefix banata hai, isliye `translation-dashboard.png` (source ka ek sibling) `../../docs/translation-dashboard.png` ban jaata hai — bina kisi `postProcessing` rule ke sahi dhang se resolve ho jaata hai.

Jab `docsOutput.style` `"docusaurus"`, `"astro-starlight"`, `"nested"`, ya `"flat"` ke alava koi bhi value ho, to flat link rewriter nahi chalta hai. `postProcessing` original markdown URL dekhta hai.

**Pattern A udaharan** — relative-path assets ke liye koi config ki zaroorat nahi hai jab `docsOutput.style = "flat"`. Pattern A `postProcessing` rules sirf absolute-URL assets (jaise `/img/...`) ya CDN-targeted replacements ke liye zaroori hain.

**Pattern B udaharan — `docsOutput.style = "flat"` README** (`examples/nextjs-app`, doosra `docs[]` block)

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Generic `[^/]+` form ka upyog karein, na ki hardcoded source locale ka, taaki rule kaam karta rahe agar `sourceLocale` kabhi badalta hai.

**Pattern B udaharan — `docsOutput.style = "docusaurus"`** (`examples/nextjs-app`, pehla `docs[]` block)

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**Pattern C — Docusaurus colocated** (koi `regexAdjustments` ki zaroorat nahi)

en-GB screenshots ko `static/assets/` mein rakhein aur ek symlink `docs/assets → ../static/assets` banayein. `take-screenshots` script doosre locales ko seedhe `i18n/<locale>/…/current/assets/` mein likhti hai. Sabhi locales mein sabhi docs `../assets/name.png` ko reference karte hain — path stable hai aur kisi URL rewriting ki zaroorat nahi hai.

**Pattern D udaharan** (`examples/nextjs-app`, `svg.style = "flat"`)

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → `public/assets/` ke antargat har-locale files. Locale dwara app references: `<img src={`/assets/icon.${locale}.svg`} />`.

**Minimal README-only udaharan** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` `README.md` ko `translated-docs/` mein [language switcher post-processing](#language-switcher-languagelistblock) ke saath hi translate karta hai. Koi image rules define nahi kiye gaye hain — yeh tab upyukt hota hai jab README mein koi sibling raster files na ho ya sirf absolute URLs ka upyog karta ho jo aapka host pehle se serve karta hai.

Replacement templates `${translatedLocale}` aur `${translatedBasedir}` jaise placeholders ko support karte hain ([Configuration reference](#configuration-reference) mein `docsOutput.postProcessing.regexAdjustments` row mein poori list).

<a id="language-switcher-languagelistblock"></a>
#### Language switcher (`languageListBlock`)

`docsOutput.postProcessing.languageListBlock` ka upyog karein jab translated markdown files mein **“Doosri bhashaon mein padhein”** links ki ek row shamil honi chahiye — har locale ke liye ek link, jismein `href` values har output file ke relative compute kiye gaye hon.

Yah repository iska upyog [README.md](../README.hi-Latn.md) aur [docs/GETTING _STARTED.md](../../docs/GETTING_STARTED.md) ke liye karta hai. `translate-docs` ke baad, har translated copy ko ek refreshed block milta hai; udaharan ke liye [translated-docs/docs/GETTING_ STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) `translated-docs/docs/` ke antargat sibling locale files aur `../../docs/GETTING_STARTED.md` par English source se link karta hai.

**1. Source markdown mein block ko mark karein**

Switcher ko HTML (ya kisi bhi lines) mein `start` aur `end` substring markers dwara gherein. Yah repo upyog karta hai:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

Shuruaati link text sirf ek placeholder hai. `translate-docs` poore slice ko badal deta hai pehli line se jismein `start` hai, pehli baad ki line tak jismein `end` hai (fenced code blocks ke andar ke markers ko ignore kiya jaata hai taaki ek hi file mein config examples match na karein).

**2. Block ko configure karein**

`start` aur `end` manmaane substring markers hain — unhein `<small id="lang-list">` / `</small>` hone ki zaroorat nahi hai. Koi bhi opening aur closing text chunein jo sirf language-switcher slice par dikhta hai: ek aur HTML tag (`<div class="lang-switcher">` … `</div>`), HTML comments (`<!-- lang-list -->` … `<!-- /lang-list -->`), ya sirf markdown boundaries (jaise ki ek line `**Languages:**` se ek line `---` tak). Config mein `start` aur `end` ko theek waisa hi set karein jaisa aapne source file mein daala hai.

Root config ([ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Field       | Role                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Substring jo block ki opening line ko identify karta hai                                                  |
| `end`       | Closing line par substring (ek hi line par `start` ke saath ho sakta hai jab dono ek hi line par dikhein)             |
| `separator` | Generated `[label](../../docs/href)` links ke beech ka text (yeh repo `" · "` ka upyog karta hai)                                    |
| `label`     | Optional: `"local"` (default) manifest se har locale endonym ka upyog karta hai; `"english"` `englishName` ka upyog karta hai |

**3. Runtime par kya hota hai**

1. **Extraction** — language-list slice ko model ko **nahi** bheja jaata hai (`translatable: false`).
2. **Prati anuvaadit file** — segment anuvaad aur optional flat link rewriting ke baad, `postProcessing` block ko phir se banata hai: har locale ke liye ek markdown link, `ui-languages.json` se labels jab maujood hon (anyatha bundled master catalog, anyatha `localeDisplayNames`), file ke saapeksh path jo likhi ja rahi hai.
3. **Source refresh** — ek `translate-docs` / `sync` docs pass ke ant mein, wahi canonical block **English source files** mein `contentPaths` mein wapas likha jaata hai taaki ek locale jodne se repo mein switcher update ho jaaye bina har link ko manually edit kiye.

Agar kisi file mein koi matching block nahi hai, to CLI ek warning log karta hai (jab `--verbose`) aur body ko bina badle chhod deta hai.

**4. Label manifest**

Endonym labels (`label: "local"`) ke liye, `ui-languages.json` ko `generate-ui-languages` ke madhyam se generate ya maintain karein ([`uiLanguagesPath`](#uilanguagespath-optional) dekhein). Is repo ki docs-only config mein koi UI pipeline nahi hai, isliye labels `sourceLocale` + `targetLocales` ke liye bundled master catalog se aate hain.

**5. Is repository mein udaharan**

| Example                            | Files                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Yeh package (flat docs + subdirs) | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) (`docsOutput.style = "flat"`), [README.md](../README.hi-Latn.md), [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md), [translated-docs/](../../docs/../translated-docs/) ke antargat outputs |
| Minimal README-only                | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json) (`docsOutput.style = "flat"`), [examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| Flat README + Docusaurus docs      | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (doosra block: `docsOutput.style = "flat"`; pehla block: `docsOutput.style = "docusaurus"`)                                                     |

`<small id="lang-list">` se theek pehle ki line (jaise ki `**Read in other languages:**`) ek normal translatable segment hai aur har target locale mein sthanikrit hoti hai; sirf markers ke andar ki link row ko `href` aur manifest-driven labels ke alawa verbatim regenerate kiya jaata hai.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` placeholders

Jahan anuvadit files likhi jaati hain, unhe `docs[].docsOutput.pathTemplate` (markdown aur MDX) ya `jsonPathTemplate` (JSON label files) set karke override karein. Dono ek hi placeholders ko swikar karte hain. Suljhe hue path ko us block ke `outputDir` ke andar hi rehna chahiye (CLI un paths ko asweekar karta hai jo isse bahar nikalte hain).

Yadi aap ek custom `pathTemplate` ka upyog karte hain, to `rewriteRelativeLinks` default roop se `false` par set hota hai jab tak ki aap ise spasht roop se set na karein — relative link rewriting `docsOutput.style = "flat"` ke liye banaya gaya hai bina kisi custom template ke.

Built-in layouts (`nested`, `flat`, `doc-system` bina custom template ke) ke liye, lowercased locale folder ya filename segments (jaise `pt-br` ki jagah `pt-BR`) likhne ke liye `docsOutput.localePathLowercase` ko `true` par set karein. `astro-starlight` alias ise default roop se `true` par set karta hai. Custom `pathTemplate` / `jsonPathTemplate` values aparivartit rehte hain — jab aapko lowercased segments ki zaroorat ho jabki `{locale}` ko BCP-47 ke roop mein rakhte hue, wahan `{llocale}` ka upyog karein.

| Placeholder            | Bhumika                                                                                                    | Udaharan                                                         |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Is documentation block ke `outputDir` ka absolute suljha hua path                                          | `/home/acme/repo/i18n`                                           |
| `{locale}`             | Target locale code (config / CLI mein jaisa roop hai)                                                      | `de`, `pt-BR`                                                    |
| `{LOCALE}`             | Wahi locale uppercased                                                                                     | `DE`, `PT-BR`                                                    |
| `{llocale}`            | Wahi locale lowercased (Astro route folders jaise `pt-br`, `zh-cn` se milta hai)                               | `de`, `pt-br`                                                    |
| `{relPath}`            | Project root ke sapeksh source file path, POSIX `/`                                                   | `docs/guide.md`, `README.md`                                     |
| `{stem}`               | Extension ke **bina** file name                                                                            | `docs/guide.md` ke liye `guide`                                      |
| `{basename}`           | Extension ke **saath** file name                                                                               | `guide.md`                                                       |
| `{extension}`          | Dot **sahit** extension                                                                            | `.md`, `.mdx`                                                    |
| `{docsRoot}`           | `docsOutput.docsRoot` ka absolute suljha hua path (agar chhod diya jaye to default `docs`)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` jismein ek milta-julta `docsRoot` prefix hata diya gaya hai jab path strings align hote hain (POSIX); anyatha aparivartit | `docs/guide.md` (aam); `guide.md` kewal tab jab stripping lagu hota hai |

**Udaharan**

Config snippet:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Locale `de` aur source `docs/guide.md` ke liye, project root `/home/acme/repo` aur `outputDir` ke saath jo `/home/acme/repo/i18n` mein sulajhta hai, vistarit path hai:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

`docsOutput.style = "flat"` ke saath aur koi custom `pathTemplate` nahi, ek aam pattern kewal file name ko `{stem}` aur `{extension}` ke madhyam se rakhta hai, udaharan ke liye `{outputDir}/{stem}.{locale}{extension}`, jo suljhe hue `outputDir` ke tahat `…/guide.de.md` deta hai.

<a id="troubleshooting"></a>
### Troubleshooting

**Anuvadit docs mein section anchor links kaam nahi karte**

`[label](../../docs/other.md#section-id)` jaisa link sahi anuvadit file khol sakta hai lekin nirdharit heading tak scroll karne mein vifal ho sakta hai — ya galat section par jump kar sakta hai. `#…` fragment ab us locale mein kisi bhi heading `id` se mel nahi khata hai.

Aam kaaran:

- Source headings mein kabhi bhi explicit anchor IDs nahi the; site visible heading text se slugs nikaalti hai, jo translation ke baad badal jaate hain.
- Aapne source mein ek heading ka naam badal diya hai lekin pichli `<a id="…"></a>` line gayab hai ya abhi bhi usmein purana ID hai.
- Anchor links English shabdon se anumaanit `#…` fragment ka upyog karte hain, na ki us ID ka jo `write-heading-ids` generate karega.

**Theek karein**

1. Apne **source** `ai-i18n-tools write-heading-ids` / `.md` par `.mdx` chalayein (vahi `docs[]` / `contentPaths` jaisa `translate-docs`). Yeh har ATX heading se pehle `<a id="slug"></a>` daalta hai, ya maujooda anchor ko refresh karta hai jab heading text ab current slug se mail nahi khata.
2. Anchor links ko un ids par point karein — jaise `[setup](../../docs/guide.md#first-run)` jahan `#first-run` target heading ke upar wale anchor line se mail khata hai, na ki sirf English title se anumaanit slug se.
3. `translate-docs` (ya `sync --force-update`) ko phir se chalayein taaki har locale copy mein updated anchor lines shamil hon.

Badlavon ka preview dekhne ke liye pehle `--dry-run` par `write-heading-ids` ka upyog karein. Poore pattern ke liye [Anchor links in flat layout](#anchor-links-when-docsoutputstyle--flat) dekhein.

---

<a id="workflow-3---json-file-translation"></a>
## Workflow 3 - JSON file translation

Un projects ke liye design kiya gaya hai jo UI copy ko **har locale ke liye nested JSON files** mein rakhte hain (jaise `src/i18n/en/translation.json`) source mein `t("…")` ke bajaye. CLI un files mein string values ko walk karta hai, unhe OpenRouter ke madhyam se translate karta hai, aur `json[].outputPathTemplate` ka upyog karke har locale ke outputs likhta hai. Yeh `translate-docs` aur `translate-svg` (`cacheDir`) ke samaan SQLite cache ka upyog karta hai.

Yah prakriya **nahin** chalta hai `extract` — yahaan koi `strings.json` catalog nahin hai. Ise `features.translateJson` ke saath aur ek ya adhik entry ke saath top-level `json[]` mein saksham karein.

<a id="step-1-initialise-for-nested-json"></a>
### Step 1: Nested JSON ke liye initialise karein

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

Vah template `features.translateJson: true` set karta hai, UI extraction aur document translation ko disable karta hai, aur `src/i18n/en/translation.json` par point karte hue ek single `json[]` block ko output `src/i18n/{llocale}/translation.json` ke saath scaffold karta hai. Apne repo layout ke liye `sourceLocale`, `targetLocales`, `contentPaths`, aur `outputPathTemplate` ko edit karein.

<a id="step-2-configure-json"></a>
### Step 2: `json[]` configure karein

Har `json[]` block ek pipeline ka varnan karta hai:

- `contentPaths` — ek ya ek se adhik `.json` files, directories, ya globs (jaise `"src/i18n/en/translation.json"` ya `"src/i18n/en/overrides/*.json"`). Paths project root se resolve hote hain.
- `outputPathTemplate` — avashyak. Har target locale file kahan likhna hai. Placeholders: `{locale}`, `{LOCALE}`, `{llocale}` (lowercased locale, Astro route folders ke liye upyogi), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (optional) — sirf is block ke liye subset; anyatha root `targetLocales` lagu hota hai.
- `keyPolicy` — kaun si JSON keys translatable prose rakhti hain vs stable identifiers (neeche dekhein).
- `description` (optional) — CLI headers aur `status` output mein dikhaya gaya hai.

Udaaharan (multiple source files, lowercase locale folders):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | Vyavahar |
|-------------|-----------|
| `allowlist` | Sirf `translateKeys` (dot paths; minimatch globs) se mail khane wali keys translate hoti hain. |
| `denylist`  | `skipKeys` se mail khane wali keys ko chhodkar sabhi string values ko translate karein. |
| `both`      | Pehle `translateKeys` lagu karein, phir `skipKeys` se matches hatayein. |

Paths dot notation (`nav.home.label`) ka upyog karte hain. `slug` jaisa ek nanga naam kisi bhi gehrai par antim key segment se mail khata hai.

<a id="step-3-translate-json-bundles"></a>
### Step 3: JSON bundles translate karein

```bash
npx ai-i18n-tools translate-json
```

Vikalpik flags (`translate-docs` jaise hi vichaar): `-l` / `--locale` lakshyon ke upsamuchchay ke liye, `-p` / `--path` files ko seemit karne ke liye, `--dry-run`, `--force` (milit files ke liye file tracking aur segment cache saaf karein), `--force-update` (jab file hash milta hai to phir se process karein; segment cache abhi bhi lagu hota hai), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

Keval JSON projects chal sakte hain:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

Jab UI ya docs bhi saksham hon, to `sync` **translate-docs ke baad translate-json** chalata hai (jab tak ki `--no-json` na ho). `--no-json` ke saath JSON ko chhodein.

Prati file aur locale ke liye coverage jaanchein:

```bash
npx ai-i18n-tools status
```

Jab `translateJson` chalu hota hai, to `status` ek `json[]` section print karta hai (✓ up to date, ● stale ya missing).

<a id="workflow-3-vs-other-pipelines"></a>
### Workflow 3 vs anya pipelines

| Sthiti | Upyog | 
|-----------|-----| 
| JS/TS/Astro mein `t("…")` / `i18n.t("…")` mein UI strings | [Workflow 1](#workflow-1---ui-translation) — `extract` + `translate-ui` |
| Markdown/MDX/`.astro` pages ya README anuvaad | [Workflow 2](#workflow-2---document-translation) — `translate-docs` |
| Docusaurus `write-translations` catalog (`{ "key": { "message": "…", "description": "…" } }`) | Workflow 2 — `docs[].docusaurusCatalogDir` + `translate-docs`, **nahi** `json[]` |
| Standalone nested locale JSON (ZenBrowser-style `translation.json` trees) | Workflow 3 — `json[]` + `translate-json` |
| `<text>` / `<title>` / `<desc>` ke saath chitrit `.svg` files | `features.translateSVG` + [`svg`](#svg) + `translate-svg` (vikalpik; ek sankhyatmak workflow nahi) |

Field reference: [`json`](#json) [Configuration reference](#configuration-reference) mein. Safai ke liye cache keys `file_tracking` mein `json-block:{blockIndex}:{projectRelPath}` ka upyog karte hain.

---

<a id="combined-workflow-ui--docs"></a>
## Sanyukt workflow (UI + Docs)

Dono workflows ko ek saath chalane ke liye ek hi config mein sabhi features saksham karein:

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

<a id="mixed-documentation-workflow-docsoutputstyle--docusaurus--flat"></a>
### Mixed documentation workflow (`docsOutput.style = "docusaurus"` + `"flat"`)

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

---

<a id="translation-dashboard"></a>
## Translation Dashboard

Chalao:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Default listen port **8675** hai. Agar vah port unavailable hai, to server agla port try karta hai (1000 attempts tak) aur us port ko log karta hai jise usne chuna. Deprecated alias `editor` abhi bhi kaam karta hai lekin ek warning print karta hai — `dashboard` ko prefer karein.

Yah aapke configured `cacheDir` SQLite database dwara backed ek local web UI shuru karta hai — wahi folder jise CLI documentation segments, logs, aur related metadata ke liye use karta hai. Ismein **Documentation** (cached doc segments), **UI strings**, **UI plurals**, **Glossary**, **Failures**, **Markdown issues**, aur **Statistics** tabs shamil hain.

![Translation Dashboard](../../docs/translation-dashboard.png)

Agar aap is app mein **cache rows edit karte hain** (jaise documentation segments), to `sync --force-update` ya equivalent translate command ko `--force-update` ke saath chalaayein taaki on-disk outputs cache se match karein; agar repo mein **source text** baad mein badalta hai, to segment hashes badal jaate hain aur purane text ke liye manual edits supersede ho jaate hain.

<a id="failures-document-translation"></a>
### Failures (document translation)

**Failures** tab kewal **documentation** translation ke liye hai. Yah un failure records ko padhta hai jo SQLite mein likhe jaate hain jab ek segment ko kisi locale ke liye safaltapoorvak translate nahi kiya ja saka — jaise empty ya invalid model output, post-translation validation errors (`AST mismatch`, placeholder leaks, aur is tarah ke **quality** checks), ya ek **fatal** condition jisne progress ko roka. Yah aapko jawab dene mein madad karta hai: *kaun sa source segment tuta, kis locale aur model ke liye, aur kya error text record kiya gaya?*

<a id="when-to-use-it"></a>
#### Ise kab use karein

- `translate-docs` ya `sync` errors, partial locales, ya confusing logs ke saath khatam hone ke baad — aap terminal output ko akela scroll karne ke bajaye failures ko sort aur filter kar sakte hain.
- Jab aap **rework ko prioritise karna chahte hain**: **# Failures** dwara sort karein taaki jo segments retries mein baar-baar fail hue hain, ve pehle dikhein; ve source markdown mein **simplify ya reformat** karne ke liye strong candidates hain taaki future runs safal hon.
- Jab aapko **exact segment** chahiye — filepath, line hint, source hash, aur full source text — apne repo mein sahi paragraph ko edit karne ke liye.

<a id="why-source-edits-matter"></a>
#### Source edits kyon mahatva rakhte hain

Dense inline markup (**bold** `` `code` `` ke saath mila hua, nested emphasis, kai spans ke saath lambe vakya) models ke liye aise translations wapas karna mushkil bana deta hai jo abhi bhi structural checks paas karte hain. **Multiple recorded failures** wale segments aam taur par source ko **rewriting ya splitting** (ya examples ko fenced code blocks mein le jaane) se zyada sudharte hain, bajaye unchanged text par translation ko dobara chalane ke. Yah [Complex Markdown and failed quality checks](#complex-markdown-and-failed-quality-checks) ke saath align karta hai.

<a id="how-to-use-the-tab"></a>
#### Tab ka upyog kaise karein

1. Dashboard mein **Failures** kholein (usi browser session mein jaisa ki [Translation Dashboard](#translation-dashboard) mein hai).
2. **Summary** strip padhein (kisi bhi failure wale segments, plus **1**, **2**, ya **3+** failure records wale segments ke liye counts).
3. Partial **filename**, **locale**, **model**, **quality error** (values aapke cache se aate hain), **fatal only**, aur optional **source hash**, **source text**, ya **error message** substring dwara filter karein—phir **Apply** par click karein.
4. **Sort: # Failures** (default) ya **Sort: filepath + line #** chunein.
5. Table ke upar ya neeche pagination ka upyog karein. Poora source text toggle karne ke liye **ek row par click karein**. Row mein link control (jab enable ho) server process ko `ai-i18n-tools dashboard` chal rahe **terminal** par file/line hints log karne ke liye kehta hai—browser se apne editor mein jump karne ke liye upyogi hai.
6. Apne project mein **source file** theek karein, phir se `translate-docs` ya `sync` chalayein. Agar safal run ke baad list **out of date** lagti hai, toh `ai-i18n-tools sync --force-update` chalayein aur dashboard ko reload karein (Failures panel wahi hint dikhata hai).

UI ke saath file-based debugging ke liye, aap abhi bhi retries ke dauran `cacheDir` ke tahat `FAILED-TRANSLATION` detail likhne ke liye `translate-docs --debug-failed` ka upyog kar sakte hain—[Cache behaviour aur `translate-docs` flags](#cache-behaviour-and-translate-docs-flags) dekhein.

<a id="markdown-issues-static-checks"></a>
### Markdown issues (static checks)

**Markdown issues** tab `markdown_source_issues` SQLite table se rows list karta hai. Har row ek **pre-translation** khoj hai: jaise delimiter runs jo kabhi bhi CommonMark-style rules ke tahat emphasis/strikethrough ke roop mein pair nahi karte hain jinhe `translate-docs` masking ke liye upyog karta hai, ek inline code span jo backticks ke saath khola gaya hai lekin kabhi band nahi kiya gaya hai, ya `STRONG_OUTSIDE_LINK` jab `**` / `__` ek `[text](../../docs/url)` link ko wrap karte hain (bold ko kewal link text ke andar rakhein). Yeh **Failures** ke samaan **nahi** hai, jo per-locale model output aur post-translation validation problems (`AST mismatch`, placeholder leaks, aur is tarah ke) record karta hai.

Is tab ka upyog tab karein jab aap tokens kharch karne se pehle **source markdown** theek karna chahte hain—khaaskar jab quality checks structure par fail hote rehte hain. Filepath (cache key ke khilaaf partial match, jismein `doc-block:{index}:` prefixes shamil hain), **issue code**, ya **source hash** dwara filter karein; filepath + line ya newest scan time dwara sort karein. Link button terminal par file/line hints log karta hai jahan `ai-i18n-tools dashboard` chal raha hai (Documentation tab ke samaan idea).

**Panktiyon ko refresh karna:** `ai-i18n-tools check-markdown` chalaen (vaikalpik `-p` / `--path` scope, SQLite ko chhodne ke liye `--no-cache`, stderr par manav panktiyon ke saath stdout par machine-readable output ke liye `--json`). Default roop se har `translate-docs` markdown file run us file ke liye panktiyon ko bhi rescans aur replace karta hai jab `docs[].warnMarkdownSourceIssues` ko `false` par set nahin kiya jaata hai. Cache filepath ke liye sabhi translations ko clear karne se us filepath ke liye markdown issue panktiyan hat jaati hain, jo failures ke samaan cleanup path ka hissa hai. `cleanup` un markdown issue panktiyon ko atirikt roop se prunes karta hai jinka resolved source path disk par gayab hai, isliye delete kiye gaye ya rename kiye gaye files ke liye diagnostics (yahan tak ki ve jo kewal `check-markdown` dwara scan kiye gaye the, kabhi translate nahin kiye gaye) bane nahin rahte.

---

<a id="configuration-reference"></a>
## Configuration reference

<a id="sourcelocale"></a>
### `sourceLocale`

Source language ke liye BCP-47 code (jaise `"en-GB"`, `"en"`, `"pt-BR"`). Is locale ke liye koi translation file generate nahi hoti hai — key string khud source text hai.

Aapke runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`) se export kiye gaye `SOURCE_LOCALE` se **match hona chahiye**.

<a id="targetlocales"></a>
### `targetLocales`

Translate karne ke liye BCP-47 locale codes ka array (jaise `["de", "fr", "es", "pt-BR"]`).

`targetLocales` UI translation ke liye primary locale list hai aur documentation blocks ke liye default locale list hai. `generate-ui-languages` ka upyog `sourceLocale` + `targetLocales` se `ui-languages.json` manifest banane ke liye karein.

<a id="uilanguage-optional"></a>
### `uiLanguage` (vaikalpik)

BCP-47 code tool ke khud ke UI bhasha ke liye (CLI madad, logs/saraansh, aur Translation Dashboard). Yah `sourceLocale` / `targetLocales` se svatantr hai, aur `-L` / `--ui-lang` flag aur `AI_I18N_LANG` environment variable dwara override kiya jaata hai. Anjaan maanon ke liye source locale (`en-GB`) mein gracefully degrade hota hai — koi sakht validation nahin hai. [Tool UI bhasha](#tool-ui-language) dekhen.

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (optional)

Display names, locale filtering, aur language-list post-processing ke liye upyog kiye gaye `ui-languages.json` manifest ka path. Jab chhod diya jata hai, toh CLI manifest ko `ui.flatOutputDir/ui-languages.json` par khojta hai.

Iska upyog tab karein jab:

- Manifest `ui.flatOutputDir` ke bahar rehta hai aur aapko CLI ko is par explicitly point karne ki zaroorat hai.
- Aap [language switcher post-processing](#language-switcher-languagelistblock) (`languageListBlock`) chahte hain ki manifest se locale labels banaye.
- `extract` ko manifest se `englishName` entries ko `strings.json` mein merge karna chahiye (`ui.reactExtractor.includeUiLanguageEnglishNames: true` ki zaroorat hai).

<a id="concurrency-optional"></a>
### `concurrency` (optional)

Ek saath anuvaad kiye gaye adhiktam **lakshya sthaan** (`translate-ui`, `translate-docs`, `translate-svg`, aur `sync` ke andar milte-julte steps). Yadi chhod diya jaata hai, to CLI UI anuvaad ke liye **4** aur documentation anuvaad ke liye **3** (built-in defaults) ka upyog karta hai. `-j` / `--concurrency` ke saath har run ke liye override karen.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (vikalpik)

**translate-docs** aur **translate-svg** (aur `sync` ka documentation step): prati file adhiktam parallel OpenRouter **batch** requests (har batch mein kai segments ho sakte hain). Chhodne par default **4**. `translate-ui` dwara ignore kiya gaya. `-b` / `--batch-concurrency` ke saath override karen. `sync` par, `-b` keval documentation anuvaad step par lagu hota hai.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (vikalpik)

`translate-docs` aur `sync` ke dauraan **ek hi locale ke bheetar** ek saath process kiye jaane wale files ki adhiktam sankhya. Jab **1** se adhik value par set kiya jaata hai, to ek hi locale ke bheetar files ko memory upyog ko niyantrit karne ke liye semaphore ka upyog karke parallel mein process kiya jaata hai. Chhodne par default **1** (sequential processing). Uchch values I/O-bound operations ke liye throughput mein mahatvapurna sudhaar kar sakti hain, khaaskar jab sabhi segments pehle se hi cache kiye gaye hon (koi API calls ki avashyakta nahin).

**Udharan:**

```json
{
  "fileConcurrency": 4
}
```

**Upyog ka mamla:** Kul processing samay ko kam karne ke liye 100% cache hits ke saath `sync --force-update` chalate samay ise `2-4` par set karen. Sudhaar kai chhoti files ke saath sabse adhik dhyan dene yogya hai.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (vikalpik)

Document anuvaad ke liye segment batching: prati API request kitne segments, aur ek character ceiling. Defaults: **20** segments, **4096** characters (jab chhod diya jaata hai).

<a id="openrouter"></a>
### `provider` aur `providers`

`provider` (top-level, vikalpik) `providers` se active provider key ka chayan karta hai. Jab theek ek provider configure kiya jaata hai to yah vikalpik hota hai; jab ek se adhik configure kiye jaate hain to avashyak hota hai.

`providers` (top-level) ek provider key ko uske block se map karta hai. Built-in keys (neeche di gayi preset table dekhen) ko keval `translationModels` ki avashyakta hoti hai; koi anya key ek custom OpenAI-compatible endpoint ko paribhashit karti hai aur `baseUrl` ki avashyakta hoti hai (plus `apiKeyEnv` jab tak ki endpoint ko kisi key ki avashyakta na ho).

Har `providers.<name>` block swikaar karta hai:

- `translationModels`
  Model IDs ki pasandeeda ordered list (plain upstream ids, koi `provider/` prefix nahin; OpenRouter ids apne native `vendor/model` form ko banaye rakhte hain). Pehla pehle try kiya jaata hai; baad ke entries error par fallbacks hain. Keval `translate-ui` ke liye, aap is list se pehle ek model try karne ke liye `ui.preferredModel` bhi set kar sakte hain (`ui` dekhen).
- `baseUrl`
  OpenAI-compatible base URL. Preset base URL ko override karta hai; non-preset provider ke liye avashyak hai.
- `apiKeyEnv`
  API key rakhne wala environment variable. Preset env var ko override karta hai.
- `headers`
  Is provider ko har request ke saath bheje gaye atirikt HTTP headers.
- `maxTokens`
  Prati request adhiktam completion tokens. Default: `8192`.
- `temperature`
  Sampling temperature. Default: `0.2`.
- `requestTimeoutMs`
  Har request ke liye intazaar karne ka adhiktam samay milliseconds mein. Default: `30000` (30 seconds).

Built-in provider presets (key — base URL — API-key env var):

| Provider | Base URL | API-key env var |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (koi nahi) |

Ek legacy top-level `openrouter` block (jismein `baseUrl`, `translationModels`, `defaultModel`, `fallbackModel`, `maxTokens`, `temperature`, `requestTimeoutMs`) abhi bhi swikar kiya jata hai aur load hone par `providers.openrouter` (jismein `provider: "openrouter"`) mein auto-migrate ho jata hai; `defaultModel` / `fallbackModel` `translationModels` mein fold ho jate hain.

Ek chalne yogya udaharan ke liye jo ek hi config mein kai providers ko configure karta hai aur `-P` ke saath unke beech switch karta hai, dekhen [`examples/multi-provider`](../../docs/../examples/multi-provider/) (`openai`, `anthropic`, `nvidia`, aur `deepseek` ek hi document par).

**Kai models ka upyog kyon karen:** Vibhinn providers aur models ki lagat alag-alag hoti hai aur ve bhashaon aur locales mein alag-alag star ki gunvatta pradan karte hain. `translationModels` ko **ek ordered fallback chain ke roop mein configure karen** (ek single model ke bajaye) taki yadi koi request fail ho jaye to CLI agle model ko prayas kar sake.

Niche di gayi suchi ko ek **baseline** ke roop mein dekhen jise aap badha sakte hain: yadi kisi vishesh locale ke liye anuvad kharab ya asafal hai, to shodh karen ki kaun se models us bhasha ya script ko prabhavi dhang se support karte hain (online sansadhanon ya apne provider ke documentation ka sandarbh len), aur un OpenRouter IDs ko aur vikalpon ke roop mein joden.

Yah suchi 36 target locales ke saath ek bade documentation project mein **vyapak locale coverage ke liye parikshit ki gayi thi**; yah ek vyavaharik default ke roop mein karya karti hai, lekin har locale ke liye achha pradarshan karne ki guarantee nahi hai.

Udaharan `translationModels` (`npx ai-i18n-tools init` ke saman defaults):

<details>
<summary>Default translationModels fallback list</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

Apne environment ya `.env` file mein active provider ka API-key env var (jaise `OPENROUTER_API_KEY`) set karen.

`translationModels` badalne se pehle, `npx ai-i18n-tools check-models` chalayen. Kisi bhi provider ke liye yah har configured model id ko us provider ki live model list (`GET /models`) ke khilaf verify karta hai, gayab ya `expiration_date` se aage ki ids ki report karta hai, valid models ki suchi banata hai, aur jab koi configured id invalid hoti hai to non-zero exit karta hai. Jab provider pricing wapas karta hai (jaise OpenRouter) to yah anumanit input/output pricing (USD prati 1M tokens) bhi dikhata hai.

<a id="features"></a>
### `features`

| Field | Workflow | Description |
|---|---|---|
| `translateUIStrings` | 1 | `t("…")` / `i18n.t("…")` ko `strings.json` mein nikalen, phir entries ka anuvad karen aur prati-locale flat JSON likhen (extraction apne aap chalta hai; catalog ko keval refresh karne ke liye standalone `extract` ka upyog karen). |
| `translateDocs` | 2 | `.md` / `.mdx` / `.astro` pages ka anuvad karen; Docusaurus shell JSON jab `docs[].docusaurusCatalogDir` set ho. |
| `translateJson` | 3 | `json[]` (`translate-json`) ke tahat manmana nested JSON. |
| `translateSVG` | — | `.svg` files ka anuvad karen (top-level `svg` block ki avashyakta hai). |

SVG files ka `translate-svg` ke saath **anuvad karen** jab `features.translateSVG` true ho aur ek top-level `svg` block configure kiya gaya ho. `sync` command us step ko chalata hai jab dono set hon (jab tak `--no-svg` na ho).

<a id="ui"></a>
### `ui`

- `sourceRoots`
Directories ya glob patterns (cwd ke sapeksh) `t("…")` calls ke liye scan kiye gaye. `src/` ya `["src/**/*.ts"]` jaise patterns ko support karta hai.
- `stringsJson`
Master catalog file ka path. `extract` dwara update kiya gaya.
- `flatOutputDir`
Directory jahan prati-locale JSON files likhe jate hain (`de.json`, aadi).
- `preferredModel`
Optional. Model id pehle keval `translate-ui` ke liye try kiya gaya; phir active provider ka `translationModels` kram mein, is id ko duplicate kiye bina.
- `uiExtractor.funcNames` (ya legacy `reactExtractor.funcNames`)
Scan karne ke liye atirikt function names (default: `["t", "i18n.t"]`).
- `uiExtractor.extensions` (ya legacy `reactExtractor.extensions`)
Shamil karne ke liye file extensions (default: `[".js", ".jsx", ".ts", ".tsx"]`). Astro frontmatter aur template expressions ke liye `.astro` joden.
- `uiExtractor.includePackageDescription` (ya legacy `reactExtractor.includePackageDescription`)
Jab `true` (default), `extract` mein `package.json` `description` bhi shamil hota hai jab maujood ho to ek UI string ke roop mein.
- `uiExtractor.packageJsonPath` (ya legacy `reactExtractor.packageJsonPath`)
Us optional description extraction ke liye upyog kiye jane wale `package.json` file ka custom path.
- `uiExtractor.includeUiLanguageEnglishNames` (ya legacy `reactExtractor.includeUiLanguageEnglishNames`)

Jab `true` (default `false`), `extract` manifest se har `englishName` ko `uiLanguagesPath` par `strings.json` mein bhi jodta hai jab source scan se pehle se maujood na ho (same hash keys). `uiLanguagesPath` ko ek valid `ui-languages.json` ki or ishara karne ki avashyakta hai.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite cache directory (sabhi `docs` blocks dwara saajha kiya gaya). Runs mein punah upyog karen. Yadi aap custom doc translation cache se migrate kar rahe hain, to use archive ya delete kar den — `cacheDir` apna khud ka SQLite database banata hai aur anya schemas ke saath compatible nahin hai.

<a id="best-practice-for-git-exclusions"></a>
#### Git exclusions ke liye sabse achha abhyas:

- Translation cache folder ki samagri ko exclude karen (udharan ke liye, `.gitignore` ya `.git/info/exclude` ka upyog karke) temporary cache artefacts ko commit hone se rokne ke liye.
- `cache.db` ko banaye rakhen (ise niyamit roop se delete na karen), kyunki SQLite cache ko banaye rakhne se aparivartit segments ka punah anuvad hone se bachta hai. Yah `ai-i18n-tools` ka upyog karne wale software ko update ya modify karte samay runtime aur API dono costs bachata hai.
- Backup aur debug-related files ko commit hone se bachne ke liye temporary aur log files ko exclude karen.

<br/>

**Udharan:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

Documentation pipeline blocks ka array. `translate-docs` aur `sync` ka docs phase **har** block ko kram mein process karta hai. Legacy keys (`documentations`, `markdownOutput`, `jsonSource`) abhi bhi load time par swikar kiye jate hain aur config file writable hone par rewrite kiye jate hain; nayi configs mein `docs`, `docsOutput`, aur `docusaurusCatalogDir` ko prefer karen.

**Content sources**

- `description`
Is block ke liye vikalpik manav-pathaniya note (anuvad ke liye upyog nahin kiya gaya hai). Jab set kiya jata hai to `translate-docs` `🌐` shirshak mein pratyay lagaya jata hai; `status` anubhag shirshakon mein bhi dikhaya jata hai.
- `contentPaths`
Markdown/MDX page bodies aur `.astro` templates ka anuvad karne ke liye (`translate-docs` inhen `.md`, `.mdx`, aur `.astro` ke liye scan karta hai). **Directory paths ya glob patterns** ka samarthan karta hai (jaise `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). Yahin se sthaniya documentation prose aata hai.
- `sourceFiles`
Load hone par `contentPaths` mein mila hua vikalpik alias.
- `targetLocales`
Is block ke liye locales ka vikalpik upsamuchchay (anyatha root `targetLocales`). Prabhavi documentation locales blocks ke paar ka union hain.
- `docusaurusCatalogDir`
Vikalpik. Is block ke liye Docusaurus JSON label catalogs ke liye source directory (jaise `"i18n/en"` `docusaurus write-translations` se). Page bodies hamesha `contentPaths` se aate hain; `docusaurusCatalogDir` keval shell/UI JSON pradan karta hai, MDX nahin.

**Output layout**

- `outputDir`
Is block ke liye anuvadit output ke liye root directory.
- `docsOutput.style`
`"nested"` (default), `"flat"`, `"doc-system"`, ya aliases `"docusaurus"` / `"astro-starlight"`.
- `docsOutput.localeSubpath`
`{locale}/` aur `{relativeToDocsRoot}` ke beech `doc-system` ke liye path segment (jab `style: "doc-system"` ka sidhe upyog karte hain to avashyak; alias ka upyog karte samay preset). Starlight-style locale folders ke liye `""` ka upyog karen.
- `docsOutput.docsRoot`
Docusaurus layout ke liye source docs root (jaise `"docs"`).
- `docsOutput.pathTemplate`
Custom markdown output path. Placeholders: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
Label files ke liye custom JSON output path. `pathTemplate` ke saman placeholders ka samarthan karta hai.
- `docsOutput.localePathLowercase`
Jab `true`, built-in output layouts (`nested`, `flat`, `doc-system` bina `pathTemplate`) paths mein lowercased locale segments ka upyog karte hain. Default `false`; `astro-starlight` aur `doc-system` khali `localeSubpath` ke saath config load par `true` par default hote hain.
- `docsOutput.flatPreserveRelativeDir`
Jab `docsOutput.style = "flat"`, source subdirectories ko banaye rakhen taki saman basename wali files takrayen nahin.
- `docsOutput.rewriteRelativeLinks`
Anuvad ke baad relative links ko rewrite karen (jab `docsOutput.style = "flat"` aur koi custom `pathTemplate` nahin ho to svatah saksham ho jata hai).
- `docsOutput.linkRewriteDocsRoot`
Flat-link rewrite prefixes ki ganana karte samay upyog kiya gaya repo root. Aam taur par ise `"."` ke roop mein chhod den jab tak ki aapke anuvadit docs kisi alag project root ke tahat na hon.

**Post-processing**

- `docsOutput.postProcessing`
Anuvadit **markdown body** par vikalpik transforms (YAML keys aur non-prose front matter values surakshit rakhe jate hain). Segment reassembly aur flat link rewriting ke baad, aur `addFrontmatter` se pahle chalta hai.
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` ki kramabaddh suchi. `search` ek regex pattern hai (plain string flag `g`, ya `/pattern/flags` ka upyog karta hai). `replace` placeholders jaise `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` ka samarthan karta hai.
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — source aur anuvadit markdown mein ek simit "doosri bhashaon mein padhen" link row ko punarutpadit karta hai. Setup, behaviour, aur repository examples ke liye [Language switcher (`languageListBlock`)](#language-switcher-languagelistblock) dekhen.

**Behaviour aur metadata**

- `translateFrontmatterFields`
`docsOutput` ke samaan star par (prati `docs[]` block). Default `true`: Starlight/Docusaurus ke liye user-facing YAML prose ka anuvaad karein (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next` labels). Poore front matter block ko aparivartit rakhne ke liye `false` set karein; vishisht dot-paths tak seemit karne ke liye ek string array pass karein.
- `segmentSplitting`
`docsOutput` ke samaan star par (prati `docs[]` block). `translate-docs` extraction ke liye vaikalpik finer-grained segments: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`. Jab `enabled` `true` ho (default jab `segmentSplitting` chhod diya jaata hai), ghane paragraphs, GFM pipe tables (pahle chunk mein header, separator, aur pahli data row shamil hoti hai), aur lambi lists ko split kiya jaata hai; sub-parts single newlines (`tightJoinPrevious`) ke saath phir se judte hain. Keval blank-line-delimited body block ke liye ek segment ka upyog karne ke liye `"enabled": false` set karein. Jab `qualityRetrySplit` `true` ho (default), markdown segments jo sabhi models ke khatm hone ke baad AST validation mein fail ho jaate hain, unhe dheere-dheere split kiya jaata hai aur pahle model se phir se prayas kiya jaata hai; `maxQualityRetrySplitDepth` (default `3`) recursive splits ko cap karta hai.
- `warnMarkdownSourceIssues`
Jab `true` ho (default jab chhod diya jaata hai), har `translate-docs` run risky delimiters / unclosed inline code ke liye markdown segments ko phir se scan karta hai, terminal warnings print karta hai, aur us file ke cache filepath ke liye `markdown_source_issues` rows ko badal deta hai. Is block ke liye warnings aur SQLite updates ko chhodne ke liye `false` set karein.
- `addFrontmatter`
Jab `true` ho (default jab chhod diya jaata hai), anuvaadit markdown files mein YAML keys shamil hote hain: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, aur jab kam se kam ek segment mein model metadata ho, `translation_models` (upyog kiye gaye OpenRouter model ids ki sorted list). Chhodne ke liye `false` par set karein.

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
Vaikaipik. Atirikt JSX/HTML attribute names jinke **quoted string values** ko translator ko nahi bheja jaana chahiye. Built-in defaults (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, adhiktar `aria-*`, aadi) ke saath merge kiya gaya. Case-insensitive. Lagu hota hai:

- `.astro` parse-and-replace extraction (static HTML tags aur string literals `{expression}` blocks ke andar `attr=` ke baad).
  - Markdown/Astro segment translation ke dauraan MDX placeholder extraction (`label`, `tooltip`, aur `aria-label` capitalised JSX tags par, plus `TabItem` `value` jab lagu ho).

Udaaharan: `"protectAttributes": ["variant", "size"]` `variant="primary"` ko `{items.map(...)}` ke andar locales mein aparivartit rakhta hai.

Aap normally anuvaadit hone wale attributes (jaise `"title"` ya `"aria-label"`) ko bhi list kar sakte hain jab aap un values ko English se verbatim copy karna chahte hain.

- `protectKeys`
Vaikaipik. Atirikt **object property names** jinke quoted string values ko template `{expression}` blocks aur MDX object literals (jaise `label:` `<Tabs values={[ … ]}>` ke andar) ke andar anuvaad nahi kiya jaana chahiye. Built-in defaults (`class`, `key`, `id`, `href`, `src`, aadi) ke saath merge kiya gaya. Case-insensitive.

Udaaharan: `"protectKeys": ["slug", "code"]` `{ slug: 'getting-started', title: 'Getting started' }` ko chhod deta hai → keval `title` ka anuvaad kiya jaata hai jab `slug` surakshit ho.

<br/>

**Udaaharan (`docsOutput.style = "flat"` — screenshot paths + vaikalpik bhasha list wrapper):**

<details>
<summary>Flat layout postProcessing udaaharan (screenshots + languageListBlock)</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

Nested JSON translation pipelines ka top-level array. Keval tab upyog kiya jaata hai jab `features.translateJson` true ho (`translate-json` ya `sync` ka JSON stage). [Workflow 3 - JSON file translation](#workflow-3---json-file-translation) dekhein.

| Field | Vivaran |
|-------|-------------|
| `description` | CLI / `status` ke liye vaikalpik note (anuvaadit nahi). |
| `contentPaths` | Project root ke antargat source `.json` files, directories, ya globs. |
| `outputPathTemplate` | Prati target locale ke liye avashyak output path. Placeholders: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`. |
| `targetLocales` | Is block ke liye vaikalpik subset; anyatha root `targetLocales`. |
| `keyPolicy.mode` | `allowlist`, `denylist`, ya `both`. |
| `keyPolicy.translateKeys` | Dot paths / globs shamil karne ke liye jab mode `allowlist` ya `both` ho. |
| `keyPolicy.skipKeys` | Dot paths / globs ko chhodne ke liye (default denylist mein `id`, `slug`, `href`, `url`, `key`, `code` shamil hain). |

<a id="svg"></a>
### `svg`

SVG files ke liye top-level path aur layout. Anuvaad tabhi chalta hai jab `features.translateSVG` true ho (`translate-svg` ya `sync` ke SVG stage ke madhyam se).

| Field            | Description                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | Ek ya ek se adhik directories **ya glob patterns** (jaise `"images/*.svg"`, `"**/icons/*.svg"`). Patterns ko project root ke saapeksh hal kiya jaata hai aur `.svg` files ke liye recursively scan kiya jaata hai.                                                                         |
| `outputDir`      | Anuvaadit SVG output ke liye root directory.                                                                                                                                                                                                                          |
| `style`          | `"flat"` ya `"nested"` jab `pathTemplate` unset ho.                                                                                                                                                                                                               |
| `pathTemplate`   | Custom SVG output path. Placeholders: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `localePathLowercase` | Jab `true`, built-in `flat` / `nested` SVG layouts lowercased locale segments ka upyog karte hain. Custom `pathTemplate` values aparivartit rahte hain; lowercase segments ke liye `{llocale}` ka upyog karein. |
| `forceLowercase` | SVG reassembly par lower-case anuvaadit text. Un designs ke liye upyogi jo all-lowercase labels par nirbhar karte hain.                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Field          | Description                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | `strings.json` ka path - maujooda anuvaadon se ek glossary auto-build karta hai.                                                                                                 |
| `userGlossary` | Columns `Original language string` (ya `en`), `locale`, `Translation` ke saath ek CSV ka path - har source term aur target locale ke liye ek row (`locale` sabhi targets ke liye `*` ho sakta hai). |

**Ek khali glossary CSV generate karein:**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI reference

| Command                                                                                                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                                  | CLI version aur build timestamp print karein (root program par `-V` / `--version` jaisi hi jaankari).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website\|ui-json-bundles] [-o path] [--with-translate-ignore]` | Ek starter config file likhen (ismein `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, aur `docs[].addFrontmatter` shamil hain). `ui-json-bundles` Workflow 3 ko scaffold karta hai (sirf `json[]`). `--with-translate-ignore` ek starter `.translate-ignore` banata hai. |
| `check-models` | Active provider ki `GET /models` list (sadasyata aur `expiration_date`) ke khilaf har configured model id ko validate karein, us provider ki API key ki avashyakta hai (Ollama jaise keyless providers ke liye koi nahi), jab koi configured id gayab ya samapt ho jati hai to non-zero exit karta hai, aur provider ke `requestTimeoutMs` ka samman karta hai. Jab provider pricing return karta hai (jaise OpenRouter), to prompt/completion ke liye 1M tokens ke hisab se USD bhi dikhata hai. |
| `list-models` | Active provider dwara uski `GET /models` list ke madhyam se advertise kiye gaye har model ko list karein (id dwara sort kiya gaya; active provider config `provider` key ka palan karta hai, `-P` / `--provider` ke saath override karein). Us provider ki API key ki avashyakta hai (Ollama jaise keyless providers ke liye koi nahi). Jab provider pricing return karta hai (jaise OpenRouter), to prompt/completion ke liye 1M tokens ke hisab se USD bhi dikhata hai, aur `expiration_date` ke baad ki entries ko tag karta hai. |
| `list-languages [search]` | Bundled UI languages catalog (`data/ui-languages-complete.json`) ko ek human-readable table (code, text direction, English name, native name) ke roop mein list karein; iske liye kisi config ya API key ki zaroorat nahi hai. Ek optional `search` term pass karein taaki sirf un entries ko rakha ja sake jinka code, native name, English name, ya direction ismein shamil ho (case-insensitive), jaise ki `list-languages portuguese`, `list-languages rtl`, `list-languages zh`. |
| `extract`                                                                                                  | `strings.json` ko `t("…")` / `i18n.t("…")` literals, vaikalpik `package.json` vivaran, aur vaikalpik manifest `englishName` entries (dekhen `ui.reactExtractor`) se update karen. Jab `.html` / `.htm` `ui.uiExtractor.extensions` mein soochibaddh hote hain, to HTML se `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` marker strings bhi capture karta hai. Non-empty `ui.sourceRoots` ki zaroorat hai. LLM ko call nahin karta hai.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `mark-html [paths...] [--write]`                                                                           | HTML mein `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` markers daalein taaki source text ek baar hi likha jaaye (element par). Diye gaye files/dirs/globs ko scan karta hai (default: `.html` / `.htm` `ui.sourceRoots` ke andar). Default roop se dry run (prati-file add counts aur koi bhi mixed-content elements jo manual `<span data-i18n>` chahte hain, unke baare mein report karta hai); `--write` changes laagu karta hai. Idempotent, `data-i18n-ignore` ka sammaan karta hai (element aur uske subtree ko skip karta hai), code-like elements (`code`, `pre`, `kbd`, `samp`, `var`) ya khaali/sirf-ank wale text ko kabhi nahi chhoota, aur kabhi bhi valued marker nahi nikaalta. LLM ko call nahi karta hai.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `generate-ui-languages [--master <path>] [--dry-run]` | `ui-languages.json` ko `ui.flatOutputDir` (ya set hone par `uiLanguagesPath`) mein `sourceLocale` + `targetLocales` aur bundled `data/ui-languages-complete.json` (ya `--master`) ka upyog karke likhein. Master file se gayab locales ke liye warn karta hai aur `TODO` placeholders emit karta hai. Agar aapke paas customized `label` ya `englishName` values ke saath ek existing manifest hai, to unhein master catalog defaults se badal diya jayega — baad mein generate ki gayi file ki review karein aur adjust karein. |
| `translate-docs …` | Har ek `docs` block (`contentPaths`, optional `docusaurusCatalogDir`) ke liye markdown/MDX aur JSON ka anuvad karein. `-j`: adhiktam samantar sthaniya bhashaen; `-b`: prati file adhiktam samantar batch API calls. `--prompt-format`: batch wire format (`xml` \| `json-array` \| `json-object`). [Cache vyavahar aur `translate-docs` flags](#cache-behaviour-and-translate-docs-flags) aur [Batch prompt format](#batch-prompt-format) dekhein. |
| `write-heading-ids …` | Kam se kam ek `docs[]` block ki avashyakta hai. Har block ke `contentPaths` ke tahat `.md` / `.mdx` ikattha karta hai (`.translate-ignore` ka samman karta hai). Har flat ATX `#` heading (fenced code blocks ke andar headings ko chhodkar) se theek **pahle** ek HTML anchor line `<a id="slug"></a>` dalta hai; jab ek anchor line pahle se maujood ho, to yadi yah vartaman heading text se prapt slug se mel nahin khata hai to `id` ko update karta hai. `-p` / `--path` ya `-f` / `--file`: ek project-relative file ya directory tak seemit karein. `--slug-style`: `github` (default; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. `pymdown` ke saath, optional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run`: keval badlavon ko soochibaddh karein. |
| `check-markdown …` | Har `docs[]` block ke `contentPaths` ke tahat markdown/MDX scan karta hai (`translate-docs` jaisi hi khoj, `.translate-ignore` ka samman karta hai): delimiter pairing, unclosed inline code, aur `STRONG_OUTSIDE_LINK` jab `**`/`__` ek `[text](../../docs/url)` link ko wrap karte hain. `-p` / `--path` ya `-f` / `--file`: optional scope. **stderr** par `relativePath:line: [ISSUE_CODE] message` lines print karta hai; yadi koi samasya ho to exit code **1**. `--json`: **stdout** par JSON report. `cacheDir` mein `markdown_source_issues` likhta hai jab tak ki `--no-cache` na ho. `-v` stderr lines mein source hashes jodta hai. |
| `translate-svg …` | `config.svg` (docs se alag) mein configure kiye gaye SVG files ka anuvad karein. Iske liye `features.translateSVG` ki zaroorat hai. Docs jaise hi cache ke vichaar; us run ke liye SQLite reads/writes ko chhodne ke liye `--no-cache` ko support karta hai. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`. |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]` | Sirf UI strings ka anuvad karein (`strings.json` → locale JSON). `-l` / `--locale`: comma-separated target locales (config / `ui-languages.json` se default). `--force`: har locale ke liye sabhi entries ko phir se anuvad karein (maujooda anuvadon ko ignore karein). `--dry-run`: koi writes nahi, koi API calls nahi. `-j`: max parallel locales. Iske liye `features.translateUIStrings` ki zaroorat hai. |
| `translate-json …` | `json[]` ke anusaar nested JSON ka anuvad karein (iske liye `features.translateJson` ki zaroorat hai). Shared SQLite cache; `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`. [Workflow 3](#workflow-3---json-file-translation) dekhein. |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]` | UI string nikalen, phir anuvad karen (`features.translateUIStrings` ki avashyakata hai). Sirf UI — koi documentation, SVG, ya `json[]` nahi. `translate-ui` ke saman `-l`, `--force`, `--dry-run`, aur `-j` vikalp. |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]` | `extract` ko **pahle** chalata hai (`features.translateUIStrings` ki avashyakata hai) taki `strings.json` source se mel khae, phir **source-locale** UI string ki LLM review (spelling, grammar). **Terminology hints** sirf `glossary.userGlossary` CSV se aate hain (`translate-ui` ke saman scope — `strings.json` / `uiGlossary` nahi, isliye kharab copy glossary ke roop mein mazboot nahi hoti). Active LLM provider ka upyog karta hai (uska API-key env var). Sirf salahkari (jab run poora ho jae to exit **0**). `cacheDir` ke tahat `lint-source-results_<timestamp>.log` ko ek **manav-pathaniya** report ke roop mein likhta hai (sankshipt vivaran, samasyaen, aur prati-string **OK** panktiyan); terminal sirf sankshipt ganana aur samasyaen print karta hai (prati string koi `[ok]` pankti nahi). Antim pankti par log filename print karta hai. `--json`: sirf stdout par poori machine-pathaniya JSON report (log file manav-pathaniya rahti hai). `--dry-run`: phir bhi `extract` chalata hai, phir sirf batch plan print karta hai (koi API call nahi). `--chunk`: prati API batch string (default **50**). `-j`: adhiktam parallel batch (default `concurrency`). `--json` ke sath, manav-shaili output stderr par jata hai. Links `path:line` ka upyog karte hain jaise `dashboard` UI strings "link" button. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | `strings.json` ko XLIFF 2.0 mein export karen (prati target locale ek `.xliff`). `-o` / `--output-dir`: output directory (default: catalog ke saman folder). `--untranslated-only`: sirf ve units jinmein us locale ke liye anuvad nahi hai. Read-only; koi API nahi. |
| `sync …` | Nikalein (yadi saksham ho), phir UI anuvad, phir `translate-svg` jab `features.translateSVG` aur `config.svg` set hon, phir dastavej anuvad, phir `translate-json` jab `features.translateJson` aur `json[]` set hon — jab tak ki `--no-ui`, `--no-svg`, `--no-docs`, ya `--no-json` ke saath chhoda na gaya ho. Saajha jhande: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (dastavej aur JSON batching), `--force` / `--force-update` (dastavej aur JSON). Dastavej charan `--emphasis-placeholders` aur `--debug-failed` ko bhi aage badhata hai (`translate-docs` ke samaan arth). `--prompt-format` ek `sync` jhanda nahi hai; dastavej aur JSON charan built-in default (`json-array`) ka upyog karte hain. |
| `status [--max-columns <n>]` | Jab `features.translateUIStrings` chalu ho, to prati sthaniya (locale) UI coverage print karta hai (`Translated` / `Missing` / `Total`). Phir prati file × sthaniya (locale) markdown anuvad sthiti print karta hai (koi `--locale` filter nahi; sthaniya config se aate hain). Badi sthaniya suchiyon ko `n` sthaniya column (default **9**) tak ki dohrai gayi talikaon mein vibhajit kiya jata hai taaki terminal mein linein sankri rahen. |
| `statistics [--max-columns <n>]` | Documentation cache aur `strings.json` statistics print karein (Translation Dashboard → **Statistics** ke samaan aggregates). `--max-columns`: prati model × locale table mein adhiktam locale columns (default dashboard se mel khata hai). |
| `cleanup [--dry-run] [--backup <path>]` | pahle `sync --force-update` (extract, UI, SVG, docs) chalata hai, phir stale segment rows (null `last_hit_at` / empty filepath) ko hatata hai; un `file_tracking` rows ko drop karta hai jinka resolved source path disk par missing hai; un translation rows ko hatata hai jinka `filepath` metadata ek missing file ki taraf ishara karta hai; orphaned `translation_failures` rows ko prune karta hai; un orphaned `markdown_source_issues` rows ko prune karta hai jinka resolved source path disk par missing hai. Paanch counts (stale segments, orphaned `file_tracking`, orphaned translations, orphaned failures, orphaned markdown issues) ko log karta hai. Koi SQLite backup nahi banaya jata jab tak ki `--backup <path>` pass na kiya jaye, jo modifications se pahle us path par ek backup likhta hai. |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]` | **Koi config nahi.** Ek directory tree (default: cwd) ko `*.log` aur `cache.db.backup*.sqlite` ke liye chalata hai, `./…` paths jaise `find -print` print karta hai. Matches ke saath: `Delete these files? (y/n)` prompt karta hai jab tak ki `-f` / `--force` (bina prompt ke delete karein) na ho. Koi match na hone par: bina prompt ke exit karta hai. `--dry-run`: kewal list karein, koi prompt ya delete nahi (`--force` ko override karta hai). |
| `dashboard [-p <port>] [--no-open]` | Translation Dashboard launch karein (cache segments, `strings.json`, glossary, failures, aur statistics ke liye local web UI). Default port **8675** (agar anupalabdh ho to agle port par retry karta hai). `--no-open` ke saath, default browser apne aap nahi khulta hai. Deprecated alias `editor` abhi bhi kaam karta hai lekin ek chetavani print karta hai. |
| `glossary-generate [-o <path>]`                                                                            | Ek khaali `glossary-user.csv` template likhen. `-o`: output path ko override karein (default: config se `glossary.userGlossary`, ya `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                                           | Upyogkarta ko ek upcommand ke liye madad pradarshit kare (same output as `ai-i18n-tools <command> --help`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

<a id="root-and-global-options"></a>
### Root aur global vikalp

| Vikalp | Scope | Vivaran |
|---|---|---|
| `-V` / `--version` | Root program | Version number aur build timestamp output karen (`version` subcommand ke samaan jaankari). |
| `-h` / `--help` | Root program | Root program ya subcommand ke liye help dikhaen jab command name ke saath upyog kiya jaata hai. |
| `-c` / `--config <path>` | Har command | Config file path (default: `ai-i18n-tools.config.json`). |
| `-v` / `--verbose` | Har command | Verbose logging. |
| `-P` / `--provider <name>` | Har command | Is run ke liye active LLM provider; config `provider` key ko override karta hai. `providers` ke tahat configure kiya jaana chahiye. |
| `-L` / `--ui-lang <code>`    | Har command | Tool ke khud ke UI ke liye bhasha (CLI madad, logs/saraansh, dashboard); sarvochch-prathmikta wala source. [Tool UI bhasha](#tool-ui-language) dekhen. |
| `-w` / `--write-logs [path]` | Har command | Console output ko ek `.log` file mein tee karen (default path: root `cacheDir` ke tahat). |

<a id="per-command-help"></a>
### Pratyaek-command help

| Upyog | Vivaran |
|---|---|
| `ai-i18n-tools <command> --help` | Us command ke sabhi vikalp. |
| `ai-i18n-tools help <command>` | `<command> --help` ke samaan output. |

<a id="target-locales--l----locale"></a>
### Target locales (`-l` / `--locale`)

| Commands                                                                                | Behaviour                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — comma-separated target BCP-47 codes (jaise `de,fr,pt-BR`). Jab chhoda jaata hai, defaults config se aate hain (`json[]` blocks bhi per-block `targetLocales` set kar sakte hain). UI steps bhi `ui-languages.json` ka upyog karte hain. |
| `lint-source`                                                                           | `-l` / `--locale <code>` — review karne ke liye single source locale (default: config `sourceLocale`).                                                            |

---

<a id="environment-variables"></a>
## Environment variables

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` provider ke liye API key (jab yeh active ho tab zaroori). |
| Other provider keys    | Har provider apni key env var padhta hai: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama ko kisi ki zaroorat nahi). `providers.<name>.apiKeyEnv` ke saath har provider ke liye override karein. |
| `OPENROUTER_BASE_URL`  | `providers.openrouter.baseUrl` ko override karein (sirf tab jab vah provider configure kiya gaya ho). |
| `OLLAMA_BASE_URL`      | `providers.ollama.baseUrl` ko override karein (sirf tab jab vah provider configure kiya gaya ho). |
| `AI_I18N_LANG`         | Tool ke khud ke UI ke liye bhasha (CLI madad, logs, dashboard). `-L` / `--ui-lang` dwara override kiya jaata hai; config `uiLanguage` ko override karta hai. [Tool UI bhasha](#tool-ui-language) dekhen. |
| `I18N_SOURCE_LOCALE`   | Runtime par `sourceLocale` ko override karein.                        |
| `I18N_TARGET_LOCALES`  | `targetLocales` ko override karne ke liye comma-separated locale codes.  |
| `I18N_LOG_LEVEL`       | Logger level (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Jab `1` ho, to log output mein ANSI colours ko disable karein.              |
| `I18N_LOG_SESSION_MAX` | Prati log session mein rakhi gayi adhiktam lines (default `5000`).           |

Startup par CLI vartamaan working directory se `.env` file ko bhi auto-load karta hai (Node ke `process.loadEnvFile` ke dwara), isliye provider API keys non-interactive shells mein utha li jaati hain jo `.envrc` / `direnv` ko source nahin karti hain. Environment mein pehle se maujood variables kabhi override nahin kiye jaate hain, isliye real CI/production maanon ki jeet hoti hai.

---

<a id="tool-ui-language"></a>
## Tool UI bhasha

Tool apana user interface — CLI madad text, uchch-traffic log/saraansh/error sandesh, aur Translation Dashboard — ko aapake project ke `sourceLocale` / `targetLocales` se svatantr roop se localise karta hai. UI locale in sources se resolve kiya jaata hai, sarvochch prathmikta pehle:

1. `-L` / `--ui-lang <code>` global flag (e.g. `-L pt-BR`).
2. `AI_I18N_LANG` environment variable (e.g. `export AI_I18N_LANG=es`).
3. `ai-i18n-tools.config.json` mein `uiLanguage` config key (BCP-47 string).
4. Host OS locale (`Intl.DateTimeFormat().resolvedOptions().locale` ke through).

Anurodh kiya gaya locale shipped UI bhashaon ke khilaaf ya sabse qareebi variation dwara match kiya jaata hai (udaharan ke liye `pt-PT` `pt-BR` mein resolve hota hai, aur `en-US` `en-GB` mein resolve hota hai); jab kuchh bhi match nahin hota hai to yah source locale (`en-GB`) par fallback ho jaata hai. Jab UI bhasha spasht roop se anurodh ki jaati hai (flag, env var, ya `uiLanguage` ke dwara) lekin koi shipped bundle match nahin hota hai, to CLI ek-baar ka warning print karta hai ki default locale ka upayog kiya jaayega; keval host OS se anumaanit locale kabhi warning nahin deta hai.

Shipped UI bhashaen: `en-GB` (source) aur `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans`, aur `zh-Hant`. Translation Dashboard resolved locale, layout direction, aur translation bundle ko `GET /api/ui-i18n` se padhta hai aur load hone par unhen laagoo karta hai (yah `<html lang>` / `dir` set karta hai aur `data-i18n*` attributes ke dwara static markup ko localise karta hai). Is suvidha ke liye kisi configuration ki avashyakta nahin hai — default roop se tool aapke OS locale ka anupalan karta hai.
