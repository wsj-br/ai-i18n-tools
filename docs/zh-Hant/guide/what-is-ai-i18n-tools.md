<a id="what-is-ai-i18n-tools"></a>
# 什麼是 ai-i18n-tools？

`ai-i18n-tools` 套件提供三種翻譯介面：

- **UI 字串**：從任何 JS/TS 原始碼中提取 `t("…")` 呼叫，透過作用中的 [LLM 供應商](/guide/providers-and-models) 進行翻譯，並寫入準備好用於 i18next 的平面每地區設定 JSON 檔案。
- **文件**：透過 `translate-docs` 翻譯 `docs[].contentPaths` 中列出的 **markdown、MDX 和 `.astro` 頁面**，並具有智慧快取。當啟用 `features.translateDocs` 時，可選的 **Docusaurus 目錄 JSON** (`docs[].docusaurusCatalogDir`，來自 `docusaurus write-translations`) 會在同一命令中翻譯 — 網站外觀 (導覽列、頁尾、主題字串)，而不是 `docs/` 中的散文。**VitePress** 頁面主體使用相同的 `docs[]` 管道；導覽/側邊欄/頁尾標籤使用 JSON (`json[]` / `translate-json`) — 請參閱 [VitePress 整合](/guide/vitepress-integration)。
- **JSON**：透過頂層 `json[]`、`features.translateJson` 和 `translate-json` 翻譯任意巢狀 JSON 捆綁包 (例如 `src/i18n/en/translation.json`) — 適用於將 UI 內容保存在每地區設定 JSON 檔案中而不是原始碼中的 `t()` 的網站。
- **工具 UI (內建)** — CLI 說明、日誌和翻譯儀表板以多種語言提供；這與翻譯**您的**應用程式的 UI 字串或文件是分開的。

**SVG** 資產使用 `features.translateSVG`、頂層 `svg` 區塊和 `translate-svg` (請參閱 [CLI 參考](/reference/cli-commands))。

**我應該使用哪一個？**

- 透過 `t()` 在原始碼中面向使用者的字串 → UI 字串 (`extract` / `translate-ui`)。
- 本地化頁面、Docusaurus shell JSON 或 VitePress markdown → 文件 (`translate-docs`)。
- VitePress 主題 JSON 或其他獨立的巢狀地區設定檔案 → JSON (`translate-json`)。

所有這三者都使用作用中的 LLM 供應商（請參閱 [供應商和模型](/guide/providers-and-models)) 並共用一個設定檔。

<a id="next-steps"></a>
## 後續步驟

1. [安裝](/guide/installation) — 安裝套件並設定您的供應商 API 金鑰。
2. [快速入門](/guide/quick-start) — 建立設定並執行您的第一次翻譯。
3. [供應商和模型](/guide/providers-and-models) — 選擇供應商、模型備用鏈和 `-P` 覆寫。
