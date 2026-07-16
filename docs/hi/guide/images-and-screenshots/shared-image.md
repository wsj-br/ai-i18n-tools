<a id="shared-raster"></a>
# साझा रास्टर

तब उपयोग करें जब एक ही छवि सभी लोकेशंस में साझा की जाती है (प्रति-लोकेल भिन्नता नहीं)।

- **`docsOutput.style = "flat"`** — फ़्लैट लिंक रीराइटर प्रति आउटपुट फ़ाइल के लिए गहराई उपसर्ग की गणना करता है, इसलिए स्रोत फ़ाइल के बगल में एक सापेक्ष संपत्ति (जैसे `docs/figure.png` को `figure.png` के रूप में `docs/page.md` से संदर्भित किया गया है) हर अनुवादित आउटपुट में सही ढंग से हल हो जाती है — किसी `postProcessing.regexAdjustments` नियम की आवश्यकता नहीं है। जब स्रोत फ़ाइलें उपनिर्देशिकाओं में रहती हैं, तो `flatPreserveRelativeDir: true` सक्षम करें ताकि आउटपुट पथ स्रोत ट्री को संरक्षित करें (देखें [प्रति-फ़ाइल गहराई उपसर्ग](/hi/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir))।
- **`docsOutput.style = "vitepress"`** (और लिंक नॉर्मलाइज़र के साथ अन्य डॉक-सिस्टम प्रीसेट) — साइट-रूट निरपेक्ष पथ जैसे `/translation-dashboard.png` अपरिवर्तित रहते हैं जब URL हर लोकेल में समान होता है — किसी `regexAdjustments` नियम की आवश्यकता नहीं होती है।

**फ़्लैट उदाहरण:** एक प्रोजेक्ट `docs/guide/quick-start.md` को `translated-docs/docs/guide/quick-start.<locale>.md` में अनुवाद करता है। यह `flatPreserveRelativeDir: true` मानता है ताकि `docs/guide/quick-start.md` `translated-docs/docs/guide/quick-start.<locale>.md` (`translated-docs/quick-start.<locale>.md` नहीं) में आउटपुट हो। एक सहोदर छवि `docs/translation-dashboard.png` को `quick-start.md` से `../translation-dashboard.png` के रूप में संदर्भित किया गया है। रीराइटर आउटपुट फ़ाइल की निर्देशिका से स्रोत निर्देशिका (`../../docs/`) तक प्रति-फ़ाइल उपसर्ग की गणना करता है, जिससे `../../docs/translation-dashboard.png` उत्पन्न होता है। `translated-docs/docs/guide/` से, वह `docs/translation-dashboard.png` पर सही ढंग से हल हो जाता है।

एक `postProcessing` नियम की अभी भी आवश्यकता है जब:
- संपत्ति को **`docsOutput.style = "flat"`** में एक निरपेक्ष URL के माध्यम से संदर्भित किया जाता है (जैसे `/img/figure.png`) — फ़्लैट रीराइटर केवल सापेक्ष पथों को संभालता है
- आप अन्य कारणों से संपत्ति URL को बदलना चाहते हैं (जैसे CDN पर स्विच करना)

<a id="implementation-example"></a>
### कार्यान्वयन उदाहरण

इस रिपॉजिटरी के अपने डॉक्स साझा छवियों के निरपेक्ष-URL संस्करण का उपयोग करते हैं: [अनुवाद डैशबोर्ड गाइड](/hi/guide/translation-dashboard/) अपने स्क्रीनशॉट को `![Translation Dashboard](/translation-dashboard.png)` के रूप में संदर्भित करता है — [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png) से परोसा गया एक निरपेक्ष, साइट-रूट पथ। क्योंकि URL हर लोकेल के लिए समान है, किसी `postProcessing.regexAdjustments` नियम की आवश्यकता नहीं है।
