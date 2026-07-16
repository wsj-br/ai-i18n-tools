<a id="colocated-translated-svg-doc-system"></a>
# सह-स्थित अनुवादित SVG (डॉक-सिस्टम)

डॉक-सिस्टम साइटों के लिए उपयोग करें जहाँ अनुवादित SVG चित्र प्रत्येक स्थानीयकरण की सामग्री निर्देशिका में अनुवादित दस्तावेज़ों के साथ दिखाई देने चाहिए — वही स्थान जहाँ [सह-स्थित स्क्रीनशॉट](/hi/guide/images-and-screenshots/colocated-screenshots) होते हैं। Docusaurus प्रीसेट प्राथमिक उदाहरण है।

<a id="config"></a>
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

`translate-svg` प्रत्येक स्थानीयकरण के लिए एक SVG को उसी `current/assets/` निर्देशिका में लिखता है जिसका उपयोग सह-स्थित स्क्रीनशॉट PNG के लिए करते हैं:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### स्रोत मार्कडाउन

सभी स्थानीयकरणों में सभी दस्तावेज़ एक ही सापेक्ष पथ का उपयोग करते हैं:

```markdown
![Diagram](../assets/diagram.svg)
```

अंग्रेजी स्थानीयकरण के लिए सिम्लिंक `docs/assets → ../static/assets` इसे हल करता है। अनुवादित स्थानीयकरणों के लिए यह सीधे `current/assets/` पर हल होता है।

किसी `regexAdjustments` नियम की आवश्यकता नहीं है क्योंकि अंग्रेजी स्रोत दस्तावेज़ और अनुवादित आउटपुट दस्तावेज़ समान पथों का उपयोग करते हैं।

<a id="svg-source-location"></a>
### SVG स्रोत स्थान

अनुशंसित: स्रोत SVGs को `documentation/static/assets/` में en-GB PNG के साथ स्टोर करें। यह सभी दस्तावेज़ संपत्तियों को एक ही स्थान पर रखता है, और वही `docs/assets` सिम्लिंक दोनों को कवर करता है। `svg.sourcePath` प्रविष्टियाँ तब `documentation/static/assets/name.svg` की ओर इंगित करती हैं।

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` प्लेसहोल्डर

| प्लेसहोल्डर              | मान                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir` का पूर्ण हल किया गया पथ              |
| `{locale}`               | लक्ष्य स्थानीयकरण कोड                                     |
| `{LOCALE}`               | स्थानीयकरण कोड अपरकेस किया गया                                 |
| `{relPath}`              | `sourcePath` रूट से स्रोत SVG तक का सापेक्ष पथ |
| `{stem}`                 | एक्सटेंशन के बिना फ़ाइल नाम                             |
| `{basename}`             | एक्सटेंशन के साथ फ़ाइल नाम                                |
| `{extension}`            | डॉट सहित एक्सटेंशन                                |
| `{relativeToSourceRoot}` | निकटतम `sourcePath` रूट से सापेक्ष पथ       |

[svg कॉन्फ़िगरेशन तालिका](/hi/reference/configuration#svg) में पूर्ण संदर्भ।

<a id="implementation-example"></a>
### कार्यान्वयन उदाहरण

[duplistatus](https://github.com/wsj-br/duplistatus) — [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json) में `pathTemplate` के साथ नेस्टेड `svg` ब्लॉक; `documentation/static/assets/` में स्रोत SVGs (उदाहरण के लिए [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/assets/duplistatus_toolbar.svg)); `translate-svg` सह-स्थित PNG के बगल में `documentation/i18n/<locale>/…/current/assets/` में प्रति-स्थानीयकरण फ़ाइलें लिखता है; दस्तावेज़ उन्हें `../assets/` पथों के माध्यम से एम्बेड करते हैं (उदाहरण के लिए [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md)) बिना किसी `regexAdjustments` ब्रिज की आवश्यकता के।

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
