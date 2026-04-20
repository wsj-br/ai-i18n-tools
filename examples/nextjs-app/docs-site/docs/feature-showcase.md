---
sidebar_position: 1
title: Translation Feature Showcase
description: A reference document demonstrating every Markdown element that ai-i18n-tools knows how to translate.
---

This page exists to demonstrate how `ai-i18n-tools` handles every common Markdown construct. Run `sync` against it and compare the output in each locale folder to see exactly what gets translated and what stays untouched.

---

## Plain text {#plain-text}

Internationalization is more than swapping words. A good translation pipeline preserves document structure, keeps technical identifiers intact, and only sends human-readable text to the language model.

`ai-i18n-tools` splits each document into **segments** before sending them to the LLM. Each segment is translated independently and then re-assembled, so a change to one paragraph does not invalidate the cached translations of the rest of the file.

---

## Text formatting {#text-formatting}

The translator should carry over all inline formatting without altering the markup:

- **Bold text** signals importance and should stay bold after translation.
- _Italic text_ is used for emphasis or titles; the meaning should be preserved.
- ~~Strikethrough~~ marks deprecated or removed content.
- `inline code` is **never** translated — identifiers, function names, and file paths must remain as-is.
- A [hyperlink](https://github.com/wsj-br/ai-i18n-tools) keeps its original URL; only the anchor label is translated.

---

## Headings at every level {#headings-at-every-level}

### H3 — Configuration {#h3--configuration}

#### H4 — Output directory {#h4--output-directory}

##### H5 — File naming {#h5--file-naming}

###### H6 — Extension handling {#h6--extension-handling}

All heading levels translate the text but leave anchor IDs unchanged so existing anchor links continue to work.

---

## Tables {#tables}

Tables are a common source of translation errors. Each cell is translated individually; column separators and alignment syntax are preserved.

| Feature                | Status         | Notes                                                            |
|------------------------|----------------|------------------------------------------------------------------|
| Markdown translation   | ✅ Stable       | Segments cached in SQLite                                        |
| UI string extraction   | ✅ Stable       | Reads `t("…")` calls                                             |
| Plural UI strings      | ✅ Stable       | `t("…", { plurals: true, count })`; catalog + flat JSON suffixes |
| JSON label translation | ✅ Stable       | Docusaurus sidebar/navbar JSON                                   |
| SVG text translation   | ✅ Stable       | Preserves SVG structure                                          |
| Glossary enforcement   | ✅ Stable       | Per-project CSV glossary                                         |
| Batch concurrency      | ✅ Configurable | `batchConcurrency` key                                           |

### Left-to-Right and Right-to-Left Support {#left-to-right-and-right-to-left-support}

Modern internationalization must accommodate both left-to-right (LTR) and right-to-left (RTL) languages. `ai-i18n-tools` ensures correct handling of text direction throughout the translation workflow:

- The pipeline automatically preserves the directionality of each locale. For example, Arabic (`ar`) is rendered RTL, while English (`en-GB`), Portuguese (`pt`), and others remain LTR.
- When translating markdown tables, code samples, or UI strings, the tools maintain alignment and content structure, so tables and formatted blocks display naturally in both LTR and RTL contexts.
- Docusaurus and the example Next.js app both respect the locale’s direction in the browser, switching layout and text alignment as appropriate.

| Directionality | Locale Example         | Display                |
|:--------------:|:-----------------------|:-----------------------|
|      LTR       | `en-GB`, `es`, `pt-BR` | Standard left-to-right |
|      RTL       | `ar`, `fa`, `he`       | Right-to-left layout   |

This ensures documents and interfaces look correct, regardless of the user’s language or reading direction.

---

## Lists {#lists}

### Unordered {#unordered}

- The translation cache stores a hash of each source segment.
- Only segments whose hash has changed since the last run are sent to the LLM.
- This makes incremental runs very fast — typically only a few API calls for small edits.

### Ordered {#ordered}

1. Add `ai-i18n-tools` as a dev dependency.
2. Create `ai-i18n-tools.config.json` in your project root.
3. Run `npx ai-i18n-tools sync` to perform the first full translation.
4. Commit the generated locale files alongside your source.
5. On subsequent runs, only changed segments are re-translated.

### Nested {#nested}

- **Documents pipeline**
  - Source: any `.md` or `.mdx` file
  - Output: Docusaurus `i18n/` tree or flat translated copies
  - Cache: SQLite, keyed by file path + segment hash
- **UI strings pipeline**
  - Source: JS/TS files with `t("…")` calls (including plurals via `{ plurals: true, count }`)
  - Output: per-locale flat JSON (`de.json`, `fr.json`, …) with suffixed keys for plural categories when applicable
  - Cache: the master `strings.json` catalog itself

---

## Plural UI strings {#plural-ui-strings}

Markdown documents on this site show **document** translation. **Plural** behaviour for UI copy is easiest to see in the **bundled Next.js example** that lives beside `docs-site/` under `examples/nextjs-app/`.

That app’s home page (`src/app/page.tsx`) includes a **plurals demo** section and repeats one message at several sample counts so you can compare grammar across locales (for example Arabic vs English). Each line calls:

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Use **`plurals: true`** so **`extract`** records a plural group in `locales/strings.json` and **`translate-ui`** fills the per-locale flat files under `public/locales/`. At runtime, i18next resolves the right suffixed key for the active **`count`**; the Next example wires helpers in **`src/lib/i18n.ts`**.

For screenshots, locale URLs, and file layout, see **Plurals example** in the [Next.js example README](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

## Code blocks {#code-blocks}

Code blocks are **never** translated. The surrounding prose is translated, but every character inside the fenced block is passed through verbatim.

### Shell {#shell}

```bash
# Install the package
npm install --save-dev ai-i18n-tools

# Run a full sync
npx ai-i18n-tools sync

# Translate only documentation
npx ai-i18n-tools sync --no-ui --no-svg
```

### JSON configuration {#json-configuration}

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "es", "fr", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": { "style": "docusaurus", "docsRoot": "docs-site/docs" }
    }
  ]
}
```

### TypeScript {#typescript}

```typescript
import { createI18nConfig } from 'ai-i18n-tools/runtime';

const config = createI18nConfig({
  defaultLocale: 'en-GB',
  supportedLocales: ['de', 'es', 'fr', 'pt-BR'],
  fallback: 'en-GB',
});

export default config;
```

---

## Blockquotes {#blockquotes}

> "The best internationalization is invisible to the user — they simply see their language."
>
> Proper translation goes beyond vocabulary. It adapts tone, date formats, number formatting, and reading direction to feel native in each locale.

---

## Admonitions (Docusaurus) {#admonitions-docusaurus}

Docusaurus admonition titles are translated; the `:::` fences and type keywords are preserved.

:::note
This document is intentionally rich in Markdown features. Its primary purpose is to serve as a translation test fixture — run `sync` and inspect the output to verify that each element is handled correctly.
:::

:::tip
You can override the translated wording for any segment by editing the output file and running `sync` again. The tool will detect your edits and add the corrected phrasing to the project glossary automatically.
:::

:::warning
Do not commit the `.translation-cache/` directory to version control. The cache is machine-specific and regenerated on each fresh checkout.
:::

:::danger
Deleting the cache directory forces every segment to be re-translated from scratch. This can be expensive if your documents are large. Use `sync --no-cache-write` to do a dry run without persisting results.
:::

---

## Images and locale-aware path rewriting {#images-and-locale-aware-path-rewriting}

Image alt text is translated into each locale. Beyond that, `ai-i18n-tools` can also **rewrite image paths** in translated output via `postProcessing.regexAdjustments` — so each locale can point at its own screenshot rather than always showing the English version.

The source document (English) references:

```markdown
![The example Next.js app running in English](/img/screenshots/en-GB/screenshot.png)
```

The config entry for this docs-site includes:

```json
"regexAdjustments": [
  {
    "description": "Per-locale screenshot folders in docs-site static assets",
    "search": "screenshots/en-GB/",
    "replace": "screenshots/${translatedLocale}/"
  }
]
```

After translation the German output becomes:

```markdown
![Die Beispiel-Next.js-App auf Deutsch](/img/screenshots/de/screenshot.png)
```

Here is the actual screenshot of the Next.js app — it is in English by default, but if you are reading this in a translated locale, the image below should show the app in your language:

![The example Next.js app — UI strings and this page translated by ai-i18n-tools](/img/screenshots/en-GB/screenshot.png)

---

## Horizontal rules and line breaks {#horizontal-rules-and-line-breaks}

A horizontal rule (`---`) is a structural element and is not translated.

The content above and below it is treated as separate segments, giving the LLM cleaner context windows.
