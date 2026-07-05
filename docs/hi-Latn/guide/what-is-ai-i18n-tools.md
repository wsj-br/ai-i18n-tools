<a id="what-is-ai-i18n-tools"></a>
# Ai-i18n-tools kya hai?

The `ai-i18n-tools` package teen anuvaad satah pradaan karta hai:

- **UI strings**: kisi bhi JS/TS source se `t("…")` calls extract karein, unhein active [LLM provider](/guide/providers-and-models) ke madhyam se translate karein, aur i18next ke liye flat per-locale JSON files likhein.
- **Documents**: `docs[].contentPaths` mein soochi-baddh **markdown, MDX, aur `.astro` pages** ko `translate-docs` ke madhyam se translate karein, smart caching ke saath. Optional **Docusaurus catalog JSON** (`docs[].docusaurusCatalogDir`, `docusaurus write-translations` se) ko usi command mein translate kiya jaata hai jab `features.translateDocs` enable hota hai — site chrome (navbar, footer, theme strings), na ki `docs/` mein prose. **VitePress** page bodies wahi `docs[]` pipeline ka upyog karte hain; nav/sidebar/footer labels JSON (`json[]` / `translate-json`) ka upyog karte hain — [VitePress integration](/guide/vitepress-integration) dekhein.
- **JSON**: top-level `json[]`, `features.translateJson`, aur `translate-json` ke madhyam se arbitrary nested JSON bundles (jaise `src/i18n/en/translation.json`) ko translate karein — un sites ke liye jo UI copy ko source mein `t()` ke bajaye per-locale JSON files mein rakhte hain.
- **Tool UI (built-in)** — CLI help, logs, aur Translation Dashboard kai bhashaon mein aate hain; yeh **aapke** app ke UI strings ya docs ko translate karne se alag hai.

**SVG** assets `features.translateSVG`, top-level `svg` block, aur `translate-svg` ka upyog karte hain (dekhain [CLI reference](/reference/cli-commands)).

**Main kiska upyog karoon?**

- Strot mein upyogakarta-mukh string `t()` ke maadhyam se → UI strings (`extract` / `translate-ui`).
- Sthaniya dastavez, Docusaurus shell JSON, ya VitePress markdown → Documents (`translate-docs`).
- VitePress theme JSON ya anya swatantra ghonchalit locale files → JSON (`translate-json`).

Teeno active LLM provider ka upyog karte hain (dekhein [Providers and models](/guide/providers-and-models)) aur ek single config file share karte hain.

<a id="next-steps"></a>
## Agle kadam

1. [Installation](/guide/installation) — package install karein aur apna provider API key set karein.
2. [Quick start](/guide/quick-start) — ek config scaffold karein aur apna pehla translation run karein.
3. [Providers and models](/guide/providers-and-models) — ek provider, model fallback chain, aur `-P` override chunein.
