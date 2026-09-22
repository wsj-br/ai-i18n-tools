<a id="glossary"></a>
# 词汇表

术语表可确保产品术语在所有翻译中保持一致。用户可以定义一个术语在一种或多种语言中的翻译，从而使 AI 模型能够使用此预定义的翻译，而不是自行猜测最佳译法。它还可用于在翻译成其他语言时保持某些术语（如产品名称）不变。

系统会向模型发送两种类型的指导：

- `glossary.userGlossary` 中的**Term rows**（对于某些管道，还包括来自 `glossary.uiGlossary` 的现有 UI 翻译）。仅当正在翻译的文本中出现该源术语时，才会包含该行。
- `glossary.contextFiles` 中的**Project context files**。完整的简报会注入到每个 UI、文档、JSON、SVG 和校对提示中。该部分在[下文](#project-context-files)。

<a id="how-the-glossary-works"></a>
## 术语表的工作原理

<a id="where-terms-come-from"></a>
### 术语的来源

| 来源 | 配置 | 使用者 |
| --- | --- | --- |
| UI 目录 | `glossary.uiGlossary` — 通常与 `ui.stringsJson` 路径相同 | `translate-docs`、`translate-json`、`translate-svg` |
| 用户 CSV | `glossary.userGlossary` | `translate-ui`、`proofread-ui`、`translate-docs`、`translate-json`、`translate-svg` |

`uiGlossary` 会重用已存储在 `strings.json` 中的翻译作为提示，从而使文档、JSON 和 SVG 与 UI 保持一致。`translate-ui` 和 `proofread-ui` 不读取 `uiGlossary` — 它们仅从用户 CSV 获取提示，因此错误的 UI 翻译不会被作为首选术语反馈回去。

用户 CSV 的优先级高于 UI 目录。如果某行的 `locale` 是特定代码，则会同时替换该区域的 `*` 行和 UI 目录翻译。当 `locale` 为 `*` 时，会将相同的翻译应用于尚未从 UI 目录获取翻译的每个 `targetLocales` 条目。

紧凑的 UI 标签缩写（如带有尾随点的 `Alm.`，或简短的单词元压缩如 `Size` → `Tam`）仍可用于 UI 翻译。文档提示会跳过它们，因此它们不会促使模型在 markdown 或 MDX 中生成虚构的 <code v-pre>{{…}}</code> 词元。

<a id="when-a-term-is-sent"></a>
### 何时发送术语

匹配不区分大小写，并在词边界（空格或标点符号）处停止。优先匹配较长的术语，并丢弃重叠的匹配项。当术语与当前批次匹配时，提示词会接收到类似 `"dashboard" → "Tableau"` 的提示。如果该行包含 **Context** 注释，则仅针对该匹配项附加该注释。

**Context** 是源语言的使用指导（术语的含义或使用方法），它不是翻译。更改 **Context** 注释或任何 `glossary.contextFiles` 内容，会在下次运行时刷新受影响区域的缓存翻译——您不需要 `--force`。仅更改首选 **Translation** 会保留现有缓存，直到您传入 `--force` 或 `--force-update`。您在仪表板中编辑的行将保持为 `user-edited`。

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
    "uiGlossary": "src/locales/strings.json",
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
    "uiGlossary": "src/locales/strings.json",
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
