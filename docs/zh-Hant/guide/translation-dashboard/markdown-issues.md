<a id="markdown-issues-static-checks"></a>
# Markdown 問題（靜態檢查）

**Markdown 問題**索引標籤列出了 `markdown_source_issues` SQLite 表格中的列。每一列都是一個**預翻譯**發現：例如，在 `translate-docs` 用於遮罩的相同 CommonMark 樣式規則下，從未配對為強調/刪除線的分隔符號執行，以反引號開啟但從未關閉的行內程式碼範圍，或當 `STRONG_OUTSIDE_LINK` / `**` / `__` 包裹 `[text](url)` 連結時（僅將粗體放在連結文字內）。

這與「**失敗**」**不同**，「失敗」記錄了每個地區設定的模型輸出和翻譯後驗證問題（`AST mismatch`、佔位符洩漏等）。

<a id="when-to-use-it"></a>
## 何時使用

當您想在花費權杖之前修復**原始 Markdown** 時，請使用此分頁 — 特別是當品質檢查在「[失敗](/zh-Hant/guide/translation-dashboard/failures)」分頁中持續因結構問題而失敗時。

<a id="how-to-use-the-tab"></a>
## 如何使用此分頁

1. 閱讀**摘要**條 — 每個問題代碼的總問題行數和計數。
2. 按檔案路徑（與快取鍵的部分匹配，包括 `doc-block:{index}:` 前綴）、**問題代碼**或**來源雜湊**進行篩選。
3. 按**檔案路徑 + 行**（預設）或按**最新掃描時間**排序。
4. 🔗 連結按鈕會將檔案/行提示記錄到執行 `ai-i18n-tools dashboard` 的終端機。

修復原始檔案，然後重新執行翻譯。

<a id="refreshing-rows"></a>
## 重新整理行

| 命令 / 事件 | 效果 |
| --- | --- |
| `ai-i18n-tools check-markdown` | 重新掃描已配置的文件；可選的 `-p` / `--path` 範圍、`--no-cache`、`--json` |
| `translate-docs` (預設) | 當 `docs[].warnMarkdownSourceIssues` 不是 `false` 時，重新掃描並替換每個 markdown 檔案的行 |
| 刪除某個檔案路徑的所有翻譯 | 移除該檔案路徑的 markdown 問題行（與失敗的清理方式相同） |
| `cleanup` | 清除整個 `markdown_source_issues` 表格，然後執行 `sync --force-update` 以重新填充行 |

<a id="common-issue-codes"></a>
## 常見問題代碼

| 代碼 | 意義 |
| --- | --- |
| 未配對的強調 / 刪除線 | 在 CommonMark 規則下從未關閉的分隔符號執行 |
| 未關閉的內嵌程式碼 | 反引號範圍已開啟但未關閉 |
| `STRONG_OUTSIDE_LINK` | 粗體標記包裹了 markdown 連結 — 將粗體移至連結文字內部 |

另請參閱[複雜的 Markdown 和失敗的品質檢查](/zh-Hant/guide/documents/#complex-markdown-and-failed-quality-checks)。
