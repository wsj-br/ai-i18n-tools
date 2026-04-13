---
sidebar_position: 2
title: Quick Start
description: Get your first translated document in under five minutes using ai-i18n-tools with this Next.js example project.
---

# Quick Start

Follow the steps below to run your first translation with `ai-i18n-tools`. This guide uses the example Next.js project you are already reading — every command should be run from the `examples/nextjs-app/` directory.

---

## Prerequisites

Before you start, make sure you have the following:

- **Node.js 18+** — check with `node --version`
- **An OpenRouter API key** — sign up at [openrouter.ai](https://openrouter.ai) and copy your key from the dashboard
- **npm or pnpm** — either package manager works

---

## Step 1 — Install dependencies

```bash
cd examples/nextjs-app
npm install
```

This installs `ai-i18n-tools` along with the Next.js and Docusaurus packages used by this example.

---

## Step 2 — Set your API key

Create a `.env` file in the `examples/nextjs-app/` directory:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` reads this variable automatically. Never commit `.env` to version control.

---

## Step 3 — Review the configuration

Open `ai-i18n-tools.config.json`. The relevant section for documentation translation looks like this:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "description": "Docusaurus docs and JSON UI strings under docs-site",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

The `contentPaths` array tells the tool which directories (or individual files) to translate. The `outputDir` is where translated files are written.

---

## Step 4 — Run the sync

Translate only the documentation (skip UI strings and SVGs for now):

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

You will see output similar to:

```
[docs] Scanning docs-site/docs/ — 2 files found
[docs] Translating to: es, fr, de, pt-BR
[docs] feature-showcase.md — 14 segments translated (4 locales)
[docs] quick-start.md — 11 segments translated (4 locales)
[docs] Done in 8.3 s (cache: 0 hits, 100 misses)
```

On the second run, most segments will be **cache hits** and the translation will complete in under a second.

---

## Step 5 — Inspect the output

Translated files are written to `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`. Open one to compare it with the source:

```bash
# Compare Spanish translation with English source
diff docs-site/docs/quick-start.md \
     docs-site/i18n/es/docusaurus-plugin-content-docs/current/quick-start.md
```

Key things to verify:

- Code blocks are **identical** to the source — no code was translated.
- Front matter values (`title`, `description`) are translated.
- Inline `code spans` inside prose are preserved verbatim.
- Links keep their original `href`; only the anchor text changes.

---

## Step 6 — Start Docusaurus

```bash
cd docs-site
npm run start -- --locale de
```

This starts the Docusaurus dev server in German. Open [http://localhost:3000/de/](http://localhost:3000/de/) in your browser to browse the translated docs.

---

## What to explore next

- Read the [Translation Feature Showcase](./feature-showcase) to see every Markdown element that `ai-i18n-tools` can handle.
- Edit a sentence in `docs-site/docs/feature-showcase.md` and re-run `sync` — only that segment will be sent to the LLM; the rest are served from cache.
- Add a term to `glossary-user.csv` to enforce consistent terminology across all locales.
- Enable the UI strings pipeline by setting `"translateUIStrings": true` and running `sync` without the `--no-ui` flag.
