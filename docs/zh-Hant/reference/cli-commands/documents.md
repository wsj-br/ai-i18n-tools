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

需要至少一個 `docs[]` 區塊。收集每個區塊的 `contentPaths` 下方的 `.md` / `.mdx` (遵循 `.translate-ignore`)。預設情況下，會在每個平面 ATX `#` 標題之前立即插入一個 HTML 錨點行 `<a id="slug"></a>` (跳過圍欄式程式碼區塊內的標題)。任何形式的現有標題 ID (HTML 錨點行、傳統 `{#id}` 後綴、MDX `{/* #id */}` 註解) 都會被選定的樣式取代；簡短識別碼始終衍生自目前的標題文字。當多個 HTML 錨點堆疊在一個標題上方時，只會保留目前標題文字的錨點，並且指向已移除 ID 的儲存庫內 Markdown 連結會更新為保留下來的 ID。未直接位於標題上方的 `<a id>` 會保留在原位。使用 `--slug-style mdx-comment` 時，改為在標題行上寫入 Docusaurus MDX 註解後綴 (使用相同的 GitHub 風格簡短識別碼演算法)，並在存在時移除前面的 HTML 錨點區塊。`--remove` 會移除所有這些標題 ID 形式，並且不寫入任何內容來取代它們。

更新來源檔案後，此指令也會遍歷每個語系的現有已翻譯 Markdown (與 `translate-docs` 的 `docsOutput` 路徑對應相同)。它會按照文件順序，將 **來源語系** 的標題 ID 複製到相符的 ATX 標題上 — 它絕不會為已翻譯的標題產生 slug — 並將標題中間的 `{#id}` / `{/* #id */}` (或零散的 HTML `<a id>`) 移回 Docusaurus / 所選樣式預期的形式。來源語言是 `sourceLocale`，且可以是任何語言。遺失的已翻譯檔案會被略過。`--remove` 也會從那些已翻譯的檔案中移除標題 ID，包括錯置於行中的權杖。

當已翻譯檔案的標題 ID 被重新定位或修復時，相符的快取已翻譯區段 (以來源區段雜湊值為索引鍵) 也會一併更新，前提是來源內容以及新舊已翻譯內容具有相同數量的區段。若數量不符，則會略過該檔案和語系。之後的 `sync --force-update` 會從更新後的快取資料列重新組合檔案。

**關鍵選項：** `-p` / `--path`、`-f` / `--file`、`--slug-style`、`--remove`、`--dry-run`

`--slug-style`：`github`（預設值；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`、`mdx-comment`（Docusaurus `{/* #… */}` 後綴）。搭配 `pymdown` 時，可選用 `--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--remove` 不可與 `--pymdown-*` 合併使用。

**另請參閱：** [錨點連結](/zh-Hant/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**簡介：** `ai-i18n-tools check-markdown [options]`

掃描每個 `docs[]` 區塊的 `contentPaths` 下的 markdown/MDX（與 `translate-docs` 相同的探索方式，遵循 `.translate-ignore`）：分隔符號配對、未關閉的行內程式碼，以及當 `**`/`__` 包裝 `[text](url)` 連結時的 `STRONG_OUTSIDE_LINK`。

將 `relativePath:line: [ISSUE_CODE] message` 行列印到標準錯誤輸出 (stderr)；如果發現任何問題，則以代碼 **1** 退出。`--json`：JSON 報告到標準輸出 (stdout)。將 `markdown_source_issues` 寫入 `cacheDir`，除非 `--no-cache`。`-v` 會將來源雜湊新增到標準錯誤輸出 (stderr) 行。

**主要選項：** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**另請參閱：** [Markdown 問題](/zh-Hant/guide/translation-dashboard/markdown-issues)
