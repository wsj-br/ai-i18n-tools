<p align="center">
  <img src="docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](./README.md) · [Deutsch](./translated-docs/README.de.md) · [Español](./translated-docs/README.es.md) · [Français](./translated-docs/README.fr.md) · [हिन्दी](./translated-docs/README.hi.md) · [日本語](./translated-docs/README.ja.md) · [한국어](./translated-docs/README.ko.md) · [Português (Brasil)](./translated-docs/README.pt-BR.md) · [简体中文](./translated-docs/README.zh-Hans.md) · [繁體中文](./translated-docs/README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**Translate your app and documentation with the AI model of your choice — no lock-in, no rewrites.**

CLI and toolkit for internationalizing JavaScript/TypeScript apps, Python apps, and documentation sites. Extract `t()` strings, translate Markdown, MDX, and HTML pages, JSON bundles, and SVG labels — all from one config, with built-in presets for OpenAI, Anthropic, Gemini, OpenRouter, Ollama, and any OpenAI-compatible API. Switch provider or model per project or per locale without changing your codebase.

Works with [VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), plain Markdown, and plain HTML. Python apps use `t()` / `_()` or GNU gettext (Streamlit, FastAPI, Flask, Django, and desktop toolkits). Keeps your existing [i18next](https://www.i18next.com/) catalogs (namespace JSON or `t()` source strings), and migrates [Intlayer](https://intlayer.org/) projects with `migrate-intlayer`.

<a id="features"></a>
## Features

| | |
| --- | --- |
| **UI strings** | Extract `t("…")` / `_()` from JS/TS/Astro and Python, or `data-i18n*` in one HTML file → flat per-locale JSON or GNU gettext |
| **Documents** | Translate Markdown, MDX, `.astro`, and HTML pages (one file per locale) |
| **JSON** | Translate nested locale bundles when copy lives outside `t()` calls |
| **SVG** | Translate illustrated SVG labels via `translate-svg` |
| **Smart cache** | Shared SQLite cache — only new or changed segments hit the model |
| **One `sync`** | Runs extract → UI → SVG → docs → JSON in the right order from one config |
| **Python** | Standalone executable on each GitHub Release — the CLI runs with no Node.js install |
| **Ranked models** | `suggest-models` ranks the active provider's chat models and can write `translationModels` |

<a id="which-pipeline"></a>
## Which pipeline?

| Your content | Command |
| --- | --- |
| JS/TS still has hardcoded UI copy and no `t()` yet | Wrap literals first — [Add i18n to a JS/TS app](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-js) — then UI strings |
| Source uses `t()` or `_()` (JavaScript, TypeScript, or Python), gettext, or one HTML file with `data-i18n*` markers | **UI strings** — `extract` / `translate-ui` |
| Localized pages, docs sites, or one HTML file per locale | **Documents** — `translate-docs` |
| Standalone nested JSON locale files | **JSON** — `translate-json` |
| Diagrams or illustrations with labels in SVG | **SVG** — `translate-svg` |

See [What is ai-i18n-tools?](https://wsj-br.github.io/ai-i18n-tools/guide/what-is-ai-i18n-tools) for a full comparison.

<a id="install"></a>
## Install

ESM-only. Requires Node.js `>=22.16.0`.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

Set an API key for the provider you pass to `init` (Ollama needs none):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

Configure the bare `ai-i18n-tools` command (direnv, PATH, `package.json` scripts, or `npx`) — see [Installation](https://wsj-br.github.io/ai-i18n-tools/guide/installation).

<a id="python-no-nodejs"></a>
### Python, no Node.js

Download the matching asset from the [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases): `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64`, or `ai-i18n-tools-win-x64.exe`. Check `SHA256SUMS.txt`, run `chmod +x` on Unix, and put the file on `PATH`. The binaries are not notarized or Authenticode-signed. The four Python examples are in the repository and in `ai-i18n-tools-python-examples.zip` on the release. They are not inside the npm tarball or the executable. Full steps: [Standalone executables](https://wsj-br.github.io/ai-i18n-tools/guide/installation#standalone-executables).

<a id="quick-start"></a>
## Quick start

```bash
ai-i18n-tools init -P openrouter   # scaffold config (UI strings template)
ai-i18n-tools suggest-models         # optional ranked shortlist
ai-i18n-tools suggest-models --apply # write that list to translationModels
ai-i18n-tools sync                   # extract + translate per features
```

The list from `init` is a starting point. `suggest-models` ranks the active provider's chat models. `--apply` replaces `translationModels`. The same ranking is on the [Models](https://wsj-br.github.io/ai-i18n-tools/guide/translation-dashboard/models) tab. Command reference: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/reference/cli-commands/models#suggest-models).

Other scaffolds: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, `docs-plain-html`, `ui-json-bundles`, `ui-python`, `ui-python-gettext`, `ui-python-django`, or `ui-python-flask`.

Prefer `sync` over chaining individual translate commands. Full walkthrough: [Quick start](https://wsj-br.github.io/ai-i18n-tools/guide/quick-start). Python: [Add i18n to a Python app](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python).

<a id="documentation"></a>
## Documentation

- [Documentation site](https://wsj-br.github.io/ai-i18n-tools/) — guides, integrations, and reference
- [Installation](https://wsj-br.github.io/ai-i18n-tools/guide/installation) · [Quick start](https://wsj-br.github.io/ai-i18n-tools/guide/quick-start) · [Providers and models](https://wsj-br.github.io/ai-i18n-tools/guide/providers-and-models)
- [UI strings](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/) · [Plain HTML](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python) · [Documents](https://wsj-br.github.io/ai-i18n-tools/guide/documents/) · [HTML pages](https://wsj-br.github.io/ai-i18n-tools/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/guide/svg-translation/)
- [Integrations](https://wsj-br.github.io/ai-i18n-tools/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro, and [Python](https://wsj-br.github.io/ai-i18n-tools/guide/integrations/python)
- [Add i18n to a Python app](https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-python)
- [CLI reference](https://wsj-br.github.io/ai-i18n-tools/reference/cli-commands/) · [Configuration](https://wsj-br.github.io/ai-i18n-tools/reference/configuration) · [Runtime helpers](https://wsj-br.github.io/ai-i18n-tools/guide/runtime-helpers)
- [Examples](https://wsj-br.github.io/ai-i18n-tools/examples) — runnable demos (`npx degit …`)
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — integration guide for assistants in consumer repos

<a id="contributing"></a>
## Contributing

Issues and pull requests are welcome. Maintainer workflows for this repository: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) and [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

<a id="license"></a>
## License

MIT — see [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright © 2026 Waldemar Scudeller Jr.

<br/>

Product names and icons belong to their respective owners and are used for identification purposes only. This software is not affiliated with or endorsed by those brands.

<small>

> **Note on UI and documentation translations:** All interface and documentation languages except English (UK) were translated with AI using this package (ai-i18n-tools); the wording may be imprecise or contain errors.

</small>
