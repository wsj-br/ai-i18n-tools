<a id="locale-assets-guide"></a>
# Anleitung zu Lokalisierungsressourcen

Diese Anleitung beschreibt, wie lokalisierte Ressourcen – Screenshots (PNG, JPEG, WebP) und illustrierte SVG-Dateien – in Projekten behandelt werden, die `ai-i18n-tools` verwenden. Sie erläutert jedes verfügbare Muster, wann es verwendet werden sollte und wie ein Projekt von Grund auf eingerichtet wird, sodass später das Hinzufügen weiterer Sprachen keine strukturellen Anpassungen erfordert.

Für die SVG-Konfigurationsreferenz siehe den Abschnitt [`svg`](#svg) in [GETTING_STARTED.md](GETTING_STARTED.de.md). Für die `postProcessing.regexAdjustments`-Option siehe die [Konfigurationsreferenz](GETTING_STARTED.de.md#configuration-reference).

| Konfigurationspfad | Wert | Anwendungsfall | Hinweise |
|-------------|-------|----------|-------|
| `docs[].docsOutput.style` | `"flat"` | Locale-suffixed README-/USER-GUIDE-Dateien | Aktiviert den flachen Link-Rewriter; in Kombination mit `flatPreserveRelativeDir` verwenden, wenn Quellen in Unterverzeichnissen liegen |
| `docs[].docsOutput.style` | `"nested"` (Standard) | Einfache Locale-Unterordner unter `outputDir` | Kein flacher Link-Rewriter |
| `docs[].docsOutput.style` | `"doc-system"` | Locale-präfixierte Dokumentationsbäume (benutzerdefinierte Generatoren) | `docsRoot` und `localeSubpath` festlegen; flacher Link-Rewriter wird nicht ausgeführt |
| `docs[].docsOutput.style` | `"docusaurus"` / `"astro-starlight"` | Voreingestellte `doc-system`-Layouts | Aliase mit generator-spezifischen Standardwerten für `localeSubpath` |
| `svg.style` | `"flat"` | Webanwendungen (`name.<locale>.svg` in `public/assets/`) | Getrennt von Markdown `style`; wird von `translate-svg` verwendet |
| `svg.style` | `"nested"` | Lokalisierte SVG-Ausgabe im Dokumentationssystem | Oft kombiniert mit `pathTemplate` (Muster E) |

In diesem Leitfaden werden exakte JSON-Zeichenketten aus der Konfiguration verwendet – nicht nur englische Begriffe –, sodass übersetzte Versionen eindeutig bleiben. Veraltete Schlüssel (`documentations`, `markdownOutput`) werden beim Laden akzeptiert; bevorzugen Sie `docs` und `docsOutput` in neuen Konfigurationen.

<small>**In anderen Sprachen lesen:** </small>
<small id="lang-list">[English (GB)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [हिन्दी](./LOCALE-ASSETS-GUIDE.hi.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [中文 (中国大陆)](./LOCALE-ASSETS-GUIDE.zh-CN.md) · [中文 (台灣)](./LOCALE-ASSETS-GUIDE.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Was ai-i18n-tools mit Assets macht (und was nicht)](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [Internationalisierung von Anfang an planen](#design-for-i18n-from-the-start)
  - [Markdown mit `docsOutput.style = "flat"` (README, USER-GUIDE)](#markdown-with-docsoutputstyle--flat-readme-user-guide)
  - [Doc-System-Websites (`docsOutput.style = "doc-system"`)](#doc-system-sites-docsoutputstyle--doc-system)
    - [Docusaurus-Preset](#docusaurus-preset)
    - [Astro/Starlight-Preset](#astrostarlight-preset)
  - [Web-Apps (Next.js, Vite, etc.) mit SVG-Assets](#web-apps-nextjs-vite-etc-with-svg-assets)
- [Entscheidungsleitfaden](#decision-guide)
- [Muster A – Gemeinsame Rastergrafiken](#pattern-a---shared-raster)
  - [Implementierungsbeispiel](#implementation-example)
- [Muster B – Pro-locale-Ordner (URL-Umschreibung)](#pattern-b---per-locale-folder-url-rewriting)
  - [Verzeichnisstruktur](#directory-layout)
  - [Vertrag für Screenshot-Skript](#screenshot-script-contract)
  - [Konfiguration – `docsOutput.style = "flat"`](#config---docsoutputstyle--flat)
  - [Konfiguration – `docsOutput.style = "doc-system"`](#config---docsoutputstyle--doc-system)
  - [Preset – `docsOutput.style = "docusaurus"`](#preset---docsoutputstyle--docusaurus)
  - [Preset – `docsOutput.style = "astro-starlight"`](#preset---docsoutputstyle--astro-starlight)
- [Muster C – Lokal kollozierte Rastergrafiken (`doc-system`)](#pattern-c---colocated-raster-doc-system)
  - [Verzeichnisstruktur](#directory-layout-1)
  - [Vertrag für Screenshot-Skript](#screenshot-script-contract-1)
  - [Konfiguration](#config)
  - [Voraussetzungen](#prerequisites)
  - [Implementierungsbeispiel](#implementation-example-1)
- [Muster D – Übersetzte SVGs mit `svg.style = "flat"`](#pattern-d---translated-svg-with-svgstyle--flat)
  - [Konfiguration](#config-1)
  - [App-Referenz](#app-reference)
  - [Empfohlene Quellstruktur](#source-layout-recommendation)
  - [Implementierungsbeispiel](#implementation-example-2)
- [Muster E – Kollozierte übersetzte SVGs (Doc-System)](#pattern-e---colocated-translated-svg-doc-system)
  - [Konfiguration](#config-2)
  - [Quell-Markdown](#source-markdown)
  - [SVG-Quellpfad](#svg-source-location)
  - [`pathTemplate`-Platzhalter](#pathtemplate-placeholders)
  - [Implementierungsbeispiel](#implementation-example-3)
- [Der flache Link-Rewriter und der Zwei-Schritte-Fluss](#the-flat-link-rewriter-and-two-step-flow)
  - [Zwei-Schritte-Fluss bei `docsOutput.style = "flat"`](#two-step-flow-when-docsoutputstyle--flat)
  - [Tiefenpräfix pro Datei mit `flatPreserveRelativeDir`](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` und `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [Häufige Fehler und Problembehandlung](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## Was ai-i18n-tools mit Assets macht (und nicht macht)

`translate-docs` übersetzt Markdown/MDX-Inhalte – einschließlich alternativer Bildtexte – kopiert, generiert oder gibt aber keine Rasterdateien aus. Wenn eine übersetzte Seite einen sprachspezifischen Screenshot benötigt, müssen Sie die Datei an dem Pfad ablegen, auf den das übersetzte Markdown verweisen wird.

`translate-svg` ist der einzige Befehl, der sprachspezifische Binärdateien ausgibt. Er liest Quell-SVG-Dateien, übersetzt Textelemente (`<text>`, `<title>`, `<desc>`) und schreibt pro Sprache eine Ausgabe-SVG. Rasterdateien (PNG, JPEG, WebP, GIF) werden niemals vom Tool geschrieben.

---

<a id="design-for-i18n-from-the-start"></a>
## Gestalten Sie von Anfang an für die Internationalisierung

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

Das generische `[^/]+`-Muster passt auf jeden Sprachordner – codieren Sie nicht Ihre Quellsprache fest (z. B. `screenshots/en-GB/`), da dies fehlschlägt, falls `sourceLocale` sich jemals ändert.

Wenn Sie mit Pfaden beginnen, die das Locale-Unterverzeichnis weglassen (`images/screenshots/translate.png`), müssen Sie den gesamten Verzeichnisbaum umstrukturieren, bevor Muster B funktioniert.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### Doc-System-Websites (`docsOutput.style = "doc-system"`)

Verwenden Sie dies für statische Dokumentationsseiten, die übersetzte Seiten in einem sprachpräfixierten Verzeichnisbaum speichern – Docusaurus i18n, Astro Starlight und benutzerdefinierte Generatoren, die demselben Aufbau folgen. Dateien unter `docsRoot` werden geschrieben nach:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

Legen Sie `docs[].docsOutput.docsRoot` auf Ihren englischen Quellstamm fest (z. B. `"docs"` oder `"src/content/docs"`). Wenn Sie `style: "doc-system"` direkt setzen, müssen Sie auch `localeSubpath` auf das Pfadsegment festlegen, das Ihre Website zwischen `{locale}/` und der übersetzten Datei verwendet. Die Aliase `"docusaurus"` und `"astro-starlight"` sind voreingestellte `doc-system`-Layouts mit Standardwerten für `localeSubpath` (siehe [Ausgabe-Layouts](GETTING_STARTED.de.md#output-layouts)).

| Voreingestellter Alias | Standard-`localeSubpath` | Beispiel-Ausgabe |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (leer) | `src/content/docs/de/guide.md` |

Der flache Link-Umschreiber wird **nicht** für `doc-system` ausgeführt (im Gegensatz zu `"flat"`). `postProcessing.regexAdjustments` erhält die ursprüngliche URL aus dem Quell-Markdown – typischerweise ein absoluter Pfad oder ein Pfad ab Stammverzeichnis der Seite wie `/img/screenshots/en-GB/foo.png`.

**Muster B** gilt, wenn Screenshots in einem gemeinsamen statischen URL-Baum liegen: Verwenden Sie von Anfang an einen locale-kodierten Ordner und eine generische Regel `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` (siehe [Konfiguration – Doc-System](#config---docsoutputstyle--doc-system)).

**Muster C** gilt, wenn die Assets jeder Sprache neben dem Markdown liegen (keine URL-Umschreibung). Ihr Screenshot-Skript muss PNGs in Pfade schreiben, die sich aus `{outputDir}`, `{locale}` und `{localeSubpath}` ergeben – das untenstehende Docusaurus-Voreinstellungs-Layout ist das Referenzlayout.

<a id="docusaurus-preset"></a>
#### Docusaurus-Voreinstellung

Zwei Gewohnheiten beim Projektaufbau vermeiden später alle Regex-Brückenschläge:

1. Erstellen Sie einen symbolischen Link `documentation/docs/assets → ../static/assets`, bevor Sie Screenshots hinzufügen. Docusauruses Webpack verfolgt standardmäßig symbolische Links, wodurch Quelldokumente relative Pfade verwenden können, die auch von übersetzten Dokumenten genutzt werden.

2. Legen Sie alle Dokumentations-Assets – PNGs und SVGs – in `static/assets/` ab (ein Verzeichnis). Teilen Sie sie nicht zwischen `static/img/` (SVGs) und `static/assets/` (PNGs) auf. Ein einheitlicher Speicherort bedeutet, dass jede Dokumentationsseite, sowohl englisch als auch übersetzt, denselben relativen Pfad `../assets/name.ext` referenzieren kann.

Verweisen Sie in den Quell-Markdown-Dateien auf jedes Asset mit dem stabilen relativen Pfad `../assets/name.ext`. Verwenden Sie niemals absolute `/img/`- oder `/assets/`-URLs für Dokumentations-Assets – diese URLs unterscheiden sich zwischen der englischen Quelle (ausgeliefert von `static/`) und den übersetzten Sprachversionen (lokal mit den übersetzten Dokumenten abgelegt), was eine `regexAdjustments`-Regel erfordert, um sie zu verbinden.

Wenn Sie später i18n hinzufügen, übernimmt das Screenshot-Skript die `getScreenshotDir`-Aufteilung (siehe [Muster C](#pattern-c---colocated-raster-doc-system)) und `translate-svg` verwendet einen `pathTemplate`. Keine Regex-Anpassungen erforderlich.

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
## Entscheidungsanleitung

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| Muster | Asset-Typ                  | Website-Typ                                                                 | Tool-Mechanismus                                               |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A       | Raster (gemeinsam genutzt)             | `docsOutput.style = "flat"`-Dokumentation                                      | Link-Rewriter pro Datei; normalerweise kein Regex                     |
| B       | Raster (pro Sprache)         | `"flat"` oder `"doc-system"` (einschließlich `"docusaurus"`, `"astro-starlight"`)    | `regexAdjustments`-Sprachsegment-Austausch                       |
| C       | Raster (lokal abgelegt)          | `"doc-system"` mit lokal abgelegten Assets (Docusaurus-Voreinstellung)                  | Screenshot-Skript platziert Dateien; kein Regex                     |
| D       | SVG (übersetzt)            | Webanwendung                                                                   | `translate-svg` mit `svg.style = "flat"`                    |
| E       | SVG (übersetzt, lokal abgelegt) | `"doc-system"` mit lokal abgelegten Assets (Docusaurus-Voreinstellung)                  | `translate-svg` mit `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a---shared-raster"></a>
## Muster A – Gemeinsames Raster

Verwenden Sie dieses Muster, wenn ein einzelnes Bild in allen Sprachversionen gemeinsam genutzt wird (keine sprachspezifischen Varianten). Wenn `docsOutput.style = "flat"` verwendet wird, berechnet der flache Link-Rewriter das Tiefenpräfix pro Ausgabedatei, sodass ein Asset neben der Quelldatei (z. B. `docs/figure.png`, referenziert als `figure.png` aus `docs/page.md`) in jeder übersetzten Ausgabe korrekt aufgelöst wird – keine `postProcessing.regexAdjustments`-Regel ist erforderlich.

Beispiel: Dieses Paket übersetzt `docs/GETTING_STARTED.md` in `translated-docs/docs/GETTING_STARTED.<locale>.md`. Das zugehörige Bild `docs/translation-dashboard.png` wird als `translation-dashboard.png` referenziert. Der Umschreiber berechnet das pro-Datei-Präfix ausgehend vom Ausgabedateiverzeichnis zurück zum Quellverzeichnis (`../../docs/`) und erzeugt so `../../docs/translation-dashboard.png`. Von `translated-docs/docs/` aus wird dies korrekt zu `docs/translation-dashboard.png` aufgelöst.

Aktualisieren Sie die PNG-Datei mit [`scripts/screenshot-translation-dashboard.sh`](../../docs/../scripts/screenshot-translation-dashboard.sh), wenn sich die Dashboard-Benutzeroberfläche ändert; das Bild ist nicht je Sprachversion unterschiedlich.

Eine `postProcessing`-Regel ist weiterhin erforderlich, wenn:
- Auf das Asset über eine absolute URL verwiesen wird (z. B. `/img/figure.png`) – der Umschreiber verarbeitet nur relative Pfade
- Sie die Asset-URL aus anderen Gründen ändern möchten (z. B. Umstellung auf ein CDN)

<a id="implementation-example"></a>
### Implementierungsbeispiel

Dieses Repository verwendet Muster A für den Screenshot des Übersetzungs-Dashboards: [GETTING_STARTED.md](GETTING_STARTED.de.md#translation-dashboard) verweist auf das Bild [translation-dashboard.png](../../docs/../docs/translation-dashboard.png) im selben Ordner. [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) legt `docsOutput.style = "flat"` und `flatPreserveRelativeDir: true` fest; das pro-Datei-Tiefenpräfix löst den Bildpfad ohne Screenshot-`regexAdjustments` korrekt auf.

---

<a id="pattern-b---per-locale-folder-url-rewriting"></a>
## Muster B – Pro-Sprache-Ordner (URL-Umschreibung)

Verwenden Sie dieses Muster für README-/USER-GUIDE-Dokumente mit `docsOutput.style = "flat"` sowie für Dokumentationssysteme (`docsOutput.style = "doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"`), die Screenshots aus einem gemeinsamen statischen URL-Baum bereitstellen.

<a id="directory-layout"></a>
### Verzeichnisstruktur

<details>
<summary>Beispiel für ein sprachspezifisches Verzeichnisbaumdiagramm für Screenshots</summary>

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

Die Quell-Markdown-Datei verweist auf das Quell-Sprachverzeichnis:

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Vertrag für das Screenshot-Skript

Das `take-screenshots`-Skript muss Dateien für jede Sprache schreiben – nicht nur für die Quellsprache. Der `translate-docs`-Befehl schreibt Pfade um, erstellt aber keine Dateien. Ein übliches Muster:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

Ein einfaches Beispiel für `bash` finden Sie im [Screenshot-Skript in examples/nextjs-app](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh) oder ein komplexeres Beispiel in [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) aus dem Repository des [Transrewrt-Projekts](https://github.com/wsj-br/transrewrt).

> **Hinweis:** Die vier folgenden Unterabschnitte verwenden denselben `regexAdjustments`-Tausch des Sprachsegmentes (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`). Nur die Ausgabestruktur und die Reihenfolge, ob der flache Link-Rewriter zuerst ausgeführt wird, unterscheiden sich – wechseln Sie zum Unterabschnitt, der Ihrem `docsOutput.style` entspricht.

<a id="config---docsoutputstyle--flat"></a>
### Konfiguration – `docsOutput.style = "flat"`

Der flache Link-Rewriter wird zuerst ausgeführt, wenn `docsOutput.style = "flat"` aktiviert ist, und fügt ein Tiefenpräfix vor nicht-markdown-URLs ein. Für eine `README.md` im Stammverzeichnis des Repositorys mit `outputDir: "translated-docs/"` wird `../` hinzugefügt:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

Die `regexAdjustments`-Regel ersetzt dann das Sprachsegment innerhalb dieser bereits präfixierten URL:

<details>
<summary>Beispiel regexAdjustments für flaches Layout</summary>

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

Ergebnis: `../images/screenshots/de/translate.png` – korrekter relativer Pfad von `translated-docs/README.de.md` zurück zum Repository-Stamm.

Der `postProcessing`-Schritt erfolgt nach dem flachen Link-Umschreiber. Formulieren Sie `search`-Muster so, dass sie das Sprachsegment an beliebiger Stelle innerhalb der bereits präfixierten URL erkennen – das `../`-Präfix muss nicht im Muster enthalten sein.

Implementierungsbeispiel (Produktion): [Transrewrt](https://github.com/wsj-br/transrewrt) – Screenshot-URLs in [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`), Sprachumschreibung in [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json), Aufnahmeskript [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) (siehe den [Screenshot-Skript-Vertrag](#screenshot-script-contract) oben).

Implementierungsbeispiel (Demo-Konfiguration): [examples/nextjs-app](../../docs/../examples/nextjs-app/) – zweiter `docs[]`-Block in [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`); Hilfsskript [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### Konfiguration – `docsOutput.style = "doc-system"`

Generisches Muster B für jede Dokumentationssystem-Website, die Screenshots über ein gemeinsames statisches URL-Präfix referenziert. Der flache Link-Umschreiber wird nicht ausgeführt; `postProcessing` verändert das Sprachsegment in der ursprünglichen Markdown-URL.

<details>
<summary>Beispiel regexAdjustments für Doc-System-Layout</summary>

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

Legen Sie `localeSubpath` so fest, dass es zur Verzeichnisstruktur Ihres Generators zwischen `{locale}/` und der übersetzten Datei passt, oder verwenden Sie einen vordefinierten Alias (`"docusaurus"`, `"astro-starlight"`) anstelle von `"doc-system"`, wenn die Standardwerte passen. Im Quell-Markdown ist typischerweise die Quelllokalisierung in der URL enthalten:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

Stellen Sie passende PNG-Dateien im selben Pfad für jede Ziellokalisierung bereit (z. B. `static/img/screenshots/de/screenshot.png`). Bevorzugen Sie `screenshots/[^/]+/` gegenüber der direkten Einbindung von `screenshots/en-GB/`, damit die Regel auch nach einer Änderung von `sourceLocale` weiterhin funktioniert.

<a id="preset---docsoutputstyle--docusaurus"></a>
### Voreinstellung – `docsOutput.style = "docusaurus"`

Wie `"doc-system"`, jedoch mit Standardwert `localeSubpath = "docusaurus-plugin-content-docs/current"`. Der flache Link-Umschreiber wird nicht ausgeführt. `postProcessing` erhält die ursprüngliche Markdown-URL. Englische Seiten verwenden typischerweise einen absoluten Pfad mit der Quelllokalisierung:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Beispiel regexAdjustments für Docusaurus-Vorgabe</summary>

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

Stellen Sie passende PNG-Dateien unter `docs-site/static/img/screenshots/<locale>/screenshot.png` bereit. Für konfigurationsunabhängige Quelllokalisierungen bevorzugen Sie `screenshots/[^/]+/` gegenüber `screenshots/en-GB/`.

Implementierungsbeispiel: [examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) mit dem ersten `docs[]`-Block in [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json).

<a id="preset---docsoutputstyle--astro-starlight"></a>
### Voreinstellung – `docsOutput.style = "astro-starlight"`

Wie `"doc-system"`, jedoch mit `localeSubpath: ""` — übersetzte Seiten liegen direkt unter `{outputDir}/{locale}/`. Gleiches Prinzip wie beim generischen Dokumentationssystem oben (Muster B). Das Quell-Markdown verwendet `/img/screenshots/en-GB/screenshot.png`:

<details>
<summary>Beispiel regexAdjustments für Astro Starlight-Vorgabe</summary>

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

Stellen Sie die PNGs unter `public/img/screenshots/<locale>/screenshot.png` bereit.

Implementierungsbeispiel: [examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) und [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).

---

<a id="pattern-c---colocated-raster-doc-system"></a>
## Muster C – Lokal kollokatierte Raster (`doc-system`)

Verwenden Sie dieses Muster, wenn eine `doc-system`-Website sprachspezifische Assets neben der übersetzten Markdown-Datei ablegt – keine URL-Umschreibung ist erforderlich. Die Docusaurus-Voreinstellung (`docsOutput.style = "docusaurus"`) ist die Referenzimplementierung; andere Generatoren, die `"doc-system"` mit einem benutzerdefinierten `localeSubpath` verwenden, folgen demselben Prinzip: Englische Assets liegen im Quellsprachen-Pfad, übersetzte Assets liegen unter `{outputDir}/{locale}/[localeSubpath/]assets/`.

<a id="directory-layout-1"></a>
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
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

Für die englische Lokalisierung (`en-GB`) wird `../assets/` über den symbolischen Link zu `static/assets/` aufgelöst. Für übersetzte Lokalisierungen erfolgt die Auflösung direkt im jeweiligen `current/assets/`-Verzeichnis.

<a id="screenshot-script-contract-1"></a>
### Screenshot-Skript-Vertrag

Das Skript muss PNGs in das korrekte Verzeichnis für jede Locale schreiben. Die `getScreenshotDir`-Funktion kodiert die Aufteilung:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

Siehe die Implementierung in der Produktionsumgebung in [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) aus dem [duplistatus](https://github.com/wsj-br/duplistatus)-Repository (lokale Referenzkopie: [references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts)).

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

Wenn das Projekt auch übersetzte SVGs verwendet, behandelt Pattern E diese, und sie werden neben den PNGs in `current/assets/` abgelegt, ohne zusätzlichen Regex.

<a id="prerequisites"></a>
### Voraussetzungen

- Der `docs/assets`-Symlink muss existieren: `ln -s ../static/assets documentation/docs/assets`
- Docusaurus Webpack folgt standardmäßig Symlinks (`resolve.symlinks` ist standardmäßig auf `true` in Docusaurus-Builds gesetzt)
- Der Symlink muss nur für die Quelllocale existieren — übersetzte Builds verwenden ihn nicht

<a id="implementation-example-1"></a>
### Implementierungsbeispiel

[duplistatus](https://github.com/wsj-br/duplistatus) – `getScreenshotDir(locale)` in [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts); die englischen Dokumente verweisen auf lokal kollokatierte PNGs (z. B. [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md) mit `../assets/screen-dashboard-summary.png`); keine PNG-`regexAdjustments` in [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json). Die aus demselben Projekt stammenden Pattern-E-SVGs landen in denselben `current/assets/`-Verzeichnissen (siehe unten).

---

<a id="pattern-d---translated-svg-with-svgstyle--flat"></a>
## Muster D – Übersetzte SVG mit `svg.style = "flat"`

Verwenden Sie dies, wenn eine Web-App sprachspezifische SVG-Illustrationen oder -Diagramme einbettet und zur Laufzeit über den Locale-Code darauf verweist.

<a id="config-1"></a>
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

<a id="implementation-example-2"></a>
### Implementierungsbeispiel

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — `svg`-Block in [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); Quelle [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg); pro-locale-Ausgaben unter [public/assets/](../../docs/../examples/nextjs-app/public/assets/) (z. B. `translation_demo_svg.de.svg`); Laufzeit-URL in [page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
## Muster E - Lokalisierte SVG-Dateien am selben Ort (doc-system)

Verwenden Sie dies für Dokumentationssysteme, bei denen übersetzte SVG-Illustrationen neben den übersetzten Dokumenten im Inhaltsverzeichnis jeder Locale erscheinen müssen — am selben Ort wie die Raster-Screenshots nach Pattern C. Das Docusaurus-Preset ist das primäre Beispiel.

<a id="config-2"></a>
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

`translate-svg` schreibt pro Sprachvariante eine SVG-Datei in dasselbe `current/assets/`-Verzeichnis, das Pattern C für PNGs verwendet:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Quell-Markdown

Alle Dokumente in allen Sprachvarianten verwenden denselben relativen Pfad:

```markdown
![Diagram](../../docs/../assets/diagram.svg)
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

Vollständige Referenz in der [SVG-Konfigurationstabelle](GETTING_STARTED.de.md#svg).

<a id="implementation-example-3"></a>
### Implementierungsbeispiel

[duplistatus](https://github.com/wsj-br/duplistatus) — geschachtelter `svg`-Block mit `pathTemplate` in [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json); Quell-SVGs aufgelistet unter `documentation/static/img/` (z. B. [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg` schreibt sprachspezifische Dateien nach `documentation/i18n/<locale>/…/current/assets/` neben die Pattern-C-PNGs; Dokumente binden sie derzeit über `/img/duplistatus_*.svg` ein (z. B. [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)). Siehe [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md) für die geplante Umstellung auf `../assets/`-Pfade und die Entfernung der SVG-`regexAdjustments`-Brücke.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## Der flache Link-Rewriter und der zweistufige Ablauf

Für `docsOutput.style = "flat"` (und sofern nicht `rewriteRelativeLinks: false` oder ein benutzerdefiniertes `pathTemplate` festgelegt ist) wird ein integrierter Umschreiber vor `postProcessing` ausgeführt. Dieser verarbeitet Querverweise zwischen Dokumenten (durch Hinzufügen von Gebietsschemakürzeln) und fügt einen Tiefenpräfix zu URLs von Nicht-Markdown-Ressourcen hinzu.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### Zweistufiger Ablauf bei `docsOutput.style = "flat"`

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

Beispiel mit `outputDir: "translated-docs/"` und Quelldatei `README.md` im Stammverzeichnis des Repos:

1. Flacher Link-Rewriter: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (ein `../` für `translated-docs/`)
2. `postProcessing`-Regex `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

Bei `docsOutput.style = "doc-system"` (einschließlich `"docusaurus"`, `"astro-starlight"` und `"nested"`) wird der flache Link-Umschreiber nicht ausgeführt. `postProcessing` erhält die ursprüngliche URL aus dem übersetzten Markdown (typischerweise ein absoluter Pfad wie `/img/screenshots/en-GB/foo.png`).

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### Tiefenpräfix pro Datei mit `flatPreserveRelativeDir`

Der Tiefenpräfix wird pro Ausgabedatei berechnet – nicht global für den gesamten Stapel. Für jede Quelldatei ermittelt der Rewriter den relativen Pfad vom Verzeichnis der Ausgabedatei zurück zum Verzeichnis der Quelldatei und verwendet diesen als Präfix.

Das bedeutet, dass bei Verwendung von `flatPreserveRelativeDir: true` Quelldateien in Unterverzeichnissen automatisch das korrekte Präfix erhalten. Zum Beispiel erzeugt `docs/GETTING_STARTED.md` die Ausgabe in `translated-docs/docs/GETTING_STARTED.<locale>.md`. Das pro-Datei-Präfix ist `../../docs/`, sodass ein Asset `translation-dashboard.png` (relativ zur Quelle) zu `../../docs/translation-dashboard.png` wird – was korrekt von `translated-docs/docs/` zurück zu `docs/translation-dashboard.png` aufgelöst wird.

Für relative Pfade zu Ressourcen neben Quelldateien ist keine `postProcessing`-Regex-Korrektur erforderlich.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` und `linkRewriteDocsRoot`

| Option                                   | Wirkung                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | Aktiviert oder deaktiviert den flachen Link-Umschreiber explizit (überschreibt den Standardwert bei `docsOutput.style = "flat"`) |
| `docsOutput.linkRewriteDocsRoot`     | Stammverzeichnis, relativ zu dem `depthPrefix` berechnet wird (Standard: `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | Beeinflusst die Struktur des Ausgabepfads, die der Umschreiber bei der Berechnung der Zielwege für bekannte übersetzte Dateien verwendet       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
## Häufige Fehler und Problembehandlung

**Kein Gebietsschemapfad in Screenshot-Pfaden**
`images/screenshots/screenshot.png` — kann keine Gebietsschema-Varianten unterscheiden und kann nicht umgeschrieben werden. Umstrukturieren Sie zu `images/screenshots/<locale>/screenshot.png`, bevor Sie Muster B anwenden.

**Im Regex hartkodiertes Quell-Gebietsschema**
`"search": "screenshots/en-GB/"` — bricht stillschweigend, wenn sich `sourceLocale` ändert. Verwenden Sie stattdessen `"search": "screenshots/[^/]+/"`.

**SVG-Quellen und -Ausgaben im selben Verzeichnis**
Wenn sich `svg.sourcePath` und `svg.outputDir` überlappen, liegen generierte Dateien zusammen mit manuell bearbeiteten Quellen. Halten Sie sie in separaten Verzeichnissen.

**Absolute Docusaurus-Static-URLs für lokalisierte SVGs**
`/img/diagram.svg` (aus `static/img/`) erfordert eine `regexAdjustments`-Regel, um in der übersetzten Ausgabe nach `../assets/` umgeschrieben zu werden. Legen Sie die SVG-Quellen in `static/assets/` ab und verwenden Sie von Anfang an relative `../assets/diagram.svg`, um dies vollständig zu vermeiden.

**Fehlender `docs/assets`-Symlink in Docusaurus**
Ohne den Symlink können Quelldokumente in `docs/user-guide/` nicht per relativem Pfad auf PNGs oder SVGs in `static/assets/` verweisen. Richten Sie den Symlink bei der Projekterstellung ein: `ln -s ../static/assets documentation/docs/assets`.

**`take-screenshots`-Skript erfasst nur das Quellgebietsschema**
Muster B erfordert PNG-Dateien für jedes Gebietsschema. Wenn das Skript nur `en-GB` erfasst, enthalten die übersetzten Dokumente umgeschriebene Pfade, die auf fehlende Dateien verweisen.
