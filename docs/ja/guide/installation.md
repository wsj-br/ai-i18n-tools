<a id="installation"></a>
# インストール

このページではCLIをインストールし、`ai-i18n-tools` コマンド単体が動作するようにします。インストール済みの場合は、[クイックスタート](/ja/guide/quick-start) に進んでください。

公開されているパッケージはESM専用です。Node.jsまたはバンドラーでは `import` または `import()` を使用し、`require('ai-i18n-tools')` は使用しないでください。パッケージは `engines.node` `>=22.16.0` を宣言しており、古いバージョンのNode.jsはサポートされていません。npm tarballには `docs/` 以下に英語ファイルのみが含まれています。`translated-docs/` 以下のロケール固有のコピーは [GitHubリポジトリ](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) にあります。

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

LinuxおよびmacOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

インストーラーはシステムを検出し、一致する実行可能ファイルをダウンロードし、`SHA256SUMS.txt` をチェックし、コマンドを `ai-i18n-tools` (Windowsでは `ai-i18n-tools.exe`) としてインストールし、インストールディレクトリを `PATH` に追加します。デフォルトのディレクトリは `~/.local/bin` です。コマンドがまだ見つからない場合は、新しいターミナルを開いてください。リリースを固定するには `AI_I18N_VERSION` (例: `v1.11.0`) を設定するか、別のディレクトリを選択するには `AI_I18N_INSTALL_DIR` を設定します。

バイナリは公証されておらず、Authenticode署名もされていません。macOSでは、未署名のプログラムを承認するように求められる場合があります。Windows SmartScreenで警告が表示されることがあります。macOSインストーラーは、チェックサムが一致した後に隔離フラグをクリアします。

各リリースには、`SHA256SUMS.txt`、`install.sh`、`install.ps1`、および `ai-i18n-tools-python-examples.zip` (4つのPythonサンプル) も添付されています。npm tarballと実行可能ファイルには、これらのサンプルは含まれていません。これらはリポジトリにも残っています。

<details>
<summary><code>ai-i18n-tools</code> 実行可能ファイルの手動インストール手順</summary>

| プラットフォーム | アセット |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

1. [GitHubリリース](https://github.com/wsj-br/ai-i18n-tools/releases) ページから、マシンに一致するアセットと `SHA256SUMS.txt` をダウンロードします。
2. チェックサムを確認します。Linuxでは `grep ' ai-i18n-tools-linux-x64$' SHA256SUMS.txt | sha256sum -c -` (ダウンロードしたアセット名を使用)。macOSでは、同じ行で `shasum -a 256 -c -` を使用します。Windowsでは、`(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe).Hash` を実行し、`SHA256SUMS.txt` 内のハッシュと比較します。
3. ダウンロードしたファイルの名前を `ai-i18n-tools` に変更し、そのディレクトリを `PATH` に追加します。

LinuxとmacOS、Linux x64アセットを例として使用 (ダウンロードしたアセットに置き換えてください):

```bash
mkdir -p "$HOME/.local/bin"
mv ai-i18n-tools-linux-x64 "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

`$HOME/.local/bin` がまだ `PATH` に含まれていない場合は、これをシェルプロファイル (`.bashrc`、`.bash_profile`、`.profile`、または `.zshrc`) に追加して、新しいターミナルを開いてください:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell)、`ai-i18n-tools-win-x64.exe` の名前を `ai-i18n-tools.exe` に変更:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\bin" | Out-Null
Move-Item -Force .\ai-i18n-tools-win-x64.exe "$env:USERPROFILE\.local\bin\ai-i18n-tools.exe"
$installDir = "$env:USERPROFILE\.local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ([string]::IsNullOrEmpty($userPath)) {
  [Environment]::SetEnvironmentVariable("Path", $installDir, "User")
} elseif ($userPath -notlike "*${installDir}*") {
  [Environment]::SetEnvironmentVariable("Path", "$installDir;$userPath", "User")
}
```

新しいターミナルを開き、`ai-i18n-tools --version` を実行します。コマンド名はすべてのプラットフォームで `ai-i18n-tools` です。

</details>

アクティブなプロバイダーのAPIキーを、npmインストールと同じ方法で設定します (下記参照)。その後:

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

チュートリアル: [Pythonアプリへのi18nの追加](/ja/guide/add-i18n-to-python)。コマンドリファレンス: [suggest-models](/ja/reference/cli-commands/models#suggest-models)。

<a id="set-the-api-key"></a>
### APIキーを設定する

翻訳コマンド (`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`) には、`ai-i18n-tools.config.json` でのプロバイダー設定と、アクティブなプロバイダーの API キーが必要です。`ai-i18n-tools init -P <provider>` を実行して、そのプリセットをスキャフォールドしてください。プロバイダーのプリセットと API キー: [LLM プロバイダー](/ja/guide/providers-and-models)。`init` のモデルリストは出発点です。[AI モデル](/ja/guide/ai-models) を参照して、`suggest-models` またはダッシュボードの **モデル** タブで置き換えてください。Ollama は、API キーが不要な唯一の組み込みプリセットです。

`init` に渡すプロバイダーに一致するキーを設定します ([プリセットの表](/ja/guide/providers-and-models#built-in-providers) を参照):

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

<a id="using-the-cli"></a>
### CLI の使用方法

プロジェクトに `ai-i18n-tools` を依存関係 (dependency) または開発時依存関係 (devDependency) としてインストールします (このページの上部を参照)。パッケージは `bin` エントリを宣言し、パッケージマネージャーがそれを `node_modules/.bin/ai-i18n-tools` にリンクします。そのシム (インストールされたパッケージ内の `bin/ai-i18n-tools.mjs`) が、コンパイル済みのCLIをロードします。

インタラクティブシェルで `ai-i18n-tools` コマンド単体を入力するには、以下のいずれかのオプションを設定してください。設定を行わない場合、ローカルインストール後であってもシェルはバイナリを見つけることができません。

direnv — プロジェクトルートの `.envrc` に追加します (bash/zsh; [direnv.net](https://direnv.net/) を参照):

```bash
PATH_add node_modules/.bin
```

`direnv allow` の後、プロジェクトに `cd` すれば、いつでもコマンド単体が利用可能になります。

手動でのPATH設定 — これらをプロジェクトルート (`node_modules/.bin` を含むディレクトリ) から実行します。その後、`PATH` エントリをそのままにしておけば、サブディレクトリでも引き続き動作します。ネストされたフォルダーからエクスポートを再実行すると、`$PWD` がプロジェクトルートを指さなくなるため失敗します。

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

グローバルインストール — CLIを一度インストールすれば、どのディレクトリからでも呼び出せます:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

pnpmの場合、グローバルコマンドが見つからない場合はマシンごとに1回`pnpm setup`を実行し（新しいシェルを開いてください）— pnpmはそのグローバルbinディレクトリを`PATH`に配置する必要があります。グローバルインストールでは、グローバルに固定されたバージョンが使用されます。プロジェクトごとのバージョン固定には、direnvまたは手動PATHを推奨します。これにより、`node_modules/.bin`がプロジェクトの依存関係に解決されるようになります。

package.jsonのスクリプト — npmまたはpnpmがスクリプトを実行すると、`node_modules/.bin` が `PATH` の前に追加されるため、シェルのPATHを変更しなくても、スクリプト内でコマンド名単体で動作します:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

次に、`pnpm run i18n:sync`などを実行します。推奨される完全なセットについては、[推奨されるpackage.jsonスクリプト](/ja/guide/quick-start#recommended-packagejson-scripts)を参照してください。

代替案 — `PATH`を調整したくない場合: `npx ai-i18n-tools …` (npm) または `pnpm exec ai-i18n-tools …` (pnpm)。`package.json`エントリなしで、ゼロインストールで1回限り実行する場合: `npx ai-i18n-tools <cmd>`または`pnpm dlx ai-i18n-tools <cmd>`。

<a id="cloned-monorepo"></a>
### クローンしたモノレポ

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools)の完全なクローンからパッケージを開発したり、ワークスペースのサンプルを実行したりする場合:

- ワークスペースのサンプル (`examples/console-app`、`examples/nextjs-app`、および[`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)にリストされているその他のパッケージ) — リポジトリのルートで`pnpm install`を実行し、次に`cd examples/<name>`を実行します。サンプルの`pnpm run i18n:*`スクリプトを使用するか、PATHを設定して([CLIの使用](#using-the-cli)を参照)、`ai-i18n-tools …`を直接実行します。ワークスペースの[`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)は、`ai-i18n-tools`をローカルのチェックアウトにリンクします。
- リポジトリのルート — pnpmは、ルートパッケージ自身の`bin`を`node_modules/.bin`にリンクしません。このチェックアウトの`.envrc`は`bin/`を`PATH`に追加するため、コミットされた`bin/ai-i18n-tools`ラッパー (公開された`bin/ai-i18n-tools.mjs`シムの横) は`direnv allow`の後に直接コマンドを提供します。direnvがない場合は、`node bin/ai-i18n-tools.mjs …`、`./bin/ai-i18n-tools …`、またはルートの`pnpm i18n:*`スクリプト (あるいはシェルのエイリアス / `pnpm add -g .`) を使用します。
- スタンドアロンのフィクスチャ (`multi-provider`、`test-markdown`) — フィクスチャのフォルダーから、`node ../../bin/ai-i18n-tools.mjs …`を使用します。

CLI ソースを変更した後、リポジトリルートで `pnpm run build` を実行します。ビルド手順やオプションのグローバルインストールの回避策については、[開発ガイド](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) を参照してください。

Linux、macOS、およびWSLでは、レジストリからのインストールによりCLIスクリプトの実行ビットが自動的に設定されます。Windowsでは、パッケージマネージャーがNodeを明示的に呼び出す`.cmd`および`.ps1`のシャムを生成します。

次へ: [クイックスタート](/ja/guide/quick-start)。
