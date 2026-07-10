<a id="link-rewriting"></a>
# リンクの書き換え

`translate-docs` は、翻訳されたマークダウン内の URL を書き換えるため、ファイルがロケール固有のパスに移動した後もリンクは解決されます。ほとんどのページ間リンクは自動的に処理されます。サイトで共有の静的 URL ツリーまたはロケールコード化されたアセットフォルダーを使用する場合は、`docsOutput.postProcessing.regexAdjustments` ルールを追加します。

<a id="built-in-rewriters"></a>
## 組み込みのリライター

実行されるリライターは `docsOutput.style` によって異なります。

| レイアウト | 組み込みのリライター | 修正内容 |
| --- | --- | --- |
| `"flat"` (カスタム `pathTemplate` がない場合のデフォルト) | フラットリンクのリライター (`rewriteRelativeLinks`、デフォルトでオン) | ページ間の相対リンク (`guide.md` → `guide.de.md`) およびマークダウン以外のアセット URL の深さプレフィックス |
| `"vitepress"` | VitePress リンク正規化機能 (`rewriteVitepressLinks`、デフォルトでオン) | README スタイルの `docs/guide/…` パス → サイトルート (`/guide/…`) |
| `"nextra"` | Nextra リンク正規化機能 (`rewriteNextraLinks`、デフォルトでオン) | `content/en/…` および相対 `.mdx` パス → ロケールに依存しないルート (`/guide/…`) |
| `"fumadocs"` | Fumadocs リンク正規化機能 (`rewriteFumadocsLinks`、デフォルトでオン) | `content/docs/…` および相対 `.mdx` パス → ロケールに依存しないルート (`/docs/…`) |
| `"doc-system"`、`"docusaurus"`、`"astro-starlight"` | なし | ソース URL は `postProcessing` まで変更されずに渡されます |

カスタム `pathTemplate` は、`rewriteRelativeLinks: true` を明示的に設定しない限り、フラットリライターを無効にします。ページ間の `#anchor` の処理については、「[出力レイアウト](/guide/documents/output-layouts)」と「[アンカーリンク](/guide/documents/anchor-links)」を参照してください。

VitePress固有の執筆ルールについては、[VitePress 統合 — リンク規約](/guide/integrations/vitepress#link-conventions)を参照してください。

Nextra固有の執筆ルールについては、[Nextra 統合 — リンク規約](/guide/integrations/nextra#link-conventions)を参照してください。

Fumadocs固有の執筆ルールについては、[Fumadocs 統合 — リンク規約](/guide/integrations/fumadocs#link-conventions)を参照してください。

<a id="postprocessingregexadjustments"></a>
## `postProcessing.regexAdjustments`

組み込みのリライターでは不十分な場合は、`docs[].docsOutput.postProcessing` の下に順序付けられた `{ "description"?, "search", "replace" }` ルールを追加します。たとえば、次のようになります。

- **ロケールフォルダーセグメント** を含むスクリーンショットまたは画像 URL (`screenshots/en-GB/` → `screenshots/de/`)
- 英語のソースツリーと翻訳された出力ツリーで異なる絶対サイトルートパス (`/img/…`)
- ターゲットロケールごとに変更する必要があるが、単純な相対マークダウンリンクではない URL パターン

`postProcessing` は、**再構築された翻訳済みマークダウン本文** (YAML フロントマターキーと非散文値は保持されます) で実行されます。セグメントの再構築と組み込みのリンク書き換えの**後**、`addFrontmatter` の**前**に実行されます。

<a id="two-step-flow-with-flat-layout"></a>
### フラットレイアウトによる 2 段階フロー

`docsOutput.style = "flat"` の場合、フラットリンクのリライターが最初に実行され、次に `regexAdjustments` が実行されます。

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

`outputDir: "translated-docs/"`かつソース`README.md`がリポジトリのルートにある場合の例：

1. フラットリライター: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments`: `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

**すでにプレフィックスが付けられた URL 内**のロケールセグメントに一致するように `search` パターンを記述します。正規表現に `../` の深さプレフィックスを含める必要はありません。

`doc-system` レイアウトの場合、フラットリライターは実行されません。`regexAdjustments` は、ソースマークダウンからの元の URL (通常は `/img/screenshots/en-GB/foo.png` のような絶対パス) を参照します。

深さプレフィックスの動作と `flatPreserveRelativeDir` については、「[フラットリンクのリライターと 2 段階フロー](/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow)」を参照してください。

<a id="replace-placeholders"></a>
### `replace` プレースホルダー

`replace` 文字列は、ファイルごとおよびロケールごとに展開されるテンプレート変数をサポートしています。

| プレースホルダー | 値 |
| --- | --- |
| `${translatedLocale}` | ターゲットロケール (正規化された BCP-47) |
| `${sourceLocale}` | ソースロケール |
| `${sourceFullPath}` | 絶対ソースファイルパス (POSIX `/`) |
| `${translatedFullPath}` | 絶対翻訳出力パス |
| `${sourceFilename}` / `${translatedFilename}` | 拡張子付きのベース名 |
| `${sourceBasedir}` / `${translatedBasedir}` | ソース/出力ファイルの親ディレクトリ |

`search` は正規表現パターンです。プレーンな文字列は `g` フラグを使用します。他のフラグが必要な場合は `/pattern/flags` を使用してください (パターンにエスケープされていない `/` 文字を含めることはできません)。

<a id="common-patterns"></a>
## 一般的なパターン

<a id="per-locale-asset-folder"></a>
### ロケールごとのアセットフォルダー

最初からロケールコード付きのサブディレクトリにアセットを保存し、1つの汎用ルールでセグメントを交換します。

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

ソースロケール (`en-GB`) をハードコーディングするのではなく、`[^/]+` を使用すると、`sourceLocale` が変更されてもルールが機能します。

完全なチュートリアル: [画像とスクリーンショット — ロケールごとのフォルダー](/guide/images-and-screenshots/per-locale-folder)。

<a id="doc-system-static-urls"></a>
### ドキュメントシステムの静的 URL

Docusaurus、Starlight、または共有静的ツリーからスクリーンショットを提供するその他の `doc-system` サイトの場合:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

ジェネレーターがサポートしている場合は、ソースマークダウンで併置された相対パス (`../assets/name.png`) を優先してください。そうすれば、`regexAdjustments` ブリッジは必要ありません。[画像とスクリーンショット](/guide/images-and-screenshots/) でレイアウトの選択肢を参照してください。

<a id="when-regex-is-not-needed"></a>
### 正規表現が不要な場合

通常、次の場合には `regexAdjustments` は**不要**です。

- ページ間のリンクが単純な相対マークダウンパスであり、`docsOutput.style = "flat"` (組み込みのリライターがロケールサフィックスを追加します)
- アセットがソースファイルの横にあり、フラットリライターのファイルごとの深さプレフィックスがそれらを正しく解決します
- 英語とすべての翻訳されたコピーが**同じ** URL を使用している (サイトルートの共有画像、併置されたアセット、正規化後の VitePress サイトルート)
- VitePress のサイト内リンクがサイトルートまたは `docs/guide/…` パスを `rewriteVitepressLinks: true` とともに使用している
- Nextra および Fumadocs のページ内リンクでは、ロケールに依存しないルート (`/guide/…`、`/docs/…`) または `rewriteNextraLinks` / `rewriteFumadocsLinks: true` を使用したコンテンツルートパスを使用します。

<a id="full-config-example"></a>
## 完全な設定例

ロケールごとのスクリーンショットとオプションの言語スイッチャーブロックを含むフラットなREADME：

<details>
<summary>フラットレイアウト: regexAdjustments + languageListBlock</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

フィールドリファレンス: [設定 — `docs`](/reference/configuration#docs) (`docsOutput.postProcessing`)。

<a id="troubleshooting"></a>
## トラブルシューティング

| 症状 | 考えられる原因 | 確認事項 |
| --- | --- | --- |
| 翻訳されたページで画像または静的アセットが404エラーになる | URLレイアウトの`regexAdjustments`がないか、間違っている | [画像とスクリーンショット — トラブルシューティング](/guide/images-and-screenshots/troubleshooting) |
| リンクは正しいファイルを開くが、`#section`が間違っている | アンカースラッグのずれ、URL書き換えではない | [アンカーリンク](/guide/documents/anchor-links) |
| `regexAdjustments`ルールがフラットレイアウトに影響しない | `search`は書き換え前のURLを想定しているが、フラットレイアウトはすでに深さプレフィックスを追加している | プレフィックス付きパス内のセグメントを一致させる（[2段階フロー](#two-step-flow-with-flat-layout)を参照） |
| 実行時に無効な正規表現がスキップされる | 不正な形式の`search`パターン | CLIはルール`description`で警告します。サンプル翻訳出力に対してパターンをテストしてください |
