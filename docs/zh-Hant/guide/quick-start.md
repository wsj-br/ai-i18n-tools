<a id="quick-start"></a>
# 快速入門

預設的 `init` 範本 (`ui-markdown`) 僅啟用 **UI** 擷取和翻譯。`ui-docusaurus`、`ui-starlight` 和 `ui-vitepress` 範本啟用 **文件** 翻譯 (`translate-docs`)；`ui-vitepress` 也為 VitePress 主題 JSON 建立 JSON 骨架。`ui-astro-website` 範本為純 Astro 應用程式 (包括 `.astro` 檔案) 建立 **UI** 擷取骨架；當您也想為 `translate-docs` 頁面 HTML 進行 `.astro` 時，請新增一個 `docs[]` 區塊 (請參閱 [Astro 網站頁面 (解析與替換)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace))。參考 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 使用 **兩種** 管線。當您想要一個命令來根據您的設定執行擷取、UI 翻譯、可選的 SVG 檔案翻譯和文件翻譯時，請使用 `sync`。

<a id="runnable-examples"></a>
### 可執行的範例

七個可執行的專案和夾具位於 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) 下。請參閱 [範例](/examples) 目錄 (控制台應用程式、Next.js + Docusaurus、Astro 網站、Astro Starlight 文件、VitePress 文件、多供應商比較、Markdown 壓力測試)。

**獨立執行一個範例**（無需複製整個單一儲存庫）：

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
```

將 `console-app` 替換為任何範例資料夾名稱。每個範例都宣告了 `"ai-i18n-tools": "^1.7.2"` 並從 npm 安裝 CLI。每個範例的 README 都包含相同的程式碼片段，並填入了資料夾名稱。

**從完整的 ai-i18n-tools 儲存庫：** 如果您複製了整個儲存庫 (而不僅僅是 degit 的一個範例資料夾)，請從儲存庫根目錄執行 `pnpm install`；工作區 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 條目 (`ai-i18n-tools: workspace:*`) 會自動將範例連結到您的本地簽出。

```bash
# UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# VitePress docs: npx ai-i18n-tools init -t ui-vitepress
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# JSON (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 建議的 `package.json` 指令碼

將套件本機安裝後，您可以直接在指令碼中使用 CLI 命令（無需 `npx`）。

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
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**提示：** 如果您希望 CLI 輸出和儀表板使用另一種語言，請傳遞 `-L <code>` 或設定 `AI_I18N_LANG` — 請參閱 [工具 UI 語言](/reference/environment-variables#tool-ui-language)。

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

執行 `npx ai-i18n-tools sync` 以執行單一管線：當 `features.translateUIStrings` 啟用時，會先 **提取**然後 **翻譯 UI** 字串；選用 **翻譯 SVG**（`features.translateSVG` + `svg` 區塊）；**翻譯文件**（根據設定的 `docs[]`）；然後選用 **翻譯 JSON**（`features.translateJson` + `json[]`）。使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 跳過部分。文件和 `json[]` 步驟接受 `--dry-run`、`-p` / `--path`、`--force` 和 `--force-update`（當 `--no-docs` 時會忽略僅限文件的旗標；當未設定 `--no-json` 時，JSON 會使用相同的快取旗標）。

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

此功能如何與 `npx ai-i18n-tools sync` 一起運作：

- UI 字串會從 `src/` 提取並翻譯成 `public/locales/`。
- 第一個文件區塊會將 **markdown** 從 `docs-site/docs/` 翻譯成 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`（本地化文件頁面）。
- 當設定了 `docs[].docusaurusCatalogDir` 並啟用 `features.translateDocs` 時，該區塊也會將 `docs-site/i18n/en/` 下的 **Docusaurus shell JSON** 翻譯到每個目標語言的資料夾中 — 包括導覽列、頁腳以及佈景主題/外掛程式目錄，但不包含 MDX 主體內容。
- 第二個文件區塊會將 `README.md` 翻譯成 `translated-docs/` 下的、帶有語言後綴的檔案（`docsOutput.style = "flat"`）。
- 所有文件區塊都共用 `cacheDir`，因此未變更的區段會在多次執行時重複使用，以減少 API 呼叫和成本。
