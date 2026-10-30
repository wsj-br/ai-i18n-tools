<a id="add-i18n-to-a-jsts-app"></a>
# Add i18n to a JS/TS app

This page takes a JS/TS app (React, Next.js, Node, or a CLI) that has a single language and adds locales with ai-i18n-tools. It follows one path: i18next, a small bootstrap file, and JSON files of translations. `extract` records a UI string only when it is a string literal inside `t()` or `i18n.t()`, so a catalog of plain source text would be empty.

The quickest way is to give a coding agent the prompt on this page. It installs i18next, adds the bootstrap, wraps your strings, and can add a language switch. You install the CLI, choose the provider, and initialise the project yourself, because that needs your API key and your choices. You also run the translation yourself, because it spends money on your account.

A website or docs site uses [Add i18n to a website or docs site](/guide/add-i18n-to-website). A Python app uses [Add i18n to a Python app](/guide/add-i18n-to-python). Not sure which applies? See [Not your case?](#not-your-case) at the end.

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

Install the package as a dev dependency. The bootstrap imports `ai-i18n-tools/runtime`, and a global CLI or a standalone executable cannot satisfy that import. Other install options: [Installation](/guide/installation).

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

You run this once, before the prompt. It writes the config and uses the provider you chose above.

```bash
ai-i18n-tools init -P openrouter
```

The default template is `ui-markdown`. It writes `ai-i18n-tools.config.json` with a UI block and a flat README block. Four keys matter for the app:

- `sourceLocale`: the language of the strings in the source. Any BCP-47 language is valid; the scaffold often uses `en-GB`.
- `targetLocales`: the languages to add.
- `ui.sourceRoots`: the folders `extract` scans, for example `src/`.
- `ui.stringsJson` and `ui.flatOutputDir`: where the catalog and the per-locale files are written.

`init` does not install i18next and does not add the bootstrap. That is the prompt (by hand, [Step 1](#step-1-install-the-runtime-libraries) and [Step 2](#step-2-extract-once-and-add-the-bootstrap)).

Run `init` once. It rewrites `ai-i18n-tools.config.json` every time, so a second run drops edits you have made.

The same template lists `README.md` for document translation. The language-list marker and the README files are [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme). This page is the `t()` path.

Every other key is in [Configuration](/reference/configuration). Call shapes: [t() calls and plurals](/guide/ui-strings/t-calls-and-plurals). The bootstrap reference: [Wire i18next](/guide/ui-strings/i18next-runtime).

<a id="run-the-agent-prompt"></a>
## Run the agent prompt

Open the project in your coding agent (Cursor, Claude Code, Copilot, or similar), start a new chat, and paste the prompt below. The project must already be initialised. There is nothing to edit. If you want something left out, for example no language switch, say so in the same message.

The agent first checks that the CLI and the config exist, and stops with instructions if one is missing. Then it works in three parts:

- Part 1 installs i18next, runs `extract` once, and adds the bootstrap.
- Part 2 wraps the user-facing strings in `t()` or `i18n.t()`.
- Part 3 adds a language switch, or a CLI language option.

It does not install the CLI, initialise the config, read your API key, or translate. Translation is the step after the review, and you run it.

````markdown
# Add languages to this JS/TS app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists with a `ui` block. If either is missing,
stop now and tell the user to install ai-i18n-tools as a dev dependency and
run `ai-i18n-tools init -P <provider>`, then run this prompt again. Do not
install the CLI or initialise the config yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`).
- Do not introduce semantic keys (`saveButton`, `nav.home`). The literal in
  `t("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Runtime

Skip a piece of this part when it is already done.

1. Install `i18next` with the project's package manager. Install
   `react-i18next` only when a component uses `useTranslation()`.
2. Run `ai-i18n-tools extract` once. It writes `strings.json` and
   `ui-languages.json` even when it finds no `t()` calls, so the app compiles.
   Expect 0 strings, or 1 when `package.json` has a `description`
   (`ui.uiExtractor.includePackageDescription` is on by default).
3. Add the bootstrap below. Put it where this repository keeps its app code,
   and point the JSON imports at `ui.stringsJson`, `ui.flatOutputDir`, and
   `languagesManifestPath` when that key is set. `SOURCE_LOCALE` must equal
   config `sourceLocale`, character for character. The sample uses `en-GB`
   only as the shape.
4. Import the bootstrap from the app entry before the first render. In
   Next.js, import it from a client module. Do not call `changeLanguage` on a
   shared i18next instance inside a server component. Concurrent requests
   share that singleton. Use a per-request `createInstance()`, or a stateless
   lookup of the flat bundle.

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

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

For JSON under `public/`, the loader fetches `/locales/<code>.json` and
parses the response. For a Node CLI with no bundler, read the file with
`readFileSync` inside that function. A call that uses `{ plurals: true, count }`
also needs the
source-locale flat file under `flatOutputDir`. That file does not exist until
the user runs `translate-ui`, so leave `sourcePluralFlatBundle` out and name
the plural calls in the report.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

Read `ui.sourceRoots` and edit only those trees (JS, JSX, TS, TSX). Leave
`className`, URLs and routes, import paths, ids, test ids, enum and error
codes, object keys used as identifiers, log field names, CSS, regexes, and
comments.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. A constant that
  would call `t()` at import time must move into a function or
  `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Placeholders: `t("Hello {{name}}", { name })`. The argument must be a string
  literal. `t(variable)` and a template literal as the key are not extracted.
- Plurals: `t("{{count}} items", { plurals: true, count })`. Do not invent
  `_one` / `_other` keys.
- One `t()` per sentence. Split only where the text already branches.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

Work in passes: list string literals that are not passed to `t` or `i18n.t`,
wrap the user-facing ones, then list again. Treat any bulk rewrite as a draft
and review its diff. Then run `ai-i18n-tools extract` again.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A command-line program still gets
this part: a language option, not a widget.

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Accept only codes listed in `ui-languages.json`.

- Restore a saved locale before the first render, then draw a control labelled
  `t("Language")` whose options come from that manifest. On change, call
  `await loadLocale(code)` and then `await i18n.changeLanguage(code)`.
- In Next.js, reading `localStorage` in an effect after hydration paints the
  source locale first. Prefer a cookie the server can read, or load the saved
  locale in the client module before the first client render. Do not call
  `changeLanguage` on a shared instance inside a server component.
- A CLI: add `--lang <code>` and `-L <code>` unless those names are taken.
  Read the option before help text is built, so help can be translated too.
  After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`. Then the source locale.

## Verify and report

The project's build, type check, and tests pass. `extract` writes a non-empty
catalog of the sentences you wrapped. With the source locale, the output is
unchanged.

Report the files changed, each string you skipped with a one-line reason, the
same word used with different meanings, sentences built from translated pieces,
plurals that still need `sourcePluralFlatBundle` after the user translates,
and any `t()` that runs at import time. Then list the commands for the user,
and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then reload the app.
````

<a id="review-the-result"></a>
## Review the result

The agent ends with a report. Check it before you translate:

- The diff. Wrapped text should read the same as before, with no unrelated reformatting. `git diff --stat` shows how much changed. The bootstrap, its import, the wrapped calls, and the language switch are the expected edits.
- Generated catalogs (`strings.json`, per-locale JSON, `ui-languages.json`) are untouched apart from what `extract` wrote.
- `ai-i18n-tools extract` runs clean, and `strings.json` lists the sentences you expect.
- Your tests pass, and the app looks the same in the source language.
- The skipped strings and the ambiguous cases in the report: one word used with different meanings, sentences built from pieces, and plurals. Decide those by hand.
- `SOURCE_LOCALE` in the bootstrap equals `sourceLocale` in the config.

Strings the agent missed show up as text that stays in the source language later.

<a id="choose-models-and-translate"></a>
## Choose models and translate

You run this part. It uses your API key and spends money on your account.

The model list from `init` is a starting point. Rank the active provider's chat models and, when the shortlist looks right, write it into `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` replaces only `translationModels`. The same ranking is on the [Models](/guide/translation-dashboard/models) tab of `ai-i18n-tools dashboard`.

Then extract and translate:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` writes `strings.json` and `ui-languages.json`. `translate-ui` writes one JSON file per target language under `ui.flatOutputDir`. Leave those generated files unedited. `sync` runs `extract` and `translate-ui` together when `features.translateUIStrings` is on. What `extract` scans and writes: [UI strings, Step 2](/guide/ui-strings/#step-2-extract-strings).

`t()` looks up the source sentence in the locale JSON. The id in `strings.json` is not the lookup key. A missing file or a missing key returns the source sentence.

<a id="check-one-language"></a>
### Check one language

Reload the app, switch to one target language, and open a screen with a few wrapped strings. Use the language switch the agent added, or call `loadLocale` and `changeLanguage` yourself. Text that is still in the source language was not wrapped, runs at import time, or has no entry in the locale JSON. Check the JSON for the sentence before you suspect the code.

When a wrapped call uses `{ plurals: true, count }`, add the source-locale flat file so plural forms resolve. That adds an import of `{sourceLocale}.json` from `flatOutputDir` and a `sourcePluralFlatBundle` option, shown in [Wire i18next](/guide/ui-strings/i18next-runtime).

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `ai-i18n-tools sync` (or `extract` then `translate-ui`) after changing source text. The cache means only new or changed strings go to the model. Add the scripts from [Recommended package.json scripts](/guide/quick-start#recommended-packagejson-scripts), and run `sync` in CI so translations do not drift. Reload the app after a translation run so it picks up the new JSON. `ai-i18n-tools dashboard` opens the [Translation Dashboard](/guide/translation-dashboard/) to review translations.

The default `init` template also lists `README.md`. Paste the language-list marker before `sync` translates it. See [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Do it by hand

Work through these steps if you prefer to make the changes yourself, or you want to know what the prompt does. The steps match the parts of the prompt. You still [install the CLI](#install-and-choose-a-provider), [initialise the project](#initialise-the-project), and [translate](#choose-models-and-translate) at the end.

1. [Install the runtime libraries](#step-1-install-the-runtime-libraries).
2. [Extract once and add the bootstrap](#step-2-extract-once-and-add-the-bootstrap).
3. [Wrap strings](#step-3-wrap-strings) in `t()` or `i18n.t()`.
4. [Add a language switch](#step-4-add-a-language-switch).

<a id="step-1-install-the-runtime-libraries"></a>
## Step 1: Install the runtime libraries

ai-i18n-tools does not depend on `i18next` or `react-i18next`. The app installs them.

- Every JS/TS app that looks up strings at runtime: `i18next`.
- React components that call `useTranslation()`: `react-i18next` as well.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## Step 2: Extract once and add the bootstrap

The bootstrap imports `strings.json` and `ui-languages.json`, and only `extract` writes them. It writes both even when it finds no `t()` calls, so the app compiles.

```bash
ai-i18n-tools extract
```

Expect 0 strings, or 1 if your `package.json` has a `description`, because the extractor includes it by default (`ui.uiExtractor.includePackageDescription`).

Create the i18n setup file. This version is enough to wrap strings and translate them. `SOURCE_LOCALE` must equal `sourceLocale` in `ai-i18n-tools.config.json`. Adjust the import paths so they match `ui.stringsJson` and `ui.flatOutputDir`.

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

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

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

For JSON bundles under `public/`, the loader fetches `/locales/${code}.json`. For a Node CLI without a bundler, read the file with `readFileSync`. Both shapes are in [Locale loaders](/guide/ui-strings/i18next-runtime#locale-loaders).

Import this file from the app entry before the first render. In Next.js, import it from a client module, the same pattern as [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts).

<a id="step-3-wrap-strings"></a>
## Step 3: Wrap strings

The argument to `t()` is the source-language sentence the user should see. Flat locale files are keyed by that sentence.

JSX:

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node, a CLI, or any non-React module:

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

Rules (also in [t() calls and plurals](/guide/ui-strings/t-calls-and-plurals)):

- The key is a literal. `t(variable)` and <code>{'t(`Hello ${name}`)'}</code> are not extracted, and non-literal calls are skipped with no warning.
- Placeholders inside the literal use i18next form <code v-pre>{{name}}</code>, passed in the second argument.
- Plurals: one source sentence plus `{ plurals: true, count }`. See [Cardinal plurals](/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true). Do not invent `_one` / `_other` keys yourself.
- React components take `t` from `useTranslation()`. Other files call `i18n.t`. A constant evaluated at import time must move into a function or `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Next.js server components must not call `changeLanguage` on a shared i18next instance. Concurrent requests share that singleton. Use a per-request `createInstance()`, or a stateless lookup of the flat bundle (see the [Nextra hybrid](/guide/integrations/nextra#optional-t-for-app-react-hybrid)).

Leave these alone: `className`, `href` and other URLs, import paths, ids, test ids, error codes, object keys used as identifiers, and text inside comments.

Run `ai-i18n-tools extract` again. The catalog should now list the sentences you wrapped.

<a id="step-4-add-a-language-switch"></a>
## Step 4: Add a language switch

Restore a saved locale before the first render, as described in [Wire i18next](/guide/ui-strings/i18next-runtime#startup-locale). Then add a control that calls `await loadLocale(code)` followed by `await i18n.changeLanguage(code)`. Build the options from `ui-languages.json`. The widget, labels, and right-to-left layout: [Language switcher and RTL](/guide/ui-strings/language-switcher).

A command-line program has no widget. Add `--lang <code>` (and `-L` when that name is free), then a language environment variable the app already owns. Do not read `AI_I18N_LANG`; that variable is only for the ai-i18n-tools CLI. Accept only codes listed in `ui-languages.json`.

Skip this step when the program shows no text a person reads.

That is the last manual step. Continue at [Choose models and translate](#choose-models-and-translate).

<a id="coming-from-another-tool"></a>
## Coming from another tool

ai-i18n-tools includes its own string extractor. If you used `i18next-scanner`, `babel-plugin-i18next-extract`, or similar, you can remove those dev dependencies after migrating. Existing i18next namespace JSON files can stay on the [JSON pipeline](/guide/json#i18next-namespace-files). Intlayer `.content.ts` dictionaries can be imported with `migrate-intlayer`: see [Migrating from Intlayer](/guide/migrating-from-intlayer). To keep Intlayer at runtime and only fill its translations, use `translate-intlayer`: see [Translating Intlayer in place](/guide/translating-intlayer).

<a id="not-your-case"></a>
## Not your case?

| Your code today | Read |
| --- | --- |
| Already `t("…")` or `i18n.t("…")` with the source-language sentence | [UI strings](/guide/ui-strings/) steps 2–3, then [Wire i18next](/guide/ui-strings/i18next-runtime) |
| i18next namespace JSON (`t("saveButton")` plus `en/translation.json`) | [JSON](/guide/json). Do not switch those keys to source-language sentences unless you are ready to change every call |
| Intlayer dictionaries, moving off Intlayer | [Migrating from Intlayer](/guide/migrating-from-intlayer) |
| Intlayer dictionaries, keeping Intlayer | [Translating Intlayer in place](/guide/translating-intlayer) |
| One HTML file | [Plain HTML](/guide/ui-strings/plain-html) and `mark-html` |
| Doc sites, or Astro page HTML | [Add i18n to a website or docs site](/guide/add-i18n-to-website) and [Astro website](/guide/ui-strings/astro-website). `t()` is only for shared data and frontmatter |
| A Python app | [Add i18n to a Python app](/guide/add-i18n-to-python) |
| Django, Flask-Babel catalogs, or an app that already uses GNU gettext | [Add i18n to a Django / Python gettext app](/guide/add-i18n-to-django-gettext) |
| A repository README or other Markdown files | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Examples

| Example | What it shows |
| --- | --- |
| [console-app](/examples#console-app) | Smallest Node app, `t()` already wrapped, plus a README block |
| [nextjs-app](/examples#nextjs-app) | React bootstrap, plurals, a docs site, and a README block |

Copy one with `npx degit`. Commands: [Examples](/examples#nodejs-examples).
