<a id="cli--getting-started"></a>
# CLI — 開始使用

<a id="version"></a>
### `version`

**概要：** `ai-i18n-tools version`

印出 CLI 版本與建置時間戳記（與根程式上的 `-V` / `--version` 資訊相同）。

---

<a id="init"></a>
### `init`

**概要：** `ai-i18n-tools init [-t <template>] [-o <path>] [-P <provider>] [--with-translate-ignore]`

撰寫入門設定檔（包含 `provider` / `providers`、`concurrency`、`uiBatchConcurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 與 `docs[].addFrontmatter`）。呼叫 LLM 的翻譯指令需要在環境變數或 `.env` 中提供目前供應商的 API 金鑰（Ollama 除外）— 請參閱[供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key)。

**主要選項：** `-t` / `--template`, `-o` / `--output`, `-P` / `--provider`, `--with-translate-ignore`

`-P` / `--provider` 選擇要建立架構的 **內建預設集**（省略時為 `openrouter`）。必須為下列其中之一：`openrouter`、`openai`、`anthropic`、`gemini`、`deepseek`、`cerebras`、`groq`、`mistral`、`xai`、`nvidia`、`alibaba`、`apifun`、`cheaperinference`、`ollama`。

**範本（`-t`）：**

| 值 | 建構內容 |
|-------|-----------|
| `ui-markdown` | Markdown UI 字串工作流程 |
| `ui-docusaurus` | Docusaurus UI + 文件 |
| `ui-starlight` | Starlight 文件 |
| `ui-vitepress` | VitePress 文件（`docsOutput.style: "vitepress"`）加上主題字串的 `vitepressThemeCatalog` |
| `ui-nextra` | Nextra 文件（`docsOutput.style: "nextra"`）加上主題字典的 `nextraDictionaryPath`（側邊欄 `_meta.ts` 會自動收集） |
| `ui-fumadocs` | Fumadocs 文件（`docsOutput.style: "fumadocs"`）加上 UI 覆寫的 `fumadocsUiCatalog`（側邊欄 `meta.json` 會自動收集） |
| `ui-astro-website` | Astro 網站 UI 字串 |
| `ui-plain-html` | 純 HTML 目錄（`data-i18n*` 標記、扁平化語系 JSON） |
| `docs-plain-html` | 純 HTML 文件（每個語系一個檔案、語言清單、hreflang） |
| `ui-json-bundles` | JSON（僅 `json[]`） |
| `ui-python` | Python UI 字串、扁平化英文鍵 JSON 以及 `i18n.py` |
| `ui-python-gettext` | 包含扁平化 JSON 與 GNU `.po` / `.mo` 的 Python UI 字串，外加 `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}` 目錄（`flatOutput: false`、網域 `django`，無 `i18n.py`） |
| `ui-python-flask` | `translations/` 下的 Flask / Jinja 目錄（`flatOutput: false`）外加 `i18n.py` |

`--with-translate-ignore` 會建立一個啟動器 `.translate-ignore`（包含 Python 虛擬環境與快取目錄）。

`ui-python`、`ui-python-gettext` 與 `ui-python-flask` 也會在該檔案遺失時寫入 `i18n.py`。Django 專案會保留 Django 自身的 gettext 執行階段，因此 `ui-python-django` 不會寫入 `i18n.py`。

`migrate-python-i18n` 會將不安全的預先評估呼叫（`_(f"...")`、`_("..." % expr)`、`_("...".format(...))`）重寫為格式化前的查詢呼叫。預設為試運行。請傳入 `--write` 以編輯檔案，並閱讀 `migrate-python-i18n-report.md` 以查看審閱說明。產生的 `i18n.py` 檔案將會被略過。

---

<a id="help"></a>
### `help`

**概要：** `ai-i18n-tools help [command]`

顯示子命令的說明（輸出與 `ai-i18n-tools <command> --help` 相同）。
