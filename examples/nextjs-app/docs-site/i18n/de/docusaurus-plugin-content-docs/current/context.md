---
translation_last_updated: '2026-04-13T00:28:31.020Z'
source_file_mtime: '2026-04-13T00:28:15.573Z'
source_file_hash: d362c2411cab836c5035efd2135f097efeb4477a3f61cd225850c323e0cc7071
translation_language: de
source_file_path: docs-site/docs/context.md
---
# ai-i18n-tools: KI-Agent-Kontext

Dieses Dokument gibt einem KI-Agenten das mentale Modell, die wichtigsten Entscheidungen und Muster, die benötigt werden, um effektiv mit `ai-i18n-tools` zu arbeiten, ohne vorher jedes andere Dokument zu konsultieren. Lesen Sie dies, bevor Sie Code- oder Konfigurationsänderungen vornehmen.

<!-- DOCTOC SKIP -->

---

## Was dieses Paket macht {#what-this-package-does}

`ai-i18n-tools` ist ein CLI + Bibliothek, die die Internationalisierung für JavaScript/TypeScript-Projekte automatisiert. Es:

1. **Extrahiert** UI-Strings aus dem Quellcode (`t("…")`-Aufrufen) in ein Masterkatalog.
2. **Übersetzt** diesen Katalog und Dokumentationsdateien über LLMs (über OpenRouter).
3. **Schreibt** lokalefertige JSON-Dateien für i18next, plus übersetzte Markdown-, Docusaurus-JSON-Labels und eigenständige SVG-Assets.
4. **Exportiert Laufzeithilfen** für die Verdrahtung von i18next, RTL-Unterstützung und Sprachenauswahl in jeder JS-Umgebung.

Alles wird von einer einzigen Konfigurationsdatei gesteuert: `ai-i18n-tools.config.json`.

---

## Zwei unabhängige Workflows {#two-independent-workflows}

| | Workflow 1 - UI-Strings | Workflow 2 - Dokumente |
|---|---|---|
| **Eingabe** | JS/TS-Quell Dateien mit `t("…"`-Aufrufen | `.md`, `.mdx`, Docusaurus-JSON-Label-Dateien |
| **Ausgabe** | `strings.json` (Katalog) + pro-Locale flache JSON-Dateien (`de.json`, usw.) | Übersetzte Kopien dieser Dateien an konfigurierten Ausgabepfaden |
| **Cache** | `strings.json` selbst (bestehende Übersetzungen werden beibehalten) | SQLite-Datenbank (`cacheDir`) - nur neue/geänderte Segmente gehen zu LLM |
| **Hauptbefehl** | `translate-ui` | `translate-docs` |
| **Sync-Befehl** | `sync` | `sync` |
| **Feature-Flags** | `extractUIStrings`, `translateUIStrings` | `translateMarkdown`, `translateJSON` |

Sie können unabhängig oder zusammen in derselben Konfiguration verwendet werden. `sync` wird in folgender Reihenfolge ausgeführt: `extract` (wenn aktiviert), `translate-ui` (wenn aktiviert, es sei denn, `--no-ui`), `translate-svg`, wenn `config.svg` existiert (es sei denn, `--no-svg`), dann `translate-docs` (es sei denn, `--no-docs`). Die eigenständige SVG-Übersetzung wird über den obersten `svg`-Block konfiguriert, nicht über ein Funktionsflag. Siehe das [CLI-Spickzettel](#cli-commands-cheat-sheet) für Flags.

---

## Schnellreferenz zur Konfigurationsdatei {#config-file-quick-reference}

Datei: `ai-i18n-tools.config.json` (Standardstandort - überschreiben mit `-c <path>`)

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",

  "openrouter": {
    "translationModels": [
      "qwen/qwen3-235b-a22b-2507",
      "openai/gpt-4o-mini",
      "deepseek/deepseek-v3.2",
      "anthropic/claude-3-haiku",
      "qwen/qwen3.6-plus",
      "anthropic/claude-3.5-haiku",
      "openai/gpt-5.3-codex",
      "anthropic/claude-sonnet-4.6",
      "google/gemini-3-flash-preview"
    ],
    "maxTokens": 8192,
    "temperature": 0.2
  },

  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
  },

  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/",
    "preferredModel": "anthropic/claude-3.5-haiku",
    "reactExtractor": {
      "funcNames": ["t", "i18n.t"],
      "extensions": [".js", ".jsx", ".ts", ".tsx"]
    }
  },

  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr"],
      "jsonSource": "i18n/en",
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs"
      }
    }
  ],

  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  },

  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  }
}
```

### Wichtige Einschränkungen {#key-constraints}

- `sourceLocale` **muss genau übereinstimmen** mit der `SOURCE_LOCALE`-Konstanten, die aus der Laufzeit-i18n-Setup-Datei (`src/i18n.ts` / `src/i18n.js`) exportiert wird.
- `targetLocales` kann ein String-Pfad zu einem `ui-languages.json`-Manifest ODER ein Array von BCP-47-Codes sein.
- `uiLanguagesPath` ist optional, aber nützlich, wenn `targetLocales` ein explizites Array ist und Sie dennoch manifestgesteuerte Labels und Locale-Filterung wünschen.
- `documentations[].description` ist optionaler Text für die Wartenden (für was der Block gedacht ist); es beeinflusst nicht die Übersetzung. Wenn gesetzt, wird es in der Überschrift von `translate-docs` und in den `status`-Überschriften aufgenommen.
- `documentations[].targetLocales` beschränkt diesen Block auf eine Teilmenge; effektive Dokumentationslokale sind die **Vereinigung** über die Blöcke (nützlich, wenn unterschiedliche Bäume unterschiedliche Locale-Sets benötigen).
- `documentations[].markdownOutput.postProcessing` kann übersetztes Markdown nach der Wiederzusammenstellung anpassen, zum Beispiel durch das Umschreiben von Screenshot-Pfaden oder das Wiederaufbauen eines Sprachlistenblocks.
- Alle Pfade sind relativ zum cwd (wo die CLI aufgerufen wird).
- `OPENROUTER_API_KEY` muss in der Umgebung oder in einer `.env`-Datei gesetzt werden.

---

## Das `ui-languages.json`-Manifest {#the-ui-languagesjson-manifest}

Wenn `targetLocales` ein Dateipfad ist, muss diese Datei ein JSON-Array dieser Form haben:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "de",    "label": "Deutsch",       "englishName": "German" },
  { "code": "ar",    "label": "العربية",        "englishName": "Arabic" }
]
```

- `code` - BCP-47-Lokalisierungscode, der in Dateinamen und von i18next verwendet wird.
- `label` - der native Name, der in Sprachwählern angezeigt wird.
- `englishName` - der englische Name, der für Anzeigehilfen und Übersetzungsaufforderungen verwendet wird.

Diese Datei steuert sowohl die Übersetzungs-Pipeline als auch die Laufzeit-Sprachumschalter-UI. Halten Sie sie als die einzige Quelle der Wahrheit für unterstützte Lokale.

---

## CLI-Befehle Spickzettel {#cli-commands-cheat-sheet}

```
npx ai-i18n-tools init [-t ui-markdown|ui-docusaurus]
    Write a starter config file. ui-markdown = React/UI-only template.
    ui-docusaurus = combined UI + docs template.

npx ai-i18n-tools extract
    Scan source for t("…") calls, write/merge strings.json.
    Safe to re-run - preserves existing translations.

npx ai-i18n-tools translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]
    Translate UI strings only. Reads strings.json, writes flatOutputDir/de.json etc.
    --force: re-translate all entries per locale. --dry-run: no writes, no API calls. -j: max parallel locales.

npx ai-i18n-tools translate-docs [--locale <code>] [--force | --force-update] …
    Translate markdown and JSON under documentation paths. Default: skip unchanged files + use segment SQLite cache.
    --force-update: re-run every file output; segment cache still used (no API for unchanged text).
    --force: clear file tracking and ignore segment cache reads (full re-translation); new results still write to cache.
    --stats: print cache stats and exit. --clear-cache [locale]: wipe cache (all or one locale) and exit.
    --prompt-format xml|json-array|json-object: batch wire format to the model (default xml); does not change validation or cache.
    Do not combine --force with --force-update (when the docs step runs).

npx ai-i18n-tools translate-svg [--locale <code>] [--force | --force-update] [--no-cache] …
    Standalone SVG assets from config.svg. --no-cache: skip SQLite reads/writes for this run only.

npx ai-i18n-tools sync [--locale <code>] [--force | --force-update] [--no-ui] [--no-svg] [--no-docs] …
    extract (if enabled), translate-ui (unless --no-ui), translate-svg when config.svg exists (unless --no-svg),
    translate-docs (unless --no-docs). --force / --force-update apply to the docs step only; if --no-docs, both can be passed without conflict.

npx ai-i18n-tools status
    Show markdown translation coverage per file × locale.

npx ai-i18n-tools editor
    Launch a local web editor for the SQLite cache, strings.json, and glossary.

npx ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
    Runs sync --force-update first, then maintains the SQLite cache: stale segment rows; orphaned file_tracking keys (doc-block:, svg-assets:, …);
    orphaned translation rows whose filepath metadata points at a missing file.
    Backs up cache.db under the cache dir before modifications unless --no-backup.

npx ai-i18n-tools glossary-generate
    Write an empty glossary-user.csv template.
```

Globale Flags: `-c <config>` (Konfigurationspfad), `-v` (ausführliche/debug-Ausgabe), `-w` / `--write-logs [path]` (Konsolenausgabe in eine Protokolldatei umleiten; Standardpfad: unter `cacheDir`).

---

## Workflow 1 - UI-Strings: wie Daten fließen {#workflow-1---ui-strings-how-data-flows}

```
source files (JS/TS)
    │  i18next-scanner Parser finds t("literal") and i18n.t("literal")
    ▼
strings.json  - master catalog
    {
      "<md5-8-hex>": {
        "source": "The English string",
        "translated": { "de": "Der deutsche Text", "pt-BR": "O texto em português" },
        "models": { "de": "…", "pt-BR": "…" }
      }
    }
    │  translate-ui reads this, sends batches to OpenRouter, fills missing locales and records model ids per locale
    ▼
src/locales/de.json    - flat map: source string → translation
    { "The English string": "Der deutsche Text", "Save": "Speichern" }
src/locales/pt-BR.json
    ...
```

**Nur literale Strings sind extrahierbar.** Variablen, Ausdrücke oder Template-Literale als Schlüssel werden nicht gefunden:

```js
t('Save')                   // ✓ extracted
t('Hello {{name}}', {name}) // ✓ extracted as "Hello {{name}}"
t(labelVar)                 // ✗ not extracted - variable key
t(`Hello ${name}`)          // ✗ not extracted - template literal
```

i18next verwendet das Schlüssel-als-Standard-Modell: Fehlende Übersetzungen fallen auf den Schlüssel selbst zurück (den englischen Quellstring). Der `parseMissingKeyHandler` in `defaultI18nInitOptions` kümmert sich darum.

---

## Workflow 2 - Dokumentübersetzung: wie Daten fließen {#workflow-2---document-translation-how-data-flows}

```
source files (md/mdx/json)
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

**Cache-Schlüssel**: SHA-256 erste 16 Hex-Zeichen des whitespace-normalisierten Segmentinhalts × Locale. Der Cache befindet sich im Stammverzeichnis `cacheDir` (eine `cache.db` SQLite-Datei), die von allen `documentations`-Blöcken gemeinsam genutzt wird. Jede Zeile speichert das `model`, das zuletzt das Segment übersetzt hat; das Speichern einer Bearbeitung im `editor` setzt `model` auf `user-edited` (dasselbe Sentinel wie UI `strings.json` `models`).

**CLI**: `--force-update` umgeht nur das *Datei-Level*-Überspringen (Rebuild-Ausgaben), während der Segment-Cache weiterhin verwendet wird. `--force` löscht die Verfolgung pro Datei und überspringt Segment-Cache-Lesungen für API-Aufrufe. Siehe die Anleitung zum Einstieg für die vollständige Flaggenübersicht.

**Standalone SVGs**: werden von `translate-svg` mit dem obersten `svg`-Konfigurationsblock behandelt. Sie verwenden die gleichen OpenRouter/Cache-Ideen, jedoch nicht die `documentations`-Pipeline.

**Ausgabestile** (`markdownOutput.style`):

| Stil | Beispiel |
|---|---|
| `"nested"` (Standard) | `docs/guide.md` → `i18n/de/docs/guide.md` |
| `"docusaurus"` | `docs/guide.md` → `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"flat"` | `docs/guide.md` → `i18n/guide.de.md` |
| benutzerdefiniertes `pathTemplate` | jedes Layout, das `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` verwendet |

Die Flat-Style-Ausgabe schreibt relative Links zwischen Seiten automatisch um (z.B. `[Guide](./guide.md)` → `guide.de.md`).

---

## Laufzeitintegration - i18next verkabeln {#runtime-integration---wiring-i18next}

Das Paket exportiert Helfer aus `'ai-i18n-tools/runtime'`, die Boilerplate entfernen. Die minimale Einrichtung:

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

**Laden einer Locale auf Anfrage** (z.B. wenn der Benutzer die Sprache wechselt):

```ts
await loadLocale(code);
i18n.changeLanguage(code);
```

`loadLocale` ist ein No-Op für die Quell-Locale - es ruft nur Nicht-Quell-Lokalisierungen ab.

---

## Laufzeit-Helferreferenz {#runtime-helpers-reference}

Alle exportiert aus `'ai-i18n-tools/runtime'`. Funktioniert in jeder JS-Umgebung (Browser, Node.js, Edge, Deno). Keine i18next-Peer-Abhängigkeit erforderlich.

| Export | Signatur | Zweck |
|---|---|---|
| `defaultI18nInitOptions` | `(sourceLocale?: string) => i18nextInitOptions` | Standard-i18next-Initialisierung für Schlüssel-als-Standard-Setup |
| `wrapI18nWithKeyTrim` | `(i18n: I18nLike) => void` | Schlüssel vor der Suche trimmen und `{{var}}`-Interpolation für die Quell-Locale anwenden (wo `parseMissingKeyHandler` den Rohschlüssel zurückgibt) |
| `makeLoadLocale` | `(i18n, loaders, sourceLocale?) => (lang: string) => Promise<void>` | Fabrik für asynchrones Laden von Locales |
| `getTextDirection` | `(lng: string) => 'ltr' \| 'rtl'` | RTL-Erkennung durch BCP-47-Code |
| `applyDirection` | `(lng: string, element?: Element) => void` | Setzt `dir` auf `document.documentElement` (No-Op in Node.js) |
| `getUILanguageLabel` | `(lang: UiLanguageEntry, t: TranslateFn) => string` | Übersetztes Label für Dropdowns auf der Einstellungsseite |
| `getUILanguageLabelNative` | `(lang: UiLanguageEntry) => string` | Native Bezeichnung für Header-Menüs (kein `t()`-Aufruf) |
| `interpolateTemplate` | `(str: string, vars: Record<string, string \| number \| boolean>) => string` | Niedrigstufige `{{var}}`-Substitution auf einem einfachen String (intern verwendet von `wrapI18nWithKeyTrim`; selten im Anwendungs-Code benötigt) |
| `flipUiArrowsForRtl` | `(text, isRtl: boolean) => string` | Dreht `→` zu `←` für RTL-Layouts |
| `RTL_LANGS` | `ReadonlySet<string>` | Menge von BCP-47-Codes, die als RTL behandelt werden |

---

## Programmatic API {#programmatic-api}

Importieren von `'ai-i18n-tools'`. Nützlich, wenn Sie Übersetzungsschritte aus einem Build-Skript oder CI-Pipeline aufrufen müssen.

```ts
import {
  loadI18nConfigFromFile,
  runTranslateUI,
} from 'ai-i18n-tools';

const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');
const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
// summary.stringsUpdated - number of newly translated strings
// summary.localesTouched - locale codes processed
```

Weitere nützliche Exporte für benutzerdefinierte Pipelines:

| Export | Verwenden bei |
|---|---|
| `loadI18nConfigFromFile(path, cwd?)` | Konfiguration laden und validieren |
| `parseI18nConfig(rawObject)` | Ein in Code erstelltes Konfigurationsobjekt validieren |
| `TranslationCache` | Direkter SQLite-Cache-Zugriff |
| `UIStringExtractor` | `t("…")`-Aufrufe aus JS/TS-Dateien extrahieren |
| `MarkdownExtractor` | Markdown in übersetzbare Segmente parsen |
| `JsonExtractor` | Docusaurus JSON-Labeldateien parsen |
| `SvgExtractor` | SVG-Text-Elemente parsen |
| `OpenRouterClient` | Übersetzungsanfragen direkt stellen |
| `PlaceholderHandler` | Markdown-Syntax um die Übersetzung schützen/wiederherstellen |
| `splitTranslatableIntoBatches` | Segmente in LLM-große Batches gruppieren |
| `validateTranslation` | Strukturelle Überprüfungen nach einem Übersetzungsaufruf |
| `resolveDocumentationOutputPath` | Den Ausgabepfad für ein übersetztes Dokument berechnen |
| `Glossary` / `GlossaryMatcher` | Ein Übersetzungs-Glossar laden und anwenden |

---

## Glossar {#glossary}

Das Glossar sorgt für konsistente Terminologie über Übersetzungen hinweg.

- **Automatisch erstelltes Glossar** (`glossary.uiGlossary`): liest `strings.json` und verwendet vorhandene Übersetzungen als Hinweisquelle. Keine CSV erforderlich.
- **Benutzer-Glossar** (`glossary.userGlossary`): eine CSV-Datei mit den Spalten `Originalsprache`, `locale`, `Übersetzung` (oder `en`, `locale`, `Übersetzung`). Generieren Sie eine leere Vorlage mit `npx ai-i18n-tools glossary-generate`.

Glossarhinweise werden in den LLM-Systemprompt eingefügt - sie sind Vorschläge, keine festen Ersetzungen.

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
  "documentations": [
    {
      "markdownOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```

Verfügbare Platzhalter: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`.

---

## Häufige Aufgaben und was zu tun ist {#common-tasks-and-what-to-do}

| Aufgabe | Was auszuführen / zu ändern |
|---|---|
| Eine neue Locale hinzufügen | Fügen Sie sie zu `ui-languages.json` (oder `targetLocales`-Array) hinzu, und führen Sie dann `translate-docs` / `translate-ui` / `sync` aus |
| Nur eine Locale übersetzen | `npx ai-i18n-tools translate-docs --locale de` (oder `translate-ui`, `sync`) |
| Einen neuen UI-String hinzufügen | Schreiben Sie `t('Mein neuer String')` in die Quelle, und führen Sie dann `extract` und dann `translate-ui` aus |
| Eine Übersetzung manuell aktualisieren | Bearbeiten Sie `strings.json` direkt (`translated`), oder verwenden Sie `editor` (setzt `models[locale]` auf `user-edited`). `translate-ui` überspringt Locales, die bereits Text haben, es sei denn, Sie verwenden `--force` |
| Nur neue/aktualisierte Dokumente übersetzen | Führen Sie `translate-docs` aus - Datei + Segment-Cache überspringt unveränderte Arbeiten automatisch |
| Dokumentenausgaben neu erstellen, ohne die API für unveränderte Segmente erneut aufzurufen | `npx ai-i18n-tools sync --force-update` |
| Vollständige Dokumentenübersetzung (Segment-Cache ignorieren) | `npx ai-i18n-tools translate-docs --force` |
| Cache-Speicher freigeben | `npx ai-i18n-tools cleanup` oder `translate-docs --clear-cache` |
| Überprüfen, was nicht übersetzt ist | `npx ai-i18n-tools status` |
| Das Übersetzungsmodell ändern | Bearbeiten Sie `openrouter.translationModels` (das erste ist primär, die restlichen sind Fallbacks). Für **UI nur** wird optional `ui.preferredModel` vor dieser Liste ausprobiert. |
| i18next in einem neuen Projekt einbinden | Siehe [Runtime-Integration](#runtime-integration---wiring-i18next) oben |
| Dokumente in weniger Locales als UI übersetzen | Setzen Sie `documentations[].targetLocales` auf den relevanten Block(en) oder verwenden Sie eine kleinere Vereinigung |
| Extract + UI + SVG + Dokumente in einem Befehl ausführen | `npx ai-i18n-tools sync` - verwenden Sie `--no-ui`, `--no-svg` oder `--no-docs`, um eine Phase zu überspringen (z. B. nur UI + SVG: `--no-docs`) |

---

## Umgebungsvariablen {#environment-variables}

| Variable | Effekt |
|---|---|
| `OPENROUTER_API_KEY` | **Erforderlich.** Ihr OpenRouter API-Schlüssel. |
| `OPENROUTER_BASE_URL` | Überschreiben Sie die API-Basis-URL. |
| `I18N_SOURCE_LOCALE` | Überschreiben Sie `sourceLocale` zur Laufzeit. |
| `I18N_TARGET_LOCALES` | Komma-getrennte Gebietsschema-Codes zum Überschreiben von `targetLocales`. |
| `I18N_LOG_LEVEL` | Logger-Stufe (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR` | Wenn `1`, deaktivieren Sie ANSI-Farben in der Protokollausgabe. |
| `I18N_LOG_SESSION_MAX` | Maximalzeilen pro Protokollsitzung (Standard `5000`). |

---

## Von dem Tool generierte / verwaltete Dateien {#files-generated--maintained-by-the-tool}

| Datei | Eigentümer | Hinweise |
|---|---|---|
| `ai-i18n-tools.config.json` | Sie | Hauptkonfiguration. Manuell bearbeiten. |
| `ui-languages.json` (wo immer konfiguriert) | Sie | Locale-Manifest. Manuell bearbeiten, um Locales hinzuzufügen/zu entfernen. |
| `strings.json` (wo immer konfiguriert) | Tool (`extract` / `translate-ui` / `editor`) | Master-UI-Katalog: `source`, `translated`, optional `models` (pro Locale: OpenRouter-Modell-ID oder `user-edited`), optional `locations`. Sicher zu bearbeiten `translated`; Schlüssel nicht umbenennen. |
| `{flatOutputDir}/de.json`, usw. | Tool (`translate-ui`) | Flache Karten pro Locale (Quelle → nur Übersetzung, keine `models`). Nicht bearbeiten — bei jedem `translate-ui` neu generiert. |
| `{cacheDir}/*.db` | Tool | SQLite-Übersetzungscache (pro Segment `model`-Metadaten; `user-edited` nach manuellen Speichern im `editor`). Nicht direkt bearbeiten; verwenden Sie `editor` oder `cleanup`. |
| `glossary-user.csv` | Sie | Begriff-Overrides. Vorlage mit `glossary-generate` generieren. |

---

## Zusammenfassung des Quelllayouts {#source-layout-summary}

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
