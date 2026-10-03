<a id="html-pages"></a>
# HTMLページ

`translate-docs`は、ロケールごとに1つのHTMLファイルを出力できます。`docs[]`の`contentPaths`エントリに`.html`または`.htm`ファイルを配置し、`translate-docs`または`sync`を実行します。英語ファイルはソースのまま保持されます。ロケールのコピーは`outputDir`の下に書き込まれます。

各言語が独自のページである場合（静的サイト、手書きのHTMLドキュメントのセット）にこれを使用します。1つのHTMLファイルがそのまま配置され、ブラウザがフラットなJSONから文字列を置き換える場合は、[プレーンHTMLアプリ](/ja/guide/ui-strings/plain-html)を使用します。

次のコマンドでスキャフォールドを生成します:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

実行可能なデモは[`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs)（ポート3092）です。

<a id="what-is-translated"></a>
## 翻訳されるもの

翻訳されるもの: 表示テキスト、`alt`、`title`、`aria-label`、`placeholder`、`<title>`、`meta name="description"`、および`og:title` / `og:description`。

変更されないもの: `script`、`style`、`textarea`、`pre`、および`code`要素、ならびに`src`、`href`、その他のURL。`<code>`または`<em>`を含む段落は、それらのタグを保持したまま周囲の単語を翻訳します。

`html lang`と`dir`はロケールファイルに設定されます。英語のソースは、変更するまで独自の`lang`を保持します。

生成されたロケールファイルが`outputDir`（`pt-BR/`ディレクトリ、またはフラットな`name.pt-BR.html`）の下に配置されている場合、次の実行時にはスキップされます。同じ`.html`ファイルがUIカタログソース（`ui.sourceRoots`）でもある場合、警告が出力されます。

<a id="links-and-images"></a>
## リンクと画像

同じ`docs[]`ブロック内の他のHTMLページへのリンクは、そのページのロケール出力に書き換えられます。その他の相対URLにはプレフィックスが追加され、ロケールファイルから引き続き解決されるようになります。

`docsOutput.localizedAssets`は、ロケール固有のファイルが存在する場合、オプションで画像とアイコンの名前を変更します。CSSの`url()`は書き換えられません。

```json
"localizedAssets": {
  "include": ["img/**"],
  "pattern": "{stem}-{locale}{ext}",
  "onlyIfExists": true
}
```

| プレースホルダー | 意味 |
| --- | --- |
| `{stem}` | 拡張子を除いたファイル名 |
| `{ext}` | ドットを含む拡張子 |
| `{basename}` | 拡張子を含むファイル名 |
| `{locale}` | 設定されたロケールコード（`pt-BR`） |
| `{llocale}` | 小文字のロケール |
| `{LOCALE}` | 大文字のロケール |

上記のパターンを持つ`img/trulli.jpg`は`img/trulli-pt-BR.jpg`になります。`onlyIfExists: true`（デフォルト）の場合、そのファイルが存在しないときは元のURLが保持されます。絶対URL、`data:` URL、および`#`フラグメントはスキップされます。ルート相対URL（`/img/trulli.jpg`）は`assetRoot`の下、または`assetRoot`が省略されている場合はHTMLファイルのディレクトリの下でテストされます。

`srcset`、`poster`、`<source src>`、アイコン`<link>`のURL、および`og:image` / `twitter:image`には同じルールが適用されます。

HTMLの場合、ロケールフォルダが追加される前に、プロジェクト相対パスから`docsOutput.docsRoot`が削除されます。`docsRoot: "site"`と`style: "nested"`の場合、`site/index.html`は`site/pt-BR/index.html`に書き込まれます。

<a id="language-list-and-hreflang"></a>
## 言語リストとhreflang

2つのコメントペアがすべてのロケールコピーおよび英語のソースに挿入されます（これにより、代替リンクが相互に維持されます）：

```html
<nav>
  <ul>
    <!-- ai-i18n:lang-list -->
    <!-- /ai-i18n:lang-list -->
  </ul>
</nav>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
```

`script`、`style`、`pre`、および`code`内のマーカーは無視されます。詳細出力モードでの実行時に、ページにペアがない場合は警告が表示されます。`docsOutput.html`が省略されている場合、同じコメントがデフォルトとして使用されます。

```json
"html": {
  "languageList": {
    "format": "links",
    "label": "local",
    "separator": " · "
  },
  "hreflang": {
    "siteUrl": "https://example.com",
    "xDefault": "en",
    "stripIndexHtml": true
  }
}
```

`format: "links"`は`<a>`要素を出力します。`<ul>`、`<ol>`、または`<nav>`内では、各リンクは`<li>`でラップされます。`format: "select"`は`<option>`行を出力します。独自の`<select data-lang-select>`内にマーカーを配置し、`lang-select.js`（`ai-i18n-tools/html-runtime/lang-select.js`として同梱されており、例にコピーされています）を読み込みます。1つのブロックでは1つの形式を使用します。

`label`は`local`（内名）、`english`、または`both`（異なる場合は`English / endonym`）です。設定されたセットに含まれないロケールは省略されます。

`hreflang.siteUrl`は代替リンクにプレフィックスを付加します。未設定の場合、リンクは相対パスになり、警告がログに記録されます。`xDefault`のデフォルトは`sourceLocale`です。`stripIndexHtml`は`index.html`をディレクトリURLに変換します。

サイトマップファイルはなく、自動的な`<head>`の挿入、および`canonical`や`og:locale`の書き換えも行われません。ブラウザの言語設定によって訪問者がリダイレクトされることもありません。

<a id="second-run"></a>
## 2回目の実行

文の翻訳はキャッシュに保持されます。ファイル追跡ハッシュには、ロケールリストと`docsOutput.html` / `localizedAssets`も含まれます。ロケールを追加すると、すべての文がすでにキャッシュされている場合でも、言語リストとhreflangブロックが書き換えられます。ハッシュが一致し、出力ファイルが最新である場合、そのページはスキップされます。
