<a id="cli--setup"></a>
# CLI — 設定

<a id="version"></a>
### `version`

**概要：** `ai-i18n-tools version`

印出 CLI 版本與建置時間戳記（與根程式上的 `-V` / `--version` 資訊相同）。

---

<a id="init"></a>
### `init`

**概要：** `ai-i18n-tools init [-t <template>] [-o <path>] [--with-translate-ignore]`

撰寫一個入門設定檔（包含 `provider` / `providers`、`concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars` 與 `docs[].addFrontmatter`）。呼叫 LLM 的翻譯指令需要在環境變數或 `.env` 中提供目前供應商的 API 金鑰（Ollama 除外）——請參閱[供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key)。

**主要選項：** `-t` / `--template`、`-o` / `--output`、`--with-translate-ignore`

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
| `ui-json-bundles` | JSON（僅 `json[]`） |

`--with-translate-ignore` 建立初始 `.translate-ignore`。
