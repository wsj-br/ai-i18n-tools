<a id="integrations"></a>
# इंटीग्रेशन

डॉक्यूमेंटेशन साइटों और एस्ट्रो प्रोजेक्ट्स में ai-i18n-tools को जोड़ने के लिए फ्रेमवर्क-विशिष्ट गाइड। प्रत्येक इंटीग्रेशन पेज सामग्री के लिए [डॉक्यूमेंट्स](/hi/guide/documents/) पाइपलाइन (`translate-docs` / `sync`) का उपयोग करता है; शेल स्ट्रिंग्स (नेविगेशन, साइडबार, थीम) को उसी पाइपलाइन के भीतर संभाला जाता है जहाँ नोट किया गया है — अलग [JSON](/hi/guide/json) पाइपलाइन के माध्यम से नहीं।

<a id="which-guide-to-read"></a>
## कौन सी गाइड पढ़ें

| आपकी साइट | प्रारंभिक टेम्पलेट | यहां से शुरू करें |
| --- | --- | --- |
| एस्ट्रो स्टारलाइट या सादा एस्ट्रो | `ui-starlight` / हाइब्रिड UI स्ट्रिंग्स | [एस्ट्रो](/hi/guide/integrations/astro) |
| डॉक्यूसॉरस | `ui-docusaurus` | [डॉक्यूसॉरस](/hi/guide/integrations/docusaurus) |
| वाइटप्रेस | `ui-vitepress` | [वाइटप्रेस](/hi/guide/integrations/vitepress) |
| नेक्सट्रा 4 (नेक्स्ट.जेएस ऐप राउटर) | `ui-nextra` | [नेक्सट्रा](/hi/guide/integrations/nextra) |
| फुमाडॉक्स 4 (नेक्स्ट.जेएस ऐप राउटर) | `ui-fumadocs` | [फुमाडॉक्स](/hi/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## साझा अवधारणाएं

सभी डॉक्यूमेंटेशन-फ्रेमवर्क इंटीग्रेशन [डॉक्यूमेंट्स](/hi/guide/documents/) में वर्णित समान `docs[]` ब्लॉक मॉडल साझा करते हैं। अपने फ्रेमवर्क (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, या `"astro-starlight"`) से मिलान करने के लिए `docsOutput.style` सेट करें। आउटपुट फ़ोल्डर लेआउट और लिंक रीराइटिंग व्यवहार के लिए, [आउटपुट लेआउट](/hi/guide/documents/output-layouts) और [लिंक रीराइटिंग](/hi/guide/documents/link-rewriting) देखें।

प्रत्येक `init -t ui-*` टेम्पलेट एक डिफ़ॉल्ट LLM प्रदाता ब्लॉक (`openrouter` जब तक आप `-P <provider>` पास नहीं करते) को स्कैफ़ोल्ड करता है। `translate-docs` या `sync` से पहले, यदि आवश्यक हो तो `provider` / `providers` को कॉन्फ़िगर करें और मिलान करने वाली API कुंजी सेट करें — [प्रदाता और API कुंजी](/hi/guide/quick-start#provider-and-api-key) देखें।

क्रॉस-फ्रेमवर्क तुलना के लिए [फ्रेमवर्क शेल अनुवाद](#framework-shell-translation) देखें। नीचे दिया गया प्रत्येक लिंक किया गया गाइड उस फ्रेमवर्क के लिए सेटअप को कवर करता है।

<a id="framework-shell-translation"></a>
## फ्रेमवर्क शेल अनुवाद

| फ्रेमवर्क | शेल / थीम स्ट्रिंग्स | पाइपलाइन |
|-----------|----------------------|----------|
| डॉक्यूसॉरस | `write-translations` कैटलॉग (`{ message, description }`) | डॉक्यूमेंट्स — `docs[].docusaurusCatalogDir` + `translate-docs` |
| वाइटप्रेस | थीम/नेविगेशन/साइडबार कैटलॉग | डॉक्यूमेंट्स — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| नेक्सट्रा | `_meta.ts` साइडबार लेबल | डॉक्यूमेंट्स — `style: "nextra"` + `translate-docs` होने पर ऑटो |
| नेक्सट्रा | थीम डिक्शनरी `.ts` | डॉक्यूमेंट्स — `docs[].nextraDictionaryPath` + `translate-docs` |
| फुमाडॉक्स | `meta.json` साइडबार लेबल | डॉक्यूमेंट्स — `style: "fumadocs"` + `translate-docs` होने पर ऑटो |
| फुमाडॉक्स | UI ओवरराइड कैटलॉग | डॉक्यूमेंट्स — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| एस्ट्रो स्टारलाइट | बिल्ट-इन UI स्ट्रिंग्स (कई लोकेल); कोई अतिरिक्त शेल पाइपलाइन नहीं | डॉक्यूमेंट्स — `translate-docs` (केवल पेज) |

फ्रेमवर्क शेल/थीम स्ट्रिंग्स को `json[]` में **न** डालें — वह पाइपलाइन असंबंधित ऐप लोकेल बंडलों के लिए है। प्रति-फ्रेमवर्क सेटअप विवरण [कौन सा गाइड पढ़ना है](#which-guide-to-read) से लिंक किए गए गाइड में हैं।

<a id="runnable-examples"></a>
## चलाने योग्य उदाहरण

| फ़्रेमवर्क | उदाहरण रेपो |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| सामान्य Astro वेबसाइट | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
