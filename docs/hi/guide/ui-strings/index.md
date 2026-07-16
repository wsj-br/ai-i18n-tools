<a id="ui-strings"></a>
# यूआई स्ट्रिंग

किसी भी JS/TS प्रोजेक्ट के लिए डिज़ाइन किया गया है जो i18next का उपयोग करता है: React ऐप्स, Next.js (क्लाइंट और सर्वर कंपोनेंट), Node.js सेवाएं, Plain HTML, Astro वेबसाइट और CLI टूल।

<a id="which-guide-to-read"></a>
## कौन सी गाइड पढ़ें

| आपका ऐप | आगे पढ़ें |
| --- | --- |
| React / Next.js / Node + i18next | [i18next वायर करें](/hi/guide/ui-strings/i18next-runtime) (चरण 4) |
| Plain HTML (मार्कअप में कोई `t()` नहीं) | [Plain HTML ऐप्स](/hi/guide/ui-strings/plain-html) |
| Astro मार्केटिंग साइट (हाइब्रिड) | [Astro वेबसाइट](/hi/guide/ui-strings/astro-website) |
| `t()` नियम, इंटरपोलेशन, बहुवचन | [t() कॉल और बहुवचन](/hi/guide/ui-strings/t-calls-and-plurals) |
| भाषा पिकर / RTL | [भाषा स्विचर और RTL](/hi/guide/ui-strings/language-switcher) |
| रनटाइम एपीआई हस्ताक्षर | [रनटाइम हेल्पर](/hi/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## चरण 1: आरंभ करें

```bash
ai-i18n-tools init [-P <provider>]
```

यह `ui-markdown` टेम्पलेट (एक डिफ़ॉल्ट `provider` / `providers` ब्लॉक सहित) के साथ `ai-i18n-tools.config.json` लिखता है। `translate-ui` या `sync` चलाने से पहले, अपने सक्रिय प्रदाता के लिए एपीआई कुंजी को वातावरण या `.env` में सेट करें — Ollama को छोड़कर; [प्रदाता और एपीआई कुंजी](/hi/guide/quick-start#provider-and-api-key) देखें। सेट करने के लिए कॉन्फ़िग संपादित करें:

- `provider` और `providers` — `translationModels` के साथ कम से कम एक प्रदाता; यदि डिफ़ॉल्ट आपकी पसंद नहीं है तो प्रीसेट या मॉडल सूची बदलें (`init -P <provider>`)। [LLM प्रदाता और मॉडल](/hi/guide/providers-and-models) देखें।
- `sourceLocale` - आपकी स्रोत भाषा BCP-47 कोड (उदाहरण के लिए `"en-GB"`)। आपके रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) से निर्यात किए गए `SOURCE_LOCALE` से **मेल खाना चाहिए**।
- `targetLocales` - आपकी लक्ष्य भाषाओं के लिए BCP-47 कोड का सरणी (उदाहरण के लिए `["de", "fr", "pt-BR"]`)। इस सूची से `ui-languages.json` मैनिफेस्ट बनाने के लिए `generate-ui-languages` चलाएँ।
- `ui.sourceRoots` - `t("…")` कॉल (उदाहरण के लिए `["src/"]`, `["src/**/*.ts"]`) को स्कैन करने के लिए निर्देशिका या ग्लोब पैटर्न।
- `ui.stringsJson` - मास्टर कैटलॉग कहाँ लिखना है (उदाहरण के लिए `"src/locales/strings.json"`)।
- `ui.flatOutputDir` - `de.json`, `pt-BR.json`, आदि कहाँ लिखना है (उदाहरण के लिए `"src/locales/"`)।
- `providers.<active>.uiModels` (वैकल्पिक) - `translate-ui`, बहुवचन पीढ़ी, और `proofread-ui` के लिए ऑर्डर की गई UI-केवल मॉडल सूची (किसी भी मिलान `localeModels` प्रविष्टि के बाद, `translationModels` से पहले)। [प्रदाता और मॉडल](/hi/guide/providers-and-models#model-fallback-chain) देखें।

<a id="step-2-extract-strings"></a>
## चरण 2: स्ट्रिंग निकालें

```bash
ai-i18n-tools extract
```

`ui.sourceRoots` के तहत सभी JS/TS फ़ाइलों को `t("literal")` और `i18n.t("literal")` कॉल के लिए स्कैन करता है। `ui.stringsJson` में लिखता है (या मर्ज करता है)।

स्कैनर कॉन्फ़िगर करने योग्य है: `ui.uiExtractor.funcNames` (या लेगेसी `ui.reactExtractor.funcNames`) के माध्यम से कस्टम फ़ंक्शन नाम जोड़ें। Astro पेजों और कंपोनेंट के लिए, `ui.uiExtractor.extensions` में `.astro` जोड़ें। Plain HTML के लिए, [Plain HTML ऐप्स](/hi/guide/ui-strings/plain-html) देखें।

<a id="step-3-translate-ui-strings"></a>
## चरण 3: UI स्ट्रिंग का अनुवाद करें

```bash
ai-i18n-tools translate-ui
```

`strings.json` पढ़ता है, प्रत्येक लक्ष्य लोकेल के लिए सक्रिय LLM प्रदाता को बैच भेजता है, `ui.flatOutputDir` में फ्लैट JSON फ़ाइलें (`de.json`, `fr.json`, आदि) लिखता है। मॉडल चयन UI श्रृंखला का उपयोग करता है: `localeModels(locale)` → `uiModels` → `translationModels` ([प्रदाता और मॉडल](/hi/guide/providers-and-models#model-fallback-chain) देखें)।

<a id="per-locale-model-overrides"></a>
### प्रति-स्थानीय मॉडल ओवरराइड

लक्ष्य भाषा के आधार पर, कुछ अनुवाद मॉडल दूसरों की तुलना में काफी बेहतर प्रदर्शन कर सकते हैं—उदाहरण के लिए, qwen और z-ai मॉडल कई पश्चिमी (पश्चिमी) भाषा मॉडल की तुलना में एशियाई भाषाओं के लिए उच्च गुणवत्ता वाले अनुवाद उत्पन्न करते हैं। इसका लाभ उठाने के लिए, आप प्रत्येक BCP-47 लोकेल के लिए मॉडल की प्राथमिकता वाली सूची निर्दिष्ट करने के लिए वैकल्पिक `providers.<active>.localeModels` प्रविष्टियों का उपयोग कर सकते हैं। इन मॉडल सूचियों को उस विशेष लोकेल के लिए अधिक सामान्य `uiModels` और `translationModels` से **पहले** आज़माया जाता है। यह आपको मॉडल चयन को अनुकूलित करने और प्रति भाषा बेहतर अनुवाद गुणवत्ता प्राप्त करने की अनुमति देता है। लोकेल टैग केस-संवेदी रूप से मेल खाते हैं (इसलिए `zh-cn` और `ZH-CN` समान हैं)। यदि कोई कस्टम प्रविष्टि किसी लोकेल से मेल नहीं खाती है, तो टूल UI अनुवादों के लिए डिफ़ॉल्ट `uiModels` और `translationModels` क्रम पर वापस आ जाता है। वही `localeModels` तंत्र दस्तावेज़, JSON और SVG अनुवाद पर भी लागू होता है।

<a id="translations-database-stringsjson"></a>
### अनुवाद डेटाबेस (`strings.json`)

प्रत्येक प्रविष्टि के लिए, `translate-ui` एक वैकल्पिक `models` ऑब्जेक्ट (`translated` के समान लोकेल कुंजी) में प्रत्येक लोकेल का सफलतापूर्वक अनुवाद करने वाले **सक्रिय प्रदाता से मॉडल आईडी** को संग्रहीत करता है। अनुवाद डैशबोर्ड में संपादित स्ट्रिंग को उस लोकेल के लिए `models` में प्रहरी मान `user-edited` के साथ चिह्नित किया जाता है। `ui.flatOutputDir` के तहत प्रति-लोकेल फ्लैट फ़ाइलें केवल **स्रोत स्ट्रिंग → अनुवाद** रहती हैं; उनमें `models` शामिल नहीं है (इसलिए रनटाइम बंडल अपरिवर्तित रहते हैं)।

> **नोट:** UI स्ट्रिंग में डैशबोर्ड संपादन `strings.json` में रहते हैं, न कि SQLite दस्तावेज़ कैश में। कैटलॉग से फ़्लैट लोकेल फ़ाइलों को फिर से लिखने के लिए सादा `sync` या `translate-ui` (कोई विशेष फ़्लैग नहीं) चलाएँ — `--force-update` UI चरण पर **फ़ॉरवर्ड नहीं किया जाता है**। मैन्युअल संपादन के बाद UI कमांड पर `--force` से बचें: यह प्रत्येक प्रविष्टि का फिर से अनुवाद करता है और आपकी `user-edited` पंक्तियों को अधिलेखित कर सकता है।

फिर रनटाइम पर i18next को वायर करें — [i18next को वायर करें](/hi/guide/ui-strings/i18next-runtime)।

<a id="exporting-to-xliff-20-optional"></a>
## XLIFF 2.0 में निर्यात करना (वैकल्पिक)

UI स्ट्रिंग को किसी अनुवाद विक्रेता, TMS, या CAT टूल को सौंपने के लिए, कैटलॉग को **XLIFF 2.0** (प्रति लक्ष्य लोकेल एक फ़ाइल) के रूप में निर्यात करें। यह कमांड **केवल-पढ़ने के लिए** है: यह `strings.json` को संशोधित नहीं करता है या किसी API को कॉल नहीं करता है।

```bash
ai-i18n-tools export-ui-xliff
```

डिफ़ॉल्ट रूप से, फ़ाइलें `ui.stringsJson` के बगल में लिखी जाती हैं, जिनका नाम `strings.de.xliff`, `strings.pt-BR.xliff` (आपके कैटलॉग का बेसनेम + लोकेल + `.xliff`) जैसा होता है। कहीं और लिखने के लिए `-o` / `--output-dir` का उपयोग करें। `strings.json` से मौजूदा अनुवाद `<target>` में दिखाई देते हैं; गुम लोकेल `state="initial"` का उपयोग बिना `<target>` के करते हैं ताकि उपकरण उन्हें भर सकें। प्रत्येक लोकेल के लिए केवल उन इकाइयों को निर्यात करने के लिए `--untranslated-only` का उपयोग करें जिन्हें अभी भी अनुवाद की आवश्यकता है (विक्रेता बैचों के लिए उपयोगी)। `--dry-run` फ़ाइलें लिखे बिना पथ प्रिंट करता है।
