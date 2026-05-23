<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: पैकेज अवलोकन

`ai-i18n-tools` की आंतरिक वास्तुकला, इसके विभिन्न घटकों के एकीकरण तथा दो मुख्य कार्यप्रवाहों के कार्यान्वयन का वर्णन इस दस्तावेज़ में किया गया है।

व्यावहारिक उपयोग निर्देशों के लिए, [GETTING_STARTED.md](GETTING_STARTED.hi.md) देखें। अनुवादित दस्तावेज़ों में स्क्रीनशॉट्स और चित्रित SVG के लिए, [LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.hi.md) देखें।

<small>**अन्य भाषाओं में पढ़ें:** </small>
<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [हिन्दी](./PACKAGE_OVERVIEW.hi.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [中文 (中国大陆)](./PACKAGE_OVERVIEW.zh-CN.md) · [中文 (台灣)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**विषय सूची**

- [आर्किटेक्चर अवलोकन](#architecture-overview)
- [स्रोत ट्री](#source-tree)
- [वर्कफ़्लो 1 - यूआई अनुवाद आंतरिक](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [फ्लैट स्थानीय फ़ाइलें](#flat-locale-files)
  - [यूआई अनुवाद संकेत](#ui-translation-prompts)
- [वर्कफ़्लो 2 - दस्तावेज़ अनुवाद आंतरिक](#workflow-2---document-translation-internals)
  - [एक्सट्रैक्टर](#extractors)
  - [शीर्षक एंकर सम्मिलन (`write-heading-ids` CLI)](#heading-anchor-insertion-write-heading-ids-cli)
  - [प्लेसहोल्डर संरक्षण](#placeholder-protection)
  - [कैश (`TranslationCache`)](#cache-translationcache)
  - [आउटपुट पथ संकल्प](#output-path-resolution)
  - [फ्लैट लिंक पुनःलेखन](#flat-link-rewriting)
- [साझा बुनियादी ढांचा](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [कॉन्फ़िग लोडिंग](#config-loading)
  - [लॉगर](#logger)
- [रनटाइम हेल्पर्स एपीआई](#runtime-helpers-api)
  - [आरटीएल हेल्पर्स](#rtl-helpers)
  - [i18next सेटअप फैक्ट्रियाँ](#i18next-setup-factories)
  - [डिस्प्ले हेल्पर्स](#display-helpers)
  - [स्ट्रिंग हेल्पर्स](#string-helpers)
- [प्रोग्रामेटिक एपीआई](#programmatic-api)
- [एक्सटेंशन पॉइंट्स](#extension-points)
  - [कस्टम फ़ंक्शन नाम (यूआई एक्सट्रैक्शन)](#custom-function-names-ui-extraction)
  - [कस्टम एक्सट्रैक्टर्स](#custom-extractors)
  - [कस्टम आउटपुट पथ](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## वास्तुकला अवलोकन

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, write-heading-ids, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

जो कुछ भी उपभोक्ता प्रोग्रामेटिक रूप से आवश्यकता होता है, उसे `src/index.ts` से पुनः निर्यात किया जाता है।

---

<a id="source-tree"></a>
## स्रोत ट्री

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
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
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
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
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## कार्यप्रवाह 1 - यूआई अनुवाद आंतरिक

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

<a id="uistringextractor"></a>
### `UIStringExtractor`

`i18next-scanner` के `Parser.parseFuncFromString` का उपयोग किसी भी JS/TS फ़ाइल में `t("literal")` और `i18n.t("literal")` कॉल खोजने के लिए करता है। फ़ंक्शन नाम और फ़ाइल एक्सटेंशन कॉन्फ़िगर करने योग्य हैं। `extract` **गैर-स्कैनर इनपुट को एक ही कैटलॉग में भी मर्ज करता है:** प्रोजेक्ट `package.json` `description` जब `reactExtractor.includePackageDescription` सक्षम है (डिफ़ॉल्ट), और `ui-languages.json` से प्रत्येक `englishName` जब `reactExtractor.includeUiLanguageEnglishNames` `true` है और `uiLanguagesPath` सेट है (स्रोत में पहले से मिली स्ट्रिंग्स को प्राथमिकता रहती है)। सेगमेंट हैश ट्रिम की गई स्रोत स्ट्रिंग के **MD5 के पहले 8 हेक्स अक्षर** होते हैं — ये `strings.json` में कुंजियाँ बन जाते हैं।

<a id="stringsjson"></a>
### `strings.json`

मास्टर कैटलॉग का आकार इस प्रकार होता है:

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

`models` (वैकल्पिक) — प्रति स्थानिकता, उस स्थानिकता के लिए अंतिम सफल `translate-ui` रन के बाद कौन सा मॉडल उस अनुवाद का उत्पादन करता है (या `user-edited` यदि पाठ `editor` वेब यूआई से सहेजा गया था)। `locations` (वैकल्पिक) — जहाँ `extract` ने स्ट्रिंग पाई (स्कैनर + पैकेज विवरण पंक्ति; मैनिफेस्ट-केवल `englishName` स्ट्रिंग्स `locations` को छोड़ सकते हैं)।

`extract` नए कुंजियाँ जोड़ता है और स्कैन में अभी भी मौजूद कुंजियों के लिए मौजूदा `translated` / `models` डेटा को बरकरार रखता है (स्कैनर लिटरल्स, वैकल्पिक विवरण, वैकल्पिक मैनिफेस्ट `englishName`)। `translate-ui` लापता `translated` प्रविष्टियों को भरता है, उन स्थानिकताओं के लिए `models` को अपडेट करता है जिनका अनुवाद करता है, और फ्लैट स्थानिक फ़ाइलें लिखता है।

`ui-languages.json` **मैनिफेस्ट** — `{ code, label, englishName, direction }` (BCP-47 `code`, यूआई `label`, संदर्भ `englishName`, `"ltr"` या `"rtl"`) की JSON सरणी। `generate-ui-languages` का उपयोग `sourceLocale` + `targetLocales` और बंडल किए गए मास्टर `data/ui-languages-complete.json` से एक प्रोजेक्ट फ़ाइल बनाने के लिए करें।

<a id="flat-locale-files"></a>
### सपाट स्थानीयकरण फ़ाइलें

प्रत्येक लक्ष्य स्थानिकता को स्रोत स्ट्रिंग → अनुवाद (कोई `models` फ़ील्ड नहीं) मैप करने वाली एक फ्लैट JSON फ़ाइल (`de.json`) प्राप्त होती है:

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next इन्हें संसाधन बंडल के रूप में लोड करता है और स्रोत स्ट्रिंग द्वारा अनुवाद की खोज करता है (कुंजी-के-रूप-में-डिफ़ॉल्ट मॉडल)।

<a id="ui-translation-prompts"></a>
### यूआई अनुवाद संकेत

`buildUIPromptMessages` सिस्टम + उपयोगकर्ता संदेशों का निर्माण करता है जो:

- स्रोत और लक्ष्य भाषाओं की पहचान करें (`localeDisplayNames` या `ui-languages.json` से प्रदर्शन नाम द्वारा)।
- स्ट्रिंग्स की एक JSON सरणी भेजें और अनुवादों की JSON सरणी प्राप्त करें।
- जब उपलब्ध हो तो शब्दावली सुझाव शामिल करें।

`OpenRouterClient.translateUIBatch` प्रत्येक मॉडल को क्रम में आज़माता है, पार्स या नेटवर्क त्रुटियों पर वापस जाता है। CLI `openrouter.translationModels` (या पुराने डिफ़ॉल्ट/फॉलबैक) से उस सूची का निर्माण करता है; `translate-ui` के लिए, वैकल्पिक `ui.preferredModel` को सेट होने पर आगे जोड़ा जाता है (शेष के खिलाफ डुप्लिकेट हटाकर)।

---

<a id="workflow-2---document-translation-internals"></a>
## कार्यप्रवाह 2 - दस्तावेज़ अनुवाद आंतरिक

```text
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── HTML tags, admonitions, anchors, MDX comments/JSX/braces,
                                URLs, inline code, emphasis masked as tokens
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

<a id="extractors"></a>
### निकासी उपकरण

सभी एक्सट्रैक्टर `BaseExtractor` का विस्तार करते हैं और `extract(content, filepath): Segment[]` को लागू करते हैं।

- `MarkdownExtractor` - मार्कडाउन को टाइप किए गए खंडों में विभाजित करता है: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`। YAML फ्रंटमैटर को **गैर-अनुवर्तनीय** के रूप में वर्गीकृत किया गया है (`slug`, `id`, और अन्य रूटिंग कुंजियाँ स्थिर रहती हैं)। शीर्ष-स्तरीय `export ...` ब्लॉक (उदाहरण के लिए, रिएक्ट घटक परिभाषाएँ) को मौजूदा `import ...` हैंडलिंग के साथ गैर-अनुवर्तनीय `other` खंडों के रूप में वर्गीकृत किया गया है। बड़े अक्षर JSX टैग के साथ शुरू होने वाले बहु-पंक्ति ब्लॉक (उदाहरण के लिए, एक `<Tabs>` ब्लॉक) को अनुवर्तनीय पैराग्राफ के रूप में वर्गीकृत किया गया है। गैर-अनुवर्तनीय खंड (कोड ब्लॉक, मूल HTML) को शाब्दिक रूप से संरक्षित किया जाता है।
- `JsonExtractor` - डॉक्यूसॉरस JSON लेबल फ़ाइलों से स्ट्रिंग मान निकालता है (डॉक्यूसॉरस UI कैटलॉग, MDX बॉडी नहीं)।
- `SvgExtractor` - SVG से `<text>`, `<title>`, और `<desc>` सामग्री निकालता है (`config.svg` के तहत फ़ाइलों के लिए `translate-svg` द्वारा उपयोग किया जाता है, `translate-docs` द्वारा नहीं)।

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### हेडिंग एंकर सम्मिलन (`write-heading-ids` CLI)

`write-heading-ids` कमांड दस्तावेज़ीकरण मार्कडाउन के लिए एक **स्थानीय, गैर-LLM** प्रीप्रोसेसर है। कार्यान्वयन: `src/cli/write-heading-ids.ts` फ़ाइल खोज को समन्वित करता है; `src/markdown/write-heading-ids-core.ts` पंक्तियों को पार्स करता है और एंकर सम्मिलित करता है।

इसके लिए एक वैध विन्यास की आवश्यकता होती है जिसमें **कम से कम एक `documentations[]` ब्लॉक** हो। प्रत्येक ब्लॉक के लिए यह `contentPaths` के तहत `.md` / `.mdx` फ़ाइलों को एकत्र करता है, प्रोजेक्ट के `.translate-ignore` नियमों को लागू करता है (दस्तावेज़ अनुवाद के समान अवधारणा), और वैकल्पिक रूप से `--path` / `--file` के साथ एक उप-वृक्ष तक सीमित कर सकता है। प्रत्येक फ़ाइल को `applyHeadingAnchorsToMarkdown` के साथ परिवर्तित किया जाता है: प्रत्येक **सपाट ATX शीर्षक** (`# …` से `###### …` तक) के लिए, जो फेंस किए गए कोड ब्लॉक के बाहर हो, ऊपरी पंक्ति पर एक खाली HTML पंक्ति `<a id="slug"></a>` डाली जाती है यदि वह अनुपस्थित या पुरानी हो। स्लग एल्गोरिदम सामान्य पारिस्थितिकी तंत्रों से मेल खाते हैं — `github` (डिफ़ॉल्ट), `bitbucket`, `gitlab`, `pymdown` (वैकल्पिक यूनिकोड सामान्यीकरण / प्रतिशत-एन्कोडिंग झंडे), `azure-devops` — ताकि एंकर आईडी मौजूदा उपकरणों (doctoc, PyMdown, आदि) के साथ सुसंगत बने रहें। `--dry-run` लिखे बिना संपादन की सूचना देता है।

यह कमांड `translate-docs` या `sync` के अंदर **नहीं** चलता है; अनुवाद या प्रकाशन से पहले स्रोत फ़ाइलों में स्थिर फ्रैगमेंट आईडी चाहने पर इसे स्पष्ट रूप से चलाएं।

<a id="placeholder-protection"></a>
### स्थानधारक सुरक्षा

अनुवाद से पहले, एलएलएम क्षति को रोकने के लिए संवेदनशील वाक्यविन्यास को अपारदर्शी टोकन के साथ प्रतिस्थापित कर दिया जाता है, इस क्रम में लागू किया जाता है (पुनर्स्थापना विपरीत है):

1. **HTML टैग और टिप्पणियाँ** (`<strong>`, `<!-- ... -->`, आदि) - एक ज्ञात अनुमति सूची से लोअरकेस HTML टैग को `{{HTM_N}}` टोकन के साथ प्रतिस्थापित किया जाता है। बड़े अक्षर JSX टैग (`<Highlight>`, `<Tabs>`, `</Tab>`) को MDX परत द्वारा अलग से संभाला जाता है (चरण 4)।
2. **उपदेशक सूचक** (`:::note`, `:::`) - खोलने वाली पंक्ति पर केवल निर्देश उपसर्ग को `{{ADM_OPEN_N}}` के साथ प्रतिस्थापित किया जाता है; कोई भी समान-पंक्ति शीर्षक मॉडल द्वारा अनुवाद के लिए छोड़ दिया जाता है। मूल पाठ के सटीक रूप में पुनर्स्थापित किया जाता है।
3. **दस्तावेज़ एंकर** (HTML `<a id="…">`, डॉक्यूसॉरस शीर्षक `{#…}`) - शाब्दिक रूप से संरक्षित किए जाते हैं।
4. **केवल MDX निर्माण** (`src/processors/mdx-placeholders.ts`):
   - **MDX टिप्पणियाँ** (`{/* … */}`, Docusaurus heading-id फॉर्म `{/* #my-id */}` सहित) को `{{MDX_N}}` के साथ प्रतिस्थापित किया जाता है।
   - **बड़े अक्षर JSX टैग** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - `{{MDX_N}}` के रूप में संरक्षित किए जाते हैं, अनुवर्तनीय स्ट्रिंग विशेषताओं (`label`, `tooltip`, `aria-label`) को टैग के अंदर `{{JXA_N}}` में पुनर्लेखित किया जाता है; `label:` अंदर `<Tabs values={[ { label: '…' } ]}>` ऑब्जेक्ट लिटरल और `<TabItem value="…">` (जब कोई `label` विशेषता मौजूद नहीं होती है, लोअरकेस स्लग-जैसे मानों को छोड़कर) को भी निकाला जाता है। खंड में `||JXA_N: …||` पंक्तियों के रूप में जोड़ा जाता है, `restoreMdx` द्वारा वापस मर्ज किया जाता है।
   - **MDX ब्रेस एक्सप्रेशन** (`{frontMatter.title}`, `style={{…}}`) - गहराई-जागरूक मिलान, `{{MDX_N}}` के साथ प्रतिस्थापित किया जाता है।
5. **मार्कडाउन URL** (`](url)`, `src="../../docs/…"`) - अनुवाद के बाद एक मैप से पुनर्स्थापित किया जाता है।
6. **इनलाइन कोड स्पैन** (`` `code` ``) और **बोल्ड-लपेटे इनलाइन कोड** (`**`code`**`) - संरक्षित रहते हैं।
7. **मार्कडाउन पर जोर** (वैकल्पिक, CJK/RTL स्थानीयकरण के लिए स्वचालित रूप से सक्षम) - जोर डिलीमिटर मास्क किए जाते हैं।

<a id="cache-translationcache"></a>
### कैश (`TranslationCache`)

SQLite डेटाबेस (`node:sqlite` के माध्यम से) `(source_hash, locale)` द्वारा कुंजीबद्ध पंक्तियों को `translated_text`, `model`, `filepath`, `last_hit_at`, और संबंधित क्षेत्रों के साथ संग्रहीत करता है। हैश सामान्यीकृत सामग्री के SHA-256 के पहले 16 हेक्स अक्षर हैं (स्थान संकुचित)।

प्रत्येक रन पर, सेगमेंट्स को हैश × लोकेल द्वारा खोजा जाता है। केवल कैश मिस LLM पर जाते हैं। अनुवाद के बाद, वर्तमान अनुवाद स्कोप में उन सेगमेंट पंक्तियों के लिए `last_hit_at` को रीसेट कर दिया जाता है जिन्हें हिट नहीं किया गया था। `cleanup` पहले `sync --force-update` चलाता है, फिर स्टेल सेगमेंट पंक्तियों को हटा देता है (null `last_hit_at` / खाली फ़ाइलपाथ), जब डिस्क पर स्रोत पथ गायब होता है तो `file_tracking` कुंजियों को हटा देता है (`doc-block:…`, `svg-files:…`, आदि), और उन अनुवाद पंक्तियों को हटा देता है जिनकी मेटाडेटा फ़ाइलपाथ गायब फ़ाइल की ओर इशारा करती है; यह `--no-backup` पारित न होने पर पहले `cache.db` का बैकअप लेता है।

`translate-docs` कमांड **फ़ाइल ट्रैकिंग** का भी उपयोग करता है ताकि अपरिवर्तित स्रोतों के साथ मौजूद आउटपुट पूरी तरह से काम छोड़ सकें। `--force-update` खंड कैश का उपयोग करते हुए फ़ाइल प्रसंस्करण को फिर से चलाता है; `--force` फ़ाइल ट्रैकिंग को साफ़ कर देता है और API अनुवाद के लिए खंड कैश पढ़ने से बचता है। पूर्ण झंडा तालिका के लिए [शुरुआत](GETTING_STARTED.hi.md#cache-behaviour-and-translate-docs-flags) देखें।

**बैच प्रॉम्प्ट स्वरूप:** `translate-docs --prompt-format` केवल `OpenRouterClient.translateDocumentBatch` के लिए XML (`<seg>` / `<t>`) या JSON सरणी/वस्तु आकृतियों का चयन करता है; निष्कर्षण, प्लेसहोल्डर और मान्यता अपरिवर्तित है। [बैच प्रॉम्प्ट स्वरूप](GETTING_STARTED.hi.md#batch-prompt-format) देखें।

<a id="output-path-resolution"></a>
### आउटपुट पथ संकल्प

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` स्रोत-सापेक्ष पथ को आउटपुट पथ पर मैप करता है:

- `nested` शैली (डिफ़ॉल्ट): मार्कडाउन के लिए `{outputDir}/{locale}/{relPath}`।
- `doc-system` शैली: `docsRoot` के अंतर्गत, आउटपुट `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` का उपयोग करते हैं; `docsRoot` के बाहर के मार्ग नेस्टेड लेआउट पर वापस आ जाते हैं। उपनाम: `docusaurus` (डिफ़ॉल्ट `localeSubpath` = डॉक्यूसॉरस प्लगइन मार्ग), `astro-starlight` (डिफ़ॉल्ट खाली `localeSubpath`)।
- `flat` शैली: `{outputDir}/{stem}.{locale}{extension}`। जब `flatPreserveRelativeDir` `true` होता है, तो स्रोत उपडायरेक्टरियाँ `outputDir` के अंतर्गत बनी रहती हैं।
- **कस्टम** `pathTemplate`: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` का उपयोग करके कोई भी मार्कडाउन लेआउट।
- **कस्टम** `jsonPathTemplate`: JSON लेबल फ़ाइलों के लिए अलग कस्टम लेआउट, समान प्लेसहोल्डर का उपयोग करके।
- `linkRewriteDocsRoot` फ्लैट-लिंक पुनःलेखक को सही उपसर्ग की गणना करने में मदद करता है जब अनुवादित आउटपुट डिफ़ॉल्ट प्रोजेक्ट रूट के बजाय कहीं और स्थित होता है।

<a id="flat-link-rewriting"></a>
### सपाट लिंक पुन:लेखन

जब `markdownOutput.style === "flat"`, अनुवादित मार्कडाउन फ़ाइलों को स्रोत के साथ स्थानीय उपसर्गों के साथ रखा जाता है। पृष्ठों के बीच सापेक्ष लिंक पुनः लिखे जाते हैं ताकि `[Guide](../../docs/guide.md)` में `readme.de.md`, `guide.de.md` की ओर इशारा करे। इसे `rewriteRelativeLinks` द्वारा नियंत्रित किया जाता है (बिना कस्टम `pathTemplate` के फ्लैट शैली के लिए स्वचालित रूप से सक्षम)। उसी पास में `postProcessing.regexAdjustments` चलने से पहले गैर-मार्कडाउन एसेट URL के लिए प्रति-फ़ाइल गहराई उपसर्ग को अग्रणी बनाया जाता है — [स्थानीय एसेट गाइड](LOCALE-ASSETS-GUIDE.hi.md#the-flat-link-rewriter-and-two-step-flow) देखें।

---

<a id="shared-infrastructure"></a>
## साझा बुनियादी ढांचा

<a id="openrouterclient"></a>
### `OpenRouterClient`

ओपनराउटर चैट पूर्ति API को लपेटता है। मुख्य व्यवहार:

- **मॉडल फॉलबैक**: हर मॉडल को हल की गई सूची में क्रम से आज़माता है; HTTP त्रुटियों या पार्स विफलताओं पर वापस जाता है। UI अनुवाद मौजूद होने पर पहले `ui.preferredModel` को हल करता है, फिर `openrouter` मॉडल।
- **अनुरोध टाइमआउट**: `openrouter.requestTimeoutMs` (डिफ़ॉल्ट 30 सेकंड) प्रत्येक चैट-पूर्ति अनुरोध को `AbortSignal.timeout` के माध्यम से रद्द कर देता है। जब CLI कैटलॉग लोड करता है तो वही मान `GET /models` पर लागू होता है (उदाहरण के लिए `check-models` और वैकल्पिक प्री-फ्लाइट फ़िल्टर जो अज्ञात मॉडल आईडी को छोड़ देता है)।
- **दर सीमित करना**: 429 प्रतिक्रियाओं का पता लगाता है, `retry-after` (या 2 सेकंड) तक प्रतीक्षा करता है, एक बार पुनः प्रयास करता है।
- **डीबग ट्रैफ़िक लॉग**: यदि `debugTrafficFilePath` सेट है, तो अनुरोध और प्रतिक्रिया JSON को एक फ़ाइल में जोड़ देता है।

<a id="config-loading"></a>
### कॉन्फ़िग लोडिंग

`loadI18nConfigFromFile(configPath, cwd)` पाइपलाइन:

1. `ai-i18n-tools.config.json` पढ़ें और पार्स करें (JSON)।
2. `mergeWithDefaults` - `defaultI18nConfigPartial` के साथ गहराई से मर्ज करें, और किसी भी `documentations[].sourceFiles` प्रविष्टियों को `contentPaths` में मर्ज करें।
3. `expandTargetLocalesFileReferenceInRawInput` - यदि `targetLocales` एक फ़ाइल पथ है, तो मैनिफेस्ट लोड करें और स्थानीय कोड में विस्तार करें; `uiLanguagesPath` सेट करें।
4. `expandDocumentationTargetLocalesInRawInput` - प्रत्येक `documentations[].targetLocales` प्रविष्टि के लिए समान।
5. `parseI18nConfig` - Zod वैधीकरण + `validateI18nBusinessRules`।
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, आदि लागू करें।
7. `augmentConfigWithUiLanguagesFile` - मैनिफेस्ट डिस्प्ले नाम संलग्न करें।

<a id="logger"></a>
### लॉगर

`Logger` `debug`, `info`, `warn`, `error` स्तरों को ANSI रंग आउटपुट के साथ समर्थन करता है। विस्तृत मोड (`-v`) `debug` को सक्षम करता है। जब `logFilePath` सेट होता है, तो लॉग लाइनों को उस फ़ाइल में भी लिखा जाता है।

---

<a id="runtime-helpers-api"></a>
## रनटाइम सहायक API

इन्हें `'ai-i18n-tools/runtime'` से निर्यात किया जाता है और किसी भी JavaScript वातावरण (ब्राउज़र, नोड.जेएस, डेनो, एज) में काम करते हैं। वे `i18next` या `react-i18next` से आयात **नहीं** करते हैं।

<a id="rtl-helpers"></a>
### RTL सहायक

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next सेटअप फैक्ट्रियाँ

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

आम ऐप प्रवेश बिंदु के रूप में `setupKeyAsDefaultT` का उपयोग करें (कुंजी-ट्रिम + बहुवचन `wrapT` + वैकल्पिक `translate-ui` `{sourceLocale}.json`)। एप्लिकेशन वायरिंग के लिए केवल `wrapI18nWithKeyTrim` को कॉल करना **पुराना** माना जाता है।

`localeLoaders` को `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` के साथ बनाएं ताकि `generate-ui-languages` के बाद `targetLocales` के साथ कुंजियाँ संरेखित रहें। देखें `docs/GETTING_STARTED.md` (रनटाइम वायरिंग) और `examples/nextjs-app/` / `examples/console-app/`।

<a id="display-helpers"></a>
### प्रदर्शन सहायक

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### स्ट्रिंग सहायक

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## प्रोग्रामेटिक API

सभी सार्वजनिक प्रकार और वर्ग पैकेज रूट से निर्यात किए जाते हैं। उदाहरण: CLI के बिना नोड.जेएस से UI अनुवाद चरण चलाना:

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
| `loadI18nConfigFromFile` | JSON फ़ाइल से कॉन्फ़िग लोड, मर्ज और वैधता सत्यापित करें। |
| `parseI18nConfig` | एक कच्ची कॉन्फ़िग वस्तु की वैधता सत्यापित करें। |
| `TranslationCache` | SQLite कैश - एक `cacheDir` पथ के साथ उदाहरण बनाएँ। |
| `UIStringExtractor` | JS/TS स्रोत से `t("…")` स्ट्रिंग्स निकालें। |
| `MarkdownExtractor` | मार्कडाउन से अनुवाद योग्य खंड निकालें। |
| `JsonExtractor` | डॉक्यूसॉरस JSON लेबल फ़ाइलों से निकालें (UI कैटलॉग, MDX बॉडी नहीं)। |
| `SvgExtractor` | SVG फ़ाइलों से निकालें। |
| `OpenRouterClient` | OpenRouter को अनुवाद अनुरोध भेजें। |
| `PlaceholderHandler` | अनुवाद के आसपास मार्कडाउन वाक्यविन्यास की रक्षा/पुनर्स्थापना करें (HTML टैग, उपदेशक, एंकर, MDX टिप्पणियाँ/JSX/ब्रेस, URL, इनलाइन कोड, जोर)। |
| `protectMdx` / `restoreMdx` | MDX टिप्पणियों, JSX टैग, ब्रेस एक्सप्रेशन और JSX स्ट्रिंग विशेषताओं की रक्षा/पुनर्स्थापना करें (`PlaceholderHandler` द्वारा कहा जाता है; सीधे उपयोग के लिए निर्यात भी किया गया)। |
| `splitTranslatableIntoBatches` | खंडों को LLM-आकार के बैच में समूहित करें। |
| `validateTranslation` | अनुवाद के बाद संरचनात्मक जांच। |
| `resolveDocumentationOutputPath` | अनुवादित दस्तावेज़ के लिए आउटपुट फ़ाइल पथ को हल करें। |
| `Glossary` / `GlossaryMatcher` | अनुवाद शब्दावली लोड और लागू करें। |
| `runTranslateUI` | प्रोग्रामेटिक अनुवाद-UI प्रवेश बिंदु। |

---

<a id="extension-points"></a>
## एक्सटेंशन बिंदु

<a id="custom-function-names-ui-extraction"></a>
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

<a id="custom-extractors"></a>
### कस्टम एक्सट्रैक्टर

पैकेज से `ContentExtractor` को लागू करें:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

इसे doc-translate पाइपलाइन में `doc-translate.ts` उपयोगिताओं को प्रोग्रामेटिक रूप से आयात करके पास करें।

<a id="custom-output-paths"></a>
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
