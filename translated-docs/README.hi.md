<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml) [![skills.sh](https://skills.sh/b/wsj-br/ai-i18n-tools)](https://skills.sh/wsj-br/ai-i18n-tools)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

**किसी भी LLM प्रोवाइडर पर अपने चुने हुए मॉडलों के साथ अपने ऐप, वेबसाइट और डॉक्स का अनुवाद करें। एक कॉन्फ़िग, कैश्ड रीरन्स।**

सीएलआई और टूलकिट जो जावास्क्रिप्ट/टाइपस्क्रिप्ट ऐप्स, पायथन ऐप्स, .NET ऐप्स और दस्तावेज़ साइटों में भाषाएँ जोड़ता है। वह भाषा जिससे आप शुरू करते हैं वह `sourceLocale` है, और यह कोई भी भाषा हो सकती है। यह टेक्स्ट ढूंढता है, उसका अनुवाद करता है, और उन फ़ाइलों को लिखता है जिन्हें आपका प्रोजेक्ट लोड करता है। अंतर्निहित प्रीसेट में OpenAI, Anthropic, Gemini, OpenRouter, Ollama, और कोई भी OpenAI-संगत एपीआई शामिल हैं। प्रति प्रोजेक्ट या प्रति स्थानीयकरण प्रदाता या मॉडल बदलें।

[VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), [सामान्य मार्कडाउन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-readme) (एक रिपॉजिटरी README और अन्य `.md` फ़ाइलें), और सामान्य HTML के साथ काम करता है। पायथन ऐप्स `t()` / `_()` या GNU gettext (Streamlit, FastAPI, Flask, Django, और डेस्कटॉप टूलकिट) का उपयोग करते हैं। .NET ऐप्स C# में `T()` और XAML में `{loc:Tr '...'}` का उपयोग करते हैं, जिसमें एक जनरेटेड `I18n.cs` (Avalonia, WPF, MAUI, ASP.NET, Blazor, और कंसोल) होता है। आपके मौजूदा [i18next](https://www.i18next.com/) कैटलॉग (नेमस्पेस JSON या `t()` स्रोत स्ट्रिंग) को रखता है। [Intlayer](https://intlayer.org/) के साथ दो तरीकों से काम करता है: Intlayer रखें और इसकी डिक्शनरी को `translate-intlayer` से भरें, या `migrate-intlayer` के साथ स्रोत-स्ट्रिंग `t()` कॉल पर जाएँ। Intlayer टाइप की गई सामग्री डिक्शनरी और अनुवाद प्रबंधन सिस्टम के लिए उपयुक्त रहता है।

<a id="features"></a>
## विशेषताएँ

| | |
| --- | --- |
| **यूआई स्ट्रिंग** | JS/TS/एस्ट्रो और पायथन से `t("…")` / `_()`, C# और XAML से `T("…")`, या एक HTML फ़ाइल में `data-i18n*` निकालें → फ्लैट प्रति-स्थानीय JSON, `.resx` सैटेलाइट, या GNU gettext |
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
| एक Python ऐप (Streamlit, FastAPI, Flask, डेस्कटॉप, स्क्रिप्ट) | [एक Python ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-python) |
| एक .NET ऐप (Avalonia, WPF, MAUI, ASP.NET, Blazor, कंसोल) | [एक .NET ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-dotnet) |
| एक Django ऐप, Flask-Babel कैटलॉग, या एक ऐसा ऐप जो पहले से GNU gettext का उपयोग करता है | [एक Django / Python gettext ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-django-gettext) |
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

इंस्टॉलर इस मशीन के लिए एक gzip आर्काइव डाउनलोड करता है, `SHA256SUMS.txt` की जाँच करता है, इसे अनपैक करता है, कमांड को `ai-i18n-tools` के रूप में इंस्टॉल करता है, और इसे `PATH` में जोड़ता है। बाइनरी नोटराइज़ नहीं किए गए हैं या ऑथेंटिकोड-साइन नहीं किए गए हैं। मैन्युअल डाउनलोड चरण: [स्टैंडअलोन एग्जीक्यूटेबल](https://wsj-br.github.io/ai-i18n-tools/hi/guide/installation#standalone-executables)।

चार पायथन उदाहरण रिपॉजिटरी में और रिलीज़ पर `ai-i18n-tools-python-examples.zip` में हैं। दो .NET उदाहरण `ai-i18n-tools-dotnet-examples.zip` में हैं, `assets/dotnet` के साथ। कोई भी आर्काइव npm टारबॉल या निष्पादन योग्य के अंदर नहीं है। .NET आर्काइव से पहले प्रकाशित रिलीज़ इसमें शामिल नहीं हैं।

<a id="quick-start"></a>
## त्वरित शुरुआत

आपके पास जो है उसके लिए कॉन्फ़िग को स्केफ़ोल्ड करें, फिर अपने पथ के लिए गाइड का पालन करें:

| आपके पास है | स्केफ़ोल्ड करें | फिर पालन करें |
| --- | --- | --- |
| एक JS/TS ऐप | `ai-i18n-tools init -P openrouter` | [एक JS/TS ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-js) |
| एक Python ऐप | `ai-i18n-tools init -t ui-python -P openrouter` | [एक Python ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-python) |
| एक .NET ऐप | `ai-i18n-tools init -t ui-dotnet -P openrouter` | [एक .NET ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-dotnet) |
| एक .NET ऐप जो पहले से `ResourceManager` या `IStringLocalizer` का उपयोग करता है | `ai-i18n-tools init -t ui-dotnet-resx -P openrouter` | [एक .NET रिसोर्समैनेजर ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-dotnet-resourcemanager) |
| एक Django या GNU gettext ऐप | `ai-i18n-tools init -t ui-python-django -P openrouter` (या `ui-python-gettext`, `ui-python-flask`) | [एक Django / Python gettext ऐप में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-django-gettext) |
| एक वेबसाइट या डॉक्स साइट | `ai-i18n-tools init -t ui-vitepress -P openrouter` (अपने फ्रेमवर्क के लिए टेम्पलेट बदलें) | [किसी वेबसाइट या डॉक्स साइट में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-website) |
| एक README, ऐप के साथ या उसके बिना | `ai-i18n-tools init -P openrouter` (JS/TS ऐप + README) या `init -t docs-markdown` | [अपनी README और मार्कडाउन डॉक्स में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-readme) |

जब प्रोजेक्ट तैयार हो जाए, तो `ai-i18n-tools sync` चलाएँ, फिर यह देखने के लिए `ai-i18n-tools status` चलाएँ कि क्या अनुवाद किया गया था।

एक JS/TS ऐप को पहले अपने टेक्स्ट को `t()` में रैप करना होगा। सादे टेक्स्ट पर चलाएँ, `sync` बिना किसी त्रुटि के समाप्त हो जाता है और कुछ भी उपयोगी नहीं लिखता है। `sync` से पहले आपके साइट फ्रेमवर्क में भी अपनी i18n रूटिंग सक्षम होनी चाहिए।

वेबसाइटों के लिए टेम्पलेट: `ui-starlight`, `ui-docusaurus`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, और `ui-plain-html` या `docs-plain-html`। केवल README और मार्कडाउन: `docs-markdown`। README ब्लॉक शामिल करने के लिए किसी अन्य टेम्पलेट में `--with-readme` जोड़ें। पायथन गेटटेक्स्ट ऐप्स: `ui-python-django`, `ui-python-flask`, `ui-python-gettext`। .NET ऐप्स: `ui-dotnet` (एम्बेडेड JSON और `I18n.cs`) या `ui-dotnet-resx` (`.resx` सैटेलाइट और `I18nResx.cs`)। `migrate-dotnet-i18n` `T($"…")` को `T("…{0}…", arg)` में फिर से लिखता है और `Resources.LoginButton` जैसी नामित रेसक्स कुंजियों को सुझावों के रूप में सूचीबद्ध करता है। नेस्टेड i18next JSON: `ui-json-bundles`। पूरी सूची: [सीएलआई सेटअप संदर्भ](https://wsj-br.github.io/ai-i18n-tools/hi/reference/cli-commands/setup)।

`suggest-models` सक्रिय प्रोवाइडर के चैट मॉडल को प्रकाशित बेंचमार्क से रैंक करता है, और `suggest-models --apply`, `translationModels` की जगह लेता है। यही रैंकिंग [मॉडल](https://wsj-br.github.io/ai-i18n-tools/hi/guide/translation-dashboard/models) टैब पर है। गाइड: [AI मॉडल](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ai-models)। कमांड संदर्भ: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/hi/reference/cli-commands/models#suggest-models)।

व्यक्तिगत अनुवाद कमांडों को एक साथ जोड़ने के बजाय `sync` को प्राथमिकता दें। पूर्ण विवरण: [त्वरित शुरुआत](https://wsj-br.github.io/ai-i18n-tools/hi/guide/quick-start)। एक प्रोजेक्ट में एक से अधिक प्रकार की सामग्री: [पाइपलाइनों का संयोजन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/combining-pipelines)।

<a id="documentation"></a>
## दस्तावेज़

- [दस्तावेज़ साइट](https://wsj-br.github.io/ai-i18n-tools/hi/) — गाइड, एकीकरण, और संदर्भ
- [इंस्टॉलेशन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/installation) · [त्वरित शुरुआत](https://wsj-br.github.io/ai-i18n-tools/hi/guide/quick-start) · [एलएलएम प्रदाता](https://wsj-br.github.io/ai-i18n-tools/hi/guide/providers-and-models) · [एआई मॉडल](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ai-models)
- [यूआई स्ट्रिंग](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/) · [सामान्य HTML](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/plain-html) · [पायथन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/python) · [.NET](https://wsj-br.github.io/ai-i18n-tools/hi/guide/ui-strings/dotnet) · [रिसोर्समैनेजर](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-dotnet-resourcemanager) · [दस्तावेज़](https://wsj-br.github.io/ai-i18n-tools/hi/guide/documents/) · [HTML पेज](https://wsj-br.github.io/ai-i18n-tools/hi/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/hi/guide/json) · [एसवीजी](https://wsj-br.github.io/ai-i18n-tools/hi/guide/svg-translation/)
- [इंटलेयर](https://intlayer.org/) — [डिक्शनरी को वहीं अनुवादित करें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/translating-intlayer) · [स्रोत-स्ट्रिंग कॉल पर जाएँ](https://wsj-br.github.io/ai-i18n-tools/hi/guide/migrating-from-intlayer)
- [एकीकरण](https://wsj-br.github.io/ai-i18n-tools/hi/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro, और [पायथन](https://wsj-br.github.io/ai-i18n-tools/hi/guide/integrations/python)
- [अपने प्रोजेक्ट में i18n जोड़ें](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-your-project) — [JS/TS ऐप](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-js) · [पायथन ऐप](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-python) · [.NET ऐप](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-dotnet) · [Django / गेटटेक्स्ट ऐप](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-django-gettext) · [वेबसाइट या दस्तावेज़ साइट](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-website) · [README और मार्कडाउन दस्तावेज़](https://wsj-br.github.io/ai-i18n-tools/hi/guide/add-i18n-to-readme) · [पाइपलाइनें संयोजित करना](https://wsj-br.github.io/ai-i18n-tools/hi/guide/combining-pipelines)
- [सीएलआई संदर्भ](https://wsj-br.github.io/ai-i18n-tools/hi/reference/cli-commands/) · [कॉन्फ़िगरेशन](https://wsj-br.github.io/ai-i18n-tools/hi/reference/configuration) · [रनटाइम हेल्पर](https://wsj-br.github.io/ai-i18n-tools/hi/guide/runtime-helpers)
- [उदाहरण](https://wsj-br.github.io/ai-i18n-tools/hi/examples) — चलाने योग्य डेमो (`npx degit …`)
- [AI एजेंट संदर्भ](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — उपभोक्ता प्रोजेक्ट्स के लिए संक्षिप्त प्रॉम्प्ट / `AGENTS.md` एंट्रीपॉइंट
- [पोर्टेबल एजेंट स्किल्स](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills) — एक इंस्टॉलेशन, फिर प्रति वर्कफ़्लो एक स्लैश कमांड: `npx skills add wsj-br/ai-i18n-tools --all -y` (Node.js 22.20+); [इंस्टॉलेशन गाइड](https://wsj-br.github.io/ai-i18n-tools/hi/guide/coding-agent-skill)

<a id="contributing"></a>
## योगदान

समस्याएँ और पुल अनुरोधों का स्वागत है। इस रिपॉजिटरी के लिए अनुरक्षक वर्कफ़्लो: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) और [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md)।

<a id="license"></a>
## लाइसेंस

MIT — [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) देखें।

कॉपीराइट Copyright © 2026 Waldemar Scudeller Jr.

<br/>

उत्पाद के नाम और आइकन उनके संबंधित स्वामियों के हैं और केवल पहचान के उद्देश्यों के लिए उपयोग किए जाते हैं। यह सॉफ़्टवेयर उन ब्रांडों से संबद्ध या समर्थित नहीं है।

<small>

> **यूआई और दस्तावेज़ीकरण अनुवादों पर नोट:** अंग्रेज़ी (UK) को छोड़कर सभी इंटरफ़ेस और दस्तावेज़ीकरण भाषाओं का अनुवाद इस पैकेज (ai-i18n-tools) का उपयोग करके एआई द्वारा किया गया है; शब्दावली अस्पष्ट हो सकती है या इसमें त्रुटियाँ हो सकती हैं।

</small>
