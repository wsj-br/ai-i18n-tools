<a id="colocated-raster-doc-system"></a>
# Colocated raster (`doc-system`)

Use when a `doc-system` site colocates locale-specific assets beside translated markdown — no URL rewriting is needed. The Docusaurus preset (`docsOutput.style = "docusaurus"`) is the reference implementation; other generators using `"doc-system"` with a custom `localeSubpath` follow the same idea: English assets live at a source-locale path, translated assets live under `{outputDir}/{locale}/[localeSubpath/]assets/`.

<a id="directory-layout"></a>
### Directory layout

<details>
<summary>Example colocated asset directory tree (Docusaurus)</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

All docs in every locale use the same relative path:

```markdown
![Dashboard](../assets/screen-dashboard.png)
```

For the English (`en-GB`) locale, `../assets/` resolves via the symlink to `static/assets/`. For translated locales it resolves directly to the locale's own `current/assets/` directory.

<a id="screenshot-script-contract"></a>
### Screenshot script contract

The script must write PNGs to the correct directory for each locale. The `getScreenshotDir` function encodes the split:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

See a real-world implementation in [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) from the [duplistatus](https://github.com/wsj-br/duplistatus) repository.

<a id="config"></a>
### Config

No `regexAdjustments` rule needed for raster files. `translate-docs` translates alt text in the markdown but the URL stays unchanged:

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

If the project also uses translated SVGs, [colocated SVG translation](/guide/svg-translation/translated-svg-colocated) handles them and they land alongside the PNGs in `current/assets/` with no extra regex.

<a id="prerequisites"></a>
### Prerequisites

- The `docs/assets` symlink must exist: `ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack follows symlinks by default (`resolve.symlinks` defaults to `true` in Docusaurus builds)
- The symlink only needs to exist for the source locale — translated builds do not use it

<a id="implementation-example"></a>
### Implementation example

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` in [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts); English docs reference colocated PNGs (e.g. [dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md) with `../assets/screen-dashboard-summary.png`). Colocated SVGs from the same project land in the same `current/assets/` directories — see [Colocated SVG](/guide/svg-translation/translated-svg-colocated).
