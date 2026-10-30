<a id="docusaurus-integration"></a>
# Docusaurus 整合

將 `init -t ui-docusaurus` 和 `docsOutput.style: "docusaurus"` 用於 [Docusaurus](https://docusaurus.io/) 文件網站。預設會使用 `docs[]` 區塊和 `docusaurusCatalogDir`，以便 `translate-docs` 可以透過一個指令翻譯頁面 Markdown 和 Docusaurus Shell JSON。

另請參閱[文件](/zh-Hant/guide/documents/)、可執行的 [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) 示範，以及 [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app)，以了解結合了 Next.js 應用程式、巢狀 Docusaurus 文件、扁平 README 與 SVG 資產的範例。

<a id="quick-start"></a>
## 快速開始

```bash
ai-i18n-tools init -t ui-docusaurus -P openai
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # or: cd examples/docusaurus-docs && pnpm build
```

當您翻譯文件頁面和網站外殼字串（導覽列、頁尾、主題字串）時，請啟用 `features.translateDocs` 並設定 `docs[].docusaurusCatalogDir`。在您的 Docusaurus 專案中執行 `docusaurus write-translations`，當您升級 `@docusaurus/*` 或更改導覽列/頁尾/主題標籤時 — 然後重新執行 `translate-docs` 或 `sync`，以便將外殼 JSON 翻譯到每個語系資料夾中。

<a id="page-layout"></a>
## 頁面版面

英文 Markdown 和 MDX 位於您的 Docusaurus `docs/` 資料夾下（例如 `docs-site/docs/`）。翻譯後的副本會寫入每個地區設定的外掛程式內容樹中：

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

設定一個 `docs[]` 區塊：

```json
{
  "contentPaths": ["docs-site/docs/"],
  "outputDir": "docs-site/i18n",
  "docusaurusCatalogDir": "docs-site/i18n/en",
  "addFrontmatter": true,
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "docs-site/docs"
  }
}
```

將 `contentPaths` 指向以 `sourceLocale` 編寫的 `.md` / `.mdx` 檔案與目錄。該語言可以是任何語言。將 `docsRoot` 設定為 Docusaurus 用作其內容根目錄的相同資料夾。將 `outputDir` 設定為 `i18n/` 下各語系資料夾的父層。

連接 Docusaurus [國際化](https://docusaurus.io/docs/i18n/introduction)：讓 `targetLocales` 在 `ai-i18n-tools.config.json` 中與 `docusaurus.config.js` 中的 `locales` 陣列保持一致。每個 `localeConfigs[locale].path` 必須與 `i18n/` 下的資料夾名稱相符（例如 `path: "fr"` 對於 `i18n/fr/`）。

<a id="enable-i18n-in-an-existing-site"></a>
### 在現有網站中啟用 i18n

首次設定會使用 [新增 i18n 到網站或文件網站](/zh-Hant/guide/add-i18n-to-website#run-the-agent-prompt) 上的提示。下方的檢查清單是相同的手動操作。

- 當 URL 路徑應與語系代碼不同時，在 `docusaurus.config.js` 中新增 `i18n` 區塊：`defaultLocale`、`locales` 及 `localeConfigs[locale].path`。
- 執行 `docusaurus write-translations` 以確保 `i18n/<defaultLocale>/` 存在，然後將 `docusaurusCatalogDir` 指向該資料夾並執行 `sync`。
- `src/pages` 與 `src/components` 中的自訂 React 不是 markdown。請使用來自 `@docusaurus/Translate` 的 `<Translate>` 或 `translate()` 標記使用者可見的文案，以便 `write-translations` 能將其收集到 `code.json` 中。訊息必須是靜態字串。`write-translations` 會寫入 `i18n/<locale>/code.json`；設定 `docusaurusCatalogDir` 後，`translate-docs` 會將該 JSON 與其餘的 shell 訊息目錄一併翻譯。ai-i18n-tools 不會掃描那些 JSX 樹狀結構來尋找 `t()`。

<a id="shell-strings-write-translations"></a>
## Shell 字串 (write-translations)

Docusaurus 導覽列、頁尾、搜尋佔位符以及其他主題/外掛程式標籤不會從 Markdown 中提取。在您的 Docusaurus 專案中執行 `docusaurus write-translations` 以在預設地區設定資料夾（通常是 `i18n/en/`）下產生 JSON 目錄。然後將 `docs[].docusaurusCatalogDir` 指向該資料夾：

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus pages + shell JSON",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

當設定 `docusaurusCatalogDir` 且啟用 `features.translateDocs` 時，`translate-docs` 會翻譯兩者：

- **文件頁面** — 從 `contentPaths` 到 `i18n/<locale>/docusaurus-plugin-content-docs/current/` 的 Markdown/MDX
- **Shell JSON** — 從 `i18n/en/` 到同級地區設定資料夾的導覽列、頁尾和主題/外掛程式目錄

請勿將 Docusaurus Shell JSON 放入 `json[]`；請改用 `docs[].docusaurusCatalogDir` 和文件。

<a id="example-project"></a>
## 範例專案

[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — 英文來源位於 `docs/`，提交的翻譯位於 `i18n/<locale>/docusaurus-plugin-content-docs/current/`，以及翻譯後的 shell JSON。在連接埠 3100 上執行 `pnpm start`（建置 + 服務）以使語系下拉選單正常運作；使用 `pnpm dev` 進行僅限英文的熱重載。

如需相同儲存庫佈局中的 UI 字串、SVG 翻譯與扁平 README，請參閱 [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app)（連接埠 3040 上的巢狀 `docs-site/`）。
