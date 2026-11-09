<a id="models"></a>
# 模型

“**模型**”选项卡会对当前提供商的聊天模型进行排名，以便您选择 `translationModels`，而无需手动复制 ID。它使用的排名与 [`suggest-models`](/zh-Hans/reference/cli-commands/models#suggest-models) 中的排名相同。相关演练（包括该列表为何包含多个模型的原因）请参阅 [AI 模型](/zh-Hans/guide/ai-models)。

页面分为两个窗格。“**当前配置**”是为所选提供商存储的备用链。第一行优先尝试。“**建议**”是您可以查看、重新排序并写回的排名目录。更改提供商或优先级会重新加载两个窗格。目录中缺失的已配置 ID 仍会显示在“**当前配置**”中，并标记为不在目录中。

选择“**质量**”或“**价格**”。质量按 ChrF 和 Arena 指数排序，并将“前沿”列视为标签。价格按从低到高的顺序排列第 1 层，然后以相同方式排列第 2 层，依此类推。它仍然保持质量下限，因此没有测量值的廉价模型仍低于有分数的模型。当配置有多个提供商时，会出现“**提供商**”菜单；默认值是启动仪表板时使用的提供商（`provider`，或在 `dashboard` 命令上使用 `-P` / `--provider`）。可选权重位于 [`modelSuggestion`](/zh-Hans/reference/configuration#modelsuggestion-optional) 中。

两个窗格共享分数和价格列：模型 ID、指数（质量分数乘以 100）、测量的 ChrF、测量的 Arena 分数、输入价格、输出价格、每 100 万个令牌的美元混合价格以及前沿层级。缺失的测量值显示为长划线。将鼠标悬停在任一窗格的列标题上，可查看该列的简短说明。将鼠标悬停在 2 或更高的前沿值上，可查看哪个第 1 层模型在该行中占主导地位。该数字表示链的深度，而不是指数与最佳模型的距离。重复另一行 ChrF、Arena 分数和令牌价格的 ID 将从“**建议**”中排除。保留较短的 ID，不带日期的 ID 优先于带日期的 ID。已配置的别名仍会显示在“**当前配置**”中。混合价格和指数完全相同则共享层级。如何读取该列：[读取前沿列](/zh-Hans/guide/ai-models#reading-the-frontier-column)。

“**当前配置**”添加了一个“顺序”列。该数字是模型在存储链中的位置。

“**建议**”添加了重新排序控件、一个复选框和排名。排名数字是模型在完整排名中的位置，在下面的过滤器之前。拖动行的句柄，或使用其向上和向下按钮，以更改其在此表中的位置。“**更新**”会再次加载排名顺序。

控件位于三个卡片中。**排名**包含优先级菜单（当配置有多个提供商时，还包含提供商菜单）。**筛选器**包含**最大混合价格**、**最小指数增量**和**更新**。**操作**包含**复制 JSON**和**更新配置**。在数字字段中按 Enter 键可刷新表格。更改菜单也会执行相同的操作。

**最高混合价格**会保留混合价格`(3 × input + output) / 4`每百万个令牌最多为指定美元数的模型。没有混合价格的模型将被排除。**最小指数差值**仅在模型的指数与上一个保留模型至少相差指定点数时才保留该模型。第一个剩余模型始终保留。将任一框留空以跳过该筛选器。在质量排名上，在**更新配置**之前设置这两个选项：价格上限将备用模型保持在预算内，而指数差距会删除与上方模型仅相差一小步的模型。上限下的劣势行仍可能保留。前沿列会显示这一点。

勾选所需的模型。状态行显示已选择的数量，例如 `8 models selected.` 复选框列标题中的窄数字（默认为 8）表示该复选框选择的领先行数。勾选它会选择这些行。取消勾选它会清除所有复选框。从上到下勾选的行是回退顺序。**更新配置**会请求确认，将当前配置复制到其旁边的 `ai-i18n-tools.config.{timestamp}.backup.json`，然后将该顺序写入 `providers.<selected>.translationModels`。`uiModels` 和 `localeModels` 保持不变。**复制 JSON**会将相同的 `{ "translationModels": [...] }` 片段放入剪贴板。`suggest-models --apply` 会写入相同类型的备份。

首次加载会在缓存未命中时下载 languagebench、Arena 和 models.dev，可能需要一些时间。后续加载会重复使用位于 `<cacheDir>/benchmark-scores.json` 的 7 天缓存。该选项卡没有刷新按钮。请使用 `ai-i18n-tools suggest-models --refresh` 从 CLI 刷新缓存，然后重新加载选项卡。同一命令可以打印或应用该列表。

::: info 外部基准来源
分数根据外部数据源计算：

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) 采用 CC-BY-SA-4.0 许可，
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) 采用 CC-BY-4.0 许可，以及
- [models.dev](https://models.dev/) 价格采用 MIT 许可。
:::
