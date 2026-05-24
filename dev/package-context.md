# ai-i18n-tools: maintainer / package context

**Audience:** Contributors and AI agents working inside the `ai-i18n-tools` **repository**. This file lives in `dev/` and is **not** the primary integration guide for downstream apps.

**Consumers:** If you are adding the **published npm package** to another project, use [`docs/ai-i18n-tools-context.md`](../docs/ai-i18n-tools-context.md) (shipped on npm under `docs/`), [`docs/GETTING_STARTED.md`](../docs/GETTING_STARTED.md), and [`docs/LOCALE-ASSETS-GUIDE.md`](../docs/LOCALE-ASSETS-GUIDE.md) for locale-specific screenshots and SVG assets.

This document gives the mental model, key decisions, and patterns needed to work effectively on this codebase. Read it before making code or config changes.

<!-- DOCTOC SKIP -->

---

## What this package does

`ai-i18n-tools` is a CLI + library that automates internationalization for JavaScript/TypeScript projects. It:

1. **Extracts** UI strings into a master catalog: `t("…")` / `i18n.t("…")` literals (configurable), optionally `package.json` `description`, and optionally each `englishName` from `ui-languages.json` when `ui.reactExtractor.includeUiLanguageEnglishNames` is true.
2. **Translates** that catalog and documentation files via LLMs (through OpenRouter).
3. **Writes** locale-ready JSON files for i18next, translated markdown/MDX/`.astro` pages, Docusaurus catalog JSON, arbitrary nested locale JSON bundles, and SVG files.
4. **Exports runtime helpers** for wiring i18next, RTL support, and language selection in any JS environment.

Everything is driven by a single config file: `ai-i18n-tools.config.json`.

---

## Three composable workflows

| | Workflow 1 — UI strings | Workflow 2 — Documents | Workflow 3 — Nested JSON |
|---|---|---|---|
| **Input** | JS/TS (and optionally `.astro`) sources: `t("…")` / `i18n.t("…")` | `.md`, `.mdx`, `.astro` under `docs[].contentPaths`; optional Docusaurus catalog dir | Nested `.json` under `json[].contentPaths` (file, directory, or glob) |
| **Output** | `strings.json` (catalog) + flat per-locale JSON (`de.json`, …) | Translated pages + optional Docusaurus shell JSON at `docs[].outputDir` / `jsonPathTemplate` | Per-block `outputPathTemplate` (e.g. `src/i18n/{locale}/translation.json`) |
| **Cache** | `strings.json` (`translated` preserved on re-extract) | SQLite (`cacheDir`) — segment + file tracking | Same SQLite cache; keys `json-block:{index}:{relPath}` |
| **Key command** | `translate-ui` (runs `extract` first) | `translate-docs` | `translate-json` |
| **Feature flag** | `translateUIStrings` | `translateDocs` (+ `docs[].docusaurusCatalogDir` for shell JSON) | `translateJson` |

**Decision tree (agents):** `t()` in source → Workflow 1. Localized pages or Docusaurus `write-translations` catalog → Workflow 2. Standalone nested locale JSON only (e.g. ZenBrowser `src/i18n/en/translation.json`) → Workflow 3 — not `docs[]`.

**`sync` order** (unless skipped): when `translateUIStrings` → `extract` then `translate-ui` (`--no-ui`); when `translateSVG` + `svg` → `translate-svg` (`--no-svg`); when `translateDocs` or any `docs[].docusaurusCatalogDir` → `translate-docs` (`--no-docs`); when `translateJson` + `json[]` → `translate-json` (`--no-json`). There is no separate `extractUIStrings` or `translateJSON` feature flag anymore.

**Legacy config** (load + one-time rewrite when writable): `documentations` → `docs`, `translateMarkdown` → `translateDocs`, `jsonSource` → `docusaurusCatalogDir`, `markdownOutput` → `docsOutput`; `extractUIStrings` and `translateJSON` are stripped. See `src/core/config-migrate.ts`.

---

## Config file quick reference

File: `ai-i18n-tools.config.json` (default location - override with `-c <path>`)

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",

  "openrouter": {
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
    ],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateJson": false,
    "translateSVG": true
  },

  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/",
    "preferredModel": "anthropic/claude-3.5-haiku",
    "reactExtractor": {
      "funcNames": ["t", "i18n.t"],
      "extensions": [".js", ".jsx", ".ts", ".tsx"],
      "includePackageDescription": true,
      "includeUiLanguageEnglishNames": false
    }
  },

  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr"],
      "docusaurusCatalogDir": "i18n/en",
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs"
      }
    }
  ],

  "json": [
    {
      "description": "Optional nested UI JSON (Workflow 3)",
      "contentPaths": "src/i18n/en/translation.json",
      "outputPathTemplate": "src/i18n/{locale}/translation.json",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url"],
        "translateKeys": []
      }
    }
  ],

  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  },

  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

### Key constraints

- `sourceLocale` **must exactly match** the `SOURCE_LOCALE` constant exported from the runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` can be a string path to a `ui-languages.json` manifest OR an array of BCP-47 codes.
- `uiLanguagesPath` is optional, but useful when `targetLocales` is an explicit array and you still want manifest-driven labels and locale filtering.
- `docs[].description` is optional text for maintainers; it appears in `translate-docs` / `status` headers.
- `docs[].contentPaths` is a string or array; each entry is a file, directory, or glob (minimatch). Same resolution pattern as `json[].contentPaths`.
- `docs[].docusaurusCatalogDir` — directory from `docusaurus write-translations` (e.g. `docs-site/i18n/en`). When set and `translateDocs` is true, catalog JSON is translated during `translate-docs` (no separate JSON feature flag).
- `docs[].targetLocales` limits that block; effective doc locales are the **union** across blocks.
- `docs[].docsOutput` — output layout for translated pages (was `markdownOutput`): `style`, `pathTemplate`, `postProcessing`, etc.
- `docs[].protectAttributes` / `protectKeys` extend skip lists for `.astro` and MDX (see `docs/GETTING_STARTED.md`).
- `json[]` — Workflow 3 only. Each block needs `contentPaths` and `outputPathTemplate`; optional `keyPolicy` (`allowlist` | `denylist` | `both`, minimatch on dot paths). Do not put Docusaurus catalog JSON here — use `docs[].docusaurusCatalogDir`.
- All paths are relative to cwd (where the CLI is invoked).
- `OPENROUTER_API_KEY` must be set in the environment or a `.env` file.

---

## The `ui-languages.json` manifest

When `targetLocales` is a file path, that file must be a JSON array of this shape:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",       "englishName": "German", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",        "englishName": "Arabic", "direction": "rtl" }
]
```

- `code` — BCP-47 locale tag (file names, i18next).
- `label` — name shown in the UI (often the endonym / native language name).
- `englishName` — English (or reference) name for prompts, `t(englishName)` in language menus, and pairing with `label`.
- `direction` — `"ltr"` or `"rtl"` (layout / `dir` for that row).

This file drives translation targets, prompts, and the runtime language-switcher. `extract` does not add `englishName` strings to `strings.json` **unless** `ui.reactExtractor.includeUiLanguageEnglishNames` is `true` (then each non-duplicate `englishName` is merged with the same MD5-8 hash scheme as scanned literals). Regenerate or hand-edit the manifest with `generate-ui-languages` (see cheat sheet).

**Bundled master list:** `data/ui-languages-complete.json` (IANA-derived; rebuild with `pnpm run build:ui-languages-master`).

---

## CLI commands cheat sheet

```text
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles]
    Starter config. ui-json-bundles = Workflow 3 (nested JSON only).

npx ai-i18n-tools extract
    Scan source for t("…") / i18n.t("…") into strings.json (requires non-empty ui.sourceRoots).
    Also runs automatically before translate-ui / sync-ui / sync when translateUIStrings is enabled.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]
    Build ui-languages.json from sourceLocale + targetLocales using the master catalog (default: bundled data/ui-languages-complete.json).
    Requires uiLanguagesPath in config. Warns and uses TODO placeholders for locales missing from the master file.

npx ai-i18n-tools translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.
    --force: re-translate all entries per locale. --dry-run: no writes, no API calls. -j: max parallel locales.

npx ai-i18n-tools translate-json [--locale <code>] …
    Translate arbitrary nested JSON per json[] (requires features.translateJson). NestedJsonExtractor + keyPolicy.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate md/mdx/astro under docs[]; Docusaurus catalog JSON when docs[].docusaurusCatalogDir is set.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    --prompt-format xml|json-array|json-object: batch wire format to the model (default json-array); does not change validation or cache.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
    Scan documentation markdown/MDX for unpaired emphasis delimiters and unclosed inline code (no API).
    stderr: path:line: [CODE] message; exit 1 if any issue. Refreshes markdown_source_issues in cache unless --no-cache.

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
     SVG files from config.svg. Requires features.translateSVG. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]
    extract then translate-ui (requires translateUIStrings). UI-only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-json] [--no-docs] …
    UI (extract+translate-ui), optional translate-svg, optional translate-json, optional translate-docs.
    --force / --force-update apply to the docs step only.

npx ai-i18n-tools status
    UI strings (if translateUIStrings), markdown per docs[] block, json[] per block when translateJson is enabled.

npx ai-i18n-tools dashboard
    Launch the Translation Dashboard (local web UI for cache segments, strings.json, glossary, failures, and statistics).

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
    Runs sync --force-update first, then maintains the SQLite cache: stale segment rows; orphaned file_tracking keys (doc-block:, svg-files:, …);
    orphaned translation rows whose filepath metadata points at a missing file.
    Backs up cache.db under the cache dir before modifications unless --no-backup.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Global flags: `-c <config>` (config path), `-v` (verbose/debug output), `-w` / `--write-logs [path]` (tee console output to a log file; default path: under `cacheDir`).

---

## Workflow 1 - UI strings: how data flows

```text
source files (JS/TS) ──► i18next-scanner: t("literal"), i18n.t("literal")
optional package.json "description" (includePackageDescription)
optional ui-languages.json englishName per row (includeUiLanguageEnglishNames + uiLanguagesPath)
    ▼
strings.json  - master catalog
    {
      "<md5-8-hex>": {
        "source": "The English string",
        "translated": { "de": "Der deutsche Text", "pt-BR": "O texto em português" },
        "models": { "de": "…", "pt-BR": "…" }
      }
    }
    │  translate-ui reads this, sends batches to OpenRouter, fills missing locales and records model ids per locale
    ▼
src/locales/de.json    - flat map: source string → translation
    { "The English string": "Der deutsche Text", "Save": "Speichern" }
src/locales/pt-BR.json
    ...
```

**Only literal strings are extractable.** Variables, expressions, or template literals as the key are not found:

```js
t('Save')                   // ✓ extracted
t('Hello {{name}}', {name}) // ✓ extracted as "Hello {{name}}"
t(labelVar)                 // ✗ not extracted - variable key
t(`Hello ${name}`)          // ✗ not extracted - template literal
```

i18next uses the key-as-default model: missing translations fall back to the key itself (the English source string). The `parseMissingKeyHandler` in `defaultI18nInitOptions` handles this.

---

## Workflow 2 - Document translation: how data flows

```text
source files (md/mdx/json)
    │  Extractor produces typed segments with SHA-256 hash
    ▼
PlaceholderHandler  - replaces URLs, admonitions, anchors with opaque tokens
    ▼
TranslationCache lookup (SQLite)
    │  cache hit → use stored translation
    │  cache miss → send batch to OpenRouter
    ▼
PlaceholderHandler.restore  - tokens replaced back with original syntax
    ▼
resolveDocumentationOutputPath  → write to output file
```

**Cache key**: SHA-256 first 16 hex chars of whitespace-normalized segment content × locale. The cache lives under root `cacheDir` (`cache.db`), shared across `docs[]` blocks. File tracking: `doc-block:{index}:{relPath}` for pages; Docusaurus JSON rows use cwd-relative paths under `docusaurusCatalogDir`. Each row stores the `model` that last translated the segment; `dashboard` edits set `model` to `user-edited`.

**`markdown_source_issues` (schema ≥ 4):** pre-translation static findings per documentation cache filepath (`doc-block:{i}:{relPath}` keys, same as `translations.filepath` for markdown). `check-markdown` and `translate-docs` (when `warnMarkdownSourceIssues` is not `false`) call `TranslationCache.replaceMarkdownIssuesForFilepath` to delete-then-insert all rows for that filepath. `deleteTranslationsByFilepath` and filtered bulk deletes remove markdown issue rows when the last translation row for that filepath is gone. Editor tab **Markdown issues** reads `GET /api/markdown-source-issues` (+ summary / issue-code list). Processor: `src/processors/markdown-source-diagnostics.ts` (includes `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK` for `**`/`__` wrapping `` `code` `` or `[text](url)`); pairing primitives exported from `emphasis-placeholders.ts` (`collectMarkdownDelimiterRuns`, `pairMarkdownEmphasisDelimitersFromRuns`, …).

**CLI**: `--force-update` bypasses only the *file-level* skip (rebuild outputs) while still using segment cache. `--force` clears per-file tracking and skips segment cache reads for API calls. See the getting started guide for the full flag table.

**SVG files**: `translate-svg` when `features.translateSVG` and top-level `svg` are set.

**Docusaurus shell JSON**: `JsonExtractor` during `translate-docs` when `docs[].docusaurusCatalogDir` is set (`{ message, description }` shape). Not Workflow 3.

**Output styles** (`docsOutput.style`):

| Style | Example |
|---|---|
| `"nested"` (default) | `docs/guide.md` → `i18n/de/docs/guide.md` |
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| custom `pathTemplate` | any layout using `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` |

Flat-style output auto-rewrites relative links between pages (e.g. `[Guide](./guide.md)` → `guide.de.md`).

---

## Workflow 3 - Nested JSON: how data flows

```text
json[].contentPaths  →  resolveContentPathEntries (file | dir | glob)
    ▼
NestedJsonExtractor  - walk tree; string leaves matching keyPolicy (minimatch on dot paths)
    ▼
Same batch/cache/glossary pipeline as docs (segment hash includes path + value)
    ▼
expandJsonBlockOutputPath(outputPathTemplate)  →  write per locale
```

- **Not** for Docusaurus catalog files — those stay on Workflow 2 (`docusaurusCatalogDir`).
- **Not** for `t()` UI strings — Workflow 1 (`strings.json` + flat bundles).
- Reference design notes: `dev/future-i18n-json-arbitrary.md`.

---

## Runtime integration - wiring i18next

The package exports helpers from `'ai-i18n-tools/runtime'` that remove boilerplate. The minimal setup:

```ts
// src/i18n.ts  - import this at the top of your entry point
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json exactly
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// Dynamic imports for non-source locales
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

**Loading a locale on demand** (e.g. when user switches language):

```ts
await loadLocale(code);
i18n.changeLanguage(code);
```

`loadLocale` is a no-op for the source locale - it only fetches non-source locales.

---

## Runtime helpers reference

All exported from `'ai-i18n-tools/runtime'`. Work in any JS environment (browser, Node.js, Edge, Deno). No i18next peer dependency required.

| Export | Signature | Purpose |
|---|---|---|
| `defaultI18nInitOptions` | `(sourceLocale?: string) => i18nextInitOptions` | Standard i18next init for key-as-default setup |
| `setupKeyAsDefaultT` | `(i18n, options: SetupKeyAsDefaultTOptions) => void` | Recommended: key-trim + optional `{sourceLocale}.json` plural bundle + plural **`wrapT`** from **`strings.json`** |
| `wrapI18nWithKeyTrim` | `(i18n: I18nLike) => void` | Lower-level key-trim only (deprecated for app wiring; prefer **`setupKeyAsDefaultT`**) |
| `makeLocaleLoadersFromManifest` | `(manifest, sourceLocale, makeLoaderForLocale) => loaders` | Build **`makeLoadLocale`** loader map from **`ui-languages.json`** (omit **`sourceLocale`**) |
| `makeLoadLocale` | `(i18n, loaders, sourceLocale?) => (lang: string) => Promise<void>` | Factory for async locale loading |
| `getTextDirection` | `(lng: string) => 'ltr' \| 'rtl'` | RTL detection by BCP-47 code |
| `applyDirection` | `(lng: string, element?: Element) => void` | Set `dir` on `document.documentElement` (no-op in Node.js) |
| `getUILanguageLabel` | `(lang: UiLanguageEntry, t: TranslateFn) => string` | Translated label for settings-page dropdowns |
| `getUILanguageLabelNative` | `(lang: UiLanguageEntry) => string` | Native label for header menus (no `t()` call) |
| `interpolateTemplate` | `(str: string, vars: Record<string, string \| number \| boolean>) => string` | Low-level `{{var}}` substitution on a plain string (used internally by `wrapI18nWithKeyTrim`; rarely needed in app code) |
| `flipUiArrowsForRtl` | `(text, isRtl: boolean) => string` | Flip `→` to `←` for RTL layouts |
| `RTL_LANGS` | `ReadonlySet<string>` | Set of BCP-47 codes treated as RTL |

---

## Programmatic API

Import from `'ai-i18n-tools'`. Useful when you need to call translation steps from a build script or CI pipeline.

```ts
import {
  loadI18nConfigFromFile,
  runTranslateUI,
} from 'ai-i18n-tools';

const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');
const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
// summary.stringsUpdated - number of newly translated strings
// summary.localesTouched - locale codes processed
```

Other useful exports for custom pipelines:

| Export                               | Use when                                               |
|--------------------------------------|--------------------------------------------------------|
| `loadI18nConfigFromFile(path, cwd?)` | Load and validate the config                           |
| `parseI18nConfig(rawObject)`         | Validate a config object you built in code             |
| `TranslationCache`                   | Direct SQLite cache access                             |
| `UIStringExtractor`                  | Extract `t("…")` calls from JS/TS files                |
| `MarkdownExtractor`                  | Parse markdown into translatable segments              |
| `JsonExtractor`                      | Docusaurus catalog JSON (`{ message, description }`)   |
| `NestedJsonExtractor`                | Arbitrary nested JSON (`json[]` / `translate-json`)    |
| `SvgExtractor`                       | Parse SVG text elements                                |
| `OpenRouterClient`                   | Make translation requests directly                     |
| `PlaceholderHandler`                 | Protect/restore markdown syntax around translation     |
| `splitTranslatableIntoBatches`       | Group segments into LLM-sized batches                  |
| `validateTranslation`                | Structural checks after a translation call             |
| `resolveDocumentationOutputPath`     | Compute the output file path for a translated document |
| `Glossary` / `GlossaryMatcher`       | Load and apply a translation glossary                  |

---

## Glossary

The glossary ensures consistent terminology across translations.

- **Auto-built glossary** (`glossary.uiGlossary`): reads `strings.json` and uses existing translations as a hint source. No CSV needed.
- **User glossary** (`glossary.userGlossary`): a CSV file with columns `Original language string`, `locale`, `Translation` (or `en`, `locale`, `Translation`). Generate an empty template with `npx ai-i18n-tools glossary-generate`.

Glossary hints are injected into the LLM system prompt - they are suggestions, not hard replacements.

---

## Extension points

### Custom function names

```json
{ "ui": { "reactExtractor": { "funcNames": ["t", "i18n.t", "translate"] } } }
```

### Custom extractor

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* return typed segments */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* rebuild file */ }
}
```

### Custom output path

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

Available placeholders: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

---

## Common tasks and what to do

| Task | What to run / change |
|---|---|
| Add a new locale | Add it to `ui-languages.json` (or `targetLocales` array), then run `translate-docs` / `translate-ui` / `sync` |
| Translate only one locale | `npx ai-i18n-tools translate-docs --locale de` (or `translate-ui`, `sync`) |
| Add a new UI string | Write `t('My new string')` in source, then `translate-ui` or `sync-ui` (extract runs first) |
| Translate nested locale JSON | Configure `json[]` + `translateJson`, run `translate-json` or `sync` |
| Update a translation manually | Edit `strings.json` directly (`translated`), or use `dashboard` (sets `models[locale]` to `user-edited`). `translate-ui` skips locales that already have text unless you use `--force` |
| Translate new/updated docs only | Run `translate-docs` - file + segment cache skips unchanged work automatically |
| Rebuild doc outputs without re-calling the API for unchanged segments | `npx ai-i18n-tools sync  --force-update` |
| Full doc re-translation (ignore segment cache) | `npx ai-i18n-tools translate-docs --force` |
| Free up cache space | `npx ai-i18n-tools cleanup` or `translate-docs --clear-cache` |
| Inspect what is untranslated | `npx ai-i18n-tools status` |
| Change the translation model | Edit `openrouter.translationModels` (first is primary, rest are fallbacks). For **UI only**, optional `ui.preferredModel` is tried before that list. |
| Wire i18next in a new project | See [Runtime integration](#runtime-integration---wiring-i18next) above |
| Translate docs to fewer locales than UI | Set `docs[].targetLocales` on the relevant block(s), or use a smaller union |
| Run UI + SVG + JSON + docs in one command | `npx ai-i18n-tools sync` — skip stages with `--no-ui`, `--no-svg`, `--no-json`, `--no-docs` |

---

## Environment variables

| Variable | Effect |
|---|---|
| `OPENROUTER_API_KEY` | **Required.** Your OpenRouter API key. |
| `OPENROUTER_BASE_URL` | Override the API base URL. |
| `I18N_SOURCE_LOCALE` | Override `sourceLocale` at runtime. |
| `I18N_TARGET_LOCALES` | Comma-separated locale codes to override `targetLocales`. |
| `I18N_LOG_LEVEL` | Logger level (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR` | When `1`, disable ANSI colours in log output. |
| `I18N_LOG_SESSION_MAX` | Max lines kept per log session (default `5000`). |

---

## Files generated / maintained by the tool

| File | Owned by | Notes |
|---|---|---|
| `ai-i18n-tools.config.json` | You | Main config. Edit manually. |
| `ui-languages.json` (wherever configured) | You | Locale manifest. Edit manually to add/remove locales. |
| `strings.json` (wherever configured) | Tool (`extract` / `translate-ui` / `dashboard`) | Master UI catalog: `source`, `translated`, optional `models` (per locale: OpenRouter model id or `user-edited`), optional `locations`. Safe to edit `translated`; do not rename keys. |
| `{flatOutputDir}/de.json`, etc. | Tool (`translate-ui`) | Per-locale flat maps (source → translation only, no `models`). Do not edit — regenerated on each `translate-ui`. |
| `{cacheDir}/*.db` | Tool | SQLite translation cache (per-segment `model` metadata; `user-edited` after manual saves in `dashboard`). Do not edit directly; use `dashboard` or `cleanup`. |
| `glossary-user.csv` | You | Term overrides. Generate template with `glossary-generate`. |

---

## Source layout summary

```text
src/
├── index.ts               Public API (all programmatic exports)
├── cli/                   CLI command implementations
├── core/                  Config, Zod types, cache, output paths, resolve-content-paths, config-migrate
├── extractors/            UI, Markdown, Astro, Docusaurus JSON, nested JSON, SVG
├── processors/            Placeholder protection, batch splitting, post-translation validation, link rewriting
├── api/openrouter.ts      HTTP client for OpenRouter with model fallback and rate-limit handling
├── glossary/              Glossary loading (CSV + auto from strings.json) and term matching
├── runtime/               i18next helpers, RTL helpers, display helpers (no i18next import)
├── server/                Local Express Translation Dashboard for cache/glossary
└── utils/                 Logger, SHA-256 hash, .translate-ignore parser
```

The entry point for all public types and functions is `src/index.ts`.
