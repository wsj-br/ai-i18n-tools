<a id="quick-start"></a>
# 快速入門

預設的 `init` 模板 (`ui-markdown`) 僅啟用 **UI** 擷取與翻譯。`ui-docusaurus`、`ui-starlight`、`ui-vitepress`、`ui-nextra` 與 `ui-fumadocs` 模板則啟用 **文件** 翻譯 (`translate-docs`)；`ui-vitepress` 同時會為 VitePress 主題字串建立 `docsOutput.vitepressThemeCatalog` 鷹架，`ui-nextra` 會為 Nextra 主題字典建立 `docs[].nextraDictionaryPath` 鷹架（側邊欄 `_meta.ts` 會自動收集），而 `ui-fumadocs` 則會為 Fumadocs UI 覆寫建立 `docsOutput.fumadocsUiCatalog` 鷹架（側邊欄 `meta.json` 會自動收集）。`ui-astro-website` 模板為純 Astro 應用程式（包含 `.astro` 檔案）建立 **UI** 擷取鷹架；若您同時需要 `.astro` 頁面 HTML 的 `translate-docs`，請加入 `docs[]` 區塊（請參閱 [Astro 網站頁面 (parse-and-replace)](/zh-Hant/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)）。參考資料 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 使用了 **兩者** 的管線。Python 模板為 `ui-python`、`ui-python-gettext`、`ui-python-flask` 與 `ui-python-django` — 請參閱 [將 i18n 加入 Python 應用程式](/zh-Hant/guide/add-i18n-to-python)。當您希望透過單一指令根據設定檔執行擷取、UI 翻譯、選用的 SVG 檔案翻譯以及文件翻譯時，請使用 `sync`。

Python 專案可以使用獨立執行檔，無需安裝 Node.js。下載步驟：[安裝 — 獨立執行檔](/zh-Hant/guide/installation#standalone-executables)。

<a id="runnable-examples"></a>
### 可執行的範例

可執行的專案與測試夾具位於 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) 下。請參閱 [範例](/zh-Hant/examples) 目錄以取得完整清單、複製指令，以及了解哪些資料夾使用 `pnpm` 與 Python 虛擬環境。

**執行一個 Node.js 範例獨立程式**（無需複製整個 monorepo）：

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

將 `console-app` 取代為任何其他 Node.js 範例資料夾名稱。這些範例中的每一個都宣告了與目前套件版本相符的已發佈 `ai-i18n-tools` 插入符號範圍，並從 npm 安裝 CLI。Python 範例沒有 `package.json`。請使用相同的 `degit` 指令複製它們，或使用來自 GitHub Release 的 `ai-i18n-tools-python-examples.zip`，然後依照 [範例 — Python](/zh-Hant/examples#python-examples) 操作。

**從完整的 ai-i18n-tools 儲存庫** — 如果您複製了整個儲存庫（而不僅僅是透過 degit 複製單個範例資料夾）：

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

工作區 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 項目 (`ai-i18n-tools: workspace:*`) 會自動將工作區範例連結到您的本機簽出。獨立測試夾具 (`multi-provider`, `test-markdown`) 不是工作區套件 — 請從其資料夾中使用 `node ../../bin/ai-i18n-tools.mjs …`。若要從**儲存庫根目錄**（此套件自身的 docs/i18n）執行 CLI，請在 `direnv allow` 之後使用單純的 `ai-i18n-tools`，或使用 `pnpm i18n:sync` / `node bin/ai-i18n-tools.mjs …` — 請參閱[安裝 — 複製的 Monorepo](/zh-Hant/guide/installation#cloned-monorepo) 與[開發指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)。

<a id="provider-and-api-key-required-for-translation"></a>
### 供應商與 API 金鑰（翻譯所需）

每個呼叫 LLM 的指令 — `translate-ui`、`translate-docs`、`translate-json`、`translate-svg` 與 `sync` — 都需要**兩者**：

1. **至少一個提供者**在 `ai-i18n-tools.config.json`：一個包含 `translationModels` 的 `providers.<name>` 區塊，且在設定多個提供者時，需有頂層 `provider` 鍵。`init -P <provider>` 會建立該預設；可新增提供者或調整模型列表 — 參閱 [LLM 提供者與模型](/zh-Hant/guide/providers-and-models)。
2. **相符的 API 金鑰**位於您的環境或專案根目錄的 `.env` 檔案中。每個內建預設會從[預設表格](/zh-Hant/guide/providers-and-models#built-in-providers)讀取指定的環境變數（例如 `OPENROUTER_API_KEY` 搭配 `-P openrouter`，或 `OPENAI_API_KEY` 搭配 `-P openai`）；**Ollama** 是例外 — 它使用本地端點且無需金鑰。參閱[安裝 — 設定您的提供者 API 金鑰](/zh-Hant/guide/installation#using-the-cli)。

`extract`、`status` 與其他不呼叫 LLM 的指令不需要供應商或 API 金鑰。

<a id="core-cli-commands"></a>
### 核心 CLI 指令

在安裝 `ai-i18n-tools` 並[為裸命令設定您的 shell](/zh-Hant/guide/installation#using-the-cli)後，從您的 **專案根目錄**執行。以下範例直接使用 `ai-i18n-tools`。

```bash
# Set the API key for the provider you pass to init (see preset table; skip for local Ollama)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# export OPENAI_API_KEY=sk-your-key-here
# export CHEAPERINFERENCE_API_KEY=your-key-here

# UI strings (ui-markdown template enables extract + translate-ui)
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models          # optional: ranked shortlist
ai-i18n-tools suggest-models --apply  # replace translationModels
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight -P cheaperinference
# VitePress docs: ai-i18n-tools init -t ui-vitepress -P anthropic
# Nextra docs: ai-i18n-tools init -t ui-nextra -P gemini
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs -P groq
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website -P ollama
# Plain HTML catalog: ai-i18n-tools init -t ui-plain-html -P openrouter
# Plain HTML documents: ai-i18n-tools init -t docs-plain-html -P openai
# Python flat JSON: ai-i18n-tools init -t ui-python -P cheaperinference
# Python JSON + gettext: ai-i18n-tools init -t ui-python-gettext -P anthropic
# Django catalogs: ai-i18n-tools init -t ui-python-django -P gemini
# Flask / Jinja gettext: ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles -P ollama
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

由 `init` 寫入的模型清單僅為起點。`suggest-models` 會對作用中提供者的聊天模型進行排名。`suggest-models --apply` 會取代 `translationModels` 並保持 `uiModels` 與 `localeModels` 不變。相同的排名亦顯示於 [模型](/zh-Hant/guide/translation-dashboard/models) 分頁中。指令參考：[suggest-models](/zh-Hant/reference/cli-commands/models#suggest-models)。

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

UI 區塊預設會將其 `strings.json` 目錄作為文件的術語表提示 (`uiGlossary`)。`glossary.userGlossary` 會新增產品術語的 CSV 覆寫。請參閱[術語表](/zh-Hant/guide/glossary)。

執行 `ai-i18n-tools sync` 以執行一個流水線：當啟用 `features.translateUIStrings` 時，先 **提取** 再 **翻譯 UI** 字串；可選的 **翻譯 SVG**（`features.translateSVG` + `svg` 區塊）；**翻譯文件**（`docs[]` 如已配置）；然後是可選的 **translate-json**（`features.translateJson` + `json[]`）。使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳過部分步驟。文件和 `json[]` 步驟接受 `--dry-run`、`-p` / `--path`、`--force`、`--force-update` 和 `--check-cache`（當 `--no-docs` 時，僅用於文件的旗標會被忽略；當未設定 `--no-json` 時，JSON 使用相同的快取旗標）。

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
