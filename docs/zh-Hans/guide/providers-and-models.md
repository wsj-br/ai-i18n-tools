<a id="llm-providers-and-models"></a>
# LLM 提供商和模型

每个翻译流水线 —— `translate-ui`、`translate-docs`、`translate-json` 和 `translate-svg` —— 都通过同一个与提供商无关的客户端将文本发送给 LLM。在这些命令运行之前，请在 `ai-i18n-tools.config.json` 中配置**至少一个提供商**，并在您的环境或 `.env` 中设置匹配的**API 密钥**（内置预设 **Ollama** 除外）。`init` 会写入一个初始的 `provider` / `providers` 块；您仍需为当前使用的预设提供凭据。

您只需在配置中设置一次**要调用的 API 端点**和**要尝试的模型**；所有翻译命令都会共享该设置以及同一个 SQLite 缓存。

CLI从顶级`provider`键（或`providers`中唯一配置的条目）解析活动提供商。每个提供商块都列出了一个有序的`translationModels`回退链；内置预设自动继承`baseUrl`和API密钥环境变量（必要时可为每个提供商覆盖它们）。

<a id="built-in-providers"></a>
### 内置提供商

预设提供商键只需要`translationModels`——基本URL和API密钥环境变量会自动填充：

<div class="provider-presets">

| 提供商 | 基本 URL | API 密钥环境变量 |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `cheaperinference` | `https://api.cheaperinference.com/v1` | `CHEAPERINFERENCE_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (无) |

</div>

对于任何**非预设**键，请在配置中明确设置`baseUrl`和`apiKeyEnv`。

在您的环境或`.env`文件中设置活动提供商的API密钥。CLI会自动从工作目录加载`.env`，而不会覆盖shell中已设置的变量。请参阅[环境变量](/zh-Hans/reference/environment-variables)。

<a id="cheaperinference-zero-data-retention"></a>
### 零数据保留 (Cheaper Inference)

`providers.cheaperinference.zeroDataRetention` 是可选的，默认关闭。当此项目必须仅通过不保留提示的提供商发送提示时，请设置此项。

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

启用此标志后，每个聊天请求都包含 `"zdr": true`，并且 `list-models`、`check-models` 和 `suggest-models`（包括仪表板的“模型”选项卡）会读取 `GET /v1/models?zdr=true`。该目录列出了零数据保留请求可以使用的模型，并提供了零数据保留价格。`check-models` 会将该目录中缺失的 ID 视为无效。此标志不会为目录中未包含的模型创建路由。请从 `translationModels`、`uiModels` 或 `localeModels` 中移除该 ID。

当 Cheaper Inference 账户不需要零数据保留时，请关闭此标志。如果账户已启用 [数据保护](https://platform.cheaperinference.com/dashboard/data-protection)，Cheaper Inference 仍会拒绝没有零数据保留路由的模型。错误会指明该模型。为保留账户策略，请将 `zeroDataRetention` 设置为 `true`，并切换到零数据保留目录中的模型。为保留被拒绝的模型，请在该页面上关闭零数据保留。回退链会尝试下一个配置的模型。

<a id="model-fallback-chain"></a>
### 模型回退链

`translationModels` 是一个**有序列表**，而不是单一选择。CLI 会先尝试第一个模型；在请求、解析或脚本错误失败时，它会移动到下一个条目。请配置多个模型，这样短暂的故障或某个难以处理特定区域设置的模型（例如使用罗马化印地语而非天城文）就不会阻塞整个运行。对于原生脚本区域设置，罗马化输出会被拒绝；如果某个区域设置应保持罗马化，则必须使用显式的 `-Latn` 子标签进行配置（例如 `hi-Latn`）。

**分辨率层级**（去重，保留顺序）:

| 管道 | 顺序 |
| --- | --- |
| UI (`translate-ui`, 复数, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| 文档，JSON，SVG | `localeModels(locale)` → `translationModels` |

可选的 `providers.<active>.uiModels` 是一个仅在 UI 中使用的列表，在任何匹配的每种语言覆盖项之后和全局 `translationModels` 链之前尝试。可选的 `providers.<active>.localeModels` 将 BCP-47 语言环境映射到每个管道中为该语言环境**首先**尝试的模型（`pt-br` 匹配 `pt-BR`）。当没有 `localeModels` 条目匹配时，仅应用特定管道的层级。

不同的提供商和模型在跨语言的成本、速度和质量方面有所不同。将 `npx ai-i18n-tools init -P <provider>` 中的模型列表视为起点 — 当某个区域设置持续产生不佳结果时，对其进行扩展，或为该区域设置添加一个 `localeModels` 条目。预设列表和原理：[配置 — `provider` 和 `providers`](/zh-Hans/reference/configuration#provider-and-providers)。

**UI 字符串：** 可选的 `uiModels` 允许你在全局 `translationModels` 链之前，将 `translate-ui`、复数生成和 `proofread-ui` 路由到高级模型——这很有用，因为 UI 文案简短但面向用户。

**亚洲区域设置：** 在每个管道中，都会优先尝试针对 `ja`、`ko`、`zh-Hans` 和 `zh-Hant` 的可选 `localeModels` 条目；诸如 `z-ai/glm-5.3` 和 `minimax/minimax-m2.7` 等模型在处理中日韩文字时，通常比通用回退方案表现更好。

示例配置（OpenRouter）。`translationModels` 和 `uiModels` 是本仓库在 `ai-i18n-tools.config.json` 中使用的列表。`localeModels` 是针对 CJK 语言环境的可选推荐附加组件；本仓库未设置此项。

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3.7-max",
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4",
        "google/gemini-3.5-flash",
        "tencent/hy-mt2-30b-a3b",
        "mistralai/mistral-large",
        "openai/gpt-4o-mini",
        "cohere/command-r-plus-08-2024",
        "qwen/qwen-2.5-72b-instruct"  
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] }
      ]
    }
  }
}
```

<a id="validate-and-compare-models"></a>
### 验证和比较模型

在更改`translationModels`之前，请确认每个ID在活动提供商上仍然可用：

```bash
npx ai-i18n-tools check-models
```

`check-models` 调用提供商的 `GET /models` 端点，验证来自 `translationModels`、`uiModels` 和 `localeModels` 的每个 ID，报告缺失或超出 `expiration_date` 的 ID，并且当任何配置的 ID 无效时，以非零值退出。当提供商返回定价时（OpenRouter 和 Cheaper Inference 会这样做），它还会显示每 100 万个 token 的美元价格。启用 [`zeroDataRetention`](/zh-Hans/guide/providers-and-models#cheaperinference-zero-data-retention) 后，`check-models` 和 `list-models` 会使用 `GET /models?zdr=true`。

浏览提供商宣传的完整目录：

```bash
npx ai-i18n-tools list-models
```

在真实翻译样本上对已配置的模型进行基准测试 — `translationModels`、`uiModels` 和 `localeModels` 中的每个唯一 id 都会独立运行，以便你比较实际耗时、token 用量和成本：

```bash
npx ai-i18n-tools bench-models
```

请求一个排名简表（默认为质量，或 `--price`），并可选择将排名前列的 ID 写入 `translationModels`。[Models tab](/zh-Hans/guide/translation-dashboard/models) 显示相同的排名、筛选器和配置更新。

```bash
npx ai-i18n-tools suggest-models
npx ai-i18n-tools suggest-models --list
npx ai-i18n-tools suggest-models --max-output-price 2 --min-delta 2
npx ai-i18n-tools suggest-models --price --top 8 --json
npx ai-i18n-tools suggest-models --apply
npx ai-i18n-tools suggest-models --refresh
```

表格列包括排名、模型 ID、索引、测得的 ChrF、测得的 Arena 分数以及每百万 token 的输入/输出美元成本。缺失的测量值是 `—`。`--list` 打印 `translationModels` 中已有模型的这些列。`--max-output-price` 保留输出美元成本每百万 token 等于或低于该值的模型，并排除没有输出价格的模型。`--min-delta` 仅当模型的索引至少比上一个保留的模型低这么多点时才保留该模型。`--top`（默认值 8）在这些筛选器之后限制表格、`--json` 和 `--apply`。`--apply` 仅替换 `translationModels`。`--refresh` 重新下载 7 天基准测试缓存。可选权重是 [`modelSuggestion`](/zh-Hans/reference/configuration#modelsuggestion)。参见 [suggest-models](/zh-Hans/reference/cli-commands/models#suggest-models)。

覆盖示例文本、区域设置或模型列表：

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

命令详情：[CLI 参考](/zh-Hans/reference/cli-commands/)。

<a id="multiple-providers"></a>
### 多个提供商

当配置了多个提供商时，设置顶级`provider`键以选择默认提供商。无需编辑配置即可在每次运行中切换：

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

每个提供程序块可以定义自己的 `translationModels`、可选的 `uiModels` 和 `localeModels`、`maxTokens`、`temperature`，以及 `requestTimeout`（秒）或 `requestTimeoutMs`。提供程序上的超时会覆盖顶级的 `requestTimeout` / `requestTimeoutMs`。仍然接受旧版的顶级 `openrouter` 块，并在加载时自动迁移到 `providers.openrouter`。

当提供商省略 `usage.cost` 时，可选的 `pricing` 和 `modelPricing` 可设置每百万 token 的美元价格（`inputPerMTokens` 和 `outputPerMTokens`）。`pricing` 是提供商范围内的默认值；`modelPricing` 条目会覆盖特定模型 ID 的默认值。OpenRouter 和 Cheaper Inference 已经返回了单次调用的成本，因此在这些提供商上请勿设置两者。提供商报告的成本将按原样保留。该金额包含在翻译摘要、[`usage`](/zh-Hans/reference/cli-commands/workflows#usage) 和 [Usage & costs](/zh-Hans/guide/translation-dashboard/usage) 中。

针对同一文档使用四个提供商的可运行示例，包含示例费率：[`examples/multi-provider`](/zh-Hans/examples#multi-provider)。

<a id="further-reference"></a>
### 更多参考

- [配置 — `provider` 和 `providers`](/zh-Hans/reference/configuration#provider-and-providers) — 预设表、自定义端点、请求超时、成本费率、Cheaper Inference 零数据保留、OpenRouter 特定行为。
- [架构 — LLM 客户端](/zh-Hans/reference/architecture) — 模型回退、批处理和成本报告的内部工作原理。
- [环境变量](/zh-Hans/reference/environment-variables) — API 密钥环境变量和基础 URL 覆盖。
