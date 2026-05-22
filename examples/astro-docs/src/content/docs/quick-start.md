---
title: Quick Start
description: Get your first translated document in under five minutes using ai-i18n-tools with this Astro Starlight example.
sidebar:
  order: 2
---

Follow the steps below to run your first translation with `ai-i18n-tools`. This guide uses the Starlight example you are reading — every command should be run from the `examples/astro-docs/` directory.

---

<a id="prerequisites"></a>

## Prerequisites
Before you start, make sure you have the following:

- **Node.js 22.16+** — check with `node --version`
- **An OpenRouter API key** — sign up at [openrouter.ai](https://openrouter.ai) and copy your key from the dashboard
- **pnpm 10.33+** — check with `pnpm --version`

---

<a id="step-1--install-dependencies"></a>

## Step 1 — Install dependencies
```bash
cd examples/astro-docs
pnpm install
```

This installs `ai-i18n-tools` (via the workspace) along with Astro and Starlight.

---

<a id="step-2--set-your-api-key"></a>

## Step 2 — Set your API key
Create a `.env` file in the `examples/astro-docs/` directory:

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
```

`ai-i18n-tools` reads this variable automatically. Never commit `.env` to version control.

---

<a id="step-3--review-the-configuration"></a>

## Step 3 — Review the configuration
Open `ai-i18n-tools.config.json`. The relevant section for documentation translation looks like this:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": false
  },
  "documentations": [
    {
      "description": "Starlight docs under src/content/docs",
      "contentPaths": [
        "src/content/docs/quick-start.md",
        "src/content/docs/feature-showcase.mdx"
      ],
      "outputDir": "src/content/docs",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "astro-starlight",
        "docsRoot": "src/content/docs",
        "postProcessing": {
          "regexAdjustments": [
            {
              "description": "Per-locale screenshot folders in public assets",
              "search": "screenshots/en-GB/",
              "replace": "screenshots/${translatedLocale}/"
            }
          ]
        }
      }
    }
  ]
}
```

The `contentPaths` array tells the tool which files to translate. Translated copies are written under `src/content/docs/<locale>/` (Starlight’s locale folders).

---

<a id="step-4--run-the-sync"></a>

## Step 4 — Run the sync
Translate the documentation:

```bash
npx ai-i18n-tools sync --no-ui --no-svg
```

You will see output similar to:

```text
[docs] Scanning src/content/docs/ — 2 files found
[docs] Translating to: ar, es, fr, de, pt-BR
[docs] feature-showcase.mdx — segments translated (5 locales)
[docs] quick-start.md — segments translated (5 locales)
```

On the second run, most segments will be **cache hits** and the translation will complete quickly.

---

<a id="step-5--inspect-the-output"></a>

## Step 5 — Inspect the output
Translated files are written to `src/content/docs/<locale>/`. Open one to compare it with the source:

```bash
# Compare Spanish translation with English source
diff src/content/docs/quick-start.md \
     src/content/docs/es/quick-start.mdx
```

Key things to verify:

- Code blocks are **identical** to the source — no code was translated.
- Front matter values (`title`, `description`) are translated.
- Inline `code spans` inside prose are preserved verbatim.
- Links keep their original `href`; only the anchor text changes.

---

<a id="step-6--start-starlight"></a>

## Step 6 — Start Starlight
```bash
pnpm dev
```

Open [http://localhost:3050/de/quick-start](http://localhost:3050/de/quick-start) (or pick a locale from the language switcher) to browse translated docs.

---

<a id="step-7--explore-the-nextjs-demo-locale--cardinal-plurals"></a>

## Step 7 — Explore the Next.js demo (locale + cardinal plurals)
Documentation translation in this tutorial uses **Markdown only**. The repo also ships a **Next.js** UI under `examples/nextjs-app/` on port **3030** where you can see `t()` calls, `?locale=` URLs, and a **cardinal plural** demo.

```bash
cd ../nextjs-app
pnpm dev
```

Then open [http://localhost:3030](http://localhost:3030).

- Switch languages with the **Locale** dropdown, or append `?locale=<code>` (for example `http://localhost:3030/?locale=ar`).
- Scroll to **Plurals: automatic generation usage example** and compare plural rules across locales.
- See the **Cardinal plurals example** section in the [Next.js example README](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

<a id="what-to-explore-next"></a>

## What to explore next
- Read the [Translation Feature Showcase](./feature-showcase) to see every Markdown element that `ai-i18n-tools` can handle.
- Edit a sentence in `src/content/docs/feature-showcase.mdx` and re-run `sync` — only that segment will be sent to the LLM.
- Add a term to `glossary-user.csv` to enforce consistent terminology across all locales.
- Compare this Starlight site with the Docusaurus demo at `examples/nextjs-app/docs-site/` (same content, `style: "docusaurus"` vs `style: "astro-starlight"`).
