---
translation_last_updated: '2026-04-13T00:28:21.363Z'
source_file_mtime: '2026-04-13T00:12:20.082Z'
source_file_hash: 492dc2b02831a77d02ebea5776448ae47f7ef6b42d4c5badaa92fd48201586c2
translation_language: hi
source_file_path: docs/PACKAGE_OVERVIEW.md
---
# ai-i18n-tools: पैकेज अवलोकन

यह दस्तावेज़ `ai-i18n-tools` की आंतरिक वास्तुकला का वर्णन करता है, कि प्रत्येक घटक कैसे एक साथ फिट होता है, और कैसे दो मुख्य कार्यप्रवाह लागू किए जाते हैं।

व्यावहारिक उपयोग निर्देशों के लिए, देखें [GETTING_STARTED.md](GETTING_STARTED.hi.md)।

<small>**अन्य भाषाओं में पढ़ें:** </small>

<small id="lang-list">[en-GB](../../docs/PACKAGE_OVERVIEW.md) · [de](./PACKAGE_OVERVIEW.de.md) · [es](./PACKAGE_OVERVIEW.es.md) · [fr](./PACKAGE_OVERVIEW.fr.md) · [hi](./PACKAGE_OVERVIEW.hi.md) · [ja](./PACKAGE_OVERVIEW.ja.md) · [ko](./PACKAGE_OVERVIEW.ko.md) · [pt-BR](./PACKAGE_OVERVIEW.pt-BR.md) · [zh-CN](./PACKAGE_OVERVIEW.zh-CN.md) · [zh-TW](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**सामग्री की तालिका**

- [वास्तुकला अवलोकन](#architecture-overview)
- [स्रोत पेड़](#source-tree)
- [कार्यप्रवाह 1 - UI अनुवाद आंतरिक](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [फ्लैट स्थानीय फ़ाइलें](#flat-locale-files)
  - [UI अनुवाद संकेत](#ui-translation-prompts)
- [कार्यप्रवाह 2 - दस्तावेज़ अनुवाद आंतरिक](#workflow-2---document-translation-internals)
  - [निकालने वाले](#extractors)
  - [प्लेसहोल्डर सुरक्षा](#placeholder-protection)
  - [कैश (`TranslationCache`)](#cache-translationcache)
  - [आउटपुट पथ समाधान](#output-path-resolution)
  - [फ्लैट लिंक पुनर्लेखन](#flat-link-rewriting)
- [साझा बुनियादी ढांचा](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [कॉन्फ़िग लोड करना](#config-loading)
  - [लॉगर](#logger)
- [रनटाइम हेल्पर्स API](#runtime-helpers-api)
  - [RTL हेल्पर्स](#rtl-helpers)
  - [i18next सेटअप फैक्टरियाँ](#i18next-setup-factories)
  - [डिस्प्ले हेल्पर्स](#display-helpers)
  - [स्ट्रिंग हेल्पर्स](#string-helpers)
- [प्रोग्रामेटिक API](#programmatic-api)
- [विस्तार बिंदु](#extension-points)
  - [कस्टम फ़ंक्शन नाम (UI निकासी)](#custom-function-names-ui-extraction)
  - [कस्टम निकालने वाले](#custom-extractors)
  - [कस्टम आउटपुट पथ](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## वास्तुकला अवलोकन

```
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

```
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

```
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

`i18next-scanner` के `Parser.parseFuncFromString` का उपयोग `t("literal")` और `i18n.t("literal")` कॉल को किसी भी JS/TS फ़ाइल में खोजने के लिए किया जाता है। फ़ंक्शन नाम और फ़ाइल एक्सटेंशन कॉन्फ़िगर करने योग्य हैं, और निकासी में प्रोजेक्ट `package.json` `description` को भी शामिल किया जा सकता है जब `reactExtractor.includePackageDescription` सक्षम हो। खंड हैश **MD5 पहले 8 हेक्स वर्ण** होते हैं ट्रिम किए गए स्रोत स्ट्रिंग के - ये `strings.json` में कुंजी बन जाते हैं।

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

`models` (वैकल्पिक) — प्रति स्थान, जिस मॉडल ने उस स्थान के लिए अंतिम सफल `translate-ui` चलने के बाद उस अनुवाद का उत्पादन किया (या `user-edited` यदि पाठ `editor` वेब यूआई से सहेजा गया था)। `locations` (वैकल्पिक) — जहां `extract` ने स्ट्रिंग पाई।

`extract` नए कुंजियाँ जोड़ता है और स्कैन में अभी भी मौजूद कुंजियों के लिए मौजूदा `translated` / `models` डेटा को बरकरार रखता है। `translate-ui` लुप्त `translated` प्रविष्टियों को भरता है, उन स्थानों के लिए `models` को अपडेट करता है जिनका अनुवाद करता है, और सपाट स्थान फ़ाइलें लिखता है।

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
- स्रोत और लक्ष्य भाषाओं की पहचान करते हैं (प्रदर्शन नाम द्वारा `localeDisplayNames` या `ui-languages.json` से)।
- स्ट्रिंग्स का एक JSON ऐरे भेजते हैं और अनुवादों का एक JSON ऐरे वापस मांगते हैं।
- उपलब्ध होने पर शब्दकोश संकेत शामिल करते हैं।

`OpenRouterClient.translateUIBatch` प्रत्येक मॉडल को क्रम में आज़माता है, पार्स या नेटवर्क त्रुटियों पर वापस जाता है। CLI `openrouter.translationModels` (या पुराने डिफ़ॉल्ट/फॉलबैक) से उस सूची का निर्माण करता है; `translate-ui` के लिए, वैकल्पिक `ui.preferredModel` सेट होने पर इसे आगे जोड़ दिया जाता है (शेष के खिलाफ डुप्लिकेट हटाकर)।

---

## कार्यप्रवाह 2 - दस्तावेज़ अनुवाद आंतरिक

```
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
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

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
| `loadI18nConfigFromFile` | JSON फ़ाइल से कॉन्फ़िग लोड, मर्ज, मान्य करें। |
| `parseI18nConfig` | एक कच्चे कॉन्फ़िग ऑब्जेक्ट को मान्य करें। |
| `TranslationCache` | SQLite कैश - `cacheDir` पथ के साथ इंस्टेंटिएट करें। |
| `UIStringExtractor` | JS/TS स्रोत से `t("…")` स्ट्रिंग्स निकालें। |
| `MarkdownExtractor` | मार्कडाउन से अनुवाद योग्य खंड निकालें। |
| `JsonExtractor` | Docusaurus JSON लेबल फ़ाइलों से निकालें। |
| `SvgExtractor` | SVG फ़ाइलों से निकालें। |
| `OpenRouterClient` | OpenRouter के लिए अनुवाद अनुरोध करें। |
| `PlaceholderHandler` | अनुवाद के चारों ओर मार्कडाउन सिंटैक्स की सुरक्षा/पुनर्स्थापना करें। |
| `splitTranslatableIntoBatches` | खंडों को LLM-आकार के बैचों में समूहित करें। |
| `validateTranslation` | अनुवाद के बाद संरचनात्मक जांचें। |
| `resolveDocumentationOutputPath` | अनुवादित दस्तावेज़ के लिए आउटपुट फ़ाइल पथ हल करें। |
| `Glossary` / `GlossaryMatcher` | अनुवाद शब्दकोश लोड और लागू करें। |
| `runTranslateUI` | प्रोग्रामेटिक translate-UI प्रवेश बिंदु। |

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
