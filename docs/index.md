---
layout: home
title: ai-i18n-tools
description: >-
  CLI and toolkit for internationalizing JavaScript/TypeScript applications,
  Python applications, and documentation sites with the LLM provider of your choice.
hero:
  name: ai-i18n-tools
  text: Translate apps & docs with any LLM
  tagline: >-
    Extract t() strings from JavaScript, TypeScript, and Python. Translate Markdown,
    MDX, HTML pages, JSON bundles, and SVG labels — all from one config, with OpenAI,
    Anthropic, Gemini, OpenRouter, Ollama, or any OpenAI-compatible API. Switch models
    per project or per locale without rewriting your codebase.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools logo
  actions:
    - theme: brand
      text: Get started
      link: /guide/quick-start
    - theme: alt
      text: View on GitHub
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: npm package
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: UI strings
    details: >-
      Extract t() and _() from JavaScript, TypeScript, Astro, and Python, or
      data-i18n markers in one HTML file. Flat per-locale JSON, or GNU gettext catalogs.
  - icon: 📄
    title: Documents
    details: >-
      Translate Markdown, MDX, Astro, and HTML pages for VitePress, Starlight,
      Docusaurus, Nextra, Fumadocs, and plain static sites.
  - icon: 📦
    title: JSON bundles
    details: >-
      Nested locale JSON when UI copy lives outside source t() calls — theme
      labels, catalogs, and app overrides.
  - icon: 🔄
    title: Smart caching
    details: >-
      Shared SQLite cache across every pipeline. Only new or changed segments
      are sent to the model on reruns.
  - icon: 🔌
    title: Provider-agnostic
    details: >-
      Built-in presets for major LLM APIs plus custom OpenAI-compatible
      endpoints. Override the active provider with -P.
  - icon: ⚡
    title: One sync command
    details: >-
      Run extract, translate-ui, translate-svg, translate-docs, and
      translate-json in the right order from a single config.
  - icon: 🐍
    title: Python, no Node.js
    details: >-
      A standalone executable on each GitHub Release runs the CLI for Python
      apps. Streamlit, FastAPI, Flask, Django, and gettext included.
  - icon: 📊
    title: Ranked model list
    details: >-
      suggest-models ranks the active provider's chat models and can write
      translationModels. The same ranking is on the dashboard Models tab.
---

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Quick install

The published package is **ESM-only**. Node.js `>=22.16.0` required.

```bash
pnpm add ai-i18n-tools
# Set the API key for the provider you pass to init — see the preset table
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models
ai-i18n-tools sync
```

`suggest-models` ranks the active provider's models. Add `--apply` to replace the scaffolded `translationModels` list. See [Quick start](/guide/quick-start) and the [Models](/guide/translation-dashboard/models) tab.

<a id="python-no-nodejs"></a>
### Python, no Node.js

Download the matching file from the [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases): `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64`, or `ai-i18n-tools-win-x64.exe`. Check `SHA256SUMS.txt`, run `chmod +x` on Unix, and put the file on `PATH`. The binaries are unsigned. Steps: [Standalone executables](/guide/installation#standalone-executables). Then `ai-i18n-tools init -t ui-python -P cheaperinference`. Walkthrough: [Add i18n to a Python app](/guide/add-i18n-to-python).

See [Installation](/guide/installation) for [configuring the bare CLI command](/guide/installation#using-the-cli) (including [cloned-monorepo development](/guide/installation#cloned-monorepo)) and [Quick start](/guide/quick-start) for scaffold templates.

<a id="which-pipeline-should-i-use"></a>
## Which pipeline should I use?

| Your content | Command |
| --- | --- |
| JS/TS still has hardcoded UI copy and no `t()` yet | Wrap literals first — [Add i18n to a JS/TS app](/guide/add-i18n-to-js) — then UI strings |
| Source code uses `t()` or `_()` (JavaScript, TypeScript, or Python), gettext, or one HTML file with markers | **UI strings** — `extract` / `translate-ui` |
| Localized pages, docs sites, or one HTML file per locale | **Documents** — `translate-docs` |
| Standalone nested JSON locale files | **JSON** — `translate-json` |

SVG illustrations use a separate `translate-svg` path — not `docs[].contentPaths`. See [What is ai-i18n-tools?](/guide/what-is-ai-i18n-tools) for a full comparison.

<a id="explore-the-documentation"></a>
## Explore the documentation

- [**Guide**](/guide/what-is-ai-i18n-tools) — translation modes, installation, quick start, and framework integrations
- [**Integrations**](/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro, and Python
- [**Providers and models**](/guide/providers-and-models) — presets, fallback chains, ranked suggestions (`suggest-models`), and `-P` overrides
- [**CLI reference**](/reference/cli-commands/) — every command, flag, and workflow
- [**Configuration**](/reference/configuration) — full `ai-i18n-tools.config.json` schema
- [**Examples**](/examples) — seventeen runnable demo projects (`npx degit`, or the Python examples zip)
- [**Architecture**](/reference/architecture) — internals, programmatic API, and extension points

Integrating the package into your own project? Start with [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md). The [repository README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) is a short GitHub/npm landing page that links here for detail.


<br/>
<br/>

::: tip Disclaimer
Product names and icons belong to their respective owners and are used for identification purposes only. This software is not affiliated with or endorsed by those brands.

All interface and documentation languages except English (UK) were translated with AI using this package (ai-i18n-tools); the wording may be imprecise or contain errors.
:::

<br/>
