---
layout: home
title: एआई-आई18एन-टूल्स
description: >-
  एलएलएम का उपयोग करके जावास्क्रिप्ट/टाइपस्क्रिप्ट एप्लिकेशन और दस्तावेज़ साइटों
  को अंतर्राष्ट्रीय बनाने के लिए सीएलआई और टूलकिट।
hero:
  name: एआई-आई18एन-टूल्स
  text: किसी भी एलएलएम के साथ ऐप्स और दस्तावेज़ों का अनुवाद करें
  tagline: >-
    एक कॉन्फ़िग फ़ाइल, तीन अनुवाद मोड, और आपके द्वारा चुना गया प्रदाता — ओपनएआई,
    एंथ्रोपिक, जेमिनी, ओपनराउटर, ओलामा, या कोई भी ओपनएआई-संगत एपीआई। अपने कोडबेस
    को फिर से लिखे बिना प्रति प्रोजेक्ट या प्रति लोकेल मॉडल स्विच करें।
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
      जेएस, टीएस और एस्ट्रो से टी() कॉल निकालें। आई18नेक्स्ट या स्टैटिक एसएसजी
      लुकअप के लिए फ्लैट प्रति-लोकेल जेएसओएन जेनरेट करें।
  - icon: 📄
    title: दस्तावेज़
    details: >-
      वाइटप्रेस, स्टारलाइट, डॉक्यूसॉरस, नेक्सट्रा, फुमाडॉक्स और सादे स्टैटिक
      साइटों के लिए मार्कडाउन, एमडीएक्स और एस्ट्रो पेजों का अनुवाद करें।
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
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## त्वरित इंस्टॉल

प्रकाशित पैकेज **केवल ईएसएम** है। Node.js `>=22.16.0` आवश्यक है।

```bash
pnpm add ai-i18n-tools
# Set API key for your active provider — see preset table (default init: openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
ai-i18n-tools init [-P <provider>]
ai-i18n-tools sync
```

[बेयर सीएलआई कमांड कॉन्फ़िगर करने](/hi/guide/installation#using-the-cli) (जिसमें [क्लोन-मोनोरेपो डेवलपमेंट](/hi/guide/installation#cloned-monorepo) शामिल है) के लिए [इंस्टॉलेशन](/hi/guide/installation) और स्केफ़ोल्ड टेम्प्लेट के लिए [क्विक स्टार्ट](/hi/guide/quick-start) देखें।

<a id="which-pipeline-should-i-use"></a>
## मुझे किस पाइपलाइन का उपयोग करना चाहिए?

| आपकी सामग्री | कमांड |
| --- | --- |
| स्रोत कोड `t()` का उपयोग करता है | **यूआई स्ट्रिंग्स** — `extract` / `translate-ui` |
| स्थानीयकृत पृष्ठ या डॉक्स साइटें | **दस्तावेज़** — `translate-docs` |
| स्टैंडअलोन नेस्टेड JSON लोकेल फ़ाइलें | **JSON** — `translate-json` |

एसवीजी चित्र एक अलग `translate-svg` पथ का उपयोग करते हैं — न कि `docs[].contentPaths`। पूर्ण तुलना के लिए [ai-i18n-tools क्या है?](/hi/guide/what-is-ai-i18n-tools) देखें।

<a id="explore-the-documentation"></a>
## दस्तावेज़ों का अन्वेषण करें

- [**गाइड**](/hi/guide/what-is-ai-i18n-tools) — अनुवाद मोड, इंस्टॉलेशन, त्वरित शुरुआत और फ्रेमवर्क एकीकरण
- [**एकीकरण**](/hi/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, और Astro
- [**प्रदाता और मॉडल**](/hi/guide/providers-and-models) — प्रीसेट, फॉलबैक चेन, और `-P` ओवरराइड
- [**सीएलआई संदर्भ**](/hi/reference/cli-commands/) — हर कमांड, फ्लैग और वर्कफ़्लो
- [**कॉन्फ़िगरेशन**](/hi/reference/configuration) — पूर्ण `ai-i18n-tools.config.json` स्कीमा
- [**उदाहरण**](/hi/examples) — `npx degit` के साथ नौ चलाने योग्य डेमो प्रोजेक्ट
- [**आर्किटेक्चर**](/hi/reference/architecture) — आंतरिक, प्रोग्रामेटिक एपीआई और एक्सटेंशन पॉइंट

अपने प्रोजेक्ट में पैकेज को एकीकृत कर रहे हैं? [एआई एजेंट कॉन्टेक्स्ट](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) से शुरू करें। [रिपॉजिटरी README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) एक छोटा GitHub/npm लैंडिंग पेज है जो विवरण के लिए यहां लिंक करता है।
