<a id="ui-strings"></a>
# यूआई स्ट्रिंग

`extract` और `translate-ui` के लिए संदर्भ, वह पाइपलाइन जो `t()` कॉल को प्रति-स्थानिक कैटलॉग में बदल देती है। पहली बार किसी ऐप में i18n जोड़ रहे हैं? [JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) या [Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) से शुरू करें। वे रैपिंग चरण को कवर करते हैं, फिर आपको चरण 2 से 4 के लिए वापस यहीं भेजते हैं।

यह पाइपलाइन JS/TS प्रोजेक्ट्स (React, Next.js क्लाइंट और सर्वर कंपोनेंट्स, Node.js सेवाएं, सादा HTML, Astro वेबसाइट्स और CLI टूल्स) और Python एप्लीकेशन्स को सेवा देती है। JS/TS, `t()` के स्रोत कॉल के बाद i18next के साथ स्ट्रिंग्स को देखता है। Python, जेनरेट किए गए `i18n.py` के माध्यम से `t()` या gettext को कॉल करता है (Django, Django के gettext को रखता है)।

<a id="which-guide-to-read"></a>
## कौन सी गाइड पढ़ें

| आपका ऐप | आगे पढ़ें |
| --- | --- |
| हार्डकोडेड स्रोत स्ट्रिंग्स के साथ JS/TS, अभी तक कोई `t()` नहीं | [JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) |
| React / Next.js / Node, `t()` पहले से ही स्रोत में है | [i18next को वायर करें](/hi/guide/ui-strings/i18next-runtime) |
| Python (`t()`, `_()`, gettext, Jinja, Django) | [Python अनुप्रयोग](/hi/guide/ui-strings/python)। आरंभ करें: `ui-python`, `ui-python-gettext`, `ui-python-flask`, या `ui-python-django`। सहायक: `i18n.py`। किसी मौजूदा ऐप में लोकेल जोड़ने के लिए, [Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) देखें, या जब ऐप gettext का उपयोग करता है तो [Django / Python gettext ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-django-gettext) देखें। |
| Plain HTML (मार्कअप में कोई `t()` नहीं) | [Plain HTML ऐप्स](/hi/guide/ui-strings/plain-html) |
| Astro मार्केटिंग साइट (हाइब्रिड) | [Astro वेबसाइट](/hi/guide/ui-strings/astro-website) |
| `t()` नियम, इंटरपोलेशन, बहुवचन | [t() कॉल और बहुवचन](/hi/guide/ui-strings/t-calls-and-plurals) |
| भाषा पिकर / RTL | [भाषा स्विचर और RTL](/hi/guide/ui-strings/language-switcher) |
| रनटाइम एपीआई हस्ताक्षर | [रनटाइम हेल्पर](/hi/guide/runtime-helpers) |
| Intlayer `.content.ts` डिक्शनरी, Intlayer से हट रहे हैं | [Intlayer से माइग्रेट करना](/hi/guide/migrating-from-intlayer) |
| Intlayer `.content.ts` डिक्शनरी, Intlayer को रख रहे हैं | [Intlayer का यथास्थान अनुवाद करना](/hi/guide/translating-intlayer) |

<a id="step-1-initialise"></a>
## चरण 1: आरंभ करें

```bash
ai-i18n-tools init -P openrouter
```

यह `ui-markdown` टेम्पलेट (उस प्रीसेट के लिए `provider` / `providers` ब्लॉक सहित) के साथ `ai-i18n-tools.config.json` लिखता है। वह टेम्पलेट `README.md` के लिए दस्तावेज़ अनुवाद भी चालू करता है, जिसे `translated-docs/` के तहत फ्लैट फ़ाइलों के रूप में लिखा जाता है। केवल README वाले रिपॉजिटरी इसके बजाय `init -t docs-markdown` का उपयोग करते हैं। [अपने README और Markdown डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) देखें। `translate-ui` या `sync` चलाने से पहले, उस प्रदाता के लिए API कुंजी को पर्यावरण या `.env` में सेट करें — Ollama को छोड़कर; [प्रदाता और API कुंजी](/hi/guide/quick-start#provider-and-api-key) देखें। UI स्ट्रिंग्स के लिए चार कुंजियाँ महत्वपूर्ण हैं:

- `sourceLocale`: उस भाषा का BCP-47 कोड जिसमें आपका स्रोत पाठ लिखा गया है। कोई भी भाषा मान्य है; `"en-GB"` केवल एक उदाहरण है। इसे आपके रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) से निर्यात किए गए `SOURCE_LOCALE` से मेल खाना चाहिए। `t()` के अंदर की स्ट्रिंग वह स्रोत भाषा है, और फ्लैट लोकल फ़ाइलें इसे कुंजी के रूप में उपयोग करती हैं।
- `targetLocales`: आपकी लक्ष्य भाषाओं के लिए BCP-47 कोड (उदाहरण के लिए `["de", "fr", "pt-BR"]`)। इस सूची से `ui-languages.json` मैनिफेस्ट बनाने के लिए `generate-ui-languages` चलाएँ।
- `ui.sourceRoots`: `t("…")` कॉल (उदाहरण के लिए `["src/"]`) को स्कैन करने के लिए निर्देशिकाएँ या ग्लोब पैटर्न।
- `ui.stringsJson` और `ui.flatOutputDir`: जहाँ मास्टर कैटलॉग और प्रति-स्थानिक फ़ाइलें (`de.json`, `pt-BR.json`) लिखी जाती हैं।

`providers.<active>.uiModels` सहित हर दूसरी कुंजी [कॉन्फ़िगरेशन](/hi/reference/configuration) में है।

<a id="step-2-extract-strings"></a>
## चरण 2: स्ट्रिंग निकालें

`extract` तब तक कुछ भी उपयोगी नहीं करता जब तक कि वे `t()` / `i18n.t()` कॉल मौजूद न हों। पहले हार्डकोडेड कॉपी को रैप करें: [JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js)।

```bash
ai-i18n-tools extract
```

`ui.sourceRoots` के तहत फ़ाइलों को `t("literal")` और `i18n.t("literal")` कॉल के लिए स्कैन करता है। `ui.stringsJson` में लिखता है (या मर्ज करता है)।

स्कैनर कॉन्फ़िगर करने योग्य है: `ui.uiExtractor.funcNames` (या लेगेसी `ui.reactExtractor.funcNames`) के माध्यम से कस्टम फ़ंक्शन नाम जोड़ें। Astro पेजों और कंपोनेंट के लिए, `ui.uiExtractor.extensions` में `.astro` जोड़ें। Plain HTML के लिए, [Plain HTML ऐप्स](/hi/guide/ui-strings/plain-html) देखें।

<a id="what-extract-scans"></a>
### एक्सट्रैक्ट क्या स्कैन करता है

- डिफ़ॉल्ट एक्सटेंशन केवल `.js`, `.jsx`, `.ts` और `.tsx` हैं। `.mjs`, `.cjs`, `.mts` और `.cts` तभी शामिल होते हैं जब आप उन्हें `ui.uiExtractor.extensions` में जोड़ते हैं।
- `t(variable)` या एक टेम्पलेट लिटरल जैसी गैर-लिटरल कुंजी को बिना किसी चेतावनी के छोड़ दिया जाता है।
- `package.json` `description` डिफ़ॉल्ट रूप से शामिल है (`ui.uiExtractor.includePackageDescription`)।
- Vue और Svelte सिंगल-फ़ाइल कंपोनेंट समर्थित नहीं हैं। `.vue` या `.svelte` को `extensions` में जोड़ने से टेम्पलेट टेक्स्ट एक्सट्रैक्ट नहीं होता है। कोई SFC पार्सर नहीं है।

<a id="step-3-translate-ui-strings"></a>
## चरण 3: UI स्ट्रिंग का अनुवाद करें

```bash
ai-i18n-tools translate-ui
```

`strings.json` पढ़ता है, प्रत्येक लक्ष्य लोकेल के लिए सक्रिय LLM प्रदाता पर मॉडल को बैच भेजता है, `ui.flatOutputDir` में फ्लैट JSON फ़ाइलें (`de.json`, `fr.json`, आदि) लिखता है। मॉडल चयन UI श्रृंखला का उपयोग करता है: `localeModels(locale)` → `uiModels` → `translationModels` ([AI मॉडल](/hi/guide/ai-models#model-fallback-chain) देखें)। एक लोकेल के भीतर, एक साथ `uiBatchConcurrency` बैच तक चलते हैं (डिफ़ॉल्ट **2**; [कॉन्फ़िगरेशन — uiBatchConcurrency](/hi/reference/configuration#uibatchconcurrency-optional) देखें)। `-j` अभी भी केवल लक्ष्य लोकेल को समानांतर करता है।

<a id="translations-database-stringsjson"></a>
### अनुवाद डेटाबेस (`strings.json`)

प्रत्येक प्रविष्टि के लिए, `translate-ui` एक वैकल्पिक `models` ऑब्जेक्ट (`translated` के समान लोकेल कुंजी) में प्रत्येक लोकेल का सफलतापूर्वक अनुवाद करने वाले **सक्रिय प्रदाता से मॉडल आईडी** को संग्रहीत करता है। अनुवाद डैशबोर्ड में संपादित स्ट्रिंग को उस लोकेल के लिए `models` में प्रहरी मान `user-edited` के साथ चिह्नित किया जाता है। `ui.flatOutputDir` के तहत प्रति-लोकेल फ्लैट फ़ाइलें केवल **स्रोत स्ट्रिंग → अनुवाद** रहती हैं; उनमें `models` शामिल नहीं है (इसलिए रनटाइम बंडल अपरिवर्तित रहते हैं)।

> **ध्यान दें:** UI स्ट्रिंग में डैशबोर्ड संपादन `strings.json` में रहते हैं, न कि SQLite दस्तावेज़ कैश में। कैटलॉग से फ्लैट लोकेल फ़ाइलों को फिर से लिखने के लिए सादा `sync` या `translate-ui` (कोई विशेष फ़्लैग नहीं) चलाएँ — `--force-update` UI चरण पर **अग्रेषित नहीं** किया जाता है। मैन्युअल संपादन के बाद UI कमांड पर `--force` से बचें: यह हर प्रविष्टि का फिर से अनुवाद करता है और आपकी `user-edited` पंक्तियों को अधिलेखित कर सकता है। कैटलॉग पंक्तियाँ जिनकी संग्रहीत अनुवाद लोकेल लेखन-प्रणाली जाँच में विफल रहता है (उदाहरण के लिए `hi` के लिए रोमनकृत हिंदी) को गुम माना जाता है और `--force` के बिना फिर से अनुवादित किया जाता है।

<a id="step-4-use-the-output-in-your-app"></a>
## चरण 4: अपने ऐप में आउटपुट का उपयोग करें

`translate-ui` केवल फ़ाइलें लिखता है। ऐप को उन्हें लोड करना होगा।

- JS/TS: रनटाइम हेल्पर के साथ i18next को वायर करें, उपयोगकर्ता द्वारा चुनी गई लोकल फ़ाइल को लोड करें, और एक भाषा स्विचर जोड़ें। [i18next को वायर करें](/hi/guide/ui-strings/i18next-runtime) और [भाषा स्विचर और RTL](/hi/guide/ui-strings/language-switcher) देखें।
- Python: जेनरेट किए गए `i18n.py` या अपने gettext कैटलॉग का उपयोग करें। [Python एप्लीकेशन्स](/hi/guide/ui-strings/python) देखें।
- सादा HTML: पेज के बगल में रनटाइम स्क्रिप्ट लोड करें। [सादा HTML ऐप्स](/hi/guide/ui-strings/plain-html) देखें।
- Astro: [Astro वेबसाइट](/hi/guide/ui-strings/astro-website) देखें।

<a id="optional"></a>
## वैकल्पिक

<a id="per-locale-model-overrides"></a>
### प्रति-स्थानीय मॉडल ओवरराइड

कुछ मॉडल कुछ भाषाओं का दूसरों की तुलना में बेहतर अनुवाद करते हैं। उदाहरण के लिए, qwen और z-ai मॉडल एशियाई भाषाओं के साथ अच्छा प्रदर्शन करते हैं। प्रत्येक BCP-47 लोकेल के लिए एक प्राथमिकता वाली मॉडल सूची देने के लिए `providers.<active>.localeModels` प्रविष्टियाँ जोड़ें। उन सूचियों को उस लोकेल के लिए `uiModels` और `translationModels` से पहले आज़माया जाता है। लोकेल टैग केस-संवेदी नहीं होते हैं (`zh-cn` और `ZH-CN` समान हैं)। कोई मिलान प्रविष्टि न होने पर, उपकरण डिफ़ॉल्ट `uiModels` और `translationModels` क्रम का उपयोग करता है। वही `localeModels` तंत्र दस्तावेज़, JSON और SVG अनुवाद पर लागू होता है।

<a id="exporting-to-xliff-20"></a>
### XLIFF 2.0 में निर्यात करना

UI स्ट्रिंग को किसी अनुवाद विक्रेता, TMS, या CAT टूल को सौंपने के लिए, कैटलॉग को **XLIFF 2.0** (प्रति लक्ष्य लोकेल एक फ़ाइल) के रूप में निर्यात करें। यह कमांड **केवल-पढ़ने के लिए** है: यह `strings.json` को संशोधित नहीं करता है या किसी API को कॉल नहीं करता है।

```bash
ai-i18n-tools export-ui-xliff
```

डिफ़ॉल्ट रूप से, फ़ाइलें `ui.stringsJson` के बगल में लिखी जाती हैं, जिनका नाम `strings.de.xliff`, `strings.pt-BR.xliff` (आपके कैटलॉग का बेसनेम + लोकेल + `.xliff`) जैसा होता है। कहीं और लिखने के लिए `-o` / `--output-dir` का उपयोग करें। `strings.json` से मौजूदा अनुवाद `<target>` में दिखाई देते हैं; गुम लोकेल `state="initial"` का उपयोग बिना `<target>` के करते हैं ताकि उपकरण उन्हें भर सकें। प्रत्येक लोकेल के लिए केवल उन इकाइयों को निर्यात करने के लिए `--untranslated-only` का उपयोग करें जिन्हें अभी भी अनुवाद की आवश्यकता है (विक्रेता बैचों के लिए उपयोगी)। `--dry-run` फ़ाइलें लिखे बिना पथ प्रिंट करता है।
