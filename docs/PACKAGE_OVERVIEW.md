<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: Package Overview

This document describes the internal architecture of `ai-i18n-tools`, how each component fits together, and how the two core workflows are implemented.

For practical usage instructions, see [GETTING_STARTED.md](./GETTING_STARTED.md). For screenshots and illustrated SVGs in translated docs, see [LOCALE-ASSETS-GUIDE.md](./LOCALE-ASSETS-GUIDE.md).

<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](./PACKAGE_OVERVIEW.md) · [Deutsch](../translated-docs/docs/PACKAGE_OVERVIEW.de.md) · [Español](../translated-docs/docs/PACKAGE_OVERVIEW.es.md) · [Français](../translated-docs/docs/PACKAGE_OVERVIEW.fr.md) · [हिन्दी](../translated-docs/docs/PACKAGE_OVERVIEW.hi.md) · [日本語](../translated-docs/docs/PACKAGE_OVERVIEW.ja.md) · [한국어](../translated-docs/docs/PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](../translated-docs/docs/PACKAGE_OVERVIEW.pt-BR.md) · [中文 (中国大陆)](../translated-docs/docs/PACKAGE_OVERVIEW.zh-CN.md) · [中文 (台灣)](../translated-docs/docs/PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents** 

- [Architecture overview](#architecture-overview)
- [Source tree](#source-tree)
- [Workflow 1 - UI Translation internals](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Flat locale files](#flat-locale-files)
  - [UI Translation prompts](#ui-translation-prompts)
- [Workflow 2 - Document Translation internals](#workflow-2---document-translation-internals)
  - [Extractors](#extractors)
  - [Heading anchor insertion (`write-heading-ids` CLI)](#heading-anchor-insertion-write-heading-ids-cli)
  - [Placeholder protection](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Output path resolution](#output-path-resolution)
  - [Flat link rewriting](#flat-link-rewriting)
- [Shared infrastructure](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Config loading](#config-loading)
  - [Logger](#logger)
- [Runtime helpers API](#runtime-helpers-api)
  - [RTL helpers](#rtl-helpers)
  - [i18next setup factories](#i18next-setup-factories)
  - [Display helpers](#display-helpers)
  - [String helpers](#string-helpers)
- [Programmatic API](#programmatic-api)
- [Extension points](#extension-points)
  - [Custom function names (UI extraction)](#custom-function-names-ui-extraction)
  - [Custom extractors](#custom-extractors)
  - [Custom output paths](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## Architecture overview

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, write-heading-ids, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express app for the Translation Dashboard (cache / glossary)
└── Utils (src/utils/)         - logger, hash, ignore parser
```

Everything that consumers may need programmatically is re-exported from `src/index.ts`.

---

<a id="source-tree"></a>
## Source tree

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
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
│   ├── locale-utils.ts             BCP-47 normalization and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           JSON label file extraction
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
│   └── openrouter.ts               OpenRouter HTTP client with model fallback chain
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
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## Workflow 1 - UI Translation internals

```text
source files (JS/TS, optional `.astro`)
      │
      ▼  UIStringExtractor (i18next-scanner Parser; `.astro` via ui-string-babel.ts)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

<a id="uistringextractor"></a>
### `UIStringExtractor`

Uses `i18next-scanner`'s `Parser.parseFuncFromString` to find `t("literal")` and `i18n.t("literal")` calls in JS/TS files. For `.astro` sources (when listed in `ui.uiExtractor.extensions`), `ui-string-babel.ts` parses frontmatter and template `{expression}` blocks with `@babel/parser` and applies the same `funcNames` rules. Function names and file extensions are configurable via `ui.uiExtractor` (`ui.reactExtractor` is a supported alias). `extract` **also merges non-scanner inputs into the same catalog:** the project `package.json` `description` when `includePackageDescription` is enabled (default), and each `englishName` from `ui-languages.json` when `includeUiLanguageEnglishNames` is `true` and `uiLanguagesPath` is set (strings already found in source keep precedence). Segment hashes are **MD5 first 8 hex chars** of the trimmed source string — these become the keys in `strings.json`.

Plain Astro SSG sites can skip i18next: load flat `{locale}.json` at build time and resolve `t('English')` by source-text key (see `examples/astro-website/src/i18n/t.ts` and [GETTING_STARTED — Astro website](./GETTING_STARTED.md#astro-website)).

<a id="stringsjson"></a>
### `strings.json`

The master catalog has the shape:

```json
{
  "<md5-8>": {
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

`OpenRouterClient.translateUIBatch` tries each model in order, falling back on parse or network errors. The CLI builds that list from `openrouter.translationModels` (or legacy default/fallback); for `translate-ui`, optional `ui.preferredModel` is prepended when set (deduplicated against the rest).

---

<a id="workflow-2---document-translation-internals"></a>
## Workflow 2 - Document Translation internals

```text
markdown / MDX / JSON / `.astro` files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor / AstroTemplateExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── HTML tags, admonitions, anchors, MDX comments/JSX/braces,
                                URLs, inline code, emphasis masked as tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → OpenRouterClient.translateDocumentBatch
      │
      ▼  PlaceholderHandler.restoreAfterTranslation
final text  ──────────────────── placeholders restored
      │
      ▼  resolveDocumentationOutputPath
output file  ─────────────────── Docusaurus layout or flat layout
```

<a id="extractors"></a>
### Extractors

All extractors extend `BaseExtractor` and implement `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - splits markdown into typed segments: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. YAML frontmatter is classified as **non-translatable** (`slug`, `id`, and other routing keys stay stable). Top-level `export ...` blocks (e.g. React component definitions) are classified as non-translatable `other` segments alongside existing `import ...` handling. Multi-line blocks starting with a capital JSX tag (e.g. a `<Tabs>` block) are classified as translatable paragraphs. Non-translatable segments (code blocks, raw HTML) are preserved verbatim.
- `AstroTemplateExtractor` - parse-and-replace for `.astro` marketing pages (`translate-docs` via `translateAstroFile` in `doc-translate.ts`). Extracts user-facing HTML text nodes and translatable attributes (`alt`, `title`, `aria-label`, `placeholder`), plus string literals inside template `{expression}` blocks when user-facing. Skips frontmatter TypeScript, `<script>`, `<style>`, protected attribute/key values, and literals inside `t('…')`. Reassembly adjusts relative imports when output paths are deeper (e.g. `src/pages/de/index.astro`). See [GETTING_STARTED — Astro website pages](./GETTING_STARTED.md#astro-website-parse-and-replace).
- `JsonExtractor` - extracts string values from Docusaurus JSON label files (Docusaurus UI catalogs, not MDX body).
- `SvgExtractor` - extracts `<text>`, `<title>`, and `<desc>` content from SVG (used by `translate-svg` for files under `config.svg`, not by `translate-docs`).

<a id="astro-hybrid-sites"></a>
### Astro hybrid sites (UI + page HTML)

Plain Astro apps often enable **both** workflows in one config (reference: `examples/astro-website/`):

| Layer | Mechanism | Output |
|-------|-----------|--------|
| Template HTML | `AstroTemplateExtractor` + `translate-docs` | Per-locale `.astro` under `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | Flat `public/locales/{locale}.json` (English source as key) |

The `sync` command runs enabled steps in order: **extract** then **translate-ui** (when `features.translateUIStrings`) → optional **translate-svg** → **translate-docs** (unless `--no-docs`, `--no-ui`, or `--no-svg`). Init template `ui-astro-website` scaffolds Workflow 1 only; add `docs[]` and `features.translateDocs` for page HTML.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Heading anchor insertion (`write-heading-ids` CLI)

The `write-heading-ids` command is a **local, non-LLM** preprocessor for documentation markdown. Implementation: `src/cli/write-heading-ids.ts` orchestrates file discovery; `src/markdown/write-heading-ids-core.ts` parses lines and inserts anchors.

It requires a valid config with **at least one `docs[]` block**. For each block it gathers `.md` / `.mdx` files under `contentPaths`, applies the project’s `.translate-ignore` rules (same idea as doc translation), and optionally restricts to a subtree with `--path` / `--file`. Each file is transformed with `applyHeadingAnchorsToMarkdown`: for every **flat ATX heading** (`# …` through `###### …`) outside fenced code blocks, an empty HTML line `<a id="slug"></a>` is inserted on the line above when missing or outdated. Slug algorithms match common ecosystems — `github` (default), `bitbucket`, `gitlab`, `pymdown` (optional Unicode normalisation / percent-encoding flags), `azure-devops` — so anchor IDs stay consistent with existing tooling (doctoc, PyMdown, etc.). `--dry-run` reports would-be edits without writing.

This command does **not** run inside `translate-docs` or `sync`; run it explicitly when you want stable fragment IDs in source files before translation or publishing.

<a id="placeholder-protection"></a>
### Placeholder protection

Before translation, sensitive syntax is replaced with opaque tokens to prevent LLM corruption, applied in this order (restore is the reverse):

1. **HTML tags and comments** (`<strong>`, `<!-- ... -->`, etc.) - lowercase HTML tags from a known allowlist are replaced with `{{HTM_N}}` tokens. Capitalised JSX tags (`<Highlight>`, `<Tabs>`, `</Tab>`) are handled separately by the MDX layer (step 4).
2. **Admonition markers** (`:::note`, `:::`) - only the directive prefix on the opening line is replaced with `{{ADM_OPEN_N}}`; any same-line title is left for the model to translate. Restored with exact original text.
3. **Doc anchors** (HTML `<a id="…">`, Docusaurus heading `{#…}`) - preserved verbatim.
4. **MDX-only constructs** (`src/processors/mdx-placeholders.ts`):
   - **MDX comments** (`{/* … */}`, including Docusaurus heading-id form `{/* #my-id */}`) replaced with `{{MDX_N}}`.
   - **Capitalised JSX tags** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - preserved as `{{MDX_N}}` with translatable string attributes (`label`, `tooltip`, `aria-label`) rewritten to `{{JXA_N}}` inside the tag unless the attribute name appears in `docs[].protectAttributes`; `label:` inside `<Tabs values={[ { label: '…' } ]}>` object literals (skippable via `docs[].protectKeys`) and `<TabItem value="…">` (when no `label` attribute exists, skipping lowercase slug-like values) are also extracted. Appended to the segment as `||JXA_N: …||` lines, merged back by `restoreMdx`.
   - **MDX brace expressions** (`{frontMatter.title}`, `style={{…}}`) - depth-aware matching, replaced with `{{MDX_N}}`.
5. **Markdown URLs** (`](url)`, `src="…"`) - restored from a map after translation.
6. **Inline code spans** (`` `code` ``) and **bold-wrapped inline code** (`**`code`**`) - preserved.
7. **Markdown emphasis** (optional, auto-enabled for CJK/RTL locales) - emphasis delimiters masked.

Shared attribute/key protection for Astro templates and MDX JSX is implemented in `src/processors/expression-attribute-protection.ts` and driven per block by `docs[].protectAttributes` and `docs[].protectKeys` (see [GETTING_STARTED — protectAttributes / protectKeys](./GETTING_STARTED.md#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

SQLite database (via `node:sqlite`) stores rows keyed by `(source_hash, locale)` with `translated_text`, `model`, `filepath`, `last_hit_at`, and related fields. The hash is SHA-256 first 16 hex chars of normalized content (whitespace collapsed).

On each run, segments are looked up by hash × locale. Only cache misses go to the LLM. After translation, `last_hit_at` is reset for segment rows in the current translate scope that were not hit. `cleanup` runs `sync --force-update` first, then removes stale segment rows (null `last_hit_at` / empty filepath), prunes `file_tracking` keys when the resolved source path is missing on disk (`doc-block:…`, `svg-files:…`, etc.), and removes translation rows whose metadata filepath points at a missing file; it backs up `cache.db` first unless `--no-backup` is passed.

The `translate-docs` command also uses **file tracking** so unchanged sources with existing outputs can skip work entirely. `--force-update` re-runs file processing while still using segment cache; `--force` clears file tracking and bypasses segment cache reads for API translation. See [Getting Started](./GETTING_STARTED.md#cache-behaviour-and-translate-docs-flags) for the full flag table.

**Batch prompt format:** `translate-docs --prompt-format` selects XML (`<seg>` / `<t>`) or JSON array/object shapes for `OpenRouterClient.translateDocumentBatch` only; extraction, placeholders, and validation are unchanged. See [Batch prompt format](./GETTING_STARTED.md#batch-prompt-format).

<a id="output-path-resolution"></a>
### Output path resolution

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` maps a source-relative path to the output path:

- `nested` style (default): `{outputDir}/{locale}/{relPath}` for markdown.
- `doc-system` style: under `docsRoot`, outputs use `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`; paths outside `docsRoot` fall back to the nested layout. Aliases: `docusaurus` (default `localeSubpath` = Docusaurus plugin path), `astro-starlight` (default empty `localeSubpath`).
- `flat` style: `{outputDir}/{stem}.{locale}{extension}`. When `flatPreserveRelativeDir` is `true`, source subdirectories are kept under `outputDir`.
- **Custom** `pathTemplate`: any markdown layout using `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Custom** `jsonPathTemplate`: separate custom layout for JSON label files, using the same placeholders.
- `linkRewriteDocsRoot` helps the flat-link rewriter compute correct prefixes when translated output is rooted somewhere other than the default project root.

<a id="flat-link-rewriting"></a>
### Flat link rewriting

When `markdownOutput.style === "flat"`, translated markdown files are placed alongside the source with locale suffixes. Relative links between pages are rewritten so that `[Guide](./guide.md)` in `readme.de.md` points to `guide.de.md`. Controlled by `rewriteRelativeLinks` (auto-enabled for flat style without a custom `pathTemplate`). The same pass prepends a per-file depth prefix to non-markdown asset URLs before `postProcessing.regexAdjustments` runs — see [Locale assets guide](./LOCALE-ASSETS-GUIDE.md#the-flat-link-rewriter-and-two-step-flow).

---

<a id="shared-infrastructure"></a>
## Shared infrastructure

<a id="openrouterclient"></a>
### `OpenRouterClient`

Wraps the OpenRouter chat completions API. Key behaviours:

- **Model fallback**: tries each model in the resolved list in order; falls back on HTTP errors or parse failures. UI translation resolves `ui.preferredModel` first when present, then `openrouter` models.
- **Request timeout**: `openrouter.requestTimeoutMs` (default 30 seconds) aborts each chat-completion request via `AbortSignal.timeout`. The same value applies to `GET /models` when the CLI loads the catalog (for example `check-models` and the optional pre-flight filter that drops unknown model ids).
- **Rate limiting**: detects 429 responses, waits `retry-after` (or 2s), retries once.
- **Debug traffic log**: if `debugTrafficFilePath` is set, appends request and response JSON to a file.

<a id="config-loading"></a>
### Config loading

`loadI18nConfigFromFile(configPath, cwd)` pipeline:

1. Read and parse `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - deep-merge with `defaultI18nConfigPartial`, and merge any `docs[].sourceFiles` entries into `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - if `targetLocales` is a file path, load the manifest and expand to locale codes; set `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - same for each `docs[].targetLocales` entry.
5. `parseI18nConfig` - Zod validation + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - apply `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - attach manifest display names.

`init` writes starter configs from `initConfigTemplates`: `ui-markdown` (UI + optional app markdown), `ui-docusaurus`, `ui-starlight`, `ui-astro-website` (plain Astro UI; add `docs[]` for `.astro` page translation). See [GETTING_STARTED — Initialise](./GETTING_STARTED.md#step-1-initialise).

<a id="logger"></a>
### Logger

`Logger` supports `debug`, `info`, `warn`, `error` levels with ANSI colour output. Verbose mode (`-v`) enables `debug`. When `logFilePath` is set, log lines are also written to that file.

---

<a id="runtime-helpers-api"></a>
## Runtime helpers API

These are exported from `'ai-i18n-tools/runtime'` and work in any JavaScript environment (browser, Node.js, Deno, Edge). They do **not** import from `i18next` or `react-i18next`.

<a id="rtl-helpers"></a>
### RTL helpers

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next setup factories

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

Use `setupKeyAsDefaultT` as the usual app entry point (key-trim + plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Calling `wrapI18nWithKeyTrim` alone is **deprecated** for application wiring.

Build `localeLoaders` with `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` so keys stay aligned with `targetLocales` after `generate-ui-languages`. See `docs/GETTING_STARTED.md` (runtime wiring), `examples/nextjs-app/`, `examples/console-app/`, and `examples/astro-website/` (custom `makeT` without i18next).

<a id="display-helpers"></a>
### Display helpers

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### String helpers

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## Programmatic API

All public types and classes are exported from the package root. Example: running the translate-UI step from Node.js without the CLI:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Key exports:

| Export | Description |
|---|---|
| `loadI18nConfigFromFile` | Load, merge, validate config from a JSON file. |
| `parseI18nConfig` | Validate a raw config object. |
| `TranslationCache` | SQLite cache - instantiate with a `cacheDir` path. |
| `UIStringExtractor` | Extract `t("…")` strings from JS/TS source. |
| `MarkdownExtractor` | Extract translatable segments from markdown. |
| `JsonExtractor` | Extract from Docusaurus JSON label files (UI catalogs, not MDX body). |
| `SvgExtractor` | Extract from SVG files. |
| `OpenRouterClient` | Make translation requests to OpenRouter. |
| `PlaceholderHandler` | Protect/restore markdown syntax around translation (HTML tags, admonitions, anchors, MDX comments/JSX/braces, URLs, inline code, emphasis). |
| `protectMdx` / `restoreMdx` | Protect/restore MDX comments, JSX tags, brace expressions, and JSX string attributes (called by `PlaceholderHandler`; also exported for direct use). |
| `splitTranslatableIntoBatches` | Group segments into LLM-sized batches. |
| `validateTranslation` | Structural checks after translation. |
| `resolveDocumentationOutputPath` | Resolve output file path for a translated document. |
| `Glossary` / `GlossaryMatcher` | Load and apply translation glossaries. |
| `runTranslateUI` | Programmatic translate-UI entry point. |

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
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro"]
    }
  }
}
```

(`ui.reactExtractor` is a fully supported alias for `ui.uiExtractor`.)

<a id="custom-extractors"></a>
### Custom extractors

Implement `ContentExtractor` from the package:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Pass it to the doc-translate pipeline by importing `doc-translate.ts` utilities programmatically.

<a id="custom-output-paths"></a>
### Custom output paths

Use `markdownOutput.pathTemplate` for any file layout:

```json
{
  "documentations": [
    {
      "markdownOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
