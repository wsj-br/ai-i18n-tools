<a id="plain-html-apps"></a>
# Plain HTML apps

Use this path for an interactive page that stays one HTML file. `extract` reads `data-i18n*` markers into `strings.json`, `translate-ui` writes one flat JSON bundle per locale, and a browser script applies the strings. The same script can suffix image filenames and keep links on the current page.

For a static site that should emit one translated HTML file per locale (no runtime, rewritten cross-page links), use [HTML pages](/guide/documents/html-pages) instead. A file belongs to one path.

<a id="quick-start"></a>
## Quick start

1. Mark the English HTML (or let `mark-html` do it).
2. Point `ui.sourceRoots` and `ui.uiExtractor.extensions` at those files.
3. Run `extract`, then `translate-ui`.
4. Copy `i18n.js` next to the page and load it before your own script.
5. Serve the folder over HTTP. `file://` cannot `fetch` the locale JSON.

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

`flatOutputDir` is where `translate-ui` writes `{locale}.json` and `ui-languages.json`. The script's `data-locales-base` must be that directory as a URL relative to `i18n.js` (not the page). A base of `./locales` on `public/i18n.js` loads `public/locales/pt-BR.json`. Use a relative base so the site still works under a subpath.

<a id="obtain-the-runtime"></a>
## Obtain the runtime

`i18n.js` is a classic script (not a module). Copy one of these; they are the same file:

- `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` after you install the package
- [examples/plain-html/public/i18n.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/plain-html/public/i18n.js)
- the listing under [Runtime source](#runtime-source)

Load it at the end of `<body>`, then your own script. Put `class="i18n-pending"` on `<html>` and hide the body while that class is set so the source language does not flash:

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

| Attribute | Default | Role |
| --- | --- | --- |
| `data-source-locale` | `en` | Locale that keeps the English HTML and skips the bundle fetch |
| `data-locales-base` | `./locales` | Directory of `ui-languages.json` and `{locale}.json`, resolved against the script URL |
| `data-storage-key` | `ai-i18n-locale` | `localStorage` key |
| `data-locale-select` | (none) | CSS selector of a `<select>` to fill from the manifest |
| `data-locale-list` | (none) | CSS selector of an element to fill with language links |
| `data-label-mode` | `native` | `native` (manifest `label`), `english` (`englishName`), or `both` (`englishName / label` when they differ) |

`window.i18n` exposes `t(key)`, `locale`, `dir`, `apply()`, `setLocale(code)`, and `ready` (a promise). Call `apply()` after you insert new marked elements.

<a id="marking-html-for-translation"></a>
## Marking HTML for translation

Prefer bare markers. The source text is read from the element, so it is written once:

- `data-i18n` — key is `textContent`. The runtime sets `textContent`.
- `data-i18n-title` — key is `title`.
- `data-i18n-placeholder` — key is `placeholder`.
- `data-i18n-alt` — key is `alt`.
- `data-i18n-aria-label` — key is `aria-label`.

`mark-html` inserts those bare markers. It is a dry run unless you pass `--write`. It skips `data-i18n-ignore` subtrees, code-like elements (`code`, `pre`, `kbd`, `samp`, `var`), and empty or numeric-only text.

Bare `data-i18n` is for a leaf text node. For `Run <code>build</code> now.`, wrap each text run:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

Use a valued marker (`data-i18n="Some key"`) only when the key must differ from the visible text.

The runtime records each source key on an internal `data-i18n-source` attribute the first time it runs, so a later locale switch still looks up the English string. Those attributes are not extracted.

<a id="locale-assets"></a>
## Locale-specific images and links

These markers are never sent to the translator. `mark-html` does not add them.

- `data-i18n-locale-src` — bare: `pic_trulli.jpg` becomes `pic_trulli-pt-BR.jpg` (the locale code is inserted before the extension). Valued: the value is a template, for example `img/{locale}/pic_trulli.jpg`.
- `data-i18n-locale-href` — appends `?locale=` so the link stays on the same HTML file.

```html
<img src="pic_trulli.jpg" alt="Italian Trulli" data-i18n-alt data-i18n-locale-src />
<a href="about.html" data-i18n-locale-href>About</a>
```

The source locale keeps the original URL. Absolute URLs, `data:` URLs, and `#` fragments are left alone. Query strings and fragments on an image path stay in place. If the localized image 404s, the runtime restores the original `src` once. You ship `pic_trulli-pt-BR.jpg` yourself; the script does not create it.

`data-i18n-locale-href` is for this catalog model. A link to `about.pt-BR.html` belongs to the [HTML pages](/guide/documents/html-pages) pipeline.

<a id="language-selector"></a>
## Language selector

Point `data-locale-select` at an empty `<select>`. The runtime fills one `<option>` per row of `ui-languages.json` (`code`, `label`, `englishName`, `direction`). Changing the select calls `setLocale`, which stores the choice, updates `?locale=` with `history.pushState` (no reload), fetches the bundle, reapplies every marker, and sets `<html lang>` and `dir`. The Back button reapplies the locale in the URL.

`data-locale-list` does the same with links (`lang`, `hreflang`, and `aria-current` on the active one). Those links switch the catalog page; they are not the per-file links written by the document pipeline.

Do not auto-redirect by `navigator.language` on top of this. The runtime already uses the browser language only when the URL and `localStorage` have no choice. A redirect that ignores the URL makes it hard to share a locale and to crawl the page.

`ui-languages.json` is written by `extract` or `generate-ui-languages` to `languagesManifestPath` (default `{ui.flatOutputDir}/ui-languages.json`). See [Language switcher & RTL](/guide/ui-strings/language-switcher).

<a id="troubleshooting"></a>
## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Network error, empty page | Open the site with a local server. `file://` blocks `fetch`. |
| 404 on `ui-languages.json` | `data-locales-base` is relative to `i18n.js`. It must match `flatOutputDir`. |
| Strings stay English under `/docs/` | Same base-path issue. Avoid a leading `/` unless the locales directory is at the host root. |
| English flashes, then translates | Add `class="i18n-pending"` on `<html>` and the visibility rule above. |
| Second switch shows the translated string as the key | Load the shipped `i18n.js`. It stores `data-i18n-source` before replacing text. |
| RTL layout does not flip | The manifest row needs `"direction": "rtl"`. The runtime sets `dir` on `<html>` only. |
| New DOM nodes stay English | Call `window.i18n.apply()` after inserting them. |
| Image stays `pic_trulli.jpg` in Portuguese | The element needs `data-i18n-locale-src`, and the locale must not be the source locale. |

`normalizeI18nText` in the runtime matches `normalizeI18nText` in [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts): trim, then collapse whitespace. Because the English source text is the catalog key, a missing translation falls back to English.

The runnable demo is [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/). `pnpm dev` serves it at [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR).

<a id="runtime-source"></a>
## Runtime source

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

