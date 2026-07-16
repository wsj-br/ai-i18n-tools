<a id="cli--other-content"></a>
# सीएलआई — अन्य सामग्री

<a id="translate-json"></a>
### `translate-json`

**सारांश:** `ai-i18n-tools translate-json [options]`

`json[]` के अनुसार नेस्टेड JSON का अनुवाद करें (इसके लिए `features.translateJson` आवश्यक है)। साझा SQLite कैश।

**मुख्य विकल्प:** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**यह भी देखें:** [JSON](/hi/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**सारांश:** `ai-i18n-tools translate-svg [options]`

`config.svg` में कॉन्फ़िगर की गई SVG फ़ाइलों का अनुवाद करें (दस्तावेज़ों से अलग)। इसके लिए `features.translateSVG` आवश्यक है। दस्तावेज़ों के समान कैश विचार; उस रन के लिए SQLite रीड/राइट को छोड़ने के लिए `--no-cache` का समर्थन करता है।

**मुख्य विकल्प:** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**यह भी देखें:** [SVG अनुवाद](/hi/guide/svg-translation/)
