<a id="runtime-helpers"></a>
# Laufzeit-Helfer

Diese Helfer werden aus `'ai-i18n-tools/runtime'` exportiert und funktionieren in jeder JavaScript-Umgebung (Browser, Node.js, Deno, Edge). Sie importieren **nicht** aus `i18next` oder `react-i18next`.

Verwenden Sie sie in Ihrem App-Bootstrap (`src/i18n.js`), Sprachumschalter und jedem Nicht-React-Code, der Richtungs- oder String-Dienstprogramme benötigt. Für die End-to-End-Verkabelung beginnen Sie mit [i18next verdrahten](/de/guide/ui-strings/i18next-runtime); für Sprachmenüs und RTL siehe [Sprachumschalter & RTL](/de/guide/ui-strings/language-switcher).

<a id="import-patterns"></a>
## Importmuster

Der **Standardexport** ist nur der i18next-Helfer-Namespace (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). Importieren Sie `interpolateTemplate`, `flipUiArrowsForRtl`, Anzeigehelfer und Typen als **benannte Exporte** – sie sind keine Eigenschaften des Standardexports.

```js
// Namespace style (common in i18n bootstrap files)
import aiI18n from 'ai-i18n-tools/runtime';
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

// Named imports (language switcher, one-off utilities)
import {
  getUILanguageLabel,
  getTextDirection,
  type UiLanguageManifestRow,
} from 'ai-i18n-tools/runtime';
```

<a id="quick-reference"></a>
## Kurzübersicht

| Export | Rolle |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | Standard i18next `init()`-Optionen für Key-as-Default-Setups. |
| `setupKeyAsDefaultT(i18n, options)` | **Empfohlener App-Einstiegspunkt** – Key-Trim-Wrapper, optionales Quell-Plural-Bundle, Plural-fähiges `wrapT`. |
| `wrapT(i18n, options)` | Wrapper für Plural-`t()` auf niedrigerer Ebene (wird normalerweise von `setupKeyAsDefaultT` installiert). |
| `buildPluralIndexFromStringsJson(entries)` | Erstellt die `literal → groupId`-Map, die `wrapT` aus `strings.json`-Zeilen mit `"plural": true` verwendet. |
| `extractInterpolationNamesForWrap(message)` | Analysiert <code v-pre>{{var}}</code>-Platzhalternamen aus einer Quellzeichenfolge. |
| `wrapI18nWithKeyTrim(i18n)` | Key-Trim + Quell-Lokalisierung <code v-pre>{{var}}</code>-Fallback nur. **Veraltet** für App-Verkabelung — verwenden Sie `setupKeyAsDefaultT`. |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | Erstellt die `localeLoaders`-Map für `makeLoadLocale` aus `ui-languages.json` (jedes `code` außer `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | Factory für asynchrones Laden von Locale-JSON über `addResourceBundle`. |
| `RTL_LANGS` | Schreibgeschützter Satz von RTL-Basissprachcodes (Fallback, wenn ein Locale im gebündelten Katalog fehlt). |
| `getTextDirection(lng)` | Gibt `'ltr'` oder `'rtl'` für einen BCP-47-Code zurück. |
| `applyDirection(lng, element?)` | Setzt das `dir`-Attribut auf `document.documentElement` (Browser) oder einem benutzerdefinierten Element. |
| `getUILanguageLabel(lang, t)` | Sprachmenü-Beschriftung, die `t(englishName)` verwendet, wenn übersetzt. |
| `getUILanguageLabelNative(lang)` | Sprachmenü-Beschriftung nur aus Manifestfeldern (`englishName / label`). |
| `interpolateTemplate(str, vars)` | Low-Level-<code v-pre>{{var}}</code>-Ersetzung in einer einfachen Zeichenfolge (in React/i18next `t()` bevorzugen). |
| `flipUiArrowsForRtl(text, isRtl)` | Kehrt `→` zu `←` für LTR-Layouts um. |

<a id="rtl-helpers"></a>
### RTL-Hilfsfunktionen

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection` konsultiert zuerst den gebündelten `data/ui-languages-complete.json`-Katalog (dieselbe Quelle wie `generate-ui-languages`), dann fällt es auf `RTL_LANGS` für Codes zurück, die nicht im Katalog sind.

`applyDirection` ist sicher in Node.js – es ist ein No-Op, wenn `document` nicht verfügbar ist. Im Browser lassen Sie `element` weg, um `document.documentElement` zu aktualisieren. Verdrahten Sie es bei Sprachwechsel: `i18n.on('languageChanged', applyDirection)`.

<a id="i18next-setup-factories"></a>
### i18next-Setup-Fabriken

```ts
defaultI18nInitOptions(sourceLocale?: string): {
  resources: Record<string, never>;
  lng: string;
  fallbackLng: string;
  parseMissingKeyHandler: (key: string) => string;
  interpolation: { escapeValue: false };
  nsSeparator: false;
}

setupKeyAsDefaultT(
  i18n: I18nLike & Partial<Pick<I18nWithResources, 'addResourceBundle'>>,
  options: SetupKeyAsDefaultTOptions
): void

// SetupKeyAsDefaultTOptions:
// {
//   stringsJson: Record<string, { plural?: boolean; source?: string }>;
//   sourcePluralFlatBundle?: { lng: string; bundle: Record<string, string> };
// }

wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
// WrapTOptions: { pluralIndex: Record<string, string> }

buildPluralIndexFromStringsJson(
  entries: Record<string, { plural?: boolean; source?: string }>
): Record<string, string>

extractInterpolationNamesForWrap(message: string): string[]

makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>

makeLoadLocale(
  i18n: I18nLike & Pick<I18nWithResources, 'addResourceBundle'>,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

Verwenden Sie `setupKeyAsDefaultT` als üblichen Anwendungseinstiegspunkt (Schlüsselbereinigung + Plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Der alleinige Aufruf von `wrapI18nWithKeyTrim` ist für die Anwendungsverdrahtung **veraltet**.

`sourcePluralFlatBundle` erfordert eine i18next-Instanz mit `addResourceBundle()`. Das Feld `lng` muss mit `SOURCE_LOCALE` in Ihrer Bootstrap-Datei und `sourceLocale` in `ai-i18n-tools.config.json` übereinstimmen.

Erstellen Sie `localeLoaders` mit `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`, damit die Schlüssel nach `generate-ui-languages` mit `targetLocales` übereinstimmen. Siehe [i18next verdrahten](/de/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/) und [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (benutzerdefiniertes `makeT` ohne i18next).

<a id="display-helpers"></a>
### Anzeigehilfsfunktionen

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow` wird als `{ readonly code: string }` exportiert – die minimale Form für Manifestzeilen in `makeLocaleLoadersFromManifest`. Die Anzeigehelfer benötigen auch `englishName` (und `label` für `getUILanguageLabelNative`) aus den `ui-languages.json`-Einträgen Ihres Projekts (`{ code, label, englishName, direction }`). Ein vollständiges Beispiel finden Sie unter [Sprachumschalter & RTL](/de/guide/ui-strings/language-switcher#language-switcher-ui).

<a id="string-helpers"></a>
### Zeichenkettenhilfsfunktionen

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` ersetzt <code v-pre>{{name}}</code>-Platzhalter, wenn `name` `\w+` entspricht (nur ASCII-Wortzeichen). Schlüssel mit Leerzeichen oder Bindestrichen werden nicht unterstützt. `wrapI18nWithKeyTrim` verwendet dies intern für den Quell-Lokalisierungs-Fallback, wenn keine Übersetzung vorhanden ist.

In React/i18next-Komponenten bevorzugen Sie <code v-pre>t('Schlüssel {{var}}', { var })</code> — i18next behandelt die Interpolation nativ.

<a id="exported-types"></a>
### Exportierte Typen

Ebenfalls für TypeScript-Benutzer exportiert: `I18nLike`, `I18nWithResources`, `SetupKeyAsDefaultTOptions`, `WrapTOptions`, `UiLanguageManifestRow`, `TranslateFn`.
