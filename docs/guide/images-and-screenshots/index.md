<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# What ai-i18n-tools does (and does not do) with assets

`translate-docs` translates markdown/MDX content — including image alt text — but it does not copy, generate, or emit raster files. If a translated page needs a locale-specific screenshot, you must place that file at the path the translated markdown will reference.

`translate-svg` is the only command that emits locale-specific binary files. It reads source SVG files, translates text elements (`<text>`, `<title>`, `<desc>`), and writes one output SVG per locale. Raster files (PNG, JPEG, WebP, GIF) are never written by the tool.

---

<a id="design-for-i18n-from-the-start"></a>
# Design for i18n from the start

Choosing the right directory layout before any screenshots exist is the single biggest factor in how painless locale-specific assets are later. Retrofitting the layout after dozens of screenshots are committed means restructuring paths and updating every markdown reference.

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### Markdown with `docsOutput.style = "flat"` (README, USER-GUIDE)

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

The generic `[^/]+` regex matches any locale folder name — do not hardcode your source locale (e.g. `screenshots/en-GB/`) because that breaks if `sourceLocale` ever changes.

If you start with paths that omit the locale subdirectory (`images/screenshots/translate.png`), you will need to restructure the whole tree before [per-locale folder](/guide/images-and-screenshots/per-locale-folder) rewriting can work.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### Doc-system sites (`docsOutput.style = "doc-system"`)

Use for static documentation sites that store translated pages under a locale-prefixed tree — Docusaurus i18n, Astro Starlight, and custom generators that follow the same shape. Files under `docsRoot` are written to:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Set `docs[].docsOutput.docsRoot` to your English source root (e.g. `"docs"` or `"src/content/docs"`). When you set `style: "doc-system"` directly, you must also set `localeSubpath` to the path segment your site uses between `{locale}/` and the translated file. The aliases `"docusaurus"`, `"astro-starlight"`, and `"vitepress"` are preset `doc-system` layouts with default `localeSubpath` values (see [Output layouts](/guide/documents/output-layouts)).

| Preset alias | Default `localeSubpath` | Example output |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (empty) | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""` (empty) | `docs/de/guide/quick-start.md` |

The flat link rewriter does **not** run for `doc-system` (unlike `"flat"`). `postProcessing.regexAdjustments` sees the original URL from source markdown — typically an absolute or site-root path such as `/img/screenshots/en-GB/foo.png`.

**Per-locale folder** layout applies when screenshots live in a shared static URL tree: use a locale-coded folder from day one and one generic `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` rule (see [Config — doc-system](#config---docsoutputstyle--doc-system)).

**Colocated screenshots** apply when each locale's translated docs store assets beside the markdown (no URL rewriting). Your screenshot script must write PNGs into paths derived from `{outputDir}`, `{locale}`, and `{localeSubpath}` — the Docusaurus preset below is the reference layout.

<a id="docusaurus-preset"></a>
#### Docusaurus preset

Two habits at project setup eliminate all regex bridging later:

1. Create a symlink `documentation/docs/assets → ../static/assets` before adding any screenshots. Docusaurus's webpack follows symlinks by default, and this lets source docs use relative paths that translated docs will also use.

2. Put all documentation assets — PNGs and SVGs — in `static/assets/` (one directory). Do not split them between `static/img/` (SVGs) and `static/assets/` (PNGs). A unified location means every doc page, English and translated, can reference the same relative path `../assets/name.ext`.

Reference every asset with the stable relative path `../assets/name.ext` in source markdown. Never use absolute `/img/` or `/assets/` URLs for documentation assets — those URLs differ between the English source (served from `static/`) and translated locales (colocated with the translated docs), which forces a `regexAdjustments` rule to bridge them.

When you add i18n later, the screenshot script adopts the `getScreenshotDir` split (see [Colocated screenshots](/guide/images-and-screenshots/colocated-screenshots)) and `translate-svg` uses a `pathTemplate`. No regex adjustments are needed.

> **Note:** `resolve.symlinks = false` in a `next.config.ts` disables symlink resolution for the Next.js application webpack build only. It does not affect the Docusaurus documentation site build, which uses a separate webpack instance.

<a id="astrostarlight-preset"></a>
#### Astro/Starlight preset

Equivalent to `docsOutput.style = "doc-system"` with `localeSubpath: ""` — translated pages sit directly under `{outputDir}/{locale}/`.

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
# Decision guide


  **Is the asset an SVG with translatable text or labels?**
  - **Yes** → [Web app SVG](/guide/svg-translation/translated-svg-web-app) or [Colocated SVG](/guide/svg-translation/translated-svg-colocated)
  - **No** (raster screenshot or decorative SVG) →
    - **Doc-system site with assets colocated beside translated docs?**
      - **Yes** → [Colocated screenshots](/guide/images-and-screenshots/colocated-screenshots) (rasters) + [Colocated SVG](/guide/svg-translation/translated-svg-colocated) (SVGs)
    - **Only one locale needs the image** (no per-locale variants)?
      - **Yes** → [Shared image](/guide/images-and-screenshots/shared-image)
    - **Otherwise** → [Per-locale folder](/guide/images-and-screenshots/per-locale-folder)

SVG layouts are covered in the [SVG translation](/guide/svg-translation/) guide.

| Layout                                                                       | Asset type                  | Site type                                                              | Tool mechanism                                               |
|------------------------------------------------------------------------------|-----------------------------|------------------------------------------------------------------------|--------------------------------------------------------------|
| [Colocated screenshots](/guide/images-and-screenshots/colocated-screenshots) | Raster (colocated)          | `"doc-system"` with colocated assets (Docusaurus preset)               | Screenshot script places files; no regex                     |
| [Per-locale folder](/guide/images-and-screenshots/per-locale-folder)         | Raster (per-locale)         | `"flat"` or `"doc-system"` (incl. `"docusaurus"`, `"astro-starlight"`) | `regexAdjustments` locale segment swap                       |
| [Shared image](/guide/images-and-screenshots/shared-image)                   | Raster (shared)             | `docsOutput.style = "flat"` docs                                       | Per-file link rewriter; usually no regex                     |
| [Colocated SVG](/guide/svg-translation/translated-svg-colocated)             | SVG (translated, colocated) | `"doc-system"` with colocated assets (Docusaurus preset)               | `translate-svg` with `svg.style = "nested"` + `pathTemplate` |
| [Web app SVG](/guide/svg-translation/translated-svg-web-app)                 | SVG (translated)            | Web app                                                                | `translate-svg` with `svg.style = "flat"`                    |
