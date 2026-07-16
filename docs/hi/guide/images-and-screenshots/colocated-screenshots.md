<a id="colocated-raster-doc-system"></a>
# सह-स्थित रास्टर (`doc-system`)

इसका उपयोग तब करें जब कोई `doc-system` साइट स्थानीय-विशिष्ट संपत्तियों को अनुवादित मार्कडाउन के साथ सह-स्थित करती है — किसी URL पुनर्लेखन की आवश्यकता नहीं है। Docusaurus प्रीसेट (`docsOutput.style = "docusaurus"`) संदर्भ कार्यान्वयन है; एक कस्टम `localeSubpath` के साथ `"doc-system"` का उपयोग करने वाले अन्य जनरेटर उसी विचार का पालन करते हैं: अंग्रेजी संपत्तियां एक स्रोत-स्थानीय पथ पर रहती हैं, अनुवादित संपत्तियां `{outputDir}/{locale}/[localeSubpath/]assets/` के तहत रहती हैं।

> **इन-रेपो उदाहरण क्यों नहीं:** इस रिपॉजिटरी के Docusaurus डेमो ([`examples/docusaurus-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/), [`examples/nextjs-app`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/)) इसके बजाय [प्रति-स्थानीय फ़ोल्डर](/hi/guide/images-and-screenshots/per-locale-folder) लेआउट का उपयोग करते हैं — [निर्णय मार्गदर्शिका](/hi/guide/images-and-screenshots/#decision-guide) देखें। सह-स्थित `../assets/` अनुशंसित ग्रीनफ़ील्ड पैटर्न है; [duplistatus](https://github.com/wsj-br/duplistatus) पूर्ण उत्पादन संदर्भ है।

<a id="directory-layout"></a>
### निर्देशिका लेआउट

<details>
<summary>उदाहरण सह-स्थित संपत्ति निर्देशिका ट्री (Docusaurus)</summary>

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

प्रत्येक स्थानीय में सभी दस्तावेज़ एक ही सापेक्ष पथ का उपयोग करते हैं:

```markdown
![Dashboard](../assets/screen-dashboard.png)
```

अंग्रेजी (`en-GB`) स्थानीय के लिए, `../assets/` सिम्लिंक के माध्यम से `static/assets/` पर हल होता है। अनुवादित स्थानीय के लिए यह सीधे स्थानीय की अपनी `current/assets/` निर्देशिका पर हल होता है।

<a id="screenshot-script-contract"></a>
### स्क्रीनशॉट स्क्रिप्ट अनुबंध

स्क्रिप्ट को प्रत्येक स्थानीय के लिए सही निर्देशिका में PNG लिखना होगा। `getScreenshotDir` फ़ंक्शन विभाजन को एन्कोड करता है:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

[duplistatus](https://github.com/wsj-br/duplistatus) रिपॉजिटरी से [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) में एक वास्तविक-विश्व कार्यान्वयन देखें।

<a id="config"></a>
### कॉन्फ़िग

रास्टर फ़ाइलों के लिए किसी `regexAdjustments` नियम की आवश्यकता नहीं है। `translate-docs` मार्कडाउन में alt टेक्स्ट का अनुवाद करता है लेकिन URL अपरिवर्तित रहता है:

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

यदि परियोजना अनुवादित SVG का भी उपयोग करती है, तो [सह-स्थित SVG अनुवाद](/hi/guide/svg-translation/translated-svg-colocated) उन्हें संभालता है और वे बिना किसी अतिरिक्त रेगुलर एक्सप्रेशन के `current/assets/` में PNG के साथ उतरते हैं।

<a id="prerequisites"></a>
### पूर्वापेक्षाएँ

- `docs/assets` सिम्लिंक मौजूद होना चाहिए: `ln -s ../static/assets documentation/docs/assets`
- Docusaurus वेबपैक डिफ़ॉल्ट रूप से सिम्लिंक का पालन करता है (Docusaurus बिल्ड में `resolve.symlinks` डिफ़ॉल्ट रूप से `true` होता है)
- सिम्लिंक केवल स्रोत स्थानीय के लिए मौजूद होना चाहिए — अनुवादित बिल्ड इसका उपयोग नहीं करते हैं

<a id="implementation-example"></a>
### कार्यान्वयन उदाहरण

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) में `getScreenshotDir(locale)`; अंग्रेजी दस्तावेज़ सह-स्थित PNGs (जैसे `../assets/screen-dashboard-summary.png` के साथ [dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md)) का संदर्भ देते हैं। उसी परियोजना से सह-स्थित SVGs उसी `current/assets/` निर्देशिकाओं में उतरते हैं — [सह-स्थित SVG](/hi/guide/svg-translation/translated-svg-colocated) देखें।
