<a id="language-switcher-languagelistblock"></a>
# Language switcher (`languageListBlock`)

Use `docsOutput.postProcessing.languageListBlock` when translated markdown files should include a **"Read in other languages"** row of links — one link per locale, with `href` values computed relative to each output file.

This repository uses it for [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) (flat output under `translated-docs/`). After `translate-docs`, each translated copy gets a refreshed block; for example [translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) links to sibling locale files under `translated-docs/` and back to the English source at the repo root.

Requires `docsOutput.style = "flat"` (or another layout where sibling locale files are addressable by relative path). See [Output layouts](/guide/documents/output-layouts).

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. Mark the block in source markdown

Wrap the switcher in HTML (or any lines) bounded by `start` and `end` substring markers. This repo uses:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/) · [Deutsch](./README.de.md) · …</small>
```

The initial link text is only a placeholder. `translate-docs` replaces the whole slice from the first line containing `start` through the first later line containing `end` (markers inside fenced code blocks are ignored so config examples in the same file do not match).

<a id="2-configure-the-block"></a>
## 2. Configure the block

`start` and `end` are arbitrary substring markers — they do not have to be `<small id="lang-list">` / `</small>`. Pick any opening and closing text that appears only on the language-switcher slice: another HTML tag (`<div class="lang-switcher">` … `</div>`), HTML comments (`<!-- lang-list -->` … `<!-- /lang-list -->`), or markdown-only boundaries (for example a line `**Languages:**` through a line `---`). Set `start` and `end` in config to match exactly what you put in the source file.

Root config ([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Field       | Role                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Substring that identifies the opening line of the block                                                  |
| `end`       | Substring on the closing line (can be the same line as `start` when both appear on one line)             |
| `separator` | Text between generated `[label](href)` links (this repo uses `" · "`)                                    |
| `label`     | Optional: `"local"` (default) uses each locale endonym from the manifest; `"english"` uses `englishName` |

<a id="3-what-happens-at-runtime"></a>
## 3. What happens at runtime

1. **Extraction** — the language-list slice is **not** sent to the model (`translatable: false`).
2. **Per translated file** — after segment translation and optional flat link rewriting, `postProcessing` rebuilds the block: one markdown link per locale, labels from `ui-languages.json` when present (else bundled master catalog, else `localeDisplayNames`), paths relative to the file being written.
3. **Source refresh** — at the end of a `translate-docs` / `sync` docs pass, the same canonical block is written back into **English source files** in `contentPaths` so adding a locale updates the switcher in the repo without hand-editing every link.

If a file has no matching block, the CLI logs a warning (when `--verbose`) and leaves the body unchanged.

<a id="4-label-manifest"></a>
## 4. Label manifest

For endonym labels (`label: "local"`), generate or maintain `ui-languages.json` via `generate-ui-languages` (written to [`languagesManifestPath`](/reference/configuration#languagesmanifestpath-optional), which defaults to `{ui.flatOutputDir}/ui-languages.json`). This repo's docs-only config has no UI pipeline and no project manifest on disk, so labels come from the bundled master catalog for `sourceLocale` + `targetLocales`.

<a id="5-examples-in-this-repository"></a>
## 5. Examples in this repository

| Example                            | Files                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This package (flat README + VitePress site) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (README block: `docsOutput.style = "flat"`; site block: `docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |
| Flat README + Docusaurus docs      | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (second block: `docsOutput.style = "flat"`; first block: `docsOutput.style = "docusaurus"`)                                                     |
| VitePress docs (minimal demo)      | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |

The line immediately before `<small id="lang-list">` (for example `**Read in other languages:**`) is a normal translatable segment and is localised in each target locale; only the link row inside the markers is regenerated verbatim apart from `href` and manifest-driven labels.
