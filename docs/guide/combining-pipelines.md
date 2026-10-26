<a id="combining-pipelines"></a>
# Combining pipelines

Read this when one project needs more than one kind of translation: app UI strings plus documentation, a docs site plus a root README, or documents plus SVG illustrations. If you only translate one kind of content, [Quick start](/guide/quick-start) is enough.

An app plus its repository README is the common hybrid. Scaffold it with `init` (the `ui-markdown` template) or `init -t <template> --with-readme`, then follow [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme). The mixed config later on this page is the same idea next to a docs site.

<a id="what-sync-runs"></a>
## What sync runs

`ai-i18n-tools sync` runs the enabled steps in this order:

1. `extract`, then `translate-ui`, when `features.translateUIStrings` is enabled.
2. `translate-svg`, when `features.translateSVG` is enabled and an `svg` block exists.
3. `translate-docs`, when `features.translateDocs` is enabled or any `docs[].docusaurusCatalogDir` is set.
4. `translate-json`, when `features.translateJson` is enabled and `json[]` has entries.

Skip parts with `--no-ui`, `--no-svg`, `--no-docs`, or `--no-json`. The docs and `json[]` steps accept `--dry-run`, `-p` / `--path`, `--force`, `--force-update`, and `--check-cache`. Docs-only flags are ignored when `--no-docs` is set. JSON uses the same cache flags when `--no-json` is not set.

Prefer `sync` over chaining the individual commands by hand. Order, extraction, and locale flags are easy to get wrong when run manually.

<a id="combined-sync"></a>

<a id="ui-strings-and-documents-together"></a>
## UI strings and documents together

Enable both features in one config to run UI strings and documents in a single pass:

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

<a id="fewer-locales-for-documents"></a>
## Fewer locales for documents

Use `docs[].targetLocales` on a block to translate that block's files to a smaller subset than the UI. The effective documentation locales are the union across blocks:

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

<a id="mixed-documentation-config"></a>
## Mixed documentation config

You can combine multiple documentation pipelines in the same config by adding more than one entry in `docs`. This is a common setup when a project has a Docusaurus site (`docsOutput.style = "docusaurus"`) plus root-level markdown files, such as a repository README with `docsOutput.style = "flat"`, that should be translated with locale-suffixed filenames.

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

- UI strings are extracted and translated from `src/` into `public/locales/`.
- The first docs block translates markdown from `docs-site/docs/` into `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (localised documentation pages).
- With `docs[].docusaurusCatalogDir` set and `features.translateDocs` enabled, that same block also translates Docusaurus shell JSON under `docs-site/i18n/en/` into each target locale folder: navbar, footer, and theme/plugin catalogues, not MDX body copy.
- The second docs block translates `README.md` into locale-suffixed files under `translated-docs/` (`docsOutput.style = "flat"`).
- All docs blocks share `cacheDir`, so unchanged segments are reused across runs to reduce API calls and cost.

Next: back to [Quick start](/guide/quick-start), or see [Configuration](/reference/configuration) for the full schema.
