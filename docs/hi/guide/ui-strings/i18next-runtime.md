<a id="wire-i18next-at-runtime"></a>
# रनटाइम पर वायर i18next

यह पृष्ठ रनटाइम पर लुकअप को वायर करता है। यह स्ट्रिंग का पता नहीं लगाता है। यदि ऐप में अभी भी मूल-भाषा के शाब्दिक (लिटरल) हैं, तो उन्हें पहले रैप करें: [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js)। ऐप `i18next` इंस्टॉल करता है, और `react-i18next` जब कंपोनेंट `useTranslation()` का उपयोग करते हैं। `ai-i18n-tools` इनमें से कोई भी पैकेज इंस्टॉल नहीं करता है।

सहायक कार्यों का उपयोग करके अपनी i18n सेटअप फ़ाइल बनाएं जो `'ai-i18n-tools/runtime'` द्वारा निर्यात की जाती है। एपीआई हस्ताक्षर के लिए, [रनटाइम सहायक](/hi/guide/runtime-helpers) देखें।

<details>
<summary>पूर्ण i18n बूटस्ट्रैप उदाहरण (src/i18n.js)</summary>

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
## `SOURCE_LOCALE` को संरेखित रखना

`sourceLocale` कोई भी भाषा हो सकती है। नीचे दिया गया स्निपेट `en-GB` को एक उदाहरण के रूप में उपयोग करता है। **तीन मानों को संरेखित रखें:** `ai-i18n-tools.config.json` में `sourceLocale`, इस फ़ाइल में `SOURCE_LOCALE`, और प्लुरल फ़्लैट JSON `translate-ui` जिसे `{sourceLocale}.json` के रूप में आपकी फ़्लैट आउटपुट डायरेक्टरी (अक्सर `public/locales/`) के तहत लिखता है। उस ही बेसनेम का उपयोग स्टैटिक `import` में करें (ऊपर दिया गया उदाहरण: `en-GB` → `en-GB.json`)। `sourcePluralFlatBundle` में `lng` फ़ील्ड `SOURCE_LOCALE` के बराबर होना चाहिए। स्टैटिक ES `import` पाथ वैरिएबल का उपयोग नहीं कर सकते; यदि आप स्रोत लोकले बदलते हैं, तो `SOURCE_LOCALE` और इंपोर्ट पाथ को एक साथ अपडेट करें। वैकल्पिक रूप से, उस फ़ाइल को डायनामिक `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, या `readFileSync` के साथ लोड करें ताकि पाथ `SOURCE_LOCALE` से बनाया जा सके।

स्निपेट `./locales/…` और `./public/locales/…` का उपयोग करता है जैसे कि `i18n` उन फ़ोल्डरों के बगल में बैठता है। यदि आपकी फ़ाइल `src/` (आम) के तहत है, तो `../locales/…` और `../public/locales/…` का उपयोग करें ताकि आयात `ui.stringsJson`, `languagesManifestPath`, और `ui.flatOutputDir` के समान पथ को हल करें।

प्रतिक्रिया रेंडरिंग से पहले `i18n.js` आयात करें (उदाहरण के लिए, अपने प्रवेश बिंदु के शीर्ष पर)। जब उपयोगकर्ता भाषा बदलता है, तो `await loadLocale(code)` और फिर `await i18n.changeLanguage(code)` को कॉल करें।

<a id="startup-locale"></a>
### स्टार्टअप लोकले

पहले रेंडर से पहले `loadLocale(saved)` और फिर `i18n.changeLanguage(saved)` को कॉल करें, न कि केवल भाषा स्विचर में। [examples/console-app/src/main.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/console-app/src/main.js) प्रिंट करने से पहले ऐसा करता है। Next.js में, हाइड्रेशन के बाद एक इफ़ेक्ट में `localStorage` को पढ़ने से पहले स्रोत लोकले पेंट होता है और सर्वर HTML से मेल नहीं खा सकता है। एक ऐसी कुकी को प्राथमिकता दें जिसे सर्वर पढ़ सके, या पहले क्लाइंट रेंडर से पहले क्लाइंट मॉड्यूल में सहेजे गए लोकले को लोड करें।

`SOURCE_LOCALE` निर्यात किया जाता है ताकि कोई अन्य फ़ाइल जिसे इसकी आवश्यकता हो (उदाहरण के लिए, एक भाषा स्विचर) इसे सीधे `'./i18n'` से आयात कर सके। यदि आप एक मौजूदा i18next सेटअप को माइग्रेट कर रहे हैं, तो किसी भी हार्डकोडेड स्रोत स्थान स्ट्रिंग (उदाहरण के लिए, `'en-GB'` जांचें जो घटकों में बिखरी हुई हैं) को अपनी i18n बूटस्ट्रैप फ़ाइल से `SOURCE_LOCALE` के आयात से बदलें।

नामित आयात (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) तब भी काम करते हैं जब आप डिफ़ॉल्ट निर्यात का उपयोग नहीं करना चाहते हैं।

<a id="locale-loaders"></a>
## स्थानीय लोडर

`localeLoaders` को **कॉन्फ़िगरेशन के साथ संरेखित** रखें `ui-languages.json` का उपयोग करके `makeLocaleLoadersFromManifest` (यह `SOURCE_LOCALE` को बाहर निकालता है जो `makeLoadLocale` के समान सामान्यीकरण का उपयोग करता है)। जब आप `targetLocales` में एक स्थान जोड़ते हैं और `generate-ui-languages` चलाते हैं, तो मैनिफ़ेस्ट अद्यतन किया जाता है और आपके लोडर स्वचालित रूप से परिवर्तन को ट्रैक करते हैं — किसी अलग से हार्डकोडेड मैप को बनाए रखने की आवश्यकता नहीं है।

`public/` (आम नेक्स्ट.js सेटअप) के तहत जेसन बंडल के लिए, अपने सार्वजनिक यूआरएल पथ से प्राप्त करें:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

बंडलर के बिना नोड सीएलआई के लिए, `readFileSync` का उपयोग एक छोटे से सहायक के भीतर करें जो प्रत्येक कोड के लिए जेसन फ़ाइल को पढ़ता और व्याख्या करता है।

`setupKeyAsDefaultT` का उपयोग सामान्य ऐप प्रवेश बिंदु के रूप में करें (की-ट्रिम + बहुवचन `wrapT` + वैकल्पिक `translate-ui` `{sourceLocale}.json`)। केवल `wrapI18nWithKeyTrim` को कॉल करना **पुराना** है — [रनटाइम सहायक](/hi/guide/runtime-helpers) देखें।
