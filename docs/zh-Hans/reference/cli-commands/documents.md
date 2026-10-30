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

需要至少一个 `docs[]` 块。收集每个块的 `contentPaths` 下的 `.md` / `.mdx`（遵循 `.translate-ignore`）。默认情况下，在每个扁平的 ATX `#` 标题之前立即插入一个 HTML 锚点行 `<a id="slug"></a>`（跳过围栏代码块内的标题）。任何形式的现有标题 ID（HTML 锚点行、经典 `{#id}` 后缀、MDX `{/* #id */}` 注释）都将替换为所选样式；slug 始终从当前标题文本派生。当多个 HTML 锚点堆叠在一个标题上方时，只保留当前标题文本的锚点，并且指向已删除 ID 的仓库内 Markdown 链接将更新为保留的 ID。不直接位于标题上方的 `<a id>` 将保留在原位。使用 `--slug-style mdx-comment`，改为在标题行上写入 Docusaurus MDX 注释后缀（与 GitHub 风格的 slug 算法相同），并在存在时删除前面的 HTML 锚点块。`--remove` 会剥离所有这些标题 ID 形式，并且不写入任何内容来代替它们。

更新源文件后，该命令还会遍历每个语言区域现有的已翻译标记文档（`docsOutput` 路径映射与 `translate-docs` 相同）。它会按文档顺序将 **源语言区域** 标题标识符复制到匹配的井号式标题上——它绝不会根据已翻译标题生成别名——并将标题中间的 `{#id}` / `{/* #id */}`（或零散的超文本标记语言 `<a id>`）移回 Docusaurus / 所选样式期望的形式。源语言是 `sourceLocale`，可以是任何语言。缺失的已翻译文件会被跳过。`--remove` 也会从这些已翻译文件中移除标题标识符，包括放错位置的行中间标记。

当已翻译文件的标题 ID 被重新定位或修复时，如果源内容以及新旧翻译内容具有相同数量的片段，则匹配的缓存翻译片段（以源片段哈希为键）也会被更新。如果数量不匹配，则会跳过该文件和区域设置。稍后的 `sync --force-update` 会从更新后的缓存行中重新组装该文件。

**关键选项：** `-p` / `--path`、`-f` / `--file`、`--slug-style`、`--remove`、`--dry-run`

`--slug-style`：`github`（默认；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`、`mdx-comment`（Docusaurus `{/* #… */}` 后缀）。使用 `pymdown`，可选 `--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--remove` 不能与 `--pymdown-*` 组合使用。

**另请参阅：** [锚点链接](/zh-Hans/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**概要：** `ai-i18n-tools check-markdown [options]`

扫描每个 `docs[]` 块下 `contentPaths` 中的 markdown/MDX（发现方式与 `translate-docs` 相同，遵循 `.translate-ignore`）：分隔符配对、未闭合的行内代码，以及当 `**`/`__` 包裹 `[text](url)` 链接时的 `STRONG_OUTSIDE_LINK`。

将 `relativePath:line: [ISSUE_CODE] message` 行打印到 stderr；如果发现任何问题，则以代码 **1** 退出。`--json`：在 stdout 上输出 JSON 报告。除非 `--no-cache`，否则将 `markdown_source_issues` 写入 `cacheDir`。`-v` 将源哈希添加到 stderr 行。

**主要选项：** `-p` / `--path`、`-f` / `--file`、`--json`、`--no-cache`

**另请参阅：** [Markdown 问题](/zh-Hans/guide/translation-dashboard/markdown-issues)
