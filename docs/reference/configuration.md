<a id="configuration-reference"></a>
# Configuration reference

<a id="sourcelocale"></a>
### `sourceLocale`

BCP-47 code for the source language (e.g. `"en-GB"`, `"en"`, `"pt-BR"`). No translation file is generated for this locale — the key string itself is the source text.

**Must match** `SOURCE_LOCALE` exported from your runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Array of BCP-47 locale codes to translate to (e.g. `["de", "fr", "es", "pt-BR"]`).

`targetLocales` is the primary locale list for UI translation and the default locale list for documentation blocks. Use `generate-ui-languages` to build the `ui-languages.json` manifest from `sourceLocale` + `targetLocales`.

<a id="uilanguage-optional"></a>
### `uiLanguage` (optional)

BCP-47 code for the tool's own UI language (CLI help, logs/summaries, and the Translation Dashboard). It is independent of `sourceLocale` / `targetLocales`, and is overridden by the `-L` / `--ui-lang` flag and the `AI_I18N_LANG` environment variable. Unknown values degrade gracefully to the source locale (`en-GB`) — there is no strict validation. See [Tool UI language](/reference/environment-variables#tool-ui-language).

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (optional)

Path to the `ui-languages.json` manifest used for display names, locale filtering, and language-list post-processing. When omitted, the CLI looks for the manifest at `ui.flatOutputDir/ui-languages.json`.

Use this when:

- The manifest lives outside `ui.flatOutputDir` and you need to point the CLI at it explicitly.
- You want [language switcher post-processing](#language-switcher-languagelistblock) (`languageListBlock`) to build locale labels from the manifest.
- `extract` should merge `englishName` entries from the manifest into `strings.json` (requires `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (optional)

Maximum **target locales** translated at the same time (`translate-ui`, `translate-docs`, `translate-svg`, and the matching steps inside `sync`). If omitted, the CLI uses **4** for UI translation and **3** for documentation translation (built-in defaults). Override per run with `-j` / `--concurrency`.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (optional)

**translate-docs**, **translate-svg**, and **translate-json** (and the matching steps inside `sync`): maximum parallel LLM **batch** requests per file (each batch can contain many segments). Default **4** when omitted. Ignored by `translate-ui`. Override with `-b` / `--batch-concurrency`.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (optional)

Maximum number of files processed concurrently **within a single locale** during `translate-docs` and `sync`. When set to a value greater than **1**, files within the same locale are processed in parallel using a semaphore to control memory usage. Default **1** (sequential processing) when omitted. Higher values can significantly improve throughput for I/O-bound operations, especially when all segments are already cached (no API calls needed).

**Example:**

```json
{
  "fileConcurrency": 4
}
```

**Use case:** Set this to `2-4` when running `sync --force-update` with 100% cache hits to reduce total processing time. The improvement is most noticeable with many small files.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (optional)

Segment batching for **translate-docs**, **translate-svg**, and **translate-json**: how many segments per API request, and a character ceiling. Defaults: **20** segments, **4096** characters (when omitted).

<a id="provider-and-providers"></a>
### `provider` and `providers`

`provider` (top-level, optional) selects the active provider key from `providers`. It is optional when exactly one provider is configured; required when more than one is configured.

`providers` (top-level) maps a provider key to its block. Built-in keys (see the preset table below) need only `translationModels`; any other key defines a custom OpenAI-compatible endpoint and requires `baseUrl` (plus `apiKeyEnv` unless the endpoint needs no key).

Each `providers.<name>` block accepts:

- `translationModels`
  Preferred ordered list of model IDs (plain upstream ids, no `provider/` prefix; OpenRouter ids keep their native `vendor/model` form). The first is tried first; later entries are fallbacks on error. This is the global default chain for every pipeline when no more specific tier applies.
- `uiModels` (optional)
  Ordered UI-only model list for `translate-ui`, plural generation (Step 0 and Pass B), and `proofread-ui`. Tried after any matching `localeModels` entry for the target locale, before `translationModels`.
- `localeModels` (optional)
  Per-locale overrides for **all** translation pipelines. Array of `{ "locale": "<BCP-47>", "models": ["…"] }` objects. Locale tags are matched case-insensitively (`pt-br` = `pt-BR`). Each locale's list is tried first for that locale only, then pipeline-specific tiers (`uiModels` for UI) and `translationModels`. Duplicate normalized locale keys are rejected at config load.
- `baseUrl`
  OpenAI-compatible base URL. Overrides the preset base URL; required for a non-preset provider.
- `apiKeyEnv`
  Environment variable holding the API key. Overrides the preset env var.
- `headers`
  Extra HTTP headers sent with every request to this provider.
- `maxTokens`
  Max completion tokens per request. Default: `8192`.
- `temperature`
  Sampling temperature. Default: `0.2`.
- `requestTimeoutMs`
  Maximum time in milliseconds to wait for each request. Default: `30000` (30 seconds).

Built-in provider presets (key — base URL — API-key env var):

| Provider | Base URL | API-key env var |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (none) |

A legacy top-level `openrouter` block (with `baseUrl`, `translationModels`, `defaultModel`, `fallbackModel`, `maxTokens`, `temperature`, `requestTimeoutMs`) is still accepted and is auto-migrated to `providers.openrouter` (with `provider: "openrouter"`) on load; `defaultModel` / `fallbackModel` fold into `translationModels`.

For a runnable example that configures several providers in one config and switches between them with `-P`, see [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/) (`openai`, `anthropic`, `nvidia`, and `deepseek` on the same document).

**Why use multiple models:** Different providers and models have varying costs and offer different levels of quality across languages and locales. Configure `translationModels` **as an ordered fallback chain** (rather than a single model) so the CLI can attempt the next model if a request fails.

Treat the list below as a **baseline** that you can expand: if translation for a specific locale is poor or unsuccessful, research which models support that language or script effectively (refer to online resources or your provider’s documentation), and add those model ids as further alternatives.

This list was **tested for broad locale coverage** across a large documentation project with 36 target locales; it serves as a practical default, but is not guaranteed to perform well for every locale.

Example `translationModels` (same defaults as `npx ai-i18n-tools init`):

<details>
<summary>Default translationModels fallback list</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
  // … add more fallback models as needed
]
```

</details>

<br />

Set the active provider's API-key env var (e.g. `OPENROUTER_API_KEY`) in your environment or `.env` file.

Before changing model lists, run `npx ai-i18n-tools check-models`. For any provider it verifies each configured model id (`translationModels`, `uiModels`, and all `localeModels` entries) against that provider's live model list (`GET /models`), reports ids that are missing or past `expiration_date`, lists the valid models, and exits non-zero when any configured id is invalid. When the provider returns pricing (e.g. OpenRouter) it also shows estimated input/output pricing (USD per 1M tokens).

To compare the configured models on real translation work, run `npx ai-i18n-tools bench-models`. It benchmarks every unique model id from `translationModels`, `uiModels`, and `localeModels` by translating one sample through each in isolation (in parallel, bounded by `concurrency`) and prints per-model input/output tokens, wall-clock time, and USD cost, so you can weigh speed against price before settling on model lists.

<a id="features"></a>
### `features`


| Field                | Pipeline | Description                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | Extract `t("…")` / `i18n.t("…")` into `strings.json`, then translate entries and write per-locale flat JSON (extract runs automatically; use standalone `extract` to refresh the catalog only). |
| `translateDocs`      | 2        | Translate `.md` / `.mdx` / `.astro` pages; Docusaurus shell JSON when `docs[].docusaurusCatalogDir` is set; Nextra `_meta` / dictionary when configured; VitePress theme when `docsOutput.vitepressThemeCatalog` is set; Fumadocs `meta.json` / UI catalog when `docsOutput.style` is `"fumadocs"`. |
| `translateJson`      | 3        | Arbitrary nested JSON under `json[]` (`translate-json`).                                                                                                           |
| `translateSVG`       | —        | Translate `.svg` files (requires the top-level `svg` block).                                                                                                       |

**Translate** SVG files with `translate-svg` when `features.translateSVG` is true and a top-level `svg` block is configured. The `sync` command runs that step when both are set (unless `--no-svg`).

<a id="ui"></a>
### `ui`


- `sourceRoots`  
  Directories or glob patterns (relative to cwd) scanned for `t("…")` calls. Supports patterns like `src/` or `["src/**/*.ts"]`.
- `stringsJson`  
  Path to the master catalog file. Updated by `extract`.
- `flatOutputDir`  
  Directory where per-locale JSON files are written (`de.json`, etc.).
- `uiExtractor.funcNames` (or legacy `reactExtractor.funcNames`)  
  Additional function names to scan (default: `["t", "i18n.t"]`).
- `uiExtractor.extensions` (or legacy `reactExtractor.extensions`)  
  File extensions to include (default: `[".js", ".jsx", ".ts", ".tsx"]`). Add `.astro` for Astro frontmatter and template expressions.
- `uiExtractor.includePackageDescription` (or legacy `reactExtractor.includePackageDescription`)  
  When `true` (default), `extract` also includes `package.json` `description` as a UI string when present.
- `uiExtractor.packageJsonPath` (or legacy `reactExtractor.packageJsonPath`)  
  Custom path to the `package.json` file used for that optional description extraction.
- `uiExtractor.includeUiLanguageEnglishNames` (or legacy `reactExtractor.includeUiLanguageEnglishNames`)

  When `true` (default `false`), `extract` also adds each `englishName` from the bundled ui-languages master catalog (built from `sourceLocale` + `targetLocales`) to `strings.json` when not already present from the source scan (same hash keys). Does not read `uiLanguagesPath`.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite cache directory (shared by all `docs` blocks). Default `.translation-cache`. Reuse across runs. If you are migrating from a custom doc translation cache, archive or delete it — `cacheDir` creates its own SQLite database and is not compatible with other schemas.


<a id="best-practice-for-git-exclusions"></a>
#### Best practice for git exclusions:

- Exclude the contents of the translation cache folder (for example, using `.gitignore` or `.git/info/exclude`) to prevent committing temporary cache artefacts.
- Retain `cache.db` (do not routinely delete it), as preserving the SQLite cache prevents re-translating unchanged segments. This saves both runtime and API costs when updating or modifying software that uses `ai-i18n-tools`.
- Exclude temporary and log files to avoid committing backup and debug-related files.


<br/>

**Example:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

Array of documentation pipeline blocks. `translate-docs` and the docs phase of `sync` **process each** block in order. Legacy keys are still accepted at load time and rewritten when the config file is writable; prefer current names in new configs.

| Legacy key | Current key / behaviour |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| top-level `openrouter` | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | removed (use `docs[].docusaurusCatalogDir` or `json[]`) |
| `features.extractUIStrings` | removed (`extract` runs before UI translation) |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor` (alias still accepted) |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

**Content sources**

- `description`
Optional human-readable note for this block (not used for translation). Prefixed in the `translate-docs` `🌐` headline when set; also shown in `status` section headers.
- `contentPaths`
Markdown/MDX page bodies and `.astro` templates to translate (`translate-docs` scans these for `.md`, `.mdx`, and `.astro`). Supports **directory paths or glob patterns** (e.g. `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). That is where localised documentation prose comes from.
- `sourceFiles`
Optional alias merged into `contentPaths` at load.
- `targetLocales`
Optional subset of locales for this block only (otherwise root `targetLocales`). Effective documentation locales are the union across blocks.
- `docusaurusCatalogDir`
Optional. Source directory for Docusaurus JSON label catalogs for this block (e.g. `"i18n/en"` from `docusaurus write-translations`). Page bodies always come from `contentPaths`; `docusaurusCatalogDir` only supplies shell/UI JSON, not MDX.
- `nextraMetaGlob`
Optional glob(s) for Nextra `_meta.ts` / `_meta.tsx` / `_meta.js` under `docsRoot`. When `docsOutput.style` is `"nextra"` and this is omitted, all `_meta` files under `docsRoot` are collected automatically.
- `nextraMetaTranslatableKeys`
Optional property names whose string values are translated in Nextra `_meta` objects (default: `title`, `display`, `breadcrumb`).
- `nextraDictionaryPath`
Optional English Nextra theme dictionary module (e.g. `"app/_dictionaries/en.ts"`). Translated to `{dir}/{locale}.ts` during `translate-docs`.
- `nextraDictionaryOutputTemplate`
Optional output template for locale dictionary modules (default: `{dir}/{locale}.ts` relative to the dictionary directory).

**Output layout**

- `outputDir`
Root directory for translated output for this block.
- `docsOutput.style`
`"nested"` (default), `"flat"`, `"doc-system"`, or aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"`.
- `docsOutput.localeSubpath`
Path segment between `{locale}/` and `{relativeToDocsRoot}` for `doc-system` (required when using `style: "doc-system"` directly; preset when using an alias). Use `""` for Starlight-style locale folders.
- `docsOutput.docsRoot`
Source docs root for Docusaurus layout (e.g. `"docs"`). Default `"docs"` when omitted.
- `docsOutput.pathTemplate`
Custom markdown output path. Placeholders: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
Custom JSON output path for label files. Supports the same placeholders as `pathTemplate`.
- `docsOutput.localePathLowercase`
When `true`, built-in output layouts (`nested`, `flat`, `doc-system` without `pathTemplate`) use lowercased locale segments in paths. Default `false`; `astro-starlight` and `doc-system` with empty `localeSubpath` default to `true` at config load.
- `docsOutput.flatPreserveRelativeDir`
When `docsOutput.style = "flat"`, keep source subdirectories so files with the same basename do not collide. Default `false`.
- `docsOutput.rewriteRelativeLinks`
Rewrite relative links after translation (auto-enabled when `docsOutput.style = "flat"` and no custom `pathTemplate`).
- `docsOutput.linkRewriteDocsRoot`
Repo root used when computing flat-link rewrite prefixes. Usually leave this as `"."` unless your translated docs live under a different project root.
- `docsOutput.rewriteVitepressLinks`
When `true`, run the VitePress link normalizer after translation. Defaults to enabled when `docsOutput.style` is `"vitepress"`. Use with any `doc-system` layout where locale folders sit beside English under `docsRoot`. Rewrites README-style `docs/guide/…` paths to site routes (`/guide/…`) and locale-relative `../guide/…` links. For links to repo files outside the VitePress tree (`LICENSE`, `examples/`), use full URLs in English source — see [VitePress integration — README as the docs homepage](/guide/vitepress-integration#readme-as-homepage).
- `docsOutput.rewriteNextraLinks`
When `true`, run the Nextra link normalizer after translation. Defaults to enabled when `docsOutput.style` is `"nextra"`. Rewrites `content/en/…` and relative `.mdx` paths to locale-neutral site routes (`/guide/…`) for Next.js `i18n`. See [Nextra integration — Link conventions](/guide/nextra-integration#link-conventions).
- `docsOutput.fumadocsParser`
`"dot"` (default) or `"dir"`. Dot writes `stem.{locale}.mdx` beside English sources; dir writes locale folders like Nextra. See [Fumadocs integration — Page layout](/guide/fumadocs-integration#page-layout).
- `docsOutput.rewriteFumadocsLinks`
When `true`, run the Fumadocs link normalizer after translation. Defaults to enabled when `docsOutput.style` is `"fumadocs"`. Rewrites content paths and relative `.mdx` links to `/docs/…` routes.
- `docsOutput.fumadocsUiCatalog`
Optional. Fumadocs UI override catalog bootstrap + translation inside `translate-docs`. Fields: `sourcePath` (e.g. `lib/layout.shared.ts`), `catalogPath` (generated English JSON), optional `outputPathTemplate` (default: `ui.{locale}.json` beside `catalogPath`).
- `docs[].fumadocsMetaGlob`
Optional glob(s) for `meta.json` collection when `docsOutput.style` is `"fumadocs"`. Default: recursive `meta.json` under `docsOutput.docsRoot`.
- `docs[].fumadocsMetaTranslatableKeys`
Property names whose string values are translated in Fumadocs `meta.json` (default: `title`, `description`).
- `docsOutput.vitepressThemeCatalog`
Optional. VitePress theme/nav/sidebar catalog bootstrap + translation inside `translate-docs`. Fields: `configPath` (VitePress config with theme strings), `catalogPath` (generated English nested JSON), optional `outputPathTemplate` (default: `theme.{locale}.json` beside `catalogPath`).

**Post-processing**

- `docsOutput.postProcessing`
Optional transforms on the translated **markdown body** (YAML keys and non-prose front matter values are preserved). Runs after segment reassembly and link rewriting (flat or VitePress), and before `addFrontmatter`.
- `docsOutput.postProcessing.regexAdjustments`
Ordered list of `{ "description"?, "search", "replace" }`. `search` is a regex pattern (plain string uses flag `g`, or `/pattern/flags`). `replace` supports placeholders such as `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — regenerates a bounded "read in other languages" link row in source and translated markdown. Requires `uiLanguagesPath` (or a manifest at `ui.flatOutputDir/ui-languages.json`) for endonym labels when `label: "local"`.

**Behaviour and metadata**

- `translateFrontmatterFields`
Same level as `docsOutput` (per `docs[]` block). Default `true`: translate user-facing YAML prose for Starlight/Docusaurus (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next` labels). Set `false` to keep the entire front matter block unchanged; pass a string array to restrict to specific dot-paths.
- `segmentSplitting`
Same level as `docsOutput` (per `docs[]` block). Optional finer-grained segments for `translate-docs` extraction: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`. When `enabled` is `true` (default when `segmentSplitting` is omitted), dense paragraphs, GFM pipe tables (first chunk includes header, separator, and first data row), and long lists are split; sub-parts rejoin with single newlines (`tightJoinPrevious`). Set `"enabled": false` to use one segment per blank-line-delimited body block only. When `qualityRetrySplit` is `true` (default), markdown segments that fail AST validation after all models are exhausted are split progressively and retried from the first model; `maxQualityRetrySplitDepth` (default `3`) caps recursive splits.
- `warnMarkdownSourceIssues`
When `true` (default when omitted), each `translate-docs` run rescans markdown segments for risky delimiters / unclosed inline code, prints terminal warnings, and replaces `markdown_source_issues` rows for that file's cache filepath. Set `false` to skip warnings and SQLite updates for this block.
- `addFrontmatter`
When `true` (default when omitted), translated markdown files include YAML keys: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, and when at least one segment has model metadata, `translation_models` (sorted list of model ids from the active provider). Set to `false` to skip.
- `emphasisPlaceholders`
Per `docs[]` block. When `true`, mask markdown emphasis delimiters as placeholders before translation. Defaults to `true` for CJK locales (`zh`, `ja`, `ko`) and for locales listed in `rtlLocales`; otherwise defaults to `false`. Overridable via CLI `--emphasis-placeholders` / `--no-emphasis-placeholders`.
- `rtlLocales`
Optional array of BCP-47 codes treated as RTL for emphasis-placeholder defaults (merged with built-in RTL detection).

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
Optional. Extra JSX/HTML attribute names whose **quoted string values** must not be sent to the translator. Merged with built-in defaults (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, most `aria-*`, etc.). Case-insensitive. Applies to:

  - `.astro` parse-and-replace extraction (static HTML tags and string literals after `attr=` inside `{expression}` blocks).
  - MDX placeholder extraction during markdown/Astro segment translation (`label`, `tooltip`, and `aria-label` on capitalised JSX tags, plus `TabItem` `value` when applicable).

  Example: `"protectAttributes": ["variant", "size"]` keeps `variant="primary"` inside `{items.map(...)}` unchanged across locales.

  You can also list normally translatable attributes (for example `"title"` or `"aria-label"`) when you want those values copied verbatim from English.

- `protectKeys`
Optional. Extra **object property names** whose quoted string values must not be translated inside template `{expression}` blocks and MDX object literals (for example `label:` inside `<Tabs values={[ … ]}>`). Merged with built-in defaults (`class`, `key`, `id`, `href`, `src`, etc.). Case-insensitive.

  Example: `"protectKeys": ["slug", "code"]` skips `{ slug: 'getting-started', title: 'Getting started' }` → only `title` is translated when `slug` is protected.

<br/>

**Example (`docsOutput.style = "flat"` — screenshot paths + optional language list wrapper):**

<details>
<summary>Flat layout postProcessing example (screenshots + languageListBlock)</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

Top-level array of nested JSON translation pipelines. Used only when `features.translateJson` is true (`translate-json` or the JSON stage of `sync`). See [JSON](/guide/json).

| Field | Description |
|-------|-------------|
| `description` | Optional note for CLI / `status` (not translated). |
| `contentPaths` | Source `.json` files, directories, or globs under the project root. |
| `outputPathTemplate` | Required output path per target locale. Placeholders: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`. |
| `targetLocales` | Optional subset for this block; otherwise root `targetLocales`. |
| `keyPolicy.mode` | `allowlist`, `denylist`, or `both`. |
| `keyPolicy.translateKeys` | Dot paths / globs to include when mode is `allowlist` or `both`. |
| `keyPolicy.skipKeys` | Dot paths / globs to exclude (default denylist includes `id`, `slug`, `href`, `url`, `key`, `code`). |

<a id="svg"></a>
### `svg`

Top-level paths and layout for SVG files. Translation runs only when `features.translateSVG` is true (via `translate-svg` or the SVG stage of `sync`).

| Field            | Description                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | One or more directories **or glob patterns** (e.g. `"images/*.svg"`, `"**/icons/*.svg"`). The patterns are resolved relative to the project root and scanned recursively for `.svg` files.                                                                         |
| `outputDir`      | Root directory for translated SVG output.                                                                                                                                                                                                                          |
| `style`          | `"flat"` or `"nested"` when `pathTemplate` is unset.                                                                                                                                                                                                               |
| `pathTemplate`   | Custom SVG output path. Placeholders: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `localePathLowercase` | When `true`, built-in `flat` / `nested` SVG layouts use lowercased locale segments. Custom `pathTemplate` values are unchanged; use `{llocale}` for lowercase segments. |
| `forceLowercase` | Lower-case translated text on SVG reassembly. Useful for designs that rely on all-lowercase labels.                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Field          | Description                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Path to `strings.json` - auto-builds a glossary from existing translations.                                                                                                 |
| `userGlossary` | Path to a CSV with columns `Original language string` (or `en`), `locale`, `Translation` - one row per source term and target locale (`locale` may be `*` for all targets). |
| `autoAddUserEditedToGlossary` | When `true`, dashboard edits to UI strings can be appended to the user glossary automatically. |


**Generate an empty glossary CSV:**

```bash
npx ai-i18n-tools glossary-generate
```
