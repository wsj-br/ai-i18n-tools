<a id="runtime-helpers"></a>
# Helpers d'exécution

Ces assistants sont exportés depuis `'ai-i18n-tools/runtime'` et fonctionnent dans n'importe quel environnement JavaScript (navigateur, Node.js, Deno, Edge). Ils n'importent **pas** depuis `i18next` ou `react-i18next`.

Utilisez-les dans le démarrage de votre application (`src/i18n.js`), le sélecteur de langue et tout code non-React qui a besoin d'utilitaires de direction ou de chaîne. Pour un câblage de bout en bout, commencez par [Câbler i18next](/fr/guide/ui-strings/i18next-runtime) ; pour les menus de langue et le RTL, voir [Sélecteur de langue et RTL](/fr/guide/ui-strings/language-switcher).

<a id="import-patterns"></a>
## Modèles d'importation

L'**exportation par défaut** est uniquement l'espace de noms i18next-helper (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). Importez `interpolateTemplate`, `flipUiArrowsForRtl`, les assistants d'affichage et les types en tant qu'**exportations nommées** — ce ne sont pas des propriétés de l'exportation par défaut.

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
## Référence rapide

| Exportation | Rôle |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | Options i18next `init()` standard pour les configurations clé-par-défaut. |
| `setupKeyAsDefaultT(i18n, options)` | **Point d'entrée d'application recommandé** — wrapper de suppression de clé, bundle pluriel source optionnel, `wrapT` sensible au pluriel. |
| `wrapT(i18n, options)` | Wrapper `t()` pluriel de niveau inférieur (généralement installé par `setupKeyAsDefaultT`). |
| `buildPluralIndexFromStringsJson(entries)` | Construit la carte `literal → groupId` que `wrapT` utilise à partir des lignes `strings.json` avec `"plural": true`. |
| `extractInterpolationNamesForWrap(message)` | Analyse les noms de placeholders <code v-pre>{{var}}</code> à partir d'une chaîne source. |
| `wrapI18nWithKeyTrim(i18n)` | Recadrage de clé + rappel du <code v-pre>{{var}}</code> de la locale source uniquement. **Obsolète** pour le câblage d'applications — utilisez `setupKeyAsDefaultT`. |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | Construit la carte `localeLoaders` pour `makeLoadLocale` à partir de `ui-languages.json` (chaque `code` sauf `sourceLocale`). |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | Fabrique pour le chargement asynchrone de JSON de locale via `addResourceBundle`. |
| `RTL_LANGS` | Ensemble en lecture seule de codes de langue de base RTL (fallback lorsqu'une locale est manquante dans le catalogue groupé). |
| `getTextDirection(lng)` | Renvoie `'ltr'` ou `'rtl'` pour un code BCP-47. |
| `applyDirection(lng, element?)` | Définit l'attribut `dir` sur `document.documentElement` (navigateur) ou un élément personnalisé. |
| `getUILanguageLabel(lang, t)` | Libellé du menu de langue utilisant `t(englishName)` une fois traduit. |
| `getUILanguageLabelNative(lang)` | Libellé du menu de langue à partir des champs du manifeste uniquement (`englishName / label`). |
| `interpolateTemplate(str, vars)` | Remplacement <code v-pre>{{var}}</code> de bas niveau sur une chaîne simple (préférez `t()` dans React/i18next). |
| `flipUiArrowsForRtl(text, isRtl)` | Inverse `→` en `←` pour les dispositions RTL. |

<a id="rtl-helpers"></a>
### Aides pour les langues de droite à gauche (RTL)

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection` consulte d'abord le catalogue `data/ui-languages-complete.json` groupé (même source que `generate-ui-languages`), puis se rabat sur `RTL_LANGS` pour les codes non présents dans le catalogue.

`applyDirection` est sûr dans Node.js — il ne fait rien lorsque `document` n'est pas disponible. Dans le navigateur, omettez `element` pour mettre à jour `document.documentElement`. Câblez-le lors du changement de langue : `i18n.on('languageChanged', applyDirection)`.

<a id="i18next-setup-factories"></a>
### Usines de configuration i18next

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

Utilisez `setupKeyAsDefaultT` comme point d'entrée habituel (suppression des espaces dans les clés + pluriel `wrapT` + `translate-ui` `{sourceLocale}.json` facultatif). L'appel à `wrapI18nWithKeyTrim` seul est **déconseillé** pour le câblage de l'application.

`sourcePluralFlatBundle` nécessite une instance i18next avec `addResourceBundle()`. Le champ `lng` doit correspondre à `SOURCE_LOCALE` dans votre fichier de démarrage et à `sourceLocale` dans `ai-i18n-tools.config.json`.

Créez `localeLoaders` avec `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` afin que les clés restent alignées avec `targetLocales` après `generate-ui-languages`. Voir [Wire i18next](/fr/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/) et [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (`makeT` personnalisé sans i18next).

<a id="display-helpers"></a>
### Aides à l'affichage

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow` est exporté en tant que `{ readonly code: string }` — la forme minimale pour les lignes de manifeste dans `makeLocaleLoadersFromManifest`. Les assistants d'affichage ont également besoin de `englishName` (et `label` pour `getUILanguageLabelNative`) à partir des entrées `ui-languages.json` de votre projet (`{ code, label, englishName, direction }`). Voir [Sélecteur de langue et RTL](/fr/guide/ui-strings/language-switcher#language-switcher-ui) pour un exemple complet.

<a id="string-helpers"></a>
### Aides pour les chaînes de caractères

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` remplace les placeholders <code v-pre>{{name}}</code> où `name` correspond à `\w+` (caractères de mots ASCII uniquement). Les clés avec des espaces ou des traits d'union ne sont pas prises en charge. `wrapI18nWithKeyTrim` utilise cela internement pour le rappel de la locale source lorsque aucune traduction n'existe.

Dans les composants React/i18next, préférez <code v-pre>t('clé {{var}}', { var })</code> — i18next gère l'interpolation de manière native.

<a id="exported-types"></a>
### Types exportés

Également exporté pour les consommateurs TypeScript : `I18nLike`, `I18nWithResources`, `SetupKeyAsDefaultTOptions`, `WrapTOptions`, `UiLanguageManifestRow`, `TranslateFn`.
