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

Node.js से एक कॉन्फ़िग को स्केफ़ोल्ड करें (वैकल्पिक चौथा तर्क बिल्ट-इन प्रीसेट का चयन करता है; डिफ़ॉल्ट `openrouter` पर):

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
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
| `JsonExtractor` | Docusaurus JSON लेबल फ़ाइलों (UI कैटलॉग, MDX बॉडी नहीं) से निकालें। |
| `SvgExtractor` | SVG फ़ाइलों से निकालें। |
| `LlmClient` | सक्रिय LLM प्रदाता को अनुवाद अनुरोध करें (`OpenRouterClient` एक बहिष्कृत उपनाम है)। |
| `PlaceholderHandler` | अनुवाद के आसपास मार्कडाउन सिंटैक्स को सुरक्षित/पुनर्स्थापित करें (HTML टैग, एडमॉनिशन्स, एंकर, MDX टिप्पणियाँ/JSX/ब्रेसेस, URL, इनलाइन कोड, एम्फेसिस)। |
| `protectMdx` / `restoreMdx` | MDX टिप्पणियों, JSX टैग, ब्रेस एक्सप्रेशंस और JSX स्ट्रिंग एट्रिब्यूट्स को सुरक्षित/पुनर्स्थापित करें (`PlaceholderHandler` द्वारा कॉल किया गया; सीधे उपयोग के लिए भी निर्यात किया गया)। |
| `splitTranslatableIntoBatches` | खंडों को LLM-आकार के बैचों में समूहित करें। |
| `validateTranslation` | अनुवाद के बाद संरचनात्मक जांच (**async** — प्रतीक्षा की जानी चाहिए)। |
| `resolveDocumentationOutputPath` | अनुवादित दस्तावेज़ के लिए आउटपुट फ़ाइल पथ हल करें। |
| `Glossary` / `GlossaryMatcher` | अनुवाद शब्दावलियों को लोड और लागू करें। |
| `runTranslateUI` | प्रोग्रामेटिक translate-UI एंट्री पॉइंट। |
| `writeInitConfigFile` | एक स्टार्टर कॉन्फ़िग JSON लिखें (`template`, वैकल्पिक `providerKey` जो डिफ़ॉल्ट रूप से `openrouter` पर सेट होता है)। |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `init -P` द्वारा उपयोग किए जाने वाले प्रति अंतर्निहित प्रीसेट के लिए स्टार्टर `translationModels`। |
| `PROVIDER_PRESETS` | अंतर्निहित प्रदाता प्रीसेट मैप (`baseUrl`, `apiKeyEnv`)। |
