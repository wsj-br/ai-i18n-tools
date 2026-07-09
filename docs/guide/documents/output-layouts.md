<a id="output-layouts"></a>
# Output layouts

`docsOutput.style` controls where translated markdown files are written. Use the exact string values below in `docs[].docsOutput.style` (aliases are preset layouts, not separate engines).

`docsOutput.style = "nested"` (default when omitted) — mirrors the source tree under `{outputDir}/{locale}/` (e.g. `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — locale-prefixed documentation tree for static docs sites. Files under `docsRoot` are written to `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`. Paths outside `docsRoot` fall back to the nested layout. Set `docs[].docsOutput.docsRoot` to your English source root (e.g. `"docs"` or `"src/content/docs"`). When `docsOutput.style = "doc-system"`, you must set `localeSubpath` explicitly (use an alias below for presets).

**Aliases** (same layout engine, preset `localeSubpath`):

- `docsOutput.style = "docusaurus"` — `localeSubpath` defaults to `docusaurus-plugin-content-docs/current` (Docusaurus i18n plugin layout).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` defaults to `""` (translated pages directly under `{outputDir}/{locale}/`, matching [Starlight](https://starlight.astro.build/guides/i18n/) when English lives at the content root and `outputDir` equals `docsRoot`).
- `docsOutput.style = "vitepress"` — same layout as `doc-system` with empty `localeSubpath`; BCP-47 locale folder names are preserved (`localePathLowercase` defaults to `false`). See [VitePress integration](/guide/vitepress-integration).
- `docsOutput.style = "nextra"` — same layout as `doc-system` with empty `localeSubpath`; English source lives under a locale folder (e.g. `content/en/`). See [Nextra integration](/guide/nextra-integration).
- `docsOutput.style = "fumadocs"` — same layout as `doc-system` with empty `localeSubpath`; English source uses dot-suffix files (default) or a locale folder when `fumadocsParser` is `"dir"`. See [Fumadocs integration](/guide/fumadocs-integration).

Docusaurus preset (primary documentation pages):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight preset (same block shape, different paths):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

VitePress preset (English at content root, locale folders beside source):

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Nextra preset (English under a locale folder, sibling locale folders for targets):

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

Fumadocs preset — dot parser (default; locale suffix beside English source):

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

Fumadocs preset — dir parser (Nextra-style locale folders):

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Optional JSON labels — Docusaurus shell strings from `docusaurusCatalogDir` (not MDX body copy):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight ships UI strings for many locales; optional custom UI overrides use `src/content/i18n/en.json` with `jsonPathTemplate: "{outputDir}/{locale}.json"` in a separate `docs[]` block when needed.

VitePress nav/sidebar/footer strings are not in markdown — configure `docsOutput.vitepressThemeCatalog` and translate inside **`translate-docs`**. See [VitePress integration](/guide/vitepress-integration).

Nextra theme dictionary (`.ts`) and `_meta.ts` sidebar labels are not in markdown — use `docs[].nextraDictionaryPath` and automatic `_meta` collection when `style: "nextra"`, all inside **`translate-docs`**. See [Nextra integration](/guide/nextra-integration).

Fumadocs UI overrides (`lib/layout.shared.ts`) and `meta.json` sidebar labels are not in markdown — use `docsOutput.fumadocsUiCatalog` and automatic `meta.json` collection when `style: "fumadocs"`, all inside **`translate-docs`**. See [Fumadocs integration](/guide/fumadocs-integration).

`docsOutput.style = "flat"` — places translated files next to the source with a locale suffix, or in a subdirectory. Relative links between pages are rewritten automatically when `docsOutput.style = "flat"` (unless `rewriteRelativeLinks: false` or a custom `pathTemplate` is set).

```text
docs/guide.md → i18n/guide.de.md
```

For cross-page anchor links in flat layout, see [Anchor links](/guide/documents/anchor-links).

For link and asset URL rewriting beyond built-in relative-link fixes, see [Link rewriting](/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`).

For screenshots and raster assets in translated pages, see [Images & Screenshots](/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` placeholders

Override where translated files are written by setting `docs[].docsOutput.pathTemplate` (markdown and MDX) or `jsonPathTemplate` (JSON label files). Both accept the same placeholders. Resolved paths must stay inside that block's `outputDir` (the CLI rejects paths that escape it).

If you use a custom `pathTemplate`, `rewriteRelativeLinks` defaults to `false` unless you set it explicitly — relative link rewriting is built for `docsOutput.style = "flat"` without a custom template.

For built-in layouts (`nested`, `flat`, `doc-system` without a custom template), set `docsOutput.localePathLowercase` to `true` to write lowercased locale folder or filename segments (e.g. `pt-br` instead of `pt-BR`). The `astro-starlight` alias defaults this to `true`. Custom `pathTemplate` / `jsonPathTemplate` values are unchanged — use `{llocale}` there when you need lowercase segments while keeping `{locale}` as BCP-47.

| Placeholder            | Role                                                                                                       | Example                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Absolute resolved path of this documentation block's `outputDir`                                           | `/home/acme/repo/i18n`                                           |
| `{locale}`             | Target locale code (same form as in config / CLI)                                                          | `de`, `pt-BR`                                                    |
| `{LOCALE}`             | Same locale uppercased                                                                                     | `DE`, `PT-BR`                                                    |
| `{llocale}`            | Same locale lowercased (matches Astro route folders such as `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}`            | Source file path relative to the project root, POSIX `/`                                                   | `docs/guide.md`, `README.md`                                     |
| `{stem}`               | File name **without** extension                                                                            | `guide` for `docs/guide.md`                                      |
| `{basename}`           | File name **with** extension                                                                               | `guide.md`                                                       |
| `{extension}`          | Extension **including** the dot                                                                            | `.md`, `.mdx`                                                    |
| `{docsRoot}`           | Absolute resolved path of `docsOutput.docsRoot` (default `docs` if omitted)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` with a matching `docsRoot` prefix removed when path strings align (POSIX); otherwise unchanged | `docs/guide.md` (common); `guide.md` only when stripping applies |

**Example**

Config snippet:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

For locale `de` and source `docs/guide.md`, with project root `/home/acme/repo` and `outputDir` resolving to `/home/acme/repo/i18n`, the expanded path is:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

With `docsOutput.style = "flat"` and no custom `pathTemplate`, a common pattern keeps only the file name via `{stem}` and `{extension}`, for example `{outputDir}/{stem}.{locale}{extension}`, which yields `…/guide.de.md` under the resolved `outputDir`.
