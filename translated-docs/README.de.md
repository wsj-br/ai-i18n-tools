<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Lizenz: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

CLI und Toolkit zur Internationalisierung von JavaScript-/TypeScript-Anwendungen und Dokumentationsseiten. Extrahiert UI-Texte, übersetzt sie mithilfe großer Sprachmodelle über OpenRouter und generiert sprachspezifische JSON-Dateien für i18next. Bei Dokumentationen werden Markdown- und MDX-Dateien unter `contentPaths` übersetzt (die lokalisierten Seiten, die Nutzer öffnen). Optional werden Docusaurus-Label-JSON-Dateien aus `jsonSource` verwendet, um Site-Shell-Texte abzudecken (`write-translations`-Kataloge wie Theme/Navigation/Footer), getrennt vom Seiteninhalt. Die Übersetzung von SVG-Dateien nutzt `features.translateSVG` und den obersten `svg`-Block.

<small>**In anderen Sprachen lesen:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<small>Übersetzte READMEs und Dokumentationen werden unter [`translated-docs/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) auf GitHub committet; das npm-Paket enthält nur englische `docs/`.</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Zwei Haupt-Workflows](#two-core-workflows)
- [Installation](#installation)
  - [Über die CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [Schnellstart](#quick-start)
  - [Workflow 1 – UI-Texte](#workflow-1---ui-strings)
  - [Workflow 2 – Dokumentation](#workflow-2---documentation)
  - [Beide Workflows](#both-workflows)
- [Laufzeit-Hilfsfunktionen](#runtime-helpers)
- [CLI-Befehle](#cli-commands)
- [Dokumentation](#documentation)
- [Lizenz](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## Zwei zentrale Workflows

**Workflow 1 - UI-Übersetzung** (React, Next.js, Node.js, jedes i18next-Projekt)

Erstellt einen Hauptkatalog (`strings.json` mit optionalen, sprachspezifischen `models`-Metadaten) aus `t("…")` / `i18n.t("…")` **Literals**, optional `package.json` `description` und optional jeweils `englishName` aus `ui-languages.json`, wenn dies in der Konfiguration aktiviert ist. Übersetzt fehlende Einträge pro Sprache über OpenRouter und schreibt flache JSON-Dateien (`de.json`, `pt-BR.json`, …), die für i18next bereit sind.

**Workflow 2 – Dokumentenübersetzung** (Markdown / MDX, optional Docusaurus-Shell-JSON)

Übersetzt `.md` und `.mdx` aus jedem `documentations`-Block über `contentPaths` – also die lokalisierte Dokumentation. Wenn `features.translateJSON` und `jsonSource` gesetzt sind, werden zusätzlich Docusaurus-**Label-JSON**-Dateien übersetzt (Kopfzeile, Fußzeile, Theme/Plugin-Benutzeroberfläche aus `write-translations`), nicht jedoch der MDX-Textkörper. Unterstützt Docusaurus- und flache, sprachkennzeichensuffixbasierte Layouts pro Block (`documentations[].markdownOutput`). Die gemeinsame Stamm-`cacheDir` speichert den SQLite-Cache, sodass nur neue oder geänderte Segmente an das LLM gesendet werden. **SVG:** Aktivieren Sie `features.translateSVG`, fügen Sie den obersten `svg`-Block hinzu und verwenden Sie dann `translate-svg` (wird ebenfalls von `sync` ausgeführt, wenn beide gesetzt sind).

Beide Workflows nutzen dieselbe `ai-i18n-tools.config.json`-Datei und können unabhängig oder zusammen verwendet werden. Die Übersetzung von SVG-Dateien verwendet `features.translateSVG` sowie den obersten `svg`-Block und läuft über `translate-svg` (oder die SVG-Stufe innerhalb von `sync`).

---

<a id="installation"></a>
## Installation

Das veröffentlichte Paket ist **ausschließlich ESM** (`"type": "module"`). Verwenden Sie `import` ab Node.js, Bundlern oder `import()` — `require('ai-i18n-tools')` **wird nicht unterstützt.** Das Paket deklariert `engines.node` `>=22.16.0`; ältere Node.js-Versionen werden nicht unterstützt.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### Verwendung der CLI

**Pro Projekt (empfohlen)** – als Abhängigkeit oder devDependency installieren und anschließend über `npx`, `pnpm exec` oder ein `package.json`-Skript aufrufen:

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

Der Paketmanager schreibt `node_modules/.bin/ai-i18n-tools` mit den korrekten Berechtigungen unter Linux und macOS und `.cmd` / `.ps1`-Shims unter Windows; Skript-Runner erkennen dies automatisch.

**Ohne Präfix** `ai-i18n-tools` **im Terminal:** `package.json`-Skripte werden bereits mit `node_modules/.bin` auf `PATH` ausgeführt, sodass Befehle wie `pnpm run i18n:sync` die CLI aufrufen, ohne `npx` eingeben zu müssen. Um `ai-i18n-tools` direkt in einer interaktiven Shell auszuführen (vom Projektstamm aus, nach einer lokalen Installation), fügen Sie das lokale Bin-Verzeichnis an `PATH` an:

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

Mit [**direnv**](https://direnv.net/) fügen Sie `PATH_add node_modules/.bin` zu einer `.envrc` im Projektstammverzeichnis hinzu, damit der einfache Befehl verfügbar ist, nachdem in das Repository gewechselt wurde (`cd`). Ohne `PATH` anzupassen, weiterhin `npx ai-i18n-tools …` oder `pnpm exec ai-i18n-tools …` verwenden.

**Null-Installations-Einzelbefehl** — `npx ai-i18n-tools <cmd>` oder `pnpm dlx ai-i18n-tools <cmd>` (lädt das Paket für diesen Aufruf herunter; kein Eintrag in `package.json`).

Unter Linux, macOS und WSL setzen Registry-Installationen automatisch das Ausführbar-Bit für das CLI-Skript. Unter Windows erzeugen Paketmanager `.cmd`- und `.ps1`-Shims, die Node explizit aufrufen.

Lege deinen OpenRouter-API-Schlüssel fest:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

Befehle, die OpenRouter aufrufen (`translate-ui`, `translate-docs`, `sync`, `check-models` und verwandte Skripte), benötigen `OPENROUTER_API_KEY` in der Umgebung. `check-markdown` verwendet OpenRouter nicht.

In `ai-i18n-tools.config.json` enthält das `openrouter`-Objekt Modelllisten, `baseUrl`, `maxTokens`, `temperature` und `requestTimeoutMs`: die maximale Wartezeit in Millisekunden pro HTTP-Anfrage an OpenRouter (für Chat-Vervollständigungen und interne `GET /models`-Aufrufe). Der Standardwert ist `30000` (30 Sekunden).

Führen Sie `ai-i18n-tools check-models` aus, um jede konfigurierte Modell-ID mit dem Live-Katalog von OpenRouter zu überprüfen. Es meldet IDs, die fehlen oder abgelaufen sind `expiration_date`, listet gültige Modelle mit geschätzten Ein-/Ausgabepreisen (USD pro 1M Tokens) auf und beendet sich mit einem Status ungleich Null, wenn eine konfigurierte ID ungültig ist. Es erfordert `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Schnellstart

<a id="workflow-1---ui-strings"></a>
### Workflow 1 – UI-Texte

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Integriere i18next in deine App mithilfe der Hilfsfunktionen aus `'ai-i18n-tools/runtime'`:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

<a id="workflow-2---documentation"></a>
### Workflow 2 – Dokumentation

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### Beide Workflows

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## Laufzeit-Hilfsfunktionen

Die folgenden Hilfsfunktionen werden von `'ai-i18n-tools/runtime'` exportiert und funktionieren in jeder JavaScript-Umgebung. Sie müssen i18next nicht importieren, um sie zu verwenden:

| Hilfsprogramm                                                          | Beschreibung                                                                                                                           |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | Standard-i18next-Init-Optionen für Key-as-Default-Konfigurationen.                                                                     |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Empfohlene Verkabelung: Schlüsselbereinigung + Plural-`wrapT` aus `strings.json`, optional fusioniert `translate-ui` `{sourceLocale}.json` Pluralschlüssel. |
| `wrapI18nWithKeyTrim(i18n)` | Nur Wrapper für niedrigstufige Schlüsselbereinigung (veraltet für App-Verkabelung; bevorzugen Sie `setupKeyAsDefaultT`). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | Erstellt die `localeLoaders`-Zuordnung für `makeLoadLocale` aus `ui-languages.json` (jedes `code` außer `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Factory für asynchrones Laden von Lokalisierungsdateien. |
| `getTextDirection(lng)` | Gibt `'ltr'` oder `'rtl'` für einen BCP-47-Code zurück. |
| `applyDirection(lng, element?)` | Setzt das `dir`-Attribut auf `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Anzeigelabel für eine Sprachmenüzeile (mit i18n). |
| `getUILanguageLabelNative(lang)` | Anzeigelabel ohne Aufruf von `t()` (Kopfzeilen-Stil). |
| `interpolateTemplate(str, vars)` | Low-Level `{{var}}`-Substitution an einem einfachen String (wird intern verwendet; Anwendungscode sollte stattdessen `t()` nutzen). |
| `flipUiArrowsForRtl(text, isRtl)` | Kehrt `→` zu `←` für LTR-Layouts um. |

---

<a id="cli-commands"></a>
## CLI-Befehle

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]   Create config file
ai-i18n-tools check-models                          Validate configured OpenRouter model ids against GET /models (pricing, expiration); requires OPENROUTER_API_KEY
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs …                      Translate documentation: markdown/MDX from contentPaths; optional Docusaurus label JSON from jsonSource. Flags include -l/--locale <codes>, -p/-f path, --dry-run,
                                                    --force, --force-update, --stats, --clear-cache, --type, --json-only, --no-json, -j, -b,
                                                    --prompt-format, --emphasis-placeholders, --no-emphasis-placeholders, --debug-failed
ai-i18n-tools write-heading-ids …                   Insert HTML anchor lines before ATX headings in .md/.mdx (documentations[])
ai-i18n-tools strip-md-bold-inline …              Remove bold (**) around inline code in markdown/MDX (documentations[])
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]   Scan documentation markdown for delimiter / inline-code issues and strong-outside-code or strong-outside-link patterns; refresh SQLite markdown_source_issues; exit 1 if any issue
ai-i18n-tools translate-svg …                        SVG files (features.translateSVG + config.svg); flags include -l/--locale <codes>,
                                                    -p/-f path, --dry-run, --force, --force-update, --no-cache, -j, -b
ai-i18n-tools translate-ui …                        Translate UI strings only; flags include -l/--locale <codes>, --dry-run, --force, -j
ai-i18n-tools lint-source …                         Run extract, then LLM review of source-locale UI strings (OpenRouter)
ai-i18n-tools export-ui-xliff …                   Export UI strings to XLIFF 2.0 (one file per locale); -l, -o, --untranslated-only, --dry-run
ai-i18n-tools sync …                                Extract, then UI / SVG / docs; flags include -l/--locale <codes>, -p/-f path, --dry-run, --force,
                                                    --force-update, --no-ui, --no-svg, --no-docs, -j, -b, --emphasis-placeholders,
                                                    --no-emphasis-placeholders, --debug-failed
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools statistics [--max-columns <n>]        Documentation cache + strings.json aggregates (same as editor Statistics)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]   List *.log and cache.db.backup*.sqlite; delete after `y`, with `-f`, or skip if none match
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Vollständige Listen der Befehlsflags werden neben `src/cli/index.ts` in [CLI-Flags nach Befehl](docs/GETTING_STARTED.de.md#cli-flags-by-command) gepflegt. Führen Sie `ai-i18n-tools <command> --help` aus, um den integrierten Hilfetext anzuzeigen.

Globale Optionen für jeden Befehl: `-c <config>` (Standard: `ai-i18n-tools.config.json`), `-v` (ausführlich), optional `-w` / `--write-logs [path]` zum Weiterleiten der Konsolenausgabe in eine Protokolldatei (Standard: im Verzeichnis des Übersetzungscache), `-V` / `--version` sowie `-h` / `--help`. Eine Übersichtstabelle der Befehle finden Sie unter [Erste Schritte](docs/GETTING_STARTED.de.md#cli-reference).

---

<a id="documentation"></a>
## Dokumentation

- [Erste Schritte](docs/GETTING_STARTED.de.md) – vollständige Einrichtungsanleitung für beide Workflows, CLI-Referenz und Konfigurationsfeld-Referenz.
- [Paketübersicht](docs/PACKAGE_OVERVIEW.de.md) – Architektur, Interna, programmatische API und Erweiterungspunkte.
- [KI-Agenten-Kontext](../docs/ai-i18n-tools-context.md) – **für Apps, die das Paket nutzen:** Integrationsanweisungen für nachgelagerte Projekte (in die Agentenregeln des eigenen Repository kopieren).
- Interna für **dieses** Repository: `dev/package-context.md` (nur zum Klonen; nicht auf npm).

---

<a id="license"></a>
## Lizenz

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
