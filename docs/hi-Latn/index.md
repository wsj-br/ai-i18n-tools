---
layout: home
title: ai-i18n-tools
description: >-
  LLM ka upyog karke JavaScript/TypeScript applications aur documentation sites
  ko internationalize karne ke liye CLI aur toolkit.
hero:
  name: ai-i18n-tools
  text: Kisi bhi LLM ke saath apps aur docs ka anuvad karein
  tagline: >-
    Ek config file, teen translation modes, aur aapka chuna hua provider —
    OpenAI, Anthropic, Gemini, OpenRouter, Ollama, ya koi bhi OpenAI-compatible
    API. Apne codebase ko dobara likhe bina har project ya har locale ke liye
    models badlein.
  image:
    src: /logo.svg
    alt: ai-i18n-tools logo
  actions:
    - theme: brand
      text: Shuru karein
      link: /hi-Latn/guide/quick-start
    - theme: alt
      text: GitHub par dekhein
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: npm package
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: UI strings
    details: >-
      JS, TS, aur Astro se t() calls nikalen. i18next ya static SSG lookup ke
      liye flat per-locale JSON generate karein.
  - icon: 📄
    title: Documents
    details: >-
      VitePress, Starlight, Docusaurus, Nextra, Fumadocs, aur plain static sites
      ke liye Markdown, MDX, aur Astro pages ka anuvad karein.
  - icon: 📦
    title: JSON bundles
    details: >-
      Nested locale JSON jab UI copy source t() calls ke bahar ho — theme
      labels, catalogs, aur app overrides.
  - icon: 🔄
    title: Smart caching
    details: >-
      Har pipeline mein shared SQLite cache. Reruns par kewal naye ya badle hue
      segments model ko bheje jaate hain.
  - icon: 🔌
    title: Provider-agnostic
    details: >-
      Pramukh LLM APIs ke liye built-in presets aur custom OpenAI-compatible
      endpoints. Active provider ko -P ke saath override karein.
  - icon: ⚡
    title: Ek sync command
    details: >-
      Ek single config se sahi order mein extract, translate-ui, translate-svg,
      translate-docs, aur translate-json run karein.
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## Turant install karein

Publish kiya gaya package **ESM-only** hai. Node.js `>=22.16.0` zaroori hai.

```bash
pnpm add ai-i18n-tools
# Set API key for your active provider — see preset table (default init: openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
ai-i18n-tools init [-P <provider>]
ai-i18n-tools sync
```

[Installation](/hi-Latn/guide/installation) dekhen [CLI command ko configure karne](/hi-Latn/guide/installation#using-the-cli) ke liye (jismein [cloned-monorepo development](/hi-Latn/guide/installation#cloned-monorepo) shaamil hai) aur scaffold templates ke liye [Quick start](/hi-Latn/guide/quick-start) dekhen.

<a id="which-pipeline-should-i-use"></a>
## Mujhe kaun si pipeline ka upyog karna chahiye?

| Aapka content | Command |
| --- | --- |
| Source code `t()` ka upyog karta hai | **UI strings** — `extract` / `translate-ui` |
| Localized pages ya docs sites | **Documents** — `translate-docs` |
| Standalone nested JSON locale files | **JSON** — `translate-json` |

SVG illustrations ek alag `translate-svg` path ka upyog karti hain — `docs[].contentPaths` ka nahi. Poori tulna ke liye [What is ai-i18n-tools?](/hi-Latn/guide/what-is-ai-i18n-tools) dekhein.

<a id="explore-the-documentation"></a>
## Documentation dekhein

- [**Guide**](/hi-Latn/guide/what-is-ai-i18n-tools) — translation modes, installation, quick start, aur framework integrations
- [**Integrations**](/hi-Latn/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, aur Astro
- [**Providers aur models**](/hi-Latn/guide/providers-and-models) — presets, fallback chains, aur `-P` overrides
- [**CLI reference**](/hi-Latn/reference/cli-commands/) — har command, flag, aur workflow
- [**Configuration**](/hi-Latn/reference/configuration) — poora `ai-i18n-tools.config.json` schema
- [**Examples**](/hi-Latn/examples) — `npx degit` ke saath nau chalne yogya demo project
- [**Architecture**](/hi-Latn/reference/architecture) — internals, programmatic API, aur extension points

Poori npm-style guide (provider table, CLI command list, framework quick starts) ke liye, [repository README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) dekhein. Package ko apne project mein integrate kar rahe hain? [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) se shuru karein.
