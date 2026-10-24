<a id="integrations"></a>
# 整合

針對文件網站、Astro 專案與 Python 應用程式的框架專屬指南。文件整合使用 [Documents](/zh-Hant/guide/documents/) 管線 (`translate-docs` / `sync`) 來處理頁面內容；Shell 字串（導覽、側邊欄、主題）在註明處亦由同一管線處理，而非透過獨立的 [JSON](/zh-Hant/guide/json) 管線。Python 應用程式則使用 [UI strings](/zh-Hant/guide/ui-strings/python) 管線 (`extract` / `translate-ui`)。

<a id="which-guide-to-read"></a>
## 閱讀哪份指南

| 你的網站 | 初始化範本 | 從這裡開始 |
| --- | --- | --- |
| Astro Starlight 或純 Astro | `ui-starlight` / 混合 UI 字串 | [Astro](/zh-Hant/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/zh-Hant/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/zh-Hant/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/zh-Hant/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/zh-Hant/guide/integrations/fumadocs) |
| Python (Streamlit, FastAPI, Flask, Django, gettext, 桌面應用) | `ui-python` / `ui-python-gettext` / `ui-python-flask` / `ui-python-django` | [Python](/zh-Hant/guide/integrations/python) |

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
