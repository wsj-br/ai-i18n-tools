# ai-i18n-tools: पैकेज अवलोकन

यह दस्तावेज़ `ai-i18n-tools` की आंतरिक वास्तुकला का वर्णन करता है, कि प्रत्येक घटक कैसे एक साथ फिट होता है, और कैसे दो मुख्य कार्यप्रवाह लागू किए जाते हैं।

व्यावहारिक उपयोग निर्देशों के लिए, देखें [GETTING_STARTED.md](GETTING_STARTED.hi.md)।

<small>**अन्य भाषाओं में पढ़ें:** </small>

<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [German](./PACKAGE_OVERVIEW.de.md) · [Spanish](./PACKAGE_OVERVIEW.es.md) · [French](./PACKAGE_OVERVIEW.fr.md) · [Hindi](./PACKAGE_OVERVIEW.hi.md) · [Japanese](./PACKAGE_OVERVIEW.ja.md) · [Korean](./PACKAGE_OVERVIEW.ko.md) · [Portuguese (BR)](./PACKAGE_OVERVIEW.pt-BR.md) · [Chinese (CN)](./PACKAGE_OVERVIEW.zh-CN.md) · [Chinese (TW)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## विषय सूची

- [आर्किटेक्चर अवलोकन](#architecture-overview)
- [स्रोत ट्री](#source-tree)
- [वर्कफ़्लो 1 - यूआई अनुवाद आंतरिक](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [फ्लैट स्थानीय फ़ाइलें](#flat-locale-files)
  - [यूआई अनुवाद संकेत](#ui-translation-prompts)
- [वर्कफ़्लो 2 - दस्तावेज़ अनुवाद आंतरिक](#workflow-2---document-translation-internals)
  - [एक्सट्रैक्टर](#extractors)
  - [प्लेसहोल्डर सुरक्षा](#placeholder-protection)
  - [कैश (`TranslationCache`)](#cache-translationcache)
  - [आउटपुट पथ संकल्प](#output-path-resolution)
  - [फ्लैट लिंक पुनःलेखन](#flat-link-rewriting)
- [साझा बुनियादी ढांचा](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [कॉन्फ़िग लोडिंग](#config-loading)
  - [लॉगर](#logger)
- [रनटाइम सहायक API](#runtime-helpers-api)
  - [RTL सहायक](#rtl-helpers)
  - [i18next सेटअप फ़ैक्ट्री](#i18next-setup-factories)
  - [डिस्प्ले सहायक](#display-helpers)
  - [स्ट्रिंग सहायक](#string-helpers)
- [प्रोग्रामेटिक API](#programmatic-api)
- [एक्सटेंशन पॉइंट्स](#extension-points)
  - [कस्टम फ़ंक्शन नाम (यूआई एक्सट्रैक्शन)](#custom-function-names-ui-extraction)
  - [कस्टम एक्सट्रैक्टर](#custom-extractors)
  - [कस्टम आउटपुट पथ](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## वास्तुकला अवलोकन

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

जो कुछ भी उपभोक्ताओं को प्रोग्रामेटिक रूप से आवश्यक हो, उसे `src/index.ts` से फिर से निर्यात किया गया है।

---

## स्रोत पेड़

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── locale-utils.ts             BCP-47 normalization and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner)
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── json-extractor.ts           JSON label file extraction
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: admonitions → anchors → URLs
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   └── openrouter.ts               OpenRouter HTTP client with model fallback chain
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
├── server/
│   └── translation-editor.ts       Express app for cache / strings.json / glossary editor
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

## कार्यप्रवाह 1 - UI अनुवाद आंतरिक

```text
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

### `UIStringExtractor`

`i18next-scanner` के `Parser.parseFuncFromString` का उपयोग किसी भी JS/TS फ़ाइल में `t("literal")` और `i18n.t("literal")` कॉल खोजने के लिए करता है। फ़ंक्शन नाम और फ़ाइल एक्सटेंशन कॉन्फ़िगर करने योग्य हैं। `extract` **स्कैनर नहीं है ऐसे इनपुट को भी उसी कैटलॉग में मर्ज करता है:** प्रोजेक्ट `package.json` `description` जब `reactExtractor.includePackageDescription` सक्षम है (डिफ़ॉल्ट), और `ui-languages.json` से प्रत्येक **`englishName`** जब `reactExtractor.includeUiLanguageEnglishNames` `true` है और `uiLanguagesPath` सेट है (स्रोत में पहले से मिली स्ट्रिंग्स को प्राथमिकता रहती है)। सेगमेंट हैश **ट्रिम की गई स्रोत स्ट्रिंग के MD5 के पहले 8 हेक्स अक्षर** होते हैं — ये `strings.json` में कुंजियाँ बन जाते हैं।

### `strings.json`

मास्टर कैटलॉग का आकार है:

```json
{
  "<md5-8>": {
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

`models` (वैकल्पिक) — प्रति स्थानीयकरण, उस स्थानीयकरण के लिए अंतिम सफल `translate-ui` रन के बाद कौन सा मॉडल अनुवाद उत्पन्न करता है (या यदि पाठ `editor` वेब UI से सहेजा गया था तो `user-edited`)। `locations` (वैकल्पिक) — जहाँ `extract` ने स्ट्रिंग पाई (स्कैनर + पैकेज विवरण पंक्ति; मैनिफेस्ट-केवल `englishName` स्ट्रिंग्स `locations` छोड़ सकते हैं)।

`extract` नए कुंजी जोड़ता है और स्कैन में अभी भी मौजूद कुंजियों के लिए मौजूदा `translated` / `models` डेटा को बरकरार रखता है (स्कैनर लिटरल्स, वैकल्पिक विवरण, वैकल्पिक मैनिफेस्ट `englishName`)। `translate-ui` लुप्त `translated` प्रविष्टियों को भरता है, उन स्थानीयकरणों के लिए `models` को अपडेट करता है जिनका यह अनुवाद करता है, और सपाट स्थानीयकरण फ़ाइलें लिखता है।

`ui-languages.json` **मैनिफेस्ट** — `{ code, label, englishName, direction }` की JSON सरणी (BCP-47 `code`, यूआई `label`, संदर्भ `englishName`, `"ltr"` या `"rtl"`)। `sourceLocale` + `targetLocales` और बंडल किए गए मास्टर `data/ui-languages-complete.json` से प्रोजेक्ट फ़ाइल बनाने के लिए `generate-ui-languages` का उपयोग करें।

### फ्लैट स्थानीय फ़ाइलें

प्रत्येक लक्ष्य स्थान को स्रोत स्ट्रिंग → अनुवाद (कोई `models` फ़ील्ड नहीं) के मैपिंग वाली एक सपाट JSON फ़ाइल (`de.json`) मिलती है:

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next इन्हें संसाधन बंडलों के रूप में लोड करता है और स्रोत स्ट्रिंग (की-के-रूप में डिफ़ॉल्ट मॉडल) द्वारा अनुवादों को देखता है।

### UI अनुवाद संकेत

`buildUIPromptMessages` सिस्टम + उपयोगकर्ता संदेशों का निर्माण करता है जो:

- स्रोत और लक्ष्य भाषाओं की पहचान करते हैं (`localeDisplayNames` या `ui-languages.json` से डिस्प्ले नाम द्वारा)।
- स्ट्रिंग्स की एक JSON सरणी भेजते हैं और अनुवाद की JSON सरणी वापस प्राप्त करने का अनुरोध करते हैं।
- उपलब्ध होने पर शब्दावली संकेत शामिल करते हैं।

`OpenRouterClient.translateUIBatch` प्रत्येक मॉडल को क्रम में आज़माता है, पार्स या नेटवर्क त्रुटियों पर वापस जाता है। CLI `openrouter.translationModels` (या पुराने डिफ़ॉल्ट/फॉलबैक) से उस सूची का निर्माण करता है; `translate-ui` के लिए, वैकल्पिक `ui.preferredModel` सेट होने पर इसे आगे जोड़ दिया जाता है (शेष के खिलाफ डुप्लिकेट हटाकर)।

---

## कार्यप्रवाह 2 - दस्तावेज़ अनुवाद आंतरिक

```text
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── URLs, admonitions, anchors replaced with tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → OpenRouterClient.translateDocumentBatch
      │
      ▼  PlaceholderHandler.restoreAfterTranslation
final text  ──────────────────── placeholders restored
      │
      ▼  resolveDocumentationOutputPath
output file  ─────────────────── Docusaurus layout or flat layout
```

### निकालने वाले

सभी एक्सट्रैक्टर `BaseExtractor` का विस्तार करते हैं और `extract(content, filepath): Segment[]` को लागू करते हैं।

- `MarkdownExtractor` - मार्कडाउन को टाइप किए गए खंडों में विभाजित करता है: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`। गैर-अनुवाद योग्य खंडों (कोड ब्लॉक, रॉ HTML) को शाब्दिक रूप से संरक्षित किया जाता है।
- `JsonExtractor` - डॉक्यूसॉरस JSON लेबल फ़ाइलों से स्ट्रिंग मान निकालता है।
- `SvgExtractor` - SVG से `<text>`, `<title>`, और `<desc>` सामग्री निकालता है (`translate-svg` द्वारा `config.svg` के तहत संपत्तियों के लिए उपयोग किया जाता है, `translate-docs` द्वारा नहीं)।

### प्लेसहोल्डर संरक्षण

अनुवाद से पहले, संवेदनशील सिंटैक्स को LLM भ्रष्टाचार को रोकने के लिए अपारदर्शी टोकन से बदल दिया जाता है:

1. **एडमॉनिशन मार्कर** (`:::note`, `:::`) - सटीक मूल पाठ के साथ पुनर्स्थापित किए जाते हैं।
2. **डॉक एंकर** (HTML `<a id="…">`, डॉक्यूसॉरस शीर्षक `{#…}`) - यथावत संरक्षित किए जाते हैं।
3. **मार्कडाउन URL** (`](url)`, `src="../…"`) - अनुवाद के बाद एक मैप से पुनर्स्थापित किए जाते हैं।

### कैश (`TranslationCache`)

SQLite डेटाबेस (`node:sqlite` के माध्यम से) `(source_hash, locale)` द्वारा कुंजीबद्ध पंक्तियों को `translated_text`, `model`, `filepath`, `last_hit_at`, और संबंधित फ़ील्ड्स के साथ संग्रहीत करता है। हैश सामान्यीकृत सामग्री (व्हाइटस्पेस संकुचित) के SHA-256 के पहले 16 हेक्स वर्ण हैं।

प्रत्येक रन पर, सेगमेंट को हैश × लोकेल द्वारा देखा जाता है। केवल कैश मिस LLM को जाते हैं। अनुवाद के बाद, वर्तमान अनुवाद स्कोप में उन सेगमेंट पंक्तियों के लिए `last_hit_at` रीसेट कर दिया जाता है जिन पर हिट नहीं हुई थी। `cleanup` पहले `sync --force-update` चलाता है, फिर पुरानी सेगमेंट पंक्तियों (null `last_hit_at` / खाली filepath) को हटाता है, `file_tracking` कुंजियों को तब प्रून करता है जब हल किया गया सोर्स पथ डिस्क पर गायब होता है (`doc-block:…`, `svg-assets:…`, आदि), और उन अनुवाद पंक्तियों को हटाता है जिनकी मेटाडेटा filepath एक गायब फ़ाइल की ओर इशारा करती है; यह `--no-backup` पास नहीं किए जाने तक पहले `cache.db` का बैकअप लेता है।

`translate-docs` कमांड **फ़ाइल ट्रैकिंग** का भी उपयोग करता है ताकि अपरिवर्तित स्रोतों के साथ मौजूदा आउटपुट पूरी तरह से काम को छोड़ सकें। `--force-update` फ़ाइल प्रोसेसिंग को फिर से चलाता है जबकि अभी भी सेगमेंट कैश का उपयोग करता है; `--force` फ़ाइल ट्रैकिंग को साफ़ करता है और API अनुवाद के लिए सेगमेंट कैश रीड को बायपास करता है। पूर्ण फ्लैग टेबल के लिए [प्रारंभ करना](GETTING_STARTED.hi.md#cache-behaviour-and-translate-docs-flags) देखें।

**बैच प्रॉम्प्ट प्रारूप:** `translate-docs --prompt-format` केवल `OpenRouterClient.translateDocumentBatch` के लिए XML (`<seg>` / `<t>`) या JSON सरणी/ऑब्जेक्ट आकृतियों का चयन करता है; निष्कर्षण, प्लेसहोल्डर और सत्यापन अपरिवर्तित रहते हैं। [बैच प्रॉम्प्ट प्रारूप](GETTING_STARTED.hi.md#batch-prompt-format) देखें।

### आउटपुट पथ रिज़ॉल्यूशन

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` एक स्रोत.सापेक्ष पथ को आउटपुट पथ पर मैप करता है:

- `nested` शैली (डिफ़ॉल्ट): मार्कडाउन के लिए `{outputDir}/{locale}/{relPath}`।
- `docusaurus` शैली: `docsRoot` के तहत, आउटपुट `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}` का उपयोग करते हैं; `docsRoot` के बाहर के मार्ग नेस्टेड लेआउट पर वापस आ जाते हैं।
- `flat` शैली: `{outputDir}/{stem}.{locale}{extension}`। जब `flatPreserveRelativeDir` `true` होता है, तो स्रोत उपनिर्देशिकाओं को `outputDir` के तहत बरकरार रखा जाता है।
- **कस्टम** `pathTemplate`: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` का उपयोग करके कोई भी मार्कडाउन लेआउट।
- **कस्टम** `jsonPathTemplate`: JSON लेबल फ़ाइलों के लिए एक अलग कस्टम लेआउट, समान प्लेसहोल्डर का उपयोग करके।
- `linkRewriteDocsRoot` सपाट-लिंक पुनःलेखक को सही उपसर्ग की गणना करने में मदद करता है जब अनुवादित आउटपुट डिफ़ॉल्ट प्रोजेक्ट रूट के बजाय कहीं और स्थित होता है।

### फ्लैट लिंक रीराइटिंग

जब `markdownOutput.style === "flat"` होता है, तो अनुवादित मार्कडाउन फ़ाइलें स्रोत के साथ लोकेल सफ़िक्स के साथ रखी जाती हैं। पृष्ठों के बीच रिलेटिव लिंक्स को रीराइट किया जाता है ताकि `readme.de.md` में `[Guide](../guide.md)` `guide.de.md` की ओर इशारा करे। `rewriteRelativeLinks` द्वारा नियंत्रित (कस्टम `pathTemplate` के बिना फ्लैट शैली के लिए स्वचालित रूप से सक्षम)।

---

## साझा अवसंरचना

### `OpenRouterClient`

ओपनराउटर चैट पूर्णता API को रैप करता है। प्रमुख व्यवहार:

- **मॉडल फॉलबैक**: क्रम में हल की गई सूची में प्रत्येक मॉडल का प्रयास करता है; HTTP त्रुटियों या पार्स विफलताओं पर फॉल बैक करता है। UI अनुवाद पहले `ui.preferredModel` को हल करता है जब यह मौजूद होता है, फिर `openrouter` मॉडल।
- **रेट लिमिटिंग**: 429 प्रतिक्रियाओं का पता लगाता है, `retry-after` (या 2 सेकंड) का इंतजार करता है, एक बार पुनः प्रयास करता है।
- **प्रॉम्प्ट कैशिंग**: सिस्टम संदेश को `cache_control: { type: "ephemeral" }` के साथ भेजा जाता है ताकि समर्थित मॉडलों पर प्रॉम्प्ट कैशिंग सक्षम हो सके।
- **डीबग ट्रैफिक लॉग**: यदि `debugTrafficFilePath` सेट है, तो अनुरोध और प्रतिक्रिया JSON को एक फ़ाइल में जोड़ा जाता है।

### कॉन्फ़िग लोडिंग

`loadI18nConfigFromFile(configPath, cwd)` पाइपलाइन:

1. `ai-i18n-tools.config.json` (JSON) को पढ़ें और पार्स करें।
2. `mergeWithDefaults` - `defaultI18nConfigPartial` के साथ गहराई से मर्ज करें, और किसी भी `documentations[].sourceFiles` प्रविष्टियों को `contentPaths` में मर्ज करें।
3. `expandTargetLocalesFileReferenceInRawInput` - यदि `targetLocales` एक फ़ाइल पथ है, तो मैनिफेस्ट को लोड करें और स्थानीय कोड में विस्तारित करें; `uiLanguagesPath` सेट करें।
4. `expandDocumentationTargetLocalesInRawInput` - प्रत्येक `documentations[].targetLocales` प्रविष्टि के लिए समान।
5. `parseI18nConfig` - Zod मान्यता + `validateI18nBusinessRules`।
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, आदि लागू करें।
7. `augmentConfigWithUiLanguagesFile` - मैनिफेस्ट डिस्प्ले नाम संलग्न करें।

### लॉगर

`Logger` `debug`, `info`, `warn`, `error` स्तरों का समर्थन करता है जिसमें ANSI रंग आउटपुट होता है। विस्तृत मोड (`-v`) `debug` सक्षम करता है। जब `logFilePath` सेट होता है, तो लॉग पंक्तियाँ उस फ़ाइल में भी लिखी जाती हैं।

---

## रनटाइम हेल्पर्स API

ये `'ai-i18n-tools/runtime'` से निर्यातित होते हैं और किसी भी जावास्क्रिप्ट वातावरण (ब्राउज़र, Node.js, Deno, Edge) में काम करते हैं। ये `i18next` या `react-i18next` से **नहीं** आयात करते हैं।

### RTL हेल्पर्स

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### i18next सेटअप फैक्ट्रियां

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

**`setupKeyAsDefaultT`** को सामान्य ऐप प्रवेश बिंदु के रूप में उपयोग करें (key-trim + बहुवचन **`wrapT`** + वैकल्पिक **`translate-ui`** `{sourceLocale}.json`)। एप्लिकेशन वायरिंग के लिए अकेले **`wrapI18nWithKeyTrim`** को कॉल करना **अप्रचलित** है।

**`generate-ui-languages`** के बाद **`localeLoaders`** को **`makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`** के साथ बनाएँ ताकि कुंजियाँ **`targetLocales`** के साथ संरेखित रहें। **`docs/GETTING_STARTED.md`** (रनटाइम वायरिंग) और **`examples/nextjs-app/`** / **`examples/console-app/`** देखें।

### डिस्प्ले हेल्पर्स

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### स्ट्रिंग हेल्पर्स

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## प्रोग्रामेटिक API

सभी सार्वजनिक प्रकार और कक्षाएँ पैकेज रूट से निर्यातित होती हैं। उदाहरण: CLI के बिना Node.js से translate-UI चरण चलाना:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

मुख्य निर्यात:

| निर्यात | विवरण |
|---|---|
| `loadI18nConfigFromFile` | JSON फ़ाइल से कॉन्फ़िग लोड, मर्ज और मान्यता दें। |
| `parseI18nConfig` | एक कच्ची कॉन्फ़िग ऑब्जेक्ट की जांच करें। |
| `TranslationCache` | SQLite कैश - `cacheDir` पथ के साथ उदाहरण बनाएँ। |
| `UIStringExtractor` | JS/TS स्रोत से `t("…")` स्ट्रिंग्स निकालें। |
| `MarkdownExtractor` | मार्कडाउन से अनुवाद योग्य सेगमेंट निकालें। |
| `JsonExtractor` | डॉक्यूसॉरस JSON लेबल फ़ाइलों से निकालें। |
| `SvgExtractor` | SVG फ़ाइलों से निकालें। |
| `OpenRouterClient` | ओपनराउटर को अनुवाद अनुरोध भेजें। |
| `PlaceholderHandler` | अनुवाद के चारों ओर मार्कडाउन वाक्यविन्यास की सुरक्षा/पुनर्स्थापना करें। |
| `splitTranslatableIntoBatches` | सेगमेंट को LLM-आकार के बैच में समूहित करें। |
| `validateTranslation` | अनुवाद के बाद संरचनात्मक जांच करें। |
| `resolveDocumentationOutputPath` | अनुवादित दस्तावेज़ के लिए आउटपुट फ़ाइल पथ को हल करें। |
| `Glossary` / `GlossaryMatcher` | अनुवाद शब्दावली लोड और लागू करें। |
| `runTranslateUI` | प्रोग्रामेटिक ट्रांसलेट-यूआई प्रवेश बिंदु। |

---

## एक्सटेंशन पॉइंट्स

### कस्टम फ़ंक्शन नाम (UI निष्कर्षण)

कॉन्फ़िग के माध्यम से गैर-मानक अनुवाद फ़ंक्शन नाम जोड़ें:

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### कस्टम निष्कर्षणकर्ता

पैकेज से `ContentExtractor` लागू करें:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

इसे `doc-translate.ts` उपयोगिताओं को प्रोग्रामेटिक रूप से आयात करके दस्तावेज़-अनुवाद पाइपलाइन में पास करें।

### कस्टम आउटपुट पथ

किसी भी फ़ाइल लेआउट के लिए `markdownOutput.pathTemplate` का उपयोग करें:

```json
{
  "documentations": [
    {
      "markdownOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
