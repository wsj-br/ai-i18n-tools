<a id="plain-html-apps"></a>
# सामान्य HTML ऐप

इस पथ का उपयोग एक इंटरैक्टिव पृष्ठ के लिए करें जो एक ही HTML फ़ाइल में रहता है। `extract` `data-i18n*` मार्करों को `strings.json` में पढ़ता है, `translate-ui` प्रत्येक लोकेल के लिए एक फ्लैट JSON बंडल लिखता है, और एक ब्राउज़र स्क्रिप्ट स्ट्रिंग्स को लागू करती है। वही स्क्रिप्ट छवि फ़ाइल नामों में प्रत्यय (suffix) जोड़ सकती है और वर्तमान पृष्ठ पर लिंक रख सकती है।

एक स्टैटिक साइट के लिए जिसे प्रत्येक लोकेल के लिए एक अनुवादित HTML फ़ाइल उत्सर्जित करनी चाहिए (कोई रनटाइम नहीं, पुनर्लेखित क्रॉस-पेज लिंक), इसके बजाय [HTML पृष्ठ](/hi/guide/documents/html-pages) का उपयोग करें। एक फ़ाइल एक पथ से संबंधित होती है।

<a id="quick-start"></a>
## त्वरित शुरुआत

1. अंग्रेज़ी HTML को चिह्नित करें (या `mark-html` को इसे करने दें)।
2. `ui.sourceRoots` और `ui.uiExtractor.extensions` को उन फ़ाइलों की ओर इंगित करें।
3. `extract` चलाएँ, फिर `translate-ui`।
4. `i18n.js` को पृष्ठ के बगल में कॉपी करें और इसे अपनी स्क्रिप्ट से पहले लोड करें।
5. फ़ोल्डर को HTTP पर सर्व करें। `file://` लोकेल JSON को `fetch` नहीं कर सकता।

```bash
ai-i18n-tools mark-html public/index.html --write
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

```jsonc
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "pt-BR"],
  "features": { "translateUIStrings": true },
  "ui": {
    "sourceRoots": ["public"],
    "stringsJson": "public/strings.json",
    "flatOutputDir": "public/locales",
    "uiExtractor": { "extensions": [".html"] }
  }
}
```

`flatOutputDir` वह स्थान है जहाँ `translate-ui` `{locale}.json` और `ui-languages.json` लिखता है। स्क्रिप्ट का `data-locales-base` उस निर्देशिका को `i18n.js` (पृष्ठ नहीं) के सापेक्ष URL के रूप में होना चाहिए। `public/i18n.js` पर `./locales` का आधार `public/locales/pt-BR.json` को लोड करता है। एक सापेक्ष आधार का उपयोग करें ताकि साइट उप-पथ (subpath) के अंतर्गत भी काम करती रहे।

<a id="obtain-the-runtime"></a>
## रनटाइम प्राप्त करें

`i18n.js` एक क्लासिक स्क्रिप्ट है (मॉड्यूल नहीं)। इनमें से एक को कॉपी करें; वे एक ही फ़ाइल हैं:

- पैकेज इंस्टॉल करने के बाद `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js`
- [examples/plain-html/public/i18n.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/plain-html/public/i18n.js)
- [रनटाइम स्रोत](#runtime-source) के अंतर्गत लिस्टिंग

इसे `<body>` के अंत में लोड करें, फिर अपनी स्वयं की स्क्रिप्ट। `<html>` पर `class="i18n-pending"` रखें और उस क्लास के सेट होने तक बॉडी को छिपाएँ ताकि स्रोत भाषा फ्लैश न हो:

```html
<html lang="en" class="i18n-pending">
  <head>
    <style>
      html.i18n-pending body { visibility: hidden; }
    </style>
  </head>
  <body>
    <!-- page -->
    <script
      src="i18n.js"
      data-source-locale="en"
      data-locales-base="./locales"
      data-storage-key="ai-i18n-locale"
      data-locale-select="#locale-select"
      data-label-mode="native"
    ></script>
    <script src="app.js"></script>
  </body>
</html>
```

| विशेषता | डिफ़ॉल्ट | भूमिका |
| --- | --- | --- |
| `data-source-locale` | `en` | वह लोकेल जो अंग्रेज़ी HTML रखता है और बंडल फ़ेच को छोड़ देता है |
| `data-locales-base` | `./locales` | `ui-languages.json` और `{locale}.json` की निर्देशिका, स्क्रिप्ट URL के विरुद्ध हल की गई |
| `data-storage-key` | `ai-i18n-locale` | `localStorage` कुंजी |
| `data-locale-select` | (कोई नहीं) | मैनिफेस्ट से भरने के लिए एक `<select>` का CSS चयनकर्ता |
| `data-locale-list` | (कोई नहीं) | भाषा लिंक से भरने के लिए एक तत्व का CSS चयनकर्ता |
| `data-label-mode` | `native` | `native` (मैनिफेस्ट `label`), `english` (`englishName`), या `both` (`englishName / label` जब वे भिन्न हों) |

`window.i18n` `t(key)`, `locale`, `dir`, `apply()`, `setLocale(code)`, और `ready` (एक प्रॉमिस) को एक्सपोज़ करता है। नए चिह्नित तत्वों को सम्मिलित करने के बाद `apply()` को कॉल करें।

<a id="marking-html-for-translation"></a>
## अनुवाद के लिए HTML को चिह्नित करना

बेयर मार्करों को प्राथमिकता दें। स्रोत टेक्स्ट तत्व से पढ़ा जाता है, इसलिए इसे एक बार लिखा जाता है:

- `data-i18n` — कुंजी `textContent` है। रनटाइम `textContent` सेट करता है।
- `data-i18n-title` — कुंजी `title` है।
- `data-i18n-placeholder` — कुंजी `placeholder` है।
- `data-i18n-alt` — कुंजी `alt` है।
- `data-i18n-aria-label` — कुंजी `aria-label` है।

`mark-html` उन बेयर मार्करों को सम्मिलित करता है। यह एक ड्राई रन है जब तक कि आप `--write` पास नहीं करते। यह `data-i18n-ignore` सबट्री, कोड-जैसे तत्वों (`code`, `pre`, `kbd`, `samp`, `var`), और खाली या केवल संख्यात्मक टेक्स्ट को छोड़ देता है।

सादा `data-i18n` एक लीफ टेक्स्ट नोड के लिए है। `Run <code>build</code> now.` के लिए, प्रत्येक टेक्स्ट रन को रैप करें:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

एक मानयुक्त मार्कर (`data-i18n="Some key"`) का उपयोग केवल तभी करें जब कुंजी को दृश्यमान टेक्स्ट से भिन्न होना आवश्यक हो।

रनटाइम पहली बार चलने पर प्रत्येक स्रोत कुंजी को एक आंतरिक `data-i18n-source` विशेषता पर रिकॉर्ड करता है, ताकि बाद में लोकैल स्विच करने पर भी अंग्रेजी स्ट्रिंग को देखा जा सके। उन विशेषताओं को एक्सट्रैक्ट नहीं किया जाता है।

<a id="locale-assets"></a>
## लोकैल-विशिष्ट छवियाँ और लिंक

ये मार्कर कभी भी अनुवादक को नहीं भेजे जाते हैं। `mark-html` इन्हें जोड़ता नहीं है।

- `data-i18n-locale-src` — सादा: `pic_trulli.jpg`, `pic_trulli-pt-BR.jpg` बन जाता है (लोकैल कोड एक्सटेंशन से पहले डाला जाता है)। मानयुक्त: मान एक टेम्पलेट है, उदाहरण के लिए `img/{locale}/pic_trulli.jpg`।
- `data-i18n-locale-href` — `?locale=` को जोड़ता है ताकि लिंक उसी HTML फ़ाइल पर बना रहे।

```html
<img src="pic_trulli.jpg" alt="Italian Trulli" data-i18n-alt data-i18n-locale-src />
<a href="about.html" data-i18n-locale-href>About</a>
```

स्रोत लोकैल मूल URL को बनाए रखता है। पूर्ण URL, `data:` URL, और `#` फ्रैगमेंट्स को वैसे का वैसा ही छोड़ दिया जाता है। छवि पथ पर क्वेरी स्ट्रिंग्स और फ्रैगमेंट्स अपने स्थान पर बने रहते हैं। यदि लोकैलाइज़ की गई छवि 404 देती है, तो रनटाइम मूल `src` को एक बार पुनर्स्थापित करता है। आप `pic_trulli-pt-BR.jpg` को स्वयं शिप करते हैं; स्क्रिप्ट इसे बनाती नहीं है।

`data-i18n-locale-href` इस कैटलॉग मॉडल के लिए है। `about.pt-BR.html` का लिंक [HTML पृष्ठों](/hi/guide/documents/html-pages) की पाइपलाइन से संबंधित है।

<a id="language-selector"></a>
## भाषा चयनकर्ता

`data-locale-select` को एक खाली `<select>` पर इंगित करें। रनटाइम `ui-languages.json` (`code`, `label`, `englishName`, `direction`) की प्रत्येक पंक्ति के लिए एक `<option>` भरता है। सेलेक्ट को बदलने पर `setLocale` कॉल होता है, जो विकल्प को स्टोर करता है, `?locale=` को `history.pushState` के साथ अपडेट करता है (कोई रीलोड नहीं), बंडल को फेच करता है, प्रत्येक मार्कर को पुनः लागू करता है, और `<html lang>` और `dir` को सेट करता है। बैक बटन URL में लोकैल को पुनः लागू करता है।

`data-locale-list` लिंक के साथ भी यही करता है (सक्रिय वाले पर `lang`, `hreflang`, और `aria-current`)। वे लिंक कैटलॉग पृष्ठ को स्विच करते हैं; वे दस्तावेज़ पाइपलाइन द्वारा लिखे गए प्रति-फ़ाइल लिंक नहीं हैं।

इसके ऊपर `navigator.language` द्वारा ऑटो-रीडायरेक्ट न करें। रनटाइम ब्राउज़र भाषा का उपयोग पहले से ही केवल तभी करता है जब URL और `localStorage` के पास कोई विकल्प न हो। URL को अनदेखा करने वाला रीडायरेक्ट लोकैल साझा करना और पृष्ठ को क्रॉल करना कठिन बना देता है।

`ui-languages.json` को `extract` या `generate-ui-languages` द्वारा `languagesManifestPath` में लिखा जाता है (डिफ़ॉल्ट `{ui.flatOutputDir}/ui-languages.json`)। [भाषा स्विचर और RTL](/hi/guide/ui-strings/language-switcher) देखें।

<a id="troubleshooting"></a>
## समस्या निवारण

| लक्षण | क्या जाँचें |
| --- | --- |
| नेटवर्क त्रुटि, खाली पृष्ठ | साइट को स्थानीय सर्वर के साथ खोलें। `file://`, `fetch` को ब्लॉक करता है। |
| `ui-languages.json` पर 404 | `data-locales-base`, `i18n.js` के सापेक्ष है। इसे `flatOutputDir` से मेल खाना चाहिए। |
| `/docs/` के अंतर्गत स्ट्रिंग्स अंग्रेजी में रहती हैं | वही बेस-पाथ समस्या। शुरुआती `/` से बचें जब तक कि लोकैल निर्देशिका होस्ट रूट पर न हो। |
| अंग्रेजी फ्लैश होती है, फिर अनुवादित होती है | `<html>` पर `class="i18n-pending"` और ऊपर दिया गया दृश्यता नियम जोड़ें। |
| दूसरा स्विच अनुवादित स्ट्रिंग को कुंजी के रूप में दिखाता है | शिप किए गए `i18n.js` को लोड करें। यह टेक्स्ट को बदलने से पहले `data-i18n-source` को स्टोर करता है। |
| RTL लेआउट फ्लिप नहीं होता है | मैनिफेस्ट पंक्ति को `"direction": "rtl"` की आवश्यकता है। रनटाइम `dir` को केवल `<html>` पर सेट करता है। |
| नए DOM नोड्स अंग्रेजी में रहते हैं | उन्हें सम्मिलित करने के बाद `window.i18n.apply()` को कॉल करें। |
| छवि पुर्तगाली में `pic_trulli.jpg` बनी रहती है | तत्व को `data-i18n-locale-src` की आवश्यकता है, और लोकेल स्रोत लोकेल नहीं होना चाहिए। |

रनटाइम में `normalizeI18nText`, [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) में `normalizeI18nText` से मेल खाता है: ट्रिम करें, फिर रिक्त स्थान को संकुचित करें। चूँकि अंग्रेज़ी स्रोत टेक्स्ट कैटलॉग कुंजी है, इसलिए अनुपलब्ध अनुवाद अंग्रेज़ी पर फ़ॉल बैक हो जाता है।

चलाने योग्य डेमो [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) है। `pnpm dev` इसे [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) पर सर्व करता है।

<a id="runtime-source"></a>
## रनटाइम स्रोत

```javascript
/* global document, window, localStorage, fetch, URLSearchParams, URL, history, navigator, PopStateEvent */
/**
 * Drop-in catalog runtime for plain HTML.
 *
 * Classic script (not a module) so `document.currentScript` is available.
 * Configure with data-* attributes on the script tag:
 *   data-source-locale, data-locales-base, data-storage-key,
 *   data-locale-select, data-locale-list, data-label-mode
 *
 * `data-locales-base` resolves against this script's URL, not the page URL.
 * Put class="i18n-pending" on <html> and hide the body while that class is set
 * to avoid a flash of source-locale text.
 */
(function () {
  "use strict";

  var TEXT_SOURCE_ATTR = "data-i18n-source";

  function runtimeScript() {
    if (document.currentScript) return document.currentScript;
    var marked = document.querySelectorAll(
      "script[data-ai-i18n-runtime], script[data-source-locale], script[data-locales-base]"
    );
    return marked.length > 0 ? marked[marked.length - 1] : null;
  }

  var scriptEl = runtimeScript();

  function attr(name, fallback) {
    if (!scriptEl) return fallback;
    var value = scriptEl.getAttribute(name);
    return value === null || value === "" ? fallback : value;
  }

  var SOURCE_LOCALE = attr("data-source-locale", "en");
  var LOCALES_BASE_ATTR = attr("data-locales-base", "./locales");
  var STORAGE_KEY = attr("data-storage-key", "ai-i18n-locale");
  var SELECT_SEL = attr("data-locale-select", "");
  var LIST_SEL = attr("data-locale-list", "");
  var LABEL_MODE = attr("data-label-mode", "native");

  function resolveLocalesBase() {
    var baseUrl = scriptEl && scriptEl.src ? scriptEl.src : window.location.href;
    return new URL(LOCALES_BASE_ATTR, baseUrl).href.replace(/\/$/, "");
  }

  var LOCALES_BASE = resolveLocalesBase();
  var I18N = { locale: SOURCE_LOCALE, dir: "ltr", bundle: {} };
  var languages = [];
  var titleKey = "";
  var selectBound = false;

  /**
   * Collapse insignificant whitespace. MUST stay identical to `normalizeI18nText`
   * in `src/extractors/html-i18n-marks.ts` and `src/dashboard-app/app.js`.
   */
  function normalizeI18nText(s) {
    return s.trim().replace(/\s+/g, " ");
  }

  function normalizeLocaleCode(code) {
    if (!code) return "";
    var parts = String(code).split("-");
    if (parts.length === 1) return parts[0].toLowerCase();
    return parts[0].toLowerCase() + "-" + parts.slice(1).join("-");
  }

  function isSourceLocale(locale) {
    return normalizeLocaleCode(locale) === normalizeLocaleCode(SOURCE_LOCALE);
  }

  function t(key) {
    var raw = I18N.bundle[key];
    return typeof raw === "string" && raw.length > 0 ? raw : key;
  }

  function findLanguage(code) {
    var norm = normalizeLocaleCode(code);
    for (var i = 0; i < languages.length; i++) {
      if (normalizeLocaleCode(languages[i].code) === norm) return languages[i];
    }
    return undefined;
  }

  function resolveLocale() {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get("locale");
    if (fromUrl) return fromUrl;
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {
      /* private mode */
    }
    var browser = navigator.language || (navigator.languages && navigator.languages[0]) || SOURCE_LOCALE;
    var match = findLanguage(browser);
    return match ? match.code : SOURCE_LOCALE;
  }

  function loadJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (res) {
      return res.ok ? res.json() : null;
    });
  }

  function labelFor(row) {
    var native = row.label || row.code;
    var english = row.englishName || native;
    if (LABEL_MODE === "english") return english;
    if (LABEL_MODE === "both") return english === native ? english : english + " / " + native;
    return native;
  }

  function sourceAttrName(attrName) {
    return attrName ? TEXT_SOURCE_ATTR + "-" + attrName : TEXT_SOURCE_ATTR;
  }

  function rememberKey(el, attrName, marker) {
    var stored = el.getAttribute(sourceAttrName(attrName));
    if (stored) return stored;
    var valued = el.getAttribute(marker);
    var key = valued
      ? valued
      : attrName
        ? normalizeI18nText(el.getAttribute(attrName) || "")
        : normalizeI18nText(el.textContent || "");
    if (key) el.setAttribute(sourceAttrName(attrName), key);
    return key;
  }

  function applyTextMarkers(selector, attrName, write) {
    var marker = attrName ? "data-i18n-" + attrName : "data-i18n";
    document.querySelectorAll(selector).forEach(function (el) {
      var key = rememberKey(el, attrName, marker);
      if (key) write(el, t(key));
    });
  }

  function isSkippableUrl(url) {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url);
  }

  function withLocaleSuffix(url, locale) {
    if (!url || isSourceLocale(locale) || isSkippableUrl(url)) return url;
    var hash = url.indexOf("#");
    var fragment = hash >= 0 ? url.slice(hash) : "";
    var pathQuery = hash >= 0 ? url.slice(0, hash) : url;
    var q = pathQuery.indexOf("?");
    var path = q >= 0 ? pathQuery.slice(0, q) : pathQuery;
    var query = q >= 0 ? pathQuery.slice(q) : "";
    return path.replace(/(\.[^./]+)$/, "-" + locale + "$1") + query + fragment;
  }

  function applyLocaleTemplate(template, locale) {
    return template.split("{locale}").join(locale);
  }

  function withLocaleQuery(url, locale) {
    if (!url || isSourceLocale(locale) || isSkippableUrl(url)) return url;
    var next = new URL(url, window.location.href);
    next.searchParams.set("locale", locale);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) return next.href;
    return next.pathname + next.search + next.hash;
  }

  function applyLocaleSrc() {
    document.querySelectorAll("[data-i18n-locale-src]").forEach(function (el) {
      var baseAttr = "data-i18n-locale-src-base";
      var raw = el.getAttribute(baseAttr);
      if (raw === null) {
        raw = el.getAttribute("src") || "";
        el.setAttribute(baseAttr, raw);
      }
      var valued = el.getAttribute("data-i18n-locale-src") || "";
      var next = raw;
      if (!isSourceLocale(I18N.locale)) {
        next = valued ? applyLocaleTemplate(valued, I18N.locale) : withLocaleSuffix(raw, I18N.locale);
      }
      if (next) el.setAttribute("src", next);
      if (el.tagName === "IMG" && !el.hasAttribute("data-i18n-src-fallback-bound")) {
        el.setAttribute("data-i18n-src-fallback-bound", "");
        el.addEventListener("error", function onErr() {
          var original = el.getAttribute(baseAttr);
          if (original && el.getAttribute("src") !== original) el.setAttribute("src", original);
          el.removeEventListener("error", onErr);
        });
      }
    });
  }

  function applyLocaleHref() {
    document.querySelectorAll("[data-i18n-locale-href]").forEach(function (el) {
      var baseAttr = "data-i18n-locale-href-base";
      var raw = el.getAttribute(baseAttr);
      if (raw === null) {
        raw = el.getAttribute("href") || "";
        el.setAttribute(baseAttr, raw);
      }
      el.setAttribute("href", isSourceLocale(I18N.locale) ? raw : withLocaleQuery(raw, I18N.locale));
    });
  }

  function applyStaticI18n() {
    applyTextMarkers("[data-i18n]", "", function (el, text) {
      el.textContent = text;
    });
    applyTextMarkers("[data-i18n-title]", "title", function (el, text) {
      el.setAttribute("title", text);
    });
    applyTextMarkers("[data-i18n-placeholder]", "placeholder", function (el, text) {
      el.setAttribute("placeholder", text);
    });
    applyTextMarkers("[data-i18n-alt]", "alt", function (el, text) {
      el.setAttribute("alt", text);
    });
    applyTextMarkers("[data-i18n-aria-label]", "aria-label", function (el, text) {
      el.setAttribute("aria-label", text);
    });
    applyLocaleSrc();
    applyLocaleHref();
    if (titleKey) document.title = t(titleKey);
  }

  function fillSelect(select) {
    var previous = select.value;
    select.replaceChildren();
    languages.forEach(function (row) {
      var opt = document.createElement("option");
      opt.value = row.code;
      opt.textContent = labelFor(row);
      opt.lang = row.code;
      if (normalizeLocaleCode(row.code) === normalizeLocaleCode(I18N.locale)) opt.selected = true;
      select.appendChild(opt);
    });
    if (!select.value && previous) select.value = previous;
    if (!selectBound) {
      selectBound = true;
      select.addEventListener("change", function () {
        void setLocale(select.value);
      });
    }
  }

  function fillList(list) {
    list.replaceChildren();
    languages.forEach(function (row) {
      var link = document.createElement("a");
      link.href = "#";
      link.textContent = labelFor(row);
      link.lang = row.code;
      link.hreflang = row.code;
      var active = normalizeLocaleCode(row.code) === normalizeLocaleCode(I18N.locale);
      if (active) link.setAttribute("aria-current", "true");
      link.addEventListener("click", function (event) {
        event.preventDefault();
        void setLocale(row.code);
      });
      list.appendChild(link);
    });
  }

  function renderSelectors() {
    if (SELECT_SEL) {
      var select = document.querySelector(SELECT_SEL);
      if (select) fillSelect(select);
    }
    if (LIST_SEL) {
      var list = document.querySelector(LIST_SEL);
      if (list) fillList(list);
    }
  }

  function syncUrl(locale) {
    var url = new URL(window.location.href);
    if (isSourceLocale(locale)) url.searchParams.delete("locale");
    else url.searchParams.set("locale", locale);
    history.pushState({ locale: locale }, "", url.pathname + url.search + url.hash);
  }

  function setLocale(code, opts) {
    var push = !opts || opts.push !== false;
    I18N.locale = code;
    var langRow = findLanguage(code);
    I18N.dir = langRow && langRow.direction === "rtl" ? "rtl" : "ltr";
    var bundlePromise = isSourceLocale(code)
      ? Promise.resolve(null)
      : loadJson(LOCALES_BASE + "/" + encodeURIComponent(code) + ".json");
    return bundlePromise.then(function (bundle) {
      I18N.bundle = bundle && typeof bundle === "object" && !Array.isArray(bundle) ? bundle : {};
      document.documentElement.setAttribute("lang", (langRow && langRow.code) || code);
      document.documentElement.setAttribute("dir", I18N.dir);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        /* private mode */
      }
      applyStaticI18n();
      renderSelectors();
      if (push) syncUrl(code);
      document.documentElement.classList.remove("i18n-pending");
    });
  }

  function onPopState() {
    var params = new URLSearchParams(window.location.search);
    void setLocale(params.get("locale") || SOURCE_LOCALE, { push: false });
  }

  if (window.__aiI18nPop) window.removeEventListener("popstate", window.__aiI18nPop);
  window.__aiI18nPop = onPopState;
  window.addEventListener("popstate", onPopState);

  function captureTitleKey() {
    var titleEl = document.querySelector("title");
    if (!titleEl) {
      titleKey = normalizeI18nText(document.title || "");
      return;
    }
    titleKey =
      titleEl.getAttribute(TEXT_SOURCE_ATTR) ||
      titleEl.getAttribute("data-i18n") ||
      normalizeI18nText(titleEl.textContent || "");
    if (titleKey) titleEl.setAttribute(TEXT_SOURCE_ATTR, titleKey);
  }

  function initI18n() {
    document.documentElement.classList.add("i18n-pending");
    captureTitleKey();
    return loadJson(LOCALES_BASE + "/ui-languages.json").then(function (manifest) {
      languages = Array.isArray(manifest) ? manifest : [];
      return setLocale(resolveLocale(), { push: false });
    });
  }

  var ready = initI18n().catch(function () {
    applyStaticI18n();
    document.documentElement.classList.remove("i18n-pending");
  });

  window.i18n = {
    t: t,
    get locale() {
      return I18N.locale;
    },
    get dir() {
      return I18N.dir;
    },
    apply: applyStaticI18n,
    setLocale: function (code) {
      return setLocale(code);
    },
    ready: ready,
  };
})();
```
