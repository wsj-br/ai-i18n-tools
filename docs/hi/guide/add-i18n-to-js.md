<a id="add-i18n-to-a-jsts-app"></a>
# एक JS/TS ऐप में i18n जोड़ें

यह पृष्ठ एक JS/TS ऐप (React, Next.js, Node, या एक CLI) के लिए है जिसके बटन, लेबल और संदेश अभी भी मूल-भाषा के सादे टेक्स्ट में हैं। `extract` केवल तभी एक UI स्ट्रिंग रिकॉर्ड करता है जब वह `t()` या `i18n.t()` के अंदर एक स्ट्रिंग लिटरल हो, इसलिए आज कैटलॉग खाली होगा और `translate-ui` के पास अनुवाद करने के लिए कुछ भी नहीं होगा।

चरण: टूल इंस्टॉल करें, i18next इंस्टॉल करें, `extract` को एक बार चलाएं, एक छोटी सेटअप फ़ाइल जोड़ें ताकि `t` मौजूद हो, उपयोगकर्ता-सामने वाले टेक्स्ट को रैप करें, फिर अनुवाद करें। सुनिश्चित नहीं हैं कि यह आपका मामला है? अंत में [आपका मामला नहीं?](#not-your-case) देखें।

<a id="install-the-tool-and-set-the-key"></a>
## टूल इंस्टॉल करें और कुंजी सेट करें

CLI इंस्टॉल करें ([इंस्टॉलेशन](/hi/guide/installation)) और अपने प्रदाता के लिए API कुंजी सेट करें ([प्रदाता और API कुंजी](/hi/guide/quick-start#provider-and-api-key))। Ollama को किसी कुंजी की आवश्यकता नहीं है।

<a id="initialise-the-config"></a>
## कॉन्फ़िग को इनिशियलाइज़ करें

```bash
ai-i18n-tools init -P openrouter
```

यह `ai-i18n-tools.config.json` लिखता है। अभी के लिए चार कुंजियाँ महत्वपूर्ण हैं:

- `sourceLocale`: वह भाषा जिसमें आपका टेक्स्ट लिखा गया है। कोई भी भाषा मान्य है। इस गाइड में अंग्रेजी एक सामान्य उदाहरण है।
- `targetLocales`: जोड़ने वाली भाषाएँ।
- `ui.sourceRoots`: वे फ़ोल्डर जिन्हें `extract` स्कैन करता है, उदाहरण के लिए `src/`।
- `ui.stringsJson` और `ui.flatOutputDir`: जहाँ कैटलॉग और प्रति-स्थानिक फ़ाइलें लिखी जाती हैं।

हर दूसरी कुंजी [कॉन्फ़िगरेशन](/hi/reference/configuration) में है।

<a id="install-the-runtime-libraries"></a>
## रनटाइम लाइब्रेरीज़ इंस्टॉल करें

ai-i18n-tools `i18next` या `react-i18next` पर निर्भर नहीं करता है। ऐप उन्हें इंस्टॉल करता है।

- हर JS/TS ऐप जो रनटाइम पर स्ट्रिंग देखता है: `i18next`।
- React कंपोनेंट जो `useTranslation()` को कॉल करते हैं: `react-i18next` भी।

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="run-extract-once"></a>
## एक्सट्रैक्ट को एक बार चलाएं

```bash
ai-i18n-tools extract
```

अगले चरण में सेटअप फ़ाइल `strings.json` और `ui-languages.json` को इम्पोर्ट करती है, और केवल `extract` उन्हें लिखता है। यह दोनों को तब भी लिखता है जब उसे कोई `t()` कॉल नहीं मिलती, ताकि ऐप कंपाइल हो सके। 0 स्ट्रिंग की अपेक्षा करें, या 1 की यदि आपके `package.json` में `description` है, क्योंकि एक्सट्रैक्टर इसे डिफ़ॉल्ट रूप से शामिल करता है (`ui.uiExtractor.includePackageDescription`)।

<a id="add-the-bootstrap"></a>
## बूटस्ट्रैप जोड़ें

i18n सेटअप फ़ाइल बनाएँ। यह न्यूनतम संस्करण स्ट्रिंग को रैप करने और उनका अनुवाद करने के लिए पर्याप्त है। `ai-i18n-tools.config.json` में `SOURCE_LOCALE` `sourceLocale` के बराबर होना चाहिए।

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

React का उपयोग नहीं कर रहे हैं? `react-i18next` इम्पोर्ट और `.use(initReactI18next)` कॉल को हटा दें।

जब ऐप बहुवचन का उपयोग करना शुरू करता है, तो स्रोत-स्थानिक फ़्लैट फ़ाइल जोड़ें ताकि बहुवचन रूप हल हो सकें। यह एक तीसरा इम्पोर्ट और एक `sourcePluralFlatBundle` विकल्प जोड़ता है, जैसा कि [i18next को वायर करें](/hi/guide/ui-strings/i18next-runtime) में दिखाया गया है।

पहली रेंडरिंग से पहले ऐप एंट्री से इस फ़ाइल को इम्पोर्ट करें। Next.js में, इसे एक क्लाइंट मॉड्यूल से इम्पोर्ट करें, जैसा कि [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts) में दिखाया गया है।

<a id="replace-hardcoded-copy"></a>
## हार्डकोडेड कॉपी बदलें

इसे मैन्युअल रूप से करें, या [JS/TS प्रॉम्प्ट](#agent-prompt) को कोडिंग एजेंट में पेस्ट करें। `t()` का तर्क वह स्रोत-भाषा वाक्य है जिसे उपयोगकर्ता को देखना चाहिए। फ़्लैट लोकैल फ़ाइलें उस वाक्य द्वारा कुंजीबद्ध होती हैं।

<details class="agent-prompt" id="agent-prompt">
<summary>JS/TS एजेंट प्रॉम्प्ट</summary>

इसे कर्सर या किसी अन्य कोडिंग एजेंट में कॉपी करें। यह उपयोगकर्ता-सामने वाले लिटरल को रैप करता है। यह उनका अनुवाद नहीं करता है।

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The
literal is the source-language sentence and the catalog key (`t("Save")`, not
`t("saveButton")`). After this edit the app must behave the same when the active
locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference:
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees
(JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids,
enum and error codes, object keys used as identifiers, log field names, CSS,
regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses
`useTranslation()`. Run `ai-i18n-tools extract` once so `strings.json` and
`ui-languages.json` exist, then add the bootstrap from the Wire i18next guide.
`SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant
  that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call
  `changeLanguage` on a shared i18next instance inside a server component. Use a
  per-request `createInstance()`, or a stateless flat-bundle lookup.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

## Order

1. Install the libraries.
2. Run `ai-i18n-tools extract` once.
3. Add the bootstrap.
4. Wrap call sites.
5. Run `ai-i18n-tools extract` again. Do not run a translation yourself and do
   not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you
  wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original
  sentence. Switch one target locale after `translate-ui` and confirm those
  sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case you left for a human (the same word used with different
meanings, concatenated sentences, or a plural you were not sure about).
````

</details>

JSX:

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node, एक CLI, या कोई भी गैर-रिएक्ट मॉड्यूल:

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

नियम ([t() कॉल्स और प्लुरल्स](/hi/guide/ui-strings/t-calls-and-plurals) में भी):

- कुंजी एक लिटरल है। `t(variable)` और <code>{'t(`Hello ${name}`)'}</code> को एक्सट्रेक्ट नहीं किया जाता है, और गैर-लिटरल कॉल्स को बिना किसी चेतावनी के छोड़ दिया जाता है।
- लिटरल के अंदर के प्लेसहोल्डर i18next फॉर्म <code v-pre>{{name}}</code> का उपयोग करते हैं, जिसे दूसरे तर्क में पास किया जाता है।
- बहुवचन: एक स्रोत वाक्य और `{ plurals: true, count }`। [कार्डिनल प्लुरल्स](/hi/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true) देखें। `_one` / `_other` कुंजियाँ स्वयं न बनाएँ।
- रिएक्ट कंपोनेंट्स `useTranslation()` से `t` लेते हैं। अन्य फ़ाइलें `i18n.t` को कॉल करती हैं। इम्पोर्ट समय पर मूल्यांकन किया गया एक स्थिरांक एक फ़ंक्शन या `useMemo(..., [t])` में जाना चाहिए, ताकि लोकैल लोड होने के बाद `t()` चले।
- Next.js सर्वर कंपोनेंट्स को साझा i18next इंस्टेंस पर `changeLanguage` को कॉल नहीं करना चाहिए। समवर्ती अनुरोध उस सिंगलटन को साझा करते हैं। प्रति-अनुरोध `createInstance()` का उपयोग करें, या फ़्लैट बंडल का स्टेटलेस लुकअप करें ([नेक्स्ट्रा हाइब्रिड](/hi/guide/integrations/nextra#optional-t-for-app-react-hybrid) देखें)।

इन्हें अकेला छोड़ दें: `className`, `href` और अन्य URL, इम्पोर्ट पाथ, आईडी, टेस्ट आईडी, एरर कोड, पहचानकर्ताओं के रूप में उपयोग की जाने वाली ऑब्जेक्ट कुंजियाँ, और टिप्पणियों के अंदर का टेक्स्ट।

<a id="extract-and-translate"></a>
## एक्सट्रेक्ट करें और अनुवाद करें

जब लिटरल अपनी जगह पर हों:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

जब `features.translateUIStrings` चालू होता है, तो `sync` `extract` और `translate-ui` को एक साथ चलाता है। `extract` को अब आपके द्वारा रैप किए गए वाक्यों को सूचीबद्ध करना चाहिए। `ui.flatOutputDir` के तहत एक जेनरेट की गई लोकैल फ़ाइल खोलें और पुष्टि करें कि अनुवाद मौजूद हैं। अगला: [UI स्ट्रिंग्स, चरण 2](/hi/guide/ui-strings/#step-2-extract-strings) के लिए कि `extract` क्या स्कैन करता है और लिखता है।

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) एक छोटा Node ऐप है जिसका `src/main.js` पहले से ही रैप किया गया है। Next.js उदाहरण रिएक्ट बूटस्ट्रैप है।

<a id="language-switching"></a>
## भाषा स्विचिंग

पहले रेंडर से पहले एक सहेजे गए लोकैल को पुनर्स्थापित करें, जैसा कि [Wire i18next](/hi/guide/ui-strings/i18next-runtime#startup-locale) में वर्णित है। फिर एक नियंत्रण जोड़ें जो `await loadLocale(code)` के बाद `await i18n.changeLanguage(code)` को कॉल करता है: [भाषा स्विचर और RTL](/hi/guide/ui-strings/language-switcher)।

<a id="keep-it-translated"></a>
## इसे अनुवादित रखें

स्रोत टेक्स्ट बदलने के बाद `sync` को फिर से चलाएँ। कैश का मतलब है कि केवल नई या बदली हुई स्ट्रिंग्स मॉडल में जाती हैं। [अनुशंसित package.json स्क्रिप्ट](/hi/guide/quick-start#recommended-packagejson-scripts) से स्क्रिप्ट जोड़ें, और CI में `sync` चलाएँ ताकि अनुवाद में कोई बदलाव न आए।

डिफ़ॉल्ट `init` टेम्पलेट `README.md` का भी अनुवाद करता है। [अपने README और Markdown डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) देखें।

<a id="coming-from-another-tool"></a>
## किसी अन्य टूल से आ रहे हैं

ai-i18n-tools में अपना स्ट्रिंग एक्सट्रैक्टर शामिल है। यदि आपने `i18next-scanner`, `babel-plugin-i18next-extract`, या इसी तरह के किसी अन्य का उपयोग किया है, तो माइग्रेट करने के बाद आप उन देव डिपेंडेंसी को हटा सकते हैं। मौजूदा i18next नेमस्पेस JSON फ़ाइलें [JSON पाइपलाइन](/hi/guide/json#i18next-namespace-files) पर रह सकती हैं। Intlayer `.content.ts` डिक्शनरी को `migrate-intlayer` के साथ इम्पोर्ट किया जा सकता है: [Intlayer से माइग्रेट करना](/hi/guide/migrating-from-intlayer) देखें। रनटाइम पर Intlayer को रखने और केवल उसके अनुवादों को भरने के लिए, `translate-intlayer` का उपयोग करें: [Intlayer को यथास्थान अनुवादित करना](/hi/guide/translating-intlayer) देखें।

<a id="not-your-case"></a>
## आपका मामला नहीं?

| आपका आज का कोड | पढ़ें |
| --- | --- |
| पहले से ही स्रोत-भाषा वाक्य के साथ `t("…")` या `i18n.t("…")` | [UI स्ट्रिंग्स](/hi/guide/ui-strings/) चरण 2-3, फिर [i18next वायर करें](/hi/guide/ui-strings/i18next-runtime) |
| i18next नेमस्पेस JSON (`t("saveButton")` और `en/translation.json`) | [JSON](/hi/guide/json)। उन कुंजियों को स्रोत-भाषा वाक्यों में न बदलें जब तक कि आप हर कॉल को बदलने के लिए तैयार न हों |
| इंटलेयर डिक्शनरी, इंटलेयर से हट रहे हैं | [इंटलेयर से माइग्रेट करना](/hi/guide/migrating-from-intlayer) |
| इंटलेयर डिक्शनरी, इंटलेयर को बनाए रखना | [इंटलेयर को यथास्थान अनुवाद करना](/hi/guide/translating-intlayer) |
| एक HTML फ़ाइल | [प्लेन HTML](/hi/guide/ui-strings/plain-html) और `mark-html` |
| डॉक साइट्स, या एस्ट्रो पेज HTML | [किसी वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website) और [एस्ट्रो वेबसाइट](/hi/guide/ui-strings/astro-website)। `t()` केवल साझा डेटा और फ्रंटमैटर के लिए है |
| एक पायथन ऐप | [एक पायथन ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) |
| एक रिपॉजिटरी README या अन्य मार्कडाउन फ़ाइलें | [अपने README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) |
