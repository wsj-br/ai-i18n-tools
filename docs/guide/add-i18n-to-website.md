<a id="add-i18n-to-a-website-or-docs-site"></a>
# Add i18n to a website or docs site

This page takes a documentation site (Markdown or MDX) or a marketing or static site (an Astro website or plain HTML) that has a single language and adds locales with ai-i18n-tools. The tool translates page content with the models on your LLM provider and writes one localised copy per language. Your site framework serves those copies and provides the language switcher.

The quickest way is to give a coding agent the prompt on this page. It enables that framework's i18n and checks the config. You install the CLI, choose the provider, and initialise the project yourself, because that needs your API key and your choices. You also run the translation yourself, because it spends money on your account.

For an app whose UI strings live in `t()` calls, use [Add i18n to a JS/TS app](/guide/add-i18n-to-js) or [Add i18n to a Python app](/guide/add-i18n-to-python). A repository README with no site framework uses [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme). Not sure which applies? See [Not your case?](#not-your-case) at the end.

<a id="steps"></a>

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

Install the package as a dev dependency. VitePress config imports `prefixVitepressThemeConfigLinks` from `ai-i18n-tools`, and a plain HTML page copies `i18n.js` from the package. A standalone executable is enough only when the site never imports `ai-i18n-tools/runtime` and never imports the package from its config. Other install options: [Installation](/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` and `yarn add --dev ai-i18n-tools` work too. The examples below use the bare `ai-i18n-tools` command. A local install needs `node_modules/.bin` on `PATH`, or `pnpm exec` in front of each command. See [Using the CLI](/guide/installation#using-the-cli).

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

You run this once, before the prompt. It writes `ai-i18n-tools.config.json` and uses the provider you chose above. It does not turn on i18n in an existing site. That is the prompt.

| Your site | Init template | Guide for the details |
| --- | --- | --- |
| Astro Starlight | `ui-starlight` | [Astro](/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/guide/integrations/fumadocs) |
| Plain Astro website | `ui-astro-website` | [Astro](/guide/integrations/astro#plain-astro-marketing-and-app-sites) |
| One HTML file that switches language in the browser | `ui-plain-html` | [Plain HTML apps](/guide/ui-strings/plain-html) |
| One translated HTML file per locale | `docs-plain-html` | [HTML pages](/guide/documents/html-pages) |
| No site framework, just a README and Markdown files | `docs-markdown`, or any template plus `--with-readme` | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme) |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

Swap `ui-vitepress` for the template in the table. Then edit `sourceLocale`, `targetLocales`, and `docs[].contentPaths`. `sourceLocale` is the language of the pages. Any BCP-47 language is valid. `contentPaths` must be the pages and folders written in that language. The paths in the template are starters. `docsOutput.style` is already set for the template. `ui-astro-website` and `ui-plain-html` write a `ui` block and an empty `docs` array. The prompt adds a page-HTML `docs` block for a plain Astro site when you are translating page HTML.

Run `init` once. It rewrites `ai-i18n-tools.config.json` every time, so a second run drops edits you have made.

<a id="run-the-agent-prompt"></a>
## Run the agent prompt

Open the project in your coding agent (Cursor, Claude Code, Copilot, or similar), start a new chat, and paste the prompt below. The project must already be initialised. There is nothing to edit. If you want a framework detail left out, say so in the same message.

The agent first checks that the CLI and the config exist, and stops with instructions if one is missing. Then it detects the framework and enables that framework's locale routing. It does not install the CLI, initialise the config, read your API key, or translate. Translation is the step after the review, and you run it.

````markdown
# Enable i18n on this website or docs site

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user to install ai-i18n-tools as a dev dependency and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-vitepress`, `ui-docusaurus`, `ui-starlight`, `ui-nextra`,
`ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, or `docs-plain-html`.
Do not install or initialise anything yourself.

`ui-plain-html` and `ui-astro-website` are valid when `docs` is empty. Every
other template needs one `docs` entry. If that entry is missing, stop and name
the init command.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, reword, or rename source pages, nav labels, or dictionary
  strings. Do not edit generated locale trees (`docs/<locale>/`,
  `i18n/<locale>/` other than the source catalog from `write-translations`,
  `theme.<locale>.json`, `content/<locale>/`, locale MDX, or locale HTML).
- Do not reformat unrelated code. Leave unrelated edits in a dirty tree alone.
- Apply one branch. If the framework is unclear, stop and ask.

Detect the branch from `docsOutput.style`, then from the config file and
`package.json`: `vitepress`, `docusaurus`, `nextra`, `fumadocs`,
`astro-starlight` with pages under `src/content/docs` (Starlight), `nested`
with HTML `contentPaths` (`docs-plain-html`), a `ui` block whose extractor
extensions include `.html` (`ui-plain-html`), or an Astro site that is not
Starlight (`ui-astro-website`).

Point `contentPaths` and `docsRoot` at the source-language pages that exist
in this repository. The paths written by `init` are starters.

## VitePress

- In `.vitepress/config`, set `locales.root` for the source locale (`label`,
  `lang`, and the existing `themeConfig`). Add one `locales[code]` per
  `targetLocales` entry: `label`, `lang`, `link: '/<code>/'`, and per-locale
  `title` / `description`. Keep `targetLocales` equal to those keys.
- Author nav and sidebar links once, without a locale prefix. Prefix `link`
  and `activeMatch` per locale with `prefixVitepressThemeConfigLinks` from
  `ai-i18n-tools`. `translate-docs` does not rewrite links inside the config.
- Leave `docsOutput.vitepressThemeCatalog` as `init` wrote it. If the config
  already loads `theme.en.json`, keep that loader and add `locales[code]` the
  same way. If theme strings are still inline, leave them inline. Do not
  create `theme.en.json` or `theme.<locale>.json` yourself, and do not load a
  theme file that is not on disk. The first `sync` bootstraps a missing
  catalog.
- `docsOutput.style` is `vitepress`. `outputDir` is the docs root.

## Docusaurus

- Add the `i18n` block in `docusaurus.config.js`: `defaultLocale`, `locales`
  (source plus each target), and `localeConfigs[locale].path` when the URL
  path differs from the locale code. The path must match the folder under
  `i18n/`.
- Point `docusaurusCatalogDir` at `i18n/<defaultLocale>`. `docsOutput.style`
  is `docusaurus`. `contentPaths` and `docsRoot` are the source docs folder.
  `outputDir` is the parent of the locale folders.
- Run this project's `docusaurus write-translations` so
  `i18n/<defaultLocale>/` exists. That command does not call a model. Do not
  run `sync` or `translate-docs`.
- Custom React in `src/pages` and `src/components` is not markdown. Mark
  user-facing copy with `<Translate>` or `translate()` from
  `@docusaurus/Translate`. The message has to be a static string. Do not wrap
  those calls in `t()`.

## Nextra

- Move source MDX to `content/<sourceLocale>/` (usually `content/en/`). The
  source locale is a folder, not the content root. Leave `_meta.ts` beside
  the pages it labels.
- Set `i18n.locales` and `defaultLocale` in `next.config`. `targetLocales`
  matches `i18n.locales` except the default locale.
- Add an `app/[lang]/` route, `getPageMap('/' + lang)`, and `<Layout i18n>`.
- Add `app/_dictionaries/<source>.ts` (usually `en.ts`) with the English
  chrome as string literals (`siteTitle`, footer, `editLink`, search
  placeholder, table-of-contents title, last-updated label), and
  `get-dictionary.ts` that imports `./${locale}`. Pass those fields into
  `<Layout>`, `<Navbar>`, and `<Footer>`. Keep native language names in a
  labels map, untranslated.
- Config: `features.translateDocs`, `docsOutput.style` `nextra`, `docsRoot`
  `content/<sourceLocale>`, `nextraDictionaryPath` the source dictionary.
- Optional: `proxy.ts` that re-exports `nextra/locales`.
- Do not write `app/_dictionaries/pt-BR.ts`, `content/pt-BR/`, or any other
  locale tree.

## Fumadocs

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and
  `parser: "dot"` or `"dir"`. Use `"dot"` unless the source pages already live
  under a locale folder. Set `docsOutput.fumadocsParser` to the same value.
- Add `app/[lang]/` routes. Export `createI18nMiddleware(i18n)` from
  `proxy.ts`.
- Dot: source MDX stays at the collection root (`content/docs/`). Dir: source
  MDX lives under `content/docs/<sourceLocale>/`. Point `contentPaths` and
  `docsRoot` at that source tree. `docsOutput.style` is `fumadocs`.
- `targetLocales` equals `languages` minus the default language, character
  for character.
- Leave English UI overrides as they are. Do not write `ui.<locale>.json` or
  translated MDX. Do not put this catalog in `json[]`.

## Astro Starlight

- In the Starlight config, set `locales`, including a `root` entry when the
  source language should be unprefixed (`label` and required `lang`). Set
  `defaultLocale: 'root'` when that root entry is the source language.
- Source pages stay in `src/content/docs/`. `translate-docs` writes
  `src/content/docs/<locale>/`. Point `contentPaths` at the source pages, not
  at locale folders. `outputDir` and `docsRoot` are `src/content/docs`.
  `docsOutput.style` is `astro-starlight`.
- Align `targetLocales` with the non-root locale keys. Starlight directory
  keys are often lowercase (`pt-br`). If you change case to match, say so in
  the report.
- Prefer sidebar `slug` entries so the label comes from the page title. Do
  not hand-translate sidebar `label` maps or `social[].label`. There is no
  shell catalog to add.

## Plain Astro

- Enable Astro i18n routing: `i18n.locales` includes the source locale and
  each target. Astro route codes are lowercase (`pt-br`). In the report, list
  `targetLocales`, `i18n.locales`, and the note that flat JSON filenames use
  the casing in `targetLocales`.
- `init -t ui-astro-website` leaves `docs` empty and turns on UI strings. When
  page HTML should be translated, set `features.translateDocs` to true and
  append one `docs` entry: `contentPaths` the source pages (for example
  `src/pages/index.astro`), `outputDir` `src/pages`, `addFrontmatter` false,
  `docsOutput.style` `astro-starlight`, `docsRoot` `src/pages`. Leave
  `features.translateUIStrings` as it is.
- If frontmatter or shared data calls `t()`, stop that part and tell the user
  to run the JS/TS prompt and skip i18next. Astro resolves `t` at build time.
  Do not wrap those calls here, and do not install i18next.

## Plain HTML

Each file belongs to only one pipeline. If the same file is both a `docs[]` source and
under `ui.sourceRoots`, stop and ask.

`ui-plain-html` (one page, language switches in the browser):

- Run `ai-i18n-tools mark-html` with no `--write`, read the report, then
  run it again with `--write`. It inserts `data-i18n` markers. It does not
  call a model.
- Copy `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` next to the page.
  Load it at the end of `<body>` with `data-source-locale` equal to
  `sourceLocale`, `data-locales-base` pointing at `flatOutputDir` as a URL
  relative to the script, and `data-locale-select` pointing at an empty
  `<select>`. Do not add a `docs` block for the same file.

`docs-plain-html` (one HTML file per locale):

- Confirm `contentPaths`, `outputDir`, and `docsRoot`. `docsOutput.style` is
  `nested`. Do not add `data-i18n` markers. Do not fill a language list by
  hand. `translate-docs` writes the locale files and the list.

## Verify and report

The framework's locale config matches `targetLocales`. `contentPaths` point
at source-language pages. No generated locale tree was edited. Run the
project's build or typecheck when it has one, and do not run a translation.

Report the branch you applied, the files changed, and any page you left out
of `contentPaths`, with a one-line reason. Then list the commands for the
user, and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools sync`, then build the site and open one localised route.
````

<a id="review-the-result"></a>
## Review the result

The agent ends with a report. Check it before you translate:

- The diff. It should be framework locale config, `contentPaths`, and the routing the branch describes. Source page prose should read the same as before. `git diff --stat` shows how much changed.
- `targetLocales` matches the locale keys the framework will serve.
- `contentPaths` point at source-language pages, not at a locale folder the tool is supposed to write.
- No generated locale tree was edited: `docs/<locale>/`, locale HTML, `content/<locale>/`, `theme.<locale>.json`, or a Docusaurus `i18n/<locale>/` folder other than the source catalog from `write-translations`.
- The project's build or typecheck still passes.

<a id="choose-models-and-translate"></a>
## Choose models and translate

You run this part. It uses your API key and spends money on your account.

The model list from `init` is a starting point. Rank the active provider's chat models and, when the shortlist looks right, write it into `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` replaces only `translationModels`. The same ranking is on the [Models](/guide/translation-dashboard/models) tab of `ai-i18n-tools dashboard`.

Then translate and build:

```bash
ai-i18n-tools sync
```

`sync` runs `translate-docs` when `features.translateDocs` is on, and `extract` plus `translate-ui` when UI strings are on (`ui-plain-html`, and a plain Astro site that also uses `t()`). `ai-i18n-tools translate-docs` runs the documents step on its own.

<a id="what-gets-translated"></a>
### What gets translated

Page bodies go through the [Documents](/guide/documents/) pipeline. Framework chrome (navigation, sidebar, theme labels) is handled in the same run where the framework supports it. That is not the separate [JSON](/guide/json) pipeline. A plain HTML page that switches language in the browser is the exception: `mark-html` and `translate-ui` write flat JSON, and the browser script applies it. One HTML file per locale stays on the Documents pipeline.

| Framework | Shell and theme strings | How |
| --- | --- | --- |
| Docusaurus | `write-translations` catalog (`{ message, description }`) | `docs[].docusaurusCatalogDir` plus `translate-docs` |
| VitePress | Theme, nav, and sidebar catalog | `docsOutput.vitepressThemeCatalog` plus `translate-docs` |
| Nextra | `_meta.ts` sidebar labels | Automatic with `style: "nextra"` |
| Nextra | Theme dictionary `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json` sidebar labels | Automatic with `style: "fumadocs"` |
| Fumadocs | UI overrides catalog | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | Built-in UI strings in many locales | Pages only |

Images and screenshots are not translated by `translate-docs`. For locale-specific files, see [Images and screenshots](/guide/images-and-screenshots/).

After the first `sync`, a few frameworks still need the config to load the catalog the command just wrote. Those prompts stay on the integration pages: [VitePress theme catalog](/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off), [Nextra dictionary](/guide/integrations/nextra#agent-prompt-dictionary-and-routes), and [Fumadocs UI catalog](/guide/integrations/fumadocs#agent-prompt).

<a id="check-one-language"></a>
### Check one language

Build the site and open one localised route in the browser. The framework's own locale dropdown is the switcher. For one HTML file that switches in the browser, use the select the runtime fills. For one HTML file per locale, open the file under the locale folder.

Text that is still in the source language was left out of `contentPaths`, is a code fence, a URL, or a heading anchor, or the route is not wired. A VitePress nav label that is still in the source language is the theme catalog: run `sync` first, then the [theme-catalog prompt](/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) if the strings are still inline in the config.

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `ai-i18n-tools sync` after the source pages change. The cache means only new or changed text goes to the model. Commit the locale trees the pipeline writes. `ai-i18n-tools dashboard` opens the [Translation Dashboard](/guide/translation-dashboard/) to review translations.

To translate `README.md` in the same run, scaffold with `--with-readme` (or add the block to an existing config). See [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Do it by hand

Work through these steps if you prefer to make the changes yourself, or you want to know what the prompt does. You still [install the CLI](#install-and-choose-a-provider), [initialise the project](#initialise-the-project), and [translate](#choose-models-and-translate) at the end.

1. Point `contentPaths` and `docsRoot` at the source-language pages. The template paths are starters.
2. Enable the framework's locale routing. Use the branch that matches the template. The integration page has the full reference.

Shell strings that the framework reads from a catalog are wired after the first `sync`. Each branch below links that follow-up.

<a id="vitepress"></a>
### VitePress

Add `locales.root` and one `locales[code]` per target, and prefix nav and sidebar links with `prefixVitepressThemeConfigLinks`. Leave inline theme strings for the first `sync`. Checklist: [Enable i18n in an existing site](/guide/integrations/vitepress#enable-i18n-in-an-existing-site). After `sync` has written `theme.<locale>.json`, paste the [theme catalog prompt](/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off) if the config still has the strings inline.

<a id="docusaurus"></a>
### Docusaurus

Add the `i18n` block, point `docusaurusCatalogDir` at the source catalog, and run `docusaurus write-translations`. Checklist: [Enable i18n in an existing site](/guide/integrations/docusaurus#enable-i18n-in-an-existing-site). Shell JSON: [Shell strings](/guide/integrations/docusaurus#shell-strings-write-translations).

<a id="nextra"></a>
### Nextra

Move MDX under `content/<sourceLocale>/`, add `app/[lang]/`, and add the source dictionary module. Checklist: [Enable i18n in an existing site](/guide/integrations/nextra#enable-i18n-in-an-existing-site). The [dictionary prompt](/guide/integrations/nextra#agent-prompt-dictionary-and-routes) is the longer pass for the same wiring. App React that needs `t()`: [hybrid prompt](/guide/integrations/nextra#optional-t-for-app-react-hybrid).

<a id="fumadocs"></a>
### Fumadocs

Add `defineI18n`, `app/[lang]/`, and the middleware. Match `fumadocsParser` to `dot` or `dir`. Checklist: [Enable i18n in an existing site](/guide/integrations/fumadocs#enable-i18n-in-an-existing-site). The [UI catalog prompt](/guide/integrations/fumadocs#agent-prompt) wires `i18n.translations()` after the routes exist.

<a id="astro-starlight"></a>
### Astro Starlight

Add `locales`, including `root` when the source language is unprefixed. Pages stay in `src/content/docs/`. Checklist: [Enable i18n in an existing site](/guide/integrations/astro#enable-i18n-in-an-existing-site). Starlight ships its own UI strings. Prefer `slug` sidebar entries.

<a id="plain-astro"></a>
### Plain Astro

Turn on Astro's `i18n.locales` and, when the page HTML should be translated, add the `docs` block from [Plain Astro](/guide/integrations/astro#plain-astro-marketing-and-app-sites). Frontmatter `t()` calls use the [JS/TS prompt](/guide/add-i18n-to-js#run-the-agent-prompt) without installing i18next. Astro resolves `t` at build time.

<a id="plain-html"></a>
### Plain HTML

Two options, and a file belongs to one of them:

- One page that switches language in the browser: `ui-plain-html`. Run `ai-i18n-tools mark-html` (dry run, then `--write`) and load `i18n.js`. See [Plain HTML apps](/guide/ui-strings/plain-html).
- One translated HTML file per locale: `docs-plain-html`. See [HTML pages](/guide/documents/html-pages).

That is the last manual step. Continue at [Choose models and translate](#choose-models-and-translate).

<a id="not-your-case"></a>
## Not your case?

| You have | Read |
| --- | --- |
| App UI strings | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) or [Add i18n to a Python app](/guide/add-i18n-to-python) |
| Django, Flask-Babel catalogs, or an app that already uses GNU gettext | [Add i18n to a Django / Python gettext app](/guide/add-i18n-to-django-gettext) |
| A repository README next to the site, or Markdown files and no site framework | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme). `init … --with-readme` adds that block beside a site template |
| Standalone nested locale JSON | [JSON](/guide/json) |
| A site and app strings in one config | [Combining pipelines](/guide/combining-pipelines) |

Reference for the shared options and per-framework differences: [Integrations](/guide/integrations/).

<a id="examples"></a>
## Examples

| Example | What it shows |
| --- | --- |
| [vitepress-docs](/examples#vitepress-docs) | VitePress pages and the theme catalog |
| [docusaurus-docs](/examples#docusaurus-docs) | Docusaurus pages and shell JSON |
| [astro-docs](/examples#astro-docs) | Starlight pages |
| [nextra-docs](/examples#nextra-docs) | Nextra 4 routes and the dictionary |
| [fumadocs-docs](/examples#fumadocs-docs) | Fumadocs routes and the UI catalog |
| [astro-website](/examples#astro-website) | Astro landing page, HTML plus `t()` |
| [plain-html](/examples#plain-html) | One HTML file, `data-i18n` markers |
| [plain-html-docs](/examples#plain-html-docs) | One HTML file per locale |

Copy one with `npx degit`. Commands: [Examples](/examples#nodejs-examples).
