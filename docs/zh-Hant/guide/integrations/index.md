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

每個 `init -t ui-*` 範本會產生預設的 LLM 提供者區塊（除非您傳入 `-P <provider>`，否則為 `openrouter`）。在 `translate-docs` 或 `sync` 之前，如有需要請設定 `provider` / `providers` 並設定對應的 API 金鑰 — 請參閱[提供者與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key)。

請參閱[框架外殼翻譯](#framework-shell-translation)以取得跨框架比較。下方每個連結的指南皆涵蓋該框架的設定。

<a id="framework-shell-translation"></a>
## 框架外殼翻譯

| 框架 | 外殼/主題字串 | 管線 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 目錄（`{ message, description }`） | 文件 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 主題/導覽/側邊欄目錄 | 文件 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 側邊欄標籤 | 文件 — 當 `style: "nextra"` + `translate-docs` 時自動 |
| Nextra | 主題字典 `.ts` | 文件 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 側邊欄標籤 | 文件 — 當 `style: "fumadocs"` + `translate-docs` 時自動 |
| Fumadocs | UI 覆寫目錄 | 文件 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 內建 UI 字串（多語系）；無額外外殼管線 | 文件 — `translate-docs`（僅頁面） |

請**勿**將框架外殼/主題字串放入 `json[]` — 該管線適用於無關的應用程式語言套件。各框架的設定詳情位於從[該閱讀哪份指南](#which-guide-to-read)連結的指南中。

<a id="runnable-examples"></a>
## 可執行範例

| 框架 | 範例儲存庫 |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| 純 Astro 網站 | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
