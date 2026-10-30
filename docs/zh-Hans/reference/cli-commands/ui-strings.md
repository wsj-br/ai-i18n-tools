<a id="cli--ui-strings"></a>
# CLI — UI 字符串

<a id="extract"></a>
### `extract`

**概要：** `ai-i18n-tools extract`

从 `t("…")` / `i18n.t("…")` 字面量、可选的 `package.json` 描述以及启用 `includeUiLanguageEnglishNames` 时可选的内置主 `englishName` 条目更新 `strings.json`（参见 `ui.uiExtractor`；不读取 `languagesManifestPath`）。同时重新生成每个块的 `ui-languages.json`。当 `ui.uiExtractor.extensions` 中列出了 `.html` / `.htm` 时，还会从 HTML 中捕获 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 标记字符串。遍历每个包含 `sourceRoots` 的 `ui` 块。`--ui-block` 将运行限制为单个块（索引、描述或 `stringsJson` 路径）。不调用 LLM。

**另请参阅：** [UI 字符串概览](/zh-Hans/guide/ui-strings/)，[纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html)

---

<a id="migrate-intlayer"></a>
### `migrate-intlayer`

**概要：** `ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]`

将 Intlayer `*.content.ts` 词典导入 `strings.json` 和扁平化区域设置文件，并将简单的 `useIntlayer` / `getIntlayer` 调用站点重写为 `t('source string')`。字符串以 `sourceLocale` 编写，它可以是任何语言。默认情况下为试运行（但仍会写入报告）。`--write` 会为目录植入种子数据并应用安全的重写。不会调用 LLM。

该报告是 `--write` 留下的所有内容的交接文档，并以**分步待办事项**结尾，安排了剩余的工作：每个手动站点对应的具体 `t()` 或 JSX 调用、`import { t }` 行、之后需要删除的字典文件和 `IntlayerProvider` 遗留内容、需要先 `extract` 再 `translate-ui` 的源字符串，以及一段用于覆盖应用 i18n 模块的 i18next 运行时引导代码。区域设置控件必须调用 `i18n.changeLanguage` 以及 `loadLocale`。`extract` 会写入 `ui-languages.json`，并由该引导代码导入。请勿手动编辑 `strings.json`、扁平化区域设置文件或 `ui-languages.json`。

**主要选项：** `--write`, `--report`, `--content-glob` (默认 `**/*.content.ts`), `--t-import`

**另请参阅：** [从 Intlayer 迁移](/zh-Hans/guide/migrating-from-intlayer)

---

<a id="translate-intlayer"></a>
### `translate-intlayer`

**概要：** `ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]`

就地翻译 Intlayer `*.content.ts` 词典内缺失和过时的区域设置叶节点，并保持词典作为信源。与 [`migrate-intlayer`](#migrate-intlayer) 不同，此命令不会将应用从 Intlayer 迁移出去；它只填充 `t({ … })` 叶节点。当您希望在运行时保留 Intlayer 并使用 ai-i18n-tools 作为翻译引擎时，请使用此命令。

它提取每个 `t({ … })` 叶节点，使用源文本填充所选 UI 块的 `strings.json`，运行与 [`translate-ui`](#translate-ui) 相同的引擎（提供商选择、术语表、翻译上下文和模型回退），然后将新的每个区域设置字符串写回每个 `t({ … })` 对象中。编辑是精确的：只有缺失或过时的区域设置行会更改，因此您的格式和注释得以保留。Intlayer `{token}` 占位符会往返于 <code v-pre>{{token}}</code> 进行翻译。

当叶节点中缺少某个区域设置（缺失）时，或者当源区域设置的文本自上次针对该区域设置运行以来已发生更改（过时）时，会翻译“叶节点+区域设置”。过时状态在 `cacheDir` 中进行跟踪，因此编辑该源字符串会在下次运行时重新翻译该叶节点。源语言是 `sourceLocale`，并且可以是任何语言。`--dry-run` 会报告缺失/过时的计数，而不会调用 LLM 或写入任何内容。需要 `features.translateUIStrings` 和 UI 块的 `stringsJson`（与 `translate-ui` 相同）。

**关键选项：** `-l` / `--locale`、`--ui-block`、`--dry-run`、`-j` / `--concurrency`

`[paths...]`：要扫描的文件/目录/全局模式（默认值：块的 `sourceRoots`）。`-l` / `--locale`：逗号分隔的目标语言环境以填充（默认值：块配置的 `targetLocales`）。`--ui-block`：从零开始的索引、描述或 `stringsJson` 路径（默认值：块 0）。`-j` 并行处理语言环境。

**另请参阅：** [migrate-intlayer](#migrate-intlayer)、[从 Intlayer 迁移](/zh-Hans/guide/migrating-from-intlayer)

---

<a id="mark-html"></a>
### `mark-html`

**概要：** `ai-i18n-tools mark-html [paths...] [--write]`

将裸 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 标记插入 HTML 中，使源文本仅写入一次（在元素本身上）。扫描给定的文件/目录/glob 模式（默认值：每个块的 `sourceRoots` 下的 `.html` / `.htm`）。默认执行试运行（报告每个文件的添加数量以及任何需要手动 `<span data-i18n>` 的混合内容元素）；`--write` 应用更改。具有幂等性，遵循 `data-i18n-ignore`（跳过该元素及其子树），绝不触碰类代码元素（`code`、`pre`、`kbd`、`samp`、`var`）或纯空/纯数字文本，且绝不生成带值标记。不调用 LLM。

**关键选项：** `--write`

**另请参阅：** [为翻译标记 HTML](/zh-Hans/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**概要：** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

使用 `sourceLocale` + `targetLocales` 和捆绑的 `data/ui-languages-complete.json`（或 `--master`）将 `ui-languages.json` 写入 `languagesManifestPath`（默认为 `{ui.flatOutputDir}/ui-languages.json`）。对于主文件中缺失的区域设置，会发出警告并生成 `TODO` 占位符。如果您现有的清单包含自定义的 `label` 或 `englishName` 值，它们将被主目录的默认值替换——请在之后检查并调整生成的文件。

**关键选项：** `--master`，`--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**概要：** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

仅翻译 UI 字符串（`strings.json` → 区域设置 JSON）。需要 `features.translateUIStrings`。

**关键选项：** `-l` / `--locale`，`--force`，`--dry-run`，`-j` / `--concurrency`

`-l` / `--locale`：逗号分隔的目标语言环境（默认值：配置 `targetLocales` 减去 `sourceLocale`）。`--force`：重新翻译每个语言环境的所有条目（忽略现有翻译）。`--dry-run`：不写入，不进行 API 调用。`-j` 并行处理 **语言环境**；在每个语言环境内，配置 `uiBatchConcurrency`（默认 **2**）并行处理 LLM 批次（50 个字符串的块，然后是复数组）。没有针对 `uiBatchConcurrency` 的 CLI 标志。

---

<a id="sync-ui"></a>
### `sync-ui`

**概要：** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

提取并翻译 UI 字符串（需要 `features.translateUIStrings`）。仅限 UI —— 不包含文档、SVG 或 `json[]`。与 `translate-ui` 具有相同的 `-l`、`--force`、`--dry-run` 和 `-j` 选项。

---

<a id="proofread-ui"></a>
### `proofread-ui`

**概要：** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

首先运行 `extract`（需要 `features.translateUIStrings`），以便每个选定的目录都与源匹配，然后对源语言环境 UI 字符串进行 LLM 审查（拼写、语法）。`--ui-block` 将提取和审查限制为一个块。术语提示仅来自 `glossary.userGlossary` CSV（与 `translate-ui` 范围相同 — UI 目录不会反馈，因此不良文案不会作为词汇表被强化）。使用活动的 LLM 提供商（其 API 密钥环境变量）。

失败时退出并返回 **1**（缺少功能开关、提取失败、目录缺失或无效、缺少 API 密钥，或所有批次均失败）；运行成功完成时退出并返回 **0**（发现的问题仅供参考）。将 `proofread-ui-results_<timestamp>.log` 写入 `cacheDir` 下，作为人类可读的报告（包含摘要、问题、未审查行以及每个字符串的 OK 行）；终端仅打印摘要计数和问题（不打印每个字符串的 `[ok]` 行）。如果批次失败，或者模型响应短于批次长度且每个槽位没有可用的 `index`，则将这些字符串计为未审查。它们的问题将被丢弃，以免将过短的数组应用到错误的字符串上。在最后一行打印日志文件名。启用 `--json` 时，人类可读样式的输出将发送到 stderr。链接使用 `path:line`，类似于仪表板 UI 字符串链接按钮。

**关键选项：** `-l` / `--locale`、`--chunk`（默认 **50**）、`--dry-run`、`--json`、`-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**概要：** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

将 `strings.json` 导出为 XLIFF 2.0（每个目标区域设置对应一个 `.xliff`）。只读；无 API。

**关键选项：** `-l` / `--locale`、`-o` / `--output-dir`、`--untranslated-only`、`--dry-run`

`-o` / `--output-dir`：输出目录（默认：与目录相同的文件夹）。`--untranslated-only`：仅包含缺少该区域设置翻译的单元。
