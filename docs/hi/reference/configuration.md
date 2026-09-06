<a id="configuration-reference"></a>
# कॉन्फ़िगरेशन संदर्भ

<a id="sourcelocale"></a>
### `sourceLocale`

स्रोत भाषा के लिए BCP-47 कोड (जैसे `"en-GB"`, `"en"`, `"pt-BR"`)। इस लोकेल के लिए कोई अनुवाद फ़ाइल जनरेट नहीं की जाती है — कुंजी स्ट्रिंग ही स्रोत टेक्स्ट है।

आपके रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) से निर्यात किए गए `SOURCE_LOCALE` से **मेल खाना चाहिए**।

---

<a id="targetlocales"></a>
### `targetLocales`

अनुवाद करने के लिए BCP-47 लोकेल कोड की सरणी (जैसे `["de", "fr", "es", "pt-BR"]`)।

`targetLocales` UI अनुवाद के लिए प्राथमिक लोकेल सूची है और दस्तावेज़ ब्लॉकों के लिए डिफ़ॉल्ट लोकेल सूची है। `sourceLocale` + `targetLocales` से `ui-languages.json` मैनिफ़ेस्ट बनाने के लिए `generate-ui-languages` का उपयोग करें।

---

<a id="uilanguage-optional"></a>
### `uiLanguage` (वैकल्पिक)

टूल की अपनी UI भाषा के लिए BCP-47 कोड (CLI सहायता, लॉग/सारांश, और अनुवाद डैशबोर्ड)। यह `sourceLocale` / `targetLocales` से स्वतंत्र है, और `-L` / `--ui-lang` फ़्लैग और `AI_I18N_LANG` पर्यावरण चर द्वारा ओवरराइड किया जाता है। अज्ञात मान स्रोत लोकेल (`en-GB`) में शालीनता से डिग्रेड होते हैं — कोई सख्त सत्यापन नहीं है। [टूल UI भाषा](/hi/guide/tool-ui-language) देखें।

---

<a id="languagesmanifestpath-optional"></a>
### `languagesManifestPath` (वैकल्पिक)

रूट-लेवल वैकल्पिक स्ट्रिंग (`ui` के तहत नेस्टेड नहीं)। वह पाथ जहाँ `extract` और `generate-ui-languages` `ui-languages.json` मैनिफ़ेस्ट लिखते हैं, और जहाँ CLI इसे डिस्प्ले नामों और भाषा-सूची पोस्ट-प्रोसेसिंग के लिए पढ़ता है। जब छोड़ा जाता है, तो कॉन्फ़िग लोड पर `ui.flatOutputDir/ui-languages.json` पर डिफ़ॉल्ट होता है।

इसका उपयोग तब करें जब:

- मैनिफ़ेस्ट को `ui.flatOutputDir` के बाहर रहना चाहिए (उदाहरण के लिए `src/i18n/` के तहत ऐप हेल्पर के बगल में)।
- आप [भाषा स्विचर पोस्ट-प्रोसेसिंग](#language-switcher-languagelistblock) (`languageListBlock`) चाहते हैं कि वह केवल बंडल किए गए मास्टर कैटलॉग के बजाय प्रोजेक्ट मैनिफ़ेस्ट से लोकेल लेबल बनाए।

`includeUiLanguageEnglishNames` इस फ़ाइल को **नहीं** पढ़ता है — यह बंडल किए गए मास्टर कैटलॉग का उपयोग करता है (नीचे `ui.uiExtractor` देखें)।

**लेगेसी:** कॉन्फ़िग फ़ाइल लोड करते समय रूट-लेवल `uiLanguagesPath` अभी भी स्वीकार किया जाता है और स्वचालित रूप से `languagesManifestPath` में फिर से लिखा जाता है।

---

<a id="concurrency-optional"></a>
### `concurrency` (वैकल्पिक)

एक ही समय में अनुवादित अधिकतम **लक्ष्य लोकेल** (`translate-ui`, `translate-docs`, `translate-svg`, और `sync` के अंदर के मिलान वाले चरण)। यदि छोड़ा जाता है, तो CLI UI अनुवाद के लिए **4** और दस्तावेज़ अनुवाद के लिए **3** का उपयोग करता है (बिल्ट-इन डिफ़ॉल्ट)। `-j` / `--concurrency` के साथ प्रति रन ओवरराइड करें।

---

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (वैकल्पिक)

**translate-docs**, **translate-svg**, और **translate-json** (और `sync` के अंदर के मिलान वाले चरण): प्रति फ़ाइल अधिकतम समानांतर LLM **बैच** अनुरोध (प्रत्येक बैच में कई सेगमेंट हो सकते हैं)। छोड़े जाने पर डिफ़ॉल्ट **4**। `translate-ui` द्वारा अनदेखा किया गया। `-b` / `--batch-concurrency` के साथ ओवरराइड करें।

---

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (वैकल्पिक)

`translate-docs` और `sync` के दौरान **एक ही स्थान-विशेष में** समवर्ती रूप से संसाधित की जाने वाली फ़ाइलों की अधिकतम संख्या। जब **1** से अधिक मान पर सेट किया जाता है, तो मेमोरी उपयोग को नियंत्रित करने के लिए एक सेमाफोर का उपयोग करके एक ही स्थान-विशेष के भीतर फ़ाइलों को समानांतर में संसाधित किया जाता है। छोड़े जाने पर डिफ़ॉल्ट **1** (अनुक्रमिक प्रसंस्करण)। उच्च मान I/O-बाउंड ऑपरेशनों के लिए थ्रूपुट में काफी सुधार कर सकते हैं, खासकर जब सभी सेगमेंट पहले से ही कैश किए गए हों (किसी API कॉल की आवश्यकता नहीं)।

**उदाहरण:**

```json
{
  "fileConcurrency": 4
}
```

**उपयोग का मामला:** कुल प्रसंस्करण समय को कम करने के लिए 100% कैश हिट के साथ `sync --force-update` चलाते समय इसे `2-4` पर सेट करें। कई छोटी फ़ाइलों के साथ सुधार सबसे अधिक ध्यान देने योग्य है।

---

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (वैकल्पिक)

**translate-docs**, **translate-svg**, और **translate-json** के लिए सेगमेंट बैचिंग: प्रति API अनुरोध कितने सेगमेंट, और एक वर्ण सीमा। डिफ़ॉल्ट: **20** सेगमेंट, **4096** वर्ण (छोड़े जाने पर)।

---

<a id="provider-and-providers"></a>
### `provider` और `providers`

`provider` (शीर्ष-स्तरीय, वैकल्पिक) `providers` से सक्रिय प्रदाता कुंजी का चयन करता है। जब ठीक एक प्रदाता कॉन्फ़िगर किया गया हो तो यह वैकल्पिक होता है; जब एक से अधिक कॉन्फ़िगर किए गए हों तो यह आवश्यक होता है।

`providers` (शीर्ष-स्तरीय) एक प्रदाता कुंजी को उसके ब्लॉक में मैप करता है। अंतर्निहित कुंजियों (नीचे दी गई प्रीसेट तालिका देखें) को केवल `translationModels` की आवश्यकता होती है; कोई अन्य कुंजी एक कस्टम OpenAI-संगत एंडपॉइंट को परिभाषित करती है और `baseUrl` (प्लस `apiKeyEnv` जब तक एंडपॉइंट को किसी कुंजी की आवश्यकता न हो) की आवश्यकता होती है।

प्रत्येक `providers.<name>` ब्लॉक स्वीकार करता है:

- `translationModels`
  मॉडल ID की पसंदीदा क्रमबद्ध सूची (सादे अपस्ट्रीम ID, कोई `provider/` उपसर्ग नहीं; OpenRouter ID अपना मूल `vendor/model` स्वरूप बनाए रखते हैं)। पहला पहले आज़माया जाता है; बाद की प्रविष्टियाँ त्रुटि पर फ़ॉलबैक होती हैं। यह हर पाइपलाइन के लिए वैश्विक डिफ़ॉल्ट श्रृंखला है जब कोई अधिक विशिष्ट टियर लागू नहीं होता है।
- `uiModels` (वैकल्पिक)
  `translate-ui`, बहुवचन जनरेशन (चरण 0 और पास B), और `proofread-ui` के लिए क्रमबद्ध UI-केवल मॉडल सूची। लक्ष्य स्थान-विशेष के लिए किसी भी मिलान `localeModels` प्रविष्टि के बाद, `translationModels` से पहले आज़माया जाता है।
- `localeModels` (वैकल्पिक)
  **सभी** अनुवाद पाइपलाइनों के लिए प्रति-स्थान-विशेष ओवरराइड। `{ "locale": "<BCP-47>", "models": ["…"] }` ऑब्जेक्ट्स का सरणी। स्थान-विशेष टैग केस-असंवेदनशील रूप से मेल खाते हैं (`pt-br` = `pt-BR`)। प्रत्येक स्थान-विशेष की सूची पहले केवल उस स्थान-विशेष के लिए आज़माई जाती है, फिर पाइपलाइन-विशिष्ट टियर (UI के लिए `uiModels`) और `translationModels`। डुप्लिकेट सामान्यीकृत स्थान-विशेष कुंजियों को कॉन्फ़िग लोड पर अस्वीकार कर दिया जाता है।
- `baseUrl`
  OpenAI-संगत आधार URL। प्रीसेट आधार URL को ओवरराइड करता है; गैर-प्रीसेट प्रदाता के लिए आवश्यक है।
- `apiKeyEnv`
  API कुंजी रखने वाला पर्यावरण चर। प्रीसेट env var को ओवरराइड करता है।
- `headers`
  इस प्रदाता को हर अनुरोध के साथ भेजे गए अतिरिक्त HTTP हेडर।
- `maxTokens`
  प्रति अनुरोध अधिकतम पूर्णता टोकन। डिफ़ॉल्ट: `8192`।
- `temperature`
  सैंपलिंग तापमान। डिफ़ॉल्ट: `0.2`।
- `requestTimeoutMs`
  प्रत्येक अनुरोध के लिए प्रतीक्षा करने का अधिकतम समय मिलीसेकंड में। डिफ़ॉल्ट: `30000` (30 सेकंड)।

अंतर्निहित प्रदाता प्रीसेट (कुंजी — आधार URL — API-कुंजी env var):

| प्रदाता | आधार URL | API-कुंजी env var |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai`     | `https://api.openai.com/v1`                               | `OPENAI_API_KEY`     |
| `anthropic`  | `https://api.anthropic.com/v1`                            | `ANTHROPIC_API_KEY`  |
| `gemini`     | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY`     |
| `deepseek`   | `https://api.deepseek.com`                                | `DEEPSEEK_API_KEY`   |
| `cerebras`   | `https://api.cerebras.ai/v1`                              | `CEREBRAS_API_KEY`   |
| `groq`       | `https://api.groq.com/openai/v1`                          | `GROQ_API_KEY`       |
| `mistral`    | `https://api.mistral.ai/v1`                               | `MISTRAL_API_KEY`    |
| `xai`        | `https://api.x.ai/v1`                                     | `XAI_API_KEY`        |
| `nvidia`     | `https://integrate.api.nvidia.com/v1`                     | `NVIDIA_API_KEY`     |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun`     | `https://api.apikey.fun/v1`                               | `APIFUN_API_KEY`     |
| `ollama`     | `http://localhost:11434/v1`                               | (कोई नहीं)               |

एक लेगेसी शीर्ष-स्तरीय `openrouter` ब्लॉक (`baseUrl`, `translationModels`, `defaultModel`, `fallbackModel`, `maxTokens`, `temperature`, `requestTimeoutMs` के साथ) अभी भी स्वीकार किया जाता है और लोड पर `providers.openrouter` (`provider: "openrouter"` के साथ) में स्वतः माइग्रेट हो जाता है; `defaultModel` / `fallbackModel` `translationModels` में फोल्ड हो जाते हैं।

एक चलाने योग्य उदाहरण के लिए जो एक कॉन्फ़िग में कई प्रदाताओं को कॉन्फ़िगर करता है और `-P` के साथ उनके बीच स्विच करता है, [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/) (`openai`, `anthropic`, `nvidia`, और `deepseek` एक ही दस्तावेज़ पर) देखें।

**कई मॉडल का उपयोग क्यों करें:** विभिन्न प्रदाताओं और मॉडलों की लागत अलग-अलग होती है और भाषाओं और स्थानों में गुणवत्ता के विभिन्न स्तर प्रदान करते हैं। `translationModels` को **एक क्रमबद्ध फ़ॉलबैक श्रृंखला के रूप में** (एकल मॉडल के बजाय) कॉन्फ़िगर करें ताकि यदि कोई अनुरोध विफल हो जाए तो CLI अगले मॉडल का प्रयास कर सके।

नीचे दी गई सूची को एक **आधार रेखा** के रूप में मानें जिसे आप विस्तारित कर सकते हैं: यदि किसी विशिष्ट स्थान-विशेष के लिए अनुवाद खराब या असफल है, तो शोध करें कि कौन से मॉडल उस भाषा या स्क्रिप्ट को प्रभावी ढंग से समर्थन करते हैं (ऑनलाइन संसाधनों या अपने प्रदाता के दस्तावेज़ों का संदर्भ लें), और उन मॉडल ID को आगे के विकल्पों के रूप में जोड़ें।

ये मॉडल ID `ai-i18n-tools init [-P <provider>]` से मेल खाते हैं जब `-P openrouter` (डिफ़ॉल्ट)। अन्य प्रीसेट `init -P <provider>` से मूल मॉडल ID प्राप्त करते हैं — [अंतर्निहित प्रदाता](/hi/guide/providers-and-models#built-in-providers) देखें।

इस सूची को 36 लक्षित लोकेल के साथ एक बड़े दस्तावेज़ीकरण प्रोजेक्ट में **व्यापक लोकेल कवरेज के लिए परखा गया** था; यह एक व्यावहारिक डिफ़ॉल्ट के रूप में कार्य करता है, लेकिन हर लोकेल के लिए अच्छा प्रदर्शन करने की गारंटी नहीं है।

उदाहरण `translationModels` (`ai-i18n-tools init [-P <provider>]` के समान डिफ़ॉल्ट):

<details>
<summary>डिफ़ॉल्ट ट्रांसलेशनमॉडल फ़ॉलबैक सूची</summary>

```json
"translationModels": [
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.3-70b-instruct",
  "openai/gpt-4o-mini",
  "google/gemma-4-26b-a4b-it",
  "~anthropic/claude-haiku-latest",
  "z-ai/glm-5.2",
  "google/gemini-3.5-flash",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

**अनुशंसित `uiModels`:** UI स्ट्रिंग छोटी होती हैं लेकिन अत्यधिक दृश्यमान होती हैं — एक प्रीमियम मॉडल अक्सर टोन, बहुवचन और संगति में सुधार करता है। वैकल्पिक `uiModels` को किसी भी मिलान वाले `localeModels` प्रविष्टि के बाद और `translationModels` से पहले आज़माया जाता है (ऊपर फ़ील्ड सूची देखें)। उदाहरण:

<details>
<summary>UI अनुवाद के लिए अनुशंसित uiModels</summary>

```json
"uiModels": [
  "~anthropic/claude-sonnet-latest",
  "z-ai/glm-5.2"
]
```

</details>

**एशियाई भाषाओं के लिए अनुशंसित `localeModels`:** जापानी, कोरियाई और चीनी लोकेल अक्सर उन स्क्रिप्ट के लिए ट्यून किए गए मॉडल से लाभान्वित होते हैं। प्रति-लोकेल ओवरराइड जोड़ें जिन्हें लक्षित लोकेल के मिलान होने पर **पहले** (`uiModels` / `translationModels` से पहले) आज़माया जाता है:

<details>
<summary>जा, को, झ-हंस, झ-हंत के लिए अनुशंसित लोकेलमॉडल</summary>

```json
"localeModels": [
  { "locale": "ja",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
  { "locale": "ko",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
  { "locale": "zh-Hans", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
  { "locale": "zh-Hant", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] }
]
```

</details>

<br />

अपने वातावरण या `.env` फ़ाइल में सक्रिय प्रदाता का API-कुंजी env var (देखें [प्रीसेट तालिका](/hi/guide/providers-and-models#built-in-providers)) सेट करें।

मॉडल सूचियों को बदलने से पहले, `ai-i18n-tools check-models` चलाएँ। किसी भी प्रदाता के लिए यह प्रत्येक कॉन्फ़िगर किए गए मॉडल आईडी (`translationModels`, `uiModels`, और सभी `localeModels` प्रविष्टियाँ) को उस प्रदाता की लाइव मॉडल सूची (`GET /models`) के विरुद्ध सत्यापित करता है, उन आईडी की रिपोर्ट करता है जो गायब हैं या `expiration_date` से अधिक हैं, वैध मॉडल की सूची बनाता है, और जब कोई कॉन्फ़िगर किया गया आईडी अमान्य होता है तो गैर-शून्य से बाहर निकलता है। जब प्रदाता मूल्य निर्धारण लौटाता है (जैसे OpenRouter) तो यह अनुमानित इनपुट/आउटपुट मूल्य निर्धारण (प्रति 1M टोकन USD) भी दिखाता है।

वास्तविक अनुवाद कार्य पर कॉन्फ़िगर किए गए मॉडल की तुलना करने के लिए, `ai-i18n-tools bench-models` चलाएँ। यह `translationModels`, `uiModels`, और `localeModels` से प्रत्येक अद्वितीय मॉडल आईडी को बेंचमार्क करता है, प्रत्येक के माध्यम से एक नमूने का अनुवाद करके (समानांतर में, `concurrency` द्वारा सीमित) और प्रति-मॉडल इनपुट/आउटपुट टोकन, वॉल-क्लॉक समय, और USD लागत प्रिंट करता है, ताकि आप मॉडल सूचियों पर निर्णय लेने से पहले गति बनाम मूल्य का वजन कर सकें।

---

<a id="features"></a>
### `features`

| फ़ील्ड                | पाइपलाइन | विवरण                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | `t("…")` / `i18n.t("…")` को `strings.json` में निकालें, फिर प्रविष्टियों का अनुवाद करें और प्रति-लोकेल फ़्लैट JSON लिखें (निष्कर्षण स्वचालित रूप से चलता है; केवल कैटलॉग को ताज़ा करने के लिए स्टैंडअलोन `extract` का उपयोग करें)। |
| `translateDocs`      | 2        | `.md` / `.mdx` / `.astro` पृष्ठों का अनुवाद करें; जब `docs[].docusaurusCatalogDir` सेट हो तो Docusaurus शेल JSON; जब कॉन्फ़िगर किया गया हो तो Nextra `_meta` / डिक्शनरी; जब `docsOutput.vitepressThemeCatalog` सेट हो तो VitePress थीम; जब `docsOutput.style` `"fumadocs"` हो तो Fumadocs `meta.json` / UI कैटलॉग। |
| `translateJson`      | 3        | `json[]` (`translate-json`) के तहत मनमाना नेस्टेड JSON।                                                                                                           |
| `translateSVG`       | —        | `.svg` फ़ाइलों का अनुवाद करें (शीर्ष-स्तरीय `svg` ब्लॉक की आवश्यकता है)।                                                                                                       |

जब `features.translateSVG` सत्य हो और एक शीर्ष-स्तरीय `svg` ब्लॉक कॉन्फ़िगर किया गया हो तो `translate-svg` के साथ SVG फ़ाइलों का **अनुवाद करें**। `sync` कमांड उस चरण को चलाता है जब दोनों सेट होते हैं (जब तक कि `--no-svg` न हो)।

---

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  निर्देशिकाएँ या ग्लोब पैटर्न (cwd के सापेक्ष) `t("…")` कॉल के लिए स्कैन किए गए। `src/` या `["src/**/*.ts"]` जैसे पैटर्न का समर्थन करता है।
- `stringsJson`  
  मास्टर कैटलॉग फ़ाइल का पथ। `extract` द्वारा अपडेट किया गया।
- `flatOutputDir`  
  निर्देशिका जहाँ प्रति-लोकेल JSON फ़ाइलें लिखी जाती हैं (`de.json`, आदि)।
- `uiExtractor.funcNames` (या लेगेसी `reactExtractor.funcNames`)  
  स्कैन करने के लिए अतिरिक्त फ़ंक्शन नाम (डिफ़ॉल्ट: `["t", "i18n.t"]`)।
- `uiExtractor.extensions` (या लेगेसी `reactExtractor.extensions`)  
  शामिल करने के लिए फ़ाइल एक्सटेंशन (डिफ़ॉल्ट: `[".js", ".jsx", ".ts", ".tsx"]`)। Astro फ्रंटमैटर और टेम्प्लेट एक्सप्रेशन के लिए `.astro` जोड़ें।
- `uiExtractor.includePackageDescription` (या लेगेसी `reactExtractor.includePackageDescription`)  
  जब `true` (डिफ़ॉल्ट), `extract` में `package.json` `description` भी शामिल होता है, जब मौजूद हो, तो एक UI स्ट्रिंग के रूप में।
- `uiExtractor.packageJsonPath` (या लेगेसी `reactExtractor.packageJsonPath`)  
  उस वैकल्पिक विवरण निष्कर्षण के लिए उपयोग की जाने वाली `package.json` फ़ाइल का कस्टम पथ।
- `uiExtractor.includeUiLanguageEnglishNames` (या लेगेसी `reactExtractor.includeUiLanguageEnglishNames`)

जब `true` (डिफ़ॉल्ट `false`), `extract` बंडल किए गए ui-भाषाओं के मास्टर कैटलॉग (`sourceLocale` + `targetLocales` से निर्मित) से प्रत्येक `englishName` को `strings.json` में भी जोड़ता है, जब स्रोत स्कैन से पहले से मौजूद न हो (समान हैश कुंजियाँ)। `languagesManifestPath` नहीं पढ़ता है।

---

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite कैश डायरेक्टरी (सभी `docs` ब्लॉक द्वारा साझा)। डिफ़ॉल्ट `.translation-cache`। रन के दौरान पुन: उपयोग करें। यदि आप एक कस्टम डॉक अनुवाद कैश से माइग्रेट कर रहे हैं, तो इसे संग्रहीत या हटा दें — `cacheDir` अपना स्वयं का SQLite डेटाबेस बनाता है और अन्य स्कीमा के साथ संगत नहीं है।

<a id="best-practice-for-git-exclusions"></a>
#### गिट बहिष्करण के लिए सर्वोत्तम अभ्यास:

- अस्थायी कैश कलाकृतियों को कमिट करने से रोकने के लिए अनुवाद कैश फ़ोल्डर की सामग्री को बाहर करें (उदाहरण के लिए, `.gitignore` या `.git/info/exclude` का उपयोग करके)।
- `cache.db` को बनाए रखें (इसे नियमित रूप से न हटाएँ), क्योंकि SQLite कैश को संरक्षित करने से अपरिवर्तित खंडों का पुन: अनुवाद रोका जा सकता है। यह `ai-i18n-tools` का उपयोग करने वाले सॉफ़्टवेयर को अपडेट या संशोधित करते समय रनटाइम और API दोनों लागतों को बचाता है।
- बैकअप और डीबग-संबंधित फ़ाइलों को कमिट करने से बचने के लिए अस्थायी और लॉग फ़ाइलों को बाहर करें।

<br/>

**उदाहरण:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

---

<a id="docs"></a>
### `docs`

डॉक्यूमेंटेशन पाइपलाइन ब्लॉक का ऐरे। `translate-docs` और `sync` का डॉक्स चरण प्रत्येक ब्लॉक को क्रम में **प्रोसेस करता है**। लेगेसी कुंजियाँ लोड समय पर अभी भी स्वीकार की जाती हैं और जब कॉन्फ़िग फ़ाइल लिखने योग्य होती है तो फिर से लिखी जाती हैं; नई कॉन्फ़िग में वर्तमान नामों को प्राथमिकता दें।

| लेगेसी कुंजी | वर्तमान कुंजी / व्यवहार |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| शीर्ष-स्तरीय `openrouter` | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | हटा दिया गया (`docs[].docusaurusCatalogDir` या `json[]` का उपयोग करें) |
| `features.extractUIStrings` | हटा दिया गया (`extract` UI अनुवाद से पहले चलता है) |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor` (उपनाम अभी भी स्वीकार किया गया) |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

**सामग्री स्रोत**

- `description`
इस ब्लॉक के लिए वैकल्पिक मानव-पठनीय नोट (अनुवाद के लिए उपयोग नहीं किया गया)। सेट होने पर `translate-docs` `🌐` हेडलाइन में उपसर्ग; `status` अनुभाग शीर्षकों में भी दिखाया गया है।
- `contentPaths`
मार्कडाउन/MDX पेज बॉडी और `.astro` टेम्प्लेट का अनुवाद करने के लिए (`translate-docs` `.md`, `.mdx`, और `.astro` के लिए इन्हें स्कैन करता है)। **डायरेक्टरी पाथ या ग्लोब पैटर्न** (जैसे `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`) का समर्थन करता है। यहीं से स्थानीयकृत दस्तावेज़ गद्य आता है।
- `sourceFiles`
लोड पर `contentPaths` में मर्ज किया गया वैकल्पिक उपनाम।
- `targetLocales`
केवल इस ब्लॉक के लिए लोकेल का वैकल्पिक उपसमूह (अन्यथा रूट `targetLocales`)। प्रभावी दस्तावेज़ लोकेल ब्लॉक में संघ हैं।
- `docusaurusCatalogDir`
वैकल्पिक। इस ब्लॉक के लिए Docusaurus JSON लेबल कैटलॉग के लिए स्रोत निर्देशिका (जैसे `"i18n/en"` से `docusaurus write-translations`)। पेज बॉडी हमेशा `contentPaths` से आती हैं; `docusaurusCatalogDir` केवल शेल/UI JSON प्रदान करता है, MDX नहीं।
- `nextraMetaGlob`
`docsRoot` के तहत Nextra `_meta.ts` / `_meta.tsx` / `_meta.js` के लिए वैकल्पिक ग्लोब। जब `docsOutput.style` `"nextra"` होता है और इसे छोड़ दिया जाता है, तो `docsRoot` के तहत सभी `_meta` फाइलें स्वचालित रूप से एकत्र की जाती हैं।
- `nextraMetaTranslatableKeys`
वैकल्पिक संपत्ति नाम जिनके स्ट्रिंग मान Nextra `_meta` ऑब्जेक्ट में अनुवादित होते हैं (डिफ़ॉल्ट: `title`, `display`, `breadcrumb`)।
- `nextraDictionaryPath`
वैकल्पिक अंग्रेजी Nextra थीम डिक्शनरी मॉड्यूल (जैसे `"app/_dictionaries/en.ts"`)। `translate-docs` के दौरान `{dir}/{locale}.ts` में अनुवादित।
- `nextraDictionaryOutputTemplate`
लोकेल डिक्शनरी मॉड्यूल के लिए वैकल्पिक आउटपुट टेम्प्लेट (डिफ़ॉल्ट: डिक्शनरी डायरेक्टरी के सापेक्ष `{dir}/{locale}.ts`)।

**आउटपुट लेआउट**

- `outputDir`
इस ब्लॉक के लिए अनुवादित आउटपुट के लिए रूट डायरेक्टरी।
- `docsOutput.style`
`"nested"` (डिफ़ॉल्ट), `"flat"`, `"doc-system"`, या उपनाम `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"`।
- `docsOutput.localeSubpath`
`doc-system` के लिए `{locale}/` और `{relativeToDocsRoot}` के बीच पाथ सेगमेंट (`style: "doc-system"` का सीधे उपयोग करते समय आवश्यक; उपनाम का उपयोग करते समय प्रीसेट)। Starlight-शैली लोकेल फ़ोल्डरों के लिए `""` का उपयोग करें।
- `docsOutput.docsRoot`
Docusaurus लेआउट के लिए स्रोत डॉक्स रूट (जैसे `"docs"`)। छोड़े जाने पर डिफ़ॉल्ट `"docs"`।
- `docsOutput.pathTemplate`
कस्टम मार्कडाउन आउटपुट पाथ। प्लेसहोल्डर: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>।
- `docsOutput.jsonPathTemplate`
लेबल फ़ाइलों के लिए कस्टम JSON आउटपुट पाथ। `pathTemplate` के समान प्लेसहोल्डर का समर्थन करता है।
- `docsOutput.localePathLowercase`
जब `true`, बिल्ट-इन आउटपुट लेआउट (`nested`, `flat`, `doc-system` बिना `pathTemplate`) पाथ में लोअरकेस लोकेल सेगमेंट का उपयोग करते हैं। डिफ़ॉल्ट `false`; `astro-starlight` और `doc-system` खाली `localeSubpath` के साथ कॉन्फ़िग लोड पर `true` पर डिफ़ॉल्ट होते हैं।
- `docsOutput.flatPreserveRelativeDir`
जब `docsOutput.style = "flat"`, स्रोत उपनिर्देशिकाओं को रखें ताकि समान बेसनाम वाली फ़ाइलें टकरा न जाएं। डिफ़ॉल्ट `false`।
- `docsOutput.rewriteRelativeLinks`
अनुवाद के बाद सापेक्ष लिंक को फिर से लिखें (जब `docsOutput.style = "flat"` और कोई कस्टम `pathTemplate` न हो तो स्वतः सक्षम)।
- `docsOutput.linkRewriteDocsRoot`
फ्लैट-लिंक रीराइट प्रीफिक्स की गणना करते समय उपयोग किया जाने वाला रेपो रूट। आमतौर पर इसे `"."` के रूप में छोड़ दें जब तक कि आपके अनुवादित डॉक्स किसी भिन्न प्रोजेक्ट रूट के तहत न हों।
- `docsOutput.rewriteVitepressLinks`
जब `true`, अनुवाद के बाद VitePress लिंक नॉर्मलाइज़र चलाएं। जब `docsOutput.style` `"vitepress"` हो तो डिफ़ॉल्ट रूप से सक्षम होता है। किसी भी `doc-system` लेआउट के साथ उपयोग करें जहां लोकेल फ़ोल्डर `docsRoot` के तहत अंग्रेजी के बगल में बैठते हैं। README-शैली `docs/guide/…` पाथ को साइट रूट (`/guide/…`) और लोकेल-सापेक्ष `../guide/…` लिंक पर फिर से लिखता है। VitePress ट्री (`LICENSE`, `examples/`) के बाहर रेपो फ़ाइलों के लिंक के लिए, अंग्रेजी स्रोत में पूर्ण URL का उपयोग करें — [VitePress एकीकरण — README को डॉक्स होमपेज के रूप में](/hi/guide/integrations/vitepress#readme-as-homepage) देखें।
- `docsOutput.rewriteNextraLinks`
जब `true`, अनुवाद के बाद Nextra लिंक नॉर्मलाइज़र चलाएं। जब `docsOutput.style` `"nextra"` हो तो डिफ़ॉल्ट रूप से सक्षम होता है। Next.js `i18n` के लिए `content/en/…` और सापेक्ष `.mdx` पाथ को लोकेल-न्यूट्रल साइट रूट (`/guide/…`) पर फिर से लिखता है। [Nextra एकीकरण — लिंक कन्वेंशन](/hi/guide/integrations/nextra#link-conventions) देखें।
- `docsOutput.fumadocsParser`
`"dot"` (डिफ़ॉल्ट) या `"dir"`। डॉट अंग्रेजी स्रोतों के बगल में `stem.{locale}.mdx` लिखता है; dir नेक्स्ट्रा जैसे लोकेल फ़ोल्डर लिखता है। [फ्यूमाडॉक्स एकीकरण — पेज लेआउट](/hi/guide/integrations/fumadocs#page-layout) देखें।
- `docsOutput.rewriteFumadocsLinks`
जब `true` हो, तो अनुवाद के बाद फ्यूमाडॉक्स लिंक नॉर्मलाइज़र चलाएँ। जब `docsOutput.style` `"fumadocs"` हो तो डिफ़ॉल्ट रूप से सक्षम होता है। सामग्री पथों और सापेक्ष `.mdx` लिंक को `/docs/…` मार्गों पर फिर से लिखता है।
- `docsOutput.fumadocsUiCatalog`
वैकल्पिक। फ्यूमाडॉक्स UI ओवरराइड कैटलॉग बूटस्ट्रैप + `translate-docs` के अंदर अनुवाद। फ़ील्ड: `sourcePath` (जैसे `lib/layout.shared.ts`), `catalogPath` (जनरेटेड अंग्रेजी JSON), वैकल्पिक `outputPathTemplate` (डिफ़ॉल्ट: `ui.{locale}.json` `catalogPath` के बगल में)।
- `docs[].fumadocsMetaGlob`
जब `docsOutput.style` `"fumadocs"` हो तो `meta.json` संग्रह के लिए वैकल्पिक ग्लोब। डिफ़ॉल्ट: `docsOutput.docsRoot` के तहत पुनरावर्ती `meta.json`।
- `docs[].fumadocsMetaTranslatableKeys`
प्रॉपर्टी नाम जिनके स्ट्रिंग मान फ्यूमाडॉक्स `meta.json` में अनुवादित होते हैं (डिफ़ॉल्ट: `title`, `description`)।
- `docsOutput.vitepressThemeCatalog`
वैकल्पिक। VitePress थीम/नेव/साइडबार कैटलॉग बूटस्ट्रैप + `translate-docs` के अंदर अनुवाद। फ़ील्ड: `configPath` (थीम स्ट्रिंग्स के साथ VitePress कॉन्फ़िग), `catalogPath` (जनरेटेड अंग्रेजी नेस्टेड JSON), वैकल्पिक `outputPathTemplate` (डिफ़ॉल्ट: `theme.{locale}.json` `catalogPath` के बगल में)।

**पोस्ट-प्रोसेसिंग**

- `docsOutput.postProcessing`
अनुवादित **मार्कडाउन बॉडी** पर वैकल्पिक परिवर्तन (YAML कुंजियाँ और गैर-गद्य फ्रंट मैटर मान संरक्षित हैं)। सेगमेंट पुनर्संयोजन और लिंक पुनर्लेखन (फ्लैट या VitePress) के बाद, और `addFrontmatter` से पहले चलता है।
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` की क्रमबद्ध सूची। `search` एक रेगेक्स पैटर्न है (साधारण स्ट्रिंग फ़्लैग `g` का उपयोग करती है, या `/pattern/flags`)। `replace` `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` जैसे प्लेसहोल्डर का समर्थन करता है।
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — स्रोत और अनुवादित मार्कडाउन में एक बाउंडेड "अन्य भाषाओं में पढ़ें" लिंक पंक्ति को पुनर्जीवित करता है। जब `label: "local"` हो तो एंडोनिम लेबल के लिए `languagesManifestPath` (या `ui.flatOutputDir/ui-languages.json` पर एक मैनिफेस्ट) की आवश्यकता होती है।

**व्यवहार और मेटाडेटा**

- `translateFrontmatterFields`
`docsOutput` के समान स्तर (प्रति `docs[]` ब्लॉक)। डिफ़ॉल्ट `true`: Starlight/Docusaurus के लिए उपयोगकर्ता-सामने वाले YAML गद्य का अनुवाद करें (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next` लेबल)। पूरे फ्रंट मैटर ब्लॉक को अपरिवर्तित रखने के लिए `false` सेट करें; विशिष्ट डॉट-पाथ तक सीमित करने के लिए एक स्ट्रिंग सरणी पास करें।
- `segmentSplitting`
`docsOutput` के समान स्तर (प्रति `docs[]` ब्लॉक)। `translate-docs` निष्कर्षण के लिए वैकल्पिक महीन-दानेदार खंड: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`। जब `enabled` `true` हो (जब `segmentSplitting` छोड़ा गया हो तो डिफ़ॉल्ट), सघन पैराग्राफ, GFM पाइप टेबल (पहला खंड हेडर, सेपरेटर और पहली डेटा पंक्ति शामिल करता है), और लंबी सूचियाँ विभाजित होती हैं; उप-भाग एकल नई लाइनों (`tightJoinPrevious`) के साथ फिर से जुड़ते हैं। केवल खाली-लाइन-सीमांकित बॉडी ब्लॉक प्रति एक खंड का उपयोग करने के लिए `"enabled": false` सेट करें। जब `qualityRetrySplit` `true` हो (डिफ़ॉल्ट), तो मार्कडाउन खंड जो सभी मॉडल समाप्त होने के बाद AST सत्यापन में विफल रहते हैं, धीरे-धीरे विभाजित होते हैं और पहले मॉडल से पुनः प्रयास किए जाते हैं; `maxQualityRetrySplitDepth` (डिफ़ॉल्ट `3`) पुनरावर्ती विभाजन को सीमित करता है।
- `warnMarkdownSourceIssues`
जब `true` (जब छोड़ा गया हो तो डिफ़ॉल्ट), प्रत्येक `translate-docs` रन जोखिम भरे सीमांकक / बिना बंद किए गए इनलाइन कोड के लिए मार्कडाउन खंडों को फिर से स्कैन करता है, टर्मिनल चेतावनियाँ प्रिंट करता है, और उस फ़ाइल के कैश फ़ाइलपाथ के लिए `markdown_source_issues` पंक्तियों को बदलता है। इस ब्लॉक के लिए चेतावनियों और SQLite अपडेट को छोड़ने के लिए `false` सेट करें।
- `addFrontmatter`
जब `true` (जब छोड़ा गया हो तो डिफ़ॉल्ट), अनुवादित मार्कडाउन फ़ाइलों में YAML कुंजियाँ शामिल होती हैं: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, और जब कम से कम एक खंड में मॉडल मेटाडेटा होता है, `translation_models` (सक्रिय प्रदाता से मॉडल आईडी की क्रमबद्ध सूची)। छोड़ने के लिए `false` पर सेट करें।
- `emphasisPlaceholders`
प्रति `docs[]` ब्लॉक। जब `true` हो, तो अनुवाद से पहले मार्कडाउन जोर सीमांकक को प्लेसहोल्डर के रूप में मास्क करें। CJK लोकेल (`zh`, `ja`, `ko`) और `rtlLocales` में सूचीबद्ध लोकेल के लिए डिफ़ॉल्ट रूप से `true` होता है; अन्यथा डिफ़ॉल्ट रूप से `false` होता है। CLI `--emphasis-placeholders` / `--no-emphasis-placeholders` के माध्यम से ओवरराइड किया जा सकता है।
- `rtlLocales`
जोर-प्लेसहोल्डर डिफ़ॉल्ट के लिए RTL के रूप में माने जाने वाले BCP-47 कोड की वैकल्पिक सरणी (अंतर्निहित RTL पहचान के साथ विलय)।

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
वैकल्पिक। अतिरिक्त JSX/HTML विशेषता नाम जिनके **उद्धृत स्ट्रिंग मान** अनुवादक को नहीं भेजे जाने चाहिए। बिल्ट-इन डिफ़ॉल्ट (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, अधिकांश `aria-*`, आदि) के साथ मर्ज किया गया। केस-असंवेदनशील। इस पर लागू होता है:

- `.astro` पार्स-और-बदलें निष्कर्षण (स्थिर HTML टैग और `{expression}` ब्लॉक के अंदर `attr=` के बाद स्ट्रिंग लिटरल)।
  - मार्कडाउन/एस्ट्रो सेगमेंट अनुवाद के दौरान MDX प्लेसहोल्डर निष्कर्षण (पूंजीकृत JSX टैग पर `label`, `tooltip`, और `aria-label`, साथ ही लागू होने पर `TabItem` `value`)।

उदाहरण: `"protectAttributes": ["variant", "size"]` `{items.map(...)}` के अंदर `variant="primary"` को लोकेल में अपरिवर्तित रखता है।

आप सामान्य रूप से अनुवाद योग्य विशेषताओं (उदाहरण के लिए `"title"` या `"aria-label"`) को भी सूचीबद्ध कर सकते हैं जब आप उन मानों को अंग्रेजी से शब्दशः कॉपी करना चाहते हैं।

- `protectKeys`
वैकल्पिक। अतिरिक्त **ऑब्जेक्ट प्रॉपर्टी नाम** जिनके उद्धृत स्ट्रिंग मानों का टेम्पलेट `{expression}` ब्लॉक और MDX ऑब्जेक्ट लिटरल (उदाहरण के लिए `<Tabs values={[ … ]}>` के अंदर `label:`) के अंदर अनुवाद नहीं किया जाना चाहिए। बिल्ट-इन डिफ़ॉल्ट (`class`, `key`, `id`, `href`, `src`, आदि) के साथ मर्ज किया गया। केस-असंवेदनशील।

उदाहरण: `"protectKeys": ["slug", "code"]` `{ slug: 'getting-started', title: 'Getting started' }` को छोड़ देता है → जब `slug` सुरक्षित होता है तो केवल `title` का अनुवाद किया जाता है।

<br/>

**उदाहरण (`docsOutput.style = "flat"` — स्क्रीनशॉट पथ + वैकल्पिक भाषा सूची रैपर):**

<details>
<summary>फ्लैट लेआउट पोस्टप्रोसेसिंग उदाहरण (स्क्रीनशॉट + भाषा सूची ब्लॉक)</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

---

<a id="json"></a>
### `json`

नेस्टेड JSON अनुवाद पाइपलाइनों का शीर्ष-स्तरीय सरणी। केवल तभी उपयोग किया जाता है जब `features.translateJson` सत्य हो (`translate-json` या `sync` का JSON चरण)। [JSON](/hi/guide/json) देखें।

| फ़ील्ड | विवरण |
|-------|-------------|
| `description` | CLI / `status` के लिए वैकल्पिक नोट (अनुवादित नहीं)। |
| `contentPaths` | प्रोजेक्ट रूट के अंतर्गत स्रोत `.json` फ़ाइलें, निर्देशिकाएँ, या ग्लोब। |
| `outputPathTemplate` | प्रति लक्ष्य लोकेल आवश्यक आउटपुट पथ। प्लेसहोल्डर: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`। |
| `targetLocales` | इस ब्लॉक के लिए वैकल्पिक उपसमूह; अन्यथा रूट `targetLocales`। |
| `keyPolicy.mode` | `allowlist`, `denylist`, या `both`। |
| `keyPolicy.translateKeys` | जब मोड `allowlist` या `both` हो तो शामिल करने के लिए डॉट पथ / ग्लोब। |
| `keyPolicy.skipKeys` | बाहर करने के लिए डॉट पथ / ग्लोब (डिफ़ॉल्ट डेनिलिस्ट में `id`, `slug`, `href`, `url`, `key`, `code` शामिल हैं)। |

---

<a id="svg"></a>
### `svg`

SVG फ़ाइलों के लिए शीर्ष-स्तरीय पथ और लेआउट। अनुवाद केवल तभी चलता है जब `features.translateSVG` सत्य हो (`translate-svg` या `sync` के SVG चरण के माध्यम से)।

| फ़ील्ड | विवरण |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath` | एक या अधिक निर्देशिकाएँ **या ग्लोब पैटर्न** (जैसे `"images/*.svg"`, `"**/icons/*.svg"`)। पैटर्न प्रोजेक्ट रूट के सापेक्ष हल किए जाते हैं और `.svg` फ़ाइलों के लिए पुनरावर्ती रूप से स्कैन किए जाते हैं। |
| `outputDir`      | अनुवादित SVG आउटपुट के लिए रूट डायरेक्टरी।                                                                                                                                                                                                                          |
| `style`          | `pathTemplate` अनसेट होने पर `"flat"` या `"nested"`।                                                                                                                                                                                                               |
| `pathTemplate`   | कस्टम SVG आउटपुट पाथ। प्लेसहोल्डर: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>। |
| `localePathLowercase` | जब `true` होता है, तो बिल्ट-इन `flat` / `nested` SVG लेआउट लोअरकेस लोकेल सेगमेंट का उपयोग करते हैं। कस्टम `pathTemplate` मान अपरिवर्तित रहते हैं; लोअरकेस सेगमेंट के लिए `{llocale}` का उपयोग करें। |
| `forceLowercase` | SVG रीअसेंबली पर अनुवादित टेक्स्ट को लोअर-केस करें। उन डिज़ाइनों के लिए उपयोगी है जो सभी-लोअरकेस लेबल पर निर्भर करते हैं।                                                                                                                                                                |

---

<a id="glossary"></a>
### `glossary`

| फ़ील्ड          | विवरण                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | `strings.json` का पाथ - मौजूदा अनुवादों से एक शब्दावली को स्वतः-बनाता है।                                                                                                 |
| `userGlossary` | कॉलम `Original language string` (या `en`), `locale`, `Translation` के साथ एक CSV का पाथ - प्रति स्रोत शब्द और लक्ष्य लोकेल एक पंक्ति (सभी लक्ष्यों के लिए `locale` `*` हो सकता है)। |
| `autoAddUserEditedToGlossary` | जब `true` होता है, तो UI स्ट्रिंग्स में डैशबोर्ड संपादन स्वचालित रूप से उपयोगकर्ता शब्दावली में जोड़े जा सकते हैं। |

`translate-docs` शब्दावली संकेतों के लिए समान शब्दावली का उपयोग करता है, लेकिन कॉम्पैक्ट UI-लेबल संक्षिप्ताक्षरों (जैसे `Alm.` जैसे ट्रेलिंग-डॉट फ़ॉर्म, या `Size` → `Tam` जैसे छोटे सिंगल-टोकन संपीड़न) को छोड़ देता है ताकि दस्तावेज़ प्रॉम्प्ट को आविष्कार किए गए <code v-pre>{{…}}</code> टोकन की ओर निर्देशित न किया जाए। पूर्ण उत्पाद शब्द और गैर-संक्षिप्त UI अनुवाद अभी भी संकेतित हैं।

**एक खाली शब्दावली CSV जनरेट करें:**

```bash
ai-i18n-tools glossary-generate
```
