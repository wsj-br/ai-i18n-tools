<a id="cli--documents"></a>
# सीएलआई — दस्तावेज़

<a id="translate-docs"></a>
### `translate-docs`

**सारांश:** `ai-i18n-tools translate-docs [options]`

प्रत्येक `docs` ब्लॉक के लिए मार्कडाउन, एमडीएक्स, `.astro`, वैकल्पिक डॉक्युसॉरस कैटलॉग JSON (`docusaurusCatalogDir`), वैकल्पिक नेक्सट्रा `_meta.ts`/डिक्शनरी `.ts`, और वैकल्पिक वाइटप्रेस थीम कैटलॉग का अनुवाद करें।

**मुख्य विकल्प:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `--check-cache`, `-p` / `-f`, `--dry-run`

`-j`: अधिकतम समानांतर स्थानीय; `-b`: प्रति फ़ाइल अधिकतम समानांतर बैच एपीआई कॉल। `--prompt-format`: बैच वायर फ़ॉर्मेट (`xml` | `json-array` | `json-object`)।

**यह भी देखें:** [कैश व्यवहार और `translate-docs` फ़्लैग](/hi/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [बैच प्रॉम्प्ट फ़ॉर्मेट](/hi/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**सारांश:** `ai-i18n-tools write-heading-ids [options]`

कम से कम एक `docs[]` ब्लॉक की आवश्यकता है। प्रत्येक ब्लॉक के `contentPaths` (`.translate-ignore` का सम्मान करता है) के तहत `.md` / `.mdx` एकत्र करता है। डिफ़ॉल्ट रूप से प्रत्येक फ़्लैट ATX `#` शीर्षक (फ़ेंस्ड कोड ब्लॉक के अंदर शीर्षकों को छोड़ देता है) से ठीक पहले एक HTML एंकर लाइन `<a id="slug"></a>` सम्मिलित करता है। किसी भी रूप के मौजूदा शीर्षक आईडी (HTML एंकर लाइन, क्लासिक `{#id}` प्रत्यय, MDX `{/* #id */}` टिप्पणी) को चयनित शैली से बदल दिया जाता है; स्लग हमेशा वर्तमान शीर्षक टेक्स्ट से प्राप्त होता है। `--slug-style mdx-comment` के साथ, इसके बजाय शीर्षक लाइन पर एक Docusaurus MDX टिप्पणी प्रत्यय लिखता है (वही github-शैली स्लग एल्गोरिथम) और मौजूद होने पर एक पूर्ववर्ती HTML एंकर को हटा देता है। `--remove` उन सभी शीर्षक-आईडी रूपों को हटा देता है और उनके स्थान पर कुछ भी नहीं लिखता है।

स्रोत फ़ाइलों को अपडेट करने के बाद, कमांड प्रत्येक लोकेल के मौजूदा अनुवादित मार्कडाउन (`docsOutput` के समान `translate-docs` पाथ मैपिंग) को भी देखता है। यह दस्तावेज़ क्रम में मिलान करने वाले ATX शीर्षकों पर **अंग्रेज़ी** शीर्षक आईडी की प्रतिलिपि बनाता है — यह कभी भी अनुवादित शीर्षक को स्लग नहीं करता है — और एक मध्य-शीर्षक `{#id}` / `{/* #id */}` (या भटका हुआ HTML `<a id>`) को उस फ़ॉर्म में वापस ले जाता है जिसकी Docusaurus / चुनी गई शैली अपेक्षा करती है। गुम अनुवादित फ़ाइलों को छोड़ दिया जाता है। `--remove` उन अनुवादित फ़ाइलों से भी शीर्षक आईडी हटा देता है, जिसमें गलत जगह पर रखे गए मध्य-पंक्ति टोकन भी शामिल हैं।

**मुख्य विकल्प:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--remove`, `--dry-run`

`--slug-style`: `github` (डिफ़ॉल्ट; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`, `mdx-comment` (Docusaurus `{/* #… */}` प्रत्यय)। `pymdown` के साथ, वैकल्पिक `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`। `--remove` को `--pymdown-*` के साथ नहीं जोड़ा जा सकता है।

**यह भी देखें:** [एंकर लिंक](/hi/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**सारांश:** `ai-i18n-tools check-markdown [options]`

प्रत्येक `docs[]` ब्लॉक के `contentPaths` के तहत मार्कडाउन/एमडीएक्स को स्कैन करता है (`translate-docs` के समान खोज, `.translate-ignore` का सम्मान करता है): डीलिमिटर पेयरिंग, अनक्लोज्ड इनलाइन कोड, और `STRONG_OUTSIDE_LINK` जब `**`/`__` एक `[text](url)` लिंक को रैप करते हैं।

stderr पर `relativePath:line: [ISSUE_CODE] message` लाइनें प्रिंट करता है; यदि कोई समस्या हो तो एग्जिट कोड **1**। `--json`: stdout पर JSON रिपोर्ट। `--no-cache` न होने पर `cacheDir` में `markdown_source_issues` लिखता है। `-v` stderr लाइनों में स्रोत हैश जोड़ता है।

**मुख्य विकल्प:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**यह भी देखें:** [मार्कडाउन समस्याएँ](/hi/guide/translation-dashboard/markdown-issues)
