# ai-i18n-tools: प्रारंभ करना

`ai-i18n-tools` दो स्वतंत्र, संयोज्य कार्यप्रवाह प्रदान करता है:

- **वर्कफ़्लो 1 - UI अनुवाद**: किसी भी JS/TS स्रोत से `t("…")` कॉल निकालें, उन्हें OpenRouter के माध्यम से अनुवादित करें, और i18next के लिए तैयार प्रति-स्थानांतरण JSON फ़ाइलें लिखें।
- **वर्कफ़्लो 2 - दस्तावेज़ अनुवाद**: किसी भी संख्या में स्थानांतरणों के लिए मार्कडाउन (MDX) और डॉक्यूसॉरस JSON लेबल फ़ाइलों का अनुवाद करें, स्मार्ट कैशिंग के साथ। **SVG** संपत्तियों के लिए `features.translateSVG`, शीर्ष-स्तरीय `svg` ब्लॉक और `translate-svg` का उपयोग करें (देखें [CLI संदर्भ](#cli-reference))।

दोनों कार्यप्रवाह OpenRouter (किसी भी संगत LLM) का उपयोग करते हैं और एक ही कॉन्फ़िग फ़ाइल साझा करते हैं।

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**सामग्री की तालिका**

- [स्थापना](#installation)
- [त्वरित प्रारंभ](#quick-start)
- [कार्यप्रवाह 1 - यूआई अनुवाद](#workflow-1---ui-translation)
  - [चरण 1: आरंभ करें](#step-1-initialise)
  - [चरण 2: स्ट्रिंग्स निकालें](#step-2-extract-strings)
  - [चरण 3: यूआई स्ट्रिंग्स का अनुवाद करें](#step-3-translate-ui-strings)
  - [XLIFF 2.0 में निर्यात करना (वैकल्पिक)](#exporting-to-xliff-20-optional)
  - [चरण 4: रनटाइम पर i18next को जोड़ें](#step-4-wire-i18next-at-runtime)
  - [स्रोत कोड में `t()` का उपयोग](#using-t-in-source-code)
  - [इंटरपोलेशन](#interpolation)
  - [भाषा स्विचर यूआई](#language-switcher-ui)
  - [दाएं से बाएं भाषाएं](#rtl-languages)
- [कार्यप्रवाह 2 - दस्तावेज़ अनुवाद](#workflow-2---document-translation)
  - [चरण 1: आरंभ करें](#step-1-initialise-1)
  - [चरण 2: दस्तावेज़ों का अनुवाद करें](#step-2-translate-documents)
    - [कैश व्यवहार और `translate-docs` झंडे](#cache-behaviour-and-translate-docs-flags)
  - [आउटपुट लेआउट](#output-layouts)
- [संयुक्त कार्यप्रवाह (यूआई + दस्तावेज़)](#combined-workflow-ui--docs)
- [कॉन्फ़िगरेशन संदर्भ](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (वैकल्पिक)](#uilanguagespath-optional)
  - [`concurrency` (वैकल्पिक)](#concurrency-optional)
  - [`batchConcurrency` (वैकल्पिक)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (वैकल्पिक)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg` (वैकल्पिक)](#svg-optional)
  - [`glossary`](#glossary)
- [CLI संदर्भ](#cli-reference)
- [पर्यावरण चर](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## स्थापना

प्रकाशित पैकेज **ESM-केवल** है। Node.js या अपने बंडलर में `import`/`import()` का उपयोग करें; `require('ai-i18n-tools')` **का उपयोग न करें।**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools में अपना स्वयं का स्ट्रिंग एक्सट्रैक्टर शामिल है। यदि आप पहले `i18next-scanner`, `babel-plugin-i18next-extract`, या इसी तरह के उपकरणों का उपयोग कर रहे थे, तो माइग्रेट करने के बाद आप उन डेव डिपेंडेंसी को हटा सकते हैं।

अपनी OpenRouter API कुंजी सेट करें:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

या परियोजना की जड़ में एक `.env` फ़ाइल बनाएं:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## त्वरित प्रारंभ

डिफ़ॉल्ट `init` टेम्पलेट (`ui-markdown`) केवल **UI** निष्कर्षण और अनुवाद को सक्षम करता है। `ui-docusaurus` टेम्पलेट **दस्तावेज़** अनुवाद (`translate-docs`) को सक्षम करता है। जब आप एक ऐसा कमांड चाहते हैं जो निष्कर्षण, UI अनुवाद, वैकल्पिक स्टैंडअलोन SVG अनुवाद, और आपके कॉन्फ़िगरेशन के अनुसार दस्तावेज़ अनुवाद चलाता है, तो `sync` का उपयोग करें।

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

### अनुशंसित `package.json` स्क्रिप्ट्स

पैकेज को स्थानीय रूप से स्थापित करने के बाद, आप सीधे स्क्रिप्ट्स में CLI कमांड का उपयोग कर सकते हैं (`npx` की आवश्यकता नहीं है):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-ui && ai-i18n-tools translate-svg && ai-i18n-tools translate-docs",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

## कार्यप्रवाह 1 - UI अनुवाद

i18next का उपयोग करने वाले किसी भी JS/TS प्रोजेक्ट के लिए डिज़ाइन किया गया: React ऐप्स, Next.js (क्लाइंट और सर्वर घटक), Node.js सेवाएँ, CLI उपकरण।

### चरण 1: प्रारंभ करें

```bash
npx ai-i18n-tools init
```

यह `ai-i18n-tools.config.json` को `ui-markdown` टेम्पलेट के साथ लिखता है। इसे संपादित करें ताकि:

- `sourceLocale` - आपकी स्रोत भाषा का BCP-47 कोड (उदाहरण के लिए `"en-GB"`)। **मेल खाना चाहिए** `SOURCE_LOCALE` से जो आपकी रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) में एक्सपोर्ट किया गया है।
- `targetLocales` - आपकी लक्ष्य भाषाओं के लिए BCP-47 कोड की सरणी (उदाहरण के लिए `["de", "fr", "pt-BR"]`)। इस सूची से `ui-languages.json` मैनिफेस्ट बनाने के लिए `generate-ui-languages` चलाएं।
- `ui.sourceRoots` - `t("…")` कॉल के लिए स्कैन करने वाली निर्देशिकाएँ (उदाहरण के लिए `["src/"]`)।
- `ui.stringsJson` - मास्टर कैटलॉग लिखने के लिए स्थान (उदाहरण के लिए `"src/locales/strings.json"`)।
- `ui.flatOutputDir` - `de.json`, `pt-BR.json`, आदि लिखने के लिए स्थान (उदाहरण के लिए `"src/locales/"`)।
- `ui.preferredModel` (वैकल्पिक) - केवल `translate-ui` के लिए **पहले** आज़माने के लिए OpenRouter मॉडल आईडी; विफलता पर CLI `openrouter.translationModels` (या पुराने `defaultModel` / `fallbackModel`) के क्रम में जारी रखता है, डुप्लिकेट को छोड़कर।

### चरण 2: स्ट्रिंग्स निकालें

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` के तहत सभी JS/TS फ़ाइलों को `t("literal")` और `i18n.t("literal")` कॉल के लिए स्कैन करता है। (या इसमें मर्ज करता है) `ui.stringsJson` में लिखता है।

स्कैनर कॉन्फ़िगर करने योग्य है: कस्टम फ़ंक्शन नाम जोड़ें `ui.reactExtractor.funcNames` के माध्यम से।

### चरण 3: UI स्ट्रिंग्स का अनुवाद करें

```bash
npx ai-i18n-tools translate-ui
```

`strings.json` पढ़ता है, प्रत्येक लक्षित स्थानीयता के लिए OpenRouter को बैच भेजता है, `ui.flatOutputDir` में सपाट JSON फ़ाइलें (`de.json`, `fr.json`, आदि) लिखता है। जब `ui.preferredModel` सेट किया जाता है, तो उस मॉडल का प्रयास किया जाता है जो `openrouter.translationModels` में क्रमबद्ध सूची से पहले है (दस्तावेज़ अनुवाद और अन्य आदेश अभी भी केवल `openrouter` का उपयोग करते हैं)।

प्रत्येक प्रविष्टि के लिए, `translate-ui` प्रत्येक स्थानीयकरण को सफलतापूर्वक अनुवादित करने वाले **OpenRouter मॉडल आईडी** को एक वैकल्पिक `models` ऑब्जेक्ट में संग्रहीत करता है (जिसकी स्थानीयकरण कुंजियाँ `translated` के समान होती हैं)। स्थानीय `editor` कमांड में संपादित किए गए स्ट्रिंग्स को `models` में उस स्थानीयकरण के लिए सेंटिनल मान `user-edited` से चिह्नित किया जाता है। `ui.flatOutputDir` के तहत प्रति-स्थानीयकरण फ्लैट फ़ाइल्स केवल **स्रोत स्ट्रिंग → अनुवाद** रहती हैं; उनमें `models` शामिल नहीं होता है (ताकि रनटाइम बंडल अपरिवर्तित रहें)।

> **कैश संपादक का उपयोग करने पर नोट:** यदि आप कैश संपादक में एक प्रविष्टि संपादित करते हैं, तो आपको अपडेट की गई कैश प्रविष्टि के साथ आउटपुट फ़ाइलों को फिर से लिखने के लिए `sync --force-update` (या समकक्ष `translate` आदेश के साथ `--force-update`) चलाना होगा। इसके अलावा, ध्यान रखें कि यदि स्रोत पाठ बाद में बदलता है, तो आपका मैनुअल संपादन खो जाएगा क्योंकि नए स्रोत स्ट्रिंग के लिए एक नया कैश कुंजी (हैश) उत्पन्न किया जाएगा।

### XLIFF 2.0 में निर्यात करना (वैकल्पिक)

यूआई स्ट्रिंग्स को एक अनुवाद विक्रेता, TMS या CAT उपकरण को सौंपने के लिए, कैटलॉग को **XLIFF 2.0** के रूप में निर्यात करें (प्रत्येक लक्ष्य स्थान के लिए एक फ़ाइल)। यह कमांड **केवल पढ़ने के लिए** है: यह `strings.json` में संशोधन नहीं करता है या कोई API नहीं कॉल करता है।

```bash
npx ai-i18n-tools export-ui-xliff
```

डिफ़ॉल्ट रूप से, फ़ाइलें `ui.stringsJson` के बगल में लिखी जाती हैं, जैसे `strings.de.xliff`, `strings.pt-BR.xliff` (आपके कैटलॉग का बेसनेम + स्थान + `.xliff`)। कहीं और लिखने के लिए `-o` / `--output-dir` का उपयोग करें। `strings.json` से मौजूदा अनुवाद `<target>` में दिखाई देते हैं; लापता स्थानों के लिए `state="initial"` का उपयोग किया जाता है और कोई `<target>` नहीं होता ताकि उपकरण उन्हें भर सकें। प्रत्येक स्थान के लिए अभी भी अनुवाद की आवश्यकता वाली केवल इकाइयों को निर्यात करने के लिए `--untranslated-only` का उपयोग करें (विक्रेता बैच के लिए उपयोगी)। `--dry-run` फ़ाइलें लिखे बिना पथ प्रिंट करता है।

### चरण 4: रनटाइम पर i18next को वायर करें

आपकी i18n सेटअप फ़ाइल बनाएं जो `'ai-i18n-tools/runtime'` द्वारा निर्यात किए गए सहायक फ़ंक्शंस का उपयोग करती है:

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialize i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// setup the key-as-default translation
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

**तीन मानों को संरेखित रखें:** `sourceLocale` **`ai-i18n-tools.config.json`** में, इस फ़ाइल में **`SOURCE_LOCALE`**, और बहुवचन सपाट JSON **`translate-ui`** आपकी सपाट आउटपुट डायरेक्टरी के तहत **`{sourceLocale}.json`** के रूप में लिखता है (अक्सर `public/locales/`)। स्थिर **`import`** में उसी बेसनेम का उपयोग करें (उपरोक्त उदाहरण: `en-GB` → `en-GB.json`)। **`lng`** फ़ील्ड में **`sourcePluralFlatBundle`** का मान **`SOURCE_LOCALE`** के बराबर होना चाहिए। स्थिर ES **`import`** पथ चर का उपयोग नहीं कर सकते हैं; यदि आप स्रोत स्थानीयकरण बदलते हैं, तो **`SOURCE_LOCALE`** और आयात पथ को एक साथ अपडेट करें। वैकल्पिक रूप से, एक गतिशील **`import(\`./public/locales/${SOURCE_LOCALE}.json\`)`**, **`fetch`**, या **`readFileSync`** के साथ उस फ़ाइल को लोड करें ताकि पथ **`SOURCE_LOCALE`** से बनाया जा सके।

यह स्निपेट **`./locales/…`** और **`./public/locales/…`** का उपयोग इस प्रकार करता है जैसे **`i18n`** उन फ़ोल्डरों के बगल में स्थित हो। यदि आपकी फ़ाइल **`src/`** के तहत है (सामान्य), तो **`../locales/…`** और **`../public/locales/…`** का उपयोग करें ताकि आयात **`ui.stringsJson`**, **`uiLanguagesPath`**, और **`ui.flatOutputDir`** के समान पथ को हल करें।

React रेंडर होने से पहले `i18n.js` आयात करें (जैसे आपके प्रवेश बिंदु के शीर्ष पर)। जब उपयोगकर्ता भाषा बदलता है, तो `await loadLocale(code)` फिर `i18n.changeLanguage(code)` कॉल करें।

**`ui-languages.json`** के साथ **`makeLocaleLoadersFromManifest`** का उपयोग करके उन्हें व्युत्पन्न करके `localeLoaders` **को कॉन्फ़िग के साथ संरेखित रखें** (**`makeLoadLocale`** के समान सामान्यीकरण का उपयोग करके **`SOURCE_LOCALE`** को फ़िल्टर आउट करता है)। जब आप **`targetLocales`** में एक स्थानीयकरण जोड़ते हैं और **`generate-ui-languages`** चलाते हैं, तो मैनिफेस्ट अपडेट हो जाता है और आपके लोडर इसे एक अलग हार्डकोडेड मानचित्र को बनाए रखे बिना ट्रैक करते हैं। यदि JSON बंडल **`public/`** के तहत स्थित हैं (सामान्य Next.js), तो प्रत्येक लोडर को **`fetch(\`/locales/${code}.json\`)`** के बजाय **`import()`** के साथ लागू करें ताकि ब्राउज़र आपके सार्वजनिक URL पथ से स्थिर JSON लोड कर सके। बंडलर के बिना Node CLIs के लिए, प्रत्येक कोड के लिए पार्स किए गए JSON लौटाने वाले छोटे **`makeFileLoader`** सहायक के अंदर **`readFileSync`** के साथ स्थानीयकरण फ़ाइलों को लोड करें।

`SOURCE_LOCALE` एक्सपोर्ट किया गया है ताकि कोई भी अन्य फ़ाइल जिसे इसकी आवश्यकता हो (उदाहरण के लिए, भाषा स्विचर), सीधे `'./i18n'` से इसे आयात कर सके। यदि आप मौजूदा i18next सेटअप को माइग्रेट कर रहे हैं, तो अपनी i18n बूटस्ट्रैप फ़ाइल से `SOURCE_LOCALE` के आयात के साथ कंपोनेंट्स में फैले हार्डकोडेड स्रोत स्थानीयकरण स्ट्रिंग्स (उदाहरण के लिए `'en-GB'` जाँच) को बदल दें।

नामित आयात (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) उसी तरह काम करते हैं यदि आप डिफ़ॉल्ट एक्सपोर्ट का उपयोग करना पसंद नहीं करते हैं।

`aiI18n.defaultI18nInitOptions(sourceLocale)` (या नाम से आयातित होने पर `defaultI18nInitOptions(sourceLocale)`) कुंजी-के-रूप-में-डिफ़ॉल्ट सेटअप के लिए मानक विकल्प लौटाता है:

- `parseMissingKeyHandler` कुंजी को स्वयं लौटाता है, ताकि अनुवादित स्ट्रिंग्स स्रोत पाठ प्रदर्शित करें।  
- `nsSeparator: false` कोलन वाले कुंजियों की अनुमति देता है।  
- `interpolation.escapeValue: false` - इसे बंद करना सुरक्षित है: React स्वयं मानों को एस्केप करता है, और Node.js/CLI आउटपुट में एस्केप करने के लिए कोई HTML नहीं है।

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` ai-i18n-tools परियोजनाओं के लिए **अनुशंसित** वायरिंग है: यह कुंजी-ट्रिम + स्रोत-स्थानीयकरण <code>{"{{var}}"}</code> इंटरपोलेशन फॉलबैक लागू करता है (निचले स्तर के **`wrapI18nWithKeyTrim`** के समान व्यवहार), वैकल्पिक रूप से **`addResourceBundle`** के माध्यम से **`translate-ui`** **`{sourceLocale}.json`** बहुवचन उपसर्गित कुंजियों को मर्ज करता है, फिर आपके **`strings.json`** से बहुवचन-जागरूक **`wrapT`** इंस्टॉल करता है। उस बंडल फ़ाइल का आपके **कॉन्फ़िगर्ड** स्रोत स्थानीयकरण के लिए बहुवचन सपाट होना चाहिए — वही **`sourceLocale`** जो **`ai-i18n-tools.config.json`** और **`SOURCE_LOCALE`** में आपके i18n बूटस्ट्रैप में है (ऊपर चरण 4 देखें)। केवल तब **`sourcePluralFlatBundle`** को छोड़ दें जब बूटस्ट्रैपिंग कर रहे हों (एक बार **`translate-ui`** ने **`{sourceLocale}.json`** उत्सर्जित कर दिया हो, तो इसे मर्ज कर लें)। केवल **`wrapI18nWithKeyTrim`** को एप्लिकेशन कोड के लिए **अप्रचलित** माना जाता है — इसके बजाय **`setupKeyAsDefaultT`** का उपयोग करें।

`makeLoadLocale(i18n, loaders, sourceLocale)` एक एसिंक `loadLocale(lang)` फ़ंक्शन लौटाता है जो किसी स्थानीयकरण के लिए JSON बंडल को गतिशील रूप से आयात करता है और इसे i18next के साथ पंजीकृत करता है।

### स्रोत कोड में `t()` का उपयोग करना

`t()` को एक **शाब्दिक स्ट्रिंग** के साथ कॉल करें ताकि एक्सट्रैक्ट स्क्रिप्ट इसे ढूंढ सके:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

समान पैटर्न React के बाहर (Node.js, सर्वर घटक, CLI) काम करता है:

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**नियम:**

- केवल ये रूप निकाले जाते हैं: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`।  
- कुंजी एक **शाब्दिक स्ट्रिंग** होनी चाहिए - कुंजी के रूप में कोई चर या अभिव्यक्तियाँ नहीं।  
- कुंजी के लिए टेम्पलेट लिटेरल का उपयोग न करें: <code>{'t(`Hello ${name}`)'}</code> निकाला नहीं जा सकता।

### इंटरपोलेशन

i18next के स्वदेशी दूसरे-आर्गुमेंट इंटरपोलेशन का उपयोग करें <code>{"{{var}}"}</code> प्लेसहोल्डर्स के लिए:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

एक्सट्रैक्ट कमांड साधारण ऑब्जेक्ट लिटरल होने पर **दूसरे तर्क** को पार्स करता है और **`plurals: true`** और **`zeroDigit`** जैसे केवल टूलिंग झंडों को पढ़ता है (नीचे **कार्डिनल बहुवचन** देखें)। साधारण स्ट्रिंग्स के लिए, हैशिंग के लिए केवल लिटरल कुंजी का उपयोग किया जाता है; इंटरपोलेशन विकल्प अभी भी रनटाइम पर i18next को पास किए जाते हैं।

यदि आपकी परियोजना एक कस्टम इंटरपोलेशन उपयोगिता का उपयोग करती है (उदाहरण के लिए, `t('key')` को कॉल करना और फिर परिणाम को `interpolateTemplate(t('Hello {{name}}'), { name })` जैसे टेम्पलेट फ़ंक्शन के माध्यम से पाइप करना), तो **`setupKeyAsDefaultT`** (**`wrapI18nWithKeyTrim`** के माध्यम से) इसे अनावश्यक बना देता है — यह <code>{"{{var}}"}</code> इंटरपोलेशन लागू करता है भले ही स्रोत स्थानीयकरण रॉ कुंजी लौटाता हो। कॉल साइट्स को `t('Hello {{name}}', { name })` पर माइग्रेट करें और कस्टम उपयोगिता को हटा दें।

### कार्डिनल बहुवचन (`plurals: true`)

वही **लिटरल** उपयोग करें जो आप डेवलपर-डिफ़ॉल्ट कॉपी के रूप में चाहते हैं, और **`plurals: true`** पास करें ताकि एक्सट्रैक्ट + `translate-ui` कॉल को एक **कार्डिनल बहुवचन समूह** के रूप में मानें (i18next JSON v4-शैली `_zero` … `_other` रूप)।

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- **`zeroDigit`** (वैकल्पिक) — केवल टूलिंग के लिए; i18next द्वारा **नहीं** पढ़ा जाता है। जब `true`, तो प्रत्येक स्थानीयकरण के लिए जहां वह रूप मौजूद है, `_zero` स्ट्रिंग में लिटरल अरबिक **`0`** को प्राथमिकता देता है; जब `false` या छोड़ दिया जाता है, तो प्राकृतिक शून्य वाक्यांश का उपयोग किया जाता है। `i18next.t` को कॉल करने से पहले इन कुंजियों को हटा दें (नीचे `wrapT` देखें)।

**सत्यापन:** यदि संदेश में **दो या अधिक** अलग-अलग `{{…}}` प्लेसहोल्डर हैं, तो उनमें से एक `{{count}}` **होना चाहिए** (बहुवचन अक्ष)। अन्यथा `extract` **स्पष्ट फ़ाइल/पंक्ति संदेश के साथ विफल हो जाता है**।

**दो स्वतंत्र गिनतियाँ** (उदाहरण के लिए, अनुभाग और पृष्ठ) एक बहुवचन संदेश को साझा नहीं कर सकतीं — **दो** `t()` कॉल का उपयोग करें (प्रत्येक में `plurals: true` और अपना स्वयं का `count` हो) और UI में जोड़ें।

`strings.json` **:** बहुवचन समूह **हैश के प्रति एक पंक्ति** का उपयोग करते हैं `"plural": true`, मूल शाब्दिक **`source`** में, और **`translated[locale]`** कार्डिनल श्रेणियों (`zero`, `one`, `two`, `few`, `many`, `other`) को उस स्थान के लिए स्ट्रिंग्स में मैप करने वाली ऑब्जेक्ट के रूप में।

**फ्लैट स्थानीय JSON:** गैर-बहुवचन पंक्तियाँ **स्रोत वाक्य → अनुवाद** रहती हैं। बहुवचन पंक्तियों को **`<groupId>_original`** (`source` के बराबर, संदर्भ के लिए) और प्रत्येक प्रत्यय के लिए **`<groupId>_<form>`** के रूप में उत्सर्जित किया जाता है ताकि i18next बहुवचन को स्वाभाविक रूप से हल कर सके। **`translate-ui`** वाला **`{sourceLocale}.json`** भी लिखता है जिसमें **केवल** बहुवचन फ्लैट कुंजियाँ होती हैं (स्रोत भाषा के लिए इस बंडल को लोड करें ताकि प्रत्यायुक्त कुंजियाँ हल हो सकें; सादे स्ट्रिंग्स अभी भी कुंजी-के-रूप-में-डिफ़ॉल्ट का उपयोग करते हैं)। प्रत्येक लक्ष्य स्थान के लिए, उत्सर्जित प्रत्यय कुंजियाँ उस स्थान के लिए **`Intl.PluralRules`** से मेल खाती हैं (`requiredCldrPluralForms`): यदि `strings.json` ने संकुचन के बाद किसी अन्य से मेल खाने के कारण एक श्रेणी को छोड़ दिया (उदाहरण के लिए, अरबी **`many`** **`other`** के समान), तब भी **`translate-ui`** प्रत्येक आवश्यक प्रत्यय को फ्लैट फ़ाइल में एक फॉलबैक भाई-बहन स्ट्रिंग से कॉपी करके लिखता है ताकि रनटाइम लुकअप कभी भी कुंजी न छोड़े।

रनटाइम (`ai-i18n-tools/runtime` **):** **`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })`** को कॉल करें — यह **`wrapI18nWithKeyTrim`** चलाता है, वैकल्पिक **`translate-ui`** `{sourceLocale}.json` बहुवचन बंडल को पंजीकृत करता है, फिर **`wrapT`** को **`buildPluralIndexFromStringsJson(stringsJson)`** का उपयोग करके चलाता है। `wrapT` `plurals` / `zeroDigit` को हटा देता है, आवश्यकता होने पर कुंजी को समूह आईडी में पुनः लिखता है, और **`count`** को अग्रेषित करता है (वैकल्पिक: यदि एकल गैर-`{{count}}` प्लेसहोल्डर है, तो `count` उस संख्यात्मक विकल्प से कॉपी किया जाता है)।

**पुराने वातावरण:** `Intl.PluralRules` टूलिंग और सुसंगत व्यवहार के लिए आवश्यक है; यदि आप बहुत पुराने ब्राउज़र को लक्षित कर रहे हैं तो पॉलीफिल करें।

**v1 में नहीं:** और्डिनल बहुवचन (`_ordinal_*`, `ordinal: true`), अंतराल बहुवचन, केवल ICU पाइपलाइन।

### भाषा स्विचर UI

एक भाषा चयनकर्ता बनाने के लिए `ui-languages.json` मैनिफेस्ट का उपयोग करें। `ai-i18n-tools` दो डिस्प्ले हेल्पर्स निर्यात करता है:

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

`getUILanguageLabel(lang, t)` - अनुवादित होने पर `t(englishName)` दिखाता है, या जब दोनों भिन्न हों तो `englishName / t(englishName)` दिखाता है। सेटिंग्स स्क्रीन के लिए उपयुक्त।

`getUILanguageLabelNative(lang)` - `englishName / label` दिखाता है (`t()` कॉल प्रत्येक पंक्ति पर नहीं होता)। हेडर मेनू के लिए उपयुक्त जहां आप मूल नाम को दृश्यमान चाहते हैं।

`ui-languages.json` मैनिफेस्ट JSON सरणी है जिसमें <code>{"{ code, label, englishName, direction }"}</code> प्रविष्टियाँ हैं (`direction` `"ltr"` या `"rtl"` है)। उदाहरण:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

मैनिफेस्ट `generate-ui-languages` द्वारा `sourceLocale` + `targetLocales` और बंडल किए गए मास्टर कैटलॉग से उत्पन्न किया जाता है। इसे `ui.flatOutputDir` में लिखा जाता है। यदि आप कॉन्फ़िगरेशन में किसी भी स्थान को बदलते हैं, तो `ui-languages.json` फ़ाइल को अपडेट करने के लिए `generate-ui-languages` चलाएँ।

### RTL भाषाएँ

`ai-i18n-tools` `getTextDirection(lng)` और `applyDirection(lng)` निर्यात करता है:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` `document.documentElement.dir` (ब्राउज़र) सेट करता है या एक नो-ऑप (Node.js) है। एक विशिष्ट तत्व को लक्षित करने के लिए एक वैकल्पिक `element` आर्गुमेंट पास करें।

उन स्ट्रिंग्स के लिए जो `→` तीरों को शामिल कर सकती हैं, RTL लेआउट के लिए उन्हें पलट दें:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## कार्यप्रवाह 2 - दस्तावेज़ अनुवाद

मार्कडाउन प्रलेखन, डॉक्यूसॉरस साइटों और JSON लेबल फ़ाइलों के लिए डिज़ाइन किया गया। स्वतंत्र SVG संपत्तियों का अनुवाद [`translate-svg`](#cli-reference) के माध्यम से किया जाता है जब `features.translateSVG` सक्षम होता है और शीर्ष-स्तरीय `svg` ब्लॉक सेट होता है — `documentations[].contentPaths` के माध्यम से नहीं।

### चरण 1: प्रारंभ करें

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

जनरेट किए गए `ai-i18n-tools.config.json` को संपादित करें:

- `sourceLocale` - स्रोत भाषा (`docusaurus.config.js` में `defaultLocale` से मेल खाना चाहिए)।
- `targetLocales` - BCP-47 स्थानीयकरण कोड की सरणी (उदाहरण के लिए `["de", "fr", "es"]`)।
- `cacheDir` - सभी डॉक्यूमेंटेशन पाइपलाइन्स के लिए साझा SQLite कैश निर्देशिका (और `--write-logs` के लिए डिफ़ॉल्ट लॉग निर्देशिका)।
- `documentations` - डॉक्यूमेंटेशन ब्लॉक्स की सरणी। प्रत्येक ब्लॉक में वैकल्पिक `description`, `contentPaths`, `outputDir`, वैकल्पिक `jsonSource`, `markdownOutput`, `targetLocales`, `addFrontmatter`, आदि होते हैं।
- `documentations[].description` - रखरखाव कर्ताओं के लिए वैकल्पिक संक्षिप्त नोट (इस ब्लॉक में क्या शामिल है)। जब सेट किया जाता है, तो यह `translate-docs` शीर्षक (`🌐 …: translating …`) और `status` अनुभाग शीर्षकों में दिखाई देता है।
- `documentations[].contentPaths` - मार्कडाउन/MDX स्रोत निर्देशिकाएँ या फ़ाइलें (JSON लेबल के लिए देखें `documentations[].jsonSource`)।
- `documentations[].outputDir` - उस ब्लॉक के लिए अनुवादित आउटपुट रूट।
- `documentations[].markdownOutput.style` - `"nested"` (डिफ़ॉल्ट), `"docusaurus"`, या `"flat"` (देखें [आउटपुट लेआउट](#output-layouts))।

### चरण 2: दस्तावेज़ों का अनुवाद करें

```bash
npx ai-i18n-tools translate-docs
```

यह प्रत्येक `documentations` ब्लॉक के `contentPaths` में सभी फ़ाइलों को सभी प्रभावी दस्तावेज़ लोकेल्स (प्रत्येक ब्लॉक के `targetLocales` का संघ, जब सेट हो, अन्यथा रूट `targetLocales`) में अनुवादित करता है। पहले से अनुवादित सेगमेंट SQLite कैश से परोसे जाते हैं - केवल नए या बदले हुए सेगमेंट ही LLM को भेजे जाते हैं।

एकल लोकेल अनुवादित करने के लिए:

```bash
npx ai-i18n-tools translate-docs --locale de
```

यह जांचने के लिए कि क्या अनुवाद की आवश्यकता है:

```bash
npx ai-i18n-tools status
```

#### कैश व्यवहार और `translate-docs` फ़्लैग

CLI SQLite में **फ़ाइल ट्रैकिंग** (फ़ाइल × लोकेल प्रति स्रोत हैश) और **सेगमेंट** पंक्तियाँ (अनुवाद योग्य खंड प्रति हैश × लोकेल) रखता है। एक सामान्य रन तब पूरी फ़ाइल को छोड़ देता है जब ट्रैक किया गया हैश वर्तमान स्रोत से मेल खाता है **और** आउटपुट फ़ाइल पहले से मौजूद होती है; अन्यथा यह फ़ाइल को प्रोसेस करता है और सेगमेंट कैश का उपयोग करता है ताकि अपरिवर्तित टेक्स्ट API को कॉल न करे।

| ध्वज | प्रभाव |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(डिफ़ॉल्ट)* | जब ट्रैकिंग + डिस्क पर आउटपुट मेल खाते हैं, तो अपरिवर्तित फ़ाइलों को छोड़ दें; शेष के लिए सेगमेंट कैश का उपयोग करें। |
| `-l, --locale <codes>` | अल्पविराम से अलग किए गए लक्ष्य स्थानीयकरण (जब छोड़ दिया जाता है तो `documentation.targetLocales` / `targetLocales` के अनुसार डिफ़ॉल्ट)। |
| `-p, --path` / `-f, --file` | केवल इस पथ के तहत मार्कडाउन/जेसन का अनुवाद करें (प्रोजेक्ट-सापेक्ष या पूर्ण); `--file` के लिए उपनाम `--path` है। |
| `--dry-run` | कोई फ़ाइल लेखन नहीं और कोई एपीआई कॉल नहीं। |
| `--type <kind>` | केवल `markdown` या `json` तक सीमित करें (अन्यथा कॉन्फ़िग में सक्षम होने पर दोनों)। |
| `--json-only` / `--no-json` | केवल जेसन लेबल फ़ाइलों का अनुवाद करें, या जेसन को छोड़कर केवल मार्कडाउन का अनुवाद करें। |
| `-j, --concurrency <n>` | अधिकतम समानांतर लक्ष्य स्थानीयकरण (कॉन्फ़िग या CLI निर्मित डिफ़ॉल्ट से डिफ़ॉल्ट)। |
| `-b, --batch-concurrency <n>` | प्रति फ़ाइल अधिकतम समानांतर बैच एपीआई कॉल (दस्तावेज़; कॉन्फ़िग या CLI से डिफ़ॉल्ट)। |
| `--emphasis-placeholders` | अनुवाद से पहले मार्कडाउन जोर चिह्नों को प्लेसहोल्डर के रूप में मास्क करें (वैकल्पिक; डिफ़ॉल्ट बंद)। |
| `--debug-failed` | जब सत्यापन विफल होता है, तो `cacheDir` के तहत विस्तृत `FAILED-TRANSLATION` लॉग लिखें। |
| `--force-update` | प्रत्येक मिलान वाली फ़ाइल को फिर से प्रसंस्कृत करें (निकालें, पुनः जोड़ें, आउटपुट लिखें), भले ही फ़ाइल ट्रैकिंग छोड़ दे। **सेगमेंट कैश अभी भी लागू होता है** - अपरिवर्तित सेगमेंट एलएलएम को नहीं भेजे जाते हैं। |
| `--force` | प्रत्येक प्रसंस्कृत फ़ाइल के लिए फ़ाइल ट्रैकिंग साफ़ करता है और **सेगमेंट कैश से अनुवाद के लिए पढ़ता नहीं है** (पूर्ण पुनः अनुवाद)। नए परिणाम अभी भी सेगमेंट कैश में **लिखे जाते हैं**। |
| `--stats` | सेगमेंट गिनती, ट्रैक की गई फ़ाइल गिनती और प्रति-स्थानीयकरण सेगमेंट कुल मिलाकर प्रिंट करें, फिर बाहर निकलें। |
| `--clear-cache [locale]` | कैश किए गए अनुवादों को हटाएं (और फ़ाइल ट्रैकिंग): सभी स्थानीयकरण, या एकल स्थानीयकरण, फिर बाहर निकलें। |
| `--prompt-format <mode>` | प्रत्येक **बैच** सेगमेंट को मॉडल को कैसे भेजा जाता है और पार्स किया जाता है (`xml`, `json-array`, या `json-object`)। डिफ़ॉल्ट **`json-array`**। निकासी, प्लेसहोल्डर, सत्यापन, कैश या फॉलबैक व्यवहार में परिवर्तन नहीं करता है — [बैच प्रॉम्प्ट प्रारूप](#batch-prompt-format) देखें। |

आप `--force` को `--force-update` के साथ संयोजित नहीं कर सकते (वे परस्पर अनन्य हैं)।

#### बैच प्रॉम्प्ट स्वरूप

`translate-docs` अनुवाद योग्य सेगमेंट्स को OpenRouter में **बैचों** में भेजता है ( `batchSize` / `maxBatchChars` द्वारा समूहित)। **`--prompt-format`** ध्वज केवल उस बैच के **वायर फॉर्मेट** को बदलता है; सेगमेंट विभाजन, `PlaceholderHandler` टोकन, मार्कडाउन AST जांच, SQLite कैश कुंजियाँ, और बैच पार्सिंग विफल होने पर प्रति-सेगमेंट फॉलबैक अपरिवर्तित रहते हैं।

| मोड | उपयोगकर्ता संदेश | मॉडल उत्तर |
| ---- | ------------ | ----------- |
| **`xml`** | प्सेडो-XML: एक खंड में प्रत्येक खंड के लिए एक `<seg id="N">…</seg>` (XML एस्केपिंग के साथ)। | केवल `<t id="N">…</t>` ब्लॉक, प्रत्येक खंड सूचकांक के लिए एक। |
| **`json-array`** (डिफ़ॉल्ट) | स्ट्रिंग्स का एक JSON सरणी, क्रम में प्रत्येक खंड के लिए एक प्रविष्टि। | **समान लंबाई** (समान क्रम) का एक JSON सरणी। |
| **`json-object`** | खंड सूचकांक द्वारा चाबी लगाया गया एक JSON ऑब्जेक्ट `{"0":"…","1":"…",…}`। | एक JSON ऑब्जेक्ट **समान कुंजियों** और अनुवादित मानों के साथ। |

रन हेडर भी `Batch prompt format: …` प्रिंट करता है ताकि आप सक्रिय मोड की पुष्टि कर सकें। JSON लेबल फ़ाइलें (`jsonSource`) और स्वतंत्र SVG बैच उसी सेटिंग का उपयोग करते हैं जब वे चरण `translate-docs` के हिस्से के रूप में चलते हैं (या `sync` के दस्तावेज़ चरण में — `sync` इस फ्लैग को उजागर नहीं करता है; यह डिफ़ॉल्ट रूप से **`json-array`** होता है)।

**सेगमेंट डीड्यूप और SQLite में पथ**

- खंड पंक्तियाँ `(source_hash, locale)` द्वारा वैश्विक रूप से कुंजीबद्ध होती हैं (हैश = सामान्यीकृत सामग्री)। दो फ़ाइलों में समान पाठ एक पंक्ति साझा करता है; `translations.filepath` मेटाडेटा है (अंतिम लेखक), प्रति फ़ाइल एक दूसरा कैश प्रविष्टि नहीं।
- `file_tracking.filepath` नामस्थान कुंजी का उपयोग करता है: `doc-block:{index}:{relPath}` प्रति `documentations` ब्लॉक (`relPath` प्रोजेक्ट-रूट-सापेक्ष posix है: एकत्रित मार्कडाउन पथ; **JSON लेबल फ़ाइलें स्रोत फ़ाइल के लिए cwd-सापेक्ष पथ का उपयोग करती हैं**, जैसे `docs-site/i18n/en/code.json`, ताकि सफाई वास्तविक फ़ाइल को हल कर सके), और `svg-assets:{relPath}` स्वतंत्र SVG संपत्तियों के लिए `translate-svg` के तहत।
- `translations.filepath` मार्कडाउन, JSON, और SVG खंडों के लिए cwd-सापेक्ष posix पथ संग्रहीत करता है (SVG अन्य संपत्तियों के समान पथ आकार का उपयोग करता है; `svg-assets:…` उपसर्ग **केवल** `file_tracking` पर है)।
- एक रन के बाद, `last_hit_at` केवल उन खंड पंक्तियों के लिए साफ़ किया जाता है **जो समान अनुवाद दायरे में हैं** (जो `--path` और सक्षम प्रकारों का सम्मान करते हैं) जो हिट नहीं हुए, इसलिए एक फ़िल्टर किया गया या केवल दस्तावेज़ रन असंबंधित फ़ाइलों को पुराना नहीं मानता।

### आउटपुट लेआउट

`"nested"` (छोड़ने पर डिफ़ॉल्ट) — `{outputDir}/{locale}/` के तहत स्रोत पेड़ को दर्शाता है (जैसे `docs/guide.md` → `i18n/de/docs/guide.md`)।

`"docusaurus"` — फ़ाइलों को `docsRoot` के तहत `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>` पर रखता है, जो सामान्य Docusaurus i18n लेआउट से मेल खाता है। `documentations[].markdownOutput.docsRoot` को अपने दस्तावेज़ स्रोत रूट पर सेट करें (जैसे `"docs"`)।

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - अनुवादित फ़ाइलों को स्रोत के बगल में एक स्थानीय उपसर्ग के साथ या एक उपनिर्देशिका में रखता है। पृष्ठों के बीच सापेक्ष लिंक स्वचालित रूप से फिर से लिखे जाते हैं।

```
docs/guide.md → i18n/guide.de.md
```

आप पूरी तरह से पथों को `documentations[].markdownOutput.pathTemplate` के साथ ओवरराइड कर सकते हैं। प्लेसहोल्डर: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>।

---

## संयुक्त कार्यप्रवाह (UI + दस्तावेज़)

एक ही कॉन्फ़िगरेशन में सभी सुविधाओं को सक्षम करें ताकि दोनों कार्यप्रवाह एक साथ चल सकें:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
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

`glossary.uiGlossary` दस्तावेज़ अनुवाद को UI के समान `strings.json` कैटलॉग पर इंगित करता है ताकि शब्दावली सुसंगत बनी रहे; `glossary.userGlossary` उत्पाद शर्तों के लिए CSV ओवरराइड जोड़ता है।

`npx ai-i18n-tools sync` चलाएँ एक पाइपलाइन चलाने के लिए: **UI स्ट्रिंग्स निकालें** (यदि `features.extractUIStrings`), **UI स्ट्रिंग्स का अनुवाद करें** (यदि `features.translateUIStrings`), **स्वतंत्र SVG संपत्तियों का अनुवाद करें** (यदि `features.translateSVG` और `svg` ब्लॉक सेट है), फिर **प्रलेखन का अनुवाद करें** (प्रत्येक `documentations` ब्लॉक: मार्कडाउन/JSON के रूप में कॉन्फ़िगर किया गया)। `--no-ui`, `--no-svg`, या `--no-docs` के साथ भागों को छोड़ें। दस्तावेज़ीकरण चरण `--dry-run`, `-p` / `--path`, `--force`, और `--force-update` को स्वीकार करता है (अंतिम दो केवल तभी लागू होते हैं जब प्रलेखन अनुवाद चलता है; यदि आप `--no-docs` पास करते हैं तो उन्हें अनदेखा कर दिया जाता है)।

एक ब्लॉक पर `documentations[].targetLocales` का उपयोग करें ताकि उस ब्लॉक की फ़ाइलों का अनुवाद UI की तुलना में **छोटे उपसमुच्चय** में किया जा सके (प्रभावी दस्तावेज़ स्थानीयताएँ ब्लॉकों के बीच **संघ** हैं):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

### मिश्रित दस्तावेज़ीकरण वर्कफ़्लो (Docusaurus + फ्लैट)

आप `documentations` में एक से अधिक एंट्री जोड़कर एक ही कॉन्फ़िग में कई दस्तावेज़ीकरण पाइपलाइन को जोड़ सकते हैं। जब किसी प्रोजेक्ट में Docusaurus साइट के साथ-साथ रूट-स्तरीय मार्कडाउन फ़ाइलें (उदाहरण के लिए, एक रिपॉजिटरी रीडमी) होती हैं जिन्हें फ्लैट आउटपुट के साथ अनुवादित किया जाना चाहिए, तो यह एक सामान्य सेटअप है।

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus docs and JSON labels",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README in flat output",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

`npx ai-i18n-tools sync` के साथ यह कैसे चलता है:

- यूआई स्ट्रिंग्स `src/` से `public/locales/` में निकाली/अनुवादित की जाती हैं।
- पहला डॉक्स ब्लॉक मार्कडाउन और JSON लेबल को Docusaurus `i18n/<locale>/...` लेआउट में अनुवादित करता है।
- दूसरा डॉक्स ब्लॉक `README.md` को `translated-docs/` के तहत स्थान-प्रत्यायुक्त फ़ाइलों में अनुवादित करता है।
- सभी डॉक्स ब्लॉक `cacheDir` को साझा करते हैं, इसलिए अपरिवर्तित खंडों को आईपीआई कॉल और लागत को कम करने के लिए चलन में पुनः उपयोग किया जाता है।

---

## कॉन्फ़िगरेशन संदर्भ

### `sourceLocale`

स्रोत भाषा के लिए BCP-47 कोड (जैसे `"en-GB"`, `"en"`, `"pt-BR"`)। इस स्थानीयता के लिए कोई अनुवाद फ़ाइल उत्पन्न नहीं होती - कुंजी स्ट्रिंग स्वयं स्रोत पाठ है।

**मेल खाना चाहिए** `SOURCE_LOCALE` जो आपके रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) से निर्यात किया गया है।

### `targetLocales`

अनुवाद करने के लिए BCP-47 स्थानीयकरण कोड की सरणी (उदाहरण के लिए `["de", "fr", "es", "pt-BR"]`)।

`targetLocales` UI अनुवाद के लिए प्राथमिक स्थानीयकरण सूची और दस्तावेज़ीकरण ब्लॉक के लिए डिफ़ॉल्ट स्थानीयकरण सूची है। `ui-languages.json` मैनिफेस्ट को `sourceLocale` + `targetLocales` से बनाने के लिए `generate-ui-languages` का उपयोग करें।

### `uiLanguagesPath` (वैकल्पिक)

`ui-languages.json` मैनिफेस्ट का मार्ग जिसका उपयोग प्रदर्शन नामों, स्थानीयकरण फ़िल्टरिंग और भाषा-सूची पोस्ट-प्रोसेसिंग के लिए किया जाता है। जब छोड़ दिया जाता है, तो CLI `ui.flatOutputDir/ui-languages.json` पर मैनिफेस्ट की तलाश करता है।

इसका उपयोग करें जब:

- मैनिफेस्ट `ui.flatOutputDir` के बाहर स्थित है और आपको CLI को स्पष्ट रूप से इंगित करने की आवश्यकता है।
- आप चाहते हैं कि `markdownOutput.postProcessing.languageListBlock` मैनिफेस्ट से स्थानीयकरण लेबल बनाए।
- `extract` मैनिफेस्ट से `englishName` प्रविष्टियों को `strings.json` में मर्ज करना चाहिए (`ui.reactExtractor.includeUiLanguageEnglishNames: true` की आवश्यकता होती है)।

### `concurrency` (वैकल्पिक)

एक साथ अनुवादित अधिकतम **लक्षित स्थानीयताएँ** (`translate-ui`, `translate-docs`, `translate-svg`, और `sync` के अंदर मिलते-जुलते चरण)। यदि छोड़ा गया, तो CLI UI अनुवाद के लिए **4** और दस्तावेज़ अनुवाद के लिए **3** का उपयोग करता है (निर्मित डिफ़ॉल्ट)। प्रत्येक रन के लिए `-j` / `--concurrency` के साथ ओवरराइड करें।

### `batchConcurrency` (वैकल्पिक)

**अनुवाद-प्रलेख** और **अनुवाद-svg** (और `sync` का प्रलेखन चरण): प्रति फ़ाइल अधिकतम समानांतर OpenRouter **बैच** अनुरोध (प्रत्येक बैच में कई खंड हो सकते हैं)। जब छोड़ा जाए तो डिफ़ॉल्ट **4**। `translate-ui` द्वारा अनदेखा किया गया। `-b` / `--batch-concurrency` के साथ ओवरराइड करें। `sync` पर, `-b` केवल प्रलेखन अनुवाद चरण पर लागू होता है।

### `batchSize` / `maxBatchChars` (वैकल्पिक)

प्रलेख अनुवाद के लिए खंड बैचिंग: प्रति API अनुरोध कितने खंड, और एक वर्ण सीमा। डिफ़ॉल्ट: **20** खंड, **4096** वर्ण (जब छोड़ा जाए)।

### `openrouter`

| फ़ील्ड               | विवरण                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | OpenRouter API का आधार URL। डिफ़ॉल्ट: `https://openrouter.ai/api/v1`।                        |
| `translationModels` | मॉडल आईडी की प्राथमिक क्रमबद्ध सूची। पहले को पहले आजमाया जाता है; बाद में प्रविष्टियाँ त्रुटि पर बैकअप होती हैं। केवल `translate-ui` के लिए, आप इस सूची से पहले एक मॉडल आजमाने के लिए `ui.preferredModel` भी सेट कर सकते हैं (देखें `ui`)। |
| `defaultModel`      | विरासत एकल प्राथमिक मॉडल। केवल तब उपयोग किया जाता है जब `translationModels` सेट नहीं है या खाली है।       |
| `fallbackModel`     | विरासत एकल बैकअप मॉडल। जब `translationModels` सेट नहीं है या खाली है, तब `defaultModel` के बाद उपयोग किया जाता है। |
| `maxTokens`         | प्रति अनुरोध अधिकतम पूर्णता टोकन। डिफ़ॉल्ट: `8192`।                                      |
| `temperature`       | सैंपलिंग तापमान। डिफ़ॉल्ट: `0.2` **।                                                    |**कई मॉडल का उपयोग क्यों करें:** विभिन्न प्रदाता और मॉडलों की लागत अलग-अलग होती है तथा भाषाओं और स्थानीय सेटिंग्स के आधार पर गुणवत्ता के अलग-अलग स्तर प्रदान करते हैं। **`openrouter.translationModels` को एक क्रमबद्ध फॉलबैक श्रृंखला** के रूप में कॉन्फ़िगर करें (एकल मॉडल के बजाय), ताकि यदि कोई अनुरोध विफल हो जाए तो CLI अगले मॉडल का प्रयास कर सके।

नीचे दी गई सूची को एक **आधारभूत रूप** के रूप में देखें जिसे आप विस्तारित कर सकते हैं: यदि किसी विशिष्ट स्थानीय सेटिंग के लिए अनुवाद खराब या असफल है, तो शोध करें कि कौन से मॉडल उस भाषा या लिपि को प्रभावी ढंग से समर्थित करते हैं (ऑनलाइन संसाधनों या आपके प्रदाता के दस्तावेज़ीकरण को देखें), और उन ओपनराउटर आईडी को आगे के विकल्प के रूप में जोड़ें।

इस सूची का **व्यापक स्थानीय सेटिंग कवरेज के लिए परीक्षण किया गया था** (उदाहरण के लिए, ट्रांस्रेवर्ट प्रोजेक्ट पर **36** लक्ष्य स्थानीय सेटिंग्स के अनुवाद पर) **अप्रैल 2026 में; यह एक व्यावहारिक डिफ़ॉल्ट के रूप में कार्य करती है, लेकिन यह गारंटी नहीं है कि हर स्थानीय सेटिंग के लिए यह अच्छा प्रदर्शन करेगी।

उदाहरण `translationModels` (`npx ai-i18n-tools init` के समान डिफ़ॉल्ट):

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v3.2",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-5.3-codex",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-3-flash-preview"
]
```

अपने वातावरण या `.env` फ़ाइल में `OPENROUTER_API_KEY` सेट करें।

### `features`

| फ़ील्ड | कार्यप्रवाह | विवरण |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings` | 1 | स्रोत को `t("…")` / `i18n.t("…")` के लिए स्कैन करें, वैकल्पिक `package.json` विवरण और (यदि सक्षम है) `ui-languages.json` `englishName` मानों को `strings.json` में मर्ज करें। |
| `translateUIStrings` | 1 | `strings.json` प्रविष्टियों का अनुवाद करें और प्रति-स्थानीयकरण JSON फ़ाइलें लिखें। |
| `translateMarkdown` | 2 | `.md` / `.mdx` फ़ाइलों का अनुवाद करें। |
| `translateJSON` | 2 | डॉक्यूसॉरस JSON लेबल फ़ाइलों का अनुवाद करें। |
| `translateSVG` | 2 | स्वतंत्र `.svg` संपत्तियों का अनुवाद करें (शीर्ष-स्तरीय `svg` ब्लॉक की आवश्यकता होती है)। |

`translate-svg` **के साथ**स्वतंत्र SVG संपत्तियों का अनुवाद करें जब `features.translateSVG` सत्य हो और एक शीर्ष-स्तरीय `svg` ब्लॉक कॉन्फ़िगर किया गया हो। `sync` कमांड उस चरण को चलाता है जब दोनों सेट हों (जब तक `--no-svg` न हो)।

### `ui`

| फ़ील्ड | विवरण |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots` | निर्देशिकाएँ (cwd के सापेक्ष) जो `t("…")` कॉल के लिए स्कैन की जाती हैं। |
| `stringsJson` | मास्टर कैटलॉग फ़ाइल का मार्ग। `extract` द्वारा अपडेट किया गया। |
| `flatOutputDir` | वह निर्देशिका जहाँ प्रति-स्थानीयकरण JSON फ़ाइलें लिखी जाती हैं (`de.json`, आदि)। |
| `preferredModel` | वैकल्पिक। केवल `translate-ui` के लिए पहले आज़माया गया OpenRouter मॉडल आईडी; फिर `openrouter.translationModels` (या पुराने मॉडल) क्रम में, इस आईडी को दोहराए बिना। |
| `reactExtractor.funcNames` | स्कैन करने के लिए अतिरिक्त फ़ंक्शन नाम (डिफ़ॉल्ट: `["t", "i18n.t"]`)। |
| `reactExtractor.extensions` | शामिल करने के लिए फ़ाइल एक्सटेंशन (डिफ़ॉल्ट: `[".js", ".jsx", ".ts", ".tsx"]`)। |
| `reactExtractor.includePackageDescription` | जब `true` (डिफ़ॉल्ट), `extract` में उपस्थित होने पर `package.json` `description` को UI स्ट्रिंग के रूप में भी शामिल करता है। |
| `reactExtractor.packageJsonPath` | वैकल्पिक विवरण निकालने के लिए उपयोग की जाने वाली `package.json` फ़ाइल का कस्टम मार्ग। |
| `reactExtractor.includeUiLanguageEnglishNames` | जब `true` (डिफ़ॉल्ट `false`), `extract` स्रोत स्कैन से पहले से मौजूद नहीं होने पर (समान हैश कुंजियाँ) `uiLanguagesPath` पर मैनिफेस्ट से प्रत्येक `englishName` को `strings.json` में जोड़ता है। `uiLanguagesPath` को एक वैध `ui-languages.json` की ओर इशारा करने की आवश्यकता होती है। |

### `cacheDir`

| फ़ील्ड | विवरण |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite कैश निर्देशिका (सभी `documentations` ब्लॉक द्वारा साझा की गई)। चलने के बीच पुन: उपयोग करें। यदि आप कस्टम दस्तावेज़ अनुवाद कैश से माइग्रेट कर रहे हैं, तो इसे संग्रहीत या हटा दें — `cacheDir` अपना स्वयं का SQLite डेटाबेस बनाता है और अन्य स्कीमा के साथ संगत नहीं है। |

VCS बहिष्करण के लिए सर्वोत्तम अभ्यास:

- अस्थायी कैश आर्टिफैक्ट को प्रतिबद्ध करने से बचने के लिए अनुवाद कैश फ़ोल्डर की सामग्री को बाहर रखें (उदाहरण के लिए `.gitignore` या `.git/info/exclude` के माध्यम से)।
- `cache.db` को उपलब्ध रखें (इसे नियमित रूप से न डिलीट करें), क्योंकि SQLite कैश को संरक्षित रखने से अपरिवर्तित खंडों को पुनः अनुवादित करने से बचा जाता है, जो `ai-i18n-tools` का उपयोग करने वाले सॉफ़्टवेयर को बदलने या अपग्रेड करने पर रनटाइम और आईपीआई लागत दोनों बचाता है।

उदाहरण:

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

### `documentations`

दस्तावेज़ पाइपलाइन ब्लॉकों का एरे। `translate-docs` और `sync` **प्रक्रिया के दस्तावेज़ चरण**प्रत्येक ब्लॉक को क्रम में संसाधित करते हैं।

| क्षेत्र                                        | विवरण                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | इस ब्लॉक के लिए वैकल्पिक मानव-पठनीय नोट (अनुवाद के लिए उपयोग नहीं किया जाता है)। जब सेट किया जाता है तो `translate-docs` `🌐` शीर्षक में उपसर्ग के रूप में जोड़ा जाता है; `status` अनुभाग के शीर्षक में भी दिखाया जाता है।                                                     |
| `contentPaths`                               | अनुवाद के लिए मार्कडाउन/MDX स्रोत (`translate-docs` इन्हें `.md` / `.mdx` के लिए स्कैन करता है)। जेसन लेबल इसी ब्लॉक पर `jsonSource` से आते हैं।                                                                                  |
| `outputDir`                                  | इस ब्लॉक के लिए अनुवादित आउटपुट की रूट डायरेक्टरी।                                                                                                                                                                      |
| `sourceFiles`                                | लोड पर `contentPaths` में मर्ज किया जाने वाला वैकल्पिक उपनाम।                                                                                                                                                                        |
| `targetLocales`                              | केवल इस ब्लॉक के लिए स्थानीयकरण का वैकल्पिक उपसमुच्चय (अन्यथा मूल `targetLocales`)। प्रभावी प्रलेखन स्थानीयकरण ब्लॉक्स में संयुक्त रूप से होते हैं।                                                                             |
| `jsonSource`                                 | इस ब्लॉक के लिए डॉक्यूसॉरस जेसन लेबल फ़ाइलों की स्रोत डायरेक्टरी (उदाहरण के लिए `"i18n/en"`)।                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"` (डिफ़ॉल्ट), `"docusaurus"`, या `"flat"`।                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | डॉक्यूसॉरस लेआउट के लिए स्रोत डॉक्स रूट (उदाहरण के लिए `"docs"`)।                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | कस्टम मार्कडाउन आउटपुट पथ। प्लेसहोल्डर: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>। |
| `markdownOutput.jsonPathTemplate`            | लेबल फ़ाइलों के लिए कस्टम जेसन आउटपुट पथ। `pathTemplate` के समान प्लेसहोल्डर का समर्थन करता है।                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | `flat` शैली के लिए, स्रोत उपडायरेक्टरी को बरकरार रखें ताकि समान बेसनेम वाली फ़ाइलें टकराएं नहीं।                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | अनुवाद के बाद सापेक्ष लिंक को पुनः लिखें (`flat` शैली के लिए स्वचालित रूप से सक्षम)।                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | फ्लैट-लिंक पुनः लेखन उपसर्ग की गणना करते समय उपयोग किया जाने वाला रिपो रूट। आमतौर पर इसे `"."` के रूप में छोड़ दें, जब तक कि आपके अनुवादित डॉक्स एक अलग प्रोजेक्ट रूट के तहत नहीं हैं। |
| `markdownOutput.postProcessing` **| अनुवादित मार्कडाउन**बॉडी पर वैकल्पिक परिवर्तन (YAML फ्रंट मैटर संरक्षित है)। खंड पुनर्मिलन और फ्लैट लिंक पुनर्लेखन के बाद चलता है, और `addFrontmatter` से पहले। |
| `markdownOutput.postProcessing.regexAdjustments` | `{ "description"?, "search", "replace" }` की क्रमबद्ध सूची। `search` एक रेगेक्स पैटर्न है (सादा स्ट्रिंग फ्लैग `g` या `/pattern/flags` का उपयोग करता है)। `replace` में `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` जैसे प्लेसहोल्डर का समर्थन है। |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — अनुवादक `start` युक्त पहली पंक्ति और मिलान `end` पंक्ति खोजता है, फिर उस स्लाइस को एक मानक भाषा स्विचर के साथ बदल देता है। लिंक अनुवादित फ़ाइल के सापेक्ष पथ के साथ बनाए जाते हैं; लेबल `uiLanguagesPath` / `ui-languages.json` से लिए जाते हैं जब कॉन्फ़िगर किए गए हों, अन्यथा `localeDisplayNames` और स्थानीयकरण कोड से। |
| `addFrontmatter`                  | जब `true` (जब छोड़ा जाता है तो डिफ़ॉल्ट), अनुवादित मार्कडाउन फ़ाइलों में YAML कुंजियाँ शामिल होती हैं: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, और जब कम से कम एक खंड में मॉडल मेटाडेटा होता है, `translation_models` (उपयोग किए गए ओपनराउटर मॉडल आईडी की क्रमबद्ध सूची)। `false` पर सेट करने से छोड़ दिया जाता है। |

उदाहरण (फ्लैट README पाइपलाइन — स्क्रीनशॉट पथ + वैकल्पिक भाषा सूची लपेटने वाला):

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

### `svg` **(वैकल्पिक)

स्वतंत्र SVG संपत्तियों के लिए शीर्ष-स्तरीय पथ और लेआउट। अनुवाद केवल तभी चलता है जब**`features.translateSVG` सत्य हो (या तो `translate-svg` या `sync` के SVG चरण के माध्यम से)।

| फ़ील्ड                       | विवरण |
| --------------------------- | ----------- |
| `sourcePath`                | एक निर्देशिका या निर्देशिकाओं का एक सरणी जो `.svg` फ़ाइलों के लिए पुनरावृत्त रूप से स्कैन की जाती है। |
| `outputDir`                 | अनुवादित SVG आउटपुट के लिए मूल निर्देशिका। |
| `style`                     | `"flat"` या `"nested"` जब `pathTemplate` अनसेट हो। |
| `pathTemplate`              | कस्टम SVG आउटपुट पथ। प्लेसहोल्डर: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | SVG पुनःसंयोजन पर छोटे अक्षरों में अनुवादित पाठ। उन डिज़ाइनों के लिए उपयोगी जो सभी-छोटे अक्षरों वाले लेबल पर निर्भर करते हैं। |

### `glossary`

| फ़ील्ड          | विवरण                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | `strings.json` का मार्ग - मौजूदा अनुवादों से स्वचालित रूप से एक शब्दावली बनाता है।                                                                                                                 |
| `userGlossary` | एक CSV का मार्ग जिसमें कॉलम `Original language string` (या `en`), `locale`, `Translation` होते हैं - प्रत्येक स्रोत शब्द के लिए एक पंक्ति और लक्ष्य स्थानीयकरण (`locale` सभी लक्ष्यों के लिए `*` हो सकता है)। |

विरासत कुंजी `uiGlossaryFromStringsJson` अभी भी स्वीकार की जाती है और कॉन्फ़िगरेशन लोड करते समय `uiGlossary` पर मैप की जाती है।

एक खाली शब्दावली CSV उत्पन्न करें:

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLI संदर्भ

| कमांड | विवरण |
| --- | --- |
| `version` | CLI संस्करण और बिल्ड टाइमस्टैम्प प्रिंट करें (मूल कार्यक्रम पर `-V` / `--version` के समान जानकारी)। |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | एक स्टार्टर कॉन्फ़िग फ़ाइल लिखें (`concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, और `documentations[].addFrontmatter` शामिल हैं)। `--with-translate-ignore` एक स्टार्टर `.translate-ignore` बनाता है। |
| `extract` | `t("…")` / `i18n.t("…")` लिटरल्स से `strings.json` को अपडेट करें, वैकल्पिक `package.json` विवरण, और वैकल्पिक मैनिफेस्ट `englishName` प्रविष्टियाँ (देखें `ui.reactExtractor`)। `features.extractUIStrings` की आवश्यकता होती है। |
| `generate-ui-languages [--master <path>] [--dry-run]` | मास्टर फ़ाइल में अनुपलब्ध स्थानों के लिए `TODO` प्लेसहोल्डर की चेतावनी दें और उत्सर्जित करें। यदि आपके पास अनुकूलित `label` या `englishName` मानों के साथ एक मौजूदा मैनिफेस्ट है, तो उन्हें मास्टर कैटलॉग डिफ़ॉल्ट द्वारा प्रतिस्थापित कर दिया जाएगा — उत्पन्न फ़ाइल की समीक्षा करें और बाद में समायोजित करें। `ui-languages.json` को `ui.flatOutputDir` (या सेट होने पर `uiLanguagesPath`) में `sourceLocale` + `targetLocales` और बंडल किए गए `data/ui-languages-complete.json` (या `--master`) का उपयोग करके लिखें। |
| `translate-docs …` | प्रत्येक `documentations` ब्लॉक (`contentPaths`, वैकल्पिक `jsonSource`) के लिए मार्कडाउन/MDX और JSON का अनुवाद करें। `-j`: अधिकतम समानांतर स्थान; `-b`: प्रति फ़ाइल अधिकतम समानांतर बैच API कॉल। `--prompt-format`: बैच वायर फ़ॉर्मेट (`xml` \| `json-array` \| `json-object`)। [कैश व्यवहार और `translate-docs` फ्लैग](#cache-behaviour-and-translate-docs-flags) और [बैच प्रॉम्प्ट प्रारूप](#batch-prompt-format) देखें। |
| `translate-svg …` | `config.svg` में कॉन्फ़िगर किए गए स्वतंत्र SVG संपत्तियों का अनुवाद करें (दस्तावेज़ों से अलग)। `features.translateSVG` की आवश्यकता होती है। दस्तावेज़ों के समान कैश विचार; उस रन के लिए SQLite पढ़ने/लिखने को छोड़ने के लिए `--no-cache` का समर्थन करता है। `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`। |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]` | केवल UI स्ट्रिंग्स का अनुवाद करें। `--force`: प्रति स्थान सभी प्रविष्टियों का पुनः अनुवाद करें (मौजूदा अनुवादों की अनदेखी करें)। `--dry-run`: कोई लेखन नहीं, कोई API कॉल नहीं। `-j`: अधिकतम समानांतर स्थान। `features.translateUIStrings` की आवश्यकता होती है। |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]` **| पहले**`extract`** चलाता है (**`features.extractUIStrings`** की आवश्यकता होती है) ताकि **`strings.json`** स्रोत से मेल खाए, फिर **स्रोत-स्थान** UI स्ट्रिंग्स की LLM समीक्षा (वर्तनी, व्याकरण)। **शब्दावली संकेत** केवल **`glossary.userGlossary`** CSV से आते हैं (**`translate-ui` के समान क्षेत्र — `strings.json` / `uiGlossary` नहीं, इसलिए खराब प्रतिलिपि को शब्दावली के रूप में मजबूत नहीं बनाया जाता है)। OpenRouter (`OPENROUTER_API_KEY` **) का उपयोग करता है। केवल सलाहकार (रन पूरा होने पर**0** निकलें)। **`cacheDir`** के तहत **`lint-source-results_<timestamp>.log`** को एक **मानव-पठनीय** रिपोर्ट (सारांश, मुद्दे, और प्रति-स्ट्रिंग **OK** पंक्तियाँ) के रूप में लिखता है; टर्मिनल केवल सारांश गिनती और मुद्दे प्रिंट करता है (प्रति स्ट्रिंग कोई **`[ok]`** पंक्तियाँ नहीं)। अंतिम पंक्ति में लॉग फ़ाइल का नाम प्रिंट करता है। **`--json`**: केवल stdout पर पूर्ण मशीन-पठनीय JSON रिपोर्ट (लॉग फ़ाइल मानव-पठनीय रहती है)। **`--dry-run`**: अभी भी **`extract`** चलाता है, फिर केवल बैच योजना प्रिंट करता है (कोई API कॉल नहीं)। **`--chunk`**: प्रति API बैच स्ट्रिंग्स (डिफ़ॉल्ट **50)। `-j` **: अधिकतम समानांतर बैच (डिफ़ॉल्ट**`concurrency`**)। **`--json`** के साथ, मानव-शैली का आउटपुट stderr पर जाता है। लिंक **`path:line`** का उपयोग करते हैं जैसे **`editor` UI स्ट्रिंग्स “लिंक” बटन। |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | XLIFF 2.0 में `strings.json` निर्यात करें (प्रति लक्ष्य स्थान एक `.xliff`)। `-o` / `--output-dir`: आउटपुट निर्देशिका (डिफ़ॉल्ट: कैटलॉग के समान फ़ोल्डर)। `--untranslated-only`: केवल उन इकाइयों को जिनके लिए उस स्थान के लिए अनुवाद अनुपलब्ध है। केवल पढ़ने के लिए; कोई API नहीं। |
| `sync …` | निर्यात करें (यदि सक्षम है), फिर UI अनुवाद, फिर `translate-svg` जब `features.translateSVG` और `config.svg` सेट होते हैं, फिर दस्तावेज़ीकरण अनुवाद - जब तक `--no-ui`, `--no-svg`, या `--no-docs` के साथ छोड़ा न जाए। साझा फ्लैग: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (केवल दस्तावेज़ बैचिंग), `--force` / `--force-update` (केवल दस्तावेज़; जब दस्तावेज़ चलते हैं तो परस्पर अनन्य)। दस्तावेज़ चरण `--emphasis-placeholders` और `--debug-failed` भी अग्रेषित करता है (`translate-docs` के समान अर्थ के साथ)। `--prompt-format` एक `sync` फ्लैग नहीं है; दस्तावेज़ चरण अंतर्निहित डिफ़ॉल्ट (`json-array`) का उपयोग करता है। |
| `status [--max-columns <n>]` | जब `features.translateUIStrings` चालू होता है, तो प्रति स्थान UI कवरेज प्रिंट करता है (`Translated` / `Missing` / `Total`)। फिर प्रति फ़ाइल × स्थान मार्कडाउन अनुवाद स्थिति प्रिंट करता है (कोई `--locale` फ़िल्टर नहीं; स्थान कॉन्फ़िग से आते हैं)। बड़ी स्थान सूचियों को अधिकतम `n` **स्थान कॉलम (डिफ़ॉल्ट**9) की दोहराई गई तालिकाओं में विभाजित किया जाता है ताकि पंक्तियाँ टर्मिनल में संकीर्ण रहें। |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]` | पहले `sync --force-update` चलाता है (निकालें, UI, SVG, दस्तावेज़), फिर बेकार सेगमेंट पंक्तियाँ हटाता है (null `last_hit_at` / खाली फ़ाइलपाथ); उन `file_tracking` पंक्तियों को छोड़ देता है जिनका हल किया गया स्रोत पथ डिस्क पर अनुपलब्ध है; उन अनुवाद पंक्तियों को हटाता है जिनका `filepath` मेटाडेटा एक अनुपलब्ध फ़ाइल की ओर इशारा करता है। तीन गिनती लॉग करता है (बेकार, अनाथ `file_tracking`, अनाथ अनुवाद)। कैश डिरेक्टरी के तहत एक समयसीमांकित SQLite बैकअप बनाता है जब तक `--no-backup` न हो। |
| `editor [-p <port>] [--no-open]` | कैश, `strings.json`, और शब्दावली CSV के लिए एक स्थानीय वेब संपादक लॉन्च करें। `--no-open` **: डिफ़ॉल्ट ब्राउज़र को स्वचालित रूप से न खोलें।<br><br>**नोट: यदि आप कैश संपादक में एक प्रविष्टि संपादित करते हैं, तो आपको अपडेटेड कैश प्रविष्टि के साथ आउटपुट फ़ाइलों को पुनः लिखने के लिए `sync --force-update` चलाना होगा। इसके अलावा, यदि बाद में स्रोत पाठ बदल जाता है, तो मैनुअल संपादन खो जाएगा क्योंकि एक नया कैश कुंजी उत्पन्न की जाती है। |
| `glossary-generate [-o <path>]` | एक खाली `glossary-user.csv` टेम्पलेट लिखें। `-o`: आउटपुट पथ को ओवरराइड करें (डिफ़ॉल्ट: कॉन्फ़िग से `glossary.userGlossary`, या `glossary-user.csv`)। |

सभी कमांड `-c <path>` का उपयोग गैर-डिफ़ॉल्ट कॉन्फ़िग फ़ाइल निर्दिष्ट करने के लिए, `-v` का उपयोग विस्तृत आउटपुट के लिए, और `-w` / `--write-logs [path]` का उपयोग कंसोल आउटपुट को लॉग फ़ाइल में टी करने के लिए स्वीकार करते हैं (डिफ़ॉल्ट पथ: रूट `cacheDir` के अंतर्गत)। मुख्य प्रोग्राम `-V` / `--version` और `-h` / `--help` का भी समर्थन करता है; `ai-i18n-tools help [command]` `ai-i18n-tools <command> --help` के समान प्रति-कमांड उपयोग दिखाता है।

---

## पर्यावरण चर

| चर                    | विवरण                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY` **|**आवश्यक।** आपका OpenRouter API कुंजी।                     |
| `OPENROUTER_BASE_URL`  | API बेस URL को ओवरराइड करें।                             |
| `I18N_SOURCE_LOCALE`   | रनटाइम पर `sourceLocale` को ओवरराइड करें।              |
| `I18N_TARGET_LOCALES`  | `targetLocales` को ओवरराइड करने के लिए कॉमा से पृथक स्थानीय कोड।  |
| `I18N_LOG_LEVEL`       | लॉगर स्तर (`debug`, `info`, `warn`, `error`, `silent`)। |
| `NO_COLOR`             | जब `1`, लॉग आउटपुट में ANSI रंगों को अक्षम करें।        |
| `I18N_LOG_SESSION_MAX` | प्रति लॉग सत्र अधिकतम पंक्तियाँ (डिफ़ॉल्ट `5000`)।       |
