# ai-i18n-tools: Package Overview

This document describes the internal architecture of `ai-i18n-tools`, how each component fits together, and how the two core workflows are implemented.

For practical usage instructions, see [Getting Started](./getting-started.md).

<small>**Read in other languages:** </small>
<small id="lang-list">[en-GB](./PACKAGE_OVERVIEW.md) · [de](../translated-docs/docs/PACKAGE_OVERVIEW.de.md) · [es](../translated-docs/docs/PACKAGE_OVERVIEW.es.md) · [fr](../translated-docs/docs/PACKAGE_OVERVIEW.fr.md) · [hi](../translated-docs/docs/PACKAGE_OVERVIEW.hi.md) · [ja](../translated-docs/docs/PACKAGE_OVERVIEW.ja.md) · [ko](../translated-docs/docs/PACKAGE_OVERVIEW.ko.md) · [pt-BR](../translated-docs/docs/PACKAGE_OVERVIEW.pt-BR.md) · [zh-CN](../translated-docs/docs/PACKAGE_OVERVIEW.zh-CN.md) · [zh-TW](../translated-docs/docs/PACKAGE_OVERVIEW.zh-TW.md)</small>

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

## Architecture overview {#architecture-overview}

```
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

Everything that consumers may need programmatically is re-exported from `src/index.ts`.

---

## Source tree {#source-tree}

```
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
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
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner)
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── json-extractor.ts           JSON label file extraction
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: admonitions → anchors → URLs
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
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
├── server/
│   └── translation-editor.ts       Express app for cache / strings.json / glossary editor
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

## Workflow 1 - UI Translation internals {#workflow-1---ui-translation-internals}

```
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

### `UIStringExtractor` {#uistringextractor}

Uses `i18next-scanner`'s `Parser.parseFuncFromString` to find `t("literal")` and `i18n.t("literal")` calls in any JS/TS file. Function names and file extensions are configurable, and extraction can also include the project `package.json` `description` when `reactExtractor.includePackageDescription` is enabled. Segment hashes are **MD5 first 8 hex chars** of the trimmed source string - these become the keys in `strings.json`.

### `strings.json` {#stringsjson}

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

`models` (optional) — per locale, which model produced that translation after the last successful `translate-ui` run for that locale (or `user-edited` if the text was saved from the `editor` web UI). `locations` (optional) — where `extract` found the string.

`extract` adds new keys and preserves existing `translated` / `models` data for keys still present in the scan. `translate-ui` fills missing `translated` entries, updates `models` for locales it translates, and writes flat locale files.

### Flat locale files {#flat-locale-files}

Each target locale gets a flat JSON file (`de.json`) mapping source string → translation (no `models` field):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next loads these as resource bundles and looks up translations by the source string (key-as-default model).

### UI Translation prompts {#ui-translation-prompts}

`buildUIPromptMessages` constructs system + user messages that:
- Identify the source and target languages (by display name from `localeDisplayNames` or `ui-languages.json`).
- Send a JSON array of strings and request a JSON array of translations in return.
- Include glossary hints when available.

`OpenRouterClient.translateUIBatch` tries each model in order, falling back on parse or network errors. The CLI builds that list from `openrouter.translationModels` (or legacy default/fallback); for `translate-ui`, optional `ui.preferredModel` is prepended when set (deduplicated against the rest).

---

## Workflow 2 - Document Translation internals {#workflow-2---document-translation-internals}

```
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── URLs, admonitions, anchors replaced with tokens
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

### Extractors {#extractors}

All extractors extend `BaseExtractor` and implement `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` - splits markdown into typed segments: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Non-translatable segments (code blocks, raw HTML) are preserved verbatim.
- `JsonExtractor` - extracts string values from Docusaurus JSON label files.
- `SvgExtractor` - extracts `<text>`, `<title>`, and `<desc>` content from SVG (used by `translate-svg` for assets under `config.svg`, not by `translate-docs`).

### Placeholder protection {#placeholder-protection}

Before translation, sensitive syntax is replaced with opaque tokens to prevent LLM corruption:

1. **Admonition markers** (`:::note`, `:::`) - restored with exact original text.
2. **Doc anchors** (HTML `<a id="…">`, Docusaurus heading `{#…}`) - preserved verbatim.
3. **Markdown URLs** (`](url)`, `src="…"`) - restored from a map after translation.

### Cache (`TranslationCache`) {#cache-translationcache}

SQLite database (via `node:sqlite`) stores rows keyed by `(source_hash, locale)` with `translated_text`, `model`, `filepath`, `last_hit_at`, and related fields. The hash is SHA-256 first 16 hex chars of normalized content (whitespace collapsed).

On each run, segments are looked up by hash × locale. Only cache misses go to the LLM. After translation, `last_hit_at` is reset for segment rows in the current translate scope that were not hit. `cleanup` runs `sync --force-update` first, then removes stale segment rows (null `last_hit_at` / empty filepath), prunes `file_tracking` keys when the resolved source path is missing on disk (`doc-block:…`, `svg-assets:…`, etc.), and removes translation rows whose metadata filepath points at a missing file; it backs up `cache.db` first unless `--no-backup` is passed.

The `translate-docs` command also uses **file tracking** so unchanged sources with existing outputs can skip work entirely. `--force-update` re-runs file processing while still using segment cache; `--force` clears file tracking and bypasses segment cache reads for API translation. See [Getting Started](./getting-started.md#cache-behaviour-and-translate-docs-flags) for the full flag table.

**Batch prompt format:** `translate-docs --prompt-format` selects XML (`<seg>` / `<t>`) or JSON array/object shapes for `OpenRouterClient.translateDocumentBatch` only; extraction, placeholders, and validation are unchanged. See [Batch prompt format](./getting-started.md#batch-prompt-format).

### Output path resolution {#output-path-resolution}

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` maps a source-relative path to the output path:

- `nested` style (default): `{outputDir}/{locale}/{relPath}` for markdown.
- `docusaurus` style: under `docsRoot`, outputs use `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; paths outside `docsRoot` fall back to the nested layout.
- `flat` style: `{outputDir}/{stem}.{locale}{extension}`. When `flatPreserveRelativeDir` is `true`, source subdirectories are kept under `outputDir`.
- **Custom** `pathTemplate`: any markdown layout using `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Custom** `jsonPathTemplate`: separate custom layout for JSON label files, using the same placeholders.
- `linkRewriteDocsRoot` helps the flat-link rewriter compute correct prefixes when translated output is rooted somewhere other than the default project root.

### Flat link rewriting {#flat-link-rewriting}

When `markdownOutput.style === "flat"`, translated markdown files are placed alongside the source with locale suffixes. Relative links between pages are rewritten so that `[Guide](./guide.md)` in `readme.de.md` points to `guide.de.md`. Controlled by `rewriteRelativeLinks` (auto-enabled for flat style without a custom `pathTemplate`).

---

## Shared infrastructure {#shared-infrastructure}

### `OpenRouterClient` {#openrouterclient}

Wraps the OpenRouter chat completions API. Key behaviours:

- **Model fallback**: tries each model in the resolved list in order; falls back on HTTP errors or parse failures. UI translation resolves `ui.preferredModel` first when present, then `openrouter` models.
- **Rate limiting**: detects 429 responses, waits `retry-after` (or 2s), retries once.
- **Prompt caching**: system message is sent with `cache_control: { type: "ephemeral" }` to enable prompt caching on supported models.
- **Debug traffic log**: if `debugTrafficFilePath` is set, appends request and response JSON to a file.

### Config loading {#config-loading}

`loadI18nConfigFromFile(configPath, cwd)` pipeline:

1. Read and parse `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - deep-merge with `defaultI18nConfigPartial`, and merge any `documentations[].sourceFiles` entries into `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - if `targetLocales` is a file path, load the manifest and expand to locale codes; set `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - same for each `documentations[].targetLocales` entry.
5. `parseI18nConfig` - Zod validation + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - apply `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` - attach manifest display names.

### Logger {#logger}

`Logger` supports `debug`, `info`, `warn`, `error` levels with ANSI colour output. Verbose mode (`-v`) enables `debug`. When `logFilePath` is set, log lines are also written to that file.

---

## Runtime helpers API {#runtime-helpers-api}

These are exported from `'ai-i18n-tools/runtime'` and work in any JavaScript environment (browser, Node.js, Deno, Edge). They do **not** import from `i18next` or `react-i18next`.

### RTL helpers {#rtl-helpers}

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### i18next setup factories {#i18next-setup-factories}

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### Display helpers {#display-helpers}

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### String helpers {#string-helpers}

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## Programmatic API {#programmatic-api}

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
| `JsonExtractor` | Extract from Docusaurus JSON label files. |
| `SvgExtractor` | Extract from SVG files. |
| `OpenRouterClient` | Make translation requests to OpenRouter. |
| `PlaceholderHandler` | Protect/restore markdown syntax around translation. |
| `splitTranslatableIntoBatches` | Group segments into LLM-sized batches. |
| `validateTranslation` | Structural checks after translation. |
| `resolveDocumentationOutputPath` | Resolve output file path for a translated document. |
| `Glossary` / `GlossaryMatcher` | Load and apply translation glossaries. |
| `runTranslateUI` | Programmatic translate-UI entry point. |

---

## Extension points {#extension-points}

### Custom function names (UI extraction) {#custom-function-names-ui-extraction}

Add non-standard translation function names via config:

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### Custom extractors {#custom-extractors}

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

### Custom output paths {#custom-output-paths}

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
