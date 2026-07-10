<a id="svg-translation"></a>
# SVG-Übersetzung

Entwickelt für **SVG-Illustrationen und -Diagramme**, die menschenlesbare Beschriftungen enthalten. Der Befehl `translate-svg` liest Quell-`.svg`-Dateien, extrahiert Text aus `<text>`-, `<title>`- und `<desc>`-Elementen, übersetzt diese Zeichenfolgen über den aktiven LLM-Anbieter und schreibt **eine Ausgabe-SVG pro Zielsprache**.

Dies ist die einzige Pipeline, die sprachspezifische **binäre** SVG-Dateien ausgibt. `translate-docs` übersetzt Markdown-Alt-Text und Link-Referenzen, ändert oder kopiert jedoch keine SVG-Assets. Wenn eine Seite ein Diagramm mit übersetzten Beschriftungen benötigt, aktivieren Sie `features.translateSVG` und konfigurieren Sie den übergeordneten `svg`-Block.

<a id="per-locale-model-overrides"></a>
### Modellüberschreibungen pro Gebietsschema

`translate-svg` löst Modelle **pro Ziellokale** auf: zuerst `localeModels(locale)`, wenn konfiguriert, dann `translationModels`. Jeder SVG-Lauf eines Gebietsschemas verwendet seine eigene Fallback-Kette – nützlich, wenn Diagrammbeschriftungen in CJK-Gebietsschemas ein skriptoptimiertes Modell benötigen (z. B. `ja`). Siehe [Anbieter und Modelle](/de/guide/providers-and-models#model-fallback-chain).

Die SVG-Übersetzung verwendet denselben SQLite-Cache wie `translate-docs` und `translate-json` (`cacheDir`). Bereits übersetzte Textsegmente werden aus dem Cache bereitgestellt; nur neuer oder geänderter Quelltext wird an das LLM gesendet.

<a id="when-to-use-svg-translation"></a>
### Wann SVG-Übersetzung verwendet werden sollte

Verwenden Sie `translate-svg`, wenn:

- Eine SVG sichtbare Beschriftungen, Titel oder Beschreibungen enthält, die sich je nach Gebietsschema ändern müssen.
- Eine Web-App zur Laufzeit gebietsschemaspezifische Diagrammdateien lädt (z. B. `dashboard.de.svg`).
- Eine Dokumentationssystem-Site (Docusaurus, Astro Starlight, VitePress) übersetzte SVGs neben übersetztem Markdown platziert.

Verwenden Sie `translate-svg` **nicht** für:

- Dekorative SVGs ohne übersetzbaren Text (Symbole, Logos, Hintergründe).
- Raster-Screenshots (PNG, JPEG, WebP) – diese werden über [Bilder und Screenshots](/de/guide/images-and-screenshots/) verarbeitet.
- Text, der in Pfaddaten statt in `<text>`-Elemente eingebettet ist – der Extraktor kann Pfadkonturen nicht lesen.

<a id="design-for-i18n-from-the-start"></a>
### Von Anfang an für i18n entwerfen

SVGs lassen sich am einfachsten übersetzen, wenn Beschriftungen von Anfang an echte Textelemente sind:

- Platzieren Sie menschenlesbaren Text in `<text>`, `<title>` und `<desc>`.
- Vermeiden Sie es, Beschriftungen in Ihrem Design-Tool in Pfade umzuwandeln – Pfaddaten sind für den Übersetzer undurchsichtig.
- Bewahren Sie **Quell-SVGs** in einem dedizierten Verzeichnis getrennt von `svg.outputDir` auf. Das Mischen von Quellen und generierten Gebietsschema-Dateien macht es unmöglich zu erkennen, welche Dateien sicher bearbeitet oder neu generiert werden können.

Für Web-Apps aktivieren Sie `forceLowercase: true`, wenn Ihr Design ausschließlich Kleinbuchstaben für Beschriftungen verwendet – dies vermeidet Probleme mit der Groß-/Kleinschreibung über Dateisysteme und CDNs hinweg.

<a id="output-layouts"></a>
### Ausgabe-Layouts

`translate-svg` unterstützt zwei gängige Ausgabeformen. Wählen Sie basierend darauf, wie Ihre App oder Dokumentationsseite SVG-Dateien zur Laufzeit referenziert.

| Layout | `svg.style` | Am besten für | Unteranleitung |
|--------|-------------|----------|-------------|
| **Flat (Web-App)** | `"flat"` | Next.js, Vite und andere Apps, die SVGs nach gebietsschemacodiertem Dateinamen einbetten | [Web-App (flaches SVG)](/de/guide/svg-translation/translated-svg-web-app) |
| **Colocated (Dokumentationssystem)** | `"nested"` + `pathTemplate` | Docusaurus und andere Dokumentationssystem-Sites, bei denen übersetzte Assets neben übersetzten Seiten liegen | [Colocated SVG](/de/guide/svg-translation/translated-svg-colocated) |

Das **flache Layout** schreibt Dateien wie `public/assets/diagram.de.svg` neben `diagram.en-GB.svg`. Ihre App referenziert sie mit einem Gebietsschema-Suffix:

```tsx
<img src={`/assets/diagram.${locale}.svg`} alt="Architecture diagram" />
```

Das **Colocated-Layout** schreibt die SVG jedes Gebietsschemas in den Inhaltsbaum dieses Gebietsschemas (z. B. `i18n/de/.../assets/diagram.svg`). Quell- und übersetztes Markdown verwenden denselben relativen Pfad (`../assets/diagram.svg`) – es ist keine `regexAdjustments`-Regel erforderlich.

Siehe den [Entscheidungsleitfaden für Bilder und Screenshots](/de/guide/images-and-screenshots/#decision-guide), um zu erfahren, wie SVG-Layouts zu Raster-Screenshot-Strategien passen.

<a id="step-1-enable-and-configure"></a>
### Schritt 1: Aktivieren und konfigurieren

Aktivieren Sie die Funktion und weisen Sie `translate-svg` auf Ihre Quelldateien und das Ausgabestammverzeichnis hin:

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

Wichtige `svg`-Felder:

- `sourcePath` – ein oder mehrere Verzeichnisse oder Glob-Muster (z. B. `"images/*.svg"`, `"**/icons/*.svg"`). Rekursiv vom Projekt-Root aus gescannt.
- `outputDir` – Root-Verzeichnis für die übersetzte SVG-Ausgabe.
- `style` – `"flat"` oder `"nested"`, wenn Sie kein benutzerdefiniertes `pathTemplate` verwenden.
- `pathTemplate` – optionaler benutzerdefinierter Ausgabepfad mit Platzhaltern `{outputDir}`, `{locale}`, `{llocale}`, `{basename}`, `{stem}` und anderen (erforderlich für kollokierte Doc-System-Layouts).
- `forceLowercase` – übersetzter Text in Kleinbuchstaben bei der Wiederzusammenstellung.

Vollständige Feldreferenz: [Konfiguration – `svg`](/de/reference/configuration#svg).

<a id="step-2-translate"></a>
### Schritt 2: Übersetzen

```bash
npx ai-i18n-tools translate-svg
```

Eine einzelne Locale übersetzen:

```bash
npx ai-i18n-tools translate-svg --locale de
```

Vorschau ohne Schreiben von Dateien:

```bash
npx ai-i18n-tools translate-svg --dry-run
```

`sync` führt den SVG-Schritt automatisch aus, wenn `features.translateSVG` und `svg` beide gesetzt sind (mit `--no-svg` überspringen). Gemeinsame Flags sind `-l` / `--locale`, `-p` / `--path`, `-j` / `--concurrency` und `--force` / `--force-update`.

<a id="troubleshooting"></a>
### Problembehandlung

Häufige SVG-Probleme – gemischte Quell-/Ausgabeverzeichnisse, absolute statische URLs auf Docusaurus und Fehler im Pfadlayout – werden unter [SVG-Fehlerbehebung](/de/guide/svg-translation/troubleshooting) behandelt. Für Raster-Assets und Link-Rewriting siehe [Fehlerbehebung bei Bildern und Screenshots](/de/guide/images-and-screenshots/troubleshooting).
