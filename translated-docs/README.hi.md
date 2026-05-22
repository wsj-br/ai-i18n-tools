<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm संस्करण](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm डाउनलोड](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![लाइसेंस: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

JavaScript/TypeScript एप्लिकेशन और डॉक्यूमेंटेशन साइट्स के लिए अंतरराष्ट्रीयकरण के लिए CLI और टूलकिट। UI स्ट्रिंग्स निकालता है, OpenRouter के माध्यम से बड़े भाषा मॉडल्स का उपयोग करके उनका अनुवाद करता है, और i18next के लिए लोकेल-तैयार JSON फ़ाइलें उत्पन्न करता है। डॉक्यूमेंटेशन के लिए, यह `contentPaths` के तहत मार्कडाउन और MDX का अनुवाद करता है (वे स्थानीयकृत पृष्ठ जो पाठक खोलते हैं)। वैकल्पिक Docusaurus लेबल JSON `jsonSource` से साइट शेल स्ट्रिंग्स (`write-translations` कैटलॉग जैसे थीम/नेव/फुटर) को कवर करता है, जो पृष्ठ बॉडी कॉपी से अलग होता है। SVG फ़ाइल अनुवाद में `features.translateSVG` और शीर्ष-स्तरीय `svg` ब्लॉक का उपयोग होता है।

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
  - [कार्यप्रवाह 1 - UI स्ट्रिंग्स](#workflow-1---ui-strings)
  - [कार्यप्रवाह 2 - दस्तावेज़ीकरण](#workflow-2---documentation)
  - [दोनों कार्यप्रवाह](#both-workflows)
- [रनटाइम हेल्पर](#runtime-helpers)
- [CLI कमांड](#cli-commands)
- [दस्तावेज़ीकरण](#documentation)
- [लाइसेंस](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## दो मुख्य कार्यप्रवाह

**कार्यप्रवाह 1 - UI अनुवाद** (React, Next.js, Node.js, कोई भी i18next प्रोजेक्ट)

एक मास्टर कैटलॉग बनाता है (`strings.json` के साथ वैकल्पिक प्रति-स्थानीय `models` मेटाडेटा) `t("…")` / `i18n.t("…")` **लिटरल्स** से, वैकल्पिक रूप से `package.json` `description`, और वैकल्पिक रूप से प्रत्येक `englishName` को `ui-languages.json` से, जब कॉन्फ़िग में सक्षम हो। अनुपलब्ध प्रविष्टियों का अनुवाद OpenRouter के माध्यम से प्रति स्थानीय करता है और समतल JSON फ़ाइलें लिखता है (`de.json`, `pt-BR.json`, …) जो i18next के लिए तैयार हैं।

**वर्कफ़्लो 2 - डॉक्यूमेंट अनुवाद** (मार्कडाउन / MDX, वैकल्पिक Docusaurus शेल JSON)

`documentations` ब्लॉक के `contentPaths` से `.md` और `.mdx` का अनुवाद करता है — यानी स्थानीयकृत डॉक्यूमेंटेशन। जब `features.translateJSON` और `jsonSource` सेट होते हैं, तो यह Docusaurus **लेबल JSON** (नेवबार, फ़ुटर, थीम/प्लगइन UI `write-translations` से) का भी अनुवाद करता है, MDX बॉडी टेक्स्ट नहीं। ब्लॉक के अनुसार Docusaurus-शैली और सपाट स्थानीयकरण-उपसर्गित लेआउट का समर्थन करता है (`documentations[].markdownOutput`)। साझा मूल `cacheDir` में SQLite कैश रखा जाता है ताकि केवल नए या बदले गए खंडों को LLM को भेजा जाए। **SVG:** `features.translateSVG` सक्षम करें, शीर्ष-स्तरीय `svg` ब्लॉक जोड़ें, फिर `translate-svg` का उपयोग करें (जब दोनों सेट हों तो `sync` से चलाएं)।

दोनों वर्कफ़्लो में एक ही `ai-i18n-tools.config.json` फ़ाइल साझा की जाती है और उनका उपयोग स्वतंत्र रूप से या साथ में किया जा सकता है। SVG फ़ाइल अनुवाद में `features.translateSVG` और शीर्ष-स्तरीय `svg` ब्लॉक के साथ-साथ `translate-svg` के माध्यम से (या `sync` के अंदर SVG चरण) निष्पादन होता है।

---

<a id="installation"></a>
## स्थापना

प्रकाशित पैकेज केवल **ESM** (`"type": "module"`) है। Node.js, बंडलर्स या `import()` से `import` का उपयोग करें — `require('ai-i18n-tools')` का समर्थन **नहीं** किया जाता है। पैकेज `engines.node` `>=22.16.0` की घोषणा करता है; पुराने Node.js संस्करणों का समर्थन नहीं किया जाता है।

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### CLI का उपयोग करना

**प्रति-प्रोजेक्ट (अनुशंसित)** — एक निर्भरता या devDependency के रूप में स्थापित करें, फिर `npx`, `pnpm exec`, या `package.json` स्क्रिप्ट के माध्यम से कॉल करें:

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

पैकेज प्रबंधक Linux और macOS पर सही अनुमतियों के साथ `node_modules/.bin/ai-i18n-tools` लिखता है और Windows पर `.cmd` / `.ps1` शिम्स लिखता है; स्क्रिप्ट रनर इसे स्वचालित रूप से उठा लेते हैं।

**नग्न** `ai-i18n-tools` **टर्मिनल में:** `package.json` स्क्रिप्ट पहले से `node_modules/.bin` पर `PATH` के साथ चल रही हैं, इसलिए कमांड जैसे `pnpm run i18n:sync` बिना `npx` टाइप किए CLI को सक्रिय करते हैं। एक इंटरैक्टिव शेल में `ai-i18n-tools` को सीधे चलाने के लिए (स्थानीय इंस्टॉलेशन के बाद, प्रोजेक्ट रूट से), स्थानीय बिन डायरेक्टरी को `PATH` के आगे जोड़ें:

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

---

<a id="openrouter"></a>
## OpenRouter

OpenRouter को कॉल करने वाले कमांड (`translate-ui`, `translate-docs`, `sync`, `check-models`, और संबंधित स्क्रिप्ट्स) को वातावरण में `OPENROUTER_API_KEY` की आवश्यकता होती है। `check-markdown` OpenRouter का उपयोग नहीं करता है।

`ai-i18n-tools.config.json` में, `openrouter` ऑब्जेक्ट में मॉडल सूचियाँ, `baseUrl`, `maxTokens`, `temperature`, और `requestTimeoutMs` शामिल हैं: OpenRouter के लिए प्रत्येक HTTP अनुरोध (चैट पूर्ति और आंतरिक `GET /models` कॉल) के लिए प्रतीक्षा करने का अधिकतम समय मिलीसेकंड में। डिफ़ॉल्ट `30000` (30 सेकंड) है।

प्रत्येक कॉन्फ़िगर किए गए मॉडल आईडी को OpenRouter के लाइव कैटलॉग के खिलाफ सत्यापित करने के लिए `ai-i18n-tools check-models` चलाएं। यह लापता या समाप्त `expiration_date` आईडी की रिपोर्ट करता है, अनुमानित इनपुट/आउटपुट मूल्य निर्धारण (1M टोकन प्रति अमेरिकी डॉलर) के साथ वैध मॉडल की सूची बनाता है, और किसी भी कॉन्फ़िगर की गई आईडी अमान्य होने पर गैर-शून्य स्थिति के साथ बाहर निकलता है। इसके लिए `OPENROUTER_API_KEY` की आवश्यकता होती है।

---

<a id="quick-start"></a>
## त्वरित प्रारंभ

<a id="workflow-1---ui-strings"></a>
### कार्यप्रवाह 1 - UI स्ट्रिंग्स

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

अपने ऐप में `'ai-i18n-tools/runtime'` से हेल्पर्स का उपयोग करके i18next को जोड़ें:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

<a id="workflow-2---documentation"></a>
### कार्यप्रवाह 2 - डॉक्यूमेंटेशन

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

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

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]   Create config file
ai-i18n-tools check-models                          Validate configured OpenRouter model ids against GET /models (pricing, expiration); requires OPENROUTER_API_KEY
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs …                      Translate documentation: markdown/MDX from contentPaths; optional Docusaurus label JSON from jsonSource. Flags include -l/--locale <codes>, -p/-f path, --dry-run,
                                                    --force, --force-update, --stats, --clear-cache, --type, --json-only, --no-json, -j, -b,
                                                    --prompt-format, --emphasis-placeholders, --no-emphasis-placeholders, --debug-failed
ai-i18n-tools write-heading-ids …                   Insert HTML anchor lines before ATX headings in .md/.mdx (documentations[])
ai-i18n-tools strip-md-bold-inline …              Remove bold (**) around inline code in markdown/MDX (documentations[])
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]   Scan documentation markdown for delimiter / inline-code issues and strong-outside-code or strong-outside-link patterns; refresh SQLite markdown_source_issues; exit 1 if any issue
ai-i18n-tools translate-svg …                        SVG files (features.translateSVG + config.svg); flags include -l/--locale <codes>,
                                                    -p/-f path, --dry-run, --force, --force-update, --no-cache, -j, -b
ai-i18n-tools translate-ui …                        Translate UI strings only; flags include -l/--locale <codes>, --dry-run, --force, -j
ai-i18n-tools lint-source …                         Run extract, then LLM review of source-locale UI strings (OpenRouter)
ai-i18n-tools export-ui-xliff …                   Export UI strings to XLIFF 2.0 (one file per locale); -l, -o, --untranslated-only, --dry-run
ai-i18n-tools sync …                                Extract, then UI / SVG / docs; flags include -l/--locale <codes>, -p/-f path, --dry-run, --force,
                                                    --force-update, --no-ui, --no-svg, --no-docs, -j, -b, --emphasis-placeholders,
                                                    --no-emphasis-placeholders, --debug-failed
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools statistics [--max-columns <n>]        Documentation cache + strings.json aggregates (same as editor Statistics)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]   List *.log and cache.db.backup*.sqlite; delete after `y`, with `-f`, or skip if none match
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

प्रति-कमांड फ्लैग सूची `src/cli/index.ts` के पास [CLI flags by command](docs/GETTING_STARTED.hi.md#cli-flags-by-command) में बनाए रखी जाती है। अंतर्निर्मित उपयोग पाठ के लिए `ai-i18n-tools <command> --help` चलाएं।

हर कमांड पर वैश्विक विकल्प: `-c <config>` (डिफ़ॉल्ट: `ai-i18n-tools.config.json`), `-v` (विस्तृत), वैकल्पिक `-w` / `--write-logs [path]` कंसोल आउटपुट को लॉग फ़ाइल में टी करने के लिए (डिफ़ॉल्ट: अनुवाद कैश निर्देशिका के अंतर्गत), `-V` / `--version`, और `-h` / `--help`। कमांड अवलोकन तालिका के लिए [Getting Started](docs/GETTING_STARTED.hi.md#cli-reference) देखें।

---

<a id="documentation"></a>
## डॉक्यूमेंटेशन

- [प्रारंभ करने के लिए](docs/GETTING_STARTED.hi.md) - दोनों कार्यप्रवाहों के लिए पूर्ण सेटअप गाइड, CLI संदर्भ, और कॉन्फ़िग फ़ील्ड संदर्भ।
- [पैकेज अवलोकन](docs/PACKAGE_OVERVIEW.hi.md) - वास्तुकला, आंतरिक, कार्यक्रम द्वारा उपयोग करने योग्य API, और विस्तार बिंदु।
- [AI एजेंट संदर्भ](../docs/ai-i18n-tools-context.md) - **पैकेज का उपयोग करने वाले ऐप्स के लिए:** डाउनस्ट्रीम परियोजनाओं के लिए एकीकरण संकेत (अपने रिपो के एजेंट नियमों में कॉपी करें)।
- **इस** रिपॉजिटरी के लिए रखरखाव आंतरिक: `dev/package-context.md` (केवल क्लोन; npm पर नहीं)।

---

<a id="license"></a>
## लाइसेंस

MIT © [वाल्डेमार स्कुडेलर जूनियर.](https://github.com/wsj-br)
