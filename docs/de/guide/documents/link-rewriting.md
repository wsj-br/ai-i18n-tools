<a id="link-rewriting"></a>
# Link-Umschreibung

`translate-docs` schreibt URLs in übersetztem Markdown um, damit Links auch nach dem Verschieben von Dateien an lokalspezifische Pfade noch aufgelöst werden. Die meisten seitenübergreifenden Links werden automatisch behandelt; wenn Ihre Website einen gemeinsamen statischen URL-Baum oder lokalisierte Asset-Ordner verwendet, fügen Sie `docsOutput.postProcessing.regexAdjustments`-Regeln hinzu.

<a id="built-in-rewriters"></a>
## Integrierte Umschreiber

Welcher Umschreiber ausgeführt wird, hängt von `docsOutput.style` ab:

| Layout | Integrierter Umschreiber | Was er behebt |
| --- | --- | --- |
| `"flat"` (Standard, wenn kein benutzerdefiniertes `pathTemplate`) | Flacher Link-Umschreiber (`rewriteRelativeLinks`, standardmäßig aktiviert) | Seitenübergreifende relative Links (`guide.md` → `guide.de.md`) und Tiefenpräfixe für Nicht-Markdown-Asset-URLs |
| `"vitepress"` | VitePress Link-Normalisierer (`rewriteVitepressLinks`, standardmäßig aktiviert) | README-ähnliche `docs/guide/…`-Pfade → Website-Routen (`/guide/…`) |
| `"doc-system"`, `"docusaurus"`, `"astro-starlight"` | Keine | Quell-URLs werden bis `postProcessing` unverändert durchgereicht |

Benutzerdefiniertes `pathTemplate` deaktiviert den flachen Umschreiber, es sei denn, Sie legen `rewriteRelativeLinks: true` explizit fest. Siehe [Ausgabe-Layouts](/guide/documents/output-layouts) und [Anker-Links](/guide/documents/anchor-links) für die seitenübergreifende `#anchor`-Behandlung.

Für VitePress-spezifische Authoring-Regeln siehe [VitePress-Integration – Link-Konventionen](/guide/vitepress-integration#link-conventions).

<a id="postprocessing-regexadjustments"></a>
## `postProcessing.regexAdjustments`

Fügen Sie geordnete `{ "description"?, "search", "replace" }`-Regeln unter `docs[].docsOutput.postProcessing` hinzu, wenn die integrierten Umschreiber nicht ausreichen – zum Beispiel:

- Screenshot- oder Bild-URLs, die ein **Lokalisierungsordnersegment** enthalten (`screenshots/en-GB/` → `screenshots/de/`)
- Absolute Website-Root-Pfade (`/img/…`), die sich zwischen englischer Quelle und übersetzten Ausgabe-Bäumen unterscheiden
- Jedes URL-Muster, das sich pro Zielsprache ändern muss, aber kein einfacher relativer Markdown-Link ist

`postProcessing` wird auf den **wieder zusammengesetzten übersetzten Markdown-Text** angewendet (YAML-Frontmatter-Schlüssel und Nicht-Prosa-Werte bleiben erhalten). Es wird **nach** der Segmentwiederzusammensetzung und der integrierten Link-Umschreibung und **vor** `addFrontmatter` ausgeführt.

<a id="two-step-flow-with-flat-layout"></a>
### Zweistufiger Ablauf mit flachem Layout

Wenn `docsOutput.style = "flat"`, wird zuerst der flache Link-Umschreiber ausgeführt, dann `regexAdjustments`:

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

Beispiel mit `outputDir: "translated-docs/"` und Quelldatei `README.md` im Stammverzeichnis des Repos:

1. Flacher Umschreiber: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments`: `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

Schreiben Sie `search`-Muster, um das Gebietsschema-Segment **innerhalb der bereits präfixierten URL** abzugleichen – Sie müssen das `../`-Tiefenpräfix nicht in den Regex aufnehmen.

Für `doc-system`-Layouts wird der flache Umschreiber nicht ausgeführt. `regexAdjustments` sieht die ursprüngliche URL aus dem Quell-Markdown (typischerweise ein absoluter Pfad wie `/img/screenshots/en-GB/foo.png`).

Siehe [Der flache Link-Umschreiber und der zweistufige Ablauf](/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow) für das Tiefenpräfix-Verhalten und `flatPreserveRelativeDir`.

<a id="replace-placeholders"></a>
### `replace`-Platzhalter

`replace`-Strings unterstützen Vorlagenvariablen, die pro Datei und Gebietsschema erweitert werden:

| Platzhalter | Wert |
| --- | --- |
| `${translatedLocale}` | Ziel-Gebietsschema (normalisiert BCP-47) |
| `${sourceLocale}` | Quell-Gebietsschema |
| `${sourceFullPath}` | Absoluter Quell-Dateipfad (POSIX `/`) |
| `${translatedFullPath}` | Absoluter übersetzter Ausgabepfad |
| `${sourceFilename}` / `${translatedFilename}` | Basisname mit Erweiterung |
| `${sourceBasedir}` / `${translatedBasedir}` | Übergeordnetes Verzeichnis der Quell-/Ausgabedatei |

`search` ist ein Regex-Muster. Ein einfacher String verwendet das Flag `g`; verwenden Sie `/pattern/flags`, wenn Sie andere Flags benötigen (das Muster darf keine nicht-escapten `/`-Zeichen enthalten).

<a id="common-patterns"></a>
## Häufige Muster

<a id="per-locale-asset-folder"></a>
### Asset-Ordner pro Gebietsschema

Speichern Sie Assets von Anfang an in einem nach Gebietsschema kodierten Unterverzeichnis und tauschen Sie das Segment mit einer generischen Regel aus:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

Verwenden Sie `[^/]+` anstatt Ihr Quell-Gebietsschema (`en-GB`) fest zu kodieren, damit die Regel auch dann funktioniert, wenn sich `sourceLocale` ändert.

Vollständige Anleitung: [Bilder & Screenshots — Ordner pro Gebietsschema](/guide/images-and-screenshots/per-locale-folder).

<a id="doc-system-static-urls"></a>
### Statische URLs von Dokumentationssystemen

Für Docusaurus, Starlight oder andere `doc-system`-Sites, die Screenshots von einem gemeinsamen statischen Baum bereitstellen:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

Bevorzugen Sie kollokierte relative Pfade (`../assets/name.png`) in der Quell-Markdown, wenn Ihr Generator dies unterstützt – dann ist keine `regexAdjustments`-Brücke erforderlich. Siehe [Bilder & Screenshots](/guide/images-and-screenshots/) für Layout-Optionen.

<a id="when-regex-is-not-needed"></a>
### Wann Regex nicht benötigt wird

Sie benötigen `regexAdjustments` normalerweise **nicht**, wenn:

- Cross-Seiten-Links sind einfache relative Markdown-Pfade und `docsOutput.style = "flat"` (der integrierte Rewriter fügt Lokalisierungssuffixe hinzu)
- Assets liegen neben den Quelldateien und der flache Rewriter mit Dateitiefe-Präfix löst sie korrekt auf
- Englisch und jede übersetzte Kopie verwenden die **gleiche** URL (gemeinsame Bilder im Stammverzeichnis der Website, gemeinsam genutzte Assets, VitePress-Webrouten nach Normalisierung)
- VitePress-Links innerhalb der Website verwenden Webrouten oder `docs/guide/…`-Pfade mit `rewriteVitepressLinks: true`

<a id="full-config-example"></a>
## Vollständiges Konfigurationsbeispiel

Flaches README mit Screenshots pro Gebietsschema und einem optionalen Sprachumschalter-Block:

<details>
<summary>Flaches Layout: regexAdjustments + languageListBlock</summary>

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
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

Feldreferenz: [Konfiguration – `docs`](/reference/configuration#docs) (`docsOutput.postProcessing`).

<a id="troubleshooting"></a>
## Fehlerbehebung

| Symptom | Wahrscheinliche Ursache | Was zu überprüfen ist |
| --- | --- | --- |
| Übersetzte Seite 404s bei einem Bild oder statischen Asset | Fehlendes oder falsches `regexAdjustments` für Ihr URL-Layout | [Bilder & Screenshots – Fehlerbehebung](/guide/images-and-screenshots/troubleshooting) |
| Link öffnet die richtige Datei, aber falsches `#section` | Anker-Slug-Drift, keine URL-Umschreibung | [Anker-Links](/guide/documents/anchor-links) |
| `regexAdjustments`-Regel hat keine Auswirkung auf das flache Layout | `search` erwartet die URL vor dem Umschreiben, aber das flache Layout hat bereits ein Tiefenpräfix hinzugefügt | Gleichen Sie das Segment innerhalb des präfigierten Pfads ab (siehe [zweistufiger Ablauf](#two-step-flow-with-flat-layout)) |
| Ungültiger Regex zur Laufzeit übersprungen | Fehlerhaftes `search`-Muster | CLI warnt mit der Regel `description`; testen Sie Muster anhand der übersetzten Beispielausgabe |
