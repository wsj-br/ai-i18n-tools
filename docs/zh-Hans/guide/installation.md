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

**`package.json` 脚本（推荐）** — 当 npm 或 pnpm 运行脚本时，它会将 `node_modules/.bin` 添加到 `PATH` 的前面，因此像 `pnpm run i18n:sync` 这样的命令会调用 `ai-i18n-tools`，而无需 `npx` 或 `pnpm exec` 前缀：

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

**交互式 shell** — 从您的项目根目录，在本地安装后：

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
yarn ai-i18n-tools sync       # yarn (Berry: yarn dlx ai-i18n-tools … for one-off)
```

**裸** `ai-i18n-tools` **在终端中** — 要在交互式 shell 中直接键入命令名称，请将本地 bin 目录添加到 `PATH` 的前面：

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

使用 [**direnv**](https://direnv.net/)，将 `PATH_add node_modules/.bin` 添加到项目根目录中的 `.envrc`，以便在 `cd` 进入项目后可以使用裸命令。在不调整 `PATH` 的情况下，继续使用 `npx ai-i18n-tools …` 或 `pnpm exec ai-i18n-tools …`。

**零安装一次性使用** — `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（为该次调用下载包；`package.json` 中没有条目）。

在 Linux、macOS 和 WSL 上，注册表安装会自动为 CLI 脚本设置可执行位。在 Windows 上，包管理器会生成 `.cmd` 和 `.ps1` 包装器，它们会显式调用 Node。

设置您的提供商 API 密钥（此处显示 OpenRouter；请使用与您的活动提供商匹配的环境变量 — 请参阅[预设表](/zh-Hans/guide/providers-and-models#built-in-providers)）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

或在项目根目录中创建一个 `.env` 文件：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### 工具 UI 语言

CLI 会独立于你翻译的区域设置，对其自身的帮助文本、日志摘要和翻译仪表板进行本地化。默认情况下，它遵循你的操作系统区域设置。在配置中使用 `-L pt-BR`、`export AI_I18N_LANG=es` 或 `"uiLanguage"` 进行覆盖。请参阅[工具界面语言](/zh-Hans/guide/tool-ui-language)。
