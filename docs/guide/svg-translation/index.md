<a id="svg-translation"></a>
# SVG translation

Designed for **SVG illustrations and diagrams** that contain human-readable labels. The `translate-svg` command reads source `.svg` files, extracts text from `<text>`, `<title>`, and `<desc>` elements, translates those strings via the active LLM provider, and writes **one output SVG per target locale**.

This is the only pipeline that emits locale-specific **binary** SVG files. `translate-docs` translates markdown alt text and link references, but it does not modify or copy SVG assets. When a page needs a diagram with translated labels, enable `features.translateSVG` and configure the top-level `svg` block.

<a id="per-locale-model-overrides"></a>
### Per-locale model overrides

`translate-svg` resolves models **per target locale**: `localeModels(locale)` first when configured, then `translationModels`. Each locale's SVG run uses its own fallback chain — useful when diagram labels in CJK locales need a script-tuned model (for example `ja`). See [Providers and models](/guide/providers-and-models#model-fallback-chain).

SVG translation uses the same SQLite cache as `translate-docs` and `translate-json` (`cacheDir`). Already-translated text segments are served from cache; only new or changed source text is sent to the LLM.

<a id="when-to-use-svg-translation"></a>
### When to use SVG translation

Use `translate-svg` when:

- An SVG contains visible labels, titles, or descriptions that must change per locale.
- A web app loads locale-specific diagram files at runtime (for example `dashboard.de.svg`).
- A doc-system site (Docusaurus, Astro Starlight, VitePress) colocates translated SVGs beside translated markdown.

Do **not** use `translate-svg` for:

- Decorative SVGs with no translatable text (icons, logos, backgrounds).
- Raster screenshots (PNG, JPEG, WebP) — those are handled through [Images and screenshots](/guide/images-and-screenshots/).
- Text baked into path data instead of `<text>` elements — the extractor cannot read path outlines.

<a id="design-for-i18n-from-the-start"></a>
### Design for i18n from the start

SVGs are easiest to translate when labels are real text elements from day one:

- Put human-readable copy in `<text>`, `<title>`, and `<desc>`.
- Avoid converting labels to paths in your design tool — path data is opaque to the translator.
- Keep **source SVGs** in a dedicated directory separate from `svg.outputDir`. Mixing sources and generated locale files makes it impossible to tell which files are safe to edit or regenerate.

For web apps, enable `forceLowercase: true` when your design uses all-lowercase labels — it avoids case-sensitivity mismatches across filesystems and CDNs.

<a id="output-layouts"></a>
### Output layouts

`translate-svg` supports two common output shapes. Choose based on how your app or doc site references SVG files at runtime.

| Layout | `svg.style` | Best for | Child guide |
|--------|-------------|----------|-------------|
| **Flat (web app)** | `"flat"` | Next.js, Vite, and other apps that embed SVGs by locale-coded filename | [Web app (flat SVG)](/guide/svg-translation/translated-svg-web-app) |
| **Colocated (doc-system)** | `"nested"` + `pathTemplate` | Docusaurus and other doc-system sites where translated assets sit beside translated pages | [Colocated SVG](/guide/svg-translation/translated-svg-colocated) |

**Flat layout** writes files like `public/assets/diagram.de.svg` next to `diagram.en-GB.svg`. Your app references them with a locale suffix:

```tsx
<img src={`/assets/diagram.${locale}.svg`} alt="Architecture diagram" />
```

**Colocated layout** writes each locale's SVG into that locale's content tree (for example `i18n/de/.../assets/diagram.svg`). Source and translated markdown use the same relative path (`../assets/diagram.svg`) — no `regexAdjustments` rule is needed.

See the [Images and screenshots decision guide](/guide/images-and-screenshots/#decision-guide) for how SVG layouts fit alongside raster screenshot strategies.

<a id="step-1-enable-and-configure"></a>
### Step 1: Enable and configure

Enable the feature and point `translate-svg` at your source files and output root:

```json
{
  "features": {
    "translateSVG": true
  },
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

Key `svg` fields:

- `sourcePath` — one or more directories or glob patterns (for example `"images/*.svg"`, `"**/icons/*.svg"`). Scanned recursively from the project root.
- `outputDir` — root directory for translated SVG output.
- `style` — `"flat"` or `"nested"` when you are not using a custom `pathTemplate`.
- `pathTemplate` — optional custom output path with placeholders `{outputDir}`, `{locale}`, `{llocale}`, `{basename}`, `{stem}`, and others (required for colocated doc-system layouts).
- `forceLowercase` — lower-case translated text on reassembly.

Full field reference: [Configuration — `svg`](/reference/configuration#svg).

<a id="step-2-translate"></a>
### Step 2: Translate

```bash
ai-i18n-tools translate-svg
```

Translate a single locale:

```bash
ai-i18n-tools translate-svg --locale de
```

Preview without writing files:

```bash
ai-i18n-tools translate-svg --dry-run
```

`sync` runs the SVG step automatically when `features.translateSVG` and `svg` are both set (skip with `--no-svg`). Shared flags include `-l` / `--locale`, `-p` / `--path`, `-j` / `--concurrency`, and `--force` / `--force-update`.

<a id="troubleshooting"></a>
### Troubleshooting

Common SVG issues — mixed source/output directories, absolute static URLs on Docusaurus, and path layout mistakes — are covered in [SVG troubleshooting](/guide/svg-translation/troubleshooting). For raster assets and link rewriting, see [Images and screenshots troubleshooting](/guide/images-and-screenshots/troubleshooting).
