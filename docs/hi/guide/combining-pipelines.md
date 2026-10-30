<a id="combining-pipelines"></a>
# पाइपलाइन को जोड़ना

इसे तब पढ़ें जब किसी एक प्रोजेक्ट को एक से अधिक प्रकार के अनुवाद की आवश्यकता हो: ऐप UI स्ट्रिंग और दस्तावेज़, एक डॉक्स साइट और एक रूट README, या दस्तावेज़ और SVG चित्र। यदि आप केवल एक प्रकार की सामग्री का अनुवाद करते हैं, तो [त्वरित शुरुआत](/hi/guide/quick-start) पर्याप्त है।

एक ऐप और उसकी रिपॉजिटरी README एक सामान्य हाइब्रिड है। इसे `init` (`ui-markdown` टेम्पलेट) या `init -t <template> --with-readme` के साथ तैयार करें, फिर [अपनी README और Markdown डॉक्स में i18n जोड़ें](/hi/guide/add-i18n-to-readme) का पालन करें। इस पृष्ठ पर बाद में दी गई मिश्रित कॉन्फ़िग एक डॉक्स साइट के बगल में वही विचार है।

यह रिपॉजिटरी उसी प्रकार का प्रोजेक्ट है। [`ai-i18n-tools.config.json`](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) CLI और ट्रांसलेशन डैशबोर्ड UI स्ट्रिंग और इस VitePress साइट को एक `sync` में अनुवादित करता है। UI ब्लॉक `src/cli`, `src/server`, `src/dashboard-app`, और `src/api` को कवर करता है, और `src/i18n/locales` के तहत फ्लैट JSON लिखता है। VitePress ब्लॉक `docs/` और थीम कैटलॉग के लिए `docsOutput.style: "vitepress"` का उपयोग करता है। वही फ़ाइल `translated-docs/` के तहत `README.md` अनुवाद भी लिखती है। साइट वायरिंग: [VitePress](/hi/guide/integrations/vitepress)।

<a id="what-sync-runs"></a>
## सिंक क्या चलाता है

`ai-i18n-tools sync` सक्षम चरणों को इस क्रम में चलाता है:

1. `extract`, फिर `translate-ui`, जब `features.translateUIStrings` सक्षम हो।
2. `translate-svg`, जब `features.translateSVG` सक्षम हो और एक `svg` ब्लॉक मौजूद हो।
3. `translate-docs`, जब `features.translateDocs` सक्षम हो या कोई `docs[].docusaurusCatalogDir` सेट हो।
4. `translate-json`, जब `features.translateJson` सक्षम हो और `json[]` में प्रविष्टियाँ हों।

`--no-ui`, `--no-svg`, `--no-docs`, या `--no-json` वाले हिस्सों को छोड़ दें। डॉक्स और `json[]` चरण `--dry-run`, `-p` / `--path`, `--force`, `--force-update`, और `--check-cache` स्वीकार करते हैं। जब `--no-docs` सेट होता है तो केवल डॉक्स वाले फ़्लैग को अनदेखा कर दिया जाता है। जब `--no-json` सेट नहीं होता है तो JSON समान कैश फ़्लैग का उपयोग करता है।

व्यक्तिगत कमांड को मैन्युअल रूप से जोड़ने के बजाय `sync` को प्राथमिकता दें। मैन्युअल रूप से चलाने पर क्रम, निष्कर्षण और लोकेल फ़्लैग गलत हो सकते हैं।

<a id="ui-strings-and-documents-together"></a>
## UI स्ट्रिंग और दस्तावेज़ एक साथ

UI स्ट्रिंग और दस्तावेज़ों को एक ही पास में चलाने के लिए एक ही कॉन्फ़िग में दोनों सुविधाओं को सक्षम करें:

<details>
<summary>संयुक्त UI + डॉक्स कॉन्फ़िग का उदाहरण</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
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

UI ब्लॉक डिफ़ॉल्ट रूप से दस्तावेज़ीकरण के लिए शब्दावली संकेतों के रूप में अपने `strings.json` कैटलॉग शामिल करते हैं (`uiGlossary`)। `glossary.userGlossary` उत्पाद शब्दों के लिए CSV ओवरराइड जोड़ता है। [शब्दावली](/hi/guide/glossary) देखें।

<a id="fewer-locales-for-documents"></a>
## दस्तावेज़ों के लिए कम लोकेल

उस ब्लॉक की फ़ाइलों को UI की तुलना में छोटे उपसमूह में अनुवादित करने के लिए एक ब्लॉक पर `docs[].targetLocales` का उपयोग करें। प्रभावी दस्तावेज़ लोकेल ब्लॉकों में संघ हैं:

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-config"></a>
## मिश्रित दस्तावेज़ कॉन्फ़िग

आप `docs` में एक से अधिक प्रविष्टियाँ जोड़कर एक ही कॉन्फ़िग में कई दस्तावेज़ पाइपलाइन को जोड़ सकते हैं। यह एक सामान्य सेटअप है जब किसी प्रोजेक्ट में Docusaurus साइट (`docsOutput.style = "docusaurus"`) के साथ-साथ रूट-लेवल मार्कडाउन फ़ाइलें होती हैं, जैसे `docsOutput.style = "flat"` के साथ एक रिपॉजिटरी README, जिन्हें लोकेल-प्रत्ययित फ़ाइल नामों के साथ अनुवादित किया जाना चाहिए।

<details>
<summary>मिश्रित Docusaurus + फ़्लैट README कॉन्फ़िग का उदाहरण</summary>

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

यह `ai-i18n-tools sync` के साथ कैसे चलता है:

- UI स्ट्रिंग `src/` से `public/locales/` में निकाली और अनुवादित की जाती हैं।
- पहला डॉक्स ब्लॉक `docs-site/docs/` से मार्कडाउन को `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (स्थानीयकृत दस्तावेज़ पृष्ठ) में अनुवादित करता है।
- `docs[].docusaurusCatalogDir` सेट होने और `features.translateDocs` सक्षम होने पर, वही ब्लॉक `docs-site/i18n/en/` के तहत Docusaurus शेल JSON को प्रत्येक लक्ष्य लोकेल फ़ोल्डर में भी अनुवादित करता है: नेविगेशन बार, फ़ुटर, और थीम/प्लगइन कैटलॉग, MDX बॉडी कॉपी नहीं।
- दूसरा डॉक्स ब्लॉक `README.md` को `translated-docs/` (`docsOutput.style = "flat"`) के तहत लोकेल-प्रत्ययित फ़ाइलों में अनुवादित करता है।
- सभी डॉक्स ब्लॉक `cacheDir` साझा करते हैं, इसलिए API कॉल और लागत को कम करने के लिए अपरिवर्तित सेगमेंट को रन में पुन: उपयोग किया जाता है।

अगला: [त्वरित शुरुआत](/hi/guide/quick-start) पर वापस, या पूर्ण स्कीमा के लिए [कॉन्फ़िगरेशन](/hi/reference/configuration) देखें।
