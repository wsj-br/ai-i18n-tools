<a id="output-layouts"></a>
# Output layout

`docsOutput.style` niyantrit karta hai ki anuvaadit markdown files kahan likhe jaate hain. Neeche diye gaye exact string values ko `docs[].docsOutput.style` mein upyog karein. Aliases preset `doc-system` layouts (ya Fumadocs dot-suffix layout) hain, alag engines nahi — config loading alias `style` values ko canonical `"doc-system"` mein rewrite kar sakta hai jabki original preset ko `stylePreset` mein surakshit rakhta hai.

Kisi bhi built-in layout ko override karne ke liye `docs[].docsOutput.pathTemplate` (markdown/MDX) ya `jsonPathTemplate` (JSON label files) set karein. Neeche [pathTemplate placeholders](#pathtemplate--jsonpathtemplate-placeholders) dekhein.

<a id="layout-overview"></a>
## Layout ka overview

| `docsOutput.style` | Engine | Aam upyog | 
| --- | --- | --- | 
| `"nested"` | Locale folder poore source tree ko mirror karta hai | Default; `{outputDir}/{locale}/` ke tahat generic i18n output |
| `"flat"` | Filename mein locale suffix (optional subdirs) | README, changelogs, repo-root docs, [language switcher](/hi-Latn/guide/documents/language-switcher) |
| `"doc-system"` | Locale folder + optional `localeSubpath` `docsRoot` ke tahat | Custom static-docs generators |
| `"docusaurus"` | `doc-system` preset | [Docusaurus](/hi-Latn/guide/integrations/docusaurus) i18n plugin layout |
| `"astro-starlight"` | `doc-system` preset (`localeSubpath: ""`) | [Astro Starlight](/hi-Latn/guide/integrations/astro#astro-starlight), plain Astro locale pages |
| `"vitepress"` | `doc-system` preset (`localeSubpath: ""`) | [VitePress](/hi-Latn/guide/integrations/vitepress) locale folders English ke bagal mein |
| `"nextra"` | `doc-system` preset (`localeSubpath: ""`) | [Nextra](/hi-Latn/guide/integrations/nextra) locale folders (`content/en/` → `content/{locale}/`) |
| `"fumadocs"` | Dot suffix (default) ya `doc-system` jab `fumadocsParser: "dir"` | [Fumadocs](/hi-Latn/guide/integrations/fumadocs) dot ya dir content layout |

<a id="nested-default"></a>
## `nested` (default)

`docsOutput.style = "nested"` (jab omit kiya gaya ho to default) — `{outputDir}/{locale}/` ke tahat source tree ko mirror karta hai.

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

`docsRoot` ke bahar ke paths (jab set ho) wahi nested shape ka upyog karte hain.

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"` — anuvaadit files ko `outputDir` ke tahat filename mein locale suffix ke saath likhta hai. By default kewal basename rakha jaata hai (`{outputDir}/{stem}.{locale}{extension}`), isliye `docs/guide.md` aur `docs/other/guide.md` takraayenge jab tak aap `flatPreserveRelativeDir` ko enable nahi karte.

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

Pages ke beech ke relative links automatically rewrite ho jaate hain jab `docsOutput.style = "flat"` (jab tak `rewriteRelativeLinks: false` ya ek custom `pathTemplate` set na ho). Cross-page `#anchor` handling ke liye [Anchor links](/hi-Latn/guide/documents/anchor-links) dekhein.

<a id="flat-with-flatpreserverelativedir"></a>
### `flat` ke saath `flatPreserveRelativeDir`

`docsOutput.flatPreserveRelativeDir` ko `true` par set karein taaki source subdirectories `outputDir` ke tahat rahein. Iska upyog tab karein jab aap multiple markdown files ka anuvaad kar rahe hon jo alag-alag folders mein basenames share karte hain, ya jab flat outputs ko ek shallow tree ko mirror karna ho (jaise repo root par README plus `docs/*.md`).

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

Flat link rewriter asset URLs ke liye depth prefixes compute karte samay per-file output path ka upyog karta hai — [Link rewriting](/hi-Latn/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir) dekhein.

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` — static docs site ke liye locale-prefixed documentation tree. `docsRoot` ke antargat files yahaan likhi jaati hain:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docsRoot` ke baahar ke path [nested](#nested) layout (`{outputDir}/{locale}/{relPath}`) par wapas aa jaate hain.

`docs[].docsOutput.docsRoot` ko apne English source root par set karein (jaise `"docs"`, `"src/content/docs"`, ya `"content/en"`). Jab `docsOutput.style = "doc-system"`, to aapko `localeSubpath` ko spasht roop se set karna hoga (presets ke liye neeche ek alias ka upyog karein). `localeSubpath: ""` ka upyog karein jab translated pages seedhe `{outputDir}/{locale}/` ke neeche hon (Starlight-style).

`docusaurusCatalogDir` se Docusaurus shell JSON aur doc-system presets ke antargat anya JSON artifacts markdown ke samaan folder layout ka palan karte hain. `style: "flat"` ke saath, JSON label files abhi bhi nested shape ka upyog karte hain jab tak aap `jsonPathTemplate` set nahin karte.

<a id="doc-system-aliases"></a>
## Doc-system aliases

**Aliases** (wahi `doc-system` engine, preset `localeSubpath` aur defaults):

- `docsOutput.style = "docusaurus"` — `localeSubpath` default roop se `docusaurus-plugin-content-docs/current` (Docusaurus i18n plugin layout) par set hota hai.
- `docsOutput.style = "astro-starlight"` — `localeSubpath` default roop se `""` par set hota hai; `localePathLowercase` default roop se `true` par set hota hai. Translated pages `{outputDir}/{locale}/` ke antargat, [Starlight](https://starlight.astro.build/guides/i18n/) se mel khaate hain jab English content root par ho aur `outputDir` `docsRoot` ke barabar ho. Plain Astro locale pages ke liye bhi upyog kiya jaata hai (`src/pages/index.astro` → `src/pages/{locale}/index.astro`) — [Astro website pages](/hi-Latn/guide/ui-strings/astro-website#pages-parse-and-replace) dekhein.
- `docsOutput.style = "vitepress"` — `doc-system` jaisa hi layout jismein `localeSubpath` khaali hai; BCP-47 locale folder names ko surakshit rakha jaata hai (`localePathLowercase` default roop se `false` par set hota hai). [VitePress integration](/hi-Latn/guide/integrations/vitepress) dekhein.
- `docsOutput.style = "nextra"` — `doc-system` jaisa hi layout jismein `localeSubpath` khaali hai; English source ek locale folder ke antargat hota hai (jaise `content/en/`). [Nextra integration](/hi-Latn/guide/integrations/nextra) dekhein.

Docusaurus preset (primary documentation pages):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight preset (saman block shape, alag paths):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

VitePress preset (content root par English, source ke bagal mein locale folders):

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Nextra preset (locale folder ke neeche angrezi, targets ke liye sibling locale folders):

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

Optional JSON labels — `docusaurusCatalogDir` se Docusaurus shell strings (MDX body copy nahi):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight kai locales ke liye UI strings ship karta hai; optional custom UI overrides `src/content/i18n/en.json` ka upyog `jsonPathTemplate: "{outputDir}/{locale}.json"` ke saath ek alag `docs[]` block mein karte hain jab zaroorat ho.

VitePress nav/sidebar/footer strings markdown mein nahin hain — `docsOutput.vitepressThemeCatalog` ko configure karen aur **`translate-docs`** ke andar anuvad karen. [VitePress integration](/hi-Latn/guide/integrations/vitepress) dekhen.

Nextra theme dictionary (`.ts`) aur `_meta.ts` sidebar labels markdown mein nahin hain — `docs[].nextraDictionaryPath` aur automatic `_meta` collection ka upyog karen jab `style: "nextra"` ho, sabhi **`translate-docs`** ke andar. [Nextra integration](/hi-Latn/guide/integrations/nextra) dekhen.

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` — Fumadocs content layout via `docsOutput.fumadocsParser`:

- **`"dot"` (default)** — filename mein locale suffix English sources ke bagal mein `outputDir` ke antargat (locale folder nahin). Yeh `doc-system` path shape se alag hai.

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** — Nextra-style locale folders; khaali `localeSubpath` ke saath wahi `doc-system` engine ka upyog karta hai.

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Fumadocs UI overrides (`lib/layout.shared.ts`) aur `meta.json` sidebar labels markdown mein nahin hain — `docsOutput.fumadocsUiCatalog` aur automatic `meta.json` collection ka upyog karen jab `style: "fumadocs"` ho, sabhi **`translate-docs`** ke andar. [Fumadocs integration](/hi-Latn/guide/integrations/fumadocs) dekhen.

Built-in relative-link fixes ke alawa link aur asset URL rewriting ke liye, [Link rewriting](/hi-Latn/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`) dekhein.

Translate kiye gaye pages mein screenshots aur raster assets ke liye, [Images & Screenshots](/hi-Latn/guide/images-and-screenshots/) dekhen.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` placeholders

Jahan translated files likhe jaate hain, use `docs[].docsOutput.pathTemplate` (markdown aur MDX) ya `jsonPathTemplate` (JSON label files) set karke override karen. Dono ek hi placeholders ko swikar karte hain. Resolved paths ko us block ke `outputDir` ke andar hi rehna chahiye (CLI un paths ko reject karta hai jo isse bahar nikalte hain).

Yadi aap ek custom `pathTemplate` ka upyog karte hain, to `rewriteRelativeLinks` default roop se `false` par set hota hai jab tak ki aap ise spasht roop se set na karein — relative link rewriting `docsOutput.style = "flat"` ke liye banaya gaya hai bina kisi custom template ke.

Built-in layouts ke liye (`nested`, `flat`, `doc-system` bina custom template ke), `docsOutput.localePathLowercase` ko `true` par set karein taaki lowercased locale folder ya filename segments likhe ja sakein (jaise `pt-br` ki jagah `pt-BR`). `astro-starlight` alias aur `doc-system` khaali `localeSubpath` ke saath config load par ise `true` par default karte hain. Custom `pathTemplate` / `jsonPathTemplate` values aparivartit rahte hain — wahaan `{llocale}` ka upyog karein jab aapko lowercase segments ki zaroorat ho jabki `{locale}` ko BCP-47 ke roop mein rakha jaaye.

| Placeholder            | Bhumika                                                                                                    | Udaharan                                                         |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Is documentation block ke `outputDir` ka absolute resolved path                                            | `/home/acme/repo/i18n`                                           |
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
