<a id="coding-agent-skill"></a>
# 编码代理技能

一次安装会复制所有消费者技能。[共享技能](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills/ai-i18n-tools) 教会代理如何使用 `sync` 安装和维护 `ai-i18n-tools`，并且只加载与任务匹配的引用。每个工作流都是一个单独的斜杠命令，例如 `/ai-i18n-vitepress`。

安装 npm 包或独立可执行文件不会注册技能。每个代理使用一种安装方法。

<a id="install-with-the-skills-cli"></a>
## 通过技能 CLI 安装

当 Node.js 版本为 22.20 或更高时，应使用此安装方法。此包自己的 CLI 允许 Node.js 22.16，但这对于技能 CLI 来说太旧了。在 22.16 到 22.19 版本上，或在没有 Node.js 的机器上，请使用[下载技能目录](#download-the-skill-directory)。

在您希望代理工作的项目中：

```bash
npx skills add wsj-br/ai-i18n-tools
```

该命令会安装 `skills/` 下的所有目录，包括共享技能和每个工作流命令。它不会在您的项目中留下此仓库的检出。默认范围是当前项目。添加 `-g` 以便为您的用户在所有项目中进行安装。

```bash
npx skills add wsj-br/ai-i18n-tools --all -y
npx skills add wsj-br/ai-i18n-tools --list
npx skills add wsj-br/ai-i18n-tools --skill ai-i18n-vitepress -a cursor
npx skills update
```

`--all -y` 是一步式安装：安装所有技能，无需提示。如果没有 `--all`，安装程序会询问要复制哪些技能。`--list` 会打印技能但什么都不安装。`--skill` 和 `-a` 会跳过一个技能和一个代理的提示。`npx skills update` 会刷新以此方式安装的技能。再次运行 `add` 以获取首次安装后添加的技能。

要将技能作为提示打印，或使用它启动受支持的代理，而无需安装：

```bash
npx skills use wsj-br/ai-i18n-tools@ai-i18n-tools
```

CLI 会检测机器上安装的编码代理。每个代理的安装路径都在[技能 CLI 代理列表](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)中。该列表会发生变化。本页面不会重复该列表，也不声称每个编码工具都会读取技能文件夹。

技能 CLI 会收集匿名使用数据。设置 `DISABLE_TELEMETRY=1` 或 `DO_NOT_TRACK=1` 以关闭此功能。

安装后，如果该产品需要重新加载，请启动新的代理会话。键入一个工作流命令，例如 `/ai-i18n-vitepress`，或者要求代理使用 `ai-i18n-tools` 技能。共享技能是未指定命令的请求的备用方案。发现的技能并不能保证代理会自行调用它。

<a id="slash-commands"></a>
## 斜杠命令

共享的 `ai-i18n-tools` 技能对代理保持可用。其他技能是显式命令。每个技能都遵循共享技能，然后只应用其模板和检查。

| 命令 | 工作流 |
| --- | --- |
| `/ai-i18n-js` | JavaScript 或 TypeScript 源字符串 UI |
| `/ai-i18n-python` | 生成的 Python 助手和平面 JSON 目录 |
| `/ai-i18n-django` | Django、Flask-Babel 或纯 gettext |
| `/ai-i18n-vitepress` | VitePress |
| `/ai-i18n-starlight` | Astro Starlight 文档 |
| `/ai-i18n-docusaurus` | Docusaurus |
| `/ai-i18n-nextra` | Nextra |
| `/ai-i18n-fumadocs` | Fumadocs |
| `/ai-i18n-astro-website` | Vanilla Astro 网站 |
| `/ai-i18n-plain-html` | 一个 HTML 文件，在浏览器中切换 |
| `/ai-i18n-plain-html-docs` | 每个区域设置一个 HTML 树 |
| `/ai-i18n-readme` | README 和仓库 Markdown |
| `/ai-i18n-migrate-intlayer` | 从 Intlayer 到 `t()` 调用的一次性迁移 |
| `/ai-i18n-translate-intlayer` | 就地填充 Intlayer 字典 |

复制到 `.agents/skills/` 或 `.cursor/skills/` 中的技能会显示为这些命令。Cursor 当前的一个错误会隐藏从 `/` 面板中设置了 `disable-model-invocation` 的市场插件技能。Claude Code、Codex 和 Copilot 仍然显示这些命令。当您想在 Cursor 中使用这些命令时，请使用技能 CLI 安装。文本请求仍然可以访问共享技能。

<a id="download-the-skill-directory"></a>
## 下载技能目录

当技能 CLI 不可用时，请使用此方法。复制所有技能目录，而不仅仅是 `ai-i18n-tools/`。每个工作流命令都是一个独立的文件夹，包含一个 `SKILL.md`。对一个技能路径执行 git clone 和 `npx degit` 都会下载仓库源存档，大约 50 MB。

从 [技能 CLI 代理列表](https://github.com/vercel-labs/skills/blob/main/docs/agents.md) 中选择一个代理目录。以下示例使用 `.agents/skills/`，多个代理会读取它。在替换现有副本之前检查该目标。每个代理一个副本就足够了。同一代理在另一个发现文件夹中的第二个副本是重复的。

npm 包已经包含这些目录。当包安装后：

```bash
mkdir -p .agents/skills
cp -a node_modules/ai-i18n-tools/skills/. .agents/skills/
```

如果没有 `node_modules`，请下载 CLI 报告的相同版本的 npm tarball。`ai-i18n-tools --version` 会打印版本，然后是构建时间戳。只使用版本号。tarball 成员是 `package/skills/`。

```bash
mkdir -p .agents/skills
curl -fsSL https://registry.npmjs.org/ai-i18n-tools/-/ai-i18n-tools-1.12.0.tgz \
  | tar -xz --strip-components=2 -C .agents/skills package/skills
```

将 `1.12.0` 替换为您已安装的版本。这适用于当前版本。独立可执行文件不包含技能文件。将 tarball 与 `ai-i18n-tools --version` 匹配。

从添加了它的版本中，GitHub Releases 还会附加 `ai-i18n-tools-skill.zip`。该 zip 文件在其顶层包含所有技能目录。将其解压到代理技能文件夹中，以便结果包含 `ai-i18n-tools/SKILL.md` 和工作流文件夹，例如 `ai-i18n-vitepress/SKILL.md`。在该 zip 文件发布之前的版本不包含它。较旧的 zip 文件只包含 `ai-i18n-tools/`。对于这些版本，请使用 npm tarball。标签是 `v` 加上 CLI 版本，例如 `v1.12.0`（一旦该标签的版本包含该资产）。

<a id="agents-the-skills-cli-installs"></a>
## 技能 CLI 安装的代理

当您想要一个代理时，将 ID 传递给 `-a`。对于这些工具，此仓库中不需要其他任何东西。

CLI 代理：Claude Code (`claude-code`)，Codex CLI (`codex`)，Gemini CLI (`gemini-cli`)，Antigravity CLI (`antigravity-cli`)，GitHub Copilot CLI (`github-copilot`)，OpenCode (`opencode`)，Goose (`goose`)，Qwen Code (`qwen-code`)，Kilo CLI (`kilo`)，Grok Build (`grok`)，Amp (`amp`)，Crush (`crush`)，Pi (`pi`)，Kiro CLI (`kiro-cli`)。

编辑器和 IDE：Cursor (`cursor`)，Windsurf (`windsurf`)，Devin for Terminal (`devin`)，Zed (`zed`)，Antigravity (`antigravity`)，Trae (`trae`)，Junie (`junie`)，Replit (`replit`)，Cline (`cline`)，Roo Code (`roo`)，Kilo Code (`kilo`)，Continue (`continue`)，Augment (`augment`)，Factory Droid (`droid`)，Tabnine CLI (`tabnine-cli`)。编辑器中的 GitHub Copilot 使用与 CLI 相同的 `github-copilot` ID。

两个容易忽略的路径细节：

- Cursor：通过 skills CLI 安装的项目会安装到 `.agents/skills/`。`-g` 会安装到 `~/.cursor/skills/`。Cursor 自己的文档也接受项目中的 `.cursor/skills/`。请使用其中之一。
- GitHub Copilot：skills CLI 会在项目中写入 `.agents/skills/`，并为 `-g` 写入 `~/.copilot/skills/`。GitHub 的云代理文档也描述了 `.github/skills/`。并非所有 Copilot 聊天都会读取该文件夹。请仅使用您所用界面对应的文档中指定的文件夹。

Kiro CLI 的默认代理无需额外配置即可加载 `.kiro/skills/` 和 `~/.kiro/skills/`。自定义 Kiro 代理需要 `.kiro/agents/<agent>.json` 中列出的已安装技能：

```json
{
  "resources": ["skill://.kiro/skills/**/SKILL.md"]
}
```

<a id="native-catalogs"></a>
## 原生目录

某些产品还会从此仓库中的目录安装技能。每个代理使用一个通道：目录或 skills CLI。软件包升级不会刷新手动复制的技能。`npx skills update` 会刷新 skills CLI 安装。目录安装遵循该产品的更新命令。

- Cursor Marketplace，在列表获批后：从 Cursor Marketplace 安装 `ai-i18n-tools`。在该列表存在之前，请使用 skills CLI。[Cursor Directory](https://cursor.directory) 是一个独立的社区列表。
- Claude Code，从 Claude Code 会话中：

```text
/plugin marketplace add wsj-br/ai-i18n-tools
/plugin install ai-i18n-tools@ai-i18n-tools
```

- GitHub Copilot CLI：

```bash
copilot plugin marketplace add wsj-br/ai-i18n-tools
```

然后从该市场安装 `ai-i18n-tools` 插件。插件 ID 为 `ai-i18n-tools@ai-i18n-tools`。Copilot CLI 读取与 Claude Code 相同的目录文件。

- Codex：

```bash
codex plugin marketplace add wsj-br/ai-i18n-tools
```

ChatGPT 工作区列表由工作区管理员单独发布。它与此命令的安装方式不同。

<a id="agents-without-a-skills-install"></a>
## 无需技能安装的代理

这些产品不在 skills CLI 代理列表中。此仓库不为它们提供单独的技能文件夹。将代理指向项目说明（例如 `AGENTS.md`）中的 [消费者上下文](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md)：

```markdown
Before installing or maintaining ai-i18n-tools, read
https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md
and follow only the linked reference that matches this project.
Use ai-i18n-tools sync for the configured workflow.
```

该文件使用文档站点和仓库 URL，因此当代理无法读取此仓库时，该说明仍然有效。对于较旧的 CLI，请在匹配的发布标签上打开相同的路径。消费者项目使用此上下文文件。更改此仓库时，适用维护者 `AGENTS.md`。

此组中的产品：Aider、gptme、Amazon Q Developer CLI、DeepSeek Harness、JetBrains AI Assistant、Sourcegraph Cody、Qodo、Tabnine IDE 插件、CodeGeeX 和 AskCodi。Junie 是接受 skills CLI 安装的 JetBrains 代理。Tabnine CLI 也是如此。AiderDesk 是与 Aider 不同的应用程序。

CodeLayer 和 Superset 没有自己的技能目录。CodeLayer 运行 Claude Code，因此请为 Claude Code 安装技能。Superset 运行您配置的 CLI 代理，因此请为这些代理安装技能。

<a id="stay-on-the-same-version"></a>
## 保持版本一致

保持技能与 `ai-i18n-tools` 命令在同一版本。npm 升级和较新的独立可执行文件会将手动复制的技能保留在原处。从匹配的版本重新安装技能，或运行 `npx skills update` 进行 skills CLI 安装。

在线文档可能描述了比您已安装命令更新的版本。对于标志，请优先使用 `ai-i18n-tools --help`。更多参考：[安装](/zh-Hans/guide/installation)，[配置](/zh-Hans/reference/configuration)，[提供者](/zh-Hans/guide/providers-and-models)，[CLI 参考](/zh-Hans/reference/cli-commands/)。
