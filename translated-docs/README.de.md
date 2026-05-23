<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Lizenz: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

CLI und Toolkit zur Internationalisierung von JavaScript/TypeScript-Anwendungen und Dokumentationsseiten mithilfe großer Sprachmodelle über [OpenRouter](https://openrouter.ai/). Zwei unabhängige Workflows: **UI-Übersetzung** extrahiert `t("…")`-Aufrufe und erzeugt lokalisierte JSON-Dateien für i18next; **Dokumentenübersetzung** übersetzt Markdown-, MDX- und SVG-Dateien mit einem intelligenten SQLite-Cache, sodass nur geänderte Segmente erneut an das LLM gesendet werden.

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
  - [Workflow 1 – UI-Übersetzung](#workflow-1---ui-translation)
  - [Workflow 2 – Dokumentenübersetzung](#workflow-2---document-translation)
  - [Beide Workflows](#both-workflows)
- [Laufzeit-Hilfsfunktionen](#runtime-helpers)
- [CLI-Befehle](#cli-commands)
- [Dokumentation](#documentation)
- [Lizenz](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## Zwei zentrale Workflows

**Workflow 1 – UI-Übersetzung** – für jedes JS/TS-Projekt, das i18next verwendet (React, Next.js, Node.js, CLIs)

Durchsucht Quelldateien nach `t("…")`-/`i18n.t("…")`-Literalen, erstellt einen Master-Katalog (`strings.json`), übersetzt fehlende Einträge pro Sprache über OpenRouter und schreibt flache JSON-Dateien (`de.json`, `pt-BR.json`, …), die direkt von i18next verwendet werden können.

**Workflow 2 – Dokumentenübersetzung** – für Markdown/MDX-Dokumentationen (Docusaurus, Astro Starlight, einfache README-Dateien)

Übersetzt `.md`- und `.mdx`-Quelldateien in jede Zielsprache mit einem gemeinsamen SQLite-Cache – nur neue oder geänderte Segmente werden an das LLM gesendet. Optional wird ein Docusaurus-Shell-JSON (`jsonSource`, aus `write-translations`) verwendet, das Navigationsleiste, Footer und Theme-UI-Zeichenketten abdeckt. Die Übersetzung von SVG-Dateien erfolgt über `features.translateSVG` und den obersten `svg`-Block.

Beide Workflows nutzen dieselbe `ai-i18n-tools.config.json`-Datei und können unabhängig oder gemeinsam verwendet werden.

---

<a id="installation"></a>
## Installation

Das veröffentlichte Paket ist ausschließlich **ESM** (`"type": "module"`). Erfordert Node.js `>=22.16.0`.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### Verwendung der CLI

**Pro Projekt (empfohlen)** – als Dev-Abhängigkeit installieren und dann über `npx`, `pnpm exec` oder ein `package.json`-Skript ausführen:

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

**Ohne Installation (einmalig)** – `npx ai-i18n-tools <cmd>` oder `pnpm dlx ai-i18n-tools <cmd>` verwenden (wird nur für diesen Aufruf heruntergeladen).

> **Tipp:** Um `ai-i18n-tools` direkt in einer interaktiven Shell ohne `npx` auszuführen, fügen Sie `node_modules/.bin` zu Ihrer `PATH` hinzu (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). Siehe [Erste Schritte](docs/GETTING_STARTED.de.md#installation) für Anweisungen zu direnv und Windows.

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

<a id="workflow-1---ui-translation"></a>
### Workflow 1 – UI-Übersetzung

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Verbinden Sie anschließend i18next in Ihrer Anwendung mithilfe der Hilfsfunktionen aus `'ai-i18n-tools/runtime'`. Siehe [Schritt 4: i18next zur Laufzeit einbinden](docs/GETTING_STARTED.de.md#step-4-wire-i18next-at-runtime) im Leitfaden „Erste Schritte“ für die vollständige Einrichtung.

<a id="workflow-2---document-translation"></a>
### Workflow 2 – Dokumentenübersetzung

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight

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

```bash
ai-i18n-tools version
ai-i18n-tools help [command]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]
ai-i18n-tools check-models
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools lint-source …
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status [--max-columns <n>]
ai-i18n-tools statistics [--max-columns <n>]
ai-i18n-tools dashboard
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]
ai-i18n-tools glossary-generate
```

Vollständige Listen der Befehlsflags finden Sie unter [Erste Schritte – CLI-Referenz](docs/GETTING_STARTED.de.md#cli-reference). Führen Sie `ai-i18n-tools <command> --help` aus, um die integrierte Hilfetextanzeige zu erhalten.

Globale Optionen für jeden Befehl: `-c <config>` (Standard: `ai-i18n-tools.config.json`), `-v` (ausführlich), optional `-w` / `--write-logs [path]` zum Weiterleiten der Konsolenausgabe in eine Protokolldatei (Standard: im Verzeichnis des Übersetzungscache), `-V` / `--version` sowie `-h` / `--help`. Eine Übersichtstabelle der Befehle finden Sie unter [Erste Schritte](docs/GETTING_STARTED.de.md#cli-reference).

---

<a id="documentation"></a>
## Dokumentation

- [Erste Schritte](docs/GETTING_STARTED.de.md) – umfassender Einrichtungsleitfaden für beide Workflows, CLI-Referenz und Konfigurationsreferenz.
- [Leitfaden zu Sprachressourcen](docs/LOCALE-ASSETS-GUIDE.de.md) – Screenshots und illustrierte SVGs in übersetzten Dokumenten (Muster A–E, flacher Link-Umschreiber, Screenshot-Skripte).
- [Paketübersicht](docs/PACKAGE_OVERVIEW.de.md) – Architektur, interne Abläufe, programmatische API und Erweiterungspunkte.
- [KI-Agent-Kontext](../docs/ai-i18n-tools-context.md) – **für Anwendungen, die das Paket nutzen:** Integrationshinweise für nachgelagerte Projekte (in Ihr Repository kopieren).
- Wartungsinterne Informationen für **dieses** Repository: `dev/package-context.md` (nur Klonen; nicht auf npm).

---

<a id="license"></a>
## Lizenz

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
