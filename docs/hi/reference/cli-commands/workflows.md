<a id="cli--workflows--status"></a>
# सीएलआई — वर्कफ़्लो और स्थिति

<a id="sync"></a>
### `sync`

**सारांश:** `ai-i18n-tools sync [options]`

निकालें (यदि सक्षम हो), फिर यूआई अनुवाद, फिर `translate-svg` जब `features.translateSVG` और `config.svg` सेट हों, फिर दस्तावेज़ अनुवाद, फिर `translate-json` जब `features.translateJson` और `json[]` सेट हों — जब तक कि `--no-ui`, `--no-svg`, `--no-docs`, या `--no-json` के साथ छोड़ा न जाए।

**मुख्य विकल्प:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` को यूआई और एसवीजी चरणों के साथ-साथ डॉक्स/जेएसओएन में भी अग्रेषित किया जाता है; `--force-update` डॉक्स, जेएसओएन और एसवीजी (यूआई नहीं) पर लागू होता है। डॉक्स चरण `--emphasis-placeholders` और `--debug-failed` (`translate-docs` के समान अर्थ) को भी अग्रेषित करता है। `--prompt-format` एक `sync` फ़्लैग नहीं है; डॉक्स और जेएसओएन चरण अंतर्निहित डिफ़ॉल्ट (`json-array`) का उपयोग करते हैं।

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

**यह भी देखें:** [डैशबोर्ड आँकड़े](/hi/guide/translation-dashboard/statistics)
