<a id="quick-start"></a>
# Quick start

The default `init` template (`ui-markdown`) enables **UI** extraction and translation only. The `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, and `ui-fumadocs` templates enable **document** translation (`translate-docs`); `ui-vitepress` also scaffolds `docsOutput.vitepressThemeCatalog` for VitePress theme strings, `ui-nextra` scaffolds `docs[].nextraDictionaryPath` for the Nextra theme dictionary (sidebar `_meta.ts` is collected automatically), and `ui-fumadocs` scaffolds `docsOutput.fumadocsUiCatalog` for Fumadocs UI overrides (sidebar `meta.json` is collected automatically). The `ui-astro-website` template scaffolds **UI** extraction for plain Astro apps (including `.astro` files); add a `docs[]` block (see [Astro website pages (parse-and-replace)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)) when you also want `translate-docs` for `.astro` page HTML. The reference [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) uses **both** pipelines. Python templates are `ui-python`, `ui-python-gettext`, `ui-python-flask`, and `ui-python-django` — see [Add i18n to a Python app](/guide/add-i18n-to-python). Use `sync` when you want one command that runs extract, UI translation, optional SVG file translation, and documentation translation according to your config.

Python projects can use the standalone executable and skip a Node.js install. Download steps: [Installation — Standalone executables](/guide/installation#standalone-executables).

<a id="runnable-examples"></a>
### Runnable examples

Runnable projects and fixtures live under [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). See the [Examples](/examples) catalog for the full list, copy commands, and which folders use `pnpm` versus a Python virtualenv.

**Run one Node.js example standalone** (without cloning the whole monorepo):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

Replace `console-app` with any other Node.js example folder name. Each of those examples declares a published caret range of `ai-i18n-tools` matching the current package version and installs the CLI from npm. Python examples have no `package.json`. Copy them with the same `degit` command, or use `ai-i18n-tools-python-examples.zip` from the GitHub Release, then follow [Examples — Python](/examples#python-examples).

**From the full ai-i18n-tools repository** — if you cloned the whole repo (not just one example folder with degit):

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

The workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) entry (`ai-i18n-tools: workspace:*`) links workspace examples to your local checkout automatically. Standalone fixtures (`multi-provider`, `test-markdown`) are not workspace packages — from their folder use `node ../../bin/ai-i18n-tools.mjs …`. To run the CLI from the **repository root** (this package's own docs/i18n), use bare `ai-i18n-tools` after `direnv allow`, or `pnpm i18n:sync` / `node bin/ai-i18n-tools.mjs …` — see [Installation — Cloned monorepo](/guide/installation#cloned-monorepo) and the [Development Guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development).

<a id="provider-and-api-key-required-for-translation"></a>
### Provider and API key (required for translation)

Every command that calls an LLM — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, and `sync` — needs **both**:

1. **At least one provider** in `ai-i18n-tools.config.json`: a `providers.<name>` block with `translationModels`, and a top-level `provider` key when more than one provider is configured. `init -P <provider>` scaffolds that preset; add providers or tune model lists — see [LLM providers and models](/guide/providers-and-models).
2. **The matching API key** in your environment or a project-root `.env` file. Each built-in preset reads a named env var from the [preset table](/guide/providers-and-models#built-in-providers) (for example `OPENROUTER_API_KEY` with `-P openrouter`, or `OPENAI_API_KEY` with `-P openai`); **Ollama** is the exception — it uses a local endpoint and needs no key. See [Installation — set your provider API key](/guide/installation#using-the-cli).

`extract`, `status`, and other commands that do not call the LLM do not need a provider or API key.

<a id="core-cli-commands"></a>
### Core CLI commands

Run from your **project root** after installing `ai-i18n-tools` and [configuring your shell for the bare command](/guide/installation#using-the-cli). Examples below use `ai-i18n-tools` directly.

```bash
# Set the API key for the provider you pass to init (see preset table; skip for local Ollama)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# export OPENAI_API_KEY=sk-your-key-here
# export CHEAPERINFERENCE_API_KEY=your-key-here

# UI strings (ui-markdown template enables extract + translate-ui)
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models          # optional: ranked shortlist
ai-i18n-tools suggest-models --apply  # replace translationModels
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight -P cheaperinference
# VitePress docs: ai-i18n-tools init -t ui-vitepress -P anthropic
# Nextra docs: ai-i18n-tools init -t ui-nextra -P gemini
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs -P groq
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website -P ollama
# Plain HTML catalog: ai-i18n-tools init -t ui-plain-html -P openrouter
# Plain HTML documents: ai-i18n-tools init -t docs-plain-html -P openai
# Python flat JSON: ai-i18n-tools init -t ui-python -P cheaperinference
# Python JSON + gettext: ai-i18n-tools init -t ui-python-gettext -P anthropic
# Django catalogs: ai-i18n-tools init -t ui-python-django -P gemini
# Flask / Jinja gettext: ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles -P ollama
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

The `ui-markdown` template does not rewrite source. If buttons and messages are still plain source-language strings, `extract` records nothing until you wrap them in `t()`. Walkthrough: [Add i18n to a JS/TS app](/guide/add-i18n-to-js). Python: [Add i18n to a Python app](/guide/add-i18n-to-python).

The model list written by `init` is a starting point. `suggest-models` ranks the active provider's chat models. `suggest-models --apply` replaces `translationModels` and leaves `uiModels` and `localeModels` unchanged. The same ranking is on the [Models](/guide/translation-dashboard/models) tab. Command reference: [suggest-models](/reference/cli-commands/models#suggest-models).

<a id="recommended-packagejson-scripts"></a>
### Recommended `package.json` scripts

With the package installed locally, `package.json` scripts resolve `ai-i18n-tools` from `node_modules/.bin` without extra shell setup. For interactive shells, configure PATH first — see [Using the CLI](/guide/installation#using-the-cli).

**Prefer** `sync` for anything that used to be “run `translate-ui`, then `translate-svg`, then `translate-docs`, then `translate-json`”: `ai-i18n-tools sync` runs **extract** (when enabled), **translate-ui**, optional **translate-svg**, **translate-docs**, then optional **translate-json**—in the right order and with shared flags—according to your config. Chaining those steps by hand is easy to get wrong (order, extract, locale flags). Use `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs`, and `i18n:translate:json` only when you need a **single** step in isolation.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**Tip:** Pass `-L <code>` or set `AI_I18N_LANG` if you want CLI output and the dashboard in another language — see [Tool UI language](/guide/tool-ui-language).

<a id="combined-sync"></a>
## Combined sync

Enable all features in a single config to run UI strings and documents together:

<details>
<summary>Example combined UI + docs config</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

UI blocks include their `strings.json` catalogs as glossary hints for documentation by default (`uiGlossary`). `glossary.userGlossary` adds CSV overrides for product terms. See [Glossary](/guide/glossary).

Run `ai-i18n-tools sync` to run one pipeline: when `features.translateUIStrings` is enabled, **extract** then **translate UI** strings; optional **translate SVG** (`features.translateSVG` + `svg` block); **translate documentation** (`docs[]` as configured); then optional **translate-json** (`features.translateJson` + `json[]`). Skip parts with `--no-ui`, `--no-svg`, `--no-docs`, or `--no-json`. The docs and `json[]` steps accept `--dry-run`, `-p` / `--path`, `--force`, `--force-update`, and `--check-cache` (docs-only flags are ignored when `--no-docs`; JSON uses the same cache flags when `--no-json` is not set).

Use `docs[].targetLocales` on a block to translate that block’s files to a **smaller subset** than the UI (effective documentation locales are the **union** across blocks):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>
### Mixed documentation config (`docsOutput.style = "docusaurus"` + `"flat"`)

You can combine multiple documentation pipelines in the same config by adding more than one entry in `docs`. This is a common setup when a project has a Docusaurus site (`docsOutput.style = "docusaurus"`) plus root-level markdown files (for example, a repository README with `docsOutput.style = "flat"`) that should be translated with locale-suffixed filenames.

<details>
<summary>Example mixed Docusaurus + flat README config</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
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

How this runs with `ai-i18n-tools sync`:

- UI strings are extracted/translated from `src/` into `public/locales/`.
- The first docs block translates **markdown** from `docs-site/docs/` into `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (localised documentation pages).
- With `docs[].docusaurusCatalogDir` set and `features.translateDocs` enabled, that same block also translates **Docusaurus shell JSON** under `docs-site/i18n/en/` into each target locale folder — navbar, footer, and theme/plugin catalogues, not MDX body copy.
- The second docs block translates `README.md` into locale-suffixed files under `translated-docs/` (`docsOutput.style = "flat"`).
- All docs blocks share `cacheDir`, so unchanged segments are reused across runs to reduce API calls and cost.
