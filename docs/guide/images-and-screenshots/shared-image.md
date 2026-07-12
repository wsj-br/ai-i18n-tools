<a id="shared-raster"></a>
# Shared raster

Use when a single image is shared across all locales (no per-locale variant).

- **`docsOutput.style = "flat"`** — the flat link rewriter computes the depth prefix per output file, so a relative asset next to the source file (e.g. `docs/figure.png` referenced as `figure.png` from `docs/page.md`) resolves correctly in every translated output — no `postProcessing.regexAdjustments` rule is needed. When source files live in subdirectories, enable `flatPreserveRelativeDir: true` so output paths preserve the source tree (see [Per-file depth prefix](/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)).
- **`docsOutput.style = "vitepress"`** (and other doc-system presets with a link normalizer) — site-root absolute paths such as `/translation-dashboard.png` are left unchanged when the URL is identical in every locale — no `regexAdjustments` rule is needed.

**Flat example:** a project translates `docs/guide/quick-start.md` to `translated-docs/docs/guide/quick-start.<locale>.md`. This assumes `flatPreserveRelativeDir: true` so `docs/guide/quick-start.md` outputs to `translated-docs/docs/guide/quick-start.<locale>.md` (not `translated-docs/quick-start.<locale>.md`). A sibling image `docs/translation-dashboard.png` is referenced from `quick-start.md` as `../translation-dashboard.png`. The rewriter computes the per-file prefix from the output file's directory back to the source directory (`../../docs/`), producing `../../docs/translation-dashboard.png`. From `translated-docs/docs/guide/`, that resolves correctly back to `docs/translation-dashboard.png`.

A `postProcessing` rule is still needed when:
- The asset is referenced via an absolute URL in **`docsOutput.style = "flat"`** (e.g. `/img/figure.png`) — the flat rewriter only handles relative paths
- You want to change the asset URL for other reasons (e.g. switching to a CDN)

<a id="implementation-example"></a>
### Implementation example

This repository's own docs use the absolute-URL variant of shared images: the [Translation Dashboard guide](/guide/translation-dashboard/) references its screenshot as `![Translation Dashboard](/translation-dashboard.png)` — an absolute, site-root path served from [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png). Because the URL is identical for every locale, no `postProcessing.regexAdjustments` rule is needed.


