<a id="installation"></a>
# इंस्टॉलेशन

यह पृष्ठ CLI को स्थापित करता है और `ai-i18n-tools` कमांड को काम करने योग्य बनाता है। पहले से स्थापित है? [त्वरित शुरुआत](/hi/guide/quick-start) पर जाएँ।

प्रकाशित पैकेज केवल ESM है। Node.js या अपने बंडलर में `import` या `import()` का उपयोग करें; `require('ai-i18n-tools')` का उपयोग न करें। पैकेज `engines.node` `>=22.16.0` घोषित करता है; पुराने Node.js संस्करण असमर्थित हैं। npm टारबॉल में `docs/ai-i18n-tools-context.md` पर उपभोक्ता संदर्भ और पूर्ण `skills/` ट्री शामिल है, न कि पूरी दस्तावेज़ीकरण साइट; `translated-docs/` के तहत स्थानीय-विशिष्ट प्रतियां [GitHub रिपॉजिटरी](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) में हैं।

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

Linux और macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

इंस्टॉलर सिस्टम का पता लगाता है, मिलान करने योग्य निष्पादन योग्य डाउनलोड करता है, `SHA256SUMS.txt` की जाँच करता है, कमांड को `ai-i18n-tools` (Windows पर `ai-i18n-tools.exe`) के रूप में स्थापित करता है, और इंस्टॉल निर्देशिका को `PATH` में जोड़ता है। डिफ़ॉल्ट निर्देशिका `~/.local/bin` है। यदि कमांड अभी तक नहीं मिला है तो एक नया टर्मिनल खोलें। एक रिलीज़ को पिन करने के लिए `AI_I18N_VERSION` (उदाहरण के लिए `v1.11.0`) सेट करें, या किसी अन्य निर्देशिका को चुनने के लिए `AI_I18N_INSTALL_DIR` सेट करें।

बाइनरीज़ नोटराइज़्ड या ऑथेंटिकोड-साइन नहीं हैं। macOS आपसे एक अहस्ताक्षरित प्रोग्राम को मंज़ूरी देने के लिए कह सकता है। Windows SmartScreen एक चेतावनी दिखा सकता है। चेकसम मेल खाने के बाद macOS इंस्टॉलर क्वारंटाइन फ़्लैग को हटा देता है।

प्रत्येक रिलीज़ में `SHA256SUMS.txt` और `ai-i18n-tools-python-examples.zip` (चार Python उदाहरण) भी संलग्न होते हैं। जिस रिलीज़ से इसे जोड़ा गया है, उसी पृष्ठ में `ai-i18n-tools-skill.zip`, प्रत्येक कोडिंग-एजेंट स्किल डायरेक्टरी शामिल है। उस ज़िप से पहले प्रकाशित रिलीज़ में यह शामिल नहीं है, और पहली ज़िप में केवल `ai-i18n-tools/` है। `install.sh` और `install.ps1` रिपॉजिटरी रूट में रहते हैं, और ऊपर दिए गए कमांड उन्हें वहीं से डाउनलोड करते हैं। npm टारबॉल और निष्पादन योग्य में Python उदाहरण या स्किल ज़िप शामिल नहीं हैं। उदाहरण रिपॉजिटरी में रहते हैं। स्किल डायरेक्टरीज़ npm टारबॉल के अंदर हैं। [कोडिंग-एजेंट स्किल](/hi/guide/coding-agent-skill#download-the-skill-directory) देखें।

<details>
<summary> <code>ai-i18n-tools</code> निष्पादन योग्य को स्थापित करने के लिए मैन्युअल निर्देश</summary>

| प्लेटफ़ॉर्म | एसेट |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

1. [GitHub रिलीज़](https://github.com/wsj-br/ai-i18n-tools/releases) पृष्ठ से मशीन और `SHA256SUMS.txt` से मेल खाने वाली संपत्ति डाउनलोड करें।
2. चेकसम की जाँच करें। Linux पर, `grep ' ai-i18n-tools-linux-x64$' SHA256SUMS.txt | sha256sum -c -` (आपके द्वारा डाउनलोड किए गए एसेट नाम का उपयोग करें)। macOS पर, `shasum -a 256 -c -` के साथ वही लाइन। Windows पर, `(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe).Hash` और इसकी तुलना `SHA256SUMS.txt` में दिए गए हैश से करें।
3. डाउनलोड की गई फ़ाइल का नाम बदलकर `ai-i18n-tools` करें और उस निर्देशिका को `PATH` पर रखें।

Linux और macOS, उदाहरण के तौर पर Linux x64 एसेट का उपयोग करते हुए (आपके द्वारा डाउनलोड किए गए एसेट को बदलें):

```bash
mkdir -p "$HOME/.local/bin"
mv ai-i18n-tools-linux-x64 "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

यदि `$HOME/.local/bin` पहले से `PATH` पर नहीं है, तो इसे शेल प्रोफ़ाइल (`.bashrc`, `.bash_profile`, `.profile`, या `.zshrc`) में जोड़ें और एक नया टर्मिनल खोलें:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell), `ai-i18n-tools-win-x64.exe` का नाम बदलकर `ai-i18n-tools.exe` करना:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\bin" | Out-Null
Move-Item -Force .\ai-i18n-tools-win-x64.exe "$env:USERPROFILE\.local\bin\ai-i18n-tools.exe"
$installDir = "$env:USERPROFILE\.local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ([string]::IsNullOrEmpty($userPath)) {
  [Environment]::SetEnvironmentVariable("Path", $installDir, "User")
} elseif ($userPath -notlike "*${installDir}*") {
  [Environment]::SetEnvironmentVariable("Path", "$installDir;$userPath", "User")
}
```

एक नया टर्मिनल खोलें और `ai-i18n-tools --version` चलाएँ। कमांड का नाम हर प्लेटफ़ॉर्म पर `ai-i18n-tools` है।

</details>

सक्रिय प्रदाता के लिए API कुंजी को npm इंस्टॉल के समान तरीके से सेट करें (नीचे देखें)। फिर:

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools sync
```

`init` का उपयोग केवल एक नए कॉन्फ़िगरेशन के लिए करें: यह चयनित कॉन्फ़िग फ़ाइल को अधिलेखित कर देता है। मौजूदा प्रोजेक्ट्स के लिए, इसके बजाय कॉन्फ़िग को संपादित करें। `sync` UI एक्सट्रैक्शन सहित सभी कॉन्फ़िगर किए गए/सक्षम अनुवाद पाइपलाइनों को संभालता है।

वॉकथ्रू: [Add i18n to a Python app](/hi/guide/add-i18n-to-python)। कमांड संदर्भ: [suggest-models](/hi/reference/cli-commands/models#suggest-models)।

<a id="set-the-api-key"></a>
### API कुंजी सेट करें

अनुवाद कमांड (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) के लिए `ai-i18n-tools.config.json` में प्रोवाइडर कॉन्फ़िगरेशन और सक्रिय प्रोवाइडर के लिए एक API कुंजी की आवश्यकता होती है। उस प्रीसेट को स्कैफ़ोल्ड करने के लिए `ai-i18n-tools init -P <provider>` चलाएँ। प्रोवाइडर प्रीसेट और API कुंजियाँ: [LLM प्रोवाइडर](/hi/guide/providers-and-models)। `init` से मॉडल सूची एक शुरुआती बिंदु है। इसे [AI मॉडल](/hi/guide/ai-models) से `suggest-models` या डैशबोर्ड **मॉडल** टैब से बदलें। Ollama एकमात्र बिल्ट-इन प्रीसेट है जिसे किसी API कुंजी की आवश्यकता नहीं है।

उस कुंजी को सेट करें जो उस प्रदाता से मेल खाती है जिसे आप `init` को पास करते हैं ([प्रीसेट तालिका](/hi/guide/providers-and-models#built-in-providers) देखें):

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

<a id="using-the-cli"></a>
### CLI का उपयोग करना

अपने प्रोजेक्ट में `ai-i18n-tools` को एक डिपेंडेंसी या devDependency के रूप में स्थापित करें (इस पृष्ठ के शीर्ष पर देखें)। यदि ऐप कोड `ai-i18n-tools/runtime` को इम्पोर्ट करता है, तो इसे प्रोडक्शन रनटाइम/बिल्ड वातावरण में उपलब्ध रखें; एक वैश्विक CLI या स्टैंडअलोन बाइनरी उस इम्पोर्ट को पूरा नहीं कर सकता। पैकेज एक `bin` एंट्री घोषित करता है जिसे आपका पैकेज मैनेजर `node_modules/.bin/ai-i18n-tools` से लिंक करता है। वह शिम (स्थापित पैकेज के अंदर `bin/ai-i18n-tools.mjs`) संकलित CLI को लोड करता है।

एक इंटरैक्टिव शेल में केवल `ai-i18n-tools` कमांड टाइप करने के लिए, नीचे दिए गए विकल्पों में से किसी एक को कॉन्फ़िगर करें। सेटअप के बिना, शेल स्थानीय इंस्टॉलेशन के बाद भी बाइनरी को नहीं ढूंढ पाएगा।

direnv — प्रोजेक्ट रूट में `.envrc` में जोड़ें (bash/zsh; [direnv.net](https://direnv.net/) देखें):

```bash
PATH_add node_modules/.bin
```

`direnv allow` के बाद, जब भी आप प्रोजेक्ट में `cd` करते हैं तो केवल कमांड उपलब्ध होता है।

मैन्युअल PATH — इन्हें प्रोजेक्ट रूट से चलाएँ (वह निर्देशिका जिसमें `node_modules/.bin` शामिल है)। उप-निर्देशिकाएँ बाद में काम करती रहती हैं जब तक आप उस `PATH` प्रविष्टि को जगह पर छोड़ देते हैं; एक नेस्टेड फ़ोल्डर से निर्यात को फिर से चलाने में विफल रहता है क्योंकि `$PWD` अब प्रोजेक्ट रूट की ओर इशारा नहीं करता है।

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

ग्लोबल इंस्टॉल — CLI को एक बार स्थापित करें और इसे किसी भी निर्देशिका से इनवोक करें:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

pnpm के साथ, `pnpm setup` को एक बार प्रति मशीन (और एक नया शेल खोलें) चलाएं यदि वैश्विक कमांड गायब हैं — pnpm को `PATH` पर अपने वैश्विक बिन निर्देशिका की आवश्यकता होती है। एक वैश्विक इंस्टॉल वैश्विक पिन किए गए संस्करण का उपयोग करता है। प्रति-परियोजना संस्करण पिनिंग के लिए, direnv या मैनुअल PATH को पसंद करें ताकि `node_modules/.bin` परियोजना की निर्भरता को हल करे।

package.json स्क्रिप्ट — जब npm या pnpm एक स्क्रिप्ट चलाता है, तो यह `node_modules/.bin` को `PATH` में जोड़ता है, इसलिए शेल PATH परिवर्तनों के बिना स्क्रिप्ट के अंदर बेयर कमांड नाम काम करता है:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

फिर चलाएँ, उदाहरण के लिए `pnpm run i18n:sync`। पूर्ण अनुशंसित सेट के लिए [अनुशंसित package.json स्क्रिप्ट](/hi/guide/quick-start#recommended-packagejson-scripts) देखें।

विकल्प — यदि आप `PATH` को समायोजित नहीं करना चाहते हैं: `npx ai-i18n-tools …` (एनपीएम) या `pnpm exec ai-i18n-tools …` (पीएनपीएम)। बिना किसी `package.json` प्रविष्टि के एक बार के शून्य-इंस्टॉल के लिए: `npx ai-i18n-tools <cmd>` या `pnpm dlx ai-i18n-tools <cmd>`।

<a id="coding-agent-skill"></a>
### कोडिंग-एजेंट स्किल

npm पैकेज या स्टैंडअलोन निष्पादन योग्य को स्थापित करने से स्किल को किसी एजेंट के साथ पंजीकृत नहीं किया जाता है। इंस्टाल विधियाँ, नेटिव कैटलॉग, और जिन एजेंटों के पास कोई स्किल फ़ोल्डर नहीं है, वे [कोडिंग-एजेंट स्किल](/hi/guide/coding-agent-skill) पर हैं।

इस रिपॉजिटरी को क्लोन किए बिना, प्रत्येक स्किल डायरेक्टरी प्राप्त करें, जिनमें से प्रत्येक में `SKILL.md` वाला एक फ़ोल्डर है:

1. Node.js 22.20 या बाद का: `npx skills add wsj-br/ai-i18n-tools --all -y` उन डायरेक्टरीज़ को एजेंट के स्किल्स फ़ोल्डर में स्थापित करता है।
2. पैकेज पहले से स्थापित है: `node_modules/ai-i18n-tools/skills/.` को उस फ़ोल्डर में कॉपी करें।
3. कोई Node.js नहीं: `ai-i18n-tools --version` में संस्करण के लिए npm टारबॉल से `package/skills/` निकालें। जिस रिलीज़ से इसे जोड़ा गया है, उस GitHub रिलीज़ पर `ai-i18n-tools-skill.zip` में वही डायरेक्टरीज़ शामिल हैं। ज़िप से पहले प्रकाशित रिलीज़ में यह शामिल नहीं है। पहली ज़िप में केवल `ai-i18n-tools/` है।

कमांड और एजेंट फ़ोल्डर [कोडिंग-एजेंट स्किल](/hi/guide/coding-agent-skill#download-the-skill-directory) पर हैं।

<a id="cloned-monorepo"></a>
### क्लोन किया गया मोनोरेपो

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) के पूर्ण क्लोन से पैकेज विकसित करते समय या वर्कस्पेस उदाहरण चलाते समय:

- वर्कस्पेस उदाहरण (`examples/console-app`, `examples/nextjs-app`, और [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) में सूचीबद्ध अन्य पैकेज) — रिपॉजिटरी रूट पर `pnpm install` चलाएँ, फिर `cd examples/<name>`। उदाहरण के `pnpm run i18n:*` स्क्रिप्ट का उपयोग करें, या PATH कॉन्फ़िगर करें ([CLI का उपयोग करना](#using-the-cli) देखें) और केवल `ai-i18n-tools …` चलाएँ। वर्कस्पेस [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) आपके स्थानीय चेकआउट से `ai-i18n-tools` को लिंक करता है।
- रिपॉजिटरी रूट — pnpm रूट पैकेज के अपने `bin` को `node_modules/.bin` में लिंक नहीं करता है। इस चेकआउट का `.envrc` `bin/` को `PATH` में जोड़ता है ताकि कमिट किया गया `bin/ai-i18n-tools` रैपर (प्रकाशित `bin/ai-i18n-tools.mjs` शिम के बगल में) `direnv allow` के बाद केवल कमांड प्रदान करे। direnv के बिना, `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …`, या रूट `pnpm i18n:*` स्क्रिप्ट (या एक शेल उपनाम / `pnpm add -g .`) का उपयोग करें।
- स्टैंडअलोन फिक्स्चर (`multi-provider`, `test-markdown`) — फिक्स्चर फ़ोल्डर से, `node ../../bin/ai-i18n-tools.mjs …` का उपयोग करें।

CLI स्रोत बदलने के बाद रिपॉजिटरी रूट पर `pnpm run build` चलाएँ। बिल्ड चरणों और वैकल्पिक वैश्विक-स्थापना वर्कअराउंड के लिए [डेवलपमेंट गाइड](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) देखें।

Linux, macOS, और WSL पर, रजिस्ट्री इंस्टाल CLI स्क्रिप्ट पर निष्पादन योग्य बिट स्वचालित रूप से सेट करते हैं। Windows पर, पैकेज मैनेजर `.cmd` और `.ps1` शिम उत्पन्न करते हैं जो Node को स्पष्ट रूप से इनवोक करते हैं।

अगला: [त्वरित शुरुआत](/hi/guide/quick-start)।
