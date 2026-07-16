<a id="output-layouts"></a>
# आउटपुट लेआउट

`docsOutput.style` नियंत्रित करता है कि अनुवादित मार्कडाउन फ़ाइलें कहाँ लिखी जाती हैं। नीचे दिए गए सटीक स्ट्रिंग मानों का उपयोग `docs[].docsOutput.style` में करें। उपनाम पूर्वनिर्धारित `doc-system` लेआउट (या फुमाडॉक्स डॉट-प्रत्यय लेआउट) हैं, न कि अलग इंजन — कॉन्फ़िग लोडिंग उपनाम `style` मानों को विहित `"doc-system"` में फिर से लिख सकती है, जबकि मूल प्रीसेट को `stylePreset` में संरक्षित करती है।

किसी भी अंतर्निहित लेआउट को ओवरराइड करने के लिए `docs[].docsOutput.pathTemplate` (मार्कडाउन/MDX) या `jsonPathTemplate` (JSON लेबल फ़ाइलें) सेट करें। नीचे [pathTemplate प्लेसहोल्डर](#pathtemplate--jsonpathtemplate-placeholders) देखें।

<a id="layout-overview"></a>
## लेआउट अवलोकन

| `docsOutput.style` | इंजन | विशिष्ट उपयोग |
| --- | --- | --- |
| `"nested"` | स्थानीय फ़ोल्डर पूर्ण स्रोत ट्री को दर्शाता है | डिफ़ॉल्ट; `{outputDir}/{locale}/` के तहत सामान्य i18n आउटपुट |
| `"flat"` | फ़ाइल नाम में स्थानीय प्रत्यय (वैकल्पिक सबडिर) | README, चेंजलॉग, रेपो-रूट डॉक्स, [भाषा स्विचर](/hi/guide/documents/language-switcher) |
| `"doc-system"` | स्थानीय फ़ोल्डर + `docsRoot` के तहत वैकल्पिक `localeSubpath` | कस्टम स्टैटिक-डॉक्स जनरेटर |
| `"docusaurus"` | `doc-system` प्रीसेट | [Docusaurus](/hi/guide/integrations/docusaurus) i18n प्लगइन लेआउट |
| `"astro-starlight"` | `doc-system` प्रीसेट (`localeSubpath: ""`) | [Astro Starlight](/hi/guide/integrations/astro#astro-starlight), सादे Astro स्थानीय पृष्ठ |
| `"vitepress"` | `doc-system` प्रीसेट (`localeSubpath: ""`) | [VitePress](/hi/guide/integrations/vitepress) अंग्रेजी के बगल में स्थानीय फ़ोल्डर |
| `"nextra"` | `doc-system` प्रीसेट (`localeSubpath: ""`) | [Nextra](/hi/guide/integrations/nextra) स्थानीय फ़ोल्डर (`content/en/` → `content/{locale}/`) |
| `"fumadocs"` | डॉट प्रत्यय (डिफ़ॉल्ट) या `doc-system` जब `fumadocsParser: "dir"` | [Fumadocs](/hi/guide/integrations/fumadocs) डॉट या डिर सामग्री लेआउट |

<a id="nested-default"></a>
## `nested` (डिफ़ॉल्ट)

`docsOutput.style = "nested"` (छोड़ने पर डिफ़ॉल्ट) — `{outputDir}/{locale}/` के तहत स्रोत ट्री को दर्शाता है।

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

`docsRoot` के बाहर के पथ (जब सेट हो) उसी नेस्टेड आकार का उपयोग करते हैं।

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"` — अनुवादित फ़ाइलों को `outputDir` के तहत फ़ाइल नाम में एक स्थानीय प्रत्यय के साथ लिखता है। डिफ़ॉल्ट रूप से केवल बेसनाम रखा जाता है (`{outputDir}/{stem}.{locale}{extension}`), इसलिए `docs/guide.md` और `docs/other/guide.md` तब तक टकराएंगे जब तक आप `flatPreserveRelativeDir` को सक्षम नहीं करते।

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

पृष्ठों के बीच सापेक्ष लिंक स्वचालित रूप से फिर से लिखे जाते हैं जब `docsOutput.style = "flat"` (जब तक `rewriteRelativeLinks: false` या एक कस्टम `pathTemplate` सेट न हो)। क्रॉस-पेज `#anchor` हैंडलिंग के लिए [एंकर लिंक](/hi/guide/documents/anchor-links) देखें।

<a id="flat-with-flatpreserverelativedir"></a>
### `flat` के साथ `flatPreserveRelativeDir`

`docsOutput.flatPreserveRelativeDir` को `true` पर सेट करें ताकि `outputDir` के तहत स्रोत सबडायरेक्टरीज़ को रखा जा सके। इसका उपयोग तब करें जब कई मार्कडाउन फ़ाइलों का अनुवाद कर रहे हों जो विभिन्न फ़ोल्डरों में बेसनाम साझा करती हैं, या जब फ्लैट आउटपुट को एक उथले ट्री को प्रतिबिंबित करना चाहिए (उदाहरण के लिए रेपो रूट पर README प्लस `docs/*.md`)।

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

फ्लैट लिंक रीराइटर एसेट यूआरएल के लिए डेप्थ प्रीफिक्स की गणना करते समय प्रति-फ़ाइल आउटपुट पाथ का उपयोग करता है — [लिंक रीराइटिंग](/hi/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir) देखें।

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` — स्थिर दस्तावेज़ साइटों के लिए लोकेल-प्रीफिक्स्ड दस्तावेज़ ट्री। `docsRoot` के अंतर्गत फ़ाइलें इसमें लिखी जाती हैं:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docsRoot` के बाहर के पाथ [नेस्टेड](#nested) लेआउट (`{outputDir}/{locale}/{relPath}`) पर वापस आ जाते हैं।

`docs[].docsOutput.docsRoot` को अपने अंग्रेज़ी स्रोत रूट पर सेट करें (जैसे `"docs"`, `"src/content/docs"`, या `"content/en"`)। जब `docsOutput.style = "doc-system"`, तो आपको `localeSubpath` को स्पष्ट रूप से सेट करना होगा (प्रीसेट के लिए नीचे एक उपनाम का उपयोग करें)। जब अनुवादित पृष्ठ सीधे `{outputDir}/{locale}/` (स्टारलाइट-शैली) के अंतर्गत हों तो `localeSubpath: ""` का उपयोग करें।

`docusaurusCatalogDir` से Docusaurus शेल JSON और doc-system प्रीसेट के अंतर्गत अन्य JSON आर्टिफैक्ट्स मार्कडाउन के समान फ़ोल्डर लेआउट का पालन करते हैं। `style: "flat"` के साथ, JSON लेबल फ़ाइलें अभी भी नेस्टेड आकार का उपयोग करती हैं जब तक कि आप `jsonPathTemplate` सेट नहीं करते।

<a id="doc-system-aliases"></a>
## डॉक-सिस्टम उपनाम

**उपनाम** (वही `doc-system` इंजन, प्रीसेट `localeSubpath` और डिफ़ॉल्ट):

- `docsOutput.style = "docusaurus"` — `localeSubpath` डिफ़ॉल्ट रूप से `docusaurus-plugin-content-docs/current` (Docusaurus i18n प्लगइन लेआउट) पर सेट होता है।
- `docsOutput.style = "astro-starlight"` — `localeSubpath` डिफ़ॉल्ट रूप से `""` पर सेट होता है; `localePathLowercase` डिफ़ॉल्ट रूप से `true` पर सेट होता है। `{outputDir}/{locale}/` के अंतर्गत अनुवादित पृष्ठ, [Starlight](https://starlight.astro.build/guides/i18n/) से मेल खाते हैं जब अंग्रेज़ी सामग्री रूट पर रहती है और `outputDir` `docsRoot` के बराबर होता है। सादे Astro लोकेल पृष्ठों के लिए भी उपयोग किया जाता है (`src/pages/index.astro` → `src/pages/{locale}/index.astro`) — [Astro वेबसाइट पृष्ठ](/hi/guide/ui-strings/astro-website#pages-parse-and-replace) देखें।
- `docsOutput.style = "vitepress"` — `doc-system` के समान लेआउट जिसमें खाली `localeSubpath` होता है; BCP-47 लोकेल फ़ोल्डर नाम संरक्षित रहते हैं (`localePathLowercase` डिफ़ॉल्ट रूप से `false` पर सेट होता है)। [VitePress एकीकरण](/hi/guide/integrations/vitepress) देखें।
- `docsOutput.style = "nextra"` — `doc-system` के समान लेआउट जिसमें खाली `localeSubpath` होता है; अंग्रेज़ी स्रोत एक लोकेल फ़ोल्डर के अंतर्गत रहता है (जैसे `content/en/`)। [Nextra एकीकरण](/hi/guide/integrations/nextra) देखें।

Docusaurus प्रीसेट (प्राथमिक दस्तावेज़ पृष्ठ):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

स्टारलाइट प्रीसेट (समान ब्लॉक आकार, अलग पाथ):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

VitePress प्रीसेट (सामग्री रूट पर अंग्रेज़ी, स्रोत के बगल में लोकेल फ़ोल्डर):

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Nextra प्रीसेट (एक लोकेल फ़ोल्डर के अंतर्गत अंग्रेज़ी, लक्ष्यों के लिए सहोदर लोकेल फ़ोल्डर):

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

वैकल्पिक JSON लेबल — `docusaurusCatalogDir` से Docusaurus शेल स्ट्रिंग्स (MDX बॉडी कॉपी नहीं):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

स्टारलाइट कई लोकेल के लिए UI स्ट्रिंग्स भेजता है; वैकल्पिक कस्टम UI ओवरराइड्स आवश्यकता पड़ने पर एक अलग `docs[]` ब्लॉक में `jsonPathTemplate: "{outputDir}/{locale}.json"` के साथ `src/content/i18n/en.json` का उपयोग करते हैं।

VitePress नेविगेशन/साइडबार/फ़ुटर स्ट्रिंग्स मार्कडाउन में नहीं हैं — `docsOutput.vitepressThemeCatalog` को कॉन्फ़िगर करें और **`translate-docs`** के अंदर अनुवाद करें। [VitePress एकीकरण](/hi/guide/integrations/vitepress) देखें।

Nextra थीम डिक्शनरी (`.ts`) और `_meta.ts` साइडबार लेबल मार्कडाउन में नहीं हैं — `docs[].nextraDictionaryPath` और स्वचालित `_meta` संग्रह का उपयोग करें जब `style: "nextra"`, सभी **`translate-docs`** के अंदर। [Nextra एकीकरण](/hi/guide/integrations/nextra) देखें।

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` — `docsOutput.fumadocsParser` के माध्यम से Fumadocs सामग्री लेआउट:

- **`"dot"` (डिफ़ॉल्ट)** — `outputDir` के अंतर्गत अंग्रेज़ी स्रोतों के बगल में फ़ाइल नाम में लोकेल प्रत्यय (लोकेल फ़ोल्डर नहीं)। यह `doc-system` पाथ आकार से अलग है।

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** — नेक्स्ट्रा-शैली के लोकेल फ़ोल्डर; खाली `localeSubpath` के साथ समान `doc-system` इंजन का उपयोग करता है।

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

फ्यूमाडॉक्स यूआई ओवरराइड (`lib/layout.shared.ts`) और `meta.json` साइडबार लेबल मार्कडाउन में नहीं हैं — `docsOutput.fumadocsUiCatalog` और स्वचालित `meta.json` संग्रह का उपयोग करें जब `style: "fumadocs"`, सभी **`translate-docs`** के अंदर हों। [फ्यूमाडॉक्स एकीकरण](/hi/guide/integrations/fumadocs) देखें।

बिल्ट-इन रिलेटिव-लिंक फिक्स से परे लिंक और एसेट यूआरएल रीराइटिंग के लिए, [लिंक रीराइटिंग](/hi/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`) देखें।

अनुवादित पृष्ठों में स्क्रीनशॉट और रास्टर एसेट के लिए, [इमेज और स्क्रीनशॉट](/hi/guide/images-and-screenshots/) देखें।

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` प्लेसहोल्डर

यह निर्धारित करके कि अनुवादित फ़ाइलें कहाँ लिखी जाती हैं, `docs[].docsOutput.pathTemplate` (मार्कडाउन और एमडीएक्स) या `jsonPathTemplate` (JSON लेबल फ़ाइलें) सेट करके ओवरराइड करें। दोनों समान प्लेसहोल्डर स्वीकार करते हैं। हल किए गए पथ उस ब्लॉक के `outputDir` के अंदर रहने चाहिए (CLI उन पथों को अस्वीकार करता है जो इससे बाहर निकलते हैं)।

यदि आप एक कस्टम `pathTemplate` का उपयोग करते हैं, तो `rewriteRelativeLinks` डिफ़ॉल्ट रूप से `false` पर सेट होता है जब तक कि आप इसे स्पष्ट रूप से सेट न करें — रिलेटिव लिंक रीराइटिंग एक कस्टम टेम्पलेट के बिना `docsOutput.style = "flat"` के लिए बनाई गई है।

बिल्ट-इन लेआउट के लिए (`nested`, `flat`, `doc-system` बिना कस्टम टेम्पलेट के), लोअरकेस लोकेल फ़ोल्डर या फ़ाइलनाम सेगमेंट लिखने के लिए `docsOutput.localePathLowercase` को `true` पर सेट करें (जैसे `pt-BR` के बजाय `pt-br`)। `astro-starlight` उपनाम और खाली `localeSubpath` के साथ `doc-system` इसे कॉन्फ़िग लोड पर `true` पर डिफ़ॉल्ट करते हैं। कस्टम `pathTemplate` / `jsonPathTemplate` मान अपरिवर्तित रहते हैं — जब आपको लोअरकेस सेगमेंट की आवश्यकता हो तो वहां `{llocale}` का उपयोग करें जबकि `{locale}` को BCP-47 के रूप में रखें।

| प्लेसहोल्डर            | भूमिका                                                                                                       | उदाहरण                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | इस दस्तावेज़ ब्लॉक के `outputDir` का पूर्ण हल किया गया पथ                                           | `/home/acme/repo/i18n`                                           |
| `{locale}`             | लक्ष्य लोकेल कोड (कॉन्फ़िग / CLI में समान रूप)                                                          | `de`, `pt-BR`                                                    |
| `{LOCALE}`             | समान लोकेल अपरकेस किया गया                                                                                     | `DE`, `PT-BR`                                                    |
| `{llocale}`            | समान लोकेल लोअरकेस किया गया (एस्ट्रो रूट फ़ोल्डरों से मेल खाता है जैसे `pt-br`, `zh-cn`)                               | `de`, `pt-br`                                                    |
| `{relPath}`            | प्रोजेक्ट रूट के सापेक्ष स्रोत फ़ाइल पथ, POSIX `/`                                                   | `docs/guide.md`, `README.md`                                     |
| `{stem}`               | एक्सटेंशन **के बिना** फ़ाइल नाम                                                                            | `docs/guide.md` के लिए `guide`                                      |
| `{basename}`           | एक्सटेंशन **के साथ** फ़ाइल नाम                                                                               | `guide.md`                                                       |
| `{extension}`          | डॉट **सहित** एक्सटेंशन                                                                            | `.md`, `.mdx`                                                    |
| `{docsRoot}`           | `docsOutput.docsRoot` का पूर्ण हल किया गया पथ (यदि छोड़ा गया तो डिफ़ॉल्ट `docs`)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | `{relPath}` एक मिलान `docsRoot` उपसर्ग के साथ हटा दिया गया जब पथ स्ट्रिंग संरेखित होते हैं (POSIX); अन्यथा अपरिवर्तित | `docs/guide.md` (सामान्य); `guide.md` केवल तभी जब स्ट्रिपिंग लागू होती है |

**उदाहरण**

कॉन्फ़िग स्निपेट:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

लोकेल `de` और स्रोत `docs/guide.md` के लिए, प्रोजेक्ट रूट `/home/acme/repo` और `outputDir` के साथ `/home/acme/repo/i18n` पर रिज़ॉल्व होने पर, विस्तारित पाथ है:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

`docsOutput.style = "flat"` और बिना किसी कस्टम `pathTemplate` के साथ, एक सामान्य पैटर्न केवल फ़ाइल नाम को `{stem}` और `{extension}` के माध्यम से रखता है, उदाहरण के लिए `{outputDir}/{stem}.{locale}{extension}`, जो रिज़ॉल्व किए गए `outputDir` के तहत `…/guide.de.md` देता है।
