<a id="svg-translation"></a>
# SVG anuvaad

**SVG illustrations aur diagrams** ke liye design kiya gaya hai jinmein manav-pathaniya labels hote hain. `translate-svg` command source `.svg` files padhta hai, `<text>`, `<title>`, aur `<desc>` elements se text nikalta hai, un strings ko active LLM provider ke madhyam se translate karta hai, aur **prati target locale ek output SVG** likhta hai.

Yeh ekmatra pipeline hai jo locale-specific **binary** SVG files utpann karta hai. `translate-docs` markdown alt text aur link references ko translate karta hai, lekin yeh SVG assets ko modify ya copy nahi karta hai. Jab kisi page ko translated labels ke saath diagram ki zaroorat hoti hai, to `features.translateSVG` ko enable karein aur top-level `svg` block ko configure karein.

<a id="per-locale-model-overrides"></a>
### Pratyaik sthanik model override

`translate-svg` models ko **prati target locale** resolve karta hai: `localeModels(locale)` pahle jab configure kiya gaya ho, phir `translationModels`. Har locale ka SVG run apni fallback chain ka upyog karta hai — yah tab upyogi hota hai jab CJK locales mein diagram labels ko script-tuned model ki zaroorat hoti hai (jaise `ja`). [Providers aur models](/hi-Latn/guide/providers-and-models#model-fallback-chain) dekhen.

SVG translation wahi SQLite cache ka upyog karta hai jo `translate-docs` aur `translate-json` (`cacheDir`) karte hain. Pehle se translate kiye gaye text segments cache se serve kiye jaate hain; kewal naya ya badla hua source text LLM ko bheja jaata hai.

<a id="when-to-use-svg-translation"></a>
### SVG translation ka upyog kab karein

`translate-svg` ka upyog tab karein jab:

- Ek SVG mein visible labels, titles, ya descriptions hon jo prati locale badalne chahiye.
- Ek web app runtime par locale-specific diagram files load karta hai (jaise `dashboard.de.svg`).
- Ek doc-system site (Docusaurus, Astro Starlight, VitePress) translated SVGs ko translated markdown ke bagal mein rakhta hai.

`translate-svg` ka upyog **na** karein:

- Decorative SVGs jinmein koi translatable text nahi hai (icons, logos, backgrounds).
- Raster screenshots (PNG, JPEG, WebP) — inhein [Images and screenshots](/hi-Latn/guide/images-and-screenshots/) ke madhyam se handle kiya jaata hai.
- Text jo path data mein bake kiya gaya hai na ki `<text>` elements mein — extractor path outlines ko padh nahi sakta.

<a id="design-for-i18n-from-the-start"></a>
### Shuru se hi i18n ke liye design karein

SVGs ko translate karna sabse aasaan hota hai jab labels pehle din se hi asli text elements hon:

- Manav-pathaniya copy ko `<text>`, `<title>`, aur `<desc>` mein rakhein.
- Apne design tool mein labels ko paths mein convert karne se bachein — path data translator ke liye apardashi hota hai.
- **Source SVGs** ko `svg.outputDir` se alag ek samarpit directory mein rakhein. Sources aur generated locale files ko milane se yeh pata lagana asambhav ho jaata hai ki kaun si files edit ya regenerate karne ke liye surakshit hain.

Web apps ke liye, `forceLowercase: true` ko enable karein jab aapka design all-lowercase labels ka upyog karta hai — yeh filesystems aur CDNs mein case-sensitivity mismatches se bachta hai.

<a id="output-layouts"></a>
### Output layouts

`translate-svg` do common output shapes ko support karta hai. Chunein ki aapka app ya doc site runtime par SVG files ko kaise reference karta hai.

| Layout | `svg.style` | Sabse achha kiske liye | Child guide |
|--------|-------------|----------|-------------|
| **Flat (web app)** | `"flat"` | Next.js, Vite, aur anya apps jo SVGs ko locale-coded filename dwara embed karte hain | [Web app (flat SVG)](/hi-Latn/guide/svg-translation/translated-svg-web-app) |
| **Colocated (doc-system)** | `"nested"` + `pathTemplate` | Docusaurus aur anya doc-system sites jahan translated assets translated pages ke bagal mein hote hain | [Colocated SVG](/hi-Latn/guide/svg-translation/translated-svg-colocated) |

**Flat layout** files ko `public/assets/diagram.de.svg` ke bagal mein `diagram.en-GB.svg` ki tarah likhta hai. Aapka app unhein locale suffix ke saath reference karta hai:

```tsx
<img src={`/assets/diagram.${locale}.svg`} alt="Architecture diagram" />
```

**Colocated layout** har locale ke SVG ko us locale ke content tree mein likhta hai (jaise `i18n/de/.../assets/diagram.svg`). Source aur translated markdown ek hi relative path (`../assets/diagram.svg`) ka upyog karte hain — kisi `regexAdjustments` rule ki zaroorat nahi hai.

Raster screenshot strategies ke saath SVG layouts kaise fit hote hain, iske liye [Images and screenshots decision guide](/hi-Latn/guide/images-and-screenshots/#decision-guide) dekhein.

<a id="step-1-enable-and-configure"></a>
### Step 1: Enable aur configure karein

Feature ko enable karein aur `translate-svg` ko apni source files aur output root par point karein:

```json
{
  "features": {
    "translateSVG": true
  },
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

Mukhya `svg` kshetr:

- `sourcePath` — ek ya ek se adhik directories ya glob patterns (udharan ke liye `"images/*.svg"`, `"**/icons/*.svg"`). Project root se recursively scan kiya gaya.
- `outputDir` — translated SVG output ke liye root directory.
- `style` — `"flat"` ya `"nested"` jab aap custom `pathTemplate` ka upyog nahi kar rahe hain.
- `pathTemplate` — optional custom output path jismein placeholders `{outputDir}`, `{locale}`, `{llocale}`, `{basename}`, `{stem}`, aur anya shamil hain (colocated doc-system layouts ke liye avashyak).
- `forceLowercase` — reassembly par lower-case translated text.

Poora field reference: [Configuration — `svg`](/hi-Latn/reference/configuration#svg).

<a id="step-2-translate"></a>
### Charan 2: Translate karein

```bash
npx ai-i18n-tools translate-svg
```

Ek single locale ka anuvad karein:

```bash
npx ai-i18n-tools translate-svg --locale de
```

Files likhe bina preview karein:

```bash
npx ai-i18n-tools translate-svg --dry-run
```

`sync` SVG step ko automatically chalata hai jab `features.translateSVG` aur `svg` dono set hote hain (`--no-svg` ke saath skip karein). Shared flags mein `-l` / `--locale`, `-p` / `--path`, `-j` / `--concurrency`, aur `--force` / `--force-update` shamil hain.

<a id="troubleshooting"></a>
### Troubleshooting

Common SVG samasyayein — mixed source/output directories, Docusaurus par absolute static URLs, aur path layout ki galtiyan — [SVG troubleshooting](/hi-Latn/guide/svg-translation/troubleshooting) mein cover ki gayi hain. Raster assets aur link rewriting ke liye, [Images and screenshots troubleshooting](/hi-Latn/guide/images-and-screenshots/troubleshooting) dekhein.
