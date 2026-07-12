<a id="documents"></a>
# Dokumente

Primär für **Markdown-, MDX- und `.astro`-Dokumentation** konzipiert, die über `docs[]`-Konfigurationsblöcke verwaltet wird. Das Feld `contentPaths` jedes Blocks listet die zu übersetzenden Dateien oder Ordner auf.

Auf [Docusaurus](/de/guide/integrations/docusaurus)-Websites stellen Sie auch `docusaurusCatalogDir` auf Ihren `write-translations`-Katalogordner ein (z. B. `docs-site/i18n/en`). Dann enthält `translate-docs` auch Shell-JSON – Navigationsleiste, Fußzeile und Theme-Strings.

Auf [VitePress](/de/guide/integrations/vitepress)-Websites verwenden Seitenkörper dieselbe `docs[]`-Pipeline. Navigations-, Seitenleisten- und Fußzeilenbeschriftungen befinden sich in `docsOutput.vitepressThemeCatalog` – `translate-docs` startet den englischen Katalog und übersetzt ihn zusammen mit den Seiten, keine separate Pipeline.

Auf [Nextra](/de/guide/integrations/nextra)-Sites verwenden Seitenkörper dieselbe `docs[]`-Pipeline mit `docsOutput.style: "nextra"`. `_meta.ts`-Seitenleistenbeschriftungen werden automatisch von `translate-docs` gesammelt und übersetzt; Theme-Wörterbuchzeichenfolgen werden über `docs[].nextraDictionaryPath` in derselben Pipeline übersetzt.

Auf [Fumadocs](/de/guide/integrations/fumadocs)-Sites verwenden Seitenkörper `docsOutput.style: "fumadocs"` mit `fumadocsParser` `"dot"` (Standard) oder `"dir"`. `meta.json`-Seitenleistenbeschriftungen werden automatisch gesammelt; UI-Überschreibungen werden über `docsOutput.fumadocsUiCatalog` übersetzt.

Auf [Astro Starlight](/de/guide/integrations/astro#astro-starlight)-Websites verwenden Seitenkörper `docsOutput.style: "astro-starlight"` mit `docsRoot` im Starlight-Inhaltsstammverzeichnis (typischerweise `src/content/docs/`). `translate-docs` schreibt lokalisierte Markdown/MDX unter `src/content/docs/<locale>/` neben dem englischen Baum. Starlight liefert integrierte UI-Strings für viele Sprachen – keine separate Theme-Katalog-Pipeline; optionale UI-Überschreibungen können `jsonPathTemplate` in einem `docs[]`-Block für `src/content/i18n/en.json` verwenden.

Für PNG und andere Rasterbilder, die in Markdown eingebettet sind, siehe [Bilder & Screenshots](/de/guide/images-and-screenshots/). `translate-docs` übersetzt nur den Alternativtext; es kopiert keine Rasterdateien.

Für einen optionalen **Sprachumschalter**-Block in README oder Docs setzen Sie `docsOutput.style` auf `"flat"` – siehe [Sprachumschalter](/de/guide/documents/language-switcher).

[SVG](/de/guide/svg-translation/)-Dateien werden über [`translate-svg`](/de/reference/cli-commands/content#translate-svg) übersetzt, wenn `features.translateSVG` aktiviert ist – nicht über `docs[]` / `contentPaths`.

Beliebige verschachtelte UI-JSON-Bundles, die nicht mit den Shell-/Theme-Strings eines Dokumentations-Frameworks zusammenhängen, gehören in die [JSON](/de/guide/json)-Pipeline, nicht in `docs[]`.

Für die **Terminologiekonsistenz** zwischen UI und Dokumentation setzen Sie `glossary.uiGlossary` auf Ihren `strings.json`-Pfad – `translate-docs` verwendet vorhandene UI-Übersetzungen als Hinweise in LLM-Prompts, wenn übereinstimmende Begriffe in einem Segment erscheinen. Optionales `glossary.userGlossary` fügt CSV-Überschreibungen für Produktbegriffe hinzu (gemeinsam mit `translate-ui` und `proofread-ui`). Erzeugen Sie eine Start-CSV mit `glossary-generate`, bearbeiten Sie Zeilen auf der Registerkarte **Glossar** des Übersetzungs-Dashboards, oder siehe [Konfiguration — `glossary`](/de/reference/configuration#glossary) und [Glossar](/de/guide/translation-dashboard/glossary).

<a id="per-locale-model-overrides"></a>
### Modellüberschreibungen pro Gebietsschema

`translate-docs` und der Docs-Schritt von `sync` lösen Modelle **pro Zielsprache** auf: zuerst `localeModels(locale)`, wenn konfiguriert, dann die globale `translationModels`-Kette des Anbieters. Verwenden Sie dies, wenn eine bestimmte Sprache ein anderes Modell als Ihre Standard-Fallback-Liste benötigt – zum Beispiel, wenn Sie Gemini für die `pt-BR`-Dokumentation bevorzugen, wenn die globale Kette mit Portugiesisch Schwierigkeiten hat. Siehe [Anbieter und Modelle](/de/guide/providers-and-models#model-fallback-chain) und [Konfiguration – `localeModels`](/de/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Welchen Leitfaden Sie lesen sollten

| Ihr Setup | Hier starten |
| --- | --- |
| Docusaurus-Website | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/de/guide/integrations/docusaurus) |
| VitePress-Website | `init -t ui-vitepress` + `vitepressThemeCatalog` für Theme - [VitePress](/de/guide/integrations/vitepress) |
| Nextra-Website | `init -t ui-nextra` + `nextraDictionaryPath` für Wörterbuch (Seitenleiste `_meta.ts` ist automatisch) - [Nextra](/de/guide/integrations/nextra) |
| Fumadocs-Website | `init -t ui-fumadocs` + `fumadocsUiCatalog` für UI (Seitenleiste `meta.json` ist automatisch) - [Fumadocs](/de/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/de/guide/integrations/astro#astro-starlight) |
| Flache Dokumente (README, Changelogs usw.) | `docsOutput.style = "flat"` - [Ausgabe-Layouts](/de/guide/documents/output-layouts), optionaler [Sprachumschalter](/de/guide/documents/language-switcher) |
| Wo übersetzte Dateien landen | [Ausgabe-Layouts](/de/guide/documents/output-layouts) |
| Seitenübergreifende `#anchor`-Links | [Anker-Links](/de/guide/documents/anchor-links) |
| Umschreiben von Link- und Asset-URLs (`regexAdjustments`) | [Link-Umschreibung](/de/guide/documents/link-rewriting) |
| Screenshots in Docs | [Bilder & Screenshots](/de/guide/images-and-screenshots/) |
| Produktterminologie und UI/Dokumentationskonsistenz | [Konfiguration — `glossary`](/de/reference/configuration#glossary), [Glossar](/de/guide/translation-dashboard/glossary) |
| `translate-docs`-Flags und Cache | [CLI-Optionen](/de/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Schritt 1: Initialisierung für die Dokumentation

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
```

Für Astro Starlight-Dokumentationsseiten:

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
```

Für VitePress-Dokumentationsseiten:

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
```

Setzen Sie `docsOutput.vitepressThemeCatalog` für Navigations-/Seitenleisten-/Fußzeilen-Strings – siehe [VitePress-Integration](/de/guide/integrations/vitepress).

Für Nextra-Dokumentationsseiten:

```bash
ai-i18n-tools init -t ui-nextra [-P <provider>]
```

Setzen Sie `docs[].nextraDictionaryPath` für Theme-Wörterbuch-Strings – siehe [Nextra-Integration](/de/guide/integrations/nextra). Seitenleisten-`_meta.ts`-Beschriftungen werden automatisch gesammelt.

Für Fumadocs-Dokumentationsseiten:

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
```

Setzen Sie `docsOutput.fumadocsUiCatalog` für UI-Überschreibungen – siehe [Fumadocs-Integration](/de/guide/integrations/fumadocs). Seitenleisten-`meta.json`-Beschriftungen werden automatisch gesammelt.

Für einfache Astro-Website-Oberflächen (ohne Starlight):

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
```

Diese Vorlage ermöglicht nur die UI-Extraktion. Für die Übersetzung von Seiten-HTML setzen Sie auch `features.translateDocs` und fügen Sie einen `docs[]`-Block hinzu (siehe [Astro-Website-Seiten (Parsen und Ersetzen)](/de/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)). Die [`examples/astro-website`]-Konfiguration (https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) zeigt beide Pipelines zusammen.

Bearbeiten Sie die generierte `ai-i18n-tools.config.json`:

- `provider` und `providers` – `init` erstellt einen Standard-Anbieterblock (`openrouter`, es sei denn, Sie übergeben `-P <provider>`); konfigurieren Sie mindestens einen Anbieter und legen Sie dessen API-Schlüssel fest, bevor `translate-docs` oder `sync` (Ollama benötigt keinen Schlüssel). Siehe [Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key) und [LLM-Anbieter und -Modelle](/de/guide/providers-and-models).
- `sourceLocale` – Quellsprache (muss mit `defaultLocale` in `docusaurus.config.js` übereinstimmen).
- `targetLocales` – Array von BCP-47-Sprachcodes (z. B. `["de", "fr", "es"]`).
- `cacheDir` – Gemeinsames SQLite-Cache-Verzeichnis für alle Pipelines (und Standard-Log-Verzeichnis für `--write-logs`).
- `docs` – Array von Dokumentationsblöcken. Jeder Block hat optionale `description`, `contentPaths` (String oder Array; Datei, Verzeichnis oder Glob), `outputDir`, optional `docusaurusCatalogDir`, `docsOutput`, optional `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter` usw.
- `docs[].description` – Optionale kurze Notiz für Wartungspersonal. Wenn festgelegt, erscheint sie in der Überschrift `translate-docs` und in den Abschnittsüberschriften `status`.
- `docs[].contentPaths` – Markdown/MDX/`.astro`-Quellen (und optional `docusaurusCatalogDir` für Docusaurus-Shell-JSON).
- `docs[].outputDir` – Übersetztes Ausgabe-Root für diesen Block.
- `docs[].docsOutput.style` – `"nested"` (Standard), `"flat"`, `"doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (siehe [Ausgabe-Layouts](/de/guide/documents/output-layouts)).
- `glossary.uiGlossary` – Pfad zu `strings.json`, damit Dokumentsegmente Terminologiehinweise aus Ihrem UI-Katalog erhalten (siehe [Konfiguration — `glossary`](/de/reference/configuration#glossary)).
- `glossary.userGlossary` – Optionale CSV für feste Produktbegriffsübersetzungen; wird auch von UI-Pipelines verwendet und ist im Dashboard-Tab [Glossar](/de/guide/translation-dashboard/glossary) bearbeitbar.

**Primär vs. ergänzend:** Konzentrieren Sie sich auf `contentPaths` für lokalisierte Seiten. Legen Sie `docusaurusCatalogDir` fest, wenn Sie zusätzlich Docusaurus-Shell-JSON aus `write-translations` benötigen. Lassen Sie `docusaurusCatalogDir` weg, wenn Sie nur Seiten übersetzen.

<a id="step-2-translate-documents"></a>
## Schritt 2: Dokumente übersetzen

```bash
ai-i18n-tools translate-docs
```

Dies übersetzt alle Dateien in jedem `docs[]`-Block `contentPaths` (und Docusaurus-Katalog-JSON, wenn `docusaurusCatalogDir` gesetzt ist) in alle effektiven Dokumentations-Locales. Bereits übersetzte Segmente werden aus dem SQLite-Cache bereitgestellt – nur neue oder geänderte Segmente werden an das LLM gesendet.

So übersetzen Sie eine einzelne Lokalisierung:

```bash
ai-i18n-tools translate-docs --locale de
```

So prüfen Sie, was übersetzt werden muss:

```bash
ai-i18n-tools status
```

Informationen zu Flags, Cache-Verhalten und Batch-Prompt-Format finden Sie unter [CLI-Optionen](/de/guide/documents/cli-options).

<a id="complex-markdown-and-failed-quality-checks"></a>
## Komplexes Markdown und fehlgeschlagene Qualitätsprüfungen

`translate-docs` prüft, ob jede übersetzte Segment die Markdown-Struktur beibehält (einschließlich Hervorhebungen, die aus dem Dokument geparst wurden). Absätze, die viele `bold`-Spanne um `` `inline code` `` stapeln, Backticks innerhalb von Fett schachteln (z. B. Template-Literale wie `` `fetch(\`/locales/${code}.json\`)` ``) oder Fett und Code in einem langen Satz verweben, sind empfindlich: Einige Sprachgebiete benötigen eine andere Wortreihenfolge, wodurch sich die Ausrichtung von `**` und `` ` `` nach der Übersetzung ändern kann und CLI-Fehler wie `AST mismatch` ausgelöst werden.

**Wenn Sie auf eine solche Validierungsfehler stoßen, sollten Sie den Ausgangstext vereinfachen** – teilen Sie den Absatz auf, verschieben Sie ein Beispiel in einen umzäunten Codeblock oder beschreiben Sie dieselbe Idee mit weniger geschichteten Fett-/Code-Paaren – anstatt zu erwarten, dass jedes Modell und jede Locale dichte Inline-Markups perfekt reproduziert.

Wenn jedes konfigurierte Modell mit einem `AST mismatch` beim selben Segment fehlschlägt, kann `translate-docs` dieses Segment automatisch in kleinere Teile aufteilen (zuerst die Mitte der Liste, dann einzelne Listenelemente oder kürzere Absatzabschnitte), jeden Teil erneut vom ersten Modell verarbeiten lassen und das Ergebnis unter dem ursprünglichen Segment-Cache-Schlüssel wieder zusammenfügen. Dies ist standardmäßig aktiviert (`segmentSplitting.qualityRetrySplit`); setzen Sie es auf `false`, um nach Erschöpfung aller Modelle abzubrechen. Die Laufzusammenfassung meldet `Quality split retries`, wenn dieser Fallback greift.

Um zu sehen, **welche Segmente fehlgeschlagen sind**, wie oft und die gespeicherten **Qualitäts-/Fehlermeldungen**, verwenden Sie die Registerkarte **Fehler** des Übersetzungs-Dashboards ([Übersetzungs-Dashboard → Fehler](/de/guide/translation-dashboard/failures#failures-document-translation)).
