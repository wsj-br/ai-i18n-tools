<a id="add-i18n-to-a-js-ts-app"></a>
# Add i18n to a JS/TS app

`extract` records a UI string only when it is a **string literal** inside `t()` or `i18n.t()`. A React, Next.js, Node, or CLI project whose buttons, labels, and messages are still plain source-language text produces an empty catalog. `translate-ui` then has nothing to translate, and the UI stays in the source language.

This page is the preparation step: install the runtime libraries, add a bootstrap so `t` exists, then wrap user-facing literals. After that, follow [UI strings](/guide/ui-strings/) steps 2–3.

<a id="which-page"></a>
## Which page

| Your code today | Read |
| --- | --- |
| JS/TS/JSX with source-language literals and no `t()` yet (React, Next.js, Node, CLI) | This page |
| Already `t("English…")` or `i18n.t("English…")` | [UI strings](/guide/ui-strings/) steps 2–3, then [Wire i18next](/guide/ui-strings/i18next-runtime) |
| i18next namespace JSON (`t("saveButton")` plus `en/translation.json`) | [JSON](/guide/json). Do not switch those keys to English sentences unless you are ready to change every call |
| Intlayer dictionaries | [Migrating from Intlayer](/guide/migrating-from-intlayer) |
| One HTML file | [Plain HTML](/guide/ui-strings/plain-html) and `mark-html` |
| Doc sites, or Astro page HTML | [Documents](/guide/documents/) and [Astro website](/guide/ui-strings/astro-website). `t()` is only for shared data and frontmatter |

<a id="what-extract-can-see"></a>
## What extract can see

Until a user-facing string is a literal inside `t()` or `i18n.t()`, it is not translated. An empty `strings.json` after `sync` usually means this step was skipped. Non-literal calls such as `t(label)` are skipped with no warning. Details of what the scanner opens: [What extract scans](/guide/ui-strings/#what-extract-scans).

<a id="install-the-runtime-libraries"></a>
## Install the runtime libraries

`ai-i18n-tools` does not depend on `i18next` or `react-i18next`. The app installs them.

- Every JS/TS app that looks up strings at runtime: `i18next`.
- React components that call `useTranslation()`: `react-i18next` as well.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="add-the-bootstrap-first"></a>
## Add the bootstrap first

Add the i18n bootstrap before you edit call sites, so `t` exists while you wrap strings. Copy the setup in [Wire i18next](/guide/ui-strings/i18next-runtime). `SOURCE_LOCALE` in that file must equal `sourceLocale` in `ai-i18n-tools.config.json`.

Import the bootstrap from the app entry before the first render. In Next.js, import it from a client module, the same pattern as [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts) (the example page is `"use client"` and imports that module).

<a id="replace-hardcoded-copy"></a>
## Replace hardcoded copy

Do this by hand, or paste the [JS/TS prompt](#agent-prompt) into a coding agent. The argument to `t()` is the source-language sentence the user should see. Flat locale files are keyed by that sentence.

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

Rules (also in [t() calls & plurals](/guide/ui-strings/t-calls-and-plurals)):

- The key is a literal. `t(variable)` and <code>{'t(`Hello ${name}`)'}</code> are not extracted.
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
```

`sync` runs both when `features.translateUIStrings` is on. Continue at [UI strings — Step 2](/guide/ui-strings/#step-2-extract-strings).

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) is a small Node app whose `src/main.js` is already wrapped. The Next.js example is the React bootstrap.

<a id="language-switching"></a>
## Language switching

Switching language is a later step: [Language switcher & RTL](/guide/ui-strings/language-switcher). Restore a saved locale before the first render, as described in [Wire i18next](/guide/ui-strings/i18next-runtime#startup-locale).

<a id="agent-prompt"></a>
## Agent prompt

Copy this into Cursor or another coding agent. It wraps user-facing literals. It does not translate them.

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The literal is the source-language sentence and the catalog key (`t("Save")`, not `t("saveButton")`). After this edit the app must behave the same when the active locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference: https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime and https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees (JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids, enum and error codes, object keys used as identifiers, log field names, CSS, regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses `useTranslation()`. Add the bootstrap from the Wire i18next guide first. `SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call `changeLanguage` on a shared i18next instance inside a server component. Use a per-request `createInstance()`, or a stateless flat-bundle lookup.

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

1. Install the libraries and add the bootstrap.
2. Wrap call sites.
3. Run `ai-i18n-tools extract`. Do not run a translation yourself and do not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original sentence. Switch one target locale after `translate-ui` and confirm those sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason, and any ambiguous case you left for a human (the same word used with different meanings, concatenated sentences, or a plural you were not sure about).
````
