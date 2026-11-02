<a id="installation"></a>
# インストール

このページではCLIをインストールし、`ai-i18n-tools` コマンド単体が動作するようにします。インストール済みの場合は、[クイックスタート](/ja/guide/quick-start) に進んでください。

公開されているパッケージはESM専用です。Node.jsまたはバンドラーで`import`または`import()`を使用してください。`require('ai-i18n-tools')`は使用しないでください。このパッケージは`engines.node` `>=22.16.0`を宣言しており、古いNode.jsバージョンはサポートされていません。npm tarballには、`docs/ai-i18n-tools-context.md`にあるコンシューマーコンテキストと完全な`skills/`ツリーが含まれており、完全なドキュメントサイトは含まれていません。`translated-docs/`以下のロケール固有のコピーは、[GitHubリポジトリ](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)にあります。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

<a id="standalone-executables"></a>
### スタンドアロン実行ファイル

GitHubリリースにはNode.jsの単一実行可能ビルドが添付されています。プロジェクトがNode.jsで実行されない場合は、そのバイナリを使用してください。Pythonおよび.NETプロジェクトは、Node.jsのインストールなしで、`extract`、`translate-ui`、および`suggest-models`を含む同じCLIをそこから実行できます。

LinuxおよびmacOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

インストーラーはシステムを検出し、一致する実行可能ファイルのgzipアーカイブをダウンロードし、`SHA256SUMS.txt`をチェックし、それを展開し、コマンドを`ai-i18n-tools`としてインストールし（Windowsでは`ai-i18n-tools.exe`）、インストールディレクトリを`PATH`に追加します。LinuxとmacOSは`gzip`で展開します。Windows PowerShellは、Windowsに既に含まれている.NET gzipリーダーで展開します。デフォルトのディレクトリは`~/.local/bin`です。コマンドがまだ見つからない場合は、新しいターミナルを開いてください。リリースを固定するには`AI_I18N_VERSION`（例: `v1.11.0`）を設定するか、別のディレクトリを選択するには`AI_I18N_INSTALL_DIR`を設定します。gzipアーカイブより前に公開されたリリースには、まだ生の実行可能ファイルが含まれており、インストーラーはそのファイルを受け入れます。

バイナリは公証されておらず、Authenticode署名もされていません。macOSは、署名されていないプログラムの承認を求める場合があります。Windows SmartScreenは警告を表示する場合があります。macOSインストーラーは、チェックサムが一致した後、隔離フラグをクリアします。

各リリースには、さらに`SHA256SUMS.txt`、`ai-i18n-tools-python-examples.zip`（4つのPythonサンプル）、および`ai-i18n-tools-dotnet-examples.zip`（`dotnet-console`、`dotnet-resx`、およびそれらのプロジェクトがコンパイルする`assets/dotnet`ヘルパー）が添付されています。.NETアーカイブより前に公開されたリリースには、それは含まれていません。スキルアーカイブが追加されたリリース以降、同じページに、すべてのコーディングエージェントスキルディレクトリである`ai-i18n-tools-skill.zip`が含まれています。そのスキルzipより前に公開されたリリースには、それは含まれておらず、最初のスキルzipには`ai-i18n-tools/`のみが含まれています。`install.sh`と`install.ps1`はリポジトリのルートにあり、上記のコマンドはそこからそれらをダウンロードします。npm tarballと実行可能ファイルには、サンプルアーカイブやスキルzipは含まれていません。サンプルはリポジトリに残ります。スキルディレクトリはnpm tarball内にあります。[コーディングエージェントスキル](/ja/guide/coding-agent-skill#download-the-skill-directory)を参照してください。

<details>
<summary><code>ai-i18n-tools</code> 実行可能ファイルの手動インストール手順</summary>

| プラットフォーム | アセット |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64.gz` |
| Linux arm64 | `ai-i18n-tools-linux-arm64.gz` |
| macOS arm64 | `ai-i18n-tools-macos-arm64.gz` |
| macOS x64 | `ai-i18n-tools-macos-x64.gz` |
| Windows x64 | `ai-i18n-tools-win-x64.exe.gz` |

1. マシンに一致するアセットと`SHA256SUMS.txt`を、[GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases) ページからダウンロードします。
2. gzipアーカイブのチェックサムを確認します。Linuxでは、`grep ' ai-i18n-tools-linux-x64.gz$' SHA256SUMS.txt | sha256sum -c -`（ダウンロードしたアセット名を使用してください）。macOSでは、`shasum -a 256 -c -`と同じ行です。Windowsでは、`(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe.gz).Hash`を実行し、`SHA256SUMS.txt`のハッシュと比較します。
3. アーカイブを展開し、コマンドを`PATH`に配置します。

LinuxとmacOS、Linux x64アセットを例として使用 (ダウンロードしたアセットに置き換えてください):

```bash
mkdir -p "$HOME/.local/bin"
gzip -dc ai-i18n-tools-linux-x64.gz > "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

`$HOME/.local/bin` がまだ `PATH` に含まれていない場合は、これをシェルプロファイル (`.bashrc`、`.bash_profile`、`.profile`、または `.zshrc`) に追加して、新しいターミナルを開いてください:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell)。`GZipStream`はWindows PowerShellの一部であり、個別のgzipインストールは不要です。

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\bin" | Out-Null
Add-Type -AssemblyName System.IO.Compression
$gz = [System.IO.File]::OpenRead("$PWD\ai-i18n-tools-win-x64.exe.gz")
$outPath = "$env:USERPROFILE\.local\bin\ai-i18n-tools.exe"
try {
  $gzipStream = New-Object System.IO.Compression.GZipStream($gz, [System.IO.Compression.CompressionMode]::Decompress)
  try {
    $out = [System.IO.File]::Create($outPath)
    try { $gzipStream.CopyTo($out) } finally { $out.Dispose() }
  } finally { $gzipStream.Dispose() }
} finally { $gz.Dispose() }
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

アクティブなプロバイダーのAPIキーは、npmインストールと同じ方法で設定します（下記参照）。次に、プロジェクトの`init`テンプレートを選択して翻訳します。Pythonプロジェクトは`-t ui-python`を使用します。.NETプロジェクトは`-t ui-dotnet`を使用します。すでに`ResourceManager`または`IStringLocalizer`で文字列をロードしているアプリは`-t ui-dotnet-resx`を使用します。以下の`init`行を実行します。

```bash
# Python
ai-i18n-tools init -t ui-python -P cheaperinference
# .NET
# ai-i18n-tools init -t ui-dotnet -P cheaperinference
# .NET ResourceManager or IStringLocalizer
# ai-i18n-tools init -t ui-dotnet-resx -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools sync
```

新しい設定の場合にのみ`init`を使用してください。これは選択された設定ファイルを上書きします。既存のプロジェクトの場合は、代わりに設定を編集してください。`sync`は、UI抽出を含む、設定済み/有効化されたすべての翻訳パイプラインを処理します。

ウォークスルー：[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)、[.NETアプリにi18nを追加する](/ja/guide/add-i18n-to-dotnet)、および[.NET ResourceManagerアプリにi18nを追加する](/ja/guide/add-i18n-to-dotnet-resourcemanager)。コマンドリファレンス：[suggest-models](/ja/reference/cli-commands/models#suggest-models)。

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

プロジェクトに`ai-i18n-tools`を依存関係または開発依存関係としてインストールしてください（このページの上部を参照）。アプリケーションコードが`ai-i18n-tools/runtime`をインポートする場合、本番ランタイム/ビルド環境で利用できるようにしてください。グローバルCLIまたはスタンドアロンバイナリではそのインポートを満たすことはできません。このパッケージは、パッケージマネージャーが`node_modules/.bin/ai-i18n-tools`にリンクする`bin`エントリを宣言しています。そのシム（インストールされたパッケージ内の`bin/ai-i18n-tools.mjs`）がコンパイルされたCLIをロードします。

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

<a id="coding-agent-skill"></a>
### コーディングエージェントスキル

npmパッケージまたはスタンドアロン実行可能ファイルをインストールしても、スキルはエージェントに登録されません。インストール方法、ネイティブカタログ、およびスキルフォルダーを持たないエージェントについては、[コーディングエージェントスキル](/ja/guide/coding-agent-skill)を参照してください。

このリポジトリをクローンせずに、`SKILL.md`を含む各スキルディレクトリ（フォルダー）をすべて取得します。

1. Node.js 22.20以降: `npx skills add wsj-br/ai-i18n-tools --all -y`はそれらのディレクトリをエージェントのスキルフォルダーにインストールします。
2. パッケージがすでにインストールされている場合: `node_modules/ai-i18n-tools/skills/.`をそのフォルダーにコピーします。
3. Node.jsがない場合: `ai-i18n-tools --version`のバージョンに対応するnpm tarballから`package/skills/`を抽出します。それが追加されたリリース以降、そのGitHubリリースにある`ai-i18n-tools-skill.zip`には同じディレクトリが含まれています。そのzipより前に公開されたリリースには含まれていません。最初のzipには`ai-i18n-tools/`のみが含まれています。

コマンドとエージェントフォルダーについては、[コーディングエージェントスキル](/ja/guide/coding-agent-skill#download-the-skill-directory)を参照してください。

<a id="cloned-monorepo"></a>
### クローンしたモノレポ

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools)の完全なクローンからパッケージを開発したり、ワークスペースのサンプルを実行したりする場合:

- ワークスペースのサンプル (`examples/console-app`、`examples/nextjs-app`、および[`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)にリストされているその他のパッケージ) — リポジトリのルートで`pnpm install`を実行し、次に`cd examples/<name>`を実行します。サンプルの`pnpm run i18n:*`スクリプトを使用するか、PATHを設定して([CLIの使用](#using-the-cli)を参照)、`ai-i18n-tools …`を直接実行します。ワークスペースの[`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)は、`ai-i18n-tools`をローカルのチェックアウトにリンクします。
- リポジトリのルート — pnpmは、ルートパッケージ自身の`bin`を`node_modules/.bin`にリンクしません。このチェックアウトの`.envrc`は`bin/`を`PATH`に追加するため、コミットされた`bin/ai-i18n-tools`ラッパー (公開された`bin/ai-i18n-tools.mjs`シムの横) は`direnv allow`の後に直接コマンドを提供します。direnvがない場合は、`node bin/ai-i18n-tools.mjs …`、`./bin/ai-i18n-tools …`、またはルートの`pnpm i18n:*`スクリプト (あるいはシェルのエイリアス / `pnpm add -g .`) を使用します。
- スタンドアロンのフィクスチャ (`multi-provider`、`test-markdown`) — フィクスチャのフォルダーから、`node ../../bin/ai-i18n-tools.mjs …`を使用します。

CLI ソースを変更した後、リポジトリルートで `pnpm run build` を実行します。ビルド手順やオプションのグローバルインストールの回避策については、[開発ガイド](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) を参照してください。

Linux、macOS、およびWSLでは、レジストリからのインストールによりCLIスクリプトの実行ビットが自動的に設定されます。Windowsでは、パッケージマネージャーがNodeを明示的に呼び出す`.cmd`および`.ps1`のシャムを生成します。

次へ: [クイックスタート](/ja/guide/quick-start)。
