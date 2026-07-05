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

Linux、macOS、およびWSLでは、レジストリからのインストールによりCLIスクリプトの実行ビットが自動的に設定されます。Windowsでは、パッケージマネージャーがNodeを明示的に呼び出す`.cmd`および`.ps1`のシャムを生成します。

プロバイダーのAPIキーを設定します（OpenRouterが表示されています。アクティブなプロバイダーに一致する環境変数を使用してください — [プリセットテーブル](/guide/providers-and-models#built-in-providers)を参照）。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

またはプロジェクトルートに`.env`ファイルを作成してください。

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### ツールUIの言語

CLIは、翻訳するロケールとは独立して、独自のヘルプテキスト、ログの概要、および翻訳ダッシュボードをローカライズします。デフォルトでは、OSのロケールに従います。設定で`-L pt-BR`、`export AI_I18N_LANG=es`、または`"uiLanguage"`を使用してオーバーライドします。[ツールUIの言語](/reference/environment-variables#tool-ui-language)を参照してください。
