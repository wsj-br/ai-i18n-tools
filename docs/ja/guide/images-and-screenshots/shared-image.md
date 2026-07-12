<a id="shared-raster"></a>
# 共有ラスター

すべてのロケールで単一の画像が共有される場合（ロケールごとのバリアントがない場合）に使用します。

- **`docsOutput.style = "flat"`** — フラットリンクリライターは出力ファイルごとに深度プレフィックスを計算するため、ソースファイルの隣にある相対アセット（例: `docs/figure.png` が `docs/page.md` から `figure.png` として参照される）は、翻訳されたすべての出力で正しく解決されます — `postProcessing.regexAdjustments` ルールは不要です。ソースファイルがサブディレクトリにある場合は、`flatPreserveRelativeDir: true` を有効にして出力パスがソースツリーを保持するようにします（[ファイルごとの深度プレフィックス](/ja/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)を参照）。
- **`docsOutput.style = "vitepress"`**（およびリノーマライザーを備えるその他のドキュメントシステムプリセット） — `/translation-dashboard.png` のようなサイトルート絶対パスは、URLがすべてのロケールで同一の場合、変更されずにそのまま残ります — `regexAdjustments` ルールは不要です。

**フラットの例:** あるプロジェクトが `docs/guide/quick-start.md` を `translated-docs/docs/guide/quick-start.<locale>.md` に翻訳します。これは `flatPreserveRelativeDir: true` を前提としており、`docs/guide/quick-start.md` は `translated-docs/docs/guide/quick-start.<locale>.md` に出力されます（`translated-docs/quick-start.<locale>.md` ではありません）。隣接する画像 `docs/translation-dashboard.png` は `quick-start.md` から `../translation-dashboard.png` として参照されます。リライターは出力ファイルのディレクトリからソースディレクトリまでのファイルごとのプレフィックス（`../../docs/`）を計算し、`../../docs/translation-dashboard.png` を生成します。`translated-docs/docs/guide/` からは、`docs/translation-dashboard.png` に正しく解決されます。

以下の場合は `postProcessing` ルールが依然として必要です:
- アセットが **`docsOutput.style = "flat"`** で絶対URLとして参照されている場合（例: `/img/figure.png`） — フラットリライターは相対パスのみを処理します
- その他の理由でアセットURLを変更したい場合（例: CDNへの切り替え）

<a id="implementation-example"></a>
### 実装例

このリポジトリ自身のドキュメントは、共有画像の絶対URLバリアントを使用しています: [翻訳ダッシュボードガイド](/ja/guide/translation-dashboard/)はスクリーンショットを `![Translation Dashboard](/translation-dashboard.png)` として参照しています — これは [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png) から配信される絶対のサイトルートパスです。URLはすべてのロケールで同一であるため、`postProcessing.regexAdjustments` ルールは不要です。
