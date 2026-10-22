<a id="models"></a>
# 模型

**模型** 选项卡会对当前提供商的聊天模型进行排名，以便您可以选择 `translationModels`，而无需手动复制 ID。它使用与 [`suggest-models`](/zh-Hans/reference/cli-commands/models#suggest-models) 相同的排名方式。

选择 **质量** 或 **价格**。质量优先考虑 languagebench ChrF 和竞技场评分 (Arena Score)。价格优先考虑较低的美元费率，同时保持一定的质量底线。当配置中有多个提供商时，会出现 **提供商** 菜单；默认值为启动仪表板时所用的提供商（`provider`，或 `dashboard` 命令上的 `-P` / `--provider`）。更改提供商或优先级会重新加载表格。可选权重位于 [`modelSuggestion`](/zh-Hans/reference/configuration#modelsuggestion) 中。

表格列包括排名、模型 ID、索引（加权分数乘以 100）、测得的 ChrF、测得的竞技场评分，以及每百万 token 的美元输入/输出价格。缺失的测量值显示为破折号。排名数字是模型在完整排名中的位置，位于下方过滤器之前。

**最高输出价格** 会保留每百万 token 输出价格不超过该美元金额的模型。没有输出价格的模型会被排除。**最小索引差值** 仅在模型的索引比上一个保留模型低至少这么多点时才保留该模型。第一个剩余的模型始终会被保留。将任一框留空即可跳过该过滤器。更改任一值都会重新加载表格。

勾选您想要的模型。**使用前 N 个**（默认 5）会选择过滤列表中前 N 行并重置其顺序。向上或向下移动选定的 ID 以设置回退顺序。**更新配置** 会将该顺序写入 `providers.<selected>.translationModels`，并保持 `uiModels` 和 `localeModels` 不变。**复制 JSON** 会将相同的 `{ "translationModels": [...] }` 片段放入剪贴板。

首次加载会在缓存未命中时下载 languagebench、Arena 和 models.dev，可能需要一些时间。后续加载会重复使用位于 `<cacheDir>/benchmark-scores.json` 的 7 天缓存。该选项卡没有刷新按钮。请使用 `ai-i18n-tools suggest-models --refresh` 从 CLI 刷新缓存，然后重新加载选项卡。同一命令可以打印或应用该列表。

页脚注明了 languagebench (CC BY-SA 4.0)、LMArena 竞技场评分 (CC BY 4.0) 和 models.dev (MIT)。
