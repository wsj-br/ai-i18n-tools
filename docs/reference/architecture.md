<a id="architecture"></a>
# Architecture


<a id="architecture-overview"></a>
## Architecture overview

The codebase is organised in four layers. Use this section for the mental model; open the [source tree](#source-tree) when you need file-level detail.

<a id="how-a-sync-run-fits-together"></a>
### How a `sync` run fits together

`sync` (and the individual translate commands) run enabled features in order:

| Step | Command | What it does |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | Scan UI sources → update `strings.json` → fill flat locale JSON (`de.json`, …) |
| 2 | `translate-svg` *(optional)* | Translate SVG text under `config.svg` |
| 3 | `translate-docs` | Translate markdown, MDX, `.astro` pages, and Docusaurus JSON catalogs |
| 4 | `translate-json` *(optional)* | Translate nested JSON leaves under `json[]` |

Every pipeline follows the same core loop: **extract segments → protect syntax → batch → cache lookup or LLM call → write output**. Shared services in the middle — config, placeholders, cache, glossary, `LlmClient` — are described under [Shared infrastructure](#shared-infrastructure).

<a id="module-map"></a>
### Module map

| Layer | Folder | Role |
| --- | --- | --- |
| **Entry** | `src/cli/` | CLI commands: `init`, `extract`, `mark-html`, `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`, `status`, `dashboard`, … |
| **Pipelines** | `src/extractors/` | Segment extraction from JS/TS, HTML markers, markdown, JSON, SVG, `.astro` |
| | `src/processors/` | Placeholder protection, batching, validation, link rewriting |
| **Shared** | `src/core/` | Config, types, SQLite cache, prompts, output paths, locale utilities |
| | `src/api/` | `LlmClient` — provider-agnostic chat client (Vercel AI SDK) with model fallback |
| | `src/glossary/` | Glossary loading and term hints for prompts |
| | `src/utils/` | Logger, hashing, ignore parser, display-width tables, `.env` loader |
| **Your app runtime** | `src/runtime/` | i18next helpers and display utilities — exported as `'ai-i18n-tools/runtime'` ([Runtime helpers](/guide/runtime-helpers)) |
| **Tool UI** *(dogfooding)* | `src/i18n/`, `src/dashboard-app/`, `src/server/` | Localizes this package's own CLI and Translation Dashboard — separate from your project content ([Self-localization](#self-localization-tool-ui)) |

Everything intended for programmatic use is re-exported from `src/index.ts` ([Programmatic API](/reference/programmatic-api)).

<a id="pipeline-summaries"></a>
### Pipeline summaries

| Pipeline | Section | Input → output |
| --- | --- | --- |
| UI strings | [UI strings internals](#ui-strings-internals) | Source files → `strings.json` → flat `{locale}.json` |
| Documents | [Documents internals](#documents-internals) | Markdown / MDX / `.astro` / Docusaurus JSON → per-locale files under `docs[].outputDir` |
| JSON bundles | [JSON internals](#json-internals) | Nested JSON under `json[]` → per-locale JSON files |
| SVG | [Documents internals — extractors](#extractors) | SVG files under `config.svg` → translated SVG copies |

---

<a id="ui-strings-internals"></a>
## UI strings internals

| Step | Component | Result |
| --- | --- | --- |
| 1 | Source files (JS/TS; optional `.astro` / `.html`) | Files on disk |
| 2 | `UIStringExtractor` (i18next-scanner; `.astro` via `ui-string-babel.ts`) | Segments keyed by MD5 hash |
| 3 | `strings.json` | Master catalog: `{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | JSON array of source strings → translations (+ model id per batch) |
| 5 | `de.json`, `pt-BR.json`, … | Flat maps: source string → translation (no model metadata) |

<a id="uistringextractor"></a>
### `UIStringExtractor`

Uses `i18next-scanner`'s `Parser.parseFuncFromString` to find `t("literal")` and `i18n.t("literal")` calls in JS/TS files. For `.astro` sources (when listed in `ui.uiExtractor.extensions`), `ui-string-babel.ts` parses frontmatter and template `{expression}` blocks with `@babel/parser` and applies the same `funcNames` rules. Function names and file extensions are configurable via `ui.uiExtractor` (`ui.reactExtractor` is a supported alias). `extract` **also merges non-scanner inputs into the same catalog:** the project `package.json` `description` when `includePackageDescription` is enabled (default), and each `englishName` from `ui-languages.json` when `includeUiLanguageEnglishNames` is `true` and `uiLanguagesPath` is set (strings already found in source keep precedence). Segment hashes are **MD5 first 8 hex chars** of the trimmed source string — these become the keys in `strings.json`.

For `.html` / `.htm` sources (when listed in `ui.uiExtractor.extensions`), `extract` instead routes the file through `html-i18n-marks.ts`, which scans `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` marker attributes (configurable via `ui.uiExtractor.htmlI18nAttributes`). A bare marker takes its source text from the element's own `textContent` / `title` / `placeholder`; a valued marker (`data-i18n="Key"`) uses the value. The same module powers the `mark-html` command, which inserts the bare markers automatically. HTML files never reach the Babel / i18next-scanner passes.

Plain Astro SSG sites can skip i18next: load flat `{locale}.json` at build time and resolve `t('English')` by source-text key (see `examples/astro-website/src/i18n/t.ts` and [UI strings — Astro website](../guide/ui-strings/astro-website.md#astro-website-plain-astro-not-starlight)).

Plain HTML apps follow the same catalog model with marker attributes instead of `t()` calls — see [Marking HTML for translation](../guide/ui-strings/plain-html.md#marking-html-for-translation).

<a id="stringsjson"></a>
### `strings.json`

The master catalog has the shape:

```json
{
  "a1b2c3d4": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models` (optional) — per locale, which model produced that translation after the last successful `translate-ui` run for that locale (or `user-edited` if the text was saved from the Translation Dashboard). `locations` (optional) — where `extract` found the string (scanner + package description line; manifest-only `englishName` strings may omit `locations`).

`extract` adds new keys and preserves existing `translated` / `models` data for keys still present in the scan (scanner literals, optional description, optional manifest `englishName`). `translate-ui` fills missing `translated` entries, updates `models` for locales it translates, and writes flat locale files.

`ui-languages.json` **manifest** — JSON array of `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, reference `englishName`, `"ltr"` or `"rtl"`). Use `generate-ui-languages` to build a project file from `sourceLocale` + `targetLocales` and the bundled master `data/ui-languages-complete.json`.

<a id="flat-locale-files"></a>
### Flat locale files

Each target locale gets a flat JSON file (`de.json`) mapping source string → translation (no `models` field):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next loads these as resource bundles and looks up translations by the source string (key-as-default model).

<a id="ui-translation-prompts"></a>
### UI Translation prompts

`buildUIPromptMessages` constructs system + user messages that:

- Identify the source and target languages (by display name from `localeDisplayNames` or `ui-languages.json`).
- Send a JSON array of strings and request a JSON array of translations in return.
- Include glossary hints when available.

`LlmClient.translateUIBatch` tries each model in order, falling back on parse or network errors. The CLI builds that list per target locale from `localeModels`, optional `uiModels`, and `translationModels` (see [Providers and models](/guide/providers-and-models#model-fallback-chain)).

---

<a id="documents-internals"></a>
## Documents internals

| Step | Component | Result |
| --- | --- | --- |
| 1 | Markdown / MDX / JSON / `.astro` files (`translate-docs`) | Source files |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` — typed segments with hash + content |
| 3 | `PlaceholderHandler` | Protected text — HTML, admonitions, anchors, MDX, URLs, inline code, emphasis masked as tokens |
| 4 | `splitTranslatableIntoBatches` | `batches[]` — grouped by count + char limit |
| 5 | `TranslationCache` lookup | Cache hit → skip; miss → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | Final text — placeholders restored |
| 7 | `resolveDocumentationOutputPath` | Output file — Docusaurus layout or flat layout |

<a id="extractors"></a>
### Extractors

All extractors extend `BaseExtractor` and implement `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - splits markdown into typed segments: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. YAML frontmatter is classified as **non-translatable** (`slug`, `id`, and other routing keys stay stable). Top-level `export ...` blocks (e.g. React component definitions) are classified as non-translatable `other` segments alongside existing `import ...` handling. Multi-line blocks starting with a capital JSX tag (e.g. a `<Tabs>` block) are classified as translatable paragraphs. Non-translatable segments (code blocks, raw HTML) are preserved verbatim.
- `AstroTemplateExtractor` - parse-and-replace for `.astro` marketing pages (`translate-docs` via `translateAstroFile` in `doc-translate.ts`). Extracts user-facing HTML text nodes and translatable attributes (`alt`, `title`, `aria-label`, `placeholder`), plus string literals inside template `{expression}` blocks when user-facing. Skips frontmatter TypeScript, `<script>`, `<style>`, protected attribute/key values, and literals inside `t('…')`. Reassembly adjusts relative imports when output paths are deeper (e.g. `src/pages/de/index.astro`). See [Astro website pages](../guide/ui-strings/astro-website.md#astro-website-pages-parse-and-replace).
- `JsonExtractor` - extracts string values from Docusaurus JSON label files (Docusaurus UI catalogs, not MDX body).
- `SvgExtractor` - extracts `<text>`, `<title>`, and `<desc>` content from SVG (used by `translate-svg` for files under `config.svg`, not by `translate-docs`).
- `html-i18n-marks.ts` - a focused HTML tag scanner used by `extract` for `.html` / `.htm` sources and by the `mark-html` command. `collectHtmlI18nStrings` / `collectHtmlI18nLocations` read `data-i18n*` marker attributes (bare marker → element `textContent` / `title` / `placeholder`; valued marker → the value), and `markHtmlContent` inserts bare markers into leaf text / title / placeholder elements (idempotent, honours `data-i18n-ignore`, skips code-like and mixed-content elements). The shared `normalizeI18nText` helper keeps build-time keys identical to the browser runtime.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro hybrid sites (UI + page HTML)

Plain Astro apps often enable **both** UI strings and documents in one config (reference: `examples/astro-website/`):

| Layer | Mechanism | Output |
| --- | --- | --- |
| Template HTML | `AstroTemplateExtractor` + `translate-docs` | Per-locale `.astro` under `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | Flat `public/locales/{locale}.json` (English source as key) |

The `sync` command runs enabled steps in order: **extract** then **translate-ui** (when `features.translateUIStrings`) → optional **translate-svg** → **translate-docs** → optional **translate-json** (unless skipped with `--no-ui`, `--no-svg`, `--no-docs`, or `--no-json`). Init template `ui-astro-website` scaffolds UI strings only; add `docs[]` and `features.translateDocs` for page HTML.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Heading anchor insertion (`write-heading-ids` CLI)

The `write-heading-ids` command is a **local, non-LLM** preprocessor for documentation markdown. Implementation: `src/cli/write-heading-ids.ts` orchestrates file discovery; `src/markdown/write-heading-ids-core.ts` parses lines and inserts anchors.

It requires a valid config with **at least one `docs[]` block**. For each block it gathers `.md` / `.mdx` files under `contentPaths`, applies the project's `.translate-ignore` rules (same idea as doc translation), and optionally restricts to a subtree with `--path` / `--file`. Each file is transformed with `applyHeadingAnchorsToMarkdown`: for every **flat ATX heading** (`# …` through `###### …`) outside fenced code blocks, an empty HTML line `<a id="slug"></a>` is inserted on the line above when missing or outdated. Slug algorithms match common ecosystems — `github` (default), `bitbucket`, `gitlab`, `pymdown` (optional Unicode normalisation / percent-encoding flags), `azure-devops` — so anchor IDs stay consistent with existing tooling (doctoc, PyMdown, etc.). `--dry-run` reports would-be edits without writing.

This command does **not** run inside `translate-docs` or `sync`; run it explicitly when you want stable fragment IDs in source files before translation or publishing.

<a id="placeholder-protection"></a>
### Placeholder protection

Before translation, sensitive syntax is replaced with opaque tokens to prevent LLM corruption, applied in this order (restore is the reverse):

1. **HTML tags and comments** (`<strong>`, `<!-- ... -->`, etc.) - lowercase HTML tags from a known allowlist are replaced with ```{{HTM_N}}``` tokens. Capitalised JSX tags (`<Highlight>`, `<Tabs>`, `</Tab>`) are handled separately by the MDX layer (step 4).
2. **Admonition markers** (`:::note`, `:::`) - only the directive prefix on the opening line is replaced with ```{{ADM_OPEN_N}}```; any same-line title is left for the model to translate. Restored with exact original text.
3. **Doc anchors** (HTML `<a id="…">`, Docusaurus heading `{#…}`) - preserved verbatim.
4. **MDX-only constructs** (`src/processors/mdx-placeholders.ts`):
   - **MDX comments** (`{/* … */}`, including Docusaurus heading-id form `{/* #my-id */}`) replaced with ```{{MDX_N}}```.
   - **Capitalised JSX tags** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - preserved as ```{{MDX_N}}``` with translatable string attributes (`label`, `tooltip`, `aria-label`) rewritten to ```{{JXA_N}}``` inside the tag unless the attribute name appears in `docs[].protectAttributes`; `label:` inside `<Tabs values={[ { label: '…' } ]}>` object literals (skippable via `docs[].protectKeys`) and `<TabItem value="…">` (when no `label` attribute exists, skipping lowercase slug-like values) are also extracted. Appended to the segment as `||JXA_N: …||` lines, merged back by `restoreMdx`.
   - **MDX brace expressions** (`{frontMatter.title}`, <code v-pre>style={{…}}</code>) - depth-aware matching, replaced with ```{{MDX_N}}```.
5. **Markdown URLs** (`](url)`, `src="…"`) - restored from a map after translation.
6. **Inline code spans** (`` `code` ``) and **bold-wrapped inline code** (`**`code`**`) - preserved.
7. **Markdown emphasis** (optional, auto-enabled for CJK/RTL locales) - emphasis delimiters masked.

Shared attribute/key protection for Astro templates and MDX JSX is implemented in `src/processors/expression-attribute-protection.ts` and driven per block by `docs[].protectAttributes` and `docs[].protectKeys` (see [protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

SQLite database (via `node:sqlite`) stores rows keyed by `(source_hash, locale)` with `translated_text`, `model`, `filepath`, `last_hit_at`, and related fields. The hash is SHA-256 first 16 hex chars of normalised content (whitespace collapsed).

On each run, segments are looked up by hash × locale. Only cache misses go to the LLM. After translation, `last_hit_at` is reset for segment rows in the current translate scope that were not hit. Successful cache hits during doc translation clear stale `translation_failures` rows for that segment. `cleanup` runs `sync --force-update` first, then removes stale segment rows (null `last_hit_at` / empty filepath), prunes `file_tracking` keys when the resolved source path is missing on disk (`doc-block:…`, `json-block:…`, `svg-files:…`, etc.), removes translation rows whose metadata filepath points at a missing file, prunes orphaned `translation_failures` rows, and prunes orphaned `markdown_source_issues` rows whose resolved source path is missing on disk; it does not back up `cache.db` unless `--backup <path>` is passed, which writes a backup to that path first.

The `translate-docs` command also uses **file tracking** so unchanged sources with existing, up-to-date outputs can skip work entirely. `--force-update` re-runs file processing while still using segment cache; `--force` clears file tracking and bypasses segment cache reads for API translation. When every configured model fails AST validation on a markdown segment, `translate-docs` can progressively split the segment and retry smaller parts (`docs[].segmentSplitting.qualityRetrySplit`, default on). See [Documents — cache behaviour and flags](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags) for the full flag table.

**Batch prompt format:** `translate-docs --prompt-format` selects XML (`<seg>` / `<t>`) or JSON array/object shapes for `LlmClient.translateDocumentBatch` only; extraction, placeholders, and validation are unchanged. See [Batch prompt format](/guide/documents/cli-options#batch-prompt-format).

<a id="output-path-resolution"></a>
### Output path resolution

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` maps a source-relative path to the output path:

- `nested` style (default): `{outputDir}/{locale}/{relPath}` for markdown.
- `doc-system` style: under `docsRoot`, outputs use `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`; paths outside `docsRoot` fall back to the nested layout. Aliases: `docusaurus` (default `localeSubpath` = Docusaurus plugin path), `astro-starlight` (default empty `localeSubpath`), `vitepress` (same as `doc-system` with empty `localeSubpath`; preserves BCP-47 folder casing).
- `flat` style: `{outputDir}/{stem}.{locale}{extension}`. When `flatPreserveRelativeDir` is `true`, source subdirectories are kept under `outputDir`.
- **Custom** `pathTemplate`: any markdown layout using `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Custom** `jsonPathTemplate`: separate custom layout for JSON label files, using the same placeholders.
- `linkRewriteDocsRoot` helps the flat-link rewriter compute correct prefixes when translated output is rooted somewhere other than the default project root.

<a id="flat-link-rewriting"></a>
### Flat link rewriting

When `docsOutput.style === "flat"`, translated markdown files are placed alongside the source with locale suffixes. Relative links between pages are rewritten so that `[Guide](./guide.md)` in `readme.de.md` points to `guide.de.md`. Controlled by `rewriteRelativeLinks` (auto-enabled for flat style without a custom `pathTemplate`). The same pass prepends a per-file depth prefix to non-markdown asset URLs before `postProcessing.regexAdjustments` runs — see [Flat link rewriter](../guide/images-and-screenshots/link-rewriting.md#the-flat-link-rewriter-and-two-step-flow).

---

<a id="json-internals"></a>
## JSON internals

| Step | Component | Result |
| --- | --- | --- |
| 1 | `json[].contentPaths` | Files resolved (file, directory, or glob) |
| 2 | `NestedJsonExtractor` | String leaves selected by `keyPolicy` (dot paths + minimatch) |
| 3 | `PlaceholderHandler` + batch + `TranslationCache` | Cache hit → skip; miss → `LlmClient.translateDocumentBatch` (shared SQLite) |
| 4 | `NestedJsonExtractor.reassemble` | Output file via `expandJsonBlockOutputPath(outputPathTemplate)` |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) walks arbitrary nested JSON and emits one segment per translatable string leaf. `keyPolicy.mode` (`allowlist`, `denylist`, or `both`) filters paths with minimatch on dot notation (bare names like `slug` match the final key segment).
- Cache file tracking uses `json-block:{blockIndex}:{projectRelPath}` in `file_tracking` (same `cacheDir` as docs and SVG).
- **Not** for Docusaurus `write-translations` catalogs (`{ message, description }` shape) — those use Documents (`docs[].docusaurusCatalogDir` + `JsonExtractor` inside `translate-docs`).
- **Not** for `t()` UI strings — UI strings (`strings.json` + flat bundles).
- CLI: `translate-json`; orchestration in `src/cli/translate-json-run.ts`. Init template: `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## Shared infrastructure

<a id="llmclient"></a>
### `LlmClient`

Provider-agnostic chat client built on the Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`). It resolves the active provider from `provider` / `providers`, builds one OpenAI-compatible client (`createOpenAICompatible`) for that provider's `baseUrl` + API key, and routes all calls through `generateText`. `OpenRouterClient` is kept as a deprecated alias. Key behaviours:

- **Model fallback**: tries each model in the resolved list in order; falls back on request or parse failures. Each target locale gets its own resolved chain: `localeModels(locale)` first when configured, then `uiModels` (UI pipelines only), then `translationModels`. Document, JSON, and SVG translation create a per-locale client with the non-UI chain. The `bench-models` command instead builds one single-model client per configured id (union of `translationModels`, `uiModels`, and `localeModels`; `translationModels: [id]`, no fallback) so it can time and price each model independently.
- **Request timeout**: the active provider's `requestTimeoutMs` (default 30 seconds) aborts each request via `AbortSignal.timeout`. The same value applies to `GET /models` when the CLI loads a provider's model list for `check-models` (any provider). The optional pre-flight filter that drops unknown model ids runs only when the active provider is OpenRouter.
- **OpenRouter extras** (only when `openrouter` is active): throughput routing via the `provider` request field, `HTTP-Referer` / `X-Title` headers, and exact USD cost read from `usage.cost`. Token usage is reported for every provider; exact cost only when the provider returns it.
- **Debug traffic log**: if `debugTrafficFilePath` is set, appends request and response JSON to a file.

<a id="config-loading"></a>
### Config loading

`loadI18nConfigFromFile(configPath, cwd)` pipeline:

1. Read and parse `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - deep-merge with `defaultI18nConfigPartial`, and merge any `docs[].sourceFiles` entries into `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - if `targetLocales` is a file path, load the manifest and expand to locale codes; set `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - same for each `docs[].targetLocales` entry.
5. `expandJsonTargetLocalesInRawInput` - same for each `json[].targetLocales` entry.
6. `parseI18nConfig` - Zod validation + `validateI18nBusinessRules`.
7. `applyProviderOverrideToRawInput` - when `-P` / `--provider` is passed on the CLI.
8. `applyEnvOverrides` - apply `OPENROUTER_BASE_URL`, `OLLAMA_BASE_URL`, `I18N_SOURCE_LOCALE`, and `I18N_TARGET_LOCALES` when set (API keys are resolved separately per provider inside `LlmClient`).
9. `augmentConfigWithUiLanguagesMaster` - attach manifest display names from the bundled master catalog.
10. `assertEffectiveLocalesInUiLanguagesMaster` - validate locale codes against the master catalog when applicable.

`init` writes starter configs from `initConfigTemplates`: `ui-markdown` (UI + optional app markdown), `ui-docusaurus`, `ui-starlight`, `ui-vitepress` (VitePress docs + theme JSON via `json[]`), `ui-astro-website` (plain Astro UI; add `docs[]` for `.astro` page translation), `ui-json-bundles` (JSON `json[]` only). See [Quick start — Initialise](/guide/quick-start#step-1-initialise).

<a id="logger"></a>
### Logger

`Logger` supports `debug`, `info`, `warn`, `error` levels with ANSI colour output. Verbose mode (`-v`) enables `debug`. When `logFilePath` is set, log lines are also written to that file.

<a id="self-localization-tool-ui"></a>
### Self-localization (tool UI)

The tool localizes its own UI — CLI help, high-traffic log/summary/error messages, and the Translation Dashboard — separately from the content it translates for you.

- **Locale resolution** (`resolveUiLocale` in `src/core/ui-locale.ts`): picks the UI locale from `-L` / `--ui-lang` > `AI_I18N_LANG` > config `uiLanguage` > host OS locale (`Intl.DateTimeFormat().resolvedOptions().locale`). The candidate is normalized and matched against the shipped bundle set exactly or by closest variation (e.g. `pt-PT` → `pt-BR`, `en-US` → `en-GB`), falling back to the source locale (`en-GB`). The CLI resolves once before help is built (pre-parse argv scan) and again after config load so `uiLanguage` applies (the flag and env var still win).
- **Runtime** (`src/i18n/index.ts`): a minimal `t(source, vars)` with ```{{name}}``` interpolation, keyed by the English source string against flat per-locale bundles in `src/i18n/locales/<code>.json` (copied to `dist/i18n/locales` at build). Missing keys or bundles return the source text. This is the same key-as-default model as UI strings — there is no hash lookup.
- **Dashboard**: the server exposes `GET /api/ui-i18n` returning `{ locale, dir, bundle }` for the resolved UI locale; the frontend sets `<html lang>` / `dir` and localizes static markup via `data-i18n*` attributes.
- **Dogfooding**: the bundles are produced by running the package's own extract → `translate-ui` pipeline against `ai-i18n-self.config.json` (`pnpm i18n:self`). Catalog keys come from `t()` calls across `src/cli/` and `src/i18n/` plus the dashboard's `data-i18n*` markers in `src/dashboard-app/index.html`.

---

<a id="extension-points"></a>
## Extension points

<a id="custom-function-names-ui-extraction"></a>
### Custom function names (UI extraction)

Add non-standard translation function names via config:

```json
{
  "ui": {
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro", ".html"],
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder"]
    }
  }
}
```

(`ui.reactExtractor` is a fully supported alias for `ui.uiExtractor`.)

Add `.html` / `.htm` to `extensions` to scan HTML marker attributes during `extract`. `ui.uiExtractor.htmlI18nAttributes` is optional and defaults to `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]`; `data-i18n` maps to the element `textContent` and `data-i18n-<attr>` maps to that attribute's value (e.g. `data-i18n-aria-label`).

<a id="custom-extractors"></a>
### Custom extractors

Implement `ContentExtractor` from the package:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Register custom extractors by extending the public extractor classes exported from `'ai-i18n-tools'` (for example subclass `MarkdownExtractor`). The CLI wires built-in extractors internally; there is no supported deep import of `doc-translate.ts`.

<a id="custom-output-paths"></a>
### Custom output paths

Use `docsOutput.pathTemplate` for any file layout:

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```

---

<a id="source-tree"></a>
## Source tree

<details>
<summary>Full <code>src/</code> layout (file-level reference)</summary>

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── mark-html.ts                `mark-html` command (insert bare `data-i18n*` markers into HTML)
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── bench-models.ts             `bench-models` command (per-model translate latency/token/cost benchmark)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── ui-locale.ts                Resolve the tool's own UI locale (flag/env/config/OS → shipped bundle)
│   ├── locale-utils.ts             BCP-47 normalisation, locale list parsing, script/Han-variant validation
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── html-i18n-marks.ts          HTML `data-i18n*` marker scanner + `mark-html` annotator
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── i18n/                           Self-localization runtime for the tool's own UI
│   ├── index.ts                    t(source, vars) + bundle/manifest loaders (keyed by English source string)
│   └── locales/                    Shipped UI bundles (de.json, es.json, …; generated by `pnpm i18n:self`)
│
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    ├── table.ts                    Display-width aware table rendering (CJK/emoji column alignment)
    ├── load-dotenv.ts              Auto-load `.env` from the cwd at CLI startup (never overrides existing env)
    └── ignore-parser.ts            .translate-ignore file parser
```

</details>
