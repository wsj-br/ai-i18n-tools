<a id="shared-raster"></a>
# Shared raster

Use when a single image is shared across all locales (no per-locale variant). When `docsOutput.style = "flat"`, the flat link rewriter computes the depth prefix per output file, so an asset next to the source file (e.g. `docs/figure.png` referenced as `figure.png` from `docs/page.md`) resolves correctly in every translated output — no `postProcessing.regexAdjustments` rule is needed.

Example: a project translates `docs/guide/quick-start.md` to `translated-docs/docs/guide/quick-start.<locale>.md`. A sibling image `docs/translation-dashboard.png` is referenced from `quick-start.md` as `../translation-dashboard.png`. The rewriter computes the per-file prefix from the output file's directory back to the source directory (`../../docs/`), producing `../../docs/translation-dashboard.png`. From `translated-docs/docs/guide/`, that resolves correctly back to `docs/translation-dashboard.png`.

A `postProcessing` rule is still needed when:
- The asset is referenced via an absolute URL (e.g. `/img/figure.png`) — the rewriter only handles relative paths
- You want to change the asset URL for other reasons (e.g. switching to a CDN)

<a id="implementation-example"></a>
### Implementation example

This repository's own docs use the absolute-URL variant of shared images: the [Translation Dashboard guide](/guide/translation-dashboard/) references its screenshot as `![Translation Dashboard](/translation-dashboard.png)` — an absolute, site-root path served from [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png). Because the URL is identical for every locale, no `postProcessing.regexAdjustments` rule is needed; refresh the PNG with [`scripts/screenshot-translation-dashboard.sh`](https://github.com/wsj-br/ai-i18n-tools/tree/main/scripts/screenshot-translation-dashboard.sh) when the dashboard UI changes.
