<a id="runtime-helpers"></a>
# Helpers d'exécution

Ces éléments sont exportés depuis `'ai-i18n-tools/runtime'` et fonctionnent dans tout environnement JavaScript (navigateur, Node.js, Deno, Edge). Ils n'importent **pas** depuis `i18next` ni `react-i18next`.

L'**exportation par défaut** est l'espace de noms i18next-helper uniquement (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). Importez `interpolateTemplate`, `flipUiArrowsForRtl` et les assistants d'affichage en tant qu'**exportations nommées** — ce ne sont pas des propriétés de l'exportation par défaut.

<a id="rtl-helpers"></a>
### Aides pour les langues de droite à gauche (RTL)

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### Usines de configuration i18next

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

Utilisez `setupKeyAsDefaultT` comme point d'entrée habituel (suppression des espaces dans les clés + pluriel `wrapT` + `translate-ui` `{sourceLocale}.json` facultatif). L'appel à `wrapI18nWithKeyTrim` seul est **déconseillé** pour le câblage de l'application.

Créez `localeLoaders` avec `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` pour que les clés restent alignées avec `targetLocales` après `generate-ui-languages`. Voir [Runtime wiring](/fr/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/) et [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (`makeT` personnalisé sans i18next).

<a id="display-helpers"></a>
### Aides à l'affichage

```ts
getUILanguageLabel(lang: UiLanguageManifestRow, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow): string
```

`UiLanguageManifestRow` est exporté depuis `'ai-i18n-tools/runtime'` (forme : `{ code, label, englishName, direction }`). Utilisez-le pour typer les lignes de manifeste de `ui-languages.json`.

<a id="string-helpers"></a>
### Aides pour les chaînes de caractères

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` remplace les espaces réservés ```{{name}}``` où `name` correspond à `\w+` (caractères de mot ASCII uniquement). Les clés avec des espaces ou des tirets ne sont pas prises en charge.
