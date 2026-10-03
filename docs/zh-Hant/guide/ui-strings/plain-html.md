<a id="plain-html-apps"></a>
# 純 HTML 應用程式

若互動式頁面僅維持單一 HTML 檔案，請使用此路徑。`extract` 會將 `data-i18n*` 標記讀入 `strings.json`，`translate-ui` 會為每個語言區域寫入一個扁平的 JSON 套件組合，而瀏覽器指令碼會套用這些字串。同一個指令碼可以為圖片檔名加上後綴，並將連結保留在當前頁面上。

若靜態網站需要為每個語言區域輸出一個已翻譯的 HTML 檔案（無執行階段，並重寫跨頁面連結），請改用 [HTML 頁面](/zh-Hant/guide/documents/html-pages)。一個檔案僅屬於一個路徑。

<a id="quick-start"></a>
## 快速開始

1. 標記英文 HTML（或讓 `mark-html` 執行此動作）。
2. 將 `ui.sourceRoots` 和 `ui.uiExtractor.extensions` 指向這些檔案。
3. 執行 `extract`，然後執行 `translate-ui`。
4. 將 `i18n.js` 複製到頁面旁邊，並在您自己的指令碼之前載入它。
5. 透過 HTTP 提供該資料夾。`file://` 無法 `fetch` 語言區域 JSON。

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

`flatOutputDir` 是 `translate-ui` 寫入 `{locale}.json` 和 `ui-languages.json` 的位置。指令碼的 `data-locales-base` 必須是該目錄，作為相對於 `i18n.js`（而非頁面）的 URL。在 `public/i18n.js` 上使用 `./locales` 的基底會載入 `public/locales/pt-BR.json`。請使用相對基底，以便網站在子路徑下仍能正常運作。

<a id="obtain-the-runtime"></a>
## 取得執行階段

`i18n.js` 是傳統指令碼（非模組）。請複製其中一個；它們是相同的檔案：

- 安裝套件後的 `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js`
- [examples/plain-html/public/i18n.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/plain-html/public/i18n.js)
- [執行階段原始碼](#runtime-source) 下的清單

在 `<body>` 的結尾載入它，然後再載入您自己的指令碼。將 `class="i18n-pending"` 放在 `<html>` 上，並在設定該類別時隱藏主體，以免來源語言閃爍：

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

| 屬性 | 預設值 | 角色 |
| --- | --- | --- |
| `data-source-locale` | `en` | 保留英文 HTML 並略過套件組合擷取的語言區域 |
| `data-locales-base` | `./locales` | `ui-languages.json` 和 `{locale}.json` 的目錄，根據指令碼 URL 解析 |
| `data-storage-key` | `ai-i18n-locale` | `localStorage` 索引鍵 |
| `data-locale-select` | (無) | 要從資訊清單填入之 `<select>` 的 CSS 選取器 |
| `data-locale-list` | (無) | 要以語言連結填入之元素的 CSS 選取器 |
| `data-label-mode` | `native` | `native`（資訊清單 `label`）、`english`（`englishName`）或 `both`（當它們不同時為 `englishName / label`） |

`window.i18n` 會公開 `t(key)`、`locale`、`dir`、`apply()`、`setLocale(code)` 和 `ready`（一個 Promise）。在插入新的標記元素後，請呼叫 `apply()`。

<a id="marking-html-for-translation"></a>
## 標記 HTML 以進行翻譯

建議使用裸標記。來源文字是從元素讀取的，因此只需寫入一次：

- `data-i18n` — 索引鍵為 `textContent`。執行階段會設定 `textContent`。
- `data-i18n-title` — 索引鍵為 `title`。
- `data-i18n-placeholder` — 索引鍵為 `placeholder`。
- `data-i18n-alt` — 索引鍵為 `alt`。
- `data-i18n-aria-label` — 索引鍵為 `aria-label`。

`mark-html` 會插入這些裸標記。除非您傳遞 `--write`，否則這是一次試執行。它會略過 `data-i18n-ignore` 子樹狀結構、類似程式碼的元素（`code`、`pre`、`kbd`、`samp`、`var`），以及空白或僅含數字的文字。

單純的 `data-i18n` 用於葉文字節點。對於 `Run <code>build</code> now.`，請包覆每個文字片段：

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

僅當索引鍵必須與可見文字不同時，才使用帶值標記 (`data-i18n="Some key"`)。

執行階段在首次執行時，會將每個來源索引鍵記錄在內部的 `data-i18n-source` 屬性上，因此後續切換地區設定時仍會查詢英文字串。這些屬性不會被擷取。

<a id="locale-assets"></a>
## 地區設定專屬的圖片與連結

這些標記絕不會傳送給翻譯者。`mark-html` 不會新增這些標記。

- `data-i18n-locale-src` — 單純：`pic_trulli.jpg` 會變成 `pic_trulli-pt-BR.jpg` (地區設定代碼會插入在副檔名之前)。帶值：值為範本，例如 `img/{locale}/pic_trulli.jpg`。
- `data-i18n-locale-href` — 附加 `?locale=`，讓連結維持指向同一個 HTML 檔案。

```html
<img src="pic_trulli.jpg" alt="Italian Trulli" data-i18n-alt data-i18n-locale-src />
<a href="about.html" data-i18n-locale-href>About</a>
```

來源地區設定會保留原始 URL。絕對 URL、`data:` URL 和 `#` 片段皆維持原樣。圖片路徑上的查詢字串與片段會保留在原位。若當地語系化的圖片發生 404 錯誤，執行階段會還原原始的 `src` 一次。您必須自行提供 `pic_trulli-pt-BR.jpg`；指令碼不會自動建立。

`data-i18n-locale-href` 適用於此目錄模型。指向 `about.pt-BR.html` 的連結屬於 [HTML 頁面](/zh-Hant/guide/documents/html-pages) 管線。

<a id="language-selector"></a>
## 語言選取器

將 `data-locale-select` 指向空的 `<select>`。執行階段會為 `ui-languages.json` 的每一列填入一個 `<option>` (`code`、`label`、`englishName`、`direction`)。變更選取項目會呼叫 `setLocale`，該函數會儲存選項、使用 `history.pushState` 更新 `?locale=` (不重新載入)、擷取套件組合、重新套用每個標記，並設定 `<html lang>` 與 `dir`。「返回」按鈕會重新套用 URL 中的地區設定。

`data-locale-list` 對連結執行相同動作 (`lang`、`hreflang`，以及作用中連結上的 `aria-current`)。這些連結會切換目錄頁面；它們並非由文件管線所寫入的各檔案連結。

請勿在此機制之外額外透過 `navigator.language` 進行自動重新導向。執行階段僅在 URL 與 `localStorage` 未指定選項時，才會使用瀏覽器語言。忽略 URL 的重新導向會導致難以分享地區設定及爬取頁面。

`ui-languages.json` 是由 `extract` 或 `generate-ui-languages` 寫入至 `languagesManifestPath` (預設為 `{ui.flatOutputDir}/ui-languages.json`)。請參閱[語言切換器與 RTL](/zh-Hant/guide/ui-strings/language-switcher)。

<a id="troubleshooting"></a>
## 疑難排解

| 問題現象 | 檢查項目 |
| --- | --- |
| 網路錯誤、空白頁面 | 使用本機伺服器開啟網站。`file://` 會封鎖 `fetch`。 |
| `ui-languages.json` 出現 404 錯誤 | `data-locales-base` 是相對於 `i18n.js`。它必須符合 `flatOutputDir`。 |
| 字串在 `/docs/` 下維持英文 | 同樣的基底路徑問題。請避免在開頭使用 `/`，除非地區設定目錄位於主機根目錄。 |
| 英文短暫閃現後才顯示翻譯 | 在 `<html>` 上新增 `class="i18n-pending"` 以及上述的可見度規則。 |
| 第二次切換時將翻譯後的字串顯示為索引鍵 | 載入已發佈的 `i18n.js`。它會在取代文字前先儲存 `data-i18n-source`。 |
| RTL 版面配置未翻轉 | 資訊清單列需要 `"direction": "rtl"`。執行階段僅會在 `<html>` 上設定 `dir`。 |
| 新的 DOM 節點維持英文 | 請在插入這些節點後呼叫 `window.i18n.apply()`。 |
| 圖片在葡萄牙文中維持 `pic_trulli.jpg` | 該元素需要 `data-i18n-locale-src`，且地區設定不得為來源地區設定。 |

執行階段的 `normalizeI18nText` 會比對 [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) 中的 `normalizeI18nText`：先去除首尾空白，再合併空白字元。由於英文來源文字是目錄鍵，缺少的翻譯會回退至英文。

可執行的範例為 [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/)。`pnpm dev` 會於 [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) 提供此服務。

<a id="runtime-source"></a>
## 執行階段來源

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
