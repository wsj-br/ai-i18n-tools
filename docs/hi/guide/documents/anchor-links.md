<a id="anchor-links"></a>
# एंकर लिंक

जब `docsOutput.style = "flat"` होता है, तो आउटपुट प्रत्येक स्थान-विशेष के लिए पृष्ठों के बीच **सापेक्ष पथों** को फिर से लिखता है (`guide.md` → `guide.de.md`)। **एंकर लिंक** — पथ के बाद `#` के साथ सामान्य मार्कडाउन इनलाइन फ़ॉर्म — लक्ष्य फ़ाइल के अंदर एक अनुभाग पर कूदते हैं:

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

यहां लिंक लक्ष्य `setup.md` है, और `#first-run` एंकर है: इसे उस फ़ाइल के अंदर सही शीर्षक पर स्क्रॉल करना चाहिए।

<a id="why-anchor-links-need-attention"></a>
## एंकर लिंक पर ध्यान देने की आवश्यकता क्यों है

- `rewriteRelativeLinks` प्रत्येक स्थान-विशेष के लिए **फ़ाइल नाम** को ठीक करता है (`setup.md` → `setup.de.md`)।
- कई रेंडरर **दृश्यमान शीर्षक टेक्स्ट** से `#` स्लग प्राप्त करते हैं। अनुवाद के बाद, शीर्षक प्रति स्थान-विशेष भिन्न होते हैं, इसलिए एक स्वतः-जनित स्लग बदल सकता है जबकि फिर से लिखा गया लिंक अभी भी `#first-run` कह सकता है — या आपका अंग्रेजी `#…` एंकर अब उस स्लग से मेल नहीं खाता है जिसे रेंडरर अनुवादित शीर्षक से बनाता है।
- परिणाम: पाठक सही **फ़ाइल** पर उतरते हैं लेकिन **गलत लाइन** पर, या ब्राउज़र को कोई मिलान शीर्षक नहीं मिलता है।

<a id="what-to-do"></a>
## क्या करें

<a id="docusaurus-sites-preferred"></a>
### Docusaurus साइटें (पसंदीदा)

[Docusaurus](/hi/guide/integrations/docusaurus) दस्तावेज़ों (`docsOutput.style = "docusaurus"`) पर, `ai-i18n-tools write-heading-ids` के बजाय Docusaurus की मूल शीर्षक ID को प्राथमिकता दें:

1. Docusaurus के `{#…}` प्रत्यय के साथ शीर्षक पंक्ति पर एक स्पष्ट आईडी जोड़ें, जैसे `## TLS configuration {#tls-configuration}`। `translate-docs` के दौरान, केवल दृश्यमान शीर्षक टेक्स्ट का अनुवाद किया जाता है — `{#tls-configuration}` प्रत्यय प्रत्येक स्थान-विशेष में संरक्षित रहता है।
2. Docusaurus प्रोजेक्ट रूट से `docusaurus write-heading-ids` चलाएँ (अक्सर `pnpm run write-heading-ids` जब `package.json` में वायर्ड होता है) उन शीर्षकों पर `{#…}` प्रत्यय जोड़ने या ताज़ा करने के लिए जिनमें वे नहीं हैं। शीर्षकों का नाम बदलने के बाद फिर से चलाएँ ताकि पुराने आईडी वर्तमान शीर्षकों से मेल खाएँ।

अपने मार्कडाउन **एंकर लिंक** को उन स्थिर आईडी पर इंगित करें, जैसे `[label](other.md#tls-configuration)`, जहां खंड `{#…}` प्रत्यय से मेल खाता है — न कि केवल अंग्रेजी शब्दों से अनुमानित स्लग। इस पैटर्न का उपयोग करने वाले प्रतिबद्ध दस्तावेज़ों के लिए [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) देखें।

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### अन्य लेआउट (फ्लैट, स्टारलाइट, वाइटप्रेस, आदि)

जब आप Docusaurus पर नहीं हैं, या आपको `{#…}` प्रत्ययों के बजाय HTML एंकर की आवश्यकता है:

1. `translate-docs` से पहले अपने स्रोत `.md` / `.mdx` पर `ai-i18n-tools write-heading-ids` चलाएँ (सामान्य की तरह ही `docs[]` / `contentPaths`)। यह प्रत्येक शीर्षक से पहले की पंक्ति पर स्पष्ट HTML एंकर सम्मिलित करता है ताकि `id` मान प्रत्येक अनुवादित प्रतिलिपि द्वारा साझा किए जा सकें। शीर्षकों का नाम बदलने के बाद इसे फिर से चलाएँ ताकि पुराने एंकर आईडी वर्तमान शीर्षक से मेल खाने के लिए ताज़ा हो जाएँ।
2. अपने मार्कडाउन **एंकर लिंक** को उन स्थिर आईडी पर इंगित करें, जैसे `[label](other.md#section-id)`, जहां `section-id` उस एंकर से मेल खाता है जिसे टूल ने लिखा है — न कि केवल अंग्रेजी शब्दों से अनुमानित।

<a id="example"></a>
## उदाहरण

<a id="example-docusaurus"></a>
### Docusaurus `{#…}` प्रत्यय

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` (अंग्रेजी स्रोत):

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

`translate-docs` के बाद, लिंक खंड प्रत्येक स्थान-विशेष में `#tls-configuration` रहता है; केवल शीर्षक टेक्स्ट और लिंक लेबल बदलते हैं:

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### HTML एंकर (`write-heading-ids`)

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`write-heading-ids` के बाद `docs/security.md` (सरलीकृत):

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

`translate-docs` के बाद, फ़ाइल पथ और `#…` एंकर प्रत्येक स्थान-विशेष फ़ाइल में संरेखित रहते हैं, उदाहरण के लिए:

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

सभी लोकेल में `#tls-configuration` एंकर समान है क्योंकि `id` स्रोत में निश्चित है; केवल हेडिंग **टेक्स्ट** और लिंक **लेबल** का अनुवाद किया जाता है।

यदि अनुवाद के बाद भी लिंक विफल होते हैं, तो [समस्या निवारण](/hi/guide/documents/troubleshooting) देखें।
