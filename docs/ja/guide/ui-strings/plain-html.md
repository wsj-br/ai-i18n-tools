<a id="plain-html-apps"></a>
# プレーンなHTMLアプリ

1つのHTMLファイルのままで動作するインタラクティブページには、このパスを使用します。`extract`は`data-i18n*`マーカーを`strings.json`に読み込み、`translate-ui`はロケールごとに1つのフラットなJSONバンドルを書き出し、ブラウザースクリプトが文字列を適用します。同じスクリプトで画像ファイル名にサフィックスを付け、現在のページへのリンクを維持できます。

ロケールごとに翻訳済みのHTMLファイルを1つ出力する必要がある静的サイト（ランタイムなし、ページ間リンクの書き換えあり）には、代わりに[HTMLページ](/ja/guide/documents/html-pages)を使用します。1つのファイルは1つのパスに属します。

<a id="quick-start"></a>
## クイックスタート

1. `ai-i18n-tools init -t ui-plain-html`でスキャフォールディングを行うか、以下の設定を追加します。
2. ソースHTMLにマークを付けます（または`mark-html`に任せます）。
3. `ui.sourceRoots`と`ui.uiExtractor.extensions`をそれらのファイルに向けます。
4. `extract`を実行し、次に`translate-ui`を実行します（または`sync-ui`で両方を実行します）。
5. `i18n.js`をページと同じディレクトリにコピーし、独自のスクリプトより前に読み込みます。
6. フォルダをHTTP経由で配信します。`file://`はロケールJSONを`fetch`できません。

```bash
ai-i18n-tools mark-html public/index.html --write
ai-i18n-tools extract
ai-i18n-tools translate-ui
# Equivalent to the previous two commands:
ai-i18n-tools sync-ui
```

`ai-i18n-tools.config.json`の例:

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

スキャフォールドでは、`translate-ui`が使用するLLMの[プロバイダー設定](/ja/guide/providers-and-models)も追加されます。HTML固有の設定を見やすくするため、上記では省略されています。

`extract`は`strings.json`を管理し、`ui-languages.json`を書き込みます。`translate-ui`はターゲットロケールのJSONファイルを管理します。これらの生成されたファイルを手動で編集しないでください。

`flatOutputDir`は、生成されたロケールファイルが格納される場所です。スクリプトの`data-locales-base`は、`i18n.js`（ページではなく）からの相対URLとしてそのディレクトリを指す必要があります。`public/i18n.js`上の`./locales`のベースは`public/locales/pt-BR.json`を読み込みます。デプロイメントのサブパス下でもサイトが正常に動作するように、相対ベースを使用してください。

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

必要に応じてスクリプトの属性を調整してください:

| 属性 | デフォルト | 役割 |
| --- | --- | --- |
| `data-source-locale` | `en` | 英語のHTMLを保持し、バンドルのフェッチをスキップするロケール |
| `data-locales-base` | `./locales` | スクリプトURLに対して解決される`ui-languages.json`と`{locale}.json`のディレクトリ |
| `data-storage-key` | `ai-i18n-locale` | `localStorage`キー |
| `data-locale-select` | （なし） | マニフェストから入力する`<select>`のCSSセレクター |
| `data-locale-list` | （なし） | 言語リンクを入力する要素のCSSセレクター |
| `data-label-mode` | `native` | `native`（マニフェスト`label`）、`english`（`englishName`）、または`both`（異なる場合は`englishName / label`） |

`window.i18n`は、`t(key)`、`locale`、`dir`、`apply()`、`setLocale(code)`、および`ready`（プロミス）を公開します。独自のスクリプトが解決されたロケールまたは翻訳された値に依存する前に、`ready`を待機してください。新しいマーク付き要素を挿入した後に、`apply()`を呼び出します。

<a id="marking-html-for-translation"></a>
## 翻訳のためのHTMLのマーク付け

ベアマーカーを優先してください。英語のソーステキストは要素に残り、そのテキストがカタログキーとなります。`extract`がそれを読み取り、ランタイムが同じプロパティに翻訳を書き戻します。

- `data-i18n` — キーは`textContent`です。ランタイムが`textContent`を設定します。
- `data-i18n-title` — キーは`title`です。
- `data-i18n-placeholder` — キーは`placeholder`です。
- `data-i18n-alt` — キーは`alt`です。
- `data-i18n-aria-label` — キーは`aria-label`です。

1つの要素にこれらのマーカーを複数含めることができます。各マーカーは個別のカタログエントリとなります。

<a id="text"></a>
### テキスト

コンテンツがテキストのみの要素に`data-i18n`を配置します:

```html
<title data-i18n>Plain HTML demo</title>
<h1 data-i18n>Plain HTML demo</h1>
<button type="button" data-i18n>Apply</button>
<option value="" data-i18n>All locales</option>
<th data-i18n>Filepath</th>
<figcaption data-i18n>Sample usage chart</figcaption>
```

ランタイムは`<title>`要素から`document.title`も設定します。混合コンテンツのコンテナに`data-i18n`を配置しないでください。ランタイムが`textContent`を割り当て、子要素が削除されてしまいます。

<a id="tooltip"></a>
### ツールチップ

```html
<select title="Filter by locale" data-i18n-title></select>
```

コントロールは、ラベルとツールチップを2つのキーとして翻訳できます:

```html
<button type="button" title="Clear the filters" data-i18n data-i18n-title>Clear</button>
```

<a id="placeholder"></a>
### プレースホルダー

```html
<input type="search" placeholder="Filename (partial)" data-i18n-placeholder />
```

同じフィールド上のプレースホルダーとツールチップ:

```html
<input
  type="text"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-placeholder
  data-i18n-title
/>
```

<a id="alt-text"></a>
### 代替テキスト

```html
<img src="chart.png" alt="Sample usage chart" width="577" height="139" data-i18n-alt />
```

<a id="accessible-name"></a>
### アクセシブル名

```html
<button type="button" aria-label="Close dialog" data-i18n-aria-label>×</button>
```

ボタンラベル`×`には`data-i18n`がないため、記述されたままになります。アクセシブル名は翻訳される文字列です。

<a id="mixed-content"></a>
### 混合コンテンツ

`data-i18n`は要素の`textContent`全体を読み取ります。文が他の要素と親を共有している場合は、各テキストランをラップします:

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

<a id="source-language-only"></a>
### ソース言語のみ

`data-i18n-ignore`は、`mark-html`とUI文字列の`extract`の両方について、その要素とその子孫をスキップします。サンプル行、識別子、ブランド名に使用します:

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

<a id="a-different-catalog-key"></a>
### 別のカタログキー

値付きマーカーはカタログキーを指定します。ランタイムは引き続き要素（または指定された属性）に翻訳を書き込みます:

```html
<button type="button" data-i18n="Save changes">Save</button>
<img src="chart.png" alt="Chart" data-i18n-alt="Sample usage chart" />
```

`mark-html`は上記のベアマーカーを挿入します。`--write`を渡さない限り、これはドライランです。`data-i18n-ignore`サブツリー、コードのような要素（`code`、`pre`、`kbd`、`samp`、`var`）、および空または数値のみのテキストをスキップします。混合コンテンツの親を報告し、`<span data-i18n>`でラップするために残します。値付きマーカーを書き込むことはありません。

ランタイムは、最初の実行時に各ソースキーを内部の `data-i18n-source` 属性に記録するため、後でロケールを切り替えても英語の文字列が検索されます。これらの属性は抽出されません。

<a id="locale-specific-images-and-links"></a>
## ロケール固有の画像とリンク

これらのマーカーが翻訳者に送信されることはありません。`mark-html` によって追加されることもありません。

- `data-i18n-locale-src` — ベア: `chart.png`は`chart-pt-BR.png`になります（ロケールコードは拡張子の前に挿入されます）。値付き: 値はテンプレートです。[`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/)は`chart_{locale}.png`を使用し、`chart_pt-BR.png`になります。
- `data-i18n-locale-href` — リンクが同じHTMLファイルに留まるように`?locale=`を追加します。

```html
<img
  src="chart.png"
  alt="Sample usage chart"
  data-i18n-alt
  data-i18n-locale-src="chart_{locale}.png"
/>
<a href="about.html" data-i18n-locale-href>About</a>
```

ソースロケールは元のURLを保持します。ベアの`data-i18n-locale-src`の場合、絶対URL、プロトコル相対URL、`data:` URL、および`#`フラグメントはそのまま残され、クエリ文字列とフラグメントも元の位置に留まります。値付きマーカーは、ソース以外のすべてのロケールに対してそのテンプレートを使用し、`{locale}`のみを置換します。ローカライズされた画像が404を返す場合、ランタイムは元の`src`を一度だけ復元します。`chart_pt-BR.png`は自分で出荷します。スクリプトはそれを作成しません。

`data-i18n-locale-href` はこのカタログモデル用です。`about.pt-BR.html` へのリンクは [HTML ページ](/ja/guide/documents/html-pages) パイプラインに属します。

<a id="language-selector"></a>
## 言語セレクター

`data-locale-select` を空の `<select>` に向けます。ランタイムは `ui-languages.json` の各行に対して 1 つの `<option>` を生成します（`code`、`label`、`englishName`、`direction`）。セレクトボックスを変更すると `setLocale` が呼び出され、選択内容が保存され、`?locale=` が `history.pushState` で更新され（リロードなし）、バンドルがフェッチされ、すべてのマーカーが再適用され、`<html lang>` と `dir` が設定されます。戻るボタンは URL 内のロケールを再適用します。

`data-locale-list`はリンク（`lang`、`hreflang`、およびアクティブなものの`aria-current`）に対しても同じことを行います。これらのリンクはカタログページを切り替えるものであり、ドキュメントパイプラインによって書き込まれるファイルごとのリンクではありません。1つのスクリプトタグで両方のセレクターを設定できます:

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

両方のコントロールを空のままにします。このマニフェストでは、`data-label-mode="native"`はポルトガル語に`Português (Brasil)`というラベルを付けます。`english`は`Portuguese (Brazil)`というラベルを付けます。`both`は`Portuguese (Brazil) / Português (Brasil)`というラベルを付けます。2つの名前が異なるため、`ui-languages.json`からの以下のスニペットを参照してください:

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

`?locale=pt-BR`を使用すると、ランタイムはセレクトのオプションとリストの子を置換します。これらの要素に設定した属性は保持されます:

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

`"direction": "rtl"`行は、そのロケールがアクティブなときに`<html>`に`dir="rtl"`を設定します。

これに加えて `navigator.language` による自動リダイレクトは行わないでください。ランタイムは、URL と `localStorage` に選択肢がない場合にのみ、すでにブラウザの言語を使用しています。URL を無視するリダイレクトを行うと、ロケールの共有やページのクロールが困難になります。

`ui-languages.json` は `extract` または `generate-ui-languages` によって `languagesManifestPath` に書き込まれます（デフォルトは `{ui.flatOutputDir}/ui-languages.json`）。[言語スイッチャーと RTL](/ja/guide/ui-strings/language-switcher) を参照してください。

<a id="troubleshooting"></a>
## トラブルシューティング

| 症状 | 確認事項 |
| --- | --- |
| ロケールファイルが読み込まれない | ローカルサーバーでサイトを開きます。`file://`は`fetch`をブロックし、ランタイムはソーステキストにフォールバックします。 |
| `ui-languages.json` で 404 エラー | `data-locales-base` は `i18n.js` に対する相対パスです。`flatOutputDir` と一致する必要があります。 |
| `{locale}.json`で404エラー | そのロケールに対して`translate-ui`を実行し、ロケールコードがファイル名と完全に一致していることを確認します。 |
| `/docs/` の下で文字列が英語のままになる | 同じベースパスの問題です。ロケールディレクトリがホストのルートにない限り、先頭の `/` は避けてください。 |
| 英語が一瞬表示されてから翻訳される | `<html>` に `class="i18n-pending"` と上記の可視性ルールを追加します。 |
| 2 回目の切り替えで翻訳された文字列がキーとして表示される | デプロイされた `i18n.js` を読み込みます。テキストを置換する前に `data-i18n-source` を保存します。 |
| RTL レイアウトが反転しない | マニフェスト行に `"direction": "rtl"` が必要です。ランタイムは `<html>` に対してのみ `dir` を設定します。 |
| 新しい DOM ノードが英語のままになる | それらを挿入した後に `window.i18n.apply()` を呼び出します。 |
| ポルトガル語で画像が`chart.png`のままになる | 要素には`data-i18n-locale-src`が必要であり、ロケールはソースロケールであってはなりません。 |

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
