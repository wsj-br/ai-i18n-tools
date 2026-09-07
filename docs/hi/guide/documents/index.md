<a id="documents"></a>
# दस्तावेज़

मुख्य रूप से `.astro` कॉन्फ़िग ब्लॉक के माध्यम से प्रबंधित **मार्कडाउन, MDX और `docs[]` दस्तावेज़ों** के लिए डिज़ाइन किया गया। प्रत्येक ब्लॉक का `contentPaths` फ़ील्ड अनुवाद करने के लिए फ़ाइलों या फ़ोल्डरों को सूचीबद्ध करता है।

[Docusaurus](/hi/guide/integrations/docusaurus) साइटों पर, `docusaurusCatalogDir` को अपने `write-translations` कैटलॉग फ़ोल्डर (जैसे `docs-site/i18n/en`) पर भी सेट करें। फिर `translate-docs` में शेल JSON भी शामिल है - नेविगेशन बार, फ़ुटर और थीम स्ट्रिंग।

[VitePress](/hi/guide/integrations/vitepress) साइटों पर, पेज बॉडी एक ही `docs[]` पाइपलाइन का उपयोग करते हैं। नेविगेशन, साइडबार और फ़ुटर लेबल `docsOutput.vitepressThemeCatalog` में रहते हैं - `translate-docs` अंग्रेजी कैटलॉग को बूटस्ट्रैप करता है और इसे पेजों के साथ अनुवाद करता है, कोई अलग पाइपलाइन नहीं।

[Nextra](/hi/guide/integrations/nextra) साइटों पर, पेज बॉडी `docsOutput.style: "nextra"` के साथ एक ही `docs[]` पाइपलाइन का उपयोग करते हैं। `_meta.ts` साइडबार लेबल `translate-docs` द्वारा स्वचालित रूप से एकत्र और अनुवादित किए जाते हैं; थीम डिक्शनरी स्ट्रिंग उसी पाइपलाइन में `docs[].nextraDictionaryPath` के माध्यम से अनुवादित होते हैं।

[Fumadocs](/hi/guide/integrations/fumadocs) साइटों पर, पेज बॉडी `fumadocsParser` `"dot"` (डिफ़ॉल्ट) या `"dir"` के साथ `docsOutput.style: "fumadocs"` का उपयोग करते हैं। `meta.json` साइडबार लेबल स्वचालित रूप से एकत्र किए जाते हैं; UI ओवरराइड `docsOutput.fumadocsUiCatalog` के माध्यम से अनुवादित होते हैं।

[Astro Starlight](/hi/guide/integrations/astro#astro-starlight) साइटों पर, पेज बॉडी आपके Starlight सामग्री रूट (आमतौर पर `src/content/docs/`) पर `docsRoot` के साथ `docsOutput.style: "astro-starlight"` का उपयोग करते हैं। `translate-docs` अंग्रेजी ट्री के बगल में `src/content/docs/<locale>/` के तहत स्थानीयकृत मार्कडाउन/MDX लिखता है। Starlight कई लोकेल के लिए अंतर्निहित UI स्ट्रिंग भेजता है — कोई अलग थीम कैटलॉग पाइपलाइन नहीं; वैकल्पिक UI ओवरराइड `src/content/i18n/en.json` के लिए `docs[]` ब्लॉक पर `jsonPathTemplate` का उपयोग कर सकते हैं।

मार्कडाउन में एम्बेडेड PNG और अन्य रास्टर छवियों के लिए, [छवियां और स्क्रीनशॉट](/hi/guide/images-and-screenshots/) देखें। `translate-docs` केवल वैकल्पिक टेक्स्ट का अनुवाद करता है; यह रास्टर फ़ाइलों की प्रतिलिपि नहीं बनाता है।

README या दस्तावेज़ों में एक वैकल्पिक **भाषा स्विचर** ब्लॉक के लिए, `docsOutput.style` को `"flat"` पर सेट करें - [भाषा स्विचर](/hi/guide/documents/language-switcher) देखें।

[SVG](/hi/guide/svg-translation/) फ़ाइलें [`translate-svg`](/hi/reference/cli-commands/content#translate-svg) के माध्यम से अनुवादित की जाती हैं जब `features.translateSVG` सक्षम होता है - `docs[]` / `contentPaths` के माध्यम से नहीं।

एक दस्तावेज़ फ्रेमवर्क के शेल/थीम स्ट्रिंग से असंबंधित मनमानी नेस्टेड UI JSON बंडल [JSON](/hi/guide/json) पाइपलाइन में होते हैं, न कि `docs[]` में।

UI और दस्तावेज़ों के बीच **शब्दावली की निरंतरता** के लिए, `glossary.uiGlossary` को अपने `strings.json` पाथ पर सेट करें — `translate-docs` मौजूदा UI अनुवादों को LLM प्रॉम्प्ट में संकेत के रूप में पुन: उपयोग करता है जब सेगमेंट में मिलान करने वाले शब्द दिखाई देते हैं। वैकल्पिक `glossary.userGlossary` उत्पाद शब्दों के लिए CSV ओवरराइड जोड़ता है (जो `translate-ui` और `proofread-ui` के साथ साझा किए जाते हैं)। संकीर्ण कॉलम में फिट होने के लिए उपयोग किए जाने वाले कॉम्पैक्ट UI-लेबल संक्षिप्ताक्षर (उदाहरण के लिए `Size` → `Tam`) UI अनुवाद के लिए उपलब्ध रहते हैं लेकिन दस्तावेज़ शब्दावली संकेतों से हटा दिए जाते हैं। `glossary-generate` के साथ एक स्टार्टर CSV जनरेट करें, ट्रांसलेशन डैशबोर्ड **शब्दावली** टैब में पंक्तियों को संपादित करें, या [कॉन्फ़िगरेशन — `glossary`](/hi/reference/configuration#glossary) और [शब्दावली](/hi/guide/translation-dashboard/glossary) देखें।

<a id="per-locale-model-overrides"></a>
### प्रति-स्थानीय मॉडल ओवरराइड

`translate-docs` और `sync` का दस्तावेज़ चरण मॉडल को **प्रति लक्ष्य लोकेल** हल करता है: कॉन्फ़िगर होने पर पहले `localeModels(locale)`, फिर प्रदाता की वैश्विक `translationModels` श्रृंखला। इसका उपयोग तब करें जब किसी विशिष्ट भाषा को आपकी डिफ़ॉल्ट फ़ॉलबैक सूची से भिन्न मॉडल की आवश्यकता हो - उदाहरण के लिए, जब वैश्विक श्रृंखला पुर्तगाली के साथ संघर्ष करती है तो `pt-BR` दस्तावेज़ों के लिए जेमिनी को प्राथमिकता देना। [प्रदाता और मॉडल](/hi/guide/providers-and-models#model-fallback-chain) और [कॉन्फ़िगरेशन - `localeModels`](/hi/reference/configuration#provider-and-providers) देखें।

<a id="which-guide-to-read"></a>
## कौन सी गाइड पढ़ें

| आपका सेटअप | यहां से शुरू करें |
| --- | --- |
| Docusaurus साइट | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/hi/guide/integrations/docusaurus) |
| VitePress साइट | `init -t ui-vitepress` + थीम के लिए `vitepressThemeCatalog` - [VitePress](/hi/guide/integrations/vitepress) |
| Nextra साइट | `init -t ui-nextra` + डिक्शनरी के लिए `nextraDictionaryPath` (साइडबार `_meta.ts` स्वचालित है) - [Nextra](/hi/guide/integrations/nextra) |
| Fumadocs साइट | `init -t ui-fumadocs` + UI के लिए `fumadocsUiCatalog` (साइडबार `meta.json` स्वचालित है) - [Fumadocs](/hi/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/hi/guide/integrations/astro#astro-starlight) |
| फ़्लैट दस्तावेज़ (README, चेंजलॉग, आदि) | `docsOutput.style = "flat"` - [आउटपुट लेआउट](/hi/guide/documents/output-layouts), वैकल्पिक [भाषा स्विचर](/hi/guide/documents/language-switcher) |
| जहाँ अनुवादित फ़ाइलें आती हैं | [आउटपुट लेआउट](/hi/guide/documents/output-layouts) |
| क्रॉस-पेज `#anchor` लिंक | [एंकर लिंक](/hi/guide/documents/anchor-links) |
| लिंक और एसेट URL रीराइटिंग (`regexAdjustments`) | [लिंक रीराइटिंग](/hi/guide/documents/link-rewriting) |
| दस्तावेज़ों में स्क्रीनशॉट | [छवियाँ और स्क्रीनशॉट](/hi/guide/images-and-screenshots/) |
| उत्पाद शब्दावली और UI/दस्तावेज़ संगति | [कॉन्फ़िगरेशन — `glossary`](/hi/reference/configuration#glossary), [शब्दावली](/hi/guide/translation-dashboard/glossary) |
| `translate-docs` फ़्लैग और कैश | [CLI विकल्प](/hi/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## चरण 1: दस्तावेज़ों के लिए आरंभ करें

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
```

एस्ट्रो स्टारलाइट दस्तावेज़ साइटों के लिए:

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
```

वाइटप्रेस दस्तावेज़ साइटों के लिए:

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
```

नेविगेशन/साइडबार/फ़ुटर स्ट्रिंग के लिए `docsOutput.vitepressThemeCatalog` सेट करें - [वाइटप्रेस इंटीग्रेशन](/hi/guide/integrations/vitepress) देखें।

नेक्स्ट्रा दस्तावेज़ साइटों के लिए:

```bash
ai-i18n-tools init -t ui-nextra [-P <provider>]
```

थीम डिक्शनरी स्ट्रिंग के लिए `docs[].nextraDictionaryPath` सेट करें - [नेक्स्ट्रा इंटीग्रेशन](/hi/guide/integrations/nextra) देखें। साइडबार `_meta.ts` लेबल स्वचालित रूप से एकत्र किए जाते हैं।

फ़ुमाडॉक्स दस्तावेज़ साइटों के लिए:

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
```

UI ओवरराइड के लिए `docsOutput.fumadocsUiCatalog` सेट करें - [फ़ुमाडॉक्स इंटीग्रेशन](/hi/guide/integrations/fumadocs) देखें। साइडबार `meta.json` लेबल स्वचालित रूप से एकत्र किए जाते हैं।

सादे एस्ट्रो वेबसाइट UI के लिए (कोई स्टारलाइट नहीं):

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
```

वह टेम्पलेट केवल UI निष्कर्षण को सक्षम करता है। पेज HTML अनुवाद के लिए, `features.translateDocs` भी सेट करें और एक `docs[]` ब्लॉक जोड़ें ([एस्ट्रो वेबसाइट पेज (पार्स-और-रिप्लेस)](/hi/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace) देखें)। [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) कॉन्फ़िग दोनों पाइपलाइन एक साथ दिखाता है।

जनरेट किए गए `ai-i18n-tools.config.json` को संपादित करें:

- `provider` और `providers` — `init` एक डिफ़ॉल्ट प्रदाता ब्लॉक को स्केफ़ोल्ड करता है (`openrouter` जब तक आप `-P <provider>` पास नहीं करते); कम से कम एक प्रदाता को कॉन्फ़िगर करें और `translate-docs` या `sync` से पहले उसकी API कुंजी सेट करें (ओलामा को किसी कुंजी की आवश्यकता नहीं है)। [प्रदाता और API कुंजी](/hi/guide/quick-start#provider-and-api-key) और [LLM प्रदाता और मॉडल](/hi/guide/providers-and-models) देखें।
- `sourceLocale` - स्रोत भाषा (`docusaurus.config.js` में `defaultLocale` से मेल खाना चाहिए)।
- `targetLocales` - BCP-47 लोकेल कोड का सरणी (जैसे `["de", "fr", "es"]`)।
- `cacheDir` - सभी पाइपलाइनों के लिए साझा SQLite कैश निर्देशिका (और `--write-logs` के लिए डिफ़ॉल्ट लॉग निर्देशिका)।
- `docs` - दस्तावेज़ ब्लॉकों का सरणी। प्रत्येक ब्लॉक में वैकल्पिक `description`, `contentPaths` (स्ट्रिंग या सरणी; फ़ाइल, निर्देशिका, या ग्लोब), `outputDir`, वैकल्पिक `docusaurusCatalogDir`, `docsOutput`, वैकल्पिक `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, आदि होते हैं।
- `docs[].description` - रखरखावकर्ताओं के लिए वैकल्पिक छोटा नोट। जब सेट किया जाता है, तो यह `translate-docs` हेडलाइन और `status` अनुभाग शीर्षकों में दिखाई देता है।
- `docs[].contentPaths` - मार्कडाउन/MDX/`.astro` स्रोत (और डोक्यूसौरस शेल JSON के लिए वैकल्पिक `docusaurusCatalogDir`)।
- `docs[].outputDir` - उस ब्लॉक के लिए अनुवादित आउटपुट रूट।
- `docs[].docsOutput.style` - `"nested"` (डिफ़ॉल्ट), `"flat"`, `"doc-system"`, या उपनाम `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` (देखें [आउटपुट लेआउट](/hi/guide/documents/output-layouts)).
- `glossary.uiGlossary` - `strings.json` का पाथ ताकि दस्तावेज़ खंडों को आपकी UI कैटलॉग से शब्दावली संकेत मिलें (देखें [कॉन्फ़िगरेशन — `glossary`](/hi/reference/configuration#glossary)).
- `glossary.userGlossary` - निश्चित उत्पाद-शब्द अनुवादों के लिए वैकल्पिक CSV; UI पाइपलाइन द्वारा भी उपयोग किया जाता है और [शब्दावली](/hi/guide/translation-dashboard/glossary) डैशबोर्ड टैब में संपादन योग्य है।

**प्राथमिक बनाम अनुपूरक:** स्थानीयकृत पृष्ठों के लिए `contentPaths` पर ध्यान दें। जब आपको `write-translations` से Docusaurus शेल JSON की भी आवश्यकता हो तो `docusaurusCatalogDir` सेट करें। यदि आप केवल पृष्ठों का अनुवाद करते हैं तो `docusaurusCatalogDir` को छोड़ दें।

<a id="step-2-translate-documents"></a>
## चरण 2: दस्तावेज़ों का अनुवाद करें

```bash
ai-i18n-tools translate-docs
```

यह प्रत्येक `docs[]` ब्लॉक के `contentPaths` (और Docusaurus कैटलॉग JSON जब `docusaurusCatalogDir` सेट हो) में सभी फ़ाइलों को सभी प्रभावी दस्तावेज़ स्थानीयकरणों में अनुवादित करता है। पहले से अनुवादित खंड SQLite कैश से परोसे जाते हैं - केवल नए या बदले गए खंड LLM को भेजे जाते हैं।

एकल स्थानीयकरण का अनुवाद करने के लिए:

```bash
ai-i18n-tools translate-docs --locale de
```

यह जांचने के लिए कि क्या अनुवाद करने की आवश्यकता है:

```bash
ai-i18n-tools status
```

फ़्लैग, कैश व्यवहार और बैच प्रॉम्प्ट प्रारूप के लिए, [CLI विकल्प](/hi/guide/documents/cli-options) देखें।

<a id="complex-markdown-and-failed-quality-checks"></a>
## जटिल मार्कडाउन और विफल गुणवत्ता जांच

`translate-docs` जाँचता है कि प्रत्येक अनुवादित खंड मार्कडाउन संरचना (दस्तावेज़ से पार्स किए गए जोर सहित) को संरक्षित करता है और आंतरिक प्लेसहोल्डर टोकन साफ-सुथरे ढंग से पुनर्स्थापित होते हैं। ऐसे पैराग्राफ जो `` `inline code` `` के चारों ओर कई `bold` स्पैन को स्टैक करते हैं, बोल्ड के अंदर बैकटिक को नेस्ट करते हैं (उदाहरण के लिए `` `fetch(\`/locales/${code}.json\`)` `` जैसे टेम्पलेट लिटरल), या एक लंबे वाक्य के माध्यम से बोल्ड और कोड को बुनते हैं, नाजुक होते हैं: कुछ लोकेल को अलग शब्द क्रम की आवश्यकता होती है, जो अनुवाद के बाद `**` और `` ` `` के संरेखण को बदल सकता है और `AST mismatch` जैसी सीएलआई त्रुटियों को ट्रिगर कर सकता है।

पुनर्स्थापना के बाद, `translate-docs` उन खंडों को भी अस्वीकार कर देता है जहाँ HTML टैग प्लेसहोल्डर का पुन: उपयोग किया गया था या उन्हें हटा दिया गया था (इसलिए पुनर्स्थापित टैग अब स्रोत मानचित्र से मेल नहीं खाते हैं) या जहाँ मॉडल ने बचे हुए डबल-ब्रेस टोकन का आविष्कार किया था जो स्रोत में नहीं थे (उदाहरण के लिए एक मनगढ़ंत शब्दावली-शैली टोकन)। पुनर्स्थापना-पूर्व जाँचों के लिए <code v-pre>{{…}}</code> टोकन के समान मल्टीसेट और संरचनात्मक टोकन (<code v-pre>{{HTM_N}}</code>, चेतावनी मार्कर) के समान क्रमबद्ध अनुक्रम की आवश्यकता होती है; सामग्री टोकन जैसे <code v-pre>{{ILC_N}}</code>, <code v-pre>{{URL_N}}</code>, और जोर मार्कर जैसे <code v-pre>{{SE}}</code> प्राकृतिक शब्द क्रम के साथ आगे बढ़ सकते हैं जब प्रत्येक आईडी/प्रकार की संख्या अभी भी मेल खाती हो। वे विफलताएँ बचे हुए आधिकारिक आंतरिक टोकन के समान मॉडल-फ़ॉलबैक पथ का उपयोग करती हैं।

**यदि आपको इस तरह की सत्यापन विफलता का सामना करना पड़ता है, तो स्रोत-भाषा पाठ को सरल बनाने को प्राथमिकता दें** - पैराग्राफ को विभाजित करें, एक उदाहरण को एक फेंस किए गए कोड ब्लॉक में ले जाएं, या कम स्तरित बोल्ड/कोड जोड़े के साथ उसी विचार का वर्णन करें - बजाय इसके कि हर मॉडल और स्थानीयकरण से घने इनलाइन मार्कअप को पूरी तरह से पुनरुत्पादित करने की उम्मीद करें।

जब प्रत्येक कॉन्फ़िगर किया गया मॉडल एक ही खंड पर `AST mismatch` के साथ विफल हो जाता है, तो `translate-docs` स्वचालित रूप से उस खंड को छोटे भागों में विभाजित कर सकता है (पहले सूची मध्यबिंदु, फिर एकल सूची आइटम या छोटे पैराग्राफ चंक्स), पहले मॉडल से प्रत्येक भाग को पुनः प्रयास कर सकता है, और मूल खंड कैश कुंजी के तहत परिणाम को फिर से जोड़ सकता है। यह डिफ़ॉल्ट रूप से चालू है (`segmentSplitting.qualityRetrySplit`); मॉडल समाप्त होने के बाद रोकने के लिए इसे `false` पर सेट करें। जब यह फ़ॉलबैक चलता है तो रन सारांश `Quality split retries` की रिपोर्ट करता है।

यह देखने के लिए कि **कौन से खंड विफल हुए**, कितनी बार, और संग्रहीत **गुणवत्ता / त्रुटि संदेश**, अनुवाद डैशबोर्ड के **विफलताएं** टैब का उपयोग करें ([अनुवाद डैशबोर्ड → विफलताएं](/hi/guide/translation-dashboard/failures#failures-document-translation))।
