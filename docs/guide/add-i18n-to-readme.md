<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# Add i18n to your README and Markdown docs

This page is for a repository on GitHub, GitLab, Bitbucket, or any other host whose readers start from `README.md` and a few other Markdown files. There is no documentation-site framework to configure. The usual project also has an app or CLI, and the README should use the same languages and the same product terms as that app. A library or docs-only repository with no UI strings is the other case, covered below.

The tool leaves `README.md` in place and writes one locale file per language, for example `translated-docs/README.de.md`. A language row inside the README links those files together.

<a id="which-setup-are-you-in"></a>
## Which setup are you in?

| You have | Scaffold | Then |
| --- | --- | --- |
| A JS/TS app plus a README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, the default) | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) for `t()`, and this page for the README |
| A Python app plus a README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [Add i18n to a Python app](/guide/add-i18n-to-python) for the app, and this page for the README |
| Any other template, plus a README | add `--with-readme` to that `init` command | This page for the README block |
| README and Markdown only | `ai-i18n-tools init -t docs-markdown -P openrouter` | This page |

`--with-readme` is a no-op on `ui-markdown` and `docs-markdown`, because those templates already include the README block.

<a id="what-you-get"></a>
## What you get

- `README.md` stays the source file. Hosts keep rendering it as the repository front page.
- Each target locale is a sibling file such as `translated-docs/README.de.md`.
- The language row in the source and in every translation lists every locale, with links that work from the file the reader is looking at.

Add `CONTRIBUTING.md`, `CHANGELOG.md`, or a `docs/` folder to the same block when those files should be translated too. See [More than the README](#more-than-the-readme).

<a id="install"></a>
## Install

Install the CLI ([Installation](/guide/installation)) and set the API key for your provider ([Provider and API key](/guide/quick-start#provider-and-api-key)). Ollama needs no key.

A repository with a `package.json` installs the package as a dev dependency. A repository with no Node.js project can run `npx ai-i18n-tools`, or use the [standalone executable](/guide/installation#standalone-executables).

<a id="scaffold"></a>
## Scaffold

JS/TS app and README (one command; `ui-markdown` is the default template):

```bash
ai-i18n-tools init -P openrouter
```

Python, Astro, plain HTML, VitePress, Docusaurus, or another template, with the same README block added:

```bash
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

README and Markdown files only:

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
```

`init` writes `ai-i18n-tools.config.json` only. It does not edit `README.md`. When the config includes a README block, it prints the marker line to paste and warns if `README.md` is missing. An existing config is left alone: add the block by hand, as in [Add the block to a config you already have](#add-the-block-to-a-config-you-already-have).

<a id="configure"></a>
## Configure

Four keys matter:

- `sourceLocale`: the language the README is written in. Any language is valid. English is a common example in this guide.
- `targetLocales`: the languages to add.
- `features.translateDocs`: must be true. A hybrid config also sets `features.translateUIStrings`.
- `docs[].contentPaths`: the Markdown files and folders to translate. The scaffold lists `README.md`.

<details>
<summary>Hybrid: UI strings and the README</summary>

`ui-markdown` writes this shape. `ui` is the app catalog. The `docs` entry is the README.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": ".",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

</details>

<details>
<summary>README and Markdown only</summary>

`docs-markdown` turns UI strings off and keeps the same README block.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": "."
      }
    }
  ]
}
```

The language-list settings are the same as in the hybrid example. They are omitted here only to keep the snippet short. `init -t docs-markdown` writes them.

</details>

<a id="add-the-block-to-a-config-you-already-have"></a>
### Add the block to a config you already have

Append the `docs` object from the hybrid example and set `features.translateDocs` to `true`. If the config already has a `docs` array (a VitePress or Docusaurus site, for example), append the README object as a second entry. `sync` runs every block. [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) does this: one block for the docs site, one flat block for `README.md`.

<a id="language-list"></a>
## Add the language list

Put this line in `README.md`, where readers should see the other languages. A short label on the line above it is normal prose and will be translated.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

The line may be empty. `translate-docs` replaces everything from the opening marker through the closing marker with one link per locale. Markers inside fenced code blocks are ignored, so a config sample in the same file does not match. Details: [Language switcher](/guide/documents/language-switcher).

<a id="translate"></a>
## Translate

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` runs the enabled steps in order: `extract` and `translate-ui` when UI strings are on, then `translate-docs`. One cache is shared, so a sentence already translated for the app is reused when it shows up in the README. UI catalogs are also passed to document translation as glossary hints (`ui[].uiGlossary`, on by default), which keeps button and feature names consistent. See [Glossary](/guide/glossary).

Language names in the row come from `ui-languages.json`, which `extract` writes next to the UI catalog. A README-only config has no UI catalog, so the row uses the bundled language list instead. The labels are still the native names. Run `generate-ui-languages` only when you want a project manifest of your own.

Commit `translated-docs/` and open the translated README on the host. Relative links between the source README and `translated-docs/README.de.md` are rewritten for each file.

<a id="hybrid-tips"></a>
## Hybrid tips

- Translate the README into fewer languages than the app with `docs[].targetLocales`. See [Fewer locales for documents](/guide/combining-pipelines#fewer-locales-for-documents).
- Put product terms in `glossary.userGlossary`. The same CSV is used for UI strings and for the README.
- Run one side only with `ai-i18n-tools sync --no-docs` or `ai-i18n-tools sync --no-ui`.

<a id="more-than-the-readme"></a>
## More than the README

Add paths to `contentPaths`. `flatPreserveRelativeDir` keeps folders, so `docs/guide.md` becomes `translated-docs/docs/guide.de.md` instead of colliding with another `guide.md`.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

A `.translate-ignore` file skips paths you do not want translated. `init --with-translate-ignore` writes a starter. Code fences, URLs, and heading anchors are not translated. See [Output layouts](/guide/documents/output-layouts), [Anchor links](/guide/documents/anchor-links), and [Link rewriting](/guide/documents/link-rewriting).

Screenshots that differ per language: [Images and screenshots](/guide/images-and-screenshots/).

<a id="links-on-the-host"></a>
## Links on the host

Links to other files in the repository are rewritten to the locale file. A link to a published docs site is not. This repository prefixes its docs-site URLs with the locale using `regexAdjustments`:

```json
"regexAdjustments": [
  {
    "search": "https://wsj-br\\.github\\.io/ai-i18n-tools/",
    "replace": "https://wsj-br.github.io/ai-i18n-tools/${translatedLocale}/"
  }
]
```

The flat link rewriter runs first, then these replacements. See [Link rewriting](/guide/documents/link-rewriting).

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `sync` after the source README or the app strings change. The cache sends only new or changed text to the model. Commit the updated files under `translated-docs/`.

The workflow below is a sample, not a published action. It installs the CLI and runs `sync` when `README.md` changes. Store the provider key as a repository secret. Review the `translated-docs/` diff and commit it, or push it on a branch and open a pull request.

```yaml
name: Translate README
on:
  push:
    paths:
      - "README.md"
      - "ai-i18n-tools.config.json"
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install --save-dev ai-i18n-tools
      - run: npx ai-i18n-tools sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

Use the environment variable for the provider you configured. Ollama does not apply on a hosted runner unless you install it there.

<a id="quality"></a>
## Say that the translation is automatic

AI translations can be wrong. A short note at the bottom of the README, like the one in [this repository's README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md), tells readers the other languages were machine-translated and should be checked before you rely on them.

<a id="not-your-case"></a>
## Not your case?

| You have | Read |
| --- | --- |
| App UI strings and no README to translate | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) or [Add i18n to a Python app](/guide/add-i18n-to-python) |
| A VitePress, Docusaurus, Starlight, Nextra, Fumadocs, or Astro site | [Add i18n to a website or docs site](/guide/add-i18n-to-website). Add `--with-readme` when the repository README should be translated as well |
| One HTML file per locale | [HTML pages](/guide/documents/html-pages) |
| The full `translate-docs` reference | [Documents](/guide/documents/) |

<a id="examples"></a>
## Examples

| Project | What it shows |
| --- | --- |
| [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) | A small Node app plus a flat README block |
| [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) | UI strings, a docs site, and a separate flat README block |
| This repository | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): flat README block, then the VitePress site |

<a id="agent-prompt"></a>
## Agent prompt

Copy this into Cursor or another coding agent. It prepares the repository. It does not translate the README.

````markdown
# Prepare README and Markdown translation

## Context

ai-i18n-tools translates Markdown listed in `docs[]` and writes one file per locale. The source README stays in place. Flat output for a README looks like `translated-docs/README.de.md`. Guide: https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme

## Scope

Edit `ai-i18n-tools.config.json` and the source Markdown files that should grow a language list. Do not edit anything under `translated-docs/` or other generated locale trees.

## Config

- If there is no config, run `ai-i18n-tools init -P <provider>` for a JS/TS app (this template already includes the README block), `ai-i18n-tools init -t docs-markdown -P <provider>` for Markdown only, or `ai-i18n-tools init -t <template> -P <provider> --with-readme` for any other template.
- If a config exists, set `features.translateDocs` to true and append one `docs` entry: `contentPaths` includes `README.md`, `outputDir` is `translated-docs`, `addFrontmatter` is false, `docsOutput.style` is `flat`, `flatPreserveRelativeDir` is true, and `postProcessing.languageListBlock` uses start `<small id="lang-list">`, end `</small>`, separator ` · `.
- Do not add a second block when one already lists `README.md`.
- Add other source files the user named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## README

Add this line where the language row should appear, if it is not already there:

```markdown
<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.

## Do not

- Do not translate, rewrite, or shorten the source README.
- Do not hand-edit `translated-docs/` or locale JSON.
- Do not run a translation yourself.

## Verify

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.

## Report back

List files changed and any Markdown file you left out of `contentPaths`, with a one-line reason.
````
