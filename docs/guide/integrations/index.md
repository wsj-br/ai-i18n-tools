<a id="integrations"></a>
# Integrations

Framework-specific guides for documentation sites, Astro projects, and Python applications. Documentation integrations use the [Documents](/guide/documents/) pipeline (`translate-docs` / `sync`) for page content; shell strings (nav, sidebar, theme) are handled inside that same pipeline where noted — not via the separate [JSON](/guide/json) pipeline. Python applications use the [UI strings](/guide/ui-strings/python) pipeline (`extract` / `translate-ui`).

<a id="which-guide-to-read"></a>
## Which guide to read

| Your site | Init template | Start here | Agent prompt |
| --- | --- | --- | --- |
| Astro Starlight or plain Astro | `ui-starlight` / hybrid UI strings | [Astro](/guide/integrations/astro) | Starlight: notes only. Astro `t()` files: [JS/TS prompt](/guide/add-i18n-to-js#agent-prompt) (skip i18next) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/guide/integrations/docusaurus) | Notes only (`<Translate>` is Docusaurus's own API) |
| VitePress | `ui-vitepress` | [VitePress](/guide/integrations/vitepress) | [Theme catalog prompt](/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/guide/integrations/nextra) | [Dictionary prompt](/guide/integrations/nextra#agent-prompt-dictionary) and [hybrid `t()` prompt](/guide/integrations/nextra#optional-t-for-app-react-hybrid) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/guide/integrations/fumadocs) | [UI catalog prompt](/guide/integrations/fumadocs#agent-prompt) |
| Python (Streamlit, FastAPI, Flask, Django, gettext, desktop) | `ui-python` / `ui-python-gettext` / `ui-python-flask` / `ui-python-django` | [Python](/guide/integrations/python) | [`i18n.py`](/guide/add-i18n-to-python#agent-prompt-i18n-py) and [Django / gettext](/guide/add-i18n-to-python#agent-prompt-django-gettext) |

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
