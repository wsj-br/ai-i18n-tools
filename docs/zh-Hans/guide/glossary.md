<a id="glossary"></a>
# 词汇表

术语表确保了所有翻译中产品术语的一致性。用户可以在一种或多种语言中定义术语的翻译，从而让 AI 模型使用这种预定义的翻译，而不是自行选择。它还可以用于在翻译成其他语言时，保持某些术语（例如产品名称）不变。

系统会向模型发送两种类型的指导：

- `glossary.userGlossary` 中的**术语行**（对于文档、JSON 和 SVG，还包括启用了 `uiGlossary` 的每个 `ui` 块中的现有 UI 翻译）。仅当该源术语出现在待翻译文本中时，才会包含对应行。
- `glossary.contextFiles` 中的**项目上下文文件**。完整说明会注入到每个 UI、文档、JSON、SVG 和校对提示中。该部分见[下文](#project-context-files)。

<a id="how-the-glossary-works"></a>
## 术语表的工作原理

<a id="where-terms-come-from"></a>
### 术语的来源

| 来源 | 配置 | 使用方 |
| --- | --- | --- |
| UI 目录 | `ui[].uiGlossary`（布尔值，默认值为 `true`）— 该块的 `stringsJson` | `translate-docs`、`translate-json`、`translate-svg` |
| 用户 CSV | `glossary.userGlossary` | `translate-ui`、`proofread-ui`、`translate-docs`、`translate-json`、`translate-svg` |

`init` 将 `glossary.userGlossary` 指向 `glossary-user.csv`，并且不创建该文件。当它缺失时，运行 `glossary-generate`，并在第一个 `translate-ui` 之前将领域术语放入其中。对未更改字符串的第二次翻译可能会有不同的措辞。术语表确保两次运行一致。

启用了 `uiGlossary: true` 的块会复用已存储在其 `strings.json` 中的翻译作为提示，从而使文档、JSON 和 SVG 与 UI 保持一致。`translate-ui` 和 `proofread-ui` 不会读取这些目录——它们仅从用户 CSV 中获取提示，因此错误的 UI 翻译不会被作为首选术语反馈回去。对于不应影响其他流水线的块，请将 `uiGlossary` 设置为 `false`。当多个块共享同一个源术语时，排在前面的块会填充某个语言区域，而排在后面的块仅补充仍然缺失的语言区域。用户 CSV 的优先级高于任何 UI 目录。如果某行的 `locale` 为特定代码，则会同时替换该语言区域的 `*` 行和 UI 目录翻译。如果 `locale` 为 `*`，则会将同一翻译应用于所有尚未从 UI 目录获取翻译的目标语言区域。

紧凑的 UI 标签缩写（如带有尾随点的 `Alm.`，或简短的单词元压缩如 `Size` → `Tam`）仍可用于 UI 翻译。文档提示会跳过它们，因此它们不会促使模型在 markdown 或 MDX 中生成虚构的 <code v-pre>{{…}}</code> 词元。

当两个或更多目录键共享的多词前缀尚未是键时，该前缀将作为其自身的术语添加。对于每个区域设置，翻译是这些目录翻译的共享开头，在词边界处截断，并且仅当该共享开头至少有四个字符时。当两个德语字符串都以 `Cursor-Modelle` 开头时，`Cursor Models run out` 和 `Cursor Models at renewal` 可以产生 `Cursor Models`。相同源的用户 CSV 行会替换该种子翻译。

<a id="when-a-term-is-sent"></a>
### 何时发送术语

匹配不区分大小写，并在词边界（空格或标点符号）处停止。优先匹配较长的术语，并丢弃重叠的匹配项。当术语与当前批次匹配时，提示词会接收到类似 `"dashboard" → "Tableau"` 的提示。如果该行包含 **Context** 注释，则仅针对该匹配项附加该注释。

**上下文**是源语言使用指南（该术语的含义或如何使用它）。它不是翻译。更改 **上下文** 备注或任何 `glossary.contextFiles` 内容，会在下次运行时刷新受影响区域设置的缓存翻译 — 您不需要 `--force`。仅更改非 **强制** 行上的首选 **翻译** 会保留现有缓存，直到您传递 `--force` 或 `--force-update`。**强制** 行（新建、编辑或清除）仅在源包含该术语的段中缓存未命中，并且仅当存储的文本尚未包含强制翻译时。对于此窄范围刷新，请将该行上的 **上下文** 留空；上下文备注仍然会刷新整个区域设置。您在仪表板中编辑的行将保持为 `user-edited`。

Markdown 翻译会检查一个两到五个词的 UI 标签，当源文本将其引用为整个粗体或行内代码片段、标题或仅包含该标签的行时。包含该术语的较长粗体短语是一个提示，因此 `**Ask for target language**` 不需要 `Target language` 的目录形式。单个词的提示仍可能发生词形变化。不是 UI 标签的用户 CSV 提示仍是提示。检查会忽略大小写，并查找作为子字符串的目录措辞，因此词形变化的形式仍可能遗漏。它会尝试下一个模型，直到相同的质量错误发生三次或模型列表用尽，并且它不会因标签遗漏而拆分段落。如果这些尝试仅遗漏了该检查，则运行会保留遗漏最少的尝试，写入文档，并缓存带有词汇表标签警告的段落。摘要会列出这些警告，并且 `cacheDir` 会收到 `glossary-review-*.md`，这是一个您可以粘贴到 AI 的提示，用于将每个遗漏标记为误报或实际遗漏。当唯一的问题是该警告时，退出代码仍为 0。

可以在项目配置中使用 `glossary.labelCheckSkips` 跳过误报（仪表板的“词汇表”选项卡编辑相同的列表）。每个条目都指定了英文 `term`、要跳过的 `locales`（`*` 表示所有区域设置）以及可选的 `files` glob 模式。该术语仍是一个提示。`--recheck-glossary-warnings` 会再次翻译已标记的段落，并在检查通过时清除标记。`--force` 会与所有其他段落一起重新翻译它们。缓存的 Markdown 在文件处理时会重新检查 (`--force-update`)；文件跟踪跳过的文件会保持原样，直到该文件中的 **Force** 术语从输出中缺失，或者直到 `--recheck-glossary-warnings` 打开一个包含已标记段落的文件。凡是引用该标签的地方，包括翻译后的产品名称，都需要与源文本不同的目录翻译。使用翻译与源文本相同的 **Force** 行来保留源拼写。

<a id="force"></a>
### 强制

当 **Force** 为 `true`、`yes` 或 `1` 时，源术语会在模型看到文本之前被提取出来，并在之后写回首选翻译。措辞是精确的，而非建议。适用相同的词边界和最长匹配规则。当模型应优先使用该翻译但仍可能对其进行词形变化时，请将 **Force** 留空（或设为 `false`）。

<a id="generate-a-glossary"></a>
## 生成术语表

`glossary-generate` 会写入一个带有标准表头的空 CSV。它使用配置中的 `glossary.userGlossary`，如果未设置该键，则使用 `glossary-user.csv`。它拒绝覆盖已存在的文件（退出代码 **1**）。

```bash
ai-i18n-tools glossary-generate
# or: ai-i18n-tools glossary-generate -o i18n/glossary.csv
```

将配置指向该文件：

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv"
  }
}
```

您也可以直接从仪表板创建 CSV 术语表文件。在 [术语表](/zh-Hans/guide/translation-dashboard/glossary) 选项卡上首次执行 **添加** 操作时，如果指定了 `glossary.userGlossary` 且该文件尚不存在，系统将创建该文件。当 `glossary.autoAddUserEditedToGlossary` 为 `true`（默认值）时，在仪表板中更正 UI 字符串可以在下一次 `translate-ui` 运行期间将该更改添加到 CSV 中。仪表板还可用作 CSV 术语表的编辑器，允许您在 UI 中添加、编辑或筛选行。

<a id="csv-columns"></a>
## CSV列

表头行：

```text
Original language string,locale,Translation,Force,Context
```

接受 `en` 或 `English` 代替 `Original language string`。接受 `Notes` 代替 `Context`。

| 列 | 含义 |
| --- | --- |
| **原始语言字符串** | 源语言区域中的源术语或短语 |
| **语言区域** | 目标语言区域代码，或表示所有目标的 `*` |
| **翻译** | 首选翻译 |
| **强制** | 使用 `true`、`yes` 或 `1` 来强制要求此措辞；否则仅作为提示 |
| **上下文** | 可选的源语言说明。仅在匹配此术语时发送 |

<a id="examples"></a>
## 示例

每个语言区域对应一个产品术语、一个强制使用的德语标签，以及一行用于解释模型可能会按字面意思理解的词语的法语内容：

```csv
"Original language string","locale","Translation","Force","Context"
"dashboard","*","Tableau","false","The analytics home, not a vehicle panel"
"Save","de","Speichern","true",""
"workspace","fr","espace de travail","false","A user's project container, not an office"
```

结合项目简报：

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"],
    "contextMaxChars": 12000
  }
}
```

字段参考：[配置中的 `glossary`](/zh-Hans/reference/configuration#glossary)。命令参考：[`glossary-generate`](/zh-Hans/reference/cli-commands/tools#glossary-generate)。

<a id="project-context-files"></a>
## 项目上下文文件

`glossary.contextFiles` 用于存放不适合放在单个 CSV 行中的产品级指南：产品是什么、面向谁、语气，以及容易误译的术语。将配置指向一个或多个相对于 cwd 的 `.md` / `.txt` 文件；它们会按列出顺序拼接，并注入到每个 UI、文档、JSON、SVG 和校对提示词中。

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"]
  }
}
```

用**源语言环境**编写简报，将其长度控制在远低于 `glossary.contextMaxChars`（默认为 `12000`）的范围内，并将其存储在 `docs[].contentPaths` 之外，除非你也希望翻译该文件。请参阅[配置中的 `glossary`](/zh-Hans/reference/configuration#glossary)。

<a id="generate-a-context-file-with-an-ai-agent"></a>
### 使用 AI 代理生成上下文文件

让代理（Cursor、Claude Code、Copilot 等）读取代码库并编写简报。粘贴如下提示词：

```text
Create a translation-context Markdown file for this repository at i18n/product-context.md.

This file is injected verbatim into every ai-i18n-tools translation prompt (UI strings, docs, JSON, SVG, proofread). It must stay in the source language of the project (do not translate it). Translators already receive a glossary of preferred term mappings; this file should explain meaning, audience, and register — not duplicate every glossary row.

Requirements:
- Concise: aim for 1–4 KB, hard limit 8000 characters. No full manuals, README dumps, or changelog history.
- Source-language only. Short headings, bullet lists, and a few example sentences are enough.
- No secrets, API keys, credentials, personal data, internal URLs, or unpublished commercial figures.
- Do not invent product facts. If something is unclear, omit it or mark it as unknown.
- Do not put this file under a path that is also listed in docs[].contentPaths.

Cover, in this order:
1. Product in one paragraph: what it is, who uses it, and the default tone (formal / informal / technical).
2. Domain and disambiguation: terms that look ordinary in English but have a product-specific meaning (for example “dashboard” as an analytics home, not a vehicle panel).
3. Features or areas that change register (billing vs. onboarding vs. admin).
4. Things translators must preserve exactly: brand names, CLI flags, config keys, code identifiers, placeholder tokens.
5. Locale notes only when they affect meaning for every target (for example “use formal you”). Do not list per-locale translations here.

Write only the Markdown file. Afterward, remind me to add it to glossary.contextFiles in ai-i18n-tools.config.json if it is not already listed.
```

在下一次 `sync` / `translate-*` 运行前检查该文件。更改该文件会使该次运行中每个语言环境的缓存翻译失效，因此一旦质量达标，请保持简报稳定。
