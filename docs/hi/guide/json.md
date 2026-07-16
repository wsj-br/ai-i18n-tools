<a id="json"></a>
# JSON

उन प्रोजेक्ट के लिए डिज़ाइन किया गया है जो UI कॉपी को **नेस्टेड JSON फ़ाइलों में प्रति लोकेल** (उदाहरण के लिए `src/i18n/en/translation.json`) में रखते हैं, न कि स्रोत में `t("…")` में। CLI उन फ़ाइलों में स्ट्रिंग मानों को चलता है, उन्हें सक्रिय LLM प्रदाता के माध्यम से अनुवादित करता है, और `json[].outputPathTemplate` का उपयोग करके प्रति-लोकेल आउटपुट लिखता है। यह `translate-docs` और `translate-svg` (`cacheDir`) के समान SQLite कैश का उपयोग करता है।

यह पाइपलाइन **नहीं** चलता `extract` — कोई `strings.json` कैटलॉग नहीं है। इसे `features.translateJson` और शीर्ष-स्तरीय `json[]` में एक या अधिक प्रविष्टियों के साथ सक्षम करें।

<a id="per-locale-model-overrides"></a>
### प्रति-स्थानीय मॉडल ओवरराइड

`translate-json` मॉडल को **प्रति लक्ष्य लोकेल** हल करता है: कॉन्फ़िगर होने पर पहले `localeModels(locale)`, फिर `translationModels`। इसका उपयोग नेस्टेड JSON बंडलों के लिए करें जहाँ कुछ लोकेल समर्पित मॉडल से लाभान्वित होते हैं — उदाहरण के लिए `zh-Hans` / `zh-Hant` थीम फ़ाइलें। [प्रदाता और मॉडल](/hi/guide/providers-and-models#model-fallback-chain) देखें।

<a id="step-1-initialise-for-nested-json"></a>
### चरण 1: नेस्टेड JSON के लिए प्रारंभ करें

```bash
ai-i18n-tools init -t ui-json-bundles [-P <provider>]
```

वह टेम्पलेट `features.translateJson: true` सेट करता है, UI एक्सट्रैक्शन और दस्तावेज़ अनुवाद को अक्षम करता है, और आउटपुट `src/i18n/{llocale}/translation.json` के साथ `src/i18n/en/translation.json` की ओर इशारा करते हुए एक एकल `json[]` ब्लॉक को स्केफ़ोल्ड करता है। इसमें एक डिफ़ॉल्ट `provider` / `providers` ब्लॉक भी शामिल है (`openrouter` जब तक आप `-P <provider>` पास नहीं करते हैं) — `translate-json` या `sync` चलाने से पहले मिलान करने वाली API कुंजी सेट करें (या स्थानीय ओलामा का उपयोग करें); [प्रदाता और API कुंजी](/hi/guide/quick-start#provider-and-api-key) देखें। अपने रेपो लेआउट के लिए `sourceLocale`, `targetLocales`, `contentPaths`, और `outputPathTemplate` संपादित करें।

<a id="step-2-configure-json"></a>
### चरण 2: `json[]` कॉन्फ़िगर करें

प्रत्येक `json[]` ब्लॉक एक पाइपलाइन का वर्णन करता है:

- `contentPaths` — एक या अधिक `.json` फ़ाइलें, निर्देशिकाएँ, या ग्लोब (उदाहरण के लिए `"src/i18n/en/translation.json"` या `"src/i18n/en/overrides/*.json"`)। पथ प्रोजेक्ट रूट से हल किए जाते हैं।
- `outputPathTemplate` — आवश्यक। प्रत्येक लक्ष्य लोकेल फ़ाइल कहाँ लिखनी है। प्लेसहोल्डर: `{locale}`, `{LOCALE}`, `{llocale}` (लोअरकेस लोकेल, एस्ट्रो रूट फ़ोल्डरों के लिए उपयोगी), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`।
- `targetLocales` (वैकल्पिक) — केवल इस ब्लॉक के लिए उपसमूह; अन्यथा रूट `targetLocales` लागू होता है।
- `keyPolicy` — कौन सी JSON कुंजियाँ अनुवाद योग्य गद्य बनाम स्थिर पहचानकर्ता रखती हैं (नीचे देखें)।
- `description` (वैकल्पिक) — CLI हेडर और `status` आउटपुट में दिखाया गया है।

उदाहरण (कई स्रोत फ़ाइलें, लोअरकेस लोकेल फ़ोल्डर):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode` | व्यवहार |
|-------------|-----------|
| `allowlist` | केवल `translateKeys` (डॉट पाथ; मिनिमैच ग्लोब) से मेल खाने वाली कुंजियाँ अनुवादित होती हैं। |
| `denylist` | `skipKeys` से मेल खाने वाली कुंजियों को छोड़कर सभी स्ट्रिंग मानों का अनुवाद करें। |
| `both` | पहले `translateKeys` लागू करें, फिर `skipKeys` से मिलान हटाएँ। |

पथ डॉट नोटेशन (`nav.home.label`) का उपयोग करते हैं। `slug` जैसा एक नंगे नाम किसी भी गहराई पर अंतिम कुंजी खंड से मेल खाता है।

<a id="step-3-translate-json-bundles"></a>
### चरण 3: JSON बंडलों का अनुवाद करें

```bash
ai-i18n-tools translate-json
```

वैकल्पिक फ़्लैग (`translate-docs` के समान विचार): लक्ष्यों के उपसमूह के लिए `-l` / `--locale`, फ़ाइलों को सीमित करने के लिए `-p` / `--path`, `--dry-run`, `--force` (मिलान की गई फ़ाइलों के लिए फ़ाइल ट्रैकिंग और सेगमेंट कैश साफ़ करें), `--force-update` (फ़ाइल हैश मेल खाने पर पुनः प्रक्रिया करें; सेगमेंट कैश अभी भी लागू होता है), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`)।

केवल JSON प्रोजेक्ट चला सकते हैं:

```bash
ai-i18n-tools sync --no-ui --no-svg --no-docs
```

जब UI या दस्तावेज़ भी सक्षम होते हैं, तो `sync` **translate-docs के बाद translate-json** चलाता है (जब तक `--no-json` नहीं)। `--no-json` के साथ JSON छोड़ें।

प्रति फ़ाइल और लोकेल कवरेज की जाँच करें:

```bash
ai-i18n-tools status
```

जब `translateJson` चालू होता है, तो `status` एक `json[]` अनुभाग प्रिंट करता है (✓ अप टू डेट, ● बासी या गुम)।

<a id="json-vs-other-pipelines"></a>
### JSON बनाम अन्य पाइपलाइनें

| स्थिति | उपयोग करें |
|-----------|-----|
| JS/TS/Astro में `t("…")` / `i18n.t("…")` में UI स्ट्रिंग | [UI स्ट्रिंग](/hi/guide/ui-strings/) — `extract` + `translate-ui` |
| Docusaurus `write-translations` कैटलॉग (`{ "key": { "message": "…", "description": "…" } }`) | दस्तावेज़ — `docs[].docusaurusCatalogDir` + `translate-docs`, **नहीं** `json[]` |
| VitePress थीम/नेविगेशन/साइडबार स्ट्रिंग | दस्तावेज़ — `docsOutput.vitepressThemeCatalog` + `translate-docs`; `json[]` का उपयोग **न करें** — [VitePress एकीकरण](/hi/guide/integrations/vitepress) देखें |
| Nextra `_meta.ts` लेबल और थीम डिक्शनरी `.ts` | दस्तावेज़ — `translate-docs` (`style: "nextra"` होने पर ऑटो `_meta`, वैकल्पिक `nextraDictionaryPath`); `json[]` का उपयोग **न करें** — [Nextra एकीकरण](/hi/guide/integrations/nextra) देखें |
| Fumadocs `meta.json` लेबल और UI ओवरराइड कैटलॉग | दस्तावेज़ — `translate-docs` (`style: "fumadocs"` होने पर ऑटो `meta.json`, वैकल्पिक `fumadocsUiCatalog`); `json[]` का उपयोग **न करें** — [Fumadocs एकीकरण](/hi/guide/integrations/fumadocs) देखें |
| स्टैंडअलोन नेस्टेड लोकेल JSON (ZenBrowser-शैली `translation.json` ट्री) | JSON — `json[]` + `translate-json` |
| `<text>` / `<title>` / `<desc>` के साथ सचित्र `.svg` फ़ाइलें | `features.translateSVG` + [`svg`](/hi/reference/configuration#svg) + `translate-svg` (वैकल्पिक; तीन मुख्य पाइपलाइनों में से एक नहीं) |

फ़ील्ड संदर्भ: [कॉन्फ़िगरेशन संदर्भ](/hi/reference/configuration#json) में [`json`](#json)। सफाई के लिए कैश कुंजियाँ `file_tracking` में `json-block:{blockIndex}:{projectRelPath}` का उपयोग करती हैं।
