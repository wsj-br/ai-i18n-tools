<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# Flat link rewriter aur two-step flow

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

<a id="vitepress-link-normalizer"></a>
### VitePress link normalizer (`style: "vitepress"`)

Jab `docsOutput.rewriteVitepressLinks` `true` hota hai (jab `style` `"vitepress"` ho to default), segment reassembly ke baad ek alag normalizer chalta hai (flat rewriter ke bajaye). Yah VitePress / doc-system sites ko target karta hai jahan English content root par rahti hai aur locales sibling folders (`docs/de/guide/…`) mein hote hain.

```
source href  →  [VitePress link normalizer]  →  [postProcessing]  →  output href
```

Aam rewrites:

| Source pattern | Normalized target |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (ek locale file se) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | aparivartit (repo paths ke liye poore URLs ka upyog karen) |

Un projects ke liye jo `README.md` → `docs/index.md` ko sync karte hain, `README.md` mein `LICENSE`, `examples/`, aur VitePress tree ke bahar ki anya files ke liye poore GitHub URLs ka upyog karen. Dekhen [VitePress integration — README as the docs homepage](/guide/vitepress-integration#readme-as-homepage).

Flat rewriter aur VitePress normalizer `docs[]` block ke hisaab se mutually exclusive hain — `postProcessing` se pahle sirf ek chalta hai. Dekhein [VitePress integration — Link conventions](/guide/vitepress-integration#link-conventions).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### `flatPreserveRelativeDir` ke saath prati-file depth prefix

Depth prefix har output file ke liye compute kiya jaata hai — poore batch ke liye global roop se nahi. Har source file ke liye, rewriter output file ki directory se source file ki directory tak relative path compute karta hai aur use prefix ke roop mein upyog karta hai.

Iska matlab hai ki `flatPreserveRelativeDir: true` ke saath, subdirectories mein source files ko sahi prefix apne aap mil jaata hai. Udaaharan ke liye, `docs/guide/quick-start.md` `translated-docs/docs/guide/quick-start.<locale>.md` par output karta hai. Prati-file prefix `../../docs/` hai, isliye ek asset `translation-dashboard.png` (source tree ka ek sibling) `../../docs/translation-dashboard.png` ban jaata hai — jo `translated-docs/docs/guide/` se `docs/translation-dashboard.png` tak sahi dhang se resolve hota hai.

Source files ke saath relative-path assets ke liye kisi `postProcessing` regex correction ki zaroorat nahi hai.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` aur `linkRewriteDocsRoot`

| Option                                   | Effect                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Flat link rewriter ko spasht roop se enable ya disable karein (jab `docsOutput.style = "flat"` ho to default ko override karta hai) |
| `docsOutput.linkRewriteDocsRoot`     | Root jahan se `depthPrefix` compute kiya jaata hai (default `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Output path layout ko prabhavit karta hai, jise rewriter gyat anuvadit files ke liye target paths compute karte samay upyog karta hai       |

---

<a id="common-mistakes-and-troubleshooting"></a>
