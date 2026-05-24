<a id="locale-assets-guide"></a>
# ロケール別アセットのガイド

このガイドでは、`ai-i18n-tools`を使用するプロジェクトにおいて、ロケールに応じたアセット（PNG、JPEG、WebPなどのスクリーンショットや、イラスト付きSVGファイル）を扱う方法について説明します。各利用可能なパターンとその使用タイミング、また後から新しいロケールを追加しても構造的な修正が不要なプロジェクトの初期設定方法についても解説します。

SVG設定のリファレンスについては、[GETTING_STARTED.md](GETTING_STARTED.ja.md) 内の [`svg`](#svg) セクションを参照してください。`postProcessing.regexAdjustments`オプションについては、[設定リファレンス](GETTING_STARTED.ja.md#configuration-reference) をご覧ください。

| 設定パス | 値 | 使用ケース | 備考 |
|-------------|-------|----------|-------|
| `documentations[].markdownOutput.style` | `"flat"` | ロケールサフィックス付きのREADME / USER-GUIDEファイル | フラットリンクリライターを有効化。ソースがサブディレクトリにある場合は`flatPreserveRelativeDir`と組み合わせる |
| `documentations[].markdownOutput.style` | `"nested"` (デフォルト) | `outputDir`直下のシンプルなロケールサブフォルダー | フラットリンクリライターは使用しない |
| `documentations[].markdownOutput.style` | `"doc-system"` | ロケールプレフィックス付きのドキュメントツリー（カスタムジェネレーター） | `docsRoot`および`localeSubpath`を設定。フラットリンクリライターは動作しない |
| `documentations[].markdownOutput.style` | `"docusaurus"` / `"astro-starlight"` | 事前定義済み`doc-system`レイアウト | `localeSubpath`向けにジェネレーター固有のデフォルトを持つエイリアス |
| `svg.style` | `"flat"` | Webアプリ（`name.<locale>.svg`を`public/assets/`に配置） | Markdownの`style`とは別。`translate-svg`によって使用される |
| `svg.style` | `"nested"` | ドキュメントシステムと同居するSVG出力 | よく`pathTemplate`と組み合わせて使用（パターンE） |

このガイドでは、英語の単語だけでなく、設定から正確に引用したJSON文字列を使用しているため、翻訳版でも曖昧さが生じません。

<small>**他の言語で読む：** </small>
<small id="lang-list">[English (GB)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [हिन्दी](./LOCALE-ASSETS-GUIDE.hi.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [中文 (中国大陆)](./LOCALE-ASSETS-GUIDE.zh-CN.md) · [中文 (台灣)](./LOCALE-ASSETS-GUIDE.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [ai-i18n-toolsがアセットに対して行うこと・行わないこと](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [最初から国際化を意識した設計](#design-for-i18n-from-the-start)
  - [`markdownOutput.style = "flat"`を使用したMarkdown（README、USER-GUIDE）](#markdown-with-markdownoutputstyle--flat-readme-user-guide)
  - [ドキュメントシステムサイト（`markdownOutput.style = "doc-system"`）](#doc-system-sites-markdownoutputstyle--doc-system)
    - [Docusaurusプリセット](#docusaurus-preset)
    - [Astro/Starlightプリセット](#astrostarlight-preset)
  - [SVGアセットを使用するWebアプリ（Next.js、Viteなど）](#web-apps-nextjs-vite-etc-with-svg-assets)
- [選定ガイド](#decision-guide)
- [パターンA - 共有ラスター](#pattern-a--shared-raster)
  - [実装例](#implementation-example)
- [パターンB - ロケールごとのフォルダー（URL書き換え）](#pattern-b--per-locale-folder-url-rewriting)
  - [ディレクトリ構成](#directory-layout)
  - [スクリーンショットスクリプトの契約](#screenshot-script-contract)
  - [設定 - `markdownOutput.style = "flat"`](#config--markdownoutputstyle--flat)
  - [設定 - `markdownOutput.style = "doc-system"`](#config--markdownoutputstyle--doc-system)
  - [プリセット - `markdownOutput.style = "docusaurus"`](#preset--markdownoutputstyle--docusaurus)
  - [プリセット - `markdownOutput.style = "astro-starlight"`](#preset--markdownoutputstyle--astro-starlight)
- [パターンC - 同居するラスター（`doc-system`）](#pattern-c--colocated-raster-doc-system)
  - [ディレクトリ構成](#directory-layout-1)
  - [スクリーンショットスクリプトの契約](#screenshot-script-contract-1)
  - [設定](#config)
  - [前提条件](#prerequisites)
  - [実装例](#implementation-example-1)
- [パターンD - `svg.style = "flat"`による翻訳済みSVG](#pattern-d--translated-svg-with-svgstyle--flat)
  - [設定](#config-1)
  - [アプリリファレンス](#app-reference)
  - [ソース配置の推奨](#source-layout-recommendation)
  - [実装例](#implementation-example-2)
- [パターンE - 同居する翻訳済みSVG（ドキュメントシステム）](#pattern-e--colocated-translated-svg-doc-system)
  - [設定](#config-2)
  - [ソースのMarkdown](#source-markdown)
  - [SVGソースの配置場所](#svg-source-location)
  - [`pathTemplate`のプレースホルダー](#pathtemplate-placeholders)
  - [実装例](#implementation-example-3)
- [フラットリンクリライターと2段階フロー](#the-flat-link-rewriter-and-two-step-flow)
  - [`markdownOutput.style = "flat"`の場合の2段階フロー](#two-step-flow-when-markdownoutputstyle--flat)
  - [`flatPreserveRelativeDir`によるファイルごとの深さプレフィックス](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks`および`linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [一般的な間違いとトラブルシューティング](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## ai-i18n-toolsがアセットに対して行うこと（および行わないこと）

`translate-docs`はマークダウン/MDXコンテンツを翻訳します — 画像のaltテキストを含む — しかし、ラスターファイルをコピー、生成、または出力することはありません。翻訳されたページにロケール固有のスクリーンショットが必要な場合は、そのファイルを翻訳されたマークダウンが参照するパスに配置する必要があります。

`translate-svg`はロケール固有のバイナリファイルを出力する唯一のコマンドです。ソースSVGファイルを読み込み、テキスト要素（`<text>`, `<title>`, `<desc>`）を翻訳し、ロケールごとに1つの出力SVGを書き込みます。ツールによってラスターファイル（PNG、JPEG、WebP、GIF）は決して書き込まれません。

---

<a id="design-for-i18n-from-the-start"></a>
## 最初からi18nを考慮した設計

スクリーンショットが存在する前に適切なディレクトリレイアウトを選択することが、後でロケール固有のアセットがどれだけ簡単になるかの最大の要因です。数十のスクリーンショットがコミットされた後にレイアウトを改修することは、パスの再構築とすべてのマークダウン参照の更新を意味します。

<a id="markdown-with-markdownoutputstyle--flat-readme-user-guide"></a>
### `markdownOutput.style = "flat"`を使用したマークダウン（README、ユーザーガイド）

初日からロケールコード付きのサブディレクトリにスクリーンショットを保存してください:

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

後でi18nを追加すると、あなたの`take-screenshots`スクリプトはすべてのロケールに対して`images/screenshots/<locale>/`に書き込み、1つの`regexAdjustments`ルールがそれらすべてを処理します:

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

一般的な`[^/]+`パターンは任意のロケールフォルダ名にマッチします — ソースロケール（例: `screenshots/en-GB/`）をハードコーディングしないでください。`sourceLocale`が変更されると壊れます。

ロケールサブディレクトリ（`images/screenshots/translate.png`）を省略したパスで始めると、Pattern Bが機能する前に全体のツリーを再構築する必要があります。

<a id="doc-system-sites-markdownoutputstyle--doc-system"></a>
### ドキュメントシステムサイト（`markdownOutput.style = "doc-system"`）

翻訳されたページをロケールプレフィックス付きのツリーの下に保存する静的ドキュメントサイトに使用します — Docusaurus i18n、Astro Starlight、および同じ形状に従うカスタムジェネレーター。`docsRoot`の下のファイルは次のように書き込まれます:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`documentations[].markdownOutput.docsRoot`をあなたの英語のソースルートに設定してください（例: `"docs"`または`"src/content/docs"`）。`style: "doc-system"`を直接設定する場合は、`{locale}/`と翻訳されたファイルの間でサイトが使用するパスセグメントに`localeSubpath`も設定する必要があります。エイリアス`"docusaurus"`と`"astro-starlight"`は、デフォルトの`localeSubpath`値を持つプリセット`doc-system`レイアウトです（[出力レイアウト](GETTING_STARTED.ja.md#output-layouts)を参照）。

| プリセットエイリアス | デフォルト `localeSubpath` | 例の出力 |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""`（空） | `src/content/docs/de/guide.md` |

フラットリンクリライターは`doc-system`に対しては**実行されません**（`"flat"`とは異なります）。`postProcessing.regexAdjustments`はソースマークダウンからの元のURLを参照します — 通常は`/img/screenshots/en-GB/foo.png`のような絶対パスまたはサイトルートパスです。

**Pattern B**は、スクリーンショットが共有の静的URLツリーに存在する場合に適用されます: 初日からロケールコード付きのフォルダを使用し、1つの一般的な`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`ルールを使用します（[設定 — ドキュメントシステム](#config--markdownoutputstyle--doc-system)を参照）。

**Pattern C**は、各ロケールの翻訳されたドキュメントがアセットをマークダウンの横に配置する場合に適用されます（URLのリライティングなし）。あなたのスクリーンショットスクリプトは、`{outputDir}`、`{locale}`、および`{localeSubpath}`から派生したパスにPNGを出力する必要があります — 以下のDocusaurusプリセットが参照レイアウトです。

<a id="docusaurus-preset"></a>
#### Docusaurusプリセット

プロジェクト設定時に以下の2つの習慣を導入すれば、後で正規表現による調整は一切不要になります。

1. スクリーンショットを追加する前に、`documentation/docs/assets → ../static/assets` にシンボリックリンクを作成します。Docusaurusのwebpackはデフォルトでシンボリックリンクを追跡するため、これにより、ソースドキュメントと翻訳ドキュメントの両方で同じ相対パスを使用できます。

2. すべてのドキュメントアセット（PNGおよびSVG）を `static/assets/`（単一のディレクトリ）に配置します。`static/img/`（SVG）と `static/assets/`（PNG）のようにアセットを分割しないでください。統一された場所にすることで、英語版および翻訳版のすべてのドキュメントページが同じ相対パス `../assets/name.ext` を参照できるようになります。

ソースのMarkdownでは、すべてのアセットを安定した相対パス `../assets/name.ext` で参照してください。ドキュメントアセットには絶対パスの `/img/` や `/assets/` URL を決して使用しないでください。これらのURLは英語版ソース（`static/` から配信）と翻訳ロケール（翻訳ドキュメントと同じ場所に配置）で異なるため、それらを橋渡しするために `regexAdjustments` ルールを強制的に使用しなければならなくなります。

後でi18nを追加する際、スクリーンショットスクリプトは `getScreenshotDir` 分割（[パターンC](#pattern-c--docusaurus-colocated)を参照）を採用し、`translate-svg` は `pathTemplate` を使用します。正規表現の調整は必要ありません。

> **注記:** `resolve.symlinks = false` 内の `next.config.ts` は、Next.jsアプリケーションのwebpackビルドにおけるシンボリックリンク解決を無効にするだけです。Docusaurusドキュメントサイトのビルド（別個のwebpackインスタンスを使用）には影響しません。

<a id="astrostarlight-preset"></a>
#### Astro/Starlightプリセット

`markdownOutput.style = "doc-system"` と `localeSubpath: ""` と同等 — 翻訳ページは `{outputDir}/{locale}/` の直下に配置されます。

初日からロケールコード付きのパスの下にスクリーンショットを保存します。

```
public/img/screenshots/en-GB/screenshot.png
```

`regexAdjustments` の汎用正規表現を使用します。

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### SVGアセットを使用するWebアプリ（Next.js、Viteなど）

SVGソースファイルは専用のソースディレクトリ（例：`images/` または `src/assets/`）に保存し、`svg.outputDir` を別個の配信用ディレクトリ（例：`public/assets/`）に設定します。ソースSVGファイルと `translate-svg` 出力ファイルを同じフォルダに混在させないでください。生成されたファイルかどうかが判別できなくなります。

初めから翻訳可能なようにSVGを設計します：人間が読めるすべてのラベルに `<text>`、`<title>`、`<desc>` 要素を使用してください。テキストをパスデータとして埋め込むのは避けてください。

ファイルシステムやCDN間での大文字小文字の不一致を防ぐため、`svg` の設定ブロックで `forceLowercase: true` を有効にしてください。

---

<a id="decision-guide"></a>
## 決定ガイド

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| パターン | アセットタイプ              | サイトタイプ                                                            | ツールの仕組み                                               |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A       | ラスタ（共有）               | `markdownOutput.style = "flat"` ドキュメント                             | ファイルごとのリンク書き換え；通常は正規表現不要             |
| B       | ラスタ（ロケールごと）       | `"flat"` または `"doc-system"`（`"docusaurus"`、`"astro-starlight"` を含む） | `regexAdjustments` ロケールセグメントの置換               |
| C       | ラスタ（共置）               | アセットが共置された `"doc-system"`（Docusaurusプリセット）           | スクリーンショットスクリプトがファイルを配置；正規表現不要   |
| D       | SVG（翻訳対象）              | Webアプリ                                                                 | `translate-svg` と `svg.style = "flat"`                    |
| E       | SVG（翻訳対象、共置）        | アセットが共置された `"doc-system"`（Docusaurusプリセット）           | `translate-svg` と `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a--shared-raster"></a>
## パターンA - 共有ラスター

`markdownOutput.style = "flat"`の場合、フラットリンクリライターは出力ファイルごとにディーププレフィックスを計算するため、ソースファイルと同じディレクトリにあるアセット（例: `docs/figure.png`を`docs/page.md`から`figure.png`として参照）は、すべての翻訳済み出力で正しく解決されます。この場合、`postProcessing.regexAdjustments`ルールは必要ありません。

例: このパッケージは`docs/GETTING_STARTED.md`を`translated-docs/docs/GETTING_STARTED.<locale>.md`に変換します。兄弟ファイルの画像`docs/translation-dashboard.png`は`translation-dashboard.png`として参照されます。リライターは出力ファイルのディレクトリからソースディレクトリまでの深さに応じたプレフィックス（`../../docs/`）を計算し、`../../docs/translation-dashboard.png`を生成します。`translated-docs/docs/`からは、正しく`docs/translation-dashboard.png`に解決されます。

スクリーンショットスクリプトは不要です。ファイルは1回配置すればよく、ロケールごとに変更されることはありません。

ただし、以下の場合は依然として`postProcessing`ルールが必要です。
- アセットが絶対URL（例: `/img/figure.png`）で参照されている場合 — リライターは相対パスのみを処理します
- 他の理由でアセットURLを変更したい場合（例: CDNへの切り替え）

<a id="implementation-example"></a>
### 実装例

このリポジトリは翻訳ダッシュボードのスクリーンショットにパターンAを使用しています。[GETTING_STARTED.md](GETTING_STARTED.ja.md#translation-dashboard)は同じフォルダ内の画像[translation-dashboard.png](../../docs/../docs/translation-dashboard.png)を参照しています。[ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)で`markdownOutput.style = "flat"`と`flatPreserveRelativeDir: true`が設定されており、ファイルごとのディーププレフィックスにより、スクリーンショット`regexAdjustments`なしで画像パスが解決されます。

---

<a id="pattern-b--per-locale-folder-url-rewriting"></a>
## パターンB - ロケールごとのフォルダー（URL書き換え）

`markdownOutput.style = "flat"`を含むREADME/USER-GUIDEや、共有の静的URLツリーからスクリーンショットを提供するドキュメントシステムサイト（`markdownOutput.style = "doc-system"`またはエイリアス`"docusaurus"` / `"astro-starlight"`）に使用します。

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
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### スクリーンショットスクリプトの契約

`take-screenshots`スクリプトは、ソースロケールだけでなくすべてのロケール向けのファイルを出力しなければなりません。`translate-docs`コマンドはパスを書き換えますが、ファイルの作成は行いません。一般的なパターンは次のとおりです。

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

シンプルな`bash`の例は[examples/nextjs-appのスクリーンショットスクリプト](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh)を参照するか、より複雑な例は[Transrewrtプロジェクト](https://github.com/wsj-br/transrewrt)リポジトリの[take-screenshots.js](https://github.com/wsj-br/transrewrt/blob/main/scripts/take-screenshots.js)を参照してください。

> **注:** 以下の4つのサブセクションはすべて同じ`regexAdjustments`ロケールセグメントの置換（`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`）を共有しています。出力レイアウトとフラットリンクリライターの実行タイミングの違いのみです。ご自身の`markdownOutput.style`に合ったサブセクションにジャンプしてください。

<a id="config--markdownoutputstyle--flat"></a>
### 設定 - `markdownOutput.style = "flat"`

`markdownOutput.style = "flat"`の場合、フラットリンクリライターが最初に実行され、Markdown以外のURLにディーププレフィックスが付加されます。リポジトリルートにある`README.md`で`outputDir: "translated-docs/"`の場合、`../`が追加されます。

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

その後、`regexAdjustments`ルールがすでにプレフィックスが付加されたURL内のロケールセグメントを置き換えます。

<details>
<summary>フラットレイアウト用のregexAdjustmentsの例</summary>

```json
"markdownOutput": {
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

`postProcessing`ステップはフラットリンクリライターの後に実行されます。`../`プレフィックスをパターンに含める必要はなく、すでにプレフィックスが付加されたURL内のどこにでも存在するロケールセグメントにマッチするよう`search`パターンを記述してください。

実装例（本番環境）: [Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) 内のスクリーンショットURL（`images/screenshots/en-GB/…`）、[ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json) 内のロケール書き換え、キャプチャスクリプト [take-screenshots.js](https://github.com/wsj-br/transrewrt/blob/main/scripts/take-screenshots.js)（上記の[スクリーンショットスクリプト契約](#screenshot-script-contract)を参照）。

実装例（デモ設定）: [examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 内の2番目の `documentations[]` ブロック（`images/screenshots/[^/]+/` → `${translatedLocale}`）；ヘルパースクリプト [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh)。

<a id="config--markdownoutputstyle--doc-system"></a>
### 設定 - `markdownOutput.style = "doc-system"`

スクリーンショットを共通の静的URLプレフィックスで参照するすべてのドキュメントシステムサイト向けの汎用パターンB。フラットリンクリライターは実行されず、`postProcessing` が元のMarkdown URL内のロケールセグメントを書き換える。

<details>
<summary>ドキュメントシステムレイアウト用のregexAdjustmentsの例</summary>

```json
"markdownOutput": {
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
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

すべてのターゲットロケールに対して同じパスに一致するPNGファイルを配置する（例: `static/img/screenshots/de/screenshot.png`）。デフォルトの`sourceLocale`が変更された場合でもルールが有効であるように、`screenshots/en-GB/` をハードコードするより `screenshots/[^/]+/` を使用することを推奨する。

<a id="preset--markdownoutputstyle--docusaurus"></a>
### プリセット - `markdownOutput.style = "docusaurus"`

`"doc-system"` と同じで、デフォルトの `localeSubpath = "docusaurus-plugin-content-docs/current"` を使用。フラットリンクリライターは実行されず、`postProcessing` は元のMarkdown URLを認識する。英語ページでは通常、ソースロケール付きの絶対パスを使用する:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Docusaurusプリセット用のregexAdjustmentsの例</summary>

```json
"markdownOutput": {
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

実装例: [examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md)（`/img/screenshots/en-GB/screenshot.png`）と [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 内の最初の `documentations[]` ブロック。

<a id="preset--markdownoutputstyle--astro-starlight"></a>
### プリセット - `markdownOutput.style = "astro-starlight"`

`"doc-system"` と同じで `localeSubpath: ""` を使用 — 翻訳済みページは直接 `{outputDir}/{locale}/` の下に配置される。上記の汎用ドキュメントシステム設定と同じパターンBの原則。ソースMarkdownでは `/img/screenshots/en-GB/screenshot.png` を使用:

<details>
<summary>Astro Starlightプリセット用のregexAdjustmentsの例</summary>

```json
"markdownOutput": {
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

実装例: [examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) および [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json)（`screenshots/[^/]+/`）。

---

<a id="pattern-c--colocated-raster-doc-system"></a>
## パターンC - 共置ラスター（`doc-system`）

`doc-system` サイトがロケール固有のアセットを翻訳済みMarkdownの横に共置する場合に使用 — URLの書き換えは不要。Docusaurusプリセット（`markdownOutput.style = "docusaurus"`）がリファレンス実装であるが、`"doc-system"` を使用しカスタム `localeSubpath` を持つ他のジェネレーターも同様の考え方を採用している：英語アセットはソースロケールのパスにあり、翻訳済みアセットは `{outputDir}/{locale}/[localeSubpath/]assets/` の下に配置される。

<a id="directory-layout-1"></a>
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
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

英語（`en-GB`）ロケールの場合、`../assets/` は `static/assets/` へのシンボリックリンクを介して解決される。翻訳済みロケールの場合は、そのロケール独自の `current/assets/` ディレクトリに直接解決される。

<a id="screenshot-script-contract-1"></a>
### スクリーンショットスクリプト契約

スクリプトは、各ロケールに対して正しいディレクトリにPNGを書き込む必要があります。`getScreenshotDir` 関数がその分割をエンコードします。

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

[duplistatus](https://github.com/wsj-br/duplistatus) リポジトリの [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/main/scripts/take-screenshots.ts) にある本番環境の実装を参照してください（ローカル参照コピー: [references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts)）。

<a id="config"></a>
### 設定

ラスターファイルには `regexAdjustments` ルールは必要ありません。`translate-docs` はMarkdown内の代替テキストを翻訳しますが、URLは変更されません。

```json
{
  "markdownOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

プロジェクトで翻訳済みSVGも使用する場合、パターンEがそれらを処理し、追加の正規表現なしでPNGと同じ場所の `current/assets/` に配置されます。

<a id="prerequisites"></a>
### 前提条件

- `docs/assets` シンボリックリンクが存在している必要があります: `ln -s ../static/assets documentation/docs/assets`
- Docusaurusのwebpackはデフォルトでシンボリックリンクを追跡します（Docusaurusビルドでは `resolve.symlinks` がデフォルトで `true` になります）
- シンボリックリンクはソースロケールに対してのみ存在すればよく、翻訳済みビルドでは使用されません

<a id="implementation-example-1"></a>
### 実装例

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/main/scripts/take-screenshots.ts) 内の `getScreenshotDir(locale)`; 英語ドキュメントは同じディレクトリにあるPNGを参照（例: [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md) と `../assets/screen-dashboard-summary.png`）; [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) にPNGの `regexAdjustments` はなし。同じプロジェクトのパターンEのSVGも同じ `current/assets/` ディレクトリに配置されます（以下参照）。

---

<a id="pattern-d--translated-svg-with-svgstyle--flat"></a>
## パターンD - `svg.style = "flat"` を使った翻訳済みSVG

Webアプリがロケール固有のSVGイラストや図を埋め込み、実行時にロケールコードで参照する場合に使用します。

<a id="config-1"></a>
### 設定

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` は `images/` 配下のすべての `.svg` を読み取り、ロケールごとに1つのファイルを出力します。

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### アプリ内での参照

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### ソース構成の推奨

ソースのSVGは出力ディレクトリとは別に管理してください。`sourcePath: "images"` と `outputDir: "public/assets"` を使用すると、2つのディレクトリは明確に分かれます。両方を同じディレクトリに設定しないでください。

<a id="implementation-example-2"></a>
### 実装例

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) 内の `svg` ブロック（`sourcePath: "images"`、`outputDir: "public/assets"`、`svg.style = "flat"`）; ソース [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg); ロケールごとの出力先は [public/assets/](../../docs/../examples/nextjs-app/public/assets/) 配下（例: `translation_demo_svg.de.svg`）; [page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx) 内の実行時URL（`/assets/translation_demo_svg.${locale}.svg`）。

---

<a id="pattern-e--colocated-translated-svg-doc-system"></a>
## パターンE - 共存する翻訳済みSVG（ドキュメントシステム向け）

ドキュメントシステムのサイト向けに、翻訳済みのSVGイラストを各ロケールのコンテンツディレクトリ内の翻訳済みドキュメントと併せて配置する場合に使用します。これはパターンCのラスタースクリーンショットと同じ場所です。Docusaurusプリセットが代表的な例です。

<a id="config-2"></a>
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

`translate-svg` は、各ロケールごとに1つのSVGを、Pattern CがPNG用に使用するのと同じ`current/assets/`ディレクトリに出力します。

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### ソースMarkdown

すべてのロケールのドキュメントは同じ相対パスを使用します。

```markdown
![Diagram](../../docs/../assets/diagram.svg)
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

詳細は[svg設定テーブル](GETTING_STARTED.ja.md#svg)を参照してください。

<a id="implementation-example-3"></a>
### 実装例

[duplistatus](https://github.com/wsj-br/duplistatus) — [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) 内の入れ子になった`svg`ブロックと`pathTemplate`；ソースSVGは`documentation/static/img/`の下にリストされています（例：[duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)）；`translate-svg`はロケールごとのファイルをPattern CのPNGが置かれている`documentation/i18n/<locale>/…/current/assets/`ディレクトリに出力；ドキュメントは現在`/img/duplistatus_*.svg`を使ってこれらを埋め込んでいます（例：[overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)）。SVGの`regexAdjustments`ブリッジを削除し、将来的には`../assets/`パスに移行する計画については、[task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md)を参照してください。

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## フラットリンクリライターと2段階のフロー

`markdownOutput.style = "flat"`の場合（または`rewriteRelativeLinks: false`またはカスタム`pathTemplate`が設定されていない場合）、`postProcessing`の前に組み込みのリライターが実行されます。このリライターはドキュメント間のリンク（ロケール接尾辞の追加）を処理し、Markdown以外のアセットURLには深さ接頭辞を付加します。

<a id="two-step-flow-when-markdownoutputstyle--flat"></a>
### `markdownOutput.style = "flat"`時の2段階のフロー

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

`outputDir: "translated-docs/"`かつソース`README.md`がリポジトリのルートにある場合の例：

1. フラットリンクリライター：`images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`（`translated-docs/`用の`../`が1つ）
2. `postProcessing`の正規表現`images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`：`../images/screenshots/de/foo.png`

`markdownOutput.style = "doc-system"`の場合（`"docusaurus"`、`"astro-starlight"`、`"nested"`を含む）は、フラットリンクリライターは実行されません。`postProcessing`は翻訳されたMarkdownから元のURL（通常は`/img/screenshots/en-GB/foo.png`のような絶対パス）をそのまま受け取ります。

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### ファイルごとの深さ接頭辞と`flatPreserveRelativeDir`

深さ接頭辞はバッチ全体に対してグローバルにではなく、出力ファイルごとに個別に計算されます。各ソースファイルについて、リライターは出力ファイルのディレクトリからソースファイルのディレクトリへの相対パスを計算し、それを接頭辞として使用します。

つまり、`flatPreserveRelativeDir: true`を使用すると、サブディレクトリ内のソースファイルは自動的に正しい接頭辞が付与されます。たとえば、`docs/GETTING_STARTED.md`が`translated-docs/docs/GETTING_STARTED.<locale>.md`に出力される場合、ファイルごとの接頭辞は`../../docs/`となり、ソースからの相対パスであるアセット`translation-dashboard.png`は`../../docs/translation-dashboard.png`になります。これは`translated-docs/docs/`から`docs/translation-dashboard.png`への解決を正しく行います。

ソースファイルと同じディレクトリにある相対パスのアセットについては、`postProcessing`の正規表現による修正は不要です。

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks`および`linkRewriteDocsRoot`

| オプション                                   | 効果                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `markdownOutput.rewriteRelativeLinks`    | フラットリンクリライターを明示的に有効または無効にします（`markdownOutput.style = "flat"`時のデフォルトを上書き） |
| `markdownOutput.linkRewriteDocsRoot`     | `depthPrefix`の計算基準となるルート（デフォルトは`"."`）                                                        |
| `markdownOutput.flatPreserveRelativeDir` | 出力パスのレイアウトに影響し、リライターは既知の翻訳済みファイルのターゲットパスを計算する際にこれを使用します       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
<a id="common-mistakes"></a>
## よくあるミスとトラブルシューティング

**スクリーンショットのパスにロケールディレクトリが含まれない**
`images/screenshots/screenshot.png` — ロケールのバリエーションを区別できず、書き換えもできません。パターンBを適用する前に`images/screenshots/<locale>/screenshot.png`にリファクタリングしてください。

**正規表現にハードコードされたソースロケール**
`"search": "screenshots/en-GB/"` — `sourceLocale`が変更されると、エラーなしに失敗します。代わりに`"search": "screenshots/[^/]+/"`を使用してください。

**SVGのソースと出力が同じディレクトリにある**
`svg.sourcePath`と`svg.outputDir`の出力先が重なると、生成されたファイルが手動編集されたソースと混在します。別々のディレクトリに配置してください。

**同じ場所にあるSVGに対してDocusaurusの絶対静的URLを使用**
`/img/diagram.svg`（`static/img/`から）は、翻訳された出力で`../assets/`に書き換えるための`regexAdjustments`ルールを必要とします。これを回避するには、元のSVGを`static/assets/`に配置し、初めから相対パスの`../assets/diagram.svg`を使用してください。

**Docusaurusで`docs/assets`のシンボリックリンクが欠落している**
シンボリックリンクがなければ、`docs/user-guide/`内のソースドキュメントが相対パスで`static/assets/`内のPNGやSVGを参照できなくなります。プロジェクト作成時に`ln -s ../static/assets documentation/docs/assets`でシンボリックリンクを設定してください。

**`take-screenshots` スクリプトはソースロケールのみをキャプチャします**
パターン B では、すべてのロケールに対して PNG ファイルが必要です。スクリプトが `en-GB` のみをキャプチャする場合、翻訳されたドキュメントには存在しないファイルを指すパスが記述されます。
