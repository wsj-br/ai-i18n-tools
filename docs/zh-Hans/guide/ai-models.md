<a id="ai-models"></a>
# AI 模型

模型是提供商上的一个命名系统，例如 `google/gemini-2.5-flash` 或 `gpt-5-mini`。`init` 会为您选择的提供商编写一个初始的 `translationModels` 列表。请将该列表视为一个起点。

使用 `suggest-models` 或在翻译信息中心的 **模型** 下使用相同的排名，为该项目选择列表。两者都会根据已发布的基准对当前提供商的聊天模型进行排名，并可将结果写入 `translationModels`。请先设置提供商及其 API 密钥：[LLM 提供商](/zh-Hans/guide/providers-and-models)。

<a id="start-with-a-ranked-shortlist"></a>
## 从排名候选列表开始

<a id="from-the-command-line"></a>
### 从命令行

`suggest-models` 会对当前提供商目前提供的聊天模型进行排名，并打印一个简短的表格。默认按质量排名：翻译测量值和通用偏好分数比价格更重要。

```bash
ai-i18n-tools suggest-models
```

列包括排名、模型 ID、指数、测量的 ChrF、测量的 Arena 分数，以及每 100 万个令牌的输入和输出价格（以美元计）。缺失的测量值显示为 `—`。指数是加权分数乘以 100。在质量排名中，指数越高，表示与该项目的匹配度越高。

当表格看起来正确时，将该候选列表写入配置中：

```bash
ai-i18n-tools suggest-models --apply
```

`--apply` 会替换 `providers.<active>.translationModels`。它会先将当前配置复制到同级的 `ai-i18n-tools.config.{timestamp}.backup.json` 文件中。`uiModels` 和 `localeModels` 保持不变。`--top`（默认为 8）是表格和 `--apply` 包含的 ID 数量。第一个 ID 是翻译功能首先尝试的 ID。

`--price` 会优先选择费率较低的模型，但仍会保持质量底线，因此没有测量值的廉价模型会排在有分数的模型之后。`--quality` 是默认设置。同时传递这两个标志会引发错误。

<a id="from-the-dashboard"></a>
### 从仪表板

**模型** 标签页会显示相同的排名，每行都有一个复选框。

```bash
ai-i18n-tools dashboard
```

打开 **模型**。选择 **质量** 或 **价格**。选中您想要的行。选中行的顺序（从上到下）就是翻译功能将尝试的顺序。**更新配置** 会请求确认，写入同类备份，并将该顺序保存到 `translationModels`。当您希望自己粘贴时，**复制 JSON** 会将 `{ "translationModels": [...] }` 片段放到剪贴板上。

**最高输出价格** 和 **最小指数增量** 与 `suggest-models --max-output-price` 和 `--min-delta` 相匹配。控件和列：[“模型”标签页](/zh-Hans/guide/translation-dashboard/models)。

<a id="how-the-ranking-chooses"></a>
### 排名选择方式

该候选列表是提供商实时聊天产品目录的基准排名。首次运行会下载三个公共数据集，可能需要一些时间。后续运行会重复使用位于 `<cacheDir>/benchmark-scores.json`（通常是 `.translation-cache/benchmark-scores.json`）的 7 天缓存。

| 信号 | 贡献内容 | 来源 |
| --- | --- | --- |
| ChrF | 您项目所用语言的翻译质量 | [languagebench](https://languagebench.github.io/) (CC BY-SA 4.0) |
| Arena 分数 | 来自一对一比较的总体偏好 | [LMArena Arena Score](https://github.com/lm-arena/lm-arena) (CC BY 4.0) |
| 每 100 万个令牌的美元价格 | 输入和输出价格 | 提供商发布费率时的产品目录，否则为 [models.dev](https://models.dev/) (MIT) |

ChrF 使用 languagebench 为您的 `sourceLocale` 和 `targetLocales` 提供的翻译分数。区域设置会映射到一个 languagebench 语言代码：主要子标签，以及诸如 `pt-BR` 到 `pt` 和 `zh-Hant` 到 `zh` 的别名。一个能很好地翻译这些语言的模型，其排名会高于一个仅在总体上得分较高的模型。嵌入、图像、语音和其他非聊天模型会被跳过，已过期的 ID 也是如此。

“质量”是默认方案，其对 ChrF 和 Arena Score 的权重高于价格。“价格”方案则反之，但会保留上述的质量下限。可选权重请参阅 [`modelSuggestion`](/zh-Hans/reference/configuration#modelsuggestion)。

`suggest-models --refresh` 会重新下载数据集。之后请重新加载 **模型** 选项卡。

所有标志（包括 `--json`、`--list`）和分数公式：[suggest-models](/zh-Hans/reference/cli-commands/models#suggest-models)。

<a id="why-the-list-has-more-than-one-model"></a>
## 为什么列表包含多个模型

<a id="model-fallback-chain"></a>
### 模型回退链

`translationModels` 是一个有序列表。CLI 会尝试第一个模型。如果请求失败、响应无法解析或文本的书写系统错误，它会尝试该批次的下一个 ID。

单个 ID 是一个单点故障。模型可能会超时、返回此工具拒绝的文本，或将一种语言翻译得很好而另一种翻译得很差。一个常见的例子是罗马化的印地语，其中 `hi` 期望使用天城文。对于使用原生文字的区域设置，罗马化的输出会被拒绝。应保持罗马化的区域设置需要一个显式的 `-Latn` 子标签，例如 `hi-Latn`。

这就是为什么候选列表中包含多个 ID，并且最强的排在最前面。列表中的顺序就是翻译尝试的顺序。

**分辨率层级**（去重，保留顺序）:

| 管道 | 顺序 |
| --- | --- |
| UI (`translate-ui`, 复数, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| 文档，JSON，SVG | `localeModels(locale)` → `translationModels` |

大多数项目只设置 `translationModels`。当某一类文本或某一种语言应该首先尝试不同的模型时，才会使用另外两个列表。

**UI 字符串。** 可选的 `uiModels` 会在任何匹配的按区域设置的覆盖项之后、在 `translationModels` 之前尝试。UI 文案简短且可见，因此在该链上使用更强的模型是一种常见的区分处理方式。`suggest-models --apply` 只写入 `translationModels`。

**单个区域设置。** 可选的 `localeModels` 将一个 BCP-47 标签映射到模型，这些模型会在每个流水线中为该区域设置首先尝试（`pt-br` 匹配 `pt-BR`）。对于日语、韩语和中文，使用为这些文字调整过的模型（例如 `z-ai/glm-5.3` 和 `minimax/minimax-m2.7`）通常比使用通用后备模型效果更好。当没有条目匹配时，仅应用上述的流水线层级。

示例 (OpenRouter)。这些 ID 展示了这三个列表的结构。从 `suggest-models` 或 **模型** 选项卡中获取 `translationModels`。当 UI 文案或某个区域设置需要自己的链时，添加 `uiModels` 或 `localeModels`。

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "deepseek/deepseek-v4-flash",
        "openai/gpt-5-mini"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "ko", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hans", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hant", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] }
      ]
    }
  }
}
```

来自 `init` 的预设列表和字段参考：[配置 — `provider` 和 `providers`](/zh-Hans/reference/configuration#provider-and-providers)。

<a id="check-list-and-benchmark"></a>
## 检查、列出和基准测试

一旦候选列表在配置中，这些命令就会检查它。您可以在使用它们之前运行翻译。

<a id="check-models"></a>
### `check-models`

确认每个配置的 ID 仍由当前活动的提供商提供。

```bash
ai-i18n-tools check-models
```

它会调用提供商的 `GET /models` 端点，检查 `translationModels`、`uiModels` 和 `localeModels` 中的每个 ID，报告缺失或已过 `expiration_date` 的 ID，并在任何配置的 ID 无效时以非零值退出。当提供商公布价格时（OpenRouter 和 Cheaper Inference 会这样做），它还会显示每百万个令牌的美元价格。

<a id="list-models"></a>
### `list-models`

打印提供商公布的完整目录，按 ID 排序。用它来查找排名中遗漏的 ID。

```bash
ai-i18n-tools list-models
```

<a id="bench-models"></a>
### `bench-models`

单独通过每个配置的模型翻译一个示例，并打印输入和输出令牌、实际运行时间和美元成本。`suggest-models` 使用上述公布的分数。`bench-models` 会调用模型，因此会花费 API 信用额度，并显示您账户上的延迟和价格。

```bash
ai-i18n-tools bench-models
```

来自 `translationModels`、`uiModels` 和 `localeModels` 的每个唯一 ID 都会在没有后备模型的情况下运行。覆盖示例或 ID 以进行特定比较：

```bash
ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-5-mini,google/gemini-2.5-flash
```

为 Cheaper Inference 开启[零数据保留](/zh-Hans/guide/providers-and-models#cheaperinference-zero-data-retention)后，`check-models`、`list-models` 和 `suggest-models` 会读取 `GET /models?zdr=true`。

命令详情：[CLI — 模型和语言](/zh-Hans/reference/cli-commands/models)。

<a id="further-reference"></a>
## 更多参考

- [LLM 提供程序](/zh-Hans/guide/providers-and-models) — 预设、API 密钥以及使用 `-P` 切换提供程序。
- [模型选项卡](/zh-Hans/guide/translation-dashboard/models) — 仪表板中的相同排名。
- [配置 — `provider` 和 `providers`](/zh-Hans/reference/configuration#provider-and-providers) — `translationModels`、`uiModels`、`localeModels`、超时和成本费率。
- [suggest-models](/zh-Hans/reference/cli-commands/models#suggest-models) — 标志、筛选器和分数公式。
