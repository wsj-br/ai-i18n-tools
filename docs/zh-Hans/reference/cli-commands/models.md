<a id="cli--models--languages"></a>
# CLI — 模型与语言

<a id="check-models"></a>
### `check-models`

**概要：** `ai-i18n-tools check-models`

根据活动提供商的 `GET /models` 列表（成员资格和 `expiration_date`）验证每个已配置的模型 ID。需要该提供商的 API 密钥（无需密钥的提供商如 Ollama 则不需要）。当任何已配置的 ID 缺失或过期时，以非零状态退出，并遵守已解析的请求超时时间（提供商上的 `requestTimeout` 或 `requestTimeoutMs`，否则为顶级值）。当提供商返回定价信息时（例如 OpenRouter），还会显示提示/补全每 100 万个令牌的美元价格。当 `providers.cheaperinference.zeroDataRetention` 为 true 时，检查使用 `GET /v1/models?zdr=true` 并将目录中遗漏的 ID 标记为失败。

**另请参阅：**[AI 模型](/zh-Hans/guide/ai-models#check-models)、[LLM 提供商](/zh-Hans/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**概要：** `ai-i18n-tools list-models`

列出活动提供商通过其 `GET /models` 列表公布的所有模型（按 ID 排序；活动提供商遵循配置中的 `provider` 键，可通过 `-P` / `--provider` 覆盖）。需要该提供商的 API 密钥（无需密钥的提供商如 Ollama 则不需要）。当提供商返回定价信息时（例如 OpenRouter），还会显示提示/补全每 100 万个令牌的美元价格，并标记超出 `expiration_date` 的条目。当 `providers.cheaperinference.zeroDataRetention` 为 true 时，列表为 `GET /v1/models?zdr=true`。

**主要选项：** `-P` / `--provider`

**另请参阅：**[AI 模型](/zh-Hans/guide/ai-models#list-models)、[LLM 提供商](/zh-Hans/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**概要:** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-price <usd>] [--min-delta <points>] [--refresh]`

对活跃提供商的聊天模型进行排名，并打印排名靠前的模型（默认为 8 个）。表格列依次为：排名、模型 ID、指数（质量分数乘以 100，保留一位小数）、测得的 languagebench ChrF、测得的 Arena 分数、输入价格、输出价格、每百万 token 的混合价格（美元）和前沿层级。缺失的测量值为 `—`。该命令需要该提供商的 API 密钥（对于 Ollama 等无密钥提供商则不需要）。活跃提供商遵循配置 `provider`；使用 `-P` / `--provider` 覆盖它。

候选模型来自提供商的 `GET /models` 列表。当 `providers.cheaperinference.zeroDataRetention` 为 true 时，该请求为 `GET /v1/models?zdr=true`。过期行和非聊天行（嵌入、语音、图像、视频、内容审核、重排器）将被排除。如果该目录请求失败，命令将以状态 1 退出。

指数仅代表质量：languagebench ChrF 和 Arena 分数。价格不属于指数的一部分。`--quality` 是默认值。它首先按指数排序，当两个模型显示相同指数时，则按更低的混合价格排序。`--price` 列出质量-价格帕累托前沿，最便宜的优先。当另一个模型的成本不更高，并且具有至少相同的指数，同时在价格上严格更便宜或在指数上严格更高时，该模型就被支配。混合价格和指数完全相同的模型共享同一层级。未被支配的模型是第 1 层，然后是第 2 层，依此类推。层级是该深度，而不是与最佳指数的距离。没有价格的模型，以及低于质量下限的模型，都遵循前沿。同时传递这两个标志是一个错误。两个都不传递则表示质量。配置中可选的 `modelSuggestion` 权重会替换任一配置文件的 ChrF/Arena 组合和质量下限。请参阅[配置](/zh-Hans/reference/configuration#modelsuggestion-optional)。[仪表板模型选项卡](/zh-Hans/guide/translation-dashboard/models) 使用相同的排名。

ChrF 是 languagebench `translation_from` 和 `translation_to` 行的平均值，其指标为 `chrf`，限于此项目的 `sourceLocale` 和 `targetLocales`。区域设置映射到 languagebench 语言代码（主子标签，带有一些别名，例如 `pt-BR` 到 `pt`，`zh-Hant` 到 `zh` 以及 `yue`）。空集使用 `en`。Arena 是 LMArena 的整体 Arena 分数，而非 Elo。

混合价格为每百万 token `(3 × input + output) / 4` 美元。它的来源按以下顺序解析：非零目录费率，然后是 models.dev 的输入和输出费率，然后是 languagebench 的单一成本数据。目录价格为 `0` 表示未定价，而非免费。未知价格不会改变指数。在 `--quality` 上，它在相同指数中排在最后。在 `--price` 上，清除了下限的未定价模型排在所有前沿层级之后。

缺失的 ChrF 排在质量下限之下。当 ChrF 或 Arena 缺失时使用的占位符值 `0.35` 和 `0.45` 仅影响指数；表格则打印 `—`。`frontier` 列对于清除下限的未被支配的定价模型为 `1`，对于下一层级为 `2`，当模型没有价格、低于下限或是一个别名时为 `—`。共享 ChrF、Arena 分数、输入价格和输出价格的两个 ID 是别名。保留较短的 ID，不带日期的 ID 优先于带日期的 ID (`preview-06-05`, `20241022`)。别名行保留在完整排名中，但不包含在表格、`--json` 和 `--apply` 中。`--list` 仍然显示它们。当打印的行包含被支配的模型时，表格下方的一行会列出击败它的第 1 层模型。

`--quality` 将通过下限的模型排在首位，然后是更高的指数，然后是更便宜的混合价格。`--top`（默认 `8`，一个至少为 1 的整数）在应用以下过滤器后，共同限制表格、`--json` 片段和 `--apply`。

`--list` 为活跃提供商配置的 `translationModels` 打印相同的列（按该顺序），并忽略 `--top`。排名列仍为每个模型在完整排名中的位置。配置中存在但目录中缺失、已过期或非聊天模型的 ID 仍会列出，测量值显示为 `—`。`--list` 不能与 `--apply` 结合使用。

别名行首先被移除，除非使用 `--list`。`--max-price` 然后保留每百万 token 的混合价格小于或等于该美元数量的模型。没有混合价格的模型被排除。`--min-delta` 然后遍历剩余的行，并且仅当其指数与之前保留的模型相差至少那么多点时才保留该模型。第一个剩余模型始终保留。`0` 的增量不会删除行。当增量大于 `0` 时，没有指数的行被排除。排名数字保持与完整列表中的一致。使用 `--list` 时，遍历遵循 `translationModels` 顺序并保留别名。这两个过滤器也适用于 `--json` 和 `--apply`。对于将要应用的质量列表，`--max-price` 在预算内保留一个备用，`--min-delta` 放弃一个小的指数步长。在上限下的被支配行可以保留；前沿列和表格下方的行会显示它。[模型选项卡](/zh-Hans/guide/translation-dashboard/models) 具有相同的两个控件，并且也省略别名。

`--json` 将此对象写入 stdout（将其粘贴到提供商块内），并将表格和归属页脚发送到 stderr：

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` 将当前配置复制到同级 `ai-i18n-tools.config.{timestamp}.backup.json`（如果 `-c` 指定了另一个文件，则复制到 `{name}.{timestamp}.backup.json`），然后用这些 ID 替换 `providers.<active>.translationModels`。发生名称冲突时，会在 `.backup.json` 之前添加 `-2`、`-3` 等。如果复制失败，配置文件将保持不变。`uiModels` 和 `localeModels` 保持不变。分数不会写入配置文件。仪表板的 **Update config** 按钮也会写入相同的备份。

基准数据缓存在 `<cacheDir>/benchmark-scores.json`（通常是 `.translation-cache/benchmark-scores.json`）七天。原始数据集在运行时下载，不随软件包提供。`--refresh` 会重新下载 languagebench、Arena 和 models.dev。在 `--refresh` 期间失败的源不会使用之前的缓存来填充。如果没有 `--refresh`，失败的下载会重用缓存的切片。如果 languagebench 或 Arena 中的一个失败，命令会使用另一个进行排名，并说明哪个源失败了。如果两者都失败，它会退出并返回 1。models.dev 失败会保留目录价格不变。仪表板没有刷新控件；从 CLI 运行 `--refresh`，然后重新加载“模型”选项卡。

页脚注明了 languagebench (CC BY-SA 4.0)、LMArena 竞技场评分 (CC BY 4.0) 和 models.dev (MIT)。

**关键选项:** `--quality`、`--price`、`--top`、`--json`、`--apply`、`--list`、`--max-price`、`--min-delta`、`--refresh`、`-P` / `--provider`

**另请参阅：**[AI 模型](/zh-Hans/guide/ai-models)、[“模型”选项卡](/zh-Hans/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**概要：** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

对每个已配置的模型进行基准测试，通过独立翻译一个样本来完成（单模型客户端，无回退链）。输出一个包含模型 ID、输入/输出 token 数、实际翻译耗时和 USD 成本的表格（对于不报告成本的提供商显示 `—`），以及汇总行和每个模型的失败情况。

模型默认为当前提供商的 `translationModels`、`uiModels` 和 `localeModels` ID 的并集（可通过 `--model` 覆盖）；样本默认为内置的英文 markdown 块（可通过 `--text` / `--file` 覆盖）；源语言/目标语言默认为配置的 `sourceLocale` 和第一个 `docs[]` 目标区域设置，回退到顶层 `targetLocales`（可通过 `--source` / `--target` 覆盖）。并行运行模型，受配置 `concurrency` 限制（默认为 4）；每个模型仍单独计时。需要当前提供商的 API 密钥。

**主要选项：** `--model`, `--text`, `--file`, `--source`, `--target`

**另请参阅：**[AI 模型](/zh-Hans/guide/ai-models#bench-models)

---

<a id="list-languages"></a>
### `list-languages`

**概要：** `ai-i18n-tools list-languages [search]`

列出内置 UI 语言目录（`data/ui-languages-complete.json`），以人类可读的表格形式呈现（代码、文本方向、英文名称、原生名称）。无需配置或 API 密钥。可传入可选的 `search` 搜索词，仅保留代码、原生名称、英文名称或方向中包含该词的条目（不区分大小写），例如 `list-languages portuguese`、`list-languages rtl`、`list-languages zh`。
