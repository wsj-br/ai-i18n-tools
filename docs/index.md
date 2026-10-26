---
layout: home
title: ai-i18n-tools
pageClass: home-onboarding
description: >-
  Take your single-language app, website, or repository docs multilingual with guided setup,
  AI translation, and cached reruns. Start with JavaScript, TypeScript, Python, or a README.
hero:
  name: ai-i18n-tools
  text: Take your single-language project multilingual.
  tagline: >-
    Add languages to your app, website, or repository docs with guided setup and AI translation.
    Choose your provider and reuse cached translations as your project grows.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools logo
  actions:
    - theme: brand
      text: Choose your project
      link: '#start-here'
    - theme: alt
      text: Explore examples
      link: /examples
---

<a id="start-here"></a>
## Start with the project you have

One language today? Start here. Internationalisation (i18n) prepares your project to support different languages; these guides take you from setup to your first translated experience, including the README your repository already shows on GitHub, GitLab, or any other host.

<div class="home-paths">
<article class="home-card">

### JavaScript or TypeScript app

Turn plain-text buttons, labels, and messages into a multilingual UI. Set up your runtime, mark the text to translate, and wire language switching. Includes coding-agent prompts for the preparation step.

React · Next.js · Node.js · CLI

[Add i18n to a JS/TS app](/guide/add-i18n-to-js)

</article>
<article class="home-card">

### Python app

Wrap user-facing text and load translated messages with a generated helper, or keep native gettext. Run the translation CLI from a standalone executable with no separate Node.js installation.

Streamlit · FastAPI · Flask · Django

[Add i18n to a Python app](/guide/add-i18n-to-python)

</article>
<article class="home-card">

### Website or documentation

Publish localized pages and connect them to your site's language routes. Follow framework-specific steps for navigation, theme labels, and the language menu.

VitePress · Starlight · Docusaurus · Astro

[Add i18n to a website or docs site](/guide/add-i18n-to-website)

</article>
<article class="home-card">

### Repository README and docs

Translate `README.md` and other Markdown files into one file per language, with a row of links between them. Pair it with your app's UI strings, or translate the README on its own.

GitHub · GitLab · Bitbucket

[Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme)

</article>
</div>

Not sure which path fits? [Add i18n to your project](/guide/add-i18n-to-your-project) lists every walkthrough. [See what ai-i18n-tools does](/guide/what-is-ai-i18n-tools) for how the pipelines fit together.

## From setup to your first new language

<div class="home-steps">

1. **Prepare your project.** Pick your languages and translation provider. For apps, mark user-facing text and set up the translation runtime. For sites, enable your framework's language routing. The guides include coding-agent prompts where source changes are needed.
2. **Translate into files you can use.** Once setup is ready, run `sync`. It extracts supported app strings, translates the content you enabled, and writes locale files or localized pages.
3. **Load, check, and keep going.** Connect the output to your app or site, wire language switching, and check a target language. Rerun after source changes to translate new or changed text.

</div>

You handle runtime and routing setup, by hand or with a coding agent. The CLI handles extraction, translation, validation, and file generation—not automatic source rewriting or language-switcher installation. [Follow the full quick start](/guide/quick-start).

## Your source text. Ready for more languages.

This illustrative JS/TS example shows the shape of the result after runtime setup and translation. Marking the source string makes it discoverable; the generated locale file maps that sentence to its translation.

::: code-group

```js [Prepared source]
t("Save changes");
```

```json [Generated de.json]
{
  "Save changes": "Änderungen speichern"
}
```

:::

The source sentence stays readable in your code. Your app loads the generated locale files at runtime. Want to see the full wiring? [Explore the working Next.js example](/examples#nextjs-app). Websites follow a different path: [generate localized pages](/guide/add-i18n-to-website) instead of wrapping every paragraph.

## Built for the next update, too

<div class="home-features">
<article class="home-card">

### Choose your translation provider

Use supported providers such as OpenAI, Anthropic, or Gemini, a custom OpenAI-compatible endpoint, or local Ollama.

[Providers and models](/guide/providers-and-models)

</article>
<article class="home-card">

### Reuse work already done

Cached translations let reruns focus on new or changed text rather than translating everything again.

[Keep it translated](/guide/quick-start#keep-it-translated)

</article>
<article class="home-card">

### Review AI output locally

Inspect translations, correct wording, and manage terminology in the Translation Dashboard.

[See the dashboard](/guide/translation-dashboard/)

</article>
<article class="home-card">

### Keep app and content together

Translate app messages, documentation, nested locale JSON, and SVG text labels from one config. Enable only what you need.

[Combining pipelines](/guide/combining-pipelines)

</article>
<article class="home-card">

### Translate the README with the app

One `sync` covers UI strings and repository Markdown, and writes a language row into the README.

[Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme)

</article>
</div>

## See a working project first

These examples include configuration and committed translated files. Explore the output without an API key; rerunning translation requires a configured provider and usually a key. Local Ollama needs no API key.

<div class="home-examples">
<article class="home-card">

### A multilingual app

See React components, runtime wiring, plurals, and language switching in a working Next.js project.

[Explore the Next.js example](/examples#nextjs-app)

</article>
<article class="home-card">

### Python in practice

See how a Streamlit app wraps its messages and uses translated JSON without adding a JavaScript runtime to the app.

[Explore the Streamlit example](/examples#python-streamlit)

</article>
<article class="home-card">

### Docs in more languages

See translated VitePress pages alongside localized navigation and theme labels.

[Explore the VitePress example](/examples#vitepress-docs)

</article>
</div>

[Browse all runnable examples](/examples), including plain HTML, other frameworks, and existing-i18n workflows.

## Already have i18n? Keep what works.

You do not have to start over:

- Existing source-string calls: [JS/TS UI strings](/guide/ui-strings/) or [Python and gettext](/guide/ui-strings/python).
- Nested app locale files, including i18next namespaces: [Translate JSON bundles](/guide/json). Supported site-framework navigation and theme catalogs belong to [document translation](/guide/add-i18n-to-website#what-gets-translated), not this JSON path.
- Intlayer dictionaries: [Translate in place](/guide/translating-intlayer), or [migrate to source-string calls](/guide/migrating-from-intlayer).

Also have diagrams? [Translate SVG text labels](/guide/svg-translation/) alongside your app or docs.

<a id="quick-install"></a>
## Ready to add your first language?

<div class="home-cta">

[Choose your project](#start-here) for the complete walkthrough, or [open the quick start](/guide/quick-start) for installation and configuration.

Install the [npm package](/guide/installation) for a Node.js project.

<a id="python-no-nodejs"></a>

For Python, [download the standalone executable](/guide/installation#standalone-executables)—no separate Node.js installation required.

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

</div>

</div>

<a id="explore-the-documentation"></a>
## Go deeper when you need to

[Integrations](/guide/integrations/) · [Providers and models](/guide/providers-and-models) · [Configuration](/reference/configuration) · [CLI reference](/reference/cli-commands/)

::: info About this site
The non-English interface and documentation were translated with ai-i18n-tools. AI translations may contain errors; review important wording before publishing.

Product names belong to their respective owners. This project is not affiliated with or endorsed by those brands.
:::
