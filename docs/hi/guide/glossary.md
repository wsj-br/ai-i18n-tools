<a id="glossary"></a>
# शब्दावली

शब्दावली यह सुनिश्चित करती है कि सभी अनुवादों में उत्पाद की शब्दावली सुसंगत रहे। उपयोगकर्ता एक या अधिक भाषाओं में किसी शब्द का अनुवाद परिभाषित कर सकते हैं, जिससे एआई मॉडल सर्वोत्तम अनुवाद का अनुमान लगाने के बजाय इस पूर्वनिर्धारित अनुवाद का उपयोग कर सके। इसका उपयोग अन्य भाषाओं में अनुवाद करते समय उत्पाद नामों जैसे विशिष्ट शब्दों को अपरिवर्तित रखने के लिए भी किया जा सकता है।

मॉडल को दो प्रकार के मार्गदर्शन भेजे जाते हैं:

- `glossary.userGlossary` में **शब्द पंक्तियाँ** (और, कुछ पाइपलाइनों के लिए, `glossary.uiGlossary` से मौजूदा UI अनुवाद)। कोई पंक्ति केवल तभी शामिल की जाती है जब वह स्रोत शब्द अनुवाद किए जा रहे पाठ में मौजूद हो।
- `glossary.contextFiles` में **प्रोजेक्ट संदर्भ फ़ाइलें**। पूरा संक्षिप्त विवरण हर UI, दस्तावेज़, JSON, SVG और प्रूफ़रीड प्रॉम्प्ट में डाला जाता है। वह अनुभाग [नीचे](#project-context-files) है।

<a id="how-the-glossary-works"></a>
## शब्दावली कैसे काम करती है

<a id="where-terms-come-from"></a>
### शब्द कहाँ से आते हैं

| स्रोत | कॉन्फ़िग | द्वारा उपयोग |
| --- | --- | --- |
| UI कैटलॉग | `glossary.uiGlossary` — आमतौर पर `ui.stringsJson` जैसा ही पथ | `translate-docs`, `translate-json`, `translate-svg` |
| उपयोगकर्ता CSV | `glossary.userGlossary` | `translate-ui`, `proofread-ui`, `translate-docs`, `translate-json`, `translate-svg` |

`uiGlossary` पहले से `strings.json` में संग्रहीत अनुवादों को संकेत के रूप में पुन: उपयोग करता है, ताकि दस्तावेज़, JSON और SVG UI के साथ संरेखित रहें। `translate-ui` और `proofread-ui` `uiGlossary` को नहीं पढ़ते — वे केवल उपयोगकर्ता CSV से संकेत लेते हैं, ताकि कोई खराब UI अनुवाद पसंदीदा शब्द के रूप में वापस न डाला जाए।

उपयोगकर्ता CSV, UI कैटलॉग पर प्राथमिकता लेता है। जिस पंक्ति का `locale` एक विशिष्ट कोड है, वह उस लोकेल के लिए `*` पंक्ति और UI-कैटलॉग अनुवाद दोनों को बदल देती है। `*` का `locale` हर उस `targetLocales` प्रविष्टि पर वही अनुवाद लागू करता है जिसके पास पहले से UI कैटलॉग से कोई अनुवाद नहीं है।

संक्षिप्त UI-लेबल संक्षिप्ताक्षर (जैसे `Alm.` में अनुगामी बिंदु, या `Size` → `Tam` जैसा छोटा एकल-टोकन संपीड़न) UI अनुवाद के लिए उपलब्ध रहते हैं। दस्तावेज़ प्रॉम्प्ट उन्हें छोड़ देते हैं, ताकि वे मॉडलों को मार्कडाउन या MDX में काल्पनिक <code v-pre>{{…}}</code> टोकन की ओर न धकेलें।

<a id="when-a-term-is-sent"></a>
### जब कोई शब्द भेजा जाता है

मिलान केस-असंवेदी होता है और शब्द सीमा (रिक्त स्थान या विराम चिह्न) पर रुक जाता है। लंबे शब्दों को प्राथमिकता दी जाती है, और अतिव्यापी मिलान हटा दिए जाते हैं। जब कोई शब्द वर्तमान बैच से मेल खाता है, तो प्रॉम्प्ट को `"dashboard" → "Tableau"` जैसा संकेत मिलता है। यदि उस पंक्ति में **संदर्भ** नोट है, तो वह नोट केवल उस मिलान के लिए जोड़ा जाता है।

**संदर्भ** स्रोत-भाषा उपयोग मार्गदर्शन है (शब्द का अर्थ, या उसका उपयोग कैसे करें)। यह अनुवाद नहीं है। **संदर्भ** नोट, या किसी `glossary.contextFiles` सामग्री को बदलने पर, अगले रन पर प्रभावित लोकेल के लिए कैश किए गए अनुवाद ताज़ा हो जाते हैं — आपको `--force` की आवश्यकता नहीं है। केवल पसंदीदा **अनुवाद** बदलने पर मौजूदा कैश तब तक बना रहता है जब तक आप `--force` या `--force-update` पास नहीं करते। डैशबोर्ड में आपके द्वारा संपादित पंक्तियाँ `user-edited` के रूप में रहती हैं।

<a id="force"></a>
### बलपूर्वक

जब **बलपूर्वक** `true`, `yes`, या `1` हो, तो स्रोत शब्द को मॉडल के देखने से पहले पाठ से हटा दिया जाता है और बाद में पसंदीदा अनुवाद वापस लिख दिया जाता है। शब्दांकन सटीक होता है, सुझाव नहीं। वही शब्द-सीमा और सबसे लंबे मिलान के नियम लागू होते हैं। जब मॉडल को अनुवाद पसंद करना चाहिए लेकिन फिर भी उसे विभक्त कर सकता है, तो **बलपूर्वक** को खाली छोड़ें (या `false`)।

<a id="generate-a-glossary"></a>
## शब्दावली जनरेट करें

`glossary-generate` मानक हेडर के साथ एक खाली CSV लिखता है। यह कॉन्फ़िग से `glossary.userGlossary` का उपयोग करता है, या जब वह कुंजी सेट न हो तो `glossary-user.csv` का। यह पहले से मौजूद फ़ाइल को अधिलेखित करने से मना करता है (एक्ज़िट **1**)।

```bash
ai-i18n-tools glossary-generate
# or: ai-i18n-tools glossary-generate -o i18n/glossary.csv
```

कॉन्फ़िग को फ़ाइल पर इंगित करें:

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv"
  }
}
```

आप डैशबोर्ड से सीधे सीएसवी शब्दावली फ़ाइल भी बना सकते हैं। यदि `glossary.userGlossary` निर्दिष्ट है और फ़ाइल पहले से मौजूद नहीं है, तो [शब्दावली](/hi/guide/translation-dashboard/glossary) टैब पर पहली **जोड़ें** कार्रवाई फ़ाइल बना देगी। जब `glossary.autoAddUserEditedToGlossary` का मान `true` (डिफ़ॉल्ट) होता है, तो डैशबोर्ड में किसी यूआई स्ट्रिंग को सुधारने पर अगले `translate-ui` रन के दौरान वह परिवर्तन सीएसवी में जोड़ा जा सकता है। डैशबोर्ड सीएसवी शब्दावली के संपादक के रूप में भी काम करता है, जिससे आप यूआई के भीतर पंक्तियों को जोड़, संपादित या फ़िल्टर कर सकते हैं।

<a id="csv-columns"></a>
## CSV कॉलम

हेडर पंक्ति:

```text
Original language string,locale,Translation,Force,Context
```

`en` या `English`, `Original language string` के बजाय स्वीकार किया जाता है। `Notes`, `Context` के बजाय स्वीकार किया जाता है।

| कॉलम | अर्थ |
| --- | --- |
| **मूल भाषा स्ट्रिंग** | स्रोत लोकेल में स्रोत शब्द या वाक्यांश |
| **लोकेल** | लक्ष्य लोकेल कोड, या हर लक्ष्य के लिए `*` |
| **अनुवाद** | पसंदीदा अनुवाद |
| **फ़ोर्स** | इस शब्दावली को अनिवार्य करने के लिए `true`, `yes`, या `1`; अन्यथा यह एक संकेत है |
| **संदर्भ** | वैकल्पिक स्रोत-भाषा स्पष्टीकरण। यह केवल तभी भेजा जाता है जब यह शब्द मेल खाता है |

<a id="examples"></a>
## उदाहरण

हर लोकेल के लिए एक उत्पाद शब्द, एक अनिवार्य जर्मन लेबल, और एक फ्रेंच पंक्ति जो एक ऐसे शब्द की व्याख्या करती है जिसे मॉडल शाब्दिक रूप से ले सकता है:

```csv
"Original language string","locale","Translation","Force","Context"
"dashboard","*","Tableau","false","The analytics home, not a vehicle panel"
"Save","de","Speichern","true",""
"workspace","fr","espace de travail","false","A user's project container, not an office"
```

एक प्रोजेक्ट ब्रीफ़ के साथ संयुक्त:

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"],
    "contextMaxChars": 12000
  }
}
```

फ़ील्ड संदर्भ: [कॉन्फ़िगरेशन में `glossary`](/hi/reference/configuration#glossary)। कमांड संदर्भ: [`glossary-generate`](/hi/reference/cli-commands/tools#glossary-generate)।

<a id="project-context-files"></a>
## प्रोजेक्ट संदर्भ फ़ाइलें

`glossary.contextFiles` उत्पाद-स्तर के मार्गदर्शन के लिए है जो एक CSV पंक्ति में नहीं आता है: उत्पाद क्या है, यह किसके लिए है, स्वर और वे शब्द जिन्हें गलत अनुवाद करना आसान है। कॉन्फ़िग को एक या अधिक cwd-सापेक्ष `.md` / `.txt` फ़ाइलों पर इंगित करें; उन्हें सूचीबद्ध क्रम में जोड़ा जाता है और हर UI, दस्तावेज़, JSON, SVG और प्रूफरीड प्रॉम्प्ट में इंजेक्ट किया जाता है।

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"]
  }
}
```

संक्षिप्त विवरण **स्रोत स्थान-भाषा** में लिखें, इसे `glossary.contextMaxChars` (डिफ़ॉल्ट `12000`) से काफी कम रखें, और इसे `docs[].contentPaths` के बाहर संग्रहीत करें जब तक कि आप उस फ़ाइल का भी अनुवाद नहीं करना चाहते। [कॉन्फ़िगरेशन में `glossary`](/hi/reference/configuration#glossary) देखें।

<a id="generate-a-context-file-with-an-ai-agent"></a>
### AI एजेंट के साथ संदर्भ फ़ाइल बनाएं

एक एजेंट (कर्सर, क्लाउड कोड, कोपायलट, और इसी तरह) से रेपो पढ़ने और संक्षिप्त विवरण लिखने के लिए कहें। इस तरह का एक प्रॉम्प्ट पेस्ट करें:

```text
Create a translation-context Markdown file for this repository at i18n/product-context.md.

This file is injected verbatim into every ai-i18n-tools translation prompt (UI strings, docs, JSON, SVG, proofread). It must stay in the source language of the project (do not translate it). Translators already receive a glossary of preferred term mappings; this file should explain meaning, audience, and register — not duplicate every glossary row.

Requirements:
- Concise: aim for 1–4 KB, hard limit 8000 characters. No full manuals, README dumps, or changelog history.
- Source-language only. Short headings, bullet lists, and a few example sentences are enough.
- No secrets, API keys, credentials, personal data, internal URLs, or unpublished commercial figures.
- Do not invent product facts. If something is unclear, omit it or mark it as unknown.
- Do not put this file under a path that is also listed in docs[].contentPaths.

Cover, in this order:
1. Product in one paragraph: what it is, who uses it, and the default tone (formal / informal / technical).
2. Domain and disambiguation: terms that look ordinary in English but have a product-specific meaning (for example “dashboard” as an analytics home, not a vehicle panel).
3. Features or areas that change register (billing vs. onboarding vs. admin).
4. Things translators must preserve exactly: brand names, CLI flags, config keys, code identifiers, placeholder tokens.
5. Locale notes only when they affect meaning for every target (for example “use formal you”). Do not list per-locale translations here.

Write only the Markdown file. Afterward, remind me to add it to glossary.contextFiles in ai-i18n-tools.config.json if it is not already listed.
```

अगले `sync` / `translate-*` रन से पहले फ़ाइल की समीक्षा करें। फ़ाइल बदलने से उस रन पर प्रत्येक स्थान-भाषा के लिए कैश किए गए अनुवाद अमान्य हो जाते हैं, इसलिए गुणवत्ता अच्छी होने के बाद संक्षिप्त विवरण को स्थिर रखें।
