<a id="per-locale-folder-url-rewriting"></a>
# ロケールごとのフォルダー (URL書き換え)

`docsOutput.style = "flat"`を持つREADME/USER-GUIDE、および共有された静的URLツリーからスクリーンショットを提供するドキュメントシステムサイト（`docsOutput.style = "doc-system"`またはエイリアス`"docusaurus"` / `"astro-starlight"`）に使用します。

<a id="directory-layout"></a>
### ディレクトリ構成

<details>
<summary>ロケールごとのスクリーンショットディレクトリツリーの例</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

ソースのMarkdownはソースロケールのディレクトリを参照します。

```markdown
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### スクリーンショットスクリプトの契約

`take-screenshots`スクリプトは、ソースロケールだけでなく、すべてのロケールに対してファイルを書き込む必要があります。`translate-docs`コマンドはパスを書き換えますが、ファイルは作成しません。一般的なヘルパーは次のとおりです。

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh の [examples/nextjs-app のスクリーンショットスクリプト] で簡単な `bash` の例を、または [Transrewrt プロジェクト](https://github.com/wsj-br/transrewrt) リポジトリの [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) でより複雑な例を参照してください。

> **注:** 以下の4つのサブセクションでは、同じ `regexAdjustments` ロケールセグメントの入れ替え (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`) を共有しています。出力レイアウトとフラットリンクリライターを最初に実行するかどうかが異なるだけです。ご使用の `docsOutput.style` に一致するサブセクションにジャンプしてください。

<a id="config---docsoutputstyle--flat"></a>
### 設定 - `docsOutput.style = "flat"`

`docsOutput.style = "flat"`の場合、フラットリンクリライターが最初に実行され、Markdown以外のURLにディプスプレフィックスが付加されます。リポジトリルートにある`README.md`で`outputDir: "translated-docs/"`の場合、`../`が追加されます。

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

その後、`regexAdjustments`ルールがすでにプレフィックスが付加されたURL内のロケールセグメントを置き換えます。

<details>
<summary>フラットレイアウト用のregexAdjustmentsの例</summary>

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

</details>

結果: `../images/screenshots/de/translate.png` — `translated-docs/README.de.md`からリポジトリルートへの正しい相対パス。

`postProcessing`ステップは、フラットリンク書き換えの後に実行されます。すでにプレフィックスが付いているURL内のどこかにロケールセグメントと一致する`search`正規表現を記述します。正規表現に`../`プレフィックスを含める必要はありません。

実装例（本番）：[Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md)内のスクリーンショットURL（`images/screenshots/en-GB/…`）、[ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json)内のロケール書き換え、キャプチャスクリプト[take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)（上記の[スクリーンショットスクリプト契約](#screenshot-script-contract)を参照）。

実装例（デモ設定）：[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) の2番目の `docs[]` ブロック（`images/screenshots/[^/]+/` → `${translatedLocale}`）。ヘルパースクリプト [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh)。

<a id="config---docsoutputstyle--doc-system"></a>
### 設定 - `docsOutput.style = "doc-system"`

共有の静的URLプレフィックスを介してスクリーンショットを参照するすべてのドキュメントシステムサイトで、ロケールごとの同じフォルダアプローチを使用します。フラットリンク書き換えは実行されません。`postProcessing`は元のマークダウンURLのロケールセグメントを書き換えます。

<details>
<summary>ドキュメントシステムレイアウト用のregexAdjustmentsの例</summary>

```json
"docsOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

`localeSubpath` を、ジェネレーターの `{locale}/` と翻訳済みファイルの間のレイアウトに合わせて設定するか、デフォルトが適している場合は `"doc-system"` の代わりにプリセットエイリアス（`"docusaurus"`、`"astro-starlight"`）を使用する。ソースMarkdownでは通常、URL内にソースロケールが埋め込まれている:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

すべてのターゲットロケールに対して同じパスに一致するPNGファイルを配置する（例: `static/img/screenshots/de/screenshot.png`）。デフォルトの`sourceLocale`が変更された場合でもルールが有効であるように、`screenshots/en-GB/` をハードコードするより `screenshots/[^/]+/` を使用することを推奨する。

<a id="preset---docsoutputstyle--docusaurus"></a>
### プリセット - `docsOutput.style = "docusaurus"`

`"doc-system"` と同じで、デフォルトの `localeSubpath = "docusaurus-plugin-content-docs/current"` を使用。フラットリンクリライターは実行されず、`postProcessing` は元のMarkdown URLを認識する。英語ページでは通常、ソースロケール付きの絶対パスを使用する:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Docusaurusプリセット用のregexAdjustmentsの例</summary>

```json
"docsOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

`docs-site/static/img/screenshots/<locale>/screenshot.png` に一致するPNGファイルを配置する。ソースロケールに依存しない設定の場合は、`screenshots/en-GB/` よりも `screenshots/[^/]+/` を使用することを推奨する。

実装例: [examples/nextjs-app/docs-site/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/docs-site/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) と [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) の最初の `docs[]` ブロック。

<a id="preset---docsoutputstyle--astro-starlight"></a>
### プリセット - `docsOutput.style = "astro-starlight"`

`"doc-system"`と`localeSubpath: ""`と同じです。翻訳されたページは`{outputDir}/{locale}/`の直下にあります。上記の一般的なドキュメントシステム設定と同じロケールごとのフォルダアプローチです。ソースマークダウンは`/img/screenshots/en-GB/screenshot.png`を使用します。

<details>
<summary>Astro Starlightプリセット用のregexAdjustmentsの例</summary>

```json
"docsOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

`public/img/screenshots/<locale>/screenshot.png` にPNGファイルを配置する。

実装例：[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) — [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) および [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`)。

---

<a id="colocated-raster-doc-system"></a>
