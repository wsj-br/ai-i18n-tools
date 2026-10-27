<a id="programmatic-api"></a>
# प्रोग्रामेटिक एपीआई

सभी सार्वजनिक प्रकार और कक्षाएं पैकेज रूट से निर्यात की जाती हैं। उदाहरण: सीएलआई के बिना Node.js से translate-UI चरण चलाना:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Node.js से एक कॉन्फ़िग तैयार करें। चौथा आर्ग्यूमेंट बिल्ट-इन प्रीसेट है (`cwd` तीसरा है)। एक वैकल्पिक पाँचवाँ आर्ग्यूमेंट `{ withReadme: true }` फ़्लैट README डॉक्स ब्लॉक जोड़ता है जब टेम्पलेट में पहले से `README.md` सूचीबद्ध न हो, और यह बताता है कि क्या वह ब्लॉक जोड़ा गया था:

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'docsMarkdown', process.cwd(), 'openrouter');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiPython', process.cwd(), 'openrouter', {
  withReadme: true,
});
```

मुख्य निर्यात (आमतौर पर उपयोग किए जाते हैं — पूर्ण सार्वजनिक सतह के लिए `src/index.ts` देखें):

| निर्यात | विवरण |
|---|---|
| `loadI18nConfigFromFile` | JSON फ़ाइल से कॉन्फ़िग लोड करें, मर्ज करें, मान्य करें। |
| `parseI18nConfig` | एक कच्चे कॉन्फ़िग ऑब्जेक्ट को मान्य करें। |
| `TranslationCache` | SQLite कैश - एक `cacheDir` पथ के साथ इंस्टेंटिएट करें। |
| `UIStringExtractor` | JS/TS स्रोत से `t("…")` स्ट्रिंग निकालें। |
| `collectHtmlI18nStrings` / `markHtmlContent` | HTML में `data-i18n*` मार्कर स्कैन/सम्मिलित करें (`extract` और `.html` के लिए `mark-html` कमांड को शक्ति प्रदान करता है)। |
| `MarkdownExtractor` | मार्कडाउन से अनुवाद योग्य खंड निकालें। |
| `HtmlTemplateExtractor` | सादे HTML दस्तावेज़ों को निकालें और पुनः संयोजित करें (टेक्स्ट और अनुवाद योग्य विशेषताएँ; `src` / `href` यथास्थान रहेंगे)। |
| `JsonExtractor` | Docusaurus JSON लेबल फ़ाइलों (UI कैटलॉग, MDX बॉडी नहीं) से निकालें। |
| `SvgExtractor` | SVG फ़ाइलों से निकालें। |
| `LlmClient` | सक्रिय LLM प्रदाता को अनुवाद अनुरोध करें (`OpenRouterClient` एक बहिष्कृत उपनाम है)। |
| `rankProviderModels` / `resolveSuggestionWeights` | `suggest-models` द्वारा उपयोग की जाने वाली गुणवत्ता या मूल्य प्रोफ़ाइल के साथ रैंक वन प्रदाता के चैट कैटलॉग को रैंक करें। यह कॉन्फ़िगरेशन को प्रिंट या राइट नहीं करता है। |
| `PlaceholderHandler` | अनुवाद के आसपास मार्कडाउन सिंटैक्स को सुरक्षित/पुनर्स्थापित करें (HTML टैग, एडमॉनिशन्स, एंकर, MDX टिप्पणियाँ/JSX/ब्रेसेस, URL, इनलाइन कोड, एम्फेसिस)। |
| `protectMdx` / `restoreMdx` | MDX टिप्पणियों, JSX टैग, ब्रेस एक्सप्रेशंस और JSX स्ट्रिंग एट्रिब्यूट्स को सुरक्षित/पुनर्स्थापित करें (`PlaceholderHandler` द्वारा कॉल किया गया; सीधे उपयोग के लिए भी निर्यात किया गया)। |
| `splitTranslatableIntoBatches` | खंडों को LLM-आकार के बैचों में समूहित करें। |
| `validateTranslation` | अनुवाद के बाद संरचनात्मक जांच (**async** — प्रतीक्षा की जानी चाहिए)। |
| `resolveDocumentationOutputPath` | अनुवादित दस्तावेज़ के लिए आउटपुट फ़ाइल पथ हल करें। |
| `Glossary` / `GlossaryMatcher` | वैकल्पिक शब्द `Context` नोट्स सहित अनुवाद शब्दावलियों को लोड और लागू करें। |
| `loadTranslationContext` / `computeGuidanceFingerprint` | कैश अमान्यकरण के लिए `glossary.contextFiles` और फ़िंगरप्रिंट मार्गदर्शन लोड करें। |
| `runTranslateUI` | प्रोग्रामेटिक translate-UI एंट्री पॉइंट। |
| `writeInitConfigFile` | एक स्टार्टर कॉन्फ़िग JSON लिखें (`template`, `cwd`, एक आवश्यक `providerKey`, और वैकल्पिक `{ withReadme }`)। `{ readmeBlockAdded, hasReadmeBlock }` लौटाता है। |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `init -P` द्वारा उपयोग किए जाने वाले प्रति अंतर्निहित प्रीसेट के लिए स्टार्टर `translationModels`। |
| `PROVIDER_PRESETS` | अंतर्निहित प्रदाता प्रीसेट मैप (`baseUrl`, `apiKeyEnv`)। |

<a id="python-runtime"></a>
## Python रनटाइम (`i18n.py`)

`init -t ui-python`, `ui-python-gettext`, और `ui-python-flask` इस मॉड्यूल को प्रोजेक्ट में तब लिखते हैं जब `i18n.py` मौजूद न हो। यह Python 3.10 या उससे नए वर्ज़न के लिए एक स्टैंडर्ड-लाइब्रेरी हेल्पर है। इसे उस फ़ाइल से इम्पोर्ट करें। नीचे दिए गए फ़ंक्शन ऊपर दी गई तालिका में मौजूद Node एक्सपोर्ट्स से अलग हैं। Django प्रोजेक्ट्स Django के gettext को बनाए रखते हैं, इसलिए `ui-python-django` को `i18n.py` नहीं लिखना पड़ता है।

कॉल शेप्स, असुरक्षित f-strings, और प्रति-फ़्रेमवर्क लोकेल वायरिंग: [Python एप्लिकेशन](/hi/guide/ui-strings/python)।

| फ़ंक्शन | व्यवहार |
| --- | --- |
| `set_locale(locale)` | वर्तमान लोकेल सेट करें। कोड में अंडरस्कोर को हाइफ़न के रूप में स्टोर किया जाता है (`pt_BR` बदलकर `pt-BR` हो जाता है)। एक `ContextVar` टोकन लौटाता है। |
| `reset_locale(token)` | उस टोकन से लोकेल को रिस्टोर करें। इसे `finally` में कॉल करें, जिसमें FastAPI और Flask मिडलवेयर शामिल हैं। |
| `get_locale()` | वर्तमान लोकेल लौटाएं। |
| `set_backend(backend)` | `"auto"`, `"json"`, या `"gettext"` चुनें। |
| `get_ui_languages()` | फ्लैट JSON डायरेक्टरी के बगल में `ui-languages.json` पढ़ें, या जब फ्लैट आउटपुट बंद हो तो gettext डायरेक्टरी पढ़ें। |
| `get_direction(locale=None)` | उस लोकेल के लिए मैनिफ़ेस्ट पंक्ति से `"rtl"` या `"ltr"` लौटाएं (छोड़ दिए जाने पर वर्तमान लोकेल)। |
| `_(message)` | एक लिटरल देखें, फिर कैटलॉग स्ट्रिंग या स्वयं संदेश लौटाएं। |
| `t(template, *, plurals=False, count=None, **values)` | लिटरल देखें, फिर इंटरपोलेट करें। `translate` वही फ़ंक्शन है। Python 3.14 पर, `translate(t"Hello, {name}!")` टेम्प्लेट और उसके मानों को बनाए रखता है। कीवर्ड आर्ग्युमेंट्स टेम्प्लेट स्ट्रिंग से लिए गए मानों को ओवरराइड करते हैं। |
| `ngettext(singular, plural, n, **values)` | प्लुरल लुकअप, फिर इंटरपोलेट करें। `count` फ़ॉर्मेट स्ट्रिंग के लिए उपलब्ध है। |
| `pgettext(context, message, **values)` | कॉन्टेक्स्ट लुकअप (`msgctxt`, या `context` + U+0004 + फ़्लैट JSON में स्रोत-भाषा स्ट्रिंग), फिर इंटरपोलेट करें। |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Streamlit सिलेक्ट बॉक्स। `st.session_state.locale` और `st.query_params["lang"]` लिखता है, `set_locale` को कॉल करता है, और चुना गया कोड लौटाता है। |
