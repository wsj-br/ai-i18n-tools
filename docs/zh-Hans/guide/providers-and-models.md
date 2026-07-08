<a id="llm-providers-and-models"></a>
# LLM 提供商和模型

每个翻译管道——`translate-ui`、`translate-docs`、`translate-json`和`translate-svg`——都通过同一个与提供商无关的客户端将文本发送到LLM。您在`ai-i18n-tools.config.json`中配置**要调用哪个API端点**以及**要尝试哪些模型**；所有命令都共享该设置和相同的SQLite缓存。

CLI从顶级`provider`键（或`providers`中唯一配置的条目）解析活动提供商。每个提供商块都列出了一个有序的`translationModels`回退链；内置预设自动继承`baseUrl`和API密钥环境变量（必要时可为每个提供商覆盖它们）。

<a id="built-in-providers"></a>
### 内置提供商

预设提供商键只需要`translationModels`——基本URL和API密钥环境变量会自动填充：

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
| `ollama` | `http://localhost:11434/v1` | (无) |

对于任何**非预设**键，请在配置中明确设置`baseUrl`和`apiKeyEnv`。

在您的环境或`.env`文件中设置活动提供商的API密钥。CLI会自动从工作目录加载`.env`，而不会覆盖shell中已设置的变量。请参阅[环境变量](/reference/environment-variables)。

<a id="model-fallback-chain"></a>
### 模型回退链

`translationModels`是**有序列表**，而不是单一选择。CLI会尝试第一个模型；如果请求或解析失败，它会移到下一个条目。配置多个模型，这样瞬时中断或某个模型在特定区域设置下表现不佳时，就不会阻碍整个运行。

**分辨率层级**（去重，保留顺序）:

| 管道 | 顺序 |
| --- | --- |
| UI (`translate-ui`, 复数, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| 文档，JSON，SVG | `localeModels(locale)` → `translationModels` |

可选的 `providers.<active>.uiModels` 是一个仅在 UI 中使用的列表，在任何匹配的每种语言覆盖项之后和全局 `translationModels` 链之前尝试。可选的 `providers.<active>.localeModels` 将 BCP-47 语言环境映射到每个管道中为该语言环境**首先**尝试的模型（`pt-br` 匹配 `pt-BR`）。当没有 `localeModels` 条目匹配时，仅应用特定管道的层级。

不同的提供商和模型在不同语言的成本、速度和质量上有所不同。将 `npx ai-i18n-tools init` 提供的默认列表视为起点——当某个语言环境始终产生较差结果时，扩展该列表，或为该语言环境添加一个 `localeModels` 条目。完整的默认值和理由：[配置 — `provider` 和 `providers`](/reference/configuration#provider-and-providers)。

最小配置示例 (OpenRouter)：

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3-235b-a22b-2507",
        "openai/gpt-4o-mini",
        "deepseek/deepseek-v4-flash"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest"
      ],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
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

`check-models` 调用提供者的 `GET /models` 端点，验证来自 `translationModels`、`uiModels` 和 `localeModels` 的每个 id，报告缺失或超过 `expiration_date` 的 id，并在任何配置的 id 无效时以非零值退出。当提供者返回定价（OpenRouter 会这样做）时，它还会显示每 1M 个 token 的估计 USD。

浏览提供商宣传的完整目录：

```bash
npx ai-i18n-tools list-models
```

在真实翻译样本上对已配置的模型进行基准测试 — `translationModels`、`uiModels` 和 `localeModels` 中的每个唯一 id 都会独立运行，以便你比较实际耗时、token 用量和成本：

```bash
npx ai-i18n-tools bench-models
```

覆盖示例文本、区域设置或模型列表：

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

命令详情：[CLI参考](/reference/cli-commands)。

<a id="multiple-providers"></a>
### 多个提供商

当配置了多个提供商时，设置顶级`provider`键以选择默认提供商。无需编辑配置即可在每次运行中切换：

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

每个提供商块可以定义自己的 `translationModels`，可选的 `uiModels` 和 `localeModels`，`maxTokens`，`temperature` 和 `requestTimeoutMs`。仍然接受旧版顶级 `openrouter` 块，并在加载时自动迁移到 `providers.openrouter`。

在同一文档中使用四个提供程序的运行示例：[`examples/multi-provider`](/examples#multi-provider)。

<a id="further-reference"></a>
### 更多参考

- [配置 — `provider` 和 `providers`](/reference/configuration#provider-and-providers) — 预设表、自定义端点、请求超时、OpenRouter 特定行为。
- [架构 — LLM 客户端](/reference/architecture) — 模型回退、批处理和成本报告在内部如何工作。
- [环境变量](/reference/environment-variables) — API 密钥环境变量和基本 URL 覆盖。
