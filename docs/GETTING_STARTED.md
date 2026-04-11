# ai-i18n-tools: Getting Started

`ai-i18n-tools` provides two independent, composable workflows:

- **Workflow 1 - UI Translation**: extract `t("…")` calls from any JS/TS source, translate them via OpenRouter, and write flat per-locale JSON files ready for i18next.
- **Workflow 2 - Document Translation**: translate markdown (MDX), Docusaurus JSON label files, and SVG files to any number of locales, with smart caching.

Both workflows use OpenRouter (any compatible LLM) and share a single config file.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents** 

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Workflow 1 - UI Translation](#workflow-1---ui-translation)
  - [Step 1: Initialize](#step-1-initialize)
  - [Step 2: Extract strings](#step-2-extract-strings)
  - [Step 3: Translate UI strings](#step-3-translate-ui-strings)
  - [Step 4: Wire i18next at runtime](#step-4-wire-i18next-at-runtime)
  - [Using `t()` in source code](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Language switcher UI](#language-switcher-ui)
  - [RTL languages](#rtl-languages)
- [Workflow 2 - Document Translation](#workflow-2---document-translation)
  - [Step 1: Initialize](#step-1-initialize-1)
  - [Step 2: Translate documents](#step-2-translate-documents)
    - [Cache behavior and `translate-docs` flags](#cache-behavior-and-translate-docs-flags)
  - [Output layouts](#output-layouts)
- [Combined workflow (UI + Docs)](#combined-workflow-ui--docs)
- [Configuration reference](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`concurrency` (optional)](#concurrency-optional)
  - [`batchConcurrency` (optional)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (optional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`documentation`](#documentation)
  - [`glossary`](#glossary)
- [CLI reference](#cli-reference)
- [Environment variables](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

Set your OpenRouter API key:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Or create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Quick Start

The default `init` template (`ui-markdown`) enables **UI** extraction/translation only. The `ui-docusaurus` template enables **document** translation (`translate-docs`). Use `sync` when you want extract + UI + docs (and optional standalone SVG when `svg` is configured) in one invocation.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + docs (per config features)
npx ai-i18n-tools sync

# Markdown translation status (per file × locale)
npx ai-i18n-tools status
```

---

## Workflow 1 - UI Translation

Designed for any JS/TS project that uses i18next: React apps, Next.js (client and server components), Node.js services, CLI tools.

### Step 1: Initialize

```bash
npx ai-i18n-tools init
```

This writes `ai-i18n-tools.config.json` with the `ui-markdown` template. Edit it to set:

- `sourceLocale` - your source language BCP-47 code (e.g. `"en-GB"`). **Must match** `SOURCE_LOCALE` exported from your runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - path to your `ui-languages.json` manifest OR an array of BCP-47 codes.
- `ui.sourceRoots` - directories to scan for `t("…")` calls (e.g. `["src/"]`).
- `ui.stringsJson` - where to write the master catalog (e.g. `"src/locales/strings.json"`).
- `ui.flatOutputDir` - where to write `de.json`, `pt-BR.json`, etc. (e.g. `"src/locales/"`).

### Step 2: Extract strings

```bash
npx ai-i18n-tools extract
```

Scans all JS/TS files under `ui.sourceRoots` for `t("literal")` and `i18n.t("literal")` calls. Writes (or merges into) `ui.stringsJson`.

The scanner is configurable - you can add custom function names via `ui.reactExtractor.funcNames`.

### Step 3: Translate UI strings

```bash
npx ai-i18n-tools translate-ui
```

Reads `strings.json`, sends batches to OpenRouter for each target locale, writes flat JSON files (`de.json`, `fr.json`, etc.) to `ui.flatOutputDir`.

### Step 4: Wire i18next at runtime

Create your i18n setup file using the helpers exported by `'ai-i18n-tools/runtime'`:

```js
// src/i18n.js  (or src/i18n.ts)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

Import `i18n.js` before React renders (e.g. at the top of your entry point). When the user changes language, call `await loadLocale(code)` then `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` is exported so any other file that needs it (e.g. a language switcher) can import it directly from `'./i18n'`.

`**defaultI18nInitOptions(sourceLocale)**` returns the standard options for key-as-default setups:

- `parseMissingKeyHandler` returns the key itself, so untranslated strings display the source text.
- `nsSeparator: false` allows keys that contain colons.
- `interpolation.escapeValue: false` - safe to disable: React escapes values itself, and Node.js/CLI output has no HTML to escape.

`**wrapI18nWithKeyTrim(i18n)**` wraps `i18n.t` so that: (1) keys are trimmed before lookup, matching how the extract script stores them; (2) <code>{"{{var}}"}</code> interpolation is applied when the source locale returns the raw key - so <code>{"t('Hello {{name}}', { name })"}</code> works correctly even for the source language.

`**makeLoadLocale(i18n, loaders, sourceLocale)**` returns an async `loadLocale(lang)` function that dynamically imports the JSON bundle for a locale and registers it with i18next.

### Using `t()` in source code

Call `t()` with a **literal string** so the extract script can find it:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

The same pattern works outside React (Node.js, server components, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Rules:**

- Only these forms are extracted: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- The key must be a **literal string** - no variables or expressions as the key.
- Do not use template literals for the key: <code>{'t(`Hello ${name}`)'}</code> is not extractable.

### Interpolation

Use i18next's native second-argument interpolation for <code>{"{{var}}"}</code> placeholders:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

The extract script ignores the second argument - only the literal key string <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code> is extracted and sent for translation. Translators are instructed to preserve <code>{"{{...}}"}</code> tokens.

### Language switcher UI

Use the `ui-languages.json` manifest to build a language selector. `ai-i18n-tools` exports two display helpers:

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

`**getUILanguageLabel(lang, t)**` - shows `t(englishName)` when translated, or `englishName / t(englishName)` when both differ. Suitable for settings screens.

`**getUILanguageLabelNative(lang)**` - shows `englishName / label` (no `t()` call on each row). Suitable for header menus where you want the native name visible.

The `ui-languages.json` manifest is a JSON array of <code>{"{ code, label, englishName }"}</code> entries. Example:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

Set `targetLocales` in config to the path of this file so the translate command uses the same list.

### RTL languages

`ai-i18n-tools` exports `getTextDirection(lng)` and `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` sets `document.documentElement.dir` (browser) or is a no-op (Node.js). Pass an optional `element` argument to target a specific element.

For strings that may contain `→` arrows, flip them for RTL layouts:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Workflow 2 - Document Translation

Designed for markdown documentation, Docusaurus sites, JSON label files, and SVG diagrams.

### Step 1: Initialize

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Edit the generated `ai-i18n-tools.config.json`:

- `sourceLocale` - source language (must match `defaultLocale` in `docusaurus.config.js`).
- `targetLocales` - array of locale codes or path to a manifest.
- `documentation.contentPaths` - markdown/SVG source directories/files.
- `documentation.outputDir` - translated output root.
- `documentation.markdownOutput.style` - `"docusaurus"` or `"flat"` (see [Output layouts](#output-layouts)).

### Step 2: Translate documents

```bash
npx ai-i18n-tools translate-docs
```

This translates all files in `documentation.contentPaths` to all `targetLocales` (or `documentation.targetLocales` when set). Already-translated segments are served from the SQLite cache - only new or changed segments are sent to the LLM.

To translate a single locale:

```bash
npx ai-i18n-tools translate-docs --locale de
```

To check what needs translating:

```bash
npx ai-i18n-tools status
```

#### Cache behavior and `translate-docs` flags

The CLI keeps **file tracking** in SQLite (source hash per file × locale) and **segment** rows (hash × locale per translatable chunk). A normal run skips a file entirely when the tracked hash matches the current source **and** the output file already exists; otherwise it processes the file and uses the segment cache so unchanged text does not call the API.


| Flag                     | Effect                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(default)*              | Skip unchanged files when tracking + on-disk output match; use segment cache for the rest.                                                                                                             |
| `--force-update`         | Re-process every matched file (extract, reassemble, write outputs) even when file tracking would skip. **Segment cache still applies** - unchanged segments are not sent to the LLM.                   |
| `--force`                | Clears file tracking for each processed file and **does not read** the segment cache for API translation (full re-translation). New results are still **written** to the segment cache.                 |
| `--stats`                | Print segment counts, tracked file counts, and per-locale segment totals, then exit.                                                                                                                   |
| `--clear-cache [locale]` | Delete cached translations (and file tracking): all locales, or a single locale, then exit.                                                                                                            |


You cannot combine `--force` with `--force-update` (they are mutually exclusive).

### Output layouts

`**"docusaurus"`** - places translated files at `i18n/<locale>/docusaurus-plugin-content-docs/current/<relPath>`, mirroring the standard Docusaurus i18n folder layout. Set `documentation.markdownOutput.docsRoot` to your docs source root (e.g. `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`**"flat"**` - places translated files next to the source with a locale suffix, or in a subdirectory. Relative links between pages are rewritten automatically.

```
docs/guide.md → i18n/guide.de.md
```

You can override paths entirely with `documentation.markdownOutput.pathTemplate`. Placeholders: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Combined workflow (UI + Docs)

Enable all features in a single config to run both workflows together:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "markdownOutput": { "style": "flat" }
  }
}
```

`glossary.uiGlossary` points document translation at the same `strings.json` catalog as the UI so terminology stays consistent; `glossary.userGlossary` adds CSV overrides for product terms.

Run `npx ai-i18n-tools sync` to run one pipeline: **extract** UI strings (if `features.extractUIStrings`), **translate UI** strings (if `features.translateUIStrings`), **translate standalone SVG assets** (if a `svg` block is present in config), then **translate documentation** (markdown/JSON under `documentation`). Skip parts with `--no-ui`, `--no-svg`, or `--no-docs`. The docs step accepts `--dry-run`, `-p` / `--path`, `--force`, and `--force-update` (the last two only apply when documentation translation runs; they are ignored if you pass `--no-docs`).

Use `documentation.targetLocales` to translate docs to a **smaller subset** than the UI:

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentation": {
    "targetLocales": ["de", "fr", "es"]
  }
}
```

---

## Configuration reference

### `sourceLocale`

BCP-47 code for the source language (e.g. `"en-GB"`, `"en"`, `"pt-BR"`). No translation file is generated for this locale - the key string itself is the source text.

**Must match** `SOURCE_LOCALE` exported from your runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales`

Which locales to translate to. Accepts:

- **String path** to a `ui-languages.json` manifest (`"src/locales/ui-languages.json"`). The file is loaded and locale codes are extracted.
- **Array of BCP-47 codes** (`["de", "fr", "es"]`).
- **One-element array with a path** (`["src/locales/ui-languages.json"]`) - same behavior as the string form.

### `concurrency` (optional)

Maximum **target locales** translated at the same time (`translate-ui`, `translate-docs`, `translate-svg`, and the matching steps inside `sync`). If omitted, the CLI uses **4** for UI translation and **3** for documentation translation (built-in defaults). Override per run with `-j` / `--concurrency`.

### `batchConcurrency` (optional)

**translate-docs** and **translate-svg** (and the documentation step of `sync`): maximum parallel OpenRouter **batch** requests per file (each batch can contain many segments). Default **4** when omitted. Ignored by `translate-ui`. Override with `-b` / `--batch-concurrency`. On `sync`, `-b` applies to the documentation translation step only.

### `batchSize` / `maxBatchChars` (optional)

Segment batching for document translation: how many segments per API request, and a character ceiling. Defaults: **20** segments, **4096** characters (when omitted).

### `openrouter`


| Field               | Description                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | OpenRouter API base URL. Default: `https://openrouter.ai/api/v1`.                        |
| `translationModels` | Ordered list of model IDs. First is tried first; subsequent ones are fallbacks on error. |
| `maxTokens`         | Max completion tokens per request. Default: `8192`.                                      |
| `temperature`       | Sampling temperature. Default: `0.2`.                                                    |


Set `OPENROUTER_API_KEY` in your environment or `.env` file.

### `features`


| Field                | Workflow | Description                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | Scan source for `t("…")` and write/merge `strings.json`.          |
| `translateUIStrings` | 1        | Translate `strings.json` entries and write per-locale JSON files. |
| `translateMarkdown`  | 2        | Translate `.md` / `.mdx` files.                                   |
| `translateJSON`      | 2        | Translate Docusaurus JSON label files.                            |
| `translateSVG`       | 2        | Translate text content in `.svg` files.                           |


### `ui`


| Field                       | Description                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Directories (relative to cwd) scanned for `t("…")` calls.               |
| `stringsJson`               | Path to the master catalog file. Updated by `extract`.                  |
| `flatOutputDir`             | Directory where per-locale JSON files are written (`de.json`, etc.).    |
| `reactExtractor.funcNames`  | Additional function names to scan (default: `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | File extensions to include (default: `[".js", ".jsx", ".ts", ".tsx"]`). |


### `documentation`


| Field                                        | Description                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contentPaths`                               | Source files/directories to translate (markdown, JSON, SVG).                                                                                                                                                              |
| `outputDir`                                  | Root directory for translated output.                                                                                                                                                                                     |
| `cacheDir`                                   | SQLite cache directory. Reuse across runs for incremental translation.                                                                                                                                                    |
| `targetLocales`                              | Optional subset of locales for docs only (overrides root `targetLocales`).                                                                                                                                                |
| `jsonSource`                                 | Source directory for Docusaurus JSON label files (e.g. `"i18n/en"`).                                                                                                                                                      |
| `markdownOutput.style`                       | `"docusaurus"` or `"flat"`.                                                                                                                                                                                               |
| `markdownOutput.docsRoot`                    | Source docs root for Docusaurus layout (e.g. `"docs"`).                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | Custom output path. Placeholders: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{extension}"}</code>.                                                                                                                        |
| `markdownOutput.rewriteRelativeLinks` | Rewrite relative links after translation (auto-enabled for `flat` style).                                                                                                                                                 |
| `injectTranslationMetadata`                  | When `true` (default when omitted), translated markdown files include YAML keys: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`. Set to `false` to skip. |


### `glossary`


| Field          | Description                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Path to `strings.json` - auto-builds a glossary from existing translations.                                                                                                                 |
| `userGlossary` | Path to a CSV with columns `**Original language string`** (or `**en**`), `**locale**`, `**Translation**` - one row per source term and target locale (`locale` may be `*` for all targets). |


The legacy key `uiGlossaryFromStringsJson` is still accepted and mapped to `uiGlossary` when loading config.

Generate an empty glossary CSV:

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLI reference


| Command                                                                   | Description                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | Write a starter config file (includes `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, and `documentation.injectTranslationMetadata`). `--with-translate-ignore` creates a starter `.translate-ignore`.                                                                            |
| `extract`                                                                 | Scan source for `t("…")` calls and update `strings.json`. Requires `features.extractUIStrings`.                                                                                                                                                                                                    |
| `translate-docs …`                                                        | Translate documentation files under `documentation.contentPaths` (markdown, MDX, JSON label files, and any `.svg` included there). `-j`: max parallel locales; `-b`: max parallel batch API calls per file. See [Cache behavior and `translate-docs` flags](#cache-behavior-and-translate-docs-flags) for `--force`, `--force-update`, `--stats`, `--clear-cache`. |
| `translate-svg …`                                                         | Translate standalone SVG assets configured in `config.svg` (separate from docs). Same cache ideas as docs; supports `--no-cache` to skip SQLite reads/writes for that run. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [-j <n>]`                                 | Translate UI strings only. `-j`: max parallel locales. Requires `features.translateUIStrings`.                                                                                                                                                                                                     |
| `sync …`                                                                  | Extract (if enabled), then UI translation, then `translate-svg` when `config.svg` exists, then documentation translation - unless skipped with `--no-ui`, `--no-svg`, or `--no-docs`. Shared flags: `-l`, `-p`, `--dry-run`, `-j`, `-b` (docs batching only), `--force` / `--force-update` (docs only; mutually exclusive when docs run).                         |
| `status`                                                                  | Show markdown translation status per file × locale (no `--locale` filter; locales come from config).                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>] [-y]`                  | Remove stale rows (null `last_hit_at` / empty filepath) and orphaned rows (missing files). Before modifying the DB, prompts (unless `--dry-run` or `--yes`): run `translate-docs --force-update` first so tracking and cache hits are current. Creates a timestamped SQLite backup under the cache dir unless `--no-backup`. Use `--yes` when stdin is not a TTY. |
| `editor [-p <port>]`                                                      | Launch a local web editor for the cache, `strings.json`, and glossary CSV.                                                                                                                                                                                                                         |
| `glossary-generate`                                                       | Write an empty `glossary-user.csv` template.                                                                                                                                                                                                                                                       |


All commands accept `-c <path>` to specify a non-default config file, `-v` for verbose output, and `-w` / `--write-logs [path]` to tee console output to a log file (default path: under `documentation.cacheDir`).

---

## Environment variables


| Variable               | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Required.** Your OpenRouter API key.                     |
| `OPENROUTER_BASE_URL`  | Override the API base URL.                                 |
| `I18N_SOURCE_LOCALE`   | Override `sourceLocale` at runtime.                        |
| `I18N_TARGET_LOCALES`  | Comma-separated locale codes to override `targetLocales`.  |
| `I18N_LOG_LEVEL`       | Logger level (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | When `1`, disable ANSI colors in log output.               |
| `I18N_LOG_SESSION_MAX` | Max lines kept per log session (default `5000`).           |


