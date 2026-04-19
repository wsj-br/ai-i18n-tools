# ai-i18n-tools

JavaScript/TypeScript अनुप्रयोगों और दस्तावेज़ीकरण साइटों के लिए अंतरराष्ट्रीयकरण के लिए CLI और प्रोग्रामेटिक टूलकिट। UI स्ट्रिंग्स निकालता है, OpenRouter के माध्यम से LLMs के साथ उनका अनुवाद करता है, और i18next के लिए भाषा-तैयार JSON फ़ाइलें उत्पन्न करता है, साथ ही मार्कडाउन, डॉक्यूसॉरस JSON के लिए पाइपलाइन, और ( `features.translateSVG`, `translate-svg` और `svg` ब्लॉक के माध्यम से) स्वतंत्र SVG एसेट्स के लिए।

<small>**अन्य भाषाओं में पढ़ें:** </small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

## दो मुख्य कार्यप्रवाह

**कार्यप्रवाह 1 - UI अनुवाद** (React, Next.js, Node.js, कोई भी i18next प्रोजेक्ट)

`t("…")` / `i18n.t("…")` **लिटरल्स** से एक मास्टर कैटलॉग (`strings.json` वैकल्पिक प्रति-लोकेल **`models`** मेटाडेटा के साथ) बनाता है, वैकल्पिक रूप से **`package.json` `description`**, और विन्यास में सक्षम होने पर प्रत्येक **`englishName`** को `ui-languages.json` से। ओपनराउटर के माध्यम से लोकेल के अनुसार अनुवाद अनुपलब्ध प्रविष्टियों का अनुवाद करता है और फ्लैट JSON फ़ाइलें (`de.json`, `pt-BR.json`, …) लिखता है जो i18next के लिए तैयार हैं।

**कार्यप्रवाह 2 - दस्तावेज़ अनुवाद** (Markdown, Docusaurus JSON)

जब सक्षम हो, तो प्रत्येक `documentations` ब्लॉक के `contentPaths` से `.md` और `.mdx` और उस ब्लॉक के `jsonSource` से JSON लेबल फ़ाइलों का अनुवाद करता है। प्रत्येक ब्लॉक के लिए Docusaurus-शैली और सपाट भाषा-उपसर्गित लेआउट का समर्थन करता है (`documentations[].markdownOutput`)। साझा मूल `cacheDir` में SQLite कैशे रखा जाता है ताकि केवल नए या बदले गए खंडों को LLM को भेजा जाए। **SVG:** `features.translateSVG` सक्षम करें, शीर्ष-स्तरीय `svg` ब्लॉक जोड़ें, फिर `translate-svg` का उपयोग करें (जब दोनों सेट हों तो `sync` से भी चलाएं)।

दोनों कार्यप्रवाह एकल `ai-i18n-tools.config.json` फ़ाइल साझा करते हैं और स्वतंत्र रूप से या एक साथ उपयोग किए जा सकते हैं। स्वतंत्र SVG अनुवाद `features.translateSVG` और शीर्ष-स्तरीय `svg` ब्लॉक का उपयोग करता है और `translate-svg` (या `sync` के भीतर SVG चरण) के माध्यम से चलता है।

---

## स्थापना

प्रकाशित पैकेज **ESM-केवल** है (`"type": "module"`)। Node.js, बंडलर्स, या `import()` से `import` का उपयोग करें — `require('ai-i18n-tools')` **का समर्थन नहीं किया जाता है।**

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

## त्वरित प्रारंभ

### कार्यप्रवाह 1 - UI स्ट्रिंग्स

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

अपने ऐप में `'ai-i18n-tools/runtime'` से सहायक फ़ंक्शंस का उपयोग करके i18next को कनेक्ट करें:

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

### कार्यप्रवाह 2 - दस्तावेज़ीकरण

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### दोनों कार्यप्रवाह

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

## रनटाइम सहायक

`'ai-i18n-tools/runtime'` से निर्यातित - किसी भी JS वातावरण में काम करता है, i18next आयात की आवश्यकता नहीं है:

| सहायक | विवरण |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | कुंजी-के-रूप-में-डिफ़ॉल्ट सेटअप के लिए मानक i18next प्रारंभिक विकल्प। |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | अनुशंसित वायरिंग: कुंजी-ट्रिम + बहुवचन **`wrapT`** से **`strings.json`**, वैकल्पिक रूप से **`translate-ui`** `{sourceLocale}.json` बहुवचन कुंजियों को मिलाता है। |
| `wrapI18nWithKeyTrim(i18n)` | केवल निम्न-स्तरीय कुंजी-ट्रिम रैपर (ऐप वायरिंग के लिए अप्रचलित; **`setupKeyAsDefaultT`** को प्राथमिकता दें)। |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | **`ui-languages.json`** से **`makeLoadLocale`** के लिए **`localeLoaders`** मैप बनाता है (**`sourceLocale`** को छोड़कर प्रत्येक **`code`**)। |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | असमकालिक स्थानीय फ़ाइल लोडिंग के लिए फ़ैक्टरी। |
| `getTextDirection(lng)` | एक BCP-47 कोड के लिए `'ltr'` या `'rtl'` लौटाता है। |
| `applyDirection(lng, element?)` | `document.documentElement` पर `dir` विशेषता सेट करता है। |
| `getUILanguageLabel(lang, t)` | एक भाषा मेनू पंक्ति के लिए प्रदर्शन लेबल (i18n के साथ)। |
| `getUILanguageLabelNative(lang)` | `t()` को कॉल किए बिना प्रदर्शन लेबल (शीर्षक-शैली)। |
| `interpolateTemplate(str, vars)` | एक सादे स्ट्रिंग पर निम्न-स्तरीय `{{var}}` प्रतिस्थापन (आंतरिक रूप से उपयोग किया जाता है; ऐप कोड को इसके बजाय `t()` का उपयोग करना चाहिए)। |
| `flipUiArrowsForRtl(text, isRtl)` | दाएं से बाएं लेआउट के लिए `→` को `←` में उलट देता है। |

---

## CLI कमांड

```
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

प्रत्येक कमांड पर वैश्विक विकल्प: `-c <config>` (डिफ़ॉल्ट: `ai-i18n-tools.config.json`), `-v` (विस्तृत), लॉग फ़ाइल में कंसोल आउटपुट टी करने के लिए वैकल्पिक `-w` / `--write-logs [path]` (डिफ़ॉल्ट: अनुवाद कैश निर्देशिका के तहत), `-V` / `--version`, और `-h` / `--help`। प्रति-कमांड झंडों के लिए [Getting Started](docs/GETTING_STARTED.hi.md#cli-reference) देखें।

---

## दस्तावेज़ीकरण

- [Getting Started](docs/GETTING_STARTED.hi.md) - दोनों कार्यप्रवाहों, CLI संदर्भ और विन्यास फ़ील्ड संदर्भ के लिए पूर्ण सेटअप गाइड।
- [Package Overview](docs/PACKAGE_OVERVIEW.hi.md) - आर्किटेक्चर, आंतरिक, प्रोग्रामेटिक API और एक्सटेंशन पॉइंट्स।
- [AI Agent Context](../docs/ai-i18n-tools-context.md) - **पैकेज का उपयोग करने वाले ऐप्स के लिए:** डाउनस्ट्रीम प्रोजेक्ट्स के लिए एकीकरण प्रॉम्प्ट्स (अपने रिपो के एजेंट नियमों में कॉपी करें)।
- **इस** रिपॉजिटरी के लिए मेंटेनर आंतरिक: `dev/package-context.md` (केवल क्लोन; npm पर नहीं)।

---

## लाइसेंस

MIT © [वाल्डेमर स्कुडेलर जूनियर](https://github.com/wsj-br)
