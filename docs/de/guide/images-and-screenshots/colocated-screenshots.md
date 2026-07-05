<a id="colocated-raster-doc-system"></a>
# Colocated Raster (`doc-system`)

Verwenden Sie dieses Muster, wenn eine `doc-system`-Website sprachspezifische Assets neben der übersetzten Markdown-Datei ablegt – keine URL-Umschreibung ist erforderlich. Die Docusaurus-Voreinstellung (`docsOutput.style = "docusaurus"`) ist die Referenzimplementierung; andere Generatoren, die `"doc-system"` mit einem benutzerdefinierten `localeSubpath` verwenden, folgen demselben Prinzip: Englische Assets liegen im Quellsprachen-Pfad, übersetzte Assets liegen unter `{outputDir}/{locale}/[localeSubpath/]assets/`.

<a id="directory-layout"></a>
### Verzeichnisstruktur

<details>
<summary>Beispiel für ein gemeinsam genutztes Asset-Verzeichnisdiagramm (Docusaurus)</summary>

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

Alle Dokumente in jeder Lokalisierung verwenden denselben relativen Pfad:

```markdown
![Dashboard](../assets/screen-dashboard.png)
```

Für die englische Lokalisierung (`en-GB`) wird `../assets/` über den symbolischen Link zu `static/assets/` aufgelöst. Für übersetzte Lokalisierungen erfolgt die Auflösung direkt im jeweiligen `current/assets/`-Verzeichnis.

<a id="screenshot-script-contract"></a>
### Vertrag für das Screenshot-Skript

Das Skript muss PNGs in das korrekte Verzeichnis für jede Locale schreiben. Die `getScreenshotDir`-Funktion kodiert die Aufteilung:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

Eine reale Implementierung finden Sie in [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) aus dem Repository [duplistatus](https://github.com/wsj-br/duplistatus).

<a id="config"></a>
### Konfiguration

Keine `regexAdjustments`-Regel erforderlich für Rasterdateien. `translate-docs` übersetzt den Alternativtext im Markdown, aber die URL bleibt unverändert:

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

Wenn das Projekt auch übersetzte SVGs verwendet, übernimmt die [kollokierte SVG-Übersetzung](/guide/svg-translation/translated-svg-colocated) diese, und sie landen zusammen mit den PNGs in `current/assets/` ohne zusätzlichen Regex.

<a id="prerequisites"></a>
### Voraussetzungen

- Der `docs/assets`-Symlink muss existieren: `ln -s ../static/assets documentation/docs/assets`
- Docusaurus Webpack folgt standardmäßig Symlinks (`resolve.symlinks` ist standardmäßig auf `true` in Docusaurus-Builds gesetzt)
- Der Symlink muss nur für die Quelllocale existieren — übersetzte Builds verwenden ihn nicht

<a id="implementation-example"></a>
### Implementierungsbeispiel

[duplistatus](https://github.com/wsj-br/duplistatus) – `getScreenshotDir(locale)` in [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts); englische Dokumente verweisen auf kollokierte PNGs (z. B. [dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md) mit `../assets/screen-dashboard-summary.png`). Kollokierte SVGs aus demselben Projekt landen in denselben `current/assets/`-Verzeichnissen – siehe [Kollokiertes SVG](/guide/svg-translation/translated-svg-colocated).
