# ai-i18n-tools: Paketübersicht

Dieses Dokument beschreibt die interne Architektur von `ai-i18n-tools`, wie jede Komponente zusammenpasst und wie die beiden Kernarbeitsabläufe implementiert sind.

Für praktische Nutzungshinweise siehe [GETTING_STARTED.md](GETTING_STARTED.de.md).

<small>**In anderen Sprachen lesen:** </small>

<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [German](./PACKAGE_OVERVIEW.de.md) · [Spanish](./PACKAGE_OVERVIEW.es.md) · [French](./PACKAGE_OVERVIEW.fr.md) · [Hindi](./PACKAGE_OVERVIEW.hi.md) · [Japanese](./PACKAGE_OVERVIEW.ja.md) · [Korean](./PACKAGE_OVERVIEW.ko.md) · [Portuguese (BR)](./PACKAGE_OVERVIEW.pt-BR.md) · [Chinese (CN)](./PACKAGE_OVERVIEW.zh-CN.md) · [Chinese (TW)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Architekturübersicht](#architecture-overview)
- [Quellbaum](#source-tree)
- [Workflow 1 - UI-Übersetzungsinternas](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Flache Lokalisierungsdateien](#flat-locale-files)
  - [UI-Übersetzungsaufforderungen](#ui-translation-prompts)
- [Workflow 2 - Dokumentenübersetzungsinternas](#workflow-2---document-translation-internals)
  - [Extraktoren](#extractors)
  - [Platzhalter-Schutz](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Ausgabepfadauflösung](#output-path-resolution)
  - [Flaches Link-Rewriting](#flat-link-rewriting)
- [Gemeinsame Infrastruktur](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [Konfigurationsladen](#config-loading)
  - [Logger](#logger)
- [Laufzeit-Hilfs-API](#runtime-helpers-api)
  - [RTL-Hilfen](#rtl-helpers)
  - [i18next-Setup-Fabriken](#i18next-setup-factories)
  - [Anzeigehilfen](#display-helpers)
  - [String-Hilfen](#string-helpers)
- [Programmierbare API](#programmatic-api)
- [Erweiterungspunkte](#extension-points)
  - [Benutzerdefinierte Funktionsnamen (UI-Extraktion)](#custom-function-names-ui-extraction)
  - [Benutzerdefinierte Extraktoren](#custom-extractors)
  - [Benutzerdefinierte Ausgabepfade](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## Architekturübersicht

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

Alles, was Verbraucher programmgesteuert benötigen könnten, wird von `src/index.ts` erneut exportiert.

---

## Quellbaum

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

## Workflow 1 - UI-Übersetzungsinternas

```
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

### `UIStringExtractor`

Verwendet `i18next-scanner` von `Parser.parseFuncFromString`, um `t("literal")`- und `i18n.t("literal")`-Aufrufe in jeder JS/TS-Datei zu finden. Funktionsnamen und Dateierweiterungen sind konfigurierbar. **`extract` fügt außerdem Nicht-Scanner-Eingaben in denselben Katalog ein:** die Projekt-`package.json`-`description`, wenn `reactExtractor.includePackageDescription` aktiviert ist (Standard), und jedes **`englishName`** aus `ui-languages.json`, wenn `reactExtractor.includeUiLanguageEnglishNames` `true` ist und `uiLanguagesPath` festgelegt ist (Zeichenketten, die bereits im Quellcode gefunden wurden, haben Vorrang). Segment-Hashes sind die **ersten 8 Hex-Zeichen des MD5** der bereinigten Quellzeichenkette – diese werden zu den Schlüsseln in `strings.json`.

### `strings.json`

Der Master-Katalog hat die Form:

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

`models` (optional) – je Sprachvariante, welches Modell die Übersetzung nach dem letzten erfolgreichen `translate-ui`-Lauf für diese Sprachvariante erstellt hat (oder `user-edited`, wenn der Text über die `editor`-Web-Oberfläche gespeichert wurde). `locations` (optional) – wo `extract` die Zeichenkette gefunden hat (Scanner + Paketbeschreibungszeile; für nur im Manifest enthaltene `englishName`-Zeichenketten kann `locations` weggelassen werden).

`extract` fügt neue Schlüssel hinzu und behält vorhandene `translated`-/`models`-Daten für Schlüssel bei, die weiterhin im Scan vorhanden sind (Scanner-Literale, optionale Beschreibung, optionales Manifest-`englishName`). `translate-ui` füllt fehlende `translated`-Einträge auf, aktualisiert `models` für die Sprachvarianten, die es übersetzt, und schreibt flache Sprachdateien.

**`ui-languages.json`-Manifest** – JSON-Array aus `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, Referenz `englishName`, `"ltr"` oder `"rtl"`). Verwenden Sie `generate-ui-languages`, um eine Projektdatei aus `sourceLocale` + `targetLocales` und dem gebündelten Master-`data/ui-languages-complete.json` zu erstellen.

### Flache Lokalisierungsdateien

Jede Zielsprache erhält eine flache JSON-Datei (`de.json`), die die Quellzeichenkette der Übersetzung zuordnet (ohne `models`-Feld):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next lädt diese als Ressourcenbündel und sucht Übersetzungen anhand des Quellstrings (key-as-default Modell).

### UI-Übersetzungsaufforderungen

`buildUIPromptMessages` erstellt System- + Benutzermeldungen, die:
- Die Quell- und Zielsprache identifizieren (nach Anzeigename aus `localeDisplayNames` oder `ui-languages.json`).
- Ein JSON-Array von Strings senden und ein JSON-Array von Übersetzungen anfordern.
- Glossarhinweise enthalten, wenn verfügbar.

`OpenRouterClient.translateUIBatch` versucht nacheinander jedes Modell, mit Fallback bei Parse- oder Netzwerkfehlern. Die CLI erstellt diese Liste aus `openrouter.translationModels` (oder veraltetem Standard-/Fallback); für `translate-ui` wird das optionale `ui.preferredModel` vorangestellt, falls gesetzt (Duplikate gegenüber dem Rest werden entfernt).

---

## Workflow 2 - Dokumentenübersetzungsinternas

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

### Extraktoren

Alle Extraktoren erweitern `BaseExtractor` und implementieren `extract(content, filepath): Segment[]`.

- `MarkdownExtractor` – teilt Markdown in typisierte Segmente auf: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. Nicht zu übersetzende Segmente (Codeblöcke, rohes HTML) werden wortwörtlich beibehalten.
- `JsonExtractor` – extrahiert Zeichenkettenwerte aus Docusaurus-JSON-Bezeichnungsdateien.
- `SvgExtractor` – extrahiert Inhalte aus `<text>`, `<title>` und `<desc>` aus SVG (verwendet von `translate-svg` für Assets unter `config.svg`, nicht von `translate-docs`).

### Platzhalter-Schutz

Vor der Übersetzung wird sensible Syntax durch undurchsichtige Tokens ersetzt, um eine Korruption durch LLM zu verhindern:

1. **Admonition-Markierungen** (`:::note`, `:::`) - werden mit dem genauen Originaltext wiederhergestellt.
2. **Dok-Links** (HTML `<a id="…">`, Docusaurus-Überschrift `{#…}`) - werden unverändert beibehalten.
3. **Markdown-URLs** (`](url)`, `src="../…"`) - werden nach der Übersetzung aus einer Zuordnung wiederhergestellt.

### Cache (`TranslationCache`)

Die SQLite-Datenbank (über `node:sqlite`) speichert Zeilen, die durch `(source_hash, locale)` indiziert sind, mit `translated_text`, `model`, `filepath`, `last_hit_at` und verwandten Feldern. Der Hash ist SHA-256 der ersten 16 hexadezimalen Zeichen des normalisierten Inhalts (Whitespace zusammengefasst).

Bei jedem Durchlauf werden Segmente nach Hash × Locale gesucht. Nur Cache-Fehlermeldungen gehen an das LLM. Nach der Übersetzung wird `last_hit_at` für Segmentzeilen im aktuellen Übersetzungsbereich zurückgesetzt, die nicht aufgerufen wurden. `cleanup` führt zuerst `sync --force-update` aus, entfernt dann veraltete Segmentzeilen (null `last_hit_at` / leeres filepath), kürzt `file_tracking`-Schlüssel, wenn der aufgelöste Quellpfad auf der Festplatte fehlt (`doc-block:…`, `svg-assets:…` usw.) und entfernt Übersetzungszeilen, deren Metadaten-Filepath auf eine fehlende Datei zeigt; es sichert zuerst `cache.db`, es sei denn, `--no-backup` wird übergeben.

Der Befehl `translate-docs` verwendet auch **Dateitracking**, sodass unveränderte Quellen mit vorhandenen Ausgaben die Arbeit vollständig überspringen können. `--force-update` führt die Dateiverarbeitung erneut aus, während der Segmentcache weiterhin verwendet wird; `--force` löscht das Dateitracking und umgeht die Lesevorgänge des Segmentcaches für die API-Übersetzung. Siehe [Getting Started](GETTING_STARTED.de.md#cache-behaviour-and-translate-docs-flags) für die vollständige Flaggenübersicht.

**Batch-Aufforderungsformat:** `translate-docs --prompt-format` wählt XML (`<seg>` / `<t>`) oder JSON-Array/-Objekt-Formen ausschließlich für `OpenRouterClient.translateDocumentBatch`; Extraktion, Platzhalter und Validierung bleiben unverändert. Siehe [Batch-Aufforderungsformat](GETTING_STARTED.de.md#batch-prompt-format).

### Auflösung des Ausgabepfads

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` ordnet einen quellenrelativen Pfad dem Ausgabepfad zu:

- `nested`-Stil (Standard): `{outputDir}/{locale}/{relPath}` für Markdown.
- `docusaurus`-Stil: unter `docsRoot` verwenden die Ausgaben `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`; Pfade außerhalb von `docsRoot` fallen auf das verschachtelte Layout zurück.
- `flat`-Stil: `{outputDir}/{stem}.{locale}{extension}`. Wenn `flatPreserveRelativeDir` auf `true` gesetzt ist, werden Quellunterverzeichnisse unter `outputDir` beibehalten.
- **Benutzerdefiniert** `pathTemplate`: beliebiges Markdown-Layout unter Verwendung von `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.
- **Benutzerdefiniert** `jsonPathTemplate`: separates benutzerdefiniertes Layout für JSON-Bezeichnungsdateien, mit denselben Platzhaltern.
- `linkRewriteDocsRoot` hilft dem flachen Link-Umschreiber, korrekte Präfixe zu berechnen, wenn die übersetzte Ausgabe an einer anderen Stelle als der standardmäßigen Projektwurzel verankert ist.

### Flaches Link-Umschreiben

Wenn `markdownOutput.style === "flat"`, werden übersetzte Markdown-Dateien neben der Quelle mit Lokalisierungssuffixen platziert. Relative Links zwischen Seiten werden umgeschrieben, sodass `[Guide](../guide.md)` in `readme.de.md` auf `guide.de.md` verweist. Gesteuert durch `rewriteRelativeLinks` (automatisch aktiviert für den flachen Stil ohne benutzerdefiniertes `pathTemplate`).

---

## Gemeinsame Infrastruktur

### `OpenRouterClient`

Umhüllt die OpenRouter-Chat-Vervollständigungs-API. Wichtige Verhaltensweisen:

- **Modell-Fallback**: versucht jedes Modell in der aufgelösten Liste der Reihe nach; fällt bei HTTP-Fehlern oder Parsing-Fehlern zurück. Die UI-Übersetzung löst zuerst `ui.preferredModel` auf, wenn vorhanden, dann die `openrouter`-Modelle.
- **Ratenbegrenzung**: erkennt 429-Antworten, wartet `retry-after` (oder 2s), und versucht es einmal erneut.
- **Prompt-Caching**: Die Systemnachricht wird mit `cache_control: { type: "ephemeral" }` gesendet, um das Prompt-Caching bei unterstützten Modellen zu aktivieren.
- **Debug-Verkehrsprotokoll**: Wenn `debugTrafficFilePath` gesetzt ist, werden Anforderungs- und Antwort-JSON in eine Datei angehängt.

### Konfigurationsladen

`loadI18nConfigFromFile(configPath, cwd)` Pipeline:

1. Lesen und Parsen von `ai-i18n-tools.config.json` (JSON).
2. `mergeWithDefaults` - tiefes Mergen mit `defaultI18nConfigPartial` und Mergen von Einträgen in `documentations[].sourceFiles` in `contentPaths`.
3. `expandTargetLocalesFileReferenceInRawInput` - wenn `targetLocales` ein Dateipfad ist, das Manifest laden und in Locale-Codes erweitern; `uiLanguagesPath` setzen.
4. `expandDocumentationTargetLocalesInRawInput` - dasselbe für jeden Eintrag in `documentations[].targetLocales`.
5. `parseI18nConfig` - Zod-Validierung + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE` usw. anwenden.
7. `augmentConfigWithUiLanguagesFile` - Manifest-Anzeigenamen anhängen.

### Protokollierer

`Logger` unterstützt die Ebenen `debug`, `info`, `warn`, `error` mit ANSI-Farbausgabe. Der ausführliche Modus (`-v`) aktiviert `debug`. Wenn `logFilePath` gesetzt ist, werden Protokollzeilen auch in diese Datei geschrieben.

---

## Laufzeit-Hilfs-API

Diese werden aus `'ai-i18n-tools/runtime'` exportiert und funktionieren in jeder JavaScript-Umgebung (Browser, Node.js, Deno, Edge). Sie importieren **nicht** von `i18next` oder `react-i18next`.

### RTL-Hilfen

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### i18next Setup-Fabriken

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### Anzeigehilfen

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### String-Hilfen

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## Programmatic API

Alle öffentlichen Typen und Klassen werden aus dem Paketstamm exportiert. Beispiel: Ausführen des translate-UI-Schritts aus Node.js ohne die CLI:

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
| `loadI18nConfigFromFile` | Laden, Mergen, Validieren der Konfiguration aus einer JSON-Datei. |
| `parseI18nConfig` | Validieren eines rohen Konfigurationsobjekts. |
| `TranslationCache` | SQLite-Cache - mit einem `cacheDir`-Pfad instanziieren. |
| `UIStringExtractor` | Extrahieren von `t("…")`-Strings aus JS/TS-Quellcode. |
| `MarkdownExtractor` | Extrahieren von übersetzbaren Segmenten aus Markdown. |
| `JsonExtractor` | Extrahieren aus Docusaurus JSON-Label-Dateien. |
| `SvgExtractor` | Extrahieren aus SVG-Dateien. |
| `OpenRouterClient` | Übersetzungsanfragen an OpenRouter stellen. |
| `PlaceholderHandler` | Markdown-Syntax um die Übersetzung schützen/wiederherstellen. |
| `splitTranslatableIntoBatches` | Segmente in LLM-große Batches gruppieren. |
| `validateTranslation` | Strukturelle Überprüfungen nach der Übersetzung. |
| `resolveDocumentationOutputPath` | Ausgabedateipfad für ein übersetztes Dokument auflösen. |
| `Glossar` / `GlossarMatcher` | Übersetzungs-Glossare laden und anwenden. |
| `runTranslateUI` | Programmgesteuerter Einstiegspunkt für die Übersetzung der UI. |

---

## Erweiterungspunkte

### Benutzerdefinierte Funktionsnamen (UI-Extraktion)

Fügen Sie über die Konfiguration nicht-standardmäßige Übersetzungsfunktionsnamen hinzu:

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### Benutzerdefinierte Extraktoren

Implementiere `ContentExtractor` aus dem Paket:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Übergebe es an die doc-translate-Pipeline, indem du die `doc-translate.ts`-Hilfsprogramme programmgesteuert importierst.

### Benutzerdefinierte Ausgabepfade

Verwende `markdownOutput.pathTemplate` für jedes Dateilayout:

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
