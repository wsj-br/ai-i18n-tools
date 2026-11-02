<a id="cli--getting-started"></a>
# CLI — 快速入门

<a id="version"></a>
### `version`

**概要：** `ai-i18n-tools version`

打印 CLI 版本和构建时间戳（与根程序上的 `-V` / `--version` 信息相同）。

---

<a id="init"></a>
### `init`

**概要：** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

编写一个入门配置文件（包含 `provider` / `providers`、`concurrency`、`uiBatchConcurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 和 `docs[].addFrontmatter`）。调用 LLM 的翻译命令需要在环境中提供当前提供商的 API 密钥或 `.env`（Ollama 除外）——参见[提供商与 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key)。

**主要选项：** `-P` / `--provider`（必需），`-t` / `--template`，`-o` / `--output`，`--with-readme`，`--with-translate-ignore`

`-P` / `--provider` 是必需的。它用于选择要生成的 **内置预设**。必须是以下之一：`openrouter`、`openai`、`anthropic`、`gemini`、`deepseek`、`cerebras`、`groq`、`mistral`、`xai`、`nvidia`、`alibaba`、`apikeyfan`、`cheaperinference`、`ollama`。

**模板（`-t`）：**

| 值 | 脚手架 |
|-------|-----------|
| `ui-markdown` | UI 字符串和 README（扁平化输出，语言列表） |
| `ui-docusaurus` | Docusaurus UI + 文档 |
| `ui-starlight` | Starlight 文档 |
| `ui-vitepress` | VitePress 文档（`docsOutput.style: "vitepress"`）加上用于主题字符串的 `vitepressThemeCatalog` |
| `ui-nextra` | Nextra 文档（`docsOutput.style: "nextra"`）加上用于主题字典的 `nextraDictionaryPath`（侧边栏 `_meta.ts` 会自动收集） |
| `ui-fumadocs` | Fumadocs 文档（`docsOutput.style: "fumadocs"`）加上用于 UI 覆盖的 `fumadocsUiCatalog`（侧边栏 `meta.json` 会自动收集） |
| `ui-astro-website` | Astro 网站 UI 字符串 |
| `ui-plain-html` | 纯 HTML 目录（`data-i18n*` 标记，扁平化区域设置 JSON） |
| `docs-plain-html` | 纯 HTML 文档（每个区域设置一个文件，语言列表，hreflang） |
| `docs-markdown` | Markdown 文档：README 和 `.md` 文件，扁平化输出，语言列表 |
| `ui-json-bundles` | JSON（仅 `json[]`） |
| `ui-python` | Python UI 字符串、以源语言字符串为键的扁平化 JSON 和 `i18n.py` |
| `ui-python-gettext` | 带有扁平化 JSON 和 GNU `.po` / `.mo` 的 Python UI 字符串，以及 `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}` 目录（`flatOutput: false`，域 `django`，无 `i18n.py`） |
| `ui-python-flask` | `translations/` 下的 Flask / Jinja 目录（`flatOutput: false`）以及 `i18n.py` |
| `ui-dotnet` | .NET UI 字符串，以源语言字符串为键的扁平 JSON，以及 `I18n.cs` |
| `ui-dotnet-resx` | 作为 `.resx` 附属程序集 (`flatOutput: false`) 的 .NET UI 字符串，以及 `I18nResx.cs` |

`--with-readme` 会附加一个 `README.md` 文档块（`outputDir` `translated-docs`、`docsOutput.style` `"flat"`、一个 `languageListBlock`），并将 `features.translateDocs` 设置为 true。如果文档块已列出 `README.md`（`ui-markdown` 和 `docs-markdown` 就是这种情况），则它不执行任何操作。它只写入配置。它会打印标记行以粘贴到 `README.md` 中，并在该文件缺失时发出警告。指南：[将 i18n 添加到您的 README 和 Markdown 文档](/zh-Hans/guide/add-i18n-to-readme)。

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` 会创建一个启动器 `.translate-ignore`（包括 Python 虚拟环境和缓存目录）。

`init` 也会在工作目录中创建 `.gitignore`，或向其追加内容。添加的行是 `.translation-cache/*`、`!.translation-cache/cache.db`、`benchmark-scores.json`、`.env`、`.env.local`、`.env.*.local`、`*.tmp` 和 `*.backup.*`，每行都带有一条简短注释。已存在的行保持不变，第二次运行不会重复添加这些行。

当文件缺失时，`ui-python`、`ui-python-gettext` 和 `ui-python-flask` 也会写入 `i18n.py`。Django 项目保留 Django 自己的 gettext 运行时，因此 `ui-python-django` 不会写入 `i18n.py`。当文件缺失时，`ui-dotnet` 会写入 `I18n.cs`，并打印要添加到 `.csproj` 的 `EmbeddedResource` 项。`ui-dotnet-resx` 转而写入 `I18nResx.cs`，并将 `ui.resx` 指向 `Resources/SharedResource.<culture>.resx`。`--namespace` 覆盖 C# 命名空间。指南：[.NET 应用程序](/zh-Hans/guide/ui-strings/dotnet) 和 [将 i18n 添加到 .NET ResourceManager 应用程序](/zh-Hans/guide/add-i18n-to-dotnet-resourcemanager)。

`migrate-python-i18n` 重写不安全的预评估调用 (`_(f"...")`、`_("..." % expr)`、`_("...".format(...))`)，将其转换为查找前格式化调用。默认情况下是空运行。传递 `--write` 以编辑文件，并阅读 `migrate-python-i18n-report.md` 以获取审阅说明。当复杂表达式稳定时，其名称取自该表达式 (`start.isoformat()` 变为 `{start}`，`len(rows)` 变为 `{rows_count}`)。剩余的 `{value_1}` 会被报告，以便可以对其进行重命名。生成的 `i18n.py` 文件会被跳过。整洁的报告并不意味着未包装的 f-string 已被覆盖。

`migrate-dotnet-i18n` 对 `T()` 内部的 `T($"...")`、连接和 `string.Format` 也做同样的处理。`--wrap` 还会标记未标记的 XAML 标签和高置信度 C# 接收器；如果没有 `--write`，则这是一次审计。报告为 `migrate-dotnet-i18n-report.md`。生成的 `I18n.cs` 和 `I18nResx.cs` 将被跳过。指南：[.NET 应用程序](/zh-Hans/guide/ui-strings/dotnet#rewrite-unsafe-calls)。

---

<a id="doctor"></a>
### `doctor`

**概述:** `ai-i18n-tools doctor [--local] [--strict] [--json]`

检查项目是否已准备好进行翻译。该报告涵盖配置语法和架构、业务规则、已安装版本、源路径和输出路径、UI 目录文件、这些目录中的占位符不匹配项、缓存统计信息、已配置的提供程序、已设置的受支持环境变量以及模型 ID。包含已重命名、已删除或已重写占位符的目录会发出警告，并列举一个示例。

默认情况下，`doctor` 还会根据活动提供商的目录检查已配置的模型 ID，并将已安装版本与最新的 GitHub 版本进行比较。`--local` 会跳过这两个网络调用。如果有新版本，或者 GitHub 请求失败，则会发出警告。缺少或过期的模型 ID 会导致命令失败。在任何检查发出警告时，`--strict` 都会以错误退出。

API 密钥值永不打印。已设置的变量按字母顺序排列，作为 `Configured variables: NAME, ...`。非 API 密钥的变量会包含其值。

缺少输入路径会导致失败。缺少输出目录是一个提示，因为首次翻译运行时会创建它们。`doctor` 不会重写配置、创建目录或将源文本发送到模型。

当配置旁边的 `.gitignore` 缺少所需模式时，`doctor` 会发出警告。这两个缓存模式遵循配置的 `cacheDir`，因此 `.i18n-cache` 需要 `.i18n-cache/*` 和 `!.i18n-cache/cache.db`，而不是默认的 `.translation-cache` 行。其他模式是 `benchmark-scores.json`、`.env`、`.env.local`、`.env.*.local`、`*.tmp` 和 `*.backup.*`。忽略缓存目录本身的行（例如 `.i18n-cache/`）也会发出警告，因为 Git 不会跟踪被忽略目录下的 `cache.db`。此警告仅在使用 `--strict` 时会导致命令失败。

**主要选项:** `--local`、`--strict`、`--json`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
```

---

<a id="help"></a>
### `help`

**概要：** `ai-i18n-tools help [command]`

显示子命令的帮助信息（输出与 `ai-i18n-tools <command> --help` 相同）。
