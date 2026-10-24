---
layout: home
title: एआई-आई18एन-टूल्स
description: >-
  JavaScript/TypeScript ऍप्लिकेशन्स, Python ऍप्लिकेशन्स और डॉक्यूमेंटेशन साइट्स
  को आपकी पसंद के LLM प्रोवाइडर के साथ इंटरनेशनलाइज़ करने के लिए CLI और टूलकिट।
hero:
  name: एआई-आई18एन-टूल्स
  text: किसी भी एलएलएम के साथ ऐप्स और दस्तावेज़ों का अनुवाद करें
  tagline: >-
    JavaScript, TypeScript और Python से t() स्ट्रिंग्स निकालें। Markdown, MDX,
    HTML पेजों, JSON बंडल्स और SVG लेबल्स का अनुवाद करें — सब कुछ एक ही
    कॉन्फ़िगरेशन से, OpenAI, Anthropic, Gemini, OpenRouter, Ollama, या किसी भी
    OpenAI-संगत API के साथ। अपने कोडबेस को फिर से लिखे बिना प्रति प्रोजेक्ट या
    प्रति लोकेल मॉडल बदलें।
  image:
    src: /ai-i18n-tools_logo.svg
    alt: एआई-आई18एन-टूल्स लोगो
  actions:
    - theme: brand
      text: शुरू करें
      link: /hi/guide/quick-start
    - theme: alt
      text: गिटहब पर देखें
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: एनपीएम पैकेज
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: यूआई स्ट्रिंग्स
    details: >-
      JavaScript, TypeScript, Astro और Python से t() और _() निकालें, या एक HTML
      फ़ाइल में data-i18n मार्कर्स का उपयोग करें। फ्लैट प्रति-लोकेल JSON, या GNU
      gettext कैटलॉग।
  - icon: 📄
    title: दस्तावेज़
    details: >-
      VitePress, Starlight, Docusaurus, Nextra, Fumadocs, और साधारण स्टैटिक
      साइट्स के लिए Markdown, MDX, Astro, और HTML पेजों का अनुवाद करें।
  - icon: 📦
    title: जेएसओएन बंडल
    details: >-
      नेस्टेड लोकेल जेएसओएन जब यूआई कॉपी स्रोत टी() कॉल के बाहर रहती है — थीम
      लेबल, कैटलॉग और ऐप ओवरराइड।
  - icon: 🔄
    title: स्मार्ट कैशिंग
    details: >-
      हर पाइपलाइन में साझा एसक्यूलाइट कैश। केवल नए या बदले हुए सेगमेंट को रीरन
      पर मॉडल में भेजा जाता है।
  - icon: 🔌
    title: प्रदाता-अज्ञेयवादी
    details: >-
      प्रमुख एलएलएम एपीआई के साथ-साथ कस्टम ओपनएआई-संगत एंडपॉइंट्स के लिए
      अंतर्निहित प्रीसेट। -पी के साथ सक्रिय प्रदाता को ओवरराइड करें।
  - icon: ⚡
    title: एक सिंक कमांड
    details: >-
      एक ही कॉन्फ़िग से सही क्रम में एक्सट्रैक्ट, ट्रांसलेट-यूआई,
      ट्रांसलेट-एसवीजी, ट्रांसलेट-डॉक्स और ट्रांसलेट-जेएसओएन चलाएँ।
  - icon: 🐍
    title: Python, Node.js नहीं
    details: >-
      प्रत्येक GitHub Release पर एक स्टैंडअलोन एक्ज़ीक्यूटेबल Python ऍप्स के लिए
      CLI चलाता है। Streamlit, FastAPI, Flask, Django और gettext शामिल हैं।
  - icon: 📊
    title: रैंक की गई मॉडल सूची
    details: >-
      suggest-models सक्रिय प्रोवाइडर के चैट मॉडल्स को रैंक करता है और
      translationModels लिख सकता है। यही रैंकिंग डैशबोर्ड के Models टैब पर भी
      उपलब्ध है।
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## त्वरित इंस्टॉल

प्रकाशित पैकेज **केवल ईएसएम** है। Node.js `>=22.16.0` आवश्यक है।

```bash
pnpm add ai-i18n-tools
# Set the API key for the provider you pass to init — see the preset table
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models
ai-i18n-tools sync
```

`suggest-models` सक्रिय प्रोवाइडर के मॉडल्स को रैंक करता है। स्कैफोल्ड की गई `translationModels` सूची को बदलने के लिए `--apply` जोड़ें। [Quick start](/hi/guide/quick-start) और [Models](/hi/guide/translation-dashboard/models) टैब देखें।

<a id="python-no-nodejs"></a>
### Python, कोई Node.js नहीं

[GitHub रिलीज़](https://github.com/wsj-br/ai-i18n-tools/releases) से मिलान करने वाली फ़ाइल डाउनलोड करें: `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64`, या `ai-i18n-tools-win-x64.exe`। `SHA256SUMS.txt` की जाँच करें, यूनिक्स पर `chmod +x` चलाएँ, और फ़ाइल को `PATH` पर रखें। बाइनरी अहस्ताक्षरित हैं। चरण: [स्टैंडअलोन निष्पादन योग्य](/hi/guide/installation#standalone-executables)। फिर `ai-i18n-tools init -t ui-python -P cheaperinference`। मार्गदर्शन: [एक पायथन ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python)।

[बेयर सीएलआई कमांड कॉन्फ़िगर करने](/hi/guide/installation#using-the-cli) (जिसमें [क्लोन-मोनोरेपो डेवलपमेंट](/hi/guide/installation#cloned-monorepo) शामिल है) के लिए [इंस्टॉलेशन](/hi/guide/installation) और स्केफ़ोल्ड टेम्प्लेट के लिए [क्विक स्टार्ट](/hi/guide/quick-start) देखें।

<a id="which-pipeline-should-i-use"></a>
## मुझे किस पाइपलाइन का उपयोग करना चाहिए?

| आपकी सामग्री | कमांड |
| --- | --- |
| सोर्स कोड `t()` या `_()` (JavaScript, TypeScript, या Python), gettext, या मार्कर्स वाली एक HTML फ़ाइल का उपयोग करता है | **UI स्ट्रिंग्स** — `extract` / `translate-ui` |
| लोकेलाइज़ किए गए पेज, डॉक्स साइटें, या प्रति लोकेल एक HTML फ़ाइल | **दस्तावेज़** — `translate-docs` |
| स्टैंडअलोन नेस्टेड JSON लोकेल फ़ाइलें | **JSON** — `translate-json` |

एसवीजी चित्र एक अलग `translate-svg` पथ का उपयोग करते हैं — न कि `docs[].contentPaths`। पूर्ण तुलना के लिए [ai-i18n-tools क्या है?](/hi/guide/what-is-ai-i18n-tools) देखें।

<a id="explore-the-documentation"></a>
## दस्तावेज़ों का अन्वेषण करें

- [**गाइड**](/hi/guide/what-is-ai-i18n-tools) — अनुवाद मोड, इंस्टॉलेशन, क्विक स्टार्ट, और फ्रेमवर्क इंटीग्रेशन
- [**इंटीग्रेशन**](/hi/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro, और Python
- [**प्रोवाइडर्स और मॉडल्स**](/hi/guide/providers-and-models) — प्रीसेट्स, फॉलबैक चेन्स, रैंक किए गए सुझाव (`suggest-models`), और `-P` ओवरराइड्स
- [**CLI संदर्भ**](/hi/reference/cli-commands/) — प्रत्येक कमांड, फ्लैग, और वर्कफ़्लो
- [**कॉन्फ़िगरेशन**](/hi/reference/configuration) — पूर्ण `ai-i18n-tools.config.json` स्कीमा
- [**उदाहरण**](/hi/examples) — सत्रह चलाने योग्य डेमो प्रोजेक्ट्स (`npx degit`, या Python उदाहरणों की ज़िप)
- [**आर्किटेक्चर**](/hi/reference/architecture) — इंटरनल्स, प्रोग्रामेटिक API, और एक्सटेंशन पॉइंट्स

अपने प्रोजेक्ट में पैकेज को एकीकृत कर रहे हैं? [एआई एजेंट कॉन्टेक्स्ट](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) से शुरू करें। [रिपॉजिटरी README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) एक छोटा GitHub/npm लैंडिंग पेज है जो विवरण के लिए यहां लिंक करता है।

<br/>
<br/>

::: tip अस्वीकरण
उत्पाद नाम और आइकन उनके संबंधित स्वामियों की संपत्ति हैं और केवल पहचान के उद्देश्यों के लिए उपयोग किए जाते हैं। यह सॉफ़्टवेयर उन ब्रांडों से संबद्ध नहीं है और न ही उनके द्वारा अनुमोदित है।

अंग्रेज़ी (यूके) को छोड़कर सभी इंटरफ़ेस और दस्तावेज़ीकरण भाषाओं का अनुवाद इस पैकेज (ai-i18n-tools) का उपयोग करके एआई द्वारा किया गया है; शब्दावली अस्पष्ट हो सकती है या इसमें त्रुटियाँ हो सकती हैं।
:::

<br/>
