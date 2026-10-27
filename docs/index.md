---
layout: home
title: ai-i18n-tools
pageClass: home-onboarding
description: >-
  Take your single-language app, website, or repository docs multilingual with
  guided setup, AI translation, and cached reruns. Start with JavaScript,
  TypeScript, Python, or a README.
hero:
  name: ai-i18n-tools
  text: Take your single-language project multilingual.
  tagline: >-
    Add languages to your app, website, or repository docs with guided setup and
    AI translation. Choose your provider and models, and reuse cached
    translations as your project grows.
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

<a id="start-with-the-project-you-have"></a>
## Start with the project you have

One language today? Start here. That language can be any language: set it as `sourceLocale`. English is a common example in these guides. Internationalisation (i18n) prepares your project to support different languages; these guides take you from setup to your first translated experience, including the README your repository already shows on GitHub, GitLab, or any other host.

<div class="home-paths">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/typescript.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/nodejs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="javascript-or-typescript-app"></a>
### JavaScript or TypeScript app

Turn plain-text buttons, labels, and messages into a multilingual UI. Set up your runtime, mark the text to translate, and wire language switching. Includes coding-agent prompts for the preparation step.

React · Next.js · Node.js · CLI

[Add i18n to a JS/TS app](/guide/add-i18n-to-js)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/fastapi.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/flask.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-app"></a>
### Python app

Wrap user-facing text and load translated messages with a generated helper, or keep native gettext. Run the translation CLI from a standalone executable with no separate Node.js installation.

Streamlit · FastAPI · Flask · Django · CLI

[Add i18n to a Python app](/guide/add-i18n-to-python)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/astro.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/docusaurus.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="website-or-documentation"></a>
### Website or documentation

Publish localized pages and connect them to your site's language routes. Follow framework-specific steps for navigation, theme labels, and the language menu.

VitePress · Starlight · Docusaurus · Astro

[Add i18n to a website or docs site](/guide/add-i18n-to-website)

</article>
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/github.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gitlab.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/bitbucket.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="repository-readme-and-docs"></a>
### Repository README and docs

Translate `README.md` and other Markdown files into one file per language, with a row of links between them. Pair it with your app's UI strings, or translate the README on its own.

GitHub · GitLab · Bitbucket

[Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme)

</article>
</div>

Not sure which path fits? [Add i18n to your project](/guide/add-i18n-to-your-project) lists every walkthrough. [See what ai-i18n-tools does](/guide/what-is-ai-i18n-tools) for how the pipelines fit together.

<a id="from-setup-to-your-first-new-language"></a>
## From setup to your first new language

<div class="home-steps">

1. **Prepare your project.** Pick your languages, a translation provider, and the models to try. For apps, mark user-facing text and set up the translation runtime. For sites, enable your framework's language routing. The guides include coding-agent prompts where source changes are needed.
2. **Translate into files you can use.** Once setup is ready, run `sync`. It extracts supported app strings, translates the content you enabled, and writes locale files or localized pages.
3. **Load, check, and keep going.** Connect the output to your app or site, wire language switching, and check a target language. Rerun after source changes to translate new or changed text.

</div>

You handle runtime and routing setup, by hand or with a coding agent. The CLI handles extraction, translation, validation, and file generation—not automatic source rewriting or language-switcher installation. [Follow the full quick start](/guide/quick-start).

<a id="your-source-text-ready-for-more-languages"></a>
## Your source text. Ready for more languages.

This illustrative JS/TS example shows the shape of the result after runtime setup and translation. Marking the source string makes it discoverable; each generated locale file maps that sentence to its translation.

::: code-group

```js [Prepared source]
t("Save changes");
```

```json [Generated de.json]
{
  "Save changes": "Änderungen speichern"
}
```

```json [Generated pt-BR.json]
{
  "Save changes": "Salvar alterações"
}
```

```json [Generated zh-Hans.json]
{
  "Save changes": "保存更改"
}
```

:::

The source sentence stays readable in your code. Your app loads the generated locale files at runtime. Want to see the full wiring? [Explore the working Next.js example](/examples#nextjs-app). Websites follow a different path: [generate localized pages](/guide/add-i18n-to-website) instead of wrapping every paragraph.

<a id="built-for-the-next-update-too"></a>
## Built for the next update, too

<div class="home-features">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/openai.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/anthropic.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/openrouter.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gemini.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/ollama.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="choose-your-provider-and-models"></a>
### Choose your provider and models

Use supported providers like OpenAI, Anthropic, OpenRouter, Gemini, local Ollama, or nine other built-in options. You can also use any OpenAI-compatible provider. Translation quality follows the model list (`translationModels`, plus per-locale overrides). `suggest-models`, and the same ranking under dashboard **Models**, builds that list from published translation benchmarks.

[LLM providers](/guide/providers-and-models) · [AI Models](/guide/ai-models)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/refresh-cw.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="reuse-work-already-done"></a>
### Reuse work already done

Cached translations let reruns focus on new or changed text rather than translating everything again.

[Keep it translated](/guide/quick-start#keep-it-translated)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layout-dashboard.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="review-ai-output-locally"></a>
### Review AI output locally

Inspect translations, correct wording, and manage terminology in the Translation Dashboard.

[See the dashboard](/guide/translation-dashboard/)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layers.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="keep-app-and-content-together"></a>
### Keep app and content together

Translate app messages, documentation, nested locale JSON, and SVG text labels from one config. Enable only what you need.

[Combining pipelines](/guide/combining-pipelines)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/file-text.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="translate-the-readme-with-the-app"></a>
### Translate the README with the app

One `sync` covers UI strings and repository Markdown, and writes a language row into the README.

[Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme)

</article>
</div>

<a id="see-a-working-project-first"></a>
## See a working project first

These examples include configuration and committed translated files. Explore the output without an API key; rerunning translation requires a configured provider and usually a key. Local Ollama needs no API key.

<div class="home-examples">
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="a-multilingual-app"></a>
### A multilingual app

See React components, runtime wiring, plurals, and language switching in a working Next.js project.

[Explore the Next.js example](/examples#nextjs-app)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-in-practice"></a>
### Python in practice

See how a Streamlit app wraps its messages and uses translated JSON without adding a JavaScript runtime to the app.

[Explore the Streamlit example](/examples#python-streamlit)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="docs-in-more-languages"></a>
### Docs in more languages

See translated VitePress pages alongside localized navigation and theme labels.

[Explore the VitePress example](/examples#vitepress-docs)

</article>
</div>

[Browse all runnable examples](/examples), including plain HTML, other frameworks, and existing-i18n workflows.

<a id="already-have-i18n-keep-what-works"></a>
## Already have i18n? Keep what works.

You do not have to start over.

<div class="home-existing">
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/code.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="source-string-calls"></a>
### Source-string calls

Keep the `t()` and gettext calls already in the project.

[JS/TS UI strings](/guide/ui-strings/) · [Python and gettext](/guide/ui-strings/python)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/braces.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="json-bundles"></a>
### JSON bundles

Translate nested locale files, including i18next namespaces. Site navigation and theme catalogs belong to [document translation](/guide/add-i18n-to-website#what-gets-translated), not this path.

[Translate JSON bundles](/guide/json)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/languages.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="intlayer-dictionaries"></a>
### Intlayer dictionaries

Keep Intlayer and fill missing translations, or move the app onto source-string calls.

[Translate in place](/guide/translating-intlayer) · [Migrate to source-string calls](/guide/migrating-from-intlayer)

</article>
</div>

Also have diagrams? [Translate SVG text labels](/guide/svg-translation/) alongside your app or docs.

<a id="ready-to-add-your-first-language"></a>
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

<a id="go-deeper-when-you-need-to"></a>
## Go deeper when you need to

[Integrations](/guide/integrations/) · [LLM providers](/guide/providers-and-models) · [AI Models](/guide/ai-models) · [Configuration](/reference/configuration) · [CLI reference](/reference/cli-commands/)


<br/>

<br/>

::: info About this site
The non-English interface and documentation were translated with ai-i18n-tools. AI translations may contain errors.

All product names, logos and trademarks are the property of their respective owners. Icons and names are used for identification purposes only. This project is not affiliated with or endorsed by those brands.
:::
