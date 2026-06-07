<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm संस्करण](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm डाउनलोड](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![लाइसेंस: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

जावास्क्रिप्ट/टाइपस्क्रिप्ट एप्लिकेशन और डॉक्यूमेंटेशन साइट्स को [OpenRouter](https://openrouter.ai/) के माध्यम से लार्ज लैंग्वेज मॉडल्स का उपयोग करके अंतरराष्ट्रीयकरण के लिए एक CLI और टूलकिट। तीन मॉड्यूलर वर्कफ़्लो, जो सभी एकल कॉन्फ़िग फ़ाइल साझा करते हैं, विभिन्न अनुवाद आवश्यकताओं का समर्थन करते हैं:

- **वर्कफ़्लो 1 — UI अनुवाद:** JS/TS से `t("…")` कॉल निकालता है (और वैकल्पिक रूप से `.astro` फ़ाइलों से) और i18next या स्टैटिक SSG लुकअप के लिए प्रति-स्थानीय स्तर पर फ्लैट JSON उत्पन्न करता है।
- **वर्कफ़्लो 2 — दस्तावेज़ अनुवाद:** `docs[].contentPaths` में सूचीबद्ध मार्कडाउन, MDX और `.astro` पृष्ठों (वेबसाइट्स और Starlight के लिए) का `translate-docs` का उपयोग करके अनुवाद करता है।
- **वर्कफ़्लो 3 — JSON फ़ाइल अनुवाद:** `json[]` में परिभाषित किसी भी अनुवाद योग्य नेस्टेड JSON बंडल का अनुवाद करता है। जब UI कॉपी स्रोत में `t()` के बजाय प्रति-स्थानीय स्तर पर JSON फ़ाइलों में संग्रहीत होती है, तो `translate-json` का उपयोग करें।

**SVG** संपत्तियों का अनुवाद `features.translateSVG`, शीर्ष-स्तरीय `svg` ब्लॉक और `translate-svg` का उपयोग करके किया जाता है — `docs[].contentPaths` का नहीं।

**मुझे कौन सा वर्कफ़्लो उपयोग करना चाहिए?**
- स्रोत `t()` का उपयोग करता है → **वर्कफ़्लो 1** (`extract` / `translate-ui`)
- स्थानीयकृत पृष्ठ या Docusaurus कैटलॉग JSON → **वर्कफ़्लो 2** (`translate-docs`)
- केवल स्वतंत्र, नेस्टेड JSON स्थानीय फ़ाइलें → **वर्कफ़्लो 3** (`translate-json`)

सभी वर्कफ़्लो एक फ़ाइल/SQLite कैश बनाए रखते हैं ताकि केवल नए या बदले गए खंडों (स्ट्रिंग्स या टेक्स्ट चंक्स) को LLM को भेजा जाए।

<small>**अन्य भाषाओं में पढ़ें:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**विषय सूची**

- [मुख्य वर्कफ़्लो](#core-workflows)
- [स्थापना](#installation)
  - [CLI का उपयोग करना](#using-the-cli)
- [OpenRouter](#openrouter)
- [त्वरित शुरुआत](#quick-start)
  - [वर्कफ़्लो 1 - UI अनुवाद](#workflow-1---ui-translation)
  - [वर्कफ़्लो 2 - दस्तावेज़ अनुवाद](#workflow-2---document-translation)
  - [Astro (सादा Astro & Starlight)](#astro-plain-astro--starlight)
  - [संयुक्त वर्कफ़्लो](#combined-workflow)
- [रनटाइम हेल्पर्स](#runtime-helpers)
- [CLI कमांड्स](#cli-commands)
- [डॉक्यूमेंटेशन](#documentation)
- [लाइसेंस](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## मुख्य वर्कफ़्लो

**वर्कफ़्लो 1 - UI अनुवाद** — i18next (React, Next.js, Node.js, CLIs) या स्टैटिक Astro SSG का उपयोग करने वाले किसी भी JS/TS प्रोजेक्ट के लिए

स्रोत फ़ाइलों में `t("…")` / `i18n.t("…")` लिटरल्स के लिए स्कैन करता है (`ui.uiExtractor.extensions` में Astro फ्रंटमैटर और टेम्पलेट एक्सप्रेशन के लिए `.astro` जोड़ें), एक मास्टर कैटलॉग (`strings.json`) बनाता है, OpenRouter के माध्यम से प्रति-स्थानीय स्तर पर अनुपलब्ध प्रविष्टियों का अनुवाद करता है, और फ्लैट JSON फ़ाइलें (`de.json`, `pt-BR.json`, …) लिखता है। उन बंडल में अंग्रेजी स्रोत पाठ रनटाइम लुकअप कुंजी है — `strings.json` निकासी कैश है, रनटाइम बंडल नहीं।

**वर्कफ़्लो 2 - दस्तावेज़ अनुवाद** — `docs[].contentPaths` के तहत मार्कडाउन, MDX और `.astro` के लिए

मुख्य रूप से **मार्कडाउन, MDX और `.astro` डॉक्यूमेंटेशन** (Docusaurus, [Astro Starlight](https://starlight.astro.build/), सादा README फ़ाइलें और सादा Astro मार्केटिंग पृष्ठ) के लिए डिज़ाइन किया गया है। `translate-docs` साझा SQLite कैश के साथ स्थानीयकृत प्रतियां लिखता है। Docusaurus साइट्स पर, शेल JSON (नेविगेशन पट्टी, फ़ुटर, थीम स्ट्रिंग्स) को एक ही कमांड में अनुवादित करने के लिए `docs[].docusaurusCatalogDir` को `write-translations` कैटलॉग फ़ोल्डर पर सेट करें। `docs[].docsOutput.style` `"nested"`, `"flat"`, `"doc-system"` और उपनाम `"docusaurus"` / `"astro-starlight"` का समर्थन करता है (शुरुआत में [आउटपुट लेआउट](docs/GETTING_STARTED.hi.md#output-layouts) देखें)। वह मनमाना नेस्टेड UI JSON जो Docusaurus कैटलॉग नहीं है, वर्कफ़्लो 3 (`json[]` / `translate-json`) में होना चाहिए, `docs[]` में नहीं।

**वर्कफ़्लो 3 - JSON फ़ाइल अनुवाद** — स्रोत में `t()` के बिना नेस्टेड स्थानीय JSON

`src/i18n/en/translation.json` जैसी फ़ाइलों का शीर्ष-स्तरीय `json[]`, `features.translateJson` और `translate-json` के माध्यम से अनुवाद करें। `init -t ui-json-bundles` के साथ स्कैफ़ोल्ड करें।

सभी वर्कफ़्लो `ai-i18n-tools.config.json` को साझा करते हैं और उन्हें संयोजित किया जा सकता है; `sync` आपके `features` फ़्लैग के अनुसार क्रम में निकासी, UI अनुवाद, SVG अनुवाद, `translate-docs` और `translate-json` चलाता है।

---

<a id="installation"></a>
## स्थापना

प्रकाशित पैकेज **केवल ESM** (`"type": "module"`) है। Node.js `>=22.16.0` आवश्यक है।

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### CLI का उपयोग करना

**प्रति-प्रोजेक्ट (अनुशंसित)** — एक डेव निर्भरता के रूप में स्थापित करें, फिर `npx`, `pnpm exec`, या एक `package.json` स्क्रिप्ट के माध्यम से चलाएं:

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

आप सीधे ai-i18n-tools CLI कमांड्स का भी उपयोग कर सकते हैं, उदाहरण के लिए `ai-i18n-tools sync`।

मैन्युअल रूप से चलाते समय क्रम और फीचर फ़्लैग्स गलत होने की संभावना होती है, इसलिए `extract`, `translate-ui`, `translate-svg`, `translate-docs` और `translate-json` को हाथ से जोड़ने की तुलना में `sync` को प्राथमिकता दें। शुरुआत में [अनुशंसित `package.json` स्क्रिप्ट्स](docs/GETTING_STARTED.hi.md#recommended-packagejson-scripts) देखें।

**शून्य-स्थापना एकल उपयोग** — `npx ai-i18n-tools <cmd>` या `pnpm dlx ai-i18n-tools <cmd>` (केवल उस निष्पादन के लिए डाउनलोड करता है)।

> **सुझाव:** `npx` के बिना एक इंटरैक्टिव शेल में `ai-i18n-tools` को सीधे चलाने के लिए, `PATH` में `node_modules/.bin` जोड़ें (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`)। डायरेन्व और विंडोज निर्देशों के लिए [शुरुआत करें](docs/GETTING_STARTED.hi.md#installation) देखें।

अपनी OpenRouter API कुंजी सेट करें:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

OpenRouter को कॉल करने वाली कमांड्स (`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models` और संबंधित स्क्रिप्ट्स) को पर्यावरण में `OPENROUTER_API_KEY` की आवश्यकता होती है। `check-markdown` OpenRouter का उपयोग नहीं करता है।

`ai-i18n-tools.config.json` में, `openrouter` ऑब्जेक्ट में मॉडल सूचियाँ, `baseUrl`, `maxTokens`, `temperature`, और `requestTimeoutMs` शामिल हैं: OpenRouter के लिए प्रत्येक HTTP अनुरोध (चैट पूर्ति और आंतरिक `GET /models` कॉल) के लिए प्रतीक्षा करने का अधिकतम समय मिलीसेकंड में। डिफ़ॉल्ट `30000` (30 सेकंड) है।

प्रत्येक कॉन्फ़िगर किए गए मॉडल आईडी को OpenRouter के लाइव कैटलॉग के खिलाफ सत्यापित करने के लिए `ai-i18n-tools check-models` चलाएं। यह लापता या समाप्त `expiration_date` आईडी की रिपोर्ट करता है, अनुमानित इनपुट/आउटपुट मूल्य निर्धारण (1M टोकन प्रति अमेरिकी डॉलर) के साथ वैध मॉडल की सूची बनाता है, और किसी भी कॉन्फ़िगर की गई आईडी अमान्य होने पर गैर-शून्य स्थिति के साथ बाहर निकलता है। इसके लिए `OPENROUTER_API_KEY` की आवश्यकता होती है।

---

<a id="quick-start"></a>
## त्वरित प्रारंभ

<a id="workflow-1---ui-translation"></a>
### कार्यप्रवाह 1 - UI अनुवाद

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

फिर अपने ऐप में `'ai-i18n-tools/runtime'` से हेल्पर का उपयोग करके i18next को जोड़ें। पूर्ण सेटअप के लिए शुरुआत करें गाइड में [चरण 4: रनटाइम पर i18next को जोड़ें](docs/GETTING_STARTED.hi.md#step-4-wire-i18next-at-runtime) देखें।

<a id="workflow-2---document-translation"></a>
### कार्यप्रवाह 2 - दस्तावेज़ अनुवाद

डिफ़ॉल्ट `init` टेम्पलेट (`ui-markdown`) केवल UI निकासी को सक्षम करता है। `translate-docs` से पहले डॉक्स-उन्मुख टेम्पलेट का उपयोग करें (या `features.translateDocs` सक्षम करें और `docs[]` जोड़ें):

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

`ai-i18n-tools.config.json` संपादित करें: `docs[].contentPaths` को मार्कडाउन, MDX, और/या `.astro` स्रोतों पर सेट करें; `docs[].outputDir` और `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"flat"`, आदि)। पूर्ण फ़ील्ड संदर्भ: [वर्कफ़्लो 2 - डॉक्यूमेंट ट्रांसलेशन](docs/GETTING_STARTED.hi.md#workflow-2---document-translation)।

<a id="astro-plain-astro--starlight"></a>
### एस्ट्रो (सादा एस्ट्रो और स्टारलाइट)

**एस्ट्रो स्टारलाइट** — `init -t ui-starlight`, फिर `translate-docs`। स्टारलाइट UI ओवरराइड आवश्यकता पड़ने पर एक अलग `docs[]` ब्लॉक में `jsonPathTemplate` के साथ `src/content/i18n/en.json` का उपयोग कर सकते हैं ([सुरुआत करें → वर्कफ़्लो 2](docs/GETTING_STARTED.hi.md#step-1-initialise-for-documentation))।

**सादा एस्ट्रो** (मार्केटिंग या ऐप साइट्स, स्टारलाइट नहीं) — [एस्ट्रो बिल्ट-इन i18n रूटिंग](https://docs.astro.build/en/guides/internationalization/) को ai-i18n-tools के साथ जोड़ें। संदर्भ प्रोजेक्ट: [`examples/astro-website`](../examples/astro-website/) (अंग्रेज़ी `/` पर, स्थानीयकरण `/{locale}/` पर)।

अधिकांश टीमें दो पाइपलाइनों के **संकर** का उपयोग करती हैं:

| पाइपलाइन | उपयोग के लिए | कमांड | आउटपुट |
|----------|---------|----------|--------|
| **पृष्ठ HTML** | शीर्षक, पैराग्राफ, नेविगेशन लेबल, टेम्पलेट बॉडी में इनलाइन सरणियाँ | `translate-docs` | प्रति स्थानीयकरण `src/pages/{locale}/index.astro` |
| **UI स्ट्रिंग्स (`t()`)** | फ्रंटमैटर डेटा, टैब लेबल, साझा सरणियाँ | `extract` → `translate-ui` | `public/locales/{locale}.json` (अंग्रेज़ी स्रोत के रूप में कुंजी) |

`init -t ui-astro-website` के साथ UI स्कैफ़ोल्ड करें। `.astro` पृष्ठों में हार्डकोडेड HTML के लिए, `features.translateDocs` सक्षम करें और `docsOutput.style: "astro-starlight"` के साथ एक `docs[]` ब्लॉक जोड़ें (देखें [एस्ट्रो वेबसाइट पृष्ठ (पार्स-एंड-रिप्लेस)](docs/GETTING_STARTED.hi.md#astro-website-pages-parse-and-replace))। `targetLocales`, `i18n.locales` को `astro.config.mjs` में रखें, और `ui-languages.json` संरेखित रखें (एस्ट्रो रूट्स लोअरकेस कोड जैसे `pt-br` का उपयोग करते हैं; फ्लैट बंडल फ़ाइलनेम कॉन्फ़िग केसिंग का अनुसरण करते हैं, उदाहरण के लिए `pt-BR.json`)।

जब तक आप क्लाइंट आइलैंड्स न जोड़ें, तब तक बिल्ड समय पर i18next के बिना `t()` को जोड़ दें — देखें [एस्ट्रो वेबसाइट UI स्ट्रिंग्स (SSG)](docs/GETTING_STARTED.hi.md#astro-website-ui-strings-ssg) और उदाहरण का `src/i18n/t.ts`।

<a id="combined-workflow"></a>
### संयुक्त कार्यप्रवाह

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## रनटाइम हेल्पर्स

`'ai-i18n-tools/runtime'` से निम्नलिखित सहायक निर्यात किए जाते हैं और किसी भी जावास्क्रिप्ट वातावरण में काम करते हैं। उनका उपयोग करने के लिए आपको i18next आयात करने की आवश्यकता नहीं है:

| सहायक                                                                 | विवरण                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | कुंजी-के-रूप-में-डिफ़ॉल्ट सेटअप के लिए मानक i18next प्रारंभिकीकरण विकल्प।                                                                               |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | अनुशंसित वायरिंग: `strings.json` से कुंजी-ट्रिम + बहुवचन `wrapT`, वैकल्पिक रूप से `translate-ui` `{sourceLocale}.json` बहुवचन कुंजी मर्ज करता है। |
| `wrapT(i18n, options)`                                                 | निम्न-स्तरीय बहुवचन-जागरूक `t()` रैपर (आमतौर पर `setupKeyAsDefaultT` द्वारा स्थापित)।                                                    |
| `buildPluralIndexFromStringsJson(entries)`                               | `"plural": true` के साथ कैटलॉग पंक्तियों से बहुवचन समूह सूचकांक बनाता है जिसका उपयोग `wrapT` करता है।                                                    |
| `extractInterpolationNamesForWrap(key)`                                  | स्रोत कुंजी से `{{var}}` नामों को `wrapT` / कुंजी-छंटनी फॉलबैक के लिए पार्स करता है।                                                              |
| `wrapI18nWithKeyTrim(i18n)` | केवल निम्न-स्तरीय कुंजी-ट्रिम रैपर (ऐप वायरिंग के लिए अप्रचलित; `setupKeyAsDefaultT` को प्राथमिकता दें)। |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | `ui-languages.json` से `makeLoadLocale` के लिए `localeLoaders` मैप बनाता है (`sourceLocale` को छोड़कर प्रत्येक `code`)। |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | असमकालिक स्थानीयकरण फ़ाइल लोडिंग के लिए फ़ैक्टरी। |
| `getTextDirection(lng)` | एक BCP-47 कोड के लिए `'ltr'` या `'rtl'` लौटाता है। |
| `applyDirection(lng, element?)` | `document.documentElement` पर `dir` विशेषता सेट करता है। |
| `getUILanguageLabel(lang, t)` | भाषा मेनू पंक्ति के लिए प्रदर्शन लेबल (i18n के साथ)। |
| `getUILanguageLabelNative(lang)` | `t()` को कॉल किए बिना प्रदर्शन लेबल (शीर्षक-शैली)। |
| `interpolateTemplate(str, vars)` | एक सादे स्ट्रिंग पर निम्न-स्तरीय `{{var}}` प्रतिस्थापन (आंतरिक रूप से उपयोग किया जाता है; ऐप कोड को इसके बजाय `t()` का उपयोग करना चाहिए)। |
| `flipUiArrowsForRtl(text, isRtl)` | दाएं से बाएं लेआउट के लिए `→` को `←` में फ्लिप करता है। |

---

<a id="cli-commands"></a>
## CLI कमांड्स

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

प्रति-कमांड फ्लैग सूचियाँ [शुरुआत करें — CLI संदर्भ](docs/GETTING_STARTED.hi.md#cli-reference) में उपलब्ध हैं। अंतर्निहित उपयोग पाठ के लिए `ai-i18n-tools <command> --help` चलाएं।

प्रत्येक कमांड पर वैश्विक विकल्प: `-c <config>` (डिफ़ॉल्ट: `ai-i18n-tools.config.json`), `-v` (विस्तृत), वैकल्पिक `-w` / `--write-logs [path]` कंसोल आउटपुट को लॉग फ़ाइल में टी करने के लिए (डिफ़ॉल्ट: अनुवाद कैश निर्देशिका के अंतर्गत), `-V` / `--version`, और `-h` / `--help`। कई कमांड `-l` / `--locale <codes>` (अल्पविराम से अलग BCP-47) स्वीकार करते हैं लक्ष्य स्थानीयकरण को सीमित करने के लिए; `lint-source` एकल स्रोत स्थानीयकरण का उपयोग करता है। कमांड अवलोकन तालिका के लिए [सुरुआत करें](docs/GETTING_STARTED.hi.md#cli-reference) देखें।

---

<a id="documentation"></a>
## डॉक्यूमेंटेशन

- [सुरुआत करें](docs/GETTING_STARTED.hi.md) - सभी कार्यप्रवाहों (UI, दस्तावेज़/`.astro`, JSON बंडल, एस्ट्रो स्टारलाइट और सादा एस्ट्रो) के लिए पूर्ण सेटअप, CLI संदर्भ, और कॉन्फ़िग फ़ील्ड संदर्भ।
- [स्थानीय संपत्ति गाइड](docs/LOCALE-ASSETS-GUIDE.hi.md) - अनुवादित दस्तावेज़ों में स्क्रीनशॉट और चित्रित SVG (पैटर्न A–E, फ्लैट लिंक रीराइटर, स्क्रीनशॉट स्क्रिप्ट)।
- [पैकेज अवलोकन](docs/PACKAGE_OVERVIEW.hi.md) - वास्तुकला, आंतरिक, प्रोग्रामेटिक API, और एक्सटेंशन बिंदु।
- [AI एजेंट संदर्भ](../docs/ai-i18n-tools-context.md) - **पैकेज का उपयोग करने वाले ऐप्स के लिए:** डाउनस्ट्रीम प्रोजेक्ट्स के लिए एकीकरण प्रॉम्प्ट (अपने रिपो में एजेंट नियमों में कॉपी करें)।
- **इस** रिपॉजिटरी के लिए मेंटेनर आंतरिक: `dev/package-context.md` (केवल क्लोन; npm पर नहीं)।

---

<a id="license"></a>
## लाइसेंस

MIT © [वाल्डेमार स्कुडेलर जूनियर.](https://github.com/wsj-br)
