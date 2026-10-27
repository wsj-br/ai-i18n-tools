<a id="add-i18n-to-a-website-or-docs-site"></a>
# किसी वेबसाइट या दस्तावेज़ साइट में i18n जोड़ें

यह पेज एक भाषा में एक डॉक्यूमेंटेशन साइट (Markdown या MDX) या मार्केटिंग या स्टैटिक साइट (एक Astro वेबसाइट या प्लेन HTML) के लिए है। यह टूल आपके LLM प्रोवाइडर पर मौजूद मॉडल के साथ आपके पेज के कंटेंट का अनुवाद करता है और हर भाषा के लिए एक स्थानीय कॉपी लिखता है। आपका साइट फ्रेमवर्क उन कॉपियों को सर्व करता है और भाषा स्विचर प्रदान करता है।

ऐसे ऐप के लिए जिसके UI स्ट्रिंग `t()` कॉल में रहते हैं, इसके बजाय [JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) या [पायथन ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) का उपयोग करें।

<a id="what-do-you-have"></a>
## आपके पास क्या है?

| आपकी साइट | प्रारंभिक टेम्पलेट | यहां से शुरू करें |
| --- | --- | --- |
| एस्ट्रो स्टारलाइट या सादा एस्ट्रो | `ui-starlight` / हाइब्रिड UI स्ट्रिंग्स | [एस्ट्रो](/hi/guide/integrations/astro) |
| डॉक्यूसॉरस | `ui-docusaurus` | [डॉक्यूसॉरस](/hi/guide/integrations/docusaurus) |
| वाइटप्रेस | `ui-vitepress` | [वाइटप्रेस](/hi/guide/integrations/vitepress) |
| नेक्सट्रा 4 (नेक्स्ट.जेएस ऐप राउटर) | `ui-nextra` | [नेक्सट्रा](/hi/guide/integrations/nextra) |
| फुमाडॉक्स 4 (नेक्स्ट.जेएस ऐप राउटर) | `ui-fumadocs` | [फुमाडॉक्स](/hi/guide/integrations/fumadocs) |
| सादे एचटीएमएल पेज | `ui-plain-html` या `docs-plain-html` | [सादे एचटीएमएल ऐप](/hi/guide/ui-strings/plain-html) |
| कोई साइट फ्रेमवर्क नहीं, केवल एक README और मार्कडाउन फ़ाइलें | `docs-markdown`, या कोई भी टेम्प्लेट और `--with-readme` | [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) |

<details class="agent-prompt">
<summary>एजेंट प्रॉम्प्ट</summary>

- एस्ट्रो स्टारलाइट: केवल नोट्स। एस्ट्रो `t()` फ़ाइलें: [JS/TS प्रॉम्प्ट](/hi/guide/add-i18n-to-js#agent-prompt) (i18next छोड़ें)।
- डॉक्यूसॉरस: केवल नोट्स (`<Translate>` डॉक्यूसॉरस का अपना एपीआई है)।
- वाइटप्रेस: [थीम कैटलॉग प्रॉम्प्ट](/hi/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)।
- नेक्सट्रा: [डिक्शनरी प्रॉम्प्ट](/hi/guide/integrations/nextra#agent-prompt-dictionary) और [हाइब्रिड `t()` प्रॉम्प्ट](/hi/guide/integrations/nextra#optional-t-for-app-react-hybrid)।
- फुमाडॉक्स: [UI कैटलॉग प्रॉम्प्ट](/hi/guide/integrations/fumadocs#agent-prompt)।
- README और मार्कडाउन फ़ाइलें: [README प्रॉम्प्ट](/hi/guide/add-i18n-to-readme#agent-prompt)।

</details>

<a id="steps"></a>
## चरण

हर फ्रेमवर्क के लिए समान आकार काम करता है; विवरण ऊपर दिए गए फ्रेमवर्क गाइड में हैं।

1. सीएलआई इंस्टॉल करें और एपीआई कुंजी सेट करें: [इंस्टॉलेशन](/hi/guide/installation), [प्रदाता और एपीआई कुंजी](/hi/guide/quick-start#provider-and-api-key)।
2. स्केफोल्ड: `ai-i18n-tools init -t <template> -P <provider>`।
3. `sourceLocale`, `targetLocales`, और `docs[].contentPaths` सेट करें (आपके स्रोत भाषा में लिखे गए पेज और फ़ोल्डर)। `sourceLocale` कोई भी भाषा हो सकती है। फ्रेमवर्क गाइड सही `docsOutput.style` दिखाता है।
4. अपने फ्रेमवर्क के स्वयं के i18n को सक्षम करें ताकि यह स्थानीयकृत पेजों को परोस सके और लिंक कर सके। प्रत्येक गाइड में "मौजूदा साइट में i18n सक्षम करें" अनुभाग है: [वाइटप्रेस](/hi/guide/integrations/vitepress#enable-i18n-in-an-existing-site), [डॉक्यूसॉरस](/hi/guide/integrations/docusaurus#enable-i18n-in-an-existing-site), [नेक्सट्रा](/hi/guide/integrations/nextra#enable-i18n-in-an-existing-site), [फुमाडॉक्स](/hi/guide/integrations/fumadocs#enable-i18n-in-an-existing-site), [एस्ट्रो](/hi/guide/integrations/astro#enable-i18n-in-an-existing-site)।
5. `ai-i18n-tools sync` (या `translate-docs`) चलाएँ, फिर साइट बनाएँ।
6. ब्राउज़र में एक स्थानीयकृत मार्ग की जाँच करें। फ्रेमवर्क का अपना लोकल ड्रॉपडाउन स्विचर है। README जैसी एक सपाट मार्कडाउन फ़ाइल के लिए, [languageListBlock](/hi/guide/documents/language-switcher) के साथ एक लिंक पंक्ति जोड़ें।

<a id="what-gets-translated"></a>
## क्या अनुवादित होता है

पेज बॉडी हमेशा [दस्तावेज़](/hi/guide/documents/) पाइपलाइन से गुजरती हैं। फ्रेमवर्क क्रोम (नेविगेशन, साइडबार, थीम लेबल) को उसी रन में संभाला जाता है जहाँ फ्रेमवर्क इसका समर्थन करता है, अलग [JSON](/hi/guide/json) पाइपलाइन के माध्यम से नहीं।

| फ्रेमवर्क | शेल और थीम स्ट्रिंग | कैसे |
| --- | --- | --- |
| डॉक्यूसॉरस | `write-translations` कैटलॉग (`{ message, description }`) | `docs[].docusaurusCatalogDir` और `translate-docs` |
| वाइटप्रेस | थीम, नेविगेशन और साइडबार कैटलॉग | `docsOutput.vitepressThemeCatalog` और `translate-docs` |
| नेक्सट्रा | `_meta.ts` साइडबार लेबल | `style: "nextra"` के साथ स्वचालित |
| नेक्सट्रा | थीम डिक्शनरी `.ts` | `docs[].nextraDictionaryPath` |
| फुमाडॉक्स | `meta.json` साइडबार लेबल | `style: "fumadocs"` के साथ स्वचालित |
| Fumadocs | UI ओवरराइड कैटलॉग | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | कई लोकेल में अंतर्निहित UI स्ट्रिंग्स | केवल पृष्ठ |

छवियां और स्क्रीनशॉट `translate-docs` द्वारा अनुवादित नहीं होते हैं। लोकेल-विशिष्ट फ़ाइलों के लिए, [छवियां और स्क्रीनशॉट](/hi/guide/images-and-screenshots/) देखें।

<a id="plain-html"></a>
## सादा HTML

दो विकल्प, इस बात पर निर्भर करता है कि पृष्ठ को कैसे व्यवहार करना चाहिए:

- एक पृष्ठ जो ब्राउज़र में भाषा बदलता है: पाठ को `data-i18n*` एट्रिब्यूट के साथ चिह्नित करें और UI स्ट्रिंग्स रनटाइम (`ui-plain-html`) का उपयोग करें। [सादे HTML ऐप्स](/hi/guide/ui-strings/plain-html) देखें।
- प्रति लोकेल एक अनुवादित HTML फ़ाइल: डॉक्यूमेंट्स पाइपलाइन (`docs-plain-html`) का उपयोग करें। [HTML पृष्ठ](/hi/guide/documents/html-pages) देखें।

एक फ़ाइल एक पाथ से संबंधित है।

<a id="not-your-case"></a>
## आपका मामला नहीं?

- ऐप UI स्ट्रिंग्स: [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) या [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python)।
- साइट के बगल में एक रिपॉजिटरी README, या मार्कडाउन फ़ाइलें और कोई साइट फ़्रेमवर्क नहीं: [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)। `init … --with-readme` उस ब्लॉक को साइट टेम्पलेट के बगल में जोड़ता है।
- स्टैंडअलोन नेस्टेड लोकेल JSON: [JSON](/hi/guide/json)।
- एक साइट और ऐप स्ट्रिंग्स दोनों का अनुवाद करना: [पाइपलाइनों का संयोजन](/hi/guide/combining-pipelines)।

साझा विकल्पों और प्रति-फ़्रेमवर्क अंतर के लिए संदर्भ: [एकीकरण](/hi/guide/integrations/)।
