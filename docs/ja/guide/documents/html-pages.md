<a id="html-pages"></a>
# HTMLページ

静的サイトでロケールごとに翻訳済みの `.html` または `.htm` ファイルが1つ必要な場合は、Documents パイプラインを使用します。`translate-docs` はソースページを翻訳し、相対リンクを書き換え、ロケールコピーを `outputDir` 配下に書き込みます。ブラウザの i18n ランタイムや `data-i18n*` マーカーは必要ありません。

代わりに、1つの HTML ファイルをそのまま配置し、ブラウザースクリプトがフラットな JSON から文字列をオンザフライで置き換える場合は、[Plain HTML apps](/ja/guide/ui-strings/plain-html) を使用します。同じファイルを両方のパイプラインに配置しないでください。HTML ファイルが `docs[]` ソースと `ui.sourceRoots` カタログソースの両方である場合、CLI は警告を発します。

実行可能な [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) サイトは、ポート 3092 で英語を提供し、ポルトガル語を `site/pt-BR/` に書き込みます。

<a id="quick-start"></a>
## クイックスタート

動作する構成をスキャフォールドします:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

または、すでに LLM [provider](/ja/guide/providers-and-models) を持つ `ai-i18n-tools.config.json` に、この HTML 部分を追加します:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": {
    "translateDocs": true,
    "translateUIStrings": false
  },
  "docs": [
    {
      "description": "Static HTML pages",
      "contentPaths": ["site/"],
      "outputDir": "site",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "nested",
        "docsRoot": "site",
        "localizedAssets": {
          "include": ["img/**"],
          "pattern": "{stem}-{locale}{ext}",
          "onlyIfExists": true
        },
        "html": {
          "languageList": {
            "format": "links",
            "label": "local"
          },
          "hreflang": {
            "siteUrl": "https://example.com",
            "xDefault": "en",
            "stripIndexHtml": true
          }
        }
      }
    }
  ]
}
```

`docsRoot` は `contentPaths` 内のソースツリーである必要があります。ロケールディレクトリが挿入される前に削除されます。上記の構成の場合:

```text
site/index.html       → site/pt-BR/index.html
site/about.html       → site/pt-BR/about.html
```

オプションで、各ソースページに [language-list and hreflang markers](#language-list-and-hreflang) を追加してから、次を実行します:

```bash
ai-i18n-tools translate-docs
# Or run every enabled pipeline:
ai-i18n-tools sync
```

このコマンドは、ソース言語ファイル内のマーカーの内部も更新します。`outputDir` 配下のロケールファイルは生成された出力として扱ってください。ソースページを編集し、コマンドを再実行します。

<a id="what-is-translated"></a>
## 翻訳されるもの

HTML エクストラクターは以下を翻訳します:

- 文字を含む表示テキスト（`<title>` やインラインマークアップ周辺のテキストを含む）
- `alt`、`title`、`aria-label`、および `placeholder` 属性値
- `<input type="submit">` および `<input type="button">` の `value`
- `meta name="description"`、`meta property="og:title"`、および `meta property="og:description"` の `content`

`<a>`、`<em>`、`<strong>`、`<span>`、`<img>`、`<br>` などのインライン要素は、周囲の文が翻訳されている間も保持されます。`<code>` や `<kbd>` などのコードのようなインライン要素はそのまま保持されます:

```html
<p>Run <code>pnpm build</code> before deployment.</p>
```

`script`、`style`、`textarea`、`pre`、および `code` のサブツリー全体は変更されずにコピーされます。`class`、`id`、`src`、`href`、および URL を含むメタデータを含むその他の属性は、モデルに送信されません。

各ロケールコピーにおいて、パイプラインは `<html lang="…">` とロケールの `dir`（`ltr` または `rtl`）を設定します。ソースページは、作成された `lang` と `dir` を保持します。UTF-8 の HTML を使用してください。`<meta charset>` が別のエンコーディングを宣言している場合、CLI は警告を発します。

<a id="output-layout"></a>
## 出力レイアウト

通常の静的サイトレイアウトの場合、以下を設定します:

```json
{
  "outputDir": "site",
  "docsOutput": {
    "style": "nested",
    "docsRoot": "site"
  }
}
```

`style: "nested"` は `{outputDir}/{locale}/{path relative to docsRoot}` を書き込みます。`style: "flat"` は `site/about.pt-BR.html` のようなロケールサフィックス付きファイルを書き込みます。すべてのスタイルとカスタムパステンプレートについては、[Output layouts](/ja/guide/documents/output-layouts) を参照してください。

`outputDir` 配下の生成されたロケールディレクトリとフラットなロケールファイル名は、今後のソース検出から除外されます。これにより、`site/pt-BR/index.html` や `site/index.pt-BR.html` が再度翻訳されるのを防ぎます。

<a id="links-and-images"></a>
## リンクと画像

`.html` または `.htm` で終わる相対リンクは、そのターゲットが同じ `docs[]` ブロック内の別のソースページである場合に書き換えられます。クエリ文字列とフラグメントは保持されます。例えば、`site/index.html` 内の `href="about.html#history"` は `site/pt-BR/index.html` 内の `href="./about.html#history"` になります。

その他の相対 `href`、`src`、`srcset`、および `poster` URL には深度プレフィックスが付けられ、共有ファイルがロケールページから引き続き解決されるようにします。絶対 URL、プロトコル相対 URL、`data:` URL、およびフラグメントのみのリンクは変更されません。ルート相対 URL はルート相対のままです。

`docsOutput.localizedAssets` はロケール固有の画像またはアイコンのファイル名を選択できます:

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

`img/trulli.jpg`は`img/trulli-pt-BR.jpg`になります。`onlyIfExists: true`（デフォルト）の場合、そのURLはローカライズされたファイルが存在する場合にのみ使用され、それ以外の場合は元の共有アセットが保持されます。`onlyIfExists: false`は、別のビルドまたはCDNステップでそれらのファイルが保証されている場合にのみ設定してください。

`include`は`img/**`などのURLパスに一致します。`assetRoot`を使用して、ローカライズされた候補（特に`/img/trulli.jpg`などのルート相対URL）がチェックされるファイルシステムディレクトリを設定します。

同じローカライズルールが`srcset`、`poster`、`<source src>`、アイコン`<link href>`、および`og:image` / `twitter:image`に適用されます。パイプラインは参照を書き換えますが、アセットファイルの作成、翻訳、またはコピーは行いません。CSSの`url()`値は書き換えられません。

<a id="language-list-and-hreflang"></a>
## 言語リストとhreflang

表示されるナビゲーションが属する場所に言語リストのペアを配置し、`<head>`内にhreflangペアを配置します：

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

実行のたびに、パイプラインは各ペア間のコンテンツのみを置き換えます。すべてのロケールコピーとソースページを更新し、代替リンクを相互に保持します。`script`、`style`、`pre`、および`code`内のマーカーは無視されます。`--verbose`を使用すると、設定されたペアが欠落している場合にCLIが警告を発します。

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

デフォルトのコメントは、`docsOutput.html`が省略されていても機能します。`languageList.start` / `end`または`hreflang.start` / `end`は、ソースで異なるマーカーテキストが使用されている場合にのみ設定してください。

<a id="visible-language-navigation"></a>
### 表示言語ナビゲーション

- `format: "links"`は`<a>`要素を書き込みます。`<ul>`、`<ol>`、または`<nav>`内では、各リンクは`<li>`でラップされ、それ以外の場所では`separator`がリンクを結合します。
- `format: "select"`は`<option>`行を書き込みます。独自の`<select data-lang-select>`内にマーカーを配置し、`node_modules/ai-i18n-tools/dist/html-runtime/lang-select.js`をサイトにコピーして、その従来のスクリプトを読み込みます。これにより、選択されたオプションの生成されたURLに移動します。
- `label`は`local`（エンドニム）、`english`、または`both`（異なる場合は`English / endonym`）です。ラベルは、利用可能な場合は`ui-languages.json`から、次にパッケージにバンドルされたロケールリストから取得されます。

1つのマーカーブロックでは1つのフォーマットを使用します。生成されたリンクには`lang`、`hreflang`、および`aria-current`が含まれ、現在のページ用に生成されたオプションには`selected`が含まれます。

<a id="search-engine-alternates"></a>
### 検索エンジン代替

`hreflang.siteUrl`は代替URLのプレフィックスです。デプロイ前にサイトのパブリックオリジンに設定します。省略すると、パイプラインは相対代替リンクを書き込み、警告をログに記録します。

`xDefault`のデフォルトは`sourceLocale`です。これは、そのロケールがページに対して設定されている場合にのみ出力されます。`stripIndexHtml: true`は`index.html`の代替をディレクトリURLに変換します。

マーカーブロックは必須です。パイプラインは`<head>`にタグを自動的に注入しません。また、サイトマップ、正規URL、または`og:locale`を生成せず、ブラウザの言語によるリダイレクトも行いません。

言語ブロックの対象となるのは、設定されたソースロケールとターゲットロケールのみです。`ui-languages.json`が存在する場合、その行と順序が対象となるロケールの表示を決定するため、マニフェストを設定と一致させてください。`--locale`を使用してサブセットのみを生成するように翻訳する場合は、リンクされているすべてのロケール出力が存在するまで公開しないでください。

<a id="second-run"></a>
## 2回目の実行

文の翻訳はキャッシュに保持されます。ファイル追跡ハッシュには、ロケールリスト、出力スタイル、`docsOutput.html`、および`localizedAssets`も含まれます。ロケールを追加するか、これらのオプションを変更すると、すべての文がすでにキャッシュされている場合でも、生成されたブロックとリンクが書き換えられます。ハッシュが一致し、出力ファイルが最新である場合、そのロケールページはスキップされます。

<a id="troubleshooting"></a>
## トラブルシューティング

| 症状 | 確認事項 |
| --- | --- |
| 出力が`site/pt-BR/site/index.html`である | ソースプレフィックスが削除されるように、`docsOutput.docsRoot`を`"site"`に設定します。 |
| リンクが引き続き英語のページを指している | 相対`.html` / `.htm`リンクを使用し、ターゲットページを同じ`docs[]`ブロックに含めます。 |
| ロケールページから画像パスが壊れている | 深度の書き換えが適用されるように相対パスを維持します。CSSの`url()`は書き換えられないことに注意してください。 |
| ローカライズされた画像が選択されない | `localizedAssets.include`、ファイル名`pattern`、および`onlyIfExists`がtrueの場合に候補が存在するかどうかを確認します。 |
| 言語リストが空または変更されていない | 両方のマーカーコメントを正しい順序で、`script`、`style`、`pre`、および`code`の外側に配置します。 |
| ドロップダウンが遷移しない | `data-lang-select` を `<select>` に追加し、`html-runtime/lang-select.js` を読み込みます。 |
| hreflang URL が誤ったホストを使用している | `hreflang.siteUrl` を最終的なパブリックオリジンに設定します。 |
| 翻訳済みページが再度翻訳される | 生成されたロケールファイルは設定済みの `outputDir` 配下に配置し、個別のソースとして追加しないでください。 |
