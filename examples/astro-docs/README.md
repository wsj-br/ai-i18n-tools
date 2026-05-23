# Astro Starlight docs example

Multilingual documentation site built with [Astro Starlight](https://starlight.astro.build/), translated by [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools).

English source pages live at the root of `src/content/docs/`. Translated copies are committed under `src/content/docs/<locale>/` using `markdownOutput.style: "astro-starlight"` (alias of `doc-system` with an empty locale subpath).

Compare with the Docusaurus demo at `examples/nextjs-app/docs-site/` — same tutorial content, different output layout (`style: "docusaurus"`).

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

Install from the **repository root**:

```bash
pnpm install
pnpm run build
```

## Run the site

```bash
cd examples/astro-docs
pnpm dev
```

Open [http://localhost:3050/quick-start](http://localhost:3050/quick-start). Use the language switcher or paths such as `/de/quick-start` and `/ar/feature-showcase`.

Production build:

```bash
pnpm build
pnpm preview
```

## Translate documentation

From `examples/astro-docs/`:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
pnpm run i18n:sync
```

Config: [`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json). See [Quick Start](./src/content/docs/quick-start.md) for a full walkthrough.

## Project layout

```text
examples/astro-docs/
├── ai-i18n-tools.config.json
├── astro.config.mjs
├── glossary-user.csv
├── package.json
├── public/
└── src/content/docs/
    ├── quick-start.md          # English source
    ├── feature-showcase.mdx
    ├── ar/ …                   # committed translations
    ├── de/
    ├── es/
    ├── fr/
    └── pt-br/
```

## Screenshot files — expected layout

The `feature-showcase.mdx` page references locale-specific screenshots, but no actual PNG files are committed and no `take-screenshots` script is included. This example is a configuration demonstration.

The `ai-i18n-tools.config.json` uses this `regexAdjustments` rule:

```json
{ "search": "screenshots/[^/]+/", "replace": "screenshots/${translatedLocale}/" }
```

For the page to display locale-specific screenshots you would need PNG files at:

```
public/img/screenshots/
├── en-GB/
│   └── screenshot.png
├── de/
│   └── screenshot.png
├── es/
│   └── screenshot.png
├── fr/
│   └── screenshot.png
├── pt-BR/
│   └── screenshot.png
└── ar/
    └── screenshot.png
```

A `take-screenshots` script must capture the app at each locale and write to `public/img/screenshots/<locale>/screenshot.png`. The tool rewrites URLs only — it does not create PNG files.

Use the generic `screenshots/[^/]+/` form (not `screenshots/en-GB/`) in `search` so the rule works regardless of `sourceLocale`.

See the [Locale assets guide](../../docs/LOCALE-ASSETS-GUIDE.md) for full pattern documentation.
