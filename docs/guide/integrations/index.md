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

Each `init -t ui-*` template scaffolds a default LLM provider block. Before `translate-docs` or `sync`, configure `provider` / `providers` if needed and set the matching API key — see [Provider and API key](/guide/quick-start#provider-and-api-key).

Do **not** put framework shell or theme strings in `json[]` — that pipeline is for unrelated application locale bundles. Each integration page explains which catalog paths and CLI flags cover nav, sidebar, and theme labels for that framework.

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
