<a id="cli-options"></a>
# CLI 选项

有关 `translate-docs` 缓存行为、标志、批处理提示格式和内部 SQLite 路径键的参考。

<a id="cache-behaviour-and-translate-docs-flags"></a>
## 缓存行为和 `translate-docs` 标志

CLI 在 SQLite 中保留 **文件跟踪**（每个文件 × 区域设置的源哈希）和 **段**行（每个可翻译块的哈希 × 区域设置）。正常运行时，当跟踪的哈希与当前源匹配、输出文件已存在**并且**输出的修改时间至少与源的修改时间一样新时，它会完全跳过文件；否则，它会处理文件并使用段缓存，这样未更改的文本就不会调用 API。

| 标志                          | 效果                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(默认)*                   | 当文件跟踪和磁盘输出匹配时跳过未更改的文件；其余部分使用段落缓存。                                                                                                                                                                          |
| `-l, --locale <codes>` | 逗号分隔的目标区域设置（省略时，默认值与根 `targetLocales` 和每个 `docs[]` 块的可选 `targetLocales` 的并集匹配）。 |
| `-p, --path` / `-f, --file`   | 仅翻译此路径下的 Markdown/JSON（项目相对路径、绝对路径或通配符模式）；`--file` 是 `--path` 的别名。                                                                                                                                      |
| `--dry-run`                   | 不进行文件写入，也不调用 API。                                                                                                                                                                                                                                    |
| `--type <kind>`               | 限制为 `markdown` 或 `json`（否则，如果在配置中启用了两者，则两者都包含）。                                                                                                                                                                                           |
| `--json-only` / `--no-json`   | 仅翻译 JSON 标签文件，或跳过 JSON，仅翻译 markdown。                                                                                                                                                                                          |
| `-j, --concurrency <n>`       | 最大并行目标语言（默认为配置或 CLI 内置默认值）。                                                                                                                                                                                          |
| `-b, --batch-concurrency <n>` | 每个文件（文档）的最大并行批量 API 调用次数（默认为配置或 CLI）。                                                                                                                                                                                           |
| `--emphasis-placeholders` | 在翻译之前将 Markdown 强调标记屏蔽为占位符。除非通过 `docs[].emphasisPlaceholders` 针对每个块进行覆盖或通过 `--no-emphasis-placeholders` 禁用，否则 CJK 和 RTL 区域设置会自动启用。 |
| `--debug-failed`              | 在验证失败时，在 `cacheDir` 下写入详细的 `FAILED-TRANSLATION` 日志。                                                                                                                                                                                    |
| `--force-update`              | 重新处理每个匹配的文件（提取、重组、写入输出），即使文件跟踪会跳过。**段缓存仍然适用** — 未更改的段不会发送到 LLM。                                                                                                                                                                                           |
| `--force`                     | 清除每个已处理文件的文件跟踪，并且**不读取**段缓存进行 API 翻译（完全重新翻译）。新结果仍会**写入**段缓存。                                                                                                                                                                                                         |
| `--stats`                     | 打印段计数、跟踪文件计数以及每个语言的段总数，然后退出。                                                                                                                                                                                                               |
| `--clear-cache [locale]`      | 删除缓存的翻译（和文件跟踪）：所有语言，或单个语言，然后退出。                                                                                                                                                                                                        |
| `--prompt-format <mode>`      | 每个**批次**的段如何发送到模型和解析（`xml`、`json-array` 或 `json-object`）。默认 `json-array`。不改变提取、占位符、验证、缓存或回退行为 — 请参阅 [批量提示格式](#batch-prompt-format)。 |

您不能将 `--force` 与 `--force-update` 结合使用（它们是互斥的）。

<a id="batch-prompt-format"></a>
## 批处理提示格式

`translate-docs` 以 **批次**（按 `batchSize` / `maxBatchChars` 分组）将可翻译段发送到活动的 LLM 提供程序。`--prompt-format` 标志仅更改该批次的 **有线格式**；`PlaceholderHandler` 令牌、Markdown AST 检查、SQLite 缓存键以及批处理解析失败时的每段回退保持不变。

| 模式                   | 用户消息                                                           | 模型回复                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | 伪 XML：每个段一个 `<seg id="N">…</seg>`（带 XML 转义）。 | 仅 `<t id="N">…</t>` 块，每个块对应一个段索引。       |
| `json-array` (默认) | 字符串的 JSON 数组，每个条目按顺序对应一个分段。               | 长度 **相同**（顺序相同）的 JSON 数组。           |
| `json-object`          | 按分段索引 `{"0":"…","1":"…",…}` 键控的 JSON 对象。            | **键相同**且值已翻译的 JSON 对象。 |

运行标题还会打印 `Batch prompt format: …`，以便您可以确认活动模式。JSON 标签文件 (`docusaurusCatalogDir`) 和 SVG 文件批次在这些步骤作为 `translate-docs`（或 `sync` 的文档阶段 — `sync` 不公开此标志；它默认为 `json-array`）的一部分运行时使用相同的设置。

<a id="segment-dedupe-and-paths-in-sqlite"></a>
## SQLite 中的段去重和路径

> **注意：** 本节介绍的内部缓存键详细信息有助于调试 `cleanup` 行为或自定义工具。大多数用户可以跳过它。

- 分段行由 `(source_hash, locale)`（哈希 = 规范化内容）全局键控。两个文件中的相同文本共享一行；`translations.filepath` 是元数据（最后写入者），而不是每个文件的第二个缓存条目。
- `file_tracking.filepath` 使用命名空间键：每个 `docs` 块的 `doc-block:{index}:{relPath}`（`relPath` 是项目根目录相对的 posix：收集的 markdown 路径；**JSON 标签文件使用源文件相对于当前工作目录的路径**，例如 `docs-site/i18n/en/code.json`，因此清理可以解析真实文件），`json[]` 下的 `json-block:{index}:{relPath}` 用于 `json[]` 源，以及 `translate-svg` 下的 `svg-files:{relPath}` 用于 SVG 文件。
- `translations.filepath` 存储 markdown、JSON 和 SVG 分段的相对于当前工作目录的 posix 路径（SVG 使用与其他资产相同的路径形状；**仅**在 `file_tracking` 上存在 `svg-files:…` 前缀）。
- 运行后，仅针对 **相同翻译范围**内的分段行（尊重 `--path` 和启用的类型）清除 `last_hit_at`，这些行未被命中，因此过滤或仅文档运行不会将不相关的文件标记为过时。
