<a id="ai-models"></a>
# AI 模型

模型是提供商上的一个命名系统，例如 `google/gemini-2.5-flash` 或 `gpt-5-mini`。`init` 会为您选择的提供商编写一个初始的 `translationModels` 列表。请将该列表视为一个起点。

使用 `suggest-models` 或在翻译信息中心的 **模型** 下使用相同的排名，为该项目选择列表。两者都会根据已发布的基准对当前提供商的聊天模型进行排名，并可将结果写入 `translationModels`。请先设置提供商及其 API 密钥：[LLM 提供商](/zh-Hans/guide/providers-and-models)。

<a id="start-with-a-ranked-list"></a>
## 从排名列表开始

<a id="from-the-command-line"></a>
### 从命令行

`suggest-models` 对当前活跃提供商提供的聊天模型进行排名，并打印一个简短的表格。质量是默认设置：该指数是 languagebench ChrF 和 Arena Score。价格是一个单独的列和排序顺序，不属于该指数。

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --top 10 --max-price 6
```

列包括排名、模型 ID、索引、测量的 ChrF、测量的 Arena Score、输入价格、输出价格、每百万 token 的混合价格（美元）以及前沿层级。缺失的测量值为 `—`。索引是质量分数乘以 100。索引越高，表示与本项目语言的匹配度越强。如果某个 ID 的 ChrF、Arena Score 和 token 价格与另一行重复，则该 ID 不会显示在此表中。`--list` 仍会打印它。

当表格无误时，将该列表写入配置：

```bash
ai-i18n-tools suggest-models --apply
ai-i18n-tools suggest-models --apply --top 10 --max-price 6
```

`--apply` 替换 `providers.<active>.translationModels`。它首先将当前配置复制到同级 `ai-i18n-tools.config.{timestamp}.backup.json`。`uiModels` 和 `localeModels` 保持不变。`--top`（默认为 8）是表格和 `--apply` 包含的 ID 数量。第一个 ID 是翻译首先尝试的 ID。对于该列表，添加 `--max-price` 和 `--min-delta`。价格上限可防止备用模型超出预算，而索引差距则会剔除与上方保留模型仅有一小步之遥的模型。

`--price` 首先列出质量-价格前沿上最便宜的模型，并且仍然保持质量底线，因此没有测量值的廉价模型会排在有分数的模型之后。`--quality` 是默认设置。同时传递这两个标志会报错。

<a id="from-the-dashboard"></a>
### 从仪表板

**模型** 标签页会显示相同的排名，每行都有一个复选框。

```bash
ai-i18n-tools dashboard
```

打开 **模型**。选择 **质量** 或 **价格**。选中您想要的行。选中行的顺序（从上到下）就是翻译功能将尝试的顺序。**更新配置** 会请求确认，写入同类备份，并将该顺序保存到 `translationModels`。当您希望自己粘贴时，**复制 JSON** 会将 `{ "translationModels": [...] }` 片段放到剪贴板上。

**最大混合价格**和**最小指数差值**与`suggest-models --max-price`和`--min-delta`匹配。控件和列：[模型选项卡](/zh-Hans/guide/translation-dashboard/models)。

<a id="how-the-ranking-chooses"></a>
### 排名如何选择

该列表是提供商实时聊天目录的基准排名。首次运行会下载三个公共数据集，可能需要一些时间。后续运行会重用 7 天的缓存。

| 信号 | 贡献内容 | 来源 |
| --- | --- | --- |
| ChrF | 您项目语言的翻译质量 | [languagebench](https://huggingface.co/spaces/fair-forward/languagebench) (CC BY-SA 4.0) |
| Arena Score | 来自一对一比较的总体偏好 | [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0) |
| 每百万令牌美元 | 输入、输出和混合价格 `(3 × input + output) / 4` | 提供商发布费率时的目录，否则为 [models.dev](https://models.dev/) (MIT) |

根据这些信号，该排名会为每个候选模型得出两个值：质量指数（结合了 ChrF 和 Arena Score）和[帕累托前沿](https://en.wikipedia.org/wiki/Pareto_frontier)层级（根据混合令牌价格评估质量）。

ChrF 使用 languagebench 为您的 `sourceLocale` 和 `targetLocales` 提供的翻译分数。区域设置会映射到一个 languagebench 语言代码：主要子标签，以及诸如 `pt-BR` 到 `pt` 和 `zh-Hant` 到 `zh` 的别名。一个能很好地翻译这些语言的模型，其排名会高于一个仅在总体上得分较高的模型。嵌入、图像、语音和其他非聊天模型会被跳过，已过期的 ID 也是如此。

指标是 ChrF 和 Arena Score。价格不包含在内。分数权重 ChrF（默认 55%）和 Arena Score（默认 45%），每个分数都根据提供商聊天目录中的最高分数进行归一化，并四舍五入到 0-100 范围内的一位小数。替补值（ChrF 为 `0.35`，Arena 为 `0.45`）仅在缺少测量值时适用；表格会打印 `—`。

质量下限是 ChrF 的最低阈值（质量默认为候选池最佳 ChrF 的 70%，价格默认为 60%）。低于此下限的模型（包括任何没有 ChrF 测量的模型）会排在高于此下限的模型之后，并在“前沿”列中显示 `—`。质量（默认配置文件）按指标排序，并以更便宜的混合价格打破相同的指标。价格按前沿层级对模型进行排序（第 1 层最便宜，然后是第 2 层，依此类推）。可选的自定义权重和下限位于 [`modelSuggestion`](/zh-Hans/reference/configuration#modelsuggestion-optional) 中。

共享 ChrF、Arena Score、输入价格和输出价格的两个 ID 是别名。建议保留较短的 ID，以及不带日期的 ID（而不是带日期的 ID），例如 `preview-06-05` 或 `20241022`。其他 ID 保留在完整排名中，因此 `--list` 仍然可以显示已配置的别名，并且它们被排除在表格、`--json` 和 `--apply` 之外。

<a id="reading-the-frontier-column"></a>
#### 解读前沿列

“前沿”列是一个层级，而不是分数。当另一个模型成本不高于（混合价格）且指标至少相同，并且在指标上严格更便宜或严格更高时，该模型就被支配。`2` 并不比 `1` 差两倍，层级数字不比较行之间的质量：只有指标才能做到这一点。两行可以显示 `3` 和 `4`，并且仍然与击败它们的第 1 层模型相差一个点。

- `1` 表示没有其他模型在指标上既更便宜又更高。在 `--price` 上，第 1 层从最便宜到最贵排列，每一步成本更高且指标更高。`--min-delta` 隐藏了一个只带来微小增益的步骤。
- `2` 表示该模型被支配，但仅被第 1 层模型支配。表格下方的行会列出击败每个被支配行的第 1 层模型。将鼠标悬停在仪表板中的值上以查看相同的模型。
- `3` 及更高层级遵循相同的规则，再往下推一步。数字越高，链条越长，而不是指标离最佳模型越远。
- `—` 表示该模型没有价格，低于质量下限，或者是另一行的别名。它不参与比较。

第 1 层是效率检查：没有其他模型既严格更便宜又得分更高。更高的层级仍然可以出现在列表中。供应商多样性、速率限制、延迟和上下文窗口都在指标之外，当第 1 层模型受到速率限制或拒绝批处理时，来自其他供应商的备用方案仍然有所帮助。同一模型的另一个 ID 对此没有帮助。

非别名的精确平局（相同的混合价格和相同的指标，但令牌价格或分数不同）共享层级。指标按照表格中所示进行比较，四舍五入到一位小数。

层级是在整个目录中计算的，因此 `--max-price`、`--min-delta` 和 `--top` 会隐藏行而不会重新编号。在完整列表中为第 1 层的模型在价格上限后仍然是第 1 层。`--max-price` 会删除超出预算的模型。它不会删除上限下所有被支配的行。“前沿”列和表格下方的行会显示这些模型。

`--price` 会列出从最便宜到最贵的第 1 层，然后以同样的方式列出第 2 层，依此类推。质量（默认）按指标排序，并将“前沿”列视为标签。

`suggest-models --refresh` 会重新下载数据集。之后请重新加载 **模型** 选项卡。

所有标志（包括 `--json`、`--list`）和分数公式：[suggest-models](/zh-Hans/reference/cli-commands/models#suggest-models)。

<a id="why-the-list-has-more-than-one-model"></a>
## 为什么列表中有多个模型

<a id="model-fallback-chain"></a>
### 模型回退链

`translationModels` 是一个有序列表。CLI 会尝试第一个模型。如果请求失败、响应无法解析或文本的书写系统错误，它会尝试该批次的下一个 ID。

一个 ID 是一个单点故障。模型可能会超时、返回此工具拒绝的文本，或者一种语言翻译得好而另一种翻译得差。一个常见情况是罗马化印地语，其中 `hi` 期望天城文。原生脚本区域设置会拒绝罗马化输出。应保持罗马化的区域设置需要一个显式的 `-Latn` 子标签，例如 `hi-Latn`。

这就是为什么该列表包含多个 ID，最强的优先。列表中的顺序是翻译尝试的顺序。

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

来自 `init` 的预设列表，以及字段参考：[配置 —](/zh-Hans/reference/configuration#provider-and-providers) `provider` [和](/zh-Hans/reference/configuration#provider-and-providers) `providers`。

<a id="check-list-and-benchmark"></a>
## 检查、列出和基准测试

一旦列表已在配置中，这些命令会检查它。您使用这些命令之前，翻译即可运行。

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

命令详情：[CLI — 模型和语言](/zh-Hans/reference/cli-commands/models)。

<a id="further-reference"></a>
## 进一步参考

- [LLM 提供商](/zh-Hans/guide/providers-and-models) — 预设、API 密钥以及使用 `-P` 切换提供商。
- [模型选项卡](/zh-Hans/guide/translation-dashboard/models) — 仪表板中的相同排名。
- [配置 —](/zh-Hans/reference/configuration#provider-and-providers) `provider` [和](/zh-Hans/reference/configuration#provider-and-providers) `providers` — `translationModels`、`uiModels`、`localeModels`、超时和成本费率。
- [suggest-models](/zh-Hans/reference/cli-commands/models#suggest-models) — 标志、过滤器和分数公式。

::: info 外部基准来源
分数根据外部数据源计算：

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) 采用 CC-BY-SA-4.0 许可，
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) 采用 CC-BY-4.0 许可，以及
- [models.dev](https://models.dev/) 价格采用 MIT 许可。
:::
