<a id="integrations"></a>
# Integrations

Reference for the framework integrations: what they share and how their shell strings differ. To add languages to a site, start at [Add i18n to a website or docs site](/guide/add-i18n-to-website). For an app, start at [Add i18n to a JS/TS app](/guide/add-i18n-to-js) or [Add i18n to a Python app](/guide/add-i18n-to-python). For a repository README and other Markdown files, start at [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

Documentation integrations use the [Documents](/guide/documents/) pipeline (`translate-docs` / `sync`) for page content; shell strings (nav, sidebar, theme) are handled inside that same pipeline where noted — not via the separate [JSON](/guide/json) pipeline. Python applications use the [UI strings](/guide/ui-strings/python) pipeline (`extract` / `translate-ui`).

<a id="which-guide-to-read"></a>
## Which guide to read

The chooser table, with one init template per framework, is in [Add i18n to a website or docs site](/guide/add-i18n-to-website#initialise-the-project). The walkthrough prompt on that page enables the framework's i18n. The integration pages below keep the shell-catalog details. Python frameworks: [Python](/guide/integrations/python).

<a id="shared-concepts"></a>
## Shared concepts

Documentation-framework integrations share the same `docs[]` block model described in [Documents](/guide/documents/). Set `docsOutput.style` to match your framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, or `"astro-starlight"`). For output folder layout and link rewriting behaviour, see [Output layouts](/guide/documents/output-layouts) and [Link rewriting](/guide/documents/link-rewriting). Python setup is separate: [Python](/guide/integrations/python).

Each `init -t ui-* -P <provider>` scaffold writes that preset's LLM provider block. Before `translate-docs` or `sync`, set the matching API key — see [Provider and API key](/guide/quick-start#provider-and-api-key).

See [Framework shell translation](#framework-shell-translation) for a cross-framework comparison. Each linked guide below covers setup for that framework.

<a id="framework-shell-translation"></a>
## Framework shell translation

| Framework | Shell / theme strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` catalog (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Theme/nav/sidebar catalog | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` sidebar labels | Documents — auto when `style: "nextra"` + `translate-docs` |
| Nextra | Theme dictionary `.ts` | Documents — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` sidebar labels | Documents — auto when `style: "fumadocs"` + `translate-docs` |
| Fumadocs | UI overrides catalog | Documents — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Built-in UI strings (many locales); no additional shell pipeline | Documents — `translate-docs` (pages only) |

Do **not** put framework shell/theme strings in `json[]` — that pipeline is for unrelated app locale bundles. Per-framework setup details are in the guides linked from [Which guide to read](#which-guide-to-read).

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
| Streamlit | [examples/python-streamlit](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit) |
| Flask | [examples/python-flask](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask) |
| FastAPI | [examples/python-fastapi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi) |
| GNU gettext | [examples/python-gettext](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext) |
