<a id="cli--ui-strings"></a>
# CLI — UI 字符串

<a id="extract"></a>
### `extract`

**概要：** `ai-i18n-tools extract`

从 `t("…")` / `i18n.t("…")` 字面量、可选的 `package.json` 描述以及可选的捆绑主 `englishName` 条目更新 `strings.json`（当启用 `includeUiLanguageEnglishNames` 时；参见 `ui.uiExtractor`；不读取 `languagesManifestPath`）。同时会在 `languagesManifestPath` 处重新生成 `ui-languages.json`。当 `.html` / `.htm` 列于 `ui.uiExtractor.extensions` 时，还会从 HTML 中捕获 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 标记字符串。要求 `ui.sourceRoots` 非空。不调用 LLM。

**另请参阅：** [UI 字符串概览](/zh-Hans/guide/ui-strings/)，[纯 HTML 应用](/zh-Hans/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**概要：** `ai-i18n-tools mark-html [paths...] [--write]`

将裸 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 标记插入 HTML，以便源文本只编写一次（在元素本身上）。扫描给定的文件/目录/通配符（默认：`ui.sourceRoots` 下的 `.html` / `.htm`）。默认为试运行（报告每个文件的添加计数以及任何需要手动 `<span data-i18n>` 的混合内容元素）；`--write` 应用更改。幂等，遵循 `data-i18n-ignore`（跳过该元素及其子树），从不触碰类代码元素（`code`、`pre`、`kbd`、`samp`、`var`）或空/纯数字文本，并且从不发出带值的标记。不调用 LLM。

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

`-l` / `--locale`：逗号分隔的目标区域设置（默认：配置 `targetLocales` 减去 `sourceLocale`）。`--force`：重新翻译每个区域设置的所有条目（忽略现有翻译）。`--dry-run`：不写入，不调用 API。

---

<a id="sync-ui"></a>
### `sync-ui`

**概要：** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

提取并翻译 UI 字符串（需要 `features.translateUIStrings`）。仅限 UI —— 不包含文档、SVG 或 `json[]`。与 `translate-ui` 具有相同的 `-l`、`--force`、`--dry-run` 和 `-j` 选项。

---

<a id="proofread-ui"></a>
### `proofread-ui`

**概要：** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

首先运行 `extract`（需要 `features.translateUIStrings`）以使 `strings.json` 与源匹配，然后对源区域设置的 UI 字符串进行 LLM 审查（拼写、语法）。术语提示仅来自 `glossary.userGlossary` CSV（范围与 `translate-ui` 相同 —— 不包含 `strings.json` / `uiGlossary`，因此不会将糟糕的文案强化为术语表）。使用当前活动的 LLM 提供程序（其 API 密钥环境变量）。

失败时退出代码为 **1**（缺少功能标志、提取失败、缺少/无效的目录、缺少 API 密钥，或所有批次均失败）；运行成功完成时退出代码为 **0**（审查结果仅供参考）。在 `cacheDir` 下写入 `proofread-ui-results_<timestamp>.log` 作为人类可读的报告（摘要、问题以及每个字符串的 OK 行）；终端仅打印摘要计数和问题（没有每个字符串的 `[ok]` 行）。在最后一行打印日志文件名。使用 `--json` 时，人类风格的输出将发送到 stderr。链接使用 `path:line`，类似于仪表板 UI 字符串的链接按钮。

**关键选项：** `-l` / `--locale`、`--chunk`（默认 **50**）、`--dry-run`、`--json`、`-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**概要：** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

将 `strings.json` 导出为 XLIFF 2.0（每个目标区域设置对应一个 `.xliff`）。只读；无 API。

**关键选项：** `-l` / `--locale`、`-o` / `--output-dir`、`--untranslated-only`、`--dry-run`

`-o` / `--output-dir`：输出目录（默认：与目录相同的文件夹）。`--untranslated-only`：仅包含缺少该区域设置翻译的单元。
