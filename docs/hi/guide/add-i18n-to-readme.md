<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# अपने README और Markdown दस्तावेज़ों में i18n जोड़ें

यह पृष्ठ GitHub, GitLab, Bitbucket, या किसी अन्य होस्ट पर एक रिपॉजिटरी लेता है जिसके रीडर `README.md` से शुरू होते हैं और प्रति भाषा एक फ़ाइल जोड़ते हैं। कॉन्फ़िगर करने के लिए कोई डॉक्यूमेंटेशन-साइट फ्रेमवर्क नहीं है। सामान्य प्रोजेक्ट में एक ऐप या CLI भी होता है, और README को उसी ऐप के समान भाषाओं और समान उत्पाद शर्तों का उपयोग करना चाहिए। कोई UI स्ट्रिंग के बिना एक लाइब्रेरी या केवल डॉक्स रिपॉजिटरी दूसरा मामला है, जिसे नीचे कवर किया गया है।

<a id="what-you-get"></a>

यह टूल `README.md` को यथावत छोड़ देता है। होस्ट इसे रिपॉजिटरी के फ्रंट पेज के रूप में रेंडर करते रहते हैं। प्रत्येक लक्ष्य लोकले एक सिबलिंग फ़ाइल है जैसे `translated-docs/README.de.md`। README के अंदर एक भाषा पंक्ति उन फ़ाइलों को एक साथ जोड़ती है, और वही पंक्ति हर अनुवाद में लिखी जाती है, जिसमें ऐसे लिंक होते हैं जो पाठक जिस फ़ाइल को देख रहा है, उससे काम करते हैं। `translate-docs` उस पंक्ति को भरता है। यह शुरुआती मार्कर से लेकर समापन मार्कर तक सब कुछ प्रति लोकले एक लिंक से बदल देता है। जब उन फ़ाइलों का भी अनुवाद किया जाना चाहिए तो `CONTRIBUTING.md`, `CHANGELOG.md`, या एक `docs/` फ़ोल्डर को उसी ब्लॉक में जोड़ें। [README से अधिक](#step-3-more-than-the-readme) देखें।

सबसे तेज़ तरीका यह है कि एक कोडिंग एजेंट को इस पृष्ठ पर प्रॉम्प्ट दिया जाए। यह कॉन्फ़िग की जाँच करता है और भाषा-सूची मार्कर जोड़ता है। आप CLI इंस्टॉल करते हैं, प्रदाता चुनते हैं, और प्रोजेक्ट को स्वयं इनिशियलाइज़ करते हैं, क्योंकि इसके लिए आपकी API कुंजी और आपकी पसंद की आवश्यकता होती है। आप अनुवाद भी स्वयं चलाते हैं, क्योंकि यह आपके खाते पर पैसे खर्च करता है।

एक VitePress, Docusaurus, Starlight, Nextra, Fumadocs, या Astro साइट [एक वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website) का उपयोग करती है। जब रिपॉजिटरी README का भी अनुवाद किया जाना चाहिए तो `--with-readme` जोड़ें। निश्चित नहीं हैं कि कौन सा लागू होता है? अंत में [आपका मामला नहीं?](#not-your-case) देखें।

प्रवाह:

1. [CLI स्थापित करें और एक प्रदाता चुनें](#install-and-choose-a-provider)।
2. `init` के साथ [परियोजना को आरंभ करें](#initialise-the-project)।
3. [एजेंट प्रॉम्प्ट चलाएँ](#run-the-agent-prompt)।
4. [परिणाम की समीक्षा करें](#review-the-result)।
5. [मॉडल चुनें और अनुवाद करें](#choose-models-and-translate), फिर एक भाषा की जाँच करें।
6. [इसे अनुवादित रखें](#keep-it-translated)।

परिवर्तन स्वयं करना पसंद करते हैं, या जानना चाहते हैं कि प्रॉम्प्ट क्या करता है? [इसे हाथ से करें](#do-it-by-hand) उन्हीं चरणों को एक-एक करके बताता है।

<a id="install-and-choose-a-provider"></a>
## स्थापित करें और एक प्रदाता चुनें

आप यह हिस्सा करते हैं, एजेंट नहीं। इंस्टॉलर आपकी मशीन को बदलता है, और API कुंजी एक रहस्य है जो आपके शेल में होनी चाहिए, प्रॉम्प्ट में नहीं।

एक `package.json` वाली रिपॉजिटरी पैकेज को एक देव डिपेंडेंसी के रूप में इंस्टॉल करती है। अन्य इंस्टॉल विकल्प: [इंस्टॉलेशन](/hi/guide/installation)।

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` और `yarn add --dev ai-i18n-tools` भी काम करते हैं।

Node.js प्रोजेक्ट के बिना एक रिपॉजिटरी स्टैंडअलोन एक्सेक्यूटेबल का उपयोग कर सकती है। Linux और macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

इंस्टॉलर `SHA256SUMS.txt` की जाँच करता है, कमांड को `ai-i18n-tools` के रूप में इंस्टॉल करता है, और इसे `PATH` में जोड़ता है। बाइनरीज़ नोटराइज़्ड या Authenticode-साइन नहीं हैं। मैन्युअल चरण और एसेट नाम: [स्टैंडअलोन एक्सेक्यूटेबल](/hi/guide/installation#standalone-executables)। जब Node.js इंस्टॉल हो और आप प्रोजेक्ट डिपेंडेंसी नहीं चाहते हों तो `npx ai-i18n-tools` भी काम करता है।

स्थापना की जाँच करें:

```bash
ai-i18n-tools --version
```

फिर एक प्रदाता चुनें और उसकी API कुंजी उस शेल में सेट करें जो अनुवाद चलाएगा। उदाहरण के लिए, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama को किसी कुंजी की आवश्यकता नहीं है। अन्य प्रीसेट: [अंतर्निहित प्रदाता](/hi/guide/providers-and-models#built-in-providers)। प्रदाता का नाम नोट करें, क्योंकि आप इसे अगले चरण में `init` को पास करते हैं। एजेंट को कभी कुंजी की आवश्यकता नहीं होती है: यह केवल उन कमांड को चलाता है जो कोई मॉडल कॉल नहीं करते हैं। आप कुंजी का उपयोग बाद में करते हैं, जब आप [अनुवाद करते हैं](#choose-models-and-translate)।

<a id="initialise-the-project"></a>
## परियोजना को आरंभ करें

आप इसे प्रॉम्प्ट से पहले एक बार चलाते हैं। यह कॉन्फ़िग लिखता है और आपके द्वारा ऊपर चुने गए प्रदाता का उपयोग करता है। यह `README.md` को संपादित नहीं करता है। जब कॉन्फ़िग में एक README ब्लॉक शामिल होता है, तो यह पेस्ट करने के लिए मार्कर लाइन प्रिंट करता है और यदि `README.md` गायब है तो चेतावनी देता है।

| आपके पास है | स्काफ़ोल्ड | फिर |
| --- | --- | --- |
| एक JS/TS ऐप और एक README | `ai-i18n-tools init -P openrouter` (`ui-markdown`, डिफ़ॉल्ट) | `t()` के लिए [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js), और README के लिए यह पृष्ठ |
| एक Python ऐप और एक README | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | ऐप के लिए [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python), और README के लिए यह पृष्ठ |
| कोई अन्य टेम्प्लेट, और एक README | उस `init` कमांड में `--with-readme` जोड़ें | README ब्लॉक के लिए यह पृष्ठ |
| केवल README और Markdown | `ai-i18n-tools init -t docs-markdown -P openrouter` | यह पृष्ठ |

`--with-readme` का `ui-markdown` और `docs-markdown` पर कोई प्रभाव नहीं पड़ता है, क्योंकि उन टेम्प्लेट में पहले से ही README ब्लॉक शामिल है।

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

फिर `ai-i18n-tools.config.json` में `sourceLocale` और `targetLocales` को संपादित करें। `sourceLocale` वह भाषा है जिसमें README लिखा गया है। कोई भी BCP-47 भाषा मान्य है। `features.translateDocs` सत्य होना चाहिए। एक हाइब्रिड कॉन्फ़िग `features.translateUIStrings` भी सेट करता है। `docs[].contentPaths` अनुवाद करने के लिए Markdown फ़ाइलों और फ़ोल्डरों को सूचीबद्ध करता है। स्केफोल्ड `README.md` को सूचीबद्ध करता है।

`init` को एक बार चलाएँ। यह हर बार `ai-i18n-tools.config.json` को फिर से लिखता है, इसलिए दूसरी बार चलाने से आपके द्वारा किए गए संपादन हट जाते हैं। जब आप `init` को छोड़ देते हैं तो एक मौजूदा कॉन्फ़िग को अकेला छोड़ दिया जाता है: प्रॉम्प्ट README ब्लॉक को जोड़ता है, और [चरण 1](#step-1-configure-the-docs-block) हाथ से वही संपादन दिखाता है।

<a id="run-the-agent-prompt"></a>
## एजेंट प्रॉम्प्ट चलाएँ

अपने कोडिंग एजेंट (कर्सर, क्लाउड कोड, कोपायलट, या इसी तरह) में प्रोजेक्ट खोलें, एक नई चैट शुरू करें, और नीचे दिए गए प्रॉम्प्ट को पेस्ट करें। प्रोजेक्ट पहले से ही इनिशियलाइज़ होना चाहिए। संपादित करने के लिए कुछ भी नहीं है। यदि अन्य Markdown फ़ाइलों का अनुवाद किया जाना चाहिए, तो उन्हें उसी संदेश में नाम दें।

एजेंट पहले जाँचता है कि CLI और कॉन्फ़िग मौजूद हैं, और यदि कोई गायब है तो निर्देशों के साथ रुक जाता है। फिर यह दो भागों में काम करता है:

- भाग 1 फ्लैट README ब्लॉक को जोड़ता है जब कॉन्फ़िग में पहले से `README.md` सूचीबद्ध नहीं होता है।
- भाग 2 स्रोत README में भाषा-सूची मार्कर जोड़ता है।

यह CLI इंस्टॉल नहीं करता है, कॉन्फ़िग को इनिशियलाइज़ नहीं करता है, आपकी API कुंजी नहीं पढ़ता है, भाषा लिंक नहीं भरता है, या अनुवाद नहीं करता है। अनुवाद समीक्षा के बाद का चरण है, और आप इसे चलाते हैं।

````markdown
# Prepare README and Markdown translation

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user which command to run, then run this prompt again:

- JS/TS app plus a README: `ai-i18n-tools init -P <provider>`
- README and Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`
- Any other template: `ai-i18n-tools init -t <template> -P <provider> --with-readme`

Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, rewrite, or shorten the source README or any other source
  Markdown. Do not edit anything under `translated-docs/` or other generated
  locale trees. Do not hand-edit locale JSON.
- Do not reformat unrelated files. Leave unrelated edits in a dirty tree alone.

## Part 1 — Config

Skip this part when one `docs` entry already lists `README.md`. Do not add a
second block for the same file.

Otherwise set `features.translateDocs` to true and append one `docs` entry:

- `contentPaths` includes `README.md`
- `outputDir` is `translated-docs`
- `addFrontmatter` is false
- `docsOutput.style` is `flat`
- `docsOutput.flatPreserveRelativeDir` is true
- `docsOutput.linkRewriteDocsRoot` is `.`
- `docsOutput.postProcessing.languageListBlock` uses start
  `<small id="lang-list">`, end `</small>`, separator ` · `

```json
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
```

Leave `features.translateUIStrings` as it is. Add other source files the user
named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## Part 2 — Language list

In `README.md`, where readers should see the other languages, add this marker
if it is not already there. A short label on the line above it is normal
prose. Add that label only when the spot has no heading of its own.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.
Markers inside fenced code blocks are ignored, so a config sample in the same
file does not match. Do not put the real marker inside a fence.

## Verify and report

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and
exactly one docs block lists `README.md`. The marker is in the source README
and not inside a fence. Nothing under `translated-docs/` changed.

Report the files changed and any Markdown file you left out of `contentPaths`,
with a one-line reason. Then list the commands for the user, and do not run
them: `ai-i18n-tools suggest-models` (optional), `ai-i18n-tools sync`.
````

<a id="review-the-result"></a>
## परिणाम की समीक्षा करें

एजेंट एक रिपोर्ट के साथ समाप्त होता है। अनुवाद करने से पहले इसकी जाँच करें:

- अंतर। यह कॉन्फ़िग और मार्कर होना चाहिए। स्रोत गद्य पहले जैसा ही पढ़ना चाहिए। `git diff --stat` दिखाता है कि कितना बदला।
- `translated-docs/` या किसी अन्य जेनरेट किए गए लोकले ट्री के तहत कुछ भी संपादित नहीं किया गया था।
- `ai-i18n-tools.config.json` पार्स करता है, `features.translateDocs` सत्य है, और ठीक एक डॉक्स ब्लॉक `README.md` को सूचीबद्ध करता है।
- मार्कर `README.md` में है और एक फेंस्ड कोड ब्लॉक के अंदर नहीं है। एक बाड़ के अंदर मार्कर का एक नमूना ठीक है। असली वाला बाहर है।

<a id="choose-models-and-translate"></a>
## मॉडल चुनें और अनुवाद करें

आप इस भाग को चलाते हैं। यह आपकी API कुंजी का उपयोग करता है और आपके खाते पर पैसे खर्च करता है।

`init` से मॉडल सूची एक शुरुआती बिंदु है। सक्रिय प्रदाता के चैट मॉडल को रैंक करें और, जब शॉर्टलिस्ट सही दिखे, तो इसे `translationModels` में लिखें:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` केवल `translationModels` को बदलता है। वही रैंकिंग `ai-i18n-tools dashboard` के [मॉडल](/hi/guide/translation-dashboard/models) टैब पर है।

फिर अनुवाद करें:

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` सक्षम चरणों को क्रम में चलाता है: `extract` और `translate-ui` जब UI स्ट्रिंग चालू होती हैं, फिर `translate-docs`। एक कैश साझा किया जाता है, इसलिए ऐप के लिए पहले से अनुवादित एक वाक्य को README में दिखाई देने पर पुन: उपयोग किया जाता है। UI कैटलॉग को दस्तावेज़ अनुवाद में शब्दावली संकेतों (`ui[].uiGlossary`, डिफ़ॉल्ट रूप से चालू) के रूप में भी पास किया जाता है, जो बटन और सुविधा नामों को सुसंगत रखता है। [Glossary](/hi/guide/glossary) देखें।

पंक्ति में भाषा के नाम `ui-languages.json` से आते हैं, जिसे `extract` UI कैटलॉग के बगल में लिखता है। एक README-केवल कॉन्फ़िग में कोई UI कैटलॉग नहीं होता है, इसलिए पंक्ति इसके बजाय बंडल की गई भाषा सूची का उपयोग करती है। लेबल अभी भी मूल नाम हैं। `generate-ui-languages` को तभी चलाएं जब आप अपनी खुद की एक प्रोजेक्ट मैनिफ़ेस्ट चाहते हों।

`translated-docs/` को कमिट करें और होस्ट पर अनुवादित README खोलें। स्रोत README और `translated-docs/README.de.md` के बीच के सापेक्ष लिंक को प्रत्येक फ़ाइल के लिए फिर से लिखा जाता है।

<a id="check-one-language"></a>
### एक भाषा की जाँच करें

होस्ट पर और फ़ाइल में ही `translated-docs/README.de.md` (या जो भी लक्ष्य कोड आपने चुना है) खोलें। भाषा पंक्ति में हर लोकले सूचीबद्ध होना चाहिए, उन लिंक के साथ जो उस फ़ाइल से काम करते हैं जिसे आप देख रहे हैं। एक वाक्य जो अभी भी स्रोत भाषा में था, वह एक कोड फेंस, एक URL, या एक हेडिंग एंकर के अंदर था, या वह `contentPaths` में नहीं था।

<a id="keep-it-translated"></a>
## इसे अनुवादित रखें

स्रोत README या ऐप स्ट्रिंग बदलने के बाद `ai-i18n-tools sync` को फिर से चलाएँ। कैश मॉडल को केवल नया या बदला हुआ टेक्स्ट भेजता है। अपडेट की गई फ़ाइलों को `translated-docs/` के तहत कमिट करें। `ai-i18n-tools dashboard` अनुवादों की समीक्षा करने के लिए [अनुवाद डैशबोर्ड](/hi/guide/translation-dashboard/) खोलता है।

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

<a id="hybrid-tips"></a>
### हाइब्रिड सुझाव

- `docs[].targetLocales` के साथ ऐप की तुलना में कम भाषाओं में README का अनुवाद करें। [Fewer locales for documents](/hi/guide/combining-pipelines#fewer-locales-for-documents) देखें।
- उत्पाद शब्दों को `glossary.userGlossary` में डालें। UI स्ट्रिंग और README के लिए एक ही CSV का उपयोग किया जाता है।
- `ai-i18n-tools sync --no-docs` या `ai-i18n-tools sync --no-ui` के साथ केवल एक पक्ष चलाएं।

<a id="say-that-the-translation-is-automatic"></a>
### बताएँ कि अनुवाद स्वचालित है

AI अनुवाद गलत हो सकते हैं। README के नीचे एक छोटा नोट, जैसा कि [इस रिपॉजिटरी के README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) में है, पाठकों को बताता है कि अन्य भाषाओं का मशीन-अनुवाद किया गया था और उन पर भरोसा करने से पहले उनकी जाँच की जानी चाहिए।

<a id="do-it-by-hand"></a>
## इसे मैन्युअल रूप से करें

इन चरणों का पालन करें यदि आप स्वयं परिवर्तन करना पसंद करते हैं, या आप जानना चाहते हैं कि प्रॉम्प्ट क्या करता है। पहले दो प्रॉम्प्ट के हिस्सों से मेल खाते हैं। अंतिम दो अतिरिक्त फ़ाइलों के लिए और उन लिंक के लिए हैं जो प्रकाशित साइट पर इंगित करते हैं। आप अंत में अभी भी [CLI स्थापित करें](#install-and-choose-a-provider), [प्रोजेक्ट को इनिशियलाइज़ करें](#initialise-the-project), और [अनुवाद करें](#choose-models-and-translate)।

1. [डॉक्स ब्लॉक कॉन्फ़िगर करें](#step-1-configure-the-docs-block)।
2. [भाषा सूची जोड़ें](#step-2-add-the-language-list)।
3. [README से अधिक](#step-3-more-than-the-readme)।
4. [होस्ट पर लिंक](#step-4-links-on-the-host)।

<a id="step-1-configure-the-docs-block"></a>
## चरण 1: डॉक्स ब्लॉक कॉन्फ़िगर करें

चार कुंजियाँ मायने रखती हैं:

- `sourceLocale`: वह भाषा जिसमें README लिखा गया है। कोई भी भाषा मान्य है। इस गाइड में अंग्रेज़ी एक सामान्य उदाहरण है।
- `targetLocales`: जोड़ने वाली भाषाएँ।
- `features.translateDocs`: सही होना चाहिए। एक हाइब्रिड कॉन्फ़िग `features.translateUIStrings` भी सेट करता है।
- `docs[].contentPaths`: अनुवाद करने के लिए Markdown फ़ाइलें और फ़ोल्डर। स्केफ़ोल्ड `README.md` को सूचीबद्ध करता है।

इस चरण को छोड़ दें जब `init` ने पहले ही README ब्लॉक लिख दिया हो। इसका उपयोग तब करें जब आप पहले से मौजूद कॉन्फ़िग को संपादित कर रहे हों।

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

<a id="add-the-block-to-a-config-you-already-have"></a>
### आपके पास पहले से मौजूद कॉन्फ़िग में ब्लॉक जोड़ें

हाइब्रिड उदाहरण से `docs` ऑब्जेक्ट जोड़ें और `features.translateDocs` को `true` पर सेट करें। यदि कॉन्फ़िग में पहले से ही एक `docs` ऐरे है (उदाहरण के लिए, एक VitePress या Docusaurus साइट), तो README ऑब्जेक्ट को दूसरी एंट्री के रूप में जोड़ें। `sync` हर ब्लॉक को चलाता है। [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) ऐसा करता है: डॉक्स साइट के लिए एक ब्लॉक, `README.md` के लिए एक फ़्लैट ब्लॉक।

दूसरा ब्लॉक न जोड़ें जब एक में पहले से ही `README.md` सूचीबद्ध हो।

<a id="step-2-add-the-language-list"></a>
## चरण 2: भाषा सूची जोड़ें

इस पंक्ति को `README.md` में रखें, जहाँ पाठकों को अन्य भाषाएँ दिखनी चाहिए। इसके ऊपर की पंक्ति पर एक छोटा लेबल सामान्य गद्य है और इसका अनुवाद किया जाएगा।

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

लाइन खाली हो सकती है। `translate-docs` शुरुआती मार्कर से लेकर समापन मार्कर तक सब कुछ प्रति लोकेल एक लिंक के साथ बदल देता है। फेंस्ड कोड ब्लॉक के अंदर के मार्कर अनदेखा किए जाते हैं, इसलिए उसी फ़ाइल में एक कॉन्फ़िग नमूना मेल नहीं खाता। विवरण: [Language switcher](/hi/guide/documents/language-switcher)।

<a id="step-3-more-than-the-readme"></a>
## चरण 3: README से अधिक

`contentPaths` में पाथ जोड़ें। `flatPreserveRelativeDir` फ़ोल्डर रखता है, इसलिए `docs/guide.md` दूसरे `guide.md` से टकराने के बजाय `translated-docs/docs/guide.de.md` बन जाता है।

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

एक `.translate-ignore` फ़ाइल उन पाथ को छोड़ देती है जिन्हें आप अनुवादित नहीं करना चाहते हैं। `init --with-translate-ignore` एक स्टार्टर लिखता है। कोड फ़ेंस, URL और हेडिंग एंकर का अनुवाद नहीं किया जाता है। [Output layouts](/hi/guide/documents/output-layouts), [Anchor links](/hi/guide/documents/anchor-links), और [Link rewriting](/hi/guide/documents/link-rewriting) देखें।

ऐसी स्क्रीनशॉट जो भाषा के अनुसार भिन्न हों: [छवियाँ और स्क्रीनशॉट](/hi/guide/images-and-screenshots/)।

<a id="step-4-links-on-the-host"></a>
## चरण 4: होस्ट पर लिंक

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

यह अंतिम मैन्युअल चरण है। [मॉडल चुनें और अनुवाद करें](#choose-models-and-translate) पर जारी रखें।

<a id="not-your-case"></a>
## आपका मामला नहीं?

| आपके पास | पढ़ें |
| --- | --- |
| ऐप UI स्ट्रिंग और अनुवाद करने के लिए कोई README नहीं | [एक JS/TS ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-js) या [एक Python ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-python) |
| Django, Flask-Babel कैटलॉग, या एक ऐप जो पहले से ही GNU gettext का उपयोग करता है | [Django / Python gettext ऐप में i18n जोड़ें](/hi/guide/add-i18n-to-django-gettext) |
| एक VitePress, Docusaurus, Starlight, Nextra, Fumadocs, या Astro साइट | [एक वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website)। `--with-readme` जोड़ें जब रिपॉजिटरी README का भी अनुवाद किया जाना चाहिए |
| प्रति लोकले एक HTML फ़ाइल | [HTML पेज](/hi/guide/documents/html-pages) |
| पूर्ण `translate-docs` संदर्भ | [दस्तावेज़](/hi/guide/documents/) |

<a id="examples"></a>
## उदाहरण

| प्रोजेक्ट | यह क्या दिखाता है |
| --- | --- |
| [कंसोल-ऐप](/hi/examples#console-app) | एक छोटा नोड ऐप और एक फ्लैट README ब्लॉक |
| [नेक्स्टजेएस-ऐप](/hi/examples#nextjs-app) | UI स्ट्रिंग, एक डॉक्स साइट, और एक अलग फ्लैट README ब्लॉक |
| यह रिपॉजिटरी | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): फ़्लैट README ब्लॉक, फिर VitePress साइट |
