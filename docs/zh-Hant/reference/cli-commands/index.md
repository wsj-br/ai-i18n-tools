<a id="cli-reference"></a>
# CLI 參考

為指令上的每個旗標執行 `ai-i18n-tools <command> --help`。下方的群組頁面提供了額外的上下文、關鍵選項以及主題指南的連結。

<a id="command-overview"></a>
## 指令概覽

<a id="setupsetup"></a>
### [設定](setup)

| 指令 | 摘要 |
|---------|---------|
| [`version`](setup#version) | 印出 CLI 版本與建置時間戳記。 |
| [`init`](setup#init) | 寫入入門設定；`-t` 選擇骨架範本。 |

<a id="models--catalogmodels"></a>
### [模型與目錄](models)

| 指令 | 摘要 |
|---------|---------|
| [`check-models`](models#check-models) | 根據目前使用的供應商驗證已設定的模型 ID。 |
| [`list-models`](models#list-models) | 列出目前使用的供應商所提供的模型。 |
| [`bench-models`](models#bench-models) | 在一個翻譯範本上對已設定的模型進行基準測試。 |
| [`list-languages`](models#list-languages) | 列出內建的 UI 語言目錄。 |

<a id="ui-stringsui-strings"></a>
### [介面字串](ui-strings)

| 指令 | 摘要 |
|---------|---------|
| [`extract`](ui-strings#extract) | 從來源字面值與 HTML 標記更新 `strings.json`。 |
| [`mark-html`](ui-strings#mark-html) | 將 `data-i18n*` 標記插入 HTML 檔案中。 |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | 根據設定的語系寫入 `ui-languages.json`。 |
| [`translate-ui`](ui-strings#translate-ui) | 翻譯 UI 字串 (`strings.json` → 語系 JSON)。 |
| [`sync-ui`](ui-strings#sync-ui) | 擷取並翻譯 UI 字串。 |
| [`proofread-ui`](ui-strings#proofread-ui) | 擷取並由 LLM 審查來源語系的 UI 字串。 |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | 將 `strings.json` 匯出為 XLIFF 2.0。 |

<a id="documentsdocuments"></a>
### [文件](documents)

| 指令 | 摘要 |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | 翻譯 Markdown、MDX、`.astro` 與框架目錄。 |
| [`write-heading-ids`](documents#write-heading-ids) | 在 ATX 標題前插入 HTML 錨點行。 |
| [`check-markdown`](documents#check-markdown) | 掃描 Markdown/MDX 以找出分隔符號與強調語法的問題。 |

<a id="other-contentcontent"></a>
### [其他內容](content)

| 指令 | 摘要 |
|---------|---------|
| [`translate-json`](content#translate-json) | 根據 `json[]` 設定區塊翻譯巢狀 JSON。 |
| [`translate-svg`](content#translate-svg) | 翻譯在 `config.svg` 中設定的 SVG 檔案。 |

<a id="workflows--statusworkflows"></a>
### [工作流程與狀態](workflows)

| 命令 | 摘要 |
|---------|---------|
| [`sync`](workflows#sync) | 在單一管線中執行擷取 + UI + SVG + 文件 + JSON。 |
| [`status`](workflows#status) | 列印 UI、文件與 JSON 翻譯覆蓋率。 |
| [`statistics`](workflows#statistics) | 列印快取與 `strings.json` 統計資料。 |

<a id="cache--maintenancemaintenance"></a>
### [快取與維護](maintenance)

| 命令 | 摘要 |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | 清理過時的快取列並重新填入 markdown 問題。 |
| [`clean-temp`](maintenance#clean-temp) | 尋找並刪除 `*.log`、`*.tmp` 與快取備份。 |
| [`purge-locale`](maintenance#purge-locale) | 移除指定地區設定的快取列與產生的產物。 |

<a id="toolstools"></a>
### [工具](tools)

| 命令 | 摘要 |
|---------|---------|
| [`dashboard`](tools#dashboard) | 啟動翻譯儀表板網頁 UI。 |
| [`glossary-generate`](tools#glossary-generate) | 寫入空白的 `glossary-user.csv` 範本。 |
| [`help`](tools#help) | 顯示子命令的說明。 |

<a id="synopsis"></a>
## 概要

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

<a id="root-and-global-options"></a>
### 根目錄和全域選項

| 選項                       | 範圍         | 說明                                                                                      |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | 根程式碼  | 輸出版本號和建置時間戳記（與 `version` 子命令的資訊相同）。 |
| `-h` / `--help`              | 根程式  | 顯示根程式或與命令名稱一起使用的子命令的說明。      |
| `-c` / `--config <path>`     | 每個命令 | 設定檔路徑（預設值：`ai-i18n-tools.config.json`）。                                  |
| `-v` / `--verbose`           | 每個命令 | 詳細記錄。                                                                          |
| `-P` / `--provider <name>`   | 每個指令 | 此執行緒的活躍 LLM 提供者；會覆寫組態 `provider` 鍵。必須在 `providers` 下進行組態。 |
| `-L` / `--ui-lang <code>`    | 每個指令 | 工具自身 UI（CLI 說明、日誌/摘要、儀表板）的語言；最高優先級來源。請參閱[工具 UI 語言](/zh-Hant/guide/tool-ui-language)。 |
| `-w` / `--write-logs [path]` | 選定的命令 | 將控制台輸出導向至 `.log` 檔案（預設路徑：在根目錄 `cacheDir` 下）。僅適用於 `translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync-ui`、`sync` 和 `cleanup`。 |

<a id="per-command-help"></a>
### 命令說明

| 用法                            | 說明                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | 該命令的所有選項。      |
| `ai-i18n-tools help <command>`   | 與 `<command> --help` 相同的輸出。 |

<a id="target-locales--l----locale"></a>
### 目標地區設定（`-l` / `--locale`）

| 命令 | 行為 |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync`、`sync-ui`、`export-ui-xliff` | `-l` / `--locale <codes>` — 以逗號分隔的目標 BCP-47 代碼（例如 `de,fr,pt-BR`）。省略時，預設值來自設定（`json[]` 區塊也可以設定每個區塊的 `targetLocales`；UI 步驟使用 `targetLocales` 減去 `sourceLocale`）。 |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — 要審核的單一來源語言（預設：設定檔 `sourceLocale`）。                                                            |
