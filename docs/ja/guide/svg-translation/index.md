<a id="svg-translation"></a>
# SVG の変換

人間が判読できるラベルを含む**SVGイラストと図**用に設計されています。`translate-svg`コマンドは、ソース`.svg`ファイルを読み取り、`<text>`、`<title>`、および`<desc>`要素からテキストを抽出し、アクティブなLLMプロバイダーを介してそれらの文字列を翻訳し、**ターゲットロケールごとに1つの出力SVG**を書き込みます。

これは、ロケール固有の**バイナリ**SVGファイルを出力する唯一のパイプラインです。`translate-docs`はマークダウンの代替テキストとリンク参照を翻訳しますが、SVGアセットを変更またはコピーしません。ページに翻訳されたラベル付きの図が必要な場合は、`features.translateSVG`を有効にして、トップレベルの`svg`ブロックを構成します。

SVG翻訳は、`translate-docs`および`translate-json`と同じSQLiteキャッシュ（`cacheDir`）を使用します。すでに翻訳されたテキストセグメントはキャッシュから提供され、新規または変更されたソーステキストのみがLLMに送信されます。

<a id="when-to-use-svg-translation"></a>
### SVG翻訳を使用するタイミング

次の場合に`translate-svg`を使用します。

- SVGに、ロケールごとに変更する必要がある表示ラベル、タイトル、または説明が含まれている場合。
- Webアプリが実行時にロケール固有の図ファイルをロードする場合（例：`dashboard.de.svg`）。
- ドキュメントシステムサイト（Docusaurus、Astro Starlight、VitePress）が、翻訳されたSVGを翻訳されたマークダウンの横に配置する場合。

次の場合には`translate-svg`を**使用しないでください**。

- 翻訳可能なテキストのない装飾的なSVG（アイコン、ロゴ、背景）。
- ラスタースクリーンショット（PNG、JPEG、WebP）—これらは[画像とスクリーンショット](/guide/images-and-screenshots/)で処理されます。
- `<text>`要素ではなくパスデータに埋め込まれたテキスト—エクストラクターはパスのアウトラインを読み取ることができません。

<a id="design-for-i18n-from-the-start"></a>
### 最初からi18nを考慮した設計

SVGは、ラベルが最初から実際のテキスト要素である場合に最も簡単に翻訳できます。

- 人間が判読できるコピーを`<text>`、`<title>`、および`<desc>`に入力します。
- デザインツールでラベルをパスに変換することは避けてください。パスデータは翻訳者にとって不透明です。
- **ソースSVG**を`svg.outputDir`とは別の専用ディレクトリに保持します。ソースと生成されたロケールファイルを混在させると、どのファイルを安全に編集または再生成できるかを判断できなくなります。

Webアプリの場合、デザインですべて小文字のラベルを使用している場合は`forceLowercase: true`を有効にしてください。これにより、ファイルシステムとCDN間の大文字と小文字の不一致が回避されます。

<a id="output-layouts"></a>
### 出力レイアウト

`translate-svg`は2つの一般的な出力形式をサポートしています。アプリまたはドキュメントサイトが実行時にSVGファイルを参照する方法に基づいて選択してください。

| レイアウト | `svg.style` | 最適な用途 | 子ガイド |
|--------|-------------|----------|-------------|
| **フラット（Webアプリ）** | `"flat"` | Next.js、Vite、およびロケールコード化されたファイル名でSVGを埋め込むその他のアプリ | [Webアプリ（フラットSVG）](/guide/svg-translation/translated-svg-web-app) |
| **コロケーション（ドキュメントシステム）** | `"nested"` + `pathTemplate` | Docusaurusや、翻訳されたアセットが翻訳されたページの横に配置されるその他のドキュメントシステムサイト | [コロケーションSVG](/guide/svg-translation/translated-svg-colocated) |

**フラットレイアウト**は、`public/assets/diagram.de.svg`のようなファイルを`diagram.en-GB.svg`の横に書き込みます。アプリはロケールサフィックスでそれらを参照します。

```tsx
<img src={`/assets/diagram.${locale}.svg`} alt="Architecture diagram" />
```

**コロケーションレイアウト**は、各ロケールのSVGをそのロケールのコンテンツツリーに書き込みます（例：`i18n/de/.../assets/diagram.svg`）。ソースと翻訳されたマークダウンは同じ相対パス（`../assets/diagram.svg`）を使用します。`regexAdjustments`ルールは必要ありません。

SVGレイアウトがラスタースクリーンショット戦略とどのように適合するかについては、[画像とスクリーンショットの決定ガイド](/guide/images-and-screenshots/#decision-guide)を参照してください。

<a id="step-1-enable-and-configure"></a>
### ステップ1：有効化と設定

機能を有効にし、`translate-svg`をソースファイルと出力ルートに指定します。

```json
{
  "features": {
    "translateSVG": true
  },
  "svg": {
    "sourcePath": "images",
    "outputDir": "public/assets",
    "style": "flat"
  }
}
```

主な`svg`フィールド:

- `sourcePath` — 1つ以上のディレクトリまたはグロブパターン（例: `"images/*.svg"`、`"**/icons/*.svg"`）。プロジェクトルートから再帰的にスキャンされます。
- `outputDir` — 翻訳されたSVG出力のルートディレクトリ。
- `style` — カスタム`"flat"`を使用しない場合の`"nested"`または`pathTemplate`。
- `pathTemplate` — プレースホルダー`{outputDir}`、`{locale}`、`{llocale}`、`{basename}`、`{stem}`などを含むオプションのカスタム出力パス（併置されたドキュメントシステムレイアウトに必要）。
- `forceLowercase` — 再構築時に小文字に翻訳されたテキスト。

フィールドの完全なリファレンス: [設定 — `svg`](/reference/configuration#svg)。

<a id="step-2-translate"></a>
### ステップ2: 翻訳

```bash
npx ai-i18n-tools translate-svg
```

単一ロケールの翻訳:

```bash
npx ai-i18n-tools translate-svg --locale de
```

ファイルを書き込まずにプレビュー:

```bash
npx ai-i18n-tools translate-svg --dry-run
```

`sync`は、`features.translateSVG`と`svg`の両方が設定されている場合、SVGステップを自動的に実行します（`--no-svg`でスキップ）。共通のフラグには、`-l` / `--locale`、`-p` / `--path`、`-j` / `--concurrency`、および`--force` / `--force-update`が含まれます。

<a id="troubleshooting"></a>
### トラブルシューティング

一般的なSVGの問題 — 混在するソース/出力ディレクトリ、Docusaurus上の絶対静的URL、パスレイアウトの誤り — は、[SVGトラブルシューティング](/guide/svg-translation/troubleshooting)で説明されています。ラスターアセットとリンクの書き換えについては、[画像とスクリーンショットのトラブルシューティング](/guide/images-and-screenshots/troubleshooting)を参照してください。
