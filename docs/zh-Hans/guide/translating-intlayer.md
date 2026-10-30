<a id="translating-intlayer-in-place"></a>
# 就地翻译 Intlayer

对于将翻译保存在类型化内容字典中，或使用翻译管理系统和人工翻译的应用程序而言，[Intlayer](https://intlayer.org/) 是一个很好的解决方案。`translate-intlayer` 正是为此类用户设计的。它会就地填充您的 `*.content.ts` 字典中缺失和过时的区域设置叶节点。字典仍然是唯一事实来源，Intlayer 保留在运行时，而 ai-i18n-tools 则充当翻译引擎（负责提供商选择、术语表、翻译上下文和模型回退）。

<a id="keep-intlayer-or-move-to-source-string-calls"></a>
## 保留 Intlayer，还是迁移到源字符串调用？

| 目标用户 | 命令 | 指南 |
| --- | --- | --- |
| 类型化内容字典、翻译管理系统或人工翻译。Intlayer 保留在运行时。 | `translate-intlayer` | 本页 |
| 源字符串调用（`t('…')`），源语言文本与使用它的代码保存在一起。源语言可以是任何语言。 | `migrate-intlayer` | [从 Intlayer 迁移到源字符串调用](/zh-Hans/guide/migrating-from-intlayer) |

`translate-intlayer` 是一项持续性任务，每当您添加源字符串或编辑现有字符串时，都需要重新运行它。`migrate-intlayer` 则是针对另一类用户的一次性迁移操作。每个重写的调用都将源语言字符串与使用它的代码放在一起，这简化了维护工作并降低了该代码的复杂性。该语言是 `sourceLocale`，它可以是任何语言。

<a id="what-translate-intlayer-does"></a>
## `translate-intlayer` 的作用

1. 解析 `*.content.ts` 默认导出并收集每个 `t({ locale: '…' })` 叶子。区域设置值可以是纯字符串或 Intlayer `insert('…')` 插入节点。
2. 为 UI 块的 `ui.stringsJson` 填充源文本，然后针对缺失和过时的区域设置运行与 [`translate-ui`](/zh-Hans/reference/cli-commands/ui-strings#translate-ui) 相同的引擎。
3. 将新的每个区域设置字符串写回每个 `t({ … })` 对象。编辑是精确的：只有缺失或过时的区域设置行会更改，因此您的格式、键顺序和注释都将保留。现有翻译保持不变。当叶子使用 `insert('…')` 时，新的区域设置值也会被包裹在 `insert(…)` 中，以便叶子在运行时保持可调用。
4. 保留占位符。Intlayer 的插入语法 <code v-pre>{{token}}</code> 未经更改地传递。单大括号 `{token}` 占位符也受支持：它们在翻译时变为 <code v-pre>{{token}}</code>，并在写入时恢复为 `{token}`。
5. 使用 `--dry-run` 进行空运行：它会报告缺失/过时的数量，而不会调用 LLM 或写入任何内容。

<a id="missing-vs-stale"></a>
## 缺失与过时

当满足以下任一条件时，将翻译某个叶节点 + 区域设置组合：

- 该区域设置在叶节点中不存在（缺失），或
- 自上次针对该区域设置运行以来，源区域设置的文本已发生更改（过时）。源语言是 `sourceLocale`，它可以是任何语言。

过时状态在 `cacheDir` 中按叶节点进行跟踪，因此编辑一个英文字符串只会在下次运行时重新翻译该叶节点；其他所有内容都保持缓存状态。在首次运行时就已经过时的翻译被视为最新——只有后续的编辑才会将其标记为过时。

<a id="translate-your-project"></a>
## 翻译您的项目

1. 安装 `ai-i18n-tools`（请参阅[安装](/zh-Hans/guide/installation)）。如果您的项目还没有 `ai-i18n-tools.config.json`，请使用脚手架创建一个：

   ```bash
   ai-i18n-tools init -P gemini
   ```

将 `sourceLocale` 和 `targetLocales` 设置为您的字典使用的区域设置，并将 `ui.sourceRoots`、`ui.stringsJson` 和 `ui.flatOutputDir` 指向您的源文件和目录路径——这些键与 `translate-ui` 使用的键相同，请参阅 [UI 字符串 — 第 1 步：初始化](/zh-Hans/guide/ui-strings/#step-1-initialise)。该目录可以位于一个临时目录中（例如 `.i18n/`）；它被用作翻译缓存，您绝不应手动编辑它。
2. 首先进行空运行，查看将填充哪些内容：

   ```bash
   ai-i18n-tools translate-intlayer src --dry-run
   ```

3. 应用翻译（需要提供商 API 密钥）：

   ```bash
   ai-i18n-tools translate-intlayer src
   ```

4. 每当您添加新字符串或编辑英文字符串时，请重新运行。只有新的或已更改的叶节点才会被翻译。需要时，可使用 `-l de,fr` 或 `--ui-block` 来限定运行范围。

<a id="run-the-example"></a>
## 运行示例

[intlayer-translate](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate) 示例是一个小型的 Vite + React 应用，其字典自带英语和巴西葡萄牙语；西班牙语和简体中文则被有意省略。`pristine/` 是只读参考；`src/` 是工作副本。`pnpm reset` 会将 `src/` 恢复到初始状态（并清除目录和缓存），以便您可以重复此练习。

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate
cd intlayer-translate
pnpm install
pnpm reset
pnpm translate:dry
pnpm translate
```

`pnpm dev` 在 `http://localhost:3093` 上运行应用。在翻译之前，将区域设置切换到 `es` 或 `zh-Hans`，字符串将回退到英文；在 `pnpm translate` 之后，填充的译文就会出现。编辑一个英文字符串并重新运行 `pnpm translate`，即可看到仅该叶子刷新。

完整演练：[examples/intlayer-translate/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-translate/README.md)。

<a id="command"></a>
## 命令

```bash
ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]
```

需要 `features.translateUIStrings` 和 UI 块的 `ui.stringsJson`（与 `translate-ui` 相同）。`--dry-run` 不会调用 LLM。

| 选项 | 含义 |
| --- | --- |
| `[paths...]` | 要扫描的文件/目录/通配符（默认：`ui.sourceRoots`） |
| `-l`, `--locale <codes>` | 要填充的目标区域设置，以逗号分隔（默认值：该块的 `targetLocales`） |
| `--ui-block <selector>` | UI 块：从零开始的索引、描述或 `stringsJson` 路径（默认值：块 0） |
| `--dry-run` | 仅报告缺失/过时的计数；不调用 LLM，不写入 |
| `-j`, `--concurrency <n>` | 最大并行目标区域设置数（默认值：配置 `concurrency` 或 4） |

**另请参阅：** [CLI — UI 字符串](/zh-Hans/reference/cli-commands/ui-strings#translate-intlayer)、[从 Intlayer 迁移到源字符串调用](/zh-Hans/guide/migrating-from-intlayer)
