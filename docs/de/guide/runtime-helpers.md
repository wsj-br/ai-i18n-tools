<a id="runtime-helpers"></a>
# Laufzeit-Helfer

Diese werden aus `'ai-i18n-tools/runtime'` exportiert und funktionieren in jeder JavaScript-Umgebung (Browser, Node.js, Deno, Edge). Sie importieren **nicht** aus `i18next` oder `react-i18next`.

Der **Standardexport** ist nur der i18next-helper-Namespace (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). Importieren Sie `interpolateTemplate`, `flipUiArrowsForRtl` und die Anzeigehelfer als **benannte Exporte** – sie sind keine Eigenschaften des Standardexports.

<a id="rtl-helpers"></a>
### RTL-Hilfsfunktionen

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next-Setup-Fabriken

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
extractInterpolationNamesForWrap(key: string): string[]
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

Verwenden Sie `setupKeyAsDefaultT` als üblichen Anwendungseinstiegspunkt (Schlüsselbereinigung + Plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Der alleinige Aufruf von `wrapI18nWithKeyTrim` ist für die Anwendungsverdrahtung **veraltet**.

Erstellen Sie `localeLoaders` mit `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`, damit die Schlüssel nach `generate-ui-languages` mit `targetLocales` übereinstimmen. Siehe `docs/guide/ui-strings/i18next-runtime.md` (Laufzeitverdrahtung), `examples/nextjs-app/`, `examples/console-app/` und `examples/astro-website/` (benutzerdefiniertes `makeT` ohne i18next).

<a id="display-helpers"></a>
### Anzeigehilfsfunktionen

```ts
getUILanguageLabel(lang: UiLanguageManifestRow, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow): string
```

`UiLanguageManifestRow` wird aus `'ai-i18n-tools/runtime'` exportiert (Form: `{ code, label, englishName, direction }`). Verwenden Sie es zum Typisieren von Manifestzeilen aus `ui-languages.json`.

<a id="string-helpers"></a>
### Zeichenkettenhilfsfunktionen

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` ersetzt ```{{name}}```-Platzhalter, wobei `name` mit `\w+` übereinstimmt (nur ASCII-Wortzeichen). Schlüssel mit Leerzeichen oder Bindestrichen werden nicht unterstützt.
