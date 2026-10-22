<a id="cli--models--languages"></a>
# CLI — 模型与语言

<a id="check-models"></a>
### `check-models`

**概要：** `ai-i18n-tools check-models`

针对当前活跃提供商的 `GET /models` 列表（成员资格和 `expiration_date`）验证每个已配置的模型 ID。需要该提供商的 API 密钥（对于像 Ollama 这样无需密钥的提供商则不需要）。当任何已配置的 ID 缺失或过期时以非零状态退出，并遵循解析后的请求超时时间（提供商上的 `requestTimeout` 或 `requestTimeoutMs`，否则使用顶级值）。当提供商返回定价信息（例如 OpenRouter）时，还会显示提示/补全每 100 万 token 的美元价格。

**另请参阅：** [LLM 提供商](/zh-Hans/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**概要：** `ai-i18n-tools list-models`

列出当前提供商通过其 `GET /models` 列表发布的所有模型（按 ID 排序；当前提供商遵循配置的 `provider` 键，可通过 `-P` / `--provider` 覆盖）。需要该提供商的 API 密钥（对于 Ollama 等免密钥提供商则无需）。当提供商返回定价信息时（例如 OpenRouter），还会显示每 100 万 token 的提示/补全 USD 价格，并标记超过 `expiration_date` 的条目。

**主要选项：** `-P` / `--provider`

**另请参阅：** [LLM 提供商](/zh-Hans/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**概要：** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

对当前活跃提供商的聊天模型进行排名并打印排名靠前的模型（默认为 5 个）。表格列依次为：排名、模型 ID、索引（加权分数乘以 100，保留一位小数）、测得的 languagebench ChrF、测得的 Arena 分数，以及每百万 token 的输入和输出价格（美元）。缺失的测量值显示为 `—`。该命令需要提供商的 API 密钥（对于 Ollama 等无需密钥的提供商则不需要）。活跃提供商遵循配置 `provider`；可使用 `-P` / `--provider` 进行覆盖。

候选模型来自提供商的 `GET /models` 列表。已过期的行和非聊天行（嵌入、语音、图像、视频、审核、重排序器）将被排除。如果目录请求失败，命令将以状态码 1 退出。

`--quality` 是默认设置。它将 ChrF 和 Arena 分数的权重置于价格之上。`--price` 将价格权重置于这些分数之上，同时保持质量底线，因此未测量的廉价模型不会跳到列表前面。同时传递两个标志会导致错误。不传递任何标志则表示按质量排序。配置中的可选 `modelSuggestion` 权重可替换任一配置文件。请参阅 [Configuration](/zh-Hans/reference/configuration#modelsuggestion)。相同的权重也用于 [dashboard Models tab](/zh-Hans/guide/translation-dashboard/models)。

ChrF 是 languagebench `translation_from` 和 `translation_to` 行的平均值，其指标为 `chrf`，仅限于此项目的 `sourceLocale` 和 `targetLocales`。区域设置映射到 languagebench 语言代码（主要子标签，包含一些别名，例如 `pt-BR` 到 `pt` 以及 `zh-Hant` 到 `zh` 和 `yue`）。空集使用 `en`。Arena 是 LMArena 的整体 Arena 分数，而非 Elo 分数。排名价格为每百万 token `(3 × input + output) / 4` 美元。价格来源依次为：非零目录费率、models.dev 输入和输出费率，最后是 languagebench 的单一成本数字。目录价格 `0` 表示未定价，而非免费。未知价格在质量配置文件中为中性，在价格配置文件中为最差。缺失的 ChrF 会排在质量底线之下。用于缺失 ChrF 或 Arena 的 `0.35` 和 `0.45` 替补值仅影响索引；表格中打印 `—` 代替。

清除底线的行优先，其次是更高的索引，然后是更便宜的混合价格。`--top`（默认 `5`，至少为 1 的整数）在应用下方的过滤器后，限制表格、`--json` 片段和 `--apply` 的显示数量。

`--list` 为活跃提供商配置的 `translationModels` 打印相同的列（按该顺序），并忽略 `--top`。排名列仍为每个模型在完整排名中的位置。配置中存在但目录中缺失、已过期或非聊天模型的 ID 仍会列出，测量值显示为 `—`。`--list` 不能与 `--apply` 结合使用。

`--max-output-price` 保留每百万 token 输出价格小于或等于该金额（美元）的模型。没有输出价格的模型将被排除。`--min-delta` 随后遍历剩余行，仅当模型的索引比上一个保留模型的索引低至少该点数时才保留该模型。第一个剩余模型始终被保留。增量为 `0` 时不会丢弃行。当增量大于 `0` 时，没有索引的行将被排除。排名数字保持完整列表中的数字。使用 `--list` 时，遍历遵循 `translationModels` 顺序。这两个过滤器也适用于 `--json` 和 `--apply`。[Models tab](/zh-Hans/guide/translation-dashboard/models) 具有相同的两个控件。

`--json` 将此对象写入 stdout（将其粘贴到提供商块内），并将表格和归属页脚发送到 stderr：

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply` 将 `providers.<active>.translationModels` 替换为这些 ID。`uiModels` 和 `localeModels` 保持不变。分数不会写入配置文件。

基准测试数据会缓存在 `<cacheDir>/benchmark-scores.json`（通常为 `.translation-cache/benchmark-scores.json`）中，有效期为 7 天。原始数据集在运行时下载，不会随软件包一同发布。`--refresh` 会重新下载 languagebench、Arena 和 models.dev。如果在 `--refresh` 期间某个源失败，则不会从之前的缓存中填充数据。如果没有 `--refresh`，下载失败时会复用缓存的切片。如果 languagebench 或 Arena 其中之一失败，该命令会使用另一个源进行排名，并指出哪个源失败。如果两者都失败，则退出代码为 1。models.dev 失败时会保留现有的目录价格。仪表板没有刷新控件；请从 CLI 运行 `--refresh`，然后重新加载“模型”（Models）选项卡。

页脚注明了 languagebench (CC BY-SA 4.0)、LMArena 竞技场评分 (CC BY 4.0) 和 models.dev (MIT)。

**主要选项：** `--quality`、`--price`、`--top`、`--json`、`--apply`、`--list`、`--max-output-price`、`--min-delta`、`--refresh`、`-P` / `--provider`

**另请参阅：** [LLM 提供商](/zh-Hans/guide/providers-and-models)、[模型选项卡](/zh-Hans/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**概要：** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

对每个已配置的模型进行基准测试，通过独立翻译一个样本来完成（单模型客户端，无回退链）。输出一个包含模型 ID、输入/输出 token 数、实际翻译耗时和 USD 成本的表格（对于不报告成本的提供商显示 `—`），以及汇总行和每个模型的失败情况。

模型默认为当前提供商的 `translationModels`、`uiModels` 和 `localeModels` ID 的并集（可通过 `--model` 覆盖）；样本默认为内置的英文 markdown 块（可通过 `--text` / `--file` 覆盖）；源语言/目标语言默认为配置的 `sourceLocale` 和第一个 `docs[]` 目标区域设置，回退到顶层 `targetLocales`（可通过 `--source` / `--target` 覆盖）。并行运行模型，受配置 `concurrency` 限制（默认为 4）；每个模型仍单独计时。需要当前提供商的 API 密钥。

**主要选项：** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**概要：** `ai-i18n-tools list-languages [search]`

列出内置 UI 语言目录（`data/ui-languages-complete.json`），以人类可读的表格形式呈现（代码、文本方向、英文名称、原生名称）。无需配置或 API 密钥。可传入可选的 `search` 搜索词，仅保留代码、原生名称、英文名称或方向中包含该词的条目（不区分大小写），例如 `list-languages portuguese`、`list-languages rtl`、`list-languages zh`。
