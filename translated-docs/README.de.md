<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![Lizenz: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

Eine CLI und ein Toolkit zum Internationalisieren von JavaScript/TypeScript-Anwendungen und Dokumentationsseiten mithilfe großer Sprachmodelle über [OpenRouter](https://openrouter.ai/). Drei modulare Workflows, die alle eine einzige Konfigurationsdatei nutzen, unterstützen unterschiedliche Übersetzungsanforderungen:

- **Workflow 1 – UI-Übersetzung:** Extrahiert `t("…")`-Aufrufe aus JS/TS (und optional aus `.astro`-Dateien) und generiert flache, sprachspezifische JSON-Dateien für i18next oder statische SSG-Nachschlagetabellen.
- **Workflow 2 – Dokumentenübersetzung:** Übersetzt Markdown-, MDX- und `.astro`-Seiten (für Websites und Starlight), die in `docs[].contentPaths` mit `translate-docs` aufgelistet sind.
- **Workflow 3 – JSON-Dateiübersetzung:** Übersetzt beliebige geschachtelte JSON-Bundles, die in `json[]` definiert sind. Verwenden Sie `translate-json`, wenn UI-Texte in sprachspezifischen JSON-Dateien gespeichert sind, anstatt `t()` im Quellcode zu verwenden.

**SVG**-Dateien werden mithilfe von `features.translateSVG`, dem obersten `svg`-Block und `translate-svg` übersetzt – nicht mit `docs[].contentPaths`.

**Welchen Workflow sollte ich verwenden?**
- Quellcode verwendet `t()` → **Workflow 1** (`extract` / `translate-ui`)
- Lokalisierte Seiten oder Docusaurus-Katalog-JSON → **Workflow 2** (`translate-docs`)
- Nur eigenständige, geschachtelte JSON-Sprachdateien → **Workflow 3** (`translate-json`)

Alle Workflows verwenden eine Datei- oder SQLite-Cache, um sicherzustellen, dass nur neue oder geänderte Segmente (Zeichenketten oder Textabschnitte) an das LLM gesendet werden.

<small>**In anderen Sprachen lesen:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Kern-Workflows](#core-workflows)
- [Installation](#installation)
  - [Verwendung der CLI](#using-the-cli)
- [OpenRouter](#openrouter)
- [Schnellstart](#quick-start)
  - [Workflow 1 – UI-Übersetzung](#workflow-1---ui-translation)
  - [Workflow 2 – Dokumentenübersetzung](#workflow-2---document-translation)
  - [Astro (reines Astro & Starlight)](#astro-plain-astro--starlight)
  - [Kombinierter Workflow](#combined-workflow)
- [Laufzeit-Hilfsfunktionen](#runtime-helpers)
- [CLI-Befehle](#cli-commands)
- [Dokumentation](#documentation)
- [Lizenz](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## Kern-Workflows

**Workflow 1 – UI-Übersetzung** – für jedes JS/TS-Projekt mit i18next (React, Next.js, Node.js, CLIs) oder statischem Astro SSG

Durchsucht Quelldateien nach `t("…")`-/`i18n.t("…")`-Literalen (fügen Sie `.astro` zu `ui.uiExtractor.extensions` hinzu, um Astro-Frontmatter und Template-Ausdrücke einzubeziehen), erstellt einen Hauptkatalog (`strings.json`), übersetzt fehlende Einträge pro Sprache über OpenRouter und schreibt flache JSON-Dateien (`de.json`, `pt-BR.json`, …). Der englische Quelltext ist der Laufzeitschlüssel in diesen Bundles – `strings.json` ist der Extraktions-Cache, nicht das Laufzeit-Bundle.

**Workflow 2 – Dokumentenübersetzung** – für Markdown-, MDX- und `.astro`-Dateien unter `docs[].contentPaths`

Primär für **Markdown-, MDX- und `.astro`-Dokumentation** konzipiert (Docusaurus, [Astro Starlight](https://starlight.astro.build/), einfache README-Dateien und reine Astro-Marketingseiten). `translate-docs` schreibt lokalisierte Kopien mit einem gemeinsamen SQLite-Cache. Auf Docusaurus-Seiten setzen Sie `docs[].docusaurusCatalogDir` auf den `write-translations`-Katalogordner, damit Shell-JSON (Navigationsleiste, Fußzeile, Theme-Texte) im selben Befehl übersetzt wird. `docs[].docsOutput.style` unterstützt `"nested"`, `"flat"`, `"doc-system"` und Aliase `"docusaurus"` / `"astro-starlight"` (siehe [Ausgabe-Layouts](docs/GETTING_STARTED.de.md#output-layouts) im Schnellstart). Beliebige geschachtelte UI-JSON-Dateien, die kein Docusaurus-Katalog sind, gehören in Workflow 3 (`json[]` / `translate-json`), nicht in `docs[]`.

**Workflow 3 – JSON-Dateiübersetzung** – geschachtelte Sprach-JSON-Dateien ohne `t()` im Quellcode

Übersetzen Sie Dateien wie `src/i18n/en/translation.json` über den obersten `json[]`, `features.translateJson` und `translate-json`. Erstellen Sie das Gerüst mit `init -t ui-json-bundles`.

Alle Workflows nutzen `ai-i18n-tools.config.json` gemeinsam und können kombiniert werden; `sync` führt nacheinander Extraktion, UI-Übersetzung, SVG-Übersetzung, `translate-docs` und `translate-json` entsprechend Ihren `features`-Flags aus.

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
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Sie können auch direkt die ai-i18n-tools CLI-Befehle verwenden, z. B. `ai-i18n-tools sync`.

Bevorzugen Sie `sync` gegenüber manuellem Kettenschalten von `extract`, `translate-ui`, `translate-svg`, `translate-docs` und `translate-json` – Reihenfolge und Feature-Flags sind bei manueller Ausführung leicht falsch. Siehe [Empfohlene `package.json`-Skripte](docs/GETTING_STARTED.de.md#recommended-packagejson-scripts) im Schnellstart.

**Ohne Installation (einmalig)** – `npx ai-i18n-tools <cmd>` oder `pnpm dlx ai-i18n-tools <cmd>` verwenden (wird nur für diesen Aufruf heruntergeladen).

> **Tipp:** Um `ai-i18n-tools` direkt in einer interaktiven Shell ohne `npx` auszuführen, fügen Sie `node_modules/.bin` zu Ihrer `PATH` hinzu (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). Siehe [Erste Schritte](docs/GETTING_STARTED.de.md#installation) für Anweisungen zu direnv und Windows.

Lege deinen OpenRouter-API-Schlüssel fest:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

Befehle, die OpenRouter aufrufen (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models` und verwandte Skripte), benötigen `OPENROUTER_API_KEY` in der Umgebung. `check-markdown` verwendet OpenRouter nicht.

In `ai-i18n-tools.config.json` enthält das `openrouter`-Objekt Modelllisten, `baseUrl`, `maxTokens`, `temperature` und `requestTimeoutMs`: die maximale Wartezeit in Millisekunden pro HTTP-Anfrage an OpenRouter (für Chat-Vervollständigungen und interne `GET /models`-Aufrufe). Der Standardwert ist `30000` (30 Sekunden).

Führen Sie `ai-i18n-tools check-models` aus, um jede konfigurierte Modell-ID mit dem Live-Katalog von OpenRouter zu überprüfen. Es meldet IDs, die fehlen oder abgelaufen sind `expiration_date`, listet gültige Modelle mit geschätzten Ein-/Ausgabepreisen (USD pro 1M Tokens) auf und beendet sich mit einem Status ungleich Null, wenn eine konfigurierte ID ungültig ist. Es erfordert `OPENROUTER_API_KEY`.

---

<a id="quick-start"></a>
## Schnellstart

<a id="workflow-1---ui-translation"></a>
### Workflow 1 – UI-Übersetzung

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Verbinden Sie anschließend i18next in Ihrer Anwendung mithilfe der Hilfsfunktionen aus `'ai-i18n-tools/runtime'`. Siehe [Schritt 4: i18next zur Laufzeit einbinden](docs/GETTING_STARTED.de.md#step-4-wire-i18next-at-runtime) im Leitfaden „Erste Schritte“ für die vollständige Einrichtung.

<a id="workflow-2---document-translation"></a>
### Workflow 2 – Dokumentenübersetzung

Die Standard-`init`-Vorlage (`ui-markdown`) aktiviert nur die UI-Extraktion. Verwenden Sie eine dokumentationsorientierte Vorlage (oder aktivieren Sie `features.translateDocs` und fügen Sie `docs[]` hinzu), bevor Sie `translate-docs` durchführen:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

Bearbeiten Sie `ai-i18n-tools.config.json`: Legen Sie `docs[].contentPaths` auf Markdown-, MDX- und/oder `.astro`-Quellen fest; `docs[].outputDir` und `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"flat"` usw.). Vollständige Feldreferenz: [Workflow 2 - Dokumentübersetzung](docs/GETTING_STARTED.de.md#workflow-2---document-translation).

<a id="astro-plain-astro--starlight"></a>
### Astro (reines Astro & Starlight)

**Astro Starlight** — `init -t ui-starlight`, dann `translate-docs`. Starlight-UI-Überschreibungen können `src/content/i18n/en.json` mit `jsonPathTemplate` in einem separaten `docs[]`-Block verwenden, wenn nötig ([Erste Schritte → Workflow 2](docs/GETTING_STARTED.de.md#step-1-initialise-for-documentation)).

**Reines Astro** (Marketing- oder App-Seiten, nicht Starlight) — kombinieren Sie die [integrierte i18n-Routing-Funktion von Astro](https://docs.astro.build/en/guides/internationalization/) mit ai-i18n-tools. Referenzprojekt: [`examples/astro-website`](../examples/astro-website/) (Englisch unter `/`, Sprachversionen unter `/{locale}/`).

Die meisten Teams verwenden eine **hybride** Kombination aus zwei Pipelines:

| Pipeline | Verwendung für | Befehle | Ausgabe |
|----------|---------|----------|--------|
| **Seiten-HTML** | Überschriften, Absätze, Navigationsbezeichnungen, inline-Arrays im Vorlagen-Body | `translate-docs` | `src/pages/{locale}/index.astro` pro Sprache |
| **UI-Texte (`t()`)** | Frontmatter-Daten, Reiterbeschriftungen, gemeinsam genutzte Arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (Englischer Quelltext als Schlüssel) |

Erstellen Sie das UI-Gerüst mit `init -t ui-astro-website`. Für hartkodierte HTML-Inhalte in `.astro`-Seiten aktivieren Sie `features.translateDocs` und fügen einen `docs[]`-Block mit `docsOutput.style: "astro-starlight"` hinzu (siehe [Astro-Website-Seiten (parsen-und-ersetzen)](docs/GETTING_STARTED.de.md#astro-website-pages-parse-and-replace)). Halten Sie `targetLocales`, `i18n.locales` in `astro.config.mjs` und `ui-languages.json` synchron (Astro-Routen verwenden Kleinbuchstaben wie `pt-br`; flache Bundle-Dateinamen folgen der Groß-/Kleinschreibung der Konfiguration, z. B. `pt-BR.json`).

Binden Sie `t()` zur Build-Zeit ein, ohne i18next zu verwenden, es sei denn, Sie fügen Client-Islands hinzu — siehe [Astro-Website-UI-Texte (SSG)](docs/GETTING_STARTED.de.md#astro-website-ui-strings-ssg) und das Beispiel mit `src/i18n/t.ts`.

<a id="combined-workflow"></a>
### Kombinierter Workflow

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## Laufzeit-Hilfsfunktionen

Die folgenden Hilfsfunktionen werden von `'ai-i18n-tools/runtime'` exportiert und funktionieren in jeder JavaScript-Umgebung. Sie müssen i18next nicht importieren, um sie zu verwenden:

| Hilfsprogramm                                                          | Beschreibung                                                                                                                           |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | Standard-i18next-Init-Optionen für Key-as-Default-Konfigurationen.                                                                     |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | Empfohlene Verkabelung: Schlüsselbereinigung + Plural-`wrapT` aus `strings.json`, optional fusioniert `translate-ui` `{sourceLocale}.json` Pluralschlüssel. |
| `wrapT(i18n, options)`                                                 | Niedrigstufige, pluralbehaftete `t()`-Wrapper (normalerweise installiert von `setupKeyAsDefaultT`).                                                    |
| `buildPluralIndexFromStringsJson(entries)`                               | Erstellt den Pluralgruppenindex, den `wrapT` aus Katalogzeilen mit `"plural": true` verwendet.                                                    |
| `extractInterpolationNamesForWrap(key)`                                  | Parst `{{var}}`-Namen aus einem Quellschlüssel für `wrapT` / Schlüsselkürzung-Rückfalloption.                                                              |
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
ai-i18n-tools check-models
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

Vollständige Listen der Befehlsflags finden Sie unter [Erste Schritte – CLI-Referenz](docs/GETTING_STARTED.de.md#cli-reference). Führen Sie `ai-i18n-tools <command> --help` aus, um die integrierte Hilfetextanzeige zu erhalten.

Globale Optionen für jeden Befehl: `-c <config>` (Standard: `ai-i18n-tools.config.json`), `-v` (ausführlich), optional `-w` / `--write-logs [path]` zum Weiterleiten der Konsolenausgabe in eine Protokolldatei (Standard: im Verzeichnis des Übersetzungscaches), `-V` / `--version` sowie `-h` / `--help`. Mehrere Befehle akzeptieren `-l` / `--locale <codes>` (kommagetrennte BCP-47-Codes), um Ziel-Sprachen einzuschränken; `lint-source` verwendet eine einzelne Quellsprache. Siehe [Erste Schritte](docs/GETTING_STARTED.de.md#cli-reference) für die Übersichtstabelle der Befehle.

---

<a id="documentation"></a>
## Dokumentation

- [Erste Schritte](docs/GETTING_STARTED.de.md) - vollständige Einrichtung für alle Workflows (UI, Docs/`.astro`, JSON-Bundles, Astro Starlight und reines Astro), CLI-Referenz und Konfigurationsfeldreferenz.
- [Leitfaden zu Lokalisierungsressourcen](docs/LOCALE-ASSETS-GUIDE.de.md) - Screenshots und illustrierte SVGs in übersetzten Dokumenten (Muster A–E, flacher Link-Umschreiber, Screenshot-Skripte).
- [Paketübersicht](docs/PACKAGE_OVERVIEW.de.md) - Architektur, interne Abläufe, programmatische API und Erweiterungspunkte.
- [KI-Agenten-Kontext](../docs/ai-i18n-tools-context.md) - **für Anwendungen, die das Paket nutzen:** Integrationshinweise für nachgelagerte Projekte (in Ihr Repository-Agentenregeln kopieren).
- Wartungsinterne Informationen für **dieses** Repository: `dev/package-context.md` (nur Klonen; nicht auf npm).

---

<a id="license"></a>
## Lizenz

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
