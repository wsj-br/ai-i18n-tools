<a id="what-is-ai-i18n-tools"></a>
# 什麼是 ai-i18n-tools？

您的應用程式、網站、說明文件網站或儲存庫 README 只有一種語言，而您想要支援更多語言。該語言是 `sourceLocale`，而且可以是任何語言。在這些指南中，英文是個常見的例子。ai-i18n-tools 會尋找文字，使用您選擇的 LLM 供應商模型進行翻譯，並寫入專案已載入的檔案。它會快取每個結果，因此重新執行時只會將新的或變更的文字傳送給模型。

<a id="what-you-do-and-what-the-tool-does"></a>
## 您與工具的分工

| 您 | 工具 |
| --- | --- |
| 挑選語言、供應商以及要嘗試的模型 | 擷取文字、進行翻譯、驗證結果，並寫入目錄或頁面 |
| 讓面向使用者的文字對工具可見：應用程式碼中的 `t()` 呼叫、網站框架自身的 i18n，或 README 中的語言清單標記 | 快取翻譯並在每次重新執行時重複使用 |
| 將結果接入應用程式、網站的路由，或 README 的語言列 | 顯示進度並讓您在儀表板中檢閱翻譯 |

此工具不會重寫您的原始碼。提供了用於包裝步驟的編碼代理提示。它不會安裝 i18next 或您網站框架的 i18n，也不會建置您的語言切換器，儘管為此提供了執行階段輔助程式。

<a id="where-do-i-start"></a>
## 我該從何開始？

逐步教學分組在 [為您的專案新增 i18n](/zh-Hant/guide/add-i18n-to-your-project) 中，其中包含共用設定以及每種專案的專屬頁面。請挑選一列：

| 您有 | 從這裡開始 |
| --- | --- |
| 原始碼中帶有純文字的 JS/TS 應用程式 (React、Next.js、Node、CLI) | [為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js) |
| 一個 Python 應用程式 (Streamlit、FastAPI、Flask、Django、gettext、桌面) | [為 Python 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-python) |
| 一個網站或文件網站 (VitePress、Docusaurus、Starlight、Nextra、Fumadocs、Astro、純 HTML) | [為網站或文件網站新增 i18n](/zh-Hant/guide/add-i18n-to-website) |
| 一個儲存庫 README 和其他 Markdown 檔案，通常與應用程式放在一起 | [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme) |
| 獨立的巢狀 JSON 語系檔案 | [JSON](/zh-Hant/guide/json) |
| 帶有文字標籤的 SVG 圖表 | [SVG 翻譯](/zh-Hant/guide/svg-translation/) |
| Intlayer 字典 (移出 Intlayer) | [從 Intlayer 遷移](/zh-Hant/guide/migrating-from-intlayer) |
| Intlayer 字典 (保留 Intlayer，就地翻譯) | [就地翻譯 Intlayer](/zh-Hant/guide/translating-intlayer) |

<a id="how-it-works"></a>
## 運作方式

1. 安裝 CLI 並設定您的供應商 API 金鑰：[安裝](/zh-Hant/guide/installation)。
2. 執行 `init` 以寫入 `ai-i18n-tools.config.json`：[快速入門](/zh-Hant/guide/quick-start)。
3. 準備專案：將字串包裝在 `t()` 中、啟用您網站框架的 i18n，或將語言清單標記新增至 README。
4. 執行 `sync`。它會擷取文字，翻譯新的內容，並寫入輸出。
5. 在您的應用程式或網站中載入輸出、新增語言切換器，並在原始碼變更時重新執行 `sync`。

<a id="translation-modes"></a>
## 翻譯模式

在底層，此工具執行四個管線。您的設定會啟用您需要的管線，而 `sync` 會依序執行它們。

- UI 字串 — 從 JS/TS 和 Python 原始碼中擷取 `t("…")` 和 `_()` 呼叫 (以及類似的標記，包含 GNU gettext)，並寫入每個語系的扁平 JSON 或 `.po` / `.mo` 目錄。指令：`extract`、`translate-ui`。指南：[UI 字串](/zh-Hant/guide/ui-strings/)。Python：[Python 應用程式](/zh-Hant/guide/ui-strings/python)。
- 文件 — 翻譯列在 `docs[].contentPaths` 中的 Markdown、MDX 和 `.astro` 頁面。適用於 VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro 及其他靜態文件網站，以及儲存庫 README (`flat` 的 `docsOutput.style`)。指令：`translate-docs`。指南：[文件](/zh-Hant/guide/documents/) 和 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。
- JSON — 翻譯在頂層 `json[]` 中定義的巢狀 JSON 語系套件 (主題標籤、i18n 覆寫、不在原始碼中的應用程式文案)。指令：`translate-json`。指南：[JSON](/zh-Hant/guide/json)。
- SVG — 翻譯 SVG 插圖 (`<text>`、`<title>`、`<desc>`) 內的可見文字，並為每個語系寫入一個輸出檔案。與文件翻譯分開。指令：`translate-svg`。指南：[SVG 翻譯](/zh-Hant/guide/svg-translation/)。

許多專案會結合多種模式。常見的組合是 UI 字串加上儲存庫的 README。像 VitePress 這樣的文件網站是另一種常見的組合。請參閱 [結合管線](/zh-Hant/guide/combining-pipelines) 和 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。

<a id="examples"></a>
## 範例

此儲存庫在 `examples/` 下提供了可執行的範例專案，每個專案都有自己的設定、已提交的語系輸出和 README。您可以在沒有 API 金鑰的情況下探索已翻譯的檔案；但重新執行翻譯則需要提供者金鑰。

| 如果您有 | 範例 |
| --- | --- |
| JS/TS 應用程式 | [console-app](/zh-Hant/examples#console-app), [nextjs-app](/zh-Hant/examples#nextjs-app) |
| 應用程式旁的儲存庫 README | [console-app](/zh-Hant/examples#console-app), [nextjs-app](/zh-Hant/examples#nextjs-app) |
| Python 應用程式 | [python-streamlit](/zh-Hant/examples#python-streamlit), [python-fastapi](/zh-Hant/examples#python-fastapi), [python-gettext](/zh-Hant/examples#python-gettext) |
| 文件網站 | [docusaurus-docs](/zh-Hant/examples#docusaurus-docs), [vitepress-docs](/zh-Hant/examples#vitepress-docs), [astro-docs](/zh-Hant/examples#astro-docs) |
| 網站或純 HTML | [astro-website](/zh-Hant/examples#astro-website), [plain-html](/zh-Hant/examples#plain-html) |

請參閱 [範例](/zh-Hant/examples) 以取得完整清單和 `npx degit` 複製指令。

<a id="next-steps"></a>
## 後續步驟

1. [安裝](/zh-Hant/guide/installation) — 安裝 npm 套件，或為 Python 專案下載[獨立可執行檔](/zh-Hant/guide/installation#standalone-executables)，並設定您的供應商 API 金鑰。
2. [快速入門](/zh-Hant/guide/quick-start) — 建立設定檔範本並執行您的第一次翻譯。
3. [LLM 供應商](/zh-Hant/guide/providers-and-models) — 選擇供應商、API 金鑰和 `-P` 覆寫。
4. [AI 模型](/zh-Hant/guide/ai-models) — 使用 `suggest-models` 或儀表板的 **模型** 標籤頁為候選清單排序，並保留多個模型，以便在翻譯失敗時可以嘗試下一個模型。
