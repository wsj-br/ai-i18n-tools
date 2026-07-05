<a id="the-flat-link-rewriter-and-two-step-flow"></a>
# フラットリンク書き換えと2段階フロー

`docsOutput.style = "flat"`の場合（および`rewriteRelativeLinks: false`またはカスタムの`pathTemplate`が設定されていない場合）、`postProcessing`の前に組み込みのリライターが実行されます。このリライターはドキュメント間リンク（ロケール接尾辞の追加）を処理し、Markdown以外のアセットURLにはディレクトリ階層に基づくプレフィックスを付加します。

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"`時の2段階の処理フロー

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

`outputDir: "translated-docs/"`かつソース`README.md`がリポジトリのルートにある場合の例：

1. フラットリンクリライター：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`（`translated-docs/`用の`../`が1つ）
2. `postProcessing`の正規表現`images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`：`../images/screenshots/de/foo.png`

`docsOutput.style = "doc-system"`の場合（`"docusaurus"`、`"astro-starlight"`、`"nested"`を含む）には、フラットリンクリライターは実行されません。`postProcessing`は翻訳されたMarkdownから元のURL（通常は`/img/screenshots/en-GB/foo.png`のような絶対パス）をそのまま参照します。

<a id="vitepress-link-normalizer"></a>
### VitePress リンク正規化機能 (`style: "vitepress"`)

`docsOutput.rewriteVitepressLinks`が`true`（`style`が`"vitepress"`の場合のデフォルト）の場合、セグメントの再構成後に（フラットなリライターではなく）別のノーマライザーが実行されます。これは、英語がコンテンツルートにあり、ロケールが兄弟フォルダー（`docs/de/guide/…`）にあるVitePress / ドキュメントシステムサイトを対象としています。

```
source href  →  [VitePress link normalizer]  →  [postProcessing]  →  output href
```

一般的な書き換え:

| ソースパターン | 正規化されたターゲット |
|----------------|-------------------|
| `docs/guide/foo.md` | `/guide/foo` |
| `../guide/foo.md` (ロケールファイルから) | `/guide/foo` |
| `https://github.com/…/examples/console-app/` | 変更なし（リポジトリパスには完全なURLを使用） |

`README.md` → `docs/index.md`を同期するプロジェクトの場合、`README.md`で`LICENSE`、`examples/`、およびVitePressツリー外のその他のファイルに完全なGitHub URLを使用します。[VitePress統合 — ドキュメントのホームページとしてのREADME](/guide/vitepress-integration#readme-as-homepage)を参照してください。

フラットリライターと VitePress 正規化機能は、`docs[]` ブロックごとに相互に排他的です。`postProcessing` の前に実行されるのはどちらか一方のみです。[VitePress 統合 — リンク規則](/guide/vitepress-integration#link-conventions) を参照してください。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### ファイルごとの深さ接頭辞と`flatPreserveRelativeDir`

深さ接頭辞はバッチ全体に対してグローバルにではなく、出力ファイルごとに個別に計算されます。各ソースファイルについて、リライターは出力ファイルのディレクトリからソースファイルのディレクトリへの相対パスを計算し、それを接頭辞として使用します。

これは、`flatPreserveRelativeDir: true` を使用すると、サブディレクトリ内のソースファイルに正しいプレフィックスが自動的に付加されることを意味します。たとえば、`docs/guide/quick-start.md` は `translated-docs/docs/guide/quick-start.<locale>.md` に出力されます。ファイルごとのプレフィックスは `../../docs/` なので、アセット `translation-dashboard.png` (ソースツリーの兄弟) は `../../docs/translation-dashboard.png` になります。これは `translated-docs/docs/guide/` から `docs/translation-dashboard.png` に正しく解決されます。

ソースファイルと同じディレクトリにある相対パスのアセットについては、`postProcessing`の正規表現による修正は不要です。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks`および`linkRewriteDocsRoot`

| オプション                                   | 効果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | フラットリンクリライターを明示的に有効または無効にします（`docsOutput.style = "flat"`時の既定値を上書き） |
| `docsOutput.linkRewriteDocsRoot`     | `depthPrefix`の計算元となるルート（既定値は`"."`）                                                        |
| `docsOutput.flatPreserveRelativeDir` | 出力パスのレイアウトに影響し、リライターは既知の翻訳済みファイルのターゲットパスを計算する際にこのレイアウトを使用します       |

---

<a id="common-mistakes-and-troubleshooting"></a>
