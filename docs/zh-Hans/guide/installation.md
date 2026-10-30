<a id="installation"></a>
# 安装

本页介绍如何安装 CLI 并让基本的 `ai-i18n-tools` 命令能够正常工作。已经安装好了？请转到[快速入门](/zh-Hans/guide/quick-start)。

发布的包仅支持 ESM。在 Node.js 或您的打包工具中使用 `import` 或 `import()`；请勿使用 `require('ai-i18n-tools')`。该包声明了 `engines.node` `>=22.16.0`；不支持旧版 Node.js。npm tarball 包含 `docs/ai-i18n-tools-context.md` 处的消费者上下文和完整的 `skills/` 树，而非完整的文档网站；`translated-docs/` 下的特定语言环境副本位于 [GitHub 仓库](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) 中。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

<a id="standalone-executables"></a>
### 独立可执行文件

GitHub Releases 附带一个 Node.js 单可执行文件构建。Python 项目可直接从该二进制文件运行 CLI，包括 `extract`、`translate-ui` 和 `suggest-models`，无需安装 Node.js。

Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安装程序会检测系统、下载匹配的可执行文件、检查 `SHA256SUMS.txt`、将命令安装为 `ai-i18n-tools`（在 Windows 上为 `ai-i18n-tools.exe`），并将安装目录添加到 `PATH`。默认目录是 `~/.local/bin`。如果仍然找不到该命令，请打开一个新的终端。设置 `AI_I18N_VERSION`（例如 `v1.11.0`）以固定某个版本，或设置 `AI_I18N_INSTALL_DIR` 以选择其他目录。

这些二进制文件未经公证或 Authenticode 签名。macOS 可能会要求您批准未签名的程序。Windows SmartScreen 可能会显示警告。macOS 安装程序在校验和匹配后会清除隔离标志。

每个版本还附带 `SHA256SUMS.txt` 和 `ai-i18n-tools-python-examples.zip`（四个 Python 示例）。从添加该内容的版本开始，同一页面包含 `ai-i18n-tools-skill.zip`，即每个编码代理技能目录。在该 zip 文件发布之前的版本不包含它，并且第一个 zip 文件仅包含 `ai-i18n-tools/`。`install.sh` 和 `install.ps1` 保留在仓库根目录中，上述命令将从那里下载它们。npm tarball 和可执行文件不包含 Python 示例或技能 zip 文件。示例保留在仓库中。技能目录在 npm tarball 中。请参阅 [编码代理技能](/zh-Hans/guide/coding-agent-skill#download-the-skill-directory)。

<details>
<summary>手动安装 <code>ai-i18n-tools</code> 可执行文件的说明</summary>

| 平台 | 资源 |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

1. 从 [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases) 页面下载与您的计算机匹配的资产以及 `SHA256SUMS.txt`。
2. 检查校验和。在 Linux 上，运行 `grep ' ai-i18n-tools-linux-x64$' SHA256SUMS.txt | sha256sum -c -`（使用您下载的资产名称）。在 macOS 上，运行与 Linux 相同的命令，但使用 `shasum -a 256 -c -`。在 Windows 上，运行 `(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe).Hash` 并将其与 `SHA256SUMS.txt` 中的哈希值进行比较。
3. 将下载的文件重命名为 `ai-i18n-tools`，并将其所在目录添加到 `PATH`。

Linux 和 macOS，以 Linux x64 资产为例（请替换为您下载的资产）：

```bash
mkdir -p "$HOME/.local/bin"
mv ai-i18n-tools-linux-x64 "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

如果 `$HOME/.local/bin` 尚未在 `PATH` 中，请将以下内容添加到您的 shell 配置文件（`.bashrc`、`.bash_profile`、`.profile` 或 `.zshrc`）并打开一个新的终端：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell)，将 `ai-i18n-tools-win-x64.exe` 重命名为 `ai-i18n-tools.exe`：

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

打开一个新的终端并运行 `ai-i18n-tools --version`。在所有平台上，命令名称都是 `ai-i18n-tools`。

</details>

为活动提供商设置 API 密钥的方法与 npm 安装相同（见下文）。然后：

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools sync
```

仅将 `init` 用于新配置：它会覆盖选定的配置文件。对于现有项目，请改为编辑配置。`sync` 处理所有已配置/已启用的翻译管道，包括 UI 提取。

演练：[为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)。命令参考：[suggest-models](/zh-Hans/reference/cli-commands/models#suggest-models)。

<a id="set-the-api-key"></a>
### 设置 API 密钥

翻译命令（`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`）需要在 `ai-i18n-tools.config.json` 中进行提供商配置，并为活动提供商提供 API 密钥。运行 `ai-i18n-tools init -P <provider>` 来搭建该预设。提供商预设和 API 密钥：[LLM 提供商](/zh-Hans/guide/providers-and-models)。`init` 中的模型列表是一个起点。请从 [AI 模型](/zh-Hans/guide/ai-models) 中选择模型，并使用 `suggest-models` 或仪表板的 **模型** 选项卡来替换它。Ollama 是唯一一个不需要 API 密钥的内置预设。

设置与您传递给 `init` 的提供商相匹配的密钥（请参阅[预设表](/zh-Hans/guide/providers-and-models#built-in-providers))：

```bash
# init -P openrouter
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# init -P openai
# export OPENAI_API_KEY=sk-your-key-here
```

或在项目根目录中创建一个 `.env` 文件：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="using-the-cli"></a>
### 使用 CLI

将 `ai-i18n-tools` 作为项目的依赖项或开发依赖项安装（请参阅本页顶部）。如果应用程序代码导入 `ai-i18n-tools/runtime`，请确保它在生产运行时/构建环境中可用；全局 CLI 或独立二进制文件无法满足该导入。该包声明了一个 `bin` 入口，您的包管理器会将其链接到 `node_modules/.bin/ai-i18n-tools`。该 shim（已安装包内的 `bin/ai-i18n-tools.mjs`）会加载编译后的 CLI。

要在交互式 shell 中输入不带前缀的 `ai-i18n-tools` 命令，请配置以下选项之一。如果不进行设置，即使在本地安装后，shell 也无法找到该二进制文件。

direnv — 添加到项目根目录下的 `.envrc` 文件中（bash/zsh；请参阅 [direnv.net](https://direnv.net/))：

```bash
PATH_add node_modules/.bin
```

执行 `direnv allow` 后，只要您 `cd` 进入该项目，就可以使用不带前缀的命令。

手动设置 PATH — 从项目根目录（包含 `node_modules/.bin` 的目录）运行这些命令。只要您保留该 `PATH` 条目，子目录之后仍可正常工作；从嵌套文件夹重新运行 export 会失败，因为 `$PWD` 不再指向项目根目录。

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

全局安装 — 只需安装一次 CLI，即可从任何目录调用它：

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

使用 pnpm 时，如果缺少全局命令，请在每台机器上运行一次 `pnpm setup`（并打开一个新的 shell）— pnpm 需要将其全局 bin 目录放在 `PATH` 上。全局安装会使用全局固定的版本。对于按项目固定版本，建议使用 direnv 或手动 PATH，以便 `node_modules/.bin` 解析到项目的依赖项。

package.json 脚本 — 当 npm 或 pnpm 运行脚本时，它会将 `node_modules/.bin` 添加到 `PATH` 的开头，因此，无需更改 shell PATH，基本命令名称即可在脚本中正常工作：

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

然后运行（例如 `pnpm run i18n:sync`）。如需查看完整的推荐设置，请参阅 [推荐的 package.json 脚本](/zh-Hans/guide/quick-start#recommended-packagejson-scripts) 。

替代方案 — 如果您不想调整 `PATH`：`npx ai-i18n-tools …` (npm) 或 `pnpm exec ai-i18n-tools …` (pnpm)。对于无需安装、一次性运行且没有 `package.json` 条目的情况：`npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`。

<a id="coding-agent-skill"></a>
### 编码代理技能

安装 npm 包或独立可执行文件不会将技能注册到代理。安装方法、本机目录以及没有技能文件夹的代理，请参阅 [编码代理技能](/zh-Hans/guide/coding-agent-skill)。

获取所有技能目录，每个目录都是一个包含 `SKILL.md` 的文件夹，无需克隆此仓库：

1. Node.js 22.20 或更高版本：`npx skills add wsj-br/ai-i18n-tools --all -y` 会将这些目录安装到代理的技能文件夹中。
2. 包已安装：将 `node_modules/ai-i18n-tools/skills/.` 复制到该文件夹中。
3. 没有 Node.js：从 `ai-i18n-tools --version` 中的版本的 npm tarball 中提取 `package/skills/`。从添加该内容的版本开始，该 GitHub Release 上的 `ai-i18n-tools-skill.zip` 包含相同的目录。在该 zip 文件发布之前的版本不包含它。第一个 zip 文件仅包含 `ai-i18n-tools/`。

命令和代理文件夹请参阅 [编码代理技能](/zh-Hans/guide/coding-agent-skill#download-the-skill-directory)。

<a id="cloned-monorepo"></a>
### 克隆的 monorepo

在从 [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 的完整克隆中开发软件包或运行工作区示例时：

- 工作区示例（`examples/console-app`、`examples/nextjs-app` 以及 [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 中列出的其他软件包）— 在仓库根目录运行 `pnpm install`，然后运行 `cd examples/<name>`。使用示例的 `pnpm run i18n:*` 脚本，或配置 PATH（请参阅 [使用 CLI](#using-the-cli)）并直接运行 `ai-i18n-tools …`。工作区 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 会将 `ai-i18n-tools` 链接到您的本地检出。
- 仓库根目录 — pnpm 不会将根软件包自己的 `bin` 链接到 `node_modules/.bin` 中。此检出的 `.envrc` 会将 `bin/` 添加到 `PATH` 中，因此，在 `direnv allow` 之后，已提交的 `bin/ai-i18n-tools` 包装器（位于已发布的 `bin/ai-i18n-tools.mjs` 填充程序旁边）会提供裸命令。如果没有 direnv，请使用 `node bin/ai-i18n-tools.mjs …`、`./bin/ai-i18n-tools …` 或根目录的 `pnpm i18n:*` 脚本（或 shell 别名 / `pnpm add -g .`）。
- 独立测试固件（`multi-provider`、`test-markdown`）— 在固件文件夹中，使用 `node ../../bin/ai-i18n-tools.mjs …`。

更改 CLI 源码后，在仓库根目录运行 `pnpm run build`。有关构建步骤和可选的全局安装变通方案，请参阅[开发指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)。

在 Linux、macOS 和 WSL 上，注册表安装会自动为 CLI 脚本设置可执行位。在 Windows 上，包管理器会生成 `.cmd` 和 `.ps1` 包装器，它们会显式调用 Node。

下一步：[快速入门](/zh-Hans/guide/quick-start) 。
