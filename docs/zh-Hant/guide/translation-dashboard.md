<a id="translation-dashboard"></a>
# 翻譯儀表板

執行：

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

預設的監聽埠是 **8675**。如果該埠無法使用，伺服器會嘗試下一個埠（最多嘗試 1000 次）並記錄所選的埠。已棄用的別名 `editor` 仍然可用，但會顯示警告 — 請優先使用 `dashboard`。

這會啟動一個由您設定的 `cacheDir` SQLite 資料庫支援的本機 Web UI — 這與 CLI 用於文件區段、日誌和相關中繼資料的資料夾相同。它包含以下標籤頁：**文件**（快取的文檔區段）、**UI 字串**、**UI 複數**、**詞彙表**、**失敗記錄**、**Markdown 問題** 和 **統計資料**。

![Translation Dashboard](/translation-dashboard.png)

如果您在此應用程式中 **編輯快取列**（例如文檔區段），請執行 `sync --force-update` 或等效的翻譯命令並加上 `--force-update`，以便磁碟上的輸出與快取一致；如果稍後儲存庫中的 **來源文字** 發生變更，區段雜湊值也會改變，先前的手動編輯將被取代。

<a id="failures-document-translation"></a>
### 失敗記錄（文件翻譯）

**失敗記錄** 標籤頁僅用於 **文件** 翻譯。它會讀取當某個區段無法成功翻譯成某種語言時寫入 SQLite 的失敗記錄 — 例如，模型輸出為空或無效、翻譯後驗證錯誤（`AST mismatch`、佔位符洩漏及類似的 **品質** 檢查），或阻礙進度的 **致命** 狀況。它能幫助您回答：*哪個來源區段出錯、是針對哪種語言和模型、以及記錄了什麼錯誤文字？*

<a id="when-to-use-it"></a>
#### 何時使用

- 在 `translate-docs` 或 `sync` 以錯誤、部分語言或令人困惑的日誌完成後 — 您可以排序和篩選失敗記錄，而不是僅僅滾動終端機輸出。
- 當您想 **優先處理返工** 時：按 **# 失敗記錄** 排序，以便在重試期間反覆失敗的區段優先顯示；這些是 **簡化或重新格式化** 來源 markdown 的良好候選對象，以確保將來執行成功。
- 當您需要 **確切的區段** — 檔案路徑、行號提示、來源雜湊值和完整的來源文字 — 以在您的儲存庫中編輯正確的段落時。

<a id="why-source-edits-matter"></a>
#### 為何來源編輯很重要

密集的內嵌標記（**粗體** 與 `` `code` `` 混合、巢狀強調、包含多個跨度的長句）會增加模型返回仍能通過結構檢查之翻譯的難度。具有 **多個記錄的失敗** 的區段，通常比在未變更的文字上重新執行翻譯，更能從 **重寫或分割** 來源（或將範例移至程式碼區塊）中獲益。這與 [複雜的 Markdown 和失敗的品質檢查](#complex-markdown-and-failed-quality-checks) 一致。

<a id="how-to-use-the-tab"></a>
#### 如何使用此標籤頁

1. 在儀表板中開啟 **失敗記錄**（與 [翻譯儀表板](#translation-dashboard) 相同的瀏覽器會話）。
2. 閱讀 **摘要** 條（有任何失敗的區段，以及有 **1**、**2** 或 **3+** 失敗記錄的區段計數）。
3. 按部分 **檔案名稱**、**語言**、**模型**、**品質錯誤**（值來自您的快取）、**僅致命**，以及可選的 **來源雜湊值**、**來源文字** 或 **錯誤訊息** 子字串進行篩選 — 然後按 **套用**。
4. 選擇 **排序：# 失敗記錄**（預設）或 **排序：檔案路徑 + 行號**。
5. 在表格的顶部或底部使用分页。**点击一行**可切换显示完整源代码。该行中的链接控件（启用时）会请求服务器进程将日志文件/行提示记录到运行`ai-i18n-tools dashboard`的**终端**——这对于从浏览器跳转到编辑器很有用。
6. 在项目中修复**源代码文件**，然后再次运行`translate-docs`或`sync`。如果运行成功后列表看起来**过时**，请运行`ai-i18n-tools sync --force-update`并重新加载仪表板（“失败”面板显示相同的提示）。

对于与 UI 并行的基于文件的调试，您仍然可以使用 `translate-docs --debug-failed` 在重试期间将 `FAILED-TRANSLATION` 详细信息写入 `cacheDir`——请参阅 [缓存行为和 `translate-docs` 标志](#cache-behaviour-and-translate-docs-flags)。

<a id="markdown-issues-static-checks"></a>
### Markdown 问题（静态检查）

**Markdown 問題** 分頁會列出來自 `markdown_source_issues` SQLite 資料表的資料列。每一列都是一項 **預翻譯** 發現：例如分隔符號序列在與 `translate-docs` 用於遮罩的相同 CommonMark 風格規則下，從未成對作為強調或刪除線、以反引號開啟卻未關閉的內嵌程式碼區段，或是 `STRONG_OUTSIDE_LINK` 當 `**` / `__` 包裹了 `[text](url)` 連結時（僅將粗體放在連結文字內）。這 **不相同於** **失敗**，後者記錄的是每個語系的模型輸出以及翻譯後驗證問題（`AST mismatch`、佔位符洩漏等類似問題）。

当您想在花费 token 之前修复**源 Markdown**时，请使用此选项卡——尤其是在质量检查因结构而持续失败时。按文件路径（与缓存键的部分匹配，包括 `doc-block:{index}:` 前缀）、**问题代码**或**源哈希**进行过滤；按文件路径+行或最新扫描时间排序。链接按钮会将文件/行提示记录到运行 `ai-i18n-tools dashboard` 的终端（与“文档”选项卡中的想法相同）。

**重新整理資料列：** 執行 `ai-i18n-tools check-markdown` (選用 `-p` / `--path` 範圍，`--no-cache` 以跳過 SQLite，`--json` 以在 stdout 上輸出機器可讀的內容，並在 stderr 上輸出人類可讀的行)。預設情況下，每個 `translate-docs` markdown 檔案執行時，如果未將 `docs[].warnMarkdownSourceIssues` 設定為 `false`，也會重新掃描並替換該檔案的資料列。清除快取檔案路徑的所有翻譯會移除該檔案路徑的 markdown 問題資料列，作為與失敗相同的清理路徑的一部分。`cleanup` 還會修剪已解析的來源路徑在磁碟上缺失的 markdown 問題資料列，因此已刪除或重新命名的檔案的診斷資訊 (即使是僅由 `check-markdown` 掃描過，從未翻譯過的檔案) 也不會殘留。
