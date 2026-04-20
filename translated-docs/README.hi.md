<a id="ai-i18n-tools"></a>
# ai-i18n-tools

जावास्क्रिप्ट/टाइपस्क्रिप्ट एप्लिकेशन और दस्तावेज़ीकरण साइटों के लिए CLI और प्रोग्रामेटिक टूलकिट। UI स्ट्रिंग्स निकालता है, OpenRouter के माध्यम से LLMs का उपयोग करके उनका अनुवाद करता है, और i18next के लिए तैयार लोकेल-तैयार JSON फ़ाइलें उत्पन्न करता है, साथ ही मार्कडाउन, डॉक्यूसॉरस JSON, और (`features.translateSVG`, `translate-svg`, और `svg` ब्लॉक के माध्यम से) स्वतंत्र SVG एसेट्स के लिए पाइपलाइन।

<small>**अन्य भाषाओं में पढ़ें:** </small>
<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**विषय सूची**

- [दो मूल कार्यप्रवाह](#two-core-workflows)
- [स्थापना](#installation)
- [त्वरित शुरुआत](#quick-start)
  - [कार्यप्रवाह 1 - UI स्ट्रिंग्स](#workflow-1---ui-strings)
  - [कार्यप्रवाह 2 - दस्तावेज़ीकरण](#workflow-2---documentation)
  - [दोनों कार्यप्रवाह](#both-workflows)
- [रनटाइम सहायक](#runtime-helpers)
- [CLI कमांड](#cli-commands)
- [दस्तावेज़ीकरण](#documentation)
- [लाइसेंस](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## दो मुख्य कार्यप्रवाह

**कार्यप्रवाह 1 - UI अनुवाद** (React, Next.js, Node.js, कोई भी i18next प्रोजेक्ट)

एक मास्टर कैटलॉग बनाता है (`strings.json` के साथ वैकल्पिक प्रति-स्थानीय `models` मेटाडेटा) `t("…")` / `i18n.t("…")` **लिटरल्स** से, वैकल्पिक रूप से `package.json` `description`, और वैकल्पिक रूप से प्रत्येक `englishName` को `ui-languages.json` से, जब कॉन्फ़िग में सक्षम हो। अनुपलब्ध प्रविष्टियों का अनुवाद OpenRouter के माध्यम से प्रति स्थानीय करता है और समतल JSON फ़ाइलें लिखता है (`de.json`, `pt-BR.json`, …) जो i18next के लिए तैयार हैं।

**कार्यप्रवाह 2 - दस्तावेज़ अनुवाद** (मार्कडाउन, डॉक्यूसॉरस JSON)

प्रत्येक `documentations` ब्लॉक के `contentPaths` और उस ब्लॉक के `jsonSource` से JSON लेबल फ़ाइलों से `.md` और `.mdx` का अनुवाद करता है जब सक्षम हो। Docusaurus-शैली और प्रति-ब्लॉक सपाट लोकेल-उपसर्ग लेआउट का समर्थन करता है (`documentations[].markdownOutput`)। साझा मूल `cacheDir` में SQLite कैश रखता है ताकि केवल नए या बदले गए खंडों को LLM को भेजा जाए। **SVG:** `features.translateSVG` सक्षम करें, शीर्ष-स्तरीय `svg` ब्लॉक जोड़ें, फिर `translate-svg` का उपयोग करें (जब दोनों सेट हों तो `sync` से चलाएं)।

दोनों कार्यप्रवाह एकल `ai-i18n-tools.config.json` फ़ाइल साझा करते हैं और स्वतंत्र रूप से या एक साथ उपयोग किए जा सकते हैं। स्वतंत्र SVG अनुवाद `features.translateSVG` और शीर्ष-स्तरीय `svg` ब्लॉक का उपयोग करता है और `translate-svg` के माध्यम से चलता है (या `sync` के अंदर SVG चरण)।

---

<a id="installation"></a>
## स्थापना

प्रकाशित पैकेज **केवल ESM** (`"type": "module"`) है। Node.js, बंडलर्स या `import()` से `import` का उपयोग करें — `require('ai-i18n-tools')` का समर्थन **नहीं** किया जाता है।

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

अपनी OpenRouter API कुंजी सेट करें:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

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

`'ai-i18n-tools/runtime'` से निर्यातित - किसी भी JS वातावरण में काम करता है, i18next आयात की आवश्यकता नहीं है:

| सहायक | विवरण |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | कुंजी-के-रूप-में-डिफ़ॉल्ट सेटअप के लिए मानक i18next प्रारंभिक विकल्प। |
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
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

प्रत्येक कमांड पर वैश्विक विकल्प: `-c <config>` (डिफ़ॉल्ट: `ai-i18n-tools.config.json`), `-v` (विस्तृत), वैकल्पिक `-w` / `--write-logs [path]` कंसोल आउटपुट को लॉग फ़ाइल में टी करने के लिए (डिफ़ॉल्ट: अनुवाद कैश निर्देशिका के अंदर), `-V` / `--version`, और `-h` / `--help`। प्रति-कमांड झंडों के लिए [प्रारंभ करने के लिए](docs/GETTING_STARTED.hi.md#cli-reference) देखें।

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
