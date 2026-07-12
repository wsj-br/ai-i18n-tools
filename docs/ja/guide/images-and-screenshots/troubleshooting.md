<a id="common-mistakes-and-troubleshooting"></a>
# よくある間違いとトラブルシューティング

**スクリーンショットパスにロケールディレクトリがありません**
`images/screenshots/screenshot.png` — ロケールのバリアントを区別できず、書き換えできません。[ロケールごとのフォルダー](/ja/guide/images-and-screenshots/per-locale-folder) の書き換えを使用する前に、`images/screenshots/<locale>/screenshot.png` に再構築してください。

**正規表現にハードコードされたソースロケール**
`"search": "screenshots/en-GB/"` — `sourceLocale`が変更されると、エラーなしに失敗します。代わりに`"search": "screenshots/[^/]+/"`を使用してください。

**SVGのソースと出力が同じディレクトリにある**
`svg.sourcePath`と`svg.outputDir`の出力先が重なると、生成されたファイルが手動編集されたソースと混在します。別々のディレクトリに配置してください。

**同じ場所にあるSVGに対してDocusaurusの絶対静的URLを使用**
`/img/diagram.svg`（`static/img/`から）は、翻訳された出力で`../assets/`に書き換えるための`regexAdjustments`ルールを必要とします。これを回避するには、元のSVGを`static/assets/`に配置し、初めから相対パスの`../assets/diagram.svg`を使用してください。

**Docusaurusで`docs/assets`のシンボリックリンクが欠落している**
シンボリックリンクがなければ、`docs/user-guide/`内のソースドキュメントが相対パスで`static/assets/`内のPNGやSVGを参照できなくなります。プロジェクト作成時に`ln -s ../static/assets documentation/docs/assets`でシンボリックリンクを設定してください。

**`take-screenshots` スクリプトはソースロケールのみをキャプチャします**
ロケールごとのフォルダーレイアウトでは、すべてのロケールに PNG ファイルが必要です。スクリプトが `en-GB` のみをキャプチャする場合、翻訳されたドキュメントには、存在しないファイルを指す書き換えられたパスが含まれます。

**`regexAdjustments` フェンスされた設定例内での書き換え**
`postProcessing` は、フェンスされたコードブロックを含む、翻訳されたマークダウン本文全体で実行されます。ドキュメントページに一致するパスを含む設定スニペット（例: `screenshots/en-GB/`）が埋め込まれている場合、そのスニペットも翻訳出力で書き換えられます。再利用可能な例では汎用的な `screenshots/[^/]+/` 形式を優先するか、翻訳されたドキュメントの図解内にロケール固有のパスが表示されることを許容してください。
