<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# The flat link rewriter and two-step flow

For `docsOutput.style = "flat"` (and unless `rewriteRelativeLinks: false` or a custom `pathTemplate` is set), a built-in rewriter runs before `postProcessing`. It handles cross-doc links (adding locale suffixes) and prepends a depth prefix to non-markdown asset URLs. Locale-specific asset paths (screenshots, `/img/…` bridges) are then rewritten by `docsOutput.postProcessing.regexAdjustments`.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Two-step flow when `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [regexAdjustments: locale segment]  →  output URL
```

Example with `outputDir: "translated-docs/"` and source `README.md` at repo root:

1. Flat link rewriter: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (one `../` for `translated-docs/`)
2. `regexAdjustments` rule `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

For `docsOutput.style = "doc-system"` (including `"docusaurus"`, `"astro-starlight"`, and `"nested"`), the flat link rewriter does not run. `regexAdjustments` sees the original URL from the translated markdown (typically an absolute path like `/img/screenshots/en-GB/foo.png`).

<a id="vitepress-link-normalizer-style-vitepress"></a>
### VitePress link normalizer (`style: "vitepress"`)

When `docsOutput.rewriteVitepressLinks` is `true` (default when `style` is `"vitepress"`), a separate normalizer runs after segment reassembly (instead of the flat rewriter). It targets VitePress / doc-system sites where English lives at the content root and locales sit in sibling folders (`docs/de/guide/…`).

```
source href  →  [VitePress link normalizer]  →  [regexAdjustments]  →  output href
```

Typical rewrites:

| Source pattern | Normalized target |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (from a locale file) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | unchanged (use full URLs for repo paths) |

For projects that sync `README.md` → `docs/index.md`, use full GitHub URLs in `README.md` for `LICENSE`, `examples/`, and other files outside the VitePress tree. See [VitePress integration — README as the docs homepage](/guide/integrations/vitepress#readme-as-homepage).

The flat rewriter and VitePress normalizer are mutually exclusive per `docs[]` block — only one runs before `regexAdjustments`. See [VitePress integration — Link conventions](/guide/integrations/vitepress#link-conventions).

<a id="nextra-link-normalizer-style-nextra"></a>
### Nextra link normalizer (`style: "nextra"`)

When `docsOutput.rewriteNextraLinks` is `true` (default when `style` is `"nextra"`), a separate normalizer runs after segment reassembly. It rewrites `content/en/…` and relative `.mdx` paths to locale-neutral routes (`/guide/…`). See [Nextra integration — Link conventions](/guide/integrations/nextra#link-conventions).

<a id="fumadocs-link-normalizer-style-fumadocs"></a>
### Fumadocs link normalizer (`style: "fumadocs"`)

When `docsOutput.rewriteFumadocsLinks` is `true` (default when `style` is `"fumadocs"`), a separate normalizer runs after segment reassembly. It rewrites `content/docs/…` and relative `.mdx` paths to locale-neutral routes (`/docs/…`). See [Fumadocs integration — Link conventions](/guide/integrations/fumadocs#link-conventions).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Per-file depth prefix with `flatPreserveRelativeDir`

The depth prefix is computed per output file — not globally for the whole batch. For each source file, the rewriter computes the relative path from the output file's directory back to the source file's directory and uses that as the prefix.

This means that with `flatPreserveRelativeDir: true`, source files in subdirectories get the correct prefix automatically. For example, `docs/guide/quick-start.md` outputs to `translated-docs/docs/guide/quick-start.<locale>.md`. The per-file prefix is `../../docs/`, so an asset `translation-dashboard.png` (a sibling of the source tree) becomes `../../docs/translation-dashboard.png` — which resolves correctly from `translated-docs/docs/guide/` back to `docs/translation-dashboard.png`.

No `regexAdjustments` correction is needed for relative-path assets alongside source files.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` and `linkRewriteDocsRoot`

| Option                                   | Effect                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Explicitly enable or disable the flat link rewriter (overrides the default when `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Root from which `depthPrefix` is computed (default `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Affects output path layout, which the rewriter uses when computing target paths for known translated files       |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

Configure ordered `{ "description"?, "search", "replace" }` rules under `docs[].docsOutput.postProcessing` to rewrite image, screenshot, and other asset URLs that built-in rewriters do not handle — typically swapping a locale folder segment (`screenshots/en-GB/` → `screenshots/de/`) or bridging absolute static paths (`/img/…` → `../assets/…`).

Rules run on the translated markdown **body** after segment reassembly and built-in link rewriting (flat or VitePress), and before `addFrontmatter`. On flat layout, write `search` patterns against URLs **after** the depth prefix is applied — match the locale segment inside the path, not the leading `../`.

**Per-locale screenshot folders (flat layout):**

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
    ]
  }
}
```

Use `[^/]+` instead of hardcoding your source locale (`en-GB`) so the rule survives a `sourceLocale` change. The most common placeholder is `${translatedLocale}`; `${sourceLocale}`, `${sourceFilename}`, `${translatedFilename}`, and path variables are also available — see [Documents — Link rewriting](/guide/documents/link-rewriting#replace-placeholders).

Layout-specific examples (flat, doc-system, Docusaurus, Starlight): [Per-locale folder](/guide/images-and-screenshots/per-locale-folder). General cross-page link rules: [Documents — Link rewriting](/guide/documents/link-rewriting). Field reference: [Configuration — `docs`](/reference/configuration#docs).

---

<a id="common-mistakes-and-troubleshooting"></a>

See [Common mistakes and troubleshooting](/guide/images-and-screenshots/troubleshooting) for hardcoded locale regexes, missing screenshot directories, and Docusaurus `/img/` bridging.
