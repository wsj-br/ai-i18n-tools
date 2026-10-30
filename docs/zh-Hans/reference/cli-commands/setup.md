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

`-P` / `--provider` 是必填项。它选择用于搭建的**内置预设**。必须是以下之一：`openrouter`、`openai`、`anthropic`、`gemini`、`deepseek`、`cerebras`、`groq`、`mistral`、`xai`、`nvidia`、`alibaba`、`apifun`、`cheaperinference`、`ollama`。

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

`--with-readme` 会附加一个 `README.md` 文档块（`outputDir` `translated-docs`、`docsOutput.style` `"flat"`、一个 `languageListBlock`），并将 `features.translateDocs` 设置为 true。如果文档块已列出 `README.md`（`ui-markdown` 和 `docs-markdown` 就是这种情况），则它不执行任何操作。它只写入配置。它会打印标记行以粘贴到 `README.md` 中，并在该文件缺失时发出警告。指南：[将 i18n 添加到您的 README 和 Markdown 文档](/zh-Hans/guide/add-i18n-to-readme)。

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` 会创建一个启动器 `.translate-ignore`（包括 Python 虚拟环境和缓存目录）。

`ui-python`、`ui-python-gettext` 和 `ui-python-flask` 也会在文件缺失时写入 `i18n.py`。Django 项目保留了 Django 自身的 gettext 运行时，因此 `ui-python-django` 不会写入 `i18n.py`。

`migrate-python-i18n` 会将不安全的预求值调用（`_(f"...")`、`_("..." % expr)`、`_("...".format(...))`）重写为先查找后格式化的调用。默认执行试运行。传递 `--write` 以编辑文件，并阅读 `migrate-python-i18n-report.md` 以获取审查说明。生成的 `i18n.py` 文件将被跳过。

---

<a id="doctor"></a>
### `help`

**概要：** `ai-i18n-tools help [command]`

显示子命令的帮助信息（输出与 `ai-i18n-tools <command> --help` 相同）。
