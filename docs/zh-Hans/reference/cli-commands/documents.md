<a id="cli--documents"></a>
# CLI — 文档

<a id="translate-docs"></a>
### `translate-docs`

**概要：** `ai-i18n-tools translate-docs [options]`

翻译 markdown、MDX、`.astro`、可选的 Docusaurus 目录 JSON（`docusaurusCatalogDir`）、可选的 Nextra `_meta.ts`/字典 `.ts`，以及每个 `docs` 块的可选 VitePress 主题目录。

**主要选项：** `-l`、`-j`、`-b`、`--prompt-format`、`--force`、`--force-update`、`-p` / `-f`、`--dry-run`

`-j`：最大并行语言数；`-b`：每个文件的最大并行批量 API 调用数。`--prompt-format`：批量传输格式（`xml` | `json-array` | `json-object`）。

**另请参阅：** [缓存行为与 `translate-docs` 标志](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags)、[批量提示格式](/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**概要：** `ai-i18n-tools write-heading-ids [options]`

需要至少一个 `docs[]` 块。在每个块的 `contentPaths` 下收集 `.md` / `.mdx`（遵循 `.translate-ignore`）。在每个扁平 ATX `#` 标题前立即插入 HTML 锚点行 `<a id="slug"></a>`（跳过 fenced 代码块内的标题）；当锚点行已存在时，如果其与从当前标题文本派生的 slug 不再匹配，则更新 `id`。

**主要选项：** `-p` / `--path`、`-f` / `--file`、`--slug-style`、`--dry-run`

`--slug-style`：`github`（默认；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`。使用 `pymdown` 时，可选 `--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。

**另请参阅：** [锚点链接](/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**概要：** `ai-i18n-tools check-markdown [options]`

扫描每个 `docs[]` 块下 `contentPaths` 中的 markdown/MDX（发现方式与 `translate-docs` 相同，遵循 `.translate-ignore`）：分隔符配对、未闭合的行内代码，以及当 `**`/`__` 包裹 `[text](url)` 链接时的 `STRONG_OUTSIDE_LINK`。

将 `relativePath:line: [ISSUE_CODE] message` 行打印到 stderr；如果存在任何问题，退出码为 **1**。`--json`：在 stdout 上输出 JSON 报告。除非 `--no-cache`，否则在 `cacheDir` 中写入 `markdown_source_issues`。`-v` 在 stderr 行中添加源哈希。

**主要选项：** `-p` / `--path`、`-f` / `--file`、`--json`、`--no-cache`

**另请参阅：** [Markdown 问题](/guide/translation-dashboard/markdown-issues)
