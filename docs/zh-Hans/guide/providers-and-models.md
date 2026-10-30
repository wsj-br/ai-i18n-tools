<a id="llm-providers"></a>
# LLM 提供商

每个翻译流水线 —— `translate-ui`、`translate-docs`、`translate-json` 和 `translate-svg` —— 都通过同一个与提供商无关的客户端将文本发送给 LLM。在这些命令运行之前，请在 `ai-i18n-tools.config.json` 中配置**至少一个提供商**，并在您的环境或 `.env` 中设置匹配的**API 密钥**（内置预设 **Ollama** 除外）。`init` 会写入一个初始的 `provider` / `providers` 块；您仍需为当前使用的预设提供凭据。

您只需在配置中一次性配置**要调用的 API 端点**；所有翻译命令都会共享该设置以及同一个 SQLite 缓存。提供商尝试使用哪些模型是另一个单独的步骤：[AI 模型](/zh-Hans/guide/ai-models)。

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

<a id="zero-data-retention-cheaper-inference"></a>
### 零数据保留（更便宜的推理）

`providers.cheaperinference.zeroDataRetention` 是可选的，默认关闭。当此项目必须仅通过不保留提示的提供商发送提示时，请设置此项。

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

启用此标志后，每个聊天请求都包含 `"zdr": true`，并且 `list-models`、`check-models` 和 `suggest-models`（包括仪表板的“模型”选项卡）会读取 `GET /v1/models?zdr=true`。该目录列出了零数据保留请求可以使用的模型，并提供了零数据保留价格。`check-models` 会将该目录中缺失的 ID 视为无效。此标志不会为目录中未包含的模型创建路由。请从 `translationModels`、`uiModels` 或 `localeModels` 中移除该 ID。

当 Cheaper Inference 账户不需要零数据保留时，请关闭此标志。如果账户已启用 [数据保护](https://platform.cheaperinference.com/dashboard/data-protection)，Cheaper Inference 仍会拒绝没有零数据保留路由的模型。错误会指明该模型。为保留账户策略，请将 `zeroDataRetention` 设置为 `true`，并切换到零数据保留目录中的模型。为保留被拒绝的模型，请在该页面上关闭零数据保留。回退链会尝试下一个配置的模型。

<a id="models"></a>
### 模型

有关选择模型、备用列表以及 `suggest-models`、`check-models`、`list-models` 和 `bench-models` 的信息，请参阅 [AI 模型](/zh-Hans/guide/ai-models)。

<a id="multiple-providers"></a>
### 多个提供商

当配置了多个提供商时，设置顶级`provider`键以选择默认提供商。无需编辑配置即可在每次运行中切换：

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

每个提供程序块可以定义自己的 `translationModels`、可选的 `uiModels` 和 `localeModels`、`maxTokens`、`temperature`，以及 `requestTimeout`（秒）或 `requestTimeoutMs`。提供程序上的超时会覆盖顶级的 `requestTimeout` / `requestTimeoutMs`。仍然接受旧版的顶级 `openrouter` 块，并在加载时自动迁移到 `providers.openrouter`。

可选的 `pricing` 和 `modelPricing` 设置每百万令牌的美元成本（`inputPerMTokens` 和 `outputPerMTokens`），当提供商省略 `usage.cost` 时。`pricing` 是提供商范围内的默认值；一个 `modelPricing` 条目会覆盖单个模型 ID 的设置。OpenRouter 和 Cheaper Inference 已返回每次调用的成本，因此请在这些提供商上将两者都留空。提供商报告的成本将按原样保留。该金额包含在翻译摘要中，[`usage`](/zh-Hans/reference/cli-commands/workflows#usage) 和 [使用情况和成本](/zh-Hans/guide/translation-dashboard/usage)。

针对同一文档使用四个提供商的可运行示例，包含示例费率：[`examples/multi-provider`](/zh-Hans/examples#multi-provider)。

<a id="further-reference"></a>
### 更多参考

- [AI 模型](/zh-Hans/guide/ai-models) — 排名候选列表、备用列表和模型命令。
- [配置 — `provider` 和 `providers`](/zh-Hans/reference/configuration#provider-and-providers) — 预设表、自定义端点、请求超时、成本费率、Cheaper Inference 零数据保留、OpenRouter 特定行为。
- [架构 — LLM 客户端](/zh-Hans/reference/architecture) — 模型备用、批处理和成本报告的内部工作原理。
- [环境变量](/zh-Hans/reference/environment-variables) — API 密钥环境变量和基础 URL 覆盖。
