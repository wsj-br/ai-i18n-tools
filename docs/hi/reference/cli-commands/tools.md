<a id="cli--tools"></a>
# सीएलआई — उपकरण

<a id="dashboard"></a>
### `dashboard`

**सारांश:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

अनुवाद डैशबोर्ड लॉन्च करें (कैश सेगमेंट, `strings.json`, शब्दावली, विफलताओं और आंकड़ों के लिए स्थानीय वेब यूआई)। डिफ़ॉल्ट पोर्ट **8675** (अनुपलब्ध होने पर अगले पोर्ट को फिर से प्रयास करता है)। `--no-open` के साथ, डिफ़ॉल्ट ब्राउज़र स्वचालित रूप से नहीं खुलता है। अप्रचलित उपनाम `editor` अभी भी काम करता है लेकिन एक चेतावनी प्रिंट करता है।

**मुख्य विकल्प:** `-p` / `--port`, `--no-open`

**यह भी देखें:** [अनुवाद डैशबोर्ड](/hi/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**सारांश:** `ai-i18n-tools glossary-generate [-o <path>]`

एक खाली `glossary-user.csv` टेम्पलेट लिखें। एक मौजूदा फ़ाइल को अधिलेखित करने से मना करता है (बाहर निकलें **1**)।

**मुख्य विकल्प:** `-o` / `--output`

`-o`: आउटपुट पथ को ओवरराइड करें (डिफ़ॉल्ट: कॉन्फ़िग से `glossary.userGlossary`, या `glossary-user.csv`)।

**यह भी देखें:** [डैशबोर्ड शब्दावली](/hi/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**सारांश:** `ai-i18n-tools help [command]`

एक सबकमांड के लिए सहायता प्रदर्शित करें (`ai-i18n-tools <command> --help` के समान आउटपुट)।
