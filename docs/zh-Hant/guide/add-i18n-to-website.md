<a id="add-i18n-to-a-website-or-docs-site"></a>
# 為網站或文件網站新增 i18n

本頁面適用於單一語言的文件網站 (Markdown 或 MDX) 或行銷與靜態網站 (Astro 網站或純 HTML)。此工具會使用您 LLM 供應商的模型來翻譯您的頁面內容，並為每種語言寫入一份本地化副本。您的網站框架負責提供這些副本及語言切換器。

若應用程式的 UI 字串存於 `t()` 呼叫中，請改用 [為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js) 或 [為 Python 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-python)。

<a id="install-and-choose-a-provider"></a>
## 您的情況是？

| 你的網站 | 初始化範本 | 從這裡開始 |
| --- | --- | --- |
| Astro Starlight 或純 Astro | `ui-starlight` / 混合 UI 字串 | [Astro](/zh-Hant/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/zh-Hant/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/zh-Hant/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/zh-Hant/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/zh-Hant/guide/integrations/fumadocs) |
| 純 HTML 頁面 | `ui-plain-html` 或 `docs-plain-html` | [純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html) |
| 沒有網站框架，只有 README 和 Markdown 檔案 | `docs-markdown`，或任何範本加上 `--with-readme` | [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme) |

<details class="agent-prompt">
<summary>Agent 提示</summary>

- Astro Starlight：僅註解。Astro `t()` 檔案：[JS/TS 提示](/zh-Hant/guide/add-i18n-to-js#run-the-agent-prompt)（略過 i18next）。
- Docusaurus：僅註解（`<Translate>` 是 Docusaurus 自己的 API）。
- VitePress：[佈景主題目錄提示](/zh-Hant/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)。
- Nextra：[字典提示](/zh-Hant/guide/integrations/nextra#agent-prompt-dictionary-and-routes) 和 [混合 `t()` 提示](/zh-Hant/guide/integrations/nextra#optional-t-for-app-react-hybrid)。
- Fumadocs：[UI 目錄提示](/zh-Hant/guide/integrations/fumadocs#agent-prompt)。
- README 和 Markdown 檔案：[README 提示](/zh-Hant/guide/add-i18n-to-readme#run-the-agent-prompt)。

</details>

<a id="initialise-the-project"></a>
## 步驟

每個框架的作法大同小異；詳細資訊請見上方連結的框架指南。

1. 安裝 CLI 並設定 API 金鑰：[安裝](/zh-Hant/guide/installation)、[供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key)。
2. 建立骨架：`ai-i18n-tools init -t <template> -P <provider>`。
3. 設定 `sourceLocale`、`targetLocales` 和 `docs[].contentPaths`（以您的來源語言撰寫的頁面和資料夾）。`sourceLocale` 可以是任何語言。框架指南會顯示正確的 `docsOutput.style`。
4. 啟用您框架自己的 i18n，以便它提供並連結本地化頁面。每個指南都有一個「在現有網站中啟用 i18n」的章節：[VitePress](/zh-Hant/guide/integrations/vitepress#enable-i18n-in-an-existing-site)、[Docusaurus](/zh-Hant/guide/integrations/docusaurus#enable-i18n-in-an-existing-site)、[Nextra](/zh-Hant/guide/integrations/nextra#enable-i18n-in-an-existing-site)、[Fumadocs](/zh-Hant/guide/integrations/fumadocs#enable-i18n-in-an-existing-site)、[Astro](/zh-Hant/guide/integrations/astro#enable-i18n-in-an-existing-site)。
5. 執行 `ai-i18n-tools sync`（或 `translate-docs`），然後建置網站。
6. 在瀏覽器中檢查本地化路由。框架自己的語系下拉式選單就是切換器。對於像 README 這樣的單一 markdown 檔案，請使用 [languageListBlock](/zh-Hant/guide/documents/language-switcher) 新增一個連結列。

<a id="run-the-agent-prompt"></a>
## 翻譯的內容

頁面主體一律會通過 [文件](/zh-Hant/guide/documents/) 管線處理。框架外觀（導覽、側邊欄、佈景主題標籤）會在框架支援的情況下，於同一次執行中處理，而不是透過獨立的 [JSON](/zh-Hant/guide/json) 管線。

| 框架 | Shell 和佈景主題字串 | 方法 |
| --- | --- | --- |
| Docusaurus | `write-translations` 目錄 (`{ message, description }`) | `docs[].docusaurusCatalogDir` 加上 `translate-docs` |
| VitePress | 佈景主題、導覽和側邊欄目錄 | `docsOutput.vitepressThemeCatalog` 加上 `translate-docs` |
| Nextra | `_meta.ts` 側邊欄標籤 | 使用 `style: "nextra"` 自動處理 |
| Nextra | 佈景主題字典 `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json` 側邊欄標籤 | 使用 `style: "fumadocs"` 自動處理 |
| Fumadocs | UI 覆寫目錄 | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | 內建多種語系的 UI 字串 | 僅限頁面 |

`translate-docs` 不會翻譯圖片與螢幕擷取畫面。關於特定語系的檔案，請參閱[圖片與螢幕擷取畫面](/zh-Hant/guide/images-and-screenshots/)。

<a id="review-the-result"></a>
## 純 HTML

有兩種選項，取決於頁面的應有行為：

- 在瀏覽器中切換語言的單一頁面：使用 `data-i18n*` 屬性標記文字，並使用 UI 字串執行階段 (`ui-plain-html`)。請參閱[純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html)。
- 每個語系一個已翻譯的 HTML 檔案：使用文件管線 (`docs-plain-html`)。請參閱[HTML 頁面](/zh-Hant/guide/documents/html-pages)。

一個檔案屬於一個路徑。

<a id="choose-models-and-translate"></a>
## 情況不同？

- 應用程式 UI 字串：[為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js) 或 [為 Python 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-python)。
- 網站旁的儲存庫 README，或沒有網站框架的 Markdown 檔案：[為您的 README 與 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。`init … --with-readme` 會在網站範本旁新增該區塊。
- 獨立的巢狀語系 JSON：[JSON](/zh-Hant/guide/json)。
- 同時翻譯網站與應用程式字串：[結合管線](/zh-Hant/guide/combining-pipelines)。

關於共用選項與各框架差異的參考資料：[整合](/zh-Hant/guide/integrations/)。
