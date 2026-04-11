---
translation_last_updated: '2026-04-11T01:50:05.170Z'
source_file_mtime: '2026-04-11T01:49:54.980Z'
source_file_hash: bbe062d908fc9ffb78ef01c82109ef171a341b28d31299b453571cb1324d5799
translation_language: de
source_file_path: docs-site/docs/context.md
---
# ai-i18n-tools: AI-Agenten-Kontext

Dieses Dokument vermittelt einem KI-Agenten das mentale Modell, die wichtigsten Entscheidungen und Muster, die erforderlich sind, um effektiv mit `ai-i18n-tools` zu arbeiten, ohne vorher jedes andere Dokument konsultieren zu müssen. Lesen Sie dies, bevor Sie Code- oder Konfigurationsänderungen vornehmen.

<!-- DOCTOC SKIP -->

---

## Was dieses Paket macht {#what-this-package-does}

`ai-i18n-tools` ist eine CLI und Bibliothek, die die Internationalisierung für JavaScript/TypeScript-Projekte automatisiert. Es:

1. **Extrahiert** UI-Texte aus dem Quellcode (`t("…")`-Aufrufe) in einen Hauptkatalog.
2. **Übersetzt** diesen Katalog und Dokumentationsdateien über LLMs (über OpenRouter).
3. **Erstellt** JSON-Dateien, die für i18next bereit für verschiedene Sprachen sind, sowie übersetzte Kopien von Markdown/SVG/JSON-Dokumenten.
4. **Exportiert Laufzeit-Helfer**, um i18next, RTL-Unterstützung und Sprachauswahl in jeder JS-Umgebung einzubinden.

Alles wird über eine einzige Konfigurationsdatei gesteuert: `ai-i18n-tools.config.json`.

---

## Zwei unabhängige Workflows {#two-independent-workflows}

| | Workflow 1 - UI-Texte | Workflow 2 - Dokumente |
|---|---|---|
| **Eingabe** | JS/TS-Quelldateien mit `t("…")`-Aufrufen | `.md`, `.mdx`, Docusaurus JSON-Beschriftungsdateien, `.svg` |
| **Ausgabe** | `strings.json` (Katalog) + flache JSON-Dateien pro Sprache (`de.json` usw.) | Übersetzte Kopien dieser Dateien an den konfigurierten Ausgabepfaden |
| **Cache** | `strings.json` selbst (bestehende Übersetzungen bleiben erhalten) | SQLite-Datenbank (`cacheDir`) – nur neue/geänderte Segmente werden an LLM gesendet |
| **Wichtiger Befehl** | `translate-ui` | `translate-docs` |
| **Sync-Befehl** | `sync` | `sync` |
| **Feature-Flags** | `extractUIStrings`, `translateUIStrings` | `translateMarkdown`, `translateJSON`, `translateSVG` |

Sie können unabhängig oder gemeinsam in derselben Konfiguration verwendet werden. **`sync`** führt nacheinander aus: `extract` (falls aktiviert), `translate-ui` (falls aktiviert, es sei denn `--no-ui`), `translate-svg`, wenn `config.svg` existiert (es sei denn `--no-svg`), dann `translate-docs` (es sei denn `--no-docs`). Siehe [CLI-Cheat-Sheet](#cli-commands-cheat-sheet) für Flags.

---

## Schnellreferenz zur Konfigurationsdatei {#config-file-quick-reference}

Datei: `ai-i18n-tools.config.json` (Standardpfad – kann mit `-c <Pfad>` überschrieben werden)

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",

  "openrouter": {
    "translationModels": ["google/gemini-2.5-flash", "openai/gpt-4o-mini"],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
  },

  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/",
    "reactExtractor": {
      "funcNames": ["t", "i18n.t"],
      "extensions": [".js", ".jsx", ".ts", ".tsx"]
    }
  },

  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "targetLocales": ["de", "fr"],
    "jsonSource": "i18n/en",
    "markdownOutput": {
      "style": "docusaurus",
      "docsRoot": "docs"
    }
  },

  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

### Wichtige Einschränkungen {#key-constraints}

- `sourceLocale` **muss exakt mit** der `SOURCE_LOCALE`-Konstante übereinstimmen, die aus der Laufzeit-i18n-Setup-Datei exportiert wird (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` kann ein Zeichenkettenpfad zu einem `ui-languages.json`-Manifest ODER ein Array von BCP-47-Codes sein.
- `documentation.targetLocales` überschreibt `targetLocales` nur für Dokumente – nützlich, wenn Sie weniger Dokumentationssprachen als UI-Sprachen wünschen.
- Alle Pfade sind relativ zum Arbeitsverzeichnis (cwd), von wo die CLI aufgerufen wird.
- `OPENROUTER_API_KEY` muss in der Umgebung oder einer `.env`-Datei gesetzt sein.

---

## Das `ui-languages.json`-Manifest {#the-ui-languagesjson-manifest}

Wenn `targetLocales` ein Dateipfad ist, muss diese Datei ein JSON-Array mit folgender Struktur sein:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "de",    "label": "Deutsch",       "englishName": "German" },
  { "code": "ar",    "label": "العربية",        "englishName": "Arabic" }
]
```

- `code` – BCP-47-Lokalisierungscode, der in Dateinamen und von i18next verwendet wird.
- `label` – nativer Name, der in Sprachwählern angezeigt wird.
- `englishName` – englischer Name, der für Anzeigehilfen und Übersetzungsanweisungen verwendet wird.

Diese Datei steuert sowohl die Übersetzungs-Pipeline als auch die Laufzeit-Benutzeroberfläche für die Sprachumschaltung. Halten Sie sie als einzige verbindliche Quelle für unterstützte Sprachen.

---

## CLI-Befehle – Schnellübersicht {#cli-commands-cheat-sheet}

```
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus]
    Write a starter config file. ui-markdown = React/UI-only template.
    ui-docusaurus = combined UI + docs template.

npx ai-i18n-tools extract
    Scan source for t("…") calls, write/merge strings.json.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools translate-ui [--locale <code>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate markdown/JSON/SVG under documentation paths. Default: skip unchanged files + use segment SQLite cache.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
    Standalone SVG assets from config.svg. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-docs] …
    extract (if enabled), translate-ui (unless --no-ui), translate-svg when config.svg exists (unless --no-svg),
    translate-docs (unless --no-docs). --force / --force-update apply to the docs step only; if --no-docs, both can be passed without conflict.

npx ai-i18n-tools status [--locale <code>]
    Show translation coverage per file × locale.

npx ai-i18n-tools editor
    Launch a local web editor for the SQLite cache, strings.json, and glossary.

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>] [--yes]
    Maintain the SQLite cache: removes stale rows and orphaned filepath rows.
    Prompts before DB writes (unless --dry-run or --yes): run translate-docs --force-update first.
    Backs up cache.db under the cache dir before modifications unless --no-backup. Use --yes in CI.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Globale Flags: `-c <config>` (Konfigurationspfad), `-v` (ausführliche/Debug-Ausgabe).

---

## Workflow 1 - UI-Zeichenketten: wie Daten fließen {#workflow-1---ui-strings-how-data-flows}

```
source files (JS/TS)
    │  i18next-scanner Parser finds t("literal") and i18n.t("literal")
    ▼
strings.json  - master catalog
    {
      "<md5-8-hex>": {
        "source": "The English string",
        "translated": { "de": "Der deutsche Text", "pt-BR": "O texto em português" }
      }
    }
    │  translate-ui reads this, sends batches to OpenRouter, fills missing locales
    ▼
src/locales/de.json    - flat map: source string → translation
    { "The English string": "Der deutsche Text", "Save": "Speichern" }
src/locales/pt-BR.json
    ...
```

**Nur literale Zeichenketten sind extrahierbar.** Variablen, Ausdrücke oder Template-Literale als Schlüssel werden nicht gefunden:

```js
t('Save')                   // ✓ extracted
t('Hello {{name}}', {name}) // ✓ extracted as "Hello {{name}}"
t(labelVar)                 // ✗ not extracted - variable key
t(`Hello ${name}`)          // ✗ not extracted - template literal
```

i18next verwendet das Key-as-Default-Modell: Fehlende Übersetzungen greifen auf den Schlüssel selbst (die englische Quellzeichenkette) zurück. Der `parseMissingKeyHandler` in `defaultI18nInitOptions` behandelt dies.

---

## Workflow 2 - Dokumentenübersetzung: wie Daten fließen {#workflow-2---document-translation-how-data-flows}

```
source files (md/mdx/json/svg)
    │  Extractor produces typed segments with SHA-256 hash
    ▼
PlaceholderHandler  - replaces URLs, admonitions, anchors with opaque tokens
    ▼
TranslationCache lookup (SQLite)
    │  cache hit → use stored translation
    │  cache miss → send batch to OpenRouter
    ▼
PlaceholderHandler.restore  - tokens replaced back with original syntax
    ▼
resolveDocumentationOutputPath  → write to output file
```

**Cache-Schlüssel**: SHA-256, erste 16 Hex-Zeichen des whitespace-normalisierten Segmentinhalts × Gebietsschema. Der Cache befindet sich in `documentation.cacheDir` (eine `.db` SQLite-Datei).

**CLI**: `--force-update` umgeht nur die *dateiebene* Skip-Funktion (rebuildet Ausgaben), nutzt aber weiterhin den Segment-Cache. `--force` löscht die pro-Datei-Verfolgung und überspringt Lesevorgänge aus dem Segment-Cache für API-Aufrufe. Siehe den Einstiegsguide für die vollständige Flag-Tabelle.

**Ausgabestile** (`markdownOutput.style`):

| Style | Beispiel |
|---|---|
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| benutzerdefinierte `pathTemplate` | beliebiges Layout unter Verwendung von `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` |

Die flache Ausgabeform schreibt relative Links zwischen Seiten automatisch um (z. B. `[Guide](./guide.md)` → `guide.de.md`).

---

## Laufzeitintegration – Einbindung von i18next {#runtime-integration---wiring-i18next}

Das Paket exportiert Hilfsfunktionen aus `'ai-i18n-tools/runtime'`, die Boilerplate-Code entfernen. Die minimale Einrichtung:

```ts
// src/i18n.ts  - import this at the top of your entry point
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json exactly
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

// Dynamic imports for non-source locales
const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

**Laden eines Gebietsschemas bei Bedarf** (z. B. wenn der Benutzer die Sprache wechselt):

```ts
await loadLocale(code);
i18n.changeLanguage(code);
```

`loadLocale` ist eine No-Op-Funktion für das Quellgebietsschema – sie lädt nur Nicht-Quellgebietsschemas.

---

## Referenz zu Laufzeithilfsfunktionen {#runtime-helpers-reference}

Alle exportiert aus `'ai-i18n-tools/runtime'`. Funktionieren in jeder JS-Umgebung (Browser, Node.js, Edge, Deno). Keine i18next-Peer-Abhängigkeit erforderlich.

| Export | Signatur | Zweck |
|---|---|---|
| `defaultI18nInitOptions` | `(sourceLocale?: string) => i18nextInitOptions` | Standard-i18next-Initialisierung für Key-as-Default-Setup |
| `wrapI18nWithKeyTrim` | `(i18n: I18nLike) => void` | Kürzt Schlüssel vor der Suche und wendet `{{var}}`-Interpolation für das Quellgebietsschema an (wo `parseMissingKeyHandler` den rohen Schlüssel zurückgibt) |
| `makeLoadLocale` | `(i18n, loaders, sourceLocale?) => (lang: string) => Promise<void>` | Factory für asynchrones Laden von Gebietsschemas |
| `getTextDirection` | `(lng: string) => 'ltr' \| 'rtl'` | Erkennung von rechtsläufigen Sprachen anhand des BCP-47-Codes |
| `applyDirection` | `(lng: string, element?: Element) => void` | Setzt `dir` auf `document.documentElement` (No-Op in Node.js) |
| `getUILanguageLabel` | `(lang: UiLanguageEntry, t: TranslateFn) => string` | Übersetzte Bezeichnung für Dropdown-Menüs in Einstellungsseiten |
| `getUILanguageLabelNative` | `(lang: UiLanguageEntry) => string` | Native Bezeichnung für Kopfzeilenmenüs (ohne `t()`-Aufruf) |
| `interpolateTemplate` | `(str: string, vars: Record<string, string \| number \| boolean>) => string` | Niedrigstufige `{{var}}`-Ersetzung in einer einfachen Zeichenkette (wird intern von `wrapI18nWithKeyTrim` verwendet; selten im Anwendungscode erforderlich) |
| `flipUiArrowsForRtl` | `(text, isRtl: boolean) => string` | Dreht `→` zu `←` für rechtsläufige Layouts |
| `RTL_LANGS` | `ReadonlySet<string>` | Menge von BCP-47-Codes, die als rechtsläufig gelten |

---

## Programmatische API {#programmatic-api}

Importieren Sie aus `'ai-i18n-tools'`. Nützlich, wenn Sie Übersetzungsschritte aus einem Build-Skript oder CI-Pipeline aufrufen müssen.

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
// summary.translated - number of newly translated strings
// summary.locales   - number of locales processed
```

Weitere nützliche Exporte für benutzerdefinierte Pipelines:

| Export | Verwendung |
|---|---|
| `loadI18nConfigFromFile(path, cwd?)` | Lädt und validiert die Konfiguration |
| `parseI18nConfig(rawObject)` | Validiert ein in Code erstelltes Konfigurationsobjekt |
| `TranslationCache` | Direkter Zugriff auf SQLite-Cache |
| `UIStringExtractor` | Extrahiert `t("…")`-Aufrufe aus JS/TS-Dateien |
| `MarkdownExtractor` | Wandelt Markdown in übersetzbare Segmente um |
| `JsonExtractor` | Parst Docusaurus JSON-Beschriftungsdateien |
| `SvgExtractor` | Parst SVG-Textelemente |
| `OpenRouterClient` | Direkte Übersetzungsanfragen |
| `PlaceholderHandler` | Schützt/stellt Markdown-Syntax um Übersetzungen herum wieder her |
| `splitTranslatableIntoBatches` | Gruppiert Segmente in LLM-gerechte Batches |
| `validateTranslation` | Strukturelle Prüfungen nach einem Übersetzungsauftrag |
| `resolveDocumentationOutputPath` | Berechnet den Ausgabedateipfad für ein übersetztes Dokument |
| `Glossary` / `GlossaryMatcher` | Lädt und wendet ein Übersetzungsglossar an |

---

## Glossar {#glossary}

Das Glossar stellt eine konsistente Terminologie über alle Übersetzungen hinweg sicher.

- **Automatisch erstelltes Glossar** (`glossary.uiGlossary`): liest `strings.json` und nutzt vorhandene Übersetzungen als Hinweisquelle. Keine CSV-Datei erforderlich.
- **Benutzerglossar** (`glossary.userGlossary`): eine CSV-Datei mit den Spalten `term,translation,locale`. Generieren Sie eine leere Vorlage mit `npx ai-i18n-tools glossary-generate`.

Glossarhinweise werden in die Systemanweisung des LLM eingefügt – sie sind Vorschläge, keine festen Ersetzungen.

---

## Erweiterungspunkte {#extension-points}

### Benutzerdefinierte Funktionsnamen {#custom-function-names}

```json
{ "ui": { "reactExtractor": { "funcNames": ["t", "i18n.t", "translate"] } } }
```

### Benutzerdefinierter Extraktor {#custom-extractor}

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* return typed segments */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* rebuild file */ }
}
```

### Benutzerdefinierter Ausgabepfad {#custom-output-path}

```json
{
  "documentation": {
    "markdownOutput": {
      "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
    }
  }
}
```

Verfügbare Platzhalter: `{outputDir}`, `{locale}`, `{relPath}`, `{stem}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

---

## Häufige Aufgaben und Vorgehensweisen {#common-tasks-and-what-to-do}

| Aufgabe | Was auszuführen/zu ändern ist |
|---|---|
| Neue Sprache hinzufügen | Zur `ui-languages.json` (oder `targetLocales`-Array) hinzufügen, dann `translate-docs` / `translate-ui` / `sync` ausführen |
| Nur eine Sprache übersetzen | `npx ai-i18n-tools translate-docs --locale de` (oder `translate-ui`, `sync`) |
| Neuen UI-Text hinzufügen | `t('Mein neuer Text')` im Quellcode schreiben, dann `extract` und anschließend `translate-ui` ausführen |
| Übersetzung manuell aktualisieren | Direkt in `strings.json` bearbeiten (`translated`-Objekt), dann `translate-ui` ausführen (bestehende Einträge werden nicht überschrieben) |
| Nur neue/aktualisierte Dokumente übersetzen | `translate-docs` ausführen – Datei- und Segment-Cache überspringen automatisch Unverändertes |
| Dokumentausgaben neu erstellen, ohne API-Aufrufe für unveränderte Segmente | `npx ai-i18n-tools translate-docs --force-update` |
| Vollständige Dokumentübersetzung (Segment-Cache ignorieren) | `npx ai-i18n-tools translate-docs --force` |
| Cache-Speicher freigeben | `npx ai-i18n-tools cleanup` oder `translate-docs --clear-cache` |
| Unübersetzte Inhalte prüfen | `npx ai-i18n-tools status` |
| Übersetzungsmodell wechseln | `openrouter.translationModels` in der Konfiguration bearbeiten (erstes Modell ist primär, restliche sind Fallbacks) |
| i18next in ein neues Projekt einbinden | Siehe [Runtime-Integration](#runtime-integration---wiring-i18next) oben |
| Dokumente in weniger Sprachen übersetzen als die UI | `documentation.targetLocales` auf ein kleineres Array setzen |
| Extrahieren + UI + SVG + Dokumente in einem Befehl ausführen | `npx ai-i18n-tools sync` – verwenden Sie `--no-ui`, `--no-svg` oder `--no-docs`, um eine Stufe zu überspringen (z. B. nur UI + SVG: `--no-docs`) |

---

## Umgebungsvariablen {#environment-variables}

| Variable | Wirkung |
|---|---|
| `OPENROUTER_API_KEY` | **Erforderlich.** Ihr OpenRouter-API-Schlüssel. |
| `OPENROUTER_BASE_URL` | Überschreibt die API-Basis-URL. |
| `I18N_SOURCE_LOCALE` | Überschreibt `sourceLocale` zur Laufzeit. |
| `I18N_TARGET_LOCALES` | Durch Komma getrennte Sprachcodes, um `targetLocales` zu überschreiben. |

---

## Vom Tool generierte oder verwaltete Dateien {#files-generated--maintained-by-the-tool}

| Datei | Eigentümer | Hinweise |
|---|---|---|
| `ai-i18n-tools.config.json` | Sie | Hauptkonfiguration. Manuelles Bearbeiten erforderlich. |
| `ui-languages.json` (an der konfigurierten Stelle) | Sie | Lokalisierungs-Manifest. Manuelles Bearbeiten, um Sprachen hinzuzufügen/zu entfernen. |
| `strings.json` (an der konfigurierten Stelle) | Tool (`extract`) | Master-Katalog für die Benutzeroberfläche. Es ist sicher, die Werte in `translated` zu bearbeiten. Schlüssel nicht umbenennen. |
| `{flatOutputDir}/de.json`, usw. | Tool (`translate-ui`) | Flache Zuordnungen pro Sprache. Nicht bearbeiten – wird bei jedem Aufruf von `translate-ui` neu generiert. |
| `{cacheDir}/*.db` | Tool | SQLite-Übersetzungscache. Nicht direkt bearbeiten; verwenden Sie den Befehl `editor` oder `cleanup`. |
| `glossary-user.csv` | Sie | Begriffsüberschreibungen. Vorlage mit `glossary-generate` generieren. |

---

## Übersicht zur Quellstruktur {#source-layout-summary}

```
src/
├── index.ts               Public API (all programmatic exports)
├── cli/                   CLI command implementations
├── core/                  Config loading, types (Zod), SQLite cache, prompt builder, output paths
├── extractors/            Segment extractors: JS/TS, Markdown, JSON, SVG
├── processors/            Placeholder protection, batch splitting, post-translation validation, link rewriting
├── api/openrouter.ts      HTTP client for OpenRouter with model fallback and rate-limit handling
├── glossary/              Glossary loading (CSV + auto from strings.json) and term matching
├── runtime/               i18next helpers, RTL helpers, display helpers (no i18next import)
├── server/                Local Express web editor for cache/glossary
└── utils/                 Logger, SHA-256 hash, .translate-ignore parser
```

Der Einstiegspunkt für alle öffentlichen Typen und Funktionen ist `src/index.ts`.
