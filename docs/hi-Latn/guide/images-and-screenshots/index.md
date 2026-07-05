<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# ai-i18n-tools assets ke saath kya karta hai (aur kya nahi karta hai)

`translate-docs` markdown/MDX content ka anuvad karta hai — jisme image alt text bhi shamil hai — lekin yah raster files ko copy, generate, ya emit nahi karta hai. Yadi kisi anuvadit page ko locale-specific screenshot ki avashyakta hai, to aapko us file ko us path par rakhna hoga jise anuvadit markdown sandarbhit karega.

`translate-svg` ekmatra command hai jo locale-specific binary files emit karta hai. Yah source SVG files ko padhta hai, text elements (`<text>`, `<title>`, `<desc>`) ka anuvad karta hai, aur prati locale ek output SVG likhta hai. Raster files (PNG, JPEG, WebP, GIF) tool dwara kabhi nahi likhi jati hain.

---

<a id="design-for-i18n-from-the-start"></a>
# Shuru se i18n ke liye design karein

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

generic `[^/]+` regex kisi bhi locale folder naam se mel khata hai — apne source locale (jaise ki `screenshots/en-GB/`) ko hardcode na karein kyuki agar `sourceLocale` kabhi badalta hai to yeh toot jaata hai.

Agar aap aise paths se shuru karte hain jinmein locale subdirectory (`images/screenshots/translate.png`) nahi hai, to aapko [per-locale folder](/guide/images-and-screenshots/per-locale-folder) rewriting ke kaam karne se pehle poore tree ko restructure karna hoga.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### Doc-system sites (`docsOutput.style = "doc-system"`)

Static documentation sites ke liye upyog karen jo anuvadit pages ko locale-prefixed tree ke tahat store karte hain — Docusaurus i18n, Astro Starlight, aur custom generators jo ek hi aakar ka palan karte hain. `docsRoot` ke tahat files ismein likhi jati hain:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docs[].docsOutput.docsRoot` ko apne English source root par set karein (jaise ki `"docs"` ya `"src/content/docs"`). Jab aap `style: "doc-system"` ko seedhe set karte hain, to aapko `localeSubpath` ko bhi us path segment par set karna hoga jiska upyog aapki site `{locale}/` aur translated file ke beech karti hai. aliases `"docusaurus"`, `"astro-starlight"`, aur `"vitepress"` default `localeSubpath` values ke saath preset `doc-system` layouts hain ([Output layouts](/guide/documents/output-layouts) dekhein).

| Preset alias | Default `localeSubpath` | Udaharan output |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (khali) | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""` (khaali) | `docs/de/guide/quick-start.md` |

Flat link rewriter `doc-system` ke liye **nahi** chalta hai (`"flat"` ke vipreet). `postProcessing.regexAdjustments` source markdown se original URL dekhta hai — aam taur par ek absolute ya site-root path jaise `/img/screenshots/en-GB/foo.png`.

**Per-locale folder** layout tab lagu hota hai jab screenshots ek shared static URL tree mein hote hain: pehle din se ek locale-coded folder aur ek generic `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` rule ka upyog karein ([Config — doc-system](#config---docsoutputstyle--doc-system) dekhein).

**Colocated screenshots** tab lagu hote hain jab har locale ke translated docs assets ko markdown ke bagal mein store karte hain (koi URL rewriting nahi). Aapke screenshot script ko PNGs ko `{outputDir}`, `{locale}`, aur `{localeSubpath}` se prapt paths mein likhna hoga — neeche diya gaya Docusaurus preset reference layout hai.

<a id="docusaurus-preset"></a>
#### Docusaurus preset

Do aadatein project setup par sabhi regex bridging ko baad mein samaapt kar deti hain:

1. Ek symlink `documentation/docs/assets → ../static/assets` banaayein pehle ki aap koi bhi screenshots jodein. Docusaurus ka webpack default roop se symlinks ko follow karta hai, aur isse source docs ko relative paths ka upyog karne ki anumati milti hai jo anuvaadit docs bhi upyog karenge.

2. Sabhi documentation assets — PNGs aur SVGs — ko `static/assets/` (ek directory) mein rakhein. Unhein `static/img/` (SVGs) aur `static/assets/` (PNGs) ke beech vibhaajit na karein. Ek ekikrit sthaan ka matlab hai ki pratyek doc page, English aur anuvaadit, same relative path `../assets/name.ext` ka upyog kar sakta hai.

Pratyek asset ko sthir relative path `../assets/name.ext` ke saath source markdown mein sandarbhit karein. Kabhi bhi absolute `/img/` ya `/assets/` URLs ka upyog documentation assets ke liye na karein — ve URLs English source (jo `static/` se serve hoti hai) aur anuvaadit locales (jo anuvaadit docs ke saath colocated hoti hain) ke beech alag hain, jo ek `regexAdjustments` niyam ko bridge karne ke liye majboor karta hai.

Jab aap baad mein i18n jodte hain, to screenshot script `getScreenshotDir` split ko apnata hai ([Colocated screenshots](/guide/images-and-screenshots/colocated-screenshots) dekhein) aur `translate-svg` ek `pathTemplate` ka upyog karta hai. Kisi regex adjustment ki zaroorat nahi hai.

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
# Nirnay margdarshika

```
Is the asset an SVG with translatable text or labels?
  Yes → Web app SVG or Colocated SVG
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Colocated screenshots (rasters) + Colocated SVG (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Shared image
    Otherwise → Per-locale folder
```

SVG layouts ko [SVG translation](/guide/svg-translation/) guide mein cover kiya gaya hai.

| Layout | Asset type | Site type | Tool mechanism |
|--------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| [Shared image](/guide/images-and-screenshots/shared-image) | Raster (shared) | `docsOutput.style = "flat"` docs | Per-file link rewriter; aam taur par koi regex nahi |
| [Per-locale folder](/guide/images-and-screenshots/per-locale-folder) | Raster (per-locale) | `"flat"` ya `"doc-system"` (incl. `"docusaurus"`, `"astro-starlight"`) | `regexAdjustments` locale segment swap |
| [Colocated screenshots](/guide/images-and-screenshots/colocated-screenshots) | Raster (colocated) | `"doc-system"` with colocated assets (Docusaurus preset) | Screenshot script files rakhta hai; koi regex nahi |
| [Web app SVG](/guide/svg-translation/translated-svg-web-app) | SVG (translated) | Web app | `translate-svg` with `svg.style = "flat"` |
| [Colocated SVG](/guide/svg-translation/translated-svg-colocated) | SVG (translated, colocated) | `"doc-system"` with colocated assets (Docusaurus preset) | `translate-svg` with `svg.style = "nested"` + `pathTemplate` |
