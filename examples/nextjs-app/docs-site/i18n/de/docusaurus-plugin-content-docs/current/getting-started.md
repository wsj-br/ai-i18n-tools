---
translation_last_updated: '2026-04-13T00:28:34.181Z'
source_file_mtime: '2026-04-13T00:28:15.565Z'
source_file_hash: c8918e0004d77e154c0fa0f750e67e8d78e9c673ca048942b309582cb3f5c8b8
translation_language: de
source_file_path: docs-site/docs/getting-started.md
---
# ai-i18n-tools: Erste Schritte

`ai-i18n-tools` bietet zwei unabhängige, zusammensetzbare Workflows:

- **Workflow 1 - UI-Übersetzung**: Extrahiere `t("…")`-Aufrufe aus beliebigen JS/TS-Quellen, übersetze sie über OpenRouter und schreibe flache JSON-Dateien pro Locale, die für i18next bereit sind.
- **Workflow 2 - Dokumentenübersetzung**: Übersetze Markdown (MDX) und Docusaurus JSON-Labeldateien in beliebig viele Locales mit intelligentem Caching. **SVG**-Assets verwenden einen separaten Befehl (`translate-svg`) und eine optionale `svg`-Konfiguration (siehe [CLI-Referenz](#cli-reference)).

Beide Workflows verwenden OpenRouter (jede kompatible LLM) und teilen sich eine einzige Konfigurationsdatei.

<small>**In anderen Sprachen lesen:** </small>
<small id="lang-list">[en-GB](./GETTING_STARTED.md) · [de](../translated-docs/docs/GETTING_STARTED.de.md) · [es](../translated-docs/docs/GETTING_STARTED.es.md) · [fr](../translated-docs/docs/GETTING_STARTED.fr.md) · [hi](../translated-docs/docs/GETTING_STARTED.hi.md) · [ja](../translated-docs/docs/GETTING_STARTED.ja.md) · [ko](../translated-docs/docs/GETTING_STARTED.ko.md) · [pt-BR](../translated-docs/docs/GETTING_STARTED.pt-BR.md) · [zh-CN](../translated-docs/docs/GETTING_STARTED.zh-CN.md) · [zh-TW](../translated-docs/docs/GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Inhaltsverzeichnis**

- [Installation](#installation)
- [Schnellstart](#quick-start)
- [Workflow 1 - UI-Übersetzung](#workflow-1---ui-translation)
  - [Schritt 1: Initialisieren](#step-1-initialise)
  - [Schritt 2: Strings extrahieren](#step-2-extract-strings)
  - [Schritt 3: UI-Strings übersetzen](#step-3-translate-ui-strings)
  - [Schritt 4: i18next zur Laufzeit verbinden](#step-4-wire-i18next-at-runtime)
  - [Verwendung von `t()` im Quellcode](#using-t-in-source-code)
  - [Interpolation](#interpolation)
  - [Spracheinstellungen UI](#language-switcher-ui)
  - [RTL-Sprachen](#rtl-languages)
- [Workflow 2 - Dokumentenübersetzung](#workflow-2---document-translation)
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

## Installation {#installation}

Das veröffentlichte Paket ist **nur ESM**. Verwende `import`/`import()` in Node.js oder deinem Bundler; **verwende nicht `require('ai-i18n-tools')`.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

Setze deinen OpenRouter API-Schlüssel:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Oder erstelle eine `.env`-Datei im Projektstamm:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## Schnellstart {#quick-start}

Die Standard-`init`-Vorlage (`ui-markdown`) ermöglicht nur die **UI**-Extraktion und -Übersetzung. Die `ui-docusaurus`-Vorlage ermöglicht die **Dokumenten**-Übersetzung (`translate-docs`). Verwende `sync`, wenn du einen Befehl möchtest, der Extraktion, UI-Übersetzung, optionale eigenständige SVG-Übersetzung und Dokumentationsübersetzung gemäß deiner Konfiguration ausführt.

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

## Workflow 1 - UI-Übersetzung {#workflow-1---ui-translation}

Entwickelt für jedes JS/TS-Projekt, das i18next verwendet: React-Apps, Next.js (Client- und Serverkomponenten), Node.js-Dienste, CLI-Tools.

### Schritt 1: Initialisieren {#step-1-initialise}

```bash
npx ai-i18n-tools init
```

Dies schreibt `ai-i18n-tools.config.json` mit der `ui-markdown`-Vorlage. Bearbeite es, um festzulegen:

- `sourceLocale` - Ihr Quellsprache BCP-47-Code (z.B. `"en-GB"`). **Muss übereinstimmen** mit `SOURCE_LOCALE`, das aus Ihrer Laufzeit-i18n-Setup-Datei exportiert wurde (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - Pfad zu Ihrem `ui-languages.json` Manifest ODER ein Array von BCP-47-Codes.
- `ui.sourceRoots` - Verzeichnisse, die nach `t("…")` Aufrufen durchsucht werden sollen (z.B. `["src/"]`).
- `ui.stringsJson` - wo das Master-Katalog geschrieben werden soll (z.B. `"src/locales/strings.json"`).
- `ui.flatOutputDir` - wo `de.json`, `pt-BR.json` usw. geschrieben werden sollen (z.B. `"src/locales/"`).
- `ui.preferredModel` (optional) - OpenRouter-Modell-ID, die **zuerst** für `translate-ui` versucht wird; im Falle eines Fehlers fährt die CLI mit `openrouter.translationModels` (oder dem veralteten `defaultModel` / `fallbackModel`) in der Reihenfolge fort und überspringt Duplikate.

### Schritt 2: Strings extrahieren {#step-2-extract-strings}

```bash
npx ai-i18n-tools extract
```

Durchsucht alle JS/TS-Dateien unter `ui.sourceRoots` nach `t("literal")` und `i18n.t("literal")` Aufrufen. Schreibt (oder fügt hinzu) in `ui.stringsJson`.

Der Scanner ist konfigurierbar: Fügen Sie benutzerdefinierte Funktionsnamen über `ui.reactExtractor.funcNames` hinzu.

### Schritt 3: UI-Strings übersetzen {#step-3-translate-ui-strings}

```bash
npx ai-i18n-tools translate-ui
```

Liest `strings.json`, sendet Batches an OpenRouter für jede Zielsprache, schreibt flache JSON-Dateien (`de.json`, `fr.json` usw.) in `ui.flatOutputDir`. Wenn `ui.preferredModel` gesetzt ist, wird dieses Modell vor der geordneten Liste in `openrouter.translationModels` versucht (Dokumentübersetzung und andere Befehle verwenden weiterhin nur `openrouter`).

Für jeden Eintrag speichert `translate-ui` die **OpenRouter-Modell-ID**, die erfolgreich jede Sprache in einem optionalen `models`-Objekt (gleiche Sprachschlüssel wie `translated`) übersetzt hat. Strings, die im lokalen `editor`-Befehl bearbeitet wurden, sind mit dem Sentinel-Wert `user-edited` in `models` für diese Sprache gekennzeichnet. Die pro-Locale-Flachdateien unter `ui.flatOutputDir` bleiben **Quellstring → Übersetzung** nur; sie enthalten keine `models` (so bleiben die Laufzeitpakete unverändert).

> **Hinweis zur Verwendung des Cache-Editors:** Wenn Sie einen Eintrag im Cache-Editor bearbeiten, müssen Sie einen `sync --force-update` (oder den entsprechenden `translate` Befehl mit `--force-update`) ausführen, um die Ausgabedateien mit dem aktualisierten Cache-Eintrag neu zu schreiben. Denken Sie auch daran, dass, wenn sich der Quelltext später ändert, Ihre manuelle Bearbeitung verloren geht, da ein neuer Cache-Schlüssel (Hash) für den neuen Quellstring generiert wird.

### Schritt 4: i18next zur Laufzeit verbinden {#step-4-wire-i18next-at-runtime}

Erstellen Sie Ihre i18n-Setup-Datei mit den von `'ai-i18n-tools/runtime'` exportierten Hilfsfunktionen:

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

Importieren Sie `i18n.js`, bevor React rendert (z.B. am Anfang Ihres Einstiegspunkts). Wenn der Benutzer die Sprache ändert, rufen Sie `await loadLocale(code)` und dann `i18n.changeLanguage(code)` auf.

`SOURCE_LOCALE` wird exportiert, sodass jede andere Datei, die es benötigt (z.B. ein Sprachumschalter), es direkt von `'./i18n'` importieren kann.

`defaultI18nInitOptions(sourceLocale)` gibt die Standardoptionen für Schlüssel-als-Standard-Setups zurück:

- `parseMissingKeyHandler` gibt den Schlüssel selbst zurück, sodass nicht übersetzte Strings den Quelltext anzeigen.
- `nsSeparator: false` erlaubt Schlüssel, die Doppelpunkte enthalten.
- `interpolation.escapeValue: false` - sicher zu deaktivieren: React entkommt Werten selbst, und Node.js/CLI-Ausgaben haben kein HTML, das entkommen werden muss.

`wrapI18nWithKeyTrim(i18n)` umschließt `i18n.t`, sodass: (1) Schlüssel vor der Suche getrimmt werden, was der Art und Weise entspricht, wie das Extraktionsskript sie speichert; (2) <code>{"{{var}}"}</code> Interpolation angewendet wird, wenn die Quellsprache den Rohschlüssel zurückgibt - sodass <code>{"t('Hallo {{name}}', { name })"}</code> auch für die Quellsprache korrekt funktioniert.

`makeLoadLocale(i18n, loaders, sourceLocale)` gibt eine asynchrone `loadLocale(lang)`-Funktion zurück, die das JSON-Bündel für eine Sprache dynamisch importiert und es bei i18next registriert.

### Verwendung von `t()` im Quellcode {#using-t-in-source-code}

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
- Der Schlüssel muss ein **Literal-String** sein – keine Variablen oder Ausdrücke als Schlüssel.
- Verwende keine Template-Literale für den Schlüssel: <code>{'t(`Hello ${name}`)'}</code> ist nicht extrahierbar.

### Interpolation {#interpolation}

Verwende die native Interpolation von i18next mit dem zweiten Argument für <code>{"{{var}}"}</code>-Platzhalter:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Das Extraktionsskript ignoriert das zweite Argument – nur der Literal-String-Schlüssel <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code> wird extrahiert und zur Übersetzung gesendet. Übersetzer werden angewiesen, die <code>{"{{...}}"}</code>-Tokens beizubehalten.

### Sprachumschalter-Benutzeroberfläche {#language-switcher-ui}

Verwende das Manifest `ui-languages.json`, um einen Sprachauswahl zu erstellen. `ai-i18n-tools` exportiert zwei Anzeige-Helfer:

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

`getUILanguageLabel(lang, t)` - zeigt `t(englishName)` an, wenn übersetzt, oder `englishName / t(englishName)`, wenn beide unterschiedlich sind. Geeignet für Einstellungsbildschirme.

`getUILanguageLabelNative(lang)` - zeigt `englishName / label` (kein `t()`-Aufruf in jeder Zeile) an. Geeignet für Kopfzeilenmenüs, in denen der native Name sichtbar sein soll.

Das `ui-languages.json`-Manifest ist ein JSON-Array von <code>{"{ code, label, englishName }"}</code>-Einträgen. Beispiel:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

Setze `targetLocales` in der Konfiguration auf den Pfad dieser Datei, damit der Übersetzungsbefehl dieselbe Liste verwendet.

### RTL-Sprachen {#rtl-languages}

`ai-i18n-tools` exportiert `getTextDirection(lng)` und `applyDirection(lng)`:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` setzt `document.documentElement.dir` (Browser) oder ist ein No-Op (Node.js). Übergebe ein optionales `element`-Argument, um ein bestimmtes Element anzusprechen.

Für Strings, die `→`-Pfeile enthalten können, drehe sie für RTL-Layouts um:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## Workflow 2 – Dokumentübersetzung {#workflow-2---document-translation}

Entworfen für Markdown-Dokumentation, Docusaurus-Seiten und JSON-Label-Dateien. SVG-Diagramme werden über [`translate-svg`](#cli-reference) und `svg` in der Konfiguration übersetzt, nicht über `documentations[].contentPaths`.

### Schritt 1: Initialisieren {#step-1-initialise-1}

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Bearbeite die generierte `ai-i18n-tools.config.json`:

- `sourceLocale` – Quellsprache (muss mit `defaultLocale` in `docusaurus.config.js` übereinstimmen).
- `targetLocales` – Array von Locale-Codes oder Pfad zu einem Manifest.
- `cacheDir` – gemeinsames SQLite-Cache-Verzeichnis für alle Dokumentations-Pipelines (und Standard-Log-Verzeichnis für `--write-logs`).
- `documentations` – Array von Dokumentationsblöcken. Jeder Block hat optional `description`, `contentPaths`, `outputDir`, optional `jsonSource`, `markdownOutput`, `targetLocales`, `injectTranslationMetadata`, usw.
- `documentations[].description` – optionale kurze Notiz für Maintainer (was dieser Block abdeckt). Wenn gesetzt, erscheint sie in der `translate-docs`-Überschrift (`🌐 …: translating …`) und in `status`-Abschnittsüberschriften.
- `documentations[].contentPaths` – Markdown/MDX-Quellverzeichnisse oder -dateien (siehe auch `documentations[].jsonSource` für JSON-Labels).
- `documentations[].outputDir` – Übersetzungs-Ausgabeverzeichnis für diesen Block.
- `documentations[].markdownOutput.style` – `"nested"` (Standard), `"docusaurus"` oder `"flat"` (siehe [Ausgabelayouts](#output-layouts)).

### Schritt 2: Dokumente übersetzen {#step-2-translate-documents}

```bash
npx ai-i18n-tools translate-docs
```

Dies übersetzt alle Dateien in jedem `documentations`-Block in den `contentPaths` in alle effektiven Dokumentationslokalitäten (Vereinigung jeder Block-`targetLocales`, wenn gesetzt, andernfalls die Wurzel-`targetLocales`). Bereits übersetzte Segmente werden aus dem SQLite-Cache bereitgestellt - nur neue oder geänderte Segmente werden an das LLM gesendet.

Um eine einzelne Locale zu übersetzen:

```bash
npx ai-i18n-tools translate-docs --locale de
```

Um zu überprüfen, was übersetzt werden muss:

```bash
npx ai-i18n-tools status
```

#### Cache-Verhalten und `translate-docs`-Flags {#cache-behaviour-and-translate-docs-flags}

Die CLI führt **Dateiverfolgung** in SQLite (Quell-Hash pro Datei × Locale) und **Segment**-Zeilen (Hash × Locale pro übersetzbarem Chunk) durch. Ein normaler Durchlauf überspringt eine Datei vollständig, wenn der verfolgte Hash mit der aktuellen Quelle übereinstimmt **und** die Ausgabedatei bereits existiert; andernfalls verarbeitet es die Datei und verwendet den Segment-Cache, sodass unveränderter Text die API nicht aufruft.

| Flag                     | Effekt                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(Standard)*              | Überspringen unveränderter Dateien beim Tracking + Übereinstimmung mit der Ausgabe auf der Festplatte; verwenden Sie den Segmentcache für den Rest.                                                                                                             |
| `--force-update`         | Verarbeitet jede übereinstimmende Datei erneut (extrahieren, neu zusammenstellen, Ausgaben schreiben), auch wenn das Dateitracking überspringen würde. **Segmentcache gilt weiterhin** - unveränderte Segmente werden nicht an das LLM gesendet.                   |
| `--force`                | Löscht das Dateitracking für jede verarbeitete Datei und **liest nicht** den Segmentcache für die API-Übersetzung (vollständige Neuübersetzung). Neue Ergebnisse werden weiterhin **in den Segmentcache geschrieben**.                 |
| `--stats`                | Gibt Segmentanzahlen, gezählte Dateien und Segmentgesamtzahlen pro Sprache aus und beendet dann.                                                                                                                   |
| `--clear-cache [locale]` | Löscht zwischengespeicherte Übersetzungen (und Dateitracking): alle Sprachen oder eine einzelne Sprache, und beendet dann.                                                                                                            |
| `--prompt-format <mode>` | Wie jede **Batch** von Segmenten an das Modell gesendet und analysiert wird (`xml`, `json-array` oder `json-object`). Standard **`xml`**. Ändert nicht das Extrahieren, Platzhalter, Validierung, Cache oder Fallback-Verhalten — siehe [Batch-Prompt-Format](#batch-prompt-format). |

Sie können `--force` nicht mit `--force-update` kombinieren (sie sind gegenseitig ausschließend).

#### Batch-Prompt-Format {#batch-prompt-format}

`translate-docs` sendet übersetzbare Segmente in **Batches** (gruppiert nach `batchSize` / `maxBatchChars`) an OpenRouter. Das **`--prompt-format`** Flag ändert nur das **Drahtformat** dieses Batches; Segmentaufteilung, `PlaceholderHandler`-Tokens, Markdown AST-Überprüfungen, SQLite-Cache-Schlüssel und Fallback pro Segment, wenn das Batch-Parsing fehlschlägt, bleiben unverändert.

| Modus | Benutzer-Nachricht | Modell-Antwort |
| ---- | ------------ | ----------- |
| **`xml`** (Standard) | Pseudo-XML: ein `<seg id="N">…</seg>` pro Segment (mit XML-Escaping). | Nur `<t id="N">…</t>` Blöcke, einer pro Segmentindex. |
| **`json-array`** | Ein JSON-Array von Strings, ein Eintrag pro Segment in Reihenfolge. | Ein JSON-Array der **gleichen Länge** (gleiche Reihenfolge). |
| **`json-object`** | Ein JSON-Objekt `{"0":"…","1":"…",…}`, indiziert nach Segmentindex. | Ein JSON-Objekt mit den **gleichen Schlüsseln** und übersetzten Werten. |

Die Laufüberschrift druckt auch `Batch prompt format: …`, sodass Sie den aktiven Modus bestätigen können. JSON-Label-Dateien (`jsonSource`) und eigenständige SVG-Batches verwenden dieselbe Einstellung, wenn diese Schritte als Teil von `translate-docs` (oder der Dokumentenphase von `sync` — `sync` gibt dieses Flag nicht preis; es ist standardmäßig auf **`xml`** eingestellt) ausgeführt werden.

**Segment-Deduplizierung und Pfade in SQLite**

- Segmentzeilen werden global nach `(source_hash, locale)` indiziert (Hash = normalisierter Inhalt). Identischer Text in zwei Dateien teilt sich eine Zeile; `translations.filepath` ist Metadaten (letzter Schreiber), kein zweiter Cache-Eintrag pro Datei.
- `file_tracking.filepath` verwendet namespaced Schlüssel: `doc-block:{index}:{relPath}` pro `documentations` Block (`relPath` ist projektstammverwandt posix: Markdown-Pfade wie gesammelt; **JSON-Label-Dateien verwenden den cwd-verwandten Pfad zur Quelldatei**, z.B. `docs-site/i18n/en/code.json`, sodass die Bereinigung die echte Datei auflösen kann), und `svg-assets:{relPath}` für eigenständige SVG-Assets unter `translate-svg`.
- `translations.filepath` speichert cwd-verwandte posix-Pfade für Markdown-, JSON- und SVG-Segmente (SVG verwendet dieselbe Pfadstruktur wie andere Assets; das `svg-assets:…` Präfix ist **nur** auf `file_tracking`).
- Nach einem Lauf wird `last_hit_at` nur für Segmentzeilen **im selben Übersetzungsbereich** (unter Berücksichtigung von `--path` und aktivierten Arten) zurückgesetzt, die nicht getroffen wurden, sodass ein gefilterter oder nur Dokumentenlauf nicht nicht verwandte Dateien als veraltet markiert.

### Ausgabelayouts {#output-layouts}

`"nested"` (Standard, wenn weggelassen) — spiegelt den Quellbaum unter `{outputDir}/{locale}/` wider (z.B. `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — platziert Dateien, die unter `docsRoot` liegen, in `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`, was dem üblichen Docusaurus i18n-Layout entspricht. Setzen Sie `documentations[].markdownOutput.docsRoot` auf Ihr Dokumenten-Quellverzeichnis (z.B. `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - platziert übersetzte Dateien neben der Quelle mit einem Lokalisierungs-Suffix oder in einem Unterverzeichnis. Relative Links zwischen Seiten werden automatisch umgeschrieben.

```
docs/guide.md → i18n/guide.de.md
```

Sie können Pfade vollständig mit `documentations[].markdownOutput.pathTemplate` überschreiben. Platzhalter: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## Kombinierter Workflow (UI + Docs) {#combined-workflow-ui--docs}

Aktivieren Sie alle Funktionen in einer einzigen Konfiguration, um beide Workflows zusammen auszuführen:

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

`glossary.uiGlossary` weist die Dokumentübersetzung auf dasselbe `strings.json`-Katalog wie die UI, sodass die Terminologie konsistent bleibt; `glossary.userGlossary` fügt CSV-Überschreibungen für Produktbegriffe hinzu.

Führen Sie `npx ai-i18n-tools sync` aus, um eine Pipeline auszuführen: **extrahieren** Sie UI-Strings (wenn `features.extractUIStrings`), **übersetzen Sie UI**-Strings (wenn `features.translateUIStrings`), **übersetzen Sie eigenständige SVG-Assets** (wenn ein `svg`-Block in der Konfiguration vorhanden ist), und **übersetzen Sie Dokumentationen** (jeder `documentations`-Block: markdown/JSON wie konfiguriert). Überspringen Sie Teile mit `--no-ui`, `--no-svg` oder `--no-docs`. Der Dokumentationsschritt akzeptiert `--dry-run`, `-p` / `--path`, `--force` und `--force-update` (die letzten beiden gelten nur, wenn die Dokumentationsübersetzung ausgeführt wird; sie werden ignoriert, wenn Sie `--no-docs` übergeben).

Verwenden Sie `documentations[].targetLocales` in einem Block, um die Dateien dieses Blocks in eine **kleinere Teilmenge** als die UI zu übersetzen (effektive Dokumentationslokalisierungen sind die **Vereinigung** über Blöcke):

```json
{
  "targetLocales": "src/locales/ui-languages.json",
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

## Konfigurationsreferenz {#configuration-reference}

### `sourceLocale` {#sourcelocale}

BCP-47-Code für die Quellsprache (z.B. `"en-GB"`, `"en"`, `"pt-BR"`). Für diese Locale wird keine Übersetzungsdatei generiert - der Schlüsselstring selbst ist der Quelltext.

**Muss übereinstimmen** mit `SOURCE_LOCALE`, das aus Ihrer Runtime-i18n-Setup-Datei exportiert wird (`src/i18n.ts` / `src/i18n.js`).

### `targetLocales` {#targetlocales}

Welche Locales übersetzt werden sollen. Akzeptiert:

- **String-Pfad** zu einem `ui-languages.json`-Manifest (`"src/locales/ui-languages.json"`). Die Datei wird geladen und die Locale-Codes werden extrahiert.
- **Array von BCP-47-Codes** (`["de", "fr", "es"]`).
- **Ein-Element-Array mit einem Pfad** (`["src/locales/ui-languages.json"]`) - dasselbe Verhalten wie die String-Form.

`targetLocales` ist die primäre Locale-Liste für die UI-Übersetzung und die Standard-Locale-Liste für Dokumentationsblöcke. Wenn Sie hier ein explizites Array beibehalten möchten, aber dennoch manifestgesteuerte Labels und Locale-Filterung wünschen, setzen Sie auch `uiLanguagesPath`.

### `uiLanguagesPath` (optional) {#uilanguagespath-optional}

Pfad zu einem `ui-languages.json`-Manifest, das für Anzeigenamen, Locale-Filterung und Nachbearbeitung der Sprachliste verwendet wird.

Verwenden Sie dies, wenn:

- `targetLocales` ein explizites Array ist, Sie jedoch dennoch englische/nativen Labels aus dem Manifest wünschen.
- Sie möchten, dass `markdownOutput.postProcessing.languageListBlock` Locale-Labels aus demselben Manifest erstellt.
- Nur die UI-Übersetzung aktiviert ist und Sie möchten, dass das Manifest die effektive UI-Locale-Liste bereitstellt.

### `concurrency` (optional) {#concurrency-optional}

Maximale **Zielgebiete**, die gleichzeitig übersetzt werden (`translate-ui`, `translate-docs`, `translate-svg` und die entsprechenden Schritte innerhalb von `sync`). Wenn weggelassen, verwendet die CLI **4** für die UI-Übersetzung und **3** für die Dokumentationsübersetzung (voreingestellte Standardwerte). Pro Ausführung mit `-j` / `--concurrency` überschreiben.

### `batchConcurrency` (optional) {#batchconcurrency-optional}

**translate-docs** und **translate-svg** (und der Dokumentationsschritt von `sync`): maximale parallele OpenRouter **Batch**-Anfragen pro Datei (jeder Batch kann viele Segmente enthalten). Standard **4**, wenn weggelassen. Von `translate-ui` ignoriert. Mit `-b` / `--batch-concurrency` überschreiben. Bei `sync` gilt `-b` nur für den Dokumentationsübersetzungsschritt.

### `batchSize` / `maxBatchChars` (optional) {#batchsize--maxbatchchars-optional}

Segmentbündelung für die Dokumentenübersetzung: wie viele Segmente pro API-Anfrage und eine Zeichenobergrenze. Standardwerte: **20** Segmente, **4096** Zeichen (wenn weggelassen).

### `openrouter` {#openrouter}

| Feld               | Beschreibung                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | OpenRouter API Basis-URL. Standard: `https://openrouter.ai/api/v1`.                        |
| `translationModels` | Bevorzugte geordnete Liste von Modell-IDs. Das erste wird zuerst ausprobiert; spätere Einträge sind Fallbacks im Fehlerfall. Nur für `translate-ui`**, können Sie auch `ui.preferredModel` setzen, um ein Modell vor dieser Liste auszuprobieren (siehe `ui`). |
| `defaultModel`      | Legacy einzelnes primäres Modell. Wird nur verwendet, wenn `translationModels` nicht gesetzt oder leer ist.       |
| `fallbackModel`     | Legacy einzelnes Fallback-Modell. Wird nach `defaultModel` verwendet, wenn `translationModels` nicht gesetzt oder leer ist. |
| `maxTokens`         | Maximalanzahl an Abschluss-Token pro Anfrage. Standard: `8192`.                                      |
| `temperature`       | Sampling-Temperatur. Standard: `0.2`.                                                    |

Setzen Sie `OPENROUTER_API_KEY` in Ihrer Umgebung oder in der `.env`-Datei.

### `features` {#features}

| Feld                | Workflow | Beschreibung                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | Scannen Sie die Quelle nach `t("…")` und schreiben/zusammenführen Sie `strings.json`.          |
| `translateUIStrings` | 1        | Übersetzen Sie die Einträge in `strings.json` und schreiben Sie JSON-Dateien pro Gebietsschema. |
| `translateMarkdown`  | 2        | Übersetzen Sie `.md` / `.mdx`-Dateien.                                   |
| `translateJSON`      | 2        | Übersetzen Sie Docusaurus JSON-Labeldateien.                            |

Es gibt kein `features.translateSVG`-Flag. Übersetzen Sie **eigenständige** SVG-Ressourcen mit `translate-svg` und einem obersten `svg`-Block in der Konfiguration. Der `sync`-Befehl führt diesen Schritt aus, wenn `svg` vorhanden ist (es sei denn, `--no-svg`).

### `ui` {#ui}

| Feld                        | Beschreibung                                                            |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | Verzeichnisse (relativ zum aktuellen Arbeitsverzeichnis), die nach `t("…")`-Aufrufen durchsucht werden.               |
| `stringsJson`               | Pfad zur Master-Katalogdatei. Wird von `extract` aktualisiert.                  |
| `flatOutputDir`             | Verzeichnis, in dem die JSON-Dateien pro Locale geschrieben werden (`de.json` usw.).    |
| `preferredModel`            | Optional. OpenRouter-Modell-ID, die zuerst für `translate-ui` versucht wird; dann `openrouter.translationModels` (oder Legacy-Modelle) in der Reihenfolge, ohne diese ID zu duplizieren. |
| `reactExtractor.funcNames`  | Zusätzliche Funktionsnamen, die durchsucht werden sollen (Standard: `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | Dateierweiterungen, die einbezogen werden sollen (Standard: `[".js", ".jsx", ".ts", ".tsx"]`). |
| `reactExtractor.includePackageDescription` | Wenn `true` (Standard), schließt `extract` auch die `description` aus `package.json` als UI-String ein, wenn vorhanden. |
| `reactExtractor.packageJsonPath` | Benutzerdefinierter Pfad zur `package.json`-Datei, die für die optionale Beschreibungsextraktion verwendet wird. |

### `cacheDir` {#cachedir}

| Feld      | Beschreibung                                                               |
| ---------- | ------------------------------------------------------------------------- |
| `cacheDir` | SQLite-Cache-Verzeichnis (von allen `documentations`-Blöcken gemeinsam genutzt). Wiederverwendbar über mehrere Durchläufe. |

### `documentations` {#documentations}

Array von Dokumentations-Pipeline-Blöcken. `translate-docs` und die Dokumentationsphase des `sync`-Prozesses **verarbeiten** jeden Block in der Reihenfolge.

| Feld                                        | Beschreibung                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | Optionale, menschenlesbare Notiz für diesen Block (nicht für die Übersetzung verwendet). Wird im `translate-docs` `🌐` Überschrift angezeigt, wenn gesetzt; auch in den Kopfzeilen der `status`-Abschnitte angezeigt.                                                     |
| `contentPaths`                               | Markdown/MDX-Quellen zur Übersetzung (`translate-docs` durchsucht diese nach `.md` / `.mdx`). JSON-Bezeichnungen stammen aus `jsonSource` im selben Block.                                                                                  |
| `outputDir`                                  | Stammverzeichnis für die übersetzten Ausgaben dieses Blocks.                                                                                                                                                                      |
| `sourceFiles`                                | Optionales Alias, das beim Laden in `contentPaths` integriert wird.                                                                                                                                                                        |
| `targetLocales`                              | Optionale Teilmenge von Lokalen nur für diesen Block (ansonsten Stamm-`targetLocales`). Effektive Dokumentationslokale sind die Vereinigung über die Blöcke hinweg.                                                                             |
| `jsonSource`                                 | Quellverzeichnis für Docusaurus JSON-Labeldateien für diesen Block (z. B. `"i18n/en"`).                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"` (Standard), `"docusaurus"` oder `"flat"`.                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Quell-Dokumentenstamm für das Docusaurus-Layout (z. B. `"docs"`).                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | Benutzerdefinierter Markdown-Ausgabepfad. Platzhalter: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>. |
| `markdownOutput.jsonPathTemplate`            | Benutzerdefinierter JSON-Ausgabepfad für Labeldateien. Unterstützt die gleichen Platzhalter wie `pathTemplate`.                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | Für den `flat` Stil, Quellunterverzeichnisse beibehalten, damit Dateien mit demselben Basenamen nicht kollidieren.                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | Relative Links nach der Übersetzung umschreiben (automatisch aktiviert für den `flat` Stil).                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | Repo-Stamm, der beim Berechnen der flachen Link-Umschreibpräfixe verwendet wird. Normalerweise als `"."` belassen, es sei denn, Ihre übersetzten Dokumente befinden sich unter einem anderen Projektstamm. |
| `markdownOutput.postProcessing` | Optionale Transformationen des übersetzten Markdown **Inhalts** (YAML-Frontmatter bleibt erhalten). Wird nach der Segmentzusammenstellung und der flachen Link-Umschreibung ausgeführt, und vor `injectTranslationMetadata`. |
| `markdownOutput.postProcessing.regexAdjustments` | Geordnete Liste von `{ "description"?, "search", "replace" }`. `search` ist ein Regex-Muster (ein einfacher String verwendet das Flag `g`, oder `/pattern/flags`). `replace` unterstützt Platzhalter wie `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` (das gleiche Konzept wie die Referenz `additional-adjustments`). |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — der Übersetzer findet die erste Zeile, die `start` enthält, und die passende `end`-Zeile, und ersetzt dann diesen Abschnitt durch einen kanonischen Sprachwechsler. Links werden mit Pfaden relativ zur übersetzten Datei erstellt; Bezeichnungen stammen aus `uiLanguagesPath` / `ui-languages.json`, wenn konfiguriert, andernfalls aus `localeDisplayNames` und Sprachcodes. |
| `injectTranslationMetadata`                  | Wenn `true` (Standard, wenn weggelassen), enthalten die übersetzten Markdown-Dateien YAML-Schlüssel: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`. Auf `false` setzen, um zu überspringen. |

Beispiel (flaches README-Pipeline — Screenshot-Pfade + optionale Sprachlisten-Hülle):

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

### `svg` (optional) {#svg-optional}

Konfiguration auf oberster Ebene für eigenständige SVG-Ressourcen, die von `translate-svg` und der SVG-Phase von `sync` übersetzt werden.

| Feld                       | Beschreibung |
| --------------------------- | ----------- |
| `sourcePath`                | Ein Verzeichnis oder ein Array von Verzeichnissen, die rekursiv nach `.svg`-Dateien durchsucht werden. |
| `outputDir`                 | Wurzelverzeichnis für die übersetzten SVG-Ausgaben. |
| `style`                     | `"flat"` oder `"nested"`, wenn `pathTemplate` nicht gesetzt ist. |
| `pathTemplate`              | Benutzerdefinierter SVG-Ausgabepfad. Platzhalter: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | Kleinbuchstabige übersetzte Texte bei der SVG-Zusammenstellung. Nützlich für Designs, die auf vollständig kleingeschriebenen Beschriftungen basieren. |

### `glossary` {#glossary}

| Feld          | Beschreibung                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | Pfad zu `strings.json` - erstellt automatisch ein Glossar aus vorhandenen Übersetzungen.                                                                                                                 |
| `userGlossary` | Pfad zu einer CSV-Datei mit den Spalten `Originalsprache String` (oder `en`), `Locale`, `Übersetzung` - eine Zeile pro Quellbegriff und Ziel-Locale (`Locale` kann `*` für alle Ziele sein). |

Der veraltete Schlüssel `uiGlossaryFromStringsJson` wird weiterhin akzeptiert und beim Laden der Konfiguration auf `uiGlossary` abgebildet.

Generiere eine leere Glossar-CSV:

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLI-Referenz {#cli-reference}

| Befehl                                                                   | Beschreibung                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusaurus] [-o pfad] [--with-translate-ignore]` | Schreibt eine Starter-Konfigurationsdatei (enthält `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars` und `documentations[].injectTranslationMetadata`). `--with-translate-ignore` erstellt eine Starter-Datei `.translate-ignore`.                                                                            |
| `extract`                                                                 | Durchsucht die Quelle nach `t("…")`-Aufrufen und aktualisiert `strings.json`. Erfordert `features.extractUIStrings`.                                                                                                                                                                                                    |
| `translate-docs …`                                                        | Übersetzt Markdown/MDX und JSON für jeden `documentations`-Block (`contentPaths`, optional `jsonSource`). `-j`: maximale parallele Locales; `-b`: maximale parallele Batch-API-Aufrufe pro Datei. `--prompt-format`: Batch-Wire-Format (`xml` \| `json-array` \| `json-object`). Siehe [Cache-Verhalten und `translate-docs`-Flags](#cache-behaviour-and-translate-docs-flags) und [Batch-Prompt-Format](#batch-prompt-format). |
| `translate-svg …`                                                         | Übersetzt eigenständige SVG-Assets, die in `config.svg` konfiguriert sind (separat von der Dokumentation). Gleiche Cache-Ideen wie bei der Dokumentation; unterstützt `--no-cache`, um SQLite-Lese-/Schreibvorgänge für diesen Lauf zu überspringen. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | Übersetzt nur UI-Strings. `--force`: alle Einträge pro Locale neu übersetzen (ignoriert vorhandene Übersetzungen). `--dry-run`: keine Schreibvorgänge, keine API-Aufrufe. `-j`: maximale parallele Locales. Erfordert `features.translateUIStrings`.                                                                                 |
| `sync …`                                                                  | Extrahiert (falls aktiviert), dann UI-Übersetzung, dann `translate-svg`, wenn `config.svg` existiert, dann Dokumentationsübersetzung – es sei denn, sie wird mit `--no-ui`, `--no-svg` oder `--no-docs` übersprungen. Gemeinsame Flags: `-l`, `-p`, `--dry-run`, `-j`, `-b` (nur Dokumentations-Batching), `--force` / `--force-update` (nur Dokumentation; schließen sich gegenseitig aus, wenn die Dokumentation läuft).                         |
| `status`                                                                  | Zeigt den Markdown-Übersetzungsstatus pro Datei × Locale (kein `--locale`-Filter; Locales kommen aus der Konfiguration).                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <pfad>]`                  | Führt zuerst `sync --force-update` aus (Extraktion, UI, SVG, Dokumentation), entfernt dann veraltete Segment-Zeilen (null `last_hit_at` / leerer Dateipfad); löscht `file_tracking`-Zeilen, deren aufgelöster Quellpfad auf der Festplatte fehlt; entfernt Übersetzungszeilen, deren `filepath`-Metadaten auf eine fehlende Datei verweisen. Protokolliert drei Zählungen (veraltet, verwaiste `file_tracking`, verwaiste Übersetzungen). Erstellt eine zeitgestempelte SQLite-Sicherung unter dem Cache-Verzeichnis, es sei denn, `--no-backup` wird angegeben. |
| `editor [-p <port>] [--no-open]`                                          | Startet einen lokalen Web-Editor für den Cache, `strings.json` und das Glossar-CSV. `--no-open`: den Standardbrowser nicht automatisch öffnen.<br><br>**Hinweis:** Wenn Sie einen Eintrag im Cache-Editor bearbeiten, müssen Sie einen `sync --force-update` ausführen, um die Ausgabedateien mit dem aktualisierten Cache-Eintrag neu zu schreiben. Außerdem geht die manuelle Bearbeitung verloren, wenn sich der Quelltext später ändert, da ein neuer Cache-Schlüssel generiert wird. |
| `glossary-generate [-o <pfad>]`                                           | Schreibt eine leere `glossary-user.csv`-Vorlage. `-o`: überschreibt den Ausgabepfad (Standard: `glossary.userGlossary` aus der Konfiguration oder `glossary-user.csv`).                                                                                                                                                |

Alle Befehle akzeptieren `-c <path>` um eine nicht-standardmäßige Konfigurationsdatei anzugeben, `-v` für ausführliche Ausgaben und `-w` / `--write-logs [path]` um die Konsolenausgabe in eine Protokolldatei zu leiten (Standardpfad: unter dem Wurzelverzeichnis `cacheDir`).

---

## Umgebungsvariablen {#environment-variables}

| Variable               | Beschreibung                                              |
| ---------------------- | -------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **Erforderlich.** Ihr OpenRouter API-Schlüssel.          |
| `OPENROUTER_BASE_URL`  | Überschreiben Sie die API-Basis-URL.                    |
| `I18N_SOURCE_LOCALE`   | Überschreiben Sie `sourceLocale` zur Laufzeit.          |
| `I18N_TARGET_LOCALES`  | Komma-getrennte Gebietsschema-Codes zum Überschreiben von `targetLocales`. |
| `I18N_LOG_LEVEL`       | Protokollierungsstufe (`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`             | Wenn `1`, deaktivieren Sie ANSI-Farben in der Protokollausgabe. |
| `I18N_LOG_SESSION_MAX` | Maximalzeilen pro Protokollsitzung (Standard `5000`).    |
