<a id="runtime-helpers"></a>
# रनटाइम हेल्पर

ये हेल्पर `'ai-i18n-tools/runtime'` से निर्यात किए जाते हैं और किसी भी JavaScript वातावरण (ब्राउज़र, Node.js, Deno, Edge) में काम करते हैं। वे `i18next` या `react-i18next` से आयात **नहीं** करते हैं।

इन्हें अपने ऐप बूटस्ट्रैप (`src/i18n.js`), भाषा स्विचर और किसी भी गैर-रिएक्ट कोड में उपयोग करें जिसे दिशा या स्ट्रिंग यूटिलिटी की आवश्यकता है। एंड-टू-एंड वायरिंग के लिए, [i18next वायर करें](/hi/guide/ui-strings/i18next-runtime) से शुरू करें; भाषा मेनू और RTL के लिए, [भाषा स्विचर और RTL](/hi/guide/ui-strings/language-switcher) देखें।

<a id="import-patterns"></a>
## आयात पैटर्न

**डिफ़ॉल्ट निर्यात** केवल i18next-हेल्पर नेमस्पेस है (`defaultI18nInitOptions`, `setupKeyAsDefaultT`, `wrapT`, `makeLoadLocale`, …)। `interpolateTemplate`, `flipUiArrowsForRtl`, डिस्प्ले हेल्पर और प्रकारों को **नामित निर्यात** के रूप में आयात करें — वे डिफ़ॉल्ट निर्यात पर गुण नहीं हैं।

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
## त्वरित संदर्भ

| निर्यात | भूमिका |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | कुंजी-के-रूप-में-डिफ़ॉल्ट सेटअप के लिए मानक i18next `init()` विकल्प। |
| `setupKeyAsDefaultT(i18n, options)` | **अनुशंसित ऐप एंट्री पॉइंट** — कुंजी-ट्रिम रैपर, वैकल्पिक स्रोत बहुवचन बंडल, बहुवचन-जागरूक `wrapT`। |
| `wrapT(i18n, options)` | निम्न-स्तरीय बहुवचन `t()` रैपर (आमतौर पर `setupKeyAsDefaultT` द्वारा स्थापित)। |
| `buildPluralIndexFromStringsJson(entries)` | `literal → groupId` मैप बनाता है जिसका उपयोग `wrapT` `strings.json` पंक्तियों से `"plural": true` के साथ करता है। |
| `extractInterpolationNamesForWrap(message)` | एक स्रोत स्ट्रिंग से <code v-pre>{{var}}</code> प्लेसहोल्डर नामों को पार्स करता है। |
| `wrapI18nWithKeyTrim(i18n)` | कुंजी-ट्रिम + स्रोत-स्थानीय <code v-pre>{{var}}</code> केवल फ़ॉलबैक। ऐप वायरिंग के लिए **अप्रचलित** — `setupKeyAsDefaultT` का उपयोग करें। |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | `makeLoadLocale` के लिए `localeLoaders` मैप बनाता है `ui-languages.json` से (`sourceLocale` को छोड़कर हर `code`)। |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | `addResourceBundle` के माध्यम से अतुल्यकालिक स्थानीय JSON लोडिंग के लिए फ़ैक्टरी। |
| `RTL_LANGS` | RTL आधार भाषा कोड का केवल-पढ़ने वाला सेट (जब बंडल किए गए कैटलॉग से कोई स्थानीय गायब हो तो फ़ॉलबैक)। |
| `getTextDirection(lng)` | BCP-47 कोड के लिए `'ltr'` या `'rtl'` लौटाता है। |
| `applyDirection(lng, element?)` | `document.documentElement` (ब्राउज़र) या एक कस्टम तत्व पर `dir` विशेषता सेट करता है। |
| `getUILanguageLabel(lang, t)` | अनुवादित होने पर `t(englishName)` का उपयोग करके भाषा मेनू लेबल। |
| `getUILanguageLabelNative(lang)` | केवल मैनिफेस्ट फ़ील्ड से भाषा मेनू लेबल (`englishName / label`)। |
| `interpolateTemplate(str, vars)` | एक सादे स्ट्रिंग पर निम्न-स्तरीय <code v-pre>{{var}}</code> प्रतिस्थापन (रिएक्ट/i18next में `t()` को प्राथमिकता दें)। |
| `flipUiArrowsForRtl(text, isRtl)` | RTL लेआउट के लिए `→` को `←` पर फ़्लिप करें। |

<a id="rtl-helpers"></a>
### RTL हेल्पर

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection` पहले बंडल किए गए `data/ui-languages-complete.json` कैटलॉग से परामर्श करता है (`generate-ui-languages` के समान स्रोत), फिर कैटलॉग में नहीं होने वाले कोड के लिए `RTL_LANGS` पर वापस आता है।

Node.js में `applyDirection` सुरक्षित है — जब `document` अनुपलब्ध होता है तो यह नो-ऑप्स करता है। ब्राउज़र में, `document.documentElement` को अपडेट करने के लिए `element` को छोड़ दें। भाषा बदलने पर इसे वायर करें: `i18n.on('languageChanged', applyDirection)`।

<a id="i18next-setup-factories"></a>
### i18next सेटअप फ़ैक्टरियाँ

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

सामान्य ऐप एंट्री पॉइंट के रूप में `setupKeyAsDefaultT` का उपयोग करें (की-ट्रिम + बहुवचन `wrapT` + वैकल्पिक `translate-ui` `{sourceLocale}.json`)। एप्लिकेशन वायरिंग के लिए अकेले `wrapI18nWithKeyTrim` को कॉल करना **अप्रचलित** है।

`sourcePluralFlatBundle` को `addResourceBundle()` के साथ एक i18next इंस्टेंस की आवश्यकता है। `lng` फ़ील्ड आपके बूटस्ट्रैप फ़ाइल में `SOURCE_LOCALE` और `ai-i18n-tools.config.json` में `sourceLocale` से मेल खाना चाहिए।

`makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` के साथ `localeLoaders` बनाएँ ताकि `generate-ui-languages` के बाद कुंजियाँ `targetLocales` के साथ संरेखित रहें। [i18next वायर करें](/hi/guide/ui-strings/i18next-runtime), [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/), [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/), और [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (i18next के बिना कस्टम `makeT`) देखें।

<a id="display-helpers"></a>
### डिस्प्ले हेल्पर

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow` को `{ readonly code: string }` के रूप में निर्यात किया जाता है — `makeLocaleLoadersFromManifest` में मैनिफेस्ट पंक्तियों के लिए न्यूनतम आकार। डिस्प्ले हेल्पर को आपके प्रोजेक्ट की `ui-languages.json` प्रविष्टियों (`{ code, label, englishName, direction }`) से `englishName` (और `getUILanguageLabelNative` के लिए `label`) की भी आवश्यकता होती है। पूर्ण उदाहरण के लिए [भाषा स्विचर और RTL](/hi/guide/ui-strings/language-switcher#language-switcher-ui) देखें।

<a id="string-helpers"></a>
### स्ट्रिंग हेल्पर

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` <code v-pre>{{name}}</code> प्लेसहोल्डर को बदलता है जहाँ `name` `\w+` (केवल ASCII शब्द वर्ण) से मेल खाता है। रिक्त स्थान या हाइफ़न वाली कुंजियाँ समर्थित नहीं हैं। `wrapI18nWithKeyTrim` इसका आंतरिक रूप से स्रोत-स्थानीय फ़ॉलबैक के लिए उपयोग करता है जब कोई अनुवाद मौजूद नहीं होता है।

React/i18next घटकों में, <code v-pre>t('key {{var}}', { var })</code> को प्राथमिकता दें — i18next मूल रूप से इंटरपोलेशन को संभालता है।

<a id="exported-types"></a>
### निर्यातित प्रकार

TypeScript उपभोक्ताओं के लिए भी निर्यात किया गया: `I18nLike`, `I18nWithResources`, `SetupKeyAsDefaultTOptions`, `WrapTOptions`, `UiLanguageManifestRow`, `TranslateFn`।
