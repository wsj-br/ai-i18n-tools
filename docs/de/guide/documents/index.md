<a id="documents"></a>
# Dokumente

Primär für **Markdown-, MDX- und `.astro`-Dokumentation** konzipiert, die über `docs[]`-Konfigurationsblöcke verwaltet wird. Das Feld `contentPaths` jedes Blocks listet die zu übersetzenden Dateien oder Ordner auf.

Setzen Sie auf Docusaurus-Sites auch `docusaurusCatalogDir` auf Ihren `write-translations`-Katalogordner (z. B. `docs-site/i18n/en`). Dann enthält `translate-docs` auch Shell-JSON – Navigationsleiste, Fußzeile und Theme-Strings.

Auf [VitePress](/de/guide/integrations/vitepress)-Sites verwenden Seitenkörper dieselbe `docs[]`-Pipeline. Navigations-, Seitenleisten- und Fußzeilenbeschriftungen befinden sich in `docsOutput.vitepressThemeCatalog` – `translate-docs` startet den englischen Katalog und übersetzt ihn zusammen mit den Seiten, ohne separate Pipeline.

Auf [Nextra](/de/guide/integrations/nextra)-Sites verwenden Seitenkörper dieselbe `docs[]`-Pipeline mit `docsOutput.style: "nextra"`. `_meta.ts`-Seitenleistenbeschriftungen werden automatisch von `translate-docs` gesammelt und übersetzt; Theme-Wörterbuchzeichenfolgen werden über `docs[].nextraDictionaryPath` in derselben Pipeline übersetzt.

Auf [Fumadocs](/de/guide/integrations/fumadocs)-Sites verwenden Seitenkörper `docsOutput.style: "fumadocs"` mit `fumadocsParser` `"dot"` (Standard) oder `"dir"`. `meta.json`-Seitenleistenbeschriftungen werden automatisch gesammelt; UI-Überschreibungen werden über `docsOutput.fumadocsUiCatalog` übersetzt.

Für PNG und andere Rasterbilder, die in Markdown eingebettet sind, siehe [Bilder & Screenshots](/de/guide/images-and-screenshots/). `translate-docs` übersetzt nur den Alternativtext; es kopiert keine Rasterdateien.

Für einen optionalen **Sprachumschalter**-Block in README oder Docs setzen Sie `docsOutput.style` auf `"flat"` – siehe [Sprachumschalter](/de/guide/documents/language-switcher).

SVG-Dateien werden über [`translate-svg`](/de/reference/cli-commands/content#translate-svg) übersetzt, wenn `features.translateSVG` aktiviert ist – nicht über `docs[]` / `contentPaths`.

Beliebige verschachtelte UI-JSON-Bundles, die nicht mit den Shell-/Theme-Strings eines Dokumentations-Frameworks zusammenhängen, gehören in die [JSON](/de/guide/json)-Pipeline, nicht in `docs[]`.

<a id="per-locale-model-overrides"></a>
### Modellüberschreibungen pro Gebietsschema

`translate-docs` und der Docs-Schritt von `sync` lösen Modelle **pro Zielgebietsschema** auf: zuerst `localeModels(locale)`, wenn konfiguriert, dann die globale `translationModels`-Kette des Anbieters. Verwenden Sie dies, wenn eine bestimmte Sprache ein anderes Modell als Ihre Standard-Fallback-Liste benötigt – zum Beispiel, wenn Sie Gemini für die `pt-BR`-Dokumentation bevorzugen, wenn die globale Kette Schwierigkeiten mit Portugiesisch hat. Siehe [Anbieter und Modelle](/de/guide/providers-and-models#model-fallback-chain) und [Konfiguration — `localeModels`](/de/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Welchen Leitfaden Sie lesen sollten

| Ihr Setup | Beginnen Sie hier |
| --- | --- |
| Docusaurus-Site | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` – [Schritt 1](#step-1-initialise-for-documentation) |
| VitePress-Site | `init -t ui-vitepress` + `vitepressThemeCatalog` für Theme — [VitePress-Integration](/de/guide/integrations/vitepress) |
| Nextra-Site | `init -t ui-nextra` + `nextraDictionaryPath` für Wörterbuch (Seitenleiste `_meta.ts` ist automatisch) — [Nextra-Integration](/de/guide/integrations/nextra) |
| Fumadocs-Site | `init -t ui-fumadocs` + `fumadocsUiCatalog` für UI (Seitenleiste `meta.json` ist automatisch) — [Fumadocs-Integration](/de/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` – [Schritt 1](#step-1-initialise-for-documentation) |
| Flat-Dokumente (README, Changelogs usw.) | `docsOutput.style = "flat"` – [Ausgabelayouts](/de/guide/documents/output-layouts), optionaler [Sprachumschalter](/de/guide/documents/language-switcher) |
| Wo übersetzte Dateien landen | [Ausgabe-Layouts](/de/guide/documents/output-layouts) |
| Seitenübergreifende `#anchor`-Links | [Anker-Links](/de/guide/documents/anchor-links) |
| Umschreiben von Link- und Asset-URLs (`regexAdjustments`) | [Link-Umschreibung](/de/guide/documents/link-rewriting) |
| Screenshots in Docs | [Bilder & Screenshots](/de/guide/images-and-screenshots/) |
| `translate-docs`-Flags und Cache | [CLI-Optionen](/de/guide/documents/cli-options) |

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

Legen Sie `docsOutput.vitepressThemeCatalog` für Navigations-/Seitenleisten-/Fußzeilenzeichenfolgen fest – siehe [VitePress-Integration](/de/guide/integrations/vitepress).

Für Nextra-Dokumentationsseiten:

```bash
npx ai-i18n-tools init -t ui-nextra
```

Legen Sie `docs[].nextraDictionaryPath` für Theme-Wörterbuchzeichenfolgen fest – siehe [Nextra-Integration](/de/guide/integrations/nextra). Seitenleisten-`_meta.ts`-Beschriftungen werden automatisch gesammelt.

Für Fumadocs-Dokumentationsseiten:

```bash
npx ai-i18n-tools init -t ui-fumadocs
```

Legen Sie `docsOutput.fumadocsUiCatalog` für UI-Überschreibungen fest – siehe [Fumadocs-Integration](/de/guide/integrations/fumadocs). Seitenleisten-`meta.json`-Beschriftungen werden automatisch gesammelt.

Für einfache Astro-Website-Oberflächen (ohne Starlight):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

Diese Vorlage ermöglicht nur die UI-Extraktion. Für die Übersetzung von Seiten-HTML setzen Sie auch `features.translateDocs` und fügen Sie einen `docs[]`-Block hinzu (siehe [Astro-Website-Seiten (Parsen und Ersetzen)](/de/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). Die [`examples/astro-website`]-Konfiguration (https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) zeigt beide Pipelines zusammen.

Bearbeiten Sie die generierte `ai-i18n-tools.config.json`:

- `provider` und `providers` – `init` gerüstet OpenRouter standardmäßig; konfigurieren Sie mindestens einen Anbieter und legen Sie dessen API-Schlüssel fest, bevor Sie `translate-docs` oder `sync` verwenden (Ollama benötigt keinen Schlüssel). Siehe [Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key) und [LLM-Anbieter und -Modelle](/de/guide/providers-and-models).
- `sourceLocale` – Quellsprache (muss mit `defaultLocale` in `docusaurus.config.js` übereinstimmen).
- `targetLocales` – Array von BCP-47-Gebietsschema-Codes (z. B. `["de", "fr", "es"]`).
- `cacheDir` – Gemeinsames SQLite-Cache-Verzeichnis für alle Pipelines (und Standard-Log-Verzeichnis für `--write-logs`).
- `docs` – Array von Dokumentationsblöcken. Jeder Block hat optionale `description`, `contentPaths` (String oder Array; Datei, Verzeichnis oder Glob), `outputDir`, optional `docusaurusCatalogDir`, `docsOutput`, optional `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter` usw.
- `docs[].description` – Optionale kurze Notiz für Wartungspersonal. Wenn festgelegt, erscheint sie in der Überschrift `translate-docs` und in den Abschnittsüberschriften `status`.
- `docs[].contentPaths` – Markdown/MDX/`.astro`-Quellen (und optional `docusaurusCatalogDir` für Docusaurus-Shell-JSON).
- `docs[].outputDir` – Übersetztes Ausgabe-Root für diesen Block.
- `docs[].docsOutput.style` – `"nested"` (Standard), `"flat"`, `"doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (siehe [Ausgabe-Layouts](/de/guide/documents/output-layouts)).

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

Informationen zu Flags, Cache-Verhalten und Batch-Prompt-Format finden Sie unter [CLI-Optionen](/de/guide/documents/cli-options).

<a id="complex-markdown-and-failed-quality-checks"></a>
## Komplexes Markdown und fehlgeschlagene Qualitätsprüfungen

`translate-docs` prüft, ob jede übersetzte Segment die Markdown-Struktur beibehält (einschließlich Hervorhebungen, die aus dem Dokument geparst wurden). Absätze, die viele `bold`-Spanne um `` `inline code` `` stapeln, Backticks innerhalb von Fett schachteln (z. B. Template-Literale wie `` `fetch(\`/locales/${code}.json\`)` ``) oder Fett und Code in einem langen Satz verweben, sind empfindlich: Einige Sprachgebiete benötigen eine andere Wortreihenfolge, wodurch sich die Ausrichtung von `**` und `` ` `` nach der Übersetzung ändern kann und CLI-Fehler wie `AST mismatch` ausgelöst werden.

**Wenn Sie auf diese Art von Validierungsfehler stoßen, sollten Sie es vorziehen, den Quelltext zu vereinfachen** – teilen Sie den Absatz auf, verschieben Sie ein Beispiel in einen umzäunten Codeblock oder beschreiben Sie dieselbe Idee mit weniger geschichteten Fett-/Code-Paaren –, anstatt zu erwarten, dass jedes Modell und jede Locale dichte Inline-Markups perfekt reproduziert.

Wenn jedes konfigurierte Modell mit einem `AST mismatch` beim selben Segment fehlschlägt, kann `translate-docs` dieses Segment automatisch in kleinere Teile aufteilen (zuerst die Mitte der Liste, dann einzelne Listenelemente oder kürzere Absatzabschnitte), jeden Teil erneut vom ersten Modell verarbeiten lassen und das Ergebnis unter dem ursprünglichen Segment-Cache-Schlüssel wieder zusammenfügen. Dies ist standardmäßig aktiviert (`segmentSplitting.qualityRetrySplit`); setzen Sie es auf `false`, um nach Erschöpfung aller Modelle abzubrechen. Die Laufzusammenfassung meldet `Quality split retries`, wenn dieser Fallback greift.

Um zu sehen, **welche Segmente fehlgeschlagen sind**, wie oft und die gespeicherten **Qualitäts-/Fehlermeldungen**, verwenden Sie die Registerkarte **Fehler** des Übersetzungs-Dashboards ([Übersetzungs-Dashboard → Fehler](/de/guide/translation-dashboard/failures#failures-document-translation)).
