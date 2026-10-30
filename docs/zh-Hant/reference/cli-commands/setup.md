<a id="cli--getting-started"></a>
# CLI — 開始使用

<a id="version"></a>
### `version`

**概要：** `ai-i18n-tools version`

印出 CLI 版本與建置時間戳記（與根程式上的 `-V` / `--version` 資訊相同）。

---

<a id="init"></a>
### `init`

**綱要：** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

撰寫入門設定檔（包含 `provider` / `providers`、`concurrency`、`uiBatchConcurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 與 `docs[].addFrontmatter`）。呼叫 LLM 的翻譯指令需要在環境變數或 `.env` 中提供目前供應商的 API 金鑰（Ollama 除外）— 請參閱[供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key)。

**主要選項：** `-P` / `--provider`（必要）、`-t` / `--template`、`-o` / `--output`、`--with-readme`、`--with-translate-ignore`

`-P` / `--provider` 為必填項。它選擇要建立骨架的**內建預設集**。必須為下列其中一項：`openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `cheaperinference`, `ollama`。

**範本（`-t`）：**

| 值 | 產生的結構 |
|-------|-----------|
| `ui-markdown` | UI 字串加上 README（扁平輸出、語言清單） |
| `ui-docusaurus` | Docusaurus UI + 文件 |
| `ui-starlight` | Starlight 文件 |
| `ui-vitepress` | VitePress 文件（`docsOutput.style: "vitepress"`）加上主題字串的 `vitepressThemeCatalog` |
| `ui-nextra` | Nextra 文件（`docsOutput.style: "nextra"`）加上主題字典的 `nextraDictionaryPath`（側邊欄 `_meta.ts` 會自動收集） |
| `ui-fumadocs` | Fumadocs 文件（`docsOutput.style: "fumadocs"`）加上 UI 覆寫的 `fumadocsUiCatalog`（側邊欄 `meta.json` 會自動收集） |
| `ui-astro-website` | Astro 網站 UI 字串 |
| `ui-plain-html` | 純 HTML 目錄（`data-i18n*` 標記、扁平化語系 JSON） |
| `docs-plain-html` | 純 HTML 文件（每個語系一個檔案、語言清單、hreflang） |
| `docs-markdown` | Markdown 文件：README 與 `.md` 檔案、扁平輸出、語言清單 |
| `ui-json-bundles` | JSON（僅 `json[]`） |
| `ui-python` | Python UI 字串、以來源語言字串為鍵的扁平 JSON，以及 `i18n.py` |
| `ui-python-gettext` | 包含扁平化 JSON 與 GNU `.po` / `.mo` 的 Python UI 字串，外加 `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}` 目錄（`flatOutput: false`、網域 `django`，無 `i18n.py`） |
| `ui-python-flask` | `translations/` 下的 Flask / Jinja 目錄（`flatOutput: false`）外加 `i18n.py` |

`--with-readme` 會附加一個 `README.md` 文件區塊（`outputDir` `translated-docs`、`docsOutput.style` `"flat"`、一個 `languageListBlock`），並將 `features.translateDocs` 設定為 true。當文件區塊已列出 `README.md` 時，此指令不會執行任何動作，`ui-markdown` 與 `docs-markdown` 即是這種情況。此指令只會寫入設定檔。此指令會印出標記行以便貼到 `README.md` 中，並在該檔案遺失時發出警告。指南：[將 i18n 新增至您的 README 與 Markdown 文件](/zh-Hant/guide/add-i18n-to-readme)。

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` 會建立一個啟動器 `.translate-ignore`（包含 Python 虛擬環境與快取目錄）。

`ui-python`、`ui-python-gettext` 與 `ui-python-flask` 也會在該檔案遺失時寫入 `i18n.py`。Django 專案會保留 Django 自身的 gettext 執行階段，因此 `ui-python-django` 不會寫入 `i18n.py`。

`migrate-python-i18n` 會將不安全的預先評估呼叫（`_(f"...")`、`_("..." % expr)`、`_("...".format(...))`）重寫為格式化前的查詢呼叫。預設為試運行。請傳入 `--write` 以編輯檔案，並閱讀 `migrate-python-i18n-report.md` 以查看審閱說明。產生的 `i18n.py` 檔案將會被略過。

---

<a id="doctor"></a>
### `doctor`

**概要：** `ai-i18n-tools doctor [--local] [--strict] [--json]`

檢查專案是否已準備好進行翻譯。報告涵蓋配置語法和結構描述、業務規則、已安裝的版本、來源和輸出路徑、UI 目錄檔案、快取統計資料、已配置的提供者、已設定的支援環境變數以及模型 ID。

依預設，`doctor` 也會根據作用中提供者的目錄檢查已配置的模型 ID，並將已安裝的版本與最新的 GitHub 版本進行比較。`--local` 會跳過這兩個網路呼叫。較新的版本，或失敗的 GitHub 請求，會產生警告。遺失或過期的模型 ID 會導致命令失敗。當任何檢查發出警告時，`--strict` 會以錯誤結束。

API 金鑰值絕不會列印出來。已設定的金鑰會顯示為 `NAME (set)`。

遺失的輸入路徑會導致失敗。遺失的輸出目錄會是一個備註，因為第一次翻譯執行會建立它們。`doctor` 不會重寫配置、建立目錄或將來源文字傳送至模型。

**主要選項：** `--local`、`--strict`、`--json`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
```

---

<a id="help"></a>
### `help`

**概要：** `ai-i18n-tools help [command]`

顯示子命令的說明（輸出與 `ai-i18n-tools <command> --help` 相同）。
