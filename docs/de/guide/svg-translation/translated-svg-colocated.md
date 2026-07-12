<a id="colocated-translated-svg-doc-system"></a>
# Kollokiertes übersetztes SVG (doc-system)

Verwenden Sie dies für Doc-System-Sites, bei denen übersetzte SVG-Illustrationen zusammen mit übersetzten Dokumenten im Inhaltsverzeichnis jeder Region angezeigt werden müssen – am selben Speicherort wie [nebeneinanderliegende Screenshots](/de/guide/images-and-screenshots/colocated-screenshots). Das Docusaurus-Preset ist das primäre Beispiel.

<a id="config"></a>
### Konfiguration

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

`translate-svg` schreibt eine SVG-Datei pro Gebietsschema in dasselbe `current/assets/`-Verzeichnis, das nebeneinanderliegende Screenshots für PNGs verwenden:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Quell-Markdown

Alle Dokumente in allen Sprachvarianten verwenden denselben relativen Pfad:

```markdown
![Diagram](../assets/diagram.svg)
```

Für die englische Sprachvariante löst der symbolische Link `docs/assets → ../static/assets` dies auf. Für übersetzte Sprachvarianten verweist er direkt auf `current/assets/`.

Keine `regexAdjustments`-Regel ist erforderlich, da die Quelldokumente in Englisch und die übersetzten Ausgabedokumente identische Pfade verwenden.

<a id="svg-source-location"></a>
### Speicherort der SVG-Quelldateien

Empfohlen: Quell-SVGs gemeinsam mit den en-GB-PNGs im `documentation/static/assets/`-Verzeichnis ablegen. Dadurch verbleiben alle Dokumentationsressourcen an einem Ort, und derselbe `docs/assets`-symbolische Link deckt beide ab. Die `svg.sourcePath`-Einträge verweisen dann auf `documentation/static/assets/name.svg`.

<a id="pathtemplate-placeholders"></a>
### `pathTemplate`-Platzhalter

| Platzhalter              | Wert                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | Absoluter aufgelöster Pfad von `svg.outputDir`              |
| `{locale}`               | Ziel-Sprachvariantencode                                     |
| `{LOCALE}`               | Sprachvariantencode in Großbuchstaben                                 |
| `{relPath}`              | Relativer Pfad von der `sourcePath`-Stammverzeichnisses zum Quell-SVG |
| `{stem}`                 | Dateiname ohne Erweiterung                             |
| `{basename}`             | Dateiname mit Erweiterung                                |
| `{extension}`            | Erweiterung inklusive Punkt                                |
| `{relativeToSourceRoot}` | Relativer Pfad vom nächstgelegenen `sourcePath`-Stammverzeichnis       |

Vollständige Referenz in der [SVG-Konfigurationstabelle](/de/reference/configuration#svg).

<a id="implementation-example"></a>
### Implementierungsbeispiel

[duplistatus](https://github.com/wsj-br/duplistatus) – verschachtelter `svg`-Block mit `pathTemplate` in [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json); Quell-SVGs in `documentation/static/assets/` (z. B. [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/assets/duplistatus_toolbar.svg)); `translate-svg` schreibt sprachspezifische Dateien in `documentation/i18n/<locale>/…/current/assets/` neben kollozierten PNGs; Dokumente betten sie über `../assets/`-Pfade (z. B. [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md)) ein, ohne dass eine `regexAdjustments`-Brücke erforderlich ist.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
