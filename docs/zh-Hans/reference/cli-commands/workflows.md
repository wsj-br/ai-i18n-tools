<a id="cli--workflows--status"></a>
# CLI — 工作流与状态

<a id="sync"></a>
### `sync`

**概要：** `ai-i18n-tools sync [options]`

提取（如果已启用），然后进行 UI 翻译，接着在设置了 `features.translateSVG` 和 `config.svg` 时执行 `translate-svg`，然后进行文档翻译，接着在设置了 `features.translateJson` 和 `json[]` 时执行 `translate-json` —— 除非使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳过。

**主要选项：** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` 会转发到 UI 和 SVG 步骤以及 docs/JSON；`--force-update` 适用于 docs、JSON 和 SVG（不适用于 UI）。文档阶段还会转发 `--emphasis-placeholders` 和 `--debug-failed`（含义与 `translate-docs` 相同）。`--prompt-format` 不是 `sync` 标志；docs 和 JSON 步骤使用内置默认值（`json-array`）。

---

<a id="status"></a>
### `status`

**概要：** `ai-i18n-tools status [--max-columns <n>]`

当 `features.translateUIStrings` 开启时，按区域设置打印 UI 覆盖率（`Translated` / `Missing` / `Total`）。然后按文件 × 区域设置打印 markdown 翻译状态（无 `--locale` 过滤器；区域设置来自配置）。当 `features.translateJson` 开启且配置了 `json[]` 时，还会按区块打印 JSON 包状态。大型区域设置列表会被拆分为最多包含 `n` 个区域设置列的重复表格（默认 **9**），以便在终端中保持行宽较窄。

**主要选项：** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**概要：** `ai-i18n-tools statistics [--max-columns <n>]`

打印文档缓存和 `strings.json` 统计信息（与翻译仪表板 → 统计信息中的聚合相同）。`--max-columns`：每个模型 × 区域设置表格的最大区域设置列数（默认 **6**）。

**主要选项：** `--max-columns`

**另请参阅：** [仪表板统计信息](/zh-Hans/guide/translation-dashboard/statistics)
