<a id="link-rewriting"></a>
# Link punarlekhana (rewriting)

`translate-docs` anuvaadit markdown mein URLs ko punarlekhit karta hai taaki jab files locale-specific paths par move hon, toh links abhi bhi resolve hon. Adhikansh cross-page links swatah handle ho jaate hain; jab aapki site ek shared static URL tree ya locale-coded asset folders ka upyog karti hai, toh `docsOutput.postProcessing.regexAdjustments` rules joden.

Screenshot directory layouts, flat depth-prefix + locale-swap flow, aur layout-specific asset examples ke liye, [Images & Screenshots — Link rewriting](/hi-Latn/guide/images-and-screenshots/link-rewriting) dekhen.

<a id="built-in-rewriters"></a>
## Built-in rewriters

Kaun sa rewriter chalta hai, yeh `docsOutput.style` par nirbhar karta hai:

| Layout | Built-in rewriter | Yeh kya theek karta hai |
| --- | --- | --- |
| `"flat"` (jab koi custom `pathTemplate` na ho toh default) | Flat link rewriter (`rewriteRelativeLinks`, default roop se chalu) | Cross-page relative links (`guide.md` → `guide.de.md`) aur non-markdown asset URLs ke liye depth prefixes |
| `"vitepress"` | VitePress link normalizer (`rewriteVitepressLinks`, default roop se chalu) | README-style `docs/guide/…` paths → site routes (`/guide/…`) |
| `"nextra"` | Nextra link normalizer (`rewriteNextraLinks`, default roop se chalu) | `content/en/…` aur relative `.mdx` paths → locale-neutral routes (`/guide/…`) |
| `"fumadocs"` | Fumadocs link normalizer (`rewriteFumadocsLinks`, default roop se chalu) | `content/docs/…` aur relative `.mdx` paths → locale-neutral routes (`/docs/…`) |
| `"doc-system"`, `"docusaurus"`, `"astro-starlight"` | Koi nahi | Source URLs `postProcessing` tak bina badle rehte hain |

Custom `pathTemplate` flat rewriter ko disable kar deta hai jab tak aap `rewriteRelativeLinks: true` ko spasht roop se set na karen. Cross-page `#anchor` handling ke liye [Output layouts](/hi-Latn/guide/documents/output-layouts) aur [Anchor links](/hi-Latn/guide/documents/anchor-links) dekhen.

VitePress-vishisht lekhak niyamom ke liye, dekhen [VitePress integration — Link conventions](/hi-Latn/guide/integrations/vitepress#link-conventions).

Nextra-vishisht lekhak niyamom ke liye, dekhen [Nextra integration — Link conventions](/hi-Latn/guide/integrations/nextra#link-conventions).

Fumadocs-vishisht lekhak niyamom ke liye, dekhen [Fumadocs integration — Link conventions](/hi-Latn/guide/integrations/fumadocs#link-conventions).

<a id="postprocessingregexadjustments"></a>
## `postProcessing.regexAdjustments`

Jab built-in rewriters paryapt na hon, toh `docs[].docsOutput.postProcessing` ke tahat ordered `{ "description"?, "search", "replace" }` rules joden — udaharan ke liye:

- Screenshot ya image URLs jinmein ek **locale folder segment** shamil ho (`screenshots/en-GB/` → `screenshots/de/`)
- Absolute site-root paths (`/img/…`) jo English source aur anuvaadit output trees ke beech alag-alag hon
- Koi bhi URL pattern jise har target locale ke liye badalna ho lekin jo ek simple relative markdown link na ho

`postProcessing` **punah-sankalit anuvaadit markdown body** par chalta hai (YAML front matter keys aur non-prose values surakshit rakhe jaate hain). Yeh segment punah-sankalan aur built-in link punarlekhana ke **baad**, aur `addFrontmatter` ke **pahle** execute hota hai.

<a id="two-step-flow-with-flat-layout"></a>
### Flat layout ke saath do-charan pravah

Jab `docsOutput.style = "flat"`, flat link rewriter pahle chalta hai, phir `regexAdjustments`:

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

`outputDir: "translated-docs/"` aur repo root par srot `README.md` ke saath udaaharan:

1. Flat rewriter: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments`: `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

Locale segment ko match karne ke liye `search` patterns likhen **jo pehle se hi prefixed URL ke andar ho** — aapko regex mein `../` depth prefix shamil karne ki zaroorat nahi hai.

`doc-system` layouts ke liye, flat rewriter nahi chalta hai. `regexAdjustments` source markdown se original URL dekhta hai (aam taur par `/img/screenshots/en-GB/foo.png` jaisa ek absolute path).

Depth-prefix behaviour aur `flatPreserveRelativeDir` ke liye [The flat link rewriter and two-step flow](/hi-Latn/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow) dekhen.

<a id="replace-placeholders"></a>
### `replace` placeholders

`replace` string har template variable ko support karte hain jo har file aur locale ke liye expand hote hain:

| Placeholder | Value |
| --- | --- |
| `${translatedLocale}` | Target locale (normalized BCP-47) |
| `${sourceLocale}` | Source locale |
| `${sourceFullPath}` | Absolute source file path (POSIX `/`) |
| `${translatedFullPath}` | Absolute translated output path |
| `${sourceFilename}` / `${translatedFilename}` | Extension ke saath basename |
| `${sourceBasedir}` / `${translatedBasedir}` | Source / output file ki parent directory |

`search` ek regex pattern hai. Ek plain string `g` flag ka upyog karta hai; jab aapko anya flags ki zaroorat ho to `/pattern/flags` ka upyog karein (pattern mein unescaped `/` characters nahi hone chahiye).

<a id="common-patterns"></a>
## Common patterns

<a id="per-locale-asset-folder"></a>
### Har-locale asset folder

Assets ko shuru se hi locale-coded subdirectory ke under store karein aur segment ko ek generic rule ke saath swap karein:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

Apne source locale (`en-GB`) ko hardcode karne ke bajaye `[^/]+` ka upyog karein taaki rule tab bhi kaam kare jab `sourceLocale` badalta hai.

Poori jaankari: [Images & Screenshots — Per-locale folder](/hi-Latn/guide/images-and-screenshots/per-locale-folder).

<a id="doc-system-static-urls"></a>
### Doc-system static URLs

Docusaurus, Starlight, ya anya `doc-system` sites ke liye jo shared static tree se screenshots serve karte hain:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

Jab aapka generator iska samarthan karta hai to source markdown mein colocated relative paths (`../assets/name.png`) ko prefer karein — tab kisi `regexAdjustments` bridge ki zaroorat nahi hoti. Layout choices ke liye [Images & Screenshots](/hi-Latn/guide/images-and-screenshots/) dekhein.

<a id="when-regex-is-not-needed"></a>
### Jab regex ki zaroorat nahi hoti

Aapko aam taur par `regexAdjustments` ki zaroorat **nahi** hoti jab:

- Cross-page links simple relative markdown paths hote hain aur `docsOutput.style = "flat"` (built-in rewriter locale suffixes jodta hai)
- Assets source files ke bagal mein hote hain aur flat rewriter ka per-file depth prefix unhe sahi dhang se resolve karta hai
- English aur har translated copy **ek hi** URL ka upyog karte hain (site root par shared images, colocated assets, normalizer ke baad VitePress site routes)
- VitePress in-site links site routes ya `docs/guide/…` paths ka upyog karte hain `rewriteVitepressLinks: true` ke saath
- Nextra aur Fumadocs in-page links locale-neutral routes (`/guide/…`, `/docs/…`) ya content-root paths ka upyog karte hain `rewriteNextraLinks` / `rewriteFumadocsLinks: true` ke saath

<a id="full-config-example"></a>
## Poora config example

Prati README jismein har locale ke liye screenshots aur ek optional language-switcher block ho:

<details>
<summary>Flat layout: regexAdjustments + languageListBlock</summary>

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

Field reference: [Configuration — `docs`](/hi-Latn/reference/configuration#docs) (`docsOutput.postProcessing`).

<a id="troubleshooting"></a>
## Troubleshooting

| Lakshan | Sambhavit karan | Kya check karein |
| --- | --- | --- |
| Anuvadit page 404s ek image ya static asset par | Aapke URL layout ke liye `regexAdjustments` gayab ya galat | [Images & Screenshots — Troubleshooting](/hi-Latn/guide/images-and-screenshots/troubleshooting) |
| Link sahi file kholta hai lekin galat `#section` | Anchor slug drift, URL rewriting nahi | [Anchor links](/hi-Latn/guide/documents/anchor-links) |
| `regexAdjustments` rule ka flat layout par koi asar nahi | `search` pre-rewriter URL ki ummeed karta hai lekin flat layout ne pehle hi depth prefix jod diya hai | Prefixed path ke andar segment ko match karein ([two-step flow](#two-step-flow-with-flat-layout) dekhein) |
| Invalid regex runtime par skip ho gaya | Galat `search` pattern | CLI rule `description` ke saath warn karta hai; sample anuvadit output ke khilaf patterns ka test karein |
