<a id="link-rewriting"></a>
# लिंक पुनः लेखन

`translate-docs` अनुवादित मार्कडाउन में यूआरएल को पुनः लिखता है ताकि लिंक फ़ाइलों को स्थानीयकृत पथों में ले जाने के बाद भी हल हो जाएं। अधिकांश क्रॉस-पेज लिंक स्वचालित रूप से संभाले जाते हैं; जब आपकी साइट एक साझा स्थिर यूआरएल पेड़ या स्थानीयकृत एसेट फ़ोल्डरों का उपयोग करती है, तो `docsOutput.postProcessing.regexAdjustments` नियम जोड़ें।

स्क्रीनशॉट निर्देशिका लेआउट, फ्लैट गहराई-पूर्वसर्ग + स्थानीयकृत-स्वैप प्रवाह, और लेआउट-विशिष्ट एसेट उदाहरणों के लिए, [छवियां और स्क्रीनशॉट — लिंक पुनः लेखन](/hi/guide/images-and-screenshots/link-rewriting) देखें।

<a id="built-in-rewriters"></a>
## निर्मित रewriter

जो रewriter चलाया जाता है वह `docsOutput.style` पर निर्भर करता है:

| लेआउट | निर्मित रewriter | यह क्या ठीक करता है |
| --- | --- | --- |
| `"flat"` (डिफ़ॉल्ट जब कोई कस्टम `pathTemplate` नहीं है) | फ्लैट लिंक रewriter (`rewriteRelativeLinks`, डिफ़ॉल्ट रूप से चालू) | क्रॉस-पेज सापेक्ष लिंक (`guide.md` → `guide.de.md`) और गैर-मार्कडाउन एसेट यूआरएल के लिए गहराई पूर्वसर्ग |
| `"vitepress"` | VitePress लिंक सामान्यकर्ता (`rewriteVitepressLinks`, डिफ़ॉल्ट रूप से चालू) | README-शैली `docs/guide/…` पथ → साइट मार्ग (`/guide/…`) |
| `"nextra"` | Nextra लिंक सामान्यकर्ता (`rewriteNextraLinks`, डिफ़ॉल्ट रूप से चालू) | `content/en/…` और सापेक्ष `.mdx` पथ → स्थानीयकृत-तटस्थ मार्ग (`/guide/…`) |
| `"fumadocs"` | Fumadocs लिंक सामान्यकर्ता (`rewriteFumadocsLinks`, डिफ़ॉल्ट रूप से चालू) | `content/docs/…` और सापेक्ष `.mdx` पथ → स्थानीयकृत-तटस्थ मार्ग (`/docs/…`) |
| `"doc-system"`, `"docusaurus"`, `"astro-starlight"` | कोई नहीं | स्रोत यूआरएल `postProcessing` तक अपरिवर्तित पारित होते हैं |

कस्टम `pathTemplate` फ्लैट रewriter को अक्षम करता है जब तक कि आप `rewriteRelativeLinks: true` को स्पष्ट रूप से निर्धारित न करें। क्रॉस-पेज `#anchor` हैंडलिंग के लिए [आउटपुट लेआउट](/hi/guide/documents/output-layouts) और [एंकर लिंक](/hi/guide/documents/anchor-links) देखें।

VitePress-विशिष्ट लेखन नियमों के लिए, [VitePress एकीकरण — लिंक सम्मेलन](/hi/guide/integrations/vitepress#link-conventions) देखें।

Nextra-विशिष्ट लेखन नियमों के लिए, [Nextra एकीकरण — लिंक सम्मेलन](/hi/guide/integrations/nextra#link-conventions) देखें।

Fumadocs-विशिष्ट लेखन नियमों के लिए, [Fumadocs एकीकरण — लिंक सम्मेलन](/hi/guide/integrations/fumadocs#link-conventions) देखें।

<a id="postprocessingregexadjustments"></a>
## `postProcessing.regexAdjustments`

निर्मित रewriter पर्याप्त नहीं होने पर `docs[].docsOutput.postProcessing` के तहत क्रमबद्ध `{ "description"?, "search", "replace" }` नियम जोड़ें — उदाहरण के लिए:

- स्क्रीनशॉट या छवि यूआरएल जिनमें एक **स्थानीयकृत फ़ोल्डर खंड** शामिल है (`screenshots/en-GB/` → `screenshots/de/`)
- पूर्ण साइट-मूल पथ (`/img/…`) जो अंग्रेजी स्रोत और अनुवादित आउटपुट पेड़ के बीच भिन्न होते हैं
- कोई भी यूआरएल पैटर्न जो लक्ष्य स्थानीयकृत के अनुसार बदलना चाहिए लेकिन एक सरल सापेक्ष मार्कडाउन लिंक नहीं है

`postProcessing` **पुनः संयोजित अनुवादित मार्कडाउन शरीर** (YAML फ्रंट मैटर कुंजी और गैर-प्रोस वैल्यू संरक्षित हैं) पर चलता है। यह सेगमेंट पुनः संयोजन और निर्मित लिंक पुनः लेखन के **बाद में** और `addFrontmatter` से **पहले** निष्पादित होता है।

<a id="two-step-flow-with-flat-layout"></a>
### दो-चरण प्रवाह फ्लैट लेआउट के साथ

जब `docsOutput.style = "flat"`, फ्लैट लिंक रewriter पहले चलता है, फिर `regexAdjustments`:

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

`outputDir: "translated-docs/"` और रेपो रूट पर स्रोत `README.md` के साथ उदाहरण:

1. फ़्लैट रीराइटर: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments`: `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

लोकेल सेगमेंट से मेल खाने के लिए `search` पैटर्न लिखें **पहले से उपसर्ग वाले URL के अंदर** — आपको रेगुलर एक्सप्रेशन में `../` गहराई उपसर्ग शामिल करने की आवश्यकता नहीं है।

`doc-system` लेआउट के लिए, फ़्लैट रीराइटर नहीं चलता है। `regexAdjustments` स्रोत मार्कडाउन से मूल URL देखता है (आमतौर पर `/img/screenshots/en-GB/foo.png` जैसा एक पूर्ण पथ)।

गहराई-उपसर्ग व्यवहार और `flatPreserveRelativeDir` के लिए [फ़्लैट लिंक रीराइटर और दो-चरणीय प्रवाह](/hi/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow) देखें।

<a id="replace-placeholders"></a>
### `replace` प्लेसहोल्डर

`replace` स्ट्रिंग प्रति फ़ाइल और लोकेल विस्तारित टेम्पलेट चर का समर्थन करती हैं:

| प्लेसहोल्डर | मान |
| --- | --- |
| `${translatedLocale}` | लक्ष्य लोकेल (सामान्यीकृत BCP-47) |
| `${sourceLocale}` | स्रोत लोकेल |
| `${sourceFullPath}` | पूर्ण स्रोत फ़ाइल पथ (POSIX `/`) |
| `${translatedFullPath}` | पूर्ण अनुवादित आउटपुट पथ |
| `${sourceFilename}` / `${translatedFilename}` | एक्सटेंशन के साथ बेसनेम |
| `${sourceBasedir}` / `${translatedBasedir}` | स्रोत / आउटपुट फ़ाइल की पैरेंट डायरेक्टरी |

`search` एक रेगुलर एक्सप्रेशन पैटर्न है। एक सादी स्ट्रिंग `g` फ़्लैग का उपयोग करती है; जब आपको अन्य फ़्लैग की आवश्यकता हो तो `/pattern/flags` का उपयोग करें (पैटर्न में अनएस्केप्ड `/` वर्ण नहीं होने चाहिए)।

<a id="common-patterns"></a>
## सामान्य पैटर्न

<a id="per-locale-asset-folder"></a>
### प्रति-लोकेल एसेट फ़ोल्डर

पहले दिन से लोकेल-कोडेड सबडायरेक्टरी के तहत एसेट स्टोर करें और सेगमेंट को एक सामान्य नियम के साथ स्वैप करें:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

अपनी स्रोत लोकेल (`en-GB`) को हार्डकोड करने के बजाय `[^/]+` का उपयोग करें ताकि यदि `sourceLocale` बदलता है तो भी नियम काम करे।

पूर्ण वॉकथ्रू: [छवियाँ और स्क्रीनशॉट — प्रति-लोकेल फ़ोल्डर](/hi/guide/images-and-screenshots/per-locale-folder)।

<a id="doc-system-static-urls"></a>
### डॉक-सिस्टम स्थिर URL

Docusaurus, Starlight, या अन्य `doc-system` साइटों के लिए जो एक साझा स्थिर ट्री से स्क्रीनशॉट प्रस्तुत करती हैं:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

स्रोत मार्कडाउन में सह-स्थित सापेक्ष पथों (`../assets/name.png`) को प्राथमिकता दें जब आपका जनरेटर इसका समर्थन करता है — तब किसी `regexAdjustments` ब्रिज की आवश्यकता नहीं होती है। लेआउट विकल्पों के लिए [छवियां और स्क्रीनशॉट](/hi/guide/images-and-screenshots/) देखें।

<a id="when-regex-is-not-needed"></a>
### जब रेगुलर एक्सप्रेशन की आवश्यकता नहीं होती है

आपको आमतौर पर `regexAdjustments` की आवश्यकता **नहीं** होती है जब:

- क्रॉस-पेज लिंक सरल सापेक्ष मार्कडाउन पथ और `docsOutput.style = "flat"` होते हैं (अंतर्निहित रीराइटर लोकेल प्रत्यय जोड़ता है)
- एसेट स्रोत फ़ाइलों के बगल में स्थित होते हैं और फ़्लैट रीराइटर का प्रति-फ़ाइल गहराई उपसर्ग उन्हें सही ढंग से हल करता है
- अंग्रेजी और प्रत्येक अनुवादित प्रतिलिपि **एक ही** URL का उपयोग करती है (साइट रूट पर साझा छवियां, सह-स्थित एसेट, सामान्यीकरण के बाद VitePress साइट मार्ग)
- VitePress इन-साइट लिंक साइट मार्गों या `docs/guide/…` पथों का उपयोग `rewriteVitepressLinks: true` के साथ करते हैं
- Nextra और Fumadocs इन-पेज लिंक लोकेल-न्यूट्रल मार्गों (`/guide/…`, `/docs/…`) या `rewriteNextraLinks` / `rewriteFumadocsLinks: true` के साथ सामग्री-रूट पथों का उपयोग करते हैं

<a id="full-config-example"></a>
## पूर्ण कॉन्फ़िग उदाहरण

प्रति-लोकेल स्क्रीनशॉट और एक वैकल्पिक भाषा-स्विचर ब्लॉक के साथ फ़्लैट README:

<details>
<summary>फ़्लैट लेआउट: regexAdjustments + languageListBlock</summary>

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
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

फ़ील्ड संदर्भ: [कॉन्फ़िगरेशन — `docs`](/hi/reference/configuration#docs) (`docsOutput.postProcessing`)।

<a id="troubleshooting"></a>
## समस्या निवारण

| लक्षण | संभावित कारण | क्या जांचना है |
| --- | --- | --- |
| अनुवादित पृष्ठ किसी छवि या स्थिर एसेट पर 404s दिखाता है | आपके URL लेआउट के लिए `regexAdjustments` गायब या गलत है | [छवियां और स्क्रीनशॉट — समस्या निवारण](/hi/guide/images-and-screenshots/troubleshooting) |
| लिंक सही फ़ाइल खोलता है लेकिन गलत `#section` | एंकर स्लग ड्रिफ्ट, URL रीराइटिंग नहीं | [एंकर लिंक](/hi/guide/documents/anchor-links) |
| `regexAdjustments` नियम का फ़्लैट लेआउट पर कोई प्रभाव नहीं पड़ता है | `search` प्री-रीराइटर URL की अपेक्षा करता है लेकिन फ़्लैट लेआउट ने पहले ही एक गहराई उपसर्ग जोड़ दिया है | उपसर्गित पथ के अंदर के सेगमेंट का मिलान करें ([दो-चरणीय प्रवाह](#two-step-flow-with-flat-layout) देखें) |
| रनटाइम पर अमान्य रेगुलर एक्सप्रेशन छोड़ दिया गया | गलत `search` पैटर्न | CLI नियम `description` के साथ चेतावनी देता है; नमूना अनुवादित आउटपुट के विरुद्ध पैटर्न का परीक्षण करें |
