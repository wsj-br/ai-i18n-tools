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
| `APIFUN_API_KEY` | `apifun` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

जब वह प्रदाता सक्रिय होता है तो कुंजी आवश्यक होती है। प्रीसेट URL: [Built-in providers](/hi/guide/providers-and-models#built-in-providers)।

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

स्टार्टअप पर सीएलआई वर्तमान कार्यशील डायरेक्टरी से एक `.env` फ़ाइल को (नोड के `process.loadEnvFile` के माध्यम से) स्वतः लोड भी करता है, ताकि प्रोवाइडर एपीआई कुंजियाँ उन गैर-इंटरैक्टिव शेल में लोड हो जाएँ जो `direnv` के माध्यम से `.envrc` को लोड नहीं करते हैं। वातावरण में पहले से मौजूद वैरिएबल कभी ओवरराइड नहीं होते हैं, इसलिए वास्तविक CI/प्रोडक्शन मानों को प्राथमिकता मिलती है।
