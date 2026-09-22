<a id="cli--workflows--reporting"></a>
# CLI — वर्कफ़्लो और रिपोर्टिंग

<a id="sync"></a>
### `sync`

**सारांश:** `ai-i18n-tools sync [options]`

निकालें (यदि सक्षम हो), फिर यूआई अनुवाद, फिर `translate-svg` जब `features.translateSVG` और `config.svg` सेट हों, फिर दस्तावेज़ अनुवाद, फिर `translate-json` जब `features.translateJson` और `json[]` सेट हों — जब तक कि `--no-ui`, `--no-svg`, `--no-docs`, या `--no-json` के साथ छोड़ा न जाए।

**मुख्य विकल्प:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` को UI और SVG चरणों के साथ-साथ डॉक्स/JSON पर भी अग्रेषित किया जाता है; `--force-update` डॉक्स, JSON और SVG (UI नहीं) पर लागू होता है। `--check-cache` को डॉक्स, JSON और SVG पर अग्रेषित किया जाता है: यह उन लोकेल के लिए कैशे किए गए सेगमेंट को फिर से मान्य करता है जिनमें एक लागू मूल स्क्रिप्ट होती है, भले ही फ़ाइल ट्रैकिंग छोड़ दी जाए। डॉक्स चरण `--emphasis-placeholders` (`translate-docs` के समान अर्थ) को भी अग्रेषित करता है। ग्लोबल `--debug-failed` प्रत्येक छोड़े गए मॉडल प्रयास (SVG/डॉक्स स्क्रिप्ट फ़ॉलबैक सहित) के लिए `cacheDir` के तहत `FAILED-TRANSLATION` लॉग लिखता है, न कि केवल तब जब श्रृंखला में प्रत्येक मॉडल विफल हो जाता है। `--prompt-format` एक `sync` फ़्लैग नहीं है; डॉक्स और JSON चरण अंतर्निहित डिफ़ॉल्ट (`json-array`) का उपयोग करते हैं।

---

<a id="status"></a>
### `status`

**सारांश:** `ai-i18n-tools status [--max-columns <n>]`

जब `features.translateUIStrings` चालू होता है, तो प्रति लोकेल यूआई कवरेज प्रिंट करता है (`Translated` / `Missing` / `Total`)। फिर प्रति फ़ाइल × लोकेल मार्कडाउन अनुवाद स्थिति प्रिंट करता है (कोई `--locale` फ़िल्टर नहीं; लोकेल कॉन्फ़िग से आते हैं)। जब `features.translateJson` चालू होता है और `json[]` कॉन्फ़िगर होता है, तो प्रति ब्लॉक जेएसओएन बंडल स्थिति भी प्रिंट करता है। बड़ी लोकेल सूचियों को `n` लोकेल कॉलम (डिफ़ॉल्ट **9**) तक की दोहराई गई तालिकाओं में विभाजित किया जाता है ताकि टर्मिनल में लाइनें संकीर्ण रहें।

**मुख्य विकल्प:** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**सारांश:** `ai-i18n-tools statistics [--max-columns <n>]`

दस्तावेज़ कैश और `strings.json` आँकड़े प्रिंट करें (अनुवाद डैशबोर्ड → आँकड़े के समान कुल)। `--max-columns`: प्रति मॉडल × लोकेल तालिका में अधिकतम लोकेल कॉलम (डिफ़ॉल्ट **6**)।

**मुख्य विकल्प:** `--max-columns`

**यह भी देखें:** [डैशबोर्ड सांख्यिकी](/hi/guide/translation-dashboard/statistics)

---

<a id="usage"></a>
### `usage`

**सारांश:** `ai-i18n-tools usage [--since <when>] [--provider <name>] [--model <id>] [--operation <name>] [-l <code>] [--outcome accepted|discarded] [--clear] [--older-than <when>] [--dry-run]`

रिकॉर्ड किए गए मॉडल API-कॉल आँकड़े (कॉल, टोकन और एक USD लागत) प्रिंट करें। लागत प्रदाता की `usage.cost` है जब मौजूद हो, अन्यथा `providers.<name>.modelPricing` से राशि या प्रदाता-व्यापी `providers.<name>.pricing` डिफ़ॉल्ट (नए कॉल पर संग्रहीत; पुरानी पंक्तियों के लिए रिपोर्ट समय पर लागू होती है जिनमें कोई संग्रहीत लागत नहीं है)। अनुवाद डैशबोर्ड → उपयोग और लागत के समान एग्रीगेट्स। सात UTC कैलेंडर दिनों से पुरानी विवरण पंक्तियों को मासिक `api_totals` में रोल किया जाता है; रिपोर्ट दोनों तालिकाओं को जोड़ती है। `--since` `YYYY-MM-DD`, एक अवधि (`30m`, `1h`, `6h`, `12h`, `24h`, `7d`, `30d`), या एक कैलेंडर-माह विंडो (`1mo`, `2mo`, `3mo`) स्वीकार करता है। `--clear` विवरण पंक्तियों और मासिक योगों को हटाता है (`--older-than` `1mo`, `2mo`, `3mo`, `6mo`, `1y`, या `all` है; `--dry-run` हटाए बिना गिनती की रिपोर्ट करता है)।

**मुख्य विकल्प:** `--since`, `--provider`, `--model`, `--operation`, `-l` / `--locale`, `--outcome`, `--clear`, `--older-than`, `--dry-run`

**यह भी देखें:** [डैशबोर्ड उपयोग और लागत](/hi/guide/translation-dashboard/usage)
