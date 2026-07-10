<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# フラットリンク書き換えと2段階フロー

`docsOutput.style = "flat"`の場合（および`rewriteRelativeLinks: false`またはカスタム`pathTemplate`が設定されていない限り）、組み込みのリライターは`postProcessing`の前に実行されます。これは、ドキュメント間のリンクを処理し（ロケールサフィックスを追加）、非マークダウンアセットURLに深さプレフィックスを付加します。ロケール固有のアセットパス（スクリーンショット、`/img/…`ブリッジ）は、その後`docsOutput.postProcessing.regexAdjustments`によって書き換えられます。

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"`時の2段階の処理フロー

```
source URL  →  [flat link rewriter: depth prefix]  →  [regexAdjustments: locale segment]  →  output URL
```

`outputDir: "translated-docs/"`かつソース`README.md`がリポジトリのルートにある場合の例：

1. フラットリンクリライター: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (`translated-docs/`に1つの`../`)
2. `regexAdjustments`ルール`images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

`docsOutput.style = "doc-system"`（`"docusaurus"`、`"astro-starlight"`、`"nested"`を含む）の場合、フラットリンクリライターは実行されません。`regexAdjustments`は、翻訳されたマークダウンからの元のURL（通常は`/img/screenshots/en-GB/foo.png`のような絶対パス）を参照します。

<a id="vitepress-link-normalizer-style-vitepress"></a>
### VitePress リンク正規化機能 (`style: "vitepress"`)

`docsOutput.rewriteVitepressLinks`が`true`（`style`が`"vitepress"`の場合のデフォルト）の場合、セグメントの再構成後に（フラットなリライターではなく）別のノーマライザーが実行されます。これは、英語がコンテンツルートにあり、ロケールが兄弟フォルダー（`docs/de/guide/…`）にあるVitePress / ドキュメントシステムサイトを対象としています。

```
source href  →  [VitePress link normalizer]  →  [regexAdjustments]  →  output href
```

一般的な書き換え:

| ソースパターン | 正規化されたターゲット |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (ロケールファイルから) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | 変更なし（リポジトリパスには完全なURLを使用） |

`README.md` → `docs/index.md` を同期するプロジェクトでは、VitePressツリー外の `LICENSE`、`examples/`、およびその他のファイルの `README.md` において完全なGitHub URLを使用してください。[VitePress integration — README as the docs homepage](/ja/guide/integrations/vitepress#readme-as-homepage) を参照してください。

フラットリライターとVitePressノーマライザーは、`docs[]` ブロックごとに相互排他であり、`regexAdjustments` の前に実行されるのはどちらか一方のみです。[VitePress integration — Link conventions](/ja/guide/integrations/vitepress#link-conventions) を参照してください。

<a id="nextra-link-normalizer-style-nextra"></a>
### Nextra リンク正規化機能 (`style: "nextra"`)

`docsOutput.rewriteNextraLinks` が `true` の場合（`style` が `"nextra"` の時のデフォルト）、セグメント再構築後に別のノーマライザーが実行されます。これは `content/en/…` と相対 `.mdx` パスをロケール中立のルート（`/guide/…`）に書き換えます。[Nextra integration — Link conventions](/ja/guide/integrations/nextra#link-conventions) を参照してください。

<a id="fumadocs-link-normalizer-style-fumadocs"></a>
### Fumadocs リンク正規化機能 (`style: "fumadocs"`)

`docsOutput.rewriteFumadocsLinks` が `true` の場合（`style` が `"fumadocs"` の時のデフォルト）、セグメント再構築後に別のノーマライザーが実行されます。これは `content/docs/…` と相対 `.mdx` パスをロケール中立のルート（`/docs/…`）に書き換えます。[Fumadocs integration — Link conventions](/ja/guide/integrations/fumadocs#link-conventions) を参照してください。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### ファイルごとの深さ接頭辞と`flatPreserveRelativeDir`

深さ接頭辞はバッチ全体に対してグローバルにではなく、出力ファイルごとに個別に計算されます。各ソースファイルについて、リライターは出力ファイルのディレクトリからソースファイルのディレクトリへの相対パスを計算し、それを接頭辞として使用します。

これは、`flatPreserveRelativeDir: true` を使用すると、サブディレクトリ内のソースファイルに正しいプレフィックスが自動的に付加されることを意味します。たとえば、`docs/guide/quick-start.md` は `translated-docs/docs/guide/quick-start.<locale>.md` に出力されます。ファイルごとのプレフィックスは `../../docs/` なので、アセット `translation-dashboard.png` (ソースツリーの兄弟) は `../../docs/translation-dashboard.png` になります。これは `translated-docs/docs/guide/` から `docs/translation-dashboard.png` に正しく解決されます。

ソースファイルと並行する相対パスアセットの場合、`regexAdjustments`の修正は不要です。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks`および`linkRewriteDocsRoot`

| オプション                                   | 効果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | フラットリンクリライターを明示的に有効または無効にします（`docsOutput.style = "flat"`時の既定値を上書き） |
| `docsOutput.linkRewriteDocsRoot`     | `depthPrefix`の計算元となるルート（既定値は`"."`）                                                        |
| `docsOutput.flatPreserveRelativeDir` | 出力パスのレイアウトに影響し、リライターは既知の翻訳済みファイルのターゲットパスを計算する際にこのレイアウトを使用します       |

<a id="docsoutputpostprocessingregexadjustments"></a>
### `docsOutput.postProcessing.regexAdjustments`

組み込みのリライターが処理しない画像、スクリーンショット、その他のアセットURLを書き換えるには、`docs[].docsOutput.postProcessing`の下に順序付けられた`{ "description"?, "search", "replace" }`ルールを設定します。通常、ロケールフォルダセグメントを交換する（`screenshots/en-GB/` → `screenshots/de/`）か、絶対静的パスをブリッジする（`/img/…` → `../assets/…`）ことになります。

ルールは、セグメントの再構成と組み込みのリンク書き換え（フラットまたはVitePress）の後、および`addFrontmatter`の前に、翻訳されたマークダウンの**本文**で実行されます。フラットレイアウトでは、深さプレフィックスが適用された**後**のURLに対して`search`パターンを記述します。先頭の`../`ではなく、パス内のロケールセグメントに一致させます。

**ロケールごとのスクリーンショットフォルダ（フラットレイアウト）:**

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
    ]
  }
}
```

ソースロケール（`en-GB`）をハードコーディングする代わりに`[^/]+`を使用すると、ルールが`sourceLocale`の変更後も機能します。最も一般的なプレースホルダーは`${translatedLocale}`です。`${sourceLocale}`、`${sourceFilename}`、`${translatedFilename}`、およびパス変数も利用できます。[ドキュメント — リンクの書き換え](/ja/guide/documents/link-rewriting#replace-placeholders)を参照してください。

レイアウト固有の例（フラット、ドキュメントシステム、Docusaurus、Starlight）: [ロケールごとのフォルダ](/ja/guide/images-and-screenshots/per-locale-folder)。一般的なページ間リンクルール: [ドキュメント — リンクの書き換え](/ja/guide/documents/link-rewriting)。フィールドリファレンス: [設定 — `docs`](/ja/reference/configuration#docs)。

---

<a id="common-mistakes-and-troubleshooting"></a>

ハードコードされたロケール正規表現、不足しているスクリーンショットディレクトリ、およびDocusaurusの`/img/`ブリッジについては、[よくある間違いとトラブルシューティング](/ja/guide/images-and-screenshots/troubleshooting)を参照してください。
