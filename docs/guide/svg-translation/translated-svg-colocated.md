<a id="colocated-translated-svg-doc-system"></a>
# Colocated translated SVG (doc-system)

Use for doc-system sites where translated SVG illustrations must appear alongside translated docs in each locale's content directory — the same location as [colocated screenshots](/guide/images-and-screenshots/colocated-screenshots). The Docusaurus preset is the primary example.

<a id="config"></a>
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

`translate-svg` writes one SVG per locale into the same `current/assets/` directory that colocated screenshots use for PNGs:

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

Full reference in the [svg configuration table](/reference/configuration#svg).

<a id="implementation-example"></a>
### Implementation example

[duplistatus](https://github.com/wsj-br/duplistatus) — nested `svg` block with `pathTemplate` in [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json); source SVGs listed under `documentation/static/img/` (e.g. [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg` writes per-locale files into `documentation/i18n/<locale>/…/current/assets/` beside colocated PNGs; docs embed them today via `/img/duplistatus_*.svg` (e.g. [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md)). See [task-locale-assets-simplification.md](https://github.com/wsj-br/duplistatus/blob/master/dev/task-locale-assets-simplification.md) for the planned move to `../assets/` paths and removal of the SVG `regexAdjustments` bridge.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
