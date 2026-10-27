<a id="combining-pipelines"></a>
# 結合管線

當一個專案需要多種類型的翻譯時，請閱讀本文件：例如應用程式 UI 字串加上說明文件、說明文件網站加上根目錄的 README，或文件加上 SVG 插圖。如果您只翻譯一種內容，閱讀 [快速入門](/zh-Hant/guide/quick-start) 就足夠了。

應用程式加上其儲存庫 README 是常見的混合類型。使用 `init`（`ui-markdown` 範本）或 `init -t <template> --with-readme` 來建立其骨架，然後遵循 [將 i18n 新增至您的 README 和 Markdown 文件](/zh-Hant/guide/add-i18n-to-readme)。本頁後面的混合設定，是將相同的概念應用於說明文件網站。

此儲存庫就是這種類型的專案。[`ai-i18n-tools.config.json`](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) 在一個 `sync` 中翻譯 CLI 和翻譯儀表板 UI 字串以及此 VitePress 網站。UI 區塊涵蓋 `src/cli`、`src/server`、`src/dashboard-app` 和 `src/api`，並在 `src/i18n/locales` 下寫入扁平化 JSON。VitePress 區塊使用 `docsOutput.style: "vitepress"` 來處理 `docs/` 和主題目錄。同一個檔案也會在 `translated-docs/` 下寫入 `README.md` 翻譯。網站串接：[VitePress](/zh-Hant/guide/integrations/vitepress)。

<a id="what-sync-runs"></a>
## sync 的執行內容

`ai-i18n-tools sync` 會依此順序執行已啟用的步驟：

1. 當 `features.translateUIStrings` 啟用時，執行 `extract`，然後執行 `translate-ui`。
2. 當 `features.translateSVG` 啟用且存在 `svg` 區塊時，執行 `translate-svg`。
3. 當 `features.translateDocs` 啟用或設定了任何 `docs[].docusaurusCatalogDir` 時，執行 `translate-docs`。
4. 當 `features.translateJson` 啟用且 `json[]` 有項目時，執行 `translate-json`。

使用 `--no-ui`、`--no-svg`、`--no-docs` 或 `--no-json` 來略過部分。docs 和 `json[]` 步驟接受 `--dry-run`、`-p` / `--path`、`--force`、`--force-update` 和 `--check-cache`。當設定 `--no-docs` 時，會忽略僅限文件的旗標。當未設定 `--no-json` 時，JSON 會使用相同的快取旗標。

建議使用 `sync`，而不是手動串連各個指令。手動執行時，順序、擷取和語系旗標很容易出錯。

<a id="combined-sync"></a>

<a id="ui-strings-and-documents-together"></a>
## 結合 UI 字串與文件

在一個設定檔中啟用這兩項功能，以便在單次執行中處理 UI 字串和文件：

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

<a id="fewer-locales-for-documents"></a>
## 為文件使用較少的語系

在一個區塊上使用 `docs[].targetLocales`，可將該區塊的檔案翻譯成比 UI 更小的語系子集。有效的文件語系是所有區塊的聯集：

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

<a id="mixed-documentation-config"></a>
## 混合式說明文件設定

您可以在同一個設定檔中結合多個說明文件管線，方法是在 `docs` 中新增多個項目。當專案同時擁有 Docusaurus 網站 (`docsOutput.style = "docusaurus"`) 和根層級的 markdown 檔案（例如帶有 `docsOutput.style = "flat"` 的儲存庫 README）時，這是一種常見的設定，這些檔案應翻譯並使用帶有語系後綴的檔名。

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

- UI 字串會從 `src/` 擷取並翻譯至 `public/locales/`。
- 第一個 docs 區塊會將 markdown 從 `docs-site/docs/` 翻譯至 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`（本地化的說明文件頁面）。
- 在設定 `docs[].docusaurusCatalogDir` 並啟用 `features.translateDocs` 的情況下，同一個區塊也會將 `docs-site/i18n/en/` 下的 Docusaurus 外殼 JSON 翻譯到每個目標語系資料夾中：包含導覽列、頁尾和主題/外掛程式目錄，但不包含 MDX 內文。
- 第二個 docs 區塊會將 `README.md` 翻譯成 `translated-docs/` 下帶有語系後綴的檔案 (`docsOutput.style = "flat"`)。
- 所有文件區塊都共用 `cacheDir`，因此未變更的區段會在多次執行時重複使用，以減少 API 呼叫和成本。

下一步：回到 [快速入門](/zh-Hant/guide/quick-start)，或參閱 [設定](/zh-Hant/reference/configuration) 以取得完整的結構描述。
