<a id="per-locale-folder-url-rewriting"></a>
# Per-locale folder (URL rewriting)

Use for README/USER-GUIDE with `docsOutput.style = "flat"`, and for doc-system sites (`docsOutput.style = "doc-system"` or aliases `"docusaurus"` / `"astro-starlight"`) and for `"vitepress"` / other doc-system presets that serve screenshots from a shared static URL tree. Link-rewriting details for VitePress: [Link rewriting — VitePress](/guide/images-and-screenshots/link-rewriting#vitepress-link-normalizer-style-vitepress).

<a id="directory-layout"></a>
### Directory layout

<details>
<summary>Example per-locale screenshot directory tree</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

Source markdown references the source locale directory:

```markdown
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Screenshot script contract

The `take-screenshots` script must write files for every locale — not just the source locale. The `translate-docs` command rewrites paths but does not create files. A typical helper:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

See a simple `bash` example in the [screenshot script in examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh), or a more complex example in [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) from the [duplistatus](https://github.com/wsj-br/duplistatus) project (also used in production by [Transrewrt](https://github.com/wsj-br/transrewrt)).


> **Note:** The four sub-sections below share the same `regexAdjustments` locale-segment swap (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`). Only the output layout and whether the flat link rewriter runs first differ — jump to the sub-section that matches your `docsOutput.style`.
>
> **Note:** `regexAdjustments` runs on the full translated markdown body, including fenced code blocks. If a doc page embeds a config example that contains a matching path (e.g. `screenshots/en-GB/`), that snippet will also be rewritten in translated output. Prefer the generic `screenshots/[^/]+/` form in reusable examples.

<a id="config---docsoutputstyle--flat"></a>
### Config - `docsOutput.style = "flat"`

The flat link rewriter runs first when `docsOutput.style = "flat"` and prepends a depth prefix to non-markdown URLs. For a `README.md` at the repo root with `outputDir: "translated-docs/"`, it adds `../`:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

The `regexAdjustments` rule then replaces the locale segment within that already-prefixed URL:

<details>
<summary>Example regexAdjustments for flat layout</summary>

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

</details>

Result: `../images/screenshots/de/translate.png` — correct relative path from `translated-docs/README.de.md` back to the repo root.

The `postProcessing` step runs after the flat link rewriter. Write `search` regexes that match the locale segment anywhere within the already-prefixed URL — no need to include the `../` prefix in the regex.

Implementation example (production): [Transrewrt](https://github.com/wsj-br/transrewrt) — screenshot URLs in [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`), locale rewrite in [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json), capture script based on [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) from duplistatus (see the [screenshot script contract](#screenshot-script-contract) above).

Implementation example (demo config): [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — second `docs[]` block in [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`); helper script [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### Config - `docsOutput.style = "doc-system"`

Same per-locale folder approach for any doc-system site that references screenshots via a shared static URL prefix. The flat link rewriter does not run; `postProcessing` rewrites the locale segment in the original markdown URL.

<details>
<summary>Example regexAdjustments for doc-system layout</summary>

```json
"docsOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Set `localeSubpath` to match your generator's layout between `{locale}/` and the translated file, or use a preset alias (`"docusaurus"`, `"astro-starlight"`) instead of `"doc-system"` when the defaults fit. Source markdown typically embeds the source locale in the URL:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

Ship matching PNG files at the same path for every target locale (e.g. `static/img/screenshots/de/screenshot.png`). Prefer `screenshots/[^/]+/` over hardcoding `screenshots/en-GB/` so the rule survives a `sourceLocale` change.

<a id="preset---docsoutputstyle--docusaurus"></a>
### Preset - `docsOutput.style = "docusaurus"`

Same as `"doc-system"` with default `localeSubpath = "docusaurus-plugin-content-docs/current"`. The flat link rewriter does not run. `postProcessing` sees the original markdown URL. English pages typically use an absolute path with the source locale:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Example regexAdjustments for Docusaurus preset</summary>

```json
"docsOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Ship matching PNG files at `docs-site/static/img/screenshots/<locale>/screenshot.png`. For source-locale-agnostic configs, prefer `screenshots/[^/]+/` over `screenshots/en-GB/`.

Implementation example: [examples/docusaurus-docs/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) with [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json).

<a id="preset---docsoutputstyle--astro-starlight"></a>
### Preset - `docsOutput.style = "astro-starlight"`

Same as `"doc-system"` with `localeSubpath: ""` — translated pages sit directly under `{outputDir}/{locale}/`. Same per-locale folder approach as the generic doc-system config above. Source markdown uses `/img/screenshots/en-GB/screenshot.png`:

<details>
<summary>Example regexAdjustments for Astro Starlight preset</summary>

```json
"docsOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Ship PNGs at `public/img/screenshots/<locale>/screenshot.png`. The `${translatedLocale}` placeholder uses your config locale string (e.g. `pt-BR`). The `astro-starlight` preset lowercases locale **output paths** by default (`pt-br/`), but static asset folders under `public/img/screenshots/` should match the locale segment written into markdown URLs — keep screenshot directories aligned with `${translatedLocale}`, not necessarily with Astro route casing.

Implementation example: [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) — [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) and [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).
