<a id="cli--documents"></a>
# CLI — 文件

<a id="translate-docs"></a>
### `translate-docs`

**簡介：** `ai-i18n-tools translate-docs [options]`

翻譯 markdown、MDX、`.astro`、可選的 Docusaurus 目錄 JSON (`docusaurusCatalogDir`)、可選的 Nextra `_meta.ts`/字典 `.ts`，以及每個 `docs` 區塊的可選 VitePress 主題目錄。

**關鍵選項：** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `--check-cache`, `-p` / `-f`, `--dry-run`

`-j`：最大並行語言環境；`-b`：每個檔案的最大並行批次 API 呼叫。`--prompt-format`：批次傳輸格式 (`xml` | `json-array` | `json-object`)。

**另請參閱：** [快取行為與 `translate-docs` 旗標](/zh-Hant/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [批次提示格式](/zh-Hant/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**簡介：** `ai-i18n-tools write-heading-ids [options]`

至少需要一個 `docs[]` 區塊。會在每個區塊的 `contentPaths` 之下收集 `.md` / `.mdx`（遵循 `.translate-ignore`）。預設會在每個扁平 ATX `#` 標題之前立即插入一行 HTML 錨點 `<a id="slug"></a>`（會跳過圍欄程式碼區塊內的標題）。任何形式的現有標題 ID（HTML 錨點行、傳統的 `{#id}` 後綴、MDX `{/* #id */}` 註解）都會被替換為所選的樣式；slug 一律從目前的標題文字推導而來。若使用 `--slug-style mdx-comment`，則改為在標題行上寫入 Docusaurus MDX 註解後綴（採用相同的 github 風格 slug 演算法），並在存在前置 HTML 錨點時將其移除。`--remove` 會移除所有上述的標題 ID 形式，且不寫入任何內容作為替代。

更新來源檔案後，該命令也會遍歷每個語系現有的翻譯 Markdown（與 `translate-docs` 相同的 `docsOutput` 路徑對應）。它會將 **英文** 標題 ID 按文件順序複製到相符的 ATX 標題上 — 它永遠不會對翻譯後的標題進行 slug 處理 — 並將標題中間的 `{#id}` / `{/* #id */}`（或孤立的 HTML `<a id>`）移回 Docusaurus / 所選樣式期望的形式。缺少的翻譯檔案會被跳過。`--remove` 也會從這些翻譯檔案中移除標題 ID，包括放錯位置的中行標記。

當已翻譯檔案的標題 ID 被重新定位或修復時，若英文來源與新舊翻譯內容的區段數量相同，對應的快取翻譯區段（以英文來源雜湊值為鍵值）也會一併更新。若數量不符，則會略過該檔案與語系。後續的 `sync --force-update` 會從更新後的快取資料列重新組合該檔案。

**關鍵選項：** `-p` / `--path`、`-f` / `--file`、`--slug-style`、`--remove`、`--dry-run`

`--slug-style`：`github`（預設值；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`、`mdx-comment`（Docusaurus `{/* #… */}` 後綴）。搭配 `pymdown` 時，可選用 `--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--remove` 不可與 `--pymdown-*` 合併使用。

**另請參閱：** [錨點連結](/zh-Hant/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**簡介：** `ai-i18n-tools check-markdown [options]`

掃描每個 `docs[]` 區塊的 `contentPaths` 下的 markdown/MDX（與 `translate-docs` 相同的探索方式，遵循 `.translate-ignore`）：分隔符號配對、未關閉的行內程式碼，以及當 `**`/`__` 包裝 `[text](url)` 連結時的 `STRONG_OUTSIDE_LINK`。

將 `relativePath:line: [ISSUE_CODE] message` 行列印到 stderr；如果有任何問題，結束代碼為 **1**。`--json`：在 stdout 上輸出 JSON 報告。除非 `--no-cache`，否則將 `markdown_source_issues` 寫入 `cacheDir`。`-v` 將來源雜湊新增到 stderr 行。

**主要選項：** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**另請參閱：** [Markdown 問題](/zh-Hant/guide/translation-dashboard/markdown-issues)
