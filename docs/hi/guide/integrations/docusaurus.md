<a id="docusaurus-integration"></a>
# Docusaurus एकीकरण

[Docusaurus](https://docusaurus.io/) दस्तावेज़ साइटों के लिए `init -t ui-docusaurus` और `docsOutput.style: "docusaurus"` का उपयोग करें। प्रीसेट `docs[]` ब्लॉक को `docusaurusCatalogDir` के साथ स्कैफ़ोल्ड करता है ताकि `translate-docs` एक ही कमांड में पेज मार्कडाउन और Docusaurus शेल JSON दोनों का अनुवाद कर सके।

[दस्तावेज़](/hi/guide/documents/), चलाने योग्य [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) डेमो, और [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) को भी देखें, जिसमें नेस्टेड Docusaurus डॉक्स, फ़्लैट README और SVG एसेट के साथ एक संयुक्त Next.js ऐप है।

<a id="quick-start"></a>
## त्वरित शुरुआत

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # or: cd examples/docusaurus-docs && pnpm build
```

जब आप दस्तावेज़ पृष्ठों और साइट क्रोम (नेविगेशन बार, फ़ुटर, थीम स्ट्रिंग्स) दोनों का अनुवाद करते हैं, तो `features.translateDocs` सक्षम करें और `docs[].docusaurusCatalogDir` सेट करें। जब आप `@docusaurus/*` को अपग्रेड करते हैं या नेविगेशन बार/फ़ुटर/थीम लेबल बदलते हैं, तो अपने Docusaurus प्रोजेक्ट में `docusaurus write-translations` चलाएँ — फिर `translate-docs` या `sync` को फिर से चलाएँ ताकि शेल JSON प्रत्येक स्थानीय फ़ोल्डर में अनुवादित हो जाए।

<a id="page-layout"></a>
## पेज लेआउट

अंग्रेजी मार्कडाउन और MDX आपके Docusaurus `docs/` फ़ोल्डर (उदाहरण के लिए `docs-site/docs/`) के अंतर्गत रहते हैं। अनुवादित प्रतियाँ प्रत्येक स्थानीय के प्लगइन सामग्री ट्री में लिखी जाती हैं:

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

एक `docs[]` ब्लॉक कॉन्फ़िगर करें:

```json
{
  "contentPaths": ["docs-site/docs/"],
  "outputDir": "docs-site/i18n",
  "docusaurusCatalogDir": "docs-site/i18n/en",
  "addFrontmatter": true,
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "docs-site/docs"
  }
}
```

अपने अंग्रेजी `.md` / `.mdx` फ़ाइलों और निर्देशिकाओं पर `contentPaths` इंगित करें। `docsRoot` को उसी फ़ोल्डर पर सेट करें जिसका उपयोग Docusaurus अपनी सामग्री रूट के रूप में करता है। `outputDir` को `i18n/` के अंतर्गत प्रत्येक स्थानीय फ़ोल्डर के पैरेंट पर सेट करें।

Docusaurus [अंतर्राष्ट्रीयकरण](https://docusaurus.io/docs/i18n/introduction) को वायर करें: `ai-i18n-tools.config.json` में `targetLocales` को `docusaurus.config.js` में `locales` सरणी के साथ संरेखित रखें। प्रत्येक `localeConfigs[locale].path` को `i18n/` के अंतर्गत फ़ोल्डर नाम से मेल खाना चाहिए (उदाहरण के लिए `i18n/fr/` के लिए `path: "fr"`)।

<a id="shell-strings-write-translations"></a>
## शेल स्ट्रिंग्स (write-translations)

Docusaurus नेविगेशन बार, फ़ुटर, खोज प्लेसहोल्डर और अन्य थीम/प्लगइन लेबल मार्कडाउन से निकाले नहीं जाते हैं। डिफ़ॉल्ट स्थानीय फ़ोल्डर (आमतौर पर `i18n/en/`) के अंतर्गत JSON कैटलॉग उत्पन्न करने के लिए अपने Docusaurus प्रोजेक्ट में `docusaurus write-translations` चलाएँ। फिर `docs[].docusaurusCatalogDir` को उस फ़ोल्डर पर इंगित करें:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus pages + shell JSON",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

जब `docusaurusCatalogDir` सेट होता है और `features.translateDocs` सक्षम होता है, तो `translate-docs` दोनों का अनुवाद करता है:

- **दस्तावेज़ पृष्ठ** — `contentPaths` से `i18n/<locale>/docusaurus-plugin-content-docs/current/` में मार्कडाउन/MDX
- **शेल JSON** — नेविगेशन बार, फ़ुटर, और थीम/प्लगइन कैटलॉग `i18n/en/` से सिबलिंग स्थानीय फ़ोल्डरों में

Docusaurus शेल JSON को `json[]` में न डालें; इसके बजाय दस्तावेज़ों के साथ `docs[].docusaurusCatalogDir` का उपयोग करें।

<a id="example-project"></a>
## उदाहरण प्रोजेक्ट

[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — `docs/` पर अंग्रेजी स्रोत, `i18n/<locale>/docusaurus-plugin-content-docs/current/` के अंतर्गत प्रतिबद्ध अनुवाद, साथ ही अनुवादित शेल JSON। पोर्ट 3100 पर `pnpm start` चलाएँ (बिल्ड + सर्व) ताकि स्थानीय ड्रॉपडाउन काम करे; केवल अंग्रेजी हॉट रीलोड के लिए `pnpm dev` का उपयोग करें।

UI स्ट्रिंग्स, SVG अनुवाद, और उसी रिपॉजिटरी लेआउट में एक फ़्लैट README के लिए, [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (पोर्ट 3040 पर नेस्टेड `docs-site/`) देखें।
