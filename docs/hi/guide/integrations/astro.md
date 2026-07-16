<a id="astro-integration"></a>
# एस्ट्रो इंटीग्रेशन

ai-i18n-tools का उपयोग [एस्ट्रो](https://astro.build/) के साथ दो सामान्य सेटअप में करें: **एस्ट्रो स्टारलाइट** दस्तावेज़ साइटें और **साधारण एस्ट्रो** मार्केटिंग या ऐप साइटें। दोनों पृष्ठ सामग्री के लिए दस्तावेज़ (`translate-docs`) का उपयोग करते हैं; साधारण एस्ट्रो साइटें अक्सर फ्रंटमैटर और साझा डेटा में `t()` स्ट्रिंग के लिए UI स्ट्रिंग (`extract` / `translate-ui`) के साथ इसे जोड़ती हैं।

[UI स्ट्रिंग](/hi/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight), [दस्तावेज़](/hi/guide/documents/), और नीचे दिए गए चलाने योग्य उदाहरण भी देखें।

<a id="astro-starlight"></a>
## एस्ट्रो स्टारलाइट

[एस्ट्रो स्टारलाइट](https://starlight.astro.build/) दस्तावेज़ साइटों के लिए `init -t ui-starlight` और `docsOutput.style: "astro-starlight"` का उपयोग करें। प्रीसेट एक खाली `localeSubpath` के साथ `doc-system` के लिए एक उपनाम है — अनुवादित पृष्ठ अंग्रेजी स्रोत ट्री के बगल में `src/content/docs/<locale>/` के तहत आते हैं।

<a id="quick-start"></a>
### त्वरित शुरुआत

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### पृष्ठ लेआउट

अंग्रेजी मार्कडाउन और MDX स्टारलाइट सामग्री रूट (आमतौर पर `src/content/docs/`) पर रहते हैं। अनुवादित प्रतियां स्रोत ट्री के बगल में लिखी जाती हैं:

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

एक `docs[]` ब्लॉक कॉन्फ़िगर करें:

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

`contentPaths` को अपनी अंग्रेजी `.md` / `.mdx` फ़ाइलों और निर्देशिकाओं पर इंगित करें। `docsRoot` को उसी फ़ोल्डर पर सेट करें जिसे स्टारलाइट अपनी सामग्री रूट के रूप में उपयोग करता है।

स्टारलाइट UI ओवरराइड आवश्यकता पड़ने पर एक अलग `docs[]` ब्लॉक में `src/content/i18n/en.json` के साथ `jsonPathTemplate` का उपयोग कर सकते हैं — [दस्तावेज़ — दस्तावेज़ों के लिए आरंभ करें](/hi/guide/documents/#step-1-initialise-for-documentation) देखें।

स्टारलाइट कई लोकेल (नेविगेशन लेबल, खोज प्लेसहोल्डर, सामग्री की तालिका, आदि) के लिए अंतर्निहित UI स्ट्रिंग भेजता है। कॉन्फ़िगर करने के लिए कोई अलग शेल/थीम पाइपलाइन नहीं है — केवल पृष्ठ सामग्री के लिए `translate-docs` का उपयोग करें। अन्य फ्रेमवर्क के लिए, [फ्रेमवर्क शेल अनुवाद](/hi/guide/integrations/#framework-shell-translation) देखें।

<a id="example-project"></a>
### उदाहरण परियोजना

[उदाहरण/एस्ट्रो-डॉक्स](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — `src/content/docs/` पर अंग्रेजी स्रोत, `src/content/docs/<locale>/` के तहत प्रतिबद्ध अनुवाद, RTL लोकेल (`ar`), और शब्दावली-संचालित अनुवाद। पोर्ट 3050 पर `pnpm dev` चलाएँ।

<a id="plain-astro-marketing-and-app-sites"></a>
## सादा एस्ट्रो (मार्केटिंग और ऐप साइटें)

स्थैतिक एस्ट्रो मार्केटिंग या ऐप साइटों (स्टारलाइट नहीं) के लिए, [एस्ट्रो अंतर्निहित i18n रूटिंग](https://docs.astro.build/en/guides/internationalization/) को ai-i18n-tools के साथ संयोजित करें। संदर्भ कार्यान्वयन [उदाहरण/एस्ट्रो-वेबसाइट](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) है: `/` पर अंग्रेजी, `/{locale}/` पर लक्ष्य लोकेल।

अधिकांश टीमें एक ही पृष्ठ पर दो पाइपलाइनों के **हाइब्रिड** का उपयोग करती हैं:

| पाइपलाइन | इसके लिए उपयोग करें | कमांड | आउटपुट |
|----------|---------|----------|--------|
| **पृष्ठ HTML** | शीर्षक, पैराग्राफ, नेविगेशन लेबल, टेम्पलेट बॉडी में इनलाइन एरे | `translate-docs` | प्रति लोकेल `src/pages/{locale}/index.astro` |
| **UI स्ट्रिंग (`t()`)** | फ्रंटमैटर डेटा, टैब लेबल, साझा एरे | `extract` → `translate-ui` | `public/locales/{locale}.json` (कुंजी के रूप में अंग्रेजी स्रोत) |

<a id="quick-start-1"></a>
### त्वरित शुरुआत

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

`init -t ui-astro-website` के साथ UI निष्कर्षण को स्केफोल्ड करें, फिर जब आप पृष्ठ HTML का भी अनुवाद करते हैं तो एक `docs[]` ब्लॉक में मर्ज करें:

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
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

जब आप कोई भाषा जोड़ते या हटाते हैं, तो तीन सूचियों को संरेखित रखें: `targetLocales` में `ai-i18n-tools.config.json`, `i18n.locales` में `astro.config.mjs` (एस्ट्रो `pt-br` जैसे **छोटे अक्षरों** वाले रूट कोड का उपयोग करता है), और `ui-languages.json` (`generate-ui-languages` के माध्यम से)। फ्लैट बंडल **फ़ाइलनाम** कॉन्फ़िग केसिंग (`pt-BR.json`) का उपयोग करते हैं; एस्ट्रो के `pt-br` रूट को अपनी मेनिफेस्ट `code` फ़ील्ड के माध्यम से उस फ़ाइल पर मैप करें।

अंग्रेजी स्रोत शाब्दिक को कुंजी के रूप में देखकर **बिल्ड समय** पर `t('…')` को हल करें — `examples/astro-website/src/i18n/t.ts` देखें। आपको एक स्थिर साइट के लिए `ai-i18n-tools/runtime` या i18next की आवश्यकता नहीं है जब तक कि आप क्लाइंट आइलैंड्स नहीं जोड़ते हैं जो लोड होने के बाद भाषा बदलते हैं।

<a id="example-project-1"></a>
### उदाहरण प्रोजेक्ट

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — `translate-docs` के माध्यम से HTML के साथ हाइब्रिड लैंडिंग पेज और `t()` + `translate-ui` के माध्यम से स्क्रीनशॉट टैब लेबल।

<a id="example-projects"></a>
## उदाहरण प्रोजेक्ट

| प्रोजेक्ट | उपयोग का मामला | पोर्ट |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | स्टारलाइट दस्तावेज़ | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | प्लेन एस्ट्रो मार्केटिंग साइट (HTML + `t()` हाइब्रिड) | (रीडमी देखें) |

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) की तुलना [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) से करें — समान ट्यूटोरियल सामग्री, स्टारलाइट के बजाय डॉक्यूसॉरस आउटपुट शैली।
