<a id="what-is-ai-i18n-tools"></a>
# Ai-i18n-tools kya hai?

ai-i18n-tools ek command-line tool aur toolkit hai jo aapko apne pasandida LLM provider ka upyog karke apne app aur documentation ka anuvad karne mein madad karta hai. Aap ek single config file se sab kuch control karte hain, yeh chun kar ki kaun si translation features ko enable karna hai. Ek hi baar mein apni zaroorat ke modes ko chalane ke liye "sync" command ka upyog karein.

<a id="translation-modes"></a>
## Anuvad modes

- **UI strings** — JS/TS source se `t("…")` calls (aur is tarah ke markers) nikaalein aur i18next ya static lookup ke liye flat per-locale JSON files likhein. Commands: `extract`, `translate-ui`. Guide: [UI strings](/guide/ui-strings/).
- **Documents** — `docs[].contentPaths` mein soochi mein diye gaye Markdown, MDX, aur `.astro` pages ka anuvad karein. VitePress, Starlight, Docusaurus, Astro, aur anya static doc sites ke saath kaam karta hai. Command: `translate-docs`. Guide: [Documents](/guide/documents/).
- **JSON** — Top-level `json[]` mein paribhashit nested JSON locale bundles (theme labels, i18n overrides, app copy jo source mein nahi hai) ka anuvad karein. Command: `translate-json`. Guide: [JSON](/guide/json).
- **SVG** — SVG illustrations (`<text>`, `<title>`, `<desc>`) ke andar dikhne wale text ka anuvad karein aur har locale ke liye ek output file likhein. Document translation se alag — `translate-docs` SVG assets ko modify nahi karta hai. Command: `translate-svg`. Guide: [SVG translation](/guide/svg-translation/).

Charon modes active [LLM provider](/guide/providers-and-models) ka upyog karte hain, ek hi config file share karte hain, aur ek SQLite cache ka punarupyog karte hain taaki reruns kewal naye ya badle hue text ko model mein bhejte hain.

<a id="which-should-i-use"></a>
## Mujhe kaun sa upyog karna chahiye?

| Aapka content | Mode | Command |
| --- | --- | --- |
| Source code `t()` ya HTML `data-i18n` markers ka upyog karta hai | UI strings | `extract` / `translate-ui` |
| Localized pages ya doc sites | Documents | `translate-docs` |
| Standalone nested JSON locale files | JSON | `translate-json` |
| SVG mein labels ke saath diagrams ya illustrations | SVG | `translate-svg` |

Kai projects modes ko jodte hain — jaise ki VitePress site ke liye UI strings aur documents, ya illustrated guides ke liye documents aur SVG. Scaffold templates ke liye [Quick start](/guide/quick-start) aur poore config schema ke liye [Configuration](/reference/configuration) dekhein.

<a id="examples"></a>
## Udaharan

Repository `examples/` ke tahat chalne wale example projects ship karta hai — har ek apni config, committed locale outputs, aur README ke saath. Aap bina API key ke translated files explore kar sakte hain; translation ko phir se chalane ke liye ek provider key ki zaroorat hoti hai (dekhein [Providers and models](/guide/providers-and-models)).

| Udaharan | Yeh kya dikhata hai |
| --- | --- |
| [console-app](/examples#console-app) | Sabse chhota end-to-end app: `t()` UI strings aur README translation |
| [nextjs-app](/examples#nextjs-app) | Next.js UI, plurals, SVG, Docusaurus docs site, dashboard |
| [astro-website](/examples#astro-website) | Astro marketing site: full-page HTML translation aur `t()` strings |
| [astro-docs](/examples#astro-docs) | Astro Starlight documentation site |
| [vitepress-docs](/examples#vitepress-docs) | VitePress docs aur theme JSON |
| [multi-provider](/examples#multi-provider) | Ek hi document par LLM providers ki tulna karein |
| [test-markdown](/examples#test-markdown) | Markdown pipeline stress tests (CJK, Devanagari, edge cases) |

`npx degit` copy commands aur ek choosing guide ke liye [Examples](/examples) dekhein.

<a id="next-steps"></a>
## Agle kadam

1. [Installation](/guide/installation) — package install karein aur apna provider API key set karein.
2. [Quick start](/guide/quick-start) — ek config scaffold karein aur apna pehla translation run karein.
3. [Providers and models](/guide/providers-and-models) — ek provider, model fallback chain, aur `-P` override chunein.
