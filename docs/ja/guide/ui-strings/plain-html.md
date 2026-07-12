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
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
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

<a id="worked-example-localizing-a-plain-html-app"></a>
## 実践例: プレーンなHTMLアプリのローカライズ

[`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) のワークスペース例は、これらのマーカーをエンドツーエンドで使用する実行可能な静的アプリです。`npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` でクローンを作成し、`pnpm install` と `pnpm dev` を実行してから、ポルトガル語 (ブラジル) の場合は [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) を開きます。

その `public/index.html` には、次のような単純なマーカーが含まれています:

```html
<button type="button" id="btn-apply" data-i18n>Apply</button>
<input
  type="text"
  id="filter-filename"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-title
  data-i18n-placeholder
/>
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers, then</span> <code>extract</code>
  <span data-i18n>and</span> <code>translate-ui</code><span data-i18n>.</span>
</p>
```

`ai-i18n-tools.config.json` は `public/` での抽出を指定し、静的ファイルの隣にフラットなバンドルを書き込みます:

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

`extract` は各英語のソース文字列をカタログ (`public/strings.json`) に書き込み、`translate-ui` は英語のソーステキストをキーとして、ロケールごとに1つのフラットなバンドルを埋めます:

```bash
pnpm i18n:extract        # public/index.html markers → public/strings.json
pnpm i18n:translate-ui   # strings.json → public/locales/{locale}.json
```

```jsonc
// public/locales/pt-BR.json
{
  "Apply": "Aplicar",
  "Filename (partial)": "Nome do arquivo (parcial)",
  "Filter by filepath": "Filtrar por caminho do arquivo",
  "Run": "Execute",
  "to add bare markers, then": "para adicionar marcadores simples, depois",
  "and": "e",
  ".": "."
}
```

実行時に、`public/app.js` はロケールメタデータのために `/locales/ui-languages.json` を読み込み、アクティブなロケールを解決し (`?locale=` → `localStorage` → ブラウザ → `en`)、`/locales/{locale}.json` をフェッチし (英語の場合はスキップ)、その後マークされた要素を走査します。キーは、マーカー値が存在する場合はそこから取得され、それ以外の場合は要素自身のテキスト / タイトル / プレースホルダーから取得されます (抽出器が空白を正規化するのと同じ方法で正規化されます):

```javascript
function normalizeI18nText(s) {
  return s.trim().replace(/\s+/g, " ");
}

function t(key) {
  const raw = I18N.bundle[key];
  return typeof raw === "string" && raw.length > 0 ? raw : key;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || normalizeI18nText(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || normalizeI18nText(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key =
      el.getAttribute("data-i18n-placeholder") ||
      normalizeI18nText(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
}
```

`normalizeI18nText` は [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) 内の `normalizeI18nText` と同一のままでなければなりません。英語のソーステキストがカタログキーであるため、未翻訳の文字列は自動的に英語にフォールバックします。

バンドルされている [翻訳ダッシュボード](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) は、HTMLマーカーに同じ `applyStaticI18n` アルゴリズムを使用しますが、静的な `/locales/{locale}.json` ファイルの代わりに `GET /api/ui-i18n` からロケールバンドルを提供します。完全なワークフロー、プロジェクトレイアウト、および比較表については、例の [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) を参照してください。
