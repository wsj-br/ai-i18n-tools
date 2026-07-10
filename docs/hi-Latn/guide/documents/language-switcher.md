<a id="language-switcher-languagelistblock"></a>
# Bhasha swicher (`languageListBlock`)

Jab anuvadit markdown files mein **"Doosri bhashaon mein padhen"** links ki ek row shamil honi chahiye, to `docsOutput.postProcessing.languageListBlock` ka upyog karen - har locale ke liye ek link, jismein `href` values har output file ke saapeksh gani jati hain.

Yah repository [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) (`translated-docs/` ke tahat flat output) ke liye iska upyog karti hai. `translate-docs` ke baad, har anuvadit copy ko ek naya block milta hai; udaharan ke liye [translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) `translated-docs/` ke tahat sibling locale files aur repo root par English source se link karta hai.

`docsOutput.style = "flat"` (ya koi anya layout jahan sibling locale files ko relative path se address kiya ja sake) ki avashyakta hai. [Output layouts](/hi-Latn/guide/documents/output-layouts) dekhen.

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. Source markdown mein block ko mark karen

Switcher ko HTML (ya kisi bhi lines) mein `start` aur `end` substring markers dwara gherein. Yah repo upyog karta hai:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/hi-Latn/) · [Deutsch](./README.de.md) · …</small>
```

Shuruaati link text sirf ek placeholder hai. `translate-docs` poore slice ko badal deta hai pehli line se jismein `start` hai, pehli baad ki line tak jismein `end` hai (fenced code blocks ke andar ke markers ko ignore kiya jaata hai taaki ek hi file mein config examples match na karein).

<a id="2-configure-the-block"></a>
## 2. Block ko configure karen

`start` aur `end` manmaane substring markers hain — unhein `<small id="lang-list">` / `</small>` hone ki zaroorat nahi hai. Koi bhi opening aur closing text chunein jo sirf language-switcher slice par dikhta hai: ek aur HTML tag (`<div class="lang-switcher">` … `</div>`), HTML comments (`<!-- lang-list -->` … `<!-- /lang-list -->`), ya sirf markdown boundaries (jaise ki ek line `**Languages:**` se ek line `---` tak). Config mein `start` aur `end` ko theek waisa hi set karein jaisa aapne source file mein daala hai.

Root config ([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Field       | Role                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Substring jo block ki opening line ko identify karta hai                                                  |
| `end`       | Closing line par substring (ek hi line par `start` ke saath ho sakta hai jab dono ek hi line par dikhein)             |
| `separator` | Generated `[label](href)` links ke beech ka text (yeh repo `" · "` ka upyog karta hai)                                    |
| `label`     | Optional: `"local"` (default) manifest se har locale endonym ka upyog karta hai; `"english"` `englishName` ka upyog karta hai |

<a id="3-what-happens-at-runtime"></a>
## 3. Runtime par kya hota hai

1. **Extraction** — language-list slice ko model ko **nahi** bheja jaata hai (`translatable: false`).
2. **Prati anuvaadit file** — segment anuvaad aur optional flat link rewriting ke baad, `postProcessing` block ko phir se banata hai: har locale ke liye ek markdown link, `ui-languages.json` se labels jab maujood hon (anyatha bundled master catalog, anyatha `localeDisplayNames`), file ke saapeksh path jo likhi ja rahi hai.
3. **Source refresh** — ek `translate-docs` / `sync` docs pass ke ant mein, wahi canonical block **English source files** mein `contentPaths` mein wapas likha jaata hai taaki ek locale jodne se repo mein switcher update ho jaaye bina har link ko manually edit kiye.

Agar kisi file mein koi matching block nahi hai, to CLI ek warning log karta hai (jab `--verbose`) aur body ko bina badle chhod deta hai.

<a id="4-label-manifest"></a>
## 4. Label manifest

Endonym labels (`label: "local"`) ke liye, `generate-ui-languages` ke madhyam se `ui-languages.json` generate ya maintain karein (jo [`languagesManifestPath`](/hi-Latn/reference/configuration#languagesmanifestpath-optional) par likha gaya hai, jiska default `{ui.flatOutputDir}/ui-languages.json` hai). Is repo ke docs-only config mein koi UI pipeline aur disk par koi project manifest nahi hai, isliye labels `sourceLocale` + `targetLocales` ke liye bundled master catalog se aate hain.

<a id="5-examples-in-this-repository"></a>
## 5. Is repository mein udaharan

| Udaharan | Files |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Yah package (flat README + VitePress site) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (README block: `docsOutput.style = "flat"`; site block: `docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |
| Flat README + Docusaurus docs | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (doosra block: `docsOutput.style = "flat"`; pehla block: `docsOutput.style = "docusaurus"`) |
| Docusaurus docs only | [examples/docusaurus-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json) (`docsOutput.style = "docusaurus"` + `docusaurusCatalogDir`) |
| VitePress docs (minimal demo) | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |

`<small id="lang-list">` se theek pehle ki line (jaise ki `**Read in other languages:**`) ek normal translatable segment hai aur har target locale mein sthanikrit hoti hai; sirf markers ke andar ki link row ko `href` aur manifest-driven labels ke alawa verbatim regenerate kiya jaata hai.
