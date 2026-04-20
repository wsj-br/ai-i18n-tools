<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: Paketübersicht

Dieses Dokument beschreibt die interne Architektur von `ai-i18n-tools`, wie die einzelnen Komponenten zusammenwirken und wie die beiden Kern-Workflows implementiert sind.

Für praktische Anweisungen zur Nutzung siehe [GETTING_STARTED.md](GETTING_STARTED.de.md).

<small>**In anderen Sprachen lesen:** </small>

<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [German](./PACKAGE_OVERVIEW.de.md) · [Spanish](./PACKAGE_OVERVIEW.es.md) · [French](./PACKAGE_OVERVIEW.fr.md) · [Hindi](./PACKAGE_OVERVIEW.hi.md) · [Japanese](./PACKAGE_OVERVIEW.ja.md) · [Korean](./PACKAGE_OVERVIEW.ko.md) · [Portuguese (BR)](./PACKAGE_OVERVIEW.pt-BR.md) · [Chinese (CN)](./PACKAGE_OVERVIEW.zh-CN.md) · [Chinese (TW)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

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
  - [Extraktoren](#extractors)
  - [Einfügen von Überschriftenankern (`write-heading-ids` CLI)](#heading-anchor-insertion-write-heading-ids-cli)
  - [Schutz von Platzhaltern](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Auflösung des Ausgabepfads](#output-path-resolution)
  - [Umschreibung flacher Links](#flat-link-rewriting)
- [Gemeinsame Infrastruktur](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Konfiguration laden](#config-loading)
  - [Protokollierungstool (Logger)](#logger)
- [Laufzeit-Hilfs-API](#runtime-helpers-api)
  - [RTL-Hilfsfunktionen](#rtl-helpers)
  - [i18next-Setup-Factorys](#i18next-setup-factories)
  - [Anzeige-Hilfsfunktionen](#display-helpers)
  - [Zeichenketten-Hilfsfunktionen](#string-helpers)
- [Programmatische API](#programmatic-api)
- [Erweiterungspunkte](#extension-points)
  - [Benutzerdefinierte Funktionsnamen (UI-Extraktion)](#custom-function-names-ui-extraction)
  - [Benutzerdefinierte Extraktoren](#custom-extractors)
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
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
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
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
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
│   ├── locale-utils.ts             BCP-47 normalization and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner)
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── json-extractor.ts           JSON label file extraction
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: admonitions → anchors → URLs
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
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
├── server/
│   └── translation-editor.ts       Express app for cache / strings.json / glossary editor
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
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
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

Verwendet `i18next-scanner`s `Parser.parseFuncFromString`, um `t("literal")`- und `i18n.t("literal")`-Aufrufe in jeder JS/TS-Datei zu finden. Funktionsnamen und Dateierweiterungen sind konfigurierbar. `extract` **führt auch Nicht-Scanner-Eingaben in denselben Katalog zusammen:** die Projekt-`package.json` `description`, wenn `reactExtractor.includePackageDescription` aktiviert ist (Standard), und jedes `englishName` aus `ui-languages.json`, wenn `reactExtractor.includeUiLanguageEnglishNames` auf `true` steht und `uiLanguagesPath` gesetzt ist (Zeichenketten, die bereits im Quellcode gefunden wurden, haben Vorrang). Segment-Hashes sind die **ersten 8 Hex-Zeichen des MD5-Hashs** der bereinigten Quellzeichenkette – diese werden die Schlüssel in `strings.json`.

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

`models` (optional) – pro Sprache, welches Modell die Übersetzung nach dem letzten erfolgreichen `translate-ui`-Lauf für diese Sprache erzeugt hat (oder `user-edited`, wenn der Text über die `editor`-Web-Oberfläche gespeichert wurde). `locations` (optional) – wo `extract` die Zeichenkette gefunden hat (Scanner + Paketbeschreibungszeile; für `englishName`-Zeichenketten, die nur im Manifest enthalten sind, kann `locations` fehlen).

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
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── URLs, admonitions, anchors replaced with tokens
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

- `MarkdownExtractor` – teilt Markdown in typisierte Segmente auf: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Nicht zu übersetzende Segmente (Codeblöcke, rohes HTML) werden wortwörtlich beibehalten.
- `JsonExtractor` – extrahiert Zeichenkettenwerte aus Docusaurus JSON-Beschriftungsdateien.
- `SvgExtractor` – extrahiert `<text>`, `<title>` und `<desc>` Inhalt aus SVG (verwendet von `translate-svg` für Assets unter `config.svg`, nicht von `translate-docs`).

<a id="heading-anchor-insertion-write-heading-ids"></a>
### Einfügen von Überschriften-Ankern (`write-heading-ids` CLI)

Der Befehl `write-heading-ids` ist ein **lokaler, nicht-LLM** Vorbereitungsprozessor für Markdown-Dokumentation. Implementierung: `src/cli/write-heading-ids.ts` steuert die Dateierkennung; `src/markdown/write-heading-ids-core.ts` analysiert die Zeilen und fügt Anker ein.

Er erfordert eine gültige Konfiguration mit **mindestens einem `documentations[]`-Block**. Für jeden Block sammelt er `.md`-/`.mdx`-Dateien unter `contentPaths`, wendet die `.translate-ignore`-Regeln des Projekts an (gleiche Idee wie bei der Dokumentenübersetzung) und kann optional auf einen Teilbaum mit `--path`/`--file` beschränkt werden. Jede Datei wird mit `applyHeadingAnchorsToMarkdown` transformiert: Für jede **flache ATX-Überschrift** (`# …` bis `###### …`) außerhalb von Codeblöcken wird eine leere HTML-Zeile `<a id="slug"></a>` in die Zeile darüber eingefügt, falls diese fehlt oder veraltet ist. Die Slug-Algorithmen entsprechen gängigen Umgebungen – `github` (Standard), `bitbucket`, `gitlab`, `pymdown` (optionale Unicode-Normalisierung/Prozentkodierung), `azure-devops` –, sodass die Anker-IDs mit bestehenden Tools kompatibel bleiben (doctoc, PyMdown usw.). `--dry-run` meldet potenzielle Änderungen, ohne sie zu schreiben.

Dieser Befehl wird **nicht** innerhalb von `translate-docs` oder `sync` ausgeführt; führen Sie ihn explizit aus, wenn Sie stabile Fragment-IDs in den Quelldateien vor der Übersetzung oder Veröffentlichung benötigen.

<a id="placeholder-protection"></a>
### Platzhalter-Schutz

Empfindliche Syntax wird vor der Übersetzung durch undurchsichtige Token ersetzt, um LLM-Beschädigungen zu verhindern:

1. **Hinweis-Markierungen** (`:::note`, `:::`) – werden mit exaktem Originaltext wiederhergestellt.
2. **Dok-Anker** (HTML `<a id="…">`, Docusaurus-Überschrift `{#…}`) – werden wortwörtlich beibehalten.
3. **Markdown-URLs** (`](url)`, `src="../…"`) – werden nach der Übersetzung aus einer Zuordnung wiederhergestellt.

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

SQLite-Datenbank (über `node:sqlite`) speichert Zeilen, die nach `(source_hash, locale)` indiziert sind, mit `translated_text`, `model`, `filepath`, `last_hit_at` und verwandten Feldern. Der Hash ist die ersten 16 Hex-Zeichen des SHA-256-Hashs des normalisierten Inhalts (Leerzeichen zusammengefasst).

Bei jedem Durchlauf werden Segmente nach Hash × Gebietsschema abgeglichen. Nur Cache-Misses werden an das LLM übermittelt. Nach der Übersetzung wird `last_hit_at` für Segmentzeilen im aktuellen Übersetzungsbereich, die nicht getroffen wurden, zurückgesetzt. `cleanup` führt zuerst `sync --force-update` aus, entfernt dann veraltete Segmentzeilen (null `last_hit_at` / leere Dateipfade), bereinigt `file_tracking` Schlüssel, wenn der aufgelöste Quellpfad auf dem Datenträger fehlt (`doc-block:…`, `svg-assets:…`, etc.), und entfernt Übersetzungszeilen, deren Metadaten-Dateipfad auf eine fehlende Datei verweist; es sichert zuerst `cache.db`, es sei denn, `--no-backup` wird übergeben.

Der Befehl `translate-docs` nutzt außerdem **Datei-Tracking**, sodass unveränderte Quellen mit vorhandenen Ausgaben die Verarbeitung vollständig überspringen können. `--force-update` führt die Dateiverarbeitung erneut aus, nutzt dabei aber weiterhin den Segment-Cache; `--force` löscht das Datei-Tracking und umgeht Lesezugriffe auf den Segment-Cache für API-Übersetzungen. Siehe [Erste Schritte](GETTING_STARTED.de.md#cache-behaviour-and-translate-docs-flags) für die vollständige Flag-Tabelle.

**Batch-Prompt-Format:** `translate-docs --prompt-format` wählt XML (`<seg>` / `<t>`) oder JSON-Array-/Objektformate nur für `OpenRouterClient.translateDocumentBatch`; Extraktion, Platzhalter und Validierung bleiben unverändert. Siehe [Batch-Prompt-Format](GETTING_STARTED.de.md#batch-prompt-format).

<a id="output-path-resolution"></a>
### Auflösung des Ausgabepfads

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` ordnet einen quellbezogenen Pfad dem Ausgabepfad zu:

- `nested`-Stil (Standard): `{outputDir}/{locale}/{relPath}` für Markdown.
- `docusaurus`-Stil: unter `docsRoot`, Ausgaben verwenden `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; Pfade außerhalb von `docsRoot` greifen auf das geschachtelte Layout zurück.
- `flat`-Stil: `{outputDir}/{stem}.{locale}{extension}`. Wenn `flatPreserveRelativeDir` auf `true` gesetzt ist, bleiben Quellunterverzeichnisse unter `outputDir` erhalten.
- **Benutzerdefinierter** `pathTemplate`: beliebiges Markdown-Layout unter Verwendung von `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Benutzerdefinierter** `jsonPathTemplate`: separates benutzerdefiniertes Layout für JSON-Beschriftungsdateien, unter Verwendung derselben Platzhalter.
- `linkRewriteDocsRoot` hilft dem Umschreiber flacher Links, korrekte Präfixe zu berechnen, wenn die übersetzte Ausgabe nicht im standardmäßigen Projektstamm verwurzelt ist.

<a id="flat-link-rewriting"></a>
### Umsetzung flacher Links

Wenn `markdownOutput.style === "flat"`, werden übersetzte Markdown-Dateien neben der Quelle mit Gebietsschemasuffixen abgelegt. Relative Links zwischen Seiten werden umgeschrieben, sodass `[Guide](../guide.md)` in `readme.de.md` auf `guide.de.md` verweist. Gesteuert durch `rewriteRelativeLinks` (automatisch aktiviert für flachen Stil ohne benutzerdefiniertes `pathTemplate`).

---

<a id="shared-infrastructure"></a>
## Gemeinsame Infrastruktur

<a id="openrouterclient"></a>
### `OpenRouterClient`

Umhüllt die OpenRouter Chat Completions API. Wichtige Verhaltensweisen:

- **Modell-Fallback**: versucht nacheinander jedes Modell aus der aufgelösten Liste; greift bei HTTP-Fehlern oder Analysefehlern zurück. Bei der UI-Übersetzung werden zunächst `ui.preferredModel` und anschließend `openrouter`-Modelle verwendet.
- **Ratenbegrenzung**: erkennt 429-Antworten, wartet `retry-after` (oder 2 Sekunden) und versucht es einmal erneut.
- **Debug-Verkehrsprotokoll**: falls `debugTrafficFilePath` gesetzt ist, werden Anfrage- und Antwort-JSON an eine Datei angehängt.

<a id="config-loading"></a>
### Laden der Konfiguration

`loadI18nConfigFromFile(configPath, cwd)`-Pipeline:

1. `ai-i18n-tools.config.json` lesen und parsen (JSON).
2. `mergeWithDefaults` – Tiefen-Zusammenführung mit `defaultI18nConfigPartial` und Zusammenführung aller `documentations[].sourceFiles`-Einträge in `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` – Wenn `targetLocales` ein Dateipfad ist, Manifest laden und auf Sprachcodes erweitern; `uiLanguagesPath` setzen.
4. `expandDocumentationTargetLocalesInRawInput` – dasselbe für jeden `documentations[].targetLocales`-Eintrag.
5. `parseI18nConfig` – Zod-Validierung + `validateI18nBusinessRules`.
6. `applyEnvOverrides` – Anwendung von `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, etc.
7. `augmentConfigWithUiLanguagesFile` – Anzeigenamen aus Manifest anhängen.

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

Erstellen Sie `localeLoaders` mit `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`, damit die Schlüssel nach `generate-ui-languages` mit `targetLocales` synchron bleiben. Siehe `docs/GETTING_STARTED.md` (Laufzeit-Verdrahtung) und `examples/nextjs-app/`/`examples/console-app/`.

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
| `JsonExtractor` | Extrahiere aus Docusaurus JSON-Beschriftungsdateien. |
| `SvgExtractor` | Extrahiere aus SVG-Dateien. |
| `OpenRouterClient` | Sende Übersetzungsanfragen an OpenRouter. |
| `PlaceholderHandler` | Schütze/Wiederherstellung der Markdown-Syntax während der Übersetzung. |
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
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

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

Verwenden Sie `markdownOutput.pathTemplate` für beliebige Datei-Layouts:

```json
{
  "documentations": [
    {
      "markdownOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
