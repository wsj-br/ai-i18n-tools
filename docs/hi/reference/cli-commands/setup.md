<a id="cli--getting-started"></a>
# CLI — आरंभ करना

<a id="version"></a>
### `version`

**सारांश:** `ai-i18n-tools version`

सीएलआई संस्करण और बिल्ड टाइमस्टैम्प प्रिंट करें (रूट प्रोग्राम पर `-V` / `--version` के समान जानकारी)।

---

<a id="init"></a>
### `init`

**सारांश:** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

एक स्टार्टर कॉन्फ़िग फ़ाइल लिखें (इसमें `provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, और `docs[].addFrontmatter` शामिल हैं)। LLM को कॉल करने वाले अनुवाद कमांड के लिए सक्रिय प्रदाता की API कुंजी वातावरण में या `.env` (ओलामा को छोड़कर) में होनी चाहिए — [प्रदाता और API कुंजी](/hi/guide/quick-start#provider-and-api-key) देखें।

**मुख्य विकल्प:** `-P` / `--provider` (आवश्यक), `-t` / `--template`, `-o` / `--output`, `--with-readme`, `--with-translate-ignore`

`-P` / `--provider` आवश्यक है। यह निर्धारित करता है कि कौन सा **अंतर्निहित प्रीसेट** स्कैफ़ोल्ड करना है। यह इनमें से एक होना चाहिए: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apikeyfan`, `cheaperinference`, `ollama`।

**टेम्पलेट (`-t`):**

| मान | स्काफोल्ड्स |
|-------|-----------|
| `ui-markdown` | यूआई स्ट्रिंग्स और रीडमी (फ्लैट आउटपुट, भाषा सूची) |
| `ui-docusaurus` | डॉक्यूसॉरस यूआई + डॉक्स |
| `ui-starlight` | स्टारलाइट डॉक्स |
| `ui-vitepress` | वाइटप्रेस डॉक्स (`docsOutput.style: "vitepress"`) प्लस थीम स्ट्रिंग्स के लिए `vitepressThemeCatalog` |
| `ui-nextra` | नेक्सट्रा डॉक्स (`docsOutput.style: "nextra"`) प्लस थीम डिक्शनरी के लिए `nextraDictionaryPath` (साइडबार `_meta.ts` स्वचालित रूप से एकत्र किया जाता है) |
| `ui-fumadocs` | फ़्यूमाडॉक्स डॉक्स (`docsOutput.style: "fumadocs"`) प्लस यूआई ओवरराइड के लिए `fumadocsUiCatalog` (साइडबार `meta.json` स्वचालित रूप से एकत्र किया जाता है) |
| `ui-astro-website` | एस्ट्रो वेबसाइट यूआई स्ट्रिंग्स |
| `ui-plain-html` | सादा HTML कैटलॉग (`data-i18n*` मार्कर, फ्लैट लोकेल JSON) |
| `docs-plain-html` | सादे HTML दस्तावेज़ (प्रति लोकेल एक फ़ाइल, भाषा सूची, hreflang) |
| `docs-markdown` | मार्कडाउन डॉक्स: रीडमी और `.md` फ़ाइलें, फ्लैट आउटपुट, भाषा सूची |
| `ui-json-bundles` | JSON (केवल `json[]`) |
| `ui-python` | पायथन यूआई स्ट्रिंग्स, स्रोत-भाषा स्ट्रिंग द्वारा कुंजीबद्ध फ्लैट JSON, और `i18n.py` |
| `ui-python-gettext` | फ़्लैट JSON और GNU `.po` / `.mo` के साथ Python UI स्ट्रिंग्स, साथ ही `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}` कैटलॉग (`flatOutput: false`, डोमेन `django`, कोई `i18n.py` नहीं) |
| `ui-python-flask` | `translations/` (`flatOutput: false`) के अंतर्गत Flask / Jinja कैटलॉग, साथ ही `i18n.py` |
| `ui-dotnet` | .NET UI स्ट्रिंग, सोर्स-लैंग्वेज स्ट्रिंग द्वारा कुंजीबद्ध फ़्लैट JSON, और `I18n.cs` |
| `ui-dotnet-resx` | .NET UI स्ट्रिंग `.resx` सैटेलाइट (`flatOutput: false`) और `I18nResx.cs` के रूप में |

`--with-readme` एक `README.md` डॉक्स ब्लॉक जोड़ता है (`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, एक `languageListBlock`) और `features.translateDocs` को true पर सेट करता है। यह कुछ नहीं करता है जब एक डॉक्स ब्लॉक में पहले से ही `README.md` सूचीबद्ध होता है, जो `ui-markdown` और `docs-markdown` के लिए मामला है। यह केवल कॉन्फ़िग लिखता है। यह `README.md` में पेस्ट करने के लिए मार्कर लाइन प्रिंट करता है और जब वह फ़ाइल गुम होती है तो चेतावनी देता है। गाइड: [अपने रीडमी और मार्कडाउन डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme)।

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` एक स्टार्टर `.translate-ignore` बनाता है (जिसमें Python virtualenv और कैश डायरेक्टरी शामिल हैं)।

`ui-python`, `ui-python-gettext`, और `ui-python-flask` उस फ़ाइल के गुम होने पर `i18n.py` भी लिखते हैं। Django प्रोजेक्ट Django का अपना gettext रनटाइम रखते हैं, इसलिए `ui-python-django` `i18n.py` नहीं लिखता है। `ui-dotnet` उस फ़ाइल के गुम होने पर `I18n.cs` लिखता है और `.csproj` में जोड़ने के लिए `EmbeddedResource` आइटम प्रिंट करता है। `ui-dotnet-resx` इसके बजाय `I18nResx.cs` लिखता है और `ui.resx` को `Resources/SharedResource.<culture>.resx` पर इंगित करता है। `--namespace` C# नेमस्पेस को ओवरराइड करता है। गाइड: [.NET एप्लिकेशन](/hi/guide/ui-strings/dotnet) और [.NET ResourceManager ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-dotnet-resourcemanager)।

`migrate-python-i18n` असुरक्षित पूर्व-मूल्यांकित कॉल (`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`) को लुकअप-बिफोर-फॉर्मेट कॉल में फिर से लिखता है। डिफ़ॉल्ट रूप से यह एक ड्राई रन है। फ़ाइलों को संपादित करने के लिए `--write` पास करें, और समीक्षा नोट्स के लिए `migrate-python-i18n-report.md` पढ़ें। एक जटिल एक्सप्रेशन को एक्सप्रेशन से नाम दिया जाता है जब वह स्थिर होता है (`start.isoformat()` `{start}` बन जाता है, `len(rows)` `{rows_count}` बन जाता है)। एक बचा हुआ `{value_1}` रिपोर्ट किया जाता है ताकि उसका नाम बदला जा सके। जेनरेट की गई `i18n.py` फ़ाइलें छोड़ दी जाती हैं। एक साफ़ रिपोर्ट का मतलब यह नहीं है कि अनरैप्ड f-स्ट्रिंग्स कवर किए गए थे।

`migrate-dotnet-i18n` `T()` के अंदर `T($"...")`, कॉन्कैटिनेशन, और `string.Format` के लिए भी ऐसा ही करता है। `--wrap` बिना चिह्नित XAML लेबल और उच्च-विश्वास C# सिंक को भी चिह्नित करता है; `--write` के बिना यह एक ऑडिट है। रिपोर्ट `migrate-dotnet-i18n-report.md` है। जनरेट किए गए `I18n.cs` और `I18nResx.cs` को छोड़ दिया जाता है। गाइड: [.NET एप्लिकेशन](/hi/guide/ui-strings/dotnet#migrate)।

---

<a id="doctor"></a>
### `doctor`

**सारांश:** `ai-i18n-tools doctor [--local] [--strict] [--json]`

जाँच करें कि प्रोजेक्ट अनुवाद के लिए तैयार है। रिपोर्ट में कॉन्फ़िग सिंटैक्स और स्कीमा, व्यावसायिक नियम, स्थापित संस्करण, स्रोत और आउटपुट पाथ, UI कैटलॉग फ़ाइलें, उन कैटलॉग में प्लेसहोल्डर बेमेल, कैश सांख्यिकी, कॉन्फ़िगर किए गए प्रोवाइडर, सेट किए गए समर्थित पर्यावरण चर, और मॉडल आईडी शामिल हैं। एक कैटलॉग जिसमें नाम बदला हुआ, हटाया गया, या फिर से लिखा गया प्लेसहोल्डर है, एक चेतावनी है और एक उदाहरण का नाम देता है।

डिफ़ॉल्ट रूप से, `doctor` सक्रिय प्रोवाइडर के कैटलॉग के विरुद्ध कॉन्फ़िगर किए गए मॉडल आईडी की भी जाँच करता है और स्थापित संस्करण की तुलना नवीनतम GitHub रिलीज़ से करता है। `--local` दोनों नेटवर्क कॉल को छोड़ देता है। एक नया रिलीज़, या एक GitHub अनुरोध जो विफल हो जाता है, एक चेतावनी है। एक गुम या समाप्त मॉडल आईडी कमांड को विफल कर देता है। जब कोई भी जाँच चेतावनी देती है तो `--strict` त्रुटि के साथ बाहर निकलता है।

API कुंजी मान कभी प्रिंट नहीं किए जाते हैं। एक सेट कुंजी `NAME (set)` के रूप में दिखाई जाती है।

गुम इनपुट पाथ विफल हो जाते हैं। गुम आउटपुट डायरेक्टरी एक नोट हैं, क्योंकि पहली अनुवाद रन उन्हें बनाती है। `doctor` कॉन्फ़िग को फिर से नहीं लिखता, डायरेक्टरी नहीं बनाता, या स्रोत टेक्स्ट को किसी मॉडल पर नहीं भेजता।

**मुख्य विकल्प:** `--local`, `--strict`, `--json`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
```

---

<a id="help"></a>
### `help`

**सारांश:** `ai-i18n-tools help [command]`

एक सबकमांड के लिए सहायता प्रदर्शित करें (`ai-i18n-tools <command> --help` के समान आउटपुट)।
