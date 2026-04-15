# ai-i18n-tools: Erste Schritte

`ai-i18n-tools` bietet zwei unabhängige, kombinierbare Workflows:

- **Workflow 1 - UI-Übersetzung**: Extrahieren Sie `t("…")`-Aufrufe aus jeder JS/TS-Quelle, übersetzen Sie sie über OpenRouter und schreiben Sie flache JSON-Dateien pro Sprache, die für i18next bereitstehen.
- **Workflow 2 - Dokumentenübersetzung**: Übersetzen Sie Markdown (MDX) und Docusaurus JSON-Beschriftungsdateien in beliebig viele Sprachen, mit intelligenter Zwischenspeicherung. **SVG**-Ressourcen verwenden `features.translateSVG`, den obersten `svg`-Block und `translate-svg` (siehe [CLI-Referenz](#cli-reference)).

Beide Workflows verwenden OpenRouter (jeden kompatiblen LLM) und teilen sich eine einzige Konfigurationsdatei.

<small>**In anderen Sprachen lesen:** </small>

<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [German](./GETTING_STARTED.de.md) · [Spanish](./GETTING_STARTED.es.md) · [French](./GETTING_STARTED.fr.md) · [Hindi](./GETTING_STARTED.hi.md) · [Japanese](./GETTING_STARTED.ja.md) · [Korean](./GETTING_STARTED.ko.md) · [Portuguese (BR)](./GETTING_STARTED.pt-BR.md) · [Chinese (CN)](./GETTING_STARTED.zh-CN.md) · [Chinese (TW)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Installation](#installation)
- [Schnellstart](#quick-start)
- [Workflow 1 – UI-Übersetzung](#workflow-1---ui-translation)
  - [Schritt 1: Initialisieren](#step-1-initialise)
  - [Schritt 2: Zeichenketten extrahieren](#step-2-extract-strings)
  - [Schritt 3: UI-Zeichenketten übersetzen](#step-3-translate-ui-strings)
  - [Export nach XLIFF 2.0 (optional)](#exporting-to-xliff-20-optional)
  - [Schritt 4: i18next zur Laufzeit verbinden](#step-4-wire-i18next-at-runtime)
  - [Verwenden von `t()` im Quellcode](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Sprachumschalter-Benutzeroberfläche](#language-switcher-ui)
  - [RTL-Sprachen](#rtl-languages)
- [Workflow 2 – Dokumentenübersetzung](#workflow-2---document-translation)
  - [Schritt 1: Initialisieren](#step-1-initialise-1)
  - [Schritt 2: Dokumente übersetzen](#step-2-translate-documents)
    - [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags)
  - [Ausgabe-Layouts](#output-layouts)
- [Kombinierter Workflow (UI + Docs)](#combined-workflow-ui--docs)
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

## Installation

Das veröffentlichte Paket ist **nur ESM**. Verwenden Sie `import`/`import()` in Node.js oder Ihrem Bundler; **verwenden Sie nicht `require('ai-i18n-tools')`.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools enthält seinen eigenen String-Extractor. Wenn Sie zuvor `i18next-scanner`, `babel-plugin-i18next-extract` oder Ähnliches verwendet haben, können Sie diese Dev-Abhängigkeiten nach der Migration entfernen.

Setze deinen OpenRouter API-Schlüssel:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Oder erstellen Sie eine `.env`-Datei im Projektstamm:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Schnellstart

Die Standard-`init`-Vorlage (`ui-markdown`) ermöglicht nur die **UI**-Extraktion und -Übersetzung. Die `ui-docusaurus`-Vorlage ermöglicht die **Dokumenten**-Übersetzung (`translate-docs`). Verwenden Sie `sync`, wenn Sie einen Befehl möchten, der Extraktion, UI-Übersetzung, optionale eigenständige SVG-Übersetzung und Dokumentationsübersetzung gemäß Ihrer Konfiguration ausführt.

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

### Empfohlene `package.json`-Skripte

Mit dem lokal installierten Paket können Sie die CLI-Befehle direkt in Skripten verwenden (kein `npx` erforderlich):

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

## Workflow 1 - UI-Übersetzung

Entwickelt für jedes JS/TS-Projekt, das i18next verwendet: React-Apps, Next.js (Client- und Serverkomponenten), Node.js-Dienste, CLI-Tools.

### Schritt 1: Initialisieren

```bash
npx ai-i18n-tools init
```

Dies schreibt `ai-i18n-tools.config.json` mit der `ui-markdown`-Vorlage. Bearbeiten Sie es, um Folgendes festzulegen:

- `sourceLocale` – Ihr BCP-47-Sprachcode für die Ausgangssprache (z. B. `"en-GB"`). **Muss übereinstimmen** mit `SOURCE_LOCALE`, das aus Ihrer Laufzeit-i18n-Setup-Datei (`src/i18n.ts` / `src/i18n.js`) exportiert wird.
- `targetLocales` – Array mit BCP-47-Codes für Ihre Zielsprachen (z. B. `["de", "fr", "pt-BR"]`). Führen Sie `generate-ui-languages` aus, um das `ui-languages.json`-Manifest aus dieser Liste zu erstellen.
- `ui.sourceRoots` – Verzeichnisse, die nach `t("…")`-Aufrufen durchsucht werden sollen (z. B. `["src/"]`).
- `ui.stringsJson` – Ort, an dem der Masterkatalog gespeichert wird (z. B. `"src/locales/strings.json"`).
- `ui.flatOutputDir` – Ort, an dem `de.json`, `pt-BR.json` usw. gespeichert werden (z. B. `"src/locales/"`).
- `ui.preferredModel` (optional) – OpenRouter-Modell-ID, die **zuerst** für `translate-ui` versucht wird; bei Fehlschlag setzt die CLI mit `openrouter.translationModels` (oder veraltetem `defaultModel` / `fallbackModel`) in der Reihenfolge fort, wobei Duplikate übersprungen werden.

### Schritt 2: Strings extrahieren

```bash
npx ai-i18n-tools extract
```

Durchsucht alle JS/TS-Dateien unter `ui.sourceRoots` nach `t("literal")` und `i18n.t("literal")`-Aufrufen. Schreibt (oder fügt hinzu) in `ui.stringsJson`.

Der Scanner ist konfigurierbar: Fügen Sie benutzerdefinierte Funktionsnamen über `ui.reactExtractor.funcNames` hinzu.

### Schritt 3: UI-Strings übersetzen

```bash
npx ai-i18n-tools translate-ui
```

Liest `strings.json`, sendet Batches an OpenRouter für jede Zielsprache, schreibt flache JSON-Dateien (`de.json`, `fr.json` usw.) in `ui.flatOutputDir`. Wenn `ui.preferredModel` gesetzt ist, wird dieses Modell vor der geordneten Liste in `openrouter.translationModels` versucht (Dokumentenübersetzung und andere Befehle verwenden weiterhin nur `openrouter`).

Für jeden Eintrag speichert `translate-ui` die **OpenRouter-Modell-ID**, die jede Locale erfolgreich übersetzt hat, in einem optionalen `models`-Objekt (mit denselben Locale-Schlüsseln wie `translated`). Zeichenketten, die im lokalen `editor`-Befehl bearbeitet wurden, werden im `models`-Objekt für diese Locale mit dem Sentinel-Wert `user-edited` markiert. Die flachen Dateien pro Locale unter `ui.flatOutputDir` enthalten weiterhin nur **Quellzeichenkette → Übersetzung**; sie beinhalten `models` nicht (sodass die Laufzeit-Bundles unverändert bleiben).

> **Hinweis zur Verwendung des Cache-Editors:** Wenn Sie einen Eintrag im Cache-Editor bearbeiten, müssen Sie einen `sync --force-update` (oder den entsprechenden `translate`-Befehl mit `--force-update`) ausführen, um die Ausgabedateien mit dem aktualisierten Cache-Eintrag neu zu schreiben. Denken Sie auch daran, dass, wenn sich der Quelltext später ändert, Ihre manuelle Bearbeitung verloren geht, da ein neuer Cache-Schlüssel (Hash) für den neuen Quellstring generiert wird.

### Export nach XLIFF 2.0 (optional)

Um UI-Zeichenketten an einen Übersetzungsdienstleister, ein TMS oder ein CAT-Tool weiterzugeben, exportieren Sie den Katalog als **XLIFF 2.0** (eine Datei pro Zielsprache). Dieser Befehl ist **schreibgeschützt**: Er verändert `strings.json` nicht und ruft keine API auf.

```bash
npx ai-i18n-tools export-ui-xliff
```

Standardmäßig werden die Dateien neben `ui.stringsJson` abgelegt und benannt wie `strings.de.xliff`, `strings.pt-BR.xliff` (Basisname Ihres Katalogs + Sprache + `.xliff`). Verwenden Sie `-o` / `--output-dir`, um an einen anderen Ort zu schreiben. Vorhandene Übersetzungen aus `strings.json` erscheinen in `<target>`; fehlende Sprachen verwenden `state="initial"` ohne `<target>`, sodass Tools diese ergänzen können. Verwenden Sie `--untranslated-only`, um nur Einheiten zu exportieren, die für jede Sprache noch übersetzt werden müssen (nützlich für Vendor-Batches). `--dry-run` gibt Pfade aus, ohne Dateien zu schreiben.

### Schritt 4: i18next zur Laufzeit einbinden

Erstellen Sie Ihre i18n-Setup-Datei mit den von `'ai-i18n-tools/runtime'` exportierten Helfern:

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

Importieren Sie `i18n.js`, bevor React rendert (z. B. am Anfang Ihres Einstiegspunkts). Wenn der Benutzer die Sprache ändert, rufen Sie `await loadLocale(code)` und dann `i18n.changeLanguage(code)` auf.

`SOURCE_LOCALE` wird exportiert, sodass jede andere Datei, die es benötigt (z. B. ein Sprachwechsler), es direkt aus `'./i18n'` importieren kann. Wenn Sie ein bestehendes i18next-Setup migrieren, ersetzen Sie alle hartkodierten Quell-Sprachstrings (z. B. `'en-GB'`-Prüfungen, die über verschiedene Komponenten verteilt sind) durch Importe von `SOURCE_LOCALE` aus Ihrer i18n-Bootstrap-Datei.

`defaultI18nInitOptions(sourceLocale)` gibt die Standardoptionen für Setups mit Schlüssel-als-Standard zurück:

- `parseMissingKeyHandler` gibt den Schlüssel selbst zurück, sodass nicht übersetzte Strings den Quelltext anzeigen.
- `nsSeparator: false` erlaubt Schlüssel, die Doppelpunkte enthalten.
- `interpolation.escapeValue: false` - sicher zu deaktivieren: React entkommt Werten selbst, und Node.js/CLI-Ausgaben haben kein HTML, das entkommen werden muss.

`wrapI18nWithKeyTrim(i18n)` umhüllt `i18n.t`, sodass: (1) Schlüssel vor der Suche abgeschnitten werden, was der Speicherung durch das Extraktionsskript entspricht; (2) <code>{"{{var}}"}</code>-Interpolation angewendet wird, wenn die Quell-locale den rohen Schlüssel zurückgibt – sodass <code>{"t('Hallo {{name}}', { name })"}</code> auch für die Ausgangssprache korrekt funktioniert.

`makeLoadLocale(i18n, loaders, sourceLocale)` gibt eine asynchrone `loadLocale(lang)`-Funktion zurück, die das JSON-Bundle für eine Locale dynamisch importiert und bei i18next registriert.

### Verwendung von `t()` im Quellcode

Rufen Sie `t()` mit einem **wörtlichen String** auf, damit das Extraktionsskript ihn finden kann:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

Das gleiche Muster funktioniert außerhalb von React (Node.js, Serverkomponenten, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Regeln:**

- Nur diese Formen werden extrahiert: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- Der Schlüssel muss ein **literal string** sein - keine Variablen oder Ausdrücke als Schlüssel.
- Verwenden Sie keine Template-Literale für den Schlüssel: <code>{'t(`Hello ${name}`)'}</code> ist nicht extrahierbar.

### Interpolation

Verwenden Sie die native Interpolation des zweiten Arguments von i18next für <code>{"{{var}}"}</code> Platzhalter:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Das Extraktionsskript ignoriert das zweite Argument - nur der literale Schlüsselstring <code>{"\"Hello {{name}}, Sie haben {{count}} Nachrichten\""}</code> wird extrahiert und zur Übersetzung gesendet. Übersetzer werden angewiesen, die <code>{"{{...}}"}</code> Tokens beizubehalten.

Wenn Ihr Projekt ein benutzerdefiniertes Interpolations-Utility verwendet (z. B. Aufruf von `t('key')` und anschließende Weitergabe des Ergebnisses an eine Template-Funktion wie `interpolateTemplate(t('Hello {{name}}'), { name })`), macht `wrapI18nWithKeyTrim` dies überflüssig – es wendet <code>{"{{var}}"}</code>-Interpolation an, auch wenn die Quellsprache den rohen Schlüssel zurückgibt. Migrieren Sie die Aufrufstellen zu `t('Hello {{name}}', { name })` und entfernen Sie das benutzerdefinierte Utility.

### Spracheinstellungen UI

Verwenden Sie das Manifest `ui-languages.json`, um einen Sprachwähler zu erstellen. `ai-i18n-tools` exportiert zwei Anzeigehilfen:

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

`getUILanguageLabel(lang, t)` – zeigt `t(englishName)` an, wenn übersetzt, oder `englishName / t(englishName)`, wenn beide unterschiedlich sind. Geeignet für Einstellungsseiten.

`getUILanguageLabelNative(lang)` – zeigt `englishName / label` an (kein `t()`-Aufruf pro Zeile). Geeignet für Kopfzeilenmenüs, bei denen der native Name sichtbar sein soll.

Das `ui-languages.json`-Manifest ist ein JSON-Array mit Einträgen im Format <code>{"{ code, label, englishName, direction }"}</code> (`direction` ist `"ltr"` oder `"rtl"`). Beispiel:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

Das Manifest wird von `generate-ui-languages` aus `sourceLocale` + `targetLocales` und dem gebündelten Masterkatalog generiert. Es wird nach `ui.flatOutputDir` geschrieben.

### RTL-Sprachen

`ai-i18n-tools` exportiert `getTextDirection(lng)` und `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` setzt `document.documentElement.dir` (Browser) oder ist ein No-Op (Node.js). Übergeben Sie ein optionales `element` Argument, um ein bestimmtes Element anzusprechen.

Für Strings, die `→` Pfeile enthalten können, drehen Sie sie für RTL-Layouts um:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Workflow 2 - Dokumentübersetzung

Entwickelt für Markdown-Dokumentation, Docusaurus-Websites und JSON-Beschriftungsdateien. Eigenständige SVG-Ressourcen werden über [`translate-svg`](#cli-reference) übersetzt, wenn `features.translateSVG` aktiviert ist und der oberste `svg`-Block gesetzt ist – nicht über `documentations[].contentPaths`.

### Schritt 1: Initialisieren

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Bearbeiten Sie die generierte `ai-i18n-tools.config.json`:

- `sourceLocale` – Ausgangssprache (muss mit `defaultLocale` in `docusaurus.config.js` übereinstimmen).
- `targetLocales` – Array mit BCP-47-Locale-Codes (z. B. `["de", "fr", "es"]`).
- `cacheDir` – Gemeinsames SQLite-Cache-Verzeichnis für alle Dokumentations-Pipelines (und Standard-Log-Verzeichnis für `--write-logs`).
- `documentations` – Array mit Dokumentationsblöcken. Jeder Block hat optionale `description`, `contentPaths`, `outputDir`, optionale `jsonSource`, `markdownOutput`, `targetLocales`, `addFrontmatter` usw.
- `documentations[].description` – Optionale kurze Notiz für Maintainer (was dieser Block abdeckt). Falls gesetzt, erscheint sie in der `translate-docs`-Überschrift (`🌐 …: translating …`) und in den `status`-Abschnittsüberschriften.
- `documentations[].contentPaths` – Markdown/MDX-Quellverzeichnisse oder -Dateien (siehe auch `documentations[].jsonSource` für JSON-Labels).
- `documentations[].outputDir` – Übersetztes Ausgabestammverzeichnis für diesen Block.
- `documentations[].markdownOutput.style` – `"nested"` (Standard), `"docusaurus"` oder `"flat"` (siehe [Ausgabe-Layouts](#output-layouts)).

### Schritt 2: Dokumente übersetzen

```bash
npx ai-i18n-tools translate-docs
```

Dies übersetzt alle Dateien in jedem `documentations`-Block von `contentPaths` in alle effektiven Dokumentations-Lokalisierungen (Vereinigung der `targetLocales` jedes Blocks, wenn gesetzt, sonst die root `targetLocales`). Bereits übersetzte Segmente werden aus dem SQLite-Cache geliefert – nur neue oder geänderte Segmente werden an das LLM gesendet.

Um eine einzelne Lokalisierung zu übersetzen:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Um zu prüfen, was übersetzt werden muss:

```bash
npx ai-i18n-tools status
```

#### Cache-Verhalten und `translate-docs`-Flags

Die CLI führt **Datei-Tracking** in SQLite (Source-Hash pro Datei × Lokalisierung) und **Segment**-Zeilen (Hash × Lokalisierung pro übersetzbarem Abschnitt). Ein normaler Lauf überspringt eine Datei vollständig, wenn der getrackte Hash mit der aktuellen Quelle übereinstimmt **und** die Ausgabedatei bereits existiert; andernfalls wird die Datei verarbeitet und der Segment-Cache verwendet, sodass unveränderter Text nicht die API aufruft.

| Flag                     | Effekt                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(Standard)*              | Überspringe unveränderte Dateien, wenn Tracking + On-Disk-Ausgabe übereinstimmen; verwende Segment-Cache für den Rest.                                                                                                             |
| `-l, --locale <codes>`   | Durch Komma getrennte Zielsprachen (Standard gemäß `documentation.targetLocales` / `targetLocales`, wenn nicht angegeben).                                                                                           |
| `-p, --path` / `-f, --file` | Übersetze nur Markdown/JSON unter diesem Pfad (projektrelativ oder absolut); `--file` ist ein Alias für `--path`.                                                                                     |
| `--dry-run`              | Keine Dateischreibvorgänge und keine API-Aufrufe.                                                                                                                                                                       |
| `--type <kind>`          | Beschränkung auf `markdown` oder `json` (sonst beide, wenn in der Konfiguration aktiviert).                                                                                                                              |
| `--json-only` / `--no-json` | Übersetze nur JSON-Label-Dateien oder überspringe JSON und übersetze ausschließlich Markdown.                                                                                                                         |
| `-j, --concurrency <n>`  | Maximale parallele Zielsprachen (Standardwert aus Konfiguration oder integrierter CLI-Standard).                                                                                                                             |
| `-b, --batch-concurrency <n>` | Maximale parallele Batch-API-Aufrufe pro Datei (Dokumente; Standardwert aus Konfiguration oder CLI).                                                                                                                          |
| `--emphasis-placeholders` | Maskiere Markdown-Hervorhebungszeichen als Platzhalter vor der Übersetzung (optional; standardmäßig deaktiviert).                                                                                                         |
| `--debug-failed`         | Schreibe detaillierte `FAILED-TRANSLATION`-Protokolle unter `cacheDir`, wenn die Validierung fehlschlägt.                                                                                                                       |
| `--force-update`         | Verarbeite jede zutreffende Datei erneut (Extraktion, Neuzusammenstellung, Schreiben der Ausgaben), auch wenn das Dateitracking sie überspringen würde. **Der Segment-Cache wird weiterhin verwendet** – unveränderte Segmente werden nicht an das LLM gesendet.                   |
| `--force`                | Löscht das Dateitracking für jede verarbeitete Datei und **liest nicht** den Segment-Cache für die API-Übersetzung (vollständige Neuübersetzung). Neue Ergebnisse werden weiterhin **in den Segment-Cache geschrieben**.                 |
| `--stats`                | Zeige Segmentanzahlen, Anzahl der verfolgten Dateien und Segmentgesamtzahlen pro Sprache an, dann beende.                                                                                                                   |
| `--clear-cache [locale]` | Lösche zwischengespeicherte Übersetzungen (und Dateitracking): alle Sprachen oder eine einzelne Sprache, dann beende.                                                                                                            |
| `--prompt-format <mode>` | Wie jeder **Batch** von Segmenten an das Modell gesendet und analysiert wird (`xml`, `json-array` oder `json-object`). Standardwert ist **`json-array`**. Ändert nicht Extraktion, Platzhalter, Validierung, Cache oder Fallback-Verhalten – siehe [Batch-Prompt-Format](#batch-prompt-format). |

Sie können `--force` nicht mit `--force-update` kombinieren (sie schließen sich gegenseitig aus).

#### Batch-Prompt-Format

`translate-docs` sendet übersetzbare Segmente in **Batches** (gruppiert nach `batchSize` / `maxBatchChars`) an OpenRouter. Die **`--prompt-format`**-Option ändert nur das **Übertragungsformat** des Batches; die Segmentaufteilung, `PlaceholderHandler`-Token, Markdown-AST-Prüfungen, SQLite-Cache-Schlüssel und der pro-Segment-Fallback bei fehlgeschlagenem Batch-Parsing bleiben unverändert.

| Modus | Benutzernachricht | Modellantwort |
| ---- | ------------ | ----------- |
| **`xml`** | Pseudo-XML: ein `<seg id="N">…</seg>` pro Segment (mit XML-Escaping). | Nur `<t id="N">…</t>`-Blöcke, einer pro Segmentindex. |
| **`json-array`** (Standard) | Ein JSON-Array von Zeichenketten, ein Eintrag pro Segment in der Reihenfolge. | Ein JSON-Array der **gleichen Länge** (gleiche Reihenfolge). |
| **`json-object`** | Ein JSON-Objekt `{"0":"…","1":"…",…}`, das nach Segmentindex indiziert ist. | Ein JSON-Objekt mit den **gleichen Schlüsseln** und übersetzten Werten. |

Der Ausführungsheader gibt auch `Batch prompt format: …` aus, sodass Sie den aktiven Modus überprüfen können. JSON-Beschriftungsdateien (`jsonSource`) und eigenständige SVG-Batches verwenden dieselbe Einstellung, wenn diese Schritte als Teil von `translate-docs` ausgeführt werden (oder in der Dokumentationsphase von `sync` — `sync` stellt dieses Flag nicht bereit; es ist standardmäßig auf **`json-array`** gesetzt).

**Segment-Deduplizierung und Pfade in SQLite**

- Segmentzeilen sind global über `(source_hash, locale)` indiziert (Hash = normalisierter Inhalt). Identischer Text in zwei Dateien teilt sich eine Zeile; `translations.filepath` ist Metadaten (letzter Schreiber), kein zweiter Cache-Eintrag pro Datei.
- `file_tracking.filepath` verwendet namensraumbezogene Schlüssel: `doc-block:{index}:{relPath}` pro `documentations`-Block (`relPath` ist posix-Pfad relativ zum Projektstamm: Markdown-Pfade wie gesammelt; **JSON-Beschriftungsdateien verwenden den zum aktuellen Arbeitsverzeichnis relativen Pfad zur Quelldatei**, z. B. `docs-site/i18n/en/code.json`, sodass Cleanup die echte Datei auflösen kann) und `svg-assets:{relPath}` für eigenständige SVG-Assets unter `translate-svg`.
- `translations.filepath` speichert zum aktuellen Arbeitsverzeichnis relative posix-Pfade für Markdown-, JSON- und SVG-Segmente (SVG verwendet dieselbe Pfadstruktur wie andere Assets; das Präfix `svg-assets:…` existiert **nur** in `file_tracking`).
- Nach einem Lauf wird `last_hit_at` nur für Segmentzeilen **im gleichen Übersetzungsbereich** gelöscht (unter Berücksichtigung von `--path` und aktivierten Typen), die nicht getroffen wurden, sodass ein gefilterter oder nur-Dokumente-Lauf keine unabhängigen Dateien als veraltet markiert.

### Ausgabe-Layouts

`"nested"` (Standard, wenn nicht angegeben) — spiegelt die Quellstruktur unter `{outputDir}/{locale}/` wider (z. B. `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — platziert Dateien, die sich unter `docsRoot` befinden, unter `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, entsprechend dem üblichen Docusaurus-i18n-Layout. Setzen Sie `documentations[].markdownOutput.docsRoot` auf die Wurzel Ihres Dokumentationsquellverzeichnisses (z. B. `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` – platziert übersetzte Dateien neben der Quelle mit einem Ländersuffix oder in einem Unterverzeichnis. Relative Links zwischen Seiten werden automatisch umgeschrieben.

```
docs/guide.md → i18n/guide.de.md
```

Sie können Pfade vollständig mit `documentations[].markdownOutput.pathTemplate` überschreiben. Platzhalter: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Kombinierter Workflow (UI + Dokumentation)

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

`glossary.uiGlossary` richtet die Dokumentübersetzung auf dasselbe `strings.json`-Katalog wie die UI aus, damit die Terminologie konsistent bleibt; `glossary.userGlossary` fügt CSV-Überschreibungen für Produktbegriffe hinzu.

Führen Sie `npx ai-i18n-tools sync` aus, um eine Pipeline auszuführen: **Extrahieren** von UI-Texten (wenn `features.extractUIStrings`), **Übersetzen** der UI-Texte (wenn `features.translateUIStrings`), **Übersetzen eigenständiger SVG-Ressourcen** (wenn `features.translateSVG` und ein `svg`-Block gesetzt sind) und anschließend **Übersetzen der Dokumentation** (jeder `documentations`-Block: Markdown/JSON wie konfiguriert). Überspringen Sie Teile mit `--no-ui`, `--no-svg` oder `--no-docs`. Der Dokumentationsschritt akzeptiert `--dry-run`, `-p` / `--path`, `--force` und `--force-update` (die letzten beiden gelten nur, wenn die Dokumentenübersetzung ausgeführt wird; sie werden ignoriert, wenn `--no-docs` angegeben wird).

Verwenden Sie `documentations[].targetLocales` in einem Block, um die Dateien dieses Blocks in ein **kleineres Teilset** als die UI zu übersetzen (effektive Dokumentationsgebiete sind die **Vereinigung** über die Blöcke):

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

---

## Konfigurationsreferenz

### `sourceLocale`

BCP-47-Code für die Quellsprache (z. B. `"en-GB"`, `"en"`, `"pt-BR"`). Für dieses Gebietsschema wird keine Übersetzungsdatei generiert - der Schlüsselstring selbst ist der Quelltext.

**Muss übereinstimmen** mit `SOURCE_LOCALE`, das aus Ihrer Runtime-i18n-Setup-Datei (`src/i18n.ts` / `src/i18n.js`) exportiert wird.

### `targetLocales`

Array von BCP-47-Lokalisierungscodes, in die übersetzt werden soll (z. B. `["de", "fr", "es", "pt-BR"]`).

`targetLocales` ist die primäre Lokalisierungsliste für die UI-Übersetzung und die Standardlokalisierungsliste für Dokumentationsblöcke. Verwenden Sie `generate-ui-languages`, um das `ui-languages.json`-Manifest aus `sourceLocale` + `targetLocales` zu erstellen.

### `uiLanguagesPath` (optional)

Pfad zum `ui-languages.json`-Manifest, das für Anzeigenamen, Lokalisierungsfilterung und Nachbearbeitung der Sprachliste verwendet wird. Wenn dieser weggelassen wird, sucht die CLI nach dem Manifest unter `ui.flatOutputDir/ui-languages.json`.

Verwenden Sie dies, wenn:

- Das Manifest befindet sich außerhalb von `ui.flatOutputDir`, und Sie müssen die CLI explizit darauf verweisen.
- Sie möchten, dass `markdownOutput.postProcessing.languageListBlock` Lokalisierungsbezeichnungen aus dem Manifest erstellt.
- `extract` sollte `englishName`-Einträge aus dem Manifest in `strings.json` zusammenführen (erfordert `ui.reactExtractor.includeUiLanguageEnglishNames: true`).

### `concurrency` (optional)

Maximale **Zielgebiete**, die gleichzeitig übersetzt werden (`translate-ui`, `translate-docs`, `translate-svg` und die entsprechenden Schritte innerhalb von `sync`). Wenn weggelassen, verwendet die CLI **4** für die UI-Übersetzung und **3** für die Dokumentationsübersetzung (eingebaute Standardwerte). Überschreiben Sie pro Ausführung mit `-j` / `--concurrency`.

### `batchConcurrency` (optional)

**Übersetzen-Dokumente** und **Übersetzen-SVG** (und der Dokumentationsschritt von `sync`): maximale parallele OpenRouter **Batch**-Anfragen pro Datei (jeder Batch kann viele Segmente enthalten). Standard **4**, wenn weggelassen. Von `translate-ui` ignoriert. Überschreiben mit `-b` / `--batch-concurrency`. Bei `sync` gilt `-b` nur für den Dokumentationsübersetzungsschritt.

### `batchSize` / `maxBatchChars` (optional)

Segment-Batching für die Dokumentenübersetzung: wie viele Segmente pro API-Anfrage und eine Zeichenobergrenze. Standardwerte: **20** Segmente, **4096** Zeichen (wenn weggelassen).

### `openrouter`

| Feld               | Beschreibung                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | OpenRouter-API-Basis-URL. Standard: `https://openrouter.ai/api/v1`.                        |
| `translationModels` | Bevorzugte, geordnete Liste von Modell-IDs. Das erste wird zuerst versucht; spätere Einträge dienen als Fallback bei Fehlern. Für `translate-ui`** können Sie zusätzlich `ui.preferredModel` setzen, um ein Modell vor dieser Liste zu versuchen (siehe `ui`). |
| `defaultModel`      | Veraltetes einzelnes primäres Modell. Wird nur verwendet, wenn `translationModels` nicht gesetzt oder leer ist.       |
| `fallbackModel`     | Veraltetes einzelnes Fallback-Modell. Wird nach `defaultModel` verwendet, wenn `translationModels` nicht gesetzt oder leer ist. |
| `maxTokens`         | Maximale Anzahl an Completion-Tokens pro Anfrage. Standard: `8192`.                                      |
| `temperature`       | Sampling-Temperatur. Standard: `0.2`.                                                    |

**Warum mehrere Modelle verwenden:** Verschiedene Anbieter und Modelle haben unterschiedliche Kosten und bieten unterschiedliche Qualitätsniveaus für Sprachen und Regionen. Konfigurieren Sie **`openrouter.translationModels` als geordnete Fallback-Kette** (anstatt ein einzelnes Modell), damit die CLI das nächste Modell versuchen kann, falls eine Anfrage fehlschlägt.

Behandeln Sie die Liste unten als **Grundlage**, die Sie erweitern können: Wenn die Übersetzung für eine bestimmte Region schlecht oder erfolglos ist, recherchieren Sie, welche Modelle diese Sprache oder Schrift effektiv unterstützen (verweisen Sie auf Online-Ressourcen oder die Dokumentation Ihres Anbieters) und fügen Sie diese OpenRouter-IDs als weitere Alternativen hinzu.

Diese Liste wurde im **April 2026** auf **breite Abdeckung verschiedener Regionen** getestet (z. B. im Transrewrt-Projekt zur Übersetzung von **36** Zielregionen); sie dient als praktischer Standardwert, ist jedoch nicht für jede Region optimal.

Beispiel `translationModels` (identisch mit `npx ai-i18n-tools init` und den Beispielen des Pakets):

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

Setzen Sie `OPENROUTER_API_KEY` in Ihrer Umgebung oder `.env`-Datei.

### `features`

| Feld | Ablauf | Beschreibung |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings` | 1 | Quelle nach `t("…")` / `i18n.t("…")` durchsuchen, optionale `package.json`-Beschreibung und (falls aktiviert) `ui-languages.json` `englishName`-Werte in `strings.json` zusammenführen. |
| `translateUIStrings` | 1 | `strings.json`-Einträge übersetzen und pro-Lokalisierung JSON-Dateien schreiben. |
| `translateMarkdown` | 2 | `.md` / `.mdx`-Dateien übersetzen. |
| `translateJSON` | 2 | Docusaurus JSON-Beschriftungsdateien übersetzen. |
| `translateSVG` | 2 | Eigenständige `.svg`-Ressourcen übersetzen (erfordert den obersten `svg`-Block). |

Übersetzen Sie **eigenständige** SVG-Ressourcen mit `translate-svg`, wenn `features.translateSVG` wahr ist und ein oberster `svg`-Block konfiguriert ist. Der `sync`-Befehl führt diesen Schritt aus, wenn beide Bedingungen erfüllt sind (es sei denn, `--no-svg` wird verwendet).

### `ui`

| Feld | Beschreibung |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots` | Verzeichnisse (relativ zum Arbeitsverzeichnis), die nach `t("…")`-Aufrufen durchsucht werden. |
| `stringsJson` | Pfad zur Master-Katalogdatei. Wird von `extract` aktualisiert. |
| `flatOutputDir` | Verzeichnis, in das pro-Lokalisierung JSON-Dateien geschrieben werden (`de.json`, usw.). |
| `preferredModel` | Optional. OpenRouter-Modell-ID, die zuerst nur für `translate-ui` versucht wird; danach `openrouter.translationModels` (oder ältere Modelle) in der Reihenfolge, ohne diese ID zu duplizieren. |
| `reactExtractor.funcNames` | Zusätzliche Funktionsnamen, die durchsucht werden sollen (Standard: `["t", "i18n.t"]`). |
| `reactExtractor.extensions` | Dateierweiterungen, die einbezogen werden sollen (Standard: `[".js", ".jsx", ".ts", ".tsx"]`). |
| `reactExtractor.includePackageDescription` | Wenn `true` (Standard), schließt `extract` auch `package.json` `description` als UI-Text ein, falls vorhanden. |
| `reactExtractor.packageJsonPath` | Benutzerdefinierter Pfad zur `package.json`-Datei, die für die optionale Beschreibungsextraktion verwendet wird. |
| `reactExtractor.includeUiLanguageEnglishNames` | Wenn `true` (Standard `false`), fügt `extract` auch jeden `englishName` aus dem Manifest unter `uiLanguagesPath` zu `strings.json` hinzu, sofern er nicht bereits aus der Quellensuche vorhanden ist (gleiche Hash-Schlüssel). Erfordert `uiLanguagesPath`, das auf ein gültiges `ui-languages.json` verweist. |

### `cacheDir`

| Feld | Beschreibung |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite-Cache-Verzeichnis (gemeinsam genutzt von allen `documentations`-Blöcken). Wiederverwendung zwischen Ausführungen. Wenn Sie von einem benutzerdefinierten Dokumentationsübersetzungs-Cache migrieren, archivieren oder löschen Sie diesen — `cacheDir` erstellt seine eigene SQLite-Datenbank und ist nicht mit anderen Schemata kompatibel. |

### `documentations`

Array von Dokumentationspipeline-Blöcken. `translate-docs` und die Dokumentationsphase des `sync`-Prozesses **verarbeiten** jeden Block der Reihe nach.

| Feld | Beschreibung |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description` | Optionale, menschenlesbare Notiz für diesen Block (wird nicht für die Übersetzung verwendet). Wird in der `translate-docs`-Überschrift mit `🌐` präfixiert, wenn gesetzt; wird auch in den Überschriften des `status`-Abschnitts angezeigt. |
| `contentPaths` | Zu übersetzende Markdown-/MDX-Quellen (`translate-docs` durchsucht diese nach `.md` / `.mdx`). Die JSON-Bezeichnungen stammen aus `jsonSource` im selben Block. |
| `outputDir` | Stammverzeichnis für die übersetzte Ausgabe dieses Blocks. |
| `sourceFiles` | Optionaler Alias, der bei Laden in `contentPaths` zusammengeführt wird. |
| `targetLocales` | Optionale Teilmenge der Sprachcodes nur für diesen Block (sonst wird die globale `targetLocales` verwendet). Die effektiven Dokumentationssprachen ergeben sich als Vereinigung über alle Blöcke. |
| `jsonSource` | Quellverzeichnis für Docusaurus-JSON-Bezeichnungsdateien für diesen Block (z. B. `"i18n/en"`). |
| `markdownOutput.style` | `"nested"` (Standard), `"docusaurus"` oder `"flat"`. |
| `markdownOutput.docsRoot` | Quellverzeichnis der Dokumentation für das Docusaurus-Layout (z. B. `"docs"`). |
| `markdownOutput.pathTemplate` | Benutzerdefinierter Pfad für die Markdown-Ausgabe. Platzhalter: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>. |
| `markdownOutput.jsonPathTemplate` | Benutzerdefinierter Ausgabepfad für Bezeichnungsdateien im JSON-Format. Unterstützt dieselben Platzhalter wie `pathTemplate`. |
| `markdownOutput.flatPreserveRelativeDir` | Bei `flat`-Stil: Beibehaltung der Quellunterverzeichnisse, damit Dateien mit gleichem Basisnamen nicht kollidieren. |
| `markdownOutput.rewriteRelativeLinks` | Relative Links nach der Übersetzung neu schreiben (automatisch aktiviert beim `flat`-Stil). |
| `markdownOutput.linkRewriteDocsRoot` | Repository-Stammverzeichnis, das bei der Berechnung der Präfixe für die flache Link-Umschreibung verwendet wird. Normalerweise `"."` belassen, es sei denn, die übersetzten Dokumente befinden sich unter einer anderen Projektwurzel. |
| `markdownOutput.postProcessing` | Optionale Transformationen des übersetzten Markdown-**body** (YAML-Front Matter bleibt erhalten). Wird ausgeführt nach der Segmentzusammenfügung und der Umschreibung flacher Links, aber vor `addFrontmatter`. |
| `markdownOutput.postProcessing.regexAdjustments` | Geordnete Liste von `{ "description"?, "search", "replace" }`. `search` ist ein regulärer Ausdruck (reiner String verwendet das Flag `g`, oder `/Muster/Flags`). `replace` unterstützt Platzhalter wie `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` (ähnlich wie in der Referenz `additional-adjustments`). |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — der Übersetzer sucht die erste Zeile, die `start` enthält, und die passende `end`-Zeile, und ersetzt diesen Bereich dann durch einen kanonischen Sprachumschalter. Die Links werden relativ zum übersetzten Dateipfad erstellt; die Bezeichnungen stammen aus `uiLanguagesPath` / `ui-languages.json`, falls konfiguriert, andernfalls aus `localeDisplayNames` und den Sprachcodes. |
| `addFrontmatter` | Wenn `true` (Standard, wenn nicht angegeben), enthalten die übersetzten Markdown-Dateien YAML-Schlüssel: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path` und, falls mindestens ein Segment über Modell-Metadaten verfügt, `translation_models` (sortierte Liste der verwendeten OpenRouter-Modell-IDs). Auf `false` setzen, um zu überspringen. |

Beispiel (flache README-Pipeline — Screenshot-Pfade + optionaler Sprachlisten-Wrapper):

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
      "separator": " · "
    }
  }
}
```

### `svg` (optional)

Oberste Pfade und Layout für eigenständige SVG-Ressourcen. Die Übersetzung wird nur ausgeführt, wenn **`features.translateSVG`** wahr ist (über `translate-svg` oder die SVG-Phase von `sync`).

| Feld                       | Beschreibung |
| --------------------------- | ----------- |
| `sourcePath`                | Ein Verzeichnis oder ein Array von Verzeichnissen, die rekursiv nach `.svg`-Dateien durchsucht werden. |
| `outputDir`                 | Wurzelverzeichnis für die übersetzten SVG-Ausgaben. |
| `style`                     | `"flat"` oder `"nested"`, wenn `pathTemplate` nicht gesetzt ist. |
| `pathTemplate`              | Benutzerdefinierter SVG-Ausgabepfad. Platzhalter: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Kleinbuchstabige übersetzte Texte bei der SVG-Zusammenstellung. Nützlich für Designs, die auf vollständig kleingeschriebenen Beschriftungen basieren. |

### `glossary`

| Feld | Beschreibung |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary` | Pfad zu `strings.json` – erstellt automatisch ein Glossar aus vorhandenen Übersetzungen. |
| `userGlossary` | Pfad zu einer CSV-Datei mit den Spalten `Original language string` (oder `en`), `locale`, `Translation` – eine Zeile pro Quellbegriff und Zielsprache (`locale` kann `*` für alle Ziele sein). |

Der veraltete Schlüssel `uiGlossaryFromStringsJson` wird weiterhin akzeptiert und beim Laden der Konfiguration auf `uiGlossary` abgebildet.

Generiere eine leere Glossar-CSV:

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLI-Referenz

| Befehl                                                                   | Beschreibung                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`                                                                 | Gibt die CLI-Version und den Build-Zeitstempel aus (dieselben Informationen wie `-V` / `--version` im Hauptprogramm).                                                                                                                                                                                                  |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | Schreibt eine Startkonfigurationsdatei (enthält `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` und `documentations[].addFrontmatter`). `--with-translate-ignore` erstellt eine Start-`.translate-ignore`.                                                                            |
| `extract`                                                                 | Aktualisiert `strings.json` aus `t("…")` / `i18n.t("…")`-Literalen, einer optionalen `package.json`-Beschreibung und optionalen Manifest-`englishName`-Einträgen (siehe `ui.reactExtractor`). Erfordert `features.extractUIStrings`.                                                                                                                                                                                                    |
| `generate-ui-languages [--master <path>] [--dry-run]`                     | Schreibt `ui-languages.json` nach `ui.flatOutputDir` (oder `uiLanguagesPath`, falls gesetzt) mithilfe von `sourceLocale` + `targetLocales` und der gebündelten `data/ui-languages-complete.json` (oder `--master`). Warnt und gibt `TODO`-Platzhalter für Sprachvarianten aus, die in der Masterdatei fehlen. Wenn Sie ein bestehendes Manifest mit angepassten `label`- oder `englishName`-Werten haben, werden diese durch die Standardwerte des Masterkatalogs ersetzt – überprüfen und passen Sie die generierte Datei danach entsprechend an. |
| `translate-docs …`                                                        | Übersetzt Markdown/MDX und JSON für jeden `documentations`-Block (`contentPaths`, optional `jsonSource`). `-j`: maximale parallele Sprachvarianten; `-b`: maximale parallele Batch-API-Aufrufe pro Datei. `--prompt-format`: Batch-Übertragungsformat (`xml` \| `json-array` \| `json-object`). Siehe [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags) und [Batch-Prompt-Format](#batch-prompt-format). |
| `translate-svg …`                                                         | Übersetzt eigenständige SVG-Assets, die in `config.svg` konfiguriert sind (getrennt von Dokumentation). Erfordert `features.translateSVG`. Gleiche Cache-Überlegungen wie bei Dokumentation; unterstützt `--no-cache`, um SQLite-Lese-/Schreibvorgänge für diesen Durchlauf zu überspringen. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | Übersetzt nur die Benutzeroberflächenzeichenfolgen. `--force`: übersetzt alle Einträge pro Sprachvariante erneut (ignoriert vorhandene Übersetzungen). `--dry-run`: keine Schreibvorgänge, keine API-Aufrufe. `-j`: maximale parallele Sprachvarianten. Erfordert `features.translateUIStrings`.                                                                                 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | Exportiert `strings.json` nach XLIFF 2.0 (eine `.xliff` pro Zielsprachvariante). `-o` / `--output-dir`: Ausgabeverzeichnis (Standard: derselbe Ordner wie der Katalog). `--untranslated-only`: nur Einheiten ohne Übersetzung für diese Sprachvariante. Nur-Lesezugriff; keine API.                                                        |
| `sync …`                                                                  | Extrahiert (falls aktiviert), dann UI-Übersetzung, dann `translate-svg`, wenn `features.translateSVG` und `config.svg` gesetzt sind, dann Dokumentationsübersetzung – es sei denn, sie wird mit `--no-ui`, `--no-svg` oder `--no-docs` übersprungen. Gemeinsame Flags: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (nur Dokumentations-Batching), `--force` / `--force-update` (nur Dokumentation; sich gegenseitig ausschließend, wenn Dokumentation läuft). Die Dokumentationsphase leitet auch `--emphasis-placeholders` und `--debug-failed` weiter (gleiche Bedeutung wie `translate-docs`). `--prompt-format` ist kein `sync`-Flag; der Dokumentationsschritt verwendet den integrierten Standard (`json-array`).                         |
| `status [--max-columns <n>]`                                   | Wenn `features.translateUIStrings` aktiviert ist, gibt es die UI-Abdeckung pro Sprachvariante aus (`Translated` / `Missing` / `Total`). Danach gibt es den Markdown-Übersetzungsstatus pro Datei × Sprachvariante aus (kein `--locale`-Filter; Sprachvarianten stammen aus der Konfiguration). Große Sprachvariantenlisten werden in wiederholte Tabellen mit bis zu `n` Spalten pro Sprachvariante aufgeteilt (Standard **9**), damit die Zeilen im Terminal schmal bleiben.                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | Führt zuerst `sync --force-update` aus (Extraktion, UI, SVG, Dokumentation), entfernt dann veraltete Segmentzeilen (null `last_hit_at` / leerer Dateipfad); löscht `file_tracking`-Zeilen, deren aufgelöster Quellpfad auf dem Datenträger fehlt; entfernt Übersetzungszeilen, deren `filepath`-Metadaten auf eine fehlende Datei verweisen. Protokolliert drei Zähler (veraltet, verwaiste `file_tracking`, verwaiste Übersetzungen). Erstellt eine zeitgestempelte SQLite-Sicherung im Cache-Verzeichnis, es sei denn, `--no-backup` ist gesetzt. |
| `editor [-p <port>] [--no-open]`                                          | Startet einen lokalen Web-Editor für den Cache, `strings.json` und die Glossar-CSV-Datei. `--no-open`: öffnet nicht automatisch den Standardbrowser.<br><br>**Hinweis:** Wenn Sie einen Eintrag im Cache-Editor bearbeiten, müssen Sie ein `sync --force-update` ausführen, um die Ausgabedateien mit dem aktualisierten Cache-Eintrag neu zu schreiben. Außerdem geht die manuelle Bearbeitung verloren, wenn sich der Quelltext später ändert, da ein neuer Cache-Schlüssel generiert wird. |
| `glossary-generate [-o <path>]`                                           | Schreibt eine leere `glossary-user.csv`-Vorlage. `-o`: überschreibt den Ausgabepfad (Standard: `glossary.userGlossary` aus der Konfiguration oder `glossary-user.csv`).                                                                                                                                                |

Alle Befehle akzeptieren `-c <path>`, um eine abweichende Konfigurationsdatei anzugeben, `-v` für ausführliche Ausgabe und `-w` / `--write-logs [path]` zum Weiterleiten der Konsolenausgabe in eine Protokolldatei (Standardpfad: unterhalb von root `cacheDir`). Das Hauptprogramm unterstützt außerdem `-V` / `--version` und `-h` / `--help`; `ai-i18n-tools help [command]` zeigt dieselbe, pro Befehl gültige Nutzungshinweise wie `ai-i18n-tools <command> --help`.

---

## Umgebungsvariablen

| Variable               | Beschreibung                                               |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Erforderlich.** Ihr OpenRouter API-Schlüssel.            |
| `OPENROUTER_BASE_URL`  | Überschreiben Sie die API-Basis-URL.                      |
| `I18N_SOURCE_LOCALE`   | Überschreiben Sie `sourceLocale` zur Laufzeit.            |
| `I18N_TARGET_LOCALES`  | Komma-getrennte Gebietsschema-Codes zum Überschreiben von `targetLocales`. |
| `I18N_LOG_LEVEL`       | Logger-Stufe (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Wenn `1`, deaktivieren Sie ANSI-Farben in der Protokollausgabe. |
| `I18N_LOG_SESSION_MAX` | Maximalzeilen, die pro Protokollsitzung gespeichert werden (Standard `5000`). |
