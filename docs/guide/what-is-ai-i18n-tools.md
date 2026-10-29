<a id="what-is-ai-i18n-tools"></a>
# What is ai-i18n-tools?

You have an app, a website, a documentation site, or a repository README in one language, and you want more languages. That language is `sourceLocale`, and it can be any language. English is a common example in these guides. ai-i18n-tools finds the text, translates it with the models on the LLM provider you choose, and writes the files your project already loads. It caches every result, so reruns only send new or changed text to the model.

<a id="what-you-do-and-what-the-tool-does"></a>
## What you do and what the tool does

| You | The tool |
| --- | --- |
| Pick the languages, a provider, and the models to try | Extracts text, translates it, validates the result, and writes catalogs or pages |
| Make user-facing text visible to the tool: `t()` calls in app code, your framework's own i18n for a site, or a language-list marker in a README | Caches translations and reuses them on every rerun |
| Wire the result into the app, the site's routing, or the README's language row | Shows progress and lets you review translations in the dashboard |

The tool does not rewrite your source. Coding-agent prompts are provided for the wrapping step. It does not install i18next or your site framework's i18n, and it does not build your language switcher, although runtime helpers are provided for that.

<a id="where-do-i-start"></a>
## Where do I start?

The walkthroughs are grouped in [Add i18n to your project](/guide/add-i18n-to-your-project), with the shared setup and a page for each kind of project. Pick a row:

| You have | Start here |
| --- | --- |
| A JS/TS app (React, Next.js, Node, CLI) with plain text in the source | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) |
| A Python app (Streamlit, FastAPI, Flask, desktop, scripts) | [Add i18n to a Python app](/guide/add-i18n-to-python) |
| A Django app, Flask-Babel catalogs, or an app that already uses GNU gettext | [Add i18n to a Django / Python gettext app](/guide/add-i18n-to-django-gettext) |
| A website or documentation site (VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, plain HTML) | [Add i18n to a website or docs site](/guide/add-i18n-to-website) |
| A repository README and other Markdown files, usually next to an app | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme) |
| Standalone nested JSON locale files | [JSON](/guide/json) |
| SVG diagrams with text labels | [SVG translation](/guide/svg-translation/) |
| Intlayer dictionaries (move off Intlayer) | [Migrating from Intlayer](/guide/migrating-from-intlayer) |
| Intlayer dictionaries (keep Intlayer, translate in place) | [Translating Intlayer in place](/guide/translating-intlayer) |

<a id="which-should-i-use"></a>

<a id="how-it-works"></a>
## How it works

1. Install the CLI and set your provider's API key: [Installation](/guide/installation).
2. Run `init` to write `ai-i18n-tools.config.json`: [Quick start](/guide/quick-start).
3. Prepare the project: wrap strings in `t()`, enable your site framework's i18n, or add the language-list marker to a README.
4. Run `sync`. It extracts text, translates what is new, and writes the output.
5. Load the output in your app or site, add a language switcher, and rerun `sync` when the source changes.

<a id="translation-modes"></a>
## Translation modes

Under the hood, the tool runs four pipelines. Your config enables the ones you need, and `sync` runs them in order.

- UI strings — Extract `t("…")` and `_()` calls from JS/TS and Python source (and similar markers, including GNU gettext) and write flat per-locale JSON or `.po` / `.mo` catalogs. Commands: `extract`, `translate-ui`. Guide: [UI strings](/guide/ui-strings/). Python: [Python applications](/guide/ui-strings/python).
- Documents — Translate Markdown, MDX, and `.astro` pages listed in `docs[].contentPaths`. Works with VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, and other static doc sites, and with a repository README (`docsOutput.style` of `flat`). Command: `translate-docs`. Guides: [Documents](/guide/documents/) and [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).
- JSON — Translate nested JSON locale bundles (theme labels, i18n overrides, app copy not in source) defined in top-level `json[]`. Command: `translate-json`. Guide: [JSON](/guide/json).
- SVG — Translate visible text inside SVG illustrations (`<text>`, `<title>`, `<desc>`) and write one output file per locale. Separate from document translation. Command: `translate-svg`. Guide: [SVG translation](/guide/svg-translation/).

Many projects combine modes. The common pair is UI strings plus the repository README. A docs site such as VitePress is the other frequent pair. See [Combining pipelines](/guide/combining-pipelines) and [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

<a id="examples"></a>
## Examples

The repository ships runnable example projects under `examples/`, each with its own config, committed locale outputs, and README. Explore translated files without an API key; re-running translation needs a provider key.

| If you have | Example |
| --- | --- |
| A JS/TS app | [console-app](/examples#console-app), [nextjs-app](/examples#nextjs-app) |
| A repository README next to an app | [console-app](/examples#console-app), [nextjs-app](/examples#nextjs-app) |
| A Python app | [python-streamlit](/examples#python-streamlit), [python-fastapi](/examples#python-fastapi), [python-gettext](/examples#python-gettext) |
| A docs site | [docusaurus-docs](/examples#docusaurus-docs), [vitepress-docs](/examples#vitepress-docs), [astro-docs](/examples#astro-docs) |
| A website or plain HTML | [astro-website](/examples#astro-website), [plain-html](/examples#plain-html) |

See [Examples](/examples) for the full list and `npx degit` copy commands.

<a id="next-steps"></a>
## Next steps

1. [Installation](/guide/installation) — install the npm package, or download the [standalone executable](/guide/installation#standalone-executables) for a Python project, and set your provider API key.
2. [Quick start](/guide/quick-start) — scaffold a config and run your first translation.
3. [LLM providers](/guide/providers-and-models) — choose a provider, API key, and `-P` override.
4. [AI Models](/guide/ai-models) — rank a shortlist with `suggest-models` or the dashboard **Models** tab, and keep several models so a failed translation can try the next one.
