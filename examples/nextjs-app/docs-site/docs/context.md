# ai-i18n-tools: AI Agent Context 

This document gives an AI agent the mental model, key decisions, and patterns needed to work effectively with `ai-i18n-tools` without consulting every other doc first. Read this before making code or config changes.

<!-- DOCTOC SKIP -->

---

## What this package does {#what-this-package-does}

`ai-i18n-tools` is a CLI + library that automates internationalization for JavaScript/TypeScript projects. It:

1. **Extracts** UI strings from source code (`t("…")` calls) into a master catalog.
2. **Translates** that catalog and documentation files via LLMs (through OpenRouter).
3. **Writes** locale-ready JSON files for i18next, and translated copies of markdown/SVG/JSON docs.
4. **Exports runtime helpers** for wiring i18next, RTL support, and language selection in any JS environment.

Everything is driven by a single config file: `ai-i18n-tools.config.json`.

---

## Two independent workflows {#two-independent-workflows}

| | Workflow 1 - UI Strings | Workflow 2 -  Documents |
|---|---|---|
| **Input** | JS/TS source files with `t("…")` calls | `.md`, `.mdx`, Docusaurus JSON label files, `.svg` |
| **Output** | `strings.json` (catalog) + per-locale flat JSON files (`de.json`, etc.) | Translated copies of those files at configured output paths |
| **Cache** | `strings.json` itself (existing translations are preserved) | SQLite database (`cacheDir`) - only new/changed segments go to LLM |
| **Key command** | `translate-ui` | `translate-docs` |
| **Sync command** | `sync` | `sync` |
| **Feature flags** | `extractUIStrings`, `translateUIStrings` | `translateMarkdown`, `translateJSON`, `translateSVG` |

They can be used independently or together in the same config. **`sync`** runs, in order: `extract` (if enabled), `translate-ui` (if enabled, unless `--no-ui`), `translate-svg` when `config.svg` exists (unless `--no-svg`), then `translate-docs` (unless `--no-docs`). See the [CLI cheat sheet](#cli-commands-cheat-sheet) for flags.

---

## Config file quick reference {#config-file-quick-reference}

File: `ai-i18n-tools.config.json` (default location - override with `-c <path>`)

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",

  "openrouter": {
    "translationModels": [
      "qwen/qwen3-235b-a22b-2507",
      "stepfun/step-3.5-flash",
      "anthropic/claude-3-haiku",
      "anthropic/claude-3.5-haiku"
    ],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },

  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/",
    "reactExtractor": {
      "funcNames": ["t", "i18n.t"],
      "extensions": [".js", ".jsx", ".ts", ".tsx"]
    }
  },

  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "targetLocales": ["de", "fr"],
    "jsonSource": "i18n/en",
    "markdownOutput": {
      "style": "docusaurus",
      "docsRoot": "docs"
    }
  },

  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

### Key constraints {#key-constraints}

- `sourceLocale` **must exactly match** the `SOURCE_LOCALE` constant exported from the runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` can be a string path to a `ui-languages.json` manifest OR an array of BCP-47 codes.
- `documentation.targetLocales` overrides `targetLocales` for docs only - useful when you want fewer doc locales than UI locales.
- All paths are relative to cwd (where the CLI is invoked).
- `OPENROUTER_API_KEY` must be set in the environment or a `.env` file.

---

## The `ui-languages.json` manifest {#the-ui-languagesjson-manifest}

When `targetLocales` is a file path, that file must be a JSON array of this shape:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "de",    "label": "Deutsch",       "englishName": "German" },
  { "code": "ar",    "label": "العربية",        "englishName": "Arabic" }
]
```

- `code` - BCP-47 locale code used in file names and by i18next.
- `label` - native name shown in language pickers.
- `englishName` - English name used for display helpers and translation prompts.

This file drives both the translation pipeline and the runtime language-switcher UI. Keep it as the single source of truth for supported locales.

---

## CLI commands cheat sheet {#cli-commands-cheat-sheet}

```
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus]
    Write a starter config file. ui-markdown = React/UI-only template.
    ui-docusaurus = combined UI + docs template.

npx ai-i18n-tools extract
    Scan source for t("…") calls, write/merge strings.json.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools translate-ui [--locale <code>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate markdown/JSON/SVG under documentation paths. Default: skip unchanged files + use segment SQLite cache.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
    Standalone SVG assets from config.svg. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-docs] …
    extract (if enabled), translate-ui (unless --no-ui), translate-svg when config.svg exists (unless --no-svg),
    translate-docs (unless --no-docs). --force / --force-update apply to the docs step only; if --no-docs, both can be passed without conflict.

npx ai-i18n-tools status [--locale <code>]
    Show translation coverage per file × locale.

npx ai-i18n-tools editor
    Launch a local web editor for the SQLite cache, strings.json, and glossary.

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>] [--yes]
    Maintain the SQLite cache: removes stale rows and orphaned filepath rows.
    Prompts before DB writes (unless --dry-run or --yes): run translate-docs --force-update first.
    Backs up cache.db under the cache dir before modifications unless --no-backup. Use --yes in CI.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Global flags: `-c <config>` (config path), `-v` (verbose/debug output).

---

## Workflow 1 - UI strings: how data flows {#workflow-1---ui-strings-how-data-flows}

```
source files (JS/TS)
    │  i18next-scanner Parser finds t("literal") and i18n.t("literal")
    ▼
strings.json  - master catalog
    {
      "<md5-8-hex>": {
        "source": "The English string",
        "translated": { "de": "Der deutsche Text", "pt-BR": "O texto em português" }
      }
    }
    │  translate-ui reads this, sends batches to OpenRouter, fills missing locales
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

## Workflow 2 - Document translation: how data flows {#workflow-2---document-translation-how-data-flows}

```
source files (md/mdx/json/svg)
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

**Cache key**: SHA-256 first 16 hex chars of whitespace-normalized segment content × locale. The cache is in `documentation.cacheDir` (a `.db` SQLite file).

**CLI**: `--force-update` bypasses only the *file-level* skip (rebuild outputs) while still using segment cache. `--force` clears per-file tracking and skips segment cache reads for API calls. See the getting started guide for the full flag table.

**Output styles** (`markdownOutput.style`):

| Style | Example |
|---|---|
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| custom `pathTemplate` | any layout using `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` |

Flat-style output auto-rewrites relative links between pages (e.g. `[Guide](./guide.md)` → `guide.de.md`).

---

## Runtime integration - wiring i18next {#runtime-integration---wiring-i18next}

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

## Runtime helpers reference {#runtime-helpers-reference}

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

## Programmatic API {#programmatic-api}

Import from `'ai-i18n-tools'`. Useful when you need to call translation steps from a build script or CI pipeline.

```ts
import {
  loadI18nConfigFromFile,
  runTranslateUI,
  Logger,
} from 'ai-i18n-tools';

const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');
const logger = new Logger({ level: 'info' });

const summary = await runTranslateUI({
  config,
  cwd: process.cwd(),
  logger,
  apiKey: process.env.OPENROUTER_API_KEY,
});
// summary.translated - number of newly translated strings
// summary.locales   - number of locales processed
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

## Glossary {#glossary}

The glossary ensures consistent terminology across translations.

- **Auto-built glossary** (`glossary.uiGlossary`): reads `strings.json` and uses existing translations as a hint source. No CSV needed.
- **User glossary** (`glossary.userGlossary`): a CSV file with columns `term,translation,locale`. Generate an empty template with `npx ai-i18n-tools glossary-generate`.

Glossary hints are injected into the LLM system prompt - they are suggestions, not hard replacements.

---

## Extension points {#extension-points}

### Custom function names {#custom-function-names}

```json
{ "ui": { "reactExtractor": { "funcNames": ["t", "i18n.t", "translate"] } } }
```

### Custom extractor {#custom-extractor}

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* return typed segments */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* rebuild file */ }
}
```

### Custom output path {#custom-output-path}

```json
{
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```

Available placeholders: `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

---

## Common tasks and what to do {#common-tasks-and-what-to-do}

| Task | What to run / change |
|---|---|
| Add a new locale | Add it to `ui-languages.json` (or `targetLocales` array), then run `translate-docs` / `translate-ui` / `sync` |
| Translate only one locale | `npx ai-i18n-tools translate-docs --locale de` (or `translate-ui`, `sync`) |
| Add a new UI string | Write `t('My new string')` in source, then run `extract` then `translate-ui` |
| Update a translation manually | Edit `strings.json` directly (`translated` object), then run `translate-ui` (it won't overwrite existing entries) |
| Translate new/updated docs only | Run `translate-docs` - file + segment cache skips unchanged work automatically |
| Rebuild doc outputs without re-calling the API for unchanged segments | `npx ai-i18n-tools translate-docs --force-update` |
| Full doc re-translation (ignore segment cache) | `npx ai-i18n-tools translate-docs --force` |
| Free up cache space | `npx ai-i18n-tools cleanup` or `translate-docs --clear-cache` |
| Inspect what is untranslated | `npx ai-i18n-tools status` |
| Change the translation model | Edit `openrouter.translationModels` in config (first model is primary, rest are fallbacks) |
| Wire i18next in a new project | See [Runtime integration](#runtime-integration---wiring-i18next) above |
| Translate docs to fewer locales than UI | Set `documentation.targetLocales` to a smaller array |
| Run extract + UI + SVG + docs in one command | `npx ai-i18n-tools sync` - use `--no-ui`, `--no-svg`, or `--no-docs` to skip a stage (e.g. UI + SVG only: `--no-docs`) |

---

## Environment variables {#environment-variables}

| Variable | Effect |
|---|---|
| `OPENROUTER_API_KEY` | **Required.** Your OpenRouter API key. |
| `OPENROUTER_BASE_URL` | Override the API base URL. |
| `I18N_SOURCE_LOCALE` | Override `sourceLocale` at runtime. |
| `I18N_TARGET_LOCALES` | Comma-separated locale codes to override `targetLocales`. |

---

## Files generated / maintained by the tool {#files-generated--maintained-by-the-tool}

| File | Owned by | Notes |
|---|---|---|
| `ai-i18n-tools.config.json` | You | Main config. Edit manually. |
| `ui-languages.json` (wherever configured) | You | Locale manifest. Edit manually to add/remove locales. |
| `strings.json` (wherever configured) | Tool (`extract`) | Master UI catalog. Safe to edit `translated` values. Do not rename keys. |
| `{flatOutputDir}/de.json`, etc. | Tool (`translate-ui`) | Per-locale flat maps. Do not edit - regenerated on each `translate-ui`. |
| `{cacheDir}/*.db` | Tool | SQLite translation cache. Do not edit directly; use `editor` command or `cleanup`. |
| `glossary-user.csv` | You | Term overrides. Generate template with `glossary-generate`. |

---

## Source layout summary {#source-layout-summary}

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
