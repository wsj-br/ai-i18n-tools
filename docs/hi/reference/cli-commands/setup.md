<a id="cli--getting-started"></a>
# CLI — आरंभ करना

<a id="version"></a>
### `version`

**सारांश:** `ai-i18n-tools version`

सीएलआई संस्करण और बिल्ड टाइमस्टैम्प प्रिंट करें (रूट प्रोग्राम पर `-V` / `--version` के समान जानकारी)।

---

<a id="init"></a>
### `init`

**सारांश:** `ai-i18n-tools init [-t <template>] [-o <path>] [-P <provider>] [--with-translate-ignore]`

एक स्टार्टर कॉन्फ़िग फ़ाइल लिखें (इसमें `provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, और `docs[].addFrontmatter` शामिल हैं)। LLM को कॉल करने वाले अनुवाद कमांड के लिए सक्रिय प्रदाता की API कुंजी वातावरण में या `.env` (ओलामा को छोड़कर) में होनी चाहिए — [प्रदाता और API कुंजी](/hi/guide/quick-start#provider-and-api-key) देखें।

**मुख्य विकल्प:** `-t` / `--template`, `-o` / `--output`, `-P` / `--provider`, `--with-translate-ignore`

`-P` / `--provider` यह चुनता है कि किस **built-in preset** को स्कैफ़ोल्ड करना है (छोड़ दिए जाने पर `openrouter`)। यह इनमें से एक होना चाहिए: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `cheaperinference`, `ollama`।

**टेम्पलेट (`-t`):**

| मान | स्केफोल्ड्स |
|-------|-----------|
| `ui-markdown` | मार्कडाउन यूआई स्ट्रिंग्स वर्कफ़्लो |
| `ui-docusaurus` | डॉक्यूसॉरस यूआई + डॉक्स |
| `ui-starlight` | स्टारलाइट डॉक्स |
| `ui-vitepress` | वाइटप्रेस डॉक्स (`docsOutput.style: "vitepress"`) प्लस थीम स्ट्रिंग्स के लिए `vitepressThemeCatalog` |
| `ui-nextra` | नेक्सट्रा डॉक्स (`docsOutput.style: "nextra"`) प्लस थीम डिक्शनरी के लिए `nextraDictionaryPath` (साइडबार `_meta.ts` स्वचालित रूप से एकत्र किया जाता है) |
| `ui-fumadocs` | फ़्यूमाडॉक्स डॉक्स (`docsOutput.style: "fumadocs"`) प्लस यूआई ओवरराइड के लिए `fumadocsUiCatalog` (साइडबार `meta.json` स्वचालित रूप से एकत्र किया जाता है) |
| `ui-astro-website` | एस्ट्रो वेबसाइट यूआई स्ट्रिंग्स |
| `ui-plain-html` | सादा HTML कैटलॉग (`data-i18n*` मार्कर, फ्लैट लोकेल JSON) |
| `docs-plain-html` | सादे HTML दस्तावेज़ (प्रति लोकेल एक फ़ाइल, भाषा सूची, hreflang) |
| `ui-json-bundles` | JSON (केवल `json[]`) |
| `ui-python` | Python UI स्ट्रिंग्स, फ़्लैट English-key JSON, और `i18n.py` |
| `ui-python-gettext` | फ़्लैट JSON और GNU `.po` / `.mo` के साथ Python UI स्ट्रिंग्स, साथ ही `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}` कैटलॉग (`flatOutput: false`, डोमेन `django`, कोई `i18n.py` नहीं) |
| `ui-python-flask` | `translations/` (`flatOutput: false`) के अंतर्गत Flask / Jinja कैटलॉग, साथ ही `i18n.py` |

`--with-translate-ignore` एक स्टार्टर `.translate-ignore` बनाता है (जिसमें Python virtualenv और कैश डायरेक्टरी शामिल हैं)।

`ui-python`, `ui-python-gettext`, और `ui-python-flask` तब `i18n.py` भी लिखते हैं जब वह फ़ाइल मौजूद न हो। Django प्रोजेक्ट्स Django के अपने gettext रनटाइम को बनाए रखते हैं, इसलिए `ui-python-django` फ़ाइल `i18n.py` नहीं लिखता है।

`migrate-python-i18n` असुरक्षित प्री-इवैल्यूएटेड कॉल्स (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) को लुकअप-बिफोर-फ़ॉर्मेट कॉल्स में फिर से लिखता है। डिफ़ॉल्ट एक ड्राई रन है। फ़ाइलों को संपादित करने के लिए `--write` पास करें, और समीक्षा नोट्स के लिए `migrate-python-i18n-report.md` पढ़ें। जेनरेट की गई `i18n.py` फ़ाइलों को छोड़ दिया जाता है।

---

<a id="help"></a>
### `help`

**सारांश:** `ai-i18n-tools help [command]`

एक सबकमांड के लिए सहायता प्रदर्शित करें (`ai-i18n-tools <command> --help` के समान आउटपुट)।
