---
layout: home
title: ai-i18n-tools
description: >-
  CLI and toolkit for internationalizing JavaScript/TypeScript applications and
  documentation sites using LLMs.
hero:
  name: ai-i18n-tools
  text: Translate apps & docs with any LLM
  tagline: >-
    One config file, three translation modes, and the provider you choose —
    OpenAI, Anthropic, Gemini, OpenRouter, Ollama, or any OpenAI-compatible API.
    Switch models per project or per locale without rewriting your codebase.
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
      Extract t() calls from JS, TS, and Astro. Generate flat per-locale JSON
      for i18next or static SSG lookup.
  - icon: 📄
    title: Documents
    details: >-
      Translate Markdown, MDX, and Astro pages for VitePress, Starlight,
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
---

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Quick install

The published package is **ESM-only**. Node.js `>=22.16.0` required.

```bash
pnpm add ai-i18n-tools
# Set API key for your active provider — see preset table (default init: openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
ai-i18n-tools init [-P <provider>]
ai-i18n-tools sync
```

See [Installation](/guide/installation) for [configuring the bare CLI command](/guide/installation#using-the-cli) (including [cloned-monorepo development](/guide/installation#cloned-monorepo)) and [Quick start](/guide/quick-start) for scaffold templates.

<a id="which-pipeline-should-i-use"></a>
## Which pipeline should I use?

| Your content | Command |
| --- | --- |
| Source code uses `t()` | **UI strings** — `extract` / `translate-ui` |
| Localized pages or docs sites | **Documents** — `translate-docs` |
| Standalone nested JSON locale files | **JSON** — `translate-json` |

SVG illustrations use a separate `translate-svg` path — not `docs[].contentPaths`. See [What is ai-i18n-tools?](/guide/what-is-ai-i18n-tools) for a full comparison.

<a id="explore-the-documentation"></a>
## Explore the documentation

- [**Guide**](/guide/what-is-ai-i18n-tools) — translation modes, installation, quick start, and framework integrations
- [**Integrations**](/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, and Astro
- [**Providers and models**](/guide/providers-and-models) — presets, fallback chains, and `-P` overrides
- [**CLI reference**](/reference/cli-commands/) — every command, flag, and workflow
- [**Configuration**](/reference/configuration) — full `ai-i18n-tools.config.json` schema
- [**Examples**](/examples) — nine runnable demo projects with `npx degit`
- [**Architecture**](/reference/architecture) — internals, programmatic API, and extension points

Integrating the package into your own project? Start with [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md). The [repository README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) is a short GitHub/npm landing page that links here for detail.
