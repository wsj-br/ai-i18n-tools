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

Har ek `init -t ui-*` template ek default LLM provider block ko scaffold karta hai. `translate-docs` ya `sync` se pehle, yadi avashyak ho to `provider` / `providers` ko configure karein aur matching API key set karein — [Provider aur API key](/hi-Latn/guide/quick-start#provider-and-api-key) dekhein.

Framework shell ya theme strings ko `json[]` mein **na** rakhein — vah pipeline unrelated application locale bundles ke liye hai. Har integration page batata hai ki kaun se catalog paths aur CLI flags us framework ke liye nav, sidebar, aur theme labels ko cover karte hain.

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
