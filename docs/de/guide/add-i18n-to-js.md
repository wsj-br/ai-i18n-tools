<a id="add-i18n-to-a-jsts-app"></a>
# i18n zu einer JS/TS-App hinzufügen

Diese Seite behandelt eine JS/TS-App (React, Next.js, Node oder eine CLI), die eine einzige Sprache hat und Lokalisierungen mit ai-i18n-tools hinzufügt. Sie folgt einem Pfad: i18next, einer kleinen Bootstrap-Datei und JSON-Dateien mit Übersetzungen. `extract` erfasst einen UI-String nur, wenn es sich um ein String-Literal innerhalb von `t()` oder `i18n.t()` handelt, daher wäre ein Katalog mit einfachem Quelltext leer.

Der schnellste Weg ist, einem Coding-Agenten den Prompt auf dieser Seite zu geben. Er installiert i18next, fügt den Bootstrap hinzu, umschließt Ihre Strings und kann einen Sprachumschalter hinzufügen. Sie installieren die CLI, wählen den Anbieter und initialisieren das Projekt selbst, da dies Ihren API-Schlüssel und Ihre Entscheidungen erfordert. Sie führen die Übersetzung auch selbst aus, da dies Kosten auf Ihrem Konto verursacht.

Eine Website oder Dokumentationsseite verwendet [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website). Eine Python-App verwendet [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python). Sie sind sich nicht sicher, was zutrifft? Siehe [Nicht Ihr Fall?](#not-your-case) am Ende.

Der Ablauf:

1. [CLI installieren und einen Anbieter auswählen](#install-and-choose-a-provider).
2. [Projekt initialisieren](#initialise-the-project) mit `init`.
3. [Agent-Prompt ausführen](#run-the-agent-prompt).
4. [Ergebnis überprüfen](#review-the-result).
5. [Modelle auswählen und übersetzen](#choose-models-and-translate), dann eine Sprache prüfen.
6. [Übersetzt halten](#keep-it-translated).

Möchten Sie die Änderungen lieber selbst vornehmen oder wissen, was der Prompt tut? [Manuell vorgehen](#do-it-by-hand) führt die gleichen Schritte einzeln durch.

<a id="install-and-choose-a-provider"></a>
## Anbieter installieren und auswählen

Diesen Teil erledigen Sie, nicht der Agent. Der Installer nimmt Änderungen an Ihrem System vor, und der API-Schlüssel ist ein Geheimnis, das in Ihre Shell gehört, nicht in einen Prompt.

Installieren Sie das Paket als Entwicklungsabhängigkeit. Der Bootstrap importiert `ai-i18n-tools/runtime`, und eine globale CLI oder eine eigenständige ausführbare Datei kann diesen Import nicht erfüllen. Weitere Installationsoptionen: [Installation](/de/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` und `yarn add --dev ai-i18n-tools` funktionieren auch. Die folgenden Beispiele verwenden den reinen `ai-i18n-tools`-Befehl. Eine lokale Installation erfordert `node_modules/.bin` auf `PATH` oder `pnpm exec` vor jedem Befehl. Siehe [Verwenden der CLI](/de/guide/installation#using-the-cli).

Installation überprüfen:

```bash
ai-i18n-tools --version
```

Wählen Sie dann einen Anbieter und legen Sie dessen API-Schlüssel in der Shell fest, die die Übersetzung ausführen wird. Zum Beispiel OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama benötigt keinen Schlüssel. Andere Voreinstellungen: [Integrierte Anbieter](/de/guide/providers-and-models#built-in-providers). Merken Sie sich den Anbieternamen, da Sie ihn im nächsten Schritt an `init` übergeben. Der Agent benötigt den Schlüssel nie: Er führt nur Befehle aus, die keine Modellaufrufe tätigen. Sie verwenden den Schlüssel später, wenn Sie [übersetzen](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Projekt initialisieren

Dies führen Sie einmalig vor dem Prompt aus. Es schreibt die Konfiguration und verwendet den oben ausgewählten Anbieter.

```bash
ai-i18n-tools init -P openrouter
```

Die Standardvorlage ist `ui-markdown`. Sie schreibt `ai-i18n-tools.config.json` mit einem UI-Block und einem flachen README-Block. Vier Schlüssel sind für die App wichtig:

- `sourceLocale`: die Sprache der Strings in der Quelle. Jede BCP-47-Sprache ist gültig; das Scaffold verwendet oft `en-GB`.
- `targetLocales`: die hinzuzufügenden Sprachen.
- `ui.sourceRoots`: die Ordner, die `extract` scannt, zum Beispiel `src/`.
- `ui.stringsJson` und `ui.flatOutputDir`: wo der Katalog und die pro-locale-Dateien geschrieben werden.

`init` installiert i18next nicht und fügt den Bootstrap nicht hinzu. Das ist der Prompt (manuell, [Schritt 1](#step-1-install-the-runtime-libraries) und [Schritt 2](#step-2-extract-once-and-add-the-bootstrap)).

Führen Sie `init` einmal aus. Es überschreibt `ai-i18n-tools.config.json` jedes Mal, daher verwirft ein zweiter Durchlauf von Ihnen vorgenommene Änderungen.

Dieselbe Vorlage listet `README.md` für die Dokumentübersetzung auf. Der Sprachlisten-Marker und die README-Dateien sind [i18n zu Ihren README- und Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme). Diese Seite ist der `t()`-Pfad.

Jeder andere Schlüssel befindet sich in [Konfiguration](/de/reference/configuration). Aufrufstrukturen: [t()-Aufrufe und Pluralformen](/de/guide/ui-strings/t-calls-and-plurals). Die Bootstrap-Referenz: [i18next verdrahten](/de/guide/ui-strings/i18next-runtime).

<a id="run-the-agent-prompt"></a>
## Agent-Prompt ausführen

Öffnen Sie das Projekt in Ihrem Coding-Agenten (Cursor, Claude Code, Copilot oder ähnlich), starten Sie einen neuen Chat und fügen Sie den unten stehenden Prompt ein. Das Projekt muss bereits initialisiert sein. Es gibt nichts zu bearbeiten. Wenn Sie etwas weglassen möchten, zum Beispiel keinen Sprachumschalter, geben Sie dies in derselben Nachricht an.

Der Agent prüft zunächst, ob die CLI und die Konfiguration existieren, und stoppt mit Anweisungen, falls eine davon fehlt. Danach arbeitet er in drei Teilen:

- Teil 1 installiert i18next, führt `extract` einmal aus und fügt den Bootstrap hinzu.
- Teil 2 umschließt die benutzeroberflächennahen Zeichenketten in `t()` oder `i18n.t()`.
- Teil 3 fügt einen Sprachumschalter oder eine CLI-Sprachoption hinzu.

Er installiert die CLI nicht, initialisiert die Konfiguration nicht, liest Ihren API-Schlüssel nicht und übersetzt nicht. Die Übersetzung ist der Schritt nach der Überprüfung, und Sie führen sie aus.

````markdown
# Add languages to this JS/TS app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists with a `ui` block. If either is missing,
stop now and tell the user to install ai-i18n-tools as a dev dependency and
run `ai-i18n-tools init -P <provider>`, then run this prompt again. Do not
install the CLI or initialise the config yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`).
- Do not introduce semantic keys (`saveButton`, `nav.home`). The literal in
  `t("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Runtime

Skip a piece of this part when it is already done.

1. Install `i18next` with the project's package manager. Install
   `react-i18next` only when a component uses `useTranslation()`.
2. Run `ai-i18n-tools extract` once. It writes `strings.json` and
   `ui-languages.json` even when it finds no `t()` calls, so the app compiles.
   Expect 0 strings, or 1 when `package.json` has a `description`
   (`ui.uiExtractor.includePackageDescription` is on by default).
3. Add the bootstrap below. Put it where this repository keeps its app code,
   and point the JSON imports at `ui.stringsJson`, `ui.flatOutputDir`, and
   `languagesManifestPath` when that key is set. `SOURCE_LOCALE` must equal
   config `sourceLocale`, character for character. The sample uses `en-GB`
   only as the shape.
4. Import the bootstrap from the app entry before the first render. In
   Next.js, import it from a client module. Do not call `changeLanguage` on a
   shared i18next instance inside a server component. Concurrent requests
   share that singleton. Use a per-request `createInstance()`, or a stateless
   lookup of the flat bundle.

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

For JSON under `public/`, the loader fetches `/locales/<code>.json` and
parses the response. For a Node CLI with no bundler, read the file with
`readFileSync` inside that function. A call that uses `{ plurals: true, count }`
also needs the
source-locale flat file under `flatOutputDir`. That file does not exist until
the user runs `translate-ui`, so leave `sourcePluralFlatBundle` out and name
the plural calls in the report.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

Read `ui.sourceRoots` and edit only those trees (JS, JSX, TS, TSX). Leave
`className`, URLs and routes, import paths, ids, test ids, enum and error
codes, object keys used as identifiers, log field names, CSS, regexes, and
comments.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. A constant that
  would call `t()` at import time must move into a function or
  `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Placeholders: `t("Hello {{name}}", { name })`. The argument must be a string
  literal. `t(variable)` and a template literal as the key are not extracted.
- Plurals: `t("{{count}} items", { plurals: true, count })`. Do not invent
  `_one` / `_other` keys.
- One `t()` per sentence. Split only where the text already branches.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

Work in passes: list string literals that are not passed to `t` or `i18n.t`,
wrap the user-facing ones, then list again. Treat any bulk rewrite as a draft
and review its diff. Then run `ai-i18n-tools extract` again.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A command-line program still gets
this part: a language option, not a widget.

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Accept only codes listed in `ui-languages.json`.

- Restore a saved locale before the first render, then draw a control labelled
  `t("Language")` whose options come from that manifest. On change, call
  `await loadLocale(code)` and then `await i18n.changeLanguage(code)`.
- In Next.js, reading `localStorage` in an effect after hydration paints the
  source locale first. Prefer a cookie the server can read, or load the saved
  locale in the client module before the first client render. Do not call
  `changeLanguage` on a shared instance inside a server component.
- A CLI: add `--lang <code>` and `-L <code>` unless those names are taken.
  Read the option before help text is built, so help can be translated too.
  After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`. Then the source locale.

## Verify and report

The project's build, type check, and tests pass. `extract` writes a non-empty
catalog of the sentences you wrapped. With the source locale, the output is
unchanged.

Report the files changed, each string you skipped with a one-line reason, the
same word used with different meanings, sentences built from translated pieces,
plurals that still need `sourcePluralFlatBundle` after the user translates,
and any `t()` that runs at import time. Then list the commands for the user,
and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then reload the app.
````

<a id="review-the-result"></a>
## Ergebnis überprüfen

Der Agent schließt mit einem Bericht ab. Überprüfen Sie ihn, bevor Sie übersetzen:

- Der Diff. Umbrochener Text sollte sich wie zuvor lesen, ohne irrelevante Neuformatierungen. `git diff --stat` zeigt, wie viel sich geändert hat. Der Bootstrap, sein Import, die umbrochenen Aufrufe und der Sprachumschalter sind die erwarteten Änderungen.
- Generierte Kataloge (`strings.json`, JSON pro Locale, `ui-languages.json`) sind unberührt, abgesehen von dem, was `extract` geschrieben hat.
- `ai-i18n-tools extract` läuft fehlerfrei, und `strings.json` listet die Sätze auf, die Sie erwarten.
- Ihre Tests bestehen, und die App sieht in der Ausgangssprache gleich aus.
- Die übersprungenen Zeichenketten und die mehrdeutigen Fälle im Bericht: ein Wort, das mit verschiedenen Bedeutungen verwendet wird, aus Teilen aufgebaute Sätze und Pluralformen. Entscheiden Sie diese manuell.
- `SOURCE_LOCALE` im Bootstrap entspricht `sourceLocale` in der Konfiguration.

Vom Agenten übersehene Zeichenketten erscheinen später als Text, der in der Ausgangssprache verbleibt.

<a id="choose-models-and-translate"></a>
## Modelle auswählen und übersetzen

Sie führen diesen Teil aus. Er verwendet Ihren API-Schlüssel und verursacht Kosten auf Ihrem Konto.

Die Modellliste von `init` ist ein Ausgangspunkt. Bewerten Sie die Chat-Modelle des aktiven Anbieters und schreiben Sie die Auswahl in `translationModels`, sobald die engere Auswahl korrekt aussieht:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` ersetzt nur `translationModels`. Dieselbe Rangfolge finden Sie auf der Registerkarte [Modelle](/de/guide/translation-dashboard/models) von `ai-i18n-tools dashboard`.

Dann extrahieren und übersetzen:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` schreibt `strings.json` und `ui-languages.json`. `translate-ui` schreibt eine JSON-Datei pro Zielsprache unter `ui.flatOutputDir`. Lassen Sie diese generierten Dateien unbearbeitet. `sync` führt `extract` und `translate-ui` zusammen aus, wenn `features.translateUIStrings` aktiviert ist. Was `extract` scannt und schreibt: [UI-Zeichenketten, Schritt 2](/de/guide/ui-strings/#step-2-extract-strings).

`t()` sucht den Quellsatz im Locale-JSON. Die ID in `strings.json` ist nicht der Suchschlüssel. Eine fehlende Datei oder ein fehlender Schlüssel gibt den Quellsatz zurück.

<a id="check-one-language"></a>
### Eine Sprache überprüfen

Laden Sie die App neu, wechseln Sie zu einer Zielsprache und öffnen Sie einen Bildschirm mit einigen umbrochenen Zeichenketten. Verwenden Sie den vom Agenten hinzugefügten Sprachumschalter oder rufen Sie `loadLocale` und `changeLanguage` selbst auf. Text, der sich noch in der Ausgangssprache befindet, wurde nicht umbrochen, wird zur Importzeit ausgeführt oder hat keinen Eintrag im Locale-JSON. Überprüfen Sie das JSON auf den Satz, bevor Sie den Code verdächtigen.

Wenn ein umbrochener Aufruf `{ plurals: true, count }` verwendet, fügen Sie die Flatfile des Quell-Locales hinzu, damit Pluralformen aufgelöst werden. Dies fügt einen Import von `{sourceLocale}.json` aus `flatOutputDir` und eine `sourcePluralFlatBundle`-Option hinzu, wie in [i18next verdrahten](/de/guide/ui-strings/i18next-runtime) gezeigt.

<a id="keep-it-translated"></a>
## Übersetzt halten

Führen Sie `ai-i18n-tools sync` (oder `extract` und dann `translate-ui`) erneut aus, nachdem Sie den Quelltext geändert haben. Der Cache sorgt dafür, dass nur neue oder geänderte Zeichenketten an das Modell gesendet werden. Fügen Sie die Skripte aus [Empfohlene package.json-Skripte](/de/guide/quick-start#recommended-packagejson-scripts) hinzu und führen Sie `sync` in CI aus, damit Übersetzungen nicht abweichen. Laden Sie die App nach einem Übersetzungslauf neu, damit sie die neue JSON-Datei übernimmt. `ai-i18n-tools dashboard` öffnet das [Übersetzungs-Dashboard](/de/guide/translation-dashboard/), um Übersetzungen zu überprüfen.

Die Standardvorlage `init` listet auch `README.md` auf. Fügen Sie den Sprachlisten-Marker ein, bevor `sync` ihn übersetzt. Siehe [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Machen Sie es manuell

Arbeiten Sie diese Schritte durch, wenn Sie die Änderungen lieber selbst vornehmen möchten oder wissen wollen, was die Eingabeaufforderung bewirkt. Die Schritte entsprechen den Teilen der Eingabeaufforderung. Sie [installieren die CLI](#install-and-choose-a-provider), [initialisieren das Projekt](#initialise-the-project) und [übersetzen](#choose-models-and-translate) am Ende trotzdem.

1. [Installieren Sie die Laufzeitbibliotheken](#step-1-install-the-runtime-libraries).
2. [Einmal extrahieren und den Bootstrap hinzufügen](#step-2-extract-once-and-add-the-bootstrap).
3. [Zeichenketten umwickeln](#step-3-wrap-strings) in `t()` oder `i18n.t()`.
4. [Einen Sprachumschalter hinzufügen](#step-4-add-a-language-switch).

<a id="step-1-install-the-runtime-libraries"></a>
## Schritt 1: Laufzeitbibliotheken installieren

ai-i18n-tools hängt nicht von `i18next` oder `react-i18next` ab. Die App installiert sie.

- Jede JS/TS-App, die Strings zur Laufzeit nachschlägt: `i18next`.
- React-Komponenten, die `useTranslation()` aufrufen: `react-i18next` ebenfalls.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## Schritt 2: Einmal extrahieren und den Bootstrap hinzufügen

Der Bootstrap importiert `strings.json` und `ui-languages.json`, und nur `extract` schreibt sie. Es schreibt beide, auch wenn es keine `t()`-Aufrufe findet, damit die App kompiliert wird.

```bash
ai-i18n-tools extract
```

Erwarten Sie 0 Zeichenketten, oder 1, wenn Ihr `package.json` eine `description` hat, da der Extractor diese standardmäßig einschließt (`ui.uiExtractor.includePackageDescription`).

Erstellen Sie die i18n-Setup-Datei. Diese Version reicht aus, um Zeichenketten zu umwickeln und zu übersetzen. `SOURCE_LOCALE` muss in `ai-i18n-tools.config.json` gleich `sourceLocale` sein. Passen Sie die Importpfade an, damit sie `ui.stringsJson` und `ui.flatOutputDir` entsprechen.

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

Verwenden Sie kein React? Entfernen Sie den `react-i18next`-Import und den `.use(initReactI18next)`-Aufruf.

Für JSON-Bundles unter `public/` ruft der Loader `/locales/${code}.json` ab. Für eine Node-CLI ohne Bundler lesen Sie die Datei mit `readFileSync`. Beide Formen finden Sie unter [Locale-Loader](/de/guide/ui-strings/i18next-runtime#locale-loaders).

Importieren Sie diese Datei aus dem App-Einstiegspunkt vor dem ersten Rendern. In Next.js importieren Sie sie aus einem Client-Modul, dem gleichen Muster folgend wie [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts).

<a id="step-3-wrap-strings"></a>
## Schritt 3: Zeichenketten umwickeln

Das Argument für `t()` ist der Satz in der Quellsprache, den der Benutzer sehen soll. Flache Locale-Dateien werden nach diesem Satz geschlüsselt.

JSX:

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node, eine CLI oder ein beliebiges Nicht-React-Modul:

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

Regeln (auch in [t()-Aufrufen und Pluralen](/de/guide/ui-strings/t-calls-and-plurals)):

- Der Schlüssel ist ein Literal. `t(variable)` und <code>{'t(`Hello ${name}`)'}</code> werden nicht extrahiert, und nicht-literale Aufrufe werden ohne Warnung übersprungen.
- Platzhalter innerhalb des Literals verwenden das i18next-Format <code v-pre>{{name}}</code>, das im zweiten Argument übergeben wird.
- Plurale: ein Ausgangssatz plus `{ plurals: true, count }`. Siehe [Kardinalplurale](/de/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true). Erfinden Sie keine `_one` / `_other`-Schlüssel selbst.
- React-Komponenten übernehmen `t` von `useTranslation()`. Andere Dateien rufen `i18n.t` auf. Eine Konstante, die zur Importzeit ausgewertet wird, muss in eine Funktion oder `useMemo(..., [t])` verschoben werden, damit `t()` nach dem Laden des Locales ausgeführt wird.
- Next.js-Serverkomponenten dürfen `changeLanguage` nicht auf einer gemeinsam genutzten i18next-Instanz aufrufen. Gleichzeitige Anfragen teilen sich dieses Singleton. Verwenden Sie ein pro-Anfrage-`createInstance()` oder eine zustandslose Suche des flachen Bundles (siehe das [Nextra-Hybrid](/de/guide/integrations/nextra#optional-t-for-app-react-hybrid)).

Lassen Sie diese unverändert: `className`, `href` und andere URLs, Importpfade, IDs, Test-IDs, Fehlercodes, als Bezeichner verwendete Objektschlüssel und Text innerhalb von Kommentaren.

Führen Sie `ai-i18n-tools extract` erneut aus. Der Katalog sollte nun die von Ihnen umwickelten Sätze auflisten.

<a id="step-4-add-a-language-switch"></a>
## Schritt 4: Sprachumschalter hinzufügen

Stellen Sie ein gespeichertes Locale vor dem ersten Rendern wieder her, wie unter [i18next verdrahten](/de/guide/ui-strings/i18next-runtime#startup-locale) beschrieben. Fügen Sie dann ein Steuerelement hinzu, das `await loadLocale(code)` gefolgt von `await i18n.changeLanguage(code)` aufruft. Erstellen Sie die Optionen aus `ui-languages.json`. Das Widget, Beschriftungen und das Rechts-nach-links-Layout: [Sprachumschalter und RTL](/de/guide/ui-strings/language-switcher).

Ein Befehlszeilenprogramm hat kein Widget. Fügen Sie `--lang <code>` (und `-L`, wenn dieser Name frei ist) hinzu, dann eine Sprachumgebungsvariable, die die App bereits besitzt. Lesen Sie `AI_I18N_LANG` nicht; diese Variable ist nur für die ai-i18n-tools CLI. Akzeptieren Sie nur Codes, die in `ui-languages.json` aufgeführt sind.

Überspringen Sie diesen Schritt, wenn das Programm keinen Text anzeigt, den eine Person liest.

Das ist der letzte manuelle Schritt. Fahren Sie fort unter [Modelle auswählen und übersetzen](#choose-models-and-translate).

<a id="coming-from-another-tool"></a>
## Umstieg von einem anderen Tool

ai-i18n-tools enthält einen eigenen String-Extraktor. Wenn Sie `i18next-scanner`, `babel-plugin-i18next-extract` oder Ähnliches verwendet haben, können Sie diese Entwicklungsabhängigkeiten nach der Migration entfernen. Bestehende i18next-Namespace-JSON-Dateien können in der [JSON-Pipeline](/de/guide/json#i18next-namespace-files) verbleiben. Intlayer `.content.ts`-Wörterbücher können mit `migrate-intlayer` importiert werden: siehe [Migration von Intlayer](/de/guide/migrating-from-intlayer). Um Intlayer zur Laufzeit beizubehalten und nur dessen Übersetzungen zu füllen, verwenden Sie `translate-intlayer`: siehe [Intlayer vor Ort übersetzen](/de/guide/translating-intlayer).

<a id="not-your-case"></a>
## Nicht Ihr Fall?

| Ihr Code heute | Lesen Sie |
| --- | --- |
| Bereits `t("…")` oder `i18n.t("…")` mit dem Ausgangssprachen-Satz | [UI-Strings](/de/guide/ui-strings/) Schritte 2–3, danach [i18next einbinden](/de/guide/ui-strings/i18next-runtime) |
| i18next-Namensraum-JSON (`t("saveButton")` plus `en/translation.json`) | [JSON](/de/guide/json). Ändern Sie diese Schlüssel nicht zu Ausgangssprachen-Sätzen, es sei denn, Sie sind bereit, jeden Aufruf zu ändern |
| Intlayer-Wörterbücher, Umstellung von Intlayer | [Migration von Intlayer](/de/guide/migrating-from-intlayer) |
| Intlayer-Wörterbücher, Intlayer beibehalten | [Intlayer direkt übersetzen](/de/guide/translating-intlayer) |
| Eine HTML-Datei | [Reines HTML](/de/guide/ui-strings/plain-html) und `mark-html` |
| Dokumentations-Websites oder Astro-Seiten-HTML | [i18n zu einer Website oder Doku-Site hinzufügen](/de/guide/add-i18n-to-website) und [Astro-Website](/de/guide/ui-strings/astro-website). `t()` ist nur für gemeinsame Daten und Frontmatter |
| Eine Python-App | [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python) |
| Django, Flask-Babel-Kataloge oder eine App, die bereits GNU gettext verwendet | [i18n zu einer Django-/Python-gettext-App hinzufügen](/de/guide/add-i18n-to-django-gettext) |
| Eine Repository-README oder andere Markdown-Dateien | [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Beispiele

| Beispiel | Was es zeigt |
| --- | --- |
| [console-app](/de/examples#console-app) | Kleinste Node-App, `t()` bereits verpackt, plus ein README-Block |
| [nextjs-app](/de/examples#nextjs-app) | React-Bootstrap, Pluralformen, eine Dokumentationsseite und ein README-Block |

Kopieren Sie eines mit `npx degit`. Befehle: [Beispiele](/de/examples#nodejs-examples).
