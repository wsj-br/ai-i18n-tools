<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# Was ai-i18n-tools mit Assets macht (und nicht macht)

`translate-docs` übersetzt Markdown/MDX-Inhalte – einschließlich alternativer Bildtexte – kopiert, generiert oder gibt aber keine Rasterdateien aus. Wenn eine übersetzte Seite einen sprachspezifischen Screenshot benötigt, müssen Sie die Datei an dem Pfad ablegen, auf den das übersetzte Markdown verweisen wird.

`translate-svg` ist der einzige Befehl, der sprachspezifische Binärdateien ausgibt. Er liest Quell-SVG-Dateien, übersetzt Textelemente (`<text>`, `<title>`, `<desc>`) und schreibt pro Sprache eine Ausgabe-SVG. Rasterdateien (PNG, JPEG, WebP, GIF) werden niemals vom Tool geschrieben.

---

<a id="design-for-i18n-from-the-start"></a>
# Von Anfang an für i18n entwerfen

Die Wahl des richtigen Verzeichnislayouts, bevor überhaupt Screenshots existieren, ist der entscheidende Faktor dafür, wie problemlos sprachspezifische Assets später zu handhaben sind. Ein Nachrüsten des Layouts, nachdem Dutzende Screenshots committet wurden, bedeutet, Pfade umzustrukturieren und jeden Markdown-Verweis zu aktualisieren.

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### Markdown mit `docsOutput.style = "flat"` (README, USER-GUIDE)

Speichern Sie Screenshots von Anfang an in einem sprachkodierten Unterverzeichnis:

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

Wenn Sie später i18n hinzufügen, schreibt Ihr `take-screenshots`-Skript für jede Sprache in `images/screenshots/<locale>/`, und eine einzige `regexAdjustments`-Regel behandelt alle:

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Der generische `[^/]+`-Regex stimmt mit jedem Namen eines Gebietsschema-Ordners überein – codieren Sie Ihr Quellgebietsschema (z. B. `screenshots/en-GB/`) nicht fest, da dies zu Problemen führt, wenn sich `sourceLocale` jemals ändert.

Wenn Sie mit Pfaden beginnen, die das Unterverzeichnis des Gebietsschemas (`images/screenshots/translate.png`) weglassen, müssen Sie den gesamten Baum umstrukturieren, bevor die Umschreibung [pro Gebietsschema-Ordner](/de/guide/images-and-screenshots/per-locale-folder) funktionieren kann.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### Doc-System-Websites (`docsOutput.style = "doc-system"`)

Verwenden Sie dies für statische Dokumentationsseiten, die übersetzte Seiten in einem sprachpräfixierten Verzeichnisbaum speichern – Docusaurus i18n, Astro Starlight und benutzerdefinierte Generatoren, die demselben Aufbau folgen. Dateien unter `docsRoot` werden geschrieben nach:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Setzen Sie `docs[].docsOutput.docsRoot` auf Ihr englisches Quellverzeichnis (z. B. `"docs"` oder `"src/content/docs"`). Wenn Sie `style: "doc-system"` direkt festlegen, müssen Sie auch `localeSubpath` auf das Pfadsegment setzen, das Ihre Website zwischen `{locale}/` und der übersetzten Datei verwendet. Die Aliase `"docusaurus"`, `"astro-starlight"` und `"vitepress"` sind voreingestellte `doc-system`-Layouts mit Standardwerten für `localeSubpath` (siehe [Ausgabelayouts](/de/guide/documents/output-layouts)).

| Voreingestellter Alias | Standard-`localeSubpath` | Beispiel-Ausgabe |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (leer) | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""` (leer) | `docs/de/guide/quick-start.md` |

Der flache Link-Umschreiber wird **nicht** für `doc-system` ausgeführt (im Gegensatz zu `"flat"`). `postProcessing.regexAdjustments` erhält die ursprüngliche URL aus dem Quell-Markdown – typischerweise ein absoluter Pfad oder ein Pfad ab Stammverzeichnis der Seite wie `/img/screenshots/en-GB/foo.png`.

Das Layout **Pro Gebietsschema-Ordner** wird angewendet, wenn Screenshots in einem gemeinsamen statischen URL-Baum gespeichert sind: Verwenden Sie von Anfang an einen Gebietsschema-codierten Ordner und eine generische `screenshots/[^/]+/` → `screenshots/${translatedLocale}/`-Regel (siehe [Konfiguration – Dokumentsystem](#config---docsoutputstyle--doc-system)).

**Kollokierte Screenshots** werden angewendet, wenn die übersetzten Dokumente jedes Gebietsschemas Assets neben dem Markdown speichern (keine URL-Umschreibung). Ihr Screenshot-Skript muss PNGs in Pfade schreiben, die von `{outputDir}`, `{locale}` und `{localeSubpath}` abgeleitet sind – das unten stehende Docusaurus-Preset ist das Referenzlayout.

<a id="docusaurus-preset"></a>
#### Docusaurus-Voreinstellung

Zwei Gewohnheiten beim Projektaufbau vermeiden später alle Regex-Brückenschläge:

1. Erstellen Sie einen symbolischen Link `documentation/docs/assets → ../static/assets`, bevor Sie Screenshots hinzufügen. Docusauruses Webpack verfolgt standardmäßig symbolische Links, wodurch Quelldokumente relative Pfade verwenden können, die auch von übersetzten Dokumenten genutzt werden.

2. Legen Sie alle Dokumentations-Assets – PNGs und SVGs – in `static/assets/` ab (ein Verzeichnis). Teilen Sie sie nicht zwischen `static/img/` (SVGs) und `static/assets/` (PNGs) auf. Ein einheitlicher Speicherort bedeutet, dass jede Dokumentationsseite, sowohl englisch als auch übersetzt, denselben relativen Pfad `../assets/name.ext` referenzieren kann.

Verweisen Sie in den Quell-Markdown-Dateien auf jedes Asset mit dem stabilen relativen Pfad `../assets/name.ext`. Verwenden Sie niemals absolute `/img/`- oder `/assets/`-URLs für Dokumentations-Assets – diese URLs unterscheiden sich zwischen der englischen Quelle (ausgeliefert von `static/`) und den übersetzten Sprachversionen (lokal mit den übersetzten Dokumenten abgelegt), was eine `regexAdjustments`-Regel erfordert, um sie zu verbinden.

Wenn Sie später i18n hinzufügen, übernimmt das Screenshot-Skript die `getScreenshotDir`-Aufteilung (siehe [Kollokierte Screenshots](/de/guide/images-and-screenshots/colocated-screenshots)) und `translate-svg` verwendet ein `pathTemplate`. Es sind keine Regex-Anpassungen erforderlich.

> **Hinweis:** `resolve.symlinks = false` in einem `next.config.ts` deaktiviert die Auflösung symbolischer Links nur für den Next.js-Anwendungs-Webpack-Build. Es hat keine Auswirkungen auf den Docusaurus-Dokumentationsseiten-Build, der eine separate Webpack-Instanz verwendet.

<a id="astrostarlight-preset"></a>
#### Astro/Starlight-Voreinstellung

Entspricht `docsOutput.style = "doc-system"` mit `localeSubpath: ""` – übersetzte Seiten liegen direkt unter `{outputDir}/{locale}/`.

Speichern Sie Screenshots von Anfang an unter einem sprachcodierten Pfad:

```
public/img/screenshots/en-GB/screenshot.png
```

Verwenden Sie den generischen Regex in `regexAdjustments`:

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### Webanwendungen (Next.js, Vite, etc.) mit SVG-Assets

Halten Sie die SVG-Quelldateien in einem dedizierten Quellverzeichnis (z. B. `images/` oder `src/assets/`) und konfigurieren Sie `svg.outputDir` auf ein separates Ausgabeverzeichnis (z. B. `public/assets/`). Mischen Sie niemals Quell-SVGs und `translate-svg`-Ausgabedateien im selben Ordner – es wird unmöglich, zu unterscheiden, welche Dateien generiert wurden.

Gestalten Sie SVGs von Anfang an für die Übersetzung: verwenden Sie `<text>`, `<title>` und `<desc>`-Elemente für alle menschlichen Lesetexte. Vermeiden Sie es, Text als Pfaddaten einzubetten.

Aktivieren Sie `forceLowercase: true` im `svg`-Konfigurationsblock, um Probleme mit Groß-/Kleinschreibung über verschiedene Dateisysteme und CDNs hinweg zu vermeiden.

---

<a id="decision-guide"></a>
# Entscheidungsleitfaden

**Ist das Asset ein SVG mit übersetztem Text oder Beschriftungen?**
  - **Ja** → [Web-App-SVG](/de/guide/svg-translation/translated-svg-web-app) oder [Kolokalisierter SVG](/de/guide/svg-translation/translated-svg-colocated)
  - **Nein** (Rasterscreenshot oder dekoratives SVG) →
    - **Ist die Dokumentations-Website mit Assets kolokalisiert neben den übersetzten Dokumenten?**
      - **Ja** → [Kolokalisierte Screenshots](/de/guide/images-and-screenshots/colocated-screenshots) (Raster) + [Kolokalisierter SVG](/de/guide/svg-translation/translated-svg-colocated) (SVGs)
    - **Nur eine Sprache benötigt das Bild** (keine sprachspezifischen Varianten)?
      - **Ja** → [Gemeinsames Bild](/de/guide/images-and-screenshots/shared-image)
    - **Andernfalls** → [Sprachspezifischer Ordner](/de/guide/images-and-screenshots/per-locale-folder)

SVG-Layouts werden im Leitfaden [SVG-Übersetzung](/de/guide/svg-translation/) behandelt.

| Layout                                                                       | Asset-Typ                  | Website-Typ                                                              | Tool-Mechanism                                               |
|------------------------------------------------------------------------------|-----------------------------|------------------------------------------------------------------------|--------------------------------------------------------------|
| [Kolokalisierte Screenshots](/de/guide/images-and-screenshots/colocated-screenshots) | Raster (kolokalisiert)          | `"doc-system"` mit kolokalisierten Assets (Docusaurus-Preset)               | Screenshot-Skript platziert Dateien; kein Regex                     |
| [Pro Gebietsschema-Ordner](/de/guide/images-and-screenshots/per-locale-folder) | Raster (pro Gebietsschema) | `"flat"` oder `"doc-system"` (inkl. `"docusaurus"`, `"astro-starlight"`) | `regexAdjustments` Gebietsschema-Segmenttausch |
| [Gemeinsames Bild](/de/guide/images-and-screenshots/shared-image)                   | Raster (gemeinsam)             | `docsOutput.style = "flat"`-Dokumente                                       | Per-Datei-Link-Überschreiber; in der Regel kein Regex                     |
| [Kollokiertes SVG](/de/guide/svg-translation/translated-svg-colocated) | SVG (übersetzt, kollokiert) | `"doc-system"` mit kollokierten Assets (Docusaurus-Preset) | `translate-svg` mit `svg.style = "nested"` + `pathTemplate` |
| [Web-App-SVG](/de/guide/svg-translation/translated-svg-web-app) | SVG (übersetzt) | Web-App | `translate-svg` mit `svg.style = "flat"` |
