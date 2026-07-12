<a id="quick-start"></a>
# Quick start

The default `init` template (`ui-markdown`) enables **UI** extraction and translation only. The `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, and `ui-fumadocs` templates enable **document** translation (`translate-docs`); `ui-vitepress` also scaffolds `docsOutput.vitepressThemeCatalog` for VitePress theme strings, `ui-nextra` scaffolds `docs[].nextraDictionaryPath` for the Nextra theme dictionary (sidebar `_meta.ts` is collected automatically), and `ui-fumadocs` scaffolds `docsOutput.fumadocsUiCatalog` for Fumadocs UI overrides (sidebar `meta.json` is collected automatically). The `ui-astro-website` template scaffolds **UI** extraction for plain Astro apps (including `.astro` files); add a `docs[]` block (see [Astro website pages (parse-and-replace)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)) when you also want `translate-docs` for `.astro` page HTML. The reference [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) uses **both** pipelines. Use `sync` when you want one command that runs extract, UI translation, optional SVG file translation, and documentation translation according to your config.

<a id="runnable-examples"></a>
### Runnable examples

Nine runnable projects and fixtures live under [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). See the [Examples](/examples) catalog (console app, Next.js + Docusaurus, Astro website, Astro Starlight docs, VitePress docs, Nextra docs, Fumadocs docs, multi-provider comparison, markdown stress test).

**Run one example standalone** (without cloning the whole monorepo):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

Replace `console-app` with any example folder name. Each example declares `"ai-i18n-tools": "^1.7.2"` and installs the CLI from npm. Per-example READMEs include the same snippet with the folder name filled in.

**From the full ai-i18n-tools repository** — if you cloned the whole repo (not just one example folder with degit):

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

The workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) entry (`ai-i18n-tools: workspace:*`) links workspace examples to your local checkout automatically. Standalone fixtures (`multi-provider`, `test-markdown`) are not workspace packages — from their folder use `node ../../bin/ai-i18n-tools.mjs …`. To run the CLI from the **repository root** (this package's own docs/i18n), use `pnpm i18n:sync` or `node bin/ai-i18n-tools.mjs …` — see [Installation — Cloned monorepo](/guide/installation#cloned-monorepo) and the [Development Guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development).

<a id="provider-and-api-key-required-for-translation"></a>
### Provider and API key (required for translation)

Every command that calls an LLM — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, and `sync` — needs **both**:

1. **At least one provider** in `ai-i18n-tools.config.json`: a `providers.<name>` block with `translationModels`, and a top-level `provider` key when more than one provider is configured. `init` scaffolds a default provider block (`openrouter` unless you pass `-P <provider>`); switch presets, add providers, or tune model lists — see [LLM providers and models](/guide/providers-and-models).
2. **The matching API key** in your environment or a project-root `.env` file. Each built-in preset reads a named env var from the [preset table](/guide/providers-and-models#built-in-providers) (for example `OPENROUTER_API_KEY` for the default, or `ANTHROPIC_API_KEY` when you scaffold with `-P anthropic`); **Ollama** is the exception — it uses a local endpoint and needs no key. See [Installation — set your provider API key](/guide/installation#using-the-cli).

`extract`, `status`, and other commands that do not call the LLM do not need a provider or API key.

<a id="core-cli-commands"></a>
### Core CLI commands

Run from your **project root** after installing `ai-i18n-tools` and [configuring your shell for the bare command](/guide/installation#using-the-cli). Examples below use `ai-i18n-tools` directly.

```bash
# Set the API key for your active provider (see preset table; skip for local Ollama)
# Default init uses openrouter:
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Or scaffold another preset at init, e.g. anthropic:
# export ANTHROPIC_API_KEY=sk-ant-your-key-here

# UI strings (default template enables extract + translate-ui)
ai-i18n-tools init [-P <provider>]    # default: openrouter
ai-i18n-tools init -P anthropic
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight [-P <provider>]
# VitePress docs: ai-i18n-tools init -t ui-vitepress [-P <provider>]
# Nextra docs: ai-i18n-tools init -t ui-nextra [-P <provider>]
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs [-P <provider>]
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website [-P <provider>]
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles [-P <provider>]
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

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
    "uiGlossary": "src/locales/strings.json",
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

`glossary.uiGlossary` points document translation at the same `strings.json` catalog as the UI so terminology stays consistent; `glossary.userGlossary` adds CSV overrides for product terms.

Run `ai-i18n-tools sync` to run one pipeline: when `features.translateUIStrings` is enabled, **extract** then **translate UI** strings; optional **translate SVG** (`features.translateSVG` + `svg` block); **translate documentation** (`docs[]` as configured); then optional **translate-json** (`features.translateJson` + `json[]`). Skip parts with `--no-ui`, `--no-svg`, `--no-docs`, or `--no-json`. The docs and `json[]` steps accept `--dry-run`, `-p` / `--path`, `--force`, and `--force-update` (docs-only flags are ignored when `--no-docs`; JSON uses the same cache flags when `--no-json` is not set).

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
