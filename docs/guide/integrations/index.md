<a id="integrations"></a>
# Integrations

Framework-specific guides for wiring ai-i18n-tools into documentation sites and Astro projects. Each integration uses the [Documents](/guide/documents/) pipeline (`translate-docs` / `sync`) for page content; shell strings (nav, sidebar, theme) are handled inside that same pipeline where noted — not via the separate [JSON](/guide/json) pipeline.

<a id="which-guide-to-read"></a>
## Which guide to read

| Your site | Init template | Start here |
| --- | --- | --- |
| Astro Starlight or plain Astro | `ui-starlight` / hybrid UI strings | [Astro](/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## Shared concepts

All documentation-framework integrations share the same `docs[]` block model described in [Documents](/guide/documents/). Set `docsOutput.style` to match your framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, or `"astro-starlight"`). For output folder layout and link rewriting behaviour, see [Output layouts](/guide/documents/output-layouts) and [Link rewriting](/guide/documents/link-rewriting).

Each `init -t ui-*` template scaffolds a default LLM provider block (`openrouter` unless you pass `-P <provider>`). Before `translate-docs` or `sync`, configure `provider` / `providers` if needed and set the matching API key — see [Provider and API key](/guide/quick-start#provider-and-api-key).

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
