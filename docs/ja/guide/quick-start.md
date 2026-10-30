<a id="quick-start"></a>
# クイックスタート

このページでは、単一言語プロジェクトが最初の翻訳ファイルを作成するまでの手順を案内します。対象となるのは、JS/TSアプリ、Pythonアプリ、ウェブサイトまたはドキュメントサイト、リポジトリのREADME、およびその他のMarkdownファイルです。以下を前提とします:

- Node.js `>=22.16.0`、またはPythonプロジェクトの場合は[スタンドアロン実行可能ファイル](/ja/guide/installation#standalone-executables)。
- LLMプロバイダーのAPIキー、またはローカルのOllamaインストール。
- プロジェクトがバージョン管理されていること。これにより、ツールが書き込んだ内容を確認できます。

プロジェクトによって異なる点が2つあります。ツールがテキストをどのように見つけるか、そしてアプリがその結果をどのように読み込むかです。以下の[パスを選択](#pick-your-path)から、それぞれに適したガイドに進んでください。

<a id="runnable-examples"></a>
## 実行可能な例

まずは完成したプロジェクトを見てみたいですか？リポジトリをクローンせずにコピーできます。

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync
```

`console-app`を他のNode.jsの例に置き換えることができます。Pythonの例には`package.json`がありません。同じ方法でコピーするか、GitHubリリースから`ai-i18n-tools-python-examples.zip`をダウンロードしてください。それぞれの例が何を示しているかを含む完全なリストは、[サンプル](/ja/examples)ページにあります。

<a id="install"></a>
## インストール

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools`や`yarn add --dev ai-i18n-tools`も使用できます。Pythonプロジェクトではスタンドアロン実行可能ファイルをインストールするため、Node.jsは不要です。LinuxおよびmacOS: `curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`。Windows PowerShell: `irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`。その他のインストールオプション: [インストール](/ja/guide/installation)。

<a id="provider-and-api-key"></a>
## プロバイダーとAPIキー

LLMを呼び出す全てのコマンド（`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`）には、以下の両方が必要です。

1. `ai-i18n-tools.config.json` に少なくとも 1 つのプロバイダー: `translationModels` を持つ `providers.<name>` ブロック、および複数のプロバイダーが設定されている場合はトップレベルの `provider` キー。`init -P <provider>` はそのプリセットをスキャフォールドします。プロバイダーを追加するには、[LLM プロバイダー](/ja/guide/providers-and-models) を参照してください。モデルリストを選択するには、[AI モデル](/ja/guide/ai-models) を参照してください。
2. 環境またはプロジェクトルートの `.env` ファイル内の一致する API キー。各組み込みプリセットは、[プリセットテーブル](/ja/guide/providers-and-models#built-in-providers) から名前付き変数を読み取ります。たとえば、`OPENROUTER_API_KEY` と `-P openrouter`、または `OPENAI_API_KEY` と `-P openai` です。Ollama はローカルエンドポイントを使用し、キーは必要ありません。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

LLMを呼び出さない`extract`、`status`、およびその他のコマンドでは、どちらも不要です。環境ファイルとPATHに関する詳細は、[インストール](/ja/guide/installation#using-the-cli)を参照してください。

<a id="pick-your-path"></a>
## パスを選択

ご自身のプロジェクトに合うものを見つけ、そのブロック内のコマンドを実行し、リンク先のガイドに進んでください。

<a id="a-jsts-app"></a>
### JS/TSアプリ

この時点では、ボタンやメッセージはソース内でまだプレーンテキストであるため、ツールは何も見つけられません。まずそれらを`t()`でラップする必要があり、アプリには小さなi18next設定ファイルが必要です。

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models --apply
```

次に、[JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js)に進みます。このガイドでは、`extract`と`translate-ui`の前に、エージェントプロンプトを使用したラップ手順を説明します。

<a id="a-python-app"></a>
### Pythonアプリ

```bash
ai-i18n-tools init -t ui-python -P openrouter
ai-i18n-tools suggest-models --apply
```

その後、[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)に従ってください。

Djangoアプリ、Flask-Babelカタログを使用するFlask、またはすでに`gettext`を呼び出しているアプリは、それらの呼び出しを保持します。代わりに、`ui-python-django`、`ui-python-flask`、または`ui-python-gettext`でスキャフォールドし、その後、[Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext)に従ってください。

<a id="a-website-or-documentation-site"></a>
### ウェブサイトまたはドキュメントサイト

お使いのフレームワーク用のテンプレートを選択してください。

| サイト | テンプレート |
| --- | --- |
| Astro Starlight | `ui-starlight` |
| Docusaurus | `ui-docusaurus` |
| VitePress | `ui-vitepress` |
| Nextra | `ui-nextra` |
| Fumadocs | `ui-fumadocs` |
| プレーンなAstroウェブサイト | `ui-astro-website` |
| プレーンなHTMLページ | `ui-plain-html` または `docs-plain-html` |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

その後、[ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website)に従ってください。そのエージェントプロンプトは、フレームワークのi18nルーティングを有効にします。その作業を確認した後、`sync`を実行します。

<a id="a-readme-or-markdown-docs"></a>
### READMEまたはMarkdownドキュメント

ほとんどのリポジトリでは、これをアプリと一緒に含めることが望まれます。デフォルトの`ui-markdown`テンプレートには、すでにフラットなREADMEブロックが含まれています。その他のテンプレートの場合は、`--with-readme`を追加します。Markdownのみのリポジトリでは`docs-markdown`を使用します。

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
ai-i18n-tools init -t docs-markdown -P openrouter
```

その後、[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)に従ってください。言語リストマーカーを`sync`の前に`README.md`に貼り付けます。アプリのパスがある場合は、引き続き[JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js)または[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)に従います。

<a id="something-else"></a>
### その他

- そのまま維持されるネストされたi18next JSON: `ai-i18n-tools init -t ui-json-bundles -P openrouter`を実行し、その後[JSON](/ja/guide/json)に従います。
- テキストラベル付きのSVGダイアグラム: [SVG翻訳](/ja/guide/svg-translation/)。
- Intlayerからの移行: [Intlayerからの移行](/ja/guide/migrating-from-intlayer)。
- Intlayerを維持し、その翻訳のみを埋める場合: [Intlayerのインプレース翻訳](/ja/guide/translating-intlayer)。

すべての`init`オプションを含むテンプレートの完全なリストは、[CLIセットアップリファレンス](/ja/reference/cli-commands/setup)にあります。

<a id="run-and-check"></a>
## 実行と確認

プロジェクトの準備ができたら:

```bash
ai-i18n-tools doctor
ai-i18n-tools sync
ai-i18n-tools status
```

`doctor`は、設定、パス、プロバイダー、および環境が準備できていることを確認します。`--local`を渡さない限り、プロバイダーでモデルIDも検証します。`sync`は、設定で有効になっているすべてのステップを順番に実行します。`status`は、ロケールごとに何が翻訳されているかを表示します。ツールがテキストを認識できないプロジェクトで初回実行すると、エラーなしで終了し、何も有用なものを書き込みません。したがって、`status`が文字列を表示しない場合は、パスのガイドに戻ってください。

`suggest-models` は、公開されているベンチマークからアクティブなプロバイダーのチャットモデルをランク付けします。`suggest-models --apply` は `translationModels` を置き換え、`uiModels` と `localeModels` はそのままにします。同じランキングがダッシュボードの **モデル** タブにあります。ランキングの仕組み、およびリストに複数のモデルが含まれる理由については、[AI モデル](/ja/guide/ai-models) を参照してください。コマンドリファレンス: [suggest-models](/ja/reference/cli-commands/models#suggest-models).

<a id="keep-it-translated"></a>
## 翻訳を維持する

ソーステキストが変更されるたびに`sync`を再実行してください。SQLiteキャッシュにより、新規または変更されたテキストのみがモデルに送信されるため、再実行は低コストです。CIで`sync`を実行すると、翻訳のずれを防ぐことができます。`ai-i18n-tools dashboard`で[翻訳ダッシュボード](/ja/guide/translation-dashboard/)を開き、キャッシュされた翻訳を確認・編集できます。

<a id="recommended-packagejson-scripts"></a>
### 推奨されるpackage.jsonスクリプト

パッケージをローカルにインストールすると、追加のシェル設定なしで、スクリプトは `node_modules/.bin` から `ai-i18n-tools` を解決します。対話型シェルの場合は、最初にPATHを設定してください。[CLIの使用](/ja/guide/installation#using-the-cli) を参照してください。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

個々の翻訳スクリプトを連結するよりも `sync` を使用してください。1つのステップを単独で実行する必要がある場合にのみ、シングルステップのスクリプトを使用してください。

CLI出力とダッシュボードを別の言語で表示するには、`-L <code>`を渡すか、`AI_I18N_LANG`を設定します。[ツールのUI言語](/ja/guide/tool-ui-language)を参照してください。

<a id="combined-sync"></a>

アプリの文字列とドキュメントサイトなど、複数の種類のコンテンツを一緒に翻訳しますか？[パイプラインの結合](/ja/guide/combining-pipelines) を参照してください。

次へ：[パスの選択](#pick-your-path) にある、ご自身のパスに対応するガイド。
