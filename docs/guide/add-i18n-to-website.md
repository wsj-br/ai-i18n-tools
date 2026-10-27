<a id="add-i18n-to-a-website-or-docs-site"></a>
# Add i18n to a website or docs site

This page is for a documentation site (Markdown or MDX) or a marketing or static site (an Astro website or plain HTML) in one language. The tool translates your page content with the models on your LLM provider and writes one localized copy per language. Your site framework serves those copies and provides the language switcher.

For an app whose UI strings live in `t()` calls, use [Add i18n to a JS/TS app](/guide/add-i18n-to-js) or [Add i18n to a Python app](/guide/add-i18n-to-python) instead.

<a id="what-do-you-have"></a>
## What do you have?

| Your site | Init template | Start here |
| --- | --- | --- |
| Astro Starlight or plain Astro | `ui-starlight` / hybrid UI strings | [Astro](/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/guide/integrations/fumadocs) |
| Plain HTML pages | `ui-plain-html` or `docs-plain-html` | [Plain HTML apps](/guide/ui-strings/plain-html) |
| No site framework, just a README and Markdown files | `docs-markdown`, or any template plus `--with-readme` | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme) |

<details class="agent-prompt">
<summary>Agent prompts</summary>

- Astro Starlight: notes only. Astro `t()` files: [JS/TS prompt](/guide/add-i18n-to-js#agent-prompt) (skip i18next).
- Docusaurus: notes only (`<Translate>` is Docusaurus's own API).
- VitePress: [Theme catalog prompt](/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off).
- Nextra: [Dictionary prompt](/guide/integrations/nextra#agent-prompt-dictionary) and [hybrid `t()` prompt](/guide/integrations/nextra#optional-t-for-app-react-hybrid).
- Fumadocs: [UI catalog prompt](/guide/integrations/fumadocs#agent-prompt).
- README and Markdown files: [README prompt](/guide/add-i18n-to-readme#agent-prompt).

</details>

<a id="steps"></a>
## Steps

The same shape works for every framework; the details live in the framework guide linked above.

1. Install the CLI and set the API key: [Installation](/guide/installation), [Provider and API key](/guide/quick-start#provider-and-api-key).
2. Scaffold: `ai-i18n-tools init -t <template> -P <provider>`.
3. Set `sourceLocale`, `targetLocales`, and `docs[].contentPaths` (the pages and folders written in your source language). `sourceLocale` can be any language. The framework guide shows the right `docsOutput.style`.
4. Enable your framework's own i18n so it serves and links the localized pages. Each guide has an "Enable i18n in an existing site" section: [VitePress](/guide/integrations/vitepress#enable-i18n-in-an-existing-site), [Docusaurus](/guide/integrations/docusaurus#enable-i18n-in-an-existing-site), [Nextra](/guide/integrations/nextra#enable-i18n-in-an-existing-site), [Fumadocs](/guide/integrations/fumadocs#enable-i18n-in-an-existing-site), [Astro](/guide/integrations/astro#enable-i18n-in-an-existing-site).
5. Run `ai-i18n-tools sync` (or `translate-docs`), then build the site.
6. Check a localized route in the browser. The framework's own locale dropdown is the switcher. For a flat markdown file such as a README, add a link row with [languageListBlock](/guide/documents/language-switcher).

<a id="what-gets-translated"></a>
## What gets translated

Page bodies always go through the [Documents](/guide/documents/) pipeline. Framework chrome (navigation, sidebar, theme labels) is handled in the same run where the framework supports it, not through the separate [JSON](/guide/json) pipeline.

| Framework | Shell and theme strings | How |
| --- | --- | --- |
| Docusaurus | `write-translations` catalog (`{ message, description }`) | `docs[].docusaurusCatalogDir` plus `translate-docs` |
| VitePress | Theme, nav, and sidebar catalog | `docsOutput.vitepressThemeCatalog` plus `translate-docs` |
| Nextra | `_meta.ts` sidebar labels | Automatic with `style: "nextra"` |
| Nextra | Theme dictionary `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json` sidebar labels | Automatic with `style: "fumadocs"` |
| Fumadocs | UI overrides catalog | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | Built-in UI strings in many locales | Pages only |

Images and screenshots are not translated by `translate-docs`. For locale-specific files, see [Images and screenshots](/guide/images-and-screenshots/).

<a id="plain-html"></a>
## Plain HTML

Two options, depending on how the page should behave:

- One page that switches language in the browser: mark the text with `data-i18n*` attributes and use the UI strings runtime (`ui-plain-html`). See [Plain HTML apps](/guide/ui-strings/plain-html).
- One translated HTML file per locale: use the Documents pipeline (`docs-plain-html`). See [HTML pages](/guide/documents/html-pages).

A file belongs to one path.

<a id="not-your-case"></a>
## Not your case?

- App UI strings: [Add i18n to a JS/TS app](/guide/add-i18n-to-js) or [Add i18n to a Python app](/guide/add-i18n-to-python).
- A repository README next to the site, or Markdown files and no site framework: [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme). `init … --with-readme` adds that block beside a site template.
- Standalone nested locale JSON: [JSON](/guide/json).
- Translating both a site and app strings: [Combining pipelines](/guide/combining-pipelines).

Reference for the shared options and per-framework differences: [Integrations](/guide/integrations/).
