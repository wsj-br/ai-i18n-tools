<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

CLI and toolkit for internationalizing JavaScript/TypeScript applications and documentation sites. Extracts UI strings, translates them using large language models via OpenRouter, and generates locale-ready JSON files for i18next. For documentation, it translates markdown and MDX under `contentPaths` (the localized pages readers open). Optional Docusaurus label JSON from `jsonSource` covers site shell strings (`write-translations` catalogs such as theme/nav/footer), distinct from page body copy. SVG file translation uses `features.translateSVG` and the top-level `svg` block.


<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](./README.md) · [Deutsch](./translated-docs/README.de.md) · [Español](./translated-docs/README.es.md) · [Français](./translated-docs/README.fr.md) · [हिन्दी](./translated-docs/README.hi.md) · [日本語](./translated-docs/README.ja.md) · [한국어](./translated-docs/README.ko.md) · [Português (Brasil)](./translated-docs/README.pt-BR.md) · [中文 (中国大陆)](./translated-docs/README.zh-CN.md) · [中文 (台灣)](./translated-docs/README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents** 

- [Two core workflows](#two-core-workflows)
- [Installation](#installation)
  - [Using the CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [Quick start](#quick-start)
  - [Workflow 1 - UI strings](#workflow-1---ui-strings)
  - [Workflow 2 - Documentation](#workflow-2---documentation)
  - [Both workflows](#both-workflows)
- [Runtime helpers](#runtime-helpers)
- [CLI commands](#cli-commands)
- [Documentation](#documentation)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->





<a id="two-core-workflows"></a>
## Two core workflows

**Workflow 1 - UI Translation** (React, Next.js, Node.js, any i18next project)

Builds a master catalog (`strings.json` with optional per-locale `models` metadata) from `t("…")` / `i18n.t("…")` **literals**, optionally `package.json` `description`, and optionally each `englishName` from `ui-languages.json` when enabled in config. Translates missing entries per locale via OpenRouter and writes flat JSON files (`de.json`, `pt-BR.json`, …) ready for i18next.

**Workflow 2 - Document translation** (Markdown / MDX, optional Docusaurus shell JSON)

Translates `.md` and `.mdx` from each `documentations` block’s `contentPaths` — that is the localized documentation. When `features.translateJSON` and `jsonSource` are set, it also translates Docusaurus **label JSON** (navbar, footer, theme/plugin UI from `write-translations`), not MDX body text. Supports Docusaurus-style and flat locale-suffixed layouts per block (`documentations[].markdownOutput`). Shared root `cacheDir` holds the SQLite cache so only new or changed segments are sent to the LLM. **SVG:** enable `features.translateSVG`, add the top-level `svg` block, then use `translate-svg` (also run from `sync` when both are set).

Both workflows share a single `ai-i18n-tools.config.json` file and can be used independently or together. SVG file translation uses `features.translateSVG` plus the top-level `svg` block and runs through `translate-svg` (or the SVG stage inside `sync`).

---

<a id="installation"></a>
## Installation

The published package is **ESM-only** (`"type": "module"`). Use `import` from Node.js, bundlers, or `import()` — `require('ai-i18n-tools')` **is not supported.** The package declares `engines.node`  `>=22.16.0`; older Node.js versions are unsupported.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### Using the CLI

**Per-project (recommended)** — install as a dependency or devDependency, then call via `npx`, `pnpm exec`, or a `package.json` script:

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

The package manager writes `node_modules/.bin/ai-i18n-tools` with the correct permissions on Linux and macOS and `.cmd` / `.ps1` shims on Windows; script runners pick it up automatically.

**Bare** `ai-i18n-tools` **in the terminal:** `package.json` scripts already run with `node_modules/.bin` on `PATH`, so commands like `pnpm run i18n:sync` invoke the CLI without typing `npx`. To run `ai-i18n-tools` directly in an interactive shell (from the project root, after a local install), prepend the local bin directory to `PATH`:

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

---

<a id="openrouter"></a>
## OpenRouter

Commands that call OpenRouter (`translate-ui`, `translate-docs`, `sync`, `check-models`, and related scripts) need `OPENROUTER_API_KEY` in the environment. `check-markdown` does not use OpenRouter.

In `ai-i18n-tools.config.json`, the `openrouter` object includes model lists, `baseUrl`, `maxTokens`, `temperature`, and `requestTimeoutMs`: the maximum time in milliseconds to wait for each HTTP request to OpenRouter (chat completions and internal `GET /models` calls). The default is `30000` (30 seconds).

Run `ai-i18n-tools check-models` to verify each configured model id against OpenRouter’s live catalog. It reports ids that are missing or past `expiration_date`, lists valid models with estimated input/output pricing (USD per 1M tokens), and exits with a non-zero status when any configured id is invalid. It requires `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Quick start

<a id="workflow-1---ui-strings"></a>
### Workflow 1 - UI strings

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Wire i18next in your app using the helpers from `'ai-i18n-tools/runtime'`:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

<a id="workflow-2---documentation"></a>
### Workflow 2 - Documentation

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

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

| Helper | Description |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Standard i18next init options for key-as-default setups. |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Recommended wiring: key-trim + plural `wrapT` from `strings.json`, optionally merges `translate-ui` `{sourceLocale}.json` plural keys. |
| `wrapI18nWithKeyTrim(i18n)` | Lower-level key-trim wrapper only (deprecated for app wiring; prefer `setupKeyAsDefaultT`). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Builds the `localeLoaders` map for `makeLoadLocale` from `ui-languages.json` (every `code` except `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Factory for async locale file loading. |
| `getTextDirection(lng)` | Returns `'ltr'` or `'rtl'` for a BCP-47 code. |
| `applyDirection(lng, element?)` | Sets `dir` attribute on `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Display label for a language menu row (with i18n). |
| `getUILanguageLabelNative(lang)` | Display label without calling `t()` (header-style). |
| `interpolateTemplate(str, vars)` | Low-level `{{var}}` substitution on a plain string (used internally; app code should use `t()` instead). |
| `flipUiArrowsForRtl(text, isRtl)` | Flip `→` to `←` for RTL layouts. |

---

<a id="cli-commands"></a>
## CLI commands

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]   Create config file
ai-i18n-tools check-models                          Validate configured OpenRouter model ids against GET /models (pricing, expiration); requires OPENROUTER_API_KEY
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs …                      Translate documentation: markdown/MDX from contentPaths; optional Docusaurus label JSON from jsonSource. Flags include -l/--locale <codes>, -p/-f path, --dry-run,
                                                    --force, --force-update, --stats, --clear-cache, --type, --json-only, --no-json, -j, -b,
                                                    --prompt-format, --emphasis-placeholders, --no-emphasis-placeholders, --debug-failed
ai-i18n-tools write-heading-ids …                   Insert HTML anchor lines before ATX headings in .md/.mdx (documentations[])
ai-i18n-tools strip-md-bold-inline …              Remove bold (**) around inline code in markdown/MDX (documentations[])
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]   Scan documentation markdown for delimiter / inline-code issues and strong-outside-code or strong-outside-link patterns; refresh SQLite markdown_source_issues; exit 1 if any issue
ai-i18n-tools translate-svg …                        SVG files (features.translateSVG + config.svg); flags include -l/--locale <codes>,
                                                    -p/-f path, --dry-run, --force, --force-update, --no-cache, -j, -b
ai-i18n-tools translate-ui …                        Translate UI strings only; flags include -l/--locale <codes>, --dry-run, --force, -j
ai-i18n-tools lint-source …                         Run extract, then LLM review of source-locale UI strings (OpenRouter)
ai-i18n-tools export-ui-xliff …                   Export UI strings to XLIFF 2.0 (one file per locale); -l, -o, --untranslated-only, --dry-run
ai-i18n-tools sync …                                Extract, then UI / SVG / docs; flags include -l/--locale <codes>, -p/-f path, --dry-run, --force,
                                                    --force-update, --no-ui, --no-svg, --no-docs, -j, -b, --emphasis-placeholders,
                                                    --no-emphasis-placeholders, --debug-failed
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools statistics [--max-columns <n>]        Documentation cache + strings.json aggregates (same as editor Statistics)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]   List *.log and cache.db.backup*.sqlite; delete after `y`, with `-f`, or skip if none match
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Complete per-command flag lists are maintained next to `src/cli/index.ts` in [CLI flags by command](docs/GETTING_STARTED.md#cli-flags-by-command). Run `ai-i18n-tools <command> --help` for built-in usage text.

Global options on every command: `-c <config>` (default: `ai-i18n-tools.config.json`), `-v` (verbose), optional `-w` / `--write-logs [path]` to tee console output to a log file (default: under the translation cache directory), `-V` / `--version`, and `-h` / `--help`. See [Getting Started](docs/GETTING_STARTED.md#cli-reference) for the command overview table.

---

<a id="documentation"></a>
## Documentation

- [Getting Started](docs/GETTING_STARTED.md) - full setup guide for both workflows, CLI reference, and config field reference.
- [Package Overview](docs/PACKAGE_OVERVIEW.md) - architecture, internals, programmatic API, and extension points.
- [AI Agent Context](docs/ai-i18n-tools-context.md) - **for apps using the package:** integration prompts for downstream projects (copy into your repo’s agent rules).
- Maintainer internals for **this** repository: `dev/package-context.md` (clone-only; not on npm).

---

<a id="license"></a>
## License

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
