<a id="translated-svg-with-svgstyle--flat"></a>
# `svg.style = "flat"` के साथ अनुवादित SVG

इसका उपयोग तब करें जब कोई वेब ऐप स्थान-विशिष्ट SVG चित्रण या आरेख एम्बेड करता है और रनटाइम पर उन्हें स्थान कोड द्वारा संदर्भित करता है।

<a id="config"></a>
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

`translate-svg` `images/` के अंतर्गत प्रत्येक `.svg` को पढ़ता है और प्रति स्थान एक फ़ाइल लिखता है:

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

स्रोत SVG को आउटपुट निर्देशिका से अलग रखें। `sourcePath: "images"` और `outputDir: "public/assets"` के साथ दोनों निर्देशिकाएँ अलग-अलग हैं। दोनों को कभी भी एक ही निर्देशिका पर सेट न करें।

<a id="implementation-example"></a>
### कार्यान्वयन उदाहरण

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) में `svg` ब्लॉक (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); स्रोत [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg); [public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) के अंतर्गत प्रति-स्थान आउटपुट (उदाहरण के लिए `translation_demo_svg.de.svg`); [page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx) में रनटाइम URL (`/assets/translation_demo_svg.${locale}.svg`)।

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
