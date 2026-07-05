# VitePress docs example

Minimal [VitePress](https://vitepress.dev/) site translated by [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) using `docsOutput.style: "vitepress"`.

English source pages live at `docs/`. Translated copies are committed under `docs/pt-BR/` and `docs/zh-Hans/`. VitePress nav/sidebar labels live in `docs/.vitepress/i18n/theme.en.json` and are translated to `theme.{locale}.json` via JSON (`json[]` / `translate-json`).

Full integration guide: [VitePress integration](https://wsj-br.github.io/ai-i18n-tools/guide/vitepress-integration/) on the main documentation site.

## Locales

| Code | Language |
|------|----------|
| (root) | English (`en-GB`) |
| `pt-BR` | Portuguese (Brazil) |
| `zh-Hans` | Simplified Chinese |

## Requirements

- Node.js ≥ 22.16
- pnpm ≥ 11
- OpenRouter API key (only when re-running translation)

## Installation

### Try this example on its own

Copy only this example folder and install `ai-i18n-tools` from npm:

```bash
npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs
cd vitepress-docs
pnpm install
```

### From the full ai-i18n-tools repository

Use this when you cloned the **whole** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository (not just this folder with degit). Install from the repository root so the workspace [`overrides`](../../pnpm-workspace.yaml) entry links `ai-i18n-tools` to your local checkout:

```bash
pnpm install
pnpm run build
```

## Run the site

From this directory (after degit + `pnpm install`, or `cd examples/vitepress-docs` in the monorepo):

```bash
pnpm run docs:dev
```

Open [http://localhost:3060/](http://localhost:3060/). Use the language menu for `pt-BR` and `zh-Hans`.

Production build:

```bash
pnpm run docs:build
pnpm run docs:preview
```

## Translate documentation

From this directory:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
pnpm run i18n:sync
```

Config: [`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json).

## Project layout

```text
examples/vitepress-docs/
├── ai-i18n-tools.config.json
├── glossary-user.csv
├── package.json
└── docs/
    ├── .vitepress/
    │   ├── config.mts           # loads theme.{locale}.json per locale
    │   └── i18n/
    │       ├── theme.en.json    # English theme catalog (source)
    │       ├── theme.pt-BR.json # committed translations
    │       └── theme.zh-Hans.json
    ├── index.md                 # English source
    ├── guide/getting-started.md
    ├── pt-BR/                  # committed page translations
    └── zh-Hans/
```
