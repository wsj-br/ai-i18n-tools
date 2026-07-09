<a id="quick-start"></a>
# Quick start

The default `init` template (`ui-markdown`) enables **UI** extraction and translation only. The `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, and `ui-nextra` templates enable **document** translation (`translate-docs`); `ui-vitepress` also scaffolds `docsOutput.vitepressThemeCatalog` for VitePress theme strings, and `ui-nextra` scaffolds `docs[].nextraDictionaryPath` for the Nextra theme dictionary (sidebar `_meta.ts` is collected automatically). The `ui-astro-website` template scaffolds **UI** extraction for plain Astro apps (including `.astro` files); add a `docs[]` block (see [Astro website pages (parse-and-replace)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)) when you also want `translate-docs` for `.astro` page HTML. The reference [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) uses **both** pipelines. Use `sync` when you want one command that runs extract, UI translation, optional SVG file translation, and documentation translation according to your config.

<a id="runnable-examples"></a>
### Runnable examples

Nine runnable projects and fixtures live under [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/). See the [Examples](/examples) catalog (console app, Next.js + Docusaurus, Astro website, Astro Starlight docs, VitePress docs, Nextra docs, multi-provider comparison, markdown stress test).

**Run one example standalone** (without cloning the whole monorepo):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
```

Replace `console-app` with any example folder name. Each example declares `"ai-i18n-tools": "^1.7.2"` and installs the CLI from npm. Per-example READMEs include the same snippet with the folder name filled in.

**From the full ai-i18n-tools repository:** if you cloned the whole repo (not just one example folder with degit), run `pnpm install` from the repository root; the workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) entry (`ai-i18n-tools: workspace:*`) links examples to your local checkout automatically.

```bash
# UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# VitePress docs: npx ai-i18n-tools init -t ui-vitepress
# Nextra docs: npx ai-i18n-tools init -t ui-nextra
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# JSON (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Recommended `package.json` scripts

With the package installed locally, you can use the CLI commands directly in scripts (no `npx` needed).

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
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**Tip:** Pass `-L <code>` or set `AI_I18N_LANG` if you want CLI output and the dashboard in another language — see [Tool UI language](/reference/environment-variables#tool-ui-language).

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

Run `npx ai-i18n-tools sync` to run one pipeline: when `features.translateUIStrings` is enabled, **extract** then **translate UI** strings; optional **translate SVG** (`features.translateSVG` + `svg` block); **translate documentation** (`docs[]` as configured); then optional **translate-json** (`features.translateJson` + `json[]`). Skip parts with `--no-ui`, `--no-svg`, `--no-docs`, or `--no-json`. The docs and `json[]` steps accept `--dry-run`, `-p` / `--path`, `--force`, and `--force-update` (docs-only flags are ignored when `--no-docs`; JSON uses the same cache flags when `--no-json` is not set).

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

How this runs with `npx ai-i18n-tools sync`:

- UI strings are extracted/translated from `src/` into `public/locales/`.
- The first docs block translates **markdown** from `docs-site/docs/` into `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (localised documentation pages).
- With `docs[].docusaurusCatalogDir` set and `features.translateDocs` enabled, that same block also translates **Docusaurus shell JSON** under `docs-site/i18n/en/` into each target locale folder — navbar, footer, and theme/plugin catalogues, not MDX body copy.
- The second docs block translates `README.md` into locale-suffixed files under `translated-docs/` (`docsOutput.style = "flat"`).
- All docs blocks share `cacheDir`, so unchanged segments are reused across runs to reduce API calls and cost.
