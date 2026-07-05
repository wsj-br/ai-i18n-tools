<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

**Übersetzen Sie Ihre App und Dokumentation mit dem KI-Modell Ihrer Wahl: keine Bindung, keine Umschreibungen.**

`ai-i18n-tools` ist ein CLI und Toolkit zur Internationalisierung von JavaScript/TypeScript-Anwendungen und Dokumentationsseiten – einschließlich Docusaurus, Astro, Starlight, VitePress und einfachem Markdown/MDX – unter Verwendung großer Sprachmodelle.

Verbinden Sie es mit einem beliebigen Anbieter und beginnen Sie mit der Übersetzung: **OpenAI**, **Anthropic**, **Google Gemini**, **NVIDIA**, **DeepSeek**, **Groq**, **Mistral**, **xAI**, **Cerebras**, **Alibaba**, **APIFUN**, jedes [OpenRouter](https://openrouter.ai/)-Modell (Hunderte zur Auswahl mit einem einzigen API-Schlüssel) oder **Ollama** für eine vollständig selbst gehostete Offline-Übersetzung. Wechseln Sie Anbieter oder Modelle pro Projekt – oder sogar pro Sprache – ohne Ihre Codebasis zu ändern.

Eine Konfigurationsdatei steuert drei Übersetzungsmodi, sodass Sie diese je nach Struktur Ihres Inhalts mischen und anpassen können:

- **UI-Strings** – Extrahiert `t("…")`-Aufrufe aus JS/TS (und optional `.astro`-Dateien) und generiert flache, pro-Locale-JSON für i18next oder statische SSG-Suche.
- **Dokumente** – Übersetzt Markdown-, MDX- und `.astro`-Seiten, die in `docs[].contentPaths` aufgeführt sind, mithilfe von `translate-docs`. Funktioniert mit **VitePress**, **Starlight**, **Docusaurus**, Astro-basierten Websites oder jedem statischen Site-Generator, der aus Markdown/MDX/`.astro`-Quelldateien liest.
- **JSON** – Übersetzt beliebige verschachtelte JSON-Bundles, die in `json[]` definiert sind. Verwenden Sie `translate-json`, wenn UI-Texte in pro-Locale-JSON-Dateien statt in `t()`-Aufrufen im Quellcode gespeichert sind.

**SVG**-Assets erhalten ihren eigenen Pfad: `features.translateSVG`, der Top-Level-Block `svg` und `translate-svg` – nicht `docs[].contentPaths`.

**Welches soll ich verwenden?**

| Ihr Inhalt                                                                    | Befehl                                      |
|-------------------------------------------------------------------------------|---------------------------------------------|
| Quellcode verwendet `t()`                                                     | **UI-Strings** – `extract` / `translate-ui` |
| Lokalisierte Seiten oder Dokumentationsseiten (VitePress, Starlight, Docusaurus, Astro usw.) | **Dokumente** – `translate-docs`            |
| Eigenständige, verschachtelte JSON-Locale-Dateien                             | **JSON** – `translate-json`                 |

Alle drei teilen sich einen Datei-/SQLite-Cache, sodass nur neue oder geänderte Segmente (Strings oder Textblöcke) erneut an das Modell gesendet werden – Wiederholungen sind schnell und kostengünstig, unabhängig davon, welchen Anbieter Sie verwenden.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Übersetzungstypen](#translation-types)
- [Installation](#installation)
  - [Verwenden des CLI](#using-the-cli)
- [LLM-Anbieter](#llm-providers)
- [Schnellstart](#quick-start)
  - [UI-Strings](#ui-strings)
  - [Dokumente](#documents)
  - [Astro (reines Astro & Starlight)](#astro-plain-astro--starlight)
  - [Kombinierte Synchronisierung](#combined-sync)
- [Laufzeit-Helfer](#runtime-helpers)
- [CLI-Befehle](#cli-commands)
- [Dokumentation](#documentation)
- [Lizenz](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="translation-types"></a>
## Übersetzungstypen

Jeder Übersetzungstyp hat seinen eigenen Leitfaden mit vollständigen Konfigurationsdetails: [UI-Strings](../docs/guide/ui-strings/), [Dokumente](../docs/guide/documents/) und [JSON](../docs/guide/json.md). Einen direkten Vergleich finden Sie unter [Was ist ai-i18n-tools?](../docs/guide/what-is-ai-i18n-tools.md).

Ein paar Dinge, die man im Voraus wissen sollte: UI-Strings übersetzt fehlende Einträge pro Locale über den aktiven LLM-Anbieter (siehe [LLM-Anbieter](#llm-providers)) und schreibt flache JSON-Dateien (`de.json`, `pt-BR.json`, …), wobei der englische Quelltext als Laufzeit-Suchschlüssel dient – `strings.json` ist der Extraktions-Cache, nicht das Laufzeit-Bundle. Dokumente unterstützt die `docs[].docsOutput.style`-Werte `"nested"`, `"flat"`, `"doc-system"` und die Aliase `"docusaurus"` / `"astro-starlight"` / `"vitepress"` (siehe [Ausgabe-Layouts](../docs/guide/documents/output-layouts.md)). Alle drei teilen sich `ai-i18n-tools.config.json` und können kombiniert werden; `sync` führt Extraktion, UI-Übersetzung, SVG-Übersetzung, `translate-docs` und `translate-json` in der Reihenfolge gemäß Ihren `features`-Flags aus.

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

Nachdem Sie das Paket in Ihrem Projekt installiert haben, verknüpfen Sie den veröffentlichten Bin-Eintrag (`bin/ai-i18n-tools.mjs`) über npm/pnpm/yarn mit `node_modules/.bin/ai-i18n-tools`. Dieser Shim lädt die kompilierte CLI aus dem installierten Paket.

**`package.json`-Skripte (empfohlen)** – npm und pnpm stellen `node_modules/.bin` vor `PATH`, wenn Skripte ausgeführt werden, sodass Sie den reinen Befehlsnamen aufrufen können:

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

Führen Sie dann z. B. `pnpm run i18n:sync` aus – kein `npx`-Präfix erforderlich.

**Interaktive Shell** – von Ihrem Projektstammverzeichnis aus (nach einer lokalen Installation):

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
```

Um den reinen `ai-i18n-tools`-Befehl in Bash/Zsh einzugeben, stellen Sie das lokale Bin-Verzeichnis vor `PATH` (siehe [Verwenden der CLI](../docs/guide/installation.md#using-the-cli) für PowerShell, direnv und Windows-Hinweise):

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

Bevorzugen Sie `sync` gegenüber der manuellen Verkettung von `extract`, `translate-ui`, `translate-svg`, `translate-docs` und `translate-json` – Reihenfolge und Feature-Flags können bei manueller Ausführung leicht falsch sein. Siehe [Empfohlene `package.json`-Skripte](../docs/guide/quick-start.md#recommended-packagejson-scripts) im Schnellstart-Leitfaden.

**Einmalige Installation ohne Installation** – `npx ai-i18n-tools <cmd>` oder `pnpm dlx ai-i18n-tools <cmd>` (lädt das Paket nur für diesen Aufruf herunter; kein Eintrag in `package.json`).

Legen Sie Ihren Anbieter-API-Schlüssel fest (OpenRouter gezeigt; verwenden Sie die passende Variable für Ihren Anbieter):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="llm-providers"></a>
## LLM-Anbieter

Übersetzungsbefehle (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models` und zugehörige Skripte) rufen einen LLM-Anbieter auf; `check-markdown`, `mark-html` und `extract` tun dies nicht.

Konfigurieren Sie Anbieter unter einer Top-Level-Map `providers` und wählen Sie den aktiven mit einem Top-Level-Selektor `provider` aus (optional, wenn genau ein Anbieter konfiguriert ist). Die meisten Anbieter benötigen nur eine Liste `translationModels` — `baseUrl` und die Umgebungsvariable für den API-Schlüssel stammen aus einem integrierten Preset; Sie können `baseUrl`, `apiKeyEnv`, `headers`, `maxTokens`, `temperature` und `requestTimeoutMs` pro Anbieter überschreiben. `requestTimeoutMs` ist die maximale Wartezeit in Millisekunden für jede Anfrage (Standard `30000`).

Um den Anbieter für einen einzelnen Durchlauf zu wechseln, ohne die Konfiguration zu bearbeiten, übergeben Sie die globale Option `-P` / `--provider <name>` (z. B. `ai-i18n-tools -P groq translate-ui`); der Name muss einer der konfigurierten `providers`-Schlüssel sein.

```jsonc
{
  "provider": "openrouter",
  "providers": {
    "openrouter": { "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"] },
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

Integrierte Anbieter-Presets (Schlüssel — Basis-URL — API-Schlüssel-Umgebungsvariable):

| Anbieter     | Basis-URL                                                 | API-Schlüssel-Umgebungsvariable |
|--------------|-----------------------------------------------------------|----------------------|
| `openrouter` | `https://openrouter.ai/api/v1`                            | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (keine) |

Definieren Sie einen benutzerdefinierten OpenAI-kompatiblen Anbieter, indem Sie einen neuen Schlüssel mit `baseUrl` (und `apiKeyEnv`, falls kein Schlüssel benötigt wird) hinzufügen. Modell-IDs sind reine Upstream-IDs – der Anbieter wird auf Konfigurationsebene ausgewählt, sodass kein `provider/`-Präfix erforderlich ist (OpenRouter-IDs behalten ihr natives `vendor/model`-Format).

Die Token-Nutzung wird für jeden Anbieter gemeldet; die genauen USD-Kosten werden nur angezeigt, wenn der Anbieter sie zurückgibt (OpenRouter). `ai-i18n-tools check-models` validiert konfigurierte Modell-IDs anhand der Live-`GET /models`-Liste des aktiven Anbieters (jeder Anbieter) und zeigt die Preise an, wenn der Anbieter sie zurückgibt (z. B. OpenRouter). `ai-i18n-tools list-models` listet jedes Modell auf, das der aktive Anbieter bewirbt (verwenden Sie `-P` / `--provider`, um einen anderen konfigurierten Anbieter zu überprüfen). `ai-i18n-tools bench-models` bewertet jedes konfigurierte Modell, indem es ein Beispiel isoliert übersetzt (Modelle laufen parallel, begrenzt durch `concurrency`) und gibt die Eingabe-/Ausgabe-Tokens pro Modell, die Wanduhrzeit und die USD-Kosten aus.

Ein Legacy-Konfigurationsblock auf oberster Ebene `openrouter` wird weiterhin akzeptiert und beim Laden automatisch in `providers.openrouter` (mit `provider: "openrouter"`) migriert.

Eine praktische Demo zum Wechseln von Anbietern mit `-P` für ein einzelnes Dokument finden Sie unter [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/).

---

<a id="quick-start"></a>
## Schnellstart

<a id="ui-strings"></a>
### UI-Strings

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

Verbinden Sie dann i18next in Ihrer App mit den Hilfsfunktionen von `'ai-i18n-tools/runtime'`. Die vollständige Einrichtung finden Sie unter [Schritt 4: i18next zur Laufzeit verbinden](../docs/guide/ui-strings/i18next-runtime.md) im UI-Strings-Leitfaden.

<a id="documents"></a>
### Dokumente

Die Standard-`init`-Vorlage (`ui-markdown`) aktiviert nur die UI-Extraktion. Verwenden Sie eine dokumentationsorientierte Vorlage (oder aktivieren Sie `features.translateDocs` und fügen Sie `docs[]` hinzu), bevor Sie `translate-docs` durchführen:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# VitePress documentation (pages + theme JSON)
# npx ai-i18n-tools init -t ui-vitepress

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

Bearbeiten Sie `ai-i18n-tools.config.json`: Setzen Sie `docs[].contentPaths` auf Markdown-, MDX- und/oder `.astro`-Quellen; `docs[].outputDir` und `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"vitepress"`, `"flat"` usw.). Vollständige Feldreferenz: [Dokumente](../docs/guide/documents/).

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress` erstellt `docsOutput.style: "vitepress"` sowie einen `json[]`-Block für Theme-/Navigations-/Seitenleisten-Strings. Führen Sie `sync` aus, um Seiten-Markdown und `theme.{locale}.json` zusammen zu übersetzen. Siehe [VitePress-Integration](../docs/guide/vitepress-integration.md) und [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/).

<a id="astro-plain-astro--starlight"></a>
### Astro (reines Astro & Starlight)

**Astro Starlight** – `init -t ui-starlight`, dann `translate-docs`. Starlight UI-Überschreibungen können `src/content/i18n/en.json` mit `jsonPathTemplate` in einem separaten `docs[]`-Block verwenden, wenn nötig ([Dokumente – für die Dokumentation initialisieren](../docs/guide/documents/index.md#step-1-initialise-for-documentation)).

**Plain Astro** (Marketing- oder App-Sites, nicht Starlight) – kombinieren Sie [Astro integriertes i18n-Routing](https://docs.astro.build/en/guides/internationalization/) mit ai-i18n-tools. Referenzprojekt: [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (Englisch unter `/`, Gebietsschemas unter `/{locale}/`).

Die meisten Teams verwenden eine **hybride** Kombination aus zwei Pipelines:

| Pipeline               | Verwendung für                                                       | Befehle                    | Ausgabe                                                |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **Seiten-HTML**          | Überschriften, Absätze, Navigationsbeschriftungen, Inline-Arrays im Vorlagenkörper | `translate-docs`           | `src/pages/{locale}/index.astro` pro Gebietsschema            |
| **UI-Texte (`t()`)** | Frontmatter-Daten, Reiterbeschriftungen, gemeinsam genutzte Arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (Englischer Quelltext als Schlüssel) |

Gerüst-UI mit `init -t ui-astro-website`. Für fest codiertes HTML auf `.astro`-Seiten aktivieren Sie `features.translateDocs` und fügen einen `docs[]`-Block mit `docsOutput.style: "astro-starlight"` hinzu (siehe [Astro-Website-Seiten (parsen und ersetzen)](../docs/guide/ui-strings/astro-website.md#astro-website-pages-parse-and-replace)). Halten Sie `targetLocales`, `i18n.locales` in `astro.config.mjs` und `ui-languages.json` aufeinander abgestimmt (Astro-Routen verwenden Kleinbuchstaben-Codes wie `pt-br`; Flat-Bundle-Dateinamen folgen der Konfigurationsschreibweise, z. B. `pt-BR.json`).

Verbinden Sie `t()` zur Build-Zeit ohne i18next, es sei denn, Sie fügen Client-Islands hinzu – siehe [Astro-Website-UI-Strings (SSG)](../docs/guide/ui-strings/astro-website.md#astro-website-ui-strings-ssg) und die `src/i18n/t.ts` des Beispiels.

<a id="combined-sync"></a>
### Kombinierte Synchronisierung

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
ai-i18n-tools list-models
ai-i18n-tools bench-models [--models <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

Für reine HTML-Anwendungen versehen Sie Elemente mit bloßen `data-i18n` / `data-i18n-title` / `data-i18n-placeholder`-Markierungen (der Quelltext wird aus dem eigenen textContent / title / placeholder des Elements entnommen und einmal geschrieben); `mark-html` fügt sie für Sie ein und `extract` erfasst sie dann in `strings.json`. Siehe [HTML zur Übersetzung markieren](../docs/guide/ui-strings/plain-html.md#marking-html-for-translation).

Vollständige Listen der Befehlsflags finden Sie in der [CLI-Referenz](../docs/reference/cli-commands.md). Führen Sie `ai-i18n-tools <command> --help` aus, um den integrierten Verwendungstext anzuzeigen.

Globale Optionen: `-c <config>` (Standard: `ai-i18n-tools.config.json`), `-v` (ausführlich), `-P` / `--provider <name>` (überschreibt den aktiven LLM-Anbieter; muss unter `providers` konfiguriert werden), `-L` / `--ui-lang <code>` (Sprache für die UI/Protokolle des Tools), `-V` / `--version` und `-h` / `--help` – bei jedem Befehl akzeptiert. `-w` / `--write-logs [path]` leitet die Konsolenausgabe in eine Protokolldatei um (Standard: unter dem Übersetzungs-Cache-Verzeichnis), wirkt sich aber nur auf die Übersetzungs- und Synchronisierungsbefehle aus (`translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, `cleanup`). Mehrere Befehle akzeptieren `-l` / `--locale <codes>` (durch Kommas getrennte BCP-47), um die Ziel-Locales zu begrenzen; `proofread-ui` verwendet eine einzelne Quell-Locale. Eine Übersichtstabelle der Befehle finden Sie unter [CLI-Referenz](../docs/reference/cli-commands.md).

<a id="tool-ui-language-logs-help-dashboard"></a>
### UI-Sprache des Tools (Protokolle, Hilfe, Dashboard)

Das Tool lokalisiert seine eigene CLI-Hilfe, häufig verwendete Protokoll-/Zusammenfassungsnachrichten und das Translation Dashboard. Das UI-Locale wird aus den folgenden Quellen ermittelt, wobei die höchste Priorität zuerst gilt:

1. `-L` / `--ui-lang <code>` globale Flagge (z. B. `-L pt-BR`).
2. `AI_I18N_LANG` Umgebungsvariable (z. B. `export AI_I18N_LANG=es`).
3. Der `uiLanguage` Konfigurationsschlüssel in `ai-i18n-tools.config.json` (BCP-47-String).
4. Das Host-Betriebssystem-Locale (über `Intl.DateTimeFormat().resolvedOptions().locale`).

Die angeforderte Locale wird exakt oder durch die nächstgelegene Variante mit den ausgelieferten UI-Sprachen abgeglichen (z. B. wird `pt-PT` zu `pt-BR` und `en-US` zu `en-GB` aufgelöst); wenn nichts übereinstimmt, wird auf die Quell-Locale (`en-GB`) zurückgegriffen. Wenn eine UI-Sprache explizit angefordert wird (über das Flag, die Umgebungsvariable oder `uiLanguage`), aber kein ausgeliefertes Bundle übereinstimmt, gibt die CLI eine einmalige Warnung aus, dass die Standard-Locale verwendet wird; eine nur vom Host-Betriebssystem abgeleitete Locale warnt nie. Dies ist unabhängig von den `sourceLocale` / `targetLocales` Ihres Projekts. Ausgelieferte UI-Sprachen: `en-GB` (Quelle) plus `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans` und `zh-Hant`. Keine Konfiguration erforderlich – standardmäßig folgt das Tool der Locale Ihres Betriebssystems. Details finden Sie unter [Tool-UI-Sprache](../docs/reference/environment-variables.md#tool-ui-language).

---

<a id="documentation"></a>
## Dokumentation

- [Dokumentationsseite](https://wsj-br.github.io/ai-i18n-tools/) – vollständiger VitePress-Leitfaden (9 Locales auf GitHub Pages).
- [Schnellstart](../docs/guide/quick-start.md) – Einrichtung für UI-Strings, Dokumente und JSON (UI, Docs/`.astro`, JSON-Bundles, Astro Starlight und reines Astro).
- [Locale-Assets-Leitfaden](../docs/guide/images-and-screenshots/) – Screenshots und illustrierte SVGs in übersetzten Dokumenten (Flat-Link-Rewriter, Screenshot-Skripte).
- [Architektur](../docs/reference/architecture.md) – Architektur, Interna, programmatische API und Erweiterungspunkte.
- [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) – **für Apps, die das Paket verwenden:** Integrations-Prompts für Downstream-Projekte (in die Agentenregeln Ihres Repos kopieren).
- Interne Wartungsdetails für **dieses** Repository: `dev/package-context.md` (nur Klonen; nicht auf npm).

---

<a id="license"></a>
## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. 
Details finden Sie in der Datei [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE).

Copyright &copy; 2026 Waldemar Scudeller Jr.
