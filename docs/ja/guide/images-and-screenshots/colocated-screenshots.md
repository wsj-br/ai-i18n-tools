<a id="colocated-raster-doc-system"></a>
# 共存ラスター (`doc-system`)

翻訳済みMarkdownファイルの横にロケール固有のアセットを配置する`doc-system`サイトで使用します。URLの書き換えは不要です。Docusaurusプリセット（`docsOutput.style = "docusaurus"`）がリファレンス実装です。`"doc-system"`とカスタム`localeSubpath`を使用する他のジェネレーターも同様の考え方を採用しています：英語のアセットはソースロケールのパスに配置され、翻訳済みアセットは`{outputDir}/{locale}/[localeSubpath/]assets/`の下に配置されます。

> **リポジトリ内に例がない理由:** このリポジトリのDocusaurusデモ（[`examples/docusaurus-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/)、[`examples/nextjs-app`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/)）は代わりに[ロケールごとのフォルダ](/ja/guide/images-and-screenshots/per-locale-folder)レイアウトを使用しています。詳細は[決定ガイド](/ja/guide/images-and-screenshots/#decision-guide)を参照してください。コロケーションされた`../assets/`は推奨されるグリーンフィールドパターンであり、[duplistatus](https://github.com/wsj-br/duplistatus)は本番環境の完全な参考実装です。

<a id="directory-layout"></a>
### ディレクトリ構成

<details>
<summary>共置アセットディレクトリツリーの例（Docusaurus）</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

すべてのロケールのドキュメントが同じ相対パスを使用:

```markdown
![Dashboard](../assets/screen-dashboard.png)
```

英語（`en-GB`）ロケールの場合、`../assets/` は `static/assets/` へのシンボリックリンクを介して解決される。翻訳済みロケールの場合は、そのロケール独自の `current/assets/` ディレクトリに直接解決される。

<a id="screenshot-script-contract"></a>
### スクリーンショットスクリプトの契約

スクリプトは、各ロケールに対して正しいディレクトリにPNGを書き込む必要があります。`getScreenshotDir` 関数がその分割をエンコードします。

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

[duplistatus](https://github.com/wsj-br/duplistatus)リポジトリの[take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)で実際のインプリメンテーションを参照してください。

<a id="config"></a>
### 設定

ラスターファイルには `regexAdjustments` ルールは必要ありません。`translate-docs` はMarkdown内の代替テキストを翻訳しますが、URLは変更されません。

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

プロジェクトで翻訳されたSVGも使用されている場合、[併置SVG翻訳](/ja/guide/svg-translation/translated-svg-colocated)がそれらを処理し、追加の正規表現なしでPNGとともに`current/assets/`に配置されます。

<a id="prerequisites"></a>
### 前提条件

- `docs/assets` シンボリックリンクが存在している必要があります: `ln -s ../static/assets documentation/docs/assets`
- Docusaurusのwebpackはデフォルトでシンボリックリンクを追跡します（Docusaurusビルドでは `resolve.symlinks` がデフォルトで `true` になります）
- シンボリックリンクはソースロケールに対してのみ存在すればよく、翻訳済みビルドでは使用されません

<a id="implementation-example"></a>
### 実装例

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)の`getScreenshotDir(locale)`。英語のドキュメントでは、併置されたPNG（例: `../assets/screen-dashboard-summary.png`を含む[dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md)）を参照しています。同じプロジェクトの併置されたSVGは、同じ`current/assets/`ディレクトリに配置されます — [併置SVG](/ja/guide/svg-translation/translated-svg-colocated)を参照してください。
