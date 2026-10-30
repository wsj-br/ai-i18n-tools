<a id="svg-troubleshooting"></a>
# SVG のトラブルシューティング

[画像とスクリーンショットのトラブルシューティング](/ja/guide/images-and-screenshots/troubleshooting)も参照してください。

- **SVGのソースと出力が同じディレクトリにある場合** — `svg.sourcePath`と`svg.outputDir`は分離してください。
- **同じ場所に配置されたSVGに対するDocusaurusの絶対静的URL** — 最初から相対`../assets/`パスを使用してください。
- **翻訳後に予期しない閉じタグ`text`と`g`** — Inkscapeは、実際のラベルの隣に空の自己閉じ`<text … />`を生成することがよくあります。古いエクストラクタの正規表現は、それらを次の`</text>`までまたがり、余分な閉じタグを書き込んでいました。アップグレードして`translate-svg`（または`sync`）を再実行し、ロケールSVGを再生成してください。
- **ヒンディー語、アラビア語、CJK、またはキリル文字のSVGにおけるローマ字化された、またはラテン文字のみのラベル** — ドキュメントと同じ表記システムポリシーが適用されます。スクリプトが間違っているキャッシュ行は、次回の`translate-svg` / `sync`で拒否されます。グローバル`--debug-failed`を使用して再実行すると、すべてのモデルが失敗した場合だけでなく、破棄されたモデル**ごと**に（プロンプト、生の出力、スクリプトエラー）`cacheDir`の下に`FAILED-TRANSLATION`ログが書き込まれます。[ヒンディー語、アラビア語、CJK、またはキリル文字の出力がローマ字化される](/ja/guide/documents/troubleshooting#hindi-arabic-cjk-or-cyrillic-output-is-romanised-latin-letters)を参照してください。
