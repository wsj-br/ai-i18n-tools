<a id="glossary"></a>
# 词汇表

**词汇表**选项卡用于编辑您的用户词汇表 CSV（配置中的 `glossary.userGlossary`）。此处的条目是 `translate-ui`、`proofread-ui` 和 `translate-docs` 的术语提示（通过共享词汇表）。紧凑的 UI 标签缩写（例如 `Size` → `Tam` / `Tam.`）会保留用于 UI 翻译，但在构建文档提示时会跳过，因此它们不会促使模型在 markdown/MDX 中编造 <code v-pre>{{…}}</code> 标记。

当未配置`glossary.userGlossary`时，该选项卡将隐藏。

<a id="csv-columns"></a>
## CSV列

| 列 | 含义 |
| --- | --- |
| **原始语言字符串** | 源术语或短语 |
| **区域设置** | 目标区域设置，或所有区域设置的`*` |
| **翻译** | 首选翻译 |
| **上下文** | 对预期含义或用法的可选源语言解释。仅在此术语与当前批次匹配时发送。 |
| **强制** | 选中时，该术语必须完全按给定方式翻译 |

<a id="add-a-row"></a>
## 添加行

使用选项卡顶部的表单：

1. 输入**原文**、**区域设置**（`*` 或目标区域设置代码）和**翻译**。
2. 可选地添加**上下文**（用法说明）并勾选**强制**。
3. 点击**添加**。

如果CSV文件尚不存在，则在首次添加时创建。

<a id="edit-or-delete"></a>
## 编辑或删除

- **内联编辑** — 直接在表格中更改字段，然后点击该行上的**保存**。
- **删除** — 使用删除控件删除一行。

更改将在下次运行 `translate-ui`、`proofread-ui`、`translate-docs` 或 `sync` 时生效。编辑 **上下文** 说明（或配置中的 `glossary.contextFiles`）会自动刷新受影响区域设置的缓存翻译——你不需要 `--force`。

将上下文文件保留为简洁的 Markdown 或纯文本摘要，并置于已翻译的 `docs[]` 树之外。该文本会在每次匹配的请求中发送给 LLM；请勿包含机密信息或个人数据。有关如何构建这些文件和 CSV 的说明，请参见[术语表](/zh-Hans/guide/glossary)。

<a id="filters"></a>
## 筛选器

按**原文**、**区域设置**（包括 `*`）、**翻译文本**或**上下文**子字符串进行筛选，然后点击**应用**。

<a id="dashboard-edits-and-glossary-auto-add"></a>
## 仪表板编辑和词汇表自动添加

当您在**UI字符串**或**UI复数**选项卡中修复UI字符串时，如果`glossary.autoAddUserEditedToGlossary`为`true`，则下一次`translate-ui`运行可以自动将该更正附加到词汇表。使用词汇表选项卡查看、调整或删除这些自动添加的行。
