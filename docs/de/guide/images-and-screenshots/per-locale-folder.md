<a id="per-locale-folder-url-rewriting"></a>
# Ordner pro Gebietsschema (URL-Umschreibung)

Wird für README/USER-GUIDE mit `docsOutput.style = "flat"` und für Doc-System-Sites (`docsOutput.style = "doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"`) sowie für `"vitepress"` / andere Doc-System-Voreinstellungen verwendet, die Screenshots von einer gemeinsam genutzten statischen URL-Struktur bereitstellen. Details zur Link-Umschreibung für VitePress: [Link rewriting — VitePress](/de/guide/images-and-screenshots/link-rewriting#vitepress-link-normalizer-style-vitepress).

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
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Vertrag für das Screenshot-Skript

Das `take-screenshots`-Skript muss Dateien für jedes Gebietsschema schreiben – nicht nur für das Quellgebietsschema. Der Befehl `translate-docs` schreibt Pfade neu, erstellt aber keine Dateien. Ein typischer Helfer:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

Siehe ein einfaches `bash`-Beispiel im [Screenshot-Skript in examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh) oder ein komplexeres Beispiel in [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) aus dem Projekt [duplistatus](https://github.com/wsj-br/duplistatus) (wird auch in der Produktion von [Transrewrt](https://github.com/wsj-br/transrewrt) verwendet).

> **Hinweis:** Die vier Unterabschnitte unten teilen sich denselben `regexAdjustments`-Gebietsschema-Segment-Austausch (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`). Nur das Ausgabelayout und ob der Flat-Link-Rewriter zuerst ausgeführt wird, unterscheiden sich – springen Sie zu dem Unterabschnitt, der Ihrem `docsOutput.style` entspricht.
>
> **Hinweis:** `regexAdjustments` wird auf den gesamten übersetzten Markdown-Text angewendet, einschließlich umgrenzter Codeblöcke. Wenn eine Dokumentationsseite ein Konfigurationsbeispiel einbettet, das einen übereinstimmenden Pfad enthält (z. B. `screenshots/en-GB/`), wird dieser Schnipsel auch in der übersetzten Ausgabe umgeschrieben. Bevorzugen Sie die generische Form `screenshots/[^/]+/` in wiederverwendbaren Beispielen.

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

Der `postProcessing`-Schritt wird nach dem Flat-Link-Rewriter ausgeführt. Schreiben Sie `search`-Regexe, die das Gebietsschema-Segment überall innerhalb der bereits präfixierten URL abgleichen – es ist nicht erforderlich, das `../`-Präfix in den Regex aufzunehmen.

Implementierungsbeispiel (Produktion): [Transrewrt](https://github.com/wsj-br/transrewrt) – Screenshot-URLs in [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`), Gebietsschema-Umschreibung in [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json), Erfassungsskript basierend auf [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) von duplistatus (siehe den [Screenshot-Skript-Vertrag](#screenshot-script-contract) oben).

Implementierungsbeispiel (Demo-Konfiguration): [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) – zweiter `docs[]`-Block in [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`); Hilfsskript [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### Konfiguration – `docsOutput.style = "doc-system"`

Gleicher Ordneransatz pro Gebietsschema für jede Dokumentationssystem-Site, die Screenshots über ein gemeinsam genutztes statisches URL-Präfix referenziert. Der Flat-Link-Rewriter wird nicht ausgeführt; `postProcessing` schreibt das Gebietsschema-Segment in der ursprünglichen Markdown-URL neu.

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
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

Stellen Sie passende PNG-Dateien im selben Pfad für jede Ziellokalisierung bereit (z. B. `static/img/screenshots/de/screenshot.png`). Bevorzugen Sie `screenshots/[^/]+/` gegenüber der direkten Einbindung von `screenshots/en-GB/`, damit die Regel auch nach einer Änderung von `sourceLocale` weiterhin funktioniert.

<a id="preset---docsoutputstyle--docusaurus"></a>
### Voreinstellung – `docsOutput.style = "docusaurus"`

Wie `"doc-system"`, jedoch mit Standardwert `localeSubpath = "docusaurus-plugin-content-docs/current"`. Der flache Link-Umschreiber wird nicht ausgeführt. `postProcessing` erhält die ursprüngliche Markdown-URL. Englische Seiten verwenden typischerweise einen absoluten Pfad mit der Quelllokalisierung:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
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

Implementierungsbeispiel: [examples/docusaurus-docs/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) mit [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json).

<a id="preset---docsoutputstyle--astro-starlight"></a>
### Voreinstellung – `docsOutput.style = "astro-starlight"`

Gleich wie `"doc-system"` mit `localeSubpath: ""` – übersetzte Seiten befinden sich direkt unter `{outputDir}/{locale}/`. Gleicher Ordneransatz pro Gebietsschema wie die generische Dokumentationssystem-Konfiguration oben. Quell-Markdown verwendet `/img/screenshots/en-GB/screenshot.png`:

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

Liefern Sie PNGs unter `public/img/screenshots/<locale>/screenshot.png`. Der Platzhalter `${translatedLocale}` verwendet Ihre Konfigurations-Gebietsschema-Zeichenfolge (z. B. `pt-BR`). Die Voreinstellung `astro-starlight` wandelt Gebietsschema-**Ausgabepfade** standardmäßig in Kleinbuchstaben um (`pt-br/`), aber statische Asset-Ordner unter `public/img/screenshots/` sollten dem Gebietsschema-Segment entsprechen, das in Markdown-URLs geschrieben wird – halten Sie Screenshot-Verzeichnisse mit `${translatedLocale}` ausgerichtet, nicht unbedingt mit der Astro-Routen-Groß-/Kleinschreibung.

Implementierungsbeispiel: [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) – [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) und [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).
