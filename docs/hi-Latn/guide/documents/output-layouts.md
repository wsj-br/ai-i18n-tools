<a id="output-layouts"></a>
# Output layout

`docsOutput.style` niyantrit karta hai ki translated markdown files kahan likhe jaate hain. `docs[].docsOutput.style` mein neeche diye gaye exact string values ka upyog karen (aliases preset layouts hain, alag engines nahi).

`docsOutput.style = "nested"` (jab omit kiya jata hai to default) — `{outputDir}/{locale}/` ke tahat source tree ko mirror karta hai (jaise `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — static docs sites ke liye locale-prefixed documentation tree. `docsRoot` ke tahat files `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` mein likhe jaate hain. `docsRoot` ke bahar ke paths nested layout par fallback karte hain. `docs[].docsOutput.docsRoot` ko apne English source root par set karen (jaise `"docs"` ya `"src/content/docs"`). Jab `docsOutput.style = "doc-system"`, to aapko `localeSubpath` ko explicitly set karna hoga (presets ke liye neeche ek alias ka upyog karen).

**Aliases** (saman layout engine, preset `localeSubpath`):

- `docsOutput.style = "docusaurus"` — `localeSubpath` default roop se `docusaurus-plugin-content-docs/current` (Docusaurus i18n plugin layout) par set hota hai.
- `docsOutput.style = "astro-starlight"` — `localeSubpath` default roop se `""` par set hota hai (anuvadit prishth seedhe `{outputDir}/{locale}/` ke neeche, [Starlight](https://starlight.astro.build/guides/i18n/) se mel khate hain jab angrezi content root par hoti hai aur `outputDir` barabar hota hai `docsRoot` ke).
- `docsOutput.style = "vitepress"` — `doc-system` jaisa hi layout hai jismein `localeSubpath` khaali hai; BCP-47 locale folder ke naam surakshit rakhe jaate hain (`localePathLowercase` default roop se `false` par set hota hai). [VitePress integration](/guide/integrations/vitepress) dekhen.
- `docsOutput.style = "nextra"` — `doc-system` jaisa hi layout hai jismein `localeSubpath` khaali hai; angrezi source ek locale folder ke neeche rahta hai (jaise `content/en/`). [Nextra integration](/guide/integrations/nextra) dekhen.
- `docsOutput.style = "fumadocs"` — `doc-system` jaisa hi layout hai jismein `localeSubpath` khaali hai; angrezi source dot-suffix files (default) ya ek locale folder ka upyog karta hai jab `fumadocsParser` `"dir"` ho. [Fumadocs integration](/guide/integrations/fumadocs) dekhen.

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

Fumadocs preset — dot parser (default; English source ke bagal mein locale suffix):

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

Fumadocs preset — dir parser (Nextra-style locale folders):

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Optional JSON labels — `docusaurusCatalogDir` se Docusaurus shell strings (MDX body copy nahi):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight kai locales ke liye UI strings ship karta hai; optional custom UI overrides `src/content/i18n/en.json` ka upyog `jsonPathTemplate: "{outputDir}/{locale}.json"` ke saath ek alag `docs[]` block mein karte hain jab zaroorat ho.

VitePress nav/sidebar/footer strings markdown mein nahin hain — `docsOutput.vitepressThemeCatalog` ko configure karen aur **`translate-docs`** ke andar anuvad karen. [VitePress integration](/guide/integrations/vitepress) dekhen.

Nextra theme dictionary (`.ts`) aur `_meta.ts` sidebar labels markdown mein nahin hain — `docs[].nextraDictionaryPath` aur automatic `_meta` collection ka upyog karen jab `style: "nextra"` ho, sabhi **`translate-docs`** ke andar. [Nextra integration](/guide/integrations/nextra) dekhen.

Fumadocs UI overrides (`lib/layout.shared.ts`) aur `meta.json` sidebar labels markdown mein nahin hain — `docsOutput.fumadocsUiCatalog` aur automatic `meta.json` collection ka upyog karen jab `style: "fumadocs"` ho, sabhi **`translate-docs`** ke andar. [Fumadocs integration](/guide/integrations/fumadocs) dekhen.

`docsOutput.style = "flat"` — translated files ko source ke bagal mein locale suffix ke saath, ya ek subdirectory mein rakhta hai. Pages ke beech relative links automatically rewrite ho jaate hain jab `docsOutput.style = "flat"` (jab tak `rewriteRelativeLinks: false` ya ek custom `pathTemplate` set na ho).

```text
docs/guide.md → i18n/guide.de.md
```

Flat layout mein cross-page anchor links ke liye, [Anchor links](/guide/documents/anchor-links) dekhen.

Built-in relative-link fixes ke alawa link aur asset URL rewriting ke liye, [Link rewriting](/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`) dekhein.

Translate kiye gaye pages mein screenshots aur raster assets ke liye, [Images & Screenshots](/guide/images-and-screenshots/) dekhen.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` placeholders

Jahan translated files likhe jaate hain, use `docs[].docsOutput.pathTemplate` (markdown aur MDX) ya `jsonPathTemplate` (JSON label files) set karke override karen. Dono ek hi placeholders ko swikar karte hain. Resolved paths ko us block ke `outputDir` ke andar hi rehna chahiye (CLI un paths ko reject karta hai jo isse bahar nikalte hain).

Yadi aap ek custom `pathTemplate` ka upyog karte hain, to `rewriteRelativeLinks` default roop se `false` par set hota hai jab tak ki aap ise spasht roop se set na karein — relative link rewriting `docsOutput.style = "flat"` ke liye banaya gaya hai bina kisi custom template ke.

Built-in layouts (`nested`, `flat`, `doc-system` bina custom template ke) ke liye, lowercased locale folder ya filename segments (jaise `pt-br` ki jagah `pt-BR`) likhne ke liye `docsOutput.localePathLowercase` ko `true` par set karein. `astro-starlight` alias ise default roop se `true` par set karta hai. Custom `pathTemplate` / `jsonPathTemplate` values aparivartit rehte hain — jab aapko lowercased segments ki zaroorat ho jabki `{locale}` ko BCP-47 ke roop mein rakhte hue, wahan `{llocale}` ka upyog karein.

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
