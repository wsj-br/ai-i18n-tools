<a id="documents"></a>
# Dokumente

Primär für **Markdown-, MDX- und `.astro`-Dokumentation** konzipiert, die über `docs[]`-Konfigurationsblöcke verwaltet wird. Das Feld `contentPaths` jedes Blocks listet die zu übersetzenden Dateien oder Ordner auf.

Setzen Sie auf Docusaurus-Sites auch `docusaurusCatalogDir` auf Ihren `write-translations`-Katalogordner (z. B. `docs-site/i18n/en`). Dann enthält `translate-docs` auch Shell-JSON – Navigationsleiste, Fußzeile und Theme-Strings.

Auf [VitePress](/guide/vitepress-integration)-Sites verwenden Seiteninhalte dieselbe `docs[]`-Pipeline. Navigations-, Seitenleisten- und Fußzeilenbeschriftungen befinden sich in einem separaten JSON-Katalog – übersetzen Sie diese mit der [JSON](/guide/json)-Pipeline und `translate-json`.

Für PNG und andere Rasterbilder, die in Markdown eingebettet sind, siehe [Bilder & Screenshots](/guide/images-and-screenshots/). `translate-docs` übersetzt nur den Alternativtext; es kopiert keine Rasterdateien.

Für einen optionalen **Sprachumschalter**-Block in README oder Docs setzen Sie `docsOutput.style` auf `"flat"` – siehe [Sprachumschalter](/guide/documents/language-switcher).

SVG-Dateien werden über [`translate-svg`](/reference/cli-commands) übersetzt, wenn `features.translateSVG` aktiviert ist – nicht über `docs[]` / `contentPaths`.

Beliebig verschachtelte UI-JSON-Bundles (keine Docusaurus-Kataloge) gehören in die [JSON](/guide/json)-Pipeline, nicht in `docs[]`.

<a id="which-guide-to-read"></a>
## Welchen Leitfaden Sie lesen sollten

| Ihr Setup | Beginnen Sie hier |
| --- | --- |
| Docusaurus-Site | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` – [Schritt 1](#step-1-initialise-for-documentation) |
| VitePress-Site | `init -t ui-vitepress` + `json[]` für das Theme – [VitePress-Integration](/guide/vitepress-integration) |
| Astro Starlight | `init -t ui-starlight` – [Schritt 1](#step-1-initialise-for-documentation) |
| Flat-Dokumente (README, Changelogs usw.) | `docsOutput.style = "flat"` – [Ausgabelayouts](/guide/documents/output-layouts), optionaler [Sprachumschalter](/guide/documents/language-switcher) |
| Wo übersetzte Dateien landen | [Ausgabe-Layouts](/guide/documents/output-layouts) |
| Seitenübergreifende `#anchor`-Links | [Anker-Links](/guide/documents/anchor-links) |
| Umschreiben von Link- und Asset-URLs (`regexAdjustments`) | [Link-Umschreibung](/guide/documents/link-rewriting) |
| Screenshots in Docs | [Bilder & Screenshots](/guide/images-and-screenshots/) |
| `translate-docs`-Flags und Cache | [CLI-Optionen](/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Schritt 1: Initialisierung für die Dokumentation

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Für Astro Starlight-Dokumentationsseiten:

```bash
npx ai-i18n-tools init -t ui-starlight
```

Für VitePress-Dokumentationsseiten:

```bash
npx ai-i18n-tools init -t ui-vitepress
```

Aktivieren Sie `features.translateJson` und fügen Sie einen `json[]`-Eintrag für VitePress-Theme-Strings hinzu – siehe [VitePress-Integration](/guide/vitepress-integration).

Für einfache Astro-Website-Oberflächen (ohne Starlight):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

Diese Vorlage ermöglicht nur die UI-Extraktion. Für die Übersetzung von Seiten-HTML setzen Sie auch `features.translateDocs` und fügen Sie einen `docs[]`-Block hinzu (siehe [Astro-Website-Seiten (Parsen und Ersetzen)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). Die [`examples/astro-website`]-Konfiguration (https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) zeigt beide Pipelines zusammen.

Bearbeiten Sie die generierte `ai-i18n-tools.config.json`:

- `sourceLocale` – Ausgangssprache (muss mit `defaultLocale` in `docusaurus.config.js` übereinstimmen).
- `targetLocales` – Array mit BCP-47-Sprachcodes (z. B. `["de", "fr", "es"]`).
- `cacheDir` – gemeinsames SQLite-Cache-Verzeichnis für alle Pipelines (und standardmäßiges Protokollverzeichnis für `--write-logs`).
- `docs` – Array mit Dokumentationsblöcken. Jeder Block hat optional `description`, `contentPaths` (Zeichenkette oder Array; Datei, Verzeichnis oder Glob), `outputDir`, optional `docusaurusCatalogDir`, `docsOutput`, optional `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter` usw.
- `docs[].description` – optionale kurze Notiz für Maintainer. Wenn gesetzt, erscheint sie in der `translate-docs`-Überschrift und in den `status`-Abschnittsüberschriften.
- `docs[].contentPaths` – Markdown-/MDX-/`.astro`-Quellen (und optional `docusaurusCatalogDir` für Docusaurus-Shell-JSON).
- `docs[].outputDir` – übersetztes Ausgabestammverzeichnis für diesen Block.
- `docs[].docsOutput.style` – `"nested"` (Standard), `"flat"`, `"doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"` / `"vitepress"` (siehe [Ausgabe-Layouts](/guide/documents/output-layouts)).

**Primär vs. ergänzend:** Konzentrieren Sie sich auf `contentPaths` für lokalisierte Seiten. Legen Sie `docusaurusCatalogDir` fest, wenn Sie zusätzlich Docusaurus-Shell-JSON aus `write-translations` benötigen. Lassen Sie `docusaurusCatalogDir` weg, wenn Sie nur Seiten übersetzen.

<a id="step-2-translate-documents"></a>
## Schritt 2: Dokumente übersetzen

```bash
npx ai-i18n-tools translate-docs
```

Dies übersetzt alle Dateien in jedem `docs[]`-Block `contentPaths` (und Docusaurus-Katalog-JSON, wenn `docusaurusCatalogDir` gesetzt ist) in alle effektiven Dokumentations-Locales. Bereits übersetzte Segmente werden aus dem SQLite-Cache bereitgestellt – nur neue oder geänderte Segmente werden an das LLM gesendet.

So übersetzen Sie eine einzelne Lokalisierung:

```bash
npx ai-i18n-tools translate-docs --locale de
```

So prüfen Sie, was übersetzt werden muss:

```bash
npx ai-i18n-tools status
```

Informationen zu Flags, Cache-Verhalten und Batch-Prompt-Format finden Sie unter [CLI-Optionen](/guide/documents/cli-options).

<a id="complex-markdown-and-failed-quality-checks"></a>
## Komplexes Markdown und fehlgeschlagene Qualitätsprüfungen

`translate-docs` prüft, ob jede übersetzte Segment die Markdown-Struktur beibehält (einschließlich Hervorhebungen, die aus dem Dokument geparst wurden). Absätze, die viele `bold`-Spanne um `` `inline code` `` stapeln, Backticks innerhalb von Fett schachteln (z. B. Template-Literale wie `` `fetch(\`/locales/${code}.json\`)` ``) oder Fett und Code in einem langen Satz verweben, sind empfindlich: Einige Sprachgebiete benötigen eine andere Wortreihenfolge, wodurch sich die Ausrichtung von `**` und `` ` `` nach der Übersetzung ändern kann und CLI-Fehler wie `AST mismatch` ausgelöst werden.

**Wenn Sie auf diese Art von Validierungsfehler stoßen, sollten Sie es vorziehen, den Quelltext zu vereinfachen** – teilen Sie den Absatz auf, verschieben Sie ein Beispiel in einen umzäunten Codeblock oder beschreiben Sie dieselbe Idee mit weniger geschichteten Fett-/Code-Paaren –, anstatt zu erwarten, dass jedes Modell und jede Locale dichte Inline-Markups perfekt reproduziert.

Wenn jedes konfigurierte Modell mit einem `AST mismatch` beim selben Segment fehlschlägt, kann `translate-docs` dieses Segment automatisch in kleinere Teile aufteilen (zuerst die Mitte der Liste, dann einzelne Listenelemente oder kürzere Absatzabschnitte), jeden Teil erneut vom ersten Modell verarbeiten lassen und das Ergebnis unter dem ursprünglichen Segment-Cache-Schlüssel wieder zusammenfügen. Dies ist standardmäßig aktiviert (`segmentSplitting.qualityRetrySplit`); setzen Sie es auf `false`, um nach Erschöpfung aller Modelle abzubrechen. Die Laufzusammenfassung meldet `Quality split retries`, wenn dieser Fallback greift.

Um zu sehen, **welche Segmente fehlgeschlagen sind**, wie oft und die gespeicherten **Qualitäts-/Fehlermeldungen**, verwenden Sie die Registerkarte **Fehler** des Übersetzungs-Dashboards ([Übersetzungs-Dashboard → Fehler](/guide/translation-dashboard/failures#failures-document-translation)).
