<a id="integrations"></a>
# Integrations

ai-i18n-tools ko documentation sites aur Astro projects mein wire karne ke liye framework-specific guides. Har integration page content ke liye [Documents](/hi-Latn/guide/documents/) pipeline (`translate-docs` / `sync`) ka upyog karta hai; shell strings (nav, sidebar, theme) ko usi pipeline ke andar handle kiya jata hai jahan note kiya gaya hai — alag [JSON](/hi-Latn/guide/json) pipeline ke madhyam se nahi.

<a id="which-guide-to-read"></a>
## Kaun sa guide padhein

| Aapki site | Init template | Yahan se shuru karein |
| --- | --- | --- |
| Astro Starlight ya plain Astro | `ui-starlight` / hybrid UI strings | [Astro](/hi-Latn/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/hi-Latn/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/hi-Latn/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/hi-Latn/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/hi-Latn/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## Shared concepts

Sabhi documentation-framework integrations [Documents](/hi-Latn/guide/documents/) mein varnit ek hi `docs[]` block model share karte hain. Apne framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, ya `"astro-starlight"`) se mel khane ke liye `docsOutput.style` set karein. Output folder layout aur link rewriting behaviour ke liye, [Output layouts](/hi-Latn/guide/documents/output-layouts) aur [Link rewriting](/hi-Latn/guide/documents/link-rewriting) dekhein.

Har ek `init -t ui-*` template ek default LLM provider block (`openrouter` jab tak aap `-P <provider>` paas na karein) ko scaffold karta hai. `translate-docs` ya `sync` se pehle, yadi avashyak ho to `provider` / `providers` ko configure karein aur matching API key set karein — [Provider aur API key](/hi-Latn/guide/quick-start#provider-and-api-key) dekhein.

Cross-framework tulna ke liye [Framework shell anuvaad](#framework-shell-translation) dekhen. Neeche diye gaye pratyek linked guide mein us framework ke liye setup shamil hai.

<a id="framework-shell-translation"></a>
## Framework shell translation

| Framework | Shell / theme strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` catalog (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Theme/nav/sidebar catalog | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` sidebar labels | Documents — auto jab `style: "nextra"` + `translate-docs` |
| Nextra | Theme dictionary `.ts` | Documents — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` sidebar labels | Documents — auto jab `style: "fumadocs"` + `translate-docs` |
| Fumadocs | UI overrides catalog | Documents — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Built-in UI strings (kai locales); koi additional shell pipeline nahi | Documents — `translate-docs` (sirf pages) |

Framework shell/theme strings ko `json[]` mein **na** rakhen — vah pipeline asambandhit app locale bundles ke liye hai. Pratyek-framework setup vivaran [Kaun sa guide padhen](#which-guide-to-read) se linked guides mein hain.

<a id="runnable-examples"></a>
## Runnable examples

| Framework | Example repo |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| Plain Astro website | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
