<a id="cli-reference"></a>
# CLI 参考

对命令上的每个标志运行 `ai-i18n-tools <command> --help`。下方的分组页面提供了上下文、关键选项以及指向主题指南的链接。

<a id="command-overview"></a>
## 命令概览

<a id="setupsetup"></a>
### [设置](setup)

| 命令 | 摘要 |
|---------|---------|
| [`version`](setup#version) | 打印 CLI 版本和构建时间戳。 |
| [`init`](setup#init) | 编写初始配置；`-t` 选择脚手架模板。 |

<a id="models--catalogmodels"></a>
### [模型与目录](models)

| 命令 | 摘要 |
|---------|---------|
| [`check-models`](models#check-models) | 根据当前提供程序验证已配置的模型 ID。 |
| [`list-models`](models#list-models) | 列出当前提供程序公布的模型。 |
| [`bench-models`](models#bench-models) | 在一个翻译样本上对已配置的模型进行基准测试。 |
| [`list-languages`](models#list-languages) | 列出内置的 UI 语言目录。 |

<a id="ui-stringsui-strings"></a>
### [界面字符串](ui-strings)

| 命令 | 摘要 |
|---------|---------|
| [`extract`](ui-strings#extract) | 从源文本字面量和 HTML 标记更新 `strings.json`。 |
| [`mark-html`](ui-strings#mark-html) | 将 `data-i18n*` 标记插入 HTML 文件。 |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | 根据配置的区域设置写入 `ui-languages.json`。 |
| [`translate-ui`](ui-strings#translate-ui) | 翻译 UI 字符串（`strings.json` → 区域设置 JSON）。 |
| [`sync-ui`](ui-strings#sync-ui) | 提取，然后翻译 UI 字符串。 |
| [`proofread-ui`](ui-strings#proofread-ui) | 提取，然后由 LLM 审查源区域设置的 UI 字符串。 |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | 将 `strings.json` 导出为 XLIFF 2.0。 |

<a id="documentsdocuments"></a>
### [文档](documents)

| 命令 | 摘要 |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | 翻译 markdown、MDX、`.astro` 和框架目录。 |
| [`write-heading-ids`](documents#write-heading-ids) | 在 ATX 标题前插入 HTML 锚点行。 |
| [`check-markdown`](documents#check-markdown) | 扫描 markdown/MDX 以查找分隔符和强调标记问题。 |

<a id="other-contentcontent"></a>
### [其他内容](content)

| 命令 | 摘要 |
|---------|---------|
| [`translate-json`](content#translate-json) | 根据 `json[]` 配置块翻译嵌套 JSON。 |
| [`translate-svg`](content#translate-svg) | 翻译在 `config.svg` 中配置的 SVG 文件。 |

<a id="workflows--statusworkflows"></a>
### [工作流与状态](workflows)

| 命令 | 摘要 |
|---------|---------|
| [`sync`](workflows#sync) | 在一条流水线中运行提取 + UI + SVG + 文档 + JSON。 |
| [`status`](workflows#status) | 打印 UI、文档和 JSON 的翻译覆盖率。 |
| [`statistics`](workflows#statistics) | 打印缓存和 `strings.json` 统计信息。 |

<a id="cache--maintenancemaintenance"></a>
### [缓存与维护](maintenance)

| 命令 | 摘要 |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | 清理过期的缓存行并重新填充 markdown 问题。 |
| [`clean-temp`](maintenance#clean-temp) | 查找并删除 `*.log`、`*.tmp` 和缓存备份。 |
| [`purge-locale`](maintenance#purge-locale) | 移除指定区域设置的缓存行和生成的产物。 |

<a id="toolstools"></a>
### [工具](tools)

| 命令 | 摘要 |
|---------|---------|
| [`dashboard`](tools#dashboard) | 启动翻译仪表板 Web UI。 |
| [`glossary-generate`](tools#glossary-generate) | 写入一个空的 `glossary-user.csv` 模板。 |
| [`help`](tools#help) | 显示子命令的帮助信息。 |

<a id="synopsis"></a>
## 概要

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

<a id="root-and-global-options"></a>
### 根和全局选项

| 选项                       | 范围         | 描述                                                                                      |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | 根程序  | 输出版本号和构建时间戳（与 `version` 子命令相同的信息）。 |
| `-h` / `--help`              | 根程序  | 显示根程序或命令的帮助信息。      |
| `-c` / `--config <path>`     | 所有命令 | 配置文件路径（默认：`ai-i18n-tools.config.json`）。                                  |
| `-v` / `--verbose`           | 所有命令 | 详细日志记录。                                                                          |
| `-P` / `--provider <name>`   | 每个命令 | 此运行的活动 LLM 提供程序；覆盖配置 `provider` 键。必须在 `providers` 下进行配置。 |
| `-L` / `--ui-lang <code>`    | 每个命令 | 工具自身 UI（CLI 帮助、日志/摘要、仪表板）的语言；最高优先级来源。参见[工具 UI 语言](/guide/tool-ui-language)。 |
| `-w` / `--write-logs [path]` | 选定命令 | 将控制台输出复制到 `.log` 文件（默认路径：在根 `cacheDir` 下）。仅适用于 `translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync-ui`、`sync` 和 `cleanup`。 |

<a id="per-command-help"></a>
### 按命令查看帮助

| 用法                            | 描述                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | 该命令的所有选项。      |
| `ai-i18n-tools help <command>`   | 输出与 `<command> --help` 相同。 |

<a id="target-locales--l----locale"></a>
### 目标语言（`-l` / `--locale`）

| 命令 | 行为 |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync`、`sync-ui`、`export-ui-xliff` | `-l` / `--locale <codes>` — 逗号分隔的目标 BCP-47 代码（例如 `de,fr,pt-BR`）。如果省略，默认值来自配置（`json[]` 块也可以设置每个块的 `targetLocales`；UI 步骤使用 `targetLocales` 减去 `sourceLocale`）。 |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — 要审核的单个源语言（默认：配置 `sourceLocale`）。                                                            |
