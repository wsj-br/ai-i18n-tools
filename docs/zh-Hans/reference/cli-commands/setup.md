<a id="cli--setup"></a>
# CLI — 设置

<a id="version"></a>
### `version`

**概要：** `ai-i18n-tools version`

打印 CLI 版本和构建时间戳（与根程序上的 `-V` / `--version` 信息相同）。

---

<a id="init"></a>
### `init`

**概要：** `ai-i18n-tools init [-t <template>] [-o <path>] [-P <provider>] [--with-translate-ignore]`

编写一个入门配置文件（包含 `provider` / `providers`、`concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 和 `docs[].addFrontmatter`）。调用 LLM 的翻译命令需要在环境变量或 `.env` 中提供当前提供商的 API 密钥（Ollama 除外）——请参阅[提供商和 API 密钥](/zh-Hans/guide/quick-start#provider-and-api-key)。

**主要选项：** `-t` / `--template`, `-o` / `--output`, `-P` / `--provider`, `--with-translate-ignore`

`-P` / `--provider` 选择要搭建的**内置预设**（省略时为 `openrouter`）。必须是以下之一：`openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `ollama`。

**模板（`-t`）：**

| 值 | 脚手架 |
|-------|-----------|
| `ui-markdown` | Markdown UI 字符串工作流 |
| `ui-docusaurus` | Docusaurus UI + 文档 |
| `ui-starlight` | Starlight 文档 |
| `ui-vitepress` | VitePress 文档（`docsOutput.style: "vitepress"`）加上用于主题字符串的 `vitepressThemeCatalog` |
| `ui-nextra` | Nextra 文档（`docsOutput.style: "nextra"`）加上用于主题字典的 `nextraDictionaryPath`（侧边栏 `_meta.ts` 会自动收集） |
| `ui-fumadocs` | Fumadocs 文档（`docsOutput.style: "fumadocs"`）加上用于 UI 覆盖的 `fumadocsUiCatalog`（侧边栏 `meta.json` 会自动收集） |
| `ui-astro-website` | Astro 网站 UI 字符串 |
| `ui-json-bundles` | JSON（仅 `json[]`） |

`--with-translate-ignore` 创建一个初始 `.translate-ignore`。
