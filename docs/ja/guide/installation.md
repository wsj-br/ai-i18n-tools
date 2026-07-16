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

ai-i18n-toolsには独自の文字列抽出機能が含まれています。以前に`i18next-scanner`、`babel-plugin-i18next-extract`、または類似ツールを使用していた場合、移行後にそれらの開発依存関係を削除できます。

<a id="using-the-cli"></a>
### CLI の使用方法

プロジェクトに`ai-i18n-tools`を依存関係または開発依存関係としてインストールします（上記の[インストール](#installation)を参照）。このパッケージは、パッケージマネージャーが`node_modules/.bin/ai-i18n-tools`にリンクする`bin`エントリを宣言します。そのシム（インストールされたパッケージ内の`bin/ai-i18n-tools.mjs`）は、コンパイルされたCLIをロードします。

インタラクティブシェルで `ai-i18n-tools` コマンド単体を入力するには、以下のいずれかのオプションを設定してください。設定を行わない場合、ローカルインストール後であってもシェルはバイナリを見つけることができません。

**direnv** — プロジェクトルートの `.envrc` に追加します (bash/zsh、[direnv.net](https://direnv.net/) を参照):

```bash
PATH_add node_modules/.bin
```

`direnv allow` の後、プロジェクトに `cd` すれば、いつでもコマンド単体が利用可能になります。

**手動PATH** — インタラクティブシェルでプロジェクトルートから:

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**グローバルインストール** — CLIを一度インストールし、任意のディレクトリから呼び出します:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

グローバルインストールはグローバルに固定されたバージョンを使用します。プロジェクトごとのバージョン固定には、direnv または手動PATHを使用し、`node_modules/.bin` がプロジェクトの依存関係に解決されるようにすることをお勧めします。

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
### クローンした ai-i18n-tools モノレポ

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) の完全なクローンからパッケージを開発する、またはワークスペースの**例**を実行する場合:

- **ワークスペースの例** (`examples/console-app`, `examples/nextjs-app`, および [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) にリストされているその他のパッケージ) — リポジトリルートで `pnpm install` を実行し、その後 `cd examples/<name>` を実行します。例の `pnpm run i18n:*` スクリプトを使用するか、PATH を設定して ([CLI の使用](#using-the-cli) を参照) 単独の `ai-i18n-tools …` を実行します。ワークスペース [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) は `ai-i18n-tools` をローカルのチェックアウトにリンクします。
- **リポジトリルート** — pnpm はルートパッケージ自身の `bin` を `node_modules/.bin` にリンクしません。代わりに `node bin/ai-i18n-tools.mjs …` またはルートの `pnpm i18n:*` スクリプトを使用してください (またはシェルエイリアス / `pnpm add -g .` — [開発ガイド](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) を参照)。
- **スタンドアロンのフィクスチャ** (`multi-provider`, `test-markdown`) — フィクスチャフォルダから `node ../../bin/ai-i18n-tools.mjs …` を使用します。

CLI ソースを変更した後、リポジトリルートで `pnpm run build` を実行します。ビルド手順やオプションのグローバルインストールの回避策については、[開発ガイド](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) を参照してください。

Linux、macOS、およびWSLでは、レジストリからのインストールによりCLIスクリプトの実行ビットが自動的に設定されます。Windowsでは、パッケージマネージャーがNodeを明示的に呼び出す`.cmd`および`.ps1`のシャムを生成します。

翻訳コマンド (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) は `ai-i18n-tools.config.json` に **プロバイダー設定** と、アクティブなプロバイダーの **API キー** が必要です。`ai-i18n-tools init [-P <provider>]` を実行してデフォルトのプロバイダーブロックをスキャフォールドします (省略時は `openrouter`); `provider` / `providers` を編集してプリセットやモデルを切り替えます — [LLM プロバイダーとモデル](/ja/guide/providers-and-models) を参照してください。Ollama は API キーが不要な唯一の組み込みプリセットです。

アクティブなプロバイダーに一致する API キーを設定します ([プリセットテーブル](/ja/guide/providers-and-models#built-in-providers) を参照):

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

またはプロジェクトルートに`.env`ファイルを作成してください。

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### ツールUIの言語

CLIは、翻訳対象のロケールとは独立して、独自のヘルプテキスト、ログの要約、翻訳ダッシュボードをローカライズします。デフォルトではOSのロケールに従います。設定内の`-L pt-BR`、`export AI_I18N_LANG=es`、または`"uiLanguage"`で上書きします。[ツールUI言語](/ja/guide/tool-ui-language)を参照してください。
