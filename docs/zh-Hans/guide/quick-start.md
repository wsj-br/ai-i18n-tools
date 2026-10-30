<a id="quick-start"></a>
# 快速入门

本页指导单语言项目生成其首批翻译文件。它适用于 JS/TS 应用、Python 应用、网站或文档站点，或仓库的 README 文件及其他 Markdown 文件。本指南假定：

- 已安装 Node.js `>=22.16.0`，或者对于 Python 项目，已安装[独立可执行文件](/zh-Hans/guide/installation#standalone-executables)。
- 拥有一个 LLM 提供商的 API 密钥，或在本地安装了 Ollama。
- 项目已纳入版本控制，以便您可以审查工具写入的内容。

不同项目之间有两个差异：工具如何找到您的文本，以及您的应用如何加载结果。下方的[选择您的路径](#pick-your-path)部分会将您引导至相应的指南。

<a id="runnable-examples"></a>
## 可运行示例

想先看看已完成的项目吗？无需克隆仓库即可复制一个：

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync
```

将 `console-app` 替换为任何其他 Node.js 示例。Python 示例没有 `package.json`；您可以按同样的方式复制它们，或从 GitHub Release 下载 `ai-i18n-tools-python-examples.zip`。完整的列表以及每个示例的展示内容，请参见[示例](/zh-Hans/examples)页面。

<a id="install"></a>
## 安装

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` 和 `yarn add --dev ai-i18n-tools` 也可以。Python 项目安装独立可执行文件，无需 Node.js。Linux 和 macOS：`curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`。Windows PowerShell：`irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`。其他安装选项：[安装](/zh-Hans/guide/installation)。

<a id="provider-and-api-key"></a>
## 提供商和 API 密钥

每个调用 LLM 的命令（`translate-ui`、`translate-docs`、`translate-json`、`translate-svg` 和 `sync`）都需要以下两项：

1. 在 `ai-i18n-tools.config.json` 中至少有一个提供商：一个带有 `translationModels` 的 `providers.<name>` 块，以及在配置了多个提供商时的顶层 `provider` 键。`init -P <provider>` 会搭建该预设。要添加提供商，请参阅 [LLM 提供商](/zh-Hans/guide/providers-and-models)。要选择模型列表，请参阅 [AI 模型](/zh-Hans/guide/ai-models)。
2. 在您的环境中或项目根目录下的 `.env` 文件中提供匹配的 API 密钥。每个内置预设都会从 [预设表](/zh-Hans/guide/providers-and-models#built-in-providers) 中读取一个命名变量，例如 `OPENROUTER_API_KEY` 与 `-P openrouter` 或 `OPENAI_API_KEY` 与 `-P openai`。Ollama 使用本地端点，不需要密钥。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

`extract`、`status` 以及其他不调用 LLM 的命令则两者都不需要。有关环境文件和 PATH 的更多信息：[安装](/zh-Hans/guide/installation#using-the-cli)。

<a id="pick-your-path"></a>
## 选择您的路径

找到您拥有的项目类型，运行其对应块中的命令，然后继续阅读链接的指南。

<a id="a-jsts-app"></a>
### JS/TS 应用

您的按钮和消息在源代码中仍然是纯文本，因此工具目前还找不到任何内容。必须先将它们用 `t()` 包装起来，并且应用需要一个小的 i18next 配置文件。

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models --apply
```

然后遵循[向 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js)指南。该指南在介绍 `extract` 和 `translate-ui` 之前，会先介绍包装步骤，并提供一个代理提示。

<a id="a-python-app"></a>
### Python 应用

```bash
ai-i18n-tools init -t ui-python -P openrouter
ai-i18n-tools suggest-models --apply
```

然后按照 [将 i18n 添加到 Python 应用](/zh-Hans/guide/add-i18n-to-python)。

Django 应用、使用 Flask-Babel 目录的 Flask 应用，或已调用 `gettext` 的应用会保留这些调用。而是使用 `ui-python-django`、`ui-python-flask` 或 `ui-python-gettext` 进行脚手架搭建，然后按照 [将 i18n 添加到 Django / Python gettext 应用](/zh-Hans/guide/add-i18n-to-django-gettext)。

<a id="a-website-or-documentation-site"></a>
### 网站或文档站点

为您的框架选择模板：

| 您的站点 | 模板 |
| --- | --- |
| Astro Starlight | `ui-starlight` |
| Docusaurus | `ui-docusaurus` |
| VitePress | `ui-vitepress` |
| Nextra | `ui-nextra` |
| Fumadocs | `ui-fumadocs` |
| 纯 Astro 网站 | `ui-astro-website` |
| 纯 HTML 页面 | `ui-plain-html` 或 `docs-plain-html` |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

然后按照 [将 i18n 添加到网站或文档站点](/zh-Hans/guide/add-i18n-to-website)。它的代理提示会启用框架的 i18n 路由。审阅该工作后，运行 `sync`。

<a id="a-readme-or-markdown-docs"></a>
### README 或 Markdown 文档

大多数仓库希望将其与应用程序放在一起：默认的 `ui-markdown` 模板已包含一个扁平的 README 块。对于任何其他模板，请添加 `--with-readme`。一个只有 Markdown 的仓库使用 `docs-markdown`。

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
ai-i18n-tools init -t docs-markdown -P openrouter
```

然后，请遵循 [为您的 README 和 Markdown 文档添加 i18n](/zh-Hans/guide/add-i18n-to-readme) 的步骤。将语言列表标记粘贴到 `README.md` 中，置于 `sync` 之前。如果您有应用程序，其路径仍然是 [为 JS/TS 应用添加 i18n](/zh-Hans/guide/add-i18n-to-js) 或 [为 Python 应用添加 i18n](/zh-Hans/guide/add-i18n-to-python)。

<a id="something-else"></a>
### 其他情况

- 保持原样的嵌套 i18next JSON：`ai-i18n-tools init -t ui-json-bundles -P openrouter`，然后 [JSON](/zh-Hans/guide/json)。
- 带有文本标签的 SVG 图表：[SVG 翻译](/zh-Hans/guide/svg-translation/)。
- 从 Intlayer 迁移：[从 Intlayer 迁移](/zh-Hans/guide/migrating-from-intlayer)。
- 保留 Intlayer 并仅填充其翻译：[就地翻译 Intlayer](/zh-Hans/guide/translating-intlayer)。

包含所有 `init` 选项的完整模板列表位于 [CLI 设置参考](/zh-Hans/reference/cli-commands/setup) 中。

<a id="run-and-check"></a>
## 运行和检查

当您的项目准备就绪时：

```bash
ai-i18n-tools doctor
ai-i18n-tools sync
ai-i18n-tools status
```

`doctor` 会检查配置、路径、提供程序和环境是否已准备就绪。除非您传递 `--local`，否则它还会验证提供程序中的模型 ID。`sync` 会按顺序运行配置启用的每个步骤。`status` 会显示每个区域设置中已翻译的内容。如果工具无法在项目中看到文本，则首次运行会无错误完成，但不会写入任何有用的内容，因此如果 `status` 未显示任何字符串，请返回到您路径的指南。

`suggest-models` 根据已发布的基准测试对活动提供商的聊天模型进行排名。`suggest-models --apply` 会替换 `translationModels`，但保留 `uiModels` 和 `localeModels` 不变。相同的排名位于仪表板的 **模型** 选项卡上。有关排名工作原理以及列表为何包含多个模型的信息，请参阅：[AI 模型](/zh-Hans/guide/ai-models)。命令参考：[suggest-models](/zh-Hans/reference/cli-commands/models#suggest-models)。

<a id="keep-it-translated"></a>
## 保持翻译更新

每当源文本发生更改时，请重新运行 `sync`。SQLite 缓存意味着只有新的或更改的文本会发送到模型，因此重新运行的成本很低。在 CI 中运行 `sync` 可以防止翻译出现偏差。`ai-i18n-tools dashboard` 会打开 [翻译仪表板](/zh-Hans/guide/translation-dashboard/) 以审查和编辑缓存的翻译。

<a id="recommended-packagejson-scripts"></a>
### 推荐的 package.json 脚本

在本地安装该软件包后，脚本会从 `node_modules/.bin` 解析 `ai-i18n-tools`，无需额外的 shell 设置。对于交互式 shell，请先配置 PATH：请参阅[使用 CLI](/zh-Hans/guide/installation#using-the-cli)。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

首选 `sync`，而不是链接各个翻译脚本。仅当需要单独执行一个步骤时，才使用单步脚本。

要以其他语言显示 CLI 输出和仪表板，请传递 `-L <code>` 或设置 `AI_I18N_LANG`：请参阅 [工具 UI 语言](/zh-Hans/guide/tool-ui-language)。

<a id="combined-sync"></a>

要翻译多种内容，例如同时翻译应用字符串和文档网站？请参阅[合并管道](/zh-Hans/guide/combining-pipelines)。

下一步：请参阅[选择您的路径](#pick-your-path)中适合您的指南。
