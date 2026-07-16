<a id="quick-start"></a>
# त्वरित शुरुआत

डिफ़ॉल्ट `init` टेम्पलेट (`ui-markdown`) केवल **UI** निष्कर्षण और अनुवाद को सक्षम करता है। `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, और `ui-fumadocs` टेम्पलेट **दस्तावेज़** अनुवाद (`translate-docs`) को सक्षम करते हैं; `ui-vitepress` VitePress थीम स्ट्रिंग्स के लिए `docsOutput.vitepressThemeCatalog` को भी स्कैफोल्ड करता है, `ui-nextra` Nextra थीम डिक्शनरी के लिए `docs[].nextraDictionaryPath` को स्कैफोल्ड करता है (साइडबार `_meta.ts` स्वचालित रूप से एकत्र किया जाता है), और `ui-fumadocs` Fumadocs UI ओवरराइड के लिए `docsOutput.fumadocsUiCatalog` को स्कैफोल्ड करता है (साइडबार `meta.json` स्वचालित रूप से एकत्र किया जाता है)। `ui-astro-website` टेम्पलेट सादे Astro ऐप्स (`.astro` फ़ाइलों सहित) के लिए **UI** निष्कर्षण को स्कैफोल्ड करता है; जब आप `.astro` पेज HTML के लिए `translate-docs` भी चाहते हैं तो एक `docs[]` ब्लॉक जोड़ें (देखें [Astro वेबसाइट पेज (पार्स-और-बदलें)](/hi/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace))। संदर्भ [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) **दोनों** पाइपलाइन का उपयोग करता है। जब आप एक कमांड चाहते हैं जो आपके कॉन्फ़िग के अनुसार निष्कर्षण, UI अनुवाद, वैकल्पिक SVG फ़ाइल अनुवाद, और दस्तावेज़ अनुवाद चलाता है तो `sync` का उपयोग करें।

<a id="runnable-examples"></a>
### चलाने योग्य उदाहरण

नौ चलाने योग्य प्रोजेक्ट और फिक्स्चर [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) के अंतर्गत रहते हैं। [उदाहरण](/hi/examples) कैटलॉग देखें (कंसोल ऐप, Next.js + Docusaurus, Astro वेबसाइट, Astro Starlight डॉक्स, VitePress डॉक्स, Nextra डॉक्स, Fumadocs डॉक्स, मल्टी-प्रोवाइडर तुलना, मार्कडाउन स्ट्रेस टेस्ट)।

**एक उदाहरण को अकेले चलाएँ** (पूरे मोनोरिपो को क्लोन किए बिना):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

`console-app` को किसी भी उदाहरण फ़ोल्डर नाम से बदलें। प्रत्येक उदाहरण `"ai-i18n-tools": "^1.7.2"` घोषित करता है और npm से CLI स्थापित करता है। प्रति-उदाहरण READMEs में फ़ोल्डर नाम भरा हुआ वही स्निपेट शामिल होता है।

**पूरे ai-i18n-tools रिपॉजिटरी से** — यदि आपने पूरा रिपो क्लोन किया है (केवल degit के साथ एक उदाहरण फ़ोल्डर नहीं):

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

कार्यस्थान [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) प्रविष्टि (`ai-i18n-tools: workspace:*`) कार्यस्थान उदाहरणों को आपके स्थानीय चेकआउट से स्वचालित रूप से लिंक करती है। स्टैंडअलोन फिक्स्चर (`multi-provider`, `test-markdown`) कार्यस्थान पैकेज नहीं हैं — उनके फ़ोल्डर से `node ../../bin/ai-i18n-tools.mjs …` का उपयोग करें। **रिपॉजिटरी रूट** (इस पैकेज के अपने डॉक्स/i18n) से CLI चलाने के लिए, `pnpm i18n:sync` या `node bin/ai-i18n-tools.mjs …` का उपयोग करें — [स्थापना — क्लोन किया गया मोनोरिपो](/hi/guide/installation#cloned-monorepo) और [विकास गाइड](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) देखें।

<a id="provider-and-api-key-required-for-translation"></a>
### प्रदाता और API कुंजी (अनुवाद के लिए आवश्यक)

LLM को कॉल करने वाला हर कमांड — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, और `sync` — को **दोनों** की आवश्यकता होती है:

1. `ai-i18n-tools.config.json` में **कम से कम एक प्रदाता**: `translationModels` के साथ एक `providers.<name>` ब्लॉक, और जब एक से अधिक प्रदाता कॉन्फ़िगर किए गए हों तो एक शीर्ष-स्तरीय `provider` कुंजी। `init` एक डिफ़ॉल्ट प्रदाता ब्लॉक को स्कैफोल्ड करता है (`openrouter` जब तक आप `-P <provider>` पास नहीं करते); प्रीसेट स्विच करें, प्रदाता जोड़ें, या मॉडल सूचियों को ट्यून करें — [LLM प्रदाता और मॉडल](/hi/guide/providers-and-models) देखें।
2. आपके वातावरण में या एक प्रोजेक्ट-रूट `.env` फ़ाइल में **मिलान करने वाली API कुंजी**। प्रत्येक अंतर्निहित प्रीसेट [प्रीसेट तालिका](/hi/guide/providers-and-models#built-in-providers) से एक नामित env var पढ़ता है (उदाहरण के लिए डिफ़ॉल्ट के लिए `OPENROUTER_API_KEY`, या जब आप `-P anthropic` के साथ स्कैफोल्ड करते हैं तो `ANTHROPIC_API_KEY`); **Ollama** अपवाद है — यह एक स्थानीय एंडपॉइंट का उपयोग करता है और इसे किसी कुंजी की आवश्यकता नहीं होती है। [स्थापना — अपनी प्रदाता API कुंजी सेट करें](/hi/guide/installation#using-the-cli) देखें।

`extract`, `status`, और अन्य कमांड जो LLM को कॉल नहीं करते हैं, उन्हें प्रदाता या API कुंजी की आवश्यकता नहीं होती है।

<a id="core-cli-commands"></a>
### कोर CLI कमांड

`ai-i18n-tools` स्थापित करने और [बेयर कमांड के लिए अपनी शेल कॉन्फ़िगर करने](/hi/guide/installation#using-the-cli) के बाद अपने **प्रोजेक्ट रूट** से चलाएँ। नीचे दिए गए उदाहरण सीधे `ai-i18n-tools` का उपयोग करते हैं।

```bash
# Set the API key for your active provider (see preset table; skip for local Ollama)
# Default init uses openrouter:
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Or scaffold another preset at init, e.g. anthropic:
# export ANTHROPIC_API_KEY=sk-ant-your-key-here

# UI strings (default template enables extract + translate-ui)
ai-i18n-tools init [-P <provider>]    # default: openrouter
ai-i18n-tools init -P anthropic
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight [-P <provider>]
# VitePress docs: ai-i18n-tools init -t ui-vitepress [-P <provider>]
# Nextra docs: ai-i18n-tools init -t ui-nextra [-P <provider>]
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs [-P <provider>]
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website [-P <provider>]
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles [-P <provider>]
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### अनुशंसित `package.json` स्क्रिप्ट

स्थानीय रूप से स्थापित पैकेज के साथ, `package.json` स्क्रिप्ट बिना अतिरिक्त शेल सेटअप के `node_modules/.bin` से `ai-i18n-tools` को हल करती हैं। इंटरैक्टिव शेल्स के लिए, पहले PATH कॉन्फ़िगर करें — [CLI का उपयोग करना](/hi/guide/installation#using-the-cli) देखें।

किसी भी चीज़ के लिए `sync` को **पसंद करें** जो पहले “`translate-ui` चलाएँ, फिर `translate-svg`, फिर `translate-docs`, फिर `translate-json`” हुआ करती थी: `ai-i18n-tools sync` आपकी कॉन्फ़िग के अनुसार **निकालें** (जब सक्षम हो), **UI अनुवाद करें**, वैकल्पिक **SVG अनुवाद करें**, **डॉक्स अनुवाद करें**, फिर वैकल्पिक **JSON अनुवाद करें** — सही क्रम में और साझा फ़्लैग के साथ चलाता है। उन चरणों को हाथ से चेन करना गलत हो सकता है (क्रम, निकालना, लोकेल फ़्लैग)। `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs`, और `i18n:translate:json` का उपयोग तभी करें जब आपको अलगाव में **एकल** चरण की आवश्यकता हो।

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**सुझाव:** यदि आप CLI आउटपुट और डैशबोर्ड को किसी अन्य भाषा में चाहते हैं, तो `-L <code>` पास करें या `AI_I18N_LANG` सेट करें — [टूल UI भाषा](/hi/guide/tool-ui-language) देखें।

<a id="combined-sync"></a>
## संयुक्त सिंक

UI स्ट्रिंग और दस्तावेज़ों को एक साथ चलाने के लिए एक ही कॉन्फ़िग में सभी सुविधाओं को सक्षम करें:

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
    "uiGlossary": "src/locales/strings.json",
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

`glossary.uiGlossary` दस्तावेज़ अनुवाद को UI के समान `strings.json` कैटलॉग पर इंगित करता है ताकि शब्दावली सुसंगत रहे; `glossary.userGlossary` उत्पाद शर्तों के लिए CSV ओवरराइड जोड़ता है।

एक पाइपलाइन चलाने के लिए `ai-i18n-tools sync` चलाएँ: जब `features.translateUIStrings` सक्षम हो, तो UI स्ट्रिंग को **निकालें** और फिर **अनुवादित करें**; वैकल्पिक **SVG का अनुवाद करें** (`features.translateSVG` + `svg` ब्लॉक); **दस्तावेज़ों का अनुवाद करें** (`docs[]` जैसा कॉन्फ़िगर किया गया है); फिर वैकल्पिक **translate-json** (`features.translateJson` + `json[]`)। `--no-ui`, `--no-svg`, `--no-docs`, या `--no-json` वाले हिस्सों को छोड़ दें। दस्तावेज़ और `json[]` चरण `--dry-run`, `-p` / `--path`, `--force`, और `--force-update` स्वीकार करते हैं (जब `--no-docs` हो तो केवल दस्तावेज़ों के फ़्लैग को अनदेखा किया जाता है; जब `--no-json` सेट नहीं होता है तो JSON समान कैश फ़्लैग का उपयोग करता है)।

उस ब्लॉक की फ़ाइलों को UI की तुलना में **छोटे उपसमूह** में अनुवाद करने के लिए एक ब्लॉक पर `docs[].targetLocales` का उपयोग करें (प्रभावी दस्तावेज़ लोकेल ब्लॉक में **यूनियन** हैं):

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

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>
### मिश्रित दस्तावेज़ कॉन्फ़िग (`docsOutput.style = "docusaurus"` + `"flat"`)

आप `docs` में एक से अधिक प्रविष्टियाँ जोड़कर एक ही कॉन्फ़िग में कई दस्तावेज़ पाइपलाइन को जोड़ सकते हैं। यह एक सामान्य सेटअप है जब किसी प्रोजेक्ट में Docusaurus साइट (`docsOutput.style = "docusaurus"`) के साथ-साथ रूट-लेवल मार्कडाउन फ़ाइलें (उदाहरण के लिए, `docsOutput.style = "flat"` के साथ एक रिपॉजिटरी README) होती हैं जिन्हें लोकेल-सफ़िक्स किए गए फ़ाइलनामों के साथ अनुवादित किया जाना चाहिए।

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

- UI स्ट्रिंग `src/` से `public/locales/` में निकाली/अनुवादित की जाती हैं।
- पहला डॉक्स ब्लॉक `docs-site/docs/` से `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` में **मार्कडाउन** का अनुवाद करता है (स्थानीयकृत दस्तावेज़ पृष्ठ)।
- `docs[].docusaurusCatalogDir` सेट होने और `features.translateDocs` सक्षम होने पर, वही ब्लॉक `docs-site/i18n/en/` के तहत **Docusaurus शेल JSON** को प्रत्येक लक्ष्य लोकेल फ़ोल्डर में भी अनुवादित करता है — नेविगेशन बार, फ़ूटर, और थीम/प्लगइन कैटलॉग, MDX बॉडी कॉपी नहीं।
- दूसरा डॉक्स ब्लॉक `README.md` को `translated-docs/` के तहत लोकेल-सफ़िक्स किए गए फ़ाइलों में अनुवादित करता है (`docsOutput.style = "flat"`)।
- सभी डॉक्स ब्लॉक `cacheDir` साझा करते हैं, इसलिए API कॉल और लागत को कम करने के लिए अपरिवर्तित सेगमेंट को रन में पुन: उपयोग किया जाता है।
