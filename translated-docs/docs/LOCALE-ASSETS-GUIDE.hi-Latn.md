<a id="locale-assets-guide"></a>
# Locale assets guide

Yah guide batata hai ki locale-specific assets — screenshots (PNG, JPEG, WebP) aur illustrated SVG files — ko `ai-i18n-tools` ka upyog karne wale projects mein kaise handle kiya jaye. Yah har upalabdh pattern, use kab upyog karna hai, aur shuru se ek project ko kaise set up karna hai, iski vyakhya karta hai, taki baad mein aur locales jodne ke liye koi structural rework ki avashyakta na ho.

SVG configuration reference ke liye, [GETTING_STARTED.md](GETTING_STARTED.hi-Latn.md) mein [`svg`](#svg) section dekhen. `postProcessing.regexAdjustments` option ke liye, [configuration reference](GETTING_STARTED.hi-Latn.md#configuration-reference) dekhen.

| Config path | Value | Use case | Notes |
|-------------|-------|----------|-------|
| `docs[].docsOutput.style` | `"flat"` | Locale-suffixed README / USER-GUIDE files | Flat link rewriter ko enable karta hai; jab sources subdirectories mein hon to `flatPreserveRelativeDir` ke saath jodein |
| `docs[].docsOutput.style` | `"nested"` (default) | `outputDir` ke antargat simple locale subfolders | Koi flat link rewriter nahi |
| `docs[].docsOutput.style` | `"doc-system"` | Locale-prefixed doc trees (custom generators) | `docsRoot` aur `localeSubpath` set karein; flat link rewriter nahi chalta |
| `docs[].docsOutput.style` | `"docusaurus"` / `"astro-starlight"` | Preset `doc-system` layouts | `localeSubpath` ke liye generator-specific defaults ke saath aliases |
| `svg.style` | `"flat"` | Web apps (`name.<locale>.svg` in `public/assets/`) | Markdown `style` se alag; `translate-svg` dwara upyog kiya jata hai |
| `svg.style` | `"nested"` | Doc-system colocated SVG output | Aksar `pathTemplate` (Pattern E) ke saath joda jata hai |

Yah guide config se exact JSON strings ka upyog karti hai — keval angrezi shabdon ka nahi — taki anuvadit copies spasht rahen. Legacy keys (`documentations`, `markdownOutput`) load time par swikar kiye jate hain; nayi configs mein `docs` aur `docsOutput` ko prefer karein.

<small>**Anya bhashaon mein padhen:** </small>
<small id="lang-list">[English (UK)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [Hindi (Roman)](./LOCALE-ASSETS-GUIDE.hi-Latn.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [简体中文](./LOCALE-ASSETS-GUIDE.zh-Hans.md) · [繁體中文](./LOCALE-ASSETS-GUIDE.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [ai-i18n-tools assets ke saath kya karta hai (aur kya nahi karta hai)](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [Shuru se i18n ke liye design karein](#design-for-i18n-from-the-start)
  - [`docsOutput.style = "flat"` ke saath Markdown (README, USER-GUIDE)](#markdown-with-docsoutputstyle--flat-readme-user-guide)
  - [Doc-system sites (`docsOutput.style = "doc-system"`)](#doc-system-sites-docsoutputstyle--doc-system)
    - [Docusaurus preset](#docusaurus-preset)
    - [Astro/Starlight preset](#astrostarlight-preset)
  - [SVG assets ke saath Web apps (Next.js, Vite, etc.)](#web-apps-nextjs-vite-etc-with-svg-assets)
- [Decision guide](#decision-guide)
- [Pattern A - Shared raster](#pattern-a---shared-raster)
  - [Implementation example](#implementation-example)
- [Pattern B - Per-locale folder (URL rewriting)](#pattern-b---per-locale-folder-url-rewriting)
  - [Directory layout](#directory-layout)
  - [Screenshot script contract](#screenshot-script-contract)
  - [Config - `docsOutput.style = "flat"`](#config---docsoutputstyle--flat)
  - [Config - `docsOutput.style = "doc-system"`](#config---docsoutputstyle--doc-system)
  - [Preset - `docsOutput.style = "docusaurus"`](#preset---docsoutputstyle--docusaurus)
  - [Preset - `docsOutput.style = "astro-starlight"`](#preset---docsoutputstyle--astro-starlight)
- [Pattern C - Colocated raster (`doc-system`)](#pattern-c---colocated-raster-doc-system)
  - [Directory layout](#directory-layout-1)
  - [Screenshot script contract](#screenshot-script-contract-1)
  - [Config](#config)
  - [Prerequisites](#prerequisites)
  - [Implementation example](#implementation-example-1)
- [Pattern D - `svg.style = "flat"` ke saath translated SVG](#pattern-d---translated-svg-with-svgstyle--flat)
  - [Config](#config-1)
  - [App reference](#app-reference)
  - [Source layout recommendation](#source-layout-recommendation)
  - [Implementation example](#implementation-example-2)
- [Pattern E - Colocated translated SVG (doc-system)](#pattern-e---colocated-translated-svg-doc-system)
  - [Config](#config-2)
  - [Source markdown](#source-markdown)
  - [SVG source location](#svg-source-location)
  - [`pathTemplate` placeholders](#pathtemplate-placeholders)
  - [Implementation example](#implementation-example-3)
- [Flat link rewriter aur two-step flow](#the-flat-link-rewriter-and-two-step-flow)
  - [Two-step flow jab `docsOutput.style = "flat"`](#two-step-flow-when-docsoutputstyle--flat)
  - [Prati-file depth prefix `flatPreserveRelativeDir` ke saath](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` aur `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [Aam galatiyan aur samasya-nivaran](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## ai-i18n-tools assets ke saath kya karta hai (aur kya nahi karta hai)

`translate-docs` markdown/MDX content ka anuvad karta hai — jisme image alt text bhi shamil hai — lekin yah raster files ko copy, generate, ya emit nahi karta hai. Yadi kisi anuvadit page ko locale-specific screenshot ki avashyakta hai, to aapko us file ko us path par rakhna hoga jise anuvadit markdown sandarbhit karega.

`translate-svg` ekmatra command hai jo locale-specific binary files emit karta hai. Yah source SVG files ko padhta hai, text elements (`<text>`, `<title>`, `<desc>`) ka anuvad karta hai, aur prati locale ek output SVG likhta hai. Raster files (PNG, JPEG, WebP, GIF) tool dwara kabhi nahi likhi jati hain.

---

<a id="design-for-i18n-from-the-start"></a>
## Shuru se i18n ke liye design karen

Kisi bhi screenshot ke maujood hone se pahle sahi directory layout chunna, baad mein locale-specific assets kitne aasan honge, ismein sabse bada factor hai. Darjano screenshots commit hone ke baad layout ko retrofitting karne ka matlab hai paths ko punargathit karna aur har markdown reference ko update karna.

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### Markdown `docsOutput.style = "flat"` ke saath (README, USER-GUIDE)

Shuru se hi locale-coded subdirectory ke tahat screenshots store karen:

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

Jab aap baad mein i18n jodte hain, to aapka `take-screenshots` script har locale ke liye `images/screenshots/<locale>/` mein likhta hai, aur ek `regexAdjustments` rule un sabhi ko handle karta hai:

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Generic `[^/]+` pattern kisi bhi locale folder name se milta hai — apne source locale (jaise `screenshots/en-GB/`) ko hardcode na karen kyunki yadi `sourceLocale` kabhi badalta hai to yah toot jata hai.

Yadi aap locale subdirectory (`images/screenshots/translate.png`) ko chhodkar paths ke saath shuru karte hain, to aapko Pattern B ke kaam karne se pahle poore tree ko punargathit karna hoga.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### Doc-system sites (`docsOutput.style = "doc-system"`)

Static documentation sites ke liye upyog karen jo anuvadit pages ko locale-prefixed tree ke tahat store karte hain — Docusaurus i18n, Astro Starlight, aur custom generators jo ek hi aakar ka palan karte hain. `docsRoot` ke tahat files ismein likhi jati hain:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docs[].docsOutput.docsRoot` ko apne English source root par set karen (jaise `"docs"` ya `"src/content/docs"`). Jab aap `style: "doc-system"` ko seedhe set karte hain, to aapko `localeSubpath` ko bhi us path segment par set karna hoga jise aapki site `{locale}/` aur anuvadit file ke beech upyog karti hai. Aliases `"docusaurus"` aur `"astro-starlight"` default `localeSubpath` values ke saath preset `doc-system` layouts hain ([Output layouts](GETTING_STARTED.hi-Latn.md#output-layouts) dekhen).

| Preset alias | Default `localeSubpath` | Udaharan output |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (khali) | `src/content/docs/de/guide.md` |

Flat link rewriter `doc-system` ke liye **nahi** chalta hai (`"flat"` ke vipreet). `postProcessing.regexAdjustments` source markdown se original URL dekhta hai — aam taur par ek absolute ya site-root path jaise `/img/screenshots/en-GB/foo.png`.

**Pattern B** tab lagu hota hai jab screenshots ek shared static URL tree mein rahte hain: shuru se hi ek locale-coded folder aur ek generic `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` rule ka upyog karen ([Config — doc-system](#config---docsoutputstyle--doc-system) dekhen).

**Pattern C** lagoo apply kartaa hai jab pratyek locale ke anuvaadit docs assets ko markdown ke bagal mein rakhte hain (koi URL rewriting nahin). Aapka screenshot script ko PNGs ko `{outputDir}`, `{locale}`, aur `{localeSubpath}` se derive kiye gaye paths mein likhnaa hoga — niche diya gaya Docusaurus preset reference layout hai.

<a id="docusaurus-preset"></a>
#### Docusaurus preset

Do aadatein project setup par sabhi regex bridging ko baad mein samaapt kar deti hain:

1. Ek symlink `documentation/docs/assets → ../static/assets` banaayein pehle ki aap koi bhi screenshots jodein. Docusaurus ka webpack default roop se symlinks ko follow karta hai, aur isse source docs ko relative paths ka upyog karne ki anumati milti hai jo anuvaadit docs bhi upyog karenge.

2. Sabhi documentation assets — PNGs aur SVGs — ko `static/assets/` (ek directory) mein rakhein. Unhein `static/img/` (SVGs) aur `static/assets/` (PNGs) ke beech vibhaajit na karein. Ek ekikrit sthaan ka matlab hai ki pratyek doc page, English aur anuvaadit, same relative path `../assets/name.ext` ka upyog kar sakta hai.

Pratyek asset ko sthir relative path `../assets/name.ext` ke saath source markdown mein sandarbhit karein. Kabhi bhi absolute `/img/` ya `/assets/` URLs ka upyog documentation assets ke liye na karein — ve URLs English source (jo `static/` se serve hoti hai) aur anuvaadit locales (jo anuvaadit docs ke saath colocated hoti hain) ke beech alag hain, jo ek `regexAdjustments` niyam ko bridge karne ke liye majboor karta hai.

Jab aap baad mein i18n jodein, to screenshot script `getScreenshotDir` split (dekhie [Pattern C](#pattern-c---colocated-raster-doc-system)) aur `translate-svg` ka upyog karta hai jo `pathTemplate` hota hai. Koi regex samayojan ki aavashyakta nahin hoti.

> **Note:** `resolve.symlinks = false` ek `next.config.ts` mein symlink resolution ko Next.js application webpack build ke liye aksham karta hai. Isse Docusaurus documentation site build par koi prabhaav nahin padta, jo alag webpack instance ka upyog karta hai.

<a id="astrostarlight-preset"></a>
#### Astro/Starlight preset

Iske barabar `docsOutput.style = "doc-system"` `localeSubpath: ""` ke saath — anuvaadit pages seedhe `{outputDir}/{locale}/` ke neeche baithi hain.

Screenshots ko ek locale-coded path se shuruaat karein:

```
public/img/screenshots/en-GB/screenshot.png
```

Generic regex ka upyog karein `regexAdjustments` mein:

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### Web apps (Next.js, Vite, etc.) ke saath SVG assets

SVG source files ko ek vishisht source directory (jaise `images/` ya `src/assets/`) mein rakhein aur `svg.outputDir` ko alag serving directory (jaise `public/assets/`) mein configure karein. Kabhi bhi source SVGs aur `translate-svg` output files ko ek hi folder mein na milaayein — yeh samajhna mushkil ho jata hai kaun se files generate hui hain.

SVGs ko shuruaat se hi anuvaadit karne ke liye design karein: `<text>`, `<title>`, aur `<desc>` elements ka upyog karein sabhi manav-paathya labels ke liye. Text ko path data ke roop mein embed karne se bachein.

Case-sensitivity mismatches ko roknay ke liye `forceLowercase: true` ko `svg` config block mein enable karein.

---

<a id="decision-guide"></a>
## Decision guide

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| Pattern | Asset type                  | Site type                                                                 | Tool mechanism                                               |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A       | Raster (shared)             | `docsOutput.style = "flat"` docs                                      | Per-file link rewriter; usually no regex                     |
| B       | Raster (per-locale)         | `"flat"` or `"doc-system"` (incl. `"docusaurus"`, `"astro-starlight"`)    | `regexAdjustments` locale segment swap                       |
| C       | Raster (colocated)          | `"doc-system"` with colocated assets (Docusaurus preset)                  | Screenshot script places files; no regex                     |
| D | SVG (anuvadit) | Web app | `translate-svg` ke saath `svg.style = "flat"` |
| E | SVG (anuvadit, sah-sthapit) | `"doc-system"` sah-sthapit assets ke saath (Docusaurus preset) | `translate-svg` ke saath `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a---shared-raster"></a>
## Pattern A - Saajha raster

Iska upyog tab karein jab ek hi image sabhi locales mein saajha ki jaati hai (prati-locale variant nahi). Jab `docsOutput.style = "flat"`, flat link rewriter har output file ke liye depth prefix ki ganna karta hai, isliye source file ke bagal mein ek asset (jaise `docs/figure.png` ko `docs/page.md` se `figure.png` ke roop mein sandarbhit kiya gaya hai) har anuvadit output mein sahi dhang se hal ho jaata hai — kisi `postProcessing.regexAdjustments` niyam ki avashyakta nahi hai.

Udaharan: yeh package `docs/GETTING_STARTED.md` ko `translated-docs/docs/GETTING_STARTED.<locale>.md` mein anuvadit karta hai. Sibling image `docs/translation-dashboard.png` ko `translation-dashboard.png` ke roop mein sandarbhit kiya gaya hai. Rewriter output file ki directory se source directory (`../../docs/`) tak prati-file prefix ki ganna karta hai, jisse `../../docs/translation-dashboard.png` utpann hota hai. `translated-docs/docs/` se, yeh sahi dhang se `docs/translation-dashboard.png` mein hal ho jaata hai.

Dashboard UI badalne par PNG ko [`scripts/screenshot-translation-dashboard.sh`](../../docs/../scripts/screenshot-translation-dashboard.sh) se refresh karein; image prati-locale nahi hai.

Ek `postProcessing` niyam ki abhi bhi avashyakta hai jab:
- Asset ko ek absolute URL (jaise `/img/figure.png`) ke madhyam se sandarbhit kiya gaya hai — rewriter kewal relative paths ko handle karta hai
- Aap anya kaaranon se asset URL badalna chahte hain (jaise CDN par switch karna)

<a id="implementation-example"></a>
### Karyavanayan udaharan

Yeh repository Translation Dashboard screenshot ke liye Pattern A ka upyog karta hai: [GETTING_STARTED.md](GETTING_STARTED.hi-Latn.md#translation-dashboard) usi folder mein image [translation-dashboard.png](../../docs/../docs/translation-dashboard.png) ko sandarbhit karta hai. [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) `docsOutput.style = "flat"` aur `flatPreserveRelativeDir: true` set karta hai; prati-file depth prefix bina screenshot `regexAdjustments` ke image path ko hal karta hai.

---

<a id="pattern-b---per-locale-folder-url-rewriting"></a>
## Pattern B - Prati-locale folder (URL rewriting)

README/USER-GUIDE ke liye `docsOutput.style = "flat"` ke saath upyog karein, aur doc-system sites (`docsOutput.style = "doc-system"` ya aliases `"docusaurus"` / `"astro-starlight"`) ke liye jo saajha static URL tree se screenshots serve karte hain.

<a id="directory-layout"></a>
### Directory layout

<details>
<summary>Udaharan prati-locale screenshot directory tree</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

Source markdown source locale directory ko sandarbhit karta hai:

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Screenshot script contract

`take-screenshots` script ko har locale ke liye files likhni chahiye — na ki kewal source locale ke liye. `translate-docs` command paths ko rewrite karta hai lekin files nahi banata. Ek aam pattern:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

[examples/nextjs-app mein screenshot script](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh) mein ek saral `bash` udaharan dekhein, ya [Transrewrt project](https://github.com/wsj-br/transrewrt) repository se [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) mein ek adhik jatil udaharan dekhein.

> **Note:** Neeche diye gaye chaar up-anubhag ek hi `regexAdjustments` locale-segment swap (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`) saajha karte hain. Kewal output layout aur kya flat link rewriter pehle chalta hai, alag hain — us up-anubhag par jaayen jo aapke `docsOutput.style` se mel khata hai.

<a id="config---docsoutputstyle--flat"></a>
### Config - `docsOutput.style = "flat"`

Jab `docsOutput.style = "flat"` chalta hai aur non-markdown URLs mein ek depth prefix jodta hai to flat link rewriter sabse pehle chalta hai. Repo root par `README.md` ke liye `outputDir: "translated-docs/"` ke saath, yeh `../` jodta hai:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

Phir `regexAdjustments` niyam us pehle se prefixed URL ke andar locale segment ko badal deta hai:

<details>
<summary>Flat layout ke liye regexAdjustments ka udaharan</summary>

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
    ]
  }
}
```

</details>

Parinaam: `../images/screenshots/de/translate.png` — `translated-docs/README.de.md` se repo root tak sahi relative path.

`postProcessing` step flat link rewriter ke baad chalta hai. `search` patterns likhein jo pehle se prefixed URL ke andar kahin bhi locale segment se match karte hain — pattern mein `../` prefix shamil karne ki koi zaroorat nahi hai.

Karyavayan udaharan (production): [Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`) mein screenshot URLs, [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) mein locale rewrite, capture script [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) (upar [screenshot script contract](#screenshot-script-contract) dekhein).

Karyavayan udaharan (demo config): [examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) mein doosra `docs[]` block (`images/screenshots/[^/]+/` → `${translatedLocale}`); helper script [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### Config - `docsOutput.style = "doc-system"`

Kisi bhi doc-system site ke liye Generic Pattern B jo shared static URL prefix ke madhyam se screenshots ko sandarbhit karti hai. Flat link rewriter nahi chalta hai; `postProcessing` original markdown URL mein locale segment ko rewrite karta hai.

<details>
<summary>Doc-system layout ke liye regexAdjustments ka udaharan</summary>

```json
"docsOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Apne generator ke layout ko `{locale}/` aur translated file ke beech match karne ke liye `localeSubpath` set karein, ya jab defaults fit hon to `"doc-system"` ke bajaye ek preset alias (`"docusaurus"`, `"astro-starlight"`) ka upyog karein. Source markdown aam taur par URL mein source locale ko embed karta hai:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

Har target locale ke liye usi path par matching PNG files ship karein (jaise `static/img/screenshots/de/screenshot.png`). `screenshots/en-GB/` ko hardcoding karne ke bajaye `screenshots/[^/]+/` ko prefer karein taaki niyam `sourceLocale` badlav se bacha rahe.

<a id="preset---docsoutputstyle--docusaurus"></a>
### Preset - `docsOutput.style = "docusaurus"`

`"doc-system"` jaisa hi default `localeSubpath = "docusaurus-plugin-content-docs/current"` ke saath. Flat link rewriter nahi chalta hai. `postProcessing` original markdown URL dekhta hai. English pages aam taur par source locale ke saath ek absolute path ka upyog karte hain:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Docusaurus preset ke liye regexAdjustments ka udaharan</summary>

```json
"docsOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Matching PNG files ko `docs-site/static/img/screenshots/<locale>/screenshot.png` par ship karein. Source-locale-agnostic configs ke liye, `screenshots/en-GB/` ke bajaye `screenshots/[^/]+/` ko prefer karein.

Karyavayan udaharan: [examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) mein pehle `docs[]` block ke saath.

<a id="preset---docsoutputstyle--astro-starlight"></a>
### Puraane Sait - `docsOutput.style = "astro-starlight"`

Iske saman `"doc-system"` hai, lekin ismein `localeSubpath: ""` hai — anuvaadit panno ka sthaan seedhe `{outputDir}/{locale}/` ke niche hai. Ismein bhi Pattern B ke siddhaant ka palan kiya gaya hai, jaise ki oopar vaarnit generic doc-system config mein. Strot markdown mein `/img/screenshots/en-GB/screenshot.png` ka upyog kiya gaya hai:

<details>
<summary>Udaaharan regexAdjustments Astro Starlight preset ke liye</summary>

```json
"docsOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

PNG ko `public/img/screenshots/<locale>/screenshot.png` par bhejein.

Laagoo karna udaaharan: [examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) aur [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).

---

<a id="pattern-c---colocated-raster-doc-system"></a>
## Pattern C - Colocated raster (`doc-system`)

Upyog karein jab ek `doc-system` site sthaaniya bhasha-vishisht assets ko anuvaadit markdown ke bagal mein sthaapit karti hai — koi URL punarlikhna aavashyak nahin hai. Docusaurus preset (`docsOutput.style = "docusaurus"`) sandarbh kaaryaanvayan hai; anya generators jo `"doc-system"` ka upyog karte hain ek vaastavik `localeSubpath` ke saath, wahi vichaar ka paalan karte hain: Angrezi assets mul-sthaaniya bhasha-maarg par aati hain, anuvaadit assets `{outputDir}/{locale}/[localeSubpath/]assets/` ke neeche aati hain.

<a id="directory-layout-1"></a>
### Directory layout

<details>
<summary>Udaaharan colocated asset directory tree (Docusaurus)</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

Sabhi docs har ek locale mein saman saapekshe path ka upyog karte hain:

```markdown
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

Angrezi (`en-GB`) locale ke liye, `../assets/` symlink ke maadhyam se `static/assets/` tak pahunchta hai. Anuvaadit locales ke liye yah seedhe `current/assets/` directory tak pahunchta hai.

<a id="screenshot-script-contract-1"></a>
### Screenshot script contract

Script ko pratyek locale ke liye sahi directory mein PNG likhne honge. `getScreenshotDir` function is vibhaajan ko encode karta hai:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

Iska utpaadan karyaanvayan [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) mein dekhein, jo [duplistatus](https://github.com/wsj-br/duplistatus) repository se hai (sthaaniya prati copy: [references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts)).

<a id="config"></a>
### Config

Raster files ke liye `regexAdjustments` niyam ki aavashyakta nahin hai. `translate-docs` markdown mein alt text ka anuvaad karta hai, lekin URL badalta nahin hai:

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

Yadi project mein anuvaadit SVGs bhi upyog kiye jaate hain, to Pattern E unhein sambhaalti hai aur ve `current/assets/` mein PNG ke saath bina kisi adhik regex ke aate hain.

<a id="prerequisites"></a>
### Puraane Sait ke liye Aavashyakataayein

- `docs/assets` symlink maujood hona chahiye: `ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack default roop se symlinks ko follow karta hai (Docusaurus builds mein `resolve.symlinks` default roop se `true` hota hai)
- Symlink keval source locale ke liye maujood hona chahiye — translated builds iska upyog nahi karte hain

<a id="implementation-example-1"></a>
### Laagu karne ka udaharan

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) mein; English docs colocated PNGs ko refer karte hain (jaise `../assets/screen-dashboard-summary.png` ke saath [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md); [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) mein koi PNG `regexAdjustments` nahi). Ek hi project se Pattern E SVGs ek hi `current/assets/` directories mein aate hain (neeche dekhen).

---

<a id="pattern-d---translated-svg-with-svgstyle--flat"></a>
## Pattern D - `svg.style = "flat"` ke saath translated SVG

Tab upyog karein jab ek web app locale-specific SVG illustrations ya diagrams ko embed karta hai aur runtime par unhe locale code dwara refer karta hai.

<a id="config-1"></a>
### Config

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` `images/` ke neeche har `.svg` ko padhta hai aur har locale ke liye ek file likhta hai:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### App reference

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Source layout ki sifarish

Source SVGs ko output directory se alag rakhein. `sourcePath: "images"` aur `outputDir: "public/assets"` ke saath dono directories alag-alag hain. Kabhi bhi dono ko ek hi directory par set na karein.

<a id="implementation-example-2"></a>
### Laagu karne ka udaharan

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) mein `svg` block (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); source [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg); [public/assets/](../../docs/../examples/nextjs-app/public/assets/) ke neeche har-locale outputs (jaise `translation_demo_svg.de.svg`); [page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) mein runtime URL (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
## Pattern E - Colocated translated SVG (doc-system)

Doc-system sites ke liye upyog karein jahan translated SVG illustrations ko har locale ki content directory mein translated docs ke saath dikhna chahiye — wahi location jahan Pattern C raster screenshots ke liye upyog karta hai. Docusaurus preset iska prathamik udaharan hai.

<a id="config-2"></a>
### Config

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` har locale ke liye ek SVG ko usi `current/assets/` directory mein likhta hai jise Pattern C PNGs ke liye upyog karta hai:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Source markdown

Sabhi locales mein sabhi docs ek hi relative path ka upyog karte hain:

```markdown
![Diagram](../../docs/../assets/diagram.svg)
```

English locale ke liye symlink `docs/assets → ../static/assets` ise resolve karta hai. Translated locales ke liye yeh seedhe `current/assets/` par resolve hota hai.

Koi `regexAdjustments` rule ki zaroorat nahi hai kyunki English source docs aur translated output docs ek jaise paths ka upyog karte hain.

<a id="svg-source-location"></a>
### SVG srot sthan

Anushansit: srot SVG ko `documentation/static/assets/` mein en-GB PNG ke saath store karein. Yah sabhi dastaavej sampattiyon ko ek jagah rakhta hai, aur vahi `docs/assets` symlink donon ko cover karta hai. Tab `svg.sourcePath` pravishtiyaan `documentation/static/assets/name.svg` ki or ishara karti hain.

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` pleesholdar

| Pleesholdar              | Maan                                                   |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir` ka absolyut hal kiya gaya path              |
| `{locale}`               | Lakshay sthaaneey kod                                     |
| `{LOCALE}`               | Sthaaneey kod bade aksharon mein                                  |
| `{relPath}`              | `sourcePath` root se srot SVG tak saapeksh path |
| `{stem}`                 | Bina ekstension ke failnaam                             |
| `{basename}`             | Ekstension ke saath failnaam                                |
| `{extension}`            | Bindu sahit ekstension                                |
| `{relativeToSourceRoot}` | Nikatatam `sourcePath` root se saapeksh path       |

[svg kanfigreshan tabel](GETTING_STARTED.hi-Latn.md#svg) mein poora sandarbh.

<a id="implementation-example-3"></a>
### Kaaryaanvayan udaaharan

[duplistatus](https://github.com/wsj-br/duplistatus) — [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) mein `pathTemplate` ke saath nest kiya gaya `svg` blok; `documentation/static/img/` ke tahat soochibaddh srot SVGs (jaise [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg` Pattern C PNGs ke bagal mein `documentation/i18n/<locale>/…/current/assets/` mein prati-sthaaneey failen likhta hai; dastaavej aaj unhen `/img/duplistatus_*.svg` ke maadhyam se embed karte hain (jaise [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)). SVG `regexAdjustments` bridge ke nikaalane aur `../assets/` path mein nirdhaarit sthaanaantaran ke liye [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md) dekhen.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## Flat link ri-raaitar aur do-charanee pravaah

`docsOutput.style = "flat"` ke liye (aur jab tak `rewriteRelativeLinks: false` ya ek kastom `pathTemplate` set na ho), `postProcessing` se pahle ek bilṭ-in ri-raaitar chalta hai. Yah kros-dok link ko handle karta hai (sthaaneey pratyay jodkar) aur gair-maarkdaun sampatti URLs mein ek gaharaai pratyay jodta hai.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Do-charanee pravaah jab `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

`outputDir: "translated-docs/"` aur repo root par srot `README.md` ke saath udaaharan:

1. Flat link ri-raaitar: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (`translated-docs/` ke liye ek `../`)
2. `postProcessing` regex `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

`docsOutput.style = "doc-system"` ke liye (jismein `"docusaurus"`, `"astro-starlight"`, aur `"nested"` shaamil hain), flat link ri-raaitar nahin chalta hai. `postProcessing` anuvaadit maarkdaun se mool URL dekhta hai (aam taur par `/img/screenshots/en-GB/foo.png` jaisa ek absolyut path).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### `flatPreserveRelativeDir` ke saath prati-file depth prefix

Depth prefix har output file ke liye compute kiya jaata hai — poore batch ke liye global roop se nahi. Har source file ke liye, rewriter output file ki directory se source file ki directory tak relative path compute karta hai aur use prefix ke roop mein upyog karta hai.

Iska matlab hai ki `flatPreserveRelativeDir: true` ke saath, subdirectories mein source files ko sahi prefix apne aap mil jaata hai. Udaharan ke liye, `docs/GETTING_STARTED.md` `translated-docs/docs/GETTING_STARTED.<locale>.md` par output karta hai. Prati-file prefix `../../docs/` hai, isliye ek asset `translation-dashboard.png` (source ke saapeksh) `../../docs/translation-dashboard.png` ban jaata hai — jo `translated-docs/docs/` se `docs/translation-dashboard.png` tak sahi dhang se resolve hota hai.

Source files ke saath relative-path assets ke liye kisi `postProcessing` regex correction ki zaroorat nahi hai.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` aur `linkRewriteDocsRoot`

| Option                                   | Effect                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Flat link rewriter ko spasht roop se enable ya disable karein (jab `docsOutput.style = "flat"` ho to default ko override karta hai) |
| `docsOutput.linkRewriteDocsRoot`     | Root jahan se `depthPrefix` compute kiya jaata hai (default `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Output path layout ko prabhavit karta hai, jise rewriter gyat anuvadit files ke liye target paths compute karte samay upyog karta hai       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
## Aam galtiyan aur troubleshooting

**Screenshot paths mein koi locale directory nahi**
`images/screenshots/screenshot.png` — locale variants ko alag nahi kar sakta aur rewrite nahi kiya ja sakta. Pattern B lagoo karne se pehle `images/screenshots/<locale>/screenshot.png` mein punargathit karein.

**Regex mein hardcoded source locale**
`"search": "screenshots/en-GB/"` — agar `sourceLocale` badalta hai to chupchap toot jaata hai. Iske bajaye `"search": "screenshots/[^/]+/"` ka upyog karein.

**SVG sources aur outputs ek hi directory mein**
Agar `svg.sourcePath` aur `svg.outputDir` overlap karte hain, to generated files hand-edited sources ke saath mil jaate hain. Unhe alag directories mein rakhein.

**Colocated SVGs ke liye Absolute Docusaurus static URLs**
`/img/diagram.svg` (`static/img/` se) anuvadit output mein `../assets/` mein rewrite karne ke liye ek `regexAdjustments` rule ki zaroorat hoti hai. Source SVGs ko `static/assets/` mein rakhein aur shuru se hi relative `../assets/diagram.svg` ka upyog karein taaki isse poori tarah bacha ja sake.

**Docusaurus mein `docs/assets` symlink gayab**
Symlink ke bina, `docs/user-guide/` mein source docs `static/assets/` mein PNGs ya SVGs ko relative path ke madhyam se sandarbhit nahi kar sakte. Project banate samay symlink set karein: `ln -s ../static/assets documentation/docs/assets`.

**`take-screenshots` script kewal source locale ko capture karta hai**
Pattern B ko har locale ke liye PNG files ki zaroorat hoti hai. Agar script kewal `en-GB` ko capture karta hai, to anuvadit docs mein gayab files ki or ishara karne wale rewritten paths honge.
