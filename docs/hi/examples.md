<a id="examples"></a>
# उदाहरण

GitHub पर [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) के तहत चलाने योग्य प्रोजेक्ट — प्रत्येक अपनी स्वयं की कॉन्फ़िग, कमिटेड लोकेल आउटपुट और README के साथ। आप API कुंजी के बिना अनुवादित फ़ाइलों का अन्वेषण कर सकते हैं; अनुवाद को फिर से चलाने के लिए एक प्रदाता कुंजी की आवश्यकता होती है ([प्रदाता और मॉडल](/hi/guide/providers-and-models))।

<a id="run-standalone-npx-degit"></a>
## स्टैंडअलोन चलाएँ (`npx degit`)

पूरे रिपॉजिटरी को क्लोन किए बिना एक उदाहरण कॉपी करें।

<a id="nodejs-examples"></a>
### Node.js उदाहरण

प्रत्येक Node.js उदाहरण वर्तमान पैकेज संस्करण से मेल खाने वाली `ai-i18n-tools` की एक प्रकाशित कैरेट रेंज घोषित करता है और npm से CLI इंस्टॉल करता है:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

<a id="python-examples"></a>
### Python उदाहरण

`python-streamlit`, `python-flask`, `python-fastapi`, और `python-gettext` में कोई `package.json` नहीं है। नीचे दी गई तालिका में `degit` कमांड मान्य हैं। आप [GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases) से `ai-i18n-tools-python-examples.zip` भी डाउनलोड कर सकते हैं। वह ज़िप वही चार निर्देशिकाएँ हैं। यह npm पैकेज का हिस्सा नहीं है, और यह स्टैंडअलोन निष्पादन योग्य फ़ाइल के अंदर नहीं है।

`python-streamlit`, `python-flask`, और `python-fastapi` एक virtualenv और `pip install -r requirements.txt` का उपयोग करते हैं। `python-gettext` केवल मानक लाइब्रेरी का उपयोग करता है। [standalone executable](/hi/guide/installation#standalone-executables) के साथ अनुवाद करें।

```bash
npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit
cd python-streamlit
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Windows पर, `.venv\Scripts\activate` को सक्रिय करें।

यदि आपने इसके बजाय **पूरी** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) रिपॉजिटरी को क्लोन किया है, तो रिपॉजिटरी रूट पर `pnpm install` और `pnpm run build` चलाएँ, फिर `cd examples/<name>` चलाएँ। वर्कस्पेस (Node.js) उदाहरण अपने `pnpm run i18n:*` स्क्रिप्ट के माध्यम से स्थानीय CLI का उपयोग करते हैं, या [PATH setup](/hi/guide/installation#using-the-cli) के बाद सीधे `ai-i18n-tools …` का उपयोग करते हैं। उस चेकआउट में Python उदाहरण बिल्ड के बाद `node ../../bin/ai-i18n-tools.mjs` के साथ अनुवाद करते हैं। [Installation — Cloned monorepo](/hi/guide/installation#cloned-monorepo) देखें।

<a id="which-example-matches-my-project"></a>
## कौन सा उदाहरण मेरे प्रोजेक्ट से मेल खाता है?

- एक JS/TS ऐप: [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) (सबसे छोटा) या [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md)। गाइड: [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js)।
- एक Python ऐप: python-streamlit, python-flask, python-fastapi, या python-gettext। गाइड: [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python)।
- एक वेबसाइट या डॉक्स साइट: docusaurus-docs, vitepress-docs, astro-docs, nextra-docs, fumadocs-docs, astro-website, plain-html, या plain-html-docs। गाइड: [एक वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website)।
- एक ऐप के बगल में एक रिपॉजिटरी README: [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) या [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) (nextjs उदाहरण में एक डॉक्स साइट भी है)। गाइड: [अपने README और Markdown डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)।
- कुछ और: multi-provider, test-markdown, और intlayer-migration।

<a id="list-of-examples"></a>
## उदाहरणों की सूची

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="plain-html-docs"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="intlayer-migration"></a>
<a id="intlayer-translate"></a>
<a id="test-markdown"></a>
<a id="python-streamlit"></a>
<a id="python-flask"></a>
<a id="python-fastapi"></a>
<a id="python-gettext"></a>

| उदाहरण | इसके लिए सबसे अच्छा | degit के साथ कॉपी करें | चलाएँ |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | `t()` UI स्ट्रिंग्स + README अनुवाद के साथ सबसे छोटा कार्यशील ऐप | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + बहुवचन + डैशबोर्ड; नेस्टेड Docusaurus डॉक्स + फ्लैट README + SVG एसेट | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (ऐप `:3030`; डॉक्स के लिए `cd docs-site && pnpm start` `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Docusaurus दस्तावेज़ साइट केवल (`docusaurus` प्रीसेट) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; बिल्ड + सर्व, लोकेल मेनू काम करता है) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro लैंडिंग पेज: पूर्ण-पृष्ठ HTML + `t()` हाइब्रिड | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight दस्तावेज़ साइट | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress डॉक्स साइट + थीम JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / डिक्शनरी `.ts` शेल, और एक `t()` सर्वर कंपोनेंट (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI कैटलॉग (`pt`, `zh`, डॉट पार्सर) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | सादा HTML + `data-i18n*` मार्कर; स्थिर लोकेल JSON (डैशबोर्ड-शैली UI) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**plain-html-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs/README.md) | दस्तावेज़ों के रूप में सादा HTML: प्रति लोकेल एक पृष्ठ, स्थानीयकृत छवियाँ, hreflang | `npx degit wsj-br/ai-i18n-tools/examples/plain-html-docs plain-html-docs` | `pnpm dev` (`:3092`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | एक LLM प्रदाता चुनें या बेंचमार्क करें (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | रिग्रेशन-टेस्ट मार्कडाउन / CJK अनुवाद (देवनागरी, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |
| [**intlayer-migration**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration/README.md) | इंटलेयर `.content.ts` → `t()` (`migrate-intlayer`, रीसेट + AI-एजेंट रिपोर्ट) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration` | `pnpm reset && pnpm dev` (`:3091`) |
| [**intlayer-translate**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate/README.md) | Intlayer रखें, गायब लोकेल को वहीं भरें (`translate-intlayer`; `en` + `pt-BR` शामिल, `es` + `zh-Hans` गायब) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate` | `pnpm reset && pnpm translate` (`pnpm dev` `:3093`) |
| [**python-streamlit**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit/README.md) | Streamlit डैशबोर्ड, `t()` / `_()`, सोर्स-स्ट्रिंग JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit` | `python3 -m venv .venv && pip install -r requirements.txt && streamlit run app.py` |
| [**python-flask**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask/README.md) | Flask + Jinja, `t()` / `_()`, सोर्स-स्ट्रिंग JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-flask python-flask` | `python3 -m venv .venv && pip install -r requirements.txt && flask --app app run` |
| [**python-fastapi**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi/README.md) | FastAPI, ContextVar लोकेल, `t()` / `_()`, सोर्स-स्ट्रिंग JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-fastapi python-fastapi` | `python3 -m venv .venv && pip install -r requirements.txt && uvicorn app:app` |
| [**python-gettext**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext/README.md) | मौजूदा GNU gettext CLI; `extract` / `translate-ui` रिफ्रेश `.po` और `.mo` | `npx degit wsj-br/ai-i18n-tools/examples/python-gettext python-gettext` | `python3 app.py --lang es` |

प्रत्येक **उदाहरण** नाम पूर्ण सेटअप, कमांड और प्रोजेक्ट लेआउट के साथ अपने GitHub README से लिंक करता है — या [रिपॉजिटरी में उदाहरण इंडेक्स](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md) ब्राउज़ करें।

Node.js उदाहरण `pnpm install` के बाद npm से CLI इंस्टॉल करते हैं। चार Python उदाहरण `venv` और `pip` का उपयोग करते हैं (`python-gettext` केवल मानक लाइब्रेरी का उपयोग करता है) और अनुवाद के लिए [standalone executable](/hi/guide/installation#standalone-executables) का उपयोग करते हैं।

<br/>

::: tip अस्वीकरण
उत्पाद नाम और आइकन उनके संबंधित स्वामियों की संपत्ति हैं और केवल पहचान के उद्देश्य से उपयोग किए जाते हैं। यह सॉफ़्टवेयर उन ब्रांडों से संबद्ध नहीं है और न ही उनके द्वारा अनुमोदित है।
:::
