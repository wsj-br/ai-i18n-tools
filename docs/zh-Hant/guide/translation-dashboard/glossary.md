<a id="glossary"></a>
# 詞彙表

**詞彙表** 分頁用於編輯您的使用者詞彙表 CSV（設定中的 `glossary.userGlossary`）。此處的條目是提供給 `translate-ui`、`proofread-ui` 與 `translate-docs` 的術語提示（透過共享詞彙表）。精簡的 UI 標籤縮寫（例如 `Size` → `Tam` / `Tam.`）在 UI 翻譯時會被保留，但在建構文件提示詞時會被略過，因此它們不會促使模型在 markdown/MDX 中產生虛構的 <code v-pre>{{…}}</code> 權杖。

當未設定 `glossary.userGlossary` 時，此分頁會隱藏。

<a id="csv-columns"></a>
## CSV 欄位

| 欄位 | 意義 |
| --- | --- |
| **原始語言字串** | 來源術語或詞組 |
| **地區設定** | 目標地區設定，或所有地區設定的 `*` |
| **翻譯** | 首選翻譯 |
| **Context** | 預期含義或用法的可選來源語言說明。僅在此術語與目前批次相符時傳送。 |
| **強制** | 勾選時，術語必須完全按照給定的方式翻譯 |

<a id="add-a-row"></a>
## 新增一列

使用分頁頂部的表單：

1. 輸入 **Original**、**locale**（`*` 或目標地區代碼）以及 **Translation**。
2. 可選擇加入 **Context**（用法註記）並勾選 **Force**。
3. 點擊 **Add**。

如果 CSV 檔案尚不存在，則在首次新增時建立。

<a id="edit-or-delete"></a>
## 編輯或刪除

- **行內編輯** — 直接在表格中變更欄位，然後按一下該列上的**儲存**。
- **刪除** — 使用刪除控制項移除一列。

變更將於下次 `translate-ui`、`proofread-ui`、`translate-docs` 或 `sync` 執行時生效。編輯 **Context** 註記（或設定中的 `glossary.contextFiles`）會自動重新整理受影響地區的快取翻譯 — 您無需 `--force`。

請將上下文檔案保持為簡潔的 Markdown 或純文字簡述，並置於已翻譯的 `docs[]` 樹狀目錄之外。這些文字會在每次符合條件的請求時傳送給 LLM；請勿包含機密或個人資料。關於如何建立這些檔案與 CSV，請參閱[術語表](/zh-Hant/guide/glossary)。

<a id="filters"></a>
## 篩選器

依 **original text**、**locale**（包含 `*`）、**translation text** 或 **Context** 子字串進行篩選，然後點擊 **Apply**。

<a id="dashboard-edits-and-glossary-auto-add"></a>
## 儀表板編輯和詞彙表自動新增

當您在「**UI 字串**」或「**UI 複數**」分頁中修正 UI 字串時，如果 `glossary.autoAddUserEditedToGlossary` 為 `true`，則下一次 `translate-ui` 執行可以自動將該修正附加到詞彙表。使用「詞彙表」分頁來檢閱、調整或移除那些自動新增的列。
