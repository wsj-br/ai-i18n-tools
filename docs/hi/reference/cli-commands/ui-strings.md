<a id="cli--ui-strings"></a>
# सीएलआई — यूआई स्ट्रिंग्स

<a id="extract"></a>
### `extract`

**सारांश:** `ai-i18n-tools extract`

`includeUiLanguageEnglishNames` सक्षम होने पर `strings.json` को `t("…")` / `i18n.t("…")` शाब्दिक, वैकल्पिक `package.json` विवरण, और वैकल्पिक बंडल-मास्टर `englishName` प्रविष्टियों से अपडेट करें (`ui.uiExtractor` देखें; `languagesManifestPath` नहीं पढ़ता है)। `languagesManifestPath` पर `ui-languages.json` को भी पुनर्जीवित करता है। जब `ui.uiExtractor.extensions` में `.html` / `.htm` सूचीबद्ध होते हैं, तो एचटीएमएल से `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` मार्कर स्ट्रिंग्स भी कैप्चर करता है। गैर-खाली `ui.sourceRoots` की आवश्यकता है। एलएलएम को कॉल नहीं करता है।

**यह भी देखें:** [यूआई स्ट्रिंग्स अवलोकन](/hi/guide/ui-strings/), [प्लेन एचटीएमएल ऐप्स](/hi/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**सारांश:** `ai-i18n-tools mark-html [paths...] [--write]`

एचटीएमएल में नंगे `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` मार्कर डालें ताकि स्रोत टेक्स्ट एक बार (एलिमेंट पर ही) लिखा जा सके। दिए गए फ़ाइलों/निर्देशिकाओं/ग्लोबों को स्कैन करता है (डिफ़ॉल्ट: `ui.sourceRoots` के तहत `.html` / `.htm`)। डिफ़ॉल्ट रूप से ड्राई रन (प्रति-फ़ाइल जोड़ गणना और किसी भी मिश्रित-सामग्री तत्वों की रिपोर्ट करता है जिन्हें मैन्युअल `<span data-i18n>` की आवश्यकता होती है); `--write` परिवर्तन लागू करता है। आइडम्पोटेंट, `data-i18n-ignore` का सम्मान करता है (एलिमेंट और उसके सबट्री को छोड़ देता है), कभी भी कोड-जैसे तत्वों (`code`, `pre`, `kbd`, `samp`, `var`) या खाली/केवल-संख्यात्मक टेक्स्ट को नहीं छूता है, और कभी भी मूल्यवान मार्कर उत्सर्जित नहीं करता है। एलएलएम को कॉल नहीं करता है।

**मुख्य विकल्प:** `--write`

**यह भी देखें:** [अनुवाद के लिए एचटीएमएल को चिह्नित करना](/hi/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**सारांश:** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

`ui-languages.json` को `languagesManifestPath` (डिफ़ॉल्ट `{ui.flatOutputDir}/ui-languages.json`) में `sourceLocale` + `targetLocales` और बंडल किए गए `data/ui-languages-complete.json` (या `--master`) का उपयोग करके लिखें। मास्टर फ़ाइल से गायब लोकेल के लिए `TODO` प्लेसहोल्डर की चेतावनी देता है और उत्सर्जित करता है। यदि आपके पास अनुकूलित `label` या `englishName` मानों के साथ एक मौजूदा मैनिफेस्ट है, तो उन्हें मास्टर कैटलॉग डिफ़ॉल्ट द्वारा प्रतिस्थापित किया जाएगा — उत्पन्न फ़ाइल की समीक्षा करें और बाद में समायोजित करें।

**मुख्य विकल्प:** `--master`, `--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**सारांश:** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

केवल यूआई स्ट्रिंग्स का अनुवाद करें (`strings.json` → लोकेल JSON)। `features.translateUIStrings` की आवश्यकता है।

**मुख्य विकल्प:** `-l` / `--locale`, `--force`, `--dry-run`, `-j` / `--concurrency`

`-l` / `--locale`: अल्पविराम से अलग किए गए लक्ष्य लोकेल (डिफ़ॉल्ट: कॉन्फ़िग `targetLocales` माइनस `sourceLocale`)। `--force`: प्रति लोकेल सभी प्रविष्टियों का पुन: अनुवाद करें (मौजूदा अनुवादों को अनदेखा करें)। `--dry-run`: कोई लेखन नहीं, कोई एपीआई कॉल नहीं।

---

<a id="sync-ui"></a>
### `sync-ui`

**सारांश:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

UI स्ट्रिंग निकालें, फिर उनका अनुवाद करें (इसके लिए `features.translateUIStrings` आवश्यक है)। केवल UI — कोई दस्तावेज़, SVG, या `json[]` नहीं। `translate-ui` के समान `-l`, `--force`, `--dry-run`, और `-j` विकल्प।

---

<a id="proofread-ui"></a>
### `proofread-ui`

**सारांश:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

पहले `extract` चलाता है (इसके लिए `features.translateUIStrings` आवश्यक है) ताकि `strings.json` स्रोत से मेल खाए, फिर स्रोत-स्थानीय UI स्ट्रिंग की LLM समीक्षा (वर्तनी, व्याकरण)। शब्दावली के संकेत केवल `glossary.userGlossary` CSV से आते हैं (`translate-ui` के समान दायरा — `strings.json` / `uiGlossary` नहीं, इसलिए खराब कॉपी को शब्दावली के रूप में सुदृढ़ नहीं किया जाता है)। सक्रिय LLM प्रदाता (उसका API-कुंजी env var) का उपयोग करता है।

विफलता पर **1** से बाहर निकलता है (गायब फ़ीचर फ़्लैग, एक्सट्रैक्ट विफलता, गायब/अमान्य कैटलॉग, गायब API कुंजी, या जब सभी बैच विफल हो जाते हैं); जब रन सफलतापूर्वक पूरा हो जाता है तो **0** से बाहर निकलता है (निष्कर्ष सलाहकार होते हैं)। `cacheDir` के तहत `proofread-ui-results_<timestamp>.log` को एक मानव-पठनीय रिपोर्ट (सारांश, समस्याएँ, और प्रति-स्ट्रिंग OK पंक्तियाँ) के रूप में लिखता है; टर्मिनल केवल सारांश गणना और समस्याएँ प्रिंट करता है (प्रति स्ट्रिंग कोई `[ok]` लाइन नहीं)। अंतिम पंक्ति पर लॉग फ़ाइल नाम प्रिंट करता है। `--json` के साथ, मानव-शैली का आउटपुट stderr पर जाता है। लिंक डैशबोर्ड UI स्ट्रिंग लिंक बटन की तरह `path:line` का उपयोग करते हैं।

**मुख्य विकल्प:** `-l` / `--locale`, `--chunk` (डिफ़ॉल्ट **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**सारांश:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

`strings.json` को XLIFF 2.0 में निर्यात करें (प्रति लक्ष्य स्थानीय एक `.xliff`)। केवल पढ़ने के लिए; कोई API नहीं।

**मुख्य विकल्प:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: आउटपुट डायरेक्टरी (डिफ़ॉल्ट: कैटलॉग के समान फ़ोल्डर)। `--untranslated-only`: उस स्थानीय के लिए अनुवाद गुम होने वाली इकाइयाँ ही।
