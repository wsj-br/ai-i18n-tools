<a id="svg-troubleshooting"></a>
# SVG のトラブルシューティング

[画像とスクリーンショットのトラブルシューティング](/ja/guide/images-and-screenshots/troubleshooting)も参照してください。

- **SVG のソースと出力が同じディレクトリにある** — `svg.sourcePath` と `svg.outputDir` は分けてください。
- **同じ場所に配置された SVG に対する Docusaurus の静的 URL が絶対パスになっている** — 最初から相対パス `../assets/` を使用してください。
- **翻訳後に予期しない閉じタグ `text` と `g` がある** — Inkscape は、実際のラベルの隣に空の自己終了タグ `<text … />` を出力することがよくあります。古い抽出ツールの正規表現は、それらを次の `</text>` までスパンし、余分な閉じタグを書き込んでいました。アップグレードして `translate-svg` (または `sync`) を再実行し、ロケール SVG を再生成してください。
- **ヒンディー語、アラビア語、CJK、またはキリル文字の SVG でラベルがローマ字化またはラテン文字のみになっている** — ドキュメントと同じ書記体系ポリシーが適用されます。書記体系が間違っているキャッシュ行は、次の `translate-svg` / `sync` で拒否されます。グローバルな `--debug-failed` を付けて再実行すると、すべてのモデルが失敗した場合だけでなく、破棄された**各**モデル (プロンプト、生の出力、スクリプトエラー) について、`cacheDir` の下に `FAILED-TRANSLATION` ログが書き込まれます。[ヒンディー語、アラビア語、CJK、またはキリル文字の出力がローマ字化される](/ja/guide/documents/troubleshooting#hindi-arabic-cjk-or-cyrillic-output-is-romanized-latin-letters) を参照してください。
