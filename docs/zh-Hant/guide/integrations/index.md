<a id="integrations"></a>
# 整合

框架整合參考：它們的共通點以及其外殼字串的差異。若要將語言新增至網站，請從 [將 i18n 新增至網站或文件網站](/zh-Hant/guide/add-i18n-to-website) 開始。若為應用程式，請從 [將 i18n 新增至 JS/TS 應用程式](/zh-Hant/guide/add-i18n-to-js) 或 [將 i18n 新增至 Python 應用程式](/zh-Hant/guide/add-i18n-to-python) 開始。若為儲存庫 README 和其他 Markdown 檔案，請從 [將 i18n 新增至您的 README 和 Markdown 文件](/zh-Hant/guide/add-i18n-to-readme) 開始。

文件整合使用 [文件](/zh-Hant/guide/documents/) 管線 (`translate-docs` / `sync`) 來處理頁面內容；在註明之處，外殼字串 (導覽、側邊欄、主題) 會於同一個管線內處理 — 而非透過獨立的 [JSON](/zh-Hant/guide/json) 管線。Python 應用程式使用 [UI 字串](/zh-Hant/guide/ui-strings/python) 管線 (`extract` / `translate-ui`)。

<a id="which-guide-to-read"></a>
## 閱讀哪份指南

選擇表格 (包含每個框架的 init 範本和代理程式提示) 位於 [將 i18n 新增至網站或文件網站](/zh-Hant/guide/add-i18n-to-website#what-do-you-have)。Python 框架：[Python](/zh-Hant/guide/integrations/python)。

<a id="shared-concepts"></a>
## 共用概念

文件框架整合共用 [Documents](/zh-Hant/guide/documents/) 中所述的相同 `docs[]` 區塊模型。請將 `docsOutput.style` 設定為符合您的框架 (`"docusaurus"`、`"vitepress"`、`"nextra"`、`"fumadocs"` 或 `"astro-starlight"`)。關於輸出資料夾配置與連結重寫行為，請參閱 [Output layouts](/zh-Hant/guide/documents/output-layouts) 與 [Link rewriting](/zh-Hant/guide/documents/link-rewriting)。Python 的設定方式則為獨立項目：[Python](/zh-Hant/guide/integrations/python)。

每個 `init -t ui-* -P <provider>` 骨架會寫入該預設的 LLM 供應商區塊。在 `translate-docs` 或 `sync` 之前，請設定對應的 API 金鑰 — 請參閱 [供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key)。

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
| Streamlit | [examples/python-streamlit](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit) |
| Flask | [examples/python-flask](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask) |
| FastAPI | [examples/python-fastapi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi) |
| GNU gettext | [examples/python-gettext](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext) |
