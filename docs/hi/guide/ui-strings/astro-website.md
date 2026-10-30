<a id="astro-website"></a>
# एस्ट्रो वेबसाइट

स्थैतिक एस्ट्रो मार्केटिंग या ऐप साइटों (सादे एस्ट्रो, स्टारलाइट नहीं) के लिए, [एस्ट्रो बिल्ट-इन i18n रूटिंग](https://docs.astro.build/en/guides/internationalization/) को ai-i18n-टूल के साथ संयोजित करें। [एस्ट्रो एकीकरण](/hi/guide/integrations/astro) भी देखें।

संदर्भ कार्यान्वयन [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) है (इसका [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) भी देखें): `/` पर अंग्रेजी, `/{locale}/` पर नौ लक्ष्य स्थानीय भाषाएँ (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`)।

<a id="hybrid-pipelines"></a>
## हाइब्रिड पाइपलाइनें

अधिकांश टीमें दो पाइपलाइनों का **हाइब्रिड** उपयोग करती हैं (वे आपस में नहीं टकरातीं):

| पाइपलाइन | इसके लिए उपयोग करें | कमांड | आउटपुट |
|----------|---------|----------|--------|
| **पृष्ठ HTML** | शीर्षक, पैराग्राफ, नेविगेशन लेबल, टेम्पलेट बॉडी में इनलाइन एरे | `translate-docs` | प्रति लोकेल `src/pages/{locale}/index.astro` |
| **यूआई स्ट्रिंग्स (`t()`)** | फ्रंटमैटर डेटा, स्क्रीनशॉट टैब लेबल, साझा एरे | `extract` → `translate-ui` | `public/locales/{locale}.json` (स्रोत-भाषा स्ट्रिंग कुंजी के रूप में) |

जब आप कोई भाषा जोड़ते या हटाते हैं तो तीन सूचियों को संरेखित रखें: `ai-i18n-tools.config.json` में `targetLocales`, `astro.config.mjs` में `i18n.locales` (एस्ट्रो **लोअरकेस** रूट कोड का उपयोग करता है जैसे `pt-br`), और `ui-languages.json` (`generate-ui-languages` के माध्यम से)। फ्लैट बंडल **फ़ाइलनाम** कॉन्फ़िग केसिंग (`pt-BR.json`) का उपयोग करते हैं; एस्ट्रो के `pt-br` रूट को अपनी मैनिफेस्ट `code` फ़ील्ड (`examples/astro-website/src/i18n/locale.ts` देखें) के माध्यम से उस फ़ाइल पर मैप करें।

उदाहरण `package.json` स्क्रिप्ट (संदर्भ प्रोजेक्ट से):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## यूआई स्ट्रिंग्स (एसएसजी)

UI एक्सट्रैक्शन को `init -t ui-astro-website -P ollama` के साथ स्केफोल्ड करें, फिर एक `docs[]` ब्लॉक में मर्ज करें जब आप पेज HTML का भी अनुवाद करते हैं ([पेज पार्स करें और बदलें](#pages-parse-and-replace) देखें)। रिपॉजिटरी README का भी अनुवाद करें: `init -t ui-astro-website -P ollama --with-readme`। ([अपने README और Markdown डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) देखें)। TypeScript मॉड्यूल्स और `.astro` फ्रंटमैटर में कॉपी को `t('…')` में रैप करें (और टेम्पलेट `{expression}` ब्लॉक्स में जब आप डुप्लिकेट किए गए लोकल पेजों के बजाय UI स्ट्रिंग्स को प्राथमिकता देते हैं)। पेज HTML को `t()` की आवश्यकता नहीं है: `translate-docs` इसे कॉपी करता है। [JS/TS प्रॉम्प्ट](/hi/guide/add-i18n-to-js#run-the-agent-prompt) उन फ्रंटमैटर और डेटा फ़ाइलों पर लागू होता है, i18next इंस्टॉल और बूटस्ट्रैप को छोड़कर — Astro बिल्ड टाइम पर `makeT` के साथ `t` को हल करता है, i18next के साथ नहीं।

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`astro.config.mjs` में `i18n.defaultLocale` से मेल खाने के लिए `sourceLocale` सेट करें। फ्लैट बंडलों को एक डायरेक्टरी में लिखें जिसे एस्ट्रो बिल्ड टाइम पर इम्पोर्ट कर सके (टेम्पलेट `public/locales/` का उपयोग करता है)। **बिल्ड टाइम** पर `t('…')` को स्रोत-भाषा लिटरल को कुंजी के रूप में देखकर हल करें (देखें `examples/astro-website/src/i18n/t.ts`; `strings.json` एक्सट्रैक्शन कैश है, रनटाइम बंडल नहीं)। वह भाषा `sourceLocale` है और कोई भी भाषा हो सकती है। उदाहरण में अंग्रेजी का उपयोग किया गया है। आपको एक स्टैटिक साइट के लिए `ai-i18n-tools/runtime` या i18next की **आवश्यकता नहीं है** जब तक कि आप क्लाइंट आइलैंड्स नहीं जोड़ते जो लोड होने के बाद भाषा बदलते हैं।

हर उस पेज को वायर करें जो `t()` को कॉल करता है (स्रोत-स्थानीय पेज और प्रत्येक `src/pages/{locale}/` कॉपी):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

उदाहरण में सहायक सहायक: लेबल, दिशा और BCP-47 कोड के लिए `src/i18n/utils.ts`, `src/i18n/locale.ts`, और `ui-languages.json`। `targetLocales` बदलने के बाद `generate-ui-languages` चलाएँ (वैकल्पिक रूप से `languagesManifestPath` सेट करें ताकि मैनिफेस्ट आपके सहायकों के बगल में रहे, जैसे `src/i18n/ui-languages.json`)। `MainLayout.astro` `resolveUiLanguage(Astro.currentLocale)` से `<html lang>` और `<html dir>` सेट करता है; `LanguagePicker.astro` `astro:i18n` से `getRelativeLocaleUrl` का उपयोग करता है।

<a id="pages-parse-and-replace"></a>
## पृष्ठ (पार्स-एंड-रिप्लेस)

`.astro` फ़ाइलों में हार्डकोडेड HTML वाले मार्केटिंग पेजों के लिए, `translate-docs` को टेक्स्ट नोड्स और एट्रिब्यूट (`alt`, `title`, `aria-label`, `placeholder`) निकालने दें, उन्हें दस्तावेज़ कैश के साथ अनुवाद करें, और अपने पेज ट्री के तहत स्थानीय-विशिष्ट प्रतियां लिखें। आपको अधिकांश दृश्यमान कॉपी के लिए `t()` की आवश्यकता **नहीं** है।

संरचनात्मक एट्रिब्यूट और कुंजी मान डिफ़ॉल्ट रूप से अनुवादित **नहीं** होते हैं: अंतर्निहित सुरक्षा JSX/HTML एट्रिब्यूट जैसे `class`, `id`, `style`, `src`, `href`, `data-*`, और अधिकांश `aria-*`, साथ ही टेम्पलेट `{expression}` ब्लॉक के अंदर ऑब्जेक्ट कुंजियाँ जैसे `class`, `key`, और `id` को कवर करती है। जब आप कस्टम एट्रिब्यूट का उपयोग करते हैं (उदाहरण के लिए Tailwind `variant` या CMS `slug` फ़ील्ड) तो उन सूचियों का विस्तार करने के लिए `docs[].protectAttributes` और `docs[].protectKeys` का उपयोग करें। वही विकल्प मार्कडाउन अनुवाद के दौरान MDX JSX पर लागू होते हैं ([protectAttributes / protectKeys](/hi/reference/configuration#protectattributes-protectkeys) देखें)।

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

`ai-i18n-tools translate-docs` चलाएँ (या [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) में `pnpm i18n:translate`)। स्रोत पेज `src/pages/index.astro` पर रहता है (उदाहरण में अंग्रेजी; `sourceLocale` कोई भी भाषा हो सकती है); प्रत्येक लक्ष्य स्थानीय को `src/pages/{locale}/index.astro` मिलता है जिसमें अतिरिक्त डायरेक्टरी स्तर के लिए आयात समायोजित किए जाते हैं (उदाहरण के लिए `../layouts/` → `../../layouts/`)।

**टेम्पलेट बॉडी** के अंदर, `{expression}` ब्लॉक में स्ट्रिंग लिटरल (इनलाइन एरे, ऑब्जेक्ट `title`/`desc` फ़ील्ड) का अनुवाद तब किया जाता है जब वे उपयोगकर्ता-सामने होते हैं; संरक्षित एट्रिब्यूट/कुंजियों पर उद्धृत मान, `t('…')`, `<script>`, और `<style>` के अंदर के लिटरल अपरिवर्तित रहते हैं। **फ्रंटमैटर टाइपस्क्रिप्ट का अनुवाद नहीं किया जाता है** इस पथ द्वारा—साझा फ्रंटमैटर (जिसमें `t()` इम्पोर्ट और डेटा एरे शामिल हैं) को अंग्रेजी और स्थानीय पेजों पर समान रखें, या अंग्रेजी पेज को संपादित करने के बाद `translate-docs` को फिर से चलाएँ ताकि स्थानीय कॉपी फ्रंटमैटर परिवर्तनों को उठा सकें। केवल फ्रंटमैटर कॉपी के लिए, इसके बजाय [यूआई-स्ट्रिंग पाइपलाइन](#ui-strings-ssg) का उपयोग करें।

पूरी हाइब्रिड लैंडिंग पेज (`translate-docs` के माध्यम से HTML, `t()` + `translate-ui` के माध्यम से स्क्रीनशॉट टैब लेबल) के लिए [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) देखें।
