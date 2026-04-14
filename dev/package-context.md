# ai-i18n-tools: maintainer / package context

**Audience:** Contributors and AI agents working **inside the `ai-i18n-tools` repository**. This file lives in `dev/` and is **not** the primary integration guide for downstream apps.

**Consumers:** If you are adding the **published npm package** to another project, use [`docs/ai-i18n-tools-context.md`](../docs/ai-i18n-tools-context.md) (shipped on npm under `docs/`) and [`docs/GETTING_STARTED.md`](../docs/GETTING_STARTED.md).

This document gives the mental model, key decisions, and patterns needed to work effectively on this codebase. Read it before making code or config changes.

<!-- DOCTOC SKIP -->

---

## What this package does

`ai-i18n-tools` is a CLI + library that automates internationalization for JavaScript/TypeScript projects. It:

1. **Extracts** UI strings into a master catalog: `t("…")` / `i18n.t("…")` literals (configurable), optionally `package.json` `description`, and optionally each `englishName` from `ui-languages.json` when `ui.reactExtractor.includeUiLanguageEnglishNames` is true.
2. **Translates** that catalog and documentation files via LLMs (through OpenRouter).
3. **Writes** locale-ready JSON files for i18next, plus translated markdown, Docusaurus JSON labels, and standalone SVG assets.
4. **Exports runtime helpers** for wiring i18next, RTL support, and language selection in any JS environment.

Everything is driven by a single config file: `ai-i18n-tools.config.json`.

---

## Two independent workflows

| | Workflow 1 - UI Strings | Workflow 2 - Documents |
|---|---|---|
| **Input** | JS/TS sources (`t("…")`), optional `package.json` description, optional manifest `englishName` (see `extract`) | `.md`, `.mdx`, Docusaurus JSON label files |
| **Output** | `strings.json` (catalog) + per-locale flat JSON files (`de.json`, etc.) | Translated copies of those files at configured output paths |
| **Cache** | `strings.json` itself (existing translations are preserved) | SQLite database (`cacheDir`) - only new/changed segments go to LLM |
| **Key command** | `translate-ui` | `translate-docs` |
| **Sync command** | `sync` | `sync` |
| **Feature flags** | `extractUIStrings`, `translateUIStrings` | `translateMarkdown`, `translateJSON`, `translateSVG` |

They can be used independently or together in the same config. `sync` runs, in order: `extract` (if enabled), `translate-ui` (if enabled, unless `--no-ui`), `translate-svg` when `features.translateSVG` is true and `config.svg` is set (unless `--no-svg`), then `translate-docs` (unless `--no-docs`). Standalone SVG translation requires the **`translateSVG`** feature plus the top-level **`svg`** block (paths and layout). See the [CLI cheat sheet](#cli-commands-cheat-sheet) for flags.

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
      "deepseek/deepseek-v3.2",
      "anthropic/claude-3-haiku",
      "qwen/qwen3.6-plus",
      "anthropic/claude-3.5-haiku",
      "openai/gpt-5.3-codex",
      "anthropic/claude-sonnet-4.6",
      "google/gemini-3-flash-preview"
    ],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
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
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr"],
      "jsonSource": "i18n/en",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs"
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
- `documentations[].description` is optional text for maintainers (what the block is for); it does not affect translation. When set, it is included in the `translate-docs` headline and `status` headers.
- `documentations[].targetLocales` limits that block to a subset; effective documentation locales are the **union** across blocks (useful when different trees need different locale sets).
- `documentations[].markdownOutput.postProcessing` can adjust translated markdown after reassembly, for example by rewriting screenshot paths or rebuilding a language list block.
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

This file drives translation targets, prompts, and the runtime language-switcher. **`extract` does not add `englishName` strings to `strings.json` unless** `ui.reactExtractor.includeUiLanguageEnglishNames` is `true` (then each non-duplicate `englishName` is merged with the same MD5-8 hash scheme as scanned literals). Regenerate or hand-edit the manifest with `generate-ui-languages` (see cheat sheet).

**Bundled master list:** `data/ui-languages-complete.json` (IANA-derived; rebuild with `pnpm run build:ui-languages-master`).

---

## CLI commands cheat sheet

```
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus]
    Write a starter config file. ui-markdown = React/UI-only template.
    ui-docusaurus = combined UI + docs template.

npx ai-i18n-tools extract
    Scan source for t("…") / i18n.t("…"), merge optional package.json description and (if enabled) ui-languages englishName into strings.json.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]
    Build ui-languages.json from sourceLocale + targetLocales using the master catalog (default: bundled data/ui-languages-complete.json).
    Requires uiLanguagesPath in config. Warns and uses TODO placeholders for locales missing from the master file.

npx ai-i18n-tools translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.
    --force: re-translate all entries per locale. --dry-run: no writes, no API calls. -j: max parallel locales.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate markdown and JSON under documentation paths. Default: skip unchanged files + use segment SQLite cache.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    --prompt-format xml|json-array|json-object: batch wire format to the model (default xml); does not change validation or cache.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
    Standalone SVG assets from config.svg. Requires features.translateSVG. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-docs] …
    extract (if enabled), translate-ui (unless --no-ui), translate-svg when features.translateSVG and config.svg (unless --no-svg),
    translate-docs (unless --no-docs). --force / --force-update apply to the docs step only; if --no-docs, both can be passed without conflict.

npx ai-i18n-tools status
    Show markdown translation coverage per file × locale.

npx ai-i18n-tools editor
    Launch a local web editor for the SQLite cache, strings.json, and glossary.

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
    Runs sync --force-update first, then maintains the SQLite cache: stale segment rows; orphaned file_tracking keys (doc-block:, svg-assets:, …);
    orphaned translation rows whose filepath metadata points at a missing file.
    Backs up cache.db under the cache dir before modifications unless --no-backup.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Global flags: `-c <config>` (config path), `-v` (verbose/debug output), `-w` / `--write-logs [path]` (tee console output to a log file; default path: under `cacheDir`).

---

## Workflow 1 - UI strings: how data flows

```
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

```
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

**Cache key**: SHA-256 first 16 hex chars of whitespace-normalized segment content × locale. The cache lives under root `cacheDir` (a `cache.db` SQLite file), shared by all `documentations` blocks. Each row stores the `model` that last translated the segment; saving an edit in the `editor` sets `model` to `user-edited` (same sentinel as UI `strings.json` `models`).

**CLI**: `--force-update` bypasses only the *file-level* skip (rebuild outputs) while still using segment cache. `--force` clears per-file tracking and skips segment cache reads for API calls. See the getting started guide for the full flag table.

**Standalone SVGs**: handled by `translate-svg` when `features.translateSVG` is true and the top-level `svg` config block is set. They use the same OpenRouter/cache ideas, but not the `documentations` pipeline.

**Output styles** (`markdownOutput.style`):

| Style | Example |
|---|---|
| `"nested"` (default) | `docs/guide.md` → `i18n/de/docs/guide.md` |
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| custom `pathTemplate` | any layout using `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` |

Flat-style output auto-rewrites relative links between pages (e.g. `[Guide](./guide.md)` → `guide.de.md`).

---

## Runtime integration - wiring i18next

The package exports helpers from `'ai-i18n-tools/runtime'` that remove boilerplate. The minimal setup:

```ts
// src/i18n.ts  - import this at the top of your entry point
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json exactly
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

// Dynamic imports for non-source locales
const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
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
| `wrapI18nWithKeyTrim` | `(i18n: I18nLike) => void` | Trim keys before lookup and apply `{{var}}` interpolation for the source locale (where `parseMissingKeyHandler` returns the raw key) |
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

| Export | Use when |
|---|---|
| `loadI18nConfigFromFile(path, cwd?)` | Load and validate the config |
| `parseI18nConfig(rawObject)` | Validate a config object you built in code |
| `TranslationCache` | Direct SQLite cache access |
| `UIStringExtractor` | Extract `t("…")` calls from JS/TS files |
| `MarkdownExtractor` | Parse markdown into translatable segments |
| `JsonExtractor` | Parse Docusaurus JSON label files |
| `SvgExtractor` | Parse SVG text elements |
| `OpenRouterClient` | Make translation requests directly |
| `PlaceholderHandler` | Protect/restore markdown syntax around translation |
| `splitTranslatableIntoBatches` | Group segments into LLM-sized batches |
| `validateTranslation` | Structural checks after a translation call |
| `resolveDocumentationOutputPath` | Compute the output file path for a translated document |
| `Glossary` / `GlossaryMatcher` | Load and apply a translation glossary |

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
  "documentations": [
    {
      "markdownOutput": {
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
| Add a new UI string | Write `t('My new string')` in source, then run `extract` then `translate-ui` |
| Update a translation manually | Edit `strings.json` directly (`translated`), or use `editor` (sets `models[locale]` to `user-edited`). `translate-ui` skips locales that already have text unless you use `--force` |
| Translate new/updated docs only | Run `translate-docs` - file + segment cache skips unchanged work automatically |
| Rebuild doc outputs without re-calling the API for unchanged segments | `npx ai-i18n-tools sync  --force-update` |
| Full doc re-translation (ignore segment cache) | `npx ai-i18n-tools translate-docs --force` |
| Free up cache space | `npx ai-i18n-tools cleanup` or `translate-docs --clear-cache` |
| Inspect what is untranslated | `npx ai-i18n-tools status` |
| Change the translation model | Edit `openrouter.translationModels` (first is primary, rest are fallbacks). For **UI only**, optional `ui.preferredModel` is tried before that list. |
| Wire i18next in a new project | See [Runtime integration](#runtime-integration---wiring-i18next) above |
| Translate docs to fewer locales than UI | Set `documentations[].targetLocales` on the relevant block(s), or use a smaller union |
| Run extract + UI + SVG + docs in one command | `npx ai-i18n-tools sync` (SVG runs when `features.translateSVG` and `svg` are set) - use `--no-ui`, `--no-svg`, or `--no-docs` to skip a stage (e.g. UI + SVG only: `--no-docs`) |

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
| `strings.json` (wherever configured) | Tool (`extract` / `translate-ui` / `editor`) | Master UI catalog: `source`, `translated`, optional `models` (per locale: OpenRouter model id or `user-edited`), optional `locations`. Safe to edit `translated`; do not rename keys. |
| `{flatOutputDir}/de.json`, etc. | Tool (`translate-ui`) | Per-locale flat maps (source → translation only, no `models`). Do not edit — regenerated on each `translate-ui`. |
| `{cacheDir}/*.db` | Tool | SQLite translation cache (per-segment `model` metadata; `user-edited` after manual saves in `editor`). Do not edit directly; use `editor` or `cleanup`. |
| `glossary-user.csv` | You | Term overrides. Generate template with `glossary-generate`. |

---

## Source layout summary

```
src/
├── index.ts               Public API (all programmatic exports)
├── cli/                   CLI command implementations
├── core/                  Config loading, types (Zod), SQLite cache, prompt builder, output paths
├── extractors/            Segment extractors: JS/TS, Markdown, JSON, SVG
├── processors/            Placeholder protection, batch splitting, post-translation validation, link rewriting
├── api/openrouter.ts      HTTP client for OpenRouter with model fallback and rate-limit handling
├── glossary/              Glossary loading (CSV + auto from strings.json) and term matching
├── runtime/               i18next helpers, RTL helpers, display helpers (no i18next import)
├── server/                Local Express web editor for cache/glossary
└── utils/                 Logger, SHA-256 hash, .translate-ignore parser
```

The entry point for all public types and functions is `src/index.ts`.
