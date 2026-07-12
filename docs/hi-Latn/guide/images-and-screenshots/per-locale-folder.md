<a id="per-locale-folder-url-rewriting"></a>
# Prati-locale folder (URL rewriting)

`docsOutput.style = "flat"` ke saath README/USER-GUIDE ke liye, aur doc-system sites (`docsOutput.style = "doc-system"` ya aliases `"docusaurus"` / `"astro-starlight"`) aur `"vitepress"` / anya doc-system presets ke liye upyog karein jo shared static URL tree se screenshots serve karte hain. VitePress ke liye link-rewriting details: [Link rewriting — VitePress](/hi-Latn/guide/images-and-screenshots/link-rewriting#vitepress-link-normalizer-style-vitepress).

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
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Screenshot script contract

`take-screenshots` script ko har locale ke liye files likhni chahiye - sirf source locale ke liye nahi. `translate-docs` command paths ko rewrite karta hai lekin files nahi banata. Ek aam helper:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

examples/nextjs-app mein [screenshot script](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh) mein ek simple `bash` example dekhein, ya [duplistatus](https://github.com/wsj-br/duplistatus) project se [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) mein ek aur complex example (jo [Transrewrt](https://github.com/wsj-br/transrewrt) dwara production mein bhi upyog kiya jata hai).

> **Note:** Neeche diye gaye chaaron sub-sections mein ek hi `regexAdjustments` locale-segment swap (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`) hai. Sirf output layout aur kya flat link rewriter pehle chalta hai, alag hain — us sub-section par jaayen jo aapke `docsOutput.style` se match karta hai.
>
> **Note:** `regexAdjustments` poore translated markdown body par chalta hai, jismein fenced code blocks bhi shaamil hain. Yadi ek doc page mein ek config example embed kiya gaya hai jismein ek matching path hai (jaise `screenshots/en-GB/`), to vah snippet bhi translated output mein rewrite kiya jaayega. Reusable examples mein generic `screenshots/[^/]+/` form ko prefer karein.

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

`postProcessing` step flat link rewriter ke baad chalta hai. `search` regexes likhen jo pehle se prefixed URL ke andar kahin bhi locale segment se mel khate hain - regex mein `../` prefix shamil karne ki koi zaroorat nahi hai.

Implementation example (production): [Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`) mein screenshot URLs, [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) mein locale rewrite, duplistatus se [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) par aadharit capture script (upar [screenshot script contract](#screenshot-script-contract) dekhein).

Amal ka udaharan (demo config): [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) mein doosra `docs[]` block (`images/screenshots/[^/]+/` → `${translatedLocale}`); helper script [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### Config - `docsOutput.style = "doc-system"`

Kisi bhi doc-system site ke liye wahi per-locale folder approach jo shared static URL prefix ke madhyam se screenshots ko sandarbhit karta hai. Flat link rewriter nahi chalta; `postProcessing` original markdown URL mein locale segment ko rewrite karta hai.

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
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

Har target locale ke liye usi path par matching PNG files ship karein (jaise `static/img/screenshots/de/screenshot.png`). `screenshots/en-GB/` ko hardcoding karne ke bajaye `screenshots/[^/]+/` ko prefer karein taaki niyam `sourceLocale` badlav se bacha rahe.

<a id="preset---docsoutputstyle--docusaurus"></a>
### Preset - `docsOutput.style = "docusaurus"`

`"doc-system"` jaisa hi default `localeSubpath = "docusaurus-plugin-content-docs/current"` ke saath. Flat link rewriter nahi chalta hai. `postProcessing` original markdown URL dekhta hai. English pages aam taur par source locale ke saath ek absolute path ka upyog karte hain:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
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

Laagu udaharan: [examples/docusaurus-docs/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json) ke saath.

<a id="preset---docsoutputstyle--astro-starlight"></a>
### Puraane Sait - `docsOutput.style = "astro-starlight"`

`"doc-system"` jaisa hi `localeSubpath: ""` ke saath — anuvadit page seedhe `{outputDir}/{locale}/` ke neeche aate hain. Upar diye gaye generic doc-system config jaisa hi per-locale folder approach. Source markdown `/img/screenshots/en-GB/screenshot.png` ka upyog karta hai:

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

PNGs ko `public/img/screenshots/<locale>/screenshot.png` par ship karein. `${translatedLocale}` placeholder aapki config locale string ka upyog karta hai (jaise `pt-BR`). `astro-starlight` preset default roop se locale **output paths** ko lowercase karta hai (`pt-br/`), lekin `public/img/screenshots/` ke तहत static asset folders ko markdown URLs mein likhe gaye locale segment se match karna chahiye — screenshot directories ko `${translatedLocale}` ke saath align rakhein, zaroori nahi ki Astro route casing ke saath.

Amal ka udaharan: [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) — [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) aur [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).
