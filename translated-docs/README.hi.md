<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm संस्करण](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm डाउनलोड](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![लाइसेंस: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

JavaScript/TypeScript अनुप्रयोगों और दस्तावेज़ीकरण साइटों को [OpenRouter](https://openrouter.ai/) के माध्यम से बड़े भाषा मॉडल का उपयोग करके अंतरराष्ट्रीयकरण के लिए CLI और टूलकिट। दो स्वतंत्र कार्यप्रवाह: **UI अनुवाद** `t("…")` कॉल निकालता है और i18next के लिए स्थान-तैयार JSON लिखता है; **दस्तावेज़ अनुवाद** मार्कडाउन, MDX और SVG फ़ाइलों का अनुवाद करता है एक स्मार्ट SQLite कैश के साथ ताकि केवल बदले गए खंडों को LLM को फिर से भेजा जाए।

<small>**अन्य भाषाओं में पढ़ें:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<small>अनुवादित README और दस्तावेज़ GitHub पर [`translated-docs/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) के अंतर्गत प्रतिबद्ध हैं; npm पैकेज केवल अंग्रेज़ी `docs/` शिप करता है।</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**विषय सूची**

- [दो मुख्य कार्यप्रवाह](#two-core-workflows)
- [स्थापना](#installation)
  - [CLI का उपयोग करके](#using-the-cli)
- [OpenRouter](#openrouter)
- [त्वरित शुरुआत](#quick-start)
  - [कार्यप्रवाह 1 - UI अनुवाद](#workflow-1---ui-translation)
  - [कार्यप्रवाह 2 - दस्तावेज़ अनुवाद](#workflow-2---document-translation)
  - [दोनों कार्यप्रवाह](#both-workflows)
- [रनटाइम हेल्पर](#runtime-helpers)
- [CLI कमांड](#cli-commands)
- [दस्तावेज़ीकरण](#documentation)
- [लाइसेंस](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## दो मुख्य कार्यप्रवाह

**कार्यप्रवाह 1 - UI अनुवाद** — i18next का उपयोग करने वाले किसी भी JS/TS प्रोजेक्ट के लिए (React, Next.js, Node.js, CLIs)

स्रोत फ़ाइलों में `t("…")` / `i18n.t("…")` शाब्दिकों को स्कैन करता है, एक मास्टर कैटलॉग (`strings.json`) बनाता है, OpenRouter के माध्यम से भाषानुसार लुप्त प्रविष्टियों का अनुवाद करता है, और i18next के लिए तैयार फ्लैट JSON फ़ाइलें (`de.json`, `pt-BR.json`, …) लिखता है।

**वर्कफ़्लो 2 - दस्तावेज़ अनुवाद** — मार्कडाउन/एमडीएक्स दस्तावेज़ों (डॉक्यूसॉरस, एस्ट्रो स्टारलाइट, सादे रीडमी फ़ाइल) और `.astro` पृष्ठ HTML (सादे एस्ट्रो मार्केटिंग साइट) के लिए

`.md`, `.mdx`, और `.astro` स्रोत फ़ाइलों का साझा स्क्वाइलाइट कैश के साथ प्रत्येक लक्ष्य स्थानीयकरण में अनुवाद करता है — केवल नए या बदले गए खंड एलएलएम को भेजे जाते हैं। वैकल्पिक डॉक्यूसॉरस शेल JSON (`jsonSource`, `write-translations` से) नेवबार, फ़ुटर और थीम यूआई स्ट्रिंग्स को कवर करता है। `features.translateSVG` और शीर्ष-स्तरीय `svg` ब्लॉक के माध्यम से एसवीजी फ़ाइल अनुवाद सक्षम है। सादे एस्ट्रो साइट्स के लिए, [`examples/astro-website`](../examples/astro-website/) देखें (हाइब्रिड: पृष्ठ HTML के लिए `translate-docs` और फ्रंटमैटर स्ट्रिंग्स के लिए `t()`)।

दोनों कार्यप्रवाह एकल `ai-i18n-tools.config.json` फ़ाइल साझा करते हैं और स्वतंत्र रूप से या एक साथ उपयोग किए जा सकते हैं।

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
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

**शून्य-स्थापना एकल उपयोग** — `npx ai-i18n-tools <cmd>` या `pnpm dlx ai-i18n-tools <cmd>` (केवल उस निष्पादन के लिए डाउनलोड करता है)।

> **सुझाव:** `npx` के बिना एक इंटरैक्टिव शेल में `ai-i18n-tools` को सीधे चलाने के लिए, `PATH` में `node_modules/.bin` जोड़ें (bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`)। डायरेन्व और विंडोज निर्देशों के लिए [शुरुआत करें](docs/GETTING_STARTED.hi.md#installation) देखें।

अपनी OpenRouter API कुंजी सेट करें:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

OpenRouter को कॉल करने वाले कमांड (`translate-ui`, `translate-docs`, `sync`, `check-models`, और संबंधित स्क्रिप्ट्स) को वातावरण में `OPENROUTER_API_KEY` की आवश्यकता होती है। `check-markdown` OpenRouter का उपयोग नहीं करता है।

`ai-i18n-tools.config.json` में, `openrouter` ऑब्जेक्ट में मॉडल सूचियाँ, `baseUrl`, `maxTokens`, `temperature`, और `requestTimeoutMs` शामिल हैं: OpenRouter के लिए प्रत्येक HTTP अनुरोध (चैट पूर्ति और आंतरिक `GET /models` कॉल) के लिए प्रतीक्षा करने का अधिकतम समय मिलीसेकंड में। डिफ़ॉल्ट `30000` (30 सेकंड) है।

प्रत्येक कॉन्फ़िगर किए गए मॉडल आईडी को OpenRouter के लाइव कैटलॉग के खिलाफ सत्यापित करने के लिए `ai-i18n-tools check-models` चलाएं। यह लापता या समाप्त `expiration_date` आईडी की रिपोर्ट करता है, अनुमानित इनपुट/आउटपुट मूल्य निर्धारण (1M टोकन प्रति अमेरिकी डॉलर) के साथ वैध मॉडल की सूची बनाता है, और किसी भी कॉन्फ़िगर की गई आईडी अमान्य होने पर गैर-शून्य स्थिति के साथ बाहर निकलता है। इसके लिए `OPENROUTER_API_KEY` की आवश्यकता होती है।

---

<a id="quick-start"></a>
## त्वरित प्रारंभ

<a id="workflow-1---ui-translation"></a>
### कार्यप्रवाह 1 - UI अनुवाद

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

फिर अपने ऐप में `'ai-i18n-tools/runtime'` से हेल्पर का उपयोग करके i18next को जोड़ें। पूर्ण सेटअप के लिए शुरुआत करें गाइड में [चरण 4: रनटाइम पर i18next को जोड़ें](docs/GETTING_STARTED.hi.md#step-4-wire-i18next-at-runtime) देखें।

<a id="workflow-2---document-translation"></a>
### कार्यप्रवाह 2 - दस्तावेज़ अनुवाद

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website (UI + optional page HTML): npx ai-i18n-tools init -t ui-astro-website

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### दोनों कार्यप्रवाह

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## रनटाइम हेल्पर्स

`'ai-i18n-tools/runtime'` से निम्नलिखित सहायक निर्यात किए जाते हैं और किसी भी जावास्क्रिप्ट वातावरण में काम करते हैं। उनका उपयोग करने के लिए आपको i18next आयात करने की आवश्यकता नहीं है:

| सहायक                                                                 | विवरण                                                                                                                            |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | कुंजी-के-रूप-में-डिफ़ॉल्ट सेटअप के लिए मानक i18next प्रारंभिकीकरण विकल्प।                                                                               |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | अनुशंसित वायरिंग: `strings.json` से कुंजी-ट्रिम + बहुवचन `wrapT`, वैकल्पिक रूप से `translate-ui` `{sourceLocale}.json` बहुवचन कुंजी मर्ज करता है। |
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
ai-i18n-tools help [command]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]
ai-i18n-tools check-models
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools lint-source …
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status [--max-columns <n>]
ai-i18n-tools statistics [--max-columns <n>]
ai-i18n-tools dashboard
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]
ai-i18n-tools glossary-generate
```

प्रति-कमांड फ्लैग सूचियाँ [शुरुआत करें — CLI संदर्भ](docs/GETTING_STARTED.hi.md#cli-reference) में उपलब्ध हैं। अंतर्निहित उपयोग पाठ के लिए `ai-i18n-tools <command> --help` चलाएं।

हर कमांड पर वैश्विक विकल्प: `-c <config>` (डिफ़ॉल्ट: `ai-i18n-tools.config.json`), `-v` (विस्तृत), वैकल्पिक `-w` / `--write-logs [path]` कंसोल आउटपुट को लॉग फ़ाइल में टी करने के लिए (डिफ़ॉल्ट: अनुवाद कैश निर्देशिका के अंतर्गत), `-V` / `--version`, और `-h` / `--help`। कमांड अवलोकन तालिका के लिए [Getting Started](docs/GETTING_STARTED.hi.md#cli-reference) देखें।

---

<a id="documentation"></a>
## डॉक्यूमेंटेशन

- [शुरुआत करें](docs/GETTING_STARTED.hi.md) - दोनों कार्यप्रवाहों के लिए पूर्ण सेटअप गाइड, CLI संदर्भ, और कॉन्फ़िग फ़ील्ड संदर्भ।
- [भाषा संपत्ति गाइड](docs/LOCALE-ASSETS-GUIDE.hi.md) - अनुवादित दस्तावेज़ों में स्क्रीनशॉट और चित्रित SVG (पैटर्न A–E, फ्लैट लिंक पुन:लेखक, स्क्रीनशॉट स्क्रिप्ट)।
- [पैकेज अवलोकन](docs/PACKAGE_OVERVIEW.hi.md) - वास्तुकला, आंतरिक, प्रोग्रामेटिक API, और विस्तार बिंदु।
- [AI एजेंट संदर्भ](../docs/ai-i18n-tools-context.md) - **पैकेज का उपयोग करने वाले अनुप्रयोगों के लिए:** डाउनस्ट्रीम प्रोजेक्ट्स के लिए एकीकरण प्रॉम्प्ट (अपने रिपो में एजेंट नियमों में कॉपी करें)।
- **इस** रिपॉजिटरी के लिए मेंटेनर आंतरिक: `dev/package-context.md` (केवल क्लोन; npm पर नहीं)।

---

<a id="license"></a>
## लाइसेंस

MIT © [वाल्डेमार स्कुडेलर जूनियर.](https://github.com/wsj-br)
