<a id="output-layouts"></a>
# Output layouts

`docsOutput.style` controls where translated markdown files are written. Use the exact string values below in `docs[].docsOutput.style`. Aliases are preset `doc-system` layouts (or Fumadocs dot-suffix layout), not separate engines — config loading may rewrite alias `style` values to canonical `"doc-system"` while preserving the original preset in `stylePreset`.

Set `docs[].docsOutput.pathTemplate` (markdown/MDX) or `jsonPathTemplate` (JSON label files) to override any built-in layout. See [pathTemplate placeholders](#pathtemplate--jsonpathtemplate-placeholders) below.

<a id="layout-overview"></a>
## Layout overview

| `docsOutput.style` | Engine | Typical use |
| --- | --- | --- |
| `"nested"` | Locale folder mirrors full source tree | Default; generic i18n output under `{outputDir}/{locale}/` |
| `"flat"` | Locale suffix in filename (optional subdirs) | README, changelogs, repo-root docs, [language switcher](/guide/documents/language-switcher) |
| `"doc-system"` | Locale folder + optional `localeSubpath` under `docsRoot` | Custom static-docs generators |
| `"docusaurus"` | `doc-system` preset | [Docusaurus](/guide/integrations/docusaurus) i18n plugin layout |
| `"astro-starlight"` | `doc-system` preset (`localeSubpath: ""`) | [Astro Starlight](/guide/integrations/astro#astro-starlight), plain Astro locale pages |
| `"vitepress"` | `doc-system` preset (`localeSubpath: ""`) | [VitePress](/guide/integrations/vitepress) locale folders beside English |
| `"nextra"` | `doc-system` preset (`localeSubpath: ""`) | [Nextra](/guide/integrations/nextra) locale folders (`content/en/` → `content/{locale}/`) |
| `"fumadocs"` | Dot suffix (default) or `doc-system` when `fumadocsParser: "dir"` | [Fumadocs](/guide/integrations/fumadocs) dot or dir content layout |

<a id="nested-default"></a>
## `nested` (default)

`docsOutput.style = "nested"` (default when omitted) — mirrors the source tree under `{outputDir}/{locale}/`.

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

Paths outside a `docsRoot` (when set) use the same nested shape.

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"` — writes translated files under `outputDir` with a locale suffix in the filename. By default only the basename is kept (`{outputDir}/{stem}.{locale}{extension}`), so `docs/guide.md` and `docs/other/guide.md` would collide unless you enable `flatPreserveRelativeDir`.

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

Relative links between pages are rewritten automatically when `docsOutput.style = "flat"` (unless `rewriteRelativeLinks: false` or a custom `pathTemplate` is set). See [Anchor links](/guide/documents/anchor-links) for cross-page `#anchor` handling.

<a id="flat-with-flatpreserverelativedir"></a>
### `flat` with `flatPreserveRelativeDir`

Set `docsOutput.flatPreserveRelativeDir` to `true` to keep source subdirectories under `outputDir`. Use this when translating multiple markdown files that share basenames in different folders, or when flat outputs must mirror a shallow tree (for example README at repo root plus `docs/*.md`).

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

The flat link rewriter uses the per-file output path when computing depth prefixes for asset URLs — see [Link rewriting](/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir).

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` — locale-prefixed documentation tree for static docs sites. Files under `docsRoot` are written to:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Paths outside `docsRoot` fall back to the [nested](#nested) layout (`{outputDir}/{locale}/{relPath}`).

Set `docs[].docsOutput.docsRoot` to your English source root (e.g. `"docs"`, `"src/content/docs"`, or `"content/en"`). When `docsOutput.style = "doc-system"`, you must set `localeSubpath` explicitly (use an alias below for presets). Use `localeSubpath: ""` when translated pages sit directly under `{outputDir}/{locale}/` (Starlight-style).

Docusaurus shell JSON from `docusaurusCatalogDir` and other JSON artifacts under doc-system presets follow the same folder layout as markdown. With `style: "flat"`, JSON label files still use the nested shape unless you set `jsonPathTemplate`.

<a id="doc-system-aliases"></a>
## Doc-system aliases

**Aliases** (same `doc-system` engine, preset `localeSubpath` and defaults):

- `docsOutput.style = "docusaurus"` — `localeSubpath` defaults to `docusaurus-plugin-content-docs/current` (Docusaurus i18n plugin layout).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` defaults to `""`; `localePathLowercase` defaults to `true`. Translated pages under `{outputDir}/{locale}/`, matching [Starlight](https://starlight.astro.build/guides/i18n/) when English lives at the content root and `outputDir` equals `docsRoot`. Also used for plain Astro locale pages (`src/pages/index.astro` → `src/pages/{locale}/index.astro`) — see [Astro website pages](/guide/ui-strings/astro-website#pages-parse-and-replace).
- `docsOutput.style = "vitepress"` — same layout as `doc-system` with empty `localeSubpath`; BCP-47 locale folder names are preserved (`localePathLowercase` defaults to `false`). See [VitePress integration](/guide/integrations/vitepress).
- `docsOutput.style = "nextra"` — same layout as `doc-system` with empty `localeSubpath`; English source lives under a locale folder (e.g. `content/en/`). See [Nextra integration](/guide/integrations/nextra).

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

Optional JSON labels — Docusaurus shell strings from `docusaurusCatalogDir` (not MDX body copy):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight ships UI strings for many locales; optional custom UI overrides use `src/content/i18n/en.json` with `jsonPathTemplate: "{outputDir}/{locale}.json"` in a separate `docs[]` block when needed.

VitePress nav/sidebar/footer strings are not in markdown — configure `docsOutput.vitepressThemeCatalog` and translate inside **`translate-docs`**. See [VitePress integration](/guide/integrations/vitepress).

Nextra theme dictionary (`.ts`) and `_meta.ts` sidebar labels are not in markdown — use `docs[].nextraDictionaryPath` and automatic `_meta` collection when `style: "nextra"`, all inside **`translate-docs`**. See [Nextra integration](/guide/integrations/nextra).

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` — Fumadocs content layout via `docsOutput.fumadocsParser`:

- **`"dot"` (default)** — locale suffix in the filename beside English sources under `outputDir` (not a locale folder). This is separate from the `doc-system` path shape.

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** — Nextra-style locale folders; uses the same `doc-system` engine with empty `localeSubpath`.

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Fumadocs UI overrides (`lib/layout.shared.ts`) and `meta.json` sidebar labels are not in markdown — use `docsOutput.fumadocsUiCatalog` and automatic `meta.json` collection when `style: "fumadocs"`, all inside **`translate-docs`**. See [Fumadocs integration](/guide/integrations/fumadocs).

For link and asset URL rewriting beyond built-in relative-link fixes, see [Link rewriting](/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`).

For screenshots and raster assets in translated pages, see [Images & Screenshots](/guide/images-and-screenshots/).

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` placeholders

Override where translated files are written by setting `docs[].docsOutput.pathTemplate` (markdown and MDX) or `jsonPathTemplate` (JSON label files). Both accept the same placeholders. Resolved paths must stay inside that block's `outputDir` (the CLI rejects paths that escape it).

If you use a custom `pathTemplate`, `rewriteRelativeLinks` defaults to `false` unless you set it explicitly — relative link rewriting is built for `docsOutput.style = "flat"` without a custom template.

For built-in layouts (`nested`, `flat`, `doc-system` without a custom template), set `docsOutput.localePathLowercase` to `true` to write lowercased locale folder or filename segments (e.g. `pt-br` instead of `pt-BR`). The `astro-starlight` alias and `doc-system` with empty `localeSubpath` default this to `true` at config load. Custom `pathTemplate` / `jsonPathTemplate` values are unchanged — use `{llocale}` there when you need lowercase segments while keeping `{locale}` as BCP-47.

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
