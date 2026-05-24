<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

CLI and toolkit for internationalising JavaScript/TypeScript applications and documentation sites using large language models via [OpenRouter](https://openrouter.ai/). Two independent workflows: **UI Translation** extracts `t("…")` calls and writes locale-ready JSON for i18next; **Document Translation** translates markdown, MDX, and SVG files with a smart SQLite cache so only changed segments are re-sent to the LLM.


<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](./README.md) · [Deutsch](./translated-docs/README.de.md) · [Español](./translated-docs/README.es.md) · [Français](./translated-docs/README.fr.md) · [हिन्दी](./translated-docs/README.hi.md) · [日本語](./translated-docs/README.ja.md) · [한국어](./translated-docs/README.ko.md) · [Português (Brasil)](./translated-docs/README.pt-BR.md) · [中文 (中国大陆)](./translated-docs/README.zh-CN.md) · [中文 (台灣)](./translated-docs/README.zh-TW.md)</small>

<small>Translated READMEs and docs are committed under [`translated-docs/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) on GitHub; the npm package ships English `docs/` only.</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents** 

- [Two core workflows](#two-core-workflows)
- [Installation](#installation)
  - [Using the CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [Quick start](#quick-start)
  - [Workflow 1 - UI Translation](#workflow-1---ui-translation)
  - [Workflow 2 - Document Translation](#workflow-2---document-translation)
  - [Both workflows](#both-workflows)
- [Runtime helpers](#runtime-helpers)
- [CLI commands](#cli-commands)
- [Documentation](#documentation)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->





<a id="two-core-workflows"></a>
## Two core workflows

**Workflow 1 - UI Translation** — for any JS/TS project using i18next (React, Next.js, Node.js, CLIs)

Scans source files for `t("…")` / `i18n.t("…")` literals, builds a master catalog (`strings.json`), translates missing entries per locale via OpenRouter, and writes flat JSON files (`de.json`, `pt-BR.json`, …) ready for i18next.

**Workflow 2 - Document Translation** — for markdown/MDX docs (Docusaurus, Astro Starlight, plain README files) and `.astro` page HTML (plain Astro marketing sites)

Translates `.md`, `.mdx`, and `.astro` source files to every target locale with a shared SQLite cache — only new or changed segments are sent to the LLM. Optional Docusaurus shell JSON (`jsonSource`, from `write-translations`) covers navbar, footer, and theme UI strings. SVG file translation is enabled via `features.translateSVG` and the top-level `svg` block. For plain Astro sites, see [`examples/astro-website`](examples/astro-website/) (hybrid: `translate-docs` for page HTML plus `t()` for frontmatter strings).

Both workflows share a single `ai-i18n-tools.config.json` file and can be used independently or together.

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
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

**Zero-install one-off** — `npx ai-i18n-tools <cmd>` or `pnpm dlx ai-i18n-tools <cmd>` (downloads for that invocation only).

> **Tip:** To run `ai-i18n-tools` bare in an interactive shell without `npx`, add `node_modules/.bin` to your `PATH` (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). See [Getting Started](docs/GETTING_STARTED.md#installation) for direnv and Windows instructions.

Set your OpenRouter API key:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

Commands that call OpenRouter (`translate-ui`, `translate-docs`, `sync`, `check-models`, and related scripts) need `OPENROUTER_API_KEY` in the environment. `check-markdown` does not use OpenRouter.

In `ai-i18n-tools.config.json`, the `openrouter` object includes model lists, `baseUrl`, `maxTokens`, `temperature`, and `requestTimeoutMs`: the maximum time in milliseconds to wait for each HTTP request to OpenRouter (chat completions and internal `GET /models` calls). The default is `30000` (30 seconds).

Run `ai-i18n-tools check-models` to verify each configured model id against OpenRouter’s live catalog. It reports ids that are missing or past `expiration_date`, lists valid models with estimated input/output pricing (USD per 1M tokens), and exits with a non-zero status when any configured id is invalid. It requires `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Quick start

<a id="workflow-1---ui-translation"></a>
### Workflow 1 - UI Translation

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Then wire i18next in your app using the helpers from `'ai-i18n-tools/runtime'`. See [Step 4: Wire i18next at runtime](docs/GETTING_STARTED.md#step-4-wire-i18next-at-runtime) in the Getting Started guide for the full setup.

<a id="workflow-2---document-translation"></a>
### Workflow 2 - Document Translation

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website (UI + optional page HTML): npx ai-i18n-tools init -t ui-astro-website

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### Both workflows

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## Runtime helpers

The following helpers are exported from `'ai-i18n-tools/runtime'` and work in any JavaScript environment. You do not need to import i18next to use them:

| Helper                                                                 | Description                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | Standard i18next init options for key-as-default setups.                                                                               |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })`   | Recommended wiring: key-trim + plural `wrapT` from `strings.json`, optionally merges `translate-ui` `{sourceLocale}.json` plural keys. |
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
ai-i18n-tools help [command]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]
ai-i18n-tools check-models
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools lint-source …
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status [--max-columns <n>]
ai-i18n-tools statistics [--max-columns <n>]
ai-i18n-tools dashboard
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]
ai-i18n-tools glossary-generate
```


Complete per-command flag lists are in [Getting Started — CLI reference](docs/GETTING_STARTED.md#cli-reference). Run `ai-i18n-tools <command> --help` for built-in usage text.

Global options on every command: `-c <config>` (default: `ai-i18n-tools.config.json`), `-v` (verbose), optional `-w` / `--write-logs [path]` to tee console output to a log file (default: under the translation cache directory), `-V` / `--version`, and `-h` / `--help`. See [Getting Started](docs/GETTING_STARTED.md#cli-reference) for the command overview table.

---

<a id="documentation"></a>
## Documentation

- [Getting Started](docs/GETTING_STARTED.md) - full setup guide for both workflows, CLI reference, and config field reference.
- [Locale assets guide](docs/LOCALE-ASSETS-GUIDE.md) - screenshots and illustrated SVGs in translated docs (Patterns A–E, flat link rewriter, screenshot scripts).
- [Package Overview](docs/PACKAGE_OVERVIEW.md) - architecture, internals, programmatic API, and extension points.
- [AI Agent Context](docs/ai-i18n-tools-context.md) - **for apps using the package:** integration prompts for downstream projects (copy into your repo’s agent rules).
- Maintainer internals for **this** repository: `dev/package-context.md` (clone-only; not on npm).

---

<a id="license"></a>
## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
