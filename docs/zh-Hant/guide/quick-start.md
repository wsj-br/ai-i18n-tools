<a id="quick-start"></a>
# 快速入門

預設的 `init` 模板（`ui-markdown`）僅啟用 **UI** 萃取與翻譯。`ui-docusaurus`、`ui-starlight`、`ui-vitepress`、`ui-nextra` 與 `ui-fumadocs` 模板啟用 **文件** 翻譯（`translate-docs`）；`ui-vitepress` 亦會為 VitePress 主題字串搭建 `docsOutput.vitepressThemeCatalog`，`ui-nextra` 為 Nextra 主題字典搭建 `docs[].nextraDictionaryPath`（側邊欄 `_meta.ts` 會自動收集），而 `ui-fumadocs` 為 Fumadocs UI 覆寫搭建 `docsOutput.fumadocsUiCatalog`（側邊欄 `meta.json` 會自動收集）。`ui-astro-website` 模板為一般 Astro 應用程式搭建 **UI** 萃取（包含 `.astro` 檔案）；當您也想要為 `.astro` 頁面 HTML 進行 `translate-docs` 時，請新增 `docs[]` 區塊（參見 [Astro 網站頁面（解析並取代）](/zh-Hant/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)）。參考 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 使用了 **兩者** 管線。當您想要以單一指令根據設定執行萃取、UI 翻譯、可選的 SVG 檔案翻譯以及文件翻譯時，請使用 `sync`。

<a id="runnable-examples"></a>
### 可執行的範例

九個可執行的專案與測試夾具位於 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) 之下。請參閱 [範例](/zh-Hant/examples) 目錄（主控台應用程式、Next.js + Docusaurus、Astro 網站、Astro Starlight 文件、VitePress 文件、Nextra 文件、Fumadocs 文件、多供應商比較、Markdown 壓力測試）。

**獨立執行一個範例**（無需複製整個單一儲存庫）：

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

將 `console-app` 替換為任何範例資料夾名稱。每個範例都宣告了 `"ai-i18n-tools": "^1.7.2"` 並從 npm 安裝 CLI。每個範例的 README 都包含相同的程式碼片段，並填入了資料夾名稱。

**從完整的 ai-i18n-tools 儲存庫** — 如果您複製了整個儲存庫（而不僅僅是透過 degit 複製單個範例資料夾）：

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

工作區 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 項目 (`ai-i18n-tools: workspace:*`) 會自動將工作區範例連結到您的本地簽出。獨立測試夾具 (`multi-provider`、`test-markdown`) 不是工作區套件 — 請在其資料夾中使用 `node ../../bin/ai-i18n-tools.mjs …`。要從**儲存庫根目錄**執行 CLI（此套件自身的 docs/i18n），請使用 `pnpm i18n:sync` 或 `node bin/ai-i18n-tools.mjs …` — 請參閱[安裝 — 複製的 monorepo](/zh-Hant/guide/installation#cloned-monorepo) 與[開發指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)。

<a id="provider-and-api-key-required-for-translation"></a>
### 供應商與 API 金鑰（翻譯所需）

每個呼叫 LLM 的指令 — `translate-ui`、`translate-docs`、`translate-json`、`translate-svg` 與 `sync` — 都需要**兩者**：

1. **至少一個供應商** 位於 `ai-i18n-tools.config.json`：一個包含 `translationModels` 的 `providers.<name>` 區塊，以及當設定多個供應商時的一個頂層 `provider` 鍵。`init` 會建立預設供應商區塊（除非您傳遞 `-P <provider>`，否則為 `openrouter`）；切換預設集、新增供應商或調整模型列表 — 請參閱 [LLM 供應商與模型](/zh-Hant/guide/providers-and-models)。
2. **對應的 API 金鑰** 位於您的環境變數或專案根目錄的 `.env` 檔案中。每個內建預設集會從 [預設集表格](/zh-Hant/guide/providers-and-models#built-in-providers) 讀取一個具名環境變數（例如預設的 `OPENROUTER_API_KEY`，或當您使用 `-P anthropic` 建立時的 `ANTHROPIC_API_KEY`）；**Ollama** 是例外 — 它使用本機端點且不需要金鑰。請參閱 [安裝 — 設定您的供應商 API 金鑰](/zh-Hant/guide/installation#using-the-cli)。

`extract`、`status` 與其他不呼叫 LLM 的指令不需要供應商或 API 金鑰。

<a id="core-cli-commands"></a>
### 核心 CLI 指令

在安裝 `ai-i18n-tools` 並[為裸命令設定您的 shell](/zh-Hant/guide/installation#using-the-cli)後，從您的 **專案根目錄**執行。以下範例直接使用 `ai-i18n-tools`。

```bash
# Set the API key for your active provider (see preset table; skip for local Ollama)
# Default init uses openrouter:
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Or scaffold another preset at init, e.g. anthropic:
# export ANTHROPIC_API_KEY=sk-ant-your-key-here

# UI strings (default template enables extract + translate-ui)
ai-i18n-tools init [-P <provider>]    # default: openrouter
ai-i18n-tools init -P anthropic
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight [-P <provider>]
# VitePress docs: ai-i18n-tools init -t ui-vitepress [-P <provider>]
# Nextra docs: ai-i18n-tools init -t ui-nextra [-P <provider>]
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs [-P <provider>]
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website [-P <provider>]
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles [-P <provider>]
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 建議的 `package.json` 指令碼

在本地安裝套件後，`package.json` 腳本會從 `node_modules/.bin` 解析 `ai-i18n-tools`，而無需額外的 shell 設定。對於互動式 shell，請先設定 PATH — 請參閱 [使用 CLI](/zh-Hant/guide/installation#using-the-cli)。

**建議**使用 `sync` 處理所有過去需要「執行 `translate-ui`，然後 `translate-svg`，然後 `translate-docs`，然後 `translate-json`」的作業：`ai-i18n-tools sync` 會根據您的設定檔執行 **提取**（啟用時）、**翻譯 UI**、選用的 **翻譯 SVG**、**翻譯文件**，然後選用的 **翻譯 JSON** — 依正確順序並使用共用旗標。手動串連這些步驟很容易出錯（順序、提取、地區設定旗標）。僅在您需要單獨執行 **單一**步驟時使用 `i18n:translate:ui`、`i18n:translate:svg`、`i18n:translate:docs` 和 `i18n:translate:json`。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**提示：** 若您希望 CLI 輸出與儀表板顯示為其他語言，請傳入 `-L <code>` 或設定 `AI_I18N_LANG` — 請參閱[工具介面語言](/zh-Hant/guide/tool-ui-language)。

<a id="combined-sync"></a>
## 組合同步

在單一設定中啟用所有功能，以同時執行 UI 字串和文件：

<details>
<summary>合併的 UI + 文件設定檔範例</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` 會將文件翻譯指向與 UI 相同的 `strings.json` 目錄，以確保術語一致性；`glossary.userGlossary` 會新增 CSV 覆寫以處理產品術語。

執行 `ai-i18n-tools sync` 來執行一條流水線：當啟用 `features.translateUIStrings` 時，**提取**然後**翻譯 UI** 字串；可選的**翻譯 SVG**（`features.translateSVG` + `svg` 區塊）；**翻譯文件**（`docs[]` 如已設定）；然後是可選的**translate-json**（`features.translateJson` + `json[]`）。使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳過各部分。文件與 `json[]` 步驟接受 `--dry-run`、`-p` / `--path`、`--force` 與 `--force-update`（當 `--no-docs` 時，僅適用於文件的旗標會被忽略；當未設定 `--no-json` 時，JSON 使用相同的快取旗標）。

在區塊上使用 `docs[].targetLocales`，將該區塊的檔案翻譯成比 UI **更小的子集**（有效的說明地區設定是區塊間的 **聯集**）：

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>
### 混合文件設定 (`docsOutput.style = "docusaurus"` + `"flat"`)

您可以在同一個設定檔中結合多個文件管線，方法是在 `docs` 中新增多個項目。當專案有 Docusaurus 網站（`docsOutput.style = "docusaurus"`）以及根層級的 markdown 檔案（例如，具有 `docsOutput.style = "flat"` 的儲存庫 README）需要使用帶有地區設定後綴的檔名進行翻譯時，這是一種常見的設定。

<details>
<summary>混合的 Docusaurus + 平面 README 設定檔範例</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

使用 `ai-i18n-tools sync` 時的執行方式：

- UI 字串會從 `src/` 提取並翻譯成 `public/locales/`。
- 第一個文件區塊會將 **markdown** 從 `docs-site/docs/` 翻譯成 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`（本地化文件頁面）。
- 當設定了 `docs[].docusaurusCatalogDir` 並啟用 `features.translateDocs` 時，該區塊也會將 `docs-site/i18n/en/` 下的 **Docusaurus shell JSON** 翻譯到每個目標語言的資料夾中 — 包括導覽列、頁腳以及佈景主題/外掛程式目錄，但不包含 MDX 主體內容。
- 第二個文件區塊會將 `README.md` 翻譯成 `translated-docs/` 下的、帶有語言後綴的檔案（`docsOutput.style = "flat"`）。
- 所有文件區塊都共用 `cacheDir`，因此未變更的區段會在多次執行時重複使用，以減少 API 呼叫和成本。
