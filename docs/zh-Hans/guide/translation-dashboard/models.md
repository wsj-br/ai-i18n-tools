<a id="models"></a>
# 模型

“**模型**”选项卡会对当前提供商的聊天模型进行排名，以便您选择 `translationModels`，而无需手动复制 ID。它使用的排名与 [`suggest-models`](/zh-Hans/reference/cli-commands/models#suggest-models) 中的排名相同。相关演练（包括该列表为何包含多个模型的原因）请参阅 [AI 模型](/zh-Hans/guide/ai-models)。

选择 **质量** 或 **价格**。质量优先考虑 languagebench ChrF 和 Arena Score。价格优先考虑较低的美元汇率，同时仍保持最低质量标准。当配置包含多个提供商时，会出现一个 **提供商** 菜单；默认值是启动仪表板时使用的提供商 (`provider`，或在 `dashboard` 命令上使用 `-P` / `--provider`)。更改提供商或优先级会重新加载表格。可选权重位于 [`modelSuggestion`](/zh-Hans/reference/configuration#modelsuggestion-optional) 中。

表格列包括重新排序控件、复选框、排名、模型 ID、指数（加权分数乘以 100）、测量的 ChrF、测量的 Arena 分数以及每 100 万个 token 的输入/输出价格（美元）。缺失的测量值显示为破折号。排名数字是模型在完整排名中的位置，在应用下面的筛选器之前。拖动行的句柄，或使用其上下按钮，以更改其在此表中的位置。**更新**会再次加载排名顺序。

控件位于三个卡片中。**排名**包含优先级菜单（如果配置有多个提供商，则还包含提供商菜单）。**筛选器**包含**最大输出价格**、**最小索引增量**和**更新**。**操作**包含**复制 JSON**和**更新配置**。在数字字段中按 Enter 键可刷新表格。更改菜单也会执行相同的操作。

**最大输出价格**保留每 100 万个 token 的输出价格最多为指定美元数的模型。没有输出价格的模型将被排除。**最小指数增量**仅当模型的指数至少比上一个保留的模型低指定点数时才保留该模型。第一个剩余模型始终保留。将任一框留空以跳过该筛选器。

勾选所需的模型。状态行显示已选择的数量，例如 `8 models selected.` 复选框列标题中的窄数字（默认为 8）表示该复选框选择的领先行数。勾选它会选择这些行。取消勾选它会清除所有复选框。从上到下勾选的行是回退顺序。**更新配置**会请求确认，将当前配置复制到其旁边的 `ai-i18n-tools.config.{timestamp}.backup.json`，然后将该顺序写入 `providers.<selected>.translationModels`。`uiModels` 和 `localeModels` 保持不变。**复制 JSON**会将相同的 `{ "translationModels": [...] }` 片段放入剪贴板。`suggest-models --apply` 会写入相同类型的备份。

首次加载会在缓存未命中时下载 languagebench、Arena 和 models.dev，可能需要一些时间。后续加载会重复使用位于 `<cacheDir>/benchmark-scores.json` 的 7 天缓存。该选项卡没有刷新按钮。请使用 `ai-i18n-tools suggest-models --refresh` 从 CLI 刷新缓存，然后重新加载选项卡。同一命令可以打印或应用该列表。

::: info 外部基准来源
  分数是根据外部数据源计算的：
  - [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench)，根据 CC-BY-SA-4.0 许可，
  - [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset)，根据 CC-BY-4.0 许可，以及
  - [models.dev](https://models.dev/) 的价格，根据 MIT 许可。
:::
