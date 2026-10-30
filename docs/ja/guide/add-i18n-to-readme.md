<a id="add-i18n-to-your-readme-and-markdown-docs"></a>
# READMEとMarkdownドキュメントにi18nを追加する

このページでは、GitHub、GitLab、Bitbucket、または読者が`README.md`から始めるその他のホスト上のリポジトリを対象とし、言語ごとに1つのファイルを追加します。設定するドキュメントサイトフレームワークはありません。通常のプロジェクトにはアプリまたはCLIもあり、READMEはそのアプリと同じ言語と製品用語を使用する必要があります。UI文字列のないライブラリまたはドキュメントのみのリポジトリは、以下で説明するもう1つのケースです。

<a id="what-you-get"></a>

ツールは`README.md`をそのまま残します。ホストはそれをリポジトリのフロントページとしてレンダリングし続けます。各ターゲットロケールは、`translated-docs/README.de.md`のような兄弟ファイルです。README内の言語行はこれらのファイルをリンクし、同じ行がすべての翻訳に書き込まれ、読者が見ているファイルから機能するリンクが含まれます。`translate-docs`がその行を埋めます。それは開始マーカーから終了マーカーまでのすべてを、ロケールごとに1つのリンクで置き換えます。これらのファイルも翻訳する必要がある場合は、`CONTRIBUTING.md`、`CHANGELOG.md`、または`docs/`フォルダーを同じブロックに追加します。詳細については、[README以上のもの](#step-3-more-than-the-readme)を参照してください。

最も手っ取り早い方法は、このページのプロンプトをコーディングエージェントに与えることです。それは設定を確認し、言語リストマーカーを追加します。CLIをインストールし、プロバイダーを選択し、プロジェクトを自分で初期化します。これは、APIキーと選択が必要なためです。また、翻訳はあなたのアカウントでお金がかかるため、自分で実行します。

VitePress、Docusaurus、Starlight、Nextra、Fumadocs、またはAstroサイトは、[ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website)を使用します。リポジトリのREADMEも翻訳する必要がある場合は、`--with-readme`を追加します。どちらが適用されるかわからない場合は、最後に[あなたのケースではない場合？](#not-your-case)を参照してください。

流れ:

1. [CLIをインストールしてプロバイダーを選択する](#install-and-choose-a-provider)。
2. `init`で[プロジェクトを初期化する](#initialise-the-project)。
3. [エージェントプロンプトを実行する](#run-the-agent-prompt)。
4. [結果を確認する](#review-the-result)。
5. [モデルを選択して翻訳する](#choose-models-and-translate)後、1つの言語を確認します。
6. [翻訳を維持する](#keep-it-translated)。

変更をご自身で行いたい場合、またはプロンプトが何をするのか知りたいですか？[手動で行う](#do-it-by-hand)では、同じ手順を一つずつ説明します。

<a id="install-and-choose-a-provider"></a>
## プロバイダーのインストールと選択

この部分はエージェントではなく、ご自身で行います。インストーラーはマシンを変更し、APIキーはプロンプトではなくシェルに属する秘密情報です。

`package.json`を持つリポジトリは、パッケージを開発依存関係としてインストールします。その他のインストールオプション：[インストール](/ja/guide/installation)。

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools`と`yarn add --dev ai-i18n-tools`も機能します。

Node.jsプロジェクトのないリポジトリは、スタンドアロン実行可能ファイルを使用できます。LinuxおよびmacOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

インストーラーは`SHA256SUMS.txt`を確認し、コマンドを`ai-i18n-tools`としてインストールし、`PATH`に追加します。バイナリは公証されておらず、Authenticode署名もされていません。手動の手順とアセット名：[スタンドアロン実行可能ファイル](/ja/guide/installation#standalone-executables)。Node.jsがインストールされており、プロジェクトの依存関係を望まない場合は、`npx ai-i18n-tools`も機能します。

インストールを確認します:

```bash
ai-i18n-tools --version
```

次に、プロバイダーを選択し、翻訳を実行するシェルでそのAPIキーを設定します。例: OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollamaはキーを必要としません。その他のプリセット: [組み込みプロバイダー](/ja/guide/providers-and-models#built-in-providers)。プロバイダー名をメモしておいてください。次のステップで`init`に渡すためです。エージェントはキーを必要としません。モデル呼び出しを行わないコマンドのみを実行するためです。キーは後で[翻訳する](#choose-models-and-translate)ときに使用します。

<a id="initialise-the-project"></a>
## プロジェクトの初期化

プロンプトの前に、これを一度実行します。それは設定を書き込み、上記で選択したプロバイダーを使用します。`README.md`は編集しません。設定にREADMEブロックが含まれている場合、貼り付けるマーカー行を出力し、`README.md`が見つからない場合は警告します。

| あなたの状況 | スキャフォールド | その後 |
| --- | --- | --- |
| JS/TSアプリとREADME | `ai-i18n-tools init -P openrouter`（`ui-markdown`、デフォルト） | `t()`には[JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js)、READMEにはこのページ |
| PythonアプリとREADME | `ai-i18n-tools init -t ui-python -P openrouter --with-readme` | アプリには[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)、READMEにはこのページ |
| その他のテンプレートとREADME | その`init`コマンドに`--with-readme`を追加 | READMEブロックにはこのページ |
| READMEとMarkdownのみ | `ai-i18n-tools init -t docs-markdown -P openrouter` | このページ |

`--with-readme` は `ui-markdown` および `docs-markdown` には効果がありません。それらのテンプレートにはすでに README ブロックが含まれているためです。

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

次に、`ai-i18n-tools.config.json`で`sourceLocale`と`targetLocales`を編集します。`sourceLocale`はREADMEが書かれている言語です。任意のBCP-47言語が有効です。`features.translateDocs`はtrueである必要があります。ハイブリッド設定では`features.translateUIStrings`も設定されます。`docs[].contentPaths`は翻訳するMarkdownファイルとフォルダーをリストします。スキャフォールドは`README.md`をリストします。

`init`を一度実行します。それは毎回`ai-i18n-tools.config.json`を書き換えるため、2回目の実行では行った編集が失われます。`init`をスキップすると、既存の設定はそのまま残されます。プロンプトはREADMEブロックを追加し、[ステップ1](#step-1-configure-the-docs-block)では同じ手動編集が示されます。

<a id="run-the-agent-prompt"></a>
## エージェントプロンプトを実行する

コーディングエージェント（Cursor、Claude Code、Copilotなど）でプロジェクトを開き、新しいチャットを開始し、以下のプロンプトを貼り付けます。プロジェクトはすでに初期化されている必要があります。編集するものはありません。他のMarkdownファイルを翻訳する必要がある場合は、同じメッセージでそれらの名前を指定します。

エージェントはまずCLIと設定が存在するかどうかを確認し、どちらかが欠けている場合は指示を出して停止します。その後、2つの部分で動作します。

- パート1は、設定にすでに`README.md`がリストされていない場合に、フラットなREADMEブロックを追加します。
- パート2は、ソースREADMEに言語リストマーカーを追加します。

それはCLIをインストールしたり、設定を初期化したり、APIキーを読み取ったり、言語リンクを埋めたり、翻訳したりしません。翻訳はレビュー後のステップであり、あなたが実行します。

````markdown
# Prepare README and Markdown translation

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user which command to run, then run this prompt again:

- JS/TS app plus a README: `ai-i18n-tools init -P <provider>`
- README and Markdown only: `ai-i18n-tools init -t docs-markdown -P <provider>`
- Any other template: `ai-i18n-tools init -t <template> -P <provider> --with-readme`

Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, rewrite, or shorten the source README or any other source
  Markdown. Do not edit anything under `translated-docs/` or other generated
  locale trees. Do not hand-edit locale JSON.
- Do not reformat unrelated files. Leave unrelated edits in a dirty tree alone.

## Part 1 — Config

Skip this part when one `docs` entry already lists `README.md`. Do not add a
second block for the same file.

Otherwise set `features.translateDocs` to true and append one `docs` entry:

- `contentPaths` includes `README.md`
- `outputDir` is `translated-docs`
- `addFrontmatter` is false
- `docsOutput.style` is `flat`
- `docsOutput.flatPreserveRelativeDir` is true
- `docsOutput.linkRewriteDocsRoot` is `.`
- `docsOutput.postProcessing.languageListBlock` uses start
  `<small id="lang-list">`, end `</small>`, separator ` · `

```json
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
```

Leave `features.translateUIStrings` as it is. Add other source files the user
named (`CONTRIBUTING.md`, `docs/`) to that block's `contentPaths`.

## Part 2 — Language list

In `README.md`, where readers should see the other languages, add this marker
if it is not already there. A short label on the line above it is normal
prose. Add that label only when the spot has no heading of its own.

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

Do not fill in the links yourself. `translate-docs` replaces the marker range.
Markers inside fenced code blocks are ignored, so a config sample in the same
file does not match. Do not put the real marker inside a fence.

## Verify and report

`ai-i18n-tools.config.json` parses, `features.translateDocs` is true, and
exactly one docs block lists `README.md`. The marker is in the source README
and not inside a fence. Nothing under `translated-docs/` changed.

Report the files changed and any Markdown file you left out of `contentPaths`,
with a one-line reason. Then list the commands for the user, and do not run
them: `ai-i18n-tools suggest-models` (optional), `ai-i18n-tools sync`.
````

<a id="review-the-result"></a>
## 結果をレビューする

エージェントはレポートで終了します。翻訳する前に確認してください。

- 差分。それは設定とマーカーであるべきです。ソースの散文は以前と同じように読めるはずです。`git diff --stat`は変更量を示します。
- `translated-docs/`または別の生成されたロケールツリーの下にあるものは何も編集されていません。
- `ai-i18n-tools.config.json`は解析され、`features.translateDocs`はtrueであり、正確に1つのドキュメントブロックが`README.md`をリストします。
- マーカーは`README.md`内にあり、フェンスで囲まれたコードブロック内ではありません。フェンス内のマーカーのサンプルは問題ありません。実際のものは外側にあります。

<a id="choose-models-and-translate"></a>
## モデルを選択して翻訳する

この部分はユーザーが実行します。これはユーザーのAPIキーを使用し、アカウントに費用が発生します。

`init` からのモデルリストは出発点です。アクティブなプロバイダーのチャットモデルをランク付けし、ショートリストが適切に見えたら、それを `translationModels` に書き込んでください：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`は`translationModels`のみを置き換えます。同じランキングが`ai-i18n-tools dashboard`の[モデル](/ja/guide/translation-dashboard/models)タブにあります。

次に翻訳します：

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync`は有効なステップを順に実行します。UI文字列がオンの場合、`extract`と`translate-ui`、その後`translate-docs`です。1つのキャッシュが共有されるため、アプリ用にすでに翻訳された文は、READMEに表示されたときに再利用されます。UIカタログは、用語集のヒント（`ui[].uiGlossary`、デフォルトでオン）としてドキュメント翻訳にも渡され、これによりボタン名と機能名の一貫性が保たれます。[用語集](/ja/guide/glossary)を参照してください。

行の言語名は`ui-languages.json`から取得されます。`extract`はUIカタログの隣にそれを書き込みます。READMEのみの設定にはUIカタログがないため、行は代わりにバンドルされた言語リストを使用します。ラベルは依然としてネイティブ名です。独自のプロジェクトマニフェストが必要な場合にのみ`generate-ui-languages`を実行してください。

`translated-docs/`をコミットし、ホスト上で翻訳されたREADMEを開きます。ソースREADMEと`translated-docs/README.de.md`間の相対リンクは、各ファイルに対して書き換えられます。

<a id="check-one-language"></a>
### 1つの言語を確認する

`translated-docs/README.de.md` をホスト上およびファイル自体で開きます（または、選択したターゲットコードを使用します）。言語の行には、すべてのロケールが一覧表示され、現在見ているファイルから機能するリンクが含まれている必要があります。ソース言語のままの文は、コードフェンス、URL、見出しアンカー内にあったか、`contentPaths` にありませんでした。

<a id="keep-it-translated"></a>
## 翻訳を維持する

ソースの README またはアプリの文字列が変更されたら、`ai-i18n-tools sync` を再実行します。キャッシュは、新規または変更されたテキストのみをモデルに送信します。更新されたファイルを `translated-docs/` でコミットします。`ai-i18n-tools dashboard` は、翻訳を確認するために [翻訳ダッシュボード](/ja/guide/translation-dashboard/) を開きます。

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

<a id="hybrid-tips"></a>
### ハイブリッドのヒント

- `docs[].targetLocales`を使用して、アプリよりも少ない言語でREADMEを翻訳します。[ドキュメントのロケール数を減らす](/ja/guide/combining-pipelines#fewer-locales-for-documents)を参照してください。
- 製品用語を`glossary.userGlossary`に入れます。同じCSVがUI文字列とREADMEの両方に使用されます。
- `ai-i18n-tools sync --no-docs`または`ai-i18n-tools sync --no-ui`を使用して片側のみを実行します。

<a id="say-that-the-translation-is-automatic"></a>
### 翻訳が自動であることを示す

AI翻訳は誤っている可能性があります。[このリポジトリのREADME](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md)にあるような短い注記をREADMEの最後に記載することで、他の言語が機械翻訳されたものであり、信頼する前に確認する必要があることを読者に伝えます。

<a id="do-it-by-hand"></a>
## 手動で実行する

自分で変更を加えることを希望する場合、またはプロンプトが何をするのかを知りたい場合は、これらの手順を実行してください。最初の2つはプロンプトの各部分に対応しています。最後の2つは、追加ファイルと公開サイトを指すリンク用です。最後に、[CLI をインストール](#install-and-choose-a-provider)し、[プロジェクトを初期化](#initialise-the-project)し、[翻訳](#choose-models-and-translate)します。

1. [ドキュメントブロックを構成する](#step-1-configure-the-docs-block)。
2. [言語リストを追加する](#step-2-add-the-language-list)。
3. [README 以上のもの](#step-3-more-than-the-readme)。
4. [ホスト上のリンク](#step-4-links-on-the-host)。

<a id="step-1-configure-the-docs-block"></a>
## ステップ 1: ドキュメントブロックを構成する

重要なキーは4つです:

- `sourceLocale`: そのREADMEが書かれている言語。どの言語でも有効です。このガイドでは英語が一般的な例です。
- `targetLocales`: 追加する言語。
- `features.translateDocs`: trueである必要があります。ハイブリッド設定では`features.translateUIStrings`も設定されます。
- `docs[].contentPaths`: 翻訳するMarkdownファイルとフォルダー。スキャフォールドには`README.md`がリストされています。

`init` がすでに README ブロックを記述している場合は、このステップをスキップしてください。既存の構成を編集している場合に使用します。

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

すでに `README.md` がリストされている場合は、2つ目のブロックを追加しないでください。

<a id="step-2-add-the-language-list"></a>
## ステップ 2: 言語リストを追加する

読者が他の言語を見るべき場所である`README.md`にこの行を配置します。その上の行にある短いラベルは通常の散文であり、翻訳されます。

```markdown
**Read in other languages:**

<small id="lang-list"></small>
```

この行は空でも構いません。`translate-docs`は、開始マーカーから終了マーカーまでのすべてを、ロケールごとに1つのリンクに置き換えます。フェンスで囲まれたコードブロック内のマーカーは無視されるため、同じファイル内の設定サンプルは一致しません。詳細: [言語スイッチャー](/ja/guide/documents/language-switcher)。

<a id="step-3-more-than-the-readme"></a>
## ステップ 3: README 以上のもの

`contentPaths`にパスを追加します。`flatPreserveRelativeDir`はフォルダーを保持するため、`docs/guide.md`は別の`guide.md`と衝突する代わりに`translated-docs/docs/guide.de.md`になります。

```json
"contentPaths": ["README.md", "CONTRIBUTING.md", "docs/"]
```

`.translate-ignore`ファイルは、翻訳したくないパスをスキップします。`init --with-translate-ignore`はスターターを書き込みます。コードフェンス、URL、見出しアンカーは翻訳されません。[出力レイアウト](/ja/guide/documents/output-layouts)、[アンカーリンク](/ja/guide/documents/anchor-links)、および[リンクの書き換え](/ja/guide/documents/link-rewriting)を参照してください。

言語ごとに異なるスクリーンショット: [画像とスクリーンショット](/ja/guide/images-and-screenshots/)。

<a id="step-4-links-on-the-host"></a>
## ステップ 4: ホスト上のリンク

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

これが最後の手動ステップです。[モデルを選択して翻訳する](#choose-models-and-translate)に進んでください。

<a id="not-your-case"></a>
## 当てはまりませんか？

| あなたが持っているもの | 読むべきもの |
| --- | --- |
| アプリのUI文字列があり、翻訳するREADMEがない場合 | [JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js) または [Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python) |
| Django、Flask-Babelカタログ、または既にGNU gettextを使用しているアプリ | [Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext) |
| VitePress、Docusaurus、Starlight、Nextra、Fumadocs、またはAstroサイト | [ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website)。リポジトリのREADMEも翻訳する必要がある場合は、`--with-readme`を追加してください。|
| ロケールごとに1つのHTMLファイル | [HTMLページ](/ja/guide/documents/html-pages) |
| `translate-docs`の完全なリファレンス | [ドキュメント](/ja/guide/documents/) |

<a id="examples"></a>
## 例

| プロジェクト | 表示内容 |
| --- | --- |
| [console-app](/ja/examples#console-app) | 小規模な Node アプリとフラットな README ブロック |
| [nextjs-app](/ja/examples#nextjs-app) | UI 文字列、ドキュメントサイト、および個別のフラットな README ブロック |
| このリポジトリ | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json): フラットなREADMEブロック、次にVitePressサイト |
