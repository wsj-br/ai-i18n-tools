<a id="models"></a>
# 模型

「**模型**」分頁會為現用供應商的對話模型進行排序，讓您不必手動複製 ID 即可選擇 `translationModels`。此分頁使用的排序方式與 [`suggest-models`](/zh-Hant/reference/cli-commands/models#suggest-models) 相同。如需逐步操作說明，以及瞭解清單為何包含多個模型，請參閱 [AI 模型](/zh-Hant/guide/ai-models)。

頁面分為兩個窗格。**目前組態**是已為所選供應商儲存的備援鏈。第一列會優先嘗試。**建議**是您可以檢查、重新排序並寫回的排名目錄。變更供應商或優先順序會重新載入兩個窗格。即使組態中缺少某個 ID，它仍會顯示在**目前組態**中，並標示為不在目錄中。

選擇**品質**或**價格**。品質會依 ChrF 和 Arena 索引排序，並將「前沿」欄位視為標籤。價格會將第 1 層從最便宜到最貴列出，然後以相同方式列出第 2 層，依此類推。它仍會保持品質下限，因此沒有測量的廉價模型會排在有分數的模型之下。當組態有多個供應商時，會出現**供應商**選單；預設值是啟動儀表板時所用的供應商 (`provider`，或在 `dashboard` 命令上使用 `-P` / `--provider`)。選用權重位於 [`modelSuggestion`](/zh-Hant/reference/configuration#modelsuggestion-optional)。

兩個窗格共用分數和價格欄位：模型 ID、索引 (品質分數乘以 100)、測量的 ChrF、測量的 Arena 分數、輸入價格、輸出價格、每 1M 權杖的混合價格 (美元)，以及前沿層級。缺少測量值時會顯示一個長破折號。將滑鼠游標懸停在任一窗格的欄位標頭上，即可查看該欄位的簡短說明。將滑鼠游標懸停在 2 或更高的前沿值上，即可查看哪個第 1 層模型主導該列。該數字表示該鏈的深度，而不是索引與最佳模型的距離。重複另一列的 ChrF、Arena 分數和權杖價格的 ID 會從**建議**中省略。較短的 ID 會保留，且沒有日期的 ID 會優先於有日期的 ID。已設定的別名仍會顯示在**目前組態**中。混合價格和索引完全相同時，會共用層級。如何閱讀該欄位：[閱讀前沿欄位](/zh-Hant/guide/ai-models#reading-the-frontier-column)。

**目前組態**會新增一個順序欄位。該數字是模型在儲存鏈中的位置。

**建議**會新增重新排序控制項、核取方塊和排名。排名數字是模型在完整排名中的位置，位於下方篩選器之前。拖曳列的控點，或使用其向上和向下按鈕，以變更其在此表格中的位置。**更新**會再次載入排名順序。

控制項位於三個卡片中。**排名** 包含優先順序選單 (以及當配置有多個供應商時的供應商選單)。**篩選器** 包含 **最大混合價格**、**最小指數差** 和 **更新**。**動作** 包含 **複製 JSON** 和 **更新配置**。在數字欄位中按下 Enter 鍵以重新整理表格。變更選單也會執行相同的動作。

**最大混合價格**會保留混合價格`(3 × input + output) / 4`每 100 萬個權杖最多為該美元數量的模型。沒有混合價格的模型將被省略。**最小指數差異**僅當模型的指數與前一個保留的模型至少相差該點數時才保留該模型。第一個剩餘的模型始終保留。將任一欄位留空以跳過該篩選器。在品質排名中，在**更新組態**之前設定兩者：價格上限將備用方案保持在預算內，而指數差距會捨棄與其上方模型僅相差一小步的模型。在上限下被主導的列仍可保留。前沿欄位會顯示此資訊。

勾選您想要的模型。狀態列會顯示已選取多少個，例如 `8 models selected.`。核取方塊欄標頭中的窄數字（預設為 8）表示該核取方塊選取了多少個開頭列。勾選它會選取這些列。清除它會清除所有核取方塊。從上到下勾選的列是備用順序。**更新配置**會要求確認，將目前的配置複製到其旁邊的 `ai-i18n-tools.config.{timestamp}.backup.json`，然後將該順序寫入 `providers.<selected>.translationModels`。`uiModels` 和 `localeModels` 保持不變。**複製 JSON**會將相同的 `{ "translationModels": [...] }` 片段放到剪貼簿。`suggest-models --apply` 會寫入相同類型的備份。

首次載入時，若快取為空，系統會下載 languagebench、Arena 和 models.dev，這可能需要一些時間。後續載入會重複使用位於 `<cacheDir>/benchmark-scores.json` 的 7 天快取。此頁籤沒有重新整理按鈕。請使用 CLI 指令 `ai-i18n-tools suggest-models --refresh` 重新整理快取，然後重新載入頁籤。相同的指令也可以列印或套用該清單。

::: info 外部基準來源
分數是根據外部資料來源計算的：

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) 依 CC-BY-SA-4.0 授權，
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) 依 CC-BY-4.0 授權，以及
- [models.dev](https://models.dev/) 價格依 MIT 授權。
:::
