<a id="cli--documents"></a>
# सीएलआई — दस्तावेज़

<a id="translate-docs"></a>
### `translate-docs`

**सारांश:** `ai-i18n-tools translate-docs [options]`

प्रत्येक `docs` ब्लॉक के लिए मार्कडाउन, एमडीएक्स, `.astro`, वैकल्पिक डॉक्युसॉरस कैटलॉग JSON (`docusaurusCatalogDir`), वैकल्पिक नेक्सट्रा `_meta.ts`/डिक्शनरी `.ts`, और वैकल्पिक वाइटप्रेस थीम कैटलॉग का अनुवाद करें।

**मुख्य विकल्प:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `-p` / `-f`, `--dry-run`

`-j`: अधिकतम समानांतर स्थानीय; `-b`: प्रति फ़ाइल अधिकतम समानांतर बैच एपीआई कॉल। `--prompt-format`: बैच वायर फ़ॉर्मेट (`xml` | `json-array` | `json-object`)।

**यह भी देखें:** [कैश व्यवहार और `translate-docs` फ़्लैग](/hi/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [बैच प्रॉम्प्ट फ़ॉर्मेट](/hi/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**सारांश:** `ai-i18n-tools write-heading-ids [options]`

कम से कम एक `docs[]` ब्लॉक की आवश्यकता है। प्रत्येक ब्लॉक के `contentPaths` के तहत `.md` / `.mdx` एकत्र करता है (`.translate-ignore` का सम्मान करता है)। डिफ़ॉल्ट रूप से प्रत्येक फ्लैट ATX `#` हेडिंग से ठीक पहले एक HTML एंकर लाइन `<a id="slug"></a>` सम्मिलित करता है (फेंस किए गए कोड ब्लॉक के अंदर हेडिंग को छोड़ देता है); जब एक एंकर लाइन पहले से मौजूद होती है, तो यदि यह वर्तमान हेडिंग टेक्स्ट से प्राप्त स्लग से मेल नहीं खाती है तो `id` को अपडेट करता है। `--slug-style mdx-comment` के साथ, इसके बजाय हेडिंग लाइन पर एक Docusaurus MDX टिप्पणी प्रत्यय `{/* #slug */}` जोड़ता है (वही github-शैली स्लग एल्गोरिथम), जब हेडिंग टेक्स्ट बदलता है तो एक पुरानी टिप्पणी को ताज़ा करता है।

**मुख्य विकल्प:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--dry-run`

`--slug-style`: `github` (डिफ़ॉल्ट; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`, `mdx-comment` (Docusaurus `{/* #… */}` प्रत्यय)। `pymdown` के साथ, वैकल्पिक `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`।

**यह भी देखें:** [एंकर लिंक](/hi/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**सारांश:** `ai-i18n-tools check-markdown [options]`

प्रत्येक `docs[]` ब्लॉक के `contentPaths` के तहत मार्कडाउन/एमडीएक्स को स्कैन करता है (`translate-docs` के समान खोज, `.translate-ignore` का सम्मान करता है): डीलिमिटर पेयरिंग, अनक्लोज्ड इनलाइन कोड, और `STRONG_OUTSIDE_LINK` जब `**`/`__` एक `[text](url)` लिंक को रैप करते हैं।

stderr पर `relativePath:line: [ISSUE_CODE] message` लाइनें प्रिंट करता है; यदि कोई समस्या हो तो एग्जिट कोड **1**। `--json`: stdout पर JSON रिपोर्ट। `--no-cache` न होने पर `cacheDir` में `markdown_source_issues` लिखता है। `-v` stderr लाइनों में स्रोत हैश जोड़ता है।

**मुख्य विकल्प:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**यह भी देखें:** [मार्कडाउन समस्याएँ](/hi/guide/translation-dashboard/markdown-issues)
