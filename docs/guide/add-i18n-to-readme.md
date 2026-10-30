<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# Add i18n to your README and Markdown docs

This page takes a repository on GitHub, GitLab, Bitbucket, or any other host whose readers start from `README.md` and adds one file per language. There is no documentation-site framework to configure. The usual project also has an app or CLI, and the README should use the same languages and the same product terms as that app. A library or docs-only repository with no UI strings is the other case, covered below.

<a id="what-you-get"></a>

The tool leaves `README.md` in place. Hosts keep rendering it as the repository front page. Each target locale is a sibling file such as `translated-docs/README.de.md`. A language row inside the README links those files together, and the same row is written into every translation, with links that work from the file the reader is looking at. `translate-docs` fills that row. It replaces everything from the opening marker through the closing marker with one link per locale. Add `CONTRIBUTING.md`, `CHANGELOG.md`, or a `docs/` folder to the same block when those files should be translated too. See [More than the README](#step-3-more-than-the-readme).

The quickest way is to give a coding agent the prompt on this page. It checks the config and adds the language-list marker. You install the CLI, choose the provider, and initialise the project yourself, because that needs your API key and your choices. You also run the translation yourself, because it spends money on your account.

A VitePress, Docusaurus, Starlight, Nextra, Fumadocs, or Astro site uses [Add i18n to a website or docs site](/guide/add-i18n-to-website). Add `--with-readme` when the repository README should be translated as well. Not sure which applies? See [Not your case?](#not-your-case) at the end.

The flow:

1. [Install the CLI and choose a provider](#install-and-choose-a-provider).
2. [Initialise the project](#initialise-the-project) with `init`.
3. [Run the agent prompt](#run-the-agent-prompt).
4. [Review the result](#review-the-result).
5. [Choose models and translate](#choose-models-and-translate), then check one language.
6. [Keep it translated](#keep-it-translated).

Prefer to make the changes yourself, or want to know what the prompt does? [Do it by hand](#do-it-by-hand) walks through the same steps one at a time.

<a id="install-and-choose-a-provider"></a>
## Install and choose a provider

You do this part, not the agent. The installer changes your machine, and the API key is a secret that belongs in your shell, not in a prompt.

A repository with a `package.json` installs the package as a dev dependency. Other install options: [Installation](/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` and `yarn add --dev ai-i18n-tools` work too.

A repository with no Node.js project can use the standalone executable. Linux and macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

The installer checks `SHA256SUMS.txt`, installs the command as `ai-i18n-tools`, and adds it to `PATH`. The binaries are not notarised or Authenticode-signed. Manual steps and asset names: [Standalone executables](/guide/installation#standalone-executables). `npx ai-i18n-tools` also works when Node.js is installed and you do not want a project dependency.

Check the install:

```bash
ai-i18n-tools --version
```

Then choose a provider and set its API key in the shell that will run the translation. For example, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama needs no key. Other presets: [Built-in providers](/guide/providers-and-models#built-in-providers). Note the provider name, because you pass it to `init` in the next step. The agent never needs the key: it only runs commands that make no model calls. You use the key later, when you [translate](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Initialise the project

You run this once, before the prompt. It writes the config and uses the provider you chose above. It does not edit `README.md`. When the config includes a README block, it prints the marker line to paste and warns if `README.md` is missing.

| You have | Scaffold | Then |
| --- | --- | --- |
| A JS/TS app plus a README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, the default) | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) for `t()`, and this page for the README |
| A Python app plus a README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | [Add i18n to a Python app](/guide/add-i18n-to-python) for the app, and this page for the README |
| Any other template, plus a README | add `--with-readme` to that `init` command | This page for the README block |
| README and Markdown only | `ai-i18n-tools init -t docs-markdown -P openrouter` | This page |

`--with-readme` is a no-op on `ui-markdown` and `docs-markdown`, because those templates already include the README block.

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

Then edit `sourceLocale` and `targetLocales` in `ai-i18n-tools.config.json`. `sourceLocale` is the language the README is written in. Any BCP-47 language is valid. `features.translateDocs` must be true. A hybrid config also sets `features.translateUIStrings`. `docs[].contentPaths` lists the Markdown files and folders to translate. The scaffold lists `README.md`.

Run `init` once. It rewrites `ai-i18n-tools.config.json` every time, so a second run drops edits you have made. An existing config is left alone when you skip `init`: the prompt appends the README block, and [Step 1](#step-1-configure-the-docs-block) shows the same edit by hand.

<a id="run-the-agent-prompt"></a>
## Run the agent prompt

Open the project in your coding agent (Cursor, Claude Code, Copilot, or similar), start a new chat, and paste the prompt below. The project must already be initialised. There is nothing to edit. If other Markdown files should be translated, name them in the same message.

The agent first checks that the CLI and the config exist, and stops with instructions if one is missing. Then it works in two parts:

- Part 1 appends the flat README block when the config does not already list `README.md`.
- Part 2 adds the language-list marker to the source README.

It does not install the CLI, initialise the config, read your API key, fill in the language links, or translate. Translation is the step after the review, and you run it.

````markdown
# Prepare README and Markdown translation

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user which command to run, then run this prompt again:

- JS/TS app plus a README: `ai-i18n-tools init -P <provider>`
- README and Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`
- Any other template: `ai-i18n-tools init -t <template> -P <provider> --with-readme`

Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, rewrite, or shorten the source README or any other source
  Markdown. Do not edit anything under `translated-docs/` or other generated
  locale trees. Do not hand-edit locale JSON.
- Do not reformat unrelated files. Leave unrelated edits in a dirty tree alone.

## Part 1 — Config

Skip this part when one `docs` entry already lists `README.md`. Do not add a
second block for the same file.

Otherwise set `features.translateDocs` to true and append one `docs` entry:

- `contentPaths` includes `README.md`
- `outputDir` is `translated-docs`
- `addFrontmatter` is false
- `docsOutput.style` is `flat`
- `docsOutput.flatPreserveRelativeDir` is true
- `docsOutput.linkRewriteDocsRoot` is `.`
- `docsOutput.postProcessing.languageListBlock` uses start
  `<small id="lang-list">`, end `</small>`, separator ` · `

```json
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
```

Leave `features.translateUIStrings` as it is. Add other source files the user
named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## Part 2 — Language list

In `README.md`, where readers should see the other languages, add this marker
if it is not already there. A short label on the line above it is normal
prose. Add that label only when the spot has no heading of its own.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.
Markers inside fenced code blocks are ignored, so a config sample in the same
file does not match. Do not put the real marker inside a fence.

## Verify and report

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and
exactly one docs block lists `README.md`. The marker is in the source README
and not inside a fence. Nothing under `translated-docs/` changed.

Report the files changed and any Markdown file you left out of `contentPaths`,
with a one-line reason. Then list the commands for the user, and do not run
them: `ai-i18n-tools suggest-models` (optional), `ai-i18n-tools sync`.
````

<a id="review-the-result"></a>
## Review the result

The agent ends with a report. Check it before you translate:

- The diff. It should be the config and the marker. Source prose should read the same as before. `git diff --stat` shows how much changed.
- Nothing under `translated-docs/` or another generated locale tree was edited.
- `ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.
- The marker is in `README.md` and not inside a fenced code block. A sample of the marker inside a fence is fine. The real one is outside.

<a id="choose-models-and-translate"></a>
## Choose models and translate

You run this part. It uses your API key and spends money on your account.

The model list from `init` is a starting point. Rank the active provider's chat models and, when the shortlist looks right, write it into `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` replaces only `translationModels`. The same ranking is on the [Models](/guide/translation-dashboard/models) tab of `ai-i18n-tools dashboard`.

Then translate:

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` runs the enabled steps in order: `extract` and `translate-ui` when UI strings are on, then `translate-docs`. One cache is shared, so a sentence already translated for the app is reused when it shows up in the README. UI catalogs are also passed to document translation as glossary hints (`ui[].uiGlossary`, on by default), which keeps button and feature names consistent. See [Glossary](/guide/glossary).

Language names in the row come from `ui-languages.json`, which `extract` writes next to the UI catalog. A README-only config has no UI catalog, so the row uses the bundled language list instead. The labels are still the native names. Run `generate-ui-languages` only when you want a project manifest of your own.

Commit `translated-docs/` and open the translated README on the host. Relative links between the source README and `translated-docs/README.de.md` are rewritten for each file.

<a id="check-one-language"></a>
### Check one language

Open `translated-docs/README.de.md` (or whichever target code you picked) on the host and in the file itself. The language row should list every locale, with links that work from the file you are looking at. A sentence that is still in the source language was inside a code fence, a URL, or a heading anchor, or it was not in `contentPaths`.

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `ai-i18n-tools sync` after the source README or the app strings change. The cache sends only new or changed text to the model. Commit the updated files under `translated-docs/`. `ai-i18n-tools dashboard` opens the [Translation Dashboard](/guide/translation-dashboard/) to review translations.

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

<a id="hybrid-tips"></a>
### Hybrid tips

- Translate the README into fewer languages than the app with `docs[].targetLocales`. See [Fewer locales for documents](/guide/combining-pipelines#fewer-locales-for-documents).
- Put product terms in `glossary.userGlossary`. The same CSV is used for UI strings and for the README.
- Run one side only with `ai-i18n-tools sync --no-docs` or `ai-i18n-tools sync --no-ui`.

<a id="say-that-the-translation-is-automatic"></a>
### Say that the translation is automatic

AI translations can be wrong. A short note at the bottom of the README, like the one in [this repository's README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md), tells readers the other languages were machine-translated and should be checked before you rely on them.

<a id="do-it-by-hand"></a>
## Do it by hand

Work through these steps if you prefer to make the changes yourself, or you want to know what the prompt does. The first two match the parts of the prompt. The last two are for extra files and for links that point at a published site. You still [install the CLI](#install-and-choose-a-provider), [initialise the project](#initialise-the-project), and [translate](#choose-models-and-translate) at the end.

1. [Configure the docs block](#step-1-configure-the-docs-block).
2. [Add the language list](#step-2-add-the-language-list).
3. [More than the README](#step-3-more-than-the-readme).
4. [Links on the host](#step-4-links-on-the-host).

<a id="step-1-configure-the-docs-block"></a>
## Step 1: Configure the docs block

Four keys matter:

- `sourceLocale`: the language the README is written in. Any language is valid. English is a common example in this guide.
- `targetLocales`: the languages to add.
- `features.translateDocs`: must be true. A hybrid config also sets `features.translateUIStrings`.
- `docs[].contentPaths`: the Markdown files and folders to translate. The scaffold lists `README.md`.

Skip this step when `init` already wrote the README block. Use it when you are editing a config that already exists.

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

Do not add a second block when one already lists `README.md`.

<a id="step-2-add-the-language-list"></a>
## Step 2: Add the language list

Put this line in `README.md`, where readers should see the other languages. A short label on the line above it is normal prose and will be translated.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

The line may be empty. `translate-docs` replaces everything from the opening marker through the closing marker with one link per locale. Markers inside fenced code blocks are ignored, so a config sample in the same file does not match. Details: [Language switcher](/guide/documents/language-switcher).

<a id="step-3-more-than-the-readme"></a>
## Step 3: More than the README

Add paths to `contentPaths`. `flatPreserveRelativeDir` keeps folders, so `docs/guide.md` becomes `translated-docs/docs/guide.de.md` instead of colliding with another `guide.md`.

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

A `.translate-ignore` file skips paths you do not want translated. `init --with-translate-ignore` writes a starter. Code fences, URLs, and heading anchors are not translated. See [Output layouts](/guide/documents/output-layouts), [Anchor links](/guide/documents/anchor-links), and [Link rewriting](/guide/documents/link-rewriting).

Screenshots that differ per language: [Images and screenshots](/guide/images-and-screenshots/).

<a id="step-4-links-on-the-host"></a>
## Step 4: Links on the host

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

That is the last manual step. Continue at [Choose models and translate](#choose-models-and-translate).

<a id="not-your-case"></a>
## Not your case?

| You have | Read |
| --- | --- |
| App UI strings and no README to translate | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) or [Add i18n to a Python app](/guide/add-i18n-to-python) |
| Django, Flask-Babel catalogs, or an app that already uses GNU gettext | [Add i18n to a Django / Python gettext app](/guide/add-i18n-to-django-gettext) |
| A VitePress, Docusaurus, Starlight, Nextra, Fumadocs, or Astro site | [Add i18n to a website or docs site](/guide/add-i18n-to-website). Add `--with-readme` when the repository README should be translated as well |
| One HTML file per locale | [HTML pages](/guide/documents/html-pages) |
| The full `translate-docs` reference | [Documents](/guide/documents/) |

<a id="examples"></a>
## Examples

| Project | What it shows |
| --- | --- |
| [console-app](/examples#console-app) | A small Node app plus a flat README block |
| [nextjs-app](/examples#nextjs-app) | UI strings, a docs site, and a separate flat README block |
| This repository | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): flat README block, then the VitePress site |
