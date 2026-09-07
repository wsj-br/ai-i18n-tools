<a id="troubleshooting"></a>
# Troubleshooting

<a id="section-anchor-links-do-not-work-in-translated-docs"></a>
## Section anchor links do not work in translated docs

A link like `[label](other.md#section-id)` may open the correct translated file but fail to scroll to the intended heading — or jump to the wrong section. The `#…` fragment no longer matches any heading `id` in that locale.

Common causes:

- Source headings never had explicit anchor ids; the site derives slugs from visible heading text, which changes after translation.
- You renamed a heading in source but the preceding `<a id="…"></a>` line is missing or still has the old id.
- Anchor links use a `#…` fragment guessed from English words instead of the id `write-heading-ids` would generate.

**Fix**

1. Run `ai-i18n-tools write-heading-ids` on your **source** `.md` / `.mdx` (same `docs[]` / `contentPaths` as `translate-docs`). By default it inserts `<a id="slug"></a>` before each ATX heading, or refreshes an existing anchor when the heading text no longer matches the current slug. For Docusaurus MDX comment ids, use `--slug-style mdx-comment`.
2. Point anchor links at those ids — e.g. `[setup](guide.md#first-run)` where `#first-run` matches the anchor line above the target heading, not a slug inferred from the English title alone.
3. Re-run `translate-docs` (or `sync --force-update`) so every locale copy includes the updated anchor lines.

Use `--dry-run` on `write-heading-ids` first to preview changes. See [Anchor links](/guide/documents/anchor-links) for the full pattern.

<a id="image-or-asset-links-404-in-translated-docs"></a>
## Image or asset links 404 in translated docs

A markdown link or `![alt](url)` works in English but returns 404 in translated copies — often because the URL still points at the source-locale folder or an English-only static path.

**Fix**

1. Confirm your asset layout matches your `docsOutput.style` (flat vs doc-system). See [Link rewriting](/guide/documents/link-rewriting) and [Images & Screenshots](/guide/images-and-screenshots/).
2. Add or adjust `docsOutput.postProcessing.regexAdjustments` to swap locale segments or bridge absolute `/img/…` paths. For flat layout, remember the flat link rewriter runs **before** `regexAdjustments` — match patterns against the already-prefixed URL.
3. Ensure locale-specific asset files exist at the paths the rewritten markdown references (`translate-docs` rewrites URLs but does not copy raster files).
