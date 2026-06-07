<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

A CLI and toolkit for internationalizing JavaScript/TypeScript applications and documentation sites using large language models via [OpenRouter](https://openrouter.ai/). Three modular workflows, all sharing a single config file, support different translation needs:

- **Workflow 1 — UI Translation:** Extracts `t("…")` calls from JS/TS (and optionally from `.astro` files) and generates flat, per-locale JSON for i18next or static SSG lookup.
- **Workflow 2 — Document Translation:** Translates markdown, MDX, and `.astro` pages (for websites and Starlight) listed in `docs[].contentPaths` using `translate-docs`.
- **Workflow 3 — JSON File Translation:** Translates arbitrary nested JSON bundles defined in `json[]`. Use `translate-json` when UI copy is stored in per-locale JSON files instead of using `t()` in source.

**SVG** assets are translated using `features.translateSVG`, the top-level `svg` block, and `translate-svg`—not `docs[].contentPaths`.

**Which workflow should I use?**
- Source uses `t()` → **Workflow 1** (`extract` / `translate-ui`)
- Localized pages or Docusaurus catalog JSON → **Workflow 2** (`translate-docs`)
- Only standalone, nested JSON locale files → **Workflow 3** (`translate-json`)

All workflows maintain a file/SQLite cache to ensure that only new or changed segments (strings or text chunks) are sent to the LLM.

<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](./README.md) · [Deutsch](./translated-docs/README.de.md) · [Español](./translated-docs/README.es.md) · [Français](./translated-docs/README.fr.md) · [हिन्दी](./translated-docs/README.hi.md) · [日本語](./translated-docs/README.ja.md) · [한국어](./translated-docs/README.ko.md) · [Português (Brasil)](./translated-docs/README.pt-BR.md) · [中文 (中国大陆)](./translated-docs/README.zh-CN.md) · [中文 (台灣)](./translated-docs/README.zh-TW.md)</small>


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents** 

- [Core workflows](#core-workflows)
- [Installation](#installation)
  - [Using the CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [Quick start](#quick-start)
  - [Workflow 1 - UI Translation](#workflow-1---ui-translation)
  - [Workflow 2 - Document Translation](#workflow-2---document-translation)
  - [Astro (plain Astro & Starlight)](#astro-plain-astro--starlight)
  - [Combined workflow](#combined-workflow)
- [Runtime helpers](#runtime-helpers)
- [CLI commands](#cli-commands)
- [Documentation](#documentation)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->





<a id="core-workflows"></a>
## Core workflows

**Workflow 1 - UI Translation** — for any JS/TS project using i18next (React, Next.js, Node.js, CLIs) or static Astro SSG

Scans source files for `t("…")` / `i18n.t("…")` literals (add `.astro` to `ui.uiExtractor.extensions` for Astro frontmatter and template expressions), builds a master catalog (`strings.json`), translates missing entries per locale via OpenRouter, and writes flat JSON files (`de.json`, `pt-BR.json`, …). English source text is the runtime lookup key in those bundles — `strings.json` is the extraction cache, not the runtime bundle.

**Workflow 2 - Document Translation** — for markdown, MDX, and `.astro` under `docs[].contentPaths`

Designed primarily for **markdown, MDX, and `.astro` documentation** (Docusaurus, [Astro Starlight](https://starlight.astro.build/), plain README files, and plain Astro marketing pages). `translate-docs` writes localised copies with a shared SQLite cache. On Docusaurus sites, set `docs[].docusaurusCatalogDir` to the `write-translations` catalog folder so shell JSON (navbar, footer, theme strings) is translated in the same command. `docs[].docsOutput.style` supports `"nested"`, `"flat"`, `"doc-system"`, and aliases `"docusaurus"` / `"astro-starlight"` (see [Output layouts](docs/GETTING_STARTED.md#output-layouts) in Getting Started). Arbitrary nested UI JSON that is not a Docusaurus catalog belongs in Workflow 3 (`json[]` / `translate-json`), not `docs[]`.

**Workflow 3 - JSON file translation** — nested locale JSON without `t()` in source

Translate files such as `src/i18n/en/translation.json` via top-level `json[]`, `features.translateJson`, and `translate-json`. Scaffold with `init -t ui-json-bundles`.

All workflows share `ai-i18n-tools.config.json` and can be combined; `sync` runs extract, UI translation, translate SVG, `translate-docs`, and `translate-json` in order according to your `features` flags.

---

<a id="installation"></a>
## Installation

The published package is **ESM-only** (`"type": "module"`). Node.js `>=22.16.0` required.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### Using the CLI

**Per-project (recommended)** — install as a dev dependency, then run via `npx`, `pnpm exec`, or a `package.json` script:

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

You can also use the ai-i18n-tools CLI commands directly, for instance `ai-i18n-tools sync`.


Prefer `sync` over hand-chaining `extract`, `translate-ui`, `translate-svg`, `translate-docs`, and `translate-json` — order and feature flags are easy to get wrong when run manually. See [Recommended `package.json` scripts](docs/GETTING_STARTED.md#recommended-packagejson-scripts) in Getting Started.

**Zero-install one-off** — `npx ai-i18n-tools <cmd>` or `pnpm dlx ai-i18n-tools <cmd>` (downloads for that invocation only).

> **Tip:** To run `ai-i18n-tools` bare in an interactive shell without `npx`, add `node_modules/.bin` to your `PATH` (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). See [Getting Started](docs/GETTING_STARTED.md#installation) for direnv and Windows instructions.

Set your OpenRouter API key:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

Commands that call OpenRouter (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models`, and related scripts) need `OPENROUTER_API_KEY` in the environment. `check-markdown` does not use OpenRouter.

In `ai-i18n-tools.config.json`, the `openrouter` object includes model lists, `baseUrl`, `maxTokens`, `temperature`, and `requestTimeoutMs`: the maximum time in milliseconds to wait for each HTTP request to OpenRouter (chat completions and internal `GET /models` calls). The default is `30000` (30 seconds).

Run `ai-i18n-tools check-models` to verify each configured model id against OpenRouter’s live catalog. It reports ids that are missing or past `expiration_date`, lists valid models with estimated input/output pricing (USD per 1M tokens), and exits with a non-zero status when any configured id is invalid. It requires `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Quick start

<a id="workflow-1---ui-translation"></a>
### Workflow 1 - UI Translation

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Then wire i18next in your app using the helpers from `'ai-i18n-tools/runtime'`. See [Step 4: Wire i18next at runtime](docs/GETTING_STARTED.md#step-4-wire-i18next-at-runtime) in the Getting Started guide for the full setup.

<a id="workflow-2---document-translation"></a>
### Workflow 2 - Document Translation

The default `init` template (`ui-markdown`) enables UI extraction only. Use a docs-oriented template (or enable `features.translateDocs` and add `docs[]`) before `translate-docs`:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

Edit `ai-i18n-tools.config.json`: set `docs[].contentPaths` to markdown, MDX, and/or `.astro` sources; `docs[].outputDir` and `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"flat"`, etc.). Full field reference: [Workflow 2 - Document Translation](docs/GETTING_STARTED.md#workflow-2---document-translation).

<a id="astro-plain-astro--starlight"></a>
### Astro (plain Astro & Starlight)

**Astro Starlight** — `init -t ui-starlight`, then `translate-docs`. Starlight UI overrides can use `src/content/i18n/en.json` with `jsonPathTemplate` in a separate `docs[]` block when needed ([Getting Started → Workflow 2](docs/GETTING_STARTED.md#step-1-initialise-for-documentation)).

**Plain Astro** (marketing or app sites, not Starlight) — combine [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) with ai-i18n-tools. Reference project: [`examples/astro-website`](examples/astro-website/) (English at `/`, locales at `/{locale}/`).

Most teams use a **hybrid** of two pipelines:

| Pipeline | Use for | Commands | Output |
|----------|---------|----------|--------|
| **Page HTML** | Headings, paragraphs, nav labels, inline arrays in the template body | `translate-docs` | `src/pages/{locale}/index.astro` per locale |
| **UI strings (`t()`)** | Frontmatter data, tab labels, shared arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (English source as key) |

Scaffold UI with `init -t ui-astro-website`. For hardcoded HTML in `.astro` pages, enable `features.translateDocs` and add a `docs[]` block with `docsOutput.style: "astro-starlight"` (see [Astro website pages (parse-and-replace)](docs/GETTING_STARTED.md#astro-website-pages-parse-and-replace)). Keep `targetLocales`, `i18n.locales` in `astro.config.mjs`, and `ui-languages.json` aligned (Astro routes use lowercase codes such as `pt-br`; flat bundle filenames follow config casing, e.g. `pt-BR.json`).

Wire `t()` at build time without i18next unless you add client islands — see [Astro website UI strings (SSG)](docs/GETTING_STARTED.md#astro-website-ui-strings-ssg) and the example’s `src/i18n/t.ts`.

<a id="combined-workflow"></a>
### Combined workflow

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## Runtime helpers

The following helpers are exported from `'ai-i18n-tools/runtime'` and work in any JavaScript environment. You do not need to import i18next to use them:

| Helper                                                                 | Description                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | Standard i18next init options for key-as-default setups.                                                                               |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })`   | Recommended wiring: key-trim + plural `wrapT` from `strings.json`, optionally merges `translate-ui` `{sourceLocale}.json` plural keys. |
| `wrapT(i18n, options)`                                                 | Lower-level plural-aware `t()` wrapper (usually installed by `setupKeyAsDefaultT`).                                                    |
| `buildPluralIndexFromStringsJson(entries)`                               | Builds the plural group index `wrapT` uses from catalog rows with `"plural": true`.                                                    |
| `extractInterpolationNamesForWrap(key)`                                  | Parses `{{var}}` names from a source key for `wrapT` / key-trim fallback.                                                              |
| `wrapI18nWithKeyTrim(i18n)`                                            | Lower-level key-trim wrapper only (deprecated for app wiring; prefer `setupKeyAsDefaultT`).                                            |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Builds the `localeLoaders` map for `makeLoadLocale` from `ui-languages.json` (every `code` except `sourceLocale`).                     |
| `makeLoadLocale(i18n, loaders, sourceLocale)`                          | Factory for async locale file loading.                                                                                                 |
| `getTextDirection(lng)`                                                | Returns `'ltr'` or `'rtl'` for a BCP-47 code.                                                                                          |
| `applyDirection(lng, element?)`                                        | Sets `dir` attribute on `document.documentElement`.                                                                                    |
| `getUILanguageLabel(lang, t)`                                          | Display label for a language menu row (with i18n).                                                                                     |
| `getUILanguageLabelNative(lang)`                                       | Display label without calling `t()` (header-style).                                                                                    |
| `interpolateTemplate(str, vars)`                                       | Low-level `{{var}}` substitution on a plain string (used internally; app code should use `t()` instead).                               |
| `flipUiArrowsForRtl(text, isRtl)`                                      | Flip `→` to `←` for RTL layouts.                                                                                                       |

---

<a id="cli-commands"></a>
## CLI commands

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```


Complete per-command flag lists are in [Getting Started — CLI reference](docs/GETTING_STARTED.md#cli-reference). Run `ai-i18n-tools <command> --help` for built-in usage text.

Global options on every command: `-c <config>` (default: `ai-i18n-tools.config.json`), `-v` (verbose), optional `-w` / `--write-logs [path]` to tee console output to a log file (default: under the translation cache directory), `-V` / `--version`, and `-h` / `--help`. Several commands accept `-l` / `--locale <codes>` (comma-separated BCP-47) to limit target locales; `lint-source` uses a single source locale. See [Getting Started](docs/GETTING_STARTED.md#cli-reference) for the command overview table.

---

<a id="documentation"></a>
## Documentation

- [Getting Started](docs/GETTING_STARTED.md) - full setup for all workflows (UI, docs/`.astro`, JSON bundles, Astro Starlight and plain Astro), CLI reference, and config field reference.
- [Locale assets guide](docs/LOCALE-ASSETS-GUIDE.md) - screenshots and illustrated SVGs in translated docs (Patterns A–E, flat link rewriter, screenshot scripts).
- [Package Overview](docs/PACKAGE_OVERVIEW.md) - architecture, internals, programmatic API, and extension points.
- [AI Agent Context](docs/ai-i18n-tools-context.md) - **for apps using the package:** integration prompts for downstream projects (copy into your repo’s agent rules).
- Maintainer internals for **this** repository: `dev/package-context.md` (clone-only; not on npm).

---

<a id="license"></a>
## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
