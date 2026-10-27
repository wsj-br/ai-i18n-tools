<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# READMEとMarkdownドキュメントにi18nを追加する

このページは、読者が`README.md`やその他のいくつかのMarkdownファイルから読み始めるような、GitHub、GitLab、Bitbucket、またはその他のホスト上のリポジトリ向けです。ドキュメントサイトのフレームワークを設定する必要はありません。通常のプロジェクトにはアプリまたはCLIも含まれており、READMEはそのアプリと同じ言語と製品用語を使用する必要があります。UI文字列のないライブラリまたはドキュメントのみのリポジトリは、もう一つのケースであり、以下で説明します。

このツールは`README.md`をそのままにし、言語ごとに1つのロケールファイル（例: `translated-docs/README.de.md`）を書き込みます。README内の言語行がこれらのファイルをリンクします。

<a id="which-setup-are-you-in"></a>
## どのセットアップに該当しますか？

| あなたの状況 | スキャフォールド | その後 |
| --- | --- | --- |
| JS/TSアプリとREADME | `ai-i18n-tools init -P openrouter`（`ui-markdown`、デフォルト） | `t()`には[JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js)、READMEにはこのページ |
| PythonアプリとREADME | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | アプリには[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)、READMEにはこのページ |
| その他のテンプレートとREADME | その`init`コマンドに`--with-readme`を追加 | READMEブロックにはこのページ |
| READMEとMarkdownのみ | `ai-i18n-tools init -t docs-markdown -P openrouter` | このページ |

`--with-readme`は`ui-markdown`と`docs-markdown`では何もしません。これらのテンプレートにはすでにREADMEブロックが含まれているためです。

<a id="what-you-get"></a>
## 得られるもの

- `README.md`はソースファイルのままです。ホストはそれをリポジトリのフロントページとしてレンダリングし続けます。
- 各ターゲットロケールは、`translated-docs/README.de.md`のような兄弟ファイルになります。
- ソースおよびすべての翻訳内の言語行には、読者が閲覧しているファイルから機能するリンクとともに、すべてのロケールがリストされます。

これらのファイルも翻訳する必要がある場合は、`CONTRIBUTING.md`、`CHANGELOG.md`、または`docs/`フォルダーを同じブロックに追加します。[README以上のもの](#more-than-the-readme)を参照してください。

<a id="install"></a>
## インストール

CLIをインストールし ([インストール](/ja/guide/installation))、プロバイダーのAPIキーを設定します ([プロバイダーとAPIキー](/ja/guide/quick-start#provider-and-api-key))。Ollamaはキーを必要としません。

`package.json`を持つリポジトリは、パッケージを開発依存関係としてインストールします。Node.jsプロジェクトのないリポジトリは、`npx ai-i18n-tools`を実行するか、[スタンドアロン実行可能ファイル](/ja/guide/installation#standalone-executables)を使用できます。

<a id="scaffold"></a>
## スキャフォールド

JS/TSアプリとREADME（1つのコマンド。`ui-markdown`がデフォルトテンプレートです）:

```bash
ai-i18n-tools init -P openrouter
```

Python、Astro、プレーンHTML、VitePress、Docusaurus、またはその他のテンプレートで、同じREADMEブロックが追加されたもの:

```bash
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

READMEとMarkdownファイルのみ:

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
```

`init`は`ai-i18n-tools.config.json`のみを書き込みます。`README.md`は編集しません。設定にREADMEブロックが含まれている場合、貼り付けるマーカー行を出力し、`README.md`が見つからない場合は警告します。既存の設定はそのままにされます。[既存の設定にブロックを追加する](#add-the-block-to-a-config-you-already-have)のように、ブロックを手動で追加してください。

<a id="configure"></a>
## 設定

重要なキーは4つです:

- `sourceLocale`: そのREADMEが書かれている言語。どの言語でも有効です。このガイドでは英語が一般的な例です。
- `targetLocales`: 追加する言語。
- `features.translateDocs`: trueである必要があります。ハイブリッド設定では`features.translateUIStrings`も設定されます。
- `docs[].contentPaths`: 翻訳するMarkdownファイルとフォルダー。スキャフォールドには`README.md`がリストされています。

<details>
<summary>ハイブリッド: UI文字列とREADME</summary>

`ui-markdown`はこの形式で書き込みます。`ui`はアプリカタログです。`docs`エントリはREADMEです。

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": ".",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

</details>

<details>
<summary>READMEとMarkdownのみ</summary>

`docs-markdown`はUI文字列をオフにし、同じREADMEブロックを保持します。

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "flatPreserveRelativeDir": true,
        "linkRewriteDocsRoot": "."
      }
    }
  ]
}
```

言語リストの設定はハイブリッドの例と同じです。スニペットを短く保つため、ここでは省略されています。`init -t docs-markdown`がそれらを書き込みます。

</details>

<a id="add-the-block-to-a-config-you-already-have"></a>
### 既存の設定にブロックを追加する

ハイブリッドの例から`docs`オブジェクトを追加し、`features.translateDocs`を`true`に設定します。設定にすでに`docs`配列がある場合（例えばVitePressやDocusaurusサイトなど）、READMEオブジェクトを2番目のエントリとして追加します。`sync`はすべてのブロックを実行します。[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app)では、ドキュメントサイト用に1つのブロック、`README.md`用に1つのフラットブロックを使用しています。

<a id="add-the-language-list"></a>
## 言語リストの追加

読者が他の言語を見るべき場所である`README.md`にこの行を配置します。その上の行にある短いラベルは通常の散文であり、翻訳されます。

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

この行は空でも構いません。`translate-docs`は、開始マーカーから終了マーカーまでのすべてを、ロケールごとに1つのリンクに置き換えます。フェンスで囲まれたコードブロック内のマーカーは無視されるため、同じファイル内の設定サンプルは一致しません。詳細: [言語スイッチャー](/ja/guide/documents/language-switcher)。

<a id="translate"></a>
## 翻訳する

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync`は有効なステップを順に実行します。UI文字列がオンの場合、`extract`と`translate-ui`、その後`translate-docs`です。1つのキャッシュが共有されるため、アプリ用にすでに翻訳された文は、READMEに表示されたときに再利用されます。UIカタログは、用語集のヒント（`ui[].uiGlossary`、デフォルトでオン）としてドキュメント翻訳にも渡され、これによりボタン名と機能名の一貫性が保たれます。[用語集](/ja/guide/glossary)を参照してください。

行の言語名は`ui-languages.json`から取得されます。`extract`はUIカタログの隣にそれを書き込みます。READMEのみの設定にはUIカタログがないため、行は代わりにバンドルされた言語リストを使用します。ラベルは依然としてネイティブ名です。独自のプロジェクトマニフェストが必要な場合にのみ`generate-ui-languages`を実行してください。

`translated-docs/`をコミットし、ホスト上で翻訳されたREADMEを開きます。ソースREADMEと`translated-docs/README.de.md`間の相対リンクは、各ファイルに対して書き換えられます。

<a id="hybrid-tips"></a>
## ハイブリッドのヒント

- `docs[].targetLocales`を使用して、アプリよりも少ない言語でREADMEを翻訳します。[ドキュメントのロケール数を減らす](/ja/guide/combining-pipelines#fewer-locales-for-documents)を参照してください。
- 製品用語を`glossary.userGlossary`に入れます。同じCSVがUI文字列とREADMEの両方に使用されます。
- `ai-i18n-tools sync --no-docs`または`ai-i18n-tools sync --no-ui`を使用して片側のみを実行します。

<a id="more-than-the-readme"></a>
## README以外

`contentPaths`にパスを追加します。`flatPreserveRelativeDir`はフォルダーを保持するため、`docs/guide.md`は別の`guide.md`と衝突する代わりに`translated-docs/docs/guide.de.md`になります。

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

`.translate-ignore`ファイルは、翻訳したくないパスをスキップします。`init --with-translate-ignore`はスターターを書き込みます。コードフェンス、URL、見出しアンカーは翻訳されません。[出力レイアウト](/ja/guide/documents/output-layouts)、[アンカーリンク](/ja/guide/documents/anchor-links)、および[リンクの書き換え](/ja/guide/documents/link-rewriting)を参照してください。

言語ごとに異なるスクリーンショット: [画像とスクリーンショット](/ja/guide/images-and-screenshots/)。

<a id="links-on-the-host"></a>
## ホスト上のリンク

リポジトリ内の他のファイルへのリンクは、ロケールファイルに書き換えられます。公開されているドキュメントサイトへのリンクは書き換えられません。このリポジトリは、ドキュメントサイトのURLに`regexAdjustments`を使用してロケールをプレフィックスとして追加します。

```json
"regexAdjustments": [
  {
    "search": "https://wsj-br\\.github\\.io/ai-i18n-tools/",
    "replace": "https://wsj-br.github.io/ai-i18n-tools/${translatedLocale}/"
  }
]
```

フラットリンク書き換えツールが最初に実行され、次にこれらの置換が実行されます。[リンクの書き換え](/ja/guide/documents/link-rewriting)を参照してください。

<a id="keep-it-translated"></a>
## 翻訳を維持する

ソースのREADMEまたはアプリの文字列が変更された後、`sync`を再実行してください。キャッシュは、新規または変更されたテキストのみをモデルに送信します。更新されたファイルを`translated-docs/`の下でコミットしてください。

以下のワークフローはサンプルであり、公開されたアクションではありません。これはCLIをインストールし、`README.md`が変更されたときに`sync`を実行します。プロバイダーキーをリポジトリシークレットとして保存してください。`translated-docs/`の差分を確認してコミットするか、ブランチにプッシュしてプルリクエストを開いてください。

```yaml
name: Translate README
on:
  push:
    paths:
      - "README.md"
      - "ai-i18n-tools.config.json"
  workflow_dispatch:
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm install --save-dev ai-i18n-tools
      - run: npx ai-i18n-tools sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

設定したプロバイダーの環境変数を使用してください。Ollamaは、ホストされたランナーにインストールしない限り適用されません。

<a id="say-that-the-translation-is-automatic"></a>
## 自動翻訳である旨の記載

AI翻訳は誤っている可能性があります。[このリポジトリのREADME](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md)にあるような短い注記をREADMEの最後に記載することで、他の言語が機械翻訳されたものであり、信頼する前に確認する必要があることを読者に伝えます。

<a id="not-your-case"></a>
## 当てはまりませんか？

| あなたが持っているもの | 読むべきもの |
| --- | --- |
| アプリのUI文字列があり、翻訳するREADMEがない場合 | [JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js) または [Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python) |
| VitePress、Docusaurus、Starlight、Nextra、Fumadocs、またはAstroサイト | [ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website)。リポジトリのREADMEも翻訳する必要がある場合は、`--with-readme`を追加してください。|
| ロケールごとに1つのHTMLファイル | [HTMLページ](/ja/guide/documents/html-pages) |
| `translate-docs`の完全なリファレンス | [ドキュメント](/ja/guide/documents/) |

<a id="examples"></a>
## 例

| プロジェクト | 表示内容 |
| --- | --- |
| [console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) | 小規模なNodeアプリとフラットなREADMEブロック |
| [nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) | UI文字列、ドキュメントサイト、および個別のフラットなREADMEブロック |
| このリポジトリ | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): フラットなREADMEブロック、次にVitePressサイト |

<a id="agent-prompt"></a>
## エージェントプロンプト

これをCursorまたは他のコーディングエージェントにコピーしてください。これはリポジトリを準備します。READMEは翻訳しません。

````markdown
# Prepare README and Markdown translation

## Context

ai-i18n-tools translates Markdown listed in `docs[]` and writes one file per locale. The source README stays in place. Flat output for a README looks like `translated-docs/README.de.md`. Guide: https://wsj-br.github.io/ai-i18n-tools/guide/add-i18n-to-readme

## Scope

Edit `ai-i18n-tools.config.json` and the source Markdown files that should grow a language list. Do not edit anything under `translated-docs/` or other generated locale trees.

## Config

- If there is no config, run `ai-i18n-tools init -P <provider>` for a JS/TS app (this template already includes the README block), `ai-i18n-tools init -t docs-markdown -P <provider>` for Markdown only, or `ai-i18n-tools init -t <template> -P <provider> --with-readme` for any other template.
- If a config exists, set `features.translateDocs` to true and append one `docs` entry: `contentPaths` includes `README.md`, `outputDir` is `translated-docs`, `addFrontmatter` is false, `docsOutput.style` is `flat`, `flatPreserveRelativeDir` is true, and `postProcessing.languageListBlock` uses start `<small id="lang-list">`, end `</small>`, separator ` · `.
- Do not add a second block when one already lists `README.md`.
- Add other source files the user named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## README

Add this line where the language row should appear, if it is not already there:

```markdown
<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.

## Do not

- Do not translate, rewrite, or shorten the source README.
- Do not hand-edit `translated-docs/` or locale JSON.
- Do not run a translation yourself.

## Verify

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and exactly one docs block lists `README.md`.

## Report back

List files changed and any Markdown file you left out of `contentPaths`, with a one-line reason.
````
