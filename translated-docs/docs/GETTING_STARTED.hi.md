# ai-i18n-tools: प्रारंभ करना

`ai-i18n-tools` दो स्वतंत्र, संयोज्य कार्यप्रवाह प्रदान करता है:

- **कार्यप्रवाह 1 - UI अनुवाद**: किसी भी JS/TS स्रोत से `t("…")` कॉल निकालें, उन्हें OpenRouter के माध्यम से अनुवादित करें, और i18next के लिए तैयार फ्लैट प्रति-स्थानीय JSON फ़ाइलें लिखें।
- **कार्यप्रवाह 2 - दस्तावेज़ अनुवाद**: स्मार्ट कैशिंग के साथ किसी भी संख्या में स्थानीय भाषाओं में मार्कडाउन (MDX) और Docusaurus JSON लेबल फ़ाइलों का अनुवाद करें। **SVG** संपत्तियों के लिए एक अलग कमांड (`translate-svg`) और वैकल्पिक `svg` कॉन्फ़िगरेशन का उपयोग किया जाता है (देखें [CLI संदर्भ](#cli-reference)).

दोनों कार्यप्रवाह OpenRouter (किसी भी संगत LLM) का उपयोग करते हैं और एक ही कॉन्फ़िग फ़ाइल साझा करते हैं।

<small>**अन्य भाषाओं में पढ़ें:** </small>

<small id="lang-list">[en-GB](../../docs/GETTING_STARTED.md) · [de](./GETTING_STARTED.de.md) · [es](./GETTING_STARTED.es.md) · [fr](./GETTING_STARTED.fr.md) · [hi](./GETTING_STARTED.hi.md) · [ja](./GETTING_STARTED.ja.md) · [ko](./GETTING_STARTED.ko.md) · [pt-BR](./GETTING_STARTED.pt-BR.md) · [zh-CN](./GETTING_STARTED.zh-CN.md) · [zh-TW](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**सामग्री की तालिका**

- [स्थापना](#installation)
- [त्वरित प्रारंभ](#quick-start)
- [कार्यप्रवाह 1 - UI अनुवाद](#workflow-1---ui-translation)
  - [चरण 1: प्रारंभ करें](#step-1-initialise)
  - [चरण 2: स्ट्रिंग निकालें](#step-2-extract-strings)
  - [चरण 3: UI स्ट्रिंग का अनुवाद करें](#step-3-translate-ui-strings)
  - [चरण 4: रनटाइम पर i18next को कनेक्ट करें](#step-4-wire-i18next-at-runtime)
  - [स्रोत कोड में `t()` का उपयोग करना](#using-t-in-source-code)
  - [इंटरपोलेशन](#interpolation)
  - [भाषा स्विचर UI](#language-switcher-ui)
  - [RTL भाषाएँ](#rtl-languages)
- [कार्यप्रवाह 2 - दस्तावेज़ अनुवाद](#workflow-2---document-translation)
  - [चरण 1: प्रारंभ करें](#step-1-initialise-1)
  - [चरण 2: दस्तावेज़ों का अनुवाद करें](#step-2-translate-documents)
    - [कैश व्यवहार और `translate-docs` ध्वज](#cache-behaviour-and-translate-docs-flags)
  - [आउटपुट लेआउट](#output-layouts)
- [संयुक्त कार्यप्रवाह (UI + दस्तावेज़)](#combined-workflow-ui--docs)
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

प्रकाशित पैकेज **ESM-केवल** है। Node.js या अपने बंडलर में `import`/`import()` का उपयोग करें; **`require('ai-i18n-tools')` का उपयोग न करें।**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

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

# Combined: extract UI strings, then translate UI + docs (per config features)
npx ai-i18n-tools sync

# Markdown translation status (per file × locale)
npx ai-i18n-tools status
```

---

## कार्यप्रवाह 1 - UI अनुवाद

i18next का उपयोग करने वाले किसी भी JS/TS प्रोजेक्ट के लिए डिज़ाइन किया गया: React ऐप्स, Next.js (क्लाइंट और सर्वर घटक), Node.js सेवाएँ, CLI उपकरण।

### चरण 1: प्रारंभ करें

```bash
npx ai-i18n-tools init
```

यह `ai-i18n-tools.config.json` को `ui-markdown` टेम्पलेट के साथ लिखता है। इसे संपादित करें ताकि:

- `sourceLocale` - आपका स्रोत भाषा BCP-47 कोड (जैसे `"en-GB"`). **मिलाना चाहिए** `SOURCE_LOCALE` जो आपके रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) से निर्यात किया गया है।  
- `targetLocales` - आपके `ui-languages.json` मैनिफेस्ट का पथ या BCP-47 कोड का एक ऐरे।  
- `ui.sourceRoots` - `t("…")` कॉल के लिए स्कैन करने के लिए निर्देशिकाएँ (जैसे `["src/"]`)।  
- `ui.stringsJson` - मास्टर कैटलॉग कहाँ लिखें (जैसे `"src/locales/strings.json"`)।  
- `ui.flatOutputDir` - `de.json`, `pt-BR.json`, आदि कहाँ लिखें (जैसे `"src/locales/"`)।  
- `ui.preferredModel` (वैकल्पिक) - `translate-ui` के लिए पहले **प्रयास** करने के लिए OpenRouter मॉडल आईडी; विफलता पर CLI क्रम में `openrouter.translationModels` (या विरासती `defaultModel` / `fallbackModel`) के साथ जारी रहता है, डुप्लिकेट छोड़कर।

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

### चरण 4: रनटाइम पर i18next को वायर करें

आपकी i18n सेटअप फ़ाइल बनाएं जो `'ai-i18n-tools/runtime'` द्वारा निर्यात किए गए सहायक फ़ंक्शंस का उपयोग करती है:

```js
// src/i18n.js  (or src/i18n.ts)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

React रेंडर होने से पहले `i18n.js` आयात करें (जैसे आपके प्रवेश बिंदु के शीर्ष पर)। जब उपयोगकर्ता भाषा बदलता है, तो `await loadLocale(code)` फिर `i18n.changeLanguage(code)` कॉल करें।

`SOURCE_LOCALE` निर्यात किया गया है ताकि कोई अन्य फ़ाइल जिसे इसकी आवश्यकता है (जैसे एक भाषा स्विचर) इसे सीधे `'./i18n'` से आयात कर सके।

`defaultI18nInitOptions(sourceLocale)` कुंजी-के-डिफ़ॉल्ट सेटअप के लिए मानक विकल्प लौटाता है:

- `parseMissingKeyHandler` कुंजी को स्वयं लौटाता है, ताकि अनुवादित स्ट्रिंग्स स्रोत पाठ प्रदर्शित करें।  
- `nsSeparator: false` कोलन वाले कुंजियों की अनुमति देता है।  
- `interpolation.escapeValue: false` - इसे बंद करना सुरक्षित है: React स्वयं मानों को एस्केप करता है, और Node.js/CLI आउटपुट में एस्केप करने के लिए कोई HTML नहीं है।

`wrapI18nWithKeyTrim(i18n)` `i18n.t` को इस प्रकार लपेटता है कि: (1) कुंजियों को लुकअप से पहले ट्रिम किया जाए, जिससे एक्सट्रैक्ट स्क्रिप्ट द्वारा उनके संग्रहीत होने के तरीके से मेल खाता है; (2) <code>{"{{var}}"}</code> इंटरपोलेशन तब लागू होता है जब स्रोत स्थानीयकरण मूल कुंजी लौटाता है - इसलिए <code>{"t('Hello {{name}}', { name })"}</code> स्रोत भाषा के लिए भी सही ढंग से काम करता है।

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

निकालने की स्क्रिप्ट दूसरे आर्गुमेंट को नजरअंदाज करती है - केवल शाब्दिक कुंजी स्ट्रिंग <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code> निकाली जाती है और अनुवाद के लिए भेजी जाती है। अनुवादकों को <code>{"{{...}}"}</code> टोकन को बनाए रखने के लिए निर्देशित किया जाता है।

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

`ui-languages.json` मैनिफेस्ट एक JSON एरे है जिसमें <code>{"{ code, label, englishName }"}</code> प्रविष्टियाँ होती हैं। उदाहरण:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

`targetLocales` को कॉन्फ़िग में इस फ़ाइल के पथ पर सेट करें ताकि अनुवाद कमांड उसी सूची का उपयोग करे।

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

मार्कडाउन दस्तावेज़, Docusaurus साइटों, और JSON लेबल फ़ाइलों के लिए डिज़ाइन किया गया। SVG आरेख [`translate-svg`](#cli-reference) और कॉन्फ़िग में `svg` के माध्यम से अनुवादित होते हैं, `documentations[].contentPaths` के माध्यम से नहीं।

### चरण 1: प्रारंभ करें

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

जनरेट किए गए `ai-i18n-tools.config.json` को संपादित करें:

- `sourceLocale` - स्रोत भाषा (`docusaurus.config.js` में `defaultLocale` से मेल खानी चाहिए)।
- `targetLocales` - स्थानीयकरण कोड की सरणी या मैनिफेस्ट का मार्ग।
- `cacheDir` - सभी दस्तावेज़ीकरण पाइपलाइन के लिए साझा किया गया SQLite कैश निर्देशिका (और `--write-logs` के लिए डिफ़ॉल्ट लॉग निर्देशिका)।
- `documentations` - दस्तावेज़ीकरण ब्लॉक की सरणी। प्रत्येक ब्लॉक में वैकल्पिक `description`, `contentPaths`, `outputDir`, वैकल्पिक `jsonSource`, `markdownOutput`, `targetLocales`, `addFrontmatter`, आदि होते हैं।
- `documentations[].description` - रखरखाव कर्ताओं के लिए वैकल्पिक संक्षिप्त नोट (इस ब्लॉक में क्या शामिल है)। जब सेट किया जाता है, तो यह `translate-docs` शीर्षक (`🌐 …: translating …`) और `status` अनुभाग के शीर्षक में दिखाई देता है।
- `documentations[].contentPaths` - मार्कडाउन/MDX स्रोत निर्देशिकाएँ या फ़ाइलें (JSON लेबल के लिए `documentations[].jsonSource` भी देखें)।
- `documentations[].outputDir` - उस ब्लॉक के लिए अनुवादित आउटपुट मूल।
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

| ध्वज                     | प्रभाव                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(default)*              | जब ट्रैकिंग + डिस्क पर आउटपुट मेल खाते हैं तो अपरिवर्तित फ़ाइल्स को छोड़ दें; शेष के लिए सेगमेंट कैश का उपयोग करें।                                                                                                             |
| `--force-update`         | प्रत्येक मिलान वाली फ़ाइल को फिर से प्रक्रिया करें (एक्सट्रैक्ट, पुनः असेंबल, आउटपुट लिखें) भले ही फ़ाइल ट्रैकिंग इसे छोड़ दे। **सेगमेंट कैश अभी भी लागू होता है** - अपरिवर्तित सेगमेंट्स को LLM को नहीं भेजा जाता है।                   |
| `--force`                | प्रत्येक प्रसंस्कृत फ़ाइल के लिए फ़ाइल ट्रैकिंग साफ़ करता है और **कैश पढ़ता नहीं है** API अनुवाद के लिए (पूर्ण पुनः अनुवाद)। नए परिणाम अभी भी **लिखे जाते हैं** सेगमेंट कैश में।                 |
| `--stats`                | सेगमेंट गणना, ट्रैक की गई फ़ाइल गणना और प्रति-स्थानीयकरण सेगमेंट कुल मिलाकर प्रिंट करें, फिर बाहर निकलें।                                                                                                                   |
| `--clear-cache [locale]` | कैश किए गए अनुवाद (और फ़ाइल ट्रैकिंग) को हटा दें: सभी स्थानीयकरण, या एकल स्थानीयकरण, फिर बाहर निकलें।                                                                                                            |
| `--prompt-format <mode>` | प्रत्येक **बैच** सेगमेंट्स को मॉडल को कैसे भेजा जाता है और पार्स किया जाता है (`xml`, `json-array`, या `json-object`)। डिफ़ॉल्ट **`xml`**। यह एक्सट्रैक्शन, प्लेसहोल्डर, वैधीकरण, कैश या फॉलबैक व्यवहार में परिवर्तन नहीं करता है — [बैच प्रॉम्प्ट स्वरूप](#batch-prompt-format) देखें। |

आप `--force` को `--force-update` के साथ संयोजित नहीं कर सकते (वे परस्पर अनन्य हैं)।

#### बैच प्रॉम्प्ट स्वरूप

`translate-docs` अनुवाद योग्य सेगमेंट्स को OpenRouter में **बैचों** में भेजता है ( `batchSize` / `maxBatchChars` द्वारा समूहित)। **`--prompt-format`** ध्वज केवल उस बैच के **वायर फॉर्मेट** को बदलता है; सेगमेंट विभाजन, `PlaceholderHandler` टोकन, मार्कडाउन AST जांच, SQLite कैश कुंजियाँ, और बैच पार्सिंग विफल होने पर प्रति-सेगमेंट फॉलबैक अपरिवर्तित रहते हैं।

| मोड | उपयोगकर्ता संदेश | मॉडल उत्तर |
| ---- | ------------ | ----------- |
| **`xml`** (डिफ़ॉल्ट) | पीसोडो-XML: एक `<seg id="N">…</seg>` प्रति खंड (XML एस्केपिंग के साथ)। | केवल `<t id="N">…</t>` ब्लॉक, प्रति खंड अनुक्रमांक। |
| **`json-array`** | एक JSON स्ट्रिंग्स की सूची, क्रम में प्रति खंड एक प्रविष्टि। | **समान लंबाई** की एक JSON सूची (समान क्रम)। |
| **`json-object`** | एक JSON ऑब्जेक्ट `{"0":"…","1":"…",…}` खंड अनुक्रमांक द्वारा कुंजीबद्ध। | **समान कुंजी** और अनुवादित मानों के साथ एक JSON ऑब्जेक्ट। |

रन हेडर भी `Batch prompt format: …` प्रिंट करता है ताकि आप सक्रिय मोड की पुष्टि कर सकें। JSON लेबल फ़ाइलें (`jsonSource`) और स्वतंत्र SVG बैच उसी सेटिंग का उपयोग करते हैं जब ये चरण `translate-docs` (या `sync` के दस्तावेज़ चरण — `sync` इस ध्वज को उजागर नहीं करता; यह **`xml`** पर डिफ़ॉल्ट होता है) के हिस्से के रूप में चलते हैं।

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
  "targetLocales": "src/locales/ui-languages.json",
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
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

एक पाइपलाइन चलाने के लिए `npx ai-i18n-tools sync` चलाएँ: **निकालें** UI स्ट्रिंग्स (यदि `features.extractUIStrings`), **अनुवाद करें UI** स्ट्रिंग्स (यदि `features.translateUIStrings`), **स्वतंत्र SVG संपत्तियों का अनुवाद करें** (यदि कॉन्फ़िगरेशन में एक `svg` ब्लॉक मौजूद है), फिर **दस्तावेज़ का अनुवाद करें** (प्रत्येक `documentations` ब्लॉक: कॉन्फ़िगर किए गए अनुसार markdown/JSON)। `--no-ui`, `--no-svg`, या `--no-docs` के साथ भागों को छोड़ें। दस्तावेज़ चरण `--dry-run`, `-p` / `--path`, `--force`, और `--force-update` को स्वीकार करता है (अंतिम दो केवल तब लागू होते हैं जब दस्तावेज़ अनुवाद चलता है; यदि आप `--no-docs` पास करते हैं तो उन्हें अनदेखा किया जाता है)।

एक ब्लॉक पर `documentations[].targetLocales` का उपयोग करें ताकि उस ब्लॉक की फ़ाइलों का अनुवाद UI की तुलना में **छोटे उपसमुच्चय** में किया जा सके (प्रभावी दस्तावेज़ स्थानीयताएँ ब्लॉकों के बीच **संघ** हैं):

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

---

## कॉन्फ़िगरेशन संदर्भ

### `sourceLocale`

स्रोत भाषा के लिए BCP-47 कोड (जैसे `"en-GB"`, `"en"`, `"pt-BR"`)। इस स्थानीयता के लिए कोई अनुवाद फ़ाइल उत्पन्न नहीं होती - कुंजी स्ट्रिंग स्वयं स्रोत पाठ है।

**मेल खाना चाहिए** `SOURCE_LOCALE` जो आपके रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) से निर्यात किया गया है।

### `targetLocales`

कौन सी स्थानीयताओं का अनुवाद करना है। स्वीकार करता है:

- **स्ट्रिंग पथ** एक `ui-languages.json` मैनिफेस्ट के लिए (`"src/locales/ui-languages.json"`)। फ़ाइल लोड की जाती है और स्थानीयता कोड निकाले जाते हैं।
- **BCP-47 कोड का ऐरे** (`["de", "fr", "es"]`)।
- **पथ के साथ एक-तत्व ऐरे** (`["src/locales/ui-languages.json"]`) - स्ट्रिंग रूप के समान व्यवहार।

`targetLocales` UI अनुवाद के लिए प्राथमिक स्थानीयता सूची है और दस्तावेज़ ब्लॉकों के लिए डिफ़ॉल्ट स्थानीयता सूची है। यदि आप यहां एक स्पष्ट ऐरे रखना पसंद करते हैं लेकिन फिर भी मैनिफेस्ट-चालित लेबल और स्थानीयता फ़िल्टरिंग चाहते हैं, तो `uiLanguagesPath` भी सेट करें।

### `uiLanguagesPath` (वैकल्पिक)

एक `ui-languages.json` मैनिफेस्ट का पथ जिसका उपयोग प्रदर्शन नामों, स्थानीयता फ़िल्टरिंग, और भाषा-सूची पोस्ट-प्रोसेसिंग के लिए किया जाता है।

इसका उपयोग करें जब:

- `targetLocales` एक स्पष्ट ऐरे है, लेकिन आप फिर भी मैनिफेस्ट से अंग्रेजी/स्थानीय लेबल चाहते हैं।
- आप चाहते हैं कि `markdownOutput.postProcessing.languageListBlock` उसी मैनिफेस्ट से स्थानीयता लेबल बनाए।
- केवल UI अनुवाद सक्षम है और आप चाहते हैं कि मैनिफेस्ट प्रभावी UI स्थानीयता सूची प्रदान करे।

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
| `translationModels` | मॉडल आईडी की प्राथमिक क्रमबद्ध सूची। पहले को पहले आजमाया जाता है; बाद में प्रविष्टियाँ त्रुटि पर बैकअप होती हैं। केवल `translate-ui` के लिए**, आप इस सूची से पहले एक मॉडल आजमाने के लिए `ui.preferredModel` भी सेट कर सकते हैं (देखें `ui`)। |
| `defaultModel`      | विरासत एकल प्राथमिक मॉडल। केवल तब उपयोग किया जाता है जब `translationModels` सेट नहीं है या खाली है।       |
| `fallbackModel`     | विरासत एकल बैकअप मॉडल। जब `translationModels` सेट नहीं है या खाली है, तब `defaultModel` के बाद उपयोग किया जाता है। |
| `maxTokens`         | प्रति अनुरोध अधिकतम पूर्णता टोकन। डिफ़ॉल्ट: `8192`।                                      |
| `temperature`       | सैंपलिंग तापमान। डिफ़ॉल्ट: `0.2`।                                                    |

अपने वातावरण या `.env` फ़ाइल में `OPENROUTER_API_KEY` सेट करें।

### `features`

| फ़ील्ड                | कार्यप्रवाह | विवरण                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | स्रोत को `t("…")` के लिए स्कैन करें और `strings.json` लिखें/मर्ज करें।          |
| `translateUIStrings` | 1        | `strings.json` प्रविष्टियों का अनुवाद करें और प्रति-स्थानीय JSON फ़ाइलें लिखें। |
| `translateMarkdown`  | 2        | `.md` / `.mdx` फ़ाइलों का अनुवाद करें।                                   |
| `translateJSON`      | 2        | Docusaurus JSON लेबल फ़ाइलों का अनुवाद करें।                            |

कोई `features.translateSVG` ध्वज नहीं है। **स्वतंत्र** SVG संपत्तियों का अनुवाद `translate-svg` और कॉन्फ़िग में एक शीर्ष स्तर `svg` ब्लॉक के साथ करें। `sync` कमांड उस चरण को चलाता है जब `svg` मौजूद होता है (जब तक `--no-svg` न हो)।

### `ui`

| फ़ील्ड                       | विवरण                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | निर्देशिकाएँ (cwd के सापेक्ष) जिन्हें `t("…")` कॉल के लिए स्कैन किया जाता है।               |
| `stringsJson`               | मास्टर कैटलॉग फ़ाइल का मार्ग। `extract` द्वारा अपडेट किया जाता है।                  |
| `flatOutputDir`             | निर्देशिका जहाँ प्रति-स्थानीय JSON फ़ाइलें लिखी जाती हैं (`de.json`, आदि)।    |
| `preferredModel`            | वैकल्पिक। केवल `translate-ui` के लिए पहले आज़माया गया OpenRouter मॉडल आईडी; फिर `openrouter.translationModels` (या पुराने मॉडल) क्रम में, इस आईडी को दोहराए बिना। |
| `reactExtractor.funcNames`  | अतिरिक्त फ़ंक्शन नाम जिन्हें स्कैन किया जाएगा (डिफ़ॉल्ट: `["t", "i18n.t"]`)।         |
| `reactExtractor.extensions` | शामिल करने के लिए फ़ाइल एक्सटेंशन (डिफ़ॉल्ट: `[".js", ".jsx", ".ts", ".tsx"]`)। |
| `reactExtractor.includePackageDescription` | जब `true` (डिफ़ॉल्ट), तो `extract` मौजूद होने पर `package.json` `description` को भी यूआई स्ट्रिंग के रूप में शामिल करता है। |
| `reactExtractor.packageJsonPath` | उस वैकल्पिक विवरण निष्कर्षण के लिए उपयोग की जाने वाली `package.json` फ़ाइल का कस्टम मार्ग।

### `cacheDir`

| फ़ील्ड      | विवरण                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite कैश निर्देशिका (सभी `documentations` ब्लॉकों द्वारा साझा की गई)। पुनरावृत्ति के दौरान पुन: उपयोग करें। |

### `documentations`

दस्तावेज़ पाइपलाइन ब्लॉकों का एरे। `translate-docs` और `sync` प्रक्रिया के दस्तावेज़ चरण **प्रत्येक** ब्लॉक को क्रम में संसाधित करते हैं।

| फ़ील्ड                                        | विवरण                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | इस ब्लॉक के लिए वैकल्पिक मानव-पठनीय नोट (अनुवाद के लिए उपयोग नहीं किया जाता है)। जब सेट किया जाता है, तो `translate-docs` `🌐` शीर्षक में उपसर्ग के रूप में दिखाई देता है; `status` अनुभाग के शीर्षक में भी दिखाया जाता है।                                                     |
| `contentPaths`                               | अनुवाद के लिए Markdown/MDX स्रोत (`translate-docs` इनमें `.md` / `.mdx` के लिए स्कैन करता है)। JSON लेबल उसी ब्लॉक पर `jsonSource` से आते हैं।                                                                                  |
| `outputDir`                                  | इस ब्लॉक के लिए अनुवादित आउटपुट की रूट निर्देशिका।                                                                                                                                                                      |
| `sourceFiles`                                | वैकल्पिक उपनाम जो लोड के समय `contentPaths` में मर्ज हो जाता है।                                                                                                                                                                        |
| `targetLocales`                              | केवल इस ब्लॉक के लिए वैकल्पिक भाषाओं का उपसमुच्चय (अन्यथा मूल `targetLocales`)। प्रभावी दस्तावेज़ीकरण भाषाएँ ब्लॉक्स में संयोजन के रूप में होती हैं।                                                                             |
| `jsonSource`                                 | इस ब्लॉक के लिए Docusaurus JSON लेबल फ़ाइलों की स्रोत निर्देशिका (उदाहरण के लिए, `"i18n/en"`)।                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"` (डिफ़ॉल्ट), `"docusaurus"`, या `"flat"`।                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Docusaurus लेआउट के लिए स्रोत दस्तावेज़ों की जड़ (उदाहरण के लिए, `"docs"`)।                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | कस्टम मार्कडाउन आउटपुट पथ। प्लेसहोल्डर: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>। |
| `markdownOutput.jsonPathTemplate`            | लेबल फ़ाइलों के लिए कस्टम JSON आउटपुट पथ। `pathTemplate` के समान प्लेसहोल्डर का समर्थन करता है।                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | `flat` शैली के लिए, स्रोत उपनिर्देशिकाओं को बरकरार रखें ताकि समान बेसनेम वाली फ़ाइलें टकराएं नहीं।                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | अनुवाद के बाद सापेक्ष लिंक को पुनः लिखें (स्वचालित रूप से `flat` शैली के लिए सक्षम)।                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | समतल-लिंक पुनः लेखन उपसर्ग की गणना करते समय उपयोग किया जाने वाला रिपो रूट। आमतौर पर इसे `"."` के रूप में छोड़ दें, जब तक कि आपके अनुवादित दस्तावेज़ एक अलग प्रोजेक्ट रूट के तहत नहीं हैं। |
| `markdownOutput.postProcessing` | अनुवादित मार्कडाउन **body** पर वैकल्पिक परिवर्तन (YAML फ्रंट मैटर संरक्षित है)। खंड पुनर्मिलन और समतल लिंक पुनः लेखन के बाद, और `addFrontmatter` से पहले चलता है। |
| `markdownOutput.postProcessing.regexAdjustments` | `{ "description"?, "search", "replace" }` की क्रमबद्ध सूची। `search` एक रेगेक्स पैटर्न है (सादा स्ट्रिंग फ्लैग `g` का उपयोग करता है, या `/pattern/flags`)। `replace` प्लेसहोल्डर का समर्थन करता है जैसे कि `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` (संदर्भ `additional-adjustments` के समान विचार)। |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — अनुवादक पहली पंक्ति को खोजता है जिसमें `start` होता है और मिलान `end` पंक्ति, फिर उस स्लाइस को एक मानक भाषा स्विचर के साथ प्रतिस्थापित करता है। लिंक अनुवादित फ़ाइल के सापेक्ष पथ के साथ बनाए जाते हैं; लेबल `uiLanguagesPath` / `ui-languages.json` से लिए जाते हैं जब कॉन्फ़िगर किया गया हो, अन्यथा `localeDisplayNames` और भाषा कोड से। |
| `addFrontmatter`                  | जब `true` (जब छोड़ा जाता है तो डिफ़ॉल्ट), अनुवादित मार्कडाउन फ़ाइलों में YAML कुंजियाँ शामिल होती हैं: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, और जब कम से कम एक खंड में मॉडल मेटाडेटा होता है, तो `translation_models` (OpenRouter मॉडल आईडी की क्रमबद्ध सूची)। छोड़ने के लिए `false` सेट करें। |

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

### `svg` (वैकल्पिक)

`translate-svg` द्वारा अनुवादित और `sync` के SVG चरण के लिए स्वतंत्र SVG संपत्तियों के लिए शीर्ष-स्तरीय कॉन्फ़िगरेशन।

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
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | एक स्टार्टर कॉन्फ़िग फ़ाइल लिखें (इसमें `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, और `documentations[].addFrontmatter` शामिल हैं)। `--with-translate-ignore` एक स्टार्टर `.translate-ignore` बनाता है। |
| `extract` | स्रोत में `t("…")` कॉल की स्कैन करें और `strings.json` को अपडेट करें। `features.extractUIStrings` की आवश्यकता होती है। |
| `translate-docs …` | प्रत्येक `documentations` ब्लॉक के लिए मार्कडाउन/MDX और JSON का अनुवाद करें (`contentPaths`, वैकल्पिक `jsonSource`)। `-j`: अधिकतम समानांतर स्थानीयकरण; `-b`: प्रति फ़ाइल अधिकतम समानांतर बैच API कॉल। `--prompt-format`: बैच वायर फ़ॉर्मेट (`xml` \| `json-array` \| `json-object`)। [कैश व्यवहार और `translate-docs` फ़्लैग](#cache-behaviour-and-translate-docs-flags) और [बैच प्रॉम्प्ट फ़ॉर्मेट](#batch-prompt-format) देखें। |
| `translate-svg …` | `config.svg` में कॉन्फ़िगर किए गए स्वतंत्र SVG एसेट का अनुवाद करें (दस्तावेज़ों से अलग)। दस्तावेज़ों के समान कैश विचार; `--no-cache` का समर्थन करता है जो उस रन के लिए SQLite पढ़ने/लिखने को छोड़ देता है। `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`। |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]` | केवल UI स्ट्रिंग्स का अनुवाद करें। `--force`: प्रत्येक स्थानीयकरण के लिए सभी प्रविष्टियों को पुनः अनुवादित करें (मौजूदा अनुवादों को अनदेखा करें)। `--dry-run`: कोई लेखन नहीं, कोई API कॉल नहीं। `-j`: अधिकतम समानांतर स्थानीयकरण। `features.translateUIStrings` की आवश्यकता होती है। |
| `sync …` | निकालें (यदि सक्षम है), फिर UI अनुवाद, फिर `config.svg` मौजूद होने पर `translate-svg`, फिर दस्तावेज़ीकरण अनुवाद - जब तक `--no-ui`, `--no-svg`, या `--no-docs` के साथ छोड़ा न जाए। साझा फ्लैग: `-l`, `-p`, `--dry-run`, `-j`, `-b` (केवल दस्तावेज़ बैचिंग), `--force` / `--force-update` (केवल दस्तावेज़; परस्पर अनन्य जब दस्तावेज़ चलते हैं)। |
| `status` | प्रत्येक फ़ाइल × स्थानीयकरण के लिए मार्कडाउन अनुवाद स्थिति दिखाएँ (कोई `--locale` फ़िल्टर नहीं; स्थानीयकरण कॉन्फ़िग से आते हैं)। |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]` | पहले `sync --force-update` चलाता है (निकालें, UI, SVG, दस्तावेज़), फिर बेकार सेगमेंट पंक्तियाँ हटाता है (null `last_hit_at` / खाली फ़ाइलपाथ); `file_tracking` पंक्तियाँ छोड़ता है जिनका संकल्पित स्रोत पथ डिस्क पर अनुपलब्ध है; उन अनुवाद पंक्तियों को हटाता है जिनका `filepath` मेटाडेटा एक अनुपलब्ध फ़ाइल की ओर इशारा करता है। तीन गिनती लॉग करता है (बेकार, अनाथ `file_tracking`, अनाथ अनुवाद)। कैश डिरेक्टरी के अंतर्गत एक समयस्टैम्प वाला SQLite बैकअप बनाता है जब तक कि `--no-backup` न हो। |
| `editor [-p <port>] [--no-open]` | कैश, `strings.json`, और शब्दावली CSV के लिए एक स्थानीय वेब संपादक लॉन्च करें। `--no-open`: डिफ़ॉल्ट ब्राउज़र को स्वचालित रूप से न खोलें।<br><br>**नोट:** यदि आप कैश संपादक में एक प्रविष्टि संपादित करते हैं, तो आपको अपडेट किए गए कैश प्रविष्टि के साथ आउटपुट फ़ाइलों को पुनः लिखने के लिए `sync --force-update` चलाना होगा। इसके अलावा, यदि बाद में स्रोत पाठ बदल जाता है, तो मैन्युअल संपादन खो जाएगा क्योंकि एक नया कैश कुंजी उत्पन्न होती है। |
| `glossary-generate [-o <path>]` | एक खाली `glossary-user.csv` टेम्पलेट लिखें। `-o`: आउटपुट पथ को ओवरराइड करें (डिफ़ॉल्ट: कॉन्फ़िग से `glossary.userGlossary`, या `glossary-user.csv`)। |

सभी कमांड `-c <path>` को एक गैर-डिफ़ॉल्ट कॉन्फ़िग फ़ाइल निर्दिष्ट करने के लिए, `-v` विस्तृत आउटपुट के लिए, और `-w` / `--write-logs [path]` को लॉग फ़ाइल में कंसोल आउटपुट को टी करने के लिए स्वीकार करते हैं (डिफ़ॉल्ट पथ: रूट `cacheDir` के तहत)।

---

## पर्यावरण चर

| चर                    | विवरण                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **आवश्यक।** आपका OpenRouter API कुंजी।                     |
| `OPENROUTER_BASE_URL`  | API बेस URL को ओवरराइड करें।                             |
| `I18N_SOURCE_LOCALE`   | रनटाइम पर `sourceLocale` को ओवरराइड करें।              |
| `I18N_TARGET_LOCALES`  | `targetLocales` को ओवरराइड करने के लिए कॉमा से पृथक स्थानीय कोड।  |
| `I18N_LOG_LEVEL`       | लॉगर स्तर (`debug`, `info`, `warn`, `error`, `silent`)। |
| `NO_COLOR`             | जब `1`, लॉग आउटपुट में ANSI रंगों को अक्षम करें।        |
| `I18N_LOG_SESSION_MAX` | प्रति लॉग सत्र अधिकतम पंक्तियाँ (डिफ़ॉल्ट `5000`)।       |
