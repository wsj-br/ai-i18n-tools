<a id="link-rewriting"></a>
# Link rewriting

`translate-docs` rewrites URLs in translated markdown so links still resolve after files move to locale-specific paths. Most cross-page links are handled automatically; when your site uses a shared static URL tree or locale-coded asset folders, add `docsOutput.postProcessing.regexAdjustments` rules.

<a id="built-in-rewriters"></a>
## Built-in rewriters

Which rewriter runs depends on `docsOutput.style`:

| Layout | Built-in rewriter | What it fixes |
| --- | --- | --- |
| `"flat"` (default when no custom `pathTemplate`) | Flat link rewriter (`rewriteRelativeLinks`, on by default) | Cross-page relative links (`guide.md` → `guide.de.md`) and depth prefixes for non-markdown asset URLs |
| `"vitepress"` | VitePress link normalizer (`rewriteVitepressLinks`, on by default) | README-style `docs/guide/…` paths → site routes (`/guide/…`) |
| `"nextra"` | Nextra link normalizer (`rewriteNextraLinks`, on by default) | `content/en/…` and relative `.mdx` paths → locale-neutral routes (`/guide/…`) |
| `"fumadocs"` | Fumadocs link normalizer (`rewriteFumadocsLinks`, on by default) | `content/docs/…` and relative `.mdx` paths → locale-neutral routes (`/docs/…`) |
| `"doc-system"`, `"docusaurus"`, `"astro-starlight"` | None | Source URLs pass through unchanged until `postProcessing` |

Custom `pathTemplate` disables the flat rewriter unless you set `rewriteRelativeLinks: true` explicitly. See [Output layouts](/guide/documents/output-layouts) and [Anchor links](/guide/documents/anchor-links) for cross-page `#anchor` handling.

For VitePress-specific authoring rules, see [VitePress integration — Link conventions](/guide/integrations/vitepress#link-conventions).

For Nextra-specific authoring rules, see [Nextra integration — Link conventions](/guide/integrations/nextra#link-conventions).

For Fumadocs-specific authoring rules, see [Fumadocs integration — Link conventions](/guide/integrations/fumadocs#link-conventions).

<a id="postprocessingregexadjustments"></a>
## `postProcessing.regexAdjustments`

Add ordered `{ "description"?, "search", "replace" }` rules under `docs[].docsOutput.postProcessing` when built-in rewriters are not enough — for example:

- Screenshot or image URLs that include a **locale folder segment** (`screenshots/en-GB/` → `screenshots/de/`)
- Absolute site-root paths (`/img/…`) that differ between English source and translated output trees
- Any URL pattern that must change per target locale but is not a simple relative markdown link

`postProcessing` runs on the **reassembled translated markdown body** (YAML front matter keys and non-prose values are preserved). It executes **after** segment reassembly and built-in link rewriting, and **before** `addFrontmatter`.

<a id="two-step-flow-with-flat-layout"></a>
### Two-step flow with flat layout

When `docsOutput.style = "flat"`, the flat link rewriter runs first, then `regexAdjustments`:

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

Example with `outputDir: "translated-docs/"` and source `README.md` at repo root:

1. Flat rewriter: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments`: `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

Write `search` patterns to match the locale segment **inside the already-prefixed URL** — you do not need to include the `../` depth prefix in the regex.

For `doc-system` layouts, the flat rewriter does not run. `regexAdjustments` sees the original URL from source markdown (typically an absolute path like `/img/screenshots/en-GB/foo.png`).

See [The flat link rewriter and two-step flow](/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow) for depth-prefix behaviour and `flatPreserveRelativeDir`.

<a id="replace-placeholders"></a>
### `replace` placeholders

`replace` strings support template variables expanded per file and locale:

| Placeholder | Value |
| --- | --- |
| `${translatedLocale}` | Target locale (normalized BCP-47) |
| `${sourceLocale}` | Source locale |
| `${sourceFullPath}` | Absolute source file path (POSIX `/`) |
| `${translatedFullPath}` | Absolute translated output path |
| `${sourceFilename}` / `${translatedFilename}` | Basename with extension |
| `${sourceBasedir}` / `${translatedBasedir}` | Parent directory of source / output file |

`search` is a regex pattern. A plain string uses the `g` flag; use `/pattern/flags` when you need other flags (the pattern must not contain unescaped `/` characters).

<a id="common-patterns"></a>
## Common patterns

<a id="per-locale-asset-folder"></a>
### Per-locale asset folder

Store assets under a locale-coded subdirectory from day one and swap the segment with one generic rule:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

Use `[^/]+` rather than hardcoding your source locale (`en-GB`) so the rule still works if `sourceLocale` changes.

Full walkthrough: [Images & Screenshots — Per-locale folder](/guide/images-and-screenshots/per-locale-folder).

<a id="doc-system-static-urls"></a>
### Doc-system static URLs

For Docusaurus, Starlight, or other `doc-system` sites that serve screenshots from a shared static tree:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

Prefer colocated relative paths (`../assets/name.png`) in source markdown when your generator supports it — then no `regexAdjustments` bridge is needed. See [Images & Screenshots](/guide/images-and-screenshots/) for layout choices.

<a id="when-regex-is-not-needed"></a>
### When regex is not needed

You usually **do not** need `regexAdjustments` when:

- Cross-page links are simple relative markdown paths and `docsOutput.style = "flat"` (built-in rewriter adds locale suffixes)
- Assets sit beside source files and the flat rewriter's per-file depth prefix resolves them correctly
- English and every translated copy use the **same** URL (shared images at site root, colocated assets, VitePress site routes after normalizer)
- VitePress in-site links use site routes or `docs/guide/…` paths with `rewriteVitepressLinks: true`
- Nextra and Fumadocs in-page links use locale-neutral routes (`/guide/…`, `/docs/…`) or content-root paths with `rewriteNextraLinks` / `rewriteFumadocsLinks: true`

<a id="full-config-example"></a>
## Full config example

Flat README with per-locale screenshots and an optional language-switcher block:

<details>
<summary>Flat layout: regexAdjustments + languageListBlock</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

Field reference: [Configuration — `docs`](/reference/configuration#docs) (`docsOutput.postProcessing`).

<a id="troubleshooting"></a>
## Troubleshooting

| Symptom | Likely cause | What to check |
| --- | --- | --- |
| Translated page 404s on an image or static asset | Missing or wrong `regexAdjustments` for your URL layout | [Images & Screenshots — Troubleshooting](/guide/images-and-screenshots/troubleshooting) |
| Link opens the right file but wrong `#section` | Anchor slug drift, not URL rewriting | [Anchor links](/guide/documents/anchor-links) |
| `regexAdjustments` rule has no effect on flat layout | `search` expects the pre-rewriter URL but flat layout already added a depth prefix | Match the segment inside the prefixed path (see [two-step flow](#two-step-flow-with-flat-layout)) |
| Invalid regex skipped at runtime | Malformed `search` pattern | CLI warns with the rule `description`; test patterns against sample translated output |
