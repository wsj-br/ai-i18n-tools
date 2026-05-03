<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: शुरुआत करें

`ai-i18n-tools` दो स्वतंत्र, संयोज्य कार्यप्रवाह प्रदान करता है:

- **कार्यप्रवाह 1 - UI अनुवाद**: किसी भी JS/TS स्रोत से `t("…")` कॉल निकालें, OpenRouter के माध्यम से उनका अनुवाद करें, और i18next के लिए तैयार प्रति-स्थानीयकरण JSON फ़ाइलें लिखें।
- **कार्यप्रवाह 2 - दस्तावेज़ अनुवाद**: मार्कडाउन (MDX) और Docusaurus JSON लेबल फ़ाइलों का किसी भी संख्या में स्थानीयकरण में अनुवाद करें, स्मार्ट कैशिंग के साथ। **SVG** संपत्तियां `features.translateSVG`, शीर्ष-स्तरीय `svg` ब्लॉक, और `translate-svg` का उपयोग करती हैं (देखें [CLI संदर्भ](#cli-reference))।

दोनों कार्यप्रवाह OpenRouter (कोई भी संगत LLM) का उपयोग करते हैं और एकल कॉन्फ़िगरेशन फ़ाइल साझा करते हैं।

<small>**अन्य भाषाओं में पढ़ें:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**विषय सूची**

- [स्थापना](#installation)
- [त्वरित प्रारंभ](#quick-start)
  - [अनुशंसित `package.json` स्क्रिप्ट्स](#recommended-packagejson-scripts)
- [कार्यप्रवाह 1 - UI अनुवाद](#workflow-1---ui-translation)
  - [चरण 1: आरंभ करें](#step-1-initialise)
  - [स्ट्रिंग्स निकालें](#step-2-extract-strings)
  - [UI स्ट्रिंग्स का अनुवाद करें](#step-3-translate-ui-strings)
  - [XLIFF 2.0 में निर्यात करना (वैकल्पिक)](#exporting-to-xliff-20-optional)
  - [चरण 4: रनटाइम पर i18next को जोड़ें](#step-4-wire-i18next-at-runtime)
  - [स्रोत कोड में `t()` का उपयोग](#using-t-in-source-code)
  - [इंटरपोलेशन](#interpolation)
  - [कार्डिनल बहुवचन (`plurals: true`)](#cardinal-plurals-plurals-true)
  - [भाषा स्विचर UI](#language-switcher-ui)
  - [RTL भाषाएँ](#rtl-languages)
- [कार्यप्रवाह 2 - दस्तावेज़ अनुवाद](#workflow-2---document-translation)
  - [चरण 1: दस्तावेज़ीकरण के लिए आरंभ करें](#step-1-initialise-for-documentation)
  - [चरण 2: दस्तावेज़ अनुवाद करें](#step-2-translate-documents)
    - [जटिल मार्कडाउन और विफल गुणवत्ता जांच](#complex-markdown-and-failed-quality-checks)
    - [कैश व्यवहार और `translate-docs` झंडे](#cache-behaviour-and-translate-docs-flags)
    - [बैच प्रॉम्प्ट प्रारूप](#batch-prompt-format)
    - [खंड डीड्यूप और SQLite में पथ](#segment-dedupe-and-paths-in-sqlite)
  - [आउटपुट लेआउट](#output-layouts)
    - [फ्लैट लेआउट में एंकर लिंक](#anchor-links-in-flat-layout)
    - [अनुवादित दस्तावेज़ों में छवियाँ और रास्टर संपत्ति](#images-and-raster-assets-in-translated-docs)
    - [`pathTemplate` / `jsonPathTemplate` स्थानधारक](#pathtemplate--jsonpathtemplate-placeholders)
- [संयुक्त कार्यप्रवाह (UI + दस्तावेज़)](#combined-workflow-ui--docs)
  - [मिश्रित दस्तावेज़ीकरण कार्यप्रवाह (Docusaurus + फ्लैट)](#mixed-documentation-workflow-docusaurus--flat)
- [अनुवाद कैश संपादक](#translation-cache-editor)
  - [विफलताएँ (दस्तावेज़ अनुवाद)](#failures-document-translation)
    - [इसका उपयोग कब करें](#when-to-use-it)
    - [स्रोत संपादन क्यों महत्वपूर्ण हैं](#why-source-edits-matter)
    - [टैब का उपयोग कैसे करें](#how-to-use-the-tab)
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

<a id="installation"></a>
## स्थापना

प्रकाशित पैकेज केवल **ESM** है। Node.js या आपके बंडलर में `import`/`import()` का उपयोग करें; `require('ai-i18n-tools')` का उपयोग न करें। पैकेज **`engines.node` `>=22.16.0`** की घोषणा करता है; पुराने Node.js संस्करणों का समर्थन नहीं है।

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools में अपना स्वयं का स्ट्रिंग निकालने वाला शामिल है। यदि आप पहले `i18next-scanner`, `babel-plugin-i18next-extract`, या इसी तरह के उपकरणों का उपयोग कर रहे थे, तो माइग्रेट करने के बाद आप उन डेव निर्भरताओं को हटा सकते हैं।

अपनी OpenRouter API कुंजी सेट करें:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

या प्रोजेक्ट रूट में एक `.env` फ़ाइल बनाएँ:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## त्वरित शुरुआत

डिफ़ॉल्ट `init` टेम्पलेट (`ui-markdown`) केवल **UI** निकासी और अनुवाद को सक्षम करता है। `ui-docusaurus` टेम्पलेट **दस्तावेज़** अनुवाद (`translate-docs`) को सक्षम करता है। जब आप एक ऐसा कमांड चाहते हैं जो अपने कॉन्फ़िग के अनुसार निकासी, UI अनुवाद, वैकल्पिक स्वतंत्र SVG अनुवाद और दस्तावेज़ अनुवाद चलाता हो, तो `sync` का उपयोग करें।

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

<a id="recommended-packagejson-scripts"></a>
### अनुशंसित `package.json` स्क्रिप्ट्स

पैकेज को स्थानीय रूप से स्थापित करने के साथ, आप स्क्रिप्ट में सीधे CLI कमांड का उपयोग कर सकते हैं (`npx` की आवश्यकता नहीं है)।

**जहां भी पहले “`translate-ui` चलाएं, फिर `translate-svg`, फिर `translate-docs`” करना होता था, वहां `sync` को वरीयता दें**: `ai-i18n-tools sync` आपके कॉन्फ़िग के अनुसार सही क्रम और साझा फ़्लैग्स के साथ **extract** (जब सक्षम हो), **translate-ui**, वैकल्पिक **translate-svg**, फिर **translate-docs** चलाता है। इन तीन अनुवाद कमांड्स को हाथ से जोड़ना गलत हो सकता है (क्रम, extract, locale फ़्लैग्स)। केवल तभी `i18n:translate:ui`, `i18n:translate:svg`, और `i18n:translate:docs` का उपयोग करें जब आपको अलग रूप से केवल **एकल** चरण की आवश्यकता हो।

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## कार्यप्रवाह 1 - UI अनुवाद

किसी भी JS/TS प्रोजेक्ट के लिए डिज़ाइन किया गया है जो i18next का उपयोग करता है: React ऐप, Next.js (क्लाइंट और सर्वर कंपोनेंट्स), Node.js सेवाएँ, CLI टूल।

<a id="step-1-initialise"></a>
### चरण 1: आरंभ करें

```bash
npx ai-i18n-tools init
```

यह `ui-markdown` टेम्पलेट के साथ `ai-i18n-tools.config.json` लिखता है। इसे संपादित करके निम्नलिखित सेट करें:

- `sourceLocale` - आपकी स्रोत भाषा BCP-47 कोड (उदा. `"en-GB"`). **मेल खाना चाहिए** आपकी रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) से निर्यात किए गए `SOURCE_LOCALE` से।
- `targetLocales` - आपकी लक्ष्य भाषाओं के लिए BCP-47 कोड की सरणी (उदा. `["de", "fr", "pt-BR"]`). इस सूची से `ui-languages.json` मैनिफेस्ट बनाने के लिए `generate-ui-languages` चलाएँ।
- `ui.sourceRoots` - `t("…")` कॉल के लिए स्कैन करने की निर्देशिकाएँ (उदा. `["src/"]`)।
- `ui.stringsJson` - मास्टर कैटलॉग लिखने के लिए स्थान (उदा. `"src/locales/strings.json"`)।
- `ui.flatOutputDir` - `de.json`, `pt-BR.json`, आदि लिखने के लिए स्थान (उदा. `"src/locales/"`)।
- `ui.preferredModel` (वैकल्पिक) - केवल `translate-ui` के लिए **पहले** आज़माने के लिए OpenRouter मॉडल आईडी; विफलता पर CLI `openrouter.translationModels` (या पुराने `defaultModel` / `fallbackModel`) के क्रम में जारी रखता है, डुप्लिकेट को छोड़कर।

<a id="step-2-extract-strings"></a>
### चरण 2: स्ट्रिंग्स निकालें

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` के तहत सभी JS/TS फ़ाइलों में `t("literal")` और `i18n.t("literal")` कॉल की स्कैन करता है। `ui.stringsJson` में लिखता है (या मर्ज करता है)।

स्कैनर कॉन्फ़िगर करने योग्य है: `ui.reactExtractor.funcNames` के माध्यम से कस्टम फ़ंक्शन नाम जोड़ें।

<a id="step-3-translate-ui-strings"></a>
### चरण 3: UI स्ट्रिंग्स का अनुवाद करें

```bash
npx ai-i18n-tools translate-ui
```

`strings.json` पढ़ता है, प्रत्येक लक्ष्य स्थानीयकरण के लिए OpenRouter को बैच भेजता है, और सपाट JSON फ़ाइलें (`de.json`, `fr.json`, आदि) को `ui.flatOutputDir` में लिखता है। जब `ui.preferredModel` सेट किया जाता है, तो उस मॉडल को `openrouter.translationModels` में क्रमबद्ध सूची से पहले प्रयास किया जाता है (दस्तावेज़ अनुवाद और अन्य कमांड्स अभी भी केवल `openrouter` का उपयोग करते हैं)।

प्रत्येक प्रविष्टि के लिए, `translate-ui` प्रत्येक स्थानीयकरण का सफलतापूर्वक अनुवाद करने वाले **OpenRouter मॉडल आईडी** को एक वैकल्पिक `models` ऑब्जेक्ट में संग्रहीत करता है (`translated` के समान स्थानीयकरण कुंजियाँ)। स्थानीय `editor` कमांड में संपादित स्ट्रिंग्स को उस स्थानीयकरण के लिए `models` में सेंटिनल मान `user-edited` के साथ चिह्नित किया जाता है। `ui.flatOutputDir` के तहत प्रति-स्थानीयकरण सपाट फ़ाइलें केवल **स्रोत स्ट्रिंग → अनुवाद** रहती हैं; वे `models` शामिल नहीं करतीं (इसलिए रनटाइम बंडल अपरिवर्तित रहते हैं)।

> **कैश संपादक का उपयोग करने पर नोट:** यदि आप कैश संपादक में एक प्रविष्टि संपादित करते हैं, तो आपको अपडेटेड कैश प्रविष्टि के साथ आउटपुट फ़ाइलों को पुनः लिखने के लिए `sync --force-update` चलाने की आवश्यकता होगी (या `--force-update` के साथ समकक्ष `translate` कमांड)। साथ ही, ध्यान रखें कि यदि बाद में स्रोत पाठ बदल जाता है, तो आपका मैनुअल संपादन खो जाएगा क्योंकि नए स्रोत स्ट्रिंग के लिए एक नया कैश कुंजी (हैश) उत्पन्न किया जाएगा।

<a id="exporting-to-xliff-20-optional"></a>
### XLIFF 2.0 में निर्यात करना (वैकल्पिक)

UI स्ट्रिंग्स को अनुवाद विक्रेता, TMS या CAT उपकरण को सौंपने के लिए, कैटलॉग को **XLIFF 2.0** के रूप में निर्यात करें (प्रत्येक लक्ष्य स्थानीयकरण के लिए एक फ़ाइल)। यह कमांड **केवल पढ़ने योग्य** है: यह `strings.json` को संशोधित नहीं करता या कोई API नहीं कॉल करता।

```bash
npx ai-i18n-tools export-ui-xliff
```

डिफ़ॉल्ट रूप से, फ़ाइलें `ui.stringsJson` के पास लिखी जाती हैं, जिनके नाम इस तरह होते हैं: `strings.de.xliff`, `strings.pt-BR.xliff` (आपके कैटलॉग का बेसनेम + स्थानीयकरण + `.xliff`)। कहीं और लिखने के लिए `-o` / `--output-dir` का उपयोग करें। `strings.json` से मौजूदा अनुवाद `<target>` में दिखाई देते हैं; लापता स्थानीयकरण `state="initial"` का उपयोग करते हैं और कोई `<target>` नहीं होता ताकि उपकरण उन्हें भर सकें। प्रत्येक स्थानीयकरण के लिए अभी भी अनुवाद की आवश्यकता वाली इकाइयों को निर्यात करने के लिए `--untranslated-only` का उपयोग करें (विक्रेता बैच के लिए उपयोगी)। `--dry-run` फ़ाइलें लिखे बिना पथ प्रिंट करता है।

<a id="step-4-wire-i18next-at-runtime"></a>
### चरण 4: रनटाइम पर i18next को जोड़ें

`'ai-i18n-tools/runtime'` द्वारा निर्यात किए गए हेल्पर्स का उपयोग करके अपनी i18n सेटअप फ़ाइल बनाएँ:

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

<!--
  Translate-docs note: paragraphs here stack many `bold` / `` `code` `` patterns (nested backticks, long sentences).
  Some target locales fail AST-style validation; see "Complex Markdown and failed quality checks" under Workflow 2 — simplify source rather than forcing literal markup parity.
-->

**तीन मानों को संरेखित रखें:** `sourceLocale` में `ai-i18n-tools.config.json`, इस फ़ाइल में `SOURCE_LOCALE`, और बहुवचन फ्लैट JSON `translate-ui` आपकी फ्लैट आउटपुट निर्देशिका में `{sourceLocale}.json` के रूप में लिखता है (अक्सर `public/locales/`)। स्थिर `import` में उसी बेसनेम का उपयोग करें (उपरोक्त उदाहरण: `en-GB` → `en-GB.json`)। `lng` फ़ील्ड में `sourcePluralFlatBundle` का मान `SOURCE_LOCALE` के बराबर होना चाहिए। स्थिर ES `import` पथ चर का उपयोग नहीं कर सकते हैं; यदि आप स्रोत भाषा बदलते हैं, तो `SOURCE_LOCALE` और आयात पथ को एक साथ अपडेट करें। वैकल्पिक रूप से, एक गतिशील `import(\` के साथ उस फ़ाइल को लोड करें ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, या `readFileSync` ताकि पथ `SOURCE_LOCALE` से बनाया जा सके।

इस स्निपेट में `./locales/…` और `./public/locales/…` का उपयोग इस प्रकार किया गया है जैसे `i18n` उन फ़ोल्डरों के बगल में स्थित हो। यदि आपकी फ़ाइल `src/` के अंतर्गत है (सामान्य), तो `../locales/…` और `../public/locales/…` का उपयोग करें ताकि आयात `ui.stringsJson`, `uiLanguagesPath`, और `ui.flatOutputDir` के समान पथ पर हों।

React के रेंडर होने से पहले `i18n.js` को इम्पोर्ट करें (उदाहरण के लिए, आपके एंट्री पॉइंट के शीर्ष पर)। जब उपयोगकर्ता भाषा बदलता है, तो `await loadLocale(code)` और फिर `i18n.changeLanguage(code)` कॉल करें।

`localeLoaders` को `ui-languages.json` का उपयोग करके `makeLocaleLoadersFromManifest` से प्राप्त करके **config के साथ संरेखित** रखें (इससे `SOURCE_LOCALE` को `makeLoadLocale` के समान सामान्यीकरण का उपयोग करके फ़िल्टर किया जाता है)। जब आप `targetLocales` में एक स्थानीयकरण जोड़ते हैं और `generate-ui-languages` चलाते हैं, तो मैनिफेस्ट अपडेट हो जाता है और आपके लोडर स्वचालित रूप से परिवर्तन को ट्रैक करते हैं—कोई अलग हार्डकोडेड मैप बनाए रखने की आवश्यकता नहीं होती है।

यदि आपके JSON बंडल `public/` के अंतर्गत हैं (सामान्य Next.js सेटअप), तो प्रत्येक लोडर को आपके सार्वजनिक URL पथ से फ़ाइल प्राप्त करने के लिए लागू करें, उदाहरण के लिए:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

इससे ब्राउज़र स्थिर JSON लोड कर सकता है।

बंडलर के बिना नोड CLI के लिए, प्रत्येक कोड के लिए JSON फ़ाइल को पढ़ने और पार्स करने वाले छोटे `makeFileLoader` सहायक में `readFileSync` का उपयोग करें।

`SOURCE_LOCALE` निर्यात किया जाता है ताकि कोई भी अन्य फ़ाइल जिसे इसकी आवश्यकता हो (उदा. भाषा स्विचर) इसे सीधे `'./i18n'` से आयात कर सके। यदि आप मौजूदा i18next सेटअप को माइग्रेट कर रहे हैं, तो अपनी i18n बूटस्ट्रैप फ़ाइल से `SOURCE_LOCALE` के आयात के साथ किसी भी हार्डकोडेड स्रोत स्थानीयकरण स्ट्रिंग्स (उदा. घटकों में बिखरे `'en-GB'` चेक) को प्रतिस्थापित करें।

यदि आप डिफ़ॉल्ट निर्यात का उपयोग नहीं करना पसंद करते हैं, तो नामित आयात (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) उसी तरह काम करते हैं।

`aiI18n.defaultI18nInitOptions(sourceLocale)` (या नाम से आयातित होने पर `defaultI18nInitOptions(sourceLocale)`) की-के-डिफ़ॉल्ट सेटअप के लिए मानक विकल्प लौटाता है:

- `parseMissingKeyHandler` की स्वयं की की लौटाता है, इसलिए अनुवादित स्ट्रिंग्स स्रोत पाठ प्रदर्शित करती हैं।
- `nsSeparator: false` उन कीज़ को समर्थन करता है जिनमें कॉलन शामिल हों।
- `interpolation.escapeValue: false` - अक्षम करने के लिए सुरक्षित: React स्वयं मानों को एस्केप करता है, और Node.js/CLI आउटपुट में एस्केप करने के लिए कोई HTML नहीं होता है।

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` ai-i18n-tools परियोजनाओं के लिए **अनुशंसित** वायरिंग है: यह कुंजी-ट्रिम + स्रोत-भाषा <code>{"{{var}}"}</code> इंटरपोलेशन फॉलबैक लागू करता है (निचले स्तर के `wrapI18nWithKeyTrim` के समान व्यवहार), वैकल्पिक रूप से `translate-ui` `{sourceLocale}.json` बहुवचन उपसर्ग वाली कुंजियों को `addResourceBundle` के माध्यम से मर्ज करता है, फिर आपके `strings.json` से बहुवचन-जागरूक `wrapT` स्थापित करता है। उस बंडल फ़ाइल में आपकी **कॉन्फ़िगर की गई** स्रोत भाषा के लिए बहुवचन फ्लैट होना चाहिए — वही `sourceLocale` जो `ai-i18n-tools.config.json` और `SOURCE_LOCALE` में आपके i18n बूटस्ट्रैप में है (ऊपर चरण 4 देखें)। केवल बूटस्ट्रैपिंग के दौरान `sourcePluralFlatBundle` को छोड़ दें (एक बार जब `translate-ui` ने `{sourceLocale}.json` उत्सर्जित कर दिया हो, तो इसे मर्ज कर लें)। आवेदन कोड के लिए `wrapI18nWithKeyTrim` अकेले **पुराना** माना जाता है — इसके बजाय `setupKeyAsDefaultT` का उपयोग करें।

`makeLoadLocale(i18n, loaders, sourceLocale)` एक असमिकालिक `loadLocale(lang)` फ़ंक्शन लौटाता है जो किसी स्थानीयकरण के लिए JSON बंडल को गतिशील रूप से आयात करता है और इसे i18next के साथ पंजीकृत करता है।

<a id="using-t-in-source-code"></a>
### स्रोत कोड में `t()` का उपयोग करना

एक्सट्रैक्ट स्क्रिप्ट द्वारा इसे खोजने के लिए **आक्षरिक स्ट्रिंग** के साथ `t()` को कॉल करें:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

यही प्रारूप React के बाहर भी काम करता है (Node.js, सर्वर घटक, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**नियम:**

- केवल इन रूपों को निकाला जाता है: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`।
- की एक **आक्षरिक स्ट्रिंग** होनी चाहिए — की के रूप में कोई चर या अभिव्यक्ति नहीं।
- की के लिए टेम्पलेट लिटरल्स का उपयोग न करें: <code>{'t(`Hello ${name}`)'}</code> निकाले जाने योग्य नहीं है।

<a id="interpolation"></a>
### इंटरपोलेशन

<code>{"{{var}}"}</code> प्लेसहोल्डर्स के लिए i18next के नेटिव दूसरे तर्क इंटरपोलेशन का उपयोग करें:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

एक्सट्रैक्ट कमांड **दूसरे तर्क** को पार्स करता है जब वह एक सादा ऑब्जेक्ट लिटरल होता है और टूलिंग-केवल झंडों जैसे `plurals: true` और `zeroDigit` को पढ़ता है (नीचे **कार्डिनल बहुवचन** देखें)। सामान्य स्ट्रिंग्स के लिए, हैशिंग के लिए केवल शाब्दिक कुंजी का उपयोग किया जाता है; इंटरपोलेशन विकल्प अभी भी रनटाइम पर i18next को पास किए जाते हैं।

यदि आपकी परियोजना एक कस्टम इंटरपोलेशन उपयोगिता का उपयोग करती है (उदाहरण के लिए `t('key')` को कॉल करना और फिर परिणाम को `interpolateTemplate(t('Hello {{name}}'), { name })` जैसे टेम्पलेट फ़ंक्शन के माध्यम से पाइप करना), तो `setupKeyAsDefaultT` (`wrapI18nWithKeyTrim` के माध्यम से) इसे अनावश्यक बना देता है — यह <code>{"{{var}}"}</code> इंटरपोलेशन लागू करता है भले ही स्रोत भाषा शुद्ध कुंजी लौटाती हो। कॉल साइट्स को `t('Hello {{name}}', { name })` पर माइग्रेट करें और कस्टम उपयोगिता को हटा दें।

<a id="cardinal-plurals-plurals-true"></a>
### कार्डिनल बहुवचन (`plurals: true`)

डेवलपर-डिफ़ॉल्ट कॉपी के रूप में आप जो **समान शाब्दिक** चाहते हैं उसका उपयोग करें, और `plurals: true` पास करें ताकि एक्सट्रैक्ट + `translate-ui` कॉल को एक **कार्डिनल बहुवचन समूह** के रूप में मानें (i18next JSON v4-शैली `_zero` … `_other` रूप)।

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (वैकल्पिक) — केवल टूलिंग के लिए; i18next द्वारा **पढ़ा नहीं जाता**। जब `true`, तो प्रॉम्प्ट प्रत्येक स्थानीयकरण में उस रूप के लिए `_zero` स्ट्रिंग में शाब्दिक अरबी `0` को प्राथमिकता देते हैं; जब `false` या छोड़ दिया जाता है, तो प्राकृतिक शून्य वाक्यांश का उपयोग किया जाता है। `i18next.t` को कॉल करने से पहले इन कुंजियों को हटा दें (नीचे देखें `wrapT`)।

**सत्यापन:** यदि संदेश में **दो या अधिक** अलग-अलग `{{…}}` प्लेसहोल्डर हैं, तो उनमें से **एक `{{count}}`** (बहुवचन अक्ष) होना चाहिए। अन्यथा `extract` एक स्पष्ट फ़ाइल/पंक्ति संदेश के साथ **विफल** हो जाता है।

**दो स्वतंत्र गणनाएँ** (उदा. खंड और पृष्ठ) एक बहुवचन संदेश को साझा नहीं कर सकतीं — **दो** `t()` कॉल्स (प्रत्येक के साथ `plurals: true` और अपना स्वयं का `count`) का उपयोग करें और UI में जोड़ें।

**में** `strings.json` बहुवचन समूहों में `"plural": true`, मूल लिपि `source` में और `translated[locale]` के रूप में प्रत्येक हैश के लिए **एक पंक्ति का उपयोग किया जाता है**, जो कार्डिनल श्रेणियों (`zero`, `one`, `two`, `few`, `many`, `other`) को उस स्थानीयकरण के लिए स्ट्रिंग्स से मैप करता है।

**फ्लैट स्थानीय JSON:** गैर-बहुवचन पंक्तियाँ **स्रोत वाक्य → अनुवाद** के रूप में रहती हैं। बहुवचन पंक्तियों को `<groupId>_original` (`source` के बराबर, संदर्भ के लिए) और प्रत्येक प्रत्यय के लिए `<groupId>_<form>` के रूप में उत्सर्जित किया जाता है ताकि i18next बहुवचन को स्वाभाविक रूप से हल कर सके। `translate-ui` `{sourceLocale}.json` भी लिखता है जिसमें **केवल** बहुवचन फ्लैट कुंजियाँ होती हैं (स्रोत भाषा के लिए इस बंडल को लोड करें ताकि प्रत्यायुक्त कुंजियाँ हल हो सकें; सादे स्ट्रिंग्स अभी भी कुंजी-के-रूप-में-डिफ़ॉल्ट का उपयोग करते हैं)। प्रत्येक लक्ष्य स्थानीयकरण के लिए, उत्सर्जित प्रत्यय कुंजियाँ उस स्थानीयकरण (`requiredCldrPluralForms`) के लिए `Intl.PluralRules` से मेल खाती हैं: यदि `strings.json` ने संकलन के बाद किसी श्रेणी को छोड़ दिया क्योंकि वह दूसरे से मेल खाती थी (उदाहरण के लिए अरबी `many` `other` के समान), `translate-ui` फिर भी फ्लैट फ़ाइल में प्रत्येक आवश्यक प्रत्यय लिखता है एक फॉलबैक भाई-बहन स्ट्रिंग से कॉपी करके ताकि रनटाइम लुकअप कभी कुंजी न छोड़े।

रनटाइम (`ai-i18n-tools/runtime`): **कॉल करें** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — यह `wrapI18nWithKeyTrim` चलाता है, वैकल्पिक `translate-ui` `{sourceLocale}.json` बहुवचन बंडल को पंजीकृत करता है, फिर `wrapT` का उपयोग `buildPluralIndexFromStringsJson(stringsJson)` करते हुए। `wrapT` `plurals` / `zeroDigit` को हटा देता है, आवश्यकता पड़ने पर कुंजी को समूह आईडी में पुनः लिखता है, और `count` को अग्रेषित करता है (वैकल्पिक: यदि एकल गैर-`{{count}}` प्लेसहोल्डर है, तो `count` उस संख्यात्मक विकल्प से कॉपी किया जाता है)।

**पुराने वातावरण:** टूलिंग और सुसंगत व्यवहार के लिए `Intl.PluralRules` आवश्यक है; बहुत पुराने ब्राउज़र को लक्षित करने पर पॉलीफिल करें।

**v1 में नहीं:** क्रमिक बहुवचन (`_ordinal_*`, `ordinal: true`), अंतराल बहुवचन, केवल ICU पाइपलाइन।

<a id="language-switcher-ui"></a>
### भाषा स्विचर UI

एक भाषा चयनकर्ता बनाने के लिए `ui-languages.json` मैनिफेस्ट का उपयोग करें। `ai-i18n-tools` दो प्रदर्शन सहायक निर्यात करता है:

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

`getUILanguageLabel(lang, t)` - अनुवादित होने पर `t(englishName)` दिखाता है, या जब दोनों भिन्न होते हैं तो `englishName / t(englishName)` दिखाता है। सेटिंग्स स्क्रीन के लिए उपयुक्त।

`getUILanguageLabelNative(lang)` - `englishName / label` दिखाता है (प्रत्येक पंक्ति पर `t()` कॉल नहीं)। शीर्षक मेनू के लिए उपयुक्त जहाँ आप मूल नाम को दृश्यमान चाहते हैं।

`ui-languages.json` मैनिफेस्ट <code>{"{ code, label, englishName, direction }"}</code> प्रविष्टियों की एक JSON सरणी है (`direction` `"ltr"` या `"rtl"` है)। उदाहरण:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

मैनिफेस्ट `generate-ui-languages` द्वारा `sourceLocale` + `targetLocales` और बंडल किए गए मास्टर कैटलॉग से उत्पन्न होता है। इसे `ui.flatOutputDir` में लिखा जाता है। यदि आप कॉन्फ़िगरेशन में किसी भी स्थानीयकरण को बदलते हैं, तो `ui-languages.json` फ़ाइल को अपडेट करने के लिए `generate-ui-languages` चलाएँ।

<a id="rtl-languages"></a>
### RTL भाषाएँ

`ai-i18n-tools` `getTextDirection(lng)` और `applyDirection(lng)` निर्यात करता है:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` `document.documentElement.dir` (ब्राउज़र) सेट करता है या एक नो-ऑप है (Node.js)। एक विशिष्ट तत्व को लक्षित करने के लिए वैकल्पिक `element` तर्क पास करें।

उन स्ट्रिंग्स के लिए जिनमें `→` तीर हो सकते हैं, RTL लेआउट के लिए उन्हें पलट दें:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## कार्यप्रवाह 2 - दस्तावेज़ अनुवाद

मार्कडाउन दस्तावेज़ीकरण, Docusaurus साइटों और JSON लेबल फ़ाइलों के लिए डिज़ाइन किया गया। मार्कडाउन में एम्बेडेड PNG और अन्य रास्टर छवियों के लिए, [अनुवादित दस्तावेज़ों में छवियाँ और रास्टर संपत्ति](#images-and-raster-assets-in-translated-docs) देखें। स्वतंत्र SVG संपत्ति का अनुवाद [`translate-svg`](#cli-reference) के माध्यम से किया जाता है जब `features.translateSVG` सक्षम होता है और शीर्ष-स्तरीय `svg` ब्लॉक सेट किया गया होता है — `documentations[].contentPaths` के माध्यम से नहीं।

<a id="step-1-initialise-for-documentation"></a>
### चरण 1: दस्तावेज़ीकरण के लिए आरंभ करें

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

उत्पन्न `ai-i18n-tools.config.json` को संपादित करें:

- `sourceLocale` - स्रोत भाषा (`docusaurus.config.js` में `defaultLocale` से मेल खाना चाहिए)।
- `targetLocales` - BCP-47 स्थानीयकरण कोड की सरणी (उदा. `["de", "fr", "es"]`)।
- `cacheDir` - सभी दस्तावेज़ीकरण पाइपलाइन के लिए साझा SQLite कैश निर्देशिका (और `--write-logs` के लिए डिफ़ॉल्ट लॉग निर्देशिका)।
- `documentations` - दस्तावेज़ीकरण ब्लॉक्स की सरणी। प्रत्येक ब्लॉक में वैकल्पिक `description`, `contentPaths`, `outputDir`, वैकल्पिक `jsonSource`, `markdownOutput`, वैकल्पिक `segmentSplitting`, `targetLocales`, `addFrontmatter`, आदि होते हैं।
- `documentations[].description` - रखरखाव कर्ताओं के लिए वैकल्पिक संक्षिप्त टिप्पणी (इस ब्लॉक के दायरे में क्या है)। जब सेट किया जाता है, तो यह `translate-docs` शीर्षक (`🌐 …: translating …`) और `status` अनुभाग शीर्षकों में दिखाई देता है।
- `documentations[].contentPaths` - मार्कडाउन/MDX स्रोत निर्देशिकाएँ या फ़ाइलें (JSON लेबल के लिए देखें `documentations[].jsonSource`)।
- `documentations[].outputDir` - उस ब्लॉक के लिए अनुवादित आउटपुट रूट।
- `documentations[].markdownOutput.style` - `"nested"` (डिफ़ॉल्ट), `"docusaurus"`, या `"flat"` (देखें [आउटपुट लेआउट](#output-layouts))।

<a id="step-2-translate-documents"></a>
### चरण 2: दस्तावेज़ों का अनुवाद करें

```bash
npx ai-i18n-tools translate-docs
```

इससे प्रत्येक `documentations` ब्लॉक के `contentPaths` में सभी फ़ाइलों का सभी प्रभावी दस्तावेज़ीकरण स्थानों (प्रत्येक ब्लॉक के `targetLocales` का संघ, यदि सेट है, अन्यथा मूल `targetLocales`) के लिए अनुवाद होता है। पहले से अनुवादित खंड SQLite कैश से प्रदान किए जाते हैं — केवल नए या बदले गए खंडों को LLM को भेजा जाता है।

एकल स्थान के लिए अनुवाद करने के लिए:

```bash
npx ai-i18n-tools translate-docs --locale de
```

क्या अनुवाद करने की आवश्यकता है, यह जांचने के लिए:

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### जटिल मार्कडाउन और विफल गुणवत्ता जाँच

`translate-docs` जाँचता है कि प्रत्येक अनुवादित खंड मार्कडाउन संरचना (दस्तावेज़ से पार्स किया गया जोर सहित) को बरकरार रखता है। जो पैराग्राफ कई `bold` स्पैन को `` `inline code` `` के चारों ओर जोड़ते हैं, बोल्ड के अंदर बैकटिक्स को नेस्ट करते हैं (उदाहरण के लिए टेम्पलेट लिटरल्स जैसे `` `fetch(\`/locales/${code}.json\`)` ``), या एक लंबे वाक्य में बोल्ड और कोड को बुनते हैं वे नाजुक होते हैं: कुछ स्थानीयकरणों को अलग शब्द क्रम की आवश्यकता होती है, जिससे अनुवाद के बाद `**` और `` ` `` के संरेखण में बदलाव आ सकता है और CLI त्रुटियाँ जैसे `AST mismatch` ट्रिगर हो सकती हैं।

**यदि आप इस तरह की मान्यता विफलता का सामना करते हैं, तो स्रोत भाषा के पाठ को सरल बनाना पसंद करें**—पैराग्राफ को विभाजित करें, एक उदाहरण को फेंस्ड कोड ब्लॉक में ले जाएँ, या कम परतदार बोल्ड/कोड जोड़ियों के साथ उसी विचार का वर्णन करें—बजाय यह अपेक्षा करने के कि हर मॉडल और स्थानीयकरण घने इनलाइन मार्कअप को पूरी तरह से पुनः उत्पन्न करे। इस पृष्ठ पर अन्यत्र (विशेष रूप से `SOURCE_LOCALE`, लोडर्स और `public/` पथ पर चरण 4 के नोट्स में), प्रारूप जानबूझकर वास्तविकवादी है; जब आप अपने दस्तावेज़ों में समान शब्दावली को फिर से उपयोग करते हैं, तो व्यापक रूप से अनुवाद करते समय इसे सरल रखें।

असफल हुए **खंडों को देखने के लिए**, उनकी आवृत्ति और संग्रहीत **गुणवत्ता / त्रुटि संदेश**, अनुवाद कैश संपादक के **विफलताएँ** टैब का उपयोग करें ([अनुवाद कैश संपादक → विफलताएँ](#translation-cache-editor-failures))।

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### कैश व्यवहार और `translate-docs` फ्लैग

CLI SQLite में **फ़ाइल ट्रैकिंग** (प्रति फ़ाइल स्रोत हैश × स्थान) और **खंड** पंक्तियां (हैश × स्थान प्रति अनुवाद योग्य टुकड़ा) रखता है। एक सामान्य चलाने में तब फ़ाइल को पूरी तरह से छोड़ दिया जाता है जब ट्रैक किया गया हैश वर्तमान स्रोत से मेल खाता है **और** आउटपुट फ़ाइल पहले से मौजूद है; अन्यथा यह फ़ाइल को प्रोसेस करता है और अपरिवर्तित पाठ के लिए API कॉल न करने के लिए खंड कैश का उपयोग करता है।

| फ्लैग                          | प्रभाव                                                                                                                                                                                                                                                                  |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(डिफ़ॉल्ट)*                   | जब ट्रैकिंग + डिस्क पर आउटपुट मेल खाता है तो अपरिवर्तित फ़ाइलों को छोड़ दें; शेष के लिए खंड कैश का उपयोग करें।                                                                                                                                                                              |
| `-l, --locale <codes>`        | अल्पविराम से अलग किए गए लक्ष्य स्थान (जब छोड़ा गया हो, तो मूल `targetLocales` और प्रत्येक `documentations[]` ब्लॉक के वैकल्पिक `targetLocales` के संघ के बराबर होते हैं)।                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | केवल इस पथ के तहत मार्कडाउन/JSON का अनुवाद करें (प्रोजेक्ट-सापेक्ष या पूर्ण); `--file`, `--path` का एक उपनाम है।                                                                                                                                                         |
| `--dry-run`                   | कोई फ़ाइल लेखन और कोई API कॉल नहीं।                                                                                                                                                                                                                                        |
| `--type <kind>`               | `markdown` या `json` तक सीमित करें (अन्यथा कॉन्फ़िग में सक्षम होने पर दोनों)।                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | केवल JSON लेबल फ़ाइलों का अनुवाद करें, या JSON को छोड़कर केवल मार्कडाउन का अनुवाद करें।                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | अधिकतम समानांतर लक्ष्य स्थानीयकरण (कॉन्फ़िग या CLI निर्मित डिफ़ॉल्ट से डिफ़ॉल्ट)।                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | प्रति फ़ाइल अधिकतम समानांतर बैच API कॉल (दस्तावेज़; कॉन्फ़िग या CLI से डिफ़ॉल्ट)।                                                                                                                                                                                               |
| `--emphasis-placeholders`     | अनुवाद से पहले मार्कडाउन एम्फ़ेसिस मार्कर्स को प्लेसहोल्डर के रूप में मास्क करें (वैकल्पिक; डिफ़ॉल्ट बंद)।                                                                                                                                                                              |
| `--debug-failed`              | वैधीकरण विफल होने पर `FAILED-TRANSLATION` लॉग्स को `cacheDir` के तहत विस्तृत रूप से लिखें।                                                                                                                                                                                        |
| `--force-update`              | प्रत्येक मिलान फ़ाइल को पुनः प्रसंस्कृत करें (निकालें, पुनः जोड़ें, आउटपुट लिखें), भले ही फ़ाइल ट्रैकिंग छोड़ दे। **सेगमेंट कैश अभी भी लागू होता है** — अपरिवर्तित सेगमेंट LLM को नहीं भेजे जाते।                                                                                    |
| `--force`                     | प्रत्येक प्रसंस्कृत फ़ाइल के लिए फ़ाइल ट्रैकिंग साफ़ करता है और API अनुवाद के लिए सेगमेंट कैश को **नहीं पढ़ता** (पूर्ण पुनः अनुवाद)। नए परिणाम अभी भी सेगमेंट कैश में **लिखे जाते हैं**।                                                                                 |
| `--stats`                     | सेगमेंट गिनती, ट्रैक की गई फ़ाइल गिनती और प्रति-स्थानीयकरण सेगमेंट कुल मिलाकर प्रिंट करें, फिर बाहर निकलें।                                                                                                                                                                                    |
| `--clear-cache [locale]`      | कैश किए गए अनुवादों (और फ़ाइल ट्रैकिंग) को हटाएं: सभी स्थानीयकरण, या एकल स्थानीयकरण, फिर बाहर निकलें।                                                                                                                                                                             |
| `--prompt-format <mode>`      | प्रत्येक **बैच** खंडों को मॉडल को कैसे भेजा जाता है और पार्स किया जाता है (`xml`, `json-array`, या `json-object`)। डिफ़ॉल्ट `json-array`। निकासी, प्लेसहोल्डर्स, मान्यता, कैश, या फॉलबैक व्यवहार में बदलाव नहीं करता — [बैच प्रॉम्प्ट प्रारूप](#batch-prompt-format) देखें। |

आप `--force` को `--force-update` के साथ संयोजित नहीं कर सकते (वे एक दूसरे के परस्पर अनन्य हैं)।

<a id="batch-prompt-format"></a>
#### बैच प्रॉम्प्ट प्रारूप

`translate-docs` ओपनराउटर में अनुवाद योग्य खंडों को **बैच में** (`batchSize` / `maxBatchChars` द्वारा समूहित) भेजता है। `--prompt-format` झंडा केवल उस बैच के **वायर प्रारूप** को बदलता है; `PlaceholderHandler` टोकन, मार्कडाउन AST जाँच, SQLite कैश कुंजियाँ, और बैच पार्सिंग विफल होने पर प्रति-खंड फॉलबैक अपरिवर्तित रहते हैं।

| मोड                       | उपयोगकर्ता संदेश                                                           | मॉडल उत्तर                                                 |
|----------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | नकली-XML: प्रत्येक खंड के लिए एक `<seg id="N">…</seg>` (XML एस्केपिंग के साथ)। | केवल `<t id="N">…</t>` ब्लॉक, प्रत्येक खंड सूचकांक के लिए एक।       |
| `json-array` (डिफ़ॉल्ट) | स्ट्रिंग्स की एक JSON सरणी, क्रम में प्रत्येक खंड के लिए एक प्रविष्टि।               | **समान लंबाई** (समान क्रम) की एक JSON सरणी।           |
| `json-object`          | खंड सूचकांक द्वारा कुंजीबद्ध एक JSON ऑब्जेक्ट `{"0":"…","1":"…",…}`।            | **समान कुंजियों** और अनुवादित मानों वाला एक JSON ऑब्जेक्ट। |

रन हेडर में `Batch prompt format: …` भी प्रिंट होता है ताकि आप सक्रिय मोड की पुष्टि कर सकें। JSON लेबल फ़ाइलें (`jsonSource`) और स्वतंत्र SVG बैच उसी सेटिंग का उपयोग करते हैं जब वे चरण `translate-docs` के हिस्से के रूप में चलते हैं (या `sync` के डॉक्स चरण में — `sync` इस फ्लैग को उजागर नहीं करता है; यह डिफ़ॉल्ट रूप से `json-array` होता है)।

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### सेगमेंट डीडुप और SQLite में पथ

- खंड पंक्तियाँ वैश्विक रूप से `(source_hash, locale)` (हैश = सामान्यीकृत सामग्री) द्वारा कुंजीबद्ध होती हैं। दो फ़ाइलों में समान पाठ एक पंक्ति साझा करता है; `translations.filepath` मेटाडेटा है (अंतिम लेखक), फ़ाइल प्रति दूसरी कैश प्रविष्टि नहीं।
- `file_tracking.filepath` नामस्थान कुंजी का उपयोग करता है: `doc-block:{index}:{relPath}` प्रति `documentations` ब्लॉक (`relPath` परियोजना-रूट-सापेक्ष posix: markdown पथ जैसे संग्रहित; **JSON लेबल फ़ाइलें स्रोत फ़ाइल के लिए cwd-सापेक्ष पथ का उपयोग करती हैं**, जैसे `docs-site/i18n/en/code.json`, ताकि सफाई वास्तविक फ़ाइल को हल कर सके), और `svg-assets:{relPath}` स्वतंत्र SVG संपत्तियों के लिए `translate-svg` के तहत।
- `translations.filepath` markdown, JSON, और SVG खंडों के लिए cwd-सापेक्ष posix पथ संग्रहीत करता है (SVG अन्य संपत्तियों के समान पथ आकार का उपयोग करता है; `svg-assets:…` उपसर्ग **केवल** `file_tracking` पर है)।
- एक रन के बाद, `last_hit_at` केवल खंड पंक्तियों के लिए साफ किया जाता है **एक ही अनुवाद दायरे में** (`--path` और सक्षम प्रकारों का सम्मान करते हुए) जो हिट नहीं हुए, ताकि एक फ़िल्टर किया गया या दस्तावेज़-केवल रन अप्रासंगिक फ़ाइलों को पुराना न चिह्नित करे।

<a id="output-layouts"></a>
### आउटपुट लेआउट

`"nested"` (जब छोड़ दिया जाए तो डिफ़ॉल्ट) — स्रोत ट्री को `{outputDir}/{locale}/` के अंतर्गत प्रतिबिंबित करता है (उदाहरण के लिए `docs/guide.md` → `i18n/de/docs/guide.md`)।

`"docusaurus"` — `docsRoot` के अंतर्गत आने वाली फ़ाइलों को `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>` पर रखता है, जो सामान्य Docusaurus i18n लेआउट से मेल खाता है। `documentations[].markdownOutput.docsRoot` को अपने docs स्रोत रूट पर सेट करें (उदाहरण के लिए `"docs"`)।

```text
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` — अनुवादित फ़ाइलों को स्रोत के बगल में एक स्थानीयकरण उपसर्ग के साथ, या एक उपनिर्देशिका में रखता है। पृष्ठों के बीच सापेक्ष लिंक स्वचालित रूप से पुनः लिखे जाते हैं।

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-in-flat-layout"></a>
#### सपाट लेआउट में एंकर लिंक

सपाट आउटपुट प्रत्येक स्थानीयकरण के लिए पृष्ठों के बीच **सापेक्ष पथ** को फिर से लिखता है (`guide.md` → `guide.de.md`)। **एंकर लिंक** — पथ के बाद `#` के साथ मार्कडाउन इनलाइन रूप — लक्ष्य फ़ाइल के भीतर एक खंड पर जाते हैं:

```markdown
Read the [installation checklist](../setup.md#first-run) before you deploy.
```

यहाँ लिंक का लक्ष्य `setup.md` है, और `#first-run` एंकर है: यह उस फ़ाइल के भीतर सही शीर्षक पर स्क्रॉल करना चाहिए।

**एंकर लिंक को ध्यान देने की आवश्यकता क्यों है**

- `rewriteRelativeLinks` प्रत्येक स्थानीयकरण के लिए **filename** को ठीक करता है (`setup.md` → `setup.de.md`)।
- कई रेंडरर `#` स्लग को **दृश्य शीर्षक पाठ** से लेते हैं। अनुवाद के बाद, शीर्षक प्रत्येक स्थानीयकरण के अनुसार अलग-अलग होते हैं, इसलिए स्वचालित रूप से उत्पन्न स्लग बदल सकता है जबकि पुनर्लेखित लिंक अभी भी `#first-run` कह सकता है — या आपका अंग्रेजी `#…` एंकर उस स्लग से मेल नहीं खाता जो रेंडरर अनुवादित शीर्षक से बनाता है।
- परिणाम: पाठक सही **file** पर पहुंचते हैं लेकिन गलत **line** पर, या ब्राउज़र को कोई मिलता-जुलता शीर्षक नहीं मिलता।

**क्या करें**

1. अपने स्रोत `.md` / `.mdx` पर `ai-i18n-tools write-heading-ids` चलाएं, `translate-docs` से पहले (सामान्य के समान ही `documentations[]` / `contentPaths`)। यह प्रत्येक शीर्षक से पहले की पंक्ति पर स्पष्ट HTML एंकर डालता है ताकि `id` मान हर अनुवादित प्रति द्वारा साझा किया जा सके।
2. अपने मार्कडाउन **एंकर लिंक्स** को उन स्थिर आईडी की ओर इशारा करें, उदाहरण के लिए `[label](../other.md#section-id)`, जहां `section-id` उस एंकर से मेल खाता है जो टूल ने लिखा है — केवल अंग्रेजी शब्दों से अनुमान नहीं।

**उदाहरण**

`docs/overview.md`:

```markdown
See [TLS setup](../security.md#tls-configuration) for certificate steps.
```

`write-heading-ids` के बाद `docs/security.md` (सरलीकृत):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

`translate-docs` के बाद, फ़ाइल पथ और `#…` एंकर प्रत्येक स्थानीयकरण फ़ाइल में संरेखित रहते हैं, उदाहरण के लिए:

```markdown
Siehe [TLS-Einrichtung](../security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration` एंकर सभी स्थानीयकरण में समान है क्योंकि `id` स्रोत में तय है; केवल शीर्षक **पाठ** और लिंक **लेबल** अनुवादित हैं।

<a id="images-and-raster-assets-in-translated-docs"></a>
#### अनुवादित दस्तावेज़ों में छवियाँ और रास्टर संपत्ति

`translate-docs` मार्कडाउन खंडों (छवि वैकल्पिक पाठ सहित) का अनुवाद करता है। यह रास्टर फ़ाइलों (PNG, JPEG, WebP, GIF) को आपके दस्तावेज़ `outputDir` में **नहीं** कॉपी करता है। या तो फ़ाइलों को उन स्थानों पर रखें जहाँ पुनर्लेखित URL इशारा करते हैं, या अनुवाद के बाद URL को समायोजित करें (आमतौर पर `markdownOutput.postProcessing.regexAdjustments` के साथ)।

**SVG** को चित्रित संपत्ति के रूप में उपयोग करने के लिए `svg` ब्लॉक और `translate-svg` का उपयोग करें — [`svg` (वैकल्पिक)](#svg-optional) देखें। `documentations[].contentPaths` में सूचीबद्ध पथ मार्कडाउन/MDX (और वैकल्पिक JSON लेबल) के लिए हैं, स्वतंत्र SVG अनुवाद के लिए नहीं।

**फ्लैट लेआउट में अक्सर ठीक करने की आवश्यकता क्यों होती है**

`markdownOutput.style` `flat` और डिफ़ॉल्ट सापेक्ष लिंक पुनर्लेखन के साथ, अनुवादित पृष्ठों के बीच लिंकों को प्रत्येक स्थानीयकरण के अनुसार पुनर्लिखित किया जाता है। गैर-मार्कडाउन फ़ाइलों के लिए लिंक को गहराई उपसर्ग प्राप्त होता है ताकि वे प्रत्येक आउटपुट फ़ाइल के सापेक्ष बने रहें (उदाहरण के लिए स्रोत के बगल में `figure.png` `../figure.png` में अनुवादित फ़ाइल में बदल सकता है)। वह URL आमतौर पर केवल आउटपुट निर्देशिका के **अंदर** ही हल होता है। CLI वहाँ बाइनरी उत्सर्जित नहीं करता है, इसलिए पाठक तब तक एक गायब फ़ाइल से टकराते हैं जब तक आप संपत्ति की प्रतिलिपि न बना लें, उन्हें अन्यत्र सेवा प्रदान न करें, या लिंक को पुनर्लिखित न करें। अनुवाद के बाद अपने नियमों को हुक करें: `postProcessing` खंड पुनःसंयोजन और फ्लैट लिंक पुनर्लेखन के बाद चलता है ([कॉन्फ़िगरेशन संदर्भ](#configuration-reference) में `markdownOutput.postProcessing` पंक्ति देखें)।

**पैटर्न 1 — अंग्रेजी स्रोत के बगल में समान-रिपॉजिटरी संपत्ति (यह पैकेज)**

यह रिपॉजिटरी `docs/GETTING_STARTED.md` का `translated-docs/docs/GETTING_STARTED.<locale>.md` में अनुवाद करती है। स्रोत एक बगल की छवि `translation-cache-editor.png` का उपयोग करता है। फ्लैट पुनर्लेखन `translated-docs/translation-cache-editor.png` को लक्षित करेगा, जो कभी लिखा नहीं जाता। मूल `ai-i18n-tools.config.json` में एक नियम जोड़ा जाता है जो मार्कडाउन छवि के स्थिर समापन भाग (अनुवादित वैकल्पिक पाठ नहीं, बल्कि `](…)` URL खंड) से मेल खाता है और वापस `docs/` में इशारा करता है:

```json
{
  "description": "Editor screenshot: flat link rewrite points to translated-docs/; asset lives in docs/",
  "search": "\\]\\(\\.\\./translation-cache-editor\\.png\\)",
  "replace": "](../../docs/translation-cache-editor.png)"
}
```

**पैटर्न 2 — प्रति-स्थानीयकरण स्क्रीनशॉट फ़ोल्डर (`examples/nextjs-app`)**

नेक्स्ट.जेएस उदाहरण `examples/nextjs-app/ai-i18n-tools.config.json` में दो `documentations[]` ब्लॉक का उपयोग करता है।

- **Docusaurus दस्तावेज़** (`markdownOutput.style` `docusaurus`): `docs-site/docs/` के तहत अंग्रेजी पृष्ठ URL में एक निश्चित स्थानीयकरण खंड के साथ स्क्रीनशॉट का संदर्भ देते हैं, उदाहरण के लिए `/img/screenshots/en-GB/screenshot.png` `feature-showcase.md` में। पोस्ट-प्रोसेसिंग उस खंड को बदल देती है ताकि `docs-site/i18n/<locale>/…/current/` के तहत प्रत्येक अनुवादित पृष्ठ अपने स्वयं के फ़ोल्डर को हल कर सके:

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/en-GB/",
  "replace": "screenshots/${translatedLocale}/"
}
```

अपने साइट स्थिर वृक्ष के तहत मेल खाती PNG शिप करें (उदाहरण के लिए `/img/screenshots/` से शुरू होने वाले URL के लिए `docs-site/static/img/screenshots/<locale>/`)।

- **रूट README, फ्लैट आउटपुट** (उसी फ़ाइल में दूसरा `documentations[]` ब्लॉक): केवल `README.md` का अनुवाद किया जाता है, `markdownOutput.style` `flat` और `outputDir` `translated-docs` के साथ, ताकि आपको `translated-docs/README.<locale>.md` मिले। अक्सर अंग्रेज़ी छवियों में पथ के मध्य में एक स्थिर फ़ोल्डर खंड का उपयोग किया जाता है (उदाहरण के लिए `images/screenshots/en-GB/overview.png`)। पोस्ट-प्रोसेसिंग URL में `images/screenshots/` और बाकी हिस्से के बीच स्थित किसी भी एकल पथ खंड को सक्रिय `${translatedLocale}` से बदल देती है, इस प्रकार प्रत्येक अनुवादित README `images/screenshots/de/…`, `images/screenshots/fr/…` आदि की ओर इशारा करता है। यह पैटर्न डॉक्यूसॉरस नियम से भिन्न है: यहाँ `search` **किसी भी** फ़ोल्डर नाम (`[^/]+/`) से मेल खाता है, केवल `en-GB/` नहीं।

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

`images/screenshots/<locale>/` के अंतर्गत डिस्क पर PNG फ़ाइल रखें (पुनर्लेखन के बाद URL द्वारा उपयोग किए जाने वाले समान लेआउट)।

**पैटर्न 3 — स्वतंत्र SVG (`examples/nextjs-app`)**

उसी उदाहरण में `features.translateSVG` सक्षम है और स्रोत SVG को वेब ऐप सार्वजनिक फ़ोल्डर में मैप करता है:

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`public/assets/` के तहत `translate-svg` (या `sync`) चलाएँ ताकि `images/*.svg` प्रति-स्थानीयकरण आउटपुट बन जाए। मार्कडाउन अलग से `translate-docs` से उन URL का संदर्भ देता है।

**न्यूनतम केवल-README उदाहरण (`examples/console-app`)**

`examples/console-app/ai-i18n-tools.config.json` केवल `postProcessing.languageListBlock` के साथ `README.md` का `translated-docs/` में अनुवाद करता है। यह कोई छवि नियम परिभाषित नहीं करता है — जब README में कोई बगल की रास्टर फ़ाइल न हो या केवल निरपेक्ष URL का उपयोग करता हो जिसे आपकी होस्ट पहले से ही सेवा प्रदान करती है, तो यह उपयुक्त है।

प्रतिस्थापन टेम्पलेट `${translatedLocale}` और `${translatedBasedir}` जैसे स्थानधारक का समर्थन करते हैं (पूरी सूची [कॉन्फ़िगरेशन संदर्भ](#configuration-reference) में `markdownOutput.postProcessing.regexAdjustments` पंक्ति में देखें)।

<a id="markdown-output-path-template-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` प्लेसहोल्डर

अनुवादित फ़ाइलों को कहाँ लिखा जाए इसे सेट करके अधिलेखित करें `documentations[].markdownOutput.pathTemplate` (मार्कडाउन और MDX) या `jsonPathTemplate` (JSON लेबल फ़ाइलें)। दोनों समान प्लेसहोल्डर स्वीकार करते हैं। हल किए गए पथ को उस ब्लॉक के `outputDir` के भीतर रहना चाहिए (CLI उससे बाहर निकलने वाले पथ को अस्वीकार करता है)।

यदि आप एक कस्टम `pathTemplate` का उपयोग करते हैं, तो जब तक आप इसे स्पष्ट रूप से सेट नहीं करते, `rewriteRelativeLinks` डिफ़ॉल्ट रूप से `false` होता है — सपाट-शैली लिंक पुनःलेखन बिल्ट-इन `flat` लेआउट के लिए बनाई गई है।

| प्लेसहोल्डर | भूमिका | उदाहरण |
|-------------|------|---------|
| `{outputDir}` | इस दस्तावेज़ीकरण ब्लॉक के `outputDir` का पूर्ण हल किया गया पथ | `/home/acme/repo/i18n` |
| `{locale}` | लक्ष्य स्थानीयकरण कोड (कॉन्फ़िग / CLI में उसी रूप में) | `de`, `pt-BR` |
| `{LOCALE}` | समान स्थानीयकरण ऊपरी केस में | `DE`, `PT-BR` |
| `{relPath}` | प्रोजेक्ट रूट के सापेक्ष स्रोत फ़ाइल पथ, POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | फ़ाइल नाम **बिना** एक्सटेंशन के | `guide` के लिए `docs/guide.md` |
| `{basename}` | फ़ाइल का नाम **सहित** एक्सटेंशन | `guide.md` |
| `{extension}` | डॉट **समेत** एक्सटेंशन | `.md`, `.mdx` |
| `{docsRoot}` | `markdownOutput.docsRoot` का पूर्ण हल किया गया पथ (अगर छोड़ा गया हो तो डिफ़ॉल्ट `docs`) | `/home/acme/repo/docs` |
| `{relativeToDocsRoot}` | जब पथ स्ट्रिंग्स मेल खाते हैं तो `docsRoot` उपसर्ग के साथ मिलान करके `{relPath}` से हटाया गया (POSIX); अन्यथा अपरिवर्तित | `docs/guide.md` (सामान्य); केवल जब हटाना लागू होता है तो `guide.md` |

**उदाहरण**

कॉन्फ़िग स्निपेट:

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

लोकेल `de` और स्रोत `docs/guide.md` के लिए, प्रोजेक्ट रूट `/home/acme/repo` के साथ और `outputDir` का हल होना `/home/acme/repo/i18n`, विस्तारित पथ है:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

`flat`-शैली का पैटर्न जो केवल फ़ाइल नाम रखता है, वह `{stem}` और `{extension}` का उपयोग कर सकता है, उदाहरण के लिए `{outputDir}/{stem}.{locale}{extension}`, जो हल किए गए `outputDir` के तहत `…/guide.de.md` देता है।

---

<a id="combined-workflow-ui--docs"></a>
## संयुक्त कार्यप्रवाह (UI + दस्तावेज़)

एक ही कॉन्फ़िग में सभी सुविधाओं को सक्षम करें ताकि दोनों कार्यप्रवाह एक साथ चल सकें:

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

`glossary.uiGlossary` दस्तावेज़ अनुवाद को UI के समान `strings.json` कैटलॉग पर इंगित करता है ताकि शब्दावली सुसंगत रहे; `glossary.userGlossary` उत्पाद शब्दों के लिए CSV ओवरराइड जोड़ता है।

`npx ai-i18n-tools sync` चलाएँ ताकि एक पाइपलाइन चले: **UI स्ट्रिंग्स निकालें** (यदि `features.extractUIStrings`), **UI स्ट्रिंग्स का अनुवाद करें** (यदि `features.translateUIStrings`), **स्वतंत्र SVG संपत्तियों का अनुवाद करें** (यदि `features.translateSVG` और `svg` ब्लॉक सेट है), फिर **दस्तावेज़ीकरण का अनुवाद करें** (प्रत्येक `documentations` ब्लॉक: मार्कडाउन/JSON को कॉन्फ़िगर किए अनुसार)। `--no-ui`, `--no-svg`, या `--no-docs` के साथ भागों को छोड़ें। docs चरण `--dry-run`, `-p` / `--path`, `--force`, और `--force-update` स्वीकार करता है (अंतिम दो केवल तभी लागू होते हैं जब दस्तावेज़ीकरण अनुवाद चलता है; यदि आप `--no-docs` पास करते हैं तो उन्हें अनदेखा कर दिया जाता है)।

एक ब्लॉक पर `documentations[].targetLocales` का उपयोग करें ताकि उस ब्लॉक की फ़ाइलों का UI की तुलना में **छोटे उपसमुच्चय** में अनुवाद किया जा सके (प्रभावी दस्तावेज़ीकरण लोकेल ब्लॉकों में **संघ** हैं):

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

<a id="mixed-documentation-workflow-docusaurus--flat"></a>
### मिश्रित दस्तावेज़ीकरण कार्यप्रवाह (Docusaurus + फ्लैट)

आप `documentations` में एक से अधिक प्रविष्टि जोड़कर एक ही कॉन्फ़िग में कई दस्तावेज़ीकरण पाइपलाइनों को संयोजित कर सकते हैं। जब किसी प्रोजेक्ट में Docusaurus साइट के साथ-साथ रूट-स्तर की मार्कडाउन फ़ाइलें हों (उदाहरण के लिए, एक रिपॉजिटरी रीडमी) जिन्हें फ्लैट आउटपुट के साथ अनुवादित किया जाना चाहिए, तो यह एक सामान्य सेटअप है।

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
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

`npx ai-i18n-tools sync` के साथ यह कैसे चलता है:

- UI स्ट्रिंग्स `src/` से `public/locales/` में निकाली/अनुवादित की जाती हैं।
- पहला docs ब्लॉक मार्कडाउन और JSON लेबल का Docusaurus `i18n/<locale>/...` लेआउट में अनुवाद करता है।
- दूसरा docs ब्लॉक `README.md` का `translated-docs/` के अंतर्गत लोकेल-सफ़िक्स वाली फ्लैट फ़ाइलों में अनुवाद करता है।
- सभी docs ब्लॉक `cacheDir` को साझा करते हैं, इसलिए अपरिवर्तित सेगमेंट रन के दौरान पुनः उपयोग किए जाते हैं ताकि API कॉल और लागत कम हो सके।

---

<a id="translation-cache-editor"></a>
## अनुवाद कैश संपादक

चलाएँ:

```bash
ai-i18n-tools editor
# Optional: choose port, do not auto-open browser
# ai-i18n-tools editor -p 8765 --no-open
```

यह आपके कॉन्फ़िगर किए गए **`cacheDir`** SQLite डेटाबेस द्वारा समर्थित एक स्थानीय वेब UI शुरू करता है—वही फ़ोल्डर जिसका CLI दस्तावेज़ खंडों, लॉग और संबंधित मेटाडेटा के लिए उपयोग करता है। इसमें टैब **दस्तावेज़ीकरण** (कैश किए गए दस्तावेज़ खंड), **UI स्ट्रिंग्स**, **UI बहुवचन**, **शब्दावली**, **विफलताएँ**, और **आँकड़े** शामिल हैं।

![Translation Cache Editor](../../docs/translation-cache-editor.png)

यदि आप इस ऐप में **कैश पंक्तियों** को संपादित करते हैं (उदाहरण के लिए दस्तावेज़ीकरण खंड), तो `sync --force-update` या `--force-update` के साथ समकक्ष अनुवाद कमांड चलाएँ ताकि डिस्क पर आउटपुट कैश से मेल खाए; यदि बाद में रिपोजिटरी में **स्रोत पाठ** बदल जाता है, तो खंड हैश बदल जाते हैं और पुराने पाठ के लिए मैन्युअल संपादन अप्रचलित हो जाते हैं।

<a id="translation-cache-editor-failures"></a>
### विफलताएँ (दस्तावेज़ अनुवाद)

**विफलताएँ** टैब केवल **दस्तावेज़ीकरण** अनुवाद के लिए है। यह उन विफलता रिकॉर्ड को पढ़ता है जो SQLite में लिखे गए होते हैं जब किसी खंड का किसी भाषा-स्थान (लोकेल) के लिए सफलतापूर्वक अनुवाद नहीं किया जा सका हो—उदाहरण के लिए खाली या अमान्य मॉडल आउटपुट, अनुवाद के बाद की वैधता जांच में त्रुटियाँ (`AST mismatch`, प्लेसहोल्डर लीक, और इसी तरह की **गुणवत्ता** जांच), या कोई **घातक** स्थिति जिसने प्रगति को रोक दिया। यह आपकी इस प्रश्न का उत्तर देने में मदद करता है: *कौन सा स्रोत खंड विफल रहा, किस लोकेल और मॉडल के लिए, और कौन सा त्रुटि पाठ दर्ज किया गया?*

<a id="when-to-use-it"></a>
#### इसका उपयोग कब करें

- `translate-docs` या `sync` के त्रुटियों के साथ, आंशिक स्थानीयकरणों या भ्रमित करने वाले लॉग के साथ समाप्त होने के बाद—आप केवल टर्मिनल आउटपुट को स्क्रॉल करने के बजाय विफलताओं को क्रमबद्ध और फ़िल्टर कर सकते हैं।
- जब आप **पुनः कार्य को प्राथमिकता** देना चाहते हैं: **# विफलताओं** द्वारा क्रमबद्ध करें ताकि पुनः प्रयास के दौरान बार-बार विफल रहे सेगमेंट सबसे पहले दिखाई दें; वे स्रोत मार्कडाउन में **सरल या पुनः स्वरूपित** करने के लिए मजबूत उम्मीदवार हैं ताकि भविष्य के रन सफल हो सकें।
- जब आपको **सटीक सेगमेंट**—फ़ाइलपाथ, पंक्ति संकेत, स्रोत हैश और पूरा स्रोत पाठ—की आवश्यकता होती है ताकि आप अपने रिपो में सही पैराग्राफ संपादित कर सकें।

<a id="why-source-edits-matter"></a>
#### स्रोत संपादन का महत्व क्यों है

घने इनलाइन मार्कअप (**बोल्ड** के साथ `` `code` `` का मिश्रण, नेस्टेड जोर, कई स्पैन वाले लंबे वाक्य) मॉडल के लिए संरचनात्मक जांच पास करने वाले अनुवाद लौटाना कठिन बना देते हैं। **कई बार दर्ज विफलताओं वाले खंडों** में अपरिवर्तित पाठ पर पुनः अनुवाद चलाने की तुलना में स्रोत को **पुनः लिखने या विभाजित** करने (या उदाहरणों को फेंस्ड कोड ब्लॉक में स्थानांतरित करने) से अधिक सुधार होता है। यह [जटिल मार्कडाउन और विफल गुणवत्ता जांच](#complex-markdown-and-failed-quality-checks) के अनुरूप है।

<a id="how-to-use-the-tab"></a>
#### टैब का उपयोग कैसे करें

1. संपादक में **विफलताएँ** खोलें ([अनुवाद कैश संपादक](#translation-cache-editor) के समान ब्राउज़र सत्र में)।
2. **सारांश** पट्टी पढ़ें (किसी भी विफलता वाले खंड, साथ ही **1**, **2**, या **3+** विफलता रिकॉर्ड वाले खंडों की संख्या)।
3. आंशिक **फ़ाइलनाम**, **लोकेल**, **मॉडल**, **गुणवत्ता त्रुटि** (मान आपके कैश से आते हैं), केवल **घातक**, और वैकल्पिक **स्रोत हैश**, **स्रोत पाठ**, या **त्रुटि संदेश** उपस्ट्रिंग द्वारा फ़िल्टर करें—फिर **लागू करें** पर क्लिक करें।
4. **# विफलताएँ** (डिफ़ॉल्ट) या **फ़ाइलपथ + पंक्ति संख्या** के अनुसार छाँटना चुनें।
5. तालिका के ऊपर या नीचे पृष्ठांकन का उपयोग करें। पूरा स्रोत पाठ टॉगल करने के लिए **एक पंक्ति पर क्लिक करें**। पंक्ति में लिंक नियंत्रण (जब सक्षम हो) सर्वर प्रक्रिया से `ai-i18n-tools editor` चल रहे **टर्मिनल** में फ़ाइल/पंक्ति संकेत लॉग करने का अनुरोध करता है—ब्राउज़र से अपने संपादक पर जाने के लिए उपयोगी।  
6. अपनी परियोजना में **स्रोत फ़ाइल** ठीक करें, फिर `translate-docs` या `sync` को पुनः चलाएँ। यदि सफलतापूर्वक चलने के बाद सूची **पुरानी** लगती है, तो `ai-i18n-tools sync --force-update` चलाएँ और संपादक को पुनः लोड करें (विफलता पैनल उसी संकेत को दिखाता है)।

यूआई के साथ फ़ाइल-आधारित डिबगिंग के लिए, आप अभी भी पुनः प्रयास के दौरान `translate-docs --debug-failed` का उपयोग करके `cacheDir` के तहत `FAILED-TRANSLATION` विवरण लिख सकते हैं—[कैश व्यवहार और `translate-docs` झंडे](#cache-behaviour-and-translate-docs-flags) देखें।

---

<a id="configuration-reference"></a>
## विन्यास संदर्भ

<a id="sourcelocale"></a>
### `sourceLocale`

स्रोत भाषा के लिए BCP-47 कोड (उदाहरण के लिए `"en-GB"`, `"en"`, `"pt-BR"`)। इस लोकेल के लिए कोई अनुवाद फ़ाइल उत्पन्न नहीं की जाती है — कुंजी स्ट्रिंग स्वयं स्रोत पाठ है।

**आपकी रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) से निर्यात किए गए `SOURCE_LOCALE` से मेल खाना चाहिए**।

<a id="targetlocales"></a>
### `targetLocales`

अनुवाद करने के लिए BCP-47 स्थानीयकरण कोड्स की सरणी (उदाहरण के लिए `["de", "fr", "es", "pt-BR"]`)।

`targetLocales` UI अनुवाद के लिए प्राथमिक स्थानीयकरण सूची है और दस्तावेज़ीकरण ब्लॉक्स के लिए डिफ़ॉल्ट स्थानीयकरण सूची है। `sourceLocale` + `targetLocales` से `ui-languages.json` मैनिफेस्ट बनाने के लिए `generate-ui-languages` का उपयोग करें।

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (वैकल्पिक)

प्रदर्शन नामों, स्थानीयकरण फ़िल्टरिंग और भाषा-सूची पश्च-प्रसंस्करण के लिए उपयोग किए जाने वाले `ui-languages.json` मैनिफेस्ट का पथ। जब छोड़ दिया जाता है, तो CLI `ui.flatOutputDir/ui-languages.json` पर मैनिफेस्ट की तलाश करता है।

इसका उपयोग तब करें जब:

- मैनिफेस्ट `ui.flatOutputDir` के बाहर स्थित है और आपको CLI को स्पष्ट रूप से इंगित करने की आवश्यकता है।
- आप चाहते हैं कि `markdownOutput.postProcessing.languageListBlock` मैनिफेस्ट से स्थानीयकरण लेबल बनाएं।
- `extract` मैनिफेस्ट से `englishName` प्रविष्टियों को `strings.json` में मर्ज करना चाहिए (`ui.reactExtractor.includeUiLanguageEnglishNames: true` की आवश्यकता होती है)।

<a id="concurrency-optional"></a>
### `concurrency` (वैकल्पिक)

अधिकतम **लक्ष्य स्थानीयकरण** जो एक साथ अनुवादित किए जाते हैं (`translate-ui`, `translate-docs`, `translate-svg`, और `sync` के भीतर मिलान वाले चरण)। यदि छोड़ दिया जाता है, तो CLI UI अनुवाद के लिए **4** और दस्तावेज़ीकरण अनुवाद के लिए **3** का उपयोग करता है (अंतर्निहित डिफ़ॉल्ट)। प्रत्येक रन के लिए `-j` / `--concurrency` के साथ अधिरोपित करें।

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (वैकल्पिक)

**translate-docs** और **translate-svg** (और `sync` का दस्तावेज़ीकरण चरण): प्रति फ़ाइल अधिकतम समानांतर OpenRouter **बैच** अनुरोध (प्रत्येक बैच में कई खंड हो सकते हैं)। छोड़ने पर डिफ़ॉल्ट **4**। `translate-ui` द्वारा अनदेखा। `-b` / `--batch-concurrency` के साथ अधिरोपित करें। `sync` पर, `-b` केवल दस्तावेज़ीकरण अनुवाद चरण पर लागू होता है।

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (वैकल्पिक)

दस्तावेज़ अनुवाद के लिए खंड बैचिंग: प्रति API अनुरोध कितने खंड, और अक्षर सीमा। डिफ़ॉल्ट: **20** खंड, **4096** अक्षर (जब छोड़ दिया जाता है)।

<a id="openrouter"></a>
### `openrouter`

| फ़ील्ड               | विवरण                                                                                                                                                                                                      |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `baseUrl`           | OpenRouter API बेस URL। डिफ़ॉल्ट: `https://openrouter.ai/api/v1`।                                                                                                                                                |
| `translationModels` | मॉडल ID की प्राथमिकता वाली क्रमबद्ध सूची। पहले प्रयास के लिए पहले मॉडल का उपयोग किया जाता है; त्रुटि पर बाद के विकल्प के रूप में उपयोग किया जाता है। केवल `translate-ui` के लिए, आप `ui.preferredModel` सेट कर सकते हैं ताकि इस सूची से पहले एक मॉडल का प्रयास किया जा सके (देखें `ui`)। |
| `defaultModel`      | पुराना एकल प्राथमिक मॉडल। केवल तभी उपयोग किया जाता है जब `translationModels` सेट नहीं है या खाली है।                                                                                                                               |
| `fallbackModel`     | पुराना एकल फॉलबैक मॉडल। `defaultModel` के बाद उपयोग किया जाता है जब `translationModels` सेट नहीं है या खाली है।                                                                                                              |
| `maxTokens`         | प्रति अनुरोध अधिकतम पूर्ति टोकन। डिफ़ॉल्ट: `8192`।                                                                                                                                                              |
| `temperature`       | नमूनाकरण तापमान। डिफ़ॉल्ट: `0.2`।                                                                                                                                                                            |
| `requestTimeoutMs` | OpenRouter (चैट पूर्ति और आंतरिक `GET /models` कॉल) के लिए प्रत्येक HTTP अनुरोध की प्रतीक्षा करने का अधिकतम समय मिलीसेकंड में। डिफ़ॉल्ट: `30000` (30 सेकंड)। |

**एकाधिक मॉडल का उपयोग क्यों करें:** विभिन्न प्रदाता और मॉडलों की लागत भिन्न होती है और भाषाओं और स्थानीयकरण के आधार पर गुणवत्ता के अलग-अलग स्तर प्रदान करते हैं। `openrouter.translationModels` को **एक क्रमबद्ध फॉलबैक श्रृंखला** के रूप में कॉन्फ़िगर करें (एकल मॉडल के बजाय), ताकि CLI अनुरोध विफल होने पर अगले मॉडल का प्रयास कर सके।

नीचे दी गई सूची को एक **आधारभूत रूपरेखा** के रूप में देखें जिसे आप विस्तारित कर सकते हैं: यदि किसी विशिष्ट स्थानीयकरण के लिए अनुवाद खराब या असफल है, तो अनुसंधान करें कि कौन से मॉडल उस भाषा या लिपि का प्रभावी ढंग से समर्थन करते हैं (ऑनलाइन संसाधनों या आपके प्रदाता के दस्तावेज़ीकरण को देखें), और उन OpenRouter ID को आगे के विकल्प के रूप में जोड़ें।

इस सूची का **व्यापक स्थानीयकरण कवरेज के लिए परीक्षण किया गया था** (उदाहरण के लिए, एक बड़ी प्रलेखन परियोजना में **अप्रैल 2026** में **36** लक्ष्य स्थानीयकरणों का अनुवाद करते समय); यह एक व्यावहारिक डिफ़ॉल्ट के रूप में कार्य करती है, लेकिन यह गारंटी नहीं दी जाती कि यह हर स्थानीयकरण के लिए अच्छा प्रदर्शन करेगी।

उदाहरण `translationModels` (`npx ai-i18n-tools init` के समान डिफ़ॉल्ट):

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
]
```

अपने वातावरण में या `.env` फ़ाइल में `OPENROUTER_API_KEY` सेट करें।

`translationModels` में बदलाव करने से पहले, OpenRouter के लाइव कैटलॉग (`GET /models`) के खिलाफ प्रत्येक कॉन्फ़िगर किए गए मॉडल आईडी को सत्यापित करने के लिए `npx ai-i18n-tools check-models` चलाएं। यह उन आईडी की रिपोर्ट करता है जो लापता हैं या `expiration_date` समय सीमा पार कर चुके हैं, मान्य मॉडल्स की सूची देता है जिनके लिए अनुमानित इनपुट/आउटपुट मूल्य निर्धारण (1M टोकन प्रति USD) है, और किसी भी कॉन्फ़िगर की गई आईडी के अमान्य होने पर गैर-शून्य स्थिति के साथ बाहर आ जाता है। `OPENROUTER_API_KEY` की आवश्यकता होती है।

<a id="features"></a>
### `features`

| फ़ील्ड                | कार्यप्रवाह | विवरण                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | `t("…")` / `i18n.t("…")` के लिए स्रोत को स्कैन करें, वैकल्पिक `package.json` विवरण और (यदि सक्षम हो तो) `ui-languages.json` `englishName` मानों को `strings.json` में मर्ज करें। |
| `translateUIStrings` | 1        | `strings.json` प्रविष्टियों का अनुवाद करें और प्रति-स्थानीयकरण JSON फ़ाइलें लिखें।                                                                                                  |
| `translateMarkdown`  | 2        | `.md` / `.mdx` फ़ाइलों का अनुवाद करें।                                                                                                                                    |
| `translateJSON`      | 2        | डॉक्यूसॉरस JSON लेबल फ़ाइलों का अनुवाद करें।                                                                                                                             |
| `translateSVG`       | 2        | स्टैंडअलोन `.svg` एसेट्स का अनुवाद करें (शीर्ष-स्तरीय `svg` ब्लॉक की आवश्यकता होती है)।                                                                                         |

**स्वतंत्र** SVG संपत्तियों का `translate-svg` के साथ अनुवाद करें जब `features.translateSVG` सत्य हो और एक शीर्ष-स्तरीय `svg` ब्लॉक कॉन्फ़िगर किया गया हो। दोनों सेट होने पर `sync` कमांड उस चरण को चलाता है (जब तक `--no-svg` न हो)।

<a id="ui"></a>
### `ui`

| फ़ील्ड                                          | विवरण                                                                                                                                                                                                                                                        |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourceRoots`                                  | निर्देशिकाएँ (cwd के सापेक्ष) जिन्हें `t("…")` कॉल के लिए स्कैन किया जाता है।                                                                                                                                                                                                          |
| `stringsJson`                                  | मास्टर कैटलॉग फ़ाइल का मार्ग। `extract` द्वारा अपडेट किया जाता है।                                                                                                                                                                                                             |
| `flatOutputDir`                                | वह निर्देशिका जहाँ प्रति-स्थानीयकरण JSON फ़ाइलें लिखी जाती हैं (`de.json`, आदि)।                                                                                                                                                                                               |
| `preferredModel`                               | वैकल्पिक। केवल `translate-ui` के लिए पहले आज़माया गया OpenRouter मॉडल आईडी; फिर इस आईडी को दोहराए बिना क्रम में `openrouter.translationModels` (या पुराने मॉडल)।                                                                                                   |
| `reactExtractor.funcNames`                     | अतिरिक्त फ़ंक्शन नाम जिन्हें स्कैन किया जाएगा (डिफ़ॉल्ट: `["t", "i18n.t"]`)।                                                                                                                                                                                                    |
| `reactExtractor.extensions`                    | शामिल करने के लिए फ़ाइल एक्सटेंशन (डिफ़ॉल्ट: `[".js", ".jsx", ".ts", ".tsx"]`)।                                                                                                                                                                                            |
| `reactExtractor.includePackageDescription`     | जब `true` (डिफ़ॉल्ट), उपस्थित होने पर `extract` UI स्ट्रिंग के रूप में `package.json` `description` भी शामिल करता है।                                                                                                                                                           |
| `reactExtractor.packageJsonPath`               | वैकल्पिक विवरण निष्कर्षण के लिए उपयोग की जाने वाली `package.json` फ़ाइल के लिए कस्टम पथ।                                                                                                                                                                              |
| `reactExtractor.includeUiLanguageEnglishNames` | जब `true` (डिफ़ॉल्ट `false`), तो `extract` स्रोत स्कैन से पहले से मौजूद नहीं होने पर मैनिफेस्ट में `uiLanguagesPath` पर प्रत्येक `englishName` को `strings.json` में जोड़ता है (समान हैश कुंजियाँ)। एक वैध `ui-languages.json` की ओर `uiLanguagesPath` की आवश्यकता होती है। |

<a id="cachedir"></a>
### `cacheDir`

| फ़ील्ड      | विवरण                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite कैश डायरेक्टरी (सभी `documentations` ब्लॉक द्वारा साझा की गई)। चलने के बीच पुनः उपयोग। यदि आप कस्टम दस्तावेज़ अनुवाद कैश से माइग्रेट कर रहे हैं, तो इसे संग्रहीत या हटा दें — `cacheDir` अपना स्वयं का SQLite डेटाबेस बनाता है और अन्य स्कीमा के साथ संगत नहीं है। |

VCS बहिष्करण के लिए सर्वोत्तम प्रथा:

- पारगमनीय कैश आर्टिफैक्ट्स को प्रतिबद्ध करने से बचने के लिए अनुवाद कैश फ़ोल्डर की सामग्री को बाहर रखें (उदाहरण के लिए `.gitignore` या `.git/info/exclude` के माध्यम से)।
- `cache.db` को उपलब्ध रखें (इसे नियमित रूप से हटाएं नहीं), क्योंकि SQLite कैश को बरकरार रखने से अपरिवर्तित खंडों का पुनः अनुवाद रोका जाता है, जो `ai-i18n-tools` का उपयोग करने वाले सॉफ़्टवेयर को बदलते या अपग्रेड करते समय रनटाइम और API लागत दोनों बचाता है।

उदाहरण:

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

<a id="documentations"></a>
### `documentations`

दस्तावेज़ीकरण पाइपलाइन ब्लॉक का एक ऐरे। `translate-docs` और `sync` का दस्तावेज़ चरण **प्रत्येक** ब्लॉक को क्रम में प्रोसेस करता है।

| फ़ील्ड                                             | विवरण                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `description`                                     | इस ब्लॉक के लिए वैकल्पिक मानव-पठनीय नोट (अनुवाद के लिए उपयोग नहीं किया जाता)। जब सेट किया जाता है, तो इसे `translate-docs` `🌐` हेडलाइन में उपसर्ग के रूप में जोड़ा जाता है; `status` अनुभाग के हेडर में भी दिखाया जाता है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `contentPaths`                                    | अनुवाद के लिए मार्कडाउन/MDX स्रोत (`translate-docs` इन्हें `.md` / `.mdx` के लिए स्कैन करता है)। जेसन लेबल इसी ब्लॉक पर `jsonSource` से आते हैं।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `outputDir`                                       | इस ब्लॉक के लिए अनुवादित आउटपुट की रूट निर्देशिका।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sourceFiles`                                     | लोड होते समय `contentPaths` में मर्ज किया जाने वाला वैकल्पिक उपनाम।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `targetLocales`                                   | केवल इस ब्लॉक के लिए स्थानीयकरण का वैकल्पिक उपसमुच्चय (अन्यथा मूल `targetLocales`)। प्रभावी दस्तावेज़ीकरण स्थानीयकरण ब्लॉक्स में संघ हैं।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `jsonSource`                                      | इस ब्लॉक के लिए डॉक्यूसॉरस JSON लेबल फ़ाइलों की स्रोत निर्देशिका (उदाहरण के लिए `"i18n/en"`)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.style`                            | `"nested"` (डिफ़ॉल्ट), `"docusaurus"`, या `"flat"`।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.docsRoot`                         | डॉक्यूसॉरस लेआउट के लिए स्रोत डॉक्स मूल (उदाहरण के लिए `"docs"`)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `markdownOutput.pathTemplate`                     | कस्टम मार्कडाउन आउटपुट पथ। स्थान धारक: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>।                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.jsonPathTemplate`                 | लेबल फ़ाइलों के लिए कस्टम JSON आउटपुट पथ। `pathTemplate` के समान स्थान धारक का समर्थन करता है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `markdownOutput.flatPreserveRelativeDir`          | `flat` शैली के लिए, स्रोत उपडायरेक्टरियों को बरकरार रखें ताकि समान बेसनेम वाली फ़ाइलें टकराएं नहीं।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `markdownOutput.rewriteRelativeLinks`             | अनुवाद के बाद सापेक्ष लिंक्स को पुनः लिखें (`flat` शैली के लिए स्वचालित रूप से सक्षम)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `markdownOutput.linkRewriteDocsRoot`              | सपाट-लिंक पुनर्लेखन उपसर्ग की गणना करते समय उपयोग किया जाने वाला रिपो रूट। आमतौर पर इसे `"."` के रूप में छोड़ दें, जब तक कि आपकी अनुवादित दस्तावेज़ एक अलग प्रोजेक्ट रूट के तहत न हों।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `markdownOutput.postProcessing`                | अनुवादित **मार्कडाउन बॉडी** पर वैकल्पिक ट्रांसफ़ॉर्म (YAML फ्रंट मैटर संरक्षित रहता है)। खंड पुनर्मिलन और फ्लैट लिंक पुनर्लेखन के बाद, और `addFrontmatter` से पहले चलता है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `segmentSplitting`                             | `markdownOutput` के समान स्तर पर (`documentations[]` ब्लॉक के अनुसार)। `translate-docs` निकासी के लिए वैकल्पिक सूक्ष्म खंड: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`। जब `enabled` `true` होता है (`segmentSplitting` छोड़े जाने पर डिफ़ॉल्ट), घने पैराग्राफ़, GFM पाइप टेबल (पहला चंक हैडर, सेपरेटर और पहली डेटा पंक्ति शामिल करता है), और लंबी सूचियाँ विभाजित होती हैं; उप-भाग एकल न्यूलाइन (`tightJoinPrevious`) के साथ पुनः जुड़ते हैं। केवल एक खाली पंक्ति से अलग किए गए बॉडी ब्लॉक के लिए एक खंड का उपयोग करने के लिए `"enabled": false` सेट करें। |
| `markdownOutput.postProcessing.regexAdjustments`  | `{ "description"?, "search", "replace" }` की क्रमबद्ध सूची। `search` एक रेगेक्स पैटर्न है (सादे स्ट्रिंग के लिए फ्लैग `g`, या `/pattern/flags` का उपयोग करें)। `replace` में `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` जैसे प्लेसहोल्डर का समर्थन करता है।                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator", "label" }` — अनुवादक `start` युक्त पहली पंक्ति और संगत `end` पंक्ति खोजता है, फिर उस स्लाइस को एक मानक भाषा स्विचर से बदल देता है। `label` मैनिफेस्ट लेबल स्रोत को नियंत्रित करता है: `"local"` (डिफ़ॉल्ट, `ui-languages.json` `label` का उपयोग करता है) या `"english"` (`englishName` का उपयोग करता है)। लिंक अनुवादित फ़ाइल के सापेक्ष पथ के साथ बनाए जाते हैं; जब कोई मैनिफेस्ट कॉन्फ़िगर नहीं किया गया होता, तो लेबल `localeDisplayNames` और स्थानीयकरण कोड से आते हैं। |
| `addFrontmatter`                                  | जब `true` (छोड़े जाने पर डिफ़ॉल्ट), अनुवादित मार्कडाउन फ़ाइलों में YAML कुंजियां शामिल होती हैं: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, और जब कम से कम एक खंड में मॉडल मेटाडेटा होता है, तो `translation_models` (उपयोग किए गए OpenRouter मॉडल आईडी की क्रमबद्ध सूची)। छोड़ने के लिए `false` पर सेट करें।                                                                                                                                                                                                                                                                                                                           |

उदाहरण (फ्लैट README पाइपलाइन — स्क्रीनशॉट पथ + वैकल्पिक भाषा सूची रैपर):

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
      "separator": " · ",
      "label": "local"
    }
  }
}
```

<a id="svg-optional"></a>
### `svg` (वैकल्पिक)

स्टैंडअलोन SVG एसेट्स के लिए शीर्ष-स्तरीय पथ और लेआउट। अनुवाद केवल तभी चलता है जब `features.translateSVG` सत्य होता है (`translate-svg` के माध्यम से या `sync` के SVG चरण में)।

| क्षेत्र                         | विवरण                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | `.svg` फ़ाइलों के लिए पुनरावर्ती रूप से स्कैन की जाने वाली एक निर्देशिका या निर्देशिकाओं की सरणी।                                                                                                                                                                                                     |
| `outputDir`                   | अनुवादित SVG आउटपुट के लिए रूट निर्देशिका।                                                                                                                                                                                                                                          |
| `style`                       | जब `pathTemplate` सेट नहीं है तो `"flat"` या `"nested"`।                                                                                                                                                                                                                               |
| `pathTemplate`                | अनुकूलित SVG आउटपुट पथ। स्थान धारक: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>। |
| `svgExtractor.forceLowercase` | SVG पुनः असेंबली पर लोअर-केस अनुवादित पाठ। उन डिज़ाइनों के लिए उपयोगी है जो सभी लोअर-केस लेबल पर निर्भर करते हैं।                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| क्षेत्र          | विवरण                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | मौजूदा अनुवादों से स्वचालित रूप से एक शब्दावली बनाने के लिए `strings.json` का पथ।                                                                                                 |
| `userGlossary` | `Original language string` (या `en`), `locale`, `Translation` के साथ एक CSV का पथ - प्रत्येक स्रोत शब्द और लक्ष्य स्थानीयकरण के लिए एक पंक्ति (`locale` सभी लक्ष्यों के लिए `*` हो सकता है)। |

पुरानी कुंजी `uiGlossaryFromStringsJson` को अभी भी स्वीकार किया जाता है और कॉन्फ़िग लोड करते समय `uiGlossary` पर मैप किया जाता है।

एक खाली शब्दावली CSV उत्पन्न करें:

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI संदर्भ

| कमांड                                                                    | विवरण                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                   | CLI संस्करण और बिल्ड टाइमस्टैम्प प्रिंट करें (मूल प्रोग्राम पर `-V` / `--version` के समान जानकारी)।
| `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]`  | एक प्रारंभिक विन्यास फ़ाइल लिखें (इसमें `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, और `documentations[].addFrontmatter` शामिल हैं)। `--with-translate-ignore` एक प्रारंभिक `.translate-ignore` बनाता है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `check-models` | प्रत्येक कॉन्फ़िगर की गई OpenRouter मॉडल आईडी को `GET /models` के खिलाफ सत्यापित करें (कैटलॉग सदस्यता, `expiration_date`, प्रॉम्प्ट/पूर्ति के लिए 1M टोकन प्रति USD)। `OPENROUTER_API_KEY` की आवश्यकता होती है। यदि कोई भी कॉन्फ़िगर की गई आईडी लापता या समाप्त हो चुकी है तो गैर-शून्य स्थिति में बाहर आता है। कैटलॉग अनुरोध के लिए `openrouter.requestTimeoutMs` का पालन करता है। |
| `extract`                                                                   | `strings.json` को `t("…")` / `i18n.t("…")` लिटरल्स, वैकल्पिक `package.json` विवरण और वैकल्पिक मैनिफेस्ट `englishName` प्रविष्टियों से अद्यतन करें (देखें `ui.reactExtractor`)। `features.extractUIStrings` की आवश्यकता होती है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `generate-ui-languages [--master <path>] [--dry-run]`                       | `ui-languages.json` को `ui.flatOutputDir` (या सेट होने पर `uiLanguagesPath`) में `sourceLocale` + `targetLocales` और बंडल किए गए `data/ui-languages-complete.json` (या `--master`) का उपयोग करके लिखें। मास्टर फ़ाइल में गायब स्थानीयकरण के लिए चेतावनी देता है और `TODO` प्लेसहोल्डर उत्पन्न करता है। यदि आपके पास कस्टम `label` या `englishName` मानों के साथ एक मौजूदा मैनिफेस्ट है, तो उन्हें मास्टर कैटलॉग डिफ़ॉल्ट द्वारा प्रतिस्थापित कर दिया जाएगा — उत्पन्न फ़ाइल की समीक्षा करें और बाद में समायोजित करें।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `translate-docs …`                                                          | प्रत्येक `documentations` ब्लॉक (`contentPaths`, वैकल्पिक `jsonSource`) के लिए मार्कडाउन/MDX और JSON का अनुवाद करें। `-j`: अधिकतम समानांतर स्थानीयकरण; `-b`: प्रति फ़ाइल अधिकतम समानांतर बैच API कॉल। `--prompt-format`: बैच वायर फ़ॉर्मेट (`xml` \| `json-array` \| `json-object`)। [कैश व्यवहार और `translate-docs` फ्लैग्स](#cache-behaviour-and-translate-docs-flags) और [बैच प्रॉम्प्ट प्रारूप](#batch-prompt-format) देखें।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `write-heading-ids …`                                                       | **कोई API नहीं।** कम से कम एक `documentations[]` ब्लॉक की आवश्यकता होती है। प्रत्येक ब्लॉक के `contentPaths` के तहत `.md` / `.mdx` एकत्र करता है (`.translate-ignore` का पालन करता है)। प्रत्येक फ्लैट ATX `#` हेडिंग के तुरंत **पहले** एक HTML एंकर लाइन `<a id="slug"></a>` सम्मिलित करता है (फेंस किए गए कोड ब्लॉक्स के अंदर के हेडिंग को छोड़कर)। `-p` / `--path` या `-f` / `--file`: प्रोजेक्ट-सापेक्ष फ़ाइल या निर्देशिका तक सीमित करें। `--slug-style`: `github` (डिफ़ॉल्ट; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`। `pymdown` के साथ, वैकल्पिक `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`। `--dry-run`: केवल परिवर्तनों की सूची।                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `strip-md-bold-inline …`                                                    | **कोई API नहीं।** कम से कम एक `documentations[]` ब्लॉक की आवश्यकता होती है। प्रत्येक ब्लॉक के `contentPaths` के तहत `.md` / `.mdx` में इनलाइन कोड के चारों ओर `**` को हटा देता है (`.translate-ignore` का पालन करता है)। `-p` / `--path` या `-f` / `--file`, `--dry-run`, `--no-backup` (ओवरराइट से पहले टाइमस्टैम्प वाले `.backup.*` को छोड़कर)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-svg …`                                                           | `config.svg` में कॉन्फ़िगर किए गए स्वतंत्र SVG एसेट्स का अनुवाद करें (दस्तावेज़ों से अलग)। `features.translateSVG` की आवश्यकता होती है। दस्तावेज़ों के समान कैश अवधारणाएँ; उस रन के लिए SQLite पढ़ने/लिखने को छोड़ने के लिए `--no-cache` का समर्थन करता है। `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`             | केवल UI स्ट्रिंग्स का अनुवाद करें। `--force`: प्रत्येक स्थानीयकरण के लिए सभी प्रविष्टियों का पुनः अनुवाद करें (मौजूदा अनुवादों की अनदेखी करें)। `--dry-run`: कोई लेखन नहीं, कोई API कॉल नहीं। `-j`: अधिकतम समानांतर स्थानीयकरण। `features.translateUIStrings` की आवश्यकता होती है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                                                    | `extract` को **पहले** चलाता है (`features.extractUIStrings` की आवश्यकता होती है) ताकि `strings.json` स्रोत से मिले, फिर **स्रोत-लोकेल** UI स्ट्रिंग्स की LLM समीक्षा (वर्तनी, व्याकरण)। **शब्दावली संकेत** केवल `glossary.userGlossary` CSV से आते हैं (`translate-ui` के समान क्षेत्र — `strings.json` / `uiGlossary` नहीं, इसलिए खराब प्रतिलिपि शब्दावली के रूप में मजबूत नहीं होती)। OpenRouter (`OPENROUTER_API_KEY`) का उपयोग करता है। केवल सलाहकारी (चलने के पूरा होने पर **0** पर निकलता है)। `cacheDir` के तहत एक **मानव-पठनीय** रिपोर्ट (सारांश, मुद्दे, और प्रति-स्ट्रिंग **OK** पंक्तियाँ) के रूप में `lint-source-results_<timestamp>.log` लिखता है; टर्मिनल केवल सारांश गिनती और मुद्दे प्रिंट करता है (प्रति स्ट्रिंग `[ok]` पंक्तियाँ नहीं)। अंतिम पंक्ति पर लॉग फ़ाइल का नाम प्रिंट करता है। `--json`: केवल stdout पर पूर्ण मशीन-पठनीय JSON रिपोर्ट (लॉग फ़ाइल मानव-पठनीय रहती है)। `--dry-run`: अभी भी `extract` चलाता है, फिर केवल बैच योजना प्रिंट करता है (कोई API कॉल नहीं)। `--chunk`: प्रति API बैच स्ट्रिंग्स (डिफ़ॉल्ट **50**)। `-j`: अधिकतम समानांतर बैच (डिफ़ॉल्ट `concurrency`)। `--json` के साथ, मानव-शैली आउटपुट stderr पर जाता है। लिंक `path:line` का उपयोग करते हैं जैसे `editor` UI स्ट्रिंग्स का “लिंक” बटन। |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | `strings.json` को XLIFF 2.0 में निर्यात करें (प्रति लक्ष्य स्थानीयकरण एक `.xliff`)। `-o` / `--output-dir`: आउटपुट निर्देशिका (डिफ़ॉल्ट: कैटलॉग के समान फ़ोल्डर)। `--untranslated-only`: केवल उन इकाइयों को जिनके लिए उस स्थानीयकरण के लिए अनुवाद लापता है। केवल पढ़ने के लिए; कोई API नहीं।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sync …`                                                                    | निर्यात (यदि सक्षम है), फिर UI अनुवाद, फिर `translate-svg` जब `features.translateSVG` और `config.svg` सेट हों, फिर दस्तावेज़ीकरण अनुवाद — जब तक `--no-ui`, `--no-svg`, या `--no-docs` के साथ छोड़ा न जाए। साझा झंडे: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (केवल दस्तावेज़ीकरण बैचिंग), `--force` / `--force-update` (केवल दस्तावेज़ीकरण; दस्तावेज़ीकरण चलने पर परस्पर अनन्य)। दस्तावेज़ीकरण चरण `--emphasis-placeholders` और `--debug-failed` को भी आगे भेजता है (`translate-docs` के समान अर्थ के साथ)। `--prompt-format` एक `sync` झंडा नहीं है; दस्तावेज़ीकरण चरण अंतर्निहित डिफ़ॉल्ट (`json-array`) का उपयोग करता है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `status [--max-columns <n>]`                                                | जब `features.translateUIStrings` चालू होता है, तो प्रत्येक भाषा क्षेत्र के लिए UI कवरेज मुद्रित करता है (`Translated` / `Missing` / `Total`)। फिर प्रत्येक फ़ाइल × भाषा क्षेत्र के लिए मार्कडाउन अनुवाद स्थिति मुद्रित करता है (कोई `--locale` फ़िल्टर नहीं; भाषा क्षेत्र कॉन्फ़िग से आते हैं)। बड़ी भाषा सूचियों को अधिकतम `n` भाषा कॉलम (डिफ़ॉल्ट **9**) वाली दोहराई गई तालिकाओं में विभाजित किया जाता है ताकि टर्मिनल में पंक्तियाँ संकीर्ण बनी रहें।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `statistics [--max-columns <n>]`                                             | दस्तावेज़ीकरण कैश और `strings.json` आँकड़े प्रिंट करें (अनुवाद कैश संपादक → **आँकड़े** के समान समुच्चय)। `--max-columns`: प्रति मॉडल × स्थानीय तालिका अधिकतम स्थानीय स्तंभ (डिफ़ॉल्ट संपादक से मेल खाता है)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                       | पहले `sync --force-update` चलाता है (निकालें, UI, SVG, दस्तावेज़), फिर अप्रचलित खंड पंक्तियाँ हटा देता है (शून्य `last_hit_at` / खाली फ़ाइलपाथ); उन `file_tracking` पंक्तियों को हटा देता है जिनका हल किया गया स्रोत पथ डिस्क पर अनुपलब्ध है; उन अनुवाद पंक्तियों को हटा देता है जिनका `filepath` मेटाडेटा लुप्त फ़ाइल की ओर इशारा करता है। तीन गणनाएँ लॉग करता है (अप्रचलित, अनाथ `file_tracking`, अनाथ अनुवाद)। कैश डायरेक्टरी के अंतर्गत एक समयसीलांकित SQLite बैकअप बनाता है, जब तक कि `--no-backup` न हो।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `editor [-p <port>] [--no-open]`                                            | कैश, `strings.json`, और शब्दावली CSV के लिए स्थानीय वेब संपादक लॉन्च करता है। `--no-open` के साथ, डिफ़ॉल्ट ब्राउज़र स्वचालित रूप से नहीं खुलता है।<br><br>**नोट:** यदि आप कैश संपादक में एक प्रविष्टि संपादित करते हैं, तो अपडेटेड कैश प्रविष्टि के साथ आउटपुट फ़ाइलों को पुनः लिखने के लिए आपको `sync --force-update` चलाना होगा। साथ ही, यदि बाद में स्रोत पाठ बदल जाता है, तो मैनुअल संपादन खो जाएगा क्योंकि एक नया कैश कुंजी उत्पन्न होती है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `glossary-generate [-o <path>]`                                             | एक खाली `glossary-user.csv` टेम्पलेट लिखें। `-o`: आउटपुट पथ को ओवरराइड करें (डिफ़ॉल्ट: कॉन्फ़िग से `glossary.userGlossary`, या `glossary-user.csv`)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

सभी कमांड्स गैर-डिफ़ॉल्ट कॉन्फ़िग फ़ाइल निर्दिष्ट करने के लिए `-c <path>`, विस्तृत आउटपुट के लिए `-v`, और कंसोल आउटपुट को लॉग फ़ाइल में टी करने के लिए `-w` / `--write-logs [path]` स्वीकार करते हैं (डिफ़ॉल्ट पथ: रूट के अंदर `cacheDir`)। मुख्य प्रोग्राम `-V` / `--version` और `-h` / `--help` का भी समर्थन करता है; `ai-i18n-tools help [command]` प्रति-कमांड उपयोग दिखाता है जैसा कि `ai-i18n-tools <command> --help` में है।

---

<a id="environment-variables"></a>
## वातावरण चर

| चर                      | विवरण                                                       |
|-------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`    | **आवश्यक।** आपकी OpenRouter API कुंजी।                     |
| `OPENROUTER_BASE_URL`   | API बेस URL को ओवरराइड करें।                                 |
| `I18N_SOURCE_LOCALE`    | रनटाइम पर `sourceLocale` को ओवरराइड करें।                        |
| `I18N_TARGET_LOCALES`   | `targetLocales` को ओवरराइड करने के लिए अल्पविराम से अलग स्थानीयकरण कोड।  |
| `I18N_LOG_LEVEL`        | लॉगर स्तर (`debug`, `info`, `warn`, `error`, `silent`)। |
| `NO_COLOR`              | जब `1`, लॉग आउटपुट में ANSI रंग अक्षम करें।              |
| `I18N_LOG_SESSION_MAX`  | प्रति लॉग सत्र अधिकतम पंक्तियाँ (डिफ़ॉल्ट `5000`)।           |
