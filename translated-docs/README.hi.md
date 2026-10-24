<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**अपनी पसंद के AI मॉडल के साथ अपने ऐप और दस्तावेज़ का अनुवाद करें — कोई लॉक-इन नहीं, कोई पुनर्लेखन नहीं।**

JavaScript/TypeScript ऐप्स, Python ऐप्स और दस्तावेज़ीकरण साइटों को अंतर्राष्ट्रीयकृत (internationalize) करने के लिए CLI और टूलकिट। `t()` स्ट्रिंग्स निकालें, Markdown, MDX, और HTML पेजों, JSON बंडलों, और SVG लेबल का अनुवाद करें — सब कुछ एक कॉन्फ़िगरेशन से, जिसमें OpenAI, Anthropic, Gemini, OpenRouter, Ollama, और किसी भी OpenAI-संगत API के लिए इन-बिल्ट प्रीसेट हैं। अपने कोडबेस को बदले बिना प्रति प्रोजेक्ट या प्रति लोकेल प्रदाता या मॉडल बदलें।

[VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), प्लेन Markdown, और प्लेन HTML के साथ काम करता है। Python ऐप्स `t()` / `_()` या GNU gettext (Streamlit, FastAPI, Flask, Django, और डेस्कटॉप टूलकिट) का उपयोग करते हैं। यह आपके मौजूदा [i18next](https://www.i18next.com/) कैटलॉग (नेमस्पेस JSON या `t()` स्रोत स्ट्रिंग्स) को बनाए रखता है, और `migrate-intlayer` के साथ [Intlayer](https://intlayer.org/) प्रोजेक्ट्स को माइग्रेट करता है।

<a id="features"></a>
## विशेषताएँ

| | |
| --- | --- |
| **UI स्ट्रिंग्स** | JS/TS/Astro और Python से `t("…")` / `_()` निकालें, या एक HTML फ़ाइल में `data-i18n*` निकालें → फ्लैट प्रति-लोकेल JSON या GNU gettext |
| **दस्तावेज़** | Markdown, MDX, `.astro`, और HTML पेजों का अनुवाद करें (प्रति लोकेल एक फ़ाइल) |
| **JSON** | नेस्टेड लोकेल बंडलों का अनुवाद करें जब कॉपी `t()` कॉल के बाहर रहती है |
| **SVG** | `translate-svg` के माध्यम से सचित्र SVG लेबलों का अनुवाद करें |
| **स्मार्ट कैश** | साझा SQLite कैश — केवल नए या बदले हुए सेगमेंट मॉडल को हिट करते हैं |
| **एक `sync`** | एक कॉन्फ़िग से सही क्रम में एक्सट्रैक्ट → यूआई → एसवीजी → डॉक्स → JSON चलाता है |
| **Python** | प्रत्येक GitHub रिलीज़ पर स्टैंडअलोन निष्पादन योग्य (executable) — CLI बिना Node.js इंस्टॉल किए चलता है |
| **रैंक किए गए मॉडल** | `suggest-models` सक्रिय प्रदाता के चैट मॉडल को रैंक करता है और `translationModels` लिख सकता है |

<a id="which-pipeline"></a>
## कौन सी पाइपलाइन?

| आपकी सामग्री | कमांड |
| --- | --- |
| स्रोत `t()` या `_()` (JavaScript, TypeScript, या Python), gettext, या `data-i18n*` मार्कर वाली एक HTML फ़ाइल का उपयोग करता है | **UI स्ट्रिंग्स** — `extract` / `translate-ui` |
| लोकेलाइज़ किए गए पेज, डॉक्स साइटें, या प्रति लोकेल एक HTML फ़ाइल | **दस्तावेज़** — `translate-docs` |
| स्टैंडअलोन नेस्टेड JSON लोकेल फ़ाइलें | **JSON** — `translate-json` |
| SVG में लेबल वाले आरेख या चित्रण | **SVG** — `translate-svg` |

पूर्ण तुलना के लिए [ai-i18n-tools क्या है?](https://wsj-br.github.io/ai-i18n-tools/hi/guide/what-is-ai-i18n-tools) देखें।

<a id="install"></a>
## इंस्टॉल करें

केवल ईएसएम। Node.js `>=22.16.0` की आवश्यकता है।

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

आप जिस प्रदाता को `init` को पास करते हैं, उसके लिए एक API कुंजी सेट करें (Ollama को किसी की आवश्यकता नहीं है):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

बेयर `ai-i18n-tools` कमांड कॉन्फ़िगर करें (direnv, PATH, `package.json` स्क्रिप्ट्स, या `npx`) — [इंस्टॉलेशन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/installation) देखें।

<a id="python-no-nodejs"></a>
### Python, कोई Node.js नहीं

[GitHub रिलीज़](https://github.com/wsj-br/ai-i18n-tools/releases) से मिलान वाली एसेट डाउनलोड करें: `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64`, या `ai-i18n-tools-win-x64.exe`। `SHA256SUMS.txt` की जाँच करें, Unix पर `chmod +x` चलाएँ, और फ़ाइल को `PATH` पर रखें। बाइनरी नोटराइज़्ड या Authenticode-हस्ताक्षरित नहीं हैं। चार Python उदाहरण रिपॉजिटरी में और रिलीज़ पर `ai-i18n-tools-python-examples.zip` में हैं। वे npm टारबॉल या निष्पादन योग्य फ़ाइल के अंदर नहीं हैं। पूर्ण चरण: [स्टैंडअलोन निष्पादन योग्य](https://wsj-br.github.io/ai-i18n-tools/hi/guide/installation#standalone-executables)।

<a id="quick-start"></a>
## त्वरित शुरुआत

```bash
ai-i18n-tools init -P openrouter   # scaffold config (UI strings template)
ai-i18n-tools suggest-models         # optional ranked shortlist
ai-i18n-tools suggest-models --apply # write that list to translationModels
ai-i18n-tools sync                   # extract + translate per features
```

`init` से सूची एक शुरुआती बिंदु है। `suggest-models` सक्रिय प्रदाता के चैट मॉडल को रैंक करता है। `--apply`, `translationModels` को प्रतिस्थापित करता है। वही रैंकिंग [Models](https://wsj-br.github.io/ai-i18n-tools/hi/guide/translation-dashboard/models) टैब पर है। कमांड संदर्भ: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/hi/reference/cli-commands/models#suggest-models)।

अन्य स्कैफोल्ड्स: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, `docs-plain-html`, `ui-json-bundles`, `ui-python`, `ui-python-gettext`, `ui-python-django`, या `ui-python-flask`।

व्यक्तिगत अनुवाद कमांड को चेन करने के बजाय `sync` को प्राथमिकता दें। पूर्ण वॉकथ्रू: [क्विक स्टार्ट](https://wsj-br.github.io/ai-i18n-tools/hi/guide/quick-start)। Python: [Python ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-python)।

<a id="documentation"></a>
## दस्तावेज़

- [दस्तावेज़ीकरण साइट](https://wsj-br.github.io/ai-i18n-tools/hi/) — गाइड, एकीकरण, और संदर्भ
- [इंस्टॉलेशन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/installation) · [क्विक स्टार्ट](https://wsj-br.github.io/ai-i18n-tools/hi/guide/quick-start) · [प्रदाता और मॉडल](https://wsj-br.github.io/ai-i18n-tools/hi/guide/providers-and-models)
- [UI स्ट्रिंग्स](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/) · [प्लेन HTML](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/python) · [दस्तावेज़](https://wsj-br.github.io/ai-i18n-tools/hi/guide/documents/) · [HTML पेज](https://wsj-br.github.io/ai-i18n-tools/hi/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/hi/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/hi/guide/svg-translation/)
- [एकीकरण](https://wsj-br.github.io/ai-i18n-tools/hi/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro, और [Python](https://wsj-br.github.io/ai-i18n-tools/hi/guide/integrations/python)
- [Python ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-python)
- [CLI संदर्भ](https://wsj-br.github.io/ai-i18n-tools/hi/reference/cli-commands/) · [कॉन्फ़िगरेशन](https://wsj-br.github.io/ai-i18n-tools/hi/reference/configuration) · [रनटाइम हेल्पर्स](https://wsj-br.github.io/ai-i18n-tools/hi/guide/runtime-helpers)
- [उदाहरण](https://wsj-br.github.io/ai-i18n-tools/hi/examples) — चलाने योग्य डेमो (`npx degit …`)
- [AI एजेंट संदर्भ](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — उपभोक्ता रिपॉजिटरी में सहायकों के लिए एकीकरण गाइड

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
