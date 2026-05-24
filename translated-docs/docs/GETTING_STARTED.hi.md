<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: शुरुआत करें

`ai-i18n-tools` पैकेज तीन अलग, मॉड्यूलर वर्कफ़लो प्रदान करता है:

- **कार्यप्रवाह 1 - UI अनुवाद**: किसी भी JS/TS स्रोत से `t("…")` कॉल निकालें, उन्हें OpenRouter के माध्यम से अनुवादित करें, और i18next के लिए तैयार प्रति-स्थानीयता JSON फ़ाइलों को सीधे लिखें।
- **कार्यप्रवाह 2 - दस्तावेज़ अनुवाद**: `docs[].contentPaths` में सूचीबद्ध **मार्कडाउन, MDX, और `.astro` पृष्ठों** का `translate-docs` के माध्यम से अनुवाद करें, स्मार्ट कैशिंग के साथ। वैकल्पिक **Docusaurus कैटलॉग JSON** (`docs[].docusaurusCatalogDir`, `docusaurus write-translations` से) उसी कमांड में अनुवादित किया जाता है जब `features.translateDocs` सक्षम होता है — साइट क्रोम (नेविगेशन पट्टी, फ़ुटर, थीम स्ट्रिंग्स), `docs/` में लेखन नहीं।
- **कार्यप्रवाह 3 - JSON फ़ाइल अनुवाद**: शीर्ष-स्तरीय `json[]`, `features.translateJson`, और `translate-json` के माध्यम से मनमानी गहराई वाले JSON बंडल (उदा. `src/i18n/en/translation.json`) का अनुवाद करें — उन साइटों के लिए जो UI प्रतिलिपि को स्रोत में `t()` के बजाय प्रति-स्थानीयता JSON फ़ाइलों में रखती हैं।

**SVG** संपत्तियाँ `features.translateSVG`, शीर्ष-स्तरीय `svg` ब्लॉक, और `translate-svg` का उपयोग करती हैं (देखें [CLI संदर्भ](#cli-reference))।

**कौन सा वर्कफ़लो?**

- स्रोत में `t()` के माध्यम से उपयोगकर्ता-अभिमुख स्ट्रिंग्स → वर्कफ़लो 1 (`extract` / `translate-ui`)।
- स्थानीयकृत पृष्ठ या डॉक्यूसॉरस शेल JSON → वर्कफ़लो 2 (`translate-docs`)।
- केवल स्वतंत्र नेस्टेड JSON स्थानीयकरण फ़ाइलें → वर्कफ़लो 3 (`translate-json`)।

तीनों वर्कफ़लो ओपनराउटर (कोई भी संगत LLM) का उपयोग करते हैं और एकल कॉन्फ़िगरेशन फ़ाइल साझा करते हैं।

<small>**अन्य भाषाओं में पढ़ें:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**विषय सूची**

- [स्थापना](#installation)
  - [CLI का उपयोग करना](#using-the-cli)
- [त्वरित शुरुआत](#quick-start)
  - [अनुशंसित `package.json` स्क्रिप्ट्स](#recommended-packagejson-scripts)
- [वर्कफ़लो 1 - UI अनुवाद](#workflow-1---ui-translation)
  - [चरण 1: आरंभीकरण](#step-1-initialise)
  - [चरण 2: स्ट्रिंग्स निकालें](#step-2-extract-strings)
  - [एस्ट्रो वेबसाइट (सादा एस्ट्रो, स्टारलाइट नहीं)](#astro-website-plain-astro-not-starlight)
  - [एस्ट्रो वेबसाइट UI स्ट्रिंग्स (SSG)](#astro-website-ui-strings-ssg)
  - [एस्ट्रो वेबसाइट पृष्ठ (विश्लेषण-और-प्रतिस्थापन)](#astro-website-pages-parse-and-replace)
  - [चरण 3: UI स्ट्रिंग्स का अनुवाद करें](#step-3-translate-ui-strings)
  - [XLIFF 2.0 में निर्यात करना (वैकल्पिक)](#exporting-to-xliff-20-optional)
  - [चरण 4: रनटाइम पर i18next को जोड़ें](#step-4-wire-i18next-at-runtime)
    - [`SOURCE_LOCALE` को संरेखित रखना](#keeping-source_locale-aligned)
    - [स्थानीयकरण लोडर](#locale-loaders)
    - [रनटाइम सहायक संदर्भ](#runtime-helpers-reference)
  - [स्रोत कोड में `t()` का उपयोग करना](#using-t-in-source-code)
  - [इंटरपोलेशन](#interpolation)
  - [कार्डिनल बहुवचन (`plurals: true`)](#cardinal-plurals-plurals-true)
    - [बहुवचन को कैसे संग्रहीत और उत्सर्जित किया जाता है](#how-plurals-are-stored-and-emitted)
  - [भाषा स्विचर UI](#language-switcher-ui)
  - [RTL भाषाएँ](#rtl-languages)
- [कार्यप्रवाह 2 - दस्तावेज़ अनुवाद](#workflow-2---document-translation)
  - [चरण 1: दस्तावेज़ीकरण के लिए आरंभ करें](#step-1-initialise-for-documentation)
  - [चरण 2: दस्तावेज़ों का अनुवाद करें](#step-2-translate-documents)
    - [जटिल मार्कडाउन और विफल गुणवत्ता जांच](#complex-markdown-and-failed-quality-checks)
    - [कैश व्यवहार और `translate-docs` फ्लैग](#cache-behaviour-and-translate-docs-flags)
    - [बैच प्रॉम्प्ट प्रारूप](#batch-prompt-format)
    - [खंड डुप्लिकेट और SQLite में पथ](#segment-dedupe-and-paths-in-sqlite)
  - [आउटपुट लेआउट](#output-layouts)
    - [जब `docsOutput.style = "flat"` हो तो एंकर लिंक](#anchor-links-when-docsoutputstyle--flat)
    - [अनुवादित दस्तावेज़ों में छवियां और रास्टर संपत्ति](#images-and-raster-assets-in-translated-docs)
    - [भाषा स्विचर (`languageListBlock`)](#language-switcher-languagelistblock)
    - [`pathTemplate` / `jsonPathTemplate` प्लेसहोल्डर](#pathtemplate--jsonpathtemplate-placeholders)
  - [समस्या निवारण](#troubleshooting)
- [वर्कफ़लो 3 - JSON फ़ाइल अनुवाद](#workflow-3---json-file-translation)
  - [चरण 1: नेस्टेड JSON के लिए आरंभीकरण](#step-1-initialise-for-nested-json)
  - [चरण 2: `json[]` कॉन्फ़िगर करें](#step-2-configure-json)
  - [चरण 3: JSON बंडल का अनुवाद करें](#step-3-translate-json-bundles)
  - [वर्कफ़लो 3 बनाम अन्य पाइपलाइन](#workflow-3-vs-other-pipelines)
- [संयुक्त वर्कफ़लो (UI + दस्तावेज़)](#combined-workflow-ui--docs)
  - [मिश्रित दस्तावेज़ीकरण वर्कफ़लो (`docsOutput.style = "docusaurus"` + `"flat"`)](#mixed-documentation-workflow-docsoutputstyle--docusaurus--flat)
- [अनुवाद डैशबोर्ड](#translation-dashboard)
  - [विफलताएं (दस्तावेज़ अनुवाद)](#failures-document-translation)
    - [इसका उपयोग कब करें](#when-to-use-it)
    - [स्रोत संपादन क्यों महत्वपूर्ण हैं](#why-source-edits-matter)
    - [टैब का उपयोग कैसे करें](#how-to-use-the-tab)
  - [मार्कडाउन समस्याएं (स्थिर जांच)](#markdown-issues-static-checks)
- [कॉन्फ़िगरेशन संदर्भ](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (वैकल्पिक)](#uilanguagespath-optional)
  - [`concurrency` (वैकल्पिक)](#concurrency-optional)
  - [`batchConcurrency` (वैकल्पिक)](#batchconcurrency-optional)
  - [`fileConcurrency` (वैकल्पिक)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (वैकल्पिक)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [गिट बहिष्करण के लिए सर्वोत्तम अभ्यास:](#best-practice-for-git-exclusions)
  - [`docs`](#docs)
  - [`json`](#json)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLI संदर्भ](#cli-reference)
  - [रूट और वैश्विक विकल्प](#root-and-global-options)
  - [प्रति-कमांड सहायता](#per-command-help)
  - [लक्ष्य स्थानीयकरण (`-l` / `--locale`)](#target-locales--l----locale)
- [पर्यावरण चर](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## स्थापना

प्रकाशित पैकेज केवल **ESM** है। Node.js या आपके बंडलर में `import`/`import()` का उपयोग करें; `require('ai-i18n-tools')` का उपयोग न करें। इस पैकेज ने `engines.node` `>=22.16.0` की घोषणा की है; पुराने Node.js संस्करणों को समर्थन नहीं दिया जाता है। npm टारबॉल में केवल `docs/` के अंतर्गत अंग्रेजी फ़ाइलें शामिल हैं; `translated-docs/` के अंतर्गत भाषानुसार कॉपी [GitHub रिपॉजिटरी](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) में हैं।

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools में अपना स्वयं का स्ट्रिंग निकालने वाला शामिल है। यदि आप पहले `i18next-scanner`, `babel-plugin-i18next-extract`, या इसी तरह के उपकरणों का उपयोग कर रहे थे, तो माइग्रेट करने के बाद आप उन डेव निर्भरताओं को हटा सकते हैं।

<a id="using-the-cli"></a>
### CLI का उपयोग करना

**प्रति-परियोजना (अनुशंसित)** — एक निर्भरता या devDependency के रूप में स्थापित करें, फिर `npx`, `pnpm exec`, या एक `package.json` स्क्रिप्ट के माध्यम से कॉल करें। `package.json` स्क्रिप्ट्स पहले से ही `node_modules/.bin` पर `PATH` के साथ चलती हैं, इसलिए `pnpm run i18n:sync` जैसी कमांड्स `npx` टाइप किए बिना CLI को लागू करती हैं।

**टर्मिनल में बेसिक** `ai-i18n-tools` **:** एक इंटरैक्टिव शेल में सीधे CLI चलाने के लिए (स्थानीय स्थापना के बाद प्रोजेक्ट रूट से), स्थानीय बिन निर्देशिका को `PATH` में जोड़ें:

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

[**direnv**](https://direnv.net/) के साथ, प्रोजेक्ट रूट में `PATH_add node_modules/.bin` को `.envrc` में जोड़ें ताकि रिपॉजिटरी में `cd` के बाद बेस कमांड उपलब्ध हो जाए। `PATH` को समायोजित किए बिना, `npx ai-i18n-tools …` या `pnpm exec ai-i18n-tools …` का उपयोग जारी रखें।

**शून्य-स्थापना एकल उपयोग** — `npx ai-i18n-tools <cmd>` या `pnpm dlx ai-i18n-tools <cmd>` (उस निष्पादन के लिए पैकेज डाउनलोड करता है; `package.json` में कोई प्रविष्टि नहीं)।

Linux, macOS और WSL पर, रजिस्ट्री स्थापना CLI स्क्रिप्ट पर निष्पादन योग्य बिट को स्वचालित रूप से सेट करती है। Windows पर, पैकेज प्रबंधक `.cmd` और `.ps1` शिम्स उत्पन्न करते हैं जो स्पष्ट रूप से Node को निष्पादित करते हैं।

अपनी OpenRouter API कुंजी सेट करें:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

या प्रोजेक्ट रूट में एक `.env` फ़ाइल बनाएँ:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## त्वरित शुरुआत

डिफ़ॉल्ट `init` टेम्पलेट (`ui-markdown`) केवल **UI** निकासी और अनुवाद सक्षम करता है। `ui-docusaurus` और `ui-starlight` टेम्पलेट **दस्तावेज़** अनुवाद (`translate-docs`) सक्षम करते हैं। `ui-astro-website` टेम्पलेट सादे एस्ट्रो ऐप्स (`.astro` फ़ाइलों सहित) के लिए **UI** निकासी का स्कैफ़ोल्ड करता है; जब आप `translate-docs` को `.astro` पृष्ठ HTML के लिए भी चाहते हैं, तो एक `docs[]` ब्लॉक जोड़ें (देखें [एस्ट्रो वेबसाइट पृष्ठ (विश्लेषण-और-प्रतिस्थापन)](#astro-website-parse-and-replace))। संदर्भ [`examples/astro-website`](../../docs/../examples/astro-website/) **दोनों** पाइपलाइन का उपयोग करता है। जब आप एक कमांड चाहते हैं जो आपके कॉन्फ़िगरेशन के अनुसार निकासी, UI अनुवाद, वैकल्पिक SVG फ़ाइल अनुवाद और दस्तावेज़ अनुवाद चलाता है, तो `sync` का उपयोग करें।

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# Workflow 3 - nested JSON bundles (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### अनुशंसित `package.json` स्क्रिप्ट्स

पैकेज को स्थानीय रूप से स्थापित करने के साथ, आप स्क्रिप्ट में सीधे CLI कमांड का उपयोग कर सकते हैं (`npx` की आवश्यकता नहीं है)।

**कुछ भी करने के लिए** `sync` को पसंद करें जो पहले "`translate-ui` चलाएं, फिर `translate-svg`, फिर `translate-docs`, फिर `translate-json`" था: `ai-i18n-tools sync` आपके कॉन्फ़िग के अनुसार सही क्रम और साझा फ्लैग्स के साथ **extract** (जब सक्षम हो), **translate-ui**, वैकल्पिक **translate-svg**, **translate-docs**, फिर वैकल्पिक **translate-json** चलाता है। उन चरणों को हाथ से जोड़ना गलत होने के लिए आसान है (क्रम, निकासी, स्थानीय फ्लैग)। केवल तभी `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs`, और `i18n:translate:json` का उपयोग करें जब आपको अलग रूप से केवल **एकल** चरण की आवश्यकता हो।

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## कार्यप्रवाह 1 - UI अनुवाद

किसी भी JS/TS प्रोजेक्ट के लिए डिज़ाइन किया गया है जो i18next का उपयोग करता है: React ऐप, Next.js (क्लाइंट और सर्वर कंपोनेंट्स), Node.js सेवाएँ, CLI टूल।

<a id="step-1-initialise"></a>
### चरण 1: आरंभ करें

```bash
npx ai-i18n-tools init
```

यह `ui-markdown` टेम्पलेट के साथ `ai-i18n-tools.config.json` लिखता है। इसे संपादित करके निम्नलिखित सेट करें:

- `sourceLocale` - आपकी सोर्स भाषा का BCP-47 कोड (जैसे `"en-GB"`)। यह आपकी रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) से एक्सपोर्ट किए गए `SOURCE_LOCALE` से **मैच होना चाहिए**।
- `targetLocales` - आपकी टारगेट भाषाओं के लिए BCP-47 कोड का ऐरे (जैसे `["de", "fr", "pt-BR"]`)। इस लिस्ट से `ui-languages.json` मैनिफ़ेस्ट बनाने के लिए `generate-ui-languages` चलाएँ।
- `ui.sourceRoots` - `t("…")` कॉल्स को स्कैन करने के लिए डायरेक्टरीज़ या ग्लोब पैटर्न (जैसे `["src/"]`, `["src/**/*.ts"]`)।
- `ui.stringsJson` - मास्टर कैटलॉग कहाँ लिखना है (जैसे `"src/locales/strings.json"`)।
- `ui.flatOutputDir` - `de.json`, `pt-BR.json`, आदि लिखने के लिए स्थान (उदा. `"src/locales/"`)।
- `ui.preferredModel` (वैकल्पिक) - केवल `translate-ui` के लिए **पहले** आज़माने के लिए OpenRouter मॉडल आईडी; विफलता पर CLI `openrouter.translationModels` (या पुराने `defaultModel` / `fallbackModel`) के क्रम में जारी रखता है, डुप्लिकेट को छोड़कर।

<a id="step-2-extract-strings"></a>
### चरण 2: स्ट्रिंग्स निकालें

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` के तहत सभी JS/TS फ़ाइलों में `t("literal")` और `i18n.t("literal")` कॉल की स्कैन करता है। `ui.stringsJson` में लिखता है (या मर्ज करता है)।

स्कैनर कॉन्फ़िगर करने योग्य है: `ui.uiExtractor.funcNames` (या पुराने `ui.reactExtractor.funcNames`) के माध्यम से कस्टम फ़ंक्शन नाम जोड़ें। Astro पृष्ठों और घटकों के लिए, `ui.uiExtractor.extensions` में `.astro` जोड़ें।

<a id="astro-website-plain-astro-not-starlight"></a>
### एस्ट्रो वेबसाइट (सादा एस्ट्रो, स्टारलाइट नहीं)

स्थिर Astro मार्केटिंग या ऐप साइटों के लिए, [Astro बिल्ट-इन i18n रूटिंग](https://docs.astro.build/en/guides/internationalization/) के साथ ai-i18n-tools को जोड़ें। संदर्भ कार्यान्वयन [`examples/astro-website`](../../docs/../examples/astro-website/) है (इसके [README](../../docs/../examples/astro-website/README.md) को भी देखें): अंग्रेजी `/` पर, नौ लक्ष्य स्थानीयकरण `/{locale}/` पर (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`)।

अधिकांश टीमें दो पाइपलाइनों के **संकर** का उपयोग करती हैं (वे टकराती नहीं हैं):

| पाइपलाइन | उपयोग के लिए | कमांड | आउटपुट |
|----------|---------|----------|--------|
| **पृष्ठ HTML** | शीर्षक, पैराग्राफ, नेविगेशन लेबल, टेम्पलेट बॉडी में इनलाइन सरणियाँ | `translate-docs` | प्रति स्थानीयकरण `src/pages/{locale}/index.astro` |
| **UI स्ट्रिंग्स (`t()`)** | फ्रंटमैटर डेटा, स्क्रीनशॉट टैब लेबल, साझा सरणियाँ | `extract` → `translate-ui` | `public/locales/{locale}.json` (अंग्रेजी स्रोत कुंजी के रूप में) |

जब आप कोई भाषा जोड़ते या हटाते हैं, तो तीन सूचियों को संरेखित रखें: `ai-i18n-tools.config.json` में `targetLocales`, `astro.config.mjs` में `i18n.locales` (Astro **लोअरकेस** मार्ग कोड जैसे `pt-br` का उपयोग करता है), और `ui-languages.json` (`generate-ui-languages` के माध्यम से)। फ्लैट बंडल के **फ़ाइलनाम** कॉन्फ़िग केसिंग का उपयोग करते हैं (`pt-BR.json`); Astro के `pt-br` मार्ग को अपने मैनिफेस्ट `code` फ़ील्ड के माध्यम से उस फ़ाइल से मैप करें (`examples/astro-website/src/i18n/locale.ts` देखें)।

संदर्भ प्रोजेक्ट से उदाहरण `package.json` स्क्रिप्ट्स:

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="astro-website-ui-strings-ssg"></a>
### एस्ट्रो वेबसाइट यूआई स्ट्रिंग्स (SSG)

UI निकासी के लिए `init -t ui-astro-website` के साथ स्कैफ़ोल्डिंग करें, फिर जब आप पेज HTML का भी अनुवाद करें तो `docs[]` ब्लॉक में मर्ज करें (नीचे देखें)। टाइपस्क्रिप्ट मॉड्यूल में `t('…')` और `.astro` फ्रंटमैटर में (और टेम्पलेट `{expression}` ब्लॉक में जब आप डुप्लिकेट स्थानीय पेजों की तुलना में UI स्ट्रिंग्स को पसंद करते हैं) कॉपी को लपेटें:

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

`sourceLocale` को `astro.config.mjs` में `i18n.defaultLocale` के मेल के अनुसार सेट करें। समतल बंडल को एक निर्देशिका में लिखें जिसे Astro बिल्ड समय पर आयात कर सकता है (टेम्पलेट `public/locales/` का उपयोग करता है)। **बिल्ड समय** पर `t('…')` को हल करें अंग्रेजी स्रोत लिटरल को कुंजी के रूप में खोजकर (देखें `examples/astro-website/src/i18n/t.ts`; `strings.json` निर्माण समय बंडल नहीं, बल्कि निष्कर्षण कैश है)। जब तक आप लोड होने के बाद भाषा बदलने वाले क्लाइंट आइलैंड नहीं जोड़ते, तब तक आपको स्थिर साइट के लिए `ai-i18n-tools/runtime` या i18next की **आवश्यकता नहीं** होती।

हर पृष्ठ को वायर करें जो `t()` को कॉल करता है (अंग्रेजी मूल पृष्ठ और प्रत्येक `src/pages/{locale}/` कॉपी):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

उदाहरण में सहायक फ़ंक्शन: लेबल, दिशा और BCP-47 कोड के लिए `src/i18n/utils.ts`, `src/i18n/locale.ts`, और `ui-languages.json`। `targetLocales` में बदलाव के बाद `generate-ui-languages` चलाएँ (वैकल्पिक रूप से `ui.uiLanguagesPath` सेट करें ताकि मैनिफेस्ट आपके हेल्पर्स के बगल में रहे, उदाहरण के लिए `src/i18n/ui-languages.json`)। `MainLayout.astro` `resolveUiLanguage(Astro.currentLocale)` से `<html lang>` और `<html dir>` सेट करता है; `LanguagePicker.astro` `astro:i18n` से `getRelativeLocaleUrl` का उपयोग करता है।

<a id="astro-website-pages-parse-and-replace"></a>
### एस्ट्रो वेबसाइट पेज (पार्स-एंड-रिप्लेस)

मार्केटिंग पृष्ठों के लिए जिनमें `.astro` फ़ाइलों में हार्डकोडेड HTML है, `translate-docs` पाठ नोड्स और विशेषताओं (`alt`, `title`, `aria-label`, `placeholder`) को निकालें, उन्हें दस्तावेज़ कैश के साथ अनुवादित करें, और अपने पृष्ठों के पेड़ के तहत स्थानीय-विशिष्ट प्रतियां लिखें। आपको अधिकांश दृश्य प्रतिलिपि के लिए `t()` की आवश्यकता **नहीं** है।

संरचनात्मक विशेषता और कुंजी मान डिफ़ॉल्ट रूप से अनुवादित **नहीं** होते हैं: बिल्ट-इन सुरक्षा JSX/HTML विशेषताओं जैसे `class`, `id`, `style`, `src`, `href`, `data-*`, और अधिकांश `aria-*`, और टेम्पलेट `{expression}` ब्लॉक्स के अंदर `class`, `key`, और `id` जैसी ऑब्जेक्ट कुंजियों को कवर करती है। जब आप कस्टम विशेषताओं (उदाहरण के लिए टेलविंड `variant` या CMS `slug` फ़ील्ड) का उपयोग करते हैं तो उन सूचियों को बढ़ाने के लिए `docs[].protectAttributes` और `docs[].protectKeys` का उपयोग करें। एमडीएक्स JSX पर मार्कडाउन अनुवाद के दौरान भी वही विकल्प लागू होते हैं (देखें [protectAttributes / protectKeys](#protectattributes-protectkeys))।

`features.translateDocs` सक्षम करें और एक `docs[]` ब्लॉक जोड़ें, उदाहरण के लिए:

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

`npx ai-i18n-tools translate-docs` चलाएँ (या [`pnpm i18n:translate`](../../docs/../examples/astro-website/) में `pnpm i18n:translate`)। अंग्रेजी स्रोत `src/pages/index.astro` पर रहता है; प्रत्येक लक्षित स्थानीयता को `src/pages/{locale}/index.astro` प्राप्त होता है जिसमें अतिरिक्त निर्देशिका स्तर के लिए आयात समायोजित होते हैं (उदाहरण के लिए `../layouts/` → `../../layouts/`)।

**टेम्पलेट बॉडी** के अंदर, `{expression}` ब्लॉकों में स्ट्रिंग लिटेरल (इनलाइन ऐरे, वस्तु `title`/`desc` फ़ील्ड) तब अनुवादित होते हैं जब वे उपयोगकर्ता के सामने होते हैं; संरक्षित विशेषताओं/कुंजी पर उद्धृत मान, `t('…')`, `<script>`, और `<style>` के अंदर लिटेरल को अपरिवर्तित छोड़ दिया जाता है। **फ्रंटमैटर TypeScript इस पथ द्वारा अनुवादित नहीं होता**—साझा फ्रंटमैटर (जिसमें `t()` आयात और डेटा ऐरे शामिल हैं) को अंग्रेजी और स्थानीय पृष्ठों पर समान रखना चाहिए, या अंग्रेजी पृष्ठ को संपादित करने के बाद `translate-docs` को फिर से चलाएँ ताकि स्थानीय प्रतियां फ्रंटमैटर परिवर्तनों को प्राप्त कर सकें। केवल फ्रंटमैटर कॉपी के लिए, इसके बजाय [UI-string pipeline](#astro-website-ui-strings) का उपयोग करें।

[`examples/astro-website`](../../docs/../examples/astro-website/) पर पूर्ण हाइब्रिड लैंडिंग पृष्ठ (HTML के माध्यम से `translate-docs`, स्क्रीनशॉट टैब लेबल के माध्यम से `t()` + `translate-ui`) देखें।

<a id="step-3-translate-ui-strings"></a>
### चरण 3: UI स्ट्रिंग्स का अनुवाद करें

```bash
npx ai-i18n-tools translate-ui
```

`strings.json` पढ़ता है, प्रत्येक लक्ष्य स्थानीयकरण के लिए OpenRouter को बैच भेजता है, और सपाट JSON फ़ाइलें (`de.json`, `fr.json`, आदि) को `ui.flatOutputDir` में लिखता है। जब `ui.preferredModel` सेट किया जाता है, तो उस मॉडल को `openrouter.translationModels` में क्रमबद्ध सूची से पहले प्रयास किया जाता है (दस्तावेज़ अनुवाद और अन्य कमांड्स अभी भी केवल `openrouter` का उपयोग करते हैं)।

प्रत्येक प्रविष्टि के लिए, `translate-ui` प्रत्येक स्थानीयकरण का अनुवाद करने में सफल **OpenRouter मॉडल आईडी** को एक वैकल्पिक `models` ऑब्जेक्ट में संग्रहीत करता है (`translated` के समान स्थानीयकरण कुंजियाँ)। स्थानीय `dashboard` कमांड में संपादित स्ट्रिंग्स को उस स्थानीयकरण के लिए `models` में सेंटिनल मान `user-edited` से चिह्नित किया जाता है। `ui.flatOutputDir` के तहत प्रति-स्थानीयकरण फ्लैट फ़ाइल्स केवल **स्रोत स्ट्रिंग → अनुवाद** रहती हैं; इनमें `models` शामिल नहीं है (ताकि रनटाइम बंडल अपरिवर्तित रहें)।

> **नोट:** यदि आप अनुवाद डैशबोर्ड में किसी प्रविष्टि को संपादित करते हैं, तो अपडेटेड कैश प्रविष्टि के साथ आउटपुट फ़ाइल्स को पुनः लिखने के लिए आपको `sync --force-update` (या `--force-update` के साथ समकक्ष `translate` कमांड) चलाने की आवश्यकता होती है। साथ ही, ध्यान रखें कि यदि बाद में स्रोत पाठ बदल जाता है, तो आपका मैनुअल संपादन खो जाएगा क्योंकि नए स्रोत स्ट्रिंग के लिए एक नया कैश कुंजी (हैश) उत्पन्न किया जाएगा।

<a id="exporting-to-xliff-20-optional"></a>
### XLIFF 2.0 में निर्यात करना (वैकल्पिक)

UI स्ट्रिंग्स को अनुवाद विक्रेता, TMS या CAT उपकरण को सौंपने के लिए, कैटलॉग को **XLIFF 2.0** के रूप में निर्यात करें (प्रत्येक लक्ष्य स्थानीयकरण के लिए एक फ़ाइल)। यह कमांड **केवल पढ़ने योग्य** है: यह `strings.json` को संशोधित नहीं करता या कोई API नहीं कॉल करता।

```bash
npx ai-i18n-tools export-ui-xliff
```

डिफ़ॉल्ट रूप से, फ़ाइलें `ui.stringsJson` के पास लिखी जाती हैं, जिनके नाम इस तरह होते हैं: `strings.de.xliff`, `strings.pt-BR.xliff` (आपके कैटलॉग का बेसनेम + स्थानीयकरण + `.xliff`)। कहीं और लिखने के लिए `-o` / `--output-dir` का उपयोग करें। `strings.json` से मौजूदा अनुवाद `<target>` में दिखाई देते हैं; लापता स्थानीयकरण `state="initial"` का उपयोग करते हैं और कोई `<target>` नहीं होता ताकि उपकरण उन्हें भर सकें। प्रत्येक स्थानीयकरण के लिए अभी भी अनुवाद की आवश्यकता वाली इकाइयों को निर्यात करने के लिए `--untranslated-only` का उपयोग करें (विक्रेता बैच के लिए उपयोगी)। `--dry-run` फ़ाइलें लिखे बिना पथ प्रिंट करता है।

<a id="step-4-wire-i18next-at-runtime"></a>
### चरण 4: रनटाइम पर i18next को जोड़ें

`'ai-i18n-tools/runtime'` द्वारा निर्यात किए गए हेल्पर्स का उपयोग करके अपनी i18n सेटअप फ़ाइल बनाएँ:

<details>
<summary>पूर्ण i18n बूटस्ट्रैप उदाहरण (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

<a id="keeping-source_locale-aligned"></a>
#### `SOURCE_LOCALE` को संरेखित रखना

**तीन मानों को संरेखित रखें:** `sourceLocale` में `ai-i18n-tools.config.json`, इस फ़ाइल में `SOURCE_LOCALE`, और बहुवचन फ्लैट JSON `translate-ui` आपकी फ्लैट आउटपुट निर्देशिका में `{sourceLocale}.json` के रूप में लिखता है (अक्सर `public/locales/`)। स्थिर `import` में उसी बेसनेम का उपयोग करें (उपरोक्त उदाहरण: `en-GB` → `en-GB.json`)। `lng` फ़ील्ड में `sourcePluralFlatBundle` का मान `SOURCE_LOCALE` के बराबर होना चाहिए। स्थिर ES `import` पथ चर का उपयोग नहीं कर सकते हैं; यदि आप स्रोत भाषा बदलते हैं, तो `SOURCE_LOCALE` और आयात पथ को एक साथ अपडेट करें। वैकल्पिक रूप से, एक गतिशील `import(\` के साथ उस फ़ाइल को लोड करें ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, या `readFileSync` ताकि पथ `SOURCE_LOCALE` से बनाया जा सके।

इस स्निपेट में `./locales/…` और `./public/locales/…` का उपयोग इस प्रकार किया गया है जैसे `i18n` उन फ़ोल्डरों के बगल में स्थित हो। यदि आपकी फ़ाइल `src/` के अंतर्गत है (सामान्य), तो `../locales/…` और `../public/locales/…` का उपयोग करें ताकि आयात `ui.stringsJson`, `uiLanguagesPath`, और `ui.flatOutputDir` के समान पथ पर हों।

React के रेंडर होने से पहले `i18n.js` को इम्पोर्ट करें (उदाहरण के लिए, आपके एंट्री पॉइंट के शीर्ष पर)। जब उपयोगकर्ता भाषा बदलता है, तो `await loadLocale(code)` और फिर `i18n.changeLanguage(code)` कॉल करें।

`SOURCE_LOCALE` निर्यात किया जाता है ताकि कोई भी अन्य फ़ाइल जिसे इसकी आवश्यकता हो (उदा. भाषा स्विचर) इसे सीधे `'./i18n'` से आयात कर सके। यदि आप मौजूदा i18next सेटअप को माइग्रेट कर रहे हैं, तो अपनी i18n बूटस्ट्रैप फ़ाइल से `SOURCE_LOCALE` के आयात के साथ किसी भी हार्डकोडेड स्रोत स्थानीयकरण स्ट्रिंग्स (उदा. घटकों में बिखरे `'en-GB'` चेक) को प्रतिस्थापित करें।

यदि आप डिफ़ॉल्ट निर्यात का उपयोग नहीं करना पसंद करते हैं, तो नामित आयात (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) उसी तरह काम करते हैं।

<a id="locale-loaders"></a>
#### स्थानीय लोडर

`ui-languages.json` का उपयोग करके `makeLocaleLoadersFromManifest` से उन्हें प्राप्त करके `localeLoaders` को **कॉन्फ़िगरेशन के साथ संरेखित** रखें (यह `makeLoadLocale` के समान सामान्यीकरण का उपयोग करके `SOURCE_LOCALE` को फ़िल्टर आउट करता है)। जब आप `targetLocales` में एक स्थानीयकरण जोड़ते हैं और `generate-ui-languages` चलाते हैं, तो मैनिफेस्ट अपडेट हो जाता है और आपके लोडर स्वचालित रूप से परिवर्तन का ट्रैक रखते हैं — एक अलग हार्डकोडेड मैप बनाए रखने की कोई आवश्यकता नहीं है।

`public/` के तहत JSON बंडल के लिए (आमतौर पर Next.js सेटअप), अपने सार्वजनिक URL पथ से प्राप्त करें:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

बंडलर के बिना Node CLIs के लिए, प्रत्येक कोड के लिए JSON फ़ाइल पढ़ने और पार्स करने वाले एक छोटे सहायक में `readFileSync` का उपयोग करें।

<a id="runtime-helpers-reference"></a>
#### रनटाइम हेल्पर संदर्भ

`aiI18n.defaultI18nInitOptions(sourceLocale)` की-एज़-डिफ़ॉल्ट सेटअप के लिए मानक विकल्प लौटाता है:

- `parseMissingKeyHandler` कुंजी स्वयं लौटाता है, इसलिए अनुवादित स्ट्रिंग्स स्रोत पाठ प्रदर्शित करती हैं।
- `nsSeparator: false` उन कुंजियों की अनुमति देता है जिनमें कोलन शामिल होते हैं।
- `interpolation.escapeValue: false` — अक्षम करने के लिए सुरक्षित: React स्वयं मानों को एस्केप करता है, और Node.js/CLI आउटपुट में एस्केप करने के लिए कोई HTML नहीं होता है।

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` ai-i18n-tools प्रोजेक्ट्स के लिए **अनुशंसित** वायरिंग है: यह की-ट्रिम + स्रोत-स्थान <code>"{{var}}"</code> अन्तर्निर्माण फॉलबैक लागू करता है (निचले स्तर के `wrapI18nWithKeyTrim` के समान व्यवहार), वैकल्पिक रूप से `translate-ui` `{sourceLocale}.json` बहुवचन उपसर्गीय कुंजियों को `addResourceBundle` के माध्यम से मिलाता है, फिर आपके `strings.json` से बहुवचन-जागरूक `wrapT` स्थापित करता है। केवल बूटस्ट्रैपिंग के दौरान `sourcePluralFlatBundle` को छोड़ दें (एक बार `translate-ui` `{sourceLocale}.json` उत्सर्जित करने के बाद इसे मिला लें)। अनुप्रयोग कोड के लिए केवल `wrapI18nWithKeyTrim` **अप्रचलित** है — इसके बजाय `setupKeyAsDefaultT` का उपयोग करें।

`makeLoadLocale(i18n, loaders, sourceLocale)` एक असमिकालिक `loadLocale(lang)` फ़ंक्शन लौटाता है जो किसी स्थानीयकरण के लिए JSON बंडल को गतिशील रूप से आयात करता है और इसे i18next के साथ पंजीकृत करता है।

<a id="using-t-in-source-code"></a>
### स्रोत कोड में `t()` का उपयोग करना

एक्सट्रैक्ट स्क्रिप्ट द्वारा इसे खोजने के लिए **आक्षरिक स्ट्रिंग** के साथ `t()` को कॉल करें:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

यही प्रारूप React के बाहर भी काम करता है (Node.js, सर्वर घटक, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**नियम:**

- केवल इन रूपों को निकाला जाता है: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`।
- की एक **आक्षरिक स्ट्रिंग** होनी चाहिए — की के रूप में कोई चर या अभिव्यक्ति नहीं।
- की के लिए टेम्पलेट लिटरल्स का उपयोग न करें: <code>{'t(`Hello ${name}`)'}</code> निकाले जाने योग्य नहीं है।

<a id="interpolation"></a>
### इंटरपोलेशन

<code>"{{var}}"</code> प्लेसहोल्डर्स के लिए i18next के नेटिव सेकंड-आर्ग्युमेंट इंटरपोलेशन का उपयोग करें:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

एक्सट्रैक्ट कमांड **दूसरे तर्क** को पार्स करता है जब वह एक सादा ऑब्जेक्ट लिटरल होता है और टूलिंग-केवल झंडों जैसे `plurals: true` और `zeroDigit` को पढ़ता है (नीचे **कार्डिनल बहुवचन** देखें)। सामान्य स्ट्रिंग्स के लिए, हैशिंग के लिए केवल शाब्दिक कुंजी का उपयोग किया जाता है; इंटरपोलेशन विकल्प अभी भी रनटाइम पर i18next को पास किए जाते हैं।

यदि आपका प्रोजेक्ट कस्टम इंटरपोलेशन यूटिलिटी का उपयोग करता है (जैसे `t('key')` को कॉल करना और फिर परिणाम को `interpolateTemplate(t('Hello {{name}}'), { name })` जैसे टेम्पलेट फ़ंक्शन के माध्यम से पाइप करना), तो `setupKeyAsDefaultT` (`wrapI18nWithKeyTrim` के माध्यम से) उसे अनावश्यक बना देता है — यह <code>"{{var}}"</code> इंटरपोलेशन तब भी लागू करता है जब सोर्स लोकेल रॉ की (raw key) लौटाता है। कॉल साइट्स को `t('Hello {{name}}', { name })` पर माइग्रेट करें और कस्टम यूटिलिटी को हटा दें।

<a id="cardinal-plurals-plurals-true"></a>
### कार्डिनल बहुवचन (`plurals: true`)

डेवलपर-डिफ़ॉल्ट कॉपी के रूप में आप जो **समान शाब्दिक** चाहते हैं उसका उपयोग करें, और `plurals: true` पास करें ताकि एक्सट्रैक्ट + `translate-ui` कॉल को एक **कार्डिनल बहुवचन समूह** के रूप में मानें (i18next JSON v4-शैली `_zero` … `_other` रूप)।

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (वैकल्पिक) — केवल टूलिंग के लिए; i18next द्वारा **पढ़ा नहीं जाता**। जब `true`, तो प्रॉम्प्ट प्रत्येक स्थानीयकरण में उस रूप के लिए `_zero` स्ट्रिंग में शाब्दिक अरबी `0` को प्राथमिकता देते हैं; जब `false` या छोड़ दिया जाता है, तो प्राकृतिक शून्य वाक्यांश का उपयोग किया जाता है। `i18next.t` को कॉल करने से पहले इन कुंजियों को हटा दें (नीचे देखें `wrapT`)।

**सत्यापन:** यदि संदेश में **दो या अधिक** अलग-अलग `{{…}}` प्लेसहोल्डर हैं, तो उनमें से **एक होना चाहिए** `{{count}}` (बहुवचन अक्ष)। अन्यथा `extract` स्पष्ट फ़ाइल/पंक्ति संदेश के साथ **विफल** हो जाता है।

**दो स्वतंत्र गणनाएँ** (उदा. खंड और पृष्ठ) एक बहुवचन संदेश को साझा नहीं कर सकतीं — **दो** `t()` कॉल्स (प्रत्येक के साथ `plurals: true` और अपना स्वयं का `count`) का उपयोग करें और UI में जोड़ें।

**v1 में नहीं:** क्रमिक बहुवचन (`_ordinal_*`, `ordinal: true`), अंतराल बहुवचन, केवल ICU पाइपलाइन।

<a id="how-plurals-are-stored-and-emitted"></a>
#### बहुवचन कैसे संग्रहीत और उत्सर्जित होते हैं

**में** `strings.json` बहुवचन समूहों में `"plural": true`, मूल लिपि `source` में और `translated[locale]` के रूप में प्रत्येक हैश के लिए **एक पंक्ति का उपयोग किया जाता है**, जो कार्डिनल श्रेणियों (`zero`, `one`, `two`, `few`, `many`, `other`) को उस स्थानीयकरण के लिए स्ट्रिंग्स से मैप करता है।

**फ्लैट स्थानीय JSON:** गैर-बहुवचन पंक्तियाँ **स्रोत वाक्य → अनुवाद** के रूप में रहती हैं। बहुवचन पंक्तियों को `<groupId>_original` (`source` के बराबर, संदर्भ के लिए) और प्रत्येक प्रत्यय के लिए `<groupId>_<form>` के रूप में उत्सर्जित किया जाता है ताकि i18next बहुवचन को स्वाभाविक रूप से हल कर सके। `translate-ui` `{sourceLocale}.json` भी लिखता है जिसमें **केवल** बहुवचन फ्लैट कुंजियाँ होती हैं (स्रोत भाषा के लिए इस बंडल को लोड करें ताकि प्रत्यायुक्त कुंजियाँ हल हो सकें; सादे स्ट्रिंग्स अभी भी कुंजी-के-रूप-में-डिफ़ॉल्ट का उपयोग करते हैं)। प्रत्येक लक्ष्य स्थानीयकरण के लिए, उत्सर्जित प्रत्यय कुंजियाँ उस स्थानीयकरण (`requiredCldrPluralForms`) के लिए `Intl.PluralRules` से मेल खाती हैं: यदि `strings.json` ने संकलन के बाद किसी श्रेणी को छोड़ दिया क्योंकि वह दूसरे से मेल खाती थी (उदाहरण के लिए अरबी `many` `other` के समान), `translate-ui` फिर भी फ्लैट फ़ाइल में प्रत्येक आवश्यक प्रत्यय लिखता है एक फॉलबैक भाई-बहन स्ट्रिंग से कॉपी करके ताकि रनटाइम लुकअप कभी कुंजी न छोड़े।

रनटाइम (`ai-i18n-tools/runtime`): **कॉल करें** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — यह `wrapI18nWithKeyTrim` चलाता है, वैकल्पिक `translate-ui` `{sourceLocale}.json` बहुवचन बंडल को पंजीकृत करता है, फिर `wrapT` का उपयोग `buildPluralIndexFromStringsJson(stringsJson)` करते हुए। `wrapT` `plurals` / `zeroDigit` को हटा देता है, आवश्यकता पड़ने पर कुंजी को समूह आईडी में पुनः लिखता है, और `count` को अग्रेषित करता है (वैकल्पिक: यदि एकल गैर-`{{count}}` प्लेसहोल्डर है, तो `count` उस संख्यात्मक विकल्प से कॉपी किया जाता है)।

**पुराने वातावरण:** टूलिंग और सुसंगत व्यवहार के लिए `Intl.PluralRules` आवश्यक है; बहुत पुराने ब्राउज़र को लक्षित करने पर पॉलीफिल करें।

<a id="language-switcher-ui"></a>
### भाषा स्विचर UI

एक भाषा चयनकर्ता बनाने के लिए `ui-languages.json` मैनिफेस्ट का उपयोग करें। `ai-i18n-tools` दो प्रदर्शन सहायक निर्यात करता है:

<details>
<summary>उदाहरण LanguageSelect घटक (React)</summary>

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

</details>

<br />

`getUILanguageLabel(lang, t)` - अनुवादित होने पर `t(englishName)` दिखाता है, या जब दोनों भिन्न होते हैं तो `englishName / t(englishName)` दिखाता है। सेटिंग्स स्क्रीन के लिए उपयुक्त।

`getUILanguageLabelNative(lang)` - `englishName / label` दिखाता है (प्रत्येक पंक्ति पर `t()` कॉल नहीं)। शीर्षक मेनू के लिए उपयुक्त जहाँ आप मूल नाम को दृश्यमान चाहते हैं।

`ui-languages.json` मैनिफ़ेस्ट <code>"{ code, label, englishName, direction }"</code> एंट्रीज़ का एक JSON ऐरे है (`direction`, `"ltr"` या `"rtl"` है)। उदाहरण:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

मैनिफेस्ट `generate-ui-languages` द्वारा `sourceLocale` + `targetLocales` और बंडल किए गए मास्टर कैटलॉग से उत्पन्न होता है। इसे `ui.flatOutputDir` में लिखा जाता है। यदि आप कॉन्फ़िगरेशन में किसी भी स्थानीयकरण को बदलते हैं, तो `ui-languages.json` फ़ाइल को अपडेट करने के लिए `generate-ui-languages` चलाएँ।

<a id="rtl-languages"></a>
### RTL भाषाएँ

`ai-i18n-tools` `getTextDirection(lng)` और `applyDirection(lng)` निर्यात करता है:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` `document.documentElement.dir` (ब्राउज़र) सेट करता है या एक नो-ऑप है (Node.js)। एक विशिष्ट तत्व को लक्षित करने के लिए वैकल्पिक `element` तर्क पास करें।

उन स्ट्रिंग्स के लिए जिनमें `→` तीर हो सकते हैं, RTL लेआउट के लिए उन्हें पलट दें:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## कार्यप्रवाह 2 - दस्तावेज़ अनुवाद

मुख्य रूप से `docs[].contentPaths` के तहत **मार्कडाउन, MDX, और `.astro` प्रलेखन** के लिए डिज़ाइन किया गया। डॉक्यूसॉरस साइट्स पर, `translate-docs` को भी शेल JSON (नेवबार, फुटर, थीम स्ट्रिंग्स) का अनुवाद करने के लिए `docs[].docusaurusCatalogDir` को `write-translations` कैटलॉग फ़ोल्डर (उदाहरण के लिए `docs-site/i18n/en`) पर सेट करें। मार्कडाउन में एम्बेडेड पीएनजी और अन्य रास्टर छवियों के लिए, [अनुवादित प्रलेख में छवियाँ और रास्टर संपत्ति](#images-and-raster-assets-in-translated-docs) देखें। `docsOutput.style = "flat"` के साथ README या प्रलेख में वैकल्पिक **भाषा स्विचर** ब्लॉक के लिए, [भाषा स्विचर (`languageListBlock`)](#language-switcher-languagelistblock) देखें। SVG फ़ाइलों का अनुवाद [`translate-svg`](#cli-reference) के माध्यम से किया जाता है जब `features.translateSVG` सक्षम होता है — `docs[].contentPaths` के माध्यम से नहीं। मनमाने ढंग से नेस्टेड UI JSON बंडल (डॉक्यूसॉरस कैटलॉग नहीं) [वर्कफ़्लो 3](#workflow-3---json-file-translation) (`json[]` / `translate-json`) में होते हैं, `docs[]` में नहीं।

<a id="step-1-initialise-for-documentation"></a>
### चरण 1: दस्तावेज़ीकरण के लिए आरंभ करें

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

एस्ट्रो स्टारलाइट दस्तावेज़ीकरण साइट्स के लिए:

```bash
npx ai-i18n-tools init -t ui-starlight
```

साधारण Astro वेबसाइट UI (कोई Starlight नहीं):

```bash
npx ai-i18n-tools init -t ui-astro-website
```

उस टेम्पलेट में केवल UI निष्कर्षण सक्षम होता है। पृष्ठ HTML अनुवाद के लिए, `features.translateDocs` भी सेट करें और एक `docs[]` ब्लॉक जोड़ें (देखें [Astro वेबसाइट पृष्ठ (पार्स-एंड-रिप्लेस)](#astro-website-parse-and-replace))। [`examples/astro-website`](../../docs/../examples/astro-website/) कॉन्फ़िग दोनों पाइपलाइनों को एक साथ दिखाता है।

उत्पन्न `ai-i18n-tools.config.json` को संपादित करें:

- `sourceLocale` - स्रोत भाषा (`docusaurus.config.js` में `defaultLocale` से मेल खाना चाहिए)।
- `targetLocales` - BCP-47 स्थानीयता कोड्स की सरणी (उदा. `["de", "fr", "es"]`)।
- `cacheDir` - सभी पाइपलाइनों के लिए साझा SQLite कैश निर्देशिका (और `--write-logs` के लिए डिफ़ॉल्ट लॉग निर्देशिका)।
- `docs` - दस्तावेज़ीकरण ब्लॉकों की सरणी। प्रत्येक ब्लॉक में वैकल्पिक `description`, `contentPaths` (स्ट्रिंग या सरणी; फ़ाइल, निर्देशिका, या ग्लोब), `outputDir`, वैकल्पिक `docusaurusCatalogDir`, `docsOutput`, वैकल्पिक `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter`, आदि होते हैं।
- `docs[].description` - रखरखाव कर्ताओं के लिए वैकल्पिक संक्षिप्त टिप्पणी। जब सेट किया जाता है, तो यह `translate-docs` शीर्षक और `status` अनुभाग शीर्षकों में दिखाई देता है।
- `docs[].contentPaths` - मार्कडाउन/MDX/`.astro` स्रोत (और Docusaurus शेल JSON के लिए वैकल्पिक `docusaurusCatalogDir`)।
- `docs[].outputDir` - उस ब्लॉक के लिए अनुवादित आउटपुट मूल।
- `docs[].docsOutput.style` - `"nested"` (डिफ़ॉल्ट), `"flat"`, `"doc-system"`, या उपनाम `"docusaurus"` / `"astro-starlight"` (देखें [आउटपुट लेआउट](#output-layouts))।

**प्राथमिक बनाम पूरक:** स्थानीयकृत पेज के लिए `contentPaths` पर ध्यान केंद्रित करें। जब आपको `write-translations` से डॉक्यूसॉरस शेल JSON की भी आवश्यकता हो तो `docusaurusCatalogDir` सेट करें। यदि आप केवल पेज का अनुवाद करते हैं तो `docusaurusCatalogDir` को छोड़ दें।

<a id="step-2-translate-documents"></a>
### चरण 2: दस्तावेज़ों का अनुवाद करें

```bash
npx ai-i18n-tools translate-docs
```

यह प्रत्येक `docs[]` ब्लॉक के `contentPaths` में सभी फ़ाइलों (और `docusaurusCatalogDir` सेट होने पर Docusaurus कैटलॉग JSON) का सभी प्रभावी दस्तावेज़ीकरण स्थानीयताओं में अनुवाद करता है। पहले से अनुवादित खंड SQLite कैश से प्रदान किए जाते हैं — केवल नए या बदले गए खंडों को LLM को भेजा जाता है।

एकल स्थान के लिए अनुवाद करने के लिए:

```bash
npx ai-i18n-tools translate-docs --locale de
```

क्या अनुवाद करने की आवश्यकता है, यह जांचने के लिए:

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### जटिल मार्कडाउन और विफल गुणवत्ता जाँच

`translate-docs` जाँचता है कि प्रत्येक अनुवादित खंड मार्कडाउन संरचना (दस्तावेज़ से पार्स किया गया जोर सहित) को बरकरार रखता है। जो पैराग्राफ कई `bold` स्पैन को `` `inline code` `` के चारों ओर जोड़ते हैं, बोल्ड के अंदर बैकटिक्स को नेस्ट करते हैं (उदाहरण के लिए टेम्पलेट लिटरल्स जैसे `` `fetch(\`/locales/${code}.json\`)` ``), या एक लंबे वाक्य में बोल्ड और कोड को बुनते हैं वे नाजुक होते हैं: कुछ स्थानीयकरणों को अलग शब्द क्रम की आवश्यकता होती है, जिससे अनुवाद के बाद `**` और `` ` `` के संरेखण में बदलाव आ सकता है और CLI त्रुटियाँ जैसे `AST mismatch` ट्रिगर हो सकती हैं।

**यदि आप इस तरह की सत्यापन विफलता का सामना करते हैं, तो स्रोत-भाषा पाठ को सरल बनाना पसंद करें** — पैराग्राफ को विभाजित करें, एक उदाहरण को फेंस किए गए कोड ब्लॉक में स्थानांतरित करें, या कम परतदार बोल्ड/कोड जोड़े के साथ उसी विचार का वर्णन करें — बजाय यह उम्मीद करने के कि हर मॉडल और स्थानीय स्थानीयकरण घने इनलाइन मार्कअप को पूरी तरह से पुन: उत्पन्न करे। इस पृष्ठ के अन्य स्थानों पर (विशेष रूप से चरण 4 के नोट्स पर `SOURCE_LOCALE`, लोडर, और `public/` पथ), स्वरूपण जानबूझकर वास्तविक है; जब आप अपने स्वयं के प्रलेख में समान शब्दावली को फिर से उपयोग करते हैं, तो व्यापक रूप से अनुवाद करते समय इसे सरल रखें।

**कौन से खंड विफल रहे**, कितनी बार, और संग्रहीत **गुणवत्ता / त्रुटि संदेश** देखने के लिए, अनुवाद डैशबोर्ड के **विफलताएँ** टैब का उपयोग करें ([अनुवाद डैशबोर्ड → विफलताएँ](#failures-document-translation))।

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### कैश व्यवहार और `translate-docs` फ्लैग

CLI SQLite में **फ़ाइल ट्रैकिंग** (प्रति फ़ाइल स्रोत हैश × स्थान) और **खंड** पंक्तियां (हैश × स्थान प्रति अनुवाद योग्य टुकड़ा) रखता है। एक सामान्य चलाने में तब फ़ाइल को पूरी तरह से छोड़ दिया जाता है जब ट्रैक किया गया हैश वर्तमान स्रोत से मेल खाता है **और** आउटपुट फ़ाइल पहले से मौजूद है; अन्यथा यह फ़ाइल को प्रोसेस करता है और अपरिवर्तित पाठ के लिए API कॉल न करने के लिए खंड कैश का उपयोग करता है।

| फ़्लैग                          | प्रभाव                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(डिफ़ॉल्ट)*                   | अपरिवर्तित फ़ाइलों को छोड़ दें जब ट्रैकिंग + डिस्क पर आउटपुट मेल खाते हों; शेष के लिए सेगमेंट कैश का उपयोग करें।                                                                                                                                                                          |
| `-l, --locale <codes>`        | अल्पविराम से अलग लक्ष्य स्थानीय (जब छोड़ा जाता है, तो डिफ़ॉल्ट मूल `targetLocales` और प्रत्येक `docs[]` ब्लॉक के वैकल्पिक `targetLocales` के संघ से मेल खाते हैं)।                                                                                                       |
| `-p, --path` / `-f, --file`   | केवल इस पाथ (प्रोजेक्ट-रिलेटिव, एब्सोल्यूट, या ग्लोब पैटर्न) के तहत मार्कडाउन/JSON का अनुवाद करें; `--file`, `--path` के लिए एक एलियास (alias) है। |
| `--dry-run`                   | कोई फ़ाइल लेखन और कोई API कॉल नहीं।                                                                                                                                                                                                                                        |
| `--type <kind>`               | `markdown` या `json` तक सीमित करें (अन्यथा कॉन्फ़िग में सक्षम होने पर दोनों)।                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | केवल JSON लेबल फ़ाइलों का अनुवाद करें, या JSON को छोड़कर केवल मार्कडाउन का अनुवाद करें।                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | अधिकतम समानांतर लक्ष्य स्थानीयकरण (कॉन्फ़िग या CLI निर्मित डिफ़ॉल्ट से डिफ़ॉल्ट)।                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | प्रति फ़ाइल अधिकतम समानांतर बैच API कॉल (दस्तावेज़; कॉन्फ़िग या CLI से डिफ़ॉल्ट)।                                                                                                                                                                                               |
| `--emphasis-placeholders`     | अनुवाद से पहले मार्कडाउन एम्फ़ेसिस मार्कर्स को प्लेसहोल्डर के रूप में मास्क करें (वैकल्पिक; डिफ़ॉल्ट बंद)।                                                                                                                                                                              |
| `--debug-failed`              | वैधीकरण विफल होने पर `FAILED-TRANSLATION` लॉग्स को `cacheDir` के तहत विस्तृत रूप से लिखें।                                                                                                                                                                                        |
| `--force-update`              | प्रत्येक मिलान फ़ाइल को पुनः प्रसंस्कृत करें (निकालें, पुनः जोड़ें, आउटपुट लिखें), भले ही फ़ाइल ट्रैकिंग छोड़ दे। **सेगमेंट कैश अभी भी लागू होता है** — अपरिवर्तित सेगमेंट LLM को नहीं भेजे जाते।                                                                                    |
| `--force`                     | प्रत्येक प्रसंस्कृत फ़ाइल के लिए फ़ाइल ट्रैकिंग साफ़ करता है और API अनुवाद के लिए सेगमेंट कैश को **नहीं पढ़ता** (पूर्ण पुनः अनुवाद)। नए परिणाम अभी भी सेगमेंट कैश में **लिखे जाते हैं**।                                                                                 |
| `--stats`                     | सेगमेंट गिनती, ट्रैक की गई फ़ाइल गिनती और प्रति-स्थानीयकरण सेगमेंट कुल मिलाकर प्रिंट करें, फिर बाहर निकलें।                                                                                                                                                                                    |
| `--clear-cache [locale]`      | कैश किए गए अनुवादों (और फ़ाइल ट्रैकिंग) को हटाएं: सभी स्थानीयकरण, या एकल स्थानीयकरण, फिर बाहर निकलें।                                                                                                                                                                             |
| `--prompt-format <mode>`      | प्रत्येक **बैच** खंडों को मॉडल को कैसे भेजा जाता है और पार्स किया जाता है (`xml`, `json-array`, या `json-object`)। डिफ़ॉल्ट `json-array`। निकासी, प्लेसहोल्डर्स, मान्यता, कैश, या फॉलबैक व्यवहार में बदलाव नहीं करता — [बैच प्रॉम्प्ट प्रारूप](#batch-prompt-format) देखें। |

आप `--force` को `--force-update` के साथ संयोजित नहीं कर सकते (वे एक दूसरे के परस्पर अनन्य हैं)।

<a id="batch-prompt-format"></a>
#### बैच प्रॉम्प्ट प्रारूप

`translate-docs` ओपनराउटर में अनुवाद योग्य खंडों को **बैच में** (`batchSize` / `maxBatchChars` द्वारा समूहित) भेजता है। `--prompt-format` झंडा केवल उस बैच के **वायर प्रारूप** को बदलता है; `PlaceholderHandler` टोकन, मार्कडाउन AST जाँच, SQLite कैश कुंजियाँ, और बैच पार्सिंग विफल होने पर प्रति-खंड फॉलबैक अपरिवर्तित रहते हैं।

| मोड                   | उपयोगकर्ता संदेश                                                           | मॉडल उत्तर                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | नकली-XML: प्रति सेगमेंट एक `<seg id="N">…</seg>` (XML एस्केपिंग के साथ)। | केवल `<t id="N">…</t>` ब्लॉक, प्रति सेगमेंट सूचकांक एक।       |
| `json-array` (डिफ़ॉल्ट) | स्ट्रिंग्स की एक JSON सरणी, क्रम में प्रत्येक खंड के लिए एक प्रविष्टि।               | **समान लंबाई** (समान क्रम) की एक JSON सरणी।           |
| `json-object`          | खंड सूचकांक द्वारा कुंजीबद्ध एक JSON ऑब्जेक्ट `{"0":"…","1":"…",…}`।            | **समान कुंजियों** और अनुवादित मानों वाला एक JSON ऑब्जेक्ट। |

रन हेडर भी `Batch prompt format: …` प्रिंट करता है ताकि आप सक्रिय मोड की पुष्टि कर सकें। JSON लेबल फ़ाइलें (`docusaurusCatalogDir`) और SVG फ़ाइल बैच उसी सेटिंग का उपयोग करते हैं जब वे चरण `translate-docs` (या `sync` के प्रलेख चरण — `sync` इस फ्लैग को उजागर नहीं करता है; यह डिफ़ॉल्ट रूप से `json-array` होता है) के हिस्से के रूप में चलते हैं।

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### सेगमेंट डीडुप और SQLite में पथ

> **नोट:** यह खंड डिबगिंग `cleanup` व्यवहार या कस्टम टूलिंग के लिए उपयोगी आंतरिक कैश कुंजी विवरण को कवर करता है। अधिकांश उपयोगकर्ता इसे छोड़ सकते हैं।

- खंड पंक्तियाँ वैश्विक रूप से `(source_hash, locale)` द्वारा कुंजीबद्ध होती हैं (हैश = सामान्यीकृत सामग्री)। दो फ़ाइलों में समान पाठ एक पंक्ति साझा करता है; `translations.filepath` मेटाडेटा है (अंतिम लेखक), किसी दूसरी कैश प्रविष्टि के रूप में नहीं।
- `file_tracking.filepath` नामस्थान कुंजी का उपयोग करता है: `doc-block:{index}:{relPath}` प्रति `docs` ब्लॉक (`relPath` परियोजना-रूट-सापेक्ष पॉज़िक्स: संग्रहीत मार्कडाउन पथ; **JSON लेबल फ़ाइलें स्रोत फ़ाइल के लिए cwd-सापेक्ष पथ का उपयोग करती हैं**, जैसे `docs-site/i18n/en/code.json`, ताकि सफाई वास्तविक फ़ाइल को हल कर सके), `json-block:{index}:{relPath}` `json[]` स्रोतों के लिए `translate-json` के तहत, और `svg-files:{relPath}` SVG फ़ाइलों के लिए `translate-svg` के तहत।
- `translations.filepath` मार्कडाउन, JSON, और SVG खंडों के लिए cwd-सापेक्ष पॉज़िक्स पथ संग्रहीत करता है (SVG अन्य संपत्तियों के समान पथ आकार का उपयोग करता है; `svg-files:…` उपसर्ग **केवल** `file_tracking` पर है)।
- एक रन के बाद, `last_hit_at` केवल उन खंड पंक्तियों के लिए साफ किया जाता है **जो समान अनुवाद दायरे में हैं** (`--path` और सक्षम प्रकारों का सम्मान करते हुए) जिन्हें हिट नहीं किया गया, ताकि एक फ़िल्टर किया गया या केवल दस्तावेज़ रन असंबंधित फ़ाइलों को पुराना न चिह्नित करे।

<a id="output-layouts"></a>
### आउटपुट लेआउट

`docsOutput.style` नियंत्रित करता है कि अनुवादित मार्कडाउन फ़ाइलों को कहाँ लिखा जाए। `docs[].docsOutput.style` में नीचे दिए गए सटीक स्ट्रिंग मानों का उपयोग करें (उपनाम पूर्वनिर्धारित लेआउट हैं, अलग इंजन नहीं)।

`docsOutput.style = "nested"` (जब छोड़ दिया जाए तो डिफ़ॉल्ट) — `{outputDir}/{locale}/` के अंतर्गत स्रोत ट्री को दर्पणित करता है (उदाहरण के लिए `docs/guide.md` → `i18n/de/docs/guide.md`)।

`docsOutput.style = "doc-system"` — स्थिर दस्तावेज़ साइटों के लिए स्थान-उपसर्गित दस्तावेज़ीकरण ट्री। `docsRoot` के अंतर्गत फ़ाइलों को `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` में लिखा जाता है। `docsRoot` के बाहर के पथ नेस्टेड लेआउट पर वापस आ जाते हैं। अपने अंग्रेजी स्रोत मूल के लिए `docs[].docsOutput.docsRoot` सेट करें (उदाहरण के लिए `"docs"` या `"src/content/docs"`)। जब `docsOutput.style = "doc-system"`, तो आपको `localeSubpath` को स्पष्ट रूप से सेट करना होगा (पूर्वनिर्धारित के लिए नीचे उपनाम का उपयोग करें)।

**उपनाम** (समान लेआउट इंजन, प्रीसेट `localeSubpath`):

- `docsOutput.style = "docusaurus"` — `localeSubpath` का डिफ़ॉल्ट `docusaurus-plugin-content-docs/current` है (Docusaurus i18n प्लगइन लेआउट)।
- `docsOutput.style = "astro-starlight"` — `localeSubpath` का डिफ़ॉल्ट `""` है (अनुवादित पृष्ठ सीधे `{outputDir}/{locale}/` के अंतर्गत, [Starlight](https://starlight.astro.build/guides/i18n/) के समान जब अंग्रेजी सामग्री मूल में होती है और `outputDir` `docsRoot` के बराबर होता है)।

Docusaurus प्रीसेट (प्राथमिक दस्तावेज़ीकरण पृष्ठ):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight प्रीसेट (समान ब्लॉक आकार, अलग पथ):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

वैकल्पिक JSON लेबल — `docusaurusCatalogDir` से Docusaurus शेल स्ट्रिंग (MDX बॉडी कॉपी नहीं):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight कई स्थानों के लिए UI स्ट्रिंग ले जाता है; वैकल्पिक कस्टम UI ओवरराइड आवश्यकता पड़ने पर एक अलग `docs[]` ब्लॉक में `src/content/i18n/en.json` के साथ `jsonPathTemplate: "{outputDir}/{locale}.json"` का उपयोग करते हैं।

`docsOutput.style = "flat"` — अनुवादित फ़ाइलों को स्रोत के बगल में स्थान उपसर्ग के साथ, या एक उपनिर्देशिका में रखता है। पृष्ठों के बीच सापेक्ष लिंक तब स्वचालित रूप से पुनः लिखे जाते हैं जब `docsOutput.style = "flat"` (जब तक `rewriteRelativeLinks: false` या कस्टम `pathTemplate` सेट नहीं है)।

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-docsoutputstyle--flat"></a>
#### `docsOutput.style = "flat"` जब एंकर लिंक

जब `docsOutput.style = "flat"`, तो आउटपुट प्रत्येक स्थान के लिए पृष्ठों के बीच **सापेक्ष पथ** को पुनः लिखता है (`guide.md` → `guide.de.md`)। **एंकर लिंक** — पथ के बाद `#` के साथ मार्कडाउन इनलाइन फॉर्म — लक्ष्य फ़ाइल के अंदर एक खंड पर जाते हैं:

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

यहाँ लिंक का लक्ष्य `setup.md` है, और `#first-run` एंकर है: यह उस फ़ाइल के भीतर सही शीर्षक पर स्क्रॉल करना चाहिए।

**एंकर लिंक को ध्यान देने की आवश्यकता क्यों है**

- `rewriteRelativeLinks` प्रत्येक स्थानीयकरण के लिए **filename** को ठीक करता है (`setup.md` → `setup.de.md`)।
- कई रेंडरर `#` स्लग को **दृश्य शीर्षक पाठ** से लेते हैं। अनुवाद के बाद, शीर्षक प्रत्येक स्थानीयकरण के अनुसार अलग-अलग होते हैं, इसलिए स्वचालित रूप से उत्पन्न स्लग बदल सकता है जबकि पुनर्लेखित लिंक अभी भी `#first-run` कह सकता है — या आपका अंग्रेजी `#…` एंकर उस स्लग से मेल नहीं खाता जो रेंडरर अनुवादित शीर्षक से बनाता है।
- परिणाम: पाठक सही **file** पर पहुंचते हैं लेकिन गलत **line** पर, या ब्राउज़र को कोई मिलता-जुलता शीर्षक नहीं मिलता।

**क्या करें**

1. `translate-docs` से पहले अपने स्रोत `.md` / `.mdx` पर `ai-i18n-tools write-heading-ids` चलाएँ (सामान्य के रूप में `docs[]` / `contentPaths`)। यह प्रत्येक शीर्षक से पहले लाइन पर स्पष्ट HTML एंकर डालता है ताकि `id` मान हर अनुवादित प्रति द्वारा साझा किया जाए। शीर्षकों के नाम बदलने के बाद इसे फिर से चलाएँ ताकि पुराने एंकर आईडी वर्तमान शीर्षक से मेल खाने के लिए ताज़ा हो जाएं।
2. अपने मार्कडाउन **एंकर लिंक** को उन स्थिर आईडी की ओर इशारा करें, उदाहरण के लिए `[label](../../docs/other.md#section-id)`, जहाँ `section-id` उस एंकर से मेल खाता है जो टूल ने लिखा था — केवल अंग्रेजी शब्दों से अनुमान नहीं।

**उदाहरण**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

`write-heading-ids` के बाद `docs/security.md` (सरलीकृत):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

`translate-docs` के बाद, फ़ाइल पथ और `#…` एंकर प्रत्येक स्थानीयकरण फ़ाइल में संरेखित रहते हैं, उदाहरण के लिए:

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration` एंकर सभी स्थानीयकरण में समान है क्योंकि `id` स्रोत में तय है; केवल शीर्षक **पाठ** और लिंक **लेबल** अनुवादित हैं।

<a id="images-and-raster-assets-in-translated-docs"></a>
#### अनुवादित दस्तावेज़ों में छवियाँ और रास्टर संपत्ति

`translate-docs` छवि वैकल्पिक पाठ सहित मार्कडाउन खंडों का अनुवाद करता है। यह रास्टर फ़ाइलों (PNG, JPEG, WebP, GIF) को आपके दस्तावेज़ीकरण `outputDir` में नहीं कॉपी करता है। आपको अनुवादित URL जहाँ इशारा करेंगे वहाँ स्क्रीनशॉट फ़ाइलें रखनी चाहिए, या अनुवाद के बाद पथ को पुनर्लिखित करने के लिए `postProcessing.regexAdjustments` का उपयोग करना चाहिए।

अनुवाद योग्य पाठ के साथ SVG फ़ाइलों के लिए, `svg` ब्लॉक और `translate-svg` का उपयोग करें — [`svg`](#svg) देखें।

पूर्ण निर्णय मार्गदर्शिका, सभी पैटर्न के साथ कॉन्फ़िग उदाहरण और निर्देशिका लेआउट, स्क्रीनशॉट-स्क्रिप्ट अनुबंध, डिज़ाइन सिफारिशें और सामान्य त्रुटियों के लिए [स्थानीय संपत्ति मार्गदर्शिका](LOCALE-ASSETS-GUIDE.hi.md) देखें।

**त्वरित संदर्भ — पाँच पैटर्न**

| पैटर्न                      | उपयोग के लिए                                               | तंत्र                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — साझा रास्टर            | एकल छवि, प्रति-स्थान भिन्नताएँ नहीं                  | प्रति-फ़ाइल लिंक पुनः लेखक; आमतौर पर कोई रेगेक्स नहीं          |
| B — प्रति-स्थानीयकरण फ़ोल्डर        | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/दस्तावेज़ | `regexAdjustments` स्थानीयकरण-खंड स्वैप            |
| C — Docusaurus सहस्थित     | `docsOutput.style = "docusaurus"` साइट | स्क्रीनशॉट स्क्रिप्ट फ़ाइलें रखती है; कोई रेगेक्स नहीं          |
| D — अनुवादित SVG           | एसवीजी चित्रण एम्बेड करने वाले वेब ऐप्स                  | `translate-svg` के साथ `svg.style = "flat"`         |
| E — सहस्थित अनुवादित SVG | `docsOutput.style = "docusaurus"` दस्तावेज़          | `translate-svg` के साथ `svg.style = "nested"` + `pathTemplate` |

**समतल लिंक पुन:लेखक और दो-चरण प्रवाह**

जब `docsOutput.style = "flat"`, तो `postProcessing` से पहले एक अंतर्निहित पुनः लेखक चलता है। यह प्रत्येक आउटपुट फ़ाइल के लिए गहराई उपसर्ग की गणना करता है — आउटपुट फ़ाइल की निर्देशिका से स्रोत फ़ाइल की निर्देशिका तक का सापेक्ष पथ — और गैर-मार्कडाउन संपत्ति URL के आगे इसे जोड़ता है। फिर `postProcessing` पहले से उपसर्गित URL पर चलता है — `search` पैटर्न लिखें जो इसके भीतर स्थान खंड से मेल खाते हों, अग्रणी `../` उपसर्ग से नहीं।

`flatPreserveRelativeDir: true` के साथ, उपनिर्देशिकाओं में स्रोत फ़ाइलों को स्वचालित रूप से फ़ाइल-विशिष्ट उपसर्ग मिलता है। उदाहरण के लिए, `docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md` एक उपसर्ग `../../docs/` उत्पन्न करता है, इसलिए `translation-dashboard.png` (स्रोत का एक भाई) `../../docs/translation-dashboard.png` बन जाता है — बिना किसी `postProcessing` नियम के सही ढंग से हल किया गया।

जब `docsOutput.style` `"docusaurus"`, `"astro-starlight"`, `"nested"`, या `"flat"` के अलावा कोई भी मान होता है, तो फ्लैट लिंक राइटर चलता नहीं है। `postProcessing` मूल मार्कडाउन URL देखता है।

**पैटर्न A उदाहरण** — स्रोत फ़ाइलों के साथ सापेक्ष-पथ संपत्तियों के लिए `docsOutput.style = "flat"` के समय कोई कॉन्फ़िगरेशन आवश्यक नहीं है। पैटर्न A `postProcessing` नियम केवल पूर्ण-URL संपत्तियों (उदाहरण के लिए `/img/...`) या CDN-लक्षित प्रतिस्थापनों के लिए आवश्यक हैं।

**पैटर्न B उदाहरण — `docsOutput.style = "flat"` README** (`examples/nextjs-app`, दूसरा `docs[]` ब्लॉक)

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

हार्डकोडेड स्रोत स्थानीयकरण के बजाय सामान्य `[^/]+` रूप का उपयोग करें, ताकि यदि `sourceLocale` कभी भी बदल जाए तो नियम काम करता रहे।

**पैटर्न B उदाहरण — `docsOutput.style = "docusaurus"`** (`examples/nextjs-app`, पहला `docs[]` ब्लॉक)

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**पैटर्न C — डॉक्यूसॉरस सह-स्थित** (`regexAdjustments` की आवश्यकता नहीं)

en-GB स्क्रीनशॉट्स को `static/assets/` में रखें और एक सिमलिंक `docs/assets → ../static/assets` बनाएं। `take-screenshots` स्क्रिप्ट अन्य स्थानीयकरणों को सीधे `i18n/<locale>/…/current/assets/` में लिखती है। सभी स्थानीयकरणों में सभी दस्तावेज़ `../assets/name.png` का संदर्भ देते हैं — पथ स्थिर है और कोई URL पुन:लेखन आवश्यक नहीं है।

**पैटर्न D उदाहरण** (`examples/nextjs-app`, `svg.style = "flat"`)

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → `public/assets/` के अंतर्गत प्रति-स्थानीयकरण फ़ाइलें। ऐप स्थानीयकरण के अनुसार संदर्भ: `<img src={`/assets/icon.${locale}.svg`} />`।

**न्यूनतम केवल README उदाहरण** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json` केवल [भाषा स्विचर पोस्ट-प्रोसेसिंग](#language-switcher-languagelistblock) के साथ `README.md` का अनुवाद `translated-docs/` में करता है। कोई छवि नियम परिभाषित नहीं हैं — यह तब उपयुक्त है जब README में कोई समानांतर रास्टर फ़ाइल न हो या केवल पूर्ण URL का उपयोग किया जा रहा हो जिसे आपकी होस्टिंग पहले से सेव कर रही हो।

प्रतिस्थापन टेम्पलेट्स में `${translatedLocale}` और `${translatedBasedir}` जैसे प्लेसहोल्डर्स का समर्थन होता है (पूरी सूची [कॉन्फ़िगरेशन संदर्भ](#configuration-reference) में `docsOutput.postProcessing.regexAdjustments` पंक्ति में देखें)।

<a id="language-switcher-languagelistblock"></a>
#### भाषा स्विचर (`languageListBlock`)

उपयोग करें `docsOutput.postProcessing.languageListBlock` जब अनुवादित मार्कडाउन फ़ाइलों में **“अन्य भाषाओं में पढ़ें”** लिंकों की एक पंक्ति शामिल होनी चाहिए — प्रत्येक स्थानीयकरण के लिए एक लिंक, जिसमें प्रत्येक आउटपुट फ़ाइल के सापेक्ष `href` मान की गणना की गई हो।

इस रिपॉजिटरी में [README.md](../README.hi.md) और [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md) के लिए इसका उपयोग किया जाता है। `translate-docs` के बाद, प्रत्येक अनुवादित प्रति को एक ताज़ा ब्लॉक मिलता है; उदाहरण के लिए [translated-docs/docs/GETTING_STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) `translated-docs/docs/` के अंतर्गत भाषा के समकक्ष फ़ाइलों के साथ-साथ अंग्रेज़ी स्रोत `../../docs/GETTING_STARTED.md` पर वापस लिंक करता है।

**1. स्रोत मार्कडाउन में ब्लॉक को चिह्नित करें**

`start` और `end` उपस्ट्रिंग मार्कर्स से घिरे स्विचर को HTML (या कोई भी पंक्तियाँ) में लपेटें। इस रिपॉजिटरी में उपयोग किया जाता है:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

प्रारंभिक लिंक टेक्स्ट केवल एक प्लेसहोल्डर है। `translate-docs` पहली पंक्ति से लेकर पहली बाद की पंक्ति तक के पूरे टुकड़े को बदल देता है जिसमें `start` और `end` होता है (फेंस किए गए कोड ब्लॉक्स के अंदर के मार्कर्स को अनदेखा कर दिया जाता है, इसलिए उसी फ़ाइल में कॉन्फ़िग उदाहरण मेल नहीं खाते हैं)।

**2. ब्लॉक को कॉन्फ़िगर करें**

`start` और `end` मनमाने उपस्ट्रिंग मार्कर्स हैं — उनका `<small id="lang-list">` / `</small>` होना आवश्यक नहीं है। कोई भी खुलने वाला और बंद होने वाला पाठ चुनें जो केवल भाषा-स्विचर टुकड़े पर दिखाई दे: कोई अन्य HTML टैग (`<div class="lang-switcher">` … `</div>`), HTML टिप्पणियाँ (`<!-- lang-list -->` … `<!-- /lang-list -->`), या केवल मार्कडाउन सीमाएँ (उदाहरण के लिए एक पंक्ति `**Languages:**` से लेकर एक पंक्ति `---` तक)। स्रोत फ़ाइल में जो कुछ डाला गया है उससे मेल खाने के लिए कॉन्फ़िग में `start` और `end` सेट करें।

रूट कॉन्फ़िग ([ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| फ़ील्ड       | भूमिका                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | उपस्ट्रिंग जो ब्लॉक की शुरुआत वाली पंक्ति की पहचान करता है                                                  |
| `end`       | बंद होने वाली पंक्ति पर उपस्ट्रिंग (जब दोनों एक ही पंक्ति पर दिखाई दें तो वही पंक्ति `start` हो सकती है)             |
| `separator` | उत्पन्न `[label](../../docs/href)` लिंक्स के बीच का टेक्स्ट (इस रिपॉजिटरी में `" · "` का उपयोग किया जाता है)                                    |
| `label`     | वैकल्पिक: `"local"` (डिफ़ॉल्ट) मैनिफेस्ट से प्रत्येक भाषा के स्वदेशी नाम का उपयोग करता है; `"english"` `englishName` का उपयोग करता है |

**3. रनटाइम पर क्या होता है**

1. **निष्कर्षण** — भाषा-सूची का टुकड़ा मॉडल को **नहीं** भेजा जाता है (`translatable: false`)।
2. **प्रत्येक अनुवादित फ़ाइल के लिए** — खंड अनुवाद और वैकल्पिक फ्लैट लिंक पुनर्लेखन के बाद, `postProcessing` ब्लॉक को फिर से बनाता है: प्रत्येक भाषा के लिए एक मार्कडाउन लिंक, लेबल `ui-languages.json` से जब उपलब्ध हों (अन्यथा बंडल किया गया मास्टर कैटलॉग, अन्यथा `localeDisplayNames`), पथ लिखी जा रही फ़ाइल के सापेक्ष।
3. **स्रोत ताज़ा करें** — `translate-docs` / `sync` दस्तावेज़ पास के अंत में, उसी मानक ब्लॉक को `contentPaths` में **अंग्रेज़ी स्रोत फ़ाइलों** में वापस लिखा जाता है ताकि भाषा जोड़ने पर स्विचर को हर लिंक को हाथ से संपादित किए बिना अपडेट किया जा सके।

यदि किसी फ़ाइल में कोई मिलता-जुलता ब्लॉक नहीं है, तो CLI एक चेतावनी लॉग करता है (जब `--verbose`) और बॉडी को अपरिवर्तित छोड़ देता है।

**4. लेबल मैनिफेस्ट**

स्वदेशी नाम लेबल (`label: "local"`) के लिए, `ui-languages.json` को `generate-ui-languages` के माध्यम से उत्पन्न या बनाए रखें (देखें [`uiLanguagesPath`](#uilanguagespath-optional))। इस रिपॉजिटरी की केवल दस्तावेज़ कॉन्फ़िग में कोई UI पाइपलाइन नहीं है, इसलिए लेबल `sourceLocale` + `targetLocales` के लिए बंडल किए गए मास्टर कैटलॉग से आते हैं।

**5. इस रिपॉजिटरी में उदाहरण**

| उदाहरण                            | फ़ाइलें                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| यह पैकेज (फ्लैट दस्तावेज़ + उप-निर्देशिकाएँ) | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) (`docsOutput.style = "flat"`), [README.md](../README.hi.md), [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md), [translated-docs/](../../docs/../translated-docs/) के तहत आउटपुट |
| न्यूनतम केवल README                | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json) (`docsOutput.style = "flat"`), [examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| फ्लैट README + डॉक्यूसॉरस दस्तावेज़      | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (दूसरा ब्लॉक: `docsOutput.style = "flat"`; पहला ब्लॉक: `docsOutput.style = "docusaurus"`)                                                     |

`<small id="lang-list">` के तुरंत पहले की पंक्ति (उदाहरण के लिए `**Read in other languages:**`) एक सामान्य अनुवाद योग्य खंड है और प्रत्येक लक्ष्य स्थानीयकरण में स्थानीयकृत है; केवल मार्कर के अंदर लिंक पंक्ति को `href` और मैनिफेस्ट-चालित लेबल के अलावा शाब्दिक रूप से पुनः उत्पन्न किया जाता है।

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` स्थानधारक

अनुवादित फ़ाइलों को कहाँ लिखा जाए इसे `docs[].docsOutput.pathTemplate` (मार्कडाउन और MDX) या `jsonPathTemplate` (JSON लेबल फ़ाइलें) सेट करके ओवरराइड करें। दोनों समान प्लेसहोल्डर को स्वीकार करते हैं। हल किए गए पथ को उस ब्लॉक के `outputDir` के भीतर रहना चाहिए (CLI उन पथों को अस्वीकार करता है जो इससे बाहर निकलते हैं)।

यदि आप एक कस्टम `pathTemplate` का उपयोग करते हैं, तो जब तक आप इसे स्पष्ट रूप से सेट नहीं करते, `rewriteRelativeLinks` डिफ़ॉल्ट रूप से `false` होता है — सापेक्ष लिंक पुनःलेखन बिना कस्टम टेम्पलेट के `docsOutput.style = "flat"` के लिए बनाई गई है।

बिल्ट-इन लेआउट के लिए (`nested`, `flat`, `doc-system` बिना कस्टम टेम्पलेट के), `docsOutput.localePathLowercase` को `true` पर सेट करें ताकि लोअरकेस स्थानीयकरण फ़ोल्डर या फ़ाइल नाम खंड लिखे जा सकें (उदाहरण के लिए `pt-br` के बजाय `pt-BR`)। `astro-starlight` उपनाम इसे डिफ़ॉल्ट रूप से `true` पर सेट करता है। कस्टम `pathTemplate` / `jsonPathTemplate` मान अपरिवर्तित रहते हैं — जब आपको लोअरकेस खंड चाहिए लेकिन `{locale}` को BCP-47 के रूप में रखना है, तो वहाँ `{llocale}` का उपयोग करें।

| प्लेसहोल्डर            | भूमिका                                                                                                       | उदाहरण                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | इस दस्तावेज़ीकरण ब्लॉक के `outputDir` का पूर्ण हल किया गया पथ                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | लक्ष्य स्थानीयकरण कोड (कॉन्फ़िग / CLI में उसी रूप में) | `de`, `pt-BR` |
| `{LOCALE}` | समान स्थानीयकरण ऊपरी केस में | `DE`, `PT-BR` |
| `{llocale}`            | समान लोकेल लोअरकेस (Astro मार्ग फ़ोल्डर जैसे `pt-br`, `zh-cn` से मेल खाता है)                               | `de`, `pt-br`                                                    |
| `{relPath}` | प्रोजेक्ट रूट के सापेक्ष स्रोत फ़ाइल पथ, POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | फ़ाइल नाम **बिना** एक्सटेंशन के | `guide` के लिए `docs/guide.md` |
| `{basename}` | फ़ाइल का नाम **सहित** एक्सटेंशन | `guide.md` |
| `{extension}` | डॉट **समेत** एक्सटेंशन | `.md`, `.mdx` |
| `{docsRoot}`           | `docsOutput.docsRoot` का पूर्ण हल किया गया पथ (अगर छोड़ा गया हो तो डिफ़ॉल्ट `docs`)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | जब पथ स्ट्रिंग्स मेल खाते हैं तो `docsRoot` उपसर्ग के साथ मिलान करके `{relPath}` से हटाया गया (POSIX); अन्यथा अपरिवर्तित | `docs/guide.md` (सामान्य); केवल जब हटाना लागू होता है तो `guide.md` |

**उदाहरण**

कॉन्फ़िग स्निपेट:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

लोकेल `de` और स्रोत `docs/guide.md` के लिए, प्रोजेक्ट रूट `/home/acme/repo` के साथ और `outputDir` का हल होना `/home/acme/repo/i18n`, विस्तारित पथ है:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

`docsOutput.style = "flat"` और कोई कस्टम `pathTemplate` नहीं होने पर, एक सामान्य पैटर्न केवल फ़ाइल नाम को `{stem}` और `{extension}` के माध्यम से रखता है, उदाहरण के लिए `{outputDir}/{stem}.{locale}{extension}`, जिसके परिणामस्वरूप हल किया गया `outputDir` के तहत `…/guide.de.md` प्राप्त होता है।

<a id="troubleshooting"></a>
### समस्या निवारण

**अनुवादित दस्तावेज़ों में खंड एंकर लिंक काम नहीं करते हैं**

`[label](../../docs/other.md#section-id)` जैसी लिंक सही अनुवादित फ़ाइल खोल सकती है लेकिन लक्षित शीर्षक तक स्क्रॉल करने में विफल रह सकती है — या गलत खंड पर जा सकती है। उस स्थानीयकरण में `#…` फ्रैगमेंट किसी भी शीर्षक `id` से मेल नहीं खाता है।

सामान्य कारण:

- स्रोत शीर्षकों में कभी स्पष्ट एंकर आईडी नहीं थीं; साइट दृश्यमान शीर्षक पाठ से स्लग्स निकालती है, जो अनुवाद के बाद बदल जाते हैं।
- आपने स्रोत में एक शीर्षक का नाम बदल दिया है लेकिन पिछली `<a id="…"></a>` पंक्ति गायब है या अभी भी पुरानी आईडी रखती है।
- एंकर लिंक अंग्रेजी शब्दों से अनुमानित `#…` फ्रैगमेंट का उपयोग करते हैं बजाय उस आईडी के जो `write-heading-ids` उत्पन्न करेगा।

**ठीक करें**

1. अपने **स्रोत** `.md` / `.mdx` पर `ai-i18n-tools write-heading-ids` चलाएँ (`translate-docs` के समान `docs[]` / `contentPaths`)। यह प्रत्येक ATX शीर्षक से पहले `<a id="slug"></a>` सम्मिलित करता है, या तब मौजूदा एंकर को ताज़ा करता है जब शीर्षक का पाठ वर्तमान स्लग से मेल नहीं खाता।
2. उन आइडी की ओर एंकर लिंक का लक्ष्य करें — उदाहरण के लिए `[setup](../../docs/guide.md#first-run)` जहाँ `#first-run` लक्ष्य शीर्षक के ऊपर एंकर पंक्ति से मेल खाता है, केवल अंग्रेजी शीर्षक से अनुमानित स्लग के बजाय।
3. `translate-docs` (या `sync --force-update`) को पुनः चलाएँ ताकि प्रत्येक स्थानीयकरण प्रतिलिपि अद्यतित एंकर पंक्तियों को शामिल करे।

`--dry-run` का उपयोग `write-heading-ids` पर सबसे पहले परिवर्तनों का पूर्वावलोकन करने के लिए करें। पूर्ण पैटर्न के लिए [सपाट लेआउट में एंकर लिंक](#anchor-links-when-docsoutputstyle--flat) देखें।

---

<a id="workflow-3---json-file-translation"></a>
## वर्कफ़्लो 3 - JSON फ़ाइल अनुवाद

इसे उन परियोजनाओं के लिए डिज़ाइन किया गया है जो UI कॉपी को स्रोत में `t("…")` के बजाय **स्थान के अनुसार नेस्टेड JSON फ़ाइलों में** रखते हैं (उदाहरण के लिए `src/i18n/en/translation.json`)। CLI उन फ़ाइलों में स्ट्रिंग मानों को प्रोसेस करता है, OpenRouter के माध्यम से उनका अनुवाद करता है, और `json[].outputPathTemplate` का उपयोग करके स्थान के अनुसार आउटपुट लिखता है। यह `translate-docs` और `translate-svg` (`cacheDir`) के समान SQLite कैश का उपयोग करता है।

इस वर्कफ़्लो में `extract` को चलाया **नहीं** जाता — यहाँ कोई `strings.json` कैटलॉग नहीं होता। इसे `features.translateJson` और शीर्ष-स्तरीय `json[]` में एक या अधिक प्रविष्टियों के साथ सक्षम करें।

<a id="step-1-initialise-for-nested-json"></a>
### चरण 1: नेस्टेड JSON के लिए आरंभ करें

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

वह टेम्पलेट `features.translateJson: true` सेट करता है, UI निष्कर्षण और दस्तावेज़ अनुवाद को अक्षम करता है, और `src/i18n/en/translation.json` की ओर इशारा करते हुए `src/i18n/{llocale}/translation.json` आउटपुट के साथ एकल `json[]` ब्लॉक का स्कैफ़ोल्ड बनाता है। अपने रिपो लेआउट के लिए `sourceLocale`, `targetLocales`, `contentPaths`, और `outputPathTemplate` में संपादन करें।

<a id="step-2-configure-json"></a>
### चरण 2: `json[]` को कॉन्फ़िगर करें

प्रत्येक `json[]` ब्लॉक एक पाइपलाइन का वर्णन करता है:

- `contentPaths` — एक या अधिक `.json` फ़ाइलें, निर्देशिकाएँ, या ग्लॉब्स (उदाहरण के लिए `"src/i18n/en/translation.json"` या `"src/i18n/en/overrides/*.json"`)। पथ परियोजना रूट से हल किए जाते हैं।
- `outputPathTemplate` — आवश्यक। प्रत्येक लक्ष्य स्थान के लिए फ़ाइल कहाँ लिखी जाए। प्लेसहोल्डर: `{locale}`, `{LOCALE}`, `{llocale}` (लोअरकेस स्थान, Astro रूट फ़ोल्डर के लिए उपयोगी), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`।
- `targetLocales` (वैकल्पिक) — केवल इस ब्लॉक के लिए उपसमुच्चय; अन्यथा रूट `targetLocales` लागू होता है।
- `keyPolicy` — कौन सी JSON कुंजियाँ अनुवादनीय गद्य रखती हैं बनाम स्थिर पहचानकर्ता (नीचे देखें)।
- `description` (वैकल्पिक) — CLI हेडर और `status` आउटपुट में दिखाया गया।

उदाहरण (एकाधिक स्रोत फ़ाइलें, लोअरकेस स्थान फ़ोल्डर):

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

| `mode`      | व्यवहार |
|-------------|-----------|
| `allowlist` | केवल `translateKeys` (डॉट पथ; minimatch ग्लॉब्स) से मेल खाने वाली कुंजियों का अनुवाद किया जाता है। |
| `denylist`  | `skipKeys` से मेल खाने वाली कुंजियों को छोड़कर सभी स्ट्रिंग मानों का अनुवाद करें। |
| `both`      | सबसे पहले `translateKeys` लागू करें, फिर `skipKeys` से मेल खाने वाले परिणाम हटा दें। |

पथ डॉट नोटेशन (`nav.home.label`) का उपयोग करते हैं। किसी भी गहराई पर अंतिम कुंजी खंड से मेल खाने के लिए `slug` जैसा एकल नाम।

<a id="step-3-translate-json-bundles"></a>
### चरण 3: JSON बंडल का अनुवाद करें

```bash
npx ai-i18n-tools translate-json
```

वैकल्पिक फ्लैग (`translate-docs` के समान विचार): `-l` / `--locale` लक्ष्यों के उपसमुच्चय के लिए, `-p` / `--path` फ़ाइलों को सीमित करने के लिए, `--dry-run`, `--force` (मिलान वाली फ़ाइलों के लिए फ़ाइल ट्रैकिंग और सेगमेंट कैश साफ़ करें), `--force-update` (फ़ाइल हैश मेल खाने पर पुनः प्रक्रिया; सेगमेंट कैश अभी भी लागू होता है), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`)।

केवल JSON परियोजनाएँ चला सकती हैं:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

जब UI या दस्तावेज़ भी सक्षम होते हैं, तो `sync` **translate-docs के बाद translate-json** चलाता है (जब तक `--no-json` न हो)। `--no-json` के साथ JSON को छोड़ दें।

प्रत्येक फ़ाइल और स्थान के लिए कवरेज की जाँच करें:

```bash
npx ai-i18n-tools status
```

जब `translateJson` चालू होता है, तो `status` एक `json[]` अनुभाग प्रिंट करता है (✓ अप टू डेट, ● स्टेल या लापता).

<a id="workflow-3-vs-other-pipelines"></a>
### वर्कफ़्लो 3 अन्य पाइपलाइन की तुलना में

| स्थिति | उपयोग |
|-----------|-----|
| `t("…")` में UI स्ट्रिंग्स / JS/TS/Astro में `i18n.t("…")` | [वर्कफ़्लो 1](#workflow-1---ui-translation) — `extract` + `translate-ui` |
| Markdown/MDX/`.astro` पृष्ठ या README अनुवाद | [वर्कफ़्लो 2](#workflow-2---document-translation) — `translate-docs` |
| डॉक्यूसॉरस `write-translations` कैटलॉग (`{ "key": { "message": "…", "description": "…" } }`) | वर्कफ़्लो 2 — `docs[].docusaurusCatalogDir` + `translate-docs`, **नहीं** `json[]` |
| स्टैंडअलोन नेस्टेड लोकेल JSON (ZenBrowser-शैली `translation.json` ट्री) | वर्कफ़्लो 3 — `json[]` + `translate-json` |
| `.svg` फ़ाइलों के साथ चित्रित `<text>` / `<title>` / `<desc>` | `features.translateSVG` + [`svg`](#svg) + `translate-svg` (वैकल्पिक; एक संख्यांकित वर्कफ़्लो नहीं) |

फ़ील्ड संदर्भ: [`json`](#json) [कॉन्फ़िगरेशन संदर्भ](#configuration-reference) में। सफाई के लिए कैश कुंजियाँ `json-block:{blockIndex}:{projectRelPath}` का उपयोग `file_tracking` में करती हैं।

---

<a id="combined-workflow-ui--docs"></a>
## संयुक्त कार्यप्रवाह (UI + दस्तावेज़)

एक ही कॉन्फ़िग में सभी सुविधाओं को सक्षम करें ताकि दोनों कार्यप्रवाह एक साथ चल सकें:

<details>
<summary>उदाहरण संयुक्त UI + दस्तावेज़ीकरण कॉन्फ़िग</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` दस्तावेज़ अनुवाद को UI के समान `strings.json` कैटलॉग पर इंगित करता है ताकि शब्दावली सुसंगत रहे; `glossary.userGlossary` उत्पाद शब्दों के लिए CSV ओवरराइड जोड़ता है।

`npx ai-i18n-tools sync` चलाएँ एक पाइपलाइन चलाने के लिए: जब `features.translateUIStrings` सक्षम होता है, तो पहले **एक्सट्रैक्ट** करें फिर **UI स्ट्रिंग्स अनुवादित** करें; वैकल्पिक **SVG अनुवाद** (`features.translateSVG` + `svg` ब्लॉक); **दस्तावेज़ीकरण अनुवाद** (`docs[]` के रूप में कॉन्फ़िगर किया गया है); फिर वैकल्पिक **अनुवाद-json** (`features.translateJson` + `json[]`)। भागों को `--no-ui`, `--no-svg`, `--no-docs`, या `--no-json` के साथ छोड़ें। दस्तावेज़ीकरण और `json[]` चरण `--dry-run`, `-p` / `--path`, `--force`, और `--force-update` स्वीकार करते हैं (`--no-docs` होने पर दस्तावेज़ीकरण केवल फ्लैग अनदेखी कर दिए जाते हैं; JSON उसी कैश फ्लैग का उपयोग करता है जब `--no-json` सेट नहीं होता है)।

`docs[].targetLocales` पर एक ब्लॉक का उपयोग करें उस ब्लॉक की फ़ाइलों को UI की तुलना में **छोटे उपसमुच्चय** में अनुवादित करने के लिए (प्रभावी दस्तावेज़ीकरण लोकेल ब्लॉक के पार **संघ** होते हैं):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docsoutputstyle--docusaurus--flat"></a>
### मिश्रित दस्तावेज़ीकरण वर्कफ़्लो (`docsOutput.style = "docusaurus"` + `"flat"`)

आप `docs` में एक से अधिक प्रविष्टियाँ जोड़कर एक ही कॉन्फ़िग में कई दस्तावेज़ीकरण पाइपलाइन को जोड़ सकते हैं। जब किसी प्रोजेक्ट में डॉक्यूसॉरस साइट (`docsOutput.style = "docusaurus"`) के साथ-साथ रूट-स्तर की मार्कडाउन फ़ाइलें (उदाहरण के लिए, `docsOutput.style = "flat"` के साथ एक रिपॉजिटरी README) होती हैं जिन्हें लोकेल-सफ़िक्स वाले फ़ाइलनेम के साथ अनुवादित किया जाना चाहिए, तो यह एक सामान्य सेटअप है।

<details>
<summary>उदाहरण मिश्रित Docusaurus + सपाट README कॉन्फ़िग</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

`npx ai-i18n-tools sync` के साथ यह कैसे चलता है:

- UI स्ट्रिंग्स को `src/` से `public/locales/` में निकाला/अनुवादित किया जाता है।
- पहला दस्तावेज़ ब्लॉक `docs-site/docs/` से `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` में **मार्कडाउन** अनुवादित करता है (स्थानीयकृत दस्तावेज़ीकरण पृष्ठ)।
- `docs[].docusaurusCatalogDir` सेट और `features.translateDocs` सक्षम होने पर, वही ब्लॉक `docs-site/i18n/en/` के तहत प्रत्येक लक्ष्य लोकेल फ़ोल्डर में **डॉक्यूसॉरस शेल JSON** भी अनुवादित करता है — नेवबार, फ़ुटर, और थीम/प्लगइन कैटलॉग, MDX बॉडी कॉपी नहीं।
- दूसरा दस्तावेज़ ब्लॉक `README.md` को `translated-docs/` के तहत लोकेल-सफ़िक्स वाली फ़ाइलों में अनुवादित करता है (`docsOutput.style = "flat"`)।
- सभी डॉक्स ब्लॉक `cacheDir` को साझा करते हैं, इसलिए अपरिवर्तित सेगमेंट्स को API कॉल और लागत को कम करने के लिए चलने के दौरान फिर से उपयोग किया जाता है।

---

<a id="translation-dashboard"></a>
## अनुवाद डैशबोर्ड

चलाएँ:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

यह आपके कॉन्फ़िगर किए गए `cacheDir` SQLite डेटाबेस द्वारा समर्थित एक स्थानीय वेब UI शुरू करता है — वही फ़ोल्डर जिसका CLI दस्तावेज़ीकरण सेगमेंट, लॉग और संबंधित मेटाडेटा के लिए उपयोग करता है। इसमें टैब **दस्तावेज़ीकरण** (कैश किए गए दस्तावेज़ सेगमेंट), **UI स्ट्रिंग्स**, **UI बहुवचन**, **शब्दावली**, **विफलताएँ**, **मार्कडाउन समस्याएँ**, और **आँकड़े** शामिल हैं।

![Translation Dashboard](../../docs/translation-dashboard.png)

यदि आप इस ऐप में **कैश पंक्तियों** को संपादित करते हैं (उदाहरण के लिए दस्तावेज़ीकरण खंड), तो `sync --force-update` या `--force-update` के साथ समकक्ष अनुवाद कमांड चलाएँ ताकि डिस्क पर आउटपुट कैश से मेल खाए; यदि बाद में रिपोजिटरी में **स्रोत पाठ** बदल जाता है, तो खंड हैश बदल जाते हैं और पुराने पाठ के लिए मैन्युअल संपादन अप्रचलित हो जाते हैं।

<a id="failures-document-translation"></a>
### विफलताएँ (दस्तावेज़ अनुवाद)

**विफलताएँ** टैब केवल **दस्तावेज़ीकरण** अनुवाद के लिए है। यह उन विफलता रिकॉर्ड को पढ़ता है जो SQLite में लिखे गए होते हैं जब किसी सेगमेंट को किसी लोकेल के लिए सफलतापूर्वक अनुवादित नहीं किया जा सका — उदाहरण के लिए खाली या अमान्य मॉडल आउटपुट, अनुवाद के बाद वैधीकरण त्रुटियाँ (`AST mismatch`, प्लेसहोल्डर लीक, और समान **गुणवत्ता** जाँच), या एक **घातक** स्थिति जो प्रगति को रोकती है। यह आपकी सहायता करता है: *कौन सा स्रोत सेगमेंट टूट गया, किस लोकेल और मॉडल के लिए, और कौन सा त्रुटि पाठ दर्ज किया गया था?*

<a id="when-to-use-it"></a>
#### इसका उपयोग कब करें

- `translate-docs` या `sync` के त्रुटियों के साथ, आंशिक स्थानीयकरणों या भ्रमित करने वाले लॉग के साथ समाप्त होने के बाद—आप केवल टर्मिनल आउटपुट को स्क्रॉल करने के बजाय विफलताओं को क्रमबद्ध और फ़िल्टर कर सकते हैं।
- जब आप **पुनः कार्य को प्राथमिकता** देना चाहते हैं: **# विफलताओं** द्वारा क्रमबद्ध करें ताकि पुनः प्रयास के दौरान बार-बार विफल रहे सेगमेंट सबसे पहले दिखाई दें; वे स्रोत मार्कडाउन में **सरल या पुनः स्वरूपित** करने के लिए मजबूत उम्मीदवार हैं ताकि भविष्य के रन सफल हो सकें।
- जब आपको **सटीक सेगमेंट**—फ़ाइलपाथ, पंक्ति संकेत, स्रोत हैश और पूरा स्रोत पाठ—की आवश्यकता होती है ताकि आप अपने रिपो में सही पैराग्राफ संपादित कर सकें।

<a id="why-source-edits-matter"></a>
#### स्रोत संपादन का महत्व क्यों है

घने इनलाइन मार्कअप (**बोल्ड** के साथ `` `code` `` का मिश्रण, नेस्टेड जोर, कई स्पैन वाले लंबे वाक्य) मॉडल के लिए संरचनात्मक जांच पास करने वाले अनुवाद लौटाना कठिन बना देते हैं। **कई बार दर्ज विफलताओं वाले खंडों** में अपरिवर्तित पाठ पर पुनः अनुवाद चलाने की तुलना में स्रोत को **पुनः लिखने या विभाजित** करने (या उदाहरणों को फेंस्ड कोड ब्लॉक में स्थानांतरित करने) से अधिक सुधार होता है। यह [जटिल मार्कडाउन और विफल गुणवत्ता जांच](#complex-markdown-and-failed-quality-checks) के अनुरूप है।

<a id="how-to-use-the-tab"></a>
#### टैब का उपयोग कैसे करें

1. डैशबोर्ड में **विफलताएँ** खोलें ([अनुवाद डैशबोर्ड](#translation-dashboard) के समान ब्राउज़र सत्र में)।
2. **सारांश** पट्टी पढ़ें (किसी भी विफलता वाले खंड, साथ ही **1**, **2**, या **3+** विफलता रिकॉर्ड वाले खंडों की गिनती के साथ)।
3. आंशिक **फ़ाइलनाम**, **स्थानीयकरण**, **मॉडल**, **गुणवत्ता त्रुटि** (मान आपके कैश से आते हैं), केवल **घातक**, और वैकल्पिक **स्रोत हैश**, **स्रोत पाठ**, या **त्रुटि संदेश** उपस्ट्रिंग द्वारा फ़िल्टर करें — फिर **लागू करें** पर क्लिक करें।
4. **छांटें: # विफलताएँ** (डिफ़ॉल्ट) या **छांटें: फ़ाइलपथ + पंक्ति #** चुनें।
5. तालिका के ऊपर या नीचे पृष्ठांकन का उपयोग करें। पूरा स्रोत पाठ टॉगल करने के लिए **एक पंक्ति पर क्लिक करें**। पंक्ति में लिंक नियंत्रण (जब सक्षम हो) सर्वर प्रक्रिया से `ai-i18n-tools dashboard` चल रहे **टर्मिनल** में फ़ाइल/पंक्ति संकेत लॉग करने का अनुरोध करता है—ब्राउज़र से अपने संपादक पर जाने के लिए उपयोगी है।  
6. अपने प्रोजेक्ट में **स्रोत फ़ाइल** ठीक करें, फिर `translate-docs` या `sync` को पुनः चलाएँ। यदि सफल चलाने के बाद सूची **पुरानी** लगती है, तो `ai-i18n-tools sync --force-update` चलाएँ और डैशबोर्ड को पुनः लोड करें (विफलता पैनल उसी संकेत को दिखाता है)।

यूआई के साथ फ़ाइल-आधारित डिबगिंग के लिए, आप अभी भी पुनः प्रयास के दौरान `translate-docs --debug-failed` का उपयोग करके `cacheDir` के तहत `FAILED-TRANSLATION` विवरण लिख सकते हैं—[कैश व्यवहार और `translate-docs` झंडे](#cache-behaviour-and-translate-docs-flags) देखें।

<a id="markdown-issues-static-checks"></a>
### मार्कडाउन मुद्दे (स्थिर जांच)

**मार्कडाउन समस्याएँ** टैब `markdown_source_issues` SQLite तालिका की पंक्तियाँ सूचीबद्ध करता है। प्रत्येक पंक्ति एक **पूर्व-अनुवाद** निष्कर्ष है: उदाहरण के लिए डिलिमिटर रन जो कभी भी CommonMark-शैली के नियमों के तहत जोड़े नहीं जाते हैं `translate-docs` का उपयोग मास्किंग के लिए करता है, बैकटिक्स के साथ खोला गया एक इनलाइन कोड स्पैन जो कभी बंद नहीं होता, `STRONG_OUTSIDE_INLINE_CODE` जब `**` / `__` एक `` `...` `` स्पैन को लपेटता है (बैकटिक्स के अंदर जोर दें या सादा कोड का उपयोग करें), या `STRONG_OUTSIDE_LINK` जब `**` / `__` एक `[text](../../docs/url)` लिंक को लपेटता है (केवल लिंक टेक्स्ट के अंदर बोल्ड डालें)। यह **नहीं** है **विफलताएँ**, जो प्रति-लोकेल मॉडल आउटपुट और अनुवाद-पश्चात सत्यापन समस्याओं (`AST mismatch`, प्लेसहोल्डर रिसाव, और इसी तरह) को रिकॉर्ड करता है।

इस टैब का उपयोग तब करें जब आप टोकन खर्च करने से पहले **स्रोत मार्कडाउन** को ठीक करना चाहते हों—विशेष रूप से जब गुणवत्ता जांच में संरचना पर लगातार विफलता आ रही हो। फ़ाइलपाथ (कैश कुंजी के खिलाफ आंशिक मिलान, `doc-block:{index}:` उपसर्ग सहित), **मुद्दा कोड**, या **स्रोत हैश** द्वारा फ़िल्टर करें; फ़ाइलपाथ + पंक्ति या नवीनतम स्कैन समय के अनुसार क्रमबद्ध करें। लिंक बटन उस टर्मिनल में फ़ाइल/पंक्ति संकेत लॉग करता है जहां `ai-i18n-tools dashboard` चल रहा है (दस्तावेज़ीकरण टैब के समान अवधारणा)।

**पंक्तियों को ताज़ा करना:** `ai-i18n-tools check-markdown` चलाएँ (वैकल्पिक `-p` / `--path` स्कोप, `--no-cache` SQLite को छोड़ने के लिए, `--json` stdout पर मशीन-पठनीय आउटपुट के लिए जबकि मानव पंक्तियाँ stderr पर)। डिफ़ॉल्ट रूप से प्रत्येक `translate-docs` मार्कडाउन फ़ाइल रन भी उस फ़ाइल के लिए पंक्तियों को फिर से स्कैन और प्रतिस्थापित करता है जब `docs[].warnMarkdownSourceIssues` को `false` पर सेट नहीं किया जाता है। कैश फ़ाइलपाथ के लिए सभी अनुवादों को साफ़ करने से विफलताओं के समान सफाई पथ के भाग के रूप में उस फ़ाइलपाथ के लिए मार्कडाउन समस्या पंक्तियाँ हटा दी जाती हैं।

---

<a id="configuration-reference"></a>
## विन्यास संदर्भ

<a id="sourcelocale"></a>
### `sourceLocale`

स्रोत भाषा के लिए BCP-47 कोड (उदाहरण के लिए `"en-GB"`, `"en"`, `"pt-BR"`)। इस लोकेल के लिए कोई अनुवाद फ़ाइल उत्पन्न नहीं की जाती है — कुंजी स्ट्रिंग स्वयं स्रोत पाठ है।

**आपकी रनटाइम i18n सेटअप फ़ाइल (`src/i18n.ts` / `src/i18n.js`) से निर्यात किए गए `SOURCE_LOCALE` से मेल खाना चाहिए**।

<a id="targetlocales"></a>
### `targetLocales`

अनुवाद करने के लिए BCP-47 स्थानीयकरण कोड्स की सरणी (उदाहरण के लिए `["de", "fr", "es", "pt-BR"]`)।

`targetLocales` UI अनुवाद के लिए प्राथमिक स्थानीयकरण सूची है और दस्तावेज़ीकरण ब्लॉक्स के लिए डिफ़ॉल्ट स्थानीयकरण सूची है। `sourceLocale` + `targetLocales` से `ui-languages.json` मैनिफेस्ट बनाने के लिए `generate-ui-languages` का उपयोग करें।

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (वैकल्पिक)

प्रदर्शन नामों, स्थानीयकरण फ़िल्टरिंग और भाषा-सूची पश्च-प्रसंस्करण के लिए उपयोग किए जाने वाले `ui-languages.json` मैनिफेस्ट का पथ। जब छोड़ दिया जाता है, तो CLI `ui.flatOutputDir/ui-languages.json` पर मैनिफेस्ट की तलाश करता है।

इसका उपयोग तब करें जब:

- मैनिफेस्ट `ui.flatOutputDir` के बाहर स्थित है और आपको CLI को स्पष्ट रूप से इसकी ओर इशारा करने की आवश्यकता है।
- आप [भाषा स्विचर पोस्ट-प्रोसेसिंग](#language-switcher-languagelistblock) (`languageListBlock`) का उपयोग मैनिफेस्ट से लोकेल लेबल बनाने के लिए करना चाहते हैं।
- `extract` को `englishName` प्रविष्टियों को `strings.json` में मर्ज करना चाहिए (`ui.reactExtractor.includeUiLanguageEnglishNames: true` की आवश्यकता है)।

<a id="concurrency-optional"></a>
### `concurrency` (वैकल्पिक)

अधिकतम **लक्ष्य स्थानीयकरण** जो एक साथ अनुवादित किए जाते हैं (`translate-ui`, `translate-docs`, `translate-svg`, और `sync` के भीतर मिलान वाले चरण)। यदि छोड़ दिया जाता है, तो CLI UI अनुवाद के लिए **4** और दस्तावेज़ीकरण अनुवाद के लिए **3** का उपयोग करता है (अंतर्निहित डिफ़ॉल्ट)। प्रत्येक रन के लिए `-j` / `--concurrency` के साथ अधिरोपित करें।

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (वैकल्पिक)

**translate-docs** और **translate-svg** (और `sync` का दस्तावेज़ीकरण चरण): प्रति फ़ाइल अधिकतम समानांतर OpenRouter **बैच** अनुरोध (प्रत्येक बैच में कई खंड हो सकते हैं)। छोड़ने पर डिफ़ॉल्ट **4**। `translate-ui` द्वारा अनदेखा। `-b` / `--batch-concurrency` के साथ अधिरोपित करें। `sync` पर, `-b` केवल दस्तावेज़ीकरण अनुवाद चरण पर लागू होता है।

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (वैकल्पिक)

`translate-docs` और `sync` के दौरान **एक ही लोकेल के भीतर** एक साथ संसाधित की जाने वाली फ़ाइलों की अधिकतम संख्या। जब **1** से अधिक मान पर सेट किया जाता है, तो मेमोरी उपयोग को नियंत्रित करने के लिए सेमाफोर का उपयोग करके एक ही लोकेल के भीतर फ़ाइलों को समानांतर रूप से संसाधित किया जाता है। डिफ़ॉल्ट रूप से **1** (अनुक्रमिक प्रसंस्करण) जब छोड़ा जाता है। उच्च मान I/O-बाउंड संचालनों के लिए थ्रूपुट में काफी सुधार कर सकते हैं, विशेष रूप से जब सभी सेगमेंट पहले से कैश किए गए हों (कोई API कॉल आवश्यक नहीं)।

**उदाहरण:**

```json
{
  "fileConcurrency": 4
}
```

**उपयोग का मामला:** `sync --force-update` चलाते समय 100% कैश हिट के साथ कुल संसाधन समय को कम करने के लिए इसे `2-4` पर सेट करें। सुधार बहुत सारी छोटी फ़ाइलों के साथ सबसे अधिक ध्यान देने योग्य होता है।

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (वैकल्पिक)

दस्तावेज़ अनुवाद के लिए खंड बैचिंग: प्रति API अनुरोध कितने खंड, और अक्षर सीमा। डिफ़ॉल्ट: **20** खंड, **4096** अक्षर (जब छोड़ दिया जाता है)।

<a id="openrouter"></a>
### `openrouter`

- `baseUrl`
  OpenRouter API आधार URL। डिफ़ॉल्ट: `https://openrouter.ai/api/v1`।
- `translationModels`
  मॉडल आईडी की प्राथमिकता वाली क्रमबद्ध सूची। पहले प्रयास में पहले आईडी का उपयोग किया जाता है; त्रुटि पर बाद की प्रविष्टियाँ बैकअप के रूप में होती हैं। केवल `translate-ui` के लिए, आप `ui.preferredModel` सेट करके इस सूची से पहले एक मॉडल का प्रयास भी कर सकते हैं (देखें `ui`)।
- `defaultModel`
  पुराना एकल प्राथमिक मॉडल। केवल तभी उपयोग किया जाता है जब `translationModels` सेट नहीं है या खाली है।
- `fallbackModel`
  पुराना एकल बैकअप मॉडल। `defaultModel` के बाद उपयोग किया जाता है जब `translationModels` सेट नहीं है या खाली है।
- `maxTokens`
  प्रति अनुरोध अधिकतम पूर्ति टोकन। डिफ़ॉल्ट: `8192`।
- `temperature`
  नमूनाकरण तापमान। डिफ़ॉल्ट: `0.2`।
- `requestTimeoutMs`
  OpenRouter (चैट पूर्ति और आंतरिक `GET /models` कॉल) के लिए प्रत्येक HTTP अनुरोध की प्रतीक्षा करने का मिलीसेकंड में अधिकतम समय। डिफ़ॉल्ट: `30000` (30 सेकंड)।

**एकाधिक मॉडल का उपयोग क्यों करें:** विभिन्न प्रदाता और मॉडलों की लागत भिन्न होती है और भाषाओं और स्थानीयकरण के आधार पर गुणवत्ता के अलग-अलग स्तर प्रदान करते हैं। `openrouter.translationModels` को **एक क्रमबद्ध फॉलबैक श्रृंखला** के रूप में कॉन्फ़िगर करें (एकल मॉडल के बजाय), ताकि CLI अनुरोध विफल होने पर अगले मॉडल का प्रयास कर सके।

नीचे दी गई सूची को एक **आधारभूत रूपरेखा** के रूप में देखें जिसे आप विस्तारित कर सकते हैं: यदि किसी विशिष्ट स्थानीयकरण के लिए अनुवाद खराब या असफल है, तो अनुसंधान करें कि कौन से मॉडल उस भाषा या लिपि का प्रभावी ढंग से समर्थन करते हैं (ऑनलाइन संसाधनों या आपके प्रदाता के दस्तावेज़ीकरण को देखें), और उन OpenRouter ID को आगे के विकल्प के रूप में जोड़ें।

इस सूची का परीक्षण 36 लक्ष्य स्थानीयकरणों वाले एक बड़े दस्तावेज़ीकरण प्रोजेक्ट में **व्यापक स्थानीयकरण कवरेज** के लिए किया गया था; यह एक व्यावहारिक डिफ़ॉल्ट के रूप में कार्य करती है, लेकिन यह गारंटी नहीं है कि यह हर स्थानीयकरण के लिए अच्छा प्रदर्शन करेगी।

उदाहरण `translationModels` (`npx ai-i18n-tools init` के समान डिफ़ॉल्ट):

<details>
<summary>डिफ़ॉल्ट translationModels फॉलबैक सूची</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

अपने वातावरण में या `.env` फ़ाइल में `OPENROUTER_API_KEY` सेट करें।

`translationModels` में बदलाव करने से पहले, OpenRouter के लाइव कैटलॉग (`GET /models`) के खिलाफ प्रत्येक कॉन्फ़िगर किए गए मॉडल आईडी को सत्यापित करने के लिए `npx ai-i18n-tools check-models` चलाएं। यह उन आईडी की रिपोर्ट करता है जो लापता हैं या `expiration_date` समय सीमा पार कर चुके हैं, मान्य मॉडल्स की सूची देता है जिनके लिए अनुमानित इनपुट/आउटपुट मूल्य निर्धारण (1M टोकन प्रति USD) है, और किसी भी कॉन्फ़िगर की गई आईडी के अमान्य होने पर गैर-शून्य स्थिति के साथ बाहर आ जाता है। `OPENROUTER_API_KEY` की आवश्यकता होती है।

<a id="features"></a>
### `features`

| फ़ील्ड | वर्कफ़्लो | विवरण |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1 | `t("…")` / `i18n.t("…")` को `strings.json` में निकालें, फिर प्रविष्टियों का अनुवाद करें और प्रति-स्थानीय सपाट JSON लिखें (निकास्त्र स्वचालित रूप से चलता है; केवल कैटलॉग को ताज़ा करने के लिए स्वतंत्र `extract` का उपयोग करें)। |
| `translateDocs` | 2 | `.md` / `.mdx` / `.astro` पृष्ठों का अनुवाद करें; जब `docs[].docusaurusCatalogDir` सेट हो तो Docusaurus शेल JSON। |
| `translateJson` | 3 | `json[]` के तहत मनमाना नेस्टेड JSON (`translate-json`)। |
| `translateSVG` | — | `.svg` फ़ाइलों का अनुवाद करें (शीर्ष-स्तरीय `svg` ब्लॉक की आवश्यकता होती है)। |

**अनुवाद** SVG फ़ाइलों को `translate-svg` के साथ जब `features.translateSVG` सत्य है और एक शीर्ष-स्तरीय `svg` ब्लॉक कॉन्फ़िगर किया गया है। `sync` कमांड उस चरण को चलाता है जब दोनों सेट हों (जब तक `--no-svg` न हो)।

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  `t("…")` कॉल्स के लिए स्कैन की गई डायरेक्टरीज़ या ग्लोब पैटर्न (cwd के सापेक्ष)। `src/` या `["src/**/*.ts"]` जैसे पैटर्न्स को सपोर्ट करता है।
- `stringsJson`  
  मास्टर कैटलॉग फ़ाइल का पाथ। `extract` द्वारा अपडेट किया गया।
- `flatOutputDir`  
  वह डायरेक्टरी जहाँ प्रति-लोकेल JSON फ़ाइलें लिखी जाती हैं (`de.json`, आदि)।
- `preferredModel`  
  वैकल्पिक। केवल `translate-ui` के लिए पहले आज़माया गया OpenRouter मॉडल आईडी; फिर बिना इस आईडी को दोहराए क्रम में `openrouter.translationModels` (या लीगेसी मॉडल)।
- `uiExtractor.funcNames` (या विरासती `reactExtractor.funcNames`)  
  स्कैन करने के लिए अतिरिक्त फ़ंक्शन नाम (डिफ़ॉल्ट: `["t", "i18n.t"]`)।
- `uiExtractor.extensions` (या विरासती `reactExtractor.extensions`)  
  शामिल करने के लिए फ़ाइल एक्सटेंशन (डिफ़ॉल्ट: `[".js", ".jsx", ".ts", ".tsx"]`)। Astro फ्रंटमैटर और टेम्पलेट अभिव्यक्तियों के लिए `.astro` जोड़ें।
- `uiExtractor.includePackageDescription` (या विरासती `reactExtractor.includePackageDescription`)  
  जब `true` (डिफ़ॉल्ट), `extract` भी UI स्ट्रिंग के रूप में `package.json` `description` को शामिल करता है जब यह मौजूद होता है।
- `uiExtractor.packageJsonPath` (या विरासती `reactExtractor.packageJsonPath`)  
  उस वैकल्पिक विवरण निष्कर्षण के लिए उपयोग की जाने वाली `package.json` फ़ाइल के लिए कस्टम पथ।
- `uiExtractor.includeUiLanguageEnglishNames` (या विरासती `reactExtractor.includeUiLanguageEnglishNames`)

जब `true` (डिफ़ॉल्ट `false`), `extract` मैनिफेस्ट में `uiLanguagesPath` पर से प्रत्येक `englishName` को तब स्रोत स्कैन से पहले से मौजूद न होने पर `strings.json` में जोड़ता है (समान हैश कुंजियाँ)। आवश्यकता है `uiLanguagesPath` एक वैध `ui-languages.json` की ओर इशारा करे।

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite कैश निर्देशिका (सभी `docs` ब्लॉक द्वारा साझा की गई)। चलने के बीच पुनः उपयोग। यदि आप कस्टम दस्तावेज़ अनुवाद कैश से माइग्रेट कर रहे हैं, तो इसे संग्रहीत या हटा दें — `cacheDir` अपना स्वयं का SQLite डेटाबेस बनाता है और अन्य स्कीमा के साथ संगत नहीं है।

<a id="best-practice-for-git-exclusions"></a>
#### गिट बहिष्करण के लिए सर्वोत्तम प्रथा:

- अनुवाद कैश फ़ोल्डर की सामग्री को बहिष्कृत करें (उदाहरण के लिए, `.gitignore` या `.git/info/exclude` का उपयोग करके) अस्थायी कैश आर्टिफैक्ट्स को प्रतिबद्ध करने से बचने के लिए।
- `cache.db` को बनाए रखें (इसे नियमित रूप से न डिलीट करें), क्योंकि SQLite कैश को संरक्षित रखने से अपरिवर्तित खंडों को पुनः अनुवादित होने से बचाया जाता है। यह `ai-i18n-tools` का उपयोग करने वाले सॉफ़्टवेयर को अपडेट या संशोधित करते समय रनटाइम और API लागत दोनों को बचाता है।
- अस्थायी और लॉग फ़ाइलों को बहिष्कृत करें ताकि बैकअप और डीबग-संबंधित फ़ाइलों को प्रतिबद्ध करने से बचा जा सके।

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

<a id="docs"></a>
### `docs`

दस्तावेज़ीकरण पाइपलाइन ब्लॉक की एक सरणी। `translate-docs` और `sync` का दस्तावेज़ चरण **प्रत्येक** ब्लॉक को क्रम में संसाधित करता है। पुरानी कुंजियाँ (`documentations`, `markdownOutput`, `jsonSource`) अभी भी लोड समय पर स्वीकार की जाती हैं और जब कॉन्फ़िग फ़ाइल लिखने योग्य होती है तो पुनः लिखी जाती हैं; नए कॉन्फ़िग में `docs`, `docsOutput`, और `docusaurusCatalogDir` को प्राथमिकता दें।

**सामग्री स्रोत**

- `description`
इस ब्लॉक के लिए वैकल्पिक मानव-पठनीय नोट (अनुवाद के लिए उपयोग नहीं किया जाता है)। जब सेट किया जाता है तो `translate-docs` `🌐` शीर्षक में उपसर्ग के रूप में जोड़ा जाता है; `status` अनुभाग शीर्षक में भी दिखाया जाता है।
- `contentPaths`
अनुवाद के लिए Markdown/MDX पृष्ठ निकाय और `.astro` टेम्पलेट (`translate-docs` इन्हें `.md`, `.mdx`, और `.astro` के लिए स्कैन करता है)। **निर्देशिका पथ या ग्लोब पैटर्न** का समर्थन करता है (उदाहरण के लिए `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`)। यहीं से स्थानीयकृत दस्तावेज़ीकरण पाठ आता है।
- `sourceFiles`
वैकल्पिक उपनाम जो लोड समय पर `contentPaths` में मर्ज होता है।
- `targetLocales`
केवल इस ब्लॉक के लिए भाषाओं का वैकल्पिक उपसमुच्चय (अन्यथा मूल `targetLocales`)। प्रभावी दस्तावेज़ीकरण भाषाएँ ब्लॉक्स में संयुक्त रूप से होती हैं।
- `docusaurusCatalogDir`
वैकल्पिक। इस ब्लॉक के लिए Docusaurus JSON लेबल कैटलॉग के लिए स्रोत निर्देशिका (उदाहरण के लिए `"i18n/en"` से `docusaurus write-translations`)। पृष्ठ निकाय हमेशा `contentPaths` से आते हैं; `docusaurusCatalogDir` केवल शेल/UI JSON की आपूर्ति करता है, MDX नहीं।

**आउटपुट लेआउट**

- `outputDir`
इस ब्लॉक के लिए अनुवादित आउटपुट के लिए मूल निर्देशिका।
- `docsOutput.style`
`"nested"` (डिफ़ॉल्ट), `"flat"`, `"doc-system"`, या उपनाम `"docusaurus"` / `"astro-starlight"`।
- `docsOutput.localeSubpath`
`{locale}/` और `{relativeToDocsRoot}` के बीच `doc-system` के लिए पथ खंड (सीधे `style: "doc-system"` का उपयोग करते समय आवश्यक; उपनाम का उपयोग करते समय पूर्व-सेट)। Starlight-शैली भाषा फ़ोल्डर के लिए `""` का उपयोग करें।
- `docsOutput.docsRoot`
Docusaurus लेआउट के लिए स्रोत दस्तावेज़ मूल (उदाहरण के लिए `"docs"`)।
- `docsOutput.pathTemplate`
कस्टम मार्कडाउन आउटपुट पथ। प्लेसहोल्डर: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>।
- `docsOutput.jsonPathTemplate`
लेबल फ़ाइलों के लिए कस्टम JSON आउटपुट पथ। `pathTemplate` के समान प्लेसहोल्डर का समर्थन करता है।
- `docsOutput.localePathLowercase`
जब `true`, तो बिल्ट-इन आउटपुट लेआउट (`nested`, `flat`, `doc-system` बिना `pathTemplate`) पथ में लोअरकेस भाषा खंड का उपयोग करते हैं। डिफ़ॉल्ट `false`; `astro-starlight` और `doc-system` खाली `localeSubpath` के साथ कॉन्फ़िग लोड पर `true` पर डिफ़ॉल्ट होते हैं।
- `docsOutput.flatPreserveRelativeDir`
जब `docsOutput.style = "flat"`, तो स्रोत उपनिर्देशिकाओं को बरकरार रखें ताकि समान बेसनेम वाली फ़ाइलें टकराएँ नहीं।
- `docsOutput.rewriteRelativeLinks`
अनुवाद के बाद सापेक्ष लिंक को पुनः लिखें (`docsOutput.style = "flat"` और कोई कस्टम `pathTemplate` नहीं होने पर स्वचालित रूप से सक्षम)।
- `docsOutput.linkRewriteDocsRoot`
फ्लैट-लिंक पुनः लेखन उपसर्ग की गणना करते समय उपयोग किया जाने वाला रिपो मूल। आमतौर पर इसे `"."` के रूप में छोड़ दें, जब तक कि आपके अनुवादित दस्तावेज़ एक अलग प्रोजेक्ट मूल के तहत नहीं हैं।

**पोस्ट-प्रोसेसिंग**

- `docsOutput.postProcessing`
अनुवादित **मार्कडाउन निकाय** पर वैकल्पिक परिवर्तन (YAML कुंजियाँ और गैर-पाठ प्रारंभ भाग मान संरक्षित रहते हैं)। खंड पुनः असेंबली और फ्लैट लिंक पुनः लेखन के बाद चलता है, और `addFrontmatter` से पहले।
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` की क्रमबद्ध सूची। `search` एक रेगेक्स पैटर्न है (सादा स्ट्रिंग फ्लैग `g` का उपयोग करता है, या `/pattern/flags`)। `replace` प्लेसहोल्डर का समर्थन करता है जैसे `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`।
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — स्रोत और अनुवादित मार्कडाउन में "अन्य भाषाओं में पढ़ें" लिंक पंक्ति को पुनः उत्पन्न करता है। सेटअप, व्यवहार और रिपोजिटरी उदाहरणों के लिए [भाषा स्विचर (`languageListBlock`)](#language-switcher-languagelistblock) देखें।

**व्यवहार और मेटाडेटा**

- `translateFrontmatterFields`
`docsOutput` के समान स्तर पर (`docs[]` ब्लॉक के अनुसार)। डिफ़ॉल्ट `true`: स्टारलाइट/डॉक्यूसॉरस के लिए यूजर-फेसिंग YAML प्रोज़ (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next` लेबल) का अनुवाद करें। पूरे फ्रंट मैटर ब्लॉक को अपरिवर्तित रखने के लिए `false` सेट करें; विशिष्ट डॉट-पथ तक सीमित करने के लिए एक स्ट्रिंग ऐरे पास करें।
- `segmentSplitting`
`docsOutput` के समान स्तर पर (`docs[]` ब्लॉक के अनुसार)। `translate-docs` निष्कर्षण के लिए वैकल्पिक सूक्ष्म खंड: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`। जब `enabled` `true` होता है (`segmentSplitting` छोड़े जाने पर डिफ़ॉल्ट), घने पैराग्राफ, GFM पाइप टेबल (पहला खंड हेडर, सेपरेटर और पहली डेटा पंक्ति शामिल करता है), और लंबी सूचियों को विभाजित किया जाता है; उप-भाग एकल न्यूलाइन के साथ पुनः जुड़ते हैं (`tightJoinPrevious`)। केवल खाली-पंक्ति-विभाजित बॉडी ब्लॉक के प्रति एक खंड का उपयोग करने के लिए `"enabled": false` सेट करें।
- `warnMarkdownSourceIssues`
जब `true` (छोड़े जाने पर डिफ़ॉल्ट), प्रत्येक `translate-docs` चलन संकेतकों / अपूर्ण इनलाइन कोड के लिए मार्कडाउन खंडों को पुनः स्कैन करता है, टर्मिनल चेतावनियां प्रिंट करता है, और उस फ़ाइल के कैश फ़ाइलपाथ के लिए `markdown_source_issues` पंक्तियों को प्रतिस्थापित करता है। इस ब्लॉक के लिए चेतावनियों और SQLite अपडेट को छोड़ने के लिए `false` सेट करें।
- `addFrontmatter`
जब `true` (छोड़े जाने पर डिफ़ॉल्ट), अनुवादित मार्कडाउन फ़ाइलों में YAML कुंजियां शामिल होती हैं: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, और जब कम से कम एक खंड में मॉडल मेटाडेटा होता है, तो `translation_models` (उपयोग किए गए OpenRouter मॉडल आईडी की क्रमबद्ध सूची)। छोड़ने के लिए `false` पर सेट करें।

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
वैकल्पिक। अतिरिक्त JSX/HTML विशेषता नाम जिनके **उद्धृत स्ट्रिंग मान** अनुवादक को नहीं भेजे जाने चाहिए। अंतर्निहित डिफ़ॉल्ट के साथ विलय (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, अधिकांश `aria-*`, आदि)। केस-संवेदनशील नहीं। लागू होता है:

- `.astro` पार्स-एंड-रिप्लेस निष्कर्षण (`attr=` के बाद स्थिर HTML टैग और स्ट्रिंग लिटरल्स `{expression}` ब्लॉक्स के अंदर)।
  - मार्कडाउन/एस्ट्रो सेगमेंट अनुवाद के दौरान MDX प्लेसहोल्डर निष्कर्षण (`label`, `tooltip`, और `aria-label` कैपिटलाइज्ड JSX टैग्स पर, और जहां लागू हो `TabItem` `value`)।

उदाहरण: `"protectAttributes": ["variant", "size"]` `variant="primary"` को `{items.map(...)}` के अंदर सभी स्थानीयकरण में अपरिवर्तित रखता है।

आप सामान्य रूप से अनुवाद योग्य विशेषताओं (उदाहरण के लिए `"title"` या `"aria-label"`) को भी सूचीबद्ध कर सकते हैं जब आप उन मानों को अंग्रेजी से शाब्दिक रूप से कॉपी करना चाहते हैं।

- `protectKeys`
वैकल्पिक। अतिरिक्त **ऑब्जेक्ट प्रॉपर्टी नाम** जिनके उद्धृत स्ट्रिंग मानों को टेम्पलेट `{expression}` ब्लॉक्स और MDX ऑब्जेक्ट लिटरल्स के अंदर अनुवादित नहीं किया जाना चाहिए (उदाहरण के लिए `label:` के अंदर `<Tabs values={[ … ]}>`)। बिल्ट-इन डिफ़ॉल्ट के साथ मर्ज किया जाता है (`class`, `key`, `id`, `href`, `src`, आदि)। केस-असंवेदनशील।

उदाहरण: `"protectKeys": ["slug", "code"]` `{ slug: 'getting-started', title: 'Getting started' }` को छोड़ देता है → केवल `title` का अनुवाद किया जाता है जब `slug` संरक्षित है।

<br/>

**उदाहरण (`docsOutput.style = "flat"` — स्क्रीनशॉट पथ + वैकल्पिक भाषा सूची रैपर):**

<details>
<summary>फ़्लैट लेआउट पोस्ट-प्रोसेसिंग उदाहरण (स्क्रीनशॉट + languageListBlock)</summary>

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

<a id="json"></a>
### `json`

नेस्टेड JSON अनुवाद पाइपलाइन की शीर्ष-स्तरीय ऐरे। केवल तभी उपयोग किया जाता है जब `features.translateJson` सत्य हो (`translate-json` या `sync` का JSON चरण)। [वर्कफ़्लो 3 - JSON फ़ाइल अनुवाद](#workflow-3---json-file-translation) देखें।

| फ़ील्ड | विवरण |
|-------|-------------|
| `description` | CLI / `status` के लिए वैकल्पिक नोट (अनुवादित नहीं)। |
| `contentPaths` | प्रोजेक्ट रूट के तहत स्रोत `.json` फ़ाइलें, निर्देशिकाएं या ग्लोब्स। |
| `outputPathTemplate` | प्रति लक्ष्य स्थानीयकरण के लिए आवश्यक आउटपुट पथ। प्लेसहोल्डर: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`। |
| `targetLocales` | इस ब्लॉक के लिए वैकल्पिक उपसमुच्चय; अन्यथा मूल `targetLocales`। |
| `keyPolicy.mode` | `allowlist`, `denylist`, या `both`। |
| `keyPolicy.translateKeys` | डॉट पथ / ग्लोब्स जिन्हें शामिल करना है जब मोड `allowlist` या `both` हो। |
| `keyPolicy.skipKeys` | डॉट पथ / ग्लोब्स जिन्हें बहिष्कृत करना है (डिफ़ॉल्ट निषेध सूची में `id`, `slug`, `href`, `url`, `key`, `code` शामिल हैं)। |

<a id="svg"></a>
### `svg`

SVG फ़ाइलों के लिए शीर्ष-स्तरीय पथ और लेआउट। अनुवाद केवल तभी चलता है जब `features.translateSVG` सत्य होता है (`translate-svg` या `sync` के SVG चरण के माध्यम से)।

| फ़ील्ड            | विवरण                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | एक या अधिक निर्देशिकाएं **या ग्लोब पैटर्न** (उदाहरण के लिए `"images/*.svg"`, `"**/icons/*.svg"`)। पैटर्न प्रोजेक्ट रूट के सापेक्ष हल किए जाते हैं और `.svg` फ़ाइलों के लिए पुनरावर्ती रूप से स्कैन किए जाते हैं।                                                                         |
| `outputDir`                   | अनुवादित SVG आउटपुट के लिए रूट निर्देशिका।                                                                                                                                                                                                                                          |
| `style`                       | जब `pathTemplate` सेट नहीं है तो `"flat"` या `"nested"`।                                                                                                                                                                                                                               |
| `pathTemplate`   | कस्टम SVG आउटपुट पथ। प्लेसहोल्डर: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>। |
| `localePathLowercase` | जब `true`, तो अंतर्निहित `flat` / `nested` SVG लेआउट लोअरकेस लोकेल सेगमेंट का उपयोग करते हैं। कस्टम `pathTemplate` मान अपरिवर्तित रहते हैं; लोअरकेस सेगमेंट के लिए `{llocale}` का उपयोग करें। |
| `forceLowercase` | SVG पुनःसंयोजन पर लोअर-केस अनुवादित पाठ। ऐसे डिज़ाइनों के लिए उपयोगी है जो सभी लोअर-केस लेबल पर निर्भर करते हैं।                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| क्षेत्र          | विवरण                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | मौजूदा अनुवादों से स्वचालित रूप से एक शब्दावली बनाने के लिए `strings.json` का पथ।                                                                                                 |
| `userGlossary` | `Original language string` (या `en`), `locale`, `Translation` के साथ एक CSV का पथ - प्रत्येक स्रोत शब्द और लक्ष्य स्थानीयकरण के लिए एक पंक्ति (`locale` सभी लक्ष्यों के लिए `*` हो सकता है)। |

**एक खाली शब्दावली CSV उत्पन्न करें:**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI संदर्भ

| कमांड                                                                                                    | विवरण                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                                  | CLI संस्करण और बिल्ड टाइमस्टैम्प प्रिंट करें (मूल प्रोग्राम पर `-V` / `--version` के समान जानकारी)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website\|ui-json-bundles] [-o path] [--with-translate-ignore]` | एक स्टार्टर कॉन्फ़िग फ़ाइल लिखें (`concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, और `docs[].addFrontmatter` शामिल हैं)। `ui-json-bundles` वर्कफ़्लो 3 को स्कैफ़ोल्ड करता है (केवल `json[]`)। `--with-translate-ignore` एक स्टार्टर `.translate-ignore` बनाता है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `check-models`                                                                           | प्रत्येक विन्यस्त OpenRouter मॉडल आईडी को `GET /models` के विरुद्ध मान्य करें (कैटलॉग सदस्यता, `expiration_date`, प्रॉम्प्ट/पूर्ति के लिए 1M टोकन प्रति USD)। `OPENROUTER_API_KEY` की आवश्यकता होती है। यदि कोई भी विन्यस्त आईडी लापता या समाप्त हो गई है, तो गैर-शून्य कोड पर बाहर निकलता है। कैटलॉग अनुरोध के लिए `openrouter.requestTimeoutMs` का पालन करता है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `extract` | `strings.json` को `t("…")` / `i18n.t("…")` शाब्दिकों से, वैकल्पिक `package.json` विवरण और वैकल्पिक मैनिफेस्ट `englishName` प्रविष्टियों से अद्यतन करें (देखें `ui.reactExtractor`)। गैर-खाली `ui.sourceRoots` की आवश्यकता होती है। |
| `generate-ui-languages [--master <path>] [--dry-run]`                                    | `sourceLocale` + `targetLocales` और bundled `data/ui-languages-complete.json` (या `--master`) का उपयोग करके `ui.flatOutputDir` (या सेट होने पर `uiLanguagesPath`) में `ui-languages.json` लिखें। मास्टर फ़ाइल में गायब स्थानीयकरण के लिए चेतावनी देता है और `TODO` प्लेसहोल्डर उत्सर्जित करता है। यदि आपके पास अनुकूलित `label` या `englishName` मानों के साथ एक मौजूदा मैनिफेस्ट है, तो उन्हें मास्टर कैटलॉग डिफ़ॉल्ट द्वारा प्रतिस्थापित कर दिया जाएगा — बाद में उत्पन्न फ़ाइल की समीक्षा करें और समायोजित करें।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                                         | प्रत्येक `docs` ब्लॉक (`contentPaths`, वैकल्पिक `docusaurusCatalogDir`) के लिए मार्कडाउन/MDX और JSON का अनुवाद करें। `-j`: अधिकतम समानांतर स्थानीयकरण; `-b`: प्रति फ़ाइल अधिकतम समानांतर बैच API कॉल। `--prompt-format`: बैच वायर फॉर्मेट (`xml` \| `json-array` \| `json-object`)। देखें [कैश व्यवहार और `translate-docs` फ्लैग](#cache-behaviour-and-translate-docs-flags) और [बैच प्रॉम्प्ट प्रारूप](#batch-prompt-format)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …`                                                                                      | कम से कम एक `docs[]` ब्लॉक की आवश्यकता होती है। प्रत्येक ब्लॉक के `contentPaths` के तहत `.md` / `.mdx` एकत्र करता है (`.translate-ignore` का पालन करता है)। प्रत्येक सपाट ATX `#` हेडिंग के तुरंत **पहले** एक HTML एंकर लाइन `<a id="slug"></a>` सम्मिलित करता है (फेंस किए गए कोड ब्लॉक्स के अंदर की हेडिंग्स को छोड़कर); जब एंकर लाइन पहले से मौजूद होती है, तो वर्तमान हेडिंग टेक्स्ट से प्राप्त स्लग से मेल न खाने पर `id` को अपडेट करता है। `-p` / `--path` या `-f` / `--file`: प्रोजेक्ट-सापेक्ष फ़ाइल या निर्देशिका तक सीमित करें। `--slug-style`: `github` (डिफ़ॉल्ट; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`। `pymdown` के साथ, वैकल्पिक `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`। `--dry-run`: केवल परिवर्तनों की सूची दिखाएं।                                                                                                                                                                                                                                                                                                                                    |
| `strip-md-bold-inline …`                                                                                   | कम से कम एक `docs[]` ब्लॉक की आवश्यकता होती है। प्रत्येक ब्लॉक के `contentPaths` के तहत `.md` / `.mdx` में इनलाइन कोड के चारों ओर के `**` को हटाता है (`.translate-ignore` का पालन करता है)। `-p` / `--path` या `-f` / `--file`, `--dry-run`, `--no-backup` (ओवरराइट से पहले टाइमस्टैम्प वाले `.backup.*` को छोड़ें)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `check-markdown …`                                                                                         | प्रत्येक `docs[]` ब्लॉक के अंतर्गत `contentPaths` में मार्कडाउन/MDX को स्कैन करता है (`translate-docs` के समान खोज, `.translate-ignore` का पालन करता है): डिलिमिटर जोड़ीकरण, अपूर्ण इनलाइन कोड, और जब `**`/`__` एक `` `...` `` स्पैन या `[text](../../docs/url)` लिंक को घेरते हैं तो `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK`। `-p` / `--path` या `-f` / `--file`: वैकल्पिक स्कोप। कोई भी समस्या होने पर **stderr** में `relativePath:line: [ISSUE_CODE] message` लाइनें प्रिंट करता है; बाहर निकलने का कोड **1** होता है। `--json`: **stdout** पर JSON रिपोर्ट। जब तक `--no-cache` न हो, `cacheDir` में `markdown_source_issues` लिखता है। `-v` stderr लाइनों में स्रोत हैश जोड़ता है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                        | `config.svg` में कॉन्फ़िगर किए गए SVG फ़ाइलों का अनुवाद करता है (दस्तावेज़ों से अलग)। `features.translateSVG` की आवश्यकता होती है। दस्तावेज़ों के समान कैश विचार; उस रन के लिए SQLite पढ़ने/लिखने को छोड़ने के लिए `--no-cache` का समर्थन करता है। `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                               | केवल UI स्ट्रिंग्स का अनुवाद करें (`strings.json` → स्थानीय JSON)। `-l` / `--locale`: अल्पविराम से अलग किए गए लक्ष्य स्थानीयकरण (प्रति विन्यास / `ui-languages.json` से डिफ़ॉल्ट)। `--force`: प्रत्येक स्थानीयकरण के लिए सभी प्रविष्टियों का पुनः अनुवाद करें (मौजूदा अनुवादों की अनदेखी करें)। `--dry-run`: कोई लेखन नहीं, कोई API कॉल नहीं। `-j`: अधिकतम समानांतर स्थानीयकरण। `features.translateUIStrings` की आवश्यकता होती है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `translate-json …`                                                                                         | `json[]` के अनुसार नेस्टेड JSON का अनुवाद करें (`features.translateJson` की आवश्यकता होती है)। साझा किया गया SQLite कैश; `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`। [वर्कफ़्लो 3](#workflow-3---json-file-translation) देखें।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                      | UI स्ट्रिंग्स निकालें, फिर अनुवाद करें (`features.translateUIStrings` की आवश्यकता होती है)। केवल UI — कोई डॉक्यूमेंटेशन, SVG, या `json[]` नहीं। `translate-ui` के समान `-l`, `--force`, `--dry-run`, और `-j` विकल्प।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                      | `extract` को **पहले** चलाता है (`features.translateUIStrings` की आवश्यकता होती है) ताकि `strings.json` स्रोत से मेल खाए, फिर **स्रोत-स्थानीयकरण** UI स्ट्रिंग्स की LLM समीक्षा (वर्तनी, व्याकरण)। **शब्दावली संकेत** केवल `glossary.userGlossary` CSV से आते हैं (`translate-ui` के समान क्षेत्र — `strings.json` / `uiGlossary` नहीं, ताकि खराब प्रतिलिपि को शब्दकोश के रूप में पुष्ट न किया जाए)। OpenRouter (`OPENROUTER_API_KEY`) का उपयोग करता है। केवल सलाहकार (रन पूरा होने पर **0** पर निकलता है)। `cacheDir` के तहत `lint-source-results_<timestamp>.log` को एक **मानव-पठनीय** रिपोर्ट के रूप में लिखता है (सारांश, समस्याएँ, और प्रति-स्ट्रिंग **OK** पंक्तियाँ); टर्मिनल केवल सारांश गणना और समस्याएँ प्रिंट करता है (प्रति स्ट्रिंग `[ok]` पंक्तियाँ नहीं)। अंतिम पंक्ति पर लॉग फ़ाइल का नाम प्रिंट करता है। `--json`: केवल मानक आउटपुट पर पूर्ण मशीन-पठनीय JSON रिपोर्ट (लॉग फ़ाइल मानव-पठनीय रहती है)। `--dry-run`: अभी भी `extract` चलाता है, फिर केवल बैच योजना प्रिंट करता है (कोई API कॉल नहीं)। `--chunk`: प्रति API बैच स्ट्रिंग्स (डिफ़ॉल्ट **50**)। `-j`: अधिकतम समानांतर बैच (डिफ़ॉल्ट `concurrency`)। `--json` के साथ, मानव-शैली आउटपुट stderr पर जाता है। लिंक `path:line` का उपयोग करते हैं जैसे `dashboard` UI स्ट्रिंग्स का “लिंक” बटन। |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`              | XLIFF 2.0 में `strings.json` निर्यात करें (प्रत्येक लक्ष्य स्थान के लिए एक `.xliff`)। `-o` / `--output-dir`: आउटपुट निर्देशिका (डिफ़ॉल्ट: कैटलॉग के समान फ़ोल्डर)। `--untranslated-only`: केवल उस स्थान के लिए अनुवाद लापता इकाइयाँ। केवल पढ़ने योग्य; कोई API नहीं।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                                   | निकालें (यदि सक्षम है), फिर UI अनुवाद, फिर `translate-svg` जब `features.translateSVG` और `config.svg` सेट हों, फिर दस्तावेज़ीकरण अनुवाद, फिर `translate-json` जब `features.translateJson` और `json[]` सेट हों — जब तक `--no-ui`, `--no-svg`, `--no-docs`, या `--no-json` के साथ छोड़ा न जाए। साझा फ्लैग: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (दस्तावेज़ और JSON बैचिंग), `--force` / `--force-update` (दस्तावेज़ और JSON)। दस्तावेज़ चरण `--emphasis-placeholders` और `--debug-failed` को भी आगे भेजता है (`translate-docs` के समान अर्थ के साथ)। `--prompt-format` एक `sync` फ्लैग नहीं है; दस्तावेज़ और JSON चरण बिल्ट-इन डिफ़ॉल्ट (`json-array`) का उपयोग करते हैं।                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `status [--max-columns <n>]`                                                             | जब `features.translateUIStrings` चालू होता है, तो प्रत्येक स्थान के लिए UI कवरेज प्रिंट करता है (`Translated` / `Missing` / `Total`)। फिर प्रत्येक फ़ाइल × स्थान के लिए मार्कडाउन अनुवाद स्थिति प्रिंट करता है (कोई `--locale` फ़िल्टर नहीं; स्थान कॉन्फ़िग से आते हैं)। बड़ी स्थान सूचियों को अधिकतम `n` स्थान कॉलम (डिफ़ॉल्ट **9**) की दोहराई गई तालिकाओं में विभाजित किया जाता है ताकि टर्मिनल में पंक्तियाँ संकीर्ण रहें।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                         | मुद्रण प्रलेखन कैशे और `strings.json` आँकड़े (अनुवाद डैशबोर्ड → **आँकड़े** के समान संक्षिप्त आँकड़े)। `--max-columns`: प्रति मॉडल अधिकतम स्थानीय स्तंभ × स्थानीय तालिका (डैशबोर्ड के मिलान के अनुसार डिफ़ॉल्ट)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                                    | पहले `sync --force-update` चलाता है (निकालें, UI, SVG, docs), फिर बेकार सेगमेंट पंक्तियाँ हटाता है (null `last_hit_at` / खाली फ़ाइलपथ); उन `file_tracking` पंक्तियों को हटाता है जिनका संकल्पित स्रोत पथ डिस्क पर अनुपलब्ध है; अनुवाद पंक्तियों को हटाता है जिनका `filepath` मेटाडेटा लापता फ़ाइल की ओर इशारा करता है। तीन गिनतियाँ लॉग करता है (बेकार, अनाथ `file_tracking`, अनाथ अनुवाद)। कैश डिरेक्टरी के अंतर्गत एक समय-स्टैम्प वाला SQLite बैकअप बनाता है, जब तक कि `--no-backup` न हो।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                               | **कोई कॉन्फ़िग नहीं।** एक निर्देशिका वृक्ष (डिफ़ॉल्ट: cwd) में `*.log` और `cache.db.backup*.sqlite` के लिए चलता है, `./…` पथों को `find -print` की तरह मुद्रित करता है। मिलान के साथ: `Delete these files? (y/n)` को प्रॉम्प्ट करता है, जब तक कि `-f` / `--force` न हो (प्रॉम्प्ट के बिना हटाएँ)। कोई मिलान नहीं होने पर: प्रॉम्प्ट किए बिना बाहर निकलता है। `--dry-run`: केवल सूची, कोई प्रॉम्प्ट या हटाना नहीं (`--force` को अधिरोपित करता है)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                      | अनुवाद डैशबोर्ड लॉन्च करें (कैश सेगमेंट्स, `strings.json`, शब्दावली, विफलताएँ और आँकड़े के लिए स्थानीय वेब UI)। `--no-open` के साथ, डिफ़ॉल्ट ब्राउज़र स्वचालित रूप से नहीं खुलता है। अप्रचलित उपनाम `editor` अभी भी काम करता है लेकिन एक चेतावनी प्रिंट करता है।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `glossary-generate [-o <path>]`                                                          | एक खाली `glossary-user.csv` टेम्पलेट लिखें। `-o`: आउटपुट पथ को ओवरराइड करें (डिफ़ॉल्ट: कॉन्फ़िग से `glossary.userGlossary`, या `glossary-user.csv`)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                         | किसी सबकमांड के लिए सहायता प्रदर्शित करें (`ai-i18n-tools <command> --help` के समान आउटपुट)।                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

<a id="root-and-global-options"></a>
### रूट और वैश्विक विकल्प

| विकल्प                       | स्कोप         | विवरण                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | रूट प्रोग्राम  | संस्करण संख्या और बिल्ड टाइमस्टैम्प आउटपुट करें (`version` सबकमांड के समान जानकारी)। |
| `-h` / `--help`              | रूट प्रोग्राम  | रूट प्रोग्राम या कमांड नाम के साथ उपयोग करने पर किसी सबकमांड के लिए सहायता प्रदर्शित करें।      |
| `-c` / `--config <path>`     | प्रत्येक कमांड | कॉन्फ़िगरेशन फ़ाइल का पथ (डिफ़ॉल्ट: `ai-i18n-tools.config.json`)।                                  |
| `-v` / `--verbose`           | प्रत्येक कमांड | विस्तृत लॉगिंग।                                                                          |
| `-w` / `--write-logs [path]` | प्रत्येक कमांड | कंसोल आउटपुट को एक `.log` फ़ाइल में टी करें (डिफ़ॉल्ट पथ: रूट `cacheDir` के अंतर्गत)।                |

<a id="per-command-help"></a>
### प्रति-कमांड सहायता

| उपयोग                            | विवरण                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | उस कमांड के लिए सभी विकल्प।      |
| `ai-i18n-tools help <command>`   | `<command> --help` के समान आउटपुट। |

<a id="target-locales--l----locale"></a>
### लक्ष्य स्थानीयकरण (`-l` / `--locale`)

| कमांड                                                                                   | व्यवहार                                                                                                                                               |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — अल्पविराम से अलग किए गए लक्ष्य BCP-47 कोड (उदाहरण के लिए `de,fr,pt-BR`)। जब ओमिट किया जाता है, तो कॉन्फ़िग से डिफ़ॉल्ट आते हैं (`json[]` ब्लॉक प्रति-ब्लॉक `targetLocales` भी सेट कर सकते हैं)। UI चरण `ui-languages.json` का भी उपयोग करते हैं। |
| `lint-source`                                                                           | `-l` / `--locale <code>` — समीक्षा के लिए एकल स्रोत स्थानीयकरण (डिफ़ॉल्ट: कॉन्फ़िग `sourceLocale`)।                                                            |

---

<a id="environment-variables"></a>
## वातावरण चर

| चर               | विवरण                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **आवश्यक।** आपकी OpenRouter API कुंजी।                     |
| `OPENROUTER_BASE_URL`   | API बेस URL को ओवरराइड करें।                                 |
| `I18N_SOURCE_LOCALE`    | रनटाइम पर `sourceLocale` को ओवरराइड करें।                        |
| `I18N_TARGET_LOCALES`   | `targetLocales` को ओवरराइड करने के लिए अल्पविराम से अलग स्थानीयकरण कोड।  |
| `I18N_LOG_LEVEL`        | लॉगर स्तर (`debug`, `info`, `warn`, `error`, `silent`)। |
| `NO_COLOR`              | जब `1`, लॉग आउटपुट में ANSI रंग अक्षम करें।              |
| `I18N_LOG_SESSION_MAX`  | प्रति लॉग सत्र अधिकतम पंक्तियाँ (डिफ़ॉल्ट `5000`)।           |
