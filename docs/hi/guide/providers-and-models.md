<a id="llm-providers-and-models"></a>
# LLM प्रदाता और मॉडल

प्रत्येक अनुवाद पाइपलाइन — `translate-ui`, `translate-docs`, `translate-json`, और `translate-svg` — एक ही प्रदाता-अज्ञेयवादी क्लाइंट के माध्यम से LLM को टेक्स्ट भेजती है। इनमें से कोई भी कमांड चलने से पहले, `ai-i18n-tools.config.json` में **कम से कम एक प्रदाता** कॉन्फ़िगर करें और अपने वातावरण या `.env` (**Ollama** को छोड़कर अंतर्निहित प्रीसेट) में मिलान करने वाली **API कुंजी** सेट करें। `init` एक स्टार्टर `provider` / `providers` ब्लॉक लिखता है; आपको अभी भी सक्रिय प्रीसेट के लिए क्रेडेंशियल प्रदान करने होंगे।

आप कॉन्फ़िग में **किस API एंडपॉइंट को कॉल करना है** और **किन मॉडलों को आज़माना है** को एक बार कॉन्फ़िगर करते हैं; सभी अनुवाद कमांड उस सेटअप और उसी SQLite कैश को साझा करते हैं।

CLI शीर्ष-स्तरीय `provider` कुंजी (या `providers` में एकमात्र प्रविष्टि जब केवल एक कॉन्फ़िगर किया गया हो) से सक्रिय प्रदाता को हल करता है। प्रत्येक प्रदाता ब्लॉक एक क्रमबद्ध `translationModels` फ़ॉलबैक श्रृंखला को सूचीबद्ध करता है; अंतर्निहित प्रीसेट स्वचालित रूप से `baseUrl` और API-कुंजी पर्यावरण चर को इनहेरिट करते हैं (आवश्यकता पड़ने पर उन्हें प्रति प्रदाता ओवरराइड करें)।

<a id="built-in-providers"></a>
### अंतर्निहित प्रदाता

प्रीसेट प्रदाता कुंजियों को केवल `translationModels` की आवश्यकता होती है — आधार URL और API-कुंजी env var स्वचालित रूप से भरे जाते हैं:

| प्रदाता | आधार URL | API-कुंजी env var |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai`     | `https://api.openai.com/v1`                               | `OPENAI_API_KEY`     |
| `anthropic`  | `https://api.anthropic.com/v1`                            | `ANTHROPIC_API_KEY`  |
| `gemini`     | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY`     |
| `deepseek`   | `https://api.deepseek.com`                                | `DEEPSEEK_API_KEY`   |
| `cerebras`   | `https://api.cerebras.ai/v1`                              | `CEREBRAS_API_KEY`   |
| `groq`       | `https://api.groq.com/openai/v1`                          | `GROQ_API_KEY`       |
| `mistral`    | `https://api.mistral.ai/v1`                               | `MISTRAL_API_KEY`    |
| `xai`        | `https://api.x.ai/v1`                                     | `XAI_API_KEY`        |
| `nvidia`     | `https://integrate.api.nvidia.com/v1`                     | `NVIDIA_API_KEY`     |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun`     | `https://api.apikey.fun/v1`                               | `APIFUN_API_KEY`     |
| `ollama`     | `http://localhost:11434/v1`                               | (कोई नहीं)               |

किसी भी **गैर-प्रीसेट** कुंजी के लिए, कॉन्फ़िग में `baseUrl` और `apiKeyEnv` को स्पष्ट रूप से सेट करें।

अपने वातावरण या `.env` फ़ाइल में सक्रिय प्रदाता की API कुंजी सेट करें। CLI शेल में पहले से सेट किए गए चर को ओवरराइड किए बिना कार्यशील निर्देशिका से `.env` को स्वचालित रूप से लोड करता है। [पर्यावरण चर](/hi/reference/environment-variables) देखें।

<a id="model-fallback-chain"></a>
### मॉडल फ़ॉलबैक श्रृंखला

`translationModels` एक **क्रमबद्ध सूची** है, न कि एक ही विकल्प। CLI पहले मॉडल को आज़माता है; अनुरोध या पार्स विफलता पर यह अगली प्रविष्टि पर चला जाता है। कई मॉडलों को कॉन्फ़िगर करें ताकि एक क्षणिक आउटेज या एक मॉडल जो किसी स्थान के साथ संघर्ष करता है, पूरे रन को अवरुद्ध न करे।

**रिज़ॉल्यूशन टियर** (डुप्लिकेट हटाए गए, क्रम संरक्षित):

| पाइपलाइन | क्रम |
| --- | --- |
| UI (`translate-ui`, बहुवचन, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| दस्तावेज़, JSON, SVG | `localeModels(locale)` → `translationModels` |

वैकल्पिक `providers.<active>.uiModels` एक UI-केवल सूची है जिसे किसी भी मिलान करने वाले प्रति-स्थान ओवरराइड के बाद और वैश्विक `translationModels` श्रृंखला से पहले आज़माया जाता है। वैकल्पिक `providers.<active>.localeModels` एक BCP-47 स्थान को उन मॉडलों से मैप करता है जिन्हें प्रत्येक पाइपलाइन में उस स्थान के लिए **पहले** आज़माया जाता है (`pt-br` `pt-BR` से मेल खाता है)। जब कोई `localeModels` प्रविष्टि मेल नहीं खाती है, तो केवल पाइपलाइन-विशिष्ट टियर लागू होते हैं।

विभिन्न प्रदाता और मॉडल भाषाओं में लागत, गति और गुणवत्ता में भिन्न होते हैं। `npx ai-i18n-tools init` से डिफ़ॉल्ट सूची को एक शुरुआती बिंदु के रूप में मानें — जब कोई स्थान लगातार खराब परिणाम देता है, तो इसे विस्तारित करें, या उस स्थान के लिए एक `localeModels` प्रविष्टि जोड़ें। पूर्ण डिफ़ॉल्ट और तर्क: [कॉन्फ़िगरेशन — `provider` और `providers`](/hi/reference/configuration#provider-and-providers)।

**UI स्ट्रिंग्स:** वैकल्पिक `uiModels` आपको `translate-ui`, बहुवचन जनरेशन, और `proofread-ui` को वैश्विक `translationModels` श्रृंखला से पहले प्रीमियम मॉडल के माध्यम से रूट करने देता है — उपयोगी क्योंकि UI कॉपी छोटी लेकिन उपयोगकर्ता-सामने होती है।

**एशियाई स्थान:** `ja`, `ko`, `zh-Hans`, और `zh-Hant` के लिए वैकल्पिक `localeModels` प्रविष्टियों को प्रत्येक पाइपलाइन में पहले आज़माया जाता है; `z-ai/glm-5.2` और `minimax/minimax-m2.7` जैसे मॉडल अक्सर सामान्य-उद्देश्य फ़ॉलबैक की तुलना में CJK स्क्रिप्ट पर बेहतर प्रदर्शन करते हैं।

उदाहरण कॉन्फ़िग (OpenRouter):

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "meta-llama/llama-3.3-70b-instruct",
        "openai/gpt-4o-mini",
        "google/gemma-4-26b-a4b-it",
        "anthropic/claude-3-haiku",
        "z-ai/glm-5.2",
        "google/gemini-3-flash-preview",
        "~anthropic/claude-sonnet-latest"
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "z-ai/glm-5.2"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] }
      ]
    }
  }
}
```

<a id="validate-and-compare-models"></a>
### मॉडल को मान्य और तुलना करें

`translationModels` बदलने से पहले, पुष्टि करें कि प्रत्येक आईडी सक्रिय प्रदाता पर अभी भी उपलब्ध है:

```bash
npx ai-i18n-tools check-models
```

`check-models` प्रदाता के `GET /models` एंडपॉइंट को कॉल करता है, `translationModels`, `uiModels`, और `localeModels` से प्रत्येक आईडी को मान्य करता है, उन आईडी की रिपोर्ट करता है जो गुम हैं या `expiration_date` से आगे हैं, और जब कोई भी कॉन्फ़िगर की गई आईडी अमान्य होती है तो गैर-शून्य से बाहर निकलता है। जब प्रदाता मूल्य निर्धारण लौटाता है (OpenRouter करता है), तो यह प्रति 1M टोकन अनुमानित USD भी दिखाता है।

प्रदाता द्वारा विज्ञापित पूरी कैटलॉग ब्राउज़ करें:

```bash
npx ai-i18n-tools list-models
```

एक वास्तविक अनुवाद नमूने पर कॉन्फ़िगर किए गए मॉडल का बेंचमार्क करें — `translationModels`, `uiModels`, और `localeModels` से प्रत्येक अद्वितीय आईडी अलग से चलती है ताकि आप वॉल-क्लॉक समय, टोकन उपयोग और लागत की तुलना कर सकें:

```bash
npx ai-i18n-tools bench-models
```

नमूना पाठ, लोकेल या मॉडल सूची को ओवरराइड करें:

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

कमांड विवरण: [CLI संदर्भ](/hi/reference/cli-commands/)।

<a id="multiple-providers"></a>
### एकाधिक प्रदाता

जब एक से अधिक प्रदाता कॉन्फ़िगर किए जाते हैं, तो डिफ़ॉल्ट का चयन करने के लिए शीर्ष-स्तरीय `provider` कुंजी सेट करें। कॉन्फ़िग को संपादित किए बिना प्रति रन स्विच करें:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

प्रत्येक प्रदाता ब्लॉक अपनी स्वयं की `translationModels`, वैकल्पिक `uiModels` और `localeModels`, `maxTokens`, `temperature`, और `requestTimeoutMs` को परिभाषित कर सकता है। एक विरासत शीर्ष-स्तरीय `openrouter` ब्लॉक अभी भी स्वीकार किया जाता है और लोड होने पर `providers.openrouter` में स्वतः माइग्रेट हो जाता है।

एक ही दस्तावेज़ पर चार प्रदाताओं के साथ चलाने योग्य उदाहरण: [`examples/multi-provider`](/hi/examples#multi-provider)।

<a id="further-reference"></a>
### आगे का संदर्भ

- [कॉन्फ़िगरेशन — `provider` और `providers`](/hi/reference/configuration#provider-and-providers) — प्रीसेट तालिका, कस्टम एंडपॉइंट, अनुरोध टाइमआउट, OpenRouter-विशिष्ट व्यवहार।
- [आर्किटेक्चर — LLM क्लाइंट](/hi/reference/architecture) — मॉडल फ़ॉलबैक, बैचिंग और लागत रिपोर्टिंग आंतरिक रूप से कैसे काम करती है।
- [पर्यावरण चर](/hi/reference/environment-variables) — API-कुंजी env चर और बेस-URL ओवरराइड।
