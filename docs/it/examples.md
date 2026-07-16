<a id="examples"></a>
# Esempi

Progetti eseguibili in [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) su GitHub, ciascuno con la propria configurazione, output di locale commitati e README. Puoi esplorare i file tradotti senza una chiave API; la riesecuzione della traduzione richiede una chiave del provider ([Provider e modelli](/it/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Esegui in modo autonomo (`npx degit`)

Copia un esempio senza clonare l'intero repository. Ciascuno dichiara `"ai-i18n-tools": "^1.7.2"` e installa la CLI da npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

Se invece hai clonato l'**intero** repository [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools), esegui `pnpm install` e `pnpm run build` nella root del repository, quindi `cd examples/<name>`. Gli esempi dell'area di lavoro utilizzano la CLI locale tramite i loro script `pnpm run i18n:*`, o `ai-i18n-tools …` "nudo" dopo la [configurazione del PATH](/it/guide/installation#using-the-cli). Vedi [Installazione — Monorepo clonato](/it/guide/installation#cloned-monorepo).

<a id="list-of-examples"></a>
## Elenco degli esempi

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

| Esempio | Ideale per | Copia con degit | Esegui |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | App funzionante più piccola con stringhe UI `t()` + traduzione README | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + plurali + dashboard; documenti Docusaurus annidati + README "flat" + risorse SVG | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (app `:3030`; `cd docs-site && pnpm start` per documenti `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Solo sito di documentazione Docusaurus (preset `docusaurus`) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; build + serve, il menu locale funziona) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Pagina di destinazione Astro: HTML a pagina intera + ibrido `t()` | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Sito di documentazione Astro Starlight | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | Sito di documenti VitePress + tema JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + shell `_meta.ts` / dizionario `.ts` (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / catalogo UI (`pt`, `zh`, parser dot) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | HTML semplice + marcatori `data-i18n*`; JSON locale statico (UI in stile dashboard) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | Scegli o confronta un provider LLM (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Test di regressione markdown / traduzione CJK (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

Ogni nome di **Esempio** si collega al suo README di GitHub con la configurazione completa, i comandi e il layout del progetto, oppure sfoglia l'[indice degli esempi nel repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).
