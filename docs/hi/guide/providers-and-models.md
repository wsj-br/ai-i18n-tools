<a id="llm-providers-and-models"></a>
# एलएलएम प्रोवाइडर्स

प्रत्येक अनुवाद पाइपलाइन — `translate-ui`, `translate-docs`, `translate-json`, और `translate-svg` — एक ही प्रदाता-अज्ञेयवादी क्लाइंट के माध्यम से LLM को टेक्स्ट भेजती है। इनमें से कोई भी कमांड चलने से पहले, `ai-i18n-tools.config.json` में **कम से कम एक प्रदाता** कॉन्फ़िगर करें और अपने वातावरण या `.env` (**Ollama** को छोड़कर अंतर्निहित प्रीसेट) में मिलान करने वाली **API कुंजी** सेट करें। `init` एक स्टार्टर `provider` / `providers` ब्लॉक लिखता है; आपको अभी भी सक्रिय प्रीसेट के लिए क्रेडेंशियल प्रदान करने होंगे।

आप कॉन्फ़िग में एक बार **किस API एंडपॉइंट को कॉल करना है** यह कॉन्फ़िगर करते हैं; सभी ट्रांसलेशन कमांड उस सेटअप और उसी SQLite कैश को शेयर करते हैं। वह प्रोवाइडर कौन से मॉडल आज़माता है यह एक अलग स्टेप है: [एआई मॉडल्स](/hi/guide/ai-models)।

CLI शीर्ष-स्तरीय `provider` कुंजी (या `providers` में एकमात्र प्रविष्टि जब केवल एक कॉन्फ़िगर किया गया हो) से सक्रिय प्रदाता को हल करता है। प्रत्येक प्रदाता ब्लॉक एक क्रमबद्ध `translationModels` फ़ॉलबैक श्रृंखला को सूचीबद्ध करता है; अंतर्निहित प्रीसेट स्वचालित रूप से `baseUrl` और API-कुंजी पर्यावरण चर को इनहेरिट करते हैं (आवश्यकता पड़ने पर उन्हें प्रति प्रदाता ओवरराइड करें)।

<a id="built-in-providers"></a>
### अंतर्निहित प्रदाता

प्रीसेट प्रदाता कुंजियों को केवल `translationModels` की आवश्यकता होती है — आधार URL और API-कुंजी env var स्वचालित रूप से भरे जाते हैं:

<div class="provider-presets">

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
| `cheaperinference` | `https://api.cheaperinference.com/v1` | `CHEAPERINFERENCE_API_KEY` |
| `ollama`     | `http://localhost:11434/v1`                               | (कोई नहीं)               |

</div>

किसी भी **गैर-प्रीसेट** कुंजी के लिए, कॉन्फ़िग में `baseUrl` और `apiKeyEnv` को स्पष्ट रूप से सेट करें।

अपने वातावरण या `.env` फ़ाइल में सक्रिय प्रदाता की API कुंजी सेट करें। CLI शेल में पहले से सेट किए गए चर को ओवरराइड किए बिना कार्यशील निर्देशिका से `.env` को स्वचालित रूप से लोड करता है। [पर्यावरण चर](/hi/reference/environment-variables) देखें।

<a id="cheaperinference-zero-data-retention"></a>
### शून्य डेटा प्रतिधारण (Cheaper Inference)

`providers.cheaperinference.zeroDataRetention` वैकल्पिक है और डिफ़ॉल्ट रूप से बंद रहता है। इसे तब सेट करें जब इस प्रोजेक्ट को प्रॉम्प्ट केवल उन प्रोवाइडर के माध्यम से भेजने होंगे जो उन्हें नहीं रखते हैं।

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

फ़्लैग चालू होने पर, हर चैट अनुरोध में `"zdr": true` शामिल होता है, और `list-models`, `check-models`, और `suggest-models` (डैशबोर्ड के मॉडल्स टैब सहित) `GET /v1/models?zdr=true` पढ़ते हैं। वह कैटलॉग उन मॉडलों को सूचीबद्ध करता है जिनका उपयोग शून्य-डेटा-प्रतिधारण अनुरोध शून्य-डेटा-प्रतिधारण मूल्य पर कर सकता है। `check-models` उस कैटलॉग से गायब आईडी को अमान्य मानता है। फ़्लैग उस मॉडल के लिए कोई मार्ग नहीं बनाता जिसे कैटलॉग छोड़ देता है। उस आईडी को `translationModels`, `uiModels`, या `localeModels` से हटा दें।

फ़्लैग को बंद रहने दें जब Cheaper Inference खाते को शून्य डेटा प्रतिधारण की आवश्यकता नहीं है। यदि खाते के लिए [डेटा सुरक्षा](https://platform.cheaperinference.com/dashboard/data-protection) पहले से चालू है, तो Cheaper Inference फिर भी शून्य-डेटा-प्रतिधारण मार्ग के बिना किसी मॉडल को अस्वीकार कर देता है। त्रुटि उस मॉडल का नाम बताती है। खाता नीति बनाए रखने के लिए, `zeroDataRetention` को `true` पर सेट करें और शून्य-डेटा-प्रतिधारण कैटलॉग से किसी मॉडल पर स्विच करें। अस्वीकृत मॉडल को रखने के लिए, उस पृष्ठ पर शून्य डेटा प्रतिधारण बंद कर दें। फ़ॉलबैक चेन फिर अगले कॉन्फ़िगर किए गए मॉडल को आज़माती है।

<a id="model-fallback-chain"></a>
<a id="validate-and-compare-models"></a>
### मॉडल्स

मॉडल्स चुनना, फ़ॉलबैक लिस्ट, और `suggest-models`, `check-models`, `list-models`, और `bench-models` [एआई मॉडल्स](/hi/guide/ai-models) पर हैं।

<a id="multiple-providers"></a>
### एकाधिक प्रदाता

जब एक से अधिक प्रदाता कॉन्फ़िगर किए जाते हैं, तो डिफ़ॉल्ट का चयन करने के लिए शीर्ष-स्तरीय `provider` कुंजी सेट करें। कॉन्फ़िग को संपादित किए बिना प्रति रन स्विच करें:

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

प्रत्येक प्रदाता ब्लॉक अपनी स्वयं की `translationModels`, वैकल्पिक `uiModels` और `localeModels`, `maxTokens`, `temperature`, और `requestTimeout` (सेकंड) या `requestTimeoutMs` को परिभाषित कर सकता है। प्रदाता पर एक टाइमआउट शीर्ष-स्तरीय `requestTimeout` / `requestTimeoutMs` को ओवरराइड करता है। एक लेगेसी शीर्ष-स्तरीय `openrouter` ब्लॉक अभी भी स्वीकार किया जाता है और लोड होने पर `providers.openrouter` में स्वतः माइग्रेट हो जाता है।

वैकल्पिक `pricing` और `modelPricing` प्रति 1,000,000 टोकन (`inputPerMTokens` और `outputPerMTokens`) के लिए USD सेट करते हैं जब प्रदाता `usage.cost` को छोड़ देता है। `pricing` प्रदाता-व्यापी डिफ़ॉल्ट है; एक `modelPricing` प्रविष्टि इसे एक मॉडल id के लिए ओवरराइड करती है। OpenRouter और Cheaper Inference पहले से ही प्रति-कॉल लागत लौटाते हैं, इसलिए उन प्रदाताओं पर दोनों को अनसेट छोड़ दें। प्रदाता द्वारा रिपोर्ट की गई लागत को वैसे ही रखा जाता है जैसे वह लौटाई गई है। राशि को अनुवाद सारांश, [`usage`](/hi/reference/cli-commands/workflows#usage), और [Usage & costs](/hi/guide/translation-dashboard/usage) में शामिल किया गया है।

समान दस्तावेज़ पर चार प्रदाताओं के साथ चलाने योग्य उदाहरण, जिसमें नमूना दरें शामिल हैं: [`examples/multi-provider`](/hi/examples#multi-provider)।

<a id="further-reference"></a>
### आगे का संदर्भ

- [एआई मॉडल्स](/hi/guide/ai-models) — रैंक की गई शॉर्टलिस्ट, फ़ॉलबैक लिस्ट, और मॉडल कमांड्स।
- [कॉन्फ़िगरेशन — `provider` और `providers`](/hi/reference/configuration#provider-and-providers) — प्रीसेट टेबल, कस्टम एंडपॉइंट्स, रिक्वेस्ट टाइमआउट, कॉस्ट रेट्स, चीपर इंफ़्रेंस ज़ीरो डेटा रिटेंशन, OpenRouter-स्पेसिफ़िक बिहेवियर।
- [आर्किटेक्चर — एलएलएम क्लाइंट](/hi/reference/architecture) — मॉडल फ़ॉलबैक, बैचिंग, और कॉस्ट रिपोर्टिंग आंतरिक रूप से कैसे काम करते हैं।
- [एनवायरनमेंट वेरिएबल्स](/hi/reference/environment-variables) — API-की env vars और बेस-URL ओवरराइड्स।
