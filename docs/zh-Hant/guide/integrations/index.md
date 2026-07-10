<a id="integrations"></a>
# 整合

將 ai-i18n-tools 接入文件網站與 Astro 專案的框架專屬指南。每個整合都使用 [Documents](/zh-Hant/guide/documents/) 管線 (`translate-docs` / `sync`) 來處理頁面內容；殼層字串（導覽、側邊欄、主題）會在註明之處於同一管線內處理，而非透過獨立的 [JSON](/zh-Hant/guide/json) 管線。

<a id="which-guide-to-read"></a>
## 閱讀哪份指南

| 你的網站 | 初始化範本 | 從這裡開始 |
| --- | --- | --- |
| Astro Starlight 或純 Astro | `ui-starlight` / 混合 UI 字串 | [Astro](/zh-Hant/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/zh-Hant/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/zh-Hant/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/zh-Hant/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/zh-Hant/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## 共用概念

所有文件框架整合都共用 [Documents](/zh-Hant/guide/documents/) 中所述的相同 `docs[]` 區塊模型。設定 `docsOutput.style` 以符合你的框架 (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, 或 `"astro-starlight"`)。關於輸出資料夾佈局與連結重寫行為，請參閱 [Output layouts](/zh-Hant/guide/documents/output-layouts) 與 [Link rewriting](/zh-Hant/guide/documents/link-rewriting)。

請**勿**將框架殼層或主題字串放入 `json[]` —— 該管線是給無關的應用程式語言包使用的。每個整合頁面都會說明哪些目錄路徑與 CLI 旗標涵蓋了該框架的導覽、側邊欄與主題標籤。

<a id="runnable-examples"></a>
## 可執行範例

| 框架 | 範例儲存庫 |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| 純 Astro 網站 | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
