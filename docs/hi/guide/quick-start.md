<a id="quick-start"></a>
# त्वरित शुरुआत

यह पृष्ठ एक ऐसी परियोजना को लेता है जो एक भाषा बोलती है और उसे उसकी पहली अनुवादित फ़ाइलों तक पहुँचाता है। यह एक JS/TS ऐप, एक Python ऐप, एक वेबसाइट या दस्तावेज़ साइट, या एक रिपॉजिटरी README और अन्य Markdown फ़ाइलों के लिए है। यह मानता है कि:

- Node.js `>=22.16.0`, या Python परियोजना के लिए [स्टैंडअलोन निष्पादन योग्य](/hi/guide/installation#standalone-executables)।
- एक LLM प्रदाता के लिए एक API कुंजी, या एक स्थानीय Ollama इंस्टॉलेशन।
- परियोजना संस्करण नियंत्रण में है, ताकि आप उपकरण द्वारा लिखी गई चीज़ों की समीक्षा कर सकें।

परियोजनाओं के बीच दो चीजें भिन्न होती हैं: उपकरण आपके टेक्स्ट को कैसे ढूंढता है, और आपका ऐप परिणाम को कैसे लोड करता है। नीचे [अपना मार्ग चुनें](#pick-your-path) आपको उसके लिए सही मार्गदर्शिका पर भेजता है।

<a id="runnable-examples"></a>
## चलाने योग्य उदाहरण

पहले एक पूर्ण परियोजना देखना पसंद करेंगे? रिपॉजिटरी को क्लोन किए बिना एक कॉपी करें:

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync
```

`console-app` को किसी अन्य Node.js उदाहरण से बदलें। Python उदाहरणों में कोई `package.json` नहीं है; उन्हें उसी तरह कॉपी करें या GitHub रिलीज़ से `ai-i18n-tools-python-examples.zip` डाउनलोड करें। प्रत्येक उदाहरण क्या दिखाता है, उसकी पूरी सूची [उदाहरण](/hi/examples) पृष्ठ पर है।

<a id="install"></a>
## इंस्टॉल करें

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` और `yarn add --dev ai-i18n-tools` भी काम करते हैं। Python परियोजनाएं स्टैंडअलोन निष्पादन योग्य स्थापित करती हैं और उन्हें Node.js की आवश्यकता नहीं होती है। Linux और macOS: `curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`। Windows PowerShell: `irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`। अन्य इंस्टॉलेशन विकल्प: [इंस्टॉलेशन](/hi/guide/installation)।

<a id="provider-and-api-key"></a>
## प्रदाता और API कुंजी

प्रत्येक कमांड जो एक LLM (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, और `sync`) को कॉल करती है, उसे इन दोनों की आवश्यकता होती है:

1. `ai-i18n-tools.config.json` में कम से कम एक प्रोवाइडर: `translationModels` के साथ एक `providers.<name>` ब्लॉक, और जब एक से ज़्यादा प्रोवाइडर कॉन्फ़िगर किए गए हों, तो एक टॉप-लेवल `provider` की। `init -P <provider>` उस प्रीसेट को स्कैफ़ोल्ड करता है। प्रोवाइडर जोड़ने के लिए, [LLM प्रोवाइडर](/hi/guide/providers-and-models) देखें। मॉडल सूची चुनने के लिए, [AI मॉडल](/hi/guide/ai-models) देखें।
2. आपके एनवायरमेंट में या प्रोजेक्ट-रूट `.env` फ़ाइल में मैचिंग API की। हर बिल्ट-इन प्रीसेट [प्रीसेट टेबल](/hi/guide/providers-and-models#built-in-providers) से एक नामित वैरिएबल पढ़ता है, उदाहरण के लिए `-P openrouter` के साथ `OPENROUTER_API_KEY` या `-P openai` के साथ `OPENAI_API_KEY`। Ollama एक लोकल एंडपॉइंट का इस्तेमाल करता है और उसे किसी की की ज़रूरत नहीं होती।

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

`extract`, `status`, और अन्य कमांड जो LLM को कॉल नहीं करते हैं, उन्हें इनमें से किसी की भी आवश्यकता नहीं होती है। पर्यावरण फ़ाइलों और PATH के बारे में अधिक जानकारी: [इंस्टॉलेशन](/hi/guide/installation#using-the-cli)।

<a id="pick-your-path"></a>
## अपना मार्ग चुनें

आपके पास जो है उसे ढूंढें, उसके ब्लॉक में कमांड चलाएं, फिर लिंक की गई मार्गदर्शिका में जारी रखें।

<a id="a-jsts-app"></a>
### एक JS/TS ऐप

आपके बटन और संदेश स्रोत में अभी भी सादे टेक्स्ट में हैं, इसलिए उपकरण को अभी तक कुछ भी नहीं मिला है। उन्हें पहले `t()` में लपेटा जाना चाहिए, और ऐप को एक छोटी i18next सेटअप फ़ाइल की आवश्यकता है।

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models --apply
```

फिर [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) का पालन करें। यह `extract` और `translate-ui` से पहले, एक एजेंट प्रॉम्प्ट के साथ, रैपिंग चरण को कवर करता है।

<a id="a-python-app"></a>
### एक Python ऐप

```bash
ai-i18n-tools init -t ui-python -P openrouter
ai-i18n-tools suggest-models --apply
```

उन सेटअपों के लिए `ui-python-gettext`, `ui-python-flask`, या `ui-python-django` का उपयोग करें। फिर [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) का पालन करें।

<a id="a-website-or-documentation-site"></a>
### एक वेबसाइट या दस्तावेज़ साइट

अपने फ्रेमवर्क के लिए टेम्पलेट चुनें:

| आपकी साइट | टेम्पलेट |
| --- | --- |
| एस्ट्रो स्टारलाइट | `ui-starlight` |
| डॉकुसॉरस | `ui-docusaurus` |
| वाइटप्रेस | `ui-vitepress` |
| नेक्स्ट्रा | `ui-nextra` |
| फ्यूमाडॉक्स | `ui-fumadocs` |
| साधारण एस्ट्रो वेबसाइट | `ui-astro-website` |
| साधारण HTML पेज | `ui-plain-html` या `docs-plain-html` |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

आपके फ्रेमवर्क में पहले से अपनी i18n रूटिंग सक्षम होनी चाहिए। फिर [किसी वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website) का पालन करें।

<a id="a-readme-or-markdown-docs"></a>
### एक README या मार्कडाउन डॉक्स

अधिकांश रिपॉजिटरी इसे ऐप के साथ चाहते हैं: डिफ़ॉल्ट `ui-markdown` टेम्पलेट में पहले से ही एक फ़्लैट README ब्लॉक शामिल है। किसी अन्य टेम्पलेट के लिए, `--with-readme` जोड़ें। केवल मार्कडाउन वाली रिपॉजिटरी `docs-markdown` का उपयोग करती है।

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
ai-i18n-tools init -t docs-markdown -P openrouter
```

फिर [अपने README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) का पालन करें। भाषा-सूची मार्कर को `sync` से पहले `README.md` में पेस्ट करें। ऐप पाथ, यदि आपके पास एक है, तो वह अभी भी [किसी JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) या [किसी Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) है।

<a id="something-else"></a>
### कुछ और

- नेस्टेड i18next JSON जो जैसा है वैसा ही रहता है: `ai-i18n-tools init -t ui-json-bundles -P openrouter`, फिर [JSON](/hi/guide/json)।
- टेक्स्ट लेबल वाले SVG डायग्राम: [SVG अनुवाद](/hi/guide/svg-translation/)।
- इंटलेयर से हटना: [इंटलेयर से माइग्रेट करना](/hi/guide/migrating-from-intlayer)।
- इंटलेयर को बनाए रखना और केवल उसके अनुवादों को भरना: [इंटलेयर का यथास्थान अनुवाद करना](/hi/guide/translating-intlayer)।

प्रत्येक `init` विकल्प के साथ पूरी टेम्पलेट सूची [CLI सेटअप संदर्भ](/hi/reference/cli-commands/setup) में है।

<a id="run-and-check"></a>
## चलाएँ और जाँचें

जब आपका प्रोजेक्ट तैयार हो:

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` आपकी कॉन्फ़िग द्वारा सक्षम किए गए प्रत्येक चरण को क्रम से चलाता है। `status` दिखाता है कि प्रति लोकेल क्या अनुवादित है। किसी ऐसे प्रोजेक्ट पर पहली बार चलाने पर, जिसमें टूल टेक्स्ट नहीं देख पाता, वह बिना किसी त्रुटि के समाप्त हो जाता है और कुछ भी उपयोगी नहीं लिखता, इसलिए यदि `status` कोई स्ट्रिंग नहीं दिखाता है, तो अपने पाथ के लिए गाइड पर वापस जाएँ।

`suggest-models` प्रकाशित बेंचमार्क से सक्रिय प्रोवाइडर के चैट मॉडल को रैंक करता है। `suggest-models --apply`, `translationModels` को बदल देता है और `uiModels` और `localeModels` को वैसे ही छोड़ देता है। यही रैंकिंग डैशबोर्ड **मॉडल** टैब पर है। रैंकिंग कैसे काम करती है, और सूची में एक से ज़्यादा मॉडल क्यों हैं: [AI मॉडल](/hi/guide/ai-models)। कमांड रेफ़रेंस: [suggest-models](/hi/reference/cli-commands/models#suggest-models)।

<a id="keep-it-translated"></a>
## इसे अनुवादित रखें

जब भी स्रोत टेक्स्ट बदलता है, तो `sync` को फिर से चलाएँ। एक SQLite कैश का मतलब है कि केवल नया या बदला हुआ टेक्स्ट मॉडल में जाता है, इसलिए फिर से चलाना सस्ता है। CI में `sync` चलाने से अनुवादों को भटकने से रोका जा सकता है। `ai-i18n-tools dashboard` कैश्ड अनुवादों की समीक्षा और संपादन के लिए [अनुवाद डैशबोर्ड](/hi/guide/translation-dashboard/) खोलता है।

<a id="recommended-packagejson-scripts"></a>
### अनुशंसित package.json स्क्रिप्ट

पैकेज स्थानीय रूप से स्थापित होने पर, स्क्रिप्ट अतिरिक्त शेल सेटअप के बिना `node_modules/.bin` से `ai-i18n-tools` को हल करती हैं। एक इंटरैक्टिव शेल के लिए, पहले PATH कॉन्फ़िगर करें: देखें [CLI का उपयोग करना](/hi/guide/installation#using-the-cli)।

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

व्यक्तिगत अनुवाद स्क्रिप्ट को एक साथ जोड़ने के बजाय `sync` को प्राथमिकता दें। एकल-चरण स्क्रिप्ट का उपयोग तभी करें जब आपको किसी एक चरण की अकेले आवश्यकता हो।

CLI आउटपुट और डैशबोर्ड को किसी अन्य भाषा में प्राप्त करने के लिए, `-L <code>` पास करें या `AI_I18N_LANG` सेट करें: देखें [टूल UI भाषा](/hi/guide/tool-ui-language)।

<a id="combined-sync"></a>

एक से अधिक प्रकार की सामग्री का अनुवाद कर रहे हैं, जैसे कि ऐप स्ट्रिंग और एक डॉक्स साइट एक साथ? देखें [पाइपलाइन को संयोजित करना](/hi/guide/combining-pipelines)।

अगला: [अपना पथ चुनें](#pick-your-path) के अंतर्गत आपके पथ के लिए मार्गदर्शिका।
