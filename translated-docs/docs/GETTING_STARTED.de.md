<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: Erste Schritte

`ai-i18n-tools` bietet zwei unabhängige, kombinierbare Workflows:

- **Workflow 1 – UI-Übersetzung**: Extrahieren Sie `t("…")`-Aufrufe aus jeder JS/TS-Quelle, übersetzen Sie sie über OpenRouter und schreiben Sie flache, sprachspezifische JSON-Dateien, die für i18next bereitstehen.
- **Workflow 2 – Dokumentenübersetzung**: Übersetzen Sie Markdown (MDX) und Docusaurus-JSON-Beschriftungsdateien in beliebig viele Sprachen mit intelligenter Zwischenspeicherung. **SVG**-Ressourcen verwenden `features.translateSVG`, den obersten `svg`-Block und `translate-svg` (siehe [CLI-Referenz](#cli-reference)).

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
    - [`pathTemplate` / `jsonPathTemplate`-Platzhalter](#pathtemplate--jsonpathtemplate-placeholders)
- [Kombinierter Workflow (UI + Docs)](#combined-workflow-ui--docs)
  - [Gemischter Dokumentationsworkflow (Docusaurus + flach)](#mixed-documentation-workflow-docusaurus--flat)
- [Übersetzungs-Cache-Editor](#translation-cache-editor)
  - [Fehler (Dokumentenübersetzung)](#failures-document-translation)
    - [Wann er verwendet werden sollte](#when-to-use-it)
    - [Warum Quelltextänderungen wichtig sind](#why-source-edits-matter)
    - [Verwendung des Tabs](#how-to-use-the-tab)
- [Konfigurationsreferenz](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (optional)](#uilanguagespath-optional)
  - [`concurrency` (optional)](#concurrency-optional)
  - [`batchConcurrency` (optional)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (optional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg` (optional)](#svg-optional)
  - [`glossary`](#glossary)
- [CLI-Referenz](#cli-reference)
- [Umgebungsvariablen](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## Installation

Das veröffentlichte Paket ist ausschließlich **ESM**. Verwenden Sie `import`/`import()` in Node.js oder Ihrem Bundler; verwenden Sie nicht `require('ai-i18n-tools')`.

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

Die Standardvorlage `init` (`ui-markdown`) aktiviert nur die **UI**-Extraktion und -Übersetzung. Die `ui-docusaurus`-Vorlage aktiviert die **Dokumenten**-Übersetzung (`translate-docs`). Verwenden Sie `sync`, wenn Sie einen Befehl wünschen, der Extraktion, UI-Übersetzung, optionale eigenständige SVG-Übersetzung und Dokumentenübersetzung gemäß Ihrer Konfiguration ausführt.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### Empfohlene `package.json`-Skripte

Bei lokaler Installation des Pakets können Sie die CLI-Befehle direkt in Skripten verwenden (kein `npx` erforderlich):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-ui && ai-i18n-tools translate-svg && ai-i18n-tools translate-docs",
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

- `sourceLocale` – Ihr BCP-47-Sprachcode für die Ausgangssprache (z. B. `"en-GB"`). **Muss übereinstimmen** mit `SOURCE_LOCALE`, das aus Ihrer Laufzeit-i18n-Konfigurationsdatei exportiert wird (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` – Array aus BCP-47-Codes für Ihre Zielsprachen (z. B. `["de", "fr", "pt-BR"]`). Führen Sie `generate-ui-languages` aus, um das `ui-languages.json`-Manifest aus dieser Liste zu erstellen.
- `ui.sourceRoots` – Verzeichnisse, die nach `t("…")`-Aufrufen durchsucht werden sollen (z. B. `["src/"]`).
- `ui.stringsJson` – Speicherort für den Hauptkatalog (z. B. `"src/locales/strings.json"`).
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

`localeLoaders` **mit der Konfiguration synchron halten**, indem sie aus `ui-languages.json` mithilfe von `makeLocaleLoadersFromManifest` abgeleitet werden (dadurch werden `SOURCE_LOCALE` mithilfe derselben Normalisierung wie `makeLoadLocale` herausgefiltert). Wenn Sie eine Lokalisierung zu `targetLocales` hinzufügen und `generate-ui-languages` ausführen, wird das Manifest aktualisiert und Ihre Loader verfolgen die Änderung automatisch – es ist nicht nötig, eine separate hartkodierte Zuordnung zu pflegen.

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

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` ist die **empfohlene** Vorgehensweise für ai-i18n-tools-Projekte: Es wendet Key-Trimming + Quelllokalisierungs-<code>{"{{var}}"}</code>-Interpolations-Fallback an (gleiches Verhalten wie das niedrigere `wrapI18nWithKeyTrim`), fügt optional `translate-ui` `{sourceLocale}.json` Plural-suffixierte Schlüssel über `addResourceBundle` zusammen und installiert anschließend pluralitätsbewusste `wrapT` aus Ihrem `strings.json`. Diese gebündelte Datei muss das Plural-Flachformat für Ihre **konfigurierte** Quelllokalisierung sein – dieselbe `sourceLocale` wie in `ai-i18n-tools.config.json` und `SOURCE_LOCALE` in Ihrem i18n-Bootstrap (siehe Schritt 4 oben). `sourcePluralFlatBundle` nur während des Bootstrappings weglassen (einbinden, sobald `translate-ui` `{sourceLocale}.json` ausgegeben hat). `wrapI18nWithKeyTrim` allein ist für Anwendungscode **veraltet** – verwenden Sie stattdessen `setupKeyAsDefaultT`.

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

Verwenden Sie die native Interpolation von i18next mit dem zweiten Argument für <code>{"{{var}}"}</code>-Platzhalter:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Der extract-Befehl analysiert das **zweite Argument**, wenn es ein einfaches Objektliteral ist, und liest tooling-spezifische Flags wie `plurals: true` und `zeroDigit` (siehe **Kardinal-Plurale** unten). Für gewöhnliche Zeichenketten wird nur der Literal-Schlüssel zum Hashen verwendet; Interpolations-Optionen werden zur Laufzeit weiterhin an i18next übergeben.

Wenn Ihr Projekt ein benutzerdefiniertes Interpolations-Tool verwendet (z. B. Aufruf von `t('key')` und Weiterleitung des Ergebnisses durch eine Vorlagenfunktion wie `interpolateTemplate(t('Hello {{name}}'), { name })`), macht `setupKeyAsDefaultT` (über `wrapI18nWithKeyTrim`) dies überflüssig – es wendet <code>{"{{var}}"}</code>-Interpolation an, auch wenn die Quelllokalisierung den rohen Schlüssel zurückgibt. Migrieren Sie die Aufrufstellen zu `t('Hello {{name}}', { name })` und entfernen Sie das benutzerdefinierte Tool.

<a id="cardinal-plurals-plurals-true"></a>
### Kardinal-Pluralformen (`plurals: true`)

Verwenden Sie das **genaue Literal**, das Sie als Entwickler-Standardtext wünschen, und übergeben Sie `plurals: true`, damit extract + `translate-ui` den Aufruf als eine **Kardinal-Pluralgruppe** behandeln (i18next JSON v4-Stil `_zero` … `_other` Formen).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (optional) — nur für Tooling; wird **nicht** von i18next gelesen. Wenn `true`, bevorzugen Prompts ein wörtliches Arabisch `0` in der `_zero`-Zeichenkette für jedes Gebietsschema, in dem diese Form existiert; wenn `false` oder weggelassen, wird eine natürliche Nullformulierung verwendet. Entfernen Sie diese Schlüssel vor dem Aufruf von `i18next.t` (siehe `wrapT` weiter unten).

**Validierung:** Wenn die Nachricht **zwei oder mehr** unterschiedliche `{{…}}`-Platzhalter enthält, **muss einer davon `{{count}}`** sein (die Plural-Achse). Andernfalls **schlägt `extract` fehl** mit einer klaren Angabe von Datei und Zeile.

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

Das `ui-languages.json`-Manifest ist ein JSON-Array aus <code>{"{ code, label, englishName, direction }"}</code>-Einträgen (`direction` ist `"ltr"` oder `"rtl"`). Beispiel:

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

Entwickelt für Markdown-Dokumentation, Docusaurus-Seiten und JSON-Beschriftungsdateien. Eigenständige SVG-Ressourcen werden über [`translate-svg`](#cli-reference) übersetzt, wenn `features.translateSVG` aktiviert ist und der `svg`-Block auf oberster Ebene gesetzt ist – nicht über `documentations[].contentPaths`.

<a id="step-1-initialise-for-documentation"></a>
### Schritt 1: Für Dokumentation initialisieren

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Bearbeiten Sie die generierte `ai-i18n-tools.config.json`:

- `sourceLocale` – Ausgangssprache (muss mit `defaultLocale` in `docusaurus.config.js` übereinstimmen).
- `targetLocales` – Array aus BCP-47-Lokalisierungscodes (z. B. `["de", "fr", "es"]`).
- `cacheDir` – gemeinsames SQLite-Cache-Verzeichnis für alle Dokumentations-Pipelines (und Standard-Protokollverzeichnis für `--write-logs`).
- `documentations` – Array aus Dokumentationsblöcken. Jeder Block hat optionale `description`, `contentPaths`, `outputDir`, optionale `jsonSource`, `markdownOutput`, optionale `segmentSplitting`, `targetLocales`, `addFrontmatter`, etc.
- `documentations[].description` – optionale kurze Notiz für Maintainer (was dieser Block abdeckt). Wenn gesetzt, erscheint sie in der `translate-docs`-Überschrift (`🌐 …: translating …`) und in `status`-Abschnittsüberschriften.
- `documentations[].contentPaths` – Markdown/MDX-Quellverzeichnisse oder -Dateien (siehe auch `documentations[].jsonSource` für JSON-Labels).
- `documentations[].outputDir` – Stammverzeichnis für die übersetzte Ausgabe dieses Blocks.
- `documentations[].markdownOutput.style` – `"nested"` (Standard), `"docusaurus"` oder `"flat"` (siehe [Ausgabe-Layouts](#output-layouts)).

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

| Flag                          | Wirkung                                                                                                                                                                                                                                                                  |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(Standard)*                   | Unveränderte Dateien überspringen, wenn Tracking und vorhandene Ausgabedatei übereinstimmen; für den Rest den Segment-Cache verwenden.                                                                                                                                                                              |
| `-l, --locale <codes>`        | Durch Komma getrennte Ziel-Lokalisierungen (wenn weggelassen, entspricht dies der Vereinigung von Stamm-`targetLocales` und den optionalen `targetLocales` jedes `documentations[]`-Blocks).                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | Nur Markdown/JSON unter diesem Pfad übersetzen (projektrelativ oder absolut); `--file` ist ein Alias für `--path`.                                                                                                                                                         |
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

| Modus                       | Benutzernachricht                                                           | Modellantwort                                                 |
|----------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | Pseudo-XML: ein `<seg id="N">…</seg>` pro Segment (mit XML-Escaping). | Nur `<t id="N">…</t>`-Blöcke, einer pro Segmentindex.       |
| `json-array` (Standard) | Ein JSON-Array von Zeichenketten, ein Eintrag pro Segment in der Reihenfolge.               | Ein JSON-Array der **gleichen Länge** (gleiche Reihenfolge).           |
| `json-object`          | Ein JSON-Objekt `{"0":"…","1":"…",…}`, indiziert nach Segmentindex.            | Ein JSON-Objekt mit den **gleichen Schlüsseln** und übersetzten Werten. |

Die Lauf-Kopfzeile gibt auch `Batch prompt format: …` aus, sodass Sie den aktiven Modus bestätigen können. JSON-Label-Dateien (`jsonSource`) und eigenständige SVG-Batches verwenden dieselbe Einstellung, wenn diese Schritte als Teil von `translate-docs` ausgeführt werden (oder in der Docs-Phase von `sync` – `sync` stellt dieses Flag nicht zur Verfügung; es ist standardmäßig auf `json-array` gesetzt).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### Segment-Dedupe und Pfade in SQLite

- Segmentzeilen sind global über `(source_hash, locale)` gekennzeichnet (Hash = normalisierter Inhalt). Identischer Text in zwei Dateien teilt sich eine Zeile; `translations.filepath` ist Metadaten (letzter Schreiber), kein zweiter Cache-Eintrag pro Datei.
- `file_tracking.filepath` verwendet namensraumbezogene Schlüssel: `doc-block:{index}:{relPath}` pro `documentations`-Block (`relPath` ist projektbezogen relativer posix-Pfad: Markdown-Pfade wie gesammelt; **JSON-Beschriftungsdateien verwenden den cwd-relativen Pfad zur Quelldatei**, z. B. `docs-site/i18n/en/code.json`, damit die Bereinigung die echte Datei auflösen kann) und `svg-assets:{relPath}` für eigenständige SVG-Ressourcen unter `translate-svg`.
- `translations.filepath` speichert cwd-relative posix-Pfade für Markdown-, JSON- und SVG-Segmente (SVG verwendet dieselbe Pfadform wie andere Ressourcen; das Präfix `svg-assets:…` ist **nur** bei `file_tracking` vorhanden).
- Nach einem Lauf wird `last_hit_at` nur für Segmentzeilen gelöscht, die **im selben Übersetzungsbereich** liegen (unter Berücksichtigung von `--path` und aktivierten Arten) und nicht erreicht wurden, sodass ein gefilterter oder nur-Dokumentations-Lauf keine nicht betroffenen Dateien als veraltet markiert.

<a id="output-layouts"></a>
### Ausgabe-Layouts

`"nested"` (Standard, wenn weggelassen) – spiegelt die Quellstruktur unter `{outputDir}/{locale}/` wider (z. B. `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` – platziert Dateien, die unter `docsRoot` liegen, unter `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>` und entspricht dem üblichen Docusaurus-i18n-Layout. Legen Sie `documentations[].markdownOutput.docsRoot` auf Ihre Dokumentations-Quellwurzel fest (z. B. `"docs"`).

```text
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` – platziert übersetzte Dateien neben der Quelle mit einem Sprachsuffix oder in einem Unterverzeichnis. Relative Links zwischen Seiten werden automatisch umgeschrieben.

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

1. Führen Sie `ai-i18n-tools write-heading-ids` auf Ihrer **Quell**-`.md` / `.mdx` **vor** `translate-docs` aus (mit demselben `documentations[]` / `contentPaths` wie üblich). Dadurch werden explizite HTML-Anker in die Zeile vor jeder Überschrift eingefügt, sodass `id`-Werte von jeder übersetzten Kopie gemeinsam genutzt werden.
2. Verweisen Sie Ihre Markdown-**Ankerlinks** auf diese stabilen IDs, z. B. `[label](../other.md#section-id)`, wobei `section-id` mit dem Anker übereinstimmt, den das Tool geschrieben hat – nicht nur eine Vermutung basierend auf englischen Wörtern.

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

<a id="markdown-output-path-template-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` Platzhalter

Legen Sie durch Festlegen von `documentations[].markdownOutput.pathTemplate` (für Markdown und MDX) oder `jsonPathTemplate` (für JSON-Label-Dateien) fest, wohin die übersetzten Dateien geschrieben werden. Beide akzeptieren dieselben Platzhalter. Aufgelöste Pfade müssen innerhalb des `outputDir` dieses Blocks bleiben (die CLI lehnt Pfade ab, die ihn verlassen).

Wenn Sie ein benutzerdefiniertes `pathTemplate` verwenden, wird `rewriteRelativeLinks` standardmäßig auf `false` gesetzt, es sei denn, Sie legen es explizit fest – das Umschreiben von Links im flachen Stil ist für das integrierte `flat`-Layout konzipiert.

| Platzhalter | Funktion | Beispiel |
|-------------|------|---------|
| `{outputDir}` | Absoluter aufgelöster Pfad zum `outputDir` dieses Dokumentationsblocks | `/home/acme/repo/i18n` |
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

Führen Sie `npx ai-i18n-tools sync` aus, um eine Pipeline auszuführen: **Extrahieren** von UI-Texten (falls `features.extractUIStrings`), **Übersetzen** der UI-Texte (falls `features.translateUIStrings`), **Übersetzen** eigenständiger SVG-Ressourcen (falls `features.translateSVG` und ein `svg`-Block gesetzt sind), dann **Übersetzen** der Dokumentation (jeder `documentations`-Block: Markdown/JSON wie konfiguriert). Teile mit `--no-ui`, `--no-svg` oder `--no-docs` überspringen. Der Dokumentationsschritt akzeptiert `--dry-run`, `-p` / `--path`, `--force` und `--force-update` (die letzten beiden gelten nur, wenn die Dokumentationsübersetzung läuft; sie werden ignoriert, wenn Sie `--no-docs` übergeben).

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
      "description": "Docusaurus docs and JSON labels",
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

- UI-Texte werden aus `src/` nach `public/locales/` extrahiert/übersetzt.
- Der erste Dokumentationsblock übersetzt Markdown und JSON-Beschriftungen in das Docusaurus-`i18n/<locale>/...`-Layout.
- Der zweite Dokumentationsblock übersetzt `README.md` in flache, sprachsuffixierte Dateien unter `translated-docs/`.
- Alle Dokumentationsblöcke teilen sich `cacheDir`, sodass unveränderte Segmente zwischen Läufen wiederverwendet werden, um API-Aufrufe und Kosten zu reduzieren.

---

<a id="translation-cache-editor"></a>
## Übersetzungs-Cache-Editor

Ausführen:

```bash
ai-i18n-tools editor
# Optional: choose port, do not auto-open browser
# ai-i18n-tools editor -p 8765 --no-open
```

Dies startet eine lokale Web-UI, die auf Ihrer konfigurierten **`cacheDir`**-SQLite-Datenbank basiert – demselben Verzeichnis, das die CLI für Dokumentationssegmente, Protokolle und verwandte Metadaten verwendet. Enthalten sind die Tabs **Dokumentation** (zwischengespeicherte Dokumentensegmente), **UI-Zeichenketten**, **UI-Pluralformen**, **Glossar**, **Fehler** und **Statistiken**.

Wenn Sie **Cache-Zeilen** in dieser App bearbeiten (z. B. Dokumentationsabschnitte), führen Sie `sync --force-update` oder den entsprechenden Übersetzungsbefehl mit `--force-update` aus, damit die Ausgaben auf der Festplatte mit dem Cache übereinstimmen. Wenn sich später der **Quelltext** im Repository ändert, ändern sich die Segment-Hashes und manuelle Bearbeitungen des alten Textes werden überschrieben.

<a id="translation-cache-editor-failures"></a>
### Fehler (Dokumentationsübersetzung)

Die Registerkarte **Fehler** dient ausschließlich der **Dokumentations**übersetzung. Sie liest Fehlerdatensätze aus der SQLite-Datenbank, die geschrieben werden, wenn ein Segment nicht erfolgreich für ein Gebietsschema übersetzt werden konnte – beispielsweise leere oder ungültige Modellausgaben, Validierungsfehler nach der Übersetzung (`AST mismatch`, Platzhalterlecks und ähnliche **Qualitäts**prüfungen) oder eine **fatale** Bedingung, die den Fortschritt blockiert hat. Sie hilft Ihnen dabei, folgende Frage zu beantworten: *Welches Quellsegment ist fehlgeschlagen, für welches Gebietsschema und welches Modell, und welcher Fehlertext wurde aufgezeichnet?*

<a id="when-to-use-it"></a>
#### Wann Sie es verwenden sollten

- Nachdem `translate-docs` oder `sync` mit Fehlern, teilweisen Gebietsschemata oder unklaren Protokollen abgeschlossen wurde – Sie können Fehler sortieren und filtern, anstatt nur durch die Terminalausgabe zu scrollen.
- Wenn Sie **Nacharbeiten priorisieren** möchten: Sortieren Sie nach **# Fehler**, sodass Segmente, die über mehrere Wiederholungen hinweg fehlgeschlagen sind, zuerst erscheinen; diese eignen sich besonders dafür, im Quell-Markdown **vereinfacht oder umformatiert** zu werden, damit zukünftige Durchläufe erfolgreich sind.
- Wenn Sie das **genaue Segment** benötigen – Dateipfad, Zeilenhinweis, Quell-Hash und vollständigen Quelltext – um den richtigen Absatz in Ihrem Repository zu bearbeiten.

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

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (optional)

Segment-Batch-Verarbeitung für Dokumentenübersetzung: Anzahl der Segmente pro API-Anfrage und eine Zeichengrenze. Standardwerte: **20** Segmente, **4096** Zeichen (wenn nicht angegeben).

<a id="openrouter"></a>
### `openrouter`

| Feld               | Beschreibung                                                                                                                                                                                                      |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `baseUrl`           | Basis-URL der OpenRouter-API. Standard: `https://openrouter.ai/api/v1`.                                                                                                                                                |
| `translationModels` | Bevorzugte, geordnete Liste von Modell-IDs. Das erste Modell wird zuerst versucht; nachfolgende Einträge dienen als Fallback bei Fehlern. Für `translate-ui` können Sie zusätzlich `ui.preferredModel` setzen, um ein Modell vor dieser Liste zu versuchen (siehe `ui`). |
| `defaultModel`      | Veraltetes einzelnes primäres Modell. Wird nur verwendet, wenn `translationModels` nicht gesetzt oder leer ist.                                                                                                                               |
| `fallbackModel`     | Veraltetes einzelnes Fallback-Modell. Wird nach `defaultModel` verwendet, wenn `translationModels` nicht gesetzt oder leer ist.                                                                                                              |
| `maxTokens`         | Maximale Anzahl an Completion-Tokens pro Anfrage. Standard: `8192`.                                                                                                                                                              |
| `temperature`       | Sampling-Temperatur. Standard: `0.2`.                                                                                                                                                                            |

**Warum mehrere Modelle verwenden:** Unterschiedliche Anbieter und Modelle weisen unterschiedliche Kosten auf und bieten je nach Sprache und Gebietsschema unterschiedliche Qualitätsniveaus. Konfigurieren Sie `openrouter.translationModels` **als geordnete Fallback-Kette** (anstatt ein einzelnes Modell), sodass die CLI beim Fehlschlagen einer Anfrage das nächste Modell versuchen kann.

Behandeln Sie die Liste unten als **Grundlage**, die Sie erweitern können: Wenn die Übersetzung für ein bestimmtes Gebietsschema schlecht oder erfolglos ist, recherchieren Sie, welche Modelle diese Sprache oder Schrift effektiv unterstützen (siehe Online-Ressourcen oder die Dokumentation Ihres Anbieters), und fügen Sie diese OpenRouter-IDs als weitere Alternativen hinzu.

Diese Liste wurde **hinsichtlich einer breiten Abdeckung verschiedener Sprachen getestet** (z. B. im **April 2026** bei der Übersetzung von **36** Ziel-Sprachen in einem umfangreichen Dokumentationsprojekt); sie dient als praktischer Standard, ist jedoch nicht für jede Sprache garantiert optimal.

Beispiel `translationModels` (gleiche Standardeinstellungen wie `npx ai-i18n-tools init`):

```json
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
]
```

Legen Sie `OPENROUTER_API_KEY` in Ihrer Umgebung oder in der `.env`-Datei fest.

<a id="features"></a>
### `features`

| Feld                | Workflow | Beschreibung                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | Quelle nach `t("…")` / `i18n.t("…")` durchsuchen, optionale `package.json`-Beschreibung und (falls aktiviert) `ui-languages.json` `englishName`-Werte in `strings.json` zusammenführen. |
| `translateUIStrings` | 1        | `strings.json`-Einträge übersetzen und JSON-Dateien je Sprache schreiben.                                                                                                  |
| `translateMarkdown`  | 2        | `.md` / `.mdx`-Dateien übersetzen.                                                                                                                                    |
| `translateJSON`      | 2        | Docusaurus JSON-Label-Dateien übersetzen.                                                                                                                             |
| `translateSVG`       | 2        | Übersetzen Sie eigenständige `.svg`-Ressourcen (erfordert den obersten `svg`-Block).                                                                                         |

**Eigenständige** SVG-Ressourcen mit `translate-svg` übersetzen, wenn `features.translateSVG` auf „true“ steht und ein `svg`-Block auf oberster Ebene konfiguriert ist. Der `sync`-Befehl führt diesen Schritt aus, wenn beide Bedingungen erfüllt sind (es sei denn, `--no-svg`).

<a id="ui"></a>
### `ui`

| Feld                                          | Beschreibung                                                                                                                                                                                                                                                        |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourceRoots`                                  | Verzeichnisse (relativ zum aktuellen Arbeitsverzeichnis), die nach `t("…")`-Aufrufen durchsucht werden.                                                                                                                                                                                                          |
| `stringsJson`                                  | Pfad zur Master-Katalogdatei. Wird von `extract` aktualisiert.                                                                                                                                                                                                             |
| `flatOutputDir`                                | Verzeichnis, in das die JSON-Dateien je Sprache geschrieben werden (`de.json`, usw.).                                                                                                                                                                                               |
| `preferredModel`                               | Optional. OpenRouter-Modell-ID, die zuerst nur für `translate-ui` versucht wird; danach `openrouter.translationModels` (oder ältere Modelle) in der angegebenen Reihenfolge, ohne diese ID zu duplizieren.                                                                                                   |
| `reactExtractor.funcNames`                     | Zusätzliche Funktionsnamen, die durchsucht werden sollen (Standard: `["t", "i18n.t"]`).                                                                                                                                                                                                    |
| `reactExtractor.extensions`                    | Dateierweiterungen, die einbezogen werden sollen (Standard: `[".js", ".jsx", ".ts", ".tsx"]`).                                                                                                                                                                                            |
| `reactExtractor.includePackageDescription`     | Wenn `true` (Standard), schließt `extract` auch `package.json` `description` als UI-Zeichenfolge ein, sofern vorhanden.                                                                                                                                                           |
| `reactExtractor.packageJsonPath`               | Benutzerdefinierter Pfad zur `package.json`-Datei, die für die optionale Beschreibungsextraktion verwendet wird.                                                                                                                                                                              |
| `reactExtractor.includeUiLanguageEnglishNames` | Wenn `true` (Standard `false`), fügt `extract` jedem `englishName` aus dem Manifest unter `uiLanguagesPath` auch `strings.json` hinzu, sofern nicht bereits durch den Quellcode-Scan vorhanden (gleiche Hash-Schlüssel). Erfordert `uiLanguagesPath`, das auf eine gültige `ui-languages.json` verweist. |

<a id="cachedir"></a>
### `cacheDir`

| Feld      | Beschreibung                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite-Cache-Verzeichnis (gemeinsam genutzt von allen `documentations`-Blöcken). Wird zwischen Läufen wiederverwendet. Wenn Sie von einem benutzerdefinierten Dokumentations-Übersetzungscache migrieren, archivieren oder löschen Sie diesen – `cacheDir` erstellt seine eigene SQLite-Datenbank und ist nicht mit anderen Schemata kompatibel. |

Empfohlene Vorgehensweise für VCS-Ausschlüsse:

- Schließen Sie den Inhalt des Übersetzungs-Cache-Ordners aus (z. B. über `.gitignore` oder `.git/info/exclude`), um das Einchecken flüchtiger Cache-Artefakte zu vermeiden.
- Halten Sie `cache.db` verfügbar (löschen Sie es nicht regelmäßig), da die Beibehaltung des SQLite-Caches verhindert, dass unveränderte Segmente erneut übersetzt werden. Dies spart sowohl Laufzeit als auch API-Kosten, wenn sich Software, die `ai-i18n-tools` verwendet, ändert oder aktualisiert wird.

Beispiel:

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

<a id="documentations"></a>
### `documentations`

Array von Dokumentations-Pipeline-Blöcken. `translate-docs` und die Docs-Phase von `sync` **verarbeiten jeden** Block der Reihe nach.

| Feld                                             | Beschreibung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `description`                                     | Optionaler, menschenlesbarer Hinweis für diesen Block (wird nicht für die Übersetzung verwendet). Wird der `translate-docs`-`🌐`-Überschrift vorangestellt, falls festgelegt; wird auch in `status`-Abschnittsüberschriften angezeigt.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `contentPaths`                                    | Markdown-/MDX-Quellen, die übersetzt werden sollen (`translate-docs` durchsucht diese nach `.md` / `.mdx`). Die JSON-Bezeichnungen stammen aus `jsonSource` im selben Block.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `outputDir`                                       | Stammverzeichnis für die übersetzte Ausgabe dieses Blocks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sourceFiles`                                     | Optionaler Alias, der beim Laden in `contentPaths` zusammengeführt wird.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `targetLocales`                                   | Optionaler Teilbereich von Gebietsschemata nur für diesen Block (andernfalls das Stamm-`targetLocales`). Die wirksamen Dokumentationsgebietsschemata ergeben sich als Vereinigung über alle Blöcke.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `jsonSource`                                      | Quellverzeichnis für Docusaurus-JSON-Label-Dateien für diesen Block (z. B. `"i18n/en"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.style`                            | `"nested"` (Standard), `"docusaurus"` oder `"flat"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.docsRoot`                         | Stammverzeichnis der Quelldokumentation für das Docusaurus-Layout (z. B. `"docs"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `markdownOutput.pathTemplate`                     | Benutzerdefinierter Ausgabepfad für Markdown. Platzhalter: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.jsonPathTemplate`                 | Benutzerdefinierter JSON-Ausgabepfad für Beschriftungsdateien. Unterstützt dieselben Platzhalter wie `pathTemplate`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `markdownOutput.flatPreserveRelativeDir`          | Bei `flat`-Stil Unterverzeichnisse der Quelle beibehalten, damit Dateien mit gleichem Basisnamen nicht kollidieren.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `markdownOutput.rewriteRelativeLinks`             | Relative Links nach der Übersetzung neu schreiben (automatisch aktiviert für `flat`-Stil).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `markdownOutput.linkRewriteDocsRoot`              | Repository-Stamm, der bei der Berechnung der Präfixe für flache Links verwendet wird. Normalerweise `"."` belassen, es sei denn, die übersetzten Dokumente befinden sich unter einer anderen Projektwurzel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `markdownOutput.postProcessing`                | Optionale Transformationen des übersetzten **Markdown-Textes** (YAML-Front Matter bleibt erhalten). Wird ausgeführt nach der Segmentzusammenführung und dem Umschreiben flacher Links, und vor `addFrontmatter`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `segmentSplitting`                             | Auf derselben Ebene wie `markdownOutput` (gemäß `documentations[]`-Block). Optionale feinere Segmente zur `translate-docs`-Extraktion: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. Wenn `enabled` auf `true` gesetzt ist (Standard, wenn `segmentSplitting` weggelassen wird), werden dichte Absätze, GFM-Tabellen mit senkrechten Strichen (der erste Teil enthält Kopfzeile, Trennzeile und erste Datenzeile) und lange Listen aufgeteilt; Teilabschnitte werden mit einzelnen Zeilenumbrüchen wieder zusammengefügt (`tightJoinPrevious`). Setzen Sie `"enabled": false`, um nur ein Segment pro durch Leerzeilen getrenntem Textblock zu verwenden. |
| `markdownOutput.postProcessing.regexAdjustments`  | Geordnete Liste von `{ "description"?, "search", "replace" }`. `search` ist ein Regex-Muster (einfache Zeichenfolge verwendet Flag `g` oder `/pattern/flags`). `replace` unterstützt Platzhalter wie `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator", "label" }` — der Übersetzer sucht die erste Zeile, die `start` enthält, und die entsprechende `end`-Zeile, und ersetzt diesen Bereich dann durch einen kanonischen Sprachwechsler. `label` steuert die Quelle der Manifest-Bezeichnung: `"local"` (Standard, verwendet `ui-languages.json` `label`) oder `"english"` (verwendet `englishName`). Die Links werden mit Pfaden relativ zur übersetzten Datei erstellt; wenn kein Manifest konfiguriert ist, stammen die Bezeichnungen aus `localeDisplayNames` und den Gebietsschemacodes. |
| `addFrontmatter`                                  | Wenn `true` (Standard, wenn weggelassen), enthalten die übersetzten Markdown-Dateien YAML-Schlüssel: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path` und, falls mindestens ein Segment über Modell-Metadaten verfügt, `translation_models` (sortierte Liste der verwendeten OpenRouter-Modell-IDs). Auf `false` setzen, um dies zu überspringen.                                                                                                                                                                                                                                                                                                                           |

Beispiel (flache README-Pipeline — Pfade zu Screenshots + optionaler Wrapper mit Sprachliste):

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

<a id="svg-optional"></a>
### `svg` (optional)

Pfade und Layout auf oberster Ebene für eigenständige SVG-Ressourcen. Die Übersetzung wird nur ausgeführt, wenn `features.translateSVG` auf true gesetzt ist (über `translate-svg` oder die SVG-Phase von `sync`).

| Feld                         | Beschreibung                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | Ein Verzeichnis oder ein Array von Verzeichnissen, die rekursiv nach `.svg`-Dateien durchsucht werden.                                                                                                                                                                                                     |
| `outputDir`                   | Stammverzeichnis für die übersetzte SVG-Ausgabe.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` oder `"nested"`, wenn `pathTemplate` nicht gesetzt ist.                                                                                                                                                                                                                               |
| `pathTemplate`                | Benutzerdefinierter SVG-Ausgabepfad. Platzhalter: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Kleingeschriebener übersetzter Text bei der SVG-Zusammenstellung. Nützlich für Designs, die auf vollständig kleingeschriebenen Beschriftungen basieren.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Feld          | Beschreibung                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Pfad zu `strings.json` – erstellt automatisch ein Glossar aus vorhandenen Übersetzungen.                                                                                                 |
| `userGlossary` | Pfad zu einer CSV-Datei mit den Spalten `Original language string` (oder `en`), `locale`, `Translation` – eine Zeile pro Quellbegriff und Zielsprache (`locale` kann `*` für alle Ziele sein). |

Der veraltete Schlüssel `uiGlossaryFromStringsJson` wird weiterhin akzeptiert und beim Laden der Konfiguration `uiGlossary` zugeordnet.

Ein leeres Glossar-CSS generieren:

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI-Referenz

| Befehl                                                                     | Beschreibung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                   | Gibt die CLI-Version und den Build-Zeitstempel aus (die gleichen Informationen wie `-V` / `--version` im Hauptprogramm).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]`  | Eine Startkonfigurationsdatei schreiben (enthält `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` und `documentations[].addFrontmatter`). `--with-translate-ignore` erstellt eine Start-`.translate-ignore`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `extract`                                                                   | `strings.json` aus `t("…")` / `i18n.t("…")`-Literalen aktualisieren, optionale `package.json`-Beschreibung und optionale Manifest-`englishName`-Einträge (siehe `ui.reactExtractor`). Erfordert `features.extractUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `generate-ui-languages [--master <path>] [--dry-run]`                       | `ui-languages.json` nach `ui.flatOutputDir` (oder `uiLanguagesPath`, falls gesetzt) mit `sourceLocale` + `targetLocales` und der gebündelten `data/ui-languages-complete.json` (oder `--master`) schreiben. Warnt und generiert `TODO`-Platzhalter für Sprachvarianten, die in der Masterdatei fehlen. Wenn Sie ein vorhandenes Manifest mit angepassten `label`- oder `englishName`-Werten haben, werden diese durch die Standardwerte des Hauptkatalogs ersetzt – überprüfen und passend anpassen Sie die generierte Datei danach.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `translate-docs …`                                                          | Übersetzen Sie Markdown/MDX und JSON für jeden `documentations`-Block (`contentPaths`, optional `jsonSource`). `-j`: maximale parallele Sprachen; `-b`: maximale parallele Batch-API-Aufrufe pro Datei. `--prompt-format`: Batch-Übertragungsformat (`xml` \| `json-array` \| `json-object`). Siehe [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags) und [Batch-Aufforderungsformat](#batch-prompt-format).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `write-heading-ids …`                                                       | **Keine API.** Erfordert mindestens einen `documentations[]`-Block. Sammelt `.md` / `.mdx` unterhalb des jeweiligen `contentPaths`-Blocks (beachtet `.translate-ignore`). Fügt eine HTML-Ankerzeile `<a id="slug"></a>` unmittelbar **vor** jede flache ATX-`#`-Überschrift ein (überspringt Überschriften innerhalb von Codeblöcken). `-p` / `--path` oder `-f` / `--file`: Beschränkung auf eine projektrelative Datei oder ein Verzeichnis. `--slug-style`: `github` (Standard; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. Mit `pymdown`, optional `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--dry-run`: Zeigt nur Änderungen an.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `translate-svg …`                                                           | Übersetzen Sie eigenständige SVG-Assets, die in `config.svg` konfiguriert sind (getrennt von der Dokumentation). Erfordert `features.translateSVG`. Gleiche Cache-Überlegungen wie bei Dokumentation; unterstützt `--no-cache`, um SQLite-Lese-/Schreibvorgänge für diesen Lauf zu überspringen. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`             | Übersetzen Sie nur die Benutzeroberflächenzeichenfolgen. `--force`: alle Einträge pro Sprache erneut übersetzen (bestehende Übersetzungen ignorieren). `--dry-run`: keine Schreibvorgänge, keine API-Aufrufe. `-j`: maximale parallele Sprachen. Erfordert `features.translateUIStrings`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                                                    | Führt `extract` **zuerst** aus (erfordert `features.extractUIStrings`), sodass `strings.json` mit der Quelle übereinstimmt, danach Überprüfung der Benutzeroberflächenzeichenfolgen in der **Quellsprache** durch ein LLM (Rechtschreibung, Grammatik). **Terminologiehinweise** stammen ausschließlich aus der `glossary.userGlossary`-CSV-Datei (gleicher Geltungsbereich wie `translate-ui` — nicht `strings.json` / `uiGlossary`, damit fehlerhafte Texte nicht als Glossar bestärkt werden). Verwendet OpenRouter (`OPENROUTER_API_KEY`). Nur beratend (gibt Exit-Code **0** nach Abschluss des Laufs zurück). Erstellt `lint-source-results_<timestamp>.log` unter `cacheDir` als **menschlich lesbaren** Bericht (Zusammenfassung, Probleme und pro Zeichenfolge **OK**-Einträge); das Terminal zeigt nur Zusammenfassungszahlen und Probleme an (keine `[ok]`-Zeilen pro Zeichenfolge). Gibt den Namen der Protokolldatei in der letzten Zeile aus. `--json`: vollständiger maschinenlesbarer JSON-Bericht nur auf stdout (Protokolldatei bleibt menschlich lesbar). `--dry-run`: führt `extract` weiter aus, gibt aber nur den Batch-Plan aus (keine API-Aufrufe). `--chunk`: Zeichenfolgen pro API-Batch (Standard **50**). `-j`: maximale parallele Batches (Standard `concurrency`). Mit `--json` geht die menschenlesbare Ausgabe an stderr. Links verwenden `path:line` wie die Schaltfläche „Link“ im `editor`-Benutzeroberflächentext. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | Exportiert `strings.json` nach XLIFF 2.0 (je eine `.xliff` pro Ziel-Lokalisierung). `-o` / `--output-dir`: Ausgabeverzeichnis (Standard: selbes Verzeichnis wie der Katalog). `--untranslated-only`: nur Einheiten ohne Übersetzung für diese Lokalisierung. Nur-Lesezugriff; keine API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sync …`                                                                    | Extrahiert (falls aktiviert), dann UI-Übersetzung, dann `translate-svg`, wenn `features.translateSVG` und `config.svg` gesetzt sind, dann Dokumentationsübersetzung — es sei denn, übersprungen mit `--no-ui`, `--no-svg` oder `--no-docs`. Gemeinsame Flags: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (nur Dokumenten-Batchverarbeitung), `--force` / `--force-update` (nur Dokumente; sich gegenseitig ausschließend, wenn Dokumente verarbeitet werden). Die Dokumentationsphase leitet auch `--emphasis-placeholders` und `--debug-failed` weiter (gleiche Bedeutung wie `translate-docs`). `--prompt-format` ist kein `sync`-Flag; der Dokumentationsschritt verwendet den integrierten Standardwert (`json-array`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `status [--max-columns <n>]`                                                | Wenn `features.translateUIStrings` aktiviert ist, wird die UI-Abdeckung pro Gebietsschema (`Translated` / `Missing` / `Total`) ausgegeben. Anschließend wird der Markdown-Übersetzungsstatus pro Datei × Gebietsschema ausgegeben (kein `--locale`-Filter; die Gebietsschemata stammen aus der Konfiguration). Große Gebietsschemalisten werden in wiederholte Tabellen mit maximal `n` Gebietsschema-Spalten aufgeteilt (Standard **9**), damit die Zeilen im Terminal schmal bleiben.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                       | Führt zuerst `sync --force-update` aus (Extrahieren, UI, SVG, Dokumente) und entfernt anschließend veraltete Segmentzeilen (null `last_hit_at` / leere Dateipfade); löscht `file_tracking`-Zeilen, deren aufgelöster Quellpfad auf dem Datenträger fehlt; entfernt Übersetzungszeilen, deren `filepath`-Metadaten auf eine fehlende Datei verweisen. Protokolliert drei Zähler (veraltet, verwaiste `file_tracking`, verwaiste Übersetzungen). Erstellt eine zeitgestempelte SQLite-Sicherung im Cache-Verzeichnis, sofern nicht `--no-backup`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `editor [-p <port>] [--no-open]`                                            | Startet einen lokalen Web-Editor für den Cache, `strings.json` und das Glossar-CSV. `--no-open` öffnen nicht automatisch den Standardbrowser.<br><br>**Hinweis:** Wenn Sie einen Eintrag im Cache-Editor bearbeiten, müssen Sie einen `sync --force-update` ausführen, um die Ausgabedateien mit dem aktualisierten Cache-Eintrag neu zu schreiben. Außerdem geht die manuelle Bearbeitung verloren, wenn sich der Quelltext später ändert, da ein neuer Cache-Schlüssel generiert wird.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `glossary-generate [-o <path>]`                                             | Schreibt eine leere `glossary-user.csv`-Vorlage. `-o`: überschreibt den Ausgabepfad (Standard: `glossary.userGlossary` aus der Konfiguration oder `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Alle Befehle akzeptieren `-c <path>`, um eine abweichende Konfigurationsdatei anzugeben, `-v` für ausführliche Ausgabe und `-w` / `--write-logs [path]`, um die Konsolenausgabe zusätzlich in eine Protokolldatei zu schreiben (Standardpfad: unterhalb von `cacheDir`). Das Hauptprogramm unterstützt außerdem `-V` / `--version` sowie `-h` / `--help`; `ai-i18n-tools help [command]` zeigt dieselbe, befehlsspezifische Nutzungshilfe wie `ai-i18n-tools <command> --help`.

---

<a id="environment-variables"></a>
## Umgebungsvariablen

| Variable                | Beschreibung                                                |
|-------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`    | **Erforderlich.** Ihr OpenRouter-API-Schlüssel.                     |
| `OPENROUTER_BASE_URL`   | Überschreibt die Basis-URL der API.                                 |
| `I18N_SOURCE_LOCALE`    | Überschreibt `sourceLocale` zur Laufzeit.                        |
| `I18N_TARGET_LOCALES`   | Durch Komma getrennte Gebietsschemacodes zur Überschreibung von `targetLocales`.  |
| `I18N_LOG_LEVEL`        | Protokollierungsstufe (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | Wenn `1`, werden ANSI-Farben in der Protokollaufgabe deaktiviert.              |
| `I18N_LOG_SESSION_MAX`  | Maximale Anzahl an Zeilen pro Protokollsitzung (Standard `5000`).           |
