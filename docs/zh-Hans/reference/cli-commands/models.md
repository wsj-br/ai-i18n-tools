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

**概要：** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

对活跃提供商的聊天模型进行排名，并打印排名靠前的模型（默认为 8 个）。表格列的顺序为：排名、模型 ID、指数（加权分数乘以 100，保留一位小数）、测量的 languagebench ChrF、测量的 Arena 分数，以及每 100 万个 token 的输入和输出价格（美元）。缺失的测量值为 `—`。该命令需要该提供商的 API 密钥（对于 Ollama 等无密钥提供商则不需要）。活跃提供商遵循配置 `provider`；使用 `-P` / `--provider` 覆盖它。

候选模型来自提供商的 `GET /models` 列表。当 `providers.cheaperinference.zeroDataRetention` 为 true 时，该请求为 `GET /v1/models?zdr=true`。过期行和非聊天行（嵌入、语音、图像、视频、内容审核、重排器）将被排除。如果该目录请求失败，命令将以状态 1 退出。

`--quality` 是默认值。它优先考虑 ChrF 和 Arena 分数而非价格。`--price` 优先考虑价格而非这些分数，并且仍保持质量下限，这样未经测量的廉价模型就不会获得不应有的高排名。同时传递这两个标志会报错。两个都不传递则表示质量。配置中可选的 `modelSuggestion` 权重会替换任一配置方案。请参阅[配置](/zh-Hans/reference/configuration#modelsuggestion-optional)。控制面板的[“模型”选项卡](/zh-Hans/guide/translation-dashboard/models)也使用相同的权重。

ChrF 是 languagebench `translation_from` 和 `translation_to` 行的平均值，其指标为 `chrf`，限于此项目的 `sourceLocale` 和 `targetLocales`。区域设置映射到 languagebench 语言代码（主子标签，带有一些别名，例如 `pt-BR` 到 `pt`，`zh-Hant` 到 `zh` 以及 `yue`）。空集使用 `en`。Arena 是 LMArena 的整体 Arena 分数，而非 Elo。

排名价格为每 1M 令牌 `(3 × input + output) / 4` 美元。其来源按以下顺序解析：非零目录费率，然后是 models.dev 的输入和输出费率，最后是 languagebench 的单一成本数据。目录价格为 `0` 表示未定价，而非免费。未知价格在质量概况上是中性的，在价格概况上是最差的。

缺失的 ChrF 会在排序时低于质量下限。当 ChrF 或 Arena 缺失时使用的占位符值 `0.35` 和 `0.45` 仅影响索引；表格会改为打印 `—`。

达到最低要求的行优先显示，其次是指数较高的，然后是混合价格更低的。`--top`（默认为 `8`，一个至少为 1 的整数）在应用以下筛选器后，共同限制表格、`--json` 片段和 `--apply`。

`--list` 为活跃提供商配置的 `translationModels` 打印相同的列（按该顺序），并忽略 `--top`。排名列仍为每个模型在完整排名中的位置。配置中存在但目录中缺失、已过期或非聊天模型的 ID 仍会列出，测量值显示为 `—`。`--list` 不能与 `--apply` 结合使用。

`--max-output-price` 保留每百万 token 输出价格小于或等于该金额（美元）的模型。没有输出价格的模型将被排除。`--min-delta` 随后遍历剩余行，仅当模型的索引比上一个保留模型的索引低至少该点数时才保留该模型。第一个剩余模型始终被保留。增量为 `0` 时不会丢弃行。当增量大于 `0` 时，没有索引的行将被排除。排名数字保持完整列表中的数字。使用 `--list` 时，遍历遵循 `translationModels` 顺序。这两个过滤器也适用于 `--json` 和 `--apply`。[Models tab](/zh-Hans/guide/translation-dashboard/models) 具有相同的两个控件。

`--json` 将此对象写入 stdout（将其粘贴到提供商块内），并将表格和归属页脚发送到 stderr：

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` 将当前配置复制到同级 `ai-i18n-tools.config.{timestamp}.backup.json`（如果 `-c` 指定了另一个文件，则复制到 `{name}.{timestamp}.backup.json`），然后用这些 ID 替换 `providers.<active>.translationModels`。发生名称冲突时，会在 `.backup.json` 之前添加 `-2`、`-3` 等。如果复制失败，配置文件将保持不变。`uiModels` 和 `localeModels` 保持不变。分数不会写入配置文件。仪表板的 **Update config** 按钮也会写入相同的备份。

基准数据缓存在 `<cacheDir>/benchmark-scores.json`（通常是 `.translation-cache/benchmark-scores.json`）七天。原始数据集在运行时下载，不随软件包提供。`--refresh` 会重新下载 languagebench、Arena 和 models.dev。在 `--refresh` 期间失败的源不会使用之前的缓存来填充。如果没有 `--refresh`，失败的下载会重用缓存的切片。如果 languagebench 或 Arena 中的一个失败，命令会使用另一个进行排名，并说明哪个源失败了。如果两者都失败，它会退出并返回 1。models.dev 失败会保留目录价格不变。仪表板没有刷新控件；从 CLI 运行 `--refresh`，然后重新加载“模型”选项卡。

页脚注明了 languagebench (CC BY-SA 4.0)、LMArena 竞技场评分 (CC BY 4.0) 和 models.dev (MIT)。

**主要选项：** `--quality`、`--price`、`--top`、`--json`、`--apply`、`--list`、`--max-output-price`、`--min-delta`、`--refresh`、`-P` / `--provider`

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
