<a id="examples"></a>
# Examples

Runnable projects under [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) on GitHub — each with its own config, committed locale outputs, and README. You can explore translated files without an API key; re-running translation requires a provider key ([Providers and models](/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Run standalone (`npx degit`)

Copy one example without cloning the full repository. Each declares `"ai-i18n-tools": "^1.7.2"` and installs the CLI from npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

If you cloned the **whole** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository instead, run `pnpm install` and `pnpm run build` at the repository root, then `cd examples/<name>`. Workspace examples use the local CLI via `pnpm exec ai-i18n-tools …` or their `pnpm run i18n:*` scripts — not `npx` at the repository root (that runs the published npm package). See [Installation — Cloned monorepo](/guide/installation#cloned-monorepo).


<a id="list-of-examples"></a>
## List of Examples

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="test-markdown"></a>

| Example | Best for | Copy with degit | Run |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | Smallest working app with `t()` UI strings + README translation | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + plurals + dashboard; nested Docusaurus docs + flat README + SVG assets | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (app `:3030`; `cd docs-site && pnpm start` for docs `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Docusaurus documentation site only (`docusaurus` preset) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; build + serve, locale menu works) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro landing page: full-page HTML + `t()` hybrid | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight documentation site | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress docs site + theme JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / dictionary `.ts` shell (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI catalog (`pt`, `zh`, dot parser) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | Plain HTML + `data-i18n*` markers; static locale JSON (dashboard-style UI) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | Pick or benchmark an LLM provider (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Regression-test markdown / CJK translation (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

Each **Example** name links to its GitHub README with full setup, commands, and project layout — or browse the [examples index in the repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).
