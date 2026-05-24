<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: Paketübersicht

Dieses Dokument beschreibt die interne Architektur von `ai-i18n-tools`, wie die einzelnen Komponenten zusammenwirken und wie die beiden Kern-Workflows implementiert sind.

Anweisungen zur praktischen Nutzung finden Sie in [GETTING_STARTED.md](GETTING_STARTED.de.md). Für Screenshots und bebilderte SVGs in übersetzten Dokumenten siehe [LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.de.md).

<small>**In anderen Sprachen lesen:** </small>
<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [हिन्दी](./PACKAGE_OVERVIEW.hi.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [中文 (中国大陆)](./PACKAGE_OVERVIEW.zh-CN.md) · [中文 (台灣)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Architekturübersicht](#architecture-overview)
- [Quellbaum](#source-tree)
- [Workflow 1 – Interna der UI-Übersetzung](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Flache Sprachdateien](#flat-locale-files)
  - [UI-Übersetzungsanweisungen](#ui-translation-prompts)
- [Workflow 2 – Interna der Dokumentübersetzung](#workflow-2---document-translation-internals)
  - [Extractor](#extractors)
  - [Astro-Hybrid-Websites (UI + Seiten-HTML)](#astro-hybrid-sites-ui--page-html)
  - [Einfügen von Überschriftenankern (`write-heading-ids` CLI)](#heading-anchor-insertion-write-heading-ids-cli)
  - [Schutz von Platzhaltern](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Auflösung von Ausgabepfaden](#output-path-resolution)
  - [Umschreiben flacher Links](#flat-link-rewriting)
- [Gemeinsame Infrastruktur](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Konfigurationsladen](#config-loading)
  - [Protokollierungstool (Logger)](#logger)
- [Laufzeit-Hilfs-API](#runtime-helpers-api)
  - [RTL-Hilfsfunktionen](#rtl-helpers)
  - [i18next-Setup-Fabriken](#i18next-setup-factories)
  - [Anzeige-Hilfsfunktionen](#display-helpers)
  - [Zeichenketten-Hilfsfunktionen](#string-helpers)
- [Programmatische API](#programmatic-api)
- [Erweiterungspunkte](#extension-points)
  - [Benutzerdefinierte Funktionsnamen (UI-Extraktion)](#custom-function-names-ui-extraction)
  - [Benutzerdefinierte Extractoren](#custom-extractors)
  - [Benutzerdefinierte Ausgabepfade](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## Architekturübersicht

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, write-heading-ids, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express app for the Translation Dashboard (cache / glossary)
└── Utils (src/utils/)         - logger, hash, ignore parser
```

Alles, was Nutzer programmatisch benötigen könnten, wird aus `src/index.ts` neu exportiert.

---

<a id="source-tree"></a>
## Quellbaum

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
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
│   ├── locale-utils.ts             BCP-47 normalisation and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           JSON label file extraction
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   └── openrouter.ts               OpenRouter HTTP client with model fallback chain
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
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
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## Workflow 1 – Interna der UI-Übersetzung

```text
source files (JS/TS, optional `.astro`)
      │
      ▼  UIStringExtractor (i18next-scanner Parser; `.astro` via ui-string-babel.ts)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

<a id="uistringextractor"></a>
### `UIStringExtractor`

Verwendet `i18next-scanner` von `Parser.parseFuncFromString`, um `t("literal")`- und `i18n.t("literal")`-Aufrufe in JS/TS-Dateien zu finden. Für `.astro`-Quellen (wenn in `ui.uiExtractor.extensions` aufgelistet) analysiert `ui-string-babel.ts` Frontmatter und Template-`{expression}`-Blöcke mit `@babel/parser` und wendet dieselben `funcNames`-Regeln an. Funktionsnamen und Dateierweiterungen sind über `ui.uiExtractor` konfigurierbar (`ui.reactExtractor` ist ein unterstützter Alias). `extract` **führt auch Nicht-Scanner-Eingaben in denselben Katalog zusammen:** das Projekt `package.json` `description`, wenn `includePackageDescription` aktiviert ist (Standard), und jedes `englishName` aus `ui-languages.json`, wenn `includeUiLanguageEnglishNames` auf `true` steht und `uiLanguagesPath` gesetzt ist (Zeichenketten, die bereits im Quelltext vorhanden sind, haben Vorrang). Segment-Hashes sind die **ersten 8 Hex-Zeichen des MD5-Hashs** der bereinigten Quellzeichenkette – diese werden die Schlüssel in `strings.json`.

Einfache Astro-SSG-Sites können i18next überspringen: flaches `{locale}.json` zur Build-Zeit laden und `t('English')` über den Quelltext als Schlüssel auflösen (siehe `examples/astro-website/src/i18n/t.ts` und [GETTING_STARTED – Astro-Website](GETTING_STARTED.de.md#astro-website)).

<a id="stringsjson"></a>
### `strings.json`

Der Master-Katalog hat folgende Struktur:

```json
{
  "<md5-8>": {
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

`models` (optional) – pro Sprache, welches Modell die Übersetzung nach dem letzten erfolgreichen `translate-ui`-Lauf für diese Sprache erstellt hat (oder `user-edited`, wenn der Text aus dem Übersetzungs-Dashboard gespeichert wurde). `locations` (optional) – wo `extract` die Zeichenkette gefunden hat (Scanner + Paketbeschreibungszeile; `englishName`-Zeichenketten nur im Manifest können `locations` weglassen).

`extract` fügt neue Schlüssel hinzu und behält vorhandene `translated`-/`models`-Daten für Schlüssel bei, die weiterhin im Scan vorhanden sind (Scanner-Literale, optionale Beschreibung, optionales Manifest-`englishName`). `translate-ui` ergänzt fehlende `translated`-Einträge, aktualisiert `models` für die Sprachen, die es übersetzt, und schreibt flache Sprachdateien.

`ui-languages.json` **Manifest** – JSON-Array aus `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, Referenz `englishName`, `"ltr"` oder `"rtl"`). Verwenden Sie `generate-ui-languages`, um eine Projektdatei aus `sourceLocale` + `targetLocales` und dem gebündelten Master-`data/ui-languages-complete.json` zu erstellen.

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

- Identifizieren Sie die Ausgangs- und Zielsprache (nach Anzeigename aus `localeDisplayNames` oder `ui-languages.json`).
- Senden Sie ein JSON-Array mit Zeichenketten und fordern Sie ein JSON-Array mit Übersetzungen an.
- Geben Sie Glossarhinweise an, falls verfügbar.

`OpenRouterClient.translateUIBatch` versucht nacheinander jedes Modell, mit Fallback bei Parse- oder Netzwerkfehlern. Die CLI erstellt diese Liste aus `openrouter.translationModels` (oder veraltetem Standard-/Fallback); für `translate-ui` wird optionales `ui.preferredModel` vorangestellt, falls gesetzt (gegen den Rest dedupliziert).

---

<a id="workflow-2---document-translation-internals"></a>
## Workflow 2 – Interna der Dokumentenübersetzung

```text
markdown / MDX / JSON / `.astro` files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor / AstroTemplateExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── HTML tags, admonitions, anchors, MDX comments/JSX/braces,
                                URLs, inline code, emphasis masked as tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → OpenRouterClient.translateDocumentBatch
      │
      ▼  PlaceholderHandler.restoreAfterTranslation
final text  ──────────────────── placeholders restored
      │
      ▼  resolveDocumentationOutputPath
output file  ─────────────────── Docusaurus layout or flat layout
```

<a id="extractors"></a>
### Extraktoren

Alle Extraktoren erweitern `BaseExtractor` und implementieren `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` – teilt Markdown in typisierte Segmente auf: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. YAML-Frontmatter wird als **nicht übersetzbar** klassifiziert (`slug`, `id` und andere Routing-Schlüssel bleiben stabil). Top-Level-`export ...`-Blöcke (z. B. React-Komponentendefinitionen) werden als nicht übersetzbare `other`-Segmente klassifiziert, analog zur bestehenden `import ...`-Behandlung. Mehrzeilige Blöcke, die mit einem großgeschriebenen JSX-Tag beginnen (z. B. ein `<Tabs>`-Block), werden als übersetzbare Absätze klassifiziert. Nicht übersetzbare Segmente (Codeblöcke, rohes HTML) bleiben unverändert erhalten.
- `AstroTemplateExtractor` – Parse-and-Replace für `.astro`-Marketingseiten (`translate-docs` über `translateAstroFile` in `doc-translate.ts`). Extrahiert benutzerrelevante HTML-Textknoten und übersetzbare Attribute (`alt`, `title`, `aria-label`, `placeholder`) sowie String-Literale innerhalb von Template-`{expression}`-Blöcken, wenn sie benutzerseitig sichtbar sind. Frontmatter-TypeScript, `<script>`, `<style>`, geschützte Attribut-/Schlüsselwerte und Literale innerhalb von `t('…')` werden übersprungen. Bei der Neuzusammenstellung werden relative Importe angepasst, wenn die Ausgabepfade tiefer liegen (z. B. `src/pages/de/index.astro`). Siehe [GETTING_STARTED – Astro-Website-Seiten](GETTING_STARTED.de.md#astro-website-parse-and-replace).
- `JsonExtractor` – extrahiert String-Werte aus Docusaurus-JSON-Label-Dateien (Docusaurus-UI-Kataloge, nicht MDX-Inhalt).
- `SvgExtractor` – extrahiert `<text>`, `<title>` und `<desc>` aus SVG (verwendet von `translate-svg` für Dateien unter `config.svg`, nicht von `translate-docs`).

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro-Hybrid-Websites (UI + Seiten-HTML)

Einfache Astro-Anwendungen aktivieren oft **beide** Workflows in einer Konfiguration (Referenz: `examples/astro-website/`):

| Ebene | Mechanismus | Ausgabe |
|-------|-----------|--------|
| Vorlage-HTML | `AstroTemplateExtractor` + `translate-docs` | Pro-Lokalisierung `.astro` unter `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | Flaches `public/locales/{locale}.json` (Englischer Quelltext als Schlüssel) |

Der Befehl `sync` führt aktivierte Schritte in der Reihenfolge aus: **extract** dann **translate-ui** (wenn `features.translateUIStrings`) → optional **translate-svg** → **translate-docs** (außer bei `--no-docs`, `--no-ui` oder `--no-svg`). Die initiale Vorlage `ui-astro-website` richtet nur Workflow 1 ein; fügen Sie `docs[]` und `features.translateDocs` hinzu, um Seiten-HTML zu erhalten.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Einfügen von Überschrift-Ankern (`write-heading-ids` CLI)

Der Befehl `write-heading-ids` ist ein **lokaler, nicht-LLM** Vorbereitungsprozessor für Markdown-Dokumentation. Implementierung: `src/cli/write-heading-ids.ts` steuert die Dateierkennung; `src/markdown/write-heading-ids-core.ts` analysiert die Zeilen und fügt Anker ein.

Es erfordert eine gültige Konfiguration mit **mindestens einem `docs[]`-Block**. Für jeden Block sammelt es `.md`-/`.mdx`-Dateien unter `contentPaths`, wendet die `.translate-ignore`-Regeln des Projekts an (gleiche Idee wie bei der Dokumentenübersetzung) und kann optional auf einen Teilbaum mit `--path`/`--file` beschränken. Jede Datei wird mit `applyHeadingAnchorsToMarkdown` transformiert: Für jede **flache ATX-Überschrift** (`# …` bis `###### …`) außerhalb von Codeblöcken wird eine leere HTML-Zeile `<a id="slug"></a>` in die Zeile darüber eingefügt, falls diese fehlt oder veraltet ist. Slug-Algorithmen entsprechen gängigen Ökosystemen — `github` (Standard), `bitbucket`, `gitlab`, `pymdown` (optionale Unicode-Normalisierung / Prozent-Codierung), `azure-devops` —, sodass Anker-IDs mit bestehenden Tools kompatibel bleiben (doctoc, PyMdown usw.). `--dry-run` meldet potenzielle Änderungen, ohne sie zu schreiben.

Dieser Befehl wird **nicht** innerhalb von `translate-docs` oder `sync` ausgeführt; führen Sie ihn explizit aus, wenn Sie stabile Fragment-IDs in den Quelldateien vor der Übersetzung oder Veröffentlichung benötigen.

<a id="placeholder-protection"></a>
### Platzhalter-Schutz

Vor der Übersetzung wird empfindliche Syntax durch undurchsichtige Token ersetzt, um LLM-Beschädigungen zu verhindern. Die Ersetzung erfolgt in dieser Reihenfolge (die Wiederherstellung erfolgt umgekehrt):

1. **HTML-Tags und -Kommentare** (`<strong>`, `<!-- ... -->` usw.) – Kleinbuchstaben-HTML-Tags aus einer bekannten Zulassungsliste werden durch `{{HTM_N}}`-Token ersetzt. Großgeschriebene JSX-Tags (`<Highlight>`, `<Tabs>`, `</Tab>`) werden separat durch die MDX-Schicht (Schritt 4) behandelt.
2. **Hinweis-Marker** (`:::note`, `:::`) – nur das Direktiv-Präfix in der öffnenden Zeile wird durch `{{ADM_OPEN_N}}` ersetzt; etwaige Titel in derselben Zeile verbleiben zur Übersetzung durch das Modell. Die Wiederherstellung erfolgt mit exaktem Originaltext.
3. **Dok-Anker** (HTML `<a id="…">`, Docusaurus-Überschrift `{#…}`) – bleiben unverändert erhalten.
4. **Nur-MDX-Konstrukte** (`src/processors/mdx-placeholders.ts`):
   - **MDX-Kommentare** (`{/* … */}`, einschließlich der Docusaurus heading-id-Form `{/* #my-id */}`) werden durch `{{MDX_N}}` ersetzt.
   - **Großgeschriebene JSX-Tags** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) – bleiben als `{{MDX_N}}` erhalten, wobei übersetzbare String-Attribute (`label`, `tooltip`, `aria-label`) innerhalb des Tags in `{{JXA_N}}` umgeschrieben werden, es sei denn, der Attributname steht in `docs[].protectAttributes`; `label:` innerhalb von `<Tabs values={[ { label: '…' } ]}>` Objektliteralen (optional überspringbar via `docs[].protectKeys`) und `<TabItem value="…">` (wenn kein `label`-Attribut existiert, wobei kleingeschriebene, slug-ähnliche Werte übersprungen werden) werden ebenfalls extrahiert. An das Segment als `||JXA_N: …||`-Zeilen angehängt und später von `restoreMdx` wieder zusammengeführt.
   - **MDX-Geschweifte Ausdrücke** (`{frontMatter.title}`, `style={{…}}`) – tiefenbewusste Abgleichung, ersetzt durch `{{MDX_N}}`.
5. **Markdown-URLs** (`](url)`, `src="../../docs/…"`) – werden nach der Übersetzung aus einer Zuordnung wiederhergestellt.
6. **Inline-Code-Abschnitte** (`` `code` ``) und **fett formatierte Inline-Codes** (`**`code`**`) – bleiben erhalten.
7. **Markdown-Hervorhebungen** (optional, automatisch aktiviert für CJK-/RTL-Lokalisierungen) – Hervorhebungs-Trennzeichen werden maskiert.

Der gemeinsame Schutz von Attributen/Schlüsseln für Astro-Vorlagen und MDX-JSX wird in `src/processors/expression-attribute-protection.ts` implementiert und pro Block durch `docs[].protectAttributes` und `docs[].protectKeys` gesteuert (siehe [GETTING_STARTED — protectAttributes / protectKeys](GETTING_STARTED.de.md#protectattributes-protectkeys)).

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

SQLite-Datenbank (über `node:sqlite`) speichert Datensätze, die über `(source_hash, locale)` mit `translated_text`, `model`, `filepath`, `last_hit_at` und verwandten Feldern verknüpft sind. Der Hash ist die ersten 16 Hex-Zeichen des SHA-256-Hashs des normalisierten Inhalts (Leerzeichen zusammengefasst).

Bei jedem Durchlauf werden Segmente anhand von Hash × Gebietsschema nachgeschlagen. Nur Cache-Misses werden an das LLM weitergeleitet. Nach der Übersetzung wird `last_hit_at` für Segmentzeilen im aktuellen Übersetzungsbereich zurückgesetzt, die nicht getroffen wurden. `cleanup` führt zuerst `sync --force-update` aus, entfernt anschließend veraltete Segmentzeilen (null `last_hit_at` / leere Dateipfade), bereinigt `file_tracking`-Schlüssel, wenn der aufgelöste Quellpfad auf dem Datenträger fehlt (`doc-block:…`, `svg-files:…` usw.) und löscht Übersetzungszeilen, deren Metadaten-Dateipfad auf eine fehlende Datei verweist; dabei wird zuerst eine Sicherungskopie von `cache.db` angelegt, es sei denn, `--no-backup` wird übergeben.

Der Befehl `translate-docs` nutzt außerdem **Datei-Tracking**, sodass unveränderte Quellen mit vorhandenen Ausgaben die Verarbeitung vollständig überspringen können. `--force-update` führt die Dateiverarbeitung erneut aus, nutzt dabei aber weiterhin den Segment-Cache; `--force` löscht das Datei-Tracking und umgeht Lesezugriffe auf den Segment-Cache für API-Übersetzungen. Siehe [Erste Schritte](GETTING_STARTED.de.md#cache-behaviour-and-translate-docs-flags) für die vollständige Flag-Tabelle.

**Batch-Prompt-Format:** `translate-docs --prompt-format` wählt XML (`<seg>` / `<t>`) oder JSON-Array-/Objektformate nur für `OpenRouterClient.translateDocumentBatch`; Extraktion, Platzhalter und Validierung bleiben unverändert. Siehe [Batch-Prompt-Format](GETTING_STARTED.de.md#batch-prompt-format).

<a id="output-path-resolution"></a>
### Auflösung des Ausgabepfads

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` ordnet einen quellbezogenen Pfad dem Ausgabepfad zu:

- `nested`-Stil (Standard): `{outputDir}/{locale}/{relPath}` für Markdown.
- `doc-system`-Stil: unter `docsRoot`, verwenden Ausgaben `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`; Pfade außerhalb von `docsRoot` wechseln zum geschachtelten Layout. Aliase: `docusaurus` (Standard `localeSubpath` = Docusaurus-Plugin-Pfad), `astro-starlight` (Standard leer `localeSubpath`).
- `flat`-Stil: `{outputDir}/{stem}.{locale}{extension}`. Wenn `flatPreserveRelativeDir` auf `true` gesetzt ist, werden Quell-Unterverzeichnisse unter `outputDir` beibehalten.
- **Benutzerdefinierter** `pathTemplate`: beliebiges Markdown-Layout unter Verwendung von `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Benutzerdefinierter** `jsonPathTemplate`: separates benutzerdefiniertes Layout für JSON-Beschriftungsdateien, unter Verwendung derselben Platzhalter.
- `linkRewriteDocsRoot` hilft dem Umschreiber flacher Links, korrekte Präfixe zu berechnen, wenn die übersetzte Ausgabe nicht im standardmäßigen Projektstamm verwurzelt ist.

<a id="flat-link-rewriting"></a>
### Umsetzung flacher Links

Wenn `docsOutput.style === "flat"`, werden übersetzte Markdown-Dateien neben den Quelldateien mit Länderspezifischen Suffixen abgelegt. Relative Links zwischen Seiten werden umgeschrieben, sodass `[Guide](../../docs/guide.md)` in `readme.de.md` auf `guide.de.md` verweist. Gesteuert durch `rewriteRelativeLinks` (automatisch aktiviert für flachen Stil ohne benutzerdefiniertes `pathTemplate`). Derselbe Durchlauf fügt vor dem Ausführen von `postProcessing.regexAdjustments` jedem Dateipfad einen tiefebasierten Präfix zu den Nicht-Markdown-Asset-URLs hinzu – siehe [Anleitung zu lokalisierten Assets](LOCALE-ASSETS-GUIDE.de.md#the-flat-link-rewriter-and-two-step-flow).

---

<a id="shared-infrastructure"></a>
## Gemeinsame Infrastruktur

<a id="openrouterclient"></a>
### `OpenRouterClient`

Umhüllt die OpenRouter Chat Completions API. Wichtige Verhaltensweisen:

- **Modell-Fallback**: versucht nacheinander jedes Modell aus der aufgelösten Liste; greift bei HTTP-Fehlern oder Parse-Fehlern zurück. Bei vorhandener UI-Übersetzung werden zuerst `ui.preferredModel`, danach `openrouter`-Modelle verwendet.
- **Anfrage-Timeout**: `openrouter.requestTimeoutMs` (Standardwert: 30 Sekunden) bricht jede Chat-Vervollständigungsanfrage über `AbortSignal.timeout` ab. Derselbe Wert gilt für `GET /models`, wenn die CLI den Katalog lädt (z. B. `check-models` und den optionalen Pre-Flight-Filter, der unbekannte Modell-IDs entfernt).
- **Ratenbegrenzung**: erkennt 429-Antworten, wartet `retry-after` (oder 2 Sekunden) und versucht es einmal erneut.
- **Debug-Protokoll für Datenverkehr**: falls `debugTrafficFilePath` gesetzt ist, werden Anfrage- und Antwort-JSON an eine Datei angehängt.

<a id="config-loading"></a>
### Laden der Konfiguration

`loadI18nConfigFromFile(configPath, cwd)`-Pipeline:

1. Lese und analysiere `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` – tiefes Zusammenführen mit `defaultI18nConfigPartial` und Zusammenführen aller `docs[].sourceFiles`-Einträge in `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` – falls `targetLocales` ein Dateipfad ist, lade das Manifest und erweitere es zu Lokalisierungscodes; setze `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` – ebenso für jeden `docs[].targetLocales`-Eintrag.
5. `parseI18nConfig` – Zod-Validierung + `validateI18nBusinessRules`.
6. `applyEnvOverrides` – Anwendung von `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` – Anzeigenamen aus Manifest anhängen.

`init` schreibt Startkonfigurationen aus `initConfigTemplates`: `ui-markdown` (UI + optionales App-Markdown), `ui-docusaurus`, `ui-starlight`, `ui-astro-website` (reine Astro-UI; füge `docs[]` hinzu für `.astro`-Seitenübersetzung). Siehe [GETTING_STARTED — Initialise](GETTING_STARTED.de.md#step-1-initialise).

<a id="logger"></a>
### Protokollierung (Logger)

`Logger` unterstützt die Stufen `debug`, `info`, `warn`, `error` mit ANSI-Farbgebung. Der ausführliche Modus (`-v`) aktiviert `debug`. Wenn `logFilePath` gesetzt ist, werden Log-Zeilen zusätzlich in diese Datei geschrieben.

---

<a id="runtime-helpers-api"></a>
## Laufzeit-Hilfs-API

Diese werden aus `'ai-i18n-tools/runtime'` exportiert und funktionieren in jeder JavaScript-Umgebung (Browser, Node.js, Deno, Edge). Sie importieren **nicht** aus `i18next` oder `react-i18next`.

<a id="rtl-helpers"></a>
### RTL-Hilfsfunktionen

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next-Setup-Fabriken

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

Verwenden Sie `setupKeyAsDefaultT` als üblichen Anwendungseinstiegspunkt (Schlüsselbereinigung + Plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Der alleinige Aufruf von `wrapI18nWithKeyTrim` ist für die Anwendungsverdrahtung **veraltet**.

Erstellen Sie `localeLoaders` mit `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`, damit die Schlüssel nach `generate-ui-languages` mit `targetLocales` synchron bleiben. Siehe `docs/GETTING_STARTED.md` (Laufzeitverknüpfung), `examples/nextjs-app/`, `examples/console-app/` und `examples/astro-website/` (benutzerdefiniertes `makeT` ohne i18next).

<a id="display-helpers"></a>
### Anzeigehilfsfunktionen

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### Zeichenkettenhilfsfunktionen

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## Programmatische API

Alle öffentlichen Typen und Klassen werden aus der Paketwurzel exportiert. Beispiel: Ausführen des UI-Übersetzungsschritts aus Node.js heraus ohne die CLI:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Wichtige Exporte:

| Export | Beschreibung |
|---|---|
| `loadI18nConfigFromFile` | Lädt, fusioniert und validiert die Konfiguration aus einer JSON-Datei. |
| `parseI18nConfig` | Validiert ein rohes Konfigurationsobjekt. |
| `TranslationCache` | SQLite-Cache – Instanziierung mit einem `cacheDir` Pfad. |
| `UIStringExtractor` | Extrahiere `t("…")`-Zeichenketten aus JS/TS-Quellcode. |
| `MarkdownExtractor` | Extrahiere übersetzbare Segmente aus Markdown. |
| `JsonExtractor` | Aus Docusaurus JSON-Beschriftungsdateien extrahieren (Benutzeroberflächenkataloge, nicht MDX-Inhalt). |
| `SvgExtractor` | Extrahiere aus SVG-Dateien. |
| `OpenRouterClient` | Sende Übersetzungsanfragen an OpenRouter. |
| `PlaceholderHandler` | Schützt und stellt Markdown-Syntax um die Übersetzung herum wieder her (HTML-Tags, Hinweise, Anker, MDX-Kommentare/JSX/Geschweifte Klammern, URLs, Inline-Code, Hervorhebungen). |
| `protectMdx` / `restoreMdx` | Schützt und stellt MDX-Kommentare, JSX-Tags, geschweifte Ausdrücke und JSX-String-Attribute wieder her (wird von `PlaceholderHandler` aufgerufen; auch für direkte Nutzung exportiert). |
| `splitTranslatableIntoBatches` | Gruppiere Segmente in LLM-gerechte Batches. |
| `validateTranslation` | Strukturelle Prüfungen nach der Übersetzung. |
| `resolveDocumentationOutputPath` | Ermittle Ausgabedateipfad für ein übersetztes Dokument. |
| `Glossary` / `GlossaryMatcher` | Lade und wende Übersetzungsglossare an. |
| `runTranslateUI` | Programmatischer Einstiegspunkt für die Übersetzungs-UI. |

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
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro"]
    }
  }
}
```

(`ui.reactExtractor` ist ein vollständig unterstützter Alias für `ui.uiExtractor`.)

<a id="custom-extractors"></a>
### Benutzerdefinierte Extraktoren

Implementieren Sie `ContentExtractor` aus dem Paket:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Übergeben Sie ihn an die doc-translate-Pipeline, indem Sie `doc-translate.ts`-Hilfsfunktionen programmatisch importieren.

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
