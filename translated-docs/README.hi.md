---
translation_last_updated: '2026-04-13T00:28:16.782Z'
source_file_mtime: '2026-04-13T00:12:20.078Z'
source_file_hash: e18e8298ff645bc6b54dc44e33f5afcd538eef92699118fc92ccc8746d207cc3
translation_language: hi
source_file_path: README.md
---
# ai-i18n-tools

CLI और प्रोग्रामेटिक टूलकिट जो JavaScript/TypeScript अनुप्रयोगों और दस्तावेज़ साइटों का अंतर्राष्ट्रीयकरण करता है। UI स्ट्रिंग्स को निकालता है, उन्हें OpenRouter के माध्यम से LLMs के साथ अनुवाद करता है, और i18next के लिए स्थानीयकृत JSON फ़ाइलें उत्पन्न करता है, साथ ही मार्कडाउन, Docusaurus JSON, और ( `translate-svg` के माध्यम से) स्वतंत्र SVG संपत्तियों के लिए पाइपलाइनों को भी बनाता है।

<small>**अन्य भाषाओं में पढ़ें:** </small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [hi](./README.hi.md) · [ja](./README.ja.md) · [ko](./README.ko.md) · [pt-BR](./README.pt-BR.md) · [zh-CN](./README.zh-CN.md) · [zh-TW](./README.zh-TW.md)</small>

## दो मुख्य कार्यप्रवाह

**कार्यप्रवाह 1 - UI अनुवाद** (React, Next.js, Node.js, कोई भी i18next प्रोजेक्ट)

स्रोत फ़ाइलों में `t("…")` कॉल के लिए स्कैन करता है, एक मास्टर कैटलॉग (`strings.json` वैकल्पिक प्रति-स्थानीय **`models`** मेटाडेटा के साथ) बनाता है, OpenRouter के माध्यम से प्रति स्थानीयता गायब प्रविष्टियों का अनुवाद करता है, और i18next के लिए तैयार फ्लैट JSON फ़ाइलें (`de.json`, `pt-BR.json`, …) लिखता है।

**कार्यप्रवाह 2 - दस्तावेज़ अनुवाद** (Markdown, Docusaurus JSON)

प्रत्येक `documentations` ब्लॉक के `contentPaths` से `.md` और `.mdx` का अनुवाद करता है और उस ब्लॉक के `jsonSource` से JSON लेबल फ़ाइलों का अनुवाद करता है जब सक्षम हो। Docusaurus-शैली और फ्लैट स्थानीयता-संलग्न लेआउट का समर्थन करता है प्रति ब्लॉक (`documentations[].markdownOutput`)। साझा रूट `cacheDir` SQLite कैश को रखता है ताकि केवल नए या परिवर्तित खंड LLM को भेजे जाएं। **SVG:** एक शीर्ष-स्तरीय `svg` ब्लॉक के साथ `translate-svg` का उपयोग करें (जब `svg` सेट किया गया हो तो `sync` से भी चलाएं)।

दोनों कार्यप्रवाह एकल `ai-i18n-tools.config.json` फ़ाइल साझा करते हैं और स्वतंत्र रूप से या एक साथ उपयोग किए जा सकते हैं। स्वतंत्र SVG अनुवाद शीर्ष-स्तरीय `svg` ब्लॉक के माध्यम से कॉन्फ़िगर किया गया है और `translate-svg` (या `sync` के अंदर SVG चरण) के माध्यम से चलता है।

---

## स्थापना

प्रकाशित पैकेज **ESM-केवल** है (`"type": "module"`)। Node.js, बंडलर्स, या `import()` से `import` का उपयोग करें — **`require('ai-i18n-tools')` का समर्थन नहीं किया जाता है।**

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

# 2. Extract t("…") calls from source
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

अपने ऐप में `'ai-i18n-tools/runtime'` से सहायक फ़ंक्शंस का उपयोग करके i18next को कनेक्ट करें:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);
export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
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
npx ai-i18n-tools sync   # extract UI strings, then translate UI strings, optional standalone SVG, then docs
```

---

## रनटाइम सहायक

`'ai-i18n-tools/runtime'` से निर्यातित - किसी भी JS वातावरण में काम करता है, i18next आयात की आवश्यकता नहीं है:

| सहायक | विवरण |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | कुंजी-के-डिफ़ॉल्ट सेटअप के लिए मानक i18next प्रारंभ विकल्प। |
| `wrapI18nWithKeyTrim(i18n)` | `i18n.t` को लपेटता है ताकि कुंजी खोज से पहले ट्रिम की जाए। |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | असिंक्रोनस स्थानीय फ़ाइल लोडिंग के लिए फैक्ट्री। |
| `getTextDirection(lng)` | एक BCP-47 कोड के लिए `'ltr'` या `'rtl'` लौटाता है। |
| `applyDirection(lng, element?)` | `document.documentElement` पर `dir` विशेषता सेट करता है। |
| `getUILanguageLabel(lang, t)` | एक भाषा मेनू पंक्ति के लिए प्रदर्शित लेबल (i18n के साथ)। |
| `getUILanguageLabelNative(lang)` | `t()` को कॉल किए बिना प्रदर्शित लेबल (हेडर-शैली)। |
| `interpolateTemplate(str, vars)` | एक साधारण स्ट्रिंग पर निम्न-स्तरीय `{{var}}` प्रतिस्थापन (आंतरिक रूप से उपयोग किया जाता है; ऐप कोड को इसके बजाय `t()` का उपयोग करना चाहिए)। |
| `flipUiArrowsForRtl(text, isRtl)` | RTL लेआउट के लिए `→` को `←` में पलटता है। |

---

## CLI कमांड

```
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools extract                               Scan source for t("…") calls
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (requires config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools sync                                  Extract UI strings, then UI, optional SVG, then docs
ai-i18n-tools status                                Translation status per file × locale
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

सभी कमांड `-c <config>` (डिफ़ॉल्ट: `ai-i18n-tools.config.json`), `-v` (विस्तृत), और वैकल्पिक `-w` / `--write-logs [path]` को स्वीकार करते हैं ताकि कंसोल आउटपुट को लॉग फ़ाइल में जोड़ा जा सके (डिफ़ॉल्ट: अनुवाद कैश निर्देशिका के तहत)।

---

## दस्तावेज़ीकरण

- [शुरुआत करना](GETTING_STARTED.hi.md) - दोनों कार्यप्रवाहों के लिए पूर्ण सेटअप गाइड, सभी CLI फ्लैग, और कॉन्फ़िग फ़ील्ड संदर्भ।
- [पैकेज अवलोकन](PACKAGE_OVERVIEW.hi.md) - आर्किटेक्चर, आंतरिक, प्रोग्रामेटिक API, और एक्सटेंशन पॉइंट्स।
- [AI एजेंट संदर्भ](../docs/ai-i18n-tools-context.md) - एजेंटों और रखरखाव करने वालों के लिए संक्षिप्त परियोजना संदर्भ जो कोड या कॉन्फ़िग परिवर्तन कर रहे हैं।

---

## लाइसेंस

MIT © [वाल्डेमर स्कुडेलर जूनियर](https://github.com/wsj-br)
