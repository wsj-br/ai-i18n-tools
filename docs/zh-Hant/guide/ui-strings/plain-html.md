<a id="plain-html-apps"></a>
# 純 HTML 應用程式

若互動式頁面僅維持單一 HTML 檔案，請使用此路徑。`extract` 會將 `data-i18n*` 標記讀入 `strings.json`，`translate-ui` 會為每個語言區域寫入一個扁平的 JSON 套件組合，而瀏覽器指令碼會套用這些字串。同一個指令碼可以為圖片檔名加上後綴，並將連結保留在當前頁面上。

若靜態網站需要為每個語言區域輸出一個已翻譯的 HTML 檔案（無執行階段，並重寫跨頁面連結），請改用 [HTML 頁面](/zh-Hant/guide/documents/html-pages)。一個檔案僅屬於一個路徑。

<a id="quick-start"></a>
## 快速開始

1. 使用 `ai-i18n-tools init -t ui-plain-html` 建立脚手架，或新增下方的設定。
2. 標記來源 HTML（或讓 `mark-html` 自動處理）。
3. 將 `ui.sourceRoots` 和 `ui.uiExtractor.extensions` 指向這些檔案。
4. 執行 `extract`，然後執行 `translate-ui`（或使用 `sync-ui` 同時執行兩者）。
5. 將 `i18n.js` 複製到網頁旁邊，並在您自己的指令碼之前載入它。
6. 透過 HTTP 提供該資料夾。`file://` 無法 `fetch` 地區設定 JSON。

```bash
ai-i18n-tools mark-html public/index.html --write
ai-i18n-tools extract
ai-i18n-tools translate-ui
# Equivalent to the previous two commands:
ai-i18n-tools sync-ui
```

`ai-i18n-tools.config.json` 範例：

```json
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

脚手架也會新增 `translate-ui` 所使用的 LLM [提供者設定](/zh-Hant/guide/providers-and-models)；上方已將其省略，以便讓 HTML 專屬設定保持可見。

`extract` 擁有 `strings.json` 並寫入 `ui-languages.json`；`translate-ui` 擁有目標地區設定 JSON 檔案。請勿手動編輯這些產生的檔案。

`flatOutputDir` 是產生的地區設定檔案所在的位置。指令碼的 `data-locales-base` 必須將該目錄指向為相對於 `i18n.js`（而非網頁）的 URL。在 `public/i18n.js` 上使用 `./locales` 的基底會載入 `public/locales/pt-BR.json`。請使用相對基底，以便網站在部署子路徑下仍能正常運作。

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

請根據您的需求調整指令碼屬性：

| 屬性 | 預設值 | 角色 |
| --- | --- | --- |
| `data-source-locale` | `en` | 保留英文 HTML 並略過套件組合擷取的語言區域 |
| `data-locales-base` | `./locales` | `ui-languages.json` 和 `{locale}.json` 的目錄，根據指令碼 URL 解析 |
| `data-storage-key` | `ai-i18n-locale` | `localStorage` 索引鍵 |
| `data-locale-select` | (無) | 要從資訊清單填入之 `<select>` 的 CSS 選取器 |
| `data-locale-list` | (無) | 要以語言連結填入之元素的 CSS 選取器 |
| `data-label-mode` | `native` | `native`（資訊清單 `label`）、`english`（`englishName`）或 `both`（當它們不同時為 `englishName / label`） |

`window.i18n` 會公開 `t(key)`、`locale`、`dir`、`apply()`、`setLocale(code)` 和 `ready`（一個 Promise）。在您自己的指令碼依賴已解析的地區設定或翻譯值之前，請先等待 `ready`。插入新的標記元素後，請呼叫 `apply()`。

<a id="marking-html-for-translation"></a>
## 標記 HTML 以進行翻譯

建議使用純標記。英文來源文字會保留在元素上，且該文字即為目錄索引鍵。`extract` 會讀取它；執行階段會將翻譯寫回相同的屬性。

- `data-i18n` — 索引鍵為 `textContent`。執行階段會設定 `textContent`。
- `data-i18n-title` — 索引鍵為 `title`。
- `data-i18n-placeholder` — 索引鍵為 `placeholder`。
- `data-i18n-alt` — 索引鍵為 `alt`。
- `data-i18n-aria-label` — 索引鍵為 `aria-label`。

一個元素可以帶有多個這類標記。每個標記都是其自己的目錄項目。

### 文字

將 `data-i18n` 放在內容僅為文字的元素上：

```html
<title data-i18n>Plain HTML demo</title>
<h1 data-i18n>Plain HTML demo</h1>
<button type="button" data-i18n>Apply</button>
<option value="" data-i18n>All locales</option>
<th data-i18n>Filepath</th>
<figcaption data-i18n>Sample usage chart</figcaption>
```

執行階段也會從 `<title>` 元素設定 `document.title`。請勿將 `data-i18n` 放在混合內容的容器上：執行階段會指派 `textContent`，這會移除其子元素。

### 工具提示

```html
<select title="Filter by locale" data-i18n-title></select>
```

控制項可以將其標籤和工具提示翻譯為兩個索引鍵：

```html
<button type="button" title="Clear the filters" data-i18n data-i18n-title>Clear</button>
```

### 預留位置

```html
<input type="search" placeholder="Filename (partial)" data-i18n-placeholder />
```

相同欄位上的預留位置與工具提示：

```html
<input
  type="text"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-placeholder
  data-i18n-title
/>
```

### 替代文字

```html
<img src="chart.png" alt="Sample usage chart" width="577" height="139" data-i18n-alt />
```

### 無障礙名稱

```html
<button type="button" aria-label="Close dialog" data-i18n-aria-label>×</button>
```

按鈕標籤 `×` 沒有 `data-i18n`，因此會維持原樣。無障礙名稱是會被翻譯的字串。

### 混合內容

`data-i18n` 會讀取元素的整個 `textContent`。當句子與其他元素共用同一個父元素時，請將每個文字片段包裝起來：

```html
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers.</span>
</p>
<label for="locale-select">
  <span data-i18n>Language</span>
  <select id="locale-select"></select>
</label>
```

### 僅限來源語言

`data-i18n-ignore` 會在 `mark-html` 和 UI 字串 `extract` 中略過該元素及其子元素。請將其用於範例列、識別碼和品牌名稱：

```html
<a
  href="https://github.com/wsj-br/ai-i18n-tools"
  aria-label="wsj-br/ai-i18n-tools on GitHub"
  data-i18n-ignore
>
  <span>wsj-br/ai-i18n-tools</span>
</a>
<tbody data-i18n-ignore>
  <tr>
    <td>public/index.html</td>
    <td>pt-BR</td>
  </tr>
</tbody>
```

### 不同的目錄索引鍵

具值標記會命名目錄索引鍵。執行階段仍會將翻譯寫入元素（或命名的屬性）上：

```html
<button type="button" data-i18n="Save changes">Save</button>
<img src="chart.png" alt="Chart" data-i18n-alt="Sample usage chart" />
```

`mark-html` 會插入上述的無值標記。除非您傳遞 `--write`，否則這只是一次試執行。它會略過 `data-i18n-ignore` 子樹、類似程式碼的元素（`code`、`pre`、`kbd`、`samp`、`var`），以及空白或純數字的文字。它會回報混合內容的父元素，並留給您使用 `<span data-i18n>` 進行包裝。它絕不會寫入具值標記。

執行階段在首次執行時，會將每個來源索引鍵記錄在內部的 `data-i18n-source` 屬性上，因此後續切換地區設定時仍會查詢英文字串。這些屬性不會被擷取。

<a id="locale-assets"></a>
## 地區設定專屬的圖片與連結

這些標記絕不會傳送給翻譯者。`mark-html` 不會新增這些標記。

- `data-i18n-locale-src` — 無值：`chart.png` 會變成 `chart-pt-BR.png`（地區設定代碼會插入在副檔名之前）。具值：該值為範本。[`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) 會使用 `chart_{locale}.png`，並變成 `chart_pt-BR.png`。
- `data-i18n-locale-href` — 會附加 `?locale=`，使連結維持在相同的 HTML 檔案上。

```html
<img
  src="chart.png"
  alt="Sample usage chart"
  data-i18n-alt
  data-i18n-locale-src="chart_{locale}.png"
/>
<a href="about.html" data-i18n-locale-href>About</a>
```

來源地區設定會保留原始 URL。對於無值 `data-i18n-locale-src`，絕對 URL、通訊協定相對 URL、`data:` URL 和 `#` 片段會保持不變；查詢字串和片段也會維持原位。具值標記會對每個非來源地區設定使用其範本，並僅取代 `{locale}`。如果在在地化影像出現 404 錯誤，執行階段會還原原始 `src` 一次。您必須自行提供 `chart_pt-BR.png`；指令碼不會建立它。

`data-i18n-locale-href` 適用於此目錄模型。指向 `about.pt-BR.html` 的連結屬於 [HTML 頁面](/zh-Hant/guide/documents/html-pages) 管線。

<a id="language-selector"></a>
## 語言選取器

將 `data-locale-select` 指向空的 `<select>`。執行階段會為 `ui-languages.json` 的每一列填入一個 `<option>` (`code`、`label`、`englishName`、`direction`)。變更選取項目會呼叫 `setLocale`，該函數會儲存選項、使用 `history.pushState` 更新 `?locale=` (不重新載入)、擷取套件組合、重新套用每個標記，並設定 `<html lang>` 與 `dir`。「返回」按鈕會重新套用 URL 中的地區設定。

`data-locale-list` 對連結執行相同動作（`lang`、`hreflang`，以及作用中連結上的 `aria-current`）。這些連結會切換目錄頁面；它們不是由文件管線寫入的逐檔案連結。一個指令碼標籤可以設定這兩個選取器：

```html
<label for="locale-select">
  <span data-i18n>Language</span>
  <select id="locale-select" title="Switch UI language" data-i18n-title></select>
</label>
<nav id="locale-list"></nav>
<script
  src="i18n.js"
  data-source-locale="en"
  data-locales-base="./locales"
  data-locale-select="#locale-select"
  data-locale-list="#locale-list"
  data-label-mode="native"
></script>
```

將這兩個控制項保持空白。對於此資訊清單，`data-label-mode="native"` 會將葡萄牙語標記為 `Português (Brasil)`。`english` 會將其標記為 `Portuguese (Brazil)`。`both` 會將其標記為 `Portuguese (Brazil) / Português (Brasil)`，因為這兩個名稱不同，請參閱下方來自 `ui-languages.json` 的程式碼片段：

```json
[
  {
    "code": "en",
    "label": "English",
    "englishName": "English",
    "direction": "ltr"
  },
  {
    "code": "pt-BR",
    "label": "Português (Brasil)",
    "englishName": "Portuguese (Brazil)",
    "direction": "ltr"
  }
]
```

使用 `?locale=pt-BR` 時，執行階段會取代 select 元素的選項和清單的子元素。您在這些元素上設定的屬性會保留：

```html
<select id="locale-select" title="Switch UI language" data-i18n-title>
  <option value="en" lang="en">English</option>
  <option value="pt-BR" lang="pt-BR" selected>Português (Brasil)</option>
</select>
<nav id="locale-list">
  <a href="#" lang="en" hreflang="en">English</a>
  <a href="#" lang="pt-BR" hreflang="pt-BR" aria-current="true">Português (Brasil)</a>
</nav>
```

當該地區設定處於作用中狀態時，`"direction": "rtl"` 列會在 `<html>` 上設定 `dir="rtl"`。

請勿在此機制之外額外透過 `navigator.language` 進行自動重新導向。執行階段僅在 URL 與 `localStorage` 未指定選項時，才會使用瀏覽器語言。忽略 URL 的重新導向會導致難以分享地區設定及爬取頁面。

`ui-languages.json` 是由 `extract` 或 `generate-ui-languages` 寫入至 `languagesManifestPath` (預設為 `{ui.flatOutputDir}/ui-languages.json`)。請參閱[語言切換器與 RTL](/zh-Hant/guide/ui-strings/language-switcher)。

<a id="troubleshooting"></a>
## 疑難排解

| 問題現象 | 檢查項目 |
| --- | --- |
| 地區設定檔案未載入 | 使用本機伺服器開啟網站。`file://` 會封鎖 `fetch`；執行階段會退回到來源文字。 |
| `ui-languages.json` 出現 404 錯誤 | `data-locales-base` 是相對於 `i18n.js`。它必須符合 `flatOutputDir`。 |
| `{locale}.json` 出現 404 錯誤 | 針對該地區設定執行 `translate-ui`，並檢查地區設定代碼是否與其檔案名稱完全相符。 |
| 字串在 `/docs/` 下維持英文 | 同樣的基底路徑問題。請避免在開頭使用 `/`，除非地區設定目錄位於主機根目錄。 |
| 英文短暫閃現後才顯示翻譯 | 在 `<html>` 上新增 `class="i18n-pending"` 以及上述的可見度規則。 |
| 第二次切換時將翻譯後的字串顯示為索引鍵 | 載入已發佈的 `i18n.js`。它會在取代文字前先儲存 `data-i18n-source`。 |
| RTL 版面配置未翻轉 | 資訊清單列需要 `"direction": "rtl"`。執行階段僅會在 `<html>` 上設定 `dir`。 |
| 新的 DOM 節點維持英文 | 請在插入這些節點後呼叫 `window.i18n.apply()`。 |
| 影像在葡萄牙語中維持 `chart.png` | 該元素需要 `data-i18n-locale-src`，且地區設定不得為來源地區設定。 |

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
