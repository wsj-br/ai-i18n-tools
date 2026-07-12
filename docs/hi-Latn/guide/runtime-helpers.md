<a id="runtime-helpers"></a>
# Runtime helpers

Ye helpers `'ai-i18n-tools/runtime'` se export kiye jaate hain aur kisi bhi JavaScript environment (browser, Node.js, Deno, Edge) mein kaam karte hain. Ve `i18next` ya `react-i18next` se import **nahi** karte hain.

Inka upyog apne app bootstrap (`src/i18n.js`), language switcher, aur kisi bhi non-React code mein karein jise direction ya string utilities ki zaroorat hai. End-to-end wiring ke liye, [Wire i18next](/hi-Latn/guide/ui-strings/i18next-runtime) se shuru karein; language menus aur RTL ke liye, [Language switcher & RTL](/hi-Latn/guide/ui-strings/language-switcher) dekhein.

<a id="import-patterns"></a>
## Import patterns

**Default export** kewal i18next-helper namespace hai (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …). `interpolateTemplate`, `flipUiArrowsForRtl`, display helpers, aur types ko **named exports** ke roop mein import karein — ve default export par properties nahi hain.

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
## Quick reference

| Export | Role |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | Key-as-default setups ke liye standard i18next `init()` options. |
| `setupKeyAsDefaultT(i18n, options)` | **Recommended app entry point** — key-trim wrapper, optional source plural bundle, plural-aware `wrapT`. |
| `wrapT(i18n, options)` | Lower-level plural `t()` wrapper (aam taur par `setupKeyAsDefaultT` dwara install kiya jaata hai). |
| `buildPluralIndexFromStringsJson(entries)` | `literal → groupId` map banata hai jise `wrapT` `strings.json` rows se `"plural": true` ke saath upyog karta hai. |
| `extractInterpolationNamesForWrap(message)` | Srot maanakon ko <code v-pre>{{var}}</code> sthaanakon ke naam ek srot string se parse karta hai. |
| `wrapI18nWithKeyTrim(i18n)` | Key-trim + srot-sthaaniya <code v-pre>{{var}}</code> fallback keval. **Avaidh** app wiring ke liye — `setupKeyAsDefaultT` ka upyog karein. |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | `localeLoaders` map banata hai `makeLoadLocale` ke liye `ui-languages.json` se (har `code` siway `sourceLocale` ke). |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | `addResourceBundle` ke madhyam se async locale JSON loading ke liye factory. |
| `RTL_LANGS` | RTL base language codes ka read-only set (fallback jab ek locale bundled catalog mein missing ho). |
| `getTextDirection(lng)` | BCP-47 code ke liye `'ltr'` ya `'rtl'` lautata hai. |
| `applyDirection(lng, element?)` | `dir` attribute ko `document.documentElement` (browser) ya ek custom element par set karta hai. |
| `getUILanguageLabel(lang, t)` | Anuvaad hone par `t(englishName)` ka upyog karke language menu label. |
| `getUILanguageLabelNative(lang)` | Kewal manifest fields se language menu label (`englishName / label`). |
| `interpolateTemplate(str, vars)` | Neechi-star ke <code v-pre>{{var}}</code> pratinidhitv ek saadha string par (React/i18next mein `t()` ka upyog karein). |
| `flipUiArrowsForRtl(text, isRtl)` | RTL layouts ke liye `→` ko `←` mein flip karein. |

<a id="rtl-helpers"></a>
### RTL helpers

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection` pehle bundled `data/ui-languages-complete.json` catalog (`generate-ui-languages` ke samaan source) se consult karta hai, phir catalog mein na hone wale codes ke liye `RTL_LANGS` par fallback karta hai.

`applyDirection` Node.js mein surakshit hai — jab `document` anupalabdh ho to ye no-ops karta hai. Browser mein, `element` ko chhod dein `document.documentElement` ko update karne ke liye. Ise language change par wire karein: `i18n.on('languageChanged', applyDirection)`.

<a id="i18next-setup-factories"></a>
### i18next setup factories

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

`setupKeyAsDefaultT` ko usual app entry point ke roop mein use karen (key-trim + plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Application wiring ke liye keval `wrapI18nWithKeyTrim` ko call karna **deprecated** hai.

`sourcePluralFlatBundle` ko `addResourceBundle()` ke saath ek i18next instance ki aavashyakta hai. `lng` field ko aapki bootstrap file mein `SOURCE_LOCALE` aur `ai-i18n-tools.config.json` mein `sourceLocale` se mel khana chahiye.

`localeLoaders` ko `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` ke saath banaen taaki `generate-ui-languages` ke baad keys `targetLocales` ke saath sanrekhit rahen. [Wire i18next](/hi-Latn/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/), aur [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (i18next ke bina custom `makeT`) dekhen.

<a id="display-helpers"></a>
### Display helpers

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow` ko `{ readonly code: string }` ke roop mein export kiya gaya hai — `makeLocaleLoadersFromManifest` mein manifest rows ke liye nyunatam aakar. Display helpers ko aapke project ke `ui-languages.json` entries (`{ code, label, englishName, direction }`) se `englishName` (aur `getUILanguageLabelNative` ke liye `label`) ki bhi aavashyakta hoti hai. Poore udaharan ke liye [Language switcher & RTL](/hi-Latn/guide/ui-strings/language-switcher#language-switcher-ui) dekhen.

<a id="string-helpers"></a>
### String helpers

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` <code v-pre>{{name}}</code> sthaanakon ko badalta hai jahaan `name` `\w+` (keval ASCII shabd akshar) se mel karta hai. Spaces ya hyphen wale keys ka samarthan nahin kiya jata hai. `wrapI18nWithKeyTrim` andarooni roop se iska upyog karta hai jab koi anuvaad nahin hota hai. 

React/i18next ghatakon mein, <code v-pre>t('key {{var}}', { var })</code> ka upyog karein — i18next interpolation ko svabhavik roop se sambhalta hai.

<a id="exported-types"></a>
### Export kiye gaye prakar

TypeScript upbhoktaon ke liye bhi export kiya gaya hai: `I18nLike`, `I18nWithResources`, `SetupKeyAsDefaultTOptions`, `WrapTOptions`, `UiLanguageManifestRow`, `TranslateFn`.
