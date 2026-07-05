<a id="markdown-issues-static-checks"></a>
# Markdown 问题（静态检查）

**Markdown 问题**选项卡列出了 `markdown_source_issues` SQLite 表中的行。每行都是一个**预翻译**发现：例如，在 `translate-docs` 用于掩码的相同 CommonMark 样式规则下，永不配对的强调/删除线分隔符运行，用反引号打开但从未关闭的内联代码跨度，或者 `STRONG_OUTSIDE_LINK` 当 `**` / `__` 包装 `[text](url)` 链接时（仅将粗体放在链接文本中）。

这是**不**同于**失败**，它记录每个区域设置的模型输出和翻译后验证问题（`AST mismatch`，占位符泄漏等）。

<a id="when-to-use-it"></a>
## 何时使用

当您想在花费令牌之前修复**源 markdown**时，请使用此选项卡——尤其是在 [失败](/guide/translation-dashboard/failures) 选项卡中质量检查因结构问题而持续失败时。

<a id="how-to-use-the-tab"></a>
## 如何使用此选项卡

1. 阅读**摘要**条——总问题行数和每个问题代码的计数。
2. 按文件路径（与缓存键的部分匹配，包括 `doc-block:{index}:` 前缀）、**问题代码**或**源哈希**进行筛选。
3. 按**文件路径 + 行**（默认）或按**最新扫描时间**进行排序。
4. 🔗 链接按钮将文件/行提示记录到运行 `ai-i18n-tools dashboard` 的终端。

修复源文件，然后重新运行翻译。

<a id="refreshing-rows"></a>
## 刷新行

| 命令/事件 | 效果 |
| --- | --- |
| `ai-i18n-tools check-markdown` | 重新扫描配置的文档；可选的 `-p` / `--path` 范围、`--no-cache`、`--json` |
| `translate-docs`（默认） | 当 `docs[].warnMarkdownSourceIssues` 不是 `false` 时，重新扫描并替换每个 markdown 文件的行 |
| 删除文件路径的所有翻译 | 删除该文件路径的 markdown 问题行（与失败相同的清理） |
| `cleanup` | 清除整个 `markdown_source_issues` 表，然后运行 `sync --force-update` 以重新填充行 |

<a id="common-issue-codes"></a>
## 常见问题代码

| 代码 | 含义 |
| --- | --- |
| 未配对的强调/删除线 | 在 CommonMark 规则下永不关闭的分隔符运行 |
| 未关闭的内联代码 | 反引号跨度已打开但未关闭 |
| `STRONG_OUTSIDE_LINK` | 粗体标记包装了一个 markdown 链接——将粗体移到链接文本内 |

另请参阅 [复杂的 Markdown 和失败的质量检查](/guide/documents/#complex-markdown-and-failed-quality-checks)。
