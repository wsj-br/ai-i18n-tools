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

**`package.json`スクリプト（推奨）** — npmまたはpnpmがスクリプトを実行すると、`PATH`の前に`node_modules/.bin`が追加されるため、`pnpm run i18n:sync`のようなコマンドは`npx`または`pnpm exec`プレフィックスなしで`ai-i18n-tools`を呼び出します。

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

**インタラクティブシェル** — ローカルインストール後、プロジェクトのルートから：

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
yarn ai-i18n-tools sync       # yarn (Berry: yarn dlx ai-i18n-tools … for one-off)
```

**ターミナルで** `ai-i18n-tools`を**直接入力** — インタラクティブシェルでコマンド名を直接入力するには、ローカルのbinディレクトリを`PATH`の前に付けます。

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

[**direnv**](https://direnv.net/)を使用する場合は、プロジェクトルートの`.envrc`に`PATH_add node_modules/.bin`を追加して、プロジェクトに`cd`した後、ベアコマンドが利用できるようにします。`PATH`を調整せずに、`npx ai-i18n-tools …`または`pnpm exec ai-i18n-tools …`を使い続けてください。

**インストール不要のワンタイム実行** — `npx ai-i18n-tools <cmd>` または `pnpm dlx ai-i18n-tools <cmd>`（その実行のためにパッケージをダウンロード。`package.json` にエントリは追加されません）。

<a id="cloned-ai-i18n-tools-monorepo"></a>
### クローンした ai-i18n-tools モノレポ

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) の完全なクローンからパッケージを開発する、またはワークスペースの**例**を実行する場合:

- **ワークスペースの例** (`examples/console-app`、`examples/nextjs-app`、および [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) にリストされているその他のパッケージ) — リポジトリルートで `pnpm install` を実行した後、`cd examples/<name>` を実行し、`pnpm exec ai-i18n-tools …` または各例の `pnpm run i18n:*` スクリプトを使用します。ワークスペースの [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) は `ai-i18n-tools` をローカルのチェックアウトにリンクします。
- **リポジトリルート** — pnpm はルートパッケージ自身の `bin` を `node_modules/.bin` にリンクしません。ルートで `npx ai-i18n-tools` を実行すると、作業ツリーではなく**公開済みの npm**パッケージが実行されます。代わりに `node bin/ai-i18n-tools.mjs …` またはルートの `pnpm i18n:*` スクリプトを使用してください。
- **スタンドアロンのフィクスチャ** (`multi-provider`、`test-markdown`) — フィクスチャのフォルダから `node ../../bin/ai-i18n-tools.mjs …` を使用します。

CLI ソースを変更した後、リポジトリルートで `pnpm run build` を実行します。ビルド手順やオプションのグローバルインストールの回避策については、[開発ガイド](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) を参照してください。

Linux、macOS、およびWSLでは、レジストリからのインストールによりCLIスクリプトの実行ビットが自動的に設定されます。Windowsでは、パッケージマネージャーがNodeを明示的に呼び出す`.cmd`および`.ps1`のシャムを生成します。

翻訳コマンド (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) には、`ai-i18n-tools.config.json` での**プロバイダー設定**と、アクティブなプロバイダーの**APIキー**が必要です。デフォルトのOpenRouterブロックをスキャフォールディングするには `ai-i18n-tools init` を実行し、プリセットやモデルを切り替えるには `provider` / `providers` を編集してください ([LLMプロバイダーとモデル](/ja/guide/providers-and-models) を参照)。Ollamaは、APIキーを必要としない唯一の組み込みプリセットです。

プロバイダーのAPIキーを設定します（OpenRouterが表示されています。アクティブなプロバイダーに一致する環境変数を使用してください — [プリセットテーブル](/ja/guide/providers-and-models#built-in-providers)を参照）。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

またはプロジェクトルートに`.env`ファイルを作成してください。

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### ツールUIの言語

CLIは、翻訳対象のロケールとは独立して、独自のヘルプテキスト、ログの要約、翻訳ダッシュボードをローカライズします。デフォルトではOSのロケールに従います。設定内の`-L pt-BR`、`export AI_I18N_LANG=es`、または`"uiLanguage"`で上書きします。[ツールUI言語](/ja/guide/tool-ui-language)を参照してください。
