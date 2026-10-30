<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# अपने README और Markdown दस्तावेज़ों में i18n जोड़ें

यह पृष्ठ GitHub, GitLab, Bitbucket, या किसी अन्य होस्ट पर मौजूद रिपॉजिटरी के लिए है, जिसके पाठक `README.md` और कुछ अन्य Markdown फ़ाइलों से शुरुआत करते हैं। कॉन्फ़िगर करने के लिए कोई डॉक्यूमेंटेशन-साइट फ़्रेमवर्क नहीं है। सामान्य प्रोजेक्ट में एक ऐप या CLI भी होता है, और README को उस ऐप के समान भाषाओं और समान उत्पाद शर्तों का उपयोग करना चाहिए। UI स्ट्रिंग के बिना एक लाइब्रेरी या केवल डॉक्स-रिपॉजिटरी दूसरा मामला है, जिसे नीचे कवर किया गया है।

यह टूल `README.md` को यथावत रखता है और प्रति भाषा एक लोकल फ़ाइल लिखता है, उदाहरण के लिए `translated-docs/README.de.md`। README के अंदर एक भाषा पंक्ति उन फ़ाइलों को एक साथ जोड़ती है।

<a id="install-and-choose-a-provider"></a>
## आप किस सेटअप में हैं?

| आपके पास है | स्काफ़ोल्ड | फिर |
| --- | --- | --- |
| एक JS/TS ऐप और एक README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, डिफ़ॉल्ट) | `t()` के लिए [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js), और README के लिए यह पृष्ठ |
| एक Python ऐप और एक README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | ऐप के लिए [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python), और README के लिए यह पृष्ठ |
| कोई अन्य टेम्प्लेट, और एक README | उस `init` कमांड में `--with-readme` जोड़ें | README ब्लॉक के लिए यह पृष्ठ |
| केवल README और Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | यह पृष्ठ |

`--with-readme` `ui-markdown` और `docs-markdown` पर कोई ऑपरेशन नहीं करता है, क्योंकि उन टेम्प्लेट में पहले से ही README ब्लॉक शामिल है।

<a id="initialise-the-project"></a>
## आपको क्या मिलता है

- `README.md` स्रोत फ़ाइल बनी रहती है। होस्ट इसे रिपॉजिटरी के मुख्य पृष्ठ के रूप में प्रस्तुत करते रहते हैं।
- प्रत्येक लक्ष्य लोकल `translated-docs/README.de.md` जैसी एक सहोदर फ़ाइल होती है।
- स्रोत और प्रत्येक अनुवाद में भाषा पंक्ति हर लोकल को सूचीबद्ध करती है, जिसमें ऐसे लिंक होते हैं जो पाठक द्वारा देखी जा रही फ़ाइल से काम करते हैं।

जब उन फ़ाइलों का भी अनुवाद किया जाना चाहिए, तो `CONTRIBUTING.md`, `CHANGELOG.md`, या एक `docs/` फ़ोल्डर को उसी ब्लॉक में जोड़ें। [README से अधिक](#step-3-more-than-the-readme) देखें।

<a id="run-the-agent-prompt"></a>
## इंस्टॉल करें

CLI इंस्टॉल करें ([इंस्टॉलेशन](/hi/guide/installation)) और अपने प्रदाता के लिए API कुंजी सेट करें ([प्रदाता और API कुंजी](/hi/guide/quick-start#provider-and-api-key))। Ollama को किसी कुंजी की आवश्यकता नहीं है।

`package.json` वाली एक रिपॉजिटरी पैकेज को एक देव डिपेंडेंसी के रूप में स्थापित करती है। Node.js प्रोजेक्ट के बिना एक रिपॉजिटरी `npx ai-i18n-tools` चला सकती है, या [स्टैंडअलोन निष्पादन योग्य](/hi/guide/installation#standalone-executables) का उपयोग कर सकती है।

<a id="review-the-result"></a>
## स्काफ़ोल्ड

JS/TS ऐप और README (एक कमांड; `ui-markdown` डिफ़ॉल्ट टेम्प्लेट है):

```bash
ai-i18n-tools init -P openrouter
```

Python, Astro, प्लेन HTML, VitePress, Docusaurus, या कोई अन्य टेम्प्लेट, जिसमें वही README ब्लॉक जोड़ा गया हो:

```bash
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

केवल README और Markdown फ़ाइलें:

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
```

`init` केवल `ai-i18n-tools.config.json` लिखता है। यह `README.md` को संपादित नहीं करता है। जब कॉन्फ़िग में एक README ब्लॉक शामिल होता है, तो यह चिपकाने के लिए मार्कर लाइन प्रिंट करता है और `README.md` गायब होने पर चेतावनी देता है। एक मौजूदा कॉन्फ़िग को अकेला छोड़ दिया जाता है: ब्लॉक को मैन्युअल रूप से जोड़ें, जैसा कि [आपके पास पहले से मौजूद कॉन्फ़िग में ब्लॉक जोड़ें](#add-the-block-to-a-config-you-already-have) में है।

<a id="choose-models-and-translate"></a>
## कॉन्फ़िगर करें

चार कुंजियाँ मायने रखती हैं:

- `sourceLocale`: वह भाषा जिसमें README लिखा गया है। कोई भी भाषा मान्य है। इस गाइड में अंग्रेज़ी एक सामान्य उदाहरण है।
- `targetLocales`: जोड़ने वाली भाषाएँ।
- `features.translateDocs`: सही होना चाहिए। एक हाइब्रिड कॉन्फ़िग `features.translateUIStrings` भी सेट करता है।
- `docs[].contentPaths`: अनुवाद करने के लिए Markdown फ़ाइलें और फ़ोल्डर। स्केफ़ोल्ड `README.md` को सूचीबद्ध करता है।

<details>
<summary>हाइब्रिड: UI स्ट्रिंग और README</summary>

`ui-markdown` इस आकार को लिखता है। `ui` ऐप कैटलॉग है। `docs` एंट्री README है।

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": ".",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

</details>

<details>
<summary>केवल README और Markdown</summary>

`docs-markdown` UI स्ट्रिंग को बंद कर देता है और उसी README ब्लॉक को रखता है।

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": "."
      }
    }
  ]
}
```

भाषा-सूची सेटिंग्स हाइब्रिड उदाहरण के समान हैं। स्निपेट को छोटा रखने के लिए उन्हें यहाँ छोड़ दिया गया है। `init -t docs-markdown` उन्हें लिखता है।

</details>

<a id="check-one-language"></a>
### आपके पास पहले से मौजूद कॉन्फ़िग में ब्लॉक जोड़ें

हाइब्रिड उदाहरण से `docs` ऑब्जेक्ट जोड़ें और `features.translateDocs` को `true` पर सेट करें। यदि कॉन्फ़िग में पहले से ही एक `docs` ऐरे है (उदाहरण के लिए, एक VitePress या Docusaurus साइट), तो README ऑब्जेक्ट को दूसरी एंट्री के रूप में जोड़ें। `sync` हर ब्लॉक को चलाता है। [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) ऐसा करता है: डॉक्स साइट के लिए एक ब्लॉक, `README.md` के लिए एक फ़्लैट ब्लॉक।

<a id="keep-it-translated"></a>
## भाषा सूची जोड़ें

इस पंक्ति को `README.md` में रखें, जहाँ पाठकों को अन्य भाषाएँ दिखनी चाहिए। इसके ऊपर की पंक्ति पर एक छोटा लेबल सामान्य गद्य है और इसका अनुवाद किया जाएगा।

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

लाइन खाली हो सकती है। `translate-docs` शुरुआती मार्कर से लेकर समापन मार्कर तक सब कुछ प्रति लोकेल एक लिंक के साथ बदल देता है। फेंस्ड कोड ब्लॉक के अंदर के मार्कर अनदेखा किए जाते हैं, इसलिए उसी फ़ाइल में एक कॉन्फ़िग नमूना मेल नहीं खाता। विवरण: [Language switcher](/hi/guide/documents/language-switcher)।

<a id="hybrid-tips"></a>
## अनुवाद करें

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` सक्षम चरणों को क्रम में चलाता है: `extract` और `translate-ui` जब UI स्ट्रिंग चालू होती हैं, फिर `translate-docs`। एक कैश साझा किया जाता है, इसलिए ऐप के लिए पहले से अनुवादित एक वाक्य को README में दिखाई देने पर पुन: उपयोग किया जाता है। UI कैटलॉग को दस्तावेज़ अनुवाद में शब्दावली संकेतों (`ui[].uiGlossary`, डिफ़ॉल्ट रूप से चालू) के रूप में भी पास किया जाता है, जो बटन और सुविधा नामों को सुसंगत रखता है। [Glossary](/hi/guide/glossary) देखें।

पंक्ति में भाषा के नाम `ui-languages.json` से आते हैं, जिसे `extract` UI कैटलॉग के बगल में लिखता है। एक README-केवल कॉन्फ़िग में कोई UI कैटलॉग नहीं होता है, इसलिए पंक्ति इसके बजाय बंडल की गई भाषा सूची का उपयोग करती है। लेबल अभी भी मूल नाम हैं। `generate-ui-languages` को तभी चलाएं जब आप अपनी खुद की एक प्रोजेक्ट मैनिफ़ेस्ट चाहते हों।

`translated-docs/` को कमिट करें और होस्ट पर अनुवादित README खोलें। स्रोत README और `translated-docs/README.de.md` के बीच के सापेक्ष लिंक को प्रत्येक फ़ाइल के लिए फिर से लिखा जाता है।

<a id="say-that-the-translation-is-automatic"></a>
## हाइब्रिड युक्तियाँ

- `docs[].targetLocales` के साथ ऐप की तुलना में कम भाषाओं में README का अनुवाद करें। [Fewer locales for documents](/hi/guide/combining-pipelines#fewer-locales-for-documents) देखें।
- उत्पाद शब्दों को `glossary.userGlossary` में डालें। UI स्ट्रिंग और README के लिए एक ही CSV का उपयोग किया जाता है।
- `ai-i18n-tools sync --no-docs` या `ai-i18n-tools sync --no-ui` के साथ केवल एक पक्ष चलाएं।

<a id="do-it-by-hand"></a>
## README से अधिक

`contentPaths` में पाथ जोड़ें। `flatPreserveRelativeDir` फ़ोल्डर रखता है, इसलिए `docs/guide.md` दूसरे `guide.md` से टकराने के बजाय `translated-docs/docs/guide.de.md` बन जाता है।

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

एक `.translate-ignore` फ़ाइल उन पाथ को छोड़ देती है जिन्हें आप अनुवादित नहीं करना चाहते हैं। `init --with-translate-ignore` एक स्टार्टर लिखता है। कोड फ़ेंस, URL और हेडिंग एंकर का अनुवाद नहीं किया जाता है। [Output layouts](/hi/guide/documents/output-layouts), [Anchor links](/hi/guide/documents/anchor-links), और [Link rewriting](/hi/guide/documents/link-rewriting) देखें।

ऐसी स्क्रीनशॉट जो भाषा के अनुसार भिन्न हों: [छवियाँ और स्क्रीनशॉट](/hi/guide/images-and-screenshots/)।

<a id="step-1-configure-the-docs-block"></a>
## होस्ट पर लिंक

रिपॉजिटरी में अन्य फ़ाइलों के लिंक को लोकले फ़ाइल में फिर से लिखा जाता है। प्रकाशित डॉक्स साइट का लिंक फिर से नहीं लिखा जाता है। यह रिपॉजिटरी अपने डॉक्स-साइट URL को लोकले के साथ `regexAdjustments` का उपयोग करके उपसर्ग करती है:

```json
"regexAdjustments": [
  {
    "search": "https://wsj-br\\.github\\.io/ai-i18n-tools/",
    "replace": "https://wsj-br.github.io/ai-i18n-tools/${translatedLocale}/"
  }
]
```

फ़्लैट लिंक रीराइटर पहले चलता है, फिर ये प्रतिस्थापन होते हैं। [लिंक रीराइटिंग](/hi/guide/documents/link-rewriting) देखें।

<a id="add-the-block-to-a-config-you-already-have"></a>
## इसे अनुवादित रखें

स्रोत README या ऐप स्ट्रिंग बदलने के बाद `sync` को फिर से चलाएँ। कैश केवल नया या बदला हुआ टेक्स्ट मॉडल को भेजता है। `translated-docs/` के तहत अपडेट की गई फ़ाइलों को कमिट करें।

नीचे दिया गया वर्कफ़्लो एक नमूना है, प्रकाशित कार्रवाई नहीं। यह CLI को स्थापित करता है और `README.md` बदलने पर `sync` चलाता है। प्रदाता कुंजी को रिपॉजिटरी सीक्रेट के रूप में संग्रहीत करें। `translated-docs/` डिफ की समीक्षा करें और उसे कमिट करें, या उसे एक ब्रांच पर पुश करें और पुल रिक्वेस्ट खोलें।

```yaml
name: Translate README
on:
  push:
    paths:
      - "README.md"
      - "ai-i18n-tools.config.json"
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install --save-dev ai-i18n-tools
      - run: npx ai-i18n-tools sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

आपके द्वारा कॉन्फ़िगर किए गए प्रदाता के लिए पर्यावरण चर का उपयोग करें। Ollama होस्ट किए गए रनर पर तब तक लागू नहीं होता जब तक आप इसे वहाँ स्थापित न करें।

<a id="step-2-add-the-language-list"></a>
## बताएँ कि अनुवाद स्वचालित है

AI अनुवाद गलत हो सकते हैं। README के नीचे एक छोटा नोट, जैसा कि [इस रिपॉजिटरी के README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) में है, पाठकों को बताता है कि अन्य भाषाओं का मशीन-अनुवाद किया गया था और उन पर भरोसा करने से पहले उनकी जाँच की जानी चाहिए।

<a id="step-3-more-than-the-readme"></a>
## आपका मामला नहीं?

| आपके पास | पढ़ें |
| --- | --- |
| ऐप UI स्ट्रिंग और अनुवाद करने के लिए कोई README नहीं | [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) या [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) |
| एक VitePress, Docusaurus, Starlight, Nextra, Fumadocs, या Astro साइट | [एक वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website)। `--with-readme` जोड़ें जब रिपॉजिटरी README का भी अनुवाद किया जाना चाहिए |
| प्रति लोकले एक HTML फ़ाइल | [HTML पेज](/hi/guide/documents/html-pages) |
| पूर्ण `translate-docs` संदर्भ | [दस्तावेज़](/hi/guide/documents/) |

<a id="step-4-links-on-the-host"></a>
## उदाहरण

| प्रोजेक्ट | यह क्या दिखाता है |
| --- | --- |
| [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) | एक छोटा Node ऐप और एक फ़्लैट README ब्लॉक |
| [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) | UI स्ट्रिंग, एक डॉक्स साइट, और एक अलग फ़्लैट README ब्लॉक |
| यह रिपॉजिटरी | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): फ़्लैट README ब्लॉक, फिर VitePress साइट |

<a id="not-your-case"></a>
## एजेंट प्रॉम्प्ट

इसे कर्सर या किसी अन्य कोडिंग एजेंट में कॉपी करें। यह रिपॉजिटरी तैयार करता है। यह README का अनुवाद नहीं करता है।

````markdown
# Prepare README and Markdown translation

## Context

ai-i18n-tools translates Markdown listed in `docs[]` and writes one file per locale. The source README stays in place. Flat output for a README looks like `translated-docs/README.de.md`. Guide: https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme

## Scope

Edit `ai-i18n-tools.config.json` and the source Markdown files that should grow a language list. Do not edit anything under `translated-docs/` or other generated locale trees.

## Config

- If there is no config, run `ai-i18n-tools init -P <provider>` for a JS/TS app (this template already includes the README block), `ai-i18n-tools init -t docs-markdown -P <provider>` for Markdown only, or `ai-i18n-tools init -t <template> -P <provider> --with-readme` for any other template.
- If a config exists, set `features.translateDocs` to true and append one `docs` entry: `contentPaths` includes `README.md`, `outputDir` is `translated-docs`, `addFrontmatter` is false, `docsOutput.style` is `flat`, `flatPreserveRelativeDir` is true, and `postProcessing.languageListBlock` uses start `<small id="lang-list">`, end `</small>`, separator ` · `.
- Do not add a second block when one already lists `README.md`.
- Add other source files the user named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## README

Add this line where the language row should appear, if it is not already there:

```markdown
<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.

## Do not

- Do not translate, rewrite, or shorten the source README.
- Do not hand-edit `translated-docs/` or locale JSON.
- Do not run a translation yourself.

## Verify

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.

## Report back

List files changed and any Markdown file you left out of `contentPaths`, with a one-line reason.
````
