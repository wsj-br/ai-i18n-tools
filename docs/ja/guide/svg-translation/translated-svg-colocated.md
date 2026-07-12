<a id="colocated-translated-svg-doc-system"></a>
# 同居翻訳済みSVG (doc-system)

翻訳されたSVGイラストが、各ロケールのコンテンツディレクトリにある翻訳されたドキュメント（[併置されたスクリーンショット](/ja/guide/images-and-screenshots/colocated-screenshots)と同じ場所）と一緒に表示されるドキュメントシステムサイトで使用します。Docusaurusプリセットが主な例です。

<a id="config"></a>
### 設定

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` は、併置されたスクリーンショットがPNGに使用するのと同じ `current/assets/` ディレクトリに、ロケールごとに1つのSVGを書き込みます。

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### ソースMarkdown

すべてのロケールのドキュメントは同じ相対パスを使用します。

```markdown
![Diagram](../assets/diagram.svg)
```

英語ロケールでは、シンボリックリンク`docs/assets → ../static/assets`がこれを解決します。翻訳済みロケールでは、直接`current/assets/`に解決されます。

英語のソースドキュメントと翻訳済み出力ドキュメントはパスが同一のため、`regexAdjustments`ルールは必要ありません。

<a id="svg-source-location"></a>
### SVGソースの場所

推奨：ソースSVGをen-GB用PNGと同じ場所である`documentation/static/assets/`内に保存してください。これにより、すべてのドキュメントアセットが1か所にまとまり、同じ`docs/assets`シンボリックリンクで両方をカバーできます。`svg.sourcePath`のエントリは、その後`documentation/static/assets/name.svg`を指すようにします。

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` プレースホルダー

| プレースホルダー              | 値                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir`の絶対パス（解決後）              |
| `{locale}`               | ターゲットロケールコード                                     |
| `{LOCALE}`               | ロケールコード（大文字）                                 |
| `{relPath}`              | `sourcePath`ルートからソースSVGへの相対パス |
| `{stem}`                 | 拡張子なしのファイル名                             |
| `{basename}`             | 拡張子付きのファイル名                                |
| `{extension}`            | ドットを含む拡張子                                |
| `{relativeToSourceRoot}` | 最も近い`sourcePath`ルートからの相対パス       |

[SVG設定テーブル](/ja/reference/configuration#svg)の完全なリファレンス。

<a id="implementation-example"></a>
### 実装例

[duplistatus](https://github.com/wsj-br/duplistatus) — [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json) 内の `pathTemplate` を含むネストされた `svg` ブロック。`documentation/static/assets/` 内のソースSVG（例: [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/assets/duplistatus_toolbar.svg)）。`translate-svg` はロケールごとのファイルをコロケーションされたPNGの隣の `documentation/i18n/<locale>/…/current/assets/` に書き込みます。ドキュメントは `../assets/` パス経由でそれらを埋め込み（例: [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md)）、`regexAdjustments` ブリッジは不要です。

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
