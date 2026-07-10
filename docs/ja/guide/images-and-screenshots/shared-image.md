<a id="shared-raster"></a>
# 共有ラスター

`docsOutput.style = "flat"`の場合、フラットリンクリライターは出力ファイルごとにディプスプレフィックスを計算するため、ソースファイルと同じ場所にあるアセット（たとえば、`docs/page.md`から`figure.png`として参照される`docs/figure.png`）は、すべての翻訳済み出力で正しく解決されます。したがって、`postProcessing.regexAdjustments`ルールは必要ありません。

例: あるプロジェクトで`docs/guide/quick-start.md`が`translated-docs/docs/guide/quick-start.<locale>.md`に翻訳されます。兄弟イメージ`docs/translation-dashboard.png`は`quick-start.md`から`../translation-dashboard.png`として参照されます。リライターは、出力ファイルのディレクトリからソースディレクトリ（`../../docs/`）へのファイルごとのプレフィックスを計算し、`../../docs/translation-dashboard.png`を生成します。`translated-docs/docs/guide/`から、それは`docs/translation-dashboard.png`に正しく解決されます。

ただし、以下の場合は依然として`postProcessing`ルールが必要です。
- アセットが絶対URL（例: `/img/figure.png`）で参照されている場合 — リライターは相対パスのみを処理します
- 他の理由でアセットURLを変更したい場合（例: CDNへの切り替え）

<a id="implementation-example"></a>
### 実装例

このリポジトリのドキュメントでは、共有イメージの絶対URLバリアントを使用しています。[翻訳ダッシュボードガイド](/ja/guide/translation-dashboard/)では、スクリーンショットが`![Translation Dashboard](/translation-dashboard.png)`として参照されています。これは、[`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png)から提供される絶対的なサイトルートパスです。URLはすべてのロケールで同じであるため、`postProcessing.regexAdjustments`ルールは必要ありません。ダッシュボードUIが変更された場合は、[`scripts/screenshot-translation-dashboard.sh`](https://github.com/wsj-br/ai-i18n-tools/tree/main/scripts/screenshot-translation-dashboard.sh)でPNGを更新してください。
