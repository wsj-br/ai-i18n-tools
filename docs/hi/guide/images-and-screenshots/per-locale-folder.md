<a id="per-locale-folder-url-rewriting"></a>
# प्रति-स्थानिक फ़ोल्डर (URL पुनर्लेखन)

`docsOutput.style = "flat"` के साथ README/USER-GUIDE के लिए, और डॉक-सिस्टम साइटों (`docsOutput.style = "doc-system"` या उपनाम `"docusaurus"` / `"astro-starlight"`) के लिए और `"vitepress"` / अन्य डॉक-सिस्टम प्रीसेट के लिए उपयोग करें जो एक साझा स्थिर URL ट्री से स्क्रीनशॉट प्रदान करते हैं। VitePress के लिए लिंक-पुनर्लेखन विवरण: [लिंक पुनर्लेखन — VitePress](/hi/guide/images-and-screenshots/link-rewriting#vitepress-link-normalizer-style-vitepress)।

<a id="directory-layout"></a>
### निर्देशिका लेआउट

<details>
<summary>प्रति-स्थानिक स्क्रीनशॉट निर्देशिका ट्री का उदाहरण</summary>

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

स्रोत मार्कडाउन स्रोत स्थानीय निर्देशिका को संदर्भित करता है:

```markdown
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### स्क्रीनशॉट स्क्रिप्ट अनुबंध

`take-screenshots` स्क्रिप्ट को हर स्थानीय के लिए फ़ाइलें लिखनी चाहिए - न कि केवल स्रोत स्थानीय के लिए। `translate-docs` कमांड पथों को फिर से लिखता है लेकिन फ़ाइलें नहीं बनाता है। एक विशिष्ट सहायक:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh) में स्क्रीनशॉट स्क्रिप्ट में एक साधारण `bash` उदाहरण देखें, या [duplistatus](https://github.com/wsj-br/duplistatus) प्रोजेक्ट से [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) में एक अधिक जटिल उदाहरण देखें (जो [Transrewrt](https://github.com/wsj-br/transrewrt) द्वारा उत्पादन में भी उपयोग किया जाता है)।

> **नोट:** नीचे दिए गए चार उप-अनुभाग एक ही `regexAdjustments` स्थानीय-खंड स्वैप (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`) साझा करते हैं। केवल आउटपुट लेआउट और क्या फ्लैट लिंक रीराइटर पहले चलता है, इसमें अंतर होता है — उस उप-अनुभाग पर जाएं जो आपके `docsOutput.style` से मेल खाता है।
>
> **नोट:** `regexAdjustments` पूर्ण अनुवादित मार्कडाउन बॉडी पर चलता है, जिसमें फेंस्ड कोड ब्लॉक भी शामिल हैं। यदि एक डॉक पेज में एक कॉन्फ़िग उदाहरण एम्बेड किया गया है जिसमें एक मिलान पथ (जैसे `screenshots/en-GB/`) शामिल है, तो वह स्निपेट भी अनुवादित आउटपुट में फिर से लिखा जाएगा। पुन: प्रयोज्य उदाहरणों में सामान्य `screenshots/[^/]+/` फ़ॉर्म को प्राथमिकता दें।

<a id="config---docsoutputstyle--flat"></a>
### कॉन्फ़िग - `docsOutput.style = "flat"`

फ्लैट लिंक रीराइटर पहले चलता है जब `docsOutput.style = "flat"` और गैर-मार्कडाउन URL में एक गहराई उपसर्ग जोड़ता है। `outputDir: "translated-docs/"` के साथ रेपो रूट पर `README.md` के लिए, यह `../` जोड़ता है:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

फिर `regexAdjustments` नियम उस पहले से उपसर्गित URL के भीतर स्थानीय खंड को बदल देता है:

<details>
<summary>फ्लैट लेआउट के लिए regexAdjustments का उदाहरण</summary>

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

परिणाम: `../images/screenshots/de/translate.png` — `translated-docs/README.de.md` से रेपो रूट तक सही सापेक्ष पथ।

`postProcessing` चरण फ्लैट लिंक रीराइटर के बाद चलता है। `search` रेगुलर एक्सप्रेशन लिखें जो पहले से उपसर्गित URL के भीतर कहीं भी स्थानीय खंड से मेल खाते हों — रेगुलर एक्सप्रेशन में `../` उपसर्ग को शामिल करने की आवश्यकता नहीं है।

कार्यान्वयन उदाहरण (उत्पादन): [Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`) में स्क्रीनशॉट URL, [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) में स्थानीय पुनर्लेखन, duplistatus से [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) पर आधारित कैप्चर स्क्रिप्ट (ऊपर [स्क्रीनशॉट स्क्रिप्ट अनुबंध](#screenshot-script-contract) देखें)।

कार्यान्वयन उदाहरण (डेमो कॉन्फ़िग): [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`) में दूसरा `docs[]` ब्लॉक; सहायक स्क्रिप्ट [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh)।

<a id="config---docsoutputstyle--doc-system"></a>
### कॉन्फ़िग - `docsOutput.style = "doc-system"`

किसी भी डॉक-सिस्टम साइट के लिए समान प्रति-स्थानिक फ़ोल्डर दृष्टिकोण जो एक साझा स्थिर URL उपसर्ग के माध्यम से स्क्रीनशॉट को संदर्भित करता है। फ्लैट लिंक रीराइटर नहीं चलता है; `postProcessing` मूल मार्कडाउन URL में स्थानीय खंड को फिर से लिखता है।

<details>
<summary>डॉक-सिस्टम लेआउट के लिए regexAdjustments का उदाहरण</summary>

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

अपने जनरेटर के लेआउट को `{locale}/` और अनुवादित फ़ाइल के बीच मिलान करने के लिए `localeSubpath` सेट करें, या जब डिफ़ॉल्ट फिट हों तो `"doc-system"` के बजाय एक प्रीसेट उपनाम (`"docusaurus"`, `"astro-starlight"`) का उपयोग करें। स्रोत मार्कडाउन आमतौर पर URL में स्रोत स्थानीय को एम्बेड करता है:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

हर लक्ष्य स्थानीय के लिए उसी पथ पर मिलान करने वाली PNG फ़ाइलें भेजें (जैसे `static/img/screenshots/de/screenshot.png`)। `screenshots/en-GB/` को हार्डकोडिंग करने के बजाय `screenshots/[^/]+/` को प्राथमिकता दें ताकि नियम `sourceLocale` परिवर्तन से बच सके।

<a id="preset---docsoutputstyle--docusaurus"></a>
### प्रीसेट - `docsOutput.style = "docusaurus"`

डिफ़ॉल्ट `localeSubpath = "docusaurus-plugin-content-docs/current"` के साथ `"doc-system"` के समान। फ़्लैट लिंक रीराइटर नहीं चलता है। `postProcessing` मूल मार्कडाउन URL देखता है। अंग्रेज़ी पृष्ठ आमतौर पर स्रोत लोकेल के साथ एक पूर्ण पथ का उपयोग करते हैं:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Docusaurus प्रीसेट के लिए regexAdjustments का उदाहरण</summary>

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

`docs-site/static/img/screenshots/<locale>/screenshot.png` पर PNG फ़ाइलें शिप करें। स्रोत-लोकेल-अज्ञेय कॉन्फ़िग के लिए, `screenshots/en-GB/` के बजाय `screenshots/[^/]+/` को प्राथमिकता दें।

कार्यान्वयन उदाहरण: [examples/docusaurus-docs/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json) के साथ।

<a id="preset---docsoutputstyle--astro-starlight"></a>
### प्रीसेट - `docsOutput.style = "astro-starlight"`

`localeSubpath: ""` के साथ `"doc-system"` के समान — अनुवादित पृष्ठ सीधे `{outputDir}/{locale}/` के अंतर्गत आते हैं। ऊपर दिए गए सामान्य डॉक-सिस्टम कॉन्फ़िग के समान प्रति-लोकेल फ़ोल्डर दृष्टिकोण। स्रोत मार्कडाउन `/img/screenshots/en-GB/screenshot.png` का उपयोग करता है:

<details>
<summary>Astro Starlight प्रीसेट के लिए regexAdjustments का उदाहरण</summary>

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

`public/img/screenshots/<locale>/screenshot.png` पर PNG शिप करें। `${translatedLocale}` प्लेसहोल्डर आपकी कॉन्फ़िग लोकेल स्ट्रिंग का उपयोग करता है (जैसे `pt-BR`)। `astro-starlight` प्रीसेट डिफ़ॉल्ट रूप से लोकेल **आउटपुट पथों** को लोअरकेस करता है (`pt-br/`), लेकिन `public/img/screenshots/` के अंतर्गत स्थिर एसेट फ़ोल्डर मार्कडाउन URL में लिखी गई लोकेल सेगमेंट से मेल खाना चाहिए — स्क्रीनशॉट निर्देशिकाओं को `${translatedLocale}` के साथ संरेखित रखें, न कि आवश्यक रूप से एस्ट्रो रूट केसिंग के साथ।

कार्यान्वयन उदाहरण: [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) — [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) और [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`)।
