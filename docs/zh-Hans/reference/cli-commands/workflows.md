<a id="cli--workflows--reporting"></a>
# CLI — 工作流与报告

<a id="sync"></a>
### `sync`

**概要：** `ai-i18n-tools sync [options]`

提取（如果已启用），然后进行 UI 翻译，接着在设置了 `features.translateSVG` 和 `config.svg` 时执行 `translate-svg`，然后进行文档翻译，接着在设置了 `features.translateJson` 和 `json[]` 时执行 `translate-json` —— 除非使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳过。

**关键选项：** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force` 会转发到 UI 和 SVG 步骤以及 docs/JSON；`--force-update` 适用于 docs、JSON 和 SVG（不适用于 UI）。`--check-cache` 会转发到 docs、JSON 和 SVG：即使文件跟踪会跳过，它也会为强制使用原生脚本的区域设置重新验证缓存的片段。Docs 阶段还会转发 `--emphasis-placeholders`（含义与 `translate-docs` 相同）。全局 `--debug-failed` 会在 `cacheDir` 下为每次被丢弃的模型尝试（包括 SVG/docs 脚本回退）写入 `FAILED-TRANSLATION` 日志，而不仅仅是在链中的每个模型都失败时才写入。`--prompt-format` 不是 `sync` 标志；docs 和 JSON 步骤使用内置默认值（`json-array`）。

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

---

<a id="usage"></a>
### `usage`

**摘要：** `ai-i18n-tools usage [--since <when>] [--provider <name>] [--model <id>] [--operation <name>] [-l <code>] [--outcome accepted|discarded] [--clear] [--older-than <when>] [--dry-run]`

打印已记录的模型 API 调用统计信息（调用次数、令牌数以及单一的美元成本）。成本在存在时为提供商的 `usage.cost`，否则为来自 `providers.<name>.modelPricing` 的金额或提供商范围内的 `providers.<name>.pricing` 默认值（存储于新调用中；对于没有存储成本的旧行，在报告时应用）。与“翻译仪表板 → 用量与成本”中的聚合相同。早于七个 UTC 日历日的明细行将汇总到每月的 `api_totals` 中；报告合并这两个表。`--since` 接受 `YYYY-MM-DD`、一个持续时间（`30m`、`1h`、`6h`、`12h`、`24h`、`7d`、`30d`）或一个日历月窗口（`1mo`、`2mo`、`3mo`）。`--clear` 删除明细行和每月总计（`--older-than` 为 `1mo`、`2mo`、`3mo`、`6mo`、`1y` 或 `all`；`--dry-run` 报告计数而不删除）。

**主要选项：** `--since`、`--provider`、`--model`、`--operation`、`-l` / `--locale`、`--outcome`、`--clear`、`--older-than`、`--dry-run`

**另请参阅：** [仪表板用量与费用](/zh-Hans/guide/translation-dashboard/usage)
