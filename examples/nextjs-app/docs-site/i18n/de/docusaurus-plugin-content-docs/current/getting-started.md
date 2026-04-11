---
translation_last_updated: '2026-04-11T03:31:26.166Z'
source_file_mtime: '2026-04-11T03:30:13.293Z'
source_file_hash: d90b2b1044bb86a41adcd98b63e7d0fcccc9d3735de82bcee90754647f0d1b15
translation_language: de
source_file_path: docs-site/docs/getting-started.md
---
# ai-i18n-tools: Erste Schritte

`ai-i18n-tools` bietet zwei unabhängige, kombinierbare Workflows:

- **Workflow 1 – UI-Übersetzung**: Extrahieren Sie `t("…")`-Aufrufe aus jeder JS/TS-Quelle, übersetzen Sie sie über OpenRouter und schreiben Sie flache JSON-Dateien pro Sprache, die für i18next bereitstehen.
- **Workflow 2 – Dokumentenübersetzung**: Übersetzen Sie Markdown (MDX) und Docusaurus JSON-Beschriftungsdateien in beliebig viele Sprachen mit intelligenter Zwischenspeicherung. **SVG**-Ressourcen verwenden einen separaten Befehl (`translate-svg`) und eine optionale `svg`-Konfiguration (siehe [CLI-Referenz](#cli-reference)).

Beide Workflows nutzen OpenRouter (jeden kompatiblen LLM) und teilen sich eine einzige Konfigurationsdatei.

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Installation](#installation)
- [Schnellstart](#quick-start)
- [Workflow 1 – UI-Übersetzung](#workflow-1---ui-translation)
  - [Schritt 1: Initialisieren](#step-1-initialize)
  - [Schritt 2: Zeichenketten extrahieren](#step-2-extract-strings)
  - [Schritt 3: UI-Zeichenketten übersetzen](#step-3-translate-ui-strings)
  - [Schritt 4: i18next zur Laufzeit einbinden](#step-4-wire-i18next-at-runtime)
  - [Verwendung von `t()` im Quellcode](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Sprachumschalter-Benutzeroberfläche](#language-switcher-ui)
  - [Sprachen mit rechts-nach-links-Leserichtung (RTL)](#rtl-languages)
- [Workflow 2 – Dokumentenübersetzung](#workflow-2---document-translation)
  - [Schritt 1: Initialisieren](#step-1-initialize-1)
  - [Schritt 2: Dokumente übersetzen](#step-2-translate-documents)
    - [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags)
  - [Ausgabe-Layouts](#output-layouts)
- [Kombinierter Workflow (UI + Docs)](#combined-workflow-ui--docs)
- [Konfigurationsreferenz](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`concurrency` (optional)](#concurrency-optional)
  - [`batchConcurrency` (optional)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (optional)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`documentation`](#documentation)
  - [`glossary`](#glossary)
- [CLI-Referenz](#cli-reference)
- [Umgebungsvariablen](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation {#installation}

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

Legen Sie Ihren OpenRouter-API-Schlüssel fest:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Oder erstellen Sie eine `.env`-Datei im Projektstammverzeichnis:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Schnellstart {#quick-start}

Die Standard-`init`-Vorlage (`ui-markdown`) aktiviert ausschließlich die **UI**-Extraktion/Übersetzung. Die Vorlage `ui-docusaurus` aktiviert die **Dokumentenübersetzung** (`translate-docs`). Verwenden Sie `sync`, wenn Sie Extraktion + UI + Dokumente (und optional separate SVG-Dateien, falls `svg` konfiguriert ist) in einem Aufruf durchführen möchten.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + docs (per config features)
npx ai-i18n-tools sync

# Markdown translation status (per file × locale)
npx ai-i18n-tools status
```

---

## Workflow 1 – UI-Übersetzung {#workflow-1---ui-translation}

Entwickelt für jedes JS/TS-Projekt, das i18next verwendet: React-Anwendungen, Next.js (Client- und Server-Komponenten), Node.js-Dienste, CLI-Tools.

### Schritt 1: Initialisieren {#step-1-initialize}

```bash
npx ai-i18n-tools init
```

Dies erzeugt `ai-i18n-tools.config.json` mit der `ui-markdown`-Vorlage. Bearbeiten Sie diese, um Folgendes festzulegen:

- `sourceLocale` – Ihr BCP-47-Code für die Ausgangssprache (z. B. `"en-GB"`). **Muss** mit `SOURCE_LOCALE` übereinstimmen, das aus Ihrer Laufzeit-i18n-Konfigurationsdatei (`src/i18n.ts` / `src/i18n.js`) exportiert wird.
- `targetLocales` – Pfad zu Ihrer `ui-languages.json`-Manifestdatei ODER ein Array von BCP-47-Codes.
- `ui.sourceRoots` – Verzeichnisse, in denen nach `t("…")`-Aufrufen gesucht werden soll (z. B. `["src/"]`).
- `ui.stringsJson` – Speicherort für den Hauptkatalog (z. B. `"src/locales/strings.json"`).
- `ui.flatOutputDir` – Speicherort für `de.json`, `pt-BR.json` usw. (z. B. `"src/locales/"`).

### Schritt 2: Zeichenketten extrahieren {#step-2-extract-strings}

```bash
npx ai-i18n-tools extract
```

Durchsucht alle JS/TS-Dateien unter `ui.sourceRoots` nach `t("literal")`- und `i18n.t("literal")`-Aufrufen. Schreibt (oder führt zusammen in) `ui.stringsJson`.

Der Scanner ist konfigurierbar: Fügen Sie benutzerdefinierte Funktionsnamen über `ui.reactExtractor.funcNames` hinzu.

### Schritt 3: UI-Strings übersetzen {#step-3-translate-ui-strings}

```bash
npx ai-i18n-tools translate-ui
```

Liest `strings.json`, sendet Batches an OpenRouter für jedes Zielsprachgebiet und schreibt flache JSON-Dateien (`de.json`, `fr.json`, usw.) nach `ui.flatOutputDir`.

### Schritt 4: i18next zur Laufzeit einbinden {#step-4-wire-i18next-at-runtime}

Erstellen Sie Ihre i18n-Setup-Datei mithilfe der von `'ai-i18n-tools/runtime'` bereitgestellten Hilfsfunktionen:

```js
// src/i18n.js  (or src/i18n.ts)
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

Importieren Sie `i18n.js`, bevor React gerendert wird (z. B. am Anfang Ihrer Einstiegsdatei). Wenn der Benutzer die Sprache wechselt, rufen Sie `await loadLocale(code)` und anschließend `i18n.changeLanguage(code)` auf.

`SOURCE_LOCALE` wird exportiert, sodass jede andere Datei, die sie benötigt (z. B. ein Sprachumschalter), sie direkt aus `'./i18n'` importieren kann.

**`defaultI18nInitOptions(sourceLocale)`** gibt die Standardoptionen für Key-as-Default-Setups zurück:

- `parseMissingKeyHandler` gibt den Schlüssel selbst zurück, sodass nicht übersetzte Zeichenketten den Quelltext anzeigen.
- `nsSeparator: false` erlaubt Schlüssel, die Doppelpunkte enthalten.
- `interpolation.escapeValue: false` – die Deaktivierung ist sicher: React selbst entwertet Werte, und die Ausgabe von Node.js/CLI enthält kein HTML, das entwertet werden müsste.

**`wrapI18nWithKeyTrim(i18n)`** umschließt `i18n.t`, sodass: (1) Schlüssel vor der Suche gekürzt werden, was der Art entspricht, wie das Extraktionsskript sie speichert; (2) <code>{"{{var}}"}</code>-Interpolation angewendet wird, wenn die Quelllokalisierung den rohen Schlüssel zurückgibt – sodass <code>{"t('Hello {{name}}', { name })"}</code> auch für die Ausgangssprache korrekt funktioniert.

**`makeLoadLocale(i18n, loaders, sourceLocale)`** gibt eine asynchrone `loadLocale(lang)`-Funktion zurück, die das JSON-Bundle für eine Lokalisierung dynamisch importiert und bei i18next registriert.

### Verwendung von `t()` im Quellcode {#using-t-in-source-code}

Rufen Sie `t()` mit einer **wörtlichen Zeichenkette** auf, damit das Extraktionsskript sie finden kann:

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
- Der Schlüssel muss eine **wörtliche Zeichenkette** sein – keine Variablen oder Ausdrücke als Schlüssel.
- Verwenden Sie keine Template-Literale für den Schlüssel: <code>{'t(`Hello ${name}`)'}</code> ist nicht extrahierbar.

### Interpolation {#interpolation}

Verwenden Sie die native Interpolation von i18next mit zweitem Argument für <code>{"{{var}}"}</code>-Platzhalter:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Das Extraktionsskript ignoriert das zweite Argument – nur die wörtliche Schlüsselzeichenkette <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code> wird extrahiert und zur Übersetzung gesendet. Übersetzer erhalten die Anweisung, <code>{"{{...}}"}</code>-Token beizubehalten.

### Sprachumschalter-Oberfläche {#language-switcher-ui}

Verwenden Sie das Manifest `ui-languages.json`, um einen Sprachauswahl-Dialog zu erstellen. `ai-i18n-tools` exportiert zwei Anzeige-Hilfsfunktionen:

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

**`getUILanguageLabel(lang, t)`** – zeigt `t(englishName)` bei Übersetzung an, oder `englishName / t(englishName)`, wenn beide unterschiedlich sind. Geeignet für Einstellungsseiten.

**`getUILanguageLabelNative(lang)`** – zeigt `englishName / label` an (kein `t()`-Aufruf pro Zeile). Geeignet für Kopfzeilenmenüs, bei denen der native Name sichtbar sein soll.

Das Manifest `ui-languages.json` ist ein JSON-Array aus Einträgen <code>{"{ code, label, englishName }"}</code>. Beispiel:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

Legen Sie `targetLocales` in der Konfiguration auf den Pfad dieser Datei fest, damit der Übersaltungsbefehl dieselbe Liste verwendet.

### RTL-Sprachen {#rtl-languages}

`ai-i18n-tools` exportiert `getTextDirection(lng)` und `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` setzt `document.documentElement.dir` (im Browser) oder hat keine Wirkung (Node.js). Übergeben Sie ein optionales `element`-Argument, um ein bestimmtes Element anzusteuern.

Für Zeichenketten, die `→`-Pfeile enthalten können, drehen Sie diese bei RTL-Layouts um:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Workflow 2 – Dokumentenübersetzung {#workflow-2---document-translation}

Entwickelt für Markdown-Dokumentation, Docusaurus-Seiten und JSON-Beschriftungsdateien. SVG-Diagramme werden über [`translate-svg`](#cli-reference) und `svg` in der Konfiguration übersetzt, nicht über `documentation.contentPaths`.

### Schritt 1: Initialisieren {#step-1-initialize-1}

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Bearbeiten Sie die generierte Datei `ai-i18n-tools.config.json`:

- `sourceLocale` – Ausgangssprache (muss mit `defaultLocale` in `docusaurus.config.js` übereinstimmen).
- `targetLocales` – Array mit Sprachcodes oder Pfad zu einer Manifestdatei.
- `documentation.contentPaths` – Quellverzeichnisse oder -dateien im Markdown-/MDX-Format (siehe auch `documentation.jsonSource` für JSON-Beschriftungen).
- `documentation.outputDir` – Stammverzeichnis für die übersetzten Ausgabedateien.
- `documentation.markdownOutput.style` – `"nested"` (Standard), `"docusaurus"` oder `"flat"` (siehe [Ausgabe-Layouts](#output-layouts)).

### Schritt 2: Dokumente übersetzen {#step-2-translate-documents}

```bash
npx ai-i18n-tools translate-docs
```

Dies übersetzt alle Dateien in `documentation.contentPaths` in alle `targetLocales` (oder `documentation.targetLocales`, falls gesetzt). Bereits übersetzte Segmente werden aus dem SQLite-Cache geladen – nur neue oder geänderte Segmente werden an das LLM gesendet.

So übersetzen Sie eine einzelne Sprache:

```bash
npx ai-i18n-tools translate-docs --locale de
```

So prüfen Sie, was übersetzt werden muss:

```bash
npx ai-i18n-tools status
```

#### Cache-Verhalten und `translate-docs`-Flags {#cache-behaviour-and-translate-docs-flags}

Die CLI führt **Datei-Tracking** in SQLite (Quell-Hash pro Datei × Sprache) und **Segment**-Einträge (Hash × Sprache pro übersetzbarer Abschnitt). Ein normaler Durchlauf überspringt eine Datei vollständig, wenn der gespeicherte Hash mit der aktuellen Quelle übereinstimmt **und** die Ausgabedatei bereits existiert; andernfalls verarbeitet sie die Datei und nutzt den Segment-Cache, sodass unveränderte Texte die API nicht aufrufen.

| Flag                     | Wirkung                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(Standard)*              | Überspringt unveränderte Dateien, wenn Tracking + Ausgabedatei auf Datenträger übereinstimmen; verwendet Segment-Cache für den Rest.                                                                                                             |
| `--force-update`         | Verarbeitet jede passende Datei erneut (extrahiert, setzt zusammen, schreibt Ausgaben), auch wenn das Tracking sie überspringen würde. **Segment-Cache wird weiterhin verwendet** – unveränderte Segmente werden nicht an das LLM gesendet.                   |
| `--force`                | Löscht das Datei-Tracking für jede verarbeitete Datei und **liest** den Segment-Cache nicht für die API-Übersetzung (vollständige Neuübersetzung). Neue Ergebnisse werden weiterhin **in den Segment-Cache geschrieben**.                 |
| `--stats`                | Gibt Segmentanzahlen, Anzahl der verfolgten Dateien und Segmentgesamtzahlen pro Sprache aus, dann beendet.                                                                                                                   |
| `--clear-cache [locale]` | Löscht zwischengespeicherte Übersetzungen (und Datei-Tracking): alle Sprachen oder eine einzelne Sprache, dann beendet.                                                                                                            |

Sie können `--force` nicht mit `--force-update` kombinieren (sie schließen sich gegenseitig aus).

### Ausgabe-Layouts {#output-layouts}

`**"nested"`** (Standard, wenn nicht angegeben) – spiegelt die Quellstruktur unter `{outputDir}/{locale}/` wider (z. B. `docs/guide.md` → `i18n/de/docs/guide.md`).

`**"docusaurus"`** – legt Dateien, die sich unter `docsRoot` befinden, in `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>` ab, entsprechend dem üblichen Docusaurus-i18n-Layout. Legen Sie `documentation.markdownOutput.docsRoot` auf Ihre Dokumentationsquellwurzel fest (z. B. `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

**`"flat"`** – platziert übersetzte Dateien neben der Quelldatei mit einem Lokalisierungssuffix oder in einem Unterverzeichnis. Relative Links zwischen Seiten werden automatisch umgeschrieben.

```
docs/guide.md → i18n/guide.de.md
```

Sie können Pfade vollständig mit `documentation.markdownOutput.pathTemplate` überschreiben. Platzhalter: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Kombinierter Workflow (UI + Docs) {#combined-workflow-ui--docs}

Aktivieren Sie alle Funktionen in einer einzigen Konfiguration, um beide Workflows gemeinsam auszuführen:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
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
  "documentation": {
    "contentPaths": ["docs/"],
    "outputDir": "i18n/",
    "cacheDir": ".translation-cache",
    "markdownOutput": { "style": "flat" }
  }
}
```

`glossary.uiGlossary` leitet die Dokumentenübersetzung an denselben `strings.json`-Katalog wie die UI weiter, sodass die Terminologie konsistent bleibt; `glossary.userGlossary` fügt CSV-Überschreibungen für Produktbegriffe hinzu.

Führen Sie `npx ai-i18n-tools sync` aus, um eine Pipeline auszuführen: **Extrahieren** von UI-Texten (falls `features.extractUIStrings` aktiviert ist), **Übersetzen** der UI-Texte (falls `features.translateUIStrings` aktiviert ist), **Übersetzen** von eigenständigen SVG-Ressourcen (falls ein `svg`-Block in der Konfiguration vorhanden ist) und anschließend **Übersetzen** der Dokumentation (Markdown/JSON unter `documentation`). Teile können mit `--no-ui`, `--no-svg` oder `--no-docs` übersprungen werden. Der Docs-Schritt akzeptiert `--dry-run`, `-p` / `--path`, `--force` und `--force-update` (die letzten beiden gelten nur, wenn die Dokumentenübersetzung ausgeführt wird; sie werden ignoriert, wenn `--no-docs` angegeben wird).

Verwenden Sie `documentation.targetLocales`, um Dokumentation in eine **kleinere Teilmenge** als die UI zu übersetzen:

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentation": {
    "targetLocales": ["de", "fr", "es"]
  }
}
```

---

## Konfigurationsreferenz {#configuration-reference}

### `sourceLocale` {#sourcelocale}

BCP-47-Code für die Ausgangssprache (z. B. `"en-GB"`, `"en"`, `"pt-BR"`). Für diese Sprache wird keine Übersetzungsdatei generiert – der Schlüsseltext selbst ist der Quelltext.

**Muss übereinstimmen** mit `SOURCE_LOCALE`, das aus Ihrer Laufzeit-i18n-Konfigurationsdatei exportiert wird (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales` {#targetlocales}

Welche Sprachen übersetzt werden sollen. Akzeptiert:

- **Zeichenkettenpfad** zu einem `ui-languages.json`-Manifest (`"src/locales/ui-languages.json"`). Die Datei wird geladen und die Sprachcodes werden extrahiert.
- **Array mit BCP-47-Codes** (`["de", "fr", "es"]`).
- **Array mit einem Element und Pfad** (`["src/locales/ui-languages.json"]`) – gleiche Funktionalität wie die Zeichenkettenform.

### `concurrency` (optional) {#concurrency-optional}

Maximale Anzahl gleichzeitig zu übersetzender **Zielsprachen** (`translate-ui`, `translate-docs`, `translate-svg` und die entsprechenden Schritte innerhalb von `sync`). Wenn nicht angegeben, verwendet die CLI standardmäßig **4** für die UI-Übersetzung und **3** für die Dokumentationsübersetzung (eingebaute Voreinstellungen). Kann pro Aufruf mit `-j` / `--concurrency` überschrieben werden.

### `batchConcurrency` (optional) {#batchconcurrency-optional}

**translate-docs** und **translate-svg** (sowie der Dokumentationsschritt von `sync`): maximale parallele OpenRouter **Batch**-Anfragen pro Datei (jeder Batch kann viele Segmente enthalten). Standardwert **4**, wenn nicht angegeben. Wird von `translate-ui` ignoriert. Kann mit `-b` / `--batch-concurrency` überschrieben werden. Bei `sync` gilt `-b` nur für den Dokumentationsübersetzungsschritt.

### `batchSize` / `maxBatchChars` (optional) {#batchsize--maxbatchchars-optional}

Segmentbündelung für die Dokumentenübersetzung: Anzahl der Segmente pro API-Anfrage und eine Obergrenze an Zeichen. Standardwerte: **20** Segmente, **4096** Zeichen (wenn nicht angegeben).

### `openrouter` {#openrouter}

| Feld                    | Beschreibung                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`               | Basis-URL der OpenRouter-API. Standard: `https://openrouter.ai/api/v1`.                        |
| `translationModels`     | Geordnete Liste von Modell-IDs. Die erste wird zuerst versucht; nachfolgende dienen als Fallback bei Fehlern. |
| `maxTokens`             | Maximale Anzahl an Completion-Tokens pro Anfrage. Standard: `8192`.                                      |
| `temperature`           | Sampling-Temperatur. Standard: `0.2`.                                                    |

Legen Sie `OPENROUTER_API_KEY` in Ihrer Umgebung oder `.env`-Datei fest.

### `features` {#features}

| Feld | Workflow | Beschreibung |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings` | 1 | Durchsucht die Quelle nach `t("…")` und schreibt/fügt `strings.json` zusammen. |
| `translateUIStrings` | 1 | Übersetzt Einträge in `strings.json` und schreibt JSON-Dateien pro Sprache. |
| `translateMarkdown` | 2 | Übersetzt `.md` / `.mdx`-Dateien. |
| `translateJSON` | 2 | Übersetzt Docusaurus JSON-Beschriftungsdateien.

Es gibt kein Flag `features.translateSVG`. Übersetzen Sie **standalone** SVG-Ressourcen mit `translate-svg` und einem `svg`-Block auf oberster Ebene in der Konfiguration. Der `sync`-Befehl führt diesen Schritt aus, wenn `svg` vorhanden ist (außer bei `--no-svg`).

### `ui` {#ui}

| Feld                        | Beschreibung                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Verzeichnisse (relativ zum Arbeitsverzeichnis), die nach `t("…")`-Aufrufen durchsucht werden.               |
| `stringsJson`               | Pfad zur Hauptkatalogdatei. Wird von `extract` aktualisiert.                  |
| `flatOutputDir`             | Verzeichnis, in das die sprachspezifischen JSON-Dateien geschrieben werden (`de.json`, usw.).    |
| `reactExtractor.funcNames`  | Zusätzliche Funktionsnamen, nach denen gesucht wird (Standard: `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | Dateierweiterungen, die einbezogen werden (Standard: `[".js", ".jsx", ".ts", ".tsx"]`). |

### `documentation` {#documentation}

| Feld                                        | Beschreibung                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contentPaths`                               | Markdown/MDX-Quellen zum Übersetzen (`translate-docs` durchsucht diese nach `.md` / `.mdx`). JSON-Bezeichnungen stammen aus `jsonSource`.                                                                                                |
| `outputDir`                                  | Stammverzeichnis für die übersetzte Ausgabe.                                                                                                                                                                                     |
| `cacheDir`                                   | SQLite-Cache-Verzeichnis. Wiederverwendung zwischen Durchläufen für inkrementelle Übersetzung.                                                                                                                                                    |
| `targetLocales`                              | Optionaler Teilsatz von Sprachversionen nur für Dokumente (überschreibt die globale `targetLocales`).                                                                                                                                                |
| `jsonSource`                                 | Quellverzeichnis für Docusaurus JSON-Label-Dateien (z. B. `"i18n/en"`).                                                                                                                                                      |
| `markdownOutput.style`                       | `"nested"` (Standard), `"docusaurus"` oder `"flat"`.                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Quell-Docs-Stammverzeichnis für Docusaurus-Layout (z. B. `"docs"`).                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | Benutzerdefinierter Ausgabepfad. Platzhalter: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{extension}"}</code>.                                                                                                                        |
| `markdownOutput.rewriteRelativeLinks` | Relative Links nach der Übersetzung neu schreiben (automatisch aktiviert bei `flat`-Stil).                                                                                                                                                 |
| `injectTranslationMetadata`                  | Wenn `true` (Standard, wenn nicht angegeben), enthalten übersetzte Markdown-Dateien YAML-Schlüssel: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`. Auf `false` setzen, um zu überspringen. |

### `glossary` {#glossary}

| Feld           | Beschreibung                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Pfad zu `strings.json` – erstellt automatisch ein Glossar aus vorhandenen Übersetzungen.                                                                                                     |
| `userGlossary` | Pfad zu einer CSV-Datei mit den Spalten **`Original language string`** (oder `**en**`), `**locale**`, `**Translation`** – eine Zeile pro Quellbegriff und Ziellokalisierung (`locale` kann `*` für alle Ziele sein). |

Der veraltete Schlüssel `uiGlossaryFromStringsJson` wird weiterhin akzeptiert und beim Laden der Konfiguration `uiGlossary` zugeordnet.

Ein leeres Glossar-CVS generieren:

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLI-Referenz {#cli-reference}

| Befehl                                                                   | Beschreibung                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusauros] [-o pfad] [--with-translate-ignore]` | Schreibt eine Startkonfigurationsdatei (enthält `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` und `documentation.injectTranslationMetadata`). `--with-translate-ignore` erstellt eine Start-`.translate-ignore`-Datei.                                                                            |
| `extract`                                                                 | Durchsucht die Quelle nach `t("…")`-Aufrufen und aktualisiert `strings.json`. Erfordert `features.extractUIStrings`.                                                                                                                                                                                                    |
| `translate-docs …`                                                        | Übersetzt Markdown/MDX unter `documentation.contentPaths` und JSON unter `documentation.jsonSource`, wenn aktiviert. `-j`: maximale parallele Sprachen; `-b`: maximale parallele Batch-API-Aufrufe pro Datei. Siehe [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags) für `--force`, `--force-update`, `--stats`, `--clear-cache`. |
| `translate-svg …`                                                         | Übersetzt eigenständige SVG-Assets, die in `config.svg` konfiguriert sind (getrennt von Dokumentation). Gleiche Cache-Konzepte wie bei Dokumenten; unterstützt `--no-cache`, um SQLite-Lese-/Schreibvorgänge für diesen Durchlauf zu überspringen. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [-j <n>]`                                 | Übersetzt nur die UI-Texte. `-j`: maximale parallele Sprachen. Erfordert `features.translateUIStrings`.                                                                                                                                                                                                     |
| `sync …`                                                                  | Extrahiert (falls aktiviert), dann UI-Übersetzung, dann `translate-svg`, wenn `config.svg` existiert, dann Dokumentationsübersetzung – es sei denn, es wird mit `--no-ui`, `--no-svg` oder `--no-docs` übersprungen. Gemeinsame Flags: `-l`, `-p`, `--dry-run`, `-j`, `-b` (nur Dokumenten-Batch-Größe), `--force` / `--force-update` (nur Dokumente; sich gegenseitig ausschließend, wenn Dokumente verarbeitet werden).                         |
| `status`                                                                  | Zeigt den Übersetzungsstatus von Markdown pro Datei × Sprache an (kein `--locale`-Filter; Sprachen stammen aus der Konfiguration).                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <pfad>] [-y]`                  | Entfernt veraltete Einträge (null `last_hit_at` / leerer Dateipfad) und verwaiste Einträge (fehlende Dateien). Vor der Änderung der Datenbank wird eine Bestätigung abgefragt (außer bei `--dry-run` oder `--yes`): Führen Sie zuerst `translate-docs --force-update` aus, damit die Tracking- und Cache-Treffer aktuell sind. Erstellt eine zeitgestempelte SQLite-Sicherung im Cache-Verzeichnis, es sei denn, `--no-backup` ist gesetzt. Verwenden Sie `--yes`, wenn stdin kein TTY ist. |
| `editor [-p <port>]`                                                      | Startet einen lokalen Web-Editor für den Cache, `strings.json` und die Glossar-CSV.                                                                                                                                                                                                                         |
| `glossary-generate`                                                       | Erstellt eine leere Vorlage `glossary-user.csv`.                                                                                                                                                                                                                                                       |

Alle Befehle akzeptieren `-c <Pfad>`, um eine abweichende Konfigurationsdatei anzugeben, `-v` für ausführliche Ausgabe und `-w` / `--write-logs [Pfad]`, um die Konsolenausgabe in eine Protokolldatei umzuleiten (Standardpfad: unter `documentation.cacheDir`).

---

## Umgebungsvariablen {#environment-variables}

| Variable               | Beschreibung                                                |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Erforderlich.** Ihr OpenRouter-API-Schlüssel.                     |
| `OPENROUTER_BASE_URL`  | Überschreibt die Basis-URL der API.                                 |
| `I18N_SOURCE_LOCALE`   | Überschreibt `sourceLocale` zur Laufzeit.                        |
| `I18N_TARGET_LOCALES`  | Durch Komma getrennte Gebietsschemacodes zur Überschreibung von `targetLocales`.  |
| `I18N_LOG_LEVEL`       | Protokollierungsstufe (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Wenn `1`, werden ANSI-Farben in der Protokollierungsausgabe deaktiviert.            |
| `I18N_LOG_SESSION_MAX` | Maximale Anzahl an Zeilen pro Protokollierungssitzung (Standard `5000`).           |
