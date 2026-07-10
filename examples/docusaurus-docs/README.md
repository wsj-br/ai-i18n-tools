# Docusaurus docs example

Minimal [Docusaurus](https://docusaurus.io/) site translated by [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) using `docsOutput.style: "docusaurus"`.

English source pages live at `docs/`. Translated copies are committed under `i18n/<locale>/docusaurus-plugin-content-docs/current/`. Docusaurus navbar, footer, and theme strings are loaded from `i18n/en/` (via `docusaurus write-translations`) and translated into sibling locale folders through **`docs[].docusaurusCatalogDir`** inside `translate-docs`.

Compare with [examples/astro-docs](../astro-docs/) — same tutorial topics, Docusaurus output style instead of Starlight. For a full-stack demo (Next.js UI, flat README, SVG assets, and a nested docs site), see [examples/nextjs-app](../nextjs-app/).

Full integration guide: [Docusaurus integration](https://wsj-br.github.io/ai-i18n-tools/guide/integrations/docusaurus/) on the main documentation site.

## Locales

| Code | Language |
|------|----------|
| (root) | English (`en-GB`) |
| `ar` | Arabic (RTL) |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `pt-BR` | Portuguese (Brazil) |

## Requirements

- Node.js ≥ 22.16
- pnpm ≥ 10.33
- OpenRouter API key (only when re-running translation)

## Installation

### Try this example on its own

```bash
npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs
cd docusaurus-docs
pnpm install
```

### From the full ai-i18n-tools repository

Use this when you cloned the **whole** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository (not just this folder with degit). Install from the repository root so the workspace [`overrides`](../../pnpm-workspace.yaml) entry links `ai-i18n-tools` to your local checkout:

```bash
pnpm install
pnpm run build
```

## Run the site

From this directory (after degit + `pnpm install`, or `cd examples/docusaurus-docs` in the monorepo):

```bash
pnpm start
```

This **builds every locale** and serves the production output so the navbar language menu works (Docusaurus dev mode only loads one locale at a time, which breaks locale switching). Open [http://localhost:3100/quick-start](http://localhost:3100/quick-start). Use the language menu or paths such as `/de/quick-start` and `/pt-BR/feature-showcase`.

After editing English docs, run `pnpm start` again (or `pnpm build && pnpm serve`) to refresh the served site.

### English hot reload (single locale)

While authoring English pages, use dev mode for faster feedback — the locale dropdown will not work until you run `pnpm start` again:

```bash
pnpm dev
```

### Per-locale dev server

To hot-reload a single non-English locale:

| Goal | Command |
|------|---------|
| English hot reload | `pnpm dev` → `/quick-start` (no `/en/` prefix) |
| German hot reload | `pnpm run start:de` → `/de/quick-start` |
| Portuguese (BR) hot reload | `pnpm run start:pt-BR` → `/pt-BR/quick-start` |
| Arabic (RTL) hot reload | `pnpm run start:ar` → `/ar/quick-start` |

Build only (no server):

```bash
pnpm build
pnpm serve
```

## Translate documentation

From this directory:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
pnpm run i18n:sync
```

Config: [`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json). See [Quick Start](./docs/quick-start.md) for a full walkthrough.

When you upgrade `@docusaurus/*` or change navbar/footer labels, run `pnpm run write-translations`, commit updates under `i18n/en/`, then re-run `pnpm run i18n:sync` so shell JSON is translated.

## Project layout

```text
examples/docusaurus-docs/
├── ai-i18n-tools.config.json
├── glossary-user.csv
├── package.json
├── docusaurus.config.mjs
├── docs/
│   ├── quick-start.md          # English source
│   └── feature-showcase.md
├── i18n/
│   ├── en/                     # write-translations catalog (source)
│   ├── de/docusaurus-plugin-content-docs/current/ …
│   ├── es/ …
│   ├── fr/ …
│   ├── pt-BR/ …
│   └── ar/ …
└── src/
    ├── css/custom.css
    └── pages/index.jsx         # root redirect → quick-start
```

## Screenshot files — expected layout

The `feature-showcase.md` page references locale-specific screenshots, but no actual PNG files are committed and no `take-screenshots` script is included. This example is a configuration demonstration.

The `ai-i18n-tools.config.json` uses this `regexAdjustments` rule:

```json
{ "search": "screenshots/[^/]+/", "replace": "screenshots/${translatedLocale}/" }
```

For the page to display locale-specific screenshots you would need PNG files at:

```
static/img/screenshots/
├── en-GB/
│   └── screenshot.png
├── de/
├── es/
├── fr/
├── pt-BR/
└── ar/
```

A `take-screenshots` script must capture the app at each locale and write to `static/img/screenshots/<locale>/screenshot.png`. The tool rewrites URLs only — it does not create PNG files.

See the [Locale assets guide](../../docs/LOCALE-ASSETS-GUIDE.md) for full pattern documentation.
