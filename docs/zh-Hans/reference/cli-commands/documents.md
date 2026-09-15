<a id="cli--documents"></a>
# CLI — 文档

<a id="translate-docs"></a>
### `translate-docs`

**概要：** `ai-i18n-tools translate-docs [options]`

翻译 markdown、MDX、`.astro`、可选的 Docusaurus 目录 JSON（`docusaurusCatalogDir`）、可选的 Nextra `_meta.ts`/字典 `.ts`，以及每个 `docs` 块的可选 VitePress 主题目录。

**关键选项：** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `--check-cache`, `-p` / `-f`, `--dry-run`

`-j`：最大并行语言数；`-b`：每个文件的最大并行批量 API 调用数。`--prompt-format`：批量传输格式（`xml` | `json-array` | `json-object`）。

**另请参阅：** [缓存行为与 `translate-docs` 标志](/zh-Hans/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags)、[批量提示格式](/zh-Hans/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**概要：** `ai-i18n-tools write-heading-ids [options]`

至少需要一个 `docs[]` 块。在每个块的 `contentPaths` 下收集 `.md` / `.mdx`（遵循 `.translate-ignore`）。默认情况下，在每个扁平 ATX `#` 标题之前紧邻插入 HTML 锚点行 `<a id="slug"></a>`（跳过围栏代码块内的标题）。任何形式的现有标题 ID（HTML 锚点行、经典 `{#id}` 后缀、MDX `{/* #id */}` 注释）都会被替换为所选样式；slug 始终从当前标题文本派生。使用 `--slug-style mdx-comment` 时，改为在标题行上写入 Docusaurus MDX 注释后缀（使用相同的 github 风格 slug 算法），并在存在前置 HTML 锚点时将其移除。`--remove` 会移除所有这些标题 ID 形式，且不写入任何替代内容。

**关键选项：** `-p` / `--path`、`-f` / `--file`、`--slug-style`、`--remove`、`--dry-run`

`--slug-style`：`github`（默认；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`、`mdx-comment`（Docusaurus `{/* #… */}` 后缀）。使用 `pymdown`，可选 `--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--remove` 不能与 `--pymdown-*` 组合使用。

**另请参阅：** [锚点链接](/zh-Hans/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**概要：** `ai-i18n-tools check-markdown [options]`

扫描每个 `docs[]` 块下 `contentPaths` 中的 markdown/MDX（发现方式与 `translate-docs` 相同，遵循 `.translate-ignore`）：分隔符配对、未闭合的行内代码，以及当 `**`/`__` 包裹 `[text](url)` 链接时的 `STRONG_OUTSIDE_LINK`。

将 `relativePath:line: [ISSUE_CODE] message` 行打印到 stderr；如果存在任何问题，退出码为 **1**。`--json`：在 stdout 上输出 JSON 报告。除非 `--no-cache`，否则在 `cacheDir` 中写入 `markdown_source_issues`。`-v` 在 stderr 行中添加源哈希。

**主要选项：** `-p` / `--path`、`-f` / `--file`、`--json`、`--no-cache`

**另请参阅：** [Markdown 问题](/zh-Hans/guide/translation-dashboard/markdown-issues)
