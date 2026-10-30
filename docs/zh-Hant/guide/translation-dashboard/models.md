<a id="models"></a>
# 模型

「**模型**」分頁會為現用供應商的對話模型進行排序，讓您不必手動複製 ID 即可選擇 `translationModels`。此分頁使用的排序方式與 [`suggest-models`](/zh-Hant/reference/cli-commands/models#suggest-models) 相同。如需逐步操作說明，以及瞭解清單為何包含多個模型，請參閱 [AI 模型](/zh-Hant/guide/ai-models)。

選擇 **品質** 或 **價格**。品質優先考慮 languagebench ChrF 和 Arena Score。價格則優先考慮較低的美元費率，同時維持一定的品質底線。當設定中包含多個供應商時，會出現 **供應商** 選單；預設值為啟動儀表板時所使用的供應商（`provider`，或在 `dashboard` 指令上的 `-P` / `--provider`）。變更供應商或優先順序會重新載入表格。選用的權重位於 [`modelSuggestion`](/zh-Hant/reference/configuration#modelsuggestion-optional) 中。

表格欄位包含重新排序控制項、核取方塊、排名、模型 ID、指數（加權分數乘以 100）、測量到的 ChrF、測量到的 Arena 分數，以及每 100 萬個權杖的輸入/輸出價格（美元）。遺失的測量值以破折號表示。排名數字表示模型在完整排名中的位置，位於下方篩選器之前。拖曳列的控點，或使用其向上和向下按鈕，以變更其在此表格中的位置。「**更新**」會再次載入排名順序。

這些控制項位於三個卡片中。**排名**包含優先順序選單（當配置有多個供應商時，也包含供應商選單）。**篩選器**包含**最大輸出價格**、**最小索引增量**和**更新**。**動作**包含**複製 JSON**和**更新配置**。在數字欄位中按下 Enter 鍵以重新整理表格。變更選單也會執行相同的動作。

「**最大輸出價格**」會保留每 100 萬個權杖的輸出價格最多為該美元數量的模型。沒有輸出價格的模型將被排除。「**最小指數差**」僅在模型的指數至少比前一個保留的模型低該點數時才保留該模型。第一個剩餘的模型總是會被保留。將任一欄位留空以跳過該篩選器。

勾選您想要的模型。狀態列會顯示已選取多少個，例如 `8 models selected.`。核取方塊欄標頭中的窄數字（預設為 8）表示該核取方塊選取了多少個開頭列。勾選它會選取這些列。清除它會清除所有核取方塊。從上到下勾選的列是備用順序。**更新配置**會要求確認，將目前的配置複製到其旁邊的 `ai-i18n-tools.config.{timestamp}.backup.json`，然後將該順序寫入 `providers.<selected>.translationModels`。`uiModels` 和 `localeModels` 保持不變。**複製 JSON**會將相同的 `{ "translationModels": [...] }` 片段放到剪貼簿。`suggest-models --apply` 會寫入相同類型的備份。

首次載入時，若快取為空，系統會下載 languagebench、Arena 和 models.dev，這可能需要一些時間。後續載入會重複使用位於 `<cacheDir>/benchmark-scores.json` 的 7 天快取。此頁籤沒有重新整理按鈕。請使用 CLI 指令 `ai-i18n-tools suggest-models --refresh` 重新整理快取，然後重新載入頁籤。相同的指令也可以列印或套用該清單。

::: info 外部基準測試來源
  分數是根據外部資料來源計算的：
  - [languagebench ChrF](https://languagebench.github.io/) 根據 CC-BY-SA-4.0 授權，
  - [LMArena Arena Score](https://github.com/lm-arena/lm-arena) 根據 CC-BY-4.0 授權，以及
  - [models.dev](https://models.dev/) 的價格根據 MIT 授權。
:::
