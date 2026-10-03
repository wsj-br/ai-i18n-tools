<a id="plain-html-apps"></a>
# プレーンなHTMLアプリ

1つのHTMLファイルのままで動作するインタラクティブページには、このパスを使用します。`extract`は`data-i18n*`マーカーを`strings.json`に読み込み、`translate-ui`はロケールごとに1つのフラットなJSONバンドルを書き出し、ブラウザースクリプトが文字列を適用します。同じスクリプトで画像ファイル名にサフィックスを付け、現在のページへのリンクを維持できます。

ロケールごとに翻訳済みのHTMLファイルを1つ出力する必要がある静的サイト（ランタイムなし、ページ間リンクの書き換えあり）には、代わりに[HTMLページ](/ja/guide/documents/html-pages)を使用します。1つのファイルは1つのパスに属します。

<a id="quick-start"></a>
## クイックスタート

1. 英語のHTMLにマークを付けます（または`mark-html`に任せます）。
2. `ui.sourceRoots`と`ui.uiExtractor.extensions`をそれらのファイルに向けます。
3. `extract`を実行し、次に`translate-ui`を実行します。
4. `i18n.js`をページの隣にコピーし、独自のスクリプトより前に読み込みます。
5. フォルダーをHTTP経由で配信します。`file://`はロケールJSONを`fetch`できません。

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

`flatOutputDir`は、`translate-ui`が`{locale}.json`と`ui-languages.json`を書き込む場所です。スクリプトの`data-locales-base`は、`i18n.js`（ページではありません）に対する相対URLとしてのそのディレクトリである必要があります。`public/i18n.js`上の`./locales`のベースは`public/locales/pt-BR.json`を読み込みます。サイトがサブパス下でも引き続き機能するように、相対ベースを使用してください。

<a id="obtain-the-runtime"></a>
## ランタイムの取得

`i18n.js`はクラシックスクリプト（モジュールではありません）です。これらは同じファイルなので、いずれか1つをコピーしてください。

- パッケージインストール後の`node_modules/ai-i18n-tools/dist/html-runtime/i18n.js`
- [examples/plain-html/public/i18n.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/plain-html/public/i18n.js)
- [ランタイムソース](#runtime-source)の下のリスト

`<body>`の最後にそれを読み込み、次に独自のスクリプトを読み込みます。`<html>`に`class="i18n-pending"`を配置し、そのクラスが設定されている間はbodyを非表示にして、ソース言語がちらつかないようにします。

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

| 属性 | デフォルト | 役割 |
| --- | --- | --- |
| `data-source-locale` | `en` | 英語のHTMLを保持し、バンドルのフェッチをスキップするロケール |
| `data-locales-base` | `./locales` | スクリプトURLに対して解決される`ui-languages.json`と`{locale}.json`のディレクトリ |
| `data-storage-key` | `ai-i18n-locale` | `localStorage`キー |
| `data-locale-select` | （なし） | マニフェストから入力する`<select>`のCSSセレクター |
| `data-locale-list` | （なし） | 言語リンクを入力する要素のCSSセレクター |
| `data-label-mode` | `native` | `native`（マニフェスト`label`）、`english`（`englishName`）、または`both`（異なる場合は`englishName / label`） |

`window.i18n`は、`t(key)`、`locale`、`dir`、`apply()`、`setLocale(code)`、および`ready`（プロミス）を公開します。新しいマーク付き要素を挿入した後に`apply()`を呼び出します。

<a id="marking-html-for-translation"></a>
## 翻訳のためのHTMLのマーク付け

ベアマーカーを優先します。ソーステキストは要素から読み取られるため、1回だけ記述されます。

- `data-i18n` — キーは`textContent`です。ランタイムが`textContent`を設定します。
- `data-i18n-title` — キーは`title`です。
- `data-i18n-placeholder` — キーは`placeholder`です。
- `data-i18n-alt` — キーは`alt`です。
- `data-i18n-aria-label` — キーは`aria-label`です。

`mark-html`はそれらのベアマーカーを挿入します。`--write`を渡さない限り、ドライランとなります。`data-i18n-ignore`サブツリー、コードのような要素（`code`、`pre`、`kbd`、`samp`、`var`）、および空または数値のみのテキストをスキップします。

値を持たない `data-i18n` はリーフテキストノード用です。`Run <code>build</code> now.` の場合は、各テキストランを次のようにラップします。

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

値付きマーカー (`data-i18n="Some key"`) は、キーが表示テキストと異なる必要がある場合にのみ使用します。

ランタイムは、最初の実行時に各ソースキーを内部の `data-i18n-source` 属性に記録するため、後でロケールを切り替えても英語の文字列が検索されます。これらの属性は抽出されません。

<a id="locale-assets"></a>
## ロケール固有の画像とリンク

これらのマーカーが翻訳者に送信されることはありません。`mark-html` によって追加されることもありません。

- `data-i18n-locale-src` — 値なし: `pic_trulli.jpg` は `pic_trulli-pt-BR.jpg` になります（ロケールコードが拡張子の前に挿入されます）。値あり: 値はテンプレートです（例: `img/{locale}/pic_trulli.jpg`）。
- `data-i18n-locale-href` — `?locale=` を追加して、リンクが同じ HTML ファイル内にとどまるようにします。

```html
<img src="pic_trulli.jpg" alt="Italian Trulli" data-i18n-alt data-i18n-locale-src />
<a href="about.html" data-i18n-locale-href>About</a>
```

ソースロケールでは元の URL が保持されます。絶対 URL、`data:` URL、および `#` フラグメントはそのままにしておきます。画像パスのクエリ文字列とフラグメントもそのまま維持されます。ローカライズされた画像で 404 エラーが発生した場合、ランタイムは元の `src` を一度だけ復元します。`pic_trulli-pt-BR.jpg` は自分でデプロイします。スクリプトによって作成されることはありません。

`data-i18n-locale-href` はこのカタログモデル用です。`about.pt-BR.html` へのリンクは [HTML ページ](/ja/guide/documents/html-pages) パイプラインに属します。

<a id="language-selector"></a>
## 言語セレクター

`data-locale-select` を空の `<select>` に向けます。ランタイムは `ui-languages.json` の各行に対して 1 つの `<option>` を生成します（`code`、`label`、`englishName`、`direction`）。セレクトボックスを変更すると `setLocale` が呼び出され、選択内容が保存され、`?locale=` が `history.pushState` で更新され（リロードなし）、バンドルがフェッチされ、すべてのマーカーが再適用され、`<html lang>` と `dir` が設定されます。戻るボタンは URL 内のロケールを再適用します。

`data-locale-list` はリンクでも同様の処理を行います（`lang`、`hreflang`、およびアクティブなリンク上の `aria-current`）。これらのリンクはカタログページを切り替えるものであり、ドキュメントパイプラインによって書き込まれるファイルごとのリンクではありません。

これに加えて `navigator.language` による自動リダイレクトは行わないでください。ランタイムは、URL と `localStorage` に選択肢がない場合にのみ、すでにブラウザの言語を使用しています。URL を無視するリダイレクトを行うと、ロケールの共有やページのクロールが困難になります。

`ui-languages.json` は `extract` または `generate-ui-languages` によって `languagesManifestPath` に書き込まれます（デフォルトは `{ui.flatOutputDir}/ui-languages.json`）。[言語スイッチャーと RTL](/ja/guide/ui-strings/language-switcher) を参照してください。

<a id="troubleshooting"></a>
## トラブルシューティング

| 症状 | 確認事項 |
| --- | --- |
| ネットワークエラー、空白のページ | ローカルサーバーでサイトを開きます。`file://` は `fetch` をブロックします。 |
| `ui-languages.json` で 404 エラー | `data-locales-base` は `i18n.js` に対する相対パスです。`flatOutputDir` と一致する必要があります。 |
| `/docs/` の下で文字列が英語のままになる | 同じベースパスの問題です。ロケールディレクトリがホストのルートにない限り、先頭の `/` は避けてください。 |
| 英語が一瞬表示されてから翻訳される | `<html>` に `class="i18n-pending"` と上記の可視性ルールを追加します。 |
| 2 回目の切り替えで翻訳された文字列がキーとして表示される | デプロイされた `i18n.js` を読み込みます。テキストを置換する前に `data-i18n-source` を保存します。 |
| RTL レイアウトが反転しない | マニフェスト行に `"direction": "rtl"` が必要です。ランタイムは `<html>` に対してのみ `dir` を設定します。 |
| 新しい DOM ノードが英語のままになる | それらを挿入した後に `window.i18n.apply()` を呼び出します。 |
| ポルトガル語で画像が `pic_trulli.jpg` のままになる | 要素には `data-i18n-locale-src` が必要であり、ロケールはソースロケール以外である必要があります。 |

ランタイムの `normalizeI18nText` は [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) の `normalizeI18nText` と一致します: トリムしてから、連続する空白を1つにまとめます。英語のソーステキストがカタログキーであるため、翻訳が欠落している場合は英語にフォールバックします。

実行可能なデモは [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) です。`pnpm dev` は [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) でこれを配信します。

<a id="runtime-source"></a>
## ランタイムソース

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
