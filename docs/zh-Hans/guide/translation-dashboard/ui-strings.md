<a id="ui-strings--plurals"></a>
# UI 字符串和复数

**UI 字符串**和**UI 复数**选项卡编辑您的 `strings.json` 目录中的行。仪表板更改直接写入该文件，而不是 SQLite 文档缓存。

当 UI 标签或复数形式在 `translate-ui` 或 `sync` 之后需要手动修复时，请使用这些选项卡。

<a id="ui-strings-tab"></a>
## UI 字符串选项卡

列出 `strings.json` 中的非复数条目 — 每个字符串 ID 和区域设置一行。

<a id="filters"></a>
### 筛选器

| 筛选器 | 用途 |
| --- | --- |
| **ID / 哈希** | 字符串 ID 或哈希 |
| **文件名（部分）** / **选择文件路径** | 源文件范围 |
| **源包含** / **翻译包含** | 文本子字符串 |
| **区域设置** | 单个区域设置或所有区域设置 |
| **模型** | 生成翻译的模型 |

<a id="edit"></a>
### 编辑

1. 单击行上的编辑图标。
2. 更改翻译文本并保存。

条目的 `models[locale]` 设置为 `user-edited`。运行纯 `sync` 或 `translate-ui` 以刷新平面区域设置文件（`de.json` 等）。请**勿**使用 `--force` — 它会重新翻译每个条目并可能覆盖手动修复。

当 `glossary.autoAddUserEditedToGlossary` 为 `true`（默认）时，下一个 `translate-ui` 或 `sync` 可以自动将您的编辑附加到用户词汇表 CSV — 请参阅[配置](/reference/configuration#glossary)。

<a id="delete"></a>
### 删除

- **行删除图标** — 从条目中删除一个区域设置桶。
- **删除已筛选** — 批量删除所有与当前筛选器匹配的区域设置桶。

<a id="log-links"></a>
### 日志链接

🔗 控件将条目的 `locations` 数组中的源文件:行位置打印到终端。

<a id="ui-plurals-tab"></a>
## UI 复数选项卡

列出复数组条目（`"plural": true` 在 `strings.json` 中）。每行显示一个区域设置的基数形式（`one`、`other` 和区域设置特定形式）。

<a id="filters-1"></a>
### 筛选器

与 UI 字符串选项卡相同，此外还有：

| 筛选器 | 用途 |
| --- | --- |
| **完整/不完整** | 所选区域设置是否包含所有必需的 CLDR 形式 |

不完整的行缺少该区域设置的一个或多个必需形式。

<a id="edit-1"></a>
### 编辑

1. 单击行上的编辑图标。
2. 在模态框中编辑每个 CLDR 形式（每个形式一个文本区域）。
3. 保存 — 空形式字符串将在保存时删除。

条目的 `models[locale]` 设置为 `user-edited`。之后运行纯 `sync` 或 `translate-ui`（而不是 `--force`）。

<a id="other-columns"></a>
### 其他列

- **形式** — 显示 `one: "…"`、`other: "…"` 等。
- **`zeroDigit` 徽章** — 当源使用数字零复数模式时，此为只读指示器。

所需形式来自每个区域设置的 CLDR 规则（`requiredPluralFormsByLocale`）。

<a id="delete-1"></a>
### 删除

与 UI 字符串相同：按区域设置删除或 **删除已筛选**批量操作。
