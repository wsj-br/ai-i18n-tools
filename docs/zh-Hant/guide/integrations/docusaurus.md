<a id="docusaurus-integration"></a>
# Docusaurus 整合

將 `init -t ui-docusaurus` 和 `docsOutput.style: "docusaurus"` 用於 [Docusaurus](https://docusaurus.io/) 文件網站。預設會使用 `docs[]` 區塊和 `docusaurusCatalogDir`，以便 `translate-docs` 可以透過一個指令翻譯頁面 Markdown 和 Docusaurus Shell JSON。

另請參閱[文件](/guide/documents/)、可執行的[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app)示範（Next.js 應用程式加上巢狀`docs-site/`），以及[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site)以取得專注於 Docusaurus 的逐步解說。

<a id="quick-start"></a>
## 快速入門

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # Docusaurus build (project-specific script)
```

當您同時翻譯文件頁面和網站外觀（導覽列、頁尾、主題字串）時，請啟用 `features.translateDocs` 並設定 `docs[].docusaurusCatalogDir`。當您升級 `@docusaurus/*` 或變更導覽列/頁尾/主題標籤時，請在您的 Docusaurus 專案中執行 `docusaurus write-translations` — 然後重新執行 `translate-docs` 或 `sync`，以便將 Shell JSON 翻譯成每個地區設定資料夾。

<a id="page-layout"></a>
## 頁面佈局

英文 Markdown 和 MDX 位於您的 Docusaurus `docs/` 資料夾下（例如 `docs-site/docs/`）。翻譯後的副本會寫入每個地區設定的外掛程式內容樹中：

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

配置一個 `docs[]` 區塊：

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

將 `contentPaths` 指向您的英文 `.md` / `.mdx` 檔案和目錄。將 `docsRoot` 設定為 Docusaurus 用作其內容根目錄的相同資料夾。將 `outputDir` 設定為 `i18n/` 下每個地區設定資料夾的父級。

連接 Docusaurus [國際化](https://docusaurus.io/docs/i18n/introduction)：讓 `targetLocales` 在 `ai-i18n-tools.config.json` 中與 `docusaurus.config.js` 中的 `locales` 陣列保持一致。每個 `localeConfigs[locale].path` 必須與 `i18n/` 下的資料夾名稱相符（例如 `path: "fr"` 對於 `i18n/fr/`）。

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

<a id="framework-shell-translation"></a>
## 框架外殼翻譯

| 框架 | Shell / 主題字串 | 管道 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 目錄 (`{ message, description }`) | 文件 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主題/導航/側邊欄目錄 | 文件——`docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 側邊欄標籤 | 文件——自動時 `style: "nextra"` + `translate-docs` |
| Nextra | 主題字典 `.ts` | 文件——`docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 側邊欄標籤 | 文件 — 當 `style: "fumadocs"` + `translate-docs` 時自動處理 |
| Fumadocs | UI 覆寫目錄 | 文件 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 內建 UI 字串（多種語系）；無額外外殼管線 | 文件 — `translate-docs`（僅限頁面） |

請**勿**將框架外殼/主題字串放入 `json[]` — 該管線用於無關的應用程式語言包。請參閱 [VitePress 整合](/guide/integrations/vitepress)、[Nextra 整合](/guide/integrations/nextra) 與 [Fumadocs 整合](/guide/integrations/fumadocs) 以了解其他框架模式。

<a id="example-project"></a>
## 範例專案

[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — 英文來源位於 `docs/`，已提交的翻譯位於 `i18n/<locale>/docusaurus-plugin-content-docs/current/` 下，以及已翻譯的 Shell JSON。在連接埠 3040 上執行 `pnpm start` 進行開發；使用 `pnpm run start:fr`（及類似指令）在開發模式中預覽單一地區設定。
