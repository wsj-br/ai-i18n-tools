<a id="locale-assets-guide"></a>
# Locale assets guide

This guide covers how to handle locale-specific assets — screenshots (PNG, JPEG, WebP) and illustrated SVG files — in projects that use `ai-i18n-tools`. It explains each available pattern, when to use it, and how to set up a project from scratch so that adding more locales later requires no structural rework.

For SVG configuration reference, see the [`svg`](#svg) section in [GETTING_STARTED.md](GETTING_STARTED.md). For the `postProcessing.regexAdjustments` option, see the [configuration reference](GETTING_STARTED.md#configuration-reference).

| Config path | Value | Use case | Notes |
|-------------|-------|----------|-------|
| `documentations[].markdownOutput.style` | `"flat"` | Locale-suffixed README / USER-GUIDE files | Enables flat link rewriter; pair with `flatPreserveRelativeDir` when sources live in subdirectories |
| `documentations[].markdownOutput.style` | `"nested"` (default) | Simple locale subfolders under `outputDir` | No flat link rewriter |
| `documentations[].markdownOutput.style` | `"doc-system"` | Locale-prefixed doc trees (custom generators) | Set `docsRoot` and `localeSubpath`; flat link rewriter does not run |
| `documentations[].markdownOutput.style` | `"docusaurus"` / `"astro-starlight"` | Preset `doc-system` layouts | Aliases with generator-specific defaults for `localeSubpath` |
| `svg.style` | `"flat"` | Web apps (`name.<locale>.svg` in `public/assets/`) | Separate from markdown `style`; used by `translate-svg` |
| `svg.style` | `"nested"` | Doc-system colocated SVG output | Often paired with `pathTemplate` (Pattern E) |

This guide uses the exact JSON strings from config — not English words alone — so translated copies stay unambiguous.


<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](./LOCALE-ASSETS-GUIDE.md) · [Deutsch](../translated-docs/docs/LOCALE-ASSETS-GUIDE.de.md) · [Español](../translated-docs/docs/LOCALE-ASSETS-GUIDE.es.md) · [Français](../translated-docs/docs/LOCALE-ASSETS-GUIDE.fr.md) · [हिन्दी](../translated-docs/docs/LOCALE-ASSETS-GUIDE.hi.md) · [日本語](../translated-docs/docs/LOCALE-ASSETS-GUIDE.ja.md) · [한국어](../translated-docs/docs/LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](../translated-docs/docs/LOCALE-ASSETS-GUIDE.pt-BR.md) · [中文 (中国大陆)](../translated-docs/docs/LOCALE-ASSETS-GUIDE.zh-CN.md) · [中文 (台灣)](../translated-docs/docs/LOCALE-ASSETS-GUIDE.zh-TW.md)</small>

---


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [What ai-i18n-tools does (and does not do) with assets](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [Design for i18n from the start](#design-for-i18n-from-the-start)
  - [Markdown with `markdownOutput.style = "flat"` (README, USER-GUIDE)](#markdown-with-markdownoutputstyle--flat-readme-user-guide)
  - [Doc-system sites (`markdownOutput.style = "doc-system"`)](#doc-system-sites-markdownoutputstyle--doc-system)
    - [Docusaurus preset](#docusaurus-preset)
    - [Astro/Starlight preset](#astrostarlight-preset)
  - [Web apps (Next.js, Vite, etc.) with SVG assets](#web-apps-nextjs-vite-etc-with-svg-assets)
- [Decision guide](#decision-guide)
- [Pattern A - Shared raster](#pattern-a--shared-raster)
  - [Implementation example](#implementation-example)
- [Pattern B - Per-locale folder (URL rewriting)](#pattern-b--per-locale-folder-url-rewriting)
  - [Directory layout](#directory-layout)
  - [Screenshot script contract](#screenshot-script-contract)
  - [Config - `markdownOutput.style = "flat"`](#config--markdownoutputstyle--flat)
  - [Config - `markdownOutput.style = "doc-system"`](#config--markdownoutputstyle--doc-system)
  - [Preset - `markdownOutput.style = "docusaurus"`](#preset--markdownoutputstyle--docusaurus)
  - [Preset - `markdownOutput.style = "astro-starlight"`](#preset--markdownoutputstyle--astro-starlight)
- [Pattern C - Colocated raster (`doc-system`)](#pattern-c--colocated-raster-doc-system)
  - [Directory layout](#directory-layout-1)
  - [Screenshot script contract](#screenshot-script-contract-1)
  - [Config](#config)
  - [Prerequisites](#prerequisites)
  - [Implementation example](#implementation-example-1)
- [Pattern D - Translated SVG with `svg.style = "flat"`](#pattern-d--translated-svg-with-svgstyle--flat)
  - [Config](#config-1)
  - [App reference](#app-reference)
  - [Source layout recommendation](#source-layout-recommendation)
  - [Implementation example](#implementation-example-2)
- [Pattern E - Colocated translated SVG (doc-system)](#pattern-e--colocated-translated-svg-doc-system)
  - [Config](#config-2)
  - [Source markdown](#source-markdown)
  - [SVG source location](#svg-source-location)
  - [`pathTemplate` placeholders](#pathtemplate-placeholders)
  - [Implementation example](#implementation-example-3)
- [The flat link rewriter and two-step flow](#the-flat-link-rewriter-and-two-step-flow)
  - [Two-step flow when `markdownOutput.style = "flat"`](#two-step-flow-when-markdownoutputstyle--flat)
  - [Per-file depth prefix with `flatPreserveRelativeDir`](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` and `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [Common mistakes and troubleshooting](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## What ai-i18n-tools does (and does not do) with assets

`translate-docs` translates markdown/MDX content — including image alt text — but it does not copy, generate, or emit raster files. If a translated page needs a locale-specific screenshot, you must place that file at the path the translated markdown will reference.

`translate-svg` is the only command that emits locale-specific binary files. It reads source SVG files, translates text elements (`<text>`, `<title>`, `<desc>`), and writes one output SVG per locale. Raster files (PNG, JPEG, WebP, GIF) are never written by the tool.

---

<a id="design-for-i18n-from-the-start"></a>
## Design for i18n from the start

Choosing the right directory layout before any screenshots exist is the single biggest factor in how painless locale-specific assets are later. Retrofitting the layout after dozens of screenshots are committed means restructuring paths and updating every markdown reference.

<a id="markdown-with-markdownoutputstyle--flat-readme-user-guide"></a>
### Markdown with `markdownOutput.style = "flat"` (README, USER-GUIDE)

Store screenshots under a locale-coded subdirectory from day one:

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

When you add i18n later, your `take-screenshots` script writes to `images/screenshots/<locale>/` for every locale, and one `regexAdjustments` rule handles all of them:

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

The generic `[^/]+` pattern matches any locale folder name — do not hardcode your source locale (e.g. `screenshots/en-GB/`) because that breaks if `sourceLocale` ever changes.

If you start with paths that omit the locale subdirectory (`images/screenshots/translate.png`) you will need to restructure the whole tree before Pattern B can work.

<a id="doc-system-sites-markdownoutputstyle--doc-system"></a>
### Doc-system sites (`markdownOutput.style = "doc-system"`)

Use for static documentation sites that store translated pages under a locale-prefixed tree — Docusaurus i18n, Astro Starlight, and custom generators that follow the same shape. Files under `docsRoot` are written to:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Set `documentations[].markdownOutput.docsRoot` to your English source root (e.g. `"docs"` or `"src/content/docs"`). When you set `style: "doc-system"` directly, you must also set `localeSubpath` to the path segment your site uses between `{locale}/` and the translated file. The aliases `"docusaurus"` and `"astro-starlight"` are preset `doc-system` layouts with default `localeSubpath` values (see [Output layouts](GETTING_STARTED.md#output-layouts)).

| Preset alias | Default `localeSubpath` | Example output |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (empty) | `src/content/docs/de/guide.md` |

The flat link rewriter does **not** run for `doc-system` (unlike `"flat"`). `postProcessing.regexAdjustments` sees the original URL from source markdown — typically an absolute or site-root path such as `/img/screenshots/en-GB/foo.png`.

**Pattern B** applies when screenshots live in a shared static URL tree: use a locale-coded folder from day one and one generic `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` rule (see [Config — doc-system](#config--markdownoutputstyle--doc-system)).

**Pattern C** applies when each locale's translated docs colocate assets beside the markdown (no URL rewriting). Your screenshot script must write PNGs into paths derived from `{outputDir}`, `{locale}`, and `{localeSubpath}` — the Docusaurus preset below is the reference layout.

<a id="docusaurus-preset"></a>
#### Docusaurus preset

Two habits at project setup eliminate all regex bridging later:

1. Create a symlink `documentation/docs/assets → ../static/assets` before adding any screenshots. Docusaurus's webpack follows symlinks by default, and this lets source docs use relative paths that translated docs will also use.

2. Put all documentation assets — PNGs and SVGs — in `static/assets/` (one directory). Do not split them between `static/img/` (SVGs) and `static/assets/` (PNGs). A unified location means every doc page, English and translated, can reference the same relative path `../assets/name.ext`.

Reference every asset with the stable relative path `../assets/name.ext` in source markdown. Never use absolute `/img/` or `/assets/` URLs for documentation assets — those URLs differ between the English source (served from `static/`) and translated locales (colocated with the translated docs), which forces a `regexAdjustments` rule to bridge them.

When you add i18n later, the screenshot script adopts the `getScreenshotDir` split (see [Pattern C](#pattern-c--docusaurus-colocated)) and `translate-svg` uses a `pathTemplate`. No regex adjustments are needed.

> **Note:** `resolve.symlinks = false` in a `next.config.ts` disables symlink resolution for the Next.js application webpack build only. It does not affect the Docusaurus documentation site build, which uses a separate webpack instance.

<a id="astrostarlight-preset"></a>
#### Astro/Starlight preset

Equivalent to `markdownOutput.style = "doc-system"` with `localeSubpath: ""` — translated pages sit directly under `{outputDir}/{locale}/`.

Store screenshots under a locale-coded path from day one:

```
public/img/screenshots/en-GB/screenshot.png
```

Use the generic regex in `regexAdjustments`:

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### Web apps (Next.js, Vite, etc.) with SVG assets

Keep SVG source files in a dedicated source directory (e.g. `images/` or `src/assets/`) and configure `svg.outputDir` to a separate serving directory (e.g. `public/assets/`). Never mix source SVGs and `translate-svg` output files in the same folder — it becomes impossible to tell which files are generated.

Design SVGs to be translatable from the start: use `<text>`, `<title>`, and `<desc>` elements for all human-readable labels. Avoid embedding text as path data.

Enable `forceLowercase: true` in the `svg` config block to avoid case-sensitivity mismatches across filesystems and CDNs.

---

<a id="decision-guide"></a>
## Decision guide

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| Pattern | Asset type                  | Site type                                                                 | Tool mechanism                                               |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A       | Raster (shared)             | `markdownOutput.style = "flat"` docs                                      | Per-file link rewriter; usually no regex                     |
| B       | Raster (per-locale)         | `"flat"` or `"doc-system"` (incl. `"docusaurus"`, `"astro-starlight"`)    | `regexAdjustments` locale segment swap                       |
| C       | Raster (colocated)          | `"doc-system"` with colocated assets (Docusaurus preset)                  | Screenshot script places files; no regex                     |
| D       | SVG (translated)            | Web app                                                                   | `translate-svg` with `svg.style = "flat"`                    |
| E       | SVG (translated, colocated) | `"doc-system"` with colocated assets (Docusaurus preset)                  | `translate-svg` with `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a--shared-raster"></a>
## Pattern A - Shared raster

Use when a single image is shared across all locales (no per-locale variant). When `markdownOutput.style = "flat"`, the flat link rewriter computes the depth prefix per output file, so an asset next to the source file (e.g. `docs/figure.png` referenced as `figure.png` from `docs/page.md`) resolves correctly in every translated output — no `postProcessing.regexAdjustments` rule is needed.

Example: this package translates `docs/GETTING_STARTED.md` to `translated-docs/docs/GETTING_STARTED.<locale>.md`. The sibling image `docs/translation-dashboard.png` is referenced as `translation-dashboard.png`. The rewriter computes the per-file prefix from the output file's directory back to the source directory (`../../docs/`), producing `../../docs/translation-dashboard.png`. From `translated-docs/docs/`, that resolves correctly to `docs/translation-dashboard.png`.

Refresh the PNG with [`scripts/screenshot-translation-dashboard.sh`](../scripts/screenshot-translation-dashboard.sh) when the dashboard UI changes; the image is not per-locale.

A `postProcessing` rule is still needed when:
- The asset is referenced via an absolute URL (e.g. `/img/figure.png`) — the rewriter only handles relative paths
- You want to change the asset URL for other reasons (e.g. switching to a CDN)

<a id="implementation-example"></a>
### Implementation example

This repository uses Pattern A for the Translation Dashboard screenshot: [GETTING_STARTED.md](../docs/GETTING_STARTED.md#translation-dashboard) references the image [translation-dashboard.png](../docs/translation-dashboard.png) in the same folder. [ai-i18n-tools.config.json](../ai-i18n-tools.config.json) sets `markdownOutput.style = "flat"` and `flatPreserveRelativeDir: true`; the per-file depth prefix resolves the image path with no screenshot `regexAdjustments`.

---

<a id="pattern-b--per-locale-folder-url-rewriting"></a>
## Pattern B - Per-locale folder (URL rewriting)

Use for README/USER-GUIDE with `markdownOutput.style = "flat"`, and for doc-system sites (`markdownOutput.style = "doc-system"` or aliases `"docusaurus"` / `"astro-starlight"`) that serve screenshots from a shared static URL tree.

<a id="directory-layout"></a>
### Directory layout

<details>
<summary>Example per-locale screenshot directory tree</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

Source markdown references the source locale directory:

```markdown
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Screenshot script contract

The `take-screenshots` script must write files for every locale — not just the source locale. The `translate-docs` command rewrites paths but does not create files. A common pattern:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

See a simple `bash` example in the [screenshot script in examples/nextjs-app](../examples/nextjs-app/scripts/screenshot-locales.sh), or a more complex example in [take-screenshots.js](https://github.com/wsj-br/transrewrt/blob/main/scripts/take-screenshots.js) from the [Transrewrt project](https://github.com/wsj-br/transrewrt) repository.


> **Note:** The four sub-sections below share the same `regexAdjustments` locale-segment swap (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`). Only the output layout and whether the flat link rewriter runs first differ — jump to the sub-section that matches your `markdownOutput.style`.

<a id="config--markdownoutputstyle--flat"></a>
### Config - `markdownOutput.style = "flat"`

The flat link rewriter runs first when `markdownOutput.style = "flat"` and prepends a depth prefix to non-markdown URLs. For a `README.md` at the repo root with `outputDir: "translated-docs/"`, it adds `../`:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

The `regexAdjustments` rule then replaces the locale segment within that already-prefixed URL:

<details>
<summary>Example regexAdjustments for flat layout</summary>

```json
"markdownOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Result: `../images/screenshots/de/translate.png` — correct relative path from `translated-docs/README.de.md` back to the repo root.

The `postProcessing` step runs after the flat link rewriter. Write `search` patterns that match the locale segment anywhere within the already-prefixed URL — no need to include the `../` prefix in the pattern.

Implementation example (production): [Transrewrt](https://github.com/wsj-br/transrewrt) — screenshot URLs in [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`), locale rewrite in [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json), capture script [take-screenshots.js](https://github.com/wsj-br/transrewrt/blob/main/scripts/take-screenshots.js) (see the [screenshot script contract](#screenshot-script-contract) above).

Implementation example (demo config): [examples/nextjs-app](../examples/nextjs-app/) — second `documentations[]` block in [ai-i18n-tools.config.json](../examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`); helper script [screenshot-locales.sh](../examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config--markdownoutputstyle--doc-system"></a>
### Config - `markdownOutput.style = "doc-system"`

Generic Pattern B for any doc-system site that references screenshots via a shared static URL prefix. The flat link rewriter does not run; `postProcessing` rewrites the locale segment in the original markdown URL.

<details>
<summary>Example regexAdjustments for doc-system layout</summary>

```json
"markdownOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
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
```

</details>

Set `localeSubpath` to match your generator's layout between `{locale}/` and the translated file, or use a preset alias (`"docusaurus"`, `"astro-starlight"`) instead of `"doc-system"` when the defaults fit. Source markdown typically embeds the source locale in the URL:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

Ship matching PNG files at the same path for every target locale (e.g. `static/img/screenshots/de/screenshot.png`). Prefer `screenshots/[^/]+/` over hardcoding `screenshots/en-GB/` so the rule survives a `sourceLocale` change.

<a id="preset--markdownoutputstyle--docusaurus"></a>
### Preset - `markdownOutput.style = "docusaurus"`

Same as `"doc-system"` with default `localeSubpath = "docusaurus-plugin-content-docs/current"`. The flat link rewriter does not run. `postProcessing` sees the original markdown URL. English pages typically use an absolute path with the source locale:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Example regexAdjustments for Docusaurus preset</summary>

```json
"markdownOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Ship matching PNG files at `docs-site/static/img/screenshots/<locale>/screenshot.png`. For source-locale-agnostic configs, prefer `screenshots/[^/]+/` over `screenshots/en-GB/`.

Implementation example: [examples/nextjs-app/docs-site/docs/feature-showcase.md](../examples/nextjs-app/docs-site/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) with the first `documentations[]` block in [ai-i18n-tools.config.json](../examples/nextjs-app/ai-i18n-tools.config.json).

<a id="preset--markdownoutputstyle--astro-starlight"></a>
### Preset - `markdownOutput.style = "astro-starlight"`

Same as `"doc-system"` with `localeSubpath: ""` — translated pages sit directly under `{outputDir}/{locale}/`. Same Pattern B principle as the generic doc-system config above. Source markdown uses `/img/screenshots/en-GB/screenshot.png`:

<details>
<summary>Example regexAdjustments for Astro Starlight preset</summary>

```json
"markdownOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Ship PNGs at `public/img/screenshots/<locale>/screenshot.png`.

Implementation example: [examples/astro-docs](../examples/astro-docs/) — [feature-showcase.mdx](../examples/astro-docs/src/content/docs/feature-showcase.mdx) and [ai-i18n-tools.config.json](../examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).

---

<a id="pattern-c--colocated-raster-doc-system"></a>
## Pattern C - Colocated raster (`doc-system`)

Use when a `doc-system` site colocates locale-specific assets beside translated markdown — no URL rewriting is needed. The Docusaurus preset (`markdownOutput.style = "docusaurus"`) is the reference implementation; other generators using `"doc-system"` with a custom `localeSubpath` follow the same idea: English assets live at a source-locale path, translated assets live under `{outputDir}/{locale}/[localeSubpath/]assets/`.

<a id="directory-layout-1"></a>
### Directory layout

<details>
<summary>Example colocated asset directory tree (Docusaurus)</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

All docs in every locale use the same relative path:

```markdown
![Dashboard](../assets/screen-dashboard.png)
```

For the English (`en-GB`) locale, `../assets/` resolves via the symlink to `static/assets/`. For translated locales it resolves directly to the locale's own `current/assets/` directory.

<a id="screenshot-script-contract-1"></a>
### Screenshot script contract

The script must write PNGs to the correct directory for each locale. The `getScreenshotDir` function encodes the split:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

See the production implementation in [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/main/scripts/take-screenshots.ts) from the [duplistatus](https://github.com/wsj-br/duplistatus) repository (local reference copy: [references/duplistatus/scripts/take-screenshots.ts](../references/duplistatus/scripts/take-screenshots.ts)).

<a id="config"></a>
### Config

No `regexAdjustments` rule needed for raster files. `translate-docs` translates alt text in the markdown but the URL stays unchanged:

```json
{
  "markdownOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

If the project also uses translated SVGs, Pattern E handles them and they land alongside the PNGs in `current/assets/` with no extra regex.

<a id="prerequisites"></a>
### Prerequisites

- The `docs/assets` symlink must exist: `ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack follows symlinks by default (`resolve.symlinks` defaults to `true` in Docusaurus builds)
- The symlink only needs to exist for the source locale — translated builds do not use it

<a id="implementation-example-1"></a>
### Implementation example

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` in [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/main/scripts/take-screenshots.ts); English docs reference colocated PNGs (e.g. [dashboard.md](../references/duplistatus/documentation/docs/user-guide/dashboard.md) with `../assets/screen-dashboard-summary.png`); no PNG `regexAdjustments` in [ai-i18n-tools.config.json](../references/duplistatus/ai-i18n-tools.config.json). Pattern E SVGs from the same project land in the same `current/assets/` directories (see below).

---

<a id="pattern-d--translated-svg-with-svgstyle--flat"></a>
## Pattern D - Translated SVG with `svg.style = "flat"`

Use when a web app embeds locale-specific SVG illustrations or diagrams and references them by locale code at runtime.

<a id="config-1"></a>
### Config

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` reads every `.svg` under `images/` and writes one file per locale:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### App reference

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Source layout recommendation

Keep source SVGs separate from the output directory. With `sourcePath: "images"` and `outputDir: "public/assets"` the two directories are distinct. Never set both to the same directory.

<a id="implementation-example-2"></a>
### Implementation example

[examples/nextjs-app](../examples/nextjs-app/) — `svg` block in [ai-i18n-tools.config.json](../examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); source [translation_demo_svg.svg](../examples/nextjs-app/images/translation_demo_svg.svg); per-locale outputs under [public/assets/](../examples/nextjs-app/public/assets/) (e.g. `translation_demo_svg.de.svg`); runtime URL in [page.tsx](../examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e--colocated-translated-svg-doc-system"></a>
## Pattern E - Colocated translated SVG (doc-system)

Use for doc-system sites where translated SVG illustrations must appear alongside translated docs in each locale's content directory — the same location as Pattern C raster screenshots. The Docusaurus preset is the primary example.

<a id="config-2"></a>
### Config

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` writes one SVG per locale into the same `current/assets/` directory that Pattern C uses for PNGs:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Source markdown

All docs in all locales use the same relative path:

```markdown
![Diagram](../assets/diagram.svg)
```

For the English locale the symlink `docs/assets → ../static/assets` resolves this. For translated locales it resolves directly to `current/assets/`.

No `regexAdjustments` rule is needed because English source docs and translated output docs use identical paths.

<a id="svg-source-location"></a>
### SVG source location

Recommended: store source SVGs in `documentation/static/assets/` alongside the en-GB PNGs. This keeps all documentation assets in one place, and the same `docs/assets` symlink covers both. The `svg.sourcePath` entries then point to `documentation/static/assets/name.svg`.

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` placeholders

| Placeholder              | Value                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | Absolute resolved path of `svg.outputDir`              |
| `{locale}`               | Target locale code                                     |
| `{LOCALE}`               | Locale code uppercased                                 |
| `{relPath}`              | Relative path from `sourcePath` root to the source SVG |
| `{stem}`                 | Filename without extension                             |
| `{basename}`             | Filename with extension                                |
| `{extension}`            | Extension including dot                                |
| `{relativeToSourceRoot}` | Relative path from the nearest `sourcePath` root       |

Full reference in the [svg configuration table](GETTING_STARTED.md#svg).

<a id="implementation-example-3"></a>
### Implementation example

[duplistatus](https://github.com/wsj-br/duplistatus) — nested `svg` block with `pathTemplate` in [ai-i18n-tools.config.json](../references/duplistatus/ai-i18n-tools.config.json); source SVGs listed under `documentation/static/img/` (e.g. [duplistatus_toolbar.svg](../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg` writes per-locale files into `documentation/i18n/<locale>/…/current/assets/` beside Pattern C PNGs; docs embed them today via `/img/duplistatus_*.svg` (e.g. [overview.md](../references/duplistatus/documentation/docs/user-guide/overview.md)). See [task-locale-assets-simplification.md](../references/duplistatus/dev/task-locale-assets-simplification.md) for the planned move to `../assets/` paths and removal of the SVG `regexAdjustments` bridge.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## The flat link rewriter and two-step flow

For `markdownOutput.style = "flat"` (and unless `rewriteRelativeLinks: false` or a custom `pathTemplate` is set), a built-in rewriter runs before `postProcessing`. It handles cross-doc links (adding locale suffixes) and prepends a depth prefix to non-markdown asset URLs.

<a id="two-step-flow-when-markdownoutputstyle--flat"></a>
### Two-step flow when `markdownOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

Example with `outputDir: "translated-docs/"` and source `README.md` at repo root:

1. Flat link rewriter: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (one `../` for `translated-docs/`)
2. `postProcessing` regex `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

For `markdownOutput.style = "doc-system"` (including `"docusaurus"`, `"astro-starlight"`, and `"nested"`), the flat link rewriter does not run. `postProcessing` sees the original URL from the translated markdown (typically an absolute path like `/img/screenshots/en-GB/foo.png`).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Per-file depth prefix with `flatPreserveRelativeDir`

The depth prefix is computed per output file — not globally for the whole batch. For each source file, the rewriter computes the relative path from the output file's directory back to the source file's directory and uses that as the prefix.

This means that with `flatPreserveRelativeDir: true`, source files in subdirectories get the correct prefix automatically. For example, `docs/GETTING_STARTED.md` outputs to `translated-docs/docs/GETTING_STARTED.<locale>.md`. The per-file prefix is `../../docs/`, so an asset `translation-dashboard.png` (relative to the source) becomes `../../docs/translation-dashboard.png` — which resolves correctly from `translated-docs/docs/` back to `docs/translation-dashboard.png`.

No `postProcessing` regex correction is needed for relative-path assets alongside source files.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` and `linkRewriteDocsRoot`

| Option                                   | Effect                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `markdownOutput.rewriteRelativeLinks`    | Explicitly enable or disable the flat link rewriter (overrides the default when `markdownOutput.style = "flat"`) |
| `markdownOutput.linkRewriteDocsRoot`     | Root from which `depthPrefix` is computed (default `"."`)                                                        |
| `markdownOutput.flatPreserveRelativeDir` | Affects output path layout, which the rewriter uses when computing target paths for known translated files       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
<a id="common-mistakes"></a>
## Common mistakes and troubleshooting

**No locale directory in screenshot paths**
`images/screenshots/screenshot.png` — cannot distinguish locale variants and cannot be rewritten. Restructure to `images/screenshots/<locale>/screenshot.png` before applying Pattern B.

**Hardcoded source locale in regex**
`"search": "screenshots/en-GB/"` — breaks silently if `sourceLocale` changes. Use `"search": "screenshots/[^/]+/"` instead.

**SVG sources and outputs in the same directory**
If `svg.sourcePath` and `svg.outputDir` overlap, generated files mix with hand-edited sources. Keep them in separate directories.

**Absolute Docusaurus static URLs for colocated SVGs**
`/img/diagram.svg` (from `static/img/`) requires a `regexAdjustments` rule to rewrite to `../assets/` in translated output. Place source SVGs in `static/assets/` and use relative `../assets/diagram.svg` from the start to avoid this entirely.

**Missing `docs/assets` symlink in Docusaurus**
Without the symlink, source docs in `docs/user-guide/` cannot reference PNGs or SVGs in `static/assets/` via a relative path. Set up the symlink at project creation: `ln -s ../static/assets documentation/docs/assets`.

**`take-screenshots` script only captures the source locale**
Pattern B requires PNG files for every locale. If the script only captures `en-GB`, translated docs will have rewritten paths pointing to missing files.

