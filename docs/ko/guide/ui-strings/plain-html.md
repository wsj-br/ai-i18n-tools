<a id="plain-html-apps"></a>
# 일반 HTML 앱

단일 HTML 파일로 유지되는 인터랙티브 페이지에 이 경로를 사용하십시오. `extract`은(는) `data-i18n*` 마커를 `strings.json`(으)로 읽어들이고, `translate-ui`은(는) 로캘별로 하나의 플랫 JSON 번들을 생성하며, 브라우저 스크립트가 문자열을 적용합니다. 이 스크립트를 사용하면 이미지 파일 이름에 접미사를 추가하고 현재 페이지의 링크를 유지할 수도 있습니다.

로캘별로 번역된 HTML 파일을 하나씩 생성해야 하는 정적 사이트(런타임 없음, 페이지 간 링크 재작성)에는 대신 [HTML 페이지](/ko/guide/documents/html-pages)를 사용하십시오. 하나의 파일은 하나의 경로에 속합니다.

<a id="quick-start"></a>
## 빠른 시작

1. 영어 HTML에 마커를 지정합니다(또는 `mark-html`이(가) 수행하도록 합니다).
2. `ui.sourceRoots` 및 `ui.uiExtractor.extensions`의 대상을 해당 파일로 지정합니다.
3. `extract`을(를) 실행한 다음 `translate-ui`을(를) 실행합니다.
4. `i18n.js`을(를) 페이지와 동일한 위치에 복사하고 자체 스크립트보다 먼저 로드합니다.
5. HTTP를 통해 폴더를 서비스합니다. `file://`은(는) 로캘 JSON을 `fetch`할 수 없습니다.

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

`flatOutputDir`은(는) `translate-ui`이(가) `{locale}.json` 및 `ui-languages.json`을(를) 기록하는 위치입니다. 스크립트의 `data-locales-base`은(는) `i18n.js`(페이지가 아님) 기준 상대 URL로 해당 디렉터리를 가리켜야 합니다. `public/i18n.js`에서 `./locales` 기준 경로는 `public/locales/pt-BR.json`을(를) 로드합니다. 사이트가 하위 경로에서도 계속 작동하도록 상대 기준 경로를 사용하십시오.

<a id="obtain-the-runtime"></a>
## 런타임 가져오기

`i18n.js`은(는) 클래식 스크립트입니다(모듈이 아님). 다음 중 하나를 복사하십시오. 모두 동일한 파일입니다.

- 패키지 설치 후 `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js`
- [examples/plain-html/public/i18n.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/plain-html/public/i18n.js)
- [런타임 소스](#runtime-source) 아래의 목록

`<body>`의 끝부분에서 로드한 다음 자체 스크립트를 로드합니다. `<html>`에 `class="i18n-pending"`을(를) 추가하고 해당 클래스가 설정되어 있는 동안 본문을 숨겨 원본 언어가 잠깐 표시되지 않도록 합니다.

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

| 속성 | 기본값 | 역할 |
| --- | --- | --- |
| `data-source-locale` | `en` | 영어 HTML을 유지하고 번들 가져오기를 건너뛰는 로캘 |
| `data-locales-base` | `./locales` | 스크립트 URL을 기준으로 확인되는 `ui-languages.json` 및 `{locale}.json`의 디렉터리 |
| `data-storage-key` | `ai-i18n-locale` | `localStorage` 키 |
| `data-locale-select` | (없음) | 매니페스트에서 채울 `<select>`의 CSS 선택기 |
| `data-locale-list` | (없음) | 언어 링크로 채울 요소의 CSS 선택기 |
| `data-label-mode` | `native` | `native`(매니페스트 `label`), `english`(`englishName`) 또는 `both`(다른 경우 `englishName / label`) |

`window.i18n`은(는) `t(key)`, `locale`, `dir`, `apply()`, `setLocale(code)` 및 `ready`(Promise)를 노출합니다. 마커가 지정된 새 요소를 삽입한 후 `apply()`을(를) 호출하십시오.

<a id="marking-html-for-translation"></a>
## 번역을 위한 HTML 마킹

기본 마커를 사용하는 것이 좋습니다. 원본 텍스트는 요소에서 읽히므로 한 번만 작성하면 됩니다.

- `data-i18n` — 키는 `textContent`입니다. 런타임이 `textContent`을(를) 설정합니다.
- `data-i18n-title` — 키는 `title`입니다.
- `data-i18n-placeholder` — 키는 `placeholder`입니다.
- `data-i18n-alt` — 키는 `alt`입니다.
- `data-i18n-aria-label` — 키는 `aria-label`입니다.

`mark-html`은(는) 이러한 기본 마커를 삽입합니다. `--write`을(를) 전달하지 않는 한 시험 실행으로 간주됩니다. `data-i18n-ignore` 하위 트리, 코드 유사 요소(`code`, `pre`, `kbd`, `samp`, `var`) 및 비어 있거나 숫자로만 구성된 텍스트는 건너뜁니다.

기본 `data-i18n`은 리프 텍스트 노드용입니다. `Run <code>build</code> now.`의 경우 각 텍스트 런을 래핑합니다:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

값이 있는 마커(`data-i18n="Some key"`)는 키가 표시되는 텍스트와 달라야 할 때만 사용하십시오.

런타임은 처음 실행될 때 각 소스 키를 내부 `data-i18n-source` 속성에 기록하므로, 나중에 로케일을 전환해도 여전히 영어 문자열을 조회합니다. 이러한 속성은 추출되지 않습니다.

<a id="locale-assets"></a>
## 로케일별 이미지 및 링크

이러한 마커는 번역기로 전송되지 않습니다. `mark-html`은 이를 추가하지 않습니다.

- `data-i18n-locale-src` — 기본: `pic_trulli.jpg`은 `pic_trulli-pt-BR.jpg`이 됩니다(로케일 코드가 확장자 앞에 삽입됨). 값 지정: 값은 템플릿이며, 예를 들어 `img/{locale}/pic_trulli.jpg`입니다.
- `data-i18n-locale-href` — `?locale=`을 추가하여 링크가 동일한 HTML 파일에 유지되도록 합니다.

```html
<img src="pic_trulli.jpg" alt="Italian Trulli" data-i18n-alt data-i18n-locale-src />
<a href="about.html" data-i18n-locale-href>About</a>
```

소스 로케일은 원본 URL을 유지합니다. 절대 URL, `data:` URL 및 `#` 프래그먼트는 그대로 유지됩니다. 이미지 경로의 쿼리 문자열과 프래그먼트는 제자리에 유지됩니다. 지역화된 이미지에서 404 오류가 발생하면 런타임이 원본 `src`을 한 번 복원합니다. `pic_trulli-pt-BR.jpg`은 직접 배포해야 하며 스크립트에서 생성하지 않습니다.

`data-i18n-locale-href`은 이 카탈로그 모델용입니다. `about.pt-BR.html`에 대한 링크는 [HTML 페이지](/ko/guide/documents/html-pages) 파이프라인에 속합니다.

<a id="language-selector"></a>
## 언어 선택기

`data-locale-select`을 빈 `<select>`에 지정합니다. 런타임은 `ui-languages.json`의 행당 하나의 `<option>`을 채웁니다(`code`, `label`, `englishName`, `direction`). 선택 항목을 변경하면 `setLocale`이 호출되어 선택 항목을 저장하고, `?locale=`을 `history.pushState`으로 업데이트하며(다시 로드 없음), 번들을 가져오고, 모든 마커를 다시 적용하고, `<html lang>` 및 `dir`를 설정합니다. 뒤로 버튼은 URL의 로케일을 다시 적용합니다.

`data-locale-list`은 링크(`lang`, `hreflang` 및 활성 링크의 `aria-current`)에 대해서도 동일한 작업을 수행합니다. 이러한 링크는 카탈로그 페이지를 전환하며, 문서 파이프라인에서 작성된 파일별 링크가 아닙니다.

이 외에 `navigator.language`을 통한 자동 리디렉션을 설정하지 마십시오. 런타임은 URL과 `localStorage`에 선택 항목이 없을 때만 브라우저 언어를 사용하도록 이미 설정되어 있습니다. URL을 무시하는 리디렉션은 로케일 공유 및 페이지 크롤링을 어렵게 만듭니다.

`ui-languages.json`은 `extract` 또는 `generate-ui-languages`에 의해 `languagesManifestPath`에 기록됩니다(기본값 `{ui.flatOutputDir}/ui-languages.json`). [언어 전환기 및 RTL](/ko/guide/ui-strings/language-switcher)을 참조하십시오.

<a id="troubleshooting"></a>
## 문제 해결

| 증상 | 확인할 사항 |
| --- | --- |
| 네트워크 오류, 빈 페이지 | 로컬 서버로 사이트를 엽니다. `file://`이 `fetch`을 차단합니다. |
| `ui-languages.json`에서 404 오류 | `data-locales-base`은 `i18n.js`에 대한 상대 경로입니다. `flatOutputDir`과 일치해야 합니다. |
| `/docs/`에서 문자열이 영어로 유지됨 | 동일한 기본 경로 문제입니다. 로케일 디렉토리가 호스트 루트에 있지 않은 한 선행 `/`을 사용하지 마십시오. |
| 영어가 잠깐 표시된 후 번역됨 | `<html>`에 `class="i18n-pending"`을 추가하고 위의 가시성 규칙을 적용합니다. |
| 두 번째 전환 시 번역된 문자열이 키로 표시됨 | 배포된 `i18n.js`을 로드하십시오. 텍스트를 대체하기 전에 `data-i18n-source`을 저장합니다. |
| RTL 레이아웃이 반전되지 않음 | 매니페스트 행에 `"direction": "rtl"`이 필요합니다. 런타임은 `<html>`에만 `dir`을 설정합니다. |
| 새 DOM 노드가 영어로 유지됨 | 노드를 삽입한 후 `window.i18n.apply()`을 호출하십시오. |
| 포르투갈어에서 이미지가 `pic_trulli.jpg`로 유지됨 | 요소에 `data-i18n-locale-src`이(가) 필요하며, 로케일은 소스 로케일이 아니어야 합니다. |

런타임의 `normalizeI18nText`이(가) [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts)의 `normalizeI18nText`과(와) 일치합니다: 공백을 트리밍한 다음 연속 공백을 축소합니다. 영어 소스 텍스트가 카탈로그 키로 사용되므로, 번역이 누락된 경우 영어로 폴백됩니다.

실행 가능한 데모는 [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/)입니다. `pnpm dev`이(가) [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR)에서 이를 제공합니다.

<a id="runtime-source"></a>
## 런타임 소스

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
