<a id="documents"></a>
# Documents

Mukhya roop se **markdown, MDX, aur `.astro` documentation** ke liye design kiya gaya hai jo `docs[]` config blocks ke madhyam se prabandhit hota hai. Har block ka `contentPaths` field anuvad karne ke liye files ya folders ko soochibaddh karta hai.

Docusaurus sites par, `docusaurusCatalogDir` ko apne `write-translations` catalog folder (jaise `docs-site/i18n/en`) par bhi set karein. Phir `translate-docs` mein shell JSON bhi shamil hai — navbar, footer, aur theme strings.

[VitePress](/guide/vitepress-integration) sites par, page bodies wahi `docs[]` pipeline use karte hain. Nav, sidebar, aur footer labels `docsOutput.vitepressThemeCatalog` mein hote hain — `translate-docs` English catalog ko bootstrap karta hai aur pages ke saath translate karta hai, koi alag pipeline nahi.

[Nextra](/guide/nextra-integration) site par, page bodies `docs[]` pipeline ka upyog `docsOutput.style: "nextra"` ke saath karte hain. `_meta.ts` sidebar labels ko `translate-docs` dwara automatically collect aur translate kiya jaata hai; theme dictionary strings ko usi pipeline mein `docs[].nextraDictionaryPath` ke madhyam se translate kiya jaata hai.

Fumadocs ([Fumadocs](/guide/fumadocs-integration)) par maiN page bodies mein `docsOutput.style: "fumadocs"` ka upyog `fumadocsParser` `"dot"` (default) ya `"dir"` ke saath kiya jaata hai. `meta.json` sidebar labels swachaalit roop se ikatthe kiye jaate hain; UI overrides `docsOutput.fumadocsUiCatalog` ke maadhyam se anuvaadit hote hain.

Markdown mein embedded PNG aur anya raster images ke liye, [Images & Screenshots](/guide/images-and-screenshots/) dekhein. `translate-docs` kewal alt text ka anuvad karta hai; yeh raster files ko copy nahi karta hai.

README ya docs mein ek optional **language switcher** block ke liye, `docsOutput.style` ko `"flat"` par set karein — [Language switcher](/guide/documents/language-switcher) dekhein.

SVG files ka anuvad [`translate-svg`](/reference/cli-commands) ke madhyam se kiya jata hai jab `features.translateSVG` enable hota hai — `docs[]` / `contentPaths` ke madhyam se nahi.

Arbitrary nested UI JSON bundles jo documentation framework ke shell/theme strings se unrelated hain, unhe [JSON](/guide/json) pipeline mein hona chahiye, na ki `docs[]` mein.

<a id="per-locale-model-overrides"></a>
### Pratyaik sthanik model override

`translate-docs` aur `sync` ke docs step model ko **pratyaik target locale ke liye** resolve karte hain: `localeModels(locale)` pahle jab configure kiya jata hai, phir provider ki global `translationModels` chain. Iska upyog tab karein jab kisi vishesh bhasha ko aapki default fallback list se alag model ki avashyakta ho — udaharan ke liye, `pt-BR` documentation ke liye Gemini ko prefer karna jab global chain Portuguese ke saath mushkil me ho. [Providers aur models](/guide/providers-and-models#model-fallback-chain) aur [Configuration — `localeModels`](/reference/configuration#provider-and-providers) dekhein.

<a id="which-guide-to-read"></a>
## Kaun sa guide padhein

| Aapka setup | Yahan se shuru karein |
| --- | --- |
| Docusaurus site | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` — [Step 1](#step-1-initialise-for-documentation) |
| VitePress site | `init -t ui-vitepress` + `vitepressThemeCatalog` theme ke liye — [VitePress integration](/guide/vitepress-integration) |
| Nextra site | `init -t ui-nextra` + `nextraDictionaryPath` dictionary ke liye (sidebar `_meta.ts` automatic hai) — [Nextra integration](/guide/nextra-integration) |
| Fumadocs site | `init -t ui-fumadocs` + `fumadocsUiCatalog` UI ke liye (sidebar `meta.json` swachaalit hai) — [Fumadocs integration](/guide/fumadocs-integration) |
| Astro Starlight | `init -t ui-starlight` — [Step 1](#step-1-initialise-for-documentation) |
| Flat documents (README, changelogs, etc.) | `docsOutput.style = "flat"` — [Output layouts](/guide/documents/output-layouts), optional [language switcher](/guide/documents/language-switcher) |
| Jahan anuvadit files aati hain | [Output layouts](/guide/documents/output-layouts) |
| Cross-page `#anchor` links | [Anchor links](/guide/documents/anchor-links) |
| Link aur asset URL rewriting (`regexAdjustments`) | [Link rewriting](/guide/documents/link-rewriting) |
| Docs mein screenshots | [Images & Screenshots](/guide/images-and-screenshots/) |
| `translate-docs` flags aur cache | [CLI options](/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Step 1: Documentation ke liye initialise karein

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Astro Starlight documentation sites ke liye:

```bash
npx ai-i18n-tools init -t ui-starlight
```

VitePress documentation sites ke lie:

```bash
npx ai-i18n-tools init -t ui-vitepress
```

Nav/sidebar/footer strings ke liye `docsOutput.vitepressThemeCatalog` set karein — [VitePress integration](/guide/vitepress-integration) dekhein.

Nextra documentation sites ke liye:

```bash
npx ai-i18n-tools init -t ui-nextra
```

Theme dictionary strings ke liye `docs[].nextraDictionaryPath` set karein — [Nextra integration](/guide/nextra-integration) dekhein. Sidebar `_meta.ts` labels apne aap collect ho jaate hain.

Fumadocs documentation sites ke liye:

```bash
npx ai-i18n-tools init -t ui-fumadocs
```

UI overrides ke liye `docsOutput.fumadocsUiCatalog` set karein — [Fumadocs integration](/guide/fumadocs-integration) dekhein. Sidebar `meta.json` labels apne aap collect ho jaate hain.

Plain Astro website UI ke liye (koi Starlight nahi):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

Vah template kewal UI extraction ko enable karta hai. Page HTML anuvad ke liye, `features.translateDocs` bhi set karein aur ek `docs[]` block jodein (dekhein [Astro website pages (parse-and-replace)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) config dono pipelines ko ek saath dikhata hai.

Generate kiye gaye `ai-i18n-tools.config.json` ko edit karein:

- `sourceLocale` - source bhasha (`docusaurus.config.js` mein `defaultLocale` se match hona chahiye).
- `targetLocales` - BCP-47 locale codes ka array (jaise `["de", "fr", "es"]`).
- `cacheDir` - sabhi pipelines ke liye shared SQLite cache directory (aur `--write-logs` ke liye default log directory).
- `docs` - documentation blocks ka array. Har block mein optional `description`, `contentPaths` (string ya array; file, directory, ya glob), `outputDir`, optional `docusaurusCatalogDir`, `docsOutput`, optional `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, aadi.
- `docs[].description` - vikalpik chhota note maintainer ke liye. Jab yah set kiya jaata hai, toh yah `translate-docs` headline mein aur `status` section headers mein dikhaai deta hai.
- `docs[].contentPaths` - markdown/MDX/`.astro` sources (aur vikalpik `docusaurusCatalogDir` Docusaurus shell JSON ke liye).
- `docs[].outputDir` - anuvaadit output root us block ke liye.
- `docs[].docsOutput.style` - `"nested"` (default), `"flat"`, `"doc-system"`, ya alias `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (dekhie [Output layouts](/guide/documents/output-layouts)).

**Primary vs supplementary:** Localised pages ke liye `contentPaths` par dhyaan den. Jab aapko `write-translations` se Docusaurus shell JSON ki bhi zaroorat ho to `docusaurusCatalogDir` set karen. Yadi aap kewal pages translate karte hain to `docusaurusCatalogDir` ko chhod den.

<a id="step-2-translate-documents"></a>
## Step 2: Documents ka anuvad karein

```bash
npx ai-i18n-tools translate-docs
```

Yeh har `docs[]` block ke `contentPaths` (aur Docusaurus catalog JSON jab `docusaurusCatalogDir` set ho) mein sabhi files ko sabhi prabhavi documentation locales mein translate karta hai. Pehle se translate kiye gaye segments SQLite cache se serve kiye jaate hain — kewal naye ya badle hue segments LLM ko bheje jaate hain.

Ek single locale ko translate karne ke liye:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Yah jaanchne ke liye ki kya translate karna hai:

```bash
npx ai-i18n-tools status
```

Flags, cache behavior, aur batch prompt format ke liye, [CLI options](/guide/documents/cli-options) dekhen.

<a id="complex-markdown-and-failed-quality-checks"></a>
## Complex Markdown aur asafal quality checks

`translate-docs` yah jaanchta hai ki har translated segment markdown structure (document se parse kiye gaye emphasis sahit) ko banaye rakhta hai. Aise paragraphs jo `bold` spans ko `` `inline code` `` ke aas-paas stack karte hain, backticks ko bold ke andar nest karte hain (jaise template literals jaise ki `` `fetch(\`/locales/${code}.json\`)` ``), ya ek lambe sentence mein bold aur code ko bunate hain, ve najuk hote hain: kuch locales ko alag word order ki zaroorat hoti hai, jo yah badal sakta hai ki translation ke baad `**` aur `` ` `` kaise align hote hain aur `AST mismatch` jaise CLI errors ko trigger karte hain.

**Yadi aapko is tarah ki validation failure milti hai, to source-language text ko saral banana pasand karen** — paragraph ko vibhajit karen, ek udaharan ko fenced code block mein le jaayen, ya usi vichar ko kam layered bold/code pairs ke saath varnit karen — bajaye iske ki har model aur locale se ghane inline markup ko poori tarah se reproduce karne ki ummeed karen.

Jab har configured model ek hi segment par `AST mismatch` ke saath fail ho jaata hai, to `translate-docs` us segment ko automatically chhote parts mein split kar sakta hai (pahle list midpoint, phir single list items ya chhote paragraph chunks), har part ko pahle model se retry kar sakta hai, aur original segment cache key ke tahat result ko phir se jod sakta hai. Yah default roop se on hai (`segmentSplitting.qualityRetrySplit`); model exhaustion ke baad rukne ke liye ise `false` par set karen. Jab yah fallback chalta hai to run summary `Quality split retries` report karta hai.

Yeh dekhne ke liye ki **kaun se segments asafal rahe**, kitni baar, aur store kiye gaye **quality / error messages**, Translation Dashboard ke **Failures** tab ka upyog karen ([Translation Dashboard → Failures](/guide/translation-dashboard/failures#failures-document-translation)).
