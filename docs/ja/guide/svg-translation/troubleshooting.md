<a id="svg-troubleshooting"></a>
# SVG のトラブルシューティング

[画像とスクリーンショットのトラブルシューティング](/ja/guide/images-and-screenshots/troubleshooting)も参照してください。

- **SVGのソースと出力が同じディレクトリにある** — `svg.sourcePath`と`svg.outputDir`を分けてください。
- **コロケーションされたSVGの絶対Docusaurus静的URL** — 最初から相対`../assets/`パスを使用してください。
- **翻訳後に予期しない閉じタグ`text`と`g`** — Inkscapeは実際のラベルの隣に空の自己閉じタグ`<text … />`を頻繁に出力します。古い抽出用正規表現はそれらを次の`</text>`までまたいでしまい、余分な閉じタグを書き込んでいました。アップグレードして`translate-svg`（または`sync`）を再実行し、ロケールSVGを再生成してください。
- **ヒンディー語、アラビア語、CJK、またはキリル文字のSVGにおけるローマ字化またはラテン文字のみのラベル** — ドキュメントと同じ書記体系ポリシーが適用されます。誤った書記体系のキャッシュ行は次回の`translate-svg` / `sync`で拒否されます。グローバル`--debug-failed`を指定して再実行し、すべてのモデルが失敗した場合だけでなく、**各**破棄されたモデル（プロンプト、生の出力、スクリプトエラー）について`cacheDir`配下に`FAILED-TRANSLATION`ログを書き出してください。[ヒンディー語、アラビア語、CJK、またはキリル文字の出力がローマ字化される](/ja/guide/documents/troubleshooting#wrong-script-or-romanized-output)を参照してください。
