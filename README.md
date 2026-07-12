<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)


<small id="lang-list">[English (UK)](./README.md) · [Deutsch](./translated-docs/README.de.md) · [Español](./translated-docs/README.es.md) · [Français](./translated-docs/README.fr.md) · [Hindi (Roman)](./translated-docs/README.hi-Latn.md) · [日本語](./translated-docs/README.ja.md) · [한국어](./translated-docs/README.ko.md) · [Português (Brasil)](./translated-docs/README.pt-BR.md) · [简体中文](./translated-docs/README.zh-Hans.md) · [繁體中文](./translated-docs/README.zh-Hant.md)</small>



**Translate your app and documentation using the AI model of your choice: no lock-in, no rewrites.**



`ai-i18n-tools` is a CLI and toolkit for internationalizing JavaScript/TypeScript applications and documentation sites - including Docusaurus, Astro, Starlight, VitePress, Nextra, Fumadocs, and plain Markdown/MDX - using large language models.

Choose from built-in presets (**OpenAI**, **Anthropic**, **Google Gemini**, **NVIDIA**, **DeepSeek**, **Groq**, **Mistral**, **xAI**, **Cerebras**, **Alibaba**, **APIFUN**, **OpenRouter**, **Ollama**) or point at any OpenAI-compatible API. Switch providers or models per project—or even per language—without modifying your codebase.

One config file drives three translation modes, so you can mix and match based on how your content is structured:

- **UI strings** — Extracts `t("…")` calls from JS/TS (and optionally `.astro` files) and generates flat, per-locale JSON for i18next or static SSG lookup.
- **Documents** — Translates Markdown, MDX, and `.astro` pages listed in `docs[].contentPaths` using `translate-docs`. Works with **VitePress**, **Starlight**, **Docusaurus**, **Nextra**, **Fumadocs**, Astro-based sites, or any static site generator that reads from Markdown/MDX/`.astro` source files.
- **JSON** — Translates arbitrary nested JSON bundles defined in `json[]`. Use `translate-json` when UI copy lives in per-locale JSON files instead of `t()` calls in source.

**SVG** assets get their own path: `features.translateSVG`, the top-level `svg` block, and `translate-svg`—not `docs[].contentPaths`.

**Which should I use?**

| Your content                                                                  | Command                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| Source code uses `t()`                                                        | **UI strings** — `extract` / `translate-ui` |
| Localized pages or docs sites (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, etc.) | **Documents** — `translate-docs`            |
| Standalone, nested JSON locale files                                          | **JSON** — `translate-json`                 |

All three share a file/SQLite cache, so only new or changed segments (strings or text chunks) are ever re-sent to the model — reruns are fast and cheap regardless of which provider you're using.


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents** 

- [Translation types](#translation-types)
- [Installation](#installation)
  - [Using the CLI](#using-the-cli)
- [LLM providers](#llm-providers)
- [Quick start](#quick-start)
  - [UI strings](#ui-strings)
  - [Documents](#documents)
  - [VitePress](#vitepress)
  - [Nextra](#nextra)
  - [Fumadocs](#fumadocs)
  - [Astro (plain Astro & Starlight)](#astro-plain-astro--starlight)
  - [Combined sync](#combined-sync)
- [Runtime helpers](#runtime-helpers)
- [CLI commands](#cli-commands)
  - [Tool UI language (logs, help, dashboard)](#tool-ui-language-logs-help-dashboard)
- [Documentation](#documentation)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



<a id="translation-types"></a>
## Translation types

Each translation type has its own guide with full configuration details: [UI strings](docs/guide/ui-strings/), [Documents](docs/guide/documents/), and [JSON](docs/guide/json.md). See [What is ai-i18n-tools?](docs/guide/what-is-ai-i18n-tools.md) for a side-by-side comparison.

A few things worth knowing up front: UI strings translates missing entries per locale via the active LLM provider (see [LLM providers](#llm-providers)) and writes flat JSON files (`de.json`, `pt-BR.json`, …), with the English source text as the runtime lookup key — `strings.json` is the extraction cache, not the runtime bundle. Documents supports `docs[].docsOutput.style` values `"nested"`, `"flat"`, `"doc-system"`, and aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (see [Output layouts](docs/guide/documents/output-layouts.md)). All three share `ai-i18n-tools.config.json` and can be combined; `sync` runs extract, UI translation, translate SVG, `translate-docs`, and `translate-json` in order according to your `features` flags.

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

After you install the package in your project, npm/pnpm/yarn link the published bin entry (`bin/ai-i18n-tools.mjs`) into `node_modules/.bin/ai-i18n-tools`. That shim loads the compiled CLI from the installed package.

To type the bare `ai-i18n-tools` command in an interactive shell, configure one of the options below. Without setup, the shell cannot find the binary even after a local install.

**direnv** — add to a `.envrc` in the project root (bash/zsh; see [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

After `direnv allow`, the bare command is available whenever you `cd` into the project.

**Manual PATH** — from the project root in an interactive shell:

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**Global install** — install the CLI once and invoke it from any directory:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

A global install uses the globally pinned version. For per-project version pinning, prefer direnv or manual PATH so `node_modules/.bin` resolves to the project's dependency.

**`package.json` scripts** — when npm or pnpm runs a script, it prepends `node_modules/.bin` to `PATH`, so the bare command name works inside scripts without shell PATH changes:

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

Then run e.g. `pnpm run i18n:sync` — scripts resolve the local binary without extra shell setup.

**Alternatives** — if you prefer not to adjust `PATH`: `npx ai-i18n-tools …` (npm) or `pnpm exec ai-i18n-tools …` (pnpm). For a zero-install one-off with no `package.json` entry: `npx ai-i18n-tools <cmd>` or `pnpm dlx ai-i18n-tools <cmd>`.

Prefer `sync` over hand-chaining `extract`, `translate-ui`, `translate-svg`, `translate-docs`, and `translate-json` — order and feature flags are easy to get wrong when run manually. See [Recommended `package.json` scripts](docs/guide/quick-start.md#recommended-packagejson-scripts) in the Quick start guide.

Set the API key for your chosen provider (environment variable names are in [LLM providers](#llm-providers)):

```bash
export PROVIDER_API_KEY=sk-your-key-here
```

---

<a id="llm-providers"></a>
## LLM providers

Translation commands (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models`, and related scripts) call an LLM provider; `check-markdown`, `mark-html`, and `extract` do not.

Configure providers under a top-level `providers` map and pick the active one with a top-level `provider` selector (optional when exactly one provider is configured). Most providers need only a `translationModels` list — `baseUrl` and the API-key environment variable come from a built-in preset; you can override `baseUrl`, `apiKeyEnv`, `headers`, `maxTokens`, `temperature`, and `requestTimeoutMs` per provider. `requestTimeoutMs` is the maximum time in milliseconds to wait for each request (default `30000`).

Optional model tiers on each provider block:

- `translationModels` — global ordered fallback chain (required for translation features).
- `uiModels` — UI-only chain (`translate-ui`, plural generation, `proofread-ui`): tried after any matching `localeModels` entry, before `translationModels`.
- `localeModels` — per-locale overrides for **all** pipelines: each entry maps a BCP-47 locale to an ordered model list tried first for that locale only (`pt-br` matches `pt-BR`).

Resolution order: **UI** → `localeModels(locale)` → `uiModels` → `translationModels`; **docs / JSON / SVG** → `localeModels(locale)` → `translationModels`. Duplicate model ids are skipped while preserving order.

To switch providers for a single run without editing the config, pass the global `-P` / `--provider <name>` option (e.g. `ai-i18n-tools -P groq translate-ui`); the name must be one of the configured `providers` keys.

```jsonc
{
  "provider": "ollama",
  "providers": {
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "openrouter": {
      "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"],
      "uiModels": ["anthropic/claude-sonnet-latest"],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
      ]
    },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

Built-in provider presets (key — base URL — API-key env var):

| Provider     | Base URL                                                  | API-key env var      |
|--------------|-----------------------------------------------------------|----------------------|
| `alibaba`    | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`  | `ALIBABA_API_KEY`    |
| `anthropic`  | `https://api.anthropic.com/v1`                            | `ANTHROPIC_API_KEY`  |
| `apifun`     | `https://api.apikey.fun/v1`                               | `APIFUN_API_KEY`     |
| `cerebras`   | `https://api.cerebras.ai/v1`                              | `CEREBRAS_API_KEY`   |
| `deepseek`   | `https://api.deepseek.com`                                | `DEEPSEEK_API_KEY`   |
| `gemini`     | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY`     |
| `groq`       | `https://api.groq.com/openai/v1`                          | `GROQ_API_KEY`       |
| `mistral`    | `https://api.mistral.ai/v1`                               | `MISTRAL_API_KEY`    |
| `nvidia`     | `https://integrate.api.nvidia.com/v1`                     | `NVIDIA_API_KEY`     |
| `ollama`     | `http://localhost:11434/v1`                               | (none)               |
| `openai`     | `https://api.openai.com/v1`                               | `OPENAI_API_KEY`     |
| `openrouter` | `https://openrouter.ai/api/v1`                            | `OPENROUTER_API_KEY` |
| `xai`        | `https://api.x.ai/v1`                                     | `XAI_API_KEY`        |

Define a custom OpenAI-compatible provider by adding a new key with `baseUrl` (and `apiKeyEnv` unless it needs no key). Model ids are plain upstream ids — the provider is chosen at the config level, so no `provider/` prefix is needed (OpenRouter ids keep their native `vendor/model` form).

Token usage is reported for every provider; exact USD cost is shown only when the provider returns it. `ai-i18n-tools check-models` validates all configured model ids (`translationModels`, `uiModels`, and every `localeModels` entry) against the active provider's live `GET /models` list, and shows pricing when the provider returns it. `ai-i18n-tools list-models` lists every model the active provider advertises (use `-P` / `--provider` to inspect another configured provider). `ai-i18n-tools bench-models` benchmarks every unique configured model id (`translationModels`, `uiModels`, and `localeModels`) by translating a sample in isolation (models run in parallel, bounded by `concurrency`) and prints per-model input/output tokens, wall-clock time, and USD cost.

For a hands-on demo of switching providers with `-P` on a single document, see [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/).

---

<a id="quick-start"></a>
## Quick start

Configure your shell for the bare command first — see [Using the CLI](#using-the-cli).

<a id="ui-strings"></a>
### UI strings

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
ai-i18n-tools init [-P <provider>]

# 2. Extract UI strings to strings.json
ai-i18n-tools extract

# 3. Translate to all target locales
ai-i18n-tools translate-ui
```

Then wire i18next in your app using the helpers from `'ai-i18n-tools/runtime'`. See [Step 4: Wire i18next at runtime](docs/guide/ui-strings/i18next-runtime.md) in the UI strings guide for the full setup.

<a id="documents"></a>
### Documents

The default `init` template (`ui-markdown`) enables UI extraction only. Use a docs-oriented template (or enable `features.translateDocs` and add `docs[]`) before `translate-docs`:

```bash
# Docusaurus docs + optional write-translations catalog
ai-i18n-tools init -t ui-docusaurus [-P <provider>]

# Astro Starlight documentation
# ai-i18n-tools init -t ui-starlight [-P <provider>]

# VitePress documentation (pages + theme catalog)
# ai-i18n-tools init -t ui-vitepress [-P <provider>]

# Nextra documentation (pages + _meta.ts + theme dictionary)
# ai-i18n-tools init -t ui-nextra [-P <provider>]

# Fumadocs documentation (pages + meta.json + UI catalog)
# ai-i18n-tools init -t ui-fumadocs [-P <provider>]

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# ai-i18n-tools init -t ui-astro-website [-P <provider>]

ai-i18n-tools translate-docs
ai-i18n-tools status
# ai-i18n-tools translate-docs --locale de   # single locale
```

Edit `ai-i18n-tools.config.json`: set `docs[].contentPaths` to markdown, MDX, and/or `.astro` sources; `docs[].outputDir` and `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, `"flat"`, etc.). Full field reference: [Documents](docs/guide/documents/).

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` scaffolds `docsOutput.style: "vitepress"` plus `docsOutput.vitepressThemeCatalog` for nav/sidebar/footer strings. Run `sync` to translate page markdown and the theme catalog together — no separate JSON pipeline. See [VitePress integration](docs/guide/integrations/vitepress.md) and [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/).

<a id="nextra"></a>
### Nextra

`init -t ui-nextra` scaffolds `docsOutput.style: "nextra"`. `translate-docs` automatically collects and translates `_meta.ts` sidebar labels; set `docs[].nextraDictionaryPath` to also translate the theme dictionary module (e.g. `app/_dictionaries/en.ts`) — all in the same `sync` run, no JSON sidecars. See [Nextra integration](docs/guide/integrations/nextra.md) and [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/).

<a id="fumadocs"></a>
### Fumadocs

`init -t ui-fumadocs` scaffolds `docsOutput.style: "fumadocs"` with the dot parser (default) or dir parser for Nextra-style locale folders. `translate-docs` automatically collects and translates `meta.json` sidebar labels; set `docsOutput.fumadocsUiCatalog` to also translate UI overrides in `lib/layout.shared.ts` — all in the same `sync` run, no JSON sidecars. See [Fumadocs integration](docs/guide/integrations/fumadocs.md) and [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/).

<a id="astro-plain-astro--starlight"></a>
### Astro (plain Astro & Starlight)

**Astro Starlight** — `init -t ui-starlight`, then `translate-docs`. Starlight UI overrides can use `src/content/i18n/en.json` with `jsonPathTemplate` in a separate `docs[]` block when needed ([Documents — initialise for documentation](docs/guide/documents/index.md#step-1-initialise-for-documentation)).

**Plain Astro** (marketing or app sites, not Starlight) — combine [Astro built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) with ai-i18n-tools. Reference project: [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (English at `/`, locales at `/{locale}/`).

Most teams use a **hybrid** of two pipelines:

| Pipeline               | Use for                                                              | Commands                   | Output                                                 |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **Page HTML**          | Headings, paragraphs, nav labels, inline arrays in the template body | `translate-docs`           | `src/pages/{locale}/index.astro` per locale            |
| **UI strings (`t()`)** | Frontmatter data, tab labels, shared arrays                          | `extract` → `translate-ui` | `public/locales/{locale}.json` (English source as key) |

Scaffold UI with `init -t ui-astro-website`. For hardcoded HTML in `.astro` pages, enable `features.translateDocs` and add a `docs[]` block with `docsOutput.style: "astro-starlight"` (see [Astro website pages (parse-and-replace)](docs/guide/ui-strings/astro-website.md#astro-website-pages-parse-and-replace)). Keep `targetLocales`, `i18n.locales` in `astro.config.mjs`, and `ui-languages.json` aligned (Astro routes use lowercase codes such as `pt-br`; flat bundle filenames follow config casing, e.g. `pt-BR.json`).

Wire `t()` at build time without i18next unless you add client islands — see [Astro website UI strings (SSG)](docs/guide/ui-strings/astro-website.md#astro-website-ui-strings-ssg) and the example’s `src/i18n/t.ts`.

<a id="combined-sync"></a>
### Combined sync

```bash
ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
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
| `buildPluralIndexFromStringsJson(entries)`                             | Builds the plural group index `wrapT` uses from catalog rows with `"plural": true`.                                                    |
| `extractInterpolationNamesForWrap(key)`                                | Parses `{{var}}` names from a source key for `wrapT` / key-trim fallback.                                                              |
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
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```


For plain HTML apps, annotate elements with bare `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` markers (the source text is taken from the element's own textContent / title / placeholder, written once); `mark-html` inserts them for you and `extract` then captures them into `strings.json`. See [Marking HTML for translation](docs/guide/ui-strings/plain-html.md#marking-html-for-translation).

Complete per-command flag lists are in [CLI reference](docs/reference/cli-commands/). Run `ai-i18n-tools <command> --help` for built-in usage text.

Global options: `-c <config>` (default: `ai-i18n-tools.config.json`), `-v` (verbose), `-P` / `--provider <name>` (override the active LLM provider; must be configured under `providers`), `-L` / `--ui-lang <code>` (language for the tool's own UI/logs), `-V` / `--version`, and `-h` / `--help` — accepted on every command. `-w` / `--write-logs [path]` tees console output to a log file (default: under the translation cache directory), but only takes effect on the translation and sync commands (`translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, `cleanup`). Several commands accept `-l` / `--locale <codes>` (comma-separated BCP-47) to limit target locales; `proofread-ui` uses a single source locale. See [CLI reference](docs/reference/cli-commands/) for the command overview.

<a id="tool-ui-language-logs-help-dashboard"></a>
### Tool UI language (logs, help, dashboard)

The tool localizes its own CLI help, log summaries, and Translation Dashboard independently of the locales you translate. By default it follows your OS locale; override with `-L pt-BR`, `export AI_I18N_LANG=es`, or `"uiLanguage"` in config. See [Tool UI language](docs/guide/tool-ui-language.md) for locale resolution, shipped languages, and dashboard behaviour.

---

<a id="documentation"></a>
## Documentation

- [Documentation site](https://wsj-br.github.io/ai-i18n-tools/) — VitePress guide (9 locales on GitHub Pages); slim entry point with links into the full guide.
- [Quick start](docs/guide/quick-start.md) — setup for UI strings, documents, and JSON (UI, docs/`.astro`, JSON bundles, VitePress, Nextra, Fumadocs, Astro Starlight and plain Astro).
- [Locale assets guide](docs/guide/images-and-screenshots/) - screenshots and illustrated SVGs in translated docs (flat link rewriter, screenshot scripts).
- [Architecture](docs/reference/architecture.md) - architecture, internals, programmatic API, and extension points.
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **for apps using the package:** integration prompts for downstream projects (copy into your repo’s agent rules).
- Maintainer guide for **this** repository: `AGENT.md` (rules and workflows; clone-only; not on npm). Pipeline reference: `docs/reference/`. Local dev and publishing: `dev/DEVEL.md`.

---

<a id="license"></a>
## License

This project is licensed under the MIT License.  
See the [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) file for details.

Copyright &copy; 2026 Waldemar Scudeller Jr.
