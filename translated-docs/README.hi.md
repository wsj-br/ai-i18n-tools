<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**अपनी पसंद के एआई मॉडल के साथ अपने ऐप और दस्तावेज़ों का अनुवाद करें — कोई लॉक-इन नहीं, कोई पुनर्लेखन नहीं।**

जावास्क्रिप्ट/टाइपस्क्रिप्ट ऐप्स और दस्तावेज़ साइटों (वाइटप्रेस, स्टारलाइट, डॉक्यूसॉरस, नेक्सट्रा, फ़्यूमाडॉक्स, एस्ट्रो, सादा मार्कडाउन/एमडीएक्स) के अंतर्राष्ट्रीयकरण के लिए सीएलआई और टूलकिट। ओपनएआई, एंथ्रोपिक, जेमिनी, ओपनराउटर, ओलामा, और बहुत कुछ के लिए अंतर्निहित प्रीसेट का उपयोग करें — या कोई भी ओपनएआई-संगत एपीआई। अपने कोडबेस को बदले बिना प्रति प्रोजेक्ट या प्रति लोकेल प्रदाता या मॉडल स्विच करें।

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

पूरी तुलना के लिए [एआई-आई18एन-टूल्स क्या है?](../docs/guide/what-is-ai-i18n-tools.md) देखें।

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

नंगे `ai-i18n-tools` कमांड (डाइरेनवी, पाथ, `package.json` स्क्रिप्ट, या `npx`) को कॉन्फ़िगर करें — [इंस्टॉलेशन](../docs/guide/installation.md) देखें।

<a id="quick-start"></a>
## त्वरित शुरुआत

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

दस्तावेज़-उन्मुख स्कैफोल्ड: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, या `ui-json-bundles`।

व्यक्तिगत अनुवाद कमांड को जोड़ने के बजाय `sync` को प्राथमिकता दें। पूर्ण वॉकथ्रू: [त्वरित शुरुआत](../docs/guide/quick-start.md)।

<a id="documentation"></a>
## दस्तावेज़

- [दस्तावेज़ साइट](https://wsj-br.github.io/ai-i18n-tools/) — गाइड, इंटीग्रेशन और संदर्भ
- [इंस्टॉलेशन](../docs/guide/installation.md) · [त्वरित शुरुआत](../docs/guide/quick-start.md) · [प्रदाता और मॉडल](../docs/guide/providers-and-models.md)
- [UI स्ट्रिंग](../docs/guide/ui-strings/) · [दस्तावेज़](../docs/guide/documents/) · [JSON](../docs/guide/json.md) · [SVG](../docs/guide/svg-translation/)
- [इंटीग्रेशन](../docs/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [CLI संदर्भ](../docs/reference/cli-commands/) · [कॉन्फ़िगरेशन](../docs/reference/configuration.md) · [रनटाइम हेल्पर](../docs/guide/runtime-helpers.md)
- [उदाहरण](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) — चलाने योग्य डेमो (`npx degit …`)
- [AI एजेंट संदर्भ](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — उपभोक्ता रेपो में सहायकों के लिए इंटीग्रेशन गाइड

<a id="contributing"></a>
## योगदान

समस्याएँ और पुल अनुरोधों का स्वागत है। इस रिपॉजिटरी के लिए अनुरक्षक वर्कफ़्लो: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) और [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md)।

<a id="license"></a>
## लाइसेंस

MIT — [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) देखें।

कॉपीराइट © 2026 वाल्डेमर स्कुडेलर जूनियर।
