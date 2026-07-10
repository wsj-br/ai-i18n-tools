<a id="wire-i18next-at-runtime"></a>
# i18next zur Laufzeit verdrahten

Erstellen Sie Ihre i18n-Setup-Datei mit den von `'ai-i18n-tools/runtime'` exportierten Hilfsprogrammen. API-Signaturen finden Sie unter [Laufzeit-Hilfsprogramme](/de/guide/runtime-helpers).

<details>
<summary>Vollständiges i18n-Bootstrap-Beispiel (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `languagesManifestPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
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
## `SOURCE_LOCALE` synchron halten

**Drei Werte synchron halten:** `sourceLocale` in `ai-i18n-tools.config.json`, `SOURCE_LOCALE` in dieser Datei und der Plural-flache JSON-Name `translate-ui`, den als `{sourceLocale}.json` unter Ihrem flachen Ausgabeverzeichnis schreibt (häufig `public/locales/`). Verwenden Sie denselben Basisnamen in der statischen `import` (Beispiel oben: `en-GB` → `en-GB.json`). Das `lng`-Feld in `sourcePluralFlatBundle` muss `SOURCE_LOCALE` entsprechen. Statische ES `import`-Pfade können keine Variablen verwenden; wenn Sie die Quelllokalisierung ändern, aktualisieren Sie `SOURCE_LOCALE` und den Importpfad gemeinsam. Alternativ laden Sie die Datei mit einem dynamischen `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch` oder `readFileSync`, sodass der Pfad aus `SOURCE_LOCALE` gebildet wird.

Der Snippet verwendet `./locales/…` und `./public/locales/…`, als ob `i18n` neben diesen Ordnern liegt. Wenn sich Ihre Datei unter `src/` (typisch) befindet, verwenden Sie `../locales/…` und `../public/locales/…`, damit Importe zu denselben Pfaden wie `ui.stringsJson`, `languagesManifestPath` und `ui.flatOutputDir` aufgelöst werden.

Importieren Sie `i18n.js`, bevor React gerendert wird (z. B. am Anfang Ihres Einstiegspunkts). Wenn der Benutzer die Sprache ändert, rufen Sie `await loadLocale(code)` und dann `await i18n.changeLanguage(code)` auf.

`SOURCE_LOCALE` wird exportiert, damit jede andere Datei, die es benötigt (z. B. ein Sprachwechsler), es direkt aus `'./i18n'` importieren kann. Wenn Sie eine bestehende i18next-Konfiguration migrieren, ersetzen Sie alle hartkodierten Quell-Sprachcodes (z. B. `'en-GB'`-Prüfungen, die in Komponenten verstreut sind) durch Importe von `SOURCE_LOCALE` aus Ihrer i18n-Bootstrap-Datei.

Benannte Imports (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funktionieren genauso, falls Sie den Default-Export nicht verwenden möchten.

<a id="locale-loaders"></a>
## Locale-Lader

Halten Sie `localeLoaders` **mit der Konfiguration synchron**, indem Sie sie aus `ui-languages.json` mithilfe von `makeLocaleLoadersFromManifest` ableiten (dadurch werden `SOURCE_LOCALE` mit derselben Normalisierung wie `makeLoadLocale` herausgefiltert). Wenn Sie eine Sprache zu `targetLocales` hinzufügen und `generate-ui-languages` ausführen, wird das Manifest aktualisiert und Ihre Lader verfolgen die Änderung automatisch – es ist nicht nötig, eine separate hartkodierte Zuordnung zu pflegen.

Für JSON-Bundles unter `public/` (die typische Next.js-Setup-Konfiguration) rufen Sie sie über Ihren öffentlichen URL-Pfad ab:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Für Node.js-CLIs ohne Bundler verwenden Sie `readFileSync` innerhalb eines kleinen Hilfsprogramms, das die JSON-Datei für jeden Code liest und analysiert.

Verwenden Sie `setupKeyAsDefaultT` als üblichen App-Einstiegspunkt (Schlüsselkürzung + Plural `wrapT` + optionaler `translate-ui` `{sourceLocale}.json`). Der alleinige Aufruf von `wrapI18nWithKeyTrim` ist für die Anwendungsverdrahtung **veraltet** – siehe [Laufzeit-Hilfsprogramme](/de/guide/runtime-helpers).
