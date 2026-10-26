<a id="examples"></a>
# Examples

Runnable projects under [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) on GitHub — each with its own config, committed locale outputs, and README. You can explore translated files without an API key; re-running translation requires a provider key ([Providers and models](/guide/providers-and-models)).

<a id="run-standalone-npx-degit"></a>
## Run standalone (`npx degit`)

Copy one example without cloning the full repository.

<a id="nodejs-examples"></a>
### Node.js examples

Each Node.js example declares a published caret range of `ai-i18n-tools` matching the current package version and installs the CLI from npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

<a id="python-examples"></a>
### Python examples

`python-streamlit`, `python-flask`, `python-fastapi`, and `python-gettext` have no `package.json`. The `degit` commands in the table below are valid. You can also download `ai-i18n-tools-python-examples.zip` from the [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases). That zip is the same four directories. It is not part of the npm package, and it is not inside the standalone executable.

`python-streamlit`, `python-flask`, and `python-fastapi` use a virtualenv and `pip install -r requirements.txt`. `python-gettext` uses only the standard library. Translate with the [standalone executable](/guide/installation#standalone-executables).

```bash
npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit
cd python-streamlit
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows, activate `.venv\Scripts\activate`.

If you cloned the **whole** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository instead, run `pnpm install` and `pnpm run build` at the repository root, then `cd examples/<name>`. Workspace (Node.js) examples use the local CLI via their `pnpm run i18n:*` scripts, or bare `ai-i18n-tools …` after [PATH setup](/guide/installation#using-the-cli). Python examples in that checkout translate with `node ../../bin/ai-i18n-tools.mjs` after the build. See [Installation — Cloned monorepo](/guide/installation#cloned-monorepo).


<a id="which-example-matches-my-project"></a>
## Which example matches my project?

- A JS/TS app: [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) (smallest) or [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md). Guide: [Add i18n to a JS/TS app](/guide/add-i18n-to-js).
- A Python app: python-streamlit, python-flask, python-fastapi, or python-gettext. Guide: [Add i18n to a Python app](/guide/add-i18n-to-python).
- A website or docs site: docusaurus-docs, vitepress-docs, astro-docs, nextra-docs, fumadocs-docs, astro-website, plain-html, or plain-html-docs. Guide: [Add i18n to a website or docs site](/guide/add-i18n-to-website).
- A repository README next to an app: [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) or [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) (the nextjs example also has a docs site). Guide: [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).
- Something else: multi-provider, test-markdown, and intlayer-migration.

<a id="list-of-examples"></a>
## List of Examples

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="plain-html-docs"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="intlayer-migration"></a>
<a id="intlayer-translate"></a>
<a id="test-markdown"></a>
<a id="python-streamlit"></a>
<a id="python-flask"></a>
<a id="python-fastapi"></a>
<a id="python-gettext"></a>

| Example | Best for | Copy with degit | Run |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | Smallest working app with `t()` UI strings + README translation | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + plurals + dashboard; nested Docusaurus docs + flat README + SVG assets | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (app `:3030`; `cd docs-site && pnpm start` for docs `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Docusaurus documentation site only (`docusaurus` preset) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; build + serve, locale menu works) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro landing page: full-page HTML + `t()` hybrid | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight documentation site | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress docs site + theme JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / dictionary `.ts` shell, plus one `t()` server component (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI catalog (`pt`, `zh`, dot parser) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | Plain HTML + `data-i18n*` markers; static locale JSON (dashboard-style UI) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**plain-html-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs/README.md) | Plain HTML as documents: one page per locale, localized images, hreflang | `npx degit wsj-br/ai-i18n-tools/examples/plain-html-docs plain-html-docs` | `pnpm dev` (`:3092`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | Pick or benchmark an LLM provider (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Regression-test markdown / CJK translation (Devanagari, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |
| [**intlayer-migration**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration/README.md) | Intlayer `.content.ts` → `t()` (`migrate-intlayer`, reset + AI-agent report) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration` | `pnpm reset && pnpm dev` (`:3091`) |
| [**intlayer-translate**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate/README.md) | Keep Intlayer, fill missing locales in place (`translate-intlayer`; `en` + `pt-BR` shipped, `es` + `zh-Hans` missing) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate` | `pnpm reset && pnpm translate` (`pnpm dev` `:3093`) |
| [**python-streamlit**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit/README.md) | Streamlit dashboard, `t()` / `_()`, English-key JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit` | `python3 -m venv .venv && pip install -r requirements.txt && streamlit run app.py` |
| [**python-flask**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask/README.md) | Flask + Jinja, `t()` / `_()`, English-key JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-flask python-flask` | `python3 -m venv .venv && pip install -r requirements.txt && flask --app app run` |
| [**python-fastapi**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi/README.md) | FastAPI, ContextVar locale, `t()` / `_()`, English-key JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-fastapi python-fastapi` | `python3 -m venv .venv && pip install -r requirements.txt && uvicorn app:app` |
| [**python-gettext**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext/README.md) | Existing GNU gettext CLI; `extract` / `translate-ui` refresh `.po` and `.mo` | `npx degit wsj-br/ai-i18n-tools/examples/python-gettext python-gettext` | `python3 app.py --lang es` |

Each **Example** name links to its GitHub README with full setup, commands, and project layout — or browse the [examples index in the repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md).

Node.js examples install the CLI from npm after `pnpm install`. The four Python examples use `venv` and `pip` (`python-gettext` uses only the standard library) and the [standalone executable](/guide/installation#standalone-executables) for translation.


<br/>

::: tip Disclaimer
Product names and icons belong to their respective owners and are used for identification purposes only. This software is not affiliated with or endorsed by those brands.
:::
