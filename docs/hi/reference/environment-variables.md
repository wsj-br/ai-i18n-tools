<a id="environment-variables"></a>
# पर्यावरण चर

<a id="provider-api-keys"></a>
## प्रदाता API कुंजियाँ

`init -P <provider>` नीचे दी गई तालिका में उस बिल्ट-इन प्रीसेट और एपीआई कुंजी का चयन करता है। एक प्रोवाइडर के लिए वेरिएबल नाम को `providers.<name>.apiKeyEnv` से ओवरराइड करें। ओलामा की कोई एपीआई कुंजी नहीं है।

| वेरिएबल | प्रदाता |
| --- | --- |
| `OPENROUTER_API_KEY` | `openrouter` |
| `OPENAI_API_KEY` | `openai` |
| `ANTHROPIC_API_KEY` | `anthropic` |
| `GOOGLE_API_KEY` | `gemini` |
| `DEEPSEEK_API_KEY` | `deepseek` |
| `CEREBRAS_API_KEY` | `cerebras` |
| `GROQ_API_KEY` | `groq` |
| `MISTRAL_API_KEY` | `mistral` |
| `XAI_API_KEY` | `xai` |
| `NVIDIA_API_KEY` | `nvidia` |
| `ALIBABA_API_KEY` | `alibaba` |
| `APIKEYFAN_API_KEY` | `apikeyfan` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

जब वह प्रदाता सक्रिय हो तो कुंजी आवश्यक है। `apikeyfan` के लिए, लेगेसी `APIFUN_API_KEY` तब स्वीकार किया जाता है जब `APIKEYFAN_API_KEY` अनसेट हो या खाली हो। एक कस्टम `apiKeyEnv` इस फ़ॉलबैक को अक्षम करता है। प्रीसेट यूआरएल: [बिल्ट-इन प्रदाता](/hi/guide/providers-and-models#built-in-providers)।

<a id="provider-base-urls"></a>
## प्रदाता बेस URL

ये दो वेरिएबल एक कॉन्फ़िगर किए गए प्रदाता के लिए `baseUrl` को ओवरराइड करते हैं। अन्य सभी प्रीसेट अपने URL को कॉन्फ़िगरेशन (`providers.<name>.baseUrl`) में बदलते हैं, न कि एनवायरनमेंट वेरिएबल के माध्यम से।

| वेरिएबल | ओवरराइड करता है |
| --- | --- |
| `OPENROUTER_BASE_URL` | `providers.openrouter.baseUrl` (केवल तब जब वह प्रदाता कॉन्फ़िगर किया गया हो) |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl` (केवल तब जब वह प्रदाता कॉन्फ़िगर किया गया हो) |

<a id="tool-and-run"></a>
## टूल और रन

| वेरिएबल | विवरण |
| --- | --- |
| `AI_I18N_LANG` | टूल के अपने UI (CLI सहायता, लॉग, डैशबोर्ड) के लिए भाषा। `-L` / `--ui-lang` द्वारा ओवरराइड किया जाता है; कॉन्फ़िगरेशन `uiLanguage` को ओवरराइड करता है। [टूल UI भाषा](/hi/guide/tool-ui-language) देखें। |
| `I18N_SOURCE_LOCALE`   | रनटाइम पर `sourceLocale` को ओवरराइड करें।                        |
| `I18N_TARGET_LOCALES`  | `targetLocales` को ओवरराइड करने के लिए अल्पविराम से अलग किए गए स्थानीयकरण कोड।  |
| `I18N_LOG_LEVEL`       | लॉगर स्तर (`debug`, `info`, `warn`, `error`)। अज्ञात मान (जिसमें `silent` शामिल है) `info` पर वापस गिरते हैं। |
| `NO_COLOR`             | जब `1` हो, लॉग आउटपुट में ANSI रंगों को अक्षम करें।              |
| `I18N_LOG_SESSION_MAX` | लॉग सत्र प्रति अधिकतम पंक्तियाँ (डिफ़ॉल्ट `5000`)।           |

जब कोई प्रोवाइडर एपीआई कुंजी सेट नहीं होती है, तो सीएलआई और `doctor` उस डायरेक्टरी से `.env` और `.env.local` पढ़ते हैं जिसमें `ai-i18n-tools.config.json` है। केवल ऊपर दी गई तालिकाओं में मौजूद वैरिएबल (एक कस्टम `providers.*.apiKeyEnv` के साथ) कॉपी किए जाते हैं, और केवल तभी जब वह वैरिएबल अनसेट हो। जब दोनों फ़ाइलें एक ही नाम सेट करती हैं, तो `.env.local` को प्राथमिकता मिलती है। एक चेतावनी फ़ाइल का नाम और उन वैरिएबल का नाम बताती है जो पढ़े गए थे। `doctor` एनवायरनमेंट सेक्शन में प्रति फ़ाइल एक चेतावनी दोहराता है और सारांश में प्रत्येक को गिनता है। वह चेतावनी 0 पर एग्जिट होती है, जब तक कि `--strict` सेट न हो, जो 1 पर एग्जिट होता है। एक त्रुटि 2 पर एग्जिट होती है। यदि किसी प्रोवाइडर एपीआई कुंजी का पहले से कोई मान है, तो कोई भी फ़ाइल नहीं पढ़ी जाती है।
