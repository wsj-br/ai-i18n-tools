<a id="installation"></a>
# インストール

公開されたパッケージは**ESM専用**です。Node.jsまたはバンドラーでは`import`/`import()`を使用してください。`require('ai-i18n-tools')`は使用しないでください。このパッケージは`engines.node` `>=22.16.0`を宣言しています。古いNode.jsバージョンはサポートされていません。npmのtarballには`docs/`配下の英語ファイルのみが含まれています。`translated-docs/`配下の言語ごとのコピーは[GitHubリポジトリ](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)にあります。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

<a id="standalone-executables"></a>
### スタンドアロン実行ファイル

GitHub Releasesには、Node.jsの単一実行可能ビルドが添付されています。Pythonプロジェクトは、Node.jsをインストールすることなく、そのバイナリから`extract`、`translate-ui`、`suggest-models`を含むCLIを実行します。

| プラットフォーム | アセット |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

各リリースには`SHA256SUMS.txt`と`ai-i18n-tools-python-examples.zip`（4つのPythonサンプル）も添付されています。npm tarballと実行可能ファイルにはこれらのサンプルは含まれていません。これらはリポジトリ内にも保持されます。

1. [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases)ページから、使用しているマシンに一致するアセットをダウンロードします。
2. `SHA256SUMS.txt`を使用してチェックサムを確認します。
3. LinuxおよびmacOSでは、ファイルに対して`chmod +x`を実行し、`PATH`に移動します（またはパスを指定して呼び出します）。
4. Windowsでは、`ai-i18n-tools-win-x64.exe`を`PATH`に配置します。`ai-i18n-tools.exe`に名前を変更すると、他のプラットフォームと同じコマンド名で利用できます。

これらのバイナリには公証やAuthenticode署名は付与されていません。macOSでは署名されていないプログラムの承認を求められる場合があります。Windows SmartScreenで警告が表示されることがあります。

アクティブなプロバイダーのAPIキーは、npmインストール時と同じ方法（環境変数、または作業ディレクトリ内の`.env`ファイル）で設定します。`init`によるモデルリストは開始点となります。`suggest-models`はランク付けされたショートリストを出力します。`suggest-models --apply`はそれを`translationModels`に書き込みます。同じランキングが[Models](/ja/guide/translation-dashboard/models)タブにも表示されています。

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

チュートリアル: [Pythonアプリへのi18nの追加](/ja/guide/add-i18n-to-python)。コマンドリファレンス: [suggest-models](/ja/reference/cli-commands/models#suggest-models)。

ai-i18n-toolsには独自の文字列抽出機能が含まれています。以前に`i18next-scanner`、`babel-plugin-i18next-extract`などを使用していた場合は、移行後にそれらの開発依存関係を削除できます。既存のi18nextの**ネームスペースJSON**ファイルは、[JSONパイプライン](/ja/guide/json#i18next-namespace-files)にそのまま残すことができます。Intlayerの`.content.ts`辞書は`migrate-intlayer`でインポートできます — [Intlayerからの移行](/ja/guide/migrating-from-intlayer)を参照してください。

<a id="using-the-cli"></a>
### CLI の使用方法

プロジェクトに`ai-i18n-tools`を依存関係または開発依存関係としてインストールします（上記の[インストール](#installation)を参照）。このパッケージは、パッケージマネージャーが`node_modules/.bin/ai-i18n-tools`にリンクする`bin`エントリを宣言します。そのシム（インストールされたパッケージ内の`bin/ai-i18n-tools.mjs`）は、コンパイルされたCLIをロードします。

インタラクティブシェルで `ai-i18n-tools` コマンド単体を入力するには、以下のいずれかのオプションを設定してください。設定を行わない場合、ローカルインストール後であってもシェルはバイナリを見つけることができません。

**direnv** — プロジェクトルートの `.envrc` に追加します (bash/zsh、[direnv.net](https://direnv.net/) を参照):

```bash
PATH_add node_modules/.bin
```

`direnv allow` の後、プロジェクトに `cd` すれば、いつでもコマンド単体が利用可能になります。

**手動PATH** — これらは**プロジェクトルート**（`node_modules/.bin`を含むディレクトリ）から実行してください。その`PATH`エントリをそのまま残しておけば、サブディレクトリでも引き続き機能します。ネストされたフォルダからエクスポートを再実行すると、`$PWD`がプロジェクトルートを指さなくなるため失敗します。

```bash
# bash/zsh — from the project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — from the project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**グローバルインストール** — CLIを一度インストールし、任意のディレクトリから呼び出します:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

pnpmの場合、グローバルコマンドが見つからない場合はマシンごとに1回`pnpm setup`を実行し（新しいシェルを開いてください）— pnpmはそのグローバルbinディレクトリを`PATH`に配置する必要があります。グローバルインストールでは、グローバルに固定されたバージョンが使用されます。プロジェクトごとのバージョン固定には、direnvまたは手動PATHを推奨します。これにより、`node_modules/.bin`がプロジェクトの依存関係に解決されるようになります。

**`package.json` スクリプト** — npmまたはpnpmがスクリプトを実行する際、`node_modules/.bin`を`PATH`の先頭に追加するため、シェルのPATHを変更しなくてもスクリプト内でコマンド名をそのまま使用できます。translateステップを手動でつなぎ合わせるよりも`sync`を優先してください — 手動で実行すると、順序や機能フラグを間違えやすくなります:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

次に、例えば `pnpm run i18n:sync` を実行します。推奨される完全なセットについては、[推奨される `package.json` スクリプト](/ja/guide/quick-start#recommended-packagejson-scripts) を参照してください。

**代替手段** — `PATH` を調整したくない場合: `npx ai-i18n-tools …` (npm) または `pnpm exec ai-i18n-tools …` (pnpm)。`package.json` エントリを持たないインストール不要の一回限りの実行には: `npx ai-i18n-tools <cmd>` または `pnpm dlx ai-i18n-tools <cmd>`。

<a id="cloned-ai-i18n-tools-monorepo"></a>
### クローンされたai-i18n-toolsモノレポ

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) の完全なクローンからパッケージを開発する、またはワークスペースの**例**を実行する場合:

- **ワークスペースの例** (`examples/console-app`, `examples/nextjs-app`, および [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) にリストされている他のパッケージ) — リポジトリルートで `pnpm install` を実行し、その後 `cd examples/<name>` を実行します。例の `pnpm run i18n:*` スクリプトを使用するか、PATH を設定し ([CLIの使用](#using-the-cli) を参照)、素の `ai-i18n-tools …` を実行します。ワークスペース [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) は `ai-i18n-tools` をローカルのチェックアウトにリンクします。
- **リポジトリルート** — pnpm はルートパッケージ自身の `bin` を `node_modules/.bin` にリンクしません。このチェックアウトの `.envrc` は `bin/` を `PATH` に追加するため、コミットされた `bin/ai-i18n-tools` ラッパー (公開された `bin/ai-i18n-tools.mjs` シムの隣) は `direnv allow` の後に素のコマンドを提供します。direnv を使用しない場合は、`node bin/ai-i18n-tools.mjs …`、`./bin/ai-i18n-tools …`、またはルートの `pnpm i18n:*` スクリプト (またはシェルエイリアス / `pnpm add -g .` — [開発ガイド](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) を参照) を使用します。
- **スタンドアロンのフィクスチャ** (`multi-provider`, `test-markdown`) — フィクスチャフォルダから、`node ../../bin/ai-i18n-tools.mjs …` を使用します。

CLI ソースを変更した後、リポジトリルートで `pnpm run build` を実行します。ビルド手順やオプションのグローバルインストールの回避策については、[開発ガイド](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) を参照してください。

Linux、macOS、およびWSLでは、レジストリからのインストールによりCLIスクリプトの実行ビットが自動的に設定されます。Windowsでは、パッケージマネージャーがNodeを明示的に呼び出す`.cmd`および`.ps1`のシャムを生成します。

翻訳コマンド（`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`）は、`ai-i18n-tools.config.json`内の**プロバイダ設定**と、アクティブプロバイダ用の**APIキー**を必要とします。`ai-i18n-tools init -P <provider>`を実行してそのプリセットをスキャフォールドし、`provider` / `providers`を編集してモデルを追加します。[LLMプロバイダとモデル](/ja/guide/providers-and-models)を参照してください。`init`からのモデルリストが出発点です。`ai-i18n-tools suggest-models`はアクティブプロバイダのチャットモデルをランク付けし、`suggest-models --apply`は`translationModels`を置き換えます。同じランキングが[モデル](/ja/guide/translation-dashboard/models)タブにあります。コマンドリファレンス: [suggest-models](/ja/reference/cli-commands/models#suggest-models)。OllamaはAPIキーを必要としない唯一の組み込みプリセットです。

`init` に渡すプロバイダーに一致するAPIキーを設定します ([プリセットテーブル](/ja/guide/providers-and-models#built-in-providers) を参照):

```bash
# init -P openrouter
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# init -P openai
# export OPENAI_API_KEY=sk-your-key-here
```

またはプロジェクトルートに`.env`ファイルを作成してください。

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### ツールUIの言語

CLIは、翻訳対象のロケールとは独立して、独自のヘルプテキスト、ログの要約、翻訳ダッシュボードをローカライズします。デフォルトではOSのロケールに従います。設定内の`-L pt-BR`、`export AI_I18N_LANG=es`、または`"uiLanguage"`で上書きします。[ツールUI言語](/ja/guide/tool-ui-language)を参照してください。
