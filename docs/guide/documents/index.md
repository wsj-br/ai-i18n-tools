<a id="documents"></a>
# Documents

Designed primarily for **markdown, MDX, and `.astro` documentation** managed through `docs[]` config blocks. Each block's `contentPaths` field lists the files or folders to translate.

On [Docusaurus](/guide/integrations/docusaurus) sites, also set `docusaurusCatalogDir` to your `write-translations` catalog folder (e.g. `docs-site/i18n/en`). Then `translate-docs` includes shell JSON too - navbar, footer, and theme strings.

On [VitePress](/guide/integrations/vitepress) sites, page bodies use the same `docs[]` pipeline. Nav, sidebar, and footer labels live in `docsOutput.vitepressThemeCatalog` - `translate-docs` bootstraps the English catalog and translates it alongside pages, no separate pipeline.

On [Nextra](/guide/integrations/nextra) sites, page bodies use the same `docs[]` pipeline with `docsOutput.style: "nextra"`. `_meta.ts` sidebar labels are collected and translated automatically by `translate-docs`; theme dictionary strings translate via `docs[].nextraDictionaryPath` in the same pipeline.

On [Fumadocs](/guide/integrations/fumadocs) sites, page bodies use `docsOutput.style: "fumadocs"` with `fumadocsParser` `"dot"` (default) or `"dir"`. `meta.json` sidebar labels are collected automatically; UI overrides translate via `docsOutput.fumadocsUiCatalog`.

On [Astro Starlight](/guide/integrations/astro#astro-starlight) sites, page bodies use `docsOutput.style: "astro-starlight"` with `docsRoot` at your Starlight content root (typically `src/content/docs/`). `translate-docs` writes localized markdown/MDX under `src/content/docs/<locale>/` beside the English tree. Starlight ships built-in UI strings for many locales — no separate theme catalog pipeline; optional UI overrides can use `jsonPathTemplate` on a `docs[]` block for `src/content/i18n/en.json`.

For PNG and other raster images embedded in markdown, see [Images & Screenshots](/guide/images-and-screenshots/). `translate-docs` translates alt text only; it does not copy raster files.

For an optional **language switcher** block in README or docs, set `docsOutput.style` to `"flat"` - see [Language switcher](/guide/documents/language-switcher).

[SVG](/guide/svg-translation/) files are translated via [`translate-svg`](/reference/cli-commands/content#translate-svg) when `features.translateSVG` is enabled - not through `docs[]` / `contentPaths`.

Arbitrary nested UI JSON bundles unrelated to a documentation framework's shell/theme strings belong in the [JSON](/guide/json) pipeline, not in `docs[]`.

For **terminology consistency** between UI and docs, set `glossary.uiGlossary` to your `strings.json` path — `translate-docs` reuses existing UI translations as hints in LLM prompts when matching terms appear in a segment. Optional `glossary.userGlossary` adds CSV overrides for product terms (shared with `translate-ui` and `proofread-ui`). Compact UI-label abbreviations used to fit narrow columns (for example `Size` → `Tam`) stay available for UI translation but are omitted from document glossary hints. Generate a starter CSV with `glossary-generate`, edit rows in the Translation Dashboard **Glossary** tab, or see [Configuration — `glossary`](/reference/configuration#glossary) and [Glossary](/guide/translation-dashboard/glossary).

<a id="per-locale-model-overrides"></a>
### Per-locale model overrides

`translate-docs` and the docs step of `sync` resolve models **per target locale**: `localeModels(locale)` first when configured, then the provider's global `translationModels` chain. Use this when a specific language needs a different model than your default fallback list - for example, preferring Gemini for `pt-BR` documentation when the global chain struggles with Portuguese. See [Providers and models](/guide/providers-and-models#model-fallback-chain) and [Configuration - `localeModels`](/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Which guide to read

| Your setup | Start here |
| --- | --- |
| Docusaurus site | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/guide/integrations/docusaurus) |
| VitePress site | `init -t ui-vitepress` + `vitepressThemeCatalog` for theme - [VitePress](/guide/integrations/vitepress) |
| Nextra site | `init -t ui-nextra` + `nextraDictionaryPath` for dictionary (sidebar `_meta.ts` is automatic) - [Nextra](/guide/integrations/nextra) |
| Fumadocs site | `init -t ui-fumadocs` + `fumadocsUiCatalog` for UI (sidebar `meta.json` is automatic) - [Fumadocs](/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/guide/integrations/astro#astro-starlight) |
| Flat documents (README, changelogs, etc.) | `docsOutput.style = "flat"` - [Output layouts](/guide/documents/output-layouts), optional [language switcher](/guide/documents/language-switcher) |
| Where translated files land | [Output layouts](/guide/documents/output-layouts) |
| Cross-page `#anchor` links | [Anchor links](/guide/documents/anchor-links) |
| Link and asset URL rewriting (`regexAdjustments`) | [Link rewriting](/guide/documents/link-rewriting) |
| Screenshots in docs | [Images & Screenshots](/guide/images-and-screenshots/) |
| Product terminology and UI/doc consistency | [Configuration — `glossary`](/reference/configuration#glossary), [Glossary](/guide/translation-dashboard/glossary) |
| `translate-docs` flags and cache | [CLI options](/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Step 1: Initialise for documentation

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
```

For Astro Starlight documentation sites:

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
```

For VitePress documentation sites:

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
```

Set `docsOutput.vitepressThemeCatalog` for nav/sidebar/footer strings - see [VitePress integration](/guide/integrations/vitepress).

For Nextra documentation sites:

```bash
ai-i18n-tools init -t ui-nextra [-P <provider>]
```

Set `docs[].nextraDictionaryPath` for theme dictionary strings - see [Nextra integration](/guide/integrations/nextra). Sidebar `_meta.ts` labels are collected automatically.

For Fumadocs documentation sites:

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
```

Set `docsOutput.fumadocsUiCatalog` for UI overrides - see [Fumadocs integration](/guide/integrations/fumadocs). Sidebar `meta.json` labels are collected automatically.

For plain Astro website UI (no Starlight):

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
```

That template enables UI extraction only. For page HTML translation, also set `features.translateDocs` and add a `docs[]` block (see [Astro website pages (parse-and-replace)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). The [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) config shows both pipelines together.

Edit the generated `ai-i18n-tools.config.json`:

- `provider` and `providers` — `init` scaffolds a default provider block (`openrouter` unless you pass `-P <provider>`); configure at least one provider and set its API key before `translate-docs` or `sync` (Ollama needs no key). See [Provider and API key](/guide/quick-start#provider-and-api-key) and [LLM providers and models](/guide/providers-and-models).
- `sourceLocale` - source language (must match `defaultLocale` in `docusaurus.config.js`).
- `targetLocales` - array of BCP-47 locale codes (e.g. `["de", "fr", "es"]`).
- `cacheDir` - shared SQLite cache directory for all pipelines (and default log directory for `--write-logs`).
- `docs` - array of documentation blocks. Each block has optional `description`, `contentPaths` (string or array; file, directory, or glob), `outputDir`, optional `docusaurusCatalogDir`, `docsOutput`, optional `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - optional short note for maintainers. When set, it appears in the `translate-docs` headline and in `status` section headers.
- `docs[].contentPaths` - markdown/MDX/`.astro` sources (and optional `docusaurusCatalogDir` for Docusaurus shell JSON).
- `docs[].outputDir` - translated output root for that block.
- `docs[].docsOutput.style` - `"nested"` (default), `"flat"`, `"doc-system"`, or aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (see [Output layouts](/guide/documents/output-layouts)).
- `glossary.uiGlossary` - path to `strings.json` so document segments get terminology hints from your UI catalog (see [Configuration — `glossary`](/reference/configuration#glossary)).
- `glossary.userGlossary` - optional CSV for fixed product-term translations; also used by UI pipelines and editable in the [Glossary](/guide/translation-dashboard/glossary) dashboard tab.

**Primary vs supplementary:** Focus on `contentPaths` for localised pages. Set `docusaurusCatalogDir` when you also need Docusaurus shell JSON from `write-translations`. Omit `docusaurusCatalogDir` if you only translate pages.

<a id="step-2-translate-documents"></a>
## Step 2: Translate documents

```bash
ai-i18n-tools translate-docs
```

This translates all files in every `docs[]` block's `contentPaths` (and Docusaurus catalog JSON when `docusaurusCatalogDir` is set) to all effective documentation locales. Already-translated segments are served from the SQLite cache - only new or changed segments are sent to the LLM.

To translate a single locale:

```bash
ai-i18n-tools translate-docs --locale de
```

To check what needs translating:

```bash
ai-i18n-tools status
```

For flags, cache behaviour, and batch prompt format, see [CLI options](/guide/documents/cli-options).

<a id="complex-markdown-and-failed-quality-checks"></a>
## Complex Markdown and failed quality checks

`translate-docs` checks that each translated segment preserves markdown structure (including emphasis parsed from the document) and that internal placeholder tokens restore cleanly. Paragraphs that stack many `bold` spans around `` `inline code` ``, nest backticks inside bold (for example template literals such as `` `fetch(\`/locales/${code}.json\`)` ``), or weave bold and code through one long sentence are fragile: some locales need different word order, which can change how `**` and `` ` `` line up after translation and trigger CLI errors such as `AST mismatch`.

After restore, `translate-docs` also rejects segments where HTML tag placeholders were reused or dropped (so restored tags no longer match the source map) or where the model invented leftover double-brace tokens that were not in the source (for example a made-up glossary-style token). Those failures use the same model-fallback path as leftover official internal tokens.

**If you hit that kind of validation failure, prefer simplifying the source-language text** - split the paragraph, move an example into a fenced code block, or describe the same idea with fewer layered bold/code pairs - rather than expecting every model and locale to reproduce dense inline markup perfectly.

When every configured model fails with an `AST mismatch` on the same segment, `translate-docs` can automatically split that segment into smaller parts (list midpoint first, then single list items or shorter paragraph chunks), retry each part from the first model, and rejoin the result under the original segment cache key. This is on by default (`segmentSplitting.qualityRetrySplit`); set it to `false` to stop after model exhaustion. The run summary reports `Quality split retries` when this fallback runs.

To see **which segments failed**, how often, and the stored **quality / error messages**, use the Translation Dashboard's **Failures** tab ([Translation Dashboard → Failures](/guide/translation-dashboard/failures#failures-document-translation)).