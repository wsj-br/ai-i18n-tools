<a id="installation"></a>
# 安装

发布的包是 **仅 ESM**。在 Node.js 或打包器中使用 `import`/`import()`；不要使用 `require('ai-i18n-tools')`。该包声明了 `engines.node` `>=22.16.0`；不支持旧版 Node.js。npm tarball 仅在 `docs/` 下包含英文文件；`translated-docs/` 下的特定区域设置副本位于 [GitHub 仓库](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) 中。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools 包含自己的字符串提取器。如果您之前使用了 `i18next-scanner`、`babel-plugin-i18next-extract` 或类似的工具，可以在迁移后移除这些开发依赖项。

<a id="using-the-cli"></a>
### 使用 CLI

在您的项目中将 `ai-i18n-tools` 作为依赖项或开发依赖项安装（请参阅上面的[安装](#installation)）。该软件包声明了一个 `bin` 条目，您的包管理器会将其链接到 `node_modules/.bin/ai-i18n-tools`。该垫片（已安装软件包中的 `bin/ai-i18n-tools.mjs`）加载已编译的 CLI。

要在交互式 shell 中输入不带前缀的 `ai-i18n-tools` 命令，请配置以下选项之一。如果不进行设置，即使在本地安装后，shell 也无法找到该二进制文件。

**direnv** — 在项目根目录的 `.envrc` 中添加（bash/zsh；参见 [direnv.net](https://direnv.net/)）：

```bash
PATH_add node_modules/.bin
```

执行 `direnv allow` 后，只要您 `cd` 进入该项目，就可以使用不带前缀的命令。

**手动配置 PATH** — 在交互式 shell 中从项目根目录执行：

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

**全局安装** — 安装一次 CLI，即可从任何目录调用它：

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

全局安装使用全局固定的版本。若要按项目固定版本，建议使用 direnv 或手动配置 PATH，以便 `node_modules/.bin` 解析到项目的依赖项。

**`package.json` 脚本** — 当 npm 或 pnpm 运行脚本时，它会将 `node_modules/.bin` 前置到 `PATH`，因此在脚本中可以直接使用裸命令名，无需更改 shell 的 PATH。优先使用 `sync` 而非手动串联翻译步骤 — 手动运行时顺序和功能标志很容易出错：

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

然后运行例如 `pnpm run i18n:sync`。请参阅[推荐的 `package.json` 脚本](/zh-Hans/guide/quick-start#recommended-packagejson-scripts)以获取完整的推荐集合。

**替代方案** — 如果您不想调整 `PATH`：`npx ai-i18n-tools …` (npm) 或 `pnpm exec ai-i18n-tools …` (pnpm)。对于没有 `package.json` 条目且无需安装的一次性运行：`npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`。

<a id="cloned-ai-i18n-tools-monorepo"></a>
### 已克隆的 ai-i18n-tools monorepo

在开发该包或从 [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 的完整克隆中运行工作区 **示例** 时：

- **工作区示例**（`examples/console-app`、`examples/nextjs-app` 以及 [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 中列出的其他包）——在仓库根目录运行 `pnpm install`，然后运行 `cd examples/<name>`。使用示例的 `pnpm run i18n:*` 脚本，或者配置 PATH（参见[使用 CLI](#using-the-cli)）并直接运行 `ai-i18n-tools …`。将工作区 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 链接 `ai-i18n-tools` 到你的本地检出目录。
- **仓库根目录** —— pnpm 不会将根包自身的 `bin` 链接到 `node_modules/.bin` 中。请改用 `node bin/ai-i18n-tools.mjs …` 或根目录的 `pnpm i18n:*` 脚本（或者使用 shell 别名 / `pnpm add -g .` —— 参见[开发指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)）。
- **独立夹具**（`multi-provider`、`test-markdown`）——在夹具文件夹中，使用 `node ../../bin/ai-i18n-tools.mjs …`。

更改 CLI 源码后，在仓库根目录运行 `pnpm run build`。有关构建步骤和可选的全局安装变通方案，请参阅[开发指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)。

在 Linux、macOS 和 WSL 上，注册表安装会自动为 CLI 脚本设置可执行位。在 Windows 上，包管理器会生成 `.cmd` 和 `.ps1` 包装器，它们会显式调用 Node。

翻译命令（`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`）需要在 `ai-i18n-tools.config.json` 中进行 **提供商配置**，并为当前活动的提供商提供 **一个 API 密钥**。运行 `ai-i18n-tools init [-P <provider>]` 来生成默认的提供商块（省略时为 `openrouter`）；编辑 `provider` / `providers` 以切换预设或模型 —— 参见 [LLM 提供商和模型](/zh-Hans/guide/providers-and-models)。Ollama 是唯一不需要 API 密钥的内置预设。

设置与你的当前活动提供商相匹配的 API 密钥（参见[预设表](/zh-Hans/guide/providers-and-models#built-in-providers)）：

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

或在项目根目录中创建一个 `.env` 文件：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### 工具 UI 语言

CLI 会独立于你翻译的区域设置，对其自身的帮助文本、日志摘要和翻译仪表板进行本地化。默认情况下，它遵循你的操作系统区域设置。在配置中使用 `-L pt-BR`、`export AI_I18N_LANG=es` 或 `"uiLanguage"` 进行覆盖。请参阅[工具界面语言](/zh-Hans/guide/tool-ui-language)。
