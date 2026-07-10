<a id="what-is-ai-i18n-tools"></a>
# Ai-i18n-tools kya hai?

ai-i18n-tools ek command-line tool aur toolkit hai jo aapko apne pasandida LLM provider ka upyog karke apne app aur documentation ka anuvad karne mein madad karta hai. Aap ek single config file se sab kuch control karte hain, yeh chun kar ki kaun si translation features ko enable karna hai. Ek hi baar mein apni zaroorat ke modes ko chalane ke liye "sync" command ka upyog karein.

<a id="translation-modes"></a>
## Anuvad modes

- **UI strings** — JS/TS source se `t("…")` calls (aur similar markers) extract karein aur i18next ya static lookup ke liye flat per-locale JSON files likhein. Commands: `extract`, `translate-ui`. Guide: [UI strings](/hi-Latn/guide/ui-strings/).
- **Documents** — Markdown, MDX, aur `.astro` pages ko translate karein jo `docs[].contentPaths` mein listed hain. VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, aur anya static doc sites ke saath kaam karta hai. Command: `translate-docs`. Guide: [Documents](/hi-Latn/guide/documents/).
- **JSON** — Top-level `json[]` mein define kiye gaye nested JSON locale bundles (theme labels, i18n overrides, app copy jo source mein nahi hai) ko translate karein. Command: `translate-json`. Guide: [JSON](/hi-Latn/guide/json).
- **SVG** — SVG illustrations (`<text>`, `<title>`, `<desc>`) ke andar visible text ko translate karein aur har locale ke liye ek output file likhein. Document translation se alag — `translate-docs` SVG assets ko modify nahi karta hai. Command: `translate-svg`. Guide: [SVG translation](/hi-Latn/guide/svg-translation/).

Charon modes active [LLM provider](/hi-Latn/guide/providers-and-models) ka upyog karte hain, ek hi config file share karte hain, aur ek SQLite cache ka punarupyog karte hain taaki reruns kewal naye ya badle hue text ko model mein bhejte hain.

<a id="which-should-i-use"></a>
## Mujhe kaun sa upyog karna chahiye?

| Aapka content | Mode | Command |
| --- | --- | --- |
| Source code `t()` ya HTML `data-i18n` markers ka upyog karta hai | UI strings | `extract` / `translate-ui` |
| Localized pages ya doc sites | Documents | `translate-docs` |
| Standalone nested JSON locale files | JSON | `translate-json` |
| SVG mein labels ke saath diagrams ya illustrations | SVG | `translate-svg` |

Kai projects modes ko jodte hain — jaise ki VitePress site ke liye UI strings aur documents, ya illustrated guides ke liye documents aur SVG. Scaffold templates ke liye [Quick start](/hi-Latn/guide/quick-start) aur poore config schema ke liye [Configuration](/hi-Latn/reference/configuration) dekhein.

<a id="examples"></a>
## Udaharan

Repository `examples/` ke tahat chalne wale example projects ship karta hai — har ek apni config, committed locale outputs, aur README ke saath. Aap bina API key ke translated files explore kar sakte hain; translation ko phir se chalane ke liye ek provider key ki zaroorat hoti hai (dekhein [Providers and models](/hi-Latn/guide/providers-and-models)).

| Udaharan | Yeh kya dikhata hai |
| --- | --- |
| [console-app](/hi-Latn/examples#console-app) | Sabse chhota end-to-end app: `t()` UI strings aur README translation |
| [nextjs-app](/hi-Latn/examples#nextjs-app) | Next.js UI, plurals, SVG, Docusaurus docs site, dashboard |
| [astro-website](/hi-Latn/examples#astro-website) | Astro marketing site: full-page HTML translation aur `t()` strings |
| [astro-docs](/hi-Latn/examples#astro-docs) | Astro Starlight documentation site |
| [vitepress-docs](/hi-Latn/examples#vitepress-docs) | VitePress docs aur theme catalog |
| [nextra-docs](/hi-Latn/examples#nextra-docs) | Nextra docs aur `_meta.ts` sidebar labels aur theme dictionary |
| [fumadocs-docs](/hi-Latn/examples#fumadocs-docs) | Fumadocs docs plus `meta.json` sidebar labels aur UI catalog |
| [multi-provider](/hi-Latn/examples#multi-provider) | Ek hi document par LLM providers ki tulna karein |
| [test-markdown](/hi-Latn/examples#test-markdown) | Markdown pipeline stress tests (CJK, Devanagari, edge cases) |

`npx degit` copy commands aur ek choosing guide ke liye [Examples](/hi-Latn/examples) dekhein.

<a id="next-steps"></a>
## Agle kadam

1. [Installation](/hi-Latn/guide/installation) — package install karein aur apna provider API key set karein.
2. [Quick start](/hi-Latn/guide/quick-start) — ek config scaffold karein aur apna pehla translation run karein.
3. [Providers and models](/hi-Latn/guide/providers-and-models) — ek provider, model fallback chain, aur `-P` override chunein.
