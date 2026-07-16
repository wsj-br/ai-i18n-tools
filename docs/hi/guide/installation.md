<a id="installation"></a>
# इंस्टॉलेशन

प्रकाशित पैकेज **केवल ESM** है। Node.js या अपने बंडलर में `import`/`import()` का उपयोग करें; `require('ai-i18n-tools')` का उपयोग न करें। पैकेज `engines.node` `>=22.16.0` घोषित करता है; पुराने Node.js संस्करण समर्थित नहीं हैं। npm tarball में `docs/` के तहत केवल अंग्रेजी फाइलें शामिल हैं; `translated-docs/` के तहत स्थानीय-विशिष्ट प्रतियां [GitHub रिपॉजिटरी](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) में हैं।

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools में अपना स्वयं का स्ट्रिंग एक्सट्रैक्टर शामिल है। यदि आपने पहले `i18next-scanner`, `babel-plugin-i18next-extract`, या इसी तरह के का उपयोग किया था, तो आप माइग्रेट करने के बाद उन dev निर्भरताओं को हटा सकते हैं।

<a id="using-the-cli"></a>
### CLI का उपयोग करना

अपने प्रोजेक्ट में `ai-i18n-tools` को निर्भरता या devDependency के रूप में स्थापित करें (ऊपर [इंस्टॉलेशन](#installation) देखें)। पैकेज एक `bin` एंट्री घोषित करता है जिसे आपका पैकेज मैनेजर `node_modules/.bin/ai-i18n-tools` से लिंक करता है। वह शिम (स्थापित पैकेज के अंदर `bin/ai-i18n-tools.mjs`) संकलित CLI को लोड करता है।

एक इंटरैक्टिव शेल में केवल `ai-i18n-tools` कमांड टाइप करने के लिए, नीचे दिए गए विकल्पों में से किसी एक को कॉन्फ़िगर करें। सेटअप के बिना, शेल स्थानीय इंस्टॉलेशन के बाद भी बाइनरी को नहीं ढूंढ पाएगा।

**direnv** — प्रोजेक्ट रूट में `.envrc` में जोड़ें (bash/zsh; देखें [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

`direnv allow` के बाद, जब भी आप प्रोजेक्ट में `cd` करते हैं तो केवल कमांड उपलब्ध होता है।

**मैनुअल PATH** — एक इंटरैक्टिव शेल में प्रोजेक्ट रूट से:

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**ग्लोबल इंस्टाल** — CLI को एक बार स्थापित करें और इसे किसी भी निर्देशिका से इनवोक करें:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

एक ग्लोबल इंस्टाल ग्लोबली पिन किए गए संस्करण का उपयोग करता है। प्रति-प्रोजेक्ट संस्करण पिनिंग के लिए, direnv या मैनुअल PATH को प्राथमिकता दें ताकि `node_modules/.bin` प्रोजेक्ट की निर्भरता को हल करे।

**`package.json` स्क्रिप्ट** — जब npm या pnpm कोई स्क्रिप्ट चलाता है, तो यह `PATH` में `node_modules/.bin` जोड़ता है, ताकि स्क्रिप्ट के अंदर शेल PATH परिवर्तनों के बिना केवल कमांड नाम काम करे। हाथ से अनुवाद चरणों को जोड़ने के बजाय `sync` को प्राथमिकता दें — मैन्युअल रूप से चलाने पर क्रम और सुविधा फ़्लैग गलत हो सकते हैं:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

फिर उदाहरण के लिए `pnpm run i18n:sync` चलाएँ। अनुशंसित सेट के लिए [अनुशंसित `package.json` स्क्रिप्ट](/hi/guide/quick-start#recommended-packagejson-scripts) देखें।

**विकल्प** — यदि आप `PATH` को समायोजित नहीं करना चाहते हैं: `npx ai-i18n-tools …` (npm) या `pnpm exec ai-i18n-tools …` (pnpm)। `package.json` प्रविष्टि के बिना एक शून्य-इंस्टाल वन-ऑफ के लिए: `npx ai-i18n-tools <cmd>` या `pnpm dlx ai-i18n-tools <cmd>`।

<a id="cloned-ai-i18n-tools-monorepo"></a>
### क्लोन किया गया ai-i18n-tools मोनोरिपो

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) के पूर्ण क्लोन से पैकेज विकसित करते समय या वर्कस्पेस **उदाहरण** चलाते समय:

- **वर्कस्पेस उदाहरण** (`examples/console-app`, `examples/nextjs-app`, और [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) में सूचीबद्ध अन्य पैकेज) — रिपॉजिटरी रूट पर `pnpm install` चलाएँ, फिर `cd examples/<name>`। उदाहरण के `pnpm run i18n:*` स्क्रिप्ट का उपयोग करें, या PATH कॉन्फ़िगर करें ([CLI का उपयोग करना](#using-the-cli) देखें) और केवल `ai-i18n-tools …` चलाएँ। वर्कस्पेस [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) आपके स्थानीय चेकआउट से `ai-i18n-tools` को लिंक करता है।
- **रिपॉजिटरी रूट** — pnpm रूट पैकेज के अपने `bin` को `node_modules/.bin` में लिंक नहीं करता है। इसके बजाय `node bin/ai-i18n-tools.mjs …` या रूट `pnpm i18n:*` स्क्रिप्ट का उपयोग करें (या एक शेल उपनाम / `pnpm add -g .` — [डेवलपमेंट गाइड](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) देखें)।
- **स्टैंडअलोन फिक्स्चर** (`multi-provider`, `test-markdown`) — फिक्स्चर फ़ोल्डर से, `node ../../bin/ai-i18n-tools.mjs …` का उपयोग करें।

CLI स्रोत बदलने के बाद रिपॉजिटरी रूट पर `pnpm run build` चलाएँ। बिल्ड चरणों और वैकल्पिक वैश्विक-स्थापना वर्कअराउंड के लिए [डेवलपमेंट गाइड](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) देखें।

Linux, macOS, और WSL पर, रजिस्ट्री इंस्टाल CLI स्क्रिप्ट पर निष्पादन योग्य बिट स्वचालित रूप से सेट करते हैं। Windows पर, पैकेज मैनेजर `.cmd` और `.ps1` शिम उत्पन्न करते हैं जो Node को स्पष्ट रूप से इनवोक करते हैं।

अनुवाद कमांड (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) के लिए `ai-i18n-tools.config.json` में **प्रदाता कॉन्फ़िगरेशन** और सक्रिय प्रदाता के लिए **एक API कुंजी** की आवश्यकता होती है। डिफ़ॉल्ट प्रदाता ब्लॉक (छोड़ने पर `openrouter`) को स्केफोल्ड करने के लिए `ai-i18n-tools init [-P <provider>]` चलाएँ; प्रीसेट या मॉडल स्विच करने के लिए `provider` / `providers` संपादित करें — [LLM प्रदाता और मॉडल](/hi/guide/providers-and-models) देखें। Ollama एकमात्र अंतर्निहित प्रीसेट है जिसे किसी API कुंजी की आवश्यकता नहीं है।

अपने सक्रिय प्रदाता से मेल खाने वाली API कुंजी सेट करें ([प्रीसेट तालिका](/hi/guide/providers-and-models#built-in-providers) देखें):

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

या प्रोजेक्ट रूट में एक `.env` फ़ाइल बनाएँ:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### टूल UI भाषा

CLI अपने स्वयं के सहायता पाठ, लॉग सारांश और अनुवाद डैशबोर्ड को आपके द्वारा अनुवादित किए जाने वाले लोकेल से स्वतंत्र रूप से स्थानीयकृत करता है। डिफ़ॉल्ट रूप से यह आपके OS लोकेल का अनुसरण करता है। कॉन्फ़िग में `-L pt-BR`, `export AI_I18N_LANG=es`, या `"uiLanguage"` के साथ ओवरराइड करें। [टूल UI भाषा](/hi/guide/tool-ui-language) देखें।
