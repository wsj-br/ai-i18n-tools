---
translation_last_updated: '2026-04-11T03:31:28.714Z'
source_file_mtime: '2026-04-11T03:30:13.297Z'
source_file_hash: cc126df0f102c515c7e7b274fcf133efca9733834d7836fbb6433cb58703842f
translation_language: de
source_file_path: docs-site/docs/package-overview.md
---
# ai-i18n-tools: Paketübersicht

Dieses Dokument beschreibt die interne Architektur von `ai-i18n-tools`, wie die einzelnen Komponenten zusammenpassen und wie die beiden Kern-Workflows implementiert sind.

Anweisungen zur praktischen Nutzung finden Sie unter [Erste Schritte](./getting-started.md).

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Architekturübersicht](#architecture-overview)
- [Quellbaum](#source-tree)
- [Workflow 1 - Interna der UI-Übersetzung](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Flache Lokalisierungsdateien](#flat-locale-files)
  - [UI-Übersetzungsanfragen](#ui-translation-prompts)
- [Workflow 2 - Interna der Dokumentübersetzung](#workflow-2---document-translation-internals)
  - [Extractoren](#extractors)
  - [Platzhalter-Schutz](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Auflösung des Ausgabepfads](#output-path-resolution)
  - [Umschreibung flacher Links](#flat-link-rewriting)
- [Gemeinsame Infrastruktur](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Konfigurationsladen](#config-loading)
  - [Protokollierung (Logger)](#logger)
- [Laufzeit-Hilfs-API](#runtime-helpers-api)
  - [RTL-Hilfsfunktionen](#rtl-helpers)
  - [i18next-Setup-Factorys](#i18next-setup-factories)
  - [Anzeigehilfen](#display-helpers)
  - [String-Hilfsfunktionen](#string-helpers)
- [Programmatische API](#programmatic-api)
- [Erweiterungspunkte](#extension-points)
  - [Benutzerdefinierte Funktionsnamen (UI-Extraktion)](#custom-function-names-ui-extraction)
  - [Benutzerdefinierte Extractoren](#custom-extractors)
  - [Benutzerdefinierte Ausgabepfade](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## Architekturübersicht {#architecture-overview}

```
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, translate-svg, translate-ui, sync, status, …
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

## Quellbaum {#source-tree}

```
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
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

## Workflow 1 - Interna der UI-Übersetzung {#workflow-1---ui-translation-internals}

```
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated: { de: "…" } } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation
```

### `UIStringExtractor` {#uistringextractor}

Verwendet `i18next-scanner`s `Parser.parseFuncFromString`, um `t("literal")`- und `i18n.t("literal")`-Aufrufe in beliebigen JS/TS-Dateien zu finden. Konfigurierbare Funktionsnamen und Dateierweiterungen. Segment-Hashes sind die **ersten 8 Hex-Zeichen des MD5-Hashs** der bereinigten Quellzeichenkette – diese werden zu den Schlüsseln in `strings.json`.

### `strings.json` {#stringsjson}

Der Hauptkatalog hat folgende Struktur:

```json
{
  "<md5-8>": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    }
  }
}
```

`extract` fügt neue Schlüssel hinzu und behält vorhandene Übersetzungen bei. `translate-ui` füllt fehlende `translated`-Einträge aus und schreibt flache Lokalisierungsdateien.

### Flache Lokalisierungsdateien {#flat-locale-files}

Jede Zielsprache erhält eine flache JSON-Datei (`de.json`), die Quelltext → Übersetzung abbildet:

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next lädt diese als Ressourcenbündel und sucht Übersetzungen über den Quelltext (Schlüssel-als-Standard-Modell).

### UI-Übersetzungsanfragen {#ui-translation-prompts}

`buildUIPromptMessages` erstellt System- und Benutzernachrichten, die:
- Die Ausgangs- und Zielsprache identifizieren (nach Anzeigenamen aus `localeDisplayNames` oder `ui-languages.json`).
- Ein JSON-Array mit Zeichenketten senden und ein JSON-Array mit Übersetzungen als Antwort anfordern.
- Glossarhinweise einbeziehen, falls verfügbar.

`OpenRouterClient.translateUIBatch` versucht nacheinander jedes Modell in `translationModels`, mit Fallback bei Parse- oder Netzwerkfehlern.

---

## Workflow 2 - Interna der Dokumentübersetzung {#workflow-2---document-translation-internals}

```
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

### Extraktoren {#extractors}

Alle Extraktoren erweitern `BaseExtractor` und implementieren `extract(content, filepath): Segment[]`.

- **`MarkdownExtractor`** – teilt Markdown in typisierte Segmente auf: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Nicht zu übersetzende Segmente (Codeblöcke, rohes HTML) werden wortwörtlich beibehalten.
- **`JsonExtractor`** – extrahiert Zeichenkettenwerte aus Docusaurus JSON-Beschriftungsdateien.
- **`SvgExtractor`** – extrahiert den Inhalt von `<text>`- und `<title>`-Elementen aus SVG (wird von `translate-svg` für Assets unter `config.svg` verwendet, nicht von `translate-docs`).

### Platzhalter-Schutz {#placeholder-protection}

Vor der Übersetzung wird empfindliche Syntax durch undurchsichtige Token ersetzt, um LLM-Beschädigungen zu verhindern:

1. **Hinweis-Marker** (`:::note`, `:::`) – werden mit exakt dem ursprünglichen Text wiederhergestellt.
2. **Dok-Anker** (HTML `<a id="…">`, Docusaurus-Überschrift `{#…}`) – werden wortwörtlich beibehalten.
3. **Markdown-URLs** (`](url)`, `src="…"`) – werden nach der Übersetzung aus einer Zuordnung wiederhergestellt.

### Cache (`TranslationCache`) {#cache-translationcache}

SQLite-Datenbank (über `node:sqlite`) speichert Zeilen, die durch `(source_hash, locale)` gekennzeichnet sind, mit `translated_text`, `model`, `filepath`, `last_hit_at` und verwandten Feldern. Der Hash ist die ersten 16 Hex-Zeichen des SHA-256-Hashs des normalisierten Inhalts (Leerzeichen zusammengefasst).

Bei jedem Durchlauf werden Segmente anhand von Hash × locale abgerufen. Nur Cache-Misses werden an das LLM übermittelt. Nach der Übersetzung wird `last_hit_at` für Segmente zurückgesetzt, die nicht berührt wurden – `cleanup` entfernt veraltete Zeilen (null `last_hit_at` / leerer filepath) und verwaiste Zeilen, deren Quelldatei nicht mehr existiert; dabei wird zuerst `cache.db` gesichert, es sei denn, `--no-backup` wird angegeben.

Der Befehl `translate-docs` verwendet außerdem **Datei-Tracking**, sodass unveränderte Quellen mit vorhandenen Ausgaben vollständig übersprungen werden können. `--force-update` führt die Dateiverarbeitung erneut aus, nutzt aber weiterhin den Segment-Cache; `--force` löscht das Datei-Tracking und umgeht Lesevorgänge aus dem Segment-Cache für die API-Übersetzung. Siehe [Erste Schritte](./getting-started.md#cache-behaviour-and-translate-docs-flags) für die vollständige Flag-Tabelle.

### Auflösung des Ausgabepfads {#output-path-resolution}

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` ordnet einen quellbezogenen Pfad dem Ausgabepfad zu:

- **`nested`**-Stil (Standard): `{outputDir}/{locale}/{relPath}` für Markdown.
- **`docusaurus`**-Stil: unter `docsRoot` verwenden die Ausgaben `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; Pfade außerhalb von `docsRoot` fallen auf das verschachtelte Layout zurück.
- **`flat`**-Stil: `{outputDir}/{stem}.{locale}{extension}` (mit optionalem `flatPreserveRelativeDir`).
- **Benutzerdefinierte** `pathTemplate`: beliebiges Layout unter Verwendung von `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

### Umwandlung flacher Links {#flat-link-rewriting}

Wenn `markdownOutput.style === "flat"`, werden übersetzte Markdown-Dateien neben der Quelle mit Sprachsuffixen abgelegt. Relative Links zwischen Seiten werden umgeschrieben, sodass `[Guide](./guide.md)` in `readme.de.md` auf `guide.de.md` verweist. Gesteuert durch `rewriteRelativeLinks` (automatisch aktiviert für flachen Stil ohne benutzerdefinierte `pathTemplate`).

---

## Gemeinsame Infrastruktur {#shared-infrastructure}

### `OpenRouterClient` {#openrouterclient}

Umhüllt die OpenRouter Chat-Completions-API. Wichtige Verhaltensweisen:

- **Modell-Fallback**: versucht nacheinander jedes Modell in `translationModels`; greift bei HTTP-Fehlern oder Parse-Fehlern zurück.
- **Ratenbegrenzung**: erkennt 429-Antworten, wartet `retry-after` (oder 2 Sekunden), versucht es einmal erneut.
- **Prompt-Caching**: Systemnachricht wird mit `cache_control: { type: "ephemeral" }` gesendet, um Prompt-Caching bei unterstützten Modellen zu aktivieren.
- **Debug-Verkehrsprotokoll**: falls `debugTrafficFilePath` gesetzt ist, werden Anfrage- und Antwort-JSON an eine Datei angehängt.

### Laden der Konfiguration {#config-loading}

`loadI18nConfigFromFile(configPath, cwd)` Pipeline:

1. Lesen und Parsen von `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - Tiefe Zusammenführung mit `defaultI18nConfigPartial`.
3. `expandTargetLocalesFileReferenceInRawInput` - Wenn `targetLocales` ein Dateipfad ist, lade das Manifest und erweitere es auf Gebietsschemacode; setze `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` - Dasselbe für `documentation.targetLocales`.
5. `parseI18nConfig` - Zod-Validierung + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - Anwenden von `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE` usw.
7. `augmentConfigWithUiLanguagesFile` - Anhängen von Anzeigenamen aus dem Manifest.

### Logger {#logger}

`Logger` unterstützt die Ebenen `debug`, `info`, `warn`, `error` mit ANSI-Farbausgabe. Der Verbose-Modus (`-v`) aktiviert `debug`. Wenn `logFilePath` gesetzt ist, werden die Logzeilen auch in diese Datei geschrieben.

---

## Runtime-Hilfsfunktionen-API {#runtime-helpers-api}

Diese werden aus `'ai-i18n-tools/runtime'` exportiert und funktionieren in jeder JavaScript-Umgebung (Browser, Node.js, Deno, Edge). Sie importieren **nicht** von `i18next` oder `react-i18next`.

### RTL-Hilfsfunktionen {#rtl-helpers}

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### i18next-Setup-Factories {#i18next-setup-factories}

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### Anzeigehilfsfunktionen {#display-helpers}

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### Zeichenfolgehilfsfunktionen {#string-helpers}

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## Programmatische API {#programmatic-api}

Alle öffentlichen Typen und Klassen werden aus dem Pakethauptverzeichnis exportiert. Beispiel: Ausführen des Übersetzungs-UI-Schritts von Node.js aus ohne die CLI:

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
| `loadI18nConfigFromFile` | Laden, Zusammenführen, Validieren der Konfiguration aus einer JSON-Datei. |
| `parseI18nConfig` | Validieren eines rohen Konfigurationsobjekts. |
| `TranslationCache` | SQLite-Cache - Instanziieren mit einem `cacheDir`-Pfad. |
| `UIStringExtractor` | Extrahieren von `t("…")`-Zeichenfolgen aus JS/TS-Quellcode. |
| `MarkdownExtractor` | Extrahieren von übersetzbaren Segmenten aus Markdown. |
| `JsonExtractor` | Extrahieren aus Docusaurus-JSON-Etikettendateien. |
| `SvgExtractor` | Extrahieren aus SVG-Dateien. |
| `OpenRouterClient` | Stellen von Übersetzungsanfragen an OpenRouter. |
| `PlaceholderHandler` | Schützen/Wiederherstellen von Markdown-Syntax um Übersetzungen. |
| `splitTranslatableIntoBatches` | Gruppieren von Segmenten in LLM-skalierte Batches. |
| `validateTranslation` | Strukturelle Prüfungen nach der Übersetzung. |
| `resolveDocumentationOutputPath` | Auflösen des Ausgabedateipfads für ein übersetztes Dokument. |
| `Glossary` / `GlossaryMatcher` | Laden und Anwenden von Übersetzungsglossaren. |
| `runTranslateUI` | Programmatischer Einstiegspunkt für Übersetzungs-UI.

---

## Erweiterungspunkte {#extension-points}

### Benutzerdefinierte Funktionsnamen (UI-Extraktion) {#custom-function-names-ui-extraction}

Fügen Sie nicht-standardmäßige Übersetzungsfunktionsnamen über die Konfiguration hinzu:

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### Benutzerdefinierte Extraktoren {#custom-extractors}

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

Übergeben Sie ihn an die Dokumentations-Übersetzungs-Pipeline, indem Sie die Hilfsfunktionen `doc-translate.ts` programmatisch importieren.

### Benutzerdefinierte Ausgabepfade {#custom-output-paths}

Verwenden Sie `markdownOutput.pathTemplate` für jede Dateianordnung:

```json
{
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```
