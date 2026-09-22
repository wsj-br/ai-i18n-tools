<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**अपनी पसंद के AI मॉडल के साथ अपने ऐप और दस्तावेज़ का अनुवाद करें — कोई लॉक-इन नहीं, कोई पुनर्लेखन नहीं।**

CLI और JavaScript/TypeScript ऐप्स तथा दस्तावेज़ीकरण साइटों के अंतर्राष्ट्रीयकरण के लिए टूलकिट। `t()` स्ट्रिंग्स निकालें, Markdown/MDX पेज, JSON बंडल्स, और SVG लेबल्स का अनुवाद करें — सब कुछ एक ही कॉन्फ़िगरेशन से, OpenAI, Anthropic, Gemini, OpenRouter, Ollama, और किसी भी OpenAI-संगत API के लिए बिल्ट-इन प्रीसेट के साथ। अपने कोडबेस को बदले बिना प्रति प्रोजेक्ट या प्रति लोकेल प्रदाता या मॉडल बदलें।

[VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), और सादे [Markdown](https://commonmark.org/) के साथ काम करता है। आपके मौजूदा [i18next](https://www.i18next.com/) कैटलॉग (नेमस्पेस JSON या `t()` स्रोत स्ट्रिंग्स) को सुरक्षित रखता है, और [Intlayer](https://intlayer.org/) प्रोजेक्ट्स को `migrate-intlayer` के साथ माइग्रेट करता है।

<a id="features"></a>
## विशेषताएँ

| | |
| --- | --- |
| **यूआई स्ट्रिंग्स** | जेएस/टीएस/एस्ट्रो से `t("…")` (और एचटीएमएल में `data-i18n*`) निकालें → प्रति-लोकेल JSON |
| **दस्तावेज़** | प्रमुख दस्तावेज़ फ़्रेमवर्क के लिए मार्कडाउन, एमडीएक्स और `.astro` पृष्ठों का अनुवाद करें |
| **JSON** | नेस्टेड लोकेल बंडलों का अनुवाद करें जब कॉपी `t()` कॉल के बाहर रहती है |
| **SVG** | `translate-svg` के माध्यम से सचित्र SVG लेबलों का अनुवाद करें |
| **स्मार्ट कैश** | साझा SQLite कैश — केवल नए या बदले हुए सेगमेंट मॉडल को हिट करते हैं |
| **एक `sync`** | एक कॉन्फ़िग से सही क्रम में एक्सट्रैक्ट → यूआई → एसवीजी → डॉक्स → JSON चलाता है |

<a id="which-pipeline"></a>
## कौन सी पाइपलाइन?

| आपकी सामग्री | कमांड |
| --- | --- |
| स्रोत `t()` या एचटीएमएल मार्कर का उपयोग करता है | **यूआई स्ट्रिंग्स** — `extract` / `translate-ui` |
| स्थानीयकृत पृष्ठ या डॉक्स साइटें | **दस्तावेज़** — `translate-docs` |
| स्टैंडअलोन नेस्टेड JSON लोकेल फ़ाइलें | **JSON** — `translate-json` |

पूर्ण तुलना के लिए [ai-i18n-tools क्या है?](https://wsj-br.github.io/ai-i18n-tools/guide/what-is-ai-i18n-tools) देखें।

<a id="install"></a>
## इंस्टॉल करें

केवल ईएसएम। Node.js `>=22.16.0` की आवश्यकता है।

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

अपने प्रदाता के लिए एक एपीआई कुंजी सेट करें (डिफ़ॉल्ट `init` ओपनराउटर का उपयोग करता है; ओलामा को किसी की आवश्यकता नहीं है):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

बेयर `ai-i18n-tools` कमांड कॉन्फ़िगर करें (direnv, PATH, `package.json` स्क्रिप्ट्स, या `npx`) — [इंस्टॉलेशन](https://wsj-br.github.io/ai-i18n-tools/guide/installation) देखें।

<a id="quick-start"></a>
## त्वरित शुरुआत

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

दस्तावेज़-उन्मुख स्कैफोल्ड: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, या `ui-json-bundles`।

व्यक्तिगत ट्रांसलेट कमांड्स को चेन करने के बजाय `sync` को प्राथमिकता दें। पूर्ण विवरण: [क्विक स्टार्ट](https://wsj-br.github.io/ai-i18n-tools/guide/quick-start)।

<a id="documentation"></a>
## दस्तावेज़

- [डॉक्यूमेंटेशन साइट](https://wsj-br.github.io/ai-i18n-tools/) — गाइड्स, इंटीग्रेशंस, और रेफरेंस
- [इंस्टॉलेशन](https://wsj-br.github.io/ai-i18n-tools/guide/installation) · [क्विक स्टार्ट](https://wsj-br.github.io/ai-i18n-tools/guide/quick-start) · [प्रोवाइडर्स और मॉडल्स](https://wsj-br.github.io/ai-i18n-tools/guide/providers-and-models)
- [UI स्ट्रिंग्स](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/) · [डॉक्यूमेंट्स](https://wsj-br.github.io/ai-i18n-tools/guide/documents/) · [JSON](https://wsj-br.github.io/ai-i18n-tools/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/guide/svg-translation/)
- [इंटीग्रेशंस](https://wsj-br.github.io/ai-i18n-tools/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [CLI रेफरेंस](https://wsj-br.github.io/ai-i18n-tools/reference/cli-commands/) · [कॉन्फ़िगरेशन](https://wsj-br.github.io/ai-i18n-tools/reference/configuration) · [रनटाइम हेल्पर्स](https://wsj-br.github.io/ai-i18n-tools/guide/runtime-helpers)
- [उदाहरण](https://wsj-br.github.io/ai-i18n-tools/examples) — रन करने योग्य डेमो (`npx degit …`)
- [AI एजेंट कॉन्टेक्स्ट](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — कंज्यूमर रेपो में असिस्टेंट्स के लिए इंटीग्रेशन गाइड

<a id="contributing"></a>
## योगदान

समस्याएँ और पुल अनुरोधों का स्वागत है। इस रिपॉजिटरी के लिए अनुरक्षक वर्कफ़्लो: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) और [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md)।

<a id="license"></a>
## लाइसेंस

MIT — [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) देखें।

कॉपीराइट © 2026 वाल्डेमर स्कुडेलर जूनियर।

<br/>

उत्पाद के नाम और आइकन उनके संबंधित स्वामियों के हैं और केवल पहचान के उद्देश्यों के लिए उपयोग किए जाते हैं। यह सॉफ़्टवेयर उन ब्रांडों से संबद्ध या समर्थित नहीं है।

<small>

> **यूआई और दस्तावेज़ीकरण अनुवादों पर नोट:** अंग्रेज़ी (UK) को छोड़कर सभी इंटरफ़ेस और दस्तावेज़ीकरण भाषाओं का अनुवाद इस पैकेज (ai-i18n-tools) का उपयोग करके एआई द्वारा किया गया है; शब्दावली अस्पष्ट हो सकती है या इसमें त्रुटियाँ हो सकती हैं।

</small>
