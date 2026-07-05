<a id="translated-svg-with-svgstyle--flat"></a>
# Translated SVG with `svg.style = "flat"`

Use when a web app embeds locale-specific SVG illustrations or diagrams and references them by locale code at runtime.

<a id="config"></a>
### Config

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` reads every `.svg` under `images/` and writes one file per locale:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### App reference

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Source layout recommendation

Keep source SVGs separate from the output directory. With `sourcePath: "images"` and `outputDir: "public/assets"` the two directories are distinct. Never set both to the same directory.

<a id="implementation-example"></a>
### Implementation example

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — `svg` block in [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); source [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg); per-locale outputs under [public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) (e.g. `translation_demo_svg.de.svg`); runtime URL in [page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
