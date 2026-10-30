<a id="architecture"></a>
# Architektur

<a id="architecture-overview"></a>
## Architekturübersicht

Die Codebasis ist in vier Schichten organisiert. Verwenden Sie diesen Abschnitt für das mentale Modell; öffnen Sie den [Quellbaum](#source-tree), wenn Sie Details auf Dateiebene benötigen.

<a id="how-a-sync-run-fits-together"></a>
### Wie ein `sync`-Lauf zusammenpasst

`sync` (und die einzelnen Übersetzungsbefehle) führen aktivierte Funktionen der Reihe nach aus:

| Schritt | Befehl | Was er tut |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | UI-Quellen scannen → `strings.json` aktualisieren → flaches Gebietsschema-JSON füllen (`de.json`, …) |
| 2 | `translate-svg` *(optional)* | SVG-Text unter `config.svg` übersetzen |
| 3 | `translate-docs` | Markdown-, MDX-, `.astro`-Seiten übersetzen; Docusaurus-Katalog-JSON; Nextra `_meta` / Wörterbuch `.ts`; VitePress-Themenkatalog |
| 4 | `translate-json` *(optional)* | Verschachtelte JSON-Blätter unter `json[]` übersetzen |

Jede Pipeline folgt demselben Kernzyklus: **Segmente extrahieren → Syntax schützen → stapeln → Cache-Lookup oder LLM-Aufruf → Ausgabe schreiben**. Gemeinsame Dienste in der Mitte – Konfiguration, Platzhalter, Cache, Glossar, `LlmClient` – werden unter [Gemeinsame Infrastruktur](#shared-infrastructure) beschrieben.

<a id="module-map"></a>
### Modulzuordnung

| Schicht | Ordner | Rolle |
| --- | --- | --- |
| **Einstieg** | `src/cli/` | CLI-Befehle: `init`, `extract`, `mark-html`, `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`, `status`, `dashboard`, … |
| **Pipelines** | `src/extractors/` | Segmentextraktion aus JS/TS, HTML-Markern, Markdown, JSON, SVG, `.astro` |
| | `src/processors/` | Platzhalterschutz, Batching, Validierung, Link-Umschreibung |
| **Gemeinsam** | `src/core/` | Konfiguration, Typen, SQLite-Cache, Prompts, Ausgabepfade, Gebietsschema-Dienstprogramme |
| | `src/api/` | `LlmClient` – anbieterunabhängiger Chat-Client (Vercel AI SDK) mit Modell-Fallback |
| | `src/glossary/` | Laden von Glossaren, Terminhinweise und optionale Projektkontextdateien für Prompts |
| | `src/utils/` | Logger, Hashing, Ignore-Parser, Tabellen mit Anzeigebreite, `.env`-Loader |
| **Ihre App-Laufzeit** | `src/runtime/` | i18next-Helfer und Anzeige-Dienstprogramme – exportiert als `'ai-i18n-tools/runtime'` ([Laufzeit-Helfer](/de/guide/runtime-helpers)) |
| **Tool-UI** *(Dogfooding)* | `src/i18n/`, `src/dashboard-app/`, `src/server/` | Lokalisiert die eigene CLI und das Übersetzungs-Dashboard dieses Pakets — getrennt von Ihrem Projektinhalt ([Selbstlokalisierung](#self-localisation-tool-ui)) |

Alles, was für die programmatische Nutzung vorgesehen ist, wird aus `src/index.ts` re-exportiert ([Programmatische API](/de/reference/programmatic-api)).

<a id="pipeline-summaries"></a>
### Pipeline-Zusammenfassungen

| Pipeline | Abschnitt | Eingabe → Ausgabe |
| --- | --- | --- |
| UI-Strings | [Interna der UI-Strings](#ui-strings-internals) | Quelldateien → `strings.json` → flache `{locale}.json` |
| Dokumente | [Interna der Dokumente](#documents-internals) | Markdown / MDX / `.astro` / Docusaurus JSON → Dateien pro Gebietsschema unter `docs[].outputDir` |
| JSON-Bundles | [JSON-Interna](#json-internals) | Verschachteltes JSON unter `json[]` → JSON-Dateien pro Gebietsschema |
| SVG | [Interna der Dokumente – Extraktoren](#extractors) | SVG-Dateien unter `config.svg` → übersetzte SVG-Kopien |

---

<a id="ui-strings-internals"></a>
## Interna der UI-Strings

| Schritt | Komponente | Ergebnis |
| --- | --- | --- |
| 1 | Quelldateien (JS/TS; optional `.astro` / `.html`) | Dateien auf der Festplatte |
| 2 | `UIStringExtractor` (i18next-scanner; `.astro` über `ui-string-babel.ts`) | Segmente, die durch MD5-Hash verschlüsselt sind |
| 3 | `strings.json` | Masterkatalog: `{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | JSON-Array von Quell-Strings → Übersetzungen (+ Modell-ID pro Batch) |
| 5 | `de.json`, `pt-BR.json`, … | Flache Zuordnungen: Quell-String → Übersetzung (keine Modellmetadaten) |

<a id="uistringextractor"></a>
### `UIStringExtractor`

Verwendet die `i18next-scanner` `Parser.parseFuncFromString`, um `t("literal")`- und `i18n.t("literal")`-Aufrufe in JS/TS-Dateien zu finden. Für `.astro`-Quellen (wenn in `ui.uiExtractor.extensions` aufgeführt) parst `ui-string-babel.ts` Frontmatter- und Template-`{expression}`-Blöcke mit `@babel/parser` und wendet dieselben `funcNames`-Regeln an. Funktionsnamen und Dateierweiterungen können über `ui.uiExtractor` konfiguriert werden (`ui.reactExtractor` ist ein unterstützter Alias). `extract` **führt auch Nicht-Scanner-Eingaben in denselben Katalog zusammen:** die Projekt-`package.json` `description`, wenn `includePackageDescription` aktiviert ist (Standard), und jede `englishName` aus dem gebündelten UI-Sprach-Masterkatalog (erstellt aus `sourceLocale` + `targetLocales`), wenn `includeUiLanguageEnglishNames` `true` ist (bereits in der Quelle gefundene Zeichenfolgen behalten Vorrang; `languagesManifestPath` wird nicht gelesen). `extract` generiert auch `ui-languages.json` unter `languagesManifestPath` neu. Segment-Hashes sind die **ersten 8 Hex-Zeichen des MD5** der gekürzten Quellzeichenfolge – diese werden zu den Schlüsseln in `strings.json`.

Für `.html`- / `.htm`-Quellen (wenn in `ui.uiExtractor.extensions` aufgeführt) leitet `extract` die Datei stattdessen durch `html-i18n-marks.ts`, das die Marker-Attribute `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` / `data-i18n-alt` / `data-i18n-aria-label` scannt (konfigurierbar über `ui.uiExtractor.htmlI18nAttributes`). Ein Bare-Marker übernimmt seinen Quelltext aus dem eigenen `textContent` oder Attribut des Elements; ein Valued-Marker (`data-i18n="Key"`) verwendet den Wert. `data-i18n-locale-src` und `data-i18n-locale-href` sind für die Browser-Laufzeitumgebung reserviert und werden nie extrahiert. Dasselbe Modul steuert den Befehl `mark-html`, der die Bare-Marker automatisch einfügt (einschließlich `alt` und `aria-label`) und niemals die Locale-URL-Marker einfügt. HTML-Dateien erreichen niemals die Babel- / i18next-scanner-Durchläufe. Generiertes Locale-HTML unter einem Docs-`outputDir` ist von diesem Scan ausgeschlossen.

Einfache Astro SSG-Sites können i18next überspringen: Laden Sie flache `{locale}.json` zur Build-Zeit und lösen Sie `t('source text')` nach Quelltextschlüssel auf. Die Ausgangssprache ist `sourceLocale` und kann jede Sprache sein (siehe `examples/astro-website/src/i18n/t.ts` und [UI-Strings – Astro-Website](/de/guide/ui-strings/astro-website)).

Reine HTML-Apps folgen demselben Katalogmodell mit Marker-Attributen anstelle von `t()`-Aufrufen — siehe [HTML zur Übersetzung markieren](/de/guide/ui-strings/plain-html#marking-html-for-translation). Das gebrauchsfertige Skript ist `ai-i18n-tools/html-runtime/i18n.js`.

Statisches HTML, das zu einer Datei pro Locale werden soll, ist eine Dokumenten-Pipeline (`HtmlTemplateExtractor` innerhalb von `translate-docs`), nicht dieser Katalog. Siehe [HTML-Seiten](/de/guide/documents/html-pages).

<a id="stringsjson"></a>
### `strings.json`

Der Master-Katalog hat folgende Struktur:

```json
{
  "a1b2c3d4": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models` (optional) – pro Gebietsschema, welches Modell diese Übersetzung nach dem letzten erfolgreichen `translate-ui`-Lauf für dieses Gebietsschema erstellt hat (oder `user-edited`, wenn der Text vom Übersetzungs-Dashboard gespeichert wurde). `locations` (optional) – wo `extract` die Zeichenfolge gefunden hat (Scanner + Paketbeschreibungszeile; gebündelte Master-`englishName`-Zeichenfolgen können `locations` weglassen).

`extract` fügt neue Schlüssel hinzu und bewahrt vorhandene `translated` / `models`-Daten für Schlüssel, die noch im Scan vorhanden sind (Scanner-Literale, optionale Beschreibung, optionaler gebündelter Master-`englishName`). `translate-ui` füllt fehlende `translated`-Einträge, aktualisiert `models` für die Gebietsschemata, die es übersetzt, und schreibt flache Gebietsschema-Dateien.

`ui-languages.json` **Manifest** – JSON-Array von `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, Referenz `englishName`, `"ltr"` oder `"rtl"`). Verwenden Sie `generate-ui-languages` oder `extract`, um eine Projektdatei aus `sourceLocale` + `targetLocales` und dem gebündelten Master-`data/ui-languages-complete.json` zu erstellen.

<a id="flat-locale-files"></a>
### Flache Lokalisierungsdateien

Jede Zielsprache erhält eine flache JSON-Datei (`de.json`), die Quelltext → Übersetzung abbildet (ohne `models`-Feld):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next lädt diese als Ressourcenbündel und sucht Übersetzungen über den Quelltext (Key-as-Default-Modell).

<a id="ui-translation-prompts"></a>
### UI-Übersetzungsanweisungen

`buildUIPromptMessages` erstellt System- und Benutzernachrichten, die:

- Quellsprache und Zielsprache identifizieren (anhand des Anzeigenamens von `localeDisplayNames` oder `ui-languages.json`).
- Eine Skript-Direktive voranstellen, wenn das Ziel-Gebietsschema ein erwartetes Schriftsystem hat (explizites BCP-47-Skript oder eine Sprachstandardeinstellung wie `hi` → Devanagari, `ar` → Arabisch, `ja` → japanische Kana/Kanji).
- Ein JSON-Array von Zeichenfolgen senden und ein JSON-Array von Übersetzungen zurückfordern.
- Glossar-Hinweise einbeziehen, falls verfügbar.

`LlmClient.translateUIBatch` versucht jedes Modell der Reihe nach und greift bei Analyse-, Netzwerk- oder Skriptfehlern zurück (einschließlich romanisiertem/lateinischem Fallback für Lokalisierungen mit nativer Schrift). Die CLI erstellt diese Liste pro Ziellokalisierung aus `localeModels`, optional `uiModels` und `translationModels` (siehe [KI-Modelle](/de/guide/ai-models#model-fallback-chain)).

---

<a id="documents-internals"></a>
## Interna der Dokumente

| Schritt | Komponente | Ergebnis |
| --- | --- | --- |
| 1 | Markdown / MDX / JSON / `.astro`-Dateien (`translate-docs`) | Quelldateien |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` – typisierte Segmente mit Hash + Inhalt |
| 3 | `PlaceholderHandler` | Geschützter Text – HTML, Admonitionen, Anker, MDX, URLs, Inline-Code, Hervorhebung als Token maskiert |
| 4 | `splitTranslatableIntoBatches` | `batches[]` – gruppiert nach Anzahl + Zeichenlimit |
| 5 | `TranslationCache`-Suche | Cache-Treffer → überspringen; Miss → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | Endgültiger Text – Platzhalter wiederhergestellt |
| 7 | `resolveDocumentationOutputPath` | Ausgabedatei – Docusaurus-Layout oder flaches Layout |

<a id="extractors"></a>
### Extraktoren

Alle Extraktoren erweitern `BaseExtractor` und implementieren `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` – teilt Markdown in typisierte Segmente auf: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. YAML-Frontmatter wird als **nicht übersetzbar** klassifiziert (`slug`, `id` und andere Routing-Schlüssel bleiben stabil). Top-Level-`export ...`-Blöcke (z. B. React-Komponentendefinitionen) werden als nicht übersetzbare `other`-Segmente neben der bestehenden `import ...`-Behandlung klassifiziert. Mehrzeilige Blöcke, die mit einem großen JSX-Tag beginnen (z. B. ein `<Tabs>`-Block), werden als übersetzbare Absätze klassifiziert. Nicht übersetzbare Segmente (Codeblöcke, reines HTML) werden wortgetreu beibehalten.
- `AstroTemplateExtractor` – Parsen und Ersetzen für `.astro`-Marketingseiten (`translate-docs` über `translateAstroFile` in `doc-translate.ts`). Extrahiert benutzerseitige HTML-Textknoten und übersetzbare Attribute (`alt`, `title`, `aria-label`, `placeholder`) sowie String-Literale innerhalb von Template-`{expression}`-Blöcken, wenn sie benutzerseitig sind. Überspringt Frontmatter-TypeScript, `<script>`, `<style>`, geschützte Attribut-/Schlüsselwerte und Literale innerhalb von `t('…')`. Die Wiederzusammenstellung passt relative Importe an, wenn die Ausgabepfade tiefer sind (z. B. `src/pages/de/index.astro`). Siehe [Astro-Website-Seiten](/de/guide/ui-strings/astro-website#pages-parse-and-replace).
- `JsonExtractor` – extrahiert String-Werte aus Docusaurus-JSON-Label-Dateien (Docusaurus-UI-Kataloge, nicht MDX-Body).
- `SvgExtractor` – extrahiert `<text>`, `<title>` und `<desc>`-Inhalte aus SVG (wird von `translate-svg` für Dateien unter `config.svg` verwendet, nicht von `translate-docs`).
- `html-i18n-marks.ts` – ein fokussierter HTML-Tag-Scanner, der von `extract` für `.html` / `.htm`-Quellen und vom `mark-html`-Befehl verwendet wird. `collectHtmlI18nStrings` / `collectHtmlI18nLocations` lesen `data-i18n*`-Markerattribute (einfacher Marker → Element `textContent` / `title` / `placeholder`; gewerteter Marker → der Wert), und `markHtmlContent` fügt einfache Marker in Leaf-Text- / Titel- / Platzhalterelemente ein (idempotent, beachtet `data-i18n-ignore`, überspringt Code-ähnliche und gemischte Inhaltselemente). Der gemeinsame `normalizeI18nText`-Helfer hält Build-Zeit-Schlüssel identisch mit der Browser-Laufzeit.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro-Hybrid-Websites (UI + Seiten-HTML)

Einfache Astro-Apps aktivieren oft **sowohl** UI-Strings als auch Dokumente in einer Konfiguration (Referenz: `examples/astro-website/`):

| Ebene | Mechanismus | Ausgabe |
| --- | --- | --- |
| Template-HTML | `AstroTemplateExtractor` + `translate-docs` | Pro-Gebietsschema `.astro` unter `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | Flaches `public/locales/{locale}.json` (Ausgangssprachen-String als Schlüssel; `sourceLocale` kann jede Sprache sein) |

Der Befehl `sync` führt die aktivierten Schritte der Reihe nach aus: **extrahieren** dann **translate-ui** (wenn `features.translateUIStrings`) → optional **translate-svg** → **translate-docs** → optional **translate-json** (es sei denn, übersprungen mit `--no-ui`, `--no-svg`, `--no-docs` oder `--no-json`). Die Init-Vorlage `ui-astro-website` erstellt nur UI-Strings; fügen Sie `docs[]` und `features.translateDocs` für Seiten-HTML hinzu.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Einfügen von Überschrift-Ankern (`write-heading-ids` CLI)

Der Befehl `write-heading-ids` ist ein **lokaler, nicht-LLM** Vorbereitungsprozessor für Markdown-Dokumentation. Implementierung: `src/cli/write-heading-ids.ts` steuert die Dateierkennung; `src/markdown/write-heading-ids-core.ts` analysiert die Zeilen und fügt Anker ein.

Es erfordert eine gültige Konfiguration mit **mindestens einem `docs[]`-Block**. Für jeden Block werden `.md`- / `.mdx`-Dateien unter `contentPaths` gesammelt, die `.translate-ignore`-Regeln des Projekts angewendet (gleiche Idee wie bei der Dokumentübersetzung) und optional auf einen Unterbaum mit `--path` / `--file` beschränkt. Jede Datei wird mit `applyHeadingAnchorsToMarkdown` transformiert: Für jede **flache ATX-Überschrift** (`# …` bis `###### …`) außerhalb von Codeblöcken werden vorhandene Überschriften-IDs jeglicher Form durch den ausgewählten Stil ersetzt. HTML-Stile schreiben `<a id="slug"></a>` in die Zeile über einer suffixfreien Überschrift; `--slug-style mdx-comment` schreibt `{/* #slug */}` in die Überschriftenzeile (und entfernt einen vorangehenden HTML-Anker). Slugs stammen immer aus dem aktuellen Überschriftentext. `--remove` entfernt HTML-Anker, klassische `{#id}`-Suffixe und MDX-Kommentar-IDs, ohne neue zu schreiben. Slug-Algorithmen entsprechen gängigen Ökosystemen – `github` (Standard), `bitbucket`, `gitlab`, `pymdown` (optionale Unicode-Normalisierungs- / Prozentkodierungs-Flags), `azure-devops` sowie `mdx-comment` (GitHub-Slug + MDX-Kommentarausgabe) –, sodass Anker-IDs mit vorhandenen Tools (doctoc, PyMdown, Docusaurus usw.) konsistent bleiben. `--dry-run` meldet potenzielle Bearbeitungen, ohne zu schreiben.

Nach dem Quell-Pass positioniert derselbe Befehl diese englischen IDs auf dem vorhandenen übersetzten Markdown jedes Gebietsschemas neu (`resolveTranslatedOutputPath`). Übersetzte Titel werden niemals neu geslugt; eine Überschrift-Mitte `{#id}` / `{/* #id */}` wird zurück an das Suffix (oder den HTML-Anker) verschoben, das der ausgewählte Stil erwartet. Fehlende Gebietsschema-Dateien werden übersprungen.

Dieser Befehl wird **nicht** innerhalb von `translate-docs` oder `sync` ausgeführt; führen Sie ihn explizit aus, wenn Sie stabile Fragment-IDs in den Quelldateien vor der Übersetzung oder Veröffentlichung benötigen.

<a id="placeholder-protection"></a>
### Platzhalter-Schutz

Vor der Übersetzung wird empfindliche Syntax durch undurchsichtige Token ersetzt, um LLM-Beschädigungen zu verhindern. Die Ersetzung erfolgt in dieser Reihenfolge (die Wiederherstellung erfolgt umgekehrt):

1. **Codeblöcke mit Begrenzern** (drei oder mehr Backticks oder Tilden, einschließlich eines längeren Begrenzers, der einen kürzeren umschließt) – der gesamte Begrenzer, einschließlich des Info-Strings, wird durch <code v-pre>{{CDF_N}}</code> ersetzt und in der Reihenfolge der anderen strukturellen Token beibehalten. Dadurch werden Beispiele in Containern wie `::: code-group` oder `::: tip` an ihrer Position gehalten. Info-Strings von Begrenzern (VitePress-Tab-Beschriftungen) bleiben in der Ausgangssprache. Ein nicht geschlossener Öffner wird als Text belassen, damit ein späterer Container-Schließer nicht verschluckt wird.
2. **Suffixe für Überschriften-IDs** (klassisches `{#id}` / MDX `{/* #id */}` am Ende einer ATX-Überschrift) – werden vollständig aus der Zeile entfernt und **nicht** an das Modell gesendet. Nach der Wiederherstellung werden sie wieder an das Ende der entsprechenden Überschrift angeheftet, sodass Docusaurus weiterhin eine gültige ID erkennt. Kommentare in der Mitte von Überschriften bleiben im Text und werden von den späteren MDX- / `{#…}`-Schichten verarbeitet. Überschriften innerhalb eines maskierten Begrenzers werden nicht entfernt.
3. **HTML-Tags und -Kommentare** (`<strong>`, `<!-- ... -->` usw.) – HTML-Tags in Kleinbuchstaben aus einer bekannten Zulassungsliste werden durch <code v-pre>{{HTM_N}}</code>-Token ersetzt. JSX-Tags in Großbuchstaben (`<Highlight>`, `<Tabs>`, `</Tab>`) werden separat von der MDX-Schicht (Schritt 6) verarbeitet.
4. **Admonition-Marker** (`:::note`, `:::`) – nur das Direktivenpräfix in der Eröffnungszeile wird durch <code v-pre>{{ADM_OPEN_N}}</code> ersetzt; jeder Titel in derselben Zeile wird dem Modell zur Übersetzung überlassen. Wird mit dem exakten Originaltext wiederhergestellt.
5. **Dokumentenanker** (HTML `<a id="…">`, übrig gebliebenes Docusaurus-`{#…}` in der Mitte einer Überschrift) – werden wörtlich beibehalten.
6. **Nur-MDX-Konstrukte** (`src/processors/mdx-placeholders.ts`):
   - **MDX-Kommentare** (`{/* … */}`, einschließlich eines `{/* #my-id */}` in der Mitte einer Überschrift, das kein Zeilenende-Suffix war) werden durch <code v-pre>{{MDX_N}}</code> ersetzt.
   - **JSX-Tags in Großbuchstaben** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) – werden als <code v-pre>{{MDX_N}}</code> beibehalten, wobei übersetzbare String-Attribute (`label`, `tooltip`, `aria-label`) in <code v-pre>{{JXA_N}}</code> innerhalb des Tags umgeschrieben werden, es sei denn, der Attributname erscheint in `docs[].protectAttributes`; `label:` innerhalb von `<Tabs values={[ { label: '…' } ]}>`-Objektliteralen (überspringbar über `docs[].protectKeys`) und `<TabItem value="…">` (wenn kein `label`-Attribut vorhanden ist, wobei Slug-ähnliche Werte in Kleinbuchstaben übersprungen werden) werden ebenfalls extrahiert. An das Segment als `||JXA_N: …||`-Zeilen angehängt und durch `restoreMdx` wieder zusammengeführt.
   - **MDX-Ausdrücke in geschweiften Klammern** (`{frontMatter.title}`, <code v-pre>style={{…}}</code>) – tiefenbewusster Abgleich, ersetzt durch <code v-pre>{{MDX_N}}</code>.
7. **Markdown-URLs** (`](url)`, `src="…"`) – werden nach der Übersetzung aus einer Map wiederhergestellt.
8. **Inline-Code-Abschnitte** (`` `code` ``) und **fett formatierter Inline-Code** (`**`code`**`) – bleiben erhalten.
9. **Markdown-Hervorhebung** (optional, automatisch für CJK/RTL-Gebietsschemata aktiviert) – Hervorhebungsbegrenzer werden maskiert.

Nachdem das Modell eine Antwort zurückgegeben hat, stellt `translate-docs` die Maps wieder her und validiert das Segment: Dieselbe Multimenge von Token in doppelten geschweiften Klammern muss vorhanden sein, strukturelle Token (<code v-pre>{{HTM_N}}</code>, Admonition-Marker, <code v-pre>{{CDF_N}}</code>) müssen ihre geordnete Teilsequenz beibehalten (Inhalts-Token wie <code v-pre>{{ILC_N}}</code> / <code v-pre>{{URL_N}}</code> / <code v-pre>{{SE}}</code> können sich mit der Wortstellung verschieben), wiederhergestellte Arten von HTML-Tags müssen mit der ungeschützten Quelle übereinstimmen und jeder übrig gebliebene Bezeichner in doppelten geschweiften Klammern muss bereits in der Quelle vorhanden gewesen sein (sodass erfundene Token fehlschlagen). Der Dokumenten-Prompt fordert die Modelle außerdem auf, jedes Token einmal zu kopieren, die Reihenfolge der strukturellen Token beizubehalten und keine neuen Wrapper in doppelten geschweiften Klammern zu erfinden; mechanische Prüfungen bleiben maßgebend.

Der gemeinsame Attribut-/Schlüsselschutz für Astro-Templates und MDX JSX wird in `src/processors/expression-attribute-protection.ts` implementiert und pro Block durch `docs[].protectAttributes` und `docs[].protectKeys` gesteuert (siehe [protectAttributes / protectKeys](/de/reference/configuration#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

SQLite-Datenbank (über `node:sqlite`) speichert Datensätze, die über `(source_hash, locale)` mit `translated_text`, `model`, `filepath`, `last_hit_at` und verwandten Feldern verknüpft sind. Der Hash ist die ersten 16 Hex-Zeichen des SHA-256-Hashs des normalisierten Inhalts (Leerzeichen zusammengefasst).

Bei jedem Durchlauf werden Segmente nach Hash × Locale nachgeschlagen. Nur Cache-Fehler gehen an das LLM. Nach der Übersetzung wird `last_hit_at` für Segmentzeilen im aktuellen Übersetzungsbereich, die nicht getroffen wurden, zurückgesetzt. Erfolgreiche Cache-Treffer während der Dokumentübersetzung löschen veraltete `translation_failures`-Zeilen für dieses Segment.

`cleanup` führt zuerst `sync --force-update` aus, dann:

- entfernt veraltete Segmentzeilen (null `last_hit_at` / leerer Dateipfad);
- bereinigt `file_tracking`-Schlüssel, wenn der aufgelöste Quellpfad auf der Festplatte fehlt (`doc-block:…`, `json-block:…`, `svg-files:…` usw.);
- entfernt Übersetzungszeilen, deren Metadaten-Dateipfad auf eine fehlende Datei verweist;
- bereinigt verwaiste `translation_failures`-Zeilen;
- bereinigt verwaiste `markdown_source_issues`-Zeilen, deren aufgelöster Quellpfad auf der Festplatte fehlt;
- löscht Cache-Zeilen für Lokalisierungen, die in der Konfiguration fehlen (`sourceLocale`, Stamm-`targetLocales` und alle pro-Block `docs[]` / `json[]` `targetLocales`; nur SQLite — verwenden Sie `purge-locale`, um generierte Dateien zu löschen).

Es sichert `cache.db` nicht, es sei denn, `--backup <path>` wird übergeben, was zuerst ein Backup in diesen Pfad schreibt.

Abgerechnete Modellaufrufe (akzeptierte Übersetzungen und verworfene Wiederholungen) werden in `api_calls` gespeichert. Nach einem Befehl, der Aufrufe aufgezeichnet hat, werden Detailzeilen, die älter als sieben UTC-Kalendertage sind, in monatliche `api_totals` überführt. `usage` und die Dashboardansicht Nutzung und Kosten führen beide Tabellen zusammen. Siehe [Nutzung und Kosten](/de/guide/translation-dashboard/usage).

Glossar-`Context`-Hinweise und `glossary.contextFiles` werden mit einem Fingerabdruck (`prompt_context_hash`) versehen und in UI, Dokumentation, JSON, SVG und Korrekturprompts eingefügt. Das Ändern dieser Vorgaben invalidiert beim nächsten Durchlauf passende gecachte Segmente und Datei-Tracking-Zeilen. Dashboard-`user-edited`-Cachezeilen werden beibehalten. Das ausschließliche Ändern einer bevorzugten Glossarübersetzung belässt den bestehenden Cache unverändert bis `--force` / `--force-update`.

Der Befehl `translate-docs` verwendet auch die **Dateiverfolgung**, sodass unveränderte Quellen mit vorhandenen, aktuellen Ausgaben die Arbeit vollständig überspringen können. `--check-cache` öffnet Gebietsschemata mit einem erwarteten Schriftsystem erneut, sodass zwischengespeicherte Segmente neu validiert werden; `--force-update` führt die Dateiverarbeitung für jedes Gebietsschema erneut aus, während der Segment-Cache weiterhin verwendet wird; `--force` löscht die Dateiverfolgung und umgeht das Lesen des Segment-Caches für die API-Übersetzung. Wenn jedes konfigurierte Modell die AST-Validierung für ein Markdown-Segment nicht besteht, kann `translate-docs` das Segment schrittweise aufteilen und kleinere Teile erneut versuchen (`docs[].segmentSplitting.qualityRetrySplit`, standardmäßig aktiviert). Eine vollständige Flag-Tabelle finden Sie unter [Dokumente – Cache-Verhalten und Flags](/de/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags).

**Batch-Prompt-Format:** `translate-docs --prompt-format` wählt XML (`<seg>` / `<t>`) oder JSON-Array-/Objektformen nur für `LlmClient.translateDocumentBatch`; Extraktion, Platzhalter und Validierung bleiben unverändert. Siehe [Batch-Prompt-Format](/de/guide/documents/cli-options#batch-prompt-format).

<a id="output-path-resolution"></a>
### Auflösung des Ausgabepfads

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` ordnet einen quellbezogenen Pfad dem Ausgabepfad zu:

- `nested`-Stil (Standard): `{outputDir}/{locale}/{relPath}` für Markdown.
- `doc-system`-Stil: Unter `docsRoot` verwenden die Ausgaben `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`; Pfade außerhalb von `docsRoot` greifen auf das verschachtelte Layout zurück. Aliase: `docusaurus` (Standard `localeSubpath` = Docusaurus-Plugin-Pfad), `astro-starlight` (Standard leer `localeSubpath`), `vitepress` (wie `doc-system` mit leerem `localeSubpath`; behält die BCP-47-Ordnergroß-/Kleinschreibung bei).
- `flat`-Stil: `{outputDir}/{stem}.{locale}{extension}`. Wenn `flatPreserveRelativeDir` auf `true` gesetzt ist, bleiben die Quellunterverzeichnisse unter `outputDir` erhalten.
- **Benutzerdefiniertes** `pathTemplate`: jedes Markdown-Layout, das `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` verwendet.
- **Benutzerdefinierter** `jsonPathTemplate`: separates benutzerdefiniertes Layout für JSON-Beschriftungsdateien, unter Verwendung derselben Platzhalter.
- `linkRewriteDocsRoot` hilft dem Umschreiber flacher Links, korrekte Präfixe zu berechnen, wenn die übersetzte Ausgabe nicht im standardmäßigen Projektstamm verwurzelt ist.

<a id="flat-link-rewriting"></a>
### Umsetzung flacher Links

Wenn `docsOutput.style === "flat"`, werden übersetzte Markdown-Dateien neben der Quelle mit Lokalisierungssuffixen platziert. Relative Links zwischen Seiten werden so umgeschrieben, dass `[Guide](./guide.md)` in `readme.de.md` auf `guide.de.md` verweist. Kontrolliert durch `rewriteRelativeLinks` (automatisch aktiviert für flachen Stil ohne benutzerdefiniertes `pathTemplate`). Der gleiche Durchlauf fügt vor `postProcessing.regexAdjustments` einen pro Datei-Präfix für nicht-Markdown-Asset-URLs hinzu — siehe [Flacher Link-Umschreiber](/de/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow).

---

<a id="json-internals"></a>
## JSON-Interna

| Schritt | Komponente | Ergebnis |
| --- | --- | --- |
| 1 | `json[].contentPaths` | Dateien aufgelöst (Datei, Verzeichnis oder Glob) |
| 2 | `NestedJsonExtractor` | String-Blätter ausgewählt durch `keyPolicy` (Punktpfade + Minimatch) |
| 3 | `PlaceholderHandler` + Batch + `TranslationCache` | Cache-Treffer → überspringen; Miss → `LlmClient.translateDocumentBatch` (gemeinsame SQLite) |
| 4 | `NestedJsonExtractor.reassemble` | Ausgabedatei über `expandJsonBlockOutputPath(outputPathTemplate)` |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) durchläuft beliebig verschachteltes JSON und gibt ein Segment pro übersetzbarem String-Blatt aus. `keyPolicy.mode` (`allowlist`, `denylist` oder `both`) filtert Pfade mit Minimatch auf Punktnotation (einfache Namen wie `slug` stimmen mit dem letzten Schlüssel-Segment überein).
- Die Cache-Dateiverfolgung verwendet `json-block:{blockIndex}:{projectRelPath}` in `file_tracking` (gleiches `cacheDir` wie Docs und SVG).
- **Nicht** für Docusaurus `write-translations`-Kataloge (`{ message, description }`-Form) – diese verwenden Dokumente (`docs[].docusaurusCatalogDir` + `JsonExtractor` innerhalb von `translate-docs`).
- **Nicht** für `t()`-UI-Strings – UI-Strings (`strings.json` + flache Bundles).
- CLI: `translate-json`; Orchestrierung in `src/cli/translate-json-run.ts`. Init-Vorlage: `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## Gemeinsame Infrastruktur

<a id="llmclient"></a>
### `LlmClient`

Anbieterunabhängiger Chat-Client, der auf dem Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`) basiert. Er ermittelt den aktiven Anbieter aus `provider` / `providers`, erstellt einen OpenAI-kompatiblen Client (`createOpenAICompatible`) für die `baseUrl` + API-Schlüssel des jeweiligen Anbieters und leitet alle Aufrufe über `generateText`. `OpenRouterClient` bleibt als veralteter Alias erhalten. Wichtige Verhaltensweisen:

- **Modell-Fallback**: Versucht nacheinander jedes Modell in der aufgelösten Liste; bei Anforderungs- oder Analysefehlern wird auf das nächste zurückgegriffen. Jedes Ziel-Locale erhält eine eigene aufgelöste Kette: zuerst `localeModels(locale)`, falls konfiguriert, dann `uiModels` (nur UI-Pipelines), dann `translationModels`. Dokument-, JSON- und SVG-Übersetzungen erstellen einen Client pro Locale mit der Nicht-UI-Kette. Der Befehl `bench-models` erstellt stattdessen einen Single-Model-Client pro konfigurierter ID (Vereinigung von `translationModels`, `uiModels` und `localeModels`; `translationModels: [id]`, kein Fallback), sodass Zeit und Preis für jedes Modell unabhängig gemessen werden können.
- **Anforderungs-Timeout**: `requestTimeout` (Sekunden) oder `requestTimeoutMs` beim aktiven Provider, andernfalls gelten die gleichen Schlüssel am Anfang der Konfiguration (Standard 45 Sekunden); bricht jede Anforderung über `AbortSignal.timeout` ab. Der gleiche Wert gilt für `GET /models`, wenn die CLI eine Modellliste eines Providers für `check-models` (beliebiger Provider) lädt. Der optionale Pre-Flight-Filter, der unbekannte Modell-IDs verwirft, wird nur ausgeführt, wenn der aktive Provider OpenRouter ist.
- **OpenRouter-Extras** (nur wenn `openrouter` aktiv ist): Durchsatz-Routing über das Anforderungsfeld `provider` sowie die Header `HTTP-Referer` / `X-Title`. Die Token-Nutzung wird für jeden Provider gemeldet. OpenRouter und Cheaper Inference geben zudem einen abgerechneten USD-Betrag zurück (`usage.cost`; Cheaper Inference greift auf `cheaper_inference.billing.billed_cost_usd` zurück). Wenn der Provider diesen Betrag nicht angibt, werden die USD-Kosten aus `providers.<name>.modelPricing` berechnet, dann aus dem providerweiten Standardwert `pricing`, dann aus der Listenpreis-Liste für Eingabe und Ausgabe von models.dev, und in der Zeile `api_calls` gespeichert. Ein vom Provider gemeldeter Betrag (einschließlich `0`) wird niemals ersetzt. Unbekannte Kosten bleiben nicht gesetzt. Die Preisberechnung eines Aufrufs liest nur den models.dev-Ausschnitt von `<cacheDir>/benchmark-scores.json`; languagebench oder die Arena-Datei werden nicht heruntergeladen.
- **Debug-Traffic-Protokoll**: Wenn `debugTrafficFilePath` gesetzt ist, werden Anforderungs- und Antwort-JSON an eine Datei angehängt (programmatisch). Die CLI `--debug-failed` schreibt `FAILED-TRANSLATION`-Dateien unter `cacheDir` mit dem System-/Benutzer-Prompt, der rohen Antwort des Assistenten und Validierungsfehlern für fehlgeschlagene UI-, Dokument-, JSON- und SVG-Übersetzungsprüfungsversuche. Fehler bei der Provider-API oder bei leerem Body werden auf der Konsole ausgegeben, anstatt eine Datei nur mit dem Prompt zu erstellen.

`suggest-models` und die Registerkarte „Modelle“ im Dashboard rufen das LLM nicht auf. Sie stufen den Chat-Katalog des aktiven Anbieters anhand von languagebench ChrF, dem LMArena Arena Score und den Preisen von models.dev ein und ersetzen dann optional `providers.<name>.translationModels`. Aggregate befinden sich in `<cacheDir>/benchmark-scores.json`. Siehe [KI-Modelle](/de/guide/ai-models) und [suggest-models](/de/reference/cli-commands/models#suggest-models).

<a id="config-loading"></a>
### Laden der Konfiguration

`loadI18nConfigFromFile(configPath, cwd)`-Pipeline:

1. `ai-i18n-tools.config.json` (JSON) lesen und parsen.
2. `mergeWithDefaults` – tiefes Zusammenführen mit `defaultI18nConfigPartial` und Zusammenführen aller `docs[].sourceFiles`-Einträge in `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` – `targetLocales` in ein Array umwandeln und pfadähnliche Einträge ablehnen (müssen BCP-47-Codes sein, kein Pfad zu `ui-languages.json`); `languagesManifestPath` ist standardmäßig `{ui.flatOutputDir}/ui-languages.json` während `mergeWithDefaults`.
4. `expandDocumentationTargetLocalesInRawInput` – dasselbe für jeden `docs[].targetLocales`-Eintrag.
5. `expandJsonTargetLocalesInRawInput` – dasselbe für jeden `json[].targetLocales`-Eintrag.
6. `parseI18nConfig` – Zod-Validierung + `validateI18nBusinessRules`.
7. `applyProviderOverrideToRawInput` – wenn `-P` / `--provider` über die CLI übergeben wird.
8. `applyEnvOverrides` – wendet `OPENROUTER_BASE_URL`, `OLLAMA_BASE_URL`, `I18N_SOURCE_LOCALE` und `I18N_TARGET_LOCALES` an, wenn gesetzt (API-Schlüssel werden separat pro Anbieter innerhalb von `LlmClient` aufgelöst).
9. `augmentConfigWithUiLanguagesMaster` – Manifest-Anzeigenamen aus dem gebündelten Masterkatalog anhängen.
10. `assertEffectiveLocalesInUiLanguagesMaster` – Gebietsschema-Codes bei Bedarf gegen den Masterkatalog validieren.

`init` erstellt Starter-Konfigurationen aus `initConfigTemplates`: `ui-markdown` (UI-Strings plus einen flachen README-Block), `docs-markdown` (nur README und Markdown), `ui-docusaurus`, `ui-starlight`, `ui-vitepress` (VitePress-Dokumentation + `vitepressThemeCatalog`), `ui-nextra` (Nextra-Dokumentation + `nextraDictionaryPath`), `ui-astro-website` (einfache Astro-UI; fügen Sie `docs[]` für `.astro`-Seitenübersetzung hinzu), `ui-json-bundles` (nur JSON `json[]`), `ui-python`, `ui-python-gettext`, `ui-python-django` und `ui-python-flask`. `--with-readme` fügt denselben README-Block an jede Vorlage an, die nicht bereits `README.md` auflistet, und schaltet `translateDocs` ein. Siehe [UI-Strings — Initialisieren](/de/guide/ui-strings/#step-1-initialise), [Fügen Sie i18n zu Ihren README- und Markdown-Dokumenten hinzu](/de/guide/add-i18n-to-readme) und [Python-Anwendungen](/de/guide/ui-strings/python).

<a id="logger"></a>
### Protokollierung (Logger)

`Logger` unterstützt die Stufen `debug`, `info`, `warn`, `error` mit ANSI-Farbgebung. Der ausführliche Modus (`-v`) aktiviert `debug`. Wenn `logFilePath` gesetzt ist, werden Log-Zeilen zusätzlich in diese Datei geschrieben.

<a id="self-localisation-tool-ui"></a>
### Selbstlokalisierung (Tool-UI)

Das Tool lokalisiert seine eigene Benutzeroberfläche — CLI-Hilfe, häufige Protokoll-/Zusammenfassungs-/Fehlermeldungen und das Übersetzungs-Dashboard — getrennt von den Inhalten, die es für Sie übersetzt.

- **Gebietsschema-Auflösung** (`resolveUiLocale` in `src/core/ui-locale.ts`): wählt das UI-Gebietsschema aus `-L` / `--ui-lang` > `AI_I18N_LANG` > Konfigurations-`uiLanguage` > Host-Betriebssystem-Gebietsschema (`Intl.DateTimeFormat().resolvedOptions().locale`). Der Kandidat wird normalisiert und exakt oder nach der nächstgelegenen Variante mit dem ausgelieferten Bundle-Set abgeglichen (z. B. `pt-PT` → `pt-BR`, `en-US` → `en-GB`), wobei auf das Quellgebietsschema (`en-GB`) zurückgegriffen wird. Die CLI löst einmal auf, bevor die Hilfe erstellt wird (Pre-Parse-Argv-Scan), und erneut nach dem Laden der Konfiguration, damit `uiLanguage` angewendet wird (das Flag und die Umgebungsvariable haben weiterhin Vorrang).
- **Laufzeit** (`src/i18n/index.ts`): ein minimales `t(source, vars)` mit <code v-pre>{{name}}</code>-Interpolation, indiziert durch die englische Quellzeichenfolge gegen flache pro-Gebietsschema-Bundles in `src/i18n/locales/<code>.json` (beim Build nach `dist/i18n/locales` kopiert). Fehlende Schlüssel oder Bundles geben den Quelltext zurück. Dies ist dasselbe Schlüssel-als-Standard-Modell wie bei UI-Strings — es gibt keinen Hash-Lookup.
- **Dashboard**: der Server stellt `GET /api/ui-i18n` bereit, das `{ locale, dir, bundle }` für das aufgelöste UI-Gebietsschema zurückgibt; das Frontend setzt `<html lang>` / `dir` und lokalisiert statisches Markup über `data-i18n*`-Attribute.
- **Dogfooding**: die Bundles werden von `pnpm i18n:self` (`sync-ui --ui-block src/i18n/strings.json`) erstellt, das den `ui`-Block der CLI und des Dashboards in `ai-i18n-tools.config.json` extrahiert und übersetzt. Katalogschlüssel stammen von `t()`-Aufrufen über `src/cli/` und `src/i18n/` sowie den `data-i18n*`-Markierungen des Dashboards in `src/dashboard-app/index.html`.

---

<a id="extension-points"></a>
## Erweiterungspunkte

<a id="custom-function-names-ui-extraction"></a>
### Benutzerdefinierte Funktionsnamen (UI-Extraktion)

Fügen Sie nicht standardmäßige Übersetzungsfunktionsnamen über die Konfiguration hinzu:

```json
{
  "ui": {
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro", ".html"],
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder", "data-i18n-alt", "data-i18n-aria-label"]
    }
  }
}
```

(`ui.reactExtractor` ist ein vollständig unterstützter Alias für `ui.uiExtractor`.)

Fügen Sie `.html` / `.htm` zu `extensions` hinzu, um HTML-Markerattribute während `extract` zu scannen. `ui.uiExtractor.htmlI18nAttributes` ist optional und standardmäßig `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]`; `data-i18n` wird dem Element `textContent` zugeordnet und `data-i18n-<attr>` wird dem Wert des Attributs zugeordnet (z. B. `data-i18n-aria-label`).

<a id="custom-extractors"></a>
### Benutzerdefinierte Extraktoren

Implementieren Sie `ContentExtractor` aus dem Paket:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Registrieren Sie benutzerdefinierte Extraktoren, indem Sie die öffentlichen Extraktor-Klassen erweitern, die von `'ai-i18n-tools'` exportiert werden (zum Beispiel die Unterklasse `MarkdownExtractor`). Die CLI verbindet interne Extraktoren intern; es gibt keinen unterstützten tiefen Import von `doc-translate.ts`.

<a id="custom-output-paths"></a>
### Benutzerdefinierte Ausgabepfade

Verwenden Sie `docsOutput.pathTemplate` für jedes Datei-Layout:

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```

---

<a id="source-tree"></a>
## Quellbaum

<details>
<summary>Vollständiges <code>src/</code>-Layout (Dateiebene-Referenz)</summary>

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── mark-html.ts                `mark-html` command (insert bare `data-i18n*` markers into HTML)
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── bench-models.ts             `bench-models` command (per-model translate latency/token/cost benchmark)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── ui-locale.ts                Resolve the tool's own UI locale (flag/env/config/OS → shipped bundle)
│   ├── locale-utils.ts             BCP-47 normalisation, locale list parsing, script/Han-variant validation
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── html-i18n-marks.ts          HTML `data-i18n*` marker scanner + `mark-html` annotator
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── placeholder-integrity.ts    Pre/post-restore token sequence + tag-kind + invented {{IDENT}} checks
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   ├── matcher.ts                  Term hint extraction for prompts
│   └── translation-context.ts      contextFiles loader and guidance fingerprints
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── i18n/                           Self-localisation runtime for the tool's own UI
│   ├── index.ts                    t(source, vars) + bundle/manifest loaders (keyed by English source string)
│   └── locales/                    Shipped UI bundles (de.json, es.json, …; generated by `pnpm i18n:self`)
│
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    ├── table.ts                    Display-width aware table rendering (CJK/emoji column alignment)
    ├── load-dotenv.ts              Auto-load `.env` from the cwd at CLI startup (never overrides existing env)
    └── ignore-parser.ts            .translate-ignore file parser
```

</details>
