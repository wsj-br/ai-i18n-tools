<a id="fumadocs-integration"></a>
# फुमाडॉक्स एकीकरण

Next.js ऐप राउटर पर [फुमाडॉक्स](https://www.fumadocs.dev/) 4 दस्तावेज़ साइटों के लिए `init -t ui-fumadocs` और `docsOutput.style: "fumadocs"` का उपयोग करें। प्रीसेट एक खाली `localeSubpath` और संरक्षित BCP-47 या लघु लोकेल कोड (`localePathLowercase` डिफ़ॉल्ट रूप से `false` पर सेट है) के साथ `doc-system` के लिए एक उपनाम है।

[दस्तावेज़](/hi/guide/documents/) और चलाने योग्य [उदाहरण/फुमाडॉक्स-डॉक्स](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) डेमो (डॉट पार्सर, पोर्ट 3080) भी देखें।

<a id="quick-start"></a>
## त्वरित शुरुआत

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
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

<a id="enable-i18n-in-an-existing-site"></a>
### किसी मौजूदा साइट में i18n सक्षम करें

एक अंग्रेज़ी-मात्र Fumadocs ऐप को एक स्थानीय मार्ग (locale route) और `defineI18n` की आवश्यकता होती है, इससे पहले कि `translate-docs` सिबलिंग फ़ाइलें लिख सके। पहली बार सेटअप [किसी वेबसाइट या डॉक्स साइट में i18n जोड़ें](/hi/guide/add-i18n-to-website#run-the-agent-prompt) पर दिए गए प्रॉम्प्ट का उपयोग करता है। इस पृष्ठ पर [एजेंट प्रॉम्प्ट](#agent-prompt) वह अनुवर्ती कार्रवाई है जो UI कैटलॉग को जोड़ती है। चेकलिस्ट:

- `languages`, `defaultLanguage`, और `parser: "dot"` या `"dir"` के साथ `lib/i18n.ts` में `defineI18n`।
- `proxy.ts` (उदाहरण की फ़ाइल) से `app/[lang]/` रूट और `createI18nMiddleware`।
- `lib/layout.shared.ts` में `i18n.translations()`, जिसे `i18nProvider` को पास किया गया है।
- कलेक्शन रूट (डॉट) पर या `content/docs/en/` (डिर) के तहत अंग्रेजी MDX।
- `targetLocales` डिफ़ॉल्ट भाषा को छोड़कर `languages` के बराबर, फिर `sync`।

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

Fumadocs साइडबार संरचना और शीर्षकों के लिए JSON `meta.json` फ़ाइलों का उपयोग करता है। जब `docsOutput.style` `"fumadocs"` होता है, तो `translate-docs`, `docsRoot` (या `docs[].fumadocsMetaGlob`) के तहत `meta.json` एकत्र करता है, `docs[].fumadocsMetaTranslatableKeys` में सूचीबद्ध कुंजियों (keys) के लिए स्ट्रिंग मानों का अनुवाद करता है (डिफ़ॉल्ट: `title`, `description`), और स्थानीय आउटपुट लिखता है:

| पार्सर | स्रोत लोकल | आउटपुट |
|--------|----------------|--------|
| **डॉट** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

`pages` स्लग सरणियों, `root`, `icon`, `defaultOpen`, या अन्य संरचनात्मक कुंजियों का अनुवाद **न करें** — केवल मानव-पठनीय लेबल का।

<a id="ui-catalog"></a>
## UI कैटलॉग

Fumadocs लेआउट क्रोम (खोज प्लेसहोल्डर, स्थानीय प्रदर्शन नाम, और `lib/layout.shared.ts` में अन्य `defineTranslations` / `i18n.translations()` ओवरराइड) मार्कडाउन से नहीं निकाला जाता है। `docsOutput.fumadocsUiCatalog` को कॉन्फ़िगर करें ताकि `translate-docs`, `sourcePath` से स्रोत-स्थानीय कैटलॉग को बूटस्ट्रैप करे और प्रति-स्थानीय JSON का अनुवाद करे:

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

- `catalogPath` — अंग्रेज़ी फ़्लैट JSON। बूटस्ट्रैप `sourcePath` में `.add({ … })` के केवल `en` ऑब्जेक्ट को पढ़ता है। उस ऑब्जेक्ट में स्ट्रिंग लिटरल कैटलॉग कुंजियाँ (`displayName`, `Search(search trigger)`) बन जाते हैं। `.add()` केवल उन कुंजियों को स्वीकार करता है जिन्हें Fumadocs UI प्रीसेट ने पंजीकृत किया है, इसलिए `site.title` जैसा नेविगेशन शीर्षक वहाँ नहीं रह सकता। उदाहरण JSON में `site.title` रखता है और `nav.title` के लिए `catalog["site.title"]` पढ़ता है। फ़ाइल में पहले से मौजूद लेकिन `en` ऑब्जेक्ट में अनुपस्थित कुंजियाँ बनी रहती हैं: विलय `{ ...existing, ...extracted }` है। जब अंग्रेज़ी लिटरल बदलते हैं तो `sync` को फिर से चलाएँ।
- `outputPathTemplate` (वैकल्पिक) — प्रति-स्थानीय आउटपुट; डिफ़ॉल्ट: `catalogPath` के बगल में `ui.{locale}.json`।

एक अनुवादित कुंजी तब तक कुछ नहीं करती जब तक ऐप उसे पढ़ नहीं लेता। `i18n.translations().get(lang)` केवल `.extend()` (फुमाडॉक्स UI प्रीसेट) के साथ पंजीकृत कुंजियों को लौटाता है। लोकल कैटलॉग को `.add()` में फैलाएँ ताकि वे कुंजियाँ लागू हों, और मूल `displayName` को स्प्रेड के **बाद** रखें ताकि अंग्रेजी नाम का अनुवाद उसे प्रतिस्थापित न करे:

```ts
"pt-BR": {
  ...loadUiCatalog("pt-BR"),
  displayName: "Português (Brasil)",
},
```

`site.title` फुमाडॉक्स UI कुंजी नहीं है। उदाहरण इसे `nav.title` के लिए कैटलॉग से पढ़ता है। एक खोज लेबल जो केवल `ui.pt-BR.json` में मौजूद है, बिल्ट-इन प्रीसेट पर तब तक रहता है जब तक वह स्प्रेड (या कोई अन्य रीड) उसका उपयोग नहीं करता।

[examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts) देखें।

मानक लोकेल को LLM लागत के बिना `@fumadocs/language/*` प्रीसेट द्वारा कवर किया जा सकता है; कैटलॉग केवल अंग्रेजी ब्लॉक में **प्रोजेक्ट ओवरराइड** का अनुवाद करता है।

<a id="agent-prompt"></a>
## एजेंट प्रॉम्प्ट

इसे कॉपी करें जब एक अंग्रेजी-मात्र फुमाडॉक्स साइट को लोकल प्राप्त करने हों। यह रूटिंग और UI कैटलॉग को जोड़ता है। यह स्ट्रिंग का अनुवाद नहीं करता है।

<details class="agent-prompt">
<summary>UI कैटलॉग प्रॉम्प्ट</summary>

````markdown
# Enable Fumadocs i18n and the UI catalog

## Context

ai-i18n-tools translates Fumadocs MDX, `meta.json` titles, and the English block
of `i18n.translations().add({ en: { … } })` via `translate-docs` and
`docsOutput.fumadocsUiCatalog`. The literal in that `en` object is the source
string. Locale JSON takes effect only for keys the app reads: either a catalog
spread into `.add()` for registered UI keys, or a direct read such as
`catalog["site.title"]` for the nav title. Do not translate any string.

Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs

## Scope

Edit `lib/i18n.ts`, `lib/layout.shared.ts`, `proxy.ts`, `app/[lang]/` routes,
and `ai-i18n-tools.config.json`. Skip URLs, slugs, and native language names
(`displayName` on each locale entry).

## Call shape

- `defineI18n({ languages, defaultLanguage, parser })`. Use `"dot"` unless the
  project already keeps English under a locale folder (`"dir"`).
- `export default createI18nMiddleware(i18n)` from `proxy.ts`.
- Move pages under `app/[lang]/…` and pass `lang` into `baseOptions` and
  `i18nProvider(translations, lang)`.
- In `lib/layout.shared.ts`, keep English UI overrides as string literals inside
  `.add({ en: { … } })`. For each other locale, spread `loadUiCatalog(locale)`
  and then set `displayName` to the native name.
- Config: `features.translateDocs`, `docsOutput.style: "fumadocs"`,
  `fumadocsParser` matching `defineI18n`, and `fumadocsUiCatalog.sourcePath`
  pointing at `lib/layout.shared.ts`. `targetLocales` must equal `languages`
  except the default language, character for character.

## Order

1. Routing and `defineI18n`.
2. English literals in the `en` block, and the catalog spread for other locales.
3. Ask the user to run `sync`. Do not hand-write `ui.<locale>.json` or
   translated MDX.

## Do not

- Do not translate, rename, or reword the English literals.
- Do not put native language names only in the `en` block (they would be
  extracted and translated).
- Do not hand-edit locale JSON, `meta.<locale>.json`, or locale MDX.
- Do not use `json[]` for this catalog.

## Verify

- `pnpm build` passes.
- The default locale still shows the English overrides.
- After `sync`, one other locale shows the translated search trigger and nav
  title, and `displayName` in the language menu is still the native name.

## Report back

List files changed, each key you added to the `en` block, each key you left
unread (and so unused) with a one-line reason, and whether the parser is `dot`
or `dir`.
````

</details>

फ्यूमाडॉक्स UI स्ट्रिंग्स के लिए `json[]` का उपयोग **न करें** — वह पाइपलाइन असंबंधित ऐप लोकेल बंडलों के लिए है।

<a id="link-conventions"></a>
## लिंक कन्वेंशन

फ्यूमाडॉक्स Next.js मिडलवेयर (`/docs/getting-started`, `/pt/docs/getting-started`) के माध्यम से लोकेल-प्रीफिक्स्ड रूट प्रदान करता है। **इन-पेज लिंक लोकेल-न्यूट्रल रहने चाहिए** (`/docs/getting-started`) ताकि सक्रिय लोकेल प्रीफिक्स स्वचालित रूप से लागू हो।

अंतर्निहित नॉर्मलाइज़र सक्षम करें ताकि `translate-docs` हर अनुवादित फ़ाइल में लिंक को स्वचालित रूप से ठीक कर दे:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

जब `style` `"fumadocs"` हो तो `rewriteFumadocsLinks` डिफ़ॉल्ट रूप से सक्षम होता है।

| स्रोत स्थानीय में लेखक | नॉर्मलाइज़र के बाद |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/hi/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | अपरिवर्तित (पूरा URL) |

**लेखन नियम**

- क्रॉस-पेज डॉक लिंक: अंग्रेज़ी MDX में **स्थानीय-तटस्थ साइट मार्गों** (`/docs/…`) का उपयोग करें, या `content/docs/…` / सापेक्ष `.mdx` पथों का उपयोग करें और नॉर्मलाइज़र को `sync` के दौरान उन्हें फिर से लिखने दें।
- सामग्री ट्री के बाहर रेपो फ़ाइलें: **पूर्ण URL** का उपयोग करें।
- स्थानीय-प्रत्यय वाली प्रतियों (`*.pt.mdx`) या `content/{locale}/` ट्री में लिंक को मैन्युअल रूप से संपादित **न करें** — `sync` / `translate-docs` के साथ पुनर्जीवित करें।

यह भी देखें [दस्तावेज़ — लिंक पुनर्लेखन](/hi/guide/documents/link-rewriting) और [कॉन्फ़िगरेशन — `docsOutput`](/hi/reference/configuration#docsoutput)।

<a id="locale-codes"></a>
## लोकेल कोड

अपने Fumadocs ऐप में `ai-i18n-tools.config.json` में `targetLocales` को `defineI18n().languages` के साथ **ठीक से** संरेखित रखें। डॉट उदाहरण शॉर्ट कोड (`pt`, `zh`) का उपयोग करता है; dir कॉन्फ़िग BCP-47 फ़ोल्डरों (`pt-BR`, `zh-Hans`) का उपयोग कर सकते हैं। कोई जबरन सामान्यीकरण नहीं है — बेमेल कोड गलत आउटपुट पथ या गुम पृष्ठ उत्पन्न करते हैं।

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
