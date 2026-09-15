<a id="svg-troubleshooting"></a>
# SVG समस्या निवारण

यह भी देखें [छवियाँ और स्क्रीनशॉट समस्या निवारण](/hi/guide/images-and-screenshots/troubleshooting)।

- **एक ही डायरेक्टरी में SVG सोर्स और आउटपुट** — `svg.sourcePath` और `svg.outputDir` को अलग रखें।
- **कोलोकेटेड (colocated) SVGs के लिए एब्सोल्यूट Docusaurus स्टैटिक URLs** — शुरुआत से ही रिलेटिव `../assets/` पाथ का उपयोग करें।
- **ट्रांसलेशन के बाद अनपेक्षित क्लोजिंग टैग `text` बनाम `g`** — Inkscape अक्सर वास्तविक लेबल के बगल में खाली सेल्फ-क्लोजिंग `<text … />` उत्सर्जित करता है। पुराने एक्सट्रैक्टर regexes उन्हें अगली `</text>` तक फैला देते थे और एक भटका हुआ क्लोजर लिख देते थे। लोकैले SVG को फिर से जेनरेट करने के लिए `translate-svg` (या `sync`) को अपग्रेड करें और फिर से चलाएं।
- **Hindi, Arabic, CJK, या Cyrillic SVGs में रोमनयुक्त या केवल Latin लेबल** — दस्तावेजों की तरह ही समान राइटिंग-सिस्टम पॉलिसी लागू होती है; गलत-स्क्रिप्ट कैश रो (cache rows) को अगली `translate-svg` / `sync` पर रिजेक्ट कर दिया जाता है। केवल तभी नहीं जब सभी मॉडल विफल हो जाएं, बल्कि **प्रत्येक** खारिज किए गए मॉडल (प्रॉम्प्ट, रॉ आउटपुट, स्क्रिप्ट एरर) के लिए `cacheDir` के तहत `FAILED-TRANSLATION` लॉग लिखने के लिए ग्लोबल `--debug-failed` के साथ फिर से चलाएं। देखें [Hindi, Arabic, CJK, or Cyrillic output is romanized](/hi/guide/documents/troubleshooting#wrong-script-or-romanized-output)।
