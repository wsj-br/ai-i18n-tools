<a id="examples"></a>
# Udaharan

GitHub par [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) ke tahat chalne yogya project — har ek apni config, committed locale outputs, aur README ke saath. Aap API key ke bina anuvaadit files ko explore kar sakte hain; anuvaad ko phir se chalane ke liye ek provider key ki avashyakta hoti hai ([Providers and models](/hi-Latn/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Standalone chalaen (`npx degit`)

Poori repository ko clone kiye bina ek udaharan copy karein. Har ek `"ai-i18n-tools": "^1.7.2"` ghoshit karta hai aur npm se CLI install karta hai:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

Yadi aapne iske bajay **poori** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository ko clone kiya hai, to repository root par `pnpm install` aur `pnpm run build` chalaen, phir `cd examples/<name>`.

<a id="list-of-examples"></a>
## Udaharanon ki soochi

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="fumadocs-docs"></a>
<a id="multi-provider"></a>
<a id="test-markdown"></a>

| Udaharan | Sabse achha kiske liye | Degit ke saath copy karein | Chalaen |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | `t()` UI strings + README anuvaad ke saath sabse chhota working app | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + plurals + dashboard; Docusaurus docs + flat README + SVG assets | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (app `:3030`; docs `:3040` ke liye `cd docs-site && pnpm start`) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro landing page: full-page HTML + `t()` hybrid | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight documentation site | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress docs site + theme JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / dictionary `.ts` shell (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI catalog (`pt`, `zh`, dot parser) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | Ek LLM provider chunein ya benchmark karein (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Regression-test markdown / CJK anuvaad (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

Har **Udaharan** naam apne GitHub README se poore setup, commands, aur project layout ke saath link karta hai — ya [repository mein examples index](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md) browse karein.
