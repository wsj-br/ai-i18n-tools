# Assets, links, and stable anchors

Use `ai-i18n-tools sync` to refresh enabled SVG and Documents pipelines together.
Documents translates image alt text and page copy, not pixels or raster files.
The consumer project owns screenshot capture, asset placement, serving, and visual checks.

## Choose an asset layout

- Shared screenshot: keep one source asset and verify translated pages resolve its relative URL.
- Localized screenshot: capture every locale yourself, for example `images/screenshots/de/settings.png`.
- Reference the source-locale folder in source Markdown, then rewrite that locale segment on output.
- Colocated assets: place files beside each locale's pages so a stable relative URL works unchanged.
- For Docusaurus, include `docusaurus-plugin-content-docs/current` in colocated output paths.
- Keep authored SVG sources separate from generated SVG output directories.
- Do not claim that PNG, JPEG, WebP, GIF, or text rendered into image pixels is translated.

## Rewrite screenshot URLs

Merge this fragment into the relevant `docs[].docsOutput` object:

```json
{
  "postProcessing": {
    "regexAdjustments": [{
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }]
  }
}
```

For a root README using flat output, `images/screenshots/en/settings.png` becomes
`../images/screenshots/de/settings.png` when output is `translated-docs/README.de.md`.
Create the matching screenshot before publishing; URL rewriting does not create it.

- Flat `rewriteRelativeLinks` defaults on without a custom `pathTemplate`.
- The flat rewriter runs before regex adjustments and computes depth from each output file.
- `flatPreserveRelativeDir` preserves subdirectories and changes the required depth prefix.
- A custom `pathTemplate` disables relative rewriting by default; verify before explicitly enabling it.
- The flat rewriter does not run for doc-system layouts; match their original source URLs instead.
- Regex adjustments affect the whole translated Markdown body, including fenced code examples.
- VitePress, Nextra, and Fumadocs have framework-specific link normalizers enabled by their presets.
- Their switches are `rewriteVitepressLinks`, `rewriteNextraLinks`, and `rewriteFumadocsLinks` inside `docsOutput`.
- VitePress source links should use `/guide/...` site routes rather than `docs/guide/...` repository paths.

## Plain HTML asset URLs

`docsOutput.localizedAssets` can rename image/icon URLs to existing localized files.
Defaults are `include: ["img/**"]`, `pattern: "{stem}-{locale}{ext}"`, and `onlyIfExists: true`.
Set `assetRoot` when root-relative URLs need a different filesystem lookup root.
CSS `url()` is not rewritten. These options do not generate or translate image pixels.

## Translate SVG labels

Merge this fragment into a project with provider, source locale, and targets already configured:

```json
{
  "features": { "translateSVG": true },
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

- `sourcePath` accepts a string or array of source directories/glob patterns; the key is singular.
- Flat output produces `public/assets/diagram.de.svg` for `images/diagram.svg`.
- Nested output uses `{outputDir}/{locale}/{relativeToSourceRoot}`.
- `svg.pathTemplate` overrides the style; for colocated Docusaurus assets, use `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}` with `outputDir: "i18n"`.
- SVG template variables include `{outputDir}`, `{locale}`, `{LOCALE}`, `{llocale}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `localePathLowercase: true` lowercases built-in locale path segments; custom templates use `{llocale}`.
- `forceLowercase: true` lowercases translated text, not filenames. Leave it off unless deliberately changing label casing.
- Extractable labels live in `<text>`, `<title>`, and `<desc>`; path outlines and decorative icons are not translatable text.
- Check clipping, wrapping, fonts, and RTL alignment visually; translation does not guarantee a fitting diagram layout.

## Preserve heading destinations

Filename rewriting does not guarantee that translated heading slugs match old fragments.
Use stable source IDs and link to those IDs rather than guessing translated slugs.
For general Markdown, `ai-i18n-tools write-heading-ids` inserts HTML anchors before headings.
For Docusaurus, prefer native `{#id}` or MDX `{/* #id */}` heading suffixes.
`ai-i18n-tools write-heading-ids --slug-style mdx-comment` supports the MDX form.
These commands modify files and can update existing translations/cache; review their scope before running.
After an authorized anchor refresh, run `ai-i18n-tools sync` and check cross-page fragments.
Fix source/config instead of hand-patching generated locale links.

## Published guides

- [Images and screenshots](https://wsj-br.github.io/ai-i18n-tools/guide/images-and-screenshots/)
- [Per-locale folders](https://wsj-br.github.io/ai-i18n-tools/guide/images-and-screenshots/per-locale-folder)
- [Link rewriting](https://wsj-br.github.io/ai-i18n-tools/guide/images-and-screenshots/link-rewriting)
- [SVG translation](https://wsj-br.github.io/ai-i18n-tools/guide/svg-translation/)
- [Anchor links](https://wsj-br.github.io/ai-i18n-tools/guide/documents/anchor-links)
