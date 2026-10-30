<a id="add-i18n-to-your-project"></a>
# 為您的專案新增 i18n

本節是一系列適用於目前只有一種語言的專案的逐步指南。從這裡開始。以下每個頁面都會介紹一種專案，從設定到第一個翻譯檔案。[開始使用](/zh-Hant/guide/what-is-ai-i18n-tools) 涵蓋了該工具是什麼、安裝選項，以及提供者和模型。您可以無需先閱讀這些頁面即可開啟逐步指南。

<a id="what-you-do-and-what-the-tool-does"></a>
## 您與工具的分工

| 您 | 工具 |
| --- | --- |
| 挑選要試用的語言、供應商和模型 | 擷取文字、進行翻譯、檢查結果，並寫入目錄或頁面 |
| 讓工具能看見文字：在應用程式碼中使用 `t()`、您網站框架的 i18n，或是在 README 中使用語言列表標記 | 快取每次翻譯，並在下次執行時重複使用 |
| 載入檔案並檢查其中一種語言 | 顯示進度，並讓您在 [翻譯儀表板](/zh-Hant/guide/translation-dashboard/) 中檢閱用字 |

逐步教學會說明哪些原始碼編輯需要由您完成。對於那些機械式的編輯，我們也提供了編碼代理提示。CLI 會寫入字詞庫和翻譯檔案。它不會安裝 i18next 或您網站框架的 i18n。

<a id="shared-setup"></a>
## 共通設定

每個逐步教學都遵循相同的順序。您所選的頁面會提供詳細資訊。

1. 安裝 CLI 並設定您的供應商 API 金鑰。Ollama 無需金鑰。[安裝](/zh-Hant/guide/installation) 和 [供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key)。
2. 執行 `init`，並使用該頁面指定的範本。這會寫入 `ai-i18n-tools.config.json`。
3. 準備專案，讓工具能夠看到文字。使用該頁面的代理程式提示，或同一頁面上的手動步驟。
4. 執行 `ai-i18n-tools sync`，然後執行 `ai-i18n-tools status`。
5. 載入輸出，檢查一個目標語言，並在來源變更時重新執行 `sync`。快取只會將新增或變更的文字傳送給模型。

<a id="pages-in-this-section"></a>
## 本節頁面

| 您擁有 | 頁面 | 該頁面涵蓋的內容 |
| --- | --- | --- |
| 一個 JS/TS 應用程式 (React、Next.js、Node、CLI)，其按鈕和訊息仍為純文字 | [為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js) | 安裝 i18next，新增啟動程式碼，將字面值包裝在 `t()` 中，並新增語言切換器，然後 `extract` 和 `translate-ui` |
| 一個 Python 應用程式 (Streamlit、FastAPI、Flask、桌面、指令碼) | [為 Python 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-python) | 放置 `i18n.py` 輔助程式，包裝 `t()` 或 `_()`，新增語言切換器。CLI 可以從獨立的可執行檔執行，無需安裝 Node.js |
| 一個 Django 應用程式、使用 Flask-Babel 目錄的 Flask，或任何已使用 GNU gettext 的應用程式 | [為 Django / Python gettext 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-django-gettext) | 保留 `gettext`、`{% blocktranslate %}` 和您的 `.po` 檔案。該工具會填入並編譯目錄 |
| 一個文件或行銷網站 (VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro、純 HTML) | [為網站或文件網站新增 i18n](/zh-Hant/guide/add-i18n-to-website) | 使用該頁面的代理程式提示啟用框架的 i18n，然後 `sync` 以翻譯頁面和主題標籤 |
| 一個儲存庫 README 和其他 Markdown 檔案，通常與應用程式放在一起 | [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme) | 每種語言一個檔案 (`translated-docs/README.de.md`)，並在 README 中加入一個語言列。`init --with-readme` 會將該區塊新增至任何範本 |
| 一個儲存庫中包含上述多種類型 | [結合管線](/zh-Hant/guide/combining-pipelines) | 一個設定檔和一個 `sync`。常見的組合是應用程式 UI 字串加上 README |
| Intlayer 字典，且您想保留 Intlayer | [原地翻譯 Intlayer](/zh-Hant/guide/translating-intlayer) | `translate-intlayer` 會填補 `*.content.ts` 內遺失和過時的葉節點 |
| Intlayer 字典，且您正要從 Intlayer 遷移 | [從 Intlayer 遷移](/zh-Hant/guide/migrating-from-intlayer) | `migrate-intlayer` 會從字典植入字詞庫，並將安全的呼叫點重寫為 `t()` |

同時擁有 README 的應用程式，會同時使用應用程式頁面和 README 頁面。同時擁有 README 的網站，則會使用網站頁面，並透過 `init … --with-readme` 處理 README 區塊。

<a id="where-to-go-deeper"></a>
## 深入了解

逐步教學在串接好第一種語言後即告一段落。接下來的內容請參閱參考頁面：

- [UI 字串](/zh-Hant/guide/ui-strings/)、[文件](/zh-Hant/guide/documents/)、[JSON](/zh-Hant/guide/json) 及 [SVG](/zh-Hant/guide/svg-translation/)，一次用於一個管線。
- [整合](/zh-Hant/guide/integrations/)，用於框架外殼字串 (導覽、側邊欄、主題)。
- [快速入門](/zh-Hant/guide/quick-start)，用於指令清單和建議的 `package.json` 指令碼。
- [LLM 供應商](/zh-Hant/guide/providers-and-models)，用於預設集和 API 金鑰。
- [AI 模型](/zh-Hant/guide/ai-models)，用於排名候選清單和備援鏈。
