<a id="add-i18n-to-a-jsts-app"></a>
# i18n zu einer JS/TS-App hinzufügen

Diese Seite ist für eine JS/TS-App (React, Next.js, Node oder eine CLI), deren Schaltflächen, Beschriftungen und Meldungen noch reiner Quellsprachentext sind. `extract` erfasst einen UI-String nur, wenn es sich um ein String-Literal innerhalb von `t()` oder `i18n.t()` handelt, sodass der Katalog heute leer wäre und `translate-ui` nichts zu übersetzen hätte.

Die Schritte: das Tool installieren, i18next installieren, `extract` einmal ausführen, eine kleine Setup-Datei hinzufügen, damit `t` existiert, den benutzerorientierten Text umschließen und dann übersetzen. Sie sind sich nicht sicher, ob dies auf Sie zutrifft? Siehe [Nicht Ihr Fall?](#not-your-case) am Ende.

<a id="install-the-tool-and-set-the-key"></a>
## Das Tool installieren und den Schlüssel festlegen

Installieren Sie die CLI ([Installation](/de/guide/installation)) und legen Sie den API-Schlüssel für Ihren Anbieter fest ([Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key)). Ollama benötigt keinen Schlüssel.

<a id="initialise-the-config"></a>
## Die Konfiguration initialisieren

```bash
ai-i18n-tools init -P openrouter
```

Dies schreibt `ai-i18n-tools.config.json`. Vier Schlüssel sind vorerst wichtig:

- `sourceLocale`: die Sprache, in der Ihr Text geschrieben ist. Jede Sprache ist gültig. Englisch ist ein häufiges Beispiel in diesem Leitfaden.
- `targetLocales`: die hinzuzufügenden Sprachen.
- `ui.sourceRoots`: die Ordner, die `extract` scannt, zum Beispiel `src/`.
- `ui.stringsJson` und `ui.flatOutputDir`: wo der Katalog und die pro-Locale-Dateien geschrieben werden.

Jeder andere Schlüssel ist in [Konfiguration](/de/reference/configuration).

<a id="install-the-runtime-libraries"></a>
## Die Laufzeitbibliotheken installieren

ai-i18n-tools hängt nicht von `i18next` oder `react-i18next` ab. Die App installiert sie.

- Jede JS/TS-App, die Strings zur Laufzeit nachschlägt: `i18next`.
- React-Komponenten, die `useTranslation()` aufrufen: `react-i18next` ebenfalls.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="run-extract-once"></a>
## Extract einmal ausführen

```bash
ai-i18n-tools extract
```

Die Setup-Datei im nächsten Schritt importiert `strings.json` und `ui-languages.json`, und nur `extract` schreibt sie. Sie schreibt beide, auch wenn sie keine `t()`-Aufrufe findet, damit die App kompiliert. Erwarten Sie 0 Strings, oder 1, wenn Ihre `package.json` eine `description` hat, weil der Extractor sie standardmäßig einschließt (`ui.uiExtractor.includePackageDescription`).

<a id="add-the-bootstrap"></a>
## Den Bootstrap hinzufügen

Erstellen Sie die i18n-Setup-Datei. Diese minimale Version reicht aus, um Strings zu umschließen und zu übersetzen. `SOURCE_LOCALE` muss `sourceLocale` in `ai-i18n-tools.config.json` entsprechen.

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

Wenn die App beginnt, Pluralformen zu verwenden, fügen Sie die Quell-Locale-Flat-Datei hinzu, damit Pluralformen aufgelöst werden. Das fügt einen dritten Import und eine `sourcePluralFlatBundle`-Option hinzu, gezeigt in [i18next verdrahten](/de/guide/ui-strings/i18next-runtime).

Importieren Sie diese Datei aus dem App-Einstiegspunkt vor dem ersten Rendern. In Next.js importieren Sie sie aus einem Client-Modul, dem gleichen Muster folgend wie [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts).

<a id="replace-hardcoded-copy"></a>
## Hardcodierten Text ersetzen

Machen Sie dies manuell, oder fügen Sie den [JS/TS-Prompt](#agent-prompt) in einen Coding-Agenten ein. Das Argument für `t()` ist der Satz in der Ausgangssprache, den der Benutzer sehen soll. Flache Locale-Dateien werden nach diesem Satz geschlüsselt.

<details class="agent-prompt" id="agent-prompt">
<summary>JS/TS-Agenten-Prompt</summary>

Kopieren Sie dies in Cursor oder einen anderen Coding-Agenten. Es umschließt benutzerseitige Literale. Es übersetzt sie nicht.

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The
literal is the source-language sentence and the catalog key (`t("Save")`, not
`t("saveButton")`). After this edit the app must behave the same when the active
locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference:
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees
(JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids,
enum and error codes, object keys used as identifiers, log field names, CSS,
regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses
`useTranslation()`. Run `ai-i18n-tools extract` once so `strings.json` and
`ui-languages.json` exist, then add the bootstrap from the Wire i18next guide.
`SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant
  that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call
  `changeLanguage` on a shared i18next instance inside a server component. Use a
  per-request `createInstance()`, or a stateless flat-bundle lookup.

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

## Order

1. Install the libraries.
2. Run `ai-i18n-tools extract` once.
3. Add the bootstrap.
4. Wrap call sites.
5. Run `ai-i18n-tools extract` again. Do not run a translation yourself and do
   not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you
  wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original
  sentence. Switch one target locale after `translate-ui` and confirm those
  sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case you left for a human (the same word used with different
meanings, concatenated sentences, or a plural you were not sure about).
````

</details>

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

<a id="extract-and-translate"></a>
## Extrahieren und Übersetzen

Wenn die Literale vorhanden sind:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`sync` führt `extract` und `translate-ui` zusammen aus, wenn `features.translateUIStrings` aktiviert ist. `extract` sollte nun die von Ihnen umschlossenen Sätze auflisten. Öffnen Sie eine generierte Locale-Datei unter `ui.flatOutputDir` und bestätigen Sie, dass die Übersetzungen vorhanden sind. Weiter: [UI-Strings, Schritt 2](/de/guide/ui-strings/#step-2-extract-strings) für das, was `extract` scannt und schreibt.

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) ist eine kleine Node-App, deren `src/main.js` bereits umschlossen ist. Das Next.js-Beispiel ist der React-Bootstrap.

<a id="language-switching"></a>
## Sprachwechsel

Stellen Sie ein gespeichertes Locale vor dem ersten Rendern wieder her, wie in [i18next verbinden](/de/guide/ui-strings/i18next-runtime#startup-locale) beschrieben. Fügen Sie dann ein Steuerelement hinzu, das `await loadLocale(code)` gefolgt von `await i18n.changeLanguage(code)` aufruft: [Sprachumschalter und RTL](/de/guide/ui-strings/language-switcher).

<a id="keep-it-translated"></a>
## Übersetzt halten

Führen Sie `sync` erneut aus, nachdem Sie den Quelltext geändert haben. Der Cache bedeutet, dass nur neue oder geänderte Strings an das Modell gesendet werden. Fügen Sie die Skripte aus [Empfohlene package.json-Skripte](/de/guide/quick-start#recommended-packagejson-scripts) hinzu und führen Sie `sync` in CI aus, damit die Übersetzungen nicht abweichen.

Die Standardvorlage `init` übersetzt auch `README.md`. Siehe [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

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
| Eine Repository-README oder andere Markdown-Dateien | [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme) |
