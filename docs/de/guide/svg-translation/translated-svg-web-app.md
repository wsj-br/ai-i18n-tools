<a id="translated-svg-with-svgstyle--flat"></a>
# Übersetzte SVG mit `svg.style = "flat"`

Verwenden Sie dies, wenn eine Web-App sprachspezifische SVG-Illustrationen oder -Diagramme einbettet und zur Laufzeit über den Locale-Code darauf verweist.

<a id="config"></a>
### Konfiguration

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

`translate-svg` liest jede `.svg` unter `images/` und schreibt je eine Datei pro Locale:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### App-Referenz

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Empfohlene Quellstruktur

Halten Sie die Quell-SVGs getrennt vom Ausgabeverzeichnis. Mit `sourcePath: "images"` und `outputDir: "public/assets"` sind die beiden Verzeichnisse unterschiedlich. Legen Sie niemals beide auf dasselbe Verzeichnis fest.

<a id="implementation-example"></a>
### Implementierungsbeispiel

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) – `svg`-Block in [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); Quell- [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg); pro-locale Ausgaben unter [public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) (z. B. `translation_demo_svg.de.svg`); Laufzeit-URL in [page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
