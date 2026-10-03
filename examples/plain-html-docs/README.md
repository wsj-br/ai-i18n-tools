# Plain HTML documents example (ai-i18n-tools)

This example shows how to localize **plain HTML** pages with the **Documents** pipeline (`translate-docs`): English source files stay under `site/`, and each target locale gets its own HTML tree (for example `site/pt-BR/index.html` and `site/pt-BR/about.html`). Text, `alt`, the document `<title>`, and `meta name="description"` are translated in place on those copies; `src` and `href` are not sent to the model and are rewritten so links and images resolve from the locale file.

There is no client-side i18n runtime and no `data-i18n` markers. Compare with [`examples/plain-html`](../plain-html/), which keeps one HTML file and swaps strings from flat JSON via [`public/i18n.js`](../plain-html/public/i18n.js).

For the full guide, see [HTML pages](https://wsj-br.github.io/ai-i18n-tools/guide/documents/html-pages) on the documentation site.

## Requirements

- Node.js ≥ 22.16
- [pnpm](https://pnpm.io/) ≥ 10.33
- An [OpenRouter](https://openrouter.ai) API key (only when re-running translation)

## Installation

### Try this example on its own

```bash
npx degit wsj-br/ai-i18n-tools/examples/plain-html-docs plain-html-docs
cd plain-html-docs
pnpm install
```

### From the full ai-i18n-tools repository

Use this when you cloned the **whole** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository. Run `pnpm install` and `pnpm run build` from the repository root; the workspace [`overrides`](../../pnpm-workspace.yaml) entry links `ai-i18n-tools` to your local checkout automatically.

Then work from this directory:

```bash
cd examples/plain-html-docs
```

You can also run scripts from the repository root with `pnpm --filter plain-html-docs-example <script>`.

## Run the demo

From this directory:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm i18n:sync
pnpm dev
```

Open [http://127.0.0.1:3092/](http://127.0.0.1:3092/) for English (`site/index.html`, `site/about.html`) or [http://127.0.0.1:3092/pt-BR/](http://127.0.0.1:3092/pt-BR/) for Portuguese (Brazil). Use the language links in the header to switch locales.

`site/pt-BR/` is not committed (see [`.gitignore`](./.gitignore)). You can run `pnpm dev` first to preview English-only pages; links to `pt-BR` return 404 until you run `pnpm i18n:sync`.

---

## How it differs from the plain-html UI example

| | **This example (`plain-html-docs`)** | **[`plain-html`](../plain-html/)** |
| --- | --- | --- |
| **Pipeline** | Documents — `translate-docs` | UI strings — `extract` + `translate-ui` |
| **Output** | One HTML file per locale under `site/{locale}/` | One `index.html`; flat JSON in `public/locales/` |
| **Markup** | Normal HTML; comment pairs for lang list / hreflang | Bare `data-i18n*` markers + `i18n.js` |
| **Locale switch** | Navigate to another URL | In-page swap (`?locale=` + picker) |
| **Images** | `docsOutput.localizedAssets` rewrites `src` when `img/trulli-pt-BR.jpg` exists | Runtime picks `pic_trulli-{locale}.jpg` from JSON |
| **Dev server** | Port **3092** | Port **3090** |

**pt-BR** is the only configured target locale in this demo.

---

## What this example shows

- **Two static pages** — `site/index.html` and `site/about.html`; cross-page links are rewritten on locale copies.
- **Localized assets** — `img/trulli.jpg` → `img/trulli-pt-BR.jpg` when the locale file exists; `logo.svg` stays shared (not under `img/**`).
- **Language list and hreflang** — `<!-- ai-i18n:lang-list -->` and `<!-- ai-i18n:hreflang -->` are expanded on every locale file and refreshed on the English source so alternates stay reciprocal.
- **Nested output** — `docsOutput.style: "nested"` with `docsRoot: "site"` writes `site/pt-BR/index.html` from `site/index.html`.

Scaffold the same shape with:

```bash
ai-i18n-tools init -t docs-plain-html
```

---

## Language list and hreflang markers

Leave empty comment pairs where the pipeline should inject navigation and `<link rel="alternate">` tags:

```html
<ul>
  <!-- ai-i18n:lang-list -->
  <!-- /ai-i18n:lang-list -->
</ul>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
```

Visible body text is translated like any other document segment. `script`, `style`, `pre`, and `code` are skipped; URL attributes are rewritten after translation, not passed to the model.

The committed English pages already contain filled markers from a prior run (including reciprocal hreflang on the source locale).

### Language `<select>`

This demo uses `docsOutput.html.languageList.format: "links"`, so options render as list items inside the header `<ul>`.

For a dropdown, set `"format": "select"` and wrap the markers:

```html
<select data-lang-select>
  <!-- ai-i18n:lang-list -->
  <!-- /ai-i18n:lang-list -->
</select>
<script src="lang-select.js"></script>
```

[`site/lang-select.js`](./site/lang-select.js) matches `ai-i18n-tools/html-runtime/lang-select.js` and navigates to the selected locale URL. One block uses one format, so this example keeps `"links"` on both pages.

---

## ai-i18n-tools configuration

[`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json) enables document translation from HTML only:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": { "translateDocs": true, "translateUIStrings": false },
  "docs": [{
    "contentPaths": ["site/"],
    "outputDir": "site",
    "docsOutput": {
      "style": "nested",
      "docsRoot": "site",
      "localizedAssets": {
        "include": ["img/**"],
        "pattern": "{stem}-{locale}{ext}",
        "onlyIfExists": true
      },
      "html": {
        "languageList": { "format": "links", "label": "local" },
        "hreflang": {
          "siteUrl": "https://example.com",
          "xDefault": "en",
          "stripIndexHtml": true
        }
      }
    }
  }]
}
```

---

## Workflow

### 1. Translate documents

Writes `site/pt-BR/` and updates language markers on the English source:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm i18n:sync
```

`i18n:sync` runs `translate-docs` for this config (UI and JSON translation are disabled). Equivalent:

```bash
pnpm i18n:translate-docs
```

### 2. Serve

Static files from `site/`:

```bash
pnpm dev
```

### 3. Clean up

Remove generated locale HTML and the translation cache:

```bash
pnpm i18n:clean
```

Do not edit `site/pt-BR/` by hand; regenerate with `pnpm i18n:sync`.

A later run skips a page when file-tracking matches; adding a locale or changing `docsOutput.html` / `localizedAssets` rewrites pages even when sentence cache entries are reused.

---

## Project structure

```text
plain-html-docs/
├── ai-i18n-tools.config.json
├── package.json
├── scripts/dev-server.mjs       # static server on port 3092
└── site/
    ├── index.html               # English source (authoring)
    ├── about.html
    ├── styles.css
    ├── logo.svg
    ├── lang-select.js           # optional; used with languageList format "select"
    ├── img/
    │   ├── trulli.jpg
    │   └── trulli-pt-BR.jpg     # locale asset; referenced after translate-docs
    └── pt-BR/                   # generated by translate-docs (gitignored)
        ├── index.html
        └── about.html
```

---

## Commands (quick reference)

| Script | Command | Purpose |
| --- | --- | --- |
| Dev | `pnpm dev` | Serve `site/` on port 3092 |
| Translate | `pnpm i18n:translate-docs` | HTML sources → `site/pt-BR/` |
| Sync | `pnpm i18n:sync` | Same as translate-docs for this example |
| Clean | `pnpm i18n:clean` | Remove `.translation-cache/` and `site/pt-BR/` |

Set `OPENROUTER_API_KEY` (or a root `.env` when working inside the monorepo) before translate commands that call the API.

---

## Further reading

- [HTML pages](https://wsj-br.github.io/ai-i18n-tools/guide/documents/html-pages) — translation rules, links, localized assets, markers
- [Plain HTML apps](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/plain-html) — `data-i18n*` and the browser runtime approach
- [Examples catalog](https://wsj-br.github.io/ai-i18n-tools/examples) — other runnable projects
