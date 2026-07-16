<a id="fumadocs-integration"></a>
# फुमाडॉक्स एकीकरण

Next.js ऐप राउटर पर [फुमाडॉक्स](https://www.fumadocs.dev/) 4 दस्तावेज़ साइटों के लिए `init -t ui-fumadocs` और `docsOutput.style: "fumadocs"` का उपयोग करें। प्रीसेट एक खाली `localeSubpath` और संरक्षित BCP-47 या लघु लोकेल कोड (`localePathLowercase` डिफ़ॉल्ट रूप से `false` पर सेट है) के साथ `doc-system` के लिए एक उपनाम है।

[दस्तावेज़](/hi/guide/documents/) और चलाने योग्य [उदाहरण/फुमाडॉक्स-डॉक्स](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) डेमो (डॉट पार्सर, पोर्ट 3080) भी देखें।

<a id="quick-start"></a>
## त्वरित शुरुआत

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

जब आप पृष्ठ सामग्री, `meta.json` साइडबार लेबल, और फुमाडॉक्स UI ओवरराइड को एक `sync` रन में अनुवादित करते हैं तो `features.translateDocs` सक्षम करें।

<a id="page-layout"></a>
## पेज लेआउट

फुमाडॉक्स `docsOutput.fumadocsParser` के माध्यम से दो i18n सामग्री लेआउट का समर्थन करता है। **डॉट** पार्सर डिफ़ॉल्ट है (फुमाडॉक्स अंतर्निहित और उत्पादन साइटें जैसे [SWR](https://github.com/vercel/swr-site))।

<a id="dot-parser-default"></a>
### डॉट पार्सर (डिफ़ॉल्ट)

अंग्रेजी MDX संग्रह रूट पर रहता है। अनुवादित प्रतियां उसी निर्देशिका में एक लोकेल प्रत्यय का उपयोग करती हैं:

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

`lib/i18n.ts` में `targetLocales` को `defineI18n().languages` के साथ ठीक से संरेखित करें (उदाहरण में लघु कोड `pt` और `zh` का उपयोग किया गया है)।

<a id="dir-parser-nextra-style"></a>
### Dir पार्सर (नेक्स्ट्रा-शैली)

लोकेल फ़ोल्डरों (`content/docs/en/` → `content/docs/pt-BR/`) के आदी टीमों के लिए, `fumadocsParser` को `"dir"` पर सेट करें:

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

कॉपी-पेस्ट dir कॉन्फ़िग के लिए [उदाहरण/फुमाडॉक्स-डॉक्स](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) में `ai-i18n-tools.config.dir.example.json` देखें। मानसिक मॉडल [नेक्स्ट्रा एकीकरण](/hi/guide/integrations/nextra#page-layout) से मेल खाता है।

<a id="sidebar-metajson"></a>
## साइडबार (`meta.json`)

फुमाडॉक्स साइडबार संरचना और शीर्षकों के लिए JSON `meta.json` फ़ाइलों का उपयोग करता है। जब `docsOutput.style` `"fumadocs"` होता है, तो **`translate-docs`** `docsRoot` (या `docs[].fumadocsMetaGlob`) के तहत `meta.json` एकत्र करता है, `docs[].fumadocsMetaTranslatableKeys` (डिफ़ॉल्ट: `title`, `description`) में सूचीबद्ध कुंजियों के लिए स्ट्रिंग मानों का अनुवाद करता है, और लोकेल आउटपुट लिखता है:

| पार्सर | अंग्रेजी स्रोत | आउटपुट |
|--------|----------------|--------|
| **डॉट** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

`pages` स्लग सरणियों, `root`, `icon`, `defaultOpen`, या अन्य संरचनात्मक कुंजियों का अनुवाद **न करें** — केवल मानव-पठनीय लेबल का।

<a id="ui-catalog"></a>
## UI कैटलॉग

फुमाडॉक्स लेआउट क्रोम (खोज प्लेसहोल्डर, लोकेल डिस्प्ले नाम, और `lib/layout.shared.ts` में अन्य `defineTranslations` / `i18n.translations()` ओवरराइड) को मार्कडाउन से नहीं निकाला जाता है। **`docsOutput.fumadocsUiCatalog`** को कॉन्फ़िगर करें ताकि **`translate-docs`** `sourcePath` से अंग्रेजी कैटलॉग को बूटस्ट्रैप करे और प्रति-लोकेल JSON का अनुवाद करे:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — जेनरेटेड अंग्रेजी फ्लैट JSON (बूटस्ट्रैप आउटपुट)। जब `layout.shared.ts` में अंग्रेजी ओवरराइड बदलते हैं तो `sync` को फिर से चलाएँ।
- **`outputPathTemplate`** (वैकल्पिक) — प्रति-लोकेल आउटपुट; डिफ़ॉल्ट: `catalogPath` के बगल में `ui.{locale}.json`।

`layout.shared.ts` में `loadUiCatalog(locale)` के माध्यम से प्रति-लोकेल JSON लोड करें और अपने रूट लेआउट में `i18nProvider(translations, lang)` के साथ मर्ज करें। [उदाहरण/फुमाडॉक्स-डॉक्स/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts) देखें।

मानक लोकेल को LLM लागत के बिना `@fumadocs/language/*` प्रीसेट द्वारा कवर किया जा सकता है; कैटलॉग केवल अंग्रेजी ब्लॉक में **प्रोजेक्ट ओवरराइड** का अनुवाद करता है।

फ्यूमाडॉक्स UI स्ट्रिंग्स के लिए `json[]` का उपयोग **न करें** — वह पाइपलाइन असंबंधित ऐप लोकेल बंडलों के लिए है।

<a id="link-conventions"></a>
## लिंक कन्वेंशन

फ्यूमाडॉक्स Next.js मिडलवेयर (`/docs/getting-started`, `/pt/docs/getting-started`) के माध्यम से लोकेल-प्रीफिक्स्ड रूट प्रदान करता है। **इन-पेज लिंक लोकेल-न्यूट्रल रहने चाहिए** (`/docs/getting-started`) ताकि सक्रिय लोकेल प्रीफिक्स स्वचालित रूप से लागू हो।

बिल्ट-इन नॉर्मलाइज़र को सक्षम करें ताकि `translate-docs` हर अनुवादित फ़ाइल में लिंक को स्वचालित रूप से ठीक कर दे:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

जब `style` `"fumadocs"` हो तो `rewriteFumadocsLinks` डिफ़ॉल्ट रूप से सक्षम होता है।

| अंग्रेजी स्रोत में लेखक | नॉर्मलाइज़र के बाद |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/hi/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | अपरिवर्तित (पूरा URL) |

**लेखन नियम**

- क्रॉस-पेज डॉक लिंक: अंग्रेजी MDX में **लोकेल-न्यूट्रल साइट रूट** (`/docs/…`) का उपयोग करें, या `content/docs/…` / रिलेटिव `.mdx` पाथ का उपयोग करें और नॉर्मलाइज़र को `sync` के दौरान उन्हें फिर से लिखने दें।
- सामग्री ट्री के बाहर रेपो फ़ाइलें: **पूरे URL** का उपयोग करें।
- लोकेल-सफिक्स वाली प्रतियों (`*.pt.mdx`) या `content/{locale}/` ट्री में लिंक को मैन्युअल रूप से संपादित **न करें** — `sync` / `translate-docs` के साथ फिर से जनरेट करें।

यह भी देखें [दस्तावेज़ — लिंक पुनर्लेखन](/hi/guide/documents/link-rewriting) और [कॉन्फ़िगरेशन — `docsOutput`](/hi/reference/configuration#docsoutput)।

<a id="locale-codes"></a>
## लोकेल कोड

अपने फ्यूमाडॉक्स ऐप में `ai-i18n-tools.config.json` में `targetLocales` को `defineI18n().languages` के साथ **ठीक से** संरेखित रखें। डॉट उदाहरण छोटे कोड (`pt`, `zh`) का उपयोग करता है; dir कॉन्फ़िग BCP-47 फ़ोल्डर (`pt-BR`, `zh-Hans`) का उपयोग कर सकते हैं। कोई जबरन सामान्यीकरण नहीं है — बेमेल कोड गलत आउटपुट पाथ या गायब पेज उत्पन्न करते हैं।

<a id="multiple-collections"></a>
## एकाधिक संग्रह

फ्यूमाडॉक्स प्रोजेक्ट `source.config.ts` में कई `defineDocs` ब्लॉक (डॉक्स, ब्लॉग, उदाहरण) को परिभाषित कर सकते हैं। आपके द्वारा अनुवादित प्रत्येक संग्रह के लिए एक `docs[]` ब्लॉक जोड़ें, प्रत्येक अपने स्वयं के `contentPaths`, `outputDir`, और `docsRoot` के साथ।

<a id="example-project"></a>
## उदाहरण प्रोजेक्ट

[उदाहरण/फ्यूमाडॉक्स-डॉक्स](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — `content/docs/` पर अंग्रेजी MDX, कमिटेड `pt` और `zh` डॉट-सफिक्स पेज, `meta.json`, और `lib/i18n/ui.{locale}.json`। पोर्ट **3080** पर `pnpm run dev` चलाएँ।

<a id="cross-references"></a>
## क्रॉस-रेफरेंस

- [कॉन्फ़िगरेशन — `docsOutput`](/hi/reference/configuration#docsoutput)
- [आउटपुट लेआउट](/hi/guide/documents/output-layouts)
- [डॉकुसॉरस एकीकरण](/hi/guide/integrations/docusaurus)
- [नेक्स्ट्रा एकीकरण](/hi/guide/integrations/nextra) (dir पार्सर मानसिक मॉडल)
- [वाइटप्रेस इंटीग्रेशन](/hi/guide/integrations/vitepress) (UI कैटलॉग बूटस्ट्रैप पैटर्न)
