<a id="documents"></a>
# Documents

Reference for `translate-docs`, the pipeline for Markdown, MDX, `.astro`, and plain HTML pages listed in `docs[]` config blocks. Each block's `contentPaths` field lists the files or folders to translate. Those files are written in `sourceLocale`, which can be any language. English in the examples is only a sample. Adding languages to a site for the first time? Start at [Add i18n to a website or docs site](/guide/add-i18n-to-website). A repository README and other Markdown files, usually next to an app: [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme). Plain HTML pages (one file per locale) are described in [HTML pages](/guide/documents/html-pages).

Framework shell strings (navbar, sidebar, theme) are translated in the same run, not by a separate pipeline. The framework guides in the table below say how each one does it: `docusaurusCatalogDir` for Docusaurus, `docsOutput.vitepressThemeCatalog` for VitePress, `docs[].nextraDictionaryPath` for Nextra, `docsOutput.fumadocsUiCatalog` for Fumadocs. Nextra `_meta.ts` and Fumadocs `meta.json` sidebar labels are collected automatically. Astro Starlight ships built-in UI strings for many locales, and optional overrides can use `jsonPathTemplate` on a `docs[]` block.

For PNG and other raster images embedded in markdown, see [Images & Screenshots](/guide/images-and-screenshots/). `translate-docs` translates alt text only; it does not copy raster files.

For an optional **language switcher** block in README or docs, set `docsOutput.style` to `"flat"` - see [Language switcher](/guide/documents/language-switcher).

[SVG](/guide/svg-translation/) files are translated via [`translate-svg`](/reference/cli-commands/content#translate-svg) when `features.translateSVG` is enabled - not through `docs[]` / `contentPaths`.

Arbitrary nested UI JSON bundles unrelated to a documentation framework's shell/theme strings belong in the [JSON](/guide/json) pipeline, not in `docs[]`.

Each UI block includes its `strings.json` as glossary hints for documentation by default (`uiGlossary`, default `true`). `translate-docs` reuses those translations as hints in LLM prompts when matching terms appear in a segment. Set `uiGlossary` to `false` on a catalog that should stay out of document prompts. Optional `glossary.userGlossary` adds CSV overrides for product terms (shared with `translate-ui` and `proofread-ui`). Compact UI-label abbreviations used to fit narrow columns (for example `Size` → `Tam`) stay available for UI translation but are omitted from document glossary hints. Generate a starter CSV with `glossary-generate`, edit rows in the Translation Dashboard [Glossary](/guide/translation-dashboard/glossary) tab, or see [Configuration — `glossary`](/reference/configuration#glossary) and [Glossary](/guide/glossary).

<a id="per-locale-model-overrides"></a>
### Per-locale model overrides

`translate-docs` and the docs step of `sync` resolve models **per target locale**: `localeModels(locale)` first when configured, then the provider's global `translationModels` chain. Use this when a specific language needs a different model than your default fallback list - for example, preferring Gemini for `pt-BR` documentation when the global chain struggles with Portuguese. See [AI Models](/guide/ai-models#model-fallback-chain) and [Configuration - `localeModels`](/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Which guide to read

| Your setup | Start here |
| --- | --- |
| Docusaurus site | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/guide/integrations/docusaurus) |
| VitePress site | `init -t ui-vitepress` + `vitepressThemeCatalog` for theme - [VitePress](/guide/integrations/vitepress) |
| Nextra site | `init -t ui-nextra` + `nextraDictionaryPath` for dictionary (sidebar `_meta.ts` is automatic) - [Nextra](/guide/integrations/nextra) |
| Fumadocs site | `init -t ui-fumadocs` + `fumadocsUiCatalog` for UI (sidebar `meta.json` is automatic) - [Fumadocs](/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/guide/integrations/astro#astro-starlight) |
| Plain HTML pages | `init -t docs-plain-html` - [HTML pages](/guide/documents/html-pages) |
| Flat documents (README, changelogs, etc.) | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme) — `init -t docs-markdown` or `--with-readme`. Layout: [Output layouts](/guide/documents/output-layouts), [language switcher](/guide/documents/language-switcher) |
| Where translated files land | [Output layouts](/guide/documents/output-layouts) |
| Cross-page `#anchor` links | [Anchor links](/guide/documents/anchor-links) |
| Link and asset URL rewriting (`regexAdjustments`) | [Link rewriting](/guide/documents/link-rewriting) |
| Screenshots in docs | [Images & Screenshots](/guide/images-and-screenshots/) |
| Product terminology and UI/doc consistency | [Configuration — `glossary`](/reference/configuration#glossary), [Glossary](/guide/glossary) |
| `translate-docs` flags and cache | [CLI options](/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Step 1: Initialise for documentation

```bash
ai-i18n-tools init -t ui-docusaurus -P openai
```

For Astro Starlight documentation sites:

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
```

For VitePress documentation sites:

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
```

Set `docsOutput.vitepressThemeCatalog` for nav/sidebar/footer strings - see [VitePress integration](/guide/integrations/vitepress).

For Nextra documentation sites:

```bash
ai-i18n-tools init -t ui-nextra -P gemini
```

Set `docs[].nextraDictionaryPath` for theme dictionary strings - see [Nextra integration](/guide/integrations/nextra). Sidebar `_meta.ts` labels are collected automatically.

For Fumadocs documentation sites:

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
```

Set `docsOutput.fumadocsUiCatalog` for UI overrides - see [Fumadocs integration](/guide/integrations/fumadocs). Sidebar `meta.json` labels are collected automatically.

For plain Astro website UI (no Starlight):

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
```

That template enables UI extraction only. For page HTML translation, also set `features.translateDocs` and add a `docs[]` block (see [Astro website pages (parse-and-replace)](/guide/ui-strings/astro-website#pages-parse-and-replace)). The [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) config shows both pipelines together.

Edit the generated `ai-i18n-tools.config.json`:

- `provider` and `providers` — `init -P <provider>` scaffolds that preset; set its API key before `translate-docs` or `sync` (Ollama needs no key). See [Provider and API key](/guide/quick-start#provider-and-api-key), [LLM providers](/guide/providers-and-models), and [AI Models](/guide/ai-models).
- `sourceLocale` - source language (must match `defaultLocale` in `docusaurus.config.js`).
- `targetLocales` - array of BCP-47 locale codes (e.g. `["de", "fr", "es"]`).
- `cacheDir` - shared SQLite cache directory for all pipelines (and default log directory for `--write-logs`).
- `docs` - array of documentation blocks. Each block has optional `description`, `contentPaths` (string or array; file, directory, or glob), `outputDir`, optional `docusaurusCatalogDir`, `docsOutput`, optional `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `docs[].description` - optional short note for maintainers. When set, it appears in the `translate-docs` headline and in `status` section headers.
- `docs[].contentPaths` - markdown/MDX/`.astro` sources (and optional `docusaurusCatalogDir` for Docusaurus shell JSON).
- `docs[].outputDir` - translated output root for that block.
- `docs[].docsOutput.style` - `"nested"` (default), `"flat"`, `"doc-system"`, or aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (see [Output layouts](/guide/documents/output-layouts)).
- `ui[].uiGlossary` - when `true` (the default), that block's `strings.json` supplies terminology hints for document segments (see [Configuration — `ui`](/reference/configuration#ui)).
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

After restore, `translate-docs` also rejects segments where HTML tag placeholders were reused or dropped (so restored tags no longer match the source map) or where the model invented leftover double-brace tokens that were not in the source (for example a made-up glossary-style token). Pre-restore checks require the same multiset of <code v-pre>{{…}}</code> tokens and the same ordered subsequence of structural tokens (<code v-pre>{{HTM_N}}</code>, admonition markers); content tokens such as <code v-pre>{{ILC_N}}</code>, <code v-pre>{{URL_N}}</code>, and emphasis markers like <code v-pre>{{SE}}</code> may move with natural word order when each id / type count still matches. Those failures use the same model-fallback path as leftover official internal tokens.

**If you hit that kind of validation failure, prefer simplifying the source-language text** - split the paragraph, move an example into a fenced code block, or describe the same idea with fewer layered bold/code pairs - rather than expecting every model and locale to reproduce dense inline markup perfectly.

When every configured model fails with an `AST mismatch` on the same segment, `translate-docs` can automatically split that segment into smaller parts (list midpoint first, then single list items or shorter paragraph chunks), retry each part from the first model, and rejoin the result under the original segment cache key. This is on by default (`segmentSplitting.qualityRetrySplit`); set it to `false` to stop after model exhaustion. The run summary reports `Quality split retries` when this fallback runs.

To see **which segments failed**, how often, and the stored **quality / error messages**, use the Translation Dashboard's **Failures** tab ([Translation Dashboard → Failures](/guide/translation-dashboard/failures#failures-document-translation)).