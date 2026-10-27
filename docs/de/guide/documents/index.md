<a id="documents"></a>
# Dokumente

Referenz für `translate-docs`, die Pipeline für Markdown, MDX, `.astro` und einfache HTML-Seiten, die in `docs[]`-Konfigurationsblöcken aufgeführt sind. Das Feld `contentPaths` jedes Blocks listet die zu übersetzenden Dateien oder Ordner auf. Diese Dateien sind in `sourceLocale` geschrieben, was jede Sprache sein kann. Englisch in den Beispielen ist nur ein Muster. Fügen Sie zum ersten Mal Sprachen zu einer Website hinzu? Beginnen Sie bei [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website). Eine Repository-README und andere Markdown-Dateien, normalerweise neben einer App: [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme). Einfache HTML-Seiten (eine Datei pro Gebietsschema) werden in [HTML-Seiten](/de/guide/documents/html-pages) beschrieben.

Framework-Shell-Strings (Navigationsleiste, Seitenleiste, Theme) werden im selben Durchlauf übersetzt, nicht durch eine separate Pipeline. Die Framework-Anleitungen in der folgenden Tabelle beschreiben, wie jedes Framework dies handhabt: `docusaurusCatalogDir` für Docusaurus, `docsOutput.vitepressThemeCatalog` für VitePress, `docs[].nextraDictionaryPath` für Nextra, `docsOutput.fumadocsUiCatalog` für Fumadocs. Nextra `_meta.ts` und Fumadocs `meta.json` Seitenleistenbeschriftungen werden automatisch gesammelt. Astro Starlight liefert integrierte UI-Strings für viele Gebietsschemata, und optionale Überschreibungen können `jsonPathTemplate` in einem `docs[]`-Block verwenden.

Für PNG und andere Rasterbilder, die in Markdown eingebettet sind, siehe [Bilder & Screenshots](/de/guide/images-and-screenshots/). `translate-docs` übersetzt nur den Alternativtext; es kopiert keine Rasterdateien.

Für einen optionalen **Sprachumschalter**-Block in README oder Docs setzen Sie `docsOutput.style` auf `"flat"` – siehe [Sprachumschalter](/de/guide/documents/language-switcher).

[SVG](/de/guide/svg-translation/)-Dateien werden über [`translate-svg`](/de/reference/cli-commands/content#translate-svg) übersetzt, wenn `features.translateSVG` aktiviert ist – nicht über `docs[]` / `contentPaths`.

Beliebige verschachtelte UI-JSON-Bundles, die nicht mit den Shell-/Theme-Strings eines Dokumentations-Frameworks zusammenhängen, gehören in die [JSON](/de/guide/json)-Pipeline, nicht in `docs[]`.

Jeder UI-Block enthält standardmäßig die `strings.json` als Glossarhinweise für die Dokumentation (`uiGlossary`, Standard `true`). `translate-docs` verwendet diese Übersetzungen als Hinweise in LLM-Prompts wieder, wenn übereinstimmende Begriffe in einem Segment erscheinen. Setzen Sie `uiGlossary` auf `false` für einen Katalog, der aus Dokument-Prompts ausgeschlossen bleiben soll. Optional fügt `glossary.userGlossary` CSV-Überschreibungen für Produktbegriffe hinzu (gemeinsam genutzt mit `translate-ui` und `proofread-ui`). Kompakte Abkürzungen für UI-Labels, die für schmale Spalten verwendet werden (zum Beispiel `Size` → `Tam`), bleiben für die UI-Übersetzung verfügbar, werden aber aus den Glossarhinweisen für Dokumente ausgelassen. Generieren Sie eine Start-CSV mit `glossary-generate`, bearbeiten Sie Zeilen im Reiter [Glossar](/de/guide/translation-dashboard/glossary) des Übersetzungs-Dashboards oder lesen Sie [Konfiguration — `glossary`](/de/reference/configuration#glossary) und [Glossar](/de/guide/glossary).

<a id="per-locale-model-overrides"></a>
### Modellüberschreibungen pro Gebietsschema

`translate-docs` und der docs-Schritt von `sync` lösen Modelle **pro Ziel-Gebietsschema** auf: zuerst `localeModels(locale)`, wenn konfiguriert, dann die globale `translationModels`-Kette des Anbieters. Verwenden Sie dies, wenn eine bestimmte Sprache ein anderes Modell als Ihre Standard-Fallback-Liste benötigt – zum Beispiel, wenn Gemini für die `pt-BR`-Dokumentation bevorzugt wird, wenn die globale Kette mit Portugiesisch Schwierigkeiten hat. Siehe [KI-Modelle](/de/guide/ai-models#model-fallback-chain) und [Konfiguration – `localeModels`](/de/reference/configuration#provider-and-providers).

<a id="which-guide-to-read"></a>
## Welchen Leitfaden Sie lesen sollten

| Ihr Setup | Hier starten |
| --- | --- |
| Docusaurus-Website | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/de/guide/integrations/docusaurus) |
| VitePress-Website | `init -t ui-vitepress` + `vitepressThemeCatalog` für Theme - [VitePress](/de/guide/integrations/vitepress) |
| Nextra-Website | `init -t ui-nextra` + `nextraDictionaryPath` für Wörterbuch (Seitenleiste `_meta.ts` ist automatisch) - [Nextra](/de/guide/integrations/nextra) |
| Fumadocs-Website | `init -t ui-fumadocs` + `fumadocsUiCatalog` für UI (Seitenleiste `meta.json` ist automatisch) - [Fumadocs](/de/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/de/guide/integrations/astro#astro-starlight) |
| Reine HTML-Seiten | `init -t docs-plain-html` - [HTML-Seiten](/de/guide/documents/html-pages) |
| Flache Dokumente (README, Changelogs usw.) | [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme) — `init -t docs-markdown` oder `--with-readme`. Layout: [Ausgabe-Layouts](/de/guide/documents/output-layouts), [Sprachumschalter](/de/guide/documents/language-switcher) |
| Wo übersetzte Dateien landen | [Ausgabe-Layouts](/de/guide/documents/output-layouts) |
| Seitenübergreifende `#anchor`-Links | [Anker-Links](/de/guide/documents/anchor-links) |
| Umschreiben von Link- und Asset-URLs (`regexAdjustments`) | [Link-Umschreibung](/de/guide/documents/link-rewriting) |
| Screenshots in Docs | [Bilder & Screenshots](/de/guide/images-and-screenshots/) |
| Produktterminologie und Konsistenz zwischen UI und Dokumentation | [Konfiguration — `glossary`](/de/reference/configuration#glossary), [Glossar](/de/guide/glossary) |
| `translate-docs`-Flags und Cache | [CLI-Optionen](/de/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## Schritt 1: Initialisierung für die Dokumentation

```bash
ai-i18n-tools init -t ui-docusaurus -P openai
```

Für Astro Starlight-Dokumentationsseiten:

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
```

Für VitePress-Dokumentationsseiten:

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
```

Setzen Sie `docsOutput.vitepressThemeCatalog` für Navigations-/Seitenleisten-/Fußzeilen-Strings – siehe [VitePress-Integration](/de/guide/integrations/vitepress).

Für Nextra-Dokumentationsseiten:

```bash
ai-i18n-tools init -t ui-nextra -P gemini
```

Setzen Sie `docs[].nextraDictionaryPath` für Theme-Wörterbuch-Strings – siehe [Nextra-Integration](/de/guide/integrations/nextra). Seitenleisten-`_meta.ts`-Beschriftungen werden automatisch gesammelt.

Für Fumadocs-Dokumentationsseiten:

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
```

Setzen Sie `docsOutput.fumadocsUiCatalog` für UI-Überschreibungen – siehe [Fumadocs-Integration](/de/guide/integrations/fumadocs). Seitenleisten-`meta.json`-Beschriftungen werden automatisch gesammelt.

Für einfache Astro-Website-Oberflächen (ohne Starlight):

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
```

Diese Vorlage ermöglicht nur die UI-Extraktion. Für die HTML-Seitenübersetzung setzen Sie auch `features.translateDocs` und fügen Sie einen `docs[]`-Block hinzu (siehe [Astro-Website-Seiten (parse-and-replace)](/de/guide/ui-strings/astro-website#pages-parse-and-replace)). Die [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)-Konfiguration zeigt beide Pipelines zusammen.

Bearbeiten Sie die generierte `ai-i18n-tools.config.json`:

- `provider` und `providers` – `init -P <provider>` erstellt dafür ein Grundgerüst; legen Sie den API-Schlüssel vor `translate-docs` oder `sync` fest (Ollama benötigt keinen Schlüssel). Siehe [Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key), [LLM-Anbieter](/de/guide/providers-and-models) und [KI-Modelle](/de/guide/ai-models).
- `sourceLocale` – Quellsprache (muss mit `defaultLocale` in `docusaurus.config.js` übereinstimmen).
- `targetLocales` – Array mit BCP-47-Gebietsschemacodes (z. B. `["de", "fr", "es"]`).
- `cacheDir` – Gemeinsames SQLite-Cache-Verzeichnis für alle Pipelines (und Standard-Logverzeichnis für `--write-logs`).
- `docs` – Array von Dokumentationsblöcken. Jeder Block hat optionale `description`, `contentPaths` (String oder Array; Datei, Verzeichnis oder Glob), `outputDir`, optional `docusaurusCatalogDir`, `docsOutput`, optional `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter` usw.
- `docs[].description` – Optionale kurze Notiz für Wartungspersonal. Wenn festgelegt, erscheint sie in der Überschrift `translate-docs` und in den Abschnittsüberschriften `status`.
- `docs[].contentPaths` – Markdown/MDX/`.astro`-Quellen (und optional `docusaurusCatalogDir` für Docusaurus-Shell-JSON).
- `docs[].outputDir` – Übersetztes Ausgabe-Root für diesen Block.
- `docs[].docsOutput.style` - `"nested"` (Standard), `"flat"`, `"doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (siehe [Ausgabelayouts](/de/guide/documents/output-layouts)).
- `ui[].uiGlossary` - wenn `true` (Standard), liefert `strings.json` dieses Blocks Terminologiehinweise für Dokumentsegmente (siehe [Konfiguration — `ui`](/de/reference/configuration#ui)).
- `glossary.userGlossary` - optionale CSV für Übersetzungen fester Produktbegriffe; wird auch von UI-Pipelines verwendet und kann im Dashboard-Reiter [Glossar](/de/guide/translation-dashboard/glossary) bearbeitet werden.

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

`translate-docs` prüft, ob jedes übersetzte Segment die Markdown-Struktur (einschließlich der aus dem Dokument geparsten Hervorhebung) beibehält und ob interne Platzhalter-Tokens sauber wiederhergestellt werden. Absätze, die viele `bold`-Spans um `` `inline code` `` stapeln, Backticks in Fettschrift verschachteln (z. B. Template-Literale wie `` `fetch(\`/locales/${code}.json\`)` ``) oder Fettschrift und Code durch einen langen Satz weben, sind anfällig: Einige Sprachen benötigen eine andere Wortreihenfolge, was die Ausrichtung von `**` und `` ` `` nach der Übersetzung ändern und CLI-Fehler wie `AST mismatch` auslösen kann.

Nach der Wiederherstellung lehnt `translate-docs` auch Segmente ab, in denen HTML-Tag-Platzhalter wiederverwendet oder gelöscht wurden (sodass wiederhergestellte Tags nicht mehr der Quellzuordnung entsprechen) oder in denen das Modell übrig gebliebene doppelte Klammer-Tokens erfunden hat, die nicht in der Quelle vorhanden waren (z. B. ein erfundenes Glossar-ähnliches Token). Vor der Wiederherstellung erforderliche Prüfungen erfordern dieselbe Multimenge von <code v-pre>{{…}}</code>-Tokens und dieselbe geordnete Teilsequenz von strukturellen Tokens (<code v-pre>{{HTM_N}}</code>, Admonitions-Marker); Inhalts-Tokens wie <code v-pre>{{ILC_N}}</code>, <code v-pre>{{URL_N}}</code> und Hervorhebungs-Marker wie <code v-pre>{{SE}}</code> können sich mit der natürlichen Wortreihenfolge bewegen, wenn die Anzahl der IDs/Typen immer noch übereinstimmt. Diese Fehler verwenden denselben Modell-Fallback-Pfad wie übrig gebliebene offizielle interne Tokens.

**Wenn Sie auf eine solche Validierungsfehler stoßen, sollten Sie den Ausgangstext vereinfachen** – teilen Sie den Absatz auf, verschieben Sie ein Beispiel in einen umzäunten Codeblock oder beschreiben Sie dieselbe Idee mit weniger geschichteten Fett-/Code-Paaren – anstatt zu erwarten, dass jedes Modell und jede Locale dichte Inline-Markups perfekt reproduziert.

Wenn jedes konfigurierte Modell mit einem `AST mismatch` beim selben Segment fehlschlägt, kann `translate-docs` dieses Segment automatisch in kleinere Teile aufteilen (zuerst die Mitte der Liste, dann einzelne Listenelemente oder kürzere Absatzabschnitte), jeden Teil erneut vom ersten Modell verarbeiten lassen und das Ergebnis unter dem ursprünglichen Segment-Cache-Schlüssel wieder zusammenfügen. Dies ist standardmäßig aktiviert (`segmentSplitting.qualityRetrySplit`); setzen Sie es auf `false`, um nach Erschöpfung aller Modelle abzubrechen. Die Laufzusammenfassung meldet `Quality split retries`, wenn dieser Fallback greift.

Um zu sehen, **welche Segmente fehlgeschlagen sind**, wie oft und die gespeicherten **Qualitäts-/Fehlermeldungen**, verwenden Sie die Registerkarte **Fehler** des Übersetzungs-Dashboards ([Übersetzungs-Dashboard → Fehler](/de/guide/translation-dashboard/failures#failures-document-translation)).
