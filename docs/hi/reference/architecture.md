<a id="architecture"></a>
# आर्किटेक्चर

<a id="architecture-overview"></a>
## आर्किटेक्चर अवलोकन

कोडबेस को चार परतों में व्यवस्थित किया गया है। मानसिक मॉडल के लिए इस अनुभाग का उपयोग करें; जब आपको फ़ाइल-स्तरीय विवरण की आवश्यकता हो तो [स्रोत ट्री](#source-tree) खोलें।

<a id="how-a-sync-run-fits-together"></a>
### `sync` रन कैसे एक साथ फिट बैठता है

`sync` (और व्यक्तिगत अनुवाद कमांड) सक्षम सुविधाओं को क्रम में चलाते हैं:

| चरण | कमांड | यह क्या करता है |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | UI स्रोतों को स्कैन करें → `strings.json` अपडेट करें → फ़्लैट लोकेल JSON भरें (`de.json`, …) |
| 2 | `translate-svg` *(वैकल्पिक)* | `config.svg` के तहत SVG टेक्स्ट का अनुवाद करें |
| 3 | `translate-docs` | मार्कडाउन, MDX, `.astro` पेजों का अनुवाद करें; Docusaurus कैटलॉग JSON; Nextra `_meta` / डिक्शनरी `.ts`; VitePress थीम कैटलॉग |
| 4 | `translate-json` *(वैकल्पिक)* | `json[]` के तहत नेस्टेड JSON लीव्स का अनुवाद करें |

प्रत्येक पाइपलाइन एक ही मुख्य लूप का अनुसरण करती है: **सेगमेंट निकालें → सिंटैक्स को सुरक्षित रखें → बैच → कैश लुकअप या LLM कॉल → आउटपुट लिखें**। बीच में साझा सेवाएं — कॉन्फ़िग, प्लेसहोल्डर, कैश, शब्दावली, `LlmClient` — [साझा इन्फ्रास्ट्रक्चर](#shared-infrastructure) के तहत वर्णित हैं।

<a id="module-map"></a>
### मॉड्यूल मैप

| परत | फ़ोल्डर | भूमिका |
| --- | --- | --- |
| **एंट्री** | `src/cli/` | CLI कमांड: `init`, `extract`, `mark-html`, `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`, `status`, `dashboard`, … |
| **पाइपलाइन** | `src/extractors/` | JS/TS, HTML मार्कर, मार्कडाउन, JSON, SVG, `.astro` से सेगमेंट निष्कर्षण |
| | `src/processors/` | प्लेसहोल्डर सुरक्षा, बैचिंग, सत्यापन, लिंक पुनर्लेखन |
| **साझा** | `src/core/` | कॉन्फ़िग, प्रकार, SQLite कैश, प्रॉम्प्ट, आउटपुट पाथ, लोकेल यूटिलिटीज |
| | `src/api/` | `LlmClient` — प्रदाता-अज्ञेय चैट क्लाइंट (Vercel AI SDK) मॉडल फ़ॉलबैक के साथ |
| | `src/glossary/` | प्रॉम्प्ट के लिए शब्दावली लोडिंग और शब्द संकेत |
| | `src/utils/` | लॉगर, हैशिंग, इग्नोर पार्सर, डिस्प्ले-चौड़ाई टेबल, `.env` लोडर |
| **आपका ऐप रनटाइम** | `src/runtime/` | i18next हेल्पर और डिस्प्ले यूटिलिटीज — `'ai-i18n-tools/runtime'` के रूप में निर्यात किया गया ([रनटाइम हेल्पर](/hi/guide/runtime-helpers)) |
| **टूल UI** *(डॉगफ़ूडिंग)* | `src/i18n/`, `src/dashboard-app/`, `src/server/` | इस पैकेज के अपने CLI और ट्रांसलेशन डैशबोर्ड का स्थानीयकरण करता है — आपकी प्रोजेक्ट सामग्री से अलग ([स्व-स्थानीयकरण](#self-localization-tool-ui)) |

प्रोग्रामेटिक उपयोग के लिए अभिप्रेत सब कुछ `src/index.ts` ([प्रोग्रामेटिक एपीआई](/hi/reference/programmatic-api)) से फिर से निर्यात किया जाता है।

<a id="pipeline-summaries"></a>
### पाइपलाइन सारांश

| पाइपलाइन | अनुभाग | इनपुट → आउटपुट |
| --- | --- | --- |
| यूआई स्ट्रिंग्स | [यूआई स्ट्रिंग्स इंटरनल](#ui-strings-internals) | स्रोत फ़ाइलें → `strings.json` → फ़्लैट `{locale}.json` |
| दस्तावेज़ | [दस्तावेज़ इंटरनल](#documents-internals) | मार्कडाउन / एमडीएक्स / `.astro` / डॉक्यूसॉरस जेएसओएन → `docs[].outputDir` के तहत प्रति-स्थानिक फ़ाइलें |
| जेएसओएन बंडल | [जेएसओएन इंटरनल](#json-internals) | `json[]` के तहत नेस्टेड जेएसओएन → प्रति-स्थानिक जेएसओएन फ़ाइलें |
| एसवीजी | [दस्तावेज़ इंटरनल — एक्सट्रैक्टर](#extractors) | `config.svg` के तहत एसवीजी फ़ाइलें → अनुवादित एसवीजी प्रतियां |

---

<a id="ui-strings-internals"></a>
## यूआई स्ट्रिंग्स इंटरनल

| चरण | घटक | परिणाम |
| --- | --- | --- |
| 1 | स्रोत फ़ाइलें (जेएस/टीएस; वैकल्पिक `.astro` / `.html`) | डिस्क पर फ़ाइलें |
| 2 | `UIStringExtractor` (i18next-scanner; `.astro` के माध्यम से `ui-string-babel.ts`) | एमडी5 हैश द्वारा कुंजीबद्ध खंड |
| 3 | `strings.json` | मास्टर कैटलॉग: `{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | स्रोत स्ट्रिंग्स का जेएसओएन सरणी → अनुवाद (+ प्रति बैच मॉडल आईडी) |
| 5 | `de.json`, `pt-BR.json`, … | फ़्लैट मैप्स: स्रोत स्ट्रिंग → अनुवाद (कोई मॉडल मेटाडेटा नहीं) |

<a id="uistringextractor"></a>
### `UIStringExtractor`

जेएस/टीएस फ़ाइलों में `i18next-scanner` के `Parser.parseFuncFromString` का उपयोग `t("literal")` और `i18n.t("literal")` कॉल खोजने के लिए करता है। `.astro` स्रोतों के लिए (जब `ui.uiExtractor.extensions` में सूचीबद्ध हो), `ui-string-babel.ts` फ्रंटमैटर और टेम्प्लेट `{expression}` ब्लॉक को `@babel/parser` के साथ पार्स करता है और वही `funcNames` नियम लागू करता है। फ़ंक्शन नाम और फ़ाइल एक्सटेंशन `ui.uiExtractor` के माध्यम से कॉन्फ़िगर करने योग्य हैं (`ui.reactExtractor` एक समर्थित उपनाम है)। `extract` **गैर-स्कैनर इनपुट को भी उसी कैटलॉग में मर्ज करता है:** प्रोजेक्ट `package.json` `description` जब `includePackageDescription` सक्षम होता है (डिफ़ॉल्ट), और बंडल किए गए यूआई-भाषाओं मास्टर कैटलॉग से प्रत्येक `englishName` (`sourceLocale` + `targetLocales` से निर्मित) जब `includeUiLanguageEnglishNames` `true` होता है (स्रोत में पहले से मिली स्ट्रिंग्स को प्राथमिकता मिलती है; `languagesManifestPath` नहीं पढ़ता है)। `extract` `languagesManifestPath` पर `ui-languages.json` को भी पुनर्जीवित करता है। सेगमेंट हैश ट्रिम किए गए स्रोत स्ट्रिंग के **एमडी5 के पहले 8 हेक्स वर्ण** होते हैं — ये `strings.json` में कुंजी बन जाते हैं।

`.html` / `.htm` स्रोतों के लिए (जब `ui.uiExtractor.extensions` में सूचीबद्ध हो), `extract` इसके बजाय फ़ाइल को `html-i18n-marks.ts` के माध्यम से रूट करता है, जो `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` मार्कर विशेषताओं को स्कैन करता है (`ui.uiExtractor.htmlI18nAttributes` के माध्यम से कॉन्फ़िगर करने योग्य)। एक नंगे मार्कर अपना स्रोत पाठ तत्व के अपने `textContent` / `title` / `placeholder` से लेता है; एक मूल्यवान मार्कर (`data-i18n="Key"`) मान का उपयोग करता है। वही मॉड्यूल `mark-html` कमांड को शक्ति प्रदान करता है, जो नंगे मार्करों को स्वचालित रूप से सम्मिलित करता है। एचटीएमएल फ़ाइलें कभी भी बैबेल / i18next-scanner पास तक नहीं पहुँचती हैं।

प्लेन एस्ट्रो एसएसजी साइटें i18next को छोड़ सकती हैं: बिल्ड समय पर फ़्लैट `{locale}.json` लोड करें और स्रोत-पाठ कुंजी द्वारा `t('English')` को हल करें (`examples/astro-website/src/i18n/t.ts` और [यूआई स्ट्रिंग्स — एस्ट्रो वेबसाइट](/hi/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight) देखें)।

प्लेन एचटीएमएल ऐप्स मार्कर विशेषताओं के साथ समान कैटलॉग मॉडल का पालन करते हैं, `t()` कॉल के बजाय — [अनुवाद के लिए एचटीएमएल को चिह्नित करना](/hi/guide/ui-strings/plain-html#marking-html-for-translation) देखें।

<a id="stringsjson"></a>
### `strings.json`

मास्टर कैटलॉग का आकार है:

```json
{
  "a1b2c3d4": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models` (वैकल्पिक) — प्रति स्थानीय, किस मॉडल ने उस अनुवाद को उस स्थानीय के लिए अंतिम सफल `translate-ui` रन के बाद उत्पादित किया (या `user-edited` यदि पाठ अनुवाद डैशबोर्ड से सहेजा गया था)। `locations` (वैकल्पिक) — जहाँ `extract` को स्ट्रिंग मिली (स्कैनर + पैकेज विवरण पंक्ति; बंडल-मास्टर `englishName` स्ट्रिंग्स `locations` को छोड़ सकते हैं)।

`extract` नई कुंजियाँ जोड़ता है और स्कैन में अभी भी मौजूद कुंजियों (स्कैनर लिटरल, वैकल्पिक विवरण, वैकल्पिक बंडल-मास्टर `englishName`) के लिए मौजूदा `translated` / `models` डेटा को सुरक्षित रखता है। `translate-ui` गुम `translated` प्रविष्टियों को भरता है, उन लोकेल के लिए `models` को अपडेट करता है जिनका वह अनुवाद करता है, और फ्लैट लोकेल फ़ाइलें लिखता है।

`ui-languages.json` **मैनिफेस्ट** — `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, संदर्भ `englishName`, `"ltr"` या `"rtl"`) का JSON सरणी। `sourceLocale` + `targetLocales` और बंडल किए गए मास्टर `data/ui-languages-complete.json` से एक प्रोजेक्ट फ़ाइल बनाने के लिए `generate-ui-languages` या `extract` का उपयोग करें।

<a id="flat-locale-files"></a>
### फ्लैट लोकेल फ़ाइलें

प्रत्येक लक्ष्य लोकेल को एक फ्लैट JSON फ़ाइल (`de.json`) मिलती है जो स्रोत स्ट्रिंग → अनुवाद (कोई `models` फ़ील्ड नहीं) को मैप करती है:

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next इन्हें संसाधन बंडल के रूप में लोड करता है और स्रोत स्ट्रिंग (की-एज़-डिफ़ॉल्ट मॉडल) द्वारा अनुवादों को देखता है।

<a id="ui-translation-prompts"></a>
### UI अनुवाद प्रॉम्प्ट

`buildUIPromptMessages` सिस्टम + उपयोगकर्ता संदेशों का निर्माण करता है जो:

- स्रोत और लक्ष्य भाषाओं की पहचान करें (`localeDisplayNames` या `ui-languages.json` से प्रदर्शन नाम से)।
- स्ट्रिंग का एक JSON सरणी भेजें और बदले में अनुवादों का एक JSON सरणी का अनुरोध करें।
- उपलब्ध होने पर शब्दावली संकेत शामिल करें।

`LlmClient.translateUIBatch` प्रत्येक मॉडल को क्रम में आज़माता है, पार्स या नेटवर्क त्रुटियों पर वापस आता है। CLI `localeModels`, वैकल्पिक `uiModels`, और `translationModels` से प्रति लक्ष्य लोकेल उस सूची का निर्माण करता है ([प्रदाता और मॉडल](/hi/guide/providers-and-models#model-fallback-chain) देखें)।

---

<a id="documents-internals"></a>
## दस्तावेज़ आंतरिक

| चरण | घटक | परिणाम |
| --- | --- | --- |
| 1 | Markdown / MDX / JSON / `.astro` फ़ाइलें (`translate-docs`) | स्रोत फ़ाइलें |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` — हैश + सामग्री के साथ टाइप किए गए खंड |
| 3 | `PlaceholderHandler` | संरक्षित पाठ — HTML, एडमोनिशन, एंकर, MDX, URL, इनलाइन कोड, टोकन के रूप में मास्क किया गया जोर |
| 4 | `splitTranslatableIntoBatches` | `batches[]` — गणना + वर्ण सीमा द्वारा समूहीकृत |
| 5 | `TranslationCache` लुकअप | कैश हिट → छोड़ें; मिस → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | अंतिम पाठ — प्लेसहोल्डर बहाल |
| 7 | `resolveDocumentationOutputPath` | आउटपुट फ़ाइल — Docusaurus लेआउट या फ्लैट लेआउट |

<a id="extractors"></a>
### एक्सट्रैक्टर

सभी एक्सट्रैक्टर `BaseExtractor` का विस्तार करते हैं और `extract(content, filepath): Segment[]` को लागू करते हैं।

- `MarkdownExtractor` - मार्कडाउन को टाइप किए गए खंडों में विभाजित करता है: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`। YAML फ्रंटमैटर को **गैर-अनुवाद योग्य** के रूप में वर्गीकृत किया गया है (`slug`, `id`, और अन्य रूटिंग कुंजियाँ स्थिर रहती हैं)। शीर्ष-स्तरीय `export ...` ब्लॉक (जैसे React घटक परिभाषाएँ) को मौजूदा `import ...` हैंडलिंग के साथ गैर-अनुवाद योग्य `other` खंडों के रूप में वर्गीकृत किया गया है। एक बड़े JSX टैग (जैसे एक `<Tabs>` ब्लॉक) से शुरू होने वाले मल्टी-लाइन ब्लॉक को अनुवाद योग्य पैराग्राफ के रूप में वर्गीकृत किया गया है। गैर-अनुवाद योग्य खंड (कोड ब्लॉक, रॉ HTML) को यथावत रखा जाता है।
- `AstroTemplateExtractor` - `.astro` मार्केटिंग पृष्ठों के लिए पार्स-एंड-रिप्लेस (`doc-translate.ts` में `translateAstroFile` के माध्यम से `translate-docs`)। उपयोगकर्ता-सामना वाले HTML टेक्स्ट नोड्स और अनुवाद योग्य विशेषताओं (`alt`, `title`, `aria-label`, `placeholder`) को निकालता है, साथ ही उपयोगकर्ता-सामना होने पर टेम्पलेट `{expression}` ब्लॉक के अंदर स्ट्रिंग लिटरल भी। फ्रंटमैटर टाइपस्क्रिप्ट, `<script>`, `<style>`, संरक्षित विशेषता/कुंजी मान, और `t('…')` के अंदर लिटरल को छोड़ देता है। जब आउटपुट पथ गहरे होते हैं (जैसे `src/pages/de/index.astro`) तो पुनर्संयोजन सापेक्ष आयात को समायोजित करता है। [एस्ट्रो वेबसाइट पृष्ठ](/hi/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace) देखें।
- `JsonExtractor` - Docusaurus JSON लेबल फ़ाइलों (Docusaurus UI कैटलॉग, MDX बॉडी नहीं) से स्ट्रिंग मान निकालता है।
- `SvgExtractor` - SVG से `<text>`, `<title>`, और `<desc>` सामग्री निकालता है (`config.svg` के तहत फ़ाइलों के लिए `translate-svg` द्वारा उपयोग किया जाता है, `translate-docs` द्वारा नहीं)।
- `html-i18n-marks.ts` - एक फोकस्ड एचटीएमएल टैग स्कैनर जिसका उपयोग `extract` द्वारा `.html` / `.htm` स्रोतों और `mark-html` कमांड द्वारा किया जाता है। `collectHtmlI18nStrings` / `collectHtmlI18nLocations` `data-i18n*` मार्कर विशेषताओं (नग्न मार्कर → तत्व `textContent` / `title` / `placeholder`; मूल्यांकित मार्कर → मूल्य) पढ़ते हैं, और `markHtmlContent` नग्न मार्कर्स को पत्ती पाठ / शीर्षक / प्लेसहोल्डर तत्वों में डालता है (आदिम, `data-i18n-ignore` का सम्मान करता है, कोड जैसे और मिश्रित सामग्री तत्वों को छोड़ देता है)। साझा `normalizeI18nText` हेल्पर निर्माण समय कुंजियों को ब्राउज़र रनटाइम के समान रखता है।

<a id="astro-hybrid-sites-ui--page-html"></a>
### एस्ट्रो हाइब्रिड साइटें (यूआई + पेज एचटीएमएल)

सादे एस्ट्रो ऐप्स अक्सर एक कॉन्फ़िग (संदर्भ: `examples/astro-website/`) में **दोनों** यूआई स्ट्रिंग्स और दस्तावेज़ को सक्षम करते हैं:

| परत | तंत्र | आउटपुट |
| --- | --- | --- |
| टेम्पलेट एचटीएमएल | `AstroTemplateExtractor` + `translate-docs` | प्रति-स्थानीय `.astro` के तहत `docs[].outputDir` |
| फ्रंटमैटर / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | फ्लैट `public/locales/{locale}.json` (अंग्रेजी स्रोत कुंजी के रूप में) |

`sync` कमांड सक्षम चरणों को क्रम में चलाता है: **निकालें** फिर **अनुवाद-यूआई** (जब `features.translateUIStrings`) → वैकल्पिक **अनुवाद-एसवीजी** → **अनुवाद-दस्तावेज** → वैकल्पिक **अनुवाद-जेसन** (जब तक `--no-ui`, `--no-svg`, `--no-docs`, या `--no-json` के साथ छोड़ा नहीं जाता है)। प्रारंभ टेम्पलेट `ui-astro-website` केवल यूआई स्ट्रिंग्स को बनाता है; पेज एचटीएमएल के लिए `docs[]` और `features.translateDocs` जोड़ें।

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### शीर्षक एंकर सम्मिलन (`write-heading-ids` सीएलआई)

`write-heading-ids` कमांड प्रलेखन मार्कडाउन के लिए एक **स्थानीय, गैर-एलएलएम** प्रीप्रोसेसर है। कार्यान्वयन: `src/cli/write-heading-ids.ts` फ़ाइल खोज को समन्वयित करता है; `src/markdown/write-heading-ids-core.ts` पंक्तियों को पार्स करता है और एंकर सम्मिलित करता है।

यह एक वैध कॉन्फ़िग की आवश्यकता है जिसमें **कम से कम एक `docs[]` ब्लॉक** हो। प्रत्येक ब्लॉक के लिए यह `.md` / `.mdx` फ़ाइलों को `contentPaths` के तहत इकट्ठा करता है, परियोजना के `.translate-ignore` नियमों (डॉक ट्रांसलेशन की तरह) को लागू करता है, और वैकल्पिक रूप से `--path` / `--file` के साथ एक सबट्री तक प्रतिबंधित करता है। प्रत्येक फ़ाइल को `applyHeadingAnchorsToMarkdown` के साथ परिवर्तित किया जाता है: प्रत्येक **फ्लैट एटीएक्स हेडिंग** (`# …` से `###### …`) के लिए बंद फेंस्ड कोड ब्लॉक्स के बाहर, या तो एक खाली एचटीएमएल लाइन `<a id="slug"></a>` को ऊपर की पंक्ति पर सम्मिलित किया जाता है जब यह अनुपस्थित या पुराना होता है, या — `--slug-style mdx-comment` के साथ — एक डॉक्यूसॉरस एमडीएक्स सuffix `{/* #slug */}` को हेडिंग लाइन पर जोड़ा जाता है। स्लग एल्गोरिदम सामान्य पारिस्थितिकी तंत्र — `github` (डिफ़ॉल्ट), `bitbucket`, `gitlab`, `pymdown` (वैकल्पिक यूनिकोड सामान्यीकरण / प्रतिशत-एन्कोडिंग फ्लैग), `azure-devops`, плюस `mdx-comment` (गिटहब स्लग + एमडीएक्स टिप्पणी आउटपुट) — के साथ मेल खाते हैं ताकि एंकर आईडी मौजूदा टूलिंग (doctoc, PyMdown, Docusaurus, आदि) के साथ संगत रहें। `--dry-run` रिपोर्टें बिना लिखे हुए संभावित संपादन करती हैं।

यह कमांड `translate-docs` या `sync` के अंदर **नहीं** चलता है; स्थिर फ्रैगमेंट आईडी के लिए स्रोत फ़ाइलों में अनुवाद या प्रकाशन से पहले इसे स्पष्ट रूप से चलाएं।

<a id="placeholder-protection"></a>
### प्लेसहोल्डर सुरक्षा

अनुवाद से पहले, संवेदनशील वाक्य रचना को अपारदर्शी टोकन के साथ बदल दिया जाता है ताकि एलएलएम भ्रष्टाचार को रोका जा सके, इस क्रम में लागू किया जाता है (पुनर्स्थापना इसके विपरीत है):

1. **एचटीएमएल टैग और टिप्पणियां** (`<strong>`, `<!-- ... -->`, आदि।) - निम्नलिखित एचटीएमएल टैग ज्ञात अनुमत सूची से ```{{HTM_N}}``` टोकन के साथ बदल दिए जाते हैं। पूंजीकृत जेएसएक्स टैग (`<Highlight>`, `<Tabs>`, `</Tab>`) को एमडीएक्स परत द्वारा अलग से संभाला जाता है (चरण 4)।
2. **चेतावनी मार्कर** (`:::note`, `:::`) - केवल खुलने वाली पंक्ति पर निर्देश पूर्वसर्ग को ```{{ADM_OPEN_N}}``` के साथ बदल दिया जाता है; किसी भी समान-पंक्ति शीर्षक को मॉडल द्वारा अनुवादित करने के लिए छोड़ दिया जाता है। मूल मूल पाठ के साथ बहाल किया जाता है।
3. **दस्तावेज़ एंकर** (एचटीएमएल `<a id="…">`, डोक्यूसॉरस शीर्षक `{#…}`) - अक्षरशः संरक्षित किया जाता है।
4. **एमडीएक्स-केवल निर्माण** (`src/processors/mdx-placeholders.ts`):
   - **एमडीएक्स टिप्पणियां** (`{/* … */}`, डोक्यूसॉरस शीर्षक-आईडी फॉर्म `{/* #my-id */}` सहित) ```{{MDX_N}}``` के साथ बदल दी जाती हैं।
   - **पूंजीकृत जेएसएक्स टैग** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - ```{{MDX_N}}``` के साथ संरक्षित किया जाता है जिसमें अनुवाद योग्य स्ट्रिंग विशेषताएं (`label`, `tooltip`, `aria-label`) ```{{JXA_N}}``` में पुनर्लिखित की जाती हैं टैग के अंदर जब तक विशेषता नाम `docs[].protectAttributes` में दिखाई नहीं देता है; `label:` `<Tabs values={[ { label: '…' } ]}>` वस्तु साक्षात्कार (`docs[].protectKeys` के माध्यम से छोड़ा जा सकता है) और `<TabItem value="…">` (जब कोई `label` विशेषता मौजूद नहीं है, छोटे स्लग जैसे मानों को छोड़कर) को भी निकाला जाता है। सेगमेंट के रूप में `||JXA_N: …||` पंक्तियों के रूप में जोड़ा जाता है, `restoreMdx` द्वारा वापस मिलाया जाता है।
   - **एमडीएक्स ब्रेस अभिव्यक्तियां** (`{frontMatter.title}`, <code v-pre>शैली={{…}}</code>) - गहराई-जागरूक मिलान, ```{{MDX_N}}``` के साथ बदल दिया जाता है।
5. **मार्कडाउन यूआरएल** (`](url)`, `src="…"`) - अनुवाद के बाद एक मानचित्र से बहाल किया जाता है।
6. **इनलाइन कोड स्पैन** (`` `code` ``) और **बोल्ड-रैप्ड इनलाइन कोड** (`**`code`**`) - संरक्षित।
7. **मार्कडाउन एम्फेसिस** (वैकल्पिक, CJK/RTL लोकेल के लिए स्वतः सक्षम) - एम्फेसिस डीलिमिटर मास्क्ड।

मॉडल के वापस आने के बाद, `translate-docs` मैप्स को पुनर्स्थापित करता है और सेगमेंट को मान्य करता है: डबल-ब्रेसेड टोकन का एक ही मल्टीसेट मौजूद होना चाहिए, संरचनात्मक टोकन (<code v-pre>{{HTM_N}}</code>, चेतावनी मार्कर) को अपने क्रमबद्ध अनुक्रम को बनाए रखना चाहिए (सामग्री टोकन जैसे <code v-pre>{{ILC_N}}</code> / <code v-pre>{{URL_N}}</code> / <code v-pre>{{SE}}</code> शब्द क्रम के साथ चल सकते हैं), पुनर्स्थापित HTML टैग प्रकारों को असुरक्षित स्रोत से मेल खाना चाहिए, और कोई भी बचा हुआ डबल-ब्रेसेड पहचानकर्ता स्रोत में पहले से मौजूद होना चाहिए (इसलिए आविष्कार किए गए टोकन विफल हो जाते हैं)। दस्तावेज़ प्रॉम्प्ट मॉडल से प्रत्येक टोकन को एक बार कॉपी करने, संरचनात्मक-टोकन क्रम बनाए रखने और नए डबल-ब्रेसेड रैपर का आविष्कार न करने के लिए भी कहता है; यांत्रिक जांच आधिकारिक बनी हुई है।

एस्ट्रो टेम्प्लेट और एमडीएक्स जेएसएक्स के लिए साझा विशेषता/कुंजी सुरक्षा `src/processors/expression-attribute-protection.ts` में लागू की जाती है और `docs[].protectAttributes` और `docs[].protectKeys` द्वारा प्रति ब्लॉक संचालित की जाती है (देखें [protectAttributes / protectKeys](/hi/reference/configuration#protectattributes-protectkeys))।

<a id="cache-translationcache"></a>
### कैश (`TranslationCache`)

एसक्यूलाइट डेटाबेस (`node:sqlite` के माध्यम से) `(source_hash, locale)` द्वारा `translated_text`, `model`, `filepath`, `last_hit_at`, और संबंधित फ़ील्ड के साथ कुंजीबद्ध पंक्तियों को संग्रहीत करता है। हैश सामान्यीकृत सामग्री (व्हाइटस्पेस कोलैप्स) के SHA-256 के पहले 16 हेक्स वर्ण हैं।

प्रत्येक रन पर, हैश × लोकेल द्वारा सेगमेंट देखे जाते हैं। केवल कैश मिस ही LLM पर जाते हैं। अनुवाद के बाद, `last_hit_at` को वर्तमान अनुवाद स्कोप में सेगमेंट पंक्तियों के लिए रीसेट किया जाता है जो हिट नहीं हुई थीं। डॉक अनुवाद के दौरान सफल कैश हिट उस सेगमेंट के लिए पुरानी `translation_failures` पंक्तियों को साफ़ करते हैं। `cleanup` पहले `sync --force-update` चलाता है, फिर पुरानी सेगमेंट पंक्तियों (शून्य `last_hit_at` / खाली फ़ाइलपाथ) को हटाता है, जब डिस्क पर हल किया गया स्रोत पथ गायब होता है (`doc-block:…`, `json-block:…`, `svg-files:…`, आदि) तो `file_tracking` कुंजियों को हटाता है, उन अनुवाद पंक्तियों को हटाता है जिनका मेटाडेटा फ़ाइलपाथ एक गुम फ़ाइल की ओर इशारा करता है, अनाथ `translation_failures` पंक्तियों को हटाता है, उन अनाथ `markdown_source_issues` पंक्तियों को हटाता है जिनका हल किया गया स्रोत पथ डिस्क पर गायब है, और कॉन्फ़िग से अनुपस्थित लोकेल के लिए कैश पंक्तियों को हटाता है (`sourceLocale`, रूट `targetLocales`, और कोई भी प्रति-ब्लॉक `docs[]` / `json[]` `targetLocales`; केवल SQLite — जेनरेट की गई फ़ाइलों को हटाने के लिए `purge-locale` का उपयोग करें); यह `cache.db` का बैकअप नहीं लेता है जब तक कि `--backup <path>` पास नहीं किया जाता है, जो पहले उस पथ पर एक बैकअप लिखता है।

`translate-docs` कमांड **फ़ाइल ट्रैकिंग** का भी उपयोग करता है ताकि मौजूदा, अप-टू-डेट आउटपुट वाले अपरिवर्तित स्रोत पूरी तरह से काम छोड़ सकें। `--force-update` फ़ाइल प्रोसेसिंग को फिर से चलाता है जबकि अभी भी सेगमेंट कैश का उपयोग करता है; `--force` फ़ाइल ट्रैकिंग को साफ़ करता है और एपीआई अनुवाद के लिए सेगमेंट कैश रीड को बायपास करता है। जब प्रत्येक कॉन्फ़िगर किया गया मॉडल मार्कडाउन सेगमेंट पर एएसटी सत्यापन में विफल रहता है, तो `translate-docs` सेगमेंट को धीरे-धीरे विभाजित कर सकता है और छोटे हिस्सों को फिर से प्रयास कर सकता है (`docs[].segmentSplitting.qualityRetrySplit`, डिफ़ॉल्ट रूप से चालू)। पूर्ण फ़्लैग तालिका के लिए [दस्तावेज़ — कैश व्यवहार और फ़्लैग](/hi/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags) देखें।

**बैच प्रॉम्प्ट प्रारूप:** `translate-docs --prompt-format` केवल `LlmClient.translateDocumentBatch` के लिए एक्सएमएल (`<seg>` / `<t>`) या जेएसओएन सरणी/ऑब्जेक्ट आकार का चयन करता है; निष्कर्षण, प्लेसहोल्डर और सत्यापन अपरिवर्तित रहते हैं। [बैच प्रॉम्प्ट प्रारूप](/hi/guide/documents/cli-options#batch-prompt-format) देखें।

<a id="output-path-resolution"></a>
### आउटपुट पथ रिज़ॉल्यूशन

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` एक स्रोत-सापेक्ष पथ को आउटपुट पथ पर मैप करता है:

- `nested` शैली (डिफ़ॉल्ट): मार्कडाउन के लिए `{outputDir}/{locale}/{relPath}`।
- `doc-system` शैली: `docsRoot` के तहत, आउटपुट `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` का उपयोग करते हैं; `docsRoot` के बाहर के पथ नेस्टेड लेआउट पर वापस आ जाते हैं। उपनाम: `docusaurus` (डिफ़ॉल्ट `localeSubpath` = Docusaurus प्लगइन पथ), `astro-starlight` (डिफ़ॉल्ट खाली `localeSubpath`), `vitepress` (खाली `localeSubpath` के साथ `doc-system` के समान; BCP-47 फ़ोल्डर केसिंग को संरक्षित करता है)।
- `flat` शैली: `{outputDir}/{stem}.{locale}{extension}`। जब `flatPreserveRelativeDir` `true` होता है, तो स्रोत उपनिर्देशिकाएँ `outputDir` के तहत रखी जाती हैं।
- **कस्टम** `pathTemplate`: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` का उपयोग करके कोई भी मार्कडाउन लेआउट।
- **कस्टम** `jsonPathTemplate`: JSON लेबल फ़ाइलों के लिए अलग कस्टम लेआउट, समान प्लेसहोल्डर का उपयोग करके।
- `linkRewriteDocsRoot` फ्लैट-लिंक रीराइटर को सही उपसर्गों की गणना करने में मदद करता है जब अनुवादित आउटपुट डिफ़ॉल्ट प्रोजेक्ट रूट के अलावा कहीं और रूट किया जाता है।

<a id="flat-link-rewriting"></a>
### फ्लैट लिंक रीराइटिंग

जब `docsOutput.style === "flat"`, अनुवादित मार्कडाउन फ़ाइलें लोकेल प्रत्यय के साथ स्रोत के बगल में रखी जाती हैं। पृष्ठों के बीच सापेक्ष लिंक को फिर से लिखा जाता है ताकि `readme.de.md` में `[Guide](./guide.md)` `guide.de.md` की ओर इशारा करे। `rewriteRelativeLinks` द्वारा नियंत्रित (कस्टम `pathTemplate` के बिना फ्लैट शैली के लिए स्वतः सक्षम)। वही पास `postProcessing.regexAdjustments` चलने से पहले गैर-मार्कडाउन एसेट यूआरएल में प्रति-फ़ाइल गहराई उपसर्ग जोड़ता है — [फ्लैट लिंक रीराइटर](/hi/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow) देखें।

---

<a id="json-internals"></a>
## JSON आंतरिक

| चरण | घटक | परिणाम |
| --- | --- | --- |
| 1 | `json[].contentPaths` | फ़ाइलें हल की गईं (फ़ाइल, निर्देशिका, या ग्लोब) |
| 2 | `NestedJsonExtractor` | `keyPolicy` (डॉट पथ + मिनिमाच) द्वारा चयनित स्ट्रिंग लीव्स |
| 3 | `PlaceholderHandler` + बैच + `TranslationCache` | कैश हिट → छोड़ें; मिस → `LlmClient.translateDocumentBatch` (साझा एसक्यूलाइट) |
| 4 | `NestedJsonExtractor.reassemble` | `expandJsonBlockOutputPath(outputPathTemplate)` के माध्यम से आउटपुट फ़ाइल |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) मनमाने ढंग से नेस्टेड JSON को पार करता है और प्रति अनुवाद योग्य स्ट्रिंग लीफ एक सेगमेंट उत्सर्जित करता है। `keyPolicy.mode` (`allowlist`, `denylist`, या `both`) डॉट नोटेशन पर मिनिमैच के साथ पाथ को फ़िल्टर करता है (`slug` जैसे नंगे नाम अंतिम कुंजी सेगमेंट से मेल खाते हैं)।
- कैश फ़ाइल ट्रैकिंग `file_tracking` में `json-block:{blockIndex}:{projectRelPath}` का उपयोग करती है (दस्तावेज़ों और SVG के समान `cacheDir`)।
- Docusaurus `write-translations` कैटलॉग (`{ message, description }` आकार) के लिए **नहीं** — वे दस्तावेज़ों का उपयोग करते हैं (`docs[].docusaurusCatalogDir` + `JsonExtractor` `translate-docs` के अंदर)।
- `t()` UI स्ट्रिंग्स के लिए **नहीं** — UI स्ट्रिंग्स (`strings.json` + फ्लैट बंडल)।
- CLI: `translate-json`; `src/cli/translate-json-run.ts` में ऑर्केस्ट्रेशन। टेम्पलेट प्रारंभ करें: `ui-json-bundles`।

---

<a id="shared-infrastructure"></a>
## साझा अवसंरचना

<a id="llmclient"></a>
### `LlmClient`

Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`) पर निर्मित प्रदाता-अज्ञेयवादी चैट क्लाइंट। यह `provider` / `providers` से सक्रिय प्रदाता को हल करता है, उस प्रदाता के `baseUrl` + API कुंजी के लिए एक OpenAI-संगत क्लाइंट (`createOpenAICompatible`) बनाता है, और सभी कॉलों को `generateText` के माध्यम से रूट करता है। `OpenRouterClient` को एक अप्रचलित उपनाम के रूप में रखा गया है। मुख्य व्यवहार:

- **मॉडल फ़ॉलबैक**: हल की गई सूची में प्रत्येक मॉडल को क्रम से आज़माता है; अनुरोध या पार्स विफलताओं पर वापस आता है। प्रत्येक लक्ष्य लोकेल को अपनी हल की गई श्रृंखला मिलती है: कॉन्फ़िगर होने पर पहले `localeModels(locale)`, फिर `uiModels` (केवल UI पाइपलाइन), फिर `translationModels`। दस्तावेज़, JSON, और SVG अनुवाद गैर-UI श्रृंखला के साथ प्रति-लोकेल क्लाइंट बनाते हैं। `bench-models` कमांड इसके बजाय प्रति कॉन्फ़िगर किए गए आईडी (`translationModels`, `uiModels`, और `localeModels` का संघ; `translationModels: [id]`, कोई फ़ॉलबैक नहीं) एक एकल-मॉडल क्लाइंट बनाता है ताकि यह प्रत्येक मॉडल को स्वतंत्र रूप से समय और कीमत दे सके।
- **अनुरोध टाइमआउट**: सक्रिय प्रदाता का `requestTimeoutMs` (डिफ़ॉल्ट 30 सेकंड) `AbortSignal.timeout` के माध्यम से प्रत्येक अनुरोध को रद्द करता है। जब CLI `check-models` (कोई भी प्रदाता) के लिए प्रदाता की मॉडल सूची लोड करता है तो `GET /models` पर भी यही मान लागू होता है। वैकल्पिक प्री-फ़्लाइट फ़िल्टर जो अज्ञात मॉडल आईडी को छोड़ देता है, तभी चलता है जब सक्रिय प्रदाता OpenRouter हो।
- **OpenRouter अतिरिक्त** (केवल जब `openrouter` सक्रिय हो): `provider` अनुरोध फ़ील्ड, `HTTP-Referer` / `X-Title` हेडर, और `usage.cost` से पढ़े गए सटीक USD लागत के माध्यम से थ्रूपुट रूटिंग। टोकन उपयोग प्रत्येक प्रदाता के लिए रिपोर्ट किया जाता है; सटीक लागत तभी जब प्रदाता इसे लौटाता है।
- **डीबग ट्रैफ़िक लॉग**: यदि `debugTrafficFilePath` सेट है, तो अनुरोध और प्रतिक्रिया JSON को एक फ़ाइल में जोड़ता है।

<a id="config-loading"></a>
### कॉन्फ़िग लोडिंग

`loadI18nConfigFromFile(configPath, cwd)` पाइपलाइन:

1. `ai-i18n-tools.config.json` (JSON) पढ़ें और पार्स करें।
2. `mergeWithDefaults` - `defaultI18nConfigPartial` के साथ डीप-मर्ज करें, और किसी भी `docs[].sourceFiles` प्रविष्टियों को `contentPaths` में मर्ज करें।
3. `expandTargetLocalesFileReferenceInRawInput` - `targetLocales` को एक सरणी में परिवर्तित करें और पाथ-जैसे प्रविष्टियों को अस्वीकार करें (BCP-47 कोड होने चाहिए, `ui-languages.json` का पाथ नहीं); `languagesManifestPath` `mergeWithDefaults` के दौरान `{ui.flatOutputDir}/ui-languages.json` पर डिफ़ॉल्ट होता है।
4. `expandDocumentationTargetLocalesInRawInput` - प्रत्येक `docs[].targetLocales` प्रविष्टि के लिए समान।
5. `expandJsonTargetLocalesInRawInput` - प्रत्येक `json[].targetLocales` प्रविष्टि के लिए समान।
6. `parseI18nConfig` - Zod सत्यापन + `validateI18nBusinessRules`।
7. `applyProviderOverrideToRawInput` - जब CLI पर `-P` / `--provider` पास किया जाता है।
8. `applyEnvOverrides` - `OPENROUTER_BASE_URL`, `OLLAMA_BASE_URL`, `I18N_SOURCE_LOCALE`, और `I18N_TARGET_LOCALES` को सेट होने पर लागू करें (API कुंजियाँ `LlmClient` के अंदर प्रति प्रदाता अलग से हल की जाती हैं)।
9. `augmentConfigWithUiLanguagesMaster` - बंडल किए गए मास्टर कैटलॉग से मैनिफेस्ट डिस्प्ले नाम संलग्न करें।
10. `assertEffectiveLocalesInUiLanguagesMaster` - लागू होने पर मास्टर कैटलॉग के विरुद्ध लोकेल कोड को मान्य करें।

`init` `initConfigTemplates` से स्टार्टर कॉन्फ़िग लिखता है: `ui-markdown` (UI + वैकल्पिक ऐप मार्कडाउन), `ui-docusaurus`, `ui-starlight`, `ui-vitepress` (VitePress डॉक्स + `vitepressThemeCatalog`), `ui-nextra` (Nextra डॉक्स + `nextraDictionaryPath`), `ui-astro-website` (सादा Astro UI; `.astro` पेज अनुवाद के लिए `docs[]` जोड़ें), `ui-json-bundles` (केवल JSON `json[]`)। [त्वरित प्रारंभ — प्रारंभ करें](/hi/guide/quick-start#step-1-initialise) देखें।

<a id="logger"></a>
### लॉगर

`Logger` ANSI रंग आउटपुट के साथ `debug`, `info`, `warn`, `error` स्तरों का समर्थन करता है। वर्बोस मोड (`-v`) `debug` को सक्षम करता है। जब `logFilePath` सेट होता है, तो लॉग लाइनें उस फ़ाइल में भी लिखी जाती हैं।

<a id="self-localization-tool-ui"></a>
### स्व-स्थानीयकरण (टूल UI)

यह टूल अपने स्वयं के UI — CLI सहायता, उच्च-ट्रैफ़िक लॉग/सारांश/त्रुटि संदेश, और अनुवाद डैशबोर्ड — को उस सामग्री से अलग से स्थानीयकृत करता है जिसका वह आपके लिए अनुवाद करता है।

- **स्थानिक रिज़ॉल्यूशन** (`resolveUiLocale` में `src/core/ui-locale.ts`): `-L` / `--ui-lang` > `AI_I18N_LANG` > कॉन्फ़िग `uiLanguage` > होस्ट OS स्थान (`Intl.DateTimeFormat().resolvedOptions().locale`) से UI स्थान चुनता है। उम्मीदवार को सामान्यीकृत किया जाता है और शिप किए गए बंडल सेट के साथ ठीक उसी तरह या निकटतम भिन्नता से मिलान किया जाता है (उदाहरण के लिए `pt-PT` → `pt-BR`, `en-US` → `en-GB`), स्रोत स्थान (`en-GB`) पर वापस आ जाता है। CLI सहायता बनने से पहले एक बार (प्री-पार्स argv स्कैन) और कॉन्फ़िग लोड होने के बाद फिर से हल करता है ताकि `uiLanguage` लागू हो (फ़्लैग और env var अभी भी जीतते हैं)।
- **रनटाइम** (`src/i18n/index.ts`): `t(source, vars)` के साथ एक न्यूनतम ```{{name}}``` इंटरपोलेशन, `src/i18n/locales/<code>.json` में फ़्लैट प्रति-स्थानिक बंडलों के विरुद्ध अंग्रेजी स्रोत स्ट्रिंग द्वारा कुंजीबद्ध (बिल्ड पर `dist/i18n/locales` में कॉपी किया गया)। गुम कुंजी या बंडल स्रोत पाठ लौटाते हैं। यह UI स्ट्रिंग्स के समान कुंजी-के-डिफ़ॉल्ट मॉडल है - कोई हैश लुकअप नहीं है।
- **डैशबोर्ड**: सर्वर `GET /api/ui-i18n` को उजागर करता है जो हल किए गए UI स्थान के लिए `{ locale, dir, bundle }` लौटाता है; फ़्रंटएंड `<html lang>` / `dir` सेट करता है और `data-i18n*` विशेषताओं के माध्यम से स्थिर मार्कअप को स्थानीयकृत करता है।
- **डॉगफ़ूडिंग**: बंडल पैकेज के अपने एक्सट्रैक्ट → `translate-ui` पाइपलाइन को `ai-i18n-self.config.json` (`pnpm i18n:self`) के विरुद्ध चलाकर उत्पादित किए जाते हैं। कैटलॉग कुंजी `src/cli/` और `src/i18n/` में `t()` कॉल के साथ-साथ `src/dashboard-app/index.html` में डैशबोर्ड के `data-i18n*` मार्करों से आती हैं।

---

<a id="extension-points"></a>
## एक्सटेंशन पॉइंट

<a id="custom-function-names-ui-extraction"></a>
### कस्टम फ़ंक्शन नाम (UI एक्सट्रैक्शन)

कॉन्फ़िग के माध्यम से गैर-मानक अनुवाद फ़ंक्शन नाम जोड़ें:

```json
{
  "ui": {
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro", ".html"],
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder"]
    }
  }
}
```

(`ui.reactExtractor` `ui.uiExtractor` के लिए पूरी तरह से समर्थित उपनाम है।)

`extract` के दौरान HTML मार्कर विशेषताओं को स्कैन करने के लिए `extensions` में `.html` / `.htm` जोड़ें। `ui.uiExtractor.htmlI18nAttributes` वैकल्पिक है और डिफ़ॉल्ट रूप से `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]` है; `data-i18n` तत्व `textContent` पर मैप करता है और `data-i18n-<attr>` उस विशेषता के मान पर मैप करता है (उदाहरण के लिए `data-i18n-aria-label`)।

<a id="custom-extractors"></a>
### कस्टम एक्सट्रैक्टर

पैकेज से `ContentExtractor` लागू करें:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

`'ai-i18n-tools'` से निर्यात किए गए सार्वजनिक एक्सट्रैक्टर वर्गों का विस्तार करके कस्टम एक्सट्रैक्टर पंजीकृत करें (उदाहरण के लिए सबक्लास `MarkdownExtractor`)। CLI आंतरिक रूप से अंतर्निहित एक्सट्रैक्टरों को तार करता है; `doc-translate.ts` का कोई समर्थित गहरा आयात नहीं है।

<a id="custom-output-paths"></a>
### कस्टम आउटपुट पाथ

किसी भी फ़ाइल लेआउट के लिए `docsOutput.pathTemplate` का उपयोग करें:

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```

---

<a id="source-tree"></a>
## स्रोत ट्री

<details>
<summary>पूर्ण <code>src/</code> लेआउट (फ़ाइल-स्तरीय संदर्भ)</summary>

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── mark-html.ts                `mark-html` command (insert bare `data-i18n*` markers into HTML)
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── bench-models.ts             `bench-models` command (per-model translate latency/token/cost benchmark)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── ui-locale.ts                Resolve the tool's own UI locale (flag/env/config/OS → shipped bundle)
│   ├── locale-utils.ts             BCP-47 normalisation, locale list parsing, script/Han-variant validation
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── html-i18n-marks.ts          HTML `data-i18n*` marker scanner + `mark-html` annotator
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── placeholder-integrity.ts    Pre/post-restore token sequence + tag-kind + invented {{IDENT}} checks
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── i18n/                           Self-localization runtime for the tool's own UI
│   ├── index.ts                    t(source, vars) + bundle/manifest loaders (keyed by English source string)
│   └── locales/                    Shipped UI bundles (de.json, es.json, …; generated by `pnpm i18n:self`)
│
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    ├── table.ts                    Display-width aware table rendering (CJK/emoji column alignment)
    ├── load-dotenv.ts              Auto-load `.env` from the cwd at CLI startup (never overrides existing env)
    └── ignore-parser.ts            .translate-ignore file parser
```

</details>
