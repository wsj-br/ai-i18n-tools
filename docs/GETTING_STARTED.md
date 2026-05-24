<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: Getting Started

`ai-i18n-tools` provides two independent, composable workflows:

- **Workflow 1 - UI Translation**: extract `t("…")` calls from any JS/TS source, translate them via OpenRouter, and write flat per-locale JSON files ready for i18next.
- **Workflow 2 - Document Translation**: translate **markdown and MDX pages** listed in `contentPaths` to any number of locales, with smart caching — that is the localized documentation readers open in the site. Optional **Docusaurus JSON** (`jsonSource`, from `docusaurus write-translations`) covers **site chrome** (navbar, footer, theme/plugin UI strings), not the prose in `docs/`. **SVG** files use `features.translateSVG`, the top-level `svg` block, and `translate-svg` (see [CLI reference](#cli-reference)).

Both workflows use OpenRouter (any compatible LLM) and share a single config file.


<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](./GETTING_STARTED.md) · [Deutsch](../translated-docs/docs/GETTING_STARTED.de.md) · [Español](../translated-docs/docs/GETTING_STARTED.es.md) · [Français](../translated-docs/docs/GETTING_STARTED.fr.md) · [हिन्दी](../translated-docs/docs/GETTING_STARTED.hi.md) · [日本語](../translated-docs/docs/GETTING_STARTED.ja.md) · [한국어](../translated-docs/docs/GETTING_STARTED.ko.md) · [Português (Brasil)](../translated-docs/docs/GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](../translated-docs/docs/GETTING_STARTED.zh-CN.md) · [中文 (台灣)](../translated-docs/docs/GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Recommended `package.json` scripts](#recommended-packagejson-scripts)
- [Workflow 1 - UI Translation](#workflow-1---ui-translation)
  - [Step 1: Initialise](#step-1-initialise)
  - [Step 2: Extract strings](#step-2-extract-strings)
  - [Step 3: Translate UI strings](#step-3-translate-ui-strings)
  - [Exporting to XLIFF 2.0 (optional)](#exporting-to-xliff-20-optional)
  - [Step 4: Wire i18next at runtime](#step-4-wire-i18next-at-runtime)
  - [Using `t()` in source code](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Cardinal plurals (`plurals: true`)](#cardinal-plurals-plurals-true)
  - [Language switcher UI](#language-switcher-ui)
  - [RTL languages](#rtl-languages)
- [Workflow 2 - Document Translation](#workflow-2---document-translation)
  - [Step 1: Initialise for documentation](#step-1-initialise-for-documentation)
  - [Step 2: Translate documents](#step-2-translate-documents)
    - [Complex Markdown and failed quality checks](#complex-markdown-and-failed-quality-checks)
    - [Cache behaviour and `translate-docs` flags](#cache-behaviour-and-translate-docs-flags)
    - [Batch prompt format](#batch-prompt-format)
    - [Segment dedupe and paths in SQLite](#segment-dedupe-and-paths-in-sqlite)
  - [Output layouts](#output-layouts)
    - [Anchor links when `markdownOutput.style = "flat"`](#anchor-links-when-markdownoutputstyle--flat)
    - [Images and raster assets in translated docs](#images-and-raster-assets-in-translated-docs)
    - [Language switcher (`languageListBlock`)](#language-switcher-languagelistblock)
    - [`pathTemplate` / `jsonPathTemplate` placeholders](#pathtemplate--jsonpathtemplate-placeholders)
  - [Troubleshooting](#troubleshooting)
- [Combined workflow (UI + Docs)](#combined-workflow-ui--docs)
  - [Mixed documentation workflow (`markdownOutput.style = "docusaurus"` + `"flat"`)](#mixed-documentation-workflow-markdownoutputstyle--docusaurus--flat)
- [Translation Dashboard](#translation-dashboard)
  - [Failures (document translation)](#failures-document-translation)
    - [When to use it](#when-to-use-it)
    - [Why source edits matter](#why-source-edits-matter)
    - [How to use the tab](#how-to-use-the-tab)
  - [Markdown issues (static checks)](#markdown-issues-static-checks)
- [Configuration reference](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (optional)](#uilanguagespath-optional)
  - [`concurrency` (optional)](#concurrency-optional)
  - [`batchConcurrency` (optional)](#batchconcurrency-optional)
  - [`fileConcurrency` (optional)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (optional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [Best practice for git exclusions:](#best-practice-for-git-exclusions)
  - [`documentations`](#documentations)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLI reference](#cli-reference)
- [Environment variables](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## Installation

The published package is **ESM-only**. Use `import`/`import()` in Node.js or your bundler; do not use `require('ai-i18n-tools')`. The package declares `engines.node` `>=22.16.0`; older Node.js versions are unsupported. The npm tarball includes English files under `docs/` only; locale-specific copies under `translated-docs/` are in the [GitHub repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools includes its own string extractor. If you previously used `i18next-scanner`, `babel-plugin-i18next-extract`, or similar, you can remove those dev dependencies after migrating.


<a id="using-the-cli"></a>
### Using the CLI

**Per-project (recommended)** — install as a dependency or devDependency, then call via `npx`, `pnpm exec`, or a `package.json` script. `package.json` scripts already run with `node_modules/.bin` on `PATH`, so commands like `pnpm run i18n:sync` invoke the CLI without typing `npx`.

**Bare** `ai-i18n-tools` **in the terminal:** To run the CLI directly in an interactive shell (from the project root, after a local install), prepend the local bin directory to `PATH`:

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

With [**direnv**](https://direnv.net/), add `PATH_add node_modules/.bin` to a `.envrc` in the project root so the bare command is available after `cd` into the repo. Without adjusting `PATH`, keep using `npx ai-i18n-tools …` or `pnpm exec ai-i18n-tools …`.

**Zero-install one-off** — `npx ai-i18n-tools <cmd>` or `pnpm dlx ai-i18n-tools <cmd>` (downloads the package for that invocation; no entry in `package.json`).

On Linux, macOS, and WSL, registry installs set the executable bit on the CLI script automatically. On Windows, package managers generate `.cmd` and `.ps1` shims that invoke Node explicitly.

Set your OpenRouter API key:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Or create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## Quick Start

The default `init` template (`ui-markdown`) enables **UI** extraction and translation only. The `ui-docusaurus` and `ui-starlight` templates enable **document** translation (`translate-docs`). The `ui-astro-website` template scaffolds **UI** extraction for plain Astro apps (including `.astro` files); add a `documentations[]` block (see [Astro website pages (parse-and-replace)](#astro-website-parse-and-replace)) when you also want `translate-docs` for `.astro` page HTML. The reference [`examples/astro-website`](../examples/astro-website/) uses **both** pipelines. Use `sync` when you want one command that runs extract, UI translation, optional SVG file translation, and documentation translation according to your config.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Recommended `package.json` scripts

With the package installed locally, you can use the CLI commands directly in scripts (no `npx` needed).

**Prefer** `sync` for anything that used to be “run `translate-ui`, then `translate-svg`, then `translate-docs`”: `ai-i18n-tools sync` runs **extract** (when enabled), **translate-ui**, optional **translate-svg**, then **translate-docs**—in the right order and with shared flags—according to your config. Chaining those three translate commands by hand is easy to get wrong (order, extract, locale flags). Use `i18n:translate:ui`, `i18n:translate:svg`, and `i18n:translate:docs` only when you need a **single** step in isolation.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## Workflow 1 - UI Translation

Designed for any JS/TS project that uses i18next: React apps, Next.js (client and server components), Node.js services, CLI tools.

<a id="step-1-initialise"></a>
### Step 1: Initialise

```bash
npx ai-i18n-tools init
```

This writes `ai-i18n-tools.config.json` with the `ui-markdown` template. Edit it to set:

- `sourceLocale` - your source language BCP-47 code (e.g. `"en-GB"`). **Must match** `SOURCE_LOCALE` exported from your runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - array of BCP-47 codes for your target languages (e.g. `["de", "fr", "pt-BR"]`). Run `generate-ui-languages` to create the `ui-languages.json` manifest from this list.
- `ui.sourceRoots` - directories or glob patterns to scan for `t("…")` calls (e.g. `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - where to write the master catalog (e.g. `"src/locales/strings.json"`).
- `ui.flatOutputDir` - where to write `de.json`, `pt-BR.json`, etc. (e.g. `"src/locales/"`).
- `ui.preferredModel` (optional) - OpenRouter model id to try **first** for `translate-ui` only; on failure the CLI continues with `openrouter.translationModels` (or legacy `defaultModel` / `fallbackModel`) in order, skipping duplicates.

<a id="step-2-extract-strings"></a>
### Step 2: Extract strings

```bash
npx ai-i18n-tools extract
```

Scans all JS/TS files under `ui.sourceRoots` for `t("literal")` and `i18n.t("literal")` calls. Writes (or merges into) `ui.stringsJson`.

The scanner is configurable: add custom function names via `ui.uiExtractor.funcNames` (or legacy `ui.reactExtractor.funcNames`). For Astro pages and components, add `.astro` to `ui.uiExtractor.extensions`.

<a id="astro-website"></a>
### Astro website (plain Astro, not Starlight)

For static Astro marketing or app sites, combine [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) with ai-i18n-tools. The reference implementation is [`examples/astro-website`](../examples/astro-website/) (see also its [README](../examples/astro-website/README.md)): English at `/`, nine target locales at `/{locale}/` (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

Most teams use a **hybrid** of two pipelines (they do not clash):

| Pipeline | Use for | Commands | Output |
|----------|---------|----------|--------|
| **Page HTML** | Headings, paragraphs, nav labels, inline arrays in the template body | `translate-docs` | `src/pages/{locale}/index.astro` per locale |
| **UI strings (`t()`)** | Frontmatter data, screenshot tab labels, shared arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (English source as key) |

Keep three lists aligned when you add or remove a language: `targetLocales` in `ai-i18n-tools.config.json`, `i18n.locales` in `astro.config.mjs` (Astro uses **lowercase** route codes such as `pt-br`), and `ui-languages.json` (via `generate-ui-languages`). Flat bundle **filenames** use config casing (`pt-BR.json`); map Astro’s `pt-br` route to that file via your manifest `code` field (see `examples/astro-website/src/i18n/locale.ts`).

Example `package.json` scripts (from the reference project):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="astro-website-ui-strings"></a>
### Astro website UI strings (SSG)

Scaffold UI extraction with `init -t ui-astro-website`, then merge in a `documentations[]` block when you also translate page HTML (see below). Wrap copy in `t('…')` in TypeScript modules and `.astro` frontmatter (and template `{expression}` blocks when you prefer UI strings over duplicated locale pages):

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

Set `sourceLocale` to match `i18n.defaultLocale` in `astro.config.mjs`. Write flat bundles to a directory Astro can import at build time (the template uses `public/locales/`). Resolve `t('…')` at **build time** by looking up the English source literal as the key (see `examples/astro-website/src/i18n/t.ts`; `strings.json` is the extraction cache, not the runtime bundle). You do **not** need `ai-i18n-tools/runtime` or i18next for a static site unless you add client islands that switch language after load.

Wire every page that calls `t()` (English root page and each `src/pages/{locale}/` copy):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Supporting helpers in the example: `src/i18n/utils.ts`, `src/i18n/locale.ts`, and `ui-languages.json` for labels, direction, and BCP-47 codes. Run `generate-ui-languages` after changing `targetLocales` (optionally set `ui.uiLanguagesPath` so the manifest lives next to your helpers, e.g. `src/i18n/ui-languages.json`). `MainLayout.astro` sets `<html lang>` and `<html dir>` from `resolveUiLanguage(Astro.currentLocale)`; `LanguagePicker.astro` uses `getRelativeLocaleUrl` from `astro:i18n`.

<a id="astro-website-parse-and-replace"></a>
### Astro website pages (parse-and-replace)

For marketing pages with hardcoded HTML in `.astro` files, let `translate-docs` extract text nodes and attributes (`alt`, `title`, `aria-label`, `placeholder`), translate them with the document cache, and write locale-specific copies under your pages tree. You do **not** need `t()` for most visible copy.

Structural attribute and key values are **not** translated by default: built-in protection covers JSX/HTML attributes such as `class`, `id`, `style`, `src`, `href`, `data-*`, and most `aria-*`, plus object keys like `class`, `key`, and `id` inside template `{expression}` blocks. Use `documentations[].protectAttributes` and `documentations[].protectKeys` to extend those lists when you use custom attributes (for example Tailwind `variant` or CMS `slug` fields). The same options apply to MDX JSX during markdown translation (see [protectAttributes / protectKeys](#protectattributes-protectkeys)).

Enable `features.translateMarkdown` and add a `documentations[]` block, for example:

```json
{
  "features": { "translateMarkdown": true },
  "documentations": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "markdownOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Run `npx ai-i18n-tools translate-docs` (or `pnpm i18n:translate` in [`examples/astro-website`](../examples/astro-website/)). English source stays at `src/pages/index.astro`; each target locale gets `src/pages/{locale}/index.astro` with imports adjusted for the extra directory level (for example `../layouts/` → `../../layouts/`).

Inside the **template body**, string literals in `{expression}` blocks (inline arrays, object `title`/`desc` fields) are translated when they are user-facing; quoted values on protected attributes/keys, literals inside `t('…')`, `<script>`, and `<style>` are left unchanged. **Frontmatter TypeScript is not translated** by this path—keep shared frontmatter (including `t()` imports and data arrays) identical on English and locale pages, or re-run `translate-docs` after editing the English page so locale copies pick up frontmatter changes. For frontmatter-only copy, use the [UI-string pipeline](#astro-website-ui-strings) instead.

See [`examples/astro-website`](../examples/astro-website/) for the full hybrid landing page (HTML via `translate-docs`, screenshot tab labels via `t()` + `translate-ui`).

<a id="step-3-translate-ui-strings"></a>
### Step 3: Translate UI strings

```bash
npx ai-i18n-tools translate-ui
```

Reads `strings.json`, sends batches to OpenRouter for each target locale, writes flat JSON files (`de.json`, `fr.json`, etc.) to `ui.flatOutputDir`. When `ui.preferredModel` is set, that model is attempted before the ordered list in `openrouter.translationModels` (document translation and other commands still use only `openrouter`).

For each entry, `translate-ui` stores the **OpenRouter model id** that successfully translated each locale in an optional `models` object (same locale keys as `translated`). Strings edited in the local `dashboard` command are marked with the sentinel value `user-edited` in `models` for that locale. The per-locale flat files under `ui.flatOutputDir` remain **source string → translation** only; they do not include `models` (so runtime bundles stay unchanged).

> **Note:** If you edit an entry in the Translation Dashboard, you need to run a `sync --force-update` (or the equivalent `translate` command with `--force-update`) to rewrite the output files with the updated cache entry. Also, keep in mind that if the source text changes later, your manual edit will be lost because a new cache key (hash) will be generated for the new source string.

<a id="exporting-to-xliff-20-optional"></a>
### Exporting to XLIFF 2.0 (optional)

To hand UI strings off to a translation vendor, TMS, or CAT tool, export the catalog as **XLIFF 2.0** (one file per target locale). This command is **read-only**: it does not modify `strings.json` or call any API.

```bash
npx ai-i18n-tools export-ui-xliff
```

By default, files are written next to `ui.stringsJson`, named like `strings.de.xliff`, `strings.pt-BR.xliff` (basename of your catalog + locale + `.xliff`). Use `-o` / `--output-dir` to write elsewhere. Existing translations from `strings.json` appear in `<target>`; missing locales use `state="initial"` with no `<target>` so tools can fill them in. Use `--untranslated-only` to export only units that still need a translation for each locale (useful for vendor batches). `--dry-run` prints paths without writing files.

<a id="step-4-wire-i18next-at-runtime"></a>
### Step 4: Wire i18next at runtime

Create your i18n setup file using the helpers exported by `'ai-i18n-tools/runtime'`:

<details>
<summary>Full i18n bootstrap example (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

#### Keeping `SOURCE_LOCALE` aligned

**Keep three values aligned:** `sourceLocale` in `ai-i18n-tools.config.json`, `SOURCE_LOCALE` in this file, and the plural flat JSON `translate-ui` writes as `{sourceLocale}.json` under your flat output dir (often `public/locales/`). Use that same basename in the static `import` (example above: `en-GB` → `en-GB.json`). The `lng` field in `sourcePluralFlatBundle` must equal `SOURCE_LOCALE`. Static ES `import` paths cannot use variables; if you change the source locale, update `SOURCE_LOCALE` and the import path together. Alternatively, load that file with a dynamic `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, or `readFileSync` so the path is built from `SOURCE_LOCALE`.

The snippet uses `./locales/…` and `./public/locales/…` as if `i18n` sits beside those folders. If your file is under `src/` (typical), use `../locales/…` and `../public/locales/…` so imports resolve to the same paths as `ui.stringsJson`, `uiLanguagesPath`, and `ui.flatOutputDir`.

Import `i18n.js` before React renders (e.g. at the top of your entry point). When the user changes language, call `await loadLocale(code)` then `i18n.changeLanguage(code)`.

`SOURCE_LOCALE` is exported so any other file that needs it (e.g. a language switcher) can import it directly from `'./i18n'`. If you are migrating an existing i18next setup, replace any hardcoded source locale strings (e.g. `'en-GB'` checks scattered across components) with imports of `SOURCE_LOCALE` from your i18n bootstrap file.

Named imports (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) work the same if you prefer not to use the default export.

#### Locale loaders

Keep `localeLoaders` **aligned with config** by deriving them from `ui-languages.json` using `makeLocaleLoadersFromManifest` (this filters out `SOURCE_LOCALE` using the same normalisation as `makeLoadLocale`). When you add a locale to `targetLocales` and run `generate-ui-languages`, the manifest is updated and your loaders automatically track the change — there is no need to maintain a separate hardcoded map.

For JSON bundles under `public/` (the typical Next.js setup), fetch from your public URL path:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

For Node CLIs without a bundler, use `readFileSync` inside a small helper that reads and parses the JSON file for each code.

#### Runtime helpers reference

`aiI18n.defaultI18nInitOptions(sourceLocale)` returns the standard options for key-as-default setups:

- `parseMissingKeyHandler` returns the key itself, so untranslated strings display the source text.
- `nsSeparator: false` allows keys that contain colons.
- `interpolation.escapeValue: false` — safe to disable: React escapes values itself, and Node.js/CLI output has no HTML to escape.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` is the **recommended** wiring for ai-i18n-tools projects: it applies key-trim + source-locale <code>"{{var}}"</code> interpolation fallback (same behaviour as the lower-level `wrapI18nWithKeyTrim`), optionally merges `translate-ui` `{sourceLocale}.json` plural suffixed keys via `addResourceBundle`, then installs plural-aware `wrapT` from your `strings.json`. Omit `sourcePluralFlatBundle` only while bootstrapping (merge it once `translate-ui` has emitted `{sourceLocale}.json`). `wrapI18nWithKeyTrim` alone is **deprecated** for application code — use `setupKeyAsDefaultT` instead.

`makeLoadLocale(i18n, loaders, sourceLocale)` returns an async `loadLocale(lang)` function that dynamically imports the JSON bundle for a locale and registers it with i18next.

<a id="using-t-in-source-code"></a>
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
- The key must be a **literal string** — no variables or expressions as the key.
- Do not use template literals for the key: <code>{'t(`Hello ${name}`)'}</code> is not extractable.

<a id="interpolation"></a>
### Interpolation

Use i18next's native second-argument interpolation for <code>"{{var}}"</code> placeholders:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

The extract command parses the **second argument** when it is a plain object literal and reads tooling-only flags such as `plurals: true` and `zeroDigit` (see **Cardinal plurals** below). For ordinary strings, only the literal key is used for hashing; interpolation options are still passed through to i18next at runtime.

If your project uses a custom interpolation utility (e.g. calling `t('key')` then piping the result through a template function like `interpolateTemplate(t('Hello {{name}}'), { name })`), `setupKeyAsDefaultT` (via `wrapI18nWithKeyTrim`) makes that unnecessary — it applies <code>"{{var}}"</code> interpolation even when the source locale returns the raw key. Migrate call sites to `t('Hello {{name}}', { name })` and remove the custom utility.

<a id="cardinal-plurals-plurals-true"></a>
### Cardinal plurals (`plurals: true`)

Use the **same literal** you want as the developer-default copy, and pass `plurals: true` so extract + `translate-ui` treat the call as one **cardinal plural group** (i18next JSON v4-style `_zero` … `_other` forms).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (optional) — tooling-only; **not** read by i18next. When `true`, prompts prefer a literal Arabic `0` in the `_zero` string for each locale where that form exists; when `false` or omitted, natural zero phrasing is used. Strip these keys before calling `i18next.t` (see `wrapT` below).

**Validation:** If the message contains **two or more** distinct `{{…}}` placeholders, **one of them must be** `{{count}}` (the plural axis). Otherwise `extract` **fails** with a clear file/line message.

**Two independent counts** (e.g. sections and pages) cannot share one plural message — use **two** `t()` calls (each with `plurals: true` and its own `count`) and concatenate in the UI.

**Not in v1:** ordinal plurals (`_ordinal_*`, `ordinal: true`), interval plurals, ICU-only pipelines.

#### How plurals are stored and emitted

**In** `strings.json` plural groups use **one row per hash** with `"plural": true`, the original literal in `source`, and `translated[locale]` as an object mapping cardinal categories (`zero`, `one`, `two`, `few`, `many`, `other`) to strings for that locale.

**Flat locale JSON:** Non-plural rows stay **source sentence → translation**. Plural rows are emitted as `<groupId>_original` (equals `source`, for reference) and `<groupId>_<form>` for each suffix so i18next resolves plurals natively. `translate-ui` also writes `{sourceLocale}.json` containing **only** plural flat keys (load this bundle for the source language so suffixed keys resolve; plain strings still use key-as-default). For each target locale, emitted suffix keys match `Intl.PluralRules` for that locale (`requiredCldrPluralForms`): if `strings.json` omitted a category because it matched another after compaction (e.g. Arabic `many` same as `other`), `translate-ui` still writes every required suffix into the flat file by copying from a fallback sibling string so runtime lookup never misses a key.

Runtime (`ai-i18n-tools/runtime`): **Call** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — it runs `wrapI18nWithKeyTrim`, registers the optional `translate-ui` `{sourceLocale}.json` plural bundle, then `wrapT` using `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` strips `plurals` / `zeroDigit`, rewrites the key to the group id when needed, and forwards `count` (optional: if there is a single non-`{{count}}` placeholder, `count` is copied from that numeric option).

**Older environments:** `Intl.PluralRules` is required for tooling and for consistent behaviour; polyfill if you target very old browsers.

<a id="language-switcher-ui"></a>
### Language switcher UI

Use the `ui-languages.json` manifest to build a language selector. `ai-i18n-tools` exports two display helpers:

<details>
<summary>Example LanguageSelect component (React)</summary>

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

</details>

<br />

`getUILanguageLabel(lang, t)` - shows `t(englishName)` when translated, or `englishName / t(englishName)` when both differ. Suitable for settings screens.

`getUILanguageLabelNative(lang)` - shows `englishName / label` (no `t()` call on each row). Suitable for header menus where you want the native name visible.

The `ui-languages.json` manifest is a JSON array of <code>"{ code, label, englishName, direction }"</code> entries (`direction` is `"ltr"` or `"rtl"`). Example:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

The manifest is generated by `generate-ui-languages` from `sourceLocale` + `targetLocales` and the bundled master catalog. It is written to `ui.flatOutputDir`. If you change any of the locales in the configuration, run `generate-ui-languages` to update the `ui-languages.json` file.

<a id="rtl-languages"></a>
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

<a id="workflow-2---document-translation"></a>
## Workflow 2 - Document Translation

Designed primarily for **markdown and MDX documentation** under `contentPaths` (the pages readers care about). On Docusaurus sites you can also translate **JSON label files** produced by `docusaurus write-translations` — those carry theme, navbar, footer, and plugin UI strings (shell i18n), distinct from body copy in `docs/`. For PNG and other raster images embedded in markdown, see [Images and raster assets in translated docs](#images-and-raster-assets-in-translated-docs). For an optional **language switcher** block in README or docs with `markdownOutput.style = "flat"`, see [Language switcher (`languageListBlock`)](#language-list-block). SVG files are translated via [`translate-svg`](#cli-reference) when `features.translateSVG` is enabled and the top-level `svg` block is set — not via `documentations[].contentPaths`.

<a id="step-1-initialise-for-documentation"></a>
### Step 1: Initialise for documentation

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

For Astro Starlight documentation sites:

```bash
npx ai-i18n-tools init -t ui-starlight
```

For plain Astro website UI (no Starlight):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

That template enables UI extraction only. For page HTML translation, also set `features.translateMarkdown` and add a `documentations[]` block (see [Astro website pages (parse-and-replace)](#astro-website-parse-and-replace)). The [`examples/astro-website`](../examples/astro-website/) config shows both pipelines together.

Edit the generated `ai-i18n-tools.config.json`:

- `sourceLocale` - source language (must match `defaultLocale` in `docusaurus.config.js`).
- `targetLocales` - array of BCP-47 locale codes (e.g. `["de", "fr", "es"]`).
- `cacheDir` - shared SQLite cache directory for all documentation pipelines (and default log directory for `--write-logs`).
- `documentations` - array of documentation blocks. Each block has optional `description`, `contentPaths`, `outputDir`, optional `jsonSource`, `markdownOutput`, optional `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, etc.
- `documentations[].description` - optional short note for maintainers (what this block covers). When set, it appears in the `translate-docs` headline (`🌐 …: translating …`) and in `status` section headers.
- `documentations[].contentPaths` - markdown/MDX source directories or files (see also `documentations[].jsonSource` for JSON labels).
- `documentations[].outputDir` - translated output root for that block.
- `documentations[].markdownOutput.style` - `"nested"` (default), `"flat"`, `"doc-system"`, or aliases `"docusaurus"` / `"astro-starlight"` (see [Output layouts](#output-layouts)).

**Primary vs supplementary:** Focus authoring and translation effort on `contentPaths` — that output is the localized documentation. `jsonSource` is for teams that localize the **Docusaurus shell**; run `docusaurus write-translations` when you upgrade Docusaurus or change navbar, footer, or theme strings so source catalogs under the default locale folder stay current. You can set `features.translateJSON` to `false` if you only need translated pages and will handle UI strings another way.

<a id="step-2-translate-documents"></a>
### Step 2: Translate documents

```bash
npx ai-i18n-tools translate-docs
```

This translates all files in every `documentations` block’s `contentPaths` to all effective documentation locales (union of each block’s `targetLocales` when set, otherwise root `targetLocales`). Already-translated segments are served from the SQLite cache — only new or changed segments are sent to the LLM.

To translate a single locale:

```bash
npx ai-i18n-tools translate-docs --locale de
```

To check what needs translating:

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### Complex Markdown and failed quality checks

`translate-docs` checks that each translated segment preserves markdown structure (including emphasis parsed from the document). Paragraphs that stack many `bold` spans around `` `inline code` ``, nest backticks inside bold (for example template literals such as `` `fetch(\`/locales/${code}.json\`)` ``), or weave bold and code through one long sentence are fragile: some locales need different word order, which can change how `**` and `` ` `` line up after translation and trigger CLI errors such as `AST mismatch`.

**If you hit that kind of validation failure, prefer simplifying the source language text**—split the paragraph, move an example into a fenced code block, or describe the same idea with fewer layered bold/code pairs—rather than expecting every model and locale to reproduce dense inline markup perfectly. Elsewhere on this page (notably Step 4’s notes on `SOURCE_LOCALE`, loaders, and `public/` paths), the formatting is intentionally realistic; when you reuse similar wording in your own docs, keep it simpler when you translate broadly.

To see **which segments failed**, how often, and the stored **quality / error messages**, use the Translation Dashboard’s **Failures** tab ([Translation Dashboard → Failures](#failures-document-translation)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Cache behaviour and `translate-docs` flags

The CLI keeps **file tracking** in SQLite (source hash per file × locale) and **segment** rows (hash × locale per translatable chunk). A normal run skips a file entirely when the tracked hash matches the current source **and** the output file already exists; otherwise it processes the file and uses the segment cache so unchanged text does not call the API.


| Flag                          | Effect                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(default)*                   | Skip unchanged files when tracking + on-disk output match; use segment cache for the rest.                                                                                                                                                                          |
| `-l, --locale <codes>`        | Comma-separated target locales (when omitted, defaults match the union of root `targetLocales` and each `documentations[]` block’s optional `targetLocales`).                                                                                                       |
| `-p, --path` / `-f, --file`   | Only translate markdown/JSON under this path (project-relative, absolute, or glob pattern); `--file` is an alias for `--path`.                                                                                                                                      |
| `--dry-run`                   | No file writes and no API calls.                                                                                                                                                                                                                                    |
| `--type <kind>`               | Restrict to `markdown` or `json` (otherwise both when enabled in config).                                                                                                                                                                                           |
| `--json-only` / `--no-json`   | Translate only JSON label files, or skip JSON and translate markdown only.                                                                                                                                                                                          |
| `-j, --concurrency <n>`       | Max parallel target locales (default from config or CLI built-in default).                                                                                                                                                                                          |
| `-b, --batch-concurrency <n>` | Max parallel batch API calls per file (docs; default from config or CLI).                                                                                                                                                                                           |
| `--emphasis-placeholders`     | Mask markdown emphasis markers as placeholders before translation (optional; default off).                                                                                                                                                                          |
| `--debug-failed`              | Write detailed `FAILED-TRANSLATION` logs under `cacheDir` when validation fails.                                                                                                                                                                                    |
| `--force-update`              | Re-process every matched file (extract, reassemble, write outputs) even when file tracking would skip. **Segment cache still applies** — unchanged segments are not sent to the LLM.                                                                                |
| `--force`                     | Clears file tracking for each processed file and **does not read** the segment cache for API translation (full re-translation). New results are still **written** to the segment cache.                                                                             |
| `--stats`                     | Print segment counts, tracked file counts, and per-locale segment totals, then exit.                                                                                                                                                                                |
| `--clear-cache [locale]`      | Delete cached translations (and file tracking): all locales, or a single locale, then exit.                                                                                                                                                                         |
| `--prompt-format <mode>`      | How each **batch** of segments is sent to the model and parsed (`xml`, `json-array`, or `json-object`). Default `json-array`. Does not change extraction, placeholders, validation, cache, or fallback behaviour — see [Batch prompt format](#batch-prompt-format). |


You cannot combine `--force` with `--force-update` (they are mutually exclusive).

<a id="batch-prompt-format"></a>
#### Batch prompt format

`translate-docs` sends translatable segments to OpenRouter in **batches** (grouped by `batchSize` / `maxBatchChars`). The `--prompt-format` flag only changes that batch’s **wire format**; `PlaceholderHandler` tokens, markdown AST checks, SQLite cache keys, and per-segment fallback when batch parsing fails are unchanged.

| Mode                   | User message                                                           | Model reply                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: one `<seg id="N">…</seg>` per segment (with XML escaping). | Only `<t id="N">…</t>` blocks, one per segment index.       |
| `json-array` (default) | A JSON array of strings, one entry per segment in order.               | A JSON array of the **same length** (same order).           |
| `json-object`          | A JSON object `{"0":"…","1":"…",…}` keyed by segment index.            | A JSON object with the **same keys** and translated values. |

The run header also prints `Batch prompt format: …` so you can confirm the active mode. JSON label files (`jsonSource`) and SVG file batches use the same setting when those steps run as part of `translate-docs` (or `sync`’s docs phase — `sync` does not expose this flag; it defaults to `json-array`).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Segment dedupe and paths in SQLite

> **Note:** This section covers internal cache key details useful for debugging `cleanup` behaviour or custom tooling. Most users can skip it.

- Segment rows are keyed globally by `(source_hash, locale)` (hash = normalised content). Identical text in two files shares one row; `translations.filepath` is metadata (last writer), not a second cache entry per file.
- `file_tracking.filepath` uses namespaced keys: `doc-block:{index}:{relPath}` per `documentations` block (`relPath` is project-root-relative posix: markdown paths as collected; **JSON label files use the cwd-relative path to the source file**, e.g. `docs-site/i18n/en/code.json`, so cleanup can resolve the real file), and `svg-files:{relPath}` for SVG files under `translate-svg`.
- `translations.filepath` stores cwd-relative posix paths for markdown, JSON, and SVG segments (SVG uses the same path shape as other assets; the `svg-files:…` prefix is **only** on `file_tracking`).
- After a run, `last_hit_at` is cleared only for segment rows **in the same translate scope** (respecting `--path` and enabled kinds) that were not hit, so a filtered or docs-only run does not mark unrelated files stale.

<a id="output-layouts"></a>
### Output layouts

`markdownOutput.style` controls where translated markdown files are written. Use the exact string values below in `documentations[].markdownOutput.style` (aliases are preset layouts, not separate engines).

`markdownOutput.style = "nested"` (default when omitted) — mirrors the source tree under `{outputDir}/{locale}/` (e.g. `docs/guide.md` → `i18n/de/docs/guide.md`).

`markdownOutput.style = "doc-system"` — locale-prefixed documentation tree for static docs sites. Files under `docsRoot` are written to `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`. Paths outside `docsRoot` fall back to the nested layout. Set `documentations[].markdownOutput.docsRoot` to your English source root (e.g. `"docs"` or `"src/content/docs"`). When `markdownOutput.style = "doc-system"`, you must set `localeSubpath` explicitly (use an alias below for presets).

**Aliases** (same layout engine, preset `localeSubpath`):

- `markdownOutput.style = "docusaurus"` — `localeSubpath` defaults to `docusaurus-plugin-content-docs/current` (Docusaurus i18n plugin layout).
- `markdownOutput.style = "astro-starlight"` — `localeSubpath` defaults to `""` (translated pages directly under `{outputDir}/{locale}/`, matching [Starlight](https://starlight.astro.build/guides/i18n/) when English lives at the content root and `outputDir` equals `docsRoot`).

Docusaurus preset (primary documentation pages):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight preset (same block shape, different paths):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Optional JSON labels — Docusaurus shell strings from `jsonSource` (not MDX body copy):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight ships UI strings for many locales; optional custom UI overrides use `src/content/i18n/en.json` with `jsonPathTemplate: "{outputDir}/{locale}.json"` in a separate `documentations[]` block when needed.

`markdownOutput.style = "flat"` — places translated files next to the source with a locale suffix, or in a subdirectory. Relative links between pages are rewritten automatically when `markdownOutput.style = "flat"` (unless `rewriteRelativeLinks: false` or a custom `pathTemplate` is set).

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-markdownoutputstyle--flat"></a>
#### Anchor links when `markdownOutput.style = "flat"`

When `markdownOutput.style = "flat"`, output rewrites **relative paths** between pages for each locale (`guide.md` → `guide.de.md`). **Anchor links** — the usual markdown inline form with a `#` after the path — jump to a section inside the target file:

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

Here the link target is `setup.md`, and `#first-run` is the anchor: it should scroll to the right heading inside that file.

**Why anchor links need attention**

- `rewriteRelativeLinks` fixes the **filename** for each locale (`setup.md` → `setup.de.md`).
- Many renderers derive the `#` slug from the **visible heading text**. After translation, headings differ per locale, so an auto-generated slug can change while the rewritten link might still say `#first-run` — or your English `#…` anchor no longer matches the slug the renderer builds from the translated heading.
- Result: readers land on the right **file** but the **wrong line**, or the browser finds no matching heading.

**What to do**

1. Run `ai-i18n-tools write-heading-ids` on your source `.md` / `.mdx` before `translate-docs` (same `documentations[]` / `contentPaths` as usual). It inserts explicit HTML anchors on the line before each heading so `id` values are shared by every translated copy. Re-run it after renaming headings so stale anchor ids are refreshed to match the current title.
2. Point your markdown **anchor links** at those stable ids, e.g. `[label](other.md#section-id)`, where `section-id` matches the anchor the tool wrote — not a guess from English words alone.

**Example**

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` after `write-heading-ids` (simplified):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

After `translate-docs`, file paths and `#…` anchors stay aligned in every locale file, for example:

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

The `#tls-configuration` anchor is the same in all locales because the `id` is fixed in the source; only the heading **text** and the link **label** are translated.

<a id="images-and-raster-assets-in-translated-docs"></a>
#### Images and raster assets in translated docs

`translate-docs` translates markdown segments including image alt text. It does not copy raster files (PNG, JPEG, WebP, GIF) into your documentation `outputDir`. You must place screenshot files where the translated URLs will point, or use `postProcessing.regexAdjustments` to rewrite the paths after translation.

For SVG files with translatable text, use the `svg` block and `translate-svg` — see [`svg`](#svg).

See the [Locale assets guide](LOCALE-ASSETS-GUIDE.md) for the full decision guide, all patterns with config examples and directory layouts, screenshot-script contracts, design recommendations, and common mistakes.

**Quick reference — five patterns**

| Pattern                      | Use for                                               | Mechanism                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — Shared raster            | Single image, no per-locale variants                  | `regexAdjustments` full-path fix                  |
| B — Per-locale folder        | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/docs | `regexAdjustments` locale-segment swap            |
| C — Docusaurus colocated     | `markdownOutput.style = "docusaurus"` sites | Screenshot script places files; no regex          |
| D — Translated SVG           | Web apps embedding SVG illustrations                  | `translate-svg` with `svg.style = "flat"`         |
| E — Colocated translated SVG | `markdownOutput.style = "docusaurus"` docs          | `translate-svg` with `svg.style = "nested"` + `pathTemplate` |

**The flat link rewriter and two-step flow**

When `markdownOutput.style = "flat"`, a built-in rewriter runs before `postProcessing`. It computes the depth prefix per output file — the relative path from the output file's directory back to the source file's directory — and prepends it to non-markdown asset URLs. `postProcessing` then runs on the already-prefixed URL — write `search` patterns that match the locale segment within it, not the leading `../` prefix.

With `flatPreserveRelativeDir: true`, source files in subdirectories get a file-specific prefix automatically. For example, `docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md` produces a prefix of `../../docs/`, so `translation-dashboard.png` (a sibling of the source) becomes `../../docs/translation-dashboard.png` — resolved correctly without any `postProcessing` rule.

When `markdownOutput.style` is `"docusaurus"`, `"astro-starlight"`, `"nested"`, or any value other than `"flat"`, the flat link rewriter does not run. `postProcessing` sees the original markdown URL.

**Pattern A example** — no config required for relative-path assets alongside source files when `markdownOutput.style = "flat"`. Pattern A `postProcessing` rules are only needed for absolute-URL assets (e.g. `/img/...`) or CDN-targeted replacements.

**Pattern B example — `markdownOutput.style = "flat"` README** (`examples/nextjs-app`, second `documentations[]` block)

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Use the generic `[^/]+` form, not a hardcoded source locale, so the rule keeps working if `sourceLocale` ever changes.

**Pattern B example — `markdownOutput.style = "docusaurus"`** (`examples/nextjs-app`, first `documentations[]` block)

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**Pattern C — Docusaurus colocated** (no `regexAdjustments` needed)

Place en-GB screenshots in `static/assets/` and create a symlink `docs/assets → ../static/assets`. The `take-screenshots` script writes other locales directly to `i18n/<locale>/…/current/assets/`. All docs in all locales reference `../assets/name.png` — the path is stable and no URL rewriting is required.

**Pattern D example** (`examples/nextjs-app`, `svg.style = "flat"`)

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → per-locale files under `public/assets/`. App references by locale: `<img src={`/assets/icon.${locale}.svg`} />`.

**Minimal README-only example** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` translates `README.md` to `translated-docs/` with [language switcher post-processing](#language-list-block) only. No image rules are defined — appropriate when the README has no sibling raster files or only uses absolute URLs your host already serves.

Replacement templates support placeholders such as `${translatedLocale}` and `${translatedBasedir}` (full list in the `markdownOutput.postProcessing.regexAdjustments` row in [Configuration reference](#configuration-reference)).

<a id="language-switcher-languagelistblock"></a>
#### Language switcher (`languageListBlock`)

Use `markdownOutput.postProcessing.languageListBlock` when translated markdown files should include a **“Read in other languages”** row of links — one link per locale, with `href` values computed relative to each output file.

This repository uses it for [README.md](../README.md) and [docs/GETTING_STARTED.md](./GETTING_STARTED.md). After `translate-docs`, each translated copy gets a refreshed block; for example [translated-docs/docs/GETTING_STARTED.de.md](../translated-docs/docs/GETTING_STARTED.de.md) links to sibling locale files under `translated-docs/docs/` and back to the English source at `../../docs/GETTING_STARTED.md`.

**1. Mark the block in source markdown**

Wrap the switcher in HTML (or any lines) bounded by `start` and `end` substring markers. This repo uses:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](./GETTING_STARTED.md) · [Deutsch](../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

The initial link text is only a placeholder. `translate-docs` replaces the whole slice from the first line containing `start` through the first later line containing `end` (markers inside fenced code blocks are ignored so config examples in the same file do not match).

**2. Configure the block**

`start` and `end` are arbitrary substring markers — they do not have to be `<small id="lang-list">` / `</small>`. Pick any opening and closing text that appears only on the language-switcher slice: another HTML tag (`<div class="lang-switcher">` … `</div>`), HTML comments (`<!-- lang-list -->` … `<!-- /lang-list -->`), or markdown-only boundaries (for example a line `**Languages:**` through a line `---`). Set `start` and `end` in config to match exactly what you put in the source file.

Root config ([ai-i18n-tools.config.json](../ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Field       | Role                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Substring that identifies the opening line of the block                                                  |
| `end`       | Substring on the closing line (can be the same line as `start` when both appear on one line)             |
| `separator` | Text between generated `[label](href)` links (this repo uses `" · "`)                                    |
| `label`     | Optional: `"local"` (default) uses each locale endonym from the manifest; `"english"` uses `englishName` |

**3. What happens at runtime**

1. **Extraction** — the language-list slice is **not** sent to the model (`translatable: false`).
2. **Per translated file** — after segment translation and optional flat link rewriting, `postProcessing` rebuilds the block: one markdown link per locale, labels from `ui-languages.json` when present (else bundled master catalog, else `localeDisplayNames`), paths relative to the file being written.
3. **Source refresh** — at the end of a `translate-docs` / `sync` docs pass, the same canonical block is written back into **English source files** in `contentPaths` so adding a locale updates the switcher in the repo without hand-editing every link.

If a file has no matching block, the CLI logs a warning (when `--verbose`) and leaves the body unchanged.

**4. Label manifest**

For endonym labels (`label: "local"`), generate or maintain `ui-languages.json` via `generate-ui-languages` (see [`uiLanguagesPath`](#uilanguagespath-optional)). This repo’s docs-only config has no UI pipeline, so labels come from the bundled master catalog for `sourceLocale` + `targetLocales`.

**5. Examples in this repository**

| Example                            | Files                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This package (flat docs + subdirs) | [ai-i18n-tools.config.json](../ai-i18n-tools.config.json) (`markdownOutput.style = "flat"`), [README.md](../README.md), [docs/GETTING_STARTED.md](./GETTING_STARTED.md), outputs under [translated-docs/](../translated-docs/) |
| Minimal README-only                | [examples/console-app/ai-i18n-tools.config.json](../examples/console-app/ai-i18n-tools.config.json) (`markdownOutput.style = "flat"`), [examples/console-app/README.md](../examples/console-app/README.md)                     |
| Flat README + Docusaurus docs      | [examples/nextjs-app/ai-i18n-tools.config.json](../examples/nextjs-app/ai-i18n-tools.config.json) (second block: `markdownOutput.style = "flat"`; first block: `markdownOutput.style = "docusaurus"`)                                                     |

The line immediately before `<small id="lang-list">` (for example `**Read in other languages:**`) is a normal translatable segment and is localized in each target locale; only the link row inside the markers is regenerated verbatim apart from `href` and manifest-driven labels.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` placeholders

Override where translated files are written by setting `documentations[].markdownOutput.pathTemplate` (markdown and MDX) or `jsonPathTemplate` (JSON label files). Both accept the same placeholders. Resolved paths must stay inside that block’s `outputDir` (the CLI rejects paths that escape it).

If you use a custom `pathTemplate`, `rewriteRelativeLinks` defaults to `false` unless you set it explicitly — relative link rewriting is built for `markdownOutput.style = "flat"` without a custom template.

| Placeholder            | Role                                                                                                       | Example                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Absolute resolved path of this documentation block’s `outputDir`                                           | `/home/acme/repo/i18n`                                           |
| `{locale}`             | Target locale code (same form as in config / CLI)                                                          | `de`, `pt-BR`                                                    |
| `{LOCALE}`             | Same locale uppercased                                                                                     | `DE`, `PT-BR`                                                    |
| `{relPath}`            | Source file path relative to the project root, POSIX `/`                                                   | `docs/guide.md`, `README.md`                                     |
| `{stem}`               | File name **without** extension                                                                            | `guide` for `docs/guide.md`                                      |
| `{basename}`           | File name **with** extension                                                                               | `guide.md`                                                       |
| `{extension}`          | Extension **including** the dot                                                                            | `.md`, `.mdx`                                                    |
| `{docsRoot}`           | Absolute resolved path of `markdownOutput.docsRoot` (default `docs` if omitted)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` with a matching `docsRoot` prefix removed when path strings align (POSIX); otherwise unchanged | `docs/guide.md` (common); `guide.md` only when stripping applies |

**Example**

Config snippet:

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

For locale `de` and source `docs/guide.md`, with project root `/home/acme/repo` and `outputDir` resolving to `/home/acme/repo/i18n`, the expanded path is:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

With `markdownOutput.style = "flat"` and no custom `pathTemplate`, a common pattern keeps only the file name via `{stem}` and `{extension}`, for example `{outputDir}/{stem}.{locale}{extension}`, which yields `…/guide.de.md` under the resolved `outputDir`.

<a id="troubleshooting"></a>
### Troubleshooting

**Section anchor links do not work in translated docs**

A link like `[label](other.md#section-id)` may open the correct translated file but fail to scroll to the intended heading — or jump to the wrong section. The `#…` fragment no longer matches any heading `id` in that locale.

Common causes:

- Source headings never had explicit anchor ids; the site derives slugs from visible heading text, which changes after translation.
- You renamed a heading in source but the preceding `<a id="…"></a>` line is missing or still has the old id.
- Anchor links use a `#…` fragment guessed from English words instead of the id `write-heading-ids` would generate.

**Fix**

1. Run `ai-i18n-tools write-heading-ids` on your **source** `.md` / `.mdx` (same `documentations[]` / `contentPaths` as `translate-docs`). It inserts `<a id="slug"></a>` before each ATX heading, or refreshes an existing anchor when the heading text no longer matches the current slug.
2. Point anchor links at those ids — e.g. `[setup](guide.md#first-run)` where `#first-run` matches the anchor line above the target heading, not a slug inferred from the English title alone.
3. Re-run `translate-docs` (or `sync --force-update`) so every locale copy includes the updated anchor lines.

Use `--dry-run` on `write-heading-ids` first to preview changes. See [Anchor links in flat layout](#anchor-links-when-markdownoutputstyle--flat) for the full pattern.

---

<a id="combined-workflow-ui--docs"></a>
## Combined workflow (UI + Docs)

Enable all features in a single config to run both workflows together:

<details>
<summary>Example combined UI + docs config</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
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
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "markdownOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` points document translation at the same `strings.json` catalog as the UI so terminology stays consistent; `glossary.userGlossary` adds CSV overrides for product terms.

Run `npx ai-i18n-tools sync` to run one pipeline: **extract** UI strings (if `features.extractUIStrings`), **translate UI** strings (if `features.translateUIStrings`), **translate SVG files** (if `features.translateSVG` and a `svg` block are set), then **translate documentation** (each `documentations` block: markdown/JSON as configured). Skip parts with `--no-ui`, `--no-svg`, or `--no-docs`. The docs step accepts `--dry-run`, `-p` / `--path`, `--force`, and `--force-update` (the last two only apply when documentation translation runs; they are ignored if you pass `--no-docs`).

Use `documentations[].targetLocales` on a block to translate that block’s files to a **smaller subset** than the UI (effective documentation locales are the **union** across blocks):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-markdownoutputstyle--docusaurus--flat"></a>
### Mixed documentation workflow (`markdownOutput.style = "docusaurus"` + `"flat"`)

You can combine multiple documentation pipelines in the same config by adding more than one entry in `documentations`. This is a common setup when a project has a Docusaurus site (`markdownOutput.style = "docusaurus"`) plus root-level markdown files (for example, a repository readme with `markdownOutput.style = "flat"`) that should be translated with locale-suffixed filenames.

<details>
<summary>Example mixed Docusaurus + flat README config</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with markdownOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

How this runs with `npx ai-i18n-tools sync`:

- UI strings are extracted/translated from `src/` into `public/locales/`.
- The first docs block translates **markdown** from `docs-site/docs/` into `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (localized documentation pages).
- With `features.translateJSON` and `jsonSource`, that same block also translates **Docusaurus shell JSON** under `docs-site/i18n/en/` into each target locale folder — navbar, footer, and theme/plugin catalogs, not MDX body copy.
- The second docs block translates `README.md` into locale-suffixed files under `translated-docs/` (`markdownOutput.style = "flat"`).
- All docs blocks share `cacheDir`, so unchanged segments are reused across runs to reduce API calls and cost.

---

<a id="translation-dashboard"></a>
## Translation Dashboard

Run:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

This starts a local web UI backed by your configured `cacheDir` SQLite database—the same folder the CLI uses for documentation segments, logs, and related metadata. It includes the tabs **Documentation** (cached doc segments), **UI strings**, **UI plurals**, **Glossary**, **Failures**, **Markdown issues**, and **Statistics**.

![Translation Dashboard](translation-dashboard.png)

If you **edit cache rows** in this app (for example documentation segments), run `sync --force-update` or the equivalent translate command with `--force-update` so on-disk outputs match the cache; if **source text** in the repo changes later, segment hashes change and manual edits for the old text are superseded.

<a id="failures-document-translation"></a>
### Failures (document translation)

The **Failures** tab is for **documentation** translation only. It reads failure records written to SQLite when a segment could not be translated successfully for a locale—for example empty or invalid model output, post-translation validation errors (`AST mismatch`, placeholder leaks, and similar **quality** checks), or a **fatal** condition that blocked progress. It helps you answer: *which source segment broke, for which locale and model, and what error text was recorded?*

<a id="when-to-use-it"></a>
#### When to use it

- After `translate-docs` or `sync` finishes with errors, partial locales, or confusing logs—you can sort and filter failures instead of scrolling terminal output alone.
- When you want to **prioritise rework**: sort by **# Failures** so segments that failed repeatedly across retries appear first; those are strong candidates to **simplify or reformat** in the source markdown so future runs succeed.
- When you need the **exact segment**—filepath, line hint, source hash, and full source text—to edit the right paragraph in your repo.

<a id="why-source-edits-matter"></a>
#### Why source edits matter

Dense inline markup (**bold** mixed with `` `code` ``, nested emphasis, long sentences with many spans) makes it harder for models to return translations that still pass structural checks. Segments with **multiple recorded failures** usually improve more from **rewriting or splitting** the source (or moving examples into fenced code blocks) than from re-running translation on unchanged text. That aligns with [Complex Markdown and failed quality checks](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### How to use the tab

1. Open **Failures** in the dashboard (same browser session as [Translation Dashboard](#translation-dashboard)).
2. Read the **summary** strip (segments with any failure, plus counts for segments with **1**, **2**, or **3+** failure records).
3. Filter by partial **filename**, **locale**, **model**, **quality error** (values come from your cache), **fatal only**, and optional **source hash**, **source text**, or **error message** substring—then click **Apply**.
4. Choose **Sort: # Failures** (default) or **Sort: filepath + line #**.
5. Use pagination at the top or bottom of the table. **Click a row** to toggle full source text. The link control in the row (when enabled) asks the server process to log file/line hints to the **terminal** where `ai-i18n-tools dashboard` is running—useful for jumping from the browser to your editor.
6. Fix the **source file** in your project, then run `translate-docs` or `sync` again. If the list looks **out of date** after a successful run, run `ai-i18n-tools sync --force-update` and reload the dashboard (the Failures panel shows the same hint).

For file-based debugging alongside the UI, you can still use `translate-docs --debug-failed` to write `FAILED-TRANSLATION` detail under `cacheDir` during retries—see [Cache behaviour and `translate-docs` flags](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Markdown issues (static checks)

The **Markdown issues** tab lists rows from the `markdown_source_issues` SQLite table. Each row is a **pre-translation** finding: for example delimiter runs that never pair as emphasis/strikethrough under the same CommonMark-style rules `translate-docs` uses for masking, an inline code span opened with backticks but never closed, `STRONG_OUTSIDE_INLINE_CODE` when `**` / `__` wrap a `` `...` `` span (put emphasis inside the backticks or use plain code), or `STRONG_OUTSIDE_LINK` when `**` / `__` wrap a `[text](url)` link (put bold inside the link text only). This is **not** the same as **Failures**, which records per-locale model output and post-translation validation problems (`AST mismatch`, placeholder leaks, and similar).

Use this tab when you want to fix **source markdown** before spending tokens—especially when quality checks keep failing on structure. Filter by filepath (partial match against the cache key, including `doc-block:{index}:` prefixes), **issue code**, or **source hash**; sort by filepath + line or by newest scan time. The link button logs file/line hints to the terminal where `ai-i18n-tools dashboard` is running (same idea as the Documentation tab).

**Refreshing rows:** run `ai-i18n-tools check-markdown` (optional `-p` / `--path` scope, `--no-cache` to skip SQLite, `--json` for machine-readable output on stdout with human lines on stderr). By default each `translate-docs` markdown file run also rescans and replaces rows for that file when `documentations[].warnMarkdownSourceIssues` is not set to `false`. Clearing all translations for a cache filepath removes markdown issue rows for that filepath as part of the same cleanup path as failures.

---

<a id="configuration-reference"></a>
## Configuration reference

<a id="sourcelocale"></a>
### `sourceLocale`

BCP-47 code for the source language (e.g. `"en-GB"`, `"en"`, `"pt-BR"`). No translation file is generated for this locale — the key string itself is the source text.

**Must match** `SOURCE_LOCALE` exported from your runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Array of BCP-47 locale codes to translate to (e.g. `["de", "fr", "es", "pt-BR"]`).

`targetLocales` is the primary locale list for UI translation and the default locale list for documentation blocks. Use `generate-ui-languages` to build the `ui-languages.json` manifest from `sourceLocale` + `targetLocales`.

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (optional)

Path to the `ui-languages.json` manifest used for display names, locale filtering, and language-list post-processing. When omitted, the CLI looks for the manifest at `ui.flatOutputDir/ui-languages.json`.

Use this when:

- The manifest lives outside `ui.flatOutputDir` and you need to point the CLI at it explicitly.
- You want [language switcher post-processing](#language-list-block) (`languageListBlock`) to build locale labels from the manifest.
- `extract` should merge `englishName` entries from the manifest into `strings.json` (requires `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (optional)

Maximum **target locales** translated at the same time (`translate-ui`, `translate-docs`, `translate-svg`, and the matching steps inside `sync`). If omitted, the CLI uses **4** for UI translation and **3** for documentation translation (built-in defaults). Override per run with `-j` / `--concurrency`.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (optional)

**translate-docs** and **translate-svg** (and the documentation step of `sync`): maximum parallel OpenRouter **batch** requests per file (each batch can contain many segments). Default **4** when omitted. Ignored by `translate-ui`. Override with `-b` / `--batch-concurrency`. On `sync`, `-b` applies to the documentation translation step only.

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

Segment batching for document translation: how many segments per API request, and a character ceiling. Defaults: **20** segments, **4096** characters (when omitted).

<a id="openrouter"></a>
### `openrouter`

- `baseUrl`
  OpenRouter API base URL. Default: `https://openrouter.ai/api/v1`.
- `translationModels`
  Preferred ordered list of model IDs. The first is tried first; later entries are fallbacks on error. For `translate-ui` only, you can also set `ui.preferredModel` to try one model before this list (see `ui`).
- `defaultModel`
  Legacy single primary model. Used only when `translationModels` is unset or empty.
- `fallbackModel`
  Legacy single fallback model. Used after `defaultModel` when `translationModels` is unset or empty.
- `maxTokens`
  Max completion tokens per request. Default: `8192`.
- `temperature`
  Sampling temperature. Default: `0.2`.
- `requestTimeoutMs`
  Maximum time in milliseconds to wait for each HTTP request to OpenRouter (chat completions and internal `GET /models` calls). Default: `30000` (30 seconds).

**Why use multiple models:** Different providers and models have varying costs and offer different levels of quality across languages and locales. Configure `openrouter.translationModels` **as an ordered fallback chain** (rather than a single model) so the CLI can attempt the next model if a request fails.

Treat the list below as a **baseline** that you can expand: if translation for a specific locale is poor or unsuccessful, research which models support that language or script effectively (refer to online resources or your provider’s documentation), and add those OpenRouter IDs as further alternatives.

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
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

Set `OPENROUTER_API_KEY` in your environment or `.env` file.

Before changing `translationModels`, run `npx ai-i18n-tools check-models` to verify each configured model id against OpenRouter’s live catalog (`GET /models`). It reports ids that are missing or past `expiration_date`, lists valid models with estimated input/output pricing (USD per 1M tokens), and exits with a non-zero status when any configured id is invalid. Requires `OPENROUTER_API_KEY`.

<a id="features"></a>
### `features`


| Field                | Workflow | Description                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | Scan source for `t("…")` / `i18n.t("…")`, merge optional `package.json` description and (if enabled) `ui-languages.json` `englishName` values into `strings.json`. |
| `translateUIStrings` | 1        | Translate `strings.json` entries and write per-locale JSON files.                                                                                                  |
| `translateMarkdown`  | 2        | Translate `.md` / `.mdx`  files (flat or Docusaurus documents).                                                                                                    |
| `translateJSON`      | 2        | Docusaurus label JSON from `docusaurus write-translations` (theme/nav/footer/plugin UI), **not** markdown page bodies.                                             |
| `translateSVG`       | 2        | Translate `.svg` files (requires the top-level `svg` block).                                                                                                       |

**Translate** SVG files with `translate-svg` when `features.translateSVG` is true and a top-level `svg` block is configured. The `sync` command runs that step when both are set (unless `--no-svg`).

<a id="ui"></a>
### `ui`


- `sourceRoots`  
  Directories or glob patterns (relative to cwd) scanned for `t("…")` calls. Supports patterns like `src/` or `["src/**/*.ts"]`.
- `stringsJson`  
  Path to the master catalog file. Updated by `extract`.
- `flatOutputDir`  
  Directory where per-locale JSON files are written (`de.json`, etc.).
- `preferredModel`  
  Optional. OpenRouter model id tried first for `translate-ui` only; then `openrouter.translationModels` (or legacy models) in order, without duplicating this id.
- `uiExtractor.funcNames` (or legacy `reactExtractor.funcNames`)  
  Additional function names to scan (default: `["t", "i18n.t"]`).
- `uiExtractor.extensions` (or legacy `reactExtractor.extensions`)  
  File extensions to include (default: `[".js", ".jsx", ".ts", ".tsx"]`). Add `.astro` for Astro frontmatter and template expressions.
- `uiExtractor.includePackageDescription` (or legacy `reactExtractor.includePackageDescription`)  
  When `true` (default), `extract` also includes `package.json` `description` as a UI string when present.
- `uiExtractor.packageJsonPath` (or legacy `reactExtractor.packageJsonPath`)  
  Custom path to the `package.json` file used for that optional description extraction.
- `uiExtractor.includeUiLanguageEnglishNames` (or legacy `reactExtractor.includeUiLanguageEnglishNames`)

  When `true` (default `false`), `extract` also adds each `englishName` from the manifest at `uiLanguagesPath` to `strings.json` when not already present from the source scan (same hash keys). Requires `uiLanguagesPath` pointing at a valid `ui-languages.json`.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite cache directory (shared by all `documentations` blocks). Reuse across runs. If you are migrating from a custom doc translation cache, archive or delete it — `cacheDir` creates its own SQLite database and is not compatible with other schemas.


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

<a id="documentations"></a>
### `documentations`

Array of documentation pipeline blocks. `translate-docs` and the docs phase of `sync` **process each** block in order.

**Content sources**

- `description`
Optional human-readable note for this block (not used for translation). Prefixed in the `translate-docs` `🌐` headline when set; also shown in `status` section headers.
- `contentPaths`
Markdown/MDX page bodies and `.astro` templates to translate (`translate-docs` scans these for `.md`, `.mdx`, and `.astro`). Supports **directory paths or glob patterns** (e.g. `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). That is where localized documentation prose comes from.
- `sourceFiles`
Optional alias merged into `contentPaths` at load.
- `targetLocales`
Optional subset of locales for this block only (otherwise root `targetLocales`). Effective documentation locales are the union across blocks.
- `jsonSource`
Optional. Source directory for Docusaurus JSON label catalogs for this block (e.g. `"i18n/en"` from `docusaurus write-translations`). Page bodies always come from `contentPaths`; `jsonSource` only supplies shell/UI JSON, not MDX.

**Output layout**

- `outputDir`
Root directory for translated output for this block.
- `markdownOutput.style`
`"nested"` (default), `"flat"`, `"doc-system"`, or aliases `"docusaurus"` / `"astro-starlight"`.
- `markdownOutput.localeSubpath`
Path segment between `{locale}/` and `{relativeToDocsRoot}` for `doc-system` (required when using `style: "doc-system"` directly; preset when using an alias). Use `""` for Starlight-style locale folders.
- `markdownOutput.docsRoot`
Source docs root for Docusaurus layout (e.g. `"docs"`).
- `markdownOutput.pathTemplate`
Custom markdown output path. Placeholders: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `markdownOutput.jsonPathTemplate`
Custom JSON output path for label files. Supports the same placeholders as `pathTemplate`.
- `markdownOutput.flatPreserveRelativeDir`
When `markdownOutput.style = "flat"`, keep source subdirectories so files with the same basename do not collide.
- `markdownOutput.rewriteRelativeLinks`
Rewrite relative links after translation (auto-enabled when `markdownOutput.style = "flat"` and no custom `pathTemplate`).
- `markdownOutput.linkRewriteDocsRoot`
Repo root used when computing flat-link rewrite prefixes. Usually leave this as `"."` unless your translated docs live under a different project root.

**Post-processing**

- `markdownOutput.postProcessing`
Optional transforms on the translated **markdown body** (YAML keys and non-prose front matter values are preserved). Runs after segment reassembly and flat link rewriting, and before `addFrontmatter`.
- `markdownOutput.postProcessing.regexAdjustments`
Ordered list of `{ "description"?, "search", "replace" }`. `search` is a regex pattern (plain string uses flag `g`, or `/pattern/flags`). `replace` supports placeholders such as `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
- `markdownOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — regenerates a bounded "read in other languages" link row in source and translated markdown. See [Language switcher (`languageListBlock`)](#language-list-block) for setup, behaviour, and repository examples.

**Behaviour and metadata**

- `translateFrontmatterFields`
Same level as `markdownOutput` (per `documentations[]` block). Default `true`: translate user-facing YAML prose for Starlight/Docusaurus (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next` labels). Set `false` to keep the entire front matter block unchanged; pass a string array to restrict to specific dot-paths.
- `segmentSplitting`
Same level as `markdownOutput` (per `documentations[]` block). Optional finer-grained segments for `translate-docs` extraction: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. When `enabled` is `true` (default when `segmentSplitting` is omitted), dense paragraphs, GFM pipe tables (first chunk includes header, separator, and first data row), and long lists are split; sub-parts rejoin with single newlines (`tightJoinPrevious`). Set `"enabled": false` to use one segment per blank-line-delimited body block only.
- `warnMarkdownSourceIssues`
When `true` (default when omitted), each `translate-docs` run rescans markdown segments for risky delimiters / unclosed inline code, prints terminal warnings, and replaces `markdown_source_issues` rows for that file's cache filepath. Set `false` to skip warnings and SQLite updates for this block.
- `addFrontmatter`
When `true` (default when omitted), translated markdown files include YAML keys: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, and when at least one segment has model metadata, `translation_models` (sorted list of OpenRouter model ids used). Set to `false` to skip.

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

**Example (`markdownOutput.style = "flat"` — screenshot paths + optional language list wrapper):**

<details>
<summary>Flat layout postProcessing example (screenshots + languageListBlock)</summary>

```json
"markdownOutput": {
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

<a id="svg"></a>
### `svg`

Top-level paths and layout for SVG files. Translation runs only when `features.translateSVG` is true (via `translate-svg` or the SVG stage of `sync`).

| Field            | Description                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | One or more directories **or glob patterns** (e.g. `"images/*.svg"`, `"**/icons/*.svg"`). The patterns are resolved relative to the project root and scanned recursively for `.svg` files.                                                                         |
| `outputDir`      | Root directory for translated SVG output.                                                                                                                                                                                                                          |
| `style`          | `"flat"` or `"nested"` when `pathTemplate` is unset.                                                                                                                                                                                                               |
| `pathTemplate`   | Custom SVG output path. Placeholders: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `forceLowercase` | Lower-case translated text on SVG reassembly. Useful for designs that rely on all-lowercase labels.                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Field          | Description                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Path to `strings.json` - auto-builds a glossary from existing translations.                                                                                                 |
| `userGlossary` | Path to a CSV with columns `Original language string` (or `en`), `locale`, `Translation` - one row per source term and target locale (`locale` may be `*` for all targets). |


**Generate an empty glossary CSV:**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI reference

| Command                                                                                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                | Print CLI version and build timestamp (same information as `-V` / `--version` on the root program).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website] [-o path] [--with-translate-ignore]` | Write a starter config file (includes `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, and `documentations[].addFrontmatter`). `--with-translate-ignore` creates a starter `.translate-ignore`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `check-models`                                                                           | Validate each configured OpenRouter model id against `GET /models` (catalog membership, `expiration_date`, USD per 1M tokens for prompt/completion). Requires `OPENROUTER_API_KEY`. Exits non-zero when any configured id is missing or expired. Respects `openrouter.requestTimeoutMs` for the catalog request.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `extract`                                                                                | Update `strings.json` from `t("…")` / `i18n.t("…")` literals, optional `package.json` description, and optional manifest `englishName` entries (see `ui.reactExtractor`). Requires `features.extractUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `generate-ui-languages [--master <path>] [--dry-run]`                                    | Write `ui-languages.json` to `ui.flatOutputDir` (or `uiLanguagesPath` when set) using `sourceLocale` + `targetLocales` and the bundled `data/ui-languages-complete.json` (or `--master`). Warns and emits `TODO` placeholders for locales missing from the master file. If you have an existing manifest with customised `label` or `englishName` values, they will be replaced by master catalog defaults — review and adjust the generated file afterwards.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                       | Translate markdown/MDX and JSON for each `documentations` block (`contentPaths`, optional `jsonSource`). `-j`: max parallel locales; `-b`: max parallel batch API calls per file. `--prompt-format`: batch wire format (`xml` \| `json-array` \| `json-object`). See [Cache behaviour and `translate-docs` flags](#cache-behaviour-and-translate-docs-flags) and [Batch prompt format](#batch-prompt-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …`                                                                    | Requires at least one `documentations[]` block. Collects `.md` / `.mdx` under each block’s `contentPaths` (honours `.translate-ignore`). Inserts an HTML anchor line `<a id="slug"></a>` immediately **before** each flat ATX `#` heading (skips headings inside fenced code blocks); when an anchor line is already present, updates the `id` if it no longer matches the slug derived from the current heading text. `-p` / `--path` or `-f` / `--file`: limit to a project-relative file or directory. `--slug-style`: `github` (default; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. With `pymdown`, optional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run`: list changes only.                                                                                                                                                                                                                                                                                                                                    |
| `strip-md-bold-inline …`                                                                 | Requires at least one `documentations[]` block. Strips `**` around inline code in `.md` / `.mdx` under each block’s `contentPaths` (honours `.translate-ignore`). `-p` / `--path` or `-f` / `--file`, `--dry-run`, `--no-backup` (skip timestamped `.backup.*` before overwrite).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `check-markdown …`                                                                       | Scans markdown/MDX under each `documentations[]` block’s `contentPaths` (same discovery as `translate-docs`, honours `.translate-ignore`): delimiter pairing, unclosed inline code, and `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK` when `**`/`__` wrap a `` `...` `` span or a `[text](url)` link. `-p` / `--path` or `-f` / `--file`: optional scope. Prints `relativePath:line: [ISSUE_CODE] message` lines to **stderr**; exit code **1** if any issue. `--json`: JSON report on **stdout**. Writes `markdown_source_issues` in `cacheDir` unless `--no-cache`. `-v` adds source hashes to stderr lines.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                        | Translate SVG files configured in `config.svg` (separate from docs). Requires `features.translateSVG`. Same cache ideas as docs; supports `--no-cache` to skip SQLite reads/writes for that run. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                               | Translate UI strings only (`strings.json` → locale JSON). `-l` / `--locale`: comma-separated target locales (default from config / `ui-languages.json`). `--force`: re-translate all entries per locale (ignore existing translations). `--dry-run`: no writes, no API calls. `-j`: max parallel locales. Requires `features.translateUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                    | Extract (if `features.extractUIStrings` is enabled), then translate UI strings (if `features.translateUIStrings` is enabled). UI-only — no documentation or SVG. Same `-l`, `--force`, `--dry-run`, and `-j` options as `translate-ui`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                    | Runs `extract` **first** (requires `features.extractUIStrings`) so `strings.json` matches source, then LLM review of **source-locale** UI strings (spelling, grammar). **Terminology hints** come from `glossary.userGlossary` CSV only (same scope as `translate-ui` — not `strings.json` / `uiGlossary`, so bad copy is not reinforced as glossary). Uses OpenRouter (`OPENROUTER_API_KEY`). Advisory only (exit **0** when the run completes). Writes `lint-source-results_<timestamp>.log` under `cacheDir` as a **human-readable** report (summary, issues, and per-string **OK** rows); the terminal prints summary counts and issues only (no `[ok]` lines per string). Prints the log filename on the last line. `--json`: full machine-readable JSON report on stdout only (log file stays human-readable). `--dry-run`: still runs `extract`, then prints batch plan only (no API calls). `--chunk`: strings per API batch (default **50**). `-j`: max parallel batches (default `concurrency`). With `--json`, human-style output goes to stderr. Links use `path:line` like the `dashboard` UI strings “link” button. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`              | Export `strings.json` to XLIFF 2.0 (one `.xliff` per target locale). `-o` / `--output-dir`: output directory (default: same folder as the catalog). `--untranslated-only`: only units missing a translation for that locale. Read-only; no API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                 | Extract (if enabled), then UI translation, then `translate-svg` when `features.translateSVG` and `config.svg` are set, then documentation translation — unless skipped with `--no-ui`, `--no-svg`, or `--no-docs`. Shared flags: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (docs batching only), `--force` / `--force-update` (docs only; mutually exclusive when docs run). Docs phase also forwards `--emphasis-placeholders` and `--debug-failed` (same meaning as `translate-docs`). `--prompt-format` is not a `sync` flag; the docs step uses the built-in default (`json-array`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `status [--max-columns <n>]`                                                             | When `features.translateUIStrings` is on, prints UI coverage per locale (`Translated` / `Missing` / `Total`). Then prints markdown translation status per file × locale (no `--locale` filter; locales come from config). Large locale lists are split into repeated tables of up to `n` locale columns (default **9**) so lines stay narrow in the terminal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                         | Print documentation cache and `strings.json` statistics (same aggregates as Translation Dashboard → **Statistics**). `--max-columns`: max locale columns per model × locale table (default matches the dashboard).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                                    | Runs `sync --force-update` first (extract, UI, SVG, docs), then removes stale segment rows (null `last_hit_at` / empty filepath); drops `file_tracking` rows whose resolved source path is missing on disk; removes translation rows whose `filepath` metadata points at a missing file. Logs three counts (stale, orphaned `file_tracking`, orphaned translations). Creates a timestamped SQLite backup under the cache dir unless `--no-backup`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                               | **No config.** Walks a directory tree (default: cwd) for `*.log` and `cache.db.backup*.sqlite`, prints `./…` paths like `find -print`. With matches: prompts `Delete these files? (y/n)` unless `-f` / `--force` (delete without prompt). With no matches: exits without prompting. `--dry-run`: list only, no prompt or deletes (overrides `--force`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                      | Launch the Translation Dashboard (local web UI for cache segments, `strings.json`, glossary, failures, and statistics). With `--no-open`, the default browser is not opened automatically. The deprecated alias `editor` still works but prints a warning.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `glossary-generate [-o <path>]`                                                          | Write an empty `glossary-user.csv` template. `-o`: override the output path (default: `glossary.userGlossary` from config, or `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                         | Display help for a subcommand (same output as `ai-i18n-tools <command> --help`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Root and global options

| Option                       | Scope         | Description                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | Root program  | Output version number and build timestamp (same information as the `version` subcommand). |
| `-h` / `--help`              | Root program  | Display help for the root program or for a subcommand when used with a command name.      |
| `-c` / `--config <path>`     | Every command | Config file path (default: `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | Every command | Verbose logging.                                                                          |
| `-w` / `--write-logs [path]` | Every command | Tee console output to a `.log` file (default path: under root `cacheDir`).                |

### Per-command help

| Usage                            | Description                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | All options for that command.      |
| `ai-i18n-tools help <command>`   | Same output as `<command> --help`. |

### Target locales (`-l` / `--locale`)

| Commands                                                                                | Behaviour                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — comma-separated target BCP-47 codes (e.g. `de,fr,pt-BR`). When omitted, defaults come from config and `ui-languages.json`. |
| `lint-source`                                                                           | `-l` / `--locale <code>` — single source locale to review (default: config `sourceLocale`).                                                            |

---

<a id="environment-variables"></a>
## Environment variables

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **Required.** Your OpenRouter API key.                     |
| `OPENROUTER_BASE_URL`  | Override the API base URL.                                 |
| `I18N_SOURCE_LOCALE`   | Override `sourceLocale` at runtime.                        |
| `I18N_TARGET_LOCALES`  | Comma-separated locale codes to override `targetLocales`.  |
| `I18N_LOG_LEVEL`       | Logger level (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | When `1`, disable ANSI colours in log output.              |
| `I18N_LOG_SESSION_MAX` | Max lines kept per log session (default `5000`).           |


