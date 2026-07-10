---
sidebar_position: 2
title: Quick Start
description: Get your first translated document in under five minutes using ai-i18n-tools with this Docusaurus example project.
---

Follow the steps below to run your first translation with `ai-i18n-tools`. This guide uses the Docusaurus example you are already reading — every command should be run from the `examples/docusaurus-docs/` directory.

---

## Prerequisites {#prerequisites}

Before you start, make sure you have the following:

- **Node.js 22.16+** — check with `node --version`
- **An OpenRouter API key** — sign up at [openrouter.ai](https://openrouter.ai) and copy your key from the dashboard
- **pnpm 10.33+** — check with `pnpm --version`

---

## Step 1 — Install dependencies {#step-1--install-dependencies}

```bash
cd examples/docusaurus-docs
pnpm install
```

This installs `ai-i18n-tools` along with the Docusaurus packages used by this example.

---

## Step 2 — Set your API key {#step-2--set-your-api-key}

Create a `.env` file in the `examples/docusaurus-docs/` directory:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` reads this variable automatically. Never commit `.env` to version control.

---

## Step 3 — Review the configuration {#step-3--review-the-configuration}

Open `ai-i18n-tools.config.json`. The relevant section for documentation translation looks like this:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus docs and shell JSON catalogs",
      "contentPaths": ["docs/"],
      "outputDir": "i18n",
      "docusaurusCatalogDir": "i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in static assets",
              "search": "screenshots/[^/]+/",
              "replace": "screenshots/${translatedLocale}/"
            }
          ]
        }
      }
    }
  ]
}
```

The `contentPaths` array tells the tool which directories (or individual files) to translate. The `outputDir` is where translated files are written.

---

## Step 4 — Run the sync {#step-4--run-the-sync}

Translate the documentation and Docusaurus shell JSON:

```bash
pnpm run i18n:sync
```

You will see output similar to:

```text
[docs] Scanning docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (5 locales)
[docs] quick-start.md — 11 segments translated (5 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

On the second run, most segments will be **cache hits** and the translation will complete in under a second.

---

## Step 5 — Inspect the output {#step-5--inspect-the-output}

Translated files are written to `i18n/<locale>/docusaurus-plugin-content-docs/current/`. Open one to compare it with the source:

```bash
# Compare Spanish translation with English source
diff docs/quick-start.md \
     i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Key things to verify:

- Code blocks are **identical** to the source — no code was translated.
- Front matter values (`title`, `description`) are translated.
- Inline `code spans` inside prose are preserved verbatim.
- Links keep their original `href`; only the anchor text changes.

---

## Step 6 — Start Docusaurus {#step-6--start-docusaurus}

```bash
pnpm start
```

This builds every locale and serves the site so the navbar language menu works. Open [http://localhost:3100/quick-start](http://localhost:3100/quick-start), then switch to Portuguese (Brazil) — for example [http://localhost:3100/pt-BR/feature-showcase](http://localhost:3100/pt-BR/feature-showcase).

While editing English sources, `pnpm dev` gives hot reload for the default locale only; re-run `pnpm start` to refresh all locales after changes.

---

## What to explore next {#what-to-explore-next}

- Read the [Translation Feature Showcase](./feature-showcase) to see every Markdown element that `ai-i18n-tools` can handle.
- Edit a sentence in `docs/feature-showcase.md` and re-run `pnpm run i18n:sync` — only that segment will be sent to the LLM; the rest are served from cache.
- Add a term to `glossary-user.csv` to enforce consistent terminology across all locales.
- For UI strings, cardinal plurals, SVG translation, and a flat README in the same repo, see the combined [Next.js example](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app).
