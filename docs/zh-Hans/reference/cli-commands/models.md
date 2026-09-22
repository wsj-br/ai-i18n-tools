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
