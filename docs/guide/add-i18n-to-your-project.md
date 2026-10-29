<a id="add-i18n-to-your-project"></a>
# Add i18n to your project

This section is the set of walkthroughs for a project that speaks one language today. Start here. Each page below takes one kind of project from setup to the first translated files. [Get started](/guide/what-is-ai-i18n-tools) covers what the tool is, install options, and providers and models. You can open a walkthrough without reading those pages first.

<a id="what-you-do-and-what-the-tool-does"></a>
## What you do and what the tool does

| You | The tool |
| --- | --- |
| Pick the languages, a provider, and the models to try | Extracts text, translates it, checks the result, and writes catalogs or pages |
| Make the text visible: `t()` in app code, your site framework's i18n, or a language-list marker in a README | Caches every translation and reuses it on the next run |
| Load the files and check one language | Shows progress, and lets you review wording in the [Translation Dashboard](/guide/translation-dashboard/) |

The walkthroughs say which source edits are yours. Coding-agent prompts are included where those edits are mechanical. The CLI writes the catalogs and the translated files. It does not install i18next or your site framework's i18n.

<a id="shared-setup"></a>
## Shared setup

Every walkthrough follows the same order. The page you pick fills in the details.

1. Install the CLI and set your provider's API key. Ollama needs no key. [Installation](/guide/installation) and [Provider and API key](/guide/quick-start#provider-and-api-key).
2. Run `init` with the template that page names. This writes `ai-i18n-tools.config.json`.
3. Prepare the project so the tool can see the text.
4. Run `ai-i18n-tools sync`, then `ai-i18n-tools status`.
5. Load the output, check one target language, and rerun `sync` when the source changes. The cache sends only new or changed text to the model.

<a id="pages-in-this-section"></a>
## Pages in this section

| You have | Page | What that page covers |
| --- | --- | --- |
| A JS/TS app (React, Next.js, Node, CLI) whose buttons and messages are still plain text | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) | Install i18next, add the bootstrap, wrap literals in `t()`, then `extract` and `translate-ui` |
| A Python app (Streamlit, FastAPI, Flask, desktop, scripts) | [Add i18n to a Python app](/guide/add-i18n-to-python) | Place the `i18n.py` helper, wrap `t()` or `_()`, add a language switch. The CLI can run from a standalone executable with no Node.js install |
| A Django app, Flask with Flask-Babel catalogs, or any app that already uses GNU gettext | [Add i18n to a Django / Python gettext app](/guide/add-i18n-to-django-gettext) | Keep `gettext`, `{% blocktranslate %}`, and your `.po` files. The tool fills and compiles the catalogs |
| A documentation or marketing site (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, plain HTML) | [Add i18n to a website or docs site](/guide/add-i18n-to-website) | Enable the framework's own language routes, then translate pages and theme labels |
| A repository README and other Markdown files, usually next to an app | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme) | One file per language (`translated-docs/README.de.md`) and a language row in the README. `init --with-readme` adds that block to any template |
| More than one of the above in one repository | [Combining pipelines](/guide/combining-pipelines) | One config and one `sync`. The usual pair is app UI strings plus the README |
| Intlayer dictionaries, and you want to keep Intlayer | [Translating Intlayer in place](/guide/translating-intlayer) | `translate-intlayer` fills missing and stale leaves inside `*.content.ts` |
| Intlayer dictionaries, and you are moving off Intlayer | [Migrating from Intlayer](/guide/migrating-from-intlayer) | `migrate-intlayer` seeds catalogs from the dictionaries and rewrites safe call sites to `t()` |

An app that also has a README uses the app page and the README page together. A site that also has a README uses the website page, and `init … --with-readme` for the README block.

<a id="where-to-go-deeper"></a>
## Where to go deeper

The walkthroughs stop once the first language is wired. The reference pages take over from there:

- [UI strings](/guide/ui-strings/), [Documents](/guide/documents/), [JSON](/guide/json), and [SVG](/guide/svg-translation/) for one pipeline at a time.
- [Integrations](/guide/integrations/) for framework shell strings (navigation, sidebar, theme).
- [Quick start](/guide/quick-start) for the command list and recommended `package.json` scripts.
- [LLM providers](/guide/providers-and-models) for presets and API keys.
- [AI Models](/guide/ai-models) for the ranked shortlist and the fallback chain.
