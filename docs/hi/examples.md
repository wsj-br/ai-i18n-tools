<a id="examples"></a>
# उदाहरण

GitHub पर [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) के तहत चलाने योग्य प्रोजेक्ट — प्रत्येक अपनी स्वयं की कॉन्फ़िग, कमिटेड लोकेल आउटपुट और README के साथ। आप API कुंजी के बिना अनुवादित फ़ाइलों का अन्वेषण कर सकते हैं; अनुवाद को फिर से चलाने के लिए एक प्रदाता कुंजी की आवश्यकता होती है ([प्रदाता और मॉडल](/hi/guide/providers-and-models))।

<a id="run-standalone-npx-degit"></a>
## स्टैंडअलोन चलाएँ (`npx degit`)

पूरे रिपॉजिटरी को क्लोन किए बिना एक उदाहरण कॉपी करें। प्रत्येक `"ai-i18n-tools": "^1.7.2"` घोषित करता है और npm से CLI स्थापित करता है:

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

यदि आपने इसके बजाय **पूरे** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) रिपॉजिटरी को क्लोन किया है, तो रिपॉजिटरी रूट पर `pnpm install` और `pnpm run build` चलाएँ, फिर `cd examples/<name>`। कार्यस्थान उदाहरण अपने `pnpm run i18n:*` स्क्रिप्ट के माध्यम से स्थानीय CLI का उपयोग करते हैं, या [PATH सेटअप](/hi/guide/installation#using-the-cli) के बाद `ai-i18n-tools …` का उपयोग करते हैं। [स्थापना — क्लोन किया गया मोनोरिपो](/hi/guide/installation#cloned-monorepo) देखें।

<a id="list-of-examples"></a>
## उदाहरणों की सूची

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="test-markdown"></a>

| उदाहरण | इसके लिए सबसे अच्छा | degit के साथ कॉपी करें | चलाएँ |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | `t()` UI स्ट्रिंग्स + README अनुवाद के साथ सबसे छोटा कार्यशील ऐप | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + बहुवचन + डैशबोर्ड; नेस्टेड Docusaurus डॉक्स + फ्लैट README + SVG एसेट | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (ऐप `:3030`; डॉक्स के लिए `cd docs-site && pnpm start` `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Docusaurus दस्तावेज़ साइट केवल (`docusaurus` प्रीसेट) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; बिल्ड + सर्व, लोकेल मेनू काम करता है) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro लैंडिंग पेज: पूर्ण-पृष्ठ HTML + `t()` हाइब्रिड | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight दस्तावेज़ साइट | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress डॉक्स साइट + थीम JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / डिक्शनरी `.ts` शेल (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI कैटलॉग (`pt`, `zh`, डॉट पार्सर) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | सादा HTML + `data-i18n*` मार्कर; स्थिर लोकेल JSON (डैशबोर्ड-शैली UI) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | एक LLM प्रदाता चुनें या बेंचमार्क करें (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | रिग्रेशन-टेस्ट मार्कडाउन / CJK अनुवाद (देवनागरी, MDX) | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

प्रत्येक **उदाहरण** नाम पूर्ण सेटअप, कमांड और प्रोजेक्ट लेआउट के साथ अपने GitHub README से लिंक करता है — या [रिपॉजिटरी में उदाहरण इंडेक्स](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md) ब्राउज़ करें।
