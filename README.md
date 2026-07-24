<p align="center">
  <img src="docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](./README.md) · [Deutsch](./translated-docs/README.de.md) · [Español](./translated-docs/README.es.md) · [Français](./translated-docs/README.fr.md) · [हिन्दी](./translated-docs/README.hi.md) · [日本語](./translated-docs/README.ja.md) · [한국어](./translated-docs/README.ko.md) · [Português (Brasil)](./translated-docs/README.pt-BR.md) · [简体中文](./translated-docs/README.zh-Hans.md) · [繁體中文](./translated-docs/README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Translate your app and documentation with the AI model of your choice — no lock-in, no rewrites.**

CLI and toolkit for internationalizing JavaScript/TypeScript apps and documentation sites (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, plain Markdown/MDX). Use built-in presets for OpenAI, Anthropic, Gemini, OpenRouter, Ollama, and more — or any OpenAI-compatible API. Switch provider or model per project or per locale without changing your codebase.

<a id="features"></a>
## Features

| | |
| --- | --- |
| **UI strings** | Extract `t("…")` from JS/TS/Astro (and `data-i18n*` in HTML) → flat per-locale JSON |
| **Documents** | Translate Markdown, MDX, and `.astro` pages for major doc frameworks |
| **JSON** | Translate nested locale bundles when copy lives outside `t()` calls |
| **SVG** | Translate illustrated SVG labels via `translate-svg` |
| **Smart cache** | Shared SQLite cache — only new or changed segments hit the model |
| **One `sync`** | Runs extract → UI → SVG → docs → JSON in the right order from one config |

<a id="which-pipeline"></a>
## Which pipeline?

| Your content | Command |
| --- | --- |
| Source uses `t()` or HTML markers | **UI strings** — `extract` / `translate-ui` |
| Localized pages or docs sites | **Documents** — `translate-docs` |
| Standalone nested JSON locale files | **JSON** — `translate-json` |

See [What is ai-i18n-tools?](docs/guide/what-is-ai-i18n-tools.md) for a full comparison.

<a id="install"></a>
## Install

ESM-only. Requires Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

Set an API key for your provider (default `init` uses OpenRouter; Ollama needs none):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Configure the bare `ai-i18n-tools` command (direnv, PATH, `package.json` scripts, or `npx`) — see [Installation](docs/guide/installation.md).

<a id="quick-start"></a>
## Quick start

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

Docs-oriented scaffolds: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, or `ui-json-bundles`.

Prefer `sync` over chaining individual translate commands. Full walkthrough: [Quick start](docs/guide/quick-start.md).

<a id="documentation"></a>
## Documentation

- [Documentation site](https://wsj-br.github.io/ai-i18n-tools/) — guides, integrations, and reference
- [Installation](docs/guide/installation.md) · [Quick start](docs/guide/quick-start.md) · [Providers and models](docs/guide/providers-and-models.md)
- [UI strings](docs/guide/ui-strings/) · [Documents](docs/guide/documents/) · [JSON](docs/guide/json.md) · [SVG](docs/guide/svg-translation/)
- [Integrations](docs/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [CLI reference](docs/reference/cli-commands/) · [Configuration](docs/reference/configuration.md) · [Runtime helpers](docs/guide/runtime-helpers.md)
- [Examples](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) — runnable demos (`npx degit …`)
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — integration guide for assistants in consumer repos

<a id="contributing"></a>
## Contributing

Issues and pull requests are welcome. Maintainer workflows for this repository: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) and [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

<a id="license"></a>
## License

MIT — see [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.
