<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# फ़्लैट लिंक रीराइटर और दो-चरणीय प्रवाह

स्क्रीनशॉट यूआरएल लेआउट और फ़्लैट दो-चरणीय एसेट फ़्लो के लिए यह पृष्ठ पढ़ें। क्रॉस-पेज मार्कडाउन लिंक और `replace` प्लेसहोल्डर के लिए, [दस्तावेज़ — लिंक रीराइटिंग](/hi/guide/documents/link-rewriting) देखें।

`docsOutput.style = "flat"` के लिए (और जब तक `rewriteRelativeLinks: false` या एक कस्टम `pathTemplate` सेट नहीं किया जाता है), एक बिल्ट-इन रीराइटर `postProcessing` से पहले चलता है। यह क्रॉस-डॉक लिंक (लोकेल प्रत्यय जोड़ना) को संभालता है और गैर-मार्कडाउन एसेट यूआरएल में एक गहराई उपसर्ग जोड़ता है। लोकेल-विशिष्ट एसेट पाथ (स्क्रीनशॉट, `/img/…` ब्रिज) को फिर `docsOutput.postProcessing.regexAdjustments` द्वारा रीराइट किया जाता है।

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### जब `docsOutput.style = "flat"` हो तो दो-चरणीय प्रवाह

1. **स्रोत यूआरएल** — अनुवादित मार्कडाउन में छवि पथ (खंड पुनर्संयोजन के बाद)
2. **फ़्लैट लिंक रीराइटर** — एक गहराई उपसर्ग जोड़ता है (`../`, `../../docs/`, …)
3. **`regexAdjustments`** — लोकेल फ़ोल्डर खंड को स्वैप करता है (`en-GB` → `${translatedLocale}`)
4. **आउटपुट यूआरएल** — अनुवादित फ़ाइल में लिखा गया अंतिम पथ

`outputDir: "translated-docs/"` और रेपो रूट पर स्रोत `README.md` के साथ उदाहरण:

1. फ़्लैट लिंक रीराइटर: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (`translated-docs/` के लिए एक `../`)
2. `regexAdjustments` नियम `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

किसी भी गैर-`flat` शैली के लिए (जिसमें `"nested"`, `"doc-system"`, और `"docusaurus"`, `"astro-starlight"`, और `"vitepress"` जैसे प्रीसेट शामिल हैं), फ़्लैट लिंक रीराइटर नहीं चलता है। `regexAdjustments` अनुवादित मार्कडाउन से मूल यूआरएल देखता है (आमतौर पर `/img/screenshots/en-GB/foo.png` जैसा एक पूर्ण पथ)।

**एस्ट्रो स्टारलाइट एमडीएक्स:** स्टारलाइट सामग्री अक्सर `.mdx` होती है। उन फ़ाइलों के लिए, `translate-docs` केवल `postProcessing.regexAdjustments` चलाता है — कोई फ़्लैट, वाइटप्रेस, नेक्सट्रा, या फ़्यूमाडॉक्स लिंक रीराइटर नहीं। प्रति-लोकेल स्क्रीनशॉट पाथ अभी भी वही `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` नियम का उपयोग करते हैं; [उदाहरण/एस्ट्रो-डॉक्स](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) देखें।

<a id="vitepress-link-normalizer-style-vitepress"></a>
### वाइटप्रेस लिंक नॉर्मलाइज़र (`style: "vitepress"`)

जब `docsOutput.rewriteVitepressLinks` `true` होता है (जब `style` `"vitepress"` होता है तो डिफ़ॉल्ट), एक अलग नॉर्मलाइज़र खंड पुनर्संयोजन के बाद चलता है (फ़्लैट रीराइटर के बजाय)। यह वाइटप्रेस / डॉक-सिस्टम साइटों को लक्षित करता है जहाँ अंग्रेजी सामग्री रूट पर रहती है और लोकेल सिबलिंग फ़ोल्डरों में बैठते हैं (`docs/de/guide/…`)।

1. **स्रोत href** — अनुवादित मार्कडाउन में लिंक (खंड पुनर्संयोजन के बाद)
2. **वाइटप्रेस लिंक नॉर्मलाइज़र** — डॉक पाथ को साइट रूट में रीराइट करता है (`/guide/…`)
3. **`regexAdjustments`** — स्क्रीनशॉट के लिए वैकल्पिक लोकेल-फ़ोल्डर स्वैप (`screenshots/en-GB/` → `screenshots/de/`, …)
4. **आउटपुट href** — अनुवादित फ़ाइल में लिखा गया अंतिम यूआरएल

विशिष्ट रीराइट्स:

| स्रोत पैटर्न | सामान्यीकृत लक्ष्य |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (एक लोकेल फ़ाइल से) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | अपरिवर्तित (रेपो पाथ के लिए पूर्ण यूआरएल का उपयोग करें) |

उन परियोजनाओं के लिए जो `README.md` → `docs/index.md` को सिंक करते हैं, `README.md` में `LICENSE`, `examples/`, और वाइटप्रेस ट्री के बाहर की अन्य फ़ाइलों के लिए पूर्ण GitHub यूआरएल का उपयोग करें। [वाइटप्रेस एकीकरण — डॉक्स होमपेज के रूप में README](/hi/guide/integrations/vitepress#readme-as-homepage) देखें।

फ़्लैट रीराइटर और वाइटप्रेस नॉर्मलाइज़र प्रति `docs[]` ब्लॉक परस्पर अनन्य हैं — `regexAdjustments` से पहले केवल एक चलता है। [वाइटप्रेस एकीकरण — लिंक कन्वेंशन](/hi/guide/integrations/vitepress#link-conventions) देखें।

प्रति-लोकेल स्क्रीनशॉट फ़ोल्डर अभी भी आवश्यकता पड़ने पर वही `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` `regexAdjustments` नियम का उपयोग करते हैं; [प्रति-लोकेल फ़ोल्डर](/hi/guide/images-and-screenshots/per-locale-folder) देखें।

<a id="nextra-link-normalizer-style-nextra"></a>
### नेक्सट्रा लिंक नॉर्मलाइज़र (`style: "nextra"`)

जब `docsOutput.rewriteNextraLinks` `true` होता है (जब `style` `"nextra"` होता है तो डिफ़ॉल्ट), एक अलग नॉर्मलाइज़र खंड पुनर्संयोजन के बाद चलता है। यह `content/en/…` और सापेक्ष `.mdx` पाथ को लोकेल-न्यूट्रल रूट में रीराइट करता है (`/guide/…`)। [नेक्सट्रा एकीकरण — लिंक कन्वेंशन](/hi/guide/integrations/nextra#link-conventions) देखें।

<a id="fumadocs-link-normalizer-style-fumadocs"></a>
### फुमाडॉक्स लिंक नॉर्मलाइज़र (`style: "fumadocs"`)

जब `docsOutput.rewriteFumadocsLinks` `true` होता है (जब `style` `"fumadocs"` होता है तो डिफ़ॉल्ट), तो सेगमेंट रीअसेंबली के बाद एक अलग नॉर्मलाइज़र चलता है। यह `content/docs/…` और सापेक्ष `.mdx` पाथ को लोकेल-न्यूट्रल रूट (`/docs/…`) में फिर से लिखता है। [फुमाडॉक्स इंटीग्रेशन — लिंक कन्वेंशन्स](/hi/guide/integrations/fumadocs#link-conventions) देखें।

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### `flatPreserveRelativeDir` के साथ प्रति-फ़ाइल डेप्थ प्रीफ़िक्स

डेप्थ प्रीफ़िक्स प्रति आउटपुट फ़ाइल की गणना की जाती है — पूरे बैच के लिए विश्व स्तर पर नहीं। प्रत्येक स्रोत फ़ाइल के लिए, रीराइटर आउटपुट फ़ाइल की डायरेक्टरी से स्रोत फ़ाइल की डायरेक्टरी तक सापेक्ष पाथ की गणना करता है और उसे प्रीफ़िक्स के रूप में उपयोग करता है।

इसका मतलब है कि `flatPreserveRelativeDir: true` के साथ, सबडायरेक्टरी में स्रोत फ़ाइलों को स्वचालित रूप से सही प्रीफ़िक्स मिलता है। उदाहरण के लिए, `docs/guide/quick-start.md` `translated-docs/docs/guide/quick-start.<locale>.md` पर आउटपुट करता है। प्रति-फ़ाइल प्रीफ़िक्स `../../docs/` है, इसलिए एक एसेट `translation-dashboard.png` (स्रोत ट्री का एक सहोदर) `../../docs/translation-dashboard.png` बन जाता है — जो `translated-docs/docs/guide/` से `docs/translation-dashboard.png` तक सही ढंग से हल होता है।

स्रोत फ़ाइलों के साथ सापेक्ष-पाथ एसेट के लिए किसी `regexAdjustments` सुधार की आवश्यकता नहीं है।

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` और `linkRewriteDocsRoot`

| विकल्प | प्रभाव |
|---|---|
| `docsOutput.rewriteRelativeLinks` | फ़्लैट लिंक रीराइटर को स्पष्ट रूप से सक्षम या अक्षम करें (जब `docsOutput.style = "flat"` हो तो डिफ़ॉल्ट को ओवरराइड करता है) |
| `docsOutput.linkRewriteDocsRoot` | रूट जिससे `depthPrefix` की गणना की जाती है (डिफ़ॉल्ट `"."`) |
| `docsOutput.flatPreserveRelativeDir` | आउटपुट पाथ लेआउट को प्रभावित करता है, जिसका उपयोग रीराइटर ज्ञात अनुवादित फ़ाइलों के लिए लक्ष्य पाथ की गणना करते समय करता है |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

छवि, स्क्रीनशॉट और अन्य एसेट URL को फिर से लिखने के लिए `docs[].docsOutput.postProcessing` के तहत ऑर्डर किए गए `{ "description"?, "search", "replace" }` नियमों को कॉन्फ़िगर करें जिन्हें अंतर्निहित रीराइटर हैंडल नहीं करते हैं — आमतौर पर एक लोकेल फ़ोल्डर सेगमेंट (`screenshots/en-GB/` → `screenshots/de/`) को स्वैप करना या निरपेक्ष स्थिर पाथ (`/img/…` → `../assets/…`) को ब्रिज करना।

नियम सेगमेंट रीअसेंबली और अंतर्निहित लिंक रीराइटिंग (फ़्लैट या वाइटप्रेस) के बाद और `addFrontmatter` से पहले अनुवादित मार्कडाउन **बॉडी** पर चलते हैं। फ़्लैट लेआउट पर, डेप्थ प्रीफ़िक्स लागू होने के **बाद** URL के विरुद्ध `search` पैटर्न लिखें — पाथ के अंदर लोकेल सेगमेंट का मिलान करें, न कि अग्रणी `../` का।

**प्रति-लोकेल स्क्रीनशॉट फ़ोल्डर (फ़्लैट लेआउट):**

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

अपने स्रोत लोकेल (`en-GB`) को हार्डकोड करने के बजाय `[^/]+` का उपयोग करें ताकि नियम `sourceLocale` परिवर्तन से बच सके। सबसे आम प्लेसहोल्डर `${translatedLocale}` है; `${sourceLocale}`, `${sourceFilename}`, `${translatedFilename}`, और पाथ वैरिएबल भी उपलब्ध हैं — [दस्तावेज़ — लिंक रीराइटिंग](/hi/guide/documents/link-rewriting#replace-placeholders) देखें।

लेआउट-विशिष्ट उदाहरण (फ़्लैट, डॉक-सिस्टम, डॉक्यूसॉरस, स्टारलाइट): [प्रति-लोकेल फ़ोल्डर](/hi/guide/images-and-screenshots/per-locale-folder)। सामान्य क्रॉस-पेज लिंक नियम: [दस्तावेज़ — लिंक रीराइटिंग](/hi/guide/documents/link-rewriting)। फ़ील्ड संदर्भ: [कॉन्फ़िगरेशन — `docs`](/hi/reference/configuration#docs)।

---

<a id="common-mistakes-and-troubleshooting"></a>

हार्डकोडेड लोकेल रेगुलर एक्सप्रेशन, गुम स्क्रीनशॉट डायरेक्टरी और डॉक्यूसॉरस `/img/` ब्रिजिंग के लिए [सामान्य गलतियाँ और समस्या निवारण](/hi/guide/images-and-screenshots/troubleshooting) देखें।
