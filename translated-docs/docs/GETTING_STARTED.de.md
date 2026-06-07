<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: Erste Schritte

Das `ai-i18n-tools`-Paket bietet drei unterschiedliche, modulare Workflows:

- **Workflow 1 – UI-Übersetzung**: Extrahieren Sie `t("…")`-Aufrufe aus jeder JS/TS-Quelle, übersetzen Sie sie über OpenRouter und schreiben Sie flache, sprachspezifische JSON-Dateien, die für i18next bereitstehen.
- **Workflow 2 – Dokumentübersetzung**: Übersetzen Sie **Markdown-, MDX- und `.astro`-Seiten**, die in `docs[].contentPaths` aufgelistet sind, über `translate-docs` mit intelligenter Zwischenspeicherung. Optional wird das **Docusaurus-Katalog-JSON** (`docs[].docusaurusCatalogDir`, aus `docusaurus write-translations`) im selben Befehl übersetzt, wenn `features.translateDocs` aktiviert ist – also Seitenelemente (Navigationsleiste, Fußzeile, Theme-Texte), nicht den Textinhalt in `docs/`.
- **Workflow 3 – JSON-Dateiübersetzung**: Übersetzen Sie beliebige verschachtelte JSON-Bundles (z. B. `src/i18n/en/translation.json`) über die oberste Ebene `json[]`, `features.translateJson` und `translate-json` – für Seiten, die UI-Texte in sprachspezifischen JSON-Dateien anstelle von `t()` im Quellcode speichern.

**SVG**-Ressourcen verwenden `features.translateSVG`, den obersten `svg`-Block und `translate-svg` (siehe [CLI-Referenz](#cli-reference)).

**Welcher Workflow?**

- Benutzerorientierte Zeichenketten in der Quelle über `t()` → Workflow 1 (`extract` / `translate-ui`).
- Lokalisierte Seiten oder Docusaurus-Shell-JSON → Workflow 2 (`translate-docs`).
- Nur eigenständige, geschachtelte JSON-Lokalisierungsdateien → Workflow 3 (`translate-json`).

Alle drei Workflows verwenden OpenRouter (jeden kompatiblen LLM) und teilen sich eine einzige Konfigurationsdatei.

<small>**In anderen Sprachen lesen:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Installation](#installation)
  - [Verwendung der CLI](#using-the-cli)
- [Schnellstart](#quick-start)
  - [Empfohlene `package.json`-Skripte](#recommended-packagejson-scripts)
- [Workflow 1 – UI-Übersetzung](#workflow-1---ui-translation)
  - [Schritt 1: Initialisieren](#step-1-initialise)
  - [Schritt 2: Zeichenketten extrahieren](#step-2-extract-strings)
  - [Astro-Website (reines Astro, nicht Starlight)](#astro-website-plain-astro-not-starlight)
  - [UI-Zeichenketten der Astro-Website (SSG)](#astro-website-ui-strings-ssg)
  - [Astro-Website-Seiten (parsen-und-ersetzen)](#astro-website-pages-parse-and-replace)
  - [Schritt 3: UI-Zeichenketten übersetzen](#step-3-translate-ui-strings)
  - [Export nach XLIFF 2.0 (optional)](#exporting-to-xliff-20-optional)
  - [Schritt 4: i18next zur Laufzeit einbinden](#step-4-wire-i18next-at-runtime)
    - [`SOURCE_LOCALE` synchron halten](#keeping-source_locale-aligned)
    - [Lokalisierungslader](#locale-loaders)
    - [Referenz zu Laufzeit-Helfern](#runtime-helpers-reference)
  - [`t()` im Quellcode verwenden](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Kardinal-Pluralformen (`plurals: true`)](#cardinal-plurals-plurals-true)
    - [Speicherung und Ausgabe von Pluralformen](#how-plurals-are-stored-and-emitted)
  - [Sprachumschalter-UI](#language-switcher-ui)
  - [RTL-Sprachen](#rtl-languages)
- [Workflow 2 – Dokumentenübersetzung](#workflow-2---document-translation)
  - [Schritt 1: Für Dokumentation initialisieren](#step-1-initialise-for-documentation)
  - [Schritt 2: Dokumente übersetzen](#step-2-translate-documents)
    - [Komplexes Markdown und fehlgeschlagene Qualitätsprüfungen](#complex-markdown-and-failed-quality-checks)
    - [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags)
    - [Batch-Prompt-Format](#batch-prompt-format)
    - [Segment-Dedupe und Pfade in SQLite](#segment-dedupe-and-paths-in-sqlite)
  - [Ausgabe-Layouts](#output-layouts)
    - [Ankerlinks bei `docsOutput.style = "flat"`](#anchor-links-when-docsoutputstyle--flat)
    - [Bilder und Raster-Assets in übersetzten Dokumenten](#images-and-raster-assets-in-translated-docs)
    - [Sprachumschalter (`languageListBlock`)](#language-switcher-languagelistblock)
    - [`pathTemplate` / `jsonPathTemplate`-Platzhalter](#pathtemplate--jsonpathtemplate-placeholders)
  - [Problembehandlung](#troubleshooting)
- [Workflow 3 – JSON-Datei-Übersetzung](#workflow-3---json-file-translation)
  - [Schritt 1: Für geschachtelte JSON initialisieren](#step-1-initialise-for-nested-json)
  - [Schritt 2: `json[]` konfigurieren](#step-2-configure-json)
  - [Schritt 3: JSON-Bundles übersetzen](#step-3-translate-json-bundles)
  - [Workflow 3 im Vergleich zu anderen Pipelines](#workflow-3-vs-other-pipelines)
- [Kombinierter Workflow (UI + Dokumente)](#combined-workflow-ui--docs)
  - [Gemischter Dokumentationsworkflow (`docsOutput.style = "docusaurus"` + `"flat"`)](#mixed-documentation-workflow-docsoutputstyle--docusaurus--flat)
- [Übersetzungs-Dashboard](#translation-dashboard)
  - [Fehler (Dokumentenübersetzung)](#failures-document-translation)
    - [Wann es verwendet werden sollte](#when-to-use-it)
    - [Warum Quelltextänderungen wichtig sind](#why-source-edits-matter)
    - [Verwendung des Tabs](#how-to-use-the-tab)
  - [Markdown-Probleme (statische Prüfungen)](#markdown-issues-static-checks)
- [Konfigurationsreferenz](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (optional)](#uilanguagespath-optional)
  - [`concurrency` (optional)](#concurrency-optional)
  - [`batchConcurrency` (optional)](#batchconcurrency-optional)
  - [`fileConcurrency` (optional)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (optional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [Best Practice für Git-Ausschlüsse:](#best-practice-for-git-exclusions)
  - [`docs`](#docs)
  - [`json`](#json)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLI-Referenz](#cli-reference)
  - [Stamm- und globale Optionen](#root-and-global-options)
  - [Hilfe pro Befehl](#per-command-help)
  - [Zielsprachen (`-l` / `--locale`)](#target-locales--l----locale)
- [Umgebungsvariablen](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## Installation

Das veröffentlichte Paket ist **ausschließlich ESM**. Verwenden Sie `import`/`import()` in Node.js oder Ihrem Bundler; verwenden Sie nicht `require('ai-i18n-tools')`. Das Paket deklariert `engines.node` `>=22.16.0`; ältere Node.js-Versionen werden nicht unterstützt. Die npm-Tarball-Datei enthält nur englische Dateien unter `docs/`; sprachspezifische Kopien unter `translated-docs/` befinden sich im [GitHub-Repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools enthält einen eigenen Zeichenketten-Extraktor. Wenn Sie zuvor `i18next-scanner`, `babel-plugin-i18next-extract` oder Ähnliches verwendet haben, können Sie diese Dev-Abhängigkeiten nach der Migration entfernen.

<a id="using-the-cli"></a>
### Verwendung der CLI

**Pro Projekt (empfohlen)** – als Abhängigkeit oder devDependency installieren und dann über `npx`, `pnpm exec` oder ein `package.json`-Skript aufrufen. `package.json`-Skripte werden bereits mit `node_modules/.bin` auf `PATH` ausgeführt, daher rufen Befehle wie `pnpm run i18n:sync` die CLI auf, ohne dass `npx` eingegeben werden muss.

**Direktes** `ai-i18n-tools` **im Terminal:** Um die CLI direkt in einer interaktiven Shell auszuführen (vom Projektstamm aus, nach einer lokalen Installation), fügen Sie das lokale Bin-Verzeichnis an `PATH` an:

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

Oder erstellen Sie eine `.env`-Datei im Projektstammverzeichnis:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## Schnellstart

Die Standard-`init`-Vorlage (`ui-markdown`) ermöglicht ausschließlich die **UI**-Extraktion und -Übersetzung. Die Vorlagen `ui-docusaurus` und `ui-starlight` aktivieren die **Dokumenten**-Übersetzung (`translate-docs`). Die `ui-astro-website`-Vorlage erstellt das Gerüst für die **UI**-Extraktion in reinen Astro-Anwendungen (einschließlich `.astro`-Dateien); fügen Sie einen `docs[]`-Block hinzu (siehe [Astro-Website-Seiten (parsen-und-ersetzen)](#astro-website-parse-and-replace)), wenn Sie auch `translate-docs` für `.astro`-Seiten-HTML möchten. Die Referenz-[`examples/astro-website`](../../docs/../examples/astro-website/) verwendet **beide** Pipelines. Verwenden Sie `sync`, wenn Sie einen Befehl wünschen, der Extraktion, UI-Übersetzung, optionale SVG-Datei-Übersetzung und Dokumentenübersetzung gemäß Ihrer Konfiguration ausführt.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# Workflow 3 - nested JSON bundles (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Empfohlene `package.json`-Skripte

Wenn das Paket lokal installiert ist, können Sie die CLI-Befehle direkt in Skripten verwenden (kein `npx` erforderlich).

**Bevorzugen** Sie `sync` für alles, was früher „führe `translate-ui` aus, dann `translate-svg`, dann `translate-docs`, dann `translate-json`“ war: `ai-i18n-tools sync` führt **extract** (wenn aktiviert), **translate-ui**, optional **translate-svg**, **translate-docs** und anschließend optional **translate-json** – in der richtigen Reihenfolge und mit gemeinsamen Flags – entsprechend Ihrer Konfiguration aus. Das manuelle Verketten dieser Schritte ist fehleranfällig (Reihenfolge, Extraktion, Locale-Flags). Verwenden Sie `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs` und `i18n:translate:json` nur, wenn Sie einen **einzelnen** Schritt isoliert benötigen.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## Workflow 1 – UI-Übersetzung

Entwickelt für jedes JS/TS-Projekt, das i18next verwendet: React-Anwendungen, Next.js (Client- und Server-Komponenten), Node.js-Dienste, CLI-Tools.

<a id="step-1-initialise"></a>
### Schritt 1: Initialisieren

```bash
npx ai-i18n-tools init
```

Dies schreibt `ai-i18n-tools.config.json` mit der `ui-markdown`-Vorlage. Bearbeiten Sie diese, um folgende Einstellungen vorzunehmen:

- `sourceLocale` - Ihr Quellsprache BCP-47-Code (z. B. `"en-GB"`). **Muss übereinstimmen** `SOURCE_LOCALE` exportiert aus Ihrer Laufzeit-i18n-Setup-Datei (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - Array von BCP-47-Codes für Ihre Zielsprache(n) (z. B. `["de", "fr", "pt-BR"]`). Führen Sie `generate-ui-languages` aus, um das `ui-languages.json`-Manifest aus dieser Liste zu erstellen.
- `ui.sourceRoots` - Verzeichnisse oder Glob-Muster, die nach `t("…")`-Aufrufen durchsucht werden sollen (z. B. `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - Wo das Master-Katalog geschrieben werden soll (z. B. `"src/locales/strings.json"`).
- `ui.flatOutputDir` – Speicherort für `de.json`, `pt-BR.json`, etc. (z. B. `"src/locales/"`).
- `ui.preferredModel` (optional) – OpenRouter-Modell-ID, die **zuerst** nur für `translate-ui` versucht wird; bei Fehlschlag setzt die CLI mit `openrouter.translationModels` (oder veraltetem `defaultModel` / `fallbackModel`) in der Reihenfolge fort, wobei Duplikate übersprungen werden.

<a id="step-2-extract-strings"></a>
### Schritt 2: Zeichenketten extrahieren

```bash
npx ai-i18n-tools extract
```

Durchsucht alle JS/TS-Dateien unter `ui.sourceRoots` nach `t("literal")`- und `i18n.t("literal")`-Aufrufen. Schreibt (oder führt ein in) `ui.stringsJson`.

Der Scanner ist konfigurierbar: Fügen Sie benutzerdefinierte Funktionsnamen über `ui.uiExtractor.funcNames` (oder das veraltete `ui.reactExtractor.funcNames`) hinzu. Für Astro-Seiten und -Komponenten fügen Sie `.astro` zu `ui.uiExtractor.extensions` hinzu.

<a id="astro-website-plain-astro-not-starlight"></a>
### Astro-Website (reines Astro, nicht Starlight)

Für statische Astro-Marketing- oder App-Seiten kombinieren Sie die [integrierte i18n-Routing-Funktion von Astro](https://docs.astro.build/en/guides/internationalization/) mit ai-i18n-tools. Die Referenzimplementierung ist [`examples/astro-website`](../../docs/../examples/astro-website/) (siehe auch deren [README](../../docs/../examples/astro-website/README.md)): Englisch unter `/`, neun Zielsprachen unter `/{locale}/` (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

Die meisten Teams verwenden eine **hybride** Kombination aus beiden Pipelines (diese schließen sich nicht gegenseitig aus):

| Pipeline | Verwendung für | Befehle | Ausgabe |
|----------|---------|----------|--------|
| **Seiten-HTML** | Überschriften, Absätze, Navigationsbezeichnungen, inline-Arrays im Vorlagen-Body | `translate-docs` | `src/pages/{locale}/index.astro` pro Sprache |
| **UI-Zeichenketten (`t()`)** | Frontmatter-Daten, Reiterbeschriftungen für Screenshots, gemeinsam genutzte Arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (Englischer Originaltext als Schlüssel) |

Behalten Sie drei Listen synchron, wenn Sie eine Sprache hinzufügen oder entfernen: `targetLocales` in `ai-i18n-tools.config.json`, `i18n.locales` in `astro.config.mjs` (Astro verwendet **Kleinschreibung** bei Routencodes wie `pt-br`) und `ui-languages.json` (über `generate-ui-languages`). Flache Bundle-**Dateinamen** verwenden die Groß-/Kleinschreibung der Konfiguration (`pt-BR.json`); ordnen Sie die `pt-br`-Route von Astro dieser Datei über das Manifest-Feld `code` zu (siehe `examples/astro-website/src/i18n/locale.ts`).

Beispiel-`package.json`-Skripte (aus dem Referenzprojekt):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="astro-website-ui-strings-ssg"></a>
### UI-Texte der Astro-Website (SSG)

Richten Sie die UI-Extraktion mit `init -t ui-astro-website` ein und fügen Sie einen `docs[]`-Block hinzu, wenn Sie auch die Seiten-HTML übersetzen (siehe unten). Umschließen Sie Texte mit `t('…')` in TypeScript-Modulen und `.astro`-Frontmatter (sowie `{expression}`-Blöcke in Vorlagen, wenn Sie UI-Texte gegenüber doppelten Lokalisierungsseiten bevorzugen):

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

Legen Sie `sourceLocale` so fest, dass es `i18n.defaultLocale` in `astro.config.mjs` entspricht. Schreiben Sie flache Bündel in ein Verzeichnis, das Astro zur Build-Zeit importieren kann (die Vorlage verwendet `public/locales/`). Lösen Sie `t('…')` zur **Build-Zeit** auf, indem Sie den englischen Quelltext als Schlüssel nachschlagen (siehe `examples/astro-website/src/i18n/t.ts`; `strings.json` ist der Extraktions-Cache, nicht das Laufzeit-Bündel). Sie benötigen **kein** `ai-i18n-tools/runtime` oder i18next für eine statische Website, es sei denn, Sie fügen Client-Islands hinzu, die nach dem Laden die Sprache wechseln.

Verbinden Sie jede Seite, die `t()` aufruft (englische Startseite und jede `src/pages/{locale}/`-Kopie):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Unterstützende Hilfsfunktionen im Beispiel: `src/i18n/utils.ts`, `src/i18n/locale.ts` und `ui-languages.json` für Bezeichnungen, Schreibrichtung und BCP-47-Codes. Führen Sie `generate-ui-languages` nach Änderungen an `targetLocales` aus (optional setzen Sie `ui.uiLanguagesPath`, sodass das Manifest neben Ihren Hilfsfunktionen liegt, z. B. `src/i18n/ui-languages.json`). `MainLayout.astro` setzt `<html lang>` und `<html dir>` aus `resolveUiLanguage(Astro.currentLocale)`; `LanguagePicker.astro` verwendet `getRelativeLocaleUrl` aus `astro:i18n`.

<a id="astro-website-pages-parse-and-replace"></a>
### Astro-Website-Seiten (Parse-and-Replace)

Für Marketingseiten mit hartcodiertem HTML in `.astro`-Dateien lässt `translate-docs` Textknoten und Attribute (`alt`, `title`, `aria-label`, `placeholder`) extrahieren, diese mit dem Dokument-Cache übersetzen und sprachspezifische Kopien im Seitenverzeichnis ablegen. Für die meisten sichtbaren Texte benötigen Sie **kein** `t()`.

Strukturelle Attribute und Schlüsselwerte werden standardmäßig **nicht** übersetzt: Der integrierte Schutz umfasst JSX/HTML-Attribute wie `class`, `id`, `style`, `src`, `href`, `data-*` und die meisten `aria-*` sowie Objektschlüssel wie `class`, `key` und `id` innerhalb von Vorlagen-`{expression}`-Blöcken. Verwenden Sie `docs[].protectAttributes` und `docs[].protectKeys`, um diese Listen zu erweitern, wenn Sie benutzerdefinierte Attribute verwenden (z. B. Tailwind `variant` oder CMS `slug`-Felder). Dieselben Optionen gelten für MDX-JSX während der Markdown-Übersetzung (siehe [protectAttributes / protectKeys](#protectattributes-protectkeys)).

`features.translateDocs` aktivieren und einen `docs[]`-Block hinzufügen, zum Beispiel:

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

`npx ai-i18n-tools translate-docs` ausführen (oder `pnpm i18n:translate` in [`examples/astro-website`](../../docs/../examples/astro-website/)). Der englische Quelltext bleibt bei `src/pages/index.astro`; jede Zielsprache erhält `src/pages/{locale}/index.astro` mit angepassten Importen für die zusätzliche Verzeichnisebene (z. B. `../layouts/` → `../../layouts/`).

Innerhalb des **Template-Körpers** werden Zeichenkettenliterale in `{expression}`-Blöcken (inline Arrays, Objekt-`title`/`desc`-Felder) übersetzt, wenn sie für Benutzer bestimmt sind; Anführungszeichen umschlossene Werte bei geschützten Attributen/Schlüsseln, Literale innerhalb von `t('…')`, `<script>` und `<style>` bleiben unverändert. **Frontmatter TypeScript wird über diesen Pfad nicht übersetzt** – gemeinsam genutztes Frontmatter (einschließlich `t()`-Imports und Daten-Arrays) muss auf englischen und lokalisierten Seiten identisch bleiben, oder führen Sie `translate-docs` nach Bearbeitung der englischen Seite erneut aus, damit die lokalisierten Kopien Änderungen am Frontmatter übernehmen. Für reine Frontmatter-Texte verwenden Sie stattdessen die [UI-String-Pipeline](#astro-website-ui-strings).

Siehe [`examples/astro-website`](../../docs/../examples/astro-website/) für die vollständige hybride Zielseite (HTML über `translate-docs`, Reiterbeschriftungen in Screenshots über `t()` + `translate-ui`).

<a id="step-3-translate-ui-strings"></a>
### Schritt 3: UI-Zeichenketten übersetzen

```bash
npx ai-i18n-tools translate-ui
```

Liest `strings.json`, sendet Stapel an OpenRouter für jedes Zielsprachgebiet, schreibt flache JSON-Dateien (`de.json`, `fr.json` usw.) nach `ui.flatOutputDir`. Wenn `ui.preferredModel` festgelegt ist, wird zuerst dieses Modell versucht, bevor die geordnete Liste in `openrouter.translationModels` verwendet wird (Dokumentübersetzung und andere Befehle verwenden weiterhin nur `openrouter`).

Für jeden Eintrag speichert `translate-ui` die **OpenRouter-Modell-ID**, die jede Sprachvariante erfolgreich übersetzt hat, in einem optionalen `models`-Objekt (mit denselben Sprachschlüsseln wie `translated`). Zeichenketten, die im lokalen `dashboard`-Befehl bearbeitet wurden, werden im `models`-Eintrag für diese Sprache mit dem Platzhalterwert `user-edited` markiert. Die flachen Dateien pro Sprache unter `ui.flatOutputDir` enthalten weiterhin nur **Quelltext → Übersetzung**; sie enthalten kein `models` (sodass die Laufzeit-Bundles unverändert bleiben).

> **Hinweis:** Wenn Sie einen Eintrag im Übersetzungs-Dashboard bearbeiten, müssen Sie einen `sync --force-update` (oder den entsprechenden `translate`-Befehl mit `--force-update`) ausführen, um die Ausgabedateien mit dem aktualisierten Cache-Eintrag neu zu schreiben. Beachten Sie außerdem, dass Ihre manuelle Bearbeitung verloren geht, wenn sich der Quelltext später ändert, da ein neuer Cache-Schlüssel (Hash) für die neue Quellzeichenkette generiert wird.

<a id="exporting-to-xliff-20-optional"></a>
### Export nach XLIFF 2.0 (optional)

Um UI-Zeichenketten an einen Übersetzungsdienstleister, ein TMS oder ein CAT-Tool weiterzugeben, exportieren Sie den Katalog als **XLIFF 2.0** (eine Datei pro Zielsprachgebiet). Dieser Befehl ist **schreibgeschützt**: Er verändert `strings.json` nicht und ruft keine API auf.

```bash
npx ai-i18n-tools export-ui-xliff
```

Standardmäßig werden die Dateien neben `ui.stringsJson` abgelegt, mit Namen wie `strings.de.xliff`, `strings.pt-BR.xliff` (Basisname Ihres Katalogs + Sprachgebiet + `.xliff`). Verwenden Sie `-o` / `--output-dir`, um an anderer Stelle zu schreiben. Vorhandene Übersetzungen aus `strings.json` erscheinen in `<target>`; fehlende Sprachgebiete verwenden `state="initial"` ohne `<target>`, sodass Tools diese ergänzen können. Verwenden Sie `--untranslated-only`, um nur Einheiten zu exportieren, die für jedes Sprachgebiet noch übersetzt werden müssen (nützlich für Aufträge an Dienstleister). `--dry-run` gibt Pfade aus, ohne Dateien zu schreiben.

<a id="step-4-wire-i18next-at-runtime"></a>
### Schritt 4: i18next zur Laufzeit einbinden

Erstellen Sie Ihre i18n-Konfigurationsdatei mithilfe der von `'ai-i18n-tools/runtime'` bereitgestellten Hilfsfunktionen:

<details>
<summary>Vollständiges i18n-Bootstrap-Beispiel (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

<a id="keeping-source_locale-aligned"></a>
#### `SOURCE_LOCALE` synchron halten

**Drei Werte synchron halten:** `sourceLocale` in `ai-i18n-tools.config.json`, `SOURCE_LOCALE` in dieser Datei und der Plural-flache JSON-Name `translate-ui`, den als `{sourceLocale}.json` unter Ihrem flachen Ausgabeverzeichnis schreibt (häufig `public/locales/`). Verwenden Sie denselben Basisnamen in der statischen `import` (Beispiel oben: `en-GB` → `en-GB.json`). Das `lng`-Feld in `sourcePluralFlatBundle` muss `SOURCE_LOCALE` entsprechen. Statische ES `import`-Pfade können keine Variablen verwenden; wenn Sie die Quelllokalisierung ändern, aktualisieren Sie `SOURCE_LOCALE` und den Importpfad gemeinsam. Alternativ laden Sie die Datei mit einem dynamischen `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch` oder `readFileSync`, sodass der Pfad aus `SOURCE_LOCALE` gebildet wird.

Der Codeausschnitt verwendet `./locales/…` und `./public/locales/…`, als läge `i18n` neben diesen Ordnern. Wenn Ihre Datei unter `src/` liegt (typisch), verwenden Sie `../locales/…` und `../public/locales/…`, damit die Importe auf dieselben Pfade wie `ui.stringsJson`, `uiLanguagesPath` und `ui.flatOutputDir` aufgelöst werden.

Importieren Sie `i18n.js` bevor React rendert (z. B. am Anfang Ihrer Einstiegsdatei). Wenn der Benutzer die Sprache wechselt, rufen Sie `await loadLocale(code)` und dann `i18n.changeLanguage(code)` auf.

`SOURCE_LOCALE` wird exportiert, damit jede andere Datei, die es benötigt (z. B. ein Sprachwechsler), es direkt aus `'./i18n'` importieren kann. Wenn Sie eine bestehende i18next-Konfiguration migrieren, ersetzen Sie alle hartkodierten Quell-Sprachcodes (z. B. `'en-GB'`-Prüfungen, die in Komponenten verstreut sind) durch Importe von `SOURCE_LOCALE` aus Ihrer i18n-Bootstrap-Datei.

Benannte Imports (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funktionieren genauso, falls Sie den Default-Export nicht verwenden möchten.

<a id="locale-loaders"></a>
#### Locale-Loader

Halten Sie `localeLoaders` **mit der Konfiguration synchron**, indem Sie sie aus `ui-languages.json` mithilfe von `makeLocaleLoadersFromManifest` ableiten (dadurch werden `SOURCE_LOCALE` mit derselben Normalisierung wie `makeLoadLocale` herausgefiltert). Wenn Sie eine Sprache zu `targetLocales` hinzufügen und `generate-ui-languages` ausführen, wird das Manifest aktualisiert und Ihre Lader verfolgen die Änderung automatisch – es ist nicht nötig, eine separate hartkodierte Zuordnung zu pflegen.

Für JSON-Bundles unter `public/` (die typische Next.js-Setup-Konfiguration) rufen Sie sie über Ihren öffentlichen URL-Pfad ab:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Für Node.js-CLIs ohne Bundler verwenden Sie `readFileSync` innerhalb eines kleinen Hilfsprogramms, das die JSON-Datei für jeden Code liest und analysiert.

<a id="runtime-helpers-reference"></a>
#### Referenz zu Runtime-Helfern

`aiI18n.defaultI18nInitOptions(sourceLocale)` gibt die Standardoptionen für Setups mit Schlüssel-als-Standard zurück:

- `parseMissingKeyHandler` gibt den Schlüssel selbst zurück, sodass nicht übersetzte Zeichenketten den Quelltext anzeigen.
- `nsSeparator: false` erlaubt Schlüssel, die Doppelpunkte enthalten.
- `interpolation.escapeValue: false` – kann bedenkenlos deaktiviert werden: React escaped Werte selbst, und die Ausgabe in Node.js/CLI enthält kein HTML, das escaped werden müsste.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` ist die **empfohlene** Verkabelung für ai-i18n-tools-Projekte: Sie wendet Key-Trimming und Source-Locale-<code>"{{var}}"</code>-Interpolations-Fallback an (gleiches Verhalten wie beim niedrigeren `wrapI18nWithKeyTrim`), führt optional `translate-ui` `{sourceLocale}.json` Plural-suffixed Schlüssel über `addResourceBundle` zusammen und installiert anschließend pluralesensibles `wrapT` aus Ihrem `strings.json`. Lassen Sie `sourcePluralFlatBundle` nur während des Bootstrappings weg (führen Sie es zusammen, sobald `translate-ui` `{sourceLocale}.json` ausgegeben hat). Alleiniges `wrapI18nWithKeyTrim` ist für Anwendungscode **veraltet** – verwenden Sie stattdessen `setupKeyAsDefaultT`.

`makeLoadLocale(i18n, loaders, sourceLocale)` gibt eine asynchrone `loadLocale(lang)`-Funktion zurück, die das JSON-Bundle für eine Sprache dynamisch importiert und bei i18next registriert.

<a id="using-t-in-source-code"></a>
### Verwendung von `t()` im Quellcode

Rufen Sie `t()` mit einem **literalen String** auf, damit das Extraktionsskript es finden kann:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

Das gleiche Muster funktioniert auch außerhalb von React (Node.js, Serverkomponenten, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Regeln:**

- Nur diese Formen werden extrahiert: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- Der Schlüssel muss ein **literaler String** sein – keine Variablen oder Ausdrücke als Schlüssel.
- Verwenden Sie keine Template-Literale für den Schlüssel: <code>{'t(`Hello ${name}`)'}</code> ist nicht extrahierbar.

<a id="interpolation"></a>
### Interpolation

Verwenden Sie die native Interpolation des zweiten Arguments von i18next für <code>"{{var}}"</code> Platzhalter:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Der extract-Befehl analysiert das **zweite Argument**, wenn es ein einfaches Objektliteral ist, und liest tooling-spezifische Flags wie `plurals: true` und `zeroDigit` (siehe **Kardinal-Plurale** unten). Für gewöhnliche Zeichenketten wird nur der Literal-Schlüssel zum Hashen verwendet; Interpolations-Optionen werden zur Laufzeit weiterhin an i18next übergeben.

Wenn Ihr Projekt ein benutzerdefiniertes Interpolationswerkzeug verwendet (z. B. Aufruf von `t('key')` und dann das Ergebnis durch eine Template-Funktion wie `interpolateTemplate(t('Hello {{name}}'), { name })` leiten), macht `setupKeyAsDefaultT` (über `wrapI18nWithKeyTrim`) das überflüssig — es wendet <code>"{{var}}"</code> Interpolation an, selbst wenn die Quell-Locale den Rohschlüssel zurückgibt. Migrieren Sie die Aufrufstellen zu `t('Hello {{name}}', { name })` und entfernen Sie das benutzerdefinierte Werkzeug.

<a id="cardinal-plurals-plurals-true"></a>
### Kardinal-Pluralformen (`plurals: true`)

Verwenden Sie das **genaue Literal**, das Sie als Entwickler-Standardtext wünschen, und übergeben Sie `plurals: true`, damit extract + `translate-ui` den Aufruf als eine **Kardinal-Pluralgruppe** behandeln (i18next JSON v4-Stil `_zero` … `_other` Formen).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (optional) — nur für Tooling; wird **nicht** von i18next gelesen. Wenn `true`, bevorzugen Prompts ein wörtliches Arabisch `0` in der `_zero`-Zeichenkette für jedes Gebietsschema, in dem diese Form existiert; wenn `false` oder weggelassen, wird eine natürliche Nullformulierung verwendet. Entfernen Sie diese Schlüssel vor dem Aufruf von `i18next.t` (siehe `wrapT` weiter unten).

**Validierung:** Wenn die Nachricht **zwei oder mehr** unterschiedliche `{{…}}`-Platzhalter enthält, **muss einer davon** `{{count}}` sein (die Pluralachse). Andernfalls **schlägt** `extract` mit einer klaren Datei-/Zeilenmeldung fehl.

**Zwei unabhängige Zahlen** (z. B. Abschnitte und Seiten) können nicht dieselbe Pluralnachricht teilen – verwenden Sie **zwei** `t()`-Aufrufe (jeweils mit `plurals: true` und eigenem `count`) und verketten Sie diese in der Benutzeroberfläche.

**Nicht in v1 enthalten:** Ordinale Plurale (`_ordinal_*`, `ordinal: true`), Intervall-Plurale, ausschließlich ICU-Pipelines.

<a id="how-plurals-are-stored-and-emitted"></a>
#### Wie Pluralformen gespeichert und ausgegeben werden

**In** `strings.json` verwenden Pluralgruppen **eine Zeile pro Hash** mit `"plural": true`, dem ursprünglichen Literal in `source` und `translated[locale]` als Objekt, das Kardinalkategorien (`zero`, `one`, `two`, `few`, `many`, `other`) den entsprechenden Zeichenfolgen für das jeweilige Gebietsschema zuordnet.

**Flaches Gebietsschema-JSON:** Nicht-plurale Zeilen bleiben im Format **Quellensatz → Übersetzung**. Plurale Zeilen werden als `<groupId>_original` (entspricht `source`, zur Referenz) und `<groupId>_<form>` für jedes Suffix ausgegeben, sodass i18next Plurale nativ auflösen kann. `translate-ui` schreibt außerdem `{sourceLocale}.json`, das **nur** Plural-Flachschlüssel enthält (laden Sie dieses Bundle für die Ausgangssprache, damit suffixed Schlüssel aufgelöst werden; einfache Zeichenketten verwenden weiterhin den Schlüssel als Standard). Für jedes Zielsprachgebiet werden die ausgegebenen Suffixschlüssel entsprechend `Intl.PluralRules` für dieses Gebietsschema (`requiredCldrPluralForms`) angepasst: Wenn `strings.json` eine Kategorie weggelassen hat, weil sie nach der Verdichtung mit einer anderen übereinstimmte (z. B. Arabisch `many` identisch mit `other`), schreibt `translate-ui` dennoch jedes erforderliche Suffix in die flache Datei, indem es von einem fallback-fähigen Geschwistersatz kopiert, sodass zur Laufzeit kein Schlüssel beim Abruf fehlt.

Laufzeit (`ai-i18n-tools/runtime`): **Aufruf** von `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — führt `wrapI18nWithKeyTrim` aus, registriert das optionale `translate-ui` `{sourceLocale}.json` Plural-Bundle und anschließend `wrapT` mithilfe von `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` entfernt `plurals` / `zeroDigit`, schreibt den Schlüssel bei Bedarf in die Gruppen-ID um und leitet `count` weiter (optional: wenn ein einzelner Nicht-`{{count}}`-Platzhalter vorhanden ist, wird `count` aus dieser numerischen Option kopiert).

**Ältere Umgebungen:** `Intl.PluralRules` ist erforderlich für Tooling und konsistentes Verhalten; verwenden Sie ein Polyfill, wenn Sie sehr alte Browser ansprechen.

<a id="language-switcher-ui"></a>
### Sprachwechsler-Benutzeroberfläche

Verwenden Sie das `ui-languages.json`-Manifest, um einen Sprachauswahl-Dialog zu erstellen. `ai-i18n-tools` exportiert zwei Anzeige-Hilfsfunktionen:

<details>
<summary>Beispielkomponente LanguageSelect (React)</summary>

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

</details>

<br />

`getUILanguageLabel(lang, t)` – zeigt `t(englishName)` an, wenn übersetzt, andernfalls `englishName / t(englishName)`, wenn beide unterschiedlich sind. Geeignet für Einstellungsseiten.

`getUILanguageLabelNative(lang)` – zeigt `englishName / label` an (kein `t()`-Aufruf pro Zeile). Geeignet für Kopfzeilenmenüs, wenn der native Name sichtbar sein soll.

Das `ui-languages.json`-Manifest ist ein JSON-Array von <code>"{ code, label, englishName, direction }"</code> Einträgen (`direction` ist `"ltr"` oder `"rtl"`). Beispiel:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

Das Manifest wird von `generate-ui-languages` aus `sourceLocale` + `targetLocales` und dem gebündelten Hauptkatalog generiert. Es wird nach `ui.flatOutputDir` geschrieben. Wenn Sie eine der Sprachen in der Konfiguration ändern, führen Sie `generate-ui-languages` aus, um die `ui-languages.json`-Datei zu aktualisieren.

<a id="rtl-languages"></a>
### Sprachen mit rechts-nach-links-Leserichtung (RTL)

`ai-i18n-tools` exportiert `getTextDirection(lng)` und `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` setzt `document.documentElement.dir` (im Browser) oder ist ein No-Op (in Node.js). Optional können Sie ein `element`-Argument übergeben, um ein bestimmtes Element anzusteuern.

Für Zeichenketten, die `→`-Pfeile enthalten können, drehen Sie diese in RTL-Layouts um:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## Workflow 2 – Dokumentenübersetzung

Entwickelt hauptsächlich für **Markdown, MDX und `.astro`-Dokumentation** unter `docs[].contentPaths`. Legen Sie auf Docusaurus-Seiten `docs[].docusaurusCatalogDir` auf den `write-translations`-Katalogordner fest (z. B. `docs-site/i18n/en`), damit `translate-docs` auch Shell-JSON (Navigationsleiste, Fußzeile, Theme-Texte) übersetzt. Für eingebettete PNG- und andere Rasterbilder in Markdown siehe [Images and raster assets in translated docs](#images-and-raster-assets-in-translated-docs). Für einen optionalen **Sprachumschalter**-Block in README oder Dokumentation mit `docsOutput.style = "flat"` siehe [Language switcher (`languageListBlock`)](#language-switcher-languagelistblock). SVG-Dateien werden über [`translate-svg`](#cli-reference) übersetzt, wenn `features.translateSVG` aktiviert ist – nicht über `docs[].contentPaths`. Beliebige verschachtelte UI-JSON-Bundles (keine Docusaurus-Kataloge) gehören in [Workflow 3](#workflow-3---json-file-translation) (`json[]` / `translate-json`), nicht in `docs[]`.

<a id="step-1-initialise-for-documentation"></a>
### Schritt 1: Für Dokumentation initialisieren

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Für Astro Starlight-Dokumentationsseiten:

```bash
npx ai-i18n-tools init -t ui-starlight
```

Für einfache Astro-Website-Oberflächen (ohne Starlight):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

Diese Vorlage aktiviert nur die UI-Extraktion. Für die HTML-Übersetzung von Seiten setzen Sie zusätzlich `features.translateDocs` und fügen einen `docs[]`-Block hinzu (siehe [Astro-Website-Seiten (parse-and-replace)](#astro-website-parse-and-replace)). Die [`examples/astro-website`](../../docs/../examples/astro-website/)-Konfiguration zeigt beide Pipelines zusammen.

Bearbeiten Sie die generierte `ai-i18n-tools.config.json`:

- `sourceLocale` – Ausgangssprache (muss mit `defaultLocale` in `docusaurus.config.js` übereinstimmen).
- `targetLocales` – Array mit BCP-47-Sprachcodes (z. B. `["de", "fr", "es"]`).
- `cacheDir` – gemeinsames SQLite-Cache-Verzeichnis für alle Pipelines (und standardmäßiges Protokollverzeichnis für `--write-logs`).
- `docs` – Array mit Dokumentationsblöcken. Jeder Block hat optional `description`, `contentPaths` (Zeichenkette oder Array; Datei, Verzeichnis oder Glob), `outputDir`, optional `docusaurusCatalogDir`, `docsOutput`, optional `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter` usw.
- `docs[].description` – optionale kurze Notiz für Maintainer. Falls gesetzt, erscheint sie in der `translate-docs`-Überschrift und in den `status`-Abschnittsüberschriften.
- `docs[].contentPaths` – Markdown/MDX/`.astro`-Quellen (und optional `docusaurusCatalogDir` für Docusaurus-Shell-JSON).
- `docs[].outputDir` – Zielverzeichnis für die Übersetzungen dieses Blocks.
- `docs[].docsOutput.style` – `"nested"` (Standard), `"flat"`, `"doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"` (siehe [Ausgabe-Layouts](#output-layouts)).

**Primär vs. ergänzend:** Konzentrieren Sie sich auf `contentPaths` für lokalisierte Seiten. Legen Sie `docusaurusCatalogDir` fest, wenn Sie zusätzlich Docusaurus-Shell-JSON aus `write-translations` benötigen. Lassen Sie `docusaurusCatalogDir` weg, wenn Sie nur Seiten übersetzen.

<a id="step-2-translate-documents"></a>
### Schritt 2: Dokumente übersetzen

```bash
npx ai-i18n-tools translate-docs
```

Dies übersetzt alle Dateien in `contentPaths` jedes `docs[]`-Blocks (und Docusaurus-Katalog-JSON, wenn `docusaurusCatalogDir` gesetzt ist) in alle relevanten Dokumentationssprachen. Bereits übersetzte Segmente werden aus dem SQLite-Cache geliefert – nur neue oder geänderte Segmente werden an das LLM gesendet.

So übersetzen Sie eine einzelne Lokalisierung:

```bash
npx ai-i18n-tools translate-docs --locale de
```

So prüfen Sie, was übersetzt werden muss:

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### Komplexes Markdown und fehlgeschlagene Qualitätsprüfungen

`translate-docs` prüft, ob jede übersetzte Segment die Markdown-Struktur beibehält (einschließlich Hervorhebungen, die aus dem Dokument geparst wurden). Absätze, die viele `bold`-Spanne um `` `inline code` `` stapeln, Backticks innerhalb von Fett schachteln (z. B. Template-Literale wie `` `fetch(\`/locales/${code}.json\`)` ``) oder Fett und Code in einem langen Satz verweben, sind empfindlich: Einige Sprachgebiete benötigen eine andere Wortreihenfolge, wodurch sich die Ausrichtung von `**` und `` ` `` nach der Übersetzung ändern kann und CLI-Fehler wie `AST mismatch` ausgelöst werden.

**Wenn Sie auf solche Validierungsfehler stoßen, vereinfachen Sie lieber den Quelltext** – teilen Sie den Absatz auf, verschieben Sie ein Beispiel in einen abgegrenzten Code-Block oder beschreiben Sie die gleiche Idee mit weniger verschachtelten fettgedruckten/Code-Paaren – anstatt zu erwarten, dass jedes Modell und jede Lokalisierung dichte Inline-Formatierungen perfekt reproduziert. An anderen Stellen auf dieser Seite (insbesondere in den Hinweisen zu Schritt 4 über `SOURCE_LOCALE`, Loader und `public/`-Pfade) ist die Formatierung bewusst realistisch gehalten; wenn Sie ähnliche Formulierungen in Ihren eigenen Dokumenten wiederverwenden, halten Sie sie beim Übersetzen breiterer Inhalte einfacher.

Wenn jedes konfigurierte Modell mit einem `AST mismatch` beim selben Segment fehlschlägt, kann `translate-docs` dieses Segment automatisch in kleinere Teile aufteilen (zuerst die Mitte der Liste, dann einzelne Listenelemente oder kürzere Absatzabschnitte), jeden Teil erneut vom ersten Modell verarbeiten lassen und das Ergebnis unter dem ursprünglichen Segment-Cache-Schlüssel wieder zusammenfügen. Dies ist standardmäßig aktiviert (`segmentSplitting.qualityRetrySplit`); setzen Sie es auf `false`, um nach Erschöpfung aller Modelle abzubrechen. Die Laufzusammenfassung meldet `Quality split retries`, wenn dieser Fallback greift.

Um zu sehen, **welche Segmente fehlgeschlagen sind**, wie oft und die gespeicherten **Qualitäts- oder Fehlermeldungen**, verwenden Sie den Reiter **Fehler** im Übersetzungs-Dashboard ([Übersetzungs-Dashboard → Fehler](#failures-document-translation)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Cache-Verhalten und `translate-docs`-Flags

Die CLI führt **Datei-Tracking** in SQLite (Quell-Hash pro Datei × Lokalisation) und **Segment**-Einträge (Hash × Lokalisation pro übersetzbarer Einheit). Ein normaler Durchlauf überspringt eine Datei vollständig, wenn der verfolgte Hash mit der aktuellen Quelle übereinstimmt **und** die Ausgabedatei bereits existiert; andernfalls verarbeitet sie die Datei und nutzt den Segment-Cache, sodass unveränderter Text die API nicht aufruft.

| Flag                          | Wirkung                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(Standard)*                   | Überspringt unveränderte Dateien, wenn Tracking + vorhandene Ausgabe auf Datenträger übereinstimmen; verwendet Segment-Cache für den Rest.                                                                                                                                                                          |
| `-l, --locale <codes>`        | Durch Komma getrennte Ziellokalisierungen (wenn weggelassen, entsprechen die Standardeinstellungen der Vereinigung aus der Stamm-`targetLocales` und der optionalen `targetLocales` jedes `docs[]`-Blocks).                                                                                                       |
| `-p, --path` / `-f, --file`   | Übersetzen Sie nur Markdown/JSON unter diesem Pfad (projektbezogen, absolut oder Glob-Muster); `--file` ist ein Alias für `--path`.                                                                                                                                 |
| `--dry-run`                   | Keine Datei-Schreibvorgänge und keine API-Aufrufe.                                                                                                                                                                                                                                        |
| `--type <kind>`               | Auf `markdown` oder `json` beschränken (andernfalls beide, wenn in der Konfiguration aktiviert).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | Nur JSON-Label-Dateien übersetzen oder JSON überspringen und ausschließlich Markdown übersetzen.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | Maximale parallele Ziel-Sprachen (Standardwert aus Konfiguration oder CLI-Standard).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | Maximale parallele Batch-API-Aufrufe pro Datei (Dokumente; Standardwert aus Konfiguration oder CLI).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | Markdown-Hervorhebungszeichen als Platzhalter maskieren, bevor die Übersetzung erfolgt (optional; standardmäßig deaktiviert).                                                                                                                                                                              |
| `--debug-failed`              | Detaillierte `FAILED-TRANSLATION`-Protokolle unter `cacheDir` schreiben, wenn die Validierung fehlschlägt.                                                                                                                                                                                        |
| `--force-update`              | Jede gefundene Datei erneut verarbeiten (Extrahieren, Zusammenfügen, Ausgabe schreiben), auch wenn die Datei-Verfolgung dies überspringen würde. **Segment-Cache bleibt aktiv** – unveränderte Segmente werden nicht an das LLM gesendet.                                                                                    |
| `--force`                     | Löscht die Dateiüberwachung für jede verarbeitete Datei und **liest nicht** aus dem Segment-Cache für die API-Übersetzung (vollständige Neübersetzung). Neue Ergebnisse werden weiterhin **in den Segment-Cache geschrieben**.                                                                                 |
| `--stats`                     | Anzahl der Segmente, Anzahl der verfolgten Dateien und Segment-Gesamtzahlen pro Sprache anzeigen und dann beenden.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | Gecachte Übersetzungen (und Datei-Verfolgung) löschen: alle Sprachen oder eine einzelne Sprache, dann beenden.                                                                                                                                                                             |
| `--prompt-format <mode>`      | Wie jeder **Batch** von Segmenten an das Modell gesendet und geparst wird (`xml`, `json-array` oder `json-object`). Standard ist `json-array`. Ändert nicht Extraktion, Platzhalter, Validierung, Cache oder Fallback-Verhalten – siehe [Batch-Prompt-Format](#batch-prompt-format). |

Sie können `--force` nicht mit `--force-update` kombinieren (beide schließen sich gegenseitig aus).

<a id="batch-prompt-format"></a>
#### Batch-Prompt-Format

`translate-docs` sendet übersetzbare Segmente in **Batches** an OpenRouter (gruppiert nach `batchSize` / `maxBatchChars`). Die `--prompt-format`-Option ändert nur das **Übertragungsformat** des Batches; `PlaceholderHandler`-Token, Markdown-AST-Prüfungen, SQLite-Cache-Schlüssel und pro-Segment-Fallback bei fehlgeschlagenem Batch-Parsing bleiben unverändert.

| Modus                   | Benutzernachricht                                                           | Modellantwort                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: ein `<seg id="N">…</seg>` pro Segment (mit XML-Escaping). | Nur `<t id="N">…</t>`-Blöcke, einer pro Segmentindex.       |
| `json-array` (Standard) | Ein JSON-Array von Zeichenketten, ein Eintrag pro Segment in der Reihenfolge.               | Ein JSON-Array der **gleichen Länge** (gleiche Reihenfolge).           |
| `json-object`          | Ein JSON-Objekt `{"0":"…","1":"…",…}`, indiziert nach Segmentindex.            | Ein JSON-Objekt mit den **gleichen Schlüsseln** und übersetzten Werten. |

Der Ausführungsheader gibt auch `Batch prompt format: …` aus, sodass Sie den aktiven Modus bestätigen können. JSON-Beschriftungsdateien (`docusaurusCatalogDir`) und SVG-Dateisammlungen verwenden dieselbe Einstellung, wenn diese Schritte als Teil von `translate-docs` (oder der Docs-Phase von `sync` – `sync` stellt dieses Flag nicht bereit; es ist standardmäßig auf `json-array` gesetzt) ausgeführt werden.

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Segment-Dedupe und Pfade in SQLite

> **Hinweis:** Dieser Abschnitt behandelt interne Cache-Key-Details, die zur Fehlersuche bei `cleanup`-Verhalten oder benutzerdefinierten Tools nützlich sind. Die meisten Benutzer können diesen Abschnitt überspringen.

- Segmentzeilen sind global nach `(source_hash, locale)` gekennzeichnet (Hash = normalisierter Inhalt). Identischer Text in zwei Dateien teilt sich eine Zeile; `translations.filepath` ist Metadaten (letzter Bearbeiter), kein zweiter Cache-Eintrag pro Datei.
- `file_tracking.filepath` verwendet namensraumbezogene Schlüssel: `doc-block:{index}:{relPath}` pro `docs`-Block (`relPath` ist projektstammrelativer posix: gesammelte Markdown-Pfade; **JSON-Bezeichnungsdateien verwenden den cwd-relativen Pfad zur Quelldatei**, z. B. `docs-site/i18n/en/code.json`, sodass die Bereinigung die echte Datei auflösen kann), `json-block:{index}:{relPath}` für `json[]`-Quellen unter `translate-json` und `svg-files:{relPath}` für SVG-Dateien unter `translate-svg`.
- `translations.filepath` speichert cwd-relativ posix-Pfade für Markdown-, JSON- und SVG-Segmente (SVG verwendet dieselbe Pfadstruktur wie andere Assets; das Präfix `svg-files:…` steht **nur** bei `file_tracking`).
- Nach einem Durchlauf wird `last_hit_at` nur für Segmentzeilen gelöscht, die **im gleichen Übersetzungsbereich** liegen (unter Berücksichtigung von `--path` und aktivierten Typen) und nicht angesprochen wurden, sodass ein gefilterter oder nur-Dokumentations-Durchlauf keine nicht betroffenen Dateien als veraltet markiert.

<a id="output-layouts"></a>
### Ausgabe-Layouts

`docsOutput.style` steuert, wohin übersetzte Markdown-Dateien geschrieben werden. Verwenden Sie exakt die unten angegebenen Zeichenketten in `docs[].docsOutput.style` (Aliase sind voreingestellte Layouts, keine separaten Engines).

`docsOutput.style = "nested"` (Standard, wenn weggelassen) — spiegelt die Quellstruktur unter `{outputDir}/{locale}/` wider (z. B. `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — sprachpräfixierte Dokumentationsstruktur für statische Dokumentationsseiten. Dateien unter `docsRoot` werden nach `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` geschrieben. Pfade außerhalb von `docsRoot` fallen auf das verschachtelte Layout zurück. Legen Sie `docs[].docsOutput.docsRoot` auf Ihren englischen Quellstamm fest (z. B. `"docs"` oder `"src/content/docs"`). Wenn `docsOutput.style = "doc-system"`, müssen Sie `localeSubpath` explizit festlegen (verwenden Sie einen Alias unten für Voreinstellungen).

**Aliase** (gleicher Layout-Engine, voreingestellter `localeSubpath`):

- `docsOutput.style = "docusaurus"` — `localeSubpath` standardmäßig `docusaurus-plugin-content-docs/current` (Docusaurus-i18n-Plugin-Layout).
- `docsOutput.style = "astro-starlight"` — `localeSubpath` standardmäßig `""` (übersetzte Seiten direkt unter `{outputDir}/{locale}/`, entsprechend [Starlight](https://starlight.astro.build/guides/i18n/), wenn Englisch im Inhaltsstamm liegt und `outputDir` gleich `docsRoot` ist).

Docusaurus-Voreinstellung (primäre Dokumentationsseiten):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight-Voreinstellung (gleiche Blockstruktur, unterschiedliche Pfade):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Optionale JSON-Bezeichnungen — Docusaurus-Shell-Zeichenketten aus `docusaurusCatalogDir` (nicht MDX-Textkörper):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight liefert UI-Zeichenketten für viele Sprachen; optionale benutzerdefinierte UI-Überschreibungen verwenden `src/content/i18n/en.json` mit `jsonPathTemplate: "{outputDir}/{locale}.json"` in einem separaten `docs[]`-Block, wenn nötig.

`docsOutput.style = "flat"` — platziert übersetzte Dateien neben der Quelle mit einem Sprachsuffix oder in einem Unterverzeichnis. Relative Links zwischen Seiten werden automatisch umgeschrieben, wenn `docsOutput.style = "flat"` (es sei denn, `rewriteRelativeLinks: false` oder ein benutzerdefiniertes `pathTemplate` ist gesetzt).

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-docsoutputstyle--flat"></a>
#### Ankerlinks bei `docsOutput.style = "flat"`

Wenn `docsOutput.style = "flat"`, schreibt die Ausgabe **relative Pfade** zwischen Seiten für jede Sprache um (`guide.md` → `guide.de.md`). **Ankerlinks** — die übliche Markdown-Inlineform mit einem `#` nach dem Pfad — springen zu einem Abschnitt in der Zieldatei:

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

Hier ist das Link-Ziel `setup.md` und `#first-run` der Anker: Es sollte zum richtigen Überschriftenelement innerhalb dieser Datei scrollen.

**Warum Ankerlinks besondere Beachtung benötigen**

- `rewriteRelativeLinks` legt den **Dateinamen** für jede Sprache fest (`setup.md` → `setup.de.md`).
- Viele Renderer leiten den `#`-Slug aus dem **sichtbaren Überschriftentext** ab. Nach der Übersetzung unterscheiden sich die Überschriften je nach Sprache, sodass sich ein automatisch generierter Slug ändern kann, während der umgeschriebene Link möglicherweise immer noch `#first-run` enthält – oder Ihr englischer `#…`-Anker passt nicht mehr zum Slug, den der Renderer aus der übersetzten Überschrift erstellt.
- Ergebnis: Leser landen auf der richtigen **Datei**, aber an der **falschen Stelle**, oder der Browser findet keine passende Überschrift.

**Was Sie tun sollten**

1. Führen Sie `ai-i18n-tools write-heading-ids` auf Ihrer Quelle `.md` / `.mdx` vor `translate-docs` aus (gleicher `docs[]` / `contentPaths` wie üblich). Es fügt explizite HTML-Anker in die Zeile vor jeder Überschrift ein, sodass `id`-Werte von jeder übersetzten Kopie gemeinsam genutzt werden. Führen Sie es erneut aus, nachdem Sie Überschriften umbenannt haben, damit veraltete Anker-IDs aktualisiert werden und dem aktuellen Titel entsprechen.
2. Verweisen Sie Ihre Markdown-**Ankerlinks** auf diese stabilen IDs, z. B. `[label](../../docs/other.md#section-id)`, wobei `section-id` mit dem Anker übereinstimmt, den das Tool geschrieben hat — nicht nur eine Vermutung aus englischen Wörtern.

**Beispiel**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

`docs/security.md` nach `write-heading-ids` (vereinfacht):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

Nach `translate-docs` bleiben Dateipfade und `#…`-Anker in jeder Sprachdatei synchron, zum Beispiel:

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

Der `#tls-configuration`-Anker ist in allen Sprachversionen identisch, da die `id` in der Quelle festgelegt ist; nur der Überschrifts**text** und die Link**bezeichnung** werden übersetzt.

<a id="images-and-raster-assets-in-translated-docs"></a>
#### Bilder und Raster-Assets in übersetzten Dokumenten

`translate-docs` übersetzt Markdown-Segmente einschließlich Bild-Alternativtext. Es kopiert keine Rasterdateien (PNG, JPEG, WebP, GIF) in Ihre Dokumentations-`outputDir`. Sie müssen Screenshot-Dateien dort ablegen, wohin die übersetzten URLs verweisen, oder `postProcessing.regexAdjustments` verwenden, um die Pfade nach der Übersetzung umzuschreiben.

Für SVG-Dateien mit übersetzbarem Text verwenden Sie den `svg`-Block und `translate-svg` – siehe [`svg`](#svg).

Siehe den [Leitfaden zu Sprachressourcen](LOCALE-ASSETS-GUIDE.de.md) für den vollständigen Entscheidungsleitfaden, alle Muster mit Konfigurationsbeispielen und Verzeichnislayouts, Verträge für Screenshot-Skripte, Gestaltungsempfehlungen und häufige Fehler.

**Schnellreferenz – fünf Muster**

| Muster                      | Verwendung für                                               | Mechanismus                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — Gemeinsames Raster            | Einzelbild, keine sprachspezifischen Varianten                  | Pro-Datei-Link-Umschreiber; normalerweise kein Regex          |
| B — Pro-Region-Ordner        | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/Dokumentation | `regexAdjustments` Regionssegment-Austausch               |
| C — Docusaurus lokal zusammengefügt     | `docsOutput.style = "docusaurus"`-Seiten | Screenshot-Skript platziert Dateien; kein Regex          |
| D — Übersetztes SVG          | Web-Apps mit eingebetteten SVG-Illustrationen       | `translate-svg` mit `svg.style = "flat"`                         |
| E — Lokal zusammengefügte übersetzte SVG | `docsOutput.style = "docusaurus"`-Dokumente          | `translate-svg` mit `svg.style = "nested"` + `pathTemplate` |

**Der flache Link-Rewriter und der Zwei-Schritte-Fluss**

Wenn `docsOutput.style = "flat"`, wird ein integrierter Umschreiber vor `postProcessing` ausgeführt. Er berechnet das Tiefenpräfix pro Ausgabedatei — den relativen Pfad vom Verzeichnis der Ausgabedatei zurück zum Verzeichnis der Quelldatei — und hängt es an URLs von Nicht-Markdown-Assets an. `postProcessing` wird dann auf die bereits präfixierte URL angewendet — schreiben Sie `search`-Muster, die das Sprachsegment darin abgleichen, nicht das führende `../`-Präfix.

Mit `flatPreserveRelativeDir: true` erhalten Quelldateien in Unterverzeichnissen automatisch ein dateispezifisches Präfix. Zum Beispiel erzeugt `docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md` ein Präfix von `../../docs/`, sodass `translation-dashboard.png` (eine gleichgeordnete Datei zur Quelle) zu `../../docs/translation-dashboard.png` wird – korrekt aufgelöst, ohne eine `postProcessing`-Regel zu benötigen.

Wenn `docsOutput.style` den Wert `"docusaurus"`, `"astro-starlight"`, `"nested"` oder einen beliebigen anderen Wert außer `"flat"` hat, wird der Flat-Link-Rewriter nicht ausgeführt. `postProcessing` sieht die ursprüngliche Markdown-URL.

**Beispiel Muster A** – keine Konfiguration erforderlich für Assets mit relativen Pfaden neben Quelldateien, wenn `docsOutput.style = "flat"`. Muster-A-`postProcessing`-Regeln sind nur für Assets mit absoluten URLs (z. B. `/img/...`) oder CDN-Zielersetzungen nötig.

**Beispiel Muster B – `docsOutput.style = "flat"` README** (`examples/nextjs-app`, zweiter `docs[]`-Block)

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Verwenden Sie die generische Form `[^/]+`, nicht eine hartkodierte Quellregion, damit die Regel auch weiterhin funktioniert, falls sich `sourceLocale` jemals ändert.

**Beispiel Muster B – `docsOutput.style = "docusaurus"`** (`examples/nextjs-app`, erster `docs[]`-Block)

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**Muster C – Docusaurus koloziert** (kein `regexAdjustments` erforderlich)

Platzieren Sie Screenshots für en-GB in `static/assets/` und erstellen Sie einen symbolischen Link `docs/assets → ../static/assets`. Das `take-screenshots`-Skript schreibt andere Regionen direkt nach `i18n/<locale>/…/current/assets/`. Alle Dokumente in allen Regionen verweisen auf `../assets/name.png` – der Pfad bleibt stabil, und keine URL-Umschreibung ist erforderlich.

**Beispiel Muster D** (`examples/nextjs-app`, `svg.style = "flat"`)

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → pro-Region-Dateien unter `public/assets/`. App-Referenzen nach Region: `<img src={`/assets/icon.${locale}.svg`} />`.

**Minimalbeispiel nur mit README** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` übersetzt `README.md` in `translated-docs/` ausschließlich mit der [Nachbearbeitung durch die Sprachumschaltung](#language-switcher-languagelistblock). Es sind keine Bildregeln definiert – angemessen, wenn das README keine nebenstehenden Rasterdateien enthält oder nur absolute URLs verwendet, die Ihr Host bereits bereitstellt.

Ersetzungsvorlagen unterstützen Platzhalter wie `${translatedLocale}` und `${translatedBasedir}` (vollständige Liste in der `docsOutput.postProcessing.regexAdjustments`-Zeile unter [Konfigurationsreferenz](#configuration-reference)).

<a id="language-switcher-languagelistblock"></a>
#### Sprachwechsler (`languageListBlock`)

Verwenden Sie `docsOutput.postProcessing.languageListBlock`, wenn übersetzte Markdown-Dateien eine **„In anderen Sprachen lesen“**-Zeile mit Links enthalten sollen – ein Link pro Gebietsschema, wobei `href`-Werte relativ zu jeder Ausgabedatei berechnet werden.

Dieses Repository verwendet es für [README.md](../README.de.md) und [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md). Nach `translate-docs` erhält jede übersetzte Kopie einen aktualisierten Block; zum Beispiel verlinkt [translated-docs/docs/GETTING_STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) zu den lokalisierten Dateien derselben Ebene unter `translated-docs/docs/` und zurück zur englischen Quelle bei `../../docs/GETTING_STARTED.md`.

**1. Block im Quell-Markdown markieren**

Umschließen Sie den Sprachwechsler mit HTML (oder beliebigen Zeilen), die durch die Unterzeichenketten-Marker `start` und `end` begrenzt sind. Dieses Repository verwendet:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

Der anfängliche Link-Text ist nur ein Platzhalter. `translate-docs` ersetzt den gesamten Abschnitt von der ersten Zeile, die `start` enthält, bis zur ersten späteren Zeile, die `end` enthält (Marker innerhalb von Codeblöcken werden ignoriert, sodass Konfigurationsbeispiele in derselben Datei nicht berücksichtigt werden).

**2. Block konfigurieren**

`start` und `end` sind beliebige Unterzeichenketten-Marker – sie müssen nicht `<small id="lang-list">` / `</small>` sein. Wählen Sie beliebigen öffnenden und schließenden Text, der nur im Sprachwechsler-Abschnitt vorkommt: ein anderes HTML-Tag (`<div class="lang-switcher">` … `</div>`), HTML-Kommentare (`<!-- lang-list -->` … `<!-- /lang-list -->`) oder rein Markdown-Grenzen (zum Beispiel eine Zeile `**Languages:**` bis zu einer Zeile `---`). Legen Sie `start` und `end` in der Konfiguration exakt so fest, wie sie in der Quelldatei stehen.

Stammkonfiguration ([ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Feld       | Funktion                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Unterzeichenkette, die die öffnende Zeile des Blocks identifiziert                                                  |
| `end`       | Unterzeichenkette in der schließenden Zeile (kann dieselbe Zeile wie `start` sein, wenn beide auf einer Zeile stehen)             |
| `separator` | Text zwischen den generierten `[label](../../docs/href)`-Links (dieses Repository verwendet `" · "`)                                    |
| `label`     | Optional: `"local"` (Standard) verwendet den Endonymen jedes Gebietsschemas aus dem Manifest; `"english"` verwendet `englishName` |

**3. Was zur Laufzeit passiert**

1. **Extraktion** — der Sprachlisten-Abschnitt wird **nicht** an das Modell gesendet (`translatable: false`).
2. **Pro übersetzte Datei** — nach der Segmentübersetzung und optionaler Umwandlung flacher Links baut `postProcessing` den Block neu auf: ein Markdown-Link pro Gebietsschema, Beschriftungen aus `ui-languages.json`, falls vorhanden (ansonsten aus dem gebündelten Hauptkatalog, sonst `localeDisplayNames`), Pfade relativ zur geschriebenen Datei.
3. **Aktualisierung der Quelle** — am Ende eines `translate-docs` / `sync` Dokumentationsdurchlaufs wird derselbe kanonische Block in die **englischen Quelldateien** in `contentPaths` zurückgeschrieben, sodass das Hinzufügen eines Gebietsschemas den Wechsler im Repository aktualisiert, ohne dass jeder Link manuell bearbeitet werden muss.

Wenn eine Datei keinen passenden Block enthält, protokolliert die CLI eine Warnung (wenn `--verbose`) und lässt den Inhalt unverändert.

**4. Bezeichnungs-Manifest**

Für Endonym-Bezeichnungen (`label: "local"`) generieren oder pflegen Sie `ui-languages.json` über `generate-ui-languages` (siehe [`uiLanguagesPath`](#uilanguagespath-optional)). Die rein dokumentenbasierte Konfiguration dieses Repositorys hat keine UI-Pipeline, daher stammen die Bezeichnungen aus dem gebündelten Hauptkatalog für `sourceLocale` + `targetLocales`.

**5. Beispiele in diesem Repository**

| Beispiel                            | Dateien                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Dieses Paket (flache Dokumentation + Unterverzeichnisse) | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) (`docsOutput.style = "flat"`), [README.md](../README.de.md), [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md), Ausgaben unter [translated-docs/](../../docs/../translated-docs/) |
| Minimal – nur README               | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json) (`docsOutput.style = "flat"`), [examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| Flaches README + Docusaurus-Dokumentation      | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (zweiter Block: `docsOutput.style = "flat"`; erster Block: `docsOutput.style = "docusaurus"`)                                                     |

Die Zeile unmittelbar vor `<small id="lang-list">` (z. B. `**Read in other languages:**`) ist ein normaler übersetzbarer Abschnitt und wird in jedem Zielgebietsschema lokalisiert; nur die Link-Zeile innerhalb der Marker wird wortwörtlich neu generiert, abgesehen von `href` und manifestgesteuerten Bezeichnungen.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### Platzhalter `pathTemplate` / `jsonPathTemplate`

Überschreiben Sie den Speicherort für übersetzte Dateien durch Festlegen von `docs[].docsOutput.pathTemplate` (für Markdown und MDX) oder `jsonPathTemplate` (für JSON-Label-Dateien). Beide akzeptieren dieselben Platzhalter. Die aufgelösten Pfade müssen innerhalb des `outputDir`-Blocks liegen (die CLI lehnt Pfade ab, die diesen Bereich verlassen).

Wenn Sie eine benutzerdefinierte `pathTemplate` verwenden, ist `rewriteRelativeLinks` standardmäßig auf `false` gesetzt, sofern Sie ihn nicht explizit festlegen – die Umwandlung relativer Links ist für `docsOutput.style = "flat"` ohne benutzerdefinierte Vorlage konzipiert.

Für integrierte Layouts (`nested`, `flat`, `doc-system` ohne benutzerdefinierte Vorlage) setzen Sie `docsOutput.localePathLowercase` auf `true`, um klein geschriebene Ordner- oder Dateinamenabschnitte zu erzeugen (z. B. `pt-br` statt `pt-BR`). Der `astro-starlight`-Alias setzt dies standardmäßig auf `true`. Benutzerdefinierte `pathTemplate` / `jsonPathTemplate`-Werte bleiben unverändert – verwenden Sie dort `{llocale}`, wenn Sie klein geschriebene Abschnitte benötigen, aber `{locale}` im BCP-47-Format beibehalten möchten.

| Platzhalter            | Rolle                                                                                                       | Beispiel                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Absoluter aufgelöster Pfad des `outputDir`-Blocks dieser Dokumentation                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | Ziel-Sprachcode (gleiche Form wie in Konfiguration / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Dieselbe Sprache in Großbuchstaben | `DE`, `PT-BR` |
| `{llocale}`            | Gleicher kleingeschriebener Gebietsschemaname (entspricht Astro-Routenordnern wie `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}` | Quelldateipfad relativ zur Projektwurzel, POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Dateiname **ohne** Erweiterung | `guide` für `docs/guide.md` |
| `{basename}` | Dateiname **mit** Erweiterung | `guide.md` |
| `{extension}` | Erweiterung **einschließlich** des Punkts | `.md`, `.mdx` |
| `{docsRoot}`           | Absoluter aufgelöster Pfad von `docsOutput.docsRoot` (Standard `docs`, falls weggelassen)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` mit entferntem `docsRoot`-Präfix, wenn sich die Pfadzeichenfolgen entsprechen (POSIX); andernfalls unverändert | `docs/guide.md` (üblich); `guide.md` nur, wenn das Entfernen angewendet wird |

**Beispiel**

Konfigurationsausschnitt:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Für das Gebietsschema `de` und die Quelle `docs/guide.md`, mit Projektstammverzeichnis `/home/acme/repo` und `outputDir`, das auf `/home/acme/repo/i18n` aufgelöst wird, lautet der erweiterte Pfad:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Mit `docsOutput.style = "flat"` und ohne benutzerdefinierte `pathTemplate` ist ein übliches Muster, nur den Dateinamen über `{stem}` und `{extension}` beizubehalten, z. B. `{outputDir}/{stem}.{locale}{extension}`, was `…/guide.de.md` im aufgelösten `outputDir` ergibt.

<a id="troubleshooting"></a>
### Problembehandlung

**Abschnitts-Ankerlinks funktionieren in übersetzten Dokumenten nicht**

Ein Link wie `[label](../../docs/other.md#section-id)` öffnet möglicherweise die korrekte übersetzte Datei, scrollt aber nicht zum gewünschten Überschriftselement – oder springt zum falschen Abschnitt. Das `#…`-Fragment entspricht keinem Überschrifts-`id` mehr in diesem Gebietsschema.

Häufige Ursachen:

- Quellüberschriften hatten nie explizite Anker-IDs; die Seite leitet Slugs aus dem sichtbaren Überschriftstext ab, der sich nach der Übersetzung ändert.
- Sie haben eine Überschrift in der Quelle umbenannt, aber die vorhergehende `<a id="…"></a>`-Zeile fehlt oder enthält noch die alte ID.
- Ankerlinks verwenden ein `#…`-Fragment, das aus englischen Wörtern erraten wurde, anstatt der ID, die `write-heading-ids` generieren würde.

**Behebung**

1. Führen Sie `ai-i18n-tools write-heading-ids` auf Ihrer **Quell-**`.md` / `.mdx` aus (gleiches `docs[]` / `contentPaths` wie `translate-docs`). Es fügt `<a id="slug"></a>` vor jede ATX-Überschrift ein oder aktualisiert einen vorhandenen Anker, wenn der Überschriftentext nicht mehr mit dem aktuellen Slug übereinstimmt.
2. Verweisen Sie Ankerlinks auf diese IDs – z. B. `[setup](../../docs/guide.md#first-run)`, wobei `#first-run` mit der Ankerzeile über der Zielüberschrift übereinstimmt, nicht mit einem Slug, der allein aus dem englischen Titel abgeleitet ist.
3. Führen Sie `translate-docs` (oder `sync --force-update`) erneut aus, sodass jede Lokalisierungskopie die aktualisierten Ankerzeilen enthält.

`--dry-run` auf `write-heading-ids` zuerst verwenden, um Änderungen vorab anzuzeigen. Siehe [Ankerlinks im flachen Layout](#anchor-links-when-docsoutputstyle--flat) für das vollständige Muster.

---

<a id="workflow-3---json-file-translation"></a>
## Workflow 3 – Übersetzung von JSON-Dateien

Entwickelt für Projekte, die UI-Texte in **verschachtelten JSON-Dateien pro Sprache** (z. B. `src/i18n/en/translation.json`) anstatt in `t("…")` im Quellcode speichern. Die CLI durchläuft die Zeichenkettenwerte in diesen Dateien, übersetzt sie über OpenRouter und schreibt sprachspezifische Ausgabedateien mithilfe von `json[].outputPathTemplate`. Dabei wird derselbe SQLite-Cache wie bei `translate-docs` und `translate-svg` (`cacheDir`) verwendet.

Dieser Workflow führt `extract` **nicht** aus – es gibt keinen `strings.json`-Katalog. Aktivieren Sie ihn mit `features.translateJson` und einem oder mehreren Einträgen auf oberster Ebene in `json[]`.

<a id="step-1-initialise-for-nested-json"></a>
### Schritt 1: Initialisierung für verschachtelte JSON-Dateien

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

Diese Vorlage setzt `features.translateJson: true`, deaktiviert die UI-Extraktion und die Dokumentübersetzung und erstellt einen einzelnen `json[]`-Block, der auf `src/i18n/en/translation.json` mit der Ausgabe `src/i18n/{llocale}/translation.json` verweist. Passen Sie `sourceLocale`, `targetLocales`, `contentPaths` und `outputPathTemplate` an die Struktur Ihres Repositorys an.

<a id="step-2-configure-json"></a>
### Schritt 2: Konfigurieren von `json[]`

Jeder `json[]`-Block beschreibt eine Pipeline:

- `contentPaths` – eine oder mehrere `.json`-Dateien, Verzeichnisse oder Platzhaltermuster (z. B. `"src/i18n/en/translation.json"` oder `"src/i18n/en/overrides/*.json"`). Pfade werden relativ zum Projektstamm aufgelöst.
- `outputPathTemplate` – erforderlich. Gibt an, wohin die Zieldatei jeder Sprache geschrieben wird. Platzhalter: `{locale}`, `{LOCALE}`, `{llocale}` (Kleinschreibung der Sprache, nützlich für Astro-Routenordner), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (optional) – Sprachuntermenge nur für diesen Block; andernfalls gilt die oberste `targetLocales`.
- `keyPolicy` – legt fest, welche JSON-Schlüssel übersetzbaren Text enthalten und welche stabile Bezeichner sind (siehe unten).
- `description` (optional) – wird in CLI-Überschriften und `status`-Ausgabe angezeigt.

Beispiel (mehrere Quelldateien, Ordner mit Sprachcodes in Kleinschreibung):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | Verhalten |
|-------------|-----------|
| `allowlist` | Nur Schlüssel, die `translateKeys` entsprechen (Pfadnotation mit Punkten; minimatch-Platzhalter), werden übersetzt. |
| `denylist`  | Alle Zeichenkettenwerte werden übersetzt, außer Schlüssel, die `skipKeys` entsprechen. |
| `both`      | Zuerst `translateKeys` anwenden, dann Übereinstimmungen aus `skipKeys` entfernen. |

Pfade verwenden die Punkt-Notation (`nav.home.label`). Ein einfacher Name wie `slug` entspricht dem letzten Schlüsselsegment auf jeder Ebene.

<a id="step-3-translate-json-bundles"></a>
### Schritt 3: JSON-Bundles übersetzen

```bash
npx ai-i18n-tools translate-json
```

Optionale Flags (ähnliche Funktionen wie bei `translate-docs`): `-l` / `--locale` für eine Untermenge der Ziele, `-p` / `--path` zur Begrenzung der Dateien, `--dry-run`, `--force` (Löschen der Dateiüberwachung und des Segment-Caches für passende Dateien), `--force-update` (erneutes Verarbeiten, wenn der Datei-Hash übereinstimmt; Segment-Cache bleibt aktiv), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

Projekte, die nur JSON verwenden, können ausführen:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

Wenn UI- oder Dokumentenübersetzung ebenfalls aktiviert sind, führt `sync` **translate-json nach translate-docs** aus (außer `--no-json`). Überspringen Sie JSON mit `--no-json`.

Überprüfen Sie die Abdeckung pro Datei und Sprache:

```bash
npx ai-i18n-tools status
```

Wenn `translateJson` aktiviert ist, gibt `status` einen `json[]`-Abschnitt aus (✓ aktuell, ● veraltet oder fehlend).

<a id="workflow-3-vs-other-pipelines"></a>
### Workflow 3 im Vergleich zu anderen Pipelines

| Situation | Verwendung |
|-----------|-----|
| UI-Texte in `t("…")` / `i18n.t("…")` in JS/TS/Astro | [Workflow 1](#workflow-1---ui-translation) — `extract` + `translate-ui` |
| Übersetzung von Markdown/MDX/`.astro`-Seiten oder README | [Workflow 2](#workflow-2---document-translation) — `translate-docs` |
| Docusaurus `write-translations`-Katalog (`{ "key": { "message": "…", "description": "…" } }`) | Workflow 2 — `docs[].docusaurusCatalogDir` + `translate-docs`, **nicht** `json[]` |
| Standalone verschachtelte Locale-JSON (ZenBrowser-artige `translation.json`-Bäume) | Workflow 3 — `json[]` + `translate-json` |
| Illustrierte `.svg`-Dateien mit `<text>` / `<title>` / `<desc>` | `features.translateSVG` + [`svg`](#svg) + `translate-svg` (optional; kein nummerierter Workflow) |

Feldreferenz: [`json`](#json) in der [Konfigurationsreferenz](#configuration-reference). Cache-Schlüssel zur Bereinigung verwenden `json-block:{blockIndex}:{projectRelPath}` in `file_tracking`.

---

<a id="combined-workflow-ui--docs"></a>
## Kombinierter Workflow (UI + Docs)

Aktivieren Sie alle Funktionen in einer einzigen Konfiguration, um beide Workflows zusammen auszuführen:

<details>
<summary>Beispiel für kombinierte UI- und Dokumentationskonfiguration</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` verweist die Dokumentenübersetzung auf denselben `strings.json`-Katalog wie die UI, sodass die Terminologie konsistent bleibt; `glossary.userGlossary` fügt CSV-Überschreibungen für Produktbegriffe hinzu.

Führen Sie `npx ai-i18n-tools sync` aus, um eine Pipeline auszuführen: Wenn `features.translateUIStrings` aktiviert ist, werden zuerst UI-Texte **extrahiert** und anschließend **übersetzt**; optional **SVG übersetzen** (`features.translateSVG` + `svg`-Block); **Dokumentation übersetzen** (wie konfiguriert in `docs[]`); danach optional **translate-json** (`features.translateJson` + `json[]`). Teile können mit `--no-ui`, `--no-svg`, `--no-docs` oder `--no-json` übersprungen werden. Die Schritte für Dokumentation und `json[]` akzeptieren `--dry-run`, `-p` / `--path`, `--force`, und `--force-update` (Dokumentations-spezifische Flags werden ignoriert, wenn `--no-docs` verwendet wird; JSON nutzt dieselben Cache-Flags, wenn `--no-json` nicht gesetzt ist).

Verwenden Sie `docs[].targetLocales` in einem Block, um dessen Dateien in eine **kleinere Teilmenge** als die UI zu übersetzen (die effektiven Dokumentations-Localen ergeben sich als **Vereinigung** über alle Blöcke):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docsoutputstyle--docusaurus--flat"></a>
### Gemischter Dokumentations-Workflow (`docsOutput.style = "docusaurus"` + `"flat"`)

Sie können mehrere Dokumentations-Pipelines in derselben Konfiguration kombinieren, indem Sie mehrere Einträge in `docs` hinzufügen. Dies ist eine übliche Konfiguration, wenn ein Projekt eine Docusaurus-Website (`docsOutput.style = "docusaurus"`) sowie Markdown-Dateien auf Root-Ebene (z. B. ein Repository-README mit `docsOutput.style = "flat"`) enthält, die mit lokalisierten Dateinamen übersetzt werden sollen.

<details>
<summary>Beispiel für gemischte Docusaurus- und flache README-Konfiguration</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

So wird es mit `npx ai-i18n-tools sync` ausgeführt:

- UI-Texte werden aus `src/` in `public/locales/` extrahiert/übersetzt.
- Der erste Dokumentations-Block übersetzt **Markdown** aus `docs-site/docs/` nach `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (lokalisierte Dokumentationsseiten).
- Bei gesetztem `docs[].docusaurusCatalogDir` und aktiviertem `features.translateDocs` übersetzt derselbe Block zusätzlich **Docusaurus-Shell-JSON** unter `docs-site/i18n/en/` in jeden Ziel-Locale-Ordner – dazu gehören Navbar, Footer und Theme-/Plugin-Kataloge, nicht jedoch MDX-Inhalte.
- Der zweite Dokumentations-Block übersetzt `README.md` in lokalisierte Dateien unter `translated-docs/` (`docsOutput.style = "flat"`).
- Alle Dokumentationsblöcke nutzen `cacheDir` gemeinsam, sodass unveränderte Segmente zwischen den Durchläufen wiederverwendet werden, um API-Aufrufe und Kosten zu reduzieren.

---

<a id="translation-dashboard"></a>
## Übersetzungs-Dashboard

Ausführen:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Der Standard-Listen-Port ist **8675**. Falls dieser Port nicht verfügbar ist, versucht der Server den nächsten Port (bis zu 1000 Versuche) und protokolliert den gewählten Port. Der veraltete Alias `editor` funktioniert weiterhin, gibt aber eine Warnung aus – bevorzugen Sie `dashboard`.

Dadurch wird eine lokale Web-Oberfläche gestartet, die auf Ihrer konfigurierten `cacheDir`-SQLite-Datenbank basiert – demselben Verzeichnis, das die CLI für Dokumentationssegmente, Protokolle und verwandte Metadaten verwendet. Es enthält die Registerkarten **Dokumentation** (zwischengespeicherte Dokumentationssegmente), **UI-Texte**, **UI-Pluralformen**, **Glossar**, **Fehler**, **Markdown-Probleme** und **Statistiken**.

![Translation Dashboard](../../docs/translation-dashboard.png)

Wenn Sie **Cache-Zeilen** in dieser App bearbeiten (z. B. Dokumentationsabschnitte), führen Sie `sync --force-update` oder den entsprechenden Übersetzungsbefehl mit `--force-update` aus, damit die Ausgaben auf der Festplatte mit dem Cache übereinstimmen. Wenn sich später der **Quelltext** im Repository ändert, ändern sich die Segment-Hashes und manuelle Bearbeitungen des alten Textes werden überschrieben.

<a id="failures-document-translation"></a>
### Fehler (Dokumentenübersetzung)

Die Registerkarte **Fehler** betrifft ausschließlich die **Dokumentationsübersetzung**. Sie liest Fehlerdatensätze aus der SQLite-Datenbank, die geschrieben werden, wenn ein Segment für eine Locale nicht erfolgreich übersetzt werden konnte – z. B. leere oder ungültige Modellausgaben, Validierungsfehler nach der Übersetzung (`AST mismatch`, Platzhalter-Durchsickern und ähnliche **Qualitätsprüfungen**) oder eine **kritische** Bedingung, die den Fortschritt blockiert hat. Sie hilft Ihnen dabei, folgende Fragen zu beantworten: *Welches Quellsegment ist fehlgeschlagen, für welche Locale und welches Modell, und welcher Fehlertext wurde aufgezeichnet?*

<a id="when-to-use-it"></a>
#### Wann Sie es verwenden sollten

- Nachdem `translate-docs` oder `sync` mit Fehlern, teilweisen Gebietsschemata oder unklaren Protokollen abgeschlossen wurde – können Sie Fehler sortieren und filtern, anstatt nur durch die Terminalausgabe zu scrollen.
- Wenn Sie die **Nacharbeit priorisieren** möchten: nach **# Fehler** sortieren, damit Segmente, die bei mehreren Wiederholungen fehlgeschlagen sind, zuerst erscheinen; diese sind gute Kandidaten, um sie in der Quell-Markdown-Datei zu **vereinfachen oder umzuformatieren**, damit zukünftige Durchläufe erfolgreich sind.
- Wenn Sie das **genaue Segment** benötigen – Dateipfad, Zeilenhinweis, Quell-Hash und vollständiger Quelltext – um den richtigen Absatz in Ihrem Repository zu bearbeiten.

<a id="why-source-edits-matter"></a>
#### Warum Quelltextänderungen wichtig sind

Dichtes Inline-Markup (**fett** kombiniert mit `` `code` ``, verschachtelte Hervorhebungen, lange Sätze mit vielen Abschnitten) erschwert es Modellen, Übersetzungen zurückzugeben, die weiterhin strukturelle Prüfungen bestehen. Segmente mit **mehreren aufgezeichneten Fehlern** profitieren in der Regel stärker von einer **Umschreibung oder Aufteilung** der Quelle (oder dem Verschieben von Beispielen in gefährmete Codeblöcke), als von erneuten Übersetzungsversuchen mit unverändertem Text. Dies entspricht [Komplexes Markdown und fehlgeschlagene Qualitätsprüfungen](#complex-markdown-and-failed-quality-checks).

<a id="how-to-use-the-tab"></a>
#### So verwenden Sie die Registerkarte

1. Öffnen Sie **Fehler** im Dashboard (dieselbe Browsersitzung wie [Translation Dashboard](#translation-dashboard)).
2. Lesen Sie den **Zusammenfassungsstreifen** (Segmente mit einem Fehler sowie Anzahlen für Segmente mit **1**, **2** oder **3+** Fehlermeldungen).
3. Filtern Sie nach teilweisem **Dateinamen**, **Gebietsschema**, **Modell**, **Qualitätsfehler** (Werte stammen aus Ihrem Cache), **nur schwerwiegende Fehler** sowie optional nach **Quell-Hash**, **Quelltext** oder Teilzeichenfolge der **Fehlermeldung** – klicken Sie dann auf **Übernehmen**.
4. Wählen Sie **Sortierung: # Fehler** (Standard) oder **Sortierung: Dateipfad + Zeilennummer**.
5. Verwenden Sie die Paginierung oben oder unten in der Tabelle. **Klicken Sie auf eine Zeile**, um den vollständigen Quelltext anzuzeigen. Die Linksteuerung in der Zeile (falls aktiviert) fordert den Serverprozess auf, Datei-/Zeilen-Hinweise im **Terminal** anzuzeigen, in dem `ai-i18n-tools dashboard` ausgeführt wird – nützlich, um vom Browser direkt zum Editor zu wechseln.
6. Beheben Sie die **Quelldatei** in Ihrem Projekt und führen Sie anschließend erneut `translate-docs` oder `sync` aus. Falls die Liste nach einem erfolgreichen Durchlauf **veraltet** erscheint, führen Sie `ai-i18n-tools sync --force-update` aus und laden Sie das Dashboard neu (der Fehlerbereich zeigt denselben Hinweis).

Für die dateibasierte Fehlersuche parallel zur Benutzeroberfläche können Sie weiterhin `translate-docs --debug-failed` verwenden, um `FAILED-TRANSLATION`-Details unter `cacheDir` während Wiederholungen zu schreiben – siehe [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Markdown-Probleme (statische Prüfungen)

Die Registerkarte **Markdown-Probleme** listet Zeilen aus der `markdown_source_issues` SQLite-Tabelle auf. Jede Zeile ist ein **Vor-Übersetzungs**-Fund: beispielsweise aufeinanderfolgende Delimiter, die unter den gleichen CommonMark-ähnlichen Regeln, die `translate-docs` für Maskierung verwendet, niemals als Hervorhebung/Durchstreichung gepaart werden, ein Inline-Code-Abschnitt, der mit Backticks geöffnet, aber nie geschlossen wird, oder `STRONG_OUTSIDE_LINK`, wenn `**` / `__` einen `[text](../../docs/url)`-Link umschließen (fetten Text nur innerhalb des Link-Textes platzieren). Dies ist **nicht** dasselbe wie **Fehler**, die pro-Lokalisierung Modellausgaben und Nach-Übersetzungs-Validierungsprobleme aufzeichnen (`AST mismatch`, Platzhalter-Durchsickern und Ähnliches).

Verwenden Sie diese Registerkarte, wenn Sie den **Quell-Markdown** beheben möchten, bevor Token verbraucht werden – insbesondere wenn Qualitätsprüfungen immer wieder an der Struktur scheitern. Filtern Sie nach Dateipfad (Teilübereinstimmung mit dem Cache-Schlüssel, einschließlich `doc-block:{index}:`-Präfixen), **Fehlercode** oder **Quell-Hash**; sortieren Sie nach Dateipfad + Zeile oder nach neuestem Scan-Zeitpunkt. Die Link-Schaltfläche protokolliert Datei-/Zeilen-Hinweise im Terminal, in dem `ai-i18n-tools dashboard` ausgeführt wird (ähnlich wie bei der Registerkarte Dokumentation).

**Zeilen aktualisieren:** Führen Sie `ai-i18n-tools check-markdown` aus (optional mit `-p` / `--path` Bereich, `--no-cache` zum Überspringen von SQLite, `--json` für maschinenlesbare Ausgabe auf stdout mit menschenlesbaren Zeilen auf stderr). Standardmäßig scannt jeder `translate-docs`-Markdown-Dateilauf auch die Zeilen dieser Datei erneut ein und ersetzt sie, wenn `docs[].warnMarkdownSourceIssues` nicht auf `false` gesetzt ist. Das Löschen aller Übersetzungen für einen Cache-Dateipfad entfernt auch die Markdown-Problemeinträge für diesen Pfad im Rahmen derselben Bereinigungslogik wie bei Fehlern.

---

<a id="configuration-reference"></a>
## Konfigurationsreferenz

<a id="sourcelocale"></a>
### `sourceLocale`

BCP-47-Code für die Ausgangssprache (z. B. `"en-GB"`, `"en"`, `"pt-BR"`). Für diese Sprache wird keine Übersetzungsdatei generiert – der Schlüsseltext selbst ist der Ausgangstext.

**Muss** `SOURCE_LOCALE` entsprechen, der aus Ihrer Laufzeit-i18n-Konfigurationsdatei exportiert wird (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Array mit BCP-47-Gebietsschemaschlüsseln, in die übersetzt werden soll (z. B. `["de", "fr", "es", "pt-BR"]`).

`targetLocales` ist die primäre Gebietsschema-Liste für die UI-Übersetzung und die Standard-Gebietsschema-Liste für Dokumentationsblöcke. Verwenden Sie `generate-ui-languages`, um das `ui-languages.json`-Manifest aus `sourceLocale` + `targetLocales` zu erstellen.

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (optional)

Pfad zum `ui-languages.json`-Manifest, das für Anzeigenamen, Gebietsschema-Filterung und Nachbearbeitung der Sprachliste verwendet wird. Wenn nicht angegeben, sucht die CLI das Manifest unter `ui.flatOutputDir/ui-languages.json`.

Verwenden Sie dies, wenn:

- Das Manifest befindet sich außerhalb von `ui.flatOutputDir`, und Sie müssen die CLI explizit darauf verweisen.
- Sie möchten die [Sprachumschalter-Nachbearbeitung](#language-switcher-languagelistblock) (`languageListBlock`) verwenden, um Locale-Bezeichnungen aus dem Manifest zu generieren.
- `extract` sollte `englishName`-Einträge aus dem Manifest in `strings.json` zusammenführen (erfordert `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

<a id="concurrency-optional"></a>
### `concurrency` (optional)

Maximale Anzahl gleichzeitig übersetzter **Zielgebietsschemata** (`translate-ui`, `translate-docs`, `translate-svg` und die entsprechenden Schritte in `sync`). Wenn nicht angegeben, verwendet die CLI standardmäßig **4** für die UI-Übersetzung und **3** für die Dokumentationsübersetzung (integrierte Vorgaben). Kann pro Ausführung mit `-j` / `--concurrency` überschrieben werden.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (optional)

**translate-docs** und **translate-svg** (sowie der Dokumentationsschritt von `sync`): maximale parallele OpenRouter-**Batch**-Anfragen pro Datei (jeder Batch kann viele Segmente enthalten). Standardwert ist **4**, wenn nicht angegeben. Wird von `translate-ui` ignoriert. Kann mit `-b` / `--batch-concurrency` überschrieben werden. Unter `sync` gilt `-b` nur für den Dokumentationsübersetzungsschritt.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (optional)

Maximale Anzahl gleichzeitig verarbeiteter Dateien **innerhalb einer einzelnen Sprachumgebung** während `translate-docs` und `sync`. Bei Werten größer als **1** werden Dateien innerhalb derselben Sprachumgebung parallel verarbeitet, wobei ein Semaphore zur Steuerung des Speicherverbrauchs verwendet wird. Standardwert ist **1** (sequenzielle Verarbeitung), wenn nicht angegeben. Höhere Werte können den Durchsatz bei I/O-gebundenen Operationen erheblich verbessern, insbesondere wenn alle Segmente bereits zwischengespeichert sind (keine API-Aufrufe erforderlich).

**Beispiel:**

```json
{
  "fileConcurrency": 4
}
```

**Anwendungsfall:** Setzen Sie dies auf `2-4`, wenn Sie `sync --force-update` mit 100 % Cache-Treffern ausführen, um die Gesamtverarbeitungszeit zu verkürzen. Die Verbesserung ist besonders bei vielen kleinen Dateien deutlich spürbar.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (optional)

Segment-Batch-Verarbeitung für Dokumentenübersetzung: Anzahl der Segmente pro API-Anfrage und eine Zeichengrenze. Standardwerte: **20** Segmente, **4096** Zeichen (wenn nicht angegeben).

<a id="openrouter"></a>
### `openrouter`

- `baseUrl`
  Basis-URL der OpenRouter-API. Standard: `https://openrouter.ai/api/v1`.
- `translationModels`
  Bevorzugte, geordnete Liste von Modell-IDs. Das erste wird zuerst versucht; spätere Einträge dienen als Fallback bei Fehlern. Für `translate-ui` können Sie zusätzlich `ui.preferredModel` setzen, um ein Modell vor dieser Liste zu versuchen (siehe `ui`).
- `defaultModel`
  Veraltetes einzelnes primäres Modell. Wird nur verwendet, wenn `translationModels` nicht gesetzt oder leer ist.
- `fallbackModel`
  Veraltetes einzelnes Fallback-Modell. Wird nach `defaultModel` verwendet, wenn `translationModels` nicht gesetzt oder leer ist.
- `maxTokens`
  Maximale Anzahl an Completion-Tokens pro Anfrage. Standard: `8192`.
- `temperature`
  Sampling-Temperatur. Standard: `0.2`.
- `requestTimeoutMs`
  Maximale Wartezeit in Millisekunden pro HTTP-Anfrage an OpenRouter (Chat-Completions und interne `GET /models`-Aufrufe). Standard: `30000` (30 Sekunden).

**Warum mehrere Modelle verwenden:** Unterschiedliche Anbieter und Modelle weisen unterschiedliche Kosten auf und bieten je nach Sprache und Gebietsschema unterschiedliche Qualitätsniveaus. Konfigurieren Sie `openrouter.translationModels` **als geordnete Fallback-Kette** (anstatt ein einzelnes Modell), sodass die CLI beim Fehlschlagen einer Anfrage das nächste Modell versuchen kann.

Behandeln Sie die Liste unten als **Grundlage**, die Sie erweitern können: Wenn die Übersetzung für ein bestimmtes Gebietsschema schlecht oder erfolglos ist, recherchieren Sie, welche Modelle diese Sprache oder Schrift effektiv unterstützen (siehe Online-Ressourcen oder die Dokumentation Ihres Anbieters), und fügen Sie diese OpenRouter-IDs als weitere Alternativen hinzu.

Diese Liste wurde auf **umfassende Abdeckung verschiedener Sprachen** in einem großen Dokumentationsprojekt mit 36 Ziel-Lokalisierungen getestet; sie dient als praktischer Standard, ist jedoch nicht garantiert für jede Lokalisierung optimal.

Beispiel `translationModels` (gleiche Standardeinstellungen wie `npx ai-i18n-tools init`):

<details>
<summary>Standard-Übersetzungsmodell-Fallback-Liste</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

Legen Sie `OPENROUTER_API_KEY` in Ihrer Umgebung oder in der `.env`-Datei fest.

Bevor Sie `translationModels` ändern, führen Sie `npx ai-i18n-tools check-models` aus, um jede konfigurierte Modell-ID mit dem Live-Katalog von OpenRouter (`GET /models`) zu überprüfen. Es meldet IDs, die fehlen oder abgelaufen sind `expiration_date`, listet gültige Modelle mit geschätzten Ein-/Ausgabepreisen (USD pro 1M Tokens) auf und beendet sich mit einem nicht-null Status, wenn eine konfigurierte ID ungültig ist. Erfordert `OPENROUTER_API_KEY`.

<a id="features"></a>
### `features`

| Feld | Workflow | Beschreibung |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1 | Extrahieren Sie `t("…")` / `i18n.t("…")` nach `strings.json` und übersetzen Sie anschließend die Einträge, um pro Sprache flache JSON-Dateien zu erzeugen (die Extraktion erfolgt automatisch; verwenden Sie das eigenständige `extract`, um nur den Katalog zu aktualisieren). |
| `translateDocs` | 2 | Übersetzen Sie `.md` / `.mdx` / `.astro` Seiten; Docusaurus-Shell-JSON, wenn `docs[].docusaurusCatalogDir` gesetzt ist. |
| `translateJson` | 3 | Beliebige verschachtelte JSON-Struktur unter `json[]` (`translate-json`). |
| `translateSVG` | — | Übersetzen Sie `.svg`-Dateien (erfordert den `svg`-Block auf oberster Ebene). |

**Übersetzen** Sie SVG-Dateien mit `translate-svg`, wenn `features.translateSVG` wahr ist und ein oberster `svg`-Block konfiguriert ist. Der Befehl `sync` führt diesen Schritt aus, wenn beide gesetzt sind (es sei denn, `--no-svg` ist angegeben).

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  Verzeichnisse oder Glob-Muster (relativ zu cwd), die nach `t("…")`-Aufrufen durchsucht werden. Unterstützt Muster wie `src/` oder `["src/**/*.ts"]`.
- `stringsJson`  
  Pfad zur Master-Katalogdatei. Aktualisiert durch `extract`.
- `flatOutputDir`  
  Verzeichnis, in dem die JSON-Dateien pro Locale geschrieben werden (`de.json`, usw.).
- `preferredModel`  
  Optional. OpenRouter-Modell-ID wird zuerst nur für `translate-ui` ausprobiert; dann `openrouter.translationModels` (oder Legacy-Modelle) in der Reihenfolge, ohne diese ID zu duplizieren.
- `uiExtractor.funcNames` (oder veraltet `reactExtractor.funcNames`)  
  Zusätzliche zu scannende Funktionsnamen (Standard: `["t", "i18n.t"]`).
- `uiExtractor.extensions` (oder veraltet `reactExtractor.extensions`)  
  Einzuschließende Dateierweiterungen (Standard: `[".js", ".jsx", ".ts", ".tsx"]`). `.astro` für Astro-Frontmatter und Template-Ausdrücke hinzufügen.
- `uiExtractor.includePackageDescription` (oder veraltet `reactExtractor.includePackageDescription`)  
  Wenn `true` (Standard), schließt `extract` auch `package.json` `description` als UI-Text ein, falls vorhanden.
- `uiExtractor.packageJsonPath` (oder veraltet `reactExtractor.packageJsonPath`)  
  Benutzerdefinierter Pfad zur `package.json`-Datei, die für die optionale Beschreibungsextraktion verwendet wird.
- `uiExtractor.includeUiLanguageEnglishNames` (oder veraltet `reactExtractor.includeUiLanguageEnglishNames`)

Wenn `true` (Standard `false`), fügt `extract` auch jedes `englishName` aus dem Manifest unter `uiLanguagesPath` zu `strings.json` hinzu, sofern es nicht bereits aus dem Quellenscan vorhanden ist (gleiche Hash-Schlüssel). Erfordert `uiLanguagesPath`, das auf eine gültige `ui-languages.json` verweist.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite-Cache-Verzeichnis (gemeinsam genutzt von allen `docs`-Blöcken). Wird zwischen Ausführungen wiederverwendet. Wenn Sie von einem benutzerdefinierten Dokumentations-Übersetzungscache migrieren, archivieren oder löschen Sie diesen – `cacheDir` erstellt eine eigene SQLite-Datenbank und ist nicht mit anderen Schemata kompatibel.

<a id="best-practice-for-git-exclusions"></a>
#### Best Practice für git-Ausschlüsse:

- Schließen Sie den Inhalt des Übersetzungs-Cache-Ordners aus (z. B. mithilfe von `.gitignore` oder `.git/info/exclude`), um das Einchecken temporärer Cache-Artefakte zu verhindern.
- Behalten Sie `cache.db` bei (löschen Sie es nicht routinemäßig), da die Beibehaltung des SQLite-Caches verhindert, dass unveränderte Segmente erneut übersetzt werden. Dies spart sowohl Laufzeit- als auch API-Kosten, wenn Software, die `ai-i18n-tools` verwendet, aktualisiert oder geändert wird.
- Schließen Sie temporäre Dateien und Protokolldateien aus, um das Einchecken von Sicherungs- und Debug-Dateien zu vermeiden.

<br/>

**Beispiel:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

Array von Dokumentations-Pipeline-Blöcken. `translate-docs` und die Docs-Phase von `sync` **verarbeiten jeden** Block der Reihe nach. Veraltete Schlüssel (`documentations`, `markdownOutput`, `jsonSource`) werden beim Laden weiterhin akzeptiert und umgeschrieben, wenn die Konfigurationsdatei beschreibbar ist; bevorzugen Sie `docs`, `docsOutput` und `docusaurusCatalogDir` in neuen Konfigurationen.

**Inhaltsquellen**

- `description`
Optionale, menschenlesbare Notiz für diesen Block (wird nicht für Übersetzungen verwendet). Wird bei Angabe dem `translate-docs`-`🌐`-Überschriftentitel vorangestellt; erscheint auch in `status`-Abschnittsüberschriften.
- `contentPaths`
Markdown-/MDX-Seiteninhalte und `.astro`-Vorlagen, die übersetzt werden sollen (`translate-docs` durchsucht diese nach `.md`, `.mdx` und `.astro`). Unterstützt **Verzeichnispfade oder Glob-Muster** (z. B. `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). Hieraus stammt der lokalisierte Dokumentationstext.
- `sourceFiles`
Optionaler Alias, der beim Laden in `contentPaths` zusammengeführt wird.
- `targetLocales`
Optionale Untermenge von Sprachen (Lokalisierungen) nur für diesen Block (sonst die obergeordnete `targetLocales`). Die wirksamen Dokumentationssprachen ergeben sich als Vereinigung über alle Blöcke.
- `docusaurusCatalogDir`
Optional. Quellverzeichnis für Docusaurus-JSON-Beschriftungskataloge für diesen Block (z. B. `"i18n/en"` aus `docusaurus write-translations`). Seiteninhalte stammen immer aus `contentPaths`; `docusaurusCatalogDir` liefert nur Shell-/UI-JSON, nicht MDX.

**Ausgabe-Layout**

- `outputDir`
Stammverzeichnis für die übersetzte Ausgabe dieses Blocks.
- `docsOutput.style`
`"nested"` (Standard), `"flat"`, `"doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"`.
- `docsOutput.localeSubpath`
Pfadsegment zwischen `{locale}/` und `{relativeToDocsRoot}` für `doc-system` (erforderlich bei direkter Verwendung von `style: "doc-system"`; voreingestellt bei Verwendung eines Alias). Verwenden Sie `""` für Starlight-artige Sprachordner.
- `docsOutput.docsRoot`
Quell-Docs-Stammverzeichnis für Docusaurus-Layout (z. B. `"docs"`).
- `docsOutput.pathTemplate`
Benutzerdefinierter Markdown-Ausgabepfad. Platzhalter: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
Benutzerdefinierter JSON-Ausgabepfad für Beschriftungsdateien. Unterstützt dieselben Platzhalter wie `pathTemplate`.
- `docsOutput.localePathLowercase`
Wenn `true`, verwenden integrierte Ausgabelayouts (`nested`, `flat`, `doc-system` ohne `pathTemplate`) in Pfaden kleingeschriebene Sprachsegmente. Standard ist `false`; `astro-starlight` und `doc-system` mit leerem `localeSubpath` standardmäßig auf `true` beim Laden der Konfiguration.
- `docsOutput.flatPreserveRelativeDir`
Wenn `docsOutput.style = "flat"`, Quellunterverzeichnisse beibehalten, damit Dateien mit gleichem Basisnamen nicht kollidieren.
- `docsOutput.rewriteRelativeLinks`
Relative Links nach der Übersetzung neu schreiben (automatisch aktiviert, wenn `docsOutput.style = "flat"` und kein benutzerdefiniertes `pathTemplate`).
- `docsOutput.linkRewriteDocsRoot`
Repository-Stamm, der bei der Berechnung von Flat-Link-Umschreibungspräfixen verwendet wird. Lassen Sie dies normalerweise als `"."`, es sei denn, Ihre übersetzten Dokumente befinden sich unter einer anderen Projektwurzel.

**Nachbearbeitung**

- `docsOutput.postProcessing`
Optionale Transformationen am übersetzten **Markdown-Inhalt** (YAML-Schlüssel und nicht-prosaische Front-Matter-Werte bleiben erhalten). Wird ausgeführt nach der Segmentzusammenfügung und dem Umschreiben flacher Links, und vor `addFrontmatter`.
- `docsOutput.postProcessing.regexAdjustments`
Geordnete Liste von `{ "description"?, "search", "replace" }`. `search` ist ein Regex-Muster (einfacher String verwendet Flag `g`, oder `/pattern/flags`). `replace` unterstützt Platzhalter wie `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` – generiert eine begrenzte „In anderen Sprachen lesen“-Linkzeile neu in Quell- und übersetztem Markdown. Siehe [Sprachumschalter (`languageListBlock`)](#language-switcher-languagelistblock) für Einrichtung, Verhalten und Repository-Beispiele.

**Verhalten und Metadaten**

- `translateFrontmatterFields`
Gleiche Ebene wie `docsOutput` (pro `docs[]`-Block). Standardwert `true`: übersetze benutzergerichtete YAML-Prosa für Starlight/Docusaurus (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next`-Labels). Setzen Sie `false`, um den gesamten Front-Matter-Block unverändert zu lassen; übergeben Sie ein String-Array, um auf bestimmte Punkt-Pfade einzuschränken.
- `segmentSplitting`
Gleiche Ebene wie `docsOutput` (pro `docs[]`-Block). Optionale feingranulare Segmentierung für `translate-docs`-Extraktion: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`. Wenn `enabled` auf `true` steht (Standard, wenn `segmentSplitting` weggelassen wird), werden dichte Absätze, GFM-Pipe-Tabellen (erster Abschnitt enthält Kopfzeile, Trennzeile und erste Datenzeile) und lange Listen aufgeteilt; Unterabschnitte werden mit einfachen Zeilenumbrüchen wieder zusammengefügt (`tightJoinPrevious`). Setzen Sie `"enabled": false`, um nur ein Segment pro durch Leerzeilen getrenntem Textblock zu verwenden. Wenn `qualityRetrySplit` auf `true` steht (Standard), werden Markdown-Segmente, die nach Erschöpfung aller Modelle die AST-Validierung nicht bestehen, schrittweise aufgeteilt und erneut vom ersten Modell verarbeitet; `maxQualityRetrySplitDepth` (Standard `3`) begrenzt rekursive Aufteilungen.
- `warnMarkdownSourceIssues`
Wenn `true` (Standard, wenn weggelassen), durchsucht jeder `translate-docs`-Lauf Markdown-Segmente erneut nach riskanten Delimitern / nicht geschlossenen Inline-Codes, gibt Terminal-Warnungen aus und ersetzt `markdown_source_issues`-Zeilen für den Cache-Dateipfad dieser Datei. Setzen Sie `false`, um Warnungen und SQLite-Aktualisierungen für diesen Block zu überspringen.
- `addFrontmatter`
Wenn `true` (Standard, wenn weggelassen), enthalten übersetzte Markdown-Dateien YAML-Schlüssel: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path` und, falls mindestens ein Segment über Modell-Metadaten verfügt, `translation_models` (sortierte Liste der verwendeten OpenRouter-Modell-IDs). Auf `false` setzen, um zu überspringen.

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
Optional. Zusätzliche JSX/HTML-Attributnamen, deren **in Anführungszeichen stehende Zeichenkettenwerte** nicht an den Übersetzer gesendet werden dürfen. Wird mit integrierten Standardwerten zusammengeführt (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, die meisten `aria-*` usw.). Groß-/Kleinschreibung wird ignoriert. Gilt für:

- `.astro`-Analyse-und-Ersetzungs-Extraktion (statische HTML-Tags und String-Literale nach `attr=` innerhalb von `{expression}`-Blöcken).
  - MDX-Platzhalter-Extraktion während der Übersetzung von Markdown/Astro-Abschnitten (`label`, `tooltip` und `aria-label` bei großgeschriebenen JSX-Tags sowie `TabItem` `value`, falls zutreffend).

Beispiel: `"protectAttributes": ["variant", "size"]` behält `variant="primary"` innerhalb von `{items.map(...)}` unverändert über alle Sprachen hinweg.

Sie können auch normalerweise übersetzbare Attribute (z. B. `"title"` oder `"aria-label"`) auflisten, wenn deren Werte wortwörtlich aus dem Englischen übernommen werden sollen.

- `protectKeys`
Optional. Zusätzliche **Namen von Objekteigenschaften**, deren in Anführungszeichen stehende String-Werte innerhalb von `{expression}`-Template-Blöcken und MDX-Objektliteralen nicht übersetzt werden dürfen (z. B. `label:` innerhalb von `<Tabs values={[ … ]}>`). Wird mit integrierten Standardwerten zusammengeführt (`class`, `key`, `id`, `href`, `src` usw.). Groß-/Kleinschreibung wird ignoriert.

Beispiel: `"protectKeys": ["slug", "code"]` überspringt `{ slug: 'getting-started', title: 'Getting started' }` → nur `title` wird übersetzt, wenn `slug` geschützt ist.

<br/>

**Beispiel (`docsOutput.style = "flat"` — Screenshot-Pfade + optionaler Sprachlisten-Wrapper):**

<details>
<summary>Beispiel für die Nachbearbeitung im flachen Layout (Screenshots + languageListBlock)</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

Array auf oberster Ebene mit verschachtelten JSON-Übersetzungs-Pipelines. Wird nur verwendet, wenn `features.translateJson` wahr ist (`translate-json` oder die JSON-Phase von `sync`). Siehe [Workflow 3 - JSON-Datei-Übersetzung](#workflow-3---json-file-translation).

| Feld | Beschreibung |
|-------|-------------|
| `description` | Optionale Anmerkung für CLI / `status` (wird nicht übersetzt). |
| `contentPaths` | Quell-`.json`-Dateien, Verzeichnisse oder Muster unterhalb des Projekt-Stammverzeichnisses. |
| `outputPathTemplate` | Erforderlicher Ausgabepfad pro Zielsprache. Platzhalter: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`. |
| `targetLocales` | Optionaler Teilbereich für diesen Block; andernfalls Stamm-`targetLocales`. |
| `keyPolicy.mode` | `allowlist`, `denylist` oder `both`. |
| `keyPolicy.translateKeys` | Punkt-Pfade / Muster, die eingeschlossen werden sollen, wenn der Modus `allowlist` oder `both` ist. |
| `keyPolicy.skipKeys` | Punkt-Pfade / Muster, die ausgeschlossen werden sollen (Standard-Verweigerungsliste enthält `id`, `slug`, `href`, `url`, `key`, `code`). |

<a id="svg"></a>
### `svg`

Pfade und Layout auf oberster Ebene für SVG-Dateien. Die Übersetzung wird nur ausgeführt, wenn `features.translateSVG` wahr ist (über `translate-svg` oder die SVG-Phase von `sync`).

| Feld            | Beschreibung                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | Ein oder mehrere Verzeichnisse **oder Glob-Muster** (z. B. `"images/*.svg"`, `"**/icons/*.svg"`). Die Muster werden relativ zum Projektstamm aufgelöst und rekursiv nach `.svg`-Dateien durchsucht.                                                                         |
| `outputDir`                   | Stammverzeichnis für die übersetzte SVG-Ausgabe.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` oder `"nested"`, wenn `pathTemplate` nicht gesetzt ist.                                                                                                                                                                                                                               |
| `pathTemplate`   | Benutzerdefinierter SVG-Ausgabepfad. Platzhalter: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `localePathLowercase` | Wenn `true`, verwenden integrierte `flat` / `nested` SVG-Layouts kleingeschriebene Gebietsschema-Abschnitte. Benutzerdefinierte `pathTemplate`-Werte bleiben unverändert; verwenden Sie `{llocale}` für klein geschriebene Abschnitte. |
| `forceLowercase` | Kleinschreibung bei der Übersetzung beim erneuten Zusammensetzen des SVG. Nützlich für Designs, die auf vollständig kleingeschriebenen Beschriftungen basieren.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Feld          | Beschreibung                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Pfad zu `strings.json` – erstellt automatisch ein Glossar aus vorhandenen Übersetzungen.                                                                                                 |
| `userGlossary` | Pfad zu einer CSV-Datei mit den Spalten `Original language string` (oder `en`), `locale`, `Translation` – eine Zeile pro Quellbegriff und Zielsprache (`locale` kann `*` für alle Ziele sein). |

**Ein leeres Glossar im CSV-Format generieren:**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI-Referenz

| Befehl                                                                                                    | Beschreibung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                                  | Gibt die CLI-Version und den Build-Zeitstempel aus (dieselben Informationen wie `-V` / `--version` im Hauptprogramm).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website\|ui-json-bundles] [-o path] [--with-translate-ignore]` | Schreibt eine Startkonfigurationsdatei (enthält `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` und `docs[].addFrontmatter`). `ui-json-bundles` erstellt Gerüst für Workflow 3 (nur `json[]`). `--with-translate-ignore` erzeugt eine Start-`.translate-ignore`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `check-models`                                                                           | Überprüfen jeder konfigurierten OpenRouter-Modell-ID gegenüber `GET /models` (Katalogmitgliedschaft, `expiration_date`, USD pro 1 Mio. Token für Prompt/Abschluss). Erfordert `OPENROUTER_API_KEY`. Beendet mit einem Fehlercode, wenn eine konfigurierte ID fehlt oder abgelaufen ist. Berücksichtigt `openrouter.requestTimeoutMs` für die Kataloganfrage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `extract` | Aktualisieren Sie `strings.json` aus `t("…")` / `i18n.t("…")`-Literalen, optionaler `package.json`-Beschreibung und optionalen Manifest-`englishName`-Einträgen (siehe `ui.reactExtractor`). Erfordert nicht-leeres `ui.sourceRoots`. |
| `generate-ui-languages [--master <path>] [--dry-run]`                                    | Schreibt `ui-languages.json` nach `ui.flatOutputDir` (oder `uiLanguagesPath`, falls festgelegt) mithilfe von `sourceLocale` + `targetLocales` und dem gebündelten `data/ui-languages-complete.json` (oder `--master`). Gibt Warnungen aus und erzeugt `TODO`-Platzhalter für Sprachvarianten, die in der Master-Datei fehlen. Falls Sie ein bestehendes Manifest mit angepassten Werten für `label` oder `englishName` haben, werden diese durch die Standardwerte aus dem Master-Katalog ersetzt – überprüfen und gegebenenfalls anpassen Sie die generierte Datei danach.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                                         | Übersetzen von Markdown/MDX und JSON für jeden `docs`-Block (`contentPaths`, optionaler `docusaurusCatalogDir`). `-j`: maximale parallele Sprachversionen; `-b`: maximale parallele Batch-API-Aufrufe pro Datei. `--prompt-format`: Batch-Übertragungsformat (`xml` \| `json-array` \| `json-object`). Siehe [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags) und [Batch-Aufforderungsformat](#batch-prompt-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …`                                                                                      | Erfordert mindestens einen `docs[]`-Block. Sammelt `.md` / `.mdx` unter `contentPaths` jedes Blocks (beachtet `.translate-ignore`). Fügt eine HTML-Ankerzeile `<a id="slug"></a>` unmittelbar **vor** jede flache ATX-`#`-Überschrift ein (überspringt Überschriften innerhalb von Codeblöcken mit Rahmen); wenn bereits eine Ankerzeile vorhanden ist, aktualisiert sie `id`, falls diese nicht mehr mit dem aus dem aktuellen Überschriftentext abgeleiteten Slug übereinstimmt. `-p` / `--path` oder `-f` / `--file`: Beschränkung auf eine projektrelative Datei oder ein Verzeichnis. `--slug-style`: `github` (Standard; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Mit `pymdown`, optional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run`: Zeigt nur Änderungen an.                                                                                                                                                                                                                                                                                                                                    |
| `check-markdown …`                                                                                         | Durchsucht Markdown/MDX unterhalb jedes `docs[]`-Blocks `contentPaths` (gleiche Auffindung wie `translate-docs`, beachtet `.translate-ignore`): Delimiter-Paarung, nicht geschlossener Inline-Code und `STRONG_OUTSIDE_LINK`, wenn `**`/`__` einen `[text](../../docs/url)`-Link umschließen. `-p` / `--path` oder `-f` / `--file`: optionaler Bereich. Gibt `relativePath:line: [ISSUE_CODE] message`-Zeilen auf **stderr** aus; Exit-Code **1**, falls ein Problem vorliegt. `--json`: JSON-Bericht auf **stdout**. Schreibt `markdown_source_issues` in `cacheDir`, es sei denn `--no-cache`. `-v` fügt Quell-Hashes zu stderr-Zeilen hinzu.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                        | Übersetzt SVG-Dateien, die in `config.svg` konfiguriert sind (getrennt von Dokumentation). Erfordert `features.translateSVG`. Gleiche Cache-Überlegungen wie bei Dokumenten; unterstützt `--no-cache`, um SQLite-Lese-/Schreibvorgänge für diese Ausführung zu überspringen. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                               | Übersetzen Sie nur UI-Texte (`strings.json` → Locale-JSON). `-l` / `--locale`: durch Komma getrennte Zielsprachen (Standard aus Konfiguration / `ui-languages.json`). `--force`: alle Einträge pro Sprache erneut übersetzen (bestehende Übersetzungen ignorieren). `--dry-run`: keine Schreibvorgänge, keine API-Aufrufe. `-j`: maximale parallele Sprachen. Erfordert `features.translateUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `translate-json …`                                                                                         | Übersetzt geschachteltes JSON gemäß `json[]` (erfordert `features.translateJson`). Gemeinsamer SQLite-Cache; `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`. Siehe [Workflow 3](#workflow-3---json-file-translation).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                      | Extrahiert und übersetzt anschließend UI-Texte (erfordert `features.translateUIStrings`). Nur für die Benutzeroberfläche – keine Dokumentation, SVG oder `json[]`. Gleiche `-l`, `--force`, `--dry-run` und `-j` Optionen wie bei `translate-ui`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                      | Führt `extract` **zuerst** aus (erfordert `features.translateUIStrings`), sodass `strings.json` mit der Quelle übereinstimmt, anschließend Überprüfung der **Quell-Lokalisierung** der UI-Texte durch ein LLM (Rechtschreibung, Grammatik). **Terminologiehinweise** stammen ausschließlich aus der `glossary.userGlossary`-CSV-Datei (gleicher Umfang wie `translate-ui` – nicht `strings.json` / `uiGlossary`), damit fehlerhafte Texte nicht als Glossar-Inhalt bestärkt werden. Verwendet OpenRouter (`OPENROUTER_API_KEY`). Nur beratend (gibt Exit-Code **0** nach Abschluss zurück). Erstellt `lint-source-results_<timestamp>.log` unter `cacheDir` als **menschenlesbaren** Bericht (Zusammenfassung, Probleme und pro Zeichenkette **OK**-Einträge); die Konsole zeigt nur Zusammenfassungszahlen und Probleme an (keine `[ok]`-Zeilen pro Zeichenkette). Gibt den Protokolldateinamen in der letzten Zeile aus. `--json`: vollständiger maschinenlesbarer JSON-Bericht nur auf stdout (Protokolldatei bleibt menschenlesbar). `--dry-run`: führt weiterhin `extract` aus, gibt dann nur den Batch-Plan aus (keine API-Aufrufe). `--chunk`: Anzahl Zeichenketten pro API-Batch (Standard **50**). `-j`: maximale parallele Batches (Standard `concurrency`). Mit `--json` geht die menschenlesbare Ausgabe an stderr. Links verwenden `path:line`, wie die Schaltfläche „Link“ in den `dashboard`-UI-Texten. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`              | Exportiert `strings.json` nach XLIFF 2.0 (eine `.xliff` pro Zielgebietsschema). `-o` / `--output-dir`: Ausgabeverzeichnis (Standard: derselbe Ordner wie der Katalog). `--untranslated-only`: nur Einheiten ohne Übersetzung für dieses Gebietsschema. Nur-Lesen; keine API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                                   | Extrahieren (falls aktiviert), dann UI-Übersetzung, dann `translate-svg`, wenn `features.translateSVG` und `config.svg` gesetzt sind, dann Dokumentationsübersetzung, dann `translate-json`, wenn `features.translateJson` und `json[]` gesetzt sind — es sei denn, es wird mit `--no-ui`, `--no-svg`, `--no-docs` oder `--no-json` übersprungen. Gemeinsame Flags: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (Dokumente und JSON-Batchverarbeitung), `--force` / `--force-update` (Dokumente und JSON). Die Dokumentationsphase leitet außerdem `--emphasis-placeholders` und `--debug-failed` weiter (gleiche Bedeutung wie `translate-docs`). `--prompt-format` ist kein `sync`-Flag; die Schritte für Dokumente und JSON verwenden den integrierten Standardwert (`json-array`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `status [--max-columns <n>]`                                                             | Wenn `features.translateUIStrings` aktiviert ist, gibt er die UI-Abdeckung pro Gebietsschema aus (`Translated` / `Missing` / `Total`). Danach gibt er den Markdown-Übersetzungsstatus pro Datei × Gebietsschema aus (kein `--locale`-Filter; Gebietsschemata stammen aus der Konfiguration). Große Gebietsschemalisten werden in wiederholte Tabellen mit maximal `n` Gebietsspalten aufgeteilt (Standard **9**), damit die Zeilen im Terminal schmal bleiben.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                         | Dokumentations-Cache und `strings.json`-Statistiken ausgeben (gleiche Aggregate wie im Übersetzungs-Dashboard → **Statistiken**). `--max-columns`: maximale Anzahl Spalten pro Gebietsschema und Model × Gebietsschema-Tabelle (Standard entspricht dem Dashboard).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                                                      | Führt zuerst `sync --force-update` aus (Extrahieren, Benutzeroberfläche, SVG, Dokumentation) und entfernt anschließend veraltete Segmentzeilen (null `last_hit_at` / leerer Dateipfad); löscht `file_tracking`-Zeilen, deren aufgelöster Quellpfad auf dem Datenträger fehlt; entfernt Übersetzungszeilen, deren `filepath`-Metadaten auf eine fehlende Datei verweisen; bereinigt verwaiste `translation_failures`-Zeilen. Protokolliert vier Zähler (veraltete Segmente, verwaiste `file_tracking`, verwaiste Übersetzungen, verwaiste Fehler). Erstellt eine zeitgestempelte SQLite-Sicherung im Cache-Verzeichnis, sofern nicht `--no-backup`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                               | **Keine Konfiguration erforderlich.** Durchsucht einen Verzeichnisbaum (Standard: cwd) nach `*.log` und `cache.db.backup*.sqlite`, gibt `./…`-Pfade aus wie `find -print`. Bei Treffern: fragt `Delete these files? (y/n)` ab, es sei denn `-f` / `--force` (löscht ohne Nachfrage). Bei keiner Übereinstimmung: Beendigung ohne Nachfrage. `--dry-run`: nur Auflisten, keine Nachfrage oder Löschungen (übersteuert `--force`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                                        | Startet das Übersetzungs-Dashboard (lokale Web-Benutzeroberfläche für Cache-Segmente, `strings.json`, Glossar, Fehler und Statistiken). Standardport **8675** (bei Belegung wird der nächste Port versucht). Mit `--no-open` wird der Standardbrowser nicht automatisch geöffnet. Der veraltete Alias `editor` funktioniert weiterhin, gibt aber eine Warnung aus.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `glossary-generate [-o <path>]`                                                          | Erstellt eine leere `glossary-user.csv`-Vorlage. `-o`: überschreibt den Ausgabepfad (Standard: `glossary.userGlossary` aus der Konfiguration oder `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                         | Zeigt die Hilfe für einen Unterbefehl an (gleiche Ausgabe wie `ai-i18n-tools <command> --help`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

<a id="root-and-global-options"></a>
### Stamm- und globale Optionen

| Option                       | Bereich         | Beschreibung                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | Stammprogramm  | Gibt die Versionsnummer und den Build-Zeitstempel aus (gleiche Informationen wie der Unterbefehl `version`). |
| `-h` / `--help`              | Stammprogramm  | Zeigt die Hilfe für das Stammprogramm oder für einen Unterbefehl an, wenn zusammen mit einem Befehlsnamen verwendet.      |
| `-c` / `--config <path>`     | Jeder Befehl | Pfad zur Konfigurationsdatei (Standard: `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | Jeder Befehl | Ausführliche Protokollierung.                                                                          |
| `-w` / `--write-logs [path]` | Jeder Befehl | Leitet die Konsolenausgabe in eine `.log`-Datei um (Standardpfad: unterhalb des Stammverzeichnisses `cacheDir`).                |

<a id="per-command-help"></a>
### Hilfe pro Befehl

| Verwendung                            | Beschreibung                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | Alle Optionen für diesen Befehl.      |
| `ai-i18n-tools help <command>`   | Gibt dieselbe Ausgabe wie `<command> --help` aus. |

<a id="target-locales--l----locale"></a>
### Zielsprachen (`-l` / `--locale`)

| Befehle                                                                                | Verhalten                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — durch Komma getrennte Ziel-BCP-47-Codes (z. B. `de,fr,pt-BR`). Wenn nicht angegeben, gelten Standardwerte aus der Konfiguration (`json[]`-Blöcke können auch pro Block `targetLocales` festlegen). UI-Schritte verwenden außerdem `ui-languages.json`. |
| `lint-source`                                                                           | `-l` / `--locale <code>` — einzelne Quellsprache zur Überprüfung (Standard: Konfiguration `sourceLocale`).                                                            |

---

<a id="environment-variables"></a>
## Umgebungsvariablen

| Variable               | Beschreibung                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **Erforderlich.** Ihr OpenRouter-API-Schlüssel.                     |
| `OPENROUTER_BASE_URL`   | Überschreibt die Basis-URL der API.                                 |
| `I18N_SOURCE_LOCALE`    | Überschreibt `sourceLocale` zur Laufzeit.                        |
| `I18N_TARGET_LOCALES`   | Durch Komma getrennte Gebietsschemacodes zur Überschreibung von `targetLocales`.  |
| `I18N_LOG_LEVEL`        | Protokollierungsstufe (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | Wenn `1`, werden ANSI-Farben in der Protokollaufgabe deaktiviert.              |
| `I18N_LOG_SESSION_MAX`  | Maximale Anzahl an Zeilen pro Protokollsitzung (Standard `5000`).           |
