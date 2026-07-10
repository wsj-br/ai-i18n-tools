<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# ai-i18n-toolsがアセットに対して行うこと（行わないこと）

`translate-docs`はマークダウン/MDXコンテンツを翻訳します — 画像のaltテキストを含む — しかし、ラスターファイルをコピー、生成、または出力することはありません。翻訳されたページにロケール固有のスクリーンショットが必要な場合は、そのファイルを翻訳されたマークダウンが参照するパスに配置する必要があります。

`translate-svg`はロケール固有のバイナリファイルを出力する唯一のコマンドです。ソースSVGファイルを読み込み、テキスト要素（`<text>`, `<title>`, `<desc>`）を翻訳し、ロケールごとに1つの出力SVGを書き込みます。ツールによってラスターファイル（PNG、JPEG、WebP、GIF）は決して書き込まれません。

---

<a id="design-for-i18n-from-the-start"></a>
# 最初からi18nを考慮して設計する

スクリーンショットが存在する前に適切なディレクトリレイアウトを選択することが、後でロケール固有のアセットがどれだけ簡単になるかの最大の要因です。数十のスクリーンショットがコミットされた後にレイアウトを改修することは、パスの再構築とすべてのマークダウン参照の更新を意味します。

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### `docsOutput.style = "flat"` を使った Markdown（README、USER-GUIDE）

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

汎用的な `[^/]+` 正規表現は、任意のロケールフォルダー名に一致します。ソースロケール (例: `screenshots/en-GB/`) をハードコードしないでください。`sourceLocale` が変更された場合に機能しなくなります。

ロケールサブディレクトリ (`images/screenshots/translate.png`) を省略したパスから開始した場合、[ロケールごとのフォルダー](/ja/guide/images-and-screenshots/per-locale-folder) の書き換えが機能する前に、ツリー全体を再構築する必要があります。

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### ドキュメントシステムサイト（`docsOutput.style = "doc-system"`）

翻訳されたページをロケールプレフィックス付きのツリーの下に保存する静的ドキュメントサイトに使用します — Docusaurus i18n、Astro Starlight、および同じ形状に従うカスタムジェネレーター。`docsRoot`の下のファイルは次のように書き込まれます:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docs[].docsOutput.docsRoot` を英語のソースルート (例: `"docs"` または `"src/content/docs"`) に設定します。`style: "doc-system"` を直接設定する場合は、`localeSubpath` もサイトが `{locale}/` と翻訳されたファイルの間に使用するパスセグメントに設定する必要があります。エイリアス `"docusaurus"`、`"astro-starlight"`、および `"vitepress"` は、デフォルトの `localeSubpath` 値を持つプリセットの `doc-system` レイアウトです ([出力レイアウト](/ja/guide/documents/output-layouts) を参照)。

| プリセットエイリアス | デフォルト `localeSubpath` | 例の出力 |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""`（空） | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""` (空) | `docs/de/guide/quick-start.md` |

フラットリンクリライターは`doc-system`に対しては**実行されません**（`"flat"`とは異なります）。`postProcessing.regexAdjustments`はソースマークダウンからの元のURLを参照します — 通常は`/img/screenshots/en-GB/foo.png`のような絶対パスまたはサイトルートパスです。

**ロケールごとのフォルダー** レイアウトは、スクリーンショットが共有の静的 URL ツリーに存在する場合に適用されます。最初からロケールコード化されたフォルダーと、汎用的な `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` ルールを 1 つ使用します ([設定 — ドキュメントシステム](#config---docsoutputstyle--doc-system) を参照)。

**コロケーションされたスクリーンショット** は、各ロケールの翻訳されたドキュメントがマークダウンの横にアセットを保存する場合 (URL の書き換えなし) に適用されます。スクリーンショットスクリプトは、`{outputDir}`、`{locale}`、および `{localeSubpath}` から派生したパスに PNG を書き込む必要があります。以下の Docusaurus プリセットは参照レイアウトです。

<a id="docusaurus-preset"></a>
#### Docusaurusプリセット

プロジェクト設定時に以下の2つの習慣を導入すれば、後で正規表現による調整は一切不要になります。

1. スクリーンショットを追加する前に、`documentation/docs/assets → ../static/assets` にシンボリックリンクを作成します。Docusaurusのwebpackはデフォルトでシンボリックリンクを追跡するため、これにより、ソースドキュメントと翻訳ドキュメントの両方で同じ相対パスを使用できます。

2. すべてのドキュメントアセット（PNGおよびSVG）を `static/assets/`（単一のディレクトリ）に配置します。`static/img/`（SVG）と `static/assets/`（PNG）のようにアセットを分割しないでください。統一された場所にすることで、英語版および翻訳版のすべてのドキュメントページが同じ相対パス `../assets/name.ext` を参照できるようになります。

ソースのMarkdownでは、すべてのアセットを安定した相対パス `../assets/name.ext` で参照してください。ドキュメントアセットには絶対パスの `/img/` や `/assets/` URL を決して使用しないでください。これらのURLは英語版ソース（`static/` から配信）と翻訳ロケール（翻訳ドキュメントと同じ場所に配置）で異なるため、それらを橋渡しするために `regexAdjustments` ルールを強制的に使用しなければならなくなります。

後で i18n を追加すると、スクリーンショットスクリプトは `getScreenshotDir` 分割を採用し ([コロケーションされたスクリーンショット](/ja/guide/images-and-screenshots/colocated-screenshots) を参照)、`translate-svg` は `pathTemplate` を使用します。正規表現の調整は必要ありません。

> **注記:** `resolve.symlinks = false` 内の `next.config.ts` は、Next.jsアプリケーションのwebpackビルドにおけるシンボリックリンク解決を無効にするだけです。Docusaurusドキュメントサイトのビルド（別個のwebpackインスタンスを使用）には影響しません。

<a id="astrostarlight-preset"></a>
#### Astro/Starlightプリセット

`{outputDir}/{locale}/` の直下に翻訳済みページが配置される点で、`docsOutput.style = "doc-system"` と `localeSubpath: ""` と同等です。

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
# 決定ガイド

```
Is the asset an SVG with translatable text or labels?
  Yes → Web app SVG or Colocated SVG
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Colocated screenshots (rasters) + Colocated SVG (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Shared image
    Otherwise → Per-locale folder
```

SVG レイアウトについては、[SVG 翻訳](/ja/guide/svg-translation/) ガイドで説明しています。

| レイアウト | アセットの種類 | サイトの種類 | ツールメカニズム |
|---|---|---|---|
| [共有画像](/ja/guide/images-and-screenshots/shared-image) | ラスタ (共有) | `docsOutput.style = "flat"` ドキュメント | ファイルごとのリンク書き換え。通常は正規表現なし |
| [ロケールごとのフォルダー](/ja/guide/images-and-screenshots/per-locale-folder) | ラスタ (ロケールごと) | `"flat"` または `"doc-system"` (`"docusaurus"`、`"astro-starlight"` を含む) | `regexAdjustments` ロケールセグメントスワップ |
| [コロケーションされたスクリーンショット](/ja/guide/images-and-screenshots/colocated-screenshots) | ラスタ (コロケーション) | コロケーションされたアセットを持つ `"doc-system"` (Docusaurus プリセット) | スクリーンショットスクリプトがファイルを配置。正規表現なし |
| [Web アプリ SVG](/ja/guide/svg-translation/translated-svg-web-app) | SVG (翻訳済み) | Web アプリ | `translate-svg` と `svg.style = "flat"` |
| [コロケーションされた SVG](/ja/guide/svg-translation/translated-svg-colocated) | SVG (翻訳済み、コロケーション) | コロケーションされたアセットを持つ `"doc-system"` (Docusaurus プリセット) | `translate-svg` と `svg.style = "nested"` + `pathTemplate` |
