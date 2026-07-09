<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# Flat link rewriter aur two-step flow

`docsOutput.style = "flat"` ke liye (aur jab tak `rewriteRelativeLinks: false` ya ek custom `pathTemplate` set nahi kiya jata), ek built-in rewriter `postProcessing` se pehle chalta hai. Yah cross-doc links ko handle karta hai (locale suffixes jodkar) aur non-markdown asset URLs mein ek depth prefix jodta hai. Locale-specific asset paths (screenshots, `/img/…` bridges) ko phir `docsOutput.postProcessing.regexAdjustments` dwara rewrite kiya jata hai.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Do-charanee pravaah jab `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [regexAdjustments: locale segment]  →  output URL
```

`outputDir: "translated-docs/"` aur repo root par srot `README.md` ke saath udaaharan:

1. Flat link rewriter: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (`translated-docs/` ke liye ek `../`)
2. `regexAdjustments` rule `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

`docsOutput.style = "doc-system"` ke liye (jismein `"docusaurus"`, `"astro-starlight"`, aur `"nested"` shamil hain), flat link rewriter nahi chalta hai. `regexAdjustments` translated markdown se original URL dekhta hai (aam taur par `/img/screenshots/en-GB/foo.png` jaisa ek absolute path).

<a id="vitepress-link-normalizer-style-vitepress"></a>
### VitePress link normalizer (`style: "vitepress"`)

Jab `docsOutput.rewriteVitepressLinks` `true` hota hai (jab `style` `"vitepress"` ho to default), segment reassembly ke baad ek alag normalizer chalta hai (flat rewriter ke bajaye). Yah VitePress / doc-system sites ko target karta hai jahan English content root par rahti hai aur locales sibling folders (`docs/de/guide/…`) mein hote hain.

```
source href  →  [VitePress link normalizer]  →  [regexAdjustments]  →  output href
```

Aam rewrites:

| Source pattern | Normalized target |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (ek locale file se) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | aparivartit (repo paths ke liye poore URLs ka upyog karen) |

Un projects ke liye jo `README.md` → `docs/index.md` ko sync karte hain, `README.md` mein `LICENSE`, `examples/`, aur VitePress tree ke bahar ki anya files ke liye poore GitHub URLs ka upyog karen. Dekhen [VitePress integration — README as the docs homepage](/guide/vitepress-integration#readme-as-homepage).

Flat rewriter aur VitePress normalizer prati `docs[]` block mein paraspar anany hain — `regexAdjustments` se pehle sirf ek chalta hai. [VitePress integration — Link conventions](/guide/vitepress-integration#link-conventions) dekhen.

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### `flatPreserveRelativeDir` ke saath prati-file depth prefix

Depth prefix har output file ke liye compute kiya jaata hai — poore batch ke liye global roop se nahi. Har source file ke liye, rewriter output file ki directory se source file ki directory tak relative path compute karta hai aur use prefix ke roop mein upyog karta hai.

Iska matlab hai ki `flatPreserveRelativeDir: true` ke saath, subdirectories mein source files ko sahi prefix apne aap mil jaata hai. Udaaharan ke liye, `docs/guide/quick-start.md` `translated-docs/docs/guide/quick-start.<locale>.md` par output karta hai. Prati-file prefix `../../docs/` hai, isliye ek asset `translation-dashboard.png` (source tree ka ek sibling) `../../docs/translation-dashboard.png` ban jaata hai — jo `translated-docs/docs/guide/` se `docs/translation-dashboard.png` tak sahi dhang se resolve hota hai.

Source files ke saath relative-path assets ke liye kisi `regexAdjustments` correction ki zaroorat nahi hai.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` aur `linkRewriteDocsRoot`

| Option                                   | Effect                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Flat link rewriter ko spasht roop se enable ya disable karein (jab `docsOutput.style = "flat"` ho to default ko override karta hai) |
| `docsOutput.linkRewriteDocsRoot`     | Root jahan se `depthPrefix` compute kiya jaata hai (default `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Output path layout ko prabhavit karta hai, jise rewriter gyat anuvadit files ke liye target paths compute karte samay upyog karta hai       |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

Built-in rewriters dwara handle na kiye gaye image, screenshot, aur anya asset URLs ko rewrite karne ke liye `docs[].docsOutput.postProcessing` ke तहत ordered `{ "description"?, "search", "replace" }` rules configure karen — aam taur par ek locale folder segment (`screenshots/en-GB/` → `screenshots/de/`) ko swap karna ya absolute static paths ko bridge karna (`/img/…` → `../assets/…`).

Rules translated markdown **body** par segment reassembly aur built-in link rewriting (flat ya VitePress) ke baad, aur `addFrontmatter` se pehle chalti hain. Flat layout par, depth prefix lagane ke **baad** URLs ke khilaf `search` patterns likhen — path ke andar locale segment ko match karen, na ki leading `../` ko.

**Prati-locale screenshot folders (flat layout):**

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

Apne source locale (`en-GB`) ko hardcode karne ke bajaye `[^/]+` ka upyog karen taki rule `sourceLocale` badalne par bhi bana rahe. Sabse aam placeholder `${translatedLocale}` hai; `${sourceLocale}`, `${sourceFilename}`, `${translatedFilename}`, aur path variables bhi uplabdh hain — [Documents — Link rewriting](/guide/documents/link-rewriting#replace-placeholders) dekhen.

Layout-specific examples (flat, doc-system, Docusaurus, Starlight): [Per-locale folder](/guide/images-and-screenshots/per-locale-folder). General cross-page link rules: [Documents — Link rewriting](/guide/documents/link-rewriting). Field reference: [Configuration — `docs`](/reference/configuration#docs).

---

<a id="common-mistakes-and-troubleshooting"></a>

Hardcoded locale regexes, missing screenshot directories, aur Docusaurus `/img/` bridging ke liye [Common mistakes and troubleshooting](/guide/images-and-screenshots/troubleshooting) dekhen.
