<a id="plain-html-apps"></a>
# プレーンなHTMLアプリ

<a id="marking-html-for-translation"></a>
## 翻訳のためのHTMLのマーク付け

プレーンなHTMLアプリ（マークアップに`t("…")`呼び出しがない場合）では、属性を使用して翻訳対象の要素に印を付け、`extract`が要素自体から英語のテキストを取得するようにします。文字列リテラルの重複は不要です。

値なしの形式（属性に値がなく、ソーステキストは要素から読み取られます）を優先してください。

- `data-i18n` — キーは要素の`textContent`です。実行時に`el.textContent = t(key)`を設定します。
- `data-i18n-title` — キーは要素の`title`です。実行時に翻訳された`title`を設定します。
- `data-i18n-placeholder` — キーは要素の`placeholder`です。

値付きの形式`data-i18n="Some key"`は、値なしの形式が機能しない場合にのみ使用してください。たとえば、子タグと混在するテキスト（混合コンテンツ要素）の場合や、キーが表示テキストと異なる必要がある場合です。要素（およびそのサブツリー）を除外するには`data-i18n-ignore`を使用します。

制約: 値なしの`data-i18n`は、リーフテキスト要素（単一のテキストノードで、子要素がない場合）にのみ使用してください。これは、`textContent`を設定すると子要素がすべて置き換えられるためです。`Run <code>build</code> now.`のような段落の場合は、各テキスト部分を独自のマーカーでラップしてください。

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

マーカーは手動で追加するか、`mark-html`コマンドに値なしマーカーを挿入させることができます。デフォルトではドライランとして機能し、ファイルごとにいくつのマーカーを追加するかを報告し、手動での`<span data-i18n>`が必要な混合コンテンツ要素をリストします。ドライランは`--write`を指定した場合にのみ書き込みを行います。

```bash
# Preview (no changes written)
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
```

`mark-html`は冪等であり、`data-i18n-ignore`を尊重し、コードのような要素（`code`、`pre`、`kbd`、`samp`、`var`）や空のテキスト/数値のみのテキストには印を付けず、値付きマーカーを生成することはありません。印付けの後、報告された混合コンテンツフラグメントを手動でラップし、次に`.html`を`ui.uiExtractor.extensions`に追加して、`extract`が文字列をキャプチャできるようにします。

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app-the-bundled-dashboard"></a>
## 実例：プレーンなHTMLアプリ（バンドルされたダッシュボード）のローカライズ

パッケージ固有の翻訳ダッシュボード（`src/dashboard-app`）も、これらのマーカーを使用します。その`index.html`には、次のようなプレーンなマーカーが含まれています。

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract`は、各英語ソース文字列をカタログ（`strings.json`）に書き込み、`translate-ui`はロケールごとに1つのフラットバンドルを、英語ソーステキストをキーとして埋め込みます。典型的な静的HTMLアプリの場合、`ui.flatOutputDir`を`public/locales/`のようなWebサーバーで提供されるディレクトリに向けます。

```bash
npx ai-i18n-tools extract        # index.html markers → strings.json
npx ai-i18n-tools translate-ui   # strings.json → {ui.flatOutputDir}/{locale}.json
```

```jsonc
// public/locales/de.json
{
  "Next": "Weiter",
  "Filename (partial)": "Dateiname (teilweise)",
  "Stop the dashboard server and close this window": "Dashboard-Server stoppen und dieses Fenster schließen",
  "Close": "Schließen"
}
```

実行時には、アクティブなロケールのバンドルをロードし、印付けされた要素をウォークします。キーは、マーカーの値が存在する場合はその値から、存在しない場合は要素自体のテキスト/タイトル/プレースホルダー（抽出ツールが空白文字を正規化するのと同じ方法で正規化されます）から取得されます。

```html
<script type="module">
  const locale = document.documentElement.lang || "en";
  const bundle = locale.startsWith("en")
    ? {}
    : await fetch(`/locales/${locale}.json`).then((r) => (r.ok ? r.json() : {}));

  const t = (key) => bundle[key] ?? key; // English source is the fallback
  const norm = (s) => s.trim().replace(/\s+/g, " ");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || norm(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || norm(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder") || norm(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
</script>
```

このスニペットのマーカーをたどる部分は、[`src/dashboard-app/app.js`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/dashboard-app/app.js) の `applyStaticI18n` とまったく同じです。英語のソーステキストはカタログキーであるため、未翻訳の文字列は自動的に英語にフォールバックされます。

**実行可能な静的版**（Nodeサーバーなし — `/api/ui-i18n`の代わりに`fetch('/locales/{locale}.json')`）については、[`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/)のワークスペース例を参照してください。これは同じマーカーパターンを使用し、シンプルなダッシュボードスタイルのUIを備えています。`pnpm dev`の後に`http://localhost:3090/?locale=pt-BR`でポルトガル語（ブラジル）を試してみてください。

バンドルされたダッシュボードが異なる点：Nodeサーバーがあるため、静的な `/locales/{locale}.json` をフェッチしません。クライアントは `GET /api/ui-i18n` を呼び出し、サーバーはアクティブなロケール（`--ui-lang` > `AI_I18N_LANG` > 設定 `uiLanguage` > ホストOS）を解決し、`{ locale, dir, bundle }` を返します。その後、クライアントは `lang` を読み取ってロケールを選択するのではなく、その応答から `document.documentElement` `lang`/`dir` を設定してから `applyStaticI18n` を呼び出します。バンドル自体は、ツールの翻訳対象コンテンツではありません。これらはダッシュボード自身のUI文字列であり、`src/i18n/locales/{locale}.json` に同梱され（ビルド時に `dist/i18n/locales` にコピーされます）、[`src/i18n/index.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/i18n/index.ts) の `loadUiBundle` によってサーバー側で読み取られます。ダッシュボードの `t()` は、上記の最小限の `t` とは異なり、```{{name}}``` 補間もサポートしています。
