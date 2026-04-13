# ai-i18n-tools

CLI- und programmatisches Toolkit zur Internationalisierung von JavaScript/TypeScript-Anwendungen und Dokumentationsseiten. Extrahiert UI-Texte, übersetzt sie mithilfe von LLMs über OpenRouter und generiert sprachenspezifische JSON-Dateien für i18next sowie Pipelines für Markdown, Docusaurus-JSON und (über `features.translateSVG`, `translate-svg` und den `svg`-Block) eigenständige SVG-Ressourcen.

<small>**In anderen Sprachen lesen:** </small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [hi](./README.hi.md) · [ja](./README.ja.md) · [ko](./README.ko.md) · [pt-BR](./README.pt-BR.md) · [zh-CN](./README.zh-CN.md) · [zh-TW](./README.zh-TW.md)</small>

## Zwei Kernarbeitsabläufe

**Arbeitsablauf 1 - UI-Übersetzung** (React, Next.js, Node.js, jedes i18next-Projekt)

Durchsucht Quell-Dateien nach `t("…")`-Aufrufen, erstellt einen Master-Katalog (`strings.json` mit optionalen **`models`**-Metadaten pro Locale), übersetzt fehlende Einträge pro Locale über OpenRouter und schreibt flache JSON-Dateien (`de.json`, `pt-BR.json`, …), die für i18next bereit sind.

**Arbeitsablauf 2 - Dokumentenübersetzung** (Markdown, Docusaurus JSON)

Übersetzt `.md`- und `.mdx`-Dateien aus den `contentPaths` jedes `documentations`-Blocks sowie JSON-Beschriftungsdateien aus dem `jsonSource` dieses Blocks, wenn aktiviert. Unterstützt Docusaurus-artige und flache, sprachcodesuffixierte Layouts pro Block (`documentations[].markdownOutput`). Ein gemeinsames Stammverzeichnis `cacheDir` enthält den SQLite-Cache, sodass nur neue oder geänderte Segmente an das LLM gesendet werden. **SVG:** Aktivieren Sie `features.translateSVG`, fügen Sie den `svg`-Block auf oberster Ebene hinzu und verwenden Sie anschließend `translate-svg` (wird auch über `sync` ausgeführt, wenn beide aktiviert sind).

Beide Workflows teilen sich eine einzige `ai-i18n-tools.config.json`-Datei und können unabhängig oder zusammen verwendet werden. Die eigenständige SVG-Übersetzung nutzt `features.translateSVG` zusammen mit dem `svg`-Block auf oberster Ebene und wird über `translate-svg` ausgeführt (oder über die SVG-Phase innerhalb von `sync`).

---

## Installation

Das veröffentlichte Paket ist **ESM-only** (`"type": "module"`). Verwende `import` aus Node.js, Bundlern oder `import()` — **`require('ai-i18n-tools')` wird nicht unterstützt.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

Setze deinen OpenRouter API-Schlüssel:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Schnellstart

### Arbeitsablauf 1 - UI-Strings

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract t("…") calls from source
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Integriere i18next in deiner App mithilfe der Helfer aus `'ai-i18n-tools/runtime'`:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);
export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

### Arbeitsablauf 2 - Dokumentation

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### Beide Arbeitsabläufe

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

## Laufzeit-Helfer

Exportiert aus `'ai-i18n-tools/runtime'` - funktioniert in jeder JS-Umgebung, kein i18next-Import erforderlich:

| Helfer | Beschreibung |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | Standard-i18next-Init-Optionen für Key-as-Default-Setups. |
| `wrapI18nWithKeyTrim(i18n)` | Wickelt `i18n.t` so, dass Schlüssel vor der Suche getrimmt werden. |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | Fabrik für das asynchrone Laden von Locale-Dateien. |
| `getTextDirection(lng)` | Gibt `'ltr'` oder `'rtl'` für einen BCP-47-Code zurück. |
| `applyDirection(lng, element?)` | Setzt das `dir`-Attribut auf `document.documentElement`. |
| `getUILanguageLabel(lang, t)` | Anzeige-Label für eine Sprachmenüzeile (mit i18n). |
| `getUILanguageLabelNative(lang)` | Anzeige-Label ohne Aufruf von `t()` (Header-Stil). |
| `interpolateTemplate(str, vars)` | Niedrigstufige `{{var}}`-Substitution auf einem einfachen String (intern verwendet; Anwendungs-Code sollte stattdessen `t()` verwenden). |
| `flipUiArrowsForRtl(text, isRtl)` | Dreht `→` zu `←` für RTL-Layouts. |

---

## CLI-Befehle

```
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools extract                               Scan source for t("…") calls
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status                                Translation status per file × locale
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

Alle Befehle akzeptieren `-c <config>` (Standard: `ai-i18n-tools.config.json`), `-v` (ausführlich) und optional `-w` / `--write-logs [path]`, um die Konsolenausgabe in eine Protokolldatei anzuhängen (Standard: im Verzeichnis des Übersetzungscaches).

---

## Dokumentation

- [Erste Schritte](docs/GETTING_STARTED.de.md) - vollständige Einrichtungsanleitung für beide Workflows, alle CLI-Flags und Referenz der Konfigurationsfelder.
- [Paketübersicht](docs/PACKAGE_OVERVIEW.de.md) - Architektur, interne Abläufe, programmgesteuerte API und Erweiterungspunkte.
- [AI-Agent-Kontext](../docs/ai-i18n-tools-context.md) - prägnanter Projektkontext für Agenten und Wartende, die Code- oder Konfigurationsänderungen vornehmen.

---

## Lizenz

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
