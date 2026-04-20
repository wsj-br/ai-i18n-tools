<a id="ai-i18n-tools"></a>
# ai-i18n-tools

CLI- und programmatisches Toolkit zur Internationalisierung von JavaScript/TypeScript-Anwendungen und Dokumentationsseiten. Extrahiert UI-Texte, übersetzt sie mithilfe von LLMs über OpenRouter und generiert sprachspezifische JSON-Dateien für i18next sowie Pipelines für Markdown, Docusaurus-JSON und (über `features.translateSVG`, `translate-svg` und den `svg`-Block) eigenständige SVG-Ressourcen.

<small>**In anderen Sprachen lesen:** </small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Zwei Haupt-Workflows](#two-core-workflows)
- [Installation](#installation)
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

**Workflow 2 - Dokumentenübersetzung** (Markdown, Docusaurus-JSON)

Übersetzt `.md` und `.mdx` aus jedem `documentations`-Block-`contentPaths` sowie JSON-Bezeichnungsdateien aus dem `jsonSource`-Ordner dieses Blocks, falls aktiviert. Unterstützt Docusaurus-artige und flache, sprachkennzeichnende Verzeichnisstrukturen pro Block (`documentations[].markdownOutput`). Gemeinsame Stamm-`cacheDir`-Datei enthält den SQLite-Cache, sodass nur neue oder geänderte Segmente an das LLM gesendet werden. **SVG:** Aktiviere `features.translateSVG`, füge den obersten `svg`-Block hinzu und verwende dann `translate-svg` (wird auch über `sync` ausgeführt, wenn beide gesetzt sind).

Beide Workflows teilen sich eine einzige `ai-i18n-tools.config.json`-Datei und können unabhängig oder gemeinsam verwendet werden. Die eigenständige SVG-Übersetzung nutzt `features.translateSVG` sowie den obersten `svg`-Block und läuft über `translate-svg` (oder die SVG-Phase innerhalb von `sync`).

---

<a id="installation"></a>
## Installation

Das veröffentlichte Paket ist **ausschließlich ESM** (`"type": "module"`). Verwende `import` in Node.js, Bundlern oder `import()` — `require('ai-i18n-tools')` **wird nicht unterstützt.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

Lege deinen OpenRouter-API-Schlüssel fest:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

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

Exportiert aus `'ai-i18n-tools/runtime'` – funktionieren in jeder JS-Umgebung, kein i18next-Import erforderlich:

| Helfer | Beschreibung |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Standard-i18next-Init-Optionen für Key-as-Default-Setups. |
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
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Globale Optionen bei jedem Befehl: `-c <config>` (Standard: `ai-i18n-tools.config.json`), `-v` (ausführlich), optional `-w` / `--write-logs [path]` zum Weiterleiten der Konsolenausgabe in eine Protokolldatei (Standard: im Verzeichnis des Übersetzungscaches), `-V` / `--version` und `-h` / `--help`. Siehe [Erste Schritte](docs/GETTING_STARTED.de.md#cli-reference) für befehlsspezifische Flags.

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
