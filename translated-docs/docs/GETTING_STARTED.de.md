<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: Erste Schritte

`ai-i18n-tools` bietet zwei unabhängige, kombinierbare Workflows:

- **Workflow 1 – UI-Übersetzung**: Extrahieren Sie `t("…")`-Aufrufe aus jeder JS/TS-Quelle, übersetzen Sie sie über OpenRouter und schreiben Sie flache, sprachspezifische JSON-Dateien, die für i18next bereit sind.
- **Workflow 2 – Dokumentenübersetzung**: Übersetzen Sie **Markdown- und MDX-Seiten**, die in `contentPaths` aufgelistet sind, in beliebig viele Sprachen mit intelligenter Zwischenspeicherung – das ist die lokalisierte Dokumentation, die Leser auf der Website öffnen. Optional **Docusaurus JSON** (`jsonSource`, aus `docusaurus write-translations`) deckt **Seiten-Shell-Bestandteile** (Navigationsleiste, Fußzeile, Theme-/Plugin-Benutzeroberflächen-Texte) ab, nicht den Fließtext in `docs/`. **SVG**-Dateien verwenden `features.translateSVG`, den obersten `svg`-Block und `translate-svg` (siehe [CLI-Referenz](#cli-reference)).

Beide Workflows nutzen OpenRouter (jeden kompatiblen LLM) und teilen sich eine einzige Konfigurationsdatei.

<small>**In anderen Sprachen lesen:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Installation](#installation)
- [Schnellstart](#quick-start)
  - [Empfohlene `package.json`-Skripte](#recommended-packagejson-scripts)
- [Workflow 1 – UI-Übersetzung](#workflow-1---ui-translation)
  - [Schritt 1: Initialisieren](#step-1-initialise)
  - [Schritt 2: Zeichenketten extrahieren](#step-2-extract-strings)
  - [Schritt 3: UI-Zeichenketten übersetzen](#step-3-translate-ui-strings)
  - [Export nach XLIFF 2.0 (optional)](#exporting-to-xliff-20-optional)
  - [Schritt 4: i18next zur Laufzeit verbinden](#step-4-wire-i18next-at-runtime)
  - [Verwendung von `t()` im Quellcode](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Kardinal-Pluralformen (`plurals: true`)](#cardinal-plurals-plurals-true)
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
    - [Ankerlinks im flachen Layout](#anchor-links-in-flat-layout)
    - [Bilder und Raster-Assets in übersetzten Dokumenten](#images-and-raster-assets-in-translated-docs)
    - [`pathTemplate` / `jsonPathTemplate`-Platzhalter](#pathtemplate--jsonpathtemplate-placeholders)
- [Kombinierter Workflow (UI + Docs)](#combined-workflow-ui--docs)
  - [Gemischter Dokumentationsworkflow (Docusaurus + flach)](#mixed-documentation-workflow-docusaurus--flat)
- [Editor für Übersetzungscache](#translation-cache-editor)
  - [Fehler (Dokumentenübersetzung)](#failures-document-translation)
    - [Wann verwenden?](#when-to-use-it)
    - [Warum Quelltextänderungen wichtig sind](#why-source-edits-matter)
    - [Verwendung der Registerkarte](#how-to-use-the-tab)
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
    - [Bewährte Methode für Git-Ausschlüsse:](#best-practice-for-git-exclusions)
  - [`documentations`](#documentations)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLI-Referenz](#cli-reference)
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

Die Standardvorlage `init` (`ui-markdown`) ermöglicht ausschließlich die Extraktion und Übersetzung der **Benutzeroberfläche (UI)**. Die Vorlagen `ui-docusaurus` und `ui-starlight` ermöglichen die **Dokumentenübersetzung** (`translate-docs`). Verwenden Sie `sync`, wenn Sie einen Befehl benötigen, der gemäß Ihrer Konfiguration die Extraktion, die UI-Übersetzung, optional die SVG-Datei-Übersetzung und die Dokumentenübersetzung ausführt.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Empfohlene `package.json`-Skripte

Wenn das Paket lokal installiert ist, können Sie die CLI-Befehle direkt in Skripten verwenden (kein `npx` erforderlich).

**Bevorzugen** Sie `sync` für alles, was früher „`translate-ui` ausführen, dann `translate-svg`, dann `translate-docs`“ war: `ai-i18n-tools sync` führt **extract** (wenn aktiviert), **translate-ui**, optional **translate-svg** und dann **translate-docs** – in der richtigen Reihenfolge und mit gemeinsamen Flags – gemäß Ihrer Konfiguration aus. Das manuelle Verketten dieser drei Übersetzungsbefehle ist leicht fehleranfällig (Reihenfolge, extract, Locale-Flags). Verwenden Sie `i18n:translate:ui`, `i18n:translate:svg` und `i18n:translate:docs` nur, wenn Sie einen **einzelnen** Schritt isoliert benötigen.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
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

Der Scanner ist konfigurierbar: Fügen Sie benutzerdefinierte Funktionsnamen über `ui.reactExtractor.funcNames` hinzu.

<a id="step-3-translate-ui-strings"></a>
### Schritt 3: UI-Zeichenketten übersetzen

```bash
npx ai-i18n-tools translate-ui
```

Liest `strings.json`, sendet Stapel an OpenRouter für jedes Zielsprachgebiet, schreibt flache JSON-Dateien (`de.json`, `fr.json` usw.) nach `ui.flatOutputDir`. Wenn `ui.preferredModel` festgelegt ist, wird zuerst dieses Modell versucht, bevor die geordnete Liste in `openrouter.translationModels` verwendet wird (Dokumentübersetzung und andere Befehle verwenden weiterhin nur `openrouter`).

Für jeden Eintrag speichert `translate-ui` die **OpenRouter-Modell-ID**, die jede Sprachvariante erfolgreich übersetzt hat, in einem optionalen `models`-Objekt (mit denselben Sprachschlüsseln wie `translated`). Zeichenketten, die im lokalen `editor`-Befehl bearbeitet wurden, werden mit dem Sentinel-Wert `user-edited` in `models` für diese Sprachvariante markiert. Die flachen, sprachspezifischen Dateien unter `ui.flatOutputDir` enthalten weiterhin nur **Quellzeichenkette → Übersetzung**; sie enthalten nicht `models` (damit sich die Laufzeit-Bundles nicht ändern).

> **Hinweis zur Verwendung des Cache-Editors:** Wenn Sie einen Eintrag im Cache-Editor bearbeiten, müssen Sie einen `sync --force-update` (oder den entsprechenden `translate`-Befehl mit `--force-update`) ausführen, um die Ausgabedateien mit dem aktualisierten Cache-Eintrag neu zu schreiben. Beachten Sie außerdem, dass Ihre manuelle Bearbeitung verloren geht, wenn sich der Quelltext später ändert, da ein neuer Cache-Schlüssel (Hash) für die neue Quellzeichenkette generiert wird.

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

<!--
  Translate-docs note: paragraphs here stack many `bold` / `` `code` `` patterns (nested backticks, long sentences).
  Some target locales fail AST-style validation; see "Complex Markdown and failed quality checks" under Workflow 2 — simplify source rather than forcing literal markup parity.
-->

**Drei Werte synchron halten:** `sourceLocale` in `ai-i18n-tools.config.json`, `SOURCE_LOCALE` in dieser Datei und der Plural-flache JSON-Name `translate-ui`, den als `{sourceLocale}.json` unter Ihrem flachen Ausgabeverzeichnis schreibt (häufig `public/locales/`). Verwenden Sie denselben Basisnamen in der statischen `import` (Beispiel oben: `en-GB` → `en-GB.json`). Das `lng`-Feld in `sourcePluralFlatBundle` muss `SOURCE_LOCALE` entsprechen. Statische ES `import`-Pfade können keine Variablen verwenden; wenn Sie die Quelllokalisierung ändern, aktualisieren Sie `SOURCE_LOCALE` und den Importpfad gemeinsam. Alternativ laden Sie die Datei mit einem dynamischen `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch` oder `readFileSync`, sodass der Pfad aus `SOURCE_LOCALE` gebildet wird.

Der Codeausschnitt verwendet `./locales/…` und `./public/locales/…`, als läge `i18n` neben diesen Ordnern. Wenn Ihre Datei unter `src/` liegt (typisch), verwenden Sie `../locales/…` und `../public/locales/…`, damit die Importe auf dieselben Pfade wie `ui.stringsJson`, `uiLanguagesPath` und `ui.flatOutputDir` aufgelöst werden.

Importieren Sie `i18n.js` bevor React rendert (z. B. am Anfang Ihrer Einstiegsdatei). Wenn der Benutzer die Sprache wechselt, rufen Sie `await loadLocale(code)` und dann `i18n.changeLanguage(code)` auf.

`localeLoaders` **mit der Konfiguration synchron halten**, indem sie aus `ui-languages.json` mithilfe von `makeLocaleLoadersFromManifest` abgeleitet werden (dadurch werden `SOURCE_LOCALE` mit derselben Normalisierung wie `makeLoadLocale` herausgefiltert). Wenn Sie ein Gebietsschema zu `targetLocales` hinzufügen und `generate-ui-languages` ausführen, wird das Manifest aktualisiert und Ihre Loader verfolgen die Änderung automatisch – es ist nicht erforderlich, eine separate hartkodierte Zuordnung zu pflegen.

Wenn Ihre JSON-Bundles unter `public/` liegen (typische Next.js-Setup), implementieren Sie jeden Loader so, dass er die Datei vom öffentlichen URL-Pfad abruft, zum Beispiel:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Dies ermöglicht es dem Browser, statische JSON-Dateien zu laden.

Für Node-CLIs ohne Bundler verwenden Sie `readFileSync` innerhalb eines kleinen `makeFileLoader`-Hilfsprogramms, das die JSON-Datei für jeden Code liest und analysiert.

`SOURCE_LOCALE` wird exportiert, damit jede andere Datei, die es benötigt (z. B. ein Sprachwechsler), es direkt aus `'./i18n'` importieren kann. Wenn Sie eine bestehende i18next-Konfiguration migrieren, ersetzen Sie alle hartkodierten Quell-Sprachcodes (z. B. `'en-GB'`-Prüfungen, die in Komponenten verstreut sind) durch Importe von `SOURCE_LOCALE` aus Ihrer i18n-Bootstrap-Datei.

Benannte Imports (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funktionieren genauso, falls Sie den Default-Export nicht verwenden möchten.

`aiI18n.defaultI18nInitOptions(sourceLocale)` (oder `defaultI18nInitOptions(sourceLocale)`, wenn namentlich importiert) gibt die Standardoptionen für Key-as-Default-Konfigurationen zurück:

- `parseMissingKeyHandler` gibt den Schlüssel selbst zurück, sodass nicht übersetzte Zeichenketten den Quelltext anzeigen.
- `nsSeparator: false` erlaubt Schlüssel, die Doppelpunkte enthalten.
- `interpolation.escapeValue: false` – sicher zu deaktivieren: React escaped Werte selbst, und Node.js-/CLI-Ausgaben enthalten kein HTML, das escaped werden müsste.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` ist die **empfohlene** Verkabelung für ai-i18n-tools-Projekte: Sie wendet Key-Trim + Quell-Locale <code>"{{var}}"</code> Interpolationsfallback an (das gleiche Verhalten wie das niedrigere `wrapI18nWithKeyTrim`), kombiniert optional `translate-ui` `{sourceLocale}.json` plural-suffixed Keys über `addResourceBundle`, und installiert dann pluralbewusste `wrapT` aus Ihrem `strings.json`. Diese gebündelte Datei muss die Pluralflachdatei für Ihre **konfigurierte** Quell-Locale sein — dasselbe `sourceLocale` wie in `ai-i18n-tools.config.json` und `SOURCE_LOCALE` in Ihrem i18n-Bootstrap (siehe Schritt 4 oben). Lassen Sie `sourcePluralFlatBundle` nur während des Bootstrappings weg (kombinieren Sie es, sobald `translate-ui` `{sourceLocale}.json` ausgegeben hat). `wrapI18nWithKeyTrim` allein ist **veraltet** für Anwendungscode — verwenden Sie stattdessen `setupKeyAsDefaultT`.

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

**In** `strings.json` verwenden Pluralgruppen **eine Zeile pro Hash** mit `"plural": true`, dem ursprünglichen Literal in `source` und `translated[locale]` als Objekt, das Kardinalkategorien (`zero`, `one`, `two`, `few`, `many`, `other`) den entsprechenden Zeichenfolgen für das jeweilige Gebietsschema zuordnet.

**Flaches Gebietsschema-JSON:** Nicht-plurale Zeilen bleiben im Format **Quellensatz → Übersetzung**. Plurale Zeilen werden als `<groupId>_original` (entspricht `source`, zur Referenz) und `<groupId>_<form>` für jedes Suffix ausgegeben, sodass i18next Plurale nativ auflösen kann. `translate-ui` schreibt außerdem `{sourceLocale}.json`, das **nur** Plural-Flachschlüssel enthält (laden Sie dieses Bundle für die Ausgangssprache, damit suffixed Schlüssel aufgelöst werden; einfache Zeichenketten verwenden weiterhin den Schlüssel als Standard). Für jedes Zielsprachgebiet werden die ausgegebenen Suffixschlüssel entsprechend `Intl.PluralRules` für dieses Gebietsschema (`requiredCldrPluralForms`) angepasst: Wenn `strings.json` eine Kategorie weggelassen hat, weil sie nach der Verdichtung mit einer anderen übereinstimmte (z. B. Arabisch `many` identisch mit `other`), schreibt `translate-ui` dennoch jedes erforderliche Suffix in die flache Datei, indem es von einem fallback-fähigen Geschwistersatz kopiert, sodass zur Laufzeit kein Schlüssel beim Abruf fehlt.

Laufzeit (`ai-i18n-tools/runtime`): **Aufruf** von `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — führt `wrapI18nWithKeyTrim` aus, registriert das optionale `translate-ui` `{sourceLocale}.json` Plural-Bundle und anschließend `wrapT` mithilfe von `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` entfernt `plurals` / `zeroDigit`, schreibt den Schlüssel bei Bedarf in die Gruppen-ID um und leitet `count` weiter (optional: wenn ein einzelner Nicht-`{{count}}`-Platzhalter vorhanden ist, wird `count` aus dieser numerischen Option kopiert).

**Ältere Umgebungen:** `Intl.PluralRules` ist erforderlich für Tooling und konsistentes Verhalten; verwenden Sie ein Polyfill, wenn Sie sehr alte Browser ansprechen.

**Nicht in v1 enthalten:** Ordinale Plurale (`_ordinal_*`, `ordinal: true`), Intervall-Plurale, ausschließlich ICU-Pipelines.

<a id="language-switcher-ui"></a>
### Sprachwechsler-Benutzeroberfläche

Verwenden Sie das `ui-languages.json`-Manifest, um einen Sprachauswahl-Dialog zu erstellen. `ai-i18n-tools` exportiert zwei Anzeige-Hilfsfunktionen:

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

Hauptsächlich konzipiert für **Markdown- und MDX-Dokumentation** unter `contentPaths` (die Seiten, die Leser interessieren). Auf Docusaurus-Seiten können Sie auch **JSON-Beschriftungsdateien** übersetzen, die von `docusaurus write-translations` erzeugt werden – diese enthalten Theme-, Navigationsleisten-, Fußzeilen- und Plugin-Benutzeroberflächentexte (Shell-i18n), getrennt vom Textkörper in `docs/`. Für eingebettete PNG- und andere Rasterbilder in Markdown siehe [Bilder und Raster-Assets in übersetzten Dokumenten](#images-and-raster-assets-in-translated-docs). SVG-Dateien werden über [`translate-svg`](#cli-reference) übersetzt, wenn `features.translateSVG` aktiviert ist und der oberste `svg`-Block gesetzt ist – nicht über `documentations[].contentPaths`.

<a id="step-1-initialise-for-documentation"></a>
### Schritt 1: Für Dokumentation initialisieren

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Für Astro Starlight-Dokumentationsseiten:

```bash
npx ai-i18n-tools init -t ui-starlight
```

Bearbeiten Sie die generierte `ai-i18n-tools.config.json`:

- `sourceLocale` – Ausgangssprache (muss `defaultLocale` in `docusaurus.config.js` entsprechen).
- `targetLocales` – Array mit BCP-47-Gebietsschemas (z. B. `["de", "fr", "es"]`).
- `cacheDir` – Gemeinsames SQLite-Cache-Verzeichnis für alle Dokumentations-Pipelines (und Standard-Protokollverzeichnis für `--write-logs`).
- `documentations` – Array mit Dokumentationsblöcken. Jeder Block verfügt über optionale `description`, `contentPaths`, `outputDir`, optionale `jsonSource`, `markdownOutput`, optionale `segmentSplitting`, `translateFrontmatterFields`, `targetLocales`, `addFrontmatter` usw.
- `documentations[].description` – Optionale kurze Notiz für Maintainer (was dieser Block abdeckt). Falls gesetzt, erscheint sie in der `translate-docs`-Überschrift (`🌐 …: translating …`) und in den `status`-Abschnittsüberschriften.
- `documentations[].contentPaths` – Markdown/MDX-Quellverzeichnisse oder -Dateien (siehe auch `documentations[].jsonSource` für JSON-Bezeichnungen).
- `documentations[].outputDir` – Übersetztes Ausgabestammverzeichnis für diesen Block.
- `documentations[].markdownOutput.style` – `"nested"` (Standard), `"flat"`, `"doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"` (siehe [Ausgabe-Layouts](#output-layouts)).

**Primär vs. ergänzend**: Konzentrieren Sie den redaktionellen und Übersetzungsaufwand auf `contentPaths` – dieses Ergebnis ist die lokalisierte Dokumentation. `jsonSource` ist für Teams gedacht, die die **Docusaurus-Shell** lokalisieren; führen Sie `docusaurus write-translations` aus, wenn Sie Docusaurus aktualisieren oder Änderungen an Navigationsleiste, Fußzeile oder Theme-Texten vornehmen, damit die Quellkataloge im Ordner der Standardsprache aktuell bleiben. Sie können `features.translateJSON` auf `false` setzen, wenn Sie nur übersetzte Seiten benötigen und die UI-Texte anderweitig behandeln.

<a id="step-2-translate-documents"></a>
### Schritt 2: Dokumente übersetzen

```bash
npx ai-i18n-tools translate-docs
```

Dies übersetzt alle Dateien in jedem `documentations`-Blockes `contentPaths` in alle relevanten Dokumentationssprachen (Vereinigung der `targetLocales` jedes Blocks, falls gesetzt, andernfalls die Stamm-`targetLocales`). Bereits übersetzte Segmente werden aus dem SQLite-Cache bereitgestellt – nur neue oder geänderte Segmente werden an das LLM gesendet.

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

**Wenn Sie auf solche Validierungsfehler stoßen, vereinfachen Sie lieber den Quelltext** – teilen Sie den Absatz auf, verschieben Sie ein Beispiel in einen abgegrenzten Codeblock oder beschreiben Sie die gleiche Idee mit weniger verschachtelten Fett-/Code-Paaren – anstatt von jedem Modell und jeder Sprache zu erwarten, dass es dichte Inline-Markierungen perfekt reproduziert. An anderen Stellen auf dieser Seite (insbesondere in den Hinweisen zu Schritt 4 über `SOURCE_LOCALE`, Loader und `public/`-Pfade) ist die Formatierung bewusst realistisch gehalten; wenn Sie ähnliche Formulierungen in Ihren eigenen Dokumenten wiederverwenden, halten Sie sie bei breiter Übersetzung einfacher.

Um zu sehen, **welche Segmente fehlgeschlagen sind**, wie oft und die gespeicherten **Qualitäts- / Fehlermeldungen**, verwenden Sie den **Fehler**-Tab im Übersetzungs-Cache-Editor ([Übersetzungs-Cache-Editor → Fehler](#translation-cache-editor-failures)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### Cache-Verhalten und `translate-docs`-Flags

Die CLI führt **Datei-Tracking** in SQLite (Quell-Hash pro Datei × Lokalisation) und **Segment**-Einträge (Hash × Lokalisation pro übersetzbarer Einheit). Ein normaler Durchlauf überspringt eine Datei vollständig, wenn der verfolgte Hash mit der aktuellen Quelle übereinstimmt **und** die Ausgabedatei bereits existiert; andernfalls verarbeitet sie die Datei und nutzt den Segment-Cache, sodass unveränderter Text die API nicht aufruft.

| Flag                          | Wirkung                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(Standard)*                   | Überspringt unveränderte Dateien, wenn Tracking + vorhandene Ausgabe auf Datenträger übereinstimmen; verwendet Segment-Cache für den Rest.                                                                                                                                                                          |
| `-l, --locale <codes>`        | Durch Komma getrennte Ziel-Lokalisierungen (wenn weggelassen, entspricht dies der Vereinigung von Stamm-`targetLocales` und den optionalen `targetLocales` jedes `documentations[]`-Blocks).                                                                                                                                                          |
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

Im Lauf-Kopf wird außerdem `Batch prompt format: …` ausgegeben, sodass Sie den aktiven Modus überprüfen können. JSON-Label-Dateien (`jsonSource`) und SVG-Datei-Batches verwenden dieselbe Einstellung, wenn diese Schritte als Teil von `translate-docs` ausgeführt werden (oder in der Dokumentationsphase von `sync` – `sync` stellt diese Option nicht bereit; der Standardwert ist `json-array`).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Segment-Dedupe und Pfade in SQLite

- Segmentzeilen sind global nach `(source_hash, locale)` gekennzeichnet (Hash = normalisierter Inhalt). Identischer Text in zwei Dateien teilt sich eine Zeile; `translations.filepath` ist Metadaten (letzter Schreibender), kein zweiter Cache-Eintrag pro Datei.
- `file_tracking.filepath` verwendet namensraumbezogene Schlüssel: `doc-block:{index}:{relPath}` pro `documentations`-Block (`relPath` ist posix-Pfad relativ zum Projektstamm: gesammelte Markdown-Pfade; **JSON-Beschriftungsdateien verwenden den cwd-relativen Pfad zur Quelldatei**, z. B. `docs-site/i18n/en/code.json`, sodass Cleanup den echten Dateipfad auflösen kann) und `svg-files:{relPath}` für SVG-Dateien unter `translate-svg`.
- `translations.filepath` speichert cwd-relative posix-Pfade für Markdown-, JSON- und SVG-Segmente (SVG verwendet dieselbe Pfadstruktur wie andere Ressourcen; das Präfix `svg-files:…` existiert **nur** bei `file_tracking`).
- Nach einem Durchlauf wird `last_hit_at` nur für Segmentzeilen gelöscht, die **im selben Übersetzungsbereich** liegen (unter Berücksichtigung von `--path` und aktivierten Typen) und nicht verwendet wurden. Ein gefilterter oder nur-Dokumente-Durchlauf markiert also nicht verwandte Dateien nicht als veraltet.

<a id="output-layouts"></a>
### Ausgabe-Layouts

`"nested"` (Standard, wenn weggelassen) – spiegelt die Quellstruktur unter `{outputDir}/{locale}/` wider (z. B. `docs/guide.md` → `i18n/de/docs/guide.md`).

`"doc-system"` – Dokumentenbaum mit Sprachpräfix für statische Dokumentationsseiten. Dateien unter `docsRoot` werden nach `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` geschrieben. Pfade außerhalb von `docsRoot` fallen auf das geschachtelte Layout zurück. Legen Sie `documentations[].markdownOutput.docsRoot` auf Ihren englischen Quellstamm fest (z. B. `"docs"` oder `"src/content/docs"`). Wenn `style` auf `"doc-system"` steht, müssen Sie `localeSubpath` explizit setzen (verwenden Sie einen der unten stehenden Aliase für Voreinstellungen).

**Aliase** (gleicher Layout-Engine, voreingestellter `localeSubpath`):

- `"docusaurus"` – `localeSubpath` standardmäßig `docusaurus-plugin-content-docs/current` (Docusaurus-i18n-Plugin-Layout).
- `"astro-starlight"` – `localeSubpath` standardmäßig `""` (übersetzte Seiten direkt unter `{outputDir}/{locale}/`, entsprechend [Starlight](https://starlight.astro.build/guides/i18n/), wenn Englisch im Inhaltsstamm liegt und `outputDir` gleich `docsRoot` ist).

Docusaurus-Voreinstellung (primäre Dokumentationsseiten):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight-Voreinstellung (gleiche Blockstruktur, unterschiedliche Pfade):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

Optionale JSON-Beschriftungen – Docusaurus-Shell-Texte aus `jsonSource` (nicht MDX-Textkörper):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight liefert UI-Texte für viele Sprachen; optionale benutzerdefinierte UI-Überschreibungen verwenden `src/content/i18n/en.json` mit `jsonPathTemplate: "{outputDir}/{locale}.json"` in einem separaten `documentations[]`-Block, falls erforderlich.

`"flat"` – platziert übersetzte Dateien neben der Quelle mit einem Gebietsschemasuffix oder in einem Unterverzeichnis. Relative Links zwischen Seiten werden automatisch umgeschrieben.

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-in-flat-layout"></a>
#### Ankerlinks im flachen Layout

Die flache Ausgabe schreibt **relative Pfade** zwischen Seiten für jede Sprache um (`guide.md` → `guide.de.md`). **Ankerlinks** – die übliche Markdown-Inline-Form mit einem `#` nach dem Pfad – springen zu einem Abschnitt innerhalb der Zieldatei:

```markdown
Read the [installation checklist](../setup.md#first-run) before you deploy.
```

Hier ist das Link-Ziel `setup.md` und `#first-run` der Anker: Es sollte zum richtigen Überschriftenelement innerhalb dieser Datei scrollen.

**Warum Ankerlinks besondere Beachtung benötigen**

- `rewriteRelativeLinks` legt den **Dateinamen** für jede Sprache fest (`setup.md` → `setup.de.md`).
- Viele Renderer leiten den `#`-Slug aus dem **sichtbaren Überschriftentext** ab. Nach der Übersetzung unterscheiden sich die Überschriften je nach Sprache, sodass sich ein automatisch generierter Slug ändern kann, während der umgeschriebene Link möglicherweise immer noch `#first-run` enthält – oder Ihr englischer `#…`-Anker passt nicht mehr zum Slug, den der Renderer aus der übersetzten Überschrift erstellt.
- Ergebnis: Leser landen auf der richtigen **Datei**, aber an der **falschen Stelle**, oder der Browser findet keine passende Überschrift.

**Was Sie tun sollten**

1. Führen Sie `ai-i18n-tools write-heading-ids` auf Ihrer Quell-`.md` / `.mdx` aus, bevor Sie `translate-docs` durchführen (wie gewohnt mit derselben `documentations[]` / `contentPaths`). Dieses Tool fügt explizite HTML-Anker vor jeder Überschrift ein, sodass `id`-Werte von jeder übersetzten Version gemeinsam genutzt werden.
2. Verweisen Sie Ihre Markdown-**Ankerlinks** auf diese stabilen IDs, z. B. `[label](../other.md#section-id)`, wobei `section-id` genau der vom Tool gesetzte Anker sein muss – nicht nur eine Schätzung allein anhand der englischen Begriffe.

**Beispiel**

`docs/overview.md`:

```markdown
See [TLS setup](../security.md#tls-configuration) for certificate steps.
```

`docs/security.md` nach `write-heading-ids` (vereinfacht):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

Nach `translate-docs` bleiben Dateipfade und `#…`-Anker in jeder Sprachdatei synchron, zum Beispiel:

```markdown
Siehe [TLS-Einrichtung](../security.de.md#tls-configuration) für die Zertifikatsschritte.
```

Der `#tls-configuration`-Anker ist in allen Sprachversionen identisch, da die `id` in der Quelle festgelegt ist; nur der Überschrifts**text** und die Link**bezeichnung** werden übersetzt.

<a id="images-and-raster-assets-in-translated-docs"></a>
#### Bilder und Raster-Assets in übersetzten Dokumenten

`translate-docs` übersetzt Markdown-Segmente (einschließlich alternativer Bildtexte). Es kopiert **keine** Rasterdateien (PNG, JPEG, WebP, GIF) in Ihr Dokumentations-`outputDir`. Platzieren Sie die Dateien entweder dort, wohin die umgeschriebenen URLs verweisen, oder passen Sie die URLs nach der Übersetzung an (in der Regel mit `markdownOutput.postProcessing.regexAdjustments`).

**SVG** als illustrative Assets verwenden den `svg`-Block und `translate-svg` – siehe [`svg`](#svg). In `documentations[].contentPaths` aufgeführte Pfade betreffen Markdown/MDX (und optionale JSON-Labels), nicht die Übersetzung von SVG-Dateien.

**Warum das flache Layout oft eine Korrektur benötigt**

Bei Verwendung von `markdownOutput.style` `flat` und der standardmäßigen relativen Link-Umschreibung werden Links zwischen übersetzten Seiten je nach Sprachversion umgeschrieben. Links zu Nicht-Markdown-Dateien erhalten ein Tiefenpräfix, sodass sie relativ zu jeder Ausgabedatei bleiben (z. B. wird `figure.png` neben der Quelle zu `../figure.png` in der übersetzten Datei). Diese URL wird typischerweise nur **innerhalb** des Ausgabeverzeichnisses aufgelöst. Die CLI gibt die Binärdatei dort nicht aus, daher erhalten Leser eine Fehlermeldung, wenn die Assets nicht kopiert, anderswo bereitgestellt oder die Links nicht umgeschrieben werden. Hängen Sie Ihre Regeln nach der Übersetzung an: `postProcessing` wird nach der Segmentzusammenführung und der Umschreibung flacher Links ausgeführt (siehe Zeile `markdownOutput.postProcessing` in [Konfigurationsreferenz](#configuration-reference)).

**Muster 1 – Asset im selben Repository neben der englischen Quelle (dieses Paket)**

Dieses Repository übersetzt `docs/GETTING_STARTED.md` nach `translated-docs/docs/GETTING_STARTED.<locale>.md`. Die Quelle verwendet ein benachbartes Bild, `translation-cache-editor.png`. Die flache Umschreibung würde auf `translated-docs/translation-cache-editor.png` verweisen, was niemals geschrieben wird. Die Stamm-`ai-i18n-tools.config.json` fügt eine Regel hinzu, die auf den stabilen Endabschnitt des Markdown-Bildes passt (den `](…)`-URL-Segment, nicht den übersetzten Alternativtext) und zurück nach `docs/` verweist:

```json
{
  "description": "Editor screenshot: flat link rewrite points to translated-docs/; asset lives in docs/",
  "search": "\\]\\(\\.\\./translation-cache-editor\\.png\\)",
  "replace": "](../../docs/translation-cache-editor.png)"
}
```

**Muster 2 – Screenshot-Ordner pro Locale** (`examples/nextjs-app`)

Das Next.js-Beispiel verwendet zwei `documentations[]`-Blöcke in `examples/nextjs-app/ai-i18n-tools.config.json`.

- **Docusaurus-Dokumentation** (`markdownOutput.style` `docusaurus`): Englische Seiten unter `docs-site/docs/` verweisen auf Screenshots mit einem festen Sprachsegment in der URL, z. B. `/img/screenshots/en-GB/screenshot.png` in `feature-showcase.md`. Die Nachbearbeitung ersetzt dieses Segment, sodass jede übersetzte Seite unter `docs-site/i18n/<locale>/…/current/` auf ihren eigenen Ordner verweist:

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/en-GB/",
  "replace": "screenshots/${translatedLocale}/"
}
```

Stellen Sie passende PNGs im statischen Verzeichnis Ihrer Website bereit (z. B. `docs-site/static/img/screenshots/<locale>/` für URLs, die mit `/img/screenshots/` beginnen).

- **Root-README, flache Ausgabe** (zweiter `documentations[]`-Block in derselben Datei): nur `README.md` wird übersetzt, mit `markdownOutput.style` `flat` und `outputDir` `translated-docs`, sodass Sie `translated-docs/README.<locale>.md` erhalten. Bei englischen Bildern wird häufig ein stabiler Ordnerabschnitt in der Mitte des Pfads verwendet (z. B. `images/screenshots/en-GB/overview.png`). Während der Nachbearbeitung wird das einzelne Pfadsegment zwischen `images/screenshots/` und dem Rest der URL durch den aktiven `${translatedLocale}` ersetzt, sodass jede übersetzte README auf `images/screenshots/de/…`, `images/screenshots/fr/…` usw. verweist. Dieses Muster unterscheidet sich von der Docusaurus-Regel: Hier entspricht `search` **jedem** Ordnernamen (`[^/]+/`), nicht nur `en-GB/`.

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

Behalten Sie die PNG-Dateien auf dem Datenträger unter `images/screenshots/<locale>/` bei (gleiche Struktur, die die URLs nach der Umwandlung verwenden).

**Muster 3 – SVG-Datei** (`examples/nextjs-app`)

Das gleiche Beispiel aktiviert `features.translateSVG` und ordnet Quell-SVGs dem öffentlichen Ordner der Web-App zu:

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

Führen Sie `translate-svg` (oder `sync`) aus, sodass `images/*.svg` zu sprachspezifischen Ausgaben unter `public/assets/` wird. Markdown-Dateien verweisen separat auf diese URLs, unabhängig von `translate-docs`.

**Minimalbeispiel nur mit README** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` übersetzt `README.md` nach `translated-docs/` mit nur `postProcessing.languageListBlock`. Es definiert keine Bildregeln – geeignet, wenn das README keine benachbarten Rasterdateien enthält oder nur absolute URLs verwendet, die Ihr Host bereits bereitstellt.

Ersetzungsvorlagen unterstützen Platzhalter wie `${translatedLocale}` und `${translatedBasedir}` (vollständige Liste in der Zeile `markdownOutput.postProcessing.regexAdjustments` unter [Konfigurationsreferenz](#configuration-reference)).

<a id="markdown-output-path-template-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` Platzhalter

Legen Sie durch Festlegen von `documentations[].markdownOutput.pathTemplate` (für Markdown und MDX) oder `jsonPathTemplate` (für JSON-Label-Dateien) fest, wohin die übersetzten Dateien geschrieben werden. Beide akzeptieren dieselben Platzhalter. Aufgelöste Pfade müssen innerhalb des `outputDir` dieses Blocks bleiben (die CLI lehnt Pfade ab, die ihn verlassen).

Wenn Sie ein benutzerdefiniertes `pathTemplate` verwenden, wird `rewriteRelativeLinks` standardmäßig auf `false` gesetzt, es sei denn, Sie legen es explizit fest – das Umschreiben von Links im flachen Stil ist für das integrierte `flat`-Layout konzipiert.

| Platzhalter            | Rolle                                                                                                       | Beispiel                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | Absoluter aufgelöster Pfad des `outputDir`-Blocks dieser Dokumentation                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | Ziel-Sprachcode (gleiche Form wie in Konfiguration / CLI) | `de`, `pt-BR` |
| `{LOCALE}` | Dieselbe Sprache in Großbuchstaben | `DE`, `PT-BR` |
| `{relPath}` | Quelldateipfad relativ zur Projektwurzel, POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | Dateiname **ohne** Erweiterung | `guide` für `docs/guide.md` |
| `{basename}` | Dateiname **mit** Erweiterung | `guide.md` |
| `{extension}` | Erweiterung **einschließlich** des Punkts | `.md`, `.mdx` |
| `{docsRoot}` | Absoluter aufgelöster Pfad von `markdownOutput.docsRoot` (Standard ist `docs`, falls weggelassen) | `/home/acme/repo/docs` |
| `{relativeToDocsRoot}` | `{relPath}` mit entferntem `docsRoot`-Präfix, wenn sich die Pfadzeichenfolgen entsprechen (POSIX); andernfalls unverändert | `docs/guide.md` (üblich); `guide.md` nur, wenn das Entfernen angewendet wird |

**Beispiel**

Konfigurationsausschnitt:

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

Für das Gebietsschema `de` und die Quelle `docs/guide.md`, mit Projektstammverzeichnis `/home/acme/repo` und `outputDir`, das auf `/home/acme/repo/i18n` aufgelöst wird, lautet der erweiterte Pfad:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

Ein `flat`-artiges Muster, das nur den Dateinamen beibehält, könnte `{stem}` und `{extension}` verwenden, zum Beispiel `{outputDir}/{stem}.{locale}{extension}`, was unter dem aufgelösten `outputDir` den Wert `…/guide.de.md` ergibt.

---

<a id="combined-workflow-ui--docs"></a>
## Kombinierter Workflow (UI + Docs)

Aktivieren Sie alle Funktionen in einer einzigen Konfiguration, um beide Workflows zusammen auszuführen:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
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
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "markdownOutput": { "style": "flat" }
    }
  ]
}
```

`glossary.uiGlossary` verweist die Dokumentenübersetzung auf denselben `strings.json`-Katalog wie die UI, sodass die Terminologie konsistent bleibt; `glossary.userGlossary` fügt CSV-Überschreibungen für Produktbegriffe hinzu.

Führen Sie `npx ai-i18n-tools sync` aus, um eine Pipeline auszuführen: **Extrahieren** von UI-Texten (wenn `features.extractUIStrings`), **Übersetzen** der UI-Texte (wenn `features.translateUIStrings`), **Übersetzen von SVG-Dateien** (wenn `features.translateSVG` und ein `svg`-Block gesetzt sind) und anschließend **Übersetzen der Dokumentation** (jeder `documentations`-Block: Markdown/JSON wie konfiguriert). Teile mit `--no-ui`, `--no-svg` oder `--no-docs` überspringen. Der Dokumentationsschritt akzeptiert `--dry-run`, `-p` / `--path`, `--force` und `--force-update` (die letzten beiden gelten nur, wenn die Dokumentenübersetzung läuft; sie werden ignoriert, wenn Sie `--no-docs` übergeben).

Verwenden Sie `documentations[].targetLocales` in einem Block, um die Dateien dieses Blocks in eine **kleinere Teilmenge** als die UI zu übersetzen (effektive Dokumentationssprachen sind die **Vereinigung** über alle Blöcke):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docusaurus--flat"></a>
### Gemischter Dokumentations-Workflow (Docusaurus + flach)

Sie können mehrere Dokumentations-Pipelines in derselben Konfiguration kombinieren, indem Sie mehr als einen Eintrag in `documentations` hinzufügen. Dies ist eine übliche Einrichtung, wenn ein Projekt eine Docusaurus-Website und zusätzlich Markdown-Dateien auf Root-Ebene hat (z. B. ein Repository-Readme), die mit flachem Ausgabeformat übersetzt werden sollen.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README in flat output",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
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

So wird es mit `npx ai-i18n-tools sync` ausgeführt:

- UI-Zeichenfolgen werden aus `src/` nach `public/locales/` extrahiert/übersetzt.
- Der erste Dokumentationsblock übersetzt **Markdown** aus `docs-site/docs/` nach `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (lokalisierte Dokumentationsseiten).
- Mit `features.translateJSON` und `jsonSource` übersetzt derselbe Block auch **Docusaurus-Shell-JSON** unter `docs-site/i18n/en/` in jeden Zielgebietsschemordner – Navbar, Footer und Theme/Plugin-Kataloge, nicht jedoch MDX-Seiteninhalt.
- Der zweite Dokumentationsblock übersetzt `README.md` in flache, gebietsschemasuffigierte Dateien unter `translated-docs/`.
- Alle Dokumentationsblöcke nutzen `cacheDir` gemeinsam, sodass unveränderte Segmente zwischen den Durchläufen wiederverwendet werden, um API-Aufrufe und Kosten zu reduzieren.

---

<a id="translation-cache-editor"></a>
## Übersetzungs-Cache-Editor

Ausführen:

```bash
ai-i18n-tools editor
# Optional: choose port, do not auto-open browser
# ai-i18n-tools editor -p 8765 --no-open
```

Dies startet eine lokale Web-Oberfläche, die auf Ihrer konfigurierten `cacheDir` SQLite-Datenbank basiert – denselben Ordner, den die CLI für Dokumentationssegmente, Protokolle und verwandte Metadaten verwendet. Enthalten sind die Registerkarten **Dokumentation** (zwischengespeicherte Dokumentationssegmente), **UI-Zeichenketten**, **UI-Pluralformen**, **Glossar**, **Fehler**, **Markdown-Probleme** und **Statistiken**.

![Translation Cache Editor](../../docs/translation-cache-editor.png)

Wenn Sie **Cache-Zeilen** in dieser App bearbeiten (z. B. Dokumentationsabschnitte), führen Sie `sync --force-update` oder den entsprechenden Übersetzungsbefehl mit `--force-update` aus, damit die Ausgaben auf der Festplatte mit dem Cache übereinstimmen. Wenn sich später der **Quelltext** im Repository ändert, ändern sich die Segment-Hashes und manuelle Bearbeitungen des alten Textes werden überschrieben.

<a id="translation-cache-editor-failures"></a>
### Fehler (Dokumentationsübersetzung)

Die Registerkarte **Fehler** dient ausschließlich der **Dokumentations**übersetzung. Sie liest Fehlerdatensätze aus der SQLite-Datenbank, die geschrieben werden, wenn ein Segment nicht erfolgreich für ein Gebietsschema übersetzt werden konnte – beispielsweise leere oder ungültige Modellausgaben, Validierungsfehler nach der Übersetzung (`AST mismatch`, Platzhalterlecks und ähnliche **Qualitäts**prüfungen) oder eine **fatale** Bedingung, die den Fortschritt blockiert hat. Sie hilft Ihnen dabei, folgende Frage zu beantworten: *Welches Quellsegment ist fehlgeschlagen, für welches Gebietsschema und welches Modell, und welcher Fehlertext wurde aufgezeichnet?*

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

1. Öffnen Sie **Fehler** im Editor (derselbe Browsersitz wie beim [Übersetzungscache-Editor](#translation-cache-editor)).
2. Lesen Sie den **Zusammenfassungs**balken (Segmente mit einem Fehler sowie Anzahlen für Segmente mit **1**, **2** oder **3+** Fehlerdatensätzen).
3. Filtern Sie nach Teil-**Dateinamen**, **Gebietsschema**, **Modell**, **Qualitätsfehler** (Werte stammen aus Ihrem Cache), **nur fatale Fehler** und optional nach **Quell-Hash**, **Quelltext** oder **Fehlermeldungs**teilstring – klicken Sie dann auf **Übernehmen**.
4. Wählen Sie **Sortierung: # Fehler** (Standard) oder **Sortierung: Dateipfad + Zeilennummer**.
5. Verwenden Sie die Paginierung oben oder unten in der Tabelle. **Klicken Sie auf eine Zeile**, um den vollständigen Quelltext anzuzeigen. Die Linksteuerung in der Zeile (falls aktiviert) fordert den Serverprozess auf, Datei-/Zeilenhinweise im **Terminal** zu protokollieren, in dem `ai-i18n-tools editor` ausgeführt wird – nützlich, um vom Browser direkt in Ihren Editor zu springen.
6. Beheben Sie die **Quelldatei** in Ihrem Projekt und führen Sie anschließend erneut `translate-docs` oder `sync` aus. Wenn die Liste nach einem erfolgreichen Durchlauf **veraltet** erscheint, führen Sie `ai-i18n-tools sync --force-update` aus und laden Sie den Editor neu (der Fehlerbereich zeigt denselben Hinweis an).

Für die dateibasierte Fehlersuche parallel zur Benutzeroberfläche können Sie weiterhin `translate-docs --debug-failed` verwenden, um `FAILED-TRANSLATION`-Details unter `cacheDir` während Wiederholungen zu schreiben – siehe [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags).

<a id="markdown-issues-static-checks"></a>
### Markdown-Probleme (statische Prüfungen)

Die Registerkarte **Markdown-Probleme** listet Zeilen aus der `markdown_source_issues` SQLite-Tabelle auf. Jede Zeile ist ein **vor der Übersetzung** erkanntes Problem: beispielsweise aufeinanderfolgende Delimiter, die unter denselben CommonMark-ähnlichen Regeln, die `translate-docs` zur Maskierung verwendet, niemals als Hervorhebung/Durchstreichung gepaart werden, ein Inline-Code-Abschnitt, der mit Backticks geöffnet, aber nie geschlossen wird, `STRONG_OUTSIDE_INLINE_CODE`, wenn `**` / `__` einen `` `...` ``-Abschnitt umschließen (setzen Sie die Hervorhebung innerhalb der Backticks oder verwenden Sie einfachen Code), oder `STRONG_OUTSIDE_LINK`, wenn `**` / `__` einen `[text](../url)`-Link umschließen (setzen Sie Fettschrift nur innerhalb des Linktexts). Dies ist **nicht** dasselbe wie **Fehler**, die pro-Locale-Modellergebnisse und Probleme bei der Validierung nach der Übersetzung aufzeichnen (`AST mismatch`, Platzhalter-Durchsickern und Ähnliches).

Verwenden Sie diese Registerkarte, um **Quell-Markdown** zu korrigieren, bevor Sie Token verbrauchen – insbesondere wenn Qualitätsprüfungen aufgrund der Struktur immer wieder fehlschlagen. Filtern Sie nach Dateipfad (Teilübereinstimmung mit dem Cache-Schlüssel, einschließlich `doc-block:{index}:`-Präfixen), **Fehlercode** oder **Quell-Hash**; sortieren Sie nach Dateipfad + Zeile oder nach neuestem Scan-Zeitpunkt. Die Link-Schaltfläche protokolliert Datei-/Zeilen-Hinweise in der Terminalinstanz, in der `ai-i18n-tools editor` ausgeführt wird (ähnlich wie bei der Registerkarte Dokumentation).

**Zeilen aktualisieren:** führen Sie `ai-i18n-tools check-markdown` aus (optional `-p` / `--path` Bereich, `--no-cache` zum Überspringen von SQLite, `--json` für maschinenlesbare Ausgabe auf stdout mit menschenlesbaren Zeilen auf stderr). Standardmäßig führt die Ausführung jeder `translate-docs` Markdown-Datei erneut ein erneutes Scannen und Ersetzen der Zeilen für diese Datei durch, wenn `documentations[].warnMarkdownSourceIssues` nicht auf `false` gesetzt ist. Das Löschen aller Übersetzungen für einen Cache-Dateipfad entfernt im Rahmen desselben Bereinigungspfads wie bei Fehlern auch die Markdown-Problemzeilen für diesen Dateipfad.

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

- Das Manifest außerhalb von `ui.flatOutputDir` liegt und Sie die CLI explizit darauf verweisen müssen.
- Sie möchten, dass `markdownOutput.postProcessing.languageListBlock` Gebietsschema-Bezeichnungen aus dem Manifest erstellt.
- `extract` `englishName`-Einträge aus dem Manifest in `strings.json` zusammenführt (erfordert `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

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

Diese Liste wurde **hinsichtlich einer breiten Abdeckung verschiedener Sprachen getestet** (z. B. im **April 2026** bei der Übersetzung von **36** Ziel-Sprachen in einem umfangreichen Dokumentationsprojekt); sie dient als praktischer Standard, ist jedoch nicht für jede Sprache garantiert optimal.

Beispiel `translationModels` (gleiche Standardeinstellungen wie `npx ai-i18n-tools init`):

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
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
]
```

Legen Sie `OPENROUTER_API_KEY` in Ihrer Umgebung oder in der `.env`-Datei fest.

Bevor Sie `translationModels` ändern, führen Sie `npx ai-i18n-tools check-models` aus, um jede konfigurierte Modell-ID mit dem Live-Katalog von OpenRouter (`GET /models`) zu überprüfen. Es meldet IDs, die fehlen oder abgelaufen sind `expiration_date`, listet gültige Modelle mit geschätzten Ein-/Ausgabepreisen (USD pro 1M Tokens) auf und beendet sich mit einem nicht-null Status, wenn eine konfigurierte ID ungültig ist. Erfordert `OPENROUTER_API_KEY`.

<a id="features"></a>
### `features`

| Feld                | Workflow | Beschreibung                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | Quelle nach `t("…")` / `i18n.t("…")` durchsuchen, optionale `package.json`-Beschreibung und (falls aktiviert) `ui-languages.json` `englishName`-Werte in `strings.json` zusammenführen. |
| `translateUIStrings` | 1        | `strings.json`-Einträge übersetzen und JSON-Dateien je Sprache schreiben.                                                                                                  |
| `translateMarkdown`  | 2        | Übersetze `.md` / `.mdx`-Dateien (flach oder Docusaurus-Dokumente).                                                                                                                                   |
| `translateJSON`      | 2        | Docusaurus-Label-JSON aus `docusaurus write-translations` (Theme/Navigation/Footer/Plugin-UI), **nicht** Markdown-Seiteninhalte.                                             |
| `translateSVG`       | 2        | Übersetzen Sie `.svg`-Dateien (erfordert den `svg`-Block auf oberster Ebene).                                                                                                       |

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
- `reactExtractor.funcNames`  
  Zusätzliche zu scannende Funktionsnamen (Standard: `["t", "i18n.t"]`).
- `reactExtractor.extensions`  
  Einzuschließende Dateierweiterungen (Standard: `[".js", ".jsx", ".ts", ".tsx"]`).
- `reactExtractor.includePackageDescription`  
  Wenn `true` (Standard), fügt `extract` auch `package.json` `description` als UI-Zeichenfolge hinzu, falls vorhanden.
- `reactExtractor.packageJsonPath`  
  Benutzerdefinierter Pfad zur `package.json`-Datei, die für die optionale Beschreibungsextraktion verwendet wird.
- `reactExtractor.includeUiLanguageEnglishNames`

Wenn `true` (Standard `false`), fügt `extract` auch jedes `englishName` aus dem Manifest unter `uiLanguagesPath` zu `strings.json` hinzu, sofern es nicht bereits aus dem Quellenscan vorhanden ist (gleiche Hash-Schlüssel). Erfordert `uiLanguagesPath`, das auf eine gültige `ui-languages.json` verweist.

| Feld         | Beschreibung                                               |
|---------------|-----------------------------------------------------------|
| `sourceRoots` | Verzeichnisse oder Glob-Muster (relativ zu cwd), die nach `t("…")`-Aufrufen durchsucht werden. |
| `stringsJson` | Pfad zur Master-Katalogdatei. Wird von `extract` aktualisiert.    |

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite-Cache-Verzeichnis (gemeinsam genutzt von allen `documentations`-Blöcken). Wird zwischen Ausführungen wiederverwendet. Wenn Sie von einem benutzerdefinierten Dokumentations-Übersetzungscache migrieren, archivieren oder löschen Sie diesen — `cacheDir` erstellt eine eigene SQLite-Datenbank und ist nicht mit anderen Schemata kompatibel.

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

<a id="documentations"></a>
### `documentations`

Array von Dokumentations-Pipeline-Blöcken. `translate-docs` und die Docs-Phase von `sync` **verarbeiten jeden** Block der Reihe nach.

- `description`
Optionale, für Menschen lesbare Notiz für diesen Block (nicht für die Übersetzung verwendet). Wird im `translate-docs` `🌐`-Überschrift angezeigt, wenn gesetzt; wird auch in den `status`-Abschnittsüberschriften angezeigt.
- `contentPaths`
Markdown/MDX-Seiteninhalte, die übersetzt werden sollen (`translate-docs` durchsucht diese nach `.md` / `.mdx`). Unterstützt **Verzeichnispfade oder Glob-Muster** (z. B. `"docs/**/*.md"`, `"guides/*.mdx"`). Das ist, wo die lokalisierten Dokumentationsprosa herkommt.
- `outputDir`
Stammverzeichnis für die übersetzten Ausgaben für diesen Block.
- `sourceFiles`
Optionaler Alias, der beim Laden in `contentPaths` zusammengeführt wird.
- `targetLocales`
Optionale Untermenge von Sprachen nur für diesen Block (sonst die Stamm-`targetLocales`). Die effektiven Dokumentationssprachen ergeben sich aus der Vereinigung über alle Blöcke.
- `jsonSource`
Optional. Quellverzeichnis für Docusaurus-JSON-Bezeichnungskataloge für diesen Block (z. B. `"i18n/en"` aus `docusaurus write-translations`). Seiteninhalte stammen immer aus `contentPaths`; `jsonSource` liefert nur Shell-/UI-JSON, nicht MDX.
- `markdownOutput.style`
`"nested"` (Standard), `"flat"`, `"doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"`.
- `markdownOutput.localeSubpath`
Pfadsegment zwischen `{locale}/` und `{relativeToDocsRoot}` für `doc-system` (erforderlich bei direkter Verwendung von `style: "doc-system"`; voreingestellt bei Verwendung eines Alias). Verwenden Sie `""` für Starlight-artige Sprachordner.
- `markdownOutput.docsRoot`
Quell-Dokumentationsstamm für Docusaurus-Layout (z. B. `"docs"`).
- `markdownOutput.pathTemplate`
Benutzerdefinierter Markdown-Ausgabepfad. Platzhalter: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `markdownOutput.jsonPathTemplate`
Benutzerdefinierter JSON-Ausgabepfad für Bezeichnungsdateien. Unterstützt dieselben Platzhalter wie `pathTemplate`.
- `markdownOutput.flatPreserveRelativeDir`
Bei `flat`-Stil Quellunterverzeichnisse beibehalten, damit Dateien mit gleichem Basisnamen nicht kollidieren.
- `markdownOutput.rewriteRelativeLinks`
Relative Links nach der Übersetzung neu schreiben (automatisch aktiviert für `flat`-Stil).
- `markdownOutput.linkRewriteDocsRoot`
Das Repository-Stammverzeichnis wird zur Berechnung der Präfixe für flache Links verwendet. Lassen Sie dies in der Regel auf `"."`, es sei denn, Ihre übersetzten Dokumente befinden sich unter einer anderen Projektwurzel.
- `markdownOutput.postProcessing`
Optionale Transformationen auf dem übersetzten **Markdown-Text** (YAML-Schlüssel und nicht-prosaische Front-Matter-Werte bleiben erhalten). Wird ausgeführt nach der Segmentzusammenfügung und dem erneuten Schreiben flacher Links, und vor `addFrontmatter`.
- `translateFrontmatterFields`
Auf derselben Ebene wie `markdownOutput` (pro `documentations[]`-Block). Standardmäßig `true`: übersetze benutzerorientierte YAML-Prosa für Starlight/Docusaurus (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next`-Labels). Setzen Sie `false`, um den gesamten Front-Matter-Block unverändert zu lassen; übergeben Sie ein String-Array, um dies auf bestimmte Punkt-Pfade einzuschränken.
- `segmentSplitting`
Auf derselben Ebene wie `markdownOutput` (pro `documentations[]`-Block). Optionale feinere Segmentierung für die `translate-docs`-Extraktion: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. Wenn `enabled` auf `true` steht (Standard, wenn `segmentSplitting` weggelassen wird), werden dichte Absätze, GFM-Pipe-Tabellen (erster Teil enthält Kopfzeile, Trennzeile und erste Datenzeile) und lange Listen aufgeteilt; Teilabschnitte werden mit einfachen Zeilenumbrüchen wieder zusammengefügt (`tightJoinPrevious`). Setzen Sie `"enabled": false`, um nur ein Segment pro durch Leerzeilen getrenntem Textblock zu verwenden.
- `warnMarkdownSourceIssues`
Wenn `true` (Standard, wenn weggelassen), durchsucht jeder `translate-docs`-Lauf die Markdown-Segmente erneut nach riskanten Trennzeichen / nicht geschlossenen Inline-Codes, gibt Warnungen im Terminal aus und ersetzt die `markdown_source_issues`-Zeilen für den Cache-Dateipfad dieser Datei. Setzen Sie `false`, um Warnungen und SQLite-Aktualisierungen für diesen Block zu überspringen.
- `markdownOutput.postProcessing.regexAdjustments`
Geordnete Liste von `{ "description"?, "search", "replace" }`. `search` ist ein Regex-Muster (einfache Zeichenfolge verwendet Flag `g` oder `/pattern/flags`). `replace` unterstützt Platzhalter wie `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
- `markdownOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label" }` — der Übersetzer sucht nach der ersten Zeile, die `start` enthält, und der passenden `end`-Zeile und ersetzt diesen Bereich durch einen kanonischen Sprachwechsler. `label` steuert die Quelle der Bezeichnungen im Manifest: `"local"` (Standard, verwendet `ui-languages.json` `label`) oder `"english"` (verwendet `englishName`). Links werden mit Pfaden relativ zur übersetzten Datei erstellt; wenn kein Manifest konfiguriert ist, stammen die Bezeichnungen aus `localeDisplayNames` und den Gebietsschemacodes.
- `addFrontmatter`
Wenn `true` (Standard, wenn weggelassen), enthalten übersetzte Markdown-Dateien YAML-Schlüssel: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path` und, wenn mindestens ein Segment über Modell-Metadaten verfügt, `translation_models` (sortierte Liste der verwendeten OpenRouter-Modell-IDs). Auf `false` setzen, um dies zu überspringen.

<br/>

**Beispiel (flache README-Pipeline — Pfade für Screenshots + optionaler Wrapper für Sprachliste):**

```json
"markdownOutput": {
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

<a id="svg"></a>
### `svg`

Pfade und Layout auf oberster Ebene für SVG-Dateien. Die Übersetzung wird nur ausgeführt, wenn `features.translateSVG` wahr ist (über `translate-svg` oder die SVG-Phase von `sync`).

| Feld                         | Beschreibung                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | Ein oder mehrere Verzeichnisse **oder Glob-Muster** (z. B. `"images/*.svg"`, `"**/icons/*.svg"`). Die Muster werden relativ zum Projektstamm aufgelöst und rekursiv nach `.svg`-Dateien durchsucht.                                                                                       |
| `outputDir`                   | Stammverzeichnis für die übersetzte SVG-Ausgabe.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` oder `"nested"`, wenn `pathTemplate` nicht gesetzt ist.                                                                                                                                                                                                                               |
| `pathTemplate`                | Benutzerdefinierter SVG-Ausgabepfad. Platzhalter: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
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

- `version`
CLI-Version und Build-Zeitstempel ausgeben (dieselben Informationen wie `-V` / `--version` im Hauptprogramm).

- `init [-t ui-markdown\|ui-docusaurus\|ui-starlight] [-o path] [--with-translate-ignore]`
Erstellt eine Beispielkonfigurationsdatei (enthält `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` und `documentations[].addFrontmatter`). `--with-translate-ignore` erstellt eine Beispiel-`.translate-ignore`.

- `check-models`
Jede konfigurierte OpenRouter-Modell-ID gegenüber `GET /models` überprüfen (Katalogzugehörigkeit, `expiration_date`, USD pro 1 Mio. Tokens für Prompt/Completion). Erfordert `OPENROUTER_API_KEY`. Beendet mit Fehlercode, wenn eine konfigurierte ID fehlt oder abgelaufen ist. Berücksichtigt `openrouter.requestTimeoutMs` für die Kataloganfrage.

- `extract`
`strings.json` aus `t("…")` / `i18n.t("…")`-Literalen, optionaler `package.json`-Beschreibung und optionalen Manifest-`englishName`-Einträgen aktualisieren (siehe `ui.reactExtractor`). Erfordert `features.extractUIStrings`.

- `generate-ui-languages [--master <path>] [--dry-run]`
`ui-languages.json` nach `ui.flatOutputDir` (oder `uiLanguagesPath`, falls gesetzt) mit `sourceLocale` + `targetLocales` und dem gebündelten `data/ui-languages-complete.json` (oder `--master`) schreiben. Gibt Warnungen aus und fügt `TODO`-Platzhalter für Locales ein, die in der Master-Datei fehlen. Falls Sie ein bestehendes Manifest mit angepassten `label`- oder `englishName`-Werten haben, werden diese durch die Standardwerte aus dem Masterkatalog ersetzt – prüfen und danach anpassen Sie die generierte Datei.

- `translate-docs …`
Markdown/MDX und JSON für jeden `documentations`-Block übersetzen (`contentPaths`, optional `jsonSource`). `-j`: maximale parallele Locales; `-b`: maximale parallele Batch-API-Aufrufe pro Datei. `--prompt-format`: Batch-Übertragungsformat (`xml` \| `json-array` \| `json-object`). Siehe [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags) und [Batch-Prompt-Format](#batch-prompt-format).

- `write-heading-ids …`
**Keine API.** Erfordert mindestens einen `documentations[]`-Block. Sammelt `.md` / `.mdx` unter dem jeweiligen `contentPaths` jedes Blocks (beachtet `.translate-ignore`). Fügt eine HTML-Ankerzeile `<a id="slug"></a>` unmittelbar **vor** jede flache ATX-`#`-Überschrift ein (überspringt Überschriften in umschlossenen Codeblöcken). `-p` / `--path` oder `-f` / `--file`: Beschränkung auf eine projektrelative Datei oder ein Verzeichnis. `--slug-style`: `github` (Standard; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Mit `pymdown` optional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run`: Zeigt nur Änderungen an.

- `strip-md-bold-inline …`
**Keine API.** Erfordert mindestens einen `documentations[]`-Block. Entfernt `**` um Inline-Code in `.md` / `.mdx` unterhalb des `contentPaths` jedes Blocks (beachtet `.translate-ignore`). `-p` / `--path` oder `-f` / `--file`, `--dry-run`, `--no-backup` (überspringt zeitgestempelte `.backup.*` vor dem Überschreiben).

- `check-markdown …`
**Keine API.** Durchsucht Markdown/MDX unter dem jeweiligen `contentPaths` jedes `documentations[]`-Blocks (gleiche Auffindung wie bei `translate-docs`, beachtet `.translate-ignore`): Paarung von Trennzeichen, nicht geschlossener Inline-Code sowie `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK`, wenn `**`/`__` einen `` `...` ``-Textbereich oder einen `[text](../url)`-Link umschließen. `-p` / `--path` oder `-f` / `--file`: optionale Begrenzung. Gibt `relativePath:line: [ISSUE_CODE] message`-Zeilen auf **stderr** aus; Exit-Code **1**, falls Probleme auftreten. `--json`: JSON-Bericht auf **stdout**. Schreibt `markdown_source_issues` in `cacheDir`, es sei denn `--no-cache` ist gesetzt. `-v` fügt Quell-Hashes zu den stderr-Zeilen hinzu.

- `translate-svg …`
Übersetzt SVG-Dateien, die in `config.svg` konfiguriert sind (getrennt von Dokumentation). Erfordert `features.translateSVG`. Gleiche Cache-Strategien wie bei Dokumentation; unterstützt `--no-cache` zum Überspringen von SQLite-Lese-/Schreibvorgängen für diesen Durchlauf. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.

- `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`
Übersetzt nur UI-Texte. `--force`: übersetzt alle Einträge pro Sprachumgebung erneut (ignoriert vorhandene Übersetzungen). `--dry-run`: keine Schreibvorgänge, keine API-Aufrufe. `-j`: maximale Anzahl paralleler Sprachumgebungen. Erfordert `features.translateUIStrings`.

- `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`
Führt `extract` **zuerst** aus (erfordert `features.extractUIStrings`), sodass `strings.json` mit der Quelle übereinstimmt, anschließend Überprüfung der **Quelltext-Übersetzungen** durch ein KI-Modell (Rechtschreibung, Grammatik). **Terminologiehinweise** stammen ausschließlich aus der `glossary.userGlossary`-CSV-Datei (gleicher Geltungsbereich wie `translate-ui` – nicht `strings.json` / `uiGlossary`, damit fehlerhafte Texte nicht als Glossar festgeschrieben werden). Verwendet OpenRouter (`OPENROUTER_API_KEY`). Nur beratende Funktion (gibt Exit-Code **0** nach Abschluss zurück). Erstellt `lint-source-results_<timestamp>.log` unter `cacheDir` als **menschlich lesbaren** Bericht (Zusammenfassung, Probleme und pro Zeichenkette **OK**-Einträge); im Terminal werden nur Zusammenfassungszahlen und Probleme angezeigt (keine `[ok]`-Zeilen pro Zeichenkette). Gibt den Dateinamen des Protokolls in der letzten Zeile aus. `--json`: vollständiger maschinenlesbarer JSON-Bericht ausschließlich auf stdout (Protokolldatei bleibt menschlich lesbar). `--dry-run`: führt weiterhin `extract` aus, gibt dann nur den Batch-Plan aus (keine API-Aufrufe). `--chunk`: Anzahl Zeichenketten pro API-Batch (Standardwert **50**). `-j`: maximale Anzahl paralleler Batches (Standardwert `concurrency`). Mit `--json` geht die menschenlesbare Ausgabe an stderr. Links verwenden `path:line`, wie die Schaltfläche „link“ in den `editor`-UI-Zeichenketten.

- `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`
Exportiert `strings.json` nach XLIFF 2.0 (eine `.xliff` pro Zielsprache). `-o` / `--output-dir`: Ausgabeverzeichnis (Standard: derselbe Ordner wie der Katalog). `--untranslated-only`: nur Einheiten ohne Übersetzung für diese Sprache. Nur-Lesezugriff; keine API.

- `sync …`
Extrahiert (falls aktiviert), dann UI-Übersetzung, dann `translate-svg`, wenn `features.translateSVG` und `config.svg` gesetzt sind, dann Dokumentationsübersetzung — es sei denn, sie wird mit `--no-ui`, `--no-svg` oder `--no-docs` übersprungen. Gemeinsame Flags: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (nur für Dokumentations-Batching), `--force` / `--force-update` (nur Dokumentation; sich gegenseitig ausschließend, wenn Dokumentation läuft). Die Dokumentationsphase leitet auch `--emphasis-placeholders` und `--debug-failed` weiter (gleiche Bedeutung wie bei `translate-docs`). `--prompt-format` ist kein `sync`-Flag; der Dokumentationsschritt nutzt den integrierten Standard (`json-array`).

- `status [--max-columns <n>]`
Wenn `features.translateUIStrings` aktiviert ist, gibt die UI-Abdeckung pro Sprachumgebung aus (`Translated` / `Missing` / `Total`). Danach wird der Markdown-Übersetzungsstatus pro Datei × Sprachumgebung ausgegeben (kein `--locale`-Filter; Sprachumgebungen stammen aus der Konfiguration). Große Sprachlisten werden in wiederholte Tabellen mit bis zu `n` Sprachspalten (Standard **9**) aufgeteilt, damit die Zeilen im Terminal schmal bleiben.

- `statistics [--max-columns <n>]`
Gibt Dokumentations-Cache und `strings.json`-Statistiken aus (gleiche Aggregate wie im Übersetzungscache-Editor → **Statistiken**). `--max-columns`: maximale Anzahl von Gebietsschema-Spalten pro Modell × Gebietsschema-Tabelle (Standard entspricht dem Editor).

- `cleanup [--dry-run] [--no-backup] [--backup <path>]`
Führt zuerst `sync --force-update` aus (Extraktion, UI, SVG, Dokumente), entfernt dann veraltete Segmentzeilen (null `last_hit_at` / leere Dateipfade); löscht `file_tracking`-Zeilen, deren aufgelöster Quellpfad auf dem Datenträger fehlt; entfernt Übersetzungszeilen, deren `filepath`-Metadaten auf eine fehlende Datei verweisen. Protokolliert drei Zähler (veraltet, verwaiste `file_tracking`, verwaiste Übersetzungen). Erstellt eine zeitgestempelte SQLite-Sicherung im Cache-Verzeichnis, es sei denn, `--no-backup` ist gesetzt.

- `clean-temp [-r|--root <path>] [-f|--force] [--dry-run]`
**Keine Konfiguration.** Durchsucht einen Verzeichnisbaum (Standard: cwd) nach `*.log` und `cache.db.backup*.sqlite`, gibt `./…`-Pfade aus wie `find -print`. Bei Treffern: fragt `Delete these files? (y/n)` ab, es sei denn, `-f` / `--force` ist gesetzt (löscht ohne Nachfrage). Bei keiner Übereinstimmung: beendet sich ohne Nachfrage. `--dry-run`: nur auflisten, keine Nachfrage oder Löschungen (überschreibt `--force`).

- `editor [-p <port>] [--no-open]`
Startet einen lokalen Web-Editor für den Cache, `strings.json` und die Glossar-CSV-Datei. Mit `--no-open` wird der Standardbrowser nicht automatisch geöffnet.  
**Hinweis:** Wenn Sie einen Eintrag im Cache-Editor bearbeiten, müssen Sie einen `sync --force-update` ausführen, um die Ausgabedateien mit dem aktualisierten Cache-Eintrag neu zu schreiben. Außerdem geht die manuelle Bearbeitung verloren, wenn sich der Quelltext später ändert, da ein neuer Cache-Schlüssel generiert wird.

- `glossary-generate [-o <path>]`
Erstellt eine leere `glossary-user.csv`-Vorlage. `-o`: überschreibt den Ausgabepfad (Standard: `glossary.userGlossary` aus der Konfiguration oder `glossary-user.csv`).

Alle Befehle akzeptieren `-c <path>`, um eine abweichende Konfigurationsdatei anzugeben, `-v` für ausführliche Ausgabe und `-w` / `--write-logs [path]`, um die Konsolenausgabe zusätzlich in eine Protokolldatei umzuleiten (Standardpfad: im Stammverzeichnis `cacheDir`).

Das Hauptprogramm unterstützt außerdem `-V` / `--version` und `-h` / `--help`; `ai-i18n-tools help [command]` zeigt dieselbe nutzergesteuerte Nutzung pro Befehl wie `ai-i18n-tools <command> --help` an.

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
