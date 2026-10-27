<a id="add-i18n-to-a-jsts-app"></a>
# Add i18n to a JS/TS app

This page is for a JS/TS app (React, Next.js, Node, or a CLI) whose buttons, labels, and messages are still plain source-language text. `extract` records a UI string only when it is a string literal inside `t()` or `i18n.t()`, so today the catalog would be empty and `translate-ui` would have nothing to translate.

The steps: install the tool, install i18next, run `extract` once, add a small setup file so `t` exists, wrap the user-facing text, then translate. Not sure this is your case? See [Not your case?](#not-your-case) at the end.

<a id="install-the-tool-and-set-the-key"></a>
## Install the tool and set the key

Install the CLI ([Installation](/guide/installation)) and set the API key for your provider ([Provider and API key](/guide/quick-start#provider-and-api-key)). Ollama needs no key.

<a id="initialise-the-config"></a>
## Initialise the config

```bash
ai-i18n-tools init -P openrouter
```

This writes `ai-i18n-tools.config.json`. Four keys matter for now:

- `sourceLocale`: the language your text is written in. Any language is valid. English is a common example in this guide.
- `targetLocales`: the languages to add.
- `ui.sourceRoots`: the folders `extract` scans, for example `src/`.
- `ui.stringsJson` and `ui.flatOutputDir`: where the catalog and the per-locale files are written.

Every other key is in [Configuration](/reference/configuration).

<a id="install-the-runtime-libraries"></a>
## Install the runtime libraries

ai-i18n-tools does not depend on `i18next` or `react-i18next`. The app installs them.

- Every JS/TS app that looks up strings at runtime: `i18next`.
- React components that call `useTranslation()`: `react-i18next` as well.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="run-extract-once"></a>
## Run extract once

```bash
ai-i18n-tools extract
```

The setup file in the next step imports `strings.json` and `ui-languages.json`, and only `extract` writes them. It writes both even when it finds no `t()` calls, so the app compiles. Expect 0 strings, or 1 if your `package.json` has a `description`, because the extractor includes it by default (`ui.uiExtractor.includePackageDescription`).

<a id="add-the-bootstrap"></a>
## Add the bootstrap

Create the i18n setup file. This minimal version is enough to wrap strings and translate them. `SOURCE_LOCALE` must equal `sourceLocale` in `ai-i18n-tools.config.json`.

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

When the app starts using plurals, add the source-locale flat file so plural forms resolve. That adds a third import and a `sourcePluralFlatBundle` option, shown in [Wire i18next](/guide/ui-strings/i18next-runtime).

Import this file from the app entry before the first render. In Next.js, import it from a client module, the same pattern as [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts).

<a id="replace-hardcoded-copy"></a>
## Replace hardcoded copy

Do this by hand, or paste the [JS/TS prompt](#agent-prompt) into a coding agent. The argument to `t()` is the source-language sentence the user should see. Flat locale files are keyed by that sentence.

<details class="agent-prompt" id="agent-prompt">
<summary>JS/TS agent prompt</summary>

Copy this into Cursor or another coding agent. It wraps user-facing literals. It does not translate them.

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The
literal is the source-language sentence and the catalog key (`t("Save")`, not
`t("saveButton")`). After this edit the app must behave the same when the active
locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference:
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees
(JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids,
enum and error codes, object keys used as identifiers, log field names, CSS,
regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses
`useTranslation()`. Run `ai-i18n-tools extract` once so `strings.json` and
`ui-languages.json` exist, then add the bootstrap from the Wire i18next guide.
`SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant
  that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call
  `changeLanguage` on a shared i18next instance inside a server component. Use a
  per-request `createInstance()`, or a stateless flat-bundle lookup.

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

## Order

1. Install the libraries.
2. Run `ai-i18n-tools extract` once.
3. Add the bootstrap.
4. Wrap call sites.
5. Run `ai-i18n-tools extract` again. Do not run a translation yourself and do
   not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you
  wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original
  sentence. Switch one target locale after `translate-ui` and confirm those
  sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case you left for a human (the same word used with different
meanings, concatenated sentences, or a plural you were not sure about).
````

</details>


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

<a id="extract-and-translate"></a>
## Extract and translate

When the literals are in place:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`sync` runs `extract` and `translate-ui` together when `features.translateUIStrings` is on. `extract` should now list the sentences you wrapped. Open one generated locale file under `ui.flatOutputDir` and confirm the translations are there. Next: [UI strings, Step 2](/guide/ui-strings/#step-2-extract-strings) for what `extract` scans and writes.

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) is a small Node app whose `src/main.js` is already wrapped. The Next.js example is the React bootstrap.

<a id="language-switching"></a>
## Language switching

Restore a saved locale before the first render, as described in [Wire i18next](/guide/ui-strings/i18next-runtime#startup-locale). Then add a control that calls `await loadLocale(code)` followed by `await i18n.changeLanguage(code)`: [Language switcher and RTL](/guide/ui-strings/language-switcher).

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `sync` after changing source text. The cache means only new or changed strings go to the model. Add the scripts from [Recommended package.json scripts](/guide/quick-start#recommended-packagejson-scripts), and run `sync` in CI so translations do not drift.

The default `init` template also translates `README.md`. See [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

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
| A repository README or other Markdown files | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme) |
