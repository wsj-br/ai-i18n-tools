<a id="models"></a>
# 模型

**模型** 頁籤會針對目前供應商的聊天模型進行排名，讓您無需手動複製 ID 即可選擇 `translationModels`。它採用與 [`suggest-models`](/zh-Hant/reference/cli-commands/models#suggest-models) 相同的排名方式。

選擇 **品質** 或 **價格**。品質優先考慮 languagebench ChrF 和 Arena Score。價格則優先考慮較低的美元費率，同時維持一定的品質底線。當設定中包含多個供應商時，會出現 **供應商** 選單；預設值為啟動儀表板時所使用的供應商（`provider`，或在 `dashboard` 指令上的 `-P` / `--provider`）。變更供應商或優先順序會重新載入表格。選用的權重位於 [`modelSuggestion`](/zh-Hant/reference/configuration#modelsuggestion) 中。

表格欄位包含排名、模型 ID、索引（加權分數乘以 100）、測得的 ChrF、測得的 Arena Score，以及每百萬代幣的美元輸入/輸出價格。遺失的測量值會以破折號表示。排名數字代表模型在完整排名中的位置，位於下方篩選條件之前。

**最高輸出價格** 會保留每百萬代幣輸出價格不高於該金額（美元）的模型。沒有輸出價格的模型將被排除。**最小索引差值** 僅在模型的索引比前一個保留的模型低至少該分數時才保留該模型。第一個剩餘的模型將始終被保留。將任一欄位留空即可跳過該篩選條件。變更任一數值都會重新載入表格。

勾選您要的模型。**使用前 N 個**（預設為 5）會選取篩選後清單的前 N 列並重設其順序。向上或向下移動選取的 ID 以設定備援順序。**更新設定** 會將該順序寫入 `providers.<selected>.translationModels`，並保持 `uiModels` 和 `localeModels` 不變。**複製 JSON** 會將相同的 `{ "translationModels": [...] }` 片段放入剪貼簿。

首次載入時，若快取為空，系統會下載 languagebench、Arena 和 models.dev，這可能需要一些時間。後續載入會重複使用位於 `<cacheDir>/benchmark-scores.json` 的 7 天快取。此頁籤沒有重新整理按鈕。請使用 CLI 指令 `ai-i18n-tools suggest-models --refresh` 重新整理快取，然後重新載入頁籤。相同的指令也可以列印或套用該清單。

頁尾標註了 languagebench (CC BY-SA 4.0)、LMArena Arena Score (CC BY 4.0) 以及 models.dev (MIT)。
