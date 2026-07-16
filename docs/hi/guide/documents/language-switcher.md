<a id="language-switcher-languagelistblock"></a>
# भाषा स्विचर (`languageListBlock`)

जब अनुवादित मार्कडाउन फ़ाइलों में **"अन्य भाषाओं में पढ़ें"** लिंक की एक पंक्ति शामिल होनी चाहिए — प्रति लोकेल एक लिंक, जिसमें `href` मान प्रत्येक आउटपुट फ़ाइल के सापेक्ष परिकलित होते हैं, तो `docsOutput.postProcessing.languageListBlock` का उपयोग करें।

यह रिपॉजिटरी [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) (`translated-docs/` के तहत फ़्लैट आउटपुट) के लिए इसका उपयोग करती है। `translate-docs` के बाद, प्रत्येक अनुवादित प्रति को एक ताज़ा ब्लॉक मिलता है; उदाहरण के लिए [translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) `translated-docs/` के तहत सिबलिंग लोकेल फ़ाइलों और रेपो रूट पर अंग्रेजी स्रोत से वापस लिंक करता है।

`docsOutput.style = "flat"` (या कोई अन्य लेआउट जहाँ सिबलिंग लोकेल फ़ाइलें सापेक्ष पथ द्वारा संबोधित की जा सकती हैं) की आवश्यकता है। [आउटपुट लेआउट](/hi/guide/documents/output-layouts) देखें।

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. स्रोत मार्कडाउन में ब्लॉक को चिह्नित करें

स्विचर को HTML (या कोई भी लाइन) में `start` और `end` सबस्ट्रिंग मार्कर द्वारा सीमित करें। यह रेपो उपयोग करता है:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/hi/) · [Deutsch](./README.de.md) · …</small>
```

प्रारंभिक लिंक टेक्स्ट केवल एक प्लेसहोल्डर है। `translate-docs` `start` वाली पहली पंक्ति से लेकर `end` वाली पहली बाद की पंक्ति तक पूरे स्लाइस को बदल देता है (बाड़ वाले कोड ब्लॉक के अंदर के मार्कर अनदेखा किए जाते हैं ताकि एक ही फ़ाइल में कॉन्फ़िग उदाहरण मेल न खाएं)।

<a id="2-configure-the-block"></a>
## 2. ब्लॉक को कॉन्फ़िगर करें

`start` और `end` मनमानी सबस्ट्रिंग मार्कर हैं — उन्हें `<small id="lang-list">` / `</small>` होने की आवश्यकता नहीं है। कोई भी शुरुआती और समापन टेक्स्ट चुनें जो केवल भाषा-स्विचर स्लाइस पर दिखाई देता है: एक और HTML टैग (`<div class="lang-switcher">` … `</div>`), HTML टिप्पणियाँ (`<!-- lang-list -->` … `<!-- /lang-list -->`), या मार्कडाउन-केवल सीमाएँ (उदाहरण के लिए एक पंक्ति `**Languages:**` से एक पंक्ति `---` तक)। कॉन्फ़िग में `start` और `end` को सेट करें ताकि वह स्रोत फ़ाइल में आपके द्वारा डाले गए के साथ बिल्कुल मेल खाए।

रूट कॉन्फ़िग ([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| फ़ील्ड       | भूमिका                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | सबस्ट्रिंग जो ब्लॉक की शुरुआती पंक्ति की पहचान करती है                                                  |
| `end`       | समापन पंक्ति पर सबस्ट्रिंग (`start` के समान पंक्ति हो सकती है जब दोनों एक पंक्ति पर दिखाई देते हैं)             |
| `separator` | जेनरेट किए गए `[label](href)` लिंक के बीच टेक्स्ट (यह रेपो `" · "` का उपयोग करता है)                                    |
| `label`     | वैकल्पिक: `"local"` (डिफ़ॉल्ट) मैनिफ़ेस्ट से प्रत्येक लोकेल एंडोनिम का उपयोग करता है; `"english"` `englishName` का उपयोग करता है |

<a id="3-what-happens-at-runtime"></a>
## 3. रनटाइम पर क्या होता है

1. **निष्कर्षण** — भाषा-सूची स्लाइस मॉडल को **नहीं** भेजा जाता है (`translatable: false`)।
2. **प्रति अनुवादित फ़ाइल** — सेगमेंट अनुवाद और वैकल्पिक फ़्लैट लिंक पुनर्लेखन के बाद, `postProcessing` ब्लॉक को फिर से बनाता है: प्रति लोकेल एक मार्कडाउन लिंक, जब मौजूद हो तो `ui-languages.json` से लेबल (अन्यथा बंडल किया गया मास्टर कैटलॉग, अन्यथा `localeDisplayNames`), लिखी जा रही फ़ाइल के सापेक्ष पथ।
3. **स्रोत ताज़ा करें** — `translate-docs` / `sync` डॉक्स पास के अंत में, वही कैननिकल ब्लॉक `contentPaths` में **अंग्रेजी स्रोत फ़ाइलों** में वापस लिखा जाता है ताकि एक लोकेल जोड़ने से रेपो में स्विचर को हर लिंक को हाथ से संपादित किए बिना अपडेट किया जा सके।

यदि किसी फ़ाइल में कोई मेल खाने वाला ब्लॉक नहीं है, तो CLI एक चेतावनी लॉग करता है (जब `--verbose`) और बॉडी को अपरिवर्तित छोड़ देता है।

<a id="4-label-manifest"></a>
## 4. लेबल मैनिफ़ेस्ट

एंडोनिम लेबल (`label: "local"`) के लिए, `generate-ui-languages` के माध्यम से `ui-languages.json` जेनरेट या बनाए रखें ([`languagesManifestPath`](/hi/reference/configuration#languagesmanifestpath-optional) पर लिखा गया है, जो `{ui.flatOutputDir}/ui-languages.json` पर डिफ़ॉल्ट है)। इस रेपो के डॉक्स-ओनली कॉन्फ़िग में कोई UI पाइपलाइन और डिस्क पर कोई प्रोजेक्ट मैनिफ़ेस्ट नहीं है, इसलिए लेबल `sourceLocale` + `targetLocales` के लिए बंडल किए गए मास्टर कैटलॉग से आते हैं।

<a id="5-examples-in-this-repository"></a>
## 5. इस रिपॉजिटरी में उदाहरण

| उदाहरण | फ़ाइलें |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| यह पैकेज (फ्लैट README + VitePress साइट) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (README ब्लॉक: `docsOutput.style = "flat"`; साइट ब्लॉक: `docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |
| फ्लैट README + Docusaurus डॉक्स | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (दूसरा ब्लॉक: `docsOutput.style = "flat"`; पहला ब्लॉक: `docsOutput.style = "docusaurus"`) |
| केवल Docusaurus डॉक्स | [examples/docusaurus-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json) (`docsOutput.style = "docusaurus"` + `docusaurusCatalogDir`) |
| VitePress डॉक्स (न्यूनतम डेमो) | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |

`<small id="lang-list">` से ठीक पहले वाली पंक्ति (उदाहरण के लिए `**Read in other languages:**`) एक सामान्य अनुवाद योग्य खंड है और प्रत्येक लक्ष्य स्थान में स्थानीयकृत है; मार्करों के अंदर की लिंक पंक्ति को `href` और मैनिफेस्ट-संचालित लेबल के अलावा शब्दशः पुनर्जीवित किया जाता है।
