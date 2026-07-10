<a id="what-is-ai-i18n-tools"></a>
# 什麼是 ai-i18n-tools？

ai-i18n-tools 是一個命令列工具和工具包，可協助您使用偏好的 LLM 供應商翻譯應用程式和文件。您可以透過單一設定檔控制所有內容，選擇要啟用哪些翻譯功能。使用「sync」命令一次執行您需要的模式。

<a id="translation-modes"></a>
## 翻譯模式

- **UI 字串** — 從 JS/TS 原始碼中擷取 `t("…")` 呼叫（及類似標記），為每個語系寫入扁平的 JSON 檔案，供 i18next 或靜態查詢使用。指令：`extract`、`translate-ui`。指南：[UI 字串](/zh-Hant/guide/ui-strings/)。
- **文件** — 翻譯列於 `docs[].contentPaths` 中的 Markdown、MDX 與 `.astro` 頁面。支援 VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro 及其他靜態文件網站。指令：`translate-docs`。指南：[文件](/zh-Hant/guide/documents/)。
- **JSON** — 翻譯定義於頂層 `json[]` 中的巢狀 JSON 語系套件（主題標籤、i18n 覆寫、不在原始碼中的應用程式文案）。指令：`translate-json`。指南：[JSON](/zh-Hant/guide/json)。
- **SVG** — 翻譯 SVG 插圖（`<text>`、`<title>`、`<desc>`）中的可見文字，並為每個語系寫入一個輸出檔案。與文件翻譯分開 — `translate-docs` 不會修改 SVG 資產。指令：`translate-svg`。指南：[SVG 翻譯](/zh-Hant/guide/svg-translation/)。

所有四種模式都使用作用中的 [LLM 供應商](/zh-Hant/guide/providers-and-models)，共用相同的設定檔，並重複使用 SQLite 快取，因此重新執行只會將新的或變更的文字傳送給模型。

<a id="which-should-i-use"></a>
## 我應該使用哪一個？

| 您的內容 | 模式 | 命令 |
| --- | --- | --- |
| 原始碼使用 `t()` 或 HTML `data-i18n` 標記 | UI 字串 | `extract` / `translate-ui` |
| 本地化頁面或文件網站 | 文件 | `translate-docs` |
| 獨立的巢狀 JSON 地區設定檔案 | JSON | `translate-json` |
| 帶有 SVG 標籤的圖表或插圖 | SVG | `translate-svg` |

許多專案結合了多種模式 — 例如，VitePress 網站的 UI 字串加上文件，或帶有插圖指南的文件加上 SVG。請參閱 [快速入門](/zh-Hant/guide/quick-start) 以取得腳手架範本，並參閱 [設定](/zh-Hant/reference/configuration) 以取得完整的設定架構。

<a id="examples"></a>
## 範例

儲存庫在 `examples/` 下提供了可執行的範例專案 — 每個專案都有自己的設定、已提交的地區設定輸出和 README。您無需 API 金鑰即可瀏覽翻譯檔案；重新執行翻譯需要供應商金鑰（請參閱 [供應商和模型](/zh-Hant/guide/providers-and-models)）。

| 範例 | 顯示內容 |
| --- | --- |
| [console-app](/zh-Hant/examples#console-app) | 最小的端到端應用程式：`t()` UI 字串加上 README 翻譯 |
| [nextjs-app](/zh-Hant/examples#nextjs-app) | Next.js UI、複數、SVG、巢狀 Docusaurus 文件、扁平 README、儀表板 |
| [docusaurus-docs](/zh-Hant/examples#docusaurus-docs) | 獨立 Docusaurus 文件網站 |
| [astro-website](/zh-Hant/examples#astro-website) | Astro 行銷網站：全頁 HTML 翻譯加上 `t()` 字串 |
| [astro-docs](/zh-Hant/examples#astro-docs) | Astro Starlight 文件網站 |
| [vitepress-docs](/zh-Hant/examples#vitepress-docs) | VitePress 文件加上主題目錄 |
| [nextra-docs](/zh-Hant/examples#nextra-docs) | Nextra 文件加上 `_meta.ts` 側邊欄標籤與主題字典 |
| [fumadocs-docs](/zh-Hant/examples#fumadocs-docs) | Fumadocs 文件，加上 `meta.json` 側邊欄標籤與 UI 目錄 |
| [multi-provider](/zh-Hant/examples#multi-provider) | 比較同一文件上的 LLM 供應商 |
| [test-markdown](/zh-Hant/examples#test-markdown) | Markdown 管線壓力測試（CJK、天城文、邊緣案例） |

請參閱 [範例](/zh-Hant/examples) 以取得 `npx degit` 複製命令和選擇指南。

<a id="next-steps"></a>
## 後續步驟

1. [安裝](/zh-Hant/guide/installation) — 安裝套件並設定您的供應商 API 金鑰。
2. [快速入門](/zh-Hant/guide/quick-start) — 建立設定並執行您的第一次翻譯。
3. [供應商和模型](/zh-Hant/guide/providers-and-models) — 選擇供應商、模型備用鏈和 `-P` 覆寫。
