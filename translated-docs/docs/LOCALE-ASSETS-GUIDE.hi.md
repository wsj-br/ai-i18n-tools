<a id="locale-assets-guide"></a>
# स्थानीयकरण संपत्ति मार्गदर्शिका

इस मार्गदर्शिका में `ai-i18n-tools` का उपयोग करने वाले प्रोजेक्ट्स में स्थानीयकरण-विशिष्ट संपत्तियों — स्क्रीनशॉट (PNG, JPEG, WebP) और चित्रित SVG फ़ाइलों — को कैसे संभालना है, इसका विवरण दिया गया है। इसमें प्रत्येक उपलब्ध पैटर्न, उसके उपयोग के समय और एक प्रोजेक्ट को शुरू से कैसे सेट करना है, ताकि बाद में अधिक स्थानीयकरण जोड़ने के लिए कोई संरचनात्मक पुनःकार्य न हो, का वर्णन किया गया है।

SVG कॉन्फ़िगरेशन संदर्भ के लिए, [GETTING_STARTED.md](GETTING_STARTED.hi.md) में [`svg`](#svg) अनुभाग देखें। `postProcessing.regexAdjustments` विकल्प के लिए, [कॉन्फ़िगरेशन संदर्भ](GETTING_STARTED.hi.md#configuration-reference) देखें।

| कॉन्फ़िग पथ | मान | उपयोग का मामला | टिप्पणियाँ |
|-------------|-------|----------|-------|
| `docs[].docsOutput.style` | `"flat"` | स्थानीयकरण-समाप्त README / USER-GUIDE फ़ाइलें | फ्लैट लिंक रीराइटर सक्षम करता है; जब स्रोत उपडायरेक्टरी में हों तो `flatPreserveRelativeDir` के साथ जोड़ें |
| `docs[].docsOutput.style` | `"nested"` (डिफ़ॉल्ट) | `outputDir` के तहत सरल स्थानीय उपफ़ोल्डर | कोई फ्लैट लिंक रीराइटर नहीं |
| `docs[].docsOutput.style` | `"doc-system"` | स्थानीय-उपसर्ग वाले दस्तावेज़ वृक्ष (कस्टम जनरेटर) | `docsRoot` और `localeSubpath` सेट करें; फ्लैट लिंक रीराइटर चलता नहीं है |
| `docs[].docsOutput.style` | `"docusaurus"` / `"astro-starlight"` | प्रीसेट `doc-system` लेआउट | `localeSubpath` के लिए जनरेटर-विशिष्ट डिफ़ॉल्ट के साथ उपनाम |
| `svg.style` | `"flat"` | वेब ऐप्स (`name.<locale>.svg` में `public/assets/`) | मार्कडाउन `style` से अलग; `translate-svg` द्वारा उपयोग किया जाता है |
| `svg.style` | `"nested"` | डॉक-सिस्टम स्थानीयकृत SVG आउटपुट | अक्सर `pathTemplate` (पैटर्न E) के साथ जोड़ा जाता है |

इस गाइड में कॉन्फ़िग से सटीक JSON स्ट्रिंग्स का उपयोग किया जाता है — केवल अंग्रेजी शब्दों के बजाय — ताकि अनुवादित प्रतियाँ अस्पष्टता से मुक्त रहें। लोड समय पर पुरानी कुंजियों (`documentations`, `markdownOutput`) को स्वीकार किया जाता है; नई कॉन्फ़िग में `docs` और `docsOutput` को प्राथमिकता दें।

<small>**अन्य भाषाओं में पढ़ें:** </small>
<small id="lang-list">[English (GB)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [हिन्दी](./LOCALE-ASSETS-GUIDE.hi.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [中文 (中国大陆)](./LOCALE-ASSETS-GUIDE.zh-CN.md) · [中文 (台灣)](./LOCALE-ASSETS-GUIDE.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [एसेट्स के साथ ai-i18n-tools क्या करता है (और क्या नहीं करता)](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [शुरुआत से i18n के लिए डिज़ाइन](#design-for-i18n-from-the-start)
  - [`docsOutput.style = "flat"` के साथ मार्कडाउन (README, USER-GUIDE)](#markdown-with-docsoutputstyle--flat-readme-user-guide)
  - [दस्तावेज़-प्रणाली साइटें (`docsOutput.style = "doc-system"`)](#doc-system-sites-docsoutputstyle--doc-system)
    - [Docusaurus प्रीसेट](#docusaurus-preset)
    - [Astro/Starlight प्रीसेट](#astrostarlight-preset)
  - [वेब ऐप्स (Next.js, Vite, आदि) SVG एसेट्स के साथ](#web-apps-nextjs-vite-etc-with-svg-assets)
- [निर्णय गाइड](#decision-guide)
- [पैटर्न A - साझा रास्टर](#pattern-a---shared-raster)
  - [कार्यान्वयन उदाहरण](#implementation-example)
- [पैटर्न B - प्रति-स्थानीय फ़ोल्डर (URL पुन:लेखन)](#pattern-b---per-locale-folder-url-rewriting)
  - [डायरेक्टरी लेआउट](#directory-layout)
  - [स्क्रीनशॉट स्क्रिप्ट अनुबंध](#screenshot-script-contract)
  - [कॉन्फ़िग - `docsOutput.style = "flat"`](#config---docsoutputstyle--flat)
  - [कॉन्फ़िग - `docsOutput.style = "doc-system"`](#config---docsoutputstyle--doc-system)
  - [प्रीसेट - `docsOutput.style = "docusaurus"`](#preset---docsoutputstyle--docusaurus)
  - [प्रीसेट - `docsOutput.style = "astro-starlight"`](#preset---docsoutputstyle--astro-starlight)
- [पैटर्न C - सह-स्थित रास्टर (`doc-system`)](#pattern-c---colocated-raster-doc-system)
  - [निर्देशिका लेआउट](#directory-layout-1)
  - [स्क्रीनशॉट स्क्रिप्ट अनुबंध](#screenshot-script-contract-1)
  - [कॉन्फ़िग](#config)
  - [पूर्वावश्यकताएँ](#prerequisites)
  - [कार्यान्वयन उदाहरण](#implementation-example-1)
- [पैटर्न D - `svg.style = "flat"` के साथ अनुवादित SVG](#pattern-d---translated-svg-with-svgstyle--flat)
  - [कॉन्फ़िग](#config-1)
  - [ऐप संदर्भ](#app-reference)
  - [स्रोत लेआउट सिफारिश](#source-layout-recommendation)
  - [कार्यान्वयन उदाहरण](#implementation-example-2)
- [पैटर्न E - सह-स्थित अनुवादित SVG (दस्तावेज़-प्रणाली)](#pattern-e---colocated-translated-svg-doc-system)
  - [कॉन्फ़िग](#config-2)
  - [स्रोत मार्कडाउन](#source-markdown)
  - [SVG स्रोत स्थान](#svg-source-location)
  - [`pathTemplate` प्लेसहोल्डर](#pathtemplate-placeholders)
  - [कार्यान्वयन उदाहरण](#implementation-example-3)
- [फ्लैट लिंक रीराइटर और दो-चरण प्रवाह](#the-flat-link-rewriter-and-two-step-flow)
  - [जब `docsOutput.style = "flat"` हो तो दो-चरण प्रवाह](#two-step-flow-when-docsoutputstyle--flat)
  - [`flatPreserveRelativeDir` के साथ प्रति-फ़ाइल गहराई उपसर्ग](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` और `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [सामान्य त्रुटियाँ और समस्या निवारण](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## ai-i18n-tools एसेट्स के साथ क्या करता है (और क्या नहीं करता)

`translate-docs` मार्कडाउन/MDX सामग्री — छवि वैकल्पिक पाठ सहित — का अनुवाद करता है, लेकिन रास्टर फ़ाइलों की प्रतिलिपि नहीं बनाता, उत्पन्न नहीं करता या उत्सर्जित नहीं करता। यदि अनुवादित पृष्ठ को स्थानीयकृत स्क्रीनशॉट की आवश्यकता है, तो आपको उस फ़ाइल को उस पथ पर रखना होगा जिसका अनुवादित मार्कडाउन संदर्भ देगा।

`translate-svg` एकमात्र कमांड है जो स्थानीयकृत बाइनरी फ़ाइलें उत्पन्न करता है। यह स्रोत SVG फ़ाइलें पढ़ता है, पाठ तत्वों (`<text>`, `<title>`, `<desc>`) का अनुवाद करता है, और प्रत्येक स्थानीयकरण के लिए एक आउटपुट SVG लिखता है। रास्टर फ़ाइलें (PNG, JPEG, WebP, GIF) को कभी भी टूल द्वारा लिखा नहीं जाता है।

---

<a id="design-for-i18n-from-the-start"></a>
## शुरुआत से i18n के लिए डिज़ाइन

किसी भी स्क्रीनशॉट के अस्तित्व में आने से पहले सही निर्देशिका लेआउट चुनना बाद में स्थानीयकृत एसेट्स के लिए सबसे बड़ा कारक है। दर्जनों स्क्रीनशॉट प्रतिबद्ध होने के बाद लेआउट को फिर से लागू करने का अर्थ है पथों को पुनः संरचित करना और प्रत्येक मार्कडाउन संदर्भ को अपडेट करना।

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### `docsOutput.style = "flat"` के साथ मार्कडाउन (README, USER-GUIDE)

दिन एक से ही एक स्थानीयकृत उपनिर्देशिका के अंदर स्क्रीनशॉट संग्रहीत करें:

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

जब आप बाद में i18n जोड़ते हैं, तो आपकी `take-screenshots` स्क्रिप्ट प्रत्येक स्थानीयकरण के लिए `images/screenshots/<locale>/` में लिखती है, और एक `regexAdjustments` नियम उन सभी को संभालता है:

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

सामान्य `[^/]+` पैटर्न किसी भी स्थानीयकरण फ़ोल्डर नाम से मेल खाता है — अपने स्रोत स्थानीयकरण (जैसे `screenshots/en-GB/`) को हार्डकोड न करें क्योंकि यदि `sourceLocale` कभी भी बदलता है तो यह टूट जाता है।

यदि आप स्थानीय उपडायरेक्टरी को छोड़कर पथ के साथ शुरू करते हैं (`images/screenshots/translate.png`), तो पैटर्न B काम करने से पहले आपको पूरे वृक्ष को पुनः व्यवस्थित करना होगा।

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### दस्तावेज़-प्रणाली साइटें (`docsOutput.style = "doc-system"`)

स्थिर दस्तावेज़ीकरण साइटों के लिए उपयोग करें जो स्थानीयकृत उपसर्ग वाले वृक्ष के तहत अनुवादित पृष्ठों को संग्रहीत करते हैं — डॉक्यूसॉरस i18n, एस्ट्रो स्टारलाइट, और कस्टम जनरेटर जो समान संरचना का पालन करते हैं। `docsRoot` के तहत फ़ाइलों को लिखा जाता है:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docs[].docsOutput.docsRoot` को अपने अंग्रेजी स्रोत रूट पर सेट करें (उदाहरण के लिए `"docs"` या `"src/content/docs"`)। जब आप `style: "doc-system"` को सीधे सेट करते हैं, तो आपको `localeSubpath` को उस पथ खंड पर भी सेट करना होगा जो आपकी साइट `{locale}/` और अनुवादित फ़ाइल के बीच उपयोग करती है। उपनाम `"docusaurus"` और `"astro-starlight"` प्रीसेट `doc-system` लेआउट हैं जिनमें डिफ़ॉल्ट `localeSubpath` मान हैं (देखें [आउटपुट लेआउट](GETTING_STARTED.hi.md#output-layouts))।

| पूर्वनिर्धारित उपनाम | डिफ़ॉल्ट `localeSubpath` | उदाहरण आउटपुट |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (खाली) | `src/content/docs/de/guide.md` |

फ्लैट लिंक रीलेटर `doc-system` के लिए **नहीं** चलता (`"flat"` के विपरीत)। `postProcessing.regexAdjustments` स्रोत मार्कडाउन से मूल URL देखता है — आमतौर पर एक पूर्ण या साइट-रूट पथ जैसे `/img/screenshots/en-GB/foo.png`।

**पैटर्न B** तब लागू होता है जब स्क्रीनशॉट एक साझा स्थिर URL वृक्ष में स्थित हों: दिन एक से ही एक स्थानीय-कोडित फ़ोल्डर और एक सामान्य `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` नियम का उपयोग करें (देखें [कॉन्फ़िग — दस्तावेज़-प्रणाली](#config---docsoutputstyle--doc-system))।

**पैटर्न C** तब लागू होता है जब प्रत्येक स्थानीयकरण के अनुवादित दस्तावेज़ मार्कडाउन के बगल में एसेट्स को स्थानीयकृत करते हैं (कोई URL पुन:लेखन नहीं)। आपकी स्क्रीनशॉट स्क्रिप्ट को `{outputDir}`, `{locale}`, और `{localeSubpath}` से प्राप्त पथों में PNG लिखने होंगे — नीचे दिया गया Docusaurus पूर्वनिर्धारित संदर्भ लेआउट है।

<a id="docusaurus-preset"></a>
#### Docusaurus पूर्वनिर्धारित

प्रोजेक्ट सेटअप के समय दो आदतें बाद में सभी रेगेक्स ब्रिजिंग को समाप्त कर देती हैं:

1. किसी भी स्क्रीनशॉट को जोड़ने से पहले एक सिमलिंक `documentation/docs/assets → ../static/assets` बनाएं। डॉक्यूसॉरस का वेबपैक डिफ़ॉल्ट रूप से सिमलिंक का अनुसरण करता है, और इससे स्रोत दस्तावेज़ों को सापेक्ष पथों का उपयोग करने की अनुमति मिलती है जिनका उपयोग अनुवादित दस्तावेज़ भी करेंगे।

2. सभी दस्तावेज़ संपत्तियों — PNG और SVG — को `static/assets/` में रखें (एक निर्देशिका में)। उन्हें `static/img/` (SVGs) और `static/assets/` (PNGs) के बीच विभाजित न करें। एकीकृत स्थान का अर्थ है कि प्रत्येक दस्तावेज़ पृष्ठ, अंग्रेजी और अनुवादित दोनों, समान सापेक्ष पथ `../assets/name.ext` को संदर्भित कर सकता है।

स्रोत मार्कडाउन में स्थिर सापेक्ष पथ `../assets/name.ext` के साथ प्रत्येक संपत्ति का संदर्भ दें। दस्तावेज़ संपत्तियों के लिए कभी भी निरपेक्ष `/img/` या `/assets/` URL का उपयोग न करें — ये URL अंग्रेजी स्रोत (`static/` से सेवित) और अनुवादित स्थानीयकरण (अनुवादित दस्तावेज़ों के साथ स्थानीयकृत) के बीच भिन्न होते हैं, जो उन्हें जोड़ने के लिए `regexAdjustments` नियम को बल देता है।

जब आप बाद में i18n जोड़ते हैं, तो स्क्रीनशॉट स्क्रिप्ट `getScreenshotDir` विभाजन अपनाती है (देखें [पैटर्न C](#pattern-c---colocated-raster-doc-system)) और `translate-svg` एक `pathTemplate` का उपयोग करता है। कोई रेगेक्स समायोजन की आवश्यकता नहीं होती।

> **नोट:** `resolve.symlinks = false` में `next.config.ts` केवल नेक्स्ट.जेएस एप्लिकेशन वेबपैक बिल्ड के लिए सिमलिंक सं solution को अक्षम करता है। यह डॉक्यूसॉरस दस्तावेज़ साइट बिल्ड को प्रभावित नहीं करता है, जो एक अलग वेबपैक उदाहरण का उपयोग करता है।

<a id="astrostarlight-preset"></a>
#### एस्ट्रो/स्टारलाइट प्रीसेट

`docsOutput.style = "doc-system"` के साथ `localeSubpath: ""` के बराबर — अनुवादित पृष्ठ सीधे `{outputDir}/{locale}/` के तहत स्थित होते हैं।

दिन एक से ही भाषा-कोडित पथ के तहत स्क्रीनशॉट संग्रहीत करें:

```
public/img/screenshots/en-GB/screenshot.png
```

`regexAdjustments` में सामान्य रेगेक्स का उपयोग करें:

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### वेब ऐप्स (नेक्स्ट.जेएस, वाइट, आदि) जिनमें SVG संपत्तियां हैं

SVG स्रोत फ़ाइलों को एक समर्पित स्रोत निर्देशिका में रखें (उदाहरण के लिए `images/` या `src/assets/`) और `svg.outputDir` को एक अलग सर्विंग निर्देशिका (उदाहरण के लिए `public/assets/`) के लिए कॉन्फ़िगर करें। स्रोत SVG और `translate-svg` आउटपुट फ़ाइलों को कभी भी एक ही फ़ोल्डर में मिलाएं नहीं — यह असंभव हो जाता है कि बताया जा सके कि कौन सी फ़ाइलें उत्पन्न की गई हैं।

सभी मानव-पठनीय लेबल के लिए `<text>`, `<title>`, और `<desc>` तत्वों का उपयोग करके SVG को शुरू से ही अनुवाद योग्य बनाएं। पाठ को पथ डेटा के रूप में एम्बेड करने से बचें।

फ़ाइल सिस्टम और सीडीएन के पार केस-संवेदनशीलता अमिलन से बचने के लिए `svg` कॉन्फ़िग ब्लॉक में `forceLowercase: true` सक्षम करें।

---

<a id="decision-guide"></a>
## निर्णय मार्गदर्शिका

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| पैटर्न | एसेट प्रकार | साइट प्रकार | उपकरण तंत्र |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A | रास्टर (साझा) | `docsOutput.style = "flat"` दस्तावेज़ | प्रति-फ़ाइल लिंक रीराइटर; आमतौर पर कोई रेगेक्स नहीं |
| B       | रैस्टर (प्रति-स्थानीयकरण)         | `"flat"` या `"doc-system"` (`"docusaurus"`, `"astro-starlight"` सहित)    | `regexAdjustments` स्थानीयकरण खंड विनिमय                       |
| C       | रैस्टर (स्थानीयकृत)          | `"doc-system"` स्थानीयकृत संपत्तियों के साथ (डॉक्यूसॉरस प्रीसेट)                  | स्क्रीनशॉट स्क्रिप्ट फ़ाइलें रखती है; कोई रेगेक्स नहीं                     |
| D       | SVG (अनुवादित)            | वेब ऐप                                                                   | `translate-svg` के साथ `svg.style = "flat"`                    |
| E       | SVG (अनुवादित, स्थानीयकृत) | `"doc-system"` स्थानीयकृत संपत्तियों के साथ (डॉक्यूसॉरस प्रीसेट)                  | `translate-svg` के साथ `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a---shared-raster"></a>
## पैटर्न A - साझा रास्टर

उपयोग तब करें जब सभी स्थानीयकरणों में एक ही छवि साझा की जाती हो (प्रत्येक स्थानीयकरण के लिए कोई भिन्न नहीं)। जब `docsOutput.style = "flat"` हो, तो फ्लैट लिंक रीराइटर प्रत्येक आउटपुट फ़ाइल के लिए गहराई उपसर्ग की गणना करता है, इसलिए स्रोत फ़ाइल के बगल में मौजूद एक संपत्ति (उदाहरण के लिए `docs/figure.png`, जिसे `docs/page.md` से `figure.png` के रूप में संदर्भित किया गया है) हर अनुवादित आउटपुट में सही ढंग से संकल्पित होती है — कोई `postProcessing.regexAdjustments` नियम आवश्यक नहीं है।

उदाहरण: यह पैकेज `docs/GETTING_STARTED.md` का `translated-docs/docs/GETTING_STARTED.<locale>.md` में अनुवाद करता है। सहोदर छवि `docs/translation-dashboard.png` को `translation-dashboard.png` के रूप में संदर्भित किया जाता है। पुनर्लेखक आउटपुट फ़ाइल की निर्देशिका से स्रोत निर्देशिका तक (`../../docs/`) वापस जाने वाले प्रति-फ़ाइल उपसर्ग की गणना करता है, जिससे `../../docs/translation-dashboard.png` प्राप्त होता है। `translated-docs/docs/` से, यह सही ढंग से `docs/translation-dashboard.png` पर हल हो जाता है।

डैशबोर्ड UI में बदलाव आने पर PNG को [`scripts/screenshot-translation-dashboard.sh`](../../docs/../scripts/screenshot-translation-dashboard.sh) के साथ ताज़ा करें; छवि प्रति-स्थानीय नहीं है।

एक `postProcessing` नियम तब भी आवश्यक है जब:
- संपत्ति को एक पूर्ण URL के माध्यम से संदर्भित किया जाता है (जैसे `/img/figure.png`) — रीराइटर केवल सापेक्ष पथों को संभालता है
- आप अन्य कारणों से संपत्ति URL बदलना चाहते हैं (जैसे CDN पर स्विच करना)

<a id="implementation-example"></a>
### कार्यान्वयन उदाहरण

इस रिपॉजिटरी में अनुवाद डैशबोर्ड के स्क्रीनशॉट के लिए पैटर्न A का उपयोग किया गया है: [GETTING_STARTED.md](GETTING_STARTED.hi.md#translation-dashboard) उसी फ़ोल्डर में मौजूद छवि [translation-dashboard.png](../../docs/../docs/translation-dashboard.png) को संदर्भित करता है। [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) में `docsOutput.style = "flat"` और `flatPreserveRelativeDir: true` सेट किए गए हैं; प्रति-फ़ाइल गहराई उपसर्ग छवि पथ को स्क्रीनशॉट `regexAdjustments` के बिना ही संकल्पित करता है।

---

<a id="pattern-b---per-locale-folder-url-rewriting"></a>
## पैटर्न B - प्रति-स्थानीयकरण फ़ोल्डर (URL पुन:लेखन)

README/USER-GUIDE के लिए `docsOutput.style = "flat"` के साथ, और डॉक-सिस्टम साइटों (`docsOutput.style = "doc-system"` या उपनाम `"docusaurus"` / `"astro-starlight"`) के लिए उपयोग करें जो साझा स्थिर URL ट्री से स्क्रीनशॉट प्रदान करते हैं।

<a id="directory-layout"></a>
### निर्देशिका लेआउट

<details>
<summary>उदाहरण: प्रति-लोकेल स्क्रीनशॉट निर्देशिका ट्री</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

स्रोत मार्कडाउन स्रोत स्थानीयकरण निर्देशिका को संदर्भित करता है:

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### स्क्रीनशॉट स्क्रिप्ट अनुबंध

`take-screenshots` स्क्रिप्ट को प्रत्येक स्थानीयकरण के लिए फ़ाइलें लिखनी चाहिए — केवल स्रोत स्थानीयकरण के लिए नहीं। `translate-docs` कमांड पथ पुनःलिखित करता है लेकिन फ़ाइलें नहीं बनाता। एक सामान्य पैटर्न:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

सरल `bash` उदाहरण के लिए [examples/nextjs-app में स्क्रीनशॉट स्क्रिप्ट](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh) देखें, या [Transrewrt प्रोजेक्ट](https://github.com/wsj-br/transrewrt) रिपॉजिटरी में [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) में एक अधिक जटिल उदाहरण देखें।

> **नोट:** नीचे दिए गए चार उप-खंड एक ही `regexAdjustments` स्थानीयकरण-खंड स्वैप (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`) साझा करते हैं। केवल आउटपुट लेआउट और यह अंतर है कि क्या फ्लैट लिंक रीराइटर पहले चलता है — अपने `docsOutput.style` के अनुरूप उप-खंड पर जाएँ।

<a id="config---docsoutputstyle--flat"></a>
### कॉन्फ़िग - `docsOutput.style = "flat"`

जब `docsOutput.style = "flat"` हो तो फ्लैट लिंक रीराइटर पहले चलता है और गैर-मार्कडाउन URL के लिए एक गहराई उपसर्ग जोड़ता है। रिपॉजिटरी रूट पर `outputDir: "translated-docs/"` के साथ एक `README.md` के लिए, यह `../` जोड़ता है:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

फिर `regexAdjustments` नियम पहले से प्रति-उपसर्ग वाले URL के भीतर स्थानीयकरण खंड को प्रतिस्थापित करता है:

<details>
<summary>फ्लैट लेआउट के लिए उदाहरण regexAdjustments</summary>

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

</details>

परिणाम: `../images/screenshots/de/translate.png` — `translated-docs/README.de.md` से रिपॉजिटरी रूट तक वापस सही सापेक्ष पथ।

`postProcessing` चरण फ्लैट लिंक रीराइटर के बाद चलता है। `search` पैटर्न लिखें जो पहले से प्रति-उपसर्ग वाले URL में कहीं भी स्थानीयकरण खंड से मेल खाते हों — पैटर्न में `../` उपसर्ग शामिल करने की आवश्यकता नहीं है।

लागूकरण उदाहरण (उत्पादन): [Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) में स्क्रीनशॉट URL (`images/screenshots/en-GB/…`), [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) में स्थानीयकरण पुन:लेखन, कैप्चर स्क्रिप्ट [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) (ऊपर [स्क्रीनशॉट स्क्रिप्ट कॉन्ट्रैक्ट](#screenshot-script-contract) देखें)।

लागूकरण उदाहरण (डेमो कॉन्फ़िग): [examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) में दूसरा `docs[]` ब्लॉक (`images/screenshots/[^/]+/` → `${translatedLocale}`); सहायक स्क्रिप्ट [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh)।

<a id="config---docsoutputstyle--doc-system"></a>
### कॉन्फ़िग - `docsOutput.style = "doc-system"`

किसी भी दस्तावेज़-प्रणाली साइट के लिए सामान्य पैटर्न B जो साझा स्थिर URL उपसर्ग के माध्यम से स्क्रीनशॉट का संदर्भ देती है। सपाट लिंक पुनःलेखक चलता नहीं है; `postProcessing` मूल मार्कडाउन URL में स्थानीयकरण खंड को पुनःलिखित करता है।

<details>
<summary>डॉक-सिस्टम लेआउट के लिए उदाहरण regexAdjustments</summary>

```json
"docsOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

`localeSubpath` को अपने जनरेटर के लेआउट के अनुरूप सेट करें `{locale}/` और अनुवादित फ़ाइल के बीच, या डिफ़ॉल्ट उपयुक्त होने पर `"doc-system"` के बजाय प्रीसेट उपनाम (`"docusaurus"`, `"astro-starlight"`) का उपयोग करें। स्रोत मार्कडाउन आमतौर पर URL में स्रोत स्थानीयकरण एम्बेड करता है:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

प्रत्येक लक्ष्य स्थानीयकरण के लिए समान पथ पर मिलते-जुलते PNG फ़ाइल भेजें (उदाहरण के लिए `static/img/screenshots/de/screenshot.png`)। यदि `sourceLocale` में परिवर्तन होता है तो भी नियम काम करे, इसलिए `screenshots/en-GB/` में हार्डकोडिंग के बजाय `screenshots/[^/]+/` को प्राथमिकता दें।

<a id="preset---docsoutputstyle--docusaurus"></a>
### प्रीसेट - `docsOutput.style = "docusaurus"`

`"doc-system"` के समान, डिफ़ॉल्ट `localeSubpath = "docusaurus-plugin-content-docs/current"` के साथ। सपाट लिंक पुनःलेखक चलता नहीं है। `postProcessing` मूल मार्कडाउन URL देखता है। अंग्रेजी पृष्ठ आमतौर पर स्रोत स्थानीयकरण के साथ एक निरपेक्ष पथ का उपयोग करते हैं:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>डॉक्यूसॉरस प्रीसेट के लिए उदाहरण regexAdjustments</summary>

```json
"docsOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

`docs-site/static/img/screenshots/<locale>/screenshot.png` पर मिलते-जुलते PNG फ़ाइल भेजें। स्रोत-स्थानीयकरण-अज्ञेय विन्यास के लिए `screenshots/en-GB/` के बजाय `screenshots/[^/]+/` को प्राथमिकता दें।

लागूकरण उदाहरण: [examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) के साथ [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) में पहला `docs[]` ब्लॉक।

<a id="preset---docsoutputstyle--astro-starlight"></a>
### प्रीसेट - `docsOutput.style = "astro-starlight"`

`"doc-system"` के समान, `localeSubpath: ""` के साथ — अनुवादित पृष्ठ सीधे `{outputDir}/{locale}/` के अधीन स्थित हैं। उपरोक्त सामान्य दस्तावेज़-प्रणाली विन्यास के समान ही पैटर्न B सिद्धांत। स्रोत मार्कडाउन `/img/screenshots/en-GB/screenshot.png` का उपयोग करता है:

<details>
<summary>एस्ट्रो स्टारलाइट प्रीसेट के लिए उदाहरण regexAdjustments</summary>

```json
"docsOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

`public/img/screenshots/<locale>/screenshot.png` पर PNG भेजें।

लागूकरण उदाहरण: [examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) और [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`)।

---

<a id="pattern-c---colocated-raster-doc-system"></a>
## पैटर्न C - सह-स्थित रास्टर (`doc-system`)

उपयोग तब करें जब एक `doc-system` साइट अनुवादित मार्कडाउन के बगल में स्थानीयकरण-विशिष्ट संपत्तियों को रखती हो — कोई URL पुन:लेखन की आवश्यकता नहीं होती। डॉकुसॉरस प्रीसेट (`docsOutput.style = "docusaurus"`) संदर्भ लागूकरण है; `"doc-system"` के साथ एक कस्टम `localeSubpath` का उपयोग करने वाले अन्य जनरेटर भी इसी विचार का अनुसरण करते हैं: अंग्रेजी संपत्तियाँ स्रोत-स्थानीयकरण पथ पर मौजूद होती हैं, अनुवादित संपत्तियाँ `{outputDir}/{locale}/[localeSubpath/]assets/` के अंतर्गत मौजूद होती हैं।

<a id="directory-layout-1"></a>
### निर्देशिका लेआउट

<details>
<summary>सहस्थानीय संपत्ति निर्देशिका ट्री का उदाहरण (Docusaurus)</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

हर स्थानीयकरण में सभी दस्तावेज़ समान सापेक्ष पथ का उपयोग करते हैं:

```markdown
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

अंग्रेजी (`en-GB`) स्थानीयकरण के लिए, `../assets/` सिमलिंक के माध्यम से `static/assets/` को हल करता है। अनुवादित स्थानीयकरण के लिए यह सीधे स्थानीयकरण की अपनी `current/assets/` निर्देशिका को हल करता है।

<a id="screenshot-script-contract-1"></a>
### स्क्रीनशॉट स्क्रिप्ट अनुबंध

स्क्रिप्ट को प्रत्येक स्थानीयकरण के लिए सही निर्देशिका में PNG लिखना चाहिए। `getScreenshotDir` फ़ंक्शन विभाजन को एन्कोड करता है:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

लागूकरण को उत्पादन में [duplistatus](https://github.com/wsj-br/duplistatus) रिपॉजिटरी से [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) में देखें (स्थानीय संदर्भ प्रतिलिपि: [references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts))।

<a id="config"></a>
### कॉन्फ़िग

रास्टर फ़ाइलों के लिए कोई `regexAdjustments` नियम आवश्यक नहीं है। `translate-docs` मार्कडाउन में वैकल्पिक पाठ का अनुवाद करता है लेकिन URL अपरिवर्तित रहता है:

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

यदि परियोजना अनुवादित SVGs का भी उपयोग करती है, तो पैटर्न E उन्हें संभालता है और वे PNGs के साथ `current/assets/` में बिना किसी अतिरिक्त regex के आते हैं।

<a id="prerequisites"></a>
### पूर्वापेक्षाएँ

- `docs/assets` सिम्लिंक होना चाहिए: `ln -s ../static/assets documentation/docs/assets`
- Docusaurus webpack डिफ़ॉल्ट रूप से सिम्लिंक्स का पालन करता है (`resolve.symlinks` Docusaurus निर्माण में `true` पर डिफ़ॉल्ट होता है)
- सिम्लिंक केवल स्रोत स्थानीयकरण के लिए होना चाहिए — अनुवादित निर्माण इसका उपयोग नहीं करते हैं

<a id="implementation-example-1"></a>
### कार्यान्वयन उदाहरण

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) में `getScreenshotDir(locale)`; अंग्रेजी दस्तावेज़ सह-स्थित PNG को संदर्भित करते हैं (उदाहरण के लिए [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md) के साथ `../assets/screen-dashboard-summary.png`); [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) में कोई PNG `regexAdjustments` नहीं। उसी प्रोजेक्ट के पैटर्न E SVG भी उन्हीं `current/assets/` निर्देशिकाओं में स्थित हैं (नीचे देखें)।

---

<a id="pattern-d---translated-svg-with-svgstyle--flat"></a>
## पैटर्न D - `svg.style = "flat"` के साथ अनुवादित SVG

जब एक वेब ऐप स्थानीय-विशिष्ट SVG चित्रण या आरेखों को एम्बेड करता है और उन्हें रनटाइम पर स्थानीय कोड द्वारा संदर्भित करता है, तब इसका उपयोग करें।

<a id="config-1"></a>
### कॉन्फ़िग

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` हर `.svg` को `images/` के तहत पढ़ता है और प्रत्येक स्थानीयकरण के लिए एक फ़ाइल लिखता है:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### ऐप संदर्भ

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### स्रोत लेआउट अनुशंसा

स्रोत SVGs को आउटपुट निर्देशिका से अलग रखें। `sourcePath: "images"` और `outputDir: "public/assets"` के साथ दोनों निर्देशिकाएँ अलग हैं। कभी भी दोनों को एक ही निर्देशिका पर सेट न करें।

<a id="implementation-example-2"></a>
### कार्यान्वयन उदाहरण

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) में `svg` ब्लॉक (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); स्रोत [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg); प्रति-स्थानीय आउटपुट [public/assets/](../../docs/../examples/nextjs-app/public/assets/) के तहत (जैसे `translation_demo_svg.de.svg`); रनटाइम URL [page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) में (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
## पैटर्न E - स्थानीयकृत अनुवादित SVG (doc-system)

उन डॉक-सिस्टम साइटों के लिए उपयोग करें जहां अनुवादित SVG चित्रण को प्रत्येक स्थानीयकरण की सामग्री निर्देशिका में अनुवादित दस्तावेज़ों के साथ दिखाई देना चाहिए — पैटर्न C रास्टर स्क्रीनशॉट के समान स्थान। Docusaurus प्रीसेट इसका प्राथमिक उदाहरण है।

<a id="config-2"></a>
### कॉन्फ़िग

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` प्रत्येक स्थानीयकरण के लिए एक SVG लिखता है, उसी `current/assets/` निर्देशिका में जिसका पैटर्न C PNG के लिए उपयोग करता है:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### स्रोत मार्कडाउन

सभी स्थानीयकरणों में दस्तावेज़ समान सापेक्ष पथ का उपयोग करते हैं:

```markdown
![Diagram](../../docs/../assets/diagram.svg)
```

अंग्रेज़ी स्थानीयकरण के लिए सिमलिंक `docs/assets → ../static/assets` इसे हल करता है। अनुवादित स्थानीयकरणों के लिए यह सीधे `current/assets/` को हल करता है।

कोई `regexAdjustments` नियम आवश्यक नहीं है क्योंकि अंग्रेज़ी स्रोत दस्तावेज़ और अनुवादित आउटपुट दस्तावेज़ समान पथ का उपयोग करते हैं।

<a id="svg-source-location"></a>
### SVG स्रोत स्थान

अनुशंसित: स्रोत SVG को en-GB PNG के साथ `documentation/static/assets/` में संग्रहीत करें। इससे सभी दस्तावेज़ीकरण संपत्तियां एक ही स्थान पर रहती हैं, और एक ही `docs/assets` सिमलिंक दोनों को कवर करता है। फिर `svg.sourcePath` प्रविष्टियां `documentation/static/assets/name.svg` की ओर इशारा करती हैं।

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` प्लेसहोल्डर

| प्लेसहोल्डर              | मान                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir` का पूर्ण हल किया गया पथ              |
| `{locale}`               | लक्ष्य स्थानीयकरण कोड                                     |
| `{LOCALE}`               | ऊपरी केस में स्थानीयकरण कोड                                 |
| `{relPath}`              | स्रोत SVG तक `sourcePath` मूल से सापेक्ष पथ |
| `{stem}`                 | बिना एक्सटेंशन के फ़ाइल नाम                             |
| `{basename}`             | एक्सटेंशन के साथ फ़ाइल नाम                                |
| `{extension}`            | डॉट सहित एक्सटेंशन                                |
| `{relativeToSourceRoot}` | निकटतम `sourcePath` मूल से सापेक्ष पथ       |

पूर्ण संदर्भ [svg configuration table](GETTING_STARTED.hi.md#svg) में उपलब्ध है।

<a id="implementation-example-3"></a>
### लागूकरण उदाहरण

[duplistatus](https://github.com/wsj-br/duplistatus) — [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) में `pathTemplate` के साथ नेस्टेड `svg` ब्लॉक; स्रोत SVG को `documentation/static/img/` के अंतर्गत सूचीबद्ध किया गया है (उदाहरण के लिए [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg` प्रति-स्थानीयकरण फ़ाइलों को `documentation/i18n/<locale>/…/current/assets/` में लिखता है, जो पैटर्न C PNG के पास है; दस्तावेज़ आज `/img/duplistatus_*.svg` के माध्यम से उन्हें एम्बेड करते हैं (उदाहरण के लिए [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md))। `../assets/` पथ पर जाने और SVG `regexAdjustments` ब्रिज को हटाने की योजना के लिए [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md) देखें।

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## फ्लैट लिंक पुन:लेखक और दो-चरणीय प्रवाह

`docsOutput.style = "flat"` के लिए (और जब तक `rewriteRelativeLinks: false` या कोई अनुकूलित `pathTemplate` सेट न हो), `postProcessing` से पहले एक अंतर्निहित पुन:लेखन चलता है। यह क्रॉस-डॉक लिंक्स को संभालता है (स्थानीय उपसर्ग जोड़कर) और गैर-मार्कडाउन संपत्ति URL में गहराई उपसर्ग जोड़ता है।

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"` होने पर दो-चरणीय प्रवाह

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

`outputDir: "translated-docs/"` और स्रोत `README.md` के साथ उदाहरण, जो रिपॉजिटरी की जड़ में है:

1. फ्लैट लिंक पुन:लेखक: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (`translated-docs/` के लिए एक `../`)
2. `postProcessing` रेगेक्स `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

`docsOutput.style = "doc-system"` के लिए (`"docusaurus"`, `"astro-starlight"`, और `"nested"` सहित), फ्लैट लिंक पुन:लेखन चलता नहीं है। `postProcessing` अनुवादित मार्कडाउन से मूल URL देखता है (आमतौर पर एक निरपेक्ष पथ जैसे `/img/screenshots/en-GB/foo.png`)।

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### `flatPreserveRelativeDir` के साथ प्रति-फ़ाइल गहराई उपसर्ग

गहराई उपसर्ग प्रत्येक आउटपुट फ़ाइल के लिए गणना की जाती है — पूरे बैच के लिए वैश्विक रूप से नहीं। प्रत्येक स्रोत फ़ाइल के लिए, पुन:लेखक आउटपुट फ़ाइल की निर्देशिका से स्रोत फ़ाइल की निर्देशिका तक का सापेक्ष पथ गणना करता है और उसे उपसर्ग के रूप में उपयोग करता है।

इसका अर्थ है कि `flatPreserveRelativeDir: true` के साथ, उपनिर्देशिकाओं में स्रोत फ़ाइलों को स्वचालित रूप से सही उपसर्ग मिल जाता है। उदाहरण के लिए, `docs/GETTING_STARTED.md` `translated-docs/docs/GETTING_STARTED.<locale>.md` पर आउटपुट करता है। प्रति-फ़ाइल उपसर्ग `../../docs/` है, इसलिए एक एसेट `translation-dashboard.png` (स्रोत के सापेक्ष) `../../docs/translation-dashboard.png` बन जाता है — जो `translated-docs/docs/` से `docs/translation-dashboard.png` तक सही ढंग से हल हो जाता है।

स्रोत फ़ाइलों के साथ स्थित सापेक्ष-पथ संपत्तियों के लिए कोई `postProcessing` रेगेक्स सुधार की आवश्यकता नहीं होती है।

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` और `linkRewriteDocsRoot`

| विकल्प                                   | प्रभाव                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | फ्लैट लिंक पुन:लेखन को स्पष्ट रूप से सक्षम या अक्षम करता है (जब `docsOutput.style = "flat"` हो तो डिफ़ॉल्ट को ओवरराइड करता है) |
| `docsOutput.linkRewriteDocsRoot`     | वह मूल जिसके आधार पर `depthPrefix` की गणना की जाती है (डिफ़ॉल्ट `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | आउटपुट पथ लेआउट को प्रभावित करता है, जिसका उपयोग पुन:लेखन ज्ञात अनुवादित फ़ाइलों के लिए लक्ष्य पथ की गणना करते समय करता है       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
## सामान्य त्रुटियाँ और समस्यानिवारण

**स्क्रीनशॉट पथ में स्थानीयकरण निर्देशिका नहीं**
`images/screenshots/screenshot.png` — स्थानीयकृत संस्करणों को अलग नहीं कर सकता और पुनर्लेखित नहीं किया जा सकता। पैटर्न B लागू करने से पहले `images/screenshots/<locale>/screenshot.png` में पुनर्गठन करें।

**रेगेक्स में हार्डकोडेड स्रोत स्थानीयकरण**
`"search": "screenshots/en-GB/"` — यदि `sourceLocale` बदल जाता है तो चुपचाप विफल हो जाता है। इसके बजाय `"search": "screenshots/[^/]+/"` का उपयोग करें।

**एक ही निर्देशिका में SVG स्रोत और आउटपुट**
यदि `svg.sourcePath` और `svg.outputDir` ओवरलैप करते हैं, तो उत्पन्न फ़ाइलें हाथ से संपादित स्रोतों के साथ मिल जाती हैं। उन्हें अलग निर्देशिकाओं में रखें।

**सह-स्थित SVG के लिए निरपेक्ष डॉक्यूसॉरस स्थिर URL**
`/img/diagram.svg` (`static/img/` से) को अनुवादित आउटपुट में `../assets/` में पुनर्लेखित करने के लिए `regexAdjustments` नियम की आवश्यकता होती है। इससे बचने के लिए स्रोत SVG को `static/assets/` में रखें और शुरू से ही सापेक्ष `../assets/diagram.svg` का उपयोग करें।

**डॉक्यूसॉरस में गायब `docs/assets` सिमलिंक**
सिमलिंक के बिना, `docs/user-guide/` में स्रोत दस्तावेज़ `static/assets/` में PNG या SVG को सापेक्ष पथ के माध्यम से संदर्भित नहीं कर सकते। प्रोजेक्ट निर्माण के समय सिमलिंक सेट करें: `ln -s ../static/assets documentation/docs/assets`।

**`take-screenshots` स्क्रिप्ट केवल स्रोत भाषा को कैप्चर करती है**
पैटर्न B को प्रत्येक भाषा के लिए PNG फ़ाइलों की आवश्यकता होती है। यदि स्क्रिप्ट केवल `en-GB` को कैप्चर करती है, तो अनुवादित दस्तावेज़ों में गायब फ़ाइलों की ओर इशारा करते हुए पुनर्लिखित पथ होंगे।
