<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# ai-i18n-tools एसेट के साथ क्या करता है (और क्या नहीं करता है)

`translate-docs` मार्कडाउन/MDX सामग्री का अनुवाद करता है — जिसमें इमेज ऑल्ट टेक्स्ट भी शामिल है — लेकिन यह रास्टर फ़ाइलों को कॉपी, जनरेट या उत्सर्जित नहीं करता है। यदि किसी अनुवादित पृष्ठ को स्थानीय-विशिष्ट स्क्रीनशॉट की आवश्यकता है, तो आपको उस फ़ाइल को उस पथ पर रखना होगा जिसे अनुवादित मार्कडाउन संदर्भित करेगा।

`translate-svg` एकमात्र कमांड है जो स्थानीय-विशिष्ट बाइनरी फ़ाइलों को उत्सर्जित करता है। यह स्रोत SVG फ़ाइलों को पढ़ता है, टेक्स्ट तत्वों (`<text>`, `<title>`, `<desc>`) का अनुवाद करता है, और प्रति स्थानीय एक आउटपुट SVG लिखता है। रास्टर फ़ाइलें (PNG, JPEG, WebP, GIF) टूल द्वारा कभी नहीं लिखी जाती हैं।

---

<a id="design-for-i18n-from-the-start"></a>
# शुरू से ही i18n के लिए डिज़ाइन करें

कोई भी स्क्रीनशॉट मौजूद होने से पहले सही निर्देशिका लेआउट चुनना इस बात का सबसे बड़ा कारक है कि बाद में स्थानीय-विशिष्ट एसेट कितने आसान होंगे। दर्जनों स्क्रीनशॉट प्रतिबद्ध होने के बाद लेआउट को रेट्रोफिट करने का मतलब है पथों को पुनर्गठित करना और हर मार्कडाउन संदर्भ को अपडेट करना।

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### `docsOutput.style = "flat"` के साथ मार्कडाउन (README, USER-GUIDE)

पहले दिन से ही स्थानीय-कोडित उपनिर्देशिका के तहत स्क्रीनशॉट स्टोर करें:

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

जब आप बाद में i18n जोड़ते हैं, तो आपकी `take-screenshots` स्क्रिप्ट हर स्थानीय के लिए `images/screenshots/<locale>/` में लिखती है, और एक `regexAdjustments` नियम उन सभी को संभालता है:

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

जेनेरिक `[^/]+` रेगुलर एक्सप्रेशन किसी भी स्थानीय फ़ोल्डर नाम से मेल खाता है — अपने स्रोत स्थानीय (जैसे `screenshots/en-GB/`) को हार्डकोड न करें क्योंकि यदि `sourceLocale` कभी बदलता है तो यह टूट जाता है।

यदि आप उन पथों से शुरू करते हैं जो स्थानीय उपनिर्देशिका (`images/screenshots/translate.png`) को छोड़ देते हैं, तो आपको [प्रति-स्थानीय फ़ोल्डर](/hi/guide/images-and-screenshots/per-locale-folder) पुनर्लेखन के काम करने से पहले पूरे ट्री को पुनर्गठित करना होगा।

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### डॉक-सिस्टम साइटें (`docsOutput.style = "doc-system"`)

स्थिर दस्तावेज़ साइटों के लिए उपयोग करें जो अनुवादित पृष्ठों को स्थानीय-उपसर्ग वाले ट्री के तहत संग्रहीत करती हैं — Docusaurus i18n, Astro Starlight, और कस्टम जनरेटर जो समान आकार का पालन करते हैं। `docsRoot` के तहत फ़ाइलें इसमें लिखी जाती हैं:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docs[].docsOutput.docsRoot` को अपनी अंग्रेजी स्रोत रूट पर सेट करें (जैसे `"docs"` या `"src/content/docs"`)। जब आप `style: "doc-system"` को सीधे सेट करते हैं, तो आपको `localeSubpath` को भी उस पथ खंड पर सेट करना होगा जिसका उपयोग आपकी साइट `{locale}/` और अनुवादित फ़ाइल के बीच करती है। उपनाम `"docusaurus"`, `"astro-starlight"`, और `"vitepress"` डिफ़ॉल्ट `localeSubpath` मानों के साथ प्रीसेट `doc-system` लेआउट हैं ([आउटपुट लेआउट](/hi/guide/documents/output-layouts) देखें)।

| प्रीसेट उपनाम | डिफ़ॉल्ट `localeSubpath` | उदाहरण आउटपुट |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (खाली) | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""` (खाली) | `docs/de/guide/quick-start.md` |

फ्लैट लिंक रewriter `doc-system` (`"flat"` के विपरीत) के लिए **नहीं** चलता है। `postProcessing.regexAdjustments` स्रोत मार्कडाउन से मूल URL देखता है — आमतौर पर `/img/screenshots/en-GB/foo.png` जैसा एक पूर्ण या साइट-रूट पथ।

**प्रति-स्थानीय फ़ोल्डर** लेआउट तब लागू होता है जब स्क्रीनशॉट एक साझा स्थिर URL ट्री में रहते हैं: पहले दिन से एक स्थानीय-कोडित फ़ोल्डर और एक सामान्य `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` नियम का उपयोग करें ([कॉन्फ़िग — डॉक-सिस्टम](#config---docsoutputstyle--doc-system) देखें)।

**सह-स्थित स्क्रीनशॉट** तब लागू होते हैं जब प्रत्येक स्थानीय के अनुवादित दस्तावेज़ मार्कडाउन के बगल में एसेट संग्रहीत करते हैं (कोई URL पुनर्लेखन नहीं)। आपकी स्क्रीनशॉट स्क्रिप्ट को `{outputDir}`, `{locale}`, और `{localeSubpath}` से प्राप्त पथों में PNG लिखना होगा — नीचे दिया गया Docusaurus प्रीसेट संदर्भ लेआउट है।

<a id="docusaurus-preset"></a>
#### Docusaurus प्रीसेट

प्रोजेक्ट सेटअप पर दो आदतें बाद में सभी रेगुलर एक्सप्रेशन ब्रिजिंग को खत्म कर देती हैं:

1. कोई भी स्क्रीनशॉट जोड़ने से पहले एक सिम्लिंक `documentation/docs/assets → ../static/assets` बनाएँ। Docusaurus का वेबपैक डिफ़ॉल्ट रूप से सिम्लिंक का अनुसरण करता है, और यह स्रोत डॉक्स को सापेक्ष पथों का उपयोग करने देता है जिनका अनुवादित डॉक्स भी उपयोग करेंगे।

2. सभी दस्तावेज़ संपत्तियाँ — PNG और SVG — `static/assets/` (एक निर्देशिका) में रखें। उन्हें `static/img/` (SVG) और `static/assets/` (PNG) के बीच विभाजित न करें। एक एकीकृत स्थान का मतलब है कि हर दस्तावेज़ पृष्ठ, अंग्रेजी और अनुवादित, एक ही सापेक्ष पथ `../assets/name.ext` को संदर्भित कर सकता है।

स्रोत मार्कडाउन में स्थिर सापेक्ष पथ `../assets/name.ext` के साथ हर संपत्ति को संदर्भित करें। दस्तावेज़ संपत्तियों के लिए कभी भी निरपेक्ष `/img/` या `/assets/` URL का उपयोग न करें — वे URL अंग्रेजी स्रोत (`static/` से परोसे गए) और अनुवादित लोकेल (अनुवादित डॉक्स के साथ सह-स्थित) के बीच भिन्न होते हैं, जो उन्हें ब्रिज करने के लिए एक `regexAdjustments` नियम को मजबूर करता है।

जब आप बाद में i18n जोड़ते हैं, तो स्क्रीनशॉट स्क्रिप्ट `getScreenshotDir` विभाजन को अपनाती है ([सह-स्थित स्क्रीनशॉट](/hi/guide/images-and-screenshots/colocated-screenshots) देखें) और `translate-svg` एक `pathTemplate` का उपयोग करता है। किसी रेगुलर एक्सप्रेशन समायोजन की आवश्यकता नहीं है।

> **नोट:** `next.config.ts` में `resolve.symlinks = false` केवल Next.js एप्लिकेशन वेबपैक बिल्ड के लिए सिम्लिंक रिज़ॉल्यूशन को अक्षम करता है। यह Docusaurus दस्तावेज़ साइट बिल्ड को प्रभावित नहीं करता है, जो एक अलग वेबपैक इंस्टेंस का उपयोग करता है।

<a id="astrostarlight-preset"></a>
#### Astro/Starlight प्रीसेट

`docsOutput.style = "doc-system"` के बराबर `localeSubpath: ""` के साथ — अनुवादित पृष्ठ सीधे `{outputDir}/{locale}/` के अंतर्गत आते हैं।

पहले दिन से ही लोकेल-कोडित पथ के अंतर्गत स्क्रीनशॉट संग्रहीत करें:

```
public/img/screenshots/en-GB/screenshot.png
```

`regexAdjustments` में सामान्य रेगुलर एक्सप्रेशन का उपयोग करें:

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### वेब ऐप्स (Next.js, Vite, आदि) SVG संपत्तियों के साथ

SVG स्रोत फ़ाइलों को एक समर्पित स्रोत निर्देशिका (जैसे `images/` या `src/assets/`) में रखें और `svg.outputDir` को एक अलग सेवा निर्देशिका (जैसे `public/assets/`) में कॉन्फ़िगर करें। स्रोत SVG और `translate-svg` आउटपुट फ़ाइलों को कभी भी एक ही फ़ोल्डर में न मिलाएँ — यह बताना असंभव हो जाता है कि कौन सी फ़ाइलें जेनरेट की गई हैं।

SVG को शुरू से ही अनुवाद योग्य बनाने के लिए डिज़ाइन करें: सभी मानव-पठनीय लेबल के लिए `<text>`, `<title>`, और `<desc>` तत्वों का उपयोग करें। पाठ को पथ डेटा के रूप में एम्बेड करने से बचें।

फ़ाइल सिस्टम और CDN में केस-संवेदनशीलता बेमेल से बचने के लिए `svg` कॉन्फ़िग ब्लॉक में `forceLowercase: true` सक्षम करें।

---

<a id="decision-guide"></a>
# निर्णय मार्गदर्शिका

**क्या संपत्ति अनुवाद योग्य पाठ या लेबल के साथ एक SVG है?**
  - **हाँ** → [वेब ऐप SVG](/hi/guide/svg-translation/translated-svg-web-app) या [सह-स्थित SVG](/hi/guide/svg-translation/translated-svg-colocated)
  - **नहीं** (रास्टर स्क्रीनशॉट या सजावटी SVG) →
    - **अनुवादित डॉक्स के बगल में सह-स्थित संपत्तियों के साथ डॉक-सिस्टम साइट?**
      - **हाँ** → [सह-स्थित स्क्रीनशॉट](/hi/guide/images-and-screenshots/colocated-screenshots) (रास्टर) + [सह-स्थित SVG](/hi/guide/svg-translation/translated-svg-colocated) (SVG)
    - **केवल एक लोकेल को छवि की आवश्यकता है** (कोई प्रति-लोकेल वेरिएंट नहीं)?
      - **हाँ** → [साझा छवि](/hi/guide/images-and-screenshots/shared-image)
    - **अन्यथा** → [प्रति-लोकेल फ़ोल्डर](/hi/guide/images-and-screenshots/per-locale-folder)

SVG लेआउट [SVG अनुवाद](/hi/guide/svg-translation/) मार्गदर्शिका में शामिल हैं।

| लेआउट                                                                       | संपत्ति का प्रकार                  | साइट का प्रकार                                                              | उपकरण तंत्र                                               |
|------------------------------------------------------------------------------|-----------------------------|------------------------------------------------------------------------|--------------------------------------------------------------|
| [सह-स्थित स्क्रीनशॉट](/hi/guide/images-and-screenshots/colocated-screenshots) | रास्टर (सह-स्थित)          | `"doc-system"` सह-स्थित संपत्तियों के साथ (Docusaurus प्रीसेट)               | स्क्रीनशॉट स्क्रिप्ट फ़ाइलें रखती है; कोई रेगुलर एक्सप्रेशन नहीं                     |
| [प्रति-लोकेल फ़ोल्डर](/hi/guide/images-and-screenshots/per-locale-folder)         | रास्टर (प्रति-लोकेल)         | `"flat"` या `"doc-system"` (शामिल `"docusaurus"`, `"astro-starlight"`) | `regexAdjustments` लोकेल सेगमेंट स्वैप                       |
| [साझा छवि](/hi/guide/images-and-screenshots/shared-image)                   | रास्टर (साझा)             | `docsOutput.style = "flat"` डॉक्स                                       | प्रति-फ़ाइल लिंक रीराइटर; आमतौर पर कोई रेगुलर एक्सप्रेशन नहीं                     |
| [कोलोकेटेड SVG](/hi/guide/svg-translation/translated-svg-colocated)             | SVG (अनुवादित, कोलोकेटेड) | कोलोकेटेड एसेट (Docusaurus प्रीसेट) के साथ `"doc-system"`               | `translate-svg` + `pathTemplate` के साथ `svg.style = "nested"` |
| [वेब ऐप SVG](/hi/guide/svg-translation/translated-svg-web-app)                 | SVG (अनुवादित)            | वेब ऐप                                                                | `svg.style = "flat"` के साथ `translate-svg`                    |
