<a id="translation-dashboard"></a>
# 翻译仪表板

运行：

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

默认监听端口是 **8675**。如果该端口不可用，服务器将尝试下一个端口（最多尝试 1000 次）并记录所选端口。已弃用的别名 `editor` 仍然可用，但会显示警告 — 请优先使用 `dashboard`。

这将启动一个由您配置的 `cacheDir` SQLite 数据库支持的本地 Web UI — 该数据库与 CLI 用于文档片段、日志和相关元数据的文件夹相同。它包含以下选项卡：**文档**（缓存的文档片段）、**UI 字符串**、**UI 复数**、**术语表**、**失败**、**Markdown 问题**和**统计信息**。

![Translation Dashboard](/translation-dashboard.png)

如果您在此应用中**编辑缓存行**（例如文档片段），请运行 `sync --force-update` 或等效的翻译命令并使用 `--force-update`，以便磁盘输出与缓存匹配；如果存储库中的**源文本**稍后发生更改，片段哈希值会改变，并且对旧文本的手动编辑将被覆盖。

<a id="failures-document-translation"></a>
### 失败（文档翻译）

**失败**选项卡仅用于**文档**翻译。它读取在某个片段无法成功翻译为特定语言时写入 SQLite 的失败记录 — 例如，模型输出为空或无效、翻译后验证错误（`AST mismatch`、占位符泄漏及类似的**质量**检查），或阻止进度的**致命**条件。它帮助您回答：*哪个源片段出错了，针对哪个语言和模型，以及记录了什么错误文本？*

<a id="when-to-use-it"></a>
#### 何时使用

- 在 `translate-docs` 或 `sync` 因错误、部分区域设置或日志混乱而结束之后，您可以对失败进行排序和过滤，而不仅仅是滚动终端输出。
- 当您想 **优先处理返工** 时：按 **失败次数** 排序，这样在重试中反复失败的片段就会排在前面；这些片段是 **简化或重新格式化** 源 markdown 的有力候选者，以便将来的运行能够成功。
- 当您需要 **精确的片段** — 文件路径、行号提示、源哈希和完整源文本 — 来编辑您存储库中的正确段落时。

<a id="why-source-edits-matter"></a>
#### 源文件编辑为何重要

密集的内联标记（**粗体**与 `` `code` `` 混合、嵌套强调、包含多个跨度的长句）会增加模型返回仍能通过结构检查的翻译的难度。**多次记录失败**的片段，通常通过**重写或拆分**源文件（或将示例移至代码块中）比在不变的文本上重新运行翻译更能获得改进。这与 [复杂的 Markdown 和失败的质量检查](#complex-markdown-and-failed-quality-checks) 一致。

<a id="how-to-use-the-tab"></a>
#### 如何使用该选项卡

1. 在仪表板中打开**失败**选项卡（与[翻译仪表板](#translation-dashboard)在同一浏览器会话中）。
2. 阅读**摘要**条（包含任何失败的片段，以及具有**1**、**2**或**3+** 次失败记录的片段计数）。
3. 按部分**文件名**、**语言**、**模型**、**质量错误**（值来自您的缓存）、**仅致命**以及可选的**源哈希值**、**源文本**或**错误消息**子字符串进行过滤 — 然后点击**应用**。
4. 选择**排序：# 失败次数**（默认）或**排序：文件路径 + 行号**。
5. 在表格的顶部或底部使用分页。**点击一行**可切换完整的源文本。行中的链接控件（启用时）会要求服务器进程将日志文件/行提示记录到 `ai-i18n-tools dashboard` 正在运行的**终端**中 — 这对于从浏览器跳转到编辑器非常有用。
6. 在项目中修复**源文件**，然后再次运行 `translate-docs` 或 `sync`。如果在成功运行后列表看起来**过时**，请运行 `ai-i18n-tools sync --force-update` 并重新加载仪表板（失败面板显示相同的提示）。

对于与 UI 并行的基于文件的调试，您仍然可以使用 `translate-docs --debug-failed` 在重试期间将 `FAILED-TRANSLATION` 详细信息写入 `cacheDir` — 请参阅 [缓存行为和 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags)。

<a id="markdown-issues-static-checks"></a>
### Markdown 问题（静态检查）

The **Markdown 问题**选项卡列出了来自 `markdown_source_issues` SQLite 表的行。每一行都是一个 **预翻译**发现：例如，在 `translate-docs` 用于遮蔽的相同 CommonMark 风格规则下，从未配对成强调/删除线的分隔符序列、一个用反引号打开但从未关闭的内联代码跨度，或者当 `**`/`__` 包裹 `[text](url)` 链接时（仅将粗体放在链接文本内）的 `STRONG_OUTSIDE_LINK`。这与 **失败**不同，**失败**记录了每个区域设置模型输出和翻译后验证问题（`AST mismatch`、占位符泄漏等）。

当您想在花费令牌之前修复**源 Markdown**时，请使用此选项卡 — 特别是当质量检查在结构上反复失败时。按文件路径（与缓存键的部分匹配，包括 `doc-block:{index}:` 前缀）、**问题代码**或**源哈希**进行筛选；按文件路径+行或按最新扫描时间排序。链接按钮会将文件/行提示记录到 `ai-i18n-tools dashboard` 正在运行的终端（与文档选项卡的想法相同）。

**刷新行：** 运行 `ai-i18n-tools check-markdown`（可选的 `-p` / `--path` 范围，`--no-cache` 用于跳过 SQLite，`--json` 用于在 stdout 上输出机器可读内容，在 stderr 上输出人类可读行）。默认情况下，当 `docs[].warnMarkdownSourceIssues` 未设置为 `false` 时，每个 `translate-docs` markdown 文件运行也会重新扫描并替换该文件的行。清除缓存文件路径的所有翻译会删除该文件路径的 markdown 问题行，作为与故障相同的清理路径的一部分。`cleanup` 还会修剪已解析源路径在磁盘上缺失的 markdown 问题行，因此已删除或重命名文件（即使是仅由 `check-markdown` 扫描过，从未翻译过的文件）的诊断信息不会残留。
