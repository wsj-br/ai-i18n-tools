<a id="colocated-raster-doc-system"></a>
# Colocated raster (`doc-system`)

Upyog karein jab ek `doc-system` site sthaaniya bhasha-vishisht assets ko anuvaadit markdown ke bagal mein sthaapit karti hai — koi URL punarlikhna aavashyak nahin hai. Docusaurus preset (`docsOutput.style = "docusaurus"`) sandarbh kaaryaanvayan hai; anya generators jo `"doc-system"` ka upyog karte hain ek vaastavik `localeSubpath` ke saath, wahi vichaar ka paalan karte hain: Angrezi assets mul-sthaaniya bhasha-maarg par aati hain, anuvaadit assets `{outputDir}/{locale}/[localeSubpath/]assets/` ke neeche aati hain.

> **In-repo udaharan kyon nahin:** Is repository ke Docusaurus demos ([`examples/docusaurus-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/), [`examples/nextjs-app`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/)) iske bajaye [prati-locale folder](/hi-Latn/guide/images-and-screenshots/per-locale-folder) layout ka upyog karte hain — [nirnay margdarshika](/hi-Latn/guide/images-and-screenshots/#decision-guide) dekhen. Colocated `../assets/` anushansit greenfield pattern hai; [duplistatus](https://github.com/wsj-br/duplistatus) poorn utpadan sandarbh hai.

<a id="directory-layout"></a>
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
![Dashboard](../assets/screen-dashboard.png)
```

Angrezi (`en-GB`) locale ke liye, `../assets/` symlink ke maadhyam se `static/assets/` tak pahunchta hai. Anuvaadit locales ke liye yah seedhe `current/assets/` directory tak pahunchta hai.

<a id="screenshot-script-contract"></a>
### Screenshot script contract

Script ko pratyek locale ke liye sahi directory mein PNG likhne honge. `getScreenshotDir` function is vibhaajan ko encode karta hai:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

Ek vastavik-duniya ka karyanvayan [duplistatus](https://github.com/wsj-br/duplistatus) repository se [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) mein dekhein.

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

Yadi project anuvadit SVGs ka bhi upyog karta hai, to [colocated SVG translation](/hi-Latn/guide/svg-translation/translated-svg-colocated) unhein handle karta hai aur ve bina kisi atirikt regex ke `current/assets/` mein PNGs ke saath aate hain.

<a id="prerequisites"></a>
### Puraane Sait ke liye Aavashyakataayein

- `docs/assets` symlink maujood hona chahiye: `ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack default roop se symlinks ko follow karta hai (Docusaurus builds mein `resolve.symlinks` default roop se `true` hota hai)
- Symlink keval source locale ke liye maujood hona chahiye — translated builds iska upyog nahi karte hain

<a id="implementation-example"></a>
### Karyavanayan udaharan

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) mein; Angrezi docs colocated PNGs ka sandarbh dete hain (jaise `../assets/screen-dashboard-summary.png` ke saath [dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md)). Ek hi project se colocated SVGs usi `current/assets/` directories mein aate hain — [Colocated SVG](/hi-Latn/guide/svg-translation/translated-svg-colocated) dekhein.
