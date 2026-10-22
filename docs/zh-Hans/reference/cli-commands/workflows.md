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

打印已记录的模型 API 调用统计信息（调用次数、Token 数以及单一 USD 成本）。成本为提供商的 `usage.cost`（如果存在，包括 `0`），否则为该模型的 `providers.<name>.modelPricing`，否则为提供商范围内的 `providers.<name>.pricing` 默认值，否则为该模型 ID 的 models.dev 输入和输出列表价格。已报告的成本和明确的配置费率绝不会被替换。未知成本保持为 `—`，绝不会是 `$0.00`。新调用会存储金额；在运行报告时，会对那些有 Token 但没有存储成本的旧行进行估算。聚合方式与“翻译仪表板 → 使用量与成本”相同。超过七个 UTC 日历日的详细信息行会被汇总到每月的 `api_totals` 中；报告会合并这两个表。`--since` 接受 `YYYY-MM-DD`、持续时间（`30m`、`1h`、`6h`、`12h`、`24h`、`7d`、`30d`）或日历月窗口（`1mo`、`2mo`、`3mo`）。`--clear` 会删除详细信息行和每月总计（`--older-than` 为 `1mo`、`2mo`、`3mo`、`6mo`、`1y` 或 `all`；`--dry-run` 会报告数量而不进行删除）。

**主要选项：** `--since`、`--provider`、`--model`、`--operation`、`-l` / `--locale`、`--outcome`、`--clear`、`--older-than`、`--dry-run`

**另请参阅：** [仪表板用量与费用](/zh-Hans/guide/translation-dashboard/usage)
