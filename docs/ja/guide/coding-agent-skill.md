<a id="coding-agent-skill"></a>
# コーディングエージェントスキル

1回のインストールですべてのコンシューマースキルがコピーされます。[共有スキル](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills/ai-i18n-tools)は、エージェントに`sync`を使用して`ai-i18n-tools`をインストールおよび保守する方法を教え、タスクに一致するリファレンスのみをロードします。各ワークフローは、`/ai-i18n-vitepress`のような個別のスラッシュコマンドです。

npmパッケージまたはスタンドアロン実行可能ファイルをインストールしても、スキルは登録されません。各エージェントには1つのインストール方法を使用してください。

<a id="install-with-the-skills-cli"></a>
## skills CLI によるインストール

これは、Node.jsが22.20以降の場合に使用するインストール方法です。このパッケージ自身のCLIはNode.js 22.16を許可しますが、これはskills CLIには古すぎます。22.16から22.19の場合、またはNode.jsがインストールされていないマシンでは、[スキルディレクトリをダウンロードする](#download-the-skill-directory)を使用してください。

エージェントに作業させたいプロジェクトから:

```bash
npx skills add wsj-br/ai-i18n-tools
```

このコマンドは、共有スキルと各ワークフローコマンドを含む、`skills/`以下のすべてのディレクトリをインストールします。このリポジトリのチェックアウトをプロジェクトに残しません。デフォルトのスコープは現在のプロジェクトです。プロジェクト全体でユーザー用にインストールするには、`-g`を追加します。

```bash
npx skills add wsj-br/ai-i18n-tools --all -y
npx skills add wsj-br/ai-i18n-tools --list
npx skills add wsj-br/ai-i18n-tools --skill ai-i18n-vitepress -a cursor
npx skills update
```

`--all -y`はワンステップインストールです: すべてのスキル、プロンプトなし。`--all`がない場合、インストーラーはどのスキルをコピーするかを尋ねます。`--list`はスキルを表示し、何もインストールしません。`--skill`と`-a`は、1つのスキルと1つのエージェントのプロンプトをスキップします。`npx skills update`はこの方法でインストールされたスキルを更新します。最初のインストール後にスキルが追加された場合は、`add`を再度実行してそのスキルを認識させます。

インストールせずに、スキルをプロンプトとして表示したり、サポートされているエージェントで起動したりするには:

```bash
npx skills use wsj-br/ai-i18n-tools@ai-i18n-tools
```

CLIは、マシンにインストールされているコーディングエージェントを検出します。各エージェントのインストールパスは、[skills CLIエージェントリスト](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)にあります。このリストは変更されます。このページではそれを繰り返さず、すべてのコーディングツールがスキルフォルダーを読み取るとは主張しません。

skills CLIは匿名の使用状況データを収集します。それをオフにするには、`DISABLE_TELEMETRY=1`または`DO_NOT_TRACK=1`を設定します。

インストール後、その製品がリロードを必要とする場合は、新しいエージェントセッションを開始してください。`/ai-i18n-vitepress`のようなワークフローコマンドを入力するか、エージェントに`ai-i18n-tools`スキルを使用するように依頼します。共有スキルは、コマンド名を指定しないリクエストのフォールバックです。発見されたスキルが、エージェントがそれを自律的に呼び出すことを保証するものではありません。

<a id="slash-commands"></a>
## スラッシュコマンド

共有の`ai-i18n-tools`スキルはエージェントに利用可能なままです。他のスキルは明示的なコマンドです。それぞれが共有スキルに従い、そのテンプレートとチェックのみを適用します。

| コマンド | ワークフロー |
| --- | --- |
| `/ai-i18n-js` | JavaScriptまたはTypeScriptのソース文字列UI |
| `/ai-i18n-python` | 生成されたPythonヘルパーとフラットJSONカタログ |
| `/ai-i18n-django` | Django、Flask-Babel、またはプレーンなgettext |
| `/ai-i18n-vitepress` | VitePress |
| `/ai-i18n-starlight` | Astro Starlightドキュメント |
| `/ai-i18n-docusaurus` | Docusaurus |
| `/ai-i18n-nextra` | Nextra |
| `/ai-i18n-fumadocs` | Fumadocs |
| `/ai-i18n-astro-website` | Vanilla Astro ウェブサイト |
| `/ai-i18n-plain-html` | 1つのHTMLファイル、ブラウザで切り替え |
| `/ai-i18n-plain-html-docs` | ロケールごとに1つのHTMLツリー |
| `/ai-i18n-readme` | READMEとリポジトリのMarkdown |
| `/ai-i18n-migrate-intlayer` | Intlayerから`t()`呼び出しへの1回限りの移行 |
| `/ai-i18n-translate-intlayer` | Intlayer辞書をその場で埋める |

`.agents/skills/`または`.cursor/skills/`にコピーされたスキルは、これらのコマンドとして表示されます。現在のCursorのバグにより、`disable-model-invocation`を設定するマーケットプレイスプラグインのスキルが`/`パレットから非表示になります。Claude Code、Codex、Copilotでは、それらのコマンドは引き続き表示されます。Cursorでコマンドが必要な場合は、スキルCLIインストールを使用してください。自然言語のリクエストは、共有スキルには引き続き到達します。

<a id="download-the-skill-directory"></a>
## スキルディレクトリをダウンロードする

スキルCLIが利用できない場合は、これを使用してください。`ai-i18n-tools/`だけでなく、すべてのスキルディレクトリをコピーしてください。各ワークフローコマンドは、`SKILL.md`を含む独自のフォルダです。1つのスキルパスのgit cloneと`npx degit`は、どちらも約50 MBのリポジトリソースアーカイブをダウンロードします。

[スキルCLIエージェントリスト](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)から1つのエージェントディレクトリを選択してください。以下の例では、複数のエージェントが読み取る`.agents/skills/`を使用しています。既存のコピーを置き換える前に、その宛先を検査してください。エージェントごとに1つのコピーで十分です。同じエージェントに対して別の検出フォルダに2つ目のコピーがある場合、それは重複です。

npmパッケージにはすでにディレクトリが含まれています。パッケージがインストールされている場合：

```bash
mkdir -p .agents/skills
cp -a node_modules/ai-i18n-tools/skills/. .agents/skills/
```

`node_modules`がない場合は、CLIが報告するのと同じバージョンのnpm tarballをダウンロードしてください。`ai-i18n-tools --version`はバージョン、次にビルドタイムスタンプを出力します。バージョン番号のみを使用してください。tarballのメンバーは`package/skills/`です。

```bash
mkdir -p .agents/skills
curl -fsSL https://registry.npmjs.org/ai-i18n-tools/-/ai-i18n-tools-1.12.0.tgz \
  | tar -xz --strip-components=2 -C .agents/skills package/skills
```

`1.12.0`をインストールされているバージョンに置き換えてください。これは現在のリリースで機能します。スタンドアロン実行可能ファイルにはスキルファイルは含まれていません。tarballを`ai-i18n-tools --version`に合わせてください。

それを含むリリースから、GitHub Releasesも`ai-i18n-tools-skill.zip`を添付します。そのzipファイルには、すべてのスキルディレクトリがトップレベルに含まれています。結果として`ai-i18n-tools/SKILL.md`と`ai-i18n-vitepress/SKILL.md`のようなワークフローフォルダの両方が含まれるように、それをエージェントのスキルフォルダに解凍してください。そのzipファイルより前に公開されたリリースには、それは含まれていません。古いzipファイルには`ai-i18n-tools/`のみが含まれています。それらのリリースにはnpm tarballを使用してください。タグは`v`とCLIバージョンです。例えば、そのタグのリリースにアセットがある場合、`v1.12.0`となります。

<a id="agents-the-skills-cli-installs"></a>
## スキルCLIがインストールするエージェント

1つのエージェントが必要な場合は、IDを`-a`に渡してください。これらのツールに対して、このリポジトリには他には何も必要ありません。

CLIエージェント：Claude Code (`claude-code`)、Codex CLI (`codex`)、Gemini CLI (`gemini-cli`)、Antigravity CLI (`antigravity-cli`)、GitHub Copilot CLI (`github-copilot`)、OpenCode (`opencode`)、Goose (`goose`)、Qwen Code (`qwen-code`)、Kilo CLI (`kilo`)、Grok Build (`grok`)、Amp (`amp`)、Crush (`crush`)、Pi (`pi`)、Kiro CLI (`kiro-cli`)。

エディターとIDE：Cursor (`cursor`)、Windsurf (`windsurf`)、Devin for Terminal (`devin`)、Zed (`zed`)、Antigravity (`antigravity`)、Trae (`trae`)、Junie (`junie`)、Replit (`replit`)、Cline (`cline`)、Roo Code (`roo`)、Kilo Code (`kilo`)、Continue (`continue`)、Augment (`augment`)、Factory Droid (`droid`)、Tabnine CLI (`tabnine-cli`)。エディター内のGitHub Copilotは、CLIと同じ`github-copilot` IDを使用します。

見落としがちな2つのパスの詳細：

- Cursor: skills CLIからのプロジェクトインストールは`.agents/skills/`に配置されます。`-g`は`~/.cursor/skills/`に配置されます。Cursor自身のドキュメントも、プロジェクト内で`.cursor/skills/`を受け入れます。これらのいずれかを使用してください。
- GitHub Copilot: skills CLIはプロジェクトに`.agents/skills/`を、`-g`には`~/.copilot/skills/`を書き込みます。GitHubのクラウドエージェントのドキュメントも`.github/skills/`について説明しています。そのフォルダーはすべてのCopilotチャットで読み込まれるわけではありません。使用するインターフェース向けにドキュメント化されているフォルダーのみを使用してください。

Kiro CLIのデフォルトエージェントは、追加の設定なしで`.kiro/skills/`と`~/.kiro/skills/`をロードします。カスタムKiroエージェントは、`.kiro/agents/<agent>.json`にリストされているインストール済みのスキルを必要とします：

```json
{
  "resources": ["skill://.kiro/skills/**/SKILL.md"]
}
```

<a id="native-catalogs"></a>
## ネイティブカタログ

一部の製品は、このリポジトリ内のカタログからスキルをインストールします。各エージェントには、カタログまたはskills CLIのいずれか1つのチャネルを使用してください。パッケージのアップグレードでは、手動でコピーされたスキルは更新されません。`npx skills update`はskills CLIのインストールを更新します。カタログからのインストールは、その製品の更新コマンドに従います。

- Cursor Marketplace（リスティング承認後）：Cursor Marketplaceから`ai-i18n-tools`をインストールします。そのリスティングが存在するまでは、skills CLIを使用してください。[Cursor Directory](https://cursor.directory)は別のコミュニティリスティングです。
- Claude Code（Claude Codeセッションから）：

```text
/plugin marketplace add wsj-br/ai-i18n-tools
/plugin install ai-i18n-tools@ai-i18n-tools
```

- GitHub Copilot CLI：

```bash
copilot plugin marketplace add wsj-br/ai-i18n-tools
```

そのマーケットプレイスから`ai-i18n-tools`プラグインをインストールします。プラグインIDは`ai-i18n-tools@ai-i18n-tools`です。Copilot CLIは、Claude Codeが使用するのと同じカタログファイルを読み込みます。

- Codex：

```bash
codex plugin marketplace add wsj-br/ai-i18n-tools
```

ChatGPTワークスペースのリスティングは、ワークスペース管理者によって別途公開されます。これは、このコマンドとは異なるインストールです。

<a id="agents-without-a-skills-install"></a>
## スキルインストールなしのエージェント

これらの製品はskills CLIエージェントリストには含まれていません。このリポジトリは、これらの製品用の個別のスキルフォルダーを提供していません。エージェントを、`AGENTS.md`のようなプロジェクトの指示から[コンシューマーコンテキスト](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md)に指定してください：

```markdown
Before installing or maintaining ai-i18n-tools, read
https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md
and follow only the linked reference that matches this project.
Use ai-i18n-tools sync for the configured workflow.
```

そのファイルはドキュメントサイトとリポジトリのURLを使用しているため、エージェントがこのリポジトリを読み取れない場合でも、その指示は機能します。古いCLIの場合は、対応するリリースタグで同じパスを開いてください。コンシューマープロジェクトはこのコンテキストファイルを使用します。このリポジトリを変更する際には、メンテナーの`AGENTS.md`が適用されます。

このグループの製品：Aider、gptme、Amazon Q Developer CLI、DeepSeek Harness、JetBrains AI Assistant、Sourcegraph Cody、Qodo、Tabnine IDEプラグイン、CodeGeeX、およびAskCodi。Junieはskills CLIインストールを受け入れるJetBrainsエージェントです。Tabnine CLIも同様です。AiderDeskはAiderとは異なるアプリケーションです。

CodeLayerとSupersetは独自のスキルディレクトリを持っていません。CodeLayerはClaude Codeを実行するため、Claude Code用のスキルをインストールしてください。Supersetは設定したCLIエージェントを実行するため、それらのエージェント用のスキルをインストールしてください。

<a id="stay-on-the-same-version"></a>
## 同じバージョンを維持する

スキルは`ai-i18n-tools`コマンドと同じリリースバージョンに保ってください。npmのアップグレードや新しいスタンドアロン実行可能ファイルは、手動でコピーされたスキルを元の場所に残します。対応するバージョンからスキルを再度インストールするか、skills CLIのインストールには`npx skills update`を実行してください。

オンラインドキュメントには、インストールされているコマンドよりも新しいリリースが記載されている場合があります。フラグには`ai-i18n-tools --help`を推奨します。詳細な参照：[インストール](/ja/guide/installation)、[設定](/ja/reference/configuration)、[プロバイダー](/ja/guide/providers-and-models)、[CLIリファレンス](/ja/reference/cli-commands/)。
