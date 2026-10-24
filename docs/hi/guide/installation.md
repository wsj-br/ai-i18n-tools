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

<a id="standalone-executables"></a>
### स्टैंडअलोन निष्पादन योग्य (Standalone executables)

GitHub Releases में एक Node.js सिंगल-एक्जीक्यूटेबल बिल्ड संलग्न होता है। Python प्रोजेक्ट्स उस बाइनरी से CLI चलाते हैं, जिसमें `extract`, `translate-ui`, और `suggest-models` शामिल हैं, जिसके लिए Node.js इंस्टॉल करने की आवश्यकता नहीं है।

| प्लेटफ़ॉर्म | एसेट |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

प्रत्येक रिलीज़ में `SHA256SUMS.txt` और `ai-i18n-tools-python-examples.zip` (चार Python उदाहरण) भी संलग्न होते हैं। npm टारबॉल और एक्जीक्यूटेबल में वे उदाहरण शामिल नहीं होते हैं। वे रिपॉजिटरी में भी बने रहते हैं।

1. [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases) पेज से अपनी मशीन से मेल खाने वाली एसेट डाउनलोड करें।
2. `SHA256SUMS.txt` के विरुद्ध चेकसम की जाँच करें।
3. Linux और macOS पर, फ़ाइल पर `chmod +x` चलाएँ और इसे `PATH` पर ले जाएँ (या इसे पाथ द्वारा कॉल करें)।
4. Windows पर, `ai-i18n-tools-win-x64.exe` को `PATH` पर रखें। इसे `ai-i18n-tools.exe` में रीनेम करने से अन्य प्लेटफ़ॉर्म के समान ही कमांड नाम बना रहता है।

बाइनरी नोटराइज़्ड या Authenticode-साइन नहीं की गई हैं। macOS आपसे किसी अनसाइंड प्रोग्राम को स्वीकृत करने के लिए कह सकता है। Windows SmartScreen एक चेतावनी दिखा सकता है।

सक्रिय प्रदाता के लिए API की को उसी तरह सेट करें जैसे npm इंस्टॉल के लिए करते हैं (एनवायरनमेंट या वर्किंग डायरेक्टरी में `.env` फ़ाइल)। `init` से मॉडल सूची एक शुरुआती बिंदु है। `suggest-models` एक रैंक की गई शॉर्टलिस्ट प्रिंट करता है। `suggest-models --apply` इसे `translationModels` में लिखता है। वही रैंकिंग [Models](/hi/guide/translation-dashboard/models) टैब पर भी उपलब्ध है।

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

वॉकथ्रू: [Add i18n to a Python app](/hi/guide/add-i18n-to-python)। कमांड संदर्भ: [suggest-models](/hi/reference/cli-commands/models#suggest-models)।

ai-i18n-tools में इसका अपना स्ट्रिंग एक्सट्रैक्टर शामिल है। यदि आपने पहले `i18next-scanner`, `babel-plugin-i18next-extract`, या इसी तरह के अन्य का उपयोग किया है, तो माइग्रेट करने के बाद आप उन देव डिपेंडेंसी को हटा सकते हैं। मौजूदा i18next **नेमस्पेस JSON** फ़ाइलें [JSON पाइपलाइन](/hi/guide/json#i18next-namespace-files) पर रह सकती हैं। इंटलेयर `.content.ts` डिक्शनरी को `migrate-intlayer` के साथ इम्पोर्ट किया जा सकता है — [इंटलेयर से माइग्रेट करना](/hi/guide/migrating-from-intlayer) देखें।

<a id="using-the-cli"></a>
### CLI का उपयोग करना

अपने प्रोजेक्ट में `ai-i18n-tools` को निर्भरता या devDependency के रूप में स्थापित करें (ऊपर [इंस्टॉलेशन](#installation) देखें)। पैकेज एक `bin` एंट्री घोषित करता है जिसे आपका पैकेज मैनेजर `node_modules/.bin/ai-i18n-tools` से लिंक करता है। वह शिम (स्थापित पैकेज के अंदर `bin/ai-i18n-tools.mjs`) संकलित CLI को लोड करता है।

एक इंटरैक्टिव शेल में केवल `ai-i18n-tools` कमांड टाइप करने के लिए, नीचे दिए गए विकल्पों में से किसी एक को कॉन्फ़िगर करें। सेटअप के बिना, शेल स्थानीय इंस्टॉलेशन के बाद भी बाइनरी को नहीं ढूंढ पाएगा।

**direnv** — प्रोजेक्ट रूट में `.envrc` में जोड़ें (bash/zsh; देखें [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

`direnv allow` के बाद, जब भी आप प्रोजेक्ट में `cd` करते हैं तो केवल कमांड उपलब्ध होता है।

**मैनुअल पाथ** — इन्हें **प्रोजेक्ट रूट** (वह निर्देशिका जिसमें `node_modules/.bin` है) से चलाएं। उप-निर्देशिकाएं तब तक काम करती हैं जब तक आप उस `PATH` प्रविष्टि को स्थान पर छोड़ देते हैं; एक नेस्टेड फ़ोल्डर से पुनः निर्यात चलाने पर विफल हो जाता है क्योंकि `$PWD` अब प्रोजेक्ट रूट पर इंगित नहीं करता है।

```bash
# bash/zsh — from the project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — from the project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**ग्लोबल इंस्टाल** — CLI को एक बार स्थापित करें और इसे किसी भी निर्देशिका से इनवोक करें:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

pnpm के साथ, `pnpm setup` को एक बार प्रति मशीन (और एक नया शेल खोलें) चलाएं यदि वैश्विक कमांड गायब हैं — pnpm को `PATH` पर अपने वैश्विक बिन निर्देशिका की आवश्यकता होती है। एक वैश्विक इंस्टॉल वैश्विक पिन किए गए संस्करण का उपयोग करता है। प्रति-परियोजना संस्करण पिनिंग के लिए, direnv या मैनुअल PATH को पसंद करें ताकि `node_modules/.bin` परियोजना की निर्भरता को हल करे।

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
### ai-i18n-tools मोनोरेपो क्लोन किया गया

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) के पूर्ण क्लोन से पैकेज विकसित करते समय या वर्कस्पेस **उदाहरण** चलाते समय:

- **कार्यस्थान उदाहरण** (`examples/console-app`, `examples/nextjs-app`, और [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) में सूचीबद्ध अन्य पैकेज) — रिपॉजिटरी रूट पर `pnpm install` चलाएँ, फिर `cd examples/<name>`। उदाहरण के `pnpm run i18n:*` स्क्रिप्ट का उपयोग करें, या PATH कॉन्फ़िगर करें ([CLI का उपयोग करना](#using-the-cli) देखें) और केवल `ai-i18n-tools …` चलाएँ। कार्यस्थान [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) आपके स्थानीय चेकआउट से `ai-i18n-tools` को लिंक करता है।
- **रिपॉजिटरी रूट** — pnpm रूट पैकेज के अपने `bin` को `node_modules/.bin` में लिंक नहीं करता है। इस चेकआउट का `.envrc` `bin/` को `PATH` में जोड़ता है ताकि प्रतिबद्ध `bin/ai-i18n-tools` रैपर (प्रकाशित `bin/ai-i18n-tools.mjs` शिम के बगल में) `direnv allow` के बाद केवल कमांड प्रदान करे। direnv के बिना, `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …`, या रूट `pnpm i18n:*` स्क्रिप्ट (या एक शेल उपनाम / `pnpm add -g .` — [विकास मार्गदर्शिका](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) देखें) का उपयोग करें।
- **स्टैंडअलोन फिक्स्चर** (`multi-provider`, `test-markdown`) — फिक्स्चर फ़ोल्डर से, `node ../../bin/ai-i18n-tools.mjs …` का उपयोग करें।

CLI स्रोत बदलने के बाद रिपॉजिटरी रूट पर `pnpm run build` चलाएँ। बिल्ड चरणों और वैकल्पिक वैश्विक-स्थापना वर्कअराउंड के लिए [डेवलपमेंट गाइड](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) देखें।

Linux, macOS, और WSL पर, रजिस्ट्री इंस्टाल CLI स्क्रिप्ट पर निष्पादन योग्य बिट स्वचालित रूप से सेट करते हैं। Windows पर, पैकेज मैनेजर `.cmd` और `.ps1` शिम उत्पन्न करते हैं जो Node को स्पष्ट रूप से इनवोक करते हैं।

अनुवाद कमांड (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) के लिए `ai-i18n-tools.config.json` में **प्रदाता कॉन्फ़िगरेशन** और सक्रिय प्रदाता के लिए **एक API कुंजी** आवश्यक है। उस प्रीसेट को स्केफ़ोल्ड करने के लिए `ai-i18n-tools init -P <provider>` चलाएँ; मॉडल जोड़ने के लिए `provider` / `providers` संपादित करें — [LLM प्रदाता और मॉडल](/hi/guide/providers-and-models) देखें। `init` से मॉडल सूची एक शुरुआती बिंदु है। `ai-i18n-tools suggest-models` सक्रिय प्रदाता के चैट मॉडल को रैंक करता है, और `suggest-models --apply` `translationModels` की जगह लेता है। वही रैंकिंग [मॉडल](/hi/guide/translation-dashboard/models) टैब पर है। कमांड संदर्भ: [suggest-models](/hi/reference/cli-commands/models#suggest-models)। ओलामा एकमात्र बिल्ट-इन प्रीसेट है जिसे किसी API कुंजी की आवश्यकता नहीं है।

उस API कुंजी को सेट करें जो उस प्रदाता से मेल खाती है जिसे आप `init` को पास करते हैं ([प्रीसेट तालिका](/hi/guide/providers-and-models#built-in-providers) देखें):

```bash
# init -P openrouter
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# init -P openai
# export OPENAI_API_KEY=sk-your-key-here
```

या प्रोजेक्ट रूट में एक `.env` फ़ाइल बनाएँ:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### टूल UI भाषा

CLI अपने स्वयं के सहायता पाठ, लॉग सारांश और अनुवाद डैशबोर्ड को आपके द्वारा अनुवादित किए जाने वाले लोकेल से स्वतंत्र रूप से स्थानीयकृत करता है। डिफ़ॉल्ट रूप से यह आपके OS लोकेल का अनुसरण करता है। कॉन्फ़िग में `-L pt-BR`, `export AI_I18N_LANG=es`, या `"uiLanguage"` के साथ ओवरराइड करें। [टूल UI भाषा](/hi/guide/tool-ui-language) देखें।
