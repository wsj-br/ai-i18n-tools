<a id="what-is-ai-i18n-tools"></a>
# ai-i18n-tools क्या है?

ai-i18n-tools एक कमांड-लाइन टूल और टूलकिट है जो आपके पसंदीदा LLM प्रदाता का उपयोग करके आपके ऐप और दस्तावेज़ों का अनुवाद करने में आपकी सहायता करता है। आप एक ही कॉन्फ़िग फ़ाइल से सब कुछ नियंत्रित करते हैं, यह चुनते हुए कि कौन सी अनुवाद सुविधाएँ सक्षम करनी हैं। आपको आवश्यक मोड को एक साथ चलाने के लिए "सिंक" कमांड का उपयोग करें।

<a id="translation-modes"></a>
## अनुवाद मोड

- **UI स्ट्रिंग्स** — JS/TS और Python सोर्स (और GNU gettext सहित समान मार्कर्स) से `t("…")` और `_()` कॉल्स को एक्सट्रैक्ट करें और फ्लैट प्रति-लोकेल JSON या `.po` / `.mo` कैटलॉग लिखें। कमांड्स: `extract`, `translate-ui`। गाइड: [UI strings](/hi/guide/ui-strings/)। Python: [Python applications](/hi/guide/ui-strings/python)।
- **दस्तावेज़** — `docs[].contentPaths` में सूचीबद्ध Markdown, MDX, और `.astro` पेजों का अनुवाद करें। VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, और अन्य स्टेटिक डॉक साइट्स के साथ काम करता है। कमांड: `translate-docs`। गाइड: [Documents](/hi/guide/documents/)।
- **JSON** — टॉप-लेवल `json[]` में परिभाषित नेस्टेड JSON लोकेल बंडल्स (थीम लेबल्स, i18n ओवरराइड्स, सोर्स में न होने वाली ऐप कॉपी) का अनुवाद करें। कमांड: `translate-json`। गाइड: [JSON](/hi/guide/json)।
- **SVG** — SVG इलस्ट्रेशन (`<text>`, `<title>`, `<desc>`) के अंदर दिखाई देने वाले टेक्स्ट का अनुवाद करें और प्रति लोकेल एक आउटपुट फ़ाइल लिखें। दस्तावेज़ अनुवाद से अलग — `translate-docs` SVG एसेट्स को संशोधित नहीं करता है। कमांड: `translate-svg`। गाइड: [SVG translation](/hi/guide/svg-translation/)।

सभी चार मोड सक्रिय [LLM प्रदाता](/hi/guide/providers-and-models) का उपयोग करते हैं, एक ही कॉन्फ़िग फ़ाइल साझा करते हैं, और एक SQLite कैश का पुन: उपयोग करते हैं ताकि पुनरावृत्ति केवल नए या बदले हुए टेक्स्ट को मॉडल पर भेजें।

<a id="which-should-i-use"></a>
## मुझे किसका उपयोग करना चाहिए?

| आपकी सामग्री | मोड | कमांड |
| --- | --- | --- |
| सोर्स कोड `t()`, `_()`, gettext, या HTML `data-i18n` मार्कर्स का उपयोग करता है | UI स्ट्रिंग्स | `extract` / `translate-ui` |
| स्थानीयकृत पृष्ठ या दस्तावेज़ साइटें | दस्तावेज़ | `translate-docs` |
| स्टैंडअलोन नेस्टेड JSON स्थानीय फ़ाइलें | JSON | `translate-json` |
| SVG में लेबल वाले आरेख या चित्र | SVG | `translate-svg` |

कई प्रोजेक्ट मोड को जोड़ते हैं — उदाहरण के लिए VitePress साइट के लिए UI स्ट्रिंग्स और दस्तावेज़, या सचित्र गाइड के लिए दस्तावेज़ और SVG। स्केफोल्ड टेम्प्लेट के लिए [त्वरित प्रारंभ](/hi/guide/quick-start) और पूर्ण कॉन्फ़िग स्कीमा के लिए [कॉन्फ़िगरेशन](/hi/reference/configuration) देखें।

<a id="examples"></a>
## उदाहरण

रिपॉजिटरी `examples/` के तहत चलाने योग्य उदाहरण प्रोजेक्ट भेजता है — प्रत्येक अपनी कॉन्फ़िग, प्रतिबद्ध स्थानीय आउटपुट और README के साथ। आप बिना API कुंजी के अनुवादित फ़ाइलों का पता लगा सकते हैं; अनुवाद को फिर से चलाने के लिए एक प्रदाता कुंजी की आवश्यकता होती है (देखें [प्रदाता और मॉडल](/hi/guide/providers-and-models))।

| उदाहरण | यह क्या दिखाता है |
| --- | --- |
| [कंसोल-ऐप](/hi/examples#console-app) | सबसे छोटा एंड-टू-एंड ऐप: `t()` UI स्ट्रिंग्स प्लस README अनुवाद |
| [नेक्स्टजेएस-ऐप](/hi/examples#nextjs-app) | नेक्स्ट.जेएस UI, बहुवचन, SVG, नेस्टेड डोक्यूसौरस डॉक्स, फ्लैट README, डैशबोर्ड |
| [डोक्यूसौरस-डॉक्स](/hi/examples#docusaurus-docs) | स्टैंडअलोन डोक्यूसौरस दस्तावेज़ साइट |
| [एस्ट्रो-वेबसाइट](/hi/examples#astro-website) | एस्ट्रो मार्केटिंग साइट: पूर्ण-पृष्ठ HTML अनुवाद प्लस `t()` स्ट्रिंग्स |
| [एस्ट्रो-डॉक्स](/hi/examples#astro-docs) | एस्ट्रो स्टारलाइट दस्तावेज़ साइट |
| [वाइटप्रेस-डॉक्स](/hi/examples#vitepress-docs) | वाइटप्रेस डॉक्स प्लस थीम कैटलॉग |
| [नेक्स्ट्रा-डॉक्स](/hi/examples#nextra-docs) | नेक्स्ट्रा डॉक्स प्लस `_meta.ts` साइडबार लेबल और थीम डिक्शनरी |
| [फ्यूमाडॉक्स-डॉक्स](/hi/examples#fumadocs-docs) | फ्यूमाडॉक्स डॉक्स प्लस `meta.json` साइडबार लेबल और यूआई कैटलॉग |
| [plain-html](/hi/examples#plain-html) | `data-i18n*` मार्कर और लोकेल JSON के साथ स्थैतिक HTML |
| [मल्टी-प्रोवाइडर](/hi/examples#multi-provider) | एक ही दस्तावेज़ पर एलएलएम प्रोवाइडर की तुलना करें |
| [टेस्ट-मार्कडाउन](/hi/examples#test-markdown) | मार्कडाउन पाइपलाइन स्ट्रेस टेस्ट (सीजेके, देवनागरी, एज केस) |
| [intlayer-migration](/hi/examples#intlayer-migration) | Intlayer `.content.ts` → `t()` `migrate-intlayer` के माध्यम से |
| [python-streamlit](/hi/examples#python-streamlit) | Streamlit डैशबोर्ड, `t()` / `_()`, इंग्लिश-की JSON |
| [python-flask](/hi/examples#python-flask) | Flask + Jinja, `t()` / `_()`, इंग्लिश-की JSON |
| [python-fastapi](/hi/examples#python-fastapi) | FastAPI, रिक्वेस्ट-स्कोप लोकेल, इंग्लिश-की JSON |
| [python-gettext](/hi/examples#python-gettext) | मौजूदा GNU gettext; `extract` / `translate-ui` रिफ्रेश `.po` और `.mo` |

`npx degit` कॉपी कमांड और चुनने के लिए गाइड के लिए [उदाहरण](/hi/examples) देखें।

<a id="next-steps"></a>
## अगले चरण

1. [Installation](/hi/guide/installation) — npm पैकेज इंस्टॉल करें, या Python प्रोजेक्ट के लिए [standalone executable](/hi/guide/installation#standalone-executables) डाउनलोड करें, और अपनी प्रोवाइडर API की सेट करें।
2. [Quick start](/hi/guide/quick-start) — कॉन्फ़िगरेशन को स्कैफ़ोल्ड करें और अपना पहला अनुवाद चलाएं।
3. [Providers and models](/hi/guide/providers-and-models) — एक प्रोवाइडर, मॉडल फ़ॉलबैक चेन, और `-P` ओवरराइड चुनें।
