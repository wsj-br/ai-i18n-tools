<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

**किसी भी LLM प्रोवाइडर पर अपने चुने हुए मॉडलों के साथ अपने ऐप, वेबसाइट और डॉक्स का अनुवाद करें। एक कॉन्फ़िग, कैश्ड रीरन्स।**

CLI और टूलकिट जो JavaScript/TypeScript ऐप्स, Python ऐप्स और दस्तावेज़ साइटों में भाषाएँ जोड़ता है। जिस भाषा से आप शुरू करते हैं वह `sourceLocale` है, और यह कोई भी भाषा हो सकती है। यह टेक्स्ट को ढूँढता है, उसका अनुवाद करता है, और उन फ़ाइलों को लिखता है जिन्हें आपका प्रोजेक्ट लोड करता है। बिल्ट-इन प्रीसेट में OpenAI, Anthropic, Gemini, OpenRouter, Ollama और कोई भी OpenAI-संगत API शामिल हैं। प्रति प्रोजेक्ट या प्रति लोकले प्रदाता या मॉडल बदलें।

[VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), [प्लेन मार्कडाउन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-readme) (एक रिपॉजिटरी README और अन्य `.md` फ़ाइलें), और प्लेन HTML के साथ काम करता है। Python ऐप्स `t()` / `_()` या GNU gettext (Streamlit, FastAPI, Flask, Django, और डेस्कटॉप टूलकिट) का उपयोग करते हैं। आपके मौजूदा [i18next](https://www.i18next.com/) कैटलॉग (नेमस्पेस JSON या `t()` स्रोत स्ट्रिंग) को बनाए रखता है। [Intlayer](https://intlayer.org/) के साथ दो तरीकों से काम करता है: Intlayer को रखें और उसके शब्दकोशों को `translate-intlayer` से भरें, या `migrate-intlayer` के साथ स्रोत-स्ट्रिंग `t()` कॉल पर जाएँ। Intlayer टाइप किए गए सामग्री शब्दकोशों और अनुवाद प्रबंधन प्रणालियों के लिए एक अच्छा विकल्प बना रहता है।

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

<a id="where-do-i-start"></a>
## मैं कहाँ से शुरू करूँ?

| आपके पास है | यहाँ से शुरू करें |
| --- | --- |
| एक JS/TS ऐप (React, Next.js, Node, CLI) जिसमें स्रोत में प्लेन टेक्स्ट है | [एक JS/TS ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-js) |
| एक Python ऐप (Streamlit, FastAPI, Flask, Django, gettext) | [एक Python ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-python) |
| एक वेबसाइट या डॉक्स साइट (VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, प्लेन HTML) | [एक वेबसाइट या डॉक्स साइट में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-website) |
| एक रिपॉजिटरी README और अन्य मार्कडाउन फ़ाइलें (एक ऐप के साथ या उसके बिना) | [अपने README और मार्कडाउन डॉक्स में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-readme) |
| कोड जो पहले से ही `t()` या `_()` को कॉल करता है | [UI स्ट्रिंग](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/) |
| स्टैंडअलोन नेस्टेड JSON लोकले फ़ाइलें | [JSON](https://wsj-br.github.io/ai-i18n-tools/hi/guide/json) |
| टेक्स्ट लेबल वाले SVG डायग्राम | [SVG अनुवाद](https://wsj-br.github.io/ai-i18n-tools/hi/guide/svg-translation/) |
| Intlayer शब्दकोश (Intlayer को रखें, या स्रोत-स्ट्रिंग कॉल पर जाएँ) | [Intlayer का यथास्थान अनुवाद करना](https://wsj-br.github.io/ai-i18n-tools/hi/guide/translating-intlayer) · [Intlayer से स्रोत-स्ट्रिंग कॉल पर माइग्रेट करना](https://wsj-br.github.io/ai-i18n-tools/hi/guide/migrating-from-intlayer) |

पाइपलाइनें एक साथ कैसे फिट होती हैं, इसके लिए [ai-i18n-tools क्या है?](https://wsj-br.github.io/ai-i18n-tools/hi/guide/what-is-ai-i18n-tools) देखें।

<a id="install"></a>
## इंस्टॉल करें

केवल ईएसएम। Node.js `>=22.16.0` की आवश्यकता है।

```bash
pnpm add -D ai-i18n-tools
# or: npm install --save-dev ai-i18n-tools
```

आप जिस प्रदाता को `init` को पास करते हैं, उसके लिए एक API कुंजी सेट करें (Ollama को किसी की आवश्यकता नहीं है):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

बेयर `ai-i18n-tools` कमांड कॉन्फ़िगर करें (direnv, PATH, `package.json` स्क्रिप्ट्स, या `npx`) — [इंस्टॉलेशन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/installation) देखें।

<a id="python-no-nodejs"></a>
### Python, कोई Node.js नहीं

Linux और macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

इंस्टॉलर इस मशीन के लिए निष्पादन योग्य चुनता है, `SHA256SUMS.txt` की जाँच करता है, कमांड को `ai-i18n-tools` के रूप में स्थापित करता है, और इसे `PATH` में जोड़ता है। बाइनरीज़ नोटराइज़्ड या Authenticode-हस्ताक्षरित नहीं हैं। मैन्युअल डाउनलोड चरण: [स्टैंडअलोन निष्पादन योग्य](https://wsj-br.github.io/ai-i18n-tools/hi/guide/installation#standalone-executables)।

चार Python उदाहरण रिपॉजिटरी में और रिलीज़ पर `ai-i18n-tools-python-examples.zip` में हैं। वे npm tarball या निष्पादन योग्य के अंदर नहीं हैं।

<a id="quick-start"></a>
## त्वरित शुरुआत

आपके पास जो है उसके लिए कॉन्फ़िग को स्केफ़ोल्ड करें, फिर अपने पथ के लिए गाइड का पालन करें:

| आपके पास है | स्केफ़ोल्ड करें | फिर पालन करें |
| --- | --- | --- |
| एक JS/TS ऐप | `ai-i18n-tools init -P openrouter` | [एक JS/TS ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-js) |
| एक Python ऐप | `ai-i18n-tools init -t ui-python -P openrouter` | [एक Python ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-python) |
| एक वेबसाइट या डॉक्स साइट | `ai-i18n-tools init -t ui-vitepress -P openrouter` (अपने फ्रेमवर्क के लिए टेम्पलेट बदलें) | [किसी वेबसाइट या डॉक्स साइट में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-website) |
| एक README, ऐप के साथ या उसके बिना | `ai-i18n-tools init -P openrouter` (JS/TS ऐप + README) या `init -t docs-markdown` | [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-readme) |

जब प्रोजेक्ट तैयार हो जाए, तो `ai-i18n-tools sync` चलाएँ, फिर यह देखने के लिए `ai-i18n-tools status` चलाएँ कि क्या अनुवाद किया गया था।

एक JS/TS ऐप को पहले अपने टेक्स्ट को `t()` में रैप करना होगा। सादे टेक्स्ट पर चलाएँ, `sync` बिना किसी त्रुटि के समाप्त हो जाता है और कुछ भी उपयोगी नहीं लिखता है। `sync` से पहले आपके साइट फ्रेमवर्क में भी अपनी i18n रूटिंग सक्षम होनी चाहिए।

वेबसाइटों के लिए टेम्पलेट: `ui-starlight`, `ui-docusaurus`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, और `ui-plain-html` या `docs-plain-html`। केवल README और मार्कडाउन: `docs-markdown`। README ब्लॉक को शामिल करने के लिए किसी अन्य टेम्पलेट में `--with-readme` जोड़ें। अन्य पायथन टेम्पलेट: `ui-python-gettext`, `ui-python-flask`, `ui-python-django`। नेस्टेड i18next JSON: `ui-json-bundles`। पूरी सूची: [CLI सेटअप संदर्भ](https://wsj-br.github.io/ai-i18n-tools/hi/reference/cli-commands/setup)।

`suggest-models` सक्रिय प्रोवाइडर के चैट मॉडल को प्रकाशित बेंचमार्क से रैंक करता है, और `suggest-models --apply`, `translationModels` की जगह लेता है। यही रैंकिंग [मॉडल](https://wsj-br.github.io/ai-i18n-tools/hi/guide/translation-dashboard/models) टैब पर है। गाइड: [AI मॉडल](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ai-models)। कमांड संदर्भ: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/hi/reference/cli-commands/models#suggest-models)।

व्यक्तिगत अनुवाद कमांडों को एक साथ जोड़ने के बजाय `sync` को प्राथमिकता दें। पूर्ण विवरण: [त्वरित शुरुआत](https://wsj-br.github.io/ai-i18n-tools/hi/guide/quick-start)। एक प्रोजेक्ट में एक से अधिक प्रकार की सामग्री: [पाइपलाइनों का संयोजन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/combining-pipelines)।

<a id="documentation"></a>
## दस्तावेज़

- [दस्तावेज़ीकरण साइट](https://wsj-br.github.io/ai-i18n-tools/hi/) — गाइड, इंटीग्रेशन और संदर्भ
- [इंस्टॉलेशन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/installation) · [क्विक स्टार्ट](https://wsj-br.github.io/ai-i18n-tools/hi/guide/quick-start) · [LLM प्रोवाइडर](https://wsj-br.github.io/ai-i18n-tools/hi/guide/providers-and-models) · [AI मॉडल](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ai-models)
- [UI स्ट्रिंग](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/) · [प्लेन HTML](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/python) · [दस्तावेज़](https://wsj-br.github.io/ai-i18n-tools/hi/guide/documents/) · [HTML पेज](https://wsj-br.github.io/ai-i18n-tools/hi/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/hi/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/hi/guide/svg-translation/)
- [Intlayer](https://intlayer.org/) — [डिक्शनरी को उसी जगह पर अनुवाद करें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/translating-intlayer) · [सोर्स-स्ट्रिंग कॉल पर ले जाएँ](https://wsj-br.github.io/ai-i18n-tools/hi/guide/migrating-from-intlayer)
- [एकीकरण](https://wsj-br.github.io/ai-i18n-tools/hi/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro, और [पायथन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/integrations/python)
- [अपने प्रोजेक्ट में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-your-project) — [JS/TS ऐप](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-js) · [पायथन ऐप](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-python) · [वेबसाइट या डॉक्स साइट](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-website) · [README और मार्कडाउन डॉक्स](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-readme) · [पाइपलाइनों का संयोजन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/combining-pipelines)
- [CLI संदर्भ](https://wsj-br.github.io/ai-i18n-tools/hi/reference/cli-commands/) · [कॉन्फ़िगरेशन](https://wsj-br.github.io/ai-i18n-tools/hi/reference/configuration) · [रनटाइम हेल्पर](https://wsj-br.github.io/ai-i18n-tools/hi/guide/runtime-helpers)
- [उदाहरण](https://wsj-br.github.io/ai-i18n-tools/hi/examples) — चलाने योग्य डेमो (`npx degit …`)
- [AI एजेंट संदर्भ](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — उपभोक्ता रेपो में सहायकों के लिए एकीकरण गाइड

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
