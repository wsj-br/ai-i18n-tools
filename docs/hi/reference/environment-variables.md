<a id="environment-variables"></a>
# पर्यावरण चर

| चर                    | विवरण                                                     |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` प्रदाता के लिए API कुंजी (जब यह सक्रिय हो तो आवश्यक)। डिफ़ॉल्ट `init` प्रीसेट। |
| अन्य प्रदाता कुंजी     | प्रत्येक प्रदाता अपनी स्वयं की कुंजी पर्यावरण चर पढ़ता है: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama को कोई आवश्यकता नहीं है)। प्रदाता के अनुसार `providers.<name>.apiKeyEnv` के साथ ओवरराइड करें। |
| `OPENROUTER_BASE_URL`  | `providers.openrouter.baseUrl` को ओवरराइड करें (केवल जब वह प्रदाता कॉन्फ़िगर किया गया हो)। |
| `OLLAMA_BASE_URL`      | `providers.ollama.baseUrl` को ओवरराइड करें (केवल जब वह प्रदाता कॉन्फ़िगर किया गया हो)। |
| `AI_I18N_LANG`         | उपकरण के अपने UI के लिए भाषा (CLI सहायता, लॉग, डैशबोर्ड)। `-L` / `--ui-lang` द्वारा ओवरराइड किया गया; कॉन्फ़िग `uiLanguage` को ओवरराइड करता है। [उपकरण UI भाषा](/hi/guide/tool-ui-language) देखें। |
| `I18N_SOURCE_LOCALE`   | रनटाइम पर `sourceLocale` को ओवरराइड करें।                        |
| `I18N_TARGET_LOCALES`  | `targetLocales` को ओवरराइड करने के लिए अल्पविराम से अलग किए गए स्थानीयकरण कोड।  |
| `I18N_LOG_LEVEL`       | लॉगर स्तर (`debug`, `info`, `warn`, `error`)। अज्ञात मान (जिसमें `silent` शामिल है) `info` पर वापस गिरते हैं। |
| `NO_COLOR`             | जब `1` हो, लॉग आउटपुट में ANSI रंगों को अक्षम करें।              |
| `I18N_LOG_SESSION_MAX` | लॉग सत्र प्रति अधिकतम पंक्तियाँ (डिफ़ॉल्ट `5000`)।           |

स्टार्टअप पर CLI वर्तमान कार्यशील निर्देशिका से एक `.env` फ़ाइल को स्वचालित रूप से लोड करता है (Node के `process.loadEnvFile` के माध्यम से), इसलिए प्रदाता API कुंजी गैर-इंटरैक्टिव शेल में उठाई जाती हैं जो `.envrc` / `direnv` को स्रोत नहीं करती हैं। पर्यावरण में पहले से मौजूद चर कभी भी ओवरराइड नहीं होते हैं, इसलिए वास्तविक CI/उत्पादन मान अभी भी जीतते हैं।
