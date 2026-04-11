---
translation_last_updated: '2026-04-11T01:50:10.397Z'
source_file_mtime: '2026-04-11T01:49:54.976Z'
source_file_hash: 2da126d2fe624a4d86e9a84e69d5128bea51a57be4b185213215d6b17c3fd83e
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
  - [Flache Sprachdateien](#flat-locale-files)
  - [UI-Übersetzungsanfragen](#ui-translation-prompts)
- [Workflow 2 - Interna der Dokumentübersetzung](#workflow-2---document-translation-internals)
  - [Extractoren](#extractors)
  - [Platzhalter-Schutz](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Auflösung des Ausgabepfads](#output-path-resolution)
  - [Umschreiben flacher Links](#flat-link-rewriting)
- [Gemeinsame Infrastruktur](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Konfigurationsladen](#config-loading)
  - [Protokollierung (Logger)](#logger)
- [Laufzeit-Hilfs-API](#runtime-helpers-api)
  - [RTL-Hilfsfunktionen](#rtl-helpers)
  - [i18next-Setup-Fabriken](#i18next-setup-factories)
  - [Anzeigehilfen](#display-helpers)
  - [Zeichenkettenhilfen](#string-helpers)
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

`extract` fügt neue Schlüssel hinzu und erhält bestehende Übersetzungen. `translate-ui` füllt fehlende `translated`-Einträge aus und schreibt flache Sprachdateien.

### Flache Sprachdateien {#flat-locale-files}

Jede Zielsprache erhält eine flache JSON-Datei (`de.json`), die Quellzeichenkette → Übersetzung abbildet:

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next lädt diese als Ressourcenbündel und sucht Übersetzungen anhand der Quellzeichenkette (Schlüssel-als-Standard-Modell).

### UI-Übersetzungsanfragen {#ui-translation-prompts}

`buildUIPromptMessages` erstellt System- und Benutzernachrichten, die:
- Die Ausgangs- und Zielsprache identifizieren (nach Anzeigenamen aus `localeDisplayNames` oder `ui-languages.json`).
- Ein JSON-Array von Zeichenketten senden und ein JSON-Array von Übersetzungen als Antwort anfordern.
- Glossarhinweise einbeziehen, falls verfügbar.

`OpenRouterClient.translateUIBatch` versucht nacheinander jedes Modell in `translationModels`, mit Fallback bei Analyse- oder Netzwerkfehlern.

---

## Workflow 2 - Interna der Dokumentübersetzung {#workflow-2---document-translation-internals}

```
markdown/MDX/JSON/SVG files
      │
      ▼  MarkdownExtractor / JsonExtractor / SvgExtractor
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

- **`MarkdownExtractor`** - teilt Markdown in getypte Segmente auf: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Nicht übersetzbare Segmente (Codeblöcke, roher HTML-Code) werden wörtlich beibehalten.
- **`JsonExtractor`** - extrahiert Zeichenfolgewerte aus Docusaurus-JSON-Labelfiles.
- **`SvgExtractor`** - extrahiert den Inhalt von `<text>`- und `<title>`-Elementen aus SVG.

### Platzhalter-Schutz {#placeholder-protection}

Vor der Übersetzung wird empfindliche Syntax durch undurchsichtige Token ersetzt, um eine Beschädigung durch LLM zu verhindern:

1. **Admonition-Marker** (`:::note`, `:::`) - mit dem genauen Originaltext wiederhergestellt.
2. **Dokumentenverknüpfungen** (HTML `<a id="…">`, Docusaurus-Überschrift `{#…}`) - wörtlich beibehalten.
3. **Markdown-URLs** (`](url)`, `src="…"`) - nach der Übersetzung aus einer Zuordnung wiederhergestellt.

### Cache (`TranslationCache`) {#cache-translationcache}

Eine SQLite-Datenbank (über `node:sqlite`) speichert `(source_hash, locale, translated_content, model, cost, last_hit_at)`. Der Hash ist die ersten 16 Hexadezimalzeichen des SHA-256-Hashwerts des normalisierten Inhalts (zusammengefasste Leerzeichen).

Bei jedem Lauf werden die Segmente nach Hash × Gebietsschema gesucht. Nur Cache-Misses gehen zum LLM. Nach der Übersetzung wird `last_hit_at` für Segmente, die nicht berührt wurden, zurückgesetzt - `cleanup` entfernt veraltete Zeilen (null `last_hit_at` / leerer Dateipfad) und verwaiste Zeilen, deren Quelldatei nicht mehr existiert; es sichert `cache.db` zuerst, es sei denn, `--no-backup` wird übergeben.

Der Befehl `translate-docs` verwendet auch **Datei-Tracking**, so dass unveränderte Quellen mit vorhandenen Ausgaben die Arbeit ganz überspringen können. `--force-update` führt die Dateiverabeitung erneut aus, verwendet aber weiterhin den Segmentcache; `--force` löscht das Datei-Tracking und umgeht das Lesen des Segmentcaches für die API-Übersetzung. Siehe [Erste Schritte](./getting-started.md#cache-behavior-and-translate-docs-flags) für die vollständige Flaggtabelle.

### Auflösung des Ausgabepfads {#output-path-resolution}

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` ordnet einen quelldateirelativem Pfad dem Ausgabepfad zu:

- **`docusaurus`**-Stil: `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`.
- **`flat`**-Stil: `{outputDir}/{stem}.{locale}{extension}` (mit optionalem `flatPreserveRelativeDir`).
- **Benutzerdefiniertes** `pathTemplate`: jedes Layout mit `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

### Flache Link-Umschreibung {#flat-link-rewriting}

Wenn `markdownOutput.style === "flat"`, werden übersetzte Markdown-Dateien neben der Quelle mit Gebietsschema-Suffixen platziert. Relative Links zwischen Seiten werden so umgeschrieben, dass `[Anleitung](./guide.md)` in `readme.de.md` auf `guide.de.md` verweist. Gesteuert durch `rewriteRelativeLinks` (für den flachen Stil ohne benutzerdefiniertes `pathTemplate` automatisch aktiviert).

---

## Gemeinsame Infrastruktur {#shared-infrastructure}

### `OpenRouterClient` {#openrouterclient}

Umhüllt die OpenRouter-Chat-Completions-API. Wichtige Verhaltensweisen:

- **Modell-Fallback**: versucht jedes Modell in `translationModels` der Reihe nach; fällt bei HTTP-Fehlern oder Parsing-Fehlern zurück.
- **Drosselung**: erkennt 429-Antworten, wartet `retry-after` (oder 2s), versucht es einmal erneut.
- **Prompt-Caching**: Systemnachricht wird mit `cache_control: { type: "ephemeral" }` gesendet, um das Prompt-Caching auf unterstützten Modellen zu aktivieren.
- **Debug-Verkehrsprotokoll**: wenn `debugTrafficFilePath` gesetzt ist, hängt JSON-Anfrage und -Antwort an eine Datei an.

### Konfigurationsladung {#config-loading}

`loadI18nConfigFromFile(configPath, cwd)`-Pipeline:

1. Lese und parse `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` – Tiefes Zusammenführen mit `defaultI18nConfigPartial`.
3. `expandTargetLocalesFileReferenceInRawInput` – Wenn `targetLocales` ein Dateipfad ist, lade das Manifest und erweitere es zu Locale-Codes; setze `uiLanguagesPath`.
4. `expandDocumentationTargetLocalesInRawInput` – dasselbe für `documentation.targetLocales`.
5. `parseI18nConfig` – Zod-Validierung + `validateI18nBusinessRules`.
6. `applyEnvOverrides` – Anwenden von `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE` usw.
7. `augmentConfigWithUiLanguagesFile` – Anhängen der Anzeigename aus dem Manifest.

### Logger {#logger}

`Logger` unterstützt die Ebenen `debug`, `info`, `warn`, `error` mit ANSI-Farbausgabe. Der ausführliche Modus (`-v`) aktiviert `debug`. Die Protokollierungsausgabe kann durch Übergabe von `logFilePath` in eine Datei dupliziert werden.

---

## API für Laufzeit-Hilfsfunktionen {#runtime-helpers-api}

Diese werden aus `'ai-i18n-tools/runtime'` exportiert und funktionieren in jeder JavaScript-Umgebung (Browser, Node.js, Deno, Edge). Sie importieren **nicht** aus `i18next` oder `react-i18next`.

### RTL-Hilfsfunktionen {#rtl-helpers}

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### i18next-Setup-Fabriken {#i18next-setup-factories}

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### Anzeige-Hilfsfunktionen {#display-helpers}

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### Zeichenketten-Hilfsfunktionen {#string-helpers}

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## Programmatische API {#programmatic-api}

Alle öffentlichen Typen und Klassen werden aus der Paketwurzel exportiert. Beispiel: Ausführen des Übersetzungsschritts für die Benutzeroberfläche aus Node.js heraus ohne die CLI:

```ts
import {
  loadI18nConfigFromFile,
  runTranslateUI,
  Logger,
} from 'ai-i18n-tools';

const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');
const logger = new Logger({ level: 'info' });

const summary = await runTranslateUI({
  config,
  cwd: process.cwd(),
  logger,
  apiKey: process.env.OPENROUTER_API_KEY,
});
console.log(`Translated ${summary.translated} strings across ${summary.locales} locales`);
```

Wichtige Exporte:

| Export | Beschreibung |
|---|---|
| `loadI18nConfigFromFile` | Lädt, fusioniert und validiert die Konfiguration aus einer JSON-Datei. |
| `parseI18nConfig` | Validiert ein rohes Konfigurationsobjekt. |
| `TranslationCache` | SQLite-Cache – Instanziierung mit einem `cacheDir`-Pfad. |
| `UIStringExtractor` | Extrahiert `t("…")`-Zeichenketten aus JS/TS-Quellcode. |
| `MarkdownExtractor` | Extrahiert übersetzbare Segmente aus Markdown. |
| `JsonExtractor` | Extrahiert aus Docusaurus JSON-Beschriftungsdateien. |
| `SvgExtractor` | Extrahiert aus SVG-Dateien. |
| `OpenRouterClient` | Sendet Übersetzungsanfragen an OpenRouter. |
| `PlaceholderHandler` | Schützt/stellt Markdown-Syntax um die Übersetzung herum wieder her. |
| `splitTranslatableIntoBatches` | Gruppiert Segmente in LLM-gerechte Batches. |
| `validateTranslation` | Strukturelle Prüfungen nach der Übersetzung. |
| `resolveDocumentationOutputPath` | Ermittelt den Ausgabedateipfad für ein übersetztes Dokument. |
| `Glossary` / `GlossaryMatcher` | Lädt und wendet Übersetzungsglossare an. |
| `runTranslateUI` | Programmatischer Einstiegspunkt für translate-UI. |

---

## Erweiterungspunkte {#extension-points}

### Benutzerdefinierte Funktionsnamen (UI-Extraktion) {#custom-function-names-ui-extraction}

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

Übergeben Sie ihn an die doc-translate-Pipeline, indem Sie die Hilfsfunktionen aus `doc-translate.ts` programmatisch importieren.

### Benutzerdefinierte Ausgabepfade {#custom-output-paths}

Verwenden Sie `markdownOutput.pathTemplate` für jedes gewünschte Dateilayout:

```json
{
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```
