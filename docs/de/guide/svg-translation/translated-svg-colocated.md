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

[duplistatus](https://github.com/wsj-br/duplistatus) – verschachtelter `svg`-Block mit `pathTemplate` in [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json); Quell-SVGs, die unter `documentation/static/img/` aufgeführt sind (z. B. [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg` schreibt pro-locale Dateien in `documentation/i18n/<locale>/…/current/assets/` neben nebeneinanderliegenden PNGs; Dokumente betten sie heute über `/img/duplistatus_*.svg` ein (z. B. [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md)). Siehe [task-locale-assets-simplification.md](https://github.com/wsj-br/duplistatus/blob/master/dev/task-locale-assets-simplification.md) für die geplante Umstellung auf `../assets/`-Pfade und die Entfernung der SVG `regexAdjustments`-Brücke.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
